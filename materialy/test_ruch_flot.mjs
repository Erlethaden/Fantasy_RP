// test 7.8d (DEMO): cel floty klikiem w akwen, „za N tur”, ruch przy zamknięciu tury, cofnięcie tury, jezioro bez żeglugi = brak drogi
import { chromium } from "playwright-core";
import assert from "node:assert";
import { readFileSync } from "node:fs";
const AKWENY = JSON.parse(readFileSync(process.argv[3] || new URL("../assets/mapa/akweny.json", import.meta.url)));   // argv[3]: ścieżka akweny.json, gdy test uruchamiany spoza materialy/
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/");
await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz");
await s.waitForSelector("#aplikacja:not([hidden])");
await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const F = "rogus-ardens", szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
await szukaj("90a"); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", F); await s.waitForTimeout(300);
await s.click(`#lista-frakcji [data-id=${F}]`); await s.waitForSelector("[data-nowa-flota]");
await s.click("[data-nowa-flota]"); await s.waitForTimeout(300);
const form = () => s.locator("form.armia[data-fl]").first();
const karta = async () => { if (!(await form().isVisible().catch(() => false))) { await s.click(`#lista-frakcji [data-id=${F}]`); await s.waitForTimeout(200); } };
const info = async () => (await form().locator(".armia-info").textContent()).replace(/\s+/g, " ");
const akwenFloty = async () => (await info()).split("·")[1].split("Mieści")[0].trim();
const idStartu = "A" + (await akwenFloty()).split(" ")[1], start = AKWENY.findIndex(a => a.id === idStartu) + 1;
// cel: akwen morski co najmniej 3 kroki dalej (BFS tylko po morzu)
const odl = new Map([[start, 0]]), kol = [start];
for (let n = 0; n < kol.length; n++) for (const [j, t] of AKWENY[kol[n] - 1].sasiedzi)
  if (!odl.has(j) && t === "morze" && AKWENY[j - 1].typ === "morze") { odl.set(j, odl.get(kol[n]) + 1); kol.push(j); }
const srodek = nr => { const a = AKWENY[nr - 1]; return a.x > 1400 && a.x < 3600 && a.y > 800 && a.y < 4200; };   // przy krawędzi mapa nie wyśrodkuje akwenu
const [cel, D] = [...odl].find(([n, d]) => d >= 3 && srodek(n));
const zaIle = n => `za ${n} ${n === 1 ? "turę" : n < 5 ? "tury" : "tur"}`;
console.log("start", AKWENY[start - 1].id, "cel", AKWENY[cel - 1].id);
// klik w akwen: wyszukiwarka centruje mapę na akwenie, potem klik w środek mapy
const wskaz = async (przycisk, nr) => {   // przycisk → klik w akwen nr (próby wokół środka mapy, aż karta floty pokaże ten akwen jako cel)
  const nazwa = `Akwen ${AKWENY[nr - 1].id.slice(1)}`;
  for (const [dx, dy] of [[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40], [80, 80], [-80, -80], [80, -80], [-80, 80]]) {
    await karta(); await form().locator(przycisk).click();
    await szukaj(nazwa); await s.waitForTimeout(400);   // mapa centruje akwen w części widocznej obok szuflady
    const m = await s.locator("#mapa").boundingBox(), sz = await s.locator("#szuflada").boundingBox();
    await s.mouse.click((m.x + sz.x) / 2 + dx, m.y + m.height / 2 + dy); await s.waitForTimeout(400);
    await karta(); if ((await info()).includes(`Cel: ${nazwa}`)) return;
  }
  throw new Error("nie udało się kliknąć " + nazwa);
};
await wskaz("[data-cel]", cel);
let t = await info(); console.log("po celu:", t.split("Cel:")[1]);
assert.ok(t.includes(`Cel: Akwen ${AKWENY[cel - 1].id.slice(1)}`) && t.includes(zaIle(D)), t);
// zamknięcie tury → 1 akwen dalej, za 2 tury
await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(500);
await karta(); t = await info();
console.log("po turze:", await akwenFloty(), "|", t.split("Cel:")[1]);
assert.ok(t.includes(zaIle(D - 1)) && await akwenFloty() !== `Akwen ${AKWENY[start - 1].id.slice(1)}`, t);
await szukaj(`Akwen ${AKWENY[cel - 1].id.slice(1)}`); await s.click("#zamknij-szuflade").catch(() => {}); await s.waitForTimeout(600);
await s.locator("#mapa").screenshot({ path: process.argv[2] + "/ruch_floty.png" });
{ const m = await s.locator("#mapa").boundingBox(); await s.mouse.move(m.x + m.width * 0.35, m.y + m.height * 0.25);   // oddalenie: cała trasa od startu
  for (let i = 0; i < 2; i++) { await s.mouse.wheel(0, 300); await s.waitForTimeout(150); }
  await s.mouse.move(m.x + 600, m.y + 400); await s.mouse.down(); await s.mouse.move(m.x + 950, m.y + 500, { steps: 10 }); await s.mouse.up();   // start floty przy lewej krawędzi
  await s.waitForTimeout(600); await s.locator("#mapa").screenshot({ path: process.argv[2] + "/ruch_floty_cala.png" }); }
// cofnięcie tury → z powrotem w starcie, za 3 tury
await s.click("#panel-gm"); await s.click("#cofnij-ture"); await s.waitForTimeout(500);
await karta(); t = await info();
assert.ok(t.includes(zaIle(D)) && await akwenFloty() === `Akwen ${AKWENY[start - 1].id.slice(1)}`, "cofnięcie: " + t);
// jezioro bez żeglugi → brak drogi; z żeglugą → droga
const jezioro = AKWENY.findIndex((a, k) => a.typ === "jezioro" && a.sasiedzi.length && srodek(k + 1)) + 1;
await wskaz("[data-cel]", jezioro); t = await info(); console.log("jezioro:", t.split("Cel:")[1]);
assert.ok(t.includes("brak drogi"), t);
await s.check("[data-przejscie=zegluga]"); await s.waitForTimeout(300); t = await info(); console.log("z żeglugą:", t.split("Cel:")[1]);
assert.ok(/za \d+ tur/.test(t), t);
// usuń cel
await form().locator("[data-bez-celu]").click(); await s.waitForTimeout(300);
assert.ok(!(await info()).includes("Cel:"));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
