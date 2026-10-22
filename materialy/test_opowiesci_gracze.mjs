// test 13.4–13.6 na emulatorze: GM zamyka turę (szkic — gracze nic nie widzą), publikuje → opowieść otwiera się graczom sama, raz;
// tajny wpis GM dla Goblandii widzi tylko Goblandia (szept), Aurelia nie; w bazie szkic/opowieść bez szeptów dla innych.
// Serwer: VITE_EMULATOR=1 npx vite --port 5176 ; w folderze z firebase-tools i @firebase/rules-unit-testing:
//   firebase emulators:exec --only firestore,auth --project <projectId z firebase-config.js> "node test_opowiesci_gracze.mjs <firestore.rules> <projectId> <folder na zrzuty>"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
  await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
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
// GM: wojna + tajny wpis dla Goblandii, zamknięcie tury
await GM.click("#panel-gm");
await GM.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await GM.selectOption(".nowa-wojna select[name=k2]", "goblandia"); await GM.click(".nowa-wojna button.dodaj");
await GM.waitForTimeout(500); await GM.click("#kronika"); await GM.waitForSelector("article.kronika");
await GM.fill(".nowy-wpis textarea", "SEKRETNA ZARAZA"); await GM.check(".nowy-wpis input[name=tajny]"); await GM.check(".nowy-wpis input[name=widza][value=goblandia]");
await GM.click(".nowy-wpis button.dodaj"); await GM.waitForTimeout(500);
await GM.click("#panel-gm"); await GM.click("#zamknij-ture"); await GM.waitForTimeout(3000);
// szkic: w bazie, ale gracze go nie dostają
const dokument = async sciezka => { let d = null; await env.withSecurityRulesDisabled(async c => { const s = await getDoc(doc(c.firestore(), sciezka)); d = s.exists() ? s.data() : null; }); return d; };
const szkic = await dokument("opowiesci/1");
assert.ok(szkic && szkic.opublikowana === false && szkic.szepty?.goblandia, "brak szkicu z szeptem w bazie");
for (const [n, s] of [["Goblandia", G], ["Aurelia", A]]) assert.equal(await s.locator("#opowiesc[open]").count(), 0, `${n} widzi szkic`);
// publikacja
await GM.locator(".kronikarz").scrollIntoViewIfNeeded(); await GM.click(".kronikarz [data-kr=publikuj]"); await GM.waitForTimeout(4000);
const opubl = await dokument("opowiesci/1");
assert.ok(opubl.opublikowana && !JSON.stringify(opubl).includes("SEKRETNA"), "opublikowana opowieść zawiera szept");
assert.ok((await dokument("szepty/1_goblandia"))?.akapity.join(" ").includes("SEKRETNA ZARAZA") && !(await dokument("szepty/1_aurelia")), "szepty w bazie");
// gracze: opowieść otwiera się sama
for (const [n, s, szept] of [["Goblandia", G, true], ["Aurelia", A, false]]) {
  await s.waitForSelector("#opowiesc[open]", { timeout: 10000 }); if (await s.locator("#opowiesc .pokaz-calosc").isVisible()) await s.click("#opowiesc .pokaz-calosc");
  const t = (await s.locator("#opowiesc .opowiesc-tekst").textContent()).replace(/\s+/g, " ");
  console.log(`${n}:`, t.slice(0, 300));
  assert.equal(t.includes("SEKRETNA ZARAZA"), szept, `${n}: szept ${szept ? "nie" : ""}widoczny`);
  assert.ok(!t.includes("Szept dla:"), `${n} widzi podgląd GM`);
  await s.screenshot({ path: `${zrzuty}/kronikarz_gracz_${n.toLowerCase()}.png` });
  await s.click("#opowiesc .zamknij");
}
// raz: kolejna zmiana od GM (nowy wpis w kronice → odświeżenie u gracza) nie otwiera jej drugi raz
await GM.click("#kronika"); await GM.waitForSelector("article.kronika"); await GM.fill(".nowy-wpis textarea", "Jawny wpis po publikacji");
await GM.click(".nowy-wpis button.dodaj"); await G.waitForTimeout(4000);
assert.equal(await G.locator("#opowiesc[open]").count(), 0, "opowieść otwiera się drugi raz");
// archiwum w Kronice u gracza
await G.click("#kronika"); await G.waitForSelector("[data-opowiesc='1']", { timeout: 10000 }); await G.click("[data-opowiesc='1']");
await G.waitForSelector("#opowiesc[open]"); if (await G.locator("#opowiesc .pokaz-calosc").isVisible()) await G.click("#opowiesc .pokaz-calosc");
assert.ok((await G.locator("#opowiesc .opowiesc-tekst").textContent()).includes("SEKRETNA ZARAZA"), "archiwum bez szeptu");
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close(); await env.cleanup();
