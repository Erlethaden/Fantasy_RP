# Ramki 9-slice w pixel arcie, rysowane piksel po pikselu: python assets/ramki.py
#   ramki/portret.png  24x24, slice 8  (złoty fazowany pasek, rubiny w rogach)
#   ramki/panel.png    36x36, slice 12 (złoto + ciemna stal, narożniki z nitem)
#   ramki/przycisk*.png 12x12, slice 4, CSS ×2 (10, 2026-10-23): ciemny kamień w złotej fazie; stany: zwykły, _hover, _wcisniety, _wylaczony
#   ramki/przycisk_zloty*.png 12x12, slice 4, CSS ×2 (10): złoty przycisk główny (.dodaj); stany: zwykły, _hover, _wcisniety
#   ramki/separator.png 24x8 (10): złota listwa między sekcjami karty, końce z rombem (border-image poziomo, slice 8)
#   ramki/pasek.png    32x24 (10): kamień + złota listwa na dole (border-image tylko dolny slice 8); ramki/kamien.png 32x32 — tło paska
# Ramki: wnętrze przezroczyste; przycisk i pasek: wnętrze z kamienia (CSS: border-image ... fill).
# W CSS: border-image: url(...) <slice> [fill] / <slice * skala>px; image-rendering: pixelated.
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


KAMIEN = [(22, 23, 31, 255), (31, 32, 42, 255), (40, 41, 53, 255), (52, 53, 67, 255)]   # od najciemniejszego


def kamien(szer, wys, jasnosc=0):
    """ciosany kamień: równe tło z drobnymi plamkami (powtarzalny wzór, bez losowości między uruchomieniami)"""
    im = Image.new("RGBA", (szer, wys))
    for y in range(wys):
        for x in range(szer):
            h = (x * 73 + y * 151 + (x * y) % 7 * 19) % 23
            i = 1 + jasnosc + (1 if h == 0 else -1 if h in (5, 11) else 0)
            im.putpixel((x, y), KAMIEN[max(0, min(3, i))])
    return im


def przycisk(stan=""):
    """12x12, slice 4, w CSS ×2 (jak panel): kontur, złota faza, kontur, kamień; ścięte rogi"""
    jasnosc, (gora, dol) = {"": (0, (ZL_JASNE, ZL_CIEMNE)), "_hover": (1, (ZL_JASNE, ZL)),
                            "_wcisniety": (-1, (ZL_CIEMNE, ZL_JASNE)), "_wylaczony": (-1, ((96, 94, 100, 255), (60, 58, 66, 255)))}[stan]
    im = kamien(12, 12, jasnosc)
    im.alpha_composite(bevel(12, [(KONTUR, KONTUR), (gora, dol), (KONTUR, KONTUR)]))
    for x, y in ((0, 0), (11, 0), (0, 11), (11, 11)):
        im.putpixel((x, y), (0, 0, 0, 0))
    if stan != "_wylaczony":   # błysk kamienia przy górnej krawędzi (wciśnięty — przy dolnej)
        y = 8 if stan == "_wcisniety" else 3
        for x in range(3, 9):
            im.putpixel((x, y), KAMIEN[min(3, 2 + jasnosc)])
    return im


def przycisk_zloty(stan=""):
    """złoty przycisk główny: kontur, faza, złote wnętrze jaśniejsze u góry"""
    wnetrze = {"": (ZL_JASNE, ZL), "_hover": ((250, 230, 170, 255), ZL_JASNE), "_wcisniety": (ZL, ZL_CIEMNE)}[stan]
    im = Image.new("RGBA", (12, 12))
    for y in range(12):
        for x in range(12):
            im.putpixel((x, y), wnetrze[0] if y < 5 else wnetrze[1])
    gora, dol = (ZL_CIEMNE, ZL_JASNE) if stan == "_wcisniety" else (ZL_JASNE, ZL_CIEMNE)
    im.alpha_composite(bevel(12, [(KONTUR, KONTUR), (gora, dol)]))
    for x, y in ((0, 0), (11, 0), (0, 11), (11, 11)):
        im.putpixel((x, y), (0, 0, 0, 0))
    return im


def separator():
    """24x8: lewy koniec (romb), środek (linia), prawy koniec; linia w wierszach 2–5"""
    im = Image.new("RGBA", (24, 8), (0, 0, 0, 0))
    for x in range(4, 20):
        for y, kolor in zip(range(2, 6), (KONTUR, ZL_JASNE, ZL_CIEMNE, KONTUR)):
            im.putpixel((x, y), kolor)
    for cx in (3, 20):
        romb(im, cx, 3, 3, (KONTUR, ZL, ZL_JASNE))
    return im


def pasek():
    im = kamien(32, 24)
    for x in range(32):   # złota listwa 8 px na dole: kontur, faza, złoto, cień
        for y, kolor in zip(range(16, 24), (KONTUR, ZL_JASNE, ZL, ZL, ZL_CIEMNE, KONTUR, (10, 8, 6, 255), (10, 8, 6, 120))):
            im.putpixel((x, y), kolor)
        if x % 16 == 7:   # nity co 16 px
            im.putpixel((x, 18), ZL_JASNE); im.putpixel((x, 19), ZL_CIEMNE)
    return im


if __name__ == "__main__":
    cel = Path(__file__).parent / "ramki"
    cel.mkdir(exist_ok=True)
    for nazwa, im in (("portret", portret()), ("panel", panel()), ("pasek", pasek()), ("kamien", kamien(32, 32)), ("separator", separator()), *((f"przycisk_zloty{s}", przycisk_zloty(s)) for s in ("", "_hover", "_wcisniety")), *((f"przycisk{s}", przycisk(s)) for s in ("", "_hover", "_wcisniety", "_wylaczony"))):
        assert (im.getpixel((im.width // 2, im.height // 2))[3] == 0) == (nazwa in ("portret", "panel")), "ramki: wnętrze przezroczyste, przycisk/pasek: pełne"
        im.save(cel / f"{nazwa}.png")
        im.resize((im.width * 8, im.height * 8), Image.NEAREST).save(cel / f"{nazwa}_x8.png")
        print(cel / f"{nazwa}.png")
