import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, lathe, extrudeOutline, cushion, finalize, normalizeOptions, pickVariant, rng, jitter } from '../../core/utils.js';
import { clip, rotateTrack, pingPong, wave } from '../../core/animation.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { Merge, CAMO, camoPaint, screenMat, woodGrain, stencil } from './kit.js';
import { keys } from '../vehicles/heavy-kit.js';
import { tent, tentMats } from './tents.js';

/*
 * Field gear: tents, camouflage netting, sandbags, hesco barriers, crates, jerry cans, drums,
 * radios, generators, watch towers, barriers, barbed wire and first-aid stations.
 * No ammunition markings and no weapons.
 */

const PI = Math.PI;

function fieldMats(trim) {
  const tone = trim === 'desert' ? 'desert' : trim === 'arctic' || trim === 'snowy' ? 'arctic' : trim === 'urban' ? 'urban' : trim === 'woodland' || trim === 'woodland-net' ? 'woodland' : 'olive';
  const s = CAMO[tone];
  return {
    tone,
    canvas: M.fabric(s.canvas),
    canvasDark: M.fabric(M.toColor(s.canvas).multiplyScalar(0.72)),
    paint: camoPaint(tone === 'olive' ? 'standard' : tone),
    plain: new THREE.MeshStandardMaterial({ name: 'paint_plain', color: s.base, roughness: 0.7, metalness: 0.25 }),
    olive: new THREE.MeshStandardMaterial({ name: 'olive', color: tone === 'desert' ? '#a89064' : tone === 'arctic' ? '#d9dcdc' : '#4a5130', roughness: 0.6, metalness: 0.35 }),
    steel: M.metal('#8a8d90', 0.45),
    galv: M.metal('#b4b8bb', 0.35),
    iron: M.metal('#3e3c39', 0.6),
    rust: new THREE.MeshStandardMaterial({ name: 'rust', color: '#6a3b1f', roughness: 0.9, metalness: 0.3 }),
    rubber: M.rubber(),
    black: M.matte('#151515', 0.6),
    wood: woodGrain('#9a7a4e'),
    woodDark: woodGrain('#5a4028'),
    pallet: woodGrain('#b89a68'),
    bag: M.fabric(tone === 'desert' ? '#c6ad80' : tone === 'arctic' ? '#e6e6e0' : tone === 'woodland' ? '#5c6438' : '#8f8158'),
    bagDark: M.fabric(tone === 'desert' ? '#a88f62' : tone === 'arctic' ? '#cfd0cc' : tone === 'woodland' ? '#4a5230' : '#77693f'),
    hescoFill: M.matte(trim === 'gravel' ? '#8c8a84' : '#b49a6c', 0.95),
    geo: M.fabric(trim === 'weathered' ? '#9a8a6a' : '#c2ad80'),
    concrete: M.matte(trim === 'weathered' ? '#8a8780' : '#b8b4aa', 0.9),
    snow: M.matte('#f6f8fa', 0.6),
    red: M.matte('#c21d24', 0.6),
    white: M.matte('#f0efe8', 0.6),
    yellow: M.matte('#e2b51c', 0.6),
    green: new THREE.MeshStandardMaterial({ name: 'drum_green', color: '#3f5a34', roughness: 0.5, metalness: 0.4 }),
    blue: new THREE.MeshStandardMaterial({ name: 'drum_blue', color: '#2a4f8c', roughness: 0.45, metalness: 0.4 }),
    drumRed: new THREE.MeshStandardMaterial({ name: 'drum_red', color: '#a8221e', roughness: 0.45, metalness: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#1a242a', roughness: 0.05, transparent: true, opacity: 0.6, clearcoat: 1 }),
    foliage: M.foliage('#3d5a26'),
    foliage2: M.foliage('#5a6b2c'),
    cot: M.fabric('#4f5532'),
    mattress: M.fabric('#6a7050'),
    medical: M.fabric('#e8e6e0'),
  };
}

/** Thin hollow shell: outline (x,y) extruded along Z with an inner hole (offset by scaling). */
function hollowProfile(outline, t, depth, bevel = 0.01) {
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
  const ys = outline.map((p) => p[1]);
  const y0 = Math.min(...ys);
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const W = Math.max(...outline.map((p) => Math.abs(p[0] - cx)));
  const H = Math.max(...ys) - y0;
  const inner = outline.map(([x, y]) => new THREE.Vector2(cx + (x - cx) * (1 - t / W), y0 + (y - y0) * (1 - t / H) + (y <= y0 + 1e-6 ? -0.001 : 0)));
  // the bottom edge stays open: hole touches the base so the shell is a canopy
  shape.holes.push(new THREE.Path(inner.reverse()));
  return extrudeOutline(shape, depth, { bevel, segments: 1 });
}

/* ------------------------------------------------------------------ */
/* Tents                                                                */
/* ------------------------------------------------------------------ */

export function cot(mg, f, at) {
  const [x, y, z] = at;
  mg.add(cushion(1.9, 0.06, 0.62, { bulge: 0.15 }), f.cot, { at: [x, y + 0.42, z] });
  for (const s of [1, -1]) mg.tube([x - 0.95, y + 0.42, z + s * 0.31], [x + 0.95, y + 0.42, z + s * 0.31], 0.015, f.iron, 6);
  for (const dx of [-0.85, 0.85]) {
    mg.tube([dx + x, y, z - 0.3], [dx + x, y + 0.42, z + 0.3], 0.012, f.iron, 6);
    mg.tube([dx + x, y, z + 0.3], [dx + x, y + 0.42, z - 0.3], 0.012, f.iron, 6);
  }
}

/** Camouflage net surface draped over a dome of height h. */
export function netOver(mg, f, r, h, span = 3.2, drop = h) {
  const g = new THREE.PlaneGeometry(span * 2, span * 2, 24, 24).rotateX(-PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const d = Math.hypot(x / span, z / span);
    p.setY(i, Math.max(0.02, h + 0.06 - d * d * drop * 1.05) + (r() - 0.5) * 0.06);
  }
  g.computeVertexNormals();
  mg.add(g, netMat(f.tone));
}

const netCache = new Map();
function netMat(tone) {
  if (netCache.has(tone)) return netCache.get(tone);
  const s = CAMO[tone] ?? CAMO.woodland;
  let map = null;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = rng(`net${tone}`);
    const cols = [s.base, ...s.spots];
    for (let i = 0; i < 260; i++) {
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.beginPath();
      g.ellipse(r() * 128, r() * 128, 4 + r() * 6, 2 + r() * 3, r() * PI, 0, PI * 2);
      g.fill();
    }
    map = new THREE.CanvasTexture(c);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(3, 3);
    map.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.MeshStandardMaterial({ name: 'camo_net', color: map ? '#ffffff' : s.base, map, alphaMap: null, transparent: !!map, alphaTest: map ? 0.3 : 0, side: THREE.DoubleSide, roughness: 0.95 });
  netCache.set(tone, m);
  return m;
}

function camoNet(ctx, v) {
  const { f, root } = ctx;
  const mg = new Merge();
  const r = rng(v);
  const P = { 'vehicle-hide': { L: 10, W: 7, H: 3.2, poles: 6 }, shelter: { L: 5, W: 4, H: 2.4, poles: 4 }, 'small-hide': { L: 3, W: 3, H: 1.4, poles: 1 }, 'wall-screen': { L: 6, W: 0.3, H: 2.2, poles: 4 } }[v];
  const pts = [];
  if (v === 'wall-screen') {
    for (let i = 0; i < P.poles; i++) pts.push([-P.L / 2 + (i * P.L) / (P.poles - 1), 0]);
    for (const [x] of pts) {
      mg.tube([x, 0, 0], [x, P.H, 0], 0.025, f.iron, 8);
      mg.tube([x, P.H * 0.8, 0], [x, 0, -1.0], 0.006, f.black, 4);
    }
    const g = new THREE.PlaneGeometry(P.L, P.H, 30, 10);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.03 + Math.sin(p.getX(i) * 3) * 0.04 + (r() - 0.5) * 0.04);
    g.computeVertexNormals();
    mg.add(g, netMat(f.tone), { at: [0, P.H / 2, 0] });
  } else {
    // poles with spreader discs, net draped between them, pegged out at the edges
    const grid = v === 'vehicle-hide' ? [[-3, -1.5], [0, -1.5], [3, -1.5], [-3, 1.5], [0, 1.5], [3, 1.5]] : v === 'shelter' ? [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]] : [[0, 0]];
    for (const [x, z] of grid) {
      mg.tube([x, 0, z], [x, P.H, z], 0.02, f.iron, 8);
      mg.add(lathe([[0.001, 0], [0.18, 0.04], [0.2, 0.06], [0.001, 0.08]], 12), f.iron, { at: [x, P.H - 0.04, z] });
    }
    const g = new THREE.PlaneGeometry(P.L, P.W, 40, 30).rotateX(-PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      let y = 0;
      for (const [px, pz] of grid) {
        const d = Math.hypot(x - px, z - pz);
        y = Math.max(y, P.H + 0.04 - d * (P.H / 2.2) * (v === 'small-hide' ? 0.6 : 1) - d * d * 0.05);
      }
      const edge = Math.max(Math.abs(x) / (P.L / 2), Math.abs(z) / (P.W / 2));
      if (edge > 0.97) y = 0.02;
      p.setY(i, Math.max(0.02, y + (r() - 0.5) * 0.05));
    }
    g.computeVertexNormals();
    mg.add(g, netMat(f.tone));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2;
      mg.add(new THREE.CylinderGeometry(0.01, 0.006, 0.25, 5), f.galv, { at: [Math.cos(a) * P.L * 0.5, 0.08, Math.sin(a) * P.W * 0.5] });
    }
    // garnish: leafy strips tied on
    for (let i = 0; i < (v === 'vehicle-hide' ? 22 : 10); i++) {
      const [gx, gz] = grid[i % grid.length];
      const x = gx + (r() - 0.5) * 1.6;
      const z = gz + (r() - 0.5) * 1.6;
      const d = Math.min(...grid.map(([px, pz]) => Math.hypot(x - px, z - pz)));
      const y = Math.max(0.05, P.H + 0.04 - d * (P.H / 2.2) * (v === 'small-hide' ? 0.6 : 1) - d * d * 0.05);
      const leaf = jitter(new THREE.IcosahedronGeometry(0.2, 0), r, 0.3).scale(1.6, 0.35, 1);
      mg.add(leaf, f.tone === 'arctic' ? f.snow : f.tone === 'desert' ? f.bagDark : i % 2 ? f.foliage : f.foliage2, { at: [x, y + 0.02, z] });
    }
  }
  if (v === 'vehicle-hide') {
    // a parked crate stack under the net
    for (let i = 0; i < 3; i++) mg.add(roundedBox(1.0, 0.5, 0.6, 0.02, 2), f.olive, { at: [1.5, 0.25 + i * 0.5, 0], rot: [0, i * 0.1, 0] });
  }
  mg.flush(root, 'net');
}

