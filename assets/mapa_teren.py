# Teren mapy w stylu F (7.6b): python assets/mapa_teren.py  (po mapa_dane.py)
#   assets/mapa/teren.png        — 2500x2500 (1 px = texel = 2 px mapa.png): ląd (trawa), plaże, płytka/głęboka woda, rzeki, podgórze,
#                                  sprite'y gór, obrys wybrzeża; program pokazuje go powiększonego ×2 bez wygładzania
#   assets/mapa/teren_maska.png  — 2500x2500: R = 255 tam, gdzie przeglądarka może nałożyć teren prowincji (zwykły ląd), G = wersja tekstury 0–7 (×32), B = woda
#   assets/mapa/tekstury/<typ>.png — 128x128 tekstury typów terenu dla przeglądarki (las, pustynia, bagno, tundra, równina)
#   assets/mapa/tereny.json      — startowy typ terenu prowincji {id: typ} (GM zmienia na karcie prowincji)
# Źródła tekstur i gór: materialy/mapa/tekstury/ (z generatora, 512 px; góry 24 px). Maski: prowincje.png (0 = woda albo góry), komórki, warstwy_2.
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
Image.MAX_IMAGE_PIXELS = None
M, T, N = "materialy/mapa/", "materialy/mapa/tekstury/", 2500

