# Dane mapy do programu (6.1): python assets/mapa_dane.py  (po mapa_sasiedztwo.py)
#   assets/mapa/prowincje.png  — mapa numerów prowincji w skali 1/8 (2500x2500): indeks = R*256 + G (0 = woda), indeks z prowincje.json
#   assets/mapa/prowincje.json — [{id, x, y (środek w px mapa.png, 5000x5000), ramka [x0, y0, x1, y1] w px prowincje.png, sasiedzi [[indeks, typ]]}]
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

M = "materialy/mapa/"
d = json.load(open(M + "sasiedztwo.json", encoding="utf-8"))
nazwy = list(d["prowincje"])
nr = {n: i + 1 for i, n in enumerate(nazwy)}
k = np.array(Image.open(M + "komorki_final.png").convert("RGB")).astype(np.int32)
w = k[..., 0] * 256 + k[..., 1]
lut = np.zeros(w.max() + 1, np.uint16)
for n, p in d["prowincje"].items():
    for c in p["komorki"]: lut[c] = nr[n]
# 1/8: najczęstsza prowincja w bloku 2x2 skali 1/4 ≈ próbka ze środka bloku (granice i tak są tu ±1 px)
P = lut[w][1::2, 1::2].astype(np.int32)
# pasma gór to ziemia niczyja bez koloru i bez kliknięcia (użytkownik 2026-10-18: prowincje „wyciągały się” po górach);
# sąsiedztwo przez góry zostaje w prowincje.json (typ „góry”). Pasmo = kontury szczytów domknięte jak w mapa_sasiedztwo.py.
g = np.array(Image.open(M + "gory_final.png").convert("L")) > 127
# Pasmo gór (skala 1/4): maska gór (kontury szczytów) + kreski zboczy z nią połączone (tylko blisko niej — bez wybrzeża) →
# domknięcie pionowe (wnętrze „Λ” do końca zboczy) i poziome (dolinki między szczytami) → wypełnienie dziur.
GORY_R = 10   # px (1/8) promień domknięcia pasma (wygładzenie, dolinki między szczytami)
ink = np.array(Image.open("assets/mapa/mapa.png").convert("L")) < 128
blisko = ndi.binary_dilation(g, iterations=30)
lab, _ = ndi.label(ink & blisko, structure=np.ones((3, 3)))
zbocza = np.isin(lab, np.unique(lab[g & ink])[1:])
pasmo = (g | zbocza).reshape(2500, 2, 2500, 2).max((1, 3))           # 1/4 → 1/8
# wnętrze szczytu „Λ”: punkt, który ma kreskę gór nad sobą oraz z lewej i z prawej (w odległości W) — całe trójkąty do podstawy
def odl_od_kreski(m, os, wstecz):   # odległość do najbliższego piksela m w jednym kierunku wzdłuż osi
    n = m.shape[os]; i = np.arange(n).reshape((-1, 1) if os == 0 else (1, -1))
    if wstecz: m = np.flip(m, os)
    ost = np.maximum.accumulate(np.where(m, i, -10 ** 6), axis=os)
    d = i - ost
    return np.flip(d, os) if wstecz else d
W = 45
wnetrze = (odl_od_kreski(pasmo, 1, False) <= W) & (odl_od_kreski(pasmo, 1, True) <= W) & (odl_od_kreski(pasmo, 0, False) <= W)
pasmo |= wnetrze
# domknięcie okrągłym pędzlem: wypełnia wnętrza szczytów „Λ” aż do podstawy i dolinki między nimi, brzegi gładkie (bez prostokątów)
R = GORY_R
yy, xx = np.mgrid[-R:R + 1, -R:R + 1]; dysk = yy ** 2 + xx ** 2 <= R * R
pasmo = ndi.binary_erosion(ndi.binary_dilation(np.pad(pasmo, R + 1), dysk), dysk)[R + 1:-R - 1, R + 1:-R - 1]
# wypełniamy tylko małe dziury (wnętrza szczytów); duża dziura to dolina otoczona górami — zostaje lądem
dziury, n = ndi.label(ndi.binary_fill_holes(pasmo) & ~pasmo)
male = np.bincount(dziury.ravel()) < 4000; male[0] = False
pasmo |= male[dziury]
g = pasmo
P0 = P.copy()
pole = np.bincount(P.ravel(), minlength=len(nazwy) + 1)
zostaje = np.bincount(P[~g], minlength=len(nazwy) + 1)
cale_w_gorach = (pole > 0) & (zostaje < 0.15 * pole)   # prowincja prawie cała w górach — zostaje w całości, żeby dało się ją kliknąć
P = np.where(g & ~cale_w_gorach[P], 0, P)
# prowincja rozcięta pasmem: zostaje część najbliższa napisom z rysunku leżącym w jej pierwotnym obszarze (numer; doklejone
# wcześniej skrawki gór napisów nie mają), a bez napisów — największa; odcięte kawałki też są ziemią niczyją
napisy = np.array(json.load(open(M + "napisy.json", encoding="utf-8"))["pkt"]) // 4          # 1/2 → 1/8
napisy = napisy[(napisy[:, 0] < P0.shape[0]) & (napisy[:, 1] < P0.shape[1])]
napis_prow = P0[napisy[:, 0], napisy[:, 1]]
for i, s in enumerate(ndi.find_objects(P), 1):
    if s is None: continue
    lab, n = ndi.label(P[s] == i)
    if n < 2: continue
    rozm = np.bincount(lab.ravel()); rozm[0] = 0
    pkt = napisy[napis_prow == i] - [s[0].start, s[1].start]
    if len(pkt):
        yy, xx = np.nonzero(lab)
        odl = np.min([np.hypot(yy - py, xx - px) for py, px in pkt], axis=0)
        duzy = lab[yy[odl.argmin()], xx[odl.argmin()]]
    else:
        duzy = rozm.argmax()
    P[s][(lab > 0) & (lab != duzy)] = -1   # odcięte kawałki — rozdane niżej
