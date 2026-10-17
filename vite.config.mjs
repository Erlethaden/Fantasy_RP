import { defineConfig } from "vite";

// base "./" — zbudowana strona działa też z pliku (Electron, GitHub Pages w podfolderze)
// chunkSizeWarningLimit: Firebase sam ma ~600 kB, a aplikacja ładuje się lokalnie (program/dysk), więc rozmiar nie przeszkadza
export default defineConfig({ base: "./", build: { outDir: "dist", chunkSizeWarningLimit: 1500 } });
