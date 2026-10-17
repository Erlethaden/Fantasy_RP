# Skleja GIF-y w jeden; paleta globalna każdego kolejnego pliku staje się paletą lokalną jego klatek.
import sys
def bloki(d):
    p = 13 + (3 << ((d[10] & 7) + 1) if d[10] & 0x80 else 0); paleta = d[13:p] if d[10] & 0x80 else b""
    ramki = bytearray()
    while d[p] != 0x3B:
        if d[p] == 0x21:  # rozszerzenie
            q = p + 2
            while d[q]: q += d[q] + 1
            q += 1
            if d[p + 1] != 0xFF: ramki += d[p:q]  # pomija NETSCAPE (pętla) — dodamy raz
            p = q
        elif d[p] == 0x2C:  # obraz: deskryptor (+ paleta lokalna), potem dane LZW
            pk = d[p + 9]; q = p + 10
            if pk & 0x80: q += 3 << ((pk & 7) + 1); ramki += d[p:q]
            else: ramki += d[p:p + 9] + bytes([(pk & 0x78) | 0x80 | (d[10] & 7)]) + paleta
            s = q; q += 1
            while d[q]: q += d[q] + 1
            q += 1
            ramki += d[s:q]; p = q
        else: raise ValueError(f"nieznany blok {d[p]:#x} @ {p}")
    return ramki
pliki = [open(f, "rb").read() for f in sys.argv[2:]]
naglowek = bytearray(pliki[0][:13]); naglowek[10] &= 0x7F  # bez palety globalnej
petla = b"\x21\xFF\x0BNETSCAPE2.0\x03\x01\x00\x00\x00"
with open(sys.argv[1], "wb") as f:
    f.write(naglowek + petla + b"".join(bloki(d) for d in pliki) + b"\x3B")
