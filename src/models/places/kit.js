import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, rng, normalizeOptions, pickVariant, finalize, tube } from '../../core/utils.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { clip } from '../../core/animation.js';

/*
 * Places kit: the shared trim system every park / place model understands.
 *
 *   style      classic · victorian · modern · rustic · japanese   (materials AND parts change)
 *   season     summer (default) · autumn (leaf litter, warm foliage) · winter (snow, ice)
 *   condition  new (default) · overgrown (grass tufts, ivy, moss) · worn (weathered, dirt)
 *   size       small · large   (footprint scale, heights stay human-sized)
 *
 * Builders receive a `ctx` with resolved materials (ctx.m), colours and helpers.
 */

export const hasDOM = typeof document !== 'undefined';
export const STYLES = ['classic', 'victorian', 'modern', 'rustic', 'japanese'];
export const SEASONS = ['summer', 'autumn', 'winter'];
export const CONDS = ['overgrown', 'worn'];
export const SIZES = { small: 0.75, large: 1.4 };
/** Standard trim set: 4 styles + 2 seasons + 2 conditions + 2 sizes. */
export const STD = ['victorian', 'modern', 'rustic', 'japanese', 'autumn', 'winter', 'overgrown', 'worn', 'large', 'small'];
export const ENV = ['autumn', 'winter', 'overgrown', 'worn', 'large', 'small'];

const DEF = {
  classic: { frame: '#efebe1', frameKind: 'paint', roof: '#5a6068', floor: '#9b7350', metal: '#2c3a33', stone: '#b9b2a6', accent: '#2f5d46', trim: '#efebe1' },
  victorian: { frame: '#1e3a2e', frameKind: 'iron', roof: '#5f9e8c', floor: '#cbbfa8', metal: '#1c2621', stone: '#cdbfa6', accent: '#b8913a', trim: '#e9dfc4' },
  modern: { frame: '#3a3f44', frameKind: 'steel', roof: '#d8d6d0', floor: '#b9b5ae', metal: '#3a3f44', stone: '#c4c0b8', accent: '#c1844e', trim: '#a7adb2' },
  rustic: { frame: '#6b4a2e', frameKind: 'log', roof: '#6e5136', floor: '#8a6a48', metal: '#2a2a2a', stone: '#8e877c', accent: '#4a6b35', trim: '#7a5634' },
  japanese: { frame: '#3b2a22', frameKind: 'timber', roof: '#3d4247', floor: '#a58260', metal: '#2a2a2a', stone: '#9a958c', accent: '#b8382a', trim: '#ece4d0' },
};

const LEAF = {
  summer: ['#3f6b2a', '#4d7a31', '#5a8a3a', '#36602a'],
  autumn: ['#c2611f', '#d8902a', '#a8371f', '#e0b23a', '#8a4a1e'],
  winter: ['#55614a', '#4a5641', '#5d6650'],
};
const BLOOM = {
  summer: ['#e0457b', '#f2c230', '#f4f1ea', '#9b59d0', '#ff7a45', '#d8263a'],
  autumn: ['#d8701e', '#b8322a', '#e8b02a', '#8a2a4a', '#f0d070'],
  winter: ['#7a5a3a', '#8a6a48', '#6a5038'],
};
const LAWN = { summer: '#5e8f3a', autumn: '#7e8a42', winter: '#eef3f7' };

export const mat = {
  paint: (c) => new THREE.MeshPhysicalMaterial({ name: 'paint', color: M.toColor(c), roughness: 0.5, clearcoat: 0.25 }),
  iron: (c) => new THREE.MeshStandardMaterial({ name: 'cast-iron', color: M.toColor(c), metalness: 0.6, roughness: 0.5 }),
  steel: (c = '#3a3f44') => new THREE.MeshPhysicalMaterial({ name: 'powder-coat', color: M.toColor(c), metalness: 0.4, roughness: 0.42, clearcoat: 0.3 }),
  galv: () => M.metal('#a3a8ad', 0.42),
  stone: (c = '#b9b2a6') => new THREE.MeshStandardMaterial({ name: 'stone', color: M.toColor(c), roughness: 0.9 }),
  concrete: (c = '#bdb9b1') => new THREE.MeshStandardMaterial({ name: 'concrete', color: M.toColor(c), roughness: 0.93 }),
  bark: (c = '#5a4029') => new THREE.MeshStandardMaterial({ name: 'bark', color: M.toColor(c), roughness: 1 }),
  lawn: (c) => new THREE.MeshStandardMaterial({ name: 'lawn', color: M.toColor(c), roughness: 1 }),
  soil: () => new THREE.MeshStandardMaterial({ name: 'soil', color: '#4a3424', roughness: 1 }),
  mulch: () => new THREE.MeshStandardMaterial({ name: 'mulch', color: '#5e3f28', roughness: 1 }),
  gravel: (c = '#cfc7b6') => new THREE.MeshStandardMaterial({ name: 'gravel', color: M.toColor(c), roughness: 1 }),
  sand: () => new THREE.MeshStandardMaterial({ name: 'sand', color: '#e2cf9e', roughness: 1 }),
  water: () => new THREE.MeshPhysicalMaterial({ name: 'water', color: '#3f7480', roughness: 0.06, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.88 }),
  leaf: (c) => new THREE.MeshStandardMaterial({ name: 'leaf', color: M.toColor(c), roughness: 0.8, flatShading: true }),
  bloom: (c) => new THREE.MeshStandardMaterial({ name: 'bloom', color: M.toColor(c), roughness: 0.6 }),
  brick: (c = '#a0523a') => new THREE.MeshStandardMaterial({ name: 'brick', color: M.toColor(c), roughness: 0.9 }),
  rubber: (c = '#2f6a4a') => new THREE.MeshStandardMaterial({ name: 'rubber-floor', color: M.toColor(c), roughness: 0.95 }),
};

