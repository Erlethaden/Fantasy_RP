# DZIENNIK

## 2026-10-17 20:56 — Merrla jako pełny portret, 2.4 portrety trzech frakcji
Zrobione: decyzja użytkownika: Merrla = pełny portret (zapisane w PLAN). Merrla v13 (Klein, seed 1006): duch jak dżin, od pasa ogon z fioletowej mgły, 3 kamienie; art-director 7/10 AKCEPTUJ; marginesy przycięte przed 128 px; `assets/portrety/merrla.png` + `_1024`, karta, ASSETS, podgląd, STYLE i LEKCJE zaktualizowane.
2.4: decyzje użytkownika (Widma trójka, Kain+Anna razem, Lucjan z opisu, Jaga zbliżenie) w PLAN; karty `goblandia.md`, `rogus-ardens.md`, `czarny-smok.md`; refy w `refy/` (twarze graczy, władcy ze scen, style bez twarzy).
2.4: 12 portretów w `assets/portrety/` (gobloni, what, elmon, vaelgor, lucjan, shire, kain, linnr, aretnuag, widma, baba, czarownik), art-director 7–8/10 wszystkie AKCEPTUJ; Kain v2 (bez czarnych pasów), Widma v2 (gitara z kości, bęben dalej zwykły), Baba Jaga v4. Sekcja na górze `assets/podglad.html`.
UWAGA UŻYTKOWNIKA: część portretów straciła pixel art (zapisane w pamięci, STYLE, LEKCJE). Klein-edytor 3× bez efektu; DZIAŁA: spikselizowana referencja 96 px → Klein „clean up into chunky pixel art” + pełny opis cech → 96 BOX → 128 NEAREST. Przerobione i podmienione: merrla, what, lucjan, kain, aretnuag, widma, baba, czarownik. AD: Merrla 7/10 OK, reszta 4–6/10 „do poprawy” (szum z teł chmur/dymu/mgły; Kain wciąż malarski) — limit 4 ocen.
Użytkownik: portrety OK (13 zaakceptowanych). Usunięte pole `gracz` z frakcji i z karty (admin przypisze graczy po logowaniu, jak w WorldWatch), `WERSJA` 3 — stary zapis DEMO w przeglądarce się zresetuje.
2.5a: 7 herbów (tarcze 64 px, Z-Image + nowe `narzedzia.py sprite`), w nagłówku karty frakcji (`main.js`, `.herb-obraz`); Aurelia: czarne kropki z palety 24 → paleta 48 dla wszystkich. Build OK.
Użytkownik: herby OK poza smokiem (ma być czarny, mroczny) i Gor-Kharem (źle wygląda). Smok v3 czarny z zieloną poświatą wstawiony; Gor-Khar: 2 warianty do wyboru na podglądzie (A czaszka orka z kłami, B kieł-trofeum na rzemieniu), w `_drafts/`.
Użytkownik: smok OK, Gor-Khar wariant A (czaszka orka) — wszystkie 7 herbów zaakceptowane.
2.5b: 8 ikon zasobów 32 px w `assets/ikony/` (`sprite` dostał czyszczenie różowego cienia na małym obrazku); AD: 5 OK, metal/złoto/populacja POPRAW — GPU zajęte (8,8/9 GB), jedna ponowna próba w tle.
2.5c: ramki pixel art rysowane skryptem `assets/ramki.py` (portret 24/8, panel 36/12), podpięte w CSS (.portret, .karta, .okno); zrzut z headless Chrome OK, build OK.
Użytkownik: ikony OK (wszystkie 8, bez poprawek). Ramki: poprosił o cieńsze, zrobiłem, po obejrzeniu w aplikacji cofnął — przywrócone grube, zaakceptowane. Etap 2 zakończony.
3.1: Panel GM (przycisk w górnym pasku): globalne typy zasobów z ikonami — dodaj, zmień nazwę/jednostkę, ↑↓, usuń; stałe `id`; nowy bez ikony = litera w ramce. Test w headless Chrome: dodanie, kolejność, zmiana nazwy (id bez zmian), pusta nazwa odrzucona, zapis po przeładowaniu — OK. Build OK.
Użytkownik: bez wklejania z Excela, tylko kopiuj-wklej w pole zasobu (PLAN poprawiony).
3.2: sekcja „Zasoby” na karcie frakcji — ikona, nazwa, pole liczby (przyjmuje „1 234”, ujemne; błędny tekst odrzucony i podświetlony; puste = brak), jednostka; globalne `f.stany[id]`, unikalne `z.ilosc`; unikalne dostały pole jednostki; usunięcie typu w Panelu GM czyści stany. Test w headless Chrome OK, build OK.
3.3: Panel GM → „Tury”: „Zamknij turę N” (migawka stanów wszystkich frakcji, potwierdzenie) i „Cofnij zamknięcie tury N” (prośba użytkownika; usuwa ostatnią migawkę, liczby zostają); lista zamkniętych tur z datą. Karta frakcji: „tura N” w nagłówku zasobów i zmiana +/- przy każdym zasobie, przeliczana na żywo. Test (zamknij → +30/−6 → przeładowanie → cofnij) OK, build OK.
3.4: użytkownik — na razie tylko lista jednostek z podziałem na elitarność (bez kosztów/punktów/statystyk). Sekcja „Jednostki” na karcie frakcji: grupy Chołota / Regularne / Elita, dodaj, ✎ edytuj (z Anuluj), usuń; `f.jednostki`. Test w headless Chrome OK, build OK. Etap 3 zakończony.
Użytkownik: jednostek NIE wypełniać z materiałów (dodaje GM); edycja jednostek już jest, ograniczenie do GM — w 4.2 (dopisane do PLAN).
4.1: `INSTRUKCJA-FIREBASE.md` — użytkownik zakłada projekt (Auth: e-mail + Google, Firestore eur3, aplikacja Web) i wkleja `firebaseConfig`.
4.1: użytkownik założył Firebase (projekt `fantasy-rp-2f462`). `npm i firebase` (13.0.0); `src/firebase-config.js`; `magazyn.js` przepisany: `stan` wspólny obiekt, Firestore (frakcje/{id}, bohaterowie/{id} z `_nr` = kolejność, gra/stan {zasoby, tury}), onSnapshot na żywo, zapis tylko zmienionych dokumentów (porównanie JSON z posortowanymi kluczami), pierwsze logowanie wgrywa zapis DEMO z przeglądarki albo dane startowe; bez apiKey dalej DEMO. Logowanie w Sali Tronów: e-mail/hasło, „Załóż konto”, Google; polskie komunikaty błędów; zapamiętana sesja zostaje w Sali Tronów; „Wyloguj” i e-mail w górnym pasku; zmiany od innych odświeżają widok (nie w trakcie pisania). `firestore.rules` — tymczasowo tylko admin (e-mail Google, zweryfikowany). Test: zły login → komunikat, brak błędów JS; build OK.
Użytkownik: pamiętać o diagnostyce, czyszczeniu śmieci z Firebase i logach z autokasowaniem — dopisane do PLAN jako 4.5.
Użytkownik: Google → auth/unauthorized-domain (program Electron ładował `file://`). `electron/main.cjs`: wbudowany serwer http://localhost:47821 (tylko pliki z dist/, ochrona przed ../), user-agent bez „Electron” (Google blokuje osadzone przeglądarki). Test curl: strona, JS, blokada wyjścia z dist — OK.
Użytkownik: logowanie działa, 4.1 zakończone.
4.2 (w toku): profile `uzytkownicy/{uid}` (email, nazwa, rola, frakcja), role admin/gm/gracz/obserwator/oczekujacy; konto admina tworzy profil admina (reguły po e-mailu), reszta oczekujący; oczekujący zostaje w Sali Tronów z komunikatem, nadanie roli działa na żywo; gracz wchodzi na swoje państwo; edycja (stany, unikalne zasoby, jednostki, status bohatera, Panel GM) tylko dla GM/admin, reszta widzi tekst; Panel GM → „Użytkownicy” (admin: wszystkie role; GM: oczekujący/gracz/obserwator, bez ruszania GM/admin; bez zmiany własnej roli); `firestore.rules` z rolami — zapis danych gry tylko GM/admin (pytanie użytkownika). Test strony logowania OK, build OK.
Użytkownik: admin też gra → admin wybiera sobie państwo we własnym wierszu „Użytkownicy” (rola bez zmian), państwo możliwe dla gracza/GM/admina, „Twoje państwo” na liście frakcji; reguły: admin może zmienić we własnym profilu tylko `frakcja`. Ostrzeżenie Vite o rozmiarze paczki (Firebase) wyciszone `chunkSizeWarningLimit`.
Użytkownik: 4.2 działa.
4.3: decyzje (GM decyduje, co tajne: przełączniki per frakcja dla zasobów/jednostek/statusów, domyślnie tajne; notatki gracza i GM). `magazyn.js`: tajne części w osobnych dokumentach (tajne_zasoby/jednostki/statusy, notatki_gracza/gm), migawki tur per frakcja, subskrypcje tylko tego, co wolno czytać (lista odmów bez ponawiania), zapis tylko wczytanych dokumentów, gracz zapisuje tylko swoje notatki, migracja starego formatu przy pierwszym logowaniu GM/admina. UI: „🔒 Tajne” zamiast danych, znaczniki tajne/jawne, przełączniki „Widoczność dla innych graczy” (GM, tylko chmura), notatki. `firestore.rules`: kolekcje tajne + notatki. Kopia sprzed zmian: `_kopie/2026-10-17_4.3-tajne/` (usunąć po teście użytkownika). Test DEMO OK, build OK.
Użytkownik pytał o diagnostykę — jest w 4.5; zaproponowano zrobienie jej zaraz po 4.3.
Użytkownik: „lecimy dalej” — 4.3 OK, kopia `_kopie/` usunięta. Kolejność: 4.5 przed 4.4.
4.5a: `logi/{auto}` — jeden wpis na zapis (czas, uid, email, typ zmiana/blad, co=ścieżki) w tym samym batchu; błędy zapisu też jako wpis + `licznik.bledy`; `sprzatnijLogi(dni)` przy logowaniu GM/admina (po 400); `stan.ustawienia.dniLogow` (domyślnie 30) w gra/stan; Panel GM → „Logi zmian”: ustawienie dni, „Pokaż ostatnie 50” na żądanie (oszczędność odczytów), opisy po polsku; reguły dla logi. Build OK.
4.5b: Panel GM → „Diagnostyka”: połączenie, zapisy i odczyty sesji vs limity Spark, rozmiar wczytanych danych, „Policz dokumenty w bazie” (getCountFromServer, 10 odczytów), tabela per kolekcja, ostatnie błędy sesji. Build OK.
Użytkownik: logi tylko dla admina → logi, diagnostyka, porządki, kopie: tylko admin (UI + reguły: logi read/delete admin), sprzątanie logów przy logowaniu admina.
4.5c: Panel GM → „Porządki”: „Szukaj śmieci” (bez zmian w bazie) → lista (stany usuniętych typów, bohaterowie bez frakcji, tajne/notatki nieistniejących frakcji, logi po terminie, konta z nieistniejącym państwem, dokumenty ze starym formatem) → „Wyczyść” po potwierdzeniu.
4.5d: „Kopia zapasowa”: pobierz .json (cała gra bez kont), wczytaj z walidacją i potwierdzeniem (`zapiszWszystko`); działa też w DEMO. Test DEMO: pobranie, zmiana, przywrócenie, odrzucenie złego pliku — OK. Build OK.
Użytkownik: 4.5 działa.
4.4: decyzje (gracz proponuje: opis państwa, informacje podstawowe, istniejący bohaterowie; GM: lista w Panelu GM + licznik; gracz widzi status i komentarz). Formularz edycji w oknie (pola + sekcje opisu: dodaj/usuń) — GM zapisuje od razu (dotąd GM nie miał edycji opisów), gracz swojego państwa wysyła `propozycje/{auto}` (zmiany + przed). Panel GM → „Propozycje graczy”: przed → po (sekcje opisu porównane po tytule), ostrzeżenie o konflikcie, komentarz, Akceptuj/Odrzuć; licznik na „Panel GM (N)”. Gracz: „Twoje propozycje” na karcie (status, komentarz GM, Wycofaj). Rozpatrzone kasowane po 7 dniach (użytkownik) przy logowaniu admina. Odświeżanie w tle nie zamyka formularza. Reguły: propozycje (tylko swoje państwo/bohaterowie, dozwolone pola). Test DEMO (edycja, sekcje, anuluj, bohater) OK, build OK.
Użytkownik: 4.4 działa → etap 5. Decyzje: repo `Erlethaden/Fantasy_RP` publiczne, NSIS z wyborem folderu, aktualizacja obowiązkowa (blokuje logowanie).
5.1–5.3: electron-builder (dev) + electron-updater; firebase przeniesiony do devDependencies (jest w bundlu); `package.json` → `build` (NSIS, pl, publish GitHub, artifact `Fantasy-RP-Setup-${version}.exe`), skrypt `instalator`; ikona programu (pixel art: korona na tarczy, miecze) `build/icon.png` + `assets/ikona_programu*.png`; `electron/main.cjs`: autoUpdater (bez autopobierania), jedna kopia programu, ikona okna; `electron/preload.cjs` → `window.aktualizacje`; Sala Tronów: komunikat „Dostępna nowa wersja X — Aktualizuj”, postęp, blokada logowania (sprawdzanie > 10 s albo błąd sieci nie blokuje). `.gitignore`, `zbuduj-instalator.bat`, `INSTRUKCJA-WYDANIE.md`. Zbudowany `release/Fantasy-RP-Setup-0.1.0.exe` (127 MB), program startuje, `app-update.yml` poprawny. Pełnej aktualizacji nie da się sprawdzić bez dwóch wydań na GitHubie.
W toku: nic — użytkownik: wydać 0.1.0 na GitHubie, zainstalować, potem wydać 0.1.1 i sprawdzić „Aktualizuj”.
Do zrobienia: test aktualizacji przez użytkownika (wydanie 0.1.0 i 0.1.1 wg `INSTRUKCJA-WYDANIE.md`); etap 6 (mapa — czeka na rysunek mapy od użytkownika); decyzja użytkownika, czy `materialy/` ma być w publicznym repo; szkice w `assets/_drafts/` do ręcznego usunięcia.
Następny krok: po teście aktualizacji (0.1.0 → 0.1.1) — etap 6.0: przebudowa układu pod mapę (mapa na cały ekran + szuflady z boku), potem 6.1 wgranie rysunku mapy.
Problemy / pytania do użytkownika: Lucjan zrobiony z opisu (kaptur na głowie, nie odsunięty) — czy gracz ma obrazek?; czy Draenei mogą mieć podobne twarze (pytanie z poprzedniej sesji).

