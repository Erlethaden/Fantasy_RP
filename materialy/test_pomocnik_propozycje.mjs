// test 16.2 na emulatorze: Zgrzyt-pomocnik i propozycje — GM dostaje dymek o nowej propozycji, gracz o przyjętej (znika z bazy) i odrzuconej.
// Serwer: VITE_EMULATOR=1 npx vite --port 5176 ; w folderze z firebase-tools i @firebase/rules-unit-testing:
//   firebase emulators:exec --only firestore,auth --project <projectId z firebase-config.js> "node test_pomocnik_propozycje.mjs <firestore.rules> <projectId> <folder na zrzuty>"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert";
const [regulyPlik, projectId, zrzuty] = process.argv.slice(2), ADRES = "http://localhost:5176/";
const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(regulyPlik, "utf8"), host: "127.0.0.1", port: 8080 } });
const konto = async email => (await (await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "haslo123", returnSecureToken: true }) })).json()).localId;
const uid = { gm: await konto("gm@test.pl"), gob: await konto("gob@test.pl") };
await env.withSecurityRulesDisabled(async c => {
  for (const [k, rola, frakcja] of [["gm", "gm", ""], ["gob", "gracz", "goblandia"]])
    await setDoc(doc(c.firestore(), "uzytkownicy", uid[k]), { email: `${k}@test.pl`, nazwa: k, rola, frakcja, utworzono: "" });
});
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const bledy = [];
async function okno(email) {
  const s = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  s.on("pageerror", e => { bledy.push(`${email}: ${e.message}`); console.log("BŁĄD", email, e.message); }); s.on("dialog", d => d.accept());
  await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
  await s.goto(ADRES); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("#mail"); await s.keyboard.type(email); await s.click("#haslo"); await s.keyboard.type("haslo123");
  await s.click("button.wejdz"); await s.waitForTimeout(4000);
  if (await s.locator("#aplikacja[hidden]").count()) await s.click("button.wejdz");
  await s.waitForSelector("#aplikacja:not([hidden])", { timeout: 20000 }); await s.waitForTimeout(2500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  return s;
}
let GM = await okno("gm@test.pl"); await GM.waitForTimeout(2000);   // pierwszy GM wgrywa dane startowe
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  for (const f of ["krag-mhor", "aurelia", "goblandia", "rogus-ardens", "czarny-smok", "gor-khar", "grobowe-imperium"]) await setDoc(doc(db, "tajne_armie", f), { armie: [], floty: [] });
  await setDoc(doc(db, "gra", "armie"), { a: {}, fl: {}, bitwy: {} }, { merge: true });
});
await GM.context().close(); GM = await okno("gm@test.pl"); await GM.waitForTimeout(2000);
const dymek = s => s.evaluate(() => { const d = document.querySelector(".pomocnik:not([hidden]) .pomocnik-tekst"); return d ? d.textContent : null; });
const czekaj = async (s, re, opis) => {
  const ok = await s.waitForFunction(re => { const d = document.querySelector(".pomocnik:not([hidden]) .pomocnik-tekst"); return d && new RegExp(re, "i").test(d.textContent); }, re.source, { timeout: 12000 }).then(() => true, () => false);
  assert.ok(ok, `${opis}: brak dymka (jest: ${await dymek(s)})`);
  await s.waitForTimeout(2500); console.log(`${opis}:`, await dymek(s));
  if (zrzuty) await s.screenshot({ path: `${zrzuty}/pomocnik_${opis.replace(/[^a-ząćęłńóśźż0-9]+/gi, "_")}.png` });
  await s.click(".pomocnik-zamknij");
};
const G = await okno("gob@test.pl");
const zaproponuj = async motto => {
  if (!await G.locator(".edytuj-opis").isVisible()) await G.click("#lista-frakcji [data-id=goblandia]");
  await G.click(".edytuj-opis"); await G.fill("form.edycja [name=motto]", motto); await G.click("form.edycja button.dodaj"); await G.waitForTimeout(1500);
};
const decyzja = async akcja => {
  if (!await GM.waitForSelector("article.propozycja", { timeout: 5000 }).then(() => true, () => false)) await GM.click("#panel-gm");   // klik w otwarty panel go zamyka
  await GM.waitForSelector("article.propozycja", { timeout: 10000 });
  await GM.click(`article.propozycja [data-akcja=${akcja}]`); await GM.waitForTimeout(1500);
};
await zaproponuj("Motto na próbę 1");
await czekaj(GM, /propozycj|proponuje/, "GM, nowa propozycja");
await decyzja("przyjmij");
await czekaj(G, /przyj/, "gracz, przyjęta");
await zaproponuj("Motto na próbę 2");
await czekaj(GM, /propozycj|proponuje/, "GM, nowa propozycja 2");
await decyzja("odrzuc");
await czekaj(G, /odrzuc|nie\.|współczuje/, "gracz, odrzucona");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close(); await env.cleanup();
