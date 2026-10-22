// test reguł Firestore Kronikarza Zgrzyta (13): szkic tylko GM, opublikowana — członkowie, szept — tylko jego kraj i GM; pisze tylko GM
//   firebase emulators:exec --only firestore --project demo-frp "node test_reguly_opowiesci.mjs <ścieżka firestore.rules>"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
await env.withSecurityRulesDisabled(async c => {
  for (const [uid, rola, frakcja] of [["gm", "gm", ""], ["a", "gracz", "aurelia"], ["b", "gracz", "goblandia"], ["o", "obserwator", ""], ["x", "oczekujacy", ""]])
    await setDoc(doc(c.firestore(), "uzytkownicy", uid), { email: uid + "@t.pl", nazwa: uid, rola, frakcja, utworzono: "" });
  await setDoc(doc(c.firestore(), "opowiesci", "1"), { tura: 1, akapity: ["szkic"], szepty: { aurelia: ["tajne"] }, opublikowana: false });
  await setDoc(doc(c.firestore(), "opowiesci", "2"), { tura: 2, akapity: ["jawne"], opublikowana: true });
  await setDoc(doc(c.firestore(), "szepty", "2_aurelia"), { tura: 2, kraj: "aurelia", akapity: ["tajne"] });
});
const db = uid => env.authenticatedContext(uid).firestore();
let n = 0; const ok = async (opis, p) => { await assertSucceeds(p); n++; console.log("✔", opis); }, nie = async (opis, p) => { await assertFails(p); n++; console.log("✔ (odrzucone)", opis); };
await ok("GM czyta szkic", getDoc(doc(db("gm"), "opowiesci/1")));
await nie("gracz nie czyta szkicu (są w nim wszystkie szepty)", getDoc(doc(db("a"), "opowiesci/1")));
await nie("obserwator nie czyta szkicu", getDoc(doc(db("o"), "opowiesci/1")));
await ok("gracz czyta opublikowaną opowieść", getDoc(doc(db("b"), "opowiesci/2")));
await ok("obserwator czyta opublikowaną opowieść", getDoc(doc(db("o"), "opowiesci/2")));
await nie("oczekujący nie czyta opowieści", getDoc(doc(db("x"), "opowiesci/2")));
await ok("Aurelia czyta swój szept", getDoc(doc(db("a"), "szepty/2_aurelia")));
await nie("Goblandia nie czyta szeptu Aurelii", getDoc(doc(db("b"), "szepty/2_aurelia")));
await nie("obserwator nie czyta szeptu", getDoc(doc(db("o"), "szepty/2_aurelia")));
await nie("brak szeptu → odmowa, nie błąd danych", getDoc(doc(db("b"), "szepty/2_goblandia")));
await ok("GM czyta każdy szept", getDoc(doc(db("gm"), "szepty/2_aurelia")));
await nie("gracz nie zapisuje opowieści", setDoc(doc(db("a"), "opowiesci/3"), { tura: 3, akapity: ["x"], opublikowana: true }));
await nie("gracz nie zapisuje szeptu", setDoc(doc(db("a"), "szepty/3_aurelia"), { tura: 3, kraj: "aurelia", akapity: ["x"] }));
await nie("gracz nie publikuje szkicu", setDoc(doc(db("a"), "opowiesci/1"), { tura: 1, akapity: ["x"], opublikowana: true }));
await ok("GM publikuje", setDoc(doc(db("gm"), "opowiesci/1"), { tura: 1, akapity: ["po poprawkach"], opublikowana: true }));
await ok("GM zapisuje szept", setDoc(doc(db("gm"), "szepty/1_goblandia"), { tura: 1, kraj: "goblandia", akapity: ["psst"] }));
await ok("GM usuwa opowieść (cofnięcie tury)", deleteDoc(doc(db("gm"), "opowiesci/1")));
await ok("GM usuwa szept", deleteDoc(doc(db("gm"), "szepty/1_goblandia")));
console.log(`OK — ${n} sprawdzeń`); await env.cleanup();