## 2026-10-17 — poprawka Drekkiego, 2.3 Orkowie i Nieumarli
Zrobione: Drekki v6 (Klein-edytor: broda jaskrawoczerwona, 2 warkocze ze stalowymi obręczami), art-director 8/10; blok w karcie zaktualizowany.
Karty `assets/postacie/gor-khar.md` i `grobowe-imperium.md` (10 bohaterów; władcy w `wladcy.md`), wycinki twarzy/stylu w `assets/postacie/refy/` (styl = wycinek sceny władcy BEZ twarzy).
2.3: 12 portretów w `assets/portrety/` — 10 zaakceptowanych przez art-directora (7–9/10), Razhka (7/10) i Morthalass (6/10) „do poprawy” po limicie 4 ocen. Karevra bez głowy (decyzja użytkownika). Karta Krazha: portret z profilu, ślepe oko po niewidocznej stronie. Aplikacja bierze portrety sama (nazwy = słowo z imienia).
Po uwagach użytkownika: Bob v3 (typowy strój doktora plagi, prosty dziób, maska na całą twarz) 8/10 zaakceptowany; Merrla v7 (widmowa, rozpływa się w mgle) 6/10 „do poprawy” — Klein nie umie zrobić przezroczystego ciała.
Poprawki: Razhka (nowa generacja + edytor: krótkie kły, czerwone pasy, smok z niebieską obwódką) 7/10 i Morthalass (nowa generacja pod wodą, gnijący, świecący punkt-oko usunięty skryptem) 7/10 — zaakceptowane. Merrla: nowa wersja mniej widmowa, zostaje v7 „do poprawy” (Klein nie robi przezroczystości).
Użytkownik zaakceptował 22 portrety; Karevra i Merrla do poprawy → Karevra (pusta szyja, korona z przerwą, halabarda w dłoni) 7/10 i Merrla (duch przez kolor i mgłę — decyzja użytkownika) 8/10, czekają na ocenę.
W toku: nic.
Do zrobienia: Merrla do poprawy — UŻYTKOWNIK: ma być full body albo przynajmniej pełny portret (nie samo popiersie ucięte mgłą); Karevra zaakceptowana przez użytkownika („w miarę ok”); potem 2.4.
Następny krok: Merrla jako postać w pełnej sylwetce (full body) albo pełny portret — zapytać użytkownika, który kadr i jak to pogodzić z kwadratem 128 px na karcie; potem 2.4 — karty postaci i portrety Czarnego Smoka, Kreegan i Goblandii (`materialy/info/bohaterowie/`).
Problemy / pytania do użytkownika: propozycja klein-ref-stylu-bez-twarzy wprowadzona 2026-10-17 (ZMIANY.md); czy Draenei mogą mieć podobne twarze.

