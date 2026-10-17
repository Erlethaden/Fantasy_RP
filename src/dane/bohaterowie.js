// dane startowe bohaterów, przepisane z materialy/info/bohaterowie (u Dawi z plansz graczy)
// status: "stolica" | "misja" | "ranny" | "martwy"; misja: z armią / flotą / inne (opis w polu misja)
// opis: jak w frakcje.js — pusta linia = akapit, "- " = punkt listy
const b = (frakcja, imie, pola) => ({ id: frakcja + "-" + imie.toLowerCase().replace(/[^a-ząćęłńóśźż0-9]+/g, "-").replace(/^-|-$/g, ""),
  frakcja, imie, tytul: "", funkcja: "", wiek: "", bron: "", opis: "", status: "stolica", misja: "", wladca: false, ...pola });

export const BOHATEROWIE = [
  // Krag-Mhor
  b("krag-mhor", "Najwyższy Kowal Surtr", { wladca: true, tytul: "Najwyższy Kowal", funkcja: "władca Krag-Mhor, mistrz kowalstwa demonów",
    bron: "młot i pancerz własnej roboty, wzmocnione runami", opis: `Surtr nie odziedziczył swojej pozycji wyłącznie dzięki krwi ani tytułowi. W Krag-Mhor uważa się, że każdy, kto chce rozkazywać innym, musi najpierw udowodnić, że sam potrafi stanąć przy kowadle, wziąć młot do ręki i wejść na pole bitwy.

Jego pancerz został wykuty przez niego samego z metalu hartowanego w ogniu wulkanów, a następnie wzmocniony runami i energią demonicznych rdzeni. Surtr traktuje go jak narzędzie pracy, tak samo jak młot czy szczypce.

Jego wierzchowcem jest Smouldercraw, potężny Magmadroth, którego ciało przypomina żywą skałę rozgrzaną do czerwoności. Bestia zieje ogniem i stopioną magmą.

Surtr jest surowy, wymagający i bezlitosny wobec niekompetencji, lecz nie jest tyranem. Nawet najniżej urodzony kowal, górnik czy żołnierz może zwrócić na siebie jego uwagę, jeśli wykaże się niezwykłymi umiejętnościami. Dla Surtra lojalność ma znaczenie, ale kompetencja ma znaczenie większe.

„Jeżeli wróg jest silniejszy — wykuj lepszy pancerz. Jeżeli jest liczniejszy — zbuduj większe działo.”

„Teraz pokażmy im, dlaczego góry mają królów.”` }),
  b("krag-mhor", "Najwyższa Mówczyni Dagna", { tytul: "Prawa ręka Surtra", funkcja: "dowódczyni zakonu Płonącego Ostrza",
    bron: "młot runiczny; magmadroth Świetlisty Kłusownik", opis: `Najwyższa Mówczyni Dagna to nie tylko doradczyni, ale i strażniczka równowagi między mocą a wiarą. Utrzymuje ducha panteonu Dawi w sercach armii, przypominając Najwyższemu Kowalowi, że nawet on kroczy pod czujnym okiem bogów.

Prowadzi wojowników do walki, łącząc świętą magię z brutalną siłą. Jej obecność w polu bitwy podnosi morale.

Specjalizacja:
- walka w zwarciu,
- magia święta.

Jej magmadroth, Świetlisty Kłusownik, jest mniejszy od Smouldercrawa, ale równie groźny.

„Bogowie nie oczekują od nas pokory. Oczekują czynów.”` }),
  b("krag-mhor", "Kowal Serc Piekielnych Fyrgrim", { tytul: "Kowal Serc Piekielnych", funkcja: "specjalista od demonów i Serc Ognia",
    bron: "runiczny młot", opis: `Fyrgrim to najwyższy specjalista Dawi od demonów, demonicznych rdzeni i Serc Ognia. Jego wiedza pozwala Krag-Mhor wykorzystywać demoniczną energię do zasilania kuźni, machin i całego przemysłu. Niektórzy twierdzą, że rozmawia z demonami. On sam twierdzi, że to one rozmawiają z nim.

Specjalizacja:
- ujarzmianie demonów,
- demoniczne rdzenie i Serca Ognia,
- kuźnie i przemysł energetyczny,
- rytuały i technologia runiczna.

„Demon nie jest problemem. Demon to zasób. Trzeba go tylko odpowiednio obrobić.”` }),
  b("krag-mhor", "Mistrz Magmadrothów Drekki", { tytul: "Mistrz Magmadrothów", funkcja: "hodowla i szkolenie magmadrothów",
    bron: "młot bojowy", opis: `Drekki to doświadczony weteran, który od najmłodszych lat pracował z ognistymi bestiami. Zna ich zwyczaje, język, siłę i słabości lepiej niż ktokolwiek inny. Zajmuje się tresurą, hodowlą i wykorzystaniem magmadrothów w armii i ciężkim transporcie.

Dla Drekkiego magmadroth to nie tylko zwierzę. To partner.

„Nie ma dzikich bestii. Są tylko źle wykorzystane potencjały.”` }),
  b("krag-mhor", "Naczelna Inżynier Oblężnicza Bragga", { tytul: "Naczelna Inżynier Oblężnicza", funkcja: "dowódczyni machin wojennych",
    opis: `Bragga jest projektantką i dowódczynią największych machin wojennych Krag-Mhor. Nadzoruje działa, golemy, konstrukty oraz eksperymentalne urządzenia. Łączy geniusz techniczny z bezwzględnym podejściem do problemów i żelazną dyscypliną.

Najważniejsze projekty:
- magmowe działa zasilane demoniczną energią,
- golemy bojowe,
- eksperymentalne urządzenia, od latających platform po machiny oblężnicze nowej generacji.

„Nie ma murów, których nie da się zburzyć. Są tylko źle zaprojektowane machiny.”` }),
  b("krag-mhor", "Najwyższy Szaman Gotrek", { tytul: "Najwyższy Szaman", funkcja: "Mówca Żywiołów Ziemi i Ognia",
    bron: "runiczny młot żywiołów; drugi największy Magmadroth", opis: `Gotrek kieruje energią ziemi i ognia, wzmacnia swoje oddziały i budzi w Magmadrothach pierwotną moc ich żywiołowej natury. Jest nie tylko wojownikiem i kapłanem, ale też strażnikiem równowagi między Dawi a ich bogami.

Specjalizacja:
- magia żywiołów (ziemia i ogień),
- dowodzenie Magmadrothami,
- rytuały i duchowe wzmocnienie armii,
- ochrona świętych miejsc i relikwii.

„Ziemia daje nam siłę, ogień daje nam wolność. A ja daję im cel.”` }),

  // Aurelia
  b("aurelia", "Seranya „Niezłomne Światło”", { wladca: true, tytul: "Pierwsza Strażniczka Aurelii", funkcja: "władczyni Aurelii",
    wiek: "ponad 300 lat", bron: "Świetlista Buława i Tarcza Kryształowej Przystani", opis: `Seranya nie postrzega korony jako przywileju, lecz jako obowiązek wobec mieszkańców. Jej zadaniem jest zapewnienie bezpieczeństwa Aurelii, reprezentowanie jej poza granicami oraz dowodzenie siłami państwa w czasie wojny.

Jest spokojna, opanowana i cierpliwa. Częściej próbuje zakończyć konflikt rozmową niż sięgać po broń, lecz jej pokojowego nastawienia nie należy mylić z uległością. Jeżeli zagrożone jest życie mieszkańców, potrafi podejmować szybkie i bezwzględne decyzje.

Mocno wierzy w ideę Aurelii jako schronienia dla prześladowanych, ale wie, że państwo otwarte na innych może stać się łatwym celem. Nie zawsze zgadza się z Radą Starszych — szczególnie źle znosi wielogodzinne obrady tam, gdzie decyzję należało podjąć już dawno.` }),
  b("aurelia", "Aetharon „Błękitne Oko”", { tytul: "Starszy Wiedzy i Gospodarki", funkcja: "kryształy, kopalnie, handel i rzemiosło (kamień szafirowy)",
    opis: `Aetharon jest jednym z największych znawców kryształów w Aurelii. Nadzoruje państwowe kopalnie, przyznawanie praw do nowych wyrobisk oraz handel najcenniejszymi surowcami.

Jego konikiem są liczby, konkrety i planowanie. Nawet najbardziej wzniosłe pomysły potrafi sprowadzić do pytania: „Ile będzie nas to kosztować?”. Nie jest skąpy, ale uważa, że Aurelia może pomagać innym tylko tak długo, jak sama pozostaje stabilna.` }),
  b("aurelia", "Korvaar „Żelazna Przysięga”", { tytul: "Starszy Prawa", funkcja: "prawo, administracja i sprawy wewnętrzne (kamień bursztynowy)",
    opis: `Korvaar jest strażnikiem prawa Aurelii. Nadzoruje administrację, sądy oraz przestrzeganie praw przez wszystkich, od zwykłych mieszkańców po wysokich urzędników.

Spośród Starszych jest najbardziej surowy i przywiązany do zasad. Nie robi wyjątków ze względu na pozycję i potrafiłby zakwestionować decyzję Seranyi, gdyby przekroczyła swoje uprawnienia. Właśnie dlatego Seranya go szanuje: jego zadaniem jest powiedzieć władczyni „nie”, kiedy pozostali boją się to zrobić.` }),
  b("aurelia", "Naelira „Biały Płomień”", { tytul: "Starsza Światła", funkcja: "religia, uzdrawianie i sanktuaria (kamień biały)",
    opis: `Naelira jest najwyższą przedstawicielką Anachoretów w Radzie. Opiekuje się świątyniami, uzdrowicielami oraz miejscami schronienia dla potrzebujących.

Najczęściej przypomina pozostałym, dlaczego Aurelia w ogóle powstała. Dla niej bogactwo, armia i kryształy są jedynie narzędziami. Jest łagodna i niezwykle cierpliwa, ale w sprawach wiary i traktowania mieszkańców potrafi być nieustępliwa. Seranya darzy ją dużym zaufaniem.` }),
  b("aurelia", "Theryn „Strażnik Korzeni”", { tytul: "Starszy Ziemi", funkcja: "rolnictwo, lasy, osady i zasoby naturalne (kamień szmaragdowy)",
    opis: `Theryn reprezentuje tę część Aurelii, która znajduje się daleko od monumentalnych sal Elyndoru. Odpowiada za pola, lasy, hodowlę i mniejsze osady — to dzięki niemu wycinka lasów podlega kontroli.

Jest najmniej ceremonialnym członkiem Rady. Uważa, że największym błędem byłoby uzależnienie całego państwa od kryształów, dlatego naciska na rozwój rolnictwa i zapasy żywności.

„Kryształem nie nakarmisz miasta.”` }),
  b("aurelia", "Velassara „Dalekowidząca”", { tytul: "Starsza Głosu", funkcja: "dyplomacja i stosunki zagraniczne (kamień ametystowy)",
    opis: `Velassara odpowiada za kontakty z innymi państwami, negocjacje, traktaty oraz bezpieczeństwo szlaków handlowych.

Jest niezwykle uprzejma, ale trudno odgadnąć, co naprawdę myśli. Zanim poprze umowę, chce wiedzieć, dlaczego druga strona tak bardzo chce ją zawrzeć. Najczęściej studzi idealistyczne pomysły Seranyi. Jej ametystowy kamień uchodzi za najbardziej nieprzewidywalny spośród pięciu.` }),

  // Goblandia
  b("goblandia", "Gobloni", { wladca: true, funkcja: "władca Goblandii", opis: `Władca kraju, miły i uprzejmy. Nie lubi niewolnictwa.` }),
  b("goblandia", "What, Deez i Nuts", { funkcja: "bracia, najwybitniejsi sprzedawcy Goblandii",
    opis: `Trzej bracia i najwybitniejsi sprzedawcy: What sprzedaje klejnoty, Deez sztukę, a Nuts jedzenie.` }),

  // Rogus Ardens
  b("rogus-ardens", "Elmon Devil", { wladca: true, tytul: "Cesarz Kreegan", funkcja: "władca Rogus Ardens, ostatni fizyczny syn Ras-Al-Ghula",
    opis: `Elmon Devil jest ostatnim fizycznym synem Ras-Al-Ghula. Jako pierwszy władca od dawien dawna nie pragnie nigdy niezaspokojonego rozlewu krwi — ponad to ceni rozwój swojego ludu. Rządzi wraz ze swoimi 7 synami.

Sprowokowany potrafi jednak przekuć swoją nienawiść w prawdziwy piekielny ogień.` }),
  b("rogus-ardens", "Vaelgor", { tytul: "Pierwszy z Płomieni, Imperator Kreegan, Ten Który Patrzy z Góry", funkcja: "najstarszy syn Elmona Devila, następca tronu",
    wiek: "około 700 lat", bron: "Arogancja — pradawny miecz z czarnego metalu", opis: `Vaelgor jest jednym z najpotężniejszych przedstawicieli Kreegan. Ma niemal czarną, zwęgloną skórę z czerwonymi i pomarańczowymi pęknięciami, jakby pod nią płynęła lawa. Wzrost: około 2,7 m. Dwa ogromne rogi zakrzywiają się ku górze, a oczy bez źrenic są czystym, białym ogniem. Na piersi ma wypalony symbol: siedem płomieni otaczających jedno oko.

„Siedem światów może patrzeć na mnie. Ja potrzebuję tylko jednego spojrzenia, aby osądzić je wszystkie.”

Nie rywalizuje i nie udowadnia swojej wartości — sama możliwość, że ktoś może być mu równy, jest dla niego absurdem. Rzadko osobiście bierze udział w bitwie, bo walka z większością przeciwników jest dla niego poniżająco łatwa. A jeśli jego generałowie przegrywają, mówi tylko: „Zejdźcie mi z oczu.” — i sam schodzi na pole bitwy.

Arogancja tnie nie tylko ciało, ale i magię: zaklęcia rozpadają się na iskry, tarcze magiczne pękają. Im silniejszy przeciwnik, tym potężniejsze staje się ostrze.

Ma ogromne demoniczne skrzydła z czarnego, niemal metalicznego szkieletu i płonącej błony. Jego bestią jest Azrakh, „Ten, Który Pożera Niebo” — pradawny demon wojenny o sześciu kończynach i rozpiętości skrzydeł około 24 metrów.` }),
  b("rogus-ardens", "Lucjan the Monteville", { tytul: "Najwyższy kapłan Ras-Al-Ghula", funkcja: "przewodnik po Rogus Ardens",
    opis: `Wychudzona postać w czerwonej szacie ze złotymi zdobieniami. Oprowadza przybyszów po Rogus Ardens i obala kłamstwa krążące o jego narodzie — zwykle zanim rozmówca zdąży zadać pytanie.` }),

  // Królestwo Czarnego Smoka
  b("czarny-smok", "Shire, Czarny Smok", { wladca: true, funkcja: "władca Prowincji Czarnolasu", opis: `Starożytny czarny smok, który niepodzielnie rządzi Prowincją Czarnolasu. Rzadko opuszcza swoje komnaty w sercu góry. Kiedy jednak rozkłada skrzydła nad lasem, niebo ciemnieje, a z jego paszczy spływa czarny, trujący dym.` }),
  b("czarny-smok", "Kain i Anna", { tytul: "Rodzeństwo", funkcja: "mroczny rycerz i widmo skrytobójczyni",
    opis: `Rodzeństwo, które od urodzenia żyło razem. Opuścili rodzinną wieś, by żyć w królestwie rycerzy i paladynów; walczyli, przetrwali, kradli i pomagali, aż zostali rycerzem i skrytobójczynią.

Podczas obrony punktu zbornego zostali porzuceni przez oficera i resztę oddziału. Bronili siebie nawzajem — Kain dostał włócznią, Anna walczyła jak oszalała, aż oboje padli. Wtedy przyleciał smok, czarny jak koszmar. Zaoferował im ofertę nie do odrzucenia: życie za bycie jego bohaterami. Kain stał się mrocznym rycerzem, a Anna widmem skrytobójczyni przemierzającym świat żywych i martwych.` }),
  b("czarny-smok", "Linnr", { funkcja: "uwolniony więzień", opis: `Istota stworzona z nienawiści do ludzkości milion lat temu. Uśpiona, pozostała w swoim więzieniu na wieczność, dopóki smok jej nie uwolnił. Walczy u jego boku; poza ogromnym rozmiarem wykazuje potężną siłę, lecz jest chaotyczna i trzeba jej pilnować.` }),
  b("czarny-smok", "Pan Aretnuag O Mmid", { funkcja: "nieznajomy wędrowiec", opis: `Jest nigdzie, lecz wszędzie. Nie przeszkadza, lecz obserwuje, widzi i podziwia.

Nieznajomy, który podróżuje po świecie — po co, nikt nie wie. Zawsze jest tam, gdzie nie powinien, u wrogów czy sojuszników, a jego twarz się zmienia. Kiedy ktoś błaga o pomoc, nie mając grosza przy duszy, albo żołnierz krwawi pod koroną drzew, on podaruje mu kontrakt, dzięki któremu znów stanie na nogi i poczuje, że żyje... na jak długo?` }),
  b("czarny-smok", "Koszmarne Widma", { funkcja: "zespół koszmarnych elfów", opis: `- Veythar „Krwawy Riff” — blady elf z czerwonymi runami na skórze, grający na gitarze z kości.
- Sylvara „Echo Pustki” — elfka z pękniętą porcelanową twarzą i fioletowym dymem.
- Draven „Czarny Akord” — szkieletowy elf z koroną cierniową, grający na perkusji z czaszek.` }),
  b("czarny-smok", "Baba Jaga", { opis: "" }),
  b("czarny-smok", "Czarownik z krainy IRS", { opis: "" }),

  // Królestwo Szarych Kłów
  b("gor-khar", "Król Drogath „Najdłuższy Kieł”", { wladca: true, tytul: "Najdłuższy Kieł, Król Królestwa Szarych Kłów",
    funkcja: "najwyższy władca wszystkich orków i jaszczuroludzi (szary ork, kły 43 cm)", wiek: "61 lat", bron: "dwuręczny topór Gromowładca",
    opis: `Drogath jest potężnym, starszym orkiem o ciemnoszarej skórze, z długimi czarnymi włosami przeplatanymi srebrnymi warkoczami i twarzą pokrytą bliznami. Jego kły mają 43 centymetry — podczas walki nosi na nich metalowe osłony. Zamiast korony ma żelazny pierścień na czole z symbolami wszystkich wielkich orkowych rodów.

Nie jest najlepszym wojownikiem. Gorzak prawdopodobnie pokonałby go w pojedynku, Razhka jest szybsza, a Krazh lepiej prowadzi wojnę rzeczną. Ale Drogath ma coś, czego nie posiada żaden z nich: autorytet. To on potrafi powiedzieć: „Gorzak, wystarczy.” — i Gorzak odkłada broń.

Królewska bestia Ghar-Mor, „Pożeracz Gór”, to pradawny duch wojny orkowego ludu: około 5 metrów w kłębie, połączenie niedźwiedzia, nosorożca i gada, o kamiennej skórze i czterech rogach. Przyzywa się go Krwawym Kamieniem słowami „Krew pamięta. Ziemia odpowiada.”, ale Ghar-Mor sam decyduje, czy uznaje króla. W bitwie przebija szeregi, przewraca machiny, rozbija mury i zakopuje się pod ziemią.

„Kiedy smok milknie, Ghar-Mor przemówił.”` }),
  b("gor-khar", "Gorzak „Krwawy Kieł”", { tytul: "Pierwszy Smoczy Jeździec, Władca Popiołu", funkcja: "smoczy jeździec (szary ork, kły 34 cm)",
    wiek: "około 67 lat", bron: "smok Najrudin, czerwony smok lawy", opis: `Gorzak jest jednym z najdłużej żyjących Smoczych Jeźdźców; jego imię stało się niemal synonimem zwycięstwa. Pod Czarną Przełęczą poprowadził siedem tysięcy orków przeciw armii ponad dwukrotnie większej. Według legendy przez trzy godziny nie dotknął ziemi, a do końca bitwy wroga armia przestała istnieć.

Jest spokojny. Nie krzyczy, nie grozi. Nie musi. Wierzy w trzy rzeczy: krew daje prawo, siła daje władzę, czyn daje legendę. Zdrajcom najpierw odbiera broń, potem tytuł, a na końcu każe spiłować im kły — dla orków to gorsze od śmierci.

Najrudin nie jest jego sługą; obaj traktują się jak równi. „Nie dosiadam Najrudina, lecimy razem.”` }),
  b("gor-khar", "Razhka", { tytul: "Smocza Wiedźma, Głos Burzy", funkcja: "smocza jeźdźczyni (brązowy ork, kły 7 cm)",
    wiek: "31 lat", bron: "smok Ssarakh, czarny smok burzowy", opis: `Razhka urodziła się wśród zwykłych brązowych orków. Jej kły są krótkie — według zasad powinna być nikim. Gdy miała 16 lat, znalazła młodego smoka i walczyła z nim przez 2 dni, aż oboje padli z wyczerpania. Smok obudził się z trzema rybami przy pysku i bez śladu po orczycy. Rok później wrócił i pozwolił jej wejść na swój grzbiet.

Jest arogancka, pyskata, impulsywna, niezwykle inteligentna i kompletnie pozbawiona szacunku do arystokracji. „Moje kły są krótkie. Mój smok nie narzeka.”

Ssarakh jest mniejszy od Najrudina, ale znacznie szybszy, a jego oddech to potężna wiązka elektryczna. Razhka używa go do błyskawicznych ataków, polowania na dowódców, niszczenia machin i nocnych rajdów.` }),
  b("gor-khar", "Krazh „Trzy Łuski”", { tytul: "Strażnik Czarnej Rzeki", funkcja: "najwyższy dowódca jaszczuroludzkich wojowników",
    wiek: "około 50 lat", bron: "zakrzywiona włócznia „Żmijowy Ząb” i tarcza z pancerza pradawnego gada", opis: `Krazh jest jednym z niewielu jaszczuroludzi, którzy mogą wejść do Sali Wielkich Kłów bez wezwania — nie dzięki urodzeniu, tylko dlatego, że trzy razy uratował królestwo. Ma ciemnobrązowe łuski z czerwienią na pysku i karku, jedno oko złote, drugie mlecznobiałe. Na szyi nosi trzy metalowe pierścienie, po jednym za każde wielkie zwycięstwo.

Gdy wróg zaatakował od strony rzeki, Krazh z 300 jaszczuroludźmi przeciw ponad 3000 żołnierzy otworzył stare tamy i zatopił dolinę. „Jeżeli Krazh stoi nad rzeką, rzeka należy do niego.”

Szanuje króla, ale nie znosi pogardy wobec jaszczuroludzi. „Twoje kły mówią, że jesteś szlachcicem. Twoje zachowanie mówi, że jesteś dzieckiem.”` }),
  b("gor-khar", "Murog „Głos Popiołu”", { tytul: "Wielki Szaman Królestwa", funkcja: "doradca króla, strażnik rytuałów i duchów przodków",
    wiek: "73 lata", bron: "kostur z kości pradawnego smoka; smok cienia Nharak", opis: `Bardzo stary, ale wciąż potężnie zbudowany ork z niemal białymi włosami, pożółkłymi kłami i czarnymi rytualnymi tatuażami. Jego oczy są mlecznobiałe — przestał widzieć świat ponad trzydzieści lat temu, ale od tamtej pory widzi duchy.

Nie rzuca zaklęć jak czarodziej; rozmawia ze zmarłymi. Duch przodka może walczyć u jego boku, ostrzec, przekazać wiedzę, opętać wroga albo wzmocnić orków. Jego najpotężniejsza moc, Gniew Przodków, na kilka minut wypełnia pole bitwy setkami duchów poległych obrońców królestwa.

Jest jednym z niewielu, którzy mogą otwarcie sprzeciwić się królowi. Twierdzi, że Ghar-Mor może kiedyś zostać przyzwany przez kogoś innego niż Najdłuższy Kieł — to jedna z niewielu rzeczy, których Drogath naprawdę się obawia.

Nharak, Smok Cienia, nie ma oddechu: pochłania dusze poległych, a potem może je uwolnić jako armię cieni. Murog nie dosiada go — Nharak pozwala mu siedzieć na swoim grzbiecie.` }),
  b("gor-khar", "Urgash „Krzykacz”", { tytul: "Pierwszy Berserker", funkcja: "berserker (brązowy ork, kły 16 cm)",
    wiek: "36 lat", bron: "dwa ogromne topory bojowe; pancerz prawie żaden", opis: `Urgash jest przerażający nie dlatego, że jest największy, tylko dlatego, że nie wiadomo, czy podczas bitwy jeszcze pamięta, po której stronie walczy.

Szał Krwi: im bardziej jest ranny, tym groźniejszy.
- 25% utraconego zdrowia — zadaje większe obrażenia.
- 50% — pobliscy orkowie dostają premię do walki.
- 75% — orkowie ignorują ból i strach.
- 90% — wpada w Czerwony Szał: nie da się go zmusić do odwrotu, a każdy zabity wróg może przenieść szał na kolejnego orka.

Kiedyś samotnie walczył w przełęczy przez całą noc przeciw około 200 wojownikom. O świcie leżało 143 martwych, 31 rannych, a 26 uciekało. Zapytany, dlaczego nie uciekł, odpowiedział: „Bo oni byli przede mną.”

„URGASH!” — „KREW!”` }),

  // Grobowe Imperium
  b("grobowe-imperium", "Tarael Illitris", { wladca: true, tytul: "Ei L’Norah, ojciec zmarłych", funkcja: "bóg-król, pierwszy nekromanta i licz świata",
    bron: "glewia i potężna magia", opis: `Z zamiłowania bimbrownik.

Pierwszy nekromanta oraz licz świata, wyznawany jako bóg religii państwowej swojego imperium. Niezwykle potężny mag, a mimo to potrafi nieźle walczyć wręcz, zwłaszcza glewią.

Niegdyś elficki książę, który nie mogąc używać magii, stworzył tatuaże zmuszające ją do posłuszeństwa. Jego ciało zaczęło jednak niedomagać, więc zaczął eksperymentować z mocami śmierci. Stworzył rytuał, który zamienił jego i najbliższych popleczników w nową rasę — nieumarłych. Uznano to za zdradę kraju i samej magii. Po wielu walkach ukrył się pod ziemią, gdzie jego lud rozwijał się w ciszy, aż imperium elfów się rozpadło.

Raz na jakiś czas zapada w sen, podczas którego wydaje rozkazy telepatycznie i przez sny, a najbliżsi poplecznicy przekazują jego wolę.` }),
  b("grobowe-imperium", "Bob", { tytul: "Nadworny nekromanta", funkcja: "ghul, nauczyciel nekromantów, lewa ręka władcy",
    opis: `Jedyny ghul z oficjalnym tytułem w państwie i najwybitniejszy nekromanta (poza władcą). Szkoli nowych nekromantów; potrafi kontrolować nawet tysiące nieumarłych naraz.

Prywatnie sarkastyczny śmieszek, ale potrafi być poważny, gdy sytuacja tego wymaga.` }),
  b("grobowe-imperium", "Merrla Nurhendhar", { funkcja: "zjawa, uczennica Taraela, prawa ręka władcy", bron: "magia grawitacji",
    opis: `Jedna z trojga uczniów samego Taraela. Specjalizuje się w magii grawitacji — idealny wybór, bo jako zjawie ciężko jej zaszkodzić. Zazwyczaj niezwykle leniwa i niechętna do jakichkolwiek akcji, ale koniec końców wrogom można tylko współczuć, kiedy leci na nich meteoryt.` }),
  b("grobowe-imperium", "Henzix", { funkcja: "żywa zbroja; biurokracja, technologia i produkcja golemów",
    opis: `Żywa Zbroja, która paradoksalnie nie zajmuje się walką, tylko biurokracją, papierologią, rozwojem technologicznym i produkcją golemów. Jest niesamowicie poważny i nigdy nie żartuje. Od czasu do czasu trenuje z elitami: dullahanami, strażnikami sanktuarium i paladynami.` }),
  b("grobowe-imperium", "Generał Karevra Morcant", { tytul: "Marszałek", funkcja: "dullahan, dowódczyni armii",
    opis: `Z reguły wydaje się niezwykle roztrzepana, ale w taktyce i strategii mało kto jest w stanie jej dorównać. Pomyśleć, że pierwotnie była zwykłą służką na dworze, gdy Tarael był jeszcze zwykłym elfem.` }),
  b("grobowe-imperium", "Morthalass", { tytul: "Pierwszy Admirał Głębin", funkcja: "dowódca floty i okręt flagowy imperium",
    opis: `Naczelny dowódca floty, a zarazem okręt flagowy imperium. Pomimo swojego stanu jest nadzwyczaj inteligentny i porozumiewa się telepatycznie. Jego jedyne problemy to powolność i brak oczu — widzi tylko to, co telepatycznie przekażą mu inne „okręty”.` }),
];
