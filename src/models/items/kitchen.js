// Everyday items, kitchen group: utensils, cutlery, kitchen linen and small gadgets.
// Party / gifts / awards / money live in kitchen-party.js (re-exported below).
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, setup, done, fin, tm, hw, anims, vessel, openBox, labelPlane, textDraw, clip, rotateTrack, spinTrack, pingPong, moveTrack } from './common.js';
import { loftX, ribbon, bowlShell, addHandle, utensilStyle } from './kitchen-shared.js';

export * from './kitchen-party.js';

const UTENSIL_BASE = { p: '#2a2b2e', s: '#c9ced4', a: '#e8402f', mat: 'plastic' };

/* ============================== KITCHEN UTENSIL ============================== */

export const KITCHEN_UTENSIL_VARIANTS = {
  whisk: {}, spatula: {}, ladle: {}, 'wooden-spoon': {}, tongs: {}, peeler: {}, grater: {}, 'rolling-pin': {},
  'can-opener': {}, 'bottle-opener': {}, 'kitchen-knife': {}, 'pizza-cutter': {}, 'measuring-cups': {},
};

export function createKitchenUtensil(options = {}) {
  const { o, variant, T } = setup(options, KITCHEN_UTENSIL_VARIANTS, 'kitchen-utensil', UTENSIL_BASE);
  const root = group(`kitchen-utensil-${variant}`);
  const S = utensilStyle(T);
  const k = T.k;
  const g = group('utensil', { parent: root });
  const hl = (S.style === 'plastic' ? 0.12 : 0.14) * k;
  const R = (S.style === 'plastic' || S.style === 'wooden' ? 0.0105 : 0.009) * k;

  if (variant === 'whisk') {
    addHandle(g, T, hl, R * 1.1, { at: [0, 0, 0] });
    const ferrule = mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.15, 0.02 * k, 16).rotateZ(Math.PI / 2), S.steel, { parent: g, at: [0.008 * k, R * 1.0, 0] });
    void ferrule;
    const L = 0.17 * k * T.h, RB = 0.036 * k * T.w * (T.slim ? 0.8 : 1);
    const n = T.chunky ? 4 : T.detail >= 1 ? 6 : 5;
    const wire = S.style === 'plastic' ? fin(T, T.p, 'rubber') : S.style === 'copper' ? fin(T, T.p, 'copper') : S.steel;
    const cy = R * 1.0;
    for (let i = 0; i < n; i++) {
      const phi = (i / n) * Math.PI;
      const pts = [];
      const prof = (u) => 0.0035 * k + RB * Math.sin(Math.PI * Math.pow(u, 1.25)) ** 0.9 * (u < 0.98 ? 1 : 0.2);
      for (let s = 0; s < 2; s++) {
        const ph = phi + s * Math.PI;
        const us = [0, 0.15, 0.3, 0.45, 0.6, 0.72, 0.84, 0.93];
        const seq = s === 0 ? us : us.slice().reverse();
        for (const u of seq) pts.push([0.012 * k + u * L, cy + prof(u) * Math.cos(ph), prof(u) * Math.sin(ph)]);
        if (s === 0) pts.push([0.012 * k + L, cy, 0]);
      }
      curveTube(pts, 0.0015 * k * (S.style === "plastic" ? 1.6 : 1), wire, { parent: g, segments: 60, radialSegments: 6, name: i ? undefined : 'wires' });
    }
    g.rotation.z = Math.atan2(RB - R, L + hl * 0.6);
  } else if (variant === 'spatula') {
    addHandle(g, T, hl, R, { at: [-0.03 * k, 0, 0] });
    const t0 = 0.004 * k;
    const W = 0.075 * k * T.w * (T.slim ? 0.85 : 1), L = 0.11 * k;
    // turner blade with slots, flat on the ground
    const s = new THREE.Shape();
    const r = 0.012 * k * T.round;
    s.moveTo(0, -0.012 * k); s.lineTo(0.02 * k, -W / 2 + r); s.quadraticCurveTo(0.025 * k, -W / 2, 0.035 * k, -W / 2);
    s.lineTo(L - r, -W / 2 * 1.05); s.quadraticCurveTo(L, -W / 2 * 1.05, L, -W / 2 + r); s.lineTo(L + 0.004 * k, W / 2 - r);
    s.quadraticCurveTo(L, W / 2 * 1.05, L - r, W / 2 * 1.05); s.lineTo(0.035 * k, W / 2); s.quadraticCurveTo(0.025 * k, W / 2, 0.02 * k, W / 2 - r); s.lineTo(0, 0.012 * k); s.lineTo(0, -0.012 * k);
    if (S.style !== 'wooden' && S.style !== 'bamboo') {
      const nS = T.chunky ? 2 : 3;
      for (let i = 0; i < nS; i++) {
        const z = (i - (nS - 1) / 2) * W * 0.26, h = new THREE.Path();
        h.absellipse(0.045 * k + 0.03 * k, z, 0.032 * k, 0.0045 * k, 0, Math.PI * 2, false, 0);
        s.holes.push(h);
      }
    }
    const blade = extrudeOutline(s, t0, { bevel: 0.0012, segments: 2 });
    blade.rotateX(Math.PI / 2);
    mesh(blade, S.soft, { parent: g, at: [0, t0 / 2, 0], name: 'blade' });
    // neck rising to the handle
    const hy = S.style === 'plastic' ? R * 2.1 * 0.8 / 2 : R * 0.9;
    mesh(loftX(10, (u) => [-0.032 * k + u * 0.036 * k, t0 / 2 + (1 - u) * (hy - t0 / 2), 0.016 * k, 0.004 * k]), S.style === 'wooden' ? S.soft : S.steel, { parent: g });
  } else if (variant === 'ladle') {
    const RB = 0.045 * k * T.w, D = 0.04 * k;
    const bm = S.style === 'wooden' || S.style === 'plastic' || S.style === 'black' ? S.soft : S.head;
    mesh(vessel([[0, 0], [RB * 0.6, 0.003], [RB * 0.92, D * 0.35], [RB, D * 0.8], [RB, D]], 0.0025, 0.0025, 32), bm, { parent: g, name: 'bowl' });
    const end = [RB + 0.27 * k * T.h, 0.012 * k, 0];
    curveTube([[RB * 0.92, D * 0.95, 0], [RB + 0.03 * k, D * 1.4, 0], [RB + 0.1 * k, D * 1.15, 0], [RB + 0.17 * k, 0.03 * k, 0], end], 0.0045 * k, bm, { parent: g, segments: 32, name: 'stem' });
    const h = group('grip', { parent: g, at: end, rot: [0, Math.PI, -0.18] });
    addHandle(h, T, 0.1 * k, R * 0.9, { at: [0.0, -0.004 * k, 0] });
  } else if (variant === 'wooden-spoon') {
    const sm = S.style === 'base' || S.style === 'steel' ? fin(T, '#b8874f', 'wood') : S.soft;
    const L = 0.3 * k * T.h, BW = 0.026 * k * T.w * (T.chunky ? 1.15 : 1);
    bowlShell(0.035 * k, 0.011 * k, BW, sm, { parent: g, at: [0.035 * k, 0, 0], name: 'bowl' });
    // spoon body: neck + handle in one loft (wooden spoons are one piece)
    mesh(loftX(30, (u) => {
      const x = 0.005 * k - u * (L - 0.07 * k);
      const w = (0.012 + 0.006 * Math.min(1, u * 3) + (S.style === 'copper' && u > 0.85 ? 0.01 : 0)) * k * (T.chunky ? 1.3 : 1);
      const t = 0.008 * k * (1 - 0.3 * Math.sin(Math.PI * u));
      const y = 0.011 * k * (1 - u) + t / 2;
      const end = Math.sqrt(Math.max(0.002, 1 - Math.max(0, (u - 0.92) / 0.08) ** 2));
      return [x, y, w * end, t * end];
    }), sm, { parent: g, name: 'handle' });
    if (S.style === 'steel' || S.style === 'copper') mesh(new THREE.TorusGeometry(0.004 * k, 0.0012, 6, 16), S.style === 'copper' ? S.head : S.steel, { parent: g, at: [-(L - 0.08 * k), 0.008 * k, 0], rot: [Math.PI / 2, 0, 0] });
  } else if (variant === 'tongs') {
    const L = 0.24 * k * T.h, W = 0.022 * k;
    const arm = S.style === 'plastic' || S.style === 'wooden' || S.style === 'black' ? S.handle : S.steel;
    for (const s of [-1, 1]) {
      mesh(loftX(24, (u) => [-0.12 * k + u * L, W / 2, 0.0022, W * (1 - 0.25 * Math.sin(Math.PI * u)), s * (0.006 * k + 0.028 * k * Math.pow(u, 0.8))], { e: 3 }), arm, { parent: g, name: s > 0 ? 'arm' : 'arm-2' });
      // scalloped heads
      mesh(roundedBox(0.04 * k, W * 1.25, 0.004, 0.0015), S.soft, { parent: g, at: [-0.12 * k + L + 0.012 * k, W * 0.62, s * (0.034 * k + 0.002)], rot: [0, s * 0.12, 0] });
      if (S.style !== 'steel') mesh(loftX(10, (u) => [-0.115 * k + u * 0.09 * k, W / 2, 0.005, W * 1.02, s * (0.009 * k + 0.01 * k * u)]), S.style === 'base' ? fin(T, T.a, 'rubber') : S.handle, { parent: g });
    }
    mesh(new THREE.CylinderGeometry(W * 0.55, W * 0.55, 0.018 * k, 20).rotateX(Math.PI / 2), S.steel, { parent: g, at: [-0.124 * k, W * 0.55, 0], name: 'hinge' });
    mesh(new THREE.TorusGeometry(0.009 * k, 0.0015, 6, 16), S.steel, { parent: g, at: [-0.134 * k - 0.009 * k, 0.0015, 0], rot: [Math.PI / 2, 0, 0] });
  } else if (variant === 'peeler') {
    addHandle(g, T, 0.1 * k, R * 1.05, { at: [0, 0, 0] });
    const hy = R * 0.9;
    const fm = S.style === 'plastic' || S.style === 'black' ? S.handle : S.head;
    curveTube([[0.0, hy, -0.008 * k], [0.02 * k, hy, -0.03 * k], [0.06 * k, hy, -0.03 * k], [0.07 * k, hy, -0.024 * k]], 0.0025 * k, fm, { parent: g, segments: 20 });
    curveTube([[0.0, hy, 0.008 * k], [0.02 * k, hy, 0.03 * k], [0.06 * k, hy, 0.03 * k], [0.07 * k, hy, 0.024 * k]], 0.0025 * k, fm, { parent: g, segments: 20 });
    mesh(roundedBox(0.012 * k, 0.0012, 0.05 * k, 0.0005), S.steel, { parent: g, at: [0.066 * k, hy, 0], name: 'blade' });
    mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.05 * k, 6).rotateX(Math.PI / 2), M.metal('#6a6e74', 0.3), { parent: g, at: [0.06 * k, hy + 0.0009, 0] });
  } else if (variant === 'grater') {
    const H = 0.24 * k * T.h, B = 0.1 * k * T.w, Tp = 0.07 * k * T.w;
    const sides = T.chunky ? 6 : 4;
    const pat = M.metal('#c9ced4', T.worn ? 0.5 : 0.25);
    pat.side = THREE.DoubleSide;
    const body = mesh(new THREE.CylinderGeometry(Tp / Math.SQRT2 * 1.0, B / Math.SQRT2, H, sides, 6, true).rotateY(Math.PI / sides), S.style === 'copper' ? fin(T, T.p, 'copper') : pat, { parent: g, at: [0, H / 2 + 0.006 * k, 0], name: 'body' });
    body.material.side = THREE.DoubleSide;
    // grating teeth rows (small bumps) on two faces
    const tooth = new THREE.SphereGeometry(0.0022 * k, 6, 4);
    for (let f = 0; f < 2; f++) {
      const ang = (f * 2 * Math.PI) / sides * (sides === 4 ? 1 : 1.5) + Math.PI / sides * 0 + 0;
      const nx = Math.cos(ang + Math.PI / sides), nz = Math.sin(ang + Math.PI / sides);
      for (let r = 1; r < 9; r++) for (let c = -2; c <= 2; c++) {
        const yy = (r / 9) * H;
        const rad = (B / 2 - ((B - Tp) / 2) * (r / 9)) * (sides === 4 ? 1 : 1.0);
        const tx = -nz, tz = nx;
        mesh(tooth, pat, { parent: g, at: [nx * rad + tx * c * rad * 0.3, yy + 0.006 * k, nz * rad + tz * c * rad * 0.3] });
      }
    }
    // base rim + top handle
    const rimM = S.style === 'steel' || S.style === 'copper' ? S.head : S.handle;
    mesh(new THREE.CylinderGeometry(B / Math.SQRT2 + 0.003, B / Math.SQRT2 + 0.004, 0.012 * k, sides, 1, true).rotateY(Math.PI / sides), rimM, { parent: g, at: [0, 0.006 * k, 0] }).material.side = THREE.DoubleSide;
    curveTube([[-Tp * 0.42, H + 0.004 * k, 0], [-Tp * 0.42, H + 0.035 * k, 0], [Tp * 0.42, H + 0.035 * k, 0], [Tp * 0.42, H + 0.004 * k, 0]], 0.007 * k * (S.style === 'plastic' ? 1.4 : 1), rimM, { parent: g, segments: 24, name: 'handle' });
  } else if (variant === 'rolling-pin') {
    const wood = S.style === 'base' ? fin(T, '#c99a5b', 'wood') : S.style === 'steel' ? fin(T, '#e8e6e0', 'ceramic') : S.style === 'black' ? fin(T, '#2a2b2e', 'ceramic') : S.handle;
    const L = 0.26 * k * T.w, Rr = 0.028 * k * (T.chunky ? 1.2 : 1);
    if (S.style === 'steel' || S.style === 'bamboo') {
      // French tapered pin, no handles (marble)
      mesh(lathe([[0, 0], [Rr * 0.55, 0], [Rr * 0.9, 0.08 * k], [Rr, 0.21 * k], [Rr * 0.9, 0.34 * k], [Rr * 0.55, 0.42 * k], [0, 0.42 * k]], 32).rotateZ(-Math.PI / 2).translate(-0.21 * k, Rr, 0), wood, { parent: g, name: 'pin' });
    } else {
      mesh(lathe([[0, 0], [Rr * 0.92, 0], [Rr, 0.006], [Rr, L - 0.006], [Rr * 0.92, L], [0, L]], 36).rotateZ(-Math.PI / 2).translate(-L / 2, Rr, 0), wood, { parent: g, name: 'barrel' });
      const hm = S.style === 'plastic' ? fin(T, T.s, 'plastic') : S.style === 'copper' ? S.head : wood;
      for (const s of [-1, 1]) {
        const h = group(s > 0 ? 'handle-r' : 'handle-l', { parent: g, at: [s * L / 2, Rr, 0], rot: [0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2] });
        mesh(lathe([[0, 0], [0.008 * k, 0], [0.006 * k, 0.012 * k], [0.013 * k, 0.04 * k], [0.015 * k, 0.07 * k], [0.011 * k, 0.085 * k], [0, 0.088 * k]], 24), hm, { parent: h });
      }
    }
  } else if (variant === 'can-opener') {
    const arm = S.handle;
    for (const s of [-1, 1]) mesh(loftX(20, (u) => [-u * 0.15 * k, 0.006 * k, 0.016 * k * (1 + 0.2 * Math.sin(Math.PI * u)) * (S.style === 'plastic' ? 1.3 : 1), 0.012 * k, s * (0.011 * k + 0.008 * k * u)], { e: 3 }), arm, { parent: g, name: s > 0 ? 'arm' : 'arm-2' });
    const head = mesh(roundedBox(0.05 * k, 0.018 * k, 0.05 * k, 0.006 * k), S.style === 'copper' ? S.head : S.steel, { parent: g, at: [0.018 * k, 0.009 * k, 0], name: 'head' });
    void head;
    mesh(new THREE.CylinderGeometry(0.011 * k, 0.011 * k, 0.005 * k, 18), M.metal('#8e939a', 0.3), { parent: g, at: [0.03 * k, 0.0025 * k, 0.02 * k], name: 'wheel' });
    // butterfly key on top (turns)
    const key = group('key', { parent: g, at: [0.018 * k, 0.018 * k, 0] });
    mesh(new THREE.CylinderGeometry(0.004 * k, 0.004 * k, 0.012 * k, 12), S.steel, { parent: key, at: [0, 0.006 * k, 0] });
    const wing = extrudeOutline([[-0.03, 0], [-0.026, 0.012], [0, 0.006], [0.026, 0.012], [0.03, 0], [0.026, -0.012], [0, -0.006], [-0.026, -0.012]].map(([x, y]) => [x * k * T.w, y * k]), 0.008 * k, { bevel: 0.0025 * k });
    wing.rotateX(Math.PI / 2);
    mesh(wing, S.style === 'steel' ? S.steel : arm, { parent: key, at: [0, 0.016 * k, 0] });
    return done(root, 'kitchen-utensil', variant, o, () => [clip('turn', 2, [spinTrack(key, 'y', 2)])]);
  } else if (variant === 'bottle-opener') {
    addHandle(g, T, 0.1 * k, R, { at: [-0.012 * k, 0, 0] });
    const hy = S.style === 'steel' ? R * 0.3 : R * 0.85;
    const s = new THREE.Shape();
    s.absarc(0.02 * k, 0, 0.022 * k, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absellipse(0.024 * k, 0, 0.013 * k, 0.011 * k, 0, Math.PI * 2, false, 0);
    s.holes.push(hole);
    const head = extrudeOutline(s, 0.004 * k, { bevel: 0.0012, segments: 2 });
    head.rotateX(Math.PI / 2);
    mesh(head, S.style === 'copper' ? S.head : S.steel, { parent: g, at: [0, hy, 0], name: 'head' });
    mesh(roundedBox(0.03 * k, 0.004 * k, 0.014 * k, 0.0015), S.style === 'copper' ? S.head : S.steel, { parent: g, at: [-0.008 * k, hy, 0] });
    mesh(roundedBox(0.006 * k, 0.005 * k, 0.012 * k, 0.0015), S.steel, { parent: g, at: [0.034 * k, hy + 0.002 * k, 0] });
  } else if (variant === 'kitchen-knife') {
    const BL = 0.2 * k * T.h, BH = 0.046 * k * (T.slim ? 0.72 : 1) * T.w;
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(0, BH);
    s.lineTo(BL * 0.72, BH * 0.98);
    s.quadraticCurveTo(BL * 0.93, BH * 0.85, BL, BH * 0.62);
    s.quadraticCurveTo(BL * 0.82, -BH * 0.06, BL * 0.45, 0);
    s.lineTo(0, 0);
    const bl = extrudeOutline(s, 0.0026, { bevel: 0.0009, segments: 2 });
    bl.rotateX(Math.PI / 2);
    mesh(bl, S.style === 'copper' ? M.metal('#d4d6da', 0.18) : M.metal('#d4d6da', T.worn ? 0.45 : 0.16), { parent: g, at: [0, 0.0013, -BH / 2], name: 'blade' });
    // bolster + handle
    mesh(roundedBox(0.014 * k, 0.016 * k, 0.026 * k, 0.005 * k), S.style === 'copper' ? S.head : S.steel, { parent: g, at: [-0.006 * k, 0.008 * k, -BH / 2 + 0.014 * k] });
    const h = group('grip', { parent: g, at: [-0.012 * k, 0, -BH / 2 + 0.014 * k] });
    addHandle(h, T, 0.12 * k, 0.01 * k);
  } else if (variant === 'pizza-cutter') {
    addHandle(g, T, 0.11 * k, R * 1.05, { at: [0, 0, 0] });
    const hy = S.style === 'plastic' ? R * 2.1 * 0.8 / 2 : R;
    const WR = 0.05 * k * T.w;
    const wheel = group('wheel', { parent: g, at: [0.035 * k + WR, hy, 0] });
    mesh(new THREE.CylinderGeometry(WR, WR, 0.0016, 48), M.metal('#d4d6da', 0.15), { parent: wheel });
    mesh(new THREE.CylinderGeometry(0.008 * k, 0.008 * k, 0.008, 16), S.steel, { parent: wheel });
    const fm = S.style === 'plastic' || S.style === 'black' ? S.handle : S.head;
    mesh(loftX(10, (u) => [-0.004 + u * (0.04 * k + WR), hy + 0.004 + 0.002 * Math.sin(Math.PI * u), 0.012 * k, 0.004]), fm, { parent: g });
    if (T.detail >= 1 || S.style === 'plastic') mesh(new THREE.CylinderGeometry(WR * 1.02, WR * 1.02, 0.003, 48, 1, false, 0, Math.PI), fm, { parent: wheel, at: [0, 0.006, 0] });
    return done(root, 'kitchen-utensil', variant, o, () => [clip('roll', 1.5, [spinTrack(wheel, 'y', 1.5)])]);
  } else {
    // measuring cups: 4 nested-size cups in a row with flat handles, joined by a ring
    const mm = S.style === 'wooden' ? fin(T, T.p, 'wood') : S.style === 'plastic' ? fin(T, T.p, 'plastic') : S.style === 'copper' ? S.head : S.style === 'black' ? fin(T, '#1c1d20', 'plastic') : S.steel;
    const sizes = [0.042, 0.036, 0.03, 0.024];
    let x = 0;
    sizes.forEach((r0, i) => {
      const r = r0 * k * T.w, h = r * 0.95 * T.h;
      const cg = group(`cup-${i}`, { parent: g, at: [x, 0, 0] });
      mesh(vessel([[r * 0.8, 0], [r * 0.95, h * 0.5], [r, h]], 0.0018, 0.0018, 32), mm, { parent: cg });
      mesh(roundedBox(0.018 * k, 0.003, 0.075 * k, 0.0014), mm, { parent: cg, at: [0, h - 0.0015, r + 0.035 * k], rot: [0.06, 0, 0] });
      x += r * 2 + 0.03 * k;
    });
  }
  return done(root, 'kitchen-utensil', variant, o);
}

