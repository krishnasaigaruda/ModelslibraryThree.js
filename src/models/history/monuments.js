// Ancient monuments: obelisks, sarcophagi, pyramids, Roman arches and mosaic floors.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, lathe, setup, done, ruinCut, rubble, instanced, moveTrack, clip, pingPong, noise3 } from './common.js';
import { buildColumn, spiralPts } from './columns.js';

/** Battered (tapered) rectangular block: bottom w0×d0, top w1×d1, height h, base at y=0. */
export function taperBlock(w0, d0, w1, d1, h) {
  const g = new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2, h, 4, 1).rotateY(Math.PI / 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const top = p.getY(i) > 0;
    p.setXYZ(i, p.getX(i) * (top ? w1 : w0), p.getY(i) + h / 2, p.getZ(i) * (top ? d1 : d0));
  }
  g.computeVertexNormals();
  return g.toNonIndexed();
}

/** Glyph marks (instanced) in columns on the four faces of a tapered square shaft. */
function glyphs(parent, T, mat, b, t, y0, H, cols, rowsH, seed) {
  const items = [];
  const r = T.r;
  const tilt = Math.atan((b - t) / 2 / H);
  for (let f = 0; f < 4; f++) {
    const ang = (f * Math.PI) / 2;
    for (let c = 0; c < cols; c++) {
      for (let y = y0 + rowsH; y < y0 + H * 0.92; y += rowsH * 1.25) {
        const k = (y - y0) / H;
        const half = (b + (t - b) * k) / 2;
        const u = ((c + 0.5) / cols - 0.5) * half * 1.3;
        const kind = r();
        const w = rowsH * (kind < 0.3 ? 0.8 : kind < 0.6 ? 0.5 : 0.3), h = rowsH * (kind < 0.3 ? 0.35 : kind < 0.6 ? 0.8 : 0.9);
        const pos = new THREE.Vector3(u, y, half + 0.002).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        items.push({ p: pos.toArray(), r: [tilt * Math.cos(ang) * 0, ang, 0], s: [w, h, 0.02] });
      }
    }
  }
  void seed;
  const im = instanced(new THREE.BoxGeometry(1, 1, 1), mat, items, parent, 'glyphs');
  // tilt each glyph to follow the battered face
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < im.count; i++) {
    im.getMatrixAt(i, m4);
    m4.decompose(p, q, s);
    const ang = Math.round(Math.atan2(p.x, p.z) / (Math.PI / 2)) * (Math.PI / 2);
    q.setFromEuler(new THREE.Euler(-tilt, ang, 0, 'YXZ'));
    im.setMatrixAt(i, m4.compose(p, q, s));
  }
  return im;
}

/* -------------------------------- obelisk -------------------------------- */

const OBELISK_VARIANTS = {
  monumental: { H: 21, b: 2.4, t: 1.6 },
  temple: { H: 8, b: 1.0, t: 0.66 },
  garden: { H: 2.6, b: 0.36, t: 0.24 },
  twin: { H: 6, b: 0.8, t: 0.54 },
};

export function createObelisk(options = {}) {
  const { variant, T, V } = setup(options, OBELISK_VARIANTS, 'obelisk', { stone: '#c9a77e' });
  const root = group(`obelisk-${variant}`);
  const m = T.mats;
  const glyphMat = T.gild ? m.gold : T.paint ? m.detail : (m.glyphDark ??= M.matte(T.night ? '#3a3020' : '#6b5238', 0.9));
  const one = (x, z, base, y0 = 0) => {
    const { H, b, t } = V;
    let y = 0;
    const g = group('obelisk', { parent: root, at: [x, y0, z] });
    // stepped base
    const tiers = base === 'tall' ? 3 : 2;
    for (let i = 0; i < tiers; i++) {
      const w = b * (2.4 - i * 0.45), h = b * (i === tiers - 1 ? 0.9 : 0.35);
      mesh(roundedBox(w, h + 0.01, w, Math.min(0.04, b * 0.03)), i === tiers - 1 ? m.stone2 : m.stone2, { parent: g, at: [0, y + h / 2, 0], name: 'base' });
      y += h;
    }
    mesh(roundedBox(b * 1.35, b * 0.12, b * 1.35, b * 0.03), m.accent, { parent: g, at: [0, y + b * 0.05, 0], name: 'base-cap' });
    y += b * 0.1;
    mesh(taperBlock(b, b, t, t, H), m.stone, { parent: g, at: [0, y - 0.005, 0], name: 'shaft' });
    glyphs(g, T, glyphMat, b, t, y, H, variant === 'garden' ? 1 : 2, b * 0.16, x);
    const ph = t * 0.9;
    mesh(new THREE.ConeGeometry(t * Math.SQRT1_2, ph, 4, 1).rotateY(Math.PI / 4), T.gild || T.paint || !T.trim ? m.gold : m.stone, { parent: g, at: [0, y + H + ph / 2 - 0.01, 0], name: 'pyramidion' });
    return y + H + ph;
  };
  let top;
  if (variant === 'twin') {
    mesh(roundedBox(6.4, 0.4, 3, 0.04), m.stone2, { parent: root, at: [0, 0.2, 0], name: 'platform' });
    for (const s of [-1, 1]) top = one(s * 1.8, 0, 'low', 0.395) + 0.395;
  } else top = one(0, 0, variant === 'garden' ? 'tall' : 'low');
  if (T.ruin) {
    ruinCut(root, T, top * (0.35 + T.r() * 0.2), { jag: V.b * 0.3, slope: 0.08 });
    rubble(root, T, new THREE.Box3().setFromObject(root), 6, V.b * 0.5);
  }
  return done(root, T);
}

/* ------------------------------- sarcophagus ------------------------------- */

const SARC_VARIANTS = {
  chest: { L: 2.3, W: 0.95, H: 0.9 },
  garland: { L: 2.4, W: 1.0, H: 1.0 },
  anthropoid: { L: 2.0, W: 0.7, H: 0.5 },
  'stone-coffin': { L: 2.1, W: 0.8, H: 0.55 },
};

