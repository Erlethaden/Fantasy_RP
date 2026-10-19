// test 7.1c + 7.1d (DEMO): cel armii klikiem na mapie, trasa „za N tur”, rysowanie trasy, usunięcie celu, umiejętności
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
const F = "rogus-ardens", m = await s.locator("#mapa").boundingBox();
// prowincja startowa dla frakcji (szuflada zamknięta, cała mapa)
let ok = false, px = 0, py = 0;
for (let fy = 0.35; fy < 0.8 && !ok; fy += 0.05) for (let fx = 0.35; fx < 0.75 && !ok; fx += 0.05) {
  px = m.x + m.width * fx; py = m.y + m.height * fy; await s.mouse.click(px, py);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok);
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F);
await s.click(`#lista-frakcji [data-id=${F}]`);
if (!(await s.locator(".lista-jednostek li").count())) { await s.fill(".dodaj-jednostke input[name=nazwa]", "Chochliki"); await s.click(".dodaj-jednostke button.dodaj"); }
await s.click("[data-nowa-armia]");
await s.locator("form.armia [data-dodaj-oddzial]").first().click();
await s.locator("form.armia input[name=n]").first().fill("150"); await s.locator("form.armia input[name=n]").first().press("Tab"); await s.waitForTimeout(200);
// cel: prowincja kawałek dalej (ta sama strona mapy, widoczna obok szuflady)
await s.locator("form.armia [data-cel]").first().click();
assert.ok((await s.locator(".komunikat-armii").textContent()).includes("kliknij na mapie"));
const mm = await s.locator("#mapa").boundingBox();
let info = "";
let ostatniKlik = [];
for (const [dx, dy] of [[40, 0], [0, 40], [60, 30], [-40, 0], [0, -40], [80, 0]]) {
  ostatniKlik = [px + dx, py + dy]; await s.mouse.click(px + dx, py + dy);
  info = (await s.locator("form.armia .armia-info").first().textContent()).replace(/\s+/g, " ");
  if (/Cel: .*za \d+ tur/.test(info) || info.includes("brak drogi")) break;
  if (!(await s.locator("form.armia [data-cel]").count())) break;
  await s.locator("form.armia [data-cel]").first().click();
}
console.log("cel:", info.slice(info.indexOf("Cel")));
assert.ok(info.includes("Cel:"), "cel nie ustawiony");
await s.screenshot({ path: process.argv[2] + "/t_mapa.png", clip: { x: Math.max(0, px - 200), y: Math.max(0, py - 150), width: 400, height: 300 } });
// 7.1d: zamknięcie tury → 1 krok; cofnięcie → powrót
const ile = s => +(s.match(/za (\d+) tur/) || [])[1];
const polozenie = async () => (await s.locator("form.armia .armia-info").first().textContent()).replace(/\s+/g, " ");
const przed = await polozenie(), n0 = ile(przed);
await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(300);
await s.click(`#lista-frakcji [data-id=${F}]`);
const po = await polozenie(); console.log("po turze:", po.slice(po.indexOf("żołnierzy")));
assert.ok(n0 > 1 ? ile(po) === n0 - 1 : po.includes("na miejscu"), "armia nie zrobiła kroku");
await s.click("#panel-gm"); await s.click("#cofnij-ture"); await s.waitForTimeout(300);
await s.click(`#lista-frakcji [data-id=${F}]`);
const cof = await polozenie(); assert.equal(ile(cof), n0, "cofnięcie nie przywróciło pozycji");
assert.equal(cof.match(/· (Prowincja [^ ]+)/)[1], przed.match(/· (Prowincja [^ ]+)/)[1]);
// przestawienie ręczne: klik w miejsce celu
await s.locator("form.armia [data-przestaw]").first().click();
await s.mouse.click(...ostatniKlik);
const prz = await polozenie(); console.log("po przestawieniu:", prz.slice(prz.indexOf("żołnierzy")));
assert.ok(prz.includes("na miejscu") || ile(prz) <= 1, "przestawienie nie zadziałało");
// umiejętności: przełącznik zapisuje się i zostaje zaznaczony
await s.locator("[data-przejscie=gory]").check();
await s.waitForTimeout(200);
assert.ok(await s.locator("[data-przejscie=gory]").isChecked());
// usuń cel
await s.locator("form.armia [data-bez-celu]").first().click();
assert.ok(!(await s.locator("form.armia .armia-info").first().textContent()).includes("Cel:"));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
