// Classical columns (five orders + Egyptian, Minoan, Solomonic) and the temple pieces built from them.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, lathe, setup, done, ruinCut, rubble, instanced, blockGeo } from './common.js';

/* ------------------------------ shaft geometry ------------------------------ */

/**
 * Column shaft with entasis, flutes / lobes / twist, closed at both ends.
 * kind: 'doric' (sharp arrises), 'ionic' (flutes with fillets), 'smooth', 'lobed', 'twist'.
 */
export function shaftGeo(R, H, { kind = 'smooth', flutes = 20, depth = 0.06, taper = 0.84, inverse = false, rings = 14, lobes = 8 } = {}) {
  const N = kind === 'smooth' ? 36 : kind === 'twist' ? 40 : kind === 'lobed' ? lobes * 5 : flutes * 4;
  const rows = kind === 'twist' ? 48 : rings;
  const pos = [];
  const idx = [];
  const rad = (t) => (inverse ? R * (taper + (1 - taper) * t) : R * (1 - (1 - taper) * Math.pow(t, 1.4)) + R * 0.012 * Math.sin(Math.PI * t));
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const y = t * H;
    const r0 = rad(t);
    const endFade = kind === 'ionic' ? Math.min(1, t / 0.04, (1 - t) / 0.04) : 1;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      let m = 1;
      if (kind === 'doric') {
        const f = ((th * flutes) / (Math.PI * 2)) % 1;
        m = 1 - depth * Math.sin(Math.PI * f);
      } else if (kind === 'ionic') {
        const f = ((th * flutes) / (Math.PI * 2)) % 1;
        const fil = 0.22;
        m = f < fil ? 1 : 1 - depth * endFade * Math.sin((Math.PI * (f - fil)) / (1 - fil));
      } else if (kind === 'lobed') {
        m = 0.9 + 0.1 * Math.sqrt(Math.abs(Math.cos((th * lobes) / 2)));
      } else if (kind === 'twist') {
        m = 1 + 0.13 * Math.cos(3 * th - (y / (R * 2.2)) * Math.PI * 2) * Math.min(1, t / 0.05, (1 - t) / 0.05);
      }
      pos.push(Math.cos(th) * r0 * m, y, -Math.sin(th) * r0 * m);
    }
  }
  // rows ordered from both ends inwards (contact checks sample triangles in index order)
  const order = [];
  for (let a = 0, b = rows - 1; a <= b; a++, b--) { order.push(b); if (a !== b) order.push(a); }
  for (const j of order) {
    for (let i = 0; i < N; i++) {
      const a = j * N + i, b = j * N + ((i + 1) % N), c = (j + 1) * N + i, d = (j + 1) * N + ((i + 1) % N);
      idx.push(a, b, d, a, d, c);
    }
  }
  // caps (own vertices so the rim stays crisp)
  for (const [row, y, up] of [[0, 0, false], [rows, H, true]]) {
    const start = pos.length / 3;
    for (let i = 0; i < N; i++) pos.push(pos[(row * N + i) * 3], y, pos[(row * N + i) * 3 + 2]);
    const c = pos.length / 3;
    pos.push(0, y, 0);
    for (let i = 0; i < N; i++) {
      const a = start + i, b = start + ((i + 1) % N);
      up ? idx.push(c, a, b) : idx.push(c, b, a);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const arc = (cx, cy, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });

/** Attic base profile (radius R units) → lathe points, height ≈ 0.62R. */
function atticProfile(R) {
  const p = [[0, 0], [1.24 * R, 0]];
  p.push(...arc(1.24 * R, 0.13 * R, 0.13 * R, -Math.PI / 2, Math.PI / 2, 8).slice(1));
  p.push([1.13 * R, 0.27 * R]);
  p.push(...arc(1.13 * R, 0.355 * R, 0.075 * R, -Math.PI / 2, -Math.PI * 1.5, 6).map(([x, y]) => [2 * 1.13 * R - x - 0.15 * R + 0.15 * R * 0, y]).map(([x, y]) => [Math.min(x, 1.13 * R), y]));
  p.push(...arc(1.09 * R, 0.51 * R, 0.085 * R, -Math.PI / 2, Math.PI / 2, 6));
  p.push([0.98 * R, 0.6 * R], [0.98 * R, 0.64 * R], [0, 0.64 * R]);
  return p;
}

/** Spiral (volute) points in a plane: centre (cx,cy), facing ±z at z. */
function spiralPts(cx, cy, z, r0, turns = 2.4, side = 1, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = Math.PI / 2 + side * t * turns * Math.PI * 2;
    const r = r0 * (1 - 0.82 * t);
    pts.push([cx + Math.cos(a) * r * side, cy + Math.sin(a) * r, z]);
  }
  return pts;
}

/** Acanthus leaf: curved, lobed sheet standing on its base (local +z = outward). */
let _leafCache = new Map();
function acanthusGeo(w, h) {
  const key = `${w.toFixed(4)}|${h.toFixed(4)}`;
  if (_leafCache.has(key)) return _leafCache.get(key);
  const nu = 6, nv = 9;
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const lob = 1 + 0.18 * Math.sin(v * Math.PI * 7);
    const half = (w / 2) * Math.sin(Math.PI * Math.min(1, v * 0.95 + 0.12)) * lob * (v > 0.8 ? 1 - (v - 0.8) * 1.5 : 1);
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * 2 - 1;
      const x = u * half;
      const curl = v > 0.72 ? Math.sin(((v - 0.72) / 0.28) * Math.PI * 0.9) : 0;
      const y = h * v - curl * h * 0.12;
      const z = h * 0.18 * v * v + curl * h * 0.2 - Math.abs(u) * half * 0.35 + 0.004;
      pos.push(x, y, z);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  _leafCache.set(key, g);
  return g;
}

