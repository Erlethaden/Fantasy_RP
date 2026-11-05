// 20.8–20.9 (DEMO = GM): stary gracz (przejrzał rozdziały przed etapem 20, bez odcisków) dostaje przy wejściu „coś nowego” = rozdział
// „Rekrutacja i utrzymanie”; przechodzi go do końca (żaden krok nie przepada przez brak celu), a po ponownym wejściu Zgrzyt już milczy.
// uruchom z folderu z playwright-core: node test_samouczek_nowosci.mjs <folder na zrzuty>
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => { bledy.push(e.message); console.log("BŁĄD:", e.message); }); s.on("dialog", d => d.accept());
await s.addInitScript(() => { if (!sessionStorage.getItem("raz")) { sessionStorage.setItem("raz", "1"); localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, przejrzane: ["start", "armie"] })); } });
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
const wejdz = async () => {
  await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
};
await wejdz();
const tekst = () => s.locator(".samouczek-tekst").innerText();
assert.ok(await s.locator(".samouczek:not([hidden])").count(), "Zgrzyt nie odezwał się o nowościach");
await s.waitForTimeout(1500);
const t0 = await tekst(); console.log("propozycja:", t0);
assert.match(t0, /coś nowego: „Rekrutacja i utrzymanie \(pokaz\)”\./);
await s.click(".samouczek [data-s=nowe]");
const kroki = [];
for (let i = 0; i < 20; i++) {
  await s.waitForTimeout(1200);
  if (await s.locator(".samouczek-tekst[data-pelny]").count()) { await s.click(".samouczek-okno .samouczek-tekst"); await s.waitForTimeout(200); }   // dokończ pisanie
  const t = await s.locator(".samouczek-tekst").innerText();
  if (/Zgrzyt skończył ten kawałek/.test(t)) break;
  const cel = await s.locator(".samouczek-obwodka:not([hidden])").count();
  kroki.push(`${cel ? "[cel] " : ""}${t.slice(0, 50)}`);
  if (kroki.length === 4) await s.screenshot({ path: process.argv[2] + "/samouczek_rekrutacja.png" });
  await s.click(".samouczek-okno .samouczek-tekst");
}
console.log(kroki.join("\n"));
assert.equal(kroki.length, 11, "któryś krok przepadł (brak celu)");
assert.equal(kroki.filter(k => k.startsWith("[cel]")).length, 8, "nie każdy krok z celem podświetlił element");
assert.match(await tekst(), /Zgrzyt skończył/);
assert.match(await s.locator(".samouczek-rozdzialy").innerText(), /✓ Rekrutacja i utrzymanie/);
await s.click(".samouczek [data-s=koniec]");
// po pokazie nic nie zostało w grze (piaskownica)
assert.equal(await s.locator(".rekrutacja li").count(), 0);
// ponowne wejście: cisza
await wejdz();
assert.equal(await s.locator(".samouczek:not([hidden])").count(), 0, "Zgrzyt znowu mówi o nowościach");
assert.deepEqual(bledy, []);
console.log("OK"); await b.close();
