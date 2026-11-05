// 16.1: dymek Zgrzyta-pomocnika (DEMO) — ustawienie w 🔊 (domyślnie „normalnie”), dymek pisze tekst i znika po ×, milczy wyłączony i w samouczku
// serwer: npx vite --port 5174 --strictPort ; node test_pomocnik.mjs <folder na zrzut>
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("#dzwieki-przycisk");
assert.equal(await s.locator("#dzwieki-panel [name=pomocnik]").inputValue(), "normalnie", "domyślnie normalnie");
await s.click("#dzwieki-przycisk");
const powiedz = t => s.evaluate(async t => (await import("/src/pomocnik.js")).powiedz(t), t);
const TEKST = "Psia krew, Głąbowe Imperium znowu coś knuje. Tak tak.";
assert.equal(await powiedz(TEKST), true);
await s.waitForFunction(t => document.querySelector(".pomocnik-tekst")?.textContent === t, TEKST, { timeout: 5000 });
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(400);   // dymek nie może zasłaniać szuflady
const [d, sz] = await s.evaluate(() => [document.querySelector(".pomocnik").getBoundingClientRect().toJSON(), document.getElementById("szuflada").getBoundingClientRect().toJSON()]);
assert.ok(d.right <= sz.left, "dymek zasłania szufladę");
await s.screenshot({ path: process.argv[2] + "/pomocnik_dymek.png" });
await s.click(".pomocnik-zamknij"); assert.ok(await s.locator(".pomocnik").isHidden(), "× nie chowa dymka");
// wyłączony — milczy
await s.click("#dzwieki-przycisk"); await s.selectOption("#dzwieki-panel [name=pomocnik]", "wylaczony"); await s.click("#dzwieki-przycisk");
assert.equal(await powiedz("test"), false, "wyłączony mówi"); assert.ok(await s.locator(".pomocnik").isHidden());
assert.equal(await s.evaluate(() => JSON.parse(localStorage.getItem("frp-dzwieki")).pomocnik), "wylaczony", "ustawienie niezapamiętane");
// samouczek — milczy
await s.click("#dzwieki-przycisk"); await s.selectOption("#dzwieki-panel [name=pomocnik]", "czesto"); await s.click("#dzwieki-przycisk");
await s.evaluate(() => document.body.classList.add("w-samouczku"));
assert.equal(await powiedz("test"), false, "mówi w samouczku");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
