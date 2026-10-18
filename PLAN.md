# PLAN — „Fantasy RP dla autystów”

## Cel
Aplikacja dla grupy grającej tekstowo na Discordzie w fantasy RP w stylu Age of Wonders / Cywilizacji. Ma pokazywać frakcje, bohaterów, zasoby, jednostki, a później mapę prowincji i armie. Nie liczy gospodarki (GM liczy w Excelu), tylko przechowuje i ładnie pokazuje stan gry.

## Specyfikacja
- **Platforma:** aplikacja webowa opakowana w program Electron (Windows) z logowaniem, sprawdzaniem wersji i guzikiem „Aktualizuj” (GitHub Releases). Ten sam kod może działać jako strona (GitHub Pages).
- **Technologia (wybór Claude):** Vite + JavaScript (moduły ES), Firebase (Auth + Firestore, darmowy plan Spark, NOWY projekt), Electron + electron-updater, PixiJS do mapy i animacji. Pisane od zera; ze starego WorldWatch tylko pomysły (role, logi z czyszczeniem, kopie, reguły „publiczne/tajne”).
- **Logowanie:** e-mail + hasło albo konto Google (Firebase Auth). Nowe konto ma rolę „oczekujący”, dopóki admin nie nada roli. Panel logowania w Sali Tronów ma oba sposoby.
- **Tryb DEMO:** dopóki nie ma Firebase, dane w localStorage, żeby wszystko dało się testować.
- **Role:** admin (użytkownik), GM, gracz-władca (1 państwo), obserwator, oczekujący. Jak w WorldWatch: admin nadaje role i przypisuje państwa w panelu, GM może zarządzać zwykłymi graczami, ale nie nadaje ról GM/admin.
- **Widoczność:** jawne: opisy państw, bohaterowie (publiczna część), mapa. Tajne (tylko właściciel + GM): zasoby, dokładne armie, tajne notatki. GM może ujawnić wybrane rzeczy.
- **Edycja:** gracz edytuje opisy swojego państwa i bohaterów → zmiana czeka na akceptację GM. Zasoby, jednostki, koszty, statusy bohaterów zmienia tylko GM/admin.
- **Frakcje:** każda ma: nazwę, rasę, stolicę, ustrój, władcę, godło/herb, motto, kolor, opis (sekcje), unikalne zasoby i mechaniki (pole tekstowe). Na start 7 frakcji z `materialy/`: Krag-Mhor (Dawi), Aurelia (Draenei), Goblandia, Rogus Ardens (Kreeganie), Królestwo Czarnego Smoka, Orkowie (Gor-Khar), Grobowe Imperium (Nieumarli).
- **Bohaterowie:** 2–6 na frakcję, jeden to władca. Portret pixel art, tytuł, funkcja, wiek, broń, opis; status: w stolicy / na misji (z armią, flotą, inne) / ranny / martwy.
- **Zasoby:** lista typów zasobów edytowalna przez GM (podstawowe: Broń, Żywność, Drewno, Budulec, Metal, Złoto, Kamienie szlachetne, Populacja + unikalne frakcji). Aktualny stan + migawka przy zamknięciu tury (zmiany +/- tura do tury, później wykresy). Bez wklejania z Excela — GM wpisuje albo wkleja liczbę w pole danego zasobu (zwykłe kopiuj-wklej).
- **Jednostki:** lista jednostek per frakcja dopisywana przez GM: nazwa, opis/wyposażenie, poziom elitarności (Chołota / Regularne / Elita). Koszt i punkty limitu (pomysł: „chołota 1, elita 5”) dojdą, gdy GM ustali mechanikę armii.
- **Zasady armii (od GM, 2026-10-18 — cytat):**
  > Każda armia musi mieć swojego „dowódcę”, może być to bohater albo świeżo zatrudniony pospolity dowódca.
  > Armie mają 1 ruch na turę, mogą albo przejść do sąsiadującej prowincji bez wchodzenia do osady albo poruszać się między osadami w prowincji, w której armia już jest.
  > Armia zostaje rozwiązana, gdy jest w niej mniej niż 100 żołnierzy bez dowódcy.
  > Armie nie mogą przejść przez góry albo rzekę bez mostu, chyba że dana frakcja ma taką umiejętność.
  - Co z tego wynika dla aplikacji: armia ma dowódcę (bohater z listy albo „pospolity dowódca” z imieniem), liczbę żołnierzy (później skład z jednostek) i położenie: prowincja + osada (miasto / wioska 1 / wioska 2) albo „w polu” (w prowincji, poza osadą). Ruch: 1 na turę — albo do sąsiedniej prowincji (wtedy „w polu”), albo między osadami tej samej prowincji; licznik ruchu zeruje się przy zamknięciu tury. Granica między prowincjami ma typ: zwykła / góry / rzeka / rzeka z mostem; przez góry i rzekę bez mostu tylko frakcja z odpowiednią umiejętnością (GM zaznacza przy frakcji).
  - Ustalone (2026-10-18): liczy się liczba żołnierzy BEZ dowódcy — poniżej 100 armia zostaje rozwiązana. Domyślnie: aplikacja oznacza taką armię „do rozwiązania” i rozwiązuje ją przy zamknięciu tury (GM może przedtem uzupełnić skład) — do zmiany, jeśli GM woli inaczej.