/** Hollow box from five slabs, top open, base at y=0. */
function hollowBox(parent, mat, L, W, H, t, name = 'chest') {
  const g = group(name, { parent });
  mesh(roundedBox(L, t, W, t * 0.3), mat, { parent: g, at: [0, t / 2, 0], name: 'floor' });
  for (const s of [-1, 1]) {
    mesh(roundedBox(L, H, t, t * 0.3), mat, { parent: g, at: [0, H / 2, s * (W / 2 - t / 2)], name: 'wall' });
    mesh(roundedBox(t, H, W - 2 * t + 0.01, t * 0.3), mat, { parent: g, at: [s * (L / 2 - t / 2), H / 2, 0], name: 'wall' });
  }
  return g;
}

/** Top-view mummy outline (head at +x), length L, width W. */
function mummyOutline(L, W, k = 1) {
  const pts = [];
  const prof = [[0, 0.32], [0.08, 0.42], [0.2, 0.47], [0.4, 0.44], [0.62, 0.38], [0.74, 0.4], [0.8, 0.36], [0.86, 0.3], [0.94, 0.32], [1.0, 0.18], [1.0, 0.0]];
  for (const [u, w] of prof) pts.push([(u - 0.5) * L, w * W * k]);
  for (let i = prof.length - 1; i >= 0; i--) pts.push([(prof[i][0] - 0.5) * L, -prof[i][1] * W * k]);
  return pts.filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
}

