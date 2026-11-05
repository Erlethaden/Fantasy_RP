// reguły tajnych odliczań: czyta gracz tej frakcji + GM, pisze tylko GM
//   firebase emulators:exec --only firestore --project demo-frp "node test_reguly_odliczania.mjs <ścieżka firestore.rules>"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  for (const [uid, rola, frakcja] of [["gm", "gm", ""], ["a", "gracz", "aurelia"], ["b", "gracz", "goblandia"], ["o", "obserwator", ""]])
    await setDoc(doc(d, "uzytkownicy", uid), { email: uid + "@t.pl", nazwa: uid, rola, frakcja, utworzono: "" });
  await setDoc(doc(d, "tajne_odliczania", "goblandia"), { o: [{ nazwa: "Spisek", tura: 5, tajne: true }] });
});
const db = uid => env.authenticatedContext(uid).firestore();
let n = 0; const ok = async (opis, p) => { await assertSucceeds(p); n++; console.log("✔", opis); }, nie = async (opis, p) => { await assertFails(p); n++; console.log("✔ (odrzucone)", opis); };
await ok("Goblandia czyta swoje", getDoc(doc(db("b"), "tajne_odliczania/goblandia")));
await ok("GM czyta", getDoc(doc(db("gm"), "tajne_odliczania/goblandia")));
await nie("Aurelia nie czyta cudzych", getDoc(doc(db("a"), "tajne_odliczania/goblandia")));
await nie("obserwator nie czyta", getDoc(doc(db("o"), "tajne_odliczania/goblandia")));
await nie("Goblandia nie pisze", setDoc(doc(db("b"), "tajne_odliczania/goblandia"), { o: [] }));
await ok("GM pisze", setDoc(doc(db("gm"), "tajne_odliczania/goblandia"), { o: [] }));
console.log(n, "OK"); await env.cleanup(); process.exit(0);
