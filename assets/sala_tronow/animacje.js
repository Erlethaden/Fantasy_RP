// Animacje Sali Tronów: sceny 1920×1080 na canvasie, wszystkie efekty w kodzie (bez dodatkowych grafik).
// Współrzędne w opisie scen są w pikselach obrazu 1920×1080.
// Użycie: const s = new Sala(canvas, "sala_tronow/"); (albo new Sala(canvas, plik => adres)) s.tryb = "fade"|"czern"|"przesun"|"blysk"; s.pokaz(nr);
(function () {
// oddech: [x, y, w, h, amplituda] — tułów; glowa: [x, y, w, h] — rusza się osobno (rozglądanie, skinienie przy geście)
// mgla: [y, wysokość, kolor, alfa] — snująca się mgła przy podłodze; promienie: [x, szerokość, kąt, kolor, alfa]
// dym: [[x, y, kolor, vx, vy]] — źródła dymu
// kleby: namalowany dym wycięty do osobnej warstwy (plik) z odtworzonym tłem pod nim (tlo), faluje; zianie: [x, y] paszczy, co 5–9 s wydech kłębów
const SCENY = [
  { plik: "surtr.png", imie: "Najwyższy Kowal Surtr", frakcja: "Krag-Mhor · Dawi", fokus: [1190, 400],
    oczy: [[1138, 229, 18, 23], [1183, 227, 18, 25]], powieka: ["#dc936f", "#dc976d"],
    oddech: [940, 140, 600, 430, 3], glowa: [1080, 160, 190, 200],
    ognie: [[1810, 470, 90, "#ff7a1a"], [330, 540, 120, "#ff7a1a"], [690, 90, 60, "#ffa030"], [70, 420, 30, "#ff8a2a"], [1700, 140, 22, "#ff8a2a"]],
    blaski: [[420, 720, 150, "#ff6a1a"], [420, 1000, 90, "#ff6a1a"], [1530, 330, 60, "#ff6a1a"]],
    mgla: [800, 280, "#8a3a1a", 0.22],
    iskry: { kolory: ["#ffb347", "#ff7a1a", "#ffe08a"], ile: 90, obszar: [0, 300, 1920, 780], vy: [-90, -40], rozmiar: [2, 4] },
    gest: { blysk: [[740, 220, 320, "#ff8a2a"]], wybuch: [700, 110, "#ffc060"] } },
  { plik: "seranya.png", imie: "Seranya „Niezłomne Światło”", frakcja: "Aurelia · Draenei", fokus: [1060, 450],
    oczy: [[1016, 250, 31, 27], [1078, 243, 36, 27]], powieka: ["#cbbbc7", "#bfa9ba"],
    oddech: [880, 120, 460, 480, 3], glowa: [950, 170, 230, 200],
    blaski: [[75, 660, 70, "#5ab0ff"], [1830, 660, 70, "#5ab0ff"], [1510, 900, 55, "#5ab0ff"], [760, 205, 55, "#7fc4ff"], [1325, 650, 50, "#7fc4ff"], [1040, 445, 28, "#7fc4ff"]],
    gwiazdki: [[20, 590, 130, 150, "#dff1ff"], [1770, 590, 130, 150, "#dff1ff"], [700, 140, 120, 130, "#fff6d0"], [1270, 590, 110, 120, "#dff1ff"]],
    sztandary: [[200, 0, 140, 470], [1615, 0, 150, 470]],
    promienie: [[560, 130, 0.35, "#fff2c8", 0.2], [800, 80, 0.35, "#fff2c8", 0.14], [1380, 110, 0.35, "#fff2c8", 0.12]],
    mgla: [860, 220, "#fff6e6", 0.28],
    iskry: { kolory: ["#fff1c0", "#ffe7a0"], ile: 60, obszar: [0, 0, 1920, 1080], vy: [-22, -8], rozmiar: [2, 3], miekkie: true },
    gest: { blysk: [[760, 205, 280, "#8fd0ff"], [1325, 650, 170, "#8fd0ff"]], gwiazdy: true } },
  { plik: "gobloni.png", imie: "Gobloni", frakcja: "Goblandia", fokus: [1100, 420],
    oddech: [600, 60, 840, 620, 4], glowa: [950, 100, 350, 330],
    ognie: [[135, 215, 70, "#ffb040"], [550, 95, 60, "#ffb040"], [1775, 215, 70, "#ffb040"]],
    gwiazdki: [[1300, 640, 620, 440, "#fff3b0"], [450, 860, 900, 220, "#fff3b0"]],
    mgla: [900, 180, "#c8a070", 0.14],
    iskry: { kolory: ["#ffd36a", "#fff0b0"], ile: 40, obszar: [0, 0, 1920, 1080], vy: [-25, -10], rozmiar: [2, 3], miekkie: true },
    gest: { moneta: [1690, 830], smiech: true } },
  { plik: "elmon.png", imie: "Elmon Devil", frakcja: "Rogus Ardens · Kreeganie", fokus: [1000, 420],
    okragle: [[955, 226, 12], [1033, 217, 15], [805, 421, 19], [909, 482, 19], [993, 463, 20], [1109, 469, 28], [1283, 381, 30], [988, 664, 22], [1107, 722, 28], [689, 740, 25]],
    powieka: "#221f27",
    oddech: [520, 40, 1000, 600, 4], glowa: [880, 120, 230, 200],
    ognie: [[145, 980, 60, "#ff4020"], [1825, 1000, 50, "#ff4020"]],
    blaski: [[340, 195, 130, "#ff3030"], [1080, 95, 90, "#ffd060"], [1000, 300, 70, "#ff3020"]],
    mgla: [780, 300, "#902020", 0.3],
    iskry: { kolory: ["#ff5030", "#ff9040", "#ffd060"], ile: 90, obszar: [0, 400, 1920, 680], vy: [-100, -50], rozmiar: [2, 4] },
    gest: { blysk: [[1000, 300, 220, "#ff3020"]], oczyBlysk: "#ff2020" } },
  { plik: "shire.png", imie: "Shire, Czarny Smok", frakcja: "Królestwo Czarnego Smoka", fokus: [1150, 600],
    okragle: [[1134, 639, 18], [1060, 632, 7]], powieka: ["#1f2127", "#1e1114"],
    oddech: [990, 360, 520, 480, 4], glowa: [1000, 540, 260, 190],
    blaski: [[1130, 640, 45, "#ff2020"]],
    dym: [[1050, 765, "#5a6058", -28, -15]],
    kleby: { plik: "shire_dym.png", tlo: "shire_dym_tlo.png", obszar: [800, 550, 245, 350], paszcza: 195 }, zianie: [1052, 748],
    promienie: [[640, 150, 0.25, "#a8c0b0", 0.09], [380, 90, 0.25, "#a8c0b0", 0.06]],
    mgla: [660, 420, "#5f7468", 0.4],
    iskry: { kolory: ["#8a8f88", "#6b6f6a", "#a3a8a0"], ile: 70, obszar: [0, -40, 1920, 1080], vy: [15, 35], rozmiar: [2, 3] },
    gest: { blysk: [[1130, 640, 130, "#ff2020"]] } },
  { plik: "drogath.png", imie: "Drogath „Najdłuższy Kieł”", frakcja: "Królestwo Szarych Kłów · Orkowie", fokus: [980, 450],
    oczy: [[957, 252, 17, 10], [1009, 252, 20, 11]], powieka: ["#26292d", "#282d33"],
    oddech: [690, 130, 560, 440, 3], glowa: [900, 190, 180, 170],
    ognie: [[45, 440, 70, "#ff8a2a"], [1860, 445, 70, "#ff8a2a"]],
    blaski: [[1800, 560, 220, "#ff4020"], [990, 205, 16, "#ff3040"], [965, 257, 12, "#ffb020"], [1019, 257, 12, "#ffb020"]],
    sztandary: [[60, 0, 170, 500], [1655, 0, 180, 500]],
    mgla: [860, 220, "#703028", 0.24],
    iskry: { kolory: ["#ffb347", "#ff7a1a"], ile: 45, obszar: [0, 500, 1920, 580], vy: [-70, -30], rozmiar: [2, 3] },
    gest: { oczyBlysk: "#ffb020", blysk: [[45, 440, 170, "#ff8a2a"], [1860, 445, 170, "#ff8a2a"]] } },
  { plik: "tarael.png", imie: "Tarael Illitris", frakcja: "Grobowe Imperium · Nieumarli", fokus: [1130, 450],
    oczy: [[1080, 272, 34, 20], [1142, 262, 38, 21]], powieka: ["#26222c", "#1b1c25"],
    oddech: [930, 70, 580, 520, 3], glowa: [1010, 200, 220, 180],
    ognie: [[105, 650, 40, "#ffcc66"], [1785, 650, 40, "#ffcc66"], [455, 740, 25, "#ffcc66"], [195, 910, 25, "#ffcc66"]],
    blaski: [[1240, 120, 270, "#9a5cff"], [290, 290, 130, "#20e0c8"], [665, 135, 22, "#b070ff"], [1097, 283, 12, "#30ffe0"], [1160, 273, 14, "#30ffe0"]],
    sztandary: [[165, 25, 250, 560]],
    dym: [[560, 1010, "#8a50e0", 10, -40], [1520, 960, "#8a50e0", -10, -40]],
    mgla: [820, 260, "#5a3a90", 0.3],
    iskry: { kolory: ["#a070ff", "#c49bff", "#30ffe0"], ile: 55, obszar: [450, 500, 1200, 580], vy: [-35, -15], rozmiar: [2, 3], miekkie: true },
    gest: { blysk: [[1240, 130, 400, "#a070ff"]], oczyBlysk: "#30ffe0" } },
];

const los = (a, b) => a + Math.random() * (b - a);
const migotanie = (t, f) => 0.62 + 0.22 * Math.sin(t * 9 + f) + 0.16 * Math.sin(t * 23 + f * 2);
const obetnij = (v, a, b) => Math.max(a, Math.min(b, v));
const wProst = (x, y, [px, py, w, h]) => x > px && x < px + w && y > py && y < py + h;
// mrugnięcie (q: 0..1 przez 0,26 s): szybkie zamknięcie, chwila zamknięte, wolniejsze otwarcie
const MRUG = 0.26;
const zamkniecie = q => q < 0.3 ? Math.sin(q / 0.3 * Math.PI / 2) : q < 0.42 ? 1 : (1 - (q - 0.42) / 0.58) ** 2;

// wycinek obrazu z miękkim eliptycznym brzegiem (warstwy oddechu i głowy)
function miekkiWycinek(img, [x, y, w, h], twardo) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.drawImage(img, x, y, w, h, 0, 0, w, h);
  g.globalCompositeOperation = "destination-in";
  g.setTransform(w / 2, 0, 0, h / 2, w / 2, h / 2);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, "#fff"); gr.addColorStop(twardo, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2);
  return c;
}
// tekstura mgły: miękkie kłęby w kolorze sceny, zawija się w poziomie
function teksturaMgly(kolor) {
  const W = 1024, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * W, y = H * (0.35 + Math.random() * 0.55), r = 40 + Math.random() * 90;
    for (const dx of [-W, 0, W]) {
      const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      gr.addColorStop(0, kolor); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = 0.25 + Math.random() * 0.35; g.fillStyle = gr; g.fillRect(x + dx - r, y - r, r * 2, r * 2);
    }
  }
  return c;
}

