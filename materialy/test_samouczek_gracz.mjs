// test błędu 2026-10-20: GRACZ po samouczku dostawał z powrotem armię i flotę pokazu przy pierwszej zmianie z bazy
// (pokaz mutował tablice wspólne z danymi tajne_armie / gra/armie w pamięci). Na podstawie test_dwa_okna.mjs
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
const zrzutStanu = s => s.evaluate(async () => { const { stan } = await import(performance.getEntriesByType("resource").map(e => e.name).find(n => n.includes("/src/dane/magazyn.js")));
  return { armie: stan.frakcje.flatMap(f => (f.armie || []).map(a => f.id + ":" + a.id)), floty: stan.frakcje.flatMap(f => (f.floty || []).map(a => f.id + ":" + a.id)), poz: Object.keys(stan.pozycjeArmii || {}), pozF: Object.keys(stan.pozycjeFlot || {}), wojny: JSON.stringify(stan.wojny) }; });
const G = B;
console.log("PRZED", JSON.stringify(await zrzutStanu(G)));
await G.click("#samouczek-przycisk"); await G.waitForTimeout(500);
for (const r of ["armie", "bitwy"]) {
  await G.click(`[data-rozdzial=${r}]`);
  for (let k = 0; k < 30; k++) {
    await G.waitForTimeout(1000);
    if (await G.evaluate(() => document.querySelector(".samouczek-tekst").dataset.pelny !== undefined)) { await G.mouse.click(800, 120); await G.waitForTimeout(200); }
    if (await G.locator(".samouczek-rozdzialy").count()) break;
    if (k === 6) console.log("W TRAKCIE", r, JSON.stringify(await zrzutStanu(G)));
    await G.mouse.click(800, 120);
  }
  console.log("PO", r, JSON.stringify(await zrzutStanu(G)), "znaki", await znaki(G));
}
await G.click("[data-s=koniec]"); await G.waitForTimeout(800);
console.log("PO ZAKONCZ", JSON.stringify(await zrzutStanu(G)), "znaki", await znaki(G));
await env.withSecurityRulesDisabled(c => updateDoc(doc(c.firestore(), "frakcje", "aurelia"), { nazwa: "X" }));
await G.waitForTimeout(2500);
const po = await zrzutStanu(G); console.log("po zmianie z bazy:", JSON.stringify(po));
assert.deepEqual([po.armie, po.floty, po.poz, po.pozF], [[], [], [], []], "pokaz wrócił po zmianie z bazy"); assert.equal(await znaki(G), 0);
assert.deepEqual(bledy, []); console.log("✔ gracz: po samouczku i zmianie z bazy brak armii/floty pokazu");
await b.close(); await env.cleanup(); process.exit(0);