- **Mapa (później):** autorski rysunek, nie prawdziwa mapa. Wgrywam obraz i obrysowuję prowincje (narzędzie do rysowania wielokątów, numery). Prowincja: 1 miasto + 2 wioski, sloty budynków (2 w mieście, 1 na wioskę), co produkuje, właściciel, wasal/marionetka. Prowincje bez gracza = ziemia niczyja (NPC prowadzi GM na Discordzie), z opcjonalnym opisem prowincji.
  - Mapa od użytkownika (2026-10-18): `materialy/Mapa RPG.png`, 20000×20000, rysunek kreskowy (jeden PNG, bez warstw). Granice komórek przerywanymi liniami; KAŻDA PROWINCJA = DWA OBSZARY z tym samym numerem (ręcznie pisanym). Dolne kontynenty (lewy i prawy) bez numerów — tam każda komórka = osobna prowincja (numery nada się w edytorze). Góry i rzeki narysowane, MOSTÓW na rysunku nie ma (użytkownik 2026-10-18 — dodaje je GM/admin w grze); podpisy graczy (DEZ, WEGA, AIDEN, ZEREN, LUCJAN, HELLIA) = ich prowincje startowe.
  - Woda na mapie (użytkownik, 2026-10-18): rzeki, jeziora, morza i oceany. Do rozpoznania przy wykrywaniu obszarów: woda to NIE prowincje lądowe (jeziora = białe „dziury” w lądzie, morza/oceany = tło wokół kontynentów i wysp). Znaczenie dla gry: rzeka bez mostu blokuje armie (zasady GM), a jeziora, morza i oceany to obszary dla flot (7.1) — może trzeba będzie je podzielić na akweny; do ustalenia przy etapie 7.
  - Sposób: rysunek jako tło (kafelki do przybliżania), komórki wykryte automatycznie — `assets/mapa_komorki.py` → `materialy/mapa/komorki_2.png` (skala 1/2, 1045 komórek, 10 jezior; rzeki i góry w `warstwy_2.png`; 93% numerów w osobnej komórce): rysunek ma jedną kreskę pośrodku każdego boku komórki i puste narożniki, więc skrypt rozpoznaje kreski granic (cyfry, napisy i góry pomija), łączy/przedłuża je do narożników, a resztę szczelin domyka wododział; ocean liczony od wszystkich kresek. Zostają błędy w obie strony (część komórek zlana, część pocięta) — do poprawy w edytorze (scal / podziel), numery dopasowane automatycznie ile się da + edytor do poprawek (klik w komórkę → numer, granica → góry/rzeka; mosty dopiero w grze — 6.2b).
- **Grafika:** patrz `assets/STYLE.md`. Portrety bohaterów od razu w pixel art ~128 px. Interfejs: mroczne fantasy + złoto, z pixel-artowymi ramkami i ikonami dobranymi tak, żeby nie gryzły się z portretami.
- **Obrazki od graczy:** plan Spark nie ma Storage, więc wgrane obrazki trzymam jako skompresowane dane w Firestore (do ~800 KB). Wygenerowane portrety są w plikach aplikacji.
- **Sala Tronów (ekran logowania i aktualizacji):** animowana pętla, w której siedzi 7 władców na tronach w stylu swoich frakcji: Surtr, Seranya, Gobloni, Elmon Devil, smok Shire, Drogath i Tarael Illitris. Żywe tło: oddech, mruganie, pochodnie, sztandary, iskry, blask kryształów i lawy, a co jakiś czas krótki gest jednego władcy. Kompozycję wybierze użytkownik z podglądów. Ekran powstaje po portretach. Do tego czasu logowanie jest na prostym tle.
- **Język:** polski.

## Etapy

