// Building blocks (generic stud bricks + wooden unit blocks), wooden train sets and baby toys.
import {
  THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, tube, merged, toyMat, toyFactory, softBox, wheel,
  canvasTex, RUBBER, BLACK, WHITE, clip, spinTrack, rotateTrack, moveTrack, wave, pingPong,
} from './kit.js';

/* ============================== BUILDING BLOCKS ============================== */
const P = 0.008; // stud pitch
const BH = 0.0096; // brick height

const _brickGeo = new Map();
/** Generic stud brick, hollow underneath. Origin at bottom centre. Returns mesh. */
function brick(parent, nx, nz, mat, T, { at = [0, 0, 0], h = BH, rotY = 0, slope = false } = {}) {
  const w = nx * P - 0.0002;
  const d = nz * P - 0.0002;
  if (T.style === 'wood') {
    // wooden unit block: solid, softly rounded, no studs
    return mesh(softBox(w, h * 1.2, d, 0.12, T).translate(0, h * 0.6, 0), mat, { parent, at, rot: [0, rotY, 0] });
  }
  if (T.puff) {
    const g = group(null, { parent, at, rot: [0, rotY, 0] });
    mesh(softBox(w, h, d, 0.3, T).translate(0, h / 2, 0), mat, { parent: g });
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      mesh(new THREE.SphereGeometry(P * 0.3, 12, 8).scale(1, 0.6, 1), mat, { parent: g, at: [(i - (nx - 1) / 2) * P, h * 1.02, (k - (nz - 1) / 2) * P] });
    }
    return g;
  }
  const key = `${nx},${nz},${h},${slope}`;
  if (_brickGeo.has(key)) return mesh(_brickGeo.get(key).clone(), mat, { parent, at, rot: [0, rotY, 0] });
  const t = 0.0012;
  const geos = [];
  if (slope) {
    const pr = [[-w / 2, 0], [w / 2, 0], [w / 2, h * 0.33], [-w / 2 + P * 0.9, h * 1.0], [-w / 2, h]];
    geos.push(extrudeOutline(pr, d, { bevel: 0.0004, segments: 1 }));
  } else {
    geos.push(roundedBox(w, t, d, 0.0004, 1).translate(0, h - t / 2, 0));
    geos.push(roundedBox(w, h, t, 0.0004, 1).translate(0, h / 2, d / 2 - t / 2));
    geos.push(roundedBox(w, h, t, 0.0004, 1).translate(0, h / 2, -d / 2 + t / 2));
    geos.push(roundedBox(t, h, d, 0.0004, 1).translate(w / 2 - t / 2, h / 2, 0));
    geos.push(roundedBox(t, h, d, 0.0004, 1).translate(-w / 2 + t / 2, h / 2, 0));
    if (nx * nz <= 16) for (let i = 0; i < nx - 1; i++) for (let k = 0; k < nz - 1; k++) {
      geos.push(new THREE.CylinderGeometry(P * 0.4, P * 0.4, h - t, 12, 1, true).translate((i - (nx - 2) / 2) * P, (h - t) / 2, (k - (nz - 2) / 2) * P));
    }
  }
  const sx = slope ? 1 : nx;
  for (let i = 0; i < sx; i++) for (let k = 0; k < nz; k++) {
    const x = slope ? -w / 2 + P * 0.5 : (i - (nx - 1) / 2) * P;
    geos.push(new THREE.CylinderGeometry(P * 0.3, P * 0.3, 0.0017, nx * nz > 16 ? 8 : 12).translate(x, h + 0.00085, (k - (nz - 1) / 2) * P));
  }
  const m = merged(geos, mat, { parent, at, rot: [0, rotY, 0] });
  if (!slope) m.material = mat;
  _brickGeo.set(key, m.geometry.clone());
  return m;
}

function blockMats(c) {
  const n = c.T.style === 'rainbow' ? 6 : 4;
  return Array.from({ length: n }, (_, i) => c.m(i));
}

export const BLOCK_VARIANTS = {
  'brick-pair': {}, tower: {}, wall: {}, 'little-house': {}, 'brick-pile': {}, 'alphabet-blocks': {}, 'arch-bridge': {}, 'base-plate': {},
};

