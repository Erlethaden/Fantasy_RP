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
- **Mapa (później):** autorski rysunek, nie prawdziwa mapa. Wgrywam obraz i obrysowuję prowincje (narzędzie do rysowania wielokątów, numery). Prowincja: 1 miasto + 2 wioski, sloty budynków (2 w mieście, 1 na wioskę), co produkuje, właściciel, wasal/marionetka. Prowincje bez gracza = ziemia niczyja (NPC prowadzi GM na Discordzie), z opcjonalnym opisem prowincji.
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

### Etap 3 — zasoby i jednostki
- [x] 3.1 GM: edytor typów zasobów (globalne + unikalne frakcji) — „Panel GM” w górnym pasku, `src/dane/zasoby.js`, `stan.zasoby` (dopisywane do starego zapisu DEMO bez kasowania)
- [x] 3.2 Tabela zasobów frakcji, edycja przez GM (pole liczby przy każdym zasobie; bez importu z Excela) — sekcja „Zasoby” na karcie: globalne w `f.stany[id]`, unikalne w `ilosc`; unikalne mają też jednostkę
- [x] 3.3 Tury: zamknięcie tury = migawka, widok zmian +/- — Panel GM „Zamknij turę N” + „Cofnij zamknięcie” (ostatniej; obecnych liczb nie zmienia), `stan.tury`
- [x] 3.4 Jednostki per frakcja: lista na karcie frakcji (nazwa, opis, poziom elitarności: Chołota / Regularne / Elita); koszt, punkty i statystyki dopiero gdy GM ustali mechanikę — sekcja „Jednostki” na karcie (dodaj / ✎ edytuj / usuń), `f.jednostki`

### Etap 4 — Firebase i konta (= pierwsza wersja dla całej grupy)
- [x] 4.1 Instrukcja założenia projektu Firebase dla użytkownika + podłączenie: `magazyn.js` przechodzi na Firestore z synchronizacją na żywo (onSnapshot) — frakcje, zasoby, bohaterowie, a później mapa i armie widoczne od razu u wszystkich; osobne dokumenty zamiast jednego wielkiego zapisu
- [ ] 4.2 Logowanie (e-mail/Google), role, panel admina do przypisywania ról i państw; edycję typów zasobów, stanów, tur, unikalnych zasobów i jednostek widzą/robią tylko GM i admin (w DEMO każdy)
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
- [x] 5.2 Sprawdzanie wersji z GitHub Releases przy starcie + guzik „Aktualizuj” — electron-updater, `electron/preload.cjs`, obowiązkowa (blokuje logowanie)
- [x] 5.3 Instrukcja wydawania nowej wersji (dla użytkownika, bo GitHub robi sam) — `INSTRUKCJA-WYDANIE.md`

### Etap 6 — mapa (gdy będzie rysunek)
- [ ] 6.0 Przebudowa układu: mapa na cały ekran, górny pasek z herbami frakcji + Panel GM + konto; karta frakcji, okno bohatera i Panel GM jako wysuwana z boku szuflada nad mapą (klik w herb albo prowincję)
- [ ] 6.1 Wgranie rysunku, przesuwanie/przybliżanie (PixiJS)
- [ ] 6.2 Edytor prowincji: obrys, numer, miasto + 2 wioski
- [ ] 6.3 Właściciele, kolory, wasale/marionetki, ziemia niczyja, opis prowincji
- [ ] 6.4 Produkcja i sloty budynków prowincji

### Etap 7 — dalej
- [ ] 7.1 Armie i floty na mapie z przypisanym bohaterem (moga byc bez)
- [ ] 7.2 Kronika zdarzeń tury
- [ ] 7.3 Krótkie animacje portretów (oddech, mrugnięcie, błysk)

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

## Otwarte pytania
- Brakujące dane od graczy: stolica Goblandii, godła Aurelii/Goblandii/Czarnego Smoka, motto kilku frakcji, opisy Baby Jagi i Czarownika z krainy IRS. „Unikalne zasoby” to na razie propozycje z opisów — GM ma je potwierdzić.
- Ilu graczy i kto GM (prawdopodobnie Kermitta) — ustalić przy etapie 4.

## Pomysły na później
- Koszt jednostek w zasobach i punkty limitu, gdy GM ustali mechanikę armii.
- Wykresy zasobów w czasie.
- Dyplomacja: traktaty, sojusze, wiadomości między państwami (było w WorldWatch).
- Powiadomienia o nowej turze; link/eksport na Discorda.
- Muzyka frakcji (gracze linkują motywy z Heroes/Disciples).
