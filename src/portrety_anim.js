// animacje portretów (7.3): oddech, mrugnięcie, błysk — w kodzie (jak Sala Tronów), bez nowych grafik.
// Portret 128 px rysowany na canvasie ×S bez wygładzania (ruch co 1/S piksela oryginału, ostry pixel art).
// Konfiguracja w dane/portrety_anim.js (px portretu 128): { oczy: [[x, y, w, h]], powieka?: kolor (domyślnie skóra spod oka),
// swieca?: kolor świecących oczu (pulsują, nie mrugają), oddech?: [x, y, w, h] (domyślnie dolne 60%),
// ogien?: [[x, y, w, h]] migoczące płomienie/kryształy, ruch?: [{ typ: obrot|kolys, obszary, os?, kat?, amp?, okres?, faza?, tlo? }], drobinki?: { rodzaj: iskry|magia|popiol, kolor?, ile?, obszar?: [x, y, w, h] } }.
// Duży portret żyje stale, miniatura po najechaniu; wyłączone przy systemowym „ograniczeniu ruchu” albo przełącznikiem (localStorage).
import { PORTRETY_ANIM } from "./dane/portrety_anim.js";

const S = 4, MRUG = 0.26, KLATKA = 1 / 30;
const los = (a, b) => a + Math.random() * (b - a);
const zamkniecie = q => q < 0.3 ? Math.sin(q / 0.3 * Math.PI / 2) : q < 0.42 ? 1 : (1 - (q - 0.42) / 0.58) ** 2;   // jak w Sali Tronów
const ograniczonyRuch = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let wlaczone = true; try { wlaczone = localStorage.getItem("frp-anim-portretow") !== "0"; } catch {}
export const animacjePortretow = () => wlaczone && !ograniczonyRuch();
export function ustawAnimacjePortretow(v) { wlaczone = v; try { localStorage.setItem("frp-anim-portretow", v ? "1" : "0"); } catch {} if (!v) for (const a of [...aktywne]) zatrzymaj(a); }

