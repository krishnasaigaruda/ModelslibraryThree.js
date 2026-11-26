// Outdoor toys: kites (resting on the grass), tethered balloons, beach balls, sandbox toys, bubble wands.
import {
  THREE, M, mesh, group, roundedBox, lathe, hollowLathe, curveTube, extrudeOutline, tube, merged, toyMat, toyFactory, canvasTex,
  BLACK, WHITE, CHROME, clip, rotateTrack, moveTrack, spinTrack, scaleTrack, wave, pingPong,
} from './kit.js';

const hex = (c) => '#' + M.toColor(c).getHexString();
const sailMat = (c, i) => {
  const m = toyMat(c.T.kind === 'plush' ? 'plush' : c.T.kind === 'metal' ? 'soft' : c.T.kind, c.color(i));
  const k = `${m.uuid}-ds`;
  return (sailMat.cache[k] ??= Object.assign(m.clone(), { side: THREE.DoubleSide }));
};
sailMat.cache = {};

/** Kite line reel lying on the ground with line running to `to`. */
function reel(parent, c, at, to) {
  const g = group('reel', { parent, at });
  const rm = toyMat('rawwood', 'pine');
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.008, 24), toyMat('plastic', c.color(1)), { parent: g, at: [0, 0.004 + (s > 0 ? 0.042 : 0), 0] });
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.034, 24), toyMat('soft', '#f2efe6'), { parent: g, at: [0, 0.025, 0] });
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 10), rm, { parent: g, at: [0.0, 0.035, 0] });
  const p0 = [at[0] + 0.03, 0.025, at[2]];
  curveTube([p0, [(p0[0] + to[0]) / 2, 0.004, (p0[2] + to[2]) / 2 + 0.05], to], 0.0008, toyMat('soft', '#f2efe6'), { parent, segments: 30, radialSegments: 4 });
}

/** Ribbon tail along the ground from `from`, with bows. */
function tail(parent, c, from, len, { bows = 6, wide = 0.026, dir = 1 } = {}) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([from[0] + Math.sin(t * Math.PI * 2.2) * 0.12, 0.003, from[2] + dir * t * len]); }
  curveTube(pts, 0.0012, toyMat('soft', '#f2efe6'), { parent, segments: 60, radialSegments: 4 });
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  for (let i = 1; i <= bows; i++) {
    const p = curve.getPoint(i / (bows + 0.5));
    for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(wide, wide * 2.4, 3).rotateZ(s * Math.PI / 2).scale(1, 1, 0.25).rotateX(-Math.PI / 2), sailMat(c, i % 4), { parent, at: [p.x + s * wide * 1.1, 0.004, p.z] });
  }
}

/* ============================== KITES ============================== */
export const KITE_VARIANTS = { diamond: {}, delta: {}, 'box-kite': {}, sled: {}, 'dragon-tail': {}, bird: {} };

