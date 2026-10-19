# Akweny morskie (7.8a): python assets/mapa_akweny.py  (po mapa_dane.py i mapa_teren.py — dopisuje akweny do prowincje.png; mapa_dane.py je kasuje, więc potem znowu ten skrypt)
#   assets/mapa/prowincje.png        — akweny jako indeksy N+1…N+M (N = liczba prowincji), jeziora i ląd bez zmian
#   assets/mapa/akweny.json          — [{id "A1"…, typ "morze" | "jezioro", x, y (środek, px mapa.png 5000²), ramka [x0, y0, x1, y1] (px 2500²),
#                                       sasiedzi [[nr akwenu 1…, "morze" | "rzeka"]], brzeg [indeks prowincji 1…]}]
#   jezioro = woda oznaczona w edytorze jako jezioro; „rzeka” = akweny połączone tą samą rzeką (materialy/mapa/rzeki_2500.png z mapa_teren.py).
#   Wpłynięcie do jeziora i żegluga rzeką wymagają umiejętności frakcji (jak góry dla armii).
#   assets/mapa/akweny_granice.json  — linie [x0, y0, x1, y1, …] (px mapa.png) między akwenami
# Woda (ocean i „jeziora” z edytora — to w dużej części morza śródlądowe) dzielona na ok. 120 akwenów podobnej wielkości: k-średnie na
# pikselach wody, potem wzrost od środków tylko po wodzie (akwen nie przeskakuje przez ląd, cieśniny i zatoki rozdzielają się same);
# za małe akweny dołączone do sąsiada. Jeziora mniejsze niż MIN_JEZ px (1/8) bez akwenów.
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.cluster.vq import kmeans2
from skimage.measure import find_contours, approximate_polygon

M, N, ILE, MIN_JEZ = "materialy/mapa/", 2500, 120, 12000
L = json.load(open("assets/mapa/prowincje.json", encoding="utf-8")); NP = len(L)
P = np.array(Image.open("assets/mapa/prowincje.png").convert("RGB")).astype(np.int32); P = P[..., 0] * 256 + P[..., 1]
P[P > NP] = 0   # ponowne uruchomienie: stare akweny precz
k = np.array(Image.open(M + "komorki_final.png").convert("RGB")).astype(np.int32); k = (k[..., 0] * 256 + k[..., 1])[1::2, 1::2]
ocean = (P == 0) & ~np.isin(k, [c for p in json.load(open(M + "sasiedztwo.json", encoding="utf-8"))["prowincje"].values() for c in p["komorki"]])
lab, _ = ndi.label(ocean); ocean &= (np.bincount(lab.ravel()) >= MIN_JEZ)[lab]   # małe jeziora precz
jezioro = np.isin(k, json.load(open(M + "sasiedztwo.json", encoding="utf-8"))["jeziora"])

ys, xs = np.nonzero(ocean[::6, ::6]); pkt = np.stack([ys * 6, xs * 6], 1).astype(float)
srodki, _ = kmeans2(pkt, ILE, seed=7, minit="++")
_, (iy, ix) = ndi.distance_transform_edt(~ocean, return_indices=True)   # środek na lądzie → najbliższa woda
A = np.zeros((N, N), np.int32)
for i, (y, x) in enumerate(srodki.astype(int), 1):
    y, x = np.clip(y, 0, N - 1), np.clip(x, 0, N - 1); A[iy[y, x], ix[y, x]] = i
while True:   # wzrost po wodzie (4-sąsiedztwo), przy remisie większy numer — bez znaczenia
    nowe = ndi.grey_dilation(A, footprint=[[0, 1, 0], [1, 1, 1], [0, 1, 0]]) * (ocean & (A == 0))
    if not nowe.any(): break
    A += nowe
reszta, ile = ndi.label(ocean & (A == 0)); A = np.where(reszta > 0, ILE + reszta, A); ILE += ile   # wody bez środka (osobne jeziora) — własny akwen
def pary(a):   # (akwen, akwen sąsiedni) → długość wspólnej granicy w px
    g = {}
    for x, y in ((a[:, :-1], a[:, 1:]), (a[:-1], a[1:])):
        m = (x > 0) & (y > 0) & (x != y)
        for u, v in zip(x[m], y[m]): g[(u, v)] = g.get((u, v), 0) + 1; g[(v, u)] = g.get((v, u), 0) + 1
    return g
pole = np.bincount(A.ravel(), minlength=ILE + 1)
for i in np.argsort(pole):   # najmniejsze najpierw: poniżej 40% średniej → do sąsiada z najdłuższą granicą
    if i == 0 or pole[i] == 0 or pole[i] >= 0.4 * pole[1:][pole[1:] > 0].mean(): continue
    g = pary(A); s = {v: n for (u, v), n in g.items() if u == i}
    if s: j = max(s, key=s.get); A[A == i] = j; pole[j] += pole[i]; pole[i] = 0
