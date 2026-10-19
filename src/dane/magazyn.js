// stan gry: w chmurze (Firestore, na żywo u wszystkich) albo w trybie DEMO (localStorage, gdy brak firebaseConfig)
// reszta aplikacji zna tylko: stan, wczytaj (DEMO), polacz (chmura), zapisz(stan)
import { FRAKCJE } from "./frakcje.js";
import { BOHATEROWIE } from "./bohaterowie.js";
import { ZASOBY } from "./zasoby.js";
import { firebaseConfig } from "../firebase-config.js";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc, FieldPath, deleteField, onSnapshot, writeBatch, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, query, where, orderBy, limit, getCountFromServer } from "firebase/firestore";
import { getDatabase, ref as refRT, onValue, onDisconnect, set as setRT, serverTimestamp as czasRT } from "firebase/database";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export const CHMURA = Boolean(firebaseConfig.apiKey);
export const stan = {}; // jeden wspólny obiekt — moduły go mutują, magazyn go wypełnia i zapisuje

const KLUCZ = "frp-demo";
const WERSJA = 3; // podbij, gdy zmienią się dane startowe — stary zapis DEMO zostanie zastąpiony
const USTAWIENIA = { dniLogow: 30 };
const start = () => structuredClone({ wersja: WERSJA, frakcje: FRAKCJE, bohaterowie: BOHATEROWIE, zasoby: ZASOBY, tury: [], ustawienia: USTAWIENIA, prowincje: {}, npc: {}, akweny: {}, nazwyOsad: {}, pozycjeArmii: {}, pozycjeFlot: {}, cofnijRuchy: null, wojny: [], bitwy: {}, traktaty: {}, kronika: {} });

// --- DEMO ---
function zapisDemo() {
  try {
    const s = JSON.parse(localStorage.getItem(KLUCZ));
    // nowe pole dopisywane do starego zapisu zamiast podbijania WERSJA, żeby nie kasować zmian z DEMO
    if (s?.wersja === WERSJA) { s.zasoby ??= structuredClone(ZASOBY); s.tury ??= []; s.ustawienia ??= { ...USTAWIENIA }; s.prowincje ??= {}; s.npc ??= {}; s.akweny ??= {}; s.nazwyOsad ??= {}; s.pozycjeArmii ??= {}; s.pozycjeFlot ??= {}; s.cofnijRuchy ??= null; s.wojny ??= []; s.bitwy ??= {}; s.traktaty ??= {}; s.kronika ??= {}; return s; }
  } catch {}
  return null;
}
export const wczytaj = () => Object.assign(stan, zapisDemo() || start());
export function resetuj() { try { localStorage.removeItem(KLUCZ); } catch {} return Object.assign(stan, start()); }

