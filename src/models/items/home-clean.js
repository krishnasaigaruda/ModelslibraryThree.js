// Home group, part 2: laundry, cleaning, step stools, rain umbrellas.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, tube, setup, done, fin, tm, hw, anims, vessel, openBox, slab, clip, rotateTrack, spinTrack, pingPong, wave } from './common.js';
import { drapeGeo } from './home-util.js';

const rodX = (x0, x1, r, mat, parent, y = 0, z = 0) => mesh(new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), 12).rotateZ(Math.PI / 2), mat, { parent, at: [(x0 + x1) / 2, y, z] });

/* ================================ LAUNDRY ================================ */

export const LAUNDRY_VARIANTS = { 'laundry-basket': {}, hamper: {}, 'ironing-board': {}, iron: {}, 'clothes-peg': {}, 'coat-hanger': {}, 'drying-rack': {} };

export function createLaundry(options = {}) {
  const { o, variant, T } = setup(options, LAUNDRY_VARIANTS, 'laundry', { p: '#f2f2ee', s: '#5f8fbf', a: '#2a2b2e', mat: 'plastic' });
  const root = group(`laundry-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const sec = tm(T, 's', T.mat === 'metal' ? 'plastic' : undefined);
  let animations = [];
  if (variant === 'laundry-basket') {
    const W = 0.58 * k * T.w, H = 0.27 * k * T.h, D = 0.42 * k * T.d, t = T.mat === 'wood' || T.mat === 'canvas' ? 0.01 : 0.006;
    openBox(W, H, D, t, body, { parent: root, r: D * (T.round > 1.2 ? 0.45 : 0.25), name: 'basket' });
    // vent slots (plastic) or weave rails (wicker/wood/canvas)
    if (T.mat === 'plastic') {
      const slotM = M.matte('#3a3a3a');
      for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) for (const zs of [-1, 1]) mesh(roundedBox(W * 0.07, H * 0.13, 0.002, 0.004), slotM, { parent: root, at: [(i - 3) * W * 0.11, H * (0.28 + r * 0.2), zs * (D / 2 + 0.0002)] });
    } else {
      const bandM = fin(T, T.s, T.mat === 'wood' ? 'wood' : 'leather');
      for (let i = 1; i <= 3; i++) for (const zs of [-1, 1]) mesh(roundedBox(W * 0.8, 0.012, 0.004, 0.002), bandM, { parent: root, at: [0, H * i / 4, zs * (D / 2 + 0.001)] });
    }
    // handles at both ends
    for (const s of [-1, 1]) curveTube([[s * W / 2, H * 0.78, -0.07], [s * (W / 2 + 0.035), H * 0.86, -0.04], [s * (W / 2 + 0.035), H * 0.86, 0.04], [s * W / 2, H * 0.78, 0.07]], 0.009, sec, { parent: root, segments: 16 });
    // folded clothes inside, resting on the floor of the basket
    const cl = ['#c94a4a', '#e6e1d4', '#3b5f8a'];
    for (let i = 0; i < (T.k > 1.1 ? 3 : 2); i++) mesh(slab(W * 0.6, 0.05, D * 0.6, { bulge: 0.2 }), M.fabric(cl[i]), { parent: root, at: [(i - 0.5) * 0.04, t + 0.025 + i * 0.048, (i % 2 ? 0.02 : -0.02)], rot: [0, i * 0.3, 0] });
  } else if (variant === 'hamper') {
    const R = 0.2 * k * T.w, H = 0.6 * k * T.h, t = 0.006;
    const prof = [[R * 0.88, 0], [R, H * 0.1], [R, H * 0.95], [R * 1.01, H]];
    mesh(vessel(prof, t, t * 2, 40), body, { parent: root, name: 'hamper' });
    for (let i = 1; i <= 4; i++) mesh(new THREE.TorusGeometry(R * 1.002, 0.005, 6, 40), sec, { parent: root, at: [0, H * i / 5, 0], rot: [Math.PI / 2, 0, 0] });
    if (T.mat === 'canvas' || T.soft) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; tube([Math.cos(a) * R * 1.004, 0.01, Math.sin(a) * R * 1.004], [Math.cos(a) * R * 1.004, H * 0.98, Math.sin(a) * R * 1.004], 0.004, sec, { parent: root }); }
    // hinged lid at the back rim
    const hinge = group('lid', { parent: root, at: [0, H + 0.003, -R] });
    mesh(lathe([[0, 0], [R * 1.05, 0], [R * 1.05, 0.02], [R * 0.9, 0.035], [0, 0.04]], 40), fin(T, T.s), { parent: hinge, at: [0, 0, R] });
    mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 16, Math.PI), hw(T), { parent: hinge, at: [0, 0.04, R], rot: [0, 0, 0] });
    for (const s of [-1, 1]) curveTube([[s * R, H * 0.85, -0.04], [s * (R + 0.03), H * 0.86, 0], [s * R, H * 0.85, 0.04]], 0.007, sec, { parent: root, segments: 10 });
    animations = () => [anims.open('open', hinge, 'x', -1.6, 3)];
  } else if (variant === 'ironing-board') {
    const L = 1.2 * k * T.w, W = 0.36 * k, Hb = 0.86 * k * T.h;
    const pts = [];
    for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + (i / 20) * Math.PI; pts.push([L * 0.25 + Math.cos(a) * L * 0.25, Math.sin(a) * W / 2 * (0.55 + 0.45 * Math.cos(a))]); }
    pts.push([-L / 2 + 0.06, W / 2], [-L / 2, W * 0.42], [-L / 2, -W * 0.42], [-L / 2 + 0.06, -W / 2]);
    const board = group('board', { parent: root, at: [0, Hb, 0] });
    mesh(extrudeOutline(pts, 0.03, { bevel: 0.012 }), fin(T, T.p, T.mat === 'wood' ? 'wood' : 'fabric', { pattern: T.pattern ?? (T.mat === 'plastic' ? 'dots' : null) }), { parent: board, rot: [Math.PI / 2, 0, 0] });
    // iron rest at the square end
    const fm = T.mat === 'wood' ? M.wood('oak') : M.metal(T.trim === 'black' ? '#222' : '#cfd3d8', 0.35);
    mesh(roundedBox(0.04, 0.012, W * 0.9, 0.005), fm, { parent: board, at: [-L / 2 - 0.015, 0, 0] });
    // X legs
    for (const s of [-1, 1]) for (const zs of [-1, 1]) tube([s * L * 0.28, 0.015, zs * W * 0.38], [-s * L * 0.18, Hb - 0.016, zs * W * 0.3], 0.011, fm, { parent: root });
    rodX(-0.02, 0.02, 0.014, hw(T), root, Hb * 0.5, W * 0.4);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, W * 0.85, 10).rotateX(Math.PI / 2), fm, { parent: root, at: [s * L * 0.28, 0.015, 0] });
    for (const s of [-1, 1]) for (const zs of [-1, 1]) mesh(new THREE.SphereGeometry(0.016, 10, 8).scale(1, 0.6, 1), M.rubber(), { parent: root, at: [s * L * 0.28, 0.009, zs * W * 0.38] });
  } else if (variant === 'iron' || variant === 'clothes-peg') {
    if (variant === 'iron') {
      const L = 0.27 * k * T.w, W = 0.12 * k;
      const sole = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; const x = -L / 2 + t * L; const w = W / 2 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (t - 0.25) / 0.75), 2.2))) * (t < 0.08 ? 0.75 + t * 3 : 1); sole.push([x, w]); }
      const outline = [...sole, ...sole.slice().reverse().map(([x, w]) => [x, -w])];
      mesh(extrudeOutline(outline, 0.012, { bevel: 0.003 }), T.lux ? M.metal('#d6a93c', 0.2) : M.chrome(), { parent: root, at: [0, 0.006, 0], rot: [Math.PI / 2, 0, 0] });
      // body shell (scaled outline, thicker) + handle loop
      const shell = mesh(extrudeOutline(outline.map(([x, w]) => [x * 0.97, w * 0.93]), 0.05 * T.h, { bevel: 0.018 }), body, { parent: root, at: [0, 0.012 + 0.025 * T.h, 0], rot: [Math.PI / 2, 0, 0], name: 'body' });
      void shell;
      curveTube([[-L * 0.38, 0.06 * T.h, 0], [-L * 0.32, 0.13 * T.h, 0], [L * 0.05, 0.14 * T.h, 0], [L * 0.22, 0.06 * T.h, 0]], 0.016, sec, { parent: root, segments: 24 });
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 20), fin(T, T.a), { parent: root, at: [0, 0.066 * T.h, 0], name: 'dial' });
      if (!T.slim) {
        // water tank window + cord at the heel
        mesh(roundedBox(0.05, 0.03, 0.002, 0.008), M.glass({ tint: '#9fd3e8', opacity: 0.6 }), { parent: root, at: [L * 0.12, 0.045 * T.h, W * 0.33], rot: [0, -0.25, 0] });
        curveTube([[-L / 2 + 0.01, 0.04, 0], [-L / 2 - 0.05, 0.03, 0], [-L / 2 - 0.1, 0.005, 0.06], [-L / 2 - 0.05, 0.005, 0.15], [0, 0.005, 0.12]], 0.004, M.matte(T.trim === 'black' ? '#202020' : '#e8e8e8'), { parent: root, segments: 30 });
      }
    } else {
      // clothes pegs: a few lying around + one on a short line piece
      const n = T.k > 1.1 ? 5 : 3;
      const pm = T.mat === 'plastic' ? body : fin(T, T.mat === 'wood' ? T.p : '#d9b98a', 'wood');
      for (let i = 0; i < n; i++) {
        const g = group('peg', { parent: root, at: [(i - (n - 1) / 2) * 0.035 * k, 0, (i % 2) * 0.03], rot: [0, i * 0.5 + (T.r() - 0.5) * 0.6, 0] });
        const L = 0.072 * k * T.w, Wd = 0.01 * k;
        // side profile of one half (length along x, thickness up); the other half is mirrored below
        const prong = [[0, 0], [L, 0], [L, 0.004], [L * 0.62, 0.0062], [L * 0.52, 0.0035], [L * 0.42, 0.0035], [L * 0.32, 0.0062], [0.004, 0.0052], [0, 0.003]];
        for (const s of [1, -1]) mesh(extrudeOutline(prong, Wd, { bevel: 0.0012, segments: 2 }), i % 2 && T.mat === 'plastic' ? sec : pm, { parent: g, at: [-L / 2, 0.0065 + s * 0.0004, 0], scale: [1, s, 1], rot: [0, 0, s * 0.015] });
        mesh(new THREE.TorusGeometry(0.0035, 0.0011, 5, 14), M.metal('#c9ccd2', 0.3), { parent: g, at: [-L * 0.03, 0.0065, Wd / 2 + 0.0004] });
      }
    }
  } else if (variant === 'coat-hanger') {
    // lying flat: shoulder bar + trouser bar + hook
    const W = 0.44 * k * T.w;
    const wd = T.mat === 'wood' || T.trim === 'vintage' || T.trim === 'luxury';
    const hm = wd ? fin(T, T.trim === 'luxury' ? '#3a2214' : '#a5733f', 'wood') : T.mat === 'metal' ? M.metal('#c9ccd2', 0.3) : body;
    const g = group('hanger', { parent: root, rot: [-Math.PI / 2, 0, 0] });
    const thick = wd ? 0.022 : T.mat === 'metal' ? 0.004 : 0.012;
    if (T.mat === 'metal') {
      curveTube([[0, 0.12, 0], [-W / 2, 0.005, 0], [W / 2, 0.005, 0], [0, 0.12, 0]], thick, hm, { parent: g, segments: 40, closed: false });
      curveTube([[-W / 2 + 0.02, 0, 0], [W / 2 - 0.02, 0, 0]], thick, hm, { parent: g, segments: 4 });
    } else {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; const x = -W / 2 + t * W; pts.push([x, 0.1 - Math.abs(x) / (W / 2) * 0.075 + 0.012 * Math.cos(t * Math.PI * 2)]); }
      const out = [...pts, ...pts.slice().reverse().map(([x, y]) => [x, y - 0.035 + Math.abs(x) / W * 0.02])];
      mesh(extrudeOutline(out, thick, { bevel: thick * 0.3 }), hm, { parent: g });
      if (T.detail >= 1 || T.lux) { mesh(new THREE.CylinderGeometry(0.006, 0.006, W * 0.82, 10).rotateZ(Math.PI / 2), hw(T), { parent: g, at: [0, -0.04, 0] }); for (const s of [-1, 1]) tube([s * W * 0.41, -0.04, 0], [s * W * 0.43, 0.04, 0], 0.005, hw(T), { parent: g }); }
      if (T.soft || T.mat === 'velvet') mesh(new THREE.CylinderGeometry(0.011, 0.011, W * 0.6, 12).rotateZ(Math.PI / 2), fin(T, T.s, 'velvet'), { parent: g, at: [0, 0.075, 0] });
    }
    curveTube([[0, 0.1, 0], [0, 0.15, 0], [0.012, 0.185, 0], [0.04, 0.18, 0], [0.042, 0.155, 0]], 0.003, T.lux ? M.metal('#d6a93c', 0.2) : M.chrome(), { parent: g, segments: 20 });
    g.position.y = thick / 2;
  } else {
    // drying rack (A-frame airer) with some laundry
    const W = 0.7 * k * T.w, H = 0.9 * k * T.h, D = 0.55 * k;
    const fm = T.mat === 'wood' ? fin(T, T.p, 'wood') : M.metal(T.trim === 'black' ? '#2a2a2a' : '#e8e8e8', 0.4);
    for (const zs of [-1, 1]) {
      for (const xs of [-1, 1]) tube([xs * W / 2, 0.01, zs * D / 2], [xs * W / 2, H, 0], 0.008, fm, { parent: root });
      for (let i = 1; i <= 5; i++) { const t = i / 6; rodX(-W / 2, W / 2, 0.004, fm, root, 0.01 + (H - 0.01) * t, zs * D / 2 * (1 - t)); }
    }
    rodX(-W / 2 - 0.01, W / 2 + 0.01, 0.009, fm, root, H, 0);
    for (const s of [-1, 1]) for (const zs of [-1, 1]) mesh(new THREE.SphereGeometry(0.012, 8, 6), M.plastic('#2a2a2a'), { parent: root, at: [s * W / 2, 0.007, zs * D / 2] });
    // towel/shirt draped over the top bar
    const t = 0.006;
    mesh(drapeGeo([[-0.12, H - 0.32], [-0.06, H - 0.14], [-0.012, H], [0, H + 0.009 + t / 2], [0.012, H], [0.06, H - 0.12], [0.1, H - 0.26]], t, W * 0.45), fin(T, T.s, 'fabric', { pattern: T.pattern }), { parent: root, at: [-W * 0.18, 0, 0] });
    mesh(drapeGeo([[-0.09, H - 0.2], [-0.012, H], [0, H + 0.009 + t / 2], [0.012, H], [0.08, H - 0.18]], t, 0.12), M.fabric('#e8d27a'), { parent: root, at: [W * 0.25, 0, 0] });
  }
  return done(root, 'laundry', variant, o, animations);
}

/* ================================ CLEANING ================================ */

export const CLEANING_VARIANTS = { broom: {}, 'mop-and-bucket': {}, 'dustpan-and-brush': {}, 'vacuum-cleaner': {}, plunger: {}, 'spray-bottle': {}, bucket: {}, 'scrub-brush': {} };

function bristles(w, h, d, color) {
  const g = roundedBox(w, h, d, Math.min(w, d) * 0.15, 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -h * 0.3) p.setX(i, p.getX(i) * 1.08);
  g.computeVertexNormals();
  return { g, m: new THREE.MeshStandardMaterial({ name: 'bristle', color, roughness: 0.95 }) };
}

function bucketAt(parent, R, H, mat, handleMat, { at = [0, 0, 0], spout = false } = {}) {
  const g = group('bucket', { parent, at });
  mesh(vessel([[R * 0.78, 0], [R * 0.8, 0.01], [R, H * 0.97], [R * 1.04, H]], 0.004, 0.005, 40), mat, { parent: g, name: 'bucket-shell' });
  mesh(new THREE.TorusGeometry(R * 1.035, 0.006, 6, 40), mat, { parent: g, at: [0, H - 0.004, 0], rot: [Math.PI / 2, 0, 0] });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12).rotateZ(Math.PI / 2), mat, { parent: g, at: [s * (R * 0.99 + 0.005), H * 0.86, 0] });
  const hd = group('handle', { parent: g, at: [0, H * 0.86, 0] });
  curveTube([[-R * 1.01 - 0.01, 0, 0], [-R * 0.9, H * 0.45, 0], [0, H * 0.62, 0], [R * 0.9, H * 0.45, 0], [R * 1.01 + 0.01, 0, 0]], 0.003, handleMat, { parent: hd, segments: 32 });
  mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.09, 12).rotateZ(Math.PI / 2), M.plastic('#222'), { parent: hd, at: [0, H * 0.6, 0] });
  if (spout) mesh(new THREE.ConeGeometry(0.03, 0.04, 12, 1, true).rotateZ(Math.PI / 2), mat, { parent: g, at: [0, H - 0.015, R * 1.02] }).rotation.y = -Math.PI / 2;
  return g;
}

export function createCleaning(options = {}) {
  const { o, variant, T } = setup(options, CLEANING_VARIANTS, 'cleaning', { p: '#2f9e6a', s: '#f2f2ee', a: '#e8b52a', mat: 'plastic' });
  const root = group(`cleaning-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const sec = tm(T, 's', T.mat === 'wood' ? 'plastic' : undefined);
  const handleM = T.mat === 'wood' || T.trim === 'rustic' || T.trim === 'vintage' ? M.wood('oak') : T.mat === 'metal' ? M.chrome() : fin(T, T.s, 'metal');
  let animations = [];
  if (variant === 'broom') {
    const L = 1.25 * k * T.h, W = 0.3 * k * T.w;
    if (T.rugged || T.trim === 'rustic' || T.trim === 'vintage') {
      // straw / witch-style corn broom
      const prof = [[0.012, 0], [W * 0.5, 0.0], [W * 0.38, 0.18], [0.03, 0.34], [0.016, 0.38]];
      const g = lathe(prof, 32); g.scale(1, 1, 0.35);
      mesh(g, new THREE.MeshStandardMaterial({ name: 'straw', color: '#d8b56a', roughness: 0.95 }), { parent: root, name: 'head' });
      for (const y of [0.24, 0.29]) mesh(new THREE.TorusGeometry(1, 0.004, 6, 24).scale(0.06, 0.022, 1), M.matte('#a83a2a'), { parent: root, at: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
      tube([0, 0.3, 0], [0, L, 0], 0.014, handleM, { parent: root });
    } else {
      // angle broom: plastic block + flagged bristles, standing
      const { g, m } = bristles(W, 0.12, 0.05, T.trim === 'black' ? '#333' : T.a);
      const head = mesh(g, m, { parent: root, at: [0, 0.06, 0], rot: [0, 0, 0.18], name: 'bristles' });
      void head;
      mesh(roundedBox(W * 0.92, 0.05, 0.06, 0.02), body, { parent: root, at: [-0.012, 0.135, 0], rot: [0, 0, 0.18] });
      tube([-0.03, 0.15, 0], [-0.03 - 0.12, L, 0], 0.012, handleM, { parent: root });
      mesh(new THREE.CapsuleGeometry(0.014, 0.04, 4, 10), sec, { parent: root, at: [-0.03 - 0.12 * ((L - 0.05) - 0.15) / (L - 0.15), L - 0.025, 0], rot: [0, 0, 0.095] });
    }
  } else if (variant === 'mop-and-bucket') {
    const R = 0.17 * k * T.w, H = 0.3 * k;
    bucketAt(root, R, H, body, handleM, { spout: true });
    // wringer basket on one side
    mesh(roundedBox(R * 0.9, 0.08, R * 0.7, 0.02), sec, { parent: root, at: [0, H - 0.035, -R * 0.45] });
    // mop head resting on the bucket floor + handle leaning out
    const strands = new THREE.MeshStandardMaterial({ name: 'mop', color: T.trim === 'rugged' ? '#c8c0a8' : '#f2efe6', roughness: 1 });
    mesh(new THREE.SphereGeometry(0.1 * k, 20, 14).scale(1, 0.75, 1), strands, { parent: root, at: [0, 0.005 + 0.075 * k, R * 0.25], name: 'mop-head' });
    mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.06, 12), sec, { parent: root, at: [0, 0.16 * k, R * 0.25] });
    tube([0, 0.17 * k, R * 0.25], [0.18 * k, 1.25 * k, R * 0.5], 0.012, handleM, { parent: root });
  } else if (variant === 'dustpan-and-brush') {
    const W = 0.3 * k * T.w, D = 0.26 * k;
    const pan = group('pan', { parent: root });
    mesh(roundedBox(W, 0.004, D, 0.0015), body, { parent: pan, at: [0, 0.002, 0] });
    mesh(roundedBox(W, 0.07, 0.006, 0.003), body, { parent: pan, at: [0, 0.035, -D / 2] });
    for (const s of [-1, 1]) mesh(extrudeOutline([[0, 0], [D, 0], [0, 0.07]], 0.006, { bevel: 0.002 }), body, { parent: pan, at: [s * (W / 2 - 0.003), 0, -D / 2], rot: [0, -Math.PI / 2, 0] });
    mesh(roundedBox(0.04, 0.03, 0.17 * k, 0.012), body, { parent: pan, at: [0, 0.055, -D / 2 - 0.085 * k], rot: [-0.25, 0, 0] });
    mesh(roundedBox(W * 0.98, 0.002, 0.02, 0.0009), M.rubber(), { parent: pan, at: [0, 0.001, D / 2 - 0.01] });
    // hand brush lying in the pan
    const br = group('brush', { parent: root, at: [0, 0.004, 0.02], rot: [0, 0.35, 0] });
    const { g, m } = bristles(0.2 * k, 0.03, 0.045, T.trim === 'black' ? '#333' : '#3a3a3a');
    mesh(g, m, { parent: br, at: [0, 0.015, 0] });
    mesh(roundedBox(0.22 * k, 0.02, 0.05, 0.008), T.mat === 'wood' ? M.wood('oak') : sec, { parent: br, at: [-0.01, 0.038, 0] });
    mesh(new THREE.CapsuleGeometry(0.012, 0.1 * k, 4, 10).rotateZ(Math.PI / 2), T.mat === 'wood' ? M.wood('oak') : sec, { parent: br, at: [-0.16 * k, 0.042, 0] });
  } else if (variant === 'vacuum-cleaner') {
    const H = 1.1 * k * T.h;
    // floor head with wheels
    mesh(roundedBox(0.32 * k, 0.07, 0.24, 0.025), sec, { parent: root, at: [0, 0.035 + 0.008, 0.06] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [s * 0.17 * k, 0.06, -0.08] });
    const roll = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28 * k, 12).rotateZ(Math.PI / 2), fin(T, T.a, 'plastic'), { parent: root, at: [0, 0.02, 0.14], name: 'brushroll' });
    // body + clear dust bin
    mesh(roundedBox(0.2 * k, 0.5 * T.h, 0.16, 0.05), body, { parent: root, at: [0, 0.07 + 0.25 * T.h, -0.07] });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2 * T.h, 24), M.glass({ tint: '#b9d6e2', opacity: 0.5 }), { parent: root, at: [0, 0.36 * T.h, 0.03] });
    mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12 * T.h, 16), M.plastic('#8a8a8a'), { parent: root, at: [0, 0.3 * T.h, 0.03] });
    tube([0, 0.07 + 0.5 * T.h, -0.07], [0, H - 0.1, -0.12], 0.016, M.chrome(), { parent: root });
    curveTube([[0, H - 0.1, -0.12], [0, H - 0.02, -0.12], [0, H, -0.05], [0, H - 0.08, -0.02]], 0.018, sec, { parent: root, segments: 16 });
    if (!T.slim) curveTube([[0.1 * k, 0.5 * T.h, -0.1], [0.14 * k, 0.6 * T.h, -0.12], [0.1 * k, 0.75 * T.h, -0.13]], 0.012, M.plastic('#2a2a2a'), { parent: root, segments: 12 });
    animations = () => [anims.spin('on', roll, 'x', 0.3)];
  } else if (variant === 'plunger') {
    const R = 0.075 * k * T.w;
    const cup = T.rugged ? [[R * 0.65, 0], [R, 0.01], [R * 0.95, 0.05], [R * 0.6, 0.085], [0.016, 0.095]] : [[R, 0], [R * 0.98, 0.03], [R * 0.75, 0.065], [0.016, 0.08]];
    mesh(vessel(cup, 0.004, 0, 36), fin(T, T.trim === 'black' ? '#1a1a1a' : T.trim === 'yellow' ? '#f4c21a' : '#b5262a', 'rubber'), { parent: root, name: 'cup' });
    tube([0, 0.07, 0], [0, 0.55 * k * T.h, 0], 0.013, handleM, { parent: root });
    mesh(new THREE.SphereGeometry(0.016, 10, 8), handleM, { parent: root, at: [0, 0.55 * k * T.h, 0] });
  } else if (variant === 'spray-bottle') {
    const R = 0.042 * k * T.w, H = 0.2 * k * T.h;
    mesh(lathe([[0, 0], [R * 0.95, 0], [R, 0.01], [R, H * 0.75], [R * 0.6, H * 0.9], [R * 0.45, H], [0, H]], 32), fin(T, T.p, T.mat === 'glass' ? 'glass' : 'plastic'), { parent: root, name: 'bottle' });
    mesh(new THREE.CylinderGeometry(R * 0.6 * 1.1, R * 0.5 * 1.1, 0.025, 18), sec, { parent: root, at: [0, H + 0.012, 0] });
    const head = group('head', { parent: root, at: [0, H + 0.025, 0] });
    mesh(extrudeOutline([[-0.015, 0], [0.02, 0], [0.055, 0.03], [0.06, 0.045], [-0.015, 0.05]], 0.028, { bevel: 0.006 }), sec, { parent: head });
    mesh(extrudeOutline([[0.012, 0.002], [0.025, -0.002], [0.03, -0.045], [0.02, -0.05], [0.014, -0.01]], 0.012, { bevel: 0.003 }), fin(T, T.a, 'plastic'), { parent: head, name: 'trigger' });
    mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.012, 10).rotateZ(Math.PI / 2), fin(T, T.a, 'plastic'), { parent: head, at: [0.065, 0.038, 0] });
    if (T.detail >= 0) mesh(new THREE.CylinderGeometry(R * 1.003, R * 1.003, H * 0.35, 32, 1, true), M.matte(T.s), { parent: root, at: [0, H * 0.4, 0] });
  } else if (variant === 'bucket') {
    const R = 0.15 * k * T.w, H = 0.27 * k * T.h;
    if (T.mat === 'metal' || T.trim === 'vintage' || T.trim === 'rustic') {
      // galvanised pail with ribs
      const gm = M.metal(T.trim === 'rustic' ? '#8f8a80' : '#c9ccd0', 0.45);
      mesh(vessel([[R * 0.8, 0], [R, H]], 0.0025, 0.004, 40), gm, { parent: root, name: 'bucket-shell' });
      for (const y of [0.25, 0.75]) mesh(new THREE.TorusGeometry(R * (0.8 + 0.2 * y) + 0.002, 0.004, 6, 40), gm, { parent: root, at: [0, H * y, 0], rot: [Math.PI / 2, 0, 0] });
      mesh(new THREE.TorusGeometry(R + 0.002, 0.005, 6, 40), gm, { parent: root, at: [0, H, 0], rot: [Math.PI / 2, 0, 0] });
      curveTube([[-R - 0.004, H * 0.9, 0], [-R * 0.8, H * 1.4, 0], [0, H * 1.55, 0], [R * 0.8, H * 1.4, 0], [R + 0.004, H * 0.9, 0]], 0.003, gm, { parent: root, segments: 30 });
    } else bucketAt(root, R, H, body, handleM, { spout: true });
  } else {
    // scrub brush: wooden/plastic block with bristles, lying bristles-down
    const L = 0.18 * k * T.w, W = 0.07 * k;
    const { g, m } = bristles(L * 0.95, 0.025, W * 0.9, T.trim === 'rustic' ? '#c8a36a' : T.a);
    mesh(g, m, { parent: root, at: [0, 0.0125, 0] });
    const block = [];
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; block.push([Math.cos(a) * L / 2, Math.sin(a) * W / 2 * (1 - 0.25 * Math.cos(a) ** 8)]); }
    mesh(extrudeOutline(block, 0.025, { bevel: 0.006 }), T.mat === 'plastic' ? body : fin(T, T.mat === 'wood' ? T.p : '#c49a63', 'wood'), { parent: root, at: [0, 0.025 + 0.0125, 0], rot: [Math.PI / 2, 0, 0] });
    if (!T.slim) curveTube([[-L * 0.3, 0.05, 0], [-L * 0.2, 0.085, 0], [L * 0.2, 0.085, 0], [L * 0.3, 0.05, 0]], 0.009, T.mat === 'plastic' ? sec : fin(T, '#8a5a2a', 'wood'), { parent: root, segments: 16 });
  }
  return done(root, 'cleaning', variant, o, animations);
}

