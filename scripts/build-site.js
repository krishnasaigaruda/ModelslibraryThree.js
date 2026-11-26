// Builds the static website for Cloudflare Pages (or any static host) into dist/.
//   npm run build:site
// Cloudflare Pages settings:  Build command: npm run build:site   ·   Build output directory: dist
// Everything is static: the shop (/shop/), the model browser (/docs/), the library source (/src/, loaded as
// ES modules), prerendered pictures (/docs/images/) and the HD .glb files (/hd/models/). three.js comes from
// the jsDelivr CDN via the import maps. Pictures are NOT rendered on Pages (no GPU there): render them locally
// (npm run serve keeps them in sync automatically) and commit docs/images before deploying.
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'dist');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const copy = (from, to = from) => existsSync(join(ROOT, from)) && cpSync(join(ROOT, from), join(OUT, to), { recursive: true, filter: (p) => !/\/(\.DS_Store|\.fingerprints\.json)$/.test(p) });
for (const d of ['shop', 'docs', 'src']) copy(d);
copy('hd/models');
for (const f of ['LICENSE', 'LICENSE-MODELS.md', 'README.md']) copy(f);

// simple 404 page (used by the Worker's not_found_handling)
writeFileSync(join(OUT, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Not found · three-premade</title></head><body style="font:16px system-ui;padding:48px"><h1>Page not found</h1><p><a href="/shop/">Go to the shop</a> · <a href="/docs/">Browse models</a></p></body></html>\n`);
// home page → the shop
writeFileSync(join(OUT, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>three-premade · 3D models for three.js</title>
<meta http-equiv="refresh" content="0; url=shop/"><link rel="canonical" href="shop/"></head><body><a href="shop/">three-premade</a></body></html>\n`);
// Cloudflare Pages: clean URLs + caching. Pictures and .glb files change rarely; code revalidates.
writeFileSync(join(OUT, '_redirects'), '/ /shop/ 302\n/browse /docs/ 302\n/guide /docs/guide.html 302\n');
writeFileSync(join(OUT, '_headers'), `/docs/images/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/hd/models/*
  Cache-Control: public, max-age=604800, immutable
  Access-Control-Allow-Origin: *
/src/*
  Cache-Control: public, max-age=300, must-revalidate
  Access-Control-Allow-Origin: *
/*.html
  Cache-Control: public, max-age=60, must-revalidate
`);

const count = (p) => (statSync(p).isDirectory() ? readdirSync(p).reduce((n, f) => n + count(join(p, f)), 0) : 1);
const n = count(OUT);
console.log(`dist/ ready: ${n.toLocaleString()} files (Cloudflare Pages limit: 20,000; 25 MB per file)`);
if (n > 20000) { console.error('Too many files for Cloudflare Pages'); process.exit(1); }
