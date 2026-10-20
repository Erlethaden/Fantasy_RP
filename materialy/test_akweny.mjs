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
// 7.8a: klik w morze → karta akwenu; GM nadaje nazwę; sąsiedni akwen; prowincja z wybrzeża
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.1; fy < 0.9 && !ok; fy += 0.04) for (let fx = 0.25; fx < 0.75 && !ok; fx += 0.04) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = await s.locator(".karta.akwen").count() > 0;
}
assert.ok(ok, "nie trafiono w akwen");
const nazwa0 = await s.locator(".karta.akwen h2").textContent(); console.log("akwen:", nazwa0, "|", await s.locator(".karta.akwen .rasa").textContent());
assert.ok(/^Akwen \d+$/.test(nazwa0));
await s.fill(".karta.akwen input[name=nazwa]", "Morze Próbne"); await s.press(".karta.akwen input[name=nazwa]", "Tab"); await s.waitForTimeout(300);
assert.equal(await s.locator(".karta.akwen h2").textContent(), "Morze Próbne");
const sas = await s.locator(".karta.akwen [data-a]").count(), brzeg = await s.locator(".karta.akwen [data-i]").count(); console.log("sąsiednie:", sas, "wybrzeże:", brzeg);
assert.ok(sas > 0);
await s.locator(".karta.akwen [data-a]").first().click(); await s.waitForTimeout(300);
const n2 = await s.locator(".karta.akwen h2").textContent(); assert.notEqual(n2, "Morze Próbne"); console.log("sąsiad:", n2);
assert.ok(await s.locator(".karta.akwen [data-a]", { hasText: "Morze Próbne" }).count() > 0, "nazwa widoczna u sąsiada");
if (await s.locator(".karta.akwen [data-i]").count()) { await s.locator(".karta.akwen [data-i]").first().click(); await s.waitForTimeout(300); assert.ok(await s.locator(".edycja-prowincji select[name=wlasciciel]").count(), "prowincja z wybrzeża"); }
for (let k = 0; k < 4; k++) { await s.mouse.move(m.x + m.width / 2, m.y + m.height / 2); await s.mouse.wheel(0, -400); await s.waitForTimeout(150); }
await s.waitForTimeout(400); await s.screenshot({ path: process.argv[2] + "/akwen.png" });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
await b.close();