/** Concave-sided abacus (Corinthian / Composite). */
function concaveAbacus(s, h) {
  const shape = new THREE.Shape();
  const c = s / 2, k = s * 0.08, ch = s * 0.07;
  shape.moveTo(-c + ch, -c);
  shape.quadraticCurveTo(0, -c + k, c - ch, -c);
  shape.lineTo(c, -c + ch);
  shape.quadraticCurveTo(c - k, 0, c, c - ch);
  shape.lineTo(c - ch, c);
  shape.quadraticCurveTo(0, c - k, -c + ch, c);
  shape.lineTo(-c, c - ch);
  shape.quadraticCurveTo(-c + k, 0, -c, -c + ch);
  shape.lineTo(-c + ch, -c);
  return extrudeOutline(shape, h, { bevel: h * 0.12, segments: 2 }).rotateX(-Math.PI / 2);
}

/* --------------------------------- column --------------------------------- */

export const ORDERS = {
  doric: { D: 0.8, H: 5.2, flutes: 20, kind: 'doric' },
  tuscan: { D: 0.7, H: 6.2, kind: 'smooth' },
  ionic: { D: 0.7, H: 8.2, flutes: 24, kind: 'ionic' },
  corinthian: { D: 0.7, H: 9, flutes: 24, kind: 'ionic' },
  composite: { D: 0.72, H: 9, flutes: 24, kind: 'ionic' },
  egyptian: { D: 1.1, H: 5, kind: 'lobed' },
  minoan: { D: 0.6, H: 5, kind: 'smooth', inverse: true },
  solomonic: { D: 0.6, H: 6.5, kind: 'twist' },
};

/**
 * Build one column into parent at (x, 0, z).  D = lower diameter, Hs = shaft height in D.
 * Returns { g, top, abacus } (top = y of abacus top, abacus = abacus width).
 */