/* ------------------------------------------------------------------ */
/* Sandbags / hesco                                                     */
/* ------------------------------------------------------------------ */

const bagCache = new Map();
/** Low-poly cushion (sandbags are used by the hundred). */
function lightCushion(w, h, d, bulge) {
  const geo = roundedBox(w, h, d, Math.min(w, h, d) * 0.35, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = Math.max(0, (1 - (x / (w / 2)) ** 2) * (1 - (z / (d / 2)) ** 2));
    pos.setY(i, y + Math.sign(y) * k * h * bulge * 0.5);
  }
  geo.computeVertexNormals();
  return geo;
}
function sandbag(mg, mat, at, rotY = 0, size = [0.62, 0.14, 0.32]) {
  const key = size.join();
  if (!bagCache.has(key)) {
    const c = lightCushion(...size, 0.45);
    bagCache.set(key, c);
  }
  const g = bagCache.get(key).clone();
  g.rotateY(rotY);
  mg.add(g, mat, { at: [at[0], at[1] + size[1] / 2, at[2]] });
}

/** Lay courses of sandbags along a path (list of points on the ground, y=0). Header/stretcher bond. */
function bagWall(mg, f, path, courses, r, { closed = false, mats } = {}) {
  const lens = [];
  let total = 0;
  const segs = closed ? path.length : path.length - 1;
  for (let i = 0; i < segs; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lens.push(l);
    total += l;
  }
  const at = (u) => {
    let w = u;
    for (let i = 0; i < segs; i++) {
      if (w <= lens[i] || i === segs - 1) {
        const a = path[i];
        const b = path[(i + 1) % path.length];
        const t = Math.min(1, w / lens[i]);
        return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
      }
      w -= lens[i];
    }
    return { x: 0, z: 0, ang: 0 };
  };
  const step = 0.6;
  const H = 0.13;
  for (let c = 0; c < courses; c++) {
    const n = Math.max(1, Math.round(total / step));
    for (let i = 0; i < n; i++) {
      const u = ((i + (c % 2 ? 0.5 : 0.0) + 0.5) / n) * total;
      if (!closed && (u > total)) continue;
      const p = at(Math.min(u, total - 0.01));
      const k = Math.min(c, courses - 1);
      sandbag(mg, (mats ?? [f.bag, f.bagDark])[Math.floor(r() * 2)], [p.x, k * H, p.z], -p.ang + (r() - 0.5) * 0.08);
      if (courses > 4 && c < courses - 2) sandbag(mg, f.bagDark, [p.x - Math.sin(p.ang) * 0.3, k * H, p.z + Math.cos(p.ang) * 0.3], -p.ang + (r() - 0.5) * 0.08);
    }
  }
  return courses * H;
}

function sandbagWall(ctx, v) {
  const { f, trim, root } = ctx;
  const mg = new Merge();
  const r = rng(v + trim);
  let top = 0;
  let path;
  if (v === 'straight') top = bagWall(mg, f, (path = [[-1.8, 0], [1.8, 0]]), 7, r);
  else if (v === 'curved') {
    path = Array.from({ length: 9 }, (_, i) => { const a = -0.9 + (i / 8) * 1.8; return [Math.sin(a) * 2.4, -Math.cos(a) * 2.4 + 2.4]; });
    top = bagWall(mg, f, path, 7, r);
  } else if (v === 'corner') top = bagWall(mg, f, (path = [[-2, 0], [0, 0], [0, 2]]), 7, r);
  else if (v === 'ring') {
    path = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * PI * 2; return [Math.cos(a) * 1.3, Math.sin(a) * 1.3]; });
    top = bagWall(mg, f, path, 6, r, { closed: true });
  } else if (v === 'bunker') {
    // U-shaped walls + timber/corrugated roof covered by bags + firing slit
    path = [[-1.5, -1.2], [-1.5, 1.2], [1.5, 1.2], [1.5, -1.2]];
    top = bagWall(mg, f, path, 10, r);
    mg.add(roundedBox(3.6, 0.08, 3.0, 0.02, 2), f.woodDark, { at: [0, top + 0.04, 0] });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) sandbag(mg, j % 2 ? f.bag : f.bagDark, [-1.5 + i * 0.6, top + 0.08, -1.2 + j * 0.6], (i + j) % 2 ? 0 : PI / 2);
    for (const x of [-1.45, 1.45]) for (const z of [-1.15, 1.15]) mg.add(roundedBox(0.14, top, 0.14, 0.02, 2), f.woodDark, { at: [x, top / 2, z] });
    top += 0.22;
  } else {
    // pillbox: tall double-thickness wall with a slit opening
    path = [[-1.6, 0], [1.6, 0]];
    top = bagWall(mg, f, path, 12, r);
  }
  if (trim === 'wired') {
    // concertina coil along the top
    const p0 = path[0];
    const p1 = path[path.length - 1];
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    coil(mg, f, [(p0[0] + p1[0]) / 2, top, (p0[1] + p1[1]) / 2], Math.min(len, 3.6), 0.3, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), r);
  }
  if (trim === 'snowy') {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      mg.add(cushion(l, 0.08, 0.36, { bulge: 0.6 }).rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])), f.snow, { at: [(a[0] + b[0]) / 2, top + 0.02, (a[1] + b[1]) / 2] });
    }
  }
  mg.flush(root, 'sandbags');
}

function coil(mg, f, at, len, R, rotY, r) {
  const turns = Math.round(len / 0.18);
  const pts = [];
  const N = turns * 10;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * PI * 2;
    pts.push(new THREE.Vector3(-len / 2 + t * len + Math.sin(a * 0.5) * 0.02, R + Math.sin(a) * R, Math.cos(a) * R));
  }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, 0.004, 4);
  g.rotateY(rotY);
  mg.add(g, f.galv, { at });
  for (let i = 0; i < N; i += 3) {
    const p = pts[i];
    const b = new THREE.BoxGeometry(0.03, 0.004, 0.004).rotateZ(r() * PI).rotateY(r() * PI);
    b.translate(p.x, p.y, p.z);
    b.rotateY(rotY);
    mg.add(b, f.galv, { at });
  }
}

function hesco(ctx, v) {
  const { f, trim, root } = ctx;
  const mg = new Merge();
  const S = 1.0;
  const H = 1.37;
  const cells = { single: [[0, 0, 0]], row: [[-1.5, 0, 0], [-0.5, 0, 0], [0.5, 0, 0], [1.5, 0, 0]], 'double-stack': [[-1, 0, 0], [0, 0, 0], [1, 0, 0], [-0.5, 1, 0], [0.5, 1, 0]], corner: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [0, 0, 2]], 'gate-flank': [[-2.5, 0, 0], [-1.5, 0, 0], [1.5, 0, 0], [2.5, 0, 0], [-2.5, 1, 0], [2.5, 1, 0]] }[v];
  for (const [cx, layer, cz] of cells) {
    const y0 = layer * H;
    const x = cx * S;
    const z = cz * S;
    // geotextile liner box filled with earth, steel weld-mesh outside
    mg.add(roundedBox(S - 0.04, H - 0.06, S - 0.04, 0.04, 2), f.geo, { at: [x, y0 + H / 2 - 0.02, z] });
    mg.add(cushion(S - 0.1, 0.1, S - 0.1, { bulge: 0.5 }), f.hescoFill, { at: [x, y0 + H - 0.06, z] });
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const o = -S / 2 + (i * S) / n;
      for (const s of [1, -1]) {
        mg.add(new THREE.BoxGeometry(0.006, H, 0.006), f.galv, { at: [x + o, y0 + H / 2, z + s * S / 2] });
        mg.add(new THREE.BoxGeometry(0.006, H, 0.006), f.galv, { at: [x + s * S / 2, y0 + H / 2, z + o] });
      }
    }
    for (let j = 0; j <= 9; j++) {
      const y = y0 + (j * H) / 9;
      for (const s of [1, -1]) {
        mg.add(new THREE.BoxGeometry(S, 0.006, 0.006), f.galv, { at: [x, y, z + s * S / 2] });
        mg.add(new THREE.BoxGeometry(0.006, 0.006, S), f.galv, { at: [x + s * S / 2, y, z] });
      }
    }
  }
  if (trim === 'weathered') {
    const r = rng('hw');
    for (let i = 0; i < 12; i++) mg.add(new THREE.SphereGeometry(0.15, 8, 6).scale(1, 0.4, 1), f.hescoFill, { at: [(r() - 0.5) * 4, 0.02, 0.6 + r() * 0.3] });
  }
  if (trim === 'with-wire') {
    const xs = cells.filter((c) => c[1] === 0).map((c) => c[0]);
    const x0 = Math.min(...xs) - 0.5;
    const x1 = Math.max(...xs) + 0.5;
    const topY = Math.max(...cells.map((c) => (c[1] + 1) * H));
    coil(mg, f, [(x0 + x1) / 2, topY, 0], x1 - x0, 0.3, 0, rng('hwire'));
  }
  mg.flush(root, 'hesco');
}