export function createSarcophagus(options = {}) {
  const { variant, T, V } = setup(options, SARC_VARIANTS, 'sarcophagus');
  const root = group(`sarcophagus-${variant}`);
  const m = T.mats;
  const { L, W, H } = V;
  const t = 0.09;
  const lid = group('lid', { parent: root });
  if (variant === 'anthropoid') {
    // hollow trough: outline with an inset hole
    const outer = mummyOutline(L, W);
    const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
    shape.holes.push(new THREE.Path(mummyOutline(L * 0.9, W * 0.82).map(([x, y]) => new THREE.Vector2(x, y)).reverse()));
    const trough = extrudeOutline(shape, H * 0.5, { bevel: 0.02 }).rotateX(-Math.PI / 2);
    mesh(trough, m.wood2 && T.stone ? m.stone : m.stone, { parent: root, at: [0, 0, 0], name: 'trough' }).position.y = H * 0.25;
    mesh(extrudeOutline(mummyOutline(L * 0.92, W * 0.84), 0.04, { bevel: 0.01 }).rotateX(-Math.PI / 2), m.stone2, { parent: root, at: [0, 0.03, 0], name: 'trough-floor' });
    const lidShape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
    const lg = new THREE.ExtrudeGeometry(lidShape, { depth: 0.04, bevelEnabled: true, bevelThickness: H * 0.42, bevelSize: W * 0.12, bevelSegments: 5, curveSegments: 6 }).rotateX(-Math.PI / 2);
    lg.computeBoundingBox();
    lg.translate(0, -lg.boundingBox.min.y, 0);
    const lidMat = T.gild ? m.gold : T.stone ? m.stone : (m.coffinPaint ??= M.matte('#2f4f8f', 0.6));
    mesh(lg, lidMat, { parent: lid, at: [0, H * 0.5 - 0.01, 0], name: 'lid-body' });
    lg.computeBoundingBox();
    const top = H * 0.5 + lg.boundingBox.max.y - 0.02;
    // face mask, headdress stripes, crossed arms, collar
    const face = T.gild || !T.stone ? m.gold : m.accent;
    mesh(new THREE.SphereGeometry(W * 0.2, 20, 14).scale(1, 0.55, 0.85), face, { parent: lid, at: [L * 0.36, top - 0.02, 0], name: 'mask' });
    for (const s of [-1, 1]) mesh(new THREE.CapsuleGeometry(W * 0.05, W * 0.25, 4, 8).rotateZ(Math.PI / 2), m.detail, { parent: lid, at: [L * 0.28, top - 0.07, s * W * 0.28], name: 'lappet' });
    mesh(new THREE.TorusGeometry(W * 0.26, W * 0.04, 6, 24, Math.PI).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2), m.accent, { parent: lid, at: [L * 0.24, top - 0.06, 0], name: 'collar' });
    for (const s of [-1, 1]) curveTube([[L * 0.12, top - 0.07, s * W * 0.3], [L * 0.04, top - 0.01, s * W * 0.1], [L * 0.1, top - 0.01, -s * W * 0.12], [L * 0.16, top - 0.03, -s * W * 0.2]], W * 0.045, face, { parent: lid, segments: 16, radialSegments: 6, name: 'arm' });
    for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(W * (0.36 - i * 0.03), W * 0.015, 4, 24, Math.PI).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2), i % 2 ? m.accent : face, { parent: lid, at: [-L * (0.05 + i * 0.1), top - 0.07 - i * 0.012, 0], name: 'band' });
  } else {
    const chestMat = m.stone;
    const tapered = variant === 'stone-coffin';
    hollowBox(root, chestMat, L, W, H, t);
    if (tapered) {
      // head end wider: add a low plinth flare
      mesh(roundedBox(L + 0.08, 0.1, W + 0.08, 0.02), m.stone2, { parent: root, at: [0, 0.05, 0], name: 'plinth' });
    } else {
      mesh(roundedBox(L + 0.1, 0.12, W + 0.1, 0.03), m.stone2, { parent: root, at: [0, 0.06, 0], name: 'plinth' });
      mesh(roundedBox(L + 0.06, 0.07, W + 0.06, 0.02), m.accent, { parent: root, at: [0, H - 0.03, 0], name: 'rim' });
    }
    // reliefs on the front face
    const fz = W / 2 + 0.012;
    if (variant === 'garland') {
      for (const s of [-1, 1]) mesh(roundedBox(0.16, H * 0.8, 0.08, 0.02), m.accent, { parent: root, at: [s * (L / 2 - 0.1), H * 0.5, fz], name: 'pilaster' });
      const gy = H * 0.66;
      const pts = [];
      for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(u - 0.5) * (L - 0.4), gy - Math.abs(Math.sin(u * Math.PI * 3)) * 0.2, fz + 0.02]); }
      curveTube(pts, 0.045, m.detail, { parent: root, segments: 72, radialSegments: 8, name: 'garland' });
      for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(0.06, 12, 8), m.accent, { parent: root, at: [(i / 3 - 0.5) * (L - 0.4), gy + 0.02, fz + 0.01], name: 'boss' });
      for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 20), m.detail, { parent: root, at: [((i + 0.5) / 3 - 0.5) * (L - 0.4), gy - 0.3, fz], name: 'roundel' });
      for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 24), m.accent, { parent: root, at: [s * (L / 2 + 0.012), H * 0.5, 0], rot: [0, Math.PI / 2, 0], name: 'end-wreath' });
    } else if (variant === 'chest') {
      mesh(roundedBox(L * 0.55, H * 0.45, 0.04, 0.015), m.detail, { parent: root, at: [0, H * 0.5, fz], name: 'tabula' });
      for (const s of [-1, 1]) mesh(extrudeOutline([[0, -H * 0.2], [s * 0.18, 0], [0, H * 0.2]], 0.04, { bevel: 0.008 }), m.detail, { parent: root, at: [s * L * 0.275, H * 0.5, fz], name: 'ansa' });
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.06, 0.07, H * 0.8, 16), m.accent, { parent: root, at: [s * (L / 2 + 0.01), H * 0.48, W / 2 + 0.01], name: 'corner-colonnette' });
    } else {
      mesh(roundedBox(L * 0.7, 0.04, 0.04, 0.012), m.accent, { parent: root, at: [0, H * 0.6, fz], name: 'band' });
    }
    // lid
    if (tapered) {
      mesh(roundedBox(L + 0.04, 0.1, W + 0.04, 0.03), chestMat, { parent: lid, at: [0, H + 0.05 - 0.01, 0], name: 'lid-slab' });
      mesh(roundedBox(L * 0.8, 0.05, 0.1, 0.015), m.accent, { parent: lid, at: [0, H + 0.12, 0], name: 'cross' });
      mesh(roundedBox(0.1, 0.05, W * 0.6, 0.015), m.accent, { parent: lid, at: [L * 0.22, H + 0.12, 0], name: 'cross' });
    } else {
      mesh(roundedBox(L + 0.08, 0.08, W + 0.08, 0.02), chestMat, { parent: lid, at: [0, H + 0.04 - 0.01, 0], name: 'lid-slab' });
      const rh = W * 0.22;
      const roof = extrudeOutline([[-W / 2 - 0.03, 0], [W / 2 + 0.03, 0], [0, rh]], L + 0.02, { bevel: 0.01 }).rotateY(Math.PI / 2);
      mesh(roof, chestMat, { parent: lid, at: [0, H + 0.07 - 0.01, 0], name: 'lid-roof' });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.16, rh * 0.9, 0.16, 0.03), m.accent, { parent: lid, at: [sx * (L / 2 - 0.04), H + 0.07 + rh * 0.45 - 0.01, sz * (W / 2 - 0.04)], name: 'acroterion' });
      for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(rh * 0.3, 16), m.detail, { parent: lid, at: [s * (L / 2 + 0.02), H + 0.07 + rh * 0.35, 0], rot: [0, s * Math.PI / 2, 0], name: 'pediment-disc' });
    }
  }
  // grave goods inside (visible when open)
  mesh(lathe([[0, 0], [0.05, 0], [0.07, 0.08], [0.03, 0.14], [0.04, 0.17], [0, 0.17]], 16), m.gold, { parent: root, at: [L * 0.3, variant === 'anthropoid' ? 0.07 : t, 0], name: 'grave-vase' });
  if (T.ruin) {
    lid.position.set(0, 0, 0);
    // lid broken and leaning on the ground beside the chest
    lid.rotation.set(0.9, 0, 0);
    lid.position.set(0, -H * 0.55, W * 1.0 + 0.1);
    root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(lid);
    lid.position.y -= b.min.y;
    rubble(root, T, new THREE.Box3().setFromObject(root), 6, 0.12);
  }
  return done(root, T, () => (T.ruin ? [] : [clip('open', 4, [moveTrack(lid, 4, (k) => { const p = pingPong(k); return [p * L * 0.35, Math.min(1, p * 4) * 0.06, p * W * 0.2]; })])]));
}

/* --------------------------------- pyramid --------------------------------- */

const PYRAMID_VARIANTS = {
  step: { stone: '#cdb48a' },
  smooth: { stone: '#e6dcc4' },
  bent: { stone: '#d9c9a6' },
  mesoamerican: { stone: '#b8ad98' },
  nubian: { stone: '#a8714a' },
  ziggurat: { stone: '#b88a5a' },
  mastaba: { stone: '#d6c29a' },
};