## 2026-10-16 (13) — Etap 2: karty postaci i portrety Dawi/Draenei
Zrobione: 2.6 i 2.7 odhaczone (Sala Tronów zrobiona w Etapie 1). 2.1: karty postaci `assets/postacie/krag-mhor.md` (5 bohaterów) i `aurelia.md` (5 Starszych) — wygląd z plansz/obrazów graczy, cechy obowiązkowe, bloki do promptów; Fyrgrim i Drekki rozróżnieni rekwizytem i tłem (na planszach są prawie identyczni), Starsi Aurelii kolorem swojego kamienia.
2.2: 12 portretów 128 px w `assets/portrety/` (+ wersje `_1024.png`, nie trafiają do builda). Metoda: Klein z wycinkiem twarzy z obrazka gracza + wycinek sceny Sali Tronów jako styl; za gładkie przerysowane Kleinem jako edytorem (opis w STYLE.md, 2 lekcje w LEKCJE.md). `narzedzia.py portret` (LANCZOS + 32 kolory octree). Art-director: 11 zaakceptowanych (7–8/10), Drekki 7/10 „do poprawy” (broda za ciemna, obręcze słabo widać). Aplikacja pokazuje portret zamiast inicjałów (plik = słowo z imienia, np. `dagna.png`); karta 138 px, okno 266 px (×1/×2, pixelated). Sprawdzone zrzutami Electrona. Wycinki referencji w `assets/postacie/refy/`.
W toku: nic.
Do zrobienia: ocena portretów przez użytkownika (12 czeka w `assets/podglad.html`), poprawka Drekkiego, potem 2.3 (karty postaci + portrety Orków i Nieumarłych).
Następny krok: zbierz uwagi użytkownika do 12 portretów z `assets/podglad.html`, popraw wskazane; potem 2.3 — karty postaci Orków i Nieumarłych z `materialy/info/bohaterowie/orkowie` i `undead`.
Problemy / pytania do użytkownika: czy Draenei mogą mieć podobne twarze (rozróżnia je kolor kamienia), czy chcesz wyraźniej różne rysy?