export const createToyBlocks = toyFactory('toy-blocks', BLOCK_VARIANTS, (c) => {
  const { root, T, variant, r } = c;
  const mats = blockMats(c);
  const H = T.style === 'wood' ? BH * 1.2 : BH;
  const pick = (i) => mats[i % mats.length];
  if (variant === 'brick-pair') {
    brick(root, 4, 2, pick(0), T);
    brick(root, 2, 2, pick(1), T, { at: [P, H, 0], rotY: 0 });
    brick(root, 4, 2, pick(2), T, { at: [-P * 1.0, H * (T.style === 'wood' ? 1 : 1) + (T.style === 'wood' ? 0 : 0), 0], rotY: Math.PI / 2 }).position.y = H;
  } else if (variant === 'tower') {
    for (let i = 0; i < 10; i++) brick(root, i % 2 ? 2 : 4, 2, pick(i), T, { at: [0, i * H, 0], rotY: i % 4 === 1 ? Math.PI / 2 : 0 });
  } else if (variant === 'wall') {
    for (let row = 0; row < 5; row++) {
      const off = row % 2 ? 2 : 0;
      for (let i = -1; i < 3; i++) {
        const x = (i * 4 + off - 4) * P + 2 * P;
        if (row % 2 && i === 2) continue;
        brick(root, 4, 2, pick(row + i + 1), T, { at: [x, row * H, 0] });
      }
    }
  } else if (variant === 'little-house') {
    brick(root, 16, 12, toyMat(T.kind === 'rawwood' ? 'rawwood' : T.kind, T.pal[3]), T, { h: BH / 3 });
    const base = BH / 3 + (T.style === 'wood' ? BH * 0.4 * 0 : 0);
    const y0 = T.style === 'wood' ? BH * 0.4 : BH / 3;
    for (let row = 0; row < 4; row++) {
      const y = y0 + row * H;
      for (let i = 0; i < 4; i++) {
        if (row < 3 && i === 1) continue; // door
        brick(root, 4, 1, pick(0 + (row % 2)), T, { at: [(i * 4 - 6) * P, y, 5.5 * P] });
        if (!(row === 1 || row === 2) || i % 3 === 0) brick(root, 4, 1, pick(0 + (row % 2)), T, { at: [(i * 4 - 6) * P, y, -5.5 * P] });
      }
      for (let k = 0; k < 3; k++) {
        if (row === 2 && k === 1) continue; // windows
        brick(root, 1, 3, pick(row % 2), T, { at: [7.5 * P, y, (k * 3 - 3) * P] });
        brick(root, 1, 3, pick(row % 2), T, { at: [-7.5 * P, y, (k * 3 - 3) * P] });
      }
    }
    const ry = y0 + 4 * H;
    brick(root, 16, 12, pick(2), T, { at: [0, ry, 0], h: BH / 3 });
    for (let k = 0; k < 3; k++) {
      const yy = ry + BH / 3 + k * H;
      brick(root, 16 - k * 4, 3, pick(1 + 1), T, { at: [0, yy, (4.5 - k * 0) * P - k * 1.5 * P] }).scale.x = 1;
      brick(root, 16 - k * 4, 3, pick(1 + 1), T, { at: [0, yy, (-4.5) * P + k * 1.5 * P] });
    }
    void base;
  } else if (variant === 'brick-pile') {
    const spots = [[0, 0, 0, 4, 2, 0], [P * 5, 0, P, 2, 2, 0.4], [-P * 5, 0, -P, 4, 2, 1.2], [P, 0, P * 4, 2, 2, 0.9], [-P * 2, 0, -P * 4, 4, 1, -0.3], [P * 4, 0, -P * 4, 2, 1, 2.1], [-P * 4, 0, P * 3, 3, 2, 0.6], [0, 1, 0, 2, 2, 0.2], [P * 5, 1, P, 2, 1, -0.6], [-P * 5, 1, -P, 2, 2, 0.8], [P * 0.5, 2, 0, 2, 1, 1.4]];
    spots.forEach(([x, lv, z, nx, nz, ry], i) => brick(root, nx, nz, pick(i), T, { at: [x, lv * H, z], rotY: ry }));
  } else if (variant === 'alphabet-blocks') {
    const s = 0.04;
    const letters = 'ABCDEF';
    const layout = [[-1, 0], [0, 0], [1, 0], [-0.5, 1], [0.5, 1], [0, 2]];
    layout.forEach(([x, lv], i) => {
      const map = canvasTex(128, 128, (g, w, h) => {
        g.fillStyle = T.kind === 'rawwood' ? '#e2c391' : '#' + M.toColor(T.pal[i % 4]).getHexString();
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#ffffffaa'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
        g.fillStyle = T.kind === 'rawwood' ? '#' + M.toColor(['#b8432f', '#2e6da4', '#e0ad3a', '#4f8a3c'][i % 4]).getHexString() : '#ffffff';
        g.font = 'bold 92px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letters[i], w / 2, h / 2 + 4);
      }, `abc-${T.name}-${i}`);
      const mat = map ? new THREE.MeshStandardMaterial({ map, roughness: 0.55 }) : pick(i);
      mesh(softBox(s, s, s, 0.08, T), mat, { parent: root, at: [x * s * 1.04, s / 2 + lv * s, 0], rot: [0, (i - 2) * 0.08, 0] });
    });
  } else if (variant === 'arch-bridge') {
    const u = 0.035;
    const wd = T.style === 'wood' ? toyMat('rawwood', 'maple') : pick(0);
    for (const s of [-1, 1]) mesh(softBox(u, u * 3, u, 0.06, T), pick(1), { parent: root, at: [s * u * 2, u * 1.5, 0] });
    const sh = new THREE.Shape();
    sh.moveTo(-u * 2.5, 0); sh.lineTo(u * 2.5, 0); sh.lineTo(u * 2.5, u * 1.2); sh.lineTo(-u * 2.5, u * 1.2); sh.lineTo(-u * 2.5, 0);
    const hole = new THREE.Path(); hole.absarc(0, 0, u * 1.3, 0, Math.PI, false); hole.lineTo(u * 1.3, 0);
    sh.holes.push(hole);
    mesh(extrudeOutline(sh, u, { bevel: 0.002, segments: 2 }), wd, { parent: root, at: [0, u * 3, 0] });
    mesh(softBox(u * 6, u * 0.5, u * 1.2, 0.1, T), pick(2), { parent: root, at: [0, u * 4.45, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(u * 0.4, u * 0.4, u * 1.2, 24), pick(3), { parent: root, at: [s * u * 2, u * 5.3, 0] });
    mesh(new THREE.ConeGeometry(u * 0.8, u * 1.1, 4).rotateY(Math.PI / 4), pick(0), { parent: root, at: [0, u * 5.25, 0] });
  } else if (variant === 'base-plate') {
    brick(root, 16, 16, toyMat(T.kind === 'rawwood' ? 'rawwood' : T.kind, T.style === 'wood' ? 'oak' : '#3f9a3a'), T, { h: BH / 3 });
    const y0 = T.style === 'wood' ? BH * 0.4 : BH / 3;
    // little tree
    brick(root, 2, 2, toyMat(T.kind, '#6b4423'), T, { at: [-4 * P, y0, -4 * P] });
    brick(root, 2, 2, toyMat(T.kind, '#6b4423'), T, { at: [-4 * P, y0 + H, -4 * P] });
    brick(root, 4, 4, toyMat(T.kind, '#2e8b3e'), T, { at: [-4 * P, y0 + H * 2, -4 * P] });
    brick(root, 2, 2, toyMat(T.kind, '#2e8b3e'), T, { at: [-4 * P, y0 + H * 3, -4 * P] });
    // car-ish
    brick(root, 2, 4, pick(0), T, { at: [4 * P, y0, 3 * P] });
    brick(root, 2, 2, pick(1), T, { at: [4 * P, y0 + H, 3 * P] });
    brick(root, 4, 2, pick(2), T, { at: [3 * P, y0, -4 * P] });
    brick(root, 2, 2, pick(3), T, { at: [-3 * P, y0, 5 * P] });
  }
}, { base: 'classic' });

/* ============================== WOODEN TRAIN ============================== */
const TW = 0.04; // track width
const TH = 0.012;

function grooveMat() { return toyMat('rawwood', '#7a5a3a'); }

function straightTrack(parent, len, at = [0, 0, 0], rotY = 0, T) {
  const g = group(null, { parent, at, rot: [0, rotY, 0] });
  const mat = T.style === 'tin' || T.style === 'space' ? toyMat('plastic', T.style === 'space' ? '#3d4452' : '#5a5f66') : T.kind === 'soft' || T.style === 'jumbo' ? toyMat('plastic', '#4a4f57') : toyMat('rawwood', 'maple');
  mesh(roundedBox(len, TH, TW, 0.002, 2).translate(0, TH / 2, 0), mat, { parent: g });
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(len - 0.002, 0.001, 0.006), grooveMat(), { parent: g, at: [0, TH, s * 0.011] });
  return g;
}

function curveTrack(parent, R, a0, a1, T) {
  const mat = T.style === 'tin' || T.style === 'space' || T.kind === 'soft' || T.style === 'jumbo' ? toyMat('plastic', '#4a4f57') : toyMat('rawwood', 'maple');
  const sh = new THREE.Shape();
  sh.absarc(0, 0, R + TW / 2, a0, a1, false);
  sh.absarc(0, 0, R - TW / 2, a1, a0, true);
  mesh(extrudeOutline(sh, TH, { bevel: 0.0015, segments: 1 }).rotateX(-Math.PI / 2).translate(0, TH / 2, 0), mat, { parent });
  for (const s of [-1, 1]) {
    const ring = new THREE.RingGeometry(R + s * 0.011 - 0.003, R + s * 0.011 + 0.003, 64, 1, a0, a1 - a0).rotateX(-Math.PI / 2);
    ring.scale(1, 1, -1);
    mesh(ring, grooveMat(), { parent, at: [0, TH + 0.0004, 0] }).material.side = THREE.DoubleSide;
  }
}

/** Steam (or bullet) engine. Origin bottom-centre at rail top, length along +X. Returns {g, wheels}. */
function engine(parent, c, { at = [0, TH, 0], rotY = 0, name = 'engine' } = {}) {
  const { T } = c;
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const wheels = [];
  const body = c.m(0);
  const trim = c.m(5);
  const wr = T.style === 'jumbo' || T.style === 'soft' ? 0.012 : 0.009;
  const bullet = T.style === 'space' || T.style === 'neon';
  mesh(c.box(0.11, 0.012, 0.034, 0.15), trim, { parent: g, at: [0, wr + 0.004, 0] });
  for (const x of [-0.035, 0, 0.035]) for (const s of [-1, 1]) {
    const wg = wheel(g, { r: wr, w: 0.006, at: [x, wr, s * 0.019], T, hub: T.pal[1] });
    wg.rotation.y = Math.PI / 2; wheels.push(wg);
  }
  const y0 = wr + 0.01;
  if (bullet) {
    const prof = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; prof.push([0.018 * Math.sin(Math.min(1, t * 1.6) * Math.PI / 2) ** 0.6, t * 0.06]); }
    const nose = mesh(lathe(prof, 28).rotateZ(-Math.PI / 2), body, { parent: g, at: [0.005, y0 + 0.018, 0] });
    nose.scale.set(1, 1.2, 1);
    mesh(c.box(0.06, 0.04, 0.034, 0.3), body, { parent: g, at: [-0.025, y0 + 0.02, 0] });
    mesh(roundedBox(0.05, 0.008, 0.035, 0.003), c.m(1), { parent: g, at: [-0.02, y0 + 0.012, 0] });
    mesh(roundedBox(0.03, 0.01, 0.036, 0.004), toyMat('clear', '#203048'), { parent: g, at: [-0.03, y0 + 0.03, 0] });
  } else {
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.065, 24).rotateZ(Math.PI / 2), body, { parent: g, at: [0.017, y0 + 0.014, 0] });
    mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.004, 24).rotateZ(Math.PI / 2), trim, { parent: g, at: [0.05, y0 + 0.014, 0] });
    const ch = T.style === 'tin' ? [[0.004, 0], [0.004, 0.012], [0.008, 0.02], [0.007, 0.022], [0, 0.022]] : [[0.005, 0], [0.005, 0.014], [0.007, 0.018], [0, 0.018]];
    mesh(lathe(ch, 16), trim, { parent: g, at: [0.038, y0 + 0.025, 0] });
    mesh(new THREE.SphereGeometry(0.006, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), c.m(2), { parent: g, at: [0.015, y0 + 0.026, 0] });
    mesh(c.box(0.035, 0.04, 0.034, 0.12), c.m(1), { parent: g, at: [-0.033, y0 + 0.02, 0] });
    mesh(c.box(0.042, 0.005, 0.04, 0.3), trim, { parent: g, at: [-0.033, y0 + 0.042, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(0.014, 0.012, 0.002, 0.002), BLACK, { parent: g, at: [-0.033, y0 + 0.028, s * 0.017] });
    if (T.style === 'tin') {
      // cow-catcher + wind-up key
      mesh(new THREE.ConeGeometry(0.014, 0.014, 4).rotateZ(-Math.PI / 2).rotateX(Math.PI / 4), toyMat('chrome', '#cccccc'), { parent: g, at: [0.062, wr + 0.004, 0] });
      const key = group(`${name}_key`, { parent: g, at: [-0.033, y0 + 0.02, -0.02] });
      tube([0, 0, 0], [0, 0, -0.008], 0.0015, toyMat('gold', '#d4a73a'), { parent: key });
      mesh(new THREE.TorusGeometry(0.005, 0.0015, 6, 16), toyMat('gold', '#d4a73a'), { parent: key, at: [0.005, 0, -0.008], rot: [0, Math.PI / 2, 0] });
      mesh(new THREE.TorusGeometry(0.005, 0.0015, 6, 16), toyMat('gold', '#d4a73a'), { parent: key, at: [-0.005, 0, -0.008], rot: [0, Math.PI / 2, 0] });
      c.anims.push(clip('windup', 1.5, [spinTrack(key, 'z', 1.5)]));
    }
  }
  return { g, wheels };
}

