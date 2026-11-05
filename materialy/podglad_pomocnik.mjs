// podgląd 16 dla użytkownika (DEMO, GM): zrzuty — menu 🔊 z „Zgrzyt w dymku”, dymek przy wojnie i przy nowej turze.
// serwer: npx vite --port 5174 --strictPort ; node podglad_pomocnik.mjs <folder>
import { chromium } from "playwright-core";
const cel = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const s = await ctx.newPage(); s.on("dialog", d => d.accept()); s.on("pageerror", e => console.log("BŁĄD:", e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(3500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("#dzwieki-przycisk"); await s.waitForTimeout(800);
await s.screenshot({ path: `${cel}/pomocnik_menu.png` });
await s.click("#dzwieki-przycisk"); await s.waitForTimeout(500);
await s.click("#panel-gm"); await s.waitForTimeout(1000);
await s.selectOption(".nowa-wojna select[name=k1]", "krag-mhor"); await s.waitForTimeout(400);
await s.selectOption(".nowa-wojna select[name=k2]", "aurelia"); await s.waitForTimeout(400);
await s.click(".nowa-wojna button.dodaj");
await s.waitForSelector(".pomocnik:not([hidden])", { timeout: 8000 }); await s.waitForTimeout(3500);
await s.screenshot({ path: `${cel}/pomocnik_wojna.png` });
await s.waitForTimeout(2500); await s.click(".pomocnik-zamknij"); await s.waitForTimeout(800);
await s.locator("#zamknij-ture").scrollIntoViewIfNeeded(); await s.waitForTimeout(600); await s.click("#zamknij-ture");
await s.waitForTimeout(1500); await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.waitForSelector(".pomocnik:not([hidden])", { timeout: 8000 }); await s.waitForTimeout(3500);
await s.screenshot({ path: `${cel}/pomocnik_tura.png` });
await b.close(); console.log("OK");
