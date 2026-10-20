// test 7.8e krok 1 (DEMO): cel armii za morzem → trasa ląd–morze–ląd, wybór flot do przeprawy, ostrzeżenie o pojemności, podgląd na mapie
// node test_przeprawa.mjs <folder>  (serwer: npm run dev -- --port 5174)
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
const OUT = process.argv[2], F = "rogus-ardens";
const szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
const karta = async () => { if (!(await s.locator("[data-nowa-armia]").isVisible().catch(() => false))) { await s.click(`#lista-frakcji [data-id=${F}]`); await s.waitForTimeout(250); } };
const srodek = async () => { const m = await s.locator("#mapa").boundingBox(), sz = await s.locator("#szuflada").boundingBox(); return [(m.x + sz.x) / 2, m.y + m.height / 2]; };   // mapa centruje wynik wyszukiwania obok szuflady
const fa = () => s.locator("form.armia[data-a]").first(), info = async () => (await fa().locator(".armia-info").textContent()).replace(/\s+/g, " ");
// Rogus: D154 (armia) i okręty; dwie floty: 3 galery po 150 (450) i druga bez okrętów z pojemnością (bez limitu)
for (const p of ["D154", "D183"]) { await szukaj(p); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F); await s.waitForTimeout(250); }   // D183 — nadmorska, tam staną floty
await karta();
const fj = s.locator(".dodaj-jednostke");
await fj.locator("[name=nazwa]").fill("Chochliki"); await fj.locator(".dodaj").click(); await s.waitForTimeout(250);
await fj.locator("[name=nazwa]").fill("Galera"); await fj.locator("[name=morska]").check(); await fj.locator("[name=pojemnosc]").fill("150"); await fj.locator(".dodaj").click(); await s.waitForTimeout(250);
await s.click("[data-nowa-armia]"); await s.waitForTimeout(250);
await fa().locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(250);
await fa().locator("input[name=n]").first().fill("900"); await fa().locator("input[name=n]").first().press("Tab"); await s.waitForTimeout(250);
await karta(); await fa().locator("[data-przestaw]").click(); await szukaj("D154"); await s.mouse.click(...await srodek()); await s.waitForTimeout(400);
for (const nazwa of ["Flota Siarki", "Flota Popiołu"]) {
  await karta(); await s.click("[data-nowa-flota]"); await s.waitForTimeout(250);
  const ff = s.locator("form.armia[data-fl]").last(); await ff.locator("[name=nazwa]").fill(nazwa); await ff.locator("[name=nazwa]").press("Tab"); await s.waitForTimeout(250);
}
{ const ff = s.locator("form.armia[data-fl]").first(); await ff.locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(250);
  await ff.locator("input[name=n]").fill("3"); await ff.locator("input[name=n]").press("Tab"); await s.waitForTimeout(250); }
// cel: D60 (osobny ląd na północ)
let t = "";
for (const [dx, dy] of [[0, 0], [25, 0], [-25, 0], [0, 25], [0, -25]]) {
  await karta(); await fa().locator("[data-cel]").click(); await szukaj("D60"); const [x, y] = await srodek(); await s.mouse.click(x + dx, y + dy); await s.waitForTimeout(400);
  await karta(); t = await info(); if (t.includes("przez morze")) break;
}
console.log("cel:", t.split("Cel:")[1]);
assert.ok(t.includes("przez morze") && t.includes("wybierz floty"), t);
// transport: najpierw 450 miejsc (za mało), potem obie floty (bez limitu)
await fa().locator(".transport input").first().check(); await s.waitForTimeout(300); t = await info(); console.log("1 flota:", t.split("Floty:")[1]);
assert.ok(t.includes("450") && t.includes("się nie mieści"), t);
await fa().locator(".transport input").nth(1).check(); await s.waitForTimeout(300); t = await info(); console.log("2 floty:", t.split("Floty:")[1]);
assert.ok(t.includes("bez limitu") && !t.includes("się nie mieści"), t);
// mapa: trasa ląd–morze–ląd
await szukaj("D60"); await s.click("#zamknij-szuflade").catch(() => {}); await s.waitForTimeout(300);
const m = await s.locator("#mapa").boundingBox(); await s.mouse.move(m.x + m.width / 2, m.y + m.height / 2 + 150);
await s.mouse.wheel(0, 300); await s.waitForTimeout(800);
await s.locator("#mapa").screenshot({ path: OUT + "/przeprawa.png" });
// 7.8e-2: tury — floty płyną do załadunku, armia wchodzi na pokład, płynie, schodzi na ląd i idzie do D60
const tura = async () => { await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(400); await karta(); return info(); };
let naPokladzie = false, kroki = [];
for (let n = 1; n <= 14; n++) {
  t = await tura(); const gdzie = t.split("żołnierzy ·")[1]?.split("Cel:")[0].trim(); kroki.push(gdzie);
  console.log(`tura ${n}:`, gdzie, "|", t.split("Cel:")[1]?.slice(0, 90));
  if (t.includes("na pokładzie") && !naPokladzie) {
    naPokladzie = true;
    const fl = (await s.locator("form.armia[data-fl] .armia-info").first().textContent()).replace(/\s+/g, " ");
    assert.ok(fl.includes("Na pokładzie"), "ładunek na karcie floty: " + fl);
    await s.click("#zamknij-szuflade").catch(() => {}); await s.waitForTimeout(300);
    await s.locator("#mapa").screenshot({ path: OUT + "/przeprawa_na_morzu.png" });
    // cofnięcie tury zdejmuje z pokładu, ponowne zamknięcie znowu ładuje
    await s.click("#panel-gm"); await s.click("#cofnij-ture"); await s.waitForTimeout(400); await karta();
    assert.ok(!(await info()).includes("na pokładzie"), "cofnięcie załadunku");
    t = await tura(); assert.ok(t.includes("na pokładzie"), "ponowny załadunek");
  }
  if (gdzie?.startsWith("Prowincja D60")) break;
}
assert.ok(naPokladzie, "armia nie weszła na pokład");
assert.ok(kroki.at(-1).startsWith("Prowincja D60"), "armia nie dotarła: " + kroki.at(-1));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
