// Nagrywa klatki menu (tryb ?nagranie): 7 scen po SEK sekund, FPS klatek/s, zrzuty JPEG 1920×1080
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [url, out] = process.argv.slice(2), FPS = 15, SEK = 4;
const ch = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", "--remote-debugging-port=9334", "--window-size=1920,1080", "--allow-file-access-from-files", `--user-data-dir=${out}/../prof`, "about:blank"]);
await new Promise(r => setTimeout(r, 1500));
const ws = new WebSocket((await (await fetch("http://127.0.0.1:9334/json")).json()).find(x => x.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const czeka = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (czeka[m.id]) { czeka[m.id](m); delete czeka[m.id]; } };
const cdp = (method, params = {}) => new Promise(r => { czeka[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const js = async expression => { const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); };
await cdp("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url }); await new Promise(r => setTimeout(r, 3000));
await js("document.fonts.ready");
let n = 0;
for (let s = 0; s < 7; s++) {
  await js(`nagranie.scena(${s}); sala.sceny[${s}].wydechOd = sala.t + 1.7`);
  for (let f = 0; f < FPS * SEK; f++) {
    await js(`sala.krok(${1 / FPS})`);
    const r = await cdp("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}/k${String(n++).padStart(4, "0")}.png`, Buffer.from(r.result.data, "base64"));
  }
}
console.log("klatek", n); ws.close(); ch.kill();
