# Kontrola po przegenerowaniu mapy (7.6e): python assets/mapa_kontrola.py <wynik.json>  (po mapa_dane.py)
#   wypisuje pary (od, do): prowincje, którym mapa_dane.py oddało sąsiadowi > 400 px (1/8) — rozcięte górami; obejrzeć, czy został kawałek z numerem
import json, numpy as np
from PIL import Image
M = "materialy/mapa/"
d = json.load(open(M + "sasiedztwo.json", encoding="utf-8")); nazwy = list(d["prowincje"]); nr = {n: i + 1 for i, n in enumerate(nazwy)}
k = np.array(Image.open(M + "komorki_final.png").convert("RGB")).astype(np.int32); w = k[..., 0] * 256 + k[..., 1]
lut = np.zeros(w.max() + 1, np.int32)
for n, p in d["prowincje"].items():
    for c in p["komorki"]: lut[c] = nr[n]
P0 = lut[w][1::2, 1::2]
P = np.array(Image.open("assets/mapa/prowincje.png").convert("RGB")).astype(np.int32); P = P[..., 0] * 256 + P[..., 1]
N = len(nazwy) + 1
pole0 = np.bincount(P0.ravel(), minlength=N); pole = np.bincount(P.ravel(), minlength=N)
wlasne = np.bincount(P0[(P == P0)].ravel(), minlength=N)
obce = pole - wlasne
# komu oddano: największy odbiorca pikseli prowincji i
m = (P0 > 0) & (P > 0) & (P != P0)
pary = {}
for a, b in zip(P0[m], P[m]): pary[(a, b)] = pary.get((a, b), 0) + 1
wynik = []
for (a, b), ile in pary.items():
    if ile > 400: wynik.append((ile, nazwy[a - 1], nazwy[b - 1], int(pole0[a]), int(wlasne[a])))
wynik.sort(reverse=True)
print("oddane > 400 px (1/8): ile, od, do, pole komórki, zostało")
for r in wynik: print(" ", r)
json.dump([[r[1], r[2]] for r in wynik], open(__import__("sys").argv[1], "w"))
