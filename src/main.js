import "./style.css";
import "../assets/sala_tronow/animacje.js"; // ustawia window.Sala
import pakiet from "../package.json";
import { stan, wczytaj, zapisz, CHMURA, polacz, odlacz, naZmianeKonta, zaloguj, zalozKonto, zalogujGoogle, wyloguj, ustawBladZapisu,
  ROLE, mojProfil, sluchajProfilu, sluchajUzytkownikow, ustawUzytkownika, ustawDostep, sprzatnijLogi, ostatnieLogi, licznik, KOLEKCJE, policzDokumenty, rozmiaryWczytanych, szukajSmieci, zapiszWszystko,
  zaproponuj, sluchajPropozycji, rozpatrz, wycofaj, sprzatnijPropozycje, zapiszProwincje } from "./dane/magazyn.js";
import { ZMIANY } from "./dane/zmiany.js";
import { utworzMape } from "./mapa.js";
import mapaUrl from "../assets/mapa/mapa.png";
import indeksyUrl from "../assets/mapa/prowincje.png";
import PROWINCJE from "../assets/mapa/prowincje.json";
import KAFLE from "../assets/mapa/kafle.json";

// obrazy scen przez Vite: do dist trafiają tylko pliki z sala_tronow/ (bez fanartów)
const obrazy = import.meta.glob("../assets/sala_tronow/*.png", { eager: true, query: "?url", import: "default" });
const adres = plik => obrazy["../assets/sala_tronow/" + plik];
// portrety 128 px: plik = jedno ze słów imienia małymi literami (dagna.png, seranya.png)
const portrety = import.meta.glob(["../assets/portrety/*.png", "!../assets/portrety/*_1024.png"], { eager: true, query: "?url", import: "default" });
// portret po słowie z imienia, a gdy imię zmieniono (np. edycją GM), po słowie ze stałego id
const plikPortretu = h => `${h.imie} ${h.id}`.toLowerCase().split(/[^a-ząćęłńóśźż]+/).map(s => portrety[`../assets/portrety/${s}.png`]).find(Boolean);
// ikony zasobów 32 px: plik = pole „ikona” typu zasobu (bron.png)
const ikony = import.meta.glob(["../assets/ikony/*.png", "!../assets/ikony/*_1024.png"], { eager: true, query: "?url", import: "default" });
// herby 64 px: plik = id frakcji (krag-mhor.png)
const herby = import.meta.glob(["../assets/herby/*.png", "!../assets/herby/*_1024.png"], { eager: true, query: "?url", import: "default" });

const CZAS_SCENY = 12000;
const sala = new Sala(document.getElementById("scena"), adres);
Object.assign(sala, { tryb: "blysk", zoom: true, ruch: !matchMedia("(prefers-reduced-motion: reduce)").matches });
document.getElementById("wersja").textContent = "wersja " + pakiet.version;

const mini = document.getElementById("miniatury");
sala.sceny.forEach((s, i) => {
  const m = document.createElement("button"); m.type = "button"; m.title = s.imie;
  m.style.backgroundImage = `url("${adres(s.plik)}")`; m.onclick = () => { pokaz(i); restart(); }; mini.appendChild(m);
});
let timer = null, podpisTimer;
function pokaz(i) {
  const pierwsza = sala.nr < 0; sala.pokaz(i); const s = sala.sceny[sala.nr], podpis = document.querySelector(".podpis");
  // podpis gaśnie i wraca w połowie przejścia, żeby nie wyprzedzał obrazu
  podpis.style.opacity = 0; clearTimeout(podpisTimer);
  podpisTimer = setTimeout(() => {
    document.getElementById("imie").textContent = s.imie;
    document.getElementById("frakcja").textContent = s.frakcja; podpis.style.opacity = 1;
  }, pierwsza ? 0 : sala.czasPrzejscia * 500);
  [...mini.children].forEach((b, j) => b.classList.toggle("akt", j === sala.nr));
}
function restart() { clearInterval(timer); timer = setInterval(() => pokaz(sala.nr + 1), CZAS_SCENY); }
addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || document.getElementById("menu").hidden) return;
  if (e.key === "ArrowRight") { pokaz(sala.nr + 1); restart(); }
  if (e.key === "ArrowLeft") { pokaz(sala.nr - 1); restart(); }
});
pokaz(0); restart();

