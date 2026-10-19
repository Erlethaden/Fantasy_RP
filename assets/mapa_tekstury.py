# Tekstury mapy (7.6a — próbka): python assets/mapa_tekstury.py  → assets/_drafts/mapa_probka.png (6 wariantów, 2 kolumny)
#   style: „pixel” (kafelki pixel art z ograniczoną paletą, liczone skryptem — zawsze bezszwowe) i „akwarela” (malowany pergamin)
#   kreski: „mocne” (jak teraz) i „lekkie” (jaśniejsze, cieńsze)
#   maski (skala mapa.png, 5000x5000): woda = brak komórki w komorki_final; góry = gory_final domknięte; kreski = mapa.png
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
Image.MAX_IMAGE_PIXELS = None
M = "materialy/mapa/"
X0, Y0, X1, Y1 = 2300, 1500, 3500, 2300          # wycinek w px mapa.png
rng = np.random.default_rng(1000)

def maski():
    import json
    k = np.array(Image.open(M + "komorki_final.png").crop((X0, Y0, X1, Y1)).convert("RGB")).astype(np.int32)
    w = k[..., 0] * 256 + k[..., 1]
    lad = np.zeros(w.max() + 1, bool)   # komórki należące do prowincji; reszta (morza, jeziora — kilka dużych komórek) to woda
    for p in json.load(open(M + "sasiedztwo.json", encoding="utf-8"))["prowincje"].values():
        for c in p["komorki"]:
            if c <= w.max(): lad[c] = True
    woda = ~lad[w]
    g = np.array(Image.open(M + "gory_final.png").crop((X0, Y0, X1, Y1)).convert("L")) > 127
    gory = ndi.binary_closing(ndi.binary_dilation(g, iterations=6), structure=np.ones((15, 15))) & ~woda
    kreski = 255 - np.array(Image.open("assets/mapa/mapa.png").crop((X0, Y0, X1, Y1)).convert("L"))   # 0 = papier, 255 = tusz
    # rzeki: kanał R warstwy_2 (skala 1/2) = podwójne linie brzegów; sklejone domknięciem → całe koryto
    rz = np.array(Image.open(M + "warstwy_2.png").crop((X0 * 2, Y0 * 2, X1 * 2, Y1 * 2)))[..., 0] > 0
    rz = rz.reshape(rz.shape[0] // 2, 2, rz.shape[1] // 2, 2).max((1, 3))
    # domknięcie dyskiem R=12 skleja też przerwy po mostach z rysunku (tam maska rzeki ma dziury)
    yy, xx = np.mgrid[-12:13, -12:13]
    rzeka = ndi.binary_closing(np.pad(rz, 13), structure=yy ** 2 + xx ** 2 <= 144)[13:-13, 13:-13] & ~woda
    rzeka = ndi.binary_opening(rzeka, iterations=1)
    # zbocza: lewe (bliższa kreska grzbietu na prawo) jasne, prawe w cieniu; śnieg na górnym brzegu pasma
    tusz = (kreski > 100) & gory
    _, (iy, ix) = ndi.distance_transform_edt(~tusz, return_indices=True)
    jasne = ix > np.arange(gory.shape[1])[None, :]
    od_gory = np.zeros(gory.shape, int)   # ile px w dół od górnej krawędzi pasma w kolumnie
    for y in range(1, gory.shape[0]): od_gory[y] = np.where(gory[y], od_gory[y - 1] + 1, 0)
    snieg = gory & (od_gory <= 7) & (od_gory > 0)
    podgorze = ndi.binary_dilation(gory, iterations=10) & ~gory & ~woda
    # kreski rzek i gór z rysunku znikają — rzeki i góry rysuje program (zostają granice i wybrzeża)
    # góry: całe kreski (z długimi zboczami), które w ≥60% leżą przy paśmie — wybrzeże tylko je dotyka, więc zostaje
    lab, n = ndi.label(kreski > 60, structure=np.ones((3, 3)))
    przy = np.bincount(lab.ravel(), weights=ndi.binary_dilation(gory, iterations=35).ravel(), minlength=n + 1) / np.maximum(np.bincount(lab.ravel(), minlength=n + 1), 1)
    usun_g = (przy > 0.4); usun_g[0] = False
    kreski = np.where(ndi.binary_dilation(usun_g[lab], iterations=2) | ndi.binary_dilation(gory, iterations=8) | ndi.binary_dilation(rz, iterations=8), 0, kreski)
    return woda, gory, kreski, rzeka, jasne, snieg, podgorze

# --- pixel art: kafelek 32x32 z palety, bezszwowy (szum okresowy), powiększany NEAREST x2 → 1 texel = 2 px mapy ---
def szum_okresowy(n, skala, ziarno):
    r = np.random.default_rng(ziarno).random((n // skala, n // skala))
    r = np.tile(r, (3, 3)); r = ndi.zoom(r, skala, order=1)[n:2 * n, n:2 * n]   # kafel 3x3 → środek: brzegi pasują
    return (r - r.min()) / (np.ptp(r) + 1e-9)
def kafelek(paleta, ziarno, akcenty=None, n=64):
    s = 0.6 * szum_okresowy(n, 8, ziarno) + 0.4 * szum_okresowy(n, 4, ziarno + 1)
    idx = np.clip((s * len(paleta)).astype(int), 0, len(paleta) - 1)
    t = np.array(paleta, np.uint8)[idx]
    r = np.random.default_rng(ziarno + 2)
    if akcenty:   # pojedyncze piksele / kreseczki (źdźbła trawy, fale, kamyki)
        kolor, ile, ksztalt = akcenty
        for _ in range(ile):
            y, x = r.integers(0, n, 2)
            for dy, dx in ksztalt: t[(y + dy) % n, (x + dx) % n] = kolor
    return t
TRAWA2 = kafelek([(92, 134, 60), (104, 148, 66), (118, 162, 74), (130, 172, 82)], 61, ((154, 194, 96), 40, [(0, 0), (-1, 0)]))
TRAWA3 = kafelek([(82, 122, 56), (94, 136, 62), (106, 150, 68), (118, 160, 76)], 71, ((140, 182, 88), 30, [(0, 0), (-1, 0)]))
TRAWA = kafelek([(86, 128, 58), (98, 142, 64), (110, 156, 70), (124, 168, 78)], 11, ((150, 190, 92), 26, [(0, 0), (-1, 0)]))
WODA = kafelek([(46, 92, 150), (52, 102, 162), (58, 112, 172)], 21, ((120, 170, 220), 14, [(0, 0), (0, 1), (0, 2)]))
GLEBIA = kafelek([(34, 70, 124), (40, 80, 136), (46, 90, 146)], 31, ((90, 140, 200), 8, [(0, 0), (0, 1)]))
SKALA = kafelek([(112, 104, 96), (128, 120, 110), (146, 138, 126), (96, 88, 82)], 41, ((70, 62, 58), 18, [(0, 0), (1, 1)]))
PIASEK = kafelek([(214, 196, 140), (226, 208, 152), (204, 184, 128)], 51, ((180, 160, 110), 16, [(0, 0)]))
def wyklej(t, h, w, texel=2, warianty=None):
    # kilka wariantów kafelka mieszanych dużą plamą szumu — znika regularna kratka
    def jeden(t): t = np.repeat(np.repeat(t, texel, 0), texel, 1); return np.tile(t, (h // t.shape[0] + 1, w // t.shape[1] + 1, 1))[:h, :w]
    out = jeden(t)
    if warianty:
        plama = ndi.zoom(np.random.default_rng(7).random((h // 96 + 2, w // 96 + 2)), 96, order=1)[:h, :w]
        for i, v in enumerate(warianty, 1): out = np.where((plama > i / (len(warianty) + 1))[..., None], jeden(v), out)
    return out
SKALA_J = kafelek([(150, 142, 130), (166, 158, 144), (182, 174, 160), (134, 126, 116)], 42, ((120, 112, 104), 14, [(0, 0), (1, 1)]))
SKALA_C = kafelek([(84, 78, 76), (96, 90, 86), (108, 100, 94), (74, 68, 66)], 43, ((60, 54, 52), 14, [(0, 0), (1, 1)]))
SNIEG = kafelek([(232, 236, 242), (244, 246, 250), (220, 226, 236)], 44, ((200, 210, 226), 10, [(0, 0)]))
PODGORZE = kafelek([(84, 120, 56), (96, 132, 60), (108, 140, 66)], 45, ((124, 150, 80), 20, [(0, 0), (0, 1)]))
RZEKA = kafelek([(64, 120, 182), (72, 132, 192), (80, 142, 200)], 46, ((150, 196, 236), 10, [(0, 0), (0, 1)]))
def pixel(woda, gory, rzeka, jasne, snieg, podgorze):
    h, w = woda.shape
    od_brzegu = ndi.distance_transform_edt(woda)
    lad_od = ndi.distance_transform_edt(~woda)
    img = wyklej(TRAWA, h, w, warianty=[TRAWA2, TRAWA3])
    img = np.where((lad_od <= 8)[..., None] & ~woda[..., None], wyklej(PIASEK, h, w), img)    # plaża przy brzegu
    img = np.where(podgorze[..., None], wyklej(PODGORZE, h, w), img)
    img = np.where(gory[..., None], wyklej(PODGORZE, h, w), img)
    img = np.where(rzeka[..., None], wyklej(RZEKA, h, w), img)
    img = np.where(woda[..., None], np.where((od_brzegu > 40)[..., None], wyklej(GLEBIA, h, w), wyklej(WODA, h, w)), img)
    # schodkowanie granic do siatki 2 px — pixel art bez gładkich krzywych
    return img.reshape(h // 2, 2, w // 2, 2, 3)[:, :1, :, :1].repeat(2, 1).repeat(2, 3).reshape(h, w, 3)

# --- pixel art z generatora (assets/mapa/tekstury/*.png, 512 px): zmniejszone do 128 + paleta 24, zszyte odbiciem lustrzanym (2x2) ---
def z_generatora(n, jasnosc=1.0, odcien=None, sila=0.0):
    im = Image.open(f"materialy/mapa/tekstury/{n}.png").convert("RGB").resize((128, 128), Image.BOX)
    t = np.array(im.quantize(24, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")).astype(float) * jasnosc
    if odcien is not None: t = t * (1 - sila) + np.array(odcien) * sila
    t = np.clip(t, 0, 255).astype(np.uint8)
    return np.concatenate([np.concatenate([t, t[:, ::-1]], 1), np.concatenate([t[::-1], t[::-1, ::-1]], 1)], 0)
def pixel_gen(woda, gory, rzeka, jasne, snieg, podgorze):
    h, w = woda.shape
    T = {"trawa": z_generatora("trawa_v2", 1.05), "podgorze": z_generatora("trawa_v2", 0.85), "woda": z_generatora("woda_v1", 1.08), "woda2": z_generatora("woda_s1012", 1.08),
         "glebia": z_generatora("woda_v1", 0.8), "rzeka": z_generatora("woda_v1", 1.2), "skala_j": z_generatora("skala_v1", 1.12),
         "skala_c": z_generatora("skala_v1", 0.72), "snieg": z_generatora("skala_v1", 1.0, (240, 244, 250), 0.75), "piasek": z_generatora("piasek_v1")}
    # każda tekstura w 8 wersjach (obroty, odbicia, przesunięcia) rozłożonych nieregularnymi plamami — znika symetria odbić lustrzanych
    plamy = (ndi.zoom(np.random.default_rng(5).random((h // 48 + 3, w // 48 + 3)), 48, order=1)[:h, :w] * 8).astype(int).clip(0, 7)
    def W(k):
        t = T[k]; out = np.zeros((h, w, 3), np.uint8)
        for i in range(8):
            v = np.rot90(t, i % 4); v = v[:, ::-1] if i >= 4 else v; v = np.roll(v, (i * 97, i * 61), (0, 1))
            out = np.where((plamy == i)[..., None], wyklej(v, h, w), out)
        return out
    od_brzegu = ndi.distance_transform_edt(woda); lad_od = ndi.distance_transform_edt(~woda)
    img = W("trawa")
    img = np.where(podgorze[..., None], W("podgorze"), img)
    img = np.where(((lad_od <= 8) & ~woda)[..., None], W("piasek"), img)
    img = np.where(gory[..., None], W("podgorze"), img)   # skałę i śnieg niosą sprite'y gór
    img = np.where(rzeka[..., None], W("rzeka"), img)
    plytka = np.where((ndi.zoom(np.random.default_rng(9).random((h // 120 + 3, w // 120 + 3)), 120, order=1)[:h, :w] > 0.5)[..., None], W("woda"), W("woda2"))
    img = np.where(woda[..., None], np.where((od_brzegu > 40)[..., None], W("glebia"), plytka), img)
    return img.reshape(h // 2, 2, w // 2, 2, 3)[:, :1, :, :1].repeat(2, 1).repeat(2, 3).reshape(h, w, 3)

# --- akwarela: plamy koloru z miękkimi brzegami, ciemniejszy brzeg plamy, ziarno papieru ---
def akwarela(woda, gory, rzeka, jasne, snieg, podgorze):
    h, w = woda.shape
    papier = np.array([233, 220, 188], float)
    szum = ndi.gaussian_filter(rng.random((h, w)), 6); szum = (szum - szum.mean()) / szum.std()
    drobny = ndi.gaussian_filter(rng.random((h, w)), 1.2); drobny = (drobny - drobny.mean()) / drobny.std()
    img = np.ones((h, w, 3)) * papier
    lad = ndi.gaussian_filter((~woda).astype(float), 3)
    zielen = np.array([176, 186, 128]) + szum[..., None] * np.array([8, 9, 6])
    img = img * (1 - 0.75 * lad[..., None]) + zielen * 0.75 * lad[..., None]
    pg = ndi.gaussian_filter(podgorze.astype(float), 8)
    img = img * (1 - 0.35 * pg[..., None]) + np.array([150, 160, 108]) * 0.35 * pg[..., None]
    g = ndi.gaussian_filter(gory.astype(float), 4)
    swiatlo = ndi.gaussian_filter(jasne.astype(float), 2)
    braz = (np.array([196, 170, 128]) * swiatlo[..., None] + np.array([128, 100, 72]) * (1 - swiatlo[..., None])) + szum[..., None] * 8
    img = img * (1 - 0.35 * g[..., None]) + braz * 0.35 * g[..., None]
    od = ndi.distance_transform_edt(woda)
    glebia = np.clip(od / 120, 0, 1)
    niebieski = np.array([150, 186, 204]) * (1 - glebia[..., None]) + np.array([96, 140, 176]) * glebia[..., None] + szum[..., None] * 5
    wd = ndi.gaussian_filter((woda | rzeka).astype(float), 1.5)
    img = img * (1 - wd[..., None]) + niebieski * wd[..., None]
    brzeg = np.exp(-od / 6) * woda   # ciemniejszy pas wody przy brzegu (zaschnięta krawędź plamy)
    img -= brzeg[..., None] * np.array([40, 30, 18])
    img += drobny[..., None] * 3
    return np.clip(img, 0, 255).astype(np.uint8)

# rzeka: ciemny brzeg 2 px, jaśniejszy nurt w środku
def rzeka_na(img, rzeka):
    brzeg = rzeka & ~ndi.binary_erosion(rzeka, iterations=2)
    srodek = ndi.binary_erosion(rzeka, iterations=4)
    img = img.copy(); img[brzeg] = (34, 64, 112)
    img[srodek] = np.clip(img[srodek].astype(int) + 22, 0, 255)
    return img
# góry: sprite'y pixel art (assets/_drafts/gora_m*.png, 24 px, ×2) gęsto na paśmie, od tylnych do przednich
GORY_SPR = [np.array(Image.open(f"materialy/mapa/tekstury/gora_{s}.png").convert("RGBA")) for s in (1000, 1001, 1002)]
def gory_na(img, gory, woda):
    img = img.copy(); h, w = gory.shape; r = np.random.default_rng(3)
    wnetrze = ndi.binary_erosion(gory, iterations=3)
    pkt = [(y + r.integers(-6, 7), x + r.integers(-6, 7)) for y in range(0, h, 18) for x in range(0, w, 22)]
    pkt = sorted([(y, x) for y, x in pkt if 0 <= y < h and 0 <= x < w and wnetrze[y, x]])
    for y, x in pkt:
        sp = GORY_SPR[r.integers(0, 3)]; skala = 2 if r.random() < 0.7 else 1
        sp = sp.repeat(2, 0).repeat(2, 1) if skala == 2 else np.array(Image.fromarray(sp).resize((36, 36), Image.NEAREST))
        sh, sw = sp.shape[:2]; y0, x0 = y - sh + 6, x - sw // 2
        ys, xs = slice(max(0, y0), min(h, y0 + sh)), slice(max(0, x0), min(w, x0 + sw))
        cz = sp[ys.start - y0:ys.stop - y0, xs.start - x0:xs.stop - x0]
        a = cz[..., 3:] > 127
        img[ys, xs] = np.where(a, cz[..., :3], img[ys, xs])
    return img
def kreski_na(img, kreski, lekkie):
    a = kreski.astype(float) / 255
    if lekkie: a = a * 0.6; kolor = np.array([60, 42, 24])   # jaśniejsze i brązowe zamiast czarnych
    else: kolor = np.array([25, 20, 12])
    return (img * (1 - a[..., None]) + kolor * a[..., None]).astype(np.uint8)

if __name__ == "__main__":
    woda, gory, kreski, *reszta = maski()
    warianty = [("Pixel art — kreski mocne", pixel, False), ("Pixel art — kreski lekkie", pixel, True),
                ("Akwarela — kreski mocne", akwarela, False), ("Akwarela — kreski lekkie", akwarela, True),
                ("Pixel art z generatora — kreski mocne", pixel_gen, False), ("Pixel art z generatora — kreski lekkie", pixel_gen, True)]
    h, w = woda.shape
    out = Image.new("RGB", (w * 2 + 30, (h + 45) * 3), (24, 22, 30)); d = ImageDraw.Draw(out)
    try: font = ImageFont.truetype("arial.ttf", 30)
    except OSError: font = ImageFont.load_default()
    for i, (nazwa, styl, lekkie) in enumerate(warianty):
        x, y = (i % 2) * (w + 30), (i // 2) * (h + 45) + 45
        baza = kreski_na(rzeka_na(styl(woda, gory, *reszta), reszta[0]), kreski, lekkie)
        out.paste(Image.fromarray(gory_na(baza, gory, woda)), (x, y))   # góry na wierzchu — zakrywają resztki kresek
        d.text((x + 10, y - 40), f"{'ABCDEF'[i]}. {nazwa}", fill=(240, 220, 160), font=font)
    out.save("assets/_drafts/mapa_probka.png")
    print("assets/_drafts/mapa_probka.png", out.size)