// zak: 0 otwarte … 1 zamknięte; górna powieka zjeżdża łukiem, dolna lekko się unosi (jak Sala Tronów), linia rzęs na brzegu
function powieka(g, zak, kolor, cx, cy, rx, ry) {
  const spotkanie = cy + ry * 0.3, gorna = cy - ry + (spotkanie - cy + ry) * zak, dolna = cy + ry - (cy + ry - spotkanie) * zak, luk = ry * 0.35 * zak;
  g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip(); g.fillStyle = kolor;
  g.beginPath(); g.moveTo(cx - rx - 1, cy - ry - 1); g.lineTo(cx + rx + 1, cy - ry - 1); g.lineTo(cx + rx + 1, gorna);
  g.quadraticCurveTo(cx, gorna + luk, cx - rx - 1, gorna); g.closePath(); g.fill();
  g.fillRect(cx - rx - 1, dolna, rx * 2 + 2, cy + ry - dolna + 1);
  g.beginPath(); g.moveTo(cx - rx - 1, gorna); g.quadraticCurveTo(cx, gorna + luk, cx + rx + 1, gorna);
  g.strokeStyle = "rgba(10,8,12,.85)"; g.lineWidth = S; g.stroke(); g.restore();
}
const hex = ([r, g, b]) => "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
// przygotowanie portretu: obraz ×S, warstwa oddechu z miękką górą, kolory powiek
function przygotuj(img, cfg) {
  const male = document.createElement("canvas"); male.width = male.height = 128;
  const m = male.getContext("2d", { willReadFrequently: true }); m.drawImage(img, 0, 0, 128, 128);
  const px = (x, y) => [...m.getImageData(Math.min(127, Math.max(0, x)), Math.min(127, Math.max(0, y)), 1, 1).data].slice(0, 3);
  const [ox, oy, ow, oh] = cfg.oddech || [0, 52, 128, 76];
  const warstwa = document.createElement("canvas"); warstwa.width = ow * S; warstwa.height = oh * S;
  const w = warstwa.getContext("2d"); w.imageSmoothingEnabled = false; w.drawImage(img, ox, oy, ow, oh, 0, 0, ow * S, oh * S);
  w.globalCompositeOperation = "destination-in";   // górne 12 px warstwy miękko przechodzi w obraz pod spodem (bez szwu)
  const gr = w.createLinearGradient(0, 0, 0, 12 * S); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "#fff");
  w.fillStyle = gr; w.fillRect(0, 0, ow * S, oh * S);
  const oczy = (cfg.oczy || []).map(([x, y, ew, eh]) => ({ x, y, w: ew, h: eh, kolor: cfg.powieka || hex(px(Math.round(x + ew / 2), y + eh + 1).map(v => Math.round(v * 0.9))) }));   // skóra spod oka, lekko ocieniona
  const ogien = (cfg.ogien || []).map(([x, y, ew, eh]) => {   // poświata = średnia najjaśniejszej ćwiartki pikseli obszaru
    const d = m.getImageData(x, y, ew, eh).data, px4 = [];
    for (let i = 0; i < d.length; i += 4) px4.push([d[i], d[i + 1], d[i + 2]]);
    px4.sort((a, b) => b[0] + b[1] + b[2] - a[0] - a[1] - a[2]);
    const jasne = px4.slice(0, Math.max(1, px4.length >> 2));
    return { x, y, w: ew, h: eh, kolor: hex([0, 1, 2].map(k => Math.round(jasne.reduce((s, p) => s + p[k], 0) / jasne.length))) };
  });
  // ruch: część obrazu (suma prostokątów) jako osobna warstwa; z tlo — w obrazie pod nią piksele części zamalowane kolorem tła (bez podwójnych krawędzi)
  const ruch = (cfg.ruch || []).map(r => {
    const warstwa = document.createElement("canvas"); warstwa.width = warstwa.height = 128 * S;
    const w = warstwa.getContext("2d"); w.imageSmoothingEnabled = false;
    for (const [x, y, ew, eh] of r.obszary) w.drawImage(img, x, y, ew, eh, x * S, y * S, ew * S, eh * S);
    let latka = null;
    if (r.tlo === "auto") {   // tło niejednolite: każdy wiersz prostokąta zamalowany przejściem między pikselami tuż za jego lewą i prawą krawędzią
      latka = document.createElement("canvas"); latka.width = latka.height = 128;
      const l = latka.getContext("2d");
      for (const [x, y, ew, eh] of r.obszary) for (let yy = y; yy < y + eh; yy++) {
        const a = px(x - 1, yy), b = px(x + ew, yy);
        for (let xx = 0; xx < ew; xx++) {   // tylko piksele części (wyraźnie inne niż tło) — tło w prostokącie zostaje, bez smug
          const q = (xx + 0.5) / ew, c = a.map((v, k) => Math.round(v + (b[k] - v) * q)), o = px(x + xx, yy);
          if (Math.abs(o[0] - c[0]) + Math.abs(o[1] - c[1]) + Math.abs(o[2] - c[2]) > 60) { l.fillStyle = hex(c); l.fillRect(x + xx, yy, 1, 1); }
        }
      }
    } else if (r.tlo) {
      latka = document.createElement("canvas"); latka.width = latka.height = 128;
      const l = latka.getContext("2d"), t = [1, 3, 5].map(i => parseInt(r.tlo.slice(i, i + 2), 16));
      l.fillStyle = r.tlo;
      for (const [x, y, ew, eh] of r.obszary) {
        const d = m.getImageData(x, y, ew, eh).data;
        for (let i = 0; i < ew * eh; i++) if (Math.abs(d[i * 4] - t[0]) + Math.abs(d[i * 4 + 1] - t[1]) + Math.abs(d[i * 4 + 2] - t[2]) > 30) l.fillRect(x + i % ew, y + Math.floor(i / ew), 1, 1);
      }
    }
    const y0 = Math.min(...r.obszary.map(o => o[1])), y1 = Math.max(...r.obszary.map(o => o[1] + o[3]));
    return { ...r, warstwa, latka, y0, y1 };
  });
  return { oddech: [ox, oy, ow, oh], warstwa, oczy, ogien, ruch };
}
// przesunięcie od oddechu w wierszu y (px portretu): góra warstwy oddechu idzie o -unies, dół stoi
const zaOddechem = (y, [, oy, , oh], unies) => unies && y > oy ? -unies * Math.max(0, 1 - (y - oy) / oh) : 0;
// ruch idle: obrot — część obraca się o ±kat° wokół os; kolys — wiersze przesuwają się w poziomie o ±amp px, rosnąco od góry (góra przypięta)
function ruchy(g, p, t, unies) {
  for (const r of p.ruch) {
    const sin = Math.sin(t * Math.PI * 2 / (r.okres || 4) + (r.faza || 0));
    if (r.latka) g.drawImage(r.latka, 0, 0, 128 * S, 128 * S);
    if (r.typ === "obrot") {
      const [px, py] = r.os, dy = zaOddechem(py, p.oddech, unies);
      g.save(); g.translate(px * S, py * S + dy); g.rotate((r.kat || 1.5) * sin * Math.PI / 180); g.translate(-px * S, -py * S);
      g.drawImage(r.warstwa, 0, 0); g.restore();
    } else for (let y = r.y0; y < r.y1; y++) {
      const dx = Math.round((r.amp || 0.75) * ((y - r.y0) / (r.y1 - r.y0)) ** 1.3 * sin * S);
      g.drawImage(r.warstwa, 0, y * S, 128 * S, S, dx, y * S + zaOddechem(y, p.oddech, unies), 128 * S, S);
    }
  }
}
// migotanie ognia: nieregularny szum z trzech sinusów, 0…1
const migot = (t, f) => Math.max(0, Math.min(1, 0.5 + 0.28 * Math.sin(t * 9.1 + f) + 0.16 * Math.sin(t * 15.7 + f * 2.3) + 0.1 * Math.sin(t * 27.3 + f * 4.1)));
// drobinki: kierunek (-1 w górę, 1 w dół), czas życia [s], zasięg drogi (część wysokości obszaru), falowanie [px], jasność
const DROBINKI = {
  iskry: { kier: -1, zycie: 2.2, droga: 0.8, fala: 1.5, alfa: 0.95, kolor: "#ffb347", migot: 1 },
  magia: { kier: -1, zycie: 4.5, droga: 0.5, fala: 3, alfa: 0.75, kolor: "#c9a6ff" },
  popiol: { kier: 1, zycie: 6, droga: 0.7, fala: 4, alfa: 0.55, kolor: "#cfcac4" },
};
const szum = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
// położenie drobinek liczone wprost z t (bez stanu), więc podgląd klatek (klatkaPortretu) widzi to samo co animacja
function drobinki(g, d, t) {
  const R = DROBINKI[d.rodzaj] || DROBINKI.iskry, [ox, oy, ow, oh] = d.obszar || [0, 0, 128, 128], kolor = d.kolor || R.kolor;
  g.fillStyle = kolor;
  for (let i = 0; i < (d.ile || 12); i++) {
    const zycie = R.zycie * (0.7 + 0.6 * szum(i)), faza = t / zycie + szum(i + 50), cykl = Math.floor(faza), q = faza - cykl, z = i * 7 + cykl * 31;
    const x = ox + ow * szum(z) + Math.sin(q * 5 + z) * R.fala, start = oy + oh * (0.5 + 0.5 * szum(z + 3) * -R.kier);
    const y = start + R.kier * q * oh * R.droga;
    g.globalAlpha = Math.sin(q * Math.PI) * R.alfa * (R.migot ? 0.6 + 0.4 * Math.sin(t * 20 + i) : 1);
    g.fillRect(Math.round(x * S), Math.round(y * S), S, S);
  }
  g.globalAlpha = 1;
}
// jedna klatka: t w sekundach, stan { mrug, blysk } — rysuje na g (canvas 128·S)
function rysuj(g, img, p, cfg, kolor, t, { zak = 0, blysk = -1 } = {}) {
  const R = 128 * S; g.imageSmoothingEnabled = false; g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  g.drawImage(img, 0, 0, R, R);
  // oddech: tułów unosi się o ułamek piksela (rozciąga w górę, dół stoi), cykl 4,5 s
  const [ox, oy, ow, oh] = p.oddech, unies = Math.round((Math.sin(t * Math.PI * 2 / 4.5) + 1) / 2 * 0.75 * S);
  if (unies) g.drawImage(p.warstwa, ox * S, oy * S - unies, ow * S, oh * S + unies);
  ruchy(g, p, t, unies);
  if (cfg.swieca) {   // świecące oczy pulsują
    g.globalCompositeOperation = "lighter";
    for (const o of p.oczy) {
      const cx = (o.x + o.w / 2) * S, cy = (o.y + o.h / 2) * S, r = Math.max(o.w, o.h) * S * 1.6, a = 0.25 + 0.2 * Math.sin(t * 2.3 + o.x);
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, cfg.swieca); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = a; g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  } else if (zak > 0) for (const o of p.oczy) powieka(g, zak, o.kolor, (o.x + o.w / 2) * S, (o.y + o.h / 2) * S, (o.w / 2 + 0.5) * S, (o.h / 2 + 0.5) * S);
  for (const [i, o] of p.ogien.entries()) {   // płomienie migoczą: obszar dorysowany „lighter” rozjaśnia jasne piksele ognia + poświata
    const f = migot(t, i * 1.7 + o.x), cy = o.y + o.h / 2;
    const dy = unies && cy > oy ? -unies * Math.max(0, 1 - (cy - oy) / oh) : 0;   // za oddechem, gdy ogień leży na tułowiu
    g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.1 + 0.3 * f;
    g.drawImage(img, o.x, o.y, o.w, o.h, o.x * S, o.y * S + dy, o.w * S, o.h * S);
    const cx = (o.x + o.w / 2) * S, r = Math.max(o.w, o.h) * S * (0.8 + 0.2 * f), gr = g.createRadialGradient(cx, cy * S + dy, 0, cx, cy * S + dy, r);
    gr.addColorStop(0, o.kolor); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 0.06 + 0.12 * f; g.fillStyle = gr; g.fillRect(cx - r, cy * S + dy - r, r * 2, r * 2);
  }
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  if (cfg.drobinki) drobinki(g, cfg.drobinki, t);
  if (blysk >= 0 && blysk <= 1) {   // refleks światła ukosem przez portret, lekko w kolorze frakcji
    const x = (-0.4 + blysk * 1.8) * R, gr = g.createLinearGradient(x - R * 0.25, x * 0.4 - R * 0.1, x + R * 0.25, x * 0.4 + R * 0.1);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, kolor || "#fff4d8"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.22; g.fillStyle = gr; g.fillRect(0, 0, R, R);
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }
}
// kolor błysku: kolor frakcji rozjaśniony do bieli (70%)
const jasny = k => { const m = /^#?([0-9a-f]{6})$/i.exec(k || ""); if (!m) return "#fff4d8"; const n = parseInt(m[1], 16);
  return hex([n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(v * 0.3 + 255 * 0.7))); };