export const createKite = toyFactory('kite', KITE_VARIANTS, (c) => {
  const { root, variant, T } = c;
  const spar = T.style === 'luxe' || T.kind === 'metal' ? CHROME : toyMat('rawwood', 'pine');
  const y = 0.006;
  const k = group('kite', { parent: root, rot: [0, 0.3, 0] });
  const flatShape = (pts) => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
  let tailFrom = [0, 0, 0.45];
  let bridle = [0, y, 0.1];
  if (variant === 'diamond' || variant === 'dragon-tail') {
    const W = 0.36;
    const L = 0.9;
    const top = -0.3;
    const pts = [[0, top], [W, top + L * 0.3], [0, top + L], [-W, top + L * 0.3]];
    // four coloured panels
    const ctr = [0, top + L * 0.3];
    for (let i = 0; i < 4; i++) mesh(flatShape([ctr, pts[i], pts[(i + 1) % 4]]), sailMat(c, i), { parent: k, at: [0, y, 0] });
    tube([0, y + 0.004, top], [0, y + 0.004, top + L], 0.004, spar, { parent: k });
    tube([-W, y + 0.004, top + L * 0.3], [W, y + 0.004, top + L * 0.3], 0.004, spar, { parent: k });
    curveTube(pts.concat([pts[0]]).map(([x, z]) => [x, y + 0.001, z]), 0.0012, toyMat('soft', '#f2efe6'), { parent: k, segments: 60, radialSegments: 4, closed: false });
    tailFrom = [0, 0, top + L];
    if (variant === 'dragon-tail') {
      // long fat streamer tail
      const pts2 = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts2.push([Math.sin(t * Math.PI * 3) * 0.18, 0.006, top + L + t * 1.6]); }
      const curve = new THREE.CatmullRomCurve3(pts2.map((p) => new THREE.Vector3(...p)));
      const geo = new THREE.TubeGeometry(curve, 80, 0.04, 8, false);
      geo.scale(1, 0.12, 1);
      mesh(geo, sailMat(c, 1), { parent: k });
      // dragon face on the sail
      for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(0.04, 20).rotateX(-Math.PI / 2), WHITE, { parent: k, at: [s * 0.1, y + 0.002, top + 0.2] });
      for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(0.02, 16).rotateX(-Math.PI / 2), BLACK, { parent: k, at: [s * 0.1, y + 0.003, top + 0.2] });
      tailFrom = null;
    }
    bridle = [0, y, top + L * 0.3];
  } else if (variant === 'delta') {
    const W = 0.6;
    const L = 0.55;
    const pts = [[0, -0.25], [W, -0.25 + L], [0, -0.25 + L * 0.82], [-W, -0.25 + L]];
    mesh(flatShape([pts[0], pts[1], pts[2]]), sailMat(c, 0), { parent: k, at: [0, y, 0] });
    mesh(flatShape([pts[0], pts[2], pts[3]]), sailMat(c, 1), { parent: k, at: [0, y, 0] });
    for (const s of [-1, 1]) tube([0, y + 0.004, -0.25], [s * W, y + 0.004, -0.25 + L], 0.004, spar, { parent: k });
    tube([-W * 0.55, y + 0.009, 0.1], [W * 0.55, y + 0.009, 0.1], 0.0035, spar, { parent: k });
    tube([0, y + 0.004, -0.25], [0, y + 0.004, -0.25 + L * 0.82], 0.004, spar, { parent: k });
    // keel lying flat
    mesh(flatShape([[0, -0.1], [0.12, 0.05], [0, 0.2]]), sailMat(c, 2), { parent: k, at: [0, y + 0.002, 0] });
    tailFrom = [0, 0, -0.25 + L * 0.82];
    bridle = [0.12, y, 0.05];
  } else if (variant === 'box-kite') {
    // two square cells on four spars, lying on its side on the grass
    const s = 0.2;
    const len = 0.8;
    const bx = group('box', { parent: k, at: [0, s * 0.7071, 0], rot: [0, 0, Math.PI / 4] });
    const corners = [[s / 2, s / 2], [-s / 2, s / 2], [-s / 2, -s / 2], [s / 2, -s / 2]];
    for (const [x, yy] of corners) tube([x, yy, -len / 2], [x, yy, len / 2], 0.004, spar, { parent: bx });
    for (const zc of [-len / 2 + 0.12, len / 2 - 0.12]) for (let i = 0; i < 4; i++) {
      const [x1, y1] = corners[i];
      const [x2, y2] = corners[(i + 1) % 4];
      const g = y1 === y2 ? new THREE.PlaneGeometry(s, 0.22).rotateX(Math.PI / 2) : new THREE.PlaneGeometry(0.22, s).rotateY(Math.PI / 2);
      mesh(g, sailMat(c, (i + (zc > 0 ? 1 : 0)) % 4), { parent: bx, at: [(x1 + x2) / 2, (y1 + y2) / 2, zc] });
    }
    // cross struts
    for (const zc of [-len / 2 + 0.12, len / 2 - 0.12]) { tube([s / 2, s / 2, zc], [-s / 2, -s / 2, zc], 0.003, spar, { parent: bx }); tube([-s / 2, s / 2, zc], [s / 2, -s / 2, zc], 0.003, spar, { parent: bx }); }
    tailFrom = null;
    bridle = [0, 0.004, -len / 2];
  } else if (variant === 'sled') {
    const W = 0.32;
    const L = 0.6;
    const pts = [[-W * 0.6, -L / 2], [W * 0.6, -L / 2], [W, -L * 0.05], [W * 0.6, L / 2], [-W * 0.6, L / 2], [-W, -L * 0.05]];
    mesh(flatShape(pts), sailMat(c, 0), { parent: k, at: [0, y, 0] });
    for (const s of [-1, 1]) tube([s * W * 0.6, y + 0.004, -L / 2], [s * W * 0.6, y + 0.004, L / 2], 0.004, spar, { parent: k });
    mesh(flatShape([[-0.08, 0.05], [0.08, 0.05], [0.06, 0.16], [-0.06, 0.16]]), sailMat(c, 5), { parent: k, at: [0, y + 0.001, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(0.05, 20).rotateX(-Math.PI / 2), sailMat(c, 2), { parent: k, at: [s * 0.12, y + 0.001, -0.12] });
    tailFrom = [0, 0, L / 2];
    bridle = [W, y, -L * 0.05];
  } else {
    // bird kite: swept wings + body
    const wing = (s) => [[0, -0.12], [s * 0.35, -0.2], [s * 0.6, -0.08], [s * 0.45, 0.02], [s * 0.15, 0.06], [0, 0.04]];
    for (const s of [-1, 1]) mesh(flatShape(wing(s)), sailMat(c, s > 0 ? 0 : 1), { parent: k, at: [0, y, 0] });
    mesh(flatShape([[0, -0.25], [0.04, -0.15], [0.03, 0.3], [0.12, 0.42], [-0.12, 0.42], [-0.03, 0.3], [-0.04, -0.15]]), sailMat(c, 2), { parent: k, at: [0, y + 0.001, 0] });
    tube([-0.55, y + 0.004, -0.1], [0.55, y + 0.004, -0.1], 0.0035, spar, { parent: k });
    tube([0, y + 0.004, -0.25], [0, y + 0.004, 0.35], 0.004, spar, { parent: k });
    for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(0.012, 12).rotateX(-Math.PI / 2), BLACK, { parent: k, at: [s * 0.018, y + 0.003, -0.2] });
    tailFrom = null;
    bridle = [0, y, -0.05];
  }
  if (tailFrom) tail(k, c, tailFrom, 0.8);
  // flying line from the bridle to the reel lying on the grass
  k.updateMatrix();
  const bw = new THREE.Vector3(...bridle).applyMatrix4(k.matrix);
  reel(root, c, [0.75, 0, 0.35], [bw.x, bw.y, bw.z]);
  c.anims.push(clip('flutter', 2, [rotateTrack(k, 'x', 2, (u) => wave(u, 2) * 0.012)]));
}, { base: 'classic' });

