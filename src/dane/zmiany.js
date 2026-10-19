// „Co nowego” po aktualizacji: najnowsza wersja na górze; przed każdym wydaniem dopisz wpis z numerem z package.json (INSTRUKCJA-WYDANIE.md)
export const ZMIANY = [
  {
    wersja: "0.4.0", data: "", zmiany: [
    ],
  },
  {
    wersja: "0.3.3", data: "20-10-2026", zmiany: [
      "Bloki sojuszy i organizacje: nowy przycisk „Bloki” w górnym pasku — lista sojuszy, lig, zakonów i unii z członkami, zaproszonymi, statutem i znakiem (tarcza w kolorze bloku ze skrótem). GM zakłada blok, zmienia skład, rodzaj, kolor, wspólne traktaty i sposób decydowania (głosowanie albo lider) oraz rozwiązuje blok. Blok może być tajny. Bloki frakcji widać na jej karcie, a powstanie, zmiany składu i rozwiązanie trafiają do kroniki.",
      "Bloki — gracze: każdy gracz może założyć blok i zaprosić inne kraje; zaproszony klika „Dołącz” albo „Odrzuć”, członek może wyjść. Członkowie decydują wnioskami: zaproszenie, wykluczenie, zmiana nazwy, statutu i wspólnych traktatów, wybór lidera albo rozwiązanie — wniosek przechodzi, gdy „za” jest więcej niż połowa członków (za kraje NPC głosuje GM). Gdy blok ma lidera, lider zmienia go sam, a pozostali mogą przegłosować powrót do głosowania.",
      "Wspólne traktaty bloku działają: zaznaczony handel rysuje szlaki handlowe między wszystkimi członkami, a sojusz, pakt i prawo przejścia — linie na warstwie „Sojusze”. Na karcie frakcji są w Traktatach ze znakiem 🏛; zmienia się je w bloku (nie zrywa osobno). Traktaty tajnego bloku widzą tylko jego członkowie.",
      "Bloki na mapie: nowy przycisk warstwy „🏛 Bloki” obok Szlaków i Sojuszy — ziemie członków każdego bloku otacza poświata w kolorze bloku. Przycisk „Pokaż na mapie” przy bloku w szufladzie pokazuje tylko ten blok (także przy wyłączonej warstwie) i przesuwa mapę do jego ziem; „Ukryj na mapie” wyłącza.",
      "Wojna a bloki: gdy GM wypowiada wojnę członkowi bloku z sojuszem albo paktem, program proponuje jednym kliknięciem wojnę z całym blokiem (wszystkie wojny trafiają do kroniki). Wojna między członkami tego samego takiego bloku wymaga potwierdzenia.",
      "Przeprawa przez morze: gdy armia ma cel na innym lądzie (wyspa, drugi kontynent), karta armii pokazuje trasę przez morze — gdzie załaduje się na okręty, gdzie zejdzie na ląd i za ile tur dotrze. GM zaznacza floty do przeprawy, a program pilnuje, czy armia się na nich mieści. Trasa ląd–morze–ląd jest widoczna na mapie.",
      "Przeprawa w ruchu: przy „Zamknij turę” wybrane floty same płyną do miejsca załadunku, armia wchodzi na pokład, gdy floty są na miejscu i armia się mieści, płynie z nimi 1 akwen na turę i schodzi na ląd przy celu. Armii na pokładzie nie widać na mapie — jest jako ładunek na karcie floty. GM może od razu postawić floty w miejscu załadunku („Floty od razu do załadunku”), a „Przestaw” zdejmuje armię z pokładu. Cofnięcie tury cofa też przeprawę.",
      "Bitwy morskie: floty krajów w wojnie, które spotkają się w jednym akwenie albo miną, stają do bitwy przy „Zamknij turę” (znak bitwy na morzu, wpis w kronice). Armie na pokładzie walczą razem ze swoją flotą. Floty w bitwie stoją, aż GM wpisze wynik.",
      "Ekran bitwy morskiej: floty z okrętami i armie na pokładzie obu stron, siły liczone w okrętach. GM wybiera los floty — odwrót o 1 akwen w stronę własnego wybrzeża, zostaje, zatopiona albo poddana (okrętów nikt nie przejmuje) — oraz los armii na pokładzie: dzieli los floty albo zostaje wysadzona na wybrany brzeg. Bohater może też zostać „uratowany” i wrócić do stolicy.",
    ],
  },
  {
    wersja: "0.3.2", data: "20-10-2026", zmiany: [
      "Trasy na mapie wyglądają naturalniej: trasa floty płynie po wodzie (omija lądy i trzyma się z dala od brzegu), a trasy armii i szlaki handlowe biegną łagodnymi łukami zamiast ostrych, prostych kresek.",
      "Ruch flot: „Wyznacz cel” na karcie floty i klik w akwen — flota płynie po sąsiednich akwenach 1 akwen na turę przy „Zamknij turę”, na mapie widać jej trasę i „za N tur”. Cofnięcie tury cofa też ruch flot. Na jeziora i rzekami flota płynie tylko z umiejętnością „żegluga śródlądowa” — bez niej karta pokazuje „brak drogi”. Gracz może zaproponować GM cel swojej floty („Zaproponuj cel”).",
      "Szlaki handlowe biegnące w podobnym kierunku łączą się na mapie we wspólny szlak i rozgałęziają dopiero bliżej celów (wspólny odcinek rysowany raz).",
      "Skutki bitwy: kończąc bitwę GM wybiera los każdej armii — domyślnie przegrana cofa się o 1 prowincję w stronę własnych ziem (traci cel), a zwycięzca idzie dalej; można też zostawić ją na miejscu, rozbić albo poddać (bohaterowie trafiają do niewoli zwycięzcy).",
      "Bohaterowie w bitwie: ranny, poległ albo w niewoli. Bohater w niewoli ma status „W niewoli (u: …)”, nie może dowodzić — GM uwalnia go zmianą statusu. Zaznaczenie „zwycięzca zdobywa prowincję” przejmuje prowincję jak przy podboju. Skutki widać na ekranie zakończonej bitwy i w kronice.",
      "Floty: GM zakłada flotę na karcie frakcji (staje w akwenie przy stolicy albo przy nadmorskiej prowincji), ustawia dowódcę, bohaterów i okręty z liczbą. Pojemność liczy się z okrętów, a GM może wpisać własną. „Przestaw” i klik w morze przenosi flotę; „Rozwiąż flotę” ją usuwa (floty nie znikają same jak małe armie).",
      "Floty są na mapie: okręt z żaglem w kolorze kraju (po przybliżeniu). Skład floty jest tajny jak skład armii — przełącznik widoczności „Armie i floty”. Bohater we flocie ma status „na misji (z flotą)”.",
      "Jednostki frakcji: GM może zaznaczyć jednostkę jako okręt i wpisać, ilu żołnierzy mieści jeden okręt. Okręty są w osobnej grupie „Okręty” i nie da się ich dodać do armii — trafią do flot.",
      "Wyszukiwarka w lewym górnym rogu mapy: wpisz numer albo nazwę prowincji, właściciela, nazwę osady albo akwenu — Enter (albo wybór z podpowiedzi) przybliża mapę i otwiera kartę.",
      "Jeziora (16 akwenów) i rzeki łączące akweny: na karcie akwenu widać „jezioro” i sąsiadów „przez rzekę”. Nowa umiejętność frakcji „floty na jeziorach i rzekach (żegluga śródlądowa)” — bez niej floty nie wpłyną na jeziora ani rzeki (GM zaznacza ją przy umiejętnościach ruchu).",
      "Morza i oceany podzielone na 120 akwenów (także morza śródlądowe). Kliknięcie w morze otwiera kartę akwenu: sąsiednie akweny i nadmorskie prowincje; GM nadaje akwenom nazwy. Po przybliżeniu widać granice akwenów jasną kropkowaną linią. To przygotowanie pod floty.",
      "Przy herbie państwa w górnym pasku zielona kropka oznacza, że jego gracz jest teraz w programie; po najechaniu widać też, kiedy był ostatnio.",
      "Na ekranie logowania jest przycisk „Co nowego” — pokazuje jeszcze raz pełną listę zmian ze wszystkich wersji.",
    ],
  },
  {
    wersja: "0.3.1", data: "19-10-2026", zmiany: [
      "Gracz może zaproponować GM przeniesienie stolicy: ★ przy mieście na karcie swojej prowincji. GM akceptuje albo odrzuca w Panelu GM → Propozycje.",
      "Kraje NPC: nowy rodzaj „samodzielny” — kraj bez zwierzchnika z własnym kolorem na mapie (GM wybiera go w Panelu GM → Kraje NPC). Może mieć prowincje, zawierać traktaty i prowadzić wojny jak wasale i marionetki.",
      "Mapa: po oddaleniu w środku kraju każdego gracza pojawia się jego herb (wielkość według rozmiaru kraju), więc od razu widać, kto gdzie rządzi. Przy przybliżaniu herb blednie i znika, żeby nie zasłaniał stolic, miast i armii.",
      "Mapa: rzeki dochodzą do morza (wcześniej urywały się za ostatnim mostem, np. przy D197, D114, 44a, 163a, D299, 167a, D208), a w ich korytach nie wyrastają już góry. Szczyty nie wchodzą na rzeki płynące przy pasmach gór (np. 167b, D110, D35).",
      "Poprawki mapy: prowincja 63b leży teraz tam, gdzie na rysunku (obok 64b, napis „WEGA 63”) — wcześniej jej pole należało do 64b, a 63b miała kawałek pod górami, który wrócił do 57b. Płat z napisem 53 przeszedł z 50b do 53a.",
      "Gracz może zaproponować traktat: „Zaproponuj traktat” w sekcji Traktaty na karcie swojego państwa (nazwa, typ, strony, warunki, tajny). Inni gracze-strony widzą go na swojej karcie w „Traktaty do Twojej zgody” i klikają „Zgadzam się” albo „Nie zgadzam się”; potem decyduje GM (za kraje NPC też on). Przy swoim traktacie ✂ proponuje GM zerwanie.",
      "Przyjęta propozycja od razu wchodzi w życie i znika z listy (nie zaśmieca bazy). Odrzucona zostaje 7 dni, żeby gracz zobaczył komentarz GM.",
      "Gracz może zaproponować cel swojej armii: „Zaproponuj cel” na karcie armii i klik na mapie (prowincja, osada albo sztandar armii do pościgu). Do decyzji GM trasa jest blada z napisem „czeka na GM”, a po akceptacji staje się zwykłym celem armii.",
      "Gracz może zaproponować budynki i złoże w swojej prowincji: wybiera zasoby na karcie prowincji i klika „Wyślij propozycję do GM”. GM widzi zmianę przed → po i akceptuje albo odrzuca.",
      "Budynki i złoża nie mogą już produkować populacji — do wyboru są Broń, Żywność, Drewno, Budulec, Metal, Złoto, Kamienie szlachetne i zasoby własne frakcji.",
    ],
  },
  {
    wersja: "0.3.0", data: "19-10-2026", zmiany: [
      "Kronika: przycisk „Kronika” w górnym pasku — zdarzenia każdej tury (bitwy i ich wyniki, wojny, pokoje, traktaty, zmiany właścicieli prowincji) i wpisy GM. Tajne rzeczy widzą tylko zainteresowani. Czerwona kropka oznacza nowe wpisy, a „Kopiuj na Discorda” daje gotowy tekst jawnej części tury. Na karcie frakcji są jej ostatnie zdarzenia.",
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
