// reguły propozycji z etapu 20: rekrutacja w mieście własnej prowincji (do 400), podział i połączenie własnych armii
//   firebase emulators:exec --only firestore --project demo-frp "node test_reguly_rekrutacja.mjs <ścieżka firestore.rules>"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  for (const [uid, rola, frakcja] of [["gm", "gm", ""], ["a", "gracz", "aurelia"], ["b", "gracz", "goblandia"]])
    await setDoc(doc(d, "uzytkownicy", uid), { email: uid + "@t.pl", nazwa: uid, rola, frakcja, utworzono: "" });
  await setDoc(doc(d, "gra", "prowincje"), { p: { "12": { wlasciciel: "aurelia" }, "13": { wlasciciel: "goblandia" } } });
  await setDoc(doc(d, "gra", "armie"), { a: { a1: { f: "aurelia", p: "12", o: 0 }, a2: { f: "aurelia", p: "12", o: 0 }, g1: { f: "goblandia", p: "13", o: 0 } }, fl: {} });
});
const db = uid => env.authenticatedContext(uid).firestore();
const prop = (uid, frakcja, cel, celId, zmiany) => setDoc(doc(db(uid), "propozycje", `${uid}-${cel}-${Math.random()}`), {
  czas: "", uid, email: uid + "@t.pl", frakcja, cel, celId, nazwa: "x", zmiany, przed: {}, status: "czeka", komentarz: "", rozpatrzono: "", rozpatrzyl: "" });
let n = 0; const ok = async (opis, p) => { await assertSucceeds(p); n++; console.log("✔", opis); }, nie = async (opis, p) => { await assertFails(p); n++; console.log("✔ (odrzucone)", opis); };
await ok("rekrutacja we własnym mieście", prop("a", "aurelia", "rekrutacja", "12", { p: "12", j: "Łucznicy", n: 200, cel: "armia" }));
await nie("rekrutacja w cudzym mieście", prop("a", "aurelia", "rekrutacja", "13", { p: "13", j: "Łucznicy", n: 200, cel: "armia" }));
await nie("ponad 400", prop("a", "aurelia", "rekrutacja", "12", { p: "12", j: "Łucznicy", n: 401, cel: "armia" }));
await nie("zły cel", prop("a", "aurelia", "rekrutacja", "12", { p: "12", j: "Łucznicy", n: 10, cel: "flota" }));
await nie("dodatkowe pole", prop("a", "aurelia", "rekrutacja", "12", { p: "12", j: "Łucznicy", n: 10, cel: "armia", koszt: 0 }));
await ok("rekrutacja do wskazanej armii", prop("a", "aurelia", "rekrutacja", "12", { p: "12", j: "Łucznicy", n: 50, cel: "armia", armia: "a1" }));
await nie("armia nie tekstem", prop("a", "aurelia", "rekrutacja", "12", { p: "12", j: "Łucznicy", n: 50, cel: "armia", armia: 5 }));
await ok("podział własnej armii", prop("a", "aurelia", "podzial", "a1", { ile: { "Łucznicy": 30 } }));
await nie("podział cudzej armii", prop("a", "aurelia", "podzial", "g1", { ile: { "Łucznicy": 30 } }));
await ok("połączenie własnych armii", prop("a", "aurelia", "laczenie", "a1", { z: "a2" }));
await nie("połączenie z cudzą armią", prop("a", "aurelia", "laczenie", "a1", { z: "g1" }));
console.log(n, "OK"); await env.cleanup(); process.exit(0);