/* ============================== BALLOONS ============================== */
export const BALLOON_VARIANTS = { single: { n: 1 }, bunch: { n: 5 }, 'heart-foils': { n: 3, shape: 'heart' }, 'star-foils': { n: 3, shape: 'star' }, 'party-cluster': { n: 9 } };

function heartShape(s) {
  const h = new THREE.Shape();
  h.moveTo(0, -s);
  h.bezierCurveTo(s * 0.9, -s * 0.35, s * 1.2, s * 0.35, s * 0.55, s * 0.68);
  h.bezierCurveTo(s * 0.25, s * 0.85, 0, s * 0.6, 0, s * 0.42);
  h.bezierCurveTo(0, s * 0.6, -s * 0.25, s * 0.85, -s * 0.55, s * 0.68);
  h.bezierCurveTo(-s * 1.2, s * 0.35, -s * 0.9, -s * 0.35, 0, -s);
  return h;
}
function starShape(s) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? s * 0.45 : s; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  return new THREE.Shape(pts);
}

export const createBalloons = toyFactory('balloons', BALLOON_VARIANTS, (c) => {
  const { root, v, T, r } = c;
  const strM = toyMat('soft', '#f4f2ec');
  // weight on the ground (soft fabric bag or a foil-wrapped weight)
  const wt = group('weight', { parent: root });
  const wy = 0.06;
  if (T.kind === 'metal' || T.kind === 'chrome' || T.kind === 'gold') mesh(lathe([[0, 0], [0.035, 0], [0.04, 0.02], [0.03, 0.05], [0.012, wy], [0, wy]], 24), toyMat('chrome', T.pal[0]), { parent: wt });
  else {
    mesh(lathe([[0, 0], [0.032, 0.002], [0.04, 0.025], [0.03, 0.045], [0.01, 0.055], [0.014, wy], [0, wy]], 24), toyMat('plush', c.color(5) === '#222222' ? '#c03030' : c.color(1)), { parent: wt });
  }
  const sway = group('sway', { parent: root, at: [0, wy - 0.004, 0] });
  const n = v.n;
  const H = 0.95;
  const balloonMat = (i) => {
    const col = c.color(i % 4);
    if (v.shape) return toyMat(T.kind === 'plush' ? 'plush' : 'chrome', col);
    return toyMat(T.kind === 'plush' ? 'plush' : T.kind === 'clear' ? 'clear' : 'soft', col);
  };
  const R = 0.13;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.4;
    const spread = n === 1 ? 0 : n > 5 ? (i % 3 === 0 ? 0.06 : 0.22) : 0.17;
    const top = [Math.cos(a) * spread, H + (n > 1 ? (r() - 0.5) * 0.2 : 0) + (i % 3 === 0 && n > 5 ? 0.18 : 0), Math.sin(a) * spread];
    const bg = group(`balloon_${i}`, { parent: sway, at: top, rot: [Math.sin(a) * spread * 0.9, 0, -Math.cos(a) * spread * 0.9] });
    const mat = balloonMat(i);
    let knotY = 0;
    if (v.shape) {
      const geo = extrudeOutline(v.shape === 'heart' ? heartShape(0.18) : starShape(0.2), 0.03, { bevel: 0.03, segments: 4 });
      geo.computeBoundingBox();
      const b = geo.boundingBox;
      geo.translate(0, v.shape === 'heart' ? -b.min.y : 0.2 * 0.45 + 0.025, 0);
      mesh(geo, mat, { parent: bg, at: [0, 0.012, 0] });
      knotY = 0.012;
      mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.02, 10), mat, { parent: bg, at: [0, 0.006, 0] });
    } else {
      const rr = n > 5 ? R * 0.8 : R;
      const prof = [];
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        const ang = -Math.PI / 2 + t * Math.PI;
        const rad = Math.cos(ang) * rr * (1 - 0.18 * (1 - t) ** 2);
        prof.push([Math.max(0.0001, rad), rr * 1.15 + Math.sin(ang) * rr * 1.15 - (1 - t) ** 3 * rr * 0.25]);
      }
      prof[0] = [0.006, 0];
      mesh(lathe(prof, 32), mat, { parent: bg, at: [0, 0.012, 0] });
      mesh(new THREE.ConeGeometry(0.01, 0.014, 12).rotateX(Math.PI), mat, { parent: bg, at: [0, 0.007, 0] });
      knotY = 0;
    }
    // string from the weight's top up to the knot (in sway space)
    const knot = new THREE.Vector3(0, knotY, 0).applyEuler(bg.rotation).add(bg.position);
    curveTube([[0, 0, 0], [knot.x * 0.3 + 0.01, knot.y * 0.35, knot.z * 0.3], [knot.x * 0.75, knot.y * 0.72, knot.z * 0.75 - 0.01], [knot.x, knot.y, knot.z]], 0.0009, strM, { parent: sway, segments: 40, radialSegments: 4 });
  }
  // curly ribbon ends around the weight
  for (let i = 0; i < 3; i++) {
    const pts = [];
    for (let k = 0; k <= 30; k++) { const t = k / 30; const a = t * Math.PI * 6 + i * 2; pts.push([Math.cos(i * 2.1) * (0.04 + t * 0.03) + Math.cos(a) * 0.008, wy - t * (wy - 0.003), Math.sin(i * 2.1) * (0.04 + t * 0.03) + Math.sin(a) * 0.008]); }
    curveTube(pts, 0.0012, toyMat('soft', c.color(i)), { parent: root, segments: 60, radialSegments: 4 });
  }
  c.anims.push(clip('sway', 4, [rotateTrack(sway, 'z', 4, (u) => wave(u) * 0.08), rotateTrack(sway, 'x', 4, (u) => wave(u + 0.25) * 0.05)]));
}, { base: 'classic' });