// --- chmura ---
// dokumenty: frakcje/{id}, bohaterowie/{id}, gra/stan {zasoby, tury}, gra/prowincje {p: {idProwincji: {wlasciciel, nazwa, opis}}, npc: {id: {nazwa, rodzaj, zwierzchnik | kolor (samodzielny), opis}}, a: {idAkwenu: {nazwa}}}; _nr = kolejność na liście
const app = CHMURA ? initializeApp(firebaseConfig) : null;
// obecność graczy (2026-10-19) w Realtime Database: obecnosc/{uid} = { f: frakcja, on: online, t: czas (ms) }; „offline” zapisuje SERWER przy
// rozłączeniu (onDisconnect — też Alt+F4, awaria, brak sieci), więc są tylko dwa zapisy na sesję. Bez databaseURL w konfiguracji — wyłączone.
const rtdb = app && firebaseConfig.databaseURL ? getDatabase(app) : null;
let koniecObecnosci = () => Promise.resolve(), odpnijPolaczenie = () => {};
export function zglosObecnosc(uid, frakcja) {
  if (!rtdb) return;
  odpnijPolaczenie();   // ponowne zgłoszenie (zmiana państwa) — stary nasłuch połączenia precz
  const moj = refRT(rtdb, `obecnosc/${uid}`), wpis = on => ({ f: frakcja || "", on, t: czasRT() });
  const odpnij = odpnijPolaczenie = onValue(refRT(rtdb, ".info/connected"), s => {   // po każdym (ponownym) połączeniu: najpierw zlecenie „offline” serwerowi, potem „online”
    if (s.val()) onDisconnect(moj).set(wpis(false)).then(() => setRT(moj, wpis(true))).catch(e => console.warn("obecność", e));
  });
  koniecObecnosci = () => { odpnij(); koniecObecnosci = () => Promise.resolve(); return setRT(moj, wpis(false)).catch(() => {}); };
}
export const sluchajObecnosci = cb => rtdb ? onValue(refRT(rtdb, "obecnosc"), s => cb(s.val() || {}), e => { console.warn("obecność", e); cb({}); }) : () => {};
const db = app && initializeFirestore(app, { ignoreUndefinedProperties: true });
const auth = app && getAuth(app);
const ostatnio = new Map(); // ścieżka → JSON ostatnio zapisanego/odebranego dokumentu; zapisujemy tylko różnice
// JSON z posortowanymi kluczami — Firestore oddaje pola w innej kolejności, a porównanie ma być po treści
const json = x => JSON.stringify(x, (k, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : 1)) : v);
// część tajna (etap 4.3): Firestore pilnuje dostępu do CAŁYCH dokumentów, więc tajne dane frakcji leżą osobno:
//   tajne_zasoby/{f}    { stany, zasoby (unikalne z ilościami), tury: [{nr, stany, unikalne}] } — jawne, gdy f.jawne.zasoby
//   tajne_jednostki/{f} { jednostki }                                                         — jawne, gdy f.jawne.jednostki
//   tajne_statusy/{f}   { statusy: {idBohatera: {status, misja}} }                             — jawne, gdy f.jawne.statusy
//   tajne_armie/{f}     { armie: [{id, nazwa, dowodca, pospolity, bohaterowie, oddzialy, cel, przebyte}], cofnij: {nr, armie, pozycje} | null,
//                         floty: [{id, nazwa, dowodca, pospolity, bohaterowie, oddzialy (okręty), pojemnosc?}] (7.8c) } — jawne, gdy f.jawne.armie
//   gra/armie           { a: {idArmii: {f, p, o}}, fl: {idFloty: {f, a: nr akwenu}}, cofnij: {nr, pozycje, przebyte: {idArmii: ile}} | null } — pozycje znaczników armii i flot, jawne (7.1, 7.8c); cofnij = stan sprzed ruchu ostatniej tury
//   tajne_budynki/{f}   { p: {idProwincji: {sloty, zloze}} }                                  — jawne, dopóki f.jawne.budynki !== false (6.4: domyślnie jawne)
//   notatki_gracza/{f}  { tekst } — gracz tej frakcji + GM;  notatki_gm/{f} { tekst } — tylko GM/admin
// W pamięci aplikacja widzi jeden scalony stan; części, których nie wolno czytać, są puste i oznaczone w f._brak / h._brak.
const RODZAJE = ["zasoby", "jednostki", "statusy", "budynki", "armie"];
const TAJNE_POLA_FRAKCJI = ["stany", "zasoby", "jednostki", "budynki", "armie", "floty", "cofnijRozwiazanie", "notatkiGracza", "notatkiGM", "_brak"];
const bez = (o, pola) => Object.fromEntries(Object.entries(o).filter(([k]) => !pola.includes(k)));
let dostep = { gm: true, frakcja: "" }; // kto czyta: ustawiane przez main.js po zalogowaniu (ustawDostep)
const wolnoCzytac = (sciezka, frakcje) => {
  const [kolekcja, id] = sciezka.split("/");
  if (dostep.gm) return true;
  if (kolekcja === "notatki_gm") return false;
  if (id === dostep.frakcja) return true;
  if (kolekcja === "notatki_gracza") return false;
  const r = kolekcja.slice(6), j = frakcje.find(f => f.id === id)?.jawne?.[r]; // tajne_zasoby → zasoby
  return r === "budynki" ? j !== false : Boolean(j);
};
const sciezkiTajne = frakcje => frakcje.flatMap(f => [...RODZAJE.map(r => `tajne_${r}/${f.id}`), `notatki_gracza/${f.id}`, `notatki_gm/${f.id}`])
  .filter(sc => wolnoCzytac(sc, frakcje));

