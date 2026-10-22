import "./style.css";
import "../assets/sala_tronow/animacje.js"; // ustawia window.Sala
import pakiet from "../package.json";
import { usunWpis, usunTraktat, czytajBitwe, stan, wczytaj, zapisz, CHMURA, polacz, odlacz, naZmianeKonta, zaloguj, zalozKonto, zalogujGoogle, wyloguj, ustawBladZapisu,
  ROLE, mojProfil, sluchajProfilu, sluchajUzytkownikow, ustawUzytkownika, ustawDostep, sprzatnijLogi, ostatnieLogi, licznik, KOLEKCJE, policzDokumenty, rozmiaryWczytanych, szukajSmieci, zapiszWszystko,
  zaproponuj, zapiszBlokGracza, sluchajPropozycji, zgodaStrony, zglosObecnosc, sluchajObecnosci, rozpatrz, wycofaj, sprzatnijPropozycje, zapiszProwincje, zapiszNazwyOsad, PODGLAD, wPiaskownicy, zapiszHistorie, usunHistorie, czytajHistorie,
  czytajHistorieTury, zapiszOpowiesc, czytajOpowiesc, czytajSzept, czytajSzeptyTury, opublikujOpowiesc, usunOpowiesc } from "./dane/magazyn.js";
import { ZMIANY } from "./dane/zmiany.js";
import { utworzMape, krzywa, wygladz } from "./mapa.js";
import { ozywPortrety, zatrzymajPortrety, animacjePortretow, ustawAnimacjePortretow } from "./portrety_anim.js";
import { otworzSamouczek, zaproponujSamouczek, zakoncz as zakonczSamouczek } from "./samouczek.js";
import { wykres, podepnijWykresy, liczba as liczbaWykresu } from "./wykresy.js";
import { rysujKarte } from "./grafika_karty.js";
import { PRZEKRECONE } from "./dane/przekrecenia.js";
import { opowiedz } from "./kronikarz.js";
import { pokazOpowiesc } from "./opowiesc.js";
import { nagrajOpowiesc } from "./film_opowiesci.js";
import { przygotujTimelapse, SZER as SZER_TL, WYS as WYS_TL, formatFilmu, nagrajFilm, nagrajGif } from "./timelapse.js";
import { klik, zatwierdz, anuluj, otworz, zamknij as zamknijDzwiek, ustawieniaDzwiekow, ustawDzwieki } from "./dzwieki.js";
import terenUrl from "../assets/mapa/teren.png";
import terenMaskaUrl from "../assets/mapa/teren_maska.png";
import TERENY from "../assets/mapa/tereny.json";
import indeksyUrl from "../assets/mapa/prowincje.png";
import PROWINCJE from "../assets/mapa/prowincje.json";
import GRANICE from "../assets/mapa/granice.json";
import AKWENY from "../assets/mapa/akweny.json";
import GRANICE_MORSKIE from "../assets/mapa/akweny_granice.json";
// ikonki osad (6.2b): assets/mapa/ikony/<miasto|wioska|stolica>.png — dopóki ich nie ma, mapa rysuje proste znaczniki
const IKONY_OSAD = Object.fromEntries(Object.entries(import.meta.glob(["../assets/mapa/ikony/*.png", "!../assets/mapa/ikony/*_1024.png"], { eager: true, query: "?url", import: "default" }))
  .map(([k, url]) => [k.split("/").pop().slice(0, -4), url]));

// obrazy scen przez Vite: do dist trafiają tylko pliki z sala_tronow/ (bez fanartów)
const obrazy = import.meta.glob("../assets/sala_tronow/*.png", { eager: true, query: "?url", import: "default" });
const adres = plik => obrazy["../assets/sala_tronow/" + plik];
// portrety 128 px: plik = jedno ze słów imienia małymi literami (dagna.png, seranya.png)
const portrety = import.meta.glob(["../assets/portrety/*.png", "!../assets/portrety/*_1024.png"], { eager: true, query: "?url", import: "default" });
// portret po słowie z imienia, a gdy imię zmieniono (np. edycją GM), po słowie ze stałego id
const slowoPortretu = h => `${h.imie} ${h.id}`.toLowerCase().split(/[^a-ząćęłńóśźż]+/).find(s => portrety[`../assets/portrety/${s}.png`]);   // = nazwa pliku (animacje 7.3)
const plikPortretu = h => portrety[`../assets/portrety/${slowoPortretu(h)}.png`];
// ikony zasobów 32 px: plik = pole „ikona” typu zasobu (bron.png)
const ikony = import.meta.glob(["../assets/ikony/*.png", "!../assets/ikony/*_1024.png"], { eager: true, query: "?url", import: "default" });
// herby 64 px: plik = id frakcji (krag-mhor.png)
const herby = import.meta.glob(["../assets/herby/*.png", "!../assets/herby/*_1024.png"], { eager: true, query: "?url", import: "default" });

const CZAS_SCENY = 12000;
const sala = new Sala(document.getElementById("scena"), adres);
Object.assign(sala, { tryb: "blysk", zoom: true, ruch: !matchMedia("(prefers-reduced-motion: reduce)").matches });
document.getElementById("wersja").textContent = "wersja " + pakiet.version;

const mini = document.getElementById("miniatury");
sala.sceny.forEach((s, i) => {
  const m = document.createElement("button"); m.type = "button"; m.title = s.imie;
  m.style.backgroundImage = `url("${adres(s.plik)}")`; m.onclick = () => { pokaz(i); restart(); }; mini.appendChild(m);
});
let timer = null, podpisTimer;
function pokaz(i) {
  const pierwsza = sala.nr < 0; sala.pokaz(i); const s = sala.sceny[sala.nr], podpis = document.querySelector(".podpis");
  // podpis gaśnie i wraca w połowie przejścia, żeby nie wyprzedzał obrazu
  podpis.style.opacity = 0; clearTimeout(podpisTimer);
  podpisTimer = setTimeout(() => {
    document.getElementById("imie").textContent = s.imie;
    document.getElementById("frakcja").textContent = s.frakcja; podpis.style.opacity = 1;
  }, pierwsza ? 0 : sala.czasPrzejscia * 500);
  [...mini.children].forEach((b, j) => b.classList.toggle("akt", j === sala.nr));
}
function restart() { clearInterval(timer); timer = setInterval(() => pokaz(sala.nr + 1), CZAS_SCENY); }
addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || document.getElementById("menu").hidden) return;
  if (e.key === "ArrowRight") { pokaz(sala.nr + 1); restart(); }
  if (e.key === "ArrowLeft") { pokaz(sala.nr - 1); restart(); }
});
pokaz(0); restart();

// powłoka aplikacji; w DEMO „Wejdź do sali” wpuszcza od razu, w chmurze po zalogowaniu (Firebase)
const lista = document.getElementById("lista-frakcji"), glowny = document.getElementById("glowny");
const esc = t => String(t).replace(/[&<>"]/g, z => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[z]);
// tekst opisu: pusta linia = akapit, linie od "- " = lista, pojedynczy enter = nowa linia (np. hymn)
const tekst = t => t.split(/\n\s*\n/).map(blok => {
  const linie = blok.trim().split("\n"), punkty = linie.filter(l => l.startsWith("- "));
  if (!punkty.length) return `<p>${linie.map(esc).join("<br>")}</p>`;
  const wstep = linie.filter(l => !l.startsWith("- "));
  return (wstep.length ? `<p>${wstep.map(esc).join("<br>")}</p>` : "") + `<ul>${punkty.map(l => `<li>${esc(l.slice(2))}</li>`).join("")}</ul>`;
}).join("");
// górny pasek: same herby; nazwa w podpowiedzi, własne państwo w ramce
const herbFrakcji = f => herby[`../assets/herby/${f.id}.png`];
function zbudujListe() {
  lista.replaceChildren(...stan.frakcje.map(f => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.id = f.id; b.style.setProperty("--kolor", f.kolor);
    const twoje = f.id === profil?.frakcja;
    b.title = f.nazwa + (twoje ? " — Twoje państwo" : ""); b.setAttribute("aria-label", b.title); b.classList.toggle("moja", twoje);
    b.setAttribute("aria-current", widok === f.id);
    b.innerHTML = herbFrakcji(f) ? `<img src="${herbFrakcji(f)}" alt="">` : `<span class="herb-maly" aria-hidden="true">${esc(f.nazwa[0])}</span>`;
    b.onclick = () => widok === f.id ? zamknijSzuflade() : wybierz(f.id); return b;
  }));
  oznaczObecnosc();
}
// obecność graczy: zielona kropka przy herbie, gdy gracz tego państwa jest zalogowany; w podpowiedzi — kiedy był ostatnio
let obecnosc = {}, odpiecieObecnosci = () => {};
function oznaczObecnosc() {
  for (const b of lista.children) {
    const f = frakcjaPo(b.dataset.id), wpisy = Object.values(obecnosc).filter(o => o.f === b.dataset.id);
    const on = wpisy.some(o => o.on), t = Math.max(0, ...wpisy.map(o => +o.t || 0));
    b.classList.toggle("online", on);
    b.title = f.nazwa + (f.id === profil?.frakcja ? " — Twoje państwo" : "") + (!CHMURA ? "" : on ? " · gracz online"
      : t ? ` · ostatnio: ${new Date(t).toLocaleString("pl-PL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}` : "");
    b.setAttribute("aria-label", b.title);
  }
}
// szuflada z prawej (karta frakcji, Panel GM): zwęża mapę; zamyka ją ✕, Esc albo klik w mapę
// okna (bohater, bitwa, edycja): zwykle modalne; w samouczku (8.1) zwykłe, żeby warstwa Zgrzyta mogła być nad nimi
const otworzOkno = d => { otworz(); document.body.classList.contains("w-samouczku") ? d.show() : d.showModal(); };
// dźwięki (8.4): kliknięcie przycisku — zatwierdzenie, anulowanie/usunięcie albo zwykłe; zamknięcie okna — szelest
document.addEventListener("click", e => {
  const b = e.target.closest?.("button"); if (!b || b.disabled) return;
  if (b.matches(".dodaj, .wejdz")) zatwierdz(); else if (b.matches(".usun, .zamknij")) anuluj(); else klik();
}, true);
for (const id of ["bohater", "bitwa", "zmiany", "timelapse"]) document.getElementById(id).addEventListener("close", () => zamknijDzwiek());
// ustawienia dźwięków: 🔊 w pasku → mały panel (interfejs, głos Zgrzyta i jego wariant, głośność), zapamiętane w przeglądarce
const przyciskDzwiekow = document.getElementById("dzwieki-przycisk"), panelDzwiekow = document.getElementById("dzwieki-panel");
function pokazUstawieniaDzwiekow() {
  const u = ustawieniaDzwiekow();
  przyciskDzwiekow.textContent = u.ui || u.zgrzyt ? "🔊" : "🔇";
  panelDzwiekow.innerHTML = `<label><input type="checkbox" name="ui"${u.ui ? " checked" : ""}> Dźwięki interfejsu</label>
    <label><input type="checkbox" name="zgrzyt"${u.zgrzyt ? " checked" : ""}> Głos Zgrzyta</label>
    <label>Głos <select name="glos">${[["chrapliwy", "A — chrapliwy"], ["piskliwy", "B — piskliwy"], ["pomruk", "C — pomruk"]].map(([k, n]) => `<option value="${k}"${k === u.glos ? " selected" : ""}>${n}</option>`).join("")}</select></label>
    <label>Głośność <input type="range" name="glosnosc" min="0" max="1" step="0.05" value="${u.glosnosc}"></label>`;
  panelDzwiekow.querySelectorAll("input, select").forEach(p => p.onchange = () => {
    ustawDzwieki({ [p.name]: p.type === "checkbox" ? p.checked : p.type === "range" ? +p.value : p.value });
    przyciskDzwiekow.textContent = ustawieniaDzwiekow().ui || ustawieniaDzwiekow().zgrzyt ? "🔊" : "🔇"; klik();
  });
}
przyciskDzwiekow.onclick = () => { panelDzwiekow.hidden = !panelDzwiekow.hidden; if (!panelDzwiekow.hidden) pokazUstawieniaDzwiekow(); };
document.addEventListener("click", e => { if (!panelDzwiekow.hidden && !e.target.closest("#dzwieki-panel, #dzwieki-przycisk")) panelDzwiekow.hidden = true; });
pokazUstawieniaDzwiekow(); panelDzwiekow.hidden = true;
const szuflada = document.getElementById("szuflada");
function otworzSzuflade() { if (szuflada.hidden) otworz(); szuflada.hidden = false; }
function zamknijSzuflade() {
  if (!szuflada.hidden) zamknijDzwiek();
  szuflada.hidden = true; widok = null; glowny.innerHTML = ""; mapa.wybierz(0);
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
}
document.getElementById("zamknij-szuflade").onclick = zamknijSzuflade;
addEventListener("keydown", e => { if (e.key === "Escape" && !szuflada.hidden && !document.querySelector("dialog[open]")) zamknijSzuflade(); });
// klik w prowincję otwiera jej kartę, klik w wodę zamyka szufladę
// teren (7.6b): teren.png (2500²) pokazywany jako mapa 5000², tekstury typów terenu prowincji (assets/mapa/tekstury/<typ>.png)
const TEKSTURY = Object.fromEntries(Object.entries(import.meta.glob("../assets/mapa/tekstury/*.png", { eager: true, query: "?url", import: "default" }))
  .map(([k, url]) => [k.split("/").pop().slice(0, -4), url]));
const mapa = utworzMape(document.getElementById("mapa"), { rysunek: terenUrl, rozmiar: [5000, 5000], teren: { maska: terenMaskaUrl, tekstury: TEKSTURY }, indeksy: indeksyUrl, ramki: [...PROWINCJE, ...AKWENY].map(p => p.ramka), granice: GRANICE, graniceMorskie: GRANICE_MORSKIE, morzeOd: PROWINCJE.length + 1, ikony: IKONY_OSAD,
  onKlik: (i, x, y) => celowanieFloty ? przestawFlote(i) : celowanie ? celWProwincji(i > NP ? 0 : i, x, y) : stawianie ? postawOsade(i, x, y) : i > NP ? pokazAkwen(i - NP) : i ? pokazProwincje(i) : !szuflada.hidden && zamknijSzuflade() });
// akweny (7.8a) są w tym samym obrazie indeksów co prowincje, za nimi: indeks NP + nr akwenu; AKWENY[n-1] = {id, typ: morze | jezioro, x, y, ramka,
//   sasiedzi: [[nr, "morze" | "rzeka"]], brzeg: [indeks prowincji]} — jeziora i połączenia rzeczne tylko z umiejętnością „żegluga”
const NP = PROWINCJE.length;
const nazwaAkwenu = a => stan.akweny?.[a.id]?.nazwa || `Akwen ${a.id.slice(1)}`;
// karta akwenu: nazwa (GM; stan.akweny[id] = {nazwa}), sąsiednie akweny i wybrzeże (nadmorskie prowincje)
function pokazAkwen(n) {
  const a = AKWENY[n - 1]; widok = "a:" + n; mapa.wybierz(NP + n);
  [...lista.children].forEach(b => b.setAttribute("aria-current", false)); glowny.style.removeProperty("--kolor");
  const przycisk = (attr, nazwa, pod = "") => `<li><button type="button" ${attr}><span>${esc(nazwa)}${pod ? `<small>${esc(pod)}</small>` : ""}</span></button></li>`;
  glowny.innerHTML = `<article class="karta prowincja akwen"><h2>${esc(nazwaAkwenu(a))}</h2><p class="rasa">${a.typ === "jezioro" ? "jezioro" : "akwen morski"} · ${esc(a.id)}</p>
    ${a.typ === "jezioro" ? `<p class="opis-sekcji">Flota wpłynie tu tylko z umiejętnością frakcji „żegluga śródlądowa” (też rzekami).</p>` : ""}
    ${gm ? `<form class="edycja-akwenu"><label class="szeroko">Nazwa <input name="nazwa" maxlength="80" value="${esc(stan.akweny?.[a.id]?.nazwa || "")}" placeholder="Akwen ${esc(a.id.slice(1))}"></label></form>` : ""}
    <section><h3>Sąsiednie akweny</h3>${a.sasiedzi.length ? `<ul class="sasiedzi">${a.sasiedzi.map(([j, t]) => przycisk(`data-a="${j}"`, nazwaAkwenu(AKWENY[j - 1]), [t === "rzeka" && "przez rzekę", AKWENY[j - 1].typ === "jezioro" && "jezioro"].filter(Boolean).join(" · "))).join("")}</ul>` : `<p class="opis-sekcji">Zamknięty akwen — nie łączy się z innymi.</p>`}</section>
    <section><h3>Wybrzeże</h3>${a.brzeg.length ? `<ul class="sasiedzi">${a.brzeg.map(i => { const q = PROWINCJE[i - 1]; return przycisk(`data-i="${i}"`, nazwaProwincji(q), wlascicielPo(stan.prowincje?.[q.id]?.wlasciciel)?.nazwa); }).join("")}</ul>` : `<p class="opis-sekcji">Otwarte morze — bez lądu.</p>`}</section></article>`;
  glowny.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { const q = AKWENY[b.dataset.a - 1]; pokazAkwen(+b.dataset.a); mapa.pokaz(q.x, q.y); });
  glowny.querySelectorAll(".sasiedzi [data-i]").forEach(b => b.onclick = () => { const q = PROWINCJE[b.dataset.i - 1]; pokazProwincje(+b.dataset.i); mapa.pokaz(q.x, q.y); });
  const pole = glowny.querySelector("input[name=nazwa]");
  if (pole) pole.onchange = () => { const v = pole.value.trim(); stan.akweny ??= {}; v ? stan.akweny[a.id] = { nazwa: v } : delete stan.akweny[a.id]; zapiszProwincje([["a", a.id]]); pokazAkwen(n); };
  glowny.scrollTop = 0; otworzSzuflade(); requestAnimationFrame(() => mapa.doWidoku(a.x, a.y));
}
// karta prowincji: właściciel, nazwa, opis — edytuje GM/admin, widzą wszyscy (decyzje 6.3)
// stan.prowincje[id] = { wlasciciel: idFrakcji | "npc:<id>", nazwa, opis }; brak wpisu = ziemia niczyja
// stan.npc[id] = { nazwa, rodzaj: "wasal" | "marionetka", zwierzchnik: idFrakcji, opis } — kraj NPC w odcieniu koloru zwierzchnika (decyzja użytkownika)
//   albo { nazwa, rodzaj: "samodzielny", kolor: "#rrggbb", opis } — bez zwierzchnika, z własnym kolorem (7.10)
// id prowincji to numer z rysunku (wewnętrzny), „D…” = dolne kontynenty, „90a/90b” = bliźniacze wyspy
const NAZWY_GRANIC = { "zwykła": ["zwykła", "g-zwykla"], "góry": ["góry", "g-gory"], "rzeka": ["rzeka", "g-rzeka"], "most": ["rzeka z mostem", "g-most"] };
const RODZAJE_NPC = { wasal: "wasal", marionetka: "marionetka", samodzielny: "samodzielny" };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => "#" + c.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
let propozycje = [];   // oczekujące propozycje (GM: wszystkie, gracz: swoje) — używają też armie i mapa (7.14)
const frakcjaPo = id => stan.frakcje.find(f => f.id === id);
// kolejne kraje NPC zwierzchnika: na przemian jaśniej i ciemniej, coraz mocniej
function kolorNpc(id) {
  const n = stan.npc?.[id]; if (n?.rodzaj === "samodzielny") return n.kolor || "#808080";
  const z = frakcjaPo(n?.zwierzchnik); if (!z) return "#808080";
  const k = Object.keys(stan.npc).filter(x => stan.npc[x].zwierzchnik === n.zwierzchnik).sort().indexOf(id);
  const sila = 0.3 + 0.15 * (k >> 1), cel = k % 2 ? 0 : 255;
  return hex(rgb(z.kolor).map(v => v + (cel - v) * Math.min(sila, 0.75)));
}
// właściciel prowincji jako { nazwa, kolor, opis tekstem } albo null
function wlascicielPo(id) {
  if (id?.startsWith("npc:")) {
    const n = stan.npc?.[id.slice(4)], z = frakcjaPo(n?.zwierzchnik); if (!n) return null;
    return { nazwa: n.nazwa, kolor: kolorNpc(id.slice(4)), opis: `kraj NPC — ${RODZAJE_NPC[n.rodzaj] || "wasal"}${z && n.rodzaj !== "samodzielny" ? ` ${z.nazwa}` : ""}` };
  }
  const f = frakcjaPo(id); return f && { nazwa: f.nazwa, kolor: f.kolor, opis: "" };
}
// typ granicy p–sąsiad j: zmiana GM (stan.prowincje[id].granice = {idSąsiada: typ}, 6.2d) albo wykryty z rysunku;
// rzeka z mostem (6.2e): stan.prowincje[id].mosty = {idSąsiada: [x, y] (px mapa.png)} — zapisany po obu stronach
function typGranicy(p, j, wykryty) {
  const d = stan.prowincje?.[p.id], q = PROWINCJE[j - 1].id, t = d?.granice?.[q] ?? wykryty;
  return t === "rzeka" && d?.mosty?.[q] ? "most" : t;
}
// wpis po obu stronach granicy p–q: pole "granice" | "mosty", wartość null = usuń; puste obiekty sprzątane
function ustawGranice(p, q, pole, v) {
  for (const [a, b] of [[p, q], [q, p]]) {
    const d = (stan.prowincje ??= {})[a.id] ??= {}, g = d[pole] ??= {};
    v === null ? delete g[b.id] : g[b.id] = v;
    if (!Object.keys(g).length) delete d[pole];
    if (!Object.keys(d).length) delete stan.prowincje[a.id];
  }
}
const nazwaProwincji = p => stan.prowincje?.[p.id]?.nazwa || `Prowincja ${p.id}`;
// 0.2.1: prowincja = jeden obszar (wcześniej dwa). Wpis „34” z 0.2.0 przechodzi na „34a” i „34b” (te same dane w obu) — robi to GM przy wejściu
const ID_PROWINCJI = new Set(PROWINCJE.map(p => p.id));
function przeniesStareProwincje() {
  if (!gm) return;
  const zmiany = [];
  for (const [id, d] of Object.entries(stan.prowincje || {})) {
    if (ID_PROWINCJI.has(id) || !ID_PROWINCJI.has(id + "a")) continue;
    for (const nowe of [id + "a", id + "b"]) if (ID_PROWINCJI.has(nowe) && !stan.prowincje[nowe]) { stan.prowincje[nowe] = structuredClone(d); zmiany.push(["p", nowe]); }
    delete stan.prowincje[id]; zmiany.push(["p", id]);
  }
  if (zmiany.length) zapiszProwincje(zmiany);
}
// osady (6.2a): stan.prowincje[id].osady = [{typ: "miasto" | "wioska", x, y, nazwa?}] — zapisywane dopiero po edycji (6.2c);
// do tego czasu domyślne miejsca z prowincje.json. Nazwy opcjonalne — wpisuje GM albo gracz (decyzja użytkownika: bez generatora)
const TYPY_OSAD = ["miasto", "wioska", "wioska"];
// nazwy w stan.nazwyOsad[id] = {numer osady: nazwa} — osobne dokumenty nazwy_osad/{id}, bo gracz-właściciel może zmieniać tylko je (reguły)
const osadyProwincji = p => (stan.prowincje?.[p.id]?.osady || p.osady.map(([x, y], k) => ({ typ: TYPY_OSAD[k], x, y })))
  .map((o, k) => ({ ...o, nazwa: stan.nazwyOsad?.[p.id]?.[k] || o.nazwa || "" }));
// GM (6.2c): dodawanie / usuwanie osad i stolica. Lista osad zapisuje się w prowincji dopiero przy pierwszej zmianie (wcześniej domyślna).
// Nazwy są pod numerem osady (nazwy_osad) — po usunięciu osady numery dalszych przesuwają się o jeden.
const zapisaneOsady = p => ((stan.prowincje ??= {})[p.id] ??= {}).osady ??= p.osady.map(([x, y], k) => ({ typ: TYPY_OSAD[k], x, y }));
// stolica frakcji / kraju NPC: osada typu „stolica” w prowincji tego właściciela (jedna — nowa zastępuje starą)
function stolicaWl(wl) {
  for (const p of PROWINCJE) {
    const d = stan.prowincje?.[p.id]; if (!wl || d?.wlasciciel !== wl) continue;
    const k = (d.osady || []).findIndex(o => o.typ === "stolica");
    if (k >= 0) return { p, k, o: d.osady[k], nazwa: stan.nazwyOsad?.[p.id]?.[k] || "" };
  }
  return null;
}
// budynki i złoże (6.4): {sloty: [zasób | ""], zloze: zasób | ""}; zasób = id wspólnego typu albo "u:<nazwa>" unikalnego zasobu frakcji
// (shortcut: unikalne po nazwie jak w turach — zmiana nazwy unikalnego zasobu zostawia stary wpis jako „brak na liście”)
// u frakcji: f.budynki[idProwincji] (dokument tajne_budynki, domyślnie jawny); u kraju NPC i ziemi niczyjej: stan.prowincje[id].budynki (jawne)
// sloty po kolei według osad: miasto i stolica po 2, wioska 1
const slotyOsady = o => o.typ === "wioska" ? 1 : 2;
const nazwaZasobu = v => v.startsWith("u:") ? v.slice(2) : stan.zasoby.find(z => z.id === v)?.nazwa || "?";
// populacji nie produkuje budynek (prośba użytkownika)
const zasobyWl = wl => [...stan.zasoby.filter(z => z.id !== "populacja").map(z => [z.id, z.nazwa]), ...(frakcjaPo(wl)?.zasoby || []).map(z => ["u:" + z.nazwa, z.nazwa])];
function budynki(p) {   // null = tajne
  const d = stan.prowincje?.[p.id], f = frakcjaPo(d?.wlasciciel);
  return f ? (f._brak?.budynki ? null : f.budynki?.[p.id] || {}) : d?.budynki || {};
}
function ustawBudynki(p, b, wl = stan.prowincje?.[p.id]?.wlasciciel) {   // b = null albo puste → usuń; od razu zapisuje
  const pusty = !b || (!b.zloze && !(b.sloty || []).some(Boolean)), f = frakcjaPo(wl);
  if (f) { f.budynki ??= {}; pusty ? delete f.budynki[p.id] : f.budynki[p.id] = b; return zapisz(stan); }
  const d = (stan.prowincje ??= {})[p.id] ??= {}; pusty ? delete d.budynki : d.budynki = b;
  if (!Object.keys(d).length) delete stan.prowincje[p.id];
  zapiszProwincje([["p", p.id]]);
}
let stawianie = null;   // { i (indeks prowincji), typ } — czeka na klik w mapę
function napisz(sel, t) { const k = glowny.querySelector(sel); if (k) k.textContent = t; }
const komunikatOsad = t => napisz(".komunikat-osad", t);
function postawOsade(i, x, y) {
  const s = stawianie; stawianie = null; mapa.kursor(false);
  if (s.typ === "most") return postawMost(s.i, x, y);
  if (i !== s.i) { pokazProwincje(s.i, true); return komunikatOsad("Osadę stawiasz w prowincji, którą edytujesz — kliknij jeszcze raz „+ Miasto” albo „+ Wioska”."); }
  const p = PROWINCJE[i - 1]; stan.prowincje ??= {};
  zapisaneOsady(p).push({ typ: s.typ, x: Math.round(x), y: Math.round(y) });
  zapiszProwincje([["p", p.id]]); pokazOsadyNaMapie(); pokazProwincje(i, true);
}
// most: klik na rzece przy edytowanej prowincji — sąsiad z granicą rzeczną najbliżej klikniętego miejsca
function postawMost(i, x, y) {
  const p = PROWINCJE[i - 1], blisko = mapa.wokol(x, y, 30);
  const q = [...blisko].filter(([j]) => j !== i && j <= NP && typGranicy(p, j, p.sasiedzi.find(([s]) => s === j)?.[1]) === "rzeka").sort((a, b) => a[1] - b[1])[0];
  pokazProwincje(i, true);
  if (!blisko.has(i) || !q) return napisz(".komunikat-mostu", "Tu nie ma rzeki na granicy tej prowincji — kliknij „+ Most” i wskaż miejsce na rzece tuż przy niej.");
  ustawGranice(p, PROWINCJE[q[0] - 1], "mosty", [Math.round(x), Math.round(y)]);
  zapiszProwincje([["p", p.id], ["p", PROWINCJE[q[0] - 1].id]]); pokazOsadyNaMapie(); pokazProwincje(i, true);
}
addEventListener("keydown", e => { if (e.key === "Escape" && stawianie) { const i = stawianie.i; stawianie = null; mapa.kursor(false); pokazProwincje(i, true); } });
const mozeNazywac = d => gm || (!PODGLAD && Boolean(profil?.frakcja) && d.wlasciciel === profil.frakcja);
// gracz-właściciel prowincji wysyła GM propozycję (stolica, budynki — 7.12, 7.13)
const propozycjaGracza = d => CHMURA && !PODGLAD && !gm && Boolean(profil?.frakcja) && d.wlasciciel === profil.frakcja;
// stolica w osadzie k prowincji p (miasto) — stara stolica właściciela wraca do miasta
function ustawStolice(p, k) {
  const wl = stan.prowincje?.[p.id]?.wlasciciel, zmiany = [["p", p.id]], stara = stolicaWl(wl);
  if (stara) { zapisaneOsady(stara.p)[stara.k].typ = "miasto"; if (stara.p.id !== p.id) zmiany.push(["p", stara.p.id]); }
  zapisaneOsady(p)[k].typ = "stolica";
  const f = frakcjaPo(wl);   // stolica bez nazwy dostaje nazwę z karty frakcji (pole „Stolica”)
  if (!stan.nazwyOsad?.[p.id]?.[k] && f?.stolica) { ((stan.nazwyOsad ??= {})[p.id] ??= {})[k] = f.stolica; zapiszNazwyOsad(p.id); }
  zapiszProwincje(zmiany); pokazOsadyNaMapie();
}
const opisOsady = (p, k) => `${osadyProwincji(p)[k]?.nazwa || "miasto bez nazwy"} (${nazwaProwincji(p)})`;
const opisStolicy = wl => { const s = stolicaWl(wl); return s ? opisOsady(s.p, s.k) : "brak stolicy"; };
const tylkoBudynki = b => ({ sloty: b?.sloty || [], zloze: b?.zloze || "" });
const tekstBudynkow = (p, b) => { let n = 0; const nz = v => v ? nazwaZasobu(v) : "pusty";
  return osadyProwincji(p).map(o => { const od = n; n += slotyOsady(o);
    return `${NAZWY_TYPOW[o.typ]}${o.nazwa ? ` ${o.nazwa}` : ""}: ${Array.from({ length: slotyOsady(o) }, (_, s) => nz(b?.sloty?.[od + s])).join(", ")}`; })
    .concat(`Złoże: ${nz(b?.zloze)}`).join("\n\n"); };
async function wyslijPropozycje(p) {
  try { await zaproponuj(p); alert("Propozycja wysłana do GM. Jej status zobaczysz na karcie swojego państwa."); }
  catch (e) { alert("Nie udało się wysłać propozycji: " + komunikat(e)); }
}
const NAZWY_TYPOW = { miasto: "Miasto", wioska: "Wioska", stolica: "Stolica" };
const mostyNaMapie = () => Object.entries(stan.prowincje || {}).flatMap(([a, d]) => Object.entries(d.mosty || {}).filter(([b]) => a < b).map(([, [x, y]]) => ({ typ: "most", x, y })));
const pokazOsadyNaMapie = () => { if (!stan.frakcje) return;   // przed wczytaniem stanu (logowanie: propozycje i ikony przychodzą wcześniej)
  mapa.ustawOsady(PROWINCJE.flatMap(osadyProwincji).concat(mostyNaMapie(), armieNaMapie(), flotyNaMapie(), bitwyNaMapie())); mapa.ustawTrasy([...liniaTraktatowNaMapie(), ...trasyNaMapie()]); blokiNaMapie(); };
// znaczniki armii (7.1b): sztandar armia.png z flagą w kolorach-kluczach (magenta) przemalowaną na kolor frakcji; kilka armii w jednym miejscu — obok siebie
// floty (7.8c): okręt flota.png, ten sam mechanizm kolorów-kluczy
const szablony = Object.fromEntries(["armia", "flota"].map(t => [t, Object.assign(new Image(), { src: IKONY_OSAD[t] || "", onload: () => pokazOsadyNaMapie() })])), ikonyKraju = new Map();   // przed zalogowaniem (chmura) stanu gry jeszcze nie ma
const ikonaArmii = kolor => ikonaKraju("armia", kolor);
function ikonaKraju(typ, kolor) {
  const szablon = szablony[typ], klucz = typ + kolor;
  if (!szablon.complete || !szablon.naturalWidth) return IKONY_OSAD[typ];
  if (ikonyKraju.has(klucz)) return ikonyKraju.get(klucz);
  const c = document.createElement("canvas"); c.width = szablon.naturalWidth; c.height = szablon.naturalHeight;
  const x = c.getContext("2d"); x.drawImage(szablon, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), k = rgb(kolor), px = d.data;
  const klucze = { "255,0,255": k, "255,120,255": k.map(v => Math.min(255, v + 50)), "160,0,160": k.map(v => v * 0.6) };
  for (let i = 0; i < px.length; i += 4) { const z = klucze[`${px[i]},${px[i + 1]},${px[i + 2]}`]; if (z) [px[i], px[i + 1], px[i + 2]] = z; }
  x.putImageData(d, 0, 0); ikonyKraju.set(klucz, c.toDataURL()); return ikonyKraju.get(klucz);
}
// znaczniki flot: w środku akwenu (stan.pozycjeFlot[id] = {f, a: nr akwenu}); kilka flot w akwenie — obok siebie
function flotyNaMapie() {
  const wAkwenie = new Map();
  return Object.entries(stan.pozycjeFlot || {}).flatMap(([id, poz]) => {
    const a = AKWENY[poz.a - 1], f = frakcjaPo(poz.f); if (!a || !f) return [];
    const n = wAkwenie.get(poz.a) || 0; wAkwenie.set(poz.a, n + 1);
    const fl = f.floty?.find(z => z.id === id);
    return [{ typ: "flota", x: a.x, y: a.y, dx: n * 44, ikona: ikonaKraju("flota", f.kolor), tytul: `${f.nazwa} — ${fl ? `${fl.nazwa}, ${liczebnosc(fl)} ${odmiana(liczebnosc(fl), "okręt", "okręty", "okrętów")}` : "flota"}`,
      klik: () => (wybierz(f.id), glowny.querySelector("section.floty")?.scrollIntoView({ block: "start" })) }];
  });
}
function armieNaMapie() {
  const wMiejscu = new Map();
  return Object.entries(stan.pozycjeArmii || {}).flatMap(([id, poz]) => {
    const p = PROWINCJE.find(q => q.id === poz.p), f = frakcjaPo(poz.f); if (!p || !f) return [];
    const o = poz.o >= 0 && osadyProwincji(p)[poz.o], x = o ? o.x : p.x, y = o ? o.y : p.y, miejsce = `${x},${y}`;
    const n = wMiejscu.get(miejsce) || 0; wMiejscu.set(miejsce, n + 1);
    const a = f.armie?.find(z => z.id === id);
    return [{ typ: "armia", x, y, dx: n * 30, ikona: ikonaArmii(f.kolor), tytul: `${f.nazwa} — ${a ? `${a.nazwa}, ${liczebnosc(a)} żołnierzy` : "armia"}`,
      klik: () => celowanie ? (celowanie.a.id !== id && (celowanie.bitwa ? wymusBitwe(id) : !celowanie.przestaw && ustawCel({ armia: id }))) : (wybierz(f.id), glowny.querySelector("section.armie")?.scrollIntoView({ block: "start" })) }];
  });
}
// teren prowincji: zmiana GM (stan.prowincje[id].teren) albo startowy z tereny.json; „rownina” = trawa z teren.png
const TYPY_TERENU = { rownina: "Równina", las: "Las", pustynia: "Pustynia", bagno: "Bagno", tundra: "Tundra" };
const terenProwincji = p => stan.prowincje?.[p.id]?.teren || TERENY[p.id] || "rownina";
const pokazTereny = () => mapa.ustawTereny(PROWINCJE.map(p => { const t = terenProwincji(p); return t === "rownina" ? undefined : t; }));
function kolorujMape() {
  pokazTereny();
  mapa.ustawKolory(PROWINCJE.map(p => { const w = wlascicielPo(stan.prowincje?.[p.id]?.wlasciciel); return w && rgb(w.kolor); }));
  mapa.ustawHerby(herbyNaMapie());
}
// herby graczy przy oddaleniu (7.6d): w największym skupisku prowincji frakcji (sąsiedztwo), w prowincji najbliżej jego środka;
// rozmiar ~ 60% krótszego boku skupiska, 260–700 px mapy (ok. 40 px na ekranie przy pełnym oddaleniu); ramki w px prowincje.png = 1/2 mapy
function herbyNaMapie() {
  return stan.frakcje.flatMap(f => {
    const url = herbFrakcji(f), moje = new Set(PROWINCJE.flatMap((p, i) => stan.prowincje?.[p.id]?.wlasciciel === f.id ? [i + 1] : []));
    if (!url || !moje.size) return [];
    let naj = [];
    for (const start of moje) {
      if (naj.includes(start) || naj.length > moje.size / 2) continue;
      const grupa = [start], byly = new Set(grupa);
      for (let k = 0; k < grupa.length; k++) for (const [j] of PROWINCJE[grupa[k] - 1].sasiedzi) if (moje.has(j) && !byly.has(j)) { byly.add(j); grupa.push(j); }
      if (grupa.length > naj.length) naj = grupa;
    }
    const pr = naj.map(i => PROWINCJE[i - 1]), sx = pr.reduce((s, p) => s + p.x, 0) / pr.length, sy = pr.reduce((s, p) => s + p.y, 0) / pr.length;
    const srodek = pr.reduce((a, p) => Math.hypot(p.x - sx, p.y - sy) < Math.hypot(a.x - sx, a.y - sy) ? p : a);
    const bok = Math.min(Math.max(...pr.map(p => p.ramka[2])) - Math.min(...pr.map(p => p.ramka[0])), Math.max(...pr.map(p => p.ramka[3])) - Math.min(...pr.map(p => p.ramka[1]))) * 2;
    return [{ x: srodek.x, y: srodek.y, rozmiar: Math.min(700, Math.max(260, bok * 0.6)), url }];
  });
}
function sekcjaBudynkow(p, d) {
  const b = budynki(p), os = osadyProwincji(p), opcje = zasobyWl(d.wlasciciel), gracz = propozycjaGracza(d), ed = gm || gracz;
  if (b === null) return `<section><h3>Budynki i złoże</h3><p class="tajne">🔒 Tajne — widzi tylko właściciel i GM.</p></section>`;
  const nazwa = v => v ? esc(nazwaZasobu(v)) : `<span class="puste">pusty</span>`;
  const wybor = (v = "", attr, opis) => `<select class="slot" ${attr} aria-label="${esc(opis)}"><option value="">— pusty —</option>${opcje.map(([id, n]) => `<option value="${esc(id)}"${id === v ? " selected" : ""}>${esc(n)}</option>`).join("")}${v && !opcje.some(([id]) => id === v) ? `<option value="${esc(v)}" selected>${esc(nazwaZasobu(v))} (brak na liście)</option>` : ""}</select>`;
  let n = 0;
  const wiersze = os.map(o => {
    const od = n; n += slotyOsady(o);
    const sloty = Array.from({ length: slotyOsady(o) }, (_, s) => ed ? wybor(b.sloty?.[od + s], `data-slot="${od + s}"`, `${NAZWY_TYPOW[o.typ]} ${o.nazwa}, slot ${s + 1}`) : nazwa(b.sloty?.[od + s]));
    return `<li><span class="typ-osady">${NAZWY_TYPOW[o.typ]}${o.nazwa ? ` ${esc(o.nazwa)}` : ""}</span><span class="sloty">${sloty.join(ed ? "" : ", ")}</span></li>`;
  });
  return `<section><h3>Budynki i złoże</h3>
    ${os.length ? `<ul class="budynki">${wiersze.join("")}</ul>` : `<p class="puste">Brak osad — brak slotów.</p>`}
    <p class="zloze">Złoże: ${ed ? wybor(b.zloze, "data-zloze", "Złoże prowincji") : nazwa(b.zloze)}</p>
    ${gm ? `<p class="opis-sekcji">Budynek = zasób, który produkuje (wspólne zasoby i unikalne właściciela). Po podboju unikalne zasoby starej frakcji znikają.</p>` : ""}
    ${gracz ? `<p class="opis-sekcji">Wybierz zasoby i wyślij — zmiana trafi do GM do akceptacji.</p><p class="przyciski-tur"><button type="button" class="dodaj" data-prop-budynki>Wyślij propozycję do GM</button></p>` : ""}</section>`;
}
function pokazProwincje(i, zostanPrzewiniecie) {
  const p = PROWINCJE[i - 1]; widok = "p:" + i; mapa.wybierz(i);
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
  const d = stan.prowincje?.[p.id] || {}, wl = wlascicielPo(d.wlasciciel);
  wl ? glowny.style.setProperty("--kolor", wl.kolor) : glowny.style.removeProperty("--kolor");
  const sas = p.sasiedzi.map(([j, t]) => [j, typGranicy(p, j, t)]).sort((a, b) => (a[1] !== "zwykła") - (b[1] !== "zwykła") || PROWINCJE[a[0] - 1].id.localeCompare(PROWINCJE[b[0] - 1].id, "pl", { numeric: true }));
  const zablokowane = sas.filter(([, t]) => t === "góry" || t === "rzeka").length, rzeczne = sas.some(([, t]) => t === "rzeka");
  const opcja = (v, w) => `<option value="${esc(v)}"${v === (d.wlasciciel || "") ? " selected" : ""}>${esc(w)}</option>`;
  const npc = Object.entries(stan.npc || {}).sort((a, b) => a[1].nazwa.localeCompare(b[1].nazwa, "pl"));
  const opcjeWl = opcja("", "— ziemia niczyja —") + `<optgroup label="Frakcje">${stan.frakcje.map(f => opcja(f.id, f.nazwa)).join("")}</optgroup>`
    + (npc.length ? `<optgroup label="Kraje NPC">${npc.map(([id, n]) => opcja("npc:" + id, `${n.nazwa} (${n.rodzaj === "samodzielny" ? "samodzielny" : `${RODZAJE_NPC[n.rodzaj] || "wasal"} ${frakcjaPo(n.zwierzchnik)?.nazwa || "?"}`})`)).join("")}</optgroup>` : "");
  const wlasciciel = wl ? `<b>${esc(wl.nazwa)}</b>${wl.opis ? ` — ${esc(wl.opis)}` : ""}` : "ziemia niczyja";
  glowny.innerHTML = `<article class="karta prowincja"><h2>${esc(nazwaProwincji(p))}</h2>
    <p class="rasa">${wlasciciel}${d.nazwa ? ` · nr ${esc(p.id)}` : ""} · ${TYPY_TERENU[terenProwincji(p)]}</p>
    ${gm ? `<form class="edycja-prowincji">
      <label class="szeroko">Właściciel <select name="wlasciciel">${opcjeWl}</select>${npc.length ? "" : `<small>Kraje NPC (wasale, marionetki) zakładasz w Panelu GM.</small>`}</label>
      <label class="szeroko">Nazwa <input name="nazwa" maxlength="80" value="${esc(d.nazwa || "")}" placeholder="Prowincja ${esc(p.id)}"></label>
      <label class="szeroko">Teren <select name="teren">${Object.entries(TYPY_TERENU).map(([k, n]) => `<option value="${k}"${k === terenProwincji(p) ? " selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="szeroko">Opis <textarea name="opis" rows="4" maxlength="4000">${esc(d.opis || "")}</textarea></label></form>`
      : d.opis ? `<div class="opis">${tekst(d.opis)}</div>` : ""}
    <section><h3>Osady</h3><ul class="osady">${osadyProwincji(p).map((o, k) => `<li><span class="typ-osady${o.typ === "stolica" ? " stolica" : ""}">${o.typ === "stolica" ? "★ " : ""}${NAZWY_TYPOW[o.typ]}</span>
      ${mozeNazywac(d) ? `<input class="nazwa-osady" data-k="${k}" maxlength="60" value="${esc(o.nazwa)}" placeholder="bez nazwy" aria-label="Nazwa: ${NAZWY_TYPOW[o.typ]} ${k}">`
        : o.nazwa ? esc(o.nazwa) : `<span class="puste">bez nazwy</span>`}
      ${gm ? `<span class="akcje-osady">${o.typ === "miasto" && wl ? `<button type="button" class="usun" data-stolica="${k}" title="Ustaw jako stolicę: ${esc(wl.nazwa)}" aria-label="Ustaw jako stolicę">★</button>` : ""}${o.typ === "stolica" ? `<button type="button" class="usun" data-bez-stolicy="${k}" title="Odbierz status stolicy" aria-label="Odbierz status stolicy">☆</button>` : ""}<button type="button" class="usun" data-usun-osade="${k}" title="Usuń osadę" aria-label="Usuń osadę">×</button></span>`
        : o.typ === "miasto" && propozycjaGracza(d) ? `<span class="akcje-osady"><button type="button" class="usun" data-prop-stolica="${k}" title="Zaproponuj GM przeniesienie stolicy tutaj" aria-label="Zaproponuj stolicę tutaj">★</button></span>` : ""}</li>`).join("")
      || `<li class="puste">Brak osad.</li>`}</ul>
      ${gm ? `<p class="przyciski-tur"><button type="button" class="cofnij" data-dodaj="miasto">+ Miasto</button> <button type="button" class="cofnij" data-dodaj="wioska">+ Wioska</button></p>
        <p class="opis-sekcji komunikat-osad">★ przy mieście robi z niego stolicę właściciela prowincji (jedna na frakcję albo kraj NPC).</p>` : ""}</section>
    ${sekcjaBudynkow(p, d)}
    <section><h3>Sąsiedzi</h3>
      ${sas.length ? `<p class="opis-sekcji">${zablokowane ? `Przez góry i rzekę bez mostu armia przejdzie tylko z umiejętnością frakcji (${zablokowane} z ${sas.length} granic).` : "Wszystkie granice zwykłe."}</p>
      <ul class="sasiedzi">${sas.map(([j, t]) => { const q = PROWINCJE[j - 1], f = wlascicielPo(stan.prowincje?.[q.id]?.wlasciciel);
        return `<li><button type="button" data-i="${j}"><span>${esc(nazwaProwincji(q))}${f ? `<small>${esc(f.nazwa)}</small>` : ""}</span>${gm ? "" : `<span class="granica ${NAZWY_GRANIC[t][1]}">${NAZWY_GRANIC[t][0]}</span>`}</button>`
          + (gm ? `<select class="granica ${NAZWY_GRANIC[t][1]}" data-i="${j}" aria-label="Granica z: ${esc(nazwaProwincji(q))}">${Object.entries(NAZWY_GRANIC).filter(([v]) => v !== "most" || t === "most").map(([v, [n]]) => `<option value="${v}"${v === t ? " selected" : ""}>${n}</option>`).join("")}</select>`
            + (t === "most" ? `<button type="button" class="usun" data-usun-most="${j}" title="Usuń most" aria-label="Usuń most z: ${esc(nazwaProwincji(q))}">×</button>` : "") : "") + `</li>`; }).join("")}</ul>
      ${gm && rzeczne ? `<p class="przyciski-tur"><button type="button" class="cofnij" data-most>+ Most</button></p><p class="opis-sekcji komunikat-mostu"></p>` : ""}`
      : `<p class="opis-sekcji">Brak sąsiadów lądowych — wyspa.</p>`}</section></article>`;
  glowny.querySelectorAll(".sasiedzi button").forEach(b => b.onclick = () => { const q = PROWINCJE[b.dataset.i - 1]; pokazProwincje(+b.dataset.i); mapa.pokaz(q.x, q.y); });
  // GM (6.2d): typ granicy — zapisany po obu stronach; równy wykrytemu z rysunku = wpis usuwany
  glowny.querySelectorAll("select.granica").forEach(pole => pole.onchange = () => {
    const j = +pole.dataset.i, q = PROWINCJE[j - 1], wykryty = p.sasiedzi.find(([x]) => x === j)[1];
    ustawGranice(p, q, "granice", pole.value === wykryty ? null : pole.value);
    ustawGranice(p, q, "mosty", null);   // zmiana typu granicy usuwa most
    zapiszProwincje([["p", p.id], ["p", q.id]]); pokazOsadyNaMapie(); pokazProwincje(i, true);
  });
  // GM (6.2e): most — „+ Most”, potem klik na rzece; × usuwa
  glowny.querySelector("[data-most]")?.addEventListener("click", () => {
    stawianie = { i, typ: "most" }; mapa.kursor(true);
    napisz(".komunikat-mostu", "Kliknij na mapie miejsce na rzece przy tej prowincji, gdzie postawić most. Esc — anuluj.");
  });
  glowny.querySelectorAll("[data-usun-most]").forEach(b => b.onclick = () => {
    const q = PROWINCJE[b.dataset.usunMost - 1];
    ustawGranice(p, q, "mosty", null); zapiszProwincje([["p", p.id], ["p", q.id]]); pokazOsadyNaMapie(); pokazProwincje(i, true);
  });
  // GM (6.4): sloty i złoże — każda zmiana zapisuje całość
  const zebraneBudynki = () => {
    const sloty = [...glowny.querySelectorAll("select[data-slot]")].map(s => s.value);
    while (sloty.length && !sloty.at(-1)) sloty.pop();
    return { sloty, zloze: glowny.querySelector("select[data-zloze]").value };
  };
  if (gm) glowny.querySelectorAll("select.slot").forEach(pole => pole.onchange = () => { ustawBudynki(p, zebraneBudynki()); pokazProwincje(i, true); });
  glowny.querySelectorAll(".nazwa-osady").forEach(pole => pole.onchange = () => {
    const n = { ...stan.nazwyOsad?.[p.id] }, v = pole.value.trim();
    v ? n[pole.dataset.k] = v : delete n[pole.dataset.k];
    (stan.nazwyOsad ??= {})[p.id] = n; zapiszNazwyOsad(p.id); pokazOsadyNaMapie();
  });
  // GM: osady — dodaj (klik w mapę), usuń, stolica
  glowny.querySelectorAll("[data-dodaj]").forEach(b => b.onclick = () => {
    stawianie = { i, typ: b.dataset.dodaj }; mapa.kursor(true);
    komunikatOsad(`Kliknij na mapie miejsce w tej prowincji, gdzie postawić ${b.dataset.dodaj === "miasto" ? "miasto" : "wioskę"}. Esc — anuluj.`);
  });
  glowny.querySelectorAll("[data-usun-osade]").forEach(b => b.onclick = () => {
    const k = +b.dataset.usunOsade, nazwa = osadyProwincji(p)[k]?.nazwa, os = zapisaneOsady(p);
    if (!confirm(`Usunąć: ${NAZWY_TYPOW[os[k].typ].toLowerCase()}${nazwa ? ` „${nazwa}”` : ""}?`)) return;
    const bud = budynki(p), od = osadyProwincji(p).slice(0, k).reduce((n, o) => n + slotyOsady(o), 0), ile = slotyOsady(os[k]);
    os.splice(k, 1);
    if (bud?.sloty?.length > od) { const s = [...bud.sloty]; s.splice(od, ile); ustawBudynki(p, { ...bud, sloty: s }); }   // sloty usuniętej osady znikają
    const stare = stan.nazwyOsad?.[p.id] || {}, nowe = {};   // nazwy osad za usuniętą — numer o jeden w dół
    for (const [n, v] of Object.entries(stare)) if (+n !== k) nowe[+n > k ? +n - 1 : +n] = v;
    (stan.nazwyOsad ??= {})[p.id] = nowe;
    zapiszProwincje([["p", p.id]]); if (Object.keys(stare).length) zapiszNazwyOsad(p.id); pokazOsadyNaMapie(); pokazProwincje(i, true);
  });
  glowny.querySelectorAll("[data-stolica]").forEach(b => b.onclick = () => { ustawStolice(p, +b.dataset.stolica); pokazProwincje(i, true); });
  glowny.querySelectorAll("[data-prop-stolica]").forEach(b => b.onclick = () => {
    const k = +b.dataset.propStolica, nowa = opisOsady(p, k);
    if (confirm(`Zaproponować GM przeniesienie stolicy do: ${nowa}?`)) wyslijPropozycje({ frakcja: d.wlasciciel, cel: "stolica", celId: p.id,
      nazwa: `Stolica → ${nowa}`, zmiany: { osada: k }, przed: { osada: opisStolicy(d.wlasciciel) } });
  });
  glowny.querySelector("[data-prop-budynki]")?.addEventListener("click", () => wyslijPropozycje({ frakcja: d.wlasciciel, cel: "budynki", celId: p.id,
    nazwa: `Budynki — ${nazwaProwincji(p)}`, zmiany: { budynki: zebraneBudynki() }, przed: { budynki: tylkoBudynki(budynki(p)) } }));
  glowny.querySelectorAll("[data-bez-stolicy]").forEach(b => b.onclick = () => {
    zapisaneOsady(p)[+b.dataset.bezStolicy].typ = "miasto"; zapiszProwincje([["p", p.id]]); pokazOsadyNaMapie(); pokazProwincje(i, true);
  });
  const form = glowny.querySelector(".edycja-prowincji");
  if (form) form.onchange = () => {
    const v = Object.fromEntries(new FormData(form)), n = { ...stan.prowincje?.[p.id], wlasciciel: v.wlasciciel, nazwa: v.nazwa.trim(), opis: v.opis.trim(),
      teren: v.teren === (TERENY[p.id] || "rownina") ? "" : v.teren };   // zapisujemy tylko zmianę względem startowego   // bieżący stan — nazwy osad mogły się zmienić po narysowaniu karty
    ustawProwincje(p, n); pokazProwincje(i, true);
  };
  if (!zostanPrzewiniecie) glowny.scrollTop = 0;
  otworzSzuflade();
  requestAnimationFrame(() => mapa.doWidoku(p.x, p.y));   // po zwężeniu mapy przez szufladę
}
// nowe dane prowincji (karta GM albo zdobycie w bitwie 7.1i): przy zmianie właściciela podbita stolica przestaje nią być,
// budynki przechodzą (bez unikalnych zasobów starej frakcji), wpis w kronice
function ustawProwincje(p, n) {
  const d = stan.prowincje?.[p.id] || {};
  {
    if (n.wlasciciel !== d.wlasciciel && n.osady?.some(o => o.typ === "stolica")) n.osady = n.osady.map(o => o.typ === "stolica" ? { ...o, typ: "miasto" } : o);   // podbita stolica przestaje nią być
    // podbój (6.4): budynki i złoże przechodzą do nowego właściciela, poza unikalnymi zasobami starej frakcji
    const bud = n.wlasciciel !== d.wlasciciel && budynki(p), bezU = v => v?.startsWith("u:") ? "" : v || "";
    if (bud) delete n.budynki;
    if (bud) { const f = frakcjaPo(d.wlasciciel); if (f?.budynki?.[p.id]) { delete f.budynki[p.id]; zapisz(stan); } }
    stan.prowincje ??= {};
    if (Object.values(n).some(Boolean)) stan.prowincje[p.id] = Object.fromEntries(Object.entries(n).filter(([, w]) => w)); else delete stan.prowincje[p.id];
    if (bud) ustawBudynki(p, { sloty: (bud.sloty || []).map(bezU), zloze: bezU(bud.zloze) });
    if ((n.wlasciciel || "") !== (d.wlasciciel || "")) { wpiszKronike("wlasciciel", `${nazwaProwincji(p)}: ${nazwaKraju(d.wlasciciel)} → ${nazwaKraju(n.wlasciciel)}`, [d.wlasciciel, n.wlasciciel], { d: { prowincja: nazwaProwincji(p), A: d.wlasciciel || "", B: n.wlasciciel || "", p: p.id } }); zapisz(stan); }
    zapiszProwincje([["p", p.id]]); kolorujMape(); pokazOsadyNaMapie();
  }
}
// edycję (zasoby, stany, tury, jednostki, statusy bohaterów) widzą tylko GM i admin; w DEMO każdy — ustawiane po zalogowaniu
let gm = !CHMURA && !PODGLAD;   // DEMO: każdy jest GM (podgląd na telefon — nikt)
// część tajna: f._brak[rodzaj] = tej części nie wolno czytać (magazyn jej nie wczytał); f.jawne[rodzaj] = GM ujawnił ją wszystkim
const RODZAJE_TAJNE = { zasoby: "Zasoby", jednostki: "Jednostki", statusy: "Statusy bohaterów", budynki: "Budynki i złoża", armie: "Armie i floty (skład, trasa)" };
const tajne = (f, r) => Boolean(f._brak?.[r]);
const jawneR = (f, r) => r === "budynki" ? f.jawne?.budynki !== false : Boolean(f.jawne?.[r]);   // budynki domyślnie jawne (6.4)
const kłódka = `<p class="tajne">🔒 Tajne — widzi tylko gracz tej frakcji i GM.</p>`;
const moja = f => Boolean(profil?.frakcja) && profil.frakcja === f.id;
// znacznik przy nagłówku dla tych, którzy widzą tajne dane: czy reszta graczy też to widzi
const znacznik = (f, r) => gm || moja(f) ? `<span class="znacznik">${jawneR(f, r) ? "👁 jawne" : "🔒 tajne"}</span>` : "";
// stany zasobów frakcji: globalne w f.stany[id], unikalne w z.ilosc
// pole tekstowe zamiast number, żeby wklejone „1 234” też przeszło
const liczba = w => { const t = w.replace(/[\s ]/g, ""); return t === "" ? undefined : /^-?\d+$/.test(t) ? +t : null; };
// tury: stan.tury = [{ nr, data, frakcje: { id: { stany: {idZasobu: n}, unikalne: {nazwa: n} } } }] — migawki z końca tury
// zmiana +/- = obecna wartość minus wartość z ostatniej migawki (unikalne po nazwie, bo nie mają id)
const ostatniaTura = () => stan.tury.at(-1);
const zmiana = (wartosc, poprzednia) => {
  if (!ostatniaTura() || wartosc === undefined || poprzednia === undefined || wartosc === poprzednia) return "";
  const r = wartosc - poprzednia;
  return `<span class="zmiana ${r > 0 ? "plus" : "minus"}" title="Zmiana od końca tury ${ostatniaTura().nr}">${r > 0 ? "+" : "−"}${Math.abs(r)}</span>`;
};
const poprzednia = (f, p) => {
  const m = ostatniaTura()?.frakcje[f.id];
  return p.dataset.unikalny !== undefined ? m?.unikalne[f.zasoby[p.dataset.unikalny].nazwa] : m?.stany[p.dataset.id];
};
const wierszStanu = (z, wartosc, dane, pop) => `<li>${ikonaZasobu(z)}<span class="nazwa">${esc(z.nazwa)}</span>
  ${gm ? `<input ${dane} value="${wartosc ?? ""}" inputmode="numeric" placeholder="—" aria-label="Stan: ${esc(z.nazwa)}">` : `<span class="wartosc">${wartosc ?? "—"}</span>`}<span class="jednostka">${esc(z.jednostka || "")}</span>
  <span class="miejsce-zmiany">${zmiana(wartosc, pop)}</span></li>`;
const stany = f => {
  if (tajne(f, "zasoby")) return `<section class="stany"><h3>Zasoby</h3>${kłódka}</section>`;
  const m = ostatniaTura()?.frakcje[f.id];
  return `<section class="stany"><h3>Zasoby <span class="tura">tura ${stan.tury.length + 1}</span>${znacznik(f, "zasoby")}</h3>
  ${m ? `<p class="opis-sekcji">Obok stanu: zmiana od końca tury ${ostatniaTura().nr}.</p>` : ""}<ul class="tabela-zasobow">
  ${stan.zasoby.map(z => wierszStanu(z, f.stany?.[z.id], `data-id="${esc(z.id)}"`, m?.stany[z.id])).join("")}
  ${f.zasoby.map((z, i) => wierszStanu({ ...z, ikona: "" }, z.ilosc, `data-unikalny="${i}"`, m?.unikalne[z.nazwa])).join("")}</ul></section>`;
};
function podepnijStany(f) {
  if (!gm || tajne(f, "zasoby")) return;
  glowny.querySelectorAll(".tabela-zasobow input").forEach(p => p.onchange = () => {
    const n = liczba(p.value), u = p.dataset.unikalny;
    const stary = u !== undefined ? f.zasoby[u].ilosc : f.stany?.[p.dataset.id];
    if (n === null) { p.value = stary ?? ""; p.setAttribute("aria-invalid", "true"); p.title = "Wpisz liczbę całkowitą"; return; }
    p.removeAttribute("aria-invalid"); p.title = ""; p.value = n ?? "";
    if (u !== undefined) { if (n === undefined) delete f.zasoby[u].ilosc; else f.zasoby[u].ilosc = n; }
    else { f.stany ??= {}; if (n === undefined) delete f.stany[p.dataset.id]; else f.stany[p.dataset.id] = n; }
    p.parentElement.querySelector(".miejsce-zmiany").innerHTML = zmiana(n, poprzednia(f, p));
    zapisz(stan);
  });
}
// unikalne zasoby frakcji
const zasoby = f => tajne(f, "zasoby") ? "" : `<section class="unikalne"><h3>Unikalne zasoby</h3>
  <ul class="zasoby">${f.zasoby.map((z, i) => `<li><span><b>${esc(z.nazwa)}</b>${z.jednostka ? ` (${esc(z.jednostka)})` : ""}${z.opis ? ` — ${esc(z.opis)}` : ""}</span>
    ${gm ? `<button type="button" class="usun" data-i="${i}" aria-label="Usuń zasób ${esc(z.nazwa)}" title="Usuń">×</button>` : ""}</li>`).join("")
    || `<li class="puste">${gm ? "Brak — dodaj pierwszy zasób." : "Brak."}</li>`}</ul>
  ${gm ? `<form class="dodaj-zasob"><input name="nazwa" required maxlength="60" placeholder="Nazwa zasobu" aria-label="Nazwa zasobu">
    <input name="jednostka" maxlength="12" placeholder="Jednostka" aria-label="Jednostka zasobu" class="krotkie">
    <input name="opis" maxlength="200" placeholder="Opis (opcjonalnie)" aria-label="Opis zasobu"><button class="dodaj">Dodaj</button></form>` : ""}</section>`;
function podepnijZasoby(f) {
  if (!gm || tajne(f, "zasoby")) return;
  glowny.querySelector(".dodaj-zasob").onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.target), nazwa = d.get("nazwa").trim();
    if (!nazwa) return;
    f.zasoby.push({ nazwa, jednostka: d.get("jednostka").trim(), opis: d.get("opis").trim() }); zapisz(stan); wybierz(f.id, true);
    glowny.querySelector(".dodaj-zasob input").focus();
  };
  glowny.querySelectorAll(".zasoby .usun").forEach(b => b.onclick = () => {
    const z = f.zasoby[b.dataset.i];
    if (confirm(`Usunąć zasób „${z.nazwa}”?`)) { f.zasoby.splice(b.dataset.i, 1); zapisz(stan); wybierz(f.id, true); }
  });
}
// jednostki: f.jednostki = [{ nazwa, opis, poziom, morska?, pojemnosc? }], poziom = indeks w POZIOMY; bez kosztów, dopóki GM nie ustali mechaniki;
// morska (7.8b) = okręt do flot (nie do armii), pojemnosc = ilu żołnierzy mieści jeden okręt (brak = nie liczy się do pojemności floty)
const POZIOMY = ["Chołota", "Regularne", "Elita"];
const polaJednostki = (j = {}) => `<input name="nazwa" required maxlength="60" value="${esc(j.nazwa || "")}" placeholder="Nazwa jednostki" aria-label="Nazwa jednostki">
  <select name="poziom" aria-label="Poziom elitarności">${POZIOMY.map((p, i) => `<option value="${i}"${i === (j.poziom ?? 1) ? " selected" : ""}>${p}</option>`).join("")}</select>
  <label class="morska"><input type="checkbox" name="morska"${j.morska ? " checked" : ""}> okręt</label>
  <input name="pojemnosc" inputmode="numeric" maxlength="7" value="${j.pojemnosc ?? ""}" placeholder="mieści żołnierzy" aria-label="Ilu żołnierzy mieści okręt" title="Ilu żołnierzy mieści jeden okręt (puste = nie przewozi)">
  <textarea name="opis" maxlength="600" rows="2" placeholder="Opis, wyposażenie (opcjonalnie)" aria-label="Opis jednostki">${esc(j.opis || "")}</textarea>`;
const jednostki = f => {
  if (tajne(f, "jednostki")) return `<section class="jednostki"><h3>Jednostki</h3>${kłódka}</section>`;
  const lista = f.jednostki ??= [];
  return `<section class="jednostki"><h3>Jednostki${znacznik(f, "jednostki")}</h3>
  ${[...POZIOMY.map((p, poz) => [p, j => !j.morska && j.poziom === poz]), ["Okręty", j => j.morska]].map(([p, czy]) => { const w = lista.map((j, i) => [j, i]).filter(([j]) => czy(j)); return w.length ? `<h4>${p}</h4><ul class="lista-jednostek">${w.map(([j, i]) =>
    `<li data-i="${i}"><span><b>${esc(j.nazwa)}</b>${j.morska ? ` <small>${POZIOMY[j.poziom ?? 1].toLowerCase()}${j.pojemnosc ? ` · mieści ${j.pojemnosc} żołn.` : ""}</small>` : ""}${j.opis ? ` — ${esc(j.opis)}` : ""}</span>
      ${gm ? `<span class="akcje"><button type="button" class="usun" data-akcja="edytuj" aria-label="Edytuj jednostkę ${esc(j.nazwa)}" title="Edytuj">✎</button>
      <button type="button" class="usun" data-akcja="usun" aria-label="Usuń jednostkę ${esc(j.nazwa)}" title="Usuń">×</button></span>` : ""}</li>`).join("")}</ul>` : ""; }).join("")
    || `<p class="puste">${gm ? "Brak — dodaj pierwszą jednostkę." : "Brak."}</p>`}
  ${gm ? `<form class="dodaj-jednostke">${polaJednostki()}<button class="dodaj">Dodaj</button></form>` : ""}</section>`;
};
function podepnijJednostki(f) {
  if (!gm || tajne(f, "jednostki")) return;
  const odczyt = form => {
    const d = new FormData(form), j = { nazwa: d.get("nazwa").trim(), opis: d.get("opis").trim(), poziom: +d.get("poziom") };
    const poj = parseInt(String(d.get("pojemnosc")).replace(/\s/g, ""));
    if (d.get("morska") === "on") { j.morska = true; if (poj > 0) j.pojemnosc = poj; }
    return j;
  };
  glowny.querySelector(".dodaj-jednostke").onsubmit = e => {
    e.preventDefault(); const j = odczyt(e.target); if (!j.nazwa) return;
    f.jednostki.push(j); zapisz(stan); wybierz(f.id, true);
    glowny.querySelector(".dodaj-jednostke input").focus();
  };
  glowny.querySelectorAll(".lista-jednostek li").forEach(li => {
    const j = f.jednostki[li.dataset.i];
    li.querySelector("[data-akcja=usun]").onclick = () => {
      if (confirm(`Usunąć jednostkę „${j.nazwa}”?`)) { f.jednostki.splice(li.dataset.i, 1); zapisz(stan); wybierz(f.id, true); }
    };
    li.querySelector("[data-akcja=edytuj]").onclick = () => {
      li.innerHTML = `<form class="edytuj-jednostke">${polaJednostki(j)}<button class="dodaj">Zapisz</button><button type="button" class="cofnij">Anuluj</button></form>`;
      const form = li.querySelector("form"); form.nazwa.focus();
      form.querySelector(".cofnij").onclick = () => wybierz(f.id, true);
      form.onsubmit = e => { e.preventDefault(); const n = odczyt(form); if (!n.nazwa) return; delete j.morska; delete j.pojemnosc; Object.assign(j, n); zapisz(stan); wybierz(f.id, true); };
    };
  });
}
const odmiana = (n, jeden, kilka, wiele) => n === 1 ? jeden : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? kilka : wiele;
// trasy armii (7.1c): miejsce = { p: idProwincji, o: numer osady | -1 (w polu) }; jeden krok = sąsiednia prowincja (w polu)
// albo inna osada / pole w tej samej prowincji. Góry i rzeka bez mostu tylko z umiejętnością frakcji (f.przejscia = { gory, rzeki }).
const NR_PROWINCJI = new Map(PROWINCJE.map((p, i) => [p.id, i + 1]));
// umiejętności ruchu frakcji (f.przejscia): armie przez góry / rzeki bez mostu; floty na jeziora i rzekami (7.8a — sprawdza ruch flot w 7.8d)
const PRZEJSCIA = { gory: "armie przez góry", rzeki: "armie przez rzeki (bez mostu)", zegluga: "floty na jeziorach i rzekach (żegluga śródlądowa)" };
const przechodzi = (f, t) => t === "zwykła" || t === "most" || (t === "góry" && Boolean(f?.przejscia?.gory)) || (t === "rzeka" && Boolean(f?.przejscia?.rzeki));
function wyznaczTrase(f, start, cel, moze = t => przechodzi(f, t)) {   // → lista kroków [{p, o}] bez miejsca startu albo null, gdy nie ma drogi; moze(typGranicy) — czy wolno przejść
  if (!start || !cel) return null;
  if (start.p === cel.p) return start.o === cel.o ? [] : [cel];
  const s = NR_PROWINCJI.get(start.p), k = NR_PROWINCJI.get(cel.p); if (!s || !k) return null;
  const skad = new Map([[s, 0]]), kolejka = [s];
  for (let n = 0; n < kolejka.length && !skad.has(k); n++) {
    const i = kolejka[n], p = PROWINCJE[i - 1];
    for (const [j, t] of p.sasiedzi) if (!skad.has(j) && moze(typGranicy(p, j, t))) { skad.set(j, i); kolejka.push(j); }
  }
  if (!skad.has(k)) return null;
  const droga = []; for (let i = k; i !== s; i = skad.get(i)) droga.unshift({ p: PROWINCJE[i - 1].id, o: -1 });
  if (cel.o >= 0) droga.push(cel);
  return droga;
}
// cel armii: a.cel = { p, o } albo { armia: id } (pościg — co turę do aktualnego miejsca, wystarczy wejść do tej prowincji)
function miejsceCelu(a) {
  if (!a.cel) return null;
  if (!a.cel.armia) return a.cel;
  const poz = stan.pozycjeArmii?.[a.cel.armia]; return poz && { p: poz.p, o: -1 };
}
const trasaArmii = (f, a) => wyznaczTrase(f, stan.pozycjeArmii?.[a.id], miejsceCelu(a));
// przeprawa (7.8e): cel, do którego nie ma drogi lądem → najkrótsza (w turach) trasa ląd–morze–ląd: lądem do nadmorskiej prowincji załadunku,
// na pokład (1 tura — wejście do akwenu), 1 akwen na turę, zejście na ląd (1 tura) i lądem do celu. Akweny jak floty (jezioro / rzeka tylko z żeglugą).
// → { lad1, morze: [nr akwenów; pierwszy = załadunek], wyladunek: idProwincji, lad2, tur } albo null
// Armia już na pokładzie (start = {a: nrAkwenu}): morze zaczyna się od akwenu, w którym płynie, lad1 puste.
function trasaPrzeprawy(f, start, cel) {
  const s = start?.a ? 0 : NR_PROWINCJI.get(start?.p), k = NR_PROWINCJI.get(cel?.p); if ((!s && !start?.a) || !k) return null;
  const zasieg = od => { const d = new Map([[od, 0]]), q = [od];
    for (let n = 0; n < q.length; n++) { const p = PROWINCJE[q[n] - 1]; for (const [j, t] of p.sasiedzi) if (!d.has(j) && przechodzi(f, typGranicy(p, j, t))) { d.set(j, d.get(q[n]) + 1); q.push(j); } }
    return d; };
  const dS = s ? zasieg(s) : new Map(), dK = zasieg(k), plynie = (j, t) => f?.przejscia?.zegluga || (t === "morze" && AKWENY[j - 1].typ === "morze");
  const brzeg = (a, d) => AKWENY[a - 1].brzeg.filter(i => d.has(i)).sort((x, y) => d.get(x) - d.get(y))[0];
  const koszt = new Map(), skad = new Map(), gotowe = new Set(); let naj = null;   // Dijkstra po akwenach (ok. 120)
  if (start.a) koszt.set(start.a, 0);
  else AKWENY.forEach((a, i) => { const p = brzeg(i + 1, dS); if (p && (a.typ === "morze" || f?.przejscia?.zegluga)) koszt.set(i + 1, dS.get(p) + 1); });
  while (true) {
    let i = 0, m = Infinity; for (const [j, c] of koszt) if (!gotowe.has(j) && c < m) { m = c; i = j; }
    if (!i || (naj && m >= naj.tur)) break; gotowe.add(i);
    const w = brzeg(i, dK); if (w && (!naj || m + 1 + dK.get(w) < naj.tur)) naj = { a: i, p: w, tur: m + 1 + dK.get(w) };
    for (const [j, t] of AKWENY[i - 1].sasiedzi) if (plynie(j, t) && m + 1 < (koszt.get(j) ?? Infinity)) { koszt.set(j, m + 1); skad.set(j, i); }
  }
  if (!naj) return null;
  const morze = []; for (let i = naj.a; i; i = skad.get(i)) morze.unshift(i);
  const wyladunek = PROWINCJE[naj.p - 1].id, lad2 = wyznaczTrase(f, { p: wyladunek, o: -1 }, cel);
  const lad1 = start.a ? [] : wyznaczTrase(f, start, { p: PROWINCJE[brzeg(morze[0], dS) - 1].id, o: -1 });
  if (!lad1 || !lad2) return null;
  if (lad1.length === 1 && lad1[0].p === start.p) lad1.length = 0;   // z osady prosto na pokład, bez wychodzenia „w pole”
  return { lad1, morze, wyladunek, lad2, tur: lad1.length + morze.length - (start.a ? 1 : 0) + 1 + lad2.length };
}
// linia przeprawy na mapie: ląd łukiem do prowincji załadunku, morze po wodzie do prowincji wyładunku, ląd łukiem do celu; całość jeszcze
// wygładzona, żeby na styku lądu i morza nie było ostrych kątów
function liniaPrzeprawy(start, pr) {
  const l1 = krzywa([start, ...pr.lad1].map(punktMiejsca).filter(Boolean)), l2 = krzywa([{ p: pr.wyladunek, o: -1 }, ...pr.lad2].map(punktMiejsca).filter(Boolean));
  return wygladz([...l1, ...liniaFloty(pr.morze, l1.at(-1), l2[0]).slice(1, -1), ...l2]);
}
const przeprawaArmii = (f, a) => a.cel && !trasaArmii(f, a) ? trasaPrzeprawy(f, stan.pozycjeArmii?.[a.id], miejsceCelu(a)) : null;
// karta floty: armie na pokładzie (ładunek) i armie, które czekają na nią do przeprawy
function ladunekFloty(f, fl) {
  const na = (f.armie || []).filter(a => stan.pozycjeArmii?.[a.id]?.floty?.includes(fl.id));
  const czeka = (f.armie || []).filter(a => !na.includes(a) && a.transport?.includes(fl.id) && przeprawaArmii(f, a));
  return (na.length ? `<br>Na pokładzie: <b>${esc(na.map(a => `${a.nazwa} (${liczebnosc(a)})`).join(", "))}</b>` : "")
    + (czeka.length ? `<br>Przeprawa dla: ${esc(czeka.map(a => a.nazwa).join(", "))} — płynie do załadunku, własny cel czeka` : "");
}
// załadunek: armia w prowincji załadunku, wszystkie wybrane floty w akwenie załadunku i armia się na nich mieści
function gotowyZaladunek(f, a, pr) {
  const t = pojemnoscTransportu(f, a);
  return t.floty.length > 0 && t.ile >= liczebnosc(a) && t.floty.every(fl => stan.pozycjeFlot?.[fl.id]?.a === pr.morze[0] && !bitwaFloty(fl.id));
}
// opis drogi na karcie armii: „za N tur”, przeprawa (gdzie załadunek i wyładunek, floty, czy armia się mieści) albo brak drogi
function opisDrogiArmii(f, a, ludzi) {
  const tr = trasaArmii(f, a); if (tr) return zaIle(tr.length);
  const pr = przeprawaArmii(f, a); if (!pr) return `<b class="ostrzezenie">brak drogi (góry albo rzeka bez mostu)</b>`;
  const zal = AKWENY[pr.morze[0] - 1], wyl = PROWINCJE[NR_PROWINCJI.get(pr.wyladunek) - 1], t = pojemnoscTransportu(f, a);
  if (stan.pozycjeArmii?.[a.id]?.a) return `${zaIle(pr.tur)} <b>na morzu</b>, wyładunek w ${esc(nazwaProwincji(wyl))}`;
  const czeka = !pr.lad1.length && t.floty.length && t.ile >= ludzi && !gotowyZaladunek(f, a, pr) ? ` <b class="ostrzezenie">— czeka na floty w ${esc(nazwaAkwenu(zal))}</b>` : "";
  return `${zaIle(pr.tur)} <b>przez morze</b>: załadunek w ${esc(nazwaAkwenu(zal))}, wyładunek w ${esc(nazwaProwincji(wyl))}${czeka}<br>` + (!t.floty.length
    ? `<b class="ostrzezenie">wybierz floty do przeprawy</b>`
    : `Floty: ${esc(t.floty.map(x => x.nazwa).join(", "))} — mieszczą ${t.ile === Infinity ? "bez limitu" : t.ile}${t.ile < ludzi ? ` <b class="ostrzezenie">— armia (${ludzi}) się nie mieści, dobierz kolejną flotę</b>` : ""}`);
}
// floty do przeprawy (a.transport = [idFloty], wybiera GM): pojemność razem; flota bez wpisanej pojemności = bez limitu
function pojemnoscTransportu(f, a) {
  const fl = (a.transport || []).map(id => f.floty?.find(x => x.id === id)).filter(Boolean); if (!fl.length) return { floty: [], ile: 0 };
  const p = fl.map(x => pojemnoscFloty(f, x)); return { floty: fl, ile: p.some(x => !x) ? Infinity : p.reduce((s, x) => s + x.ile, 0) };
}
function punktMiejsca(m) {
  if (m.a) return punktAkwenu(m.a);   // armia na pokładzie (7.8e)
  const p = PROWINCJE[NR_PROWINCJI.get(m.p) - 1]; if (!p) return null;
  const o = m.o >= 0 && osadyProwincji(p)[m.o]; return o ? [o.x, o.y] : [p.x, p.y];
}
function opisCelu(a) {
  if (!a.cel) return "";
  if (a.cel.armia) {
    const poz = stan.pozycjeArmii?.[a.cel.armia], f = frakcjaPo(poz?.f), b = f?.armie?.find(x => x.id === a.cel.armia);
    return poz ? `pościg: ${b ? b.nazwa + " — " : ""}${f?.nazwa || "armia"}` : "pościg: cel zniknął";
  }
  const p = PROWINCJE[NR_PROWINCJI.get(a.cel.p) - 1], o = a.cel.o >= 0 && p && osadyProwincji(p)[a.cel.o];
  return p ? `${nazwaProwincji(p)} — ${o ? NAZWY_TYPOW[o.typ].toLowerCase() + (o.nazwa ? ` ${o.nazwa}` : "") : "w polu"}` : "?";
}
const zaIle = n => n === 0 ? "na miejscu" : `za ${n} ${odmiana(n, "turę", "tury", "tur")}`;
// na mapie: trasy armii, które ten gracz widzi (swoje, jawne albo wszystkie dla GM)
function trasyNaMapie() {
  return stan.frakcje.flatMap(f => (f._brak?.armie ? [] : f.armie || []).flatMap(a => {
    const tr = a.cel && trasaArmii(f, a), start = stan.pozycjeArmii?.[a.id], pr = !tr && start && przeprawaArmii(f, a); if (!(tr || pr) || !start) return [];
    const za = krzywa([...(a.przebyte || []), start].map(punktMiejsca).filter(Boolean));
    const dalej = tr ? krzywa([start, ...tr].map(punktMiejsca).filter(Boolean)) : liniaPrzeprawy(start, pr);
    return [{ punkty: [...za, ...dalej.slice(1)], przebyte: za.length - 1, kolor: f.kolor, napis: `${a.nazwa}: ${zaIle(tr ? tr.length : pr.tur)}${pr ? " (przez morze)" : ""}` }];
  })).concat(propozycje.filter(p => p.cel === "ruch" && p.status === "czeka").flatMap(p => {   // 7.14: proponowane przez gracza — blade, „czeka na GM”
    const f = frakcjaPo(p.frakcja), a = f?.armie?.find(x => x.id === p.celId), start = stan.pozycjeArmii?.[p.celId];
    const tr = a && start && wyznaczTrase(f, start, miejsceCelu({ cel: p.zmiany.cel })), pr = a && start && !tr && trasaPrzeprawy(f, start, miejsceCelu({ cel: p.zmiany.cel }));
    if (!tr && !pr) return [];
    return [{ punkty: tr ? krzywa([start, ...tr].map(punktMiejsca).filter(Boolean)) : liniaPrzeprawy(start, pr), przebyte: 0, kolor: f.kolor, proponowana: true,
      napis: `${a.nazwa}: ${zaIle(tr ? tr.length : pr.tur)}${pr ? " (przez morze)" : ""} — czeka na GM` }];
  })).concat(stan.frakcje.flatMap(f => (f._brak?.armie ? [] : f.floty || []).flatMap(fl => {   // floty (7.8d): kreska między środkami akwenów
    const tr = fl.cel && trasaFloty(f, fl), start = stan.pozycjeFlot?.[fl.id]?.a; if (!tr || !start) return [];
    const za = liniaFloty([...(fl.przebyte || []), start]), dalej = liniaFloty([start, ...tr]);
    return [{ punkty: [...za, ...dalej.slice(1)], przebyte: za.length - 1, kolor: f.kolor, napis: `${fl.nazwa}: ${zaIle(tr.length)}` }];
  }))).concat(propozycje.filter(p => p.cel === "rejs" && p.status === "czeka").flatMap(p => {
    const f = frakcjaPo(p.frakcja), fl = f?.floty?.find(x => x.id === p.celId), start = stan.pozycjeFlot?.[p.celId]?.a;
    const tr = fl && start && trasaFloty(f, fl, p.zmiany.cel); if (!tr) return [];
    return [{ punkty: liniaFloty([start, ...tr]), przebyte: 0, kolor: f.kolor, proponowana: true, napis: `${fl.nazwa}: ${zaIle(tr.length)} — czeka na GM` }];
  }));
}
// ruch przy zamknięciu tury (7.1d): każda armia z celem robi 1 krok swojej trasy; trasy liczone z pozycji sprzed ruchu (pościg też).
// Do cofnięcia: pozycje i długości przebytych dróg sprzed ruchu w stan.cofnijRuchy (tylko ostatnia tura).
function ruchArmii(nr) {
  const cofnij = { nr, pozycje: structuredClone(stan.pozycjeArmii || {}), przebyte: {}, bitwy: structuredClone(stan.bitwy || {}), floty: structuredClone(stan.pozycjeFlot || {}), przebyteFlot: {} }, kroki = [];
  const plyn = (id, a) => { if (stan.pozycjeFlot?.[id]) stan.pozycjeFlot[id] = { ...stan.pozycjeFlot[id], a }; };
  // przeprawa (7.8e): floty z a.transport najpierw płyną do akwenu załadunku (zanim dojdzie armia); flota w służbie nie wykonuje własnego celu
  const wSluzbie = new Set();
  for (const f of stan.frakcje) for (const a of f.armie || []) {
    const poz = stan.pozycjeArmii?.[a.id]; if (poz?.a) { (poz.floty || []).forEach(id => wSluzbie.add(id)); continue; }
    const pr = !bitwaArmii(a.id) && przeprawaArmii(f, a); if (!pr) continue;
    for (const fl of pojemnoscTransportu(f, a).floty) { wSluzbie.add(fl.id); if (bitwaFloty(fl.id)) continue; const tr = trasaFloty(f, fl, pr.morze[0]); if (tr?.length) plyn(fl.id, tr[0]); }
  }
  for (const f of stan.frakcje) for (const a of f.armie || []) {
    if (!a.cel || bitwaArmii(a.id)) continue;
    const tr = trasaArmii(f, a); if (tr) { if (tr.length) kroki.push([a, tr[0]]); continue; }
    const pr = przeprawaArmii(f, a), poz = stan.pozycjeArmii[a.id]; if (!pr) continue;
    if (poz.a) { if (!poz.floty?.some(bitwaFloty)) kroki.push([a, pr.morze.length > 1 ? { a: pr.morze[1], floty: poz.floty } : { p: pr.wyladunek, o: -1 }]); }   // płynie albo schodzi na ląd (stoi, gdy jego flota walczy)
    else if (pr.lad1.length) kroki.push([a, pr.lad1[0]]);
    else if (gotowyZaladunek(f, a, pr)) kroki.push([a, { a: pr.morze[0], floty: (a.transport || []).filter(id => stan.pozycjeFlot?.[id]) }]);   // na pokład
  }
  for (const [a, krok] of kroki) {
    const poz = stan.pozycjeArmii[a.id];
    cofnij.przebyte[a.id] = (a.przebyte || []).length;
    a.przebyte = [...(a.przebyte || []), poz.a ? { a: poz.a } : { p: poz.p, o: poz.o }];
    stan.pozycjeArmii[a.id] = krok.a ? { f: poz.f, a: krok.a, floty: krok.floty } : { f: poz.f, p: krok.p, o: krok.o };
    if (krok.a) krok.floty.forEach(id => plyn(id, krok.a));   // floty płyną z armią
  }
  // floty (7.8d): 1 akwen na turę; bitwy morskie dopiero w 7.8f
  const krokiFlot = stan.frakcje.flatMap(f => (f.floty || []).flatMap(fl => { const tr = !wSluzbie.has(fl.id) && !bitwaFloty(fl.id) && fl.cel && trasaFloty(f, fl); return tr?.length ? [[fl, tr[0]]] : []; }));
  for (const [fl, a] of krokiFlot) {
    cofnij.przebyteFlot[fl.id] = (fl.przebyte || []).length;
    fl.przebyte = [...(fl.przebyte || []), stan.pozycjeFlot[fl.id].a];
    stan.pozycjeFlot[fl.id] = { ...stan.pozycjeFlot[fl.id], a };
  }
  stan.cofnijRuchy = cofnij;
  wykryjBitwy(cofnij.pozycje, nr); wykryjBitwyMorskie(cofnij.floty, nr);
  return kroki.length;
}
function cofnijRuchArmii(nr) {
  const c = stan.cofnijRuchy; if (c?.nr !== nr) return false;
  for (const [id, poz] of Object.entries(c.pozycje)) if (stan.pozycjeArmii?.[id]) stan.pozycjeArmii[id] = poz;   // armie założone po zamknięciu zostają
  for (const f of stan.frakcje) for (const a of f.armie || []) if (a.id in c.przebyte) a.przebyte = (a.przebyte || []).slice(0, c.przebyte[a.id]);
  for (const [id, poz] of Object.entries(c.floty || {})) if (stan.pozycjeFlot?.[id]) stan.pozycjeFlot[id] = poz;
  for (const f of stan.frakcje) for (const fl of f.floty || []) if (fl.id in (c.przebyteFlot || {})) fl.przebyte = (fl.przebyte || []).slice(0, c.przebyteFlot[fl.id]);
  if (c.bitwy) stan.bitwy = c.bitwy;
  stan.cofnijRuchy = null;
  return true;
}
// bitwy (7.1g): stan.bitwy = { id: { p: idProwincji, armie: [idArmii], tura } } — jawne. Wybuchają przy zamknięciu tury, gdy armie krajów
// w wojnie stoją w tej samej prowincji albo minęły się na granicy; armie w bitwie stoją. GM kończy bitwę albo wymusza ją sąsiadom.
const bitwaArmii = id => Object.entries(stan.bitwy || {}).find(([, b]) => !b.koniec && b.armie.includes(id));
// bitwy morskie (7.8f): { a: nrAkwenu, armie: [], floty: [idFloty], tura, wl } — armie na pokładzie biorą udział razem ze swoją flotą
const bitwaFloty = id => Object.entries(stan.bitwy || {}).find(([, b]) => !b.koniec && b.floty?.includes(id));
// armia na pokładzie floty, która walczy, jest w bitwie morskiej razem z nią
const bitwaJednostki = a => bitwaArmii(a.id) || bitwaFloty(a.id) || (stan.pozycjeArmii?.[a.id]?.floty || []).map(bitwaFloty).find(Boolean);
const uczestnicyBitwy = b => [...b.armie, ...(b.floty || [])];
const miejsceBitwy = b => b.a ? nazwaAkwenuNr(b.a) : (p => p ? nazwaProwincji(p) : "?")(PROWINCJE[NR_PROWINCJI.get(b.p) - 1]);
const tytulBitwy = b => `${b.a ? "Bitwa morska" : "Bitwa"} — ${miejsceBitwy(b)}`;
// armia na pokładzie należy w bitwie do pierwszej ze swoich flot, która w niej walczy
const flotaArmiiWBitwie = (a, b) => stan.pozycjeArmii?.[a.id]?.floty?.find(x => b.floty?.includes(x));
function wykryjBitwyMorskie(stare, nr) {   // jak lądowe: wrogie floty w tym samym akwenie albo mijające się
  const lista = Object.entries(stan.pozycjeFlot || {}).filter(([id]) => !bitwaFloty(id)), nowe = new Map();
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const [x, px] = lista[i], [y, py] = lista[j]; if (!wWojnie(px.f, py.f)) continue;
    const gdzie = px.a === py.a ? px.a : stare[x]?.a === py.a && stare[y]?.a === px.a ? py.a : null;
    if (gdzie) { const s = nowe.get(gdzie) || new Set(); s.add(x).add(y); nowe.set(gdzie, s); }
  }
  for (const [a, floty] of nowe) {
    const wl = Object.fromEntries([...floty].map(x => [x, stan.pozycjeFlot[x].f])), kraje = [...new Set(Object.values(wl))];
    (stan.bitwy ??= {})["b" + Date.now().toString(36) + "a" + a] = { a, armie: [], floty: [...floty], tura: nr, wl };
    wpiszKronike("bitwa", `Bitwa morska — ${nazwaAkwenuNr(a)}: ${kraje.map(nazwaKraju).join(" ⚔ ")}`, kraje, { tura: nr, zam: nr, d: { morska: true, miejsce: `na morzu „${nazwaAkwenuNr(a)}”`, lista: kraje, a } });
  }
  return nowe.size;
}
function wykryjBitwy(stare, nr) {
  const lista = Object.entries(stan.pozycjeArmii || {}).filter(([id, poz]) => poz.p && !bitwaArmii(id)), nowe = new Map();   // armie na pokładzie — bitwy morskie w 7.8f
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const [x, px] = lista[i], [y, py] = lista[j]; if (!wWojnie(px.f, py.f)) continue;
    const gdzie = px.p === py.p ? px.p : stare[x]?.p === py.p && stare[y]?.p === px.p ? py.p : null;   // ta sama prowincja albo mijanie się
    if (gdzie) { const s = nowe.get(gdzie) || new Set(); s.add(x).add(y); nowe.set(gdzie, s); }
  }
  for (const [p, armie] of nowe) {
    const wl = Object.fromEntries([...armie].map(a => [a, stan.pozycjeArmii[a].f])), kraje = [...new Set(Object.values(wl))];
    (stan.bitwy ??= {})["b" + Date.now().toString(36) + p] = { p, armie: [...armie], tura: nr, wl };
    wpiszKronike("bitwa", `Bitwa — ${nazwaProwincji(PROWINCJE[NR_PROWINCJI.get(p) - 1])}: ${kraje.map(nazwaKraju).join(" ⚔ ")}`, kraje, { tura: nr, zam: nr, d: { miejsce: wProwincji(PROWINCJE[NR_PROWINCJI.get(p) - 1]), lista: kraje, p } });
  }
  return nowe.size;
}
const kraj = (id, b) => wlascicielPo(stan.pozycjeArmii?.[id]?.f ?? stan.pozycjeFlot?.[id]?.f ?? b?.wl?.[id])?.nazwa || "?";
function bitwyNaMapie() {
  return aktywneBitwy().flatMap(([id, b]) => {
    const p = b.a ? AKWENY[b.a - 1] : PROWINCJE[NR_PROWINCJI.get(b.p) - 1]; if (!p) return [];
    const strony = [...new Set(uczestnicyBitwy(b).map(x => kraj(x, b)))];
    return [{ typ: "bitwa", x: p.x, y: p.y, dx: -44, ikona: IKONY_OSAD.bitwa, tytul: `${b.a ? "Bitwa morska" : "Bitwa"}: ${strony.join(" ⚔ ")} — ${miejsceBitwy(b)}`,
      klik: () => pokazBitwe(id) }];
  });
}
function opisBitwy(a) {   // a — armia albo flota
  const b = bitwaJednostki(a); if (!b) return "";
  const inni = uczestnicyBitwy(b[1]).filter(id => id !== a.id && kraj(id, b[1]) !== kraj(a.id, b[1])).map(x => kraj(x, b[1]));
  return `<br><b class="ostrzezenie">⚔ W bitwie${b[1].a ? " morskiej" : ""}</b> — ${esc(miejsceBitwy(b[1]))}, przeciw: ${esc([...new Set(inni)].join(", "))}`;
}
// wymuszenie (GM): armia + klik w sztandar innej armii w tej samej albo sąsiedniej prowincji
function wymusBitwe(id) {
  const { f, a } = celowanie; celowanie = null; mapa.kursor(false);
  const ja = stan.pozycjeArmii?.[a.id], on = stan.pozycjeArmii?.[id], p = ja && PROWINCJE[NR_PROWINCJI.get(ja.p) - 1];
  const obok = p && on && (ja.p === on.p || p.sasiedzi.some(([j]) => PROWINCJE[j - 1].id === on.p));
  wybierz(f.id, true);
  if (!obok) return napisz(".komunikat-armii", "Bitwę można wymusić tylko z armią w tej samej albo sąsiedniej prowincji.");
  if (bitwaArmii(a.id) || bitwaArmii(id)) return napisz(".komunikat-armii", "Któraś z tych armii już jest w bitwie.");
  (stan.bitwy ??= {})["b" + Date.now().toString(36)] = { p: ja.p, armie: [a.id, id], tura: stan.tury.length + 1, wl: { [a.id]: ja.f, [id]: on.f } };
  wpiszKronike("bitwa", `Bitwa — ${nazwaProwincji(p)}: ${nazwaKraju(ja.f)} ⚔ ${nazwaKraju(on.f)}`, [ja.f, on.f], { d: { miejsce: wProwincji(p), lista: [ja.f, on.f], p: p.id } });
  odswiezRaporty(); zapisz(stan); pokazOsadyNaMapie(); wybierz(f.id, true);
}
// rozwiązanie (7.1e): przy zamknięciu tury armie poniżej 100 żołnierzy (bez bohaterów i dowódcy) znikają; bohaterowie wracają do stolicy.
// Do cofnięcia tury kopia w f.cofnijRozwiazanie (tajny dokument frakcji, bo zawiera skład).
function rozwiazSlabe(nr) {
  let ile = 0;
  for (const f of stan.frakcje) {
    const slabe = (f.armie || []).filter(a => liczebnosc(a) < 100);
    f.cofnijRozwiazanie = slabe.length ? { nr, armie: structuredClone(slabe), pozycje: Object.fromEntries(slabe.map(a => [a.id, stan.pozycjeArmii?.[a.id]])) } : null;
    if (!slabe.length) continue;
    f.armie = f.armie.filter(a => !slabe.includes(a)); ile += slabe.length;
    for (const a of slabe) {
      delete stan.pozycjeArmii[a.id];
      for (const [id, b] of aktywneBitwy()) if (!b.a) { b.armie = b.armie.filter(x => x !== a.id); if (b.armie.length < 2) delete stan.bitwy[id]; }
    }
    statusyArmii(f);
  }
  return ile;
}
function cofnijRozwiazanie(nr) {
  for (const f of stan.frakcje) {
    const c = f.cofnijRozwiazanie; if (c?.nr !== nr) continue;
    f.armie = [...(f.armie || []), ...c.armie];
    for (const [id, poz] of Object.entries(c.pozycje)) if (poz) stan.pozycjeArmii[id] = poz;
    f.cofnijRozwiazanie = null; statusyArmii(f);
  }
}
// ekran bitwy (7.1h): strony = kraje armii w bitwie; raport { uczestnicy, p, tura, strony: [{ wl, nazwa, kolor, armie: [{ id, nazwa, dowodca, bohaterowie: [{id, imie}], oddzialy: [{jednostka, liczba, poziom}] }] }], koniec? }
// GM zapisuje go w bitwy/{id} (stan.raportyBitew, przy każdym zapisie, dopóki bitwa trwa; po końcu — wersja z wynikiem i stratami)
function raportBitwy(id) {
  const b = stan.bitwy?.[id]; if (!b) return null;
  const strony = new Map();
  // pozycje raportu: armie (bitwa lądowa) albo floty i armie na ich pokładzie (morska, typ „flota” / „armia” z polem flota)
  const pozycje = b.a ? (b.floty || []).flatMap(fid => { const wl = stan.pozycjeFlot?.[fid]?.f ?? b.wl?.[fid], f = frakcjaPo(wl);
      return [[wl, f, f?.floty?.find(x => x.id === fid), "flota"], ...(f?.armie || []).filter(a => flotaArmiiWBitwie(a, b) === fid).map(a => [wl, f, a, "armia", fid])]; })
    : b.armie.map(aid => { const wl = stan.pozycjeArmii?.[aid]?.f ?? b.wl?.[aid], f = frakcjaPo(wl); return [wl, f, f?.armie?.find(x => x.id === aid), "armia"]; });
  for (const [wl, f, a, typ, flota] of pozycje) {
    if (!strony.has(wl)) strony.set(wl, { wl, nazwa: wlascicielPo(wl)?.nazwa || "?", kolor: f?.kolor || "#808080", armie: [] });
    if (a) strony.get(wl).armie.push({ id: a.id, typ, ...(flota && { flota }), nazwa: flota ? `${a.nazwa} — na pokładzie` : a.nazwa, dowodca: a.dowodca ? nazwaBohatera(a.dowodca) : a.pospolity ? `${a.pospolity} (pospolity)` : "",
      bohaterowie: wArmii(a).map(h => ({ id: h, imie: nazwaBohatera(h) })),
      oddzialy: (a.oddzialy || []).map(o => ({ jednostka: o.jednostka, liczba: +o.liczba || 0, poziom: f.jednostki?.find(j => j.nazwa === o.jednostka)?.poziom ?? 1 })) });
  }
  return { uczestnicy: [...strony.keys()].filter(wl => frakcjaPo(wl)), ...(b.a ? { a: b.a } : { p: b.p }), tura: b.tura, strony: [...strony.values()] };
}
const aktywneBitwy = () => Object.entries(stan.bitwy || {}).filter(([, b]) => !b.koniec);
function odswiezRaporty() {   // trwające — od nowa z bieżącego składu; zakończone zostają w wersji z wynikiem
  if (gm) stan.raportyBitew = { ...Object.fromEntries(Object.entries(stan.raportyBitew || {}).filter(([id]) => stan.bitwy?.[id]?.koniec)), ...Object.fromEntries(aktywneBitwy().map(([id]) => [id, raportBitwy(id)])) };
}
// historia bitew frakcji na jej karcie (jawna: kto z kim, gdzie, wynik) — klik otwiera ekran bitwy
function bitwyFrakcji(f) {
  const l = Object.entries(stan.bitwy || {}).filter(([, b]) => Object.values(b.wl || {}).includes(f.id) || uczestnicyBitwy(b).some(x => (stan.pozycjeArmii?.[x] || stan.pozycjeFlot?.[x])?.f === f.id))
    .sort((a, b) => b[1].tura - a[1].tura);
  if (!l.length) return "";
  return `<h4>Bitwy</h4><ul class="lista-bitew">${l.map(([id, b]) => { const k = b.koniec, strony = k?.strony || [...new Set(uczestnicyBitwy(b).map(x => kraj(x, b)))];
    return `<li><button type="button" class="cofnij" data-bitwa="${esc(id)}">⚔ Tura ${b.tura} — ${b.a ? "morska, " : ""}${esc(miejsceBitwy(b))}: ${esc(strony.join(" ⚔ "))} — ${k ? (k.zwyciezca === -1 ? "remis" : `zwycięstwo: ${esc(strony[k.zwyciezca] || "?")}`) : "<b>trwa</b>"}</button></li>`; }).join("")}</ul>`;
}
const oknoBitwy = document.getElementById("bitwa");
oknoBitwy.onclick = e => { if (e.target === oknoBitwy) oknoBitwy.close(); };
const sumaOddz = (o, poz) => o.filter(x => poz === undefined || x.poziom === poz).reduce((s, x) => s + x.liczba, 0);
async function pokazBitwe(id) {
  const b = stan.bitwy?.[id]; if (!b) return;
  const r = b.koniec ? stan.raportyBitew?.[id] || await czytajBitwe(id) : gm || !CHMURA || wPiaskownicy() ? raportBitwy(id) : await czytajBitwe(id);   // pokaz samouczka: bitwy nie ma w bazie
  const p = !b.a && PROWINCJE[NR_PROWINCJI.get(b.p) - 1], strony = r?.strony || (b.koniec?.strony || [...new Set(uczestnicyBitwy(b).map(x => kraj(x, b)))]).map(n => ({ nazwa: n, armie: null }));
  const k = b.koniec, straty = r?.koniec?.straty || {}, polegli = new Set(r?.koniec?.polegli || []), losBoh = r?.koniec?.bohaterowie || {}, losArmii = r?.koniec?.los || {};
  const ZNAK_BOH = { polegl: [" ✝", "polegl"], ranny: [" (ranny)", "ranny"], niewola: [" ⛓ w niewoli", "niewola"], uratowany: [" (uratowany)", "uratowany"] };
  const edycja = gm && !k;
  const oddzialy = (st, typ) => st.armie.filter(a => !typ || (a.typ || "armia") === typ).flatMap(a => a.oddzialy);   // bitwa morska: siły = okręty, żołnierze na pokładzie osobno
  const kolumna = (st, nr) => `<section class="strona" style="--kolor:${st.kolor || "#808080"}">
    <h3>${esc(st.nazwa)}${k ? (k.zwyciezca === nr ? ` <span class="wygrana">zwycięstwo</span>` : k.zwyciezca === -1 ? ` <span class="remis">remis</span>` : ` <span class="porazka">porażka</span>`) : ""}</h3>
    ${st.armie === null ? `<p class="tajne">🔒 Skład widzą tylko strony bitwy i GM.</p>` : st.armie.map(a => `<div class="armia-bitwy"><h4>${esc(a.nazwa)}</h4>
      ${edycja ? `<label class="los">Po bitwie <select name="los" data-armia="${esc(a.id)}">${Object.entries(losyPozycji(b, a)).map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select></label>` : losArmii[a.id] ? `<p class="los">${esc(losArmii[a.id])}</p>` : ""}
      <p>${a.dowodca ? `Dowódca: <b>${esc(a.dowodca)}</b>` : `<b class="ostrzezenie">Brak dowódcy</b>`}</p>
      ${a.bohaterowie.length ? `<p class="bohaterowie-bitwy">${a.bohaterowie.map(h => { const l = losBoh[h.id] || (polegli.has(h.id) ? "polegl" : ""); return edycja ? `<label>${esc(h.imie)} <select data-bohater="${esc(h.id)}" aria-label="Los: ${esc(h.imie)}"><option value="">cały</option><option value="ranny">ranny</option><option value="polegl">poległ</option><option value="niewola">w niewoli</option>${b.a ? `<option value="uratowany">uratowany (wraca do stolicy)</option>` : ""}</select></label>` : `<span${l ? ` class="${ZNAK_BOH[l][1]}"` : ""}>${esc(h.imie)}${l ? ZNAK_BOH[l][0] : ""}</span>`; }).join("")}</p>` : ""}
      ${POZIOMY.map((nazwaP, poz) => { const w = a.oddzialy.map((o, i) => [o, i]).filter(([o]) => o.poziom === poz); return w.length ? `<h5>${nazwaP}</h5><ul class="podsumowanie">${w.map(([o, i]) =>
        `<li><span>${esc(o.jednostka)}</span><span>${o.liczba}${edycja ? ` <input class="straty" data-armia="${esc(a.id)}" data-i="${i}" inputmode="numeric" placeholder="straty" aria-label="Straty: ${esc(o.jednostka)}">` : straty[a.id]?.[i] ? ` <b class="ostrzezenie">−${straty[a.id][i]}</b>` : ""}</span></li>`).join("")}</ul>` : ""; }).reverse().join("")}
    </div>`).join("") || `<p class="puste">Brak armii.</p>`}
    ${st.armie && b.a ? `<p class="suma-bitwy">Okręty: <b>${sumaOddz(oddzialy(st, "flota"))}</b> · żołnierze na pokładzie: <b>${sumaOddz(oddzialy(st, "armia"))}</b>${(() => { const n = st.armie.reduce((x, a) => x + Object.values(straty[a.id] || {}).reduce((y, v) => y + v, 0), 0); return n ? ` <span class="ostrzezenie">(straty razem ${n})</span>` : ""; })()}</p>` : st.armie ? `<p class="suma-bitwy">Razem: <b>${sumaOddz(oddzialy(st))}</b>${(() => { const n = st.armie.reduce((x, a) => x + Object.values(straty[a.id] || {}).reduce((y, v) => y + v, 0), 0); return n ? ` → <b>${sumaOddz(oddzialy(st)) - n}</b> <span class="ostrzezenie">(straty ${n})</span>` : ""; })()} · ${POZIOMY.map((n, poz) => `${n.toLowerCase()} ${sumaOddz(oddzialy(st), poz)}`).reverse().join(" · ")}</p>` : ""}</section>`;
  const sumy = strony.map(st => st.armie ? sumaOddz(oddzialy(st, b.a ? "flota" : undefined)) : 0), razem = sumy.reduce((a, x) => a + x, 0) || 1;
  oknoBitwy.innerHTML = `<div class="okno-glowa"><div><h2>⚔ ${esc(tytulBitwy(b))}</h2>
      <p class="rasa">Tura ${b.tura}${k ? ` · zakończona w turze ${k.tura}` : " · trwa"}</p></div><button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    ${strony.every(st => st.armie) ? `<div class="sily" aria-hidden="true">${strony.map((st, i) => `<span style="flex:${sumy[i] || 0.01};background:${st.kolor}"></span>`).join("")}</div>` : ""}
    <div class="strony">${strony.map(kolumna).join(`<div class="vs">VS</div>`)}</div>
    ${k ? `<section class="wynik"><h3>Wynik</h3><p><b>${k.zwyciezca === -1 ? "Remis" : `Zwycięstwo: ${esc(strony[k.zwyciezca]?.nazwa || "?")}`}</b></p>${k.opis ? tekst(k.opis) : ""}</section>` : ""}
    ${edycja ? `<form class="koniec-bitwy"><h3>Koniec bitwy (GM)</h3>
      <label>Wynik <select name="zwyciezca">${strony.map((st, i) => `<option value="${i}">Zwycięstwo: ${esc(st.nazwa)}</option>`).join("")}<option value="-1">Remis</option></select></label>
      ${b.a ? "" : `<label class="zdobycie"><input type="checkbox" name="zdobywa"> Zwycięzca zdobywa prowincję ${esc(p ? nazwaProwincji(p) : "")} (gdy nie jest jego)</label>`}
      <label>Opis <textarea name="opis" rows="3" maxlength="3000" placeholder="Przebieg bitwy (opcjonalnie)"></textarea></label>
      <p class="opis-sekcji">${b.a ? "Straty wpisz przy okrętach i oddziałach na pokładzie (opcjonalnie). „Po bitwie” przy flocie: domyślnie przegrana flota cofa się o 1 akwen w stronę własnego wybrzeża, a zwycięzca płynie dalej. Zatopiona i poddana flota znika (okrętów nikt nie przejmuje). Armia na pokładzie dzieli los swojej floty — chyba że wysadzisz ją na brzeg." : `Straty wpisz przy oddziałach (opcjonalnie) — zostaną odjęte od armii. „Po bitwie” przy armii: domyślnie przegrana armia cofa się o 1 prowincję w stronę własnych ziem, a zwycięzca idzie dalej. Poddana armia znika, a jej bohaterowie trafiają do niewoli zwycięzcy. Armia poniżej 100 żołnierzy zostanie rozwiązana przy zamknięciu tury.`}</p>
      <button class="dodaj">Zakończ bitwę i zapisz wynik</button></form>` : ""}`;
  oknoBitwy.querySelector(".zamknij").onclick = () => oknoBitwy.close();
  const form = oknoBitwy.querySelector(".koniec-bitwy");
  if (form) form.onsubmit = e => {
    e.preventDefault();
    const st = {}, losB = Object.fromEntries([...oknoBitwy.querySelectorAll("[data-bohater]")].filter(x => x.value).map(x => [x.dataset.bohater, x.value]));
    const los = Object.fromEntries([...oknoBitwy.querySelectorAll("select[name=los]")].map(x => [x.dataset.armia, x.value]));
    oknoBitwy.querySelectorAll(".straty").forEach(x => { const n = Math.max(0, parseInt(x.value.replace(/\s/g, "")) || 0); if (n) (st[x.dataset.armia] ??= {})[x.dataset.i] = n; });
    const zw = +form.zwyciezca.value;
    if (!confirm(`Zakończyć bitwę? ${zw === -1 ? "Remis" : `Zwycięża ${strony[zw].nazwa}`}.`)) return;
    const raport = raportBitwy(id);
    b.koniec = { zwyciezca: zw, opis: form.opis.value.trim(), tura: stan.tury.length + 1, strony: strony.map(s => s.nazwa) };   // jawne: wynik i nazwy stron
    const wlBitwy = [...new Set(Object.values(b.wl || {}))], wlStrony = s => wlBitwy.find(w => nazwaKraju(w) === s.nazwa) || "";
    const miejsceD = b.a ? `na morzu „${nazwaAkwenuNr(b.a)}”` : wProwincji(p), gdzieD = b.a ? { a: b.a } : { p: p.id };
    const idWyniku = wpiszKronike("wynik", `${tytulBitwy(b)}: ${zw === -1 ? `remis (${strony.map(s => s.nazwa).join(", ")})` : `zwycięstwo: ${strony[zw].nazwa} nad ${strony.filter((_, i) => i !== zw).map(s => s.nazwa).join(", ")}`}${b.koniec.opis ? ` — ${b.koniec.opis.slice(0, 300)}` : ""}`,
      wlBitwy, { d: zw === -1 ? { remis: true, miejsce: miejsceD, lista: strony.map(wlStrony), ...gdzieD } : { A: wlStrony(strony[zw]), przegrani: strony.filter((_, i) => i !== zw).map(wlStrony), miejsce: miejsceD, morska: Boolean(b.a), ...gdzieD, ...(p ? { prowincja: nazwaProwincji(p) } : {}) } });
    for (const f of stan.frakcje) for (const a of [...(f.armie || []), ...(f.floty || [])]) {   // straty (też okręty flot)
      const s = st[a.id]; if (s) { a.oddzialy = a.oddzialy.map((o, i) => ({ ...o, liczba: Math.max(0, (+o.liczba || 0) - (s[i] || 0)) })).filter(o => o.liczba > 0); }
    }
    const skutki = b.a ? skutkiBitwyMorskiej(id, strony, zw, los, losB) : skutkiBitwy(id, strony, zw, los, losB, form.zdobywa.checked);
    if (skutki.zdobycz) stan.kronika[idWyniku].d.zdobycz = true;
    if (skutki.opis.length) wpiszKronike("wynik", `Po bitwie — ${miejsceBitwy(b)}: ${skutki.opis.join("; ")}`, wlBitwy,
      { d: { skutki: true, miejsce: miejsceD, ...gdzieD, opis: skutki.opis, polegli: skutki.polegli || [], ranni: skutki.ranni || [], niewola: skutki.niewola || [] } });
    raport.koniec = { ...b.koniec, straty: st, polegli: Object.keys(losB).filter(h => losB[h] === "polegl"), bohaterowie: losB, los: skutki.los };
    stan.frakcje.forEach(statusyArmii);
    odswiezRaporty(); (stan.raportyBitew ??= {})[id] = raport;
    zapisz(stan); pokazOsadyNaMapie(); oknoBitwy.close();
    if (widok && stan.frakcje.some(f => f.id === widok)) wybierz(widok, true);
  };
  otworzOkno(oknoBitwy);
}
// skutki bitwy (7.1i): los armii („auto” = przegrana cofa się, pozostałe zostają), bohaterów i ewentualne zdobycie prowincji;
// zwraca { los: {idArmii: opis}, opis: [zdania do kroniki] }
const LOSY = { auto: "przegrana: odwrót, wygrana: dalej", zostaje: "zostaje na miejscu", odwrot: "odwrót", rozbita: "rozbita (znika)", poddana: "poddana (bohaterowie w niewoli)" };
function skutkiBitwy(id, strony, zw, los, losB, zdobywa) {
  const b = stan.bitwy[id], p = PROWINCJE[NR_PROWINCJI.get(b.p) - 1], wynik = { los: {}, opis: [] };
  const stronaArmii = aid => strony.findIndex(st => st.armie?.some(a => a.id === aid));
  const zwyciezca = s => zw >= 0 && zw !== s ? strony[zw] : strony.find((_, i) => i !== s);   // do kogo idą jeńcy tej strony
  losyBohaterow(losB, wynik, h => zwyciezca(stronaArmii(h)));
  for (const f of stan.frakcje) for (const a of [...(f.armie || [])]) {   // armie
    if (!b.armie.includes(a.id)) continue;
    const s = stronaArmii(a.id), przegrana = zw >= 0 && s !== zw, l = los[a.id] === "auto" || !los[a.id] ? (przegrana ? "odwrot" : "zostaje") : los[a.id];
    if (l === "odwrot") {
      const q = odwrot(f, a); wynik.los[a.id] = q ? `odwrót → ${nazwaProwincji(q)}` : "odwrót niemożliwy — zostaje";
      wynik.opis.push(`${a.nazwa} (${f.nazwa}) ${q ? `cofa się do: ${nazwaProwincji(q)}` : "nie ma dokąd się cofnąć"}`);
    } else if (l === "rozbita" || l === "poddana") {
      if (l === "poddana") { const u = zwyciezca(s)?.nazwa || "?"; for (const h of wArmii(a)) { const boh = stan.bohaterowie.find(x => x.id === h); if (boh) Object.assign(boh, { status: "niewola", misja: u }); } }
      f.armie.splice(f.armie.indexOf(a), 1); delete stan.pozycjeArmii[a.id];
      wynik.los[a.id] = l === "rozbita" ? "rozbita" : "poddała się"; wynik.opis.push(`${a.nazwa} (${f.nazwa}) ${l === "rozbita" ? "rozbita" : "poddała się — bohaterowie w niewoli"}`);
    } else if (przegrana) wynik.los[a.id] = "zostaje na miejscu";
  }
  const nowy = zw >= 0 && strony[zw].wl;   // zdobycie prowincji (frakcja zwycięzcy)
  if (zdobywa && p && nowy && stan.prowincje?.[p.id]?.wlasciciel !== nowy) { ustawProwincje(p, { ...stan.prowincje?.[p.id], wlasciciel: nowy }); wynik.opis.push(`${strony[zw].nazwa} zdobywa prowincję`); wynik.zdobycz = true; }
  return wynik;
}
// bohaterowie po bitwie (lądowej i morskiej): ranny zostaje w armii / flocie; poległ, w niewoli, uratowany (7.8f — wraca do stolicy) ją opuszcza.
// zwyciezcaDla(idJednostki) → strona, do której idą jeńcy
function losyBohaterow(losB, wynik, zwyciezcaDla) {
  const jednostkaBohatera = h => stan.frakcje.flatMap(f => [...(f.armie || []), ...(f.floty || [])]).find(a => wArmii(a).includes(h));
  for (const [h, l] of Object.entries(losB)) {
    const boh = stan.bohaterowie.find(x => x.id === h), a = jednostkaBohatera(h); if (!boh) continue;
    if (l === "ranny") { Object.assign(boh, { status: "ranny", misja: "" }); wynik.opis.push(`${boh.imie} ranny`); (wynik.ranni ??= []).push(boh.imie); continue; }
    if (a) { if (a.dowodca === h) a.dowodca = ""; a.bohaterowie = (a.bohaterowie || []).filter(x => x !== h); }
    if (l === "polegl") { Object.assign(boh, { status: "martwy", misja: "" }); wynik.opis.push(`${boh.imie} poległ`); (wynik.polegli ??= []).push(boh.imie); }
    if (l === "uratowany") { Object.assign(boh, { status: "stolica", misja: "" }); wynik.opis.push(`${boh.imie} uratowany — wraca do stolicy`); }
    if (l === "niewola") { const u = zwyciezcaDla(a?.id)?.nazwa || "?"; Object.assign(boh, { status: "niewola", misja: u }); wynik.opis.push(`${boh.imie} w niewoli u: ${u}`); (wynik.niewola ??= []).push(boh.imie); }
  }
}
// los po bitwie do wyboru przy pozycji raportu: armia na lądzie (LOSY), flota (LOSY_FLOT), armia na pokładzie — z flotą albo na brzeg akwenu
const LOSY_FLOT = { auto: "przegrana: odwrót, wygrana: dalej", zostaje: "zostaje na miejscu", odwrot: "odwrót (1 akwen)", zatopiona: "zatopiona (znika)", poddana: "poddana (znika, bohaterowie w niewoli)" };
const losyPozycji = (b, x) => !b.a ? LOSY : x.typ === "flota" ? LOSY_FLOT
  : { zFlota: "dzieli los floty", ...Object.fromEntries(AKWENY[b.a - 1].brzeg.map(i => [`brzeg:${PROWINCJE[i - 1].id}`, `wysadzona na brzeg: ${nazwaProwincji(PROWINCJE[i - 1])}`])) };
// skutki bitwy morskiej (7.8f): los flot (odwrót o 1 akwen, zostaje, zatopiona, poddana — okrętów nie przejmuje zwycięzca), armii na pokładzie
// (dzielą los swojej floty, chyba że GM wysadzi je na brzeg) i bohaterów
function skutkiBitwyMorskiej(id, strony, zw, los, losB) {
  const b = stan.bitwy[id], wynik = { los: {}, opis: [] };
  const strona = x => strony.findIndex(st => st.armie?.some(a => a.id === x));
  const zwyciezca = s => zw >= 0 && zw !== s ? strony[zw] : strony.find((_, i) => i !== s);
  const niewola = (a, s) => { const u = zwyciezca(s)?.nazwa || "?"; for (const h of wArmii(a)) { const boh = stan.bohaterowie.find(x => x.id === h); if (boh) Object.assign(boh, { status: "niewola", misja: u }); } };
  losyBohaterow(losB, wynik, x => zwyciezca(strona(x)));
  for (const f of stan.frakcje) for (const fl of [...(f.floty || [])]) {
    if (!b.floty?.includes(fl.id)) continue;
    const s = strona(fl.id), przegrana = zw >= 0 && s !== zw, l = !los[fl.id] || los[fl.id] === "auto" ? (przegrana ? "odwrot" : "zostaje") : los[fl.id];
    const naPokladzie = (f.armie || []).filter(a => flotaArmiiWBitwie(a, b) === fl.id), znika = l === "zatopiona" || l === "poddana";
    if (l === "odwrot") {
      const a = odwrotFloty(f, fl); wynik.los[fl.id] = a ? `odwrót → ${nazwaAkwenuNr(a)}` : "odwrót niemożliwy — zostaje";
      wynik.opis.push(`${fl.nazwa} (${f.nazwa}) ${a ? `cofa się do: ${nazwaAkwenuNr(a)}` : "nie ma dokąd się cofnąć"}`);
    } else if (znika) {
      if (l === "poddana") niewola(fl, s);
      f.floty.splice(f.floty.indexOf(fl), 1); delete stan.pozycjeFlot[fl.id];
      wynik.los[fl.id] = l === "zatopiona" ? "zatopiona" : "poddała się"; wynik.opis.push(`${fl.nazwa} (${f.nazwa}) ${l === "zatopiona" ? "zatopiona" : "poddała się — bohaterowie w niewoli"}`);
    } else if (przegrana) wynik.los[fl.id] = "zostaje na miejscu";
    for (const a of naPokladzie) {
      const poz = stan.pozycjeArmii[a.id], la = los[a.id] || "";
      if (la.startsWith("brzeg:")) {
        const q = PROWINCJE[NR_PROWINCJI.get(la.slice(6)) - 1]; stan.pozycjeArmii[a.id] = { f: poz.f, p: q.id, o: -1 }; delete a.cel; a.przebyte = [];
        wynik.los[a.id] = `wysadzona na brzeg: ${nazwaProwincji(q)}`; wynik.opis.push(`${a.nazwa} (${f.nazwa}) wysadzona na brzeg: ${nazwaProwincji(q)}`);
      } else if (znika) {
        if (l === "poddana") niewola(a, s);
        f.armie.splice(f.armie.indexOf(a), 1); delete stan.pozycjeArmii[a.id];
        wynik.los[a.id] = l === "zatopiona" ? "zatopiona razem z flotą" : "poddała się razem z flotą"; wynik.opis.push(`${a.nazwa} (${f.nazwa}) ${wynik.los[a.id]}`);
      } else if (l === "odwrot") { stan.pozycjeArmii[a.id] = { ...poz, a: stan.pozycjeFlot[fl.id]?.a ?? poz.a }; delete a.cel; a.przebyte = []; wynik.los[a.id] = "cofa się z flotą"; }
    }
  }
  return wynik;
}
// odwrót floty: do sąsiedniego akwenu, z którego najbliżej (po akwenach) do wybrzeża własnych ziem; cel floty skasowany → nr akwenu albo null
function odwrotFloty(f, fl) {
  const poz = stan.pozycjeFlot[fl.id], plynie = (j, t) => f.przejscia?.zegluga || (t === "morze" && AKWENY[j - 1].typ === "morze"); if (!poz) return null;
  const moje = new Set(PROWINCJE.flatMap((q, i) => stan.prowincje?.[q.id]?.wlasciciel === f.id ? [i + 1] : []));
  const start = AKWENY.flatMap((a, i) => a.brzeg.some(p => moje.has(p)) ? [i + 1] : []), odl = new Map(start.map(i => [i, 0])), kol = [...start];
  for (let k = 0; k < kol.length; k++) for (const [j, t] of AKWENY[kol[k] - 1].sasiedzi) if (!odl.has(j) && plynie(j, t)) { odl.set(j, odl.get(kol[k]) + 1); kol.push(j); }
  const opcje = AKWENY[poz.a - 1].sasiedzi.filter(([j, t]) => plynie(j, t)).sort((x, y) => (odl.get(x[0]) ?? 1e9) - (odl.get(y[0]) ?? 1e9));
  if (!opcje.length) return null;
  stan.pozycjeFlot[fl.id] = { ...poz, a: opcje[0][0] }; delete fl.cel; fl.przebyte = []; return opcje[0][0];
}
// odwrót: do sąsiedniej prowincji (przejściem dozwolonym dla frakcji), z której najbliżej do własnych ziem; cel armii skasowany
function odwrot(f, a) {
  const poz = stan.pozycjeArmii[a.id], start = NR_PROWINCJI.get(poz?.p); if (!start) return null;
  const moje = PROWINCJE.flatMap((q, i) => stan.prowincje?.[q.id]?.wlasciciel === f.id ? [i + 1] : []), odl = new Map(moje.map(i => [i, 0])), kolejka = [...moje];
  for (let k = 0; k < kolejka.length; k++) { const i = kolejka[k], q = PROWINCJE[i - 1];
    for (const [j, t] of q.sasiedzi) if (!odl.has(j) && przechodzi(f, typGranicy(q, j, t))) { odl.set(j, odl.get(i) + 1); kolejka.push(j); } }
  const P = PROWINCJE[start - 1], opcje = P.sasiedzi.filter(([j, t]) => przechodzi(f, typGranicy(P, j, t))).sort((x, y) => (odl.get(x[0]) ?? 1e9) - (odl.get(y[0]) ?? 1e9));
  if (!opcje.length) return null;
  const q = PROWINCJE[opcje[0][0] - 1]; stan.pozycjeArmii[a.id] = { ...poz, p: q.id, o: -1 }; delete a.cel; a.przebyte = []; return q;
}
// uczestnik dostaje ekran nowej bitwy raz, sam, po wejściu (zapamiętane w tej przeglądarce)
function pokazNoweBitwy() {
  if (gm || !profil?.frakcja) return;
  let widziane = []; try { widziane = JSON.parse(localStorage.getItem("frp-bitwy") || "[]"); } catch {}
  const nowa = aktywneBitwy().find(([id, b]) => !widziane.includes(id) && uczestnicyBitwy(b).some(x => (stan.pozycjeArmii?.[x] || stan.pozycjeFlot?.[x])?.f === profil.frakcja));
  if (!nowa) return;
  try { localStorage.setItem("frp-bitwy", JSON.stringify([...widziane, nowa[0]].slice(-50))); } catch {}
  pokazBitwe(nowa[0]);
}
// szlaki handlowe i linie traktatów na mapie (7.5): między stolicami stron (bez stolicy — środek pierwszej prowincji kraju)
// szlak = umowa handlowa: droga lądem po prowincjach (bez gór, rzeki wolno), a gdy lądem się nie da — prosto przez morze
const KOLORY_TRAKTATOW = { sojusz: "#3fa34d", pakt: "#4a7bd0", wasalstwo: "#9a5ad0", przejscie: "#8a8a8a", inny: "#e8e0c8" };
let warstwy = { szlaki: true, sojusze: false, bloki: false };
try { warstwy = { ...warstwy, ...JSON.parse(localStorage.getItem("frp-warstwy") || "{}") }; } catch {}
function miejsceKraju(wl) {
  const s = stolicaWl(wl); if (s) return { p: s.p.id, o: s.k };
  const p = PROWINCJE.find(q => stan.prowincje?.[q.id]?.wlasciciel === wl); return p && { p: p.id, o: -1 };
}
// szlaki handlowe razem (2026-10-19, prośba użytkownika): kolejne szlaki wolą drogi już użyte przez wcześniejsze (użyta granica kosztuje 0.4
// zamiast 1), więc szlaki w podobnym kierunku biegną wspólnym pniem i rozgałęziają się bliżej celów; wspólny odcinek rysowany raz
let szlakiPamiec = { klucz: "", linie: [] };
// odcinki [[p, q]] → ciągłe łamane (przerwane tylko w rozgałęzieniach i na końcach), żeby wygładzanie nie zostawiało kątów między odcinkami
function lancuchy(odc) {
  const k = p => p.join(","), pkt = new Map(), sas = new Map(), uzyte = new Set(), kr = (a, b) => a < b ? a + "|" + b : b + "|" + a, wynik = [];
  for (const [p, q] of odc) for (const [a, b] of [[p, q], [q, p]]) { pkt.set(k(a), a); if (!sas.has(k(a))) sas.set(k(a), []); sas.get(k(a)).push(k(b)); }
  const idz = (a, b) => {
    const l = [a, b]; uzyte.add(kr(a, b));
    for (let n; sas.get(b).length === 2 && (n = sas.get(b).find(x => !uzyte.has(kr(b, x)))); b = n) { uzyte.add(kr(b, n)); l.push(n); }
    return l;
  };
  for (const tylkoWezly of [true, false]) for (const [a, l] of sas) if (!tylkoWezly || l.length !== 2) for (const b of l) if (!uzyte.has(kr(a, b))) wynik.push(idz(a, b));   // potem pętle
  return wynik.map(l => l.map(x => pkt.get(x)));
}
function szlakiHandlowe(pary) {
  const miejsca = pary.map(([a, b]) => [miejsceKraju(a), miejsceKraju(b)]).filter(([A, B]) => A && B).sort((x, y) => JSON.stringify(x) < JSON.stringify(y) ? -1 : 1);
  const klucz = JSON.stringify([miejsca, Object.values(stan.prowincje || {}).map(d => [d.granice, d.mosty])]);
  if (klucz === szlakiPamiec.klucz) return szlakiPamiec.linie;
  const uzyte = new Set(), odcinki = new Map(), morskie = [], kraw = (i, j) => i < j ? `${i}-${j}` : `${j}-${i}`;
  for (const [A, B] of miejsca) {
    const s0 = NR_PROWINCJI.get(A.p), k0 = NR_PROWINCJI.get(B.p);
    const koszt = new Map([[s0, 0]]), skad = new Map(), gotowe = new Set();   // Dijkstra po ~900 prowincjach (bez gór, rzeki wolno)
    while (true) {
      let i = 0, m = Infinity; for (const [j, c] of koszt) if (!gotowe.has(j) && c < m) { m = c; i = j; }
      if (!i || i === k0) break; gotowe.add(i);
      const q = PROWINCJE[i - 1];
      for (const [j, t] of q.sasiedzi) { if (typGranicy(q, j, t) === "góry") continue;
        const c = m + (uzyte.has(kraw(i, j)) ? 0.4 : 1); if (c < (koszt.get(j) ?? Infinity)) { koszt.set(j, c); skad.set(j, i); } }
    }
    if (s0 !== k0 && !skad.has(k0)) { morskie.push({ styl: "morze", kolor: "#e0a92a", punkty: [punktMiejsca(A), punktMiejsca(B)].filter(Boolean) }); continue; }
    const droga = [s0]; for (let i = k0; i !== s0; i = skad.get(i)) droga.splice(1, 0, i);
    const pkt = [punktMiejsca(A), ...droga.slice(1).map(i => punktMiejsca({ p: PROWINCJE[i - 1].id, o: -1 }))];
    if (B.o >= 0) pkt[pkt.length - 1 + (s0 === k0 ? 1 : 0)] = punktMiejsca(B);   // koniec w osadzie celu (stolicy)
    droga.forEach((i, n) => n && uzyte.add(kraw(droga[n - 1], i)));
    for (let n = 1; n < pkt.length; n++) { const [x, y] = [pkt[n - 1], pkt[n]], k = [x, y].map(v => v.join(",")).sort().join("|");
      if (x && y && !odcinki.has(k)) odcinki.set(k, [x, y]); }
  }
  szlakiPamiec = { klucz, linie: [...lancuchy([...odcinki.values()]).map(p => ({ styl: "lad", kolor: "#e0a92a", punkty: krzywa(p) })), ...morskie] };
  return szlakiPamiec.linie;
}
function liniaTraktatowNaMapie() {
  const pary = t => t.strony.flatMap((a, i) => t.strony.slice(i + 1).map(b => [a, b]));
  const handel = warstwy.szlaki ? szlakiHandlowe(aktywneTraktaty().filter(([, t]) => t.typ === "handel").flatMap(([, t]) => pary(t))) : [];
  return handel.concat(aktywneTraktaty().flatMap(([, t]) => {
    if (t.typ === "handel" || t.typ === "pokoj" || !warstwy.sojusze) return [];
    return pary(t).map(([a, b]) => [miejsceKraju(a), miejsceKraju(b)]).filter(([x, y]) => x && y)
      .map(([x, y]) => ({ styl: "sojusz", kolor: KOLORY_TRAKTATOW[t.typ] || "#e8e0c8", punkty: [punktMiejsca(x), punktMiejsca(y)] }));
  }));
}
// wyszukiwarka (2026-10-19): numer albo nazwa prowincji, właściciel, nazwa osady, nazwa akwenu → podpowiedzi (datalist); wybór albo Enter
// przybliża mapę i otwiera kartę. Lista budowana przy wejściu w pole (nazwy mogą się zmieniać).
const szukaj = document.getElementById("szukaj"), listaSzukaj = document.getElementById("lista-szukaj");
let celeSzukania = new Map();
szukaj.onfocus = () => {
  celeSzukania = new Map();
  PROWINCJE.forEach((p, k) => {
    const d = stan.prowincje?.[p.id], wl = wlascicielPo(d?.wlasciciel)?.nazwa;
    celeSzukania.set(`${nazwaProwincji(p)}${d?.nazwa ? ` (${p.id})` : ""}${wl ? ` — ${wl}` : ""}`, () => { pokazProwincje(k + 1); mapa.pokaz(p.x, p.y, 0.6); });
    osadyProwincji(p).forEach(o => o.nazwa && celeSzukania.set(`${o.nazwa} — ${NAZWY_TYPOW[o.typ].toLowerCase()}, ${nazwaProwincji(p)}`, () => { pokazProwincje(k + 1); mapa.pokaz(o.x, o.y, 1.2); }));
  });
  AKWENY.forEach((a, k) => celeSzukania.set(`${nazwaAkwenu(a)} — ${a.typ === "jezioro" ? "jezioro" : "akwen morski"}`, () => { pokazAkwen(k + 1); mapa.pokaz(a.x, a.y, 0.6); }));
  listaSzukaj.replaceChildren(...[...celeSzukania.keys()].map(t => Object.assign(document.createElement("option"), { value: t })));
};
function idzDo(dokladnie) {
  const t = szukaj.value.trim(), m = t.toLowerCase(); if (!t) return;
  const cel = celeSzukania.get(t) || (!dokladnie && [...celeSzukania].find(([k]) => k.toLowerCase().includes(m))?.[1]);
  if (cel) { cel(); szukaj.value = ""; szukaj.blur(); }
}
szukaj.oninput = () => idzDo(true);   // wybrana podpowiedź = dokładna wartość
szukaj.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); idzDo(false); } else if (e.key === "Escape") { szukaj.value = ""; szukaj.blur(); } };
const przyciskiWarstw = document.getElementById("warstwy-mapy");
function pokazPrzyciskiWarstw() {
  przyciskiWarstw.innerHTML = [["szlaki", "💰 Szlaki"], ["sojusze", "🤝 Sojusze"], ["bloki", "🏛 Bloki"]].map(([k, n]) =>
    `<button type="button" data-warstwa="${k}" aria-pressed="${warstwy[k]}" class="${warstwy[k] ? "wlaczona" : ""}">${n}</button>`).join("");
  przyciskiWarstw.querySelectorAll("button").forEach(b => b.onclick = () => {
    warstwy[b.dataset.warstwa] = !warstwy[b.dataset.warstwa];
    try { localStorage.setItem("frp-warstwy", JSON.stringify(warstwy)); } catch {}
    pokazPrzyciskiWarstw(); pokazOsadyNaMapie();
  });
}
// wybór celu (GM): „Wyznacz cel” → klik w prowincję (najbliższa osada w promieniu 30 px albo pole) albo w sztandar innej armii
let celowanie = null;   // { f, a, przestaw? } — przestaw: GM stawia armię od razu w klikniętym miejscu (bez zużycia tury)
function ustawCel(cel) {
  const { f, a, przestaw, propozycja } = celowanie; celowanie = null; mapa.kursor(false);
  if (propozycja) { wybierz(f.id, true); return wyslijPropozycje({ frakcja: f.id, cel: "ruch", celId: a.id, nazwa: `${a.nazwa} → ${opisCelu({ cel })}`, zmiany: { cel }, przed: { cel: a.cel || null } }); }
  if (przestaw) { if (cel.armia) return wybierz(f.id, true); stan.pozycjeArmii[a.id] = { f: stan.pozycjeArmii[a.id].f, p: cel.p, o: cel.o }; }   // też zdejmuje z pokładu
  else a.cel = cel;
  a.przebyte = []; zapisz(stan); pokazOsadyNaMapie(); wybierz(f.id, true);
}
function celWProwincji(i, x, y) {
  if (celowanie.bitwa) { const { f } = celowanie; celowanie = null; mapa.kursor(false); wybierz(f.id, true); return napisz(".komunikat-armii", "Kliknij sztandar armii przeciwnika (przybliż mapę) — kliknij jeszcze raz „Wymuś bitwę”."); }
  if (!i) { const { f } = celowanie; celowanie = null; mapa.kursor(false); wybierz(f.id, true); return napisz(".komunikat-armii", "Cel musi być na lądzie, w prowincji — kliknij jeszcze raz „Wyznacz cel”."); }
  const p = PROWINCJE[i - 1], blisko = osadyProwincji(p).map((o, k) => [k, Math.hypot(o.x - x, o.y - y)]).filter(([, d]) => d <= 30).sort((a, b) => a[1] - b[1])[0];
  ustawCel({ p: p.id, o: blisko ? blisko[0] : -1 });
}
addEventListener("keydown", e => { if (e.key === "Escape" && celowanie) { const { f } = celowanie; celowanie = null; mapa.kursor(false); wybierz(f.id, true); } });
// armie (7.1): f.armie = [{ id, nazwa, dowodca: idBohatera | "", pospolity: imię dowódcy bez bohatera, bohaterowie: [id], oddzialy: [{ jednostka: nazwa, liczba }] }]
// (tajne_armie, domyślnie tajne); pozycja znacznika w stan.pozycjeArmii[id] = { f, p: idProwincji, o: numer osady | -1 (w polu) } — jawna
const liczebnosc = a => (a.oddzialy || []).reduce((s, o) => s + (+o.liczba || 0), 0);
const wArmii = a => [...new Set([a.dowodca, ...(a.bohaterowie || [])].filter(Boolean))];
const nazwaBohatera = id => stan.bohaterowie.find(h => h.id === id)?.imie || "?";
function polozenieArmii(id) {
  const poz = stan.pozycjeArmii?.[id];
  if (poz?.a) return `na pokładzie (${(poz.floty || []).map(x => frakcjaPo(poz.f)?.floty?.find(fl => fl.id === x)?.nazwa).filter(Boolean).join(", ") || "flota"}) — ${nazwaAkwenuNr(poz.a)}`;
  const p = poz && PROWINCJE.find(q => q.id === poz.p); if (!p) return "nieznane";
  const o = poz.o >= 0 && osadyProwincji(p)[poz.o];
  return `${nazwaProwincji(p)} — ${o ? NAZWY_TYPOW[o.typ].toLowerCase() + (o.nazwa ? ` ${o.nazwa}` : "") : "w polu"}`;
}
// bohater w armii ma status „na misji — z armią”; wyjęty z armii (albo po rozwiązaniu) wraca do stolicy
function statusyArmii(f) {   // też floty (7.8c): „na misji — z flotą”
  const wA = new Set((f.armie || []).flatMap(wArmii)), wF = new Set((f.floty || []).flatMap(wArmii));
  for (const h of stan.bohaterowie) if (h.frakcja === f.id && !h._brak) {
    const misja = wA.has(h.id) ? "z armią" : wF.has(h.id) ? "z flotą" : "";
    if (misja) { if (!["martwy", "ranny", "niewola"].includes(h.status)) Object.assign(h, { status: "misja", misja }); }   // ranny zostaje w armii ranny
    else if (h.status === "misja" && ["z armią", "z flotą"].includes(h.misja)) Object.assign(h, { status: "stolica", misja: "" });
  }
}
// nowa armia staje w stolicy frakcji, a bez stolicy — w polu pierwszej prowincji frakcji
function miejsceStartu(f) {
  const s = stolicaWl(f.id); if (s) return { f: f.id, p: s.p.id, o: s.k };
  const p = PROWINCJE.find(q => stan.prowincje?.[q.id]?.wlasciciel === f.id); return p && { f: f.id, p: p.id, o: -1 };
}
function armie(f) {
  if (tajne(f, "armie")) {
    const n = Object.values(stan.pozycjeArmii || {}).filter(x => x.f === f.id).length;
    return n || bitwyFrakcji(f) ? `<section class="armie"><h3>Armie</h3><p>Armii na mapie: ${n}.</p>${kłódka}${bitwyFrakcji(f)}</section>` : "";
  }
  const lista = f.armie ??= [], bohF = stan.bohaterowie.filter(h => h.frakcja === f.id && !["martwy", "niewola"].includes(h.status));
  const karta = a => {
    const n = liczebnosc(a), dow = a.dowodca ? nazwaBohatera(a.dowodca) : a.pospolity ? `${a.pospolity} (pospolity dowódca)` : "";
    const inni = (a.bohaterowie || []).filter(id => id !== a.dowodca).map(nazwaBohatera);
    const opis = `<p class="armia-info">${dow ? `Dowódca: <b>${esc(dow)}</b>` : `<b class="ostrzezenie">Brak dowódcy!</b>`}${inni.length ? ` · bohaterowie: ${esc(inni.join(", "))}` : ""}<br>
      ${n} ${odmiana(n, "żołnierz", "żołnierzy", "żołnierzy")}${n < 100 ? ` <b class="ostrzezenie">— poniżej 100: zostanie rozwiązana przy zamknięciu tury</b>` : ""} · ${esc(polozenieArmii(a.id))}
      ${opisBitwy(a)}
      ${a.cel ? `<br>Cel: ${esc(opisCelu(a))} — ${opisDrogiArmii(f, a, n)}` : ""}</p>`;
    const proponowany = propozycje.find(p => p.cel === "ruch" && p.celId === a.id && p.status === "czeka");
    if (!gm) return `<li><h4>${esc(a.nazwa)}</h4>${opis}${bitwaJednostki(a) ? `<p><button type="button" class="cofnij" data-ekran-bitwy="${esc(bitwaJednostki(a)[0])}">Ekran bitwy</button></p>`
      : CHMURA && !PODGLAD && moja(f) ? `<p>${proponowany ? `<small>Proponowany cel: ${esc(opisCelu({ cel: proponowany.zmiany.cel }))} — czeka na GM</small><br>` : ""}<button type="button" class="cofnij" data-prop-cel="${esc(a.id)}">Zaproponuj cel</button> <span class="opis-sekcji komunikat-armii"></span></p>` : ""}${(a.oddzialy || []).length ? `<ul class="podsumowanie">${a.oddzialy.map(o => `<li><span>${esc(o.jednostka)}</span><span>${+o.liczba || 0}</span></li>`).join("")}</ul>` : ""}</li>`;
    const zajeci = new Set([...lista.filter(x => x !== a), ...(f.floty || [])].flatMap(wArmii));
    const wolni = bohF.filter(h => !zajeci.has(h.id));
    const jedn = (f.jednostki || []).filter(j => !j.morska);   // okręty są we flotach (7.8c), nie w armiach
    const opcjeJ = v => jedn.map(j => `<option${j.nazwa === v ? " selected" : ""}>${esc(j.nazwa)}</option>`).join("") + (v && !jedn.some(j => j.nazwa === v) ? `<option selected>${esc(v)}</option>` : "");
    return `<li><form class="armia" data-a="${esc(a.id)}">
      <label>Nazwa <input name="nazwa" maxlength="60" value="${esc(a.nazwa)}"></label>
      <label>Dowódca <select name="dowodca"><option value="">— pospolity dowódca —</option>${wolni.map(h => `<option value="${esc(h.id)}"${h.id === a.dowodca ? " selected" : ""}>${esc(h.imie)}</option>`).join("")}</select></label>
      <label${a.dowodca ? " hidden" : ""}>Imię pospolitego dowódcy <input name="pospolity" maxlength="60" value="${esc(a.pospolity || "")}"></label>
      ${wolni.length ? `<fieldset class="bohaterowie-armii"><legend>Bohaterowie w armii</legend>${wolni.map(h => `<label><input type="checkbox" name="b" value="${esc(h.id)}"${(a.bohaterowie || []).includes(h.id) || h.id === a.dowodca ? " checked" : ""}${h.id === a.dowodca ? " disabled" : ""}> ${esc(h.imie)}</label>`).join("")}</fieldset>` : ""}
      ${przeprawaArmii(f, a) && !stan.pozycjeArmii?.[a.id]?.a ? `<fieldset class="bohaterowie-armii transport"><legend>Floty do przeprawy</legend>${(f.floty || []).length
        ? f.floty.map(fl => `<label><input type="checkbox" name="transport" value="${esc(fl.id)}"${(a.transport || []).includes(fl.id) ? " checked" : ""}> ${esc(fl.nazwa)} <small>(${(p => p ? `mieści ${p.ile}` : "bez limitu")(pojemnoscFloty(f, fl))})</small></label>`).join("")
        : `<p class="puste">Frakcja nie ma flot — dodaj flotę w sekcji Floty.</p>`}</fieldset>` : ""}
      <fieldset class="oddzialy"><legend>Oddziały</legend>
        ${(a.oddzialy || []).map((o, k) => `<div class="oddzial"><select name="j" aria-label="Jednostka">${opcjeJ(o.jednostka)}</select><input name="n" inputmode="numeric" value="${+o.liczba || 0}" aria-label="Liczba żołnierzy"><button type="button" class="usun" data-usun-oddzial="${k}" aria-label="Usuń oddział">×</button></div>`).join("")}
        ${jedn.length ? `<button type="button" class="cofnij" data-dodaj-oddzial>+ Oddział</button>` : `<p class="puste">Najpierw dodaj jednostki frakcji (sekcja Jednostki).</p>`}</fieldset>
      ${opis}<p class="przyciski-armii"><button type="button" class="cofnij" data-cel>Wyznacz cel</button>${a.cel ? ` <button type="button" class="cofnij" data-bez-celu>Usuń cel</button>` : ""}${(a.transport || []).length && przeprawaArmii(f, a) && !stan.pozycjeArmii?.[a.id]?.a ? ` <button type="button" class="cofnij" data-floty-na-miejsce title="Floty do przeprawy od razu w akwenie załadunku (bez czekania)">Floty od razu do załadunku</button>` : ""} <button type="button" class="cofnij" data-przestaw>Przestaw</button> ${bitwaJednostki(a) ? `<button type="button" class="cofnij" data-ekran-bitwy>Ekran bitwy</button>` : `<button type="button" class="cofnij" data-wymus>Wymuś bitwę</button>`} <button type="button" class="cofnij" data-rozwiaz>Rozwiąż armię</button></p></form></li>`;
  };
  return `<section class="armie"><h3>Armie${znacznik(f, "armie")}</h3>
    ${lista.length ? `<ul class="lista-armii">${lista.map(karta).join("")}</ul>` : `<p class="puste">Brak armii.</p>`}
    ${bitwyFrakcji(f)}
    ${gm ? `<p><button type="button" class="dodaj" data-nowa-armia>+ Armia</button> <span class="opis-sekcji komunikat-armii"></span></p>` : ""}
    ${gm ? `<fieldset class="przejscia"><legend>Umiejętności ruchu</legend>${Object.entries(PRZEJSCIA).map(([k, n]) => `<label><input type="checkbox" data-przejscie="${k}"${f.przejscia?.[k] ? " checked" : ""}> ${n}</label>`).join("")}</fieldset>`
      : Object.keys(PRZEJSCIA).some(k => f.przejscia?.[k]) ? `<p class="opis-sekcji">Umiejętności ruchu: ${Object.entries(PRZEJSCIA).filter(([k]) => f.przejscia?.[k]).map(([, n]) => n).join(", ")}.</p>` : ""}</section>`;
}
function podepnijArmie(f) {
  glowny.querySelectorAll("li > p > [data-ekran-bitwy]").forEach(b => b.onclick = () => pokazBitwe(b.dataset.ekranBitwy));
  glowny.querySelectorAll("[data-bitwa]").forEach(b => b.onclick = () => pokazBitwe(b.dataset.bitwa));
  glowny.querySelectorAll("[data-prop-cel]").forEach(b => b.onclick = () => {   // 7.14: gracz wskazuje cel jak GM, ale idzie on do GM jako propozycja
    const a = f.armie.find(x => x.id === b.dataset.propCel); celowanie = { f, a, propozycja: true }; mapa.kursor(true);
    b.nextElementSibling.textContent = `${a.nazwa}: kliknij na mapie prowincję (blisko osady = osada) albo sztandar armii do pościgu. Esc — anuluj.`;
  });
  if (!gm || tajne(f, "armie")) return;
  const zapiszA = () => { statusyArmii(f); odswiezRaporty(); zapisz(stan); wybierz(f.id, true); pokazOsadyNaMapie(); };
  glowny.querySelector("[data-nowa-armia]").onclick = () => {
    const poz = miejsceStartu(f);
    if (!poz) return napisz(".komunikat-armii", "Frakcja nie ma żadnej prowincji — najpierw przypisz jej prowincję na mapie.");
    const id = "a" + Date.now().toString(36);
    f.armie.push({ id, nazwa: `${f.armie.length + 1}. armia`, dowodca: "", pospolity: "", bohaterowie: [], oddzialy: [] });
    (stan.pozycjeArmii ??= {})[id] = poz; zapiszA();
  };
  glowny.querySelectorAll("[data-przejscie]").forEach(b => b.onchange = () => { f.przejscia = { ...f.przejscia, [b.dataset.przejscie]: b.checked }; zapiszA(); });
  glowny.querySelectorAll("form.armia[data-a]").forEach(form => {
    const a = f.armie.find(x => x.id === form.dataset.a);
    const odczyt = () => {
      const d = new FormData(form), j = d.getAll("j"), n = d.getAll("n");
      a.nazwa = d.get("nazwa").trim() || a.nazwa; a.dowodca = d.get("dowodca"); a.pospolity = a.dowodca ? "" : (d.get("pospolity") || "").trim();
      a.bohaterowie = d.getAll("b").filter(id => id !== a.dowodca);
      a.oddzialy = j.map((x, k) => ({ jednostka: x, liczba: Math.max(0, parseInt(String(n[k]).replace(/\s/g, "")) || 0) }));
      if (form.querySelector(".transport")) a.transport = d.getAll("transport");
    };
    form.onchange = () => { odczyt(); zapiszA(); };
    form.onsubmit = e => e.preventDefault();
    form.querySelector("[data-dodaj-oddzial]")?.addEventListener("click", () => { odczyt(); a.oddzialy.push({ jednostka: f.jednostki.find(j => !j.morska).nazwa, liczba: 0 }); zapiszA(); });
    form.querySelectorAll("[data-usun-oddzial]").forEach(b => b.onclick = () => { odczyt(); a.oddzialy.splice(+b.dataset.usunOddzial, 1); zapiszA(); });
    form.querySelector("[data-cel]").onclick = () => {
      celowanie = { f, a }; mapa.kursor(true);
      napisz(".komunikat-armii", `${a.nazwa}: kliknij na mapie prowincję (blisko osady = osada) albo sztandar armii do pościgu. Esc — anuluj.`);
    };
    form.querySelector("[data-przestaw]").onclick = () => {
      celowanie = { f, a, przestaw: true }; mapa.kursor(true);
      napisz(".komunikat-armii", `${a.nazwa}: kliknij na mapie, gdzie ją postawić (blisko osady = w osadzie). Ruch nie zużywa tury. Esc — anuluj.`);
    };
    form.querySelector("[data-wymus]")?.addEventListener("click", () => {
      celowanie = { f, a, bitwa: true }; mapa.kursor(true);
      napisz(".komunikat-armii", `${a.nazwa}: kliknij sztandar armii w tej samej albo sąsiedniej prowincji. Esc — anuluj.`);
    });
    form.querySelector("[data-ekran-bitwy]")?.addEventListener("click", () => pokazBitwe(bitwaJednostki(a)[0]));
    form.querySelector("[data-bez-celu]")?.addEventListener("click", () => { delete a.cel; a.przebyte = []; zapiszA(); });
    form.querySelector("[data-floty-na-miejsce]")?.addEventListener("click", () => {   // GM pomija rejs flot do załadunku (7.8e)
      const pr = przeprawaArmii(f, a); if (!pr) return;
      for (const fl of pojemnoscTransportu(f, a).floty) stan.pozycjeFlot[fl.id] = { ...stan.pozycjeFlot[fl.id], a: pr.morze[0] };
      zapiszA();
    });
    form.querySelector("[data-rozwiaz]").onclick = () => {
      if (!confirm(`Rozwiązać armię „${a.nazwa}”? Bohaterowie wrócą do stolicy.`)) return;
      f.armie.splice(f.armie.indexOf(a), 1); delete stan.pozycjeArmii?.[a.id];
      for (const [id, b] of aktywneBitwy()) if (!b.a) { b.armie = b.armie.filter(x => x !== a.id); if (b.armie.length < 2) delete stan.bitwy[id]; }   // bez przeciwnika bitwa się kończy
      zapiszA();
    };
  });
}
// floty (7.8c): f.floty = [{ id, nazwa, dowodca, pospolity, bohaterowie, oddzialy: [{ jednostka (okręt), liczba }], pojemnosc? }] (tajne jak armie);
// pozycja w stan.pozycjeFlot[id] = { f, a: nr akwenu } — jawna. Pojemność: wpisana przez GM albo suma z okrętów (liczba × pojemność typu); brak = bez limitu.
// Floty nie rozwiązują się same (użytkownik: jest ich mało — próg 100 żołnierzy tylko dla armii lądowych); usuwa je GM przyciskiem.
function pojemnoscFloty(f, fl) {
  if (fl.pojemnosc > 0) return { ile: fl.pojemnosc, skad: "wpisana przez GM" };
  const typy = f.jednostki || [], z = (fl.oddzialy || []).map(o => (+o.liczba || 0) * (typy.find(j => j.nazwa === o.jednostka)?.pojemnosc || 0));
  return z.some(Boolean) ? { ile: z.reduce((s, v) => s + v, 0), skad: "z okrętów" } : null;
}
// nowa flota: akwen przy stolicy, a bez stolicy (albo stolicy w głębi lądu) — przy pierwszej nadmorskiej prowincji frakcji; morze przed jeziorem
function akwenStartu(f) {
  const s = stolicaWl(f.id), moje = PROWINCJE.flatMap((q, i) => stan.prowincje?.[q.id]?.wlasciciel === f.id ? [i + 1] : []);
  for (const zbior of [s ? [NR_PROWINCJI.get(s.p.id)] : [], moje]) for (const typ of ["morze", "jezioro"]) {
    const k = AKWENY.findIndex(a => a.typ === typ && a.brzeg.some(i => zbior.includes(i))); if (k >= 0) return k + 1;
  }
  return 0;
}
const nazwaAkwenuNr = nr => AKWENY[nr - 1] ? nazwaAkwenu(AKWENY[nr - 1]) : "nieznane";
const punktAkwenu = nr => [AKWENY[nr - 1].x, AKWENY[nr - 1].y];
// linia trasy floty po wodzie (mapa.drogaWodna) przez kolejne akweny; zapamiętana na stałe (akweny się nie zmieniają)
// shortcut: gdy drogi wodnej nie ma (połączenie rzeką — rzeka nie jest akwenem) albo mapa jeszcze się wczytuje, rysuje proste między środkami
const drogiFlot = new Map();
function liniaFloty(akw, od, doo) {   // od, doo: inne końce niż środki akwenów (przeprawa: z prowincji załadunku do prowincji wyładunku)
  if (akw.length < 2 && !od) return akw.map(punktAkwenu);
  const k = [akw, od, doo].join("|"); if (drogiFlot.has(k)) return drogiFlot.get(k);
  const d = mapa.drogaWodna(akw.map(n => NP + n), od || punktAkwenu(akw[0]), doo || punktAkwenu(akw.at(-1)));
  if (d) drogiFlot.set(k, d);
  return d || [od, ...akw.map(punktAkwenu), doo].filter(Boolean);
}
// ruch floty (7.8d): fl.cel = nr akwenu, fl.przebyte = [nr akwenu] (tajne jak trasa armii); trasa po sąsiednich akwenach (BFS),
// jezioro i połączenie rzeczne tylko z żeglugą śródlądową (f.przejscia.zegluga). → lista akwenów bez startu albo null (brak drogi)
function trasaFloty(f, fl, cel = fl.cel) {
  const s = stan.pozycjeFlot?.[fl.id]?.a; if (!s || !AKWENY[cel - 1]) return null;
  const skad = new Map([[s, 0]]), kolejka = [s];
  for (let n = 0; n < kolejka.length && !skad.has(cel); n++) for (const [j, t] of AKWENY[kolejka[n] - 1].sasiedzi)
    if (!skad.has(j) && (f.przejscia?.zegluga || (t === "morze" && AKWENY[j - 1].typ === "morze"))) { skad.set(j, kolejka[n]); kolejka.push(j); }
  if (!skad.has(cel)) return null;
  const droga = []; for (let i = cel; i !== s; i = skad.get(i)) droga.unshift(i);
  return droga;
}
let celowanieFloty = null;   // { f, fl, tryb: "przestaw" | "cel" | "propozycja" } — klik w akwen
const NAZWY_CELOWANIA = { przestaw: "Przestaw", cel: "Wyznacz cel", propozycja: "Zaproponuj cel" };
function przestawFlote(i) {
  const { f, fl, tryb } = celowanieFloty; celowanieFloty = null; mapa.kursor(false); wybierz(f.id, true);
  if (i <= NP) return napisz(".komunikat-floty", `Flota pływa po wodzie — kliknij morze albo jezioro (jeszcze raz „${NAZWY_CELOWANIA[tryb]}”).`);
  const a = i - NP;
  if (tryb === "propozycja") return wyslijPropozycje({ frakcja: f.id, cel: "rejs", celId: fl.id, nazwa: `${fl.nazwa} → ${nazwaAkwenuNr(a)}`, zmiany: { cel: a }, przed: { cel: fl.cel || null } });
  if (tryb === "cel") fl.cel = a; else stan.pozycjeFlot[fl.id] = { ...stan.pozycjeFlot[fl.id], a };
  fl.przebyte = []; zapisz(stan); pokazOsadyNaMapie(); wybierz(f.id, true);
}
addEventListener("keydown", e => { if (e.key === "Escape" && celowanieFloty) { const { f } = celowanieFloty; celowanieFloty = null; mapa.kursor(false); wybierz(f.id, true); } });
function floty(f) {
  if (tajne(f, "armie")) {
    const n = Object.values(stan.pozycjeFlot || {}).filter(x => x.f === f.id).length;
    return n ? `<section class="floty"><h3>Floty</h3><p>Flot na wodzie: ${n}.</p>${kłódka}</section>` : "";
  }
  const lista = f.floty ??= [], okrety = (f.jednostki || []).filter(j => j.morska);
  if (!lista.length && !gm) return "";
  const bohF = stan.bohaterowie.filter(h => h.frakcja === f.id && !["martwy", "niewola"].includes(h.status));
  const karta = fl => {
    const n = liczebnosc(fl), dow = fl.dowodca ? nazwaBohatera(fl.dowodca) : fl.pospolity ? `${fl.pospolity} (pospolity dowódca)` : "";
    const inni = (fl.bohaterowie || []).filter(id => id !== fl.dowodca).map(nazwaBohatera), poj = pojemnoscFloty(f, fl);
    const opis = `<p class="armia-info">${dow ? `Dowódca: <b>${esc(dow)}</b>` : `<b class="ostrzezenie">Brak dowódcy!</b>`}${inni.length ? ` · bohaterowie: ${esc(inni.join(", "))}` : ""}<br>
      ${n} ${odmiana(n, "okręt", "okręty", "okrętów")} · ${esc(nazwaAkwenuNr(stan.pozycjeFlot?.[fl.id]?.a))}<br>
      Mieści: ${poj ? `<b>${poj.ile}</b> ${odmiana(poj.ile, "żołnierza", "żołnierzy", "żołnierzy")} (${poj.skad})` : "bez limitu"}${ladunekFloty(f, fl)}${opisBitwy(fl)}
      ${fl.cel ? (() => { const tr = trasaFloty(f, fl); return `<br>Cel: ${esc(nazwaAkwenuNr(fl.cel))} — ${tr ? zaIle(tr.length) : `<b class="ostrzezenie">brak drogi (jezioro albo rzeka — potrzebna żegluga śródlądowa)</b>`}`; })() : ""}</p>`;
    const proponowany = propozycje.find(p => p.cel === "rejs" && p.celId === fl.id && p.status === "czeka");
    if (!gm) return `<li><h4>${esc(fl.nazwa)}</h4>${opis}${bitwaFloty(fl.id) ? `<p><button type="button" class="cofnij" data-ekran-bitwy="${esc(bitwaFloty(fl.id)[0])}">Ekran bitwy</button></p>` : CHMURA && !PODGLAD && moja(f) ? `<p>${proponowany ? `<small>Proponowany cel: ${esc(nazwaAkwenuNr(proponowany.zmiany.cel))} — czeka na GM</small><br>` : ""}<button type="button" class="cofnij" data-prop-cel-floty="${esc(fl.id)}">Zaproponuj cel</button> <span class="opis-sekcji komunikat-floty"></span></p>` : ""}${(fl.oddzialy || []).length ? `<ul class="podsumowanie">${fl.oddzialy.map(o => `<li><span>${esc(o.jednostka)}</span><span>${+o.liczba || 0}</span></li>`).join("")}</ul>` : ""}</li>`;
    const zajeci = new Set([...(f.armie || []), ...lista.filter(x => x !== fl)].flatMap(wArmii)), wolni = bohF.filter(h => !zajeci.has(h.id));
    const opcjeJ = v => okrety.map(j => `<option${j.nazwa === v ? " selected" : ""}>${esc(j.nazwa)}</option>`).join("") + (v && !okrety.some(j => j.nazwa === v) ? `<option selected>${esc(v)}</option>` : "");
    return `<li><form class="armia flota" data-fl="${esc(fl.id)}">
      <label>Nazwa <input name="nazwa" maxlength="60" value="${esc(fl.nazwa)}"></label>
      <label>Dowódca <select name="dowodca"><option value="">— pospolity dowódca —</option>${wolni.map(h => `<option value="${esc(h.id)}"${h.id === fl.dowodca ? " selected" : ""}>${esc(h.imie)}</option>`).join("")}</select></label>
      <label${fl.dowodca ? " hidden" : ""}>Imię pospolitego dowódcy <input name="pospolity" maxlength="60" value="${esc(fl.pospolity || "")}"></label>
      ${wolni.length ? `<fieldset class="bohaterowie-armii"><legend>Bohaterowie we flocie</legend>${wolni.map(h => `<label><input type="checkbox" name="b" value="${esc(h.id)}"${(fl.bohaterowie || []).includes(h.id) || h.id === fl.dowodca ? " checked" : ""}${h.id === fl.dowodca ? " disabled" : ""}> ${esc(h.imie)}</label>`).join("")}</fieldset>` : ""}
      <fieldset class="oddzialy"><legend>Okręty</legend>
        ${(fl.oddzialy || []).map((o, k) => `<div class="oddzial"><select name="j" aria-label="Okręt">${opcjeJ(o.jednostka)}</select><input name="n" inputmode="numeric" value="${+o.liczba || 0}" aria-label="Liczba okrętów"><button type="button" class="usun" data-usun-oddzial="${k}" aria-label="Usuń okręty">×</button></div>`).join("")}
        ${okrety.length ? `<button type="button" class="cofnij" data-dodaj-oddzial>+ Okręty</button>` : `<p class="puste">Najpierw dodaj okręty w sekcji Jednostki (zaznacz „okręt”).</p>`}</fieldset>
      <label>Mieści żołnierzy <input name="pojemnosc" inputmode="numeric" value="${fl.pojemnosc ?? ""}" placeholder="puste = z okrętów"></label>
      ${opis}<p class="przyciski-armii"><button type="button" class="cofnij" data-cel>Wyznacz cel</button>${fl.cel ? ` <button type="button" class="cofnij" data-bez-celu>Usuń cel</button>` : ""} <button type="button" class="cofnij" data-przestaw>Przestaw</button>${bitwaFloty(fl.id) ? ` <button type="button" class="cofnij" data-ekran-bitwy>Ekran bitwy</button>` : ""} <button type="button" class="cofnij" data-rozwiaz>Rozwiąż flotę</button></p></form></li>`;
  };
  return `<section class="floty"><h3>Floty${znacznik(f, "armie")}</h3>
    ${lista.length ? `<ul class="lista-armii">${lista.map(karta).join("")}</ul>` : `<p class="puste">Brak flot.</p>`}
    ${gm ? `<p><button type="button" class="dodaj" data-nowa-flota>+ Flota</button> <span class="opis-sekcji komunikat-floty"></span></p>` : ""}</section>`;
}
function podepnijFloty(f) {
  glowny.querySelectorAll("[data-prop-cel-floty]").forEach(b => b.onclick = () => {   // gracz: cel idzie do GM jako propozycja (jak 7.14)
    celowanieFloty = { f, fl: f.floty.find(x => x.id === b.dataset.propCelFloty), tryb: "propozycja" }; mapa.kursor(true);
    b.nextElementSibling.textContent = `${celowanieFloty.fl.nazwa}: kliknij na mapie akwen, do którego ma płynąć. Esc — anuluj.`;
  });
  if (!gm || tajne(f, "armie")) return;
  const zapiszF = () => { statusyArmii(f); zapisz(stan); wybierz(f.id, true); pokazOsadyNaMapie(); };
  glowny.querySelector("[data-nowa-flota]")?.addEventListener("click", () => {
    const a = akwenStartu(f);
    if (!a) return napisz(".komunikat-floty", "Frakcja nie ma nadmorskiej prowincji — flota nie ma gdzie stanąć.");
    const id = "f" + Date.now().toString(36);
    (f.floty ??= []).push({ id, nazwa: `${f.floty.length + 1}. flota`, dowodca: "", pospolity: "", bohaterowie: [], oddzialy: [] });
    (stan.pozycjeFlot ??= {})[id] = { f: f.id, a }; zapiszF();
  });
  glowny.querySelectorAll("form.armia[data-fl]").forEach(form => {
    const fl = f.floty.find(x => x.id === form.dataset.fl);
    const odczyt = () => {
      const d = new FormData(form), j = d.getAll("j"), n = d.getAll("n"), poj = parseInt(String(d.get("pojemnosc")).replace(/\s/g, ""));
      fl.nazwa = d.get("nazwa").trim() || fl.nazwa; fl.dowodca = d.get("dowodca"); fl.pospolity = fl.dowodca ? "" : (d.get("pospolity") || "").trim();
      fl.bohaterowie = d.getAll("b").filter(id => id !== fl.dowodca);
      fl.oddzialy = j.map((x, k) => ({ jednostka: x, liczba: Math.max(0, parseInt(String(n[k]).replace(/\s/g, "")) || 0) }));
      if (poj > 0) fl.pojemnosc = poj; else delete fl.pojemnosc;
    };
    form.onchange = () => { odczyt(); zapiszF(); };
    form.onsubmit = e => e.preventDefault();
    form.querySelector("[data-dodaj-oddzial]")?.addEventListener("click", () => { odczyt(); fl.oddzialy.push({ jednostka: f.jednostki.find(j => j.morska).nazwa, liczba: 0 }); zapiszF(); });
    form.querySelectorAll("[data-usun-oddzial]").forEach(b => b.onclick = () => { odczyt(); fl.oddzialy.splice(+b.dataset.usunOddzial, 1); zapiszF(); });
    form.querySelector("[data-przestaw]").onclick = () => {
      celowanieFloty = { f, fl, tryb: "przestaw" }; mapa.kursor(true);
      napisz(".komunikat-floty", `${fl.nazwa}: kliknij na mapie akwen (morze albo jezioro), gdzie ją postawić. Ruch nie zużywa tury. Esc — anuluj.`);
    };
    form.querySelector("[data-cel]").onclick = () => {
      celowanieFloty = { f, fl, tryb: "cel" }; mapa.kursor(true);
      napisz(".komunikat-floty", `${fl.nazwa}: kliknij na mapie akwen, do którego ma płynąć (1 akwen na turę). Esc — anuluj.`);
    };
    form.querySelector("[data-bez-celu]")?.addEventListener("click", () => { delete fl.cel; fl.przebyte = []; zapiszF(); });
    form.querySelector("[data-ekran-bitwy]")?.addEventListener("click", () => pokazBitwe(bitwaFloty(fl.id)[0]));
    form.querySelector("[data-rozwiaz]").onclick = () => {
      if ((f.armie || []).some(a => stan.pozycjeArmii?.[a.id]?.floty?.includes(fl.id))) return napisz(".komunikat-floty", `Na pokładzie „${fl.nazwa}” płynie armia — najpierw przestaw ją na ląd.`);
      if (!confirm(`Rozwiązać flotę „${fl.nazwa}”? Bohaterowie wrócą do stolicy.`)) return;
      f.floty.splice(f.floty.indexOf(fl), 1); delete stan.pozycjeFlot?.[fl.id];
      for (const [id, b] of aktywneBitwy()) if (b.floty?.includes(fl.id)) { b.floty = b.floty.filter(x => x !== fl.id); if (new Set(b.floty.map(x => stan.pozycjeFlot[x]?.f)).size < 2) delete stan.bitwy[id]; }   // bez przeciwnika bitwa się kończy
      zapiszF();
    };
  });
}
// budynki i złoża w całym kraju (6.4): ile budynków i złóż daje każdy zasób + puste sloty
function budynkiFrakcji(f) {
  if (f._brak?.budynki) return `<section><h3>Budynki i złoża</h3>${kłódka}</section>`;
  const prow = PROWINCJE.filter(p => stan.prowincje?.[p.id]?.wlasciciel === f.id); if (!prow.length) return "";
  const ile = {}, zloza = {}; let puste = 0, wszystkie = 0;
  for (const p of prow) {
    const b = f.budynki?.[p.id] || {}, n = osadyProwincji(p).reduce((s, o) => s + slotyOsady(o), 0); wszystkie += n;
    for (let k = 0; k < n; k++) { const v = b.sloty?.[k]; if (v) ile[v] = (ile[v] || 0) + 1; else puste++; }
    if (b.zloze) zloza[b.zloze] = (zloza[b.zloze] || 0) + 1;
  }
  const klucze = [...new Set([...Object.keys(ile), ...Object.keys(zloza)])].sort((a, b) => nazwaZasobu(a).localeCompare(nazwaZasobu(b), "pl"));
  return `<section><h3>Budynki i złoża ${znacznik(f, "budynki")}</h3>
    <p class="opis-sekcji">${prow.length} ${odmiana(prow.length, "prowincja", "prowincje", "prowincji")}, ${wszystkie} ${odmiana(wszystkie, "slot", "sloty", "slotów")} — ${puste ? `<b>puste: ${puste}</b>` : "wszystkie zajęte"}.</p>
    ${klucze.length ? `<ul class="podsumowanie">${klucze.map(k => `<li><span>${esc(nazwaZasobu(k))}</span><span>${[ile[k] && `budynki: ${ile[k]}`, zloza[k] && `złoża: ${zloza[k]}`].filter(Boolean).join(" · ")}</span></li>`).join("")}</ul>` : `<p class="puste">Brak budynków i złóż.</p>`}</section>`;
}
// widoczność (GM): przełączniki tajne/jawne per rodzaj danych tej frakcji
const widocznosc = f => !gm || !CHMURA ? "" : `<section class="widocznosc"><h3>Widoczność dla innych graczy</h3>
  <p class="opis-sekcji">Tajne widzi tylko gracz tej frakcji i GM. Jawne — wszyscy.</p><div class="przelaczniki">${Object.entries(RODZAJE_TAJNE).map(([r, n]) =>
    `<button type="button" class="przelacznik${jawneR(f, r) ? " jawne" : ""}" data-rodzaj="${r}" aria-pressed="${jawneR(f, r)}">${n}: ${jawneR(f, r) ? "👁 jawne" : "🔒 tajne"}</button>`).join("")}</div></section>`;
// notatki: gracza (pisze gracz tej frakcji i GM, czyta on + GM), GM (tylko GM/admin); zapis po wyjściu z pola
const notatki = f => {
  const pole = (klucz, tytul, opis, mozna) => `<section class="notatki"><h3>${tytul}</h3><p class="opis-sekcji">${opis}</p>
    ${mozna ? `<textarea data-klucz="${klucz}" rows="4" maxlength="5000" aria-label="${tytul}">${esc(f[klucz] || "")}</textarea>` : f[klucz] ? tekst(f[klucz]) : `<p class="puste">Pusto.</p>`}</section>`;
  return (f._brak?.notatkiGracza ? "" : pole("notatkiGracza", "Notatki gracza", "Widzi gracz tej frakcji i GM.", gm || (!PODGLAD && moja(f))))
    + (f._brak?.notatkiGM || !gm ? "" : pole("notatkiGM", "Notatki GM", "Widzi tylko GM i admin.", true));
};
function podepnijTajne(f) {
  glowny.querySelectorAll(".przelacznik").forEach(b => b.onclick = () => {
    const r = b.dataset.rodzaj; f.jawne = { ...f.jawne, [r]: !jawneR(f, r) }; zapisz(stan); wybierz(f.id, true);
  });
  glowny.querySelectorAll(".notatki textarea").forEach(t => t.onchange = () => { f[t.dataset.klucz] = t.value; zapisz(stan); });
}
// edycja opisów: GM zapisuje od razu, gracz swojego państwa wysyła propozycję do GM (etap 4.4)
const POLA_FRAKCJI = [["stolica", "Stolica"], ["ustroj", "Ustrój"], ["wladca", "Władca"], ["godlo", "Godło"], ["motto", "Motto"], ["specjalizacja", "Specjalizacja"], ["tereny", "Tereny"]];
const POLA_BOHATERA = [["tytul", "Tytuł"], ["funkcja", "Funkcja"], ["wiek", "Wiek"], ["bron", "Broń i wierzchowiec"], ["opis", "Opis", "dlugie"]];
const etykieta = k => [...POLA_FRAKCJI, ...POLA_BOHATERA, ["osada", "Stolica"], ["budynki", "Budynki i złoże"], ["cel", "Cel ruchu"], ["traktat", "Traktat"], ["zerwij", "Zerwanie traktatu"]].find(([x]) => x === k)?.[1] || (k === "opis" ? "Opis" : k);
const mozeEdytowac = f => gm || (CHMURA && !PODGLAD && moja(f));
const sekcjaEdycji = (s = { tytul: "", tekst: "" }) => `<li><input class="tytul-sekcji" maxlength="100" value="${esc(s.tytul)}" placeholder="Tytuł sekcji" aria-label="Tytuł sekcji">
  <button type="button" class="usun" aria-label="Usuń sekcję" title="Usuń sekcję">×</button>
  <textarea class="tekst-sekcji" rows="6" maxlength="20000" aria-label="Treść sekcji">${esc(s.tekst)}</textarea></li>`;
function formularzEdycji({ naglowek, pola, wartosci, sekcje, onZapisz }) {
  okno.innerHTML = `<form class="edycja"><div class="okno-glowa"><div><h2>${esc(naglowek)}</h2>
      <p class="rasa">${gm ? "Zmiany zapiszą się od razu." : "Zmiany trafią do GM do akceptacji."}</p></div><button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    <div class="pola-edycji">${pola.map(([k, n, typ]) => `<label>${n}${typ === "dlugie"
      ? `<textarea name="${k}" rows="8" maxlength="20000">${esc(wartosci[k] || "")}</textarea>` : `<input name="${k}" maxlength="300" value="${esc(wartosci[k] || "")}">`}</label>`).join("")}</div>
    ${sekcje ? `<h3>Sekcje opisu</h3><ol class="sekcje-edycji">${sekcje.map(sekcjaEdycji).join("")}</ol><button type="button" class="cofnij" id="dodaj-sekcje">+ Dodaj sekcję</button>` : ""}
    <p class="przyciski-tur"><button class="dodaj">${gm ? "Zapisz" : "Wyślij propozycję"}</button><button type="button" class="cofnij anuluj">Anuluj</button></p></form>`;
  const form = okno.querySelector("form"), ol = form.querySelector(".sekcje-edycji");
  form.querySelectorAll(".zamknij, .anuluj").forEach(b => b.onclick = () => okno.close());
  if (ol) {
    ol.onclick = e => e.target.closest(".usun")?.closest("li").remove();
    form.querySelector("#dodaj-sekcje").onclick = () => { ol.insertAdjacentHTML("beforeend", sekcjaEdycji()); ol.lastElementChild.querySelector("input").focus(); };
  }
  form.onsubmit = e => {
    e.preventDefault();
    const nowe = Object.fromEntries(pola.map(([k]) => [k, form.elements[k].value.trim()]));
    if (ol) nowe.opis = [...ol.children].map(li => ({ tytul: li.querySelector(".tytul-sekcji").value.trim(), tekst: li.querySelector(".tekst-sekcji").value.trim() }))
      .filter(s => s.tytul || s.tekst);
    onZapisz(nowe);
  };
  otworzOkno(okno);
}
async function zapiszEdycje(cel, obiekt, f, nowe) {
  const zmiany = {}, przed = {};
  for (const k in nowe) if (JSON.stringify(nowe[k] ?? "") !== JSON.stringify(obiekt[k] ?? "")) { zmiany[k] = nowe[k]; przed[k] = obiekt[k] ?? ""; }
  if (!Object.keys(zmiany).length) return okno.close();
  if (gm) { Object.assign(obiekt, zmiany); zapisz(stan); okno.close(); return wybierz(f.id, true); }
  try {
    await zaproponuj({ frakcja: f.id, cel, celId: obiekt.id, nazwa: cel === "frakcja" ? f.nazwa : obiekt.imie, zmiany, przed });
    okno.close(); alert("Propozycja wysłana do GM. Jej status zobaczysz na karcie swojego państwa.");
  } catch (e) { alert("Nie udało się wysłać propozycji: " + komunikat(e)); }
}
const edytujFrakcje = f => formularzEdycji({ naglowek: `${f.nazwa} — opis`, pola: POLA_FRAKCJI, wartosci: f, sekcje: f.opis,
  onZapisz: nowe => zapiszEdycje("frakcja", f, f, nowe) });
const edytujBohatera = (h, f) => formularzEdycji({ naglowek: h.imie, pola: POLA_BOHATERA, wartosci: h, onZapisz: nowe => zapiszEdycje("bohater", h, f, nowe) });
// propozycje: GM widzi oczekujące (Panel GM + licznik na przycisku), gracz — swoje na karcie państwa
let odpieciePropozycji = () => {};
const STATUS_PROP = { czeka: "czeka na GM", przyjeta: "przyjęta", odrzucona: "odrzucona" };
const odznaka = () => { document.getElementById("panel-gm").textContent = gm && propozycje.length ? `Panel GM (${propozycje.length})` : "Panel GM"; };
function sluchajPropozycjiDlaRoli() {
  odpieciePropozycji(); odpieciePropozycji = () => {}; propozycje = []; odznaka();
  if (!CHMURA || !profil || profil.rola === "oczekujacy" || (!gm && !profil.frakcja)) return;
  odpieciePropozycji = sluchajPropozycji(gm, profil.frakcja, l => { propozycje = l; odznaka(); pokazOsadyNaMapie(); if (widok === "gm" || widok === profil.frakcja) odswiezWidok(); },
    e => console.warn("propozycje", e.code));
}
// cel propozycji albo null, gdy już nieaktualna (stolica, budynki: prowincja musi dalej należeć do frakcji gracza)
function celPropozycji(p) {
  if (p.cel === "frakcja") return stan.frakcje.find(f => f.id === p.celId);
  if (p.cel === "bohater") return stan.bohaterowie.find(h => h.id === p.celId);
  if (p.cel === "ruch") return armiaPropozycji(p);
  if (p.cel === "rejs") { const fl = frakcjaPo(p.frakcja)?.floty?.find(x => x.id === p.celId); return fl && stan.pozycjeFlot?.[fl.id] && AKWENY[p.zmiany.cel - 1] ? fl : null; }
  if (p.cel === "traktat") return p.zmiany.traktat.strony.every(w => wlascicielPo(w)) ? p.zmiany.traktat : null;
  if (p.cel === "zerwanie") { const t = stan.traktaty?.[p.celId]; return t && !t.zerwany ? t : null; }
  const pr = PROWINCJE.find(q => q.id === p.celId);
  if (!pr || stan.prowincje?.[pr.id]?.wlasciciel !== p.frakcja) return null;
  return p.cel !== "stolica" || osadyProwincji(pr)[p.zmiany.osada]?.typ === "miasto" ? pr : null;
}
const armiaPropozycji = p => {   // ruch (7.14): armia gracza i cel muszą dalej istnieć
  const a = frakcjaPo(p.frakcja)?.armie?.find(x => x.id === p.celId), c = p.zmiany.cel;
  return a && (c.armia ? stan.pozycjeArmii?.[c.armia] : NR_PROWINCJI.has(c.p)) ? a : null;
};
const RODZAJ_PROP = { frakcja: ["państwo", "Tego państwa już nie ma"], bohater: ["bohater", "Tego bohatera już nie ma"],
  stolica: ["stolica", "Ta prowincja albo miasto już nie należy do gracza (albo już jest stolicą)"], budynki: ["budynki", "Ta prowincja już nie należy do gracza"],
  ruch: ["ruch armii", "Tej armii albo celu już nie ma"], rejs: ["ruch floty", "Tej floty albo akwenu już nie ma"],traktat: ["traktat", "Którejś ze stron już nie ma"], zerwanie: ["zerwanie traktatu", "Ten traktat jest już zerwany albo usunięty"] };
// traktat (7.15): zgodę dają gracze-frakcje ze stron (poza autorem); za kraje NPC decyduje GM
const stronyDoZgody = p => p.cel === "traktat" ? (p.strony || []).filter(w => w !== p.frakcja && frakcjaPo(w)) : [];
const wszyscyZgodni = p => stronyDoZgody(p).every(w => p.zgody?.[w] === true);
const zgodyTekst = p => stronyDoZgody(p).map(w => `${nazwaKraju(w)} ${p.zgody?.[w] === true ? "✓" : p.zgody?.[w] === false ? "✗ odmowa" : "… czeka"}`).join(" · ");
const opisTraktatu = t => `${TYPY_TRAKTATOW[t.typ] || t.typ} · strony: ${nazwyStron(t)}${t.tajny ? " · tajny" : ""}${t.opis ? `

${t.opis}` : ""}`;
const sameZmiany = (naglowek, txt) => `<div class="zmiana-pola"><h5>${esc(naglowek)}</h5><div class="po">${tekst(txt)}</div></div>`;
// obecny stan pól propozycji — do porównania z „przed” (ktoś zmienił w międzyczasie?) i do pokazania przed → po
const obecnie = (p, o) => ["traktat", "zerwanie"].includes(p.cel) ? {} : ["ruch", "rejs"].includes(p.cel) ? { cel: o.cel || null } : p.cel === "stolica" ? { osada: opisStolicy(p.frakcja) } : p.cel === "budynki" ? { budynki: tylkoBudynki(budynki(o)) } : o;
const zmianyPropozycji = (p, o) => p.cel === "traktat" ? sameZmiany("Nowy traktat", opisTraktatu(p.zmiany.traktat)) + (stronyDoZgody(p).length ? `<p class="zgody">Zgoda stron: ${esc(zgodyTekst(p))}</p>` : "")
  : p.cel === "zerwanie" ? sameZmiany("Zerwanie traktatu", o ? `${o.nazwa}: ${opisTraktatu(o)}` : "—")
  : p.cel === "ruch" ? zmianaPola("cel", p.przed?.cel ? opisCelu({ cel: p.przed.cel }) : "brak celu", opisCelu({ cel: p.zmiany.cel }))
  : p.cel === "rejs" ? zmianaPola("cel", p.przed?.cel ? nazwaAkwenuNr(p.przed.cel) : "brak celu", nazwaAkwenuNr(p.zmiany.cel))
  : p.cel === "stolica" ? zmianaPola("osada", p.przed?.osada, o && opisOsady(o, p.zmiany.osada))
  : p.cel === "budynki" ? (o ? zmianaPola("budynki", tekstBudynkow(o, p.przed?.budynki), tekstBudynkow(o, p.zmiany.budynki)) : "")
  : Object.keys(p.zmiany).map(k => zmianaPola(k, p.przed?.[k], p.zmiany[k])).join("");
function przyjmijPropozycje(p, o) {
  if (p.cel === "stolica") return ustawStolice(o, p.zmiany.osada);
  if (p.cel === "budynki") return ustawBudynki(o, p.zmiany.budynki);
  if (["ruch", "rejs"].includes(p.cel)) { o.cel = p.zmiany.cel; o.przebyte = []; zapisz(stan); return pokazOsadyNaMapie(); }
  if (p.cel === "traktat") return zawrzyjTraktat({ ...p.zmiany.traktat });
  if (p.cel === "zerwanie") return zerwijTraktat(p.celId);
  Object.assign(o, p.zmiany); zapisz(stan);
}
const wartoscTekstem = v => v ? tekst(String(v)) : `<p class="puste">puste</p>`;
function zmianaPola(k, stare, nowe) {
  if (k !== "opis" || !Array.isArray(nowe)) return `<div class="zmiana-pola"><h5>${esc(etykieta(k))}</h5>
    <div class="przed">${wartoscTekstem(stare)}</div><div class="po">${wartoscTekstem(nowe)}</div></div>`;
  const st = new Map((stare || []).map(s => [s.tytul, s.tekst])), nw = new Map(nowe.map(s => [s.tytul, s.tekst]));
  const tytuly = [...new Set([...st.keys(), ...nw.keys()])].filter(t => st.get(t) !== nw.get(t));
  return tytuly.map(t => `<div class="zmiana-pola"><h5>Sekcja „${esc(t || "bez tytułu")}” — ${!st.has(t) ? "nowa" : !nw.has(t) ? "usunięta" : "zmieniona"}</h5>
    <div class="przed">${wartoscTekstem(st.get(t))}</div><div class="po">${wartoscTekstem(nw.get(t))}</div></div>`).join("")
    + (tytuly.length ? "" : `<div class="zmiana-pola"><h5>Kolejność sekcji opisu</h5></div>`);
}
const kartaPropozycji = p => {
  const o = celPropozycji(p), teraz = o && obecnie(p, o), [rodzaj, nieaktualna] = RODZAJ_PROP[p.cel] || [p.cel, "Propozycja nieaktualna"];
  const konflikt = o && Object.keys(p.przed || {}).some(k => JSON.stringify(teraz[k] ?? "") !== JSON.stringify(p.przed[k] ?? ""));
  return `<article class="propozycja" data-id="${esc(p.id)}"><header><b>${esc(p.nazwa)}</b> <small>${rodzaj} · ${esc(frakcjaPo(p.frakcja)?.nazwa || "")} · od ${esc(p.email)} · ${esc(new Date(p.czas).toLocaleString("pl-PL"))}</small></header>
    ${!o ? `<p class="ostrzezenie">⚠ ${nieaktualna} — można tylko odrzucić.</p>` : konflikt ? `<p class="ostrzezenie">⚠ Od czasu propozycji ktoś to zmienił — akceptacja nadpisze obecną wersję.</p>` : ""}
    ${zmianyPropozycji(p, o)}
    <label class="komentarz">Komentarz dla gracza (opcjonalnie)<input name="komentarz" maxlength="500"></label>
    <p class="przyciski-tur">${o ? `<button type="button" class="dodaj" data-akcja="przyjmij">Akceptuj</button>` : ""}<button type="button" class="cofnij" data-akcja="odrzuc">Odrzuć</button></p></article>`;
};
const propozycjeSekcja = () => !CHMURA || !gm ? "" : `<section class="propozycje"><h3>Propozycje graczy${propozycje.length ? ` <span class="licznik">${propozycje.length}</span>` : ""}</h3>
  ${propozycje.length ? propozycje.map(kartaPropozycji).join("") : `<p class="puste">Brak oczekujących propozycji.</p>`}</section>`;
function mojePropozycje(f) {
  if (!CHMURA || PODGLAD || gm || !moja(f)) return "";
  const moje = propozycje.filter(p => p.frakcja === f.id), doZgody = propozycje.filter(p => p.cel === "traktat" && p.frakcja !== f.id && p.status === "czeka" && p.strony?.includes(f.id));
  return (doZgody.length ? `<section class="propozycje"><h3>Traktaty do Twojej zgody</h3><ul class="lista-propozycji">${doZgody.map(p => `<li data-id="${esc(p.id)}"><span><b>${esc(p.zmiany.traktat.nazwa)}</b> <small>od: ${esc(nazwaKraju(p.frakcja))}</small>
    ${tekst(opisTraktatu(p.zmiany.traktat))}<small>Zgoda stron: ${esc(zgodyTekst(p))}</small></span>
    <span><button type="button" class="dodaj" data-zgoda="1"${p.zgody?.[f.id] === true ? " disabled" : ""}>Zgadzam się</button> <button type="button" class="cofnij" data-zgoda="0"${p.zgody?.[f.id] === false ? " disabled" : ""}>Nie zgadzam się</button></span></li>`).join("")}</ul></section>` : "")
    + (moje.length ? `<section class="propozycje"><h3>Twoje propozycje</h3>
  <ul class="lista-propozycji">${moje.map(p => `<li data-id="${esc(p.id)}"><span><b>${esc(p.nazwa)}</b>: ${esc(Object.keys(p.zmiany).map(etykieta).join(", "))}
    <span class="status-prop s-${p.status}">${STATUS_PROP[p.status] || p.status}</span>${stronyDoZgody(p).length && p.status === "czeka" ? `<br><small>Zgoda stron: ${esc(zgodyTekst(p))}</small>` : ""}${p.komentarz ? `<br><small>GM: ${esc(p.komentarz)}</small>` : ""}</span>
    ${p.status === "czeka" ? `<button type="button" class="cofnij" data-akcja="wycofaj">Wycofaj</button>` : ""}</li>`).join("")}</ul></section>` : "");
}
// gracz (7.15): propozycja nowego traktatu (okno) i zerwania traktatu, w którym jego frakcja jest stroną
function proponujTraktat(f) {
  okno.innerHTML = `<form class="edycja nowy-traktat"><div class="okno-glowa"><div><h2>Propozycja traktatu</h2>
    <p class="rasa">Najpierw zgodzić się muszą inni gracze-strony, potem decyduje GM.</p></div><button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    ${polaTraktatu(f.id)}<p class="przyciski-tur"><button class="dodaj">Wyślij propozycję</button><button type="button" class="cofnij anuluj">Anuluj</button> <span class="opis-sekcji komunikat-traktatu"></span></p></form>`;
  const form = okno.querySelector("form");
  form.querySelectorAll(".zamknij, .anuluj").forEach(b => b.onclick = () => okno.close());
  form.onsubmit = e => {
    e.preventDefault();
    const d = new FormData(form), strony = [...new Set([f.id, ...d.getAll("strona")])];
    if (strony.length < 2) return form.querySelector(".komunikat-traktatu").textContent = "Zaznacz co najmniej jedną drugą stronę.";
    const t = { nazwa: d.get("nazwa").trim(), typ: d.get("typ"), strony, tajny: d.get("tajny") === "on", opis: d.get("opis").trim() };
    okno.close();
    wyslijPropozycje({ frakcja: f.id, cel: "traktat", celId: "", nazwa: `Traktat: ${t.nazwa}`, strony, zgody: { [f.id]: true }, zmiany: { traktat: t }, przed: {} });
  };
  otworzOkno(okno);
}
function podepnijPropozycje() {
  glowny.querySelectorAll("[data-akcja=wycofaj]").forEach(b => b.onclick = () => {
    if (confirm("Wycofać tę propozycję?")) wycofaj(b.closest("li").dataset.id).catch(e => alert("Nie udało się: " + komunikat(e)));
  });
  const mojaF = !gm && frakcjaPo(profil?.frakcja);
  glowny.querySelectorAll("[data-zgoda]").forEach(b => b.onclick = () => {
    zgodaStrony(b.closest("li").dataset.id, mojaF.id, b.dataset.zgoda === "1").catch(e => alert("Nie udało się: " + komunikat(e)));
  });
  glowny.querySelector("[data-prop-traktat]")?.addEventListener("click", () => proponujTraktat(mojaF));
  glowny.querySelectorAll("[data-prop-zerwij]").forEach(b => b.onclick = () => {
    const t = stan.traktaty[b.dataset.propZerwij];
    if (confirm(`Zaproponować GM zerwanie traktatu „${t.nazwa}”?`)) wyslijPropozycje({ frakcja: mojaF.id, cel: "zerwanie", celId: b.dataset.propZerwij,
      nazwa: `Zerwanie: ${t.nazwa}`, strony: [mojaF.id], zgody: {}, zmiany: { zerwij: true }, przed: {} });
  });
  glowny.querySelectorAll(".propozycja").forEach(a => a.querySelectorAll("[data-akcja]").forEach(b => b.onclick = async () => {
    const p = propozycje.find(x => x.id === a.dataset.id), kom = a.querySelector("[name=komentarz]").value.trim();
    if (b.dataset.akcja === "przyjmij" && !wszyscyZgodni(p) && !confirm(`Nie wszystkie strony się zgodziły (${zgodyTekst(p)}). Zaakceptować mimo to?`)) return;
    a.querySelectorAll("button").forEach(x => x.disabled = true);
    try {
      // przyjęta wchodzi w życie i znika z bazy (prośba użytkownika); odrzucona zostaje z komentarzem, sprząta ją sprzatnijPropozycje po 7 dniach
      if (b.dataset.akcja === "przyjmij") { przyjmijPropozycje(p, celPropozycji(p)); await wycofaj(p.id); }
      else await rozpatrz(p.id, "odrzucona", kom);
    } catch (e) { alert("Nie udało się: " + komunikat(e)); a.querySelectorAll("button").forEach(x => x.disabled = false); }
  }));
}
// bohaterowie: siatka kart + okno ze szczegółami; status zmienia GM/admin
const STATUSY = { stolica: "W stolicy", misja: "Na misji", ranny: "Ranny", martwy: "Martwy", niewola: "W niewoli" };   // niewola (7.1i): misja = u kogo
const MISJE = ["z armią", "z flotą", "inne"];
const statusTekst = h => STATUSY[h.status] + (h.status === "misja" && h.misja ? ` (${h.misja})` : h.status === "niewola" && h.misja ? ` (u: ${h.misja})` : "");
const inicjaly = imie => imie.replace(/[„”"]/g, "").split(/\s+/).filter(s => /^\p{Lu}/u.test(s)).slice(0, 2).map(s => s[0]).join("") || imie[0];
// pixel art 128 px, a gdy go nie ma — inicjały na tle w kolorze frakcji
const portret = (h, duzy) => {
  const url = plikPortretu(h);
  return `<div class="portret${duzy ? " duzy" : ""}" aria-hidden="true">${url ? `<img src="${url}" alt="" data-portret="${esc(slowoPortretu(h))}">` : esc(inicjaly(h.imie))}</div>`;
};
const bohaterowie = f => {
  const lista = stan.bohaterowie.filter(h => h.frakcja === f.id).sort((a, b) => b.wladca - a.wladca);
  return `<section><h3>Bohaterowie${znacznik(f, "statusy")}</h3><div class="bohaterowie">${lista.map(h => `<button type="button" class="bohater" data-id="${h.id}">
    ${portret(h)}<span class="imie">${esc(h.imie)}</span>${h.wladca ? `<span class="wladca">Władca</span>` : ""}
    <span class="tytul">${esc(h.tytul || h.funkcja)}</span>${h._brak ? "" : `<span class="status s-${h.status}">${esc(statusTekst(h))}</span>`}</button>`).join("")}</div></section>`;
};
const okno = document.getElementById("bohater");
function pokazBohatera(h, f) {
  const pola = [["Tytuł", h.tytul], ["Funkcja", h.funkcja], ["Wiek", h.wiek], ["Broń i wierzchowiec", h.bron]].filter(([, w]) => w);
  okno.style.setProperty("--kolor", f.kolor);
  okno.innerHTML = `<div class="okno-glowa">${portret(h, true)}<div><h2>${esc(h.imie)}</h2><p class="rasa">${esc(f.nazwa)}${h.wladca ? " · władca" : ""}</p>
      ${mozeEdytowac(f) ? `<button type="button" class="cofnij edytuj-bohatera">${gm ? "✎ Edytuj" : "✎ Zaproponuj zmiany"}</button>` : ""}</div>
      <button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    <label class="anim-portretow"${matchMedia("(prefers-reduced-motion: reduce)").matches ? ' title="Wyłączone: system ogranicza ruch"' : ""}><input type="checkbox" name="anim"${animacjePortretow() ? " checked" : ""}> Animacje portretów</label>
    <dl class="fakty">${pola.map(([k, w]) => `<div><dt>${k}</dt><dd>${esc(w)}</dd></div>`).join("")}</dl>
    ${gm ? "" : h._brak ? `<p class="status-tekst">Status: 🔒 tajny</p>` : `<p class="status-tekst">Status: <span class="status s-${h.status}">${esc(statusTekst(h))}</span></p>`}
    <form class="status-form"${gm ? "" : " hidden"}><label>Status <select name="status">${Object.entries(STATUSY).map(([k, w]) => `<option value="${k}"${k === h.status ? " selected" : ""}>${w}</option>`).join("")}</select></label>
      <label${h.status === "misja" ? "" : " hidden"}>Misja <select name="misja">${MISJE.map(m => `<option${m === h.misja ? " selected" : ""}>${m}</option>`).join("")}</select></label></form>
    <div class="opis">${h.opis ? tekst(h.opis) : `<p class="puste">Gracz nie dodał jeszcze opisu.</p>`}</div>`;
  okno.querySelector(".zamknij").onclick = () => okno.close();
  const edytuj = okno.querySelector(".edytuj-bohatera"); if (edytuj) edytuj.onclick = () => edytujBohatera(h, f);
  okno.querySelector(".anim-portretow input").onchange = e => { ustawAnimacjePortretow(e.target.checked); if (e.target.checked) ozywPortrety(okno, f.kolor); };
  ozywPortrety(okno, f.kolor);
  okno.querySelector(".status-form").onchange = e => {
    const d = new FormData(e.currentTarget); h.status = d.get("status"); h.misja = h.status === "misja" ? d.get("misja") : "";
    e.currentTarget.elements.misja.parentElement.hidden = h.status !== "misja";
    zapisz(stan); wybierz(f.id, true);
  };
  otworzOkno(okno);
}
okno.onclick = e => { if (e.target === okno) okno.close(); }; // klik w tło zamyka
okno.addEventListener("close", () => zatrzymajPortrety(okno));   // animowany portret (7.3) nie chodzi w zamkniętym oknie
let widok = null; // co jest otwarte: id frakcji albo "gm" — do odświeżenia po zmianach od innych osób
function wybierz(id, zostanPrzewiniecie) {
  const f = stan.frakcje.find(x => x.id === id) || stan.frakcje[0]; widok = f.id; mapa.wybierz(0);
  [...lista.children].forEach(b => b.setAttribute("aria-current", b.dataset.id === f.id));
  glowny.style.setProperty("--kolor", f.kolor);
  const pola = [["Stolica", f.stolica], ["Ustrój", f.ustroj], ["Władca", f.wladca], ["Godło", f.godlo],
    ["Specjalizacja", f.specjalizacja], ["Tereny", f.tereny]].filter(([, w]) => w);
  glowny.innerHTML = `<article class="karta">
    <header class="naglowek">${herbFrakcji(f) ? `<img class="herb-obraz" src="${herbFrakcji(f)}" alt="">` : `<div class="herb" aria-hidden="true">${esc(f.nazwa[0])}</div>`}
      <div><h2>${esc(f.nazwa)}</h2><p class="rasa">${esc([f.przydomek, f.rasa].filter(Boolean).join(" · "))}</p>
      ${mozeEdytowac(f) ? `<button type="button" class="cofnij edytuj-opis">${gm ? "✎ Edytuj opis" : "✎ Zaproponuj zmiany"}</button>` : ""}
      <button type="button" class="cofnij zrob-grafike" title="Obrazek krainy do wklejenia na Discorda">🖼 Zrób grafikę</button></div></header>
    ${f.motto ? `<blockquote class="motto">„${esc(f.motto)}”</blockquote>` : ""}
    <dl class="fakty">${pola.map(([k, w]) => `<div><dt>${k}</dt><dd>${esc(w)}${k === "Stolica" && stolicaWl(f.id) ? ` <button type="button" class="cofnij pokaz-stolice">na mapie</button>` : ""}</dd></div>`).join("")}</dl>
    ${!f.stolica && stolicaWl(f.id) ? `<p><button type="button" class="cofnij pokaz-stolice">★ Stolica na mapie</button></p>` : ""}
    ${wrogowie(f.id).length ? `<p class="wojna">⚔ W stanie wojny z: <b>${esc(wrogowie(f.id).map(w => wlascicielPo(w)?.nazwa || w).join(", "))}</b></p>` : ""}
    ${bohaterowie(f)}
    ${stany(f)}
    ${zasoby(f)}
    ${wykresyZasobow(f)}
    ${jednostki(f)}
    ${armie(f)}
    ${floty(f)}
    ${kronikaFrakcji(f)}
    ${blokiFrakcji(f)}${traktatyFrakcji(f)}
    ${budynkiFrakcji(f)}
    ${mojePropozycje(f)}
    ${notatki(f)}
    ${widocznosc(f)}
    ${f.opis.map(s => `<section><h3>${esc(s.tytul)}</h3>${tekst(s.tekst)}</section>`).join("")}
  </article>`;
  glowny.querySelector("[data-pokaz-bloki]")?.addEventListener("click", pokazBloki);
  ozywPortrety(glowny, f.kolor);   // miniatury bohaterów ożywają po najechaniu (7.3)
  podepnijWykresy(glowny);
  podepnijStany(f); podepnijZasoby(f); podepnijJednostki(f); podepnijArmie(f); podepnijFloty(f); podepnijTajne(f); podepnijPropozycje();
  const edytuj = glowny.querySelector(".edytuj-opis"); if (edytuj) edytuj.onclick = () => edytujFrakcje(f);
  glowny.querySelector(".zrob-grafike").onclick = () => pokazGrafike(f);
  glowny.querySelectorAll(".pokaz-stolice").forEach(b => b.onclick = () => {
    const s = stolicaWl(f.id); pokazProwincje(PROWINCJE.indexOf(s.p) + 1); mapa.pokaz(s.o.x, s.o.y, 1.2);
  });
  glowny.querySelectorAll(".bohater").forEach(b => b.onclick = () => pokazBohatera(stan.bohaterowie.find(h => h.id === b.dataset.id), f));
  if (!zostanPrzewiniecie) glowny.scrollTop = 0;
  otworzSzuflade();
}
// karta frakcji jako obrazek (12): tylko dane jawne dla wszystkich — obrazek idzie na Discorda. Bez statusów i składu armii,
// bez tajnych traktatów; zasoby tylko gdy oglądający je widzi, a gdy są tajne — dopiero po zaznaczeniu (domyślnie wyłączone)
const oknoGrafiki = document.getElementById("grafika");
async function pokazGrafike(f, zZasobami) {
  const moze = !tajne(f, "zasoby"), jawne = jawneR(f, "zasoby");
  zZasobami ??= moze && jawne;
  const lista = stan.bohaterowie.filter(h => h.frakcja === f.id), w = lista.find(h => h.wladca);
  const osady = PROWINCJE.filter(p => stan.prowincje?.[p.id]?.wlasciciel === f.id).flatMap(osadyProwincji);
  const ile = poz => Object.values(poz || {}).filter(x => x.f === f.id).length;
  const sojusze = new Set(aktywneTraktaty().filter(([, t]) => t.typ === "sojusz" && !t.tajny && t.strony.includes(f.id)).flatMap(([, t]) => t.strony.filter(s => s !== f.id)));
  const dane = {
    nazwa: f.nazwa, podtytul: [f.przydomek, f.rasa].filter(Boolean).join(" · "), motto: f.motto, kolor: f.kolor, herb: herbFrakcji(f),
    wladca: w && { imie: w.imie, tytul: w.tytul || "", portret: plikPortretu(w) },
    bohaterowie: lista.filter(h => h !== w).map(h => ({ imie: h.imie, portret: plikPortretu(h) })),
    liczby: [["prowincje", PROWINCJE.filter(p => stan.prowincje?.[p.id]?.wlasciciel === f.id).length], ["miasta", osady.filter(o => o.typ !== "wioska").length],
      ["wioski", osady.filter(o => o.typ === "wioska").length], ["armie", ile(stan.pozycjeArmii)], ["floty", ile(stan.pozycjeFlot)]],
    wojny: wrogowie(f.id).map(x => wlascicielPo(x)?.nazwa || x), sojusze: [...sojusze].map(x => wlascicielPo(x)?.nazwa || x),
    zasoby: zZasobami && moze ? [...stan.zasoby.map(z => ({ nazwa: z.nazwa, ikona: ikony[`../assets/ikony/${z.ikona}.png`], wartosc: f.stany?.[z.id], jednostka: z.jednostka || "" })),
      ...f.zasoby.map(z => ({ nazwa: z.nazwa, wartosc: z.ilosc, jednostka: z.jednostka || "" }))].filter(z => z.wartosc !== undefined && z.wartosc !== "") : null,
    tura: stan.tury.length + 1,
  };
  oknoGrafiki.style.setProperty("--kolor", f.kolor);
  oknoGrafiki.innerHTML = `<div class="okno-glowa"><div><h2>Grafika krainy</h2><p class="rasa">${esc(f.nazwa)} — obrazek do wklejenia na Discorda</p></div>
    <button type="button" class="zamknij" aria-label="Zamknij">×</button></div><p class="puste">Rysuję…</p>`;
  oknoGrafiki.querySelector(".zamknij").onclick = () => oknoGrafiki.close();
  if (!oknoGrafiki.open) otworzOkno(oknoGrafiki);
  const c = await rysujKarte(dane);
  c.setAttribute("role", "img"); c.setAttribute("aria-label", `Grafika krainy ${f.nazwa}`);
  oknoGrafiki.querySelector(".puste").replaceWith(c);
  c.insertAdjacentHTML("afterend", `<div class="akcje-grafiki"><button type="button" class="cofnij kopiuj-grafike">📋 Kopiuj</button>
    <button type="button" class="cofnij zapisz-grafike">💾 Zapisz PNG</button>
    ${moze ? `<label><input type="checkbox" name="zasoby"${zZasobami ? " checked" : ""}> Pokaż zasoby${jawne ? "" : " (🔒 tajne — zobaczy każdy, komu wyślesz)"}</label>` : ""}</div>`);
  const blob = () => new Promise(ok => c.toBlob(ok, "image/png"));
  const plik = `${f.nazwa.replace(/[^\p{L}\p{N}]+/gu, "_")}_tura${dane.tura}.png`;
  oknoGrafiki.querySelector(".kopiuj-grafike").onclick = async e => {
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob() })]); zatwierdz(); e.target.textContent = "✔ Skopiowano — wklej Ctrl+V"; }
    catch { e.target.textContent = "Nie udało się skopiować — użyj „Zapisz PNG”"; }
  };
  oknoGrafiki.querySelector(".zapisz-grafike").onclick = async () => {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(await blob()), download: plik }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const zaz = oknoGrafiki.querySelector("[name=zasoby]"); if (zaz) zaz.onchange = () => pokazGrafike(f, zaz.checked);
}
oknoGrafiki.onclick = e => { if (e.target === oknoGrafiki) oknoGrafiki.close(); };
// Panel GM: globalne typy zasobów; w DEMO edytuje każdy, w etapie 4 tylko GM/admin
const ikonaZasobu = z => ikony[`../assets/ikony/${z.ikona}.png`]
  ? `<img class="ikona" src="${ikony[`../assets/ikony/${z.ikona}.png`]}" alt="">` : `<span class="ikona litera" aria-hidden="true">${esc(z.nazwa[0] || "?")}</span>`;
// historia (9.1): zrzut gry na koniec tury do timelapsu GM — mapa (właściciele, armie, floty, bitwy) i statystyki krain graczy.
// Statystyki liczone teraz, bo stan potem się zmienia; zasoby: stany z tej tury. Bez zagnieżdżonych tablic (Firestore ich nie przyjmuje).
function statystykiKrainy(f) {
  const prow = PROWINCJE.filter(p => stan.prowincje?.[p.id]?.wlasciciel === f.id), osady = prow.flatMap(osadyProwincji);
  const bitwy = Object.values(stan.bitwy || {}).filter(b => Object.values(b.wl || {}).includes(f.id));
  const wynik = b => b.koniec && b.koniec.zwyciezca >= 0 ? (b.koniec.strony?.[b.koniec.zwyciezca] === f.nazwa ? "w" : "p") : "";
  const traktaty = aktywneTraktaty().filter(([, t]) => t.strony.includes(f.id));
  return {
    prowincje: prow.length, miasta: osady.filter(o => o.typ !== "wioska").length, wioski: osady.filter(o => o.typ === "wioska").length,
    budynki: Object.values(f.budynki || {}).reduce((n, b) => n + (b.sloty || []).filter(Boolean).length, 0),
    armie: (f.armie || []).length, floty: (f.floty || []).length,
    zolnierze: (f.armie || []).reduce((n, a) => n + liczebnosc(a), 0), okrety: (f.floty || []).reduce((n, fl) => n + liczebnosc(fl), 0),
    wojny: (stan.wojny || []).filter(w => w.includes(f.id)).length,
    bitwy: bitwy.length, wygrane: bitwy.filter(b => wynik(b) === "w").length, przegrane: bitwy.filter(b => wynik(b) === "p").length,
    traktaty: traktaty.length, sojusznicy: new Set(traktaty.filter(([, t]) => t.typ === "sojusz").flatMap(([, t]) => t.strony.filter(w => w !== f.id))).size,
    bloki: Object.values(stan.bloki || {}).filter(b => aktywnyBlok(b) && b.czlonkowie.includes(f.id)).length,
  };
}
function zrzutHistorii(nr) {
  const wlasciciele = Object.fromEntries(Object.entries(stan.prowincje || {}).filter(([, d]) => d.wlasciciel).map(([id, d]) => [id, d.wlasciciel]));
  const armie = Object.entries(stan.pozycjeArmii || {}).map(([id, poz]) => ({ f: poz.f, p: poz.p || "", o: poz.o ?? -1, a: poz.a || 0,
    n: liczebnosc(frakcjaPo(poz.f)?.armie?.find(x => x.id === id) || {}) }));
  const floty = Object.entries(stan.pozycjeFlot || {}).map(([id, poz]) => ({ f: poz.f, a: poz.a, n: liczebnosc(frakcjaPo(poz.f)?.floty?.find(x => x.id === id) || {}) }));
  const bitwy = aktywneBitwy().map(([, b]) => ({ p: b.p || "", a: b.a || 0 }));
  return { nr, data: new Date().toISOString(), wlasciciele, armie, floty, bitwy, wojny: (stan.wojny || []).map(([x, y]) => ({ x, y })),
    kraje: Object.fromEntries(stan.frakcje.map(f => [f.id, { ...statystykiKrainy(f), zasoby: { ...f.stany } }])) };
}
// wykresy zasobów w czasie (9.2): gracz — tylko swojej krainy, GM — każdej; po jednym małym wykresie na zasób (różne skale, jedna oś),
// stan na koniec każdej zamkniętej tury (migawki tur); pod spodem tabela dla tych, którzy wolą liczby
const naLiczbe = v => v === "" || v === null || v === undefined ? null : (n => Number.isFinite(n) ? n : null)(Number(String(v).replace(/\s/g, "").replace(",", ".")));
function wykresyZasobow(f) {
  if (!(gm || moja(f)) || tajne(f, "zasoby")) return "";
  const migawki = stan.tury.filter(t => t.frakcje?.[f.id]), tury = migawki.map(t => t.nr);
  if (!migawki.length) return `<section class="wykresy-zasobow"><h3>Zasoby w czasie</h3><p class="puste">Wykresy pojawią się po zamknięciu pierwszej tury.</p></section>`;
  const zasobyZDanymi = stan.zasoby.filter(z => migawki.some(t => naLiczbe(t.frakcje[f.id].stany?.[z.id]) !== null));
  if (!zasobyZDanymi.length) return "";
  const punkty = z => migawki.map(t => ({ x: t.nr, y: naLiczbe(t.frakcje[f.id].stany?.[z.id]) }));
  return `<section class="wykresy-zasobow"><h3>Zasoby w czasie</h3><p class="opis-sekcji">Stan na koniec każdej zamkniętej tury. Najedź na wykres, żeby zobaczyć liczby.</p>
    <div class="siatka-wykresow">${zasobyZDanymi.map(z => `<div class="maly-wykres"><h4>${ikonaZasobu(z)} ${esc(z.nazwa)}</h4>
      ${wykres({ serie: [{ nazwa: z.nazwa, kolor: f.kolor, punkty: punkty(z) }], tury, szer: 300, wys: 130, jednostka: z.jednostka || "", etykietyKoncow: false, opis: `${z.nazwa} w kolejnych turach` })}</div>`).join("")}</div>
    <details class="tabela-wykresow"><summary>Tabela</summary><table><thead><tr><th>Zasób</th>${tury.map(nr => `<th>T${nr}</th>`).join("")}</tr></thead>
      <tbody>${zasobyZDanymi.map(z => `<tr><td>${esc(z.nazwa)}</td>${punkty(z).map(p => `<td>${p.y === null ? "—" : liczbaWykresu(p.y)}</td>`).join("")}</tr>`).join("")}</tbody></table></details></section>`;
}
// pokaz historii (samouczek, tylko w piaskownicy): kilka tur na niby — krainy rosną od swoich ziem (albo od rozrzuconych prowincji),
// zasoby zależą od liczby prowincji; migawki tur i zrzuty historii z prawdziwych funkcji. Po rozdziale stan wraca, a historiaPokazu jest czyszczona.
let historiaPokazu = null;
function zmyslHistorie(tur = 6) {
  const nrP = new Map(PROWINCJE.map((p, i) => [p.id, i])), wl = i => stan.prowincje?.[PROWINCJE[i].id]?.wlasciciel;
  stan.prowincje ??= {}; const zajete = [];
  for (const f of stan.frakcje) {   // kraina bez ziemi dostaje na niby prowincję jak najdalej od pozostałych
    if (PROWINCJE.some((p, i) => wl(i) === f.id)) continue;
    const zaj = PROWINCJE.map((p, i) => i).filter(i => wl(i)), kand = PROWINCJE.map((p, i) => i).filter(i => !wl(i) && PROWINCJE[i].sasiedzi.length >= 4);
    const odl = i => zaj.length ? Math.min(...zaj.map(j => Math.hypot(PROWINCJE[i].x - PROWINCJE[j].x, PROWINCJE[i].y - PROWINCJE[j].y))) : -Math.hypot(PROWINCJE[i].x - 2500, PROWINCJE[i].y - 2500);
    const k = kand.sort((a, b) => odl(b) - odl(a))[0]; if (k !== undefined) { stan.prowincje[PROWINCJE[k].id] = { ...stan.prowincje[PROWINCJE[k].id], wlasciciel: f.id }; zajete.push(k); }
  }
  const historia = [], start = stan.tury.length;
  for (let t = 0; t < tur; t++) {
    stan.frakcje.forEach((f, i) => {
      const moje = PROWINCJE.map((p, k) => k).filter(k => wl(k) === f.id);
      [...new Set(moje.flatMap(k => PROWINCJE[k].sasiedzi.map(([j]) => j - 1)))].filter(k => !wl(k)).slice(0, 2 + (i + t) % 3)
        .forEach(k => { stan.prowincje[PROWINCJE[k].id] = { ...stan.prowincje[PROWINCJE[k].id], wlasciciel: f.id }; });
      const ile = PROWINCJE.filter((p, k) => wl(k) === f.id).length;
      f.stany = Object.fromEntries(stan.zasoby.map((z, k) => [z.id, Math.max(0, Math.round(ile * (8 + k * 3) + 30 * Math.sin(t * 0.9 + i + k) + 20 * i))]));
    });
    const nr = start + t + 1;
    stan.tury.push({ nr, data: new Date().toISOString(), frakcje: Object.fromEntries(stan.frakcje.map(f => [f.id, { stany: { ...f.stany }, unikalne: {} }])) });
    historia.push(zrzutHistorii(nr));
  }
  historiaPokazu = historia; kolorujMape(); pokazOsadyNaMapie();
}
// timelapse (9.3): odtwarzacz w oknie — klatki rysuje src/timelapse.js na jednym płótnie (to samo trafia do filmu, 9.4)
const oknoTimelapse = document.getElementById("timelapse");
const MIARY_STATYSTYK = [["prowincje", "Prowincje", "Ziemia"], ["miasta", "Miasta", "Ziemia"], ["wioski", "Wioski", "Ziemia"], ["budynki", "Budynki", "Ziemia"],
  ["zolnierze", "Żołnierze", "Wojsko"], ["okrety", "Okręty", "Wojsko"], ["armie", "Armie", "Wojsko"], ["floty", "Floty", "Wojsko"],
  ["wojny", "Wojny", "Wojny i bitwy"], ["bitwy", "Bitwy stoczone", "Wojny i bitwy"], ["wygrane", "Bitwy wygrane", "Wojny i bitwy"], ["przegrane", "Bitwy przegrane", "Wojny i bitwy"],
  ["traktaty", "Traktaty", "Dyplomacja"], ["sojusznicy", "Sojusznicy", "Dyplomacja"], ["bloki", "Bloki", "Dyplomacja"]];
const miaryTimelapsu = () => [...stan.zasoby.map(z => ({ id: "z:" + z.id, nazwa: z.nazwa, grupa: "Zasoby", wartosc: k => naLiczbe(k.zasoby?.[z.id]) })),
  ...MIARY_STATYSTYK.map(([id, nazwa, grupa]) => ({ id, nazwa, grupa, wartosc: k => typeof k[id] === "number" ? k[id] : null }))];
const punktHistorii = ({ p, o, a }) => {   // miejsce z historii → [x, y] px mapy
  if (a) { const w = AKWENY[a - 1]; return w && [w.x, w.y]; }
  const pr = PROWINCJE[NR_PROWINCJI.get(p) - 1]; if (!pr) return null;
  const os = o >= 0 && osadyProwincji(pr)[o]; return os ? [os.x, os.y] : [pr.x, pr.y];
};
async function pokazTimelapse() {
  oknoTimelapse.innerHTML = `<div class="okno-glowa"><h2>Historia gry</h2><button type="button" class="zamknij" aria-label="Zamknij">×</button></div><p class="opis-sekcji">Wczytuję historię…</p>`;
  oknoTimelapse.querySelector(".zamknij").onclick = () => oknoTimelapse.close();
  otworzOkno(oknoTimelapse);
  const historia = historiaPokazu || await czytajHistorie();   // samouczek: zmyślona historia z piaskownicy
  if (!historia.length) { oknoTimelapse.querySelector("p").textContent = "Historia jest pusta — pierwsza klatka powstanie przy zamknięciu tury."; return; }
  const miary = miaryTimelapsu();
  const tl = await przygotujTimelapse({ terenUrl, indeksyUrl, liczbaProwincji: PROWINCJE.length, historia, ikonaBitwy: IKONY_OSAD.bitwa, miary,
    kraje: stan.frakcje.map(f => ({ id: f.id, nazwa: f.nazwa, kolor: f.kolor, herb: herbFrakcji(f) })), kolorWl: id => wlascicielPo(id)?.kolor || null,
    punkt: punktHistorii, prowincjaNr: id => NR_PROWINCJI.get(id) });
  const grupy = [...new Set(miary.map(m => m.grupa))];
  oknoTimelapse.innerHTML = `<div class="okno-glowa"><h2>Historia gry</h2><button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    <canvas class="plotno-timelapse" width="${SZER_TL}" height="${WYS_TL}" aria-label="Timelapse: mapa, wykres i ranking tury"></canvas>
    <div class="sterowanie-timelapse">
      <button type="button" class="cofnij" data-tl="poczatek" aria-label="Pierwsza tura" title="Pierwsza tura">⏮</button>
      <button type="button" class="dodaj" data-tl="graj" aria-label="Odtwórz">▶</button>
      <button type="button" class="cofnij" data-tl="koniec" aria-label="Ostatnia tura" title="Ostatnia tura">⏭</button>
      <input type="range" name="tura" min="0" max="${historia.length - 1}" step="1" value="0" aria-label="Tura">
      <label>Miara <select name="miara">${grupy.map(g => `<optgroup label="${esc(g)}">${miary.filter(m => m.grupa === g).map(m => `<option value="${esc(m.id)}">${esc(m.nazwa)}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <label>Tempo <select name="tempo"><option value="0.5">wolno</option><option value="1" selected>zwykle</option><option value="2">szybko</option></select></label>
    </div>
    <p class="przyciski-eksportu">${formatFilmu() ? `<button type="button" class="cofnij" data-tl="film">🎬 Zapisz film (${formatFilmu().includes("mp4") ? "MP4" : "WebM"})</button>` : ""}
      <button type="button" class="cofnij" data-tl="gif">🖼 Zapisz GIF</button> <span class="opis-sekcji komunikat-timelapse" role="status"></span></p>`;
  const g = oknoTimelapse.querySelector("canvas").getContext("2d"), suwak = oknoTimelapse.querySelector("[name=tura]"), wyborMiary = oknoTimelapse.querySelector("[name=miara]");
  const tempo = oknoTimelapse.querySelector("[name=tempo]"), graj = oknoTimelapse.querySelector("[data-tl=graj]");
  let t = 0, gra = null;
  const miara = () => miary.find(m => m.id === wyborMiary.value);
  const rysuj = () => { tl.rysuj(g, t, miara()); suwak.value = Math.floor(t); };
  const stop = () => { if (gra) cancelAnimationFrame(gra); gra = null; graj.textContent = "▶"; graj.setAttribute("aria-label", "Odtwórz"); };
  const start = () => {
    if (t >= historia.length - 1) t = 0;
    graj.textContent = "⏸"; graj.setAttribute("aria-label", "Pauza"); let ost = performance.now();
    const krok = teraz => { t = Math.min(historia.length - 1, t + Math.max(0, teraz - ost) / (1200 / +tempo.value)); ost = teraz; rysuj(); gra = t < historia.length - 1 ? requestAnimationFrame(krok) : (stop(), null); };
    gra = requestAnimationFrame(krok);
  };
  graj.onclick = () => gra ? stop() : start();
  oknoTimelapse.querySelector("[data-tl=poczatek]").onclick = () => { stop(); t = 0; rysuj(); };
  oknoTimelapse.querySelector("[data-tl=koniec]").onclick = () => { stop(); t = historia.length - 1; rysuj(); };
  suwak.oninput = () => { stop(); t = +suwak.value; rysuj(); };
  wyborMiary.onchange = rysuj;
  // eksport (9.4): film nagrywa to płótno w trakcie odtwarzania, GIF liczy klatki osobno; plik pobiera się od razu
  const komunikat = oknoTimelapse.querySelector(".komunikat-timelapse"), plotno = oknoTimelapse.querySelector("canvas");
  const sterowanie = oknoTimelapse.querySelectorAll(".sterowanie-timelapse button, .sterowanie-timelapse input, .sterowanie-timelapse select, .przyciski-eksportu button");
  const nazwa = rozsz => `historia-gry-tury-${historia[0].nr}-${historia[historia.length - 1].nr}-${miara().nazwa.toLowerCase().replace(/[^a-ząćęłńóśźż0-9]+/g, "-")}.${rozsz}`;
  const pobierz = (blob, plik) => { const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: plik }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  async function eksport(rodzaj) {
    stop(); sterowanie.forEach(x => { x.disabled = true; });
    const naTure = 1.2 / +tempo.value, postep = p => { komunikat.textContent = `${rodzaj === "gif" ? "Liczę GIF" : "Nagrywam film"}… ${Math.round(p * 100)}%`; };
    try {
      const blob = rodzaj === "gif" ? await nagrajGif((gg, tt) => tl.rysuj(gg, tt, miara()), historia.length, { naTure, postep })
        : await nagrajFilm(plotno, tt => { t = tt; rysuj(); }, historia.length, { naTure, postep });
      const rozsz = rodzaj === "gif" ? "gif" : blob.type.includes("mp4") ? "mp4" : "webm";
      pobierz(blob, nazwa(rozsz)); komunikat.textContent = `Gotowe: ${nazwa(rozsz)} (${(blob.size / 1048576).toFixed(1)} MB).`;
    } catch (e) { komunikat.textContent = "Nie udało się zapisać: " + (e.message || e); }
    sterowanie.forEach(x => { x.disabled = false; });
  }
  oknoTimelapse.querySelector("[data-tl=film]")?.addEventListener("click", () => eksport("film"));
  oknoTimelapse.querySelector("[data-tl=gif]").onclick = () => eksport("gif");
  oknoTimelapse.querySelector(".zamknij").onclick = () => { stop(); oknoTimelapse.close(); };
  oknoTimelapse.addEventListener("close", stop, { once: true });
  rysuj();
}
function pokazPanelGM(zostanPrzewiniecie) {
  widok = "gm"; mapa.wybierz(0);
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
  glowny.style.removeProperty("--kolor");
  const z = stan.zasoby, ost = z.length - 1;
  glowny.innerHTML = `<article class="karta panel-gm"><h2>Panel GM</h2>
    ${propozycjeSekcja()}
    <section><h3>Typy zasobów</h3><p class="opis-sekcji">Wspólne dla wszystkich frakcji. Unikalne zasoby frakcji edytujesz na jej karcie.</p>
    <ol class="typy-zasobow">${z.map((t, i) => `<li data-i="${i}">${ikonaZasobu(t)}
      <input name="nazwa" value="${esc(t.nazwa)}" required maxlength="40" aria-label="Nazwa zasobu">
      <input name="jednostka" value="${esc(t.jednostka)}" maxlength="12" placeholder="jednostka" aria-label="Jednostka zasobu ${esc(t.nazwa)}">
      <button type="button" class="usun" data-akcja="gora" aria-label="Przesuń ${esc(t.nazwa)} wyżej" title="Wyżej"${i ? "" : " disabled"}>↑</button>
      <button type="button" class="usun" data-akcja="dol" aria-label="Przesuń ${esc(t.nazwa)} niżej" title="Niżej"${i < ost ? "" : " disabled"}>↓</button>
      <button type="button" class="usun" data-akcja="usun" aria-label="Usuń zasób ${esc(t.nazwa)}" title="Usuń">×</button></li>`).join("")
      || `<li class="puste">Brak — dodaj pierwszy zasób.</li>`}</ol>
    <form class="dodaj-zasob"><input name="nazwa" required maxlength="40" placeholder="Nazwa zasobu" aria-label="Nazwa nowego zasobu">
      <input name="jednostka" maxlength="12" placeholder="Jednostka (opcjonalnie)" aria-label="Jednostka nowego zasobu"><button class="dodaj">Dodaj</button></form></section>
    <section><h3>Tury</h3><p>Trwa <b>tura ${stan.tury.length + 1}</b>. Zamknięcie zapisuje stany zasobów wszystkich frakcji — na kartach pokaże się zmiana +/- od tego momentu. Obecnych liczb nie zmienia. Armie z celem robią po 1 kroku trasy, wrogie armie, które się spotkają, stają do bitwy, a armie poniżej 100 żołnierzy zostają rozwiązane.</p>
      <p class="przyciski-tur"><button type="button" class="dodaj" id="zamknij-ture">Zamknij turę ${stan.tury.length + 1}</button>
      ${ostatniaTura() ? `<button type="button" class="cofnij" id="cofnij-ture">Cofnij zamknięcie tury ${ostatniaTura().nr}</button>` : ""}</p>
      ${stan.tury.length ? `<ul class="lista-tur">${stan.tury.map(t => `<li>Tura ${t.nr} — zamknięta ${esc(new Date(t.data).toLocaleString("pl-PL"))}</li>`).reverse().join("")}</ul>` : ""}</section>
    <section class="historia-gry"><h3>Historia gry</h3><p class="opis-sekcji">Timelapse tura po turze: mapa z granicami krajów, armiami i bitwami, wykres wybranej miary i ranking krajów. Zapis do filmu albo GIF-a — do wrzucenia na Discorda. Każde zamknięcie tury dopisuje kolejną klatkę.</p>
      <p><button type="button" class="dodaj" id="otworz-timelapse">▶ Timelapse</button></p></section>
    ${kronikarzSekcja()}
    ${wojnySekcja()}
    ${traktatySekcja()}
    ${npcSekcja()}
    ${uzytkownicySekcja()}
    ${logiSekcja()}
    ${diagnostykaSekcja()}
    ${porzadkiSekcja()}
    ${kopiaSekcja()}</article>`;
  glowny.querySelector("#otworz-timelapse").onclick = pokazTimelapse;
  podepnijKronikarza();
  const odswiez = () => { zapisz(stan); pokazPanelGM(true); };
  glowny.querySelector("#zamknij-ture").onclick = () => {
    const nr = stan.tury.length + 1;
    const slabe = stan.frakcje.flatMap(f => (f.armie || []).filter(a => liczebnosc(a) < 100).map(a => `${a.nazwa} (${f.nazwa})`));
    if (!confirm(`Zamknąć turę ${nr}? Stany zasobów wszystkich frakcji zostaną zapisane, a armie i floty z celem zrobią po 1 kroku.${slabe.length ? `\n\nZostaną rozwiązane (poniżej 100 żołnierzy): ${slabe.join(", ")}.` : ""}\n\nMożna to cofnąć.`)) return;
    stan.tury.push({ nr, data: new Date().toISOString(), frakcje: Object.fromEntries(stan.frakcje.map(f => [f.id, {
      stany: { ...f.stany }, unikalne: Object.fromEntries(f.zasoby.filter(z => z.ilosc !== undefined).map(z => [z.nazwa, z.ilosc])) }])) });
    ruchArmii(nr); rozwiazSlabe(nr); odswiezRaporty(); const zrzut = zrzutHistorii(nr); zapiszHistorie(nr, zrzut); odswiez(); pokazOsadyNaMapie();
    szkicOpowiesci(nr, zrzut).then(o => zapiszOpowiesc(nr, o));   // Kronikarz Zgrzyt (13): szkic do poprawek GM
  };
  const cofnij = glowny.querySelector("#cofnij-ture");
  if (cofnij) cofnij.onclick = () => {
    // usuwa tylko migawkę; obecne stany zostają, więc pomyłkowe zamknięcie nic nie psuje
    const nr = ostatniaTura().nr, ruchy = stan.cofnijRuchy?.nr === nr;
    if (!confirm(`Cofnąć zamknięcie tury ${nr}? Wróci tura ${nr}, a zmiany +/- będą liczone od poprzedniej migawki.${ruchy ? " Armie i floty wrócą na pozycje sprzed ruchu." : ""}`)) return;
    cofnijRozwiazanie(nr); cofnijRuchArmii(nr); stan.tury.pop(); odswiezRaporty(); usunHistorie(nr); usunOpowiesc(nr);
    for (const [id, k] of Object.entries(stan.kronika || {})) if (k.zam === nr) usunWpis("kronika", id);   // wpisy z cofniętego zamknięcia
    odswiez(); pokazOsadyNaMapie();
  };
  glowny.querySelectorAll(".typy-zasobow li[data-i]").forEach(li => {
    const t = z[li.dataset.i];
    li.querySelectorAll("input").forEach(p => p.onchange = () => {
      const w = p.value.trim();
      if (p.name === "nazwa" && !w) { p.value = t.nazwa; return; } // pustej nazwy nie zapisujemy
      t[p.name] = w; zapisz(stan); // bez przerysowania, żeby Tab nie gubił kursora
    });
    li.querySelectorAll("button").forEach(b => b.onclick = () => {
      const i = +li.dataset.i, a = b.dataset.akcja;
      if (a === "usun") {
        if (!confirm(`Usunąć zasób „${t.nazwa}” u wszystkich frakcji?`)) return;
        z.splice(i, 1); stan.frakcje.forEach(f => delete f.stany?.[t.id]); // bez osieroconych stanów pod tym id
      }
      else { const j = a === "gora" ? i - 1 : i + 1; [z[i], z[j]] = [z[j], z[i]]; }
      odswiez();
    });
  });
  glowny.querySelector(".dodaj-zasob").onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.target), nazwa = d.get("nazwa").trim();
    if (!nazwa) return;
    // id z nazwy, unikalne; zostaje na stałe nawet po zmianie nazwy
    const baza = nazwa.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "zasob";
    let id = baza, n = 2; while (z.some(t => t.id === id)) id = `${baza}-${n++}`;
    z.push({ id, nazwa, jednostka: d.get("jednostka").trim(), ikona: "" }); odswiez();
    glowny.querySelector(".dodaj-zasob input").focus();
  };
  podepnijWojny(odswiez); podepnijTraktaty(odswiez); podepnijNpc(); podepnijUzytkownikow(); podepnijPropozycje(); podepnijLogi(); podepnijDiagnostyke(); podepnijPorzadki(); podepnijKopie();
  if (!zostanPrzewiniecie) glowny.scrollTop = 0;
  otworzSzuflade();
}
// kraje NPC (wasale, marionetki): nazwa, rodzaj, zwierzchnik, opis; kolor = odcień zwierzchnika; samodzielny (7.10): własny kolor zamiast zwierzchnika
const opcjeZwierzchnika = w => stan.frakcje.map(f => `<option value="${esc(f.id)}"${f.id === w ? " selected" : ""}>${esc(f.nazwa)}</option>`).join("");
const opcjeRodzaju = w => Object.entries(RODZAJE_NPC).map(([k, n]) => `<option value="${k}"${k === w ? " selected" : ""}>${n}</option>`).join("");
const ileProwincji = wl => Object.values(stan.prowincje || {}).filter(d => d.wlasciciel === wl).length;
// kronika (7.2): stan.kronika = { id: { tura, czas, typ, tekst, kraje: [wł], tajny, widza: [wł], zam? (nr tury, której zamknięcie dodało wpis) } }
// wpisy robi program przy akcjach GM (bitwy, wojny, pokój, traktaty, właściciele prowincji) albo GM ręcznie; tajne widzą kraje z „widza” i GM
const IKONY_KRONIKI = { blok: "🏛", bitwa: "⚔", wynik: "🏆", wojna: "🔥", pokoj: "🕊", traktat: "📜", zerwanie: "✂", wlasciciel: "🏴", gm: "✒" };
// d (13.2): dane dla Kronikarza Zgrzyta — kto, gdzie, co (A/B = wł., lista = [wł.], miejsce = „w prowincji „X”” / „na morzu „X””, nazwa, rodzaj…)
function wpiszKronike(typ, tekst, kraje, { tajny = false, widza = kraje, tura = stan.tury.length + 1, zam, d } = {}) {
  const id = "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  (stan.kronika ??= {})[id] = { tura, czas: new Date().toISOString(), typ, tekst, kraje: kraje.filter(Boolean), tajny, widza: tajny ? widza.filter(Boolean) : [], ...(zam ? { zam } : {}), ...(d ? { d } : {}) };
  return id;
}
const nazwaKraju = w => wlascicielPo(w)?.nazwa || "ziemia niczyja";
const wProwincji = p => stan.prowincje?.[p.id]?.nazwa ? `w prowincji „${stan.prowincje[p.id].nazwa}”` : `w prowincji ${p.id}`;
const daneTraktatu = t => ({ rodzaj: t.typ, nazwa: t.nazwa, lista: t.strony });
const wpisyKroniki = () => Object.entries(stan.kronika || {}).sort((a, b) => b[1].tura - a[1].tura || (b[1].czas < a[1].czas ? -1 : 1));
// Kronikarz Zgrzyt (13): opowieść tury nr z wpisów kroniki (+ pamięć wcześniejszych tur, liczba prowincji z historii — tylko to, reszta historii jest tajna)
// wpis sprzed 13.2 bez `d`: wojna/pokój z listy krajów, blok i wpis GM z tekstu, reszta jako „stary” (Zgrzyt czyta tekst wpisu)
function zdarzenieKroniki(k) {
  const d = k.d || (["wojna", "pokoj"].includes(k.typ) && k.kraje.length === 2 ? { A: k.kraje[0], B: k.kraje[1] } : { tekst: k.tekst });
  return { typ: k.d || ["wojna", "pokoj", "blok", "gm"].includes(k.typ) ? k.typ : "stary", d, kraje: k.kraje, tajny: k.tajny, widza: k.widza, tura: k.tura };
}
// staty: { teraz, przed } — {wł: {prowincje}} z historii (tylko liczba prowincji; reszta historii jest tajna)
function opowiescTury(nr, ziarno = nr, staty = {}) {
  const wpisy = Object.values(stan.kronika || {}).sort((a, b) => a.tura - b.tura || (a.czas < b.czas ? -1 : 1)).map(zdarzenieKroniki);
  const wl = new Set(wpisy.flatMap(z => [...z.kraje, ...(z.widza || []), z.d.A, z.d.B, ...(z.d.lista || []), ...(z.d.przegrani || [])]).values());
  const kraje = Object.fromEntries([...wl].filter(Boolean).map(w => { const f = frakcjaPo(w); return [w, f ? { nazwa: f.nazwa, wladca: f.wladca, id: f.id } : { nazwa: nazwaKraju(w) }]; }));
  return opowiedz({ tura: nr, ziarno, kraje, zdarzenia: wpisy.filter(z => z.tura === nr), pamiec: wpisy.filter(z => z.tura < nr), staty });
}
if (import.meta.env.DEV) window.opowiescTury = opowiescTury;   // testy i podglądy (materialy/test_kronika.mjs); w wydanym programie go nie ma
const prowincjeZHistorii = h => h && Object.fromEntries(Object.entries(h.kraje || {}).map(([w, s]) => [w, { prowincje: s.prowincje }]));
// film opowieści (13.5b): miejsce zdarzenia akapitu → [x, y] px mapy (kamera tam jedzie); wojna, pokój, traktat — stolica pierwszej strony
function miejsceZdarzenia(z) {
  const d = z?.d; if (!d) return null;
  if (d.a) return punktHistorii({ a: d.a });
  const p = d.p || (d.prowincja && PROWINCJE.find(q => nazwaProwincji(q) === d.prowincja)?.id);
  if (p) return punktHistorii({ p, o: -1 });
  const kraj = d.A || d.lista?.[0], s = kraj && stolicaWl(kraj);
  if (s) return [s.o.x, s.o.y];
  const pr = kraj && PROWINCJE.find(q => stan.prowincje?.[q.id]?.wlasciciel === kraj);
  return pr ? [pr.x, pr.y] : null;
}
// szkic opowieści przy zamknięciu tury (13.4): GM go poprawia i publikuje w Panelu GM; szkic widzi tylko GM
async function szkicOpowiesci(nr, zrzut, ziarno = nr) {
  const staty = { teraz: prowincjeZHistorii(zrzut), przed: prowincjeZHistorii(await czytajHistorieTury(nr - 1)) };
  const o = opowiescTury(nr, ziarno, staty);
  return { tura: nr, akapity: o.akapity, miejsca: o.zrodla.map(z => (m => m ? { x: Math.round(m[0]), y: Math.round(m[1]) } : null)(miejsceZdarzenia(z))),
    szepty: o.szepty, staty, ziarno, czas: new Date().toISOString(), opublikowana: false };   // miejsca jako {x, y} — Firestore nie przyjmuje tablicy w tablicy
}
// zapis nowej wersji: szkic zostaje szkicem, a opublikowana publikuje się od razu ponownie (inaczej gracze straciliby do niej dostęp)
const zapiszWersje = (nr, o) => (stan.opowiesci || []).includes(nr) ? opublikujOpowiesc(nr, o) : zapiszOpowiesc(nr, { ...o, opublikowana: false });
// otwarcie opowieści: gracz — jawna część + swój szept; GM — także szepty wszystkich krajów (podpisane)
const oknoOpowiesci = document.getElementById("opowiesc");
async function otworzOpowiesc(nr) {
  const o = await czytajOpowiesc(nr);
  if (!o) return alert("Tej opowieści nie da się wczytać — może GM cofnął turę.");
  const szepty = gm ? (o.opublikowana ? await czytajSzeptyTury(nr) : o.szepty || {}) : {};
  const moj = !gm && profil?.frakcja ? (await czytajSzept(nr, profil.frakcja))?.akapity : null;
  pokazOpowiesc(oknoOpowiesci, { tura: nr, akapity: o.akapity, szept: moj,
    szeptyGM: Object.entries(szepty).map(([w, a]) => [nazwaKraju(w), a]), nagraj: postep => filmOpowiesci(nr, o, postep) }, otworzOkno);
}
// film opowieści (13.5b): mapa z obecnymi (jawnymi) właścicielami prowincji, kamera w miejscach z opowieści
async function filmOpowiesci(nr, o, postep) {
  const wlasciciele = Object.fromEntries(Object.entries(stan.prowincje || {}).filter(([, d]) => d.wlasciciel).map(([id, d]) => [id, d.wlasciciel]));
  const tl = await przygotujTimelapse({ terenUrl, indeksyUrl, liczbaProwincji: PROWINCJE.length, historia: [{ nr, wlasciciele }], ikonaBitwy: IKONY_OSAD.bitwa, miary: [],
    kraje: [], kolorWl: id => wlascicielPo(id)?.kolor || null, punkt: punktHistorii, prowincjaNr: id => NR_PROWINCJI.get(id) });
  const miejsca = o.miejsca?.length === o.akapity.length ? o.miejsca.map(m => m && [m.x, m.y]) : o.akapity.map(() => null);
  return nagrajOpowiesc({ tura: nr, akapity: o.akapity, miejsca, mapa: tl.mapa({ nr, wlasciciele }) }, postep);
}
// nowa opublikowana opowieść otwiera się graczowi sama, raz (zapamiętane w tej przeglądarce); nie w trakcie samouczka ani innego okna
function pokazNowaOpowiesc() {
  const nr = Math.max(0, ...(stan.opowiesci || []));
  if (gm || !nr || document.body.classList.contains("w-samouczku") || document.querySelector("dialog[open]")) return;
  let ost = 0; try { ost = +localStorage.getItem("frp-opowiesc") || 0; } catch {}
  if (nr <= ost) return;
  try { localStorage.setItem("frp-opowiesc", String(nr)); } catch {}
  otworzOpowiesc(nr);
}
// Panel GM (13.6): szkic ostatniej zamkniętej tury — podgląd, poprawki, losowanie od nowa, publikacja; wcześniejsze tury z listy
const kronikarzSekcja = () => !stan.tury.length ? "" : `<section class="kronikarz"><h3>Kronika Zgrzyta</h3>
  <p class="opis-sekcji">Po zamknięciu tury Zgrzyt pisze szkic opowieści. Widzisz go tylko ty — popraw, jeśli trzeba, i opublikuj. Gracze dostają opowieść sami przy wejściu, szepty tylko kraje, których dotyczą.</p>
  <p class="akcje-kronikarza"><label>Tura <select name="tura-opowiesci">${stan.tury.map(t => `<option value="${t.nr}">${t.nr}${(stan.opowiesci || []).includes(t.nr) ? " — opublikowana" : ""}</option>`).reverse().join("")}</select></label>
    <button type="button" class="cofnij" data-kr="podglad">👁 Podgląd</button><button type="button" class="cofnij" data-kr="popraw">✎ Popraw</button>
    <button type="button" class="cofnij" data-kr="losuj">🎲 Losuj inaczej</button><button type="button" class="dodaj" data-kr="publikuj">📢 Opublikuj</button></p>
  <div class="edycja-opowiesci"></div><p class="opis-sekcji komunikat-kronikarza"></p></section>`;
function podepnijKronikarza() {
  const s = glowny.querySelector(".kronikarz"); if (!s) return;
  const nr = () => +s.querySelector("[name=tura-opowiesci]").value, msg = t => { s.querySelector(".komunikat-kronikarza").textContent = t; };
  // szkic: z bazy, a gdy go nie ma (tura sprzed 13.4 albo cofnięta) — świeży z kroniki
  const szkic = async n => (await czytajOpowiesc(n)) || await (async () => { const o = await szkicOpowiesci(n, await czytajHistorieTury(n)); await zapiszOpowiesc(n, o); return o; })();
  const szeptyDo = async (n, o) => o.opublikowana ? await czytajSzeptyTury(n) : o.szepty || {};
  s.querySelectorAll("[data-kr]").forEach(b => b.onclick = async () => {
    const n = nr(), akcja = b.dataset.kr; msg("…");
    if (akcja === "podglad") { await szkic(n); msg(""); return otworzOpowiesc(n); }
    if (akcja === "losuj") {
      const opubl = (stan.opowiesci || []).includes(n);
      if (!confirm(`Napisać opowieść tury ${n} od nowa? Twoje poprawki w tej turze przepadną.${opubl ? " Jest już opublikowana — gracze od razu zobaczą nową wersję." : ""}`)) return msg("");
      await zapiszWersje(n, await szkicOpowiesci(n, await czytajHistorieTury(n), Math.floor(Math.random() * 1e6))); msg(`Nowa wersja tury ${n}${opubl ? " — opublikowana" : " — szkic"}.`); return;
    }
    const o = await szkic(n), szepty = await szeptyDo(n, o);
    if (akcja === "publikuj") {
      if (!confirm(`Opublikować opowieść tury ${n}? Zobaczą ją wszyscy gracze, a szepty — tylko kraje, których dotyczą.`)) return msg("");
      await opublikujOpowiesc(n, { ...o, szepty }); msg(`Opublikowano opowieść tury ${n}.`); return pokazPanelGM(true);
    }
    // popraw: akapity oddzielone pustą linią; szept każdego kraju osobno
    const ed = s.querySelector(".edycja-opowiesci");
    ed.innerHTML = `<form class="popraw-opowiesc"><label>Opowieść (akapity oddziel pustą linią)<textarea name="akapity" rows="14">${esc(o.akapity.join("\n\n"))}</textarea></label>
      ${Object.entries(szepty).map(([w, a]) => `<label>🤫 Szept dla: ${esc(nazwaKraju(w))}<textarea name="szept" data-kraj="${esc(w)}" rows="3">${esc(a.join(" "))}</textarea></label>`).join("")}
      <button class="dodaj">${(stan.opowiesci || []).includes(n) ? "Zapisz i opublikuj poprawki" : "Zapisz szkic"}</button> <button type="button" class="cofnij anuluj-opowiesc">Anuluj</button></form>`;
    msg("");
    ed.querySelector(".anuluj-opowiesc").onclick = () => { ed.innerHTML = ""; };
    ed.querySelector("form").onsubmit = async e => {
      e.preventDefault();
      const akapity = e.target.akapity.value.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
      const nowe = Object.fromEntries([...e.target.querySelectorAll("[name=szept]")].map(t => [t.dataset.kraj, [t.value.trim()]]).filter(([, [t]]) => t));
      await zapiszWersje(n, { ...o, akapity, szepty: nowe });
      ed.innerHTML = ""; msg(`Zapisano poprawki tury ${n}${(stan.opowiesci || []).includes(n) ? " — gracze już je widzą" : " (szkic)"}.`);
    };
  });
}
const wierszKroniki = ([id, k], przyciski) => `<li class="k-${k.typ}"><span>${IKONY_KRONIKI[k.typ] || "•"} ${k.tajny ? "🔒 " : ""}${esc(k.tekst)}</span>${przyciski ? `<button type="button" class="usun" data-usun-wpis="${esc(id)}" title="Usuń wpis" aria-label="Usuń wpis">×</button>` : ""}</li>`;
function pokazKronike() {
  widok = "kronika"; mapa.wybierz(0); glowny.style.removeProperty("--kolor");
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
  const tury = new Map(); for (const e of wpisyKroniki()) { if (!tury.has(e[1].tura)) tury.set(e[1].tura, []); tury.get(e[1].tura).push(e); }
  glowny.innerHTML = `<article class="karta kronika"><h2>Kronika</h2>
    ${gm ? `<form class="nowy-wpis"><label>Wpis GM do tury ${stan.tury.length + 1} <textarea name="tekst" rows="2" maxlength="2000" required placeholder="Co się wydarzyło (zaraza, ślub, odkrycie…)"></textarea></label>
      <label class="tajny"><input type="checkbox" name="tajny"> Tajny — widzą tylko zaznaczone kraje i GM</label>
      <fieldset class="strony-traktatu" hidden><legend>Kto widzi</legend>${opcjeKrajow().map(([id, n]) => `<label><input type="checkbox" name="widza" value="${esc(id)}"> ${esc(n)}</label>`).join("")}</fieldset>
      <button class="dodaj">Dodaj wpis</button> <span class="opis-sekcji komunikat-kroniki"></span></form>` : ""}
    ${(stan.opowiesci || []).length ? `<section class="opowiesci-zgrzyta"><h3>📖 Opowieści Zgrzyta</h3><p>${[...stan.opowiesci].reverse().map(nr => `<button type="button" class="cofnij" data-opowiesc="${nr}">Tura ${nr}</button>`).join(" ")}</p></section>` : ""}
    ${tury.size ? [...tury].map(([nr, l]) => `<section><h3>Tura ${nr}${nr === stan.tury.length + 1 ? " (trwa)" : ""} <button type="button" class="cofnij kopiuj-ture" data-tura="${nr}">📋 Kopiuj na Discorda</button></h3>
      <ul class="lista-kroniki">${l.map(e => wierszKroniki(e, gm)).join("")}</ul></section>`).join("") : `<p class="puste">Kronika jest pusta — wpisy pojawią się przy bitwach, wojnach, traktatach i zmianach granic.</p>`}
  </article>`;
  glowny.querySelectorAll(".kopiuj-ture").forEach(b => b.onclick = async () => {
    const nr = +b.dataset.tura, l = (tury.get(nr) || []).filter(([, k]) => !k.tajny).reverse();
    const tekst = `**📜 Kronika — tura ${nr}**\n` + l.map(([, k]) => `${IKONY_KRONIKI[k.typ] || "•"} ${k.tekst}`).join("\n");
    try { await navigator.clipboard.writeText(tekst); b.textContent = "✔ Skopiowano"; } catch { prompt("Skopiuj tekst:", tekst); }
  });
  glowny.querySelectorAll("[data-opowiesc]").forEach(b => b.onclick = () => otworzOpowiesc(+b.dataset.opowiesc));
  glowny.querySelectorAll("[data-usun-wpis]").forEach(b => b.onclick = () => { if (confirm("Usunąć wpis z kroniki?")) { usunWpis("kronika", b.dataset.usunWpis); pokazKronike(); } });
  const form = glowny.querySelector(".nowy-wpis");
  if (form) {
    form.tajny.onchange = () => { form.querySelector("fieldset").hidden = !form.tajny.checked; };
    form.onsubmit = e => {
      e.preventDefault(); const d = new FormData(form), widza = d.getAll("widza");
      if (form.tajny.checked && !widza.length) return napisz(".komunikat-kroniki", "Zaznacz, które kraje mają widzieć tajny wpis.");
      wpiszKronike("gm", d.get("tekst").trim(), widza, { tajny: form.tajny.checked, widza, d: { tekst: d.get("tekst").trim() } }); zapisz(stan); pokazKronike();
    };
  }
  otworzSzuflade(); oznaczKronike(true);
}
// znaczek „nowe” na przycisku Kronika: nowsze wpisy niż ostatnio czytane (w tej przeglądarce)
function oznaczKronike(przeczytane) {
  const ost = Object.values(stan.kronika || {}).reduce((m, k) => k.czas > m ? k.czas : m, "");
  let czyt = ""; try { if (przeczytane) localStorage.setItem("frp-kronika", ost); czyt = localStorage.getItem("frp-kronika") || ""; } catch {}
  document.getElementById("kronika").classList.toggle("nowe", ost > czyt);
}
// karta frakcji: ostatnie wpisy z udziałem frakcji (i jej krajów NPC)
function kronikaFrakcji(f) {
  const moje = new Set([f.id, ...Object.entries(stan.npc || {}).filter(([, n]) => n.zwierzchnik === f.id).map(([id]) => "npc:" + id)]);
  const l = wpisyKroniki().filter(([, k]) => k.kraje.some(w => moje.has(w))).slice(0, 10);
  return l.length ? `<section class="kronika-frakcji"><h3>Kronika</h3><ul class="lista-kroniki">${l.map(([id, k]) => wierszKroniki([id, { ...k, tekst: `Tura ${k.tura}: ${k.tekst}` }], false)).join("")}</ul></section>` : "";
}
// bloki sojuszy (7.9): stan.bloki = { id: { nazwa, skrot, rodzaj, kolor, opis, czlonkowie: [wł], zaproszeni: [wł], widza (= członkowie + zaproszeni),
// tajny, tryb: "glosowanie" | "lider", lider, traktaty: [typ traktatu — wspólne dla członków], tura } }. Tajny widzą członkowie, zaproszeni i GM.
// zakłada GM albo gracz (7.9b: zaproszenia, wyjście, wnioski i głosowanie, tryb lidera); wspólne traktaty działają od 7.9c
const RODZAJE_BLOKOW = { sojusz: "Sojusz", liga: "Liga handlowa", zakon: "Zakon", unia: "Unia", inny: "Inna organizacja" };
const TRAKTATY_BLOKU = ["handel", "sojusz", "pakt", "przejscie"];
const KOLORY_BLOKOW = ["#d9b25a", "#3a8fd8", "#3fa34d", "#c0503a", "#9a5ad0", "#2aa39a"];
const znakBloku = b => `<span class="znak-bloku" style="--kolor:${esc(b.kolor)}" aria-hidden="true">${esc(b.skrot || b.nazwa.slice(0, 3).toUpperCase())}</span>`;
const nazwyKrajow = l => l.map(nazwaKraju).join(", ");
const zaznaczenia = (nazwa, opcje, wybrane = []) => opcje.map(([id, n]) => `<label><input type="checkbox" name="${nazwa}" value="${esc(id)}"${wybrane.includes(id) ? " checked" : ""}> ${esc(n)}</label>`).join("");
const opcja = ([id, n], wybrany) => `<option value="${esc(id)}"${id === wybrany ? " selected" : ""}>${esc(n)}</option>`;
// pola zmienialne wnioskiem albo przez lidera (bez składu)
const polaZmianyBloku = (b = {}) => `<label>Nazwa <input name="nazwa" required maxlength="80" value="${esc(b.nazwa || "")}" placeholder="np. Liga Kupców Południa"></label>
    <label>Skrót <input name="skrot" maxlength="5" value="${esc(b.skrot || "")}" placeholder="np. LKP"></label>
    <label>Rodzaj <select name="rodzaj">${Object.entries(RODZAJE_BLOKOW).map(e => opcja(e, b.rodzaj)).join("")}</select></label>
    <label>Kolor na mapie <input type="color" name="kolor" value="${esc(b.kolor || KOLORY_BLOKOW[Object.keys(stan.bloki || {}).length % KOLORY_BLOKOW.length])}"></label>
    <fieldset class="strony-traktatu"><legend>Wspólne traktaty członków</legend>${zaznaczenia("traktat", TRAKTATY_BLOKU.map(t => [t, TYPY_TRAKTATOW[t]]), b.traktaty)}</fieldset>
    <label>Statut / cele <textarea name="opis" rows="3" maxlength="5000" placeholder="np. Wzajemna obrona i wolny handel między członkami.">${esc(b.opis || "")}</textarea></label>
    <label class="tajny"><input type="checkbox" name="tajny"${b.tajny ? " checked" : ""}> Tajny (widzą tylko członkowie, zaproszeni i GM)</label>`;
// GM: pełny formularz; gracz (nowy blok) i lider — bez dopisywania członków (do bloku wchodzi się przez zaproszenie)
const polaBloku = (b = {}, { gracz = false, lider = false } = {}) => `${polaZmianyBloku(b)}
    ${gracz ? "" : `<fieldset class="strony-traktatu"><legend>${lider ? "Członkowie (odznacz, by wykluczyć)" : "Członkowie"}</legend>${zaznaczenia("czlonek", lider ? b.czlonkowie.map(w => [w, nazwaKraju(w)]) : opcjeKrajow(), b.czlonkowie)}</fieldset>`}
    <fieldset class="strony-traktatu"><legend>Zaproszeni (dołączą, gdy się zgodzą)</legend>${zaznaczenia("zaproszony", opcjeKrajow().filter(([w]) => !(b.czlonkowie || []).includes(w) && w !== gracz), b.zaproszeni)}</fieldset>
    ${gracz ? "" : `<label>Decyzje <select name="tryb"><option value="glosowanie">głosowanie członków (większość)</option><option value="lider"${b.tryb === "lider" ? " selected" : ""}>lider decyduje sam</option></select></label>
    <label>Lider <select name="lider"><option value="">— pierwszy członek —</option>${(lider ? b.czlonkowie.map(w => [w, nazwaKraju(w)]) : opcjeKrajow()).map(e => opcja(e, b.lider)).join("")}</select></label>`}`;
const odczytZmianyBloku = d => ({ nazwa: d.get("nazwa").trim(), skrot: d.get("skrot").trim().toUpperCase(), rodzaj: d.get("rodzaj"), kolor: d.get("kolor"), opis: d.get("opis").trim(),
  tajny: d.get("tajny") === "on", traktaty: d.getAll("traktat") });
function odczytBloku(form, stary = {}, { gracz = "", lider = false } = {}) {   // → dane bloku albo tekst błędu
  const d = new FormData(form);
  const czlonkowie = gracz ? [gracz] : lider ? stary.czlonkowie.filter(w => d.getAll("czlonek").includes(w)) : d.getAll("czlonek");
  if (!czlonkowie.length) return "Blok musi mieć co najmniej jednego członka.";
  const zaproszeni = d.getAll("zaproszony").filter(w => !czlonkowie.includes(w));
  const tryb = gracz ? "glosowanie" : d.get("tryb"), lid = czlonkowie.includes(d.get("lider")) ? d.get("lider") : czlonkowie.includes(stary.lider) && lider ? stary.lider : czlonkowie[0];
  return { ...odczytZmianyBloku(d), czlonkowie, zaproszeni, widza: [...czlonkowie, ...zaproszeni], tryb, lider: lid };
}
const wpiszBlok = (b, tekst, kto = []) => { const k = [...new Set([...b.czlonkowie, ...kto])]; return wpiszKronike("blok", tekst, k, { tajny: b.tajny, widza: k }); };
const aktywnyBlok = b => !b.rozwiazany && b.czlonkowie.length > 0;
const blokiWidoczne = () => Object.entries(stan.bloki || {}).filter(([, b]) => aktywnyBlok(b));
// działanie jako kraj (7.9b): gracz — jego frakcja; w DEMO GM wybiera „działaj jako” (sprawdzenie ścieżek gracza bez chmury)
let demoJako = "";
const jakoKraj = () => PODGLAD ? "" : CHMURA ? (!gm && profil?.frakcja) || "" : demoJako;
// wnioski (7.9b): b.wnioski = { id: { typ: zapros | wyrzuc | zmiana | tryb | rozwiaz, dane, autor, za: [wł], przeciw: [wł], tura } };
// przechodzi, gdy „za” jest więcej niż połowa członków; odpada, gdy „przeciw” to co najmniej połowa. Za kraje NPC głosuje GM.
const POLA_ZMIANY = { nazwa: "nazwa", skrot: "skrót", rodzaj: "rodzaj", kolor: "kolor", opis: "statut", tajny: "tajność", traktaty: "wspólne traktaty" };
function opisWniosku(b, w) {
  const d = w.dane;
  if (w.typ === "zapros") return `zaprosić: ${nazwaKraju(d.kraj)}`;
  if (w.typ === "wyrzuc") return `wykluczyć: ${nazwaKraju(d.kraj)}`;
  if (w.typ === "tryb") return d.tryb === "lider" ? `lider: ${nazwaKraju(d.lider)} (decyduje sam)` : "powrót do głosowania";
  if (w.typ === "rozwiaz") return "rozwiązać blok";
  const zm = Object.keys(POLA_ZMIANY).filter(k => JSON.stringify(d[k]) !== JSON.stringify(b[k]));
  return `zmienić: ${zm.map(k => k === "nazwa" ? `nazwa → ${d.nazwa}` : k === "traktaty" ? `wspólne traktaty → ${d.traktaty.map(t => TYPY_TRAKTATOW[t]).join(", ") || "brak"}` : POLA_ZMIANY[k]).join(", ") || "nic"}`;
}
function wykonajWniosek(b, w) {   // zmienia blok; → tekst do kroniki
  const d = w.dane, przed = b.nazwa;
  if (w.typ === "zapros") { if (![...b.czlonkowie, ...b.zaproszeni].includes(d.kraj)) b.zaproszeni.push(d.kraj); return `${b.nazwa} zaprasza: ${nazwaKraju(d.kraj)}`; }
  if (w.typ === "wyrzuc") { b.czlonkowie = b.czlonkowie.filter(x => x !== d.kraj); if (b.lider === d.kraj) b.lider = b.czlonkowie[0] || ""; return `${nazwaKraju(d.kraj)} — wykluczony z bloku ${b.nazwa}`; }
  if (w.typ === "tryb") { b.tryb = d.tryb; if (d.lider) b.lider = d.lider; return `${b.nazwa}: ${d.tryb === "lider" ? `lider — ${nazwaKraju(b.lider)}` : "decyzje znowu głosowaniem"}`; }
  if (w.typ === "rozwiaz") { b.rozwiazany = stan.tury.length + 1; return `Rozwiązanie bloku ${b.nazwa}`; }
  const opis = opisWniosku(b, w); Object.assign(b, d); return `${przed} — ${opis}`;
}
const wiekszosc = (b, l) => l.length * 2 > b.czlonkowie.length;
// zapis zmian bloku: GM w chmurze — zwykły zapis; gracz (i DEMO) — zapiszBlokGracza (po kolei, żeby reguły widziały wcześniejszy głos)
async function zapiszBlok(id, teksty = [], kto = []) {
  const b = stan.bloki[id]; if (b) b.widza = [...b.czlonkowie, ...b.zaproszeni];
  const wpisy = b ? teksty.map(t => wpiszBlok(b, t, kto)) : [];
  try { if (gm && CHMURA) zapisz(stan); else await zapiszBlokGracza(id, wpisy); }
  catch (e) { alert("Nie udało się zapisać zmiany bloku: " + komunikat(e)); }
}
// głos kraju „kto” (gracz za siebie, GM za kraj NPC); przegłosowany wniosek wykonuje się od razu (drugim zapisem), odrzucony znika
async function glosuj(id, wid, kto, tak) {
  const b = stan.bloki[id], w = b.wnioski?.[wid]; if (!w) return;
  w.za = w.za.filter(x => x !== kto); w.przeciw = w.przeciw.filter(x => x !== kto); (tak ? w.za : w.przeciw).push(kto);
  delete b.wykonano; await zapiszBlok(id);
  await rozstrzygnij(id, wid, kto);
}
async function rozstrzygnij(id, wid, kto) {
  const b = stan.bloki[id], w = b?.wnioski?.[wid]; if (!w) return;
  if (wiekszosc(b, w.za)) { delete b.wnioski[wid]; b.wykonano = wid; const t = wykonajWniosek(b, w); await zapiszBlok(id, [t], [kto]); }
  else if (w.przeciw.length * 2 >= b.czlonkowie.length) { delete b.wnioski[wid]; delete b.wykonano; await zapiszBlok(id); }
  pokazBloki();
}
function formularzWniosku(id, b, jako) {
  const typy = b.tryb === "lider" ? { tryb: "powrót do głosowania" } : { zapros: "zaprosić kraj", wyrzuc: "wykluczyć członka", zmiana: "zmienić blok (nazwa, statut, traktaty…)", tryb: "wybrać lidera", rozwiaz: "rozwiązać blok" };
  const inni = opcjeKrajow().filter(([w]) => ![...b.czlonkowie, ...b.zaproszeni].includes(w)), czlonkowie = b.czlonkowie.filter(w => w !== jako).map(w => [w, nazwaKraju(w)]);
  return `<details class="nowy-wniosek"><summary>+ Wniosek do głosowania</summary><form class="nowy-traktat wniosek" data-blok="${esc(id)}">
    <label>Wniosek <select name="typ">${Object.entries(typy).map(e => opcja(e)).join("")}</select></label>
    <label data-dla="zapros">Kraj <select name="zapros">${inni.map(e => opcja(e)).join("")}</select></label>
    <label data-dla="wyrzuc">Członek <select name="wyrzuc">${czlonkowie.map(e => opcja(e)).join("")}</select></label>
    <div data-dla="zmiana" class="nowy-traktat">${polaZmianyBloku(b)}</div>
    ${b.tryb === "lider" ? "" : `<label data-dla="tryb">Lider <select name="lider">${b.czlonkowie.map(w => opcja([w, nazwaKraju(w)])).join("")}</select></label>`}
    <p><button class="dodaj">Zgłoś wniosek</button> <span class="opis-sekcji komunikat-bloku"></span></p></form></details>`;
}
function wnioskiBloku(id, b, jako) {
  const l = Object.entries(b.wnioski || {}); if (!l.length) return "";
  const npc = gm ? b.czlonkowie.filter(w => w.startsWith("npc:")) : [];
  return `<div class="wnioski"><h4>Wnioski</h4><ul class="lista-traktatow">${l.map(([wid, w]) => {
    const glos = jako && b.czlonkowie.includes(jako) ? (w.za.includes(jako) ? "za" : w.przeciw.includes(jako) ? "przeciw" : "") : null;
    return `<li><span><b>${esc(opisWniosku(b, w))}</b><small>zgłasza: ${esc(nazwaKraju(w.autor))} · za ${w.za.length}, przeciw ${w.przeciw.length} z ${b.czlonkowie.length} (potrzeba ${Math.floor(b.czlonkowie.length / 2) + 1}) · tura ${w.tura}</small></span>
      <span class="akcje">${glos === null ? "" : glos ? `<small>Twój głos: ${glos}</small>` : `<button type="button" class="cofnij" data-glos="${esc(wid)}" data-tak="1">Za</button> <button type="button" class="cofnij" data-glos="${esc(wid)}" data-tak="">Przeciw</button>`}
      ${npc.filter(x => !w.za.includes(x) && !w.przeciw.includes(x)).map(x => `<span class="glos-npc">${esc(nazwaKraju(x))}: <button type="button" class="cofnij" data-glos="${esc(wid)}" data-kto="${esc(x)}" data-tak="1">za</button> <button type="button" class="cofnij" data-glos="${esc(wid)}" data-kto="${esc(x)}" data-tak="">przeciw</button></span>`).join(" ")}</span></li>`;
  }).join("")}</ul></div>`;
}
function kartaBloku([id, b], jako) {
  const czlonek = jako && b.czlonkowie.includes(jako), lider = czlonek && b.tryb === "lider" && b.lider === jako;
  return `<li class="blok" style="--kolor:${esc(b.kolor)}" data-blok="${esc(id)}"><div class="blok-glowa">${znakBloku(b)}<span><b>${b.tajny ? "🔒 " : ""}${esc(b.nazwa)}</b>
      <small>${RODZAJE_BLOKOW[b.rodzaj] || b.rodzaj} · ${b.czlonkowie.length} ${odmiana(b.czlonkowie.length, "członek", "członków", "członków")} · ${b.tryb === "lider" ? `lider: ${esc(nazwaKraju(b.lider))}` : "decyzje głosowaniem"} · od tury ${b.tura}</small></span>
      <button type="button" class="cofnij fokus-bloku" data-fokus aria-pressed="${fokusBloku === id}">${fokusBloku === id ? "Ukryj na mapie" : "Pokaż na mapie"}</button></div>
    <p class="blok-czlonkowie">${b.czlonkowie.map(w => `<span class="plakietka">${esc(nazwaKraju(w))}${b.tryb === "lider" && b.lider === w ? " ★" : ""}</span>`).join("")}</p>
    ${b.zaproszeni.length ? `<p class="opis-sekcji">Zaproszeni: ${esc(nazwyKrajow(b.zaproszeni))}</p>` : ""}
    ${b.traktaty.length ? `<p class="opis-sekcji">Wspólne traktaty: ${b.traktaty.map(t => TYPY_TRAKTATOW[t]).join(", ")}</p>` : ""}
    ${b.opis ? `<p class="opis-traktatu">${esc(b.opis)}</p>` : ""}
    ${jako && b.zaproszeni.includes(jako) ? `<p class="zaproszenie"><b>${esc(nazwaKraju(jako))}</b> ma zaproszenie: <button type="button" class="dodaj" data-przyjmij>Dołącz</button> <button type="button" class="cofnij" data-odrzuc>Odrzuć</button></p>` : ""}
    ${czlonek || gm ? wnioskiBloku(id, b, jako) : ""}
    ${lider ? `<details><summary>Zmień (lider)</summary><form class="nowy-traktat edycja-bloku" data-lider="1">${polaBloku(b, { lider: true })}
      <p><button class="dodaj">Zapisz zmiany</button> <button type="button" class="cofnij" data-rozwiaz-blok>Rozwiąż blok</button> <span class="opis-sekcji komunikat-bloku"></span></p></form></details>` : czlonek ? formularzWniosku(id, b, jako) : ""}
    ${czlonek ? `<p><button type="button" class="cofnij" data-wyjdz>Wyjdź z bloku</button></p>` : ""}
    ${gm && !jako ? `<details><summary>Zmień (GM)</summary><form class="nowy-traktat edycja-bloku">${polaBloku(b)}
      <p><button class="dodaj">Zapisz zmiany</button> <button type="button" class="cofnij" data-rozwiaz-blok>Rozwiąż blok</button> <span class="opis-sekcji komunikat-bloku"></span></p></form></details>` : ""}</li>`;
}
function pokazBloki() {
  widok = "bloki"; mapa.wybierz(0); glowny.style.removeProperty("--kolor");
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
  const jako = jakoKraj(), l = blokiWidoczne().sort((a, b) => a[1].nazwa.localeCompare(b[1].nazwa, "pl"));
  pokazOsadyNaMapie();   // wspólne traktaty bloków (szlaki, linie sojuszy) po każdej zmianie bloku
  glowny.innerHTML = `<article class="karta bloki"><h2>Bloki i organizacje</h2>
    <p class="opis-sekcji">Sojusze, ligi i zakony wielu krajów. Członkowie decydują głosowaniem (większość) albo przez lidera. Tajny blok widzą tylko członkowie, zaproszeni i GM.</p>
    ${!CHMURA ? `<label class="demo-jako">Tryb DEMO — działaj jako <select id="demo-jako"><option value="">GM</option>${stan.frakcje.map(f => opcja([f.id, f.nazwa], demoJako)).join("")}</select></label>` : ""}
    ${l.length ? `<ul class="lista-blokow">${l.map(e => kartaBloku(e, jako)).join("")}</ul>` : `<p class="puste">Nie ma jeszcze żadnego bloku.</p>`}
    ${gm && !jako ? `<details class="nowy-blok"${l.length ? "" : " open"}><summary>+ Nowy blok (GM)</summary><form class="nowy-traktat">${polaBloku()}
      <p><button class="dodaj">Załóż blok</button> <span class="opis-sekcji komunikat-bloku"></span></p></form></details>`
    : jako ? `<details class="nowy-blok"><summary>+ Załóż blok (${esc(nazwaKraju(jako))})</summary><form class="nowy-traktat">${polaBloku({}, { gracz: jako })}
      <p class="opis-sekcji">Zakładasz blok jako jego pierwszy członek; zaproszone kraje dołączą, gdy się zgodzą.</p>
      <p><button class="dodaj">Załóż blok</button> <span class="opis-sekcji komunikat-bloku"></span></p></form></details>` : ""}</article>`;
  const komunikat = (form, t) => { form.querySelector(".komunikat-bloku").textContent = t; };
  glowny.querySelector("#demo-jako")?.addEventListener("change", e => { demoJako = e.target.value; pokazBloki(); });
  glowny.querySelector(".nowy-blok form")?.addEventListener("submit", async e => {
    e.preventDefault(); const b = odczytBloku(e.target, {}, { gracz: jako || "" }); if (typeof b === "string") return komunikat(e.target, b);
    const id = "bl" + Date.now().toString(36); Object.assign(b, { tura: stan.tury.length + 1, wnioski: {} }); (stan.bloki ??= {})[id] = b;
    await zapiszBlok(id, [`Powstaje ${b.nazwa}${b.skrot ? ` (${b.skrot})` : ""}: ${nazwyKrajow(b.czlonkowie)}`], [jako]); pokazBloki();
  });
  glowny.querySelectorAll(".lista-blokow > li").forEach(li => {
    const id = li.dataset.blok, b = stan.bloki[id], $ = s => li.querySelector(s);
    $("[data-przyjmij]")?.addEventListener("click", async () => {
      b.zaproszeni = b.zaproszeni.filter(w => w !== jako); b.czlonkowie.push(jako); await zapiszBlok(id, [`${nazwaKraju(jako)} — do bloku ${b.nazwa}`], [jako]); pokazBloki(); });
    $("[data-fokus]").onclick = () => {   // tylko ten blok na mapie; mapa przesuwa się do środka jego ziem
      fokusBloku = fokusBloku === id ? null : id; pokazBloki();
      const p = indeksyBloku(b).map(i => PROWINCJE[i - 1]); if (fokusBloku && p.length) mapa.doWidoku(p.reduce((s, q) => s + q.x, 0) / p.length, p.reduce((s, q) => s + q.y, 0) / p.length);
    };
    $("[data-odrzuc]")?.addEventListener("click", async () => { b.zaproszeni = b.zaproszeni.filter(w => w !== jako); await zapiszBlok(id); pokazBloki(); });
    $("[data-wyjdz]")?.addEventListener("click", async () => {
      if (!confirm(`Wyjść z bloku „${b.nazwa}”?`)) return;
      b.czlonkowie = b.czlonkowie.filter(w => w !== jako); if (b.lider === jako) b.lider = b.czlonkowie[0] || "";
      await zapiszBlok(id, [`${nazwaKraju(jako)} — poza blokiem ${b.nazwa}`], [jako]); pokazBloki(); });
    li.querySelectorAll("[data-glos]").forEach(x => x.onclick = () => glosuj(id, x.dataset.glos, x.dataset.kto || jako, Boolean(x.dataset.tak)));
    const wn = $("form.wniosek");
    if (wn) {
      const pokazPola = () => wn.querySelectorAll("[data-dla]").forEach(p => { p.hidden = p.dataset.dla !== wn.typ.value; p.querySelectorAll("input,select,textarea").forEach(x => x.disabled = p.hidden); });
      wn.typ.onchange = pokazPola; pokazPola();
      wn.onsubmit = async e => {
        e.preventDefault(); const d = new FormData(wn), typ = d.get("typ");
        const dane = typ === "zapros" ? { kraj: d.get("zapros") } : typ === "wyrzuc" ? { kraj: d.get("wyrzuc") } : typ === "zmiana" ? odczytZmianyBloku(d)
          : typ === "tryb" ? (b.tryb === "lider" ? { tryb: "glosowanie" } : { tryb: "lider", lider: d.get("lider") }) : {};
        if ((typ === "zapros" || typ === "wyrzuc") && !dane.kraj) return komunikat(wn, "Nie ma kogo wybrać.");
        const wid = "w" + Date.now().toString(36); (b.wnioski ??= {})[wid] = { typ, dane, autor: jako, za: [jako], przeciw: [], tura: stan.tury.length + 1 };
        delete b.wykonano; await zapiszBlok(id); await rozstrzygnij(id, wid, jako); pokazBloki();
      };
    }
    const ed = $("form.edycja-bloku");
    if (ed) ed.onsubmit = async e => {
      e.preventDefault(); const nowy = odczytBloku(ed, b, { lider: Boolean(ed.dataset.lider) }); if (typeof nowy === "string") return komunikat(ed, nowy);
      const doszli = nowy.czlonkowie.filter(w => !b.czlonkowie.includes(w)), odeszli = b.czlonkowie.filter(w => !nowy.czlonkowie.includes(w));
      Object.assign(b, nowy);
      await zapiszBlok(id, [...(doszli.length ? [`${nazwyKrajow(doszli)} — do bloku ${b.nazwa}`] : []), ...(odeszli.length ? [`${nazwyKrajow(odeszli)} — poza blokiem ${b.nazwa}`] : [])], [jako, ...odeszli].filter(Boolean)); pokazBloki();
    };
    $("[data-rozwiaz-blok]")?.addEventListener("click", async () => {
      if (!confirm(`Rozwiązać blok „${b.nazwa}”? Zniknie z listy (wpis zostanie w kronice).`)) return;
      if (gm && !jako) { usunWpis("bloki", id); wpiszBlok(b, `Rozwiązanie bloku ${b.nazwa}`); zapisz(stan); }
      else { b.rozwiazany = stan.tury.length + 1; await zapiszBlok(id, [`Rozwiązanie bloku ${b.nazwa}`], [jako]); }
      pokazBloki();
    });
  });
  otworzSzuflade();
}
// bloki na mapie (7.9d): warstwa „Bloki” — poświata w kolorze bloku wokół ziem członków; „Pokaż na mapie” (fokus) — tylko ten blok,
// także przy wyłączonej warstwie; mapa przerysowuje warstwę tylko przy zmianie
let fokusBloku = null, blokiKlucz = "";
const indeksyBloku = b => PROWINCJE.flatMap((p, i) => b.czlonkowie.includes(stan.prowincje?.[p.id]?.wlasciciel) ? [i + 1] : []);
function blokiNaMapie() {
  const l = blokiWidoczne().filter(([id]) => fokusBloku ? id === fokusBloku : warstwy.bloki).map(([, b]) => ({ kolor: rgb(b.kolor), indeksy: indeksyBloku(b) }));
  const k = JSON.stringify(l); if (k !== blokiKlucz) { blokiKlucz = k; mapa.ustawBloki(l); }
}
// karta frakcji: bloki, w których frakcja jest (albo jest zaproszona) — szczegóły w szufladzie „Bloki”
function blokiFrakcji(f) {
  const l = blokiWidoczne().map(([, b]) => b).filter(b => b.czlonkowie.includes(f.id) || b.zaproszeni.includes(f.id));
  return l.length ? `<section class="bloki-frakcji"><h3>Bloki</h3><ul class="lista-blokow">${l.map(b => `<li class="blok" style="--kolor:${esc(b.kolor)}"><div class="blok-glowa">${znakBloku(b)}<span><b>${b.tajny ? "🔒 " : ""}${esc(b.nazwa)}</b>
    <small>${RODZAJE_BLOKOW[b.rodzaj] || b.rodzaj}${b.zaproszeni.includes(f.id) ? " · <b>zaproszenie</b>" : ` · członkowie: ${esc(nazwyKrajow(b.czlonkowie))}`}${Object.keys(b.wnioski || {}).length && b.czlonkowie.includes(f.id) ? ` · <b>wnioski: ${Object.keys(b.wnioski).length}</b>` : ""}</small></span></div></li>`).join("")}</ul>
    <p><button type="button" class="cofnij" data-pokaz-bloki>Wszystkie bloki</button></p></section>` : "";
}
// wojny (7.1f): stan.wojny = [[wł1, wł2]] — właściciele jak w prowincjach (id frakcji albo "npc:<id>"); jawne, ustawia GM; bez wpisu = pokój
const wWojnie = (x, y) => x !== y && (stan.wojny || []).some(([a, b]) => (a === x && b === y) || (a === y && b === x));
const wrogowie = wl => (stan.wojny || []).flatMap(([a, b]) => a === wl ? [b] : b === wl ? [a] : []);
const opcjeKrajow = () => [...stan.frakcje.map(f => [f.id, f.nazwa]), ...Object.entries(stan.npc || {}).map(([id, n]) => ["npc:" + id, n.nazwa])];
const wojnySekcja = () => `<section class="wojny"><h3>Wojny</h3><p class="opis-sekcji">Pary krajów w stanie wojny — jawne dla wszystkich. Armie wrogich krajów, które się spotkają, stają do bitwy.</p>
  ${(stan.wojny || []).length ? `<ul class="podsumowanie">${stan.wojny.map(([a, b], i) => `<li><span>${esc(wlascicielPo(a)?.nazwa || a)} ⚔ ${esc(wlascicielPo(b)?.nazwa || b)}</span><button type="button" class="usun" data-pokoj="${i}" title="Zawrzyj pokój" aria-label="Zawrzyj pokój">×</button></li>`).join("")}</ul>` : `<p class="puste">Wszędzie pokój.</p>`}
  <form class="nowa-wojna">${[1, 2].map(k => `<select name="k${k}" aria-label="Kraj ${k}">${opcjeKrajow().map(([id, n]) => `<option value="${esc(id)}">${esc(n)}</option>`).join("")}</select>`).join(" ⚔ ")}
    <button class="dodaj">Wypowiedz wojnę</button></form></section>`;
function podepnijWojny(odswiez) {
  glowny.querySelectorAll("[data-pokoj]").forEach(b => b.onclick = () => { const [x, y] = stan.wojny.splice(+b.dataset.pokoj, 1)[0]; wpiszKronike("pokoj", `Pokój: ${nazwaKraju(x)} i ${nazwaKraju(y)}`, [x, y], { d: { A: x, B: y } }); odswiez(); });
  const form = glowny.querySelector(".nowa-wojna");
  form.onsubmit = e => {
    e.preventDefault(); const a = form.k1.value, b = form.k2.value;
    if (a === b || wWojnie(a, b)) return;
    // bloki (7.9e): blok z sojuszem / paktem — wojna wewnątrz łamie wspólny traktat; napadnięty członek — propozycja wojny z resztą bloku (decyduje GM)
    const obronne = blokiWidoczne().filter(([, x]) => (x.traktaty || []).some(t => t === "sojusz" || t === "pakt"));
    const wspolne = obronne.filter(([, x]) => x.czlonkowie.includes(a) && x.czlonkowie.includes(b));
    if (wspolne.length && !confirm(`${nazwaKraju(a)} i ${nazwaKraju(b)} są razem w bloku: ${wspolne.map(([, x]) => x.nazwa).join(", ")} (wspólny sojusz / pakt). Wypowiedzieć wojnę mimo to?`)) return;
    const reszta = obronne.filter(([, x]) => x.czlonkowie.includes(b) && !x.czlonkowie.includes(a)).map(([, x]) => [x, x.czlonkowie.filter(w => w !== b && w !== a && !wWojnie(a, w))]).filter(([, l]) => l.length);
    const przyjazne = aktywneTraktaty().filter(([, t]) => !t.blok && ["sojusz", "pakt"].includes(t.typ) && t.strony.includes(a) && t.strony.includes(b));   // bloki — 7.9e
    if (przyjazne.length && confirm(`Te kraje łączy: ${przyjazne.map(([, t]) => t.nazwa).join(", ")}. Zerwać przy wypowiedzeniu wojny?`)) przyjazne.forEach(([, t]) => {
      t.zerwany = stan.tury.length + 1; wpiszKronike("zerwanie", `Zerwany traktat: ${t.nazwa} (${nazwyStron(t)})`, t.strony, { tajny: t.tajny, widza: t.strony, d: daneTraktatu(t) });
    });
    (stan.wojny ??= []).push([a, b]); wpiszKronike("wojna", `${nazwaKraju(a)} wypowiada wojnę: ${nazwaKraju(b)}`, [a, b], { d: { A: a, B: b } });
    for (const [x, l] of reszta) {
      const nowe = l.filter(w => !wWojnie(a, w)); if (!nowe.length) continue;
      if (!confirm(`${nazwaKraju(b)} należy do bloku ${x.nazwa} (${x.traktaty.filter(t => t === "sojusz" || t === "pakt").map(t => TYPY_TRAKTATOW[t]).join(", ")}). Wypowiedzieć wojnę całemu blokowi — także: ${nazwyKrajow(nowe)}?`)) continue;
      for (const w of nowe) { stan.wojny.push([a, w]); wpiszKronike("wojna", `${nazwaKraju(a)} wypowiada wojnę: ${nazwaKraju(w)} (blok ${x.nazwa})`, [a, w], { d: { A: a, B: w, blok: x.nazwa } }); }
    }
    odswiez();
  };
}
// traktaty (7.4): stan.traktaty = { id: { nazwa, typ, strony: [wł], tajny, opis, tura, zerwany?: tura } } — wpisuje GM; tajny widzą strony i GM
const TYPY_TRAKTATOW = { sojusz: "Sojusz", pakt: "Pakt o nieagresji", handel: "Umowa handlowa", pokoj: "Traktat pokojowy", wasalstwo: "Wasalstwo", przejscie: "Prawo przejścia wojsk", inny: "Inny" };
// wspólne traktaty bloków (7.9c): każdy zaznaczony typ = traktat wielostronny wszystkich członków (liczony z bloku, nie zapisywany osobno);
// działa jak zwykły (szlaki, linie sojuszy), tajny razem z blokiem, zmienia się w bloku — nie zrywa się go osobno
const traktatyBlokow = () => blokiWidoczne().flatMap(([id, b]) => b.czlonkowie.length < 2 ? [] : (b.traktaty || []).map(typ => [`blok:${id}:${typ}`,
  { nazwa: `${b.nazwa} — ${TYPY_TRAKTATOW[typ]}`, typ, strony: b.czlonkowie, tajny: b.tajny, opis: "", tura: b.tura, blok: id }]));
const aktywneTraktaty = () => [...Object.entries(stan.traktaty || {}).filter(([, t]) => !t.zerwany), ...traktatyBlokow()];
const nazwyStron = t => t.strony.map(w => wlascicielPo(w)?.nazwa || w).join(", ");
const wierszTraktatu = ([id, t], przyciski) => `<li${t.zerwany ? ` class="zerwany"` : ""}><span><b>${t.tajny ? "🔒 " : t.blok ? "🏛 " : "📜 "}${esc(t.nazwa)}</b> <small>${TYPY_TRAKTATOW[t.typ] || t.typ} · ${esc(nazwyStron(t))} · ${t.blok ? "wspólny traktat bloku" : `tura ${t.tura}`}${t.zerwany ? ` · zerwany w turze ${t.zerwany}` : ""}</small>
  ${t.opis ? `<span class="opis-traktatu">${esc(t.opis)}</span>` : ""}</span>${przyciski ? `<span class="akcje">${t.zerwany ? "" : `<button type="button" class="usun" data-zerwij="${esc(id)}" title="Zerwij traktat" aria-label="Zerwij traktat ${esc(t.nazwa)}">✂</button>`}<button type="button" class="usun" data-usun-traktat="${esc(id)}" title="Usuń (pomyłka)" aria-label="Usuń traktat ${esc(t.nazwa)}">×</button></span>` : ""}</li>`;
// pola traktatu — formularz GM i propozycja gracza (moj: frakcja autora, zawsze strona)
const polaTraktatu = moj => `<label>Nazwa <input name="nazwa" required maxlength="100" placeholder="np. Pakt Kłów i Łusek"></label>
    <label>Typ <select name="typ">${Object.entries(TYPY_TRAKTATOW).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>
    <fieldset class="strony-traktatu"><legend>Strony (co najmniej dwie)</legend>${opcjeKrajow().map(([id, n]) => `<label><input type="checkbox" name="strona" value="${esc(id)}"${id === moj ? " checked disabled" : ""}> ${esc(n)}</label>`).join("")}</fieldset>
    <label>Opis / warunki <textarea name="opis" rows="3" maxlength="5000"></textarea></label>
    <label class="tajny"><input type="checkbox" name="tajny"> Tajny (widzą tylko strony i GM)</label>`;
const traktatySekcja = () => `<section class="traktaty"><h3>Traktaty</h3><p class="opis-sekcji">Wpisuje GM. Tajny traktat widzą tylko jego strony i GM. Traktat pokojowy kończy wojnę między stronami. Umowa handlowa rysuje szlak na mapie.</p>
  ${Object.keys(stan.traktaty || {}).length ? `<ul class="lista-traktatow">${Object.entries(stan.traktaty).sort((a, b) => b[1].tura - a[1].tura).map(e => wierszTraktatu(e, true)).join("")}</ul>` : `<p class="puste">Brak traktatów.</p>`}
  <form class="nowy-traktat">${polaTraktatu()}
    <button class="dodaj">Dodaj traktat</button> <span class="opis-sekcji komunikat-traktatu"></span></form></section>`;
// zawarcie i zerwanie (GM albo akceptacja propozycji gracza 7.15) — z kroniką; pokój kończy wojnę między stronami
function zawrzyjTraktat(t) {
  t.tura = stan.tury.length + 1; (stan.traktaty ??= {})["t" + Date.now().toString(36)] = t;
  wpiszKronike("traktat", `${nazwyStron(t)} zawierają: ${t.nazwa} (${TYPY_TRAKTATOW[t.typ]})`, t.strony, { tajny: t.tajny, widza: t.strony, d: daneTraktatu(t) });
  if (t.typ === "pokoj") stan.wojny = (stan.wojny || []).filter(([a, b]) => !(t.strony.includes(a) && t.strony.includes(b)));
  zapisz(stan); pokazOsadyNaMapie();
}
function zerwijTraktat(id) {
  const t = stan.traktaty[id]; t.zerwany = stan.tury.length + 1;
  wpiszKronike("zerwanie", `Zerwany traktat: ${t.nazwa} (${nazwyStron(t)})`, t.strony, { tajny: t.tajny, widza: t.strony, d: daneTraktatu(t) });
  zapisz(stan); pokazOsadyNaMapie();
}
function podepnijTraktaty(odswiez) {
  const form = glowny.querySelector(".nowy-traktat");
  form.onsubmit = e => {
    e.preventDefault();
    const d = new FormData(form), strony = d.getAll("strona"), typ = d.get("typ");
    if (strony.length < 2) return napisz(".komunikat-traktatu", "Zaznacz co najmniej dwie strony.");
    zawrzyjTraktat({ nazwa: d.get("nazwa").trim(), typ, strony, tajny: d.get("tajny") === "on", opis: d.get("opis").trim() }); odswiez();
  };
  glowny.querySelectorAll("[data-zerwij]").forEach(b => b.onclick = () => {
    const t = stan.traktaty[b.dataset.zerwij]; if (!confirm(`Zerwać traktat „${t.nazwa}”? Zostanie w historii.`)) return;
    zerwijTraktat(b.dataset.zerwij); odswiez();
  });
  glowny.querySelectorAll("[data-usun-traktat]").forEach(b => b.onclick = () => {
    const t = stan.traktaty[b.dataset.usunTraktat]; if (!confirm(`Usunąć traktat „${t.nazwa}” całkiem (np. wpisany przez pomyłkę)? Tego nie da się cofnąć.`)) return;
    usunTraktat(b.dataset.usunTraktat); pokazPanelGM(true); pokazOsadyNaMapie();
  });
}
// karta frakcji: traktaty, które ten gracz widzi, z udziałem frakcji (jej krajów NPC też)
function traktatyFrakcji(f) {
  const moje = new Set([f.id, ...Object.entries(stan.npc || {}).filter(([, n]) => n.zwierzchnik === f.id).map(([id]) => "npc:" + id)]);
  const l = [...Object.entries(stan.traktaty || {}), ...traktatyBlokow()].filter(([, t]) => t.strony.some(w => moje.has(w))).sort((a, b) => !!a[1].zerwany - !!b[1].zerwany || b[1].tura - a[1].tura);
  const gracz = CHMURA && !PODGLAD && !gm && moja(f);   // 7.15: gracz proponuje nowy traktat i zerwanie swojego
  const wiersz = e => wierszTraktatu(e, false).replace(/<\/li>$/, gracz && !e[1].zerwany && !e[1].blok && e[1].strony.includes(f.id)
    ? `<span class="akcje"><button type="button" class="usun" data-prop-zerwij="${esc(e[0])}" title="Zaproponuj GM zerwanie" aria-label="Zaproponuj zerwanie: ${esc(e[1].nazwa)}">✂</button></span></li>` : "</li>");
  return l.length || gracz ? `<section class="traktaty"><h3>Traktaty</h3>${l.length ? `<ul class="lista-traktatow">${l.map(wiersz).join("")}</ul>` : `<p class="puste">Brak traktatów.</p>`}
    ${gracz ? `<p><button type="button" class="cofnij" data-prop-traktat>Zaproponuj traktat</button></p>` : ""}</section>` : "";
}
const npcSekcja = () => `<section class="npc"><h3>Kraje NPC</h3><p class="opis-sekcji">Wasale i marionetki frakcji mają na mapie kolor w odcieniu zwierzchnika; kraj samodzielny nie ma zwierzchnika i ma własny kolor. Prowincje przypisujesz w karcie prowincji (klik w mapę).</p>
  <ul class="lista-npc">${Object.entries(stan.npc || {}).sort((a, b) => a[1].nazwa.localeCompare(b[1].nazwa, "pl")).map(([id, n]) => `<li data-id="${esc(id)}">
    <span class="probka" style="background:${kolorNpc(id)}" title="Kolor na mapie"></span>
    <input name="nazwa" required maxlength="60" value="${esc(n.nazwa)}" aria-label="Nazwa kraju NPC">
    <select name="rodzaj" aria-label="Rodzaj: ${esc(n.nazwa)}">${opcjeRodzaju(n.rodzaj)}</select>
    ${n.rodzaj === "samodzielny" ? `<input type="color" name="kolor" value="${esc(n.kolor || "#808080")}" aria-label="Kolor: ${esc(n.nazwa)}" title="Kolor na mapie">`
      : `<select name="zwierzchnik" aria-label="Zwierzchnik: ${esc(n.nazwa)}">${opcjeZwierzchnika(n.zwierzchnik)}</select>`}
    <span class="ile">${ileProwincji("npc:" + id)} prow.</span>
    <button type="button" class="usun" aria-label="Usuń kraj ${esc(n.nazwa)}" title="Usuń">×</button>
    <textarea name="opis" rows="2" maxlength="2000" placeholder="Opis (opcjonalnie)" aria-label="Opis: ${esc(n.nazwa)}">${esc(n.opis || "")}</textarea></li>`).join("")
    || `<li class="puste">Brak — dodaj pierwszy kraj NPC.</li>`}</ul>
  <form class="dodaj-npc"><input name="nazwa" required maxlength="60" placeholder="Nazwa kraju NPC" aria-label="Nazwa nowego kraju NPC">
    <select name="rodzaj" aria-label="Rodzaj">${opcjeRodzaju("wasal")}</select><select name="zwierzchnik" aria-label="Zwierzchnik">${opcjeZwierzchnika("")}</select>
    <input type="color" name="kolor" value="#8a6f9e" aria-label="Kolor (kraj samodzielny)" title="Kolor na mapie (kraj samodzielny)" hidden>
    <button class="dodaj">Dodaj</button></form></section>`;
function podepnijNpc() {
  const odswiez = zmiany => { zapiszProwincje(zmiany); kolorujMape(); pokazPanelGM(true); };
  glowny.querySelectorAll(".lista-npc li[data-id]").forEach(li => {
    const id = li.dataset.id, n = stan.npc[id];
    li.querySelectorAll("input, select, textarea").forEach(p => p.onchange = () => {
      const w = p.value.trim();
      if (p.name === "nazwa" && !w) { p.value = n.nazwa; return; }
      n[p.name] = w; if (!n.opis) delete n.opis;
      if (p.name === "rodzaj") {   // samodzielny: własny kolor (startowo ten, który miał), bez zwierzchnika; i odwrotnie
        if (w === "samodzielny") { n.kolor ??= kolorNpc(id); delete n.zwierzchnik; } else { delete n.kolor; n.zwierzchnik ??= stan.frakcje[0].id; }
      }
      ["zwierzchnik", "rodzaj"].includes(p.name) ? odswiez([["npc", id]]) : (zapiszProwincje([["npc", id]]), kolorujMape());   // zmiana zwierzchnika zmienia kolory kilku krajów
    });
    li.querySelector(".usun").onclick = () => {
      const ile = ileProwincji("npc:" + id);
      if (!confirm(`Usunąć kraj NPC „${n.nazwa}”?${ile ? ` Jego prowincje (${ile}) staną się ziemią niczyją.` : ""}`)) return;
      const zmiany = [["npc", id]];
      for (const [pid, d] of Object.entries(stan.prowincje || {})) if (d.wlasciciel === "npc:" + id) { delete d.wlasciciel; if (!Object.keys(d).length) delete stan.prowincje[pid]; zmiany.push(["p", pid]); }
      delete stan.npc[id]; odswiez(zmiany);
    };
  });
  const formNpc = glowny.querySelector(".dodaj-npc");
  formNpc.elements.rodzaj.onchange = () => { const sam = formNpc.elements.rodzaj.value === "samodzielny"; formNpc.elements.zwierzchnik.hidden = sam; formNpc.elements.kolor.hidden = !sam; };
  formNpc.onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.target), nazwa = d.get("nazwa").trim(); if (!nazwa) return;
    const baza = nazwa.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kraj";
    let id = baza, k = 2; while (stan.npc?.[id]) id = `${baza}-${k++}`;   // id stały — nie zmienia się przy zmianie nazwy
    (stan.npc ??= {})[id] = d.get("rodzaj") === "samodzielny" ? { nazwa, rodzaj: "samodzielny", kolor: d.get("kolor") } : { nazwa, rodzaj: d.get("rodzaj"), zwierzchnik: d.get("zwierzchnik") };
    odswiez([["npc", id]]);
    glowny.querySelector(".dodaj-npc input").focus();
  };
}
document.getElementById("panel-gm").onclick = () => widok === "gm" ? zamknijSzuflade() : pokazPanelGM();
if (PODGLAD) document.getElementById("panel-gm").hidden = true;   // telefon: tylko czytanie
document.getElementById("kronika").onclick = () => widok === "kronika" ? zamknijSzuflade() : pokazKronike();
document.getElementById("bloki").onclick = () => widok === "bloki" ? zamknijSzuflade() : pokazBloki();
// sprawy techniczne (logi, diagnostyka, porządki, kopie) — tylko admin (decyzja użytkownika: GM tego nie potrzebuje)
const jestAdmin = () => profil?.rola === "admin";
// logi: wczytywane na żądanie (oszczędność odczytów); stare kasowane przy logowaniu admina
const NAZWY_KOLEKCJI = { frakcje: "Frakcja", bohaterowie: "Bohater", gra: "Ustawienia gry", tajne_zasoby: "Zasoby", tajne_jednostki: "Jednostki",
  tajne_statusy: "Statusy bohaterów", notatki_gracza: "Notatki gracza", notatki_gm: "Notatki GM", uzytkownicy: "Konto", nazwy_osad: "Nazwy osad, prowincja" };
const opisSciezki = sc => {
  const [k, id] = sc.split("/"), nazwa = stan.frakcje.find(f => f.id === id)?.nazwa || stan.bohaterowie.find(h => h.id === id)?.imie || id;
  if (sc === "gra/prowincje") return "Prowincje";
  return k === "gra" ? NAZWY_KOLEKCJI.gra : `${NAZWY_KOLEKCJI[k] || k}: ${nazwa}`;
};
// pole z logu po ludzku: p.<id> → prowincja, npc.<id> → kraj NPC, a.<id> → akwen
const opisPola = p => p.replace(/^p\.([^.]+)/, (_, id) => `prowincja ${stan.prowincje?.[id]?.nazwa || id}`).replace(/^npc\.([^.]+)/, (_, id) => `kraj NPC ${stan.npc?.[id]?.nazwa || id}`)
  .replace(/^a\.([^.]+)/, (_, id) => `akwen ${stan.akweny?.[id]?.nazwa || id}`);
let logi = null, sprzatanie = null; // logi = ostatnio pobrana lista; sprzatanie = { czas, ile } z ostatniego automatycznego sprzątania
const logiSekcja = () => !CHMURA || !jestAdmin() ? "" : `<section class="logi"><h3>Logi zmian <span class="znacznik">tylko admin</span></h3>
  <p class="opis-sekcji">Każdy zapis zostawia mały wpis: kto, kiedy, co — i które pola zmienił (było → jest). Starsze wpisy kasują się same przy logowaniu admina${sprzatanie ? ` (ostatnio: ${sprzatanie.ile} usuniętych)` : ""}.</p>
  <form class="dni-logow"><label>Kasuj logi starsze niż <input name="dni" type="number" min="1" max="365" required value="${stan.ustawienia?.dniLogow ?? 30}"> dni</label>
    <button class="cofnij">Zapisz</button> <button type="button" class="dodaj" id="pokaz-logi">${logi ? "Odśwież" : "Pokaż ostatnie 50"}</button></form>
  ${logi ? `<ol class="lista-logow">${logi.map(l => `<li class="${l.typ === "blad" ? "blad-logu" : ""}"><time>${esc(new Date(l.czas).toLocaleString("pl-PL"))}</time>
    <b>${esc(l.email || "?")}</b> ${l.typ === "blad" ? `<span class="zmiana minus">błąd ${esc(l.kod || "")}</span>` : ""} ${esc((l.co || []).map(opisSciezki).join(", "))}
    ${l.zmiany?.length ? `<ul class="zmiany-logu">${l.zmiany.map(z => `<li><span>${esc(opisSciezki(z.d))} · ${esc(opisPola(z.p))}:</span> ${z.z ? `<del>${esc(z.z)}</del> → ` : ""}<ins>${esc(z.n)}</ins></li>`).join("")}</ul>` : ""}</li>`).join("")
    || "<li>Brak wpisów.</li>"}</ol>` : ""}</section>`;
function podepnijLogi() {
  const f = glowny.querySelector(".dni-logow"); if (!f) return;
  f.onsubmit = e => { e.preventDefault(); stan.ustawienia = { ...stan.ustawienia, dniLogow: Math.max(1, Math.min(365, +f.dni.value || 30)) }; zapisz(stan); pokazPanelGM(true); };
  glowny.querySelector("#pokaz-logi").onclick = async () => {
    try { logi = await ostatnieLogi(50); } catch (e) { alert("Nie udało się wczytać logów: " + komunikat(e)); return; }
    pokazPanelGM(true);
  };
}
// diagnostyka: limity darmowego planu Spark (dziennie, cały projekt) — liczniki sesji są tylko z tego okna
const SPARK = { zapisy: 20000, odczyty: 50000, miejsce: 1024 ** 3 };
const kb = b => b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 ** 2).toFixed(2)} MB`;
let diagnoza = null; // { liczby, czas } z ostatniego „Sprawdź bazę”
const diagnostykaSekcja = () => {
  if (!CHMURA || !jestAdmin()) return "";
  const roz = rozmiaryWczytanych(), suma = Object.values(roz).reduce((a, b) => a + b, 0);
  const proc = (n, max) => `${n} <small>(${(n / max * 100).toFixed(n / max < 0.01 ? 2 : 1)}% dziennego limitu)</small>`;
  return `<section class="diagnostyka"><h3>Diagnostyka <span class="znacznik">tylko admin</span></h3>
  <p class="opis-sekcji">Darmowy plan Firebase: ${SPARK.zapisy.toLocaleString("pl-PL")} zapisów i ${SPARK.odczyty.toLocaleString("pl-PL")} odczytów dziennie (na cały projekt), 1 GB danych.
    Dokładne zużycie całego projektu: konsola Firebase → Firestore → Użycie.</p>
  <dl class="fakty"><div><dt>Połączenie</dt><dd>${navigator.onLine ? "online" : "<b>offline</b> — zmiany wyślą się po powrocie sieci"}</dd></div>
    <div><dt>Zapisy w tej sesji</dt><dd>${proc(licznik.dokumenty, SPARK.zapisy)}, w ${licznik.zapisy} paczkach</dd></div>
    <div><dt>Odczyty w tej sesji (ok.)</dt><dd>${proc(licznik.odczyty, SPARK.odczyty)}</dd></div>
    <div><dt>Wczytane dane gry</dt><dd>${kb(suma)} <small>(${(suma / SPARK.miejsce * 100).toFixed(4)}% z 1 GB)</small></dd></div></dl>
  <p><button type="button" class="dodaj" id="sprawdz-baze">${diagnoza ? "Sprawdź ponownie" : "Policz dokumenty w bazie"}</button>
    ${diagnoza ? `<small class="opis-sekcji"> stan z ${esc(diagnoza.czas.toLocaleTimeString("pl-PL"))}</small>` : ""}</p>
  ${diagnoza ? `<table class="tabela-diag"><thead><tr><th>Kolekcja</th><th>Dokumentów</th><th>Wczytane dane</th></tr></thead><tbody>
    ${KOLEKCJE.map(k => `<tr><td>${esc(NAZWY_KOLEKCJI[k] || k)} <small>${k}</small></td><td>${diagnoza.liczby[k]}</td><td>${roz[k] ? kb(roz[k]) : "—"}</td></tr>`).join("")}</tbody></table>` : ""}
  <h4>Ostatnie błędy zapisu (ta sesja)</h4>
  ${licznik.bledy.length ? `<ol class="lista-logow">${licznik.bledy.map(b => `<li class="blad-logu"><time>${esc(new Date(b.czas).toLocaleTimeString("pl-PL"))}</time>
    <b>${esc(b.kod)}</b> ${esc(komunikat({ code: b.kod, message: b.opis }))} <small>${esc(b.co.map(opisSciezki).join(", "))}</small></li>`).join("")}</ol>` : `<p class="puste">Brak — wszystko zapisuje się poprawnie.</p>`}
  <p class="opis-sekcji">Błędy innych osób widać w „Logach zmian” (czerwone wpisy).</p></section>`;
};
function podepnijDiagnostyke() {
  const b = glowny.querySelector("#sprawdz-baze"); if (!b) return;
  b.onclick = async () => {
    b.disabled = true;
    try { diagnoza = { liczby: await policzDokumenty(), czas: new Date() }; } catch (e) { alert("Nie udało się policzyć: " + komunikat(e)); }
    pokazPanelGM(true);
  };
}
// porządki (admin): „Szukaj” niczego nie zmienia; usuwa dopiero „Wyczyść” po potwierdzeniu
let smieci = null; // { pozycje, wykonaj } albo { gotowe: tekst }
const porzadkiSekcja = () => !CHMURA || !jestAdmin() ? "" : `<section class="porzadki"><h3>Porządki <span class="znacznik">tylko admin</span></h3>
  <p class="opis-sekcji">Szuka niepotrzebnych danych, które zajmują miejsce w bazie. Najpierw pokazuje, co znalazł — nic nie usuwa bez potwierdzenia.</p>
  <p><button type="button" class="cofnij" id="szukaj-smieci">Szukaj śmieci</button></p>
  ${smieci?.gotowe ? `<p class="opis-sekcji">${esc(smieci.gotowe)}</p>` : smieci ? smieci.pozycje.length ? `<ul class="lista-smieci">${smieci.pozycje.map(p =>
    `<li><b>${p.ile}</b> — ${esc(p.opis)}${p.szczegoly?.length ? `<ul class="szczegoly-smieci">${p.szczegoly.slice(0, 60).map(t => `<li>${esc(t)}</li>`).join("")}${p.szczegoly.length > 60 ? `<li>… i ${p.szczegoly.length - 60} więcej</li>` : ""}</ul>` : ""}</li>`).join("")}</ul><p><button type="button" class="dodaj" id="wyczysc-smieci">Wyczyść (${smieci.pozycje.reduce((a, p) => a + p.ile, 0)})</button></p>`
    : `<p class="opis-sekcji">Czysto — nic do usunięcia.</p>` : ""}</section>`;
function podepnijPorzadki() {
  const szukaj = glowny.querySelector("#szukaj-smieci"); if (!szukaj) return;
  szukaj.onclick = async () => {
    szukaj.disabled = true;
    try { smieci = await szukajSmieci(); } catch (e) { alert("Nie udało się przeszukać bazy: " + komunikat(e)); }
    pokazPanelGM(true);
  };
  const wyczysc = glowny.querySelector("#wyczysc-smieci"); if (!wyczysc) return;
  wyczysc.onclick = async () => {
    if (!confirm("Usunąć znalezione śmieci? Tego nie da się cofnąć (chyba że z kopii zapasowej).")) return;
    wyczysc.disabled = true;
    try { await smieci.wykonaj(); smieci = { gotowe: "Gotowe — posprzątane." }; } catch (e) { alert("Sprzątanie przerwane: " + komunikat(e)); }
    pokazPanelGM(true);
  };
}
// kopia zapasowa (admin; w DEMO każdy): cała gra do pliku .json i z powrotem
const POLA_KOPII = ["frakcje", "bohaterowie", "zasoby", "tury", "ustawienia", "prowincje", "npc", "nazwyOsad"];   // starsze kopie nie mają prowincji — wtedy zostają obecne
const bezBraku = x => JSON.parse(JSON.stringify(x, (k, v) => k === "_brak" ? undefined : v));
const kopiaSekcja = () => CHMURA && !jestAdmin() ? "" : `<section class="kopia"><h3>Kopia zapasowa${CHMURA ? ` <span class="znacznik">tylko admin</span>` : ""}</h3>
  <p class="opis-sekcji">Pobiera całą grę (frakcje, bohaterów, zasoby, tury, jednostki, notatki) do pliku na dysk. Wczytanie kopii nadpisuje obecne dane gry — konta i role zostają bez zmian.</p>
  <p class="przyciski-tur"><button type="button" class="dodaj" id="pobierz-kopie">Pobierz kopię (.json)</button>
    <label class="cofnij wczytaj-plik">Wczytaj kopię…<input type="file" id="wczytaj-kopie" accept=".json,application/json" hidden></label></p></section>`;
function podepnijKopie() {
  const pobierz = glowny.querySelector("#pobierz-kopie"); if (!pobierz) return;
  pobierz.onclick = () => {
    const dane = { aplikacja: "fantasy-rp", wersja: pakiet.version, czas: new Date().toISOString(), ...bezBraku(Object.fromEntries(POLA_KOPII.map(k => [k, stan[k]]))) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dane, null, 1)], { type: "application/json" }));
    a.download = `fantasy-rp_kopia_${dane.czas.slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  glowny.querySelector("#wczytaj-kopie").onchange = async e => {
    const plik = e.target.files[0]; e.target.value = ""; if (!plik) return;
    let d;
    try { if (plik.size > 10e6) throw 0; d = JSON.parse(await plik.text()); } catch { return alert("To nie jest poprawny plik kopii."); }
    const dobra = d?.aplikacja === "fantasy-rp" && ["frakcje", "bohaterowie", "zasoby", "tury"].every(k => Array.isArray(d[k]))
      && d.frakcje.every(f => typeof f?.id === "string" && typeof f?.nazwa === "string") && d.bohaterowie.every(h => typeof h?.id === "string")
      && (d.prowincje === undefined || (typeof d.prowincje === "object" && !Array.isArray(d.prowincje)));
    if (!dobra) return alert("Ten plik nie wygląda na kopię Fantasy RP.");
    if (!confirm(`Wczytać kopię z ${new Date(d.czas).toLocaleString("pl-PL")}? Obecne dane gry zostaną nadpisane (${d.frakcje.length} frakcji, ${d.bohaterowie.length} bohaterów).`)) return;
    Object.assign(stan, Object.fromEntries(POLA_KOPII.filter(k => d[k] !== undefined).map(k => [k, d[k]])));
    zapiszWszystko(stan); alert("Kopia wczytana."); pokazPanelGM(true); zbudujListe();
  };
}
// użytkownicy: admin nadaje każdą rolę; GM tylko oczekujący/gracz/obserwator i nie rusza kont GM/admin; własnej roli nikt nie zmienia
// państwo: gracz, GM i admin mogą grać jakimś państwem; admin wybiera je też sobie (we własnym wierszu tylko państwo)
const ROLE_GM = ["oczekujacy", "gracz", "obserwator"], ROLE_Z_PANSTWEM = ["gracz", "gm", "admin"];
let uzytkownicy = [], odpiecieUzytkownikow = () => {};
function sluchajUzytkownikowJesliGM() {
  odpiecieUzytkownikow(); odpiecieUzytkownikow = () => {}; uzytkownicy = [];
  if (gm && CHMURA) odpiecieUzytkownikow = sluchajUzytkownikow(l => { uzytkownicy = l; if (widok === "gm") odswiezWidok(); }, e => console.error(e));
}
function uzytkownicySekcja() {
  if (!CHMURA) return "";
  const admin = profil.rola === "admin";
  const lista = [...uzytkownicy].sort((a, b) => (a.rola !== "oczekujacy") - (b.rola !== "oczekujacy") || a.email.localeCompare(b.email));
  return `<section><h3>Użytkownicy</h3><p class="opis-sekcji">Nowe konta czekają jako „Oczekujący”, dopóki nie nadasz im roli.${admin ? "" : " Role GM i admin nadaje admin."}</p>
    <ul class="uzytkownicy">${lista.map(u => {
      const ja = u.uid === zalogowany.uid, wolno = !ja && (admin || (ROLE_GM.includes(u.rola)));
      const role = wolno ? (admin ? Object.keys(ROLE) : ROLE_GM) : [u.rola];
      const panstwo = ROLE_Z_PANSTWEM.includes(u.rola) && (wolno || (ja && admin));
      return `<li data-uid="${esc(u.uid)}" class="${u.rola === "oczekujacy" ? "czeka" : ""}"><span class="kto"><b>${esc(u.nazwa || u.email)}${ja ? " (Ty)" : ""}</b>${u.nazwa ? `<small>${esc(u.email)}</small>` : ""}</span>
        <select name="rola"${wolno ? "" : " disabled"} aria-label="Rola: ${esc(u.email)}">${role.map(r => `<option value="${r}"${r === u.rola ? " selected" : ""}>${ROLE[r]}</option>`).join("")}</select>
        <select name="frakcja"${panstwo ? "" : " disabled"} aria-label="Państwo: ${esc(u.email)}"><option value="">— bez państwa —</option>
          ${stan.frakcje.map(f => `<option value="${f.id}"${f.id === u.frakcja ? " selected" : ""}>${esc(f.nazwa)}</option>`).join("")}</select></li>`;
    }).join("") || `<li class="puste">Ładowanie…</li>`}</ul></section>`;
}
function podepnijUzytkownikow() {
  glowny.querySelectorAll(".uzytkownicy li[data-uid]").forEach(li => li.onchange = () => {
    const rola = li.querySelector("[name=rola]").value, frakcja = li.querySelector("[name=frakcja]").value;
    const zmiany = li.dataset.uid === zalogowany.uid ? { frakcja } : { rola, frakcja: ROLE_Z_PANSTWEM.includes(rola) ? frakcja : "" };
    const email = (li.querySelector(".kto small") || li.querySelector(".kto b")).textContent, f = stan.frakcje.find(x => x.id === (zmiany.frakcja ?? ""));
    ustawUzytkownika(li.dataset.uid, zmiany, `${email} → ${ROLE[zmiany.rola] || "państwo"}${f ? ", " + f.nazwa : ""}`)
      .catch(e => { alert("Nie udało się zmienić roli: " + komunikat(e)); odswiezWidok(); });
  });
}
function przelacz(doAplikacji) {
  if (!doAplikacji) zakonczSamouczek();
  document.getElementById("menu").hidden = doAplikacji; document.getElementById("aplikacja").hidden = !doAplikacji;
  sala.reczny = doAplikacji; // pauza animacji sali, gdy jej nie widać
  doAplikacji ? clearInterval(timer) : restart();
}
// zmiany od innych osób: przerysuj otwarty widok, ale nie w trakcie pisania (po wyjściu z pola)
let czekaOdswiezenie = false;
function odswiezWidok() {
  const pole = document.activeElement;
  if (glowny.contains(pole) && /^(INPUT|TEXTAREA|SELECT)$/.test(pole.tagName)) {
    if (!czekaOdswiezenie) { czekaOdswiezenie = true; pole.addEventListener("blur", () => { czekaOdswiezenie = false; setTimeout(odswiezWidok); }, { once: true }); }
    return;
  }
  zbudujListe(); kolorujMape(); pokazOsadyNaMapie();
  if (wczytane && !document.getElementById("aplikacja").hidden) pokazNowaOpowiesc();   // też gdy otwarta jest sama mapa (widok null)
  if (widok === null) return; // jeszcze w Sali Tronów
  if (okno.open && !okno.querySelector("form.edycja")) okno.close(); // okno bohatera mogło dostać nieaktualne dane; formularza w trakcie pisania nie zamykamy
  oznaczKronike(false);
  if (widok === "kronika") return pokazKronike();
  if (widok === "bloki") return pokazBloki();
  if (widok.startsWith("p:")) return pokazProwincje(+widok.slice(2), true);
  if (widok.startsWith("a:")) return pokazAkwen(+widok.slice(2));
  widok === "gm" ? (gm ? pokazPanelGM(true) : zamknijSzuflade()) : wybierz(widok, true);
}
// pokazy samouczka (8.1) — tylko w piaskownicy (rozdział z `piaskownica: true`): wszystko na kopii stanu, po rozdziale znika.
// Baza pokazu: prowincja własnej krainy nad morzem (gdy jej nie ma — przypisana na niby), sąsiad, do którego da się dojść, i wróg obok.
const ID_POKAZU = { armia: "zgrzyt-a1", wrog: "zgrzyt-a2", flota: "zgrzyt-f1", traktat: "zgrzyt-t1", sojusz: "zgrzyt-t2", blok: "zgrzyt-b1" };
const odSrodka = p => Math.hypot(p.x - 2500, p.y - 2500);
const nadMorzem = nr => AKWENY.some(a => a.typ === "morze" && a.brzeg.includes(nr));
function bazaPokazu() {
  const f = AKCJE_SAMOUCZKA.mojaFrakcja(), moja = q => stan.prowincje?.[q.id]?.wlasciciel === f.id;
  const wrog = stan.frakcje.find(x => x.id !== f.id && !x._brak?.armie) || stan.frakcje.find(x => x.id !== f.id);
  const miejsce = (kto, q) => ({ f: kto.id, p: q.id, o: -1 });
  // sąsiad o JEDEN krok w obie strony (krasnoludy przejdą góry, wróg nie — przy objeździe armie by się nie spotkały)
  const sasiadDla = q => q.sasiedzi.map(([j]) => PROWINCJE[j - 1]).find(n => wyznaczTrase(f, miejsce(f, q), { p: n.id, o: -1 })?.length === 1
    && (!wrog || wyznaczTrase(wrog, miejsce(wrog, n), { p: q.id, o: -1 })?.length === 1));
  const kandydaci = [...PROWINCJE.filter(q => moja(q) && nadMorzem(NR_PROWINCJI.get(q.id))),   // najpierw własne nad morzem, potem wolne (na niby) od środka świata
    ...PROWINCJE.filter(q => !stan.prowincje?.[q.id]?.wlasciciel && nadMorzem(NR_PROWINCJI.get(q.id)) && q.sasiedzi.length >= 2).sort((a, b) => odSrodka(a) - odSrodka(b))];
  const baza = kandydaci.find(sasiadDla) || kandydaci[0];
  if (!moja(baza)) (stan.prowincje ??= {})[baza.id] = { ...stan.prowincje?.[baza.id], wlasciciel: f.id };
  return { f, baza, start: miejsce(f, baza), sasiad: sasiadDla(baza), wrog };
}
const POKAZY = {
  pokazJednostki: () => {
    const f = AKCJE_SAMOUCZKA.mojaFrakcja(), j = f.jednostki ??= [];
    if (!j.some(x => !x.morska)) j.push({ nazwa: "Psy Wojny", poziom: 1, opis: "Lekka piechota na niby — przykład Zgrzyta." }, { nazwa: "Gryzące Topory", poziom: 2, opis: "Weterani na niby." });
    if (!j.some(x => x.morska)) j.push({ nazwa: "Łajba", poziom: 1, morska: true, opis: "Okręt na niby." });
    wybierz(f.id, true);
  },
  pokazArmie: () => {
    POKAZY.pokazJednostki();
    const { f, start, baza } = bazaPokazu(), j = f.jednostki.filter(x => !x.morska);
    if (!f.armie?.some(a => a.id === ID_POKAZU.armia)) {
      (f.armie ??= []).push({ id: ID_POKAZU.armia, nazwa: "Zgrzytowe Psy", dowodca: "", pospolity: "Zgrzyt", bohaterowie: [],
        oddzialy: [{ jednostka: j[0].nazwa, liczba: 320 }, { jednostka: (j[1] || j[0]).nazwa, liczba: 180 }] });
      (stan.pozycjeArmii ??= {})[ID_POKAZU.armia] = start;
    }
    wybierz(f.id, true); pokazOsadyNaMapie(); mapa.pokaz(baza.x, baza.y, 0.9);
  },
  pokazCel: () => {
    const { f, sasiad } = bazaPokazu(), a = f.armie.find(x => x.id === ID_POKAZU.armia);
    if (a && sasiad) a.cel = { p: sasiad.id, o: -1 };
    zamknijSzuflade(); pokazOsadyNaMapie(); if (sasiad) mapa.pokaz(sasiad.x, sasiad.y, 0.8);
  },
  // koniec tury na niby: tylko armie z pokazu robią krok swojej trasy (jak ruchArmii), potem wykrywanie bitew jak w grze
  pokazTure: () => {
    const stare = structuredClone(stan.pozycjeArmii || {});
    for (const f of stan.frakcje) for (const a of f.armie || []) {
      if (![ID_POKAZU.armia, ID_POKAZU.wrog].includes(a.id) || !a.cel) continue;
      const tr = trasaArmii(f, a), poz = stan.pozycjeArmii[a.id]; if (!tr?.length) continue;
      a.przebyte = [...(a.przebyte || []), { p: poz.p, o: poz.o }]; stan.pozycjeArmii[a.id] = { f: poz.f, p: tr[0].p, o: tr[0].o };
    }
    wykryjBitwy(stare, stan.tury.length + 1); pokazOsadyNaMapie();
  },
  pokazFlote: () => {
    const { f } = bazaPokazu(), a = akwenStartu(f); if (!a) return;
    if (!f.floty?.some(x => x.id === ID_POKAZU.flota)) {
      const m = f.jednostki.find(x => x.morska);
      (f.floty ??= []).push({ id: ID_POKAZU.flota, nazwa: "Zgrzytowa Łajba", dowodca: "", pospolity: "Zgrzyt", bohaterowie: [], oddzialy: [{ jednostka: m.nazwa, liczba: 3 }] });
      (stan.pozycjeFlot ??= {})[ID_POKAZU.flota] = { f: f.id, a };
      const cel = AKWENY[a - 1].sasiedzi.find(([, t]) => t === "morze")?.[0];
      if (cel) f.floty.find(x => x.id === ID_POKAZU.flota).cel = cel;
    }
    pokazOsadyNaMapie(); mapa.pokaz(AKWENY[a - 1].x, AKWENY[a - 1].y, 0.6);
  },
  // wróg na niby w sąsiedniej prowincji, wojna między krajami; przy turze obie armie mijają się na granicy = bitwa (wykrywanie jak w grze)
  pokazWroga: () => {
    POKAZY.pokazArmie();
    const { f, baza, sasiad, wrog } = bazaPokazu(), a = f.armie.find(x => x.id === ID_POKAZU.armia);
    if (!sasiad || !wrog) return;
    stan.pozycjeArmii[ID_POKAZU.armia] = { f: f.id, p: baza.id, o: -1 }; a.cel = null; a.przebyte = [];
    if (!wrog.armie?.some(x => x.id === ID_POKAZU.wrog))
      (wrog.armie ??= []).push({ id: ID_POKAZU.wrog, nazwa: "Banda Złodziei Kości", dowodca: "", pospolity: "Kościożer", bohaterowie: [], oddzialy: [{ jednostka: "Rabusie", liczba: 260 }] });
    stan.pozycjeArmii[ID_POKAZU.wrog] = { f: wrog.id, p: sasiad.id, o: -1 };
    if (!wWojnie(f.id, wrog.id)) (stan.wojny ??= []).push([f.id, wrog.id]);
    wybierz(f.id, true); pokazOsadyNaMapie(); mapa.pokaz((baza.x + sasiad.x) / 2, (baza.y + sasiad.y) / 2, 0.9);
  },
  pokazStarcie: () => {
    const { f, baza, sasiad, wrog } = bazaPokazu(); if (!sasiad || !wrog) return;
    f.armie.find(x => x.id === ID_POKAZU.armia).cel = { p: sasiad.id, o: -1 };
    wrog.armie.find(x => x.id === ID_POKAZU.wrog).cel = { p: baza.id, o: -1 };
    zamknijSzuflade(); POKAZY.pokazTure(); mapa.pokaz(sasiad.x, sasiad.y, 0.9);
  },
  wrog: () => bazaPokazu().wrog?.nazwa || "wrogów",
  traktat: id => { const t = stan.traktaty?.[id], f = AKCJE_SAMOUCZKA.mojaFrakcja(); return nazwaKraju(t?.strony.find(w => w !== f.id)) || "?"; },
  // opowieść Zgrzyta na niby (13.7): wymyślona wojna i wygrana własnej krainy + szept — nic nie trafia do bazy ani do stanu
  pokazOpowiesc: () => {
    const f = AKCJE_SAMOUCZKA.mojaFrakcja(), w = stan.frakcje.find(x => x.id !== f.id), nr = stan.tury.length + 1;
    const kraje = Object.fromEntries([f, w].map(k => [k.id, { nazwa: k.nazwa, wladca: k.wladca, id: k.id }]));
    const o = opowiedz({ tura: nr, ziarno: 7, kraje, zdarzenia: [
      { typ: "wojna", d: { A: w.id, B: f.id }, kraje: [] },
      { typ: "wynik", d: { A: f.id, przegrani: [w.id], miejsce: "w prowincji „Psia Polana”" }, kraje: [] },
      { typ: "gm", tajny: true, widza: [f.id], d: { tekst: "Zgrzyt zakopał w twojej stolicy kość. Nikomu ani słowa" }, kraje: [] }] });
    zamknijSzuflade(); pokazOpowiesc(oknoOpowiesci, { tura: nr, akapity: o.akapity, szept: o.szepty[f.id] }, otworzOkno);
  },
  pokazWykresy: () => { if (!historiaPokazu) zmyslHistorie(); wybierz(AKCJE_SAMOUCZKA.mojaFrakcja().id, true); },
  pokazTimelapse: async () => { if (!historiaPokazu) zmyslHistorie(); zamknijSzuflade(); await pokazTimelapse(); oknoTimelapse.querySelector("[data-tl=graj]")?.click(); },
  bitwaPokazu: () => aktywneBitwy().find(([, b]) => b.armie?.includes(ID_POKAZU.armia))?.[0],
  pokazEkranBitwy: () => { const id = POKAZY.bitwaPokazu(); if (id) return pokazBitwe(id); },
  // przykładowe traktaty (umowa handlowa i sojusz) między stolicami — prowincje i stolice krain na niby, gdy ich nie mają
  pokazTraktaty: () => {
    const { f, baza, wrog } = bazaPokazu(), inni = stan.frakcje.filter(x => x.id !== f.id && x.id !== wrog?.id);
    const zaloz = (kraj, p) => {
      if (!p || stolicaWl(kraj.id)) return;
      const d = (stan.prowincje ??= {})[p.id] = { ...stan.prowincje[p.id], wlasciciel: kraj.id };
      d.osady = [{ ...(d.osady?.[0] || p.osady?.[0] || { x: p.x, y: p.y }), typ: "stolica" }];
    };
    zaloz(f, baza);
    const wolne = PROWINCJE.filter(q => !stan.prowincje?.[q.id]?.wlasciciel && odSrodka(q) < 1800).sort((a, b) => Math.hypot(b.x - baza.x, b.y - baza.y) - Math.hypot(a.x - baza.x, a.y - baza.y));
    const handlarz = inni[0] || wrog, sojusznik = inni[1] || wrog;
    zaloz(handlarz, wolne[0]);
    zaloz(sojusznik, wolne.find(q => Math.hypot(q.x - wolne[0].x, q.y - wolne[0].y) > 900) || wolne[1]);
    const tura = stan.tury.length + 1;
    (stan.traktaty ??= {})[ID_POKAZU.traktat] = { nazwa: "Pakt Kości i Miski", typ: "handel", strony: [f.id, handlarz.id], tajny: false, opis: "Zgrzyt daje kości, dostaje miskę. Na niby.", tura };
    stan.traktaty[ID_POKAZU.sojusz] = { nazwa: "Sojusz Wiecznego Ogryzka", typ: "sojusz", strony: [f.id, sojusznik.id], tajny: false, opis: "Razem przeciw głodowi. Na niby.", tura };
    AKCJE_SAMOUCZKA.warstwa("szlaki", true); AKCJE_SAMOUCZKA.warstwa("sojusze", true);
    zamknijSzuflade(); kolorujMape(); pokazOsadyNaMapie(); mapa.wypelnij(baza.x, baza.y);
  },
  pokazBlok: () => {
    const { f } = bazaPokazu(), inni = stan.frakcje.filter(x => x.id !== f.id).slice(0, 3).map(x => x.id);
    (stan.bloki ??= {})[ID_POKAZU.blok] = { nazwa: "Liga Pełnej Miski", skrot: "LPM", rodzaj: "liga", kolor: "#c9a24a", opis: "Statut: każdy członek dzieli się kośćmi. Na niby.",
      czlonkowie: [f.id, inni[0]], zaproszeni: [inni[1]], widza: [f.id, inni[0], inni[1]], tajny: false, tryb: "glosowanie", lider: f.id, traktaty: ["handel"], tura: stan.tury.length + 1,
      wnioski: { w1: { typ: "zapros", dane: { kraj: inni[2] || inni[1] }, autor: f.id, za: [f.id], przeciw: [], tura: stan.tury.length + 1 } } };
    pokazBloki();
  },
};
// samouczek (8.1): akcje, którymi Zgrzyt „klika” za gracza; sprzatnij cofa to, co pozmieniał w widoku (warstwy nie trafiają do localStorage)
let warstwyPrzedSamouczkiem = null;
const AKCJE_SAMOUCZKA = {
  gm: () => gm,
  zamknij: () => { zamknijSzuflade(); for (const d of [okno, oknoBitwy, oknoTimelapse, oknoOpowiesci, oknoGrafiki]) if (d.open) d.close(); },
  mojaFrakcja: () => frakcjaPo(profil?.frakcja) || stan.frakcje[0],
  frakcja: id => wybierz(id || AKCJE_SAMOUCZKA.mojaFrakcja().id),
  pokazMojaProwincje: () => {
    const f = AKCJE_SAMOUCZKA.mojaFrakcja(), k = Math.max(0, PROWINCJE.findIndex(p => stan.prowincje?.[p.id]?.wlasciciel === f?.id)), p = PROWINCJE[k];
    pokazProwincje(k + 1); mapa.pokaz(p.x, p.y, 0.6);
  },
  warstwa: (k, wl) => { warstwyPrzedSamouczkiem ??= { ...warstwy }; warstwy[k] = wl; pokazPrzyciskiWarstw(); pokazOsadyNaMapie(); },
  kronika: () => pokazKronike(), bloki: () => pokazBloki(), panelGM: () => pokazPanelGM(),
  // mapa na cały ekran wokół własnej krainy (albo środka świata); przesuwanie i kółko spod warstwy samouczka
  pelnaMapa: () => {
    const f = AKCJE_SAMOUCZKA.mojaFrakcja(), p = PROWINCJE.find(q => stan.prowincje?.[q.id]?.wlasciciel === f?.id);
    p ? mapa.wypelnij(p.x, p.y) : mapa.wypelnij();
  },
  przesunMape: (dx, dy) => mapa.przesun(dx, dy), przyblizMape: (k, x, y) => mapa.przybliz(k, x, y),
  // sekcja z nagłówkiem zaczynającym się od tytułu: w otwartym oknie, a jeśli go nie ma — na karcie w szufladzie
  sekcja: tytul => {
    const w = [okno, oknoBitwy].find(d => d.open) || glowny;
    return [...w.querySelectorAll("h3, h4, legend, dt")].find(h => h.textContent.trim().startsWith(tytul))?.closest("section, fieldset, div, li") || null;
  },
  element: sel => ([okno, oknoBitwy].find(d => d.open) || glowny).querySelector(sel),
  bohater: () => {
    const f = AKCJE_SAMOUCZKA.mojaFrakcja(), h = stan.bohaterowie.filter(x => x.frakcja === f.id).sort((a, b) => b.wladca - a.wladca)[0];
    if (h) pokazBohatera(h, f);
  },
  akwen: () => {   // morze najbliżej środka świata (Akwen 1 leży w rogu mapy)
    const a = AKWENY.filter(x => x.typ !== "jezioro").sort((p, q) => Math.hypot(p.x - 2500, p.y - 2500) - Math.hypot(q.x - 2500, q.y - 2500))[0] || AKWENY[0];
    pokazAkwen(AKWENY.indexOf(a) + 1); mapa.pokaz(a.x, a.y, 0.5);
  },
  // Zgrzyt przekręca nazwy (charakter z wywiadu 2026-10-20); nieznane zostają bez zmian
  przekrec: n => PRZEKRECONE[n]?.[0] || n,
  znacznik: nazwa => [...document.querySelectorAll("#mapa .osada")].find(el => el.title.includes(nazwa)) || null,
  ...POKAZY,
  sprzatnij: () => {
    historiaPokazu = null;
    AKCJE_SAMOUCZKA.zamknij();
    if (warstwyPrzedSamouczkiem) { warstwy = warstwyPrzedSamouczkiem; warstwyPrzedSamouczkiem = null; pokazPrzyciskiWarstw(); pokazOsadyNaMapie(); }
  },
};
const apiSamouczka = { akcje: AKCJE_SAMOUCZKA, gm: () => gm, odswiez: () => odswiezWidok() };
document.getElementById("samouczek-przycisk").onclick = () => otworzSamouczek(apiSamouczka);
if (PODGLAD) document.getElementById("samouczek-przycisk").hidden = true;   // telefon: bez samouczka (decyzja użytkownika)
// pierwsze wejście: Zgrzyt proponuje oprowadzenie, gdy nic nie zasłania (okno „Co nowego” najpierw)
function proponujSamouczek() {
  if (PODGLAD) return;
  if (oknoZmian.open) return oknoZmian.addEventListener("close", () => setTimeout(proponujSamouczek, 400), { once: true });
  zaproponujSamouczek(apiSamouczka);
}
function wejdz() {
  if (aktualizacjaBlokuje()) return;
  zamknijSzuflade(); zbudujListe(); przeniesStareProwincje(); kolorujMape(); pokazPrzyciskiWarstw(); pokazOsadyNaMapie(); przelacz(true); oznaczKronike(false); setTimeout(pokazNoweBitwy, 1500); setTimeout(pokazNowaOpowiesc, 2200); setTimeout(proponujSamouczek, 1000);   // start: sama mapa, karty otwiera klik w herb
}
const blad = document.getElementById("blad-logowania");
const pokazBlad = (t, info) => { blad.textContent = t; blad.hidden = !t; blad.classList.toggle("info", Boolean(info)); };
const KOMUNIKATY = {
  "auth/invalid-credential": "Zły e-mail albo hasło. Nie masz konta? Kliknij „Załóż konto”.",
  "auth/invalid-email": "To nie wygląda na adres e-mail.",
  "auth/email-already-in-use": "Konto z tym e-mailem już istnieje — zaloguj się.",
  "auth/weak-password": "Hasło musi mieć co najmniej 6 znaków.",
  "auth/too-many-requests": "Za dużo prób. Odczekaj chwilę.",
  "auth/popup-closed-by-user": "",
  "auth/network-request-failed": "Brak połączenia z internetem.",
  "permission-denied": "To konto nie ma jeszcze dostępu do gry.",
};
const komunikat = e => KOMUNIKATY[e.code] ?? `Coś poszło nie tak (${e.code || e.message}).`;
ustawBladZapisu(e => alert("Nie udało się zapisać zmian: " + komunikat(e)));
const formularz = document.getElementById("logowanie");
// bez autouzupełniania loginu i hasła przez przeglądarkę (prośba użytkownika): pola są readonly do pierwszego dotknięcia, a takie menedżer haseł pomija
formularz.querySelectorAll("#mail, #haslo").forEach(p => { const odblokuj = () => { p.readOnly = false; }; p.addEventListener("pointerdown", odblokuj); p.addEventListener("focus", odblokuj); });
if (!CHMURA) {
  wczytaj();
  formularz.onsubmit = e => { e.preventDefault(); wejdz(); };
} else {
  document.getElementById("tryb").textContent = "";
  document.getElementById("zaloz-konto").hidden = false;
  const zajety = b => formularz.querySelectorAll("button").forEach(x => x.disabled = b);
  // po zalogowaniu wchodzimy do gry dopiero, gdy dane są wczytane (wejdzPoWczytaniu)
  const sprobuj = async akcja => { pokazBlad(""); zajety(true); wejdzPoWczytaniu = true; try { await akcja(); } catch (e) { wejdzPoWczytaniu = false; pokazBlad(komunikat(e)); } finally { zajety(false); } };
  formularz.onsubmit = e => {
    e.preventDefault();
    if (!zalogowany) return sprobuj(() => zaloguj(formularz.mail.value.trim(), formularz.haslo.value));
    wczytane ? wejdz() : wejdzPoWczytaniu = true;
  };
  document.getElementById("zaloz-konto").onclick = () => {
    if (!formularz.reportValidity()) return;
    sprobuj(() => zalozKonto(formularz.mail.value.trim(), formularz.haslo.value));
  };
  document.getElementById("google").onclick = () => sprobuj(zalogujGoogle);
  document.getElementById("wyloguj").onclick = async () => { await wyloguj(); przelacz(false); };
}
let zalogowany = null, profil = null, wczytane = false, wejdzPoWczytaniu = false, odpiecieProfilu = () => {};
naZmianeKonta(async user => {
  zalogowany = user; wczytane = false; odpiecieProfilu(); profil = null;
  if (!CHMURA) return;
  formularz.classList.toggle("zalogowany", Boolean(user));
  document.getElementById("wyloguj").hidden = !user;
  if (!user) { widok = null; gm = false; sluchajUzytkownikowJesliGM(); odpieciePropozycji(); propozycje = []; odpiecieObecnosci(); obecnosc = {}; oznaczObecnosc(); document.getElementById("konto-mail").textContent = ""; return; }
  try {
    profil = await mojProfil(user); await ustawRole();
    // rola nadana albo zmieniona przez admina działa od razu, bez przeładowania
    odpiecieProfilu = sluchajProfilu(user.uid, p => {
      const inna = p.rola !== profil.rola || p.frakcja !== profil.frakcja; profil = p;
      if (inna) ustawRole().catch(e => pokazBlad(komunikat(e)));
    });
  } catch (e) { pokazBlad(komunikat(e)); await wyloguj(); }
});
async function ustawRole() {
  const gmRola = ["admin", "gm"].includes(profil.rola);
  gm = gmRola && !PODGLAD;   // podgląd na telefon: GM czyta wszystko (dostęp), ale bez Panelu GM i edycji
  ustawDostep({ gm: gmRola, frakcja: profil.frakcja || "" });
  document.getElementById("konto-mail").textContent = `${zalogowany.email} · ${ROLE[profil.rola] || profil.rola}`;
  document.getElementById("panel-gm").hidden = !gm;
  sluchajUzytkownikowJesliGM();
  if (profil.rola === "oczekujacy") {
    odlacz(); wczytane = false; widok = null; przelacz(false);
    pokazBlad("Konto czeka na przyjęcie przez admina. Wejdziesz, gdy nada Ci rolę — ta strona sama to wykryje.", true);
    return;
  }
  pokazBlad(""); sluchajPropozycjiDlaRoli();
  zglosObecnosc(zalogowany.uid, profil.frakcja);   // też po zmianie państwa przez admina (nowy wpis „online” z nową frakcją)
  odpiecieObecnosci(); odpiecieObecnosci = sluchajObecnosci(o => { obecnosc = o; oznaczObecnosc(); });
  if (wczytane) return odswiezWidok();
  await polacz(odswiezWidok); wczytane = true;
  if (jestAdmin() && !PODGLAD) {
    sprzatnijLogi(stan.ustawienia?.dniLogow ?? 30).then(ile => { sprzatanie = { czas: new Date(), ile }; }).catch(e => console.warn("sprzątanie logów", e));
    sprzatnijPropozycje(7).catch(e => console.warn("sprzątanie propozycji", e)); // rozpatrzone po 7 dniach (decyzja użytkownika)
  }
  if (wejdzPoWczytaniu) { wejdzPoWczytaniu = false; wejdz(); } // zapamiętana sesja: zostajemy w Sali Tronów
}
document.getElementById("wyjdz").onclick = () => przelacz(false);
// „Co nowego” raz po pierwszym uruchomieniu nowej wersji; bez zapamiętanej wersji (nowa instalacja albo 0.1.1 bez tej funkcji) tylko wpis bieżącej
const nowsza = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); const i = x.findIndex((v, k) => v !== y[k]); return i >= 0 && x[i] > y[i]; };
const oknoZmian = document.getElementById("zmiany");
function coNowego() {
  let byla = null; try { byla = localStorage.getItem("wersja"); localStorage.setItem("wersja", pakiet.version); } catch {}
  if (byla === pakiet.version) return;
  // wszystkie wersje od ostatnio widzianej do bieżącej (kilka aktualizacji naraz → jedna pełna lista, najnowsze na górze);
  // bez zapamiętanej wersji (aktualizacja ze starej wersji bez tego okienka, wyczyszczone dane) — cała historia
  const wpisy = ZMIANY.filter(z => z.zmiany.length && !nowsza(z.wersja, pakiet.version) && (!byla || nowsza(z.wersja, byla)));
  if (!wpisy.length) return;
  pokazZmiany(wpisy, wpisy.length > 1 ? (byla ? `zmiany od wersji ${esc(byla)} do ${esc(pakiet.version)}` : `wszystkie zmiany do wersji ${esc(pakiet.version)}`) : `wersja ${esc(pakiet.version)}`);
}
// przycisk „Co nowego” przy logowaniu: cała historia do bieżącej wersji (puste wpisy niewydanej wersji pominięte)
document.getElementById("pokaz-zmiany").onclick = () => pokazZmiany(ZMIANY.filter(z => z.zmiany.length && !nowsza(z.wersja, pakiet.version)), `wszystkie zmiany do wersji ${esc(pakiet.version)}`);
function pokazZmiany(wpisy, od) {
  oknoZmian.innerHTML = `<div class="okno-glowa"><div><h2>Co nowego</h2><p class="rasa">${od}</p></div><button type="button" class="zamknij" aria-label="Zamknij">×</button></div>`
    + wpisy.map(z => `<h3>Wersja ${esc(z.wersja)} <span>${esc(z.data)}</span></h3><ul>${z.zmiany.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`).join("");
  oknoZmian.querySelector(".zamknij").onclick = () => oknoZmian.close();
  oknoZmian.showModal();
}
// aktualizacje (tylko program na komputer, window.aktualizacje z electron/preload.cjs) — obowiązkowe:
// znaleziona nowsza wersja (przy starcie albo w sprawdzaniu co 15 min) zasłania cały program nakładką, dopóki gracz nie zaktualizuje;
// przy starcie samo sprawdzanie tylko blokuje logowanie; brak sieci/GitHuba i sprawdzanie dłuższe niż 10 s nie blokują
const NAKLADKA = ["dostepna", "pobieram", "instaluje", "blad-pobierania"];
let aktualizacja = { stan: "brak" };
const aktualizacjaBlokuje = () => aktualizacja.stan === "sprawdzam" || NAKLADKA.includes(aktualizacja.stan);
function pokazAktualizacje(s) {
  aktualizacja = s;
  const w = esc(s.wersja || ""), nakladka = document.getElementById("nakladka-aktualizacji"), pelna = NAKLADKA.includes(s.stan);
  formularz.querySelectorAll("input, button").forEach(x => x.disabled = aktualizacjaBlokuje());
  const pasek = document.getElementById("aktualizacja");
  pasek.hidden = s.stan !== "sprawdzam"; pasek.textContent = "Sprawdzam, czy jest nowsza wersja…";
  // reszta programu nieklikalna i niedostępna z klawiatury, otwarte okna zamknięte (okno dialogowe byłoby nad nakładką)
  ["menu", "aplikacja"].forEach(id => document.getElementById(id).inert = pelna);
  if (pelna) [okno, oknoZmian].forEach(o => o.open && o.close());
  nakladka.hidden = !pelna;
  document.getElementById("nakladka-tresc").innerHTML = {
    dostepna: `<p>Jest nowa wersja <b>${w}</b>. Gra wymaga aktualizacji — do tego czasu nie można z niej korzystać.</p><button type="button" class="wejdz" id="aktualizuj">Aktualizuj</button>`,
    pobieram: `<p>Pobieram wersję <b>${w}</b>… ${s.procent ?? 0}%</p><progress max="100" value="${s.procent ?? 0}"></progress>`,
    instaluje: `<p>Instaluję wersję <b>${w}</b> — program sam uruchomi się ponownie.</p>`,
    "blad-pobierania": `<p>Nie udało się pobrać aktualizacji. Sprawdź internet i spróbuj jeszcze raz.</p><button type="button" class="wejdz" id="aktualizuj">Spróbuj ponownie</button>`,
  }[s.stan] || "";
  const b = document.getElementById("aktualizuj");
  if (b) { b.onclick = () => { b.disabled = true; window.aktualizacje.pobierz(); }; b.focus(); }
}
if (window.aktualizacje) {
  window.aktualizacje.naZmiane(pokazAktualizacje);
  window.aktualizacje.stan().then(pokazAktualizacje);
  setTimeout(() => { if (aktualizacja.stan === "sprawdzam") pokazAktualizacje({ stan: "brak" }); }, 10000);
}
coNowego();