export function createPyramid(options = {}) {
  const { variant, T } = setup(options, PYRAMID_VARIANTS, 'pyramid');
  const root = group(`pyramid-${variant}`);
  const m = T.mats;
  const r = T.r;
  const casingGone = T.wear >= 0.6 || T.ruin;
  const courses = (B, Hh, n, y0 = 0, top = 0) => {
    // stack of tapered courses forming a stepped core
    for (let i = 0; i < n; i++) {
      const k0 = i / n, k1 = (i + 1) / n;
      const w0 = B * (1 - k0) + top * k0, w1 = B * (1 - k1) + top * k1;
      mesh(taperBlock(w0, w0, w1 + (w0 - w1) * 0.35, w1 + (w0 - w1) * 0.35, Hh / n + 0.02), i % 2 ? m.stone : m.stone2, { parent: root, at: [0, y0 + (i * Hh) / n - 0.01, 0], name: 'course' });
    }
  };
  if (variant === 'step') {
    const tiers = 6, B = 120, D = 108, Hh = 62;
    for (let i = 0; i < tiers; i++) {
      const k0 = i / tiers, k1 = (i + 0.85) / tiers;
      mesh(taperBlock(B * (1 - k0 * 0.75), D * (1 - k0 * 0.75), B * (1 - k1 * 0.75), D * (1 - k1 * 0.75), Hh / tiers + 0.1), i % 2 ? m.stone : m.stone2, { parent: root, at: [0, (i * Hh) / tiers - 0.05, 0], name: 'tier' });
    }
    mesh(taperBlock(B * 1.06, D * 1.06, B * 1.06, D * 1.06, 1.2), m.stone2, { parent: root, at: [0, -0.6, 0], name: 'footing' });
  } else if (variant === 'smooth') {
    const B = 230, Hh = 146;
    if (casingGone) {
      courses(B, Hh * (T.ruin ? 0.88 : 1), T.ruin ? 34 : 40, 0, T.ruin ? B * 0.12 : 0);
      if (!T.ruin) mesh(taperBlock(B * 0.24, B * 0.24, 0.5, 0.5, Hh * 0.24), m.accent, { parent: root, at: [0, Hh * 0.76 - 0.5, 0], name: 'casing-cap' });
    } else {
      mesh(taperBlock(B, B, 0.4, 0.4, Hh), m.stone, { parent: root, name: 'casing' });
      mesh(taperBlock(B * 0.035, B * 0.035, 0.05, 0.05, Hh * 0.035), T.gild || T.paint || !T.trim ? m.gold : m.stone2, { parent: root, at: [0, Hh * 0.965 - 0.3, 0], name: 'capstone' });
    }
  } else if (variant === 'bent') {
    const B = 188, h1 = 49, B1 = B - 2 * h1 / Math.tan((54 * Math.PI) / 180);
    const h2 = (B1 / 2) * Math.tan((43 * Math.PI) / 180);
    mesh(taperBlock(B, B, B1, B1, h1), m.stone, { parent: root, name: 'lower' });
    mesh(taperBlock(B1 + 0.2, B1 + 0.2, 0.4, 0.4, h2), m.stone2, { parent: root, at: [0, h1 - 0.1, 0], name: 'upper' });
    if (casingGone) for (let i = 0; i < 8; i++) mesh(taperBlock(B * 0.12, B * 0.08, B * 0.1, B * 0.06, 6), m.stone2, { parent: root, at: [(r() - 0.5) * B * 0.6, h1 * (0.15 + r() * 0.6), B / 2 - h1 * (0.15 + r() * 0.6) * 0.73 + 3], rot: [-0.95, 0, 0], name: 'patch' });
  } else if (variant === 'mesoamerican') {
    const tiers = 9, B = 55, Hh = 30;
    const th = Hh / tiers;
    for (let i = 0; i < tiers; i++) {
      const w0 = B - i * (B * 0.65) / tiers, w1 = w0 - 1.6;
      mesh(taperBlock(w0, w0, w1, w1, th + 0.05), i % 2 ? m.stone : m.stone2, { parent: root, at: [0, i * th - 0.02, 0], name: 'tier' });
      mesh(roundedBox(w1 + 0.4, 0.5, w1 + 0.4, 0.1), m.accent, { parent: root, at: [0, (i + 1) * th - 0.2, 0], name: 'tier-band' });
    }
    // stairs on all four faces with balustrades
    const top = B - (tiers - 1) * (B * 0.65) / tiers - 1.6;
    for (let f = 0; f < 4; f++) {
      const sg = group('stairway', { parent: root, rot: [0, (f * Math.PI) / 2, 0] });
      const run = (B - top) / 2;
      const n = 30;
      const st = [];
      for (let s = 0; s < n; s++) st.push({ p: [0, (s + 0.5) * (Hh / n), B / 2 - (s + 0.5) * (run / n) + 0.2], s: [9, Hh / n + 0.02, run / n + 0.6] });
      instanced(new THREE.BoxGeometry(1, 1, 1), m.stone2, st, sg, 'stairs');
      for (const sx of [-1, 1]) mesh(roundedBox(1.2, 1.4, Math.hypot(run, Hh) + 1, 0.2), m.accent, { parent: sg, at: [sx * 5, Hh / 2 + 0.4, B / 2 - run / 2], rot: [Math.atan2(Hh, run), 0, 0], name: 'balustrade' });
    }
    // temple on top
    const ty = Hh - 0.1;
    mesh(roundedBox(top * 0.8, 6, top * 0.7, 0.2), m.stone, { parent: root, at: [0, ty + 3, 0], name: 'temple' });
    mesh(roundedBox(2.4, 3.8, 0.6, 0.1), m.dark, { parent: root, at: [0, ty + 1.9, top * 0.35], name: 'doorway' });
    mesh(roundedBox(top * 0.84, 1.2, top * 0.74, 0.2), m.accent, { parent: root, at: [0, ty + 6.5, 0], name: 'frieze' });
    mesh(taperBlock(top * 0.5, top * 0.2, top * 0.4, top * 0.12, 4), m.detail, { parent: root, at: [0, ty + 7.0, 0], name: 'roof-comb' });
  } else if (variant === 'nubian') {
    const B = 10, Hh = 14;
    mesh(taperBlock(B, B, 0.3, 0.3, Hh), m.stone, { parent: root, name: 'body' });
    mesh(roundedBox(B * 1.08, 0.4, B * 1.08, 0.08), m.stone2, { parent: root, at: [0, 0.2, 0], name: 'footing' });
    for (const s of [-1, 1]) mesh(roundedBox(1.1, 1.0, 0.3, 0.05), m.accent, { parent: root, at: [s * 1.5, Hh * 0.08, B / 2 - Hh * 0.08 * (B / 2) / Hh + 0.02], rot: [-Math.atan2(B / 2, Hh) * 0, 0, 0], name: 'band-marker' });
    // chapel with pylon front
    const cz = B / 2 + 1.6;
    mesh(roundedBox(3.2, 2.6, 3.2, 0.06), m.stone2, { parent: root, at: [0, 1.3, cz - 0.4], name: 'chapel' });
    mesh(taperBlock(4.6, 1.2, 3.8, 0.9, 3.6), m.stone, { parent: root, at: [0, 0, cz + 1.3], name: 'pylon' });
    mesh(roundedBox(1.1, 2.2, 1.4, 0.04), m.dark, { parent: root, at: [0, 1.1, cz + 1.3], name: 'doorway' });
    mesh(roundedBox(4.0, 0.3, 1.3, 0.05), m.accent, { parent: root, at: [0, 3.7, cz + 1.3], name: 'cornice' });
  } else if (variant === 'ziggurat') {
    const L = [[64, 46, 11], [44, 30, 6], [26, 18, 5]];
    let y = 0;
    for (const [w, d, h] of L) {
      mesh(taperBlock(w, d, w - 2, d - 2, h + 0.1), y ? m.stone : m.stone2, { parent: root, at: [0, y - 0.05, 0], name: 'terrace' });
      // buttress ribs
      const n = Math.round(w / 4);
      const ribs = [];
      for (let i = 0; i < n; i++) for (const sz of [-1, 1]) ribs.push({ p: [-w / 2 + 2 + ((w - 4) * i) / (n - 1), y + h / 2, sz * (d / 2 - 0.4)], s: [0.8, h * 0.95, 0.9] });
      instanced(new THREE.BoxGeometry(1, 1, 1), m.stone2, ribs, root, 'buttress');
      y += h;
    }
    // triple stair at the front
    const stair = (x, z0, len, ang, w) => mesh(roundedBox(w, 1.2, len, 0.1), m.accent, { parent: root, at: [x, len * Math.sin(ang) / 2, z0 - (len * Math.cos(ang)) / 2], rot: [ang, 0, 0], name: 'stair' });
    stair(0, 23 + 22, 25, Math.atan2(11, 22), 7);
    for (const s of [-1, 1]) {
      const g = group('side-stair', { parent: root, at: [s * 14, 0, 23], rot: [0, s * 0.55, 0] });
      mesh(roundedBox(5, 1.0, 21, 0.1), m.accent, { parent: g, at: [0, 5.5, 4.2], rot: [Math.atan2(11, 20) * 1, 0, 0], name: 'stair' });
    }
    mesh(roundedBox(12, 5, 9, 0.2), m.stone, { parent: root, at: [0, y + 2.5, 0], name: 'shrine' });
    mesh(roundedBox(12.6, 0.6, 9.6, 0.15), m.detail, { parent: root, at: [0, y + 5.2, 0], name: 'shrine-band' });
  } else if (variant === 'mastaba') {
    mesh(taperBlock(32, 16, 28, 12, 7), m.stone, { parent: root, name: 'mastaba' });
    mesh(roundedBox(28.4, 0.4, 12.4, 0.1), m.stone2, { parent: root, at: [0, 7, 0], name: 'roof-slab' });
    // false door niche and offering table
    mesh(roundedBox(2.4, 4.2, 0.5, 0.06), m.accent, { parent: root, at: [0, 2.2, 7.65], rot: [0.28, 0, 0], name: 'false-door' });
    mesh(roundedBox(1.2, 3.0, 0.3, 0.04), m.dark, { parent: root, at: [0, 1.9, 7.75], rot: [0.28, 0, 0], name: 'door-niche' });
    mesh(roundedBox(1.4, 0.5, 0.9, 0.05), m.stone2, { parent: root, at: [0, 0.25, 9.0], name: 'offering-table' });
    mesh(roundedBox(1.2, 1.1, 1.6, 0.05), m.stone2, { parent: root, at: [0, 7.7, -2], name: 'shaft-head' });
  }
  if (T.ruin) {
    const b = new THREE.Box3().setFromObject(root);
    const H = b.max.y;
    if (variant !== 'smooth') ruinCut(root, T, H * 0.62, { jag: H * 0.06, topple: false, slope: 0.04 });
    rubble(root, T, b, 16, H * 0.06, { kind: 'block' });
  }
  return done(root, T);
}