/** Resolve trim → ctx (style, season, condition, size, materials). */
export function makeCtx(o, type, variant, v = {}) {
  const t = o.trim ?? null;
  const style = STYLES.includes(t) ? t : v.style ?? 'classic';
  const season = SEASONS.includes(t) ? t : 'summer';
  const cond = CONDS.includes(t) ? t : 'new';
  const k = (SIZES[t] ?? 1) * (o.size ?? 1);
  const d = DEF[style];
  const r = rng(`${type}-${variant}-${t}-${o.seed ?? 1}`);
  const frame = d.frameKind === 'iron' ? mat.iron(d.frame) : d.frameKind === 'steel' ? mat.steel(d.frame) : d.frameKind === 'log' ? mat.bark('#6b4a2e') : d.frameKind === 'timber' ? M.wood(d.frame) : mat.paint(d.frame);
  const m = {
    frame,
    wood: M.wood(style === 'japanese' ? '#9a7550' : style === 'rustic' ? '#8a6440' : '#a87a4c'),
    darkWood: M.wood('#5b3a24'),
    roof: new THREE.MeshStandardMaterial({ name: 'roof', color: M.toColor(o.color && style !== 'modern' ? o.color : d.roof), roughness: style === 'victorian' ? 0.5 : 0.85, metalness: style === 'victorian' ? 0.35 : 0 }),
    floor: style === 'victorian' || style === 'modern' ? mat.stone(d.floor) : M.wood(d.floor),
    metal: style === 'modern' ? mat.steel(d.metal) : mat.iron(d.metal),
    stone: mat.stone(d.stone),
    concrete: mat.concrete(),
    accent: style === 'modern' ? M.wood(d.accent) : mat.paint(d.accent),
    trim: mat.paint(d.trim),
    gold: M.metal('#b8913a', 0.3),
    bark: mat.bark(),
    lawn: mat.lawn(LAWN[season]),
    soil: mat.soil(),
    mulch: mat.mulch(),
    gravel: mat.gravel(style === 'japanese' ? '#e4e0d6' : '#cfc7b6'),
    water: mat.water(),
    sand: mat.sand(),
    leaf: LEAF[season].map((c) => mat.leaf(c)),
    bloom: BLOOM[season].map((c) => mat.bloom(c)),
  };
  return { o, type, variant, trim: t, style, season, cond, k, r, m, d, v, winter: season === 'winter', autumn: season === 'autumn' };
}

/** Standard factory: options → ctx → build(root, ctx) → seasonal/condition post-pass → finalize. */
export function defineType(type, VARIANTS, build) {
  return function create(options = {}) {
    const o = normalizeOptions(options);
    const variant = pickVariant(VARIANTS, o.variant, type);
    const ctx = makeCtx(o, type, variant, VARIANTS[variant]);
    const root = group(`${type}-${variant}`);
    const animations = build(root, ctx, VARIANTS[variant], variant) || [];
    return finishPlace(root, ctx, { type, variant, o, animations });
  };
}

/* ------------------------------- geometry helpers ------------------------------- */

export const polar = (R, a) => [R * Math.sin(a), R * Math.cos(a)];

/** Rounded-rect outline shape centred on origin (x, y). */
export function rrShape(w, d, r) {
  r = Math.min(r, w / 2 - 1e-3, d / 2 - 1e-3);
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2);
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r);
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r);
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return s;
}

/** Organic blob outline (ponds, lawns, beds). */
export function blobShape(rx, rz, rand, { n = 14, wobble = 0.18 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rand() - 0.5) * 2 * wobble;
    pts.push(new THREE.Vector2(Math.cos(a) * rx * k, Math.sin(a) * rz * k));
  }
  const s = new THREE.Shape();
  const c = new THREE.SplineCurve([...pts, pts[0], pts[1]]);
  const sp = c.getPoints(n * 6).slice(0, -6 * 2 + 1);
  s.setFromPoints(sp);
  return s;
}

