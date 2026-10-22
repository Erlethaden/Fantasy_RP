// film opowieści Zgrzyta (13.5b): nagranie w czasie rzeczywistym (MediaRecorder) płótna 1280×720 + dźwięku (głos Zgrzyta z dzwieki.js).
// Mapa w kolorach krain (z timelapsu) jedzie do miejsca zdarzenia każdego akapitu, na dole okno dialogu z portretem i tekstem pisanym na żywo.
// Tempo pisania i jakość obrazu dobierane tak, żeby plik zmieścił się w limicie Discorda bez Nitro (10 MB). Tylko część jawna — bez szeptów.
import portretUrl from "../assets/portrety/zgrzyt.png?url";
import { strumienDzwieku } from "./dzwieki.js";

const SZ = 1280, WY = 720, MAPA = 900;   // mapa z timelapsu: płótno 900×900 (= mapa świata 5000 px)
const ZLOTO = "#d9b25a", TEKST = "#efe3c8", TLO = "#0b0c12";
const LIMIT = 9.3e6 * 8, AUDIO = 96e3;   // bity: zapas pod 10 MB; dźwięk 96 kb/s
const WSTEP = 1.8, PAUZA = 1.1, KONIEC = 2.5;   // sekundy: plansza tytułowa, przerwa po akapicie, stopklatka na końcu
const obraz = url => new Promise((ok, zle) => { const i = new Image(); i.onload = () => ok(i); i.onerror = zle; i.src = url; });

