// 13.6: Kronika Zgrzyta na wąskim ekranie (390 px, DEMO): sekcja w Panelu GM, poprawki, okno opowieści, archiwum w Kronice —
// wszystko w ekranie, bez poziomego przewijania. Serwer: npm run dev -- --port 5174 ; node test_opowiesci_telefon.mjs <folder na zrzuty>
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const wEkranie = async (sel, opis) => {
  const r = await s.evaluate(sel => [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => [r.left, r.right]), sel);
  assert.ok(r.length && r.every(([l, p]) => l >= -1 && p <= 391), `${opis} poza ekranem: ${JSON.stringify(r)}`);
  assert.ok(!(await s.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${opis}: poziome przewijanie`);
};
// wojna + tajny wpis, zamknięcie tury
await s.click("#panel-gm"); await s.waitForTimeout(300);
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia"); await s.click(".nowa-wojna button.dodaj");
await s.click("#kronika"); await s.waitForSelector("article.kronika");
await s.fill(".nowy-wpis textarea", "Tajna zaraza"); await s.check(".nowy-wpis input[name=tajny]"); await s.check(".nowy-wpis input[name=widza][value=goblandia]");
await s.click(".nowy-wpis button.dodaj"); await s.waitForTimeout(200);
await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(800);
// sekcja w Panelu GM i poprawki
await s.locator(".kronikarz").scrollIntoViewIfNeeded();
await wEkranie(".kronikarz button, .kronikarz select", "przyciski Kroniki Zgrzyta");
await s.click(".kronikarz [data-kr=popraw]"); await s.waitForSelector(".popraw-opowiesc");
await wEkranie(".popraw-opowiesc textarea, .popraw-opowiesc button", "poprawki");
await s.locator(".kronikarz").screenshot({ path: process.argv[2] + "/kronikarz_telefon_panel.png" });
await s.click(".anuluj-opowiesc");
// publikacja i okno opowieści z archiwum
await s.click(".kronikarz [data-kr=publikuj]"); await s.waitForTimeout(500);
await s.click("#kronika"); await s.waitForSelector("[data-opowiesc='1']"); await s.click("[data-opowiesc='1']");
await s.waitForSelector("#opowiesc[open]");
if (await s.locator("#opowiesc .pokaz-calosc").isVisible()) await s.click("#opowiesc .pokaz-calosc");
await wEkranie("#opowiesc, #opowiesc .opowiesc-tekst, #opowiesc button", "okno opowieści");
const wys = await s.evaluate(() => { const t = document.querySelector("#opowiesc .opowiesc-tekst"); return [t.scrollHeight > t.clientHeight, document.querySelector("#opowiesc").getBoundingClientRect().bottom <= innerHeight + 1]; });
console.log("tekst przewijany w oknie:", wys[0], "| okno mieści się w wysokości:", wys[1]);
assert.ok(wys[1], "okno opowieści wyższe niż ekran");
await s.screenshot({ path: process.argv[2] + "/kronikarz_telefon_okno.png" });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