// powłoka aplikacji; w DEMO „Wejdź do sali” wpuszcza od razu, w chmurze po zalogowaniu (Firebase)
const lista = document.getElementById("lista-frakcji"), glowny = document.getElementById("glowny");
const esc = t => String(t).replace(/[&<>"]/g, z => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[z]);
// tekst opisu: pusta linia = akapit, linie od "- " = lista, pojedynczy enter = nowa linia (np. hymn)
const tekst = t => t.split(/\n\s*\n/).map(blok => {
  const linie = blok.trim().split("\n"), punkty = linie.filter(l => l.startsWith("- "));
  if (!punkty.length) return `<p>${linie.map(esc).join("<br>")}</p>`;
  const wstep = linie.filter(l => !l.startsWith("- "));
  return (wstep.length ? `<p>${wstep.map(esc).join("<br>")}</p>` : "") + `<ul>${punkty.map(l => `<li>${esc(l.slice(2))}</li>`).join("")}</ul>`;
}).join("");
// górny pasek: same herby; nazwa w podpowiedzi, własne państwo w ramce
const herbFrakcji = f => herby[`../assets/herby/${f.id}.png`];
function zbudujListe() {
  lista.replaceChildren(...stan.frakcje.map(f => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.id = f.id; b.style.setProperty("--kolor", f.kolor);
    const twoje = f.id === profil?.frakcja;
    b.title = f.nazwa + (twoje ? " — Twoje państwo" : ""); b.setAttribute("aria-label", b.title); b.classList.toggle("moja", twoje);
    b.setAttribute("aria-current", widok === f.id);
    b.innerHTML = herbFrakcji(f) ? `<img src="${herbFrakcji(f)}" alt="">` : `<span class="herb-maly" aria-hidden="true">${esc(f.nazwa[0])}</span>`;
    b.onclick = () => widok === f.id ? zamknijSzuflade() : wybierz(f.id); return b;
  }));
}
// szuflada z prawej (karta frakcji, Panel GM): zwęża mapę; zamyka ją ✕, Esc albo klik w mapę
const szuflada = document.getElementById("szuflada");
function otworzSzuflade() { szuflada.hidden = false; }
function zamknijSzuflade() {
  szuflada.hidden = true; widok = null; glowny.innerHTML = ""; mapa.wybierz(0);
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
}
document.getElementById("zamknij-szuflade").onclick = zamknijSzuflade;
addEventListener("keydown", e => { if (e.key === "Escape" && !szuflada.hidden && !document.querySelector("dialog[open]")) zamknijSzuflade(); });
// klik w prowincję otwiera jej kartę, klik w wodę zamyka szufladę
const mapa = utworzMape(document.getElementById("mapa"), { rysunek: mapaUrl, indeksy: indeksyUrl, ramki: PROWINCJE.map(p => p.ramka), kafle: KAFLE,
  onKlik: i => i ? pokazProwincje(i) : !szuflada.hidden && zamknijSzuflade() });
// karta prowincji: właściciel, nazwa, opis — edytuje GM/admin, widzą wszyscy (decyzje 6.3)
// stan.prowincje[id] = { wlasciciel: idFrakcji | "npc:<id>", nazwa, opis }; brak wpisu = ziemia niczyja
// stan.npc[id] = { nazwa, rodzaj: "wasal" | "marionetka", zwierzchnik: idFrakcji, opis } — kraj NPC w odcieniu koloru zwierzchnika (decyzja użytkownika)
// id prowincji to numer z rysunku (wewnętrzny), „D…” = dolne kontynenty, „90a/90b” = bliźniacze wyspy
const NAZWY_GRANIC = { "zwykła": ["zwykła", "g-zwykla"], "góry": ["góry", "g-gory"], "rzeka": ["rzeka", "g-rzeka"] };
const RODZAJE_NPC = { wasal: "wasal", marionetka: "marionetka" };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => "#" + c.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
const frakcjaPo = id => stan.frakcje.find(f => f.id === id);
// kolejne kraje NPC zwierzchnika: na przemian jaśniej i ciemniej, coraz mocniej
function kolorNpc(id) {
  const n = stan.npc?.[id], z = frakcjaPo(n?.zwierzchnik); if (!z) return "#808080";
  const k = Object.keys(stan.npc).filter(x => stan.npc[x].zwierzchnik === n.zwierzchnik).sort().indexOf(id);
  const sila = 0.3 + 0.15 * (k >> 1), cel = k % 2 ? 0 : 255;
  return hex(rgb(z.kolor).map(v => v + (cel - v) * Math.min(sila, 0.75)));
}
// właściciel prowincji jako { nazwa, kolor, opis tekstem } albo null
function wlascicielPo(id) {
  if (id?.startsWith("npc:")) {
    const n = stan.npc?.[id.slice(4)], z = frakcjaPo(n?.zwierzchnik); if (!n) return null;
    return { nazwa: n.nazwa, kolor: kolorNpc(id.slice(4)), opis: `kraj NPC — ${RODZAJE_NPC[n.rodzaj] || "wasal"}${z ? ` ${z.nazwa}` : ""}` };
  }
  const f = frakcjaPo(id); return f && { nazwa: f.nazwa, kolor: f.kolor, opis: "" };
}
const nazwaProwincji = p => stan.prowincje?.[p.id]?.nazwa || `Prowincja ${p.id}`;
function kolorujMape() {
  mapa.ustawKolory(PROWINCJE.map(p => { const w = wlascicielPo(stan.prowincje?.[p.id]?.wlasciciel); return w && rgb(w.kolor); }));
}
function pokazProwincje(i, zostanPrzewiniecie) {
  const p = PROWINCJE[i - 1]; widok = "p:" + i; mapa.wybierz(i);
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
  const d = stan.prowincje?.[p.id] || {}, wl = wlascicielPo(d.wlasciciel);
  wl ? glowny.style.setProperty("--kolor", wl.kolor) : glowny.style.removeProperty("--kolor");
  const sas = [...p.sasiedzi].sort((a, b) => (a[1] !== "zwykła") - (b[1] !== "zwykła") || PROWINCJE[a[0] - 1].id.localeCompare(PROWINCJE[b[0] - 1].id, "pl", { numeric: true }));
  const zablokowane = sas.filter(([, t]) => t !== "zwykła").length;
  const opcja = (v, w) => `<option value="${esc(v)}"${v === (d.wlasciciel || "") ? " selected" : ""}>${esc(w)}</option>`;
  const npc = Object.entries(stan.npc || {}).sort((a, b) => a[1].nazwa.localeCompare(b[1].nazwa, "pl"));
  const opcjeWl = opcja("", "— ziemia niczyja —") + `<optgroup label="Frakcje">${stan.frakcje.map(f => opcja(f.id, f.nazwa)).join("")}</optgroup>`
    + (npc.length ? `<optgroup label="Kraje NPC">${npc.map(([id, n]) => opcja("npc:" + id, `${n.nazwa} (${RODZAJE_NPC[n.rodzaj] || "wasal"} ${frakcjaPo(n.zwierzchnik)?.nazwa || "?"})`)).join("")}</optgroup>` : "");
  const wlasciciel = wl ? `<b>${esc(wl.nazwa)}</b>${wl.opis ? ` — ${esc(wl.opis)}` : ""}` : "ziemia niczyja";
  glowny.innerHTML = `<article class="karta prowincja"><h2>${esc(nazwaProwincji(p))}</h2>
    <p class="rasa">${wlasciciel}${d.nazwa ? ` · nr ${esc(p.id)}` : ""}</p>
    ${gm ? `<form class="edycja-prowincji">
      <label class="szeroko">Właściciel <select name="wlasciciel">${opcjeWl}</select>${npc.length ? "" : `<small>Kraje NPC (wasale, marionetki) zakładasz w Panelu GM.</small>`}</label>
      <label class="szeroko">Nazwa <input name="nazwa" maxlength="80" value="${esc(d.nazwa || "")}" placeholder="Prowincja ${esc(p.id)}"></label>
      <label class="szeroko">Opis <textarea name="opis" rows="4" maxlength="4000">${esc(d.opis || "")}</textarea></label></form>`
      : d.opis ? `<div class="opis">${tekst(d.opis)}</div>` : ""}
    <section><h3>Sąsiedzi</h3>
      ${sas.length ? `<p class="opis-sekcji">${zablokowane ? `Przez góry i rzekę bez mostu armia przejdzie tylko z umiejętnością frakcji (${zablokowane} z ${sas.length} granic).` : "Wszystkie granice zwykłe."}</p>
      <ul class="sasiedzi">${sas.map(([j, t]) => { const q = PROWINCJE[j - 1], f = wlascicielPo(stan.prowincje?.[q.id]?.wlasciciel);
        return `<li><button type="button" data-i="${j}"><span>${esc(nazwaProwincji(q))}${f ? `<small>${esc(f.nazwa)}</small>` : ""}</span><span class="granica ${NAZWY_GRANIC[t][1]}">${NAZWY_GRANIC[t][0]}</span></button></li>`; }).join("")}</ul>`
      : `<p class="opis-sekcji">Brak sąsiadów lądowych — wyspa.</p>`}</section></article>`;
  glowny.querySelectorAll(".sasiedzi button").forEach(b => b.onclick = () => { const q = PROWINCJE[b.dataset.i - 1]; pokazProwincje(+b.dataset.i); mapa.pokaz(q.x, q.y); });
  const form = glowny.querySelector(".edycja-prowincji");
  if (form) form.onchange = () => {
    const v = Object.fromEntries(new FormData(form)), n = { wlasciciel: v.wlasciciel, nazwa: v.nazwa.trim(), opis: v.opis.trim() };
    stan.prowincje ??= {};
    if (Object.values(n).some(Boolean)) stan.prowincje[p.id] = Object.fromEntries(Object.entries(n).filter(([, w]) => w)); else delete stan.prowincje[p.id];
    zapiszProwincje([["p", p.id]]); kolorujMape(); pokazProwincje(i, true);
  };
  if (!zostanPrzewiniecie) glowny.scrollTop = 0;
  otworzSzuflade();
  requestAnimationFrame(() => mapa.doWidoku(p.x, p.y));   // po zwężeniu mapy przez szufladę
}
// edycję (zasoby, stany, tury, jednostki, statusy bohaterów) widzą tylko GM i admin; w DEMO każdy — ustawiane po zalogowaniu
let gm = !CHMURA;
// część tajna: f._brak[rodzaj] = tej części nie wolno czytać (magazyn jej nie wczytał); f.jawne[rodzaj] = GM ujawnił ją wszystkim
const RODZAJE_TAJNE = { zasoby: "Zasoby", jednostki: "Jednostki", statusy: "Statusy bohaterów" };
const tajne = (f, r) => Boolean(f._brak?.[r]);
const kłódka = `<p class="tajne">🔒 Tajne — widzi tylko gracz tej frakcji i GM.</p>`;
const moja = f => Boolean(profil?.frakcja) && profil.frakcja === f.id;
// znacznik przy nagłówku dla tych, którzy widzą tajne dane: czy reszta graczy też to widzi
const znacznik = (f, r) => gm || moja(f) ? `<span class="znacznik">${f.jawne?.[r] ? "👁 jawne" : "🔒 tajne"}</span>` : "";
// stany zasobów frakcji: globalne w f.stany[id], unikalne w z.ilosc
// pole tekstowe zamiast number, żeby wklejone „1 234” też przeszło
const liczba = w => { const t = w.replace(/[\s ]/g, ""); return t === "" ? undefined : /^-?\d+$/.test(t) ? +t : null; };
// tury: stan.tury = [{ nr, data, frakcje: { id: { stany: {idZasobu: n}, unikalne: {nazwa: n} } } }] — migawki z końca tury
// zmiana +/- = obecna wartość minus wartość z ostatniej migawki (unikalne po nazwie, bo nie mają id)
const ostatniaTura = () => stan.tury.at(-1);
const zmiana = (wartosc, poprzednia) => {
  if (!ostatniaTura() || wartosc === undefined || poprzednia === undefined || wartosc === poprzednia) return "";
  const r = wartosc - poprzednia;
  return `<span class="zmiana ${r > 0 ? "plus" : "minus"}" title="Zmiana od końca tury ${ostatniaTura().nr}">${r > 0 ? "+" : "−"}${Math.abs(r)}</span>`;
};
const poprzednia = (f, p) => {
  const m = ostatniaTura()?.frakcje[f.id];
  return p.dataset.unikalny !== undefined ? m?.unikalne[f.zasoby[p.dataset.unikalny].nazwa] : m?.stany[p.dataset.id];
};
const wierszStanu = (z, wartosc, dane, pop) => `<li>${ikonaZasobu(z)}<span class="nazwa">${esc(z.nazwa)}</span>
  ${gm ? `<input ${dane} value="${wartosc ?? ""}" inputmode="numeric" placeholder="—" aria-label="Stan: ${esc(z.nazwa)}">` : `<span class="wartosc">${wartosc ?? "—"}</span>`}<span class="jednostka">${esc(z.jednostka || "")}</span>
  <span class="miejsce-zmiany">${zmiana(wartosc, pop)}</span></li>`;
const stany = f => {
  if (tajne(f, "zasoby")) return `<section class="stany"><h3>Zasoby</h3>${kłódka}</section>`;
  const m = ostatniaTura()?.frakcje[f.id];
  return `<section class="stany"><h3>Zasoby <span class="tura">tura ${stan.tury.length + 1}</span>${znacznik(f, "zasoby")}</h3>
  ${m ? `<p class="opis-sekcji">Obok stanu: zmiana od końca tury ${ostatniaTura().nr}.</p>` : ""}<ul class="tabela-zasobow">
  ${stan.zasoby.map(z => wierszStanu(z, f.stany?.[z.id], `data-id="${esc(z.id)}"`, m?.stany[z.id])).join("")}
  ${f.zasoby.map((z, i) => wierszStanu({ ...z, ikona: "" }, z.ilosc, `data-unikalny="${i}"`, m?.unikalne[z.nazwa])).join("")}</ul></section>`;
};
function podepnijStany(f) {
  if (!gm || tajne(f, "zasoby")) return;
  glowny.querySelectorAll(".tabela-zasobow input").forEach(p => p.onchange = () => {
    const n = liczba(p.value), u = p.dataset.unikalny;
    const stary = u !== undefined ? f.zasoby[u].ilosc : f.stany?.[p.dataset.id];
    if (n === null) { p.value = stary ?? ""; p.setAttribute("aria-invalid", "true"); p.title = "Wpisz liczbę całkowitą"; return; }
    p.removeAttribute("aria-invalid"); p.title = ""; p.value = n ?? "";
    if (u !== undefined) { if (n === undefined) delete f.zasoby[u].ilosc; else f.zasoby[u].ilosc = n; }
    else { f.stany ??= {}; if (n === undefined) delete f.stany[p.dataset.id]; else f.stany[p.dataset.id] = n; }
    p.parentElement.querySelector(".miejsce-zmiany").innerHTML = zmiana(n, poprzednia(f, p));
    zapisz(stan);
  });
}
// unikalne zasoby frakcji
const zasoby = f => tajne(f, "zasoby") ? "" : `<section class="unikalne"><h3>Unikalne zasoby</h3>
  <ul class="zasoby">${f.zasoby.map((z, i) => `<li><span><b>${esc(z.nazwa)}</b>${z.jednostka ? ` (${esc(z.jednostka)})` : ""}${z.opis ? ` — ${esc(z.opis)}` : ""}</span>
    ${gm ? `<button type="button" class="usun" data-i="${i}" aria-label="Usuń zasób ${esc(z.nazwa)}" title="Usuń">×</button>` : ""}</li>`).join("")
    || `<li class="puste">${gm ? "Brak — dodaj pierwszy zasób." : "Brak."}</li>`}</ul>
  ${gm ? `<form class="dodaj-zasob"><input name="nazwa" required maxlength="60" placeholder="Nazwa zasobu" aria-label="Nazwa zasobu">
    <input name="jednostka" maxlength="12" placeholder="Jednostka" aria-label="Jednostka zasobu" class="krotkie">
    <input name="opis" maxlength="200" placeholder="Opis (opcjonalnie)" aria-label="Opis zasobu"><button class="dodaj">Dodaj</button></form>` : ""}</section>`;
function podepnijZasoby(f) {
  if (!gm || tajne(f, "zasoby")) return;
  glowny.querySelector(".dodaj-zasob").onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.target), nazwa = d.get("nazwa").trim();
    if (!nazwa) return;
    f.zasoby.push({ nazwa, jednostka: d.get("jednostka").trim(), opis: d.get("opis").trim() }); zapisz(stan); wybierz(f.id, true);
    glowny.querySelector(".dodaj-zasob input").focus();
  };
  glowny.querySelectorAll(".zasoby .usun").forEach(b => b.onclick = () => {
    const z = f.zasoby[b.dataset.i];
    if (confirm(`Usunąć zasób „${z.nazwa}”?`)) { f.zasoby.splice(b.dataset.i, 1); zapisz(stan); wybierz(f.id, true); }
  });
}
// jednostki: f.jednostki = [{ nazwa, opis, poziom }], poziom = indeks w POZIOMY; bez kosztów, dopóki GM nie ustali mechaniki
const POZIOMY = ["Chołota", "Regularne", "Elita"];
const polaJednostki = (j = {}) => `<input name="nazwa" required maxlength="60" value="${esc(j.nazwa || "")}" placeholder="Nazwa jednostki" aria-label="Nazwa jednostki">
  <select name="poziom" aria-label="Poziom elitarności">${POZIOMY.map((p, i) => `<option value="${i}"${i === (j.poziom ?? 1) ? " selected" : ""}>${p}</option>`).join("")}</select>
  <textarea name="opis" maxlength="600" rows="2" placeholder="Opis, wyposażenie (opcjonalnie)" aria-label="Opis jednostki">${esc(j.opis || "")}</textarea>`;
