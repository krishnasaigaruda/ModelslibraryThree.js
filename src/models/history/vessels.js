// Ancient vessels: amphorae / vases and everyday pottery. Hollow lathe bodies with
// vertex-painted decoration (black-figure, red-figure, glazes, slip) and wear.
import { THREE, M, mesh, group, roundedBox, curveTube, cushion, lathe, setup, done, instanced, noise3, rockGeo, pruneFloating } from './common.js';

/* ------------------------------ hollow lathe ------------------------------ */

/** Smooth resample of a [r,y] profile into n points (Catmull-Rom). */
function resample(profile, n) {
  const curve = new THREE.CatmullRomCurve3(profile.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
  return curve.getSpacedPoints(n).map((p) => [Math.max(0, p.x), p.y]);
}

/**
 * Hollow vessel from an outer profile (bottom centre → rim). Wall thickness t.
 * Returns { geo, rAt(y) (outer radius at height y), H }.
 */
export function vesselGeo(profile, t, { n = 64, seg = 48, phiStart = 0, phiLength = Math.PI * 2 } = {}) {
  const outer = resample(profile, n);
  const inner = [];
  for (let i = outer.length - 1; i >= 1; i--) {
    const [r, y] = outer[i];
    const [r0, y0] = outer[Math.max(0, i - 1)];
    const [r1, y1] = outer[Math.min(outer.length - 1, i + 1)];
    let nx = y1 - y0, ny = -(r1 - r0);
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    inner.push([Math.max(0.0005, r - nx * t), Math.max(t, y - ny * t)]);
  }
  const H = outer[outer.length - 1][1];
  inner.push([0, t]);
  // rounded rim: a few points bridging outer top and inner top
  const [rr, ry] = outer[outer.length - 1];
  const rim = [[rr - t * 0.15, ry + t * 0.35], [rr - t * 0.5, ry + t * 0.5], [rr - t * 0.85, ry + t * 0.35]];
  const pts = [...outer, ...rim, ...inner].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, seg, phiStart, phiLength);
  const rAt = (y) => {
    for (let i = 1; i < outer.length; i++) if (outer[i][1] >= y) { const [ra, ya] = outer[i - 1], [rb, yb] = outer[i]; return ra + ((rb - ra) * (y - ya)) / Math.max(1e-6, yb - ya); }
    return rr;
  };
  return { geo, rAt, H };
}

/* -------------------------------- painting -------------------------------- */

const CLAY = '#c2683a', BLACK = '#1b1714';

