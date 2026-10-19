# znak bitwy na mapę 24x24 (7.1g): skrzyżowane miecze na czerwonym kole z ciemnym obrysem
from PIL import Image
W = [
"........................",
"........KKKKKKKK........",
"......KKRRRRRRRRKK......",
".....KRRRRRRRRRRRRK.....",
"....KRRLRRRRRRRRLRRK....",
"...KRRRLLRRRRRRLLRRRK...",
"...KRRRRLLRRRRLLRRRRK...",
"..KRRRRRRLLRRLLRRRRRRK..",
"..KRRRRRRRLLLLRRRRRRRK..",
"..KRRRRRRRRLLRRRRRRRRK..",
"..KRRRRRRRLLLLRRRRRRRK..",
"..KRRRRRRLLRRLLRRRRRRK..",
"..KRRRRGLLRRRRLLGRRRRK..",
"..KRRRRRGGRRRRGGRRRRRK..",
"...KRRRGRRGRRGRRGRRRK...",
"...KRRRRRRRRRRRRRRRRK...",
"....KRRRRRRRRRRRRRRK....",
".....KRRRRRRRRRRRRK.....",
"......KKRRRRRRRRKK......",
"........KKKKKKKK........",
"........................",
"........................",
"........................",
"........................",
]
C = {'K': (34, 22, 12), 'R': (168, 36, 30), 'L': (236, 232, 220), 'G': (240, 200, 70)}
assert all(len(r) == 24 for r in W) and len(W) == 24
im = Image.new('RGBA', (24, 24), (0, 0, 0, 0)); p = im.load()
for y, r in enumerate(W):
    for x, c in enumerate(r):
        if c in C: p[x, y] = C[c] + (255,)
im.save('E:/ClaudeAI/Projekty/fantasy rp/assets/mapa/ikony/bitwa.png')
pod = Image.new('RGBA', (200, 96), (236, 222, 190, 255))
ciemne = Image.new('RGBA', (96, 96), (24, 22, 30, 255)); ciemne.alpha_composite(im.resize((96, 96), Image.NEAREST))
pod.alpha_composite(im.resize((96, 96), Image.NEAREST), (0, 0)); pod.alpha_composite(ciemne, (104, 0))
pod.save('E:/ClaudeAI/Projekty/fantasy rp/assets/_drafts/bitwa_gra.png')
print("ok")
