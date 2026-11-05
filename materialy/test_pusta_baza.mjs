// stary problem (DZIENNIK 2026-10-22): GM, który wgrał dane do PUSTEJ bazy, nie zapisywał zmian aż do ponownego wejścia.
// Po poprawce echa zapisu (2026-10-23) sprawdzamy: pierwszy GM w pustej bazie od razu zamyka turę i zmienia nazwę prowincji — bez ponownego logowania —
// a baza ma te zmiany (czyta je drugie okno GM i sama baza).
// Serwer: VITE_EMULATOR=1 npx vite --port 5176 ; w folderze z firebase-tools i @firebase/rules-unit-testing:
//   firebase emulators:exec --only firestore,auth --project <projectId z firebase-config.js> "node test_pusta_baza.mjs <firestore.rules> <projectId>"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert";
const [regulyPlik, projectId] = process.argv.slice(2), ADRES = "http://localhost:5176/";
const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(regulyPlik, "utf8"), host: "127.0.0.1", port: 8080 } });
const konto = async email => (await (await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "haslo123", returnSecureToken: true }) })).json()).localId;
const uid = await konto("gm@test.pl");
await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), "uzytkownicy", uid), { email: "gm@test.pl", nazwa: "gm", rola: "gm", frakcja: "", utworzono: "" }));
const dokument = async sc => { let d = null; await env.withSecurityRulesDisabled(async c => { const s = await getDoc(doc(c.firestore(), sc)); d = s.exists() ? s.data() : null; }); return d; };
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const bledy = [];
async function okno() {
  const s = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
  await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
  await s.goto(ADRES); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("#mail"); await s.keyboard.type("gm@test.pl"); await s.click("#haslo"); await s.keyboard.type("haslo123");
  await s.click("button.wejdz"); await s.waitForTimeout(4000);
  if (await s.locator("#aplikacja[hidden]").count()) await s.click("button.wejdz");
  await s.waitForSelector("#aplikacja:not([hidden])", { timeout: 20000 }); await s.waitForTimeout(2500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  return s;
}
assert.equal(await dokument("gra/stan"), null, "baza nie jest pusta");
const GM = await okno();   // pierwszy GM wgrywa dane startowe
assert.ok(await dokument("gra/stan"), "GM nie wgrał danych");
// zmiany od razu, bez ponownego logowania: zamknięcie tury + nazwa prowincji
await GM.click("#panel-gm"); await GM.click("#zamknij-ture"); await GM.waitForTimeout(3000);
await GM.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const m = await GM.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await GM.mouse.click(m.x + m.width * fx, m.y + m.height * fy); ok = await GM.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
await GM.fill(".edycja-prowincji [name=nazwa]", "Próbna Kraina"); await GM.press(".edycja-prowincji [name=nazwa]", "Tab"); await GM.waitForTimeout(3000);
const st = await dokument("gra/stan"), pr = await dokument("gra/prowincje");
console.log("baza: tury", st?.tury?.length, "| nazwy prowincji:", Object.values(pr?.p || {}).map(x => x.nazwa).filter(Boolean));
assert.equal(st?.tury?.length, 1, "zamknięcie tury nie zapisało się w bazie");
assert.ok(Object.values(pr?.p || {}).some(x => x.nazwa === "Próbna Kraina"), "nazwa prowincji nie zapisała się w bazie");
// drugie okno GM widzi to samo
const GM2 = await okno();
await GM2.click("#panel-gm"); await GM2.waitForSelector("#zamknij-ture");
const przycisk = await GM2.locator("#zamknij-ture").textContent();
console.log("drugie okno:", przycisk); assert.match(przycisk, /Zamknij turę 2/, "drugie okno nie widzi zamkniętej tury");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close(); await env.cleanup();
