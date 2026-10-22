// timelapse (9.3–9.4, tylko GM): historia gry tura po turze na JEDNYM płótnie 1600×900 — po lewej mapa (właściciele prowincji, granice krajów,
// armie, floty, bitwy), po prawej wykres wybranej miary (rośnie z turami) i ranking tury. Jedno płótno = ta sama klatka w programie i w filmie.
// Dane: historia/{nr} (zrzuty z zamknięcia tur). Kolory i herby krajów — obecne.
export const SZER = 1600, WYS = 900;
const M = 900;   // bok mapy w klatce
const TLO = "#0b0c12", TEKST = "#efe3c8", TEKST2 = "#bfae86", ZLOTO = "#d9b25a", SIATKA = "#2a2418";
const obraz = url => new Promise((ok, zle) => { const i = new Image(); i.onload = () => ok(i); i.onerror = zle; i.src = url; });
const liczba = v => {   // zwykły minus i spacja tysięcy ręcznie (formatowanie przeglądarki gubiło minus na płótnie)
  const m = Math.abs(v), t = m >= 1e6 ? `${+(m / 1e6).toFixed(1)} mln` : m >= 1e4 ? `${+(m / 1e3).toFixed(1)} tys.` : String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (v < 0 && Math.round(m) ? "-" : "") + t;
};
const rgb = h => { const n = parseInt(String(h).replace("#", ""), 16); return [n >> 16, n >> 8 & 255, n & 255]; };