const jednostki = f => {
  if (tajne(f, "jednostki")) return `<section class="jednostki"><h3>Jednostki</h3>${kłódka}</section>`;
  const lista = f.jednostki ??= [];
  return `<section class="jednostki"><h3>Jednostki${znacznik(f, "jednostki")}</h3>
  ${POZIOMY.map((p, poz) => { const w = lista.map((j, i) => [j, i]).filter(([j]) => j.poziom === poz); return w.length ? `<h4>${p}</h4><ul class="lista-jednostek">${w.map(([j, i]) =>
    `<li data-i="${i}"><span><b>${esc(j.nazwa)}</b>${j.opis ? ` — ${esc(j.opis)}` : ""}</span>
      ${gm ? `<span class="akcje"><button type="button" class="usun" data-akcja="edytuj" aria-label="Edytuj jednostkę ${esc(j.nazwa)}" title="Edytuj">✎</button>
      <button type="button" class="usun" data-akcja="usun" aria-label="Usuń jednostkę ${esc(j.nazwa)}" title="Usuń">×</button></span>` : ""}</li>`).join("")}</ul>` : ""; }).join("")
    || `<p class="puste">${gm ? "Brak — dodaj pierwszą jednostkę." : "Brak."}</p>`}
  ${gm ? `<form class="dodaj-jednostke">${polaJednostki()}<button class="dodaj">Dodaj</button></form>` : ""}</section>`;
};
function podepnijJednostki(f) {
  if (!gm || tajne(f, "jednostki")) return;
  const odczyt = form => { const d = new FormData(form); return { nazwa: d.get("nazwa").trim(), opis: d.get("opis").trim(), poziom: +d.get("poziom") }; };
  glowny.querySelector(".dodaj-jednostke").onsubmit = e => {
    e.preventDefault(); const j = odczyt(e.target); if (!j.nazwa) return;
    f.jednostki.push(j); zapisz(stan); wybierz(f.id, true);
    glowny.querySelector(".dodaj-jednostke input").focus();
  };
  glowny.querySelectorAll(".lista-jednostek li").forEach(li => {
    const j = f.jednostki[li.dataset.i];
    li.querySelector("[data-akcja=usun]").onclick = () => {
      if (confirm(`Usunąć jednostkę „${j.nazwa}”?`)) { f.jednostki.splice(li.dataset.i, 1); zapisz(stan); wybierz(f.id, true); }
    };
    li.querySelector("[data-akcja=edytuj]").onclick = () => {
      li.innerHTML = `<form class="edytuj-jednostke">${polaJednostki(j)}<button class="dodaj">Zapisz</button><button type="button" class="cofnij">Anuluj</button></form>`;
      const form = li.querySelector("form"); form.nazwa.focus();
      form.querySelector(".cofnij").onclick = () => wybierz(f.id, true);
      form.onsubmit = e => { e.preventDefault(); const n = odczyt(form); if (!n.nazwa) return; Object.assign(j, n); zapisz(stan); wybierz(f.id, true); };
    };
  });
}
// widoczność (GM): przełączniki tajne/jawne per rodzaj danych tej frakcji
const widocznosc = f => !gm || !CHMURA ? "" : `<section class="widocznosc"><h3>Widoczność dla innych graczy</h3>
  <p class="opis-sekcji">Tajne widzi tylko gracz tej frakcji i GM. Jawne — wszyscy.</p><div class="przelaczniki">${Object.entries(RODZAJE_TAJNE).map(([r, n]) =>
    `<button type="button" class="przelacznik${f.jawne?.[r] ? " jawne" : ""}" data-rodzaj="${r}" aria-pressed="${Boolean(f.jawne?.[r])}">${n}: ${f.jawne?.[r] ? "👁 jawne" : "🔒 tajne"}</button>`).join("")}</div></section>`;
// notatki: gracza (pisze gracz tej frakcji i GM, czyta on + GM), GM (tylko GM/admin); zapis po wyjściu z pola
const notatki = f => {
  const pole = (klucz, tytul, opis, mozna) => `<section class="notatki"><h3>${tytul}</h3><p class="opis-sekcji">${opis}</p>
    ${mozna ? `<textarea data-klucz="${klucz}" rows="4" maxlength="5000" aria-label="${tytul}">${esc(f[klucz] || "")}</textarea>` : f[klucz] ? tekst(f[klucz]) : `<p class="puste">Pusto.</p>`}</section>`;
  return (f._brak?.notatkiGracza ? "" : pole("notatkiGracza", "Notatki gracza", "Widzi gracz tej frakcji i GM.", gm || moja(f)))
    + (f._brak?.notatkiGM || !gm ? "" : pole("notatkiGM", "Notatki GM", "Widzi tylko GM i admin.", true));
};
function podepnijTajne(f) {
  glowny.querySelectorAll(".przelacznik").forEach(b => b.onclick = () => {
    const r = b.dataset.rodzaj; f.jawne = { ...f.jawne, [r]: !f.jawne?.[r] }; zapisz(stan); wybierz(f.id, true);
  });
  glowny.querySelectorAll(".notatki textarea").forEach(t => t.onchange = () => { f[t.dataset.klucz] = t.value; zapisz(stan); });
}
// edycja opisów: GM zapisuje od razu, gracz swojego państwa wysyła propozycję do GM (etap 4.4)
const POLA_FRAKCJI = [["stolica", "Stolica"], ["ustroj", "Ustrój"], ["wladca", "Władca"], ["godlo", "Godło"], ["motto", "Motto"], ["specjalizacja", "Specjalizacja"], ["tereny", "Tereny"]];
const POLA_BOHATERA = [["tytul", "Tytuł"], ["funkcja", "Funkcja"], ["wiek", "Wiek"], ["bron", "Broń i wierzchowiec"], ["opis", "Opis", "dlugie"]];
const etykieta = k => [...POLA_FRAKCJI, ...POLA_BOHATERA].find(([x]) => x === k)?.[1] || (k === "opis" ? "Opis" : k);
const mozeEdytowac = f => gm || (CHMURA && moja(f));
const sekcjaEdycji = (s = { tytul: "", tekst: "" }) => `<li><input class="tytul-sekcji" maxlength="100" value="${esc(s.tytul)}" placeholder="Tytuł sekcji" aria-label="Tytuł sekcji">
  <button type="button" class="usun" aria-label="Usuń sekcję" title="Usuń sekcję">×</button>
  <textarea class="tekst-sekcji" rows="6" maxlength="20000" aria-label="Treść sekcji">${esc(s.tekst)}</textarea></li>`;
function formularzEdycji({ naglowek, pola, wartosci, sekcje, onZapisz }) {
  okno.innerHTML = `<form class="edycja"><div class="okno-glowa"><div><h2>${esc(naglowek)}</h2>
      <p class="rasa">${gm ? "Zmiany zapiszą się od razu." : "Zmiany trafią do GM do akceptacji."}</p></div><button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    <div class="pola-edycji">${pola.map(([k, n, typ]) => `<label>${n}${typ === "dlugie"
      ? `<textarea name="${k}" rows="8" maxlength="20000">${esc(wartosci[k] || "")}</textarea>` : `<input name="${k}" maxlength="300" value="${esc(wartosci[k] || "")}">`}</label>`).join("")}</div>
    ${sekcje ? `<h3>Sekcje opisu</h3><ol class="sekcje-edycji">${sekcje.map(sekcjaEdycji).join("")}</ol><button type="button" class="cofnij" id="dodaj-sekcje">+ Dodaj sekcję</button>` : ""}
    <p class="przyciski-tur"><button class="dodaj">${gm ? "Zapisz" : "Wyślij propozycję"}</button><button type="button" class="cofnij anuluj">Anuluj</button></p></form>`;
  const form = okno.querySelector("form"), ol = form.querySelector(".sekcje-edycji");
  form.querySelectorAll(".zamknij, .anuluj").forEach(b => b.onclick = () => okno.close());
  if (ol) {
    ol.onclick = e => e.target.closest(".usun")?.closest("li").remove();
    form.querySelector("#dodaj-sekcje").onclick = () => { ol.insertAdjacentHTML("beforeend", sekcjaEdycji()); ol.lastElementChild.querySelector("input").focus(); };
  }
  form.onsubmit = e => {
    e.preventDefault();
    const nowe = Object.fromEntries(pola.map(([k]) => [k, form.elements[k].value.trim()]));
    if (ol) nowe.opis = [...ol.children].map(li => ({ tytul: li.querySelector(".tytul-sekcji").value.trim(), tekst: li.querySelector(".tekst-sekcji").value.trim() }))
      .filter(s => s.tytul || s.tekst);
    onZapisz(nowe);
  };
  okno.showModal();
}
async function zapiszEdycje(cel, obiekt, f, nowe) {
  const zmiany = {}, przed = {};
  for (const k in nowe) if (JSON.stringify(nowe[k] ?? "") !== JSON.stringify(obiekt[k] ?? "")) { zmiany[k] = nowe[k]; przed[k] = obiekt[k] ?? ""; }
  if (!Object.keys(zmiany).length) return okno.close();
  if (gm) { Object.assign(obiekt, zmiany); zapisz(stan); okno.close(); return wybierz(f.id, true); }
  try {
    await zaproponuj({ frakcja: f.id, cel, celId: obiekt.id, nazwa: cel === "frakcja" ? f.nazwa : obiekt.imie, zmiany, przed });
    okno.close(); alert("Propozycja wysłana do GM. Jej status zobaczysz na karcie swojego państwa.");
  } catch (e) { alert("Nie udało się wysłać propozycji: " + komunikat(e)); }
}
const edytujFrakcje = f => formularzEdycji({ naglowek: `${f.nazwa} — opis`, pola: POLA_FRAKCJI, wartosci: f, sekcje: f.opis,
  onZapisz: nowe => zapiszEdycje("frakcja", f, f, nowe) });