export function buildColumn(parent, T, order, { D, Hs, x = 0, z = 0, base = true, name = 'column' } = {}) {
  const O = ORDERS[order];
  D ??= O.D;
  const R = D / 2;
  const H = (Hs ?? O.H) * D;
  const g = group(name, { parent, at: [x, 0, z] });
  const m = T.mats;
  const stoneOverride = T.stone && !T.paint && !T.gild && T.trim !== 'weathered' && T.trim !== 'ruined' && T.trim !== 'overgrown';
  const shaftMat = order === 'minoan' && !stoneOverride ? (m.minoanRed ??= paintW(T, '#9b2a1c')) : m.stone;
  const capMat = order === 'minoan' && !stoneOverride ? (m.minoanBlack ??= paintW(T, '#2a2321')) : m.accent;
  let y = 0;
  // ---- base
  if (base) {
    if (order === 'doric') {
      mesh(roundedBox(3.2 * R, 0.32 * R, 3.2 * R, 0.03 * R), m.stone2, { parent: g, at: [0, 0.16 * R, 0], name: 'stylobate' });
      y = 0.32 * R;
    } else if (order === 'egyptian' || order === 'minoan') {
      mesh(lathe([[0, 0], [1.45 * R, 0], [1.5 * R, 0.06 * R], [1.45 * R, 0.3 * R], [0, 0.3 * R]], 40), order === 'minoan' ? m.stone2 : m.stone2, { parent: g, name: 'base' });
      y = 0.3 * R;
    } else {
      const ped = order === 'solomonic' ? 2.2 * R : 0;
      if (ped) {
        mesh(roundedBox(3.1 * R, 0.25 * R, 3.1 * R, 0.03 * R), m.stone2, { parent: g, at: [0, 0.125 * R, 0], name: 'pedestal' });
        mesh(roundedBox(2.7 * R, ped, 2.7 * R, 0.03 * R), m.stone, { parent: g, at: [0, 0.25 * R + ped / 2, 0], name: 'pedestal' });
        mesh(roundedBox(3.0 * R, 0.22 * R, 3.0 * R, 0.03 * R), m.accent, { parent: g, at: [0, 0.25 * R + ped + 0.1 * R, 0], name: 'pedestal' });
        y = 0.25 * R + ped + 0.2 * R;
      }
      mesh(roundedBox(2.75 * R, 0.3 * R, 2.75 * R, 0.025 * R), m.stone2, { parent: g, at: [0, y + 0.15 * R, 0], name: 'plinth' });
      y += 0.29 * R;
      if (order === 'tuscan') {
        mesh(lathe([[0, 0], [1.2 * R, 0], ...arc(1.18 * R, 0.14 * R, 0.14 * R, -Math.PI / 2, Math.PI / 2, 8).slice(1), [1.0 * R, 0.3 * R], [0, 0.3 * R]], 48), m.stone, { parent: g, at: [0, y, 0], name: 'torus' });
        y += 0.28 * R;
      } else {
        mesh(lathe(atticProfile(R), 48), order === 'gilded' ? m.accent : m.stone, { parent: g, at: [0, y, 0], name: 'attic-base' });
        y += 0.62 * R;
      }
    }
  }
  // ---- shaft
  const shaft = mesh(shaftGeo(R, H, { kind: O.kind, flutes: O.flutes, inverse: O.inverse, depth: O.kind === 'doric' ? 0.05 : 0.07 }), shaftMat, { parent: g, at: [0, y - 0.004, 0], name: 'shaft' });
  void shaft;
  y += H - 0.004;
  const rt = O.inverse ? R : R * 0.84; // top radius
  // ---- capital
  let top, ab;
  if (order === 'doric') {
    for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(rt * 1.0, 0.018 * R, 4, 32).rotateX(Math.PI / 2), m.detail, { parent: g, at: [0, y - 0.06 * R - i * 0.05 * R, 0], name: 'annulet' });
    mesh(lathe([[0, 0], [rt * 1.0, 0], [rt * 1.12, 0.07 * R], [1.22 * R, 0.2 * R], [1.3 * R, 0.32 * R], [1.3 * R, 0.36 * R], [0, 0.36 * R]], 48), capMat, { parent: g, at: [0, y - 0.01, 0], name: 'echinus' });
    ab = 2.7 * R;
    mesh(roundedBox(ab, 0.32 * R, ab, 0.02 * R), m.detail, { parent: g, at: [0, y + 0.34 * R + 0.16 * R - 0.01, 0], name: 'abacus' });
    top = y + 0.66 * R - 0.01;
  } else if (order === 'tuscan') {
    mesh(new THREE.TorusGeometry(rt, 0.06 * R, 8, 40).rotateX(Math.PI / 2), m.detail, { parent: g, at: [0, y - 0.22 * R, 0], name: 'astragal' });
    mesh(lathe([[0, 0], [rt, 0], ...arc(rt, 0.22 * R, 0.24 * R, -Math.PI / 2, 0, 6).slice(1), [rt + 0.24 * R, 0.26 * R], [0, 0.26 * R]], 48), capMat, { parent: g, at: [0, y - 0.01, 0], name: 'echinus' });
    ab = 2.45 * R;
    mesh(roundedBox(ab, 0.3 * R, ab, 0.02 * R), m.detail, { parent: g, at: [0, y + 0.25 * R + 0.15 * R - 0.01, 0], name: 'abacus' });
    top = y + 0.55 * R - 0.01;
  } else if (order === 'ionic' || order === 'composite' || order === 'corinthian' || order === 'solomonic') {
    mesh(new THREE.TorusGeometry(rt * 1.02, 0.05 * R, 8, 40).rotateX(Math.PI / 2), m.detail, { parent: g, at: [0, y + 0.02 * R, 0], name: 'astragal' });
    if (order === 'ionic') {
      // echinus with egg-and-dart
      mesh(lathe([[0, 0], [rt, 0], [1.08 * R, 0.12 * R], [1.12 * R, 0.24 * R], [0, 0.24 * R]], 48), capMat, { parent: g, at: [0, y, 0], name: 'echinus' });
      const eggs = [];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        eggs.push({ p: [Math.cos(a) * 1.04 * R, y + 0.13 * R, Math.sin(a) * 1.04 * R], r: [0, -a, 0], s: [0.05 * R, 0.08 * R, 0.07 * R] });
      }
      instanced(new THREE.SphereGeometry(1, 8, 6), m.detail, eggs, g, 'eggs');
      const vy = y + 0.36 * R;
      // canalis cushion and the two bolsters (pulvini)
      mesh(roundedBox(2.5 * R, 0.3 * R, 1.6 * R, 0.08 * R), capMat, { parent: g, at: [0, y + 0.36 * R, 0], name: 'canalis' });
      for (const s of [-1, 1]) {
        const bol = lathe([[0, -0.82 * R], [0.34 * R, -0.82 * R], [0.36 * R, -0.75 * R], [0.24 * R, -0.3 * R], [0.22 * R, 0], [0.24 * R, 0.3 * R], [0.36 * R, 0.75 * R], [0.34 * R, 0.82 * R], [0, 0.82 * R]], 24).rotateX(Math.PI / 2);
        mesh(bol, capMat, { parent: g, at: [s * 1.22 * R, vy - 0.04 * R, 0], name: 'volute' });
        for (const zz of [-1, 1]) curveTube(spiralPts(s * 1.22 * R, vy - 0.04 * R, zz * 0.83 * R, 0.33 * R, 2.3, s), 0.045 * R, m.detail, { parent: g, segments: 40, radialSegments: 5, name: 'volute-spiral' });
      }
      ab = 2.6 * R;
      mesh(roundedBox(ab, 0.12 * R, 1.75 * R, 0.02 * R), m.detail, { parent: g, at: [0, y + 0.56 * R, 0], name: 'abacus' });
      top = y + 0.62 * R;
    } else {
      // corinthian bell + acanthus (composite adds big diagonal volutes)
      const bh = order === 'composite' ? 2.1 * R : 2.3 * R;
      mesh(lathe([[0, 0], [rt * 0.98, 0], [rt * 0.98, 0.3 * bh], [1.0 * R, 0.75 * bh], [1.12 * R, 0.96 * bh], [1.12 * R, bh], [0, bh]], 40), capMat, { parent: g, at: [0, y, 0], name: 'bell' });
      const leafMat = (T.mats.leafStone ??= Object.assign(m.detail.clone(), { side: THREE.DoubleSide }));
      const rows = order === 'composite' ? [[0.42, 0], [0.62, 0.5]] : [[0.4, 0], [0.66, 0.5], [0.82, 0.25]];
      rows.forEach(([hk, off], ri) => {
        const n = ri === 2 ? 4 : 8;
        const lg = acanthusGeo(R * (ri === 2 ? 0.7 : 0.62), bh * hk);
        for (let i = 0; i < n; i++) {
          const a = ((i + off) / n) * Math.PI * 2 + (ri === 2 ? Math.PI / 4 : 0);
          const L = new THREE.Mesh(lg, leafMat);
          L.name = 'acanthus';
          L.position.set(Math.sin(a) * rt * 0.93, y + (ri === 2 ? bh * 0.3 : 0), Math.cos(a) * rt * 0.93);
          L.rotation.y = a;
          g.add(L);
        }
      });
      if (order === 'composite') {
        mesh(lathe([[0, 0], [1.02 * R, 0], [1.14 * R, 0.1 * R], [1.16 * R, 0.2 * R], [0, 0.2 * R]], 40), capMat, { parent: g, at: [0, y + bh * 0.66, 0], name: 'echinus' });
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          const vg = group('volute', { parent: g, at: [Math.sin(a) * 1.05 * R, y + bh * 0.82, Math.cos(a) * 1.05 * R], rot: [0, a, 0] });
          mesh(new THREE.CylinderGeometry(0.3 * R, 0.3 * R, 0.16 * R, 24).rotateX(Math.PI / 2), capMat, { parent: vg, at: [0, 0, 0.0] });
          curveTube(spiralPts(0, 0, 0.09 * R, 0.29 * R, 2.2, 1), 0.04 * R, m.detail, { parent: vg, segments: 36, radialSegments: 5, name: 'volute-spiral' });
        }
      } else {
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          const c = Math.cos(a), s = Math.sin(a);
          curveTube([[s * 0.95 * R, y + 0.55 * bh, c * 0.95 * R], [s * 1.2 * R, y + 0.8 * bh, c * 1.2 * R], [s * 1.42 * R, y + 0.94 * bh, c * 1.42 * R], [s * 1.36 * R, y + 0.86 * bh, c * 1.36 * R]], 0.06 * R, m.detail, { parent: g, segments: 20, radialSegments: 6, name: 'helix' });
        }
      }
      ab = 2.75 * R;
      mesh(concaveAbacus(ab, 0.24 * R), m.detail, { parent: g, at: [0, y + bh + 0.12 * R - 0.01, 0], name: 'abacus' });
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        mesh(new THREE.SphereGeometry(0.1 * R, 10, 8), m.accent, { parent: g, at: [Math.sin(a) * (ab / 2 - 0.12 * R), y + bh + 0.12 * R, Math.cos(a) * (ab / 2 - 0.12 * R)], name: 'fleuron' });
      }
      top = y + bh + 0.24 * R - 0.01;
    }
  } else if (order === 'egyptian') {
    for (let i = 0; i < 5; i++) mesh(new THREE.TorusGeometry(rt * 0.97, 0.04 * R, 6, 40).rotateX(Math.PI / 2), i % 2 ? m.accent : m.detail, { parent: g, at: [0, y - 0.1 * R - i * 0.08 * R, 0], name: 'band' });
    const ch = 1.5 * R;
    mesh(lathe([[0, 0], [rt * 0.92, 0], [1.0 * R, 0.2 * ch], [1.3 * R, 0.6 * ch], [1.55 * R, 0.92 * ch], [1.58 * R, ch], [0, ch]], 48), capMat, { parent: g, at: [0, y - 0.01, 0], name: 'papyrus-capital' });
    // painted sepals on the bell
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      curveTube([[Math.cos(a) * 0.98 * R, y + 0.15 * ch, Math.sin(a) * 0.98 * R], [Math.cos(a) * 1.28 * R, y + 0.6 * ch, Math.sin(a) * 1.28 * R], [Math.cos(a) * 1.56 * R, y + 0.97 * ch, Math.sin(a) * 1.56 * R]], 0.035 * R, m.detail, { parent: g, segments: 10, radialSegments: 5, name: 'sepal' });
    }
    ab = 1.7 * R;
    mesh(roundedBox(ab, 0.35 * R, ab, 0.03 * R), m.stone2, { parent: g, at: [0, y + ch + 0.17 * R - 0.02, 0], name: 'abacus' });
    top = y + ch + 0.35 * R - 0.02;
  } else if (order === 'minoan') {
    mesh(lathe([[0, 0], [R * 1.0, 0], [1.25 * R, 0.1 * R], [1.38 * R, 0.3 * R], [1.25 * R, 0.5 * R], [1.0 * R, 0.6 * R], [0, 0.6 * R]], 40), capMat, { parent: g, at: [0, y - 0.01, 0], name: 'cushion' });
    mesh(new THREE.TorusGeometry(R * 1.0, 0.06 * R, 8, 40).rotateX(Math.PI / 2), m.detail, { parent: g, at: [0, y, 0], name: 'collar' });
    ab = 2.5 * R;
    mesh(roundedBox(ab, 0.42 * R, ab, 0.03 * R), capMat, { parent: g, at: [0, y + 0.6 * R + 0.2 * R - 0.02, 0], name: 'abacus' });
    top = y + 1.0 * R - 0.02;
  }
  return { g, top, abacus: ab, R };
}
function paintW(T, c) {
  const m = new THREE.MeshStandardMaterial({ name: 'stone', color: c, roughness: 0.75, vertexColors: true });
  m.userData.weather = true;
  return m;
}