function wagon(parent, c, kind, i, at, rotY = 0) {
  const { T } = c;
  const g = group(`wagon${i}`, { parent, at, rot: [0, rotY, 0] });
  const wheels = [];
  const wr = T.style === 'jumbo' || T.style === 'soft' ? 0.012 : 0.009;
  mesh(c.box(0.085, 0.01, 0.034, 0.15), c.m(5), { parent: g, at: [0, wr + 0.004, 0] });
  for (const x of [-0.028, 0.028]) for (const s of [-1, 1]) { const w = wheel(g, { r: wr, w: 0.006, at: [x, wr, s * 0.019], T, hub: c.color(1) }); w.rotation.y = Math.PI / 2; wheels.push(w); }
  const y0 = wr + 0.009;
  const col = c.m(i + 1);
  if (kind === 'hopper') {
    // open, hollow
    mesh(roundedBox(0.075, 0.003, 0.032, 0.001), col, { parent: g, at: [0, y0 + 0.0015, 0] });
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.075, 0.022, 0.003, 0.001), col, { parent: g, at: [0, y0 + 0.011, s * 0.0145] });
      mesh(roundedBox(0.003, 0.022, 0.032, 0.001), col, { parent: g, at: [s * 0.036, y0 + 0.011, 0] });
    }
    for (let k = 0; k < 4; k++) mesh(new THREE.SphereGeometry(0.0075, 12, 8), c.m(k + 2), { parent: g, at: [-0.025 + k * 0.017, y0 + 0.01, (k % 2 - 0.5) * 0.01] });
  } else if (kind === 'logs') {
    mesh(roundedBox(0.08, 0.003, 0.034, 0.001), col, { parent: g, at: [0, y0 + 0.0015, 0] });
    for (const s of [-1, 1]) tube([s * 0.035, y0, -0.015], [s * 0.035, y0 + 0.024, -0.015], 0.0015, col, { parent: g }), tube([s * 0.035, y0, 0.015], [s * 0.035, y0 + 0.024, 0.015], 0.0015, col, { parent: g });
    for (const [y, z] of [[0.007, -0.0085], [0.007, 0.0085], [0.019, 0]]) mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.07, 14).rotateZ(Math.PI / 2), toyMat('rawwood', 'walnut'), { parent: g, at: [0, y0 + y, z] });
  } else if (kind === 'tanker') {
    mesh(new THREE.CapsuleGeometry(0.014, 0.05, 6, 20).rotateZ(Math.PI / 2), col, { parent: g, at: [0, y0 + 0.016, 0] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.006, 12), c.m(5), { parent: g, at: [0, y0 + 0.032, 0] });
  } else {
    // coach with windows
    mesh(c.box(0.08, 0.034, 0.034, 0.12), col, { parent: g, at: [0, y0 + 0.017, 0] });
    mesh(c.box(0.084, 0.005, 0.038, 0.3), c.m(5), { parent: g, at: [0, y0 + 0.036, 0] });
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) mesh(roundedBox(0.016, 0.012, 0.002, 0.002), toyMat('plastic', '#cfe8ff'), { parent: g, at: [-0.025 + k * 0.025, y0 + 0.022, s * 0.017] });
  }
  // magnet couplers
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.008, 10).rotateZ(Math.PI / 2), BLACK, { parent: g, at: [s * 0.045, wr + 0.004, 0] });
  return wheels;
}

