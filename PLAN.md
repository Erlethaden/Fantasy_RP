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
  - Mapa od użytkownika (2026-10-18): `materialy/Mapa RPG.png`, 20000×20000, rysunek kreskowy (jeden PNG, bez warstw). Granice komórek przerywanymi liniami; KAŻDY OBSZAR = OSOBNA PROWINCJA (poprawka użytkownika 2026-10-18 po wydaniu 0.2.0 — wcześniej zakładaliśmy dwa obszary z tym samym numerem na prowincję); dwa obszary z tym samym ręcznie pisanym numerem to „<n>a” i „<n>b”. Dolne kontynenty (lewy i prawy) bez numerów — tam każda komórka = osobna prowincja (numery nada się w edytorze). Góry i rzeki narysowane, MOSTÓW na rysunku nie ma (użytkownik 2026-10-18 — dodaje je GM/admin w grze); podpisy graczy (DEZ, WEGA, AIDEN, ZEREN, LUCJAN, HELLIA) = ich prowincje startowe.
  - Woda na mapie (użytkownik, 2026-10-18): rzeki, jeziora, morza i oceany. Do rozpoznania przy wykrywaniu obszarów: woda to NIE prowincje lądowe (jeziora = białe „dziury” w lądzie, morza/oceany = tło wokół kontynentów i wysp). Znaczenie dla gry: rzeka bez mostu blokuje armie (zasady GM), a jeziora, morza i oceany to obszary dla flot (7.1) — może trzeba będzie je podzielić na akweny; do ustalenia przy etapie 7.
  - Sposób: rysunek jako tło (kafelki do przybliżania), komórki wykryte automatycznie — `assets/mapa_komorki.py` → `materialy/mapa/komorki_2.png` (skala 1/2, 1045 komórek, 10 jezior; rzeki i góry w `warstwy_2.png`; 93% numerów w osobnej komórce): rysunek ma jedną kreskę pośrodku każdego boku komórki i puste narożniki, więc skrypt rozpoznaje kreski granic (cyfry, napisy i góry pomija), łączy/przedłuża je do narożników, a resztę szczelin domyka wododział; ocean liczony od wszystkich kresek. Zostają błędy w obie strony (część komórek zlana, część pocięta) — do poprawy w edytorze (scal / podziel), numery dopasowane automatycznie ile się da + edytor do poprawek (klik w komórkę → numer, granica → góry/rzeka; mosty dopiero w grze — 6.2e).
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
- [x] 6.2 Osady i granice. Ustalenia (wywiad 2026-10-18): osady rozstawione AUTOMATYCZNIE (miasto + 2 wioski w każdej prowincji), GM może je dodawać i usuwać (bez przeciągania); właściciel osady = zawsze właściciel prowincji; na mapie małe ikonki pixel art (miasto, wioska) widoczne po przybliżeniu; nazwy osad OPCJONALNE — wpisuje je GM albo gracz-właściciel (użytkownik 2026-10-19: „wywal nazwy”, generator nazw usunięty)
  - [x] 6.2a Rozstawienie (`assets/mapa_osady.py` → pole `osady` w `assets/mapa/prowincje.json`; osady bez nazw; znaczniki tymczasowe: miasta od przybliżenia 0.3, wioski od 0.5, podpisy nazw od 0.9/1.6): skrypt liczy domyślne miejsca miasta i 2 wiosek (z dala od brzegu, gór i rzek) → `assets/mapa/prowincje.json`; generator nazw `src/dane/nazwy.js`; osady na karcie prowincji + proste znaczniki na mapie
  - [x] 6.2b Ikonki pixel art miasta, wioski i stolicy (2026-10-19: miasto i stolica 32 px, wioska 24 px, wyświetlane 1:1; użytkownik OK, do obejrzenia w programie)
  - [x] 6.2c-1 Nazwy osad (2026-10-19, opcja „gracz wpisuje sam”): GM — każda osada, gracz — osady w prowincjach swojej frakcji; dokumenty `nazwy_osad/{prowincja}` { n: {numer: nazwa} }, reguła `mojaProwincja` w firestore.rules (sprawdzona na emulatorze: 12 przypadków)
  - [x] 6.2c GM: dodaj/usuń osadę (klik w mapę w prowincji); STOLICA frakcji (prośba użytkownika 2026-10-18): GM zaznacza miasto jako stolicę (jedna na frakcję, kraj NPC też może mieć), osobna ikonka z koroną, nazwa domyślnie z pola „Stolica” frakcji; stolica widoczna na karcie frakcji (klik → pokaż na mapie)
  - [x] 6.2d GM: ręczna zmiana typu granicy (zwykła / góry / rzeka) na karcie prowincji — lista przy każdym sąsiedzie; zapis po obu stronach w `gra/prowincje` p.<id>.granice = {idSąsiada: typ}, tylko różnice od wykrytego z rysunku