/* ================================== CUTLERY ================================== */

export const CUTLERY_VARIANTS = { fork: {}, spoon: {}, 'table-knife': {}, teaspoon: { k: 0.72 }, chopsticks: {}, 'place-setting': {} };

/** Cutlery handle width profile by trim (fiddle, ornate, picnic, modern…). */
function cutleryProf(T, u) {
  const tr = T.trim;
  if (tr === 'vintage') return 0.009 + 0.011 * Math.pow(u, 2) + 0.002 * Math.abs(Math.sin(u * 22)) * (u > 0.4 ? 1 : 0);
  if (tr === 'plastic') return 0.013 + 0.004 * u;
  if (tr === 'black') return 0.011 + 0.002 * u;
  if (tr === 'wooden') return 0.012 + 0.004 * Math.sin(Math.PI * u);
  if (tr === 'gold') return 0.008 + 0.012 * Math.pow(u, 1.6);
  return 0.007 + 0.011 * Math.pow(u, 1.8);
}

function cutleryPiece(kind, T, parent, at = [0, 0, 0], rotY = 0) {
  const g = group(kind, { parent, at, rot: [0, rotY, 0] });
  const k = T.k;
  const tr = T.trim;
  const metal = tr === 'gold' ? M.metal('#d6a93c', 0.2) : tr === 'black' ? M.metal('#26272a', 0.4) : tr === 'vintage' ? M.metal('#bfb8a8', 0.45) : tr === 'plastic' ? fin(T, T.p, 'plastic') : M.metal('#d8dbe0', 0.14);
  const thick = tr === 'plastic' ? 0.004 : tr === 'black' ? 0.0035 : 0.0028;
  const HL = 0.115 * k;
  const handleRise = 0.006 * k;
  // handle: from x=0 (neck) to -HL, lifted at the neck, resting at the end
  const hmat = tr === 'wooden' ? fin(T, T.p, 'wood') : metal;
  if (kind === 'chopstick') {
    const L = 0.23 * k * (tr === 'plastic' ? 0.9 : 1);
    const cm = tr === 'black' ? fin(T, '#1a1b1e', 'gloss') : tr === 'gold' ? fin(T, '#7a1426', 'gloss') : tr === 'plastic' ? fin(T, T.p, 'plastic') : tr === 'silver' ? M.metal('#d8dbe0', 0.18) : tr === 'vintage' ? fin(T, '#5b3a24', 'wood') : fin(T, T.p ?? '#c99a5b', 'wood');
    mesh(loftX(16, (u) => { const w = (0.0075 - 0.0045 * u) * k; return [-L / 2 + u * L, 0.0045 * k, w, w]; }, { e: tr === 'silver' || tr === 'plastic' ? 2 : 4, radial: 12 }), cm, { parent: g });
    if (tr === 'gold' || tr === 'vintage') mesh(loftX(4, (u) => [-L / 2 + 0.02 * k + u * 0.03 * k, 0.0045 * k, 0.0078 * k, 0.0078 * k]), M.metal('#d6a93c', 0.25), { parent: g, name: 'band' });
    return g;
  }
  mesh(loftX(24, (u) => {
    const w = cutleryProf(T, u) * k;
    const end = Math.sqrt(Math.max(0.003, 1 - Math.max(0, (u - 0.93) / 0.07) ** 2));
    const t = (tr === 'wooden' && u > 0.25 ? 0.008 : thick) * k;
    return [-u * HL, handleRise * (1 - u) + t / 2, w * end, t * (tr === 'wooden' ? end : 1)];
  }, { e: tr === 'black' ? 5 : 3 }), u0(tr) ? hmat : metal, { parent: g, name: 'handle' });
  if (tr === 'wooden') mesh(loftX(6, (u) => [-u * HL * 0.25, handleRise + thick * k / 2 - 0.001, 0.008 * k, thick * k]), metal, { parent: g });
  if (kind === 'fork') {
    const NL = 0.045 * k;
    mesh(loftX(12, (u) => [u * NL, handleRise + 0.004 * k * Math.sin(Math.PI * u * 0.8) + thick * k / 2, (0.007 + 0.016 * u * u) * k, thick * k], { e: 3 }), metal, { parent: g });
    const n = tr === 'plastic' ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const z = (i - (n - 1) / 2) * (0.021 / n) * k;
      mesh(loftX(10, (u) => [NL + u * 0.042 * k, handleRise + 0.0035 * k * (1 - u) + thick * k / 2, (0.0034 - 0.0016 * u) * k * (tr === 'plastic' ? 1.4 : 1), thick * k, z * (1 + 0.1 * u)], { e: 3 }), metal, { parent: g });
    }
  } else if (kind === 'spoon') {
    const NL = 0.03 * k;
    mesh(loftX(10, (u) => [u * NL, handleRise * (1 - u * 0.4) + thick * k / 2, (0.007 + 0.004 * u) * k, thick * k]), metal, { parent: g });
    bowlShell(0.03 * k, 0.009 * k, 0.019 * k * T.w, metal, { parent: g, at: [NL + 0.027 * k, 0, 0], name: 'bowl' });
  } else {
    // table knife: rounded-tip blade
    const s = new THREE.Shape();
    const BL = 0.1 * k, BH = 0.017 * k;
    s.moveTo(0, -BH * 0.35); s.lineTo(BL * 0.75, -BH * 0.5); s.quadraticCurveTo(BL * 1.02, -BH * 0.5, BL, BH * 0.15); s.quadraticCurveTo(BL * 0.95, BH * 0.5, BL * 0.7, BH * 0.5); s.lineTo(0, BH * 0.35); s.lineTo(0, -BH * 0.35);
    const bl = extrudeOutline(s, 0.0022, { bevel: 0.0008, segments: 2 });
    bl.rotateX(Math.PI / 2);
    mesh(bl, tr === 'plastic' ? metal : tr === 'gold' ? metal : M.metal('#d8dbe0', 0.14), { parent: g, at: [-0.004 * k, handleRise * 0.4 + 0.0011, 0], rot: [0, 0, -0.06], name: 'blade' });
  }
  return g;
}
const u0 = () => true;

