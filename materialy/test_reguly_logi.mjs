// test reguł Firestore dla logów ze szczegółami zmian (pole „zmiany”) w emulatorze — uruchamiać przez:
//   firebase emulators:exec --only firestore --project demo-frp "node test_reguly_logi.mjs <ścieżka firestore.rules>"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "uzytkownicy", "gm"), { email: "gm@t.pl", nazwa: "gm", rola: "gm", frakcja: "", utworzono: "" }); });
const logi = collection(env.authenticatedContext("gm").firestore(), "logi");
const wpis = (o = {}) => ({ czas: new Date().toISOString(), uid: "gm", email: "gm@t.pl", typ: "zmiana", co: ["gra/stan"], ...o });
const zm = n => Array.from({ length: n }, (_, i) => ({ d: "gra/stan", p: `pole${i}`, z: "1", n: "2" }));
let n = 0; const ok = async (opis, p) => { await assertSucceeds(p); n++; console.log("✔", opis); }, nie = async (opis, p) => { await assertFails(p); n++; console.log("✔ (odrzucone)", opis); };
await ok("log bez szczegółów (stary format)", addDoc(logi, wpis()));
await ok("log z 40 zmianami", addDoc(logi, wpis({ zmiany: zm(40) })));
await nie("log z 41 zmianami", addDoc(logi, wpis({ zmiany: zm(41) })));
await nie("log z obcym polem", addDoc(logi, wpis({ cos: 1 })));
await nie("log pod cudzym uid", addDoc(logi, wpis({ uid: "inny" })));
console.log(`OK — ${n} sprawdzeń`); await env.cleanup();