/** Vertex colours for a vessel. zones: { neck, shoulder, belly0, belly1, foot } heights (0..1 of H). */
function paintVessel(geo, T, H, zones, { base = CLAY, plain = false } = {}) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const clay = M.toColor(T.clay ?? base), black = M.toColor(BLACK), glaze = M.toColor(T.glaze ?? '#2f9aa0');
  const cream = M.toColor('#eadcb8'), brown = M.toColor('#5a3220'), moss = M.toColor('#6d7b5a'), crust = M.toColor('#9a917c');
  const c = new THREE.Color();
  const style = T.vase ?? (plain ? 'plain' : 'bands');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const v = y / H, a = Math.atan2(z, x), u = (a + Math.PI) / (Math.PI * 2);
    const r = Math.hypot(x, z);
    let figure = false;
    if (v > zones.belly0 && v < zones.belly1) {
      // stylised figures: rows of upright shapes with round heads and spread arms
      const k = (u * 6) % 1, fv = (v - zones.belly0) / (zones.belly1 - zones.belly0);
      const body = Math.abs(k - 0.5) < 0.08 + 0.05 * (1 - fv) && fv < 0.78;
      const head = Math.hypot((k - 0.5) * 2.2, (fv - 0.86) * 1.8) < 0.13;
      const arm = Math.abs(fv - 0.6) < 0.05 && Math.abs(k - 0.5) < 0.22;
      const shield = Math.hypot((k - 0.32) * 2.6, (fv - 0.45) * 1.6) < 0.16;
      figure = body || head || arm || shield;
    }
    const meander = v > zones.shoulder - 0.05 && v < zones.shoulder && ((Math.floor(u * 48) % 4 === 0) || Math.abs(v - zones.shoulder + 0.025) > 0.018);
    const tongue = v >= zones.shoulder && v < zones.neck && Math.sin(u * Math.PI * 64) > 0.2;
    const neck = v >= zones.neck, foot = v < zones.foot;
    switch (style) {
      case 'black-figure': c.copy(neck || foot || figure || meander || tongue ? black : clay); break;
      case 'red-figure': c.copy(figure || (meander && false) ? clay : neck && v > 0.97 ? clay : black); if (v > zones.shoulder - 0.05 && v < zones.shoulder && !meander) c.copy(clay); break;
      case 'glazed': c.copy(glaze).multiplyScalar(0.8 + 0.3 * v); if (foot) c.copy(clay); break;
      case 'burnished': c.copy(clay).multiplyScalar(0.9 + 0.2 * noise3(x * 30, y * 30, z * 30)); break;
      case 'slipware': c.copy(cream); if (Math.abs(Math.sin(u * Math.PI * 10 + v * 12) * 0.03 - ((v * 8) % 1 - 0.5) * 0.1) < 0.012 || foot) c.copy(brown); break;
      case 'painted': c.copy(clay); if (Math.floor(v * 14) % 3 === 0) c.set(['#1d3f8a', '#b8331f', '#e2b23c'][Math.floor(v * 14 / 3) % 3]); break;
      case 'plain': c.copy(clay); break;
      default: c.copy(clay); if (Math.abs(v - zones.shoulder) < 0.015 || Math.abs(v - zones.belly0) < 0.012 || (neck && v > 0.96)) c.copy(black);
    }
    // inside surface: plain clay (or glaze)
    if (r < 1e-4 || (y > 0 && false)) c.copy(clay);
    if (T.wear) {
      c.lerp(crust, T.wear * 0.35 * noise3(x * 25, y * 25, z * 25));
      if (T.barnacles) c.lerp(moss, 0.5 * Math.max(0, noise3(x * 12 + 5, y * 12, z * 12) - 0.3));
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

function vesselMat(T) {
  if (T.gild) return M.metal('#d6a93c', 0.22);
  if (T.metalVase === 'bronze') return M.metal(T.wear ? '#6f8f72' : '#a8703c', 0.32);
  if (T.metalVase === 'silver') return M.metal('#c9ccd2', 0.2);
  if (T.trim === 'marble') return new THREE.MeshPhysicalMaterial({ name: 'marble', color: '#f1eee8', roughness: 0.3, clearcoat: 0.6 });
  const gloss = T.vase === 'glazed' || T.vase === 'burnished' || T.vase === 'black-figure' || T.vase === 'red-figure';
  const m = new THREE.MeshPhysicalMaterial({ name: 'ceramic', vertexColors: true, color: 0xffffff, roughness: gloss ? 0.3 : 0.75, clearcoat: gloss ? 0.6 : 0, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
  return m;
}

/** Plain material for handles / lugs matching the painted body. */
function partMat(T, mat) {
  if (!mat.vertexColors) return mat;
  const c = T.vase === 'black-figure' || T.vase === 'red-figure' ? BLACK : T.vase === 'glazed' ? T.glaze ?? '#2f9aa0' : T.vase === 'slipware' ? '#eadcb8' : T.clay ?? CLAY;
  const col = M.toColor(c);
  if (T.wear) col.lerp(new THREE.Color('#9a917c'), T.wear * 0.2);
  return new THREE.MeshPhysicalMaterial({ name: 'ceramic', color: col, roughness: mat.roughness, clearcoat: mat.clearcoat, clearcoatRoughness: 0.3 });
}

/** Strap handle from (a) to (b) bulging outward. */
function handle(parent, mat, a, b, out, r, name = 'handle') {
  const mid = [(a[0] + b[0]) / 2 * (1 + out), Math.max(a[1], b[1]) + r * 2, (a[2] + b[2]) / 2 * (1 + out)];
  return curveTube([a, [a[0] * (1 + out * 0.9), a[1] + r * 1.5, a[2] * (1 + out * 0.9)], mid, b], r, mat, { parent, segments: 24, radialSegments: 8, name });
}

/** Broken rim + shards on the ground. */
function breakVessel(root, T, body, mat, H, R) {
  const g = body.geometry;
  const p = g.attributes.position;
  const cut = H * (0.55 + T.r() * 0.15);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x);
    const lim = cut + H * 0.18 * Math.max(0, Math.sin(a * 1.0 + 1)) + (noise3(Math.cos(a) * 4, Math.sin(a) * 4, 1) - 0.5) * H * 0.12;
    if (p.getY(i) > lim) p.setY(i, lim);
  }
  g.computeVertexNormals();
  g.computeBoundingBox();
  g.boundingSphere = null;
  root.children.filter((c) => c.name === 'spout' || c.name === 'lid').forEach((c) => c.removeFromParent());
  pruneFloating(root, 0.004);
  for (let k = 0; k < 6; k++) {
    const ph = T.r() * Math.PI * 2;
    const { geo } = vesselGeo([[R * 0.9, 0], [R, H * 0.08], [R * 0.95, H * 0.16]], Math.max(0.004, R * 0.06), { n: 6, seg: 5, phiStart: ph, phiLength: 0.6 + T.r() * 0.5 });
    if (geo.attributes.position) {
      const sz = 0.6 + T.r() * 0.6;
      geo.scale(sz, sz, sz);
      geo.computeBoundingBox();
      const c = geo.boundingBox.getCenter(new THREE.Vector3());
      geo.translate(-c.x, -c.y, -c.z);
      geo.rotateX(Math.PI / 2 * (0.7 + T.r() * 0.3));
      geo.computeBoundingBox();
      const a = T.r() * Math.PI * 2, d = R * (1.5 + T.r() * 1.2);
      const sh = mesh(geo, mat, { parent: root, at: [Math.cos(a) * d, -geo.boundingBox.min.y - 0.001, Math.sin(a) * d], rot: [0, T.r() * 6, 0], name: 'shard' });
      if (mat.vertexColors && !geo.attributes.color) paintVessel(geo, T, H, { neck: 0.8, shoulder: 0.6, belly0: 0.3, belly1: 0.55, foot: 0.05 });
      void sh;
    }
  }
}

/** Barnacles on the outside of a vessel (shipwreck trim). */
function barnacles(root, T, rAt, H, n, s, yOff = 0) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const y = H * (0.1 + T.r() * 0.75), a = T.r() * Math.PI * 2, r = rAt(y);
    const nrm = new THREE.Vector3(Math.cos(a), 0.25, Math.sin(a)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm);
    const e = new THREE.Euler().setFromQuaternion(q);
    const k = s * (0.5 + T.r());
    items.push({ p: [Math.cos(a) * (r - k * 0.2), y + yOff, Math.sin(a) * (r - k * 0.2)], r: [e.x, e.y, e.z], s: [k, k * 0.8, k] });
  }
  instanced(new THREE.CylinderGeometry(0.35, 1, 1, 7, 1, true).translate(0, 0.5, 0), (T.mats.barnacle ??= M.matte('#b9b2a2', 0.95)), items, root, 'barnacles');
}