/** Horizontal slab from a 2D shape: shape x → world x, shape y → world z, from y0 up by h. */
export function slabFromShape(shape, h, { y0 = 0, bevel = 0.015, holes } = {}) {
  if (holes) shape.holes.push(...holes);
  const b = Math.min(bevel, h / 3);
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(h - 2 * b, 1e-3), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 24 });
  g.rotateX(Math.PI / 2);
  g.translate(0, y0 + h - b, 0);
  g.computeVertexNormals();
  return g;
}

/** Ground pad (lawn / gravel / paving) of w × d, top at h. shape: 'rect' | 'round' | 'blob'. */
export function pad(parent, w, d, material, { h = 0.05, shape = 'rect', rand, r = 0.3, at = [0, 0, 0], name = 'ground' } = {}) {
  const s = shape === 'round' ? new THREE.Shape().absellipse(0, 0, w / 2, d / 2, 0, Math.PI * 2) : shape === 'blob' ? blobShape(w / 2, d / 2, rand ?? rng(3)) : rrShape(w, d, r);
  return mesh(slabFromShape(s, h, { y0: 0 }), material, { parent, at, name });
}

/** Instanced copies: items = [{ at, rot, s }]. Box contact counts as touching. */
export function inst(parent, geo, material, items, name = 'inst') {
  const im = new THREE.InstancedMesh(geo, material, Math.max(1, items.length));
  im.name = name;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  items.forEach((it, i) => {
    e.set(...(it.rot ?? [0, 0, 0]));
    q.setFromEuler(e);
    const s = typeof it.s === 'number' ? [it.s, it.s, it.s] : it.s ?? [1, 1, 1];
    m4.compose(new THREE.Vector3(...it.at), q, new THREE.Vector3(...s));
    im.setMatrixAt(i, m4);
    if (it.color) im.setColorAt(i, M.toColor(it.color));
  });
  im.count = items.length;
  if (items.length) parent.add(im);
  return im;
}

/** Style-appropriate upright post from y0 to y1 (classic square, victorian column, steel, log, timber). */
export function post(parent, ctx, x, z, y0, y1, { w = 0.14, material, name = 'post', footing = true } = {}) {
  const h = y1 - y0;
  const st = ctx.style;
  const mt = material ?? ctx.m.frame;
  if (st === 'victorian') {
    const r = w * 0.32;
    const prof = [[0.001, 0], [r * 2, 0], [r * 2, h * 0.05], [r * 1.5, h * 0.08], [r * 1.25, h * 0.1], [r, h * 0.13], [r * 0.85, h * 0.88], [r * 1.3, h * 0.92], [r * 1.9, h * 0.97], [r * 2, h], [0.001, h]];
    mesh(lathe(prof, 16), mt, { parent, at: [x, y0, z], name });
  } else if (st === 'modern') {
    mesh(roundedBox(w * 0.6, h, w * 0.6, 0.01, 2), mt, { parent, at: [x, y0 + h / 2, z], name });
  } else if (st === 'rustic') {
    mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.65, h, 12), mt, { parent, at: [x, y0 + h / 2, z], name });
  } else if (st === 'japanese') {
    if (footing) mesh(lathe([[0.001, 0], [w * 0.95, 0], [w * 0.9, 0.1], [w * 0.6, 0.16], [0.001, 0.16]], 16), ctx.m.stone, { parent, at: [x, y0, z] });
    mesh(roundedBox(w, h - (footing ? 0.16 : 0), w, 0.015, 2), mt, { parent, at: [x, y0 + (footing ? 0.16 : 0) + (h - (footing ? 0.16 : 0)) / 2, z], name });
  } else {
    mesh(roundedBox(w, h, w, 0.015, 2), mt, { parent, at: [x, y0 + h / 2, z], name });
    if (footing) mesh(roundedBox(w * 1.35, 0.16, w * 1.35, 0.02, 2), mt, { parent, at: [x, y0 + 0.08, z] });
  }
}

/** Beam (horizontal member) from a to b, style-shaped. */
export function beam(parent, ctx, a, b, { w = 0.12, h = 0.16, material, name = 'beam' } = {}) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const mt = material ?? ctx.m.frame;
  let g;
  if (ctx.style === 'rustic') {
    g = new THREE.CylinderGeometry(h * 0.5, h * 0.5, len, 10);
    g.rotateZ(Math.PI / 2);
  } else g = roundedBox(len, h, w, 0.012, 2);
  const m = mesh(g, mt, { parent, name });
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.rotation.y = -Math.atan2(vb.z - va.z, vb.x - va.x);
  m.rotateZ(Math.atan2(vb.y - va.y, Math.hypot(vb.x - va.x, vb.z - va.z)));
  return m;
}

