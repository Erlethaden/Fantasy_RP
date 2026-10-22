// 13.5b (DEMO): wojna + bitwa na niby → zamknięcie tury → publikacja → „🎬 Nagraj film” w oknie opowieści → plik ≤ 10 MB z obrazem i dźwiękiem.
// Serwer: npm run dev -- --port 5174 ; node test_film_opowiesci.mjs <folder na film>
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe", args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const s = await ctx.newPage();
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
// prowincja dla Rogus Ardens (kamera ma dokąd jechać przy wojnie) + wojna + traktat
const m = await s.locator("#mapa").boundingBox(); let ok = false;
for (let fy = 0.3; fy < 0.8 && !ok; fy += 0.07) for (let fx = 0.3; fx < 0.8 && !ok; fx += 0.07) { await s.mouse.click(m.x + m.width * fx, m.y + m.height * fy); ok = await s.locator(".edycja-prowincji").count() > 0; }
await s.selectOption(".edycja-prowincji select[name=wlasciciel]", "rogus-ardens"); await s.waitForTimeout(200);
await s.click("#panel-gm"); await s.waitForTimeout(300);
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia"); await s.click(".nowa-wojna button.dodaj");
await s.click("#zamknij-ture"); await s.waitForTimeout(800);
await s.locator(".kronikarz").scrollIntoViewIfNeeded(); await s.click(".kronikarz [data-kr=publikuj]"); await s.waitForTimeout(500);
const st = await s.evaluate(() => JSON.parse(localStorage.getItem("frp-demo")).opowiesciDane[1]);
console.log("miejsca:", JSON.stringify(st.miejsca));
assert.equal(st.miejsca?.length, st.akapity.length, "miejsca nie pasują do akapitów");
assert.ok(st.miejsca.some(Boolean), "żaden akapit nie ma miejsca na mapie");
assert.ok(st.miejsca.every(x => x === null || (typeof x.x === "number" && !Array.isArray(x))), "miejsca muszą być {x, y} (Firestore: bez tablic w tablicy)");
// nagranie
await s.click("#kronika"); await s.waitForSelector("[data-opowiesc='1']"); await s.click("[data-opowiesc='1']"); await s.waitForSelector("#opowiesc[open] .nagraj-opowiesc");
const t0 = Date.now();
const [plik] = await Promise.all([s.waitForEvent("download", { timeout: 240000 }), s.click("#opowiesc .nagraj-opowiesc")]);
const cel = `${process.argv[2]}/${plik.suggestedFilename()}`; await plik.saveAs(cel);
const stan = await s.locator("#opowiesc .stan-nagrania").textContent();
console.log("nagranie:", plik.suggestedFilename(), `${Math.round((Date.now() - t0) / 1000)} s`, "|", stan);
const { statSync } = await import("node:fs"); const rozmiar = statSync(cel).size;
assert.ok(rozmiar > 50e3 && rozmiar < 10 * 1048576, "rozmiar filmu: " + rozmiar);
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