/* ------------------------------------------------------------------ */
/* Crates, cans, drums                                                  */
/* ------------------------------------------------------------------ */

/** Hollow box with an animated hinged lid. Returns { lid } (lid group named name). */
function hollowCrate(parent, mg, mat, at, [w, h, d], { t = 0.012, lidMat, name, open = false, wood = false, f, anims, contents } = {}) {
  const [x, y, z] = at;
  mg.add(roundedBox(w, t, d, t * 0.4, 1), mat, { at: [x, y + t / 2, z] });
  for (const s of [1, -1]) {
    mg.add(roundedBox(w, h - t, t, t * 0.4, 1), mat, { at: [x, y + h / 2, z + s * (d / 2 - t / 2)] });
    mg.add(roundedBox(t, h - t, d - 2 * t, t * 0.4, 1), mat, { at: [x + s * (w / 2 - t / 2), y + h / 2, z] });
  }
  if (wood) {
    for (const s of [1, -1]) for (const yy of [0.15, 0.85]) mg.add(roundedBox(w + 0.01, 0.06, 0.02, 0.006, 1), f.woodDark, { at: [x, y + h * yy, z + s * (d / 2 + 0.008)] });
  }
  if (contents) contents(mg, [x, y + t, z]);
  const lid = group(name, { parent, at: [x, y + h, z - d / 2] });
  const lm = new Merge();
  lm.add(roundedBox(w + 0.01, t * 1.6, d + 0.01, t * 0.5, 1), lidMat ?? mat, { at: [0, t * 0.8, d / 2] });
  lm.add(roundedBox(w * 0.3, t, 0.03, t * 0.4, 1), f.black, { at: [0, t * 1.8, d / 2] });
  lm.flush(lid, `${name}_body`);
  if (open) lid.rotation.x = -1.9;
  else anims.push(clip(`${name}Open`, 3, [rotateTrack(lid, 'x', 3, (tt) => -keys([[0, 0], [0.3, 1], [0.7, 1], [1, 0]])(tt) * 1.9)]));
  return lid;
}

function crate(ctx, v) {
  const { f, trim, root, anims } = ctx;
  const mg = new Merge();
  const open = trim === 'open';
  const stacked = trim === 'stacked';
  const boxMat = trim === 'desert' ? M.matte('#b89a68', 0.7) : f.olive;
  const kinds = {
    'ammo-box': { s: [0.3, 0.19, 0.15], mat: new THREE.MeshStandardMaterial({ name: 'can', color: trim === 'desert' ? '#a89064' : '#4a5130', roughness: 0.55, metalness: 0.5 }), handle: true },
    'supply-crate': { s: [1.0, 0.55, 0.6], mat: f.wood, wood: true },
    'long-crate': { s: [1.6, 0.35, 0.45], mat: f.wood, wood: true },
    'medical-crate': { s: [0.8, 0.45, 0.5], mat: f.white, cross: true },
    'ration-stack': { s: [0.42, 0.28, 0.32], mat: M.matte(trim === 'desert' ? '#c8b088' : '#8a7a52', 0.85), card: true },
    'hard-case': { s: [0.7, 0.3, 0.5], mat: new THREE.MeshPhysicalMaterial({ name: 'case', color: trim === 'desert' ? '#a89064' : '#2e3328', roughness: 0.45, clearcoat: 0.3 }) },
  };
  const K = kinds[v];
  const mat = K.wood ? (trim === 'desert' ? woodGrain('#c8a878') : trim === 'olive' ? f.olive : K.mat) : K.mat ?? boxMat;
  const [w, h, d] = K.s;
  const positions = stacked ? (v === 'ammo-box' ? [[0, 0, 0], [0, 0, 0.17], [0, h, 0.08], [0.33, 0, 0.08]] : [[0, 0, 0], [w + 0.03, 0, 0], [w / 2 + 0.015, h + 0.005, 0]]) : v === 'ration-stack' ? [[0, 0, 0], [0, h, 0], [0, 2 * h, 0], [w + 0.01, 0, 0], [w + 0.01, h, 0]] : [[0, 0, 0]];
  positions.forEach(([x, y, z], i) => {
    const last = i === positions.length - 1 && (stacked || v === 'ration-stack') ? true : i === 0;
    const isOpen = open && i === positions.length - 1;
    const name = i === 0 ? 'lid' : `lid${i}`;
    hollowCrate(root, mg, mat, [x, y, z], [w, h, d], {
      t: K.wood ? 0.02 : v === 'ammo-box' ? 0.004 : 0.012, name, open: isOpen, wood: K.wood, f, anims: i === 0 || isOpen ? anims : [],
      contents: isOpen ? (m2, [cx, cy, cz]) => {
        if (v === 'supply-crate' || v === 'long-crate') {
          // straw packing + ration boxes / tools
          m2.add(cushion(w - 0.06, 0.06, d - 0.06, { bulge: 0.4 }), M.matte('#c9a85a', 0.95), { at: [cx, cy + 0.03, cz] });
          for (let k = 0; k < 3; k++) m2.add(roundedBox(0.25, 0.18, 0.2, 0.01, 1), M.matte('#8a7a52', 0.85), { at: [cx - w / 3 + k * (w / 3), cy + 0.06 + 0.09, cz] });
        } else if (v === 'medical-crate') {
          for (let k = 0; k < 4; k++) m2.add(roundedBox(0.15, 0.1, 0.12, 0.02, 2), f.white, { at: [cx - 0.25 + k * 0.17, cy + 0.05, cz] });
          m2.add(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12).rotateZ(PI / 2), f.medical, { at: [cx, cy + 0.04, cz + 0.12] });
        } else if (v === 'hard-case') {
          m2.add(roundedBox(w - 0.03, 0.12, d - 0.03, 0.02, 2), M.matte('#222', 0.95), { at: [cx, cy + 0.06, cz] });
          m2.add(roundedBox(0.3, 0.06, 0.2, 0.02, 2), f.olive, { at: [cx, cy + 0.12 + 0.02, cz] });
        } else {
          for (let k = 0; k < 3; k++) m2.add(roundedBox(w * 0.25, h * 0.7, d * 0.7, 0.01, 1), M.matte('#6a6a5a', 0.8), { at: [cx - w * 0.3 + k * w * 0.3, cy + h * 0.35, cz] });
        }
      } : null,
    });
    if (K.handle) for (const s of [1, -1]) mg.add(new THREE.TorusGeometry(0.03, 0.005, 6, 12, PI), f.iron, { at: [x + s * (w / 2 + 0.005), y + h * 0.6, z], rot: [0, PI / 2, 0] });
    if (K.cross) for (const s of [1, -1]) {
      mg.add(new THREE.BoxGeometry(0.25, 0.07, 0.004), f.red, { at: [x, y + h * 0.5, z + s * (d / 2 + 0.002)] });
      mg.add(new THREE.BoxGeometry(0.07, 0.25, 0.004), f.red, { at: [x, y + h * 0.5, z + s * (d / 2 + 0.002)] });
    }
    if (v === 'hard-case') for (const s of [1, -1]) mg.add(roundedBox(0.06, 0.04, 0.02, 0.008, 1), f.black, { at: [x + s * 0.2, y + h - 0.02, z + d / 2 + 0.008] });
    if (v === 'supply-crate' || v === 'long-crate') mg.add(new THREE.PlaneGeometry(0.36, 0.12), stencil('SUPPLY', { bg: '#9a7a4e', fg: '#1c1a14' }), { at: [x, y + h * 0.5, z + d / 2 + 0.002] });
    void last;
  });
  if (stacked || v === 'ration-stack') {
    // pallet underneath
    pallet(mg, f, [positions.reduce((s, p) => s + p[0], 0) / positions.length, 0, positions.reduce((s, p) => s + p[2], 0) / positions.length], v === 'ammo-box' ? 0.8 : 1.2);
    root.children.forEach((c) => { if (c.name.startsWith('lid')) c.position.y += 0.133; });
    mg.parts.forEach((list) => list.forEach((g) => { if (!g.userData.pallet) g.translate(0, 0.133, 0); }));
  }
  mg.flush(root, 'crates');
}

