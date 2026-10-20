// test 7.8f (DEMO): bitwa morska — wojna, flota Rogusa z armią na pokładzie wpływa do akwenu z flotą Goblandii → bitwa przy zamknięciu tury,
// ekran bitwy (floty + armia na pokładzie), wynik: flota zatopiona, armia wysadzona na brzeg → PNG: node test_bitwy_morskie.mjs <folder>
import { chromium } from "playwright-core";
import assert from "node:assert";
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
const OUT = process.argv[2], F = "rogus-ardens", G = "goblandia";
const szukaj = async t => { await s.click("#szukaj"); await s.fill("#szukaj", t); await s.press("#szukaj", "Enter"); await s.waitForTimeout(400); };
const karta = async (w = F) => { await s.click(`#lista-frakcji [data-id=${w}]`); await s.waitForTimeout(250); if (!(await s.locator("[data-nowa-flota]").isVisible().catch(() => false))) { await s.click(`#lista-frakcji [data-id=${w}]`); await s.waitForTimeout(250); } };
const srodek = async () => { const m = await s.locator("#mapa").boundingBox(), sz = await s.locator("#szuflada").boundingBox(); return [(m.x + sz.x) / 2, m.y + m.height / 2]; };
const fa = () => s.locator("form.armia[data-a]").first(), info = async () => (await fa().locator(".armia-info").textContent()).replace(/\s+/g, " ");
const jednostka = async (nazwa, okret, poj) => { const fj = s.locator(".dodaj-jednostke"); await fj.locator("[name=nazwa]").fill(nazwa);
  if (okret) { await fj.locator("[name=morska]").check(); if (poj) await fj.locator("[name=pojemnosc]").fill(String(poj)); } await fj.locator(".dodaj").click(); await s.waitForTimeout(250); };
