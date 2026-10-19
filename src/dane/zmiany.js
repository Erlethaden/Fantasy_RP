// „Co nowego” po aktualizacji: najnowsza wersja na górze; przed każdym wydaniem dopisz wpis z numerem z package.json (INSTRUKCJA-WYDANIE.md)
export const ZMIANY = [
  {
    wersja: "0.3.0", data: "tbd", zmiany: [
      "Kraje są dużo lepiej widoczne: wypełnienie w kolorze kraju i gruby pas w tym kolorze wzdłuż granic państwa.",
      "Mapa ma złotą ramkę, różę wiatrów, mgłę przy krawędziach i lekko migoczące odblaski na wodzie.",
      "Nowy wygląd mapy: pixel art — trawa, morze (płytkie i głębokie), plaże, rzeki i pasma ośnieżonych gór zamiast kresek z rysunku.",
      "Każda prowincja ma teren: równina, las, pustynia, bagno albo tundra (startowo ustawione, GM zmienia na karcie prowincji) — widać go na mapie.",
      "Traktaty: GM wpisuje w Panelu GM traktaty między krajami (sojusz, pakt o nieagresji, umowa handlowa, traktat pokojowy, wasalstwo, prawo przejścia wojsk, inny) — nazwa, strony, opis, opcjonalnie tajny (widzą go tylko strony i GM). Na karcie frakcji jest lista jej traktatów.",
      "Traktat pokojowy kończy wojnę między stronami; przy wypowiedzeniu wojny program pyta, czy zerwać sojusz albo pakt między nimi. Traktat można zerwać (zostaje w historii) albo usunąć.",
      "Mapa: umowa handlowa rysuje złoty szlak między stolicami — lądem przez prowincje (omija góry), a gdy się nie da — przez morze. Sojusze i pakty jako kropkowane linie. Przyciski „Szlaki” i „Sojusze” w rogu mapy włączają te warstwy.",
    ],
  },
  {
    wersja: "0.2.4", data: "19-10-2026", zmiany: [
      "Armie: GM zakłada armię na karcie frakcji (staje w stolicy), ustawia dowódcę — bohatera albo pospolitego dowódcę z imieniem — dodaje bohaterów i oddziały z listy jednostek z liczbą żołnierzy. Bohater w armii dostaje sam status „na misji (z armią)”, po rozwiązaniu armii wraca do stolicy.",
      "Armie są na mapie: sztandar w kolorze frakcji (widać go po przybliżeniu, każdy gracz). Kliknięcie sztandaru otwiera kartę frakcji przy jej armiach.",
      "GM wyznacza armii cel: „Wyznacz cel” i klik na mapie — prowincja, osada (klik blisko niej) albo sztandar innej armii (pościg). Program liczy najkrótszą trasę i pokazuje ją na mapie z napisem „za N tur”; trasę widzi właściciel i GM.",
      "Przy zamknięciu tury każda armia z celem robi 1 krok trasy (przebyta droga ciągłą linią). Cofnięcie zamknięcia tury cofa też ruchy armii. GM może przestawić armię ręcznie („Przestaw” i klik na mapie) bez zużycia tury.",
      "Wojny: GM ustawia w Panelu GM, które kraje (frakcje i kraje NPC) są w stanie wojny. Na karcie frakcji widać „W stanie wojny z: …”.",
      "Bitwy: gdy przy zamknięciu tury armie krajów w wojnie staną w tej samej prowincji albo miną się na granicy, wybucha bitwa — armie stają, na mapie pojawia się znak bitwy. GM rozstrzyga na ekranie bitwy; może też „Wymusić bitwę” z armią w tej samej albo sąsiedniej prowincji.",
      "Ekran bitwy: klik w znak bitwy albo „Ekran bitwy” przy armii — obie strony obok siebie z porównaniem sił i oddziałami podzielonymi na elitę, regularne i chołotę. Pełny skład widzą strony bitwy i GM, gracz dostaje ekran sam po wejściu, gdy jego armia trafi do bitwy. GM kończy bitwę wpisując zwycięzcę, opis i opcjonalnie straty oraz poległych bohaterów — program odejmuje je od armii. Na karcie frakcji jest historia jej bitew z wynikami.",
      "Armia poniżej 100 żołnierzy zostaje rozwiązana przy zamknięciu tury (karta armii ostrzega wcześniej, bohaterowie wracają do stolicy). Cofnięcie tury przywraca rozwiązane armie i cofa bitwy.",
      "Przy frakcji GM zaznacza umiejętności ruchu: przejście przez góry i przez rzeki bez mostu — bez nich armia obchodzi je dookoła.",
      "Skład armii jest domyślnie tajny (widzi gracz tej frakcji i GM); GM może go ujawnić w części Widoczność.",
    ],
  },
  {
    wersja: "0.2.3", data: "19-10-2026", zmiany: [
      "GM: w karcie prowincji można dodać osadę (+ Miasto / + Wioska, potem klik w mapę w tej prowincji) i usunąć ją (×).",
      "Stolica: GM zaznacza ★ przy mieście — staje się stolicą właściciela prowincji (jedna na frakcję albo kraj NPC), dostaje nazwę z pola „Stolica” na karcie frakcji i ikonkę z koroną na mapie. Na karcie frakcji przycisk „na mapie” pokazuje stolicę. Podbita stolica traci ten status.",
      "Okienko „Co nowego” pokazuje zmiany ze wszystkich wersji, które ominąłeś od ostatniego uruchomienia — jedna pełna lista, najnowsze na górze.",
      "Mapa: osady mają ikonki pixel art — miasto w murach, wioska ze strzechą, stolica z koroną i sztandarem. Stolice widać już przy oddaleniu, miasta i wioski dopiero po przybliżeniu.",
      "GM: na karcie prowincji przy każdym sąsiedzie można zmienić typ granicy (zwykła / góry / rzeka) — zmiana widać po obu stronach.",
      "GM: mosty — na karcie prowincji „+ Most”, potem klik na rzece. Granica z mostem to „rzeka z mostem” (armia przejdzie), a most widać na mapie po przybliżeniu.",
      "Budynki i złoża: GM wybiera w każdym slocie prowincji (2 w mieście, 1 w wiosce) zasób, który budynek produkuje, oraz jedno złoże prowincji. Karta frakcji pokazuje, ile budynków i złóż daje każdy zasób w całym kraju i ile slotów jest pustych. Domyślnie jawne — GM może ukryć (Widoczność). Po podboju znikają tylko unikalne zasoby starej frakcji.",
      "Nowe fragmenty opisów frakcji dopisane przez twórców (np. Czarny Smok, Goblandia) pojawiają się same po zalogowaniu GM — bez ręcznego wklejania.",
    ],
  },
  {
    wersja: "0.2.2", data: "18-10-2026", zmiany: [
      "Granice prowincji na mapie rysuje teraz program, więc zawsze pokrywają się z prowincjami (wcześniej kreski z rysunku czasem przecinały jedną prowincję).",
      "Góry to teraz ziemia niczyja: pasma gór nie należą do żadnej prowincji i nie mają koloru, więc prowincje nie ciągną się już przez góry.",
      "Osady: każda prowincja ma miasto i dwie wioski, widoczne na mapie po przybliżeniu i na karcie prowincji. Nazwy osad są opcjonalne: GM może nazwać każdą osadę, a gracz — osady w prowincjach swojego państwa (pole przy osadzie na karcie prowincji).",
    ],
  },
  {
    wersja: "0.2.1", data: "18-10-2026", zmiany: [
      "Poprawka mapy: każdy obszar to osobna prowincja (wcześniej dwa obszary z tym samym numerem były jedną prowincją). Przypisania właścicieli, nazwy i opisy przeszły na obie części.",
    ],
  },
  {
    wersja: "0.2.0", data: "18-10-2026", zmiany: [
      "Nowy wygląd: po wejściu do gry widać mapę świata na cały ekran — przeciągnij, żeby przesunąć, kółkiem myszy (albo + i -) przybliżasz.",
      "Frakcje są teraz herbami w górnym pasku (Twoje państwo w ramce). Klik w herb albo „Panel GM” wysuwa panel z prawej; zamyka go ✕, Esc albo klik w mapę.",
      "Prowincje na mapie: najechanie podświetla prowincję, klik pokazuje jej sąsiadów i rodzaj granicy (zwykła, góry, rzeka). Klik w sąsiada przenosi do niego.",
      "Mapa jest ostra przy przybliżeniu — przy zbliżeniu dociągają się fragmenty w pełnej rozdzielczości.",
      "Właściciele prowincji: prowincje na mapie mają kolor frakcji, do której należą. GM ustawia właściciela, nazwę i opis w karcie prowincji (klik w mapę); wszyscy je widzą.",
      "Kraje NPC — wasale i marionetki frakcji: GM zakłada je w Panelu GM (nazwa, zwierzchnik, opis); na mapie mają kolor w odcieniu zwierzchnika.",
      "Nowy bohater Goblandii: Kapitan Gobjack, z portretem.",
      "Logi zmian (admin): zmiana roli lub państwa gracza też zostawia wpis „Konto: e-mail → rola, państwo”.",
    ],
  },
];