// przygotowanie (raz na otwarcie): teren, numery prowincji w każdym pikselu mapy, herby; potem rysuj(tura ułamkowa, miara)
// opcje: { terenUrl, indeksyUrl, liczbaProwincji, historia: [zrzut], kraje: [{ id, nazwa, kolor, herb }], kolorWl(id) → "#rrggbb" | null,
//          punkt({ p, o, a }) → [x, y] w px mapy 5000, prowincjaNr(id) → nr, ikonaBitwy, miary: [{ id, nazwa, grupa, wartosc(zrzutKraju) → liczba | null }] }
export async function przygotujTimelapse(o) {
  const [teren, indeksy, bitwa, ...herby] = await Promise.all([obraz(o.terenUrl), obraz(o.indeksyUrl), obraz(o.ikonaBitwy), ...o.kraje.map(k => k.herb ? obraz(k.herb).catch(() => null) : null)]);
  const c = document.createElement("canvas"); c.width = c.height = M;
  const x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingEnabled = false;   // numery prowincji: bez mieszania kolorów
  x.drawImage(indeksy, 0, 0, M, M); const d = x.getImageData(0, 0, M, M).data, nr = new Uint16Array(M * M);
  for (let i = 0; i < nr.length; i++) nr[i] = d[i * 4] * 256 + d[i * 4 + 1];
  x.imageSmoothingEnabled = true; x.drawImage(teren, 0, 0, M, M); const tloMapy = x.getImageData(0, 0, M, M);
  const herbKraju = Object.fromEntries(o.kraje.map((k, i) => [k.id, herby[i]]));
  const mapy = new Map();   // nr tury → ImageData mapy z kolorami właścicieli (liczone raz)
  function mapaTury(z) {
    if (mapy.has(z.nr)) return mapy.get(z.nr);
    const kol = new Map(), wl = new Uint16Array(o.liczbaProwincji + 1), kody = [""];
    for (const [id, w] of Object.entries(z.wlasciciele || {})) { const n = o.prowincjaNr(id); if (!n || n > o.liczbaProwincji) continue; if (!kody.includes(w)) kody.push(w); wl[n] = kody.indexOf(w); }
    kody.forEach((w, i) => i && kol.set(i, rgb(o.kolorWl(w) || "#808080")));
    const im = new ImageData(new Uint8ClampedArray(tloMapy.data), M, M), p = im.data;
    for (let i = 0; i < nr.length; i++) {
      const n = nr[i]; if (!n || n > o.liczbaProwincji) continue;
      const k = wl[n], prawo = i % M < M - 1 ? nr[i + 1] : n, dol = i < nr.length - M ? nr[i + M] : n;
      const granicaKraju = (prawo !== n && prawo <= o.liczbaProwincji && wl[prawo] !== k) || (dol !== n && dol <= o.liczbaProwincji && wl[dol] !== k);
      if (k) { const [r, g, b] = kol.get(k), a = 0.5; p[i * 4] = p[i * 4] * (1 - a) + r * a; p[i * 4 + 1] = p[i * 4 + 1] * (1 - a) + g * a; p[i * 4 + 2] = p[i * 4 + 2] * (1 - a) + b * a; }
      if (granicaKraju) { p[i * 4] *= 0.25; p[i * 4 + 1] *= 0.25; p[i * 4 + 2] *= 0.25; }
      else if (prawo !== n || dol !== n) { p[i * 4] *= 0.8; p[i * 4 + 1] *= 0.8; p[i * 4 + 2] *= 0.8; }   // zwykła granica prowincji — delikatnie
    }
    const cc = document.createElement("canvas"); cc.width = cc.height = M; cc.getContext("2d").putImageData(im, 0, 0);
    mapy.set(z.nr, cc); return cc;
  }
  const historia = o.historia, tury = historia.map(z => z.nr);
  const wartosc = (miara, z, kraj) => { const k = z.kraje?.[kraj]; return k ? miara.wartosc(k) : null; };

  // klatka: t = indeks tury w historii, ułamkowy w trakcie przejścia (wykres rośnie płynnie, mapa zmienia się na pełnej turze)
  function rysuj(g, t, miara) {
    t = Math.max(0, t);   // znacznik klatki animacji bywa odrobinę wcześniejszy niż start → ujemna tura
    const i = Math.min(historia.length - 1, Math.floor(t)), z = historia[i], s = M / 5000;
    g.fillStyle = TLO; g.fillRect(0, 0, SZER, WYS);
    g.drawImage(mapaTury(z), 0, 0);
    for (const a of z.armie || []) { const pt = o.punkt(a); if (!pt) continue; znak(g, pt[0] * s, pt[1] * s, o.kolorWl(a.f) || "#808080", 4 + Math.min(8, Math.sqrt(a.n || 0) / 4), "kolo"); }
    for (const f of z.floty || []) { const pt = o.punkt({ a: f.a }); if (!pt) continue; znak(g, pt[0] * s, pt[1] * s, o.kolorWl(f.f) || "#808080", 6, "romb"); }
    for (const b of z.bitwy || []) { const pt = o.punkt(b); if (pt) g.drawImage(bitwa, pt[0] * s - 14, pt[1] * s - 14, 28, 28); }
    // prawa część: tytuł, wykres, ranking
    const X0 = M + 40, W = SZER - X0 - 40;
    g.fillStyle = ZLOTO; g.font = "700 46px Cinzel, Georgia, serif"; g.textBaseline = "alphabetic"; g.fillText(`Tura ${z.nr}`, X0, 64);
    g.fillStyle = TEKST2; g.font = "22px Spectral, Georgia, serif"; g.fillText(miara.nazwa, X0, 100);
    wykresKlatki(g, { x: X0, y: 120, w: W, h: 380 }, t, miara);
    rankingKlatki(g, { x: X0, y: 540, w: W, h: 330 }, i, miara);
  }
  function znak(g, x, y, kolor, r, ksztalt) {
    g.beginPath(); if (ksztalt === "romb") { g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); } else g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = kolor; g.fill(); g.lineWidth = 2; g.strokeStyle = "#f3e7c6"; g.stroke();
  }
  function wykresKlatki(g, r, t, miara) {
    const serie = o.kraje.map(k => ({ k, v: historia.map(z => wartosc(miara, z, k.id)) })).filter(s => s.v.some(v => v !== null));
    const wsz = serie.flatMap(s => s.v).filter(v => v !== null);
    if (!wsz.length) { g.fillStyle = TEKST2; g.font = "20px Spectral, Georgia, serif"; g.fillText("Brak danych dla tej miary.", r.x, r.y + 40); return; }
    let min = Math.min(0, ...wsz), max = Math.max(...wsz); if (max === min) max = min + 1;
    const L = 64, X = k => r.x + L + (historia.length === 1 ? (r.w - L - 40) / 2 : k / (historia.length - 1) * (r.w - L - 40)), Y = v => r.y + r.h - 24 - (v - min) / (max - min) * (r.h - 34);
    g.font = "15px Spectral, Georgia, serif"; g.textAlign = "right";
    for (let k = 0; k <= 4; k++) { const v = min + (max - min) * k / 4, y = Y(v); g.strokeStyle = SIATKA; g.lineWidth = 1; g.beginPath(); g.moveTo(r.x + L, y); g.lineTo(r.x + r.w - 40, y); g.stroke(); g.fillStyle = TEKST2; g.fillText(liczba(v), r.x + L - 8, y + 5); }
    g.textAlign = "center"; const co = Math.max(1, Math.ceil(historia.length / 10));
    historia.forEach((z, k) => { if (k % co === 0 || k === historia.length - 1) { g.fillStyle = TEKST2; g.fillText(z.nr, X(k), r.y + r.h); } });
    g.textAlign = "left";
    const do_ = Math.min(t, historia.length - 1);
    for (const s of serie) {   // linia rośnie do bieżącej (ułamkowej) tury, na końcu herb kraju — kraj nie jest rozpoznawany samym kolorem
      g.strokeStyle = s.k.kolor; g.lineWidth = 3; g.lineJoin = g.lineCap = "round"; g.beginPath();
      let ost = null;
      for (let k = 0; k <= Math.ceil(do_); k++) {
        if (s.v[k] === null) continue;
        let px = X(k), py = Y(s.v[k]);
        if (k > do_ && ost) { const f = do_ - Math.floor(do_); px = ost[0] + (px - ost[0]) * f; py = ost[1] + (py - ost[1]) * f; }
        ost ? g.lineTo(px, py) : g.moveTo(px, py); ost = [px, py];
      }
      g.stroke();
      if (ost) { const h = herbKraju[s.k.id]; if (h) g.drawImage(h, ost[0] + 4, ost[1] - 14, 28, 28); else { g.fillStyle = s.k.kolor; g.beginPath(); g.arc(ost[0], ost[1], 5, 0, Math.PI * 2); g.fill(); } }
    }
  }
  function rankingKlatki(g, r, i, miara) {
    const z = historia[i], l = o.kraje.map(k => ({ k, v: wartosc(miara, z, k.id) })).filter(e => e.v !== null).sort((a, b) => b.v - a.v);
    const wiersz = Math.min(44, r.h / Math.max(1, l.length)), max = Math.max(1, ...l.map(e => Math.abs(e.v)));
    g.font = "20px Spectral, Georgia, serif";
    l.forEach((e, n) => {
      const y = r.y + n * wiersz, h = herbKraju[e.k.id];
      g.fillStyle = TEKST2; g.textAlign = "right"; g.fillText(`${n + 1}.`, r.x + 24, y + 26); g.textAlign = "left";
      if (h) g.drawImage(h, r.x + 32, y + 4, 32, 32);
      g.fillStyle = TEKST; g.fillText(e.k.nazwa, r.x + 72, y + 26, 218);   // długie nazwy ściśnięte, nie wchodzą na pasek
      const bx = r.x + 300, bw = Math.max(2, (r.w - 300 - 110) * Math.abs(e.v) / max);
      g.fillStyle = e.k.kolor; g.fillRect(bx, y + 10, bw, 20);
      g.fillStyle = TEKST; g.font = "700 25px Spectral, Georgia, serif"; g.fillText(liczba(e.v), bx + bw + 10, y + 28); g.font = "20px Spectral, Georgia, serif";   // większe: cienki minus ginął, gdy okno pomniejsza płótno
    });
  }
  return { tury, rysuj, mapa: mapaTury };   // mapa(zrzut) → płótno 900×900 z kolorami właścicieli (też film opowieści 13.5b)
}

