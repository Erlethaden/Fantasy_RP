// test samouczka (8.1): propozycja przy pierwszym wejściu, przejście wszystkich rozdziałów kliknięciami (obwódka na elementach), powrót do menu,
// brak zmian w localStorage (warstwy, zapis DEMO), Esc zamyka — node test_samouczek.mjs  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } }); const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForTimeout(2000);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.waitForSelector(".samouczek:not([hidden])", { timeout: 5000 });
const ls = () => s.evaluate(() => [localStorage.getItem("frp-warstwy"), localStorage.getItem("frp-demo")]);
await s.click("[data-s=wszystkie]"); const przed = await ls();
let obwodki = 0, menu = false;
for (let i = 0; i < 250 && !menu; i++) {   // „Wszystkie po kolei” = wszystkie rozdziały (ok. 120 kroków)
  await s.waitForTimeout(700);
  if (await s.evaluate(() => document.querySelector(".samouczek-tekst").dataset.pelny !== undefined)) { await s.mouse.click(800, 300); await s.waitForTimeout(150); }
  obwodki += await s.evaluate(() => !document.querySelector(".samouczek-obwodka").hidden ? 1 : 0);
  menu = await s.locator(".samouczek-rozdzialy").count() > 0;
  if (!menu) await s.mouse.click(800, 300);
}
assert.ok(menu, "rozdział nie wrócił do menu"); assert.ok(obwodki >= 80, "za mało podświetleń: " + obwodki);
assert.deepEqual(await ls(), przed, "samouczek zmienił localStorage");
await s.keyboard.press("Escape"); await s.waitForTimeout(300);
assert.ok(await s.locator(".samouczek[hidden]").count(), "Esc nie zamknął");
assert.equal(bledy.length, 0, bledy.join(" | ")); console.log("OK — podświetleń:", obwodki); await b.close();
