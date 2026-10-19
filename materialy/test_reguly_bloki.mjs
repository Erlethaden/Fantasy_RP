// test reguł Firestore dla bloków i kroniki (7.9b) w emulatorze: node test_reguly_bloki.mjs  (uruchamiać przez:
//   firebase emulators:exec --only firestore --project demo-frp "node test_reguly_bloki.mjs <ścieżka firestore.rules>")
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  for (const [uid, rola, frakcja] of [["r", "gracz", "R"], ["g", "gracz", "G"], ["a", "gracz", "A"], ["x", "gracz", "X"], ["gm", "gm", ""]])
    await setDoc(doc(db, "uzytkownicy", uid), { email: uid + "@t.pl", nazwa: uid, rola, frakcja, utworzono: "" });
});
const db = uid => env.authenticatedContext(uid).firestore();
const blok = (o = {}) => { const b = { nazwa: "Przymierze", skrot: "PP", rodzaj: "sojusz", kolor: "#d9b25a", opis: "", czlonkowie: ["R"], zaproszeni: ["G", "A"], tajny: true, tryb: "glosowanie", lider: "R", traktaty: [], tura: 1, wnioski: {}, ...o }; b.widza = [...b.czlonkowie, ...b.zaproszeni]; return b; };
const ref = (uid, id = "b1") => doc(db(uid), "bloki", id);
let n = 0; const ok = async (opis, p) => { await assertSucceeds(p); n++; console.log("✔", opis); }, nie = async (opis, p) => { await assertFails(p); n++; console.log("✔ (odrzucone)", opis); };
await nie("gracz zakłada blok z innym członkiem", setDoc(ref("r"), blok({ czlonkowie: ["R", "G"] })));
await nie("gracz zakłada blok z cudzym liderem", setDoc(ref("r"), blok({ lider: "G" })));
await ok("gracz zakłada blok (jedyny członek i lider)", setDoc(ref("r"), blok()));
await nie("obcy nie czyta tajnego bloku", getDoc(ref("x")));
await ok("zaproszony czyta tajny blok", getDoc(ref("g")));
await nie("niezaproszony dołącza", setDoc(ref("x"), blok({ czlonkowie: ["R", "X"], zaproszeni: ["G", "A"] })));
await nie("zaproszony dołącza i zmienia nazwę", setDoc(ref("g"), blok({ czlonkowie: ["R", "G"], zaproszeni: ["A"], nazwa: "Moje" })));
await ok("zaproszony dołącza", setDoc(ref("g"), blok({ czlonkowie: ["R", "G"], zaproszeni: ["A"] })));
await ok("zaproszony odrzuca", setDoc(ref("a"), blok({ czlonkowie: ["R", "G"], zaproszeni: [] })));
const b2 = blok({ czlonkowie: ["R", "G"], zaproszeni: [] });
await nie("członek zmienia nazwę bez głosowania", setDoc(ref("g"), { ...b2, nazwa: "Inne" }));
const w = { typ: "zmiana", dane: { nazwa: "Wielkie Przymierze" }, autor: "R", za: ["R"], przeciw: [], tura: 1 };
await ok("członek zgłasza wniosek", setDoc(ref("r"), { ...b2, wnioski: { w1: w } }));
await nie("wykonanie bez większości (1 z 2)", setDoc(ref("r"), { ...b2, nazwa: "Wielkie Przymierze", wnioski: {}, wykonano: "w1" }));
await ok("drugi członek głosuje za", setDoc(ref("g"), { ...b2, wnioski: { w1: { ...w, za: ["R", "G"] } } }));
await ok("wykonanie przegłosowanego wniosku", setDoc(ref("g"), { ...b2, nazwa: "Wielkie Przymierze", wnioski: {}, wykonano: "w1" }));
const b3 = { ...b2, nazwa: "Wielkie Przymierze", wnioski: {}, wykonano: "w1" };
await nie("obcy głosuje", setDoc(ref("x"), { ...b3, wnioski: { w2: { ...w, autor: "X", za: ["X"] } } }));
await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), "bloki", "b1"), { ...b3, tryb: "lider", lider: "G" }));
const b4 = { ...b3, tryb: "lider", lider: "G" };
await ok("lider zmienia blok sam", setDoc(ref("g"), { ...b4, opis: "Statut lidera" }));
await nie("nie-lider zmienia blok w trybie lidera", setDoc(ref("r"), { ...b4, opis: "Statut R" }));
await ok("członek wychodzi z bloku", setDoc(ref("r"), { ...b4, opis: "Statut lidera", czlonkowie: ["G"], widza: ["G"] }));
await nie("gracz usuwa blok", deleteDoc(ref("g")));
await ok("GM usuwa blok", deleteDoc(ref("gm")));
const wpis = (o = {}) => ({ tura: 1, czas: "2026-10-20", typ: "blok", tekst: "Powstaje Przymierze", kraje: ["R"], tajny: false, widza: [], ...o });
await ok("gracz dopisuje wpis kroniki o bloku", setDoc(doc(db("r"), "kronika", "k1"), wpis()));
await nie("gracz dopisuje inny wpis kroniki", setDoc(doc(db("r"), "kronika", "k2"), wpis({ typ: "gm" })));
await nie("gracz dopisuje wpis bez swojego kraju", setDoc(doc(db("r"), "kronika", "k3"), wpis({ kraje: ["G"] })));
await nie("gracz zmienia istniejący wpis kroniki", setDoc(doc(db("r"), "kronika", "k1"), wpis({ tekst: "Inaczej" })));
// blok założony przez GM bez pola wnioski (7.9a) — zaproszony gracz może dołączyć
await env.withSecurityRulesDisabled(async c => { const b = blok({ czlonkowie: ["G"], zaproszeni: ["R"], lider: "G" }); delete b.wnioski; await setDoc(doc(c.firestore(), "bloki", "b2"), b); });
{ const b = blok({ czlonkowie: ["G", "R"], zaproszeni: [], lider: "G" }); delete b.wnioski; await ok("dołączenie do bloku GM bez pola wnioski", setDoc(ref("r", "b2"), b)); }
console.log(`OK — ${n} sprawdzeń`);
await env.cleanup();