/* --------------------------------- column type --------------------------------- */

const COLUMN_VARIANTS = Object.fromEntries(Object.keys(ORDERS).map((k) => [k, {}]));

export function createColumn(options = {}) {
  const { variant, T } = setup(options, COLUMN_VARIANTS, 'classical-column');
  const root = group(`classical-column-${variant}`);
  const c = buildColumn(root, T, variant, {});
  // a slice of entablature on top for gilded/polychrome showpieces
  if (T.paint || T.gild) {
    const w = c.abacus * 1.02;
    mesh(roundedBox(w, 0.3 * c.R * 2, w, 0.02), T.mats.detail, { parent: root, at: [0, c.top + 0.3 * c.R - 0.005, 0], name: 'impost' });
  }
  if (T.ruin) {
    const H = c.top;
    ruinCut(root, T, H * (0.38 + T.r() * 0.25), { jag: c.R * 0.35 });
    rubble(root, T, new THREE.Box3(new THREE.Vector3(-c.R * 1.4, 0, -c.R * 1.4), new THREE.Vector3(c.R * 1.4, 1, c.R * 1.4)), 6, c.R * 0.6);
  }
  return done(root, T);
}

/* ------------------------------- entablature ------------------------------- */

/**
 * Entablature (architrave + frieze + cornice) from x0..x1 at height y, depth d, centred on z=zc.
 * order selects triglyph frieze (doric/tuscan) or dentils (ionic/corinthian). Returns top y.
 */