class Sala {
  constructor(canvas, folder) {
    this.cv = canvas; this.g = canvas.getContext("2d");
    this.sceny = SCENY; this.tryb = "fade"; this.zoom = true; this.ruch = true; this.czasPrzejscia = 1.6;
    this.nr = -1; this.poprz = -1; this.przejscie = 1; this.t = 0;
    const obraz = plik => Object.assign(new Image(), { src: typeof folder === "function" ? folder(plik) : folder + plik }); // folder: ścieżka albo funkcja plik → adres (Vite)
    for (const s of SCENY) {
      s.img = obraz(s.plik); s.img.onload = () => this.przygotuj(s);
      if (s.kleby) { s.klebyImg = obraz(s.kleby.plik); s.klebyTlo = obraz(s.kleby.tlo); }
    }
    addEventListener("resize", () => this.rozmiar()); this.rozmiar();
    let ost = performance.now();
    const petla = teraz => {
      const dt = Math.min(0.05, (teraz - ost) / 1000); ost = teraz;
      if (!this.reczny) this.krok(dt);
      requestAnimationFrame(petla);
    };
    requestAnimationFrame(petla);
  }
  // reczny = true: czas płynie tylko przez krok(dt) — do nagrywania równych klatek
  krok(dt) { this.t += dt; this.klatka(dt); }
  rozmiar() {
    const d = devicePixelRatio || 1;
    this.cv.width = innerWidth * d; this.cv.height = innerHeight * d;
    this.g.imageSmoothingEnabled = false;
  }
  przygotuj(s) {
    s.warstwa = miekkiWycinek(s.img, s.oddech, 0.72);
    s.glowaW = miekkiWycinek(s.img, s.glowa, 0.6);
    if (s.mgla) s.mglaT = teksturaMgly(s.mgla[2]);
  }
  pokaz(i) {
    i = (i + SCENY.length) % SCENY.length; if (i === this.nr) return;
    this.poprz = this.nr; this.nr = i; this.przejscie = this.poprz < 0 ? 1 : 0;
    const s = SCENY[i]; s.od = this.t; s.mrug = this.t + los(1, 3); s.gestOd = this.t + los(3, 6); s.wydechOd = this.t + los(1.5, 3);
    if (!s.czastki) {
      s.czastki = Array.from({ length: s.iskry.ile }, () => this.nowaIskra(s, true));
      // kilka dużych, rozmytych drobin „przed kamerą” — szybsze, dają głębię
      s.bokeh = Array.from({ length: 7 }, () => ({ ...this.nowaIskra(s, true), r: los(8, 18) }));
    }
    s.dymy = []; s.blyski = [];
  }
  nowaIskra(s, gdziekolwiek) {
    const k = s.iskry, [x, y, w, h] = k.obszar, vy = los(...k.vy);
    return { x: los(x, x + w), y: gdziekolwiek ? los(y, y + h) : (vy < 0 ? y + h : y), vy, f: los(0, 6),
      r: Math.round(los(...k.rozmiar)), kolor: k.kolory[Math.floor(Math.random() * k.kolory.length)] };
  }
  klatka(dt) {
    if (this.cv.width !== Math.round(innerWidth * (devicePixelRatio || 1))) this.rozmiar(); // okno zmieniło rozmiar bez zdarzenia resize
    const g = this.g, W = this.cv.width, H = this.cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    g.fillStyle = "#0b0c12"; g.fillRect(0, 0, W, H);
    if (this.nr < 0) return;
    this.przejscie = Math.min(1, this.przejscie + dt / this.czasPrzejscia);
    const p = this.przejscie, e = p * p * (3 - 2 * p), A = SCENY[this.poprz], B = SCENY[this.nr];
    if (p >= 1 || !A) return this.scena(B, 1, 0, dt);
    if (this.tryb === "przesun") { this.scena(A, 1, -e, dt); this.scena(B, 1, 1 - e, dt); }
    else if (this.tryb === "czern") { if (p < 0.5) this.scena(A, 1 - p * 2, 0, dt); else this.scena(B, p * 2 - 1, 0, dt); }
    else { this.scena(A, 1, 0, dt); this.scena(B, e, 0, dt); }
    if (this.tryb === "blysk") { // jasny błysk w połowie przejścia
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = Math.max(0, 1 - Math.abs(p - 0.35) * 4) * 0.85;
      g.fillStyle = "#fff4dc"; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    }
  }
  scena(s, alfa, przes, dt) {
    if (!s.img.complete || !s.warstwa) return;
    const g = this.g, W = this.cv.width, H = this.cv.height, t = this.t, ruch = this.ruch;
    const czas = t - s.od, [fx, fy] = s.fokus;
    // kamera: powolne przybliżanie + lekki dryf; dryf obcięty tak, żeby nie odsłonić brzegu obrazu
    let zoom = 1, px = 0, py = 0;
    if (this.zoom) {
      zoom = 1.03 + 0.05 * Math.min(1, czas / 14);
      if (ruch) {
        const m = 1 - 1 / zoom;
        px = obetnij(Math.sin(czas * 0.23) * 22, -(1920 - fx) * m, fx * m);
        py = obetnij(Math.sin(czas * 0.17 + 1) * 10, -(1080 - fy) * m, fy * m);
      }
    }
    const k0 = Math.max(W / 1920, H / 1080), k = k0 * zoom;
    const ox = (W - 1920 * k0) / 2 + fx * k0 - fx * k + px * k + przes * W, oy = (H - 1080 * k0) / 2 + fy * k0 - fy * k + py * k;
    g.setTransform(k, 0, 0, k, ox, oy); g.globalAlpha = alfa; g.globalCompositeOperation = "source-over";
    g.drawImage(s.img, 0, 0);
    // gest: co 9–14 s krótki „ruch” władcy (skinienie, rozbłysk, iskry, dym, moneta)
    let gest = 0;
    if (ruch && t > s.gestOd) { const q = (t - s.gestOd) / 1.8; if (q >= 1) s.gestOd = t + los(9, 14); else gest = Math.sin(Math.PI * q); }
    // wydech smoka: co 5–9 s dmucha dymem z paszczy (gest też jest wydechem)
    let wydech = 0;
    if (ruch && s.zianie) {
      if (t > s.wydechOd) { const q = (t - s.wydechOd) / 2; if (q >= 1) s.wydechOd = t + los(5, 9); else wydech = Math.sin(Math.PI * q); }
      wydech = Math.max(wydech, gest);
    }
    // namalowany dym: tło bez dymu + dym w paskach falujących coraz mocniej ku górze, wydech odpycha go od paszczy
    if (s.kleby && s.klebyImg.complete && s.klebyTlo.complete) {
      const [x, y, w, h] = s.kleby.obszar;
      g.drawImage(s.klebyTlo, x, y);
      for (let r = 0; r < h; r += 3) {
        const k = 1 - r / h, pchniecie = Math.exp(-(((r - s.kleby.paszcza) / 90) ** 2));
        const fala = ruch ? (Math.sin(t * 1.2 - r * 0.035) * 7 + Math.sin(t * 0.5 + r * 0.012) * 4) * k - wydech * 18 * pchniecie : 0;
        g.drawImage(s.klebyImg, 0, r, w, 3, x + fala, y + r, w, 3);
      }
    }
    if (ruch && s.sztandary) for (const [x, y, w, h] of s.sztandary)
      for (let r = 0; r < h; r += 4) {
        const fala = Math.sin(t * 1.6 + r * 0.025) * 5 + Math.sin(t * 2.7 + r * 0.06) * 2;
        g.drawImage(s.img, x, y + r, w, 4, x + fala * (r / h), y + r, w, 4);
      }
    // oddech: tułów unosi się i lekko rozszerza (dół warstwy stoi w miejscu), głowa idzie za nim
    const [bx, by, bw, bh] = s.oddech;
    let dy = 0, sc = 0, gx = 0, gy = 0;
    const wOddechu = y => dy + sc * (y - by - bh); // przesunięcie punktu w warstwie oddechu
    if (ruch) {
      const faza = Math.sin(t * Math.PI * 2 / 4.5);
      dy = faza * s.oddech[4]; sc = 0.007 * (faza + 1) / 2;
      if (s.gest.smiech) dy += Math.sin(t * 22) * 3 * gest;
      g.drawImage(s.warstwa, bx, by + wOddechu(by), bw, bh * (1 + sc));
      const [hx, hy, hw, hh] = s.glowa;
      gx = Math.sin(t * 0.37) * 1.8 + Math.sin(t * 0.91 + 1) * 0.7;
      gy = wOddechu(hy + hh / 2) + Math.sin(t * 0.53) * 0.8 + gest * 4;
      g.drawImage(s.glowaW, hx + gx, hy + gy);
    }
    // przesunięcie punktu sceny przez oddech i ruch głowy
    const ruchPkt = (x, y) => wProst(x, y, s.glowa) ? [gx, gy] : wProst(x, y, s.oddech) ? [0, wOddechu(y)] : [0, 0];
    // mruganie: powieka w kolorze skóry zjeżdża łukiem w obrysie oka, z ciemną linią rzęs
    s.zak = 0;
    if (ruch && t > s.mrug) {
      const q = (t - s.mrug) / MRUG;
      if (q >= 1) s.mrug = t + (Math.random() < 0.2 ? 0.12 : los(2.5, 6)); // czasem podwójne mrugnięcie
      else {
        s.zak = zamkniecie(q);
        const kol = i => Array.isArray(s.powieka) ? s.powieka[i] : s.powieka;
        (s.oczy || []).forEach(([x, y, w, h], i) => this.powieka(s.zak, kol(i), x + w / 2, y + h / 2, w / 2 + 1, h / 2 + 1, ruchPkt(x + w / 2, y + h / 2)));
        (s.okragle || []).forEach(([x, y, r], i) => this.powieka(s.zak, kol(i), x, y, r * 1.05, r * 1.05, ruchPkt(x, y)));
      }
    }
    const wOku = (x, y) => (s.oczy || []).some(([ex, ey, w, h]) => wProst(x, y, [ex - 4, ey - 4, w + 8, h + 8]))
      || (s.okragle || []).some(([ex, ey, r]) => Math.hypot(x - ex, y - ey) < r + 4);
    g.globalCompositeOperation = "lighter";
    const swiatlo = (x, y, r, kolor, a) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, kolor); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = alfa * Math.max(0, Math.min(1, a)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    (s.ognie || []).forEach(([x, y, r, c], i) => swiatlo(x, y, r * 1.6, c, (ruch ? migotanie(t, i * 1.7) : 0.7) * 0.5));
    (s.blaski || []).forEach(([x, y, r, c], i) => {
      const [mx, my] = ruchPkt(x, y), oko = wOku(x, y) ? 1 - s.zak : 1; // świecące oczy gasną przy mrugnięciu
      swiatlo(x + mx, y + my, r * 1.4, c, (0.28 + (ruch ? 0.16 * Math.sin(t * 1.3 + i) : 0)) * oko);
    });
    if (gest) {
      for (const [x, y, r, c] of s.gest.blysk || []) swiatlo(x, y, r, c, gest * 0.8);
      if (s.gest.oczyBlysk) {
        for (const [x, y, w, h] of s.oczy || []) { const [mx, my] = ruchPkt(x, y); swiatlo(x + w / 2 + mx, y + h / 2 + my, 40, s.gest.oczyBlysk, gest * (1 - s.zak)); }
        for (const [x, y, r] of s.okragle || []) { const [mx, my] = ruchPkt(x, y); swiatlo(x + mx, y + my, r * 3, s.gest.oczyBlysk, gest * (1 - s.zak)); }
      }
    }
    if (ruch) {
      // smugi światła z góry, powoli falują
      (s.promienie || []).forEach(([x, sz, kat, kol, a], i) => {
        g.save(); g.translate(x + Math.sin(t * 0.21 + i * 2) * 18, -40); g.rotate(-kat);
        const gr = g.createLinearGradient(0, 0, 0, 1300); gr.addColorStop(0, kol); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.globalAlpha = alfa * a * (0.65 + 0.35 * Math.sin(t * 0.6 + i * 1.3)); g.fillStyle = gr;
        g.beginPath(); g.moveTo(-sz * 0.35, 0); g.lineTo(sz * 0.35, 0); g.lineTo(sz * 0.8, 1300); g.lineTo(-sz * 0.8, 1300); g.fill();
        g.restore();
      });
      // płomienie nad ogniami: piksele od białożółtego do ciemnej czerwieni
      for (const [x, y, r, c] of s.ognie || []) for (let j = 0; j < 7; j++) {
        const f = (t * 1.6 + j / 7) % 1, px2 = x + Math.sin(t * 5 + j * 2) * r * 0.18 * f, py2 = y - f * r * 1.1;
        const z = Math.max(2, Math.round(r / 14 * (1 - f * 0.7)));
        g.globalAlpha = alfa * (1 - f) * 0.9; g.fillStyle = f < 0.2 ? "#fff6c0" : f < 0.45 ? "#ffd060" : f < 0.75 ? c : "#a02a08";
        g.fillRect(Math.round(px2 - z / 2), Math.round(py2), z, z);
      }
      // iskry / pył / popiół
      for (const c of s.czastki) {
        c.y += c.vy * dt; c.x += Math.sin(t * 1.5 + c.f) * 12 * dt;
        const [, ay, , ah] = s.iskry.obszar;
        if (c.y < ay - 10 || c.y > ay + ah + 10) Object.assign(c, this.nowaIskra(s, false));
        g.globalAlpha = alfa * (s.iskry.miekkie ? 0.35 : 0.6) * (0.6 + 0.4 * Math.sin(t * 3 + c.f));
        g.fillStyle = c.kolor; g.fillRect(Math.round(c.x), Math.round(c.y), c.r, c.r);
      }
      // gwiazdki (kryształy, monety)
      if (s.gwiazdki && Math.random() < dt * (s.gest.gwiazdy ? 6 + 30 * gest : 6)) {
        const [x, y, w, h, kol] = s.gwiazdki[Math.floor(Math.random() * s.gwiazdki.length)];
        s.blyski.push({ x: los(x, x + w), y: los(y, y + h), od: t, kol });
      }
      s.blyski = s.blyski.filter(b => t - b.od < 0.7);
      for (const b of s.blyski) {
        const a = Math.sin(Math.PI * (t - b.od) / 0.7), d = Math.round(2 + a * 6), x = Math.round(b.x), y = Math.round(b.y);
        g.globalAlpha = alfa * a; g.fillStyle = b.kol; g.fillRect(x - d, y - 1, d * 2 + 1, 3); g.fillRect(x - 1, y - d, 3, d * 2 + 1);
      }
      // wybuch iskier przy geście
      if (gest && s.gest.wybuch) {
        const [x, y, kol] = s.gest.wybuch; g.fillStyle = kol;
        for (let j = 0; j < 24; j++) { const a = j * 0.26 + t * 2, r = (1 - gest) * 10 + gest * 160 * ((j * 37) % 10) / 10;
          g.globalAlpha = alfa * gest; g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.6 - gest * 40), 3, 3); }
      }
    }
    g.globalCompositeOperation = "source-over";
    if (ruch) {
      for (const [x, y, kol, vx, vy] of s.dym || [])
        if (Math.random() < dt * 2.5) s.dymy.push({ x, y, kol, od: t, vx: vx * los(0.6, 1.4), vy: vy * los(0.6, 1.4) });
      if (s.zianie && Math.random() < dt * 22 * wydech) { // kłęby wydechu: szybko z paszczy, hamują w powietrzu i unoszą się
        const [mx, my] = ruchPkt(...s.zianie);
        s.dymy.push({ x: s.zianie[0] + mx, y: s.zianie[1] + my + los(-6, 6), kol: Math.random() < 0.5 ? "#15191a" : "#8a958f", od: t, vx: los(-150, -80), vy: los(-25, 15), opor: 1.2 });
      }
      s.dymy = s.dymy.filter(d => t - d.od < 6);
      for (const d of s.dymy) {
        const tau = t - d.od, q = tau / 6, r = 14 + q * 70, droga = d.opor ? d.opor * (1 - Math.exp(-tau / d.opor)) : tau;
        const px2 = d.x + d.vx * droga, py2 = d.y + d.vy * droga - (d.opor ? 10 * tau : 0);
        const gr = g.createRadialGradient(px2, py2, 0, px2, py2, r); gr.addColorStop(0, d.kol); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.globalAlpha = alfa * (d.opor ? 0.65 : 0.35) * Math.sin(Math.PI * Math.min(1, q * 1.2 + 0.05)); g.fillStyle = gr; g.fillRect(px2 - r, py2 - r, r * 2, r * 2);
      }
      // mgła: dwie warstwy przesuwane z różną prędkością
      if (s.mglaT) {
        const [y, h, , a] = s.mgla;
        [[14, 1.25, 0], [-9, 0.9, 400]].forEach(([v, skala, d], i) => {
          const sz = 1024 * skala * 1.4, off = ((t * v + d) % sz + sz) % sz;
          g.globalAlpha = alfa * a * (0.75 + 0.25 * Math.sin(t * 0.3 + i * 2));
          for (let x = -off; x < 1920; x += sz) g.drawImage(s.mglaT, x, y + i * h * 0.25, sz, h);
        });
      }
    }
    if (gest && s.gest.moneta) { // moneta podrzucona ze skrzyni
      const [x, y] = s.gest.moneta, q = (t - s.gestOd) / 1.8, px2 = Math.round(x + q * 50), py2 = Math.round(y - Math.sin(Math.PI * q) * 160);
      g.globalAlpha = alfa; g.fillStyle = "#7a5410"; g.fillRect(px2 - 7, py2 - 7, 14, 14);
      g.fillStyle = "#f0c040"; g.fillRect(px2 - 5, py2 - 7, 10, 14); g.fillRect(px2 - 7, py2 - 5, 14, 10);
      g.fillStyle = "#fff3b0"; g.fillRect(px2 - 3, py2 - 4, 3, 3);
    }
    if (ruch) {
      // duże rozmyte drobiny przed kamerą (szybsze niż iskry = głębia)
      g.globalCompositeOperation = "lighter";
      for (const b of s.bokeh) {
        b.y += b.vy * 2.2 * dt; b.x += Math.sin(t * 0.8 + b.f) * 20 * dt;
        const [, ay, , ah] = s.iskry.obszar;
        if (b.y < ay - 40 || b.y > ay + ah + 40) Object.assign(b, this.nowaIskra(s, false), { r: los(8, 18) });
        swiatlo(b.x, b.y, b.r, b.kolor, 0.22 * (0.6 + 0.4 * Math.sin(t * 1.7 + b.f)));
      }
      // światło pochodni drga na całej scenie
      if (s.ognie) {
        g.globalCompositeOperation = "source-over"; g.fillStyle = "#000";
        g.globalAlpha = alfa * 0.07 * (1 - migotanie(t, 0.5)); g.fillRect(0, 0, 1920, 1080);
      }
    }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  }
  // zak: 0 otwarte … 1 zamknięte; górna powieka zjeżdża łukiem, dolna lekko się unosi, spotykają się poniżej środka oka
  powieka(zak, kolor, cx, cy, rx, ry, [mx, my]) {
    const g = this.g; cx += mx; cy += my;
    const spotkanie = cy + ry * 0.3, gorna = cy - ry + (spotkanie - cy + ry) * zak, dolna = cy + ry - (cy + ry - spotkanie) * zak, luk = ry * 0.35 * zak;
    g.save();
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip();
    g.fillStyle = kolor;
    g.beginPath(); g.moveTo(cx - rx - 1, cy - ry - 1); g.lineTo(cx + rx + 1, cy - ry - 1); g.lineTo(cx + rx + 1, gorna);
    g.quadraticCurveTo(cx, gorna + luk, cx - rx - 1, gorna); g.closePath(); g.fill();
    g.fillRect(cx - rx - 1, dolna, rx * 2 + 2, cy + ry - dolna + 1);
    // linia rzęs na brzegu górnej powieki
    g.beginPath(); g.moveTo(cx - rx - 1, gorna); g.quadraticCurveTo(cx, gorna + luk, cx + rx + 1, gorna);
    g.strokeStyle = "rgba(10,8,12,.8)"; g.lineWidth = Math.max(2, ry * 0.2); g.stroke();
    g.restore();
  }
}
window.Sala = Sala;
})();