### Etap 1 — szkielet, który się uruchamia (DEMO)
- [x] 1.0 Podglądy 3 kompozycji Sali Tronów (szkice: jedna sala / osobne sceny / okrągła rada), użytkownik wybiera
- [x] 1.0b Sala Tronów wariant B: 7 scen 16:9 (2048×1152 → 1920×1080), po jednej na władcę, też jako fanarty dla graczy — wszystkie są, czekają na ocenę użytkownika (`assets/podglad.html`)
- [x] 1.0c Podgląd menu głównego na pełny ekran: (przenikanie scen, panel logowania, iskry) — zastąpiony przez `assets/menu.html`
- [x] 1.0d Poprawki scen, akceptacja użytkownika, finały w `assets/sala_tronow/` (1920×1080) i fanarty w `assets/sala_tronow/fanarty/` (2048×1152)
- [x] 1.0e Warianty menu głównego z animacją Sali Tronów — wybrany wariant E (C+D), reszta usunięta; menu: `assets/menu.html`
- [x] 1.1 Projekt Vite + Electron: okno programu się otwiera, `npm run dev` działa też w przeglądarce (start = menu Sali Tronów)
- [x] 1.2 Powłoka interfejsu: układ (menu frakcji, panel główny), kolory i fonty ze STYLE.md
- [x] 1.3 Warstwa danych DEMO (localStorage) + dane startowe 7 frakcji i bohaterów przepisane z `materialy/`
- [x] 1.4 Karta frakcji (informacje, opis w sekcjach, herb, kolor)
- [x] 1.5 Karty bohaterów (portret — na razie zastępczy, opis, status)

### Etap 2 — pixel art
- [x] 2.1 Karty postaci (`assets/postacie/`) z opisów i obrazów graczy: Dawi (`krag-mhor.md`) i Draenei (`aurelia.md`); karty pozostałych frakcji robione na początku 2.3 i 2.4
- [x] 2.2 Portrety 128 px: Dawi i Draenei (12) — `assets/portrety/`, czekają na ocenę użytkownika (Drekki poprawiony 2026-10-17)
- [x] 2.3 Portrety: Orkowie i Nieumarli (12) — karty `gor-khar.md`, `grobowe-imperium.md`; Merrla 2026-10-17 przerobiona na pełny portret (zaakceptowana)
- [x] 2.4 Portrety: Czarny Smok, Kreeganie, Goblandia (12 z władcami) — karty `goblandia.md`, `rogus-ardens.md`, `czarny-smok.md`; zaakceptowane przez użytkownika 2026-10-17
- [x] 2.5 Herby frakcji, ikony zasobów, ramki interfejsu
  - [x] 2.5a Herby 7 frakcji: tarcza herbowa pixel art (kolor frakcji, złota obwódka, godło), w nagłówku karty frakcji zamiast litery — `assets/herby/<id>.png`, zaakceptowane (Gor-Khar = czaszka orka z kłami)
  - [x] 2.5b Ikony 8 podstawowych zasobów (unikalne później, po potwierdzeniu GM) — `assets/ikony/`, pokażą się w tabeli zasobów (3.2); zaakceptowane
  - [x] 2.5c Pixel-artowe złote ramki (portret, panele) jako 9-slice zamiast ramek z CSS — `assets/ramki.py` → `assets/ramki/`
- [x] 2.6 Sala Tronów: grafiki 7 tronów z władcami w wybranej kompozycji (zrobione w 1.0b–1.0d)
- [x] 2.7 Sala Tronów: animacja w pętli jako tło ekranu logowania/aktualizacji (zrobione w 1.0e + 1.1, bez PixiJS)
- [x] 2.8 Przegląd portretów pod kątem chunky pixel artu (wzorce drogath/tarael w STYLE.md) — 2026-10-18 przerobione 7: vaelgor, gobloni, linnr, karevra, shire, morthalass, razhka; zaakceptowane przez użytkownika („zostaw tak jak są”); urgash, krazh, elmon zostają

### Etap 3 — zasoby i jednostki
- [x] 3.1 GM: edytor typów zasobów (globalne + unikalne frakcji) — „Panel GM” w górnym pasku, `src/dane/zasoby.js`, `stan.zasoby` (dopisywane do starego zapisu DEMO bez kasowania)
- [x] 3.2 Tabela zasobów frakcji, edycja przez GM (pole liczby przy każdym zasobie; bez importu z Excela) — sekcja „Zasoby” na karcie: globalne w `f.stany[id]`, unikalne w `ilosc`; unikalne mają też jednostkę
- [x] 3.3 Tury: zamknięcie tury = migawka, widok zmian +/- — Panel GM „Zamknij turę N” + „Cofnij zamknięcie” (ostatniej; obecnych liczb nie zmienia), `stan.tury`
- [x] 3.4 Jednostki per frakcja: lista na karcie frakcji (nazwa, opis, poziom elitarności: Chołota / Regularne / Elita); koszt, punkty i statystyki dopiero gdy GM ustali mechanikę — sekcja „Jednostki” na karcie (dodaj / ✎ edytuj / usuń), `f.jednostki`

