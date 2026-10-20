// samouczek (8.1): Zgrzyt prowadzi po programie — okno dialogu z jego portretem, omawiany element w migającej obwódce,
// kliknięcie gdziekolwiek = dalej. Użytkownik nic nie klika w programie: Zgrzyt sam otwiera karty i okna (akcje kroków).
// Rozdział z `piaskownica: true` dzieje się na kopii stanu: nic nie idzie do bazy, a po rozdziale wraca stan sprzed niego.
// Rozdziały i kwestie: dane/samouczek.js. Główny program podaje `api` (akcje, gm, odswiez) przy starcie.
import { ROZDZIALY } from "./dane/samouczek.js";
import { wejdzDoPiaskownicy, wyjdzZPiaskownicy } from "./dane/magazyn.js";
import portret from "../assets/portrety/zgrzyt.png?url";

const KLUCZ = "frp-samouczek";   // { propozycja: true, przejrzane: [id] } — w tej przeglądarce
const pamiec = () => { try { return JSON.parse(localStorage.getItem(KLUCZ)) || {}; } catch { return {}; } };
const zapamietaj = z => { try { localStorage.setItem(KLUCZ, JSON.stringify({ ...pamiec(), ...z })); } catch {} };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ograniczonyRuch = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

let api = null, warstwa = null, okno = null, obwodka = null, strzalka = null;
let biezacy = null;   // { rozdzialy: [id], r: rozdział, k: nr kroku, cel: element | null, pisanie: timer }
const rozdzialyDla = () => ROZDZIALY.filter(r => !r.gm || api.gm());