/** Sand mound (buried trim). */
function sandMound(root, T, R, h) {
  const m = mesh(cushion(R * 3.4, h * 2, R * 3.0, { bulge: 0.6 }), T.mats.sand, { parent: root, at: [0, 0, 0], name: 'sand-mound' });
  m.userData.noSnow = true;
  return m;
}

/* -------------------------------- amphorae -------------------------------- */

const AMPHORA_VARIANTS = {
  transport: { H: 0.82, R: 0.17, prof: [[0.0, 0], [0.025, 0.0], [0.03, 0.06], [0.11, 0.25], [0.17, 0.48], [0.165, 0.58], [0.08, 0.66], [0.055, 0.72], [0.06, 0.82]], zones: { neck: 0.72, shoulder: 0.62, belly0: 0.3, belly1: 0.55, foot: 0.1 }, handles: 'neck' },
  neck: { H: 0.6, R: 0.17, prof: [[0, 0], [0.07, 0], [0.065, 0.03], [0.05, 0.06], [0.13, 0.2], [0.17, 0.34], [0.15, 0.44], [0.08, 0.5], [0.07, 0.56], [0.09, 0.6]], zones: { neck: 0.78, shoulder: 0.7, belly0: 0.32, belly1: 0.66, foot: 0.08 }, handles: 'neck' },
  hydria: { H: 0.5, R: 0.18, prof: [[0, 0], [0.08, 0], [0.075, 0.03], [0.06, 0.05], [0.15, 0.17], [0.18, 0.3], [0.16, 0.37], [0.09, 0.41], [0.065, 0.46], [0.1, 0.5]], zones: { neck: 0.8, shoulder: 0.66, belly0: 0.28, belly1: 0.62, foot: 0.08 }, handles: 'hydria' },
  krater: { H: 0.45, R: 0.24, prof: [[0, 0], [0.1, 0], [0.095, 0.03], [0.06, 0.06], [0.06, 0.09], [0.15, 0.15], [0.2, 0.28], [0.23, 0.4], [0.25, 0.45]], zones: { neck: 0.9, shoulder: 0.88, belly0: 0.42, belly1: 0.84, foot: 0.18 }, handles: 'low' },
  lekythos: { H: 0.38, R: 0.07, prof: [[0, 0], [0.04, 0], [0.038, 0.02], [0.03, 0.03], [0.06, 0.08], [0.07, 0.24], [0.06, 0.27], [0.02, 0.29], [0.016, 0.33], [0.03, 0.35], [0.028, 0.38]], zones: { neck: 0.76, shoulder: 0.66, belly0: 0.25, belly1: 0.62, foot: 0.08 }, handles: 'one' },
  oinochoe: { H: 0.3, R: 0.1, prof: [[0, 0], [0.055, 0], [0.05, 0.02], [0.08, 0.08], [0.1, 0.15], [0.085, 0.21], [0.045, 0.24], [0.042, 0.27], [0.06, 0.3]], zones: { neck: 0.78, shoulder: 0.68, belly0: 0.2, belly1: 0.62, foot: 0.06 }, handles: 'one' },
  kylix: { H: 0.11, R: 0.13, prof: [[0, 0], [0.05, 0], [0.045, 0.008], [0.012, 0.02], [0.012, 0.05], [0.06, 0.07], [0.11, 0.095], [0.125, 0.11]], zones: { neck: 0.95, shoulder: 0.93, belly0: 0.6, belly1: 0.9, foot: 0.1 }, handles: 'cup' },
  pithos: { H: 1.4, R: 0.5, prof: [[0, 0], [0.22, 0], [0.24, 0.05], [0.4, 0.3], [0.5, 0.7], [0.48, 1.0], [0.35, 1.25], [0.3, 1.32], [0.34, 1.4]], zones: { neck: 0.9, shoulder: 0.78, belly0: 0.4, belly1: 0.72, foot: 0.05 }, handles: 'lugs' },
};