# odcięte kawałki (bez gór) → do sąsiedniej prowincji z najdłuższą wspólną granicą; otoczone samymi górami → ziemia niczyja

kaw, n = ndi.label(P == -1)
for k, s in enumerate(ndi.find_objects(kaw), 1):
    s = tuple(slice(max(0, a.start - 1), a.stop + 1) for a in s)
    m = kaw[s] == k
    brzeg = ndi.binary_dilation(m) & ~m
    sas = P[s][brzeg]; sas = sas[sas > 0]
    # kawałek w dolince między szczytami (graniczy głównie z pasmem) zostaje ziemią niczyją — inaczej prowincja znów wchodzi w góry
    P[s][m] = np.bincount(sas).argmax() if len(sas) and g[s][brzeg].mean() < 0.5 else 0
P[P < 0] = 0
print("pikseli wyciętych (góry + odcięte kawałki):", int(((P0 > 0) & (P == 0)).sum()), "prowincji prawie całych w górach (zostają):", int(cale_w_gorach[1:].sum()))
rgb = np.zeros(P.shape + (3,), np.uint8); rgb[..., 0], rgb[..., 1] = P >> 8, P & 255
Image.fromarray(rgb).save("assets/mapa/prowincje.png", optimize=True)
sas = {n: [] for n in nazwy}
for a, b, typ, *_ in d["granice"]:
    sas[a].append([nr[b], typ]); sas[b].append([nr[a], typ])
ramki = ndi.find_objects(P)
wynik = []
for i, n in enumerate(nazwy):
    p, r = d["prowincje"][n], ramki[i]
    assert r is not None, n
    wynik.append({"id": n, "x": p["srodek"][0], "y": p["srodek"][1], "ramka": [r[1].start, r[0].start, r[1].stop, r[0].stop], "sasiedzi": sas[n]})
json.dump(wynik, open("assets/mapa/prowincje.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("prowincji:", len(wynik))

# granice prowincji do rysowania w programie (zamiast przerywanych kresek z rysunku, które nie zawsze zgadzały się z prowincjami):
# assets/mapa/granice.json = lista linii [x0, y0, x1, y1, …] w px mapa.png (5000²), tylko między dwiema prowincjami
# (wybrzeże, jeziora i góry są na rysunku). Kontury z wygładzonej maski w skali 1/4, uproszczone.
from skimage.measure import find_contours, approximate_polygon
P4 = np.repeat(np.repeat(P, 2, 0), 2, 1)
w4 = np.where(P4 > 0, lut[w], 0)          # 1/4: granice z komórek (gładsze), góry i wycięcia z P
inne = (P4 > 0) & (w4 != P4)
inne = ndi.binary_opening(inne, np.ones((3, 3), bool))   # kawałki przekazane sąsiadom (duże obszary), nie ząbki skali 1/8
w4[inne] = P4[inne]
linie = []
for i, s in enumerate(ndi.find_objects(w4), 1):
    if s is None: continue
    s = tuple(slice(max(0, a.start - 3), min(5000, a.stop + 3)) for a in s)
    blok = w4[s]; m = ndi.gaussian_filter((blok == i).astype(np.float32), 1.2)
    for c in find_contours(m, 0.5):
        # punkt należy do granicy z sąsiadem o większym indeksie (każda granica raz), a nie z wodą/górami
        yy = np.clip(np.round(c[:, 0]).astype(int), 0, blok.shape[0] - 1); xx = np.clip(np.round(c[:, 1]).astype(int), 0, blok.shape[1] - 1)
        ok = np.zeros(len(c), bool)
        for dy in (-2, 0, 2):
            for dx in (-2, 0, 2):
                v = blok[np.clip(yy + dy, 0, blok.shape[0] - 1), np.clip(xx + dx, 0, blok.shape[1] - 1)]
                ok |= v > i
        zero = np.zeros(len(c), bool)
        for dy in (-2, 0, 2):
            for dx in (-2, 0, 2):
                zero |= blok[np.clip(yy + dy, 0, blok.shape[0] - 1), np.clip(xx + dx, 0, blok.shape[1] - 1)] == 0
        ok &= ~zero
        # kolejne odcinki punktów „ok” → osobne linie
        kraw = np.flatnonzero(np.diff(np.r_[0, ok.astype(np.int8), 0]))
        for a, b in zip(kraw[::2], kraw[1::2]):
            if b - a < 3: continue
            seg = approximate_polygon(c[a:b], 0.6)
            linie.append([round(float(v), 1) for y, x in seg for v in (x + s[1].start, y + s[0].start)])
json.dump(linie, open("assets/mapa/granice.json", "w"), separators=(",", ":"))
print("linii granic:", len(linie), "punktów:", sum(len(l) for l in linie) // 2)
