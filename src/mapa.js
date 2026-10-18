// Mapa pod paskiem: rysunek z przesuwaniem (przeciąganie) i przybliżaniem (kółko, +/-) oraz prowincje:
// podświetlenie pod kursorem, zaznaczenie wybranej. Prowincje: obraz z indeksem w kolorze (R*256+G, 0 = woda) w skali 1/2 rysunku.
// onKlik(indeks) — klik bez przeciągania; indeks prowincji (1…) albo 0 (woda / poza mapą). ramki[indeks-1] = [x0, y0, x1, y1] w px obrazu indeksów.
// kafle: { rozmiar, poziomy: {poziom: szerokość w px}, kafle: {poziom: ["x_y"]} }, pliki w `mapa/kafle/<poziom>/<x>_<y>.png` — ostrość przy przybliżeniu.
export function utworzMape(kontener, { rysunek, indeksy, ramki, kafle, onKlik }) {
  const warstwa = document.createElement("div"); warstwa.className = "mapa-warstwa";
  const img = new Image(); img.src = rysunek; img.alt = "Mapa świata"; img.draggable = false; img.className = "mapa-obraz";
  const nak = document.createElement("canvas"); nak.className = "mapa-nakladka"; nak.setAttribute("aria-hidden", "true");
  const kol = document.createElement("canvas"); kol.className = "mapa-nakladka mapa-kolory"; kol.setAttribute("aria-hidden", "true");
  const ostre = document.createElement("div"); ostre.className = "mapa-kafle";
  warstwa.append(img, ostre, kol, nak); kontener.append(warstwa);
  const w = { s: 1, x: 0, y: 0 };
  let ramkaKafli = 0;
  const ustaw = () => { warstwa.style.transform = `translate(${w.x}px,${w.y}px) scale(${w.s})`; if (!ramkaKafli) ramkaKafli = requestAnimationFrame(() => { ramkaKafli = 0; odswiezKafle(); }); };
  // kafle: poziom dobrany do przybliżenia (rysunek podstawowy ma 1/4 oryginału); w DOM tylko widoczne, reszta usuwana
  const istnieje = Object.fromEntries(Object.entries(kafle?.kafle || {}).map(([p, l]) => [p, new Set(l)])), wDom = new Map();
  function odswiezKafle() {
    if (!kafle || !img.naturalWidth) return;
    const skala = w.s * devicePixelRatio, poziom = skala > 2.2 ? "1" : skala > 1.1 ? "2" : null, chce = new Set();
    if (poziom) {
      const k = kafle.rozmiar * img.naturalWidth / kafle.poziomy[poziom];   // bok kafla w px rysunku podstawowego
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
  const minS = () => Math.min(kontener.clientWidth / img.naturalWidth, kontener.clientHeight / img.naturalHeight) * 0.9;
  // mapa nie ucieka poza ekran: zawsze zostaje widoczna co najmniej ćwiartka okna
  const ogranicz = () => {
    const sw = img.naturalWidth * w.s, sh = img.naturalHeight * w.s, cw = kontener.clientWidth, ch = kontener.clientHeight;
    w.x = Math.min(cw * 0.75, Math.max(cw * 0.25 - sw, w.x)); w.y = Math.min(ch * 0.75, Math.max(ch * 0.25 - sh, w.y));
  };
  const dopasuj = () => {
    if (!img.naturalWidth || !kontener.clientWidth) return;
    w.s = minS(); w.x = (kontener.clientWidth - img.naturalWidth * w.s) / 2; w.y = (kontener.clientHeight - img.naturalHeight * w.s) / 2; ustaw();
  };
  const zoom = (k, cx, cy) => {
    const s = Math.min(4, Math.max(minS(), w.s * k));
    w.x = cx - (cx - w.x) * s / w.s; w.y = cy - (cy - w.y) * s / w.s; w.s = s; ogranicz(); ustaw();
  };
  img.onload = () => { warstwa.style.width = img.naturalWidth + "px"; warstwa.style.height = img.naturalHeight + "px"; dopasuj(); };
  let dopasowana = false;
  new ResizeObserver(() => { if (!dopasowana && img.naturalWidth && kontener.clientWidth) { dopasowana = true; dopasuj(); } else { ogranicz(); ustaw(); } }).observe(kontener);

  // --- prowincje ---
  let ind = null, IW = 0, IH = 0, nctx = null;
  (async () => {
    const b = await createImageBitmap(await (await fetch(indeksy)).blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
    IW = b.width; IH = b.height; nak.width = kol.width = IW; nak.height = kol.height = IH;
    const c = new OffscreenCanvas(IW, IH), cx = c.getContext("2d", { willReadFrequently: true }); cx.drawImage(b, 0, 0);
    const d = cx.getImageData(0, 0, IW, IH).data; ind = new Uint16Array(IW * IH);
    for (let i = 0; i < ind.length; i++) ind[i] = d[i * 4] * 256 + d[i * 4 + 1];
    nctx = nak.getContext("2d"); rysujProwincje(pod, wybrana); rysujKolory();
  })().catch(e => console.error("mapa prowincji:", e));
  const naIndeks = (cx, cy) => {   // punkt ekranu (względem kontenera) → indeks prowincji
    if (!ind) return 0;
    const x = Math.floor((cx - w.x) / w.s * IW / img.naturalWidth), y = Math.floor((cy - w.y) / w.s * IH / img.naturalHeight);
    return x >= 0 && y >= 0 && x < IW && y < IH ? ind[y * IW + x] : 0;
  };
  let pod = 0, wybrana = 0;
  const KOLOR_POD = [200, 150, 70, 110], KOLOR_WYBR = [190, 120, 30, 170], KRAWEDZ = [90, 40, 0, 255];   // mnożone z pergaminem, więc ciemniejsze niż wyglądają
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
      const k = brzeg ? KRAWEDZ : v === wybrana ? KOLOR_WYBR : KOLOR_POD, j = (y * bw + x) * 4;
      o[j] = k[0]; o[j + 1] = k[1]; o[j + 2] = k[2]; o[j + 3] = k[3];
    }
    nctx.putImageData(obraz, x0, y0);
  }
  // kolory właścicieli: kolory[indeks-1] = [r, g, b] albo brak (ziemia niczyja)
  let kolory = [];
  function rysujKolory() {
    if (!ind) return;
    const c = kol.getContext("2d"), obraz = c.createImageData(IW, IH), u = new Uint32Array(obraz.data.buffer), A = 150 << 24;
    const lut = new Uint32Array(kolory.length + 1); kolory.forEach((k, i) => { if (k) lut[i + 1] = A | k[2] << 16 | k[1] << 8 | k[0]; });
    for (let i = 0; i < ind.length; i++) u[i] = lut[ind[i]];
    c.putImageData(obraz, 0, 0);
  }
  const ustawKolory = k => { kolory = k; rysujKolory(); };
  const ustawPod = i => { if (i === pod) return; const stara = pod; pod = i; rysujProwincje(stara, i); kontener.classList.toggle("nad-prowincja", Boolean(i)); };
  const wybierz = i => { if (i === wybrana) return; const stara = wybrana; wybrana = i; rysujProwincje(stara, i); };

  kontener.addEventListener("wheel", e => {
    e.preventDefault(); const r = kontener.getBoundingClientRect();
    zoom(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  let chwyt = null;
  // bez preventDefault przeglądarka zaczyna zaznaczanie / przeciąganie obrazka (kursor „kopiuj”) zamiast przesuwania
  kontener.addEventListener("dragstart", e => e.preventDefault());
  kontener.addEventListener("pointerdown", e => { if (e.button !== 0) return; e.preventDefault(); kontener.focus({ preventScroll: true }); kontener.setPointerCapture(e.pointerId); chwyt = { x: e.clientX, y: e.clientY, wx: w.x, wy: w.y, ruch: 0 }; kontener.classList.add("ciagnie"); });
  kontener.addEventListener("pointermove", e => {
    if (!chwyt) { if (e.pointerType === "mouse") { const r = kontener.getBoundingClientRect(); ustawPod(naIndeks(e.clientX - r.left, e.clientY - r.top)); } return; }
    chwyt.ruch = Math.max(chwyt.ruch, Math.hypot(e.clientX - chwyt.x, e.clientY - chwyt.y));
    w.x = chwyt.wx + e.clientX - chwyt.x; w.y = chwyt.wy + e.clientY - chwyt.y; ogranicz(); ustaw();
  });
  kontener.addEventListener("pointerleave", () => { if (!chwyt) ustawPod(0); });
  kontener.addEventListener("pointerup", e => {
    if (chwyt && chwyt.ruch < 5) { const r = kontener.getBoundingClientRect(); onKlik?.(naIndeks(e.clientX - r.left, e.clientY - r.top)); }
    chwyt = null; kontener.classList.remove("ciagnie");
  });
  kontener.addEventListener("pointercancel", () => { chwyt = null; kontener.classList.remove("ciagnie"); });
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
  return { dopasuj, wybierz, pokaz, doWidoku, ustawKolory };
}
