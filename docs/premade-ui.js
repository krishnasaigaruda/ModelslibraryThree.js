// Shared UI for the model browser (docs/index.html) and the storefront (shop/index.html).
// Needs the page's import map: "three", "three/addons/" and "three-premade".
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CATALOG, CATEGORIES, listModels, createObject, createAnimator, resolveVariant, trimsOf, expandVariants } from 'three-premade';

export const $ = (id) => document.getElementById(id);
export const title = (s) => String(s).replace(/-/g, ' ');
const capWord = (s) => title(s).replace(/^./, (c) => c.toUpperCase());
/** Full display name: "road" + Bicycle → "Road Bicycle" (no repeat when the variant already says it). */
export function fullName(type, variant) {
  const label = CATALOG[type]?.label ?? type;
  const noun = label.replace(/\s*\(HD\)\s*/i, '').replace(/&.*$/, '').trim();
  const v = title(variant);
  const vl = v.toLowerCase();
  const words = noun.toLowerCase().split(/\s+/);
  const has = words.some((w) => w.length > 2 && vl.includes(w.replace(/s$/, '')));
  // only append short single-word type names (Bicycle, Car, Dog, Chair); long labels like
  // "Construction Machine" or "Wolf & Fox" would read badly
  // skip only labels that read badly when appended: "Wolf & Fox", 3+ words, or generic
  // group nouns ("Construction Machine", "Small vehicle", "Kitchen Item")
  const GENERIC = /\b(machine|vehicle|vehicles|item|items|equipment|kit|set|gear|structure|feature|piece|prop|props|stuff|misc)$/i;
  const skip = has || /&/.test(label) || words.length > 2 || GENERIC.test(noun);
  const name = skip ? v : `${v} ${noun}`;
  return /\(HD\)/i.test(label) ? `${name} (HD)` : name;
}
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- catalog helpers ---------- */
export const models = listModels();
export const RING = ['#ff5fa2', '#ff8a4c', '#ffd23f', '#7be36b', '#3fc3ff', '#7a6cff', '#c86bff'];
/** Each category gets one stop of the orbix ring (cycled when there are more than 7). */
export const catColor = (c) => RING[Math.max(0, CATEGORIES.indexOf(c)) % RING.length];
export const trimCount = {};
for (const m of models) if (m.trim) trimCount[`${m.type}:${m.base}`] = (trimCount[`${m.type}:${m.base}`] ?? 0) + 1;
export const baseModels = models.filter((m) => !m.trim);

export function counts() {
  const cats = {};
  const subs = {};
  for (const m of models) {
    cats[m.category] = (cats[m.category] ?? 0) + 1;
    if (m.sub) ((subs[m.category] ??= {})[m.sub] = (subs[m.category][m.sub] ?? 0) + 1);
  }
  return { cats, subs, hd: models.filter((m) => m.quality === 'hd').length };
}

/** Filter for grids. Base variants only unless `versions` is on or the search names a version. */
// Search text: type, label, variant, category, sub, plus catalog `tags` and a few common synonyms.
const SYNONYMS = { wooden: 'wood', metallic: 'metal', tech: 'electronics', technology: 'electronics', gadget: 'electronics', gadgets: 'electronics', devices: 'electronics', computer: 'computer laptop desktop', level: 'map', world: 'map', scene: 'map', environment: 'map', couch: 'sofa', automobile: 'car', lorry: 'truck', bike: 'bicycle motorcycle', telly: 'tv', cellphone: 'phone smartphone', mobile: 'phone smartphone', sneaker: 'shoe', puppy: 'dog', kitten: 'cat', kid: 'child boy girl', plane: 'airplane', aeroplane: 'airplane', ship: 'boat', lamp: 'light', settee: 'sofa', bin: 'trash', garbage: 'trash', rubbish: 'trash', fridge: 'refrigerator fridge', cooker: 'stove oven', sofa: 'couch' };
const searchCache = new Map();
function searchText(m) {
  const k = `${m.type}:${m.variant}`;
  let t = searchCache.get(k);
  if (t == null) {
    const e = CATALOG[m.type];
    t = `${m.type} ${e.label} ${m.variant} ${m.category} ${m.sub ?? ''} ${(e.tags ?? []).join(' ')} ${(e.variantTags?.[m.base] ?? []).join(' ')}`.toLowerCase().replace(/-/g, ' ');
    searchCache.set(k, t);
  }
  return t;
}
export function expandQuery(q) {
  return q.trim().toLowerCase().split(/\s+/).filter(Boolean).map((w) => (SYNONYMS[w] ? `${w}|${SYNONYMS[w]}` : w));
}
// colour words never filter: every model can be recoloured ("red car" → all cars)
const COLOURS = new Set('red blue green black white yellow orange purple pink grey gray brown gold golden silver beige navy teal'.split(' '));
const wordHits = new Map();
/** Search words that actually narrow the results: drops colour words, and words no model matches at all
 *  (e.g. "wooden" in "wooden chair") as long as another word is left. */