export function createAmphora(options = {}) {
  const { variant, T, V } = setup(options, AMPHORA_VARIANTS, 'amphora');
  const root = group(`amphora-${variant}`);
  const { H, R, prof, zones } = V;
  const t = Math.max(0.005, R * 0.05);
  const { geo, rAt } = vesselGeo(prof, t, { n: 70, seg: 56 });
  const mat = vesselMat(T);
  if (mat.vertexColors) paintVessel(geo, T, H, zones, { plain: variant === 'transport' || variant === 'pithos' });
  const lift = variant === 'transport' ? 0.22 : 0;
  const body = mesh(geo, mat, { parent: root, at: [0, lift, 0], name: 'vessel' });
  const pm = partMat(T, mat);
  const hr = Math.max(0.006, R * 0.07);
  const hy = (v) => lift + H * v;
  const at = (v, a, k = 1) => { const r = rAt(H * v) * k; return [Math.cos(a) * r, hy(v), Math.sin(a) * r]; };
  if (V.handles === 'neck') for (const s of [0, Math.PI]) handle(root, pm, at(0.86, s, 0.92), at(0.66, s, 0.95), 0.9, hr);
  else if (V.handles === 'hydria') {
    for (const s of [Math.PI / 2, -Math.PI / 2]) curveTube([at(0.56, s - 0.35, 0.96), at(0.6, s, 1.25), at(0.56, s + 0.35, 0.96)], hr, pm, { parent: root, segments: 16, radialSegments: 8, name: 'handle' });
    handle(root, pm, at(0.9, Math.PI, 0.9), at(0.62, Math.PI, 0.95), 1.1, hr);
  } else if (V.handles === 'low') for (const s of [0, Math.PI]) curveTube([at(0.3, s - 0.3, 0.96), at(0.42, s, 1.2), at(0.5, s, 1.15), at(0.3, s + 0.3, 0.96)], hr, pm, { parent: root, segments: 16, radialSegments: 8, name: 'handle' });
  else if (V.handles === 'one') handle(root, pm, at(0.92, Math.PI, 0.85), at(0.66, Math.PI, 0.95), 1.4, hr);
  else if (V.handles === 'cup') for (const s of [0, Math.PI]) curveTube([at(0.72, s - 0.25, 0.97), at(0.82, s, 1.28), at(0.72, s + 0.25, 0.97)], hr * 0.8, pm, { parent: root, segments: 14, radialSegments: 6, name: 'handle' });
  else if (V.handles === 'lugs') {
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; mesh(new THREE.TorusGeometry(0.05, 0.018, 8, 16, Math.PI), pm, { parent: root, at: at(0.75, a, 0.98), rot: [0, -a + Math.PI / 2, 0], name: 'lug' }); }
    for (const v of [0.45, 0.6]) { const r = rAt(H * v); mesh(new THREE.TorusGeometry(r + 0.002, 0.012, 6, 56).rotateX(Math.PI / 2), pm, { parent: root, at: [0, hy(v), 0], name: 'rope-band' }); }
  }
  if (variant === 'transport') {
    // ring stand for the pointed toe
    const iron = T.mats.iron;
    mesh(new THREE.TorusGeometry(rAt(lift > 0 ? H * 0.18 : 0) + 0.012, 0.012, 6, 32).rotateX(Math.PI / 2), iron, { parent: root, at: [0, lift + H * 0.18, 0], name: 'stand-ring' });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, rr = rAt(H * 0.18) + 0.012;
      curveTube([[Math.cos(a) * rr, lift + H * 0.18, Math.sin(a) * rr], [Math.cos(a) * (rr + 0.06), lift * 0.5, Math.sin(a) * (rr + 0.06)], [Math.cos(a) * (rr + 0.1), 0.006, Math.sin(a) * (rr + 0.1)]], 0.01, iron, { parent: root, segments: 10, radialSegments: 6, name: 'stand-leg' });
    }
  }
  if (T.broken) {
    breakVessel(root, T, body, mat, H, R);
    // the shoulder lugs went with the broken-off top
    for (const l of [...root.children].filter((c) => c.name === 'lug')) l.removeFromParent();
  }
  // barnacles sit on the body, which is raised by `lift` on a stand
  if (T.barnacles) barnacles(root, T, rAt, H, Math.round(30 + R * 100), R * 0.12, lift);
  if (T.buried) {
    sandMound(root, T, R, H * 0.22);
  }
  return done(root, T);
}