function pallet(mg, f, at, size = 1.2) {
  const [x, , z] = at;
  const tag = (g) => { g.userData.pallet = true; return g; };
  const add = (geo, m, o) => {
    mg.add(geo, m, o);
    const list = mg.parts.get(m);
    list[list.length - 1].userData.pallet = true;
  };
  void tag;
  for (const s of [-1, 0, 1]) add(roundedBox(size, 0.1, 0.1, 0.01, 1), f.pallet, { at: [x, 0.05, z + s * size * 0.4] });
  for (let i = 0; i < 7; i++) add(roundedBox(0.1, 0.022, size, 0.005, 1), f.pallet, { at: [x - size / 2 + 0.05 + (i * (size - 0.1)) / 6, 0.111 + 0.011, z] });
}

function jerry(mg, mat, at, rotY = 0, f) {
  const [x, y, z] = at;
  const g = roundedBox(0.165, 0.47, 0.345, 0.02, 2);
  g.rotateY(rotY);
  mg.add(g, mat, { at: [x, y + 0.235, z] });
  // X-pressings on the sides
  for (const s of [1, -1]) for (const r of [0.6, -0.6]) {
    const p = new THREE.BoxGeometry(0.006, 0.42, 0.025).rotateX(r);
    p.translate(s * 0.084, 0, 0);
    p.rotateY(rotY);
    mg.add(p, mat, { at: [x, y + 0.22, z] });
  }
  for (let k = -1; k <= 1; k++) {
    const h = new THREE.CylinderGeometry(0.012, 0.012, 0.13, 8).rotateX(PI / 2);
    h.translate(0, 0, 0);
    h.rotateY(rotY);
    mg.add(h, mat, { at: [x + Math.sin(rotY) * k * 0.05 * 0, y + 0.5, z + Math.cos(rotY) * k * 0.0] });
  }
  const sp = new THREE.CylinderGeometry(0.025, 0.025, 0.05, 12).rotateZ(0.6);
  sp.translate(0.04, 0, 0);
  sp.rotateY(rotY + PI / 2);
  mg.add(sp, f.iron, { at: [x + Math.cos(rotY + PI / 2) * 0.0, y + 0.485, z] });
}

function jerryCans(ctx, v) {
  const { f, trim, root } = ctx;
  const mg = new Merge();
  const mat = new THREE.MeshStandardMaterial({ name: 'jerry', color: trim === 'desert' ? '#b09868' : trim === 'red' ? '#a8221e' : trim === 'blue' ? '#2a4f8c' : '#4a5130', roughness: 0.55, metalness: 0.4 });
  if (v === 'single') jerry(mg, mat, [0, 0, 0], 0, f);
  else if (v === 'pair') { jerry(mg, mat, [-0.09, 0, 0], 0, f); jerry(mg, mat, [0.09, 0, 0.03], 0.15, f); }
  else if (v === 'rack') {
    // welded rack holding four cans
    for (let i = 0; i < 4; i++) jerry(mg, mat, [-0.27 + i * 0.18, 0.04, 0], 0, f);
    mg.add(roundedBox(0.8, 0.04, 0.4, 0.008, 1), f.iron, { at: [0, 0.02, 0] });
    for (const s of [1, -1]) {
      mg.tube([-0.4, 0.04, s * 0.19], [-0.4, 0.4, s * 0.19], 0.012, f.iron, 6);
      mg.tube([0.4, 0.04, s * 0.19], [0.4, 0.4, s * 0.19], 0.012, f.iron, 6);
      mg.tube([-0.4, 0.4, s * 0.19], [0.4, 0.4, s * 0.19], 0.012, f.iron, 6);
    }
    mg.add(new THREE.BoxGeometry(0.8, 0.025, 0.012), f.black, { at: [0, 0.3, 0.19] });
  } else {
    pallet(mg, f, [0, 0, 0], 1.2);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) jerry(mg, mat, [-0.45 + i * 0.18, 0.133, -0.36 + j * 0.36], 0, f);
    mg.add(new THREE.BoxGeometry(1.15, 0.03, 0.01), f.black, { at: [0, 0.4, 0.535] });
  }
  mg.flush(root, 'cans');
}

function drum(mg, mat, at, { tipped = false, f, rusty = false } = {}) {
  const r = 0.29;
  const h = 0.88;
  const g = lathe([[0.001, 0], [r - 0.01, 0], [r, 0.01], [r, h - 0.01], [r - 0.01, h], [0.001, h]], 32);
  const hoops = [0.02, 0.29, 0.59, h - 0.02].map((y) => new THREE.TorusGeometry(r + 0.004, 0.008, 6, 32).rotateX(PI / 2).translate(0, y, 0));
  const bung = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 12).translate(0.15, h + 0.007, 0);
  const parts = [[g, mat], ...hoops.map((hg) => [hg, mat]), [bung, f.iron]];
  for (const [geo, m] of parts) {
    if (tipped) { geo.rotateZ(PI / 2); geo.translate(h / 2, r, 0); }
    mg.add(geo, rusty ? f.rust : m, { at });
  }
}

function drums(ctx, v) {
  const { f, trim, root } = ctx;
  const mg = new Merge();
  const mat = trim === 'blue' ? f.blue : trim === 'red' ? f.drumRed : trim === 'green' ? f.green : f.olive;
  const rusty = trim === 'rusty';
  if (v === 'single') drum(mg, mat, [0, 0, 0], { f, rusty });
  else if (v === 'pallet') {
    pallet(mg, f, [0, 0, 0], 1.2);
    for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) drum(mg, mat, [x, 0.133, z], { f, rusty });
    mg.add(new THREE.TorusGeometry(0.62, 0.006, 4, 40).rotateX(PI / 2).scale(1, 1, 1), f.black, { at: [0, 0.6, 0] });
  } else if (v === 'stack') {
    for (let i = 0; i < 3; i++) drum(mg, mat, [0, 0, -0.581 + i * 0.581], { tipped: true, f, rusty });
    for (let i = 0; i < 2; i++) drum(mg, mat, [0, 0.503, -0.29 + i * 0.581], { tipped: true, f, rusty });
    drum(mg, mat, [0, 1.006, 0], { tipped: true, f, rusty });
  } else {
    drum(mg, mat, [-0.45, 0, 0], { tipped: true, f, rusty });
    drum(mg, mat, [0.45, 0, 0.1], { f, rusty });
    mg.add(new THREE.CircleGeometry(0.6, 24).rotateX(-PI / 2), M.matte('#121212', 0.3), { at: [-0.9, 0.002, 0.2] });
  }
  mg.flush(root, 'drums');
}

/* ------------------------------------------------------------------ */
/* Radio, generator                                                     */
/* ------------------------------------------------------------------ */

