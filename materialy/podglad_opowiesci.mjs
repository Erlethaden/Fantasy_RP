// podgląd okna Kroniki Zgrzyta (13.4) na próbnej turze z materialy/probka_kronikarza.mjs — zrzuty: w trakcie pisania i całość
// serwer: npm run dev -- --port 5174 ; node podglad_opowiesci.mjs <folder na zrzuty>
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.evaluate(async () => {
  const { opowiedz } = await import("/src/kronikarz.js"), { pokazOpowiesc } = await import("/src/opowiesc.js"), { FRAKCJE } = await import("/src/dane/frakcje.js");
  const kraje = Object.fromEntries(FRAKCJE.map(f => [f.id, { nazwa: f.nazwa, wladca: f.wladca, id: f.id }]));
  const miejsce = "w prowincji „Przełęcz Kowadła”";
  const o = opowiedz({ tura: 7, kraje, pamiec: [{ tura: 5, typ: "wynik", d: { A: "aurelia", przegrani: ["krag-mhor"] } }, { tura: 6, typ: "wojna", d: { A: "krag-mhor", B: "gor-khar" } }], zdarzenia: [
    { typ: "wojna", d: { A: "gor-khar", B: "krag-mhor" }, kraje: ["gor-khar", "krag-mhor"] },
    { typ: "bitwa", d: { miejsce, lista: ["gor-khar", "krag-mhor"] }, kraje: ["gor-khar", "krag-mhor"] },
    { typ: "wynik", d: { A: "gor-khar", przegrani: ["krag-mhor"], miejsce, zdobycz: true, polegli: ["Drekki"] }, kraje: ["gor-khar", "krag-mhor"] },
    { typ: "traktat", d: { rodzaj: "handel", nazwa: "Złoty Trakt", lista: ["aurelia", "goblandia"] }, kraje: ["aurelia", "goblandia"] },
    { typ: "zerwanie", d: { nazwa: "Pakt Popiołu", lista: ["rogus-ardens", "czarny-smok"] }, kraje: ["rogus-ardens", "czarny-smok"] },
    { typ: "gm", d: { tekst: "Na wschodzie widziano kometę o zielonym ogonie" }, kraje: [] },
    { typ: "traktat", tajny: true, widza: ["grobowe-imperium", "czarny-smok"], d: { rodzaj: "sojusz", nazwa: "Czarna Krypta", lista: ["grobowe-imperium", "czarny-smok"] }, kraje: ["grobowe-imperium", "czarny-smok"] },
  ], staty: { przed: { "gor-khar": { prowincje: 30 }, "krag-mhor": { prowincje: 25 } }, teraz: { "gor-khar": { prowincje: 33 }, "krag-mhor": { prowincje: 22 } } } });
  pokazOpowiesc(document.getElementById("opowiesc"), { tura: 7, akapity: o.akapity, szept: o.szepty["grobowe-imperium"] }, d => d.showModal());
});
await s.waitForTimeout(6000);
await s.screenshot({ path: process.argv[2] + "/opowiesc_pisanie.png" });
await s.click(".pokaz-calosc"); await s.waitForTimeout(300);
await s.locator(".opowiesc-tekst").evaluate(e => e.scrollTop = 0);
await s.screenshot({ path: process.argv[2] + "/opowiesc_poczatek.png" });
await s.locator(".opowiesc-tekst").evaluate(e => e.scrollTop = e.scrollHeight);
await s.screenshot({ path: process.argv[2] + "/opowiesc_koniec.png" });
assert.ok(await s.locator(".opowiesc-szept:not([hidden])").count(), "brak szeptu");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
await b.close();
