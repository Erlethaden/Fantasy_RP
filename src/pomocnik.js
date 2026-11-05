// Zgrzyt-pomocnik (16): dymek w lewym dolnym rogu (nad przyciskami szlaków, nie zasłania szuflady z kartą) z krótkim komentarzem.
// Ustawienie w 🔊 (dzwieki.js → pomocnik): wylaczony / rzadko (tylko zdarzenia gry) / normalnie (+ docinek co ~5 min) / czesto (co ~2 min).
// Milczy w samouczku. Głos według przełącznika „Głos Zgrzyta”. Na telefonie (PODGLAD) main.js go nie uruchamia.
import portret from "../assets/portrety/zgrzyt.png?url";
import { glos, rechot, ustawieniaDzwiekow } from "./dzwieki.js";

const ODSTEP = { normalnie: 5 * 60e3, czesto: 2 * 60e3 };
let dymek = null, pisanie = null, chowanie = null, ostatnio = Date.now();

function zbuduj() {
  dymek = Object.assign(document.createElement("aside"), { className: "pomocnik", hidden: true });
  dymek.setAttribute("aria-live", "polite"); dymek.setAttribute("aria-label", "Zgrzyt mówi");
  dymek.innerHTML = `<img src="${portret}" alt=""><p class="pomocnik-tekst"></p><button type="button" class="pomocnik-zamknij" aria-label="Zamknij dymek Zgrzyta">×</button>`;
  dymek.querySelector(".pomocnik-zamknij").onclick = schowaj;
  document.body.append(dymek);
}
function schowaj() { clearInterval(pisanie); clearTimeout(chowanie); if (dymek) dymek.hidden = true; }

// zwraca false, gdy Zgrzyt milczy (wyłączony albo samouczek)
export function powiedz(tekst) {
  if (ustawieniaDzwiekow().pomocnik === "wylaczony" || document.body.classList.contains("w-samouczku")) return false;
  if (!dymek) zbuduj();
  schowaj(); dymek.hidden = false; ostatnio = Date.now();
  const t = dymek.querySelector(".pomocnik-tekst"), koniec = () => {
    t.textContent = tekst; if (/tak tak/i.test(tekst)) rechot();
    chowanie = setTimeout(schowaj, 6000 + tekst.length * 60);   // tyle, żeby spokojnie przeczytać
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return koniec(), true;
  let n = 0; t.textContent = "";
  pisanie = setInterval(() => { n += 2; t.textContent = tekst.slice(0, n); glos(tekst[n - 1] || ""); if (n >= tekst.length) { clearInterval(pisanie); koniec(); } }, 18);
  return true;
}

// ogólne docinki poza zdarzeniami: co 30 s sprawdza, czy od ostatniego dymka minął odstęp z ustawień; karta w tle — cisza
export function startDocinkow(losuj) {
  setInterval(() => {
    const odstep = ODSTEP[ustawieniaDzwiekow().pomocnik];
    if (odstep && !document.hidden && Date.now() - ostatnio > odstep) powiedz(losuj());
  }, 30e3);
}