## 2026-10-16 (12) — krok 1.5: karty bohaterów (koniec Etapu 1)
Zrobione: na karcie frakcji sekcja „Bohaterowie” (nad zasobami): siatka kart z portretem zastępczym (inicjały na tle w kolorze frakcji), imieniem, tytułem, znaczkiem „Władca” (władca pierwszy) i statusem w kolorze. Klik → okno (`<dialog>`) z większym portretem 128 px, faktami (tytuł, funkcja, wiek, broń), wyborem statusu (w stolicy / na misji / ranny / martwy) i rodzaju misji (z armią / z flotą / inne) oraz pełnym opisem. Zmiana statusu zapisuje się w DEMO. Sprawdzone zrzutami (offscreen Electron): siatka orków, okno Gorzaka, zapis „z armią” w localStorage. Użytkownik zapytał o animowane portrety — w planie już jest 7.3.
W toku: nic.
Do zrobienia: Etap 2 — pixel art (karty postaci, portrety 128 px, herby, ikony, ramki).
Następny krok: zacznij 2.1 — karty postaci w `assets/postacie/` dla bohaterów Dawi i Draenei na podstawie `src/dane/bohaterowie.js` i obrazów z `materialy/info/bohaterowie/`.
Problemy / pytania do użytkownika: czy animacje portretów (7.3) przesunąć wcześniej, np. zaraz po portretach z Etapu 2?

