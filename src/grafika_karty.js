// karta frakcji jako obrazek (12): wizytówka 1200×675 do wklejenia na Discorda. Dane przygotowuje main.js (tylko to, co wolno pokazać),
// tu samo rysowanie: ciemne tło w barwie frakcji, ramka z panel.png (9-slice ×2), pixel art powiększany bez wygładzania.
import ramkaUrl from "../assets/ramki/panel.png";
import ramkaPortretuUrl from "../assets/ramki/portret.png";

export const SZER = 1200, WYS = 675;
const ZLOTO = "#d9b25a", TEKST = "#efe3c8", PRZYGASZONY = "#bfae86", TLO = "#0e0f17";
const wczytaj = url => new Promise(ok => { if (!url) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = url; });

// 9-slice: rogi `k` px obrazka rysowane jako `k*s` px
function ramka(g, img, k, s, x, y, w, h) {
  const n = img.width, b = k * s, src = [0, k, n - k, n], dst = [[x, x + b, x + w - b, x + w], [y, y + b, y + h - b, y + h]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) continue;   // środek zostaje tłem
    g.drawImage(img, src[i], src[j], src[i + 1] - src[i], src[j + 1] - src[j], dst[0][i], dst[1][j], dst[0][i + 1] - dst[0][i], dst[1][j + 1] - dst[1][j]);
  }
}
// tekst zawijany do szerokości; zwraca y pod ostatnią linią (najwyżej `maks` linii, reszta „…”)
function akapit(g, tekst, x, y, szer, wiersz, maks = 3) {
  const slowa = tekst.split(/\s+/), linie = [];
  for (const s of slowa) { const l = linie.at(-1); if (l !== undefined && g.measureText(`${l} ${s}`).width <= szer) linie[linie.length - 1] = `${l} ${s}`; else linie.push(s); }
  if (linie.length > maks) { linie.length = maks; linie[maks - 1] += " …"; }
  linie.forEach((l, i) => g.fillText(l, x, y + i * wiersz));
  return y + linie.length * wiersz;
}
const inicjaly = imie => imie.replace(/[„”"]/g, "").split(/\s+/).filter(s => /^\p{Lu}/u.test(s)).slice(0, 2).map(s => s[0]).join("") || imie[0];
// portret w ramce portret.png; bez pliku — inicjały na tle w kolorze frakcji (jak w programie)
function portret(g, img, imie, kolor, x, y, bok, ramkaP) {
  const tlo = g.createRadialGradient(x + bok * .35, y + bok * .3, 2, x + bok / 2, y + bok / 2, bok * .75);
  tlo.addColorStop(0, kolor); tlo.addColorStop(1, "#05050a");
  g.fillStyle = tlo; g.fillRect(x, y, bok, bok);
  const r = bok >= 200 ? 16 : 8;
  if (img) g.drawImage(img, x + r, y + r, bok - 2 * r, bok - 2 * r);
  else { g.fillStyle = "#f6e7bf"; g.font = `900 ${bok / 3.2}px Cinzel, Georgia, serif`; g.textAlign = "center"; g.fillText(inicjaly(imie), x + bok / 2, y + bok / 2 + bok / 9); g.textAlign = "left"; }
  if (ramkaP) ramka(g, ramkaP, 8, r / 8, x, y, bok, bok);
}

// dane: { nazwa, podtytul, motto, kolor, herb (url), wladca: {imie, tytul, portret (url)} | null, bohaterowie: [{imie, portret}],
//   liczby: [[etykieta, wartość]], wojny: [nazwa], sojusze: [nazwa], zasoby: [{nazwa, ikona (url), wartosc, jednostka}] | null, tura }
export async function rysujKarte(d) {
  await Promise.all(["900 52px Cinzel", "700 20px Cinzel", "400 20px Spectral", "italic 400 20px Spectral", "600 20px Spectral"].map(f => document.fonts.load(f).catch(() => {})));
  const [rP, rPor, herb, portW, ...portB] = await Promise.all([ramkaUrl, ramkaPortretuUrl, d.herb, d.wladca?.portret, ...d.bohaterowie.map(h => h.portret)].map(wczytaj));
  const ikony = await Promise.all((d.zasoby || []).map(z => wczytaj(z.ikona)));
  const c = Object.assign(document.createElement("canvas"), { width: SZER, height: WYS }), g = c.getContext("2d");
  g.imageSmoothingEnabled = false;

  // tło: ciemne, z poświatą koloru frakcji od lewej (za władcą)
  g.fillStyle = TLO; g.fillRect(0, 0, SZER, WYS);
  const p = g.createRadialGradient(230, 300, 20, 230, 300, 700);
  p.addColorStop(0, d.kolor + "66"); p.addColorStop(1, d.kolor + "00");
  g.fillStyle = p; g.fillRect(0, 0, SZER, WYS);
  if (rP) ramka(g, rP, 12, 2, 0, 0, SZER, WYS);
  g.fillStyle = d.kolor; g.fillRect(24, 24, SZER - 48, 4);

  // lewa kolumna: władca
  const lx = 64, ly = 70, bok = 288;
  portret(g, portW, d.wladca?.imie || d.nazwa, d.kolor, lx, ly, bok, rPor);
  g.textBaseline = "alphabetic";
  if (d.wladca) {
    g.fillStyle = ZLOTO; g.font = "700 24px Cinzel, Georgia, serif";
    const y = akapit(g, d.wladca.imie, lx, ly + bok + 40, bok, 28, 2);
    g.fillStyle = PRZYGASZONY; g.font = "400 18px Spectral, Georgia, serif";
    akapit(g, d.wladca.tytul ? `Władca · ${d.wladca.tytul}` : "Władca", lx, y + 2, bok, 22, 2);
  }

  // prawa część: herb, nazwa, podtytuł, motto
  const px = 400, pw = SZER - px - 60;
  let y = 70;
  if (herb) g.drawImage(herb, px, y, 128, 128);
  const tx = herb ? px + 150 : px, tw = pw - (tx - px);
  g.fillStyle = ZLOTO; g.font = "900 52px Cinzel, Georgia, serif";
  while (g.measureText(d.nazwa).width > tw && parseInt(g.font) > 30) g.font = `900 ${parseInt(g.font) - 2}px Cinzel, Georgia, serif`;
  g.fillText(d.nazwa, tx, y + 58);
  if (d.podtytul) { g.fillStyle = PRZYGASZONY; g.font = "400 22px Spectral, Georgia, serif"; g.fillText(d.podtytul, tx, y + 92); }
  y += 150;
  if (d.motto) {
    g.fillStyle = d.kolor; g.fillRect(px, y - 4, 3, 30);
    g.fillStyle = TEKST; g.font = "italic 400 22px Spectral, Georgia, serif";
    y = akapit(g, `„${d.motto}”`, px + 16, y + 18, pw - 16, 28, 2) + 12;
  }

  // liczby w polach
  y += 6;
  const kol = d.liczby.length, odst = 12, pole = (pw - odst * (kol - 1)) / kol;
  d.liczby.forEach(([etykieta, w], i) => {
    const x = px + i * (pole + odst);
    g.fillStyle = "rgba(5,5,10,.65)"; g.fillRect(x, y, pole, 74);
    g.strokeStyle = "#8a6a2a"; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, pole - 1, 73);
    g.fillStyle = ZLOTO; g.font = "700 30px Cinzel, Georgia, serif"; g.textAlign = "center"; g.fillText(String(w), x + pole / 2, y + 38);
    g.fillStyle = PRZYGASZONY; g.font = "400 16px Spectral, Georgia, serif"; g.fillText(etykieta, x + pole / 2, y + 62); g.textAlign = "left";
  });
  y += 104;

  // wojny i sojusze
  g.font = "400 19px Spectral, Georgia, serif";
  for (const [znak, nazwa, lista, kolor] of [["⚔", "W wojnie z", d.wojny, "#e0806a"], ["🤝", "Sojusznicy", d.sojusze, "#9fc98a"]]) {
    if (!lista.length) continue;
    g.fillStyle = kolor; g.font = "600 19px Spectral, Georgia, serif"; g.fillText(`${znak} ${nazwa}:`, px, y);
    const off = g.measureText(`${znak} ${nazwa}: `).width;
    g.fillStyle = TEKST; g.font = "400 19px Spectral, Georgia, serif";
    y = akapit(g, lista.join(", "), px + off, y, pw - off, 24, 2) + 8;
  }

  // zasoby (tylko gdy main.js je przekazał) — rząd ikon z liczbami
  if (d.zasoby?.length) {
    y += 4; let x = px;
    g.font = "600 18px Spectral, Georgia, serif";
    d.zasoby.forEach((z, i) => {
      const t = `${z.wartosc ?? "—"}${z.jednostka ? ` ${z.jednostka}` : ""}`, w = 32 + 6 + g.measureText(t).width + 22;
      if (x + w > px + pw) { x = px; y += 40; }
      if (y > WYS - 190) return;   // nie wchodzi na bohaterów
      if (ikony[i]) g.drawImage(ikony[i], x, y - 24, 32, 32);
      else { g.fillStyle = "#2a2418"; g.fillRect(x, y - 24, 32, 32); g.fillStyle = ZLOTO; g.textAlign = "center"; g.fillText(z.nazwa[0] || "?", x + 16, y - 2); g.textAlign = "left"; }
      g.fillStyle = TEKST; g.fillText(t, x + 38, y);
      x += w;
    });
    y += 30;
  }

  // dół: miniatury bohaterów (bez władcy)
  const mb = 96, my = WYS - 24 - 26 - mb, ile = 7;
  if (d.bohaterowie.length) { g.fillStyle = PRZYGASZONY; g.font = "700 16px Cinzel, Georgia, serif"; g.fillText("BOHATEROWIE", px, my - 12); }
  d.bohaterowie.slice(0, ile).forEach((h, i) => portret(g, portB[i], h.imie, d.kolor, px + i * (mb + 10), my, mb, rPor));
  if (d.bohaterowie.length > ile) { g.fillStyle = PRZYGASZONY; g.font = "600 20px Spectral, Georgia, serif"; g.fillText(`+${d.bohaterowie.length - ile}`, px + ile * (mb + 10), my + mb / 2 + 7); }

  // stopka
  g.fillStyle = "#8f8268"; g.font = "400 15px Spectral, Georgia, serif"; g.textAlign = "right";
  g.fillText(`Fantasy RP · tura ${d.tura}`, SZER - 44, WYS - 34); g.textAlign = "left";
  return c;
}
