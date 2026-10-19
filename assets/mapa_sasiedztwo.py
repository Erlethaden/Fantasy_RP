# Sąsiedztwo prowincji i typ granic (6.0b): python assets/mapa_sasiedztwo.py
#   wejście:  materialy/mapa/komorki_final.png (z edytora, 1/4, id = R*256+G), prowincje.json, gory_final.png (1/4), warstwy_2.png (R = rzeki, 1/2)
#   wyjście:  materialy/mapa/sasiedztwo.json — prowincje (komórki, środek, pole) i granice [a, b, typ, długość, udział gór, udział rzeki]
#             materialy/mapa/podglad_granice.png — granice: szare zwykłe, brązowe góry, niebieskie rzeki
# Prowincje bez numeru (dolne kontynenty: każda komórka = prowincja) dostają id „D1”, „D2”… (od góry, od lewej).
# Typ granicy: „góry” / „rzeka”, gdy większość jej długości (BLOK) biegnie przy górach / rzece; inaczej „zwykła”.
import json, collections
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
M = "materialy/mapa/"
PRZY_GORACH, PRZY_RZECE = 28, 6   # odległość (px w 1/4) od pasma gór / linii rzeki: pasmo gór leży zwykle obok kreski granicy, w jednej z prowincji
PASMO = 16                        # domknięcie kresek gór w pasmo (maska ma tylko kontury szczytów, w środku pusto)
BLOK = 0.5
MIN_DL = 4                        # krótsze styki (sam narożnik) to nie granica

def wczytaj():
    k = np.array(Image.open(M + "komorki_final.png").convert("RGB")).astype(np.int32)
    w = k[..., 0] * 256 + k[..., 1]
    p = json.load(open(M + "prowincje.json", encoding="utf-8"))
    gory = np.array(Image.open(M + "gory_final.png").convert("L")) > 127
    gory = ndi.binary_fill_holes(ndi.binary_erosion(ndi.binary_dilation(gory, iterations=PASMO), iterations=PASMO, border_value=1))
    rz = np.array(Image.open(M + "warstwy_2.png"))[..., 0] > 0
    rzeki = rz.reshape(w.shape[0], 2, w.shape[1], 2).max((1, 3))
    return w, p, gory, rzeki

def prowincje_komorek(w, p):
    """id komórki → id prowincji. Każdy obszar to osobna prowincja (użytkownik 2026-10-18 — wcześniej zakładaliśmy 2 obszary na prowincję):
    numer z rysunku z dwoma obszarami → „<n>a” i „<n>b” (a = wyżej, przy remisie bardziej z lewej); komórki lądu bez numeru → „D<n>”."""
    jez = set(p["jeziora"])
    ids = np.unique(w); ids = ids[(ids > 0)]
    srodki = dict(zip(map(int, ids), ndi.center_of_mass(np.ones_like(w), w, ids)))
    kom = {}
    # 7.6e: po poprawkach komórek środek może się przesunąć — litery przypięte, żeby id (i zapisane dane gry) zostały te same
    litery = json.load(open(M + "poprawki.json", encoding="utf-8")).get("litery", {})
    for n, cs in p["prowincje"].items():
        cs = litery.get(n) or sorted(map(int, cs), key=lambda c: (round(srodki[c][0] / 250), srodki[c][1]))
        for k, c in enumerate(cs): kom[c] = n if len(cs) == 1 else n + "ab"[k]
    srodki = [srodki[int(c)] for c in ids]
    bez = sorted((int(round(y / 250)), x, int(c)) for c, (y, x) in zip(ids, srodki) if int(c) not in kom and int(c) not in jez)
    for i, (_, _, c) in enumerate(bez, 1): kom[c] = f"D{i}"
    return kom, jez