/* ---------------------------------- arch ---------------------------------- */

/** Wall outline with semicircular openings reaching the ground. openings: [{x, s, hs}] */
function archWallGeo(W, H, D, openings, bevel = 0.03) {
  const pts = [[-W / 2, 0]];
  for (const o of openings.slice().sort((a, b) => a.x - b.x)) {
    pts.push([o.x - o.s / 2, 0], [o.x - o.s / 2, o.hs]);
    for (let i = 1; i < 24; i++) { const a = Math.PI - (i / 24) * Math.PI; pts.push([o.x + Math.cos(a) * o.s / 2, o.hs + Math.sin(a) * o.s / 2]); }
    pts.push([o.x + o.s / 2, o.hs], [o.x + o.s / 2, 0]);
  }
  pts.push([W / 2, 0], [W / 2, H], [-W / 2, H]);
  return extrudeOutline(pts, D, { bevel, segments: 2 }).translate(0, bevel, 0);
}

/** Voussoir ring (wedge stones + keystone) around an opening. */
function voussoirs(parent, T, x, hs, s, D, vw, n = 13, z = 0) {
  const m = T.mats;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI - (i / n) * Math.PI, a1 = Math.PI - ((i + 1) / n) * Math.PI;
    const key = i === (n - 1) / 2;
    const ro = s / 2 + vw * (key ? 1.25 : 1);
    const shape = [];
    const ri = s / 2 - 0.005;
    for (let k = 0; k <= 3; k++) { const a = a0 + ((a1 - a0) * k) / 3; shape.push([Math.cos(a) * ri, Math.sin(a) * ri]); }
    for (let k = 3; k >= 0; k--) { const a = a0 + ((a1 - a0) * k) / 3; shape.push([Math.cos(a) * ro, Math.sin(a) * ro]); }
    const gap = 0.012;
    const geo = extrudeOutline(shape, D + (key ? 0.16 : 0.07), { bevel: gap, segments: 1 });
    mesh(geo, key ? m.detail : m.accent, { parent, at: [x, hs, z], name: key ? 'keystone' : 'voussoir' });
  }
}

