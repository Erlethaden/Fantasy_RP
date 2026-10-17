# Ramki 9-slice w pixel arcie, rysowane piksel po pikselu: python assets/ramki.py
#   ramki/portret.png  24x24, slice 8  (złoty fazowany pasek, rubiny w rogach)
#   ramki/panel.png    36x36, slice 12 (złoto + ciemna stal, narożniki z nitem)
# Wnętrze przezroczyste; w CSS: border-image: url(...) <slice> / <slice * skala>px; image-rendering: pixelated.
from pathlib import Path
from PIL import Image

KONTUR, ZL_JASNE, ZL, ZL_CIEMNE = (18, 12, 4, 255), (242, 215, 138, 255), (201, 162, 74, 255), (128, 92, 34, 255)
STAL, STAL_JASNA = (35, 34, 42, 255), (70, 68, 80, 255)
RUBIN, RUBIN_JASNY = (176, 32, 42, 255), (255, 120, 120, 255)


def bevel(rozm, warstwy):
    """warstwy[i] = (kolor od góry/lewej, kolor od dołu/prawej) dla paska w odległości i od krawędzi"""
    im = Image.new("RGBA", (rozm, rozm), (0, 0, 0, 0))
    for y in range(rozm):
        for x in range(rozm):
            d = min(x, y, rozm - 1 - x, rozm - 1 - y)
            if d < len(warstwy):
                jasna = min(x, y) <= min(rozm - 1 - x, rozm - 1 - y)  # bliżej górnej/lewej krawędzi
                im.putpixel((x, y), warstwy[d][0 if jasna else 1])
    return im


def romb(im, cx, cy, r, kolory):
    obrys, srodek, blask = kolory
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            d = abs(x - cx) + abs(y - cy)
            if d == r:
                im.putpixel((x, y), obrys)
            elif d < r:
                im.putpixel((x, y), blask if (x < cx and y < cy and d >= r - 2) else srodek)


def wszystkie_rogi(im, rozm_rogu, rysuj):
    # rysowane w każdym rogu osobno (bez odbijania), żeby blask zawsze był z lewej góry
    for x0 in (0, im.width - rozm_rogu):
        for y0 in (0, im.height - rozm_rogu):
            rog = Image.new("RGBA", (rozm_rogu, rozm_rogu), (0, 0, 0, 0))
            rysuj(rog)
            im.alpha_composite(rog, (x0, y0))
    return im


def portret():
    im = bevel(24, [(KONTUR, KONTUR), (ZL_JASNE, ZL_CIEMNE), (ZL, ZL_CIEMNE), (ZL, ZL), (ZL_CIEMNE, ZL_JASNE), (KONTUR, KONTUR)])
    return wszystkie_rogi(im, 7, lambda r: romb(r, 3, 3, 3, (KONTUR, RUBIN, RUBIN_JASNY)))


def panel():
    im = bevel(36, [(KONTUR, KONTUR), (ZL_JASNE, ZL_CIEMNE), (ZL, ZL_CIEMNE), (ZL_CIEMNE, ZL_CIEMNE), (KONTUR, KONTUR),
                    (STAL_JASNA, STAL), (STAL, STAL), (KONTUR, KONTUR)])

    def plytka(r):
        for y in range(11):
            for x in range(11):
                brzeg = x in (0, 10) or y in (0, 10)
                r.putpixel((x, y), KONTUR if brzeg else (ZL_JASNE if x + y < 6 else ZL if x + y < 14 else ZL_CIEMNE))
        romb(r, 5, 5, 2, (KONTUR, RUBIN, RUBIN_JASNY))
    return wszystkie_rogi(im, 11, plytka)


if __name__ == "__main__":
    cel = Path(__file__).parent / "ramki"
    cel.mkdir(exist_ok=True)
    for nazwa, im in (("portret", portret()), ("panel", panel())):
        assert im.getpixel((im.width // 2, im.height // 2))[3] == 0, "wnętrze ramki ma być przezroczyste"
        im.save(cel / f"{nazwa}.png")
        im.resize((im.width * 8, im.height * 8), Image.NEAREST).save(cel / f"{nazwa}_x8.png")
        print(cel / f"{nazwa}.png")