export function createCutlery(options = {}) {
  const { o, variant, T } = setup(options, CUTLERY_VARIANTS, 'cutlery', { p: '#d8dbe0', s: '#ffffff', a: '#2a2b2e', mat: 'metal' });
  const root = group(`cutlery-${variant}`);
  const k = T.k;
  if (variant === 'fork' || variant === 'spoon') cutleryPiece(variant, T, root);
  else if (variant === 'teaspoon') cutleryPiece('spoon', T, root);
  else if (variant === 'table-knife') cutleryPiece('knife', T, root);
  else if (variant === 'chopsticks') {
    const pr = T.trim === 'plastic' ? '#e8402f' : T.p;
    const T2 = { ...T, p: T.trim ? pr : '#c99a5b' };
    cutleryPiece('chopstick', T2, root, [0, 0.008 * k, -0.008 * k], 0.04);
    cutleryPiece('chopstick', T2, root, [0, 0.008 * k, 0.008 * k], -0.02);
    // ceramic chopstick rest
    const rest = mesh(lathe([[0, 0], [0.007, 0], [0.008, 0.004], [0.006, 0.008], [0, 0.008]], 16).scale(1, 1, 1), fin(T, T.trim === 'black' ? '#c9452e' : '#f1ede4', 'ceramic'), { parent: root, at: [0.08 * k, 0, 0], name: 'rest' });
    rest.scale.set(1, 1, 3.2);
  } else {
    // place setting: napkin, plate, fork left, knife + spoon right
    const nap = fin(T, T.trim === 'black' ? '#2e3036' : T.trim === 'gold' ? '#7a1426' : T.trim === 'vintage' ? '#e2d3b0' : T.trim === 'plastic' ? '#ff7aa8' : '#f4f1ea', 'fabric', { pattern: T.trim === 'plastic' ? 'check' : T.trim === 'wooden' ? 'stripes' : null });
    mesh(cushion(0.13 * k, 0.008, 0.2 * k, { radius: 0.003, bulge: 0.1 }), nap, { parent: root, at: [-0.19 * k, 0.004, 0], name: 'napkin' });
    const pm = T.trim === 'black' ? fin(T, '#1f1f22', 'ceramic') : T.trim === 'wooden' ? fin(T, '#b8874f', 'wood') : T.trim === 'plastic' ? fin(T, '#3fb6ff', 'plastic') : fin(T, '#f6f4ef', 'ceramic');
    const PR = 0.13 * k;
    mesh(vessel([[PR * 0.55, 0], [PR * 0.62, 0.006], [PR * 0.8, 0.012], [PR, 0.02]], 0.004, 0.004, 48), pm, { parent: root, name: 'plate' });
    if (T.trim === 'gold' || T.trim === 'vintage') mesh(new THREE.TorusGeometry(PR * 0.985, 0.0018, 6, 64), M.metal('#d6a93c', 0.25), { parent: root, at: [0, 0.0195, 0], rot: [Math.PI / 2, 0, 0] });
    const pf = group('fork-holder', { parent: root, at: [-0.19 * k, 0.008, 0], rot: [0, -Math.PI / 2, 0] });
    cutleryPiece('fork', T, pf, [0.06 * k, 0, 0]);
    const pk = group('knife-holder', { parent: root, at: [0.17 * k, 0, 0], rot: [0, -Math.PI / 2, 0] });
    cutleryPiece('knife', T, pk, [0.05 * k, 0, 0]);
    const ps = group('spoon-holder', { parent: root, at: [0.215 * k, 0, 0], rot: [0, -Math.PI / 2, 0] });
    cutleryPiece('spoon', T, ps, [0.04 * k, 0, 0]);
  }
  return done(root, 'cutlery', variant, o);
}