### Etap 4 — Firebase i konta (= pierwsza wersja dla całej grupy)
- [x] 4.1 Instrukcja założenia projektu Firebase dla użytkownika + podłączenie: `magazyn.js` przechodzi na Firestore z synchronizacją na żywo (onSnapshot) — frakcje, zasoby, bohaterowie, a później mapa i armie widoczne od razu u wszystkich; osobne dokumenty zamiast jednego wielkiego zapisu
- [x] 4.2 Logowanie (e-mail/Google), role, panel admina do przypisywania ról i państw; edycję typów zasobów, stanów, tur, unikalnych zasobów i jednostek widzą/robią tylko GM i admin (w DEMO każdy)
- [x] 4.3 Reguły bezpieczeństwa: część jawna/tajna
  - [x] 4.3a Podział danych: tajne części w osobnych dokumentach (`tajne_zasoby`, `tajne_jednostki`, `tajne_statusy`, `notatki_gracza`, `notatki_gm` / {frakcja}), migawki tur per frakcja, migracja starych danych, reguły
  - [x] 4.3b Interfejs: przełączniki „tajne/jawne” dla GM, „🔒 Tajne” dla innych, notatki gracza i GM
- [x] 4.4 Propozycje zmian od graczy i akceptacja GM
  - [x] 4.4a Formularz edycji opisu państwa (informacje podstawowe, motto, sekcje opisu) i bohatera (opis, tytuł, funkcja, wiek, broń): GM zapisuje od razu, gracz swojego państwa wysyła propozycję (`propozycje/{auto}`), reguły
  - [x] 4.4b Panel GM → „Propozycje” (przed → po, Akceptuj / Odrzuć z komentarzem), licznik na przycisku Panel GM; gracz widzi swoje propozycje ze statusem i komentarzem, może wycofać oczekującą; rozpatrzone kasowane po 7 dniach (przy logowaniu admina)
- [x] 4.5 Porządek w bazie (WYMÓG UŻYTKOWNIKA: nie zaśmiecać ograniczonej bazy Spark) — wszystko w tym etapie TYLKO dla admina
  - [x] 4.5a logi zmian (kto, co, kiedy; jeden mały dokument na zapis) + błędy zapisu; automatyczne kasowanie starszych niż N dni (domyślnie 30, ustawiane w Panelu GM) — sprzątanie przy logowaniu GM/admina, bo TTL Firestore wymaga planu płatnego
  - [x] 4.5b diagnostyka w Panelu GM: liczba dokumentów per kolekcja, przybliżony rozmiar, zapisy w tej sesji względem limitów Spark, ostatnie błędy
  - [x] 4.5c „Wyczyść śmieci”: osierocone dane (stany usuniętych zasobów, statusy nieistniejących bohaterów, dokumenty nieistniejących frakcji, logi po terminie) — najpierw podgląd, potem usunięcie
  - [x] 4.5d kopie zapasowe: eksport całej gry do pliku JSON i przywracanie z pliku

### Etap 5 — program na komputer
- [x] 5.1 Instalator Windows (electron-builder) — NSIS z wyborem folderu, ikona `build/icon.png`, `npm run instalator` / `zbuduj-instalator.bat` → `release/`
- [x] 5.2 Sprawdzanie wersji z GitHub Releases przy starcie i co 15 min + guzik „Aktualizuj” — electron-updater, `electron/preload.cjs`, obowiązkowa: nakładka na cały ekran blokuje cały program do aktualizacji
- [x] 5.3 Instrukcja wydawania nowej wersji (dla użytkownika, bo GitHub robi sam) — `INSTRUKCJA-WYDANIE.md`
- [x] 5.4 Changelog „Co nowego” — `src/dane/zmiany.js` (najnowsza na górze), okno `#zmiany` raz po pierwszym uruchomieniu nowej wersji (localStorage „wersja”; bez niej tylko wpis bieżącej), krok 1b w `INSTRUKCJA-WYDANIE.md`; wersja podniesiona do 0.1.2