/** Railing from a to b (style dependent), sitting on y=a[1]. */
export function railing(parent, ctx, a, b, { h = 0.95, posts = true } = {}) {
  const [ax, ay, az] = a;
  const [bx, , bz] = b;
  const len = Math.hypot(bx - ax, bz - az);
  const ang = Math.atan2(bz - az, bx - ax);
  const st = ctx.style;
  const mt = st === 'classic' ? ctx.m.trim : st === 'japanese' ? ctx.m.accent : st === 'rustic' ? ctx.m.bark : ctx.m.metal;
  const r = st === 'rustic' ? 0.05 : st === 'japanese' ? 0.035 : 0.022;
  if (posts) for (const [x, z] of [[ax, az], [bx, bz]]) tube([x, ay, z], [x, ay + h + 0.02, z], r * 1.5, mt, { parent, radialSegments: 10 });
  tube([ax, ay + h, az], [bx, ay + h, bz], r, mt, { parent, radialSegments: 10 });
  tube([ax, ay + 0.12, az], [bx, ay + 0.12, bz], r * 0.8, mt, { parent, radialSegments: 8 });
  if (st === 'japanese') tube([ax, ay + h * 0.55, az], [bx, ay + h * 0.55, bz], r * 0.8, mt, { parent, radialSegments: 8 });
  const items = [];
  if (st === 'rustic') {
    // X-brace logs
    tube([ax, ay + 0.12, az], [bx, ay + h, bz], r * 0.8, mt, { parent, radialSegments: 8 });
  } else if (st !== 'japanese') {
    const n = Math.max(2, Math.round(len / (st === 'modern' ? 0.16 : 0.12)));
    const sp = st === 'modern' ? 0.006 : st === 'victorian' ? 0.01 : 0.018;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      items.push({ at: [ax + (bx - ax) * t, ay + 0.12 + (h - 0.12) / 2, az + (bz - az) * t], s: [1, 1, 1] });
    }
    const g = st === 'classic' ? roundedBox(0.035, h - 0.12, 0.035, 0.008, 1) : new THREE.CylinderGeometry(sp, sp, h - 0.12, 6);
    inst(parent, g, mt, items, 'balusters');
    if (st === 'victorian') {
      const ring = new THREE.TorusGeometry(0.05, 0.007, 6, 16);
      ring.rotateY(-ang + Math.PI / 2);
      inst(parent, ring, mt, items.filter((_, i) => i % 2 === 0).map((it) => ({ at: [it.at[0], ay + h - 0.12, it.at[2]] })), 'rail-rings');
    }
  }
  void len;
}

/** Place an imported object (other category) so its base sits at y. */
export function place(parent, obj, x, z, { rot = 0, y = 0, s = 1, lift = true } = {}) {
  obj.position.set(x, 0, z);
  obj.rotation.y = rot;
  if (s !== 1) obj.scale.multiplyScalar(s);
  if (lift) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    obj.position.y = y - b.min.y;
  } else obj.position.y = y;
  obj.animations = [];
  // the host's own seasonal pass scatters leaves; drop the guest's litter (it may overhang the host's ground)
  obj.traverse((c) => { if (c.isMesh && /litter|fallen_leaves/.test(c.name)) c.visible = false; });
  obj.userData = { imported: true };
  parent.add(obj);
  return obj;
}

/** Pick a trim from `list` matching the ctx season/condition (first candidate available). */
export function trimFor(ctx, list, map) {
  const want = map[ctx.season] ?? map[ctx.cond] ?? map[ctx.style];
  if (!want) return undefined;
  for (const w of [].concat(want)) if (list?.includes(w)) return w;
  return undefined;
}

/** Leafy cluster blobs (instanced) around points — climbers, bushes on structures. */
export function leafClusters(parent, ctx, pts, { size = 0.22, name = 'foliage' } = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const byMat = ctx.m.leaf.map(() => []);
  pts.forEach((p, i) => {
    const s = size * (0.7 + ctx.r() * 0.6);
    byMat[i % byMat.length].push({ at: p, s: [s, s * 0.75, s], rot: [0, ctx.r() * 6, 0] });
  });
  byMat.forEach((items, i) => items.length && inst(parent, geo, ctx.m.leaf[i], items, `${name}_${i}`));
}

/** Flower heads (instanced small spheres) in season colours. */
export function blooms(parent, ctx, pts, { size = 0.05, name = 'blooms' } = {}) {
  const geo = new THREE.SphereGeometry(1, 8, 6);
  const byMat = ctx.m.bloom.map(() => []);
  pts.forEach((p, i) => byMat[(i * 7 + Math.floor(ctx.r() * 3)) % byMat.length].push({ at: p, s: size * (0.7 + ctx.r() * 0.6) }));
  byMat.forEach((items, i) => items.length && inst(parent, geo, ctx.m.bloom[i], items, `${name}_${i}`));
}

/** Warm park lamps that all light from one 'on' animation. */
export function lampSet(name = 'lamps', kind = 'fog') {
  return lampGroup(name, kind);
}
export const lampOn = (name = 'lamps', i = 3) => clip('on', 1, lampTracks(name, i));

