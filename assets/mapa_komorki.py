# Wykrywanie komórek mapy: python assets/mapa_komorki.py [x0 y0 x1 y1 w pikselach oryginału]  (cała mapa: kilka minut)
#   wejście:  materialy/Mapa RPG.png (20000x20000, czarne kreski na białym)
#   wyjście:  materialy/mapa/komorki_2.png — etykiety w skali 1/2 (16 bit; 0 = ocean, 1..N = komórki lądu, jeziora i rzeki)
#             materialy/mapa/warstwy_2.png — maski w skali 1/2: R = rzeki, G = góry
#             materialy/mapa/obiekty.json  — id komórek-jezior i udział gór w komórkach
#             materialy/mapa/podglad.png   — pokolorowane komórki, kreski szare, jeziora i rzeki niebieskie, góry brązowe
# Rysunek: każdy bok komórki to JEDNA kreska pośrodku, narożniki (gdzie schodzą się 3 granice) są puste.
# Dlatego: 1) rozpoznaję kreski granic (proste, 2 końce), linie (wybrzeże, rzeki), resztę (cyfry, napisy, góry) pomijam;
# 2) końce kresek wskazujące na siebie łączę, pozostałe przedłużam aż trafią na inną kreskę/linię (narożniki);
# 3) wododział na odległości od tak odtworzonej siatki domyka szczeliny, których nie domknęły przedłużenia;
# 4) góry (rozpoznane po stromych kreskach w obie strony) dzielą komórkę tylko, gdy zostają po obu stronach duże części.
# Po zmianie wykrywania: python assets/mapa_edytor_dane.py (stare edycje z edytora przestają pasować).
import sys, colorsys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.draw import line as kreska
from skimage.morphology import skeletonize, h_maxima, binary_closing, disk
from skimage.segmentation import watershed

Image.MAX_IMAGE_PIXELS = None
SK = 2                     # skala obliczeń (1/2; w 1/4 kreski są za cienkie na kierunek końców); wymiary niżej są w pikselach ORYGINAŁU i dzielone przez SK
px = lambda v: max(1, round(v / SK))
KRESKA_MIN = px(50)        # długość (cięciwa) najkrótszej kreski granicy
KRZYWIZNA = 0.18           # kreska granicy odchyla się od prostej o mniej niż tyle swojej długości
CYFRA_KRESKA = px(130)     # krótsza kreska tuż obok cyfr/liter to część numeru
CYFRA_ODL = px(28)
LINIA = px(1000)           # dłuższa składowa to wybrzeże/rzeka (albo łańcuch gór — patrz GORY_*)
PRZEDLUZ = px(260)         # najdłuższe przedłużenie kreski do narożnika
GORY_OKNO, GORY_PROG, GORY_SZCZYTY = px(300) | 1, 0.35, 3   # okno; ile linii w oknie musi biec stromo w KAŻDĄ stronę; min. zakończeń/rozwidleń
H = 12 / (2 if SK == 4 else 1)          # wododział: wysokość h-maksimów (w px skali obliczeń)
OCEAN, ZAMKNIJ = px(240), px(24)
GORY_CZESC = 0.5
OKRUCH = px(250) ** 2
RZEKA_ZAMK, RZEKA_SZER, RZEKA_POLE = px(48), px(28), px(1000) * px(16)   # domknięcie; maks. połowa szerokości koryta; min. pole pasa
JEZIORO_BRZEG, JEZIORO_POLE = 0.75, px(600) ** 2

def wczytaj(okno):
    im = Image.open("materialy/Mapa RPG.png")
    if okno: im = im.crop(okno)
    L = np.array(im.convert("L"))
    return np.array(Image.fromarray(((L < 128) * 255).astype(np.uint8)).reduce(SK)) > 60 * 4 / SK / 2

def wezly(sk):
    nb = ndi.convolve(sk.astype(np.uint8), np.ones((3, 3), np.uint8), mode="constant") - 1
    return sk & (nb == 1), sk & (nb >= 3)

