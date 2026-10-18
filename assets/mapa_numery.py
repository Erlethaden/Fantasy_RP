# Zapis jednorazowego przypisania numerów (2026-10-18) — tylko do wglądu: korzystał z plików roboczych (odczyty z wycinków, kopia komorki_2.png), których już nie ma.
# Wynik: materialy/mapa/edycje.json (scalenia + numery), odtwarzany przez edytor. Odczytane numery z pozycjami: materialy/mapa/numery_odczyt.json.
import json, sys, collections
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
S = sys.argv[1]
w = np.array(Image.open("materialy/mapa/edytor/komorki.png").convert("RGB")).astype(np.int32); w = w[..., 0] * 256 + w[..., 1]   # 1/4
w2 = np.array(Image.open("materialy/mapa/komorki_2.png")).astype(np.int32)
stare = np.array(Image.open("_kopie/2026-10-18_mapa-numery/komorki_2.png")).astype(np.int32)
num = collections.defaultdict(collections.Counter)
for p in json.load(open(S + "/numery.json", encoding="utf-8")):
    k = int(w2[p["y"], p["x"]])
    if k: num[k][p["n"]] += 50 if p.get("recznie") else 1
# komórki odczytane z kontekstu i ręczne poprawki: po starym id → nowe id = najczęstsze w obszarze starej komórki
def nowe(k_stare):
    v = w2[stare == k_stare]; v = v[v > 0]
    return int(np.bincount(v).argmax()) if len(v) else 0
recz = {}
for p in open(S + "/kontekst.txt").read().split():
    k, n = p.split(":"); recz[int(k)] = n
recz.update({228: "51", 263: "51", 247: "51", 193: "181", 147: "197"})
for k, n in recz.items():
    kn = nowe(k)
    if kn: num[kn] = collections.Counter({n: 99})
SCAL = [(263, 247), (292, 308)]   # numer przecięty granicą: obie części to jeden obszar
print("przed:", {k: dict(num.get(k, {})) for k in (725, 89, 809, 520)})
for k, n in {}.items(): num[k] = collections.Counter({n: 99})
for a, b in SCAL: num.pop(b, None)
przyp = {}
for k, c in num.items():
    if len(c) > 1: print("komórka z kilkoma numerami:", k, dict(c))
    przyp[k] = c.most_common(1)[0][0]
istn = set(np.unique(w).tolist()) - {0} - set(json.load(open("materialy/mapa/obiekty.json"))["jeziora"])
przyp = {k: n for k, n in przyp.items() if k in istn}
licz = collections.Counter(przyp.values())
print("prowincji:", len(licz), "komórek z numerem:", len(przyp))
print("z 1 komórką:", sorted(map(int, [n for n, c in licz.items() if c == 1])))
print("z >2 komórkami:", sorted((int(n), c) for n, c in licz.items() if c > 2))
print("brak 1..315:", [n for n in range(1, 316) if str(n) not in licz])
json.dump(przyp, open(S + "/przyp.json", "w"))
# komórki bez numeru wśród komórek z numerami (skrawki gór, okruchy) → do sąsiada z numerem o najdłuższej wspólnej granicy
jez = set(json.load(open("materialy/mapa/obiekty.json"))["jeziora"])
gran = collections.Counter()
for a, b in ((w[:, :-1], w[:, 1:]), (w[:-1], w[1:])):
    m = (a != b) & (a > 0) & (b > 0)
    for x, y in zip(a[m].tolist(), b[m].tolist()): gran[(x, y)] += 1; gran[(y, x)] += 1
sas = collections.defaultdict(dict)
for (x, y), c in gran.items(): sas[x][y] = c
for a, b in SCAL: przyp.pop(b, None)
from scipy import ndimage as ndi
g = np.array(Image.open("materialy/mapa/edytor/gory.png")) > 127
g = ndi.binary_dilation(g, iterations=6)
gory_udz = np.bincount(w[g], minlength=w.max() + 1) / np.maximum(np.bincount(w.ravel(), minlength=w.max() + 1), 1)
scal_bez = []; korzen = {}
def znajdz(x):
    while x in korzen: x = korzen[x]
    return x
oryg = set(przyp)   # komórki z numerem z rysunku (dołączone skrawki nie liczą się do reguły 50%, inaczej ląd bez numerów zjadany jest falą)
for _ in range(10):
    for k in sorted(istn - set(przyp) - jez - {b for _, b in SCAL} - set(korzen)):
        s = {x: c for x, c in sas[k].items() if x not in jez}
        if not s: continue
        z_num = {x: c for x, c in s.items() if x in przyp}
        z_oryg = sum(c for x, c in s.items() if x in oryg)
        otoczony = all(x in przyp for x in s)
        if not z_num or not (z_oryg * 2 >= sum(s.values()) or (gory_udz[k] >= 0.2 and (z_oryg > 0 or otoczony))): continue
        a = znajdz(max(z_num, key=z_num.get)); scal_bez.append((a, k)); przyp[k] = przyp[a]; korzen[k] = a
        for x, c in sas[k].items(): sas[a][x] = sas[a].get(x, 0) + c; sas[x][a] = sas[x].get(a, 0) + c
print("dołączone komórki bez numeru:", len(scal_bez))
json.dump(scal_bez, open(S + "/scal_bez.json", "w"))
for a, k in scal_bez: przyp.pop(k)
# prowincja z 3 komórkami: najmniejszą dołącz do sąsiadującej komórki z tym samym numerem
pole = np.bincount(w.ravel())
po3 = collections.defaultdict(list)
for k, n in przyp.items(): po3[n].append(k)
for n, ks in po3.items():
    if len(ks) < 3: continue
    m = min(ks, key=lambda k: pole[k]); cel = [k for k in ks if k != m and gran.get((m, k))]
    if cel: a = max(cel, key=lambda k: gran[(m, k)]); scal_bez.append((a, m)); przyp.pop(m); print("3 komórki:", n, "→ scalone", a, m)
# dwie wyspy z tym samym numerem = dwie osobne prowincje (użytkownik): druga dostaje id „Nb”, pierwsza „Na”
lad, _ = ndi.label(w > 0, structure=np.ones((3, 3)))
wl = {}
for k in przyp:
    yy, xx = np.nonzero(w == k); wl[k] = int(lad[yy[0], xx[0]])
roz_ladu = np.bincount(lad.ravel())
po_num = collections.defaultdict(list)
for k, n in przyp.items(): po_num[n].append(k)
for n, ks in po_num.items():
    if len(ks) == 2 and wl[ks[0]] != wl[ks[1]] and max(roz_ladu[wl[k]] for k in ks) < 300000:
        a, b = sorted(ks); przyp[a] = n + "a"; przyp[b] = n + "b"; print("wyspy:", n)
ops = [{"t": "scal", "a": a, "b": b} for a, b in SCAL + scal_bez] + [{"t": "numer", "id": int(k), "n": n} for k, n in sorted(przyp.items(), key=lambda x: (int(x[1].rstrip("ab")), x[1]))]
json.dump({"wersja": 1, "ops": ops}, open("materialy/mapa/edycje.json", "w", encoding="utf-8"))
print("operacji:", len(ops))
