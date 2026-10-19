# Domyślne miejsca osad (6.2a): python assets/mapa_osady.py  (po mapa_dane.py; dopisuje pole "osady" do assets/mapa/prowincje.json)
# Każda prowincja: miasto + 2 wioski, w px mapa.png (5000x5000). Miasto = punkt najdalej od granic prowincji (z dala od gór i rzek,
# jeśli zostaje na to miejsce); wioski = kolejne punkty możliwie daleko od miasta i od siebie, ale nie przy samej granicy.
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

M = "materialy/mapa/"
P = json.load(open("assets/mapa/prowincje.json", encoding="utf-8"))
ind = np.array(Image.open("assets/mapa/prowincje.png").convert("RGB")).astype(np.int32)
ind = ind[..., 0] * 256 + ind[..., 1]                       # 2500x2500, indeks prowincji (1…)
S = 5000 / ind.shape[0]                                      # px obrazu indeksów → px mapa.png
g = np.array(Image.open(M + "gory_final.png").convert("L")) > 127
g = ndi.binary_dilation(g, iterations=6)[::2, ::2]           # góry z marginesem, w skali indeksów
rz = np.array(Image.open(M + "warstwy_2.png"))[..., 0] > 0
rz = ndi.binary_dilation(rz.reshape(2500, 4, 2500, 4).max((1, 3)), iterations=2)   # rzeki (1/2 → 1/8)

def wybierz(kom, unikaj):
    dt = ndi.distance_transform_edt(np.pad(kom, 1))[1:-1, 1:-1]
    wolne = kom & ~unikaj
    if wolne.sum() > 0.3 * kom.sum(): dt = np.where(wolne, dt, 0)   # gór/rzek unikamy, jeśli zostaje dość miejsca
    pkt = [np.unravel_index(dt.argmax(), dt.shape)]
    yy, xx = np.nonzero(dt >= max(2.0, 0.35 * dt.max()))           # wioski nie przy samej granicy
    for _ in range(2):
        if not len(yy): pkt.append(pkt[0]); continue
        d = np.min([np.hypot(yy - py, xx - px) for py, px in pkt], axis=0) * np.sqrt(dt[yy, xx])
        k = d.argmax(); pkt.append((yy[k], xx[k]))
    return pkt

ramki = ndi.find_objects(ind)
for i, p in enumerate(P):
    s = ramki[i]
    kom = ind[s] == i + 1
    pkt = wybierz(kom, (g | rz)[s])
    p["osady"] = [[round((s[1].start + x + 0.5) * S), round((s[0].start + y + 0.5) * S)] for y, x in pkt]
    p["x"], p["y"] = p["osady"][0]   # środek prowincji (do przewijania mapy) = miasto — leży na pewno w prowincji, nie w górach
json.dump(P, open("assets/mapa/prowincje.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
# kontrola: każda osada w swojej prowincji
zle = [p["id"] for i, p in enumerate(P) for x, y in p["osady"] if ind[min(2499, int(y / S)), min(2499, int(x / S))] != i + 1]
print("prowincji:", len(P), "osad poza swoją prowincją:", len(zle), zle[:10])
