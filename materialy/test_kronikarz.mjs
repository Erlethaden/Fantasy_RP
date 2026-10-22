// test Kronikarza (13): Zgrzyt nie zdradza tajemnic — node materialy/test_kronikarz.mjs
// tajny traktat i tajny wpis GM tylko w szeptach krajów z „widza”; tajna pamięć i tajne statystyki (wojsko, zasoby) nie wpływają na część jawną
import assert from "node:assert";
import { opowiedz, tekstNaDiscorda } from "../src/kronikarz.js";
const kraje = { a: { nazwa: "Alfa", id: "x" }, b: { nazwa: "Beta", id: "y" }, c: { nazwa: "Gamma", id: "z" } };
const jawne = [{ typ: "wojna", d: { A: "a", B: "b" }, kraje: ["a", "b"] }];
const tajne = [
  { typ: "traktat", tajny: true, widza: ["a", "c"], d: { rodzaj: "sojusz", nazwa: "SEKRET-TRAKTAT", lista: ["a", "c"] }, kraje: ["a", "c"] },
  { typ: "gm", tajny: true, widza: ["b"], d: { tekst: "SEKRET-GM" }, kraje: ["b"] },
];
const staty = { przed: { a: { prowincje: 5, zolnierze: 100 } }, teraz: { a: { prowincje: 5, zolnierze: 99999 } } };
for (let ziarno = 1; ziarno <= 200; ziarno++) {
  const bez = opowiedz({ tura: 3, ziarno, kraje, zdarzenia: jawne, staty: { przed: { a: { prowincje: 5 } }, teraz: { a: { prowincje: 5 } } } });
  const z = opowiedz({ tura: 3, ziarno, kraje, zdarzenia: [...jawne, ...tajne], staty,
    pamiec: [{ tura: 2, typ: "wojna", tajny: true, d: { A: "b", B: "a" } }, { tura: 2, typ: "wynik", tajny: true, d: { A: "a", przegrani: ["b"] } }] });
  const publiczny = z.akapity.join("\n");
  assert.deepEqual(z.akapity, bez.akapity, `ziarno ${ziarno}: część jawna zależy od tajnych rzeczy`);
  assert.ok(!/SEKRET|99999|Gamma/.test(publiczny + JSON.stringify(z.zrodla)), `ziarno ${ziarno}: tajemnica w części jawnej (też w źródłach akapitów dla filmu)`);
  assert.ok(!/SEKRET/.test(tekstNaDiscorda({ tura: 3, akapity: z.akapity })), "tajemnica w tekście na Discorda");
  assert.deepEqual(Object.keys(z.szepty).sort(), ["a", "b", "c"]);
  assert.ok(z.szepty.a.join(" ").includes("SEKRET-TRAKTAT") && !z.szepty.a.join(" ").includes("SEKRET-GM"), "szept a");
  assert.ok(z.szepty.b.join(" ").includes("SEKRET-GM") && !z.szepty.b.join(" ").includes("SEKRET-TRAKTAT"), "szept b");
  assert.ok(!z.szepty.c.join(" ").includes("SEKRET-GM"), "szept c");
}
console.log("OK — 200 losowań, tajemnice tylko w szeptach właściwych krajów");
// każdy rodzaj zdarzenia (też kraj NPC bez docinków, stary wpis, pamięć: odwet, rewanż, seria, długa wojna, byli wrogowie) — bez dziur w tekście
const pelne = { a: { nazwa: "Krag-Mhor", wladca: "Najwyższy Kowal Surtr", id: "krag-mhor" }, b: { nazwa: "Grobowe Imperium", wladca: "Tarael Illitris", id: "grobowe-imperium" }, n: { nazwa: "Księstwo Mgieł" } };
const wszystkie = [
  { typ: "wojna", d: { A: "a", B: "b" } }, { typ: "wojna", d: { A: "n", B: "a", blok: "Liga" } }, { typ: "bitwa", d: { miejsce: "w prowincji 12a", lista: ["a", "b"] } },
  { typ: "bitwa", d: { miejsce: "na morzu „Zatoka”", morska: true, lista: ["a", "b", "n"] } }, { typ: "wynik", d: { A: "a", przegrani: ["b"], miejsce: "w prowincji 12a", zdobycz: true, prowincja: "Prowincja 12a" } },
  { typ: "wynik", d: { A: "n", przegrani: ["a"], miejsce: "na morzu „Zatoka”", morska: true } }, { typ: "wynik", d: { remis: true, miejsce: "w prowincji 3b", lista: ["a", "n"] } },
  { typ: "wynik", d: { skutki: true, polegli: ["Drekki"], niewola: ["Kain"], ranni: ["Bob"] } }, { typ: "wlasciciel", d: { prowincja: "Dolina", A: "a", B: "n" } },
  { typ: "wlasciciel", d: { prowincja: "Prowincja 4a", A: "", B: "b" } }, { typ: "wlasciciel", d: { prowincja: "Prowincja 5a", A: "n", B: "" } },
  { typ: "pokoj", d: { A: "a", B: "b" } }, { typ: "zerwanie", d: { rodzaj: "sojusz", nazwa: "S", lista: ["a", "b"] } }, { typ: "zerwanie", d: { rodzaj: "handel", nazwa: "H", lista: ["a", "n"] } },
  ...["sojusz", "pakt", "handel", "pokoj", "wasalstwo", "przejscie", "inny", "nieznany"].map(r => ({ typ: "traktat", d: { rodzaj: r, nazwa: "T-" + r, lista: ["a", "b", "n"] } })),
  { typ: "blok", d: { tekst: "Liga przyjmuje nowego członka" } }, { typ: "gm", d: { tekst: "Kometa" } }, { typ: "stary", d: { tekst: "Stary wpis" } },
].map(z => ({ ...z, kraje: [] }));
const pamiecPelna = [{ tura: 1, typ: "wojna", d: { A: "b", B: "a" } }, { tura: 1, typ: "wynik", d: { A: "b", przegrani: ["a"] } }, { tura: 2, typ: "wynik", d: { A: "n", przegrani: ["a"] } }, { tura: 2, typ: "wynik", d: { A: "n", przegrani: ["b"] } }];
for (let ziarno = 1; ziarno <= 300; ziarno++) for (const pamiec of [[], pamiecPelna]) {
  const o = opowiedz({ tura: 6, ziarno, kraje: pelne, zdarzenia: wszystkie, pamiec, staty: { przed: { a: { prowincje: 9 }, n: { prowincje: 2 } }, teraz: { a: { prowincje: 7 }, n: { prowincje: 3 } } } });
  const t = o.akapity.join("\n");
  assert.ok(!/[{}]|undefined|NaN|null|Infinity|ziemia niczyja/.test(t), `ziarno ${ziarno}: dziura w tekście:\n${t.split("\n").find(l => /[{}]|undefined|NaN|null|Infinity|ziemia niczyja/.test(l))}`);
  assert.ok(!/ {2}|\s[.,!?]/.test(t), `ziarno ${ziarno}: podwójna spacja / spacja przed kropką`);
}
console.log("OK — 600 opowieści ze wszystkimi rodzajami zdarzeń bez dziur w tekście");
