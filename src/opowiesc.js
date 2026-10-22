// okno opowieści Zgrzyta (13.4): portret, akapity pisane litera po literze z głosem Zgrzyta, szept na końcu (tylko dla tego kraju),
// „Kopiuj na Discorda” — sama jawna część (bez szeptu). Opowieść składa src/kronikarz.js.
import portret from "../assets/portrety/zgrzyt.png?url";
import { glos, rechot } from "./dzwieki.js";
import { tekstNaDiscorda } from "./kronikarz.js";

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ograniczonyRuch = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// o: { tura, akapity: [tekst], szept: [tekst] | null, szeptyGM: [[nazwa kraju, [tekst]]] (podgląd GM), nagraj?: postep => { blob, rozszerzenie } (film 13.5b) }; otworz(okno) — jak inne okna programu (dźwięk, modal / samouczek)
export function pokazOpowiesc(okno, o, otworz) {
  clearInterval(okno._pisanie);
  okno.innerHTML = `<div class="okno-glowa"><div class="portret opowiesc-portret"><img src="${portret}" alt="" data-portret="zgrzyt"></div>
      <div><h2>Kronika Zgrzyta</h2><p class="rasa">Tura ${o.tura} — opowiada Zgrzyt, kronikarz wszystkich krain</p></div>
      <button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    <div class="opowiesc-tekst" aria-live="polite">${o.akapity.map(() => "<p></p>").join("")}
      ${o.szept?.length ? `<aside class="opowiesc-szept" hidden><h4>🤫 Szept tylko dla ciebie</h4><p></p></aside>` : ""}
      ${(o.szeptyGM || []).map(([n]) => `<aside class="opowiesc-szept" hidden><h4>🤫 Szept dla: ${esc(n)} <small>(widzi tylko ten kraj i GM)</small></h4><p></p></aside>`).join("")}</div>
    <div class="akcje-opowiesci"><button type="button" class="cofnij pokaz-calosc">⏩ Pokaż całość</button>
      <button type="button" class="cofnij kopiuj-opowiesc" title="Bez szeptu — tylko jawna część">📋 Kopiuj na Discorda</button>
      ${o.nagraj ? `<button type="button" class="cofnij nagraj-opowiesc" title="Film z głosem Zgrzyta i mapą, do 10 MB — bez szeptu">🎬 Nagraj film</button><span class="opis-sekcji stan-nagrania" aria-live="polite"></span>` : ""}</div>`;
  okno.querySelector(".zamknij").onclick = () => okno.close();
  const pola = [...okno.querySelectorAll(".opowiesc-tekst > p")], szepty = [...okno.querySelectorAll(".opowiesc-szept")];
  const kolejka = o.akapity.map((t, i) => [pola[i], t]);
  [...(o.szept?.length ? [o.szept] : []), ...(o.szeptyGM || []).map(([, a]) => a)].forEach((a, i) => kolejka.push([szepty[i].querySelector("p"), a.join(" "), szepty[i]]));
  // pisanie: akapit po akapicie, 3 znaki na krok; „Pokaż całość” albo ograniczony ruch — od razu wszystko
  let i = 0, n = 0;
  const calosc = () => { clearInterval(okno._pisanie); for (const [p, t, box] of kolejka) { p.textContent = t; if (box) box.hidden = false; } okno.querySelector(".pokaz-calosc").hidden = true; };
  okno.querySelector(".pokaz-calosc").onclick = calosc;
  if (ograniczonyRuch()) calosc();
  else okno._pisanie = setInterval(() => {
    const [p, t, box] = kolejka[i]; if (box) box.hidden = false;
    n += 3; p.textContent = t.slice(0, n); glos(t[n - 1] || "");
    p.scrollIntoView({ block: "nearest" });
    if (n >= t.length) { if (/tak tak/i.test(t)) rechot(); i++; n = 0; if (i >= kolejka.length) calosc(); }
  }, 28);
  okno.querySelector(".kopiuj-opowiesc").onclick = async e => {
    const tekst = tekstNaDiscorda(o);
    try { await navigator.clipboard.writeText(tekst); e.target.textContent = "✔ Skopiowano"; } catch { prompt("Skopiuj tekst:", tekst); }
  };
  const nagraj = okno.querySelector(".nagraj-opowiesc");
  if (nagraj) nagraj.onclick = async () => {
    const st = okno.querySelector(".stan-nagrania"); nagraj.disabled = true; calosc();
    try {
      const { blob, rozszerzenie } = await o.nagraj(p => { st.textContent = `Nagrywam… ${Math.round(p * 100)}% — nie zamykaj okna i nie przełączaj programu`; });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `kronika-zgrzyta-tura-${o.tura}.${rozszerzenie}` });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      st.textContent = `✔ Zapisano film (${(blob.size / 1048576).toFixed(1)} MB) — wrzuć go na Discorda.`;
    } catch (e) { st.textContent = "Nie udało się nagrać: " + (e.message || e); }
    nagraj.disabled = false;
  };
  okno.addEventListener("close", () => clearInterval(okno._pisanie), { once: true });
  if (!okno.open) otworz(okno);
}