function filterWords(q) {
  const all = expandQuery(q);
  const hits = (w) => {
    if (!wordHits.has(w)) wordHits.set(w, models.some((m) => w.split(/[| ]/).some((alt) => alt && searchText(m).includes(alt))));
    return wordHits.get(w);
  };
  const kept = all.filter((w) => !COLOURS.has(w.split('|')[0]) && hits(w));
  return kept.length ? kept : all; // only colour words typed: search them as normal text
}
export function filterModels(opts) {
  let words = filterWords(opts.q ?? '');
  let out = filterWith(opts, words);
  // nothing matches every word ("wooden chair"): drop describing words, earlier ones first, until something does
  while (!out.length && words.length > 1) {
    words = words.slice(1);
    out = filterWith(opts, words);
  }
  return out;
}
function filterWith({ category = 'all', sub = null, quality = 'all', versions = false }, words) {
  return models.filter((m) =>
    (category === 'all' || m.category === category) &&
    (!sub || m.sub === sub) &&
    (quality === 'all' || m.quality === quality) &&
    (versions || !m.trim || (words.length && words.some((w) => w.split(/[| ]/).some((alt) => alt && m.trim.includes(alt))))) &&
    (!words.length || words.every((w) => w.split(/[| ]/).some((alt) => alt && searchText(m).includes(alt)))));
}

/** How well one model matches the search (higher = more relevant). Exact name/tag beats name-start beats
 *  whole word in the name beats variant name beats a loose match anywhere (category, sub, other text). */