const edytujBohatera = (h, f) => formularzEdycji({ naglowek: h.imie, pola: POLA_BOHATERA, wartosci: h, onZapisz: nowe => zapiszEdycje("bohater", h, f, nowe) });
// propozycje: GM widzi oczekujące (Panel GM + licznik na przycisku), gracz — swoje na karcie państwa
let propozycje = [], odpieciePropozycji = () => {};
const STATUS_PROP = { czeka: "czeka na GM", przyjeta: "przyjęta", odrzucona: "odrzucona" };
const odznaka = () => { document.getElementById("panel-gm").textContent = gm && propozycje.length ? `Panel GM (${propozycje.length})` : "Panel GM"; };
function sluchajPropozycjiDlaRoli() {
  odpieciePropozycji(); odpieciePropozycji = () => {}; propozycje = []; odznaka();
  if (!CHMURA || !profil || profil.rola === "oczekujacy" || (!gm && !profil.frakcja)) return;
  odpieciePropozycji = sluchajPropozycji(gm, l => { propozycje = l; odznaka(); if (widok === "gm" || widok === profil.frakcja) odswiezWidok(); },
    e => console.warn("propozycje", e.code));
}
const celPropozycji = p => p.cel === "frakcja" ? stan.frakcje.find(f => f.id === p.celId) : stan.bohaterowie.find(h => h.id === p.celId);
const wartoscTekstem = v => v ? tekst(String(v)) : `<p class="puste">puste</p>`;
function zmianaPola(k, stare, nowe) {
  if (k !== "opis" || !Array.isArray(nowe)) return `<div class="zmiana-pola"><h5>${esc(etykieta(k))}</h5>
    <div class="przed">${wartoscTekstem(stare)}</div><div class="po">${wartoscTekstem(nowe)}</div></div>`;
  const st = new Map((stare || []).map(s => [s.tytul, s.tekst])), nw = new Map(nowe.map(s => [s.tytul, s.tekst]));
  const tytuly = [...new Set([...st.keys(), ...nw.keys()])].filter(t => st.get(t) !== nw.get(t));
  return tytuly.map(t => `<div class="zmiana-pola"><h5>Sekcja „${esc(t || "bez tytułu")}” — ${!st.has(t) ? "nowa" : !nw.has(t) ? "usunięta" : "zmieniona"}</h5>
    <div class="przed">${wartoscTekstem(st.get(t))}</div><div class="po">${wartoscTekstem(nw.get(t))}</div></div>`).join("")
    + (tytuly.length ? "" : `<div class="zmiana-pola"><h5>Kolejność sekcji opisu</h5></div>`);
}
const kartaPropozycji = p => {
  const o = celPropozycji(p), konflikt = o && Object.keys(p.zmiany).some(k => JSON.stringify(o[k] ?? "") !== JSON.stringify(p.przed?.[k] ?? ""));
  return `<article class="propozycja" data-id="${esc(p.id)}"><header><b>${esc(p.nazwa)}</b> <small>${p.cel === "frakcja" ? "państwo" : "bohater"} · od ${esc(p.email)} · ${esc(new Date(p.czas).toLocaleString("pl-PL"))}</small></header>
    ${!o ? `<p class="ostrzezenie">⚠ Tego ${p.cel === "frakcja" ? "państwa" : "bohatera"} już nie ma — można tylko odrzucić.</p>` : konflikt ? `<p class="ostrzezenie">⚠ Od czasu propozycji ktoś zmienił te pola — akceptacja nadpisze obecną wersję.</p>` : ""}
    ${Object.keys(p.zmiany).map(k => zmianaPola(k, p.przed?.[k], p.zmiany[k])).join("")}
    <label class="komentarz">Komentarz dla gracza (opcjonalnie)<input name="komentarz" maxlength="500"></label>
    <p class="przyciski-tur">${o ? `<button type="button" class="dodaj" data-akcja="przyjmij">Akceptuj</button>` : ""}<button type="button" class="cofnij" data-akcja="odrzuc">Odrzuć</button></p></article>`;
};
const propozycjeSekcja = () => !CHMURA || !gm ? "" : `<section class="propozycje"><h3>Propozycje graczy${propozycje.length ? ` <span class="licznik">${propozycje.length}</span>` : ""}</h3>
  ${propozycje.length ? propozycje.map(kartaPropozycji).join("") : `<p class="puste">Brak oczekujących propozycji.</p>`}</section>`;
const mojePropozycje = f => !CHMURA || gm || !moja(f) || !propozycje.length ? "" : `<section class="propozycje"><h3>Twoje propozycje</h3>
  <ul class="lista-propozycji">${propozycje.map(p => `<li data-id="${esc(p.id)}"><span><b>${esc(p.nazwa)}</b>: ${esc(Object.keys(p.zmiany).map(etykieta).join(", "))}
    <span class="status-prop s-${p.status}">${STATUS_PROP[p.status] || p.status}</span>${p.komentarz ? `<br><small>GM: ${esc(p.komentarz)}</small>` : ""}</span>
    ${p.status === "czeka" ? `<button type="button" class="cofnij" data-akcja="wycofaj">Wycofaj</button>` : ""}</li>`).join("")}</ul></section>`;