def tekstura(plik, jasnosc=1.0, odcien=None, sila=0.0):   # 512 → 128 BOX + paleta 24, potem 2x2 odbicie = 256 bez szwów
    im = Image.open(T + plik).convert("RGB").resize((128, 128), Image.BOX)
    t = np.array(im.quantize(24, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")).astype(float) * jasnosc
    if odcien is not None: t = t * (1 - sila) + np.array(odcien) * sila
    t = np.clip(t, 0, 255).astype(np.uint8)
    return t, np.concatenate([np.concatenate([t, t[:, ::-1]], 1), np.concatenate([t[::-1], t[::-1, ::-1]], 1)], 0)

# wersje 0–7 (obrót, odbicie, przesunięcie) w nieregularnych plamach — ta sama mapa wersji w przeglądarce (G maski)
WERSJE = (ndi.zoom(np.random.default_rng(5).random((N // 24 + 3, N // 24 + 3)), 24, order=1)[:N, :N] * 8).astype(int).clip(0, 7)
YY, XX = np.mgrid[:N, :N]
def wersja(t256, i):
    v = np.rot90(t256, i % 4); v = v[:, ::-1] if i >= 4 else v
    return np.roll(v, (i * 97 % 256, i * 61 % 256), (0, 1))
def wyklej(t256):
    out = np.zeros((N, N, 3), np.uint8)
    for i in range(8): v = wersja(t256, i); out = np.where((WERSJE == i)[..., None], v[YY % 256, XX % 256], out)
    return out

# --- maski w skali 1/8 (2500) ---
P = np.array(Image.open("assets/mapa/prowincje.png").convert("RGB")).astype(np.int32); P = P[..., 0] * 256 + P[..., 1]
k = np.array(Image.open(M + "komorki_final.png").convert("RGB")).astype(np.int32); k = (k[..., 0] * 256 + k[..., 1])[::2, ::2]
lad_kom = np.zeros(k.max() + 1, bool)
sas = json.load(open(M + "sasiedztwo.json", encoding="utf-8"))
for p in sas["prowincje"].values():
    for c in p["komorki"]:
        if c <= k.max(): lad_kom[c] = True
woda = ~lad_kom[k]
gory = (P == 0) & ~woda                                    # pasma gór = ląd poza prowincjami (mapa_dane.py wycina je z prowincji)
gory = ndi.binary_opening(gory, iterations=1)
rz = np.array(Image.open(M + "warstwy_2.png"))[..., 0] > 0  # 10000² → 2500²
rz = rz.reshape(N, 4, N, 4).max((1, 3))
yy, xx = np.mgrid[-6:7, -6:7]
rzeka = ndi.binary_closing(np.pad(rz, 7), structure=yy ** 2 + xx ** 2 <= 36)[7:-7, 7:-7] & ~woda   # skleja przerwy po mostach
od_wody = ndi.distance_transform_edt(~woda); od_ladu = ndi.distance_transform_edt(woda)
plaza = ~woda & (od_wody <= 4) & ~gory
podgorze = ndi.binary_dilation(gory, iterations=5) & ~woda & ~gory

# --- obraz ---
_, TRAWA = tekstura("trawa_v2.png", 1.05)
_, PODG = tekstura("trawa_v2.png", 0.85)
_, PIASEK = tekstura("piasek_v1.png")
_, WODA1 = tekstura("woda_v1.png", 1.08); _, WODA2 = tekstura("woda_s1012.png", 1.08)
_, GLEBIA = tekstura("woda_v1.png", 0.8)
_, RZEKA = tekstura("woda_v1.png", 1.2)
img = wyklej(TRAWA)
img = np.where(podgorze[..., None], wyklej(PODG), img)
img = np.where(gory[..., None], wyklej(PODG), img)
img = np.where(plaza[..., None], wyklej(PIASEK), img)
plamy_wody = ndi.zoom(np.random.default_rng(9).random((N // 60 + 3, N // 60 + 3)), 60, order=1)[:N, :N] > 0.5
img = np.where(woda[..., None], np.where((od_ladu > 20)[..., None], wyklej(GLEBIA), np.where(plamy_wody[..., None], wyklej(WODA1), wyklej(WODA2))), img)
# rzeka: koryto z ciemnym brzegiem 1 px, jaśniejszy nurt
img = np.where(rzeka[..., None], wyklej(RZEKA), img)
brzeg_rz = rzeka & ~ndi.binary_erosion(rzeka); img[brzeg_rz] = (34, 64, 112)
# obrys wybrzeża (lekka brązowa kreska, jak wariant F): ląd stykający się z wodą
obrys = ~woda & ndi.binary_dilation(woda) & ~rzeka
img[obrys] = (img[obrys] * 0.45 + np.array([60, 42, 24]) * 0.55).astype(np.uint8)
# góry: sprite'y 24 px (70%) i 18 px, gęsto na paśmie, od tylnych do przednich
SPR = [np.array(Image.open(T + f"gora_{s}.png").convert("RGBA")) for s in (1000, 1001, 1002)]
r = np.random.default_rng(3); wnetrze = ndi.binary_erosion(gory, iterations=1)
pkt = sorted((y + r.integers(-3, 4), x + r.integers(-3, 4)) for y in range(0, N, 9) for x in range(0, N, 11))
for y, x in pkt:
    if not (0 <= y < N and 0 <= x < N and wnetrze[y, x]): continue
    sp = SPR[r.integers(0, 3)]
    if r.random() >= 0.7: sp = np.array(Image.fromarray(sp).resize((18, 18), Image.NEAREST))
    sh, sw = sp.shape[:2]; y0, x0 = y - sh + 3, x - sw // 2
    ys, xs = slice(max(0, y0), min(N, y0 + sh)), slice(max(0, x0), min(N, x0 + sw))
    cz = sp[ys.start - y0:ys.stop - y0, xs.start - x0:xs.stop - x0]
    img[ys, xs] = np.where(cz[..., 3:] > 127, cz[..., :3], img[ys, xs])
Image.fromarray(img).save("assets/mapa/teren.png", optimize=True)

# --- maska dla terenów prowincji: zwykły ląd w prowincji (bez rzek, plaż, podgórza i sprite'ów gór) ---
zwykly = (P > 0) & ~woda & ~rzeka & ~plaza & ~podgorze & ~obrys & ~gory
maska = np.zeros((N, N, 3), np.uint8); maska[..., 0] = zwykly * 255; maska[..., 1] = WERSJE * 32; maska[..., 2] = woda * 255   # B = woda (odblaski fal w przeglądarce, 7.6c)
Image.fromarray(maska).save("assets/mapa/teren_maska.png", optimize=True)

# --- tekstury typów dla przeglądarki (128², bez odbicia — przeglądarka składa wersje sama) ---
for typ, (plik, jas) in {"rownina": ("trawa_v2.png", 1.05), "las": ("las_v1.png", 1.0), "pustynia": ("pustynia_v1.png", 1.0),
                         "bagno": ("bagno_v1.png", 1.0), "tundra": ("tundra_v1.png", 1.0)}.items():
    t, _ = tekstura(plik, jas); Image.fromarray(t).save(f"assets/mapa/tekstury/{typ}.png")

# --- startowe tereny prowincji: tundra na dalekiej północy, pustynia na południowym wschodzie, lasy plamami, bagna przy wodzie ---
prow = json.load(open("assets/mapa/prowincje.json", encoding="utf-8"))
las = ndi.zoom(np.random.default_rng(21).random((12, 12)), 5000 / 12, order=3)
bag = ndi.zoom(np.random.default_rng(22).random((16, 16)), 5000 / 16, order=3)
tereny = {}
for p in prow:
    x, y = int(p["x"]), int(p["y"]); xi, yi = min(x, 4999), min(y, 4999)
    blisko_wody = od_wody[min(y // 2, N - 1), min(x // 2, N - 1)] < 40
    if y < 700: t = "tundra"
    elif y > 3900 and x > 3200: t = "pustynia"
    elif blisko_wody and bag[yi, xi] > 0.78: t = "bagno"
    elif las[yi, xi] > 0.6 or (y < 1200 and las[yi, xi] > 0.4): t = "las"
    else: t = "rownina"
    if t != "rownina": tereny[p["id"]] = t
json.dump(tereny, open("assets/mapa/tereny.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
from collections import Counter
print("teren.png, teren_maska.png, tekstury/*.png, tereny.json:", Counter(tereny.values()), "z", len(prow))
