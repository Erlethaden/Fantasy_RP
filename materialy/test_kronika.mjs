// test 7.2 (DEMO): kronika — wojna, traktat, zmiana właściciela, wpis GM (tajny), kopiowanie, karta frakcji, cofnięcie tury
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const s = await ctx.newPage();
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(3000);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const tekst = async sel => (await s.locator(sel).first().textContent()).replace(/\s+/g, " ");
const m = await s.locator("#mapa").boundingBox();
// zmiana właściciela prowincji
let ok = false;
for (let fy = 0.45; fy < 0.7 && !ok; fy += 0.04) for (let fx = 0.42; fx < 0.6 && !ok; fx += 0.04) { await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy); ok = await s.locator(".edycja-prowincji").count() > 0; }
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "goblandia"); await s.waitForTimeout(200);
// wojna + traktat jawny + tajny
await s.click("#panel-gm");
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia"); await s.click(".nowa-wojna button.dodaj");
const traktat = async (nazwa, typ, tajny) => {
  await s.fill(".nowy-traktat input[name=nazwa]", nazwa); await s.selectOption(".nowy-traktat select[name=typ]", typ);
  for (const w of ["rogus-ardens", "goblandia"]) await s.check(`.nowy-traktat input[name=strona][value=${w}]`);
  if (tajny) await s.check(".nowy-traktat input[name=tajny]");
  await s.click(".nowy-traktat button.dodaj"); await s.waitForTimeout(200);
};
await traktat("Pokój Siarki", "pokoj", false);
await traktat("Tajny Pakt", "pakt", true);
// kronika
await s.click("#kronika"); await s.waitForSelector("article.kronika");
let k = await tekst("article.kronika");
console.log("kronika:", k.slice(0, 400));
for (const fraza of ["Goblandia", "wypowiada wojnę", "Pokój Siarki", "🔒", "Tajny Pakt", "ziemia niczyja → Goblandia"]) assert.ok(k.includes(fraza), "brak: " + fraza);
// wpis GM tajny wymaga krajów
await s.fill(".nowy-wpis textarea", "Zaraza w stolicy."); await s.check(".nowy-wpis input[name=tajny]");
await s.click(".nowy-wpis button.dodaj"); assert.ok((await tekst(".komunikat-kroniki")).includes("Zaznacz"));
await s.check(".nowy-wpis input[name=widza][value=goblandia]"); await s.click(".nowy-wpis button.dodaj"); await s.waitForTimeout(200);
assert.ok((await tekst("article.kronika")).includes("Zaraza w stolicy."));
// kopiuj na Discorda: tylko jawne
await s.locator(".kopiuj-ture").first().click(); await s.waitForTimeout(200);
const schowek = await s.evaluate(() => navigator.clipboard.readText());
console.log("discord:", schowek.replace(/\n/g, " | "));
assert.ok(schowek.startsWith("**📜 Kronika — tura 1**") && schowek.includes("Pokój Siarki") && !schowek.includes("Tajny Pakt") && !schowek.includes("Zaraza"));
await s.locator("article.kronika").screenshot({ path: process.argv[2] + "/k_kronika.png" });
// Kronikarz Zgrzyt (13.2): opowieść z danych wpisów — tajny pakt i tajny wpis GM tylko w szeptach
const o = await s.evaluate(() => window.opowiescTury(1)), jawny = o.akapity.join(" ");
console.log("zgrzyt:", jawny.slice(0, 600)); console.log("szepty:", JSON.stringify(o.szepty).slice(0, 400));
for (const fraza of ["Rogus Ardens", "Goblandia", "Pokój Siarki"]) assert.ok(jawny.includes(fraza), "Zgrzyt nie mówi o: " + fraza);
assert.ok(!/Tajny Pakt|Zaraza|Zgrzyt znalazł w kronice/.test(jawny), "tajemnica albo wpis bez danych w części jawnej");
assert.ok(o.szepty.goblandia.join(" ").includes("Zaraza") && o.szepty.goblandia.join(" ").includes("Tajny Pakt"), "szept Goblandii");
assert.ok(o.szepty["rogus-ardens"].join(" ").includes("Tajny Pakt") && !o.szepty["rogus-ardens"].join(" ").includes("Zaraza"), "szept Rogus Ardens");
// karta frakcji
await s.click("#lista-frakcji [data-id=goblandia]");
assert.ok((await tekst("section.kronika-frakcji")).includes("Tura 1"));
// cofnięcie tury usuwa wpisy z zamknięcia (bitwy) — zamknij turę z bitwą nie ma armii, więc sprawdzamy tylko, że zwykłe wpisy zostają
await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(200); await s.click("#cofnij-ture"); await s.waitForTimeout(200);
await s.click("#kronika"); assert.ok((await tekst("article.kronika")).includes("Pokój Siarki"));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
