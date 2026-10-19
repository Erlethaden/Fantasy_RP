# STYL GRAFIKI

## Nastrój
Mroczne fantasy, poważne i bogate, ale z humorem frakcji (gobliny, Dawi). Klimat Age of Wonders / Heroes of Might & Magic. Renesansowy poziom technologii (proch istnieje, ale nie dominuje).

## Pixel art (portrety, ikony, herby, później mapa i animacje)
- **Wzorce stylu (porównuj z NIMI, nie z dowolnym zaakceptowanym assetem):** `assets/portrety/drogath.png`, `assets/portrety/tarael.png` (128 px).
- **Cechy obowiązkowe pixel artu:** duże płaskie klastry jednego koloru, gruby ciemny kontur sylwetki, 2–3 poziomy cieniowania, BEZ szumu, gradientów i faktury pędzla. Obraz, który wygląda jak pomniejszony obraz malarski (drobne poszarpane piksele, rozmyte przejścia), to błąd stylu = co najmniej POPRAW, nawet jeśli treść jest dobra.
- **Tło portretu:** ciemne i spokojne; jasne szare albo pełne szczegółów tło = POPRAW.
- Portrety bohaterów: popiersie, 128×128 px, wyświetlane w skali całkowitej (×2, ×3) bez wygładzania (`image-rendering: pixelated`).
- Styl: detaliczny nowoczesny pixel art (wzór: Octopath Traveler, Eastward), czytelne twarze, wyraźny kontur, 2–3 poziomy cieniowania, oświetlenie z lewej góry.
- Tło portretu: prosty gradient lub ciemna plama w kolorze frakcji, bez szczegółowej sceny.
- Ikony zasobów: 32×32 px, ten sam kontur i światło.
- Paleta: ograniczona per frakcja (patrz niżej) + wspólne ciemne tony i złoto.

## Interfejs
- Ciemne tło (granat/czerń), złote ramki i akcenty, ozdobne nagłówki (font szeryfowy), treść czytelnym fontem.
- Ramki i przyciski z pixel-artowymi narożnikami, żeby pasowały do portretów; reszta (tekst, panele) gładka, żeby nie męczyła oczu.
- Każda frakcja ma swój kolor akcentu i herb.

## Kolory frakcji (wstępne)
- Krag-Mhor (Dawi): ogień, miedź, stal — #c8501e
- Aurelia (Draenei): granat, złoto, kryształowy błękit — #3a6ed8
- Goblandia: zieleń i złoto monet — #5aa02c
- Rogus Ardens (Kreeganie): czerwień, złoto, siarka — #b01e28
- Królestwo Czarnego Smoka: czerń, popiel, trująca zieleń — #4a5a3c
- Orkowie (Gor-Khar): brąz, srebrny kieł — #8a5a32
- Grobowe Imperium (Nieumarli): turkus na czerni — #1fa79a

## Generowanie
- Prompt bazowy: `detailed high-quality pixel art, modern HD-2D pixel art style like Octopath Traveler, crisp dark outlines, limited palette, dark fantasy, rich gold accents, dramatic lighting`
- Seed bazowy: 1000 (zmieniany przy szukaniu kompozycji).
- Portrety: generowanie 1024×1024 bez -Hires, docelowo 128×128 (nearest neighbor).
- Ikony: 1024×1024, docelowo 32×32. Tło sprite'ów/ikon: jednolite magenta #FF00FF.
- Sceny/tła (Sala Tronów): 1536×640 przy szukaniu kompozycji, finał z -Hires; docelowo 1920×800 (podgląd bez powiększania).

