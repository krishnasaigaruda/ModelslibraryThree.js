// Keeps docs/images (prerendered model pictures) in sync with the model code.
//   node scripts/thumbs-watch.js           → check once, then watch src/ and refresh on every change
//   node scripts/thumbs-watch.js --once    → check once and exit
// Each category module (src/models/<module>.js + src/models/<module>/**) gets a fingerprint (hash of its
// source). When it changes, that module's pictures are deleted at once — the browser then builds those
// models live (always correct) — and fresh pictures are rendered in the background on the GPU.
// A change in src/core/** affects every module. Needs the dev server (npm run serve starts this for you).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, unlinkSync, watch } from 'node:fs';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const IMAGES = join(ROOT, 'docs', 'images');
const FP_FILE = join(IMAGES, '.fingerprints.json');
const { CATALOG } = await import(join(ROOT, 'src', 'catalog.js'));

const files = (p) => (!existsSync(p) ? [] : statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => files(join(p, f))) : [p]);
const hashOf = (list) => { const h = createHash('sha1'); for (const f of list.sort()) h.update(relative(ROOT, f)).update(readFileSync(f)); return h.digest('hex').slice(0, 16); };
const modules = [...new Set(Object.values(CATALOG).filter((e) => e.source === 'js').map((e) => e.module))];
function fingerprints() {
  const core = hashOf(files(join(ROOT, 'src', 'core')));
  return Object.fromEntries(modules.map((m) => [m, `${core}:${hashOf([...files(join(ROOT, 'src', 'models', `${m}.js`)), ...files(join(ROOT, 'src', 'models', m))])}`]));
}
const typesOf = (m) => Object.entries(CATALOG).filter(([, e]) => e.module === m).map(([t]) => t);

let busy = false;
let again = false;
function run(args) {
  return new Promise((ok) => {
    const p = spawn(process.execPath, [join(ROOT, 'scripts', 'thumbnails.js'), ...args], { env: { ...process.env, GPU: process.env.GPU ?? '1' }, stdio: 'ignore' });
    p.on('exit', ok);
  });
}
async function check() {
  if (busy) { again = true; return; }
  busy = true;
  const now = fingerprints();
  if (!existsSync(FP_FILE)) { writeFileSync(FP_FILE, JSON.stringify(now, null, 1)); busy = false; return; } // first run: pictures are taken as current
  const old = JSON.parse(readFileSync(FP_FILE, 'utf8'));
  const changed = modules.filter((m) => old[m] !== now[m]);
  if (changed.length) {
    const pics = existsSync(IMAGES) ? readdirSync(IMAGES).filter((f) => f.endsWith('.webp')) : [];
    const rerenderTypes = new Set();
    for (const m of changed) {
      const types = typesOf(m);
      for (const f of pics) {
        const t = types.filter((x) => f.startsWith(`${x}-`)).sort((a, b) => b.length - a.length)[0];
        if (!t) continue;
        if (existsSync(join(IMAGES, f))) unlinkSync(join(IMAGES, f)); // stale picture gone now: the browser builds this model live until re-rendered
        if (m === 'maps' || t === 'car') rerenderTypes.add(t); // whole types that are fully prerendered
      }
    }
    console.log(`[thumbs] code changed in ${changed.join(', ')}: re-rendering pictures…`);
    for (const t of rerenderTypes) await run([t]);
    await run(['showroom']); // resumable: renders only the pictures that are missing
    await run(['shop']);
    writeFileSync(FP_FILE, JSON.stringify(now, null, 1));
    console.log('[thumbs] pictures up to date');
  } else if (!existsSync(FP_FILE)) writeFileSync(FP_FILE, JSON.stringify(now, null, 1));
  busy = false;
  if (again) { again = false; check(); }
}

await check();
if (!process.argv.includes('--once')) {
  let timer;
  watch(join(ROOT, 'src'), { recursive: true }, (_, f) => {
    if (!f || !f.endsWith('.js') || f.startsWith('catalog')) return;
    clearTimeout(timer);
    timer = setTimeout(check, 4000); // wait for a burst of saves to settle
  });
  console.log('[thumbs] watching src/ for model changes');
}
