// 15: „⚖ Porównaj z…” na karcie frakcji — okno z liczbami jawnymi, słupkami, zasobami (DEMO: GM widzi wszystko) i zdaniem Zgrzyta; zrzut do folderu z argumentu
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
// Krąg Mhor dostaje prowincję i zasoby, żeby było co porównać
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "krag-mhor"); await s.waitForTimeout(200);
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(400);
const pola = s.locator(".tabela-zasobow input"), n = Math.min(await pola.count(), 4);
for (let k = 0; k < n; k++) { await pola.nth(k).fill(String(120 * (k + 1))); await pola.nth(k).press("Tab"); await s.waitForTimeout(100); }
await s.click(".porownaj");
await s.waitForSelector("#porownanie[open] .por-wiersz");
const wiersze = await s.locator("#porownanie .por-wiersz:not(.por-glowa)").count();
assert.ok(wiersze >= 8, "za mało wierszy: " + wiersze);
const zgrzyt = await s.locator("#porownanie .por-zgrzyt").innerText();
assert.ok(!/\{|undefined/.test(zgrzyt), "dziura w zdaniu: " + zgrzyt);
assert.ok(await s.locator("#porownanie h3", { hasText: "Zasoby" }).count(), "GM widzi zasoby");
console.log(zgrzyt);
await s.screenshot({ path: process.argv[2] + "/porownanie_okno.png" });
// zmiana drugiej krainy przerysowuje okno
const druga = await s.locator("#porownanie [name=druga] option").nth(1).getAttribute("value");
await s.selectOption("#porownanie [name=druga]", druga); await s.waitForTimeout(200);
assert.equal(await s.locator("#porownanie [name=druga]").inputValue(), druga);
for (let i = 0; i < 30; i++) {   // losowe zdania bez dziur
  await s.selectOption("#porownanie [name=druga]", druga);
  const t = await s.locator("#porownanie .por-zgrzyt").innerText();
  assert.ok(!/\{|undefined/.test(t), "dziura w zdaniu: " + t);
}
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
assert.equal(bledy.length, 0);
await b.close();
