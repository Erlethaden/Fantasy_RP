// test 7.9b (DEMO, „działaj jako”): gracz zakłada blok, zaproszenia, wnioski i głosowanie (większość), tryb lidera, wyjście, rozwiązanie
// node test_bloki_gracze.mjs <folder>  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const OUT = process.argv[2], R = "rogus-ardens", G = "goblandia", A = "aurelia";
const tekst = async sel => (await s.locator(sel).first().textContent()).replace(/\s+/g, " ");
const jako = async w => { await s.selectOption("#demo-jako", w); await s.waitForTimeout(250); };
const blok = () => s.locator(".lista-blokow > li").first();
const czlonkowie = () => tekst(".blok-czlonkowie");
const wniosek = async (typ, pole, wartosc) => {
  await blok().locator(".nowy-wniosek summary").click(); const f = blok().locator("form.wniosek");
  await f.locator("[name=typ]").selectOption(typ); if (pole) await f.locator(`[name=${pole}]`).selectOption(wartosc);
  await f.locator(".dodaj").click(); await s.waitForTimeout(300);
};
const glos = async tak => { await blok().locator(`[data-glos][data-tak="${tak ? 1 : ""}"]`).first().click(); await s.waitForTimeout(300); };
await s.click("#bloki"); await s.waitForSelector(".karta.bloki");
// Rogus zakłada blok, zaprasza Goblandię i Aurelię
await jako(R);
await s.locator(".nowy-blok summary").click(); const f = s.locator(".nowy-blok form");
await f.locator("[name=nazwa]").fill("Przymierze Płomieni"); await f.locator("[name=skrot]").fill("PP");
for (const w of [G, A]) await f.locator(`input[name=zaproszony][value="${w}"]`).check();
await f.locator(".dodaj").click(); await s.waitForTimeout(300);
let t = await tekst(".lista-blokow"); assert.ok(t.includes("1 członek") && t.includes("decyzje głosowaniem") && /Zaproszeni: (Goblandia, Aurelia|Aurelia, Goblandia)/.test(t), t);
// Goblandia dołącza, Aurelia odrzuca
await jako(G); await blok().locator("[data-przyjmij]").click(); await s.waitForTimeout(300);
await jako(A); await blok().locator("[data-odrzuc]").click(); await s.waitForTimeout(300);
assert.ok((await czlonkowie()).includes("Goblandia") && !(await tekst(".lista-blokow")).includes("Zaproszeni"), "zaproszenia");
// wniosek Rogusa: zaprosić Aurelię — 1 z 2 to za mało, głos Goblandii przesądza
await jako(R); await wniosek("zapros", "zapros", A);
t = await tekst(".wnioski"); assert.ok(t.includes("zaprosić: Aurelia") && t.includes("za 1, przeciw 0 z 2 (potrzeba 2)"), t);
await jako(G); await s.locator(".lista-blokow").screenshot({ path: OUT + "/bloki_glosowanie.png" });
await glos(true);
assert.ok((await tekst(".lista-blokow")).includes("Zaproszeni: Aurelia") && !(await s.locator(".wnioski").count()), "wniosek przeszedł");
await jako(A); await blok().locator("[data-przyjmij]").click(); await s.waitForTimeout(300);
assert.ok((await tekst(".lista-blokow")).includes("3 członków"));
// tryb lidera: wniosek Rogusa (lider Goblandia), Aurelia za → 2 z 3
await jako(R); await wniosek("tryb", "lider", G);
await jako(A); await glos(true);
t = await tekst(".lista-blokow"); assert.ok(t.includes("lider: Goblandia") && (await czlonkowie()).includes("Goblandia ★"), t);
// lider zmienia nazwę sam
await jako(G); await blok().locator("details summary").first().click();
const ed = blok().locator("form.edycja-bloku"); await ed.locator("[name=nazwa]").fill("Przymierze Płomieni i Złota"); await ed.locator(".dodaj").click(); await s.waitForTimeout(300);
assert.ok((await tekst(".lista-blokow")).includes("Przymierze Płomieni i Złota"), "zmiana lidera");
// inni w trybie lidera: tylko wniosek o powrót do głosowania; Aurelia zgłasza, Rogus za
await jako(A); await wniosek("tryb"); await jako(R); await glos(true);
assert.ok((await tekst(".lista-blokow")).includes("decyzje głosowaniem"), "powrót do głosowania");
// wniosek o wykluczenie Aurelii odrzucony (Goblandia i Aurelia przeciw)
await jako(R); await wniosek("wyrzuc", "wyrzuc", A);
await jako(G); await glos(false); assert.ok(await s.locator(".wnioski").count(), "1 przeciw z 3 — jeszcze trwa");
await jako(A); await glos(false);
assert.ok(!(await s.locator(".wnioski").count()) && (await czlonkowie()).includes("Aurelia"), "odrzucony");
// Goblandia wychodzi; rozwiązanie: Rogus + Aurelia za
await jako(G); await blok().locator("[data-wyjdz]").click(); await s.waitForTimeout(300);
assert.ok(!(await czlonkowie()).includes("Goblandia"));
await jako(R); await wniosek("rozwiaz"); await jako(A); await glos(true);
assert.ok((await tekst(".karta.bloki")).includes("Nie ma jeszcze"), "blok rozwiązany");
await s.click("#kronika"); await s.waitForTimeout(300);
t = await tekst(".karta.kronika"); console.log("kronika:", t.slice(t.indexOf("🏛"), t.indexOf("🏛") + 500));
for (const x of ["Powstaje Przymierze Płomieni (PP)", "Goblandia — do bloku", "zaprasza: Aurelia", "lider — Goblandia", "decyzje znowu głosowaniem", "Goblandia — poza blokiem", "Rozwiązanie bloku"]) assert.ok(t.includes(x), "kronika: " + x);
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
