// test 8.3 (prośba użytkownika): samouczek z pokazami NIE synchronizuje się — dwa okna naraz na emulatorze Firebase.
// Okno A (GM) przechodzi rozdziały z piaskownicą, okno B (gracz) w tym czasie patrzy na mapę; baza przed i po ma być taka sama,
// a zmiana z zewnątrz w trakcie rozdziału dochodzi do A dopiero po rozdziale.
// Uruchamianie (w folderze z firebase-tools i @firebase/rules-unit-testing, serwer: VITE_EMULATOR=1 npx vite --port 5176):
//   firebase emulators:exec --only firestore,auth --project <projectId z firebase-config.js> "node test_dwa_okna.mjs <firestore.rules> <projectId>"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert";
const [regulyPlik, projectId] = process.argv.slice(2), ADRES = "http://localhost:5176/";
const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(regulyPlik, "utf8"), host: "127.0.0.1", port: 8080 } });
const konto = async (email) => (await (await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "haslo123", returnSecureToken: true }) })).json()).localId;
const gmUid = await konto("gm@test.pl"), grUid = await konto("gracz@test.pl");
await env.withSecurityRulesDisabled(async c => {
  await setDoc(doc(c.firestore(), "uzytkownicy", gmUid), { email: "gm@test.pl", nazwa: "GM", rola: "gm", frakcja: "", utworzono: "" });
  await setDoc(doc(c.firestore(), "uzytkownicy", grUid), { email: "gracz@test.pl", nazwa: "Gracz", rola: "gracz", frakcja: "aurelia", utworzono: "" });
});
const KOLEKCJE = ["frakcje", "bohaterowie", "gra", "tajne_zasoby", "tajne_jednostki", "tajne_statusy", "tajne_budynki", "tajne_armie", "notatki_gracza", "notatki_gm", "traktaty", "kronika", "bloki", "propozycje", "logi", "nazwy_osad", "bitwy"];
const zrzut = async () => {   // withSecurityRulesDisabled nie zwraca wyniku funkcji
  const z = {};
  await env.withSecurityRulesDisabled(async c => { for (const k of KOLEKCJE) for (const d of (await getDocs(collection(c.firestore(), k))).docs) z[`${k}/${d.id}`] = JSON.stringify(d.data()); });
  return z;
};

const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const bledy = [];
async function okno(email) {
  const s = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  s.on("pageerror", e => bledy.push(`${email}: ${e.message}`));
  await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
  await s.goto(ADRES); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("#mail"); await s.keyboard.type(email); await s.click("#haslo"); await s.keyboard.type("haslo123");
  await s.click("button.wejdz"); await s.waitForTimeout(4000);
  if (await s.locator("#aplikacja[hidden]").count()) { await s.click("button.wejdz"); }
  await s.waitForSelector("#aplikacja:not([hidden])", { timeout: 20000 }); await s.waitForTimeout(2500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  return s;
}
const A = await okno("gm@test.pl");   // pierwszy GM wgrywa dane startowe do pustej bazy
const B = await okno("gracz@test.pl");
await A.waitForTimeout(2000);
// jak w prawdziwej grze: dokumenty armii istnieją
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  for (const d of (await getDocs(collection(db, "frakcje"))).docs) await setDoc(doc(db, "tajne_armie", d.id), { armie: [], floty: [] });
  await setDoc(doc(db, "gra", "armie"), { a: {}, fl: {}, bitwy: {} }, { merge: true });
});
await A.waitForTimeout(2000);
const znaki = s => s.evaluate(() => [...document.querySelectorAll("#mapa .osada")].filter(e => /Zgrzyt|Złodziei|Bitwa/.test(e.title)).length);
const przed = await zrzut();
console.log("dokumentów w bazie przed:", Object.keys(przed).length);

let zmianaZewnetrzna = false, sprawdzen = 0;
await A.click("#samouczek-przycisk"); await A.waitForTimeout(500);
for (const r of ["armie", "bitwy", "dyplomacja", "gm-kraina"]) {
  await A.click(`[data-rozdzial=${r}]`);
  for (let k = 0; k < 30; k++) {
    await A.waitForTimeout(1200);
    if (await A.evaluate(() => document.querySelector(".samouczek-tekst").dataset.pelny !== undefined)) { await A.mouse.click(800, 120); await A.waitForTimeout(200); }
    if (await A.locator(".samouczek-rozdzialy").count()) break;
    const uA = await znaki(A), uB = await znaki(B);
    if (uA) { assert.equal(uB, 0, `okno B widzi pokaz z A (${r}, krok ${k})`); sprawdzen++; }
    if (r === "dyplomacja" && k === 2 && !zmianaZewnetrzna) {   // zmiana z zewnątrz w trakcie rozdziału
      await env.withSecurityRulesDisabled(c => updateDoc(doc(c.firestore(), "frakcje", "aurelia"), { nazwa: "Aurelia Zmieniona" }));
      zmianaZewnetrzna = true;
      for (let t = 0; t < 20 && await B.getAttribute("#lista-frakcji [data-id=aurelia]", "title") !== "Aurelia Zmieniona — Twoje państwo"; t++) await B.waitForTimeout(500);
      assert.equal(await B.getAttribute("#lista-frakcji [data-id=aurelia]", "title"), "Aurelia Zmieniona — Twoje państwo", "B nie dostał zmiany z bazy");
      assert.equal(await A.getAttribute("#lista-frakcji [data-id=aurelia]", "title"), "Aurelia", "A dostał zmianę w trakcie samouczka");
      console.log("✔ zmiana z zewnątrz: B ją widzi, A (w samouczku) jeszcze nie");
    }
    await A.mouse.click(800, 120);
  }
  console.log(`✔ rozdział ${r}: po nim w A znaczników pokazu: ${await znaki(A)}, w B: ${await znaki(B)}`);
  assert.equal(await znaki(A), 0); assert.equal(await znaki(B), 0);
}
assert.ok(sprawdzen >= 5, "za mało kroków z pokazem: " + sprawdzen);
console.log(`✔ w ${sprawdzen} krokach pokaz był w A i nie było go w B`);
await A.waitForTimeout(1500);
assert.equal(await A.getAttribute("#lista-frakcji [data-id=aurelia]", "title"), "Aurelia Zmieniona", "A nie dociągnął zmiany po samouczku");
console.log("✔ po rozdziale A dociągnął zaległą zmianę z bazy");
assert.equal(await znaki(A), 0, "po dociągnięciu z bazy w A wróciły armie/floty pokazu");
const po = await zrzut();
delete po["frakcje/aurelia"]; delete przed["frakcje/aurelia"];
const rozne = [...new Set([...Object.keys(przed), ...Object.keys(po)])].filter(k => przed[k] !== po[k]);
assert.deepEqual(rozne, [], "samouczek zmienił bazę: " + rozne.join(", "));
console.log("✔ baza po samouczku identyczna (poza zmianą z zewnątrz) — 0 zapisów, 0 logów");
assert.equal(bledy.length, 0, bledy.join(" | "));
console.log("OK"); await b.close(); await env.cleanup();