## 2026-10-16 (11) — kroki 1.3 i 1.4: dane DEMO i karta frakcji
Zrobione: 1.3 — `src/dane/frakcje.js` (7 frakcji: stolica, ustrój, władca, godło, motto, specjalizacja, gracz, unikalne zasoby, opis w sekcjach), `src/dane/bohaterowie.js` (36 bohaterów, 6 u Dawi z plansz graczy, statusy domyślnie „w stolicy”), `src/dane/magazyn.js` (localStorage `frp-demo`, wersjonowane). Usunięty tymczasowy `src/frakcje.js`. 1.4 — karta frakcji: herb zastępczy (tarcza w kolorze frakcji z literą), przydomek, motto, siatka faktów, ramka „Unikalne zasoby i mechaniki”, sekcje opisu z listami. Sprawdzone: build OK, zrzuty Aurelii i Kreegan z Electrona, brak błędów w konsoli. Potem na prośbę użytkownika: unikalne zasoby jako lista per frakcja z dodawaniem (nazwa + opis) i usuwaniem pojedynczo, zapis w DEMO (sprawdzone: przetrwa przeładowanie); mechaniki potem usunięte na prośbę użytkownika (może wrócą później); `WERSJA` danych = 2. `vite.config.js` → `.mjs` (koniec ostrzeżenia Vite). Uwaga użytkownika: docelowo wszystko synchronizowane przez Firebase — zapisane w PLAN (4.1).
W toku: nic.
Do zrobienia: 1.5 karty bohaterów; potem Etap 2 (pixel art).
Następny krok: zrób 1.5 — pod kartą frakcji (albo w zakładce „Bohaterowie”) siatka kart z `stan.bohaterowie` danej frakcji: portret zastępczy, imię, tytuł, funkcja, status; po kliknięciu pełny opis.
Problemy / pytania do użytkownika: brakujące dane graczy (lista w PLAN → Otwarte pytania); unikalne zasoby to propozycje do potwierdzenia przez GM.

## 2026-10-16 (10) — krok 1.2: powłoka interfejsu
Zrobione: „Wejdź do sali” (DEMO, bez hasła) chowa menu i pokazuje powłokę: górny pasek (tytuł, „tryb DEMO”, guzik „Sala Tronów” = powrót do menu), boczne menu 7 frakcji z paskiem w kolorze frakcji, panel główny z tymczasową kartą (nazwa, rasa, władca, schodkowe pixel-artowe narożniki). Animacja sali pauzuje, gdy jej nie widać. Wybrana frakcja zapamiętana w localStorage. Lista frakcji: `src/frakcje.js` (krok 1.3 ją rozbuduje). Na wąskim ekranie menu frakcji idzie w poziomie. Dodany `uruchom.bat` (podwójne kliknięcie = build + okno programu; sam instaluje zależności, jeśli ich brak). Sprawdzone: build OK, zrzuty z Electrona (powłoka i powrót do menu).
W toku: nic.
Do zrobienia: 1.3 dane DEMO (localStorage) + dane 7 frakcji i bohaterów z `materialy/`, potem 1.4 i 1.5.
Następny krok: zrób 1.3 — przepisz z `materialy/info/frakcje` i `materialy/info/bohaterowie` dane frakcji (stolica, ustrój, motto, opis w sekcjach, unikalne zasoby) i bohaterów do `src/dane/` i dodaj warstwę zapisu w localStorage.
Problemy / pytania do użytkownika: rasa Królestwa Czarnego Smoka wpisana roboczo jako „Smok i jego poddani” — do potwierdzenia.

