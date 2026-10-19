// test 7.4–7.5 (DEMO): traktaty w Panelu GM, pokój kończy wojnę, zerwanie, lista na karcie frakcji, szlak handlowy i linie sojuszy na mapie
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
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
// dwie odległe prowincje: Rogus (lewa część) i Goblandia (prawa)
const prowincje = [];
for (const [fx0, wl] of [[0.33, "rogus-ardens"], [0.62, "goblandia"]]) {
  let ok = false;
  for (let fy = 0.35; fy < 0.8 && !ok; fy += 0.05) for (let fx = fx0; fx < fx0 + 0.15 && !ok; fx += 0.04) {
    await s.click("#zamknij-szuflade").catch(() => {});
    await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy);
    ok = await s.locator(".edycja-prowincji").count() > 0;
  }
  assert.ok(ok); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", wl);
  prowincje.push(await tekst(".karta.prowincja h2"));
}
console.log("prowincje:", prowincje);
await s.click("#zamknij-szuflade");
const pikseleMapy = async () => s.locator("#mapa").screenshot().then(x => x.length);
const przed = await pikseleMapy();
// wojna, potem traktat handlowy
await s.click("#panel-gm");
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia");
await s.click(".nowa-wojna button.dodaj");
const traktat = async (nazwa, typ) => {
  await s.fill(".nowy-traktat input[name=nazwa]", nazwa); await s.selectOption(".nowy-traktat select[name=typ]", typ);
  for (const w of ["rogus-ardens", "goblandia"]) await s.check(`.nowy-traktat input[name=strona][value=${w}]`);
  await s.click(".nowy-traktat button.dodaj"); await s.waitForTimeout(200);
};
await s.click(".nowy-traktat button.dodaj");   // bez stron — komunikat
await s.fill(".nowy-traktat input[name=nazwa]", "x"); await s.click(".nowy-traktat button.dodaj");
assert.ok((await tekst(".komunikat-traktatu")).includes("dwie strony"));
await traktat("Szlak Siarki i Złota", "handel");
assert.ok((await tekst("section.traktaty")).includes("Szlak Siarki i Złota"));
await s.click("#zamknij-szuflade"); await s.waitForTimeout(300);
await s.locator("#mapa").screenshot({ path: process.argv[2] + "/t_szlak.png" });
assert.ok((await s.locator("#warstwy-mapy button").count()) === 2, "przyciski warstw");
// pokój kończy wojnę
await s.click("#panel-gm");
assert.ok((await tekst("section.wojny")).includes("Rogus Ardens ⚔ Goblandia"));
await traktat("Pokój z Kłów", "pokoj");
assert.ok((await tekst("section.wojny")).includes("Wszędzie pokój"), "pokój nie zakończył wojny");
// sojusz + warstwa sojuszy
await traktat("Wieczny Sojusz", "sojusz");
await s.click("#zamknij-szuflade");
await s.click("#warstwy-mapy [data-warstwa=sojusze]"); await s.waitForTimeout(300);
assert.equal(await s.locator("#warstwy-mapy [data-warstwa=sojusze]").getAttribute("aria-pressed"), "true");
await s.locator("#mapa").screenshot({ path: process.argv[2] + "/t_sojusz.png" });
// wojna pyta o zerwanie sojuszu → zerwany
await s.click("#panel-gm");
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia");
await s.click(".nowa-wojna button.dodaj"); await s.waitForTimeout(200);
assert.ok((await tekst("section.traktaty")).includes("zerwany"), "sojusz nie zerwany przy wojnie");
// karta frakcji
await s.click("#lista-frakcji [data-id=goblandia]");
const k = await tekst("section.traktaty");
console.log("karta:", k.slice(0, 200));
assert.ok(k.includes("Szlak Siarki i Złota") && k.includes("Wieczny Sojusz"));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
