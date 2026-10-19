# Obraz mapy do programu bez ręcznie pisanych numerów i podpisów (numery to tylko wewnętrzne id — decyzja użytkownika):
#   python assets/mapa_obraz.py  → assets/mapa/mapa.png (5000x5000, skala 1/4, szarości)
#                                → public/mapa/kafle/<poziom>/<x>_<y>.png — kafelki 1024² do ostrego przybliżenia:
#                                  poziom 2 = skala 1/2 (10000²), poziom 1 = pełna rozdzielczość (20000²); pliki tylko tam, gdzie jest tusz
# Numer/podpis = skupisko drobnych znaków (nie kreska granicy, nie linia, nie przy górach i rzekach) o wysokości cyfr.
# Kreski granic komórek (wszystko poza długimi liniami, z dala od gór i rzek) też są usuwane — granice rysuje program.
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, "assets")
from mapa_komorki import wczytaj, wezly, rodzaje, skeletonize, px

Image.MAX_IMAGE_PIXELS = None
ink = wczytaj(None); sk = skeletonize(ink); konce, _ = wezly(sk)
lab, typ = rodzaje(ink, sk, konce)
warstwy = np.array(Image.open("materialy/mapa/warstwy_2.png"))
chronione = ndi.binary_dilation((warstwy[..., 1] > 0) | (warstwy[..., 0] > 0), iterations=px(12))
znak = (typ[lab] == 3) & ~chronione
gr, n = ndi.label(ndi.binary_dilation(znak, iterations=px(24)))
tusz = ndi.sum(znak, gr, np.arange(1, n + 1))
usun = np.zeros(n + 1, bool)
for i, s in enumerate(ndi.find_objects(gr), 1):
    h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
    usun[i] = tusz[i - 1] >= 120 and h - 2 * px(24) >= px(60) and w - 2 * px(24) >= px(20) and h <= px(400) + 2 * px(24)
maska = ndi.binary_dilation(znak & usun[gr], iterations=2)
print("skupisk usuniętych:", int(usun.sum()), "z", n)
# przerywane kreski granic komórek też znikają (użytkownik 2026-10-19: nie zgadzały się z prowincjami) — program rysuje granice
# sam z assets/mapa/granice.json. Zostają tylko długie linie (wybrzeża, rzeki, góry) i wszystko przy górach i rzekach.
gory4 = np.array(Image.open("materialy/mapa/gory_final.png").convert("L")) > 127
przy = ndi.binary_dilation(np.repeat(np.repeat(gory4, 2, 0), 2, 1) | (warstwy[..., 0] > 0), iterations=px(40))
kreski = (typ[lab] != 2) & (lab > 0) & ~przy
maska |= ndi.binary_dilation(kreski, iterations=2)
print("pikseli kresek granic usuniętych:", int(kreski.sum()))
pelny = np.array(Image.open("materialy/Mapa RPG.png").convert("L"))
pelny[np.repeat(np.repeat(maska, 2, 0), 2, 1)] = 255   # maska jest w skali 1/2
Image.fromarray(pelny).reduce(4).save("assets/mapa/mapa.png", optimize=True)
import os, shutil, json
K = 1024
spis = {}
shutil.rmtree("public/mapa/kafle", ignore_errors=True)
for poziom, obraz in ((1, pelny), (2, np.array(Image.fromarray(pelny).reduce(2)))):
    os.makedirs(f"public/mapa/kafle/{poziom}", exist_ok=True); ile = 0
    for y in range(0, obraz.shape[0], K):
        for x in range(0, obraz.shape[1], K):
            k = obraz[y:y + K, x:x + K]
            if k.min() > 200: continue   # sam papier — program pokaże w tym miejscu obraz podstawowy
            Image.fromarray(k).quantize(16).save(f"public/mapa/kafle/{poziom}/{x // K}_{y // K}.png", optimize=True); ile += 1
            spis.setdefault(poziom, []).append(f"{x // K}_{y // K}")
    print("poziom", poziom, "kafelków:", ile)
json.dump({"rozmiar": K, "poziomy": {"1": 20000, "2": 10000}, "kafle": spis}, open("assets/mapa/kafle.json", "w"), separators=(",", ":"))
