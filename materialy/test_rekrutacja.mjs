// etap 20 (DEMO = GM): koszty jednostki, zlecenie rekrutacji (koszt schodzi, sloty), utrzymanie, ukończenie przy zamknięciu tury, cofnięcie, garnizon
// uruchom z folderu z playwright-core: node test_rekrutacja.mjs <folder na zrzuty>
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => { bledy.push(e.message); console.log("BŁĄD:", e.message); }); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const F = "rogus-ardens";
const karta = async () => { if (!(await s.locator("section.wojsko").count())) await s.click(`#lista-frakcji [data-id=${F}]`); await s.waitForTimeout(300); };
await s.click(`#lista-frakcji [data-id=${F}]`);
// prowincja dla frakcji (klik w mapę, aż wyjdzie edycja prowincji)
const m = await s.locator("#mapa").boundingBox(); let ok = false, px = 0, py = 0;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) {
  px = m.x + m.width * fx; py = m.y + m.height * fy;
  await s.mouse.click(px, py);
  ok = await s.locator(".edycja-prowincji").count() > 0;
}
assert.ok(ok, "prowincja");
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F);
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
// stany: populacja 1000, żywność 50, złoto 300
const stanZ = async (id, v) => { await s.fill(`.tabela-zasobow input[data-id=${id}]`, String(v)); await s.press(`.tabela-zasobow input[data-id=${id}]`, "Tab"); await s.waitForTimeout(150); };
await stanZ("populacja", 1000); await stanZ("zywnosc", 50); await stanZ("zloto", 300);
// 20.1: jednostka z kosztem 2 złota, utrzymaniem 0,5 złota, populacją 2, czasem 2 tur
const f = s.locator(".dodaj-jednostke");
await f.locator("input[name=nazwa]").fill("Kultyści");
await f.locator("summary").click();
await f.locator('input[name="koszt:zloto"]').fill("2");
await f.locator('input[name="utrzymanie:zloto"]').fill("0,5");
await f.locator("input[name=populacja]").fill("2");
await f.locator("input[name=czas]").fill("2");
await f.locator("button.dodaj").click(); await s.waitForTimeout(300);
const jt = await s.locator(".lista-jednostek li", { hasText: "Kultyści" }).innerText();
console.log("jednostka:", jt.replace(/\s+/g, " "));
assert.match(jt, /koszt: 2 Złoto · utrzymanie: 0,5 Złoto \/ turę · populacja 2 · rekrutacja 2 tury/);
// 20.3: zlecenie 100 → koszt 200 złota i 200 populacji; sloty: drugie 350 się nie zmieści
const z = s.locator(".zlec-rekrutacje");
await z.locator("select[name=j]").selectOption("Kultyści");
await z.locator("input[name=n]").fill("100");
assert.match(await z.locator(".podglad-kosztu").innerText(), /Koszt: 200 Złoto, 200 Populacja · gotowe za 2 tury/);
await z.locator("select[name=cel]").selectOption("nowa");
await z.locator("button.dodaj").click(); await s.waitForTimeout(300);
assert.equal(await s.inputValue(".tabela-zasobow input[data-id=zloto]"), "100");
assert.equal(await s.inputValue(".tabela-zasobow input[data-id=populacja]"), "800");
assert.match(await s.locator(".rekrutacja li").first().innerText(), /100 × Kultyści .* jeszcze 2 tury · utwórz nową armię/);
await z.locator("input[name=n]").fill("350"); await z.locator("button.dodaj").click(); await s.waitForTimeout(300);
assert.match(await s.locator(".komunikat-rekrutacji").innerText(), /wolnych slotów: 300/);
await s.locator(".zlec-rekrutacje input[name=n]").fill("10"); await s.locator(".zlec-rekrutacje select[name=j]").selectOption("Kultyści");
await s.locator(".zlec-rekrutacje select[name=cel]").selectOption("garnizon");
await s.locator(".zlec-rekrutacje button.dodaj").click(); await s.waitForTimeout(300);   // złota 100 → 80
assert.equal(await s.locator(".rekrutacja li").count(), 2);
// anulowanie zwraca koszt
await s.locator("[data-anuluj-rek]").nth(1).click(); await s.waitForTimeout(300);
assert.equal(await s.inputValue(".tabela-zasobow input[data-id=zloto]"), "100");
await s.locator(".zlec-rekrutacje input[name=n]").fill("10"); await s.locator(".zlec-rekrutacje select[name=cel]").selectOption("garnizon");
await s.locator(".zlec-rekrutacje button.dodaj").click(); await s.waitForTimeout(300);
// 20.2: szczęście + bilans (populacja 780 → 78 żywności, rekruci 110 × 0,2 = 22 → 100 żywności przy stanie 50 = brakuje)
await s.fill(".wojsko input[name=szczescie]", "35"); await s.press(".wojsko input[name=szczescie]", "Tab"); await s.waitForTimeout(300);
assert.match(await s.locator(".wojsko .szczescie").innerText(), /ryzyko złych wydarzeń:\s+wysokie/);
const bil = await s.locator(".wojsko .bilans").innerText();
console.log("bilans:", bil.replace(/\s+/g, " "));
assert.match(bil, /Żywność\s+−100 \/ turę · stan 50 brakuje!/);
await s.locator("section.wojsko").screenshot({ path: process.argv[2] + "/rekrutacja_przed.png" });
// 20.4: dwa zamknięcia tury → armia z 100 kultystami i garnizon 10, wpisy w Kronice
const zamknij = async () => { await s.click("#panel-gm"); await s.waitForTimeout(400); await s.click("#zamknij-ture"); await s.waitForTimeout(1500); await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); };
await zamknij();
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
assert.match(await s.locator(".rekrutacja li").first().innerText(), /jeszcze 1 tura /);
await zamknij();
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
assert.equal(await s.locator(".rekrutacja li").count(), 0, "rekrutacja skończona");
const armia = await s.locator("form.armia").first().innerText();
assert.match(armia, /100 żołnierzy/); assert.match(armia, /Utrzymanie: 20 Żywność, 50 Złoto \/ turę/);
assert.match(await s.locator(".garnizony").innerText(), /10 × Kultyści/);
await s.locator("section.wojsko").screenshot({ path: process.argv[2] + "/rekrutacja_po.png" });
// garnizon do armii
await s.locator(".garnizony select[name=do]").selectOption({ index: 1 });
await s.locator("[data-z-garnizonu]").click(); await s.waitForTimeout(300);
assert.match(await s.locator("form.armia").first().innerText(), /110 żołnierzy/);
// 20.5: podział 30 do nowej armii, potem połączenie z powrotem
await s.locator("details.podzial summary").first().click();
await s.locator("details.podzial [data-ile]").first().fill("30");
await s.locator("details.podzial [data-podziel]").first().click(); await s.waitForTimeout(300);
assert.equal(await s.locator("form.armia").count(), 2);
assert.match(await s.locator("form.armia").nth(0).innerText(), /80 żołnierzy/);
assert.match(await s.locator("form.armia").nth(1).innerText(), /30 żołnierzy/);
await s.locator("details.podzial summary").first().click();
await s.locator("details.podzial [data-polacz]").first().click(); await s.waitForTimeout(300);
assert.equal(await s.locator("form.armia").count(), 1);
assert.match(await s.locator("form.armia").first().innerText(), /110 żołnierzy/);
// cofnięcie ostatniego zamknięcia: armia znika, zlecenia wracają (garnizon już przeniesiony — odejmowanie od pustego nie psuje)
await s.click("#panel-gm"); await s.waitForTimeout(400); await s.click("#cofnij-ture"); await s.waitForTimeout(800);
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
assert.equal(await s.locator(".rekrutacja li").count(), 2, "zlecenia wróciły");
// Zgrzyt melduje o ukończonej rekrutacji (dymek)
const dymek = await s.locator(".pomocnik-tekst").allInnerTexts();
console.log("dymek:", dymek);
// 21: rekruci mieli dołączyć do konkretnej armii, ale jej już nie ma → nowa armia
await zamknij();
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
assert.equal(await s.locator("form.armia").count(), 1);
const nazwaA = await s.locator("form.armia input[name=nazwa]").first().inputValue();
await s.locator(".zlec-rekrutacje input[name=n]").fill("10");
const v = await s.locator(".zlec-rekrutacje select[name=cel] option", { hasText: `dołącz do: ${nazwaA}` }).getAttribute("value");
await s.locator(".zlec-rekrutacje select[name=cel]").selectOption(v);
await s.locator(".zlec-rekrutacje button.dodaj").click(); await s.waitForTimeout(300);
assert.match(await s.locator(".rekrutacja li").last().innerText(), new RegExp(`dołącz do: ${nazwaA}`));
await s.locator("form.armia [data-rozwiaz]").first().click(); await s.waitForTimeout(300);
assert.equal(await s.locator("form.armia").count(), 0);
assert.match(await s.locator(".rekrutacja li").last().innerText(), /armia, której już nie ma \(będzie nowa\)/);
await zamknij(); await s.click(`#lista-frakcji [data-id=${F}]`); await zamknij();   // „Panel GM” to przełącznik — między kliknięciami karta
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
assert.equal(await s.locator("form.armia").count(), 1, "nowa armia z rekrutów");
assert.match(await s.locator("form.armia").first().innerText(), /10 żołnierzy/);
await s.click("#kronika"); await s.waitForTimeout(500);
assert.match(await s.locator("article.kronika").innerText(), /armii, do której mieli dołączyć, już tam nie było/);
// zmiana nazwy jednostki idzie za nią do armii i zleceń — utrzymanie dalej liczone
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
await s.locator(".zlec-rekrutacje input[name=n]").fill("20"); await s.locator(".zlec-rekrutacje button.dodaj").click(); await s.waitForTimeout(300);
await s.locator(".lista-jednostek li", { hasText: "Kultyści" }).locator("[data-akcja=edytuj]").click();
await s.fill(".edytuj-jednostke input[name=nazwa]", "Kultyści Ognia"); await s.click(".edytuj-jednostke button.dodaj"); await s.waitForTimeout(300);
const armiaPo = await s.locator("form.armia").first().innerText();
assert.match(armiaPo, /Utrzymanie: 2 Żywność, 5 Złoto \/ turę/, "utrzymanie po zmianie nazwy");
assert.equal(await s.locator("form.armia select[name=j]").first().inputValue(), "Kultyści Ognia");
assert.match(await s.locator(".rekrutacja li").last().innerText(), /20 × Kultyści Ognia/);
// miasto utracone w trakcie szkolenia → rekrutacja przepada (wpis w Kronice), żadnej armii w cudzej prowincji
await s.mouse.click(px, py); await s.waitForSelector(".edycja-prowincji");
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "goblandia"); await s.waitForTimeout(300);
await zamknij(); await s.click(`#lista-frakcji [data-id=${F}]`); await zamknij();
await s.click(`#lista-frakcji [data-id=${F}]`); await karta();
assert.equal(await s.locator(".rekrutacja li").count(), 0);
assert.equal(await s.locator("form.armia").count(), 0, "brak nowej armii z utraconego miasta (stara z 10 żołnierzami rozwiązana — poniżej 100)");
await s.click("#kronika"); await s.waitForTimeout(500);
assert.match(await s.locator("article.kronika").innerText(), /rekrutacja przepadła — 20 × Kultyści Ognia \(miasto utracone\)/);
// cudzy widok: inna kraina z jawnymi armiami, ale tajnymi zasobami nie jest sprawdzalna w DEMO (brak przełączników tajności)
assert.deepEqual(bledy, []);
console.log("OK");
await b.close();
