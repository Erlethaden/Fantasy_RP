// dźwięki (8.4): wszystko generowane w kodzie (Web Audio, chiptune), bez plików dźwiękowych.
// Dwa przełączniki zapamiętane w przeglądarce: dźwięki interfejsu i głos Zgrzyta, plus głośność (domyślnie cicho).
// Ten sam dźwięk nie gra częściej niż co 40 ms (szybkie klikanie nie robi kakofonii).
const KLUCZ = "frp-dzwieki";
const DOMYSLNE = { ui: true, zgrzyt: true, glosnosc: 0.35, glos: "chrapliwy" };
let ust = { ...DOMYSLNE };
try { ust = { ...DOMYSLNE, ...JSON.parse(localStorage.getItem(KLUCZ) || "{}") }; } catch {}
export const ustawieniaDzwiekow = () => ({ ...ust });
export function ustawDzwieki(z) { ust = { ...ust, ...z }; try { localStorage.setItem(KLUCZ, JSON.stringify(ust)); } catch {} }

let ctx = null, wyjscie = null;
function audio() {   // kontekst tworzony przy pierwszym dźwięku (przeglądarka pozwala dopiero po kliknięciu użytkownika)
  if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); wyjscie = ctx.createGain(); wyjscie.connect(ctx.destination); }
  if (ctx.state === "suspended") ctx.resume();
  wyjscie.gain.value = ust.glosnosc;
  return ctx;
}
const ostatnio = new Map();
const wolno = (k, ms = 40) => { const t = performance.now(); if (t - (ostatnio.get(k) || 0) < ms) return false; ostatnio.set(k, t); return true; };

// jeden ton z obwiednią: typ fali, częstotliwość (opcjonalnie przejście do f2), czas, głośność, filtr dolnoprzepustowy
function ton({ typ = "square", f = 440, f2, czas = 0.06, gl = 0.2, filtr, za = 0 }) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + za, o = a.createOscillator(), g = a.createGain();
  o.type = typ; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + czas);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gl, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0008, t + czas);
  let wezel = o;
  if (filtr) { const fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = filtr; o.connect(fl); wezel = fl; }
  wezel.connect(g); g.connect(wyjscie); o.start(t); o.stop(t + czas + 0.02);
}
// szum przepuszczony przez filtr pasmowy, który przesuwa się od f do f2 — szelest szuflady i okna
let bufor = null;
function szum({ czas = 0.18, f = 800, f2 = 2400, q = 1.2, gl = 0.16, za = 0 }) {
  const a = audio(); if (!a) return;
  if (!bufor) { bufor = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = bufor.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = a.currentTime + za, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = bufor; fl.type = "bandpass"; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(f2, t + czas);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gl, t + czas * 0.3); g.gain.exponentialRampToValueAtTime(0.0008, t + czas);
  s.connect(fl); fl.connect(g); g.connect(wyjscie); s.start(t, Math.random() * 0.5); s.stop(t + czas + 0.02);
}
const los = (a, b) => a + Math.random() * (b - a);

// interfejs
export const klik = () => ust.ui && wolno("klik") && ton({ typ: "square", f: 1250, f2: 900, czas: 0.035, gl: 0.08, filtr: 3500 });
export const zatwierdz = () => ust.ui && wolno("zatw") && (ton({ typ: "square", f: 660, czas: 0.05, gl: 0.08, filtr: 3000 }), ton({ typ: "square", f: 990, czas: 0.07, gl: 0.08, filtr: 3000, za: 0.05 }));
export const anuluj = () => ust.ui && wolno("anul") && ton({ typ: "square", f: 520, f2: 300, czas: 0.08, gl: 0.08, filtr: 2200 });
export const otworz = () => ust.ui && wolno("otw", 120) && szum({ czas: 0.2, f: 600, f2: 2600, gl: 0.12 });
export const zamknij = () => ust.ui && wolno("zam", 120) && szum({ czas: 0.14, f: 2400, f2: 700, gl: 0.1 });

// głos Zgrzyta: krótki „bip” na sylabę w trakcie pisania tekstu; trzy warianty do wyboru (strona próbek: materialy/dzwieki.html)
export const GLOSY = {
  chrapliwy: () => { ton({ typ: "sawtooth", f: los(115, 175), czas: 0.055, gl: 0.11, filtr: 1300 }); szum({ czas: 0.03, f: 1800, f2: 1200, q: 4, gl: 0.03 }); },
  piskliwy: () => ton({ typ: "square", f: los(320, 500), czas: 0.035, gl: 0.07, filtr: 4000 }),
  pomruk: () => { ton({ typ: "triangle", f: los(80, 125), f2: los(70, 100), czas: 0.07, gl: 0.2 }); szum({ czas: 0.04, f: 500, f2: 300, q: 2, gl: 0.04 }); },
};
export function glos(znak, wariant = ust.glos) {
  if (!ust.zgrzyt || !/[\p{L}\d]/u.test(znak) || !wolno("glos", 55)) return;
  (GLOSY[wariant] || GLOSY.chrapliwy)();
}
// hieni rechot przy „tak tak”: kilka szybkich, rosnących, trzęsących się bipów
export function rechot(wariant = ust.glos) {
  if (!ust.zgrzyt || !wolno("rechot", 600)) return;
  const baza = wariant === "piskliwy" ? 520 : wariant === "pomruk" ? 160 : 260, typ = wariant === "pomruk" ? "triangle" : "square";
  for (let i = 0; i < 5; i++) ton({ typ, f: baza * (1 + i * 0.12), f2: baza * (1 + i * 0.12) * 1.25, czas: 0.06, gl: 0.08, filtr: 2600, za: i * 0.085 });
}