const dokumenty = s => {
  const d = new Map();
  s.frakcje.forEach((f, i) => {
    d.set(`frakcje/${f.id}`, { ...bez(f, TAJNE_POLA_FRAKCJI), _nr: i });
    if (!f._brak?.zasoby) d.set(`tajne_zasoby/${f.id}`, { stany: f.stany || {}, zasoby: f.zasoby || [],
      tury: s.tury.filter(t => t.frakcje?.[f.id]).map(t => ({ nr: t.nr, ...t.frakcje[f.id] })) });
    if (!f._brak?.jednostki) d.set(`tajne_jednostki/${f.id}`, { jednostki: f.jednostki || [] });
    if (!f._brak?.budynki) d.set(`tajne_budynki/${f.id}`, { p: f.budynki || {} });
    if (!f._brak?.armie) d.set(`tajne_armie/${f.id}`, { armie: f.armie || [], cofnij: f.cofnijRozwiazanie || null, floty: f.floty || [] });   // cofnij: armie rozwiązane przy ostatnim zamknięciu tury (7.1e) — tajne jak skład
    if (!f._brak?.statusy) d.set(`tajne_statusy/${f.id}`, { statusy: Object.fromEntries(s.bohaterowie.filter(h => h.frakcja === f.id)
      .map(h => [h.id, { status: h.status || "stolica", misja: h.misja || "" }])) });
    if (!f._brak?.notatkiGracza) d.set(`notatki_gracza/${f.id}`, { tekst: f.notatkiGracza || "" });
    if (!f._brak?.notatkiGM) d.set(`notatki_gm/${f.id}`, { tekst: f.notatkiGM || "" });
  });
  s.bohaterowie.forEach((h, i) => d.set(`bohaterowie/${h.id}`, { ...bez(h, ["status", "misja", "_brak"]), _nr: i }));
  d.set("gra/stan", { zasoby: s.zasoby, tury: s.tury.map(t => ({ nr: t.nr, data: t.data })), ustawienia: s.ustawienia || USTAWIENIA, wojny: s.wojny || [] });   // wojny: [[wł1, wł2]] — jawne (7.1f)
  d.set("gra/prowincje", { p: s.prowincje || {}, npc: s.npc || {}, a: s.akweny || {} });
  d.set("gra/armie", { a: s.pozycjeArmii || {}, fl: s.pozycjeFlot || {}, cofnij: s.cofnijRuchy || null, bitwy: s.bitwy || {} });
  for (const [id, r] of Object.entries(s.raportyBitew || {})) d.set(`bitwy/${id}`, r);
  for (const [id, t] of Object.entries(s.traktaty || {})) d.set(`traktaty/${id}`, t);
  for (const [id, k] of Object.entries(s.kronika || {})) d.set(`kronika/${id}`, k);   // kronika (7.2): { tura, czas, typ, tekst, kraje, tajny, widza } — tajne czytają kraje z „widza” i GM   // traktaty (7.4): { nazwa, typ, strony: [wł], tajny, opis, tura, zerwany? } — tajne czytają tylko strony i GM   // raporty bitew (7.1h): skład obu stron — tylko uczestnicy i GM   // bitwy: {id: {p, armie: [id], tura}} — jawne (7.1g)
  for (const [id, n] of Object.entries(s.nazwyOsad || {})) if (Object.keys(n).length) d.set(`nazwy_osad/${id}`, { n });   // jeden dokument (622 prowincje mieszczą się z zapasem w limicie 1 MB), jawny dla wszystkich
  return d;
};
const zaladowane = new Set(); // ścieżki, które przyszły z bazy (istniejące albo nie) — tylko te wolno nadpisać
let wgrywanie = false;        // pierwsze wgranie pustej bazy: zapisujemy wszystko
export let bladZapisu = () => {}; // main.js podmienia na komunikat dla użytkownika
export const ustawBladZapisu = f => { bladZapisu = f; };

