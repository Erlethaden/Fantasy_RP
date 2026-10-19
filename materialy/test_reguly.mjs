// uruchomienie (Java + w osobnym folderze: npm i firebase-tools @firebase/rules-unit-testing firebase; firebase.json z firestore.rules i portem 8085):
//   npx firebase emulators:exec --only firestore --project demo-frp "node test_reguly.mjs firestore.rules"
// test reguł propozycji (4.4, 7.12–7.15) na emulatorze Firestore
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection, query, where, FieldPath } from "firebase/firestore";
const env = await initializeTestEnvironment({ projectId: "demo-frp", firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8085 } });
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  await setDoc(doc(db, "uzytkownicy/ua"), { rola: "gracz", frakcja: "fa" });
  await setDoc(doc(db, "uzytkownicy/ub"), { rola: "gracz", frakcja: "fb" });
  await setDoc(doc(db, "uzytkownicy/uc"), { rola: "gracz", frakcja: "fc" });
  await setDoc(doc(db, "uzytkownicy/ugm"), { rola: "gm", frakcja: "" });
  await setDoc(doc(db, "gra/prowincje"), { p: { "1a": { wlasciciel: "fa" }, "2a": { wlasciciel: "fb" } } });
  await setDoc(doc(db, "gra/armie"), { a: { xa: { f: "fa", p: "1a", o: -1 }, xb: { f: "fb", p: "2a", o: -1 } } });
  await setDoc(doc(db, "traktaty/t1"), { strony: ["fa", "fb"], tajny: false, nazwa: "T" });
});
const kto = u => env.authenticatedContext(u, { email: u + "@x.pl" }).firestore();
const A = kto("ua"), B = kto("ub"), C = kto("uc"), GM = kto("ugm");
const baza = (u, f, extra) => ({ czas: "2026", uid: u, email: u + "@x.pl", frakcja: f, nazwa: "n", przed: {}, status: "czeka", komentarz: "", rozpatrzono: "", rozpatrzyl: "", ...extra });
const nowa = (db, u, f, extra) => addDoc(collection(db, "propozycje"), baza(u, f, extra));
let ok = 0; const t = async (opis, p) => { await p; ok++; console.log("✓", opis); };
// 7.12–7.13
await t("stolica we własnej prowincji", assertSucceeds(nowa(A, "ua", "fa", { cel: "stolica", celId: "1a", zmiany: { osada: 0 } })));
await t("stolica w cudzej — odmowa", assertFails(nowa(A, "ua", "fa", { cel: "stolica", celId: "2a", zmiany: { osada: 0 } })));
await t("budynki we własnej", assertSucceeds(nowa(A, "ua", "fa", { cel: "budynki", celId: "1a", zmiany: { budynki: { sloty: ["drewno"], zloze: "" } } })));
await t("budynki — obce pole — odmowa", assertFails(nowa(A, "ua", "fa", { cel: "budynki", celId: "1a", zmiany: { budynki: { sloty: [], zloze: "", x: 1 } } })));
// 7.14
await t("ruch własnej armii", assertSucceeds(nowa(A, "ua", "fa", { cel: "ruch", celId: "xa", zmiany: { cel: { p: "2a", o: -1 } } })));
await t("ruch cudzej armii — odmowa", assertFails(nowa(A, "ua", "fa", { cel: "ruch", celId: "xb", zmiany: { cel: { p: "2a", o: -1 } } })));
await t("podszycie pod inną frakcję — odmowa", assertFails(nowa(A, "ua", "fb", { cel: "ruch", celId: "xb", zmiany: { cel: { p: "1a", o: -1 } } })));
// 7.15
const tr = { nazwa: "Sojusz", typ: "sojusz", strony: ["fa", "fb"], tajny: true, opis: "" };
const ref = await assertSucceeds(nowa(A, "ua", "fa", { cel: "traktat", celId: "", strony: ["fa", "fb"], zgody: { fa: true }, zmiany: { traktat: tr } })); ok++; console.log("✓ propozycja traktatu");
await t("traktat bez autora w stronach — odmowa", assertFails(nowa(A, "ua", "fa", { cel: "traktat", celId: "", strony: ["fb", "fc"], zgody: { fa: true }, zmiany: { traktat: { ...tr, strony: ["fb", "fc"] } } })));
await t("traktat z cudzą zgodą — odmowa", assertFails(nowa(A, "ua", "fa", { cel: "traktat", celId: "", strony: ["fa", "fb"], zgody: { fa: true, fb: true }, zmiany: { traktat: tr } })));
await t("strona czyta (zapytanie strony)", assertSucceeds(getDocs(query(collection(B, "propozycje"), where("strony", "array-contains", "fb")))));
await t("nie-strona nie czyta", assertFails(getDoc(doc(C, "propozycje", ref.id))));
await t("autor czyta swoje (zapytanie uid)", assertSucceeds(getDocs(query(collection(A, "propozycje"), where("uid", "==", "ua")))));
await t("strona daje zgodę", assertSucceeds(updateDoc(doc(B, "propozycje", ref.id), new FieldPath("zgody", "fb"), true)));
await t("strona nie zgadza się za kogoś", assertFails(updateDoc(doc(B, "propozycje", ref.id), new FieldPath("zgody", "fa"), false)));
await t("strona nie zmienia statusu", assertFails(updateDoc(doc(B, "propozycje", ref.id), { status: "przyjeta" })));
await t("nie-strona nie daje zgody", assertFails(updateDoc(doc(C, "propozycje", ref.id), new FieldPath("zgody", "fc"), true)));
await t("strona nie kasuje cudzej", assertFails(deleteDoc(doc(B, "propozycje", ref.id))));
await t("zerwanie własnego traktatu", assertSucceeds(nowa(A, "ua", "fa", { cel: "zerwanie", celId: "t1", strony: ["fa"], zgody: {}, zmiany: { zerwij: true } })));
await t("zerwanie cudzego — odmowa", assertFails(nowa(C, "uc", "fc", { cel: "zerwanie", celId: "t1", strony: ["fc"], zgody: {}, zmiany: { zerwij: true } })));
await t("GM kasuje przyjętą", assertSucceeds(deleteDoc(doc(GM, "propozycje", ref.id))));
// 4.4 nadal działa
await t("opis państwa (4.4)", assertSucceeds(nowa(A, "ua", "fa", { cel: "frakcja", celId: "fa", zmiany: { motto: "x" } })));
console.log(`OK: ${ok} sprawdzeń`);
await env.cleanup();
