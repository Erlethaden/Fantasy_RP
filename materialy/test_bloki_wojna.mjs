// test 7.9e (DEMO, GM): wojna z członkiem bloku z sojuszem — propozycja wojny z całym blokiem; wojna wewnątrz bloku — ostrzeżenie (odmowa = brak wojny)
// node test_bloki_wojna.mjs <folder>  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = [], dialogi = []; s.on("pageerror", e => bledy.push(e.message));
s.on("dialog", d => { dialogi.push(d.message()); d.message().includes("są razem w bloku") ? d.dismiss() : d.accept(); });
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const tekst = async sel => (await s.locator(sel).first().textContent()).replace(/\s+/g, " ");
// blok z sojuszem
await s.click("#bloki"); await s.waitForSelector(".karta.bloki");
const f = s.locator(".nowy-blok form"); await f.locator("[name=nazwa]").fill("Trójprzymierze");
for (const w of ["rogus-ardens", "goblandia", "krag-mhor"]) await f.locator(`input[name=czlonek][value="${w}"]`).check();
await f.locator('input[name=traktat][value="sojusz"]').check(); await f.locator(".dodaj").click(); await s.waitForTimeout(300);
const wojna = async (x, y) => {
  if (!(await s.locator("section.wojny").isVisible().catch(() => false))) await s.click("#panel-gm");
  await s.selectOption(".nowa-wojna select[name=k1]", x); await s.selectOption(".nowa-wojna select[name=k2]", y);
  await s.click(".nowa-wojna button.dodaj"); await s.waitForTimeout(300);
};
// 1. Czarny Smok napada Goblandię → wojna z całym blokiem
await wojna("czarny-smok", "goblandia");
let t = await tekst("section.wojny"); console.log("wojny:", t);
console.log("dialog:", dialogi.at(-1));
assert.ok(dialogi.some(m => m.includes("należy do bloku Trójprzymierze") && m.includes("Rogus Ardens") && m.includes("Krag-Mhor")), dialogi.join(" | "));
for (const w of ["Goblandia", "Rogus Ardens", "Krag-Mhor"]) assert.ok(t.includes(`Królestwo Czarnego Smoka ⚔ ${w}`), "brak wojny z " + w);
// 2. Rogus napada Krag-Mhor (ten sam blok) — ostrzeżenie, odmowa → brak wojny
const ile = (await s.locator("section.wojny li").count());
await wojna("rogus-ardens", "krag-mhor");
assert.ok(dialogi.at(-1).includes("są razem w bloku: Trójprzymierze"), dialogi.at(-1));
assert.equal(await s.locator("section.wojny li").count(), ile, "wojna wewnątrz bloku mimo odmowy");
// kronika
await s.click("#kronika"); await s.waitForTimeout(300);
t = await tekst(".karta.kronika"); assert.ok(t.includes("Królestwo Czarnego Smoka wypowiada wojnę: Rogus Ardens (blok Trójprzymierze)"), t.slice(0, 400));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