def rodzaje(ink, sk, konce):
    lab, n = ndi.label(ink, structure=np.ones((3, 3)))
    idx = np.arange(1, n + 1)
    dlug, nkon = ndi.sum(sk, lab, idx), ndi.sum(konce, lab, idx)
    sl = ndi.find_objects(lab)
    typ = np.zeros(n + 1, np.uint8)   # 1 kreska granicy, 2 linia, 3 reszta (pomijana)
    for i, s in enumerate(sl, 1):
        if dlug[i - 1] > LINIA: typ[i] = 2; continue
        typ[i] = 3
        if nkon[i - 1] != 2: continue
        # kreska = prawie prosta: szkielet odchyla się od cięciwy o mniej niż KRZYWIZNA jej długości (odsiewa 7, 2, 6, 9…)
        yy, xx = np.nonzero(sk[s] & (lab[s] == i)); ey, ex = np.nonzero(konce[s] & (lab[s] == i))
        cy, cx = ey[1] - ey[0], ex[1] - ex[0]; ciec = np.hypot(cy, cx)
        if ciec < KRESKA_MIN: continue
        odch = np.abs((yy - ey[0]) * cx - (xx - ex[0]) * cy) / ciec
        if odch.max() < KRZYWIZNA * ciec + 1.5: typ[i] = 1
    # krótka kreska tuż przy innym znaku to część numeru („1” w „11”, kreska w „4”)
    blisko = ndi.grey_dilation(np.where(typ[lab] == 3, lab, 0), size=2 * CYFRA_ODL + 1)
    for i, s in enumerate(sl, 1):
        if typ[i] == 1 and np.hypot(s[0].stop - s[0].start, s[1].stop - s[1].start) < CYFRA_KRESKA and (blisko[s][lab[s] == i] > 0).any():
            typ[i] = 3
    return lab, typ

def rzeki_z_linii(linie):
    """Rzeki są rysowane podwójną linią: domknięcie linii daje między brzegami długi, wąski pas. Szerokie fragmenty
    (ujścia do jezior, „V” między szczytami gór) wycinam, a zostają tylko długie pasy."""
    pas = binary_closing(linie, disk(RZEKA_ZAMK)) & ~linie
    pas &= ~ndi.binary_dilation(ndi.distance_transform_edt(pas) > RZEKA_SZER, iterations=RZEKA_SZER + 1)
    p, n = ndi.label(pas)
    dl = ndi.sum(np.ones_like(p), p, range(1, n + 1))
    return linie & ndi.binary_dilation(np.isin(p, 1 + np.nonzero(dl > RZEKA_POLE)[0]), iterations=2)

