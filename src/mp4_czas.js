// MediaRecorder (Chromium) zapisuje MP4 w kawałkach (moof) i w nagłówku zostawia długość 0 (mvhd) albo długość pierwszego kawałka (tkhd, mdhd).
// Przeglądarka i VLC liczą długość same, ale Windows, telefony i podgląd Discorda czytają nagłówek → „0:00” / „0:03” i brak przewijania.
// Tu: wpisujemy prawdziwą długość w istniejące pola (bez zmiany rozmiaru pudełek, więc przesunięcia danych zostają). WebM — bez zmian.
const KONTENERY = new Set(["moov", "trak", "mdia"]);

export async function uzupelnijCzas(blob, sekundy) {
  if (!blob.type.startsWith("video/mp4")) return blob;
  const b = new Uint8Array(await blob.arrayBuffer()), v = new DataView(b.buffer);
  const typ = i => String.fromCharCode(...b.subarray(i + 4, i + 8));
  // pole długości: wersja 0 — 32 bity, wersja 1 — 64 bity; skala czasu: mvhd/mdhd z pudełka, tkhd ze skali filmu (mvhd)
  const wpisz = (i, ofs, skala) => { const w = Math.round(sekundy * skala);
    if (b[i + 8] === 1) v.setBigUint64(i + ofs[1], BigInt(w)); else v.setUint32(i + ofs[0], Math.min(w, 0xffffffff)); };
  let skalaFilmu = 1000;
  const przejdz = (od, do_) => {
    for (let i = od; i + 8 <= do_;) {
      const r = v.getUint32(i), t = typ(i); if (r < 8 || i + r > do_) return;   // uszkodzone / rozmiar 64-bit (nie w nagłówku MediaRecordera)
      if (t === "mvhd" || t === "mdhd") { const skala = v.getUint32(i + (b[i + 8] === 1 ? 28 : 20)); if (t === "mvhd") skalaFilmu = skala; wpisz(i, [24, 32], skala); }
      else if (t === "tkhd") wpisz(i, [28, 36], skalaFilmu);
      else if (KONTENERY.has(t)) przejdz(i + 8, i + r);
      if (t === "moof") return;   // nagłówek jest przed kawałkami danych
      i += r;
    }
  };
  przejdz(0, b.length);
  return new Blob([b], { type: blob.type });
}
