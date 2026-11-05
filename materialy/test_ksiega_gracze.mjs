// test 18 na emulatorze: księga kampanii — gracz widzi mapę tury i tylko swój szept, inny gracz bez szeptu, GM wszystkie szepty;
// opowieść bez mapy (sprzed 18): gracz widzi napis zamiast mapy, GM przy otwarciu księgi dopisuje mapę z historii, potem widzi ją też gracz;
// koniec kampanii (18.3): po przełączniku GM Aurelia widzi szept Goblandii i rozdział „Tajemnice kampanii” (tajny wpis, tajny traktat, notatki).
// Serwer: VITE_EMULATOR=1 npx vite --port 5176 ; w folderze z firebase-tools i @firebase/rules-unit-testing:
//   firebase emulators:exec --only firestore,auth --project <projectId z firebase-config.js> "node test_ksiega_gracze.mjs <firestore.rules> <projectId> <folder na zrzuty>"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert";
const [regulyPlik, projectId, zrzuty] = process.argv.slice(2), ADRES = "http://localhost:5176/";
const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(regulyPlik, "utf8"), host: "127.0.0.1", port: 8080 } });
const konto = async email => (await (await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "haslo123", returnSecureToken: true }) })).json()).localId;
const uid = { gm: await konto("gm@test.pl"), gob: await konto("gob@test.pl"), aur: await konto("aur@test.pl") };
await env.withSecurityRulesDisabled(async c => {
  for (const [k, rola, frakcja] of [["gm", "gm", ""], ["gob", "gracz", "goblandia"], ["aur", "gracz", "aurelia"]])
    await setDoc(doc(c.firestore(), "uzytkownicy", uid[k]), { email: `${k}@test.pl`, nazwa: k, rola, frakcja, utworzono: "" });
});
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const bledy = [];
async function okno(email) {
  const s = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  s.on("pageerror", e => bledy.push(`${email}: ${e.message}`)); s.on("dialog", d => d.accept());
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
await env.withSecurityRulesDisabled(async c => {   // jak w prawdziwej grze (test_dwa_okna): dokumenty armii istnieją, inaczej stan GM się nie skleja
  const db = c.firestore();
  for (const f of ["krag-mhor", "aurelia", "goblandia", "rogus-ardens", "czarny-smok", "gor-khar", "grobowe-imperium"]) await setDoc(doc(db, "tajne_armie", f), { armie: [], floty: [] });
  await setDoc(doc(db, "gra", "armie"), { a: {}, fl: {}, bitwy: {} }, { merge: true });
});
// GM, który wgrał pustą bazę, nie ma potwierdzonych dokumentów (snapshot bez zmian danych nie przychodzi) — zapisuje dopiero po ponownym wejściu
await GM.context().close(); GM = await okno("gm@test.pl"); await GM.waitForTimeout(2000);
const G = await okno("gob@test.pl"), A = await okno("aur@test.pl");
// GM: wojna + tajny wpis dla Goblandii, zamknięcie tury, publikacja
await GM.click("#panel-gm");
await GM.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await GM.selectOption(".nowa-wojna select[name=k2]", "goblandia"); await GM.click(".nowa-wojna button.dodaj");
await GM.waitForTimeout(500); await GM.click("#kronika"); await GM.waitForSelector("article.kronika");
await GM.fill(".nowy-wpis textarea", "SEKRETNA ZARAZA"); await GM.check(".nowy-wpis input[name=tajny]"); await GM.check(".nowy-wpis input[name=widza][value=goblandia]");
await GM.click(".nowy-wpis button.dodaj"); await GM.waitForTimeout(500);
await GM.click("#panel-gm"); await GM.click("#zamknij-ture"); await GM.waitForTimeout(3000);
await GM.locator(".kronikarz").scrollIntoViewIfNeeded(); await GM.click(".kronikarz [data-kr=publikuj]"); await GM.waitForTimeout(4000);
const dokument = async sciezka => { let d = null; await env.withSecurityRulesDisabled(async c => { const s = await getDoc(doc(c.firestore(), sciezka)); d = s.exists() ? s.data() : null; }); return d; };
assert.ok("wlasciciele" in (await dokument("opowiesci/1")), "opublikowana opowieść bez mapy tury");   // w świeżej grze bez właścicieli mapa jest pusta: {}
const ksiega = async s => {
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  if (!await s.evaluate(() => !document.getElementById("szuflada").hidden && Boolean(document.querySelector("article.kronika")))) await s.click("#kronika");   // klik w otwartą Kronikę ją zamyka
  if (!await s.locator(".otworz-ksiege").count()) await s.waitForTimeout(1500);   // Kronika mogła się właśnie przerysowywać
  await s.waitForSelector(".otworz-ksiege", { timeout: 10000 }); await s.click(".otworz-ksiege");
  await s.waitForSelector("#ksiega .rozdzial-ksiegi", { timeout: 20000 }); await s.waitForTimeout(1500);
  const w = { mapy: await s.locator("#ksiega .mapa-ksiegi img").count(), brakMapy: await s.locator("#ksiega .mapa-ksiegi figcaption").count(),
    tekst: (await s.locator("#ksiega .rozdzialy-ksiegi").textContent()).replace(/\s+/g, " ") };
  return w;
};
const g = await ksiega(G), a = await ksiega(A), m = await ksiega(GM);
console.log("Goblandia:", g.mapy, "map, szept:", g.tekst.includes("SEKRETNA ZARAZA"), "| Aurelia:", a.mapy, "map, szept:", a.tekst.includes("SEKRETNA ZARAZA"), "| GM:", m.tekst.includes("Szept dla: Goblandia"));
assert.equal(g.mapy, 1, "Goblandia: brak mapy"); assert.ok(g.tekst.includes("SEKRETNA ZARAZA") && g.tekst.includes("Szept tylko dla ciebie"), "Goblandia nie widzi swojego szeptu");
assert.equal(a.mapy, 1, "Aurelia: brak mapy"); assert.ok(!a.tekst.includes("SEKRETNA ZARAZA"), "Aurelia widzi cudzy szept");
assert.ok(m.tekst.includes("Szept dla: Goblandia") && m.tekst.includes("SEKRETNA ZARAZA"), "GM nie widzi szeptów");
await G.screenshot({ path: `${zrzuty}/ksiega_gracz_goblandia.png` }); await A.screenshot({ path: `${zrzuty}/ksiega_gracz_aurelia.png` });
// opowieść sprzed 18 (bez mapy): gracz — napis; GM otwiera księgę → mapa dopisana z historii; gracz po ponownym otwarciu — mapa
await env.withSecurityRulesDisabled(async c => updateDoc(doc(c.firestore(), "opowiesci", "1"), { wlasciciele: deleteField() }));
const g2 = await ksiega(G); assert.equal(g2.mapy, 0); assert.equal(g2.brakMapy, 1, "gracz: brak napisu o mapie");
await ksiega(GM); await GM.waitForTimeout(2000);
assert.ok("wlasciciele" in (await dokument("opowiesci/1")), "GM nie dopisał mapy");
const g3 = await ksiega(G); assert.equal(g3.mapy, 1, "gracz nie widzi dopisanej mapy");
// koniec kampanii: przed — Aurelia bez tajemnic; GM zaznacza przełącznik → Aurelia widzi wszystko
await env.withSecurityRulesDisabled(async c => {
  await setDoc(doc(c.firestore(), "traktaty", "t-tajny"), { nazwa: "TAJNY PAKT", typ: "pakt", strony: ["goblandia", "rogus-ardens"], tajny: true, opis: "" });
  await setDoc(doc(c.firestore(), "notatki_gracza", "goblandia"), { tekst: "NOTATKA GOBLINÓW" });
});
assert.equal(await A.locator("#ksiega-tajemnice").count(), 0, "Aurelia widzi tajemnice przed końcem");
await GM.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
if (!await GM.locator("[name=koniec-kampanii]").isVisible()) await GM.click("#panel-gm");
await GM.locator("[name=koniec-kampanii]").scrollIntoViewIfNeeded(); await GM.check("[name=koniec-kampanii]"); await GM.waitForTimeout(3000);
const st = await dokument("gra/stan");   // błąd 2026-10-23: GM po zmianie od kogoś innego składał stan ze starej kopii i nadpisywał bazę
assert.ok(st.tury?.length === 1 && st.opowiesci?.includes(1) && st.ustawienia?.koniecKampanii, "przełącznik GM nadpisał tury/opowieści: " + JSON.stringify({ tury: st.tury, opowiesci: st.opowiesci }));
const a2 = await ksiega(A);
console.log("Aurelia po końcu:", ["SEKRETNA ZARAZA", "Szept dla: Goblandia", "Tajemnice kampanii", "TAJNY PAKT", "NOTATKA GOBLINÓW"].map(x => `${x}: ${a2.tekst.includes(x)}`).join(", "));
for (const x of ["Szept dla: Goblandia", "Tajemnice kampanii", "TAJNY PAKT", "NOTATKA GOBLINÓW"]) assert.ok(a2.tekst.includes(x), `Aurelia po końcu kampanii nie widzi: ${x}`);
assert.ok((await A.locator("#ksiega-tajemnice").textContent()).includes("SEKRETNA ZARAZA"), "brak tajnego wpisu Kroniki w tajemnicach");
await A.locator("#ksiega-tajemnice").scrollIntoViewIfNeeded(); await A.screenshot({ path: `${zrzuty}/ksiega_tajemnice.png` });
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close(); await env.cleanup();
