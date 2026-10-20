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
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "nie znaleziono prowincji");
const nr = await s.locator(".karta.prowincja h2").textContent(); console.log("prowincja:", nr);
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "rogus-ardens");
await s.waitForSelector("select[data-slot]");
const sloty = await s.locator("select[data-slot]").count(); console.log("sloty:", sloty);
assert.ok(sloty >= 1);
const opcje = await s.locator("select[data-slot='0'] option").allTextContents();
assert.ok(opcje.includes("Irno"), "brak unikalnego Irno: " + opcje);
await s.selectOption("select[data-slot='0']", "u:Irno");
await s.selectOption("select[data-slot='1']", { index: 1 });   // pierwszy wspólny zasób
const wspolny = await s.locator("select[data-slot='1'] option:checked").textContent();
await s.selectOption("select[data-zloze]", "u:Irno");
assert.equal(await s.locator("select[data-slot='0']").inputValue(), "u:Irno");
await s.locator("section", { has: s.locator("h3", { hasText: "Budynki i złoże" }) }).screenshot({ path: process.argv[2] + "/b_prowincja.png" });
// karta frakcji: podsumowanie
await s.click("#lista-frakcji [data-id=rogus-ardens]");
const sek = s.locator("section", { has: s.locator("h3", { hasText: "Budynki i złoża" }) });
const txt = await sek.textContent(); console.log("frakcja:", txt.replace(/\s+/g, " "));
assert.ok(/Irno.*budynki: 1.*złoża: 1/.test(txt.replace(/\s+/g, " ")));
assert.ok(txt.includes(`puste: ${sloty - 2}`) || (sloty === 2 && txt.includes("wszystkie zajęte")));
assert.ok(txt.includes("👁 jawne"), "domyślnie jawne"); assert.ok(txt.includes("4 sloty"));
await sek.screenshot({ path: process.argv[2] + "/b_frakcja.png" });
// podbój: wróć do prowincji, zmień właściciela na Goblandię
await s.mouse.click(10, 10); // nic
await s.click("#lista-frakcji [data-id=rogus-ardens]");
// otwórz prowincję ponownie przez kliknięcie mapy w ten sam punkt — szukamy po nazwie
ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
  ok = (await s.locator(".karta.prowincja h2").count()) && (await s.locator(".karta.prowincja h2").textContent()) === nr;
}
assert.ok(ok, "nie wrócono do prowincji");
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "goblandia");
await s.waitForTimeout(300);
assert.equal(await s.locator("select[data-slot='0']").inputValue(), "", "unikalny po podboju powinien zniknąć");
assert.equal(await s.locator("select[data-slot='1'] option:checked").textContent(), wspolny, "wspólny zostaje");
assert.equal(await s.locator("select[data-zloze]").inputValue(), "");
await s.click("#lista-frakcji [data-id=rogus-ardens]");
assert.ok(!(await sek.count()), "Rogus nie ma już budynków");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