def granice(w, kom, gory, rzeki):
    blisko_g = ndi.distance_transform_edt(~gory) <= PRZY_GORACH
    blisko_r = ndi.distance_transform_edt(~rzeki) <= PRZY_RZECE
    lut = np.zeros(w.max() + 1, np.int32); nazwy = sorted(set(kom.values()), key=lambda n: (n[0] == "D", int(n.lstrip("D").rstrip("ab")), n))
    nr = {n: i + 1 for i, n in enumerate(nazwy)}
    for c, n in kom.items(): lut[c] = nr[n]
    P = lut[w]   # 0 = ocean albo jezioro
    dl, ug, ur = collections.Counter(), collections.Counter(), collections.Counter()
    for a, b, sl in ((P[:, :-1], P[:, 1:], (slice(None), slice(None, -1))), (P[:-1], P[1:], (slice(None, -1), slice(None)))):
        m = (a != b) & (a > 0) & (b > 0)
        para = np.minimum(a, b)[m].astype(np.int64) * 100000 + np.maximum(a, b)[m]
        g, r = blisko_g[sl][m], blisko_r[sl][m]
        for key, cnt in zip(*np.unique(para, return_counts=True)): dl[key] += cnt
        for key, cnt in zip(*np.unique(para[g], return_counts=True)): ug[key] += cnt
        for key, cnt in zip(*np.unique(para[r], return_counts=True)): ur[key] += cnt
    wynik = []
    for key, d in dl.items():
        if d < MIN_DL: continue
        a, b = nazwy[key // 100000 - 1], nazwy[key % 100000 - 1]
        fg, fr = ug[key] / d, ur[key] / d
        typ = "rzeka" if fr >= BLOK and fr >= fg else "góry" if fg >= BLOK else "zwykła"
        wynik.append([a, b, typ, int(d), round(fg, 2), round(fr, 2)])
    return P, nazwy, sorted(wynik, key=lambda g: (nr[g[0]], nr[g[1]]))

def podglad(P, nazwy, gr, gory, rzeki):
    t = np.array(Image.open(M + "edytor/tlo.png"))
    img = np.stack([t] * 3, -1)
    img = (img * 0.5 + 127).astype(np.uint8)
    img[gory] = (200, 170, 130)
    nr = {n: i + 1 for i, n in enumerate(nazwy)}
    kol = {"zwykła": (60, 60, 60), "góry": (150, 70, 0), "rzeka": (0, 90, 255)}
    typ = {}
    for a, b, t_, *_ in gr: typ[(nr[a], nr[b])] = typ[(nr[b], nr[a])] = t_
    for a, b in ((P[:, :-1], P[:, 1:]), (P[:-1], P[1:])):
        m = (a != b) & (a > 0) & (b > 0)
        ys, xs = np.nonzero(m)
        for t_, c in kol.items():
            sel = np.array([typ.get((int(p), int(q))) == t_ for p, q in zip(a[m], b[m])], bool)
            yy, xx = ys[sel], xs[sel]
            for dy in (0, 1):
                for dx in (0, 1): img[np.minimum(yy + dy, P.shape[0] - 1), np.minimum(xx + dx, P.shape[1] - 1)] = c
    img[(P == 0) & (img.sum(-1) > 600)] = (225, 235, 250)
    Image.fromarray(img).save(M + "podglad_granice.png", optimize=True)

if __name__ == "__main__":
    w, p, gory, rzeki = wczytaj()
    kom, jez = prowincje_komorek(w, p)
    P, nazwy, gr = granice(w, kom, gory, rzeki)
    pole = np.bincount(P.ravel(), minlength=len(nazwy) + 1)
    sr = ndi.center_of_mass(np.ones_like(P), P, range(1, len(nazwy) + 1))
    po = collections.defaultdict(list)
    for c, n in kom.items(): po[n].append(c)
    prow = {n: {"komorki": sorted(po[n]), "srodek": [round(x), round(y)], "pole": int(pole[i + 1])} for i, (n, (y, x)) in enumerate(zip(nazwy, sr))}
    json.dump({"opis": "skala 1/4 (5000x5000) jak komorki_final.png; granice: [a, b, typ, długość px, udział przy górach, udział przy rzece]; "
               "typ: zwykła | góry | rzeka (mosty stawia GM w grze); każdy obszar = prowincja: <n>a/<n>b = dwa obszary z tym samym numerem z rysunku, D<n> = dolne kontynenty bez numeru",
               "jeziora": sorted(jez), "prowincje": prow, "granice": gr}, open(M + "sasiedztwo.json", "w", encoding="utf-8"), ensure_ascii=False)
    sasiedzi = collections.Counter([g[0] for g in gr] + [g[1] for g in gr])
    print("prowincji:", len(nazwy), "(bez numeru:", sum(n[0] == "D" for n in nazwy), ") granic:", len(gr), dict(collections.Counter(g[2] for g in gr)))
    print("bez sąsiadów (wyspy):", [n for n in nazwy if n not in sasiedzi])
    podglad(P, nazwy, gr, gory, rzeki)