function zbuduj() {
  if (warstwa) return;
  warstwa = Object.assign(document.createElement("div"), { className: "samouczek", hidden: true });
  warstwa.innerHTML = `<div class="samouczek-obwodka" aria-hidden="true"></div>
    <div class="samouczek-strzalka" aria-hidden="true" hidden><svg viewBox="0 0 48 32" width="48" height="32"><path d="M2 11h26V3l18 13-18 13v-8H2z" fill="#f2c94c" stroke="#1a1206" stroke-width="2.5" stroke-linejoin="round"/></svg></div>
    <section class="samouczek-okno" role="dialog" aria-label="Samouczek — Zgrzyt" aria-live="polite">
      <div class="portret samouczek-portret"><img src="${portret}" alt="Zgrzyt"></div>
      <div class="samouczek-tresc"><h3>Zgrzyt</h3><div class="samouczek-tekst"></div><div class="samouczek-przyciski"></div></div>
    </section>`;
  document.body.append(warstwa);
  okno = warstwa.querySelector(".samouczek-okno"); obwodka = warstwa.querySelector(".samouczek-obwodka"); strzalka = warstwa.querySelector(".samouczek-strzalka");
  // kliknięcie = dalej; przeciągnięcie przesuwa mapę, kółko ją przybliża (mapa żyje pod warstwą samouczka)
  let chwyt = null;
  warstwa.addEventListener("pointerdown", e => { if (e.button === 0 && !e.target.closest(".samouczek-okno")) { chwyt = { x: e.clientX, y: e.clientY, ruch: 0 }; warstwa.setPointerCapture(e.pointerId); } });
  warstwa.addEventListener("pointermove", e => {
    if (!chwyt) return;
    const dx = e.clientX - chwyt.x, dy = e.clientY - chwyt.y; chwyt.ruch += Math.hypot(dx, dy); chwyt.x = e.clientX; chwyt.y = e.clientY;
    if (chwyt.ruch > 5) { api.akcje.przesunMape(dx, dy); warstwa.classList.add("ciagnie"); }
  });
  warstwa.addEventListener("pointerup", () => { const klik = chwyt && chwyt.ruch <= 5; chwyt = null; warstwa.classList.remove("ciagnie"); if (klik) dalej(); });
  warstwa.addEventListener("click", e => { if (e.target.closest(".samouczek-okno") && !e.target.closest("button")) dalej(); });   // klik w samo okno też dalej
  warstwa.addEventListener("wheel", e => { e.preventDefault(); api.akcje.przyblizMape(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
  document.addEventListener("keydown", e => {
    if (warstwa.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); zakoncz(); }
    else if ((e.key === "Enter" || e.key === " ") && !e.target.closest?.("button")) { e.preventDefault(); dalej(); }
  }, true);
  const sledz = () => { if (!warstwa.hidden) { ustawObwodke(); requestAnimationFrame(sledz); } };
  warstwa.sledz = sledz;
}
// obwódka idzie za elementem (przewijanie, zmiana rozmiaru, animacja szuflady)
function ustawObwodke() {
  const el = biezacy?.cel;
  if (!el || !el.isConnected || !el.getClientRects().length) { obwodka.hidden = strzalka.hidden = true; return; }
  const r = el.getBoundingClientRect(), m = 6;
  Object.assign(obwodka.style, { left: `${r.left - m}px`, top: `${r.top - m}px`, width: `${r.width + 2 * m}px`, height: `${r.height + 2 * m}px` });
  obwodka.hidden = false;
  ustawStrzalke(r);
}
// strzałka od strony okna Zgrzyta do elementu: grot tuż przed obwódką, na linii środek okna → środek elementu
function ustawStrzalke(r) {
  const o = okno.getBoundingClientRect(), dx0 = o.left + o.width / 2, dy0 = o.top + o.height / 2;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = cx - dx0, dy = cy - dy0, d = Math.hypot(dx, dy);
  const wnetrze = dx0 > r.left && dx0 < r.right && dy0 > r.top && dy0 < r.bottom;
  if (wnetrze || d < 60 || r.width * r.height > innerWidth * innerHeight * 0.45) { strzalka.hidden = true; return; }   // ogromny cel (mapa) — bez strzałki
  const ux = dx / d, uy = dy / d, m = 16;   // wejście linii w prostokąt powiększony o margines
  const wx = ux ? ((ux > 0 ? r.left - m : r.right + m) - dx0) / ux : -Infinity, wy = uy ? ((uy > 0 ? r.top - m : r.bottom + m) - dy0) / uy : -Infinity;
  const t = Math.max(0, Math.min(Math.max(wx, wy), d));   // wejście w prostokąt = późniejsze z wejść w pasy x i y
  Object.assign(strzalka.style, { left: `${dx0 + ux * t}px`, top: `${dy0 + uy * t}px`, transform: `translate(-100%, -50%) rotate(${Math.atan2(dy, dx)}rad)`, transformOrigin: "100% 50%" });
  strzalka.hidden = false;
}
// okno nie zasłania omawianego elementu: domyślnie na dole pośrodku, inaczej u góry, a przy wysokim elemencie z boku
function ustawOkno(cel) {
  okno.classList.remove("gora", "lewo", "prawo");
  if (!cel) return;
  const r = cel.getBoundingClientRect(), o = okno.getBoundingClientRect();
  const zachodzi = (top, left) => r.left < left + o.width && r.right > left && r.top < top + o.height && r.bottom > top;
  const srodek = (innerWidth - o.width) / 2;
  if (!zachodzi(innerHeight - 24 - o.height, srodek)) return;
  if (!zachodzi(90, srodek)) return okno.classList.add("gora");
  okno.classList.add(r.left + r.width / 2 > innerWidth / 2 ? "lewo" : "prawo");
}
function pokazTekst(html, przyciski = "") {
  const t = okno.querySelector(".samouczek-tekst");
  clearInterval(biezacy?.pisanie);
  okno.querySelector(".samouczek-przyciski").innerHTML = przyciski;
  if (ograniczonyRuch()) { t.innerHTML = html; return; }
  // pisanie litera po literze; kliknięcie w trakcie pokazuje od razu całość
  const caly = document.createElement("div"); caly.innerHTML = html; const tekst = caly.textContent; let n = 0;
  t.textContent = ""; t.dataset.pelny = html;
  const timer = setInterval(() => { n += 2; t.textContent = tekst.slice(0, n); if (n >= tekst.length) { clearInterval(timer); t.innerHTML = html; delete t.dataset.pelny; } }, 18);
  if (biezacy) biezacy.pisanie = timer;
}
const piszeSie = () => okno.querySelector(".samouczek-tekst").dataset.pelny !== undefined;
function dokonczPisanie() { const t = okno.querySelector(".samouczek-tekst"); clearInterval(biezacy?.pisanie); t.innerHTML = t.dataset.pelny; delete t.dataset.pelny; }

const PRZYCISKI_KROKU = `<span class="samouczek-dalej">kliknij, by dalej ▸</span><button type="button" class="cofnij" data-s="menu">Rozdziały</button><button type="button" class="cofnij" data-s="koniec">Zakończ</button>`;
function podepnijPrzyciski() {
  okno.querySelectorAll("[data-s]").forEach(b => b.onclick = () => ({ menu: () => { zakonczRozdzial(); menu(); }, koniec: zakoncz,
    wszystkie: () => start(rozdzialyDla().map(r => r.id)), nie: zakoncz })[b.dataset.s]());
  okno.querySelectorAll("[data-rozdzial]").forEach(b => b.onclick = () => start([b.dataset.rozdzial]));
}
async function krok() {
  const { r, k } = biezacy, s = r.kroki[k];
  biezacy.cel = null; obwodka.hidden = true; if (strzalka) strzalka.hidden = true;
  try { await s.akcja?.(api.akcje); } catch (e) { console.warn("samouczek: akcja kroku", r.id, k, e); }
  await new Promise(ok => setTimeout(ok, s.akcja ? 250 : 0));   // otwarta karta / okno zdąży się narysować
  const cel = typeof s.cel === "function" ? s.cel(api.akcje) : s.cel ? document.querySelector(s.cel) : null;
  if (s.cel && !cel) return dalej();   // sekcji nie ma (np. kraina bez budynków) — krok pominięty
  biezacy.cel = cel || null;
  if (cel) {   // karta albo okno przewija się do omawianej sekcji
    const r = cel.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 10) cel.scrollIntoView({ block: r.height > innerHeight * 0.6 ? "start" : "center", behavior: ograniczonyRuch() ? "auto" : "smooth" });
    await new Promise(ok => setTimeout(ok, 350));
  }
  ustawOkno(cel);
  pokazTekst(typeof s.tekst === "function" ? s.tekst(api.akcje) : s.tekst, PRZYCISKI_KROKU);
  podepnijPrzyciski();
}
function dalej() {
  if (piszeSie()) return dokonczPisanie();
  if (!biezacy?.r) return;
  while (biezacy.k + 1 < biezacy.r.kroki.length) { biezacy.k++; if (biezacy.r.kroki[biezacy.k].warunek?.(api.akcje) !== false) return krok(); }   // warunek: krok tylko dla GM itp.
  const nast = biezacy.rozdzialy.indexOf(biezacy.r.id) + 1;
  zakonczRozdzial(true);
  if (nast < biezacy.rozdzialy.length) otworzRozdzial(biezacy.rozdzialy[nast]); else menu("Zgrzyt skończył ten kawałek, tak tak! Wybierz następny albo „Zakończ”.");
}
function otworzRozdzial(id) {
  const r = ROZDZIALY.find(x => x.id === id); if (!r) return;
  if (r.piaskownica) wejdzDoPiaskownicy();
  biezacy.r = r; biezacy.k = 0; krok();
}
// koniec rozdziału: sprzątanie akcji (zamknięte okna, warstwy) i powrót stanu sprzed pokazu
function zakonczRozdzial(przerobiony) {
  const r = biezacy?.r; if (!r) return;
  clearInterval(biezacy.pisanie); biezacy.r = null; biezacy.cel = null; obwodka.hidden = true; if (strzalka) strzalka.hidden = true;
  try { r.sprzatanie?.(api.akcje); } catch (e) { console.warn("samouczek: sprzątanie", r.id, e); }
  if (r.piaskownica) wyjdzZPiaskownicy();
  api.akcje.sprzatnij(); api.odswiez();
  if (przerobiony) zapamietaj({ przejrzane: [...new Set([...(pamiec().przejrzane || []), r.id])] });
}
function menu(wstep = "Zgrzyt zna dużo rzeczy, tak tak. O czym Zgrzyt ma gadać? Wybierz rozdział albo wszystkie po kolei.") {
  biezacy ??= { rozdzialy: [] }; biezacy.cel = null; obwodka.hidden = true; if (strzalka) strzalka.hidden = true; okno.classList.remove("gora");
  const przejrzane = pamiec().przejrzane || [];
  pokazTekst(esc(wstep), `<div class="samouczek-rozdzialy">${rozdzialyDla().map(r => `<button type="button" class="cofnij" data-rozdzial="${r.id}">${przejrzane.includes(r.id) ? "✓ " : ""}${esc(r.tytul)}${r.gm ? " <small>(GM)</small>" : ""}</button>`).join("")}</div>
    <button type="button" class="dodaj" data-s="wszystkie">Wszystkie po kolei</button><button type="button" class="cofnij" data-s="koniec">Zakończ</button>`);
  podepnijPrzyciski();
}
function pokaz() { zbuduj(); if (warstwa.hidden) api.akcje.pelnaMapa(); warstwa.hidden = false; document.body.classList.add("w-samouczku"); requestAnimationFrame(warstwa.sledz); }
function start(rozdzialy) { pokaz(); biezacy = { rozdzialy }; otworzRozdzial(rozdzialy[0]); }
export function zakoncz() {
  if (!warstwa || warstwa.hidden) return;
  zakonczRozdzial(); biezacy = null; warstwa.hidden = true; document.body.classList.remove("w-samouczku");
}
// przycisk „Samouczek” w pasku
export function otworzSamouczek(a) { api = a; pokaz(); menu(); }
// pierwsze wejście do gry w tej przeglądarce: Zgrzyt proponuje oprowadzenie (raz; odmowa też się liczy)
export function zaproponujSamouczek(a) {
  if (pamiec().propozycja) return;
  zapamietaj({ propozycja: true }); api = a; pokaz(); biezacy = { rozdzialy: [] };
  pokazTekst("Ooo, nowy ludziak! Zgrzyt jest Zgrzyt i Zgrzyt wszystko pokaże, co gdzie jest w tej grze. Pokazać? Tak tak?",
    `<button type="button" class="dodaj" data-s="wszystkie">Tak, pokaż wszystko</button><button type="button" class="cofnij" data-s="menu">Wybiorę rozdział</button><button type="button" class="cofnij" data-s="nie">Nie, dzięki</button>`);
  podepnijPrzyciski();
}
