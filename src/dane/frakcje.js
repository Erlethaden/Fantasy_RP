// dane startowe 7 frakcji, przepisane z materialy/info/frakcje (bez rozmów z Discorda)
// zasoby: unikalne zasoby frakcji { nazwa, opis } — dopisuje i usuwa GM
// opis: sekcje { tytul, tekst }; w tekście pusta linia = nowy akapit, linia od "- " = punkt listy
export const FRAKCJE = [
  {
    id: "krag-mhor", nazwa: "Krag-Mhor", rasa: "Dawi", kolor: "#c8501e",
    stolica: "Kraka Drak", ustroj: "Kowalska oligarchia przemysłowa", wladca: "Najwyższy Kowal Surtr",
    godlo: "Młot i Kowadło w Symbolu Góry", motto: "Po co palić węglem, skoro można palić czymś, co krzyczy? — Najwyższy Kowal Surtr",
    tereny: "Góry, wulkany, podziemne twierdze",
    specjalizacja: "Kowalstwo, przemysł wojenny, machiny oblężnicze, handel bronią, zatrudnianie",
    zasoby: [{ nazwa: "Demoniczne rdzenie", opis: "Energia demonów zasila kuźnie, działa, windy, kopalnie i machiny." }],
    opis: [
      { tytul: "Lud Kowadła i Ognia", tekst: `Dawi z Krag-Mhor nie uznają pojęcia „niemożliwe”.

- Jeżeli skała jest zbyt twarda — należy ją rozbić.
- Jeżeli góra jest zbyt wysoka — należy ją wydrążyć.
- Jeżeli wulkan chce wybuchnąć — należy go powstrzymać magią.
- A jeżeli demon próbuje wedrzeć się do naszego świata... należy go skuć łańcuchami i podłączyć do generatora.

Dawi są wojownikami i kowalami od pokoleń. Ich miasta wyrastają z wnętrz gór, ich fortece stoją nad jeziorami lawy, a podziemne hale produkcyjne nigdy nie zasypiają. Każdy młody Dawi od najmłodszych lat poznaje tajniki metalu, mechaniki i walki.

Jednak prawdziwy przełom nastąpił, gdy odkryto istnienie demonów z wymiarów graniczących ze światem śmiertelników. Inne ludy zobaczyły w nich zagrożenie. Dawi zobaczyli źródło energii. Tak narodził się zawód Kowala Demonów.` },
      { tytul: "Kowale Demonów", tekst: `Dawi szybko odkryli, że demoniczna energia doskonale nadaje się do zasilania ich machin. Po co spalać tony węgla, skoro można wykorzystać niemal niewyczerpane źródło energii? Po co budować ogromne piece, skoro można przykuć demona do rdzenia maszyny?

Krag-Mhor rozwinęło przemysł na niespotykaną skalę. Demoniczne rdzenie napędzają kuźnie, działa, windy, kopalnie, machiny oblężnicze, a nawet całe dzielnice przemysłowe.

Ich inżynierowie nazywają to „ekologiczną optymalizacją energetyczną”. Elfy nazywają to barbarzyństwem. Dawi nazywają elfy „nożouchymi hipokrytami, którzy za dużo gadają”.` },
      { tytul: "Gospodarka", tekst: `Krag-Mhor nie walczy wyłącznie po to, by podbijać. Krag-Mhor walczy, ponieważ wojna jest dochodowa.

Ich kuźnie produkują broń, pancerze, działa, amunicję oraz machiny wojenne. Każdy konflikt w sąsiednich krainach jest dla Dawi okazją do zawarcia nowego kontraktu. Nie potrzebujesz własnej armii oblężniczej? Wynajmij ją. Potrzebujesz trzydziestu dział? Zapłać z góry. Twoje miasto wymaga pilnej obrony? Krag-Mhor ma ofertę specjalnie dla ciebie.

A jeśli po zakończeniu wojny nadal nie stać cię na zapłatę... Cóż. Zawsze można sprzedać ci broń na kredyt.

Krag-Mhor jest jednym z największych eksporterów uzbrojenia w znanym świecie, a jego bankierzy doskonale wiedzą, że najlepszym zabezpieczeniem pożyczki jest armia stojąca za drzwiami dłużnika.` },
      { tytul: "„Siła robocza”", tekst: `Dawi wierzą, że każdy zasób powinien zostać odpowiednio wykorzystany. Dotyczy to również pokonanych przeciwników.

Gobliny, Orki i Ogry stanowią główne źródło zatrudnionej siły roboczej Krag-Mhor. Pracują w kopalniach, kamieniołomach, hutach i przy budowie fortec. Dla Dawi jest to po prostu kolejny element gospodarki. Dla pracowników... cóż, ich zdanie nie zostało uwzględnione w budżecie.` },
      { tytul: "Kraka Drak", tekst: `Stolica Krag-Mhor jest czymś pomiędzy twierdzą, miastem przemysłowym i gigantyczną kuźnią. Kraka Drak wykuto bezpośrednio w masywie górskim. Setki tuneli prowadzą do kopalń, hal produkcyjnych i podziemnych magazynów. Nad miastem górują ogromne kominy, wieże działowe oraz monumentalne piece.

W najgłębszych komnatach znajdują się Serca Ognia — demoniczne reaktory dostarczające energii całej stolicy. Niektórzy twierdzą, że nocą słychać dochodzące z nich głosy. Dawi odpowiadają, że to tylko „wentylacja”.` },
      { tytul: "Armia", tekst: `Armia Dawi jest równie bezpośrednia jak ich filozofia życia: ciężki pancerz, ciężka broń, jeszcze cięższa artyleria. Ich wojownicy mogą godzinami utrzymywać pozycję, podczas gdy wrogowie próbują bezskutecznie przebić się przez ścianę stali. A kiedy przeciwnik w końcu zbliży się do murów... Krag-Mhor odpala działa.

Ich armie wykorzystują między innymi:
- ciężkozbrojną piechotę Dawi,
- mistrzów kowalstwa bojowego,
- Kowali Demonów,
- artylerię i działa oblężnicze,
- demonicznie zasilane machiny wojenne,
- magmadrothy,
- golemy i konstrukty,
- oddziały pracownicze,
- eksperymentalne urządzenia inżynieryjne.

Jeżeli problem można rozwiązać młotem — użyj młota. Jeżeli młot jest za mały — zbuduj większy. Jeżeli nadal nie działa — zbuduj działo.` },
      { tytul: "Najwyższy Kowal Surtr", tekst: `Na szczycie Krag-Mhor stoi Najwyższy Kowal Surtr — mistrz kowalstwa, architekt przemysłowej potęgi Dawi oraz dawi, który uważa, że praktycznie każdy problem można rozwiązać odpowiednio dużą ilością stali. Pod jego rządami Krag-Mhor przestało być jedynie górskim królestwem. Stało się potęgą przemysłową.

Surtr nie marzy o podboju całego świata. Chce czegoś znacznie prostszego: żeby cały świat kupował broń wyprodukowaną w Krag-Mhor. A jeśli przy okazji kilka państw zostanie zniszczonych? Cóż. Popyt na broń właśnie wzrósł.` },
    ],
  },
  {
    id: "aurelia", nazwa: "Aurelia", rasa: "Draenei", kolor: "#3a6ed8",
    przydomek: "Ostatnia Ostoja Nadziei",
    stolica: "Elyndor", ustroj: "Monarchia elekcyjno-radna", wladca: "Seranya „Niezłomne Światło”",
    godlo: "", motto: "Światło dla tych, którzy szukają schronienia. Ogień dla tych, którzy je odbierają.",
    specjalizacja: "Kryształy, jubilerstwo, rzemiosło, medycyna, bio-architektura; religia: kult Świętego Światła",
    zasoby: [{ nazwa: "Kryształy", opis: "Główne bogactwo i zasób strategiczny; wydobycie pod kontrolą państwa." }],
    opis: [
      { tytul: "Ogólny opis", tekst: `Aurelia jest górskim państwem Draenei powstałym wokół jednej prostej idei: stworzenia miejsca, w którym ci, którzy stracili własny dom, mogą zbudować go ponownie.

Draenei sami przez wieki doświadczali wojen, prześladowań i utraty ojczyzny, dlatego ich państwo przyjmuje uchodźców oraz przedstawicieli innych ras szukających schronienia. Nie oznacza to jednak całkowicie otwartych granic. Przybysze są przyjmowani, o ile przestrzegają miejscowego prawa i nie stanowią zagrożenia dla mieszkańców.

Wojna jest traktowana jako ostateczność, ale wielowiekowe doświadczenia Draenei sprawiły, że państwo przykłada ogromną wagę do fortyfikacji i przygotowania do obrony. Największym bogactwem Aurelii są otaczające ją góry. W ich wnętrzu znajdują się złoża metali, kamieni szlachetnych oraz przede wszystkim charakterystycznych kryształów, które stały się podstawą miejscowej gospodarki, rzemiosła i architektury.` },
      { tytul: "Kraina", tekst: `Aurelia leży u podnóża rozległego pasma górskiego. Jej krajobraz tworzą wysokie, skaliste szczyty i górskie doliny, które stopniowo przechodzą w gęste lasy, rozległe łąki oraz pola uprawne na niżej położonych terenach.

Większość osad powstała na równinach i w łagodniejszych dolinach u podnóża gór. Wioski zajmują się przede wszystkim rolnictwem, hodowlą i leśnictwem, zapewniając żywność oraz surowce większym miastom. Przez krainę biegną również lądowe szlaki handlowe.

Same góry są gospodarczym sercem Aurelii. Znajdują się w nich liczne kopalnie oraz naturalne jaskinie kryształowe. Wydobycie podlega kontroli państwa: otwarcie nowej kopalni wymaga zgody władz, ponieważ kryształy traktowane są zarówno jako podstawa gospodarki, jak i zasób strategiczny.

Draenei dbają również o to, by rozwój Aurelii nie odbywał się kosztem całkowitego wyniszczenia jej ziem. Wycinka lasów jest kontrolowana, a nie każde odkryte złoże zostaje natychmiast przeznaczone do eksploatacji — bogactwa Aurelii mają służyć również przyszłym pokoleniom.` },
      { tytul: "Elyndor — Stolica Światła", tekst: `Elyndor został wzniesiony w szerokiej dolinie otoczonej górami. Jasny kamień przeplata się tutaj ze złotem, metalem oraz kryształami, a smukłe wieże górują nad zabudową. Pomiędzy nimi rozciągają się mosty, tarasy i ogrody.

Draenei rozwinęli charakterystyczną bio-architekturę kryształową. Kryształy są wkomponowywane w budynki, fortyfikacje, świątynie i warsztaty. Po zmroku część z nich emituje delikatny blask, dzięki czemu najważniejsze ulice i budowle Elyndoru pozostają oświetlone również nocą.

W centrum miasta wznosi się Sanktuarium Światła, siedziba Seranyi oraz sala Rady Starszych. Poza stolicą zabudowa jest znacznie prostsza i bardziej praktyczna: górskie osady powstają z kamienia i drewna, a kryształy wykorzystuje się tam oszczędniej.` },
      { tytul: "Ustrój i Rada Starszych", tekst: `Aurelia jest monarchią radną, w której władca posiada dużą władzę wykonawczą, lecz nie rządzi całkowicie samodzielnie. Obecną władczynią jest Seranya „Niezłomne Światło”, nosząca tytuł Pierwszej Strażniczki Aurelii.

Najważniejsze decyzje konsultowane są z Radą Starszych, składającą się z pięciu osób. Każdy członek Rady posiada ceremonialny kamień innego koloru, będący symbolem jego urzędu. Podczas narad kamienie mogą ukazywać niejasne obrazy, odczucia lub możliwe następstwa wydarzeń — problem polega na tym, że trzeba je jeszcze właściwie zinterpretować.

Rada zajmuje się przede wszystkim prawem, gospodarką, religią oraz sprawami wewnętrznymi. Władca odpowiada za bezpieczeństwo państwa, dyplomację oraz wojsko. W sytuacji bezpośredniego zagrożenia Pierwsza Strażniczka może podejmować decyzje wojskowe bez zgody Rady, lecz później musi się przed nią z nich rozliczyć.` },
      { tytul: "Społeczeństwo", tekst: `Draenei stanowią podstawę społeczeństwa Aurelii, ale państwo nie jest zamknięte dla innych ras. Status społeczny nie wynika z pochodzenia. Uchodźca może zostać rzemieślnikiem, kupcem, żołnierzem czy uczonym, jeżeli zaakceptuje miejscowe prawo.

Największym szacunkiem cieszą się osoby służące społeczności: uzdrowiciele, nauczyciele, rzemieślnicy, kapłani, doświadczeni żołnierze i górnicy. Szczególne znaczenie mają Anachoreci, czyli kapłani i uzdrowiciele Światła. Stąd określenie mieszkańców Aurelii używane również poza jej granicami: Słoneczni Anachoreci.` },
      { tytul: "Gospodarka", tekst: `Gospodarka Aurelii opiera się przede wszystkim na górnictwie, rzemiośle oraz handlu. Najważniejszym towarem eksportowym są kryształy — jako surowiec i jako znacznie droższe gotowe wyroby. Największe i najrzadsze okazy pozostają pod kontrolą państwa.

Poza kryształami Aurelia eksportuje kamienie szlachetne, metale, biżuterię, ozdobne elementy architektoniczne, narzędzia, wyroby kowalskie oraz produkty lecznicze. Pola zapewniają żywność dla własnej ludności, na nizinach hoduje się zwierzęta, a lasy dostarczają drewna, dziczyzny, ziół, grzybów i żywic.

Aurelia woli sprzedawać niewielkie ilości drogich, wysoko przetworzonych produktów niż ogromne ilości taniego surowca. Dlatego największe miasta posiadają całe dzielnice warsztatowe.` },
      { tytul: "Wojsko", tekst: `Siły zbrojne Aurelii powstały przede wszystkim z myślą o obronie państwa, kopalń oraz szlaków handlowych. Zamiast liczebności stawiają na wyszkolenie, dyscyplinę, dobre wyposażenie oraz współpracę formacji. Góry, lasy i wąskie drogi sprzyjają obrońcom.

- Straż Kryształowej Przystani — trzon zawodowej armii: ciężkozbrojni żołnierze z tarczami, włóczniami, mieczami i młotami.
- Paladyni Świętego Światła — elita w niewielkich oddziałach; łączą ciężkie uzbrojenie z magią Światła.
- Strażnicy Gór — zwiadowcy, tropiciele i lekka piechota; chronią karawany z kryształami.
- Anachoreci Polowi — uzdrowiciele towarzyszący armii.

Aurelia posiada również strzelców z łukami, kuszami i niewielką liczbą broni czarnoprochowej. Uzbrojenie łatwo rozpoznać: jasny metal, złote zdobienia, granatowe tkaniny i kryształy. Kryształowe uzbrojenie jest kosztowne i rzadkie, dlatego trafia głównie do paladynów, dowódców i jednostek specjalnych.` },
      { tytul: "Talaany i Vaeliry", tekst: `Talaany to duże, silne wierzchowce Draenei przypominające połączenie jelenia, koziorożca i masywnego konia. Nie dorównują koniom szybkością na równinach, ale są znacznie wytrzymalsze w górach. Aurelia bardzo niechętnie sprzedaje je za granicę.

Vaeliry to duże skrzydlate stworzenia z wysokich partii gór, przypominające połączenie gryfa, koziorożca i drapieżnego ptaka. Są rzadkie i trudne do wychowania — służą zwiadowcom, elitarnym posłańcom i Strażnikom Gór, ale nie nadają się do przewożenia ładunków.` },
    ],
  },
  {
    id: "goblandia", nazwa: "Goblandia", rasa: "Gobliny", kolor: "#5aa02c",
    stolica: "", ustroj: "Wolne państwo kupieckie", wladca: "Gobloni",
    godlo: "", motto: "Po co zdobywać cudze, skoro można zarobić na własnym?",
    specjalizacja: "Handel, przedsiębiorczość; granice otwarte dla każdego; niewolnictwo całkowicie zakazane",
    zasoby: [],
    opis: [
      { tytul: "Charakter państwa", tekst: `Goblandia jest państwem goblinów, które całkowicie odrzuciło ideę podboju i dominacji nad innymi narodami. Nie interesują ich wielkie podboje ani budowanie imperium. Zamiast tego stworzyły społeczeństwo, w którym niemal wszystko kręci się wokół pieniędzy, pracy, handlu i możliwości.

Gobliny nie są szczególnie uzdolnione w walce, dlatego zdecydowanie bardziej cenią spryt, przedsiębiorczość i umiejętność znalezienia sposobu na zarobek.

Goblin może otworzyć sklep, warsztat, restaurację, bank, drukarnię albo dowolny inny legalny biznes. Bogactwo nie jest postrzegane jako coś wstydliwego — dobrze prosperujący goblin jest darzony ogromnym szacunkiem. Można też być zwykłym pracownikiem, rzemieślnikiem, rolnikiem, kupcem czy artystą. Najważniejsze jest to, żeby uczciwie zarabiać i przestrzegać prawa.` },
      { tytul: "Otwarte granice", tekst: `Granice są otwarte dla wszystkich. Człowiek, elf, krasnolud, ork czy przedstawiciel dowolnej innej rasy może tu pracować, mieszkać, prowadzić działalność, studiować, handlować albo po prostu zwiedzać.

Gobliny nie pytają przybysza: „Ile masz pieniędzy?”. Pytają: „Czy masz jakiś interes?”. A jeśli odpowiedź brzmi „nie”, goblin prawdopodobnie odpowie: „Jeszcze.”` },
      { tytul: "Prawo i niewolnictwo", tekst: `Niewolnictwo jest absolutnie zakazane. Każda rasa przebywająca w państwie posiada podstawowe prawa i wolność osobistą. Gobliny wolą zatrudniać za wynagrodzenie — ich zdaniem wolny pracownik może sam zdecydować, gdzie chce pracować i na co wyda swoje pieniądze.` },
    ],
  },
  {
    id: "rogus-ardens", nazwa: "Rogus Ardens", rasa: "Kreeganie", kolor: "#b01e28",
    stolica: "Rodas", ustroj: "Monarchia z nadania Ras-Al-Ghula", wladca: "Elmon Devil",
    godlo: "Ojcowskie oko Ras-Al-Ghula w złocie; kwadrat połączony z trójkątem — dom dla innych ras",
    motto: "Z popiołów powstaliśmy, z ognia nasz ród.",
    specjalizacja: "Hutnictwo i metalurgia, insektoidy, teleportacja wojsk",
    zasoby: [{ nazwa: "Irno", opis: "Waluta, w której płaci się mieszkańcom." }],
    opis: [
      { tytul: "Podstawowe informacje", tekst: `„Witaj wędrowcze. Zawitałeś do państwa Kreegan zwanego Rogus Ardens. Zwą mnie Lucjan the Monteville. Jestem najwyższym kapłanem Ras-Al-Ghula, naszego Pana i Stwórcy.”

Stolicą jest Rodas, założona w 120 roku p.o.s. — Po Odparciu Starożytnych. W powietrzu czuć zapach siarki, a na skórze ciepło odprowadzane z hut i zakładów metalurgicznych.

W państwie panuje monarchia. Jak mówi obyczaj, pierwszy cesarz otrzymał władzę od samego Ras-Al-Ghula. Obecnym monarchą jest Elmon Devil — powiadają, że ostatni fizyczny syn Bóstwa i Stwórcy. Rządzi wraz ze swoimi 7 synami; jego spadkobiercą jest Vaelgor.

Flaga przedstawia ojcowskie oko Ras-Al-Ghula, które patrzy z niebios. Kolor złota symbolizuje boskie prawo do rządzenia, a kwadrat połączony z trójkątem — dom, jaki Kreeganie tworzą dla innych ras.` },
      { tytul: "Wiara", tekst: `Kreeganie wierzą w Ras-Al-Ghula, twórcę konceptu życia w całym uniwersum, zdradzonego przez Starożytnych — jego pierwsze dzieło — przez odrzucenie stwórcy i kradzież jego wiedzy. Kreeganie dostali świętą misję zniszczenia Starożytnych i nieczystych istot przez nich stworzonych.

Dzięki pełnemu podporządkowaniu się Ras-Al-Ghulowi otrzymali wiedzę przewyższającą wiedzę innych istot, które ich technologię nazywają „magią”, a ich samych „demonami z piekieł”. W praktyce Kreeganie żyją i umierają jak inne rasy, ale ogromna odporność na ból i gorąco oraz teleporty używane nawet podczas walki pozwalają im szybko powiększać wojska w bitwie.` },
      { tytul: "Hymn „Inferno”", tekst: `Z popiołów powstaliśmy, z ognia nasz ród,
Przez skały i pustkowia wiedzie nasz trud.
Nie klękniem przed bogiem, nie cofniem się w cień,
Bo Kreegan pamięta, czym jest gniew i dzień.

Kreegan! Kreegan! — ogień w naszych żyłach!
Kreegan! Kreegan! — siła w naszych siłach!
Niech płonie sztandar, niech zatrzęsie się świat,
Gdy Kreegan rusza — nie ostoi się żaden wróg ni brat!` },
      { tytul: "Kasty", tekst: `Społeczeństwo Kreegan dzieli się na kasty. Każda ma inne prawa i obowiązki, a bycie w najwyższej kaście nie oznacza najwygodniejszego życia.

- Kasta I — ludy wyzwolone przez Kreegan (ludzie, krasnoludy, niziołki, gnomy) oraz kultyści pilnujący porządku. Nie biorą udziału w mobilizacji; w zamian produkują broń i wydobywają surowce.
- Kasta II — insektoidy; w razie mobilizacji muszą stawić się na wezwanie cesarza.
- Kasta III — zwykli Kreeganie.
- Kasta IV — Czarty i Czarci Lordowie, dowódcy na polu bitwy.` },
      { tytul: "Dzielnica Shira", tekst: `Dzielnicę Shira zamieszkują głównie ludy wyzwolone przez Kreegan. Nikt tu nie jest zakuty w łańcuchy. Każdy mieszkaniec dostaje wypłatę w Irno, za którą może wykupić mieszkanie, opłacić jedzenie, rachunki i podatki, a nawet raz do roku wyjechać do którejś z międzyplanetarnych kolonii.

Porządku pilnują kultyści w czerwieni z dużymi tarczami z wygrawerowanym okiem Ras-Al-Ghula. Każda dzielnica Rodas ma swój symbol nawiązujący do historii jej powstania.` },
      { tytul: "Insektoidy", tekst: `Matka jest jedynym insektoidem zdolnym do rozrodu. To, jaki gatunek wykluje się z jaja, zależy od temperatury, czasu inkubacji i pożywienia Matki. Matki karmi się kryminalistami oraz ciałami poległych i zmarłych.

- Pożeracz (0–5°C) — zwija się w żywą kulę do taranowania bram i murów, pancerz twardy jak diament, ponad 150 km/h. Słabości: miękkie podbrzusze i brak wzroku (widzi w podczerwieni).
- Żądlica (6–10°C) — lata na długie dystanse; żądło z wiekiem pokrywa się bakteriami z ofiar. Świetny ochroniarz.
- Skorpion jaskiniowy (od -1 do -6°C) — wykluwa się z umiejętnościami łuczniczymi, strzela wiązkami energii.` },
      { tytul: "Mieszkańcy", tekst: `- Czart — dowodzi wojskami na polu bitwy (kasta IV); pożera trupy przeciwników, by z ich tkanek łatać własne rany.
- Czarci Lord — skrzydlaty, z bronią laserową lub magią do palenia wrogów z odległości (kasta IV).
- Sukkub — w pokoju gromadzi energię życiową; na wojnie dzięki polimorfizmowi szpieguje i prowadzi dywersję.
- Chochlik — najpopularniejszy z Kreegan; „magią krwi” osłabia żyły energii żywiołów, blokując czary wrogich magów.
- Cerber — obrońca domu i zwierzątko domowe; odrastają mu kończyny, a w miejsce każdej uciętej głowy wyrastają dwie.` },
    ],
  },
  {
    id: "czarny-smok", nazwa: "Królestwo Czarnego Smoka", rasa: "Smok i jego poddani", kolor: "#4a5a3c",
    przydomek: "Prowincja Czarnolasu",
    stolica: "Twierdza Czarnego Szczytu", ustroj: "Władza smoka", wladca: "Shire, Czarny Smok",
    godlo: "", motto: "",
    specjalizacja: "Danina w srebrze, krwi i posłuszeństwie",
    zasoby: [],
    opis: [
      { tytul: "Prowincja Czarnolasu", tekst: `W samym sercu mrocznych gór wznosi się Prowincja Czarnolasu, kraina, którą niepodzielnie rządzi starożytny czarny smok Shire.` },
      { tytul: "Twierdza Czarnego Szczytu", tekst: `Zamek został wykuty bezpośrednio w zboczu wysokiej, skalistej góry. Jego czarne baszty i iglice wyrastają prosto ze skały, jakby sama góra wypluła je na świat. Mury są chropowate, pokryte starożytnymi runami i śladami smoczego ognia. Z najwyższych tarasów widać całe królestwo aż po horyzont, a z kominów i szczelin w skale unosi się wieczny, siwy dym.` },
      { tytul: "Mroczny Las Usychających", tekst: `U stóp góry rozciąga się Mroczny Las Usychających. Tysiącletnie drzewa stoją tu martwe i skręcone, ich gałęzie czarne i suche jak węgiel. Nie rosną liście, nie śpiewają ptaki – tylko wiatr wyje między suchymi konarami, a ziemia jest pokryta popiołem i szarym mchem. Las ten jest żywą granicą prowincji: każdy, kto wejdzie bez pozwolenia Shire, czuje, jak życie powoli opuszcza jego ciało.` },
      { tytul: "Smok i poddani", tekst: `Smok rzadko opuszcza swoje komnaty w sercu góry. Kiedy jednak rozkłada skrzydła nad lasem, niebo ciemnieje, a z jego paszczy spływa czarny, trujący dym, który jeszcze bardziej usycha to, co już i tak jest martwe.

Poddani – ludzie o bladych twarzach, koszmarne elfy i nieliczni magowie cienia – żyją w małych osadach na skraju lasu, płacąc daninę w srebrze, krwi i posłuszeństwie. Wiedzą, że dopóki smok panuje, nikt z zewnątrz nie odważy się najechać Czarnolasu.

Prowincja jest cicha, surowa i piękna w swoim złowrogim majestacie — miejsce, gdzie góra, las i smok stały się jednym.` },
    ],
  },
  {
    id: "gor-khar", nazwa: "Królestwo Szarych Kłów", rasa: "Orkowie i jaszczuroludzie", kolor: "#8a5a32",
    stolica: "Gor-Khar, „Miasto Kłów”", ustroj: "Monarchia klanowa", wladca: "Król Drogath „Najdłuższy Kieł”",
    godlo: "Srebrny kieł na tle brunatnego słońca", motto: "Siła prowadzi. Krew pamięta.",
    specjalizacja: "Mieszkańcy: szare i brązowe orki oraz jaszczuroludzie",
    zasoby: [],
    opis: [
      { tytul: "Hierarchia kłów", tekst: `W tym królestwie długość kłów jest oznaką szlachetności. Ork nie może sobie po prostu „wyhodować” większych kłów i awansować. Liczy się ich naturalna długość, rodowód oraz zdolność udowodnienia pochodzenia.

- Wielkie Kły (30+ cm) — najwyższa arystokracja; zasiadają w Radzie Kłów, posiadają ogromne terytoria i mogą dowodzić całymi armiami. Najdłuższe kły ma oczywiście król.
- Szare Kły (20–30 cm) — szlachta wojskowa i zarządcy prowincji; dowodzą fortami, plemionami i oddziałami.
- Brązowe Kły (10–20 cm) — wolni wojownicy i niższa szlachta; trzon armii.
- Krótkie Kły (poniżej 10 cm) — rolnicy, rzemieślnicy, myśliwi, kupcy i robotnicy. Ork może zdobyć szacunek czynami, ale jego pozycja rodowa nadal będzie niższa.

W kulturze mówi się: „Długi kieł pamięta to, czego krótki jeszcze nie przeżył.”` },
      { tytul: "Jaszczuroludzie i Rada Łusek", tekst: `Jaszczuroludzie znajdują się poniżej orkowej arystokracji, ale zajmują szczególne miejsce w społeczeństwie. Nie posiadają kłów, dlatego orkowie uważają ich za pozbawionych „krwi przodków”. Jednocześnie mają umiejętności, których orkowie potrzebują: są zwiadowcami, rybakami, łowcami, tropicielami, alchemikami, zielarzami, budowniczymi kanałów, marynarzami i skrytobójcami.

Rada Łusek reprezentuje jaszczuroludzi przed królem. Nie może wydawać rozkazów orkom, ale ma władzę nad ich sprawami wewnętrznymi.` },
      { tytul: "Armia", tekst: `- Żelazne Kły — elitarna gwardia królewska w ciężkich pancerzach, z ogromnymi toporami.
- Szare Hordy — główna armia orkowa: włócznie, topory, tarcze, ciężka piechota.
- Brązowa hołota — brązowe orki chcące podnieść swój status czynami wojennymi.
- Łuskowe Oczy — jaszczuroludzcy zwiadowcy; tropią przeciwnika i przygotowują zasadzki.
- Krwawe Łuski — jaszczuroludzcy zabójcy podlegli bezpośrednio królowi; ich istnienie jest oficjalnie tajemnicą.
- Żmijowe Plujki — jaszczuroludzie z dmuchawkami i kolcami pokrytymi toksyną (trucizna, spowolnienie, dezorientacja, osłabienie, senność).
- Żelazny Kieł — ogromna balista (5 orków + 2 jaszczuroludzi) strzelająca metalowymi „kłami”; pocisk Kieł Dusiciela z łańcuchem i hakiem ściąga latające potwory na ziemię.` },
      { tytul: "Gor-Khar i Tron Kła", tekst: `Stolica została zbudowana wokół ogromnej czarnej skały. W centrum znajduje się Tron Kła — monumentalny tron wykonany z kości pradawnego smoka. Za nim stoi Ściana Kłów, gdzie każdy król pozostawia odcisk własnego kła. Im wyżej znajduje się odcisk, tym większy prestiż rodu.` },
      { tytul: "Jeźdźcy Wilczych Kłów", tekst: `Wilki są hodowane i szkolone przez specjalne orkowe klany. Nie każdy może jeździć na wilku — to przywilej wojowników, którzy osiągnęli odpowiedni status. Jeźdźcy Wilczych Kłów to elitarna kawaleria: głównie szare orki na ogromnych wilkach, w ciężkich pancerzach, z włóczniami i toporami. Każdy wilk ma własne imię.

Ork nie dostaje wilka na własność. Musi zostać przez niego zaakceptowany. Jeżeli wilk zrzuci wojownika podczas ceremonii, ork nie jest godny elity. Bardzo praktyczny system awansu, jeśli ktoś lubi, gdy jego kadra zarządzająca może zostać pogryziona.` },
      { tytul: "Zakon Smoczych Kłów", tekst: `Najpotężniejsi wojownicy królestwa. Każdy z nich posiada własnego smoka, tytuł nadany przez króla, własny sztandar, prawo do samodzielnego dowodzenia armią i możliwość wejścia do królewskiej sali bez wezwania.

Ich zbroje są odporne na ogień smoka, a sztandar rozwija się dopiero podczas bitwy. Każdy z nich samotnie pokonał smoka, dlatego jest godny go dosiadać. W całym królestwie jest 7 smoczych jeźdźców i nigdy ze sobą nie współpracują, bo tak samo jak ich smoki nie znoszą się nawzajem.` },
    ],
  },
  {
    id: "grobowe-imperium", nazwa: "Grobowe Imperium", rasa: "Nieumarli", kolor: "#1fa79a",
    stolica: "Eithvethdra", ustroj: "Teokracja, monarchia absolutna boga-króla", wladca: "Tarael Illitris",
    godlo: "Turkusowy kielich z wielkim okiem wewnątrz na czarnym tle", motto: "",
    specjalizacja: "Wydobycie, religia, fanatyzm, nekromancja, golemancja, inne rodzaje magii, handel informacją",
    zasoby: [{ nazwa: "Fragmenty dusz", opis: "Paliwo do maszyn i golemów." }, { nazwa: "Przedmioty magiczne", opis: "Artefakty i mikstury na handel." }],
    opis: [
      { tytul: "Ogólny opis", tekst: `Grobowe Imperium wywodzi się od pierwszych nieumarłych, którzy, znienawidzeni przez największe kraje starego świata, zostali zmuszeni do zjednoczenia się i ucieczki tam, gdzie ich nie znajdą. Pod ziemię.

Znani są ze swojej wiedzy oraz Srebrnej Iglicy — wielkiej biblioteki z niespotykanymi już księgami o magii, a przede wszystkim głównej siedziby najpotężniejszych magów imperium. Dziś odważyli się wyjść ze swoich grobowców na powierzchnię, zauważając, że wszyscy starzy wrogowie już dawno są nieobecni.

Jeśli ktoś myśli, że są okrutni, zabijają dla zabawy i pożerają dusze — to tylko stereotypy. Ludzie mieszkają w ich miastach na powierzchni i w zamian za obniżone podatki mogą z własnej woli oddawać trochę krwi wampirzym pobratymcom. Nie ma niewolników ani ograniczeń na tle rasowym. Ludzie mogą mieć własne biznesy, rodziny, a nawet zostać lordami miast — nie mogą jednak sprawować najważniejszych urzędów ani zamieszkać na stałe w podziemiach. Ten, kto się wykaże, może dostać propozycję przemiany. Może ją odrzucić, ale ta już nigdy się nie powtórzy.

A co do staroelfickiej propagandy o jedzeniu dusz — brednie. Kiedy ktoś umiera, jego duch przechodzi „dalej”, pozostawiając resztki duszy. Te są zbierane i wykorzystywane jako paliwo do maszyn oraz golemów.` },
      { tytul: "Władza", tekst: `Władza opiera się na monarchii absolutnej z dużym udziałem ministrów i najbliższych popleczników. Władca jest zarówno głową kościoła, jak i jego bóstwem. Raz na jakiś czas zapada w sen, podczas którego komunikuje się i wydaje rozkazy przez telepatię oraz sny. Wtedy Merrla i Bob są jego prawą i lewą ręką, wykonującymi jego wolę.` },
      { tytul: "Gospodarka", tekst: `Gospodarka opiera się na czterech filarach:
- Wydobycie — zombi-robotnicy kopią dzień i noc za jakże konkurencyjną wypłatę w postaci niczego; inteligentniejsi są brygadzistami i operatorami maszyn.
- Magia i artefakty — od pierścieni grzejących zimą po zbroje odporne na magię, a także mikstury.
- Datki na tacę — są tylko wierni, a kto nie jest, traci status obywatela.
- Handel informacją — częste podróże dają imperium dostęp do wiedzy, która nie jest powszechnie znana. A to się sprzedaje.` },
      { tytul: "Populacja", tekst: `Główny trzon populacji stanowią ludzie i inne rasy obywateli. Inteligentni nieumarli, niezależni od nekromantycznego stwórcy, to około 45% populacji, a łącznie z przyzwanymi blisko 65%. Typów nieumarłych jest sporo: wampiry, dullahany walczące w ciężkim pancerzu, licze zakochane w wiedzy i magii, a także ghule, zjawy i inne.` },
      { tytul: "Wojskowość", tekst: `- Przyzwane jednostki — najliczniejszy trzon armii: zombie, włócznicy, uzbrojeni żołnierze. Straty są praktycznie bezbolesne, a każdy zabity przeciwnik dołącza do ich szeregów.
- Prawdziwi nieumarli — ciężkozbrojni dullahani (pieszo i konno), jazda i szybka piechota wampirów, magowie licze z muszkietami i armatami.
- Maszyny wojenne — golemy zasilane fragmentami dusz, głównie wielkie kolosy oblężnicze.
- Elita — strażnicy sanktuarium, paladyni z katedr oraz czarni rycerze Srebrnej Iglicy: autonomiczne golemy w zbrojach odpornych na magię.
- Ludzie — wystawiani najrzadziej, tylko w szczególnych przypadkach.` },
      { tytul: "Flota", tekst: `Imperium nie używa typowych okrętów. Hoduje specjalny typ potworów morskich, które potem zmienia w nieumarłych, a na ich grzbietach buduje konstrukcje. W ten sposób pływa pod wodą, używając braku potrzeby oddychania jako zalety.` },
    ],
  },
];
