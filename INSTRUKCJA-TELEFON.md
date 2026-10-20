# Podgląd na telefon (GitHub Pages)

Strona: **https://erlethaden.github.io/Fantasy_RP/** — ten sam program, tylko do czytania (bez Panelu GM, edycji i propozycji). Logowanie jak w programie; każdy widzi to, co widzi w programie.

## Jednorazowo
1. **Włącz Pages:** GitHub → repozytorium Fantasy_RP → Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
2. **Pozwól logować się ze strony:** konsola Firebase → Authentication → Settings → *Authorized domains* → **Add domain** → `erlethaden.github.io`.
   Bez tego logowanie (zwłaszcza przez Google) na stronie się nie uda.
3. Zrób push na `main` (z plikiem `.github/workflows/podglad-telefon.yml`).

## Potem
- Każdy push na `main` sam przebudowuje stronę (GitHub → zakładka **Actions** → „Podgląd na telefon”; ok. 2–3 minuty).
- Ręcznie: Actions → „Podgląd na telefon” → **Run workflow**.
- Na telefonie można dodać stronę do ekranu głównego (Udostępnij / menu przeglądarki → „Dodaj do ekranu głównego”).

## Sterowanie na telefonie
- Mapa: jeden palec przesuwa, dwa palce przybliżają; dotknięcie prowincji otwiera jej kartę.
- Na dole: Bloki, Kronika, Sala Tronów, Wyloguj. Frakcje — herby u góry (przewijane w bok).
