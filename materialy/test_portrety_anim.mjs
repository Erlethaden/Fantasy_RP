// test 7.3 (DEMO): miniatura ożywa po najechaniu, duży portret w oknie bohatera, zatrzymanie po zamknięciu, przełącznik (pamięta), ograniczenie ruchu
// node test_portrety_anim.mjs <folder>  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
import assert from "node:assert";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const konteksty = {};   // jeden kontekst na tryb ruchu — wspólna localStorage między stronami (zapamiętany przełącznik)
const start = async (ruch = "no-preference") => {
  konteksty[ruch] ??= await b.newContext({ viewport: { width: 1600, height: 900 }, reducedMotion: ruch });
  const s = await konteksty[ruch].newPage();
  s.bledy = []; s.on("pageerror", e => s.bledy.push(e.message));
  await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));   // bez propozycji Zgrzyta (8.1), zasłaniałaby mapę
  await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
  await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2000);
  await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await s.click("#lista-frakcji [data-id=krag-mhor]"); await s.waitForSelector(".bohater");
  return s;
};
const OUT = process.argv[2];
let s = await start();
const dagna = s.locator(".bohater", { hasText: "Dagna" });
const widoczna = async loc => loc.evaluate(el => { const c = el.querySelector(".portret-anim"); return Boolean(c && !c.hidden); });
assert.ok(!(await widoczna(dagna)), "miniatura nie rusza się bez najechania");
await dagna.hover(); await s.waitForTimeout(600);
assert.ok(await widoczna(dagna), "miniatura po najechaniu");
assert.equal(await dagna.locator("img").evaluate(el => el.style.visibility), "hidden");
await s.mouse.move(5, 5); await s.waitForTimeout(300);
assert.ok(!(await widoczna(dagna)), "miniatura po zjechaniu");
// okno bohatera: duży portret żyje; zmienia się w czasie
await dagna.click(); await s.waitForSelector("#okno[open], dialog[open] .portret.duzy");
const okno = s.locator("dialog[open]").first();
await s.waitForTimeout(700); assert.ok(await widoczna(okno), "duży portret ożywiony");
const klatka = () => okno.locator(".portret-anim").evaluate(c => c.toDataURL().length + ":" + c.toDataURL().slice(-40));
const k1 = await klatka(); await s.waitForTimeout(1300); const k2 = await klatka();
assert.notEqual(k1, k2, "klatki się zmieniają (oddech)");
await okno.locator(".portret.duzy").screenshot({ path: OUT + "/portret_duzy.png" });
// przełącznik: wyłączenie
await okno.locator(".anim-portretow input").uncheck(); await s.waitForTimeout(200);
assert.ok(!(await widoczna(okno)), "po wyłączeniu stoi");
await okno.locator(".zamknij").click();
await dagna.hover(); await s.waitForTimeout(400); assert.ok(!(await widoczna(dagna)), "wyłączone — miniatura też stoi");
const bledy1 = s.bledy; await s.close();
// nowa strona w tym samym kontekście (ta sama localStorage) — dalej wyłączone
s = await start(); await s.locator(".bohater", { hasText: "Dagna" }).hover(); await s.waitForTimeout(400);
assert.ok(!(await widoczna(s.locator(".bohater", { hasText: "Dagna" }))), "przełącznik zapamiętany");
await s.locator(".bohater", { hasText: "Dagna" }).click(); await s.waitForTimeout(400);
await s.locator("dialog[open] .anim-portretow input").check(); await s.waitForTimeout(500);
assert.ok(await widoczna(s.locator("dialog[open]").first()), "włączenie z powrotem");
// zamknięcie okna zatrzymuje
await s.locator("dialog[open] .zamknij").click(); await s.waitForTimeout(200);
assert.equal(await s.evaluate(() => [...document.querySelectorAll(".portret-anim")].filter(c => !c.hidden).length), 0, "po zamknięciu nic nie chodzi");
const bledy2 = s.bledy; await s.close();
// systemowe ograniczenie ruchu
s = await start("reduce"); await s.locator(".bohater", { hasText: "Dagna" }).hover(); await s.waitForTimeout(400);
assert.equal(await s.locator(".portret-anim").count(), 0, "ograniczenie ruchu — bez animacji");
const bledy = [...bledy1, ...bledy2, ...s.bledy];
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony");
console.log("OK");
await b.close();