def siatka(ink_, lab, typ, sk, konce, rozg):
    H_, W_ = lab.shape
    rzeki = rzeki_z_linii(typ[lab] == 2)
    linie = (typ[lab] == 2) & ~rzeki   # do szukania gór (drobne kreski w poprzek rzeki wyglądają jak szczyty)
    # góry: strome kreski pochylone na przemian w obie strony („/\”) plus zakończenia i rozwidlenia szczytów;
    # rzeka (nawet pionowa) ma jeden kierunek i nie ma zakończeń, wybrzeże jest za rzadkie
    f = ndi.gaussian_filter(ink_.astype(np.float32), 2)
    th = (np.degrees(np.arctan2(ndi.sobel(f, 0), ndi.sobel(f, 1))) + 90) % 180
    s = sk & linie
    lewe = ndi.uniform_filter((s & (th > 50) & (th < 82)).astype(np.float32), GORY_OKNO) * GORY_OKNO
    prawe = ndi.uniform_filter((s & (th > 98) & (th < 130)).astype(np.float32), GORY_OKNO) * GORY_OKNO
    wez = ndi.uniform_filter(((konce | rozg) & linie).astype(np.float32), GORY_OKNO) * GORY_OKNO ** 2
    gory = ndi.binary_dilation((np.minimum(lewe, prawe) > GORY_PROG) & (wez >= GORY_SZCZYTY), iterations=px(60)) & linie
    del f, th, s, lewe, prawe, wez
    keep = (typ[lab] == 1) | (linie & ~gory) | rzeki
    own = np.where(keep, lab, ndi.grey_dilation(np.where(keep, lab, 0), size=3))
    ey, ex = np.nonzero(konce & (typ[lab] == 1))
    r1, r2 = px(24), px(80)
    P, V, C = [], [], []
    for y, x in zip(ey, ex):
        c = lab[y, x]
        y0, x0 = max(0, y - r2), max(0, x - r2)
        yy, xx = np.nonzero(sk[y0:y + r2 + 1, x0:x + r2 + 1] & (lab[y0:y + r2 + 1, x0:x + r2 + 1] == c))
        dd = np.hypot(yy + y0 - y, xx + x0 - x); m = (dd >= r1) & (dd <= r2)
        if m.sum() < 3: continue
        v = np.array([y - yy[m].mean() - y0, x - xx[m].mean() - x0]); P.append((y, x)); V.append(v / np.linalg.norm(v)); C.append(c)
    P, V, C = np.array(P, float), np.array(V), np.array(C)
    ext = np.zeros((H_, W_), bool)
    zywy = np.ones(len(P), bool)
    # pary końców wskazujących na siebie (wzajemnie najlepsze) — łączę wprost
    best = {}
    for i in range(len(P)):
        d = P - P[i]; dist = np.hypot(d[:, 0], d[:, 1]); dist[i] = 1e9
        u = d / np.maximum(dist[:, None], 1e-6)
        ok = (dist < PRZEDLUZ) & (u @ V[i] > 0.7) & ((u * V).sum(1) < -0.7) & (C != C[i])
        if ok.any(): best[i] = int(np.where(ok, dist * (2 - u @ V[i]), 1e9).argmin())
    for i, j in best.items():
        if best.get(j) == i and i < j:
            ext[kreska(*P[i].astype(int), *P[j].astype(int))] = True; zywy[i] = zywy[j] = False
    # pozostałe końce: przedłużanie wszystkich naraz, aż trafią na cudzą kreskę/linię/przedłużenie
    rid = np.zeros((H_, W_), np.int32); pos = P.copy(); slad = [[] for _ in P]; trafil = ~zywy
    for krok in range(PRZEDLUZ * 2):
        if not zywy.any(): break
        for k in np.nonzero(zywy)[0]:
            pos[k] += V[k] * 0.5
            iy, ix = int(round(pos[k, 0])), int(round(pos[k, 1]))
            if not (0 <= iy < H_ and 0 <= ix < W_) or krok / 2 > PRZEDLUZ: zywy[k] = False; continue
            slad[k].append((iy, ix))
            sy, sx = slice(max(0, iy - 2), iy + 3), slice(max(0, ix - 2), ix + 3)
            o = own[iy, ix]; rr = rid[sy, sx]
            if (o != 0 and o != C[k]) or ((rr != 0) & (rr != k + 1)).any(): zywy[k] = False; trafil[k] = True
            rid[sy, sx] = np.where(rr == 0, k + 1, rr)
    for k in np.nonzero(trafil)[0]:
        for iy, ix in slad[k]: ext[iy, ix] = True   # przedłużenie, które w nic nie trafiło, nie jest granicą
    return keep | ext, gory, rzeki

def komorki(sciany, ink, z_oceanem=True):  # w wycinku brzeg obrazu leży na lądzie, więc bez oceanu
    # ocean liczony od WSZYSTKICH kresek (w ścianach nie ma gór, a góry dochodzą do wybrzeża — ocean wlałby się w ląd)
    dw = ndi.gaussian_filter(ndi.distance_transform_edt(~ink), 2 / (SK / 2))
    lab, _ = ndi.label(dw > OCEAN)
    brzeg = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    ocean = np.isin(lab, brzeg[brzeg > 0]) & z_oceanem
    lab, _ = ndi.label(~ndi.binary_dilation(ink, iterations=ZAMKNIJ))   # wąskie cieśniny
    brzeg = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    ocean |= np.isin(lab, brzeg[brzeg > 0]) & z_oceanem
    del lab, dw
    # ocean też jest ścianą: wybrzeże przy górach wypada ze ścian (maska gór), a wtedy ocean zalałby komórkę
    d = ndi.gaussian_filter(ndi.distance_transform_edt(~(sciany | ocean)), 2 / (SK / 2))
    mk = ndi.label(h_maxima(d, H) & ~ocean & ~ndi.binary_dilation(sciany, iterations=2))[0]
    mk[ocean] = mk.max() + 1
    w = watershed(-d, mk)
    w[w == w.max()] = 0
    return w