## 2026-10-16 (9) — krok 1.1: szkielet Vite + Electron
Zrobione: `package.json` (wersja 0.1.0, skrypty dev/build/app), `vite.config.js` (base "./"), `electron/main.cjs` (okno 1600×900, bez paska menu), `index.html` + `src/main.js` + `src/style.css` — menu Sali Tronów jako ekran startowy aplikacji (wersja z package.json, „tryb DEMO”). `animacje.js`: `new Sala(canvas, folder)` przyjmuje też funkcję plik → adres. Zainstalowane vite@8.3.4 i electron@44.8.0 (npm nie pobrał samego programu Electron — trzeba było `node node_modules/electron/install.js`). Sprawdzone: `npm run build` OK, okno Electrona otwiera się z dist i rysuje animowaną salę (zrzut przez DevTools). `assets/menu.html` zostaje jako podgląd do nagrywania GIF-ów.
W toku: nic.
Do zrobienia: 1.2 powłoka interfejsu (menu frakcji, panel główny) — po „Wejdź do sali” w trybie DEMO.
Następny krok: zrób 1.2 — po kliknięciu „Wejdź do sali” (DEMO, bez hasła) ekran z bocznym menu 7 frakcji i panelem głównym w stylu menu (Cinzel/Spectral, złoto na ciemnym).
Problemy / pytania do użytkownika: brak. Użytkownik robi restart sesji (po instalacji gifsicle).

## 2026-10-16 (8) — dym smoka, zostaje tylko menu E
Zrobione: Shire — namalowany dym przy paszczy wycięty skryptem do warstwy `assets/sala_tronow/shire_dym.png` z odtworzonym tłem `shire_dym_tlo.png` (obszar 800,550 245×350); dym faluje w paskach (mocniej ku górze), co 5–9 s wydech: kłęby (ciemne i jasnoszare) lecą z paszczy w lewo, hamują i unoszą się, a namalowany dym odpycha się od paszczy; gest smoka też jest wydechem. Na życzenie użytkownika usunięte warianty A–D: nowa czysta strona `assets/menu.html` (tylko E), `menu-warianty.html` skasowany, link w `podglad.html` poprawiony. 1.0e odhaczony.
W toku: nic.
Do zrobienia: uwagi użytkownika do animacji na żywo; ewentualnie nowy GIF/MP4 dla graczy (stary to animacje v1 i wariant A); potem krok 1.1.
Następny krok: zbierz uwagi do `assets/menu.html`; bez uwag zacznij 1.1 — projekt Vite + Electron.
Dograne: nowy podgląd dla graczy z menu E i animacji v2 — `assets/sala_tronow/sala_tronow_podglad.gif` (480×270, 10 kl./s, 28 s, 9,6 MB — mniejszy niż poprzednio, bo dryf kamery/mgła zmieniają cały obraz i 640×360 miało 16 MB) i `.mp4` (1280×720, 6,4 MB). Nagrywanie: Chrome headless przez DevTools Protocol, `menu.html?nagranie`, 7 scen × 4 s, 15 kl./s, potem ffmpeg (palettegen diff, bez ditheringu).
Poprawka GIF-a (użytkownik ma Nitro, limit 50 MB, 480×270 „syfiaste”): GIF 960×540, 12 kl./s, 28 s, 47 MB — każda scena ma własną paletę 256 kolorów (osobne GIF-y z ffmpeg sklejone skryptem, paleta globalna → lokalna), więc nie ma schodków na gradientach; MP4 1920×1080, 14 MB. Skrypty w `assets/narzedzia_nagrania/`: `node nagraj.mjs "file:///…/assets/menu.html?nagranie" <folder_klatek>` (420 PNG), potem dla każdej sceny s: `ffmpeg -framerate 15 -start_number s*60 -i k%04d.png -frames:v 48 -lavfi "fps=12,scale=960:540:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" segS.gif`, na koniec `python sklej.py wynik.gif seg?.gif`.
Problemy / pytania do użytkownika: brak.

