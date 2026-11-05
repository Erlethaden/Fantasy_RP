// etap 20 na emulatorze: gracz Aurelii proponuje rekrutację → GM przyjmuje (koszt schodzi w bazie) → zamknięcie tury tworzy armię,
// gracz proponuje podział → GM przyjmuje. Sprawdza też, że zapisy GM nie sypią błędami Firestore (klucze "u:…", mapy w tablicach).
// Serwer: VITE_EMULATOR=1 npx vite --port 5176 ; w folderze z firebase-tools i @firebase/rules-unit-testing:
//   firebase emulators:exec --only firestore,auth --project <projectId> "node test_rekrutacja_gracz.mjs <firestore.rules> <projectId> <folder na zrzuty>"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert";
const [regulyPlik, projectId, zrzuty] = process.argv.slice(2), ADRES = "http://localhost:5176/", P = "139b";
const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(regulyPlik, "utf8"), host: "127.0.0.1", port: 8080 } });
const konto = async email => (await (await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "haslo123", returnSecureToken: true }) })).json()).localId;
const uid = { gm: await konto("gm@test.pl"), aur: await konto("aur@test.pl") };
await env.withSecurityRulesDisabled(async c => {
  for (const [k, rola, frakcja] of [["gm", "gm", ""], ["aur", "gracz", "aurelia"]])
    await setDoc(doc(c.firestore(), "uzytkownicy", uid[k]), { email: `${k}@test.pl`, nazwa: k, rola, frakcja, utworzono: "" });
});
const dokument = async sciezka => { let d = null; await env.withSecurityRulesDisabled(async c => { const s = await getDoc(doc(c.firestore(), sciezka)); d = s.exists() ? s.data() : null; }); return d; };
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const bledy = [];
async function okno(email) {
  const s = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  s.on("pageerror", e => { bledy.push(`${email}: ${e.message}`); console.log("BŁĄD", email, e.message); }); s.on("dialog", d => d.accept());
  await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
  await s.goto(ADRES); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("#mail"); await s.keyboard.type(email); await s.click("#haslo"); await s.keyboard.type("haslo123");
  await s.click("button.wejdz"); await s.waitForTimeout(4000);
  if (await s.locator("#aplikacja[hidden]").count()) await s.click("button.wejdz");
  await s.waitForSelector("#aplikacja:not([hidden])", { timeout: 20000 }); await s.waitForTimeout(2500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  return s;
}
let GM = await okno("gm@test.pl"); await GM.waitForTimeout(2000);   // pierwszy GM wgrywa dane startowe
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  for (const f of ["krag-mhor", "aurelia", "goblandia", "rogus-ardens", "czarny-smok", "gor-khar", "grobowe-imperium"]) await setDoc(doc(db, "tajne_armie", f), { armie: [], floty: [] });
  await setDoc(doc(db, "gra", "armie"), { a: {}, fl: {}, bitwy: {} }, { merge: true });
  await setDoc(doc(db, "gra", "prowincje"), { p: { [P]: { wlasciciel: "aurelia" } } }, { merge: true });
  await setDoc(doc(db, "tajne_jednostki", "aurelia"), { jednostki: [{ nazwa: "Łucznicy", opis: "", poziom: 1, koszt: { zloto: 2, "u:Kryształ.Słońca": 1 }, utrzymanie: { zloto: 0.5 }, populacja: 1, czas: 1 }] });
  const tz = await getDoc(doc(db, "tajne_zasoby", "aurelia"));
  await setDoc(doc(db, "tajne_zasoby", "aurelia"), { ...tz.data(), stany: { zloto: 1000, populacja: 5000, zywnosc: 100 }, zasoby: [{ nazwa: "Kryształ.Słońca", opis: "", ilosc: 500 }] });
});
await GM.context().close(); GM = await okno("gm@test.pl"); await GM.waitForTimeout(2000);
const A = await okno("aur@test.pl");
const kartaA = async () => { if (!(await A.locator("section.wojsko").count())) await A.click("#lista-frakcji [data-id=aurelia]"); await A.waitForTimeout(500); };
const przyjmij = async () => {
  await GM.waitForTimeout(1500);
  if (!(await GM.locator(".panel-gm").count())) await GM.click("#panel-gm");
  await GM.waitForSelector(".propozycja [data-akcja=przyjmij]", { timeout: 10000 });
  await GM.click(".propozycja [data-akcja=przyjmij]"); await GM.waitForTimeout(2500);
};
// 1. gracz proponuje rekrutację 100 łuczników (nowa armia)
await kartaA();
await A.fill(".zlec-rekrutacje input[name=n]", "100"); await A.selectOption(".zlec-rekrutacje select[name=cel]", "nowa");
await A.click(".zlec-rekrutacje button.dodaj"); await A.waitForTimeout(1500);
await przyjmij();
let ta = await dokument("tajne_armie/aurelia"), tz = await dokument("tajne_zasoby/aurelia");
assert.equal(ta.rekrutacja?.length, 1, "zlecenie w bazie"); assert.equal(tz.stany.zloto, 800); assert.equal(tz.stany.populacja, 4900); assert.equal(tz.zasoby[0].ilosc, 400);
// 2. zamknięcie tury → armia
await GM.click("#zamknij-ture"); await GM.waitForTimeout(3500);
ta = await dokument("tajne_armie/aurelia");
assert.equal(ta.rekrutacja.length, 0); assert.equal(ta.armie.length, 1); assert.equal(ta.armie[0].oddzialy[0].liczba, 100);
assert.ok((await dokument("gra/armie")).a[ta.armie[0].id], "pozycja armii");
// 3. gracz: dymek Zgrzyta + propozycja podziału 30
await A.waitForTimeout(5000); await kartaA();
console.log("dymek gracza:", await A.locator(".pomocnik-tekst").allInnerTexts());
await A.locator("details.podzial summary").first().click();
await A.fill("details.podzial [data-ile]", "30"); await A.click("details.podzial [data-podziel]"); await A.waitForTimeout(1500);
await przyjmij();
ta = await dokument("tajne_armie/aurelia");
assert.equal(ta.armie.length, 2, "podział w bazie"); assert.deepEqual(ta.armie.map(a => a.oddzialy[0].liczba), [70, 30]);
await kartaA(); await A.waitForTimeout(1500);
await A.locator("section.wojsko").screenshot({ path: zrzuty + "/rekrutacja_gracz.png" });
assert.deepEqual(bledy, []);
console.log("OK"); await b.close(); await env.cleanup(); process.exit(0);
