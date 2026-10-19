// test 7.1a + 7.1b (DEMO): załóż armię, dowódca-bohater, oddział, status bohatera, rozwiązanie
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
const F = "rogus-ardens";
// prowincja dla frakcji
await s.click(`#lista-frakcji [data-id=${F}]`);
await s.click("[data-nowa-armia]");
assert.ok((await s.locator(".komunikat-armii").textContent()).includes("nie ma żadnej prowincji"));
const m = await s.locator("#mapa").boundingBox(); let ok = false;
let px = 0, py = 0;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  px = m.x + m.width * fx; py = m.y + m.height * fy;
  await s.mouse.click(px, py);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok);
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F);
// jednostka + armia
await s.click(`#lista-frakcji [data-id=${F}]`);
if (!(await s.locator(".lista-jednostek li").count())) { await s.fill(".dodaj-jednostke input[name=nazwa]", "Chochliki"); await s.click(".dodaj-jednostke button.dodaj"); }
await s.click("[data-nowa-armia]");
const form = s.locator("form.armia").first();
assert.ok((await form.textContent()).includes("Brak dowódcy"));
const bohater = await form.locator("select[name=dowodca] option").nth(1).getAttribute("value");
const imie = await form.locator("select[name=dowodca] option").nth(1).textContent();
await form.locator("select[name=dowodca]").selectOption(bohater);
await s.locator("form.armia [data-dodaj-oddzial]").first().click();
await s.locator("form.armia input[name=n]").first().fill("150");
await s.locator("form.armia input[name=n]").first().press("Tab");
await s.waitForTimeout(300);
const txt = (await s.locator("form.armia").first().textContent()).replace(/\s+/g, " ");
console.log("armia:", txt.slice(-160));
assert.ok(txt.includes(`Dowódca: ${imie}`) && txt.includes("150 żołnierzy") && !txt.includes("poniżej 100"));
const st = (await s.locator(".bohater, .bohaterowie button").filter({ hasText: imie }).first().textContent()).replace(/\s+/g, " ");
console.log("status:", st); assert.ok(st.includes("Na misji (z armią)"));
await s.locator("section.armie").screenshot({ path: process.argv[2] + "/a_armia.png" });
// 7.1b: znacznik na mapie po przybliżeniu, w kolorze frakcji, klik otwiera kartę
const nr = await (async () => { await s.click("#zamknij-szuflade"); await s.locator("#mapa").focus(); await s.keyboard.press("0"); await s.waitForTimeout(300);
  for (let fy = 0.3; fy < 0.8; fy += 0.07) for (let fx = 0.3; fx < 0.8; fx += 0.07) {
    px = m.x + m.width * fx; py = m.y + m.height * fy; await s.mouse.click(px, py);
    if (await s.locator(".karta.prowincja h2").count() && (await s.locator(".karta.prowincja .rasa").textContent()).includes("Rogus")) return true;
  } })();
assert.ok(nr, "nie znaleziono prowincji frakcji");
for (let k = 0; k < 5; k++) { await s.mouse.move(px, py); await s.mouse.wheel(0, -400); await s.waitForTimeout(150); }
const zn = s.locator(".osada.armia");
console.log("znaczniki armii:", await zn.count());
assert.ok(await zn.count(), "brak znacznika armii");
assert.ok((await zn.first().locator("img").getAttribute("src")).startsWith("data:image/png"), "ikona nie przemalowana");
assert.ok((await zn.first().getAttribute("title")).includes("150 żołnierzy"));
const bb = await zn.first().boundingBox();
await s.screenshot({ path: process.argv[2] + "/a_mapa.png", clip: { x: Math.max(0, bb.x - 120), y: Math.max(0, bb.y - 90), width: 260, height: 180 } });
await zn.first().locator("img").click();
await s.waitForTimeout(300);
assert.ok(await s.locator("section.armie form.armia").count(), "klik nie otworzył karty z armiami");
// rozwiązanie
await s.locator("form.armia [data-rozwiaz]").first().click();
assert.ok(await s.locator("section.armie .puste").count());
const st2 = (await s.locator(".bohater, .bohaterowie button").filter({ hasText: imie }).first().textContent()).replace(/\s+/g, " ");
assert.ok(st2.includes("W stolicy"), st2);
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