/* --------------------------------- pottery --------------------------------- */

const POTTERY_VARIANTS = {
  bowl: { H: 0.09, R: 0.11, prof: [[0, 0], [0.04, 0], [0.038, 0.008], [0.07, 0.03], [0.1, 0.07], [0.115, 0.09]], zones: { neck: 0.95, shoulder: 0.9, belly0: 0.4, belly1: 0.85, foot: 0.12 } },
  jug: { H: 0.26, R: 0.09, prof: [[0, 0], [0.055, 0], [0.065, 0.04], [0.09, 0.11], [0.085, 0.17], [0.05, 0.21], [0.045, 0.24], [0.055, 0.26]], zones: { neck: 0.78, shoulder: 0.66, belly0: 0.25, belly1: 0.6, foot: 0.06 }, handle: true },
  'cooking-pot': { H: 0.2, R: 0.14, prof: [[0, 0], [0.05, 0], [0.11, 0.03], [0.14, 0.09], [0.13, 0.15], [0.1, 0.18], [0.11, 0.2]], zones: { neck: 0.88, shoulder: 0.75, belly0: 0.3, belly1: 0.7, foot: 0.05 }, lugs: true, lid: true },
  'storage-jar': { H: 0.42, R: 0.15, prof: [[0, 0], [0.07, 0], [0.075, 0.03], [0.13, 0.13], [0.15, 0.25], [0.13, 0.33], [0.08, 0.37], [0.075, 0.42]], zones: { neck: 0.86, shoulder: 0.74, belly0: 0.3, belly1: 0.68, foot: 0.06 }, lid: true },
  beaker: { H: 0.15, R: 0.05, prof: [[0, 0], [0.035, 0], [0.033, 0.01], [0.04, 0.05], [0.042, 0.1], [0.05, 0.15]], zones: { neck: 0.92, shoulder: 0.85, belly0: 0.3, belly1: 0.8, foot: 0.08 } },
  plate: { H: 0.035, R: 0.15, prof: [[0, 0], [0.06, 0], [0.058, 0.006], [0.12, 0.016], [0.15, 0.03], [0.155, 0.035]], zones: { neck: 0.98, shoulder: 0.95, belly0: 0.3, belly1: 0.9, foot: 0.2 } },
};