const aktywne = new Set();
let biegnie = false, ostatnia = 0;
function petla(ms) {
  const t = ms / 1000;
  if (t - ostatnia >= KLATKA) { ostatnia = t; for (const a of aktywne) a.klatka(t); }
  if (aktywne.size) requestAnimationFrame(petla); else biegnie = false;
}
function startuj(a) { aktywne.add(a); a.canvas.hidden = false; a.img.style.visibility = "hidden"; if (!biegnie) { biegnie = true; requestAnimationFrame(petla); } }
function zatrzymaj(a) { aktywne.delete(a); a.canvas.hidden = true; a.img.style.visibility = ""; }
function animator(img, cfg, kolor) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128 * S; canvas.className = "portret-anim"; canvas.hidden = true;
  canvas.setAttribute("aria-hidden", "true"); img.after(canvas);
  const g = canvas.getContext("2d"), p = przygotuj(img, cfg), k = jasny(kolor);
  let mrug = performance.now() / 1000 + los(1, 3), blysk = performance.now() / 1000 + los(3, 8);
  return { img, canvas, klatka(t) {
    if (!canvas.isConnected) return zatrzymaj(this);
    let zak = 0, b = -1;
    if (t > mrug) { const q = (t - mrug) / MRUG; if (q >= 1) mrug = t + (Math.random() < 0.2 ? 0.12 : los(3, 8)); else zak = zamkniecie(q); }
    if (t > blysk) { b = (t - blysk) / 0.9; if (b > 1) { blysk = t + los(8, 15); b = -1; } }
    rysuj(g, img, p, cfg, k, t, { zak, blysk: b });
  } };
}
// ożywia portrety w kontenerze: img[data-portret] (nazwa pliku bez .png) wewnątrz .portret; .duzy — stale, pozostałe po najechaniu
export function ozywPortrety(kontener, kolor) {
  if (!animacjePortretow()) return;
  kontener.querySelectorAll(".portret img[data-portret]").forEach(img => {
    if (img._anim) return;
    const start = () => {
      if (!animacjePortretow()) return;
      img._anim ??= animator(img, PORTRETY_ANIM[img.dataset.portret] || {}, img.dataset.kolor || kolor);
      startuj(img._anim);
    };
    const gotowe = f => img.complete && img.naturalWidth ? f() : img.addEventListener("load", f, { once: true });
    const ramka = img.closest(".portret");
    if (ramka.classList.contains("duzy")) return gotowe(start);
    const nad = ramka.closest("button, li, .karta-bohatera") || ramka;
    nad.addEventListener("mouseenter", () => gotowe(start));
    nad.addEventListener("mouseleave", () => img._anim && zatrzymaj(img._anim));
    nad.addEventListener("focusin", () => gotowe(start));
    nad.addEventListener("focusout", () => img._anim && zatrzymaj(img._anim));
  });
}
// zatrzymanie animacji portretów w kontenerze (np. zamknięte okno bohatera)
export function zatrzymajPortrety(kontener) { for (const a of [...aktywne]) if (kontener.contains(a.canvas)) zatrzymaj(a); }
// podgląd do sprawdzania konfiguracji (testy, materialy/): klatka z zamkniętymi oczami / błyskiem → canvas
export function klatkaPortretu(img, cfg, { zak = 0, blysk = -1, t = 0, kolor } = {}) {
  const c = document.createElement("canvas"); c.width = c.height = 128 * S;
  rysuj(c.getContext("2d"), img, przygotuj(img, cfg), cfg, jasny(kolor), t, { zak, blysk }); return c;
}
