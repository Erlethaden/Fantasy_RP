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
// 7.8b: okręty w jednostkach frakcji
await s.click("#lista-frakcji [data-id=rogus-ardens]"); await s.waitForSelector(".dodaj-jednostke");
const f = s.locator(".dodaj-jednostke");
assert.ok(await f.locator("[name=pojemnosc]").isHidden(), "pojemność ukryta bez okrętu");
await f.locator("[name=nazwa]").fill("Galera ognia"); await f.locator("[name=morska]").check();
assert.ok(await f.locator("[name=pojemnosc]").isVisible());
await f.locator("[name=pojemnosc]").fill("150"); await f.locator(".dodaj").click(); await s.waitForTimeout(300);
const sek = s.locator("section.jednostki");
const h4 = await sek.locator("h4").allTextContents(); console.log("grupy:", h4.join(", ")); assert.ok(h4.includes("Okręty"));
const okr = await sek.locator("h4:text('Okręty') + ul li").first().textContent(); console.log("okręt:", okr.replace(/\s+/g, " ")); assert.ok(okr.includes("mieści 150"));
// armia: okręt nie do wyboru w oddziałach
await s.click("[data-nowa-armia]"); await s.waitForTimeout(300);
const lad = await s.locator("form.armia").first().locator("[data-dodaj-oddzial]").count();
if (lad) { await s.locator("form.armia").first().locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(300);
  const opcje = await s.locator("form.armia").first().locator("select[name=j] option").allTextContents(); console.log("oddziały:", opcje.join(", ")); assert.ok(!opcje.includes("Galera ognia")); }
// edycja: okręt → jednostka lądowa, pojemność znika
const li = sek.locator("li", { hasText: "Galera ognia" });
await li.locator("[data-akcja=edytuj]").click(); await s.locator(".edytuj-jednostke [name=morska]").uncheck(); await s.locator(".edytuj-jednostke .dodaj").click(); await s.waitForTimeout(300);
const tekst = (await sek.locator("li", { hasText: "Galera ognia" }).textContent()).replace(/\s+/g, " "); console.log("po edycji:", tekst); assert.ok(!tekst.includes("mieści"));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
await b.close();