export const TRAIN_VARIANTS = {
  engine: { pal: ['#d62828','#1d4ed8','#f4c20d','#2a9d3c','#f7f5f0','#222222'] }, 'freight-set': { pal: ['#2a6a3a','#8a4a2a','#e0ad3a','#5a5d62','#efe2c4','#222222'] }, 'passenger-set': { pal: ['#1d3a8a','#c8102e','#f2e6c8','#e0ad3a','#ffffff','#151515'] }, 'track-loop': { pal: ['#f4a9bf','#9fd2ee','#fbe39a','#b4e2c4','#fffaf2','#8f7f9a'] }, 'bridge-set': { pal: ['#c8102e','#f4c20d','#1d4ed8','#2a9d3c','#f7f5f0','#222222'] }, station: { pal: ['#7a1fd1','#f4c20d','#19e3ff','#ff2fb3','#f7f5f0','#222222'] }, 'log-hauler': { pal: ['#151515','#a0522d','#c8102e','#e0ad3a','#efe2c4','#2a1a10'] }, 'figure-eight': { pal: ['#f07a14','#2a9d3c','#1d4ed8','#f4c20d','#f7f5f0','#222222'] },
};

export const createToyTrain = toyFactory('toy-train', TRAIN_VARIANTS, (c) => {
  const { root, T, variant } = c;
  const wheels = [];
  const lineTrain = (kinds, x0, y = TH, len = 0.6) => {
    straightTrack(root, len, [x0 - len / 2 + 0.07, 0, 0], 0, T);
    wheels.push(...engine(root, c, { at: [x0, y, 0] }).wheels);
    kinds.forEach((k, i) => wheels.push(...wagon(root, c, k, i, [x0 - 0.1 - i * 0.092, y, 0])));
  };
  if (variant === 'engine') {
    straightTrack(root, 0.2, [0, 0, 0], 0, T);
    wheels.push(...engine(root, c).wheels);
  } else if (variant === 'freight-set') lineTrain(['hopper', 'tanker', 'logs'], 0.15);
  else if (variant === 'passenger-set') lineTrain(['coach', 'coach', 'coach'], 0.15);
  else if (variant === 'log-hauler') lineTrain(['logs', 'logs'], 0.1, TH, 0.45);
  else if (variant === 'track-loop' || variant === 'figure-eight') {
    const R = 0.2;
    if (variant === 'track-loop') curveTrack(root, R, 0, Math.PI * 2, T);
    else {
      curveTrack(root, R, 0, Math.PI * 2, T);
      const g2 = group(null, { parent: root, at: [R * 2, 0, 0] });
      curveTrack(g2, R, 0, Math.PI * 2, T);
    }
    const ring = group('ring', { parent: root });
    const train = group(null, { parent: ring, at: [0, 0, R] });
    wheels.push(...engine(train, c, { at: [0, TH, 0] }).wheels);
    const a = 0.1 / R;
    const wg = group(null, { parent: ring, rot: [0, -a * 0.95, 0] });
    wheels.push(...wagon(wg, c, 'coach', 0, [0, TH, R]));
    // trees
    for (const [x, z] of [[0, 0], [0.06, -0.05]]) {
      mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.03, 10), toyMat('rawwood', 'walnut'), { parent: root, at: [x, 0.015, z] });
      mesh(new THREE.SphereGeometry(0.025, 16, 12), toyMat(T.kind === 'rawwood' ? 'wood' : T.kind, '#3f8f3c'), { parent: root, at: [x, 0.05, z] });
    }
    c.anims.push(clip('loop', 8, [rotateTrack(ring, 'y', 8, (t) => t * Math.PI * 2, 32)]));
  } else if (variant === 'bridge-set') {
    const hgt = 0.06;
    straightTrack(root, 0.16, [-0.21, 0, 0], 0, T);
    straightTrack(root, 0.16, [0.21, 0, 0], 0, T);
    const ang = Math.atan2(hgt, 0.12);
    for (const s of [-1, 1]) straightTrack(root, Math.hypot(0.12, hgt) + 0.006, [s * 0.075, hgt / 2 - 0.002, 0], 0, T).rotation.z = -s * ang;
    const top = straightTrack(root, 0.04, [0, hgt - 0.0015, 0], 0, T);
    void top;
    for (const s of [-1, 1]) {
      mesh(c.box(0.015, hgt, 0.05, 0.1), c.m(2), { parent: root, at: [s * 0.02, hgt / 2, 0] });
    }
    wheels.push(...engine(root, c, { at: [0.2, TH, 0] }).wheels);
    wheels.push(...wagon(root, c, 'hopper', 0, [-0.21, TH, 0]));
  } else if (variant === 'station') {
    straightTrack(root, 0.4, [0, 0, 0], 0, T);
    const pf = c.m(4);
    mesh(c.box(0.3, 0.025, 0.06, 0.08), pf, { parent: root, at: [0, 0.0125, -0.052] });
    for (const x of [-0.12, 0.12]) tube([x, 0.025, -0.07], [x, 0.11, -0.07], 0.004, c.m(5), { parent: root });
    const roof = extrudeOutline([[-0.17, 0], [0.17, 0], [0.17, 0.006], [0, 0.03], [-0.17, 0.006]], 0.09, { bevel: 0.002, segments: 1 });
    mesh(roof.rotateY(0).translate(0, 0, 0), c.m(0), { parent: root, at: [0, 0.11, -0.05], rot: [0, 0, 0] }).scale.set(1, 1, 1);
    mesh(c.box(0.06, 0.06, 0.04, 0.1), c.m(1), { parent: root, at: [0.05, 0.055, -0.07] });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 20).rotateX(Math.PI / 2), WHITE, { parent: root, at: [-0.05, 0.09, -0.069] });
    wheels.push(...engine(root, c, { at: [0.02, TH, 0] }).wheels);
  }
  c.anims.push(clip('drive', 1, wheels.map((w) => spinTrack(w, 'x', 1, -1))));
}, { base: 'wooden' });

