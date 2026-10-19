// test 7.9d (DEMO, GM): warstwa „Bloki” (poświata w kolorze bloku wokół ziem członków) i „Pokaż na mapie” (tylko ten blok)
// node test_bloki_mapa.mjs <folder>  (serwer: npm run dev -- --port 5174)
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
const OUT = process.argv[2];
const szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
// ziemie: po kilka sąsiednich prowincji (żeby herby nie zasłaniały poświaty)
const ZIEMIE = { "rogus-ardens": ["D154", "D155", "D152", "D153", "D156"], goblandia: ["D77", "D74", "D75", "D78"], "krag-mhor": ["D172", "D168", "D169", "D171", "D173"], aurelia: ["D128", "D127", "D129", "D130"] };
for (const [p, w] of Object.entries(ZIEMIE).flatMap(([w, l]) => l.map(p => [p, w]))) {
  await szukaj(p); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", w); await s.waitForTimeout(200);
}
const kadr = async plik => {
  await s.click("#zamknij-szuflade", { timeout: 500 }).catch(() => {}); await szukaj("D172"); await s.click("#zamknij-szuflade", { timeout: 500 }).catch(() => {}); await s.waitForTimeout(300);
  const m = await s.locator("#mapa").boundingBox(); await s.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
  for (let i = 0; i < 3; i++) { await s.mouse.wheel(0, 300); await s.waitForTimeout(150); }
  await s.mouse.move(m.x + 640, m.y + 410); for (let i = 0; i < 2; i++) { await s.mouse.wheel(0, -300); await s.waitForTimeout(150); }
  await s.waitForTimeout(700); return s.locator("#mapa").screenshot(plik ? { path: `${OUT}/${plik}` } : {});
};
const otworzBloki = async () => { if (!(await s.locator(".karta.bloki").isVisible().catch(() => false))) await s.click("#bloki"); await s.waitForSelector(".karta.bloki"); };
const nowyBlok = async (nazwa, kolor, czlonkowie) => {
  await otworzBloki();
  if (!(await s.locator(".nowy-blok[open]").count())) await s.locator(".nowy-blok summary").click();
  const f = s.locator(".nowy-blok form"); await f.locator("[name=nazwa]").fill(nazwa);
  await f.locator("[name=kolor]").evaluate((el, v) => { el.value = v; }, kolor);
  for (const w of czlonkowie) await f.locator(`input[name=czlonek][value="${w}"]`).check();
  await f.locator(".dodaj").click(); await s.waitForTimeout(300);
};
await nowyBlok("Trójprzymierze", "#3a8fd8", ["rogus-ardens", "goblandia", "krag-mhor"]);
await nowyBlok("Złota Unia", "#e0b020", ["aurelia"]);
const bez = await kadr();
// warstwa „Bloki”
await s.click("#warstwy-mapy [data-warstwa=bloki]"); await s.waitForTimeout(300);
assert.equal(await s.locator("#warstwy-mapy [data-warstwa=bloki]").getAttribute("aria-pressed"), "true");
const t0 = Date.now(); const z = await kadr("bloki_warstwa.png"); console.log("kadr z warstwą:", Date.now() - t0, "ms");
assert.ok(Math.abs(z.length - bez.length) > 5000, `warstwa nic nie narysowała (${bez.length} → ${z.length})`);
// warstwa wyłączona, „Pokaż na mapie” tylko Trójprzymierze
await s.click("#warstwy-mapy [data-warstwa=bloki]"); await s.waitForTimeout(300);
await otworzBloki();
const tp = s.locator(".lista-blokow > li", { hasText: "Trójprzymierze" });
await tp.locator("[data-fokus]").click(); await s.waitForTimeout(300);
assert.equal(await s.locator(".lista-blokow > li", { hasText: "Trójprzymierze" }).locator("[data-fokus]").getAttribute("aria-pressed"), "true");
const f = await kadr("bloki_fokus.png");
assert.ok(Math.abs(f.length - bez.length) > 3000 && Math.abs(f.length - z.length) > 1000, "fokus = inny obraz niż bez i z warstwą");
// ukrycie
await otworzBloki();
await s.locator(".lista-blokow > li", { hasText: "Trójprzymierze" }).locator("[data-fokus]").click(); await s.waitForTimeout(300);
const ukryte = await kadr(); assert.ok(Math.abs(ukryte.length - bez.length) < 3000, "po ukryciu jak bez warstwy");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
