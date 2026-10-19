// test 7.6c (DEMO): kolory krajów (wypełnienie + pas granicy), ramka, róża wiatrów, mgła, fale
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("console", m => m.type() === "error" && bledy.push(m.text()));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(4000);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const dir = process.argv[2], m = await s.locator("#mapa").boundingBox();
// kilka sąsiednich prowincji dla dwóch krajów
let ok = false, px = 0, py = 0;
for (let fy = 0.45; fy < 0.7 && !ok; fy += 0.04) for (let fx = 0.42; fx < 0.6 && !ok; fx += 0.04) {
  px = m.x + m.width * fx; py = m.y + m.height * fy; await s.mouse.click(px, py);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok);
for (let k = 0; k < 6; k++) {
  await s.selectOption(".edycja-prowincji select[name=wlasciciel]", k < 4 ? "rogus-ardens" : "goblandia"); await s.waitForTimeout(150);
  const nast = s.locator(".sasiedzi button").nth(k % 2); if (!(await nast.count())) break; await nast.click(); await s.waitForTimeout(150);
}
await s.click("#zamknij-szuflade"); await s.waitForTimeout(300);
await s.locator("#mapa").screenshot({ path: dir + "/o_cala.png" });
const cel = await s.evaluate(() => { const c = document.querySelector(".mapa-kolory"), r = c.getBoundingClientRect(), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 200) { const p = (i - 3) / 4; return [r.left + (p % c.width) / c.width * r.width, r.top + Math.floor(p / c.width) / c.height * r.height]; } });
console.log("kraj na ekranie:", cel);
for (let k = 0; k < 4; k++) { await s.mouse.move(cel[0], cel[1]); await s.mouse.wheel(0, -400); await s.waitForTimeout(150); }
await s.waitForTimeout(800);
await s.locator("#mapa").screenshot({ path: dir + "/o_blisko.png" });
assert.equal(await s.locator(".mapa-ramka").count(), 1); assert.equal(await s.locator(".mapa-roza").count(), 1);
// fale się zmieniają między klatkami
const f1 = await s.locator(".mapa-fale").evaluate(c => c.toDataURL().length); await s.waitForTimeout(400);
const f2 = await s.locator(".mapa-fale").evaluate(c => c.toDataURL().length);
console.log("fale:", f1, f2); assert.notEqual(f1, f2, "fale stoją");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