- [x] 6.2e Mosty (2026-10-19: karta prowincji → „+ Most” → klik na rzece; most łączy prowincję z najbliższym sąsiadem z granicą „rzeka” w promieniu 30 px; × przy sąsiedzie usuwa; przesuwanie = usuń + postaw; dane p.<id>.mosty = {idSąsiada: [x, y]} po obu stronach; zmiana typu granicy usuwa most; ikonka 24 px od przybliżenia 0.8): GM/admin stawia, przesuwa i usuwa mosty na rzekach w edytorze mapy (na rysunku mostów nie ma — wszystkie stawia ręcznie GM/admin w grze); most zamienia granicę „rzeka” na „rzeka z mostem” — uwzględniane przy ruchu i wyznaczaniu trasy armii
- [x] 6.0g Prowincja = jeden obszar (0.2.1): `mapa_sasiedztwo.py` daje „<n>a/<n>b” (a = wyżej/z lewej), 930 prowincji, 2246 granic (161 góry, 124 rzeka); wpisy „<n>” z 0.2.0 GM przenosi przy wejściu na obie połówki (`przeniesStareProwincje` w main.js)
- [x] 6.0i Granice prowincji rysowane przez program (użytkownik 2026-10-19: przerywane kreski z rysunku często leżały w środku jednej prowincji): `mapa_dane.py` → `assets/mapa/granice.json` (kontury z wygładzonej maski 1/4, tylko między dwiema prowincjami, ~1300 linii); `mapa_obraz.py` usuwa z rysunku i kafli wszystko poza długimi liniami (wybrzeża, rzeki, góry) — z dala od gór i rzek; `mapa.js` rysuje granice przerywaną kreską na płótnie ekranu (stała grubość)
- [x] 6.0h Góry = ziemia niczyja (użytkownik 2026-10-18/19, „prowincje wyciągają się po górach”, np. 63b, 63a, 17a): `mapa_dane.py` wycina z prowincji pasmo gór (maska gór + kreski zboczy z nią połączone + wnętrza szczytów „Λ” (kreska nad, z lewej i z prawej ≤ 45 px w 1/8) + domknięcie okrągłym pędzlem R=10 + małe dziury) — bez koloru i kliknięcia; sąsiedztwo przez góry zostaje (typ „góry”). Prowincja przecięta pasmem zachowuje część przy swoim napisie z rysunku (`materialy/mapa/napisy.json`), odcięte kawałki → sąsiad, jeśli graniczą głównie z lądem, inaczej ziemia niczyja
- [x] 6.3 Właściciele, kolory, wasale/marionetki, ziemia niczyja, opis prowincji. Ustalenia (2026-10-18): właściciela ustawia GM/admin w karcie prowincji; kolor frakcji półprzezroczysty; wszystko jawne; wasale/marionetki = osobne KRAJE NPC (nazwa, rodzaj, zwierzchnik, opis) zakładane w Panelu GM, kolor w odcieniu zwierzchnika (kolejne na przemian jaśniej/ciemniej). Dane: dokument `gra/prowincje` { p: {id: {wlasciciel (idFrakcji | „npc:<id>”), nazwa, opis}}, npc: {...} } — reguły bez zmian (gra/* zapis GM, odczyt członkowie)
- [x] 6.4 Sloty budynków + złoża (wywiad 2026-10-19; łączy 6.4 i 6.5): budynek = TYLKO wybór zasobu z listy właściciela prowincji (wspólne typy zasobów + unikalne zasoby frakcji), bez ilości i bez liczenia produkcji; sloty: 2 w mieście/stolicy, 1 na wioskę; złoże = jeden zasób na prowincję z tej samej listy. Stawia/zmienia tylko GM/admin. Karta frakcji: podsumowanie „ile budynków (i złóż) daje dany zasób w całym kraju” + liczba pustych slotów. Widoczność: przełącznik tajne/jawne na frakcję (jak zasoby), DOMYŚLNIE JAWNE. Podbój: budynki i złoże na zasoby bazowe zostają, na unikalne zasoby starej frakcji — czyszczone.
  - [x] 6.4a Dane + reguły (tajne_budynki/{frakcja}) + karta prowincji (GM: wybór zasobu w slotach i złożu)
  - [x] 6.4b Podsumowanie na karcie frakcji + puste sloty; czyszczenie unikalnych po zmianie właściciela
- [x] 6.5 Złoża — połączone z 6.4 (decyzja 2026-10-19)

### Etap 7 — dalej
- Armie — wywiad 2026-10-19 (uzupełnia zasady GM ze Specyfikacji):
  - Skład: dowódca (bohater frakcji albo „pospolity dowódca” z imieniem) + opcjonalnie dalsi bohaterowie + oddziały z listy jednostek frakcji z liczbą żołnierzy; liczebność = suma oddziałów (próg 100 bez bohaterów/dowódcy).
  - Bohater należy najwyżej do jednej armii; w armii może być kilku bohaterów. Bohater w armii dostaje sam status „na misji — z armią”, po rozwiązaniu armii (albo wyjęciu z niej) wraca „w stolicy”.
  - Ruch: GM wybiera cel (prowincja / osada), program wyznacza najkrótszą trasę (graf sąsiedztwa; góry i rzeka bez mostu tylko z umiejętnością frakcji; mosty z 6.2e). Przy „Zamknij turę” każda armia robi 1 krok (sąsiednia prowincja albo inna osada w tej samej prowincji). Cofnięcie tury cofa ruchy. GM może też przestawić armię ręcznie.
  - Mapa: znacznik armii (NOWA ikonka pixel art, kolor frakcji) jawny dla wszystkich; skład, dowódca, trasa i cel — tylko właściciel + GM (GM może ujawnić przełącznikiem jak zasoby, domyślnie tajne). Trasa: przebyta część ciemniejsza, reszta przerywana, przy celu „za N tur”.
  - Floty: później (mapa nie dzieli morza).
  - Pościg i bitwy (wywiad 2026-10-19): celem może być też ARMIA (dowolna) — trasa liczona co turę od nowa do jej aktualnego miejsca. Stan wojny między krajami (frakcje i kraje NPC) ustawia GM w Panelu GM; jawny dla wszystkich, bez wpisu = pokój. Bitwa, gdy armie krajów w wojnie po ruchu stoją w tej samej prowincji albo w tej samej turze mijają się na tej samej granicy. Bitwa: obie armie stają, znak bitwy na mapie, „w bitwie” na kartach; GM rozstrzyga na Discordzie, wpisuje straty / rozwiązuje armię i klika „zakończ bitwę”. GM może też wymusić bitwę armii stojących obok siebie (sąsiednie prowincje).
- [x] 7.1a Dane armii: publiczne pozycje (`gra/armie` {id: {frakcja, prowincja, osada}}) + tajne `tajne_armie/{f}` (nazwa, dowódca, bohaterowie, oddziały, cel, trasa); reguły; GM zakłada / edytuje / rozwiązuje armię na karcie frakcji; status bohaterów sam
- [x] 7.1b Ikonka armii (pixel art) + znaczniki armii na mapie, karta armii po kliknięciu (skład tylko dla uprawnionych)
- [x] 7.1c Umiejętności frakcji (przełączniki GM: „przechodzi przez góry”, „przechodzi przez rzeki”) + wyznaczanie trasy (najkrótsza droga) + wybór celu klikiem na mapie (prowincja, osada albo armia — pościg) + rysowanie trasy i „za N tur”
- [x] 7.1d Ruch przy zamknięciu tury (1 krok), cofnięcie tury cofa ruch, ręczne przestawienie przez GM
- [x] 7.1e Rozwiązanie armii: poniżej 100 żołnierzy — „do rozwiązania”, rozwiązanie przy zamknięciu tury
- [x] 7.1f Wojny: Panel GM — pary „w stanie wojny” (frakcje + kraje NPC); karta frakcji „w wojnie z: …”
- [x] 7.1g Bitwy: wykrywanie przy zamknięciu tury (ta sama prowincja / mijanie), zatrzymanie armii, znak bitwy na mapie, „zakończ bitwę” (GM), wymuszenie bitwy dla sąsiadów (GM)
- [x] 7.1h Ekran bitwy (wywiad 2026-10-19): okno z obiema stronami obok siebie (kraj, armie, dowódcy, bohaterowie, oddziały pogrupowane: Elita / Regularne / Chołota, sumy, porównanie sił). Pełny skład widzą uczestnicy + GM (raport `bitwy/{id}` zapisywany przez GM, reguła: uczestnicy), inni — tylko kto z kim, gdzie i wynik. Otwiera się klikiem w znak bitwy / „Ekran bitwy” przy armii, a uczestnikowi raz sam po wejściu, gdy jego armia jest w nowej bitwie. Bitwa trwa, aż GM wpisze wynik: zwycięzca (strona / remis), opis, opcjonalnie straty przy oddziałach (odejmowane od armii) i polegli bohaterowie (status „martwy”). Zakończone bitwy zostają w historii (wynik jawny).
- [x] 7.1i Skutki bitwy lądowej (wywiad 2026-10-19): na ekranie bitwy przy wyniku GM wybiera los każdej przegranej armii — odwrót (domyślnie; program cofa ją o 1 prowincję w stronę własnych ziem i kasuje cel), zostaje, rozbita (znika), poddana (żołnierze znikają, bohaterowie w niewoli zwycięzcy). Zwycięzca idzie dalej do celu (bez zmian). Bohaterowie: oprócz „poległ” — „ranny” (status ranny) i „w niewoli” (znika z armii, na karcie „w niewoli u: …”, GM może uwolnić). Zaznaczenie „zwycięzca zdobywa prowincję” — zmiana właściciela jak przy podboju (budynki, stolica, kronika). Wszystko w kronice i raporcie bitwy.
- [x] 7.2 Kronika zdarzeń tury (wywiad 2026-10-19): automatycznie bitwy (wybuch, wynik), wojny, pokoje, traktaty (zawarte, zerwane), zmiany właścicieli prowincji + wpisy GM tekstem (opcjonalnie tajne dla wybranych krajów). Jedna wspólna kronika, tajne wpisy (tajny traktat, tajny wpis GM) widzą tylko zainteresowane kraje i GM — kolekcja `kronika/{id}` z regułą jak traktaty. Przycisk „Kronika” w pasku (szuflada, tury od najnowszej, znaczek „nowe”) + zdarzenia frakcji na jej karcie. Przy turze „Kopiuj na Discorda” (jawna część jako gotowy tekst). Cofnięcie tury usuwa wpisy z jej zamknięcia.
- [x] 7.8 Floty i bitwy morskie — wywiad 2026-10-19:
  - Akweny: skrypt dzieli morza i oceany na ok. 60–80 akwenów (zatoki i cieśniny osobno; jeziora bez akwenów), GM nadaje nazwy na karcie akwenu (klik w morze); granice akwenów kreską po przybliżeniu.
  - Skład floty jak armia: dowódca (bohater / pospolity) + oddziały okrętów z jednostek frakcji. Jednostki morskie wpisuje się na karcie frakcji jak lądowe (znacznik „morska”, opcjonalnie pojemność okrętu).
  - Pojemność floty = suma pojemności okrętów; GM może wpisać własną („mieści żołnierzy”), puste i brak pojemności typów = bez limitu. Gdy armia się nie mieści — ostrzeżenie i propozycja dobrania kolejnej floty.
  - Ruch: cel = akwen, trasa po sąsiedztwie akwenów, 1 akwen na turę przy „Zamknij turę”, cofnięcie tury cofa ruch, GM może przestawić.
  - Przeprawa: gdy trasa armii wymaga morza (wyspa, inny kontynent), program o tym mówi i pozwala wybrać jedną lub kilka flot do transportu. Domyślnie floty od razu płyną do miejsca załadunku (akwen przy nadmorskiej prowincji startu), nawet jeśli armii jeszcze tam nie ma; GM może to pominąć (flota od razu na miejscu) albo przyspieszyć. Załadunek i wyładunek (nadmorska prowincja przy celu) automatycznie.
  - Bitwy morskie jak lądowe: wrogie floty (kraje w wojnie) w tym samym akwenie albo mijające się → bitwa przy zamknięciu tury, ekran bitwy; armia na pokładzie bierze udział, GM wpisuje straty też dla niej (może zatopić całą). Kronika.
  - Widoczność jak armie: znacznik floty (nowa ikonka pixel art w kolorze kraju) widzą wszyscy; skład, dowódca, ładunek i trasa — właściciel + GM (GM może ujawnić). Gracz proponuje cel floty jak armii (7.14).
  - [x] 7.8a Akweny (2026-10-19: 120 akwenów — użytkownik: „nieco bardziej” po 82, potem A66 podzielony ręcznie („akweny_podziel” w poprawki.json), też morza śródlądowe — „jeziora” z edytora to w dużej części morza; małe jeziora < 12000 px bez akwenu): `assets/mapa_akweny.py` → `assets/mapa/akweny.png` (indeks) + `akweny.json` (id, środek, sąsiednie akweny, nadbrzeżne prowincje); w programie klik w morze = karta akwenu (nazwa — GM), granice akwenów po przybliżeniu
  - [x] 7.8a-2 Jeziora i rzeki (użytkownik 2026-10-19): akweny mają typ morze / jezioro (16 jezior), sąsiedzi z typem „morze” / „rzeka” (17 połączeń rzecznych z maski rzek mapa_teren.py → materialy/mapa/rzeki_2500.png); umiejętność frakcji `zegluga` — wpłynięcie do jeziora i ruch rzeką tylko z nią (pilnuje 7.8d)
  - [x] 7.8b Jednostki morskie na karcie frakcji (znacznik „morska”, pojemność okrętu) — `j.morska`, `j.pojemnosc`; grupa „Okręty”; okręty wykluczone z oddziałów armii
  - [x] 7.8c Floty: dane (jawne pozycje + tajny skład jak armie), ikonka pixel art, znaczniki na mapie, karta floty (dowódca, oddziały okrętów, pojemność z typów albo GM)
  - [x] 7.8d Ruch floty: cel (akwen), trasa, „za N tur”, ruch przy zamknięciu tury, cofnięcie, przestawienie; propozycja celu przez gracza (`fl.cel`, `fl.przebyte`, `trasaFloty()`; propozycja `cel: "rejs"` — reguła w firestore.rules, wdrożona). Rysowanie (użytkownik 2026-10-20): trasa floty po wodzie (`mapa.drogaWodna` — A* po siatce akwenów, z dala od brzegu, wygładzona), trasy armii i szlaki łukami (`krzywa` w mapa.js; szlaki łączone w łańcuchy)
  - [x] 7.8e Przeprawa armii: trasa ląd–morze–ląd, wybór flot do transportu (pojemność, kilka flot), floty płyną do załadunku, GM pomija / przyspiesza, automatyczny załadunek i wyładunek
    - [x] 7.8e-1 Trasa ląd–morze–ląd (`trasaPrzeprawy`: Dijkstra po akwenach, załadunek = 1 tura, 1 akwen/turę, wyładunek = 1 tura), opis na karcie armii, wybór flot do przeprawy przez GM (`a.transport`), pojemność i ostrzeżenie „nie mieści się”, trasa na mapie (też propozycji gracza). Użytkownik 2026-10-20: armia na pokładzie NIE ma osobnego znacznika — tylko ładunek na karcie floty
    - [x] 7.8e-2 Ruch: floty płyną do akwenu załadunku (GM: pomiń / przyspiesz), załadunek gdy armia i flota na miejscu, armia płynie z flotą, wyładunek; ładunek na karcie floty; cofnięcie tury; bitwy lądowe pomijają armie na pokładzie (pozycja na pokładzie `{f, a, floty}`; załadunek gdy floty na miejscu i armia się mieści; GM „Floty od razu do załadunku”; „Przestaw” zdejmuje z pokładu)
  - [x] 7.8f Bitwy morskie (+ użytkownik: wyeksportować PNG ekranu bitwy morskiej do `materialy/podglad_paneli/` jak lądowe). Skutki (wywiad 2026-10-19): los przegranej floty jak armii — odwrót (1 akwen w stronę własnego wybrzeża, domyślnie), zostaje, zatopiona (znika), poddana (znika — okrętów NIE przejmuje zwycięzca); armia na pokładzie dzieli los floty (straty wpisuje GM), przy zatopionej GM może „wysadzić na brzeg” — armia ocalała ląduje w wybranej sąsiedniej nadmorskiej prowincji; bohaterowie: poległ / ranny / niewola / uratowany: wykrywanie (akwen / mijanie), ekran bitwy z flotami i armiami na pokładzie, straty, kronika
- [x] 7.3 Krótkie animacje portretów (oddech, mrugnięcie, błysk) — wywiad 2026-10-20:
  - Gdzie: duży portret w oknie bohatera żyje stale; miniatury na karcie frakcji ożywają po najechaniu.
  - Jak: w kodzie, jak Sala Tronów, bez nowych grafik — oddech (ruch tułowia), mrugnięcie (powieka w kolorze skóry na zaznaczonych oczach; oczy 37 portretów wyznacza Claude i pokazuje podgląd), błysk.
  - Błysk (Claude): refleks światła lekko w kolorze frakcji przesuwający się ukosem po portrecie co 8–15 s; świecące oczy (gogle, demony) pulsują.
  - Rytm: oddech ciągły i delikatny, mrugnięcie co 3–8 s (czasem podwójne), losowo; bez animacji przy systemowym „ograniczeniu ruchu” + przełącznik „Animacje portretów” (zapamiętany w przeglądarce).
  - Technika: canvas ×4 z wyłączonym wygładzaniem (ruch co 1/4 piksela oryginału, ostry pixel art); konfiguracja portretów w osobnym pliku danych.
  - [x] 7.3a Moduł animacji + duży portret i miniatury po najechaniu + przełącznik; konfiguracja oczu dla kilku portretów (próba)
  - [x] 7.3b Oczy (i świecące oczy) wszystkich 37 portretów + podgląd do akceptacji (29 z oczami, w tym 16 świecących; tylko oddech i błysk: aretnuag, czarownik, gorzak, murog — oczy w cieniu lub niewyraźne; karevra — hełm; naelira — ma zamknięte; morthalass, widma — bez wyraźnej twarzy)
- [x] 7.3c Dodatkowe animacje portretów (użytkownik 2026-10-20: wszystkie trzy):
  - [x] 7.3c-1 Migotanie płomieni (świece, latarnie, ogień, lawa, kryształy — obszary w konfiguracji) + unoszące się drobinki (iskry / magia / popiół, rodzaj wg postaci) — moduł + próbka na kilku portretach + poprawka oczu urgasha
  - [x] 7.3c-2 Płomienie i drobinki dla wszystkich portretów + arkusz podglądu
  - [x] 7.3c-3 Ruch idle (użytkownik 2026-10-20): kołysanie włosów/peleryn (góra przypięta) + powolny ruch rąk i broni (fragment obraca się lekko wokół punktu zaczepienia, np. karevra z halabardą) — próbka na 2–3 postaciach, potem decyzja użytkownika
  - [x] 7.3c-4 Ruch idle dla pozostałych portretów (po akceptacji próbki): broń (czarownik, surtr, tarael, krazh, murog), głowy smoków (linnr, shire), ogon merrli, warkocze (naelira, korvaar, velassara, aetharon); `tlo: "auto"` — zamalowanie części pod warstwą przejściem z sąsiednich pikseli

### Etap 7b — handel i dyplomacja (użytkownik 2026-10-19: PRZED samouczkami, „jak w WorldWatch”)
- Handel i traktaty — wywiad 2026-10-19: traktaty wpisuje TYLKO GM (gracze ustalają na Discordzie). Typy: Sojusz, Pakt o nieagresji, Umowa handlowa, Traktat pokojowy, Wasalstwo, Prawo przejścia wojsk, Inny; nazwa dowolna, strony = 2+ krajów (frakcje i kraje NPC), opis tekstem, przełącznik „tajny” (tajny widzą tylko strony + GM — pilnują reguły). Skutki: traktat pokojowy kończy wojnę między stronami; wypowiedzenie wojny pyta o zerwanie sojuszu/paktu między nimi; reszta to informacja. Szlak handlowy = umowa handlowa: złota linia między stolicami — najkrótsza droga lądem po prowincjach (bez gór; rzeki można), a gdy lądem się nie da — linia przez morze (lądowa przerywana, morska ciągła). Linie sojuszy/paktów między stolicami. Na mapie przyciski „Szlaki” / „Sojusze” włączają warstwy.
- [x] 7.4 Traktaty: dane `traktaty/{id}` (reguły: jawne albo strona), Panel GM (dodaj, zerwij, usuń), lista na karcie frakcji, pokój kończy wojnę, wojna pyta o zerwanie sojuszu
- [x] 7.5 Szlaki handlowe i linie sojuszy na mapie + przyciski warstw

- [x] 7.9 Bloki sojuszy i organizacje międzynarodowe — wywiad 2026-10-20 (wzór: WorldWatch `blocs.js`):
  - Blok: nazwa, skrót, rodzaj (sojusz, liga handlowa, zakon, unia…), kolor, statut, członkowie (gracze i NPC), zaproszeni, opcja „tajny” (widzą członkowie, zaproszeni, GM — jak tajne traktaty; wspólne traktaty tajnego bloku też tajne). Znak: tarcza w kolorze bloku ze skrótem (bez nowych grafik).
  - Zakładają gracze i GM: gracz zakłada blok i zaprasza; zaproszony akceptuje albo odrzuca; członek może wyjść. GM może wszystko bezpośrednio (też kraje NPC, rozwiązanie).
  - Zarządzanie (użytkownik): domyślnie GŁOSOWANIE — każdy członek zgłasza wniosek (zaproszenie, wyrzucenie, edycja, wspólne traktaty, rozwiązanie, zmiana trybu), przechodzi zwykłą większością członków (Claude: próg do zmiany; za NPC głosuje GM). Członkowie mogą przegłosować tryb LIDERA — lider zmienia od razu, bez głosowań (aż przegłosują powrót).
  - Wspólne traktaty: zaznaczone typy (handel, sojusz, pakt, przejście wojsk) automatycznie łączą każdą parę członków — działają jak zwykłe traktaty (szlaki, linie sojuszy, kronika), bez osobnych propozycji; nowy członek od razu je dostaje.
  - Mapa: warstwa „Bloki” obok Szlaki/Sojusze — poświata w kolorze bloku wokół ziem członków; klik w blok podświetla tylko jego członków.
  - Wojny: przy wypowiedzeniu wojny członkowi bloku z sojuszem / paktem program ostrzega i proponuje jednym kliknięciem wojnę z resztą bloku — decyduje GM.
  - Lista: przycisk „Bloki” w pasku (szuflada jak Kronika) + sekcja „Bloki” na karcie frakcji (członkostwo, zaproszenia, „Załóż blok”).
  - [x] 7.9a Dane i lista: `stan.bloki` + kolekcja `bloki/{id}` z regułami (jawny / tajny), szuflada „Bloki”, sekcja na karcie frakcji, GM zakłada i edytuje wszystko
  - [x] 7.9b Gracze: załóż blok, zaproszenia (akceptuj / odrzuć), wyjście; głosowania nad wnioskami (większość), tryb lidera; reguły Firestore dla wniosków i głosów
  - [x] 7.9c Wspólne traktaty bloku (zaznaczone typy → pary członków jak traktaty: szlaki, linie, kronika)
  - [x] 7.9d Mapa: warstwa „Bloki” (poświata w kolorze), podświetlenie członków po kliknięciu bloku, znak tarcza + skrót
  - [x] 7.9e Wojna z członkiem bloku: ostrzeżenie + „wojna z całym blokiem” (GM)
- [x] 7.10 Zwykłe kraje NPC (użytkownik 2026-10-19): w Panelu GM można założyć samodzielny kraj NPC bez zwierzchnika (nie tylko wasala/marionetkę z 6.3) — własna nazwa, opis i własny kolor; dalej działa w wojnach, traktatach i jako właściciel prowincji.

### Etap 7b2 — propozycje graczy w grze (użytkownik 2026-10-19)
- Gracz-władca proponuje zmiany swojego państwa, GM akceptuje albo odrzuca z komentarzem. Używamy mechanizmu propozycji z 4.4 (`propozycje/{id}`, Panel GM → „Propozycje”, licznik, status u gracza). Zmienia decyzję z 7b: traktaty dalej zapisuje GM, ale gracz może je zaproponować.
- [x] 7.11 Wywiad 2026-10-19: GM rozpatruje na bieżąco (jak 4.4); traktat najpierw zatwierdzają gracze-strony („Zgadzam się”), kraje NPC — GM, potem GM akceptuje; proponowana trasa armii widoczna dla właściciela i GM w innym stylu („czeka na GM”); GM tylko Akceptuj / Odrzuć z komentarzem (bez edycji propozycji).
- [x] 7.12 Propozycja przeniesienia stolicy: gracz wybiera swoje miasto na karcie prowincji / mapie → GM akceptuje → zmiana jak w 6.2c.
- [x] 7.13 Propozycja budynków: gracz wybiera zasób w pustym/zajętym slocie i w złożu swojej prowincji (lista jak w 6.4) → GM akceptuje.
- [x] 7.14 Propozycja ruchu armii: gracz wybiera cel swojej armii (prowincja, osada, armia — jak w 7.1c) → GM akceptuje → cel i trasa zapisane jak teraz.
- [x] 7.15 Propozycja traktatu: gracz wypełnia formularz traktatu (typ, nazwa, strony, opis, tajny) i propozycję zerwania swojego traktatu → GM akceptuje → zapis jak w 7.4.
- [x] 7.16 Reguły Firestore: gracz zapisuje tylko propozycje dotyczące swojej frakcji (swoje miasto, swoje prowincje, swoje armie, traktat, w którym jest stroną) + test.

### Szlaki handlowe razem (użytkownik 2026-10-19)
- [x] Szlaki w podobnym kierunku łączą się we wspólny pień i rozgałęziają (`szlakiHandlowe`: Dijkstra, użyta granica kosztuje 0.4; wspólne odcinki rysowane raz)

### Wyszukiwarka (użytkownik 2026-10-19)
- [x] Pole w lewym górnym rogu mapy: numer / nazwa prowincji, właściciel, osady z nazwą, akweny → przybliżenie i karta (datalist, Enter = pierwsze trafienie)

### Obecność graczy (użytkownik 2026-10-19)
- [x] Online / ostatnio: Realtime Database `obecnosc/{uid}` {f, on, t}; „online” przy zalogowaniu, „offline” zapisuje serwer przy rozłączeniu (onDisconnect — też Alt+F4), bez odświeżania. Widzą wszyscy zalogowani; zielona kropka przy herbie w górnym pasku + podpowiedź „ostatnio: …”. Reguły `database.rules.json` (testy na emulatorze OK). Wymaga włączenia Realtime Database w konsoli i `databaseURL` w `src/firebase-config.js`.

### Porządki i logi (użytkownik 2026-10-20)
- [x] „Szukaj śmieci” ze szczegółami (dokument · pole: w bazie → po sprzątaniu); naprawa: resztki `gra/prowincje` wracały po „Wyczyść” (zapisz() pomija ten dokument — teraz sprzątanie zapisuje go przez zapiszProwincje + usuwa pola starego formatu); szukanie także w tajne_budynki / tajne_armie
- [x] Logi ze szczegółami: pole `zmiany` [{d, p, z, n}] (do 40 na wpis); log ze szczegółami odrzucony przez stare reguły → zapis ponawia się bez szczegółów; nowe `firestore.rules` (test `materialy/test_reguly_logi.mjs`) — użytkownik musi je opublikować

### Etap 7c — wygląd mapy (po handlu i dyplomacji)
- Wygląd mapy — wywiad 2026-10-19: najpierw PRÓBKA wycinka mapy w 4 wariantach do wyboru: styl (pixel art z kafelków / malowany pergamin-akwarela) × kreski (jak teraz / jaśniejsze-cieńsze). Teren prowincji wybiera GM na karcie prowincji (równina, las, pustynia, bagno, tundra…, domyślnie równina) — startowo ustawiam sensowne regiony sam, GM może zmieniać. Dodatki: ozdobna ramka + róża wiatrów, animowana woda, mgła na krawędziach.
- [x] 7.6a Próbka: wycinek mapy (wybrzeże, rzeka, góry) w 4 wariantach → użytkownik wybiera
- [x] 7.6b Wybrany styl na całą mapę (warstwa pod kreskami) + typ terenu prowincji (karta prowincji, GM) + startowe regiony
- [x] 7.6c Ramka i róża wiatrów, animowana woda, mgła na krawędziach
- [x] 7.6d Herby graczy na mapie (użytkownik 2026-10-19): po oddaleniu mapy wewnątrz terenu każdej frakcji gracza pojawia się jej herb (`assets/herby/<id>.png`), dopasowany wielkością i położeniem do obszaru kraju (np. w środku największego skupiska prowincji), żeby od razu było widać, który kraj należy do którego gracza; przy przybliżeniu herb znika lub blednie, żeby nie zasłaniał prowincji.
- [x] 7.6e Poprawki mapy (użytkownik 2026-10-19; mosty pominięte — uzgodnione z GM):
  - [x] 7.6e-1 Połączone prowincje: wykrywacz (prowincje, które oddały sąsiadom duże kawałki + komórki z kilkoma napisami) → złe były 2: 63b (mapa_dane zostawił kawałek pod górami z napisem 57, a „WEGA 63” oddał 64b) i 50b (płat z napisem 53). Poprawki wielokątami w `materialy/mapa/poprawki.json` (+ przypięte litery a/b) przez `assets/mapa_poprawki.py`, potem sasiedztwo → dane → osady → teren. Id prowincji bez zmian.
  - [x] 7.6e-2 Góry i rzeki (lista użytkownika 2026-10-19): warstwa rzek urywała się za ostatnim mostem przed morzem, a koryto bez prowincji rysowało się jako góry. `mapa_teren.py`: dociąganie koryta po rysunku (wąski pas między brzegami przy rzece: ujścia za mostem bez maski gór, kawałki stykające się z brzegiem), domknięcie przerw do ~20 px, góry bez skrawków < 150 px i bez szczytów bliżej niż 12 px od rzeki; ręczne odcinki w `poprawki.json` („rzeki”: 143a/167a)

### Etap 7d — podgląd na telefon (użytkownik 2026-10-19: OSTATNI przed samouczkami)
- [x] 7.7 Podgląd na telefon przez GitHub Pages — wywiad 2026-10-20: wszystko tylko do czytania (mapa, frakcje, bohaterowie z animacjami, armie, bitwy, traktaty, bloki, kronika — każdy widzi to, co w programie, wg swoich uprawnień), logowanie jak w programie; ten sam program dopasowany do wąskiego ekranu (dolne menu, karty na całą szerokość, mapa palcem / dwoma palcami); publikacja automatem GitHub Actions po pushu na main.
  - Technika (Claude): flaga budowania `VITE_PODGLAD=1` (tylko wersja na Pages) — UI jak bez uprawnień do edycji (bez Panelu GM, formularzy i propozycji), a magazyn nie wysyła żadnych zapisów; dane czytane z prawdziwą rolą (GM widzi wszystko). Konfiguracja Firebase jest w repo (`src/firebase-config.js`), więc workflow tylko buduje.
  - [x] 7.7a Tryb podglądu: flaga, blokada zapisów w magazynie, ukrycie edycji i propozycji
  - [x] 7.7b Układ na telefon: menu, karty, okna, mapa dotykiem (przesuwanie, przybliżanie dwoma palcami)
  - [x] 7.7c Workflow `.github/workflows/podglad-telefon.yml` + `INSTRUKCJA-TELEFON.md` (włączenie Pages, domena w Firebase Auth) + test czystej kopii w podfolderze /Fantasy_RP/ na emulacji iPhone — czeka na pierwszy push użytkownika

### Etap 8 — samouczki (na sam koniec, gdy wszystkie funkcje gotowe)
- [x] 8.0 NAJPIERW poproś użytkownika o jego grafikę Zgrzyta (ma gotową) — na jej podstawie karta postaci i awatar; nie generuj Zgrzyta od zera → `assets/postacie/zgrzyt.md`, `assets/portrety/zgrzyt.png` (+_1024), AD 8/10, zaakceptowany przez użytkownika
- Samouczek — wywiad 2026-10-20 (użytkownik):
  - Wygląd: portret Zgrzyta + prostokątne okno dialogu; Zgrzyt mówi, co gdzie jest, a omawiany element podświetla się migającą obwódką. Jeden element na raz; kliknięcie myszą = dalej. Użytkownik nic nie klika — Zgrzyt sam otwiera karty, okna i menu w trakcie dialogu.
  - Demonstracja: Zgrzyt tworzy lokalnie armie i floty, prowadzi do bitew — NIC nie trafia do bazy ani do innych graczy; po rozdziale z demonstracją wszystko znika (stan sprzed rozdziału wraca).
  - Charakter: głupi, mówi o sobie w trzeciej osobie, często kończy „tak tak”, przekręca imiona i nazwy prześmiewczo („ludziaki”, Niky Rockstar → „Noodle Cockstar”).
  - Start: sam przy pierwszym wejściu do gry (propozycja, można odmówić) + przycisk „Samouczek” w pasku. Rozdziały do wyboru (można wszystkie po kolei); rozdziały GM widzi tylko GM. Teksty pisze Claude w osobnym pliku danych, użytkownik poprawia (najpierw próbka 1 rozdziału). Tylko program na komputer (nie w podglądzie na telefon).
  - Technika (Claude): `src/samouczek.js` (silnik) + `src/dane/samouczek.js` (rozdziały: kroki {tekst, cel: selektor, akcja}); piaskownica = blokada zapisów w magazynie + kopia stanu przed rozdziałem i powrót do niej + wstrzymanie zmian z bazy na czas rozdziału (dociągane po wyjściu); Esc / „Zakończ” przerywa i sprząta; przy ograniczeniu ruchu obwódka bez migania.
- [x] 8.1a Silnik samouczka: okno dialogu z portretem, podświetlenie, przejście kliknięciem, akcje, piaskownica, start (pierwsze wejście + przycisk), menu rozdziałów + rozdział próbny „Witaj i mapa” (teksty do oceny stylu)
- Użytkownik 2026-10-20: samouczek ma być SZCZEGÓŁOWY, nie ogólnikowy — Zgrzyt przechodzi po zasobach, jednostkach, bohaterach, praktycznie wszystkim (każda sekcja karty, okna, przyciski); rozdziały o GM-owaniu i Panelu GM tylko dla GM.
- [x] 8.1b Rozdziały gracza (szczegółowo): mapa (rozbudowa rozdziału 1: osady, teren, budynki, akweny), frakcja (opis, zasoby, budynki i złoża, jednostki, widoczność, notatki), bohaterowie (okno, statusy, animacje), armie i floty (pokaz w piaskownicy: skład, cel, trasa, ruch), bitwy (pokaz: ekran bitwy, raport), dyplomacja (traktaty, szlaki, bloki z głosowaniem, wojny, kronika), propozycje do GM
- [x] 8.2 Rozdziały GM: Panel GM i tury, prowincje i budynki, armie i zatwierdzanie ruchów, propozycje graczy, użytkownicy i porządki
- [x] 8.3 Testy: piaskownica nie zapisuje nic do bazy (licznik zapisów 0, emulator), stan po rozdziale = stan przed; użytkownik 2026-10-20: sprawdzić na DWÓCH oknach naraz (emulator Firestore + Auth), że pokaz z jednego okna nie pojawia się w drugim (brak synchronizacji w trakcie samouczka)
- [x] 8.4 Dźwięki (użytkownik 2026-10-20, PO samouczku): generowane w kodzie (Web Audio, chiptune, bez plików) — klik w opcje (zatwierdź / anuluj inne), szelest szuflad i okien, głos Zgrzyta: chrapliwe bipy przy literach + hieni rechot przy „tak tak” (2–3 warianty do odsłuchu na stronie próbek); przycisk 🔊 w pasku z osobnymi przełącznikami interfejs / Zgrzyt, zapamiętane, domyślnie cicho; ograniczenie nakładania się dźwięków

### Etap 9 — historia, wykresy i timelapse (użytkownik 2026-10-20, przed wydaniem 0.5.0)
- Wywiad 2026-10-20: gracz widzi wykres zasobów TYLKO własnej krainy (GM — każdej). Porównanie krajów jest tylko w timelapsie dla GM, z eksportem do GIF albo MP4 (do wrzucenia na Discorda). Timelapse = odtwarzacz w programie (mapa tura po turze + wykresy, Odtwórz/Pauza, suwak tur) + „Zapisz film”. Historia mapy od teraz (gra jeszcze się nie zaczęła). Statystyki: zasoby, ziemia (prowincje, miasta, wioski, budynki), wojsko (armie, floty, żołnierze, okręty), wojny i bitwy (wojny, bitwy stoczone / wygrane / przegrane), dyplomacja (traktaty, sojusznicy, bloki).
- Bez chaosu (Claude): w timelapsie jeden wykres naraz z wyborem miary; linia na kraj w jego kolorze, legenda z herbami, znacznik bieżącej tury; obok mały ranking tej tury.
- Technika (Claude): przy zamknięciu tury GM zapisuje `historia/{nr}` (tylko GM czyta i pisze): właściciele prowincji, osady-stolice, armie i floty (pozycja, kraj, liczebność), bitwy, wojny, statystyki krain policzone w tej chwili; cofnięcie tury usuwa wpis. Zasoby na wykresach — z istniejących migawek tur.
- [x] 9.1 Zapis historii przy zamknięciu tury (`historia/{nr}`) + cofnięcie + reguły Firestore (tylko GM) + test reguł
- [x] 9.2 Wykres zasobów na karcie krainy (gracz: swoja, GM: każda) z migawek tur
- [x] 9.3 Timelapse (Panel GM): odtwarzacz — mapa z historii, suwak, Odtwórz/Pauza, tempo; wykres porównawczy z wyborem miary + ranking tury
- [x] 9.4 Eksport timelapsu do MP4 (albo WebM, gdy MP4 niedostępne) i GIF
- [x] 9.5 Samouczek (użytkownik 2026-10-20): Zgrzyt pokazuje wykres zasobów (rozdział „Twoja kraina”) i timelapse z eksportem (rozdział „Panel GM”)

### Etap 10 — ramki i przyciski interfejsu (użytkownik 2026-10-21)
Pixel-artowe ramki/belki górnego paska i szuflady, przyciski, tło paska, ozdobniki z generatora w stylu `assets/STYLE.md`, żeby interfejs pasował do portretów i herbów. Przed startem krótki wywiad (nastrój: kamień / drewno / pergamin, czy w kolorze frakcji, co dostaje ramkę).
- [ ] 10.0 Wywiad + próbka: jedna ramka i jeden przycisk na zrzucie programu do akceptacji
- [ ] 10.1 Ramki (9-slice, `border-image`): górny pasek, szuflada, okna
- [ ] 10.2 Przyciski (zwykły / najechany / wciśnięty / wyłączony) + tło paska
- [ ] 10.3 Ozdobniki (narożniki, separatory) + sprawdzenie na telefonie i w samouczku

### Etap 11 — tekstury mapy (użytkownik 2026-10-21)
Bezszwowe kafelki pixel art (trawa, góry, woda, wybrzeże, ew. las) z generatora, nakładane według masek, które już są (ląd, ocean, jeziora, pasmo gór, rzeki); kreski z rysunku zostają na wierzchu, kolory właścicieli jako półprzezroczysta warstwa. Lasów i pustyń rysunek nie zaznacza — wtedy GM malowałby je pędzlem w edytorze. Przed startem krótki wywiad (jakie tereny, czy pędzel GM).
- [ ] 11.0 Wywiad + próbka: kafelki trawy i wody na wycinku mapy do akceptacji
- [ ] 11.1 Komplet kafelków (trawa, góry, woda, wybrzeże) + nakładanie według masek
- [ ] 11.2 Kolory właścicieli jako półprzezroczysta warstwa nad teksturą, kreski z rysunku na wierzchu; timelapse z teksturą
- [ ] 11.3 (opcjonalnie) Las / pustynia: pędzel GM w edytorze mapy
- [ ] 11.4 Samouczek Zgrzyta: nowy wygląd mapy i tereny w rozdziale „Witaj i mapa” (+ pędzel w rozdziale GM, jeśli będzie 11.3)

### Etap 12 — karta frakcji jako obrazek (użytkownik 2026-10-22)
Przycisk „Zrób grafikę” na karcie frakcji składa gotowy obrazek PNG (herb, portret władcy, nazwa, liczby) do wklejenia na Discorda. Pokazuje tylko to, co oglądający ma prawo widzieć. Przed startem krótki wywiad: co ma być na obrazku, układ i rozmiar, czy kopiować do schowka, czy pobierać plik.
Ustalenia (wywiad 2026-10-22): wizytówka — herb, portret władcy, nazwa, motto, liczba prowincji / osad / armii, miniatury bohaterów, wojny i sojusze; zasoby tylko gdy oglądający ma prawo. Poziomo 16:9 (~1200×675). Przycisk otwiera okno z podglądem + „Kopiuj” (Ctrl+V na Discordzie) i „Zapisz PNG”. Ciemne tło w barwie frakcji, ramka, pixel art powiększany ostro.
- [x] 12.0 Wywiad + próbka jednego obrazka do akceptacji (próbka 2026-10-22 czeka na ocenę użytkownika)
- [x] 12.1 Przycisk na karcie frakcji, kopiowanie do schowka / zapis PNG, dobór danych według uprawnień — `src/grafika_karty.js` (rysowanie), `pokazGrafike` w main.js (dane), okno `#grafika`; test `materialy/test_grafika.mjs`. Na obrazku tylko rzeczy jawne: bez statusów, składu armii i tajnych traktatów; zasoby po zaznaczeniu „Pokaż zasoby” (domyślnie tylko gdy jawne)
- [x] 12.2 Sprawdzenie na telefonie — `materialy/test_grafika_telefon.mjs` (390 px, podgląd VITE_PODGLAD=1): okno w ekranie, obrazek 1200×675, bez poziomego przewijania
- [x] 12.3 Samouczek Zgrzyta: pokazuje „Zrób grafikę” w rozdziale „Twoja kraina” (krok po motcie; `test_samouczek.mjs` sprawdza podświetlenie)

### Etap 13 — Kronikarz Zgrzyt (użytkownik 2026-10-22: „ma być bardzo rozbudowany”)
Po zamknięciu tury Zgrzyt opowiada kronikę po swojemu: chrapliwy, złośliwy, z rechotem „tak tak”. Ma to być rozbudowana opowieść, nie jedno zdanie: wstęp, osobne fragmenty o bitwach, wojnach, traktatach, podbojach, blokach i flotach, docinki do konkretnych frakcji i władców, nawiązania do wcześniejszych tur (np. „znowu przegrali”, „trzecia wojna z rzędu”) i podsumowanie tury. Wyświetla się w oknie dialogowym Zgrzyta (portret, głos, pisanie literka po literce), a jawną wersję można skopiować na Discorda.
Główne pytanie do wywiadu: skąd tekst. Do wyboru (a) generator z dużej biblioteki szablonów i wariantów w kodzie, bez internetu i za darmo, albo (b) model AI przez API: płatny, wymaga klucza, który nie może trafić do graczy.
Ustalenia (wywiad 2026-10-22): SZABLONY w kodzie, bez AI — „naprawdę bardzo dużo, po kilka wariantów dla każdej możliwej opcji” (każdy rodzaj zdarzenia × wynik × frakcja, wstępy, przejścia, zakończenia, serie z poprzednich tur). Długość zależna od tury: spokojna — kilka zdań, burzliwa — kilkanaście akapitów. GM dostaje szkic po zamknięciu tury, może poprawić tekst i klika „Opublikuj” — gracze widzą dopiero opublikowaną. Ton: złośliwy, ale życzliwy (żarty z krain i władców w grze, nie z ludzi). Nowa opowieść otwiera się graczowi sama raz po wejściu; archiwum w Kronice („Opowieści Zgrzyta”). Tajne zdarzenia: opowieść wspólna i jawna, a kraj, którego dotyczy tajne zdarzenie, widzi na końcu dopisek „Zgrzyt szepcze tylko tobie…”; eksport na Discorda zawsze bez szeptów. Zgrzyt prześmiewczo PRZEKRĘCA nazwy krain i władców (użytkownik 2026-10-22) — warianty we wspólnym `src/dane/przekrecenia.js` (też samouczek); pierwsza wzmianka w opowieści prawdziwa, dalej ~60% przekręcone; BEZ FAWORYTÓW (użytkownik 2026-10-22: „ma się nie podlizywać do nikogo, nie chcę specjalnego traktowania”) — każda kraina przekręcana i obśmiewana tak samo, także Grobowe Imperium. Przekręcenia mogą być nieco zbereźne, a Zgrzyt czasem przeklina, gdy to śmieszne (użytkownik 2026-10-22) — wykrzykniki ~25% przy wojnie/bitwie/wyniku + pojedyncze warianty z przekleństwem. Podglądy do oceny → folder `podglady/` w projekcie.
TAJEMNICE (użytkownik 2026-10-22: „nie zdradzać sekretów graczom, którym nie powinien; to samo notatki i info GM”): część jawna opowieści tylko z jawnych wpisów kroniki i jawnej mapy (liczba prowincji); tajne wpisy (traktaty, wpisy GM) wyłącznie w szeptach krajów z „widza”; Zgrzyt NIGDY nie czyta notatek GM, notatek graczy, zasobów, składu armii, statusów, propozycji ani historii poza liczbą prowincji. Test `materialy/test_kronikarz.mjs` (część jawna identyczna z tajnymi danymi i bez nich). W bazie (13.4/13.5): szkic widzi tylko GM; po publikacji część jawna w dokumencie dla wszystkich, każdy szept w osobnym dokumencie z regułą „tylko ten kraj + GM” + test reguł; eksport na Discorda bez szeptów. Ta sama zasada w etapie 16 (dymki Zgrzyta komentują tylko to, co oglądający i tak widzi).
LIMITY FIREBASE (użytkownik 2026-10-22: „nie chcę, żeby to zapchało limit pamięci”): teksty Zgrzyta są w kodzie, nie w bazie (0 B). W bazie tylko: pole `d` we wpisach kroniki (~100 B na wpis) i przy 13.4 jedna opowieść na turę = 1 dokument z gotowym tekstem (~3–6 KB) + po 1 małym dokumencie szeptu na kraj z tajemnicą; 100 tur ≈ 0,5–1 MB z 1 GB planu Spark. Odczyt: 1 dokument przy otwarciu opowieści (archiwum wczytuje turę dopiero po wybraniu, nie wszystkie naraz). Szkic GM-a nadpisuje ten sam dokument (bez kopii wersji). Cofnięcie tury usuwa jej opowieść i szepty. „Szukaj śmieci” (4.5) ma też sprawdzać osierocone opowieści/szepty.
- [x] 13.0 Wywiad: źródło tekstu (szablony czy AI), długość opowieści, kto ją widzi (tajne wpisy tylko w wersji dla zainteresowanych), czy GM poprawia tekst przed publikacją, ton i granice żartów z graczy
- [x] 13.1 Próbka: opowieść Zgrzyta dla jednej prawdziwej tury z historii do akceptacji stylu — zaakceptowana 2026-10-22 (wymyślona tura z prawdziwymi krainami, `materialy/probka_kronikarza.mjs`)
- [x] 13.2 Silnik opowieści: zdarzenia z kroniki → fragmenty, kolejność i spójne przejścia; pamięć poprzednich tur (serie, powroty, zemsty) — `src/kronikarz.js`; wpisy kroniki mają pole `d` (wojna, pokój, bitwa, wynik + „po bitwie”: polegli/ranni/jeńcy, zdobycz, traktat, zerwanie, właściciel, wpis GM; wpisy gracza o blokach bez `d` — reguły); stare wpisy bez `d` → „Zgrzyt znalazł w kronice…”; `opowiescTury(nr)` w main.js; testy: test_kronikarz, test_kronika, test_skutki (+ regresja bitew, traktatów, bloków OK)
- [x] 13.3 Biblioteka tekstów: wiele wariantów na każdy rodzaj zdarzenia + docinki pod każdą frakcję i władcę (z kart postaci) — 481 wariantów; nowe sytuacje: pierwsza wojna, wielka bitwa, wynik morski, rewanż, seria zwycięstw, pokój po długiej wojnie, zdrada sojuszu, traktat byłych wrogów, docinki 7 krain × 7 sytuacji + ogólne dla NPC; test bez dziur w tekście (600 opowieści)
- [x] 13.4 Okno opowieści (portret, głos, pisanie literka po literce, przewijanie), zapis przy turze, archiwum — `src/opowiesc.js`; przy zamknięciu tury szkic `opowiesci/{nr}` (tylko GM), po publikacji jawna część + `szepty/{nr}_{frakcja}`; numery opublikowanych w `gra/stan.opowiesci`; gracz dostaje nową opowieść sam, raz (localStorage `frp-opowiesc`); archiwum „📖 Opowieści Zgrzyta” w Kronice; cofnięcie tury usuwa opowieść i szepty
- [x] 13.5 Wersje według uprawnień (jawna dla wszystkich, pełna dla GM, tajne wątki tylko dla zainteresowanych) + „Kopiuj na Discorda” (tekst) — reguły `opowiesci`/`szepty` w firestore.rules (test `materialy/test_reguly_opowiesci.mjs`, 18 sprawdzeń); test graczy na emulatorze `materialy/test_opowiesci_gracze.mjs` (szkic niewidoczny, szept tylko Goblandii, raz, archiwum)
Ustalenia 13.5b (wywiad 2026-10-23): wideo MP4 z dźwiękiem (głos Zgrzyta + rechot), mapa w kolorach krain jedzie do miejsc zdarzeń; przycisk „🎬 Nagraj film” w oknie opowieści u KAŻDEGO, zawsze wersja jawna (bez szeptów); cała opowieść, tempo i jakość dobierane do 10 MB. GIF i obrazek-komiks — nie teraz (Pomysły na później).
- [x] 13.5b Całość na Discorda jako nagranie — MP4 1280×720 z dźwiękiem (`src/film_opowiesci.js`): mapa w kolorach krain (obecni, jawni właściciele; `tl.mapa` z timelapsu) jedzie do miejsca zdarzenia akapitu (pole `miejsca` [{x,y}|null] przy opowieści, liczone z `d.p`/`d.a` wpisów kroniki albo stolicy strony), okno dialogu z portretem i tekstem pisanym na żywo, głos Zgrzyta wzmocniony w nagraniu (gra zawsze, też gdy wyłączony w 🔊); tempo/jakość do 10 MB (≤ 1,5 Mb/s). Przycisk „🎬 Nagraj film” w oknie opowieści u każdego, bez szeptu. Test `materialy/test_film_opowiesci.mjs` (35 s → 6,6 MB, H.264 + AAC). GIF / obrazek-komiks → Pomysły na później
- [x] 13.6 Podgląd i poprawki GM przed publikacją — Panel GM „Kronika Zgrzyta” (podgląd z szeptami, poprawki, „Losuj inaczej”, „Opublikuj”; poprawka opublikowanej publikuje od razu; test `materialy/test_opowiesci.mjs`); telefon nie jest wymagany (użytkownik 2026-10-23), ale `materialy/test_opowiesci_telefon.mjs` i tak przechodzi
- [x] 13.7 Samouczek Zgrzyta: rozdział „Kronika Zgrzyta” — opowieść na niby (POKAZY.pokazOpowiesc, bez piaskownicy, nic nie zapisuje), szept, kopiowanie, archiwum w Kronice; GM — sekcja w Panelu GM; test_samouczek sprawdza okno z szeptem (102 podświetlenia)

### Etap 14 — dziennik władcy (użytkownik 2026-10-22)
Prywatny pamiętnik gracza z wpisami przypisanymi do tur. Widzi go tylko autor (GM też, jeśli ustalimy to w wywiadzie). Gracz może go odsłonić innym jako „pamiętniki wydane po wojnie”: cały albo wybrane wpisy.
- [ ] 14.0 Wywiad: kto widzi (czy GM), odsłanianie całości czy pojedynczych wpisów, gdzie przycisk (karta frakcji / pasek)
- [ ] 14.1 Dane `dziennik/{f}` + reguły Firestore (tylko autor, ew. GM) + test reguł; wpisy z numerem tury
- [ ] 14.2 Okno dziennika (lista tur, edycja wpisu), „Odsłoń” → widoczne dla wszystkich na karcie frakcji
- [ ] 14.3 Telefon (tylko czytanie, jak reszta)
- [ ] 14.4 Samouczek Zgrzyta: pisanie wpisu i „Odsłoń” (w piaskownicy, bez zapisu)

### Etap 15 — porównanie dwóch frakcji (użytkownik 2026-10-22)
Dwie frakcje obok siebie w jednym oknie: prowincje, osady, budynki i złoża, armie, bohaterowie, traktaty, a zasoby i wykres tylko wtedy, gdy oglądający ma do nich prawo (gracz: tajne dane tylko swojej frakcji, GM: wszystko).
- [ ] 15.0 Wywiad: co porównywać, skąd otwierać (karta frakcji „Porównaj z…”)
- [ ] 15.1 Okno porównania z danymi według uprawnień + słupki „kto ma więcej”
- [ ] 15.2 Telefon (pod sobą zamiast obok)
- [ ] 15.3 Samouczek Zgrzyta: „Porównaj z…” i co widać, a czego nie (uprawnienia)

### Etap 16 — Zgrzyt jako pomocnik na co dzień (użytkownik 2026-10-22, MOŻNA WYŁĄCZYĆ)
Od czasu do czasu Zgrzyt wyskakuje w rogu z krótkim złośliwym komentarzem zależnym od tego, co robi gracz (np. „znowu klikasz w mapę orków, tak tak?”, nowa bitwa, długie siedzenie bez ruchu). Przełącznik włącz/wyłącz (+ częstotliwość) zapamiętany; domyślnie ustalić w wywiadzie. Nie przeszkadza: nie zasłania kart, znika sam, nie w trakcie samouczka.
- [ ] 16.0 Wywiad: domyślnie włączony czy nie, jak często, czy z głosem, przy czym ma komentować
- [ ] 16.1 Dymek w rogu (portret, głos z 8.4, znikanie) + przełącznik i częstotliwość w ustawieniach
- [ ] 16.2 Wyzwalacze (zdarzenia w programie) + biblioteka komentarzy z wariantami, bez powtórek pod rząd
- [ ] 16.3 Test na telefonie i w samouczku (wyłączony w trakcie)
- [ ] 16.4 Samouczek Zgrzyta: Zgrzyt przedstawia swoje dymki i pokazuje, gdzie go wyłączyć / ustawić częstotliwość

### Etap 17 — muzyka frakcji chiptune (użytkownik 2026-10-22, MOŻNA WYŁĄCZYĆ)
Każda frakcja ma własny motyw generowany w kodzie (Web Audio, jak dźwięki z 8.4, bez plików); gra po otwarciu jej karty, płynnie przechodzi przy zmianie. Do tego motyw menu / mapy. W menu 🔊 osobny przełącznik „muzyka” + głośność, zapamiętany. DOMYŚLNIE WŁĄCZONA (użytkownik 2026-10-22), inaczej niż reszta dźwięków; przełącznik wyłącza ją na stałe. Przeglądarka nie pozwala grać przed pierwszym kliknięciem, więc muzyka rusza po pierwszym kliknięciu w programie.
- [ ] 17.0 Wywiad + strona próbek: motywy 2–3 frakcji w 2 wariantach do odsłuchu
- [ ] 17.1 Odtwarzacz motywów (pętla, przejścia, głośność) + przełącznik w menu 🔊
- [ ] 17.2 Motywy wszystkich 7 frakcji + motyw mapy
- [ ] 17.3 Wyciszanie przy głosie Zgrzyta i w samouczku, test na telefonie
- [ ] 17.4 Samouczek Zgrzyta: menu 🔊 — przełącznik „muzyka” i głośność

### Etap 18 — księga kampanii (użytkownik 2026-10-22)
Na koniec kampanii (albo w dowolnym momencie, przycisk w Panelu GM) program składa całą historię gry: tury, kronika, opowieści Zgrzyta, bitwy, mapy z timelapsu, bohaterowie, odsłonięte dzienniki władców. Tylko jawne treści (chyba że GM zdecyduje inaczej przy końcu gry).
- [ ] 18.0 Wywiad: forma (PDF, strona do przeglądania, oba), co zawiera, czy ujawnić tajemnice na koniec
- [ ] 18.1 Próbka jednego rozdziału (jedna tura) do akceptacji wyglądu
- [ ] 18.2 Składanie całej księgi z historii tur + eksport
- [ ] 18.3 Samouczek Zgrzyta: księga kampanii w rozdziale „Panel GM” (+ gdzie gracze ją znajdą)

## Decyzje
- Telefon (użytkownik 2026-10-23: „na telefonie nie musi to działać”): nowe funkcje nie wymagają sprawdzania na telefonie — kroki „telefon” w etapach 14–18 są opcjonalne.
- 2026-10-19: wygląd mapy = wariant F (`assets/mapa_tekstury.py`): tekstury pixel art Z GENERATORA (trawa, woda ×2, piasek; 512 px → 128 BOX + paleta 24, zszyte odbiciem, 8 wersji obrót/odbicie/przesunięcie w nieregularnych plamach), texel 2 px mapy, LEKKIE brązowe kreski wybrzeży/granic; rzeki i góry rysuje program (kreski rzek i gór z rysunku usunięte): rzeka = ciągłe koryto (domknięcie dyskiem R=12 skleja przerwy po mostach z rysunku) z ciemnym brzegiem; góry = gęste sprite'y pixel art ze śnieżną czapą (`gora_m*.png`, 3 warianty, 48/36 px) na ciemniejszym podgórzu.
- 2026-10-19: nowe opisy frakcji od graczy dopisuję do `src/dane/frakcje.js` jako sekcje z polem `dopisek: "<data>"` — GM przy logowaniu wgrywa je do chmury sam (raz; usunięta przez GM nie wraca).
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
- Opowieść Zgrzyta jako GIF albo długi obrazek-komiks (13.5b zrobione tylko jako MP4).
- Film opowieści z mapą z tamtej tury (dziś: obecni właściciele) — wymaga odczytu historii, do której gracze nie mają dostępu.
- Koszt jednostek w zasobach i punkty limitu, gdy GM ustali mechanikę armii.
- Wykresy zasobów w czasie.
- Dyplomacja: traktaty, sojusze, wiadomości między państwami (było w WorldWatch).
- Powiadomienia o nowej turze; link/eksport na Discorda.
- Muzyka frakcji (gracze linkują motywy z Heroes/Disciples).