/* ============================== BEACH BALLS ============================== */
export const BEACH_BALL_VARIANTS = { 'six-panel': { kind: 'gores' }, banded: { kind: 'bands' }, spotted: { kind: 'spots' } };

export const createBeachBall = toyFactory('beach-ball', BEACH_BALL_VARIANTS, (c) => {
  const { root, v, T } = c;
  const R = 0.2; // 40 cm inflated
  const ball = group('ball', { parent: root, at: [0, R * 0.98, 0] });
  const inner = group('ball_spin', { parent: ball });
  const kind = T.kind === 'plush' ? 'plush' : T.kind === 'clear' ? 'clear' : 'soft';
  const mats = [0, 1, 2, 3, 4, 5].map((i) => toyMat(kind, i === 4 && v.kind === 'gores' ? '#ffffff' : c.color(i)));
  if (v.kind === 'gores') {
    for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(R, 12, 24, (i / 6) * Math.PI * 2, Math.PI / 3, 0.18, Math.PI - 0.36), mats[i === 4 ? 5 : i], { parent: inner });
  } else if (v.kind === 'bands') {
    const bands = 7;
    for (let i = 0; i < bands; i++) {
      const a0 = 0.18 + (i / bands) * (Math.PI - 0.36);
      mesh(new THREE.SphereGeometry(R, 48, 4, 0, Math.PI * 2, a0, (Math.PI - 0.36) / bands), mats[i % 2 ? 4 : (i / 2) % 4], { parent: inner });
    }
  } else {
    mesh(new THREE.SphereGeometry(R, 48, 32, 0, Math.PI * 2, 0.18, Math.PI - 0.36), mats[4], { parent: inner });
    const geos = [0, 1, 2, 3].map(() => []);
    const ico = new THREE.IcosahedronGeometry(1, 1);
    const p = ico.attributes.position;
    const seen = new Set();
    let n = 0;
    for (let i = 0; i < p.count; i++) {
      const d = new THREE.Vector3().fromBufferAttribute(p, i).normalize();
      const key = d.toArray().map((x) => x.toFixed(2)).join();
      if (seen.has(key) || Math.abs(d.y) > 0.9) continue;
      seen.add(key);
      const g = new THREE.CircleGeometry(R * 0.16, 20);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d));
      g.translate(d.x * R * 1.003, d.y * R * 1.003, d.z * R * 1.003);
      geos[n++ % 4].push(g);
    }
    geos.forEach((list, i) => merged(list, mats[i], { parent: inner }));
  }
  // pole caps + valve
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(R * 1.002, 24, 6, 0, Math.PI * 2, s > 0 ? 0 : Math.PI - 0.185, 0.185), mats[s > 0 ? 4 : 5], { parent: inner });
  mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.014, 12).rotateZ(Math.PI / 2), mats[4], { parent: inner, at: [R * 0.99, 0.02, 0], rot: [0, 0, 0.1] });
  const P = 1.2;
  c.anims.push(clip('bounce', P, [
    moveTrack(ball, P, (u) => [0, Math.abs(Math.sin(u * Math.PI)) * 0.5, 0]),
    scaleTrack(ball, P, (u) => { const sq = Math.max(0, 1 - Math.abs(Math.sin(u * Math.PI)) * 12) * 0.12; return [1 + sq * 0.5, 1 - sq, 1 + sq * 0.5]; }),
  ]));
  c.anims.push(clip('roll', 2, [spinTrack(inner, 'z', 2, -1), moveTrack(ball, 2, (u) => [Math.sin(u * Math.PI * 2) * 0.0, 0, 0])]));
}, { base: 'classic' });