export function entablature(parent, T, order, x0, x1, y, d, U, zc = 0) {
  const m = T.mats;
  const L = x1 - x0, cx = (x0 + x1) / 2;
  const g = group('entablature', { parent });
  const ah = 1.1 * U;
  mesh(roundedBox(L, ah, d, 0.02 * U), m.stone, { parent: g, at: [cx, y + ah / 2, zc], name: 'architrave' });
  if (order !== 'doric' && order !== 'tuscan') for (let i = 1; i < 3; i++) mesh(roundedBox(L + 0.01, 0.04 * U, d + 0.02 * U * i, 0.01 * U), m.stone, { parent: g, at: [cx, y + (ah * i) / 3, zc], name: 'fascia' });
  let yy = y + ah;
  mesh(roundedBox(L + 0.04 * U, 0.12 * U, d + 0.06 * U, 0.02 * U), m.accent, { parent: g, at: [cx, yy + 0.05 * U, zc], name: 'taenia' });
  yy += 0.1 * U;
  const fh = 1.0 * U;
  mesh(roundedBox(L - 0.02, fh, d - 0.08 * U, 0.02 * U), order === 'doric' || order === 'tuscan' ? m.stone : m.detail, { parent: g, at: [cx, yy + fh / 2, zc], name: 'frieze' });
  if (order === 'doric' || order === 'tuscan') {
    const n = Math.max(2, Math.round(L / (1.25 * U)));
    const tg = [];
    for (let i = 0; i <= n; i++) {
      const x = x0 + 0.33 * U + ((L - 0.66 * U) * i) / n;
      for (const s of [-1, 1]) tg.push({ p: [x, yy + fh / 2, zc + s * (d / 2 - 0.04 * U)], s: [0.62 * U, fh * 0.98, 0.12 * U] });
    }
    const tri = roundedBox(1, 1, 1, 0.08, 2);
    instanced(tri, m.detail, tg, g, 'triglyphs');
    // grooves read as dark stripes
    const gr = [];
    for (const t of tg) for (const k of [-0.15, 0.15]) gr.push({ p: [t.p[0] + k * U, t.p[1], t.p[2] + Math.sign(t.p[2] - zc) * 0.065 * U], s: [0.07 * U, fh * 0.8, 0.02 * U] });
    instanced(new THREE.BoxGeometry(1, 1, 1), m.dark, gr, g, 'glyphs');
  } else {
    const n = Math.round(L / (0.22 * U));
    const dn = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.11 * U + ((L - 0.22 * U) * i) / Math.max(1, n - 1);
      for (const s of [-1, 1]) dn.push({ p: [x, yy + fh + 0.1 * U, zc + s * (d / 2 + 0.02 * U)], s: [0.12 * U, 0.18 * U, 0.14 * U] });
    }
    instanced(roundedBox(1, 1, 1, 0.1, 1), m.stone, dn, g, 'dentils');
  }
  yy += fh;
  // cornice: bed moulding, corona with drip, sima
  mesh(roundedBox(L + 0.2 * U, 0.2 * U, d + 0.2 * U, 0.04 * U), m.stone, { parent: g, at: [cx, yy + 0.1 * U, zc], name: 'bed-moulding' });
  mesh(roundedBox(L + 0.55 * U, 0.42 * U, d + 0.55 * U, 0.06 * U), m.accent, { parent: g, at: [cx, yy + 0.38 * U, zc], name: 'corona' });
  mesh(roundedBox(L + 0.6 * U, 0.18 * U, d + 0.6 * U, 0.07 * U), m.stone, { parent: g, at: [cx, yy + 0.66 * U, zc], name: 'sima' });
  return yy + 0.74 * U;
}

/** Triangular pediment (tympanum, raking cornice, acroteria) on top of y, spanning L, depth d. */
export function pediment(parent, T, cx, y, L, d, U, { relief = true, zc = 0 } = {}) {
  const m = T.mats;
  const g = group('pediment', { parent });
  const h = L * 0.13 + U * 0.4;
  const half = L / 2;
  const tri = extrudeOutline([[-half, 0], [half, 0], [0, h]], d, { bevel: 0.03 * U });
  mesh(tri, m.stone, { parent: g, at: [cx, y - 0.02, zc], name: 'tympanum' });
  // raking cornices
  const sl = Math.hypot(half, h), ang = Math.atan2(h, half);
  for (const s of [-1, 1]) {
    mesh(roundedBox(sl + 0.4 * U, 0.42 * U, d + 0.5 * U, 0.06 * U), m.accent, { parent: g, at: [cx + (s * half) / 2, y + h / 2 + 0.12 * U, zc], rot: [0, 0, -s * ang], name: 'raking-cornice' });
  }
  // relief figures in the tympanum: abstract shields, garlands and a central roundel
  if (relief) {
    const fz = zc + d / 2 + 0.02 * U;
    mesh(new THREE.CylinderGeometry(h * 0.22, h * 0.22, 0.1 * U, 32).rotateX(Math.PI / 2), m.detail, { parent: g, at: [cx, y + h * 0.36, fz], name: 'roundel' });
    for (const s of [-1, 1]) {
      for (let i = 1; i <= 2; i++) {
        const px = cx + s * (h * 0.22 + i * half * 0.22);
        const ph = h * (1 - (Math.abs(px - cx) / half)) * 0.6;
        if (ph < U * 0.2) continue;
        mesh(roundedBox(half * 0.12, ph, 0.12 * U, 0.04 * U), m.detail, { parent: g, at: [px, y + 0.05 * U + ph / 2, fz], name: 'relief' });
      }
    }
  }
  // acroteria (palmettes)
  const palm = (px, py, k) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.3 * k, 0);
    shape.quadraticCurveTo(-0.55 * k, 0.6 * k, -0.15 * k, 1.0 * k);
    shape.quadraticCurveTo(0, 1.25 * k, 0.15 * k, 1.0 * k);
    shape.quadraticCurveTo(0.55 * k, 0.6 * k, 0.3 * k, 0);
    shape.lineTo(-0.3 * k, 0);
    mesh(extrudeOutline(shape, 0.12 * k, { bevel: 0.02 * k }), m.accent, { parent: g, at: [px, py, zc], name: 'acroterion' });
  };
  palm(cx, y + h + 0.3 * U, U * 1.2);
  palm(cx - half - 0.1 * U, y + 0.3 * U, U * 0.9);
  palm(cx + half + 0.1 * U, y + 0.3 * U, U * 0.9);
  return { h, g };
}

