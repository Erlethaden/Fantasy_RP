// Mapa pod paskiem: rysunek z przesuwaniem (przeciąganie) i przybliżaniem (kółko, +/-) oraz prowincje:
// podświetlenie pod kursorem, zaznaczenie wybranej. Prowincje: obraz z indeksem w kolorze (R*256+G, 0 = woda) w skali 1/2 rysunku.
// onKlik(indeks, x, y) — klik bez przeciągania; indeks prowincji (1…) albo 0 (woda / góry / poza mapą); x, y w px mapa.png. ramki[indeks-1] = [x0, y0, x1, y1] w px obrazu indeksów.
// kafle: { rozmiar, poziomy: {poziom: szerokość w px}, kafle: {poziom: ["x_y"]} }, pliki w `mapa/kafle/<poziom>/<x>_<y>.png` — ostrość przy przybliżeniu.
// granice: linie [x0, y0, x1, y1, …] w px mapa.png — granice między prowincjami, rysowane przerywaną kreską jak na rysunku; graniceMorskie — między akwenami (7.8a), od przybliżenia 0.5
// ikony: {miasto, wioska, stolica} → adresy obrazków pixel art (brakujące = prosty znacznik z CSS)
// rozmiar: [szer, wys] układu współrzędnych mapy (px mapa.png), gdy rysunek ma inną rozdzielczość (teren.png 2500² pokazywany ×2 — 7.6b)
// teren: { maska, tekstury: {typ: url} } — tekstury typów terenu prowincji nakładane w przeglądarce na zwykły ląd (maska R), wersje 0–7 z maski G
// wygładzenie łamanej (Chaikin, 3 razy): każdy narożnik zastąpiony punktami na 1/4 i 3/4 odcinków; końce zostają
export const wygladz = pkt => {
  for (let n = 0; n < 3 && pkt.length > 2; n++)
    pkt = [pkt[0], ...pkt.slice(0, -1).flatMap((p, i) => { const q = pkt[i + 1]; return [[p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]]; }).slice(1, -1), pkt.at(-1)];
  return pkt;
};
// trasa lądowa nie od linijki (użytkownik 2026-10-20): na środku każdego odcinka lekkie wygięcie w bok (do 15% długości, zawsze takie samo
// dla tych samych punktów — nie skacze przy odświeżaniu), potem wygładzenie
export const krzywa = pkt => wygladz(pkt.flatMap((q, i) => {
  if (!i) return [q];
  const [x0, y0] = pkt[i - 1], [x1, y1] = q, dl = Math.hypot(x1 - x0, y1 - y0); if (!dl) return [q];
  const w = (Math.sin(x0 * 12.9898 + y1 * 78.233 + x1 * 3.17) * 43758.5453 % 1) * 0.15 * dl;
  return [[(x0 + x1) / 2 - (y1 - y0) / dl * w, (y0 + y1) / 2 + (x1 - x0) / dl * w], q];
}));
export function utworzMape(kontener, { rysunek, rozmiar, teren, indeksy, ramki, kafle, granice, graniceMorskie, morzeOd = Infinity, ikony = {}, onKlik }) {   // morzeOd: pierwszy indeks akwenu (7.8a)
  const warstwa = document.createElement("div"); warstwa.className = "mapa-warstwa";
  const img = new Image(); img.src = rysunek; img.alt = "Mapa świata"; img.draggable = false; img.className = "mapa-obraz";
  const nak = document.createElement("canvas"); nak.className = "mapa-nakladka"; nak.setAttribute("aria-hidden", "true");
  const kol = document.createElement("canvas"); kol.className = "mapa-nakladka mapa-kolory"; kol.setAttribute("aria-hidden", "true");
  const blk = document.createElement("canvas"); blk.className = "mapa-nakladka mapa-bloki"; blk.setAttribute("aria-hidden", "true");   // 7.9d: poświata bloków
  const ostre = document.createElement("div"); ostre.className = "mapa-kafle";
  const ter = document.createElement("canvas"); ter.className = "mapa-teren"; ter.setAttribute("aria-hidden", "true");
  const fale = document.createElement("canvas"); fale.className = "mapa-fale"; fale.setAttribute("aria-hidden", "true");
  // ozdoby (7.6c): ramka pixel art wokół mapy, mgła przy krawędziach, róża wiatrów na morzu (lewy dolny róg)
  const ramka = document.createElement("div"); ramka.className = "mapa-ramka";
  const mgla = document.createElement("div"); mgla.className = "mapa-mgla";
  const roza = new Image(); roza.className = "mapa-roza"; roza.alt = ""; roza.draggable = false; if (ikony.roza) roza.src = ikony.roza;
  const herbyW = document.createElement("div"); herbyW.className = "mapa-herby"; herbyW.setAttribute("aria-hidden", "true");   // 7.6d: herby krajów graczy przy oddaleniu
  warstwa.append(img, ter, fale, mgla, ostre, kol, blk, herbyW, nak, ramka, ...(ikony.roza ? [roza] : []));
  let SZ = 0, WY = 0;   // rozmiar mapy w px mapa.png
  const plotnoGranic = document.createElement("canvas"); plotnoGranic.className = "mapa-granice"; plotnoGranic.setAttribute("aria-hidden", "true");
  const sciezka = new Path2D();
  const morskie = new Path2D();
  for (const [s, ll] of [[sciezka, granice], [morskie, graniceMorskie]]) for (const l of ll || []) { s.moveTo(l[0], l[1]); for (let k = 2; k < l.length; k += 2) s.lineTo(l[k], l[k + 1]); }
  const znaczniki = document.createElement("div"); znaczniki.className = "mapa-osady";   // nieskalowane: ikonki mają stały rozmiar na ekranie
  kontener.append(warstwa, plotnoGranic, znaczniki);
  const w = { s: 1, x: 0, y: 0 };
  let ramkaKafli = 0;
  // herby: pełne do przybliżenia 0.3, znikają do 0.5 (wtedy widać stolice i armie)
  const ustaw = () => { warstwa.style.transform = `translate(${w.x}px,${w.y}px) scale(${w.s})`; herbyW.style.opacity = Math.min(1, Math.max(0, (0.5 - w.s) / 0.2)); if (!ramkaKafli) ramkaKafli = requestAnimationFrame(() => { ramkaKafli = 0; odswiezKafle(); rysujGranice(); odswiezOsady(); }); };
  function rysujGranice() {   // w pikselach ekranu, więc kreska ma stałą grubość przy każdym przybliżeniu
    const d = devicePixelRatio || 1, cw = kontener.clientWidth, ch = kontener.clientHeight;
    if (plotnoGranic.width !== Math.round(cw * d) || plotnoGranic.height !== Math.round(ch * d)) { plotnoGranic.width = Math.round(cw * d); plotnoGranic.height = Math.round(ch * d); }
    const c = plotnoGranic.getContext("2d");
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, plotnoGranic.width, plotnoGranic.height);
    c.setTransform(d * w.s, 0, 0, d * w.s, d * w.x, d * w.y);
    const k = Math.min(1, 0.45 + w.s * 0.6);   // przy oddaleniu cieńsze i krótsze kreski, żeby mapa nie zrobiła się szara
    c.lineWidth = 1.4 * k / w.s; c.setLineDash([7 * k / w.s, 5 * k / w.s]); c.lineCap = "round";
    c.strokeStyle = "rgba(25, 20, 12, .8)"; c.stroke(sciezka);
    if (w.s >= 0.5) { c.setLineDash([3 / w.s, 6 / w.s]); c.lineWidth = 1.2 / w.s; c.strokeStyle = "rgba(225, 240, 255, .55)"; c.stroke(morskie); }   // akweny: jasne kropki na wodzie
    // trasy armii (7.1c): przebyta część ciągła i ciemna, dalsza przerywana w kolorze frakcji, przy celu napis „za N tur”
    c.lineCap = c.lineJoin = "round";
    for (const t of trasy) {
      const p = t.punkty; if (p.length < 2) continue;
      if (t.styl) {   // szlak / sojusz (7.5): jedna linia, bez napisu; kreska w px ekranu
        c.beginPath(); c.moveTo(...p[0]); for (let k = 1; k < p.length; k++) c.lineTo(...p[k]);
        c.setLineDash([]); c.lineWidth = 4.5 / w.s; c.strokeStyle = "rgba(20, 12, 4, .45)"; c.stroke();
        c.setLineDash({ lad: [8, 5], morze: [], sojusz: [2, 6] }[t.styl].map(v => v / w.s)); c.lineWidth = 2.5 / w.s; c.strokeStyle = t.kolor; c.stroke();
        continue;
      }
      c.globalAlpha = t.proponowana ? 0.55 : 1;   // propozycja gracza (7.14) — blada, dopóki GM nie zaakceptuje
      const linia = (od, doo) => { c.beginPath(); c.moveTo(...p[od]); for (let k = od + 1; k <= doo; k++) c.lineTo(...p[k]); c.stroke(); };
      const b = Math.min(t.przebyte || 0, p.length - 1);
      if (b > 0) { c.setLineDash([]); c.lineWidth = 3 / w.s; c.strokeStyle = "rgba(40, 25, 10, .85)"; linia(0, b); }
      if (b < p.length - 1) {
        c.setLineDash([]); c.lineWidth = 5 / w.s; c.strokeStyle = "rgba(20, 12, 4, .55)"; linia(b, p.length - 1);
        c.setLineDash([9 / w.s, 6 / w.s]); c.lineWidth = 3 / w.s; c.strokeStyle = t.kolor; linia(b, p.length - 1);
      }
      const [ex, ey] = p.at(-1); c.setLineDash([]);
      c.beginPath(); c.arc(ex, ey, 5 / w.s, 0, 7); c.fillStyle = t.kolor; c.fill(); c.lineWidth = 2 / w.s; c.strokeStyle = "rgba(20, 12, 4, .9)"; c.stroke();
      if (t.napis) {
        c.font = `600 ${13 / w.s}px Spectral, Georgia, serif`; c.lineWidth = 4 / w.s; c.strokeStyle = "rgba(243, 231, 198, .95)";
        c.strokeText(t.napis, ex + 8 / w.s, ey - 8 / w.s); c.fillStyle = "#2a1c08"; c.fillText(t.napis, ex + 8 / w.s, ey - 8 / w.s);
      }
      c.globalAlpha = 1;
    }
  }
  let trasy = [];   // [{punkty: [[x, y] px mapa.png], przebyte: ile odcinków już przebytych, kolor, napis, styl?: "lad" | "morze" | "sojusz"}]
  const ustawTrasy = l => { trasy = l; rysujGranice(); };
  // osady: [{x, y (px mapa.png), typ: "miasto" | "wioska" | "stolica" | "most" | "armia", nazwa?, tytul?, ikona?, klik?, dx? (px ekranu)}]; stolice od przybliżenia 0.3, miasta od 0.8, wioski od 1.2 (wcześniej zaśmiecały oddaloną mapę), podpisy (gdy jest nazwa) od 0.9 / 1.6
  let osady = []; const osadyWDom = new Map();
  function odswiezOsady() {
    const cw = kontener.clientWidth, ch = kontener.clientHeight, chce = new Set();
    osady.forEach((o, i) => {
      if (w.s < { stolica: 0.3, armia: 0.3, flota: 0.3, bitwa: 0.3, miasto: 0.8, most: 0.8, wioska: 1.2 }[o.typ]) return;
      const sx = w.x + o.x * w.s, sy = w.y + o.y * w.s; if (sx < -60 || sy < -30 || sx > cw + 60 || sy > ch + 30) return;
      chce.add(i);
      let el = osadyWDom.get(i);
      if (!el) { el = document.createElement("div"); el.className = "osada " + o.typ; el.title = o.tytul || o.nazwa || { miasto: "Miasto", wioska: "Wioska", stolica: "Stolica", most: "Most" }[o.typ]; const ik = o.ikona || ikony[o.typ]; el.innerHTML = ik ? `<img src="${ik}" alt="" draggable="false"><span></span>` : `<i></i><span></span>`; el._klik = o.klik; el.lastChild.textContent = o.nazwa || ""; znaczniki.append(el); osadyWDom.set(i, el); }
      el.style.transform = `translate(${sx + (o.dx || 0)}px,${sy}px)`;
      el.classList.toggle("podpis", Boolean(o.nazwa) && w.s >= (o.typ === "wioska" ? 1.6 : 0.9));
    });
    for (const [i, el] of osadyWDom) if (!chce.has(i)) { el.remove(); osadyWDom.delete(i); }
  }
  // herby: [{x, y (środek, px mapa.png), rozmiar (px mapa.png — skaluje się z mapą), url}]
  const ustawHerby = l => { herbyW.replaceChildren(...l.map(h => Object.assign(new Image(), { src: h.url, alt: "", draggable: false,
    style: `left:${h.x - h.rozmiar / 2}px;top:${h.y - h.rozmiar / 2}px;width:${h.rozmiar}px;height:${h.rozmiar}px` }))); };
  const ustawOsady = l => { osady = l; for (const el of osadyWDom.values()) el.remove(); osadyWDom.clear(); odswiezOsady(); };
  // kafle: poziom dobrany do przybliżenia (rysunek podstawowy ma 1/4 oryginału); w DOM tylko widoczne, reszta usuwana
  const istnieje = Object.fromEntries(Object.entries(kafle?.kafle || {}).map(([p, l]) => [p, new Set(l)])), wDom = new Map();
  function odswiezKafle() {
    if (!kafle || !SZ) return;
    const skala = w.s * devicePixelRatio, poziom = skala > 2.2 ? "1" : skala > 1.1 ? "2" : null, chce = new Set();
    if (poziom) {
      const k = kafle.rozmiar * SZ / kafle.poziomy[poziom];   // bok kafla w px rysunku podstawowego
      const x0 = Math.max(0, Math.floor(-w.x / w.s / k)), y0 = Math.max(0, Math.floor(-w.y / w.s / k));
      const x1 = Math.floor((kontener.clientWidth - w.x) / w.s / k), y1 = Math.floor((kontener.clientHeight - w.y) / w.s / k);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (istnieje[poziom].has(`${x}_${y}`)) {
        const klucz = `${poziom}/${x}_${y}`; chce.add(klucz);
        if (wDom.has(klucz)) continue;
        const el = new Image(); el.decoding = "async"; el.draggable = false; el.alt = ""; el.src = `mapa/kafle/${klucz}.png`;
        Object.assign(el.style, { left: x * k + "px", top: y * k + "px", width: k + "px", height: k + "px" });
        // nowy kafel pokazuje się dopiero po wczytaniu, żeby nie mrugała pusta plama
        el.style.visibility = "hidden"; el.onload = () => { el.style.visibility = ""; };
        ostre.append(el); wDom.set(klucz, el);
      }
    }
    for (const [klucz, el] of wDom) if (!chce.has(klucz)) { el.remove(); wDom.delete(klucz); }
  }
  const minS = () => Math.min(kontener.clientWidth / SZ, kontener.clientHeight / WY) * 0.9;
  // mapa nie ucieka poza ekran: zawsze zostaje widoczna co najmniej ćwiartka okna
  const ogranicz = () => {
    const sw = SZ * w.s, sh = WY * w.s, cw = kontener.clientWidth, ch = kontener.clientHeight;
    w.x = Math.min(cw * 0.75, Math.max(cw * 0.25 - sw, w.x)); w.y = Math.min(ch * 0.75, Math.max(ch * 0.25 - sh, w.y));
  };
  const dopasuj = () => {
    if (!SZ || !kontener.clientWidth) return;
    w.s = minS(); w.x = (kontener.clientWidth - SZ * w.s) / 2; w.y = (kontener.clientHeight - WY * w.s) / 2; ustaw();
  };
  const zoom = (k, cx, cy) => {
    const s = Math.min(4, Math.max(minS(), w.s * k));
    w.x = cx - (cx - w.x) * s / w.s; w.y = cy - (cy - w.y) * s / w.s; w.s = s; ogranicz(); ustaw();
  };
  img.onload = () => { [SZ, WY] = rozmiar || [img.naturalWidth, img.naturalHeight]; warstwa.style.width = SZ + "px"; warstwa.style.height = WY + "px"; dopasuj(); };
  let dopasowana = false;
  new ResizeObserver(() => { if (!dopasowana && SZ && kontener.clientWidth) { dopasowana = true; dopasuj(); } else { ogranicz(); ustaw(); } }).observe(kontener);

  // --- prowincje ---
  let ind = null, IW = 0, IH = 0, nctx = null;
  (async () => {
    const b = await createImageBitmap(await (await fetch(indeksy)).blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
    IW = b.width; IH = b.height; nak.width = kol.width = IW; nak.height = kol.height = IH;
    const c = new OffscreenCanvas(IW, IH), cx = c.getContext("2d", { willReadFrequently: true }); cx.drawImage(b, 0, 0);
    const d = cx.getImageData(0, 0, IW, IH).data; ind = new Uint16Array(IW * IH);
    for (let i = 0; i < ind.length; i++) ind[i] = d[i * 4] * 256 + d[i * 4 + 1];
    nctx = nak.getContext("2d"); rysujProwincje(pod, wybrana); rysujKolory(); rysujBloki();
    if (teren) await wczytajTeren();
  })().catch(e => console.error("mapa prowincji:", e));
  // --- tereny prowincji (7.6b) ---
  let mR = null, mG = null, tex = {}, typy = [], tctx = null;
  const piksele = async url => { const b = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
    const c = new OffscreenCanvas(b.width, b.height), x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(b, 0, 0); return x.getImageData(0, 0, b.width, b.height); };
  async function wczytajTeren() {
    const m = await piksele(teren.maska); mR = new Uint8Array(IW * IH); mG = new Uint8Array(IW * IH);
    const wodaPx = [];
    for (let i = 0; i < mR.length; i++) { mR[i] = m.data[i * 4]; mG[i] = m.data[i * 4 + 1] >> 5; if (m.data[i * 4 + 2] > 127 && (i & 63) === 0) wodaPx.push(i); }
    animujFale(wodaPx);
    for (const [t, url] of Object.entries(teren.tekstury)) tex[t] = new Uint32Array((await piksele(url)).data.buffer);
    ter.width = IW; ter.height = IH; tctx = ter.getContext("2d");
    rysujTeren(...typy.map((_, i) => i + 1));
  }
  // fale (7.6c): odblaski — krótkie jasne kreski na wodzie, które pojawiają się i gasną (kilka klatek na sekundę, stoją przy ukrytej karcie)
  function animujFale(wodaPx) {
    if (!wodaPx.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    fale.width = IW; fale.height = IH; const c = fale.getContext("2d");
    const N = 1400, odb = Array.from({ length: N }, () => ({ i: wodaPx[Math.random() * wodaPx.length | 0], f: Math.random() * 30 | 0, d: 2 + (Math.random() * 3 | 0) }));
    setInterval(() => {
      if (document.hidden) return;
      for (const o of odb) {
        const x = o.i % IW, y = o.i / IW | 0; c.clearRect(x - 1, y, o.d + 2, 1);
        if (++o.f >= 30) Object.assign(o, { f: 0, i: wodaPx[Math.random() * wodaPx.length | 0], d: 2 + (Math.random() * 3 | 0) });
        const a = Math.sin(o.f / 30 * Math.PI);
        if (a > 0.15) { c.fillStyle = `rgba(200, 230, 255, ${(a * 0.85).toFixed(2)})`; c.fillRect(o.i % IW, o.i / IW | 0, o.d, 1); }
      }
    }, 120);
  }
  // próbka tekstury 128² w wersji v (0–7: obrót, odbicie, przesunięcie) — odbicie 2x2 daje okres 256 bez szwów, jak w mapa_teren.py
  function probka(t, v, x, y) {
    let a = (y + v * 97) & 255, b = (x + v * 61) & 255;
    if (v >= 4) b = 255 - b;
    for (let k = v & 3; k; k--) { const c = a; a = b; b = 255 - c; }
    return t[(a < 128 ? a : 255 - a) * 128 + (b < 128 ? b : 255 - b)];
  }
  function rysujTeren(...ktore) {
    const r = ktore.filter(i => i && ramki[i - 1]).map(i => ramki[i - 1]);
    if (!tctx || !r.length) return;
    const x0 = Math.min(...r.map(q => q[0])), y0 = Math.min(...r.map(q => q[1])), x1 = Math.max(...r.map(q => q[2])), y1 = Math.max(...r.map(q => q[3]));
    const bw = x1 - x0, bh = y1 - y0, obraz = tctx.getImageData(x0, y0, bw, bh), u = new Uint32Array(obraz.data.buffer), zmien = new Set(ktore);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const gx = x + x0, gy = y + y0, i = gy * IW + gx, v = ind[i];
      if (!zmien.has(v)) continue;
      const t = tex[typy[v - 1]]; u[y * bw + x] = t && mR[i] ? probka(t, mG[i], gx, gy) : 0;
    }
    tctx.putImageData(obraz, x0, y0);
  }
  // typy[indeks-1] = "las" | "pustynia" | … | brak (równina — tekstura bazowa z teren.png); przerysowuje tylko zmienione prowincje
  const ustawTereny = l => { const zm = l.map((t, i) => t !== typy[i] ? i + 1 : 0).filter(Boolean); typy = l; rysujTeren(...zm); };
  const naIndeks = (cx, cy) => {   // punkt ekranu (względem kontenera) → indeks prowincji
    if (!ind) return 0;
    const x = Math.floor((cx - w.x) / w.s * IW / SZ), y = Math.floor((cy - w.y) / w.s * IH / WY);
    return x >= 0 && y >= 0 && x < IW && y < IH ? ind[y * IW + x] : 0;
  };
  // droga floty po wodzie (7.8d): A* po siatce co K px obrazu indeksów, po wodzie w okolicy (akweny trasy tanie, inne 4× droższe — poszarpane
  // akweny łączą się czasem tylko przez sąsiada), z dala od brzegu; potem
  // prostowanie (linia widzenia) i wygładzenie (Chaikin), żeby zakręty były łagodne. a, b w px mapa.png → [[x, y]] albo null (brak drogi / mapa niewczytana)
  const drogaWodna = (akweny, a, b) => {
    const r = akweny.map(i => ramki[i - 1]).filter(Boolean); if (!ind || !r.length) return null;
    const K = 4, s = IW / SZ, zb = new Set(akweny);
    const M = 20, gx0 = Math.max(0, Math.floor(Math.min(...r.map(q => q[0])) / K) - M), gy0 = Math.max(0, Math.floor(Math.min(...r.map(q => q[1])) / K) - M);
    const GW = Math.min(Math.ceil(IW / K), Math.ceil(Math.max(...r.map(q => q[2])) / K) + M) - gx0, GH = Math.min(Math.ceil(IH / K), Math.ceil(Math.max(...r.map(q => q[3])) / K) + M) - gy0, N = GW * GH;
    const d = new Uint8Array(N), trasa = new Uint8Array(N), kol = [];   // d: odległość od lądu w kratkach (0 = ląd), do 8; trasa: kratka w akwenie trasy
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const k = y * GW + x; let woda = false;   // woda, gdy którykolwiek piksel kratki jest akwenem (wąskie cieśniny)
      for (let py = (gy0 + y) * K; py < Math.min(IH, (gy0 + y + 1) * K); py++) for (let px = (gx0 + x) * K; px < Math.min(IW, (gx0 + x + 1) * K); px++) {
        const v = ind[py * IW + px]; if (v >= morzeOd) woda = true; if (zb.has(v)) trasa[k] = 1;
      }
      if (woda) d[k] = 255; else kol.push(k);
    }
    for (let n = 0; n < kol.length; n++) {
      const k = kol[n], x = k % GW, v = d[k] + 1; if (v > 8) continue;
      for (const j of [x > 0 && k - 1, x < GW - 1 && k + 1, k - GW, k + GW]) if (j !== false && j >= 0 && j < N && d[j] > v) { d[j] = v; kol.push(j); }
    }
    const kratka = ([X, Y]) => {   // punkt → najbliższa kratka wody akwenu trasy (środek akwenu może wypaść na wyspie)
      const cx = Math.round(X * s / K) - gx0, cy = Math.round(Y * s / K) - gy0;
      for (let R = 0; R < 40; R++) for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== R) continue;
        const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < GW && y < GH && d[y * GW + x] && trasa[y * GW + x]) return y * GW + x;
      }
      return -1;
    };
    const A = kratka(a), B = kratka(b); if (A < 0 || B < 0) return null;
    const g = new Float64Array(N).fill(Infinity), skad = new Int32Array(N).fill(-1), kopiec = [[0, A]]; g[A] = 0;
    const bx = B % GW, by = B / GW | 0, h = k => Math.hypot(k % GW - bx, (k / GW | 0) - by);
    const wloz = e => { kopiec.push(e); for (let i = kopiec.length - 1; i > 0;) { const p = (i - 1) >> 1; if (kopiec[p][0] <= kopiec[i][0]) break; [kopiec[p], kopiec[i]] = [kopiec[i], kopiec[p]]; i = p; } };
    const zdejmij = () => { const top = kopiec[0], l = kopiec.pop(); if (kopiec.length) { kopiec[0] = l;
      for (let i = 0; ;) { let m = i; const L = 2 * i + 1, P = L + 1; if (L < kopiec.length && kopiec[L][0] < kopiec[m][0]) m = L; if (P < kopiec.length && kopiec[P][0] < kopiec[m][0]) m = P; if (m === i) break; [kopiec[m], kopiec[i]] = [kopiec[i], kopiec[m]]; i = m; } } return top; };
    while (kopiec.length) {
      const [f, k] = zdejmij(); if (k === B) break; if (f > g[k] + h(k) + 1e-6) continue;
      const x = k % GW, y = k / GW | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, j = ny * GW + nx; if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= GW || ny >= GH || !d[j]) continue;
        if (dx && dy && !d[y * GW + nx] && !d[ny * GW + x]) continue;   // po skosie tylko, gdy obok jest woda (cieśniny po skosie)
        const c = g[k] + (dx && dy ? Math.SQRT2 : 1) * (1 + 4 / Math.min(d[j], 8)) * (trasa[j] ? 1 : 4);   // blisko brzegu i poza akwenami trasy drożej
        if (c < g[j]) { g[j] = c; skad[j] = k; wloz([c + h(j), j]); }
      }
    }
    if (skad[B] < 0 && A !== B) return null;
    const sciezka = []; for (let k = B; k !== -1; k = skad[k]) sciezka.unshift(k);
    const widac = (i, j) => {   // prosty odcinek bez zbliżania się do brzegu bardziej niż na końcach
      const p = sciezka[i], q = sciezka[j], x0 = p % GW, y0 = p / GW | 0, x1 = q % GW, y1 = q / GW | 0, min = Math.min(3, d[p], d[q]);
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let t = 1; t < n; t++) { const k = Math.round(y0 + (y1 - y0) * t / n) * GW + Math.round(x0 + (x1 - x0) * t / n); if (d[k] < min) return false; }
      return true;
    };
    let pkt = [sciezka[0]];
    for (let i = 0; i < sciezka.length - 1;) { let j = sciezka.length - 1; while (j > i + 1 && !widac(i, j)) j--; pkt.push(sciezka[j]); i = j; }
    pkt = pkt.map(k => [((k % GW + gx0) * K + K / 2) / s, (((k / GW | 0) + gy0) * K + K / 2) / s]);
    pkt[0] = a; pkt[pkt.length - 1] = b;
    return wygladz(pkt);
  };
  // prowincje w promieniu r wokół punktu (x, y, r w px mapa.png) → Map(indeks → najmniejsza odległość w px obrazu indeksów); do mostów na rzekach
  const wokol = (x, y, r) => {
    const m = new Map(); if (!ind) return m;
    const k = IW / SZ, cx = x * k, cy = y * k, R = r * k;
    for (let yy = Math.max(0, Math.floor(cy - R)); yy <= Math.min(IH - 1, cy + R); yy++)
      for (let xx = Math.max(0, Math.floor(cx - R)); xx <= Math.min(IW - 1, cx + R); xx++) {
        const v = ind[yy * IW + xx], d = Math.hypot(xx - cx, yy - cy);
        if (v && d <= R && !(m.get(v) <= d)) m.set(v, d);
      }
    return m;
  };
  let pod = 0, wybrana = 0;
  const KOLOR_POD = [200, 150, 70, 70], KOLOR_WYBR = [190, 120, 30, 90], KRAWEDZ = [90, 40, 0, 255];   // mnożone z teksturami — lekko, żeby teren był widać
  const MORZE_POD = [255, 220, 120, 70], MORZE_WYBR = [255, 205, 90, 120], MORZE_KRAW = [255, 190, 40, 255];   // akweny: złoto (warstwa mnoży — jasne by zniknęło, brąz ginie na granacie)
  // przerysowanie tylko w ramce zmienionych prowincji (cały obraz ma ponad 6 mln pikseli)
  function rysujProwincje(...ktore) {
    const r = ktore.filter(Boolean).map(i => ramki[i - 1]);
    if (!nctx || !r.length) return;
    const x0 = Math.min(...r.map(q => q[0])), y0 = Math.min(...r.map(q => q[1])), x1 = Math.max(...r.map(q => q[2])), y1 = Math.max(...r.map(q => q[3]));
    const bw = x1 - x0, bh = y1 - y0, obraz = nctx.createImageData(bw, bh), o = obraz.data;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const gx = x + x0, gy = y + y0, i = gy * IW + gx, v = ind[i];
      if (!v || (v !== pod && v !== wybrana)) continue;
      const brzeg = v === wybrana && (gx === 0 || gy === 0 || gx === IW - 1 || gy === IH - 1 || ind[i - 1] !== v || ind[i + 1] !== v || ind[i - IW] !== v || ind[i + IW] !== v);
      const m = v >= morzeOd, k = brzeg ? (m ? MORZE_KRAW : KRAWEDZ) : v === wybrana ? (m ? MORZE_WYBR : KOLOR_WYBR) : (m ? MORZE_POD : KOLOR_POD), j = (y * bw + x) * 4;
      o[j] = k[0]; o[j + 1] = k[1]; o[j + 2] = k[2]; o[j + 3] = k[3];
    }
    nctx.putImageData(obraz, x0, y0);
  }
  // kolory właścicieli: kolory[indeks-1] = [r, g, b] albo brak (ziemia niczyja)
  let kolory = [];
  // kolor kraju (7.6c): półprzezroczyste wypełnienie + wyraźny pas 3 px wzdłuż granicy państwa (tam, gdzie obok jest inny kraj, ziemia niczyja albo woda)
  function rysujKolory() {
    if (!ind) return;
    const c = kol.getContext("2d"), obraz = c.createImageData(IW, IH), u = new Uint32Array(obraz.data.buffer);
    const kraj = new Uint32Array(kolory.length + 1); kolory.forEach((k, i) => { if (k) kraj[i + 1] = k[2] << 16 | k[1] << 8 | k[0] | 1 << 24; });   // 1<<24 = „ma właściciela”
    const ws = new Uint32Array(ind.length); for (let i = 0; i < ind.length; i++) ws[i] = kraj[ind[i]];
    const PAS = 3, WYP = 95 << 24 >>> 0, BRZ = 235 << 24 >>> 0;
    for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
      const i = y * IW + x, k = ws[i]; if (!k) continue;
      let brzeg = false;
      for (let d = 1; d <= PAS && !brzeg; d++) brzeg = x < d || y < d || x >= IW - d || y >= IH - d || ws[i - d] !== k || ws[i + d] !== k || ws[i - d * IW] !== k || ws[i + d * IW] !== k;
      u[i] = (k & 0xffffff) | (brzeg ? BRZ : WYP);
    }
    c.putImageData(obraz, 0, 0);
  }
  const ustawKolory = k => { kolory = k; rysujKolory(); };
  // bloki (7.9d): bloki = [{ kolor: [r, g, b], indeksy: [indeks prowincji] }] — poświata na zewnątrz granic ziem członków (do R px obrazu indeksów,
  // słabnie z odległością) i wyraźna linia LINIA px wzdłuż granicy od środka; liczone tylko w ramce prowincji członków; przy nakładaniu wygrywa mocniejsza
  let bloki = [];
  function rysujBloki() {   // canvas tylko na ramkę wszystkich bloków (pełny 2500² spowalniał składanie warstw przy animacji fal)
    if (!ind) return;
    const R = 26, LINIA = 3, ramy = bloki.map(({ indeksy }) => indeksy.map(i => ramki[i - 1]).filter(Boolean)).filter(r => r.length);
    if (!ramy.length) { blk.width = blk.height = 0; blk.hidden = true; return; }
    const wsz = ramy.flat(), X0 = Math.max(0, Math.min(...wsz.map(q => q[0])) - R), Y0 = Math.max(0, Math.min(...wsz.map(q => q[1])) - R);
    const X1 = Math.min(IW - 1, Math.max(...wsz.map(q => q[2])) + R), Y1 = Math.min(IH - 1, Math.max(...wsz.map(q => q[3])) + R), CW = X1 - X0 + 1, CH = Y1 - Y0 + 1;
    blk.hidden = false; blk.width = CW; blk.height = CH;
    Object.assign(blk.style, { left: X0 / IW * 100 + "%", top: Y0 / IH * 100 + "%", width: CW / IW * 100 + "%", height: CH / IH * 100 + "%" });
    const c = blk.getContext("2d"), obraz = c.createImageData(CW, CH), u = new Uint32Array(obraz.data.buffer);
    bloki.forEach(({ kolor: [r, g, b], indeksy }, nr) => {
      const rr = indeksy.map(i => ramki[i - 1]).filter(Boolean); if (!rr.length) return;
      const moje = new Set(indeksy), x0 = Math.max(0, Math.min(...rr.map(q => q[0])) - R), y0 = Math.max(0, Math.min(...rr.map(q => q[1])) - R);
      const x1 = Math.min(IW - 1, Math.max(...rr.map(q => q[2])) + R), y1 = Math.min(IH - 1, Math.max(...rr.map(q => q[3])) + R), W = x1 - x0 + 1, H = y1 - y0 + 1;
      const d = new Uint8Array(W * H).fill(255), kol = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (moje.has(ind[(y0 + y) * IW + x0 + x])) d[y * W + x] = 0;
      for (let k = 0; k < d.length; k++) if (d[k] === 0) { const x = k % W; if ((x > 0 && d[k - 1] === 255) || (x < W - 1 && d[k + 1] === 255) || (k >= W && d[k - W] === 255) || (k + W < d.length && d[k + W] === 255)) kol.push(k); }
      const wew = new Uint8Array(d.length), kw = [...kol]; kw.forEach(k => { wew[k] = 1; });   // linia: LINIA px do środka od granicy
      for (let n = 0; n < kw.length; n++) { const k = kw[n], x = k % W, v = wew[k] + 1; if (v > LINIA) continue;
        for (const j of [x > 0 && k - 1, x < W - 1 && k + 1, k - W, k + W]) if (j !== false && j >= 0 && j < d.length && d[j] === 0 && !wew[j]) { wew[j] = v; kw.push(j); } }
      for (let n = 0; n < kol.length; n++) {   // odległość od granicy na zewnątrz (BFS po pikselach spoza bloku)
        const k = kol[n], x = k % W, v = d[k] + 1; if (v > R) continue;
        for (const j of [x > 0 && k - 1, x < W - 1 && k + 1, k - W, k + W]) if (j !== false && j >= 0 && j < d.length && d[j] === 255) { d[j] = v; kol.push(j); }
      }
      for (let k = 0; k < d.length; k++) {
        const a = wew[k] ? 235 : d[k] > 0 && d[k] <= R ? Math.round(200 * (1 - d[k] / R) ** 1.3) : 0; if (!a) continue;
        const i = (y0 - Y0 + Math.floor(k / W)) * CW + x0 - X0 + k % W; if (a > u[i] >>> 24) u[i] = (a << 24 | b << 16 | g << 8 | r) >>> 0;
      }
    });
    c.putImageData(obraz, 0, 0);
  }
  const ustawBloki = l => { bloki = l; rysujBloki(); };
  const ustawPod = i => { if (i === pod) return; const stara = pod; pod = i; rysujProwincje(stara, i); kontener.classList.toggle("nad-prowincja", Boolean(i)); };
  const wybierz = i => { if (i === wybrana) return; const stara = wybrana; wybrana = i; rysujProwincje(stara, i); };

  kontener.addEventListener("wheel", e => {
    e.preventDefault(); const r = kontener.getBoundingClientRect();
    zoom(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  let chwyt = null, szczyp = null;
  const palce = new Map();   // dotyk (telefon, 7.7b): aktywne palce; dwa palce = przybliżanie i przesuwanie, bez kliknięcia po puszczeniu
  const srodek = () => { const [a, b] = [...palce.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  // bez preventDefault przeglądarka zaczyna zaznaczanie / przeciąganie obrazka (kursor „kopiuj”) zamiast przesuwania
  kontener.addEventListener("dragstart", e => e.preventDefault());
  kontener.addEventListener("pointerdown", e => { if (e.button !== 0) return; e.preventDefault(); kontener.focus({ preventScroll: true }); kontener.setPointerCapture(e.pointerId); chwyt = { x: e.clientX, y: e.clientY, wx: w.x, wy: w.y, ruch: 0 }; kontener.classList.add("ciagnie");
    if (e.pointerType === "touch") { palce.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (palce.size === 2) { szczyp = srodek(); chwyt = null; } }
  });
  kontener.addEventListener("pointermove", e => {
    if (palce.has(e.pointerId)) {
      palce.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (szczyp && palce.size === 2) {
        const t = srodek(), r = kontener.getBoundingClientRect();
        w.x += t.x - szczyp.x; w.y += t.y - szczyp.y; zoom(t.d / szczyp.d, t.x - r.left, t.y - r.top); szczyp = t; return;
      }
      if (szczyp) return;   // po szczypaniu jeden palec zostaje — bez skoku mapy
    }
    if (!chwyt) { if (e.pointerType === "mouse") { const r = kontener.getBoundingClientRect(); ustawPod(naIndeks(e.clientX - r.left, e.clientY - r.top)); } return; }
    chwyt.ruch = Math.max(chwyt.ruch, Math.hypot(e.clientX - chwyt.x, e.clientY - chwyt.y));
    w.x = chwyt.wx + e.clientX - chwyt.x; w.y = chwyt.wy + e.clientY - chwyt.y; ogranicz(); ustaw();
  });
  kontener.addEventListener("pointerleave", () => { if (!chwyt) ustawPod(0); });
  kontener.addEventListener("pointerup", e => {
    if (chwyt && chwyt.ruch < 5) {
      const znak = document.elementsFromPoint(e.clientX, e.clientY).map(x => x.closest?.(".osada")).find(x => x?._klik);   // klikalne znaczniki (armie) mają pierwszeństwo przed prowincją
      if (znak) znak._klik();
      else { const r = kontener.getBoundingClientRect(); const cx = e.clientX - r.left, cy = e.clientY - r.top; onKlik?.(naIndeks(cx, cy), (cx - w.x) / w.s, (cy - w.y) / w.s); }
    }
    chwyt = null; kontener.classList.remove("ciagnie");
    palce.delete(e.pointerId); if (!palce.size) szczyp = null;
  });
  kontener.addEventListener("pointercancel", e => { chwyt = null; kontener.classList.remove("ciagnie"); palce.delete(e.pointerId); if (!palce.size) szczyp = null; });
  // klawiatura: mapa jest w kolejności Tab; strzałki przesuwają, +/- przybliża, 0 dopasowuje
  kontener.tabIndex = 0;
  kontener.addEventListener("keydown", e => {
    const krok = 80, cx = kontener.clientWidth / 2, cy = kontener.clientHeight / 2;
    const ruch = { ArrowLeft: [krok, 0], ArrowRight: [-krok, 0], ArrowUp: [0, krok], ArrowDown: [0, -krok] }[e.key];
    if (ruch) { w.x += ruch[0]; w.y += ruch[1]; ogranicz(); ustaw(); }
    else if (e.key === "+" || e.key === "=") zoom(1.25, cx, cy);
    else if (e.key === "-") zoom(0.8, cx, cy);
    else if (e.key === "0") dopasuj();
    else return;
    e.preventDefault();
  });
  // środek widoku na punkcie rysunku (px mapa.png); przybliża co najmniej do s
  const pokaz = (x, y, s = 0) => { w.s = Math.min(4, Math.max(w.s, s)); w.x = kontener.clientWidth / 2 - x * w.s; w.y = kontener.clientHeight / 2 - y * w.s; ogranicz(); ustaw(); };
  // jeśli punkt rysunku jest poza widokiem (np. zasłoniła go wysunięta szuflada), przesuń go na środek
  const doWidoku = (x, y) => { const sx = w.x + x * w.s, sy = w.y + y * w.s, m = 40;
    if (sx < m || sy < m || sx > kontener.clientWidth - m || sy > kontener.clientHeight - m) pokaz(x, y); };
  const kursor = k => kontener.classList.toggle("stawianie", Boolean(k));   // tryb stawiania osady: kursor celownika
  // samouczek (8.1): mapa na cały widok wokół punktu (bez pustych pasów) i ruch przekazywany spod warstwy samouczka
  const wypelnij = (x = SZ / 2, y = WY / 2) => pokaz(x, y, Math.max(kontener.clientWidth / SZ, kontener.clientHeight / WY));
  const przesun = (dx, dy) => { w.x += dx; w.y += dy; ogranicz(); ustaw(); };
  const przybliz = (k, kx, ky) => { const r = kontener.getBoundingClientRect(); zoom(k, kx - r.left, ky - r.top); };
  return { dopasuj, wybierz, pokaz, doWidoku, wypelnij, przesun, przybliz, ustawKolory, ustawBloki, ustawOsady, ustawTrasy, ustawTereny, ustawHerby, kursor, wokol, drogaWodna };
}