function radio(ctx, v) {
  const { f, root, anims } = ctx;
  const mg = new Merge();
  const scr = (at, w, h, rotY = 0) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat('radio'));
    s.name = 'screen';
    s.position.set(...at);
    s.rotation.y = rotY;
    root.add(s);
    anims.push(clip('on', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 1], [1.4, 1.4])]));
  };
  const knobs = (x0, y, z, n) => { for (let i = 0; i < n; i++) mg.add(new THREE.CylinderGeometry(0.014, 0.016, 0.02, 14).rotateX(PI / 2), f.black, { at: [x0 + i * 0.05, y, z] }); };
  if (v === 'manpack') {
    // radio set on a frame pack with handset and whip antenna, standing on the ground
    mg.add(roundedBox(0.32, 0.4, 0.14, 0.02, 2), f.olive, { at: [0, 0.2, 0] });
    mg.add(roundedBox(0.3, 0.18, 0.04, 0.01, 1), f.black, { at: [0, 0.3, 0.085] });
    knobs(-0.09, 0.32, 0.11, 4);
    scr([0.06, 0.24, 0.106], 0.1, 0.05);
    mg.add(cushion(0.34, 0.5, 0.16, { bulge: 0.3 }), f.canvas, { at: [0, 0.25, -0.15] });
    for (const s of [1, -1]) mg.pipe([[s * 0.12, 0.48, -0.22], [s * 0.13, 0.3, -0.3], [s * 0.12, 0.05, -0.24]], 0.015, f.canvasDark, 12, 6);
    mg.add(new THREE.CylinderGeometry(0.015, 0.02, 0.06, 10), f.black, { at: [0.12, 0.43, 0] });
    mg.add(new THREE.CylinderGeometry(0.004, 0.006, 1.6, 6), f.black, { at: [0.12, 0.46 + 0.8, 0] });
    mg.add(roundedBox(0.05, 0.18, 0.04, 0.015, 2), f.black, { at: [-0.2, 0.09, 0.05] });
    mg.pipe([[-0.2, 0.18, 0.05], [-0.22, 0.25, 0.1], [-0.1, 0.25, 0.1], [-0.08, 0.32, 0.085]], 0.004, f.black, 20, 4);
  } else if (v === 'desk-set') {
    // radio stack on a folding table with a field chair
    mg.add(roundedBox(1.2, 0.035, 0.6, 0.01, 1), f.wood, { at: [0, 0.74, 0] });
    for (const [x, z] of [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]]) mg.tube([x, 0, z], [x, 0.725, z], 0.014, f.iron, 6);
    mg.add(roundedBox(0.45, 0.2, 0.32, 0.015, 2), f.olive, { at: [-0.2, 0.86, -0.08] });
    mg.add(roundedBox(0.45, 0.16, 0.32, 0.015, 2), f.olive, { at: [-0.2, 1.04, -0.08] });
    mg.add(roundedBox(0.42, 0.14, 0.012, 0.004, 1), f.black, { at: [-0.2, 0.86, 0.084] });
    knobs(-0.36, 0.86, 0.095, 5);
    scr([-0.05, 1.05, 0.081], 0.14, 0.07);
    mg.add(roundedBox(0.2, 0.06, 0.12, 0.01, 2), f.black, { at: [0.3, 0.79, 0.05] });
    mg.pipe([[0.3, 0.82, 0.05], [0.25, 0.86, 0.0], [-0.1, 0.8, -0.24]], 0.004, f.black, 12, 4);
    mg.add(roundedBox(0.4, 0.035, 0.4, 0.01, 1), f.canvasDark, { at: [0, 0.45, 0.55] });
    for (const s of [1, -1]) mg.tube([s * 0.18, 0, 0.4], [s * 0.18, 0.45, 0.7], 0.012, f.iron, 6);
    for (const s of [1, -1]) mg.tube([s * 0.18, 0, 0.7], [s * 0.18, 0.45, 0.4], 0.012, f.iron, 6);
    mg.tube([-0.2, 1.12, -0.18], [-0.2, 2.3, -0.18], 0.005, f.black, 5);
  } else if (v === 'field-telephone') {
    // leather-cased field telephone on a crate with cable reel
    mg.add(roundedBox(0.5, 0.4, 0.35, 0.015, 2), f.wood, { at: [0, 0.2, 0] });
    mg.add(roundedBox(0.28, 0.22, 0.12, 0.02, 2), f.olive, { at: [0, 0.51, 0] });
    mg.add(roundedBox(0.22, 0.05, 0.06, 0.02, 2), f.black, { at: [0, 0.645, 0] });
    mg.add(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8).rotateZ(PI / 2), f.black, { at: [0.15, 0.53, 0.03] });
    mg.add(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 24).rotateX(PI / 2), f.iron, { at: [0.55, 0.2, 0] });
    mg.add(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 24).rotateX(PI / 2), f.black, { at: [0.55, 0.2, 0] });
    for (const s of [1, -1]) mg.add(roundedBox(0.04, 0.04, 0.3, 0.01, 1), f.iron, { at: [0.55, 0.02, s * 0.0 + 0], rot: [0, s * 0.0, 0] });
    mg.pipe([[0.4, 0.3, 0.02], [0.2, 0.45, 0.05], [0.1, 0.51, 0.04]], 0.004, f.black, 12, 4);
    scr([-0.08, 0.51, 0.061], 0.06, 0.04);
  } else {
    // telescopic antenna mast on a tripod with guy lines
    mg.add(new THREE.CylinderGeometry(0.05, 0.06, 1.5, 12), f.olive, { at: [0, 0.75, 0] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * PI * 2;
      mg.tube([0, 0.6, 0], [Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9], 0.02, f.iron, 6);
      mg.tube([0, 5, 0], [Math.cos(a + 0.5) * 3.5, 0, Math.sin(a + 0.5) * 3.5], 0.003, f.black, 4);
      mg.add(new THREE.CylinderGeometry(0.01, 0.006, 0.2, 5), f.galv, { at: [Math.cos(a + 0.5) * 3.5, 0.07, Math.sin(a + 0.5) * 3.5] });
    }
    mg.add(roundedBox(0.4, 0.3, 0.25, 0.02, 2), f.olive, { at: [0.6, 0.15, 0.3] });
    scr([0.6, 0.2, 0.426], 0.12, 0.06);
    const mast = group('mast', { parent: root, at: [0, 1.4, 0] });
    const mm = new Merge();
    mm.add(new THREE.CylinderGeometry(0.035, 0.04, 2.2, 10), f.galv, { at: [0, 1.1, 0] });
    mm.add(new THREE.CylinderGeometry(0.022, 0.026, 1.5, 10), f.galv, { at: [0, 2.9, 0] });
    for (let i = 0; i < 4; i++) mm.add(new THREE.CylinderGeometry(0.006, 0.006, 0.8, 5).rotateZ(PI / 2).rotateY((i * PI) / 4), f.black, { at: [0, 3.55, 0] });
    mm.flush(mast, 'mast_body');
    anims.push(clip('raise', 8, [new THREE.VectorKeyframeTrack('mast.position', [0, 3, 5, 8], [0, 1.4, 0, 0, 0.0, 0, 0, 0.0, 0, 0, 1.4, 0])]));
  }
  mg.flush(root, 'radio');
}

function generator(ctx, v) {
  const { f, root, anims, trim } = ctx;
  const mg = new Merge();
  const body = group('genset', { parent: root });
  const bm = new Merge();
  let fanAt;
  if (v === 'portable') {
    // tubular frame generator
    for (const s of [1, -1]) {
      for (const x of [-0.33, 0.33]) bm.tube([x, 0.016, s * 0.22], [x, 0.5, s * 0.22], 0.016, f.black, 8);
      bm.tube([-0.33, 0.5, s * 0.22], [0.33, 0.5, s * 0.22], 0.016, f.black, 8);
      bm.tube([-0.33, 0.016, s * 0.22], [0.33, 0.016, s * 0.22], 0.016, f.black, 8);
      for (const x of [-0.33, 0.33]) bm.add(new THREE.SphereGeometry(0.016, 8, 6), f.black, { at: [x, 0.5, s * 0.22] });
    }
    bm.add(roundedBox(0.4, 0.2, 0.3, 0.04, 2), f.plain, { at: [-0.08, 0.38, 0] });
    bm.add(roundedBox(0.35, 0.25, 0.3, 0.03, 2), f.iron, { at: [-0.05, 0.15, 0] });
    bm.add(roundedBox(0.16, 0.22, 0.26, 0.02, 2), f.olive, { at: [0.2, 0.15, 0] });
    for (let i = 0; i < 3; i++) bm.add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10).rotateZ(PI / 2), f.black, { at: [0.29, 0.12 + i * 0.05, -0.06] });
    fanAt = [-0.24, 0.15, 0];
  } else {
    const L = v === 'skid' ? 2.2 : 2.4;
    const yb = v === 'trailer' ? 0.62 : 0.12;
    if (v === 'skid') for (const s of [1, -1]) mg.add(roundedBox(L + 0.2, 0.12, 0.12, 0.02, 2), f.iron, { at: [0, 0.06, s * 0.45] });
    else {
      // single-axle trailer with drawbar
      for (const s of [1, -1]) {
        mg.add(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 24).rotateX(PI / 2), f.rubber, { at: [0, 0.33, s * 0.72] });
        mg.add(new THREE.CylinderGeometry(0.2, 0.2, 0.24, 18).rotateX(PI / 2), f.plain, { at: [0, 0.33, s * 0.72] });
        mg.add(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 20, 1, true, 0, PI).rotateX(PI / 2).rotateZ(PI / 2), f.plain, { at: [0, 0.33, s * 0.72] });
      }
      mg.tube([0, 0.33, -0.75], [0, 0.33, 0.75], 0.04, f.iron, 8);
      mg.add(roundedBox(L, 0.1, 1.1, 0.02, 2), f.iron, { at: [0, yb - 0.05, 0] });
      for (const s of [1, -1]) mg.add(roundedBox(0.12, 0.3, 0.12, 0.02, 1), f.iron, { at: [0, 0.48, s * 0.5] });
      mg.pipe([[L / 2, yb - 0.05, 0.4], [L / 2 + 0.9, yb - 0.1, 0], [L / 2 + 1.1, yb - 0.1, 0]], 0.04, f.iron, 12, 8);
      mg.pipe([[L / 2, yb - 0.05, -0.4], [L / 2 + 0.9, yb - 0.1, 0]], 0.04, f.iron, 12, 8);
      mg.tube([L / 2 + 0.7, yb - 0.1, 0.1], [L / 2 + 0.7, 0.08, 0.1], 0.03, f.iron, 6);
      mg.add(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12).rotateX(PI / 2), f.rubber, { at: [L / 2 + 0.7, 0.08, 0.1] });
      for (const s of [1, -1]) mg.tube([-L / 2 + 0.1, yb - 0.05, s * 0.45], [-L / 2 + 0.1, 0.02, s * 0.45], 0.03, f.iron, 6);
    }
    // acoustic enclosure with louvres and doors
    bm.add(roundedBox(L, 1.2, 1.05, 0.04, 2), ctx.camo ? f.paint : f.plain, { at: [0, yb + 0.6, 0] });
    for (const s of [1, -1]) for (let i = 0; i < 8; i++) bm.add(new THREE.BoxGeometry(0.4, 0.02, 0.03), f.black, { at: [s * (L / 2 - 0.35), yb + 0.4 + i * 0.07, 0.53] });
    bm.add(roundedBox(0.5, 0.35, 0.01, 0.01, 1), f.black, { at: [0, yb + 0.75, 0.53] });
    bm.add(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), f.iron, { at: [-L / 2 + 0.3, yb + 1.35, 0.2] });
    for (const s of [1, -1]) bm.add(new THREE.TorusGeometry(0.06, 0.015, 6, 12), f.iron, { at: [s * (L / 2 - 0.15), yb + 1.21, 0], rot: [0, 0, 0] });
    fanAt = [L / 2 + 0.01, yb + 0.6, 0];
  }
  bm.flush(body, 'genset_body');
  // running lamp + cooling fan
  const lamp = lampGroup('run_lamp', 'green');
  lamp.add(body, { at: v === 'portable' ? [0.285, 0.24, 0.06] : [0.0, (v === 'trailer' ? 0.62 : 0.12) + 0.75, 0.536], normal: v === 'portable' ? [1, 0, 0] : [0, 0, 1], w: 0.025, h: 0.025, shape: 'round' });
  const fan = group('fan', { parent: body, at: fanAt });
  const fm = new Merge();
  fm.add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10).rotateZ(PI / 2), f.iron);
  const fr = v === 'portable' ? 0.09 : 0.32;
  for (let i = 0; i < 5; i++) fm.add(roundedBox(0.012, fr, 0.06, 0.004, 1).rotateY(0.4).translate(0, fr / 2, 0).rotateX((i / 5) * PI * 2), f.black);
  fm.flush(fan, 'fan_body');
  if (v !== 'portable') mg.add(new THREE.TorusGeometry(fr + 0.02, 0.015, 6, 24).rotateY(PI / 2), f.black, { at: fanAt });
  anims.push(clip('running', 0.5, [rotateTrack(fan, 'x', 0.5, (t) => t * PI * 2 * 4, 16), ...lampTracks('run_lamp', LAMP_ON.green), new THREE.VectorKeyframeTrack('genset.position', [0, 0.125, 0.25, 0.375, 0.5], [0, 0, 0, 0, 0.003, 0, 0, 0, 0, 0, 0.003, 0, 0, 0, 0])]));
  void trim;
  mg.flush(root, 'generator');
}

