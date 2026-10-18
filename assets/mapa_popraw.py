# Poprawki komórek po mapa_komorki.py: python assets/mapa_popraw.py <numery.json>   (kilka minut)
#   1) cienkie pasy (linia brzegu, koryta rzek doklejone do komórek) → do najbliższej komórki;
#   2) komórka z dwoma numerami daleko od siebie (dwa obszary zlane w jeden) → podział wododziałem od numerów.
# numery.json: [{"y": , "x": , "n": "12"}] — środki odczytanych numerów w skali 1/2 (odczyt ręczny z rysunku).
# Nadpisuje materialy/mapa/komorki_2.png; potem python assets/mapa_edytor_dane.py. Stare edycje z edytora przestają pasować.
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.segmentation import watershed
from skimage.morphology import disk

Image.MAX_IMAGE_PIXELS = None
PAS = 10          # promień (px w 1/2): część komórki węższa niż 2*PAS to pas
ODSTEP = 60       # numery dalej od siebie niż tyle (px w 1/2) = osobne obszary (skupiska cyfr są już sklejone)

def bez_pasow(w):
    # rdzeń = otwarcie każdej komórki dyskiem (erozja: piksel, wokół którego jest tylko ta komórka; potem dylatacja w obrębie komórki)
    s = disk(PAS)
    wn = ndi.minimum_filter(w, footprint=s); wx = ndi.maximum_filter(w, footprint=s)
    wn = np.where((wn == wx) & (w > 0), w, 0); del wx
    rdzen = ndi.grey_dilation(wn, footprint=s); del wn
    rdzen = np.where(rdzen == w, w, 0)
    pas = (w > 0) & (rdzen == 0)
    _, (iy, ix) = ndi.distance_transform_edt(rdzen == 0, return_indices=True)
    w = np.where(pas, rdzen[iy, ix], w)
    print("pikseli pasów:", int(pas.sum()))
    # z pasa zostają czasem szersze kawałki daleko od reszty komórki: zostaje tylko największy kawałek każdej komórki
    obce = np.zeros(w.shape, bool)
    for k, s in enumerate(ndi.find_objects(w), 1):
        if s is None: continue
        lab, n = ndi.label(w[s] == k)
        if n > 1:
            duzy = np.bincount(lab.ravel())[1:].argmax() + 1
            obce[s] |= (lab > 0) & (lab != duzy)
    _, (iy, ix) = ndi.distance_transform_edt(obce | (w == 0), return_indices=True)
    w = np.where(obce, w[iy, ix], w)
    print("pikseli odciętych kawałków:", int(obce.sum()))
    return w

def odetnij_od_jezior(w, punkty, ink):
    """Komórka lądu zlana z jeziorem (brzeg jeziora nie stał się granicą): punkty = [(y, x) w jeziorze, (y, x) na lądzie];
    wododział po kreskach (bez zwartości), więc podział idzie linią brzegu."""
    for (jy, jx), (ly, lx) in punkty:
        k = w[jy, jx]; s = ndi.find_objects((w == k).astype(np.uint8))[0]; kom = w[s] == k
        mk = np.zeros(kom.shape, np.int32)
        for j, (y, x) in enumerate([(jy, jx), (ly, lx)], 1): mk[y - s[0].start - 10:y - s[0].start + 11, x - s[1].start - 10:x - s[1].start + 11] = j
        mk[ink[s]] = 0
        ws = watershed(ndi.gaussian_filter(ink[s].astype(np.float32), 2), mk * kom, mask=kom)
        w[s][ws == 2] = int(w.max()) + 1
        print("odcięty ląd od jeziora", k)
    return w

def rozdziel(w, numery, ink):
    nast = int(w.max()) + 1
    d = ndi.distance_transform_edt(~ink)
    for k, s in enumerate(ndi.find_objects(w), 1):
        if s is None: continue
        pkt = [(p["y"], p["x"]) for p in numery if s[0].start <= p["y"] < s[0].stop and s[1].start <= p["x"] < s[1].stop and w[p["y"], p["x"]] == k]
        # skupiska numerów (bliższe niż ODSTEP to ten sam napis)
        sk = []
        for y, x in pkt:
            for g in sk:
                if np.hypot(y - g[0][0], x - g[0][1]) < ODSTEP: g.append((y, x)); break
            else: sk.append([(y, x)])
        if len(sk) < 2: continue
        kom = w[s] == k; mk = np.zeros(kom.shape, np.int32)
        for j, g in enumerate(sk, 1):
            # ziarno = puste miejsce wokół numeru (na samych cyfrach ziarno zalewa tylko okruch)
            y, x = np.mean(g, 0).astype(int); mk[max(0, y - s[0].start - 15):y - s[0].start + 16, max(0, x - s[1].start - 15):x - s[1].start + 16] = j
        mk[d[s] < 2] = 0
        # zwarty wododział: podział jak „najbliższy numer”, ale przyciągany do kresek (przerywana granica między numerami)
        ws = watershed(ndi.gaussian_filter(ink[s].astype(np.float32), 3), mk * kom, mask=kom, compactness=0.01)
        for j in range(2, len(sk) + 1):
            w[s][ws == j] = nast; nast += 1
        print("podzielona komórka", k, "na", len(sk))
    return w

if __name__ == "__main__":
    numery = json.load(open(sys.argv[1], encoding="utf-8"))
    w = np.array(Image.open("materialy/mapa/komorki_2.png")).astype(np.int32)
    w = bez_pasow(w)
    ink = np.array(Image.open("materialy/Mapa RPG.png").convert("L").reduce(2)) < 128
    w = rozdziel(w, numery, ink)
    w = odetnij_od_jezior(w, [((7390, 2140), (7416, 1711))], ink)   # prowincja 310 przy jeziorze (lewy dolny kontynent)
    assert w.max() < 65536
    Image.fromarray(w.astype(np.uint16)).save("materialy/mapa/komorki_2.png")
    print("komórek:", len(np.unique(w)) - 1)
