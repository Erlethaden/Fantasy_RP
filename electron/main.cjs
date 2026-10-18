// Okno programu: zbudowana strona z dist/ (npm run app), serwowana z wbudowanego serwera na http://localhost —
// z file:// Firebase nie pozwala logować się przez Google (auth/unauthorized-domain), a localhost jest dozwolony
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const DIST = path.join(__dirname, "../dist");
const PORT = 47821; // stały: od adresu (z portem) zależy zapamiętane logowanie i zapis DEMO
const TYPY = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".ico": "image/x-icon" };

// jedna kopia programu naraz (druga i tak nie dostałaby portu) — drugie uruchomienie pokazuje pierwsze okno
if (!app.requestSingleInstanceLock()) { app.quit(); return; }
let okno = null;
app.on("second-instance", () => { if (okno) { if (okno.isMinimized()) okno.restore(); okno.focus(); } });

const serwer = http.createServer((req, res) => {
  const plik = path.normalize(path.join(DIST, decodeURIComponent(new URL(req.url, "http://localhost").pathname)));
  if (!plik.startsWith(DIST)) { res.writeHead(403).end(); return; } // tylko pliki z dist/
  const doWyslania = fs.existsSync(plik) && fs.statSync(plik).isFile() ? plik : path.join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": TYPY[path.extname(doWyslania)] || "application/octet-stream" });
  fs.createReadStream(doWyslania).pipe(res);
});
serwer.on("error", e => {
  dialog.showErrorBox("Fantasy RP", e.code === "EADDRINUSE" ? `Port ${PORT} jest zajęty — czy program nie jest już otwarty?` : String(e));
  app.quit();
});

// Google odrzuca logowanie w „osadzonych przeglądarkach” rozpoznawanych po dopisku Electron w user-agencie
app.userAgentFallback = app.userAgentFallback.replace(/ Electron\/\S+/, "").replace(` ${app.getName()}/${app.getVersion()}`, "");

// aktualizacje z GitHub Releases (package.json → build.publish); stan idzie do strony przez preload.cjs → window.aktualizacje
// obowiązkowe: strona blokuje logowanie, dopóki jest nowsza wersja; brak sieci/GitHuba nie blokuje
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
let stanAktualizacji = { stan: app.isPackaged ? "sprawdzam" : "brak" }; // w trybie deweloperskim (npm run app) nie sprawdzamy
const wyslij = s => { stanAktualizacji = s; okno?.webContents.send("aktualizacja", s); };
autoUpdater.on("update-available", i => wyslij({ stan: "dostepna", wersja: i.version }));
autoUpdater.on("update-not-available", () => wyslij({ stan: "brak" }));
autoUpdater.on("download-progress", p => wyslij({ stan: "pobieram", wersja: stanAktualizacji.wersja, procent: Math.round(p.percent) }));
autoUpdater.on("update-downloaded", () => { wyslij({ stan: "instaluje", wersja: stanAktualizacji.wersja }); setTimeout(() => autoUpdater.quitAndInstall(true, true), 800); });
autoUpdater.on("error", e => wyslij({ stan: stanAktualizacji.stan === "pobieram" ? "blad-pobierania" : "blad", wersja: stanAktualizacji.wersja, opis: String(e?.message || e).slice(0, 300) }));
ipcMain.handle("aktualizacja-stan", () => stanAktualizacji);
ipcMain.handle("aktualizacja-pobierz", () => autoUpdater.downloadUpdate().catch(() => {})); // błąd przyjdzie zdarzeniem „error”

app.whenReady().then(() => serwer.listen(PORT, "localhost", () => {
  okno = new BrowserWindow({ width: 1600, height: 900, backgroundColor: "#0b0c12", autoHideMenuBar: true, title: "Fantasy RP dla autystów",
    icon: path.join(__dirname, "../build/icon.png"), webPreferences: { preload: path.join(__dirname, "preload.cjs") } });
  okno.loadURL(`http://localhost:${PORT}/`);
  if (!app.isPackaged) return;
  autoUpdater.checkForUpdates().catch(() => {});
  // potem co 15 minut po cichu (bez stanu „sprawdzam”, żeby nie blokować); znaleziona wersja zasłania program na cały ekran
  setInterval(() => { if (["brak", "blad"].includes(stanAktualizacji.stan)) autoUpdater.checkForUpdates().catch(() => {}); }, 15 * 60 * 1000);
}));
app.on("window-all-closed", () => { serwer.close(); app.quit(); });