def podziel_gorami(w, gory):
    """Łańcuch gór bywa granicą (bez kresek, z przerwami między szczytami). W komórce z górami robię wododział na odległości
    od gór i dzielę ją tylko wtedy, gdy powstają co najmniej dwie duże części (> GORY_CZESC mediany pola komórek);
    drobne kawałki między szczytami wracają do sąsiednich dużych części."""
    pole = np.bincount(w.ravel()); prog = GORY_CZESC * np.median(pole[1:][pole[1:] > 0])
    nast = int(w.max()) + 1
    for k, s in enumerate(ndi.find_objects(w), 1):
        if s is None or not gory[s].any(): continue
        kom = w[s] == k
        d = ndi.gaussian_filter(ndi.distance_transform_edt(~(gory[s] | ~kom)), 2 / (SK / 2))
        mk = ndi.label(h_maxima(d, H) & kom)[0]
        if mk.max() < 2: continue
        ws = watershed(-d, mk, mask=kom)
        duze = [c for c, a in enumerate(ndi.sum(kom, ws, range(1, mk.max() + 1)), 1) if a > prog]
        if len(duze) < 2: continue
        ws = watershed(-d, np.where(np.isin(mk, duze), mk, 0), mask=kom)
        for c in duze[1:]:
            w[s][ws == c] = nast; nast += 1
    return w

def scal_skrawki_gor(w, gory, znaki):
    """Skrawki w pasmach gór (decyzja użytkownika: dołączyć do sąsiadów): komórka bez numeru, w większości w strefie gór,
    na lądzie z numerami (większość sąsiadów ma numer) → do sąsiada z numerem i najdłuższą wspólną granicą.
    Numer = grupa znaków (cyfry/napisy, nie przy górach) z odpowiednią ilością tuszu i rozmiarem."""
    znak = znaki & ~ndi.binary_dilation(gory, iterations=px(60))
    gr, n = ndi.label(ndi.binary_dilation(znak, iterations=px(24)))
    idx = np.arange(1, n + 1)
    tusz = ndi.sum(znak, gr, idx)
    # numer: dość tuszu, nie za mały, niski (wysokość cyfr ok. 100–150 px) — wyższe grupy to kawałki gór poza maską
    duze = [i for i, s in enumerate(ndi.find_objects(gr), 1) if tusz[i - 1] >= 120 * (2 / SK) ** 2
            and max(s[0].stop - s[0].start, s[1].stop - s[1].start) >= px(80) and s[0].stop - s[0].start <= px(220)]
    pole = np.bincount(w.ravel())
    kom = ndi.labeled_comprehension(w, gr, duze, lambda v: np.bincount(v).argmax(), np.int64, 0) if duze else np.array([], np.int64)
    numer = np.bincount(kom, minlength=len(pole)) > 0
    gorzyste = np.bincount(w[ndi.binary_dilation(gory, iterations=px(120))], minlength=len(pole))
    skrawki = {k for k in range(1, len(pole)) if pole[k] and not numer[k] and gorzyste[k] / pole[k] >= 0.5}
    def sasiedzi(k):
        s = tuple(slice(max(0, a.start - 2), a.stop + 2) for a in ndi.find_objects((w == k).astype(np.uint8))[0])
        m = w[s] == k; c = np.bincount(w[s][ndi.binary_dilation(m) & ~m]); c[0] = 0; c[k:k + 1] = 0
        return c
    def na_ladzie_z_numerami(k):   # sąsiednie skrawki się nie liczą
        inni = [x for x in np.nonzero(sasiedzi(k))[0] if x not in skrawki]
        return bool(inni) and numer[inni].mean() >= 0.5
    skrawki = {k for k in skrawki if na_ladzie_z_numerami(k)}
    for _ in range(5):   # skrawek otoczony tylko skrawkami czeka, aż sąsiad dostanie numer
        for k in sorted(skrawki):
            c = sasiedzi(k); c[[x for x in range(len(c)) if not numer[x]]] = 0
            if c.any(): w[w == k] = c.argmax(); skrawki.discard(k)
    print("skrawków gór dołączonych; zostało:", len(skrawki))
    return w

def scal_male(w):
    """Okruchy (pole < OKRUCH, bez styku z oceanem — małe wyspy zostają) dołączam do sąsiada z najdłuższą wspólną granicą."""
    pole = np.bincount(w.ravel())
    for k in np.nonzero((pole > 0) & (pole < OKRUCH))[0]:
        if k == 0: continue
        s = ndi.find_objects((w == k).astype(np.uint8))[0]
        s = tuple(slice(max(0, a.start - 2), a.stop + 2) for a in s)
        kom = w[s] == k
        sas = w[s][ndi.binary_dilation(kom) & ~kom]
        if (sas == 0).any() or not len(sas): continue
        w[s][kom] = np.bincount(sas).argmax()
    return w