function podepnijPropozycje() {
  glowny.querySelectorAll("[data-akcja=wycofaj]").forEach(b => b.onclick = () => {
    if (confirm("Wycofać tę propozycję?")) wycofaj(b.closest("li").dataset.id).catch(e => alert("Nie udało się: " + komunikat(e)));
  });
  glowny.querySelectorAll(".propozycja").forEach(a => a.querySelectorAll("[data-akcja]").forEach(b => b.onclick = async () => {
    const p = propozycje.find(x => x.id === a.dataset.id), kom = a.querySelector("[name=komentarz]").value.trim();
    a.querySelectorAll("button").forEach(x => x.disabled = true);
    try {
      if (b.dataset.akcja === "przyjmij") { Object.assign(celPropozycji(p), p.zmiany); zapisz(stan); await rozpatrz(p.id, "przyjeta", kom); }
      else await rozpatrz(p.id, "odrzucona", kom);
    } catch (e) { alert("Nie udało się: " + komunikat(e)); a.querySelectorAll("button").forEach(x => x.disabled = false); }
  }));
}
// bohaterowie: siatka kart + okno ze szczegółami; status zmienia GM/admin
const STATUSY = { stolica: "W stolicy", misja: "Na misji", ranny: "Ranny", martwy: "Martwy" };
const MISJE = ["z armią", "z flotą", "inne"];
const statusTekst = h => STATUSY[h.status] + (h.status === "misja" && h.misja ? ` (${h.misja})` : "");
const inicjaly = imie => imie.replace(/[„”"]/g, "").split(/\s+/).filter(s => /^\p{Lu}/u.test(s)).slice(0, 2).map(s => s[0]).join("") || imie[0];
// pixel art 128 px, a gdy go nie ma — inicjały na tle w kolorze frakcji
const portret = (h, duzy) => {
  const url = plikPortretu(h);
  return `<div class="portret${duzy ? " duzy" : ""}" aria-hidden="true">${url ? `<img src="${url}" alt="">` : esc(inicjaly(h.imie))}</div>`;
};
const bohaterowie = f => {
  const lista = stan.bohaterowie.filter(h => h.frakcja === f.id).sort((a, b) => b.wladca - a.wladca);
  return `<section><h3>Bohaterowie${znacznik(f, "statusy")}</h3><div class="bohaterowie">${lista.map(h => `<button type="button" class="bohater" data-id="${h.id}">
    ${portret(h)}<span class="imie">${esc(h.imie)}</span>${h.wladca ? `<span class="wladca">Władca</span>` : ""}
    <span class="tytul">${esc(h.tytul || h.funkcja)}</span>${h._brak ? "" : `<span class="status s-${h.status}">${esc(statusTekst(h))}</span>`}</button>`).join("")}</div></section>`;
};
const okno = document.getElementById("bohater");
function pokazBohatera(h, f) {
  const pola = [["Tytuł", h.tytul], ["Funkcja", h.funkcja], ["Wiek", h.wiek], ["Broń i wierzchowiec", h.bron]].filter(([, w]) => w);
  okno.style.setProperty("--kolor", f.kolor);
  okno.innerHTML = `<div class="okno-glowa">${portret(h, true)}<div><h2>${esc(h.imie)}</h2><p class="rasa">${esc(f.nazwa)}${h.wladca ? " · władca" : ""}</p>
      ${mozeEdytowac(f) ? `<button type="button" class="cofnij edytuj-bohatera">${gm ? "✎ Edytuj" : "✎ Zaproponuj zmiany"}</button>` : ""}</div>
      <button type="button" class="zamknij" aria-label="Zamknij">×</button></div>
    <dl class="fakty">${pola.map(([k, w]) => `<div><dt>${k}</dt><dd>${esc(w)}</dd></div>`).join("")}</dl>
    ${gm ? "" : h._brak ? `<p class="status-tekst">Status: 🔒 tajny</p>` : `<p class="status-tekst">Status: <span class="status s-${h.status}">${esc(statusTekst(h))}</span></p>`}
    <form class="status-form"${gm ? "" : " hidden"}><label>Status <select name="status">${Object.entries(STATUSY).map(([k, w]) => `<option value="${k}"${k === h.status ? " selected" : ""}>${w}</option>`).join("")}</select></label>
      <label${h.status === "misja" ? "" : " hidden"}>Misja <select name="misja">${MISJE.map(m => `<option${m === h.misja ? " selected" : ""}>${m}</option>`).join("")}</select></label></form>
    <div class="opis">${h.opis ? tekst(h.opis) : `<p class="puste">Gracz nie dodał jeszcze opisu.</p>`}</div>`;
  okno.querySelector(".zamknij").onclick = () => okno.close();
  const edytuj = okno.querySelector(".edytuj-bohatera"); if (edytuj) edytuj.onclick = () => edytujBohatera(h, f);
  okno.querySelector(".status-form").onchange = e => {
    const d = new FormData(e.currentTarget); h.status = d.get("status"); h.misja = h.status === "misja" ? d.get("misja") : "";
    e.currentTarget.elements.misja.parentElement.hidden = h.status !== "misja";
    zapisz(stan); wybierz(f.id, true);
  };
  okno.showModal();
}
okno.onclick = e => { if (e.target === okno) okno.close(); }; // klik w tło zamyka
let widok = null; // co jest otwarte: id frakcji albo "gm" — do odświeżenia po zmianach od innych osób
function wybierz(id, zostanPrzewiniecie) {
  const f = stan.frakcje.find(x => x.id === id) || stan.frakcje[0]; widok = f.id; mapa.wybierz(0);
  [...lista.children].forEach(b => b.setAttribute("aria-current", b.dataset.id === f.id));
  glowny.style.setProperty("--kolor", f.kolor);
  const pola = [["Stolica", f.stolica], ["Ustrój", f.ustroj], ["Władca", f.wladca], ["Godło", f.godlo],
    ["Specjalizacja", f.specjalizacja], ["Tereny", f.tereny]].filter(([, w]) => w);
  glowny.innerHTML = `<article class="karta">
    <header class="naglowek">${herbFrakcji(f) ? `<img class="herb-obraz" src="${herbFrakcji(f)}" alt="">` : `<div class="herb" aria-hidden="true">${esc(f.nazwa[0])}</div>`}
      <div><h2>${esc(f.nazwa)}</h2><p class="rasa">${esc([f.przydomek, f.rasa].filter(Boolean).join(" · "))}</p>
      ${mozeEdytowac(f) ? `<button type="button" class="cofnij edytuj-opis">${gm ? "✎ Edytuj opis" : "✎ Zaproponuj zmiany"}</button>` : ""}</div></header>
    ${f.motto ? `<blockquote class="motto">„${esc(f.motto)}”</blockquote>` : ""}
    <dl class="fakty">${pola.map(([k, w]) => `<div><dt>${k}</dt><dd>${esc(w)}</dd></div>`).join("")}</dl>
    ${bohaterowie(f)}
    ${stany(f)}
    ${zasoby(f)}
    ${jednostki(f)}
    ${mojePropozycje(f)}
    ${notatki(f)}
    ${widocznosc(f)}
    ${f.opis.map(s => `<section><h3>${esc(s.tytul)}</h3>${tekst(s.tekst)}</section>`).join("")}
  </article>`;
  podepnijStany(f); podepnijZasoby(f); podepnijJednostki(f); podepnijTajne(f); podepnijPropozycje();
  const edytuj = glowny.querySelector(".edytuj-opis"); if (edytuj) edytuj.onclick = () => edytujFrakcje(f);
  glowny.querySelectorAll(".bohater").forEach(b => b.onclick = () => pokazBohatera(stan.bohaterowie.find(h => h.id === b.dataset.id), f));
  if (!zostanPrzewiniecie) glowny.scrollTop = 0;
  otworzSzuflade();
}
// Panel GM: globalne typy zasobów; w DEMO edytuje każdy, w etapie 4 tylko GM/admin
const ikonaZasobu = z => ikony[`../assets/ikony/${z.ikona}.png`]
  ? `<img class="ikona" src="${ikony[`../assets/ikony/${z.ikona}.png`]}" alt="">` : `<span class="ikona litera" aria-hidden="true">${esc(z.nazwa[0] || "?")}</span>`;
function pokazPanelGM(zostanPrzewiniecie) {
  widok = "gm"; mapa.wybierz(0);
  [...lista.children].forEach(b => b.setAttribute("aria-current", false));
  glowny.style.removeProperty("--kolor");
  const z = stan.zasoby, ost = z.length - 1;
  glowny.innerHTML = `<article class="karta panel-gm"><h2>Panel GM</h2>
    ${propozycjeSekcja()}
    <section><h3>Typy zasobów</h3><p class="opis-sekcji">Wspólne dla wszystkich frakcji. Unikalne zasoby frakcji edytujesz na jej karcie.</p>
    <ol class="typy-zasobow">${z.map((t, i) => `<li data-i="${i}">${ikonaZasobu(t)}
      <input name="nazwa" value="${esc(t.nazwa)}" required maxlength="40" aria-label="Nazwa zasobu">
      <input name="jednostka" value="${esc(t.jednostka)}" maxlength="12" placeholder="jednostka" aria-label="Jednostka zasobu ${esc(t.nazwa)}">
      <button type="button" class="usun" data-akcja="gora" aria-label="Przesuń ${esc(t.nazwa)} wyżej" title="Wyżej"${i ? "" : " disabled"}>↑</button>
      <button type="button" class="usun" data-akcja="dol" aria-label="Przesuń ${esc(t.nazwa)} niżej" title="Niżej"${i < ost ? "" : " disabled"}>↓</button>
      <button type="button" class="usun" data-akcja="usun" aria-label="Usuń zasób ${esc(t.nazwa)}" title="Usuń">×</button></li>`).join("")
      || `<li class="puste">Brak — dodaj pierwszy zasób.</li>`}</ol>
    <form class="dodaj-zasob"><input name="nazwa" required maxlength="40" placeholder="Nazwa zasobu" aria-label="Nazwa nowego zasobu">
      <input name="jednostka" maxlength="12" placeholder="Jednostka (opcjonalnie)" aria-label="Jednostka nowego zasobu"><button class="dodaj">Dodaj</button></form></section>
    <section><h3>Tury</h3><p>Trwa <b>tura ${stan.tury.length + 1}</b>. Zamknięcie zapisuje stany zasobów wszystkich frakcji — na kartach pokaże się zmiana +/- od tego momentu. Obecnych liczb nie zmienia.</p>
      <p class="przyciski-tur"><button type="button" class="dodaj" id="zamknij-ture">Zamknij turę ${stan.tury.length + 1}</button>
      ${ostatniaTura() ? `<button type="button" class="cofnij" id="cofnij-ture">Cofnij zamknięcie tury ${ostatniaTura().nr}</button>` : ""}</p>
      ${stan.tury.length ? `<ul class="lista-tur">${stan.tury.map(t => `<li>Tura ${t.nr} — zamknięta ${esc(new Date(t.data).toLocaleString("pl-PL"))}</li>`).reverse().join("")}</ul>` : ""}</section>
    ${npcSekcja()}
    ${uzytkownicySekcja()}
    ${logiSekcja()}
    ${diagnostykaSekcja()}
    ${porzadkiSekcja()}
    ${kopiaSekcja()}</article>`;
  const odswiez = () => { zapisz(stan); pokazPanelGM(true); };
  glowny.querySelector("#zamknij-ture").onclick = () => {
    const nr = stan.tury.length + 1;
    if (!confirm(`Zamknąć turę ${nr}? Stany zasobów wszystkich frakcji zostaną zapisane. Można to cofnąć.`)) return;
    stan.tury.push({ nr, data: new Date().toISOString(), frakcje: Object.fromEntries(stan.frakcje.map(f => [f.id, {
      stany: { ...f.stany }, unikalne: Object.fromEntries(f.zasoby.filter(z => z.ilosc !== undefined).map(z => [z.nazwa, z.ilosc])) }])) });
    odswiez();
  };
  const cofnij = glowny.querySelector("#cofnij-ture");
  if (cofnij) cofnij.onclick = () => {
    // usuwa tylko migawkę; obecne stany zostają, więc pomyłkowe zamknięcie nic nie psuje
    if (!confirm(`Cofnąć zamknięcie tury ${ostatniaTura().nr}? Wróci tura ${ostatniaTura().nr}, a zmiany +/- będą liczone od poprzedniej migawki.`)) return;
    stan.tury.pop(); odswiez();
  };
  glowny.querySelectorAll(".typy-zasobow li[data-i]").forEach(li => {
    const t = z[li.dataset.i];
    li.querySelectorAll("input").forEach(p => p.onchange = () => {
      const w = p.value.trim();
      if (p.name === "nazwa" && !w) { p.value = t.nazwa; return; } // pustej nazwy nie zapisujemy
      t[p.name] = w; zapisz(stan); // bez przerysowania, żeby Tab nie gubił kursora
    });
    li.querySelectorAll("button").forEach(b => b.onclick = () => {
      const i = +li.dataset.i, a = b.dataset.akcja;
      if (a === "usun") {
        if (!confirm(`Usunąć zasób „${t.nazwa}” u wszystkich frakcji?`)) return;
        z.splice(i, 1); stan.frakcje.forEach(f => delete f.stany?.[t.id]); // bez osieroconych stanów pod tym id
      }
      else { const j = a === "gora" ? i - 1 : i + 1; [z[i], z[j]] = [z[j], z[i]]; }
      odswiez();
    });
  });
  glowny.querySelector(".dodaj-zasob").onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.target), nazwa = d.get("nazwa").trim();
    if (!nazwa) return;
    // id z nazwy, unikalne; zostaje na stałe nawet po zmianie nazwy
    const baza = nazwa.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "zasob";
    let id = baza, n = 2; while (z.some(t => t.id === id)) id = `${baza}-${n++}`;
    z.push({ id, nazwa, jednostka: d.get("jednostka").trim(), ikona: "" }); odswiez();
    glowny.querySelector(".dodaj-zasob input").focus();
  };
  podepnijNpc(); podepnijUzytkownikow(); podepnijPropozycje(); podepnijLogi(); podepnijDiagnostyke(); podepnijPorzadki(); podepnijKopie();
  if (!zostanPrzewiniecie) glowny.scrollTop = 0;
  otworzSzuflade();
}
// kraje NPC (wasale, marionetki): nazwa, rodzaj, zwierzchnik, opis; kolor = odcień zwierzchnika
const opcjeZwierzchnika = w => stan.frakcje.map(f => `<option value="${esc(f.id)}"${f.id === w ? " selected" : ""}>${esc(f.nazwa)}</option>`).join("");
const opcjeRodzaju = w => Object.entries(RODZAJE_NPC).map(([k, n]) => `<option value="${k}"${k === w ? " selected" : ""}>${n}</option>`).join("");
const ileProwincji = wl => Object.values(stan.prowincje || {}).filter(d => d.wlasciciel === wl).length;
const npcSekcja = () => `<section class="npc"><h3>Kraje NPC</h3><p class="opis-sekcji">Wasale i marionetki frakcji. Na mapie mają kolor w odcieniu zwierzchnika; prowincje przypisujesz w karcie prowincji (klik w mapę).</p>
  <ul class="lista-npc">${Object.entries(stan.npc || {}).sort((a, b) => a[1].nazwa.localeCompare(b[1].nazwa, "pl")).map(([id, n]) => `<li data-id="${esc(id)}">
    <span class="probka" style="background:${kolorNpc(id)}" title="Kolor na mapie"></span>
    <input name="nazwa" required maxlength="60" value="${esc(n.nazwa)}" aria-label="Nazwa kraju NPC">
    <select name="rodzaj" aria-label="Rodzaj: ${esc(n.nazwa)}">${opcjeRodzaju(n.rodzaj)}</select>
    <select name="zwierzchnik" aria-label="Zwierzchnik: ${esc(n.nazwa)}">${opcjeZwierzchnika(n.zwierzchnik)}</select>
    <span class="ile">${ileProwincji("npc:" + id)} prow.</span>
    <button type="button" class="usun" aria-label="Usuń kraj ${esc(n.nazwa)}" title="Usuń">×</button>
    <textarea name="opis" rows="2" maxlength="2000" placeholder="Opis (opcjonalnie)" aria-label="Opis: ${esc(n.nazwa)}">${esc(n.opis || "")}</textarea></li>`).join("")
    || `<li class="puste">Brak — dodaj pierwszy kraj NPC.</li>`}</ul>
  <form class="dodaj-npc"><input name="nazwa" required maxlength="60" placeholder="Nazwa kraju NPC" aria-label="Nazwa nowego kraju NPC">
    <select name="rodzaj" aria-label="Rodzaj">${opcjeRodzaju("wasal")}</select><select name="zwierzchnik" aria-label="Zwierzchnik">${opcjeZwierzchnika("")}</select>
    <button class="dodaj">Dodaj</button></form></section>`;
