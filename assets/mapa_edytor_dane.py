# Dane dla edytora mapy: python assets/mapa_edytor_dane.py  (po mapa_komorki.py)
#   materialy/mapa/edytor/tlo.png     — rysunek w skali 1/4 (5000x5000, szarości)
#   materialy/mapa/edytor/komorki.png — komórki w skali 1/4, id zapisane w kolorze: R = id // 256, G = id % 256 (0 = ocean)
#   materialy/mapa/edytor/warstwy.png — rzeki (niebieskie) na przezroczystym tle; jeziora edytor bierze z obiekty.json
#   materialy/mapa/edytor/gory.png    — maska gór w skali 1/4 (255 = góry); w edytorze poprawiana pędzlem
# Uwaga: edycje (materialy/mapa/edycje.json) odnoszą się do id z tego pliku — po ponownym wykryciu komórek stare edycje nie pasują.
import os
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
os.makedirs("materialy/mapa/edytor", exist_ok=True)
Image.open("materialy/Mapa RPG.png").convert("L").reduce(4).save("materialy/mapa/edytor/tlo.png", optimize=True)
w = np.array(Image.open("materialy/mapa/komorki_2.png"))[::2, ::2].astype(np.uint16)
rgb = np.zeros(w.shape + (3,), np.uint8)
rgb[..., 0], rgb[..., 1] = w >> 8, w & 255
Image.fromarray(rgb).save("materialy/mapa/edytor/komorki.png", optimize=True)
print("komórek:", int(w.max()), "rozmiar:", w.shape)
wr = np.array(Image.open("materialy/mapa/warstwy_2.png"))
rz, gr = wr[..., 0].reshape(5000, 2, 5000, 2).max((1, 3)) > 0, wr[..., 1].reshape(5000, 2, 5000, 2).max((1, 3)) > 0
rgba = np.zeros((5000, 5000, 4), np.uint8)
rgba[rz] = (20, 110, 255, 255)
Image.fromarray(rgba).save("materialy/mapa/edytor/warstwy.png", optimize=True)
Image.fromarray((gr * 255).astype(np.uint8)).save("materialy/mapa/edytor/gory.png", optimize=True)