/* ============================== SANDBOX TOYS ============================== */
export const SANDBOX_VARIANTS = { 'bucket-spade': {}, 'mould-set': {}, 'castle-kit': {}, 'sieve-rake': {}, 'watering-can': {} };

function bucket(parent, c, at, { R = 0.085, H = 0.16, i = 0, name } = {}) {
  const g = group(name ?? null, { parent, at });
  const m = c.m(i);
  mesh(hollowLathe(R * 0.8, R, H, 0.0035, 36), m, { parent: g });
  // rim bead + side lugs + wire handle
  mesh(new THREE.TorusGeometry(R, 0.004, 8, 36).rotateX(Math.PI / 2), m, { parent: g, at: [0, H, 0] });
  for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.018, 0.016, 0.004), m, { parent: g, at: [s * R * 0.99, H - 0.015, 0] });
  const hm = c.m(i + 1);
  const pts = [];
  for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI; pts.push([Math.cos(a) * R * 1.02, H - 0.015 + Math.sin(a) * R * 0.85, 0]); }
  const handle = group(name ? `${name}_handle` : null, { parent: g, at: [0, 0, 0] });
  curveTube(pts, 0.003, hm, { parent: handle, segments: 32, radialSegments: 6 });
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 12).rotateZ(Math.PI / 2), hm, { parent: handle, at: [0, H - 0.015 + R * 0.85, 0] });
  return g;
}
function spade(parent, c, at, rotY = 0, i = 2) {
  const g = group(null, { parent, at, rot: [0, rotY, 0] });
  const m = c.m(i);
  // spade lying on the sand: blade + shaft + T-grip
  const blade = extrudeOutline([[-0.045, 0], [0.045, 0], [0.05, 0.07], [0.035, 0.1], [0, 0.11], [-0.035, 0.1], [-0.05, 0.07]], 0.006, { bevel: 0.002, segments: 2 }).rotateX(-Math.PI / 2);
  blade.rotateY(Math.PI);
  mesh(blade, m, { parent: g, at: [0, 0.005, 0.0] });
  tube([0, 0.008, 0.0], [0, 0.012, -0.24], 0.008, m, { parent: g });
  tube([-0.04, 0.012, -0.245], [0.04, 0.012, -0.245], 0.009, c.m(i + 1), { parent: g });
  return g;
}
function shapeMould(parent, c, shape, at, i, s = 0.06, h = 0.04) {
  const g = group(null, { parent, at });
  const outer = shape(s);
  const hole = shape(s * 0.85);
  const sh = new THREE.Shape(outer.getPoints(24));
  sh.holes.push(new THREE.Path(hole.getPoints(24).reverse()));
  mesh(new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 12 }).rotateX(-Math.PI / 2), c.m(i), { parent: g });
  mesh(new THREE.ExtrudeGeometry(new THREE.Shape(outer.getPoints(24)), { depth: 0.004, bevelEnabled: false }).rotateX(-Math.PI / 2), c.m(i), { parent: g });
  return g;
}
const circleShape = (s) => { const p = new THREE.Shape(); p.absarc(0, 0, s, 0, Math.PI * 2, false); return p; };
const fishShape = (s) => new THREE.Shape([[-s, 0], [-s * 0.4, s * 0.5], [s * 0.5, s * 0.35], [s * 0.85, s * 0.6], [s * 0.75, 0], [s * 0.85, -s * 0.6], [s * 0.5, -s * 0.35], [-s * 0.4, -s * 0.5]].map(([x, y]) => new THREE.Vector2(x, y)));
const shellShape = (s) => { const p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); const r = s * (0.85 + 0.15 * Math.abs(Math.sin(a * 6))); p.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r - s * 0.3)); } p.push(new THREE.Vector2(s * 0.2, -s * 0.5), new THREE.Vector2(-s * 0.2, -s * 0.5)); return new THREE.Shape(p); };

