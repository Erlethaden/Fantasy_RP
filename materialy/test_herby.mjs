import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
// znajdź prowincję: klikaj siatkę punktów mapy
// przypisz Rogus Ardens prowincję i jej sąsiadów (karta prowincji → klik w sąsiada)
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "rogus-ardens"); await s.waitForTimeout(200);
for (let k = 0; k < 3; k++) {
  await s.locator(".sasiedzi button").nth(k).click(); await s.waitForTimeout(200);
  await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "rogus-ardens"); await s.waitForTimeout(200);
}
await s.keyboard.press("Escape"); await s.mouse.click(m.x + 5, m.y + m.height - 5);   // zamknij szufladę klikiem w wodę/róg
await s.waitForTimeout(500);
const herby = await s.locator(".mapa-herby img").count(); console.log("herbów:", herby); assert.equal(herby, 1);
const op = async () => +(await s.locator(".mapa-herby").evaluate(e => getComputedStyle(e).opacity));
await s.waitForTimeout(400); const o1 = await op(); console.log("oddalona: opacity", o1);
await s.screenshot({ path: process.argv[2] + "/h_oddal.png" });
for (let k = 0; k < 6; k++) { await s.mouse.move(m.x + m.width / 2, m.y + m.height / 2); await s.mouse.wheel(0, -400); await s.waitForTimeout(150); }
await s.waitForTimeout(500); const o2 = await op(); console.log("przybliżona: opacity", o2);
assert.ok(o1 > 0.8 && o2 < 0.05, "przezroczystość");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
await b.close();
