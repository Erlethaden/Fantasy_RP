// podgląd konfiguracji animacji portretów (7.3): dla każdego portretu klatka zwykła, z zamkniętymi oczami i z błyskiem (prawdziwy moduł)
// node podglad_oczu.mjs <plik.png> <nazwa,nazwa,…|wszystkie> [kolumny]  (serwer: npm run dev -- --port 5174)
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage();
const bledy = []; s.on("pageerror", e => bledy.push(e.message));
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(800);
const png = await s.evaluate(async ([lista, kolumny]) => {
  const { klatkaPortretu } = await import("/src/portrety_anim.js");
  const { PORTRETY_ANIM } = await import("/src/dane/portrety_anim.js");
  const nazwy = lista === "wszystkie" ? Object.keys(PORTRETY_ANIM) : lista.split(",");
  const W = 192, kom = W * 3 + 16, wiersz = W + 22, K = +kolumny || 2;
  const out = document.createElement("canvas"); out.width = K * kom; out.height = Math.ceil(nazwy.length / K) * wiersz;
  const g = out.getContext("2d"); g.imageSmoothingEnabled = false; g.fillStyle = "#111"; g.fillRect(0, 0, out.width, out.height);
  g.font = "14px sans-serif";
  for (const [i, n] of nazwy.entries()) {
    const img = new Image(); img.src = `/assets/portrety/${n}.png`; await img.decode();
    const cfg = PORTRETY_ANIM[n] || {}, x = (i % K) * kom, y = Math.floor(i / K) * wiersz;
    g.fillStyle = cfg.oczy ? "#9f9" : "#f99"; g.fillText(`${n}${cfg.swieca ? " (świecą)" : ""}${cfg.oczy ? "" : " — brak oczu"}`, x + 4, y + 15);
    [{}, { zak: 1 }, { blysk: 0.45, kolor: "#d9b25a" }].forEach((o, k) => g.drawImage(klatkaPortretu(img, cfg, o), x + k * W, y + 20, W, W));
  }
  return out.toDataURL();
}, [process.argv[3] || "wszystkie", process.argv[4]]);
writeFileSync(process.argv[2], Buffer.from(png.split(",")[1], "base64"));
console.log(bledy.length ? "BŁĘDY: " + bledy.join(" | ") : "zapisano " + process.argv[2]);
await b.close();