const ARCH_VARIANTS = { single: {}, triumphal: {}, aqueduct: {}, 'city-gate': {}, bridge: {} };

export function createRomanArch(options = {}) {
  const { variant, T } = setup(options, ARCH_VARIANTS, 'roman-arch', { stone: '#ddd2bb' });
  const root = group(`roman-arch-${variant}`);
  const m = T.mats;
  let foot;
  if (variant === 'single' || variant === 'triumphal') {
    const tri = variant === 'triumphal';
    const W = tri ? 25 : 9, D = tri ? 7 : 3, H = tri ? 15 : 9.5;
    const ops = tri ? [{ x: 0, s: 7, hs: 7.5 }, { x: -7.8, s: 3.4, hs: 4.5 }, { x: 7.8, s: 3.4, hs: 4.5 }] : [{ x: 0, s: 4, hs: 4.2 }];
    mesh(archWallGeo(W, H, D, ops, 0.05), m.stone, { parent: root, name: 'body' });
    for (const o of ops) voussoirs(root, T, o.x, o.hs, o.s, D, o.s * 0.14);
    // impost mouldings
    for (const o of ops) for (const s of [-1, 1]) mesh(roundedBox(0.5, 0.3, D + 0.1, 0.04), m.accent, { parent: root, at: [o.x + s * (o.s / 2 + 0.2), o.hs, 0], name: 'impost' });
    // cornice + attic with inscription
    mesh(roundedBox(W + 0.6, 0.6, D + 0.6, 0.08), m.accent, { parent: root, at: [0, H + 0.28, 0], name: 'cornice' });
    const ah = tri ? 4.2 : 2.6;
    mesh(roundedBox(W - 0.4, ah, D - 0.2, 0.06), m.stone, { parent: root, at: [0, H + 0.55 + ah / 2 - 0.02, 0], name: 'attic' });
    mesh(roundedBox(W * 0.5, ah * 0.6, 0.1, 0.03), m.detail, { parent: root, at: [0, H + 0.55 + ah / 2, D / 2 - 0.06], name: 'inscription' });
    const lines = [];
    for (let l = 0; l < 3; l++) for (let c = 0; c < 18; c++) if (T.r() > 0.15) lines.push({ p: [(c / 17 - 0.5) * W * 0.44, H + 0.55 + ah * (0.68 - l * 0.18), D / 2 + 0.0], s: [W * 0.017, ah * 0.11, 0.02] });
    instanced(new THREE.BoxGeometry(1, 1, 1), T.gild ? m.gold : (m.letters ??= M.matte('#5a4a38')), lines, root, 'letters');
    mesh(roundedBox(W - 0.1, 0.4, D + 0.1, 0.06), m.accent, { parent: root, at: [0, H + 0.55 + ah + 0.15, 0], name: 'attic-cornice' });
    // engaged columns on pedestals
    const cols = tri ? [-11, -4.6, 4.6, 11] : [-3.6, 3.6];
    for (const x of cols) for (const s of [-1, 1]) {
      const pedH = tri ? 2.6 : 1.4;
      mesh(roundedBox(1.4, pedH, 1.2, 0.05), m.stone2, { parent: root, at: [x, pedH / 2, s * (D / 2 + 0.5)], name: 'pedestal' });
      const c = buildColumn(root, T, 'composite', { D: tri ? 1.0 : 0.62, Hs: ((H - pedH - 0.15) / (tri ? 1.0 : 0.62)) - 2.3, x, z: s * (D / 2 + 0.5), name: 'column' });
      c.g.position.y = pedH - 0.01;
    }
    if (tri) for (const s of [-1, 1]) mesh(roundedBox(3.6, 1.1, 0.2, 0.04), m.detail, { parent: root, at: [s * 7.8, 7.4, D / 2 + 0.05], name: 'relief-panel' });
    // quadriga-free crowning group: bronze statue plinth with a tripod
    if (tri) {
      mesh(roundedBox(6, 1.2, 3, 0.08), m.stone2, { parent: root, at: [0, H + 0.55 + ah + 0.9, 0], name: 'crown-plinth' });
      mesh(lathe([[0, 0], [0.9, 0], [1.2, 0.6], [1.4, 1.4], [1.2, 1.5], [0.5, 1.2], [0.2, 2.2], [0, 2.3]], 24), T.gild ? m.gold : m.bronze, { parent: root, at: [0, H + 0.55 + ah + 1.48, 0], name: 'crown-urn' });
    }
    foot = { W, D };
  } else if (variant === 'aqueduct') {
    const bays = 3, s = 6, pier = 2.2, D = 3;
    const W = bays * s + (bays + 1) * pier;
    const ops = Array.from({ length: bays }, (_, i) => ({ x: -W / 2 + pier + s / 2 + i * (s + pier), s, hs: 8 }));
    mesh(archWallGeo(W, 12.5, D, ops, 0.04), m.stone, { parent: root, name: 'lower-tier' });
    for (const o of ops) voussoirs(root, T, o.x, o.hs, o.s, D, 0.8, 11);
    mesh(roundedBox(W + 0.3, 0.45, D + 0.3, 0.06), m.accent, { parent: root, at: [0, 12.6, 0], name: 'string-course' });
    const ops2 = [];
    for (let i = 0; i < bays * 2; i++) ops2.push({ x: -W / 2 + W / (bays * 2) * (i + 0.5), s: 2.6, hs: 3.0 });
    const up = group('upper', { parent: root, at: [0, 12.8, 0] });
    mesh(archWallGeo(W, 5.6, D * 0.85, ops2, 0.04), m.stone, { parent: up, name: 'upper-tier' });
    for (const o of ops2) voussoirs(up, T, o.x, o.hs, o.s, D * 0.85, 0.5, 9);
    // water channel (specus) with a cover
    const ch = group('channel', { parent: up, at: [0, 5.58, 0] });
    for (const sz of [-1, 1]) mesh(roundedBox(W, 1.2, 0.5, 0.06), m.stone2, { parent: ch, at: [0, 0.6, sz * 0.75], name: 'channel-wall' });
    mesh(roundedBox(W, 0.3, 2.0, 0.05), m.stone2, { parent: ch, at: [0, 0.15, 0], name: 'channel-floor' });
    mesh(roundedBox(W - 0.1, 0.06, 1.05, 0.02), m.water, { parent: ch, at: [0, 0.55, 0], name: 'water' });
    foot = { W, D };
  } else if (variant === 'city-gate') {
    const W = 8, D = 4, H = 9;
    mesh(archWallGeo(W, H, D, [{ x: 0, s: 3.8, hs: 3.6 }]), m.stone, { parent: root, name: 'gate-wall' });
    voussoirs(root, T, 0, 3.6, 3.8, D, 0.6);
    for (const s of [-1, 1]) {
      const tw = group('tower', { parent: root, at: [s * (W / 2 + 2.6), 0, 0.6] });
      mesh(lathe([[0, 0], [3.2, 0], [3.0, 0.8], [3.0, 12], [0, 12]], 40), m.stone2, { parent: tw, name: 'tower' });
      mesh(lathe([[0, 0], [3.3, 0], [3.3, 0.5], [0, 0.5]], 40), m.accent, { parent: tw, at: [0, 11.9, 0], name: 'tower-band' });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        mesh(roundedBox(1.0, 1.1, 0.7, 0.06), m.stone2, { parent: tw, at: [Math.cos(a) * 2.9, 12.9, Math.sin(a) * 2.9], rot: [0, -a, 0], name: 'merlon' });
      }
      for (const y of [4, 8]) for (const a of [0.9, 1.6, 2.3]) mesh(roundedBox(0.7, 1.4, 0.7, 0.12), m.dark, { parent: tw, at: [Math.cos(a) * 2.88, y, Math.sin(a) * 2.88], rot: [0, -a + Math.PI / 2, 0], name: 'window' });
    }
    mesh(roundedBox(W + 0.4, 0.5, D + 0.3, 0.06), m.accent, { parent: root, at: [0, H + 0.2, 0], name: 'cornice' });
    for (let i = 0; i < 6; i++) mesh(roundedBox(0.8, 1.0, D * 0.9, 0.06), m.stone, { parent: root, at: [-W / 2 + 0.6 + i * (W - 1.2) / 5, H + 0.9, 0], name: 'merlon' });
    foot = { W: W + 11, D: 7 };
  } else if (variant === 'bridge') {
    const s = 9, pier = 3, D = 6;
    const W = 2 * s + 3 * pier;
    const ops = [{ x: -s / 2 - pier / 2, s, hs: 1.2 }, { x: s / 2 + pier / 2, s, hs: 1.2 }];
    mesh(archWallGeo(W, 7.2, D, ops), m.stone, { parent: root, name: 'bridge-body' });
    for (const o of ops) voussoirs(root, T, o.x, o.hs, o.s, D, 0.9, 15);
    // cutwaters on the central pier
    for (const sz of [-1, 1]) mesh(new THREE.ConeGeometry(pier * 0.72, 4.2, 3).rotateY(sz > 0 ? Math.PI / 6 : -Math.PI / 6 + Math.PI), m.stone2, { parent: root, at: [0, 2.1, sz * (D / 2 + 0.6)], scale: [1, 1, 0.9], name: 'cutwater' });
    mesh(roundedBox(W + 0.4, 0.35, D + 0.4, 0.06), m.accent, { parent: root, at: [0, 7.3, 0], name: 'string-course' });
    for (const sz of [-1, 1]) mesh(roundedBox(W + 0.2, 1.1, 0.5, 0.08), m.stone2, { parent: root, at: [0, 7.95, sz * (D / 2 - 0.05)], name: 'parapet' });
    mesh(roundedBox(W, 0.12, D - 0.8, 0.03), m.stone2, { parent: root, at: [0, 7.5, 0], name: 'paving' });
    foot = { W, D };
  }
  if (T.ruin) {
    const b = new THREE.Box3().setFromObject(root);
    ruinCut(root, T, b.max.y * 0.55, { jag: b.max.y * 0.08, slope: 0.12, topple: false });
    rubble(root, T, b, 14, Math.max(0.4, foot.D * 0.15), { kind: 'block' });
  }
  return done(root, T);
}