export const createSandboxToys = toyFactory('sandbox-toys', SANDBOX_VARIANTS, (c) => {
  const { root, variant, T } = c;
  // sand patch
  const sand = toyMat('soft', '#e6cf9a');
  sand.roughness = 0.95;
  mesh(lathe([[0, 0.012], [0.3, 0.01], [0.42, 0.004], [0.45, 0]], 40), sand, { parent: root });
  const y0 = 0.006;
  if (variant === 'bucket-spade') {
    const b = bucket(root, c, [-0.08, y0, 0], { i: 0, name: 'bucket' });
    spade(root, c, [0.14, y0, 0.12], 0.8);
    c.anims.push(clip('swing', 2, [rotateTrack(b.getObjectByName('bucket_handle'), 'z', 2, (u) => wave(u) * 0.6)]));
  } else if (variant === 'mould-set') {
    const star = (s) => starShape(s);
    shapeMould(root, c, star, [-0.15, y0, 0], 0);
    shapeMould(root, c, fishShape, [0.0, y0, -0.12], 1);
    shapeMould(root, c, shellShape, [0.13, y0, 0.02], 2);
    shapeMould(root, c, circleShape, [0.0, y0, 0.14], 3, 0.05);
    // a sand star already turned out
    mesh(extrudeOutline(starShape(0.055), 0.035, { bevel: 0.006, segments: 2 }).rotateX(-Math.PI / 2), sand, { parent: root, at: [-0.2, y0 + 0.0, 0.2] });
  } else if (variant === 'castle-kit') {
    // turret bucket upside-down with sand castle beside, flag, small bucket, spade
    const castle = group('castle', { parent: root, at: [0, y0, 0] });
    for (const [x, z, h] of [[-0.08, -0.06, 0.12], [0.08, -0.06, 0.12], [0, 0.06, 0.16]]) {
      mesh(lathe([[0, 0], [0.06, 0], [0.05, h], [0, h]], 24), sand, { parent: castle, at: [x, 0, z] });
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; mesh(roundedBox(0.016, 0.018, 0.016, 0.004), sand, { parent: castle, at: [x + Math.cos(a) * 0.042, h + 0.008, z + Math.sin(a) * 0.042] }); }
    }
    mesh(roundedBox(0.16, 0.06, 0.03, 0.01), sand, { parent: castle, at: [0, 0.03, -0.06] });
    tube([0, 0.16, 0.06], [0, 0.26, 0.06], 0.0025, toyMat('rawwood', 'pine'), { parent: castle });
    const flag = group('flag', { parent: castle, at: [0, 0.245, 0.06] });
    mesh(new THREE.PlaneGeometry(0.06, 0.035).translate(0.03, 0, 0), Object.assign(c.m(0).clone(), { side: THREE.DoubleSide }), { parent: flag });
    c.anims.push(clip('flag', 1, [rotateTrack(flag, 'y', 1, (u) => wave(u) * 0.35)]));
    bucket(root, c, [0.22, y0, 0.1], { R: 0.06, H: 0.11, i: 1 });
    spade(root, c, [-0.2, y0, 0.15], -0.6, 3);
  } else if (variant === 'sieve-rake') {
    // sieve: hollow ring with a grid floor
    const s = group('sieve', { parent: root, at: [-0.08, y0, 0] });
    mesh(hollowLathe(0.1, 0.11, 0.05, 0.004, 40), c.m(0), { parent: s });
    const grid = [];
    for (let k = -4; k <= 4; k++) { grid.push(new THREE.BoxGeometry(0.19, 0.003, 0.004).translate(0, 0.0015, k * 0.02)); grid.push(new THREE.BoxGeometry(0.004, 0.003, 0.19).translate(k * 0.02, 0.0015, 0)); }
    merged(grid, c.m(0), { parent: s });
    // rake lying flat
    const rk = group(null, { parent: root, at: [0.16, y0, 0.05], rot: [0, 0.5, 0] });
    mesh(roundedBox(0.14, 0.012, 0.02, 0.005), c.m(1), { parent: rk, at: [0, 0.008, 0] });
    for (let k = 0; k < 7; k++) mesh(roundedBox(0.008, 0.006, 0.03, 0.002), c.m(1), { parent: rk, at: [-0.06 + k * 0.02, 0.004, 0.024] });
    tube([0, 0.01, -0.01], [0, 0.012, -0.24], 0.008, c.m(1), { parent: rk });
    mesh(new THREE.SphereGeometry(0.012, 10, 8), c.m(2), { parent: rk, at: [0, 0.012, -0.245] });
  } else {
    // watering can: hollow body, spout with rose, handle
    const cg = group('can', { parent: root, at: [0, y0, 0] });
    mesh(hollowLathe(0.075, 0.065, 0.15, 0.003, 36), c.m(0), { parent: cg });
    mesh(new THREE.TorusGeometry(0.065, 0.004, 8, 36).rotateX(Math.PI / 2), c.m(0), { parent: cg, at: [0, 0.15, 0] });
    tube([0.06, 0.03, 0], [0.19, 0.16, 0], 0.01, c.m(0), { parent: cg });
    mesh(lathe([[0.008, 0], [0.025, 0.02], [0.026, 0.025], [0, 0.026]], 20).rotateZ(-Math.PI / 4), c.m(1), { parent: cg, at: [0.19, 0.16, 0] });
    curveTube([[-0.068, 0.04, 0], [-0.12, 0.08, 0], [-0.11, 0.17, 0], [-0.03, 0.19, 0], [0.0, 0.15, 0]], 0.008, c.m(1), { parent: cg, segments: 30 });
    spade(root, c, [-0.18, y0, 0.15], 2.4, 2);
    c.anims.push(clip('pour', 3, [rotateTrack(cg, 'z', 3, (u) => -pingPong(u) * 0.5)]));
  }
}, { base: 'classic' });