export function formatFilmuZDzwiekiem() {
  for (const t of ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"])
    if (window.MediaRecorder?.isTypeSupported?.(t)) return t;
  return null;
}
// plan: czas trwania i szybkość pisania (znaki/s) tak, żeby przy rozsądnej jakości (≥ 300 kb/s) plik zmieścił się w limicie
export function planFilmu(akapity) {
  const znaki = akapity.reduce((n, a) => n + a.length, 0), stale = WSTEP + PAUZA * akapity.length + KONIEC;
  const maxCzas = LIMIT / (300e3 + AUDIO);
  let tempo = 20, czas = stale + znaki / tempo;
  if (czas > maxCzas) { tempo = znaki / Math.max(10, maxCzas - stale); czas = stale + znaki / tempo; }
  return { tempo, czas, obrazBps: Math.round(Math.min(1.5e6, LIMIT / czas - AUDIO)) };   // 1,5 Mb/s: mapa i tekst prawie stoją — więcej nie widać
}
// zawijanie tekstu do szerokości — zwraca linie
function linie(g, tekst, szer) {
  const l = [];
  for (const s of tekst.split(/\s+/)) { const o = l.at(-1); if (o !== undefined && g.measureText(`${o} ${s}`).width <= szer) l[l.length - 1] = `${o} ${s}`; else l.push(s); }
  return l;
}

// o: { tura, akapity: [tekst], miejsca: [[x, y] w px mapy 5000 | null], mapa: płótno 900×900 }; postep(0..1)
export async function nagrajOpowiesc(o, postep = () => {}) {
  const typ = formatFilmuZDzwiekiem(); if (!typ) throw new Error("Ten program nie umie nagrywać filmu.");
  await Promise.all(["700 30px Cinzel", "400 26px Spectral", "italic 400 26px Spectral"].map(f => document.fonts.load(f).catch(() => {})));
  const portret = await obraz(portretUrl);
  const { tempo, czas, obrazBps } = planFilmu(o.akapity);
  const c = Object.assign(document.createElement("canvas"), { width: SZ, height: WY }), g = c.getContext("2d");
  // harmonogram akapitów: [start, koniec pisania]
  let t = WSTEP; const plan = o.akapity.map(a => { const s = t; t += a.length / tempo; const k = t; t += PAUZA; return [s, k]; });
  const kamera = { x: MAPA / 2, y: MAPA / 2, z: 1 }, okno = { x: 40, y: WY - 250, w: SZ - 80, h: 220 };
  const pokrycie = Math.max(SZ, WY) / MAPA;   // cała mapa przykrywa kadr (zoom 1)

  function klatka(s, dt) {
    const i = plan.findIndex(([a], j) => s >= a && (j === plan.length - 1 || s < plan[j + 1][0]));
    const m = i >= 0 ? o.miejsca[i] : null, cel = m ? { x: m[0] * MAPA / 5000, y: m[1] * MAPA / 5000, z: 2.4 } : { x: MAPA / 2, y: MAPA / 2, z: 1 };
    const k = 1 - Math.exp(-dt * 1.6);   // płynny dojazd kamery
    for (const p of ["x", "y", "z"]) kamera[p] += (cel[p] - kamera[p]) * k;
    // mapa: punkt kamery na środku kadru (nieco wyżej — nad oknem dialogu)
    const sk = pokrycie * kamera.z, rozm = MAPA * sk;
    const sx = Math.min(0, Math.max(SZ - rozm, SZ / 2 - kamera.x * sk)), sy = Math.min(0, Math.max(WY - rozm, (WY - 120) / 2 - kamera.y * sk));   // kamera nie wyjeżdża poza mapę (czarny pas)
    g.fillStyle = TLO; g.fillRect(0, 0, SZ, WY);
    g.imageSmoothingEnabled = true; g.drawImage(o.mapa, sx, sy, MAPA * sk, MAPA * sk);
    if (m) {   // pulsujący znacznik miejsca zdarzenia
      const px = sx + m[0] * MAPA / 5000 * sk, py = sy + m[1] * MAPA / 5000 * sk, r = 18 + 8 * Math.sin(s * 5);
      g.strokeStyle = ZLOTO; g.lineWidth = 4; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.stroke();
    }
    const cien = g.createLinearGradient(0, 0, 0, WY); cien.addColorStop(0, "rgba(0,0,0,.55)"); cien.addColorStop(0.25, "rgba(0,0,0,0)"); cien.addColorStop(0.6, "rgba(0,0,0,0)"); cien.addColorStop(1, "rgba(0,0,0,.75)");
    g.fillStyle = cien; g.fillRect(0, 0, SZ, WY);
    g.fillStyle = ZLOTO; g.font = "700 34px Cinzel, Georgia, serif"; g.textBaseline = "alphabetic"; g.fillText(`Kronika Zgrzyta — tura ${o.tura}`, 40, 56);
    // okno dialogu
    g.fillStyle = "rgba(11,13,21,.92)"; g.fillRect(okno.x, okno.y, okno.w, okno.h);
    g.strokeStyle = "#8a6a2a"; g.lineWidth = 3; g.strokeRect(okno.x + 1.5, okno.y + 1.5, okno.w - 3, okno.h - 3);
    g.imageSmoothingEnabled = false; g.drawImage(portret, okno.x + 20, okno.y + 22, 176, 176); g.imageSmoothingEnabled = true;
    g.strokeStyle = ZLOTO; g.lineWidth = 2; g.strokeRect(okno.x + 19, okno.y + 21, 178, 178);
    const tx = okno.x + 220, tw = okno.w - 250;
    g.fillStyle = ZLOTO; g.font = "700 26px Cinzel, Georgia, serif"; g.fillText("Zgrzyt", tx, okno.y + 42);
    if (i >= 0) {
      const [a] = plan[i], widac = Math.min(o.akapity[i].length, Math.floor((s - a) * tempo));
      g.fillStyle = TEKST; g.font = `${i === 0 ? "italic " : ""}400 25px Spectral, Georgia, serif`;
      const l = linie(g, o.akapity[i].slice(0, widac), tw), ost = l.slice(-5);   // najwyżej 5 linii — dłuższy akapit przewija się w górę
      ost.forEach((x, j) => g.fillText(x, tx, okno.y + 82 + j * 32));
      return [i, widac];
    }
    g.fillStyle = TEKST; g.font = "italic 400 25px Spectral, Georgia, serif"; g.fillText("Zgrzyt chrząka, poprawia chustę i zaczyna…", tx, okno.y + 82);
    return [-1, 0];
  }

  const dzwiek = await strumienDzwieku();
  // bipy: każda litera (min. 55 ms odstępu) i rechot po akapicie z „tak tak” — czasy w sekundach filmu
  const bipy = [];
  o.akapity.forEach((tekst, i) => {
    const [a, k] = plan[i]; let ost = -1;
    for (let n = 0; n < tekst.length; n++) { const t = a + (n + 1) / tempo; if (/[\p{L}\d]/u.test(tekst[n]) && t - ost >= 0.055) { bipy.push([t, "bip"]); ost = t; } }
    if (/tak tak/i.test(tekst)) bipy.push([k + 0.15, "rechot"]);
  });
  const strumien = new MediaStream([...c.captureStream(30).getVideoTracks(), ...(dzwiek?.stream.getAudioTracks() || [])]);
  const czesci = [], rek = new MediaRecorder(strumien, { mimeType: typ, videoBitsPerSecond: obrazBps, audioBitsPerSecond: AUDIO });
  rek.ondataavailable = e => e.data.size && czesci.push(e.data);
  const koniec = new Promise(ok => { rek.onstop = ok; });
  klatka(0, 0); rek.start(250);
  // jeden zegar: audio (gdy jest) — obraz i dźwięk liczą ten sam czas filmu; bipy planowane z wyprzedzeniem 0,3 s
  const zegar = dzwiek ? dzwiek.czas : () => performance.now() / 1000, t0 = zegar() + 0.15;
  try {
    await new Promise(ok => {
      let ost = zegar(), k = 0;
      const krok = () => {
        const teraz = zegar(), s = teraz - t0; klatka(Math.max(0, s), teraz - ost); ost = teraz;
        for (; k < bipy.length && bipy[k][0] <= s + 0.3; k++) dzwiek?.[bipy[k][1]](bipy[k][0] - s);
        postep(Math.min(1, s / czas));
        s < czas ? requestAnimationFrame(krok) : ok();
      };
      requestAnimationFrame(krok);
    });
  } finally { rek.stop(); dzwiek?.koniec(); }
  await koniec;
  return { blob: new Blob(czesci, { type: typ.split(";")[0] }), rozszerzenie: typ.startsWith("video/mp4") ? "mp4" : "webm" };
}
