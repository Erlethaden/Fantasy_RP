// test 7.1e–7.1h (DEMO): wojna w Panelu GM, bitwa przy zamknięciu tury (ta sama prowincja), cofnięcie, zakończenie bitwy, rozwiązanie armii < 100
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = [], okna = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => { okna.push(d.message()); d.accept(); });
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const m = await s.locator("#mapa").boundingBox();
const tekst = async sel => (await s.locator(sel).first().textContent()).replace(/\s+/g, " ");
// dwie prowincje: A (Rogus), B (Goblandia)
const prowincje = [];
for (let fy = 0.35; fy < 0.8 && prowincje.length < 2; fy += 0.06) for (let fx = 0.35; fx < 0.75 && prowincje.length < 2; fx += 0.06) {
  await s.click("#zamknij-szuflade").catch(() => {});
  const x = m.x + m.width * fx, y = m.y + m.height * fy; await s.mouse.click(x, y);
  if (!(await s.locator(".edycja-prowincji").count())) continue;
  const nr = await tekst(".karta.prowincja h2"); if (prowincje.some(p => p.nr === nr)) continue;
  await s.selectOption(".edycja-prowincji select[name=wlasciciel]", prowincje.length ? "goblandia" : "rogus-ardens");
  prowincje.push({ nr, x, y });
}
assert.equal(prowincje.length, 2);
// armia z oddziałem 150 dla frakcji
async function armia(F, liczba) {
  if (await s.locator(`#lista-frakcji [data-id=${F}]`).getAttribute("aria-current") !== "true" || !(await s.locator("[data-nowa-armia]").count())) {
    await s.click("#panel-gm"); await s.click(`#lista-frakcji [data-id=${F}]`);
  }
  if (!(await s.locator(".lista-jednostek li").count())) { await s.fill(".dodaj-jednostke input[name=nazwa]", "Piechota"); await s.click(".dodaj-jednostke button.dodaj"); }
  await s.click("[data-nowa-armia]");
  const f = s.locator("form.armia").last();
  await f.locator("[data-dodaj-oddzial]").click();
  await s.locator("form.armia").last().locator("input[name=n]").last().fill(String(liczba));
  await s.locator("form.armia").last().locator("input[name=n]").last().press("Tab"); await s.waitForTimeout(200);
}
await armia("rogus-ardens", 150);
await armia("goblandia", 150);
// Goblandia przestawia armię do prowincji A
await s.locator("form.armia").last().locator("[data-przestaw]").click();
await s.mouse.click(prowincje[0].x, prowincje[0].y);
assert.ok((await tekst("form.armia .armia-info")).includes(prowincje[0].nr), "przestawienie do A");
// bez wojny: zamknięcie tury nie daje bitwy
await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(300);
await s.click("#lista-frakcji [data-id=goblandia]");
assert.ok(!(await tekst("form.armia .armia-info")).includes("W bitwie"), "bitwa bez wojny");
// wojna
await s.click("#panel-gm");
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia");
await s.click(".nowa-wojna button.dodaj");
assert.ok((await tekst("section.wojny")).includes("Rogus Ardens ⚔ Goblandia"));
await s.click("#lista-frakcji [data-id=goblandia]");
assert.ok((await tekst(".wojna")).includes("Rogus Ardens"));
// zamknięcie tury → bitwa; cofnięcie → brak; znowu → bitwa; zakończ
const turaIBitwa = async () => { await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(300); await s.click("#lista-frakcji [data-id=goblandia]"); return (await tekst("form.armia .armia-info")).includes("W bitwie"); };
assert.ok(await turaIBitwa(), "brak bitwy po spotkaniu w wojnie");
console.log("bitwa:", (await tekst("form.armia .armia-info")).match(/⚔ W bitwie[^·]*/)?.[0]);
await s.click("#panel-gm"); await s.click("#cofnij-ture"); await s.waitForTimeout(300);
await s.click("#lista-frakcji [data-id=goblandia]");
assert.ok(!(await tekst("form.armia .armia-info")).includes("W bitwie"), "cofnięcie nie usunęło bitwy");
assert.ok(await turaIBitwa());
// 7.1h: ekran bitwy — obie strony, poziomy, straty, wynik
await s.locator("form.armia [data-ekran-bitwy]").first().click();
await s.waitForSelector("#bitwa[open]");
assert.equal(await s.locator("#bitwa .strona").count(), 2, "dwie strony");
const ekran = await tekst("#bitwa");
assert.ok(ekran.includes("VS") && ekran.includes("Regularne") && ekran.includes("Rogus Ardens") && ekran.includes("Goblandia"), "treść ekranu");
await s.locator("#bitwa").screenshot({ path: process.argv[2] + "/b_ekran.png" });
await s.locator("#bitwa .straty").first().fill("50");
await s.selectOption("#bitwa select[name=zwyciezca]", "0");
await s.fill("#bitwa textarea[name=opis]", "Krwawa bitwa.");
await s.click("#bitwa .koniec-bitwy button.dodaj"); await s.waitForTimeout(300);
assert.ok(!(await s.locator("#bitwa[open]").count()), "okno zamknięte");
await s.click("#panel-gm"); await s.click("#lista-frakcji [data-id=rogus-ardens]");
const rog = await tekst("section.armie");
console.log("rogus po bitwie:", rog.match(/\d+ żołnierzy/)?.[0], "|", rog.match(/⚔ Tura[^⚔]*⚔[^—]*— [^⚔]*/)?.[0]);
assert.ok(rog.includes("100 żołnierzy"), "straty nie odjęte");
assert.ok(rog.includes("zwycięstwo") && !rog.includes("W bitwie"), "historia / koniec bitwy");
await s.locator("[data-bitwa]").first().click(); await s.waitForSelector("#bitwa[open]");
assert.ok((await tekst("#bitwa")).includes("Krwawa bitwa.") && (await tekst("#bitwa")).includes("−50"), "wynik i straty na ekranie zakończonej bitwy");
await s.locator("#bitwa").screenshot({ path: process.argv[2] + "/b_wynik.png" });
await s.click("#bitwa .zamknij");
await s.click("#lista-frakcji [data-id=goblandia]");
// rozwiązanie: druga armia Goblandii z 50 żołnierzami
await armia("goblandia", 50);
assert.equal(await s.locator("form.armia").count(), 2);
await s.click("#panel-gm"); okna.length = 0; await s.click("#zamknij-ture"); await s.waitForTimeout(300);
assert.ok(okna[0].includes("Zostaną rozwiązane"), "brak ostrzeżenia o rozwiązaniu");
await s.click("#lista-frakcji [data-id=goblandia]");
assert.equal(await s.locator("form.armia").count(), 1, "słaba armia nie rozwiązana");
await s.click("#panel-gm"); await s.click("#cofnij-ture"); await s.waitForTimeout(300);
await s.click("#lista-frakcji [data-id=goblandia]");
assert.equal(await s.locator("form.armia").count(), 2, "cofnięcie nie przywróciło armii");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
