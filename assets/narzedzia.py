# Narzędzia do grafik: python assets/narzedzia.py (bez -I: PIL jest w pakietach użytkownika) <komenda> ...
#   gra <plik.png>                          -> <plik>_gra.png w 1920x1080 (rozmiar ekranu)
#   portret <plik.png> <out.png> [kolory]   -> portret 128x128 (paleta ograniczona) + <out>_gra.png x4
#   wytnij <plik.png> <x> <y> <w> <h> <out> -> wycinek do inpaintu
#   maska <w> <h> <out> <x0,y0,x1,y1> ...   -> biała maska (zmień) na czarnym, rozmyte brzegi
#   wklej <plik.png> <wycinek.png> <x> <y> <out>
#   sprite <plik.png> <out.png> <rozmiar> [kolory] -> bez tła magenta, kwadrat <rozmiar> px, przezroczysty + <out>_gra.png x4
import sys
from PIL import Image, ImageDraw, ImageFilter

cmd, a = sys.argv[1], sys.argv[2:]
if cmd == "gra":
    im = Image.open(a[0]).convert("RGB")
    out = a[0][:-4] + "_gra.png"
    im.resize((1920, 1080), Image.LANCZOS).save(out)
    print(out)
elif cmd == "rozmiar":  # rozmiar <in> <w> <h> <out>
    Image.open(a[0]).convert("RGB").resize((int(a[1]), int(a[2])), Image.LANCZOS).save(a[3])
elif cmd == "portret":  # portret <in> <out.png> [kolory=32] -> 128x128 + <out>_gra.png (x4 nearest)
    im = Image.open(a[0]).convert("RGB")
    s = min(im.size)
    im = im.crop(((im.width - s) // 2, 0, (im.width + s) // 2, s)).resize((128, 128), Image.LANCZOS)
    im = im.quantize(int(a[2]) if len(a) > 2 else 32, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")  # octree zachowuje jasne punkty (świecące oczy, żar)
    im.save(a[1])
    im.resize((512, 512), Image.NEAREST).save(a[1][:-4] + "_gra.png")
elif cmd == "wytnij":
    x, y, w, h = map(int, a[1:5])
    Image.open(a[0]).convert("RGB").crop((x, y, x + w, y + h)).save(a[5])
elif cmd == "maska":
    w, h = int(a[0]), int(a[1])
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    for r in a[3:]:
        d.rectangle(tuple(map(int, r.split(","))), fill=255)
    m.filter(ImageFilter.GaussianBlur(8)).save(a[2])
elif cmd == "wklej":
    base = Image.open(a[0]).convert("RGB")
    base.paste(Image.open(a[1]).convert("RGB"), (int(a[2]), int(a[3])))
    base.save(a[4])
elif cmd == "sprite":  # sprite <in> <out.png> <rozmiar> [kolory=48, mniej = czarne kropki] -> tło magenta usunięte, przycięte, kwadrat, przezroczyste + <out>_gra.png x4
    im = Image.open(a[0]).convert("RGB")
    # tło = kolor z rogów (model daje magentę albo róż); wycinane zalaniem od krawędzi, więc wnętrze w podobnym kolorze zostaje
    maska = im.copy()
    for xy in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
        ImageDraw.floodfill(maska, xy, (0, 255, 0), thresh=70)
    px = maska.load()
    alfa = Image.new("L", im.size, 255)
    pa = alfa.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] == (0, 255, 0):
                pa[x, y] = 0
    im.putalpha(alfa)
    box = alfa.getbbox()
    im = im.crop(box)
    s = max(im.size) + 8
    kw = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    kw.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    n = int(a[2])
    male = kw.resize((n, n), Image.BOX)
    al = male.getchannel("A").point(lambda v: 255 if v > 140 else 0)
    rgb = male.convert("RGB").quantize(int(a[3]) if len(a) > 3 else 48, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")
    # różowy cień przy krawędzi (model cieniuje magentą): zjadaj magentowe piksele sąsiadujące z przezroczystymi
    pr, pa = rgb.load(), al.load()
    while True:
        zjedz = [(x, y) for y in range(n) for x in range(n) if pa[x, y]
                 and pr[x, y][0] - pr[x, y][1] > 50 and pr[x, y][2] - pr[x, y][1] > 50
                 and any(not (0 <= x + dx < n and 0 <= y + dy < n) or not pa[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        if not zjedz:
            break
        for x, y in zjedz:
            pa[x, y] = 0
    rgb.putalpha(al)
    rgb.save(a[1])
    pod = Image.new("RGBA", (n * 4, n * 4), (24, 22, 30, 255))
    pod.alpha_composite(rgb.resize((n * 4, n * 4), Image.NEAREST))
    pod.save(a[1][:-4] + "_gra.png")
else:
    sys.exit("nieznana komenda " + cmd)
