// test 7.9a (DEMO, GM): szuflada „Bloki”, założenie bloku, sekcja na karcie frakcji, zmiana członków, kronika, rozwiązanie → node test_bloki.mjs <folder>
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
const OUT = process.argv[2], tekst = async sel => (await s.locator(sel).first().textContent()).replace(/\s+/g, " ");
const zaznacz = async (form, nazwa, wartosci) => { for (const w of wartosci) await form.locator(`input[name=${nazwa}][value="${w}"]`).check(); };
// nowy blok
await s.click("#bloki"); await s.waitForSelector(".karta.bloki");
assert.ok((await tekst(".karta.bloki")).includes("Nie ma jeszcze"));
const f = s.locator(".nowy-blok form");
await f.locator("[name=nazwa]").fill("Liga Ognia i Złota"); await f.locator("[name=skrot]").fill("log");
await f.locator("[name=rodzaj]").selectOption("liga");
await f.locator("[name=opis]").fill("Wolny handel i wspólna obrona przed Grobowym Imperium.");
await f.locator(".dodaj").click(); await s.waitForTimeout(250);
assert.ok((await tekst(".komunikat-bloku")).includes("co najmniej jednego"), "bez członków");
await zaznacz(f, "czlonek", ["rogus-ardens", "goblandia", "aurelia"]); await zaznacz(f, "zaproszony", ["krag-mhor"]); await zaznacz(f, "traktat", ["handel", "pakt"]);
await f.locator(".dodaj").click(); await s.waitForTimeout(300);
let t = await tekst(".lista-blokow");
console.log("blok:", t.slice(0, 220));
assert.ok(t.includes("Liga Ognia i Złota") && t.includes("LOG") && t.includes("3 członków") && t.includes("Zaproszeni: Krag-Mhor") && t.includes("Umowa handlowa, Pakt o nieagresji"), t);
await s.locator(".karta.bloki").screenshot({ path: OUT + "/bloki_szuflada.png" });
// karta frakcji: członek i zaproszony
await s.click("#lista-frakcji [data-id=goblandia]"); await s.waitForTimeout(300);
t = await tekst("section.bloki-frakcji"); assert.ok(t.includes("Liga Ognia i Złota") && t.includes("członkowie:"), t);
await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForTimeout(300);
t = await tekst("section.bloki-frakcji"); assert.ok(t.includes("zaproszenie"), t);
await s.click("[data-pokaz-bloki]"); await s.waitForSelector(".karta.bloki");
// zmiana: Goblandia wychodzi, Szare Kły dochodzą, tryb lidera (Aurelia)
await s.locator(".lista-blokow details summary").first().click();
const e = s.locator(".edycja-bloku").first();
await e.locator('input[name=czlonek][value="goblandia"]').uncheck(); await e.locator('input[name=czlonek][value="gor-khar"]').check();
await e.locator("[name=tryb]").selectOption("lider"); await e.locator("[name=lider]").selectOption("aurelia");
await e.locator(".dodaj").click(); await s.waitForTimeout(300);
t = await tekst(".lista-blokow"); console.log("po zmianie:", t.slice(0, 200));
const czl = await tekst(".blok-czlonkowie");
assert.ok(t.includes("lider: Aurelia") && czl.includes("Aurelia ★") && !czl.includes("Goblandia") && czl.includes("Królestwo Szarych Kłów"), czl);
// kronika
await s.click("#kronika"); await s.waitForTimeout(300);
t = await tekst(".karta.kronika"); console.log("kronika:", t.slice(0, 260));
assert.ok(t.includes("Powstaje Liga Ognia i Złota (LOG)") && t.includes("Królestwo Szarych Kłów — do bloku") && t.includes("Goblandia — poza blokiem"), t);
// rozwiązanie
await s.click("#bloki"); await s.waitForSelector(".karta.bloki");
await s.locator(".lista-blokow details summary").first().click(); await s.locator("[data-rozwiaz-blok]").first().click(); await s.waitForTimeout(300);
assert.ok((await tekst(".karta.bloki")).includes("Nie ma jeszcze"), "blok nie rozwiązany");
await s.click("#kronika"); await s.waitForTimeout(300); assert.ok((await tekst(".karta.kronika")).includes("Rozwiązanie bloku Liga Ognia i Złota"));
// po przeładowaniu (DEMO, localStorage) — kronika zostaje, bloku nie ma
await s.reload(); await s.waitForTimeout(1500); await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForTimeout(2000); await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("#bloki"); await s.waitForSelector(".karta.bloki"); assert.ok((await tekst(".karta.bloki")).includes("Nie ma jeszcze"));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