function relevance(m, words) {
  const e = CATALOG[m.type];
  const norm = (x) => String(x ?? '').toLowerCase().replace(/[-_]/g, ' ').replace(/\s*\(hd\)\s*/, '').trim();
  const name = norm(e.label);
  const typ = norm(m.type);
  const tags = [...(e.tags ?? []), ...(e.variantTags?.[m.base] ?? [])].map(norm);
  const variant = norm(m.variant);
  let total = 0;
  let top = 0;
  for (const w of words) {
    let best = 0;
    for (const alt of w.split(/[| ]/).filter(Boolean)) {
      const re = new RegExp(`\\b${alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      const wre = new RegExp(`\\b${alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`);
      const exact = (x) => x === alt || x === `${alt}s` || `${x}s` === alt;
      let sc = 0;
      if (exact(name) || exact(typ)) sc = 100;
      else if (tags.some(exact)) sc = 90;
      else if (wre.test(name) || wre.test(typ)) sc = 75; // whole word in the name ("phone booth")
      else if (tags.some((t) => wre.test(t))) sc = 60;
      else if (re.test(name) || re.test(typ)) sc = 40; // a word that only starts with it ("cardboard")
      else if (exact(variant) || wre.test(variant)) sc = 45;
      else if (re.test(variant) || tags.some((t) => re.test(t))) sc = 35;
      else if (name.includes(alt) || typ.includes(alt)) sc = 30;
      else sc = 10; // category / sub / substring elsewhere
      if (alt !== w.split('|')[0]) sc *= 0.85; // synonym hits rank a little below the word typed
      best = Math.max(best, sc);
    }
    total += best;
    top = Math.max(top, best);
  }
  // the strongest word decides ("red car" → cars first), the other words add a smaller bonus
  return top + 0.25 * total + (m.quality === 'hd' ? 1 : 0);
}
/** Orders search results most relevant first, keeping each type's models together (types ranked by their
 *  best match, ties keep catalog order; inside a type the best-matching variants come first). */
export function rankModels(list, q) {
  const words = expandQuery(q);
  if (!words.length) return list;
  const score = new Map(list.map((m) => [m, relevance(m, words)]));
  const typeBest = {};
  const typeFirst = {};
  list.forEach((m, i) => { typeBest[m.type] = Math.max(typeBest[m.type] ?? 0, score.get(m)); typeFirst[m.type] ??= i; });
  const idx = new Map(list.map((m, i) => [m, i]));
  return [...list].sort((a, b) => (typeBest[b.type] - typeBest[a.type]) || (typeFirst[a.type] - typeFirst[b.type]) || (score.get(b) - score.get(a)) || (idx.get(a) - idx.get(b)));
}

export { initTheme } from './code-ui.js';

/* ---------- shared scene look ---------- */
export function makeScene(renderer, { shadow = 0.22 } = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(6, 10, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: shadow }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return { scene, sun };
}

export function frame(object, camera, sun, controls, dir = [1.15, 0.62, 1.35], k = 0.82) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, 0.01);
  const dist = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * k;
  camera.position.copy(center).addScaledVector(new THREE.Vector3(...dir).normalize(), dist);
  camera.near = dist / 100;
  camera.far = dist * 20;
  camera.updateProjectionMatrix();
  camera.lookAt(center);
  if (controls) { controls.target.copy(center); controls.update(); }
  const s = sun.shadow.camera;
  const r = Math.max(radius * 1.6, 2);
  Object.assign(s, { left: -r, right: r, top: r, bottom: -r, near: 0.1, far: r * 8 });
  s.updateProjectionMatrix();
  sun.target.position.copy(center);
  sun.position.copy(center).add(new THREE.Vector3(0.6, 1, 0.7).normalize().multiplyScalar(r * 3));
}

/** Alpha-tested foliage (leaf cards) thins out and vanishes at a distance; with MSAA on,
 *  alpha-to-coverage keeps it solid. Both renderers here use antialias: true. */
export function fixAlpha(obj) {
  obj.traverse((o) => {
    for (const m of [o.material].flat()) if (m && m.alphaTest > 0 && !m.alphaToCoverage) { m.alphaToCoverage = true; m.needsUpdate = true; }
  });
  return obj;
}

/* ---------- stats (computed from a built object, cached) ---------- */
export function measure(obj) {
  let tris = 0;
  let meshes = 0;
  let bytes = 0;
  const geos = new Set();
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    meshes++;
    const g = o.geometry;
    const n = g.index ? g.index.count : g.attributes.position?.count ?? 0;
    tris += Math.floor(n / 3) * (o.isInstancedMesh ? o.count : 1);
    if (geos.has(g)) return;
    geos.add(g);
    for (const a of Object.values(g.attributes)) bytes += a.array?.byteLength ?? 0;
    if (g.index) bytes += g.index.array.byteLength;
  });
  const anims = obj.userData.premade?.animations?.length ?? obj.animations?.length ?? 0;
  return { tris, meshes, anims, bytes };
}
const STATS_KEY = 'premade-stats-v1';
let statsStore = {};
try { statsStore = JSON.parse(localStorage.getItem(STATS_KEY) ?? '{}'); } catch {}
let statsTimer;
export const statsFor = (type, variant) => statsStore[`${type}:${variant}`] ?? null;
export function rememberStats(type, variant, s) {
  statsStore[`${type}:${variant}`] = [s.tris, s.meshes, s.anims, s.bytes];
  clearTimeout(statsTimer);
  statsTimer = setTimeout(() => { try { localStorage.setItem(STATS_KEY, JSON.stringify(statsStore)); } catch {} }, 500);
  document.querySelectorAll(`.stats[data-k="${type}:${variant}"]`).forEach((el) => (el.innerHTML = statsHTML(statsStore[`${type}:${variant}`])));
}
export const fmtNum = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}k` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
export const fmtBytes = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const statsHTML = (s) => (s ? `<b>${fmtNum(s[0])}</b> tris, ~${fmtBytes(s[3])}` : '');

/* ---------- thumbnails: one offscreen renderer shared by every card ---------- */
export function createThumbs(imgBase = 'images/') {
  let tr = null;
  let ts = null;
  let tcam = null;
  const done = new Map(); // key -> Promise<url|null> (settled pictures, prerendered or built)
  const tryImage = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(src); i.onerror = () => ok(null); i.src = src; });
  async function render(type, variant) {
    if (!tr) { // created on first need, so pages with every picture prerendered never open this context
      tr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
      tr.setSize(420, 315);
      tr.setPixelRatio(1);
      tr.setClearColor(0, 0);
      ts = makeScene(tr);
      tcam = new THREE.PerspectiveCamera(35, 4 / 3, 0.1, 1000);
    }
    const obj = fixAlpha(await createObject(type, { variant, lights: false }));
    rememberStats(type, variant, measure(obj)); // free: the object is already built
    ts.scene.add(obj);
    frame(obj, tcam, ts.sun);
    tr.render(ts.scene, tcam);
    const url = tr.domElement.toDataURL('image/png');
    ts.scene.remove(obj);
    return url;
  }

  /* ---- live builds: only for cards on screen, nearest the middle first, one at a time ---- */
  const want = new Map(); // key -> { type, variant, els: Set<Element>, resolve }
  const onScreen = new Set();
  let busy = false;
  const centreDist = (el) => { const r = el.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - innerHeight / 2) + Math.abs(r.left + r.width / 2 - innerWidth / 2) * 0.3; };
  function next() {
    if (busy) return;
    let best = null, bestD = Infinity;
    for (const [k, w] of want) {
      // a request with no element (tile, kit, detail) counts as visible; cards only while on screen
      const els = [...w.els];
      if (els.length && !els.some((e) => onScreen.has(e))) continue;
      const d = els.length ? Math.min(...els.filter((e) => onScreen.has(e)).map(centreDist)) : 0;
      if (d < bestD) { bestD = d; best = k; }
    }
    if (!best) return;
    const w = want.get(best);
    want.delete(best);
    busy = true;
    render(w.type, w.variant).catch((e) => { console.error(best, e); return null; }).then((url) => {
      w.resolve(url);
      busy = false;
      setTimeout(next, 0); // let the page paint / scroll between builds
    });
  }
  /** Picture for a model: prerendered .webp if there is one, else a live build when its card is on screen. */
  function get(type, variant, el = null) {
    const key = `${type}:${variant}`;
    if (!done.has(key)) {
      done.set(key, tryImage(`${imgBase}${type}-${variant}.webp`).then((u) => u ?? new Promise((resolve) => {
        const w = want.get(key) ?? { type, variant, els: new Set(), resolve };
        if (el) w.els.add(el);
        want.set(key, w);
        next();
      })));
    } else if (el && want.has(key)) want.get(key).els.add(el);
    return done.get(key);
  }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const card = en.target;
      if (en.isIntersecting) onScreen.add(card); else onScreen.delete(card);
      if (!en.isIntersecting || card.dataset.asked) continue;
      card.dataset.asked = 1;
      const { type, variant } = card.dataset;
      get(type, variant, card).then((url) => {
        card.querySelector('.thumb').innerHTML = url ? `<img alt="" src="${url}" decoding="async">`
          : `<span class="msg">${CATALOG[type].source === 'glb' ? 'HD file not built yet' : 'Preview failed'}</span>`;
        io.unobserve(card);
        onScreen.delete(card);
      });
    }
    next(); // visibility changed: the build queue re-prioritises (scrolled-past cards drop out)
  }, { rootMargin: '120px' });
  /** Observe every card in `root` that isn't observed yet; its picture loads when it nears the viewport. */
  function watch(root) {
    for (const c of root.querySelectorAll('.card:not([data-seen])')) { c.dataset.seen = 1; io.observe(c); }
  }
  return { get, watch, disconnect: () => io.disconnect() };
}