/* ------------------------------------------------------------------ */
/* Watch tower, barriers, wire, first aid                               */
/* ------------------------------------------------------------------ */

function watchTower(ctx, v) {
  const { f, trim, root, anims } = ctx;
  const mg = new Merge();
  const H = v === 'scaffold' ? 4.5 : 5;
  const B = v === 'steel' ? 2.6 : 2.4;
  const T = 1.8;
  const wood = v === 'wooden' || v === 'sandbag-base' ? (trim === 'weathered' ? f.woodDark : f.wood) : v === 'scaffold' ? f.galv : f.plain;
  // four legs tapering in, cross braces
  for (const sx of [1, -1]) for (const sz of [1, -1]) mg.tube([sx * B / 2, 0, sz * B / 2], [sx * T / 2, H, sz * T / 2], v === 'steel' ? 0.06 : 0.08, wood, 8);
  for (let k = 0; k < 3; k++) {
    const y0 = (k * H) / 3;
    const y1 = ((k + 1) * H) / 3;
    const w0 = B - (B - T) * (k / 3);
    const w1 = B - (B - T) * ((k + 1) / 3);
    for (const s of [1, -1]) {
      mg.tube([-w0 / 2, y0, s * w0 / 2], [w1 / 2, y1, s * w1 / 2], 0.035, wood, 6);
      mg.tube([s * w0 / 2, y0, -w0 / 2], [s * w1 / 2, y1, w1 / 2], 0.035, wood, 6);
      mg.tube([-w1 / 2, y1, s * w1 / 2], [w1 / 2, y1, s * w1 / 2], 0.035, wood, 6);
      mg.tube([s * w1 / 2, y1, -w1 / 2], [s * w1 / 2, y1, w1 / 2], 0.035, wood, 6);
    }
  }
  // ladder
  for (const s of [1, -1]) mg.tube([B / 2 + 0.5, 0, s * 0.22], [T / 2 + 0.05, H, s * 0.22], 0.025, wood, 6);
  for (let i = 1; i < 16; i++) {
    const t = i / 16;
    const x = B / 2 + 0.5 + (T / 2 + 0.05 - B / 2 - 0.5) * t;
    mg.tube([x, H * t, -0.22], [x, H * t, 0.22], 0.015, wood, 5);
  }
  // cabin: floor, walls (half height), roof posts, roof
  const P = T + 0.6;
  mg.add(roundedBox(P, 0.1, P, 0.02, 2), wood, { at: [0, H + 0.05, 0] });
  const wallMat = v === 'steel' ? f.plain : wood;
  for (const s of [1, -1]) {
    mg.add(roundedBox(P, 1.1, 0.06, 0.02, 2), wallMat, { at: [0, H + 0.65, s * (P / 2 - 0.03)] });
    mg.add(roundedBox(0.06, 1.1, P - 0.12, 0.02, 2), wallMat, { at: [s * (P / 2 - 0.03), H + 0.65, 0] });
  }
  if (v === 'sandbag-base' || v === 'steel') for (let i = 0; i < 4; i++) for (const s of [1, -1]) sandbag(mg, i % 2 ? f.bag : f.bagDark, [-0.6 + i * 0.4, H + 1.2, s * (P / 2 - 0.03)], 0, [0.4, 0.12, 0.2]);
  for (const sx of [1, -1]) for (const sz of [1, -1]) mg.tube([sx * (P / 2 - 0.05), H + 1.2, sz * (P / 2 - 0.05)], [sx * (P / 2 - 0.05), H + 2.2, sz * (P / 2 - 0.05)], 0.04, wood, 6);
  const roofG = new THREE.ConeGeometry(P * 0.82, 0.6, 4, 1).rotateY(PI / 4);
  mg.add(roofG, v === 'steel' ? f.plain : trim === 'desert' ? f.canvas : f.iron, { at: [0, H + 2.5, 0] });
  if (v === 'sandbag-base') {
    path: {
      const r = rng('tb');
      bagWall(mg, f, [[-B / 2 - 0.3, -B / 2 - 0.3], [B / 2 + 0.3, -B / 2 - 0.3], [B / 2 + 0.3, B / 2 + 0.3 - 0.8]], 6, r);
      bagWall(mg, f, [[-B / 2 - 0.3, B / 2 + 0.3], [-B / 2 - 0.3, -B / 2 - 0.3]], 6, r);
    }
  }
  if (trim === 'camo-net') netOver(mg, f, rng('twn'), H + 2.8, 2.0, 1.4);
  // searchlight that sweeps
  const sl = group('searchlight', { parent: root, at: [P / 2 - 0.25, H + 1.2, P / 2 - 0.25] });
  const sm = new Merge();
  sm.add(new THREE.CylinderGeometry(0.05, 0.08, 0.12, 12), f.iron, { at: [0, 0.06, 0] });
  sm.add(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 18).rotateZ(PI / 2), f.olive, { at: [0.1, 0.25, 0] });
  sm.tube([0, 0.12, 0], [0, 0.2, 0], 0.03, f.iron, 6);
  sm.flush(sl, 'searchlight_body');
  const lamp = lampGroup('searchlamp', 'white');
  lamp.add(sl, { at: [0.255, 0.25, 0], normal: [1, 0, 0], w: 0.24, h: 0.24, shape: 'round', bezel: false });
  anims.push(clip('sweep', 8, [rotateTrack(sl, 'y', 8, (t) => Math.sin(t * PI * 2) * 1.2), ...lampTracks('searchlamp', LAMP_ON.white)]));
  mg.flush(root, 'tower');
}