## Notatki o promptach
(pusto)
- 2026-10-16: portrety bohaterów — test na Dagnie: Klein z referencją (zbliżenie twarzy z planszy gracza) trzyma wygląd postaci dużo lepiej niż Z-Image z samą kartą (Z-Image dał anime-elfkę ze spiczastymi uszami). Metoda: wycinek twarzy gracza → `-Model klein -Ref`, prompt „The same character as in the reference image, redrawn as … pixel art” + blok z karty, 1024×1024, potem `narzedzia.py portret` (BOX do 128 px + paleta 48 kolorów).
- Klein kopiuje z referencji znaki na zbroi, które wyglądają jak litery; dopisz „smooth plates with simple glowing chevron stripes and geometric knotwork pattern, no lettering”.
- Portrety: druga referencja Kleina = wycinek zaakceptowanej sceny Sali Tronów tej frakcji („drawn in exactly the pixel art style of the second reference image”) — daje grube klastry pikseli zamiast malarskiego renderu. Do 128 px: LANCZOS + paleta 32 kolory metodą FASTOCTREE (MEDIANCUT gasi świecące oczy i żar).
- „bronze” wychodzi khaki/oliwkowe → „dark gunmetal and copper”; „geometric knotwork” na zbroi Kleina → litery → „simple bright glowing lines and dots”.
- Portrety — metoda końcowa (Krag-Mhor, Aurelia): (1) Klein z refem = twarz gracza + wycinek sceny Sali Tronów tej frakcji jako styl; (2) jeśli wyjdzie za gładko, Klein jako EDYTOR tej wersji z jedną referencją: „Redraw this exact portrait as crisp chunky pixel art … keep the same character … zoom out slightly … plain dark background with a strong <kolor> glow”. NIE dawać jako referencji stylu portretu innej postaci (przenosi twarz i fryzurę). Draenei: dopisać „zoom out, horns fully inside the frame”, inaczej rogi wychodzą poza kadr. Fraz o rogach nie dawać Dawim (Gotrek dostał rogi).
- „iron rings on beard” wychodzą jako złote kule → „dark steel bands wrapped around the beard”; skórę Dawi pisz „ash grey, not pink”.
- Pliki: `assets/portrety/<słowo z imienia>.png` (128 px) + `_1024.png` (źródło, nie trafia do builda). Aplikacja sama dobiera portret po słowie z imienia.
- 2026-10-17 (Orkowie, Nieumarli): referencja stylu = wycinek sceny władcy BEZ twarzy (tron, sztandar, broń) — styl przechodzi, twarz nie. Klein przy popiersiu obcina rekwizyty (głowica topora, ostrze halabardy, kamienie): pisz „zoom out slightly, <rekwizyt> fully visible inside the frame”. Z profilu znika drugie oko — gdy oczy są cechą, pisz „head turned slightly toward the viewer, both eyes visible”.
- 2026-10-17 (Merrla): pełny kadr duchem bez przezroczystości: Klein „floating ghost like a genie: from the waist down no legs, a long curling tail of glowing violet mist” — czyta się od razu jako duch. Klein jako edytor dokłada rekwizyty (kamienie), ale szaty nie zmienia. Inpaint Z-Image na obrazie z Kleina: przy domyślnej sile nic, przy 0.9 widoczny szew i inna skala pikseli — nie mieszać. Pełny portret = twarz ok. 10 px na 128 px; przycinać czarne marginesy przed zmniejszeniem.
- 2026-10-17 (2.4): referencji NIE dopełniać czarnymi pasami do kwadratu — Klein kopiuje pasy do wyniku; przycinać do kwadratu. Grupa postaci: 3 wycinki twarzy sklejone w jeden obraz = jedna referencja, działa (Koszmarne Widma). Klein-edytor „hut on chicken legs” dał chatkę na całym kurczaku z głową koguta, a wiedźmie kurze łapy — pisać „two long bird legs under the hut”. Postać bez obrazka: Klein z samym wycinkiem stylu jako referencją + blok z karty (Lucjan 8/10).
- 2026-10-17 PIXEL ART — WYMÓG UŻYTKOWNIKA: każdy portret ma być chunky pixel artem jak Drogath/Tarael. Gdy referencją jest malarski/kreskówkowy obraz gracza, Klein kopiuje jego technikę, a Klein-edytor („redraw as pixel art”, nawet z wycinkiem stylu) prawie nic nie zmienia. DZIAŁA: obraz zmniejszyć skryptem do 96 px (LANCZOS + paleta 32 FASTOCTREE), powiększyć NEAREST do 1024 i dać jako jedyną referencję Kleina: „Clean up this blocky low resolution image into crisp chunky pixel art at the same pixel size … thick dark pixel outlines … The picture shows: <pełny opis z cechami>”. Bez opisu cech Klein zmienia twarze (Jaga odmłodniała, Lucjan stracił demona). Seed 1000.
- 2026-10-17: źródło z blokowej referencji ma siatkę ~96 px — do 128 zmniejszać ZGODNIE Z SIATKĄ: 96 px BOX + paleta 32 bez ditheringu → 128 NEAREST (LANCZOS prosto do 128 rozmazuje klastry w szum). Tła: gładkie ciemne jak Drogath/Tarael („plain solid dark background”) — chmury, dym i mgła dają szum w 128 px.
- 2026-10-17 (herby): Z-Image „Chunky 16-bit pixel art game icon of a heraldic coat of arms: one single classic heater shield … on a plain flat solid magenta #FF00FF background” daje spójny komplet; tło wychodzi różowe, nie czysta magenta → `narzedzia.py sprite` zalewa od rogów. Paleta 24 (FASTOCTREE) robi czarne kropki w jasnych miejscach (kryształ Aurelii) — używać 48. Godło: jedna duża prosta sylwetka w jasnym kolorze na ciemnym polu (smok nad lasem i cienki kieł były nieczytelne w 64 px).
- 2026-10-18 (Gobjack, postać bez obrazka): Klein + wycinek stylu frakcji → za gładko → spikselizacja 96 px + Klein „clean up” → chunky. „eyepatch over his left eye” dało okulary na oba oczy; działa „his right eye is open … his left eye is covered by a small round black leather eyepatch on a thin diagonal strap”. „spyglass” w dłoni = pistolet albo lornetka → „one single long brass spyglass, a single tube of three telescoping segments … one round glass lens at the far end”. „deep crimson” wyszło bordowe — drobne poprawki koloru i małych detali (ząb) robić skryptem na gotowym 128 px (podmiana kolorów palety), nie generatorem.
- 2026-10-19 (ikonki osad 6.2b): „Chunky 16-bit pixel art game map icon of … three-quarter top-down view … on a plain flat solid magenta #FF00FF background”, seed 1000 — czyste izometryczne ikonki od pierwszej próby. Wariant obiektu (stolica = miasto + korona) Kleinem-edytorem na zaakceptowanej ikonce trzyma spójność, ale drugi edytor NIE powiększa już dodanych detali (korona, flaga bez zmian). Symbole, które mają się czytać w 32 px (korona, flaga), dorysować ręcznie pikselami skryptem na gotowym 32 px — AD 6 → 8/10. Ikonki mapy wyświetlać 1:1 (32 / 24 px), nie skalować CSS do 18–28 px (rozjeżdża piksele).
- 2026-10-19 (most 6.2e): Z-Image robi mosty jako masywne bloki/forty (2 próby, AD 6 i 5); małą prostą ikonkę (most, 24 px) szybciej i lepiej narysować ręcznie skryptem w siatce docelowej — AD 7/10 od razu.
- 2026-10-19 (most v5): użytkownik: garb z jednym łukiem = „namiot”. Most czyta się dzięki WODZIE pod łukami + płaskiej szerokiej jezdni z ciągłą poręczą; AD 7/10.
