// test reguł Firestore dla historii (9.1): historia/{nr} czyta i pisze tylko GM — uruchamiać przez:
//   firebase emulators:exec --only firestore --project demo-frp "node test_reguly_historia.mjs <ścieżka firestore.rules>"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
await env.withSecurityRulesDisabled(async c => {
  for (const [uid, rola, frakcja] of [["gm", "gm", ""], ["g", "gracz", "aurelia"], ["o", "obserwator", ""]])
    await setDoc(doc(c.firestore(), "uzytkownicy", uid), { email: uid + "@t.pl", nazwa: uid, rola, frakcja, utworzono: "" });
});
const ref = uid => doc(env.authenticatedContext(uid).firestore(), "historia", "1");
const z = { nr: 1, data: "", wlasciciele: { "1a": "aurelia" }, armie: [], floty: [], bitwy: [], wojny: [], kraje: {} };
let n = 0; const ok = async (opis, p) => { await assertSucceeds(p); n++; console.log("✔", opis); }, nie = async (opis, p) => { await assertFails(p); n++; console.log("✔ (odrzucone)", opis); };
await ok("GM zapisuje historię tury", setDoc(ref("gm"), z));
await ok("GM czyta historię", getDoc(ref("gm")));
await nie("gracz nie czyta historii (zasoby wszystkich krain)", getDoc(ref("g")));
await nie("obserwator nie czyta historii", getDoc(ref("o")));
await nie("gracz nie zapisuje historii", setDoc(ref("g"), z));
await ok("GM usuwa historię (cofnięcie tury)", deleteDoc(ref("gm")));
console.log(`OK — ${n} sprawdzeń`); await env.cleanup();
