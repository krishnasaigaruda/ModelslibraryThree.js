import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { rng } from '../../core/utils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { heavyMats, Merge as HeavyMerge, bevelBox } from '../vehicles/heavy-kit.js';

/*
 * Shared kit for the 'military' category: camouflage schemes (canvas textures, guarded for
 * Node), material sets for vehicles / field gear / arms, and small canvas-texture helpers.
 * No firearms anywhere in this category.
 */

export { bevelBox };

/** Split triangles (non-indexed position/normal/uv) until no edge is longer than maxLen. */
export function splitLong(g, maxLen) {
  const names = ['position', 'normal', 'uv'].filter((n) => g.attributes[n]);
  const sizes = names.map((n) => g.attributes[n].itemSize);
  let data = names.map((n) => Array.from(g.attributes[n].array));
  for (let pass = 0; pass < 8; pass++) {
    const P = data[0];
    const out = names.map(() => []);
    let split = false;
    const tri = P.length / 9;
    for (let t = 0; t < tri; t++) {
      const v = (k) => [P[t * 9 + k * 3], P[t * 9 + k * 3 + 1], P[t * 9 + k * 3 + 2]];
      const A = v(0); const B = v(1); const C = v(2);
      const d = (u, w) => Math.hypot(u[0] - w[0], u[1] - w[1], u[2] - w[2]);
      const e = [d(A, B), d(B, C), d(C, A)];
      const mx = Math.max(...e);
      const push = (order, mids) => {
        // order: list of 3 vertex refs; each ref is 0,1,2 (corner) or 'm' (midpoint of the split edge)
        names.forEach((_, ai) => {
          const sz = sizes[ai];
          const src = data[ai];
          for (const ref of order) {
            if (ref === 'm') {
              const [i0, i1] = mids;
              for (let c = 0; c < sz; c++) out[ai].push((src[(t * 3 + i0) * sz + c] + src[(t * 3 + i1) * sz + c]) / 2);
            } else for (let c = 0; c < sz; c++) out[ai].push(src[(t * 3 + ref) * sz + c]);
          }
        });
      };
      if (mx <= maxLen) { push([0, 1, 2]); continue; }
      split = true;
      if (mx === e[0]) { push([0, 'm', 2], [0, 1]); push(['m', 1, 2], [0, 1]); }
      else if (mx === e[1]) { push([0, 1, 'm'], [1, 2]); push([0, 'm', 2], [1, 2]); }
      else { push([0, 1, 'm'], [2, 0]); push(['m', 1, 2], [2, 0]); }
    }
    data = out;
    if (!split) break;
  }
  const res = new THREE.BufferGeometry();
  names.forEach((n, i) => res.setAttribute(n, new THREE.Float32BufferAttribute(data[i], sizes[i])));
  return res;
}

/** Rough surface-sampling cost of a geometry (what test/floating.js rasterises). */
function sampleCost(g, cell = 0.012) {
  const p = g.attributes.position.array;
  let c = 0;
  for (let i = 0; i < p.length; i += 9) {
    const l = Math.max(Math.hypot(p[i] - p[i + 3], p[i + 1] - p[i + 4], p[i + 2] - p[i + 5]), Math.hypot(p[i + 3] - p[i + 6], p[i + 4] - p[i + 7], p[i + 5] - p[i + 8]), Math.hypot(p[i] - p[i + 6], p[i + 1] - p[i + 7], p[i + 2] - p[i + 8]));
    const n = Math.min(64, Math.max(1, Math.ceil(l / cell)));
    c += ((n + 1) * (n + 2)) / 2;
  }
  return c;
}

/**
 * Merge that flushes each material into several meshes of bounded size, so every part's real
 * surface is checked by the floating-parts test (and frustum culling stays effective).
 */