/** Stepped platform (crepidoma): n steps, top size w×d, step height sh. Returns top y. */
export function steps(parent, T, w, d, n, sh, tread, { x = 0, z = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const k = n - 1 - i;
    mesh(roundedBox(w + 2 * tread * k, sh + 0.01, d + 2 * tread * k, Math.min(0.03, sh * 0.15)), i === n - 1 ? T.mats.stone : T.mats.stone2, { parent, at: [x, i * sh + sh / 2, z], name: 'step' });
  }
  return n * sh;
}

/** Ridged roof of clay tiles over the rectangle, pitched along x. */
function tiledRoof(parent0, T, cx, y, L, D, h, U) {
  const m = T.mats;
  const parent = group('roof-group', { parent: parent0 });
  const tileMat = T.gild ? m.gold : T.snow ? m.stone2 : (m.roofTile ??= weatherClay(T));
  const half = D / 2;
  const sl = Math.hypot(half, h), ang = Math.atan2(h, half);
  for (const s of [-1, 1]) {
    mesh(roundedBox(L, 0.16 * U, sl + 0.25 * U, 0.04 * U), tileMat, { parent, at: [cx, y + h / 2, (s * half) / 2], rot: [s * ang, 0, 0], name: 'roof' });
    // cover tile ridges
    const n = Math.round(L / (0.42 * U));
    const items = [];
    for (let i = 0; i < n; i++) {
      const x = cx - L / 2 + 0.21 * U + ((L - 0.42 * U) * i) / Math.max(1, n - 1);
      items.push({ p: [x, y + h / 2 + Math.cos(ang) * 0.09 * U, (s * half) / 2 + s * Math.sin(ang) * -0.09 * U * 0], r: [s * ang, 0, 0], s: [0.07 * U, 0.06 * U, sl + 0.2 * U] });
    }
    instanced(new THREE.CylinderGeometry(1, 1, 1, 8, 1).rotateX(Math.PI / 2), tileMat, items, parent, 'cover-tiles');
  }
  mesh(new THREE.CylinderGeometry(0.12 * U, 0.12 * U, L + 0.1 * U, 12).rotateZ(Math.PI / 2), tileMat, { parent, at: [cx, y + h + 0.02 * U, 0], name: 'ridge' });
  return parent;
}
function weatherClay(T) {
  const m = new THREE.MeshStandardMaterial({ name: 'stone', color: T.wear ? '#8f5a3c' : '#b4532f', roughness: 0.8, vertexColors: true });
  m.userData.weather = true;
  return m;
}

/* ------------------------------- temple pieces ------------------------------- */

const TEMPLE_VARIANTS = {
  colonnade: { order: 'doric' },
  pediment: { order: 'ionic' },
  steps: { order: 'doric' },
  'prostyle-temple': { order: 'ionic' },
  'peripteral-temple': { order: 'doric' },
  tholos: { order: 'corinthian' },
  altar: {},
  aedicula: { order: 'corinthian' },
};

