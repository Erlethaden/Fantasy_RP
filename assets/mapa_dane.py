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
P = lut[w][1::2, 1::2]
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
