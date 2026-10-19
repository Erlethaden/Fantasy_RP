// test 7.9c (DEMO, GM): wspólne traktaty bloku — na karcie frakcji (🏛, bez zrywania), szlaki handlowe i linie sojuszy między członkami
// node test_bloki_traktaty.mjs <folder>  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const OUT = process.argv[2], tekst = async sel => (await s.locator(sel).first().textContent()).replace(/\s+/g, " ");
const szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
const CZLONKOWIE = [["D154", "rogus-ardens"], ["D77", "goblandia"], ["D172", "krag-mhor"]];
for (const [p, w] of CZLONKOWIE) { await szukaj(p); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", w); await s.waitForTimeout(250); }
const kadr = async plik => {   // ten sam widok mapy co w podglądzie szlaków
  await szukaj("D172"); await s.click("#zamknij-szuflade").catch(() => {}); await s.waitForTimeout(300);
  const m = await s.locator("#mapa").boundingBox(); await s.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
  for (let i = 0; i < 3; i++) { await s.mouse.wheel(0, 300); await s.waitForTimeout(150); }
  await s.mouse.move(m.x + 640, m.y + 410); for (let i = 0; i < 2; i++) { await s.mouse.wheel(0, -300); await s.waitForTimeout(150); }
  await s.waitForTimeout(700); return s.locator("#mapa").screenshot(plik ? { path: `${OUT}/${plik}` } : {});
};
await s.click("#warstwy-mapy [data-warstwa=sojusze]"); await s.waitForTimeout(200);   // linie sojuszy włączone
const przed = await kadr();
// blok: handel + sojusz
await s.click("#bloki"); await s.waitForSelector(".karta.bloki");
const f = s.locator(".nowy-blok form");
await f.locator("[name=nazwa]").fill("Trójprzymierze"); await f.locator("[name=skrot]").fill("TP");
for (const [, w] of CZLONKOWIE) await f.locator(`input[name=czlonek][value="${w}"]`).check();
for (const t of ["handel", "sojusz"]) await f.locator(`input[name=traktat][value="${t}"]`).check();
await f.locator(".dodaj").click(); await s.waitForTimeout(300);
// karta frakcji: traktaty bloku, bez ✂
await s.click("#lista-frakcji [data-id=goblandia]"); await s.waitForTimeout(300);
let t = await tekst("section.traktaty"); console.log("traktaty Goblandii:", t);
assert.ok(t.includes("🏛 Trójprzymierze — Umowa handlowa") && t.includes("🏛 Trójprzymierze — Sojusz") && t.includes("wspólny traktat bloku"), t);
// mapa: szlaki i linie sojuszy
const po = await kadr("bloki_traktaty_mapa.png");
assert.ok(Math.abs(po.length - przed.length) > 2000, `mapa bez zmian (${przed.length} → ${po.length})`);
// GM odznacza handel → zostaje tylko sojusz
await s.click("#bloki"); await s.waitForSelector(".karta.bloki");
await s.locator(".lista-blokow details summary").first().click();
await s.locator('.edycja-bloku input[name=traktat][value="handel"]').uncheck(); await s.locator(".edycja-bloku .dodaj").click(); await s.waitForTimeout(300);
await s.click("#lista-frakcji [data-id=goblandia]"); await s.waitForTimeout(300);
t = await tekst("section.traktaty"); assert.ok(!t.includes("Umowa handlowa") && t.includes("Trójprzymierze — Sojusz"), t);
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
