# Ręczne poprawki komórek (7.6e): python assets/mapa_poprawki.py  (raz, przed mapa_sasiedztwo.py; drugi raz nic już nie zmienia)
#   wejście/wyjście: materialy/mapa/komorki_final.png (1/4, id = R*256+G) według materialy/mapa/poprawki.json
#   potem: mapa_sasiedztwo.py → mapa_dane.py → mapa_osady.py → mapa_teren.py
import json
import numpy as np
from PIL import Image, ImageDraw

M = "materialy/mapa/"
im = np.array(Image.open(M + "komorki_final.png"))
w = im[..., 0].astype(np.int32) * 256 + im[..., 1]
for p in json.load(open(M + "poprawki.json", encoding="utf-8"))["poprawki"]:
    maska = Image.new("1", (w.shape[1], w.shape[0])); ImageDraw.Draw(maska).polygon([tuple(x) for x in p["wielokat"]], fill=1)
    m = np.array(maska) & (w == p["z"])
    w[m] = p["na"]; print(f"{p['opis']}: {int(m.sum())} px")
im[..., 0], im[..., 1] = w >> 8, w & 255
Image.fromarray(im).save(M + "komorki_final.png", optimize=True)
