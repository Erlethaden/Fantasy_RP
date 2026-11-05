// 16.2: Zgrzyt-pomocnik komentuje zdarzenia gry (DEMO, GM): po wczytaniu cisza, wojna → dymek o wojnie, zamknięcie tury → dymek o nowej turze;
// samouczek (rozdział z pokazami: wojna, bitwa, tura na niby) nie wywołuje dymków. serwer: npx vite --port 5174 --strictPort
import { chromium } from "playwright-core";
import assert from "node:assert";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe" });
const s = await b.newPage({ viewport: { width: 1600, height: 900 } });
const bledy = []; s.on("pageerror", e => bledy.push(e.message)); s.on("dialog", d => d.accept());
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true, nowosci: false })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(4500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
const dymek = async () => (await s.locator(".pomocnik:not([hidden]) .pomocnik-tekst").count()) ? s.locator(".pomocnik-tekst").textContent() : null;
assert.equal(await dymek(), null, "dymek po samym wczytaniu");
const czekaj = async (re, opis) => {
  await s.waitForFunction(re => { const d = document.querySelector(".pomocnik:not([hidden]) .pomocnik-tekst"); return d && new RegExp(re, "i").test(d.textContent); }, re.source, { timeout: 8000 })
    .catch(async () => assert.fail(`${opis}: brak dymka (jest: ${await dymek()})`));
  await s.waitForTimeout(2500); const t = await dymek(); console.log(`${opis}:`, t); assert.ok(!/\{|undefined/.test(t), "dziura: " + t);
  await s.click(".pomocnik-zamknij");
};
await s.click("#panel-gm");
await s.selectOption(".nowa-wojna select[name=k1]", "rogus-ardens"); await s.selectOption(".nowa-wojna select[name=k2]", "goblandia"); await s.click(".nowa-wojna button.dodaj");
await czekaj(/wojn|kontra/, "wojna");
await s.click("#zamknij-ture"); await czekaj(/tur[aę] 2|tura: 2/, "tura");
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.screenshot({ path: process.argv[2] + "/pomocnik_zdarzenie.png" });
// samouczek: rozdziały z pokazami (wojna, bitwa, zamknięcie tury na niby) — żadnego dymka w trakcie ani po powrocie stanu
for (const id of ["bitwy", "historia"]) {
  await s.click("#samouczek-przycisk"); await s.waitForSelector(".samouczek:not([hidden])");
  await s.waitForTimeout(3000); await s.click(`[data-rozdzial=${id}]`); await s.waitForTimeout(500); let krokow = 0, menu = false;   // klik w trakcie pisania tylko dokańcza tekst
  for (let i = 0; i < 80 && !menu; i++) {
    await s.waitForTimeout(500);
    assert.equal(await dymek(), null, "dymek w samouczku");
    menu = await s.locator(".samouczek-rozdzialy").count() > 0;
    if (!menu) { await s.mouse.click(800, 300); krokow++; }
  }
  console.log(`rozdział ${id}: ${krokow} kliknięć`); assert.ok(menu && krokow >= 5, "rozdział nie przeszedł");
  await s.click("[data-s=koniec]");
  await s.waitForTimeout(500);
}
await s.waitForTimeout(4500);
assert.equal(await dymek(), null, "dymek po wyjściu z samouczka: " + await dymek());
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "bez błędów strony"); assert.equal(bledy.length, 0);
console.log("OK"); await b.close();
