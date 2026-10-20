// klatki animacji portretu (7.3) do GIF-a: 4,5 s po 10 kl./s — oddech, mrugnięcie (1,5 s), błysk (2,6 s), prawdziwy moduł
// node podglad_animacji.mjs <folder na klatki> <nazwa portretu> [kolor frakcji]  → klatka_000.png …  (GIF: python, PIL)
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const exe = process.env.LOCALAPPDATA + "/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const b = await chromium.launch({ executablePath: exe });
const s = await b.newPage();
await s.route(/firebase-config\.js/, r => r.fulfill({ contentType: "text/javascript", body: "export const firebaseConfig = {};" }));
await s.goto("http://localhost:5174/"); await s.waitForTimeout(800);
const klatki = await s.evaluate(async ([nazwa, kolor]) => {
  const { klatkaPortretu } = await import("/src/portrety_anim.js");
  const { PORTRETY_ANIM } = await import("/src/dane/portrety_anim.js");
  const img = new Image(); img.src = `/assets/portrety/${nazwa}.png`; await img.decode();
  const zamk = q => q < 0.3 ? Math.sin(q / 0.3 * Math.PI / 2) : q < 0.42 ? 1 : (1 - (q - 0.42) / 0.58) ** 2;
  const out = [];
  for (let n = 0; n < 45; n++) {
    const t = n / 10, q = (t - 1.5) / 0.26, bl = (t - 2.6) / 0.9;
    const c = klatkaPortretu(img, PORTRETY_ANIM[nazwa] || {}, { t, zak: q >= 0 && q < 1 ? zamk(q) : 0, blysk: bl >= 0 && bl <= 1 ? bl : -1, kolor });
    const m = document.createElement("canvas"); m.width = m.height = 288; const g = m.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, 288, 288);
    out.push(m.toDataURL());
  }
  return out;
}, [process.argv[3], process.argv[4] || "#d9b25a"]);
mkdirSync(process.argv[2], { recursive: true });
klatki.forEach((k, i) => writeFileSync(`${process.argv[2]}/klatka_${String(i).padStart(3, "0")}.png`, Buffer.from(k.split(",")[1], "base64")));
console.log("klatek:", klatki.length); await b.close();
