// podgląd tras armii (ląd) i floty (woda) po 1 turze (DEMO) → PNG: node podglad_tras.mjs <folder> <ścieżka akweny.json>  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const AKWENY = JSON.parse(readFileSync(process.argv[3]));
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
const OUT = process.argv[2], F = "rogus-ardens";
const szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
const karta = async () => { if (!(await s.locator("[data-nowa-armia]").isVisible().catch(() => false))) { await s.click(`#lista-frakcji [data-id=${F}]`); await s.waitForTimeout(250); } };
// klik w miejsce znalezione wyszukiwarką: mapa centruje je w części widocznej obok szuflady
const wskaz = async (form, info, cel, wynik) => {
  for (const [dx, dy] of [[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30], [60, 60], [-60, -60]]) {
    await karta(); await form().locator("[data-cel]").click();
    await szukaj(cel); const m = await s.locator("#mapa").boundingBox(), sz = await s.locator("#szuflada").boundingBox();
    await s.mouse.click((m.x + sz.x) / 2 + dx, m.y + m.height / 2 + dy); await s.waitForTimeout(400);
    await karta(); const t = (await form().locator(".armia-info").textContent()).replace(/\s+/g, " ");
    if (wynik(t)) return console.log("cel:", t.split("Cel:")[1]);
    console.log("  próba:", t.split("·").slice(-1)[0]);
  }
  throw new Error("nie ustawiono celu " + cel);
};
// armia: Rogus w D154, cel D172 (daleko na wschodzie, po lądzie)
await szukaj("D154"); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F); await s.waitForTimeout(250);
await szukaj("90a"); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F); await s.waitForTimeout(250);   // nadmorska — dla floty
await karta();
if (!(await s.locator(".lista-jednostek li").count())) { await s.fill(".dodaj-jednostke input[name=nazwa]", "Chochliki"); await s.click(".dodaj-jednostke button.dodaj"); await s.waitForTimeout(250); }
await s.click("[data-nowa-armia]"); await s.waitForTimeout(250);
const fa = () => s.locator("form.armia[data-a]").first();
await fa().locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(250);
await fa().locator("input[name=n]").first().fill("900"); await fa().locator("input[name=n]").first().press("Tab"); await s.waitForTimeout(250);
await s.check("[data-przejscie=rzeki]"); await s.waitForTimeout(250);   // na wschód od D154 płyną rzeki bez mostów
await karta(); await fa().locator("[data-przestaw]").click();   // armia startuje w D154 (stolica może być gdzie indziej)
await szukaj("D154"); { const m = await s.locator("#mapa").boundingBox(), sz = await s.locator("#szuflada").boundingBox(); await s.mouse.click((m.x + sz.x) / 2, m.y + m.height / 2); await s.waitForTimeout(400); }
await wskaz(fa, null, "D172", t => /Cel: .*za ([4-9]|\d\d) tur/.test(t));
// flota: start przy 90a, cel A22
await karta(); await s.click("[data-nowa-flota]"); await s.waitForTimeout(250);
const ff = () => s.locator("form.armia[data-fl]").first();
await wskaz(ff, null, "Akwen 22", t => t.includes("Cel: Akwen 22"));
// 1 tura — widać część przebytą (ciemna) i dalszą (przerywana)
await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(600);
await s.click("#zamknij-szuflade").catch(() => {});
const kadr = async (cel, oddal, plik, clip) => {   // clip: wycinek (przy krawędzi mapy zostaje puste tło)
  await szukaj(cel); await s.click("#zamknij-szuflade").catch(() => {}); await s.waitForTimeout(300);
  const m = await s.locator("#mapa").boundingBox(); await s.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
  for (let i = 0; i < oddal; i++) { await s.mouse.wheel(0, 300); await s.waitForTimeout(150); }
  await s.waitForTimeout(700);
  if (clip) await s.screenshot({ path: `${OUT}/${plik}`, clip: { ...clip, x: m.x + clip.x, y: m.y + clip.y } });   // locator.screenshot nie przyjmuje clip
  else await s.locator("#mapa").screenshot({ path: `${OUT}/${plik}` });
};
await kadr("D172", 1, "trasa_armii.png");
await kadr("Akwen 3", 1, "trasa_floty.png", { x: 0, y: 300, width: 1600, height: 531 });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); await b.close();
