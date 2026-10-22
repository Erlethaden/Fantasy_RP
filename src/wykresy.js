// wykresy liniowe (9.2, 9.3): SVG bez bibliotek — wartość w czasie (tury). Jedna oś Y, cienkie linie 2 px, przytłumiona siatka,
// najechanie = pionowa linia i podpowiedź z wartościami wszystkich serii w tej turze. Kolor serii = kolor kraju (tożsamość),
// a tekst zawsze w kolorach tekstu; przy wielu seriach na końcu linii herb kraju, żeby kraj nie był rozpoznawany samym kolorem.
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const liczba = v => {   // zwykły minus i spacja tysięcy ręcznie (formatowanie przeglądarki gubiło minus na płótnie)
  const m = Math.abs(v), t = m >= 1e6 ? `${+(m / 1e6).toFixed(1)} mln` : m >= 1e4 ? `${+(m / 1e3).toFixed(1)} tys.` : String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (v < 0 && Math.round(m) ? "-" : "") + t;
};
// „ładny” zakres osi: 0 albo minimum danych … zaokrąglone maksimum, 3–4 kreski
function skala(min, max) {
  if (min === max) { max = max === 0 ? 1 : max * 1.1; min = Math.min(0, min); }
  const krok0 = (max - min) / 3, rzad = 10 ** Math.floor(Math.log10(krok0)), krok = [1, 2, 2.5, 5, 10].map(k => k * rzad).find(k => k >= krok0);
  const od = Math.floor(min / krok) * krok, doo = Math.ceil(max / krok) * krok, kreski = [];
  for (let v = od; v <= doo + krok / 2; v += krok) kreski.push(+v.toFixed(10));
  return { od, doo, kreski };
}
// serie: [{ nazwa, kolor, herb?, punkty: [{ x: nr tury, y: liczba | null }] }]; tury: [nr, …] (oś X); teraz: nr tury do zaznaczenia (timelapse)
export function wykres({ serie, tury, szer = 520, wys = 220, jednostka = "", teraz = null, etykietyKoncow = serie.length > 1, opis = "" }) {
  const wartosci = serie.flatMap(s => s.punkty.map(p => p.y)).filter(v => v !== null && Number.isFinite(v));
  if (!tury.length || !wartosci.length) return `<p class="puste">Brak danych — wykres pojawi się po zamknięciu pierwszej tury.</p>`;
  const L = 46, P = etykietyKoncow ? 34 : 12, G = 10, D = 22, sz = szer - L - P, wy = wys - G - D;
  const { od, doo, kreski } = skala(Math.min(0, ...wartosci), Math.max(...wartosci));
  const X = nr => L + (tury.length === 1 ? sz / 2 : (tury.indexOf(nr) / (tury.length - 1)) * sz), Y = v => G + wy - ((v - od) / (doo - od)) * wy;
  const co = Math.max(1, Math.ceil(tury.length / 8));   // najwyżej ok. 8 podpisów tur
  const siatka = kreski.map(v => `<line x1="${L}" x2="${L + sz}" y1="${Y(v)}" y2="${Y(v)}" class="w-siatka"/><text x="${L - 6}" y="${Y(v) + 4}" class="w-os" text-anchor="end">${liczba(v)}</text>`).join("");
  const osX = tury.map((nr, i) => i % co && i !== tury.length - 1 ? "" : `<text x="${X(nr)}" y="${wys - 6}" class="w-os" text-anchor="middle">${nr}</text>`).join("");
  const linie = serie.map(s => {
    const pkt = s.punkty.filter(p => p.y !== null && Number.isFinite(p.y) && tury.includes(p.x));
    if (!pkt.length) return "";
    const d = pkt.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" "), ost = pkt[pkt.length - 1];
    return `<path d="${d}" fill="none" stroke="${esc(s.kolor)}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
      + (pkt.length === 1 ? `<circle cx="${X(ost.x)}" cy="${Y(ost.y)}" r="4" fill="${esc(s.kolor)}"/>` : "")
      + (etykietyKoncow && s.herb ? `<image href="${esc(s.herb)}" x="${X(ost.x) + 4}" y="${Y(ost.y) - 10}" width="20" height="20" class="w-herb"><title>${esc(s.nazwa)}</title></image>` : "");
  }).join("");
  const znacznik = teraz !== null && tury.includes(teraz) ? `<line x1="${X(teraz)}" x2="${X(teraz)}" y1="${G}" y2="${G + wy}" class="w-teraz"/>` : "";
  // dane do podpowiedzi: wartości wszystkich serii w każdej turze
  const dane = esc(JSON.stringify({ tury, x: tury.map(X), serie: serie.map(s => ({ n: s.nazwa, k: s.kolor, v: Object.fromEntries(s.punkty.map(p => [p.x, p.y])) })), j: jednostka }));
  return `<figure class="wykres"><svg viewBox="0 0 ${szer} ${wys}" width="100%" role="img" aria-label="${esc(opis)}" data-wykres="${dane}">
    ${siatka}${osX}${znacznik}${linie}<line class="w-kursor" x1="0" x2="0" y1="${G}" y2="${G + wy}" visibility="hidden"/>
    <rect class="w-trafienie" x="${L}" y="${G}" width="${sz}" height="${wy}" fill="transparent"/></svg><div class="w-podpowiedz" hidden></div></figure>`;
}
// najechanie: pionowa linia przy najbliższej turze i podpowiedź z wartościami (posortowane malejąco)
export function podepnijWykresy(kontener) {
  kontener.querySelectorAll("svg[data-wykres]").forEach(svg => {
    const d = JSON.parse(svg.dataset.wykres), kursor = svg.querySelector(".w-kursor"), dymek = svg.parentNode.querySelector(".w-podpowiedz");
    const pokaz = e => {
      const r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * svg.viewBox.baseVal.width;
      let i = 0; d.x.forEach((x, k) => { if (Math.abs(x - vx) < Math.abs(d.x[i] - vx)) i = k; });
      const nr = d.tury[i], wiersze = d.serie.filter(s => s.v[nr] !== null && s.v[nr] !== undefined).sort((a, b) => b.v[nr] - a.v[nr]);
      kursor.setAttribute("x1", d.x[i]); kursor.setAttribute("x2", d.x[i]); kursor.setAttribute("visibility", "visible");
      dymek.innerHTML = `<b>Tura ${nr}</b>${wiersze.map(s => `<span><i style="background:${esc(s.k)}"></i>${esc(s.n)}: <b>${liczba(s.v[nr])}</b>${d.j ? " " + esc(d.j) : ""}</span>`).join("")}`;
      dymek.hidden = false;
      const lewo = d.x[i] / svg.viewBox.baseVal.width * r.width;
      dymek.style.left = `${Math.min(Math.max(0, lewo + 12), r.width - dymek.offsetWidth)}px`;
    };
    const ukryj = () => { kursor.setAttribute("visibility", "hidden"); dymek.hidden = true; };
    svg.querySelector(".w-trafienie").addEventListener("pointermove", pokaz);
    svg.querySelector(".w-trafienie").addEventListener("pointerleave", ukryj);
  });
}
