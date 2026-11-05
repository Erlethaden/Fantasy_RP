// test src/mp4_czas.js: node materialy/test_mp4_czas.mjs <wejście.mp4> <wyjście.mp4> <sekundy> — wpisuje długość i sprawdza nagłówek
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert";
const { uzupelnijCzas } = await import("../src/mp4_czas.js");
const [, , we, wy, sek] = process.argv;
const nowy = new Uint8Array(await (await uzupelnijCzas(new Blob([readFileSync(we)], { type: "video/mp4" }), +sek)).arrayBuffer());
writeFileSync(wy, nowy);
const v = new DataView(nowy.buffer), znajdz = (t, od = 0) => Buffer.from(nowy).indexOf(t, od) - 4;
// [skala czasu, długość] pudełka mvhd/mdhd (wersja 0: 32 bity, 1: 64 bity); tkhd: sama długość (w skali mvhd)
const pola = i => nowy[i + 8] === 1 ? [v.getUint32(i + 28), Number(v.getBigUint64(i + 32))] : [v.getUint32(i + 20), v.getUint32(i + 24)];
const dl = i => nowy[i + 8] === 1 ? Number(v.getBigUint64(i + 36)) : v.getUint32(i + 28);
const [skala, mv] = pola(znajdz("mvhd")); assert.ok(Math.abs(mv / skala - +sek) < 0.01, "mvhd");
for (let i = znajdz("tkhd"); i > 0; i = znajdz("tkhd", i + 8)) assert.ok(Math.abs(dl(i) / skala - +sek) < 0.01, "tkhd");
for (let i = znajdz("mdhd"); i > 0; i = znajdz("mdhd", i + 8)) { const [s_, d] = pola(i); assert.ok(Math.abs(d / s_ - +sek) < 0.01, "mdhd"); }
assert.equal(nowy.length, readFileSync(we).length, "rozmiar bez zmian");
const webm = new Blob([new Uint8Array(4)], { type: "video/webm" }); assert.equal(await uzupelnijCzas(webm, 5), webm, "webm bez zmian");
console.log("OK");