// logi/{auto}: { czas (ISO), uid, email, typ: "zmiana" | "blad", co: [ścieżki], kod? } — jeden mały dokument na zapis
export const licznik = { zapisy: 0, dokumenty: 0, odczyty: 0, bledy: [] }; // diagnostyka tej sesji (odczyty — w przybliżeniu)
const kto = () => ({ uid: auth.currentUser?.uid || "", email: auth.currentUser?.email || "" });
function zalogujBlad(e, co) {
  licznik.bledy.unshift({ czas: new Date().toISOString(), kod: e.code || "", opis: String(e.message || e).slice(0, 300), co });
  licznik.bledy.length = Math.min(licznik.bledy.length, 20);
  addDoc(collection(db, "logi"), { czas: new Date().toISOString(), ...kto(), typ: "blad", co, kod: e.code || String(e).slice(0, 100) }).catch(() => {});
}
export function zapisz(s) {
  if (!CHMURA) { try { localStorage.setItem(KLUCZ, JSON.stringify(s)); } catch {} return; }
  const batch = writeBatch(db), co = []; let ile = 0;
  for (const [sciezka, dane] of dokumenty(s)) {
    // niewczytany dokument nie może nadpisać prawdziwego pustką; gracz zapisuje tylko swoje notatki (resztę i tak odrzuciłyby reguły)
    if (!wgrywanie && !zaladowane.has(sciezka) && !(dostep.gm && /^(bitwy|traktaty|kronika)\//.test(sciezka))) continue;   // raporty bitew, traktaty i kronikę GM zakłada sam
    if (!dostep.gm && !sciezka.startsWith("notatki_gracza/")) continue;
    if ((sciezka === "gra/prowincje" || sciezka.startsWith("nazwy_osad/")) && !wgrywanie) continue;   // te zapisują zapiszProwincje / zapiszNazwyOsad — po kawałku
    const j = json(dane);
    if (ostatnio.get(sciezka) !== j) { batch.set(doc(db, sciezka), dane); ostatnio.set(sciezka, j); ile++; co.push(sciezka); }
  }
  if (!ile) return;
  if (!wgrywanie) batch.set(doc(collection(db, "logi")), { czas: new Date().toISOString(), ...kto(), typ: "zmiana", co: co.slice(0, 30) });
  licznik.zapisy++; licznik.dokumenty += ile;
  batch.commit().catch(e => { console.error(e); zalogujBlad(e, co.slice(0, 30)); bladZapisu(e); });
}
// prowincje i kraje NPC: w bazie zmieniane tylko wskazane pola (p.<id>, npc.<id>), nie cały dokument — dwóch GM
// zmieniających naraz różne prowincje nie nadpisze sobie zmian. zmiany = [["p" | "npc" | "a", id], …] (a = akweny 7.8a: {id: {nazwa}}); wartości bierze ze stanu (brak = usuń)
export function zapiszProwincje(zmiany) {
  if (!CHMURA) return zapisz(stan);
  if (!dostep.gm || !zmiany.length) return;
  const pola = zmiany.flatMap(([gdzie, id]) => [new FieldPath(gdzie, id), (gdzie === "p" ? stan.prowincje : gdzie === "a" ? stan.akweny : stan.npc)?.[id] ?? deleteField()]);
  const log = () => ({ czas: new Date().toISOString(), ...kto(), typ: "zmiana", co: ["gra/prowincje"] });
  const ref = doc(db, "gra/prowincje"), batch = writeBatch(db);
  batch.update(ref, ...pola); batch.set(doc(collection(db, "logi")), log());
  licznik.zapisy++; licznik.dokumenty++;
  batch.commit().catch(e => {
    if (e.code !== "not-found") { console.error(e); zalogujBlad(e, ["gra/prowincje"]); return bladZapisu(e); }
    // dokumentu jeszcze nie ma (pierwsza prowincja w grze): zakładamy go z całym obecnym stanem
    const b2 = writeBatch(db); b2.set(ref, { p: stan.prowincje || {}, npc: stan.npc || {}, a: stan.akweny || {} }); b2.set(doc(collection(db, "logi")), log());
    b2.commit().catch(e2 => { console.error(e2); zalogujBlad(e2, ["gra/prowincje"]); bladZapisu(e2); });
  });
}
// nazwy osad: nazwy_osad/{prowincja} = { n: {numer osady: nazwa} } — GM albo gracz, którego frakcja ma prowincję (reguła mojaProwincja)
export function zapiszNazwyOsad(id) {
  if (!CHMURA) return zapisz(stan);
  const n = stan.nazwyOsad?.[id] || {}, ref = doc(db, "nazwy_osad", id), batch = writeBatch(db);
  Object.keys(n).length ? batch.set(ref, { n }) : batch.delete(ref);
  batch.set(doc(collection(db, "logi")), { czas: new Date().toISOString(), ...kto(), typ: "zmiana", co: [`nazwy_osad/${id}`] });
  licznik.zapisy++; licznik.dokumenty++;
  batch.commit().catch(e => { console.error(e); zalogujBlad(e, [`nazwy_osad/${id}`]); bladZapisu(e); });
}
// przywracanie kopii: zapis wszystkich dokumentów, także tych, których nie ma jeszcze w bazie
export function zapiszWszystko(s) { wgrywanie = true; try { zapisz(s); } finally { wgrywanie = false; } }
// sprzątanie logów starszych niż `dni` (TTL Firestore wymaga planu płatnego, więc robi to GM/admin przy logowaniu)
export async function sprzatnijLogi(dni) {
  const granica = new Date(Date.now() - dni * 864e5).toISOString(); let razem = 0;
  for (;;) {
    const snap = await getDocs(query(collection(db, "logi"), where("czas", "<", granica), limit(400)));
    if (snap.empty) return razem;
    const batch = writeBatch(db); snap.docs.forEach(d => batch.delete(d.ref)); await batch.commit(); razem += snap.size;
  }
}
export const ostatnieLogi = async n => {
  const snap = await getDocs(query(collection(db, "logi"), orderBy("czas", "desc"), limit(n)));
  licznik.odczyty += snap.size; return snap.docs.map(d => d.data());
};
// diagnostyka: liczba dokumentów (zapytanie zliczające = 1 odczyt na 1000 dokumentów) i rozmiar wczytanych danych
export const KOLEKCJE = ["frakcje", "bohaterowie", "gra", "nazwy_osad", "tajne_zasoby", "tajne_jednostki", "tajne_statusy", "notatki_gracza", "notatki_gm", "uzytkownicy", "propozycje", "logi"];
export async function policzDokumenty() {
  const wynik = await Promise.all(KOLEKCJE.map(async k => [k, (await getCountFromServer(collection(db, k))).data().count]));
  licznik.odczyty += KOLEKCJE.length; return Object.fromEntries(wynik);
}
// porządki (admin): najpierw szukaj (bez zmian w bazie), potem wykonaj — z podglądem dla użytkownika
const TAJNE_KOLEKCJE = ["tajne_zasoby", "tajne_jednostki", "tajne_statusy", "notatki_gracza", "notatki_gm"];
export async function szukajSmieci() {
  const frakcje = new Set(stan.frakcje.map(f => f.id)), typy = new Set(stan.zasoby.map(z => z.id)), pozycje = [];
  const obceKlucze = o => Object.keys(o || {}).filter(k => !typy.has(k)).length;
  const stany = stan.frakcje.reduce((n, f) => n + obceKlucze(f.stany), 0)
    + stan.tury.reduce((n, t) => n + Object.values(t.frakcje || {}).reduce((m, x) => m + obceKlucze(x.stany), 0), 0);
  if (stany) pozycje.push({ opis: "Stany i migawki tur usuniętych typów zasobów", ile: stany });
  const sieroty = stan.bohaterowie.filter(h => !frakcje.has(h.frakcja));
  if (sieroty.length) pozycje.push({ opis: `Bohaterowie nieistniejących frakcji: ${sieroty.map(h => h.imie).join(", ")}`, ile: sieroty.length });
  const obce = [];
  for (const k of TAJNE_KOLEKCJE) {
    const snap = await getDocs(collection(db, k)); licznik.odczyty += snap.size;
    snap.docs.filter(d => !frakcje.has(d.id)).forEach(d => obce.push(d.ref));
  }
  if (obce.length) pozycje.push({ opis: `Tajne dane i notatki nieistniejących frakcji: ${obce.map(r => r.path).join(", ")}`, ile: obce.length });
  const dni = stan.ustawienia?.dniLogow ?? 30, granica = new Date(Date.now() - dni * 864e5).toISOString();
  const logi = (await getCountFromServer(query(collection(db, "logi"), where("czas", "<", granica)))).data().count; licznik.odczyty++;
  if (logi) pozycje.push({ opis: `Logi starsze niż ${dni} dni`, ile: logi });
  const profile = await getDocs(collection(db, "uzytkownicy")); licznik.odczyty += profile.size;
  const zlePanstwo = profile.docs.filter(d => d.data().frakcja && !frakcje.has(d.data().frakcja));
  if (zlePanstwo.length) pozycje.push({ opis: `Konta przypisane do nieistniejącego państwa: ${zlePanstwo.map(d => d.data().email).join(", ")}`, ile: zlePanstwo.length });
  // dokumenty, które po przeliczeniu wyglądają inaczej niż w bazie: stare pola, statusy usuniętych bohaterów itp.
  const nieaktualne = [...dokumenty(stan)].filter(([sc, d]) => zaladowane.has(sc) && ostatnio.has(sc) && ostatnio.get(sc) !== json(d)).length;
  if (nieaktualne) pozycje.push({ opis: "Dokumenty z resztkami starego formatu do przepisania", ile: nieaktualne });
  return { pozycje, wykonaj: async () => {
    const czysc = o => o && Object.keys(o).forEach(k => typy.has(k) || delete o[k]);
    stan.frakcje.forEach(f => czysc(f.stany)); stan.tury.forEach(t => Object.values(t.frakcje || {}).forEach(x => czysc(x.stany)));
    stan.bohaterowie = stan.bohaterowie.filter(h => frakcje.has(h.frakcja));
    zapisz(stan);
    const batch = writeBatch(db);
    [...obce, ...sieroty.map(h => doc(db, "bohaterowie", h.id))].forEach(r => { batch.delete(r); ostatnio.delete(r.path); zaladowane.delete(r.path); });
    zlePanstwo.forEach(d => batch.update(d.ref, { frakcja: "" }));
    if (obce.length || sieroty.length || zlePanstwo.length) await batch.commit();
    await sprzatnijLogi(dni);
  } };
}
export function rozmiaryWczytanych() { // bajty JSON-a wczytanych dokumentów, per kolekcja
  const r = {}; for (const [sc, j] of ostatnio) { const k = sc.split("/")[0]; r[k] = (r[k] || 0) + new Blob([j]).size; } return r;
}

// subskrypcje na żywo; onZmiana() wołane po zmianach od innych osób (nie po własnych zapisach)
let odpiecia = [], odswiezTajne = () => {};
const odmowy = new Set(); // tajne dokumenty, do których baza odmówiła dostępu — bez ponawiania, dopóki nie zmieni się rola albo „jawne”
export function ustawDostep(d) { dostep = d; odmowy.clear(); odswiezTajne(); }
export function polacz(onZmiana) {
  odlacz();
  return new Promise((gotowe, blad) => {
    const czesci = { frakcje: null, bohaterowie: null, gra: undefined, prowincje: undefined, nazwy: null, armie: undefined }, tajne = new Map(), tajneSub = new Map();
    let pierwszy = true;
    const migracja = (stare, nowe) => nowe === undefined ? undefined : nowe ?? stare; // brak nowego dokumentu → dane ze starego formatu
    const sklej = () => {
      if (czesci.frakcje === null || czesci.bohaterowie === null || czesci.gra === undefined || czesci.prowincje === undefined || czesci.nazwy === null || czesci.armie === undefined) return;
      if (pierwszy && !czesci.gra) { // pusta baza — pierwsze logowanie: wgrywamy zapis z DEMO (jeśli jest w tej przeglądarce) albo dane startowe
        pierwszy = false; const { wersja, ...s } = zapisDemo() || start(); Object.assign(stan, s);
        wgrywanie = true; zapisz(stan); wgrywanie = false; gotowe(stan); return;
      }
      odswiezTajne();
      if ([...tajneSub.keys()].some(sc => !tajne.has(sc))) return; // czekamy na pierwsze odczyty tajnych dokumentów
      const t = sc => tajne.has(sc) ? tajne.get(sc) : undefined; // undefined = nie wolno / niewczytane, null = nie istnieje
      const frakcje = czesci.frakcje.map(f => {
        const x = bez(f, TAJNE_POLA_FRAKCJI), brak = {};
        const tz = t(`tajne_zasoby/${f.id}`), tj = t(`tajne_jednostki/${f.id}`), ng = t(`notatki_gracza/${f.id}`), nm = t(`notatki_gm/${f.id}`);
        if (tz === undefined) brak.zasoby = true; else { x.stany = migracja(f.stany, tz?.stany) || {}; x.zasoby = migracja(f.zasoby, tz?.zasoby) || []; }
        if (tj === undefined) brak.jednostki = true; else x.jednostki = migracja(f.jednostki, tj?.jednostki) || [];
        if (t(`tajne_statusy/${f.id}`) === undefined) brak.statusy = true;
        const tb = t(`tajne_budynki/${f.id}`); if (tb === undefined) brak.budynki = true; else x.budynki = tb?.p || {};
        const ta = t(`tajne_armie/${f.id}`); if (ta === undefined) brak.armie = true; else { x.armie = ta?.armie || []; x.cofnijRozwiazanie = ta?.cofnij || null; x.floty = ta?.floty || []; }
        if (ng === undefined) brak.notatkiGracza = true; else x.notatkiGracza = ng?.tekst || "";
        if (nm === undefined) brak.notatkiGM = true; else x.notatkiGM = nm?.tekst || "";
        if (Object.keys(brak).length) x._brak = brak;
        return x;
      });
      const bohaterowie = czesci.bohaterowie.map(h => {
        const ts = t(`tajne_statusy/${h.frakcja}`);
        if (ts === undefined) return { ...bez(h, ["status", "misja"]), _brak: true };
        const st = ts?.statusy?.[h.id];
        return { ...h, status: st?.status ?? h.status ?? "stolica", misja: st?.misja ?? h.misja ?? "" };
      });
      const tury = (czesci.gra?.tury || []).map(m => ({ nr: m.nr, data: m.data, frakcje: Object.fromEntries(frakcje.flatMap(f => {
        const tz = t(`tajne_zasoby/${f.id}`);
        if (tz === undefined) return [];
        const z = tz?.tury?.find(x => x.nr === m.nr) ?? m.frakcje?.[f.id]; // stary format: migawki w gra/stan
        return z ? [[f.id, { stany: z.stany || {}, unikalne: z.unikalne || {} }]] : [];
      })) }));
      Object.assign(stan, { frakcje, bohaterowie, zasoby: czesci.gra?.zasoby || [], tury, ustawienia: { ...USTAWIENIA, ...czesci.gra?.ustawienia }, prowincje: czesci.prowincje?.p || {}, npc: czesci.prowincje?.npc || {}, akweny: czesci.prowincje?.a || {}, nazwyOsad: czesci.nazwy, pozycjeArmii: czesci.armie?.a || {}, pozycjeFlot: czesci.armie?.fl || {}, cofnijRuchy: czesci.armie?.cofnij || null, bitwy: czesci.armie?.bitwy || {}, wojny: czesci.gra?.wojny || [] });
      if (pierwszy) { pierwszy = false; if (dostep.gm) { dopiszNowychBohaterow(); dopiszNoweSekcje(); zapisz(stan); } gotowe(stan); } // GM: przeniesienie starego formatu do nowych dokumentów
      else onZmiana();
    };
    // które tajne dokumenty subskrybować — zależy od roli, własnej frakcji i przełączników „jawne” (zmieniają się na żywo)
    odswiezTajne = () => {
      if (!czesci.frakcje) return;
      const chce = new Set(sciezkiTajne(czesci.frakcje).filter(sc => !odmowy.has(sc)));
      for (const [sc, odp] of tajneSub) if (!chce.has(sc)) { odp(); tajneSub.delete(sc); tajne.delete(sc); zaladowane.delete(sc); ostatnio.delete(sc); }
      for (const sc of chce) if (!tajneSub.has(sc)) tajneSub.set(sc, onSnapshot(doc(db, sc), snap => {
        if (snap.metadata.hasPendingWrites) return;
        licznik.odczyty++; zaladowane.add(sc); tajne.set(sc, snap.exists() ? snap.data() : null);
        if (snap.exists()) ostatnio.set(sc, json(snap.data())); else ostatnio.delete(sc);
        sklej();
      }, e => { console.warn(sc, e.code); odmowy.add(sc); tajneSub.delete(sc); tajne.delete(sc); zaladowane.delete(sc); sklej(); })); // brak dostępu = część tajna
    };
    const lista = nazwa => onSnapshot(collection(db, nazwa), snap => {
      if (snap.metadata.hasPendingWrites) return; // echo własnego zapisu
      licznik.odczyty += snap.docChanges().length;
      snap.docs.forEach(d => { ostatnio.set(`${nazwa}/${d.id}`, json(d.data())); zaladowane.add(`${nazwa}/${d.id}`); });
      czesci[nazwa] = snap.docs.map(d => d.data()).sort((a, b) => a._nr - b._nr).map(({ _nr, ...x }) => x);
      if (nazwa === "frakcje") odmowy.clear(); // mogły się zmienić przełączniki „jawne”
      sklej();
    }, blad);
    // kolekcje z widocznością (traktaty, kronika): GM — wszystko; gracz — jawne + te, gdzie jego kraj jest na liście (dwa zapytania zgodne z regułami)
    const widoczne = (nazwa, pole) => {
      const czesc = new Map(), sub = (klucz, q) => onSnapshot(q, snap => {
        if (snap.metadata.hasPendingWrites) return;
        licznik.odczyty += snap.docChanges().length;
        czesc.set(klucz, new Map(snap.docs.map(d => [d.id, d.data()])));
        snap.docs.forEach(d => { ostatnio.set(`${nazwa}/${d.id}`, json(d.data())); zaladowane.add(`${nazwa}/${d.id}`); });
        stan[nazwa] = Object.fromEntries([...czesc.values()].flatMap(x => [...x]));
        if (!pierwszy) onZmiana();
      }, e => console.warn(nazwa, e.code));
      return dostep.gm ? [sub("wszystkie", collection(db, nazwa))]
        : [sub("jawne", query(collection(db, nazwa), where("tajny", "==", false))),
          ...(dostep.frakcja ? [sub("moje", query(collection(db, nazwa), where(pole, "array-contains", dostep.frakcja)))] : [])];
    };
    odpiecia = [...widoczne("traktaty", "strony"), ...widoczne("kronika", "widza"), lista("frakcje"), lista("bohaterowie"), onSnapshot(doc(db, "gra/stan"), snap => {
      if (snap.metadata.hasPendingWrites) return;
      licznik.odczyty++; zaladowane.add("gra/stan");
      if (snap.exists()) ostatnio.set("gra/stan", json(snap.data()));
      czesci.gra = snap.exists() ? snap.data() : null; sklej();
    }, blad), onSnapshot(doc(db, "gra/prowincje"), snap => {
      if (snap.metadata.hasPendingWrites) return;
      licznik.odczyty++; zaladowane.add("gra/prowincje");
      if (snap.exists()) ostatnio.set("gra/prowincje", json(snap.data()));
      czesci.prowincje = snap.exists() ? snap.data() : null; sklej();
    }, blad), onSnapshot(doc(db, "gra/armie"), snap => {
      if (snap.metadata.hasPendingWrites) return;
      licznik.odczyty++; zaladowane.add("gra/armie");
      if (snap.exists()) ostatnio.set("gra/armie", json(snap.data()));
      czesci.armie = snap.exists() ? snap.data() : null; sklej();
    }, blad), onSnapshot(collection(db, "nazwy_osad"), snap => {
      if (snap.metadata.hasPendingWrites) return;
      licznik.odczyty += snap.docChanges().length;
      czesci.nazwy = Object.fromEntries(snap.docs.map(d => [d.id, d.data().n || {}])); sklej();
    }, blad), () => { tajneSub.forEach(o => o()); tajneSub.clear(); }];
  });
}
// bohaterowie dopisani w kodzie (bohaterowie.js) po starcie gry: GM przy logowaniu wgrywa tych, których nie ma w bazie.
// shortcut: bohater usunięty ręcznie w konsoli Firebase wróciłby — gdy dojdzie usuwanie w programie, trzeba listy usuniętych
function dopiszNowychBohaterow() {
  const frakcje = new Set(stan.frakcje.map(f => f.id));
  for (const h of BOHATEROWIE) if (frakcje.has(h.frakcja) && !stan.bohaterowie.some(x => x.id === h.id)) {
    stan.bohaterowie.push(structuredClone(h)); zaladowane.add(`bohaterowie/${h.id}`);   // nowy dokument: nie nadpisuje niczego pustką
  }
}
// sekcje opisu dopisane w kodzie (frakcje.js, pole `dopisek`) po starcie gry: GM przy logowaniu dopisuje je na końcu opisu frakcji.
// Wgrane zapamiętane w ustawieniach (frakcja/tytuł), więc sekcja usunięta albo przemianowana przez GM nie wraca.
function dopiszNoweSekcje() {
  const wgrane = stan.ustawienia.wgraneSekcje ??= [];
  for (const wzor of FRAKCJE) {
    const f = stan.frakcje.find(x => x.id === wzor.id);
    if (f) for (const { dopisek, ...sekcja } of wzor.opis) {
      const klucz = `${f.id}/${sekcja.tytul}`;
      if (!dopisek || wgrane.includes(klucz)) continue;
      wgrane.push(klucz);
      if (!(f.opis ??= []).some(x => x.tytul === sekcja.tytul)) f.opis.push(sekcja);
    }
  }
}
export function odlacz() { odpiecia.forEach(o => o()); odpiecia = []; odswiezTajne = () => {}; ostatnio.clear(); zaladowane.clear(); odmowy.clear(); }

// raport bitwy dla uczestnika (7.1h): jednorazowy odczyt przy otwarciu ekranu; null = brak dostępu albo brak raportu
export async function czytajBitwe(id) {
  if (!CHMURA) return null;
  try { const s = await getDoc(doc(db, `bitwy/${id}`)); licznik.odczyty++; return s.exists() ? s.data() : null; } catch { return null; }
}
// --- propozycje zmian od graczy (etap 4.4) ---
// propozycje/{auto}: { czas, uid, email, frakcja, cel: "frakcja"|"bohater", celId, nazwa, zmiany: {pole: nowe}, przed: {pole: stare},
//   status: "czeka"|"przyjeta"|"odrzucona", komentarz, rozpatrzono (ISO albo ""), rozpatrzyl }
export const zaproponuj = p => addDoc(collection(db, "propozycje"), { ...p, czas: new Date().toISOString(), ...kto(),
  status: "czeka", komentarz: "", rozpatrzono: "", rozpatrzyl: "" });
// GM: wszystkie oczekujące; gracz: swoje + propozycje traktatów, w których jego frakcja jest stroną (7.15)
// (reguły wymagają zawężenia zapytań do własnego uid / strony)
export function sluchajPropozycji(czyGM, frakcja, cb, blad) {
  const czesci = new Map(), sub = (klucz, q) => onSnapshot(q, snap => {
    licznik.odczyty += snap.docChanges().length;
    czesci.set(klucz, snap.docs.map(d => ({ id: d.id, ...d.data() })));
    cb([...new Map([...czesci.values()].flat().map(p => [p.id, p])).values()].sort((a, b) => a.czas < b.czas ? 1 : -1));
  }, blad);
  const kolekcja = collection(db, "propozycje");
  const odpiecia = czyGM ? [sub("gm", query(kolekcja, where("status", "==", "czeka")))]
    : [sub("moje", query(kolekcja, where("uid", "==", auth.currentUser.uid))), ...(frakcja ? [sub("strony", query(kolekcja, where("strony", "array-contains", frakcja)))] : [])];
  return () => odpiecia.forEach(o => o());
}
// zgoda (true) albo odmowa (false) strony traktatu na propozycję innego gracza (7.15)
export const zgodaStrony = (id, frakcja, tak) => updateDoc(doc(db, "propozycje", id), new FieldPath("zgody", frakcja), tak);
export const rozpatrz = (id, status, komentarz) => updateDoc(doc(db, "propozycje", id),
  { status, komentarz, rozpatrzono: new Date().toISOString(), rozpatrzyl: auth.currentUser?.email || "" });
export const wycofaj = id => deleteDoc(doc(db, "propozycje", id));
// usunięcie dokumentu z kolekcji z widocznością (traktaty, kronika) — GM, pomyłka albo cofnięcie tury; z pamięci i z bazy
export function usunWpis(kolekcja, id) {
  delete stan[kolekcja]?.[id];
  if (!CHMURA) return zapisz(stan);
  ostatnio.delete(`${kolekcja}/${id}`); deleteDoc(doc(db, kolekcja, id)).catch(e => { console.error(e); zalogujBlad(e, [`${kolekcja}/${id}`]); bladZapisu(e); });
}
export const usunTraktat = id => usunWpis("traktaty", id);
// rozpatrzone starsze niż `dni` (oczekujące zostają — mają rozpatrzono == "")
export async function sprzatnijPropozycje(dni) {
  const granica = new Date(Date.now() - dni * 864e5).toISOString();
  const snap = await getDocs(query(collection(db, "propozycje"), where("rozpatrzono", ">", ""), where("rozpatrzono", "<", granica), limit(400)));
  licznik.odczyty += snap.size; if (snap.empty) return 0;
  const batch = writeBatch(db); snap.docs.forEach(d => batch.delete(d.ref)); await batch.commit(); return snap.size;
}

// --- konta i role ---
// uzytkownicy/{uid}: { email, nazwa, rola, frakcja, utworzono }; rola: admin | gm | gracz | obserwator | oczekujacy
export const ROLE = { admin: "Admin", gm: "GM", gracz: "Gracz-władca", obserwator: "Obserwator", oczekujacy: "Oczekujący" };
export async function mojProfil(user) {
  const ref = doc(db, "uzytkownicy", user.uid), s = await getDoc(ref);
  if (s.exists()) return s.data();
  const nowy = { email: user.email || "", nazwa: user.displayName || "", rola: "oczekujacy", frakcja: "", utworzono: new Date().toISOString() };
  // reguły pozwalają utworzyć profil admina tylko kontu admina (po e-mailu) — reszta zaczyna jako oczekujący
  try { await setDoc(ref, { ...nowy, rola: "admin" }); return { ...nowy, rola: "admin" }; } catch {}
  await setDoc(ref, nowy); return nowy;
}
export const sluchajProfilu = (uid, cb) => onSnapshot(doc(db, "uzytkownicy", uid), s => s.exists() && cb(s.data()));
export const sluchajUzytkownikow = (cb, blad) => onSnapshot(collection(db, "uzytkownicy"), s => cb(s.docs.map(d => ({ uid: d.id, ...d.data() }))), blad);
// zmiana roli/państwa razem z wpisem w logach (opis: czytelny tekst, np. „e-mail → Gracz-władca, Goblandia”)
export function ustawUzytkownika(uid, zmiany, opis) {
  const batch = writeBatch(db);
  batch.update(doc(db, "uzytkownicy", uid), zmiany);
  batch.set(doc(collection(db, "logi")), { czas: new Date().toISOString(), ...kto(), typ: "zmiana", co: [`uzytkownicy/${opis}`] });
  return batch.commit();
}

// --- logowanie ---
export const naZmianeKonta = cb => auth ? onAuthStateChanged(auth, cb) : cb(null);
export const zaloguj = (mail, haslo) => signInWithEmailAndPassword(auth, mail, haslo);
export const zalozKonto = (mail, haslo) => createUserWithEmailAndPassword(auth, mail, haslo);
export const zalogujGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const wyloguj = async () => { odlacz(); await koniecObecnosci(); return signOut(auth); };   // „offline” jeszcze z uprawnieniami
