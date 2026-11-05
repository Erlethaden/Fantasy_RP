// 15.2: okno „Porównaj z…” w podglądzie na telefon — mieści się na wąskim ekranie, bez poziomego przewijania
// serwer: VITE_PODGLAD=1 npx vite --port 5175 --strictPort ; node test_porownanie_telefon.mjs <folder na zrzut>
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5175/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(500);
await s.click(".porownaj");
await s.waitForSelector("#porownanie[open] .por-wiersz");
const w = await s.evaluate(() => {
  const o = document.getElementById("porownanie").getBoundingClientRect();
  const wiersze = [...document.querySelectorAll("#porownanie .por-wiersz")].map(x => x.getBoundingClientRect());
  return { lewo: o.left, prawo: o.right, wiersze: wiersze.every(r => r.left >= o.left && r.right <= o.right),
    oknoPrzewija: document.getElementById("porownanie").scrollWidth > document.getElementById("porownanie").clientWidth,
    poziomyPrzewijak: document.documentElement.scrollWidth > innerWidth };
});
console.log(w);
assert.ok(w.lewo >= 0 && w.prawo <= 390, "okno wychodzi poza ekran");
assert.ok(w.wiersze && !w.oknoPrzewija, "wiersze nie mieszczą się w oknie");
assert.ok(!w.poziomyPrzewijak, "poziome przewijanie strony");
await s.screenshot({ path: process.argv[2] + "/porownanie_telefon.png" });
assert.equal(await s.evaluate(() => localStorage.getItem("frp-demo")), null, "podgląd zapisał stan");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