// --- eksport (9.4) ---
// film: nagranie płótna w czasie rzeczywistym (MediaRecorder) — MP4, gdy program to umie, inaczej WebM (Discord odtwarza oba)
export function formatFilmu() {
  for (const t of ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"]) if (window.MediaRecorder?.isTypeSupported?.(t)) return t;
  return null;
}
const pauza = ms => new Promise(ok => setTimeout(ok, ms));
// klatka(t) rysuje na płótnie; ileTur — liczba zrzutów; naTure — sekundy na turę; na początku 1 s, na końcu 2,5 s stopklatki
export async function nagrajFilm(plotno, klatka, ileTur, { naTure = 1.2, postep = () => {} } = {}) {
  const typ = formatFilmu(); if (!typ) throw new Error("Ten program nie umie nagrywać filmu.");
  const czesci = [], rek = new MediaRecorder(plotno.captureStream(30), { mimeType: typ, videoBitsPerSecond: 2.5e6 })   // mapa w większości stoi — 2,5 Mb/s wystarcza, a 30 tur mieści się w limicie Discorda (10 MB);
  rek.ondataavailable = e => e.data.size && czesci.push(e.data);
  const koniec = new Promise(ok => { rek.onstop = ok; });
  const czas = 1 + (ileTur - 1) * naTure + 2.5;
  rek.start(250);
  await new Promise(ok => {
    const t0 = performance.now();
    const krok = teraz => {
      const s = (teraz - t0) / 1000;
      klatka(Math.max(0, Math.min(ileTur - 1, (s - 1) / naTure))); postep(Math.min(1, s / czas));
      s < czas ? requestAnimationFrame(krok) : ok();
    };
    requestAnimationFrame(krok);
  });
  rek.stop(); await koniec;
  return new Blob(czesci, { type: typ.split(";")[0] });
}
// GIF: klatki co 1/fps s, pomniejszone do szer (mniejszy plik), paleta 256 kolorów na klatkę (gifenc)
export async function nagrajGif(klatka, ileTur, { szer = 800, fps = 6, naTure = 1.2, postep = () => {} } = {}) {   // 800 px i 6 kl./s: GIF i tak wychodzi kilka razy większy niż film
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const duze = document.createElement("canvas"); duze.width = SZER; duze.height = WYS;
  const male = document.createElement("canvas"); male.width = szer; male.height = Math.round(szer * WYS / SZER);
  const g = duze.getContext("2d"), m = male.getContext("2d", { willReadFrequently: true }), gif = GIFEncoder();
  const klatki = Math.max(1, Math.round((ileTur - 1) * naTure * fps)) + 1;
  for (let n = 0; n < klatki; n++) {
    klatka(g, klatki === 1 ? 0 : n / (klatki - 1) * (ileTur - 1));
    m.drawImage(duze, 0, 0, male.width, male.height);
    const { data } = m.getImageData(0, 0, male.width, male.height), paleta = quantize(data, 256);
    gif.writeFrame(applyPalette(data, paleta), male.width, male.height, { palette: paleta, delay: n === 0 ? 1000 : n === klatki - 1 ? 2500 : Math.round(1000 / fps) });
    postep((n + 1) / klatki); await pauza(0);   // okno nie zamarza
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}