### Etap 6 — mapa (gdy będzie rysunek)
- [x] 6.0 Przebudowa układu (zrobione: `src/mapa.js` przesuwanie/przybliżanie, `assets/mapa/mapa.png` = rysunek bez numerów z `assets/mapa_obraz.py`, szuflada `#szuflada`; start bez otwartej karty): mapa na cały ekran, górny pasek z herbami frakcji + Panel GM + konto; karta frakcji, okno bohatera i Panel GM jako wysuwana z boku szuflada (klik w herb albo prowincję). Ustalenia (2026-10-18): pod paskiem od razu prawdziwy rysunek mapy z przesuwaniem/przybliżaniem (moja decyzja); szuflada z PRAWEJ i ZWĘŻA mapę (jak w WorldWatch), chowa się po kliknięciu w mapę / ✕ / Esc, więc zwykle mapa jest na całym ekranie; w przyszłości dojdą okienka i zakładki; frakcje w pasku jako rząd samych herbów (nazwa w podpowiedzi, własna frakcja w ramce)
- [x] 6.0a Wykrycie komórek mapy — `assets/mapa_komorki.py` (kreski → narożniki → wododział), wynik `materialy/mapa/komorki_2.png`; błędy poprawiane w edytorze
- [x] 6.0c Edytor komórek (osobne narzędzie, jednorazowo — decyzja użytkownika 2026-10-18): `edytor-mapy.bat` → strona w przeglądarce (serwer Vite) z rysunkiem i komórkami; narzędzia: numer prowincji (klik → wpis; 2 komórki z tym samym numerem = prowincja), scal (klik A, klik B), podziel (rysowana linia), cofnij; zapis sam do `materialy/mapa/` (edycje.json + komorki_final.png + prowincje.json). Wynik wbudowany w program w 6.0b. Woda (jeziora) i góry też w edytorze: „Woda (W)” klik w komórkę, „Góry (G)” pędzel (Shift = zmaż) → `gory_final.png`
- [x] 6.0e Numery prowincji (użytkownik 2026-10-18: ponumeruj sam; numery z rysunku to TYLKO wewnętrzne id — na mapie w programie nie są wyświetlane): odczyt ręcznie pisanych numerów z wycinków + `assets/mapa_popraw.py` (pasy wzdłuż brzegów i rzek do sąsiadów, komórki z dwoma numerami rozdzielone) → numery jako edycje w edytorze. Wynik: 319 prowincji (308 po 2 komórki). Wyjątek (użytkownik): dwie sąsiednie wyspy z tym samym numerem to OSOBNE prowincje po 1 komórce — id „90a”/„90b” (90, 91, 244, 258, 259). Na rysunku brak numeru 166, a 202 ma jedną komórkę. Dolne kontynenty bez numerów (każda komórka = prowincja, id nada 6.0b)
- [x] 6.0d Góry (decyzja użytkownika 2026-10-18): skrawki komórek bez numeru w pasmach gór skrypt dołącza do sąsiada z numerem (reszta — Scal w edytorze); góry nie do przejścia bez umiejętności frakcji
- [x] 6.0b Sąsiedztwo + typ granicy — `assets/mapa_sasiedztwo.py` → `materialy/mapa/sasiedztwo.json` (622 prowincje: 319 z numerem + 303 „D<n>” z dolnych kontynentów; 1435 granic: 1215 zwykłych, 110 górskich, 110 rzecznych) i `podglad_granice.png`. Góry: kontury szczytów domknięte w pasmo, granica „góry”, gdy ≥50% jej długości leży ≤28 px (1/4) od pasma; „rzeka”, gdy ≥50% ≤6 px od linii rzeki. Typy da się poprawić później w edytorze w grze (6.2)
- [x] 6.0f Kształty prowincji w programie — obraz-maska z indeksem (`assets/mapa/prowincje.png`, 2500², R*256+G) + `assets/mapa/prowincje.json` (id, środek, ramka, sąsiedzi z typem) z `assets/mapa_dane.py`
- [x] 6.1a Prowincje na mapie: podświetlenie pod kursorem, klik → karta prowincji w szufladzie (id, sąsiedzi z typem granicy, klik w sąsiada), obrys wybranej, klik w wodę zamyka; bez PixiJS (zwykły obraz + canvas, przerysowanie tylko ramki prowincji)
- [x] 6.1b Ostrość przy dużym przybliżeniu — `assets/mapa_obraz.py` tnie rysunek bez numerów na kafle 1024² (`public/mapa/kafle/1` pełna rozdz., `/2` połowa; 432 pliki, ok. 6 MB; spis `assets/mapa/kafle.json`); `mapa.js` trzyma w DOM tylko widoczne kafle odpowiedniego poziomu
- [ ] 6.2 Edytor prowincji: obrys, numer, miasto + 2 wioski (punkty osad na mapie); sąsiedztwo prowincji i typ każdej granicy (zwykła / góry / rzeka / rzeka z mostem)
- [ ] 6.2b Mosty: GM/admin stawia, przesuwa i usuwa mosty na rzekach w edytorze mapy (na rysunku mostów nie ma — wszystkie stawia ręcznie GM/admin w grze); most zamienia granicę „rzeka” na „rzeka z mostem” — uwzględniane przy ruchu i wyznaczaniu trasy armii
- [x] 6.3 Właściciele, kolory, wasale/marionetki, ziemia niczyja, opis prowincji. Ustalenia (2026-10-18): właściciela ustawia GM/admin w karcie prowincji; kolor frakcji półprzezroczysty; wszystko jawne; wasale/marionetki = osobne KRAJE NPC (nazwa, rodzaj, zwierzchnik, opis) zakładane w Panelu GM, kolor w odcieniu zwierzchnika (kolejne na przemian jaśniej/ciemniej). Dane: dokument `gra/prowincje` { p: {id: {wlasciciel (idFrakcji | „npc:<id>”), nazwa, opis}}, npc: {...} } — reguły bez zmian (gra/* zapis GM, odczyt członkowie)
- [ ] 6.4 Produkcja i sloty budynków prowincji (przed startem krótki wywiad: lista budynków, kto ją ustala, czy produkcja sumuje się na karcie frakcji, co widzą inni)
- [ ] 6.5 Złoża (zasoby występujące w prowincji) — OSOBNA rzecz od produkcji (użytkownik 2026-10-18): każdy z dwóch regionów prowincji (dwa obszary z rysunku) ma jedno złoże do wybrania; do wyboru zasoby bazowe (wspólne typy zasobów, które ma każdy) oraz specjalne (unikalne zasoby frakcji) — specjalne tylko dla kraju, który kontroluje prowincję. Do ustalenia przy wywiadzie 6.4: kto wybiera złoże (GM czy gracz-właściciel), co ze złożem specjalnym po zmianie właściciela, czy dolne kontynenty (1 obszar = 1 prowincja) mają jedno złoże

### Etap 7 — dalej
- [ ] 7.1 Armie i floty na mapie wg zasad GM: dowódca (bohater albo pospolity dowódca) obowiązkowy, liczba żołnierzy, położenie (prowincja + osada albo „w polu”)
- [ ] 7.1b Ruch armii: 1 ruch na turę (sąsiednia prowincja albo inna osada w tej samej prowincji), blokada gór i rzek bez mostu (chyba że frakcja ma umiejętność — przełączniki przy frakcji dla GM), zerowanie ruchów przy zamknięciu tury; wyznaczanie trasy (pathfinding) na grafie sąsiedztwa prowincji z uwzględnieniem gór, rzek i mostów (w tym postawionych w 6.2b) oraz umiejętności frakcji — podpowiedź trasy na kilka tur
- [ ] 7.1c Rozwiązanie armii: poniżej 100 żołnierzy (nie licząc dowódcy) — oznaczenie „do rozwiązania”, rozwiązanie przy zamknięciu tury
- [ ] 7.2 Kronika zdarzeń tury
- [ ] 7.3 Krótkie animacje portretów (oddech, mrugnięcie, błysk)

### Etap 8 — samouczki (na sam koniec, gdy wszystkie funkcje gotowe)
- [ ] 8.0 NAJPIERW poproś użytkownika o jego grafikę Zgrzyta (ma gotową) — na jej podstawie karta postaci i awatar; nie generuj Zgrzyta od zera
- [ ] 8.1 Samouczek dla graczy prowadzony przez awatar Zgrzyta (Zeren, Nieumarli — `materialy/info/frakcje/zarys nieumarłych.md`): portret + dymki krok po kroku po funkcjach gracza
- [ ] 8.2 Osobny samouczek dla GM z tym samym awatarem Zgrzyta: Panel GM, zasoby, tury, propozycje, edytor mapy, armie

## Decyzje
- 2026-10-16: nowy projekt od zera (nie przerabiamy WorldWatch).
- 2026-10-16: Electron + web z jednego kodu; przeglądarka (WebGL/PixiJS) wystarcza do pixel artu i animacji.
- 2026-10-16: nowy projekt Firebase, plan Spark; do tego czasu tryb DEMO.
- 2026-10-16: NPC nie mają kart — ich prowincje to ziemia niczyja z opcjonalnym opisem.
- 2026-10-16: portrety od razu pixel art 128 px; obrazy graczy służą jako wzór.

- 2026-10-16: „Królestwo Szarych Kłów” = państwo orków (Gor-Khar).
- 2026-10-16: Sala Tronów na ekranie logowania; władcą Czarnego Smoka jest smok Shire.
- 2026-10-16: Sala Tronów = wariant B (osobna scena dla każdego władcy, jak `B_surtr_v1.png`), rozdzielczość pełny ekran 16:9: generowanie 1024×576 z -Hires → 2048×1152 → 1920×1080.
- 2026-10-16: wygląd władców według obrazków graczy (np. Tarael fioletowy, nie turkusowy; Elmon to istota z macek i czerwonych oczu). Wszystko o władcach: `assets/postacie/wladcy.md`.
- 2026-10-16: Tarael: czarne włosy z turkusowymi końcówkami, taka sama bródka, czarne białka i turkusowe tęczówki (ustalone przez użytkownika, ważniejsze niż obrazek gracza).
- 2026-10-16: logowanie przez e-mail albo Google.
- 2026-10-16: plan zaakceptowany. Nazwa: „Fantasy RP dla autystów”. Admin = użytkownik.

- 2026-10-16: 7 scen władców zaakceptowanych przez użytkownika (Surtr v7, Seranya v5, Gobloni v9, Elmon v3, Shire v4, Drogath v4, Tarael v5).
- 2026-10-16: menu główne jeszcze niezaakceptowane — najpierw kilka wariantów z animacjami do wyboru; potem dopiero dalsze kroki.
- 2026-10-16: sprzątać `assets/_drafts/` na bieżąco (polecenie użytkownika).
- 2026-10-16: menu: użytkownik chce połączenia C+D → wariant E (duży tytuł, panel bez ramki, miniatury władców po prawej, przejście z błyskiem). Animacje v2: mruganie powieką w kolorze skóry z linią rzęs, osobny ruch głowy, mocniejszy oddech, dryf kamery, mgła, smugi światła, dym, drobiny przed kamerą, drganie światła pochodni. 
- 2026-10-16: użytkownik: „wersja E jest jedyną, co mi się podoba” — warianty A–D usunięte, zostaje `assets/menu.html`. Smok Shire: namalowany dym przy paszczy faluje (osobna warstwa `shire_dym.png` + odtworzone tło `shire_dym_tlo.png`), co 5–9 s smok wydmuchuje kłęby dymu.
- 2026-10-16: uwagi użytkownika do grafik, które obowiązują dalej: młot Surtra ma wyglądać na wykuty, a nie „wklejony w paincie”; Tarael ma czarne włosy i bródkę z turkusem, czarne białka, turkusowe tęczówki.

- 2026-10-16: szkielet: Vite 8 + Electron 44 w głównym folderze projektu; `index.html` + `src/main.js` + `src/style.css` (menu Sali Tronów), `electron/main.cjs` ładuje `dist/`. Skrypty: `npm run dev` (przeglądarka), `npm run build`, `npm run app` (build + okno programu). Wersja aplikacji = `version` w `package.json` (pokazywana w menu) — pod to pójdzie auto-aktualizacja z etapu 5. Obrazy scen wchodzą do builda przez `import.meta.glob` (fanarty nie).

- 2026-10-16: dane DEMO w `src/dane/` (`frakcje.js`, `bohaterowie.js`, `magazyn.js` z wczytaj/zapisz/resetuj, klucz localStorage `frp-demo`). Po zmianie danych startowych podbić `WERSJA` w `magazyn.js`. Teksty z Discorda oczyszczone z rozmów i lekko skrócone (Kreeganie: wycieczka Lucjana przerobiona na sekcje).

- 2026-10-16: unikalne zasoby = lista per frakcja (`zasoby: [{nazwa, opis}]`), każdy dodawany i usuwany osobno na karcie frakcji (w DEMO może każdy, od etapu 4 tylko GM/admin). Mechaniki frakcji na razie usunięte — użytkownik może je dodać później, gdy pozna mechaniki innych graczy. Stany liczbowe zasobów dojdą w 3.2.
- 2026-10-16: użytkownik: wszystko (zasoby, mapa, wydarzenia) finalnie w Firebase, żeby wszyscy mieli to samo na żywo. Kod pisać tak, żeby zmiany szły przez `magazyn.js` (jedno miejsce do podmiany na Firestore).
- 2026-10-16: `vite.config.mjs` (było .js — ostrzeżenie Vite o ESM).
- 2026-10-17: Karevra (dullahan) na portretach bez głowy — korona cierni nad pustą szyją i czerwony dym.
- 2026-10-17: Merrla = pełny portret (od głowy do pasa/kolan, cała postać w kwadracie, mgła tylko wokół), nie popiersie ucięte mgłą.
- 2026-10-17: 2.4 — Koszmarne Widma = jeden portret trójki (Veythar w środku); Kain i Anna = wspólny portret; Lucjan z opisu (brak obrazka); Baba Jaga = zbliżenie na wiedźmę, chatka na kurzych nogach w tle. Karty: `goblandia.md`, `rogus-ardens.md`, `czarny-smok.md`.
- 2026-10-17: 2.5 — godła Aurelii, Goblandii i Czarnego Smoka projektuję z opisów (gracze mogą podmienić); herb = tarcza herbowa; ikony najpierw 8 podstawowych; ramki pixel art 9-slice.
- 2026-10-17: gracze usunięci z danych frakcji (pole `gracz`) — admin przypisuje graczy do państw po ich zalogowaniu, jak w WorldWatch (etap 4.2). `WERSJA` w magazyn.js → 3.
- 2026-10-17: 3.1 — osobny „Panel GM” (przycisk w górnym pasku; później jednostki, tury, role). Globalne typy zasobów: dodaj / zmień nazwę / usuń / kolejność; każdy ma nazwę, jednostkę (np. „szt.”, „t”) i ikonę (nowe bez ikony = litera w ramce). Stany = liczby. Unikalne zasoby dalej na karcie frakcji. `id` typu stały (nie zmienia się przy zmianie nazwy), żeby stany z 3.2 się nie gubiły.
- 2026-10-17: bez wklejania tabel z Excela (decyzja użytkownika) — tylko kopiuj-wklej wartości w pole danego zasobu.
- 2026-10-17: zamknięcie tury musi dać się cofnąć (pomyłkowe kliknięcie) — cofa się ostatnią migawkę.
- 2026-10-17: jednostki — na razie TYLKO lista jednostek frakcji z podziałem na elitarność (decyzja użytkownika: mechaniki kosztów/punktów/statystyk jeszcze nie ma, pola dojdą w trakcie). Edycja na karcie frakcji.
- 2026-10-17: listy jednostek NIE wypełniamy z materiałów — dodaje je GM (decyzja użytkownika).
- 2026-10-17: Firebase: zapis tylko zmienionych dokumentów (porównanie treści), żeby oszczędzać limit zapisów; logi z autokasowaniem, diagnostyka i czyszczenie śmieci — wymóg użytkownika (etap 4.5).
- 2026-10-17: program Electron serwuje stronę z wbudowanego serwera http://localhost:47821 (nie file://), bo Firebase nie pozwala logować przez Google z file://.
- 2026-10-17: WYMÓG UŻYTKOWNIKA: zasoby, stany, tury i jednostki zmieniają TYLKO GM i admin — pilnują tego reguły Firestore (nie tylko ukryte przyciski).
- 2026-10-17: mapa = najważniejszy element (użytkownik). Docelowy układ: mapa na cały ekran + szuflady z boku (jak Civ/AoW). Przebudowa dopiero przy etapie mapy (krok 6.0), etap 4 kończymy w obecnym układzie — nowe widoki pisać jako samodzielne panele, żeby dało się je przenieść do szuflady.
- 2026-10-17: tajność decyduje GM: per frakcja przełącznik tajne/jawne dla 3 rodzajów — zasoby (liczby + unikalne zasoby + migawki tur), jednostki, statusy bohaterów; domyślnie wszystko tajne. Notatki: gracza (pisze gracz tej frakcji, czyta on + GM) i GM (tylko GM/admin). Tajne = gracz tej frakcji + GM + admin.
- 2026-10-17: kolejność: 4.5 (diagnostyka, logi, porządki) przed 4.4 — prośba użytkownika.
- 2026-10-17: logi, diagnostyka, porządki i kopie — tylko admin (GM „nie będzie wiedział po co to”).
- 2026-10-17: propozycje gracza (tylko swoje państwo): opis państwa (sekcje), informacje podstawowe, istniejący bohaterowie (bez dodawania nowych). GM przegląda w Panelu GM z licznikiem; gracz widzi status i komentarz GM. GM ten sam formularz zapisuje od razu. Rozpatrzone propozycje kasowane po 7 dniach (użytkownik).
- 2026-10-17: etap 5 — repo GitHub `Erlethaden/Fantasy_RP` (publiczne); instalator NSIS z wyborem folderu; aktualizacja OBOWIĄZKOWA: przy starcie sprawdzenie wersji, jeśli jest nowsza — w Sali Tronów „Dostępna wersja X — Aktualizuj” (pobiera, instaluje, uruchamia ponownie), do tego czasu logowanie i wejście zablokowane. Brak internetu/GitHuba nie blokuje.
- 2026-10-18: etap 5 przetestowany przez użytkownika (aktualizacja działa). GM podał zasady armii — w Specyfikacji, kroki 6.2 i 7.1–7.1c.
- 2026-10-18: mosty stawiane/usuwane w edytorze mapy (GM/admin) i uwzględniane przy wyznaczaniu trasy armii (prośba użytkownika).

## Otwarte pytania
- Brakujące dane od graczy: stolica Goblandii, godła Aurelii/Goblandii/Czarnego Smoka, motto kilku frakcji, opisy Baby Jagi i Czarownika z krainy IRS. „Unikalne zasoby” to na razie propozycje z opisów — GM ma je potwierdzić.
- Ilu graczy i kto GM (prawdopodobnie Kermitta) — ustalić przy etapie 4.

## Pomysły na później
- Grafiki do interfejsu (użytkownik 2026-10-18, „na później”): pixel-artowe ramki/belki górnego paska i szuflady, przyciski, tło paska, ozdobniki — z generatora w stylu `assets/STYLE.md`, żeby UI pasował do portretów i herbów.
- Tekstury mapy (użytkownik 2026-10-18, po 6.1): bezszwowe kafelki pixel art (trawa, góry, woda, wybrzeże, ew. las) z generatora, nakładane według masek, które już są (ląd, ocean, jeziora, pasmo gór, rzeki); kreski z rysunku zostają na wierzchu, kolory właścicieli jako półprzezroczysta warstwa. Lasów i pustyń rysunek nie zaznacza — wtedy GM malowałby je pędzlem w edytorze.
- Koszt jednostek w zasobach i punkty limitu, gdy GM ustali mechanikę armii.
- Wykresy zasobów w czasie.
- Dyplomacja: traktaty, sojusze, wiadomości między państwami (było w WorldWatch).
- Powiadomienia o nowej turze; link/eksport na Discorda.
- Muzyka frakcji (gracze linkują motywy z Heroes/Disciples).
