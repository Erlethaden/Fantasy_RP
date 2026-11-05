// odliczania na karcie krainy (DEMO = GM): kilka naraz, liczą się z zamknięciem tury, „Nadeszło!”, usuwanie
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
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(400);
const dodaj = async (nazwa, ile, tajne) => {
  await s.fill(".dodaj-odliczanie [name=nazwa]", nazwa); await s.fill(".dodaj-odliczanie [name=ile]", String(ile));
  if (tajne) await s.check(".dodaj-odliczanie [name=tajne]");
  await s.click(".dodaj-odliczanie .dodaj"); await s.waitForTimeout(300);
};
await dodaj("Przebudzenie smoka", 3); await dodaj("Zaćmienie", 1, true); await dodaj("Zima", 2);
const wpisy = () => s.locator(".odliczania li").allInnerTexts();
let t = await wpisy();
assert.equal(t.length, 3, "trzy odliczania naraz");
assert.match(t[0], /🔒 Zaćmienie — za 1 turę/); assert.match(t[1], /Zima — za 2 tury/); assert.match(t[2], /Przebudzenie smoka — za 3 tury/);
await s.screenshot({ path: process.argv[2] + "/odliczania_karta.png", clip: await s.locator(".odliczania").boundingBox() });
// zamknięcie tury w Panelu GM
s.on("dialog", d => d.accept());
await s.click("#panel-gm"); await s.waitForTimeout(400);
await s.click("#zamknij-ture"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(400);
t = await wpisy();
assert.match(t[0], /Zaćmienie — Nadeszło!/); assert.match(t[1], /Zima — za 1 turę/); assert.match(t[2], /za 2 tury/);
await s.click(".odliczania [data-usun-odliczanie]"); await s.waitForTimeout(300);   // pierwszy na liście = Zaćmienie
t = await wpisy();
assert.equal(t.length, 2); assert.ok(!t.some(x => x.includes("Zaćmienie")), "usunięte właściwe");
await s.screenshot({ path: process.argv[2] + "/odliczania_po_turze.png", clip: await s.locator(".odliczania").boundingBox() });
assert.deepEqual(bledy, []);
console.log("OK", t);
await b.close();