/* =============================== KITCHEN LINEN =============================== */

export const KITCHEN_LINEN_VARIANTS = { 'oven-mitt': {}, 'pot-holder': {}, apron: {}, 'tea-towel': {} };

export function createKitchenLinen(options = {}) {
  const { o, variant, T, trim } = setup(options, KITCHEN_LINEN_VARIANTS, 'kitchen-linen', { p: '#c8302a', s: '#f4f1ea', a: '#2a2b2e', mat: 'fabric' });
  const root = group(`kitchen-linen-${variant}`);
  const k = T.k;
  const silicone = trim === 'rubber';
  const main = silicone ? fin(T, T.p, 'rubber') : fin(T, T.p, T.mat === 'canvas' ? 'canvas' : 'fabric', { pattern: T.pattern });
  const sec = fin(T, T.s, silicone ? 'rubber' : 'fabric');
  if (variant === 'oven-mitt') {
    const W = 0.15 * k * T.w, L = 0.3 * k * T.h;
    const s = new THREE.Shape();
    s.moveTo(-W * 0.42, 0); s.lineTo(W * 0.42, 0);
    s.lineTo(W * 0.46, L * 0.45);
    s.quadraticCurveTo(W * 0.85, L * 0.52, W * 0.72, L * 0.66);
    s.quadraticCurveTo(W * 0.62, L * 0.74, W * 0.44, L * 0.62);
    s.lineTo(W * 0.44, L * 0.78);
    s.quadraticCurveTo(W * 0.42, L * 1.0, 0, L);
    s.quadraticCurveTo(-W * 0.48 * T.round ** 0.2, L * 1.0, -W * 0.48, L * 0.75);
    s.lineTo(-W * 0.42, 0);
    const puff = silicone ? 0.022 : T.chunky || T.soft ? 0.05 : 0.04;
    const geo = extrudeOutline(s, puff * k, { bevel: puff * k * 0.42, segments: 4 });
    geo.rotateX(-Math.PI / 2);
    mesh(geo, main, { parent: root, at: [0, puff * k / 2, 0], name: 'mitt' });
    // cuff band
    if (!silicone) mesh(cushion(W * 0.96, puff * k * 1.15, 0.05 * k, { radius: puff * k * 0.4, bulge: 0.1 }), sec, { parent: root, at: [0, puff * k * 0.575, -0.02 * k], name: 'cuff' });
    else for (let i = 0; i < 6; i++) mesh(roundedBox(W * 0.6, 0.003, 0.008, 0.0012), fin(T, T.s, 'rubber'), { parent: root, at: [-0.01, puff * k + 0.001, -L * (0.25 + i * 0.07)] });
    curveTube([[-0.012, puff * k * 0.5, 0.0], [-0.016, puff * k * 0.4, 0.045 * k], [0.016, puff * k * 0.4, 0.045 * k], [0.012, puff * k * 0.5, 0.0]], 0.003, sec, { parent: root, segments: 16, name: 'loop' });
    root.children.forEach((c) => { c.position.z += L / 2; });
  } else if (variant === 'pot-holder') {
    const W = 0.19 * k * T.w, t = (T.soft || T.chunky ? 0.022 : 0.016) * k;
    const round = trim === 'floral' || T.round > 1.3;
    if (round) mesh(new THREE.CylinderGeometry(W / 2, W / 2, t * 0.7, 48), main, { parent: root, at: [0, t * 0.35, 0], name: 'pad' });
    else mesh(cushion(W, t, W, { radius: t * 0.4, bulge: 0.35 }), main, { parent: root, at: [0, t / 2, 0], name: 'pad' });
    // piping border
    const R = W / 2 - 0.002;
    const pts = round ? Array.from({ length: 24 }, (_, i) => [Math.cos((i / 24) * Math.PI * 2) * R, t * (round ? 0.35 : 0.5), Math.sin((i / 24) * Math.PI * 2) * R])
      : [[-R, t / 2, -R], [R, t / 2, -R], [R, t / 2, R], [-R, t / 2, R]];
    curveTube(pts, 0.004, sec, { parent: root, closed: true, segments: 64, name: 'piping' });
    // quilting lines
    if (!silicone) for (const s of [-1, 1]) mesh(roundedBox(W * (round ? 0.62 : 0.9), 0.0014, 0.0025, 0.0006), sec, { parent: root, at: [0, t * (round ? 0.7 : 0.88), s * W * 0.18], rot: [0, Math.PI / 4, 0] });
    curveTube([[-R * 0.7 - 0.004, t / 2, -R - 0.004], [-R - 0.02, t / 2, -R - 0.02], [-R - 0.015, t / 2, -R + 0.01]].map(([x, y, z]) => (round ? [x * 0.75, y * 0.7, z * 0.75] : [x, y, z])), 0.003, sec, { parent: root, segments: 12, name: 'loop' });
  } else if (variant === 'apron') {
    // full apron laid out flat: bib, flared skirt, pocket, neck loop and waist ties
    const W = 0.62 * k * T.w, H = 0.85 * k * T.h, th = 0.004;
    const bw = W * (trim === 'denim' ? 0.55 : 0.48);
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0);
    s.quadraticCurveTo(W / 2 + 0.01, H * 0.3, W / 2 * 0.94, H * 0.58);
    s.quadraticCurveTo(bw / 2 + 0.05, H * 0.62, bw / 2, H * 0.78);
    s.lineTo(bw / 2, H); s.lineTo(-bw / 2, H); s.lineTo(-bw / 2, H * 0.78);
    s.quadraticCurveTo(-bw / 2 - 0.05, H * 0.62, -W / 2 * 0.94, H * 0.58);
    s.quadraticCurveTo(-W / 2 - 0.01, H * 0.3, -W / 2, 0);
    const geo = extrudeOutline(s, th, { bevel: 0.0015, segments: 1 });
    geo.rotateX(-Math.PI / 2);
    mesh(geo, main, { parent: root, at: [0, th / 2, H / 2], name: 'apron' });
    // pocket
    mesh(roundedBox(W * 0.5, 0.003, H * 0.18, 0.0014), sec, { parent: root, at: [0, th + 0.0012, H / 2 - H * 0.3], name: 'pocket' });
    mesh(roundedBox(0.003, 0.0012, H * 0.17, 0.0005), fin(T, T.a, 'fabric'), { parent: root, at: [0, th + 0.003, H / 2 - H * 0.3] });
    const tieM = fin(T, trim === 'denim' ? '#6b3d22' : T.s, trim === 'denim' ? 'leather' : 'fabric');
    // neck loop lying above the bib
    ribbon([[-bw / 2 + 0.02, th * 0.6, -H / 2 + 0.01], [-bw / 2 + 0.01, th * 0.6, -H / 2 - 0.12], [0, th * 0.6, -H / 2 - 0.2], [bw / 2 - 0.01, th * 0.6, -H / 2 - 0.12], [bw / 2 - 0.02, th * 0.6, -H / 2 + 0.01]], 0.022 * k, 0.003, tieM, { parent: root, name: 'neck-strap' });
    for (const sg of [-1, 1]) ribbon([[sg * (W / 2 * 0.92), th * 0.6, -H / 2 + H * 0.42], [sg * (W / 2 + 0.1), th * 0.6, -H / 2 + H * 0.45], [sg * (W / 2 + 0.18), th * 0.6, -H / 2 + H * 0.36], [sg * (W / 2 + 0.22), th * 0.6, -H / 2 + H * 0.2]], 0.022 * k, 0.003, tieM.clone(), { parent: root, name: sg > 0 ? 'tie' : 'tie-2' });
    if (T.detail >= 1) for (const sg of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.003, 12), hw(T), { parent: root, at: [sg * (bw / 2 - 0.015), th + 0.0012, -H / 2 + 0.03] });
  } else {
    // folded tea towel with hanging loop
    const W = 0.24 * k * T.w, D = 0.16 * k * T.h, t = 0.006 * k;
    const layers = T.chunky ? 4 : 3;
    for (let i = 0; i < layers; i++) mesh(cushion(W - i * 0.002, t, D - i * 0.004, { radius: t * 0.45, bulge: 0.15 }), main, { parent: root, at: [0, t / 2 + i * t * 0.92, -i * 0.002], name: i ? undefined : 'towel' });
    // folded edge roll at the front
    mesh(new THREE.CapsuleGeometry(t * layers * 0.5, W - t * layers, 6, 16).rotateZ(Math.PI / 2), main, { parent: root, at: [0, t * layers * 0.5, D / 2 - t * layers * 0.3] });
    // contrast stripe band near edge
    mesh(roundedBox(W * 1.002, t * layers * 0.98, 0.02, 0.003), fin(T, T.a === '#2a2b2e' ? '#1f3f73' : T.a, 'fabric'), { parent: root, at: [0, t * layers * 0.49, -D / 2 + 0.03] });
    curveTube([[W / 2 - 0.02, t * layers * 0.9, -D / 2 + 0.004], [W / 2 - 0.015, t * layers * 0.9, -D / 2 - 0.035], [W / 2 - 0.04, t * layers * 0.9, -D / 2 - 0.035], [W / 2 - 0.035, t * layers * 0.9, -D / 2 + 0.004]], 0.0025, sec, { parent: root, segments: 16, name: 'loop' });
  }
  return done(root, 'kitchen-linen', variant, o);
}