const okrety = async (ff, ile) => { await ff.locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(250); await ff.locator("input[name=n]").fill(String(ile)); await ff.locator("input[name=n]").press("Tab"); await s.waitForTimeout(250); };
// Rogus: armia w D154, floty przy D183; Goblandia: flota przy D185
for (const [p, w] of [["D154", F], ["D183", F], ["D185", G]]) { await szukaj(p); await s.selectOption(".edycja-prowincji select[name=wlasciciel]", w); await s.waitForTimeout(250); }
await karta(F); await jednostka("Chochliki"); await jednostka("Galera ognia", true, 400);
await s.click("[data-nowa-armia]"); await s.waitForTimeout(250);
await fa().locator("[data-dodaj-oddzial]").click(); await s.waitForTimeout(250);
await fa().locator("input[name=n]").first().fill("900"); await fa().locator("input[name=n]").first().press("Tab"); await s.waitForTimeout(250);
await fa().locator("[data-przestaw]").click(); await szukaj("D154"); await s.mouse.click(...await srodek()); await s.waitForTimeout(400);
await karta(F); await s.click("[data-nowa-flota]"); await s.waitForTimeout(250);
const ffR = () => s.locator("form.armia[data-fl]").first();
await ffR().locator("[name=nazwa]").fill("Flota Siarki"); await ffR().locator("[name=nazwa]").press("Tab"); await s.waitForTimeout(250); await okrety(ffR(), 3);
await karta(G); await jednostka("Łódź bojowa goblinów", true); await s.click("[data-nowa-flota]"); await s.waitForTimeout(250);
const ffG = () => s.locator("form.armia[data-fl]").first();
await ffG().locator("[name=nazwa]").fill("Zielona Flota"); await ffG().locator("[name=nazwa]").press("Tab"); await s.waitForTimeout(250); await okrety(ffG(), 12);
// wojna
await s.click("#panel-gm"); await s.selectOption(".nowa-wojna select[name=k1]", F); await s.selectOption(".nowa-wojna select[name=k2]", G); await s.click(".nowa-wojna button.dodaj"); await s.waitForTimeout(250);
// armia: cel D60 przez morze, transport: Flota Siarki
let t = "";
for (const [dx, dy] of [[0, 0], [25, 0], [-25, 0], [0, 25]]) {
  await karta(F); await fa().locator("[data-cel]").click(); await szukaj("D60"); const [x, y] = await srodek(); await s.mouse.click(x + dx, y + dy); await s.waitForTimeout(400);
  await karta(F); t = await info(); if (t.includes("przez morze")) break;
}
assert.ok(t.includes("przez morze"), t);
await fa().locator(".transport input").first().check(); await s.waitForTimeout(300);
const tura = async () => { await s.click("#panel-gm"); await s.click("#zamknij-ture"); await s.waitForTimeout(400); await karta(F); return info(); };
for (let n = 0; n < 8 && !(t = await tura()).includes("na pokładzie"); n++);
console.log("na pokładzie:", t.split("żołnierzy ·")[1]?.split("Cel:")[0]);
assert.ok(t.includes("na pokładzie"));
// Goblandia stawia flotę w następnym akwenie trasy (A65) — Rogus wpłynie do niego przy zamknięciu tury
await karta(G);
for (const [dx, dy] of [[0, 0], [30, 0], [-30, 0], [0, 30]]) {
  await ffG().locator("[data-przestaw]").click(); await szukaj("Akwen 65"); const [x, y] = await srodek(); await s.mouse.click(x + dx, y + dy); await s.waitForTimeout(400);
  await karta(G); if ((await ffG().locator(".armia-info").textContent()).includes("Akwen 65")) break;
}
assert.ok((await ffG().locator(".armia-info").textContent()).includes("Akwen 65"), "przestawienie floty Goblandii");
t = await tura(); console.log("po turze:", t.split("żołnierzy ·")[1]?.slice(0, 160));
const fl = (await ffR().locator(".armia-info").textContent()).replace(/\s+/g, " "); console.log("flota:", fl.slice(fl.indexOf("Na pokładzie")));
assert.ok(fl.includes("W bitwie morskiej"), "bitwa morska nie wybuchła: " + fl);
assert.ok(t.includes("W bitwie morskiej"), "karta armii na pokładzie bez bitwy: " + t);
// tura w bitwie — floty stoją
t = await tura(); assert.ok(t.includes("Akwen 65"), "armia w bitwie popłynęła dalej: " + t);
// ekran bitwy
await karta(F); await ffR().locator("[data-ekran-bitwy]").click(); await s.waitForSelector("#bitwa[open]"); await s.waitForTimeout(400);
const ekran = (await s.locator("#bitwa").textContent()).replace(/\s+/g, " ");
assert.ok(ekran.includes("Bitwa morska") && ekran.includes("Flota Siarki") && ekran.includes("Zielona Flota") && ekran.includes("na pokładzie"), ekran.slice(0, 300));
await s.locator("#bitwa").screenshot({ path: OUT + "/bitwa_morska.png" });
// wynik: Goblandia wygrywa, Flota Siarki zatopiona, armia wysadzona na brzeg, straty galer 1
await s.selectOption("#bitwa select[name=zwyciezca]", { index: 1 });
await s.locator("#bitwa .armia-bitwy:has(h4:text-is('Flota Siarki')) select[name=los]").selectOption("zatopiona");
await s.locator("#bitwa .armia-bitwy:has(h4:has-text('na pokładzie')) select[name=los]").selectOption({ index: 1 });
const brzeg = await s.locator("#bitwa .armia-bitwy:has(h4:has-text('na pokładzie')) select[name=los] option:checked").textContent();
await s.locator("#bitwa .armia-bitwy:has(h4:text-is('Zielona Flota')) input.straty").first().fill("4");
await s.fill("#bitwa textarea[name=opis]", "Zielona Flota zaskoczyła galery we mgle.");
await s.click("#bitwa .koniec-bitwy button.dodaj"); await s.waitForTimeout(500);
await karta(F); t = await info(); console.log("armia po bitwie:", t.split("żołnierzy ·")[1]?.slice(0, 80), "| wybrano:", brzeg);
assert.ok(t.includes(brzeg.replace("wysadzona na brzeg: ", "")) && !t.includes("na pokładzie"), "armia nie wysadzona: " + t);
assert.equal(await s.locator("form.armia[data-fl]").count(), 0, "Flota Siarki nie zatonęła");
await karta(G); assert.ok((await ffG().locator(".armia-info").textContent()).includes("8 okrętów"), "straty Zielonej Floty");
// ekran zakończonej bitwy (z historii na karcie frakcji)
await karta(F); await s.locator("[data-bitwa]").first().click(); await s.waitForSelector("#bitwa[open]"); await s.waitForTimeout(400);
await s.locator("#bitwa").screenshot({ path: OUT + "/bitwa_morska_po.png" });
const po = (await s.locator("#bitwa").textContent()).replace(/\s+/g, " ");
assert.ok(po.includes("zatopiona") && po.includes("wysadzona na brzeg"), po.slice(0, 400));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