export function createPottery(options = {}) {
  const { variant, T, V } = setup(options, POTTERY_VARIANTS, 'ancient-pottery');
  const root = group(`ancient-pottery-${variant}`);
  const { H, R, prof, zones } = V;
  const t = Math.max(0.004, R * 0.05);
  const { geo, rAt } = vesselGeo(prof, t, { n: 50, seg: 48 });
  const mat = vesselMat(T);
  if (mat.vertexColors) paintVessel(geo, T, H, zones, { plain: !T.vase });
  const body = mesh(geo, mat, { parent: root, name: 'vessel' });
  const pm = partMat(T, mat);
  const hr = Math.max(0.005, R * 0.08);
  const at = (v, a, k = 1) => { const r = rAt(H * v) * k; return [Math.cos(a) * r, H * v, Math.sin(a) * r]; };
  if (V.handle) {
    handle(root, pm, at(0.9, Math.PI, 0.88), at(0.55, Math.PI, 0.96), 0.8, hr);
    // pinched spout
    mesh(new THREE.ConeGeometry(0.02, 0.04, 8, 1, true).rotateZ(Math.PI / 2 + 0.4), pm, { parent: root, at: [rAt(H) + 0.006, H - 0.006, 0], name: 'spout' });
  }
  if (V.lugs) for (const s of [0, Math.PI]) mesh(roundedBox(0.035, 0.018, 0.05, 0.007), pm, { parent: root, at: at(0.72, s, 1.03), rot: [0, -s, 0], name: 'lug' });
  if (V.lid && !T.broken) {
    const lr = rAt(H) + 0.004;
    const lid = mesh(lathe([[0, 0], [lr, 0], [lr * 0.95, 0.012], [lr * 0.5, 0.03], [0.012, 0.035], [0.016, 0.05], [0, 0.055]], 32), mat, { parent: root, at: [0, H - 0.002, 0], name: 'lid' });
    if (mat.vertexColors) paintVessel(lid.geometry, T, 0.06, { neck: 0.8, shoulder: 0.7, belly0: 2, belly1: 2, foot: 0 }, { plain: true });
  }
  if (variant === 'plate' || variant === 'bowl') {
    // fruit / bread in the dish so it reads as a dish
    const fill = variant === 'plate' ? 3 : 4;
    for (let i = 0; i < fill; i++) {
      const a = (i / fill) * Math.PI * 2;
      const rr = variant === 'plate' ? R * 0.35 : R * 0.3;
      mesh(new THREE.SphereGeometry(variant === 'plate' ? 0.025 : 0.028, 14, 10), (T.mats.fruit ??= M.matte(['#6b2a4a', '#8a9a2a', '#b5541a'][T.r() * 3 | 0], 0.5)), { parent: root, at: [Math.cos(a) * rr, t + (variant === 'plate' ? 0.025 : 0.028) - 0.002 + (variant === 'bowl' ? 0.004 : 0.002), Math.sin(a) * rr], name: 'fruit' });
    }
  }
  if (T.broken) breakVessel(root, T, body, mat, H, R);
  if (T.barnacles) barnacles(root, T, rAt, H, 22, R * 0.12);
  if (T.buried) sandMound(root, T, R, H * 0.3);
  if (T.coin === 'silver' && !mat.vertexColors) void 0;
  return done(root, T);
}

export { rockGeo };
