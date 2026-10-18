import { defineConfig } from "vite";

// base "./" — zbudowana strona działa też z pliku (Electron, GitHub Pages w podfolderze)
// chunkSizeWarningLimit: Firebase sam ma ~600 kB, a aplikacja ładuje się lokalnie (program/dysk), więc rozmiar nie przeszkadza
// edytor mapy (edytor-mapy/, tylko w trybie dev): zapis wyników do materialy/mapa/
import { writeFileSync } from "node:fs";
const PLIKI_EDYTORA = ["edycje.json", "komorki_final.png", "gory_final.png", "prowincje.json"];
const zapisEdytora = {
  name: "zapis-edytora-mapy",
  configureServer(server) {
    server.middlewares.use("/__zapisz", (req, res) => {
      const plik = new URL(req.url, "http://x").searchParams.get("plik");
      if (req.method !== "POST" || !PLIKI_EDYTORA.includes(plik)) { res.statusCode = 400; return res.end("zły plik"); }
      const czesci = [];
      req.on("data", c => czesci.push(c));
      req.on("end", () => { writeFileSync("materialy/mapa/" + plik, Buffer.concat(czesci)); res.end("ok"); });
    });
  },
};

export default defineConfig({ base: "./", build: { outDir: "dist", chunkSizeWarningLimit: 1500 }, plugins: [zapisEdytora] });
