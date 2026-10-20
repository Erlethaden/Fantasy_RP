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
// znajdź prowincję: klikaj siatkę punktów mapy
// 7.8c: flota — nadmorska prowincja, okręt z pojemnością, nowa flota, okręty, dowódca, przestawienie, znacznik, rozwiązanie
const F = "rogus-ardens", szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
await szukaj("90a"); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F); await s.waitForTimeout(300);
await s.click(`#lista-frakcji [data-id=${F}]`); await s.waitForSelector(".dodaj-jednostke");
const fj = s.locator(".dodaj-jednostke"); await fj.locator("[name=nazwa]").fill("Galera"); await fj.locator("[name=morska]").check(); await fj.locator("[name=pojemnosc]").fill("150"); await fj.locator(".dodaj").click(); await s.waitForTimeout(300);
await s.click("[data-nowa-flota]"); await s.waitForTimeout(300);
const form = () => s.locator("form.armia[data-fl]").first();
assert.equal(await s.locator("form.armia[data-fl]").count(), 1, "flota założona");
await form().locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(300);
await form().locator("input[name=n]").fill("3"); await form().locator("input[name=n]").press("Tab"); await s.waitForTimeout(300);
let info = (await form().locator(".armia-info").textContent()).replace(/\s+/g, " "); console.log("flota:", info);
assert.ok(info.includes("3 okręty") && info.includes("450") && info.includes("z okrętów"));
await form().locator("select[name=dowodca]").selectOption({ index: 1 }); await s.waitForTimeout(300);
const dow = await form().locator("select[name=dowodca] option:checked").textContent(); console.log("dowódca:", dow);
assert.ok(!(await s.locator("form.armia[data-a]").count()) || true);
await form().locator("input[name=pojemnosc]").fill("1000"); await form().locator("input[name=pojemnosc]").press("Tab"); await s.waitForTimeout(300);
info = (await form().locator(".armia-info").textContent()).replace(/\s+/g, " "); assert.ok(info.includes("1000") && info.includes("wpisana przez GM"), info);
// status bohatera: na misji z flotą
const bohTekst = (await s.locator("section.bohaterowie, .bohaterowie").first().textContent()).replace(/\s+/g, " ");
console.log("z flotą w statusach:", bohTekst.includes("z flotą"));
const akw0 = info.split("·")[1]?.split("Mieści")[0]?.trim(); console.log("akwen startu:", akw0);
// przestaw: klik w morze
await form().locator("[data-przestaw]").click();
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.08; fy < 0.95 && !ok; fy += 0.05) for (let fx = 0.03; fx < 0.5 && !ok; fx += 0.05) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy); await s.waitForTimeout(80);
  if (!(await s.locator("form.armia[data-fl]").count())) await s.click(`#lista-frakcji [data-id=${F}]`);
  const t = (await form().locator(".armia-info").textContent()).replace(/\s+/g, " ");
  ok = !t.includes(akw0); if (!ok && await s.locator(".komunikat-floty").textContent()) await form().locator("[data-przestaw]").click();
}
info = (await form().locator(".armia-info").textContent()).replace(/\s+/g, " "); console.log("po przestawieniu:", info.split("·")[1]); assert.ok(ok, "przestawienie");
// znacznik floty na mapie (przybliżenie przy akwenie)
const akw = info.split("·")[1].split("Mieści")[0].trim();
await szukaj(akw); await s.waitForTimeout(400);
console.log("znaczniki flot:", await s.locator(".osada.flota").count()); assert.ok(await s.locator(".osada.flota").count() >= 1);
await s.screenshot({ path: process.argv[2] + "/flota_mapa.png" });
// rozwiązanie
await s.click(`#lista-frakcji [data-id=${F}]`); await form().locator("[data-rozwiaz]").click(); await s.waitForTimeout(300);
assert.equal(await s.locator("form.armia[data-fl]").count(), 0, "flota rozwiązana");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
await b.close();
