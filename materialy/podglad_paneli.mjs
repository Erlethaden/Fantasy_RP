// podgląd paneli armii i floty (DEMO, GM) → PNG: node podglad_paneli.mjs <folder>  (serwer: npm run dev -- --port 5174)
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
// znajdź prowincję: klikaj siatkę punktów mapy
// podgląd paneli armii i flot (GM, tryb DEMO) — zrzuty PNG
const F = "rogus-ardens", OUT = process.argv[2];
const szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
await szukaj("90a"); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F); await s.waitForTimeout(300);
await s.click(`#lista-frakcji [data-id=${F}]`); await s.waitForSelector(".dodaj-jednostke");
const jednostka = async (nazwa, poziom, okret, poj) => { const f = s.locator(".dodaj-jednostke"); await f.locator("[name=nazwa]").fill(nazwa); await f.locator("[name=poziom]").selectOption(String(poziom));
  if (okret) { await f.locator("[name=morska]").check(); if (poj) await f.locator("[name=pojemnosc]").fill(String(poj)); } await f.locator(".dodaj").click(); await s.waitForTimeout(250); };
await jednostka("Piechota piekielna", 1); await jednostka("Rycerze Otchłani", 2); await jednostka("Chochliki", 0);
await jednostka("Galera ognia", 1, true, 150); await jednostka("Okręt flagowy", 2, true, 400);
const oddzialy = async (form, lista) => { for (const [k, [nazwa, ile]] of lista.entries()) { await form().locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(250);
  await form().locator("select[name=j]").nth(k).selectOption(nazwa); await s.waitForTimeout(200); await form().locator("input[name=n]").nth(k).fill(String(ile)); await form().locator("input[name=n]").nth(k).press("Tab"); await s.waitForTimeout(250); } };
// armia
await s.click("[data-nowa-armia]"); await s.waitForTimeout(300);
const fa = () => s.locator("form.armia[data-a]").first();
await fa().locator("[name=nazwa]").fill("Legion Siarki"); await fa().locator("[name=nazwa]").press("Tab"); await s.waitForTimeout(250);
await fa().locator("select[name=dowodca]").selectOption({ index: 1 }); await s.waitForTimeout(250);
await oddzialy(fa, [["Piechota piekielna", 900], ["Rycerze Otchłani", 120], ["Chochliki", 400]]);
// flota
await s.click("[data-nowa-flota]"); await s.waitForTimeout(300);
const ff = () => s.locator("form.armia[data-fl]").first();
await ff().locator("[name=nazwa]").fill("Flota Płomienia"); await ff().locator("[name=nazwa]").press("Tab"); await s.waitForTimeout(250);
await ff().locator("select[name=dowodca]").selectOption({ index: 1 }); await s.waitForTimeout(250);
await oddzialy(ff, [["Galera ognia", 6], ["Okręt flagowy", 1]]);
await s.locator("section.jednostki").screenshot({ path: OUT + "/1_jednostki_i_okrety.png" });
await s.locator("section.armie").screenshot({ path: OUT + "/2_panel_armii_GM.png" });
await s.locator("section.floty").screenshot({ path: OUT + "/3_panel_floty_GM.png" });
// mapa przy flocie i armii
const akw = (await ff().locator(".armia-info").textContent()).replace(/\s+/g, " ").split("·")[1].split("Mieści")[0].trim();
await szukaj(akw); await s.click("#zamknij-szuflade").catch(() => {}); await s.waitForTimeout(500);
await s.waitForTimeout(500); await s.screenshot({ path: OUT + "/4_mapa_flota_i_armia.png" });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); await b.close();
