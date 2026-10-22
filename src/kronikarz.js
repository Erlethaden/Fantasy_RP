// Kronikarz Zgrzyt (13): z wpisów kroniki jednej tury + statystyk z historii składa opowieść Zgrzyta. Czysta funkcja (bez DOM),
// teksty w src/dane/kronikarz_teksty.js. Ten sam numer tury = ta sama opowieść (losowanie z ziarnem), „Losuj inaczej” = inne ziarno.
import { T } from "./dane/kronikarz_teksty.js";
import { PRZEKRECONE } from "./dane/przekrecenia.js";

// prosty generator liczb z ziarnem (mulberry32)
const generator = ziarno => () => { ziarno = (ziarno + 0x6D2B79F5) | 0; let t = ziarno; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// zdarzenie: { typ, d: {…} (dane do szablonu), kraje: [wł], tajny, widza: [wł] }
// kraje: { wł: { nazwa, wladca, id (frakcji, do docinków) } }; staty: { teraz: {wł: {prowincje, zolnierze, …}}, przed: {…} } (z historii, może brakować)
// pamiec: zdarzenia z poprzednich tur [{ tura, typ, d, kraje }] — do serii („znowu przegrali”)
// TAJEMNICE: opowieść widzą wszyscy, a składa ją GM (widzi wszystko). Dlatego: tajne zdarzenia idą TYLKO do szeptów krajów z „widza”,
// pamięć bierze tylko jawne zdarzenia, a ze statystyk czytana jest wyłącznie liczba prowincji (jawna mapa) — nigdy zasoby, wojsko, notatki.
// Część jawna liczona jest w całości przed szeptami, więc nawet losowanie nie zależy od tajnych rzeczy. Test: materialy/test_kronikarz.mjs
export function opowiedz({ tura, zdarzenia, kraje, staty = {}, pamiec = [], ziarno = tura }) {
  pamiec = pamiec.filter(z => !z.tajny);
  const los = generator(ziarno * 7919 + 1), uzyte = new Set();
  // losuje wariant, którego jeszcze nie było w tej opowieści (gdy wszystkie były — dowolny)
  const wybierz = lista => {
    if (!lista?.length) return "";
    const wolne = lista.filter(t => !uzyte.has(t)), z = wolne.length ? wolne : lista, t = z[Math.floor(los() * z.length)];
    uzyte.add(t); return t;
  };
  // Zgrzyt przekręca nazwy (przekrecenia.js): pierwsza wzmianka w opowieści zawsze prawdziwa, żeby było wiadomo, o kogo chodzi,
  // potem ~60% szans na przekręcenie — każda kraina tak samo (bez faworytów)
  const wspomniane = new Set();
  const przekrec = n => {
    if (!wspomniane.has(n)) { wspomniane.add(n); return n; }
    const w = PRZEKRECONE[n]; if (!w || los() > 0.6) return n;
    return w[Math.floor(los() * w.length)];
  };
  const nazwa = w => kraje[w] ? przekrec(kraje[w].nazwa) : "ziemia niczyja";
  // {A} {B} {wladcaA} … + pola zdarzenia; nieznane zostają puste
  const wstaw = (tekst, d) => tekst.replace(/\{(\w+)\}/g, (_, k) => {
    if (k === "A" || k === "B") return nazwa(d[k]);
    if (k === "wladcaA" || k === "wladcaB") { const wl = kraje[d[k.slice(-1)]]?.wladca; return wl ? przekrec(wl) : nazwa(d[k.slice(-1)]); }
    if (k === "lista") { const n = (d.lista || []).map(nazwa); return n.length > 1 ? `${n.slice(0, -1).join(", ")} i ${n.at(-1)}` : n.join(""); }
    if (k === "gdzie") return /^Prowincja /.test(d.prowincja || "") ? d.prowincja : `„${d.prowincja}”`;   // nazwa nadana przez GM w cudzysłowie
    if (k === "ileTur") return `${d.ile} ${[2, 3, 4].includes(d.ile % 10) && ![12, 13, 14].includes(d.ile % 100) ? "tury" : "tur"}`;   // „po 3 turach” nie — wzorce mówią „3 tury wojny”
    if (k === "ileProw") return `${d.ile} ${d.ile === 1 ? "prowincję" : [2, 3, 4].includes(d.ile % 10) && ![12, 13, 14].includes(d.ile % 100) ? "prowincje" : "prowincji"}`;
    return d[k] ?? "";
  }).replace(/(^|[.!?…]\s+)(\p{Ll})/gu, (_, a, b) => a + b.toUpperCase());   // „w prowincji…” na początku zdania
  const powiedz = (lista, d = {}) => wstaw(wybierz(lista), d);
  // docinek pod krainę (frakcja ~70%), kraj NPC / bez własnych docinków — ogólny (~40%)
  const docinek = (w, rodzaj) => {
    if (!w || !kraje[w]) return "";
    const wlasne = T.docinki[kraje[w].id]?.[rodzaj];
    return wlasne ? (los() < 0.7 ? " " + powiedz(wlasne, { A: w }) : "") : T.docinkiNpc[rodzaj] && los() < 0.4 ? " " + powiedz(T.docinkiNpc[rodzaj], { A: w }) : "";
  };

  const jawne = zdarzenia.filter(z => !z.tajny), tajne = zdarzenia.filter(z => z.tajny);
  const waga = { wojna: 3, wynik: 3, wlasciciel: 2, bitwa: 2, zerwanie: 2, pokoj: 2, traktat: 1, blok: 1, gm: 1 };
  const burza = jawne.reduce((n, z) => n + (waga[z.typ] || 1), 0);
  const akapity = [], zrodla = [];   // zrodla[i] = zdarzenie, którego dotyczy akapit i (null — wstęp, statystyki, koniec); film 13.5b: dokąd jedzie kamera
  akapity.push(powiedz(burza === 0 ? T.wstep.cisza : burza < 4 ? T.wstep.spokojna : jawne.some(z => z.typ === "wojna" || z.typ === "wynik") ? T.wstep.wojenna : T.wstep.burzliwa, { tura }));

  // seria: ile razy kraj przegrał w poprzednich turach (do „znowu”)
  const przegrane = w => pamiec.filter(z => z.typ === "wynik" && z.d?.przegrani?.includes(w)).length;
  const wojnyKraju = w => pamiec.filter(z => z.typ === "wojna" && (z.d?.A === w || z.d?.B === w)).length;
  const wygrane = w => pamiec.filter(z => z.typ === "wynik" && z.d?.A === w).length;
  const para = (z, x, y) => (z.d?.A === x && z.d?.B === y) || (z.d?.A === y && z.d?.B === x);
  const poczatekWojny = (x, y) => Math.max(-Infinity, ...pamiec.filter(z => z.typ === "wojna" && para(z, x, y)).map(z => z.tura ?? -Infinity));

  const kolejnosc = ["wojna", "bitwa", "wynik", "wlasciciel", "pokoj", "zerwanie", "traktat", "blok", "gm"];
  const opis = z => {
    const d = { ...z.d, tura };
    switch (z.typ) {
      case "wojna": {
        const odwet = pamiec.some(p => p.typ === "wojna" && p.d?.A === d.B && p.d?.B === d.A);
        const pierwsza = pamiec.length > 0 && wojnyKraju(d.A) === 0;
        return powiedz(odwet ? T.wojna.odwet : wojnyKraju(d.A) >= 2 ? T.wojna.seria : d.blok ? T.wojna.blok : pierwsza ? T.wojna.pierwsza : T.wojna.zwykla, d) + docinek(d.A, "wojna");
      }
      case "bitwa": return powiedz(d.lista?.length > 2 ? T.bitwa.wielka : d.morska ? T.bitwa.morska : T.bitwa.ladowa, d);
      case "wynik": {
        if (d.skutki) {   // „Po bitwie” (jawny wpis GM): polegli, ranni, jeńcy
          const t = [d.polegli?.length && powiedz(T.wynik.polegli, { kto: d.polegli.join(", ") }), d.niewola?.length && powiedz(T.wynik.niewola, { kto: d.niewola.join(", ") }),
            d.ranni?.length && powiedz(T.wynik.ranni, { kto: d.ranni.join(", ") })].filter(Boolean);
          return t.length ? t.join(" ") : "";
        }
        if (d.remis) return powiedz(T.wynik.remis, d);
        const B = d.przegrani?.[0];
        const rewanz = B && pamiec.some(p => p.typ === "wynik" && p.d?.A === B && p.d?.przegrani?.includes(d.A));
        let t = powiedz(d.zdobycz ? T.wynik.zdobycz : d.morska ? T.wynik.morskie : T.wynik.zwyciestwo, { ...d, B });
        // jeden dopisek o historii: rewanż > porażka z rzędu przegranego > seria zwycięzcy
        if (rewanz) t += " " + powiedz(T.wynik.rewanz, { ...d, B });
        else if (B && przegrane(B) >= 1) t += " " + powiedz(T.wynik.znowu, { ...d, B });
        else if (wygrane(d.A) >= 2) t += " " + powiedz(T.wynik.seria, d);
        if (d.polegli?.length) t += " " + powiedz(T.wynik.polegli, { ...d, B, kto: d.polegli.join(", ") });
        return t + docinek(d.A, "wygrana") + (B ? docinek(B, "przegrana") : "");
      }
      case "wlasciciel": return powiedz(d.B ? (d.A ? T.wlasciciel.zmiana : T.wlasciciel.zajecie) : T.wlasciciel.utrata, d) + docinek(d.B, "zdobycz") + docinek(d.A, "utrata");
      case "pokoj": {
        const ile = tura - poczatekWojny(d.A, d.B);
        return powiedz(ile >= 3 && ile < Infinity ? T.pokojDlugi : T.pokoj, { ...d, ile }) + docinek(d.A, "pokoj");
      }
      case "zerwanie": return powiedz(d.rodzaj === "sojusz" ? T.zdrada : T.zerwanie, d);
      case "traktat": {
        const l = d.lista || [], wrogowie = pamiec.some(p => p.typ === "wojna" && l.includes(p.d?.A) && l.includes(p.d?.B));
        return powiedz(T.traktat[d.rodzaj] || T.traktat.inny, d) + (wrogowie ? " " + powiedz(T.traktatWrogowie) : "") + docinek(l[0], "traktat");
      }
      case "blok": return powiedz(T.blok, d);
      case "gm": return powiedz(T.gm, d);
      case "stary": return powiedz(T.stary, d);   // wpis sprzed 13.2 (bez danych) — Zgrzyt czyta sam tekst
    }
    return "";
  };
  // zdobycie prowincji w bitwie zapisuje też zmianę właściciela — opowiadamy raz (przy bitwie)
  const zdobyte = new Set(jawne.filter(z => z.typ === "wynik" && z.d?.zdobycz).map(z => z.d.prowincja));
  const pusty = z => z.typ === "wynik" && z.d?.skutki && !(z.d.polegli?.length || z.d.niewola?.length || z.d.ranni?.length);
  const posortowane = jawne.filter(z => !(z.typ === "wlasciciel" && zdobyte.has(z.d?.prowincja)) && !pusty(z))
    .sort((a, b) => kolejnosc.indexOf(a.typ) - kolejnosc.indexOf(b.typ));
  // mocne zdarzenia czasem zaczynają się wykrzyknikiem (też przekleństwem) zamiast zwykłego przejścia
  const mocne = new Set(["wojna", "bitwa", "wynik"]);
  posortowane.forEach((z, i) => (zrodla[akapity.length] = z) && akapity.push((mocne.has(z.typ) && los() < 0.25 ? powiedz(T.wykrzyknik) + " " : i ? powiedz(T.przejscie) + " " : "") + opis(z)));

  // statystyki z historii: kto najbardziej urósł / stracił ziemię
  const zmiany = Object.keys(staty.teraz || {}).map(w => [w, (staty.teraz[w].prowincje || 0) - (staty.przed?.[w]?.prowincje ?? staty.teraz[w].prowincje ?? 0)]).filter(([, r]) => r);
  const zysk = zmiany.sort((a, b) => b[1] - a[1])[0], strata = zmiany.at(-1);
  if (zysk?.[1] > 0) akapity.push(powiedz(T.staty.zysk, { A: zysk[0], ile: zysk[1] }));
  if (strata?.[1] < 0 && strata !== zysk) akapity.push(powiedz(T.staty.strata, { A: strata[0], ile: -strata[1] }));
  if (burza === 0) akapity.push(powiedz(T.cisza));
  akapity.push(powiedz(burza < 4 ? T.koniec.spokojna : T.koniec.burzliwa, { tura }));

  // szepty: tajne zdarzenia tylko dla krajów z „widza”
  const szepty = {};
  for (const z of tajne) for (const w of z.widza || z.kraje) (szepty[w] ??= [powiedz(T.szept.wstep)]).push(opis(z));
  for (const w in szepty) szepty[w].push(powiedz(T.szept.koniec));
  const pelne = akapity.map((a, i) => [a, zrodla[i] || null]).filter(([a]) => a);
  return { akapity: pelne.map(([a]) => a), zrodla: pelne.map(([, z]) => z && { typ: z.typ, d: z.d }), szepty };
}
// tekst na Discorda: sama część jawna — szeptów nigdy
export const tekstNaDiscorda = o => `**Kronika Zgrzyta — tura ${o.tura}**\n\n${o.akapity.join("\n\n")}`;