/* ---------- cards ---------- */
export function cardHTML(m, { versions = false, href = null } = {}) {
  const e = CATALOG[m.type];
  const n = !m.trim && !versions ? trimCount[`${m.type}:${m.base}`] ?? 0 : 0;
  const hd = m.quality === 'hd';
  const tag = href ? 'a' : 'button';
  // a sub named like a top-level category (street › furniture) would read as the wrong category
  const showSub = m.sub && !CATEGORIES.includes(m.sub) && !e.label.toLowerCase().includes(m.sub.replace(/s$/, ''));
  return `<${tag} class="card" data-type="${m.type}" data-variant="${m.variant}"${href ? ` href="${href}"` : ''}>
    <div class="media">
      <div class="thumb"><span class="spin"></span></div>
      <span class="badges"><span class="badge ${hd ? 'hd' : ''}">${hd ? 'HD · GLB' : 'JS'}</span><span class="badge cc0" title="Model licence: CC0 1.0, public domain">CC0</span>${n ? `<span class="badge more">+${n} versions</span>` : ''}</span>
    </div>
    <div class="body">
      <div class="name">${esc(fullName(m.type, m.variant))}</div>
      <div class="kind"><span class="dot" style="--c:${catColor(m.category)}"></span><span>${esc(e.label)}${showSub ? ` · ${esc(title(m.sub).replace(/^./, (c) => c.toUpperCase()))}` : ''}</span></div>
      <div class="stats" data-k="${m.type}:${m.variant}">${statsHTML(statsFor(m.type, m.variant))}</div>
    </div>
  </${tag}>`;
}

/**
 * Paged infinite-scroll grid. `items` can be thousands long; cards are added PAGE at a time
 * when a sentinel nears the viewport, and pictures load only for visible cards.
 */
export function pagedGrid(container, thumbs, { page = 96, grouped = true, onGroup = null } = {}) {
  let items = [];
  let shown = 0;
  let lastType = null;
  let versions = false;
  let totals = {};
  const more = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) append(); }, { rootMargin: '800px' });
  function append() {
    if (shown >= items.length) return;
    const slice = items.slice(shown, shown + page);
    shown += slice.length;
    container.querySelector('.sentinel')?.remove();
    let grid = container.lastElementChild?.classList.contains('grid') ? container.lastElementChild : null;
    if (!grid && !grouped) { container.insertAdjacentHTML('beforeend', '<div class="grid"></div>'); grid = container.lastElementChild; }
    let html = '';
    for (const m of slice) {
      if (grouped && m.type !== lastType) {
        if (html) { grid.insertAdjacentHTML('beforeend', html); html = ''; }
        const e = CATALOG[m.type];
        container.insertAdjacentHTML('beforeend', `<div class="group-title" data-cat="${e.category}" data-sub="${e.sub ?? ''}">${esc(e.label)} <span>${totals[m.type].toLocaleString()}</span></div><div class="grid"></div>`);
        grid = container.lastElementChild;
        onGroup?.(grid.previousElementSibling); // e.g. scroll-spy observes each heading as it's appended
        lastType = m.type;
      }
      html += cardHTML(m, { versions });
    }
    if (html) grid.insertAdjacentHTML('beforeend', html);
    thumbs.watch(container);
    if (shown < items.length) {
      container.insertAdjacentHTML('beforeend', '<div class="sentinel empty">Loading more models</div>');
      more.observe(container.querySelector('.sentinel'));
    }
  }
  function set(list, opts = {}) {
    items = list;
    versions = !!opts.versions;
    totals = {};
    for (const m of list) totals[m.type] = (totals[m.type] ?? 0) + 1;
    more.disconnect();
    container.innerHTML = list.length ? '' : `<p class="empty">${opts.empty ?? 'No models match. Try a shorter search or another category.'}</p>`;
    shown = 0;
    lastType = null;
    append();
  }
  return { set };
}