/* =============================== KITCHEN GADGET =============================== */

export const KITCHEN_GADGET_VARIANTS = {
  'kitchen-timer': {}, hourglass: {}, 'salt-and-pepper-shakers': {}, 'pepper-mill': {}, 'mason-jar': {}, 'cookie-jar': {}, 'spice-jars': {}, 'measuring-jug': {},
};

/** body material for a gadget trim */
function gBody(T, colour) {
  const m = { glass: 'glass', ceramic: 'ceramic', steel: 'metal', wooden: 'wood' }[T.trim];
  return fin(T, colour ?? T.p, m ?? 'plastic');
}

export function createKitchenGadget(options = {}) {
  const { o, variant, T, trim } = setup(options, KITCHEN_GADGET_VARIANTS, 'kitchen-gadget', { p: '#e9e6df', s: '#c8302a', a: '#2a2b2e', mat: 'ceramic' });
  const root = group(`kitchen-gadget-${variant}`);
  const k = T.k;
  const steel = M.metal('#c9ced4', 0.22);
  if (variant === 'kitchen-timer') {
    const R = 0.035 * k * T.w * (T.chunky ? 1.15 : 1), H = 0.05 * k * T.h;
    const body = trim === 'retro' ? fin(T, '#d8322a', 'gloss') : trim === 'glass' ? fin(T, '#f4f4f2', 'gloss') : gBody(T);
    // retro = tomato, modern = cube digital-look, else classic drum
    if (trim === 'retro') {
      mesh(new THREE.SphereGeometry(R * 1.2, 32, 20).scale(1, 0.72, 1).translate(0, R * 0.86, 0), body, { parent: root, name: 'body' });
      for (let i = 0; i < 5; i++) mesh(new THREE.ConeGeometry(0.006, 0.026, 4).rotateZ(Math.PI / 2).translate(0.013, 0, 0), fin(T, '#2f7a3a', 'gloss'), { parent: root, at: [0, R * 1.68, 0], rot: [0, (i / 5) * Math.PI * 2, -0.2] });
    } else if (trim === 'modern') {
      mesh(roundedBox(R * 2, R * 2, R * 1.4, R * 0.25), body, { parent: root, at: [0, R, 0], name: 'body' });
      const scr = labelPlane(R * 1.4, R * 0.6, textDraw('05:00', { bg: '#1c2a22', fg: '#7dff9a' }), { emissive: 0.8, bg: '#1c2a22' });
      scr.position.set(0, R * 1.2, R * 0.7 + 0.0004); scr.name = 'screen'; root.add(scr);
      for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(R * 0.14, R * 0.14, 0.004, 12).rotateX(Math.PI / 2), fin(T, T.s, 'plastic'), { parent: root, at: [(i - 1) * R * 0.45, R * 0.5, R * 0.7 + 0.002] });
      return done(root, 'kitchen-gadget', variant, o);
    } else {
      mesh(lathe([[0, 0], [R * 0.95, 0], [R, R * 0.1], [R * (T.round > 1.2 ? 1.05 : 1), H * 0.55], [R * 0.9, H * 0.85], [0, H * 0.88]], 40), body, { parent: root, name: 'body' });
    }
    // twisting dial with tick ring
    const top = trim === 'retro' ? R * 1.6 : H * 0.86;
    const dial = group('dial', { parent: root, at: [0, top, 0] });
    mesh(lathe([[0, 0], [R * 0.82, 0], [R * 0.85, R * 0.12], [R * 0.7, R * 0.28], [0, R * 0.3]], 40), trim === 'retro' ? fin(T, '#2f7a3a', 'gloss') : trim === 'steel' ? steel : fin(T, T.s, 'plastic'), { parent: dial });
    mesh(roundedBox(R * 1.1, R * 0.22, R * 0.2, R * 0.05), fin(T, T.a, 'plastic'), { parent: dial, at: [0, R * 0.36, 0], name: 'grip' });
    mesh(new THREE.ConeGeometry(R * 0.08, R * 0.2, 3).rotateX(Math.PI / 2), fin(T, '#c8302a', 'plastic'), { parent: root, at: [0, top - R * 0.02, R * 0.93] });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; mesh(new THREE.BoxGeometry(0.0012, 0.006, 0.0012), fin(T, '#1d1d1d', 'matte'), { parent: root, at: [Math.sin(a) * R * 0.96, top - 0.006, Math.cos(a) * R * 0.96], rot: [0, a, 0] }); }
    return done(root, 'kitchen-gadget', variant, o, () => [clip('twist', 4, [rotateTrack(dial, 'y', 4, (t) => -pingPong(t) * Math.PI * 1.5)])]);
  }
  if (variant === 'hourglass') {
    const H = 0.18 * k * T.h, R = 0.045 * k * T.w;
    const frame = trim === 'glass' ? steel : trim === 'ceramic' ? fin(T, '#f1ede4', 'ceramic') : trim === 'steel' ? steel : trim === 'retro' ? fin(T, '#e9a33a', 'plastic') : trim === 'modern' ? fin(T, '#1c1d20', 'matte') : fin(T, '#5b3a24', 'wood');
    const capH = 0.014 * k;
    for (const y of [0, H - capH]) {
      if (trim === 'modern') mesh(roundedBox(R * 2.3, capH, R * 2.3, capH * 0.3), frame, { parent: root, at: [0, y + capH / 2, 0] });
      else mesh(lathe([[0, 0], [R * 1.25, 0], [R * 1.3, capH * 0.5], [R * 1.2, capH], [0, capH]], 40), frame, { parent: root, at: [0, y, 0] });
    }
    const n = T.chunky ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      mesh(lathe([[0, 0], [0.005 * k, 0], [0.0045 * k, (H - 2 * capH) * 0.25], [0.006 * k, (H - 2 * capH) * 0.5], [0.0045 * k, (H - 2 * capH) * 0.75], [0.005 * k, H - 2 * capH], [0, H - 2 * capH]], 12), frame, { parent: root, at: [Math.cos(a) * R * 1.05, capH, Math.sin(a) * R * 1.05] });
    }
    const gh = H - 2 * capH;
    const glassG = lathe([[0.0005, 0], [R * 0.8, 0.002], [R * 0.92, gh * 0.2], [R * 0.5, gh * 0.4], [0.004, gh * 0.5], [R * 0.5, gh * 0.6], [R * 0.92, gh * 0.8], [R * 0.8, gh - 0.002], [0.0005, gh]], 40);
    mesh(glassG, M.glass({ tint: '#e8f2f4', opacity: 0.3 }), { parent: root, at: [0, capH, 0], name: 'glass' });
    const sand = fin(T, trim === 'retro' ? '#ff7aa8' : trim === 'modern' ? '#e9e9e6' : '#e2c48a', 'matte');
    mesh(lathe([[0, 0], [R * 0.78, 0], [R * 0.85, gh * 0.1], [R * 0.4, gh * 0.22], [0, gh * 0.3]], 32), sand, { parent: root, at: [0, capH + 0.002, 0], name: 'sand' });
    mesh(lathe([[0, 0], [R * 0.6, 0], [R * 0.25, gh * 0.08], [0, gh * 0.1]], 32), sand, { parent: root, at: [0, capH + gh * 0.66, 0] });
  } else if (variant === 'salt-and-pepper-shakers') {
    for (const [i, sx] of [[0, -1], [1, 1]]) {
      const g = group(i ? 'pepper' : 'salt', { parent: root, at: [sx * 0.032 * k * T.w, 0, 0] });
      const R = 0.022 * k, H = 0.09 * k * T.h;
      const body = trim === 'glass' ? M.glass({ tint: '#eef6f6', opacity: 0.35 }) : trim === 'retro' ? fin(T, i ? '#2f6f6a' : '#e9a33a', 'gloss') : trim === 'modern' ? fin(T, i ? '#1c1d20' : '#f4f3ef', 'matte') : gBody(T, i && trim === 'ceramic' ? '#2c5e8a' : undefined);
      let topY;
      if (trim === 'modern') { mesh(roundedBox(R * 1.8, H, R * 1.8, R * 0.3), body, { parent: g, at: [0, H / 2, 0] }); topY = H; }
      else if (trim === 'wooden') { mesh(lathe([[0, 0], [R * 1.1, 0], [R * 1.1, H * 0.08], [R * 0.7, H * 0.3], [R * 0.55, H * 0.6], [R * 0.75, H * 0.8], [R * 0.6, H], [0, H]], 32), body, { parent: g }); topY = H; }
      else if (trim === 'ceramic' || trim === 'retro') { mesh(new THREE.SphereGeometry(R * 1.2, 32, 20).scale(1, 1.3, 1).translate(0, R * 1.5, 0), body, { parent: g }); topY = R * 2.95; }
      else {
        // glass diner shaker / steel cylinder (hollow glass with salt/pepper fill)
        mesh(vessel([[R * 0.9, 0], [R, H * 0.1], [R * 0.95, H * 0.7], [R * 0.8, H * 0.8]], 0.0025, 0.004, 32), body, { parent: g });
        if (trim === 'glass' || !trim) mesh(lathe([[0, 0], [R * 0.9, 0], [R * 0.9, H * 0.45], [0, H * 0.47]], 24), fin(T, i ? '#3a342e' : '#f6f6f2', 'matte'), { parent: g, at: [0, 0.004, 0] });
        topY = H * 0.8;
      }
      const cap = trim === 'wooden' ? fin(T, '#3e2a1a', 'wood') : trim === 'retro' ? fin(T, '#f4f1ea', 'gloss') : trim === 'modern' ? M.metal('#8e939a', 0.3) : steel;
      const cr = trim === 'modern' ? R * 0.6 : trim === 'wooden' ? R * 0.55 : trim === 'ceramic' || trim === 'retro' ? R * 0.45 : R * 0.82;
      mesh(lathe([[0, 0], [cr, 0], [cr, cr * 0.4], [cr * 0.6, cr * 0.9], [0, cr * 1.05]], 24), cap, { parent: g, at: [0, topY - 0.002, 0], name: 'cap' });
      const holes = i ? 3 : 5;
      for (let h = 0; h < holes; h++) { const a = (h / holes) * Math.PI * 2; mesh(new THREE.CircleGeometry(0.0012, 8), fin(T, '#111', 'matte'), { parent: g, at: [Math.cos(a) * cr * 0.35, topY - 0.002 + cr * 0.98, Math.sin(a) * cr * 0.35], rot: [-Math.PI / 2 + 0.2, 0, 0] }); }
    }
  } else if (variant === 'pepper-mill') {
    const H = 0.22 * k * T.h, R = 0.03 * k * T.w;
    const body = trim === 'glass' ? M.glass({ tint: '#eef6f6', opacity: 0.35 }) : trim === 'retro' ? fin(T, '#c9452e', 'gloss') : trim === 'modern' ? fin(T, '#1c1d20', 'matte') : trim === 'steel' ? steel : trim === 'ceramic' ? fin(T, '#f1ede4', 'ceramic') : fin(T, trim === 'wooden' ? '#5b3a24' : '#8a3f26', 'wood');
    const prof = trim === 'modern' || trim === 'steel'
      ? [[0, 0], [R, 0], [R, H * 0.7], [R * 0.98, H * 0.72], [0, H * 0.72]]
      : [[0, 0], [R * 1.15, 0], [R * 1.15, H * 0.06], [R * 0.85, H * 0.15], [R * 0.7, H * 0.4], [R * 0.95, H * 0.55], [R * 0.9, H * 0.66], [R * 1.05, H * 0.7], [0, H * 0.72]];
    mesh(lathe(prof, 40), body, { parent: root, name: 'body' });
    if (trim === 'glass') mesh(lathe([[0, 0], [R * 0.6, 0], [R * 0.6, H * 0.4], [0, H * 0.42]], 20), fin(T, '#2e2722', 'matte'), { parent: root, at: [0, 0.01, 0] });
    const head = group('head', { parent: root, at: [0, H * 0.72, 0] });
    const hm = trim === 'glass' ? steel : body;
    mesh(lathe(trim === 'modern' || trim === 'steel' ? [[0, 0], [R, 0], [R, H * 0.2], [R * 0.6, H * 0.26], [0, H * 0.27]] : [[0, 0], [R * 1.05, 0], [R * 1.1, H * 0.08], [R * 0.8, H * 0.18], [R * 0.4, H * 0.24], [0, H * 0.25]], 40), hm, { parent: head });
    mesh(new THREE.SphereGeometry(R * 0.28, 16, 12), trim === 'modern' ? steel : M.metal('#c9ccd2', 0.25), { parent: head, at: [0, H * 0.25 + R * 0.15, 0], name: 'knob' });
    return done(root, 'kitchen-gadget', variant, o, () => [clip('grind', 1.6, [rotateTrack(head, 'y', 1.6, (t) => Math.sin(t * Math.PI * 4) * 0.6)])]);
  } else if (variant === 'mason-jar' || variant === 'cookie-jar') {
    const mason = variant === 'mason-jar';
    const R = (mason ? 0.042 : 0.085) * k * T.w, H = (mason ? 0.14 : 0.2) * k * T.h;
    const jarM = mason || trim === 'glass' ? M.glass({ tint: mason && trim === 'retro' ? '#9fd4c4' : '#e8f2f4', opacity: 0.32 }) : trim === 'retro' ? fin(T, '#f4c21a', 'gloss') : trim === 'modern' ? fin(T, '#e9e9e6', 'matte') : trim === 'wooden' ? fin(T, '#a5733f', 'wood') : trim === 'steel' ? steel : fin(T, trim === 'ceramic' ? '#2c5e8a' : '#f1ede4', 'ceramic');
    const prof = mason
      ? [[R * 0.92, 0], [R, R * 0.12], [R, H * 0.78], [R * 0.78, H * 0.9], [R * 0.75, H]]
      : [[R * 0.8, 0], [R, H * 0.2], [R * (T.round > 1.2 ? 1.1 : 1), H * 0.6], [R * 0.75, H * 0.92], [R * 0.72, H]];
    mesh(vessel(prof, 0.003, 0.005, 40), jarM, { parent: root, name: 'jar' });
    if (mason) {
      // contents by trim: jam, pickles, beans, lemonade…
      const fill = { ceramic: '#9a1a2a', steel: '#5f7a2a', wooden: '#7a4a24', retro: '#f4d23a', modern: '#e9e3d0' }[trim];
      if (fill) mesh(lathe([[0, 0], [R * 0.93, 0], [R * 0.95, H * 0.6], [0, H * 0.62]], 32), fin(T, fill, trim === 'retro' ? 'gloss' : 'matte'), { parent: root, at: [0, 0.006, 0], name: 'contents' });
    } else {
      // cookies inside (stack) + one leaning outside
      for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.012, 24), fin(T, '#c08a4a', 'matte'), { parent: root, at: [(i % 2 - 0.5) * R * 0.5, 0.012 + i * 0.012, 0], rot: [0.2 * (i % 3 - 1), 0, 0.15] });
    }
    const lid = group('lid', { parent: root, at: [0, H, 0] });
    if (mason) {
      mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, 0.014 * k, 40, 1, true), trim === 'retro' ? fin(T, '#e8402f', 'gloss') : trim === 'ceramic' ? fin(T, '#f4f1ea', 'fabric', { pattern: 'check' }) : M.metal(trim === 'wooden' ? '#b8913f' : '#c9ccd2', 0.3), { parent: lid, at: [0, -0.004, 0], name: 'band' }).material.side = THREE.DoubleSide;
      mesh(new THREE.CylinderGeometry(R * 0.8, R * 0.8, 0.003, 40), trim === 'wooden' ? fin(T, '#a5733f', 'wood') : M.metal('#d9d6cc', 0.3), { parent: lid, at: [0, 0.0035, 0] });
      if (trim === 'ceramic') mesh(new THREE.CylinderGeometry(R * 1.05, R * 0.84, 0.03, 8, 1, true), fin(T, '#c8302a', 'fabric', { pattern: 'check' }), { parent: lid, at: [0, -0.008, 0] }).material.side = THREE.DoubleSide;
    } else {
      mesh(lathe([[0, 0], [R * 0.8, 0], [R * 0.82, 0.01], [R * 0.5, 0.04 * k], [0.012 * k, 0.045 * k], [0, 0.046 * k]], 40), trim === 'glass' ? M.metal('#c9ccd2', 0.25) : jarM, { parent: lid });
      mesh(new THREE.SphereGeometry(0.016 * k, 16, 12), trim === 'glass' ? M.metal('#c9ccd2', 0.25) : fin(T, T.s, 'ceramic'), { parent: lid, at: [0, 0.05 * k, 0], name: 'knob' });
    }
    return done(root, 'kitchen-gadget', variant, o, () => [clip('open', 3, [moveTrack(lid, 3, (t) => [pingPong(t) * R * 0.6, pingPong(t) * 0.05, 0])])]);
  } else if (variant === 'spice-jars') {
    const rows = T.chunky ? 1 : 2, cols = trim === 'modern' ? 5 : 4;
    const rackM = trim === 'steel' ? steel : trim === 'modern' ? fin(T, '#e9e9e6', 'matte') : trim === 'retro' ? fin(T, '#2f6f6a', 'gloss') : trim === 'ceramic' ? fin(T, '#f1ede4', 'ceramic') : fin(T, trim === 'wooden' ? '#5b3a24' : '#b8874f', 'wood');
    const jr = 0.02 * k, jh = 0.075 * k * T.h, sp = jr * 2.5, W = cols * sp + 0.02, D = 0.06 * k;
    const spice = ['#c0391e', '#e3a21a', '#4f7a2a', '#7a4a24', '#e8d8b0', '#3a2a20', '#c8692a', '#2f5a3a', '#d8b23a', '#8a2a2a'];
    for (let r = 0; r < rows; r++) {
      const y = r * (jh + 0.03);
      mesh(roundedBox(W, 0.012, D, 0.004), rackM, { parent: root, at: [0, y + 0.006, 0], name: `shelf-${r}` });
      mesh(roundedBox(W, 0.025, 0.006, 0.002), rackM, { parent: root, at: [0, y + 0.024, D / 2 - 0.003] });
      for (let c = 0; c < cols; c++) {
        const x = -W / 2 + 0.01 + sp * (c + 0.5);
        const jm = trim === 'ceramic' ? fin(T, '#f6f4ef', 'ceramic') : M.glass({ tint: '#eef6f6', opacity: 0.3 });
        mesh(vessel([[jr * 0.95, 0], [jr, 0.004], [jr, jh * 0.85]], 0.002, 0.003, 20), jm, { parent: root, at: [x, y + 0.012, -0.004] });
        if (trim !== 'ceramic') mesh(lathe([[0, 0], [jr * 0.92, 0], [jr * 0.92, jh * 0.6], [0, jh * 0.62]], 16), fin(T, spice[(r * cols + c) % spice.length], 'matte'), { parent: root, at: [x, y + 0.015, -0.004] });
        mesh(new THREE.CylinderGeometry(jr * 1.02, jr * 1.02, 0.016 * k, 20), trim === 'wooden' ? fin(T, '#3e2a1a', 'wood') : trim === 'retro' ? fin(T, '#e8402f', 'gloss') : trim === 'modern' ? fin(T, '#1c1d20', 'matte') : M.metal('#c9ccd2', 0.25), { parent: root, at: [x, y + 0.012 + jh * 0.85 + 0.008 * k, -0.004] });
      }
      if (r === 0 && rows > 1) for (const s of [-1, 1]) mesh(roundedBox(0.012, jh + 0.042, D, 0.004), rackM, { parent: root, at: [s * (W / 2 + 0.006), (jh + 0.042) / 2, 0] });
    }
    if (rows === 1) for (const s of [-1, 1]) mesh(roundedBox(0.012, jh * 0.6, D, 0.004), rackM, { parent: root, at: [s * (W / 2 + 0.006), jh * 0.3, 0] });
  } else {
    // measuring jug with spout, handle and graduations
    const R = 0.055 * k * T.w, H = 0.14 * k * T.h;
    const jm = trim === 'glass' || !trim ? M.glass({ tint: '#eef6f6', opacity: 0.33 }) : trim === 'retro' ? fin(T, '#9fd4c4', 'gloss') : trim === 'modern' ? fin(T, '#f4f3ef', 'plastic') : trim === 'wooden' ? fin(T, '#e9e6df', 'ceramic') : trim === 'steel' ? steel : fin(T, '#f1ede4', 'ceramic');
    const geo = vessel([[R * 0.85, 0], [R * 0.92, 0.01], [R, H]], 0.003, 0.005, 40);
    // pull the rim out at +x to form the spout
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); if (y > H * 0.75 && Math.abs(a) < 0.5) { const f = (1 - Math.abs(a) / 0.5) * ((y - H * 0.75) / (H * 0.25)); p.setX(i, x + f * R * 0.35); p.setY(i, y + f * 0.006); } }
    geo.computeVertexNormals();
    mesh(geo, jm, { parent: root, name: 'jug' });
    curveTube([[-R * 0.98, H * 0.85, 0], [-R * 1.6, H * 0.82, 0], [-R * 1.65, H * 0.4, 0], [-R * 0.95, H * 0.2, 0]], 0.009 * k * (T.chunky ? 1.3 : 1), trim === 'wooden' ? fin(T, '#a5733f', 'wood') : jm, { parent: root, segments: 24, name: 'handle' });
    for (let i = 1; i <= 5; i++) mesh(new THREE.TorusGeometry(R * (0.92 + 0.08 * (i / 6)) + 0.0004, 0.0007, 4, 12, i % 2 ? 0.35 : 0.22), fin(T, trim === 'steel' ? '#3a3c40' : '#c8302a', 'matte'), { parent: root, at: [0, (i / 6) * H, 0], rot: [Math.PI / 2, 0, Math.PI / 2 + 0.1] });
    if (trim !== 'steel' && trim !== 'ceramic') mesh(lathe([[0, 0], [R * 0.9, 0], [R * 0.95, H * 0.45], [0, H * 0.46]], 32), fin(T, trim === 'retro' ? '#f4d23a' : '#f2e8d0', 'gloss'), { parent: root, at: [0, 0.006, 0], name: 'liquid' });
  }
  return done(root, 'kitchen-gadget', variant, o);
}

void hw; void tm; void openBox; void anims;
