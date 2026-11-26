// Renders a PNG of every model into docs/images using headless Chrome.
// Needs the dev server running:  npm run serve   (in another terminal)
// Usage: npm run thumbnails [-- <type>]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error('Chrome not found. Set CHROME_PATH.');

const port = process.env.PORT ?? 5173;
try {
  await fetch(`http://127.0.0.1:${port}/package.json`);
} catch {
  console.error(`Start the dev server first:  npm run serve`);
  process.exit(1);
}
const type = process.argv[2];
const profile = mkdtempSync(join(tmpdir(), 'premade-thumbs-'));
const url = `http://127.0.0.1:${port}/scripts/thumbs.html${type === 'showroom' ? '?showroom=1' : type === 'shop' ? '?shop=1' : type ? `?type=${type}` : ''}`;
console.log('Rendering thumbnails…');
const out = execFileSync(CHROME, [
  // GPU=1 renders on the real GPU (much faster for big scenes such as maps); default is software (CI-safe)
  ...(process.env.GPU ? ['--headless=new', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--headless=new', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
  `--user-data-dir=${profile}`, '--virtual-time-budget=900000', '--dump-dom', url,
], { encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] });
rmSync(profile, { recursive: true, force: true });
const m = out.match(/<title>(.*?)<\/title>/);
console.log(m ? m[1] : 'finished');