/* ---------- detail page ---------- */
const SWATCHES = ['#1d1c1a', '#f4f4f2', '#9aa3ab', '#b3261e', '#24477a', '#1f5a38', '#f2c200', '#ff8a4c', '#6b4f9a', '#7a6a58'];
const varName = (type) => type.replace(/-(\w)/g, (_, c) => c.toUpperCase());

/** The createObject + animator lines for one configured model (no import line). */
export function codeBody(p, name = varName(p.type)) {
  const opts = [`variant: '${p.variant}'`, ...Object.entries(p.colors ?? {}).map(([k, v]) => `${k}: '${v}'`)];
  const playing = [...(p.playing ?? [])];
  let code = `const ${name} = await createObject('${p.type}', { ${opts.join(', ')} });\nscene.add(${name});`;
  if (playing.length) {
    code += `\n\nconst ${name}Anim = createAnimator(${name});\n`;
    if (p.speed && p.speed !== 1) code += `${name}Anim.setSpeed(${p.speed}); // ${p.speed < 1 ? 'slow motion' : 'faster'}\n`;
    code += playing.map((n) => `${name}Anim.play('${n}');`).join('\n');
  }
  return code;
}
export const withImports = (body, anim, loop = 'anim.update(clock.getDelta());') =>
  `import { createObject${anim ? ', createAnimator' : ''} } from 'three-premade';\n\n${body}${anim ? `\n\n// in your render loop:\n// ${loop}` : ''}`;

