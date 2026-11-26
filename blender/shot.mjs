// Real-time headless screenshot (no virtual time, so texture decoding + Draco workers finish).
//   node blender/shot.mjs <out.png> "<preview query>" [width] [height] [page]
// Waits until document.title === 'done' (test/preview.html sets it) or 90 s.
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [out, query = '', w = '1000', h = '420', page = 'test/preview.html'] = process.argv.slice(2);
const prof = mkdtempSync(join(tmpdir(), 'hdshot-'));
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
  `--window-size=${w},${h}`, `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Page.navigate', { url: `http://127.0.0.1:5173/${page}?${query}` });
let ok = false;
for (let i = 0; i < 180; i++) {
  await sleep(500);
  const r = await send('Runtime.evaluate', { expression: 'document.title' });
  if (r.result?.result?.value === 'done') { ok = true; break; }
}
await sleep(300);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(ok ? `saved ${out}` : `TIMEOUT (saved anyway) ${out}`);
ws.close(); chrome.kill(); await sleep(300);
rmSync(prof, { recursive: true, force: true });
process.exit(0);
