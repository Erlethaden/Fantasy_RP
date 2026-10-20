import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
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
// wyszukiwarka: numer prowincji, akwen (jezioro), Enter z częścią tekstu
await s.click("#szukaj"); await s.fill("#szukaj", "63b"); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400);
const h = await s.locator(".karta.prowincja h2").textContent(); console.log("szukaj 63b:", h); assert.ok(h.includes("63b"));
assert.equal(await s.inputValue("#szukaj"), "", "pole wyczyszczone");
const opcje = await s.locator("#lista-szukaj option").count(); console.log("podpowiedzi:", opcje); assert.ok(opcje > 1000);
await s.click("#szukaj"); await s.fill("#szukaj", "Akwen 12 — jezioro"); await s.waitForTimeout(400);   // dokładna podpowiedź (jak wybór z listy)
const a = await s.locator(".karta.akwen .rasa").textContent(); console.log("akwen:", a); assert.ok(a.startsWith("jezioro"));
const sas = await s.locator(".karta.akwen [data-a]").allTextContents(); console.log("sąsiedzi A12:", sas.join(" | ")); assert.ok(sas.some(t => t.includes("przez rzekę")));
// umiejętność żeglugi na karcie frakcji (GM w DEMO)
await s.click("#lista-frakcji [data-id=rogus-ardens]"); await s.waitForTimeout(300);
assert.equal(await s.locator("[data-przejscie=zegluga]").count(), 1, "żegluga");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
await b.close();