function podepnijNpc() {
  const odswiez = zmiany => { zapiszProwincje(zmiany); kolorujMape(); pokazPanelGM(true); };
  glowny.querySelectorAll(".lista-npc li[data-id]").forEach(li => {
    const id = li.dataset.id, n = stan.npc[id];
    li.querySelectorAll("input, select, textarea").forEach(p => p.onchange = () => {
      const w = p.value.trim();
      if (p.name === "nazwa" && !w) { p.value = n.nazwa; return; }
      n[p.name] = w; if (!n.opis) delete n.opis;
      p.name === "zwierzchnik" ? odswiez([["npc", id]]) : (zapiszProwincje([["npc", id]]), kolorujMape());   // zmiana zwierzchnika zmienia kolory kilku krajów
    });
    li.querySelector(".usun").onclick = () => {
      const ile = ileProwincji("npc:" + id);
      if (!confirm(`Usunąć kraj NPC „${n.nazwa}”?${ile ? ` Jego prowincje (${ile}) staną się ziemią niczyją.` : ""}`)) return;
      const zmiany = [["npc", id]];
      for (const [pid, d] of Object.entries(stan.prowincje || {})) if (d.wlasciciel === "npc:" + id) { delete d.wlasciciel; if (!Object.keys(d).length) delete stan.prowincje[pid]; zmiany.push(["p", pid]); }
      delete stan.npc[id]; odswiez(zmiany);
    };
  });
  glowny.querySelector(".dodaj-npc").onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.target), nazwa = d.get("nazwa").trim(); if (!nazwa) return;
    const baza = nazwa.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kraj";
    let id = baza, k = 2; while (stan.npc?.[id]) id = `${baza}-${k++}`;   // id stały — nie zmienia się przy zmianie nazwy
    (stan.npc ??= {})[id] = { nazwa, rodzaj: d.get("rodzaj"), zwierzchnik: d.get("zwierzchnik") }; odswiez([["npc", id]]);
    glowny.querySelector(".dodaj-npc input").focus();
  };
}
document.getElementById("panel-gm").onclick = () => widok === "gm" ? zamknijSzuflade() : pokazPanelGM();
// sprawy techniczne (logi, diagnostyka, porządki, kopie) — tylko admin (decyzja użytkownika: GM tego nie potrzebuje)
const jestAdmin = () => profil?.rola === "admin";
// logi: wczytywane na żądanie (oszczędność odczytów); stare kasowane przy logowaniu admina
const NAZWY_KOLEKCJI = { frakcje: "Frakcja", bohaterowie: "Bohater", gra: "Ustawienia gry", tajne_zasoby: "Zasoby", tajne_jednostki: "Jednostki",
  tajne_statusy: "Statusy bohaterów", notatki_gracza: "Notatki gracza", notatki_gm: "Notatki GM", uzytkownicy: "Konto" };
const opisSciezki = sc => {
  const [k, id] = sc.split("/"), nazwa = stan.frakcje.find(f => f.id === id)?.nazwa || stan.bohaterowie.find(h => h.id === id)?.imie || id;
  if (sc === "gra/prowincje") return "Prowincje";
  return k === "gra" ? NAZWY_KOLEKCJI.gra : `${NAZWY_KOLEKCJI[k] || k}: ${nazwa}`;
};
let logi = null, sprzatanie = null; // logi = ostatnio pobrana lista; sprzatanie = { czas, ile } z ostatniego automatycznego sprzątania
const logiSekcja = () => !CHMURA || !jestAdmin() ? "" : `<section class="logi"><h3>Logi zmian <span class="znacznik">tylko admin</span></h3>
  <p class="opis-sekcji">Każdy zapis zostawia mały wpis: kto, kiedy, co. Starsze wpisy kasują się same przy logowaniu admina${sprzatanie ? ` (ostatnio: ${sprzatanie.ile} usuniętych)` : ""}.</p>
  <form class="dni-logow"><label>Kasuj logi starsze niż <input name="dni" type="number" min="1" max="365" required value="${stan.ustawienia?.dniLogow ?? 30}"> dni</label>
    <button class="cofnij">Zapisz</button> <button type="button" class="dodaj" id="pokaz-logi">${logi ? "Odśwież" : "Pokaż ostatnie 50"}</button></form>
  ${logi ? `<ol class="lista-logow">${logi.map(l => `<li class="${l.typ === "blad" ? "blad-logu" : ""}"><time>${esc(new Date(l.czas).toLocaleString("pl-PL"))}</time>
    <b>${esc(l.email || "?")}</b> ${l.typ === "blad" ? `<span class="zmiana minus">błąd ${esc(l.kod || "")}</span>` : ""} ${esc((l.co || []).map(opisSciezki).join(", "))}</li>`).join("")
    || "<li>Brak wpisów.</li>"}</ol>` : ""}</section>`;