export class Merge extends HeavyMerge {
  add(geo, mat, opts) {
    super.add(geo, mat, opts);
    const list = this.parts.get(mat);
    const g = list[list.length - 1];
    g.computeBoundingBox();
    const sz = g.boundingBox.getSize(new THREE.Vector3());
    if (Math.max(sz.x, sz.y, sz.z) > 0.76) list[list.length - 1] = splitLong(g, 0.74);
    return this;
  }
  flush(parent, name, { budget = 250000 } = {}) {
    const out = [];
    for (const [mat, list] of this.parts) {
      let chunk = [];
      let cost = 0;
      const emit = () => {
        if (!chunk.length) return;
        const geo = chunk.length === 1 ? chunk[0] : mergeGeometries(chunk, false);
        const m = new THREE.Mesh(geo, mat);
        if (name) m.name = out.length ? `${name}_${out.length}` : name;
        parent.add(m);
        out.push(m);
        chunk = [];
        cost = 0;
      };
      for (const g of list) {
        const c = sampleCost(g);
        if (cost + c > budget) emit();
        chunk.push(g);
        cost += c;
      }
      emit();
    }
    this.parts.clear();
    return out;
  }
}

/** Camouflage schemes: base colour + blotch colours + pattern style. */
export const CAMO = {
  standard: { base: '#434d2e', spots: [], style: 'plain', canvas: '#59603c', tone: 'green' },
  olive: { base: '#5a5c30', spots: ['#4c4f28', '#646838'], style: 'blotch', canvas: '#6b6a42', tone: 'green' },
  woodland: { base: '#5d6538', spots: ['#2f3b22', '#6f5b3c', '#1d1e17'], style: 'blotch', canvas: '#4e5634', tone: 'green' },
  desert: { base: '#c6ad7e', spots: ['#a98c5d', '#dcc89e', '#8d7350'], style: 'blotch', canvas: '#cdb68a', tone: 'tan' },
  arctic: { base: '#e4e8e9', spots: ['#a9b1b4', '#cdd3d5'], style: 'blotch', canvas: '#eceeee', tone: 'white' },
  urban: { base: '#8b8e91', spots: ['#5c5f63', '#b8babd', '#34373b'], style: 'digital', canvas: '#7d8084', tone: 'grey' },
  'un-white': { base: '#f0f0ec', spots: [], style: 'plain', canvas: '#e9e9e4', tone: 'white' },
};
export const CAMO_TRIMS = ['woodland', 'desert', 'arctic', 'urban', 'olive', 'un-white'];
export const PART_TRIMS = ['addon-armour', 'mine-plough', 'dozer-blade', 'cage-armour', 'cargo-racks'];
/** woodland, …, addon-armour, …, woodland-addon-armour, … (41 trims). */
export const VEHICLE_TRIMS = [...CAMO_TRIMS, ...PART_TRIMS, ...CAMO_TRIMS.flatMap((c) => PART_TRIMS.map((p) => `${c}-${p}`))];

/** Split a vehicle trim into { camo, part }. */
export function splitTrim(trim) {
  if (!trim) return { camo: 'standard', part: null };
  for (const c of CAMO_TRIMS) {
    if (trim === c) return { camo: c, part: null };
    if (trim.startsWith(`${c}-`)) return { camo: c, part: trim.slice(c.length + 1) };
  }
  return { camo: 'standard', part: trim };
}

