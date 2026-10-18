# Wydawanie nowej wersji programu (GitHub)

Program sprawdza przy każdym starcie, czy na GitHubie (`Erlethaden/Fantasy_RP` → Releases) jest nowsza wersja.
Jeśli jest, gracz nie zaloguje się, dopóki nie kliknie **Aktualizuj** — program sam pobierze, zainstaluje i uruchomi nową wersję.
Żeby to działało, każde wydanie musi mieć **3 pliki** i **wyższy numer wersji**. Poniżej krok po kroku.

---

## Raz na początek

1. Repozytorium `Erlethaden/Fantasy_RP` musi być **publiczne** (gracze pobierają z niego aktualizacje bez logowania).
2. Wrzucasz kod jak zwykle. Plik `.gitignore` już pomija rzeczy, których nie trzeba wysyłać (`node_modules`, `dist`, `release`, szkice).
3. **Zdecyduj o folderze `materialy/`** — są tam obrazki i teksty graczy z Discorda. Program ich nie potrzebuje (portrety są w `assets/`).
   Jeśli nie chcesz, żeby były publiczne, dopisz do `.gitignore` linijkę `materialy/`.
4. Konfiguracja Firebase w kodzie (`src/firebase-config.js`) **może** być publiczna — danych pilnują reguły Firestore.

## Każde nowe wydanie

### 1. Podnieś numer wersji
W `package.json` zmień `"version"` na wyższy, np. `"0.1.0"` → `"0.2.0"`.
- Numer musi być **większy** niż w poprzednim wydaniu, inaczej program nie uzna go za aktualizację.
- Zasada: małe poprawki → ostatnia cyfra (`0.2.0` → `0.2.1`), nowe funkcje → środkowa (`0.2.1` → `0.3.0`).

### 1b. Dopisz „Co nowego”
W pliku `src/dane/zmiany.js` dodaj **na górze listy** wpis z tym samym numerem co w `package.json`, np.:
```js
  { wersja: "0.2.0", data: "2026-11-01", zmiany: [
    "Mapa świata z prowincjami.",
    "Poprawiony błąd przy zamykaniu tury.",
  ] },
```
Każda zmiana w cudzysłowie, oddzielone przecinkami. Gracze zobaczą to okienko raz, przy pierwszym uruchomieniu po aktualizacji (jeśli pominęli kilka wersji — wszystkie wpisy od ostatniej, którą mieli). Bez wpisu dla nowej wersji okienko się nie pokaże.

### 2. Zbuduj instalator
Kliknij dwa razy **`zbuduj-instalator.bat`** (albo w konsoli: `npm run instalator`). Trwa 1–3 minuty.
Po skończeniu otworzy się folder `release/` z plikami — potrzebne są te **trzy**:

| Plik | Po co |
|---|---|
| `Fantasy-RP-Setup-0.2.0.exe` | instalator (dla nowych graczy i do aktualizacji) — **obowiązkowy** |
| `latest.yml` | po nim program poznaje, że jest nowa wersja i który plik pobrać — **obowiązkowy** |
| `Fantasy-RP-Setup-0.2.0.exe.blockmap` | zalecany: przy aktualizacji pobierają się tylko zmienione części; bez niego aktualizacja działa, ale pobiera cały instalator (~127 MB) |

Graczowi do **pierwszej instalacji** wystarczy sam `.exe` — pozostałe dwa pliki są tylko dla mechanizmu aktualizacji.

Najlepiej najpierw zainstaluj ten `.exe` u siebie i sprawdź, czy wszystko działa.

### 3. Opublikuj wydanie na GitHubie
1. Wejdź na https://github.com/Erlethaden/Fantasy_RP → po prawej **Releases** → **Draft a new release** (albo „Create a new release”).
2. **Choose a tag** → wpisz `v0.2.0` (litera `v` + numer z `package.json`) → **Create new tag: v0.2.0 on publish**.
3. **Release title**: np. `Wersja 0.2.0`. W opisie możesz skopiować listę zmian z `src/dane/zmiany.js` (gracze widzą ją w programie w okienku „Co nowego”).
4. Na dół, w pole „Attach binaries…”, **przeciągnij 3 pliki** z tabeli wyżej. Poczekaj, aż wszystkie się wgrają (zielone).
5. Upewnij się, że **NIE** jest zaznaczone „Set as a pre-release”, a jest zaznaczone **„Set as the latest release”**.
6. Kliknij **Publish release** (nie „Save draft” — szkic jest niewidoczny dla programu).

Gotowe. Gracze przy najbliższym uruchomieniu programu zobaczą „Dostępna nowa wersja 0.2.0 — Aktualizuj”.

### Czego nie robić
- Nie zmieniaj nazw plików przed wgraniem (nazwa `.exe` jest zapisana w `latest.yml`).
- Nie wgrywaj samego `.exe` bez `latest.yml` — aktualizacja nie zadziała.
- Nie usuwaj najnowszego wydania ani jego plików — programy graczy przestaną widzieć aktualizacje.
- Nie wydawaj dwa razy tego samego numeru wersji.

---

## Pierwsza instalacja u gracza
1. Wyślij graczowi link: https://github.com/Erlethaden/Fantasy_RP/releases/latest
2. Gracz pobiera `Fantasy-RP-Setup-….exe` i uruchamia. Instalator pyta o folder, tworzy skrót na pulpicie i w menu Start.
3. Windows może pokazać **„System Windows ochronił ten komputer”** (program nie ma płatnego podpisu cyfrowego) →
   **Więcej informacji** → **Uruchom mimo to**. To normalne dla małych, niepodpisanych programów.
4. Gracz loguje się (najlepiej przez Google), czeka na nadanie roli przez admina — i gra.
   Kolejne wersje instaluje już sam przyciskiem **Aktualizuj**.

## Gdy coś nie działa
| Objaw | Co sprawdzić |
|---|---|
| Program nie widzi nowej wersji | Czy wydanie jest **opublikowane** (nie szkic, nie pre-release)? Czy jest `latest.yml`? Czy numer w `package.json` był wyższy? |
| „Nie udało się pobrać aktualizacji” | Internet gracza; czy plik `.exe` w wydaniu ma dokładnie nazwę z `latest.yml`. |
| Program w ogóle nie startuje po aktualizacji | Zainstaluj ręcznie poprzednią wersję z listy wydań; daj znać, co się stało. |
| Gracz nie ma internetu przy starcie | Program pozwoli się zalogować bez sprawdzania — sprawdzi przy następnym starcie. |