# ręczne podziały (poprawki.json „akweny_podziel”: punkty [x, y] w px 2500²) — akwen z tym punktem dzielony na dwa (k-średnie + wzrost w nim)
for x, y in json.load(open(M + "poprawki.json", encoding="utf-8")).get("akweny_podziel", []):
    i = A[y, x]
    if not i: print("podział: punkt", x, y, "poza akwenem"); continue
    m = A == i; yy, xx = np.nonzero(m); dwa, _ = kmeans2(np.stack([yy, xx], 1).astype(float), 2, seed=3, minit="++")
    B = np.zeros_like(A)
    for n, (cy, cx) in enumerate(dwa, 1): j = np.argmin((yy - cy) ** 2 + (xx - cx) ** 2); B[yy[j], xx[j]] = n
    while True:
        nowe = ndi.grey_dilation(B, footprint=[[0, 1, 0], [1, 1, 1], [0, 1, 0]]) * (m & (B == 0))
        if not nowe.any(): break
        B += nowe
    ILE += 1; A[B == 2] = ILE
pole = np.bincount(A.ravel(), minlength=ILE + 1)
stare = [i for i in range(1, ILE + 1) if pole[i]]
sr = {i: ndi.center_of_mass(A == i) for i in stare}
stare.sort(key=lambda i: (round(sr[i][0] / 250), sr[i][1]))   # numeracja od góry, od lewej
nr = {s: n for n, s in enumerate(stare, 1)}
lut = np.zeros(ILE + 1, np.int32); lut[stare] = [nr[s] for s in stare]; A = lut[A]
g = pary(A)
# połączenia rzeczne: akweny dotykające tej samej rzeki (sieć rzeczna to jedna składowa maski)
rz = np.array(Image.open(M + "rzeki_2500.png")) > 0
lab_rz, ile_rz = ndi.label(rz, np.ones((3, 3)))
przy = ndi.binary_dilation(A > 0, iterations=3) & (lab_rz > 0)
A_przy = ndi.grey_dilation(A, size=(7, 7))   # najbliższy akwen przy ujściu (rzeka nie wchodzi na wodę)
rzeczne = {}
for r, a in set(zip(lab_rz[przy].tolist(), A_przy[przy].tolist())):
    if a: rzeczne.setdefault(r, set()).add(a)
polaczone = set()
for zb in rzeczne.values():
    for u in zb:
        for v in zb:
            if u != v and (u, v) not in g: polaczone.add((u, v))
ramki = ndi.find_objects(A)
akweny = []
for n in range(1, len(stare) + 1):
    m = A == n; y, x = sr[stare[n - 1]]; y, x = int(y), int(x)
    if not m[y, x]: yy, xx = np.nonzero(m); j = np.argmin((yy - y) ** 2 + (xx - x) ** 2); y, x = int(yy[j]), int(xx[j])   # środek w wodzie akwenu
    s = ramki[n - 1]; s2 = tuple(slice(max(0, a.start - 4), a.stop + 4) for a in s)
    brzeg = np.unique(P[s2][ndi.binary_dilation(m[s2], iterations=3)]); brzeg = brzeg[(brzeg > 0) & (brzeg <= NP)]
    akweny.append({"id": f"A{n}", "typ": "jezioro" if jezioro[m].mean() > 0.5 else "morze", "x": x * 2, "y": y * 2, "ramka": [s[1].start, s[0].start, s[1].stop, s[0].stop],
                   "sasiedzi": sorted([int(v), "morze"] for (u, v) in g if u == n) + sorted([int(v), "rzeka"] for (u, v) in polaczone if u == n),
                   "brzeg": [int(b) for b in brzeg]})
# granice między akwenami: kontury masek, tylko odcinki stykające się z innym akwenem (nie z lądem)
linie = []
for n in range(1, len(stare) + 1):
    s = tuple(slice(max(0, a.start - 3), min(N, a.stop + 3)) for a in ramki[n - 1]); blok = A[s]
    for c in find_contours(ndi.gaussian_filter((blok == n).astype(np.float32), 1.0), 0.5):
        yy = np.clip(np.round(c[:, 0]).astype(int), 0, blok.shape[0] - 1); xx = np.clip(np.round(c[:, 1]).astype(int), 0, blok.shape[1] - 1)
        ok = np.zeros(len(c), bool); lad = np.zeros(len(c), bool)
        for dy in (-2, 0, 2):
            for dx in (-2, 0, 2):
                v = blok[np.clip(yy + dy, 0, blok.shape[0] - 1), np.clip(xx + dx, 0, blok.shape[1] - 1)]
                ok |= v > n; lad |= v == 0
        ok &= ~lad
        kraw = np.flatnonzero(np.diff(np.r_[0, ok.astype(np.int8), 0]))
        for a, b in zip(kraw[::2], kraw[1::2]):
            if b - a < 3: continue
            linie.append([round(float(v) * 2, 1) for y, x in approximate_polygon(c[a:b], 0.6) for v in (x + s[1].start, y + s[0].start)])
P = np.where(A > 0, NP + A, P)
rgb = np.zeros(P.shape + (3,), np.uint8); rgb[..., 0], rgb[..., 1] = P >> 8, P & 255
Image.fromarray(rgb).save("assets/mapa/prowincje.png", optimize=True)
json.dump(akweny, open("assets/mapa/akweny.json", "w", encoding="utf-8"), separators=(",", ":"))
json.dump(linie, open("assets/mapa/akweny_granice.json", "w"), separators=(",", ":"))
pola = [int((A == n).sum()) for n in range(1, len(stare) + 1)]
print("jezior:", sum(a["typ"] == "jezioro" for a in akweny), "połączeń rzecznych:", len(polaczone) // 2)
print("akwenów:", len(stare), "pole min/śr/max:", min(pola), sum(pola) // len(pola), max(pola), "bez brzegu:", sum(not a["brzeg"] for a in akweny), "linii:", len(linie))
