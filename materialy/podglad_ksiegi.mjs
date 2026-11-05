// 18: księga kampanii (DEMO, GM) — wojna, dwie zamknięte tury, publikacja opowieści, otwarcie księgi z Kroniki: rozdziały z mapą,
// zrzut okna i PDF (page.pdf z tymi samymi stylami druku co „Zapisz PDF”). serwer: npx vite --port 5174 --strictPort ; node podglad_ksiegi.mjs <folder>
import { chromium } from "playwright-core";
import assert from "node:assert";
const cel = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
// GM: wojna, prowincja dla Krag-Mhor (żeby mapa miała kolory), dwie tury z publikacją
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy); ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "krag-mhor"); await s.waitForTimeout(200);
await s.click("#panel-gm"); await s.waitForTimeout(500);
await s.selectOption(".nowa-wojna select[name=k1]", "krag-mhor"); await s.selectOption(".nowa-wojna select[name=k2]", "aurelia"); await s.click(".nowa-wojna button.dodaj");
for (let i = 0; i < 2; i++) {
  await s.click("#zamknij-ture"); await s.waitForTimeout(2500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  if (!await s.locator(".kronikarz [data-kr=publikuj]").count()) await s.click("#panel-gm");
  await s.locator(".kronikarz").scrollIntoViewIfNeeded(); await s.click(".kronikarz [data-kr=publikuj]"); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
}
await s.click("#kronika"); await s.waitForSelector(".otworz-ksiege"); await s.click(".otworz-ksiege");
await s.waitForSelector("#ksiega .mapa-ksiegi img", { timeout: 20000 }); await s.waitForTimeout(800);
const rozdzialy = await s.locator("#ksiega .rozdzial-ksiegi").count(), mapy = await s.locator("#ksiega .mapa-ksiegi img").count();
console.log("rozdziały:", rozdzialy, "mapy:", mapy); assert.equal(rozdzialy, 2); assert.equal(mapy, 2);
await s.screenshot({ path: `${cel}/ksiega_okno.png` });
await s.evaluate(() => document.body.classList.add("druk-ksiegi")); await s.emulateMedia({ media: "print" });
await s.pdf({ path: `${cel}/ksiega_kampanii.pdf`, format: "A4", printBackground: true, margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" } });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