/* --------------------------------- mosaic --------------------------------- */

const MOSAIC_VARIANTS = { meander: {}, checker: {}, wave: {}, rosette: {}, labyrinth: {}, guilloche: {} };

const PALETTES = {
  base: ['#efe6d2', '#1d1a18', '#a8432c', '#d4a24a', '#3d5e86', '#5c7a45'],
  marble: ['#f4f2ee', '#2a2a2c', '#9a9590', '#c9c4bc', '#6d6a66', '#b8b2a8'],
  sandstone: ['#ead2a4', '#6b3e1f', '#c4742f', '#e0ad5a', '#94562a', '#b98a4e'],
  granite: ['#c9c6c2', '#2a2a2c', '#7a7672', '#a19d98', '#55524f', '#8c8884'],
  basalt: ['#3a3a3d', '#121214', '#c9a24a', '#6b6b70', '#8f2a1f', '#2d4a6a'],
  gilded: ['#f3ead2', '#1a1612', '#d6a93c', '#f0cf6a', '#1f3b7a', '#8a1d2a'],
  polychrome: ['#f6ecd6', '#151312', '#c8341f', '#f0b53a', '#2459b3', '#2f8a4a'],
};

function mosaicPattern(variant, u, v) {
  const cx = u - 0.5, cy = v - 0.5;
  const edge = Math.min(u, v, 1 - u, 1 - v);
  if (edge < 0.025) return 1;
  if (edge < 0.12) {
    // border band
    const t = (Math.abs(cx) > Math.abs(cy) ? v : u) * 28;
    const b = (edge - 0.025) / 0.095;
    if (variant === 'meander' || variant === 'labyrinth') {
      const cell = Math.floor(t) % 2, bb = Math.floor(b * 4);
      return (bb === 0 || bb === 3 || (cell === 0 && bb === 1) || (cell === 1 && bb === 2) || Math.floor(t * 2) % 4 === 0) ? 1 : 0;
    }
    if (variant === 'wave') return b < 0.5 + 0.35 * Math.sin(t * Math.PI) ? 4 : 0;
    if (variant === 'guilloche') return Math.abs(Math.sin(t * Math.PI) * 0.4 - (b - 0.5)) < 0.12 || Math.abs(-Math.sin(t * Math.PI) * 0.4 - (b - 0.5)) < 0.12 ? 2 : 0;
    return Math.floor(t) % 2 ? 2 : 3;
  }
  if (edge < 0.14) return 2;
  const r = Math.hypot(cx, cy), a = Math.atan2(cy, cx);
  switch (variant) {
    case 'meander': {
      if (r < 0.14) return r < 0.04 ? 3 : Math.cos(a * 8) > 0.2 - r * 3 ? 2 : 0;
      if (r < 0.16) return 1;
      return (Math.floor(u * 12) + Math.floor(v * 12)) % 2 ? 0 : 5;
    }
    case 'checker': return (Math.floor((u + v) * 9) + Math.floor((u - v + 1) * 9)) % 2 ? 1 : 0;
    case 'wave': { const s = Math.max(Math.abs(cx), Math.abs(cy)); return Math.floor(s * 20) % 3 === 0 ? 4 : Math.floor(s * 20) % 3 === 1 ? 0 : 3; }
    case 'rosette': {
      if (r > 0.34) return 0;
      const star = Math.abs(Math.cos(a * 4)) * 0.12 + 0.1;
      if (r < star) return r < 0.05 ? 3 : 2;
      return Math.floor(r * 30) % 2 ? 4 : 0;
    }
    case 'labyrinth': {
      const s = Math.max(Math.abs(cx), Math.abs(cy));
      const ring = Math.floor(s * 26);
      const gapA = (ring % 4) * 1.6;
      const ang = Math.atan2(cy, cx) + Math.PI;
      if (ring % 2 === 0 && !(Math.abs(ang - gapA) < 0.2)) return 1;
      return s < 0.04 ? 2 : 0;
    }
    case 'guilloche': {
      const gx = (u * 6) % 1 - 0.5, gy = (v * 6) % 1 - 0.5;
      const d = Math.hypot(gx, gy);
      return d > 0.3 && d < 0.44 ? 4 : d < 0.12 ? 2 : 0;
    }
  }
  return 0;
}