function barrierGate(ctx, v) {
  const { f, trim, root, anims } = ctx;
  const mg = new Merge();
  const stripeA = trim === 'painted' ? f.red : trim === 'desert' ? M.matte('#c6ad7e', 0.7) : f.white;
  const stripeB = trim === 'painted' ? f.white : f.red;
  const conc = f.concrete;
  if (v === 'boom-gate' || v === 'checkpoint') {
    const L = 5;
    mg.add(roundedBox(0.5, 1.0, 0.5, 0.03, 2), f.plain, { at: [0, 0.5, 0] });
    mg.add(roundedBox(0.6, 0.12, 0.6, 0.02, 2), conc, { at: [0, 0.06, 0] });
    mg.add(roundedBox(0.3, 0.75, 0.3, 0.03, 2), conc, { at: [L, 0.375, 0] });
    mg.add(roundedBox(0.2, 0.08, 0.3, 0.02, 2), f.black, { at: [L, 0.79, 0] });
    const boom = group('boom', { parent: root, at: [0, 1.0, 0] });
    const bm = new Merge();
    bm.add(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 14).rotateX(PI / 2), f.iron);
    const n = 10;
    for (let i = 0; i < n; i++) bm.add(roundedBox(L / n, 0.1, 0.08, 0.02, 1), i % 2 ? stripeB : stripeA, { at: [0.05 + (i + 0.5) * (L / n), -0.1 + 0.0, 0] });
    bm.add(roundedBox(0.7, 0.3, 0.3, 0.03, 2), f.iron, { at: [-0.5, 0, 0] });
    bm.flush(boom, 'boom_body');
    const lamp = lampGroup('gate_lamp', 'red');
    lamp.add(boom, { at: [L / 2, -0.05, 0.045], normal: [0, 0, 1], w: 0.05, h: 0.05, shape: 'round' });
    anims.push(clip('open', 6, [rotateTrack(boom, 'z', 6, (t) => keys([[0, 0], [0.25, 1], [0.7, 1], [1, 0]])(t) * 1.45), ...lampTracks('gate_lamp', LAMP_ON.red, { blink: 1 })]));
    if (v === 'checkpoint') {
      // guard booth with windows + jersey blocks
      const bx = -1.6;
      mg.add(roundedBox(1.6, 0.1, 1.6, 0.02, 2), conc, { at: [bx, 0.05, 0] });
      for (const s of [1, -1]) {
        mg.add(roundedBox(1.5, 1.0, 0.06, 0.02, 2), f.plain, { at: [bx, 0.6, s * 0.72] });
        mg.add(roundedBox(0.06, 1.0, 1.38, 0.02, 2), f.plain, { at: [bx + s * 0.72, 0.6, 0] });
        mg.add(new THREE.BoxGeometry(1.4, 1.0, 0.01), f.glass, { at: [bx, 1.6, s * 0.72] });
        mg.add(new THREE.BoxGeometry(0.01, 1.0, 1.4), f.glass, { at: [bx + s * 0.72, 1.6, 0] });
        for (const t of [1, -1]) mg.add(roundedBox(0.06, 1.0, 0.06, 0.01, 1), f.plain, { at: [bx + s * 0.72, 1.6, t * 0.72] });
      }
      mg.add(roundedBox(1.8, 0.12, 1.8, 0.03, 2), f.plain, { at: [bx, 2.16, 0] });
      for (const x of [1.5, 3.5]) jersey(mg, conc, [x, 0, -1.4], 2);
    }
  } else if (v === 'czech-hedgehog') {
    // three mutually perpendicular beams, body diagonal vertical: three feet on the ground
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0));
    const L = 1.8;
    const cy = (L / 2) / Math.sqrt(3) + 0.05;
    for (const rot of [[0, 0, 0], [0, 0, PI / 2], [0, -PI / 2, 0]]) {
      const g = roundedBox(L, 0.12, 0.12, 0.02, 2);
      g.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
      g.applyQuaternion(q);
      mg.add(g, trim === 'weathered' ? f.rust : f.iron, { at: [0, cy, 0] });
    }
    mg.add(roundedBox(0.2, 0.2, 0.2, 0.03, 2).applyQuaternion(q), f.iron, { at: [0, cy, 0] });
  } else if (v === 't-wall') {
    for (let i = 0; i < 3; i++) {
      const x = -1.35 + i * 1.35;
      mg.add(roundedBox(1.3, 0.35, 1.6, 0.02, 2), conc, { at: [x, 0.175, 0] });
      mg.add(roundedBox(1.3, 3.3, 0.3, 0.02, 2), conc, { at: [x, 0.35 + 1.65, 0] });
      mg.add(new THREE.TorusGeometry(0.08, 0.015, 6, 12, PI), f.iron, { at: [x, 3.64, 0] });
      if (trim === 'painted') mg.add(new THREE.BoxGeometry(1.25, 0.25, 0.01), i % 2 ? f.red : f.white, { at: [x, 1.0, 0.155] });
    }
  } else if (v === 'dragons-teeth') {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) mg.add(lathe([[0.45, 0], [0.4, 0.05], [0.1, 0.9], [0.001, 0.95]], 4).rotateY(PI / 4), conc, { at: [-1.4 + i * 1.4 + j * 0.7, 0, j * 1.2] });
  } else {
    for (let i = 0; i < 3; i++) jersey(mg, conc, [-2.1 + i * 2.05, 0, 0], 2, trim === 'painted' ? [f.red, f.white] : null);
  }
  mg.flush(root, 'barrier');
}

function jersey(mg, mat, at, L, stripes) {
  const prof = [[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.2, 0.3], [0.08, 0.8], [-0.08, 0.8], [-0.2, 0.3], [-0.3, 0.08]];
  const g = extrudeOutline(prof, L, { bevel: 0.02, segments: 1 });
  g.rotateY(PI / 2);
  mg.add(g, mat, { at });
  if (stripes) for (let i = 0; i < 4; i++) mg.add(new THREE.BoxGeometry(L / 4, 0.12, 0.275), stripes[i % 2], { at: [at[0] - L * 0.375 + i * (L / 4), at[1] + 0.6, at[2]] });
}

function barbedWire(ctx, v) {
  const { f, trim, root } = ctx;
  const mg = new Merge();
  const wf = { ...f, galv: trim === 'rusty' ? f.rust : f.galv };
  const r = rng(v);
  const picket = (x, z, h = 1.2) => {
    mg.add(extrudeOutline([[0, 0], [0.05, 0], [0.05, 0.006], [0.006, 0.006], [0.006, 0.05], [0, 0.05]], h, { bevel: 0.002 }).rotateX(-PI / 2), trim === 'rusty' ? f.rust : f.iron, { at: [x, h / 2, z] });
    mg.add(new THREE.BoxGeometry(0.06, 0.12, 0.06), trim === 'rusty' ? f.rust : f.iron, { at: [x + 0.02, 0.06, z + 0.02] });
  };
  if (v === 'concertina' || v === 'triple-concertina') {
    const L = 6;
    coil(mg, wf, [0, 0, 0], L, 0.45, 0, r);
    if (v === 'triple-concertina') {
      coil(mg, wf, [0, 0, 0.9], L, 0.45, 0, r);
      coil(mg, wf, [0, 0.82, 0.45], L, 0.45, 0, r);
    }
    for (let i = 0; i < 4; i++) for (const z of v === 'triple-concertina' ? [-0.5, 1.4] : [-0.5, 0.5]) picket(-L / 2 + 0.3 + i * ((L - 0.6) / 3), z, v === 'triple-concertina' ? 1.6 : 1.0);
    for (const z of v === 'triple-concertina' ? [-0.5, 1.4] : [-0.5, 0.5]) for (const y of [0.3, 0.8]) mg.add(new THREE.CylinderGeometry(0.003, 0.003, L - 0.6, 4).rotateZ(PI / 2), wf.galv, { at: [0, y, z + 0.025] });
  } else if (v === 'picket-fence') {
    const L = 6;
    for (let i = 0; i < 5; i++) picket(-L / 2 + i * (L / 4), 0, 1.5);
    for (let k = 0; k < 6; k++) {
      const y = 0.2 + k * 0.24;
      const pts = [];
      for (let i = 0; i <= 40; i++) pts.push(new THREE.Vector3(-L / 2 + (i / 40) * L, y + Math.sin(i * 0.8) * 0.004, 0.025));
      mg.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.003, 4), wf.galv);
      for (let i = 0; i < 40; i++) mg.add(new THREE.BoxGeometry(0.025, 0.003, 0.003).rotateY(r() * PI).rotateZ(r()), wf.galv, { at: [-L / 2 + (i / 40) * L, y, 0.025] });
    }
    for (const s of [1, -1]) mg.tube([s * L / 2, 1.3, 0], [s * (L / 2 + 0.8), 0, 0], 0.003, wf.galv, 4);
  } else {
    // knife rest (cheval de frise): X-frames on a long beam, wrapped in wire
    const L = 3;
    mg.add(new THREE.CylinderGeometry(0.05, 0.05, L, 10).rotateZ(PI / 2), f.woodDark, { at: [0, 0.6, 0] });
    for (const x of [-L / 2 + 0.1, L / 2 - 0.1]) for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.04, 0.04, 1.7, 8).rotateX(s * PI / 4), f.woodDark, { at: [x, 0.6, 0] });
    for (let k = 0; k < 4; k++) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const a = t * 18;
        pts.push(new THREE.Vector3(-L / 2 + 0.1 + t * (L - 0.2), 0.6 + Math.sin(a + k) * 0.55, Math.cos(a + k) * 0.55));
      }
      mg.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.003, 4), wf.galv);
    }
  }
  if (trim === 'snowy') for (let i = 0; i < 6; i++) mg.add(cushion(1.2, 0.1, 0.9, { bulge: 0.6 }), f.snow, { at: [-2.5 + i, 0.03, 0.2] });
  mg.flush(root, 'wire');
}