## 2026-10-16 (7) — wariant menu E (C+D) i animacje v2
Zrobione: w `assets/menu-warianty.html` nowy wariant E = C+D (domyślny, klawisz E): duży tytuł i panel bez ramki z D, pasek miniatur władców z C (prawy dół, podpis nad nim), przejście z błyskiem; mocniejsze przyciemnienie z lewej (czytelność na jasnej scenie Seranyi). `animacje.js` v2: nowe mruganie (górna powieka łukiem + dolna, linia rzęs, kolor powieki z próbki skóry wokół każdego oka, szybkie zamknięcie/wolniejsze otwarcie, czasem podwójne), poprawione współrzędne oczu (lewe oko Taraela było przesunięte o 20 px, oczy Elmona i Shire'a z centroidów czerwieni), świecenie oczu gaśnie przy mrugnięciu; osobna warstwa głowy (rozglądanie, skinienie przy geście), oddech z rozszerzaniem piersi, dryf kamery bez odsłaniania brzegów, mgła przy podłodze (2 warstwy), smugi światła (Seranya, Shire), dym (Shire, fioletowy u Taraela), duże rozmyte drobiny przed kamerą, drganie światła pochodni, mocniej falujące sztandary, bogatsze płomienie. Sprawdzone zrzutami z Chrome headless (klatki mrugnięć wszystkich władców i pełne ekrany).
W toku: nic.
Do zrobienia: ocena użytkownika wariantu E i nowych animacji; po akceptacji oznaczyć 1.0e; ewentualnie nowy GIF/MP4 dla graczy (stary pokazuje animacje v1).
Następny krok: zapytaj o ocenę wariantu E (`assets/menu-warianty.html#E`) i uwagi do animacji; po akceptacji odhacz 1.0e i zacznij 1.1 (Vite + Electron).
Problemy / pytania do użytkownika: czy E zostaje; czy odświeżyć GIF/MP4 dla graczy.

## 2026-10-16 (6) — akceptacja scen, warianty menu z animacjami, GIF dla graczy
Zrobione: użytkownik zaakceptował 7 scen → `assets/sala_tronow/<władca>.png` (1920×1080) + `fanarty/` (2048×1152); `_drafts` wyczyszczony (100 plików, 193 MB); `podglad.html` i `ASSETS.md` przepisane na finały. Silnik animacji `assets/sala_tronow/animacje.js` (canvas: oddech, mruganie, migotanie ognia, blask lawy/kryształów/magii, iskry/pył/popiół, dym Shire'a, falujące sztandary, gest co 9–14 s). `assets/menu-warianty.html`: 4 warianty (A panel z boku/przenikanie, B kinowy/przez czerń, C pasek miniatur/przesuwanie, D duży tytuł/błysk), klawisze A–D, H chowa pasek, F pełny ekran. Podgląd dla graczy: `assets/sala_tronow/sala_tronow_podglad.gif` (640×360, 27 s, 9,97 MB) i `.mp4` (1280×720, 5,3 MB). Usunięty stary `menu-podglad.html`. Zapisane w PLAN.md logowanie e-mail/Google i ustalenia; pamięć: sprzątanie `_drafts` i tempa.
Wprowadzona zmiana zasad „sprzatanie” (CLAUDE.md, wpis w ZMIANY.md). Sesja przerwana na prośbę użytkownika.
W toku: nic.
Do zrobienia: użytkownik wybiera wariant menu (i uwagi do animacji); potem dopracować wybrany wariant i oznaczyć 1.0e jako zrobiony.
Następny krok: zapytaj, który wariant menu (A/B/C/D) wybiera i co zmienić w animacjach.
Problemy / pytania do użytkownika: wybór wariantu menu; GIF ledwo mieści się w 10 MB Discorda — w razie czego wysłać MP4.

## 2026-10-16 (5) — poprawki scen przed oceną użytkownika
Zrobione: Surtr v7 (młot ze świecącym wzorem bez liter, bazaltowa podłoga; AD 8/10 akceptuj), Tarael v5 (nowy seed 1010: męska twarz, czarna bródka, glewia; AD 8/10 akceptuj), Gobloni v9 (gobliny z v7 wklejone do v6 i zgrubione do skali króla; AD 8/10 akceptuj), Seranya v5 (skóra przebarwiona skryptem na szaro-liliową; v4 AD 7/10 „za chłodna”, v5 cieplejsza, nieoceniona). Drogath v6 (dłuższe kły) odrzucony — zostaje v4. Elmon bez zmian (czerwona poświata — drobiazg). Obie strony podglądu i ASSETS.md zaktualizowane, 3 nowe lekcje.
Dopisane do PLAN.md: logowanie przez e-mail albo Google; w `menu-podglad.html` dodany przycisk „Zaloguj przez Google”.
W toku: nic.
Do zrobienia: ocena użytkownika 7 scen; potem finały do `assets/sala_tronow/` i fanarty. Ewentualnie: kły Drogatha (nowy seed z bliskim kadrem twarzy), czerwona poświata Elmona, czarne plamy w lewych dolnych rogach scen (przykryje panel).
Następny krok: zbierz uwagi użytkownika do scen z `assets/podglad.html`; zaakceptowane przenieś do `assets/sala_tronow/`.
Problemy / pytania do użytkownika: 7 scen czeka na ocenę (`assets/podglad.html`, `assets/menu-podglad.html`).

## 2026-10-16 (4) — ocena alternatyw scen
Zrobione: podglądy `_gra` i ocena art-directora dla B_surtr_v5, B_gobloni_v7, B_tarael_v4 — wszystkie trzy gorsze od obecnych (Surtr v5 6/10: „3” i „X” na młocie; Gobloni v7 6,5/10: rozmyty; Tarael v4 4/10: kobiecy, bródka jak język, ucięty kadr). Zostają v4 / v6 / v2, w `podglad.html` alternatywy opisane jako odrzucone. 4 nowe lekcje w LEKCJE.md. Poprawiony opis uruchamiania `narzedzia.py` (bez `-I`).
W toku: nic.
Do zrobienia: ocena 7 scen przez użytkownika (`assets/podglad.html`, `assets/menu-podglad.html`); potem poprawki wg uwag. Propozycje art-directora: Surtr v4 — inpaint głowicy młota na wersji 1024 („abstract angular rune marks”, negatyw „letters, numbers”); Gobloni v6 — gobliny img2img 0.3–0.35; Tarael v2 — twarz/bródka/glewia (nowy seed z szerokim kadrem v2 + negatyw „female, eyelashes, tongue”); finały do `assets/sala_tronow/`, fanarty.
Następny krok: zapytaj użytkownika o ocenę scen; bez uwag zacznij od inpaintu młota Surtra na v4 w 1024×576 z maską i -Hires.
Problemy / pytania do użytkownika: czekam na ocenę 7 scen. Uwaga art-directora: gobliny u Gobloniego i młot Surtra wchodzą w lewą część, gdzie ma być panel logowania.

## 2026-10-16 (3) — 7 scen władców + podgląd menu
Zrobione: wszystkie 7 scen (Surtr, Seranya, Gobloni, Elmon, Shire, Drogath, Tarael) w 2048×1152 + podglądy 1920×1080 (`*_gra.png`), każda oceniona przez art-directora 2–3 razy. Shire zaakceptowany (8/10), reszta 6–7/10 „popraw”. Poprawki: młot Surtra (v4, na uwagę użytkownika), zielone gobliny u Gobloniego (v6), Tarael w kolorach od użytkownika (v2), usunięty artefakt u Drogatha (v4). Karta Taraela poprawiona. Narzędzie `assets/narzedzia.py` (podgląd, wycinanie, maski, wklejanie, zmiana rozmiaru). Nowa strona `assets/menu-podglad.html` (pełny ekran, przenikanie scen, panel logowania) i odświeżony `assets/podglad.html`.
W toku: 3 nieocenione wersje alternatywne z ostatniego przebiegu: `B_surtr_v5`, `B_gobloni_v7` (całe sceny przerysowane img2img 0.45–0.5) i `B_tarael_v4` (bliższy kadr, bródka/oczy/glewia) — trzeba je obejrzeć i dać art-directorowi.
Do zrobienia: ocena alternatyw → wybór wersji → podmiana w `menu-podglad.html` i `podglad.html`; opcjonalnie: dłuższe kły Drogatha (nowy seed), czerwona poświata Elmona, liliowa skóra Seranyi; finały do `assets/sala_tronow/`, fanarty dla graczy jako osobne pliki.
Następny krok: obejrzyj B_surtr_v5, B_gobloni_v7 i B_tarael_v4, zrób ich podglądy `gra` i wyślij do art-directora; lepsze wersje podmień w obu stronach podglądu.
Problemy / pytania do użytkownika: grafik do oceny: 7 scen (`assets/podglad.html`) + podgląd menu (`assets/menu-podglad.html`). Wnioski: poprawki fragmentu na wycinku 1024 z obrazu 2048 dają „wklejony” wygląd (inna skala pikseli) — poprawiać na wersji 1024×576 z maską i potem -Hires; poprawki samej twarzy w tej skali niszczą twarz (lepiej nowy seed z bliższym kadrem).

## 2026-10-16 (2) — Sala Tronów: porządne sceny władców
Zrobione: zebrane pełne info o 7 władcach w `assets/postacie/wladcy.md` (opisy graczy dosłownie + wygląd z obrazków, cechy obowiązkowe, paleta, blok do promptów, pomysł na tron). Scena B z Surtrem w 16:9: `assets/_drafts/B_surtr_v1.png` (2048×1152, seed 1000, 72 s). Użytkownik wybrał styl jak B (osobne sceny).
W toku: nic (przerwane na prośbę użytkownika).
Do zrobienia: 6 scen B — Seranya, Gobloni, Elmon Devil, Shire, Drogath, Tarael — tym samym promptem bazowym, władca w prawej 2/3, wolne miejsce na panel logowania z lewej; potem przeskalować do 1920×1080, ocena art-directora, nowy `assets/podglad.html`.
Następny krok: wygeneruj scenę Seranyi (1024×576 -Hires, seed 1000) z blokiem tożsamości i tronem z `assets/postacie/wladcy.md`.
Problemy / pytania do użytkownika: brak. Grafik do oceny: 1 (`assets/_drafts/B_surtr_v1.png`; strona podglądu jeszcze nieaktualna).

## 2026-10-16 — wywiad i plan
Zrobione: przejrzane materiały (frakcje, bohaterowie, stary WorldWatch), wywiad (3 partie), zapisany `PLAN.md` i `assets/STYLE.md`. Dopisana Sala Tronów (animowany ekran logowania z władcami).
Plan zaakceptowany (nazwa „Fantasy RP dla autystów”, admin = użytkownik, nadaje role jak w WorldWatch).
Krok 1.0: 3 szkice kompozycji Sali Tronów w `assets/podglad.html` (A sala w rzędzie, B osobne sceny, C okrągła rada).
W toku: czekam na wybór kompozycji (3 szkice do oceny).
Do zrobienia: Etap 1 od kroku 1.1.
Następny krok: zapisz wybraną kompozycję w PLAN.md (Decyzje) i zacznij krok 1.1 — projekt Vite + Electron.
Problemy / pytania do użytkownika: którą kompozycję wybiera; ilu graczy i kto GM (do etapu 4).
