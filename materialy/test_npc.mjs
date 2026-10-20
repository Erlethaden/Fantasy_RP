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
// 7.10: samodzielny kraj NPC — Panel GM → dodaj z kolorem → prowincja → zmiana rodzaju
await s.click("#panel-gm"); await s.waitForSelector(".dodaj-npc");
await s.fill(".dodaj-npc input[name=nazwa]", "Wolne Miasto Testowe");
await s.selectOption(".dodaj-npc select[name=rodzaj]", "samodzielny");
assert.ok(await s.locator(".dodaj-npc select[name=zwierzchnik]").isHidden(), "zwierzchnik ukryty");
await s.locator(".dodaj-npc input[name=kolor]").evaluate(e => { e.value = "#11aa55"; });
await s.click(".dodaj-npc .dodaj"); await s.waitForTimeout(300);
const li = s.locator(".lista-npc li", { has: s.locator("input[value='Wolne Miasto Testowe']") });
assert.equal(await li.count(), 1, "kraj na liście");
assert.equal(await li.locator("input[name=kolor]").inputValue(), "#11aa55");
assert.equal(await li.locator("select[name=zwierzchnik]").count(), 0, "bez zwierzchnika");
const tlo = await li.locator(".probka").evaluate(e => getComputedStyle(e).backgroundColor); console.log("próbka:", tlo); assert.equal(tlo, "rgb(17, 170, 85)");
const wTraktatach = await s.locator(".nowy-traktat .strony-traktatu label", { hasText: "Wolne Miasto Testowe" }).count(); assert.equal(wTraktatach, 1, "strona traktatu");
// prowincja
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
const opcja = await s.locator(".edycja-prowincji select[name=wlasciciel] option", { hasText: "Wolne Miasto Testowe" }).first();
console.log("opcja:", await opcja.textContent());
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", await opcja.getAttribute("value")); await s.waitForTimeout(300);
const rasa = await s.locator(".karta.prowincja .rasa").textContent(); console.log("karta:", rasa); assert.ok(rasa.includes("kraj NPC — samodzielny"));
// rodzaj: samodzielny → wasal → samodzielny (kolor zostaje zapamiętany na nowo z odcienia)
await s.click("#panel-gm"); await s.waitForSelector(".lista-npc"); if (!(await s.locator(".lista-npc").count())) await s.click("#panel-gm");
const li2 = () => s.locator(".lista-npc li", { has: s.locator("input[value='Wolne Miasto Testowe']") });
await li2().locator("select[name=rodzaj]").selectOption("wasal"); await s.waitForTimeout(300);
assert.equal(await li2().locator("select[name=zwierzchnik]").count(), 1, "wasal ma zwierzchnika");
assert.equal(await li2().locator("input[name=kolor]").count(), 0);
await li2().locator("select[name=rodzaj]").selectOption("samodzielny"); await s.waitForTimeout(300);
assert.equal(await li2().locator("input[name=kolor]").count(), 1, "znów kolor");
console.log("ile prow.:", await li2().locator(".ile").textContent());
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
await b.close();
