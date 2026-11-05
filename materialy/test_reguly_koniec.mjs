// test reguł Firestore końca kampanii (18.3): przed odsłonięciem gracz nie czyta cudzych szeptów, tajnych wpisów Kroniki, tajnych traktatów
// ani cudzych notatek; po ustawieniu gra/stan.ustawienia.koniecKampanii — czytają je członkowie (oczekujący dalej nic); zapis bez zmian
//   firebase emulators:exec --only firestore --project demo-frp "node test_reguly_koniec.mjs <ścieżka firestore.rules>"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
const ustaw = koniec => env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), "gra", "stan"), { zasoby: [], tury: [], ustawienia: { dniLogow: 30, koniecKampanii: koniec } }));
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  for (const [uid, rola, frakcja] of [["gm", "gm", ""], ["a", "gracz", "aurelia"], ["b", "gracz", "goblandia"], ["o", "obserwator", ""], ["x", "oczekujacy", ""]])
    await setDoc(doc(d, "uzytkownicy", uid), { email: uid + "@t.pl", nazwa: uid, rola, frakcja, utworzono: "" });
  await setDoc(doc(d, "szepty", "2_goblandia"), { tura: 2, kraj: "goblandia", akapity: ["tajne"] });
  await setDoc(doc(d, "kronika", "k1"), { tura: 1, typ: "gm", tekst: "SEKRET", kraje: ["goblandia"], tajny: true, widza: ["goblandia"] });
  await setDoc(doc(d, "traktaty", "t1"), { nazwa: "Tajny pakt", typ: "pakt", strony: ["goblandia", "rogus-ardens"], tajny: true });
  await setDoc(doc(d, "notatki_gracza", "goblandia"), { tekst: "moje plany" });
});
const db = uid => env.authenticatedContext(uid).firestore();
const tajneKroniki = uid => getDocs(query(collection(db(uid), "kronika"), where("tajny", "==", true)));
const tajneTraktaty = uid => getDocs(query(collection(db(uid), "traktaty"), where("tajny", "==", true)));
let n = 0; const ok = async (opis, p) => { await assertSucceeds(p); n++; console.log("✔", opis); }, nie = async (opis, p) => { await assertFails(p); n++; console.log("✔ (odrzucone)", opis); };
await ustaw(false);
await nie("trwa kampania: Aurelia nie czyta szeptu Goblandii", getDoc(doc(db("a"), "szepty/2_goblandia")));
await nie("trwa kampania: Aurelia nie czyta tajnego wpisu Kroniki", getDoc(doc(db("a"), "kronika/k1")));
await nie("trwa kampania: Aurelia nie pobiera listy tajnych wpisów", tajneKroniki("a"));
await nie("trwa kampania: Aurelia nie czyta tajnego traktatu", getDoc(doc(db("a"), "traktaty/t1")));
await nie("trwa kampania: Aurelia nie pobiera listy tajnych traktatów", tajneTraktaty("a"));
await nie("trwa kampania: Aurelia nie czyta notatek Goblandii", getDoc(doc(db("a"), "notatki_gracza/goblandia")));
await nie("trwa kampania: obserwator nie czyta szeptu", getDoc(doc(db("o"), "szepty/2_goblandia")));
await ok("trwa kampania: Goblandia czyta swoje", getDoc(doc(db("b"), "notatki_gracza/goblandia")));
await ok("trwa kampania: GM pobiera tajne wpisy", tajneKroniki("gm"));
await ustaw(true);
await ok("koniec: Aurelia czyta szept Goblandii", getDoc(doc(db("a"), "szepty/2_goblandia")));
await ok("koniec: Aurelia czyta tajny wpis Kroniki", getDoc(doc(db("a"), "kronika/k1")));
await ok("koniec: Aurelia pobiera listę tajnych wpisów", tajneKroniki("a"));
await ok("koniec: Aurelia czyta tajny traktat", getDoc(doc(db("a"), "traktaty/t1")));
await ok("koniec: Aurelia pobiera listę tajnych traktatów", tajneTraktaty("a"));
await ok("koniec: Aurelia czyta notatki Goblandii", getDoc(doc(db("a"), "notatki_gracza/goblandia")));
await ok("koniec: obserwator czyta szept", getDoc(doc(db("o"), "szepty/2_goblandia")));
await nie("koniec: oczekujący dalej nic nie czyta", getDoc(doc(db("x"), "szepty/2_goblandia")));
await nie("koniec: oczekujący nie pobiera tajnych wpisów", tajneKroniki("x"));
await nie("koniec: Aurelia nie pisze w notatkach Goblandii", setDoc(doc(db("a"), "notatki_gracza/goblandia"), { tekst: "hehe" }));
await nie("koniec: Aurelia nie zmienia szeptu", setDoc(doc(db("a"), "szepty/2_goblandia"), { tura: 2, kraj: "goblandia", akapity: ["x"] }));
await nie("gracz nie wyłącza sam końca kampanii", setDoc(doc(db("a"), "gra", "stan"), { zasoby: [], tury: [], ustawienia: { koniecKampanii: true } }));
console.log(`OK — ${n} sprawdzeń`); await env.clearFirestore(); await env.cleanup();   // czysta baza dla kolejnych testów w tym samym emulatorze