/* ============================== BABY / WOODEN TOYS ============================== */
export const BABY_VARIANTS = {
  'stacking-rings': {}, 'shape-sorter': {}, 'rocking-horse': {}, 'pull-duck': {}, xylophone: {}, abacus: {}, 'bead-maze': {},
};

function holeShape(kind, s) {
  const p = new THREE.Path();
  if (kind === 0) p.absarc(0, 0, s, 0, Math.PI * 2, true);
  else if (kind === 1) { p.moveTo(-s, -s); p.lineTo(-s, s); p.lineTo(s, s); p.lineTo(s, -s); p.lineTo(-s, -s); }
  else if (kind === 2) { p.moveTo(0, s * 1.1); p.lineTo(-s, -s * 0.8); p.lineTo(s, -s * 0.8); p.lineTo(0, s * 1.1); }
  else { for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 - (i / 10) * Math.PI * 2; const rr = i % 2 ? s * 0.5 : s * 1.15; i ? p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : p.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
  return p;
}
function shapeGeo(kind, s, depth) {
  const sh = new THREE.Shape(holeShape(kind, s * 0.92).getPoints(24).reverse());
  return extrudeOutline(sh, depth, { bevel: s * 0.12, segments: 2 });
}

export const createBabyToy = toyFactory('baby-toy', BABY_VARIANTS, (c) => {
  const { root, T, variant } = c;
  const anims = c.anims;
  if (variant === 'stacking-rings') {
    mesh(lathe([[0, 0], [0.07, 0], [0.075, 0.01], [0.07, 0.022], [0, 0.022]], 40), c.m(5 === 5 && T.kind === 'rawwood' ? 2 : 4), { parent: root });
    mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.16, 20), T.kind === 'plush' ? c.m(4) : toyMat(T.kind === 'rawwood' ? 'rawwood' : 'wood', T.kind === 'rawwood' ? 'maple' : '#e9d7b3'), { parent: root, at: [0, 0.1, 0] });
    let y = 0.022;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const R = 0.062 - i * 0.007;
      const tr = 0.012 - i * 0.0006;
      const g = T.style === 'tin' ? new THREE.CylinderGeometry(R, R, tr * 1.6, 32, 1, false).translate(0, 0, 0) : new THREE.TorusGeometry(R - tr, tr, 14, 40).rotateX(Math.PI / 2);
      const ring = mesh(g, c.m(i), { parent: root, at: [0, y + tr * (T.style === 'tin' ? 0.8 : 1), 0] });
      ring.scale.y = T.puff ? 1.25 : 1;
      y += tr * (T.style === 'tin' ? 1.6 : 2) * (T.puff ? 1.25 : 1);
    }
    mesh(new THREE.SphereGeometry(0.02, 20, 14), c.m(0), { parent: root, at: [0, Math.max(y, 0.17) + 0.012, 0] });
  } else if (variant === 'shape-sorter') {
    const W = 0.18;
    const H = 0.14;
    const t = 0.008;
    const box = c.m(0);
    mesh(c.box(W, t, W, 0.2), box, { parent: root, at: [0, t / 2, 0] });
    for (const s of [-1, 1]) {
      mesh(c.box(W, H, t, 0.2), c.m(s > 0 ? 1 : 0), { parent: root, at: [0, H / 2, s * (W / 2 - t / 2)] });
      mesh(c.box(t, H, W - 2 * t, 0.2), c.m(s > 0 ? 2 : 3), { parent: root, at: [s * (W / 2 - t / 2), H / 2, 0] });
    }
    const lid = new THREE.Shape();
    const L = W / 2;
    lid.moveTo(-L, -L); lid.lineTo(L, -L); lid.lineTo(L, L); lid.lineTo(-L, L); lid.lineTo(-L, -L);
    [[-0.04, -0.04], [0.04, -0.04], [-0.04, 0.04], [0.04, 0.04]].forEach(([x, y], k) => {
      const hp = holeShape(k, 0.022);
      const pts = hp.getPoints(24).map((p) => new THREE.Vector2(p.x + x, p.y + y));
      lid.holes.push(new THREE.Path(pts));
    });
    mesh(extrudeOutline(lid, 0.012, { bevel: 0.003, segments: 2 }).rotateX(-Math.PI / 2), c.m(4), { parent: root, at: [0, H + 0.006, 0] });
    for (let k = 0; k < 4; k++) mesh(shapeGeo(k, 0.02, 0.03).rotateX(-Math.PI / 2), c.m(k + 1), { parent: root, at: [0.14 + (k % 2) * 0.06, 0.015, -0.05 + Math.floor(k / 2) * 0.07], rot: [0, k, 0] });
    mesh(shapeGeo(0, 0.02, 0.03), c.m(2), { parent: root, at: [-0.02, 0.02, 0.12], rot: [0, 0.4, 0] });
  } else if (variant === 'rocking-horse') {
    const horse = group('horse', { parent: root });
    const wood = c.m(0);
    const dark = c.m(5);
    // rockers
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const a = -0.55 + (i / 16) * 1.1; pts.push([Math.sin(a) * 1.0, 1.0 - Math.cos(a) * 1.0 + 0.012, s * 0.17]); }
      curveTube(pts, 0.018, T.kind === 'plush' ? toyMat('rawwood', 'walnut') : toyMat(T.kind === 'rawwood' ? 'rawwood' : T.kind, T.kind === 'rawwood' ? 'walnut' : T.pal[5]), { parent: horse, segments: 32 });
    }
    for (const x of [-0.38, 0.38]) tube([x, 0.08, -0.17], [x, 0.08, 0.17], 0.014, dark, { parent: horse });
    // legs
    for (const x of [-0.25, 0.25]) for (const s of [-1, 1]) tube([x * 1.25, 0.06, s * 0.17], [x, 0.42, s * 0.07], 0.025, wood, { parent: horse });
    const bodyGeo = T.puff ? new THREE.SphereGeometry(0.16, 28, 20) : new THREE.CapsuleGeometry(0.12, 0.34, 8, 24).rotateZ(Math.PI / 2);
    const bodyM = mesh(bodyGeo, wood, { parent: horse, at: [0, 0.5, 0] });
    if (T.puff) bodyM.scale.set(2.2, 0.85, 0.85);
    else bodyM.scale.set(1, 0.85, 0.85);
    // neck + head
    curveTube([[0.22, 0.52, 0], [0.32, 0.68, 0], [0.36, 0.78, 0]], 0.075, wood, { parent: horse, segments: 16 });
    const head = mesh(new THREE.CapsuleGeometry(0.06, 0.14, 8, 16).rotateZ(Math.PI / 2.6), wood, { parent: horse, at: [0.42, 0.8, 0] });
    head.scale.set(1, 1, 0.8);
    for (const s of [-1, 1]) {
      mesh(new THREE.ConeGeometry(0.022, 0.06, 10), wood, { parent: horse, at: [0.34, 0.9, s * 0.03], rot: [s * 0.2, 0, 0.3] });
      mesh(new THREE.SphereGeometry(0.012, 10, 8), BLACK, { parent: horse, at: [0.43, 0.84, s * 0.045] });
      tube([0.36, 0.72, s * 0.11], [0.36, 0.72, s * 0.05], 0.012, toyMat('plastic', '#c0392b'), { parent: horse });
    }
    tube([0.36, 0.72, -0.11], [0.36, 0.72, 0.11], 0.008, CHROMEish(), { parent: horse });
    // mane + tail
    const hair = T.kind === 'plush' ? c.m(1) : toyMat('plush', T.kind === 'metal' ? '#2a2a2a' : '#e8d6b0');
    for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(0.03, 10, 8), hair, { parent: horse, at: [0.24 + i * 0.025, 0.6 + i * 0.05, 0] });
    curveTube([[-0.26, 0.55, 0], [-0.4, 0.52, 0], [-0.46, 0.35, 0]], 0.03, hair, { parent: horse, segments: 12 });
    // saddle
    mesh(roundedBox(0.2, 0.03, 0.22, 0.012), c.m(1), { parent: horse, at: [0, 0.6, 0] });
    for (const s of [-1, 1]) tube([0, 0.6, s * 0.11], [0, 0.4, s * 0.12], 0.004, BLACK, { parent: horse });
    anims.push(clip('rock', 1.6, [rotateTrack(horse, 'z', 1.6, (t) => wave(t) * 0.18)]));
  } else if (variant === 'pull-duck') {
    const duck = group(null, { parent: root });
    mesh(c.box(0.16, 0.012, 0.08, 0.2), c.m(5), { parent: duck, at: [0, 0.03, 0] });
    const ws = [];
    for (const x of [-0.05, 0.05]) for (const s of [-1, 1]) { const w = wheel(duck, { r: 0.024, w: 0.01, at: [x, 0.024, s * 0.046], T, hub: c.color(2) }); w.rotation.y = Math.PI / 2; ws.push(w); }
    const b = mesh(new THREE.SphereGeometry(0.06, 24, 16), c.m(2), { parent: duck, at: [0, 0.08, 0] });
    b.scale.set(1.3, 0.75, 0.85);
    mesh(new THREE.ConeGeometry(0.02, 0.05, 12), c.m(2), { parent: duck, at: [-0.08, 0.1, 0], rot: [0, 0, 1.0] });
    mesh(new THREE.SphereGeometry(0.035, 20, 14), c.m(2), { parent: duck, at: [0.055, 0.14, 0] });
    mesh(new THREE.ConeGeometry(0.012, 0.03, 12).rotateZ(-Math.PI / 2), toyMat(T.kind, '#ff8c1a'), { parent: duck, at: [0.098, 0.135, 0] }).scale.set(1, 1, 0.6);
    for (const s of [-1, 1]) {
      mesh(new THREE.SphereGeometry(0.006, 10, 8), BLACK, { parent: duck, at: [0.075, 0.15, s * 0.024] });
      const wing = mesh(new THREE.SphereGeometry(0.035, 16, 10), c.m(0), { parent: duck, at: [-0.005, 0.085, s * 0.045] });
      wing.scale.set(1.2, 0.5, 0.25);
    }
    curveTube([[0.08, 0.03, 0], [0.16, 0.02, 0.02], [0.26, 0.004, 0.06], [0.34, 0.004, 0.02]], 0.0018, toyMat('plush', '#d63a2f'), { parent: duck, segments: 24 });
    mesh(new THREE.SphereGeometry(0.012, 12, 10), c.m(0), { parent: duck, at: [0.34, 0.012, 0.02] });
    anims.push(clip('roll', 1, ws.map((w) => spinTrack(w, 'x', 1, -1))));
  } else if (variant === 'xylophone') {
    const fr = T.kind === 'rawwood' ? toyMat('rawwood', 'walnut') : c.m(5);
    for (const s of [-1, 1]) mesh(c.box(0.32, 0.02, 0.016, 0.2), fr, { parent: root, at: [0, 0.035, s * (0.04 + 0.0 * s)], rot: [0, s * -0.1, 0] });
    const ws = [];
    for (const x of [-0.13, 0.13]) for (const s of [-1, 1]) { const w = wheel(root, { r: 0.022, w: 0.01, at: [x, 0.022, s * (0.06 + (x > 0 ? -0.012 : 0.012) * s)], T, hub: c.color(1) }); w.rotation.y = Math.PI / 2; ws.push(w); }
    const colors = ['#e63946', '#f77f00', '#fcbf49', '#2a9d8f', '#4361ee', '#7209b7', '#ff5d8f', '#90be6d'];
    for (let i = 0; i < 8; i++) {
      const L = 0.14 - i * 0.009;
      const mat = T.style === 'tin' || T.style === 'luxe' ? toyMat('chrome', colors[i]) : T.style === 'rainbow' || T.style === 'wood' || T.name === 'classic' ? toyMat(T.style === 'tin' ? 'metal' : T.kind === 'plush' ? 'plastic' : T.kind, colors[i]) : c.m(i);
      mesh(roundedBox(0.026, 0.008, L, 0.003), mat, { parent: root, at: [-0.12 + i * 0.034, 0.049, 0] });
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.004, 8), CHROMEish(), { parent: root, at: [-0.12 + i * 0.034, 0.054, s * L * 0.38] });
    }
    for (const s of [-1, 1]) {
      // mallets rest across the bars
      tube([-0.08 * s, 0.059, s * 0.03], [0.07 * s, 0.059, s * 0.045], 0.003, toyMat('rawwood', 'maple'), { parent: root });
      mesh(new THREE.SphereGeometry(0.009, 12, 10), c.m(0), { parent: root, at: [-0.08 * s, 0.062, s * 0.03] });
    }
    anims.push(clip('roll', 1, ws.map((w) => spinTrack(w, 'x', 1, -1))));
  } else if (variant === 'abacus') {
    const fr = T.kind === 'rawwood' ? toyMat('rawwood', 'walnut') : c.m(5);
    mesh(c.box(0.3, 0.02, 0.1, 0.2), fr, { parent: root, at: [0, 0.01, 0] });
    for (const s of [-1, 1]) mesh(c.box(0.02, 0.28, 0.04, 0.2), fr, { parent: root, at: [s * 0.14, 0.15, 0] });
    mesh(c.box(0.3, 0.02, 0.04, 0.2), fr, { parent: root, at: [0, 0.29, 0] });
    const beads = [];
    for (let row = 0; row < 8; row++) {
      const y = 0.045 + row * 0.03;
      tube([-0.13, y, 0], [0.13, y, 0], 0.0018, CHROMEish(), { parent: root });
      const bg = group(`row${row}`, { parent: root, at: [0, y, 0] });
      for (let k = 0; k < 10; k++) {
        const g = T.style === 'tin' ? new THREE.CylinderGeometry(0.011, 0.011, 0.016, 16).rotateZ(Math.PI / 2) : new THREE.SphereGeometry(0.012, 16, 12).scale(0.7, 1, 1);
        mesh(g, c.m(row), { parent: bg, at: [-0.115 + k * 0.0168 + (k > 6 ? 0.06 : 0), 0, 0] });
      }
      if (row % 3 === 0) beads.push(bg);
    }
    anims.push(clip('count', 3, beads.map((b, i) => moveTrack(b, 3, (t) => [-pingPong((t + i * 0.2) % 1) * 0.01, 0, 0]))));
  } else if (variant === 'bead-maze') {
    mesh(c.box(0.22, 0.04, 0.16, 0.2), c.m(5 === 5 && T.kind === 'rawwood' ? 2 : 0), { parent: root, at: [0, 0.02, 0] });
    const wire = toyMat('chrome', '#cfd3d8');
    const loops = [
      [[-0.08, 0.04, -0.04], [-0.07, 0.22, -0.03], [0.0, 0.25, 0.0], [0.06, 0.15, 0.03], [0.08, 0.04, 0.04]],
      [[-0.07, 0.04, 0.05], [-0.02, 0.17, 0.06], [0.03, 0.12, -0.05], [0.07, 0.2, -0.04], [0.09, 0.04, -0.05]],
      [[-0.09, 0.04, 0.0], [-0.04, 0.12, -0.06], [0.02, 0.2, 0.05], [0.05, 0.04, 0.0]],
    ];
    const colors = [0, 1, 2, 3];
    loops.forEach((pts, li) => {
      const t = curveTube(pts, 0.0025, li === 0 ? toyMat(T.kind === 'rawwood' ? 'plastic' : T.kind, T.pal[1]) : li === 1 ? toyMat(T.kind === 'rawwood' ? 'plastic' : T.kind, T.pal[3]) : wire, { parent: root, segments: 40 });
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
      void t;
      for (let k = 0; k < 4; k++) {
        const p = curve.getPoint(0.25 + k * 0.12 + li * 0.05);
        const geo = (k + li) % 3 === 0 ? new THREE.BoxGeometry(0.016, 0.016, 0.016) : (k + li) % 3 === 1 ? new THREE.SphereGeometry(0.01, 14, 10) : new THREE.CylinderGeometry(0.01, 0.01, 0.014, 14);
        mesh(geo, c.m(colors[(k + li) % 4]), { parent: root, at: [p.x, p.y, p.z] });
      }
    });
  }
}, { base: 'wooden' });

function CHROMEish() { return toyMat('chrome', '#cfd3d8'); }
