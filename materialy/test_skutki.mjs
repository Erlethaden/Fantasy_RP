// test 7.1i skutków bitwy (na bazie test_bitwy): 7.1e–7.1h (DEMO): wojna w Panelu GM, bitwa przy zamknięciu tury (ta sama prowincja), cofnięcie, zakończenie bitwy, rozwiązanie armii < 100
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = [], okna = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => { okna.push(d.message()); d.accept(); });
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
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
// dowódca-bohater w armii Rogus Ardens (przed otwarciem ekranu — raport bierze bieżący skład)
await s.click("#lista-frakcji [data-id=rogus-ardens]"); await s.locator("form.armia[data-a] select[name=dowodca]").first().selectOption({ index: 1 }); await s.waitForTimeout(300);
const bohater = await s.locator("form.armia[data-a] select[name=dowodca] option:checked").first().textContent(); console.log("dowódca Rogus:", bohater);
await s.locator("form.armia [data-ekran-bitwy]").first().click();
await s.waitForSelector("#bitwa[open]");
assert.equal(await s.locator("#bitwa .strona").count(), 2, "dwie strony");
const ekran = await tekst("#bitwa");
assert.ok(ekran.includes("VS") && ekran.includes("Regularne") && ekran.includes("Rogus Ardens") && ekran.includes("Goblandia"), "treść ekranu");
// wygrywa Goblandia (strona 1) na ziemi Rogus Ardens i zdobywa prowincję; Rogus: odwrót (auto), bohater w niewoli
const wyniki = await s.locator("#bitwa select[name=zwyciezca] option").allTextContents(); const zw = wyniki.findIndex(t => t.includes("Goblandia")); console.log("wyniki:", wyniki.join(" | "));
await s.selectOption("#bitwa select[name=zwyciezca]", String(zw));
await s.locator(`#bitwa [data-bohater]`).first().selectOption("niewola");
await s.check("#bitwa input[name=zdobywa]");
await s.click("#bitwa .koniec-bitwy button.dodaj"); await s.waitForTimeout(400);
assert.ok(!(await s.locator("#bitwa[open]").count()), "okno zamknięte");
// prowincja A zdobyta
await s.click("#zamknij-szuflade").catch(() => {}); await s.mouse.click(prowincje[0].x, prowincje[0].y); await s.waitForTimeout(300);
const wl = await s.locator(".edycja-prowincji select[name=wlasciciel] option:checked").textContent(); console.log("właściciel A:", wl); assert.equal(wl.trim(), "Goblandia", "zdobycie");
// armia Rogus cofnęła się, bez celu; bohater w niewoli
await s.click("#lista-frakcji [data-id=rogus-ardens]");
const info = await tekst("form.armia[data-a] .armia-info"); console.log("Rogus po bitwie:", info);
assert.ok(!info.includes(prowincje[0].nr + " ") && !info.includes("Cel:"), "odwrót");
const boh = await tekst("section.bohaterowie, .bohaterowie"); assert.ok(boh.includes("W niewoli (u: Goblandia)"), "niewola: " + boh.slice(0, 300));
assert.ok(!(await s.locator("form.armia[data-a] select[name=dowodca] option", { hasText: bohater }).count()), "jeniec nie do wyboru jako dowódca");
// ekran zakończonej bitwy pokazuje los
await s.locator("[data-bitwa]").first().click(); await s.waitForSelector("#bitwa[open]");
const ekr = await tekst("#bitwa"); console.log("los na ekranie:", ekr.match(/odwrót →[^R]*/)?.[0], "|", ekr.includes("⛓ w niewoli"));
assert.ok(ekr.includes("odwrót →") && ekr.includes("⛓ w niewoli"));
await s.locator("#bitwa").screenshot({ path: process.argv[2] + "/skutki.png" }); await s.click("#bitwa .zamknij");
// kronika
await s.click("#kronika"); await s.waitForTimeout(300); const kr = await tekst("#szuflada"); assert.ok(kr.includes("Po bitwie") && kr.includes("zdobywa prowincję"), "kronika");
// Kronikarz Zgrzyt (13.2): wynik bitwy z danymi — zwycięzca, zdobycz (bez drugiego akapitu o zmianie właściciela), jeniec
const opow = await s.evaluate(() => [1, 2, 3].map(nr => window.opowiescTury(nr).akapity.join(" ")).join(" "));
console.log("zgrzyt:", opow.slice(0, 900));
assert.ok(/wygrywa|Zwycięzca/.test(opow) && opow.includes("Elmon Devil") && !opow.includes("Zgrzyt znalazł w kronice"), "opowieść o bitwie");
assert.ok(!/zmienia pana|wbija flagę/.test(opow), "zdobycz opowiedziana dwa razy");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
await b.close();
