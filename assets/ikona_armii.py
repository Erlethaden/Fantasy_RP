# ikonka armii 24x24: sztandar na drzewcu; flaga w kolorach-kluczach (podmieniane w programie na kolor frakcji)
from PIL import Image
W = [
"..KK....................",
".KGGK...................",
".KGGK...................",
"..KWKKKKKKKKKKKKKKKK....",
"..KWKHHHHHHHHHHHHHHK....",
"..KWKHFFFFFFFFFFFFFK....",
"..KWKFFFFFFFFFFFFFFK....",
"..KWKFFFFFFFFFFFFFFK....",
"..KWKFFFFFFFFFFFFFK.....",
"..KWKFFFFFFFFFFFFK......",
"..KWKFFFFFFFFFFFK.......",
"..KWKFFFFFFFFFFFFK......",
"..KWKFFFFFFFFFFFFFK.....",
"..KWKSSSSSSSSSSSSSSK....",
"..KWKSSSSSSKKSSSSSSK....",
"..KWKKKKKKKK..KKKKKK....",
"..KWK...................",
"..KWK...................",
"..KWK...................",
"..KWK...................",
".KKWKK..................",
"KDDDDDK.................",
"KDDDDDDK................",
"KKKKKKKK................",
]
C = {'K': (34, 22, 12), 'G': (240, 200, 70), 'W': (120, 78, 40), 'D': (140, 128, 112),
     'F': (255, 0, 255), 'H': (255, 120, 255), 'S': (160, 0, 160)}   # klucze: F główny, H jaśniejszy, S ciemniejszy
MIECZE = ["L.....L", ".L...L.", "..L.L..", "...L...", "..L.L..", "GL...LG", ".G...G."]   # skrzyżowane miecze na fladze
for j, r in enumerate(MIECZE):
    W[5 + j] = W[5 + j][:8] + "".join(c if c != "." else W[5 + j][8 + i] for i, c in enumerate(r)) + W[5 + j][15:]
C['L'] = (236, 232, 220)
assert all(len(r) == 24 for r in W) and len(W) == 24
im = Image.new('RGBA', (24, 24), (0, 0, 0, 0)); p = im.load()
for y, r in enumerate(W):
    for x, c in enumerate(r):
        if c in C: p[x, y] = C[c] + (255,)
im.save('E:/ClaudeAI/Projekty/fantasy rp/assets/mapa/ikony/armia.png')
# podgląd: kilka kolorów frakcji na jasnym i ciemnym tle
kol = [(200, 80, 30), (58, 110, 216), (90, 160, 44), (176, 30, 40), (31, 167, 154)]
pod = Image.new('RGBA', (len(kol) * 104, 208), (236, 222, 190, 255))
for i, k in enumerate(kol):
    t = im.copy(); q = t.load()
    for y in range(24):
        for x in range(24):
            r, g, b, a = q[x, y]
            if (r, g, b) == C['F']: q[x, y] = k + (255,)
            elif (r, g, b) == C['H']: q[x, y] = tuple(min(255, v + 50) for v in k) + (255,)
            elif (r, g, b) == C['S']: q[x, y] = tuple(int(v * .6) for v in k) + (255,)
    pod.alpha_composite(t.resize((96, 96), Image.NEAREST), (i * 104 + 4, 4))
    ciemne = Image.new('RGBA', (96, 96), (24, 22, 30, 255)); ciemne.alpha_composite(t.resize((96, 96), Image.NEAREST))
    pod.alpha_composite(ciemne, (i * 104 + 4, 108))
pod.save('E:/ClaudeAI/Projekty/fantasy rp/assets/_drafts/armia_pod.png')
print("ok")
