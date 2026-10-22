// test 13.4–13.6 (DEMO, GM): wojna + tajny wpis → zamknięcie tury → szkic w Panelu GM (podgląd z szeptem), poprawka, publikacja,
// lista w Kronice, cofnięcie tury usuwa opowieść. Serwer: npm run dev -- --port 5174 ; node test_opowiesci.mjs <folder na zrzuty>
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const tekst = async sel => (await s.locator(sel).first().textContent()).replace(/\s+/g, " ");
// wojna i tajny wpis GM dla Goblandii
await s.click("#panel-gm");
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia"); await s.click(".nowa-wojna button.dodaj");
await s.click("#kronika"); await s.waitForSelector("article.kronika");
await s.fill(".nowy-wpis textarea", "SEKRETNA ZARAZA"); await s.check(".nowy-wpis input[name=tajny]"); await s.check(".nowy-wpis input[name=widza][value=goblandia]");
await s.click(".nowy-wpis button.dodaj"); await s.waitForTimeout(200);
// zamknięcie tury → szkic
await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(800);
assert.ok(await s.locator(".kronikarz").count(), "brak sekcji Kronika Zgrzyta w Panelu GM");
await s.locator(".kronikarz").scrollIntoViewIfNeeded();
await s.click(".kronikarz [data-kr=podglad]"); await s.waitForSelector("#opowiesc[open]"); await s.click("#opowiesc .pokaz-calosc");
const podglad = await tekst("#opowiesc .opowiesc-tekst");
console.log("szkic:", podglad.slice(0, 400));
assert.ok(/Rogus|Goblandia|Gołolandia|Rogal/.test(podglad) && podglad.includes("Szept dla: Goblandia") && podglad.includes("SEKRETNA ZARAZA"), "podgląd GM bez wojny albo szeptu");
await s.locator("#opowiesc").screenshot({ path: process.argv[2] + "/kronikarz_podglad_gm.png" });
await s.click("#opowiesc .zamknij");
// poprawka tekstu
await s.click(".kronikarz [data-kr=popraw]"); await s.waitForSelector(".popraw-opowiesc");
await s.locator(".kronikarz").screenshot({ path: process.argv[2] + "/kronikarz_poprawki.png" });
await s.fill(".popraw-opowiesc textarea[name=akapity]", "Pierwszy akapit od GM.\n\nDrugi akapit POPRAWIONY.");
await s.click(".popraw-opowiesc button.dodaj"); await s.waitForTimeout(300);
assert.ok((await tekst(".komunikat-kronikarza")).includes("Zapisano"), "poprawki nie zapisane");
// publikacja
await s.click(".kronikarz [data-kr=publikuj]"); await s.waitForTimeout(500);
const st = await s.evaluate(() => JSON.parse(localStorage.getItem("frp-demo")));
console.log("opublikowane:", st.opowiesci, "| szepty:", Object.keys(st.szeptyDane || {}));
assert.deepEqual(st.opowiesci, [1]); assert.ok(!JSON.stringify(st.opowiesciDane[1]).includes("SEKRETNA"), "szept w opublikowanej opowieści");
assert.ok(st.szeptyDane["1_goblandia"]?.akapity.join(" ").includes("SEKRETNA ZARAZA") && !st.szeptyDane["1_rogus-ardens"], "szepty po publikacji");
assert.ok(st.opowiesciDane[1].akapity.includes("Drugi akapit POPRAWIONY."), "publikacja bez poprawek");
// kronika: lista opowieści otwiera okno
await s.click("#kronika"); await s.waitForSelector("[data-opowiesc='1']"); await s.click("[data-opowiesc='1']");
await s.waitForSelector("#opowiesc[open]"); await s.click("#opowiesc .pokaz-calosc");
assert.ok((await tekst("#opowiesc .opowiesc-tekst")).includes("Drugi akapit POPRAWIONY."));
await s.screenshot({ path: process.argv[2] + "/kronikarz_z_kroniki.png" });
await s.click("#opowiesc .zamknij");
// cofnięcie tury usuwa opowieść i szepty
await s.click("#panel-gm"); await s.click("#cofnij-ture"); await s.waitForTimeout(400);
const po = await s.evaluate(() => JSON.parse(localStorage.getItem("frp-demo")));
assert.deepEqual(po.opowiesci, []); assert.ok(!po.opowiesciDane?.[1] && !po.szeptyDane?.["1_goblandia"], "cofnięcie nie usunęło opowieści");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
