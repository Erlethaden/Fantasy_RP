import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, set, onValue, onDisconnect, serverTimestamp, goOffline } from "firebase/database";
const env = await initializeTestEnvironment({ projectId: "demo-frp", database: { rules: readFileSync("database.rules.json", "utf8"), host: "127.0.0.1", port: 9005 } });
const A = env.authenticatedContext("ua").database(), B = env.authenticatedContext("ub").database();
const moj = ref(A, "obecnosc/ua"), wpis = on => ({ f: "fa", on, t: serverTimestamp() });
onValue(ref(A, ".info/connected"), s => { if (s.val()) onDisconnect(moj).set(wpis(false)).then(() => set(moj, wpis(true))); });   // jak zglosObecnosc
const stany = [];
onValue(ref(B, "obecnosc/ua"), s => { const v = s.val(); if (v) { stany.push(v.on); console.log("B widzi:", v.on ? "online" : "offline", typeof v.t); } });
await new Promise(r => setTimeout(r, 1500));
goOffline(A);   // zerwane połączenie (Alt+F4 / awaria)
await new Promise(r => setTimeout(r, 2500));
console.log(stany.includes(true) && stany.at(-1) === false ? "OK: online → offline przez serwer" : "BŁĄD: " + stany);
await env.cleanup();
