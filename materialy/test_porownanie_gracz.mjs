// test 15 na emulatorze: „Porównaj z…” według uprawnień — gracz widzi zasoby swojej krainy, cudze tajne to „???”, GM widzi wszystko.
// Serwer: VITE_EMULATOR=1 npx vite --port 5176 ; w folderze z firebase-tools i @firebase/rules-unit-testing:
//   firebase emulators:exec --only firestore,auth --project <projectId z firebase-config.js> "node test_porownanie_gracz.mjs <firestore.rules> <projectId> <folder na zrzuty>"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert";
const [regulyPlik, projectId, zrzuty] = process.argv.slice(2), ADRES = "http://localhost:5176/";
const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(regulyPlik, "utf8"), host: "127.0.0.1", port: 8080 } });
const konto = async email => (await (await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "haslo123", returnSecureToken: true }) })).json()).localId;
const uid = { gm: await konto("gm@test.pl"), gob: await konto("gob@test.pl") };
await env.withSecurityRulesDisabled(async c => {
  for (const [k, rola, frakcja] of [["gm", "gm", ""], ["gob", "gracz", "goblandia"]])
    await setDoc(doc(c.firestore(), "uzytkownicy", uid[k]), { email: `${k}@test.pl`, nazwa: k, rola, frakcja, utworzono: "" });
});
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
});
await GM.context().close(); GM = await okno("gm@test.pl"); await GM.waitForTimeout(2000);
// GM wpisuje zasoby Goblandii i Aurelii (tajne)
for (const [f, x] of [["goblandia", 111], ["aurelia", 222]]) {
  await GM.click(`#lista-frakcji [data-id=${f}]`); await GM.waitForTimeout(500);
  const p = GM.locator(".tabela-zasobow input").first(); await p.fill(String(x)); await p.press("Tab"); await GM.waitForTimeout(1500);
}
const wartosci = async s => s.locator("#porownanie .porownanie h3 ~ .por-wiersz").first().evaluate(w => [w.children[0].textContent, w.children[4].textContent]);
const porownaj = async (s, a, bId) => {
  await s.click(`#lista-frakcji [data-id=${a}]`); await s.waitForTimeout(500);
  if (!await s.locator(".porownaj").isVisible()) { await s.click(`#lista-frakcji [data-id=${a}]`); await s.waitForTimeout(500); }   // klik w otwartą krainę zamyka szufladę
  await s.click(".porownaj"); await s.waitForSelector("#porownanie[open] .por-wiersz");
  if (bId) { await s.selectOption("#porownanie [name=druga]", bId); await s.waitForTimeout(200); }
  const zasoby = await s.locator("#porownanie .porownanie h3").count() ? await wartosci(s) : null;
  const zgrzyt = await s.locator("#porownanie .por-zgrzyt").innerText();
  assert.ok(!/\{|undefined|\?\?\?/.test(zgrzyt), "zdanie Zgrzyta: " + zgrzyt);
  await s.click("#porownanie .zamknij");
  return zasoby;
};
assert.deepEqual(await porownaj(GM, "goblandia", "aurelia"), ["111", "222"], "GM widzi obie");
const G = await okno("gob@test.pl");
assert.deepEqual(await porownaj(G, "goblandia", "aurelia"), ["111", "???"], "gracz: swoje liczby, cudze ???");
assert.deepEqual(await porownaj(G, "aurelia"), ["???", "111"], "z cudzej karty: domyślnie porównanie z moją krainą");
assert.equal(await porownaj(G, "aurelia", "krag-mhor"), null, "dwie cudze krainy — bez sekcji zasobów");
await G.click(`#lista-frakcji [data-id=goblandia]`); await G.waitForTimeout(500); if (!await G.locator(".porownaj").isVisible()) await G.click(`#lista-frakcji [data-id=goblandia]`); await G.click(".porownaj"); await G.selectOption("#porownanie [name=druga]", "aurelia");
await G.waitForTimeout(300); await G.screenshot({ path: `${zrzuty}/porownanie_gracz.png` });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close(); await env.cleanup();
