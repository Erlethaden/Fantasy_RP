// Most między programem a stroną: tylko to, czego potrzebuje ekran aktualizacji (bez dostępu strony do Node/Electrona)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aktualizacje", {
  stan: () => ipcRenderer.invoke("aktualizacja-stan"),
  pobierz: () => ipcRenderer.invoke("aktualizacja-pobierz"),
  naZmiane: cb => ipcRenderer.on("aktualizacja", (_, s) => cb(s)),
});
