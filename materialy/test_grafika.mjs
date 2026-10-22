// 12: „Zrób grafikę” na karcie frakcji — obrazek 1200×675, zasoby dopiero po zaznaczeniu; zapisuje PNG do folderu z argumentu
import { chromium } from "playwright-core";
import assert from "node:assert";
import { writeFileSync } from "node:fs";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
// Krąg Mhor dostaje prowincję, żeby liczby nie były zerami
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "krag-mhor"); await s.waitForTimeout(200);
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(400);
const pola = s.locator(".tabela-zasobow input"), n = Math.min(await pola.count(), 6);
for (let k = 0; k < n; k++) { await pola.nth(k).fill(String(120 * (k + 1))); await pola.nth(k).press("Tab"); await s.waitForTimeout(100); }
const zapiszPlotno = async nazwa => {
  const url = await s.locator("#grafika canvas").evaluate(c => { if (c.width !== 1200 || c.height !== 675) throw new Error("rozmiar " + c.width); return c.toDataURL(); });
  writeFileSync(`${process.argv[2]}/${nazwa}.png`, Buffer.from(url.split(",")[1], "base64"));
};
await s.click(".zrob-grafike");
await s.waitForSelector("#grafika canvas");
assert.equal(await s.locator("#grafika [name=zasoby]").isChecked(), false, "zasoby domyślnie wyłączone, gdy tajne");
await zapiszPlotno("grafika_bez_zasobow");
await s.check("#grafika [name=zasoby]");
await s.waitForSelector("#grafika canvas"); await s.waitForTimeout(300);
await zapiszPlotno("grafika_z_zasobami");
await s.screenshot({ path: process.argv[2] + "/grafika_okno.png" });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
assert.equal(bledy.length, 0);
await b.close();