export function createDetail({ thumbs, onCategory, onType, actions = [] } = {}) {
  document.body.insertAdjacentHTML('beforeend', `
  <dialog class="detail" id="detail" aria-label="Model details">
    <div class="d-top">
      <span class="orbix" aria-hidden="true"></span>
      <nav class="crumbs" id="d-crumbs" aria-label="Breadcrumb"></nav>
      <span class="grow"></span>
      <button class="btn ghost" id="d-close">Close</button>
    </div>
    <div class="d-wrap">
      <div class="d-main">
        <div class="d-left">
          <div class="stage" id="d-stage" tabindex="-1">
            <div class="msg" id="d-msg"><span class="spin"></span></div>
            <div class="tools"><button class="btn ghost" id="d-reset" title="Reset camera">Reset view</button></div>
            <span class="hint">Drag to orbit · click then scroll to zoom · right-drag to pan</span>
          </div>
          <div class="specs" id="d-specs"></div>
          <p class="spec-note" id="d-note"></p>
        </div>
        <aside class="d-side">
          <div>
            <h1 id="d-title"></h1>
            <div class="of" id="d-of"></div>
          </div>
          <div class="formats" id="d-formats"></div>
          <section><h3>Variant</h3><div class="pills" id="d-variants"></div></section>
          <section id="d-trim-sec"><h3>Version</h3><div class="pills" id="d-trims"></div></section>
          <section id="d-color-sec"><h3>Colors</h3><div id="d-colors"></div></section>
          <section>
            <h3>Animations <span class="hint-inline">click to toggle, several can run together</span></h3>
            <div class="pills" id="d-anims"></div>
            <label class="speed">Speed <input type="range" id="d-speed" min="0.1" max="3" step="0.05" value="1"><output id="d-speed-out">1.00×</output></label>
            <button class="pill" id="d-stop">Stop all</button>
          </section>
          <section><h3>Code</h3><pre class="code" id="d-code"></pre></section>
          <div class="actions">
            <button class="btn" id="d-copy">Copy code</button>
            <button class="btn ghost" id="d-glb">Download .glb</button>
            <button class="btn ghost" id="d-png">Save image</button>
            ${actions.map((a, i) => `<button class="btn ${a.primary ? '' : 'ghost'}" data-act="${i}">${a.label}</button>`).join('')}
          </div>
          <div class="error" id="d-error"></div>
        </aside>
      </div>
      <section class="d-more">
        <div class="sec-head"><h2>More like this</h2></div>
        <div class="row" id="d-more"></div>
      </section>
    </div>
  </dialog>`);
  const dialog = $('detail');

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  $('d-stage').prepend(renderer.domElement);
  const view = makeScene(renderer);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  // Scrolling the page over the viewer must not zoom into the model: the wheel only zooms
  // after you click/drag in the viewer, and stops again when the pointer leaves it.
  controls.enableZoom = false;
  renderer.domElement.addEventListener('pointerdown', () => { controls.enableZoom = true; });
  renderer.domElement.addEventListener('pointerleave', () => { controls.enableZoom = false; });
  controls.enableDamping = true;
  const clock = new THREE.Clock();
  const state = { type: null, variant: null, colors: {}, object: null, animator: null, playing: new Set(), speed: 1 };

  // Only show colour rows that change this model: build it once with a unique probe colour per
  // key and see which probes end up in its materials.
  const allColorKeys = (type) => {
    const keys = Object.keys(CATALOG[type].options ?? {}).filter((k) => /color$/i.test(k));
    return keys.length ? keys : ['color'];
  };
  const usedKeys = new Map();
  async function detectColorKeys(type, variant) {
    const id = `${type}:${variant}`;
    if (usedKeys.has(id)) return usedKeys.get(id);
    const keys = allColorKeys(type);
    if (keys.length < 2) { usedKeys.set(id, keys); return keys; }
    const probes = {};
    keys.forEach((k, i) => (probes[k] = new THREE.Color().setHSL(i / keys.length, 0.9, 0.5)));
    try {
      const obj = await createObject(type, { variant, lights: false, ...Object.fromEntries(keys.map((k) => [k, `#${probes[k].getHexString()}`])) });
      const found = new Set();
      obj.traverse((o) => {
        for (const m of [o.material].flat()) {
          if (!m?.color) continue;
          for (const k of keys) {
            const p = probes[k];
            if (Math.abs(m.color.r - p.r) + Math.abs(m.color.g - p.g) + Math.abs(m.color.b - p.b) < 0.12) found.add(k);
          }
        }
      });
      const res = keys.filter((k) => found.has(k) || k === 'color');
      usedKeys.set(id, res);
      return res;
    } catch {
      return keys;
    }
  }
  const colorKeys = (type) => usedKeys.get(`${type}:${state.variant}`) ?? allColorKeys(type);

  function resize() {
    const { clientWidth: w, clientHeight: h } = $('d-stage');
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe($('d-stage'));
  renderer.setAnimationLoop(() => {
    if (!dialog.open) return;
    const dt = clock.getDelta();
    state.animator?.update(dt);
    controls.update();
    renderer.render(view.scene, camera);
  });

  const codeFor = () => withImports(codeBody(state, varName(state.type)), state.playing.size > 0, `${varName(state.type)}Anim.update(clock.getDelta());`);

  function renderSpecs(s) {
    const entry = CATALOG[state.type];
    const cell = (v, l) => `<div class="spec"><b>${v}</b><span>${l}</span></div>`;
    $('d-specs').innerHTML = cell(s ? s.tris.toLocaleString() : '–', 'triangles') + cell(s ? s.meshes : '–', 'meshes') +
      cell(s ? s.anims : '–', 'animations') + cell(expandVariants(entry).length.toLocaleString(), 'versions');
    $('d-note').textContent = s ? `About ${fmtBytes(s.bytes)} of geometry as an exported .glb (before compression).` : '';
  }

  let loadToken = 0;
  async function load({ keepCamera = false, keepSide = false } = {}) {
    $('d-error').textContent = '';
    const token = ++loadToken;
    if (!keepCamera) {
      // a different model: clear the old one straight away and show the loading screen until the new one is built
      if (state.object) { view.scene.remove(state.object); state.object = null; state.animator = null; }
      const big = CATALOG[state.type]?.category === 'maps';
      $('d-msg').hidden = false;
      $('d-msg').innerHTML = `<div class="loader"><span class="ring"></span><b>Building ${esc(fullName(state.type, state.variant))}</b><small>${big ? 'A whole map: hundreds of models are being assembled' : CATALOG[state.type]?.source === 'glb' ? 'Downloading the HD .glb' : 'Generated live in your browser from code'}</small><span class="bar"><i></i></span></div>`;
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); // let the loader paint before the build starts
      if (token !== loadToken) return;
    }
    try {
      const obj = fixAlpha(await createObject(state.type, { variant: state.variant, ...state.colors }));
      if (token !== loadToken && !keepSide) return; // a newer pick won
      if (state.object) view.scene.remove(state.object);
      state.object = obj;
      view.scene.add(obj);
      $('d-msg').hidden = true;
      state.animator = createAnimator(obj);
      state.animator.setSpeed(state.speed);
      const names = obj.userData.premade.animations;
      state.playing = new Set([...state.playing].filter((n) => names.includes(n)));
      for (const n of state.playing) state.animator.play(n, { fade: 0 });
      if (!keepCamera) frame(obj, camera, view.sun, controls);
      // while dragging a colour picker, don't rebuild the side panel (that would close the picker)
      if (keepSide) $('d-code').textContent = codeFor();
      else {
        const s = measure(obj);
        rememberStats(state.type, state.variant, s);
        renderSpecs(s);
        renderSide();
        const v = state.variant;
        detectColorKeys(state.type, v).then(() => { if (state.variant === v) renderSide(); });
      }
    } catch (e) {
      console.error(e);
      if (token !== loadToken) return;
      if (state.object) { view.scene.remove(state.object); state.object = null; state.animator = null; }
      const glb = CATALOG[state.type].source === 'glb';
      $('d-msg').hidden = false;
      $('d-msg').textContent = glb ? 'HD file not built yet' : 'This model failed to build.';
      if (!glb) $('d-error').textContent = e.message;
      renderSpecs(null);
      renderSide();
    }
  }

  function renderAnims() {
    const names = state.object?.userData.premade.animations ?? [];
    $('d-anims').innerHTML = names.length
      ? names.map((n) => `<button class="pill ${state.animator.isOneShot(n) ? 'oneshot' : ''}" data-a="${n}" aria-pressed="${state.playing.has(n)}" ${state.animator.isOneShot(n) ? 'title="Plays once"' : ''}>${n.replace(/([A-Z])/g, ' $1').toLowerCase()}</button>`).join('')
      : '<span class="spec-note">None for this model</span>';
    $('d-code').textContent = codeFor();
  }

  function renderCrumbs() {
    const entry = CATALOG[state.type];
    const { variant: base, trim } = resolveVariant(entry, state.variant) ?? { variant: state.variant, trim: null };
    const parts = [
      `<button data-crumb="home">Home</button>`,
      `<button data-crumb="cat">${esc(entry.category)}</button>`,
      `<button data-crumb="type">${esc(entry.label)}</button>`,
      trim ? `<button data-crumb="base">${esc(title(base))}</button>` : `<span aria-current="page">${esc(title(base))}</span>`,
      ...(trim ? [`<span aria-current="page">${esc(title(trim))}</span>`] : []),
    ];
    $('d-crumbs').innerHTML = parts.join('<span class="sep">/</span>');
  }

  function renderSide() {
    const entry = CATALOG[state.type];
    const hd = entry.quality === 'hd';
    $('d-title').textContent = fullName(state.type, state.variant);
    // category first, then sub-category: street › furniture is not the furniture category
    $('d-of').innerHTML = `<span class="dot" style="--c:${catColor(entry.category)}"></span><span>${esc(entry.label)} in ${esc(capWord(entry.category))}${entry.sub && entry.sub !== entry.category ? ` › ${esc(capWord(entry.sub))}` : ''}</span>`;
    $('d-formats').innerHTML = (hd ? '<span class="format hd">HD · Blender .glb</span>' : entry.source === 'glb' ? '<span class="format">GLB · Blender</span>' : '<span class="format">JS · procedural</span>') +
      '<span class="format">GLB export</span>' + (state.object?.userData.premade.animations.length ? '<span class="format">Animated</span>' : '') +
      '<a class="format cc0" href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener" title="Free for any use, commercial included, no attribution needed. The library code is MIT.">CC0 · public domain</a>';
    renderCrumbs();
    const { variant: base, trim } = resolveVariant(entry, state.variant) ?? { variant: state.variant, trim: null };
    $('d-variants').innerHTML = entry.variants.map((v) => `<button class="pill" data-v="${v}" aria-pressed="${v === base}">${esc(title(v))}</button>`).join('');
    const trims = trimsOf(entry, base);
    $('d-trim-sec').hidden = !trims.length;
    $('d-trims').innerHTML = [null, ...trims].map((t) => `<button class="pill" data-v="${t ? `${base}-${t}` : base}" aria-pressed="${t === trim}">${t ? esc(title(t)) : 'standard'}</button>`).join('');
    $('d-colors').innerHTML = colorKeys(state.type).map((k) => `
      <div class="color-row" data-key="${k}">
        <span>${k === 'color' ? 'main' : k.replace(/Color$/, '').replace(/([A-Z])/g, ' $1')}</span>
        <div class="swatches">
          <button class="pill" data-c="" aria-pressed="${!state.colors[k]}">Default</button>
          ${SWATCHES.map((c) => `<button class="swatch" data-c="${c}" style="background:${c}" aria-pressed="${state.colors[k] === c}" title="${c}"></button>`).join('')}
          <input type="color" value="${state.colors[k] ?? '#3366cc'}" title="Custom colour">
        </div>
      </div>`).join('');
    renderAnims();
  }

  function renderMore() {
    const entry = CATALOG[state.type];
    const { variant: base } = resolveVariant(entry, state.variant) ?? { variant: state.variant };
    const same = baseModels.filter((m) => m.type === state.type && m.variant !== base).slice(0, 6);
    const near = [];
    for (const [t, e] of Object.entries(CATALOG)) {
      if (t === state.type || e.category !== entry.category || (entry.sub && e.sub !== entry.sub)) continue;
      near.push(baseModels.find((m) => m.type === t));
      if (near.length >= 12 - same.length) break;
    }
    const list = [...same, ...near.filter(Boolean)];
    $('d-more').innerHTML = list.map((m) => cardHTML(m)).join('');
    $('d-more').closest('.d-more').hidden = !list.length;
    thumbs?.watch($('d-more'));
  }

  const pickVariant = (e) => {
    const v = e.target.dataset.v;
    if (!v) return;
    state.variant = v;
    history.replaceState(null, '', `#${state.type}/${v}`);
    load({ keepCamera: e.currentTarget.id === 'd-trims' });
    if (e.currentTarget.id === 'd-variants') renderMore();
  };
  $('d-variants').addEventListener('click', pickVariant);
  $('d-trims').addEventListener('click', pickVariant);
  const setColor = (key, value) => {
    if (value) state.colors[key] = value;
    else delete state.colors[key];
    load({ keepCamera: true });
  };
  $('d-colors').addEventListener('click', (e) => {
    if (!('c' in e.target.dataset)) return;
    setColor(e.target.closest('.color-row').dataset.key, e.target.dataset.c);
  });
  // Live colour while dragging: rebuild at most one model at a time, always with the latest colour.
  let building = false;
  let pendingColor = null;
  async function liveColor() {
    if (building || !pendingColor) return;
    building = true;
    const { key, value } = pendingColor;
    pendingColor = null;
    state.colors[key] = value;
    await load({ keepCamera: true, keepSide: true });
    building = false;
    if (pendingColor) requestAnimationFrame(liveColor);
  }
  $('d-colors').addEventListener('input', (e) => {
    if (e.target.type !== 'color') return;
    pendingColor = { key: e.target.closest('.color-row').dataset.key, value: e.target.value };
    liveColor();
  });
  // when the picker closes, refresh the swatch highlight
  $('d-colors').addEventListener('change', (e) => { if (e.target.type === 'color') setTimeout(renderSide, 50); });
  $('d-anims').addEventListener('click', (e) => {
    const n = e.target.dataset.a;
    if (!n || !state.animator) return;
    const on = state.animator.toggle(n);
    state.playing = new Set(state.animator.playing);
    if (!on) state.playing.delete(n);
    renderAnims();
  });
  $('d-speed').addEventListener('input', (e) => {
    state.speed = +e.target.value;
    $('d-speed-out').textContent = `${state.speed.toFixed(2)}×`;
    state.animator?.setSpeed(state.speed);
    $('d-code').textContent = codeFor();
  });
  $('d-stop').addEventListener('click', () => {
    state.animator?.stop();
    state.playing.clear();
    renderAnims();
  });
  $('d-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(codeFor()); $('d-copy').textContent = 'Copied'; }
    catch { $('d-copy').textContent = 'Copy blocked'; }
    setTimeout(() => ($('d-copy').textContent = 'Copy code'), 1200);
  });
  $('d-glb').addEventListener('click', async () => {
    if (!state.object) return;
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    // only the animations you have switched on (none selected → none exported)
    const anims = state.object.animations.filter((a) => state.playing.has(a.name));
    const data = await new GLTFExporter().parseAsync(state.object, { binary: true, animations: anims });
    download(new Blob([data], { type: 'model/gltf-binary' }), `${state.type}-${state.variant}.glb`);
  });
  $('d-png').addEventListener('click', () => renderer.domElement.toBlob((b) => download(b, `${state.type}-${state.variant}.png`)));
  $('d-reset').addEventListener('click', () => state.object && frame(state.object, camera, view.sun, controls));
  dialog.querySelector('.actions').addEventListener('click', (e) => {
    const i = e.target.closest('[data-act]')?.dataset.act;
    if (i != null) actions[i].onClick({ ...state, colors: { ...state.colors }, playing: [...state.playing] }, e.target.closest('[data-act]'));
  });
  $('d-more').addEventListener('click', (e) => {
    const c = e.target.closest('.card');
    if (c) { open(c.dataset.type, c.dataset.variant); dialog.scrollTo({ top: 0 }); }
  });
  $('d-crumbs').addEventListener('click', (e) => {
    const k = e.target.dataset.crumb;
    if (!k) return;
    const entry = CATALOG[state.type];
    if (k === 'base') { state.variant = resolveVariant(entry, state.variant).variant; history.replaceState(null, '', `#${state.type}/${state.variant}`); load({ keepCamera: true }); return; }
    const type = state.type;
    dialog.close();
    if (k === 'cat') onCategory?.(entry.category);
    if (k === 'type') onType?.(type);
  });
  function download(blob, name) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function open(type, variant) {
    Object.assign(state, { type, variant, colors: {}, playing: new Set() });
    history.replaceState(null, '', `#${type}/${variant}`);
    if (!dialog.open) { dialog.showModal(); $('d-stage').focus({ preventScroll: true }); document.documentElement.style.overflow = 'hidden'; }
    $('d-msg').hidden = false;
    $('d-msg').innerHTML = '<span class="spin"></span>';
    $('d-title').textContent = fullName(type, variant);
    renderCrumbs();
    renderSpecs(null);
    resize();
    load();
    renderMore();
  }
  $('d-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
    state.animator?.stop();
  });
  /** Open whatever #type/variant the URL names (used on load and on hashchange). */
  function fromHash() {
    const [ht, hv] = decodeURIComponent(location.hash.slice(1)).split('/');
    if (ht && CATALOG[ht]) { open(ht, hv && resolveVariant(CATALOG[ht], hv) ? hv : CATALOG[ht].variants[0]); return true; }
    return false;
  }
  addEventListener('hashchange', fromHash);
  return { open, fromHash, dialog, isOpen: () => dialog.open };
}

export const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
