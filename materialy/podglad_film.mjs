// podgląd filmu opowieści (13.5b) dla BOGATEJ tury: wymyślone zdarzenia z prawdziwymi krainami i miejscami na mapie, nagrane tym samym kodem
// co przycisk „🎬 Nagraj film”. Serwer: npm run dev -- --port 5174 ; node podglad_film.mjs <folder na film>
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe", args: ["--autoplay-policy=no-user-gesture-required"] });
const s = await (await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true })).newPage();
s.on("pageerror", e => console.log("BŁĄD:", e.message));
await s.addInitScript(() => localStorage.setItem("frp-samouczek", JSON.stringify({ propozycja: true })));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(1500);
await s.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
await s.click("button.wejdz"); await s.waitForSelector("#aplikacja:not([hidden])"); await s.waitForTimeout(2000);
const [pobranie] = await Promise.all([s.waitForEvent("download", { timeout: 400000 }), s.evaluate(async () => {
  const { opowiedz } = await import("/src/kronikarz.js"), { nagrajOpowiesc, planFilmu } = await import("/src/film_opowiesci.js");
  const { przygotujTimelapse } = await import("/src/timelapse.js"), { FRAKCJE } = await import("/src/dane/frakcje.js");
  const PROWINCJE = (await import("/assets/mapa/prowincje.json")).default, AKWENY = (await import("/assets/mapa/akweny.json")).default;
  const terenUrl = (await import("/assets/mapa/teren.png?url")).default, indeksyUrl = (await import("/assets/mapa/prowincje.png?url")).default;
  const ikona = (await import("/assets/mapa/prowincje.png?url")).default;
  const kraje = Object.fromEntries(FRAKCJE.map(f => [f.id, { nazwa: f.nazwa, wladca: f.wladca, id: f.id, kolor: f.kolor }]));
  // ziemie krain: pasy prowincji po kolei (żeby mapa miała kolory), miejsca zdarzeń z tych ziem
  const id = FRAKCJE.map(f => f.id), lad = PROWINCJE.filter((p, i) => i % 3 === 0), wl = {};
  lad.slice(0, 7 * 18).forEach((p, i) => { wl[p.id] = id[Math.floor(i / 18)]; });
  const ziemia = (f, k = 0) => lad.filter(p => wl[p.id] === f)[k];
  const P = (f, k) => ({ p: ziemia(f, k).id, miejsce: `w prowincji ${ziemia(f, k).id}` });
  const morze = AKWENY.findIndex(a => a.typ === "morze") + 1;
  const pamiec = [
    { tura: 3, typ: "wojna", d: { A: "aurelia", B: "czarny-smok" } }, { tura: 4, typ: "wynik", d: { A: "czarny-smok", przegrani: ["aurelia"] } },
    { tura: 5, typ: "wynik", d: { A: "gor-khar", przegrani: ["krag-mhor"] } }, { tura: 6, typ: "wynik", d: { A: "gor-khar", przegrani: ["goblandia"] } },
    { tura: 4, typ: "wojna", d: { A: "rogus-ardens", B: "grobowe-imperium" } }, { tura: 5, typ: "traktat", d: { rodzaj: "sojusz", lista: ["krag-mhor", "goblandia"] } },
  ];
  const zdarzenia = [
    { typ: "wojna", d: { A: "gor-khar", B: "aurelia" } },
    { typ: "wojna", d: { A: "goblandia", B: "rogus-ardens", blok: "Liga Złotej Miski" } },
    { typ: "bitwa", d: { ...P("aurelia", 2), lista: ["gor-khar", "aurelia"] } },
    { typ: "wynik", d: { ...P("aurelia", 2), A: "gor-khar", przegrani: ["aurelia"], zdobycz: true, prowincja: ziemia("aurelia", 2).id } },
    { typ: "wynik", d: { skutki: true, ...P("aurelia", 2), polegli: ["Theryn"], niewola: ["Naelira"], ranni: ["Karevra"] } },
    { typ: "wynik", d: { ...P("czarny-smok", 1), A: "aurelia", przegrani: ["czarny-smok"] } },
    { typ: "bitwa", d: { morska: true, a: morze, miejsce: "na morzu „Zatoka Kości”", lista: ["goblandia", "rogus-ardens", "grobowe-imperium"] } },
    { typ: "wynik", d: { morska: true, a: morze, miejsce: "na morzu „Zatoka Kości”", A: "grobowe-imperium", przegrani: ["rogus-ardens"] } },
    { typ: "wlasciciel", d: { prowincja: ziemia("krag-mhor", 4).id, p: ziemia("krag-mhor", 4).id, A: "krag-mhor", B: "goblandia" } },
    { typ: "pokoj", d: { A: "rogus-ardens", B: "grobowe-imperium" } },
    { typ: "zerwanie", d: { rodzaj: "sojusz", nazwa: "Żelazna Przyjaźń", lista: ["krag-mhor", "goblandia"] } },
    { typ: "traktat", d: { rodzaj: "handel", nazwa: "Szlak Bursztynowej Kości", lista: ["aurelia", "czarny-smok"] } },
    { typ: "traktat", d: { rodzaj: "wasalstwo", nazwa: "Hołd Szarych Kłów", lista: ["gor-khar", "goblandia"] } },
    { typ: "gm", d: { tekst: "Nad Wielkim Jeziorem widziano kometę o zielonym ogonie. Kapłani wszystkich krain wróżą koniec świata albo dobre plony" } },
  ].map(z => ({ ...z, kraje: [] }));
  const staty = { przed: { "gor-khar": { prowincje: 18 }, aurelia: { prowincje: 18 }, goblandia: { prowincje: 17 }, "krag-mhor": { prowincje: 19 } },
    teraz: { "gor-khar": { prowincje: 21 }, aurelia: { prowincje: 15 }, goblandia: { prowincje: 18 }, "krag-mhor": { prowincje: 18 } } };
  const o = opowiedz({ tura: 7, ziarno: 21, kraje, zdarzenia, pamiec, staty });
  const gdzie = z => { const d = z?.d; if (!d) return null; if (d.a) { const w = AKWENY[d.a - 1]; return [w.x, w.y]; }
    const p = PROWINCJE.find(q => q.id === (d.p || d.prowincja)) || ziemia(d.A || d.lista?.[0]); return p ? [p.x, p.y] : null; };
  const tl = await przygotujTimelapse({ terenUrl, indeksyUrl, liczbaProwincji: PROWINCJE.length, historia: [{ nr: 7, wlasciciele: wl }], ikonaBitwy: ikona, miary: [],
    kraje: [], kolorWl: w => kraje[w]?.kolor || null, punkt: () => null, prowincjaNr: x => PROWINCJE.findIndex(q => q.id === x) + 1 });
  console.log("akapitów:", o.akapity.length, "plan:", JSON.stringify(planFilmu(o.akapity)));
  window.__tekst = o.akapity.join("\n\n");
  const { blob, rozszerzenie } = await nagrajOpowiesc({ tura: 7, akapity: o.akapity, miejsca: o.zrodla.map(gdzie), mapa: tl.mapa({ nr: 7, wlasciciele: wl }) });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `kronika-zgrzyta-tura-7-bogata.${rozszerzenie}` }); a.click();
})]);
s.on("console", m => console.log(m.text()));
const cel = `${process.argv[2]}/${pobranie.suggestedFilename()}`; await pobranie.saveAs(cel);
console.log("TEKST:\n" + await s.evaluate(() => window.__tekst));
console.log("ZAPISANO", cel); await b.close();