/** Park lamp post at (x,z), style-dependent head. */
export function parkLamp(parent, ctx, lamps, x, z, { h = 3.6 } = {}) {
  const st = ctx.style;
  const mt = st === 'modern' ? mat.steel('#3a3f44') : st === 'rustic' ? M.wood('#5b3a24') : mat.iron(st === 'victorian' ? '#1e3a2e' : '#222826');
  const g = group('lamp-post', { parent, at: [x, 0, z] });
  if (st === 'japanese') {
    // stone lantern (tōrō style, generic): base, shaft, light box, roof, knob
    const s = ctx.m.stone;
    mesh(lathe([[0.001, 0], [0.3, 0], [0.3, 0.12], [0.2, 0.18], [0.001, 0.18]], 6), s, { parent: g });
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 12), s, { parent: g, at: [0, 0.48, 0] });
    mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.1, 6), s, { parent: g, at: [0, 0.83, 0] });
    mesh(roundedBox(0.3, 0.28, 0.3, 0.02), s, { parent: g, at: [0, 1.02, 0] });
    lamps.add(g, { at: [0, 1.02, 0.151], normal: [0, 0, 1], w: 0.14, h: 0.12, bezel: false });
    lamps.add(g, { at: [0, 1.02, -0.151], normal: [0, 0, -1], w: 0.14, h: 0.12, bezel: false });
    mesh(lathe([[0.001, 0], [0.4, 0], [0.42, 0.04], [0.2, 0.2], [0.06, 0.26], [0.001, 0.26]], 6), s, { parent: g, at: [0, 1.16, 0] });
    mesh(new THREE.SphereGeometry(0.06, 10, 8), s, { parent: g, at: [0, 1.44, 0] });
    return g;
  }
  if (st === 'rustic') {
    mesh(roundedBox(0.14, h, 0.14, 0.02), mt, { parent: g, at: [0, h / 2, 0] });
    mesh(roundedBox(0.5, 0.1, 0.1, 0.02), mt, { parent: g, at: [0.2, h - 0.2, 0] });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), mat.iron('#222'), { parent: g, at: [0.38, h - 0.33, 0] });
    mesh(new THREE.ConeGeometry(0.15, 0.12, 4), mat.iron('#222'), { parent: g, at: [0.38, h - 0.47, 0], rot: [0, Math.PI / 4, 0] });
    mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.2, 4, 1, true), mat.iron('#222'), { parent: g, at: [0.38, h - 0.63, 0], rot: [0, Math.PI / 4, 0] });
    lamps.add(g, { at: [0.38, h - 0.63, 0], normal: [0, -1, 0], w: 0.1, h: 0.1, shape: 'round', bezel: false });
    lamps.add(g, { at: [0.38, h - 0.6, 0.05], normal: [0, 0, 1], w: 0.08, h: 0.12, bezel: false });
    return g;
  }
  if (st === 'modern') {
    mesh(lathe([[0.001, 0], [0.09, 0], [0.06, 0.04], [0.045, 0.06], [0.04, h], [0.001, h]], 16), mt, { parent: g });
    mesh(roundedBox(0.16, 0.06, 0.5, 0.02), mt, { parent: g, at: [0, h + 0.03, 0.18] });
    lamps.add(g, { at: [0, h - 0.001, 0.26], normal: [0, -1, 0], w: 0.1, h: 0.3, shape: 'strip', bezel: false });
    return g;
  }
  // classic / victorian: fluted post with lantern
  mesh(lathe([[0.001, 0], [0.16, 0], [0.16, 0.08], [0.12, 0.14], [0.11, 0.4], [0.07, 0.5], [0.055, 0.56], [0.05, h - 0.3], [0.07, h - 0.24], [0.07, h - 0.18], [0.001, h - 0.18]], 20), mt, { parent: g });
  if (st === 'victorian') {
    for (const sx of [-1, 1]) {
      const arm = mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 16, Math.PI), mt, { parent: g, at: [sx * 0.16, h - 0.5, 0] });
      void arm;
    }
  }
  const lan = group('lantern', { parent: g, at: [0, h - 0.18, 0] });
  mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.06, 6), mt, { parent: lan, at: [0, 0.03, 0] });
  lamps.add(lan, { geometry: new THREE.CylinderGeometry(0.13, 0.09, 0.36, 6).translate(0, 0.24, 0), normal: [0, 0, 1], depth: 0.13 });
  for (let i = 0; i < 6; i++) {
    const [px, pz] = polar(0.12, (i / 6) * Math.PI * 2);
    tube([px * 0.75, 0.06, pz * 0.75], [px * 1.08, 0.42, pz * 1.08], 0.008, mt, { parent: lan, radialSegments: 5 });
  }
  mesh(new THREE.ConeGeometry(0.2, 0.18, 6), mt, { parent: lan, at: [0, 0.51, 0] });
  mesh(new THREE.SphereGeometry(0.03, 8, 6), mt, { parent: lan, at: [0, 0.62, 0] });
  return g;
}