def obiekty(w, lab, typ, gory, rzeki):
    """Jeziora (komórki), rzeki i góry (maski). Jezioro: brzeg w JEZIORO_BRZEG z ciągłej linii (nie z kresek) i bez styku z oceanem.
    Rzeki wykrywa rzeki_z_linii (tu tylko je przyjmuję)."""
    linie = (typ[lab] == 2) & ~gory
    przy_linii = ndi.binary_dilation(typ[lab] == 2, iterations=px(16))   # brzeg jeziora bywa przy górach
    jeziora = []
    for k, s in enumerate(ndi.find_objects(w), 1):
        if s is None: continue
        s2 = tuple(slice(max(0, a.start - 3), a.stop + 3) for a in s)
        kom = w[s2] == k
        brzeg = kom & ~ndi.binary_erosion(kom)
        sasiad = ndi.binary_dilation(kom, iterations=3) & ~kom
        if kom.sum() < JEZIORO_POLE or not brzeg.sum() or (w[s2][sasiad] == 0).any() or przy_linii[s2][brzeg].mean() <= JEZIORO_BRZEG: continue
        srodek = ndi.binary_erosion(kom, iterations=px(60))
        if srodek.any() and (lab[s2][srodek] > 0).mean() < 0.006:   # w środku jeziora nie ma cyfr, kresek ani gór (wpadająca rzeka to ok. 0.004)
            jeziora.append(k)
    strefa = ndi.binary_dilation(gory, iterations=px(40))
    pole = np.bincount(w.ravel(), minlength=int(w.max()) + 1)
    gorzyste = np.bincount(w[strefa], minlength=int(w.max()) + 1)
    procent = {int(k): round(float(gorzyste[k] / pole[k]), 2) for k in np.nonzero(gorzyste)[0] if k and pole[k] and gorzyste[k] / pole[k] >= 0.1}
    return jeziora, procent

if __name__ == "__main__":
    okno = tuple(map(int, sys.argv[1:5])) if len(sys.argv) > 4 else None
    ink = wczytaj(okno)
    sk = skeletonize(ink); konce, rozg = wezly(sk)
    lab, typ = rodzaje(ink, sk, konce)
    sciany, gory, rzeki = siatka(ink, lab, typ, sk, konce, rozg)
    w = scal_male(scal_skrawki_gor(podziel_gorami(komorki(sciany, ink, not okno), gory), gory, typ[lab] == 3))
    n = int(w.max()); assert n < 65536
    jeziora, procent = obiekty(w, lab, typ, gory, rzeki)
    if not okno:
        import json
        Image.fromarray(w.astype(np.uint16)).save("materialy/mapa/komorki_2.png")
        warstwy = np.zeros(w.shape + (3,), np.uint8); warstwy[..., 0] = rzeki * 255; warstwy[..., 1] = gory * 255
        Image.fromarray(warstwy).save("materialy/mapa/warstwy_2.png")   # R = rzeki, G = góry
        json.dump({"opis": "id komórek z komorki_2.png; gory = udział obszaru gór w komórce (od 0.1)", "jeziora": jeziora, "gory": procent},
                  open("materialy/mapa/obiekty.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("jezior:", len(jeziora), "komórek z górami:", len(procent))
    kol = np.array([[int(255 * c) for c in colorsys.hsv_to_rgb((i * 0.618) % 1, 0.45 + 0.15 * (i % 3), 0.95 - 0.25 * (i % 2))] for i in range(n + 1)], np.uint8)
    kol[0] = (20, 30, 60)
    kol[jeziora] = (60, 110, 200)
    img = kol[w]; img[ink] = (90, 90, 90); img[sciany & ~ink] = (150, 0, 0); img[ndi.binary_dilation(rzeki, iterations=2)] = (0, 90, 255); img[gory] = (120, 70, 20)
    Image.fromarray(img).resize((1000, 1000), Image.NEAREST).save("materialy/mapa/podglad.png" if not okno else "materialy/mapa/podglad_okno.png")
    print("komórek:", n)
