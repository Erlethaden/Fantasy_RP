// test trybu podglądu na telefon (7.7): DEMO zbudowane z VITE_PODGLAD=1 — nic nie da się edytować ani zapisać
// serwer: VITE_PODGLAD=1 npx vite --port 5175 --strictPort ; node test_podglad.mjs
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 1400, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5175/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
assert.ok(await s.locator("#panel-gm").isHidden(), "Panel GM widoczny");
// prowincja: karta bez pól edycji
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = await s.locator(".karta.prowincja").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
const polaProw = await s.locator(".karta.prowincja select, .karta.prowincja input, .karta.prowincja textarea").count();
assert.equal(polaProw, 0, "pola edycji na karcie prowincji: " + polaProw);
// frakcja: bez edycji opisu, notatek, propozycji
await s.click("#lista-frakcji [data-id=rogus-ardens]"); await s.waitForTimeout(500);
const edyt = await s.locator("#glowny button", { hasText: /Edytuj|Zaproponuj|Dodaj|Usuń|Zapisz/ }).count();
assert.equal(edyt, 0, "przyciski edycji na karcie frakcji: " + edyt);
assert.equal(await s.locator("#glowny textarea, #glowny input:not([type=checkbox])").count(), 0, "pola tekstowe na karcie frakcji");
assert.equal(await s.evaluate(() => localStorage.getItem("frp-demo")), null, "podgląd zapisał stan");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
