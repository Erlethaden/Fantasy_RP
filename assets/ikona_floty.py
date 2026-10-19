# ikonka floty 24x24 (7.8c): okręt z żaglem w kolorach-kluczach (F/H/S — program podmienia na kolor kraju, jak w ikona_armii.py)
from PIL import Image
N = 24
p = {}
for y in range(1, 17): p[(11, y)] = 'W'; p[(12, y)] = 'W'          # maszt
for x in range(13, 17): p[(x, 1)] = 'G'; p[(x, 2)] = 'G' if x < 16 else None   # proporczyk
for y in range(4, 14):                                               # żagiel rejowy, wybrzuszony ku dołowi
    w = 6 + (y - 4) // 3
    for x in range(12 - w, 12 + w):
        if x in (11, 12) and y in (4, 13): continue
        p[(x, y)] = 'H' if y == 4 or x == 12 - w else 'S' if y == 13 or x == 12 + w - 1 else 'F'
for y, (a, b) in zip(range(15, 20), [(2, 21), (3, 20), (4, 19), (5, 18), (6, 17)]):   # kadłub
    for x in range(a, b + 1): p[(x, y)] = 'J' if y == 15 else 'B' if y == 19 else 'D'
for x in (7, 11, 15): p[(x, 17)] = 'K'                                # furty
p = {k: v for k, v in p.items() if v}
for x, y in list(p):                                                 # obrys 1 px
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        q = (x + dx, y + dy)
        if 0 <= q[0] < N and 0 <= q[1] < N and q not in p: p[q] = 'K'
for x in range(1, 23):                                               # fale pod kadłubem
    if (x // 3) % 2 == 0 and (x, 21) not in p: p[(x, 21)] = 'U'
    if (x // 3) % 2 == 1 and (x, 22) not in p: p[(x, 22)] = 'U'
C = {'K': (34, 22, 12), 'G': (240, 200, 70), 'W': (120, 78, 40), 'D': (122, 76, 38), 'J': (168, 112, 58), 'B': (78, 46, 22),
     'U': (210, 235, 250), 'F': (255, 0, 255), 'H': (255, 120, 255), 'S': (160, 0, 160)}
im = Image.new('RGBA', (N, N), (0, 0, 0, 0)); px = im.load()
for (x, y), c in p.items():
    if 0 <= x < N and 0 <= y < N: px[x, y] = C[c] + (255,)
im.save('E:/ClaudeAI/Projekty/fantasy rp/assets/mapa/ikony/flota.png')
# podgląd: kilka kolorów krajów na jasnym i ciemnym tle
kol = [(200, 80, 30), (58, 110, 216), (90, 160, 44), (176, 30, 40), (31, 167, 154)]
pod = Image.new('RGBA', (len(kol) * 104, 208), (236, 222, 190, 255))
for i, k in enumerate(kol):
    t = im.copy(); q = t.load()
    for y in range(N):
        for x in range(N):
            r, g, b, a = q[x, y]
            if (r, g, b) == C['F']: q[x, y] = k + (255,)
            elif (r, g, b) == C['H']: q[x, y] = tuple(min(255, v + 50) for v in k) + (255,)
            elif (r, g, b) == C['S']: q[x, y] = tuple(int(v * .6) for v in k) + (255,)
    pod.alpha_composite(t.resize((96, 96), Image.NEAREST), (i * 104 + 4, 4))
    ciemne = Image.new('RGBA', (96, 96), (24, 40, 90, 255)); ciemne.alpha_composite(t.resize((96, 96), Image.NEAREST))
    pod.alpha_composite(ciemne, (i * 104 + 4, 108))
pod.save('E:/ClaudeAI/Projekty/fantasy rp/assets/_drafts/flota_pod.png')
print("ok")
