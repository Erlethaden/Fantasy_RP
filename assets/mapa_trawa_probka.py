# Próbka poprawek trawy (11.0, 2026-10-23): python assets/mapa_trawa_probka.py → podglady/trawa_przed_po.png
#   przed: wycinek teren.png przy największym zbliżeniu (1 texel = 8 px ekranu)
#   po:    (1) trawa przekolorowana na głębszą, spokojniejszą zieleń + pikselowe kwiatki i kamyki,
#          (2) warstwa detalu z bliska: faktura źródłowej tekstury 512 px (4× drobniejsza niż texel) w trybie soft-light, tylko na lądzie
import colorsys
import numpy as np
from PIL import Image

T = "materialy/mapa/tekstury/trawa_v2.png"
Y0, X0, H, W, SKALA = 1180, 1080, 110, 190, 8        # wycinek w texelach teren.png (okolice środka mapy, sama trawa i podgórze)


def przekoloruj(rgb, odcien=0.07, nasycenie=0.75, jasnosc=0.9):
    """żółtawa zieleń → głębsza, mniej jaskrawa: przesunięcie odcienia ku zieleni, mniej nasycenia, ciemniej"""
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in rgb.reshape(-1, 3) / 255.0])
    hsv[:, 0] = (hsv[:, 0] + odcien) % 1; hsv[:, 1] *= nasycenie; hsv[:, 2] *= jasnosc
    return (np.array([colorsys.hsv_to_rgb(*p) for p in hsv]).reshape(rgb.shape) * 255).astype(np.uint8)


def drobiazgi(t, gestosc=0.012, ziarno=7):
    """kwiatki (biały/żółty piksel z ciemniejszym pod spodem) i kamyki (2 px szarości) rozsiane po kaflu 128"""
    rng, t = np.random.default_rng(ziarno), t.copy()
    for _ in range(int(t.shape[0] * t.shape[1] * gestosc)):
        y, x = rng.integers(1, t.shape[0] - 2), rng.integers(1, t.shape[1] - 2)
        r = rng.random()
        if r < 0.45: t[y, x] = (236, 232, 214); t[y + 1, x] = t[y + 1, x] * 0.7
        elif r < 0.8: t[y, x] = (226, 196, 84); t[y + 1, x] = t[y + 1, x] * 0.7
        else: t[y, x] = (150, 150, 140); t[y, x + 1] = (118, 118, 110); t[y + 1, x] = t[y + 1, x] * 0.75
    return t


zrodlo = np.array(Image.open(T).convert("RGB"))
kafel = np.array(Image.fromarray(zrodlo).resize((128, 128), Image.BOX).quantize(24, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")).astype(float) * 1.05
kafel = drobiazgi(przekoloruj(np.clip(kafel, 0, 255).astype(np.uint8)))
teren = np.array(Image.open("assets/mapa/teren.png").convert("RGB"))[Y0:Y0 + H, X0:X0 + W]
maska = np.array(Image.open("assets/mapa/teren_maska.png"))[Y0:Y0 + H, X0:X0 + W]
lad = maska[..., 0] == 255
yy, xx = np.mgrid[Y0:Y0 + H, X0:X0 + W]
po = np.where(lad[..., None], kafel[yy % 128, xx % 128], przekoloruj(teren))   # podgórze itp. — ten sam przesunięty kolor

przed_duzy = np.array(Image.fromarray(teren).resize((W * SKALA, H * SKALA), Image.NEAREST)).astype(float)
po_duzy = np.array(Image.fromarray(po).resize((W * SKALA, H * SKALA), Image.NEAREST)).astype(float)
# detal: jasność źródła 512 (texel 0.5 px mapy = 1/4 texela teren.png) bez niskich częstotliwości, soft-light 50%
l = zrodlo.mean(2) / 255.0
from scipy import ndimage as ndi
d = np.clip(0.5 + (l - ndi.uniform_filter(l, 9)) * 1.6, 0, 1)
dy, dx = np.mgrid[0:H * SKALA, 0:W * SKALA]
D = d[((dy + Y0 * SKALA) // 2) % 512, ((dx + X0 * SKALA) // 2) % 512][..., None]   # 1 piksel detalu = 2 px ekranu przy największym zbliżeniu
a = po_duzy / 255.0
soft = np.where(D < 0.5, 2 * a * D + a * a * (1 - 2 * D), 2 * a * (1 - D) + np.sqrt(a) * (2 * D - 1))
lad_duzy = np.array(Image.fromarray(lad.astype(np.uint8) * 255).resize((W * SKALA, H * SKALA), Image.NEAREST))[..., None] > 0
po_duzy = np.where(lad_duzy, (a * 0.5 + soft * 0.5) * 255, po_duzy)

out = Image.new("RGB", (W * SKALA, H * SKALA * 2 + 40), (14, 15, 23))
out.paste(Image.fromarray(przed_duzy.astype(np.uint8)), (0, 0)); out.paste(Image.fromarray(np.clip(po_duzy, 0, 255).astype(np.uint8)), (0, H * SKALA + 40))
from PIL import ImageDraw
g = ImageDraw.Draw(out); g.text((10, H * SKALA + 10), "PRZED (gora)  /  PO (dol): glebsza zielen, kwiatki i kamyki, drobny detal z bliska", fill=(230, 210, 150))
out.save("podglady/trawa_przed_po.png")
Image.fromarray(kafel).resize((512, 512), Image.NEAREST).save("podglady/trawa_kafel_po.png")
print("podglady/trawa_przed_po.png", out.size)
