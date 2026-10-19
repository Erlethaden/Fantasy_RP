// test reguł Realtime Database (obecność graczy, database.rules.json) — jak test_reguly.mjs, ale emulator bazy:
//   firebase.json: {"database":{"rules":"database.rules.json"},"emulators":{"database":{"port":9005}}}; npx firebase emulators:exec --only database --project demo-frp "node test_obecnosc.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, set, get, serverTimestamp } from "firebase/database";
const env = await initializeTestEnvironment({ projectId: "demo-frp", database: { rules: readFileSync("database.rules.json", "utf8"), host: "127.0.0.1", port: 9005 } });
const A = env.authenticatedContext("ua").database(), B = env.authenticatedContext("ub").database(), X = env.unauthenticatedContext().database();
let ok = 0; const t = async (o, p) => { await p; ok++; console.log("✓", o); };
await t("swój wpis online", assertSucceeds(set(ref(A, "obecnosc/ua"), { f: "fa", on: true, t: serverTimestamp() })));
await t("cudzy wpis — odmowa", assertFails(set(ref(A, "obecnosc/ub"), { f: "fb", on: false, t: 1 })));
await t("złe pole — odmowa", assertFails(set(ref(A, "obecnosc/ua"), { f: "fa", on: true, t: 1, x: 1 })));
await t("brak pola — odmowa", assertFails(set(ref(A, "obecnosc/ua"), { f: "fa", on: true })));
await t("on nie bool — odmowa", assertFails(set(ref(A, "obecnosc/ua"), { f: "fa", on: "tak", t: 1 })));
await t("inny gracz czyta", assertSucceeds(get(ref(B, "obecnosc"))));
await t("niezalogowany nie czyta", assertFails(get(ref(X, "obecnosc"))));
await t("zapis poza obecnosc — odmowa", assertFails(set(ref(A, "cos"), 1)));
console.log(`OK: ${ok}`); await env.cleanup();

// rozłączenie (onDisconnect): materialy/test_obecnosc_rozlaczenie.mjs