function firstAid(ctx, v) {
  const { f, root, anims } = ctx;
  const mg = new Merge();
  const crossOn = (at, size, normal) => {
    const rot = normal === 'z' ? [0, 0, 0] : [0, PI / 2, 0];
    mg.add(new THREE.BoxGeometry(size, size * 0.3, 0.006), f.red, { at, rot });
    mg.add(new THREE.BoxGeometry(size * 0.3, size, 0.006), f.red, { at, rot });
  };
  if (v === 'stretcher-stand') {
    // folding stretcher on two trestles with a blanket and kit bag
    for (const x of [-0.75, 0.75]) for (const s of [1, -1]) mg.tube([x - 0.15 * s, 0, -0.3], [x + 0.15 * s, 0.6, -0.3], 0.015, f.iron, 6) && mg.tube([x - 0.15 * s, 0, 0.3], [x + 0.15 * s, 0.6, 0.3], 0.015, f.iron, 6);
    for (const x of [-0.75, 0.75]) mg.tube([x, 0.6, -0.32], [x, 0.6, 0.32], 0.02, f.iron, 6);
    for (const s of [1, -1]) mg.tube([-1.1, 0.63, s * 0.28], [1.1, 0.63, s * 0.28], 0.018, f.olive, 8);
    mg.add(cushion(1.9, 0.04, 0.55, { bulge: 0.1 }), f.cot, { at: [0, 0.63, 0] });
    mg.add(cushion(1.0, 0.06, 0.58, { bulge: 0.4 }), M.fabric('#6a5a3a'), { at: [0.3, 0.68, 0] });
    mg.add(cushion(0.45, 0.25, 0.25, { bulge: 0.3 }), f.canvas, { at: [-0.6, 0.125, 0.6] });
    crossOn([-0.6, 0.14, 0.73], 0.12, 'z');
  } else if (v === 'aid-tent') {
    // open-sided canopy over a treatment table
    for (const sx of [1, -1]) for (const sz of [1, -1]) mg.tube([sx * 1.5, 0, sz * 1.5], [sx * 1.5, 2.1, sz * 1.5], 0.025, f.iron, 6);
    const roof = new THREE.ConeGeometry(2.3, 0.7, 4, 1, true).rotateY(PI / 4);
    mg.add(roof, f.medical, { at: [0, 2.45, 0] });
    for (const s of [1, -1]) crossOn([0, 2.4, s * 1.08], 0.6, 'z');
    mg.add(roundedBox(1.9, 0.06, 0.7, 0.02, 2), f.white, { at: [0, 0.8, 0] });
    for (const [x, z] of [[-0.85, -0.3], [0.85, -0.3], [-0.85, 0.3], [0.85, 0.3]]) mg.tube([x, 0, z], [x, 0.77, z], 0.02, f.iron, 6);
    mg.add(cushion(1.7, 0.07, 0.6, { bulge: 0.2 }), f.mattress, { at: [0, 0.86, 0] });
    mg.add(roundedBox(0.5, 0.5, 0.4, 0.02, 2), f.olive, { at: [1.1, 0.25, 1.0] });
    crossOn([1.1, 0.3, 1.205], 0.18, 'z');
    for (const s of [1, -1]) mg.tube([s * 1.5, 2.1, 1.5], [s * 2.4, 0, 2.4], 0.004, f.black, 4);
  } else if (v === 'medical-cabinet') {
    const cab = [0.9, 1.7, 0.45];
    mg.add(roundedBox(cab[0], 0.04, cab[2], 0.01, 1), f.white, { at: [0, 0.02, 0] });
    mg.add(roundedBox(cab[0], 0.04, cab[2], 0.01, 1), f.white, { at: [0, cab[1] - 0.02, 0] });
    for (const s of [1, -1]) mg.add(roundedBox(0.03, cab[1], cab[2], 0.01, 1), f.white, { at: [s * (cab[0] / 2 - 0.015), cab[1] / 2, 0] });
    mg.add(roundedBox(cab[0], cab[1], 0.03, 0.01, 1), f.white, { at: [0, cab[1] / 2, -cab[2] / 2 + 0.015] });
    for (let i = 1; i < 4; i++) mg.add(roundedBox(cab[0] - 0.06, 0.02, cab[2] - 0.04, 0.005, 1), f.white, { at: [0, i * 0.42, 0] });
    const r = rng('meds');
    for (let i = 1; i < 4; i++) for (let k = 0; k < 4; k++) mg.add(roundedBox(0.15, 0.1 + r() * 0.15, 0.2, 0.01, 1), [f.medical, f.olive, M.matte('#3a6ab0', 0.6), f.red][(i + k) % 4], { at: [-0.3 + k * 0.2, i * 0.42 + 0.06 + 0.05, 0] });
    const door = group('cabinet_door', { parent: root, at: [cab[0] / 2, 0.04, cab[2] / 2] });
    const dm = new Merge();
    dm.add(roundedBox(cab[0] - 0.02, cab[1] - 0.08, 0.025, 0.008, 1), f.white, { at: [-cab[0] / 2 + 0.01, (cab[1] - 0.08) / 2, 0.0125] });
    dm.add(new THREE.BoxGeometry(0.3, 0.09, 0.006), f.red, { at: [-cab[0] / 2, cab[1] * 0.6, 0.027] });
    dm.add(new THREE.BoxGeometry(0.09, 0.3, 0.006), f.red, { at: [-cab[0] / 2, cab[1] * 0.6, 0.027] });
    dm.flush(door, 'cabinet_door_body');
    anims.push(clip('open', 4, [rotateTrack(door, 'y', 4, (t) => keys([[0, 0], [0.3, 1], [0.7, 1], [1, 0]])(t) * 1.8)]));
  } else {
    // triage post: signpost with cross panel, stretchers on the ground, med bags, lamp
    mg.tube([0, 0, 0], [0, 2.2, 0], 0.04, f.wood, 8);
    mg.add(roundedBox(0.7, 0.7, 0.03, 0.01, 1), f.white, { at: [0, 1.9, 0.055] });
    crossOn([0, 1.9, 0.073], 0.5, 'z');
    for (const z of [0.8, 1.6]) {
      for (const s of [1, -1]) mg.tube([-1.1, 0.06, z + s * 0.28], [1.1, 0.06, z + s * 0.28], 0.018, f.olive, 8);
      mg.add(cushion(1.9, 0.04, 0.55, { bulge: 0.1 }), f.cot, { at: [0, 0.06, z] });
      for (const x of [-0.9, 0.9]) for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6), f.iron, { at: [x, 0.025, z + s * 0.28] });
    }
    for (let i = 0; i < 2; i++) mg.add(cushion(0.45, 0.25, 0.25, { bulge: 0.3 }), f.canvas, { at: [0.5 + i * 0.5, 0.125, -0.5] });
    const lamp = lampGroup('triage_lamp', 'white');
    mg.add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), f.iron, { at: [0, 2.215, 0] });
    lamp.add(root, { geometry: new THREE.SphereGeometry(0.07, 12, 8, 0, PI * 2, 0, PI / 2).translate(0, 2.23, 0), normal: [0, 1, 0], depth: 0.04, w: 0.14, h: 0.14, glowSize: 0.6 });
    anims.push(clip('lamp', 1, lampTracks('triage_lamp', LAMP_ON.white)));
  }
  mg.flush(root, 'aid');
}

/* ------------------------------------------------------------------ */
/* Factories                                                            */
/* ------------------------------------------------------------------ */

export const FIELD = {
  'military-tent': { variants: ['dome', 'a-frame', 'command', 'field-hospital', 'arched-shelter'], build: tent },
  'camo-net': { variants: ['vehicle-hide', 'shelter', 'small-hide', 'wall-screen'], build: camoNet },
  'sandbag-wall': { variants: ['straight', 'curved', 'corner', 'bunker', 'ring', 'pillbox'], build: sandbagWall },
  'hesco-barrier': { variants: ['single', 'row', 'double-stack', 'corner', 'gate-flank'], build: hesco },
  'military-crate': { variants: ['ammo-box', 'supply-crate', 'long-crate', 'medical-crate', 'ration-stack', 'hard-case'], build: crate },
  'jerry-can': { variants: ['single', 'pair', 'rack', 'pallet'], build: jerryCans },
  'oil-drum': { variants: ['single', 'pallet', 'stack', 'tipped'], build: drums },
  'field-radio': { variants: ['manpack', 'desk-set', 'field-telephone', 'antenna-mast'], build: radio },
  'field-generator': { variants: ['portable', 'skid', 'trailer'], build: generator },
  'watch-tower': { variants: ['wooden', 'steel', 'sandbag-base', 'scaffold'], build: watchTower },
  'barrier-gate': { variants: ['boom-gate', 'checkpoint', 'czech-hedgehog', 't-wall', 'dragons-teeth', 'jersey-barrier'], build: barrierGate },
  'barbed-wire': { variants: ['concertina', 'triple-concertina', 'picket-fence', 'knife-rest'], build: barbedWire },
  'first-aid-station': { variants: ['stretcher-stand', 'aid-tent', 'medical-cabinet', 'triage-post'], build: firstAid },
};

function makeField(type) {
  const E = FIELD[type];
  const variants = Object.fromEntries(E.variants.map((v) => [v, true]));
  return (options = {}) => {
    const o = normalizeOptions(options);
    const variant = pickVariant(variants, o.variant, type);
    const trim = o.trim ?? null;
    const f = tentMats(fieldMats(trim));
    const root = group(`${type}-${variant}${trim ? `-${trim}` : ''}`);
    const ctx = { f, trim, root, anims: [], variant, camo: trim && ['desert', 'woodland', 'arctic', 'urban'].includes(trim) };
    E.build(ctx, variant);
    const names = new Set();
    const anims = ctx.anims.filter((a) => a.tracks.length && (names.has(a.name) ? false : names.add(a.name)));
    return finalize(root, { type, variant, options: o, animations: anims });
  };
}

export const createMilitaryTent = makeField('military-tent');
export const createCamoNet = makeField('camo-net');
export const createSandbagWall = makeField('sandbag-wall');
export const createHescoBarrier = makeField('hesco-barrier');
export const createMilitaryCrate = makeField('military-crate');
export const createJerryCan = makeField('jerry-can');
export const createOilDrum = makeField('oil-drum');
export const createFieldRadio = makeField('field-radio');
export const createFieldGenerator = makeField('field-generator');
export const createWatchTower = makeField('watch-tower');
export const createBarrierGate = makeField('barrier-gate');
export const createBarbedWire = makeField('barbed-wire');
export const createFirstAidStation = makeField('first-aid-station');
void pingPong;