const texCache = new Map();
/** Seamless-ish camouflage texture (1 tile ≈ 1/repeat metres). Null in Node. */
export function camoTexture(name) {
  if (typeof document === 'undefined') return null;
  const s = CAMO[name];
  if (!s || !s.spots.length) return null;
  if (texCache.has(name)) return texCache.get(name);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = s.base;
  g.fillRect(0, 0, 256, 256);
  const r = rng(`camo-${name}`);
  if (s.style === 'digital') {
    const cell = 8;
    for (const col of s.spots) {
      for (let k = 0; k < 22; k++) {
        const cx = r() * 256;
        const cy = r() * 256;
        const n = 6 + r() * 14;
        for (let i = 0; i < n; i++) {
          const x = Math.floor((cx + (r() - 0.5) * 48) / cell) * cell;
          const y = Math.floor((cy + (r() - 0.5) * 30) / cell) * cell;
          g.fillStyle = col;
          for (const [ox, oy] of [[0, 0], [256, 0], [0, 256], [-256, 0], [0, -256]]) g.fillRect(x + ox, y + oy, cell * (1 + Math.floor(r() * 2)), cell);
        }
      }
    }
  } else {
    for (const col of s.spots) {
      g.fillStyle = col;
      for (let k = 0; k < (s.spots.length > 2 ? 9 : 12); k++) {
        const cx = r() * 256;
        const cy = r() * 256;
        const pts = [];
        const n = 9;
        const rad = 18 + r() * 26;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const rr = rad * (0.55 + r() * 0.8);
          pts.push([Math.cos(a) * rr * 1.6, Math.sin(a) * rr * 0.8]);
        }
        for (const [ox, oy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
          g.beginPath();
          pts.forEach(([x, y], i) => {
            const nx = (pts[(i + 1) % n][0] + x) / 2;
            const ny = (pts[(i + 1) % n][1] + y) / 2;
            if (!i) g.moveTo(cx + ox + nx, cy + oy + ny);
            else g.quadraticCurveTo(cx + ox + x, cy + oy + y, cx + ox + nx, cy + oy + ny);
          });
          g.closePath();
          g.fill();
        }
      }
    }
  }
  // grime
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
    g.fillRect(r() * 256, r() * 256, 2 + r() * 5, 2 + r() * 5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.35, 0.35);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(name, t);
  return t;
}

/** Matte military paint, camouflaged when a texture is available. */
export function camoPaint(name, { color, roughness = 0.72 } = {}) {
  const s = CAMO[name] ?? CAMO.standard;
  const map = color ? null : camoTexture(name);
  return new THREE.MeshStandardMaterial({ name: `camo_${name}`, color: map ? '#ffffff' : M.toColor(color ?? s.base), map, roughness, metalness: 0.18 });
}

/** Vehicle material set (heavy-kit mats + camo paint, canvas, etc.). */
export function militaryMats(camo = 'standard', o = {}) {
  const s = CAMO[camo] ?? CAMO.standard;
  const mats = heavyMats({}, { color: s.base, accent: '#2a2b26', rim: s.base });
  mats.paint = camoPaint(camo, { color: o.color });
  mats.plain = new THREE.MeshStandardMaterial({ name: 'paint_plain', color: M.toColor(o.color ?? s.base).multiplyScalar(0.92), roughness: 0.75, metalness: 0.15 });
  mats.rimPaint = mats.plain;
  mats.accent = new THREE.MeshStandardMaterial({ name: 'paint_dark', color: M.toColor(s.base).multiplyScalar(0.55), roughness: 0.8, metalness: 0.15 });
  mats.canvas = M.fabric(s.canvas);
  mats.canvasDark = M.fabric(M.toColor(s.canvas).multiplyScalar(0.7));
  mats.webbing = M.matte(s.tone === 'tan' ? '#8a7656' : s.tone === 'white' ? '#c9cccc' : '#3c4129', 0.9);
  mats.iron = M.metal('#3a3936', 0.7);
  mats.track = new THREE.MeshStandardMaterial({ name: 'track', color: '#47443f', roughness: 0.75, metalness: 0.75 });
  mats.wheelRubber = M.rubber();
  mats.armourGlass = new THREE.MeshPhysicalMaterial({ name: 'armour_glass', color: '#24302e', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.78, clearcoat: 1 });
  mats.foliage = M.foliage('#3d5a26');
  mats.foliage2 = M.foliage('#566b2c');
  mats.snow = M.matte('#f6f8fa', 0.6);
  mats.unBlue = M.matte('#4a90d6', 0.6);
  mats.red = M.matte('#c21d24', 0.6);
  mats.whitePaint = M.matte('#f2f2ee', 0.6);
  mats.wood = M.wood('#8a6a44');
  mats.jerry = new THREE.MeshStandardMaterial({ name: 'jerry', color: s.tone === 'tan' ? '#a89064' : '#4a5130', roughness: 0.6, metalness: 0.3 });
  return mats;
}

/* ------------------------------------------------------------------ */
/* Metals / organics for arms & armour                                  */
/* ------------------------------------------------------------------ */

