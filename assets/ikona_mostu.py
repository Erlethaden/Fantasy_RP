# ikonka mostu 24x24 (6.2e, wersja 2 — pierwsza z jednym łukiem wyglądała jak namiot): płaski kamienny most z trzema łukami nad wodą
from PIL import Image
W = [
"KKKKKKKKKKKKKKKKKKKKKKKK",
"KWWWWWWWWWWWWWWWWWWWWWWK",
"KMK.K..K..K..K..K..K.KMK",
"KKKKKKKKKKKKKKKKKKKKKKKK",
"KWWWWWWWWWWWWWWWWWWWWWWK",
"KLLLLLLLLLLLLLLLLLLLLLLK",
"KMMMMMMMMMMMMMMMMMMMMMMK",
"KMMKKKKMMMKKKKMMMKKKKMMK",
"KMKccccKMKccccKMKccccKMK",
"KDKccccKDKccccKDKccccKDK",
"KDKbbbbKDKbbbbKDKbbbbKDK",
"BDDbbbbDDDbbbbDDDbbbbDDB",
"BBBBBBBBBBBBBBBBBBBBBBBB",
"BbBBBBbbBBBBBBbBBBBBbbBB",
]
C = {'K': (34, 22, 12), 'W': (238, 222, 186), 'L': (214, 186, 136), 'M': (186, 150, 98), 'D': (138, 104, 64),
     'c': (40, 52, 70), 'b': (70, 130, 200), 'B': (96, 160, 226)}
assert all(len(r) == 24 for r in W)
im = Image.new('RGBA', (24, 24), (0, 0, 0, 0)); p = im.load(); y0 = (24 - len(W)) // 2
for y, r in enumerate(W):
    for x, c in enumerate(r):
        if c in C: p[x, y0 + y] = C[c] + (255,)
im.save('E:/ClaudeAI/Projekty/fantasy rp/assets/mapa/ikony/most.png')
im.resize((768, 768), Image.NEAREST).save('E:/ClaudeAI/Projekty/fantasy rp/assets/mapa/ikony/most_1024.png')
pod = Image.new('RGBA', (200, 96), (236, 222, 190, 255))
ciemne = Image.new('RGBA', (96, 96), (24, 22, 30, 255)); ciemne.alpha_composite(im.resize((96, 96), Image.NEAREST))
pod.alpha_composite(im.resize((96, 96), Image.NEAREST), (0, 0)); pod.alpha_composite(ciemne, (104, 0))
pod.save('E:/ClaudeAI/Projekty/fantasy rp/assets/_drafts/most_v5_gra.png')
print("ok")