/* ============================== BUBBLE WANDS ============================== */
export const BUBBLE_VARIANTS = { 'bottle-wand': {}, 'giant-wand': {}, 'multi-ring': {} };

export const createBubbleWand = toyFactory('bubble-wand', BUBBLE_VARIANTS, (c) => {
  const { root, variant, T, r } = c;
  const film = new THREE.MeshPhysicalMaterial({ name: 'bubble', color: '#ffffff', transparent: true, opacity: 0.22, roughness: 0, transmission: 0.9, iridescence: 1, iridescenceIOR: 1.3, side: THREE.DoubleSide, depthWrite: false });
  const bubbles = group('bubbles', { parent: root });
  bubbles.userData.detached = true; // free-floating soap bubbles drift in the air by design
  let wandTop = [0, 0.2, 0];
  if (variant === 'bottle-wand') {
    // bottle (hollow) + cap on the ground + wand standing in it
    const bottle = group('bottle', { parent: root });
    mesh(lathe([[0, 0], [0.025, 0], [0.027, 0.004], [0.027, 0.09], [0.02, 0.105], [0.014, 0.11], [0.014, 0.125], [0.0115, 0.125], [0.0115, 0.112], [0.024, 0.095], [0.024, 0.004], [0, 0.003]], 32), toyMat('clear', c.color(1)), { parent: bottle });
    mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.06, 24), new THREE.MeshPhysicalMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.5, roughness: 0.05 }), { parent: bottle, at: [0, 0.033, 0] });
    mesh(hollowLathe(0.016, 0.016, 0.018, 0.002, 24), c.m(0), { parent: root, at: [0.06, 0, 0.02] });
    const wand = group('wand', { parent: root, at: [0, 0.003, 0], rot: [0, 0, -0.08] });
    tube([0, 0, 0], [0, 0.2, 0], 0.0025, c.m(0), { parent: wand });
    mesh(new THREE.TorusGeometry(0.02, 0.0025, 8, 24), c.m(0), { parent: wand, at: [0, 0.222, 0] });
    mesh(new THREE.CircleGeometry(0.02, 24), film, { parent: wand, at: [0, 0.222, 0] });
    wandTop = [0.018, 0.24, 0];
  } else if (variant === 'giant-wand') {
    // tray (hollow) with soap + big rope loop wand resting across it
    const tray = group('tray', { parent: root });
    mesh(roundedBox(0.5, 0.008, 0.5, 0.004), c.m(0), { parent: tray, at: [0, 0.004, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(0.5, 0.05, 0.01, 0.004), c.m(0), { parent: tray, at: [0, 0.025, s * 0.245] });
    for (const s of [-1, 1]) mesh(roundedBox(0.01, 0.05, 0.48, 0.004), c.m(0), { parent: tray, at: [s * 0.245, 0.025, 0] });
    mesh(new THREE.BoxGeometry(0.48, 0.002, 0.48), new THREE.MeshPhysicalMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.55, roughness: 0.02 }), { parent: tray, at: [0, 0.03, 0] });
    const w = group('wand', { parent: root, at: [0, 0.05, 0] });
    tube([-0.3, 0, -0.15], [0.3, 0, -0.15], 0.012, toyMat('rawwood', 'pine'), { parent: w });
    tube([-0.3, 0, 0.15], [0.3, 0, 0.15], 0.012, toyMat('rawwood', 'pine'), { parent: w });
    curveTube([[0.2, -0.01, -0.15], [0.12, -0.02, 0], [0.2, -0.01, 0.15]], 0.004, toyMat('soft', c.color(2)), { parent: w, segments: 20 });
    curveTube([[-0.2, -0.01, -0.15], [-0.12, -0.02, 0], [-0.2, -0.01, 0.15]], 0.004, toyMat('soft', c.color(2)), { parent: w, segments: 20 });
    wandTop = [0, 0.3, 0];
  } else {
    // multi-ring wand lying in a shallow dish
    mesh(hollowLathe(0.1, 0.12, 0.025, 0.004, 40), c.m(1), { parent: root });
    mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.002, 40), new THREE.MeshPhysicalMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.55, roughness: 0.02 }), { parent: root, at: [0, 0.015, 0] });
    const w = group('wand', { parent: root, at: [0, 0.03, 0], rot: [0, 0.3, 0] });
    tube([0, 0, 0.06], [0, 0, 0.3], 0.006, c.m(0), { parent: w });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const x = i ? Math.cos(a) * 0.04 : 0;
      const z = i ? Math.sin(a) * 0.04 : 0;
      mesh(new THREE.TorusGeometry(0.018, 0.002, 6, 20).rotateX(Math.PI / 2), c.m(i % 4), { parent: w, at: [x, 0, z] });
    }
    tube([0, 0, 0.02], [0, 0, 0.06], 0.004, c.m(0), { parent: w });
    wandTop = [0, 0.15, 0];
  }
  // a stream of bubbles drifting up and away
  const tracks = [];
  const count = T.style === 'jumbo' ? 5 : 8;
  for (let i = 0; i < count; i++) {
    const rr = 0.012 + r() * 0.03;
    const b = mesh(new THREE.SphereGeometry(rr, 20, 14), film, { parent: bubbles, at: [wandTop[0] + 0.03 + i * 0.05, wandTop[1] + 0.04 + i * 0.035 + r() * 0.04, wandTop[2] + (r() - 0.5) * 0.1], name: `bubble_${i}` });
    tracks.push(moveTrack(b, 4, (u) => [u * 0.15, u * 0.25, Math.sin(u * Math.PI * 2 + i) * 0.02]));
    tracks.push(scaleTrack(b, 4, (u) => { const k = u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15; return [k, k, k]; }));
  }
  c.anims.push(clip('blow', 4, tracks));
}, { base: 'classic' });