export function createMosaic(options = {}) {
  const { variant, T } = setup(options, MOSAIC_VARIANTS, 'ancient-mosaic', { stone: '#cfc4ad' });
  const root = group(`mosaic-${variant}`);
  const m = T.mats;
  const S = 3, N = 60, cell = (S - 0.2) / N;
  const slabH = 0.14;
  mesh(roundedBox(S + 0.3, slabH, S + 0.3, 0.03), m.stone2, { parent: root, at: [0, slabH / 2, 0], name: 'bedding' });
  mesh(roundedBox(S - 0.12, 0.012, S - 0.12, 0.004), (m.mortar ??= M.matte(T.wear ? '#8a8272' : '#bdb3a0', 0.95)), { parent: root, at: [0, slabH, 0], name: 'mortar' });
  const pal = PALETTES[T.trim] ?? PALETTES.base;
  const r = T.r;
  const tiles = [];
  const loose = [];
  const fadeTo = new THREE.Color(T.night ? '#56607a' : '#b5ab98');
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const u = (i + 0.5) / N, v = (j + 0.5) / N;
    const x = (u - 0.5) * (S - 0.2), z = (v - 0.5) * (S - 0.2);
    if (T.ruin && noise3(u * 4 + 1, v * 4, 2) > 0.55) { if (r() < 0.03) loose.push([x * 1.25 + (r() - 0.5), z * 1.25 + (r() - 0.5)]); continue; }
    if (T.wear && r() < 0.06 * T.wear) continue;
    const c = M.toColor(pal[mosaicPattern(variant, u, v)]);
    c.offsetHSL(0, 0, (r() - 0.5) * 0.06);
    if (T.wear) c.lerp(fadeTo, 0.35 * T.wear);
    if (T.night) c.multiplyScalar(0.7);
    tiles.push({ p: [x, slabH + 0.012 + (T.wear ? (r() - 0.5) * 0.004 : 0), z], r: [0, (r() - 0.5) * 0.15, 0], s: [cell * 0.9, 0.018, cell * 0.9], c });
  }
  const tg = new THREE.BoxGeometry(1, 1, 1);
  const tm = new THREE.MeshPhysicalMaterial({ name: 'tesserae', color: 0xffffff, roughness: T.gild ? 0.35 : 0.6, clearcoat: T.polish ? 0.6 : 0.1, metalness: T.gild ? 0.15 : 0 });
  instanced(tg, tm, tiles, root, 'tesserae');
  if (loose.length) instanced(tg, tm, loose.map(([x, z], k) => ({ p: [x, 0.01, z], r: [0, k, 0], s: [cell * 0.9, 0.018, cell * 0.9], c: pal[k % pal.length] })), root, 'loose-tesserae');
  // marble threshold strip and corner stones
  mesh(roundedBox(S + 0.3, 0.05, 0.25, 0.015), m.accent, { parent: root, at: [0, slabH + 0.02, S / 2 + 0.02], name: 'threshold' });
  if (T.ruin) {
    // broken corner of the bedding and fragments
    rubble(root, T, { x0: -S / 2, x1: S / 2, z0: -S / 2, z1: S / 2 }, 8, 0.18, { mat: m.stone2, kind: 'block', spread: 0.2 });
  }
  return done(root, T);
}

export { spiralPts };
