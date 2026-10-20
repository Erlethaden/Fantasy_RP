# przybliżenie fragmentu portretu ×16 z siatką co 1 px (etykiety co 2) — oczy: python twarz.py <dir> <out> nazwa:x,y,w,h ...
import sys
from PIL import Image, ImageDraw
src, out, specs = sys.argv[1], sys.argv[2], sys.argv[3:]
K, M = 16, 22
kadry = []
for s in specs:
    n, r = s.split(":"); x, y, w, h = map(int, r.split(",")); kadry.append((n, x, y, w, h))
W = Image.new("RGB", (sum(w * K + M for _, _, _, w, _ in kadry) + M, max(h for *_, h in kadry) * K + 2 * M), (0, 0, 0))
d = ImageDraw.Draw(W); ox = M
for n, x, y, w, h in kadry:
    im = Image.open(f"{src}/{n}.png").convert("RGB").crop((x, y, x + w, y + h)).resize((w * K, h * K), Image.NEAREST)
    W.paste(im, (ox, M + 12))
    for i in range(w + 1):
        d.line([(ox + i * K, M + 12), (ox + i * K, M + 12 + h * K)], fill=(70, 70, 70) if (x + i) % 2 else (200, 200, 0))
        if (x + i) % 2 == 0 and i < w: d.text((ox + i * K + 2, M), str(x + i), fill=(255, 255, 255))
    for j in range(h + 1):
        d.line([(ox, M + 12 + j * K), (ox + w * K, M + 12 + j * K)], fill=(70, 70, 70) if (y + j) % 2 else (200, 200, 0))
        if (y + j) % 2 == 0 and j < h: d.text((ox - M + 1, M + 12 + j * K + 2), str(y + j), fill=(255, 255, 255))
    d.text((ox + 3, M + 14), n, fill=(0, 255, 0)); ox += w * K + M
W.save(out)
