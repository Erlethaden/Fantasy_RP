// test 7.6b (DEMO): mapa terenu w programie, teren prowincji (GM), kolor właściciela na teksturach
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("console", m => m.type() === "error" && bledy.push(m.text()));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(4000);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const dir = process.argv[2];
await s.locator("#mapa").screenshot({ path: dir + "/m_cala.png" });
const m = await s.locator("#mapa").boundingBox();
let ok = false, px = 0, py = 0;
for (let fy = 0.4; fy < 0.7 && !ok; fy += 0.05) for (let fx = 0.4; fx < 0.6 && !ok; fx += 0.05) {
  px = m.x + m.width * fx; py = m.y + m.height * fy; await s.mouse.click(px, py);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok);
const teren0 = await s.locator(".edycja-prowincji select[name=teren]").inputValue();
console.log("teren startowy:", teren0, "|", await s.locator(".karta.prowincja .rasa").textContent());
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "goblandia");
await s.selectOption(".edycja-prowincji select[name=teren]", teren0 === "las" ? "pustynia" : "las");
await s.waitForTimeout(400);
for (let k = 0; k < 4; k++) { await s.mouse.move(px, py); await s.mouse.wheel(0, -400); await s.waitForTimeout(150); }
await s.waitForTimeout(500);
await s.locator("#mapa").screenshot({ path: dir + "/m_blisko.png" });
assert.ok((await s.locator(".karta.prowincja .rasa").textContent()).match(/Las|Pustynia/));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
