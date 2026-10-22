// 12.2: okno „Zrób grafikę” w podglądzie na telefon — mieści się na wąskim ekranie, obrazek ma pełny rozmiar 1200×675, przyciski widoczne
// serwer: VITE_PODGLAD=1 npx vite --port 5175 --strictPort ; node test_grafika_telefon.mjs <folder na zrzut>
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5175/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(500);
await s.click(".zrob-grafike");
await s.waitForSelector("#grafika canvas");
const w = await s.evaluate(() => {
  const o = document.getElementById("grafika").getBoundingClientRect(), c = document.querySelector("#grafika canvas");
  const przyciski = [...document.querySelectorAll("#grafika .akcje-grafiki button")].map(x => x.getBoundingClientRect());
  return { lewo: o.left, prawo: o.right, plotno: [c.width, c.height], szerPlotna: c.getBoundingClientRect().width,
    przyciski: przyciski.every(r => r.right <= innerWidth && r.width > 0), poziomyPrzewijak: document.documentElement.scrollWidth > innerWidth };
});
console.log(w);
assert.ok(w.lewo >= 0 && w.prawo <= 390, "okno wychodzi poza ekran");
assert.deepEqual(w.plotno, [1200, 675], "obrazek ma zmniejszoną rozdzielczość");
assert.ok(w.przyciski, "przyciski poza ekranem");
assert.ok(!w.poziomyPrzewijak, "poziome przewijanie strony");
await s.screenshot({ path: process.argv[2] + "/grafika_telefon.png" });
assert.equal(await s.evaluate(() => localStorage.getItem("frp-demo")), null, "podgląd zapisał stan");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