export function armsMats(finish = 'plain') {
  const steel = {
    plain: M.metal('#c9ccd0', 0.22),
    ornate: M.metal('#d8dbe0', 0.12),
    'battle-worn': M.metal('#9c9fa3', 0.45),
    ceremonial: M.metal('#e2e4e8', 0.08),
    rusted: new THREE.MeshStandardMaterial({ name: 'rust', color: '#5a3420', roughness: 0.92, metalness: 0.35 }),
    bronze: M.metal('#b0793a', 0.32),
    blackened: M.metal('#2c2d30', 0.4),
  };
  return {
    steel: steel[finish] ?? steel.plain,
    edge: finish === 'rusted' ? new THREE.MeshStandardMaterial({ name: 'rust_edge', color: '#6e4528', roughness: 0.85, metalness: 0.45 }) : M.metal('#e9ebee', 0.1),
    dark: M.metal('#3a3b3e', 0.4),
    gold: M.metal('#d4a640', 0.2),
    brass: M.metal('#b8913f', 0.3),
    bronze: M.metal('#a8743a', 0.33),
    silver: M.metal('#dcdfe2', 0.15),
    iron: M.metal('#4a4845', 0.55),
    rust: new THREE.MeshStandardMaterial({ name: 'rust', color: '#57331f', roughness: 0.95, metalness: 0.3 }),
    leather: new THREE.MeshStandardMaterial({ name: 'leather', color: '#5a3820', roughness: 0.75 }),
    leatherDark: new THREE.MeshStandardMaterial({ name: 'leather_dark', color: '#2e1d12', roughness: 0.7 }),
    leatherRed: new THREE.MeshStandardMaterial({ name: 'leather_red', color: '#6a1a18', roughness: 0.65 }),
    cord: M.fabric('#2a2622'),
    silk: M.fabric('#8a1c22'),
    silkBlue: M.fabric('#1f2f5a'),
    wood: woodGrain('#7a5232'),
    woodDark: woodGrain('#3e2616'),
    woodLight: woodGrain('#b48a58'),
    ash: woodGrain('#c7a676'),
    lacquer: new THREE.MeshPhysicalMaterial({ name: 'lacquer', color: '#1a1414', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
    lacquerRed: new THREE.MeshPhysicalMaterial({ name: 'lacquer_red', color: '#7a1612', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
    ray: M.matte('#e8e2d2', 0.7),
    gem: new THREE.MeshPhysicalMaterial({ name: 'gem', color: '#b0101c', roughness: 0.05, metalness: 0, clearcoat: 1, transmission: 0.2 }),
    gemBlue: new THREE.MeshPhysicalMaterial({ name: 'gem_blue', color: '#1438b0', roughness: 0.05, clearcoat: 1 }),
    gemGreen: new THREE.MeshPhysicalMaterial({ name: 'gem_green', color: '#127a3a', roughness: 0.05, clearcoat: 1 }),
    paintRed: M.matte('#9c1c1a', 0.7),
    paintBlue: M.matte('#1e3d78', 0.7),
    paintYellow: M.matte('#c8a028', 0.7),
    paintWhite: M.matte('#e8e4d8', 0.7),
    paintBlack: M.matte('#1b1a18', 0.7),
    paintGreen: M.matte('#2c5a2e', 0.7),
    straw: M.matte('#c9a85a', 0.95),
    burlap: M.fabric('#9a8058'),
    feather: M.matte('#efe9dc', 0.9),
    featherDark: M.matte('#3a302a', 0.9),
    stand: woodGrain('#4a2f1c'),
    felt: M.fabric('#5a1418'),
  };
}

const grainCache = new Map();
/** Wood with a procedural grain texture (canvas, browser only). */
export function woodGrain(color) {
  let map = null;
  if (typeof document !== 'undefined') {
    map = grainCache.get(color);
    if (!map) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = color;
      g.fillRect(0, 0, 64, 256);
      const r = rng(color);
      for (let i = 0; i < 40; i++) {
        const x = r() * 64;
        g.strokeStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,240,220'},${0.05 + r() * 0.1})`;
        g.lineWidth = 0.5 + r() * 2;
        g.beginPath();
        g.moveTo(x, 0);
        for (let y = 0; y <= 256; y += 16) g.lineTo(x + Math.sin(y * 0.03 + i) * 2.5, y);
        g.stroke();
      }
      map = new THREE.CanvasTexture(c);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(2, 1);
      map.colorSpace = THREE.SRGBColorSpace;
      grainCache.set(color, map);
    }
  }
  return new THREE.MeshPhysicalMaterial({ name: 'wood_grain', color: map ? '#ffffff' : M.toColor(color), map, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 });
}

/** Canvas-texture label material (stencilled text), plain colour in Node. */
export function stencil(text, { bg = '#4a5130', fg = '#e8e4d0', w = 256, h = 96, font = 'bold 54px monospace' } = {}) {
  if (typeof document === 'undefined') return M.matte(bg, 0.7);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ name: 'stencil', map: t, roughness: 0.7 });
}

/** Screen material for radios / radar consoles. */
export function screenMat(kind = 'radar') {
  if (typeof document === 'undefined') return M.emissive('#1a6a3a', 0.4);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#04140a';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#3cff7a';
  g.lineWidth = 1.5;
  if (kind === 'radar') {
    for (const r of [20, 40, 60]) { g.beginPath(); g.arc(64, 64, r, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(64, 64); g.lineTo(110, 30); g.stroke();
    g.fillStyle = '#9cffb8';
    for (const [x, y] of [[80, 40], [40, 90], [95, 75]]) g.fillRect(x, y, 4, 4);
  } else {
    g.font = 'bold 22px monospace';
    g.fillStyle = '#ffb030';
    g.fillText('CH 07', 10, 40);
    g.fillText('46.250', 10, 80);
    g.fillRect(10, 100, 70, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ name: 'screen', map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.25, roughness: 0.3 });
}

/** Seeded random from model name. */
export const seeded = (s) => rng(s);

/* ------------------------------------------------------------------ */
/* Military off-road wheel (tyre + rim surfaces overlap, hub = axle r)  */
/* ------------------------------------------------------------------ */

const wheelGeoCache = new Map();
function tyreGeometry(r, w) {
  const key = `${r}|${w}`;
  if (wheelGeoCache.has(key)) return wheelGeoCache.get(key);
  const rimR = r * 0.58;
  const parts = [];
  const lp = [[rimR * 0.97, -w * 0.45], [r * 0.8, -w * 0.5], [r * 0.93, -w * 0.47], [r * 0.97, -w * 0.38], [r * 0.97, w * 0.38], [r * 0.93, w * 0.47], [r * 0.8, w * 0.5], [rimR * 0.97, w * 0.45]];
  parts.push(new THREE.LatheGeometry(lp.map(([a, b]) => new THREE.Vector2(a, b)), 36).rotateX(Math.PI / 2));
  // chunky staggered tread blocks (embedded slightly into the carcass)
  const n = Math.round((Math.PI * 2 * r) / 0.11);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    for (const s of [-1, 1]) {
      const g = new THREE.BoxGeometry(0.07, r * 0.07, w * 0.36);
      g.translate(0, r * 0.97 + r * 0.015, s * w * 0.2 + (i % 2 ? 0.02 : -0.02) * s);
      g.rotateZ(a + (s > 0 ? 0 : Math.PI / n));
      parts.push(g.toNonIndexed());
    }
  }
  const merged = mergeAll(parts);
  const out = { tyre: merged, rimR };
  wheelGeoCache.set(key, out);
  return out;
}
function mergeAll(list) {
  const geos = list.map((g) => {
    let x = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
    return x;
  });
  let count = 0;
  for (const g of geos) count += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const size = name === 'uv' ? 2 : 3;
    const arr = new Float32Array(count * size);
    let o = 0;
    for (const g of geos) { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return out;
}

/** Wheel with axle along Z, outer face toward `side`. Returns { steer, spin }. hubR = axle radius to use. */
export function milWheel(name, { radius: r = 0.55, width: w = 0.38, side = 1, rimMat, hubMat, tyreMat } = {}) {
  const steer = new THREE.Group();
  steer.name = `${name}_steer`;
  const spin = new THREE.Group();
  spin.name = name;
  steer.add(spin);
  const { tyre, rimR } = tyreGeometry(r, w);
  const tm = new THREE.Mesh(tyre, tyreMat ?? new THREE.MeshStandardMaterial({ name: 'tyre', color: '#1a1a1a', roughness: 0.92 }));
  tm.name = `${name}_tyre`;
  spin.add(tm);
  const mg = new Merge();
  const s = side;
  // rim: barrel overlapping the bead + dished centre disc + bolt ring, hub through the full width
  mg.add(new THREE.CylinderGeometry(rimR, rimR, w * 0.92, 24, 1, true).rotateX(Math.PI / 2), rimMat);
  const disc = new THREE.LatheGeometry([[rimR, 0], [rimR * 0.85, -w * 0.06], [rimR * 0.45, -w * 0.18], [r * 0.12, -w * 0.18], [r * 0.12, -w * 0.12]].map(([a, b]) => new THREE.Vector2(a, b)), 24).rotateX(-Math.PI / 2);
  if (s < 0) disc.rotateY(Math.PI);
  mg.add(disc, rimMat, { at: [0, 0, s * w * 0.4] });
  mg.add(new THREE.TorusGeometry(rimR * 0.98, r * 0.03, 6, 30), rimMat, { at: [0, 0, s * w * 0.42] });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    mg.add(new THREE.CylinderGeometry(r * 0.025, r * 0.025, 0.06, 6).rotateX(Math.PI / 2), hubMat, { at: [Math.cos(a) * rimR * 0.62, Math.sin(a) * rimR * 0.62, s * (w * 0.4 - w * 0.12)] });
  }
  mg.add(new THREE.CylinderGeometry(r * 0.13, r * 0.13, w * 1.0, 16).rotateX(Math.PI / 2), hubMat);
  mg.add(new THREE.CylinderGeometry(r * 0.2, r * 0.2, w * 0.1, 16).rotateX(Math.PI / 2), hubMat, { at: [0, 0, s * w * 0.25] });
  mg.flush(spin, `${name}_rim`);
  return { steer, spin, hubR: r * 0.13 };
}

/**
 * Rest `obj` (a direct child group of `root`) on the ground with no stand: tilts it about
 * `axis` until its lowest points on either side of its extent along `split` touch equally,
 * then drops it so its lowest point is at y = 0.
 */
export function restOnGround(root, obj, { axis = 'z', split = 'x', range = 0.5 } = {}) {
  const pts = [];
  const v = new THREE.Vector3();
  const sample = () => {
    pts.length = 0;
    root.updateMatrixWorld(true);
    obj.traverse((m) => {
      if (!m.isMesh) return;
      const p = m.geometry.attributes.position;
      const step = Math.max(1, Math.floor(p.count / 300));
      for (let i = 0; i < p.count; i += step) pts.push(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).clone());
    });
  };
  const base = obj.rotation[axis];
  if (range > 0) {
    sample();
    const s = pts.map((q) => q[split]);
    const mid = (Math.min(...s) + Math.max(...s)) / 2;
    let best = base, bestErr = Infinity;
    for (let a = -range; a <= range + 1e-6; a += 0.005) {
      obj.rotation[axis] = base + a;
      sample();
      let lo = Infinity, hi = Infinity;
      for (const q of pts) { if (q[split] > mid) hi = Math.min(hi, q.y); else lo = Math.min(lo, q.y); }
      const err = Math.abs(hi - lo) + Math.abs(a) * 1e-4;
      if (err < bestErr) { bestErr = err; best = base + a; }
    }
    obj.rotation[axis] = best;
  }
  sample();
  let minY = Infinity;
  for (const q of pts) minY = Math.min(minY, q.y);
  obj.position.y -= minY;
  root.updateMatrixWorld(true);
}
