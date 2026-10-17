# Zakładanie projektu Firebase (etap 4.1)

Zajmie ok. 10 minut. Wszystko na darmowym planie **Spark**, bez karty płatniczej.

## 1. Projekt
1. Wejdź na https://console.firebase.google.com i zaloguj się kontem Google, które ma być kontem admina.
2. **Utwórz projekt** (Create a project). Nazwa np. `fantasy-rp`.
3. Google Analytics: **wyłącz** (niepotrzebne). Kliknij **Utwórz projekt**.

## 2. Logowanie
1. Menu po lewej: **Kompilacja → Authentication** (Build → Authentication) → **Rozpocznij**.
2. Zakładka **Metoda logowania** (Sign-in method):
   - **E-mail/hasło** → włącz pierwszy przełącznik → Zapisz.
   - **Google** → włącz → wybierz swój e-mail jako adres pomocy → Zapisz.

## 3. Baza danych
1. **Kompilacja → Firestore Database** → **Utwórz bazę danych**.
2. Lokalizacja: **eur3 (europe-west)** albo `europe-central2 (Warszawa)`. Tego nie da się potem zmienić.
3. Tryb: **produkcyjny** (production mode). Reguły dostępu wgram ja w kolejnym kroku.

## 4. Klucze aplikacji (to przekazujesz mnie)
1. Kółko zębate obok „Przegląd projektu” → **Ustawienia projektu**.
2. Na dole „Twoje aplikacje” → ikona **`</>`** (Web).
3. Nazwa np. `fantasy-rp-web`. **Nie** zaznaczaj Firebase Hosting. → Zarejestruj aplikację.
4. Pokaże się kod z `const firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., ... }`.
   **Skopiuj cały ten blok i wklej mi w czacie.**
   To nie jest tajne hasło: te dane i tak są widoczne w każdej stronie z Firebase. Bezpieczeństwa pilnują reguły bazy (etap 4.3).

## 5. Gotowe
Napisz „firebase gotowy” i wklej `firebaseConfig`. Resztę (podłączenie aplikacji, reguły, pierwsze konto admina) robię ja.