function podepnijLogi() {
  const f = glowny.querySelector(".dni-logow"); if (!f) return;
  f.onsubmit = e => { e.preventDefault(); stan.ustawienia = { ...stan.ustawienia, dniLogow: Math.max(1, Math.min(365, +f.dni.value || 30)) }; zapisz(stan); pokazPanelGM(true); };
  glowny.querySelector("#pokaz-logi").onclick = async () => {
    try { logi = await ostatnieLogi(50); } catch (e) { alert("Nie udało się wczytać logów: " + komunikat(e)); return; }
    pokazPanelGM(true);
  };
}
// diagnostyka: limity darmowego planu Spark (dziennie, cały projekt) — liczniki sesji są tylko z tego okna
const SPARK = { zapisy: 20000, odczyty: 50000, miejsce: 1024 ** 3 };
const kb = b => b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 ** 2).toFixed(2)} MB`;
let diagnoza = null; // { liczby, czas } z ostatniego „Sprawdź bazę”
const diagnostykaSekcja = () => {
  if (!CHMURA || !jestAdmin()) return "";
  const roz = rozmiaryWczytanych(), suma = Object.values(roz).reduce((a, b) => a + b, 0);
  const proc = (n, max) => `${n} <small>(${(n / max * 100).toFixed(n / max < 0.01 ? 2 : 1)}% dziennego limitu)</small>`;
  return `<section class="diagnostyka"><h3>Diagnostyka <span class="znacznik">tylko admin</span></h3>
  <p class="opis-sekcji">Darmowy plan Firebase: ${SPARK.zapisy.toLocaleString("pl-PL")} zapisów i ${SPARK.odczyty.toLocaleString("pl-PL")} odczytów dziennie (na cały projekt), 1 GB danych.
    Dokładne zużycie całego projektu: konsola Firebase → Firestore → Użycie.</p>
  <dl class="fakty"><div><dt>Połączenie</dt><dd>${navigator.onLine ? "online" : "<b>offline</b> — zmiany wyślą się po powrocie sieci"}</dd></div>
    <div><dt>Zapisy w tej sesji</dt><dd>${proc(licznik.dokumenty, SPARK.zapisy)}, w ${licznik.zapisy} paczkach</dd></div>
    <div><dt>Odczyty w tej sesji (ok.)</dt><dd>${proc(licznik.odczyty, SPARK.odczyty)}</dd></div>
    <div><dt>Wczytane dane gry</dt><dd>${kb(suma)} <small>(${(suma / SPARK.miejsce * 100).toFixed(4)}% z 1 GB)</small></dd></div></dl>
  <p><button type="button" class="dodaj" id="sprawdz-baze">${diagnoza ? "Sprawdź ponownie" : "Policz dokumenty w bazie"}</button>
    ${diagnoza ? `<small class="opis-sekcji"> stan z ${esc(diagnoza.czas.toLocaleTimeString("pl-PL"))}</small>` : ""}</p>
  ${diagnoza ? `<table class="tabela-diag"><thead><tr><th>Kolekcja</th><th>Dokumentów</th><th>Wczytane dane</th></tr></thead><tbody>
    ${KOLEKCJE.map(k => `<tr><td>${esc(NAZWY_KOLEKCJI[k] || k)} <small>${k}</small></td><td>${diagnoza.liczby[k]}</td><td>${roz[k] ? kb(roz[k]) : "—"}</td></tr>`).join("")}</tbody></table>` : ""}
  <h4>Ostatnie błędy zapisu (ta sesja)</h4>
  ${licznik.bledy.length ? `<ol class="lista-logow">${licznik.bledy.map(b => `<li class="blad-logu"><time>${esc(new Date(b.czas).toLocaleTimeString("pl-PL"))}</time>
    <b>${esc(b.kod)}</b> ${esc(komunikat({ code: b.kod, message: b.opis }))} <small>${esc(b.co.map(opisSciezki).join(", "))}</small></li>`).join("")}</ol>` : `<p class="puste">Brak — wszystko zapisuje się poprawnie.</p>`}
  <p class="opis-sekcji">Błędy innych osób widać w „Logach zmian” (czerwone wpisy).</p></section>`;
};
function podepnijDiagnostyke() {
  const b = glowny.querySelector("#sprawdz-baze"); if (!b) return;
  b.onclick = async () => {
    b.disabled = true;
    try { diagnoza = { liczby: await policzDokumenty(), czas: new Date() }; } catch (e) { alert("Nie udało się policzyć: " + komunikat(e)); }
    pokazPanelGM(true);
  };
}
// porządki (admin): „Szukaj” niczego nie zmienia; usuwa dopiero „Wyczyść” po potwierdzeniu
let smieci = null; // { pozycje, wykonaj } albo { gotowe: tekst }
const porzadkiSekcja = () => !CHMURA || !jestAdmin() ? "" : `<section class="porzadki"><h3>Porządki <span class="znacznik">tylko admin</span></h3>
  <p class="opis-sekcji">Szuka niepotrzebnych danych, które zajmują miejsce w bazie. Najpierw pokazuje, co znalazł — nic nie usuwa bez potwierdzenia.</p>
  <p><button type="button" class="cofnij" id="szukaj-smieci">Szukaj śmieci</button></p>
  ${smieci?.gotowe ? `<p class="opis-sekcji">${esc(smieci.gotowe)}</p>` : smieci ? smieci.pozycje.length ? `<ul class="lista-smieci">${smieci.pozycje.map(p =>
    `<li><b>${p.ile}</b> — ${esc(p.opis)}</li>`).join("")}</ul><p><button type="button" class="dodaj" id="wyczysc-smieci">Wyczyść (${smieci.pozycje.reduce((a, p) => a + p.ile, 0)})</button></p>`
    : `<p class="opis-sekcji">Czysto — nic do usunięcia.</p>` : ""}</section>`;
function podepnijPorzadki() {
  const szukaj = glowny.querySelector("#szukaj-smieci"); if (!szukaj) return;
  szukaj.onclick = async () => {
    szukaj.disabled = true;
    try { smieci = await szukajSmieci(); } catch (e) { alert("Nie udało się przeszukać bazy: " + komunikat(e)); }
    pokazPanelGM(true);
  };
  const wyczysc = glowny.querySelector("#wyczysc-smieci"); if (!wyczysc) return;
  wyczysc.onclick = async () => {
    if (!confirm("Usunąć znalezione śmieci? Tego nie da się cofnąć (chyba że z kopii zapasowej).")) return;
    wyczysc.disabled = true;
    try { await smieci.wykonaj(); smieci = { gotowe: "Gotowe — posprzątane." }; } catch (e) { alert("Sprzątanie przerwane: " + komunikat(e)); }
    pokazPanelGM(true);
  };
}
// kopia zapasowa (admin; w DEMO każdy): cała gra do pliku .json i z powrotem
const POLA_KOPII = ["frakcje", "bohaterowie", "zasoby", "tury", "ustawienia", "prowincje", "npc"];   // starsze kopie nie mają prowincji — wtedy zostają obecne
const bezBraku = x => JSON.parse(JSON.stringify(x, (k, v) => k === "_brak" ? undefined : v));
const kopiaSekcja = () => CHMURA && !jestAdmin() ? "" : `<section class="kopia"><h3>Kopia zapasowa${CHMURA ? ` <span class="znacznik">tylko admin</span>` : ""}</h3>
  <p class="opis-sekcji">Pobiera całą grę (frakcje, bohaterów, zasoby, tury, jednostki, notatki) do pliku na dysk. Wczytanie kopii nadpisuje obecne dane gry — konta i role zostają bez zmian.</p>
  <p class="przyciski-tur"><button type="button" class="dodaj" id="pobierz-kopie">Pobierz kopię (.json)</button>
    <label class="cofnij wczytaj-plik">Wczytaj kopię…<input type="file" id="wczytaj-kopie" accept=".json,application/json" hidden></label></p></section>`;
function podepnijKopie() {
  const pobierz = glowny.querySelector("#pobierz-kopie"); if (!pobierz) return;
  pobierz.onclick = () => {
    const dane = { aplikacja: "fantasy-rp", wersja: pakiet.version, czas: new Date().toISOString(), ...bezBraku(Object.fromEntries(POLA_KOPII.map(k => [k, stan[k]]))) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dane, null, 1)], { type: "application/json" }));
    a.download = `fantasy-rp_kopia_${dane.czas.slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  glowny.querySelector("#wczytaj-kopie").onchange = async e => {
    const plik = e.target.files[0]; e.target.value = ""; if (!plik) return;
    let d;
    try { if (plik.size > 10e6) throw 0; d = JSON.parse(await plik.text()); } catch { return alert("To nie jest poprawny plik kopii."); }
    const dobra = d?.aplikacja === "fantasy-rp" && ["frakcje", "bohaterowie", "zasoby", "tury"].every(k => Array.isArray(d[k]))
      && d.frakcje.every(f => typeof f?.id === "string" && typeof f?.nazwa === "string") && d.bohaterowie.every(h => typeof h?.id === "string")
      && (d.prowincje === undefined || (typeof d.prowincje === "object" && !Array.isArray(d.prowincje)));
    if (!dobra) return alert("Ten plik nie wygląda na kopię Fantasy RP.");
    if (!confirm(`Wczytać kopię z ${new Date(d.czas).toLocaleString("pl-PL")}? Obecne dane gry zostaną nadpisane (${d.frakcje.length} frakcji, ${d.bohaterowie.length} bohaterów).`)) return;
    Object.assign(stan, Object.fromEntries(POLA_KOPII.filter(k => d[k] !== undefined).map(k => [k, d[k]])));
    zapiszWszystko(stan); alert("Kopia wczytana."); pokazPanelGM(true); zbudujListe();
  };
}
// użytkownicy: admin nadaje każdą rolę; GM tylko oczekujący/gracz/obserwator i nie rusza kont GM/admin; własnej roli nikt nie zmienia
// państwo: gracz, GM i admin mogą grać jakimś państwem; admin wybiera je też sobie (we własnym wierszu tylko państwo)
const ROLE_GM = ["oczekujacy", "gracz", "obserwator"], ROLE_Z_PANSTWEM = ["gracz", "gm", "admin"];
let uzytkownicy = [], odpiecieUzytkownikow = () => {};
function sluchajUzytkownikowJesliGM() {
  odpiecieUzytkownikow(); odpiecieUzytkownikow = () => {}; uzytkownicy = [];
  if (gm && CHMURA) odpiecieUzytkownikow = sluchajUzytkownikow(l => { uzytkownicy = l; if (widok === "gm") odswiezWidok(); }, e => console.error(e));
}
function uzytkownicySekcja() {
  if (!CHMURA) return "";
  const admin = profil.rola === "admin";
  const lista = [...uzytkownicy].sort((a, b) => (a.rola !== "oczekujacy") - (b.rola !== "oczekujacy") || a.email.localeCompare(b.email));
  return `<section><h3>Użytkownicy</h3><p class="opis-sekcji">Nowe konta czekają jako „Oczekujący”, dopóki nie nadasz im roli.${admin ? "" : " Role GM i admin nadaje admin."}</p>
    <ul class="uzytkownicy">${lista.map(u => {
      const ja = u.uid === zalogowany.uid, wolno = !ja && (admin || (ROLE_GM.includes(u.rola)));
      const role = wolno ? (admin ? Object.keys(ROLE) : ROLE_GM) : [u.rola];
      const panstwo = ROLE_Z_PANSTWEM.includes(u.rola) && (wolno || (ja && admin));
      return `<li data-uid="${esc(u.uid)}" class="${u.rola === "oczekujacy" ? "czeka" : ""}"><span class="kto"><b>${esc(u.nazwa || u.email)}${ja ? " (Ty)" : ""}</b>${u.nazwa ? `<small>${esc(u.email)}</small>` : ""}</span>
        <select name="rola"${wolno ? "" : " disabled"} aria-label="Rola: ${esc(u.email)}">${role.map(r => `<option value="${r}"${r === u.rola ? " selected" : ""}>${ROLE[r]}</option>`).join("")}</select>
        <select name="frakcja"${panstwo ? "" : " disabled"} aria-label="Państwo: ${esc(u.email)}"><option value="">— bez państwa —</option>
          ${stan.frakcje.map(f => `<option value="${f.id}"${f.id === u.frakcja ? " selected" : ""}>${esc(f.nazwa)}</option>`).join("")}</select></li>`;
    }).join("") || `<li class="puste">Ładowanie…</li>`}</ul></section>`;
}
function podepnijUzytkownikow() {
  glowny.querySelectorAll(".uzytkownicy li[data-uid]").forEach(li => li.onchange = () => {
    const rola = li.querySelector("[name=rola]").value, frakcja = li.querySelector("[name=frakcja]").value;
    const zmiany = li.dataset.uid === zalogowany.uid ? { frakcja } : { rola, frakcja: ROLE_Z_PANSTWEM.includes(rola) ? frakcja : "" };
    const email = (li.querySelector(".kto small") || li.querySelector(".kto b")).textContent, f = stan.frakcje.find(x => x.id === (zmiany.frakcja ?? ""));
    ustawUzytkownika(li.dataset.uid, zmiany, `${email} → ${ROLE[zmiany.rola] || "państwo"}${f ? ", " + f.nazwa : ""}`)
      .catch(e => { alert("Nie udało się zmienić roli: " + komunikat(e)); odswiezWidok(); });
  });
}
function przelacz(doAplikacji) {
  document.getElementById("menu").hidden = doAplikacji; document.getElementById("aplikacja").hidden = !doAplikacji;
  sala.reczny = doAplikacji; // pauza animacji sali, gdy jej nie widać
  doAplikacji ? clearInterval(timer) : restart();
}
// zmiany od innych osób: przerysuj otwarty widok, ale nie w trakcie pisania (po wyjściu z pola)
let czekaOdswiezenie = false;
function odswiezWidok() {
  const pole = document.activeElement;
  if (glowny.contains(pole) && /^(INPUT|TEXTAREA|SELECT)$/.test(pole.tagName)) {
    if (!czekaOdswiezenie) { czekaOdswiezenie = true; pole.addEventListener("blur", () => { czekaOdswiezenie = false; setTimeout(odswiezWidok); }, { once: true }); }
    return;
  }
  zbudujListe(); kolorujMape();
  if (widok === null) return; // jeszcze w Sali Tronów
  if (okno.open && !okno.querySelector("form.edycja")) okno.close(); // okno bohatera mogło dostać nieaktualne dane; formularza w trakcie pisania nie zamykamy
  if (widok.startsWith("p:")) return pokazProwincje(+widok.slice(2), true);
  widok === "gm" ? (gm ? pokazPanelGM(true) : zamknijSzuflade()) : wybierz(widok, true);
}
function wejdz() {
  if (aktualizacjaBlokuje()) return;
  zamknijSzuflade(); zbudujListe(); kolorujMape(); przelacz(true);   // start: sama mapa, karty otwiera klik w herb
}
const blad = document.getElementById("blad-logowania");
const pokazBlad = (t, info) => { blad.textContent = t; blad.hidden = !t; blad.classList.toggle("info", Boolean(info)); };
const KOMUNIKATY = {
  "auth/invalid-credential": "Zły e-mail albo hasło. Nie masz konta? Kliknij „Załóż konto”.",
  "auth/invalid-email": "To nie wygląda na adres e-mail.",
  "auth/email-already-in-use": "Konto z tym e-mailem już istnieje — zaloguj się.",
  "auth/weak-password": "Hasło musi mieć co najmniej 6 znaków.",
  "auth/too-many-requests": "Za dużo prób. Odczekaj chwilę.",
  "auth/popup-closed-by-user": "",
  "auth/network-request-failed": "Brak połączenia z internetem.",
  "permission-denied": "To konto nie ma jeszcze dostępu do gry.",
};
const komunikat = e => KOMUNIKATY[e.code] ?? `Coś poszło nie tak (${e.code || e.message}).`;
ustawBladZapisu(e => alert("Nie udało się zapisać zmian: " + komunikat(e)));
const formularz = document.getElementById("logowanie");
if (!CHMURA) {
  wczytaj();
  formularz.onsubmit = e => { e.preventDefault(); wejdz(); };
} else {
  document.getElementById("tryb").textContent = "";
  document.getElementById("zaloz-konto").hidden = false;
  const zajety = b => formularz.querySelectorAll("button").forEach(x => x.disabled = b);
  // po zalogowaniu wchodzimy do gry dopiero, gdy dane są wczytane (wejdzPoWczytaniu)
  const sprobuj = async akcja => { pokazBlad(""); zajety(true); wejdzPoWczytaniu = true; try { await akcja(); } catch (e) { wejdzPoWczytaniu = false; pokazBlad(komunikat(e)); } finally { zajety(false); } };
  formularz.onsubmit = e => {
    e.preventDefault();
    if (!zalogowany) return sprobuj(() => zaloguj(formularz.mail.value.trim(), formularz.haslo.value));
    wczytane ? wejdz() : wejdzPoWczytaniu = true;
  };
  document.getElementById("zaloz-konto").onclick = () => {
    if (!formularz.reportValidity()) return;
    sprobuj(() => zalozKonto(formularz.mail.value.trim(), formularz.haslo.value));
  };
  document.getElementById("google").onclick = () => sprobuj(zalogujGoogle);
  document.getElementById("wyloguj").onclick = async () => { await wyloguj(); przelacz(false); };
}
let zalogowany = null, profil = null, wczytane = false, wejdzPoWczytaniu = false, odpiecieProfilu = () => {};
naZmianeKonta(async user => {
  zalogowany = user; wczytane = false; odpiecieProfilu(); profil = null;
  if (!CHMURA) return;
  formularz.classList.toggle("zalogowany", Boolean(user));
  document.getElementById("wyloguj").hidden = !user;
  if (!user) { widok = null; gm = false; sluchajUzytkownikowJesliGM(); odpieciePropozycji(); propozycje = []; document.getElementById("konto-mail").textContent = ""; return; }
  try {
    profil = await mojProfil(user); await ustawRole();
    // rola nadana albo zmieniona przez admina działa od razu, bez przeładowania
    odpiecieProfilu = sluchajProfilu(user.uid, p => {
      const inna = p.rola !== profil.rola || p.frakcja !== profil.frakcja; profil = p;
      if (inna) ustawRole().catch(e => pokazBlad(komunikat(e)));
    });
  } catch (e) { pokazBlad(komunikat(e)); await wyloguj(); }
});
async function ustawRole() {
  gm = ["admin", "gm"].includes(profil.rola);
  ustawDostep({ gm, frakcja: profil.frakcja || "" });
  document.getElementById("konto-mail").textContent = `${zalogowany.email} · ${ROLE[profil.rola] || profil.rola}`;
  document.getElementById("panel-gm").hidden = !gm;
  sluchajUzytkownikowJesliGM();
  if (profil.rola === "oczekujacy") {
    odlacz(); wczytane = false; widok = null; przelacz(false);
    pokazBlad("Konto czeka na przyjęcie przez admina. Wejdziesz, gdy nada Ci rolę — ta strona sama to wykryje.", true);
    return;
  }
  pokazBlad(""); sluchajPropozycjiDlaRoli();
  if (wczytane) return odswiezWidok();
  await polacz(odswiezWidok); wczytane = true;
  if (jestAdmin()) {
    sprzatnijLogi(stan.ustawienia?.dniLogow ?? 30).then(ile => { sprzatanie = { czas: new Date(), ile }; }).catch(e => console.warn("sprzątanie logów", e));
    sprzatnijPropozycje(7).catch(e => console.warn("sprzątanie propozycji", e)); // rozpatrzone po 7 dniach (decyzja użytkownika)
  }
  if (wejdzPoWczytaniu) { wejdzPoWczytaniu = false; wejdz(); } // zapamiętana sesja: zostajemy w Sali Tronów
}
document.getElementById("wyjdz").onclick = () => przelacz(false);
// „Co nowego” raz po pierwszym uruchomieniu nowej wersji; bez zapamiętanej wersji (nowa instalacja albo 0.1.1 bez tej funkcji) tylko wpis bieżącej
const nowsza = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); const i = x.findIndex((v, k) => v !== y[k]); return i >= 0 && x[i] > y[i]; };
const oknoZmian = document.getElementById("zmiany");
function coNowego() {
  let byla = null; try { byla = localStorage.getItem("wersja"); localStorage.setItem("wersja", pakiet.version); } catch {}
  if (byla === pakiet.version) return;
  const wpisy = ZMIANY.filter(z => !nowsza(z.wersja, pakiet.version) && (byla ? nowsza(z.wersja, byla) : z.wersja === pakiet.version));
  if (!wpisy.length) return;
  oknoZmian.innerHTML = `<div class="okno-glowa"><div><h2>Co nowego</h2><p class="rasa">wersja ${esc(pakiet.version)}</p></div><button type="button" class="zamknij" aria-label="Zamknij">×</button></div>`
    + wpisy.map(z => `<h3>Wersja ${esc(z.wersja)} <span>${esc(z.data)}</span></h3><ul>${z.zmiany.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`).join("");
  oknoZmian.querySelector(".zamknij").onclick = () => oknoZmian.close();
  oknoZmian.showModal();
}
// aktualizacje (tylko program na komputer, window.aktualizacje z electron/preload.cjs) — obowiązkowe:
// znaleziona nowsza wersja (przy starcie albo w sprawdzaniu co 15 min) zasłania cały program nakładką, dopóki gracz nie zaktualizuje;
// przy starcie samo sprawdzanie tylko blokuje logowanie; brak sieci/GitHuba i sprawdzanie dłuższe niż 10 s nie blokują
const NAKLADKA = ["dostepna", "pobieram", "instaluje", "blad-pobierania"];
let aktualizacja = { stan: "brak" };
const aktualizacjaBlokuje = () => aktualizacja.stan === "sprawdzam" || NAKLADKA.includes(aktualizacja.stan);
function pokazAktualizacje(s) {
  aktualizacja = s;
  const w = esc(s.wersja || ""), nakladka = document.getElementById("nakladka-aktualizacji"), pelna = NAKLADKA.includes(s.stan);
  formularz.querySelectorAll("input, button").forEach(x => x.disabled = aktualizacjaBlokuje());
  const pasek = document.getElementById("aktualizacja");
  pasek.hidden = s.stan !== "sprawdzam"; pasek.textContent = "Sprawdzam, czy jest nowsza wersja…";
  // reszta programu nieklikalna i niedostępna z klawiatury, otwarte okna zamknięte (okno dialogowe byłoby nad nakładką)
  ["menu", "aplikacja"].forEach(id => document.getElementById(id).inert = pelna);
  if (pelna) [okno, oknoZmian].forEach(o => o.open && o.close());
  nakladka.hidden = !pelna;
  document.getElementById("nakladka-tresc").innerHTML = {
    dostepna: `<p>Jest nowa wersja <b>${w}</b>. Gra wymaga aktualizacji — do tego czasu nie można z niej korzystać.</p><button type="button" class="wejdz" id="aktualizuj">Aktualizuj</button>`,
    pobieram: `<p>Pobieram wersję <b>${w}</b>… ${s.procent ?? 0}%</p><progress max="100" value="${s.procent ?? 0}"></progress>`,
    instaluje: `<p>Instaluję wersję <b>${w}</b> — program sam uruchomi się ponownie.</p>`,
    "blad-pobierania": `<p>Nie udało się pobrać aktualizacji. Sprawdź internet i spróbuj jeszcze raz.</p><button type="button" class="wejdz" id="aktualizuj">Spróbuj ponownie</button>`,
  }[s.stan] || "";
  const b = document.getElementById("aktualizuj");
  if (b) { b.onclick = () => { b.disabled = true; window.aktualizacje.pobierz(); }; b.focus(); }
}
if (window.aktualizacje) {
  window.aktualizacje.naZmiane(pokazAktualizacje);
  window.aktualizacje.stan().then(pokazAktualizacje);
  setTimeout(() => { if (aktualizacja.stan === "sprawdzam") pokazAktualizacje({ stan: "brak" }); }, 10000);
}
coNowego();