/** Canvas texture (null in Node). */
const texCache = new Map();
export function canvasTex(key, w, h, draw) {
  if (!hasDOM) return null;
  if (key && texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (key) texCache.set(key, t);
  return t;
}

/** Flat panel with a canvas texture, facing +Z, centred at `at`. Falls back to a plain colour. */
export function panel(parent, w, h, tex, { at = [0, 0, 0], rotY = 0, color = '#f2efe6', name = 'panel' } = {}) {
  const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex ?? null, color: tex ? '#ffffff' : color, roughness: 0.6, name: 'sign-face' }), { parent, at, rot: [0, rotY, 0], name });
  return m;
}

/** Park map texture: lawns, paths, pond, "you are here". */
export function mapTexture(seed = 1, title = 'PARK MAP') {
  return canvasTex(`map-${seed}-${title}`, 512, 384, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = '#f3efe2';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#9cc77a';
    g.beginPath();
    g.roundRect(20, 60, w - 40, h - 80, 30);
    g.fill();
    g.fillStyle = '#6fa8c8';
    g.beginPath();
    g.ellipse(w * (0.3 + r() * 0.3), h * 0.55, 60, 36, 0.3, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#e8dcc0';
    g.lineWidth = 12;
    g.beginPath();
    g.moveTo(20, h * 0.4);
    g.bezierCurveTo(w * 0.3, h * 0.2, w * 0.6, h * 0.9, w - 20, h * 0.6);
    g.moveTo(w * 0.5, 60);
    g.lineTo(w * 0.55, h - 20);
    g.stroke();
    g.fillStyle = '#4f8a3e';
    for (let i = 0; i < 30; i++) {
      g.beginPath();
      g.arc(30 + r() * (w - 60), 70 + r() * (h - 100), 6 + r() * 6, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#d23a2a';
    g.beginPath();
    g.arc(w * 0.52, h * 0.45, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#20302a';
    g.font = 'bold 40px Georgia, serif';
    g.textAlign = 'center';
    g.fillText(title, w / 2, 44);
    g.font = '18px Helvetica, Arial, sans-serif';
    g.fillText('● you are here', w * 0.52 + 70, h * 0.45 + 6);
  });
}

/** Simple text texture. */
export function textTex(lines, { w = 512, h = 192, bg = '#2f4a3a', fg = '#f2ead2', font = 'bold 64px Georgia, serif' } = {}) {
  return canvasTex(`txt-${lines.join('|')}-${w}-${h}-${bg}-${fg}-${font}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = font;
    lines.forEach((t, i) => g.fillText(t, w / 2, (h * (i + 0.5)) / lines.length));
  });
}

/* ------------------------------ seasonal post pass ------------------------------ */

const isGlow = (o) => o.userData.noShadow || o.material?.blending === THREE.AdditiveBlending;
function rayTargets(root) {
  const out = [];
  const walk = (o) => {
    if (o.userData?.imported || o.userData?.noRay) return;
    if (o.isMesh && !isGlow(o) && o.visible) out.push(o);
    for (const c of o.children) walk(c);
  };
  for (const c of root.children) walk(c);
  return out;
}

const _ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
/** Grid of downward hits on upward-facing surfaces: [{p, n, obj}]. */
function upHits(root, targets, r, maxRays = 1600) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const t of targets) box.expandByObject(t);
  if (box.isEmpty()) return [];
  const size = box.getSize(new THREE.Vector3());
  const cell = Math.max(0.04, Math.sqrt((size.x * size.z) / maxRays));
  const hits = [];
  for (let x = box.min.x + cell / 2; x <= box.max.x; x += cell) {
    for (let z = box.min.z + cell / 2; z <= box.max.z; z += cell) {
      _ray.set(new THREE.Vector3(x + (r() - 0.5) * cell * 0.5, box.max.y + 0.5, z + (r() - 0.5) * cell * 0.5), DOWN);
      _ray.far = size.y + 1;
      const h = _ray.intersectObjects(targets, false)[0];
      if (!h || !h.face) continue;
      const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
      if (h.object.isInstancedMesh && h.instanceId != null) {
        const m4 = new THREE.Matrix4();
        h.object.getMatrixAt(h.instanceId, m4);
        n.copy(h.face.normal).transformDirection(m4).transformDirection(h.object.matrixWorld);
      }
      if (n.y < 0.6) continue;
      hits.push({ p: h.point, obj: h.object });
    }
  }
  return { hits, cell, box };
}

function eachMaterial(root, fn) {
  const seen = new Set();
  root.traverse((o) => {
    if (!o.isMesh || isGlow(o)) return;
    for (let p = o; p; p = p.parent) if (p.userData?.imported) return;
    for (const m of [].concat(o.material)) if (m && !seen.has(m)) { seen.add(m); fn(m); }
  });
}
const SKIP = /^(lamp|glow|emissive|sign-face|snow|water|ice)/;

function snowPass(root, ctx) {
  const targets = rayTargets(root);
  const res = upHits(root, targets, ctx.r);
  if (!res.hits) return;
  const { hits, cell, box } = res;
  const snow = new THREE.MeshStandardMaterial({ color: '#f6f9fc', roughness: 0.9, name: 'snow' });
  const items = [];
  for (const { p, obj } of hits) {
    if (obj.material?.name === 'lawn' || obj.material?.name === 'snow') continue;
    const s = cell * (0.62 + ctx.r() * 0.25);
    const t = Math.min(0.06, cell * (0.25 + ctx.r() * 0.15));
    items.push({ at: [p.x, p.y + t * 0.3, p.z], s: [s, t, s] });
  }
  inst(root, new THREE.SphereGeometry(1, 10, 6), snow, items, 'snow');
  // ground drift ring if there is no lawn/snow ground of our own
  let hasLawn = false;
  eachMaterial(root, (m) => { if (m.name === 'lawn') hasLawn = true; });
  if (!hasLawn) {
    const c = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const ring = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const s = 0.1 + ctx.r() * 0.12;
      ring.push({ at: [c.x + Math.cos(a) * Math.min(sz.x / 2, 2) * (0.7 + ctx.r() * 0.4), 0, c.z + Math.sin(a) * Math.min(sz.z / 2, 2) * (0.7 + ctx.r() * 0.4)], s: [s * 1.7, s * 0.4, s * 1.7] });
    }
    inst(root, new THREE.SphereGeometry(1, 10, 6), snow, ring, 'snow_drift');
  }
  eachMaterial(root, (m) => {
    if (m.name === 'water') {
      m.color.set('#cfe2ea');
      m.opacity = 1;
      m.transparent = false;
      m.roughness = 0.25;
      m.name = 'ice';
    } else if (m.name === 'leaf') m.color.lerp(new THREE.Color('#e8eef0'), 0.25);
  });
}

function leafLitterPass(root, ctx, density = 0.22) {
  const res = upHits(root, rayTargets(root), ctx.r);
  if (!res.hits) return;
  const geo = new THREE.CircleGeometry(0.045, 5);
  geo.rotateX(-Math.PI / 2);
  geo.scale(1, 1, 1.6);
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, side: THREE.DoubleSide, name: 'fallen-leaves' });
  const items = [];
  for (const { p, obj } of res.hits) {
    if (obj.isInstancedMesh && p.y > 0.1) continue;
    const n = p.y < 0.4 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      if (ctx.r() > density) continue;
      const j = 0;
      items.push({ at: [p.x + (ctx.r() - 0.5) * j, p.y + 0.004, p.z + (ctx.r() - 0.5) * j], rot: [0, ctx.r() * 6.28, 0], s: 0.7 + ctx.r() * 0.7, color: ctx.r.pick(LEAF.autumn) });
    }
  }
  inst(root, geo, material, items, 'fallen_leaves');
}

function overgrowPass(root, ctx) {
  const targets = rayTargets(root);
  const res = upHits(root, targets, ctx.r, 1200);
  if (!res.hits) return;
  // grass tufts: merged blades
  const blades = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.ConeGeometry(0.012, 0.22 + (i % 3) * 0.06, 3);
    b.translate(0, 0.11, 0);
    b.rotateZ((i % 2 ? 1 : -1) * (0.15 + i * 0.03));
    b.rotateY(i * 1.05);
    blades.push(b);
  }
  const tuft = mergeGeometries(blades);
  const gm = mat.leaf(ctx.winter ? '#a59a6a' : ctx.autumn ? '#9a9045' : '#5f8a32');
  const items = [];
  for (const { p, obj } of res.hits) {
    if (p.y > 0.25 || ctx.r() > 0.16) continue;
    if (obj.material?.name === 'water') continue;
    items.push({ at: [p.x, p.y, p.z], s: 0.8 + ctx.r() * 0.9, rot: [0, ctx.r() * 6, 0] });
  }
  inst(root, tuft, gm, items, 'weeds');
  // ivy on tall upright parts (side rays)
  const ivy = [];
  const tall = targets.filter((t) => {
    if (t.isInstancedMesh) return false;
    const b = new THREE.Box3().setFromObject(t);
    const s = b.getSize(new THREE.Vector3());
    return s.y > 0.7 && s.y > Math.max(s.x, s.z) * 1.4 && b.min.y < 0.3;
  }).slice(0, 14);
  for (const t of tall) {
    const b = new THREE.Box3().setFromObject(t);
    const c = b.getCenter(new THREE.Vector3());
    const top = b.min.y + (b.max.y - b.min.y) * (0.4 + ctx.r() * 0.5);
    for (let y = b.min.y + 0.1; y < top; y += 0.12) {
      const a = ctx.r() * Math.PI * 2;
      const R = (b.max.x - b.min.x + b.max.z - b.min.z) + 1;
      _ray.set(new THREE.Vector3(c.x + Math.cos(a) * R, y, c.z + Math.sin(a) * R), new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a)));
      _ray.far = R * 2;
      const h = _ray.intersectObject(t, false)[0];
      if (h) ivy.push({ at: [h.point.x, h.point.y, h.point.z], s: [0.07, 0.05, 0.07], rot: [ctx.r() * 3, ctx.r() * 3, 0] });
    }
  }
  inst(root, new THREE.IcosahedronGeometry(1, 0), mat.leaf(ctx.autumn ? '#9a3a1e' : '#2f5a24'), ivy, 'ivy');
  const moss = new THREE.Color('#5f7a3a');
  eachMaterial(root, (m) => {
    if (SKIP.test(m.name) || m.name === 'leaf' || m.name === 'bloom') return;
    if (/stone|concrete|wood|bark|paint|brick|roof|gravel/.test(m.name)) m.color.lerp(moss, 0.18);
  });
}

function wornPass(root, ctx) {
  const grey = new THREE.Color('#8f8a80');
  eachMaterial(root, (m) => {
    if (SKIP.test(m.name) || m.name === 'leaf' || m.name === 'bloom' || m.name === 'lawn') return;
    m.color.lerp(grey, /wood/.test(m.name) ? 0.45 : 0.3);
    if (m.roughness != null) m.roughness = Math.min(1, m.roughness + 0.25);
    if (m.metalness) m.metalness *= 0.6;
    if (m.clearcoat) m.clearcoat = 0;
  });
  eachMaterial(root, (m) => { if (m.name === 'lawn') m.color.lerp(new THREE.Color('#9a8f58'), 0.5); });
  const res = upHits(root, rayTargets(root), ctx.r, 900);
  if (!res.hits) return;
  const dirt = new THREE.MeshStandardMaterial({ color: '#6a5640', roughness: 1, name: 'dirt' });
  const items = [];
  for (const { p, obj } of res.hits) {
    if (p.y > 0.3 || ctx.r() > 0.05 || obj.material?.name === 'water') continue;
    const s = 0.12 + ctx.r() * 0.3;
    items.push({ at: [p.x, p.y + 0.003, p.z], s: [s, 0.006, s * (0.6 + ctx.r() * 0.6)], rot: [0, ctx.r() * 3, 0] });
  }
  inst(root, new THREE.CylinderGeometry(1, 1, 1, 10), dirt, items, 'dirt');
  // litter: paper scraps and a can
  const paper = [];
  for (const { p } of res.hits) if (p.y < 0.3 && ctx.r() < 0.012) paper.push({ at: [p.x, p.y + 0.02, p.z], s: 0.025 + ctx.r() * 0.02, rot: [ctx.r() * 3, ctx.r() * 3, 0] });
  inst(root, new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#ece8dc', roughness: 0.9, name: 'litter' }), paper, 'litter');
}

/**
 * Split very large triangles (big slabs, roof faces, tall posts) so contact with the
 * small parts resting on them is measurable at surface level (test/floating.js samples
 * at most 64 points per triangle edge).
 */
function densify(root) {
  root.updateMatrixWorld(true);
  const whole = new THREE.Box3();
  root.traverse((o) => { if (o.isMesh && !isGlow(o)) whole.expandByObject(o); });
  const cell = Math.max(0.012, whole.getSize(new THREE.Vector3()).length() / 600);
  const maxEdge = cell * 40;
  const done = new Map();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const sc = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || isGlow(o)) return;
    for (let p = o; p; p = p.parent) if (p.userData?.imported) return;
    o.matrixWorld.decompose(a, new THREE.Quaternion(), sc);
    const lim = maxEdge / Math.max(sc.x, sc.y, sc.z);
    const g = o.geometry;
    const key = `${g.uuid}-${lim.toFixed(4)}`;
    if (done.has(key)) { o.geometry = done.get(key); return; }
    const pos = g.attributes.position;
    const idx = g.index;
    const n = idx ? idx.count : pos.count;
    let big = false;
    for (let i = 0; i < n && !big; i += 3) {
      a.fromBufferAttribute(pos, idx ? idx.getX(i) : i);
      b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1);
      c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2);
      if (a.distanceTo(b) > lim || b.distanceTo(c) > lim || c.distanceTo(a) > lim) big = true;
    }
    let out = g;
    if (big) {
      const src = g.clone();
      src.clearGroups();
      out = new TessellateModifier(lim, 12).modify(src);
    }
    done.set(key, out);
    o.geometry = out;
  });
}

/** Apply the season / condition and finalize. */
export function finishPlace(root, ctx, { type, variant, o, animations = [] }) {
  if (ctx.winter) snowPass(root, ctx);
  else if (ctx.autumn) leafLitterPass(root, ctx);
  if (ctx.cond === 'overgrown') overgrowPass(root, ctx);
  else if (ctx.cond === 'worn') wornPass(root, ctx);
  densify(root);
  return finalize(root, { type, variant, options: o, animations });
}