export function createTemplePiece(options = {}) {
  const { variant, T } = setup(options, TEMPLE_VARIANTS, 'temple-piece');
  const root = group(`temple-piece-${variant}`);
  const m = T.mats;
  const order = TEMPLE_VARIANTS[variant].order;
  const anims = [];
  if (variant === 'colonnade' || variant === 'steps' || variant === 'pediment') {
    const D = 0.7, U = D / 2;
    const n = variant === 'steps' ? 4 : variant === 'pediment' ? 4 : 4;
    const span = 2.0 * D + D;
    const L = (n - 1) * span;
    const sy = steps(root, T, L + 1.4 * D, 2.2 * D, 3, 0.3, 0.32);
    if (variant === 'steps') {
      // platform with column bases and two drum stumps in place
      for (let i = 0; i < n; i++) {
        const x = -L / 2 + i * span;
        const cg = group('stump', { parent: root, at: [x, sy - 0.005, 0] });
        const hgt = i % 3 === 0 ? 1.2 : 0.4 + i * 0.15;
        mesh(shaftGeo(U, hgt, { kind: 'doric', flutes: 20, depth: 0.05 }), m.stone, { parent: cg, name: 'drum' });
      }
      mesh(shaftGeo(U * 0.98, 0.9, { kind: 'doric', depth: 0.05 }).rotateZ(Math.PI / 2), m.stone, { parent: root, at: [L / 2 + 0.6, U * 0.95, 1.8 * D + 0.4], rot: [0, 0.4, 0], name: 'fallen-drum' });
    } else {
      let top = 0;
      for (let i = 0; i < n; i++) {
        const c = buildColumn(root, T, order, { D, x: -L / 2 + i * span, base: order !== 'doric', Hs: order === 'doric' ? 5.2 : 8 });
        c.g.position.y = sy - 0.005;
        top = sy - 0.005 + c.top;
      }
      const et = entablature(root, T, order, -L / 2 - D * 0.75, L / 2 + D * 0.75, top - 0.005, 1.9 * D, U);
      if (variant === 'pediment') pediment(root, T, 0, et - 0.01, L + 1.5 * D, 1.5 * D, U);
    }
    if (T.ruin) ruinCut(root, T, variant === 'steps' ? 0.9 : 3.2, { jag: 0.5, slope: 0.25, topple: variant !== 'steps' });
    if (T.ruin) rubble(root, T, new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(L + 1.4 * D, 1, 2.2 * D)), 10, 0.4);
  } else if (variant === 'prostyle-temple' || variant === 'peripteral-temple') {
    const peri = variant === 'peripteral-temple';
    const D = peri ? 0.75 : 0.65, U = D / 2;
    const nx = peri ? 6 : 4, nz = peri ? 9 : 0;
    const span = 2.6 * D;
    const W = (nx - 1) * span;
    const Lz = peri ? (nz - 1) * span : 4 * span;
    const sy = steps(root, T, W + 1.6 * D, Lz + 1.6 * D, 3, 0.32, 0.36);
    const colH = order === 'doric' ? 5.4 : 8.5;
    let top = 0;
    const pos = [];
    if (peri) {
      for (let i = 0; i < nx; i++) for (const zz of [-Lz / 2, Lz / 2]) pos.push([-W / 2 + i * span, zz]);
      for (let j = 1; j < nz - 1; j++) for (const xx of [-W / 2, W / 2]) pos.push([xx, -Lz / 2 + j * span]);
    } else {
      for (let i = 0; i < nx; i++) pos.push([-W / 2 + i * span, Lz / 2]);
    }
    for (const [x, z] of pos) {
      const c = buildColumn(root, T, order, { D, x, z, base: order !== 'doric', Hs: colH });
      c.g.position.y = sy - 0.005;
      top = sy - 0.005 + c.top;
    }
    // cella with door
    const cw = peri ? W - 2 * span + D : W - 0.2 * D;
    const cl = peri ? Lz - 2.6 * span : Lz - 1.2 * span;
    const cz = peri ? 0 : -span * 0.6;
    const ch = top - sy;
    mesh(roundedBox(cw, ch + 0.01, cl, 0.04), m.stone, { parent: root, at: [0, sy + ch / 2 - 0.005, cz], name: 'cella' });
    const doorZ = cz + cl / 2;
    mesh(roundedBox(cw * 0.34, ch * 0.62, 0.12, 0.03), m.accent, { parent: root, at: [0, sy + ch * 0.31, doorZ + 0.02], name: 'door-frame' });
    mesh(roundedBox(cw * 0.26, ch * 0.56, 0.1, 0.02), T.gild ? m.gold : (m.bronzeDoor ??= M.metal(T.wear ? '#4f6f5f' : '#7b5634', 0.45)), { parent: root, at: [0, sy + ch * 0.28, doorZ + 0.05], name: 'door' });
    // pilasters (antae) on the cella front corners
    for (const s of [-1, 1]) mesh(roundedBox(0.5 * D, ch, 0.5 * D, 0.03), m.stone2, { parent: root, at: [s * (cw / 2 - 0.2 * D), sy + ch / 2, doorZ - 0.05], name: 'anta' });
    const eL = peri ? Lz + 1.5 * D : Lz + 0.8 * D;
    const ez = peri ? 0 : -0.1 * span;
    // entablature runs along x for each face; simplest: one long block along z on each side + front/back
    const egr = group('entablature-ring', { parent: root });
    const et = entablature(egr, T, order, -W / 2 - D * 0.75, W / 2 + D * 0.75, top - 0.005, eL, U, ez);
    pediment(root, T, 0, et - 0.01, W + 1.5 * D, 0.9 * D, U, { zc: ez + eL / 2 - 0.45 * D });
    pediment(root, T, 0, et - 0.01, W + 1.5 * D, 0.9 * D, U, { zc: ez - eL / 2 + 0.45 * D, relief: false });
    const rg = tiledRoof(root, T, 0, et - 0.02, eL - 0.6 * D, W + 1.9 * D, (W + 1.5 * D) * 0.13 + U * 0.4, U);
    rg.rotation.y = Math.PI / 2;
    rg.position.z = ez;
    if (T.ruin) {
      ruinCut(root, T, sy + ch * 0.55, { jag: 1.0, slope: 0.12, topple: false });
      rubble(root, T, new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(W + 2 * D, 1, Lz + 2 * D)), 22, 0.7);
    }
  } else if (variant === 'tholos') {
    const D = 0.55, U = D / 2;
    const n = 12, Rr = 4.2;
    const sy = steps(root, T, 0, 0, 0, 0, 0);
    void sy;
    // round stepped podium
    for (let i = 0; i < 3; i++) mesh(lathe([[0, 0], [Rr + 0.9 - i * 0.3, 0], [Rr + 0.9 - i * 0.3, 0.3], [0, 0.3]], 64), i === 2 ? m.stone : m.stone2, { parent: root, at: [0, i * 0.3 - 0.003 * i, 0], name: 'podium' });
    const py = 0.9 - 0.006;
    let top = 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const c = buildColumn(root, T, order, { D, x: Math.cos(a) * Rr, z: Math.sin(a) * Rr, Hs: 9.5 });
      c.g.position.y = py;
      top = py + c.top;
    }
    const ch = top - py;
    mesh(lathe([[0, 0], [Rr - 1.0, 0], [Rr - 1.0, ch], [0, ch]], 48), m.stone, { parent: root, at: [0, py - 0.005, 0], name: 'cella' });
    mesh(roundedBox(1.2, ch * 0.6, 0.3, 0.03), m.accent, { parent: root, at: [0, py + ch * 0.3, Rr - 1.0], name: 'door' });
    // ring entablature + conical roof
    const rt = top - 0.006;
    mesh(lathe([[Rr - 0.5, 0], [Rr + 0.42, 0], [Rr + 0.42, 0.5], [Rr + 0.46, 0.55], [Rr + 0.46, 0.85], [Rr + 0.62, 0.95], [Rr + 0.62, 1.15], [Rr - 0.5, 1.15]], 64), m.stone, { parent: root, at: [0, rt, 0], name: 'ring-entablature' });
    mesh(lathe([[Rr - 0.6, 0], [Rr - 0.5, 0], [Rr + 0.05, 1.15]], 48), m.stone, { parent: root, at: [0, rt, 0], name: 'ring-inner' });
    mesh(lathe([[0, 0], [Rr + 0.75, 0], [Rr + 0.7, 0.12], [Rr * 0.5, 1.4], [0.35, 2.1], [0, 2.15]], 64), T.gild ? m.gold : T.snow ? m.stone2 : (m.roofTile ??= weatherClay(T)), { parent: root, at: [0, rt + 1.13, 0], name: 'roof' });
    mesh(lathe([[0, 0], [0.4, 0], [0.32, 0.25], [0.12, 0.6], [0.18, 0.8], [0, 0.95]], 24), m.accent, { parent: root, at: [0, rt + 3.25, 0], name: 'finial' });
    if (T.ruin) {
      ruinCut(root, T, 3.2, { jag: 1.2, slope: 0.2, topple: false });
      rubble(root, T, new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2 * Rr, 1, 2 * Rr)), 18, 0.55);
    }
  } else if (variant === 'altar') {
    // stepped altar with volute-ended table and a fire bowl
    steps(root, T, 3.0, 1.8, 2, 0.22, 0.3);
    const y0 = 0.44;
    mesh(roundedBox(2.6, 0.18, 1.4, 0.03), m.stone2, { parent: root, at: [0, y0 + 0.09 - 0.005, 0], name: 'altar-base' });
    mesh(roundedBox(2.3, 0.9, 1.15, 0.04), m.stone, { parent: root, at: [0, y0 + 0.18 + 0.45 - 0.01, 0], name: 'altar-body' });
    // garland and bucrania-free plain roundels
    for (const s of [-1, 0, 1]) mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 24), m.detail, { parent: root, at: [s * 0.7, y0 + 0.65, 0.58], name: 'roundel' });
    curveTube([[-0.7, y0 + 0.78, 0.585], [-0.35, y0 + 0.55, 0.6], [0, y0 + 0.78, 0.585], [0.35, y0 + 0.55, 0.6], [0.7, y0 + 0.78, 0.585]], 0.035, m.accent, { parent: root, segments: 40, name: 'garland' });
    const ty = y0 + 1.07 - 0.015;
    mesh(roundedBox(2.5, 0.16, 1.3, 0.04), m.accent, { parent: root, at: [0, ty + 0.08, 0], name: 'altar-top' });
    for (const s of [-1, 1]) {
      const bol = lathe([[0, -0.66], [0.17, -0.66], [0.18, -0.6], [0.12, -0.3], [0.11, 0], [0.12, 0.3], [0.18, 0.6], [0.17, 0.66], [0, 0.66]], 20).rotateX(Math.PI / 2);
      mesh(bol, m.stone, { parent: root, at: [s * 1.05, ty + 0.27, 0], name: 'volute-roll' });
      for (const z of [-1, 1]) curveTube(spiralPts(s * 1.05, ty + 0.27, z * 0.665, 0.16, 2, s), 0.022, m.detail, { parent: root, segments: 40, radialSegments: 5, name: 'volute-spiral' });
    }
    mesh(lathe([[0, 0], [0.22, 0], [0.32, 0.12], [0.34, 0.16], [0.3, 0.16], [0.2, 0.05], [0, 0.05]], 32), m.bronze, { parent: root, at: [0, ty + 0.155, 0], name: 'fire-bowl' }).material.side = THREE.DoubleSide;
  } else if (variant === 'aedicula') {
    // small columned shrine niche on a podium
    const D = 0.32, U = D / 2;
    mesh(roundedBox(2.4, 1.0, 1.4, 0.04), m.stone2, { parent: root, at: [0, 0.5, 0], name: 'podium' });
    mesh(roundedBox(2.5, 0.12, 1.5, 0.03), m.accent, { parent: root, at: [0, 1.04, 0], name: 'podium-cap' });
    let top = 0;
    for (const s of [-1, 1]) {
      const c = buildColumn(root, T, order, { D, x: s * 0.95, z: 0.45, Hs: 9 });
      c.g.position.y = 1.095;
      top = 1.095 + c.top;
    }
    mesh(roundedBox(1.6, top - 1.1, 0.6, 0.04), m.stone, { parent: root, at: [0, (top + 1.1) / 2 - 0.005, -0.35], name: 'niche-wall' });
    mesh(lathe([[0, 0], [0.28, 0], [0.26, 0.2], [0.16, 0.5], [0.2, 0.9], [0.12, 1.1], [0, 1.15]], 24), T.gild ? m.gold : m.detail, { parent: root, at: [0, 1.095, -0.05 + 0.0], name: 'votive-urn' });
    const et = entablature(root, T, 'corinthian', -1.15, 1.15, top - 0.005, 1.25, U, 0.0);
    pediment(root, T, 0, et - 0.01, 2.3, 1.0, U, { zc: 0.0 });
    if (T.ruin) { ruinCut(root, T, 1.8, { jag: 0.4, slope: 0.3 }); rubble(root, T, new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(2.4, 1, 1.4)), 7, 0.25); }
  }
  if (T.ruin && variant === 'altar') { ruinCut(root, T, 1.1, { jag: 0.25, slope: 0.15 }); rubble(root, T, new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(3, 1, 1.8)), 6, 0.25); }
  return done(root, T, anims);
}

export { spiralPts, acanthusGeo, tiledRoof, weatherClay };
void blockGeo;