/* ================================ STEP STOOL ================================ */

export const STEP_STOOL_VARIANTS = { 'two-step': {}, 'kick-stool': {}, 'kids-stool': {}, 'step-ladder': {} };

export function createStepStool(options = {}) {
  const { o, variant, T } = setup(options, STEP_STOOL_VARIANTS, 'step-stool', { p: '#f2f2ee', s: '#3a3d42', a: '#2f9e6a', mat: 'plastic' });
  const root = group(`step-stool-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const sec = tm(T, 's', T.mat === 'wood' ? 'rubber' : undefined);
  const grip = M.rubber();
  if (variant === 'two-step') {
    const W = 0.42 * k * T.w, H = 0.5 * k * T.h;
    const fm = T.mat === 'wood' ? fin(T, T.p, 'wood') : T.mat === 'metal' ? M.metal('#c9ced4', 0.3) : sec;
    for (const s of [-1, 1]) {
      const side = [[-0.2, 0], [-0.17, 0], [0.04, H - 0.02], [0.08, H], [0.12, H - 0.02], [0.2, 0], [0.17, 0], [0.09, H * 0.7], [0.02, H * 0.7], [-0.08, H * 0.25]];
      mesh(extrudeOutline(side.map(([x, y]) => [x * k, y]), 0.025, { bevel: 0.006 }), fm, { parent: root, at: [s * (W / 2 - 0.0125), 0, 0], rot: [0, Math.PI / 2, 0] });
    }
    mesh(roundedBox(W, 0.03, 0.14 * k, 0.01), body, { parent: root, at: [0, H * 0.48, -0.065 * k] });
    mesh(roundedBox(W * 1.02, 0.035, 0.16 * k, 0.01), body, { parent: root, at: [0, H - 0.0175, 0.08 * k * 0] });
    for (const y of [H * 0.48 + 0.016, H + 0.0005]) mesh(roundedBox(W * 0.8, 0.003, 0.1 * k, 0.001), grip, { parent: root, at: [0, y, y > H * 0.6 ? 0 : -0.065 * k] });
  } else if (variant === 'kick-stool') {
    const R = 0.21 * k * T.w, H = 0.42 * k * T.h;
    const mat = T.mat === 'plastic' ? body : T.mat === 'metal' ? M.metal(T.p, 0.3) : body;
    mesh(lathe([[R * 1.02, 0.01], [R, 0.03], [R * 0.68, H - 0.02], [R * 0.66, H], [0, H], [0, 0.03], [R * 0.95, 0.03]], 40), mat, { parent: root, name: 'body' });
    mesh(new THREE.TorusGeometry(R, 0.016, 8, 40), M.rubber(), { parent: root, at: [0, 0.018, 0], rot: [Math.PI / 2, 0, 0] });
    mesh(new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.006, 40), grip, { parent: root, at: [0, H + 0.003, 0] });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.018, 10, 8), M.plastic('#222'), { parent: root, at: [Math.cos(a) * R * 0.8, 0.018, Math.sin(a) * R * 0.8] }); }
  } else if (variant === 'kids-stool') {
    const W = 0.38 * k * T.w, H = 0.23 * k * T.h, D = 0.27 * k;
    // chunky single step with hand-grip slot: side outline with a hole
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2 * 0.9, H); s.lineTo(-W / 2 * 0.9, H); s.lineTo(-W / 2, 0);
    const hole = new THREE.Path(); hole.absellipse(0, H * 0.35, W * 0.28, H * 0.16, 0, Math.PI * 2, false); s.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(s, { depth: D - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 3, curveSegments: 20 });
    geo.translate(0, 0, -(D - 0.03) / 2);
    mesh(geo, body, { parent: root, name: 'body' });
    for (const zs of [-1, 1]) mesh(roundedBox(W * 0.7, 0.004, 0.06, 0.0015), grip, { parent: root, at: [0, H + 0.002 + 0.01, zs * D * 0.22] });
    for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 16), grip, { parent: root, at: [sx * W * 0.38, -0.012, 0] });
  } else {
    // aluminium step ladder with 3 treads and a top tray
    const H = 1.05 * k * T.h, W = 0.44 * k * T.w, D = 0.62 * k;
    const fm = T.mat === 'wood' ? fin(T, T.p, 'wood') : M.metal(T.mat === 'metal' ? T.p : '#c9ced4', 0.35);
    const rail = (a, b) => mesh(roundedBox(0.03, a.distanceTo(b), 0.06, 0.006), fm, { parent: root, at: [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], rot: [Math.atan2(b.z - a.z, b.y - a.y), 0, 0] });
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    for (const s of [-1, 1]) {
      rail(V(s * W / 2, 0, D * 0.45), V(s * W * 0.42, H, 0.02));
      rail(V(s * W / 2, 0, -D * 0.45), V(s * W * 0.42, H - 0.02, -0.04));
      mesh(roundedBox(0.035, 0.02, 0.07, 0.006), sec, { parent: root, at: [s * W / 2, 0.01, D * 0.45] });
      mesh(roundedBox(0.035, 0.02, 0.07, 0.006), sec, { parent: root, at: [s * W / 2, 0.01, -D * 0.45] });
      tube([s * W * 0.47, H * 0.45, D * 0.25], [s * W * 0.47, H * 0.45, -D * 0.25], 0.006, fm, { parent: root });
    }
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      mesh(roundedBox(W * (1 - t * 0.16), 0.03, 0.1, 0.006), T.mat === 'wood' ? fm : sec, { parent: root, at: [0, H * t, D * 0.45 * (1 - t) + 0.02 * t] });
    }
    mesh(roundedBox(W * 0.9, 0.04, 0.26, 0.01), body, { parent: root, at: [0, H + 0.02, -0.01] });
  }
  return done(root, 'step-stool', variant, o);
}

/* ================================ RAIN UMBRELLA ================================ */

export const RAIN_UMBRELLA_VARIANTS = { 'open-umbrella': {}, 'closed-umbrella': {}, 'folding-umbrella': {}, 'golf-umbrella': {}, 'umbrella-stand': {} };

/** Open canopy: n panel meshes (scalloped sphere cap), apex at origin, opening downward. */
function canopy(parent, R, n, mats, { depth = 0.38, dome = 1 } = {}) {
  const g = group('canopy', { parent });
  const rs = R / Math.sin(depth * Math.PI);
  for (let i = 0; i < n; i++) {
    const geo = new THREE.SphereGeometry(rs, 10, 10, (i / n) * Math.PI * 2, (Math.PI * 2) / n, 0, depth * Math.PI);
    const p = geo.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j), y = p.getY(j), z = p.getZ(j);
      const ang = Math.atan2(z, x);
      const ph = ((ang / (Math.PI * 2 / n)) % 1 + 1) % 1;
      const sag = 1 - 0.07 * Math.sin(ph * Math.PI) * ((rs - y) / rs);
      p.setXYZ(j, x * sag, (y - rs) * dome + 0, z * sag);
    }
    geo.computeVertexNormals();
    const m = mesh(geo, mats[i % mats.length], { parent: g });
    m.material.side = THREE.DoubleSide;
  }
  return { g, drop: (rs - rs * Math.cos(depth * Math.PI)) * dome };
}

function jHandle(parent, at, mat, s = 1) {
  return curveTube([[at[0], at[1], at[2]], [at[0], at[1] - 0.09 * s, at[2]], [at[0] + 0.015 * s, at[1] - 0.13 * s, at[2]], [at[0] + 0.05 * s, at[1] - 0.135 * s, at[2]], [at[0] + 0.07 * s, at[1] - 0.105 * s, at[2]]], 0.012 * s, mat, { parent, segments: 24 });
}

function closedUmbrella(parent, L, mat, shaftM, handleM, { folding = false, strapM } = {}) {
  const g = group('umbrella', { parent });
  const top = L;
  if (folding) {
    mesh(new THREE.CapsuleGeometry(0.025, L * 0.55, 6, 20), mat, { parent: g, at: [0, L * 0.5, 0] });
    mesh(new THREE.CylinderGeometry(0.022, 0.022, L * 0.25, 20), handleM, { parent: g, at: [0, L * 0.12, 0] });
    if (strapM) mesh(new THREE.TorusGeometry(0.026, 0.004, 6, 20), strapM, { parent: g, at: [0, L * 0.45, 0], rot: [Math.PI / 2, 0, 0] });
    curveTube([[0, 0.005, 0], [0.02, -0.02, 0], [0, -0.04, 0], [-0.02, -0.02, 0], [0, 0.005, 0]], 0.003, strapM ?? shaftM, { parent: g, segments: 16 });
    return g;
  }
  // furled canopy spindle
  const prof = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push([0.004 + 0.032 * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - t * 0.2), L * 0.3 + t * L * 0.62]); }
  prof.push([0, top * 0.92]);
  mesh(lathe(prof, 16), mat, { parent: g, name: 'furled' });
  tube([0, L * 0.12, 0], [0, L * 0.3 + 0.002, 0], 0.006, shaftM, { parent: g });
  tube([0, top * 0.92, 0], [0, top, 0], 0.004, shaftM, { parent: g });
  if (strapM) mesh(new THREE.TorusGeometry(0.025, 0.004, 6, 20).scale(1, 1, 1), strapM, { parent: g, at: [0, L * 0.62, 0], rot: [Math.PI / 2, 0, 0] });
  jHandle(g, [0, L * 0.13, 0], handleM);
  return g;
}

export function createRainUmbrella(options = {}) {
  const { o, variant, T } = setup(options, RAIN_UMBRELLA_VARIANTS, 'rain-umbrella', { p: '#1d2a4a', s: '#f2f2ee', a: '#a5733f', mat: 'nylon' });
  const root = group(`rain-umbrella-${variant}`);
  const k = T.k;
  const body = fin(T, T.p, T.mat === 'plastic' || T.mat === 'glass' ? T.mat : 'nylon', { pattern: T.pattern });
  const sec = fin(T, T.s, 'nylon');
  const shaftM = T.lux ? M.metal('#d6a93c', 0.2) : M.chrome();
  const handleM = T.mat === 'wood' || T.trim === 'vintage' || T.lux ? fin(T, T.lux ? '#2a1a10' : '#7a4a26', 'wood') : T.trim === 'kids' ? fin(T, T.a, 'plastic') : M.plastic('#1a1a1a', 0.4);
  if (variant === 'open-umbrella' || variant === 'golf-umbrella') {
    const golf = variant === 'golf-umbrella';
    const R = (golf ? 0.7 : 0.5) * k * T.w;
    const n = golf ? 8 : 8;
    const mats = golf || T.trim === 'striped' || T.trim === 'kids' ? [body, sec] : [body];
    const um = group('open', { parent: root, rot: [0, 0.6, 1.15] });
    const shaft = (golf ? 0.85 : 0.72) * k;
    const { drop } = canopy(um, R, n, mats, { depth: T.slim ? 0.3 : 0.36 });
    void drop;
    // tip + top cap
    mesh(new THREE.CylinderGeometry(0.004, 0.008, 0.06, 10), shaftM, { parent: um, at: [0, 0.02, 0] });
    tube([0, -0.002, 0], [0, -shaft, 0], golf ? 0.008 : 0.005, shaftM, { parent: um });
    // ribs + stretchers
    const rs = R / Math.sin((T.slim ? 0.3 : 0.36) * Math.PI);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const tip = [Math.cos(a) * R * 0.995, -(rs - rs * Math.cos((T.slim ? 0.3 : 0.36) * Math.PI)) - 0.002, Math.sin(a) * R * 0.995];
      const mid = [Math.cos(a) * R * 0.5, -(rs - Math.sqrt(rs * rs - (R * 0.5) ** 2)) - 0.004, Math.sin(a) * R * 0.5];
      tube(mid, [0, -shaft * 0.35, 0], 0.002, shaftM, { parent: um });
      mesh(new THREE.SphereGeometry(0.006, 8, 6), shaftM, { parent: um, at: tip });
    }
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 12), shaftM, { parent: um, at: [0, -shaft * 0.35, 0] });
    if (golf || T.chunky) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 16), handleM, { parent: um, at: [0, -shaft - 0.08, 0] });
    else jHandle(um, [0, -shaft + 0.01, 0], handleM);
  } else if (variant === 'closed-umbrella') {
    const g = closedUmbrella(root, 0.9 * k * T.h, body, shaftM, handleM, { strapM: sec });
    g.rotation.z = Math.PI / 2;
  } else if (variant === 'folding-umbrella') {
    const g = closedUmbrella(root, 0.28 * k * T.h, body, shaftM, handleM, { folding: true, strapM: sec });
    g.rotation.z = Math.PI / 2;
  } else {
    // umbrella stand: hollow cylinder with umbrellas inside
    const R = 0.12 * k * T.w, H = 0.5 * k * T.h;
    const sm = T.mat === 'metal' ? M.metal(T.p, 0.35) : T.mat === 'ceramic' ? fin(T, T.p, 'ceramic') : T.mat === 'wood' ? fin(T, T.p, 'wood') : fin(T, T.p, T.mat === 'nylon' ? 'metal' : T.mat);
    const prof = T.round > 1.2 ? [[R * 0.8, 0], [R * 1.05, H * 0.3], [R * 0.9, H * 0.85], [R, H]] : [[R, 0], [R, H]];
    mesh(vessel(prof, 0.006, 0.012, 40), sm, { parent: root, name: 'stand' });
    if (T.detail >= 1) for (const y of [0.15, 0.85]) mesh(new THREE.TorusGeometry(R + 0.002, 0.005, 6, 40), hw(T), { parent: root, at: [0, H * y, 0], rot: [Math.PI / 2, 0, 0] });
    const cols = [T.p, '#8a2a2a', '#2a5a3a'];
    [[0.03, 0.3, 0.2], [-0.04, -0.25, 0.15], [0.01, 0.05, -0.28]].forEach(([x, rz, rx], i) => {
      const g = closedUmbrella(root, 0.88 * k, fin(T, i ? cols[i] : T.s, 'nylon'), M.chrome(), handleM, { strapM: M.matte('#222') });
      g.position.set(x * k * 0.7, 0.88 * k + 0.012, (i - 1) * 0.03);
      g.rotation.set(rx * 0.3, 0, Math.PI + rz * 0.3);
    });
  }
  return done(root, 'rain-umbrella', variant, o);
}
