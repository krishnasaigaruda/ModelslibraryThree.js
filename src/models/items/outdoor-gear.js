// Everyday items, outdoor group (garage & camping): padlocks, rope & chain, toolboxes,
// flashlights & lanterns, coolers and camping gear.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, cushion, setup, done, fin, tm, hw, TRIMS, clip, spinTrack, rotateTrack, moveTrack, pingPong, lampGroup, lampTracks, LAMP_ON, labelPlane, textDraw, strap } from './common.js';
import { merge, rodGeo, torusGeo, boxVessel, boxSolid, wheel, ropeMat } from './outdoor-util.js';

/* ================================ PADLOCK ================================ */

export const PADLOCK_VARIANTS = { 'keyed-padlock': {}, 'combination-lock': {}, 'disc-lock': {}, 'bike-u-lock': {}, 'cable-lock': {} };

export function createPadlock(options = {}) {
  const { o, variant, T } = setup(options, PADLOCK_VARIANTS, 'padlock', { p: '#b8913f', s: '#c9ccd2', a: '#1d1d1d', mat: 'brass' });
  const root = group(`padlock-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const steel = T.worn ? M.metal('#8a7a68', 0.65) : M.metal('#d0d3d8', 0.18);
  const dark = fin(T, T.a, 'plastic');
  let anim = () => [];
  if (variant === 'keyed-padlock' || variant === 'combination-lock' || variant === 'disc-lock') {
    const disc = variant === 'disc-lock';
    const W = (disc ? 0.07 : 0.05) * k * T.w, H = (disc ? 0.07 : 0.045) * k * T.h, D = (T.chunky || T.rugged ? 0.026 : 0.018) * k;
    if (disc) {
      mesh(new THREE.CylinderGeometry(W / 2, W / 2, D, 40).rotateX(Math.PI / 2), body, { parent: root, at: [0, W / 2, 0], name: 'body' });
      mesh(new THREE.TorusGeometry(W / 2 - 0.001, 0.002, 6, 40), steel, { parent: root, at: [0, W / 2, 0] });
    } else {
      mesh(roundedBox(W, H, D, 0.004 * T.round), body, { parent: root, at: [0, H / 2, 0], name: 'body' });
      if (T.rugged || T.detail >= 2) for (let i = 1; i < 6; i++) mesh(roundedBox(W + 0.001, 0.0012, D + 0.001, 0.0005), steel, { parent: root, at: [0, (H * i) / 6, 0] });
    }
    // shackle
    const sh = group('shackle', { parent: root, at: [0, disc ? W * 0.82 : H, 0] });
    const sr = (T.chunky || T.rugged ? 0.0045 : 0.0035) * k;
    const sw = disc ? W * 0.18 : W * 0.32;
    const sl = (disc ? 0.012 : T.trim === 'tall' ? 0.05 : 0.025) * k;
    mesh(new THREE.TorusGeometry(sw, sr, 10, 24, Math.PI), steel, { parent: sh, at: [0, sl, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(sr, sr, sl + 0.006, 12), steel, { parent: sh, at: [s * sw, sl / 2 - 0.003, 0] });
    if (disc) sh.rotation.x = Math.PI / 2 * 0;
    if (variant === 'combination-lock') {
      // 4 number wheels across the front bottom
      for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.006 * k, 0.006 * k, W * 0.17, 12).rotateZ(Math.PI / 2), dark, { parent: root, at: [(-1.5 + i) * W * 0.21, H * 0.3, D / 2], name: i ? undefined : 'dials' });
    } else {
      const key = mesh(new THREE.CylinderGeometry(0.004 * k, 0.004 * k, 0.002, 16).rotateX(Math.PI / 2), M.metal('#2a2b2e', 0.4), { parent: root, at: [0, disc ? W / 2 : H * 0.35, D / 2 + 0.001] });
      void key;
    }
    if (T.trim === 'kids' || T.mat === 'plastic' || T.mat === 'rubber') mesh(roundedBox(W * 1.04, H * 0.85, D * 1.08, 0.006), fin(T, T.s, 'rubber'), { parent: root, at: [0, H * 0.42, 0] });
    anim = () => [clip('open', 2, [moveTrack(sh, 2, (t) => [0, pingPong(t) * sl * 0.8, 0])])];
  } else if (variant === 'bike-u-lock') {
    // U-lock lying flat
    const L = 0.25 * k * T.h, Wd = 0.17 * k * T.w, r = (T.chunky ? 0.009 : 0.007) * k;
    const shM = T.trim ? fin(T, T.p, T.mat === 'brass' ? 'rubber' : T.mat) : fin(T, '#d63a2a', 'rubber');
    const u = group('shackle', { parent: root, rot: [-Math.PI / 2, 0, 0] });
    mesh(new THREE.TorusGeometry(Wd / 2, r, 10, 32, Math.PI), shM, { parent: u, at: [0, L - Wd / 2, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(r, r, L - Wd / 2, 12), shM, { parent: u, at: [s * Wd / 2, (L - Wd / 2) / 2, 0] });
    const bar = group('crossbar', { parent: u });
    mesh(new THREE.CapsuleGeometry(0.015 * k, Wd + 0.02, 6, 16).rotateZ(Math.PI / 2), fin(T, '#1d1d1d', 'plastic'), { parent: bar, at: [0, 0.01, 0] });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 16), steel, { parent: bar, at: [Wd * 0.3, 0.01, 0.015 * k] , rot: [Math.PI / 2, 0, 0] });
  } else {
    // coiled cable lock with a lock head
    const R = 0.08 * k * T.w, r = (T.chunky ? 0.006 : 0.0045) * k;
    const cm = T.trim ? tm(T, 'p', T.mat === 'brass' ? 'plastic' : undefined) : fin(T, '#2a5ab8', 'plastic');
    const geos = [];
    for (let i = 0; i < 5; i++) geos.push(torusGeo(R, r, [0, r + i * r * 2, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 40));
    mesh(merge(geos), cm, { parent: root, name: 'cable' });
    mesh(roundedBox(0.035 * k, 0.025 * k, 0.06 * k, 0.008), fin(T, '#1d1d1d', 'plastic'), { parent: root, at: [R + 0.012, 0.0125 * k, 0] });
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.006 * k, 0.006 * k, 0.006, 10), steel, { parent: root, at: [R + 0.012, 0.025 * k + 0.003, -0.021 * k + i * 0.014 * k] });
  }
  return done(root, 'padlock', variant, o, anim);
}

/* ================================ ROPE & CHAIN ================================ */

export const ROPE_AND_CHAIN_VARIANTS = { 'rope-coil': {}, 'chain-coil': {}, 'bungee-cords': {}, 'twine-ball': {}, 'rope-hank': {} };

export function createRopeAndChain(options = {}) {
  const { o, variant, T } = setup(options, ROPE_AND_CHAIN_VARIANTS, 'rope-and-chain', { p: '#c9a878', s: '#8a6a44', a: '#1d1d1d', mat: 'fabric' });
  const root = group(`rope-and-chain-${variant}`);
  const k = T.k;
  const rope = ropeMat(T.trim ? T.p : variant === 'twine-ball' ? '#c9a46a' : '#d8c08a');
  if (T.trim && !['canvas', 'fabric', 'cotton', 'knit', 'paper', 'kraft'].includes(T.mat) && T.mat) Object.assign(rope, { roughness: 0.75 });
  if (variant === 'rope-coil') {
    const r = (T.chunky ? 0.012 : T.slim ? 0.006 : 0.009) * k, R0 = 0.06 * k;
    // flat spiral coil (flemish flake) a couple of layers high
    const pts = [];
    const turns = 7, layers = T.trim === 'large' || T.trim === 'xl' ? 3 : 2;
    for (let L = 0; L < layers; L++) for (let i = 0; i <= turns * 24; i++) {
      const a = (i / 24) * Math.PI * 2, rr = R0 + (L % 2 ? turns * 24 - i : i) / 24 * r * 2.05;
      pts.push([Math.cos(a) * rr, r + L * r * 1.9, Math.sin(a) * rr]);
    }
    curveTube(pts, r, rope, { parent: root, segments: pts.length * 2, radialSegments: 8, name: 'rope' });
    const last = pts[pts.length - 1];
    curveTube([last, [last[0] + 0.1, r, last[2] + 0.1], [last[0] + 0.18, r, last[2] + 0.12]], r, rope, { parent: root, segments: 16 });
    mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.02, 10).rotateZ(Math.PI / 2), fin(T, T.a, 'plastic'), { parent: root, at: [last[0] + 0.19, r, last[2] + 0.12] });
  } else if (variant === 'chain-coil') {
    const lr = (T.chunky ? 0.016 : T.slim ? 0.009 : 0.012) * k, wr = lr * 0.28;
    const steel = T.trim ? fin(T, T.p, ['metal', 'brass', 'copper', 'gold', 'silver'].includes(T.mat) ? T.mat : 'metal') : (T.worn ? M.metal('#7a5034', 0.75) : M.metal('#b9bec6', 0.3));
    const geos = [];
    const n = T.trim === 'large' ? 90 : 70, step = lr * 1.5;
    let a = 0, R = 0.06 * k;
    for (let i = 0; i < n; i++) {
      const x = Math.cos(a) * R, z = Math.sin(a) * R;
      const yy = lr * 0.7 + Math.floor(i / 40) * lr * 1.2;
      const g = new THREE.TorusGeometry(lr * 0.7, wr, 6, 14);
      g.scale(1.5, 1, 1);
      if (i % 2) g.rotateX(Math.PI / 2);
      g.rotateY(-a - Math.PI / 2);
      g.translate(x, yy, z);
      geos.push(g);
      a += step / R;
      R += (lr * 2) * step / (2 * Math.PI * R);
    }
    mesh(merge(geos), steel, { parent: root, name: 'chain' });
  } else if (variant === 'bungee-cords') {
    const cols = [T.p, T.trim ? T.s : '#e8402f', T.trim ? T.a : '#2457b8', '#f4c21a'];
    const hook = M.metal('#c9ccd2', 0.25);
    for (let i = 0; i < (T.trim === 'large' ? 4 : 3); i++) {
      const z = (i - 1) * 0.04, len = (0.45 + i * 0.12) * k;
      const cm = new THREE.MeshStandardMaterial({ name: 'cord', color: cols[i], roughness: 0.6 });
      const r = (T.chunky ? 0.006 : 0.0045) * k;
      curveTube([[-len / 2, r, z], [-len / 4, r, z + 0.02], [len / 4, r, z - 0.02], [len / 2, r, z]], r, cm, { parent: root, segments: 32 });
      for (const s of [-1, 1]) {
        const hx = s * (len / 2 + 0.01);
        mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, 0.03, 10).rotateZ(Math.PI / 2), fin(T, '#1d1d1d', 'plastic'), { parent: root, at: [s * len / 2, r * 1.4, z] });
        curveTube([[hx, r, z], [hx + s * 0.03, r, z], [hx + s * 0.04, r, z + 0.012], [hx + s * 0.03, r, z + 0.02]], 0.0025, hook, { parent: root, segments: 12 });
      }
    }
  } else if (variant === 'twine-ball') {
    const R = 0.06 * k * (T.chunky ? 1.2 : 1);
    mesh(new THREE.SphereGeometry(R, 24, 16), rope, { parent: root, at: [0, R * 0.92, 0], scale: [1, 0.92, 1.05], name: 'ball' });
    const geos = [];
    const rnd = T.r;
    for (let i = 0; i < 26; i++) geos.push(torusGeo(R * 1.005, 0.0012, [0, 0, 0], [rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI], Math.PI * 2, 40).scale(1, 0.92, 1.05).translate(0, R * 0.92, 0));
    mesh(merge(geos), ropeMat(T.trim ? T.s : '#b08a52'), { parent: root });
    curveTube([[R * 0.6, R * 0.2, R * 0.6], [R * 1.4, 0.0015, R * 1.0], [R * 2.4, 0.0015, R * 0.6]], 0.0015, rope, { parent: root, segments: 16 });
  } else {
    // rope hank: coiled loops bound with a few wraps, lying flat
    const r = (T.chunky ? 0.011 : 0.008) * k, R = 0.16 * k;
    const geos = [];
    for (let i = 0; i < 9; i++) geos.push(torusGeo(R + (i % 3) * r * 0.6, r, [((i % 3) - 1) * r * 1.2, r + Math.floor(i / 3) * r * 1.5, 0], [Math.PI / 2, 0, (i - 4) * 0.02], Math.PI * 2, 48));
    mesh(merge(geos), rope, { parent: root, name: 'rope' });
    for (let j = 0; j < 4; j++) mesh(new THREE.TorusGeometry(r * 3.2, r * 0.9, 8, 16), rope, { parent: root, at: [-R - r, r * 2.3, (j - 1.5) * r * 1.8], rot: [0, 0, 0] });
  }
  return done(root, 'rope-and-chain', variant, o);
}

/* ================================ TOOLBOX ================================ */

export const TOOLBOX_VARIANTS = { 'metal-toolbox': {}, 'plastic-toolbox': { p: '#f2a516', s: '#1d1d1d' }, 'tool-bag': { p: '#6a6448', s: '#3a2a1c' }, 'tackle-box': { p: '#2f6a4a', s: '#e9e6df' }, 'tool-chest': {} };

function handTools(parent, W, D, y) {
  // a few tool silhouettes poking out of an open container
  const steel = M.metal('#b9bec6', 0.3), red = M.plastic('#c42a2a', 0.4), yel = M.plastic('#f4c21a', 0.4);
  tube([-W * 0.3, y - 0.06, 0], [-W * 0.2, y + 0.06, D * 0.15], 0.012, red, { parent }); // screwdriver handle
  tube([-W * 0.2, y + 0.06, D * 0.15], [-W * 0.15, y + 0.12, D * 0.22], 0.003, steel, { parent });
  tube([W * 0.15, y - 0.06, -D * 0.1], [W * 0.25, y + 0.05, -D * 0.12], 0.011, yel, { parent }); // hammer
  mesh(roundedBox(0.09, 0.025, 0.025, 0.006), steel, { parent, at: [W * 0.25, y + 0.06, -D * 0.12], rot: [0, 0, 0.6] });
  tube([0, y - 0.06, D * 0.05], [W * 0.05, y + 0.08, D * 0.05], 0.006, steel, { parent }); // wrench
  mesh(new THREE.TorusGeometry(0.012, 0.005, 6, 12, Math.PI * 1.6), steel, { parent, at: [W * 0.05 + 0.002, y + 0.093, D * 0.05] });
}

export function createToolbox(options = {}) {
  const { o, variant, T } = setup(options, TOOLBOX_VARIANTS, 'toolbox', { p: '#c42a2a', s: '#2a2b2e', a: '#c9ccd2' });
  if (!TRIMS[T.trim]?.mat) T.mat = variant === 'metal-toolbox' || variant === 'tool-chest' ? 'metal' : variant === 'tool-bag' ? 'canvas' : 'plastic';
  const root = group(`toolbox-${variant}`);
  const k = T.k;
  const body = T.mat === 'metal' ? M.paint(T.p, { metallic: 0.4, roughness: 0.4 }) : tm(T, 'p');
  if (T.mat === 'metal' && T.worn) body.roughness = 0.75;
  const dark = fin(T, T.s, 'plastic');
  const metalHw = hw(T);
  let anim = () => [];
  if (variant === 'metal-toolbox' || variant === 'plastic-toolbox' || variant === 'tackle-box') {
    const W = (variant === 'tackle-box' ? 0.36 : 0.5) * k * T.w, H = (variant === 'tackle-box' ? 0.15 : 0.2) * k * T.h, D = (variant === 'tackle-box' ? 0.2 : 0.22) * k;
    const n = variant === 'metal-toolbox' ? 14 : 6;
    mesh(boxVessel(W, H, D, { t: 0.004, base: 0.98, n }), body, { parent: root, name: 'box' });
    if (variant !== 'tackle-box') handTools(root, W, D, H * 0.8);
    // lid: hinged along the back edge
    const lid = group('lid', { parent: root, at: [0, H + 0.002, -D / 2] });
    const LH = (variant === 'metal-toolbox' ? 0.06 : 0.05) * k;
    if (variant === 'metal-toolbox') {
      // classic barn-roof lid
      mesh(boxSolid(W + 0.006, LH, D + 0.006, { n, top: 0.7, bevel: 0.004 }), body, { parent: lid, at: [0, 0, D / 2] });
      const hy = LH + 0.035 * k;
      for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.04 * k, 0.012, 0.004), metalHw, { parent: lid, at: [s * W * 0.2, LH + 0.016 * k, D / 2] });
      mesh(new THREE.CylinderGeometry(0.011, 0.011, W * 0.42, 12).rotateZ(Math.PI / 2), dark, { parent: lid, at: [0, hy, D / 2] });
    } else {
      mesh(boxSolid(W + 0.006, LH, D + 0.006, { n, top: 0.97, bevel: 0.012 }), body, { parent: lid, at: [0, 0, D / 2] });
      if (variant === 'plastic-toolbox') {
        mesh(roundedBox(W * 0.5, 0.02, 0.05, 0.009), dark, { parent: lid, at: [0, LH + 0.005, D / 2] });
        mesh(roundedBox(W * 0.3, 0.012, 0.025, 0.005), dark, { parent: lid, at: [0, LH + 0.03, D / 2] });
        for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.035, 0.06, 0.004), dark, { parent: lid, at: [s * W * 0.3, LH + 0.02, D / 2] });
        for (const s of [-1, 1]) mesh(roundedBox(0.04, 0.05, 0.012, 0.004), fin(T, T.a, 'plastic'), { parent: root, at: [s * W * 0.32, H - 0.005, D / 2 + 0.003] });
      } else {
        // translucent compartment lid + handle
        mesh(roundedBox(W * 0.9, 0.003, D * 0.85, 0.001), fin(T, '#dfe9ec', 'glass'), { parent: lid, at: [0, LH + 0.0005, D / 2] });
        curveTube([[-0.05, LH, D / 2], [-0.04, LH + 0.03, D / 2], [0.04, LH + 0.03, D / 2], [0.05, LH, D / 2]], 0.006, dark, { parent: lid, segments: 16 });
        // compartments inside the box
        const parts = [];
        for (let i = 1; i < 5; i++) parts.push(new THREE.BoxGeometry(0.003, H * 0.9, D - 0.01).translate(-W / 2 + (i * W) / 5, H * 0.45 + 0.002, 0));
        parts.push(new THREE.BoxGeometry(W - 0.01, H * 0.9, 0.003).translate(0, H * 0.45 + 0.002, 0));
        mesh(merge(parts), body, { parent: root });
      }
    }
    if (variant === 'metal-toolbox') for (const s of [-1, 1]) mesh(roundedBox(0.025, 0.03, 0.008, 0.003), metalHw, { parent: root, at: [s * W * 0.32, H - 0.01, D / 2 + 0.002] });
    lid.rotation.x = 0;
    anim = () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => -pingPong(t) * 1.6)])];
  } else if (variant === 'tool-bag') {
    // open-mouth canvas tool bag with leather trim, tools poking out
    const W = 0.45 * k * T.w, H = 0.26 * k * T.h, D = 0.22 * k;
    mesh(boxVessel(W, H, D, { t: 0.005, base: 1, n: 6 }), body, { parent: root, name: 'bag' });
    mesh(boxVessel(W + 0.008, 0.04, D + 0.008, { t: 0.006, n: 6 }), fin(T, T.s, T.mat === 'leather' ? 'leather' : 'rubber'), { parent: root });
    mesh(boxVessel(W * 1.004, 0.012, D * 1.004, { t: 0.004, n: 6 }), metalHw, { parent: root, at: [0, H - 0.012, 0] });
    handTools(root, W, D, H * 0.85);
    for (const s of [-1, 1]) {
      strap([[-W * 0.22, H - 0.02, s * (D / 2 + 0.003)], [-W * 0.18, H + 0.15 * k, s * D * 0.25], [W * 0.18, H + 0.15 * k, s * D * 0.25], [W * 0.22, H - 0.02, s * (D / 2 + 0.003)]], 0.03, 0.006, fin(T, T.s, 'leather'), { parent: root });
      for (const xs of [-1, 1]) mesh(cushion(W * 0.25, H * 0.5, 0.025, { bulge: 0.15 }), body, { parent: root, at: [xs * W * 0.24, H * 0.32, s * (D / 2 + 0.01)] });
    }
  } else {
    // rolling tool chest: cabinet with drawers + top box
    const W = 0.65 * k * T.w, H = 0.75 * k * T.h, D = 0.42 * k;
    const cab = mesh(roundedBox(W, H, D, 0.01), body, { parent: root, at: [0, 0.08 + H / 2, 0], name: 'cabinet' });
    void cab;
    const nd = T.trim === 'tall' ? 8 : 6;
    for (let i = 0; i < nd; i++) {
      const dh = (H - 0.04) / nd;
      const dr = group(i ? `drawer${i}` : 'drawer', { parent: root, at: [0, 0.08 + 0.02 + dh * (i + 0.5), D / 2] });
      mesh(roundedBox(W - 0.04, dh - 0.008, 0.012, 0.003), body, { parent: dr, at: [0, 0, 0.004] });
      mesh(roundedBox(W * 0.6, 0.012, 0.012, 0.005), M.metal('#d0d3d8', 0.2), { parent: dr, at: [0, dh * 0.25, 0.016] });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cs = group(`castor${sx}${sz}`, { parent: root, at: [sx * (W / 2 - 0.05), 0, sz * (D / 2 - 0.05)] });
      mesh(roundedBox(0.04, 0.035, 0.04, 0.005), dark, { parent: cs, at: [0, 0.0625, 0] });
      wheel(0.035, 0.025, { parent: cs, at: [0, 0.035, 0], hub: dark, name: `wheel${sx}${sz}` });
    }
    tube([-W / 2 - 0.005, 0.08 + H * 0.9, -D * 0.3], [-W / 2 - 0.05, 0.08 + H * 0.9, -D * 0.3], 0.01, M.metal('#d0d3d8', 0.2), { parent: root });
    tube([-W / 2 - 0.005, 0.08 + H * 0.9, D * 0.3], [-W / 2 - 0.05, 0.08 + H * 0.9, D * 0.3], 0.01, M.metal('#d0d3d8', 0.2), { parent: root });
    tube([-W / 2 - 0.05, 0.08 + H * 0.9, -D * 0.3], [-W / 2 - 0.05, 0.08 + H * 0.9, D * 0.3], 0.012, M.metal('#d0d3d8', 0.2), { parent: root });
    mesh(roundedBox(W + 0.01, 0.02, D + 0.01, 0.006), dark, { parent: root, at: [0, 0.08 + H + 0.01, 0] });
    const drawer = root.getObjectByName('drawer');
    anim = () => [clip('open', 3, [moveTrack(drawer, 3, (t) => [0, 0, pingPong(t) * D * 0.6])])];
  }
  return done(root, 'toolbox', variant, o, anim);
}

/* ================================ FLASHLIGHT & LANTERN ================================ */

export const FLASHLIGHT_VARIANTS = { torch: {}, 'long-flashlight': {}, headlamp: {}, 'camping-lantern': {}, 'oil-lantern': {}, 'pen-light': {} };

export function createFlashlight(options = {}) {
  const { o, variant, T } = setup(options, FLASHLIGHT_VARIANTS, 'flashlight', { p: '#1d1d20', s: '#f2a516', a: '#c9ccd2' });
  if (!TRIMS[T.trim]?.mat) T.mat = variant === 'oil-lantern' ? 'metal' : 'plastic';
  const root = group(`flashlight-${variant}`);
  const k = T.k;
  const body = tm(T, 'p', T.mat === 'leather' ? 'rubber' : undefined);
  const acc = fin(T, T.s, T.mat === 'metal' ? 'metal' : 'rubber');
  const kind = T.trim === 'vintage' || variant === 'oil-lantern' ? 'head' : 'white';
  const lamp = lampGroup('beam', kind);
  if (variant === 'torch' || variant === 'long-flashlight' || variant === 'pen-light') {
    const L = (variant === 'long-flashlight' ? 0.34 : variant === 'pen-light' ? 0.14 : 0.17) * k * T.h;
    const r = (variant === 'long-flashlight' ? 0.019 : variant === 'pen-light' ? 0.007 : 0.015) * k * (T.chunky ? 1.2 : 1);
    const hr = variant === 'pen-light' ? r * 1.05 : r * (T.rugged ? 1.8 : 1.5);
    const g = group('light', { parent: root, rot: [0, 0, -Math.PI / 2] });
    const prof = [[0, 0], [r * 0.9, 0], [r, r * 0.3], [r, L * 0.7], [hr * 0.95, L * 0.82], [hr, L * 0.97], [hr * 0.98, L], [0, L]];
    mesh(lathe(prof, 28), body, { parent: g, name: 'body' });
    if (variant !== 'pen-light') {
      for (let i = 0; i < (T.detail ? 6 : 4); i++) mesh(new THREE.TorusGeometry(r + 0.0005, 0.0012, 6, 24), acc, { parent: g, at: [0, L * (0.15 + i * 0.07), 0], rot: [Math.PI / 2, 0, 0] });
      mesh(roundedBox(r * 0.8, r * 0.6, r * 0.5, r * 0.2), acc, { parent: g, at: [r * 0.95, L * 0.62, 0], rot: [0, 0, 0] });
      mesh(new THREE.TorusGeometry(hr * 0.98, 0.0025, 8, 28), T.rugged ? acc : M.metal('#c9ccd2', 0.2), { parent: g, at: [0, L, 0], rot: [Math.PI / 2, 0, 0] });
    } else {
      curveTube([[r, L * 0.75, 0], [r * 2, L * 0.72, 0], [r * 2, L * 0.4, 0], [r * 1.1, L * 0.35, 0]], 0.0015, M.metal('#c9ccd2', 0.2), { parent: g, segments: 12 });
    }
    lamp.add(g, { at: [0, L, 0], normal: [0, 1, 0], w: hr * 1.5, h: hr * 1.5, depth: 0.003, shape: 'round', bezel: false, glowSize: hr * 3.5 });
    // lanyard loop at the tail
    if (variant !== 'pen-light') mesh(new THREE.TorusGeometry(r * 0.6, 0.0015, 6, 16), acc, { parent: g, at: [0, -r * 0.4, 0] });
  } else if (variant === 'headlamp') {
    const s = k;
    const band = fin(T, T.trim ? T.p : '#e8402f', 'fabric');
    const ring = mesh(new THREE.TorusGeometry(0.08 * s, 0.006 * s, 4, 48), band, { parent: root, at: [0, 0.006 * s, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 1.25, 1] });
    ring.scale.set(1, 1.25, 0.25);
    const mod = group('module', { parent: root, at: [0, 0.006 * s, 0.1 * s] });
    mesh(roundedBox(0.06 * s, 0.035 * s, 0.03 * s, 0.01 * s), tm(T, 's', 'plastic'), { parent: mod, at: [0, 0.0175 * s - 0.006 * s, 0.012 * s] });
    lamp.add(mod, { at: [0, 0.012 * s, 0.027 * s], normal: [0, 0, 1], w: 0.022 * s, h: 0.022 * s, depth: 0.003, shape: 'round', bezel: false, glowSize: 0.03 * s });
  } else if (variant === 'camping-lantern') {
    const R = 0.055 * k * T.w, H = 0.2 * k * T.h;
    mesh(lathe([[0, 0], [R * 1.1, 0], [R * 1.15, 0.01], [R, H * 0.25], [0, H * 0.25]], 32), body, { parent: root, name: 'base' });
    const globe = lathe([[R * 0.85, H * 0.25], [R * 0.95, H * 0.5], [R * 0.85, H * 0.75], [0, H * 0.75]], 32);
    lamp.add(root, { geometry: globe, normal: [0, 0, 1], depth: R * 0.2, glowSize: R * 2.2 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; tube([Math.cos(a) * R * 0.92, H * 0.25, Math.sin(a) * R * 0.92], [Math.cos(a) * R * 0.92, H * 0.76, Math.sin(a) * R * 0.92], 0.004, body, { parent: root }); }
    mesh(lathe([[0, H * 0.74], [R * 1.0, H * 0.74], [R * 1.05, H * 0.78], [R * 0.4, H * 0.86], [0, H * 0.87]], 32), body, { parent: root });
    curveTube([[-R * 0.35, H * 0.85, 0], [-R * 0.5, H * 1.05, 0], [R * 0.5, H * 1.05, 0], [R * 0.35, H * 0.85, 0]], 0.004, acc, { parent: root, segments: 20 });
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.01, 16).rotateX(Math.PI / 2), acc, { parent: root, at: [0, H * 0.12, R * 1.02] });
  } else {
    // hurricane oil lantern
    const R = 0.06 * k * T.w, H = 0.28 * k * T.h;
    const met = T.trim ? tm(T, 'p') : fin(T, '#b8302a', 'metal');
    mesh(lathe([[0, 0], [R * 1.1, 0], [R * 1.15, 0.01], [R * 1.1, H * 0.18], [R * 0.6, H * 0.22], [0, H * 0.22]], 32), met, { parent: root, name: 'tank' });
    const chim = lathe([[R * 0.5, H * 0.22], [R * 0.85, H * 0.42], [R * 0.82, H * 0.6], [R * 0.4, H * 0.74], [0, H * 0.74]], 32);
    lamp.add(root, { geometry: chim, normal: [0, 0, 1], depth: R * 0.2, glowSize: R * 2.2 });
    for (const s of [-1, 1]) {
      curveTube([[s * R * 1.05, H * 0.15, 0], [s * R * 1.15, H * 0.5, 0], [s * R * 0.5, H * 0.8, 0]], 0.004, met, { parent: root, segments: 20 });
      curveTube([[0, H * 0.21, s * R * 0.62], [0, H * 0.45, s * R * 0.98], [0, H * 0.7, s * R * 0.48]], 0.0025, met, { parent: root, segments: 16 });
    }
    mesh(lathe([[0, H * 0.73], [R * 0.75, H * 0.73], [R * 0.6, H * 0.82], [R * 0.25, H * 0.86], [0, H * 0.86]], 24), met, { parent: root });
    curveTube([[-R * 0.25, H * 0.85, 0], [-R * 0.9, H * 1.1, 0], [R * 0.9, H * 1.1, 0], [R * 0.25, H * 0.85, 0]], 0.0028, met, { parent: root, segments: 20 });
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 12).rotateZ(Math.PI / 2), M.metal('#b8913f', 0.3), { parent: root, at: [R * 1.1, H * 0.2, 0] });
  }
  return done(root, 'flashlight', variant, o, () => [clip('on', 1, lampTracks('beam', LAMP_ON[kind]))]);
}

/* ================================ COOLER ================================ */

export const COOLER_VARIANTS = { 'cooler-box': {}, 'soft-cooler': {}, 'wheeled-cooler': {}, 'ice-chest': {}, 'lunch-cooler': { p: '#c42a2a', s: '#2a2b2e' } };

export function createCooler(options = {}) {
  const { o, variant, T } = setup(options, COOLER_VARIANTS, 'cooler', { p: '#2457b8', s: '#f4f3ef', a: '#2a2b2e' });
  if (!TRIMS[T.trim]?.mat) T.mat = variant === 'soft-cooler' || variant === 'lunch-cooler' ? 'nylon' : variant === 'ice-chest' ? 'metal' : 'plastic';
  const root = group(`cooler-${variant}`);
  const k = T.k;
  const body = variant === 'ice-chest' && !T.trim ? M.paint('#2f7a4a', { metallic: 0.3, roughness: 0.45 }) : tm(T, 'p');
  const lidM = variant === 'ice-chest' || T.mat === 'nylon' || T.mat === 'canvas' ? body : fin(T, T.s, T.mat === 'metal' ? 'metal' : 'plastic');
  const inner = fin(T, '#e9ebe8', 'plastic');
  const dark = fin(T, T.a, 'plastic');
  let anim = () => [];
  const soft = variant === 'soft-cooler' || variant === 'lunch-cooler';
  const W = (variant === 'lunch-cooler' ? 0.28 : variant === 'soft-cooler' ? 0.38 : variant === 'ice-chest' ? 0.7 : 0.6) * k * T.w;
  const H = (variant === 'lunch-cooler' ? 0.22 : variant === 'soft-cooler' ? 0.3 : 0.36) * k * T.h;
  const D = (variant === 'lunch-cooler' ? 0.18 : variant === 'soft-cooler' ? 0.26 : 0.38) * k;
  const y0 = variant === 'wheeled-cooler' ? 0.04 : 0;
  const n = variant === 'lunch-cooler' ? 10 : soft ? 5 : T.rugged ? 6 : 10;
  const t = soft ? 0.008 : 0.03;
  mesh(boxVessel(W, H, D, { t, base: soft ? 1 : 0.96, n }), body, { parent: root, at: [0, y0, 0], name: 'box' });
  mesh(boxVessel(W - 2 * t, H - 0.03, D - 2 * t, { t: 0.003, n }), inner, { parent: root, at: [0, y0 + 0.03, 0] });
  const lid = group('lid', { parent: root, at: [0, y0 + H, -D / 2] });
  const LH = soft ? 0.05 * k : 0.06 * k;
  if (soft) {
    mesh(cushion(W * 1.02, LH, D * 1.02, { bulge: 0.2, radius: LH * 0.4 }), lidM, { parent: lid, at: [0, LH / 2, D / 2] });
    mesh(new THREE.TorusGeometry(Math.min(W, D) * 0.03, 0.004, 6, 12), hw(T), { parent: lid, at: [W * 0.3, LH * 0.6, D + 0.006] });
    // shoulder strap & front pocket
    for (const s of [-1, 1]) mesh(roundedBox(0.03, 0.04, 0.02, 0.006), dark, { parent: root, at: [s * (W / 2 + 0.006), y0 + H * 0.85, 0] });
    if (variant === 'lunch-cooler') strap([[-W * 0.25, H + LH * 0.9, D * 0.5], [-W * 0.2, H + LH + 0.07, D * 0.5], [W * 0.2, H + LH + 0.07, D * 0.5], [W * 0.25, H + LH * 0.9, D * 0.5]], 0.03, 0.005, dark, { parent: root });
    else strap([[-W / 2 - 0.01, H * 0.85, 0], [-W * 0.55, H * 1.6, 0], [0, H * 1.9, 0], [W * 0.55, H * 1.6, 0], [W / 2 + 0.01, H * 0.85, 0]], 0.035, 0.004, dark, { parent: root });
    mesh(cushion(W * 0.7, H * 0.5, 0.04, { bulge: 0.1 }), fin(T, T.s, T.mat), { parent: root, at: [0, y0 + H * 0.4, D / 2 + 0.012] });
  } else {
    mesh(boxSolid(W + 0.008, LH, D + 0.008, { n, top: 0.98, bevel: 0.012 }), lidM, { parent: lid, at: [0, 0, D / 2] });
    if (variant !== 'ice-chest') for (let i = 0; i < 2; i++) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 20), dark, { parent: lid, at: [(i - 0.5) * W * 0.4, LH + 0.0025, D * 0.6] });
    if (T.rugged || T.detail >= 2) for (const s of [-1, 1]) mesh(roundedBox(0.04, 0.07, 0.02, 0.006), dark, { parent: root, at: [s * W * 0.3, y0 + H - 0.01, D / 2 + 0.006] });
    // side handles
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.03, 0.04, D * 0.4, 0.008), dark, { parent: root, at: [s * (W / 2 * 0.98 + 0.012), y0 + H * 0.78, 0] });
      if (variant === 'ice-chest') curveTube([[s * (W / 2 + 0.01), y0 + H * 0.82, -0.05], [s * (W / 2 + 0.05), y0 + H * 0.82, -0.04], [s * (W / 2 + 0.05), y0 + H * 0.82, 0.04], [s * (W / 2 + 0.01), y0 + H * 0.82, 0.05]], 0.006, M.metal('#c9ccd2', 0.25), { parent: root, segments: 16 });
    }
    if (variant === 'ice-chest') {
      for (const s of [-1, 1]) mesh(roundedBox(0.04, 0.05, 0.015, 0.004), M.metal('#c9ccd2', 0.25), { parent: root, at: [s * W * 0.32, y0 + H - 0.02, D / 2 + 0.004] });
      mesh(roundedBox(W * 0.5, 0.06, 0.004, 0.002), M.metal('#c9ccd2', 0.25), { parent: root, at: [0, y0 + H * 0.45, D / 2 + 0.001] });
    }
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12).rotateX(Math.PI / 2), dark, { parent: root, at: [W * 0.38, y0 + 0.03, D / 2 + 0.005] });
    if (variant === 'wheeled-cooler') {
      for (const s of [-1, 1]) wheel(0.06 * k, 0.035, { parent: root, at: [s * (W / 2 - 0.05), 0.06 * k, -D / 2 + 0.02], hub: dark, name: s < 0 ? 'wheelL' : 'wheelR' });
      for (const s of [-1, 1]) mesh(roundedBox(0.04, 0.045, 0.06, 0.008), dark, { parent: root, at: [s * (W / 2 - 0.08), 0.0225, D / 2 - 0.05] });
      const hdl = group('handle', { parent: root, at: [0, y0 + H * 0.5, D / 2 + 0.02] });
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, H * 0.5, 10), M.metal('#c9ccd2', 0.25), { parent: hdl, at: [s * W * 0.3, 0, 0] });
      mesh(roundedBox(W * 0.66, 0.025, 0.025, 0.01), dark, { parent: hdl, at: [0, H * 0.25, 0] });
      for (const s of [-1, 1]) mesh(roundedBox(0.03, H * 0.6, 0.012, 0.004), dark, { parent: root, at: [s * W * 0.3, y0 + H * 0.45, D / 2 + 0.006] });
      anim = () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (tt) => -pingPong(tt) * 1.5)]), clip('handle', 2, [moveTrack(hdl, 2, (tt) => [0, pingPong(tt) * H * 0.6, 0])])];
      return done(root, 'cooler', variant, o, anim);
    }
  }
  anim = () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (tt) => -pingPong(tt) * (soft ? 1.9 : 1.5))])];
  return done(root, 'cooler', variant, o, anim);
}

/* ================================ CAMPING GEAR ================================ */

export const CAMPING_GEAR_VARIANTS = { 'camping-chair': {}, 'sleeping-bag': {}, 'rolled-sleeping-bag': {}, 'tent-stakes': {}, 'camping-stove': {}, 'sleeping-mat': {}, 'camping-table': {} };

export function createCampingGear(options = {}) {
  const { o, variant, T } = setup(options, CAMPING_GEAR_VARIANTS, 'camping-gear', { p: '#2f6a4a', s: '#2a2b2e', a: '#ee7a22', mat: 'nylon' });
  const root = group(`camping-gear-${variant}`);
  const k = T.k;
  const cloth = tm(T, 'p', T.mat === 'metal' || T.mat === 'wood' ? 'nylon' : undefined);
  const frame = T.trim === 'wooden' || T.trim === 'rustic' ? fin(T, '#a5733f', 'wood') : T.trim === 'black' ? M.metal('#2a2b2e', 0.35) : M.metal('#9aa0a6', 0.35);
  const dark = fin(T, T.s, 'plastic');
  const acc = fin(T, T.a, 'nylon');
  let anim = () => [];
  if (variant === 'camping-chair') {
    const W = 0.52 * k * T.w, sh = 0.42 * k, D = 0.48 * k, bh = 0.85 * k * T.h, r = 0.009;
    // X-folding legs: front & back X, side X
    for (const z of [-D / 2, D / 2]) {
      tube([-W / 2, 0, z], [W / 2, sh, z], r, frame, { parent: root });
      tube([W / 2, 0, z], [-W / 2, sh, z], r, frame, { parent: root });
    }
    for (const x of [-W / 2, W / 2]) {
      tube([x, 0, -D / 2], [x, sh, D / 2], r, frame, { parent: root });
      tube([x, sh, -D / 2], [x, bh, -D / 2 - 0.1], r, frame, { parent: root });
      tube([x, 0, D / 2], [x, sh + 0.2 * k, D / 2], r, frame, { parent: root });
      for (const z of [-D / 2, D / 2]) mesh(new THREE.SphereGeometry(r * 1.6, 8, 6), dark, { parent: root, at: [x, r * 1.0, z] });
      // armrest
      mesh(roundedBox(0.06, 0.012, D + 0.04, 0.005), acc, { parent: root, at: [x, sh + 0.2 * k + 0.006, 0] });
      tube([x, sh + 0.2 * k, -D / 2 - 0.06], [x, sh, -D / 2], r * 0.8, frame, { parent: root });
    }
    // slung seat
    const seat = new THREE.PlaneGeometry(W, D, 10, 10);
    seat.rotateX(-Math.PI / 2);
    const p = seat.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (W / 2), z = p.getZ(i) / (D / 2); p.setY(i, -0.05 * k * (1 - x * x) * (1 - z * z * 0.3)); }
    seat.computeVertexNormals();
    const sm = mesh(seat, cloth, { parent: root, at: [0, sh, 0] });
    sm.material.side = THREE.DoubleSide;
    const back = new THREE.PlaneGeometry(W, bh - sh, 8, 8);
    const bp = back.attributes.position;
    for (let i = 0; i < bp.count; i++) { const x = bp.getX(i) / (W / 2); bp.setZ(i, -0.04 * (1 - x * x)); }
    back.computeVertexNormals();
    const bm = mesh(back, cloth, { parent: root, at: [0, (sh + bh) / 2, -D / 2 - 0.05], rot: [-Math.atan2(0.1, bh - sh), 0, 0] });
    bm.material = cloth;
    // cup holder
    mesh(boxVessel(0.08, 0.06, 0.08, { t: 0.003, n: 3 }), acc, { parent: root, at: [W / 2 + 0.045, sh + 0.2 * k - 0.055, D / 2 - 0.05] });
  } else if (variant === 'sleeping-bag') {
    // open mummy bag laid flat with hood
    const L = 2.0 * k, W = 0.78 * k * T.w;
    const shape = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; shape.push([W / 2 * (0.6 + 0.4 * Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5)) * (t > 0.85 ? 1 - (t - 0.85) * 2 : 1), t * L - L / 2]); }
    const outline = [...shape, ...shape.slice().reverse().map(([x, y]) => [-x, y])];
    const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04 * k, bevelEnabled: true, bevelThickness: 0.035 * k, bevelSize: 0.03, bevelSegments: 4, curveSegments: 8 });
    g.rotateX(-Math.PI / 2);
    mesh(g, cloth, { parent: root, at: [0, 0.035 * k, 0], name: 'bag' });
    // quilting baffles
    for (let i = 1; i < 9; i++) mesh(new THREE.CylinderGeometry(0.006, 0.006, W * (0.6 + 0.3 * Math.sin((i / 9) * Math.PI)), 6).rotateZ(Math.PI / 2), fin(T, T.p, 'nylon'), { parent: root, at: [0, 0.11 * k, -L / 2 + (i * L * 0.85) / 9] });
    mesh(cushion(W * 0.62, 0.08 * k, 0.35 * k, { bulge: 0.3 }), acc, { parent: root, at: [0, 0.07 * k + 0.04, L / 2 - 0.27 * k] });
    curveTube([[W * 0.3, 0.115 * k, -L * 0.4], [W * 0.38, 0.115 * k, 0], [W * 0.33, 0.115 * k, L * 0.32]], 0.005, dark, { parent: root, segments: 16 });
  } else if (variant === 'rolled-sleeping-bag' || variant === 'sleeping-mat') {
    const mat = variant === 'sleeping-mat';
    const R = (mat ? 0.075 : 0.13) * k * (T.chunky ? 1.15 : 1), L = (mat ? 0.55 : 0.42) * k * T.w;
    const g = group('roll', { parent: root, at: [0, R, 0] });
    mesh(new THREE.CylinderGeometry(R, R, L, 32, mat ? 12 : 1).rotateZ(Math.PI / 2), cloth, { parent: g });
    // spiral end
    const sp = [];
    for (let i = 0; i <= 80; i++) { const a = i * 0.32, rr = R * (0.15 + 0.85 * i / 80); sp.push([L / 2 + 0.0005, Math.sin(a) * rr, Math.cos(a) * rr]); }
    curveTube(sp, 0.0025, fin(T, mat ? T.s : '#d8d4c8', mat ? 'plastic' : 'fabric'), { parent: g, segments: 80, radialSegments: 4 });
    if (mat) for (let i = 0; i < 10; i++) mesh(new THREE.TorusGeometry(R + 0.0005, 0.0025, 4, 32), cloth, { parent: g, at: [-L / 2 + (i + 0.5) * L / 10, 0, 0], rot: [0, Math.PI / 2, 0] });
    for (const s of [-1, 1]) strap(Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [s * L * 0.3, Math.sin(a) * (R + 0.004), Math.cos(a) * (R + 0.004)]; }), 0.025, 0.003, dark, { parent: g });
    if (!mat) {
      mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, L * 0.03, 32).rotateZ(Math.PI / 2), acc, { parent: g, at: [-L / 2 + L * 0.015, 0, 0] });
      curveTube([[-L * 0.3, R, 0], [0, R + 0.06, 0], [L * 0.3, R, 0]], 0.005, dark, { parent: g, segments: 12 });
    }
  } else if (variant === 'tent-stakes') {
    const steel = T.trim ? fin(T, T.p, ['metal', 'brass', 'copper'].includes(T.mat) ? T.mat : 'metal') : M.metal('#b9bec6', 0.3);
    const n = T.trim === 'large' ? 10 : 8;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.035, L = 0.22 * k, r = (T.chunky ? 0.005 : 0.0035) * k;
      const g = group(`stake${i}`, { parent: root, at: [x, r, 0], rot: [0, (T.r() - 0.5) * 0.2, 0] });
      if (T.rugged) mesh(new THREE.BoxGeometry(0.012, 0.012, L), steel, { parent: g, at: [0, 0.002, 0], rot: [0, 0, Math.PI / 4] });
      else mesh(new THREE.CylinderGeometry(r, r * 0.4, L, 8).rotateX(Math.PI / 2), steel, { parent: g });
      mesh(new THREE.TorusGeometry(r * 2.4, r * 0.7, 6, 14, Math.PI * 1.3), steel, { parent: g, at: [0, r * 1.0, -L / 2 - r], rot: [0, Math.PI / 2, 0] });
    }
    // drawstring stuff sack below
    mesh(cushion(0.12 * k, 0.04 * k, 0.28 * k, { bulge: 0.2 }), cloth, { parent: root, at: [0.25 * k, 0.02 * k, 0] });
  } else if (variant === 'camping-stove') {
    const W = 0.55 * k * T.w, H = 0.1 * k, D = 0.3 * k;
    const body = T.trim ? tm(T, 'p', T.mat === 'nylon' ? 'metal' : undefined) : M.paint('#2f6a4a', { metallic: 0.3, roughness: 0.4 });
    mesh(boxVessel(W, H, D, { t: 0.004, n: 14 }), body, { parent: root, name: 'stove' });
    const steel = M.metal('#3a3d42', 0.4);
    const grate = [];
    for (const xs of [-1, 1]) {
      const cx = xs * W * 0.25;
      grate.push(torusGeo(0.055 * k, 0.003, [cx, H - 0.003, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 24));
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; grate.push(rodGeo([cx, H - 0.003, 0], [cx + Math.cos(a) * 0.075 * k, H - 0.003, Math.sin(a) * 0.075 * k], 0.003)); }
      mesh(new THREE.CylinderGeometry(0.03 * k, 0.035 * k, 0.03, 16), M.metal('#9aa0a6', 0.3), { parent: root, at: [cx, H - 0.019, 0] });
    }
    grate.push(new THREE.BoxGeometry(W - 0.01, 0.004, 0.004).translate(0, H - 0.003, 0));
    mesh(merge(grate), steel, { parent: root, name: 'grate' });
    const lid = group('lid', { parent: root, at: [0, H, -D / 2] });
    mesh(roundedBox(W, D, 0.012, 0.004), body, { parent: lid, at: [0, D / 2, 0.006], name: 'lidpanel' });
    for (const s of [-1, 1]) mesh(roundedBox(0.008, D * 0.6, D * 0.7, 0.002), body, { parent: root, at: [s * W / 2, H + D * 0.3 - 0.002, -D * 0.15], rot: [0, 0, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16).rotateX(Math.PI / 2), fin(T, '#1d1d1d', 'plastic'), { parent: root, at: [s * W * 0.25, H * 0.5, D / 2 + 0.008] });
    const fl = lampGroup('flame', 'blue');
    for (const xs of [-1, 1]) fl.add(root, { at: [xs * W * 0.25, H - 0.003, 0], normal: [0, 1, 0], w: 0.05 * k, h: 0.05 * k, depth: 0.003, shape: 'round', bezel: false });
    anim = () => [clip('on', 1, lampTracks('flame', LAMP_ON.blue))];
  } else {
    // folding aluminium slat table
    const W = 0.8 * k * T.w, H = 0.68 * k * T.h, D = 0.55 * k;
    const top = T.trim === 'wooden' || T.trim === 'rustic' || T.trim === 'bamboo' ? fin(T, T.trim === 'bamboo' ? '#d1b072' : '#a5733f', 'wood') : T.trim ? tm(T, 'p', T.mat === 'nylon' ? 'metal' : undefined) : M.metal('#c9ced4', 0.3);
    const ns = 7;
    for (let i = 0; i < ns; i++) mesh(roundedBox(W / ns - 0.004, 0.018, D, 0.006), top, { parent: root, at: [-W / 2 + (i + 0.5) * W / ns, H - 0.009, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(0.02, 0.02, D - 0.04, 0.004), frame, { parent: root, at: [s * (W / 2 - 0.08), H - 0.028, 0] });
    for (const s of [-1, 1]) {
      tube([s * (W / 2 - 0.08), H - 0.03, -D / 2 + 0.03], [s * (W / 2 - 0.08), 0, D / 2 - 0.03], 0.01, frame, { parent: root });
      tube([s * (W / 2 - 0.08), H - 0.03, D / 2 - 0.03], [s * (W / 2 - 0.08), 0, -D / 2 + 0.03], 0.01, frame, { parent: root });
      for (const z of [-1, 1]) mesh(new THREE.SphereGeometry(0.013, 8, 6), dark, { parent: root, at: [s * (W / 2 - 0.08), 0.008, z * (D / 2 - 0.03)] });
    }
    tube([-(W / 2 - 0.08), H * 0.25, 0], [W / 2 - 0.08, H * 0.25, 0], 0.008, frame, { parent: root });
    tube([-(W / 2 - 0.08), H * 0.25, -D * 0.4], [-(W / 2 - 0.08), H * 0.25, D * 0.4], 0.008, frame, { parent: root });
    tube([W / 2 - 0.08, H * 0.25, -D * 0.4], [W / 2 - 0.08, H * 0.25, D * 0.4], 0.008, frame, { parent: root });
  }
  return done(root, 'camping-gear', variant, o, anim);
}
