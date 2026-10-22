// próbka Kronikarza Zgrzyta (13.1): wymyślona burzliwa tura z prawdziwymi krainami + spokojna tura — node materialy/probka_kronikarza.mjs
import { opowiedz } from "../src/kronikarz.js";
import { FRAKCJE } from "../src/dane/frakcje.js";
const kraje = Object.fromEntries(FRAKCJE.map(f => [f.id, { nazwa: f.nazwa, wladca: f.wladca, id: f.id }]));
const pamiec = [
  { tura: 5, typ: "wynik", d: { A: "aurelia", przegrani: ["krag-mhor"] }, kraje: ["aurelia", "krag-mhor"] },
  { tura: 6, typ: "wojna", d: { A: "krag-mhor", B: "gor-khar" }, kraje: ["krag-mhor", "gor-khar"] },
];
const burzliwa = opowiedz({ tura: 7, kraje, pamiec, zdarzenia: [
  { typ: "wojna", d: { A: "gor-khar", B: "krag-mhor" }, kraje: ["gor-khar", "krag-mhor"] },
  { typ: "bitwa", d: { miejsce: "w prowincji „Przełęcz Kowadła”", lista: ["gor-khar", "krag-mhor"] }, kraje: ["gor-khar", "krag-mhor"] },
  { typ: "wynik", d: { A: "gor-khar", przegrani: ["krag-mhor"], miejsce: "w prowincji „Przełęcz Kowadła”", zdobycz: true, polegli: ["Drekki"] }, kraje: ["gor-khar", "krag-mhor"] },
  { typ: "traktat", d: { rodzaj: "handel", nazwa: "Złoty Trakt", lista: ["aurelia", "goblandia"] }, kraje: ["aurelia", "goblandia"] },
  { typ: "zerwanie", d: { nazwa: "Pakt Popiołu", lista: ["rogus-ardens", "czarny-smok"] }, kraje: ["rogus-ardens", "czarny-smok"] },
  { typ: "gm", d: { tekst: "Na wschodzie widziano kometę o zielonym ogonie" }, kraje: [] },
  { typ: "traktat", tajny: true, widza: ["grobowe-imperium", "czarny-smok"], d: { rodzaj: "sojusz", nazwa: "Czarna Krypta", lista: ["grobowe-imperium", "czarny-smok"] }, kraje: ["grobowe-imperium", "czarny-smok"] },
], staty: { przed: { "gor-khar": { prowincje: 30 }, "krag-mhor": { prowincje: 25 } }, teraz: { "gor-khar": { prowincje: 33 }, "krag-mhor": { prowincje: 22 } } } });
const spokojna = opowiedz({ tura: 8, kraje, zdarzenia: [] });
for (const [tytul, o] of [["TURA 7 (burzliwa)", burzliwa], ["TURA 8 (cisza)", spokojna]]) {
  console.log(`\n=== ${tytul} ===\n` + o.akapity.join("\n\n"));
  for (const [w, s] of Object.entries(o.szepty)) console.log(`\n[szept tylko dla: ${kraje[w].nazwa}]\n` + s.join(" "));
}
