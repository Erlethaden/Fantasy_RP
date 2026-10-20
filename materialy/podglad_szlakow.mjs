// podgląd szlaków handlowych (DEMO): jeden kraj (D154) handluje z 4 krajami na wschodzie → PNG: node podglad_szlakow.mjs <folder>  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
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
const OUT = process.argv[2], ZRODLO = ["D154", "rogus-ardens"];
const PARTNERZY = [["D77", "goblandia"], ["D128", "aurelia"], ["D172", "krag-mhor"], ["D235", "gor-khar"]];
const szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
for (const [p, wl] of [ZRODLO, ...PARTNERZY]) { await szukaj(p); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", wl); await s.waitForTimeout(250); }
await s.click("#panel-gm");
for (const [, wl] of PARTNERZY) {
  await s.fill(".nowy-traktat input[name=nazwa]", "Handel " + wl); await s.selectOption(".nowy-traktat select[name=typ]", "handel");
  for (const w of [ZRODLO[1], wl]) await s.check(`.nowy-traktat input[name=strona][value=${w}]`);
  await s.click(".nowy-traktat button.dodaj"); await s.waitForTimeout(250);
}
await s.click("#zamknij-szuflade").catch(() => {});
await szukaj("D172"); await s.click("#zamknij-szuflade").catch(() => {});
const m = await s.locator("#mapa").boundingBox();
await s.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
for (let i = 0; i < 3; i++) { await s.mouse.wheel(0, 300); await s.waitForTimeout(150); }
await s.waitForTimeout(600); await s.locator("#mapa").screenshot({ path: `${OUT}/szlaki_cala_mapa.png` });
// przybliżenie na układ szlaków (na oddalonej mapie leży ok. 640,410)
await s.mouse.move(m.x + 640, m.y + 410);
for (let i = 0; i < 2; i++) { await s.mouse.wheel(0, -300); await s.waitForTimeout(150); }
await s.waitForTimeout(600); await s.locator("#mapa").screenshot({ path: `${OUT}/szlaki_zblizenie.png` });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); await b.close();
