// test na emulatorze: bohater z USUNIECI_BOHATEROWIE (Baba Jaga) w starej bazie — GM loguje się kilka razy; po pierwszym wejściu
// dokument ma zniknąć, a kolejne wejścia nie mogą dopisywać do logów nic o nim (zgłoszenie: „co uruchomienie spamuje wpisy o Babie Jadze”).
// Serwer: VITE_EMULATOR=1 npx vite --port 5176 ; w folderze z firebase-tools, @firebase/rules-unit-testing, firebase, playwright-core:
//   firebase emulators:exec --only firestore,auth --project fantasy-rp-2f462 "node test_usuniety_bohater.mjs <firestore.rules> fantasy-rp-2f462"
import { chromium } from "playwright-core";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, collection, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
const [regulyPlik, projectId] = process.argv.slice(2), ADRES = "http://localhost:5176/", ID = "czarny-smok-baba-jaga";
const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(regulyPlik, "utf8"), host: "127.0.0.1", port: 8080 } });
const konto = async email => (await (await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "haslo123", returnSecureToken: true }) })).json()).localId;
const uid = { gm: await konto("gm@test.pl"), cs: await konto("cs@test.pl") };
const baza = f => env.withSecurityRulesDisabled(async c => f(c.firestore()));
await baza(async db => {
  await setDoc(doc(db, "uzytkownicy", uid.gm), { email: "gm@test.pl", nazwa: "gm", rola: "gm", frakcja: "", utworzono: "" });
  await setDoc(doc(db, "uzytkownicy", uid.cs), { email: "cs@test.pl", nazwa: "cs", rola: "gracz", frakcja: "czarny-smok", utworzono: "" });
});
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const bledy = [];
async function wejdz(email) {
  const s = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  s.on("pageerror", e => bledy.push(`${email}: ${e.message}`)); s.on("console", m => m.type() === "error" && bledy.push(`${email} konsola: ${m.text()}`));
  await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
  await s.goto(ADRES); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("#mail"); await s.keyboard.type(email); await s.click("#haslo"); await s.keyboard.type("haslo123");
  await s.click("button.wejdz"); await s.waitForTimeout(4000);
  if (await s.locator("#aplikacja[hidden]").count()) await s.click("button.wejdz");
  await s.waitForSelector("#aplikacja:not([hidden])", { timeout: 20000 }); await s.waitForTimeout(4000);
  await s.context().close();
}
await wejdz("gm@test.pl");   // pusta baza: dane startowe
await baza(async db => {   // stara gra: armie istnieją, Baba Jaga w bazie (z pustym opisem), w statusach i jako dowódca armii Czarnego Smoka
  for (const f of ["krag-mhor", "aurelia", "goblandia", "rogus-ardens", "czarny-smok", "gor-khar", "grobowe-imperium"])
    await setDoc(doc(db, "tajne_armie", f), { armie: f === "czarny-smok" ? [{ id: "a1", nazwa: "Armia", dowodca: ID, bohaterowie: [ID] }] : [], floty: [] });
  await setDoc(doc(db, "gra", "armie"), { a: {}, fl: {}, bitwy: {} }, { merge: true });
  const nr = (await getDocs(collection(db, "bohaterowie"))).docs.find(d => d.id === "czarny-smok-koszmarne-widma").data()._nr;
  for (const d of (await getDocs(collection(db, "bohaterowie"))).docs) if (d.data()._nr > nr) await updateDoc(d.ref, { _nr: d.data()._nr + 1 });
  await setDoc(doc(db, "bohaterowie", ID), { frakcja: "czarny-smok", imie: "Baba Jaga", tytul: "", funkcja: "", wiek: "", bron: "", opis: "", wladca: false, id: ID, _nr: nr + 1 });
  const st = (await getDoc(doc(db, "tajne_statusy", "czarny-smok"))).data() || { statusy: {} };
  st.statusy[ID] = { status: "misja", misja: "z armią" }; await setDoc(doc(db, "tajne_statusy", "czarny-smok"), st);
});
const logi = async () => { let l = []; await baza(async db => { l = (await getDocs(collection(db, "logi"))).docs.map(d => d.data()); }); return l; };
let przed = (await logi()).length;
for (const [i, kto] of [[1, "gm@test.pl"], [2, "cs@test.pl"], [3, "gm@test.pl"], [4, "gm@test.pl"]].map(([i, k]) => [i, k])) {
  await wejdz(kto);
  const l = await logi(), nowe = l.slice(przed); przed = l.length;   // shortcut: kolejność dokumentów z emulatora = kolejność dodania — wystarcza w teście
  let jest; await baza(async db => { jest = (await getDoc(doc(db, "bohaterowie", ID))).exists(); });
  const oJadze = nowe.filter(x => JSON.stringify(x).includes("baba"));
  console.log(`wejście ${i} (${kto}): nowych logów ${nowe.length}, o Jadze ${oJadze.length}, dokument istnieje: ${jest}`);
  oJadze.forEach(x => console.log("   ", JSON.stringify(x).slice(0, 400)));
}
console.log("błędy:", bledy.length ? bledy : "brak");
await b.close(); await env.cleanup();
