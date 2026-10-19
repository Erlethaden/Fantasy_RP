# Podgląd terenu obok rysunku (7.6e): python assets/mapa_podglad.py <id,id,...> <wynik.png> [promień px 2500, domyślnie 110] [obraz zamiast teren.png]
#   do sprawdzania zgłoszeń o złych rzekach i górach — lewa kolumna teren.png, prawa oryginalny rysunek
import json, sys
from PIL import Image, ImageDraw
Image.MAX_IMAGE_PIXELS = None
ids = sys.argv[1].split(","); out = sys.argv[2]; R = int(sys.argv[3]) if len(sys.argv) > 3 else 110
L = {p["id"]: p for p in json.load(open("assets/mapa/prowincje.json", encoding="utf-8"))}
T = Image.open(sys.argv[4] if len(sys.argv) > 4 else "assets/mapa/teren.png").convert("RGB"); rys = Image.open("materialy/Mapa RPG.png").convert("L")
S = 2; W = 2 * R * S
ark = Image.new("RGB", (2 * W + 10, len(ids) * (W + 18)), "white"); d = ImageDraw.Draw(ark)
for i, n in enumerate(ids):
    x, y = int(L[n]["x"] / 2), int(L[n]["y"] / 2); b = (x - R, y - R, x + R, y + R)
    ark.paste(T.crop(b).resize((W, W), Image.NEAREST), (0, i * (W + 18) + 16))
    ark.paste(rys.crop(tuple(v * 8 for v in b)).resize((W, W), Image.LANCZOS).convert("RGB"), (W + 10, i * (W + 18) + 16))
    d.text((3, i * (W + 18) + 2), f"{n}  (srodek 2500: {x},{y})", fill=(0, 0, 0))
ark.save(out)
