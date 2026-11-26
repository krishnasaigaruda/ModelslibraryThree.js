// Mobile & personal tech: smartphone, tablet, e-reader, smartwatch, earbuds, headphones, camera, smart speaker.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, clip, rotateTrack, moveTrack, spinTrack, pingPong, PI,
  makeDevice, screen, led, rgb, emblem, vents, ports, slab, frame, trimShell, keyGrid } from './kit.js';

/** Rounded-rect plate in XY (corner radius cr), thickness t along Z, centred. */
export function plateGeo(w, h, t, cr) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2, q = Math.min(cr, w / 2 - 1e-4, h / 2 - 1e-4);
  s.moveTo(x + q, y); s.lineTo(x + w - q, y); s.quadraticCurveTo(x + w, y, x + w, y + q); s.lineTo(x + w, y + h - q);
  s.quadraticCurveTo(x + w, y + h, x + w - q, y + h); s.lineTo(x + q, y + h); s.quadraticCurveTo(x, y + h, x, y + h - q); s.lineTo(x, y + q); s.quadraticCurveTo(x, y, x + q, y);
  const bev = Math.min(t * 0.42, q * 0.8);
  const geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(t - 2 * bev, 1e-4), bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.9, bevelSegments: 3, curveSegments: 10 });
  geo.translate(0, 0, -(t - 2 * bev) / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Trim add-ons for a slate in XY (screen +Z). */
function trimXY(ctx, par, w, h, t, cr) {
  const g = group('trimxy', { parent: par, rot: [PI / 2, 0, 0] });
  trimShell(ctx, g, w, t, h, { at: [0, -t / 2, 0], r: cr });
  if (ctx.T.gaming) rgb(ctx, par, { at: [0, 0, -t / 2 - 0.0006], normal: [0, 0, -1], w: h * 0.5, h: 0.003, roll: PI / 2 });
}

/**
 * A phone / tablet / reader slate centred at origin, screen facing +Z, height along Y.
 * S = { w, h, t, cr, bez, content, cams:[[x,y,r]...], bump:[w,h,x,y,round], buttons, punch, notch, eink, pageKeys }
 */
export function buildSlate(ctx, par, S) {
  const { T } = ctx;
  const { w, h, t, cr } = S;
  const g = group('slate', { parent: par });
  const bodyMat = T.plain ? (S.plastic ? M.plastic(ctx.o.color ?? '#2d3a4f', 0.35) : M.metal(ctx.o.color ?? '#8f949b', 0.28)) : T.body;
  mesh(plateGeo(w, h, t, cr), bodyMat, { parent: g });
  // glass back (slightly smaller) gives the two-tone look
  mesh(plateGeo(w - 0.002, h - 0.002, 0.0006, cr * 0.9), new THREE.MeshPhysicalMaterial({ color: T.plain ? '#9fa6b0' : bodyMat.color, roughness: 0.25, clearcoat: 1, metalness: 0.2 }), { parent: g, at: [0, 0, -t / 2 + 0.0001] });
  const front = t / 2 + 0.0002;
  mesh(new THREE.ShapeGeometry(new THREE.Shape(plateGeo(1, 1, 0.1, 0.1).parameters.shapes.getPoints(6).map((p) => new THREE.Vector2(p.x * (w - 0.0015), p.y * (h - 0.0015))))), S.eink ? M.matte(T.plain ? '#1c1c1e' : '#222', 0.6) : T.bezelMat, { parent: g, at: [0, 0, front] });
  const bez = S.bez ?? 0.003;
  const sw = w - bez * 2, sh = h - (S.chin ?? bez) - bez;
  screen(ctx, g, sw, sh, { at: [0, ((S.chin ?? bez) - bez) / 2, front + 0.0004], content: S.content });
  if (S.punch) mesh(new THREE.CircleGeometry(S.punch, 20), T.black, { parent: g, at: [0, sh / 2 - S.punch * 3 + ((S.chin ?? bez) - bez) / 2, front + 0.0009] });
  if (S.notch) mesh(new THREE.PlaneGeometry(S.notch, 0.0045), T.black, { parent: g, at: [0, h / 2 - bez - 0.002, front + 0.0009] });
  if (S.homeBtn) mesh(new THREE.CylinderGeometry(S.homeBtn, S.homeBtn, 0.0006, 24).rotateX(PI / 2), T.dark, { parent: g, at: [0, -h / 2 + (S.chin ?? bez) / 2, front + 0.0003] });
  // side buttons
  if (S.buttons !== false) {
    const bt = Math.min(t * 0.45, 0.004);
    mesh(roundedBox(0.0012, h * 0.08, bt, 0.0005, 1), bodyMat, { parent: g, at: [w / 2 + 0.0004, h * 0.18, 0] });
    for (let i = 0; i < 2; i++) mesh(roundedBox(0.0012, h * 0.065, bt, 0.0005, 1), bodyMat, { parent: g, at: [-w / 2 - 0.0004, h * 0.26 - i * h * 0.085, 0] });
  }
  if (S.pageKeys) for (let i = 0; i < 2; i++) mesh(roundedBox(0.006, 0.02, 0.001, 0.0005), T.dark, { parent: g, at: [w / 2 - bez * 0.5, -0.012 + i * 0.026, front + 0.0004] });
  ports(g, T.port, S.eink ? ['c'] : ['c'], { at: [0, -h / 2 - 0.0004, 0], rot: [PI / 2, 0, 0] });
  // camera module on the back
  const back = -t / 2;
  if (S.bump) {
    const [bw, bh, bx, by, round] = S.bump;
    const bt = Math.max(0.0015, t * 0.22);
    if (round) mesh(new THREE.CylinderGeometry(bw / 2, bw / 2, bt, 40).rotateX(PI / 2), T.plain ? M.metal('#2c2e33', 0.3) : T.body2 === T.rubber ? T.dark : T.body2, { parent: g, at: [bx, by, back - bt / 2] });
    else mesh(plateGeo(bw, bh, bt, Math.min(bw, bh) * 0.25), T.plain ? new THREE.MeshPhysicalMaterial({ color: bodyMat.color, roughness: 0.2, clearcoat: 1 }) : bodyMat, { parent: g, at: [bx, by, back - bt / 2] });
    const lensGlass = new THREE.MeshPhysicalMaterial({ color: '#05070c', roughness: 0.05, metalness: 0.3, clearcoat: 1, name: 'lens' });
    for (const [cx, cy, r] of S.cams ?? []) {
      mesh(new THREE.CylinderGeometry(r * 1.18, r * 1.18, 0.0012, 28).rotateX(PI / 2), M.metal('#3a3c40', 0.25), { parent: g, at: [cx, cy, back - bt - 0.0006] });
      mesh(new THREE.CircleGeometry(r, 28), lensGlass, { parent: g, at: [cx, cy, back - bt - 0.0013], rot: [0, PI, 0] });
      mesh(new THREE.CircleGeometry(r * 0.35, 16), M.plastic('#1b2c48', 0.1), { parent: g, at: [cx, cy, back - bt - 0.0014], rot: [0, PI, 0] });
    }
    led(ctx, g, 'white', { at: [bx + bw * 0.32, by - bh * 0.32, back - bt - 0.0002], normal: [0, 0, -1], w: Math.min(bw, bh) * 0.12 });
  }
  emblem(g, Math.min(w * 0.22, 0.03), [0, -h * 0.05, back - 0.0004], [0, PI, 0]);
  trimXY(ctx, g, w, h, t, cr);
  return g;
}

/**
 * Lean a slate on a small aluminium stand. build(parent) must build the slate centred, screen +Z.
 * Returns the lean group.
 */
export function leanOnStand(ctx, par, w, h, t, build, { lean = 0.28, standMat } = {}) {
  const { T } = ctx;
  const sm = standMat ?? (T.retro ? M.wood('walnut') : T.kids ? T.accent : T.white ? M.plastic('#f2f2f2', 0.4) : M.metal('#6e7278', 0.35));
  const bw = Math.min(w * 0.7, 0.12), bd = 0.07 + h * 0.15;
  slab(par, sm, bw, 0.005, bd, { at: [0, 0, -bd * 0.2], r: 0.01 });
  // front lip
  mesh(roundedBox(bw, 0.008, 0.004, 0.0015), sm, { parent: par, at: [0, 0.009, t / 2 + 0.003] });
  const L = group('lean', { parent: par, at: [0, 0.005, 0], rot: [-lean, 0, 0] });
  const s = group('device', { parent: L, at: [0, h / 2 + 0.0004, 0] });
  build(s);
  // back rest plate in the leaning frame, and a leg down to the base
  const rest = Math.min(h * 0.55, 0.09);
  mesh(roundedBox(bw * 0.8, rest, 0.004, 0.0015), sm, { parent: L, at: [0, rest / 2, -t / 2 - 0.0025 - (t > 0.02 ? 0.006 : 0)] });
  const top = new THREE.Vector3(0, rest * 0.85, -t / 2 - 0.004).applyEuler(L.rotation).add(L.position);
  const footZ = -bd * 0.2 - bd / 2 + 0.008;
  mesh(roundedBox(bw * 0.6, Math.hypot(top.y - 0.005, top.z - footZ), 0.004, 0.0015), sm,
    { parent: par, at: [0, (top.y + 0.005) / 2, (top.z + footZ) / 2], rot: [Math.atan2(top.z - footZ, top.y - 0.005), 0, 0] });
  return L;
}

/* ================================ smartphone ================================ */

export const PHONE_VARIANTS = {
  flagship: { w: 0.0716, h: 0.1475, t: 0.0078, cr: 0.011, cams: 3, content: 'home' },
  compact: { w: 0.0645, h: 0.1316, t: 0.0076, cr: 0.0095, cams: 2, content: 'home' },
  max: { w: 0.0779, h: 0.1633, t: 0.0083, cr: 0.012, cams: 3, content: 'video' },
  'camera-pro': { w: 0.0748, h: 0.1612, t: 0.0089, cr: 0.011, cams: 4, round: true, content: 'camera' },
  budget: { w: 0.0762, h: 0.1655, t: 0.0091, cr: 0.008, cams: 2, notch: true, plastic: true, content: 'home' },
  foldable: { w: 0.0745, h: 0.155, t: 0.006, cr: 0.008, cams: 3, fold: 'book', content: 'video' },
  flip: { w: 0.072, h: 0.0855, t: 0.0072, cr: 0.012, cams: 2, fold: 'flip', content: 'home' },
};

function phoneSpec(V, T) {
  const { w, h } = V;
  const n = V.cams;
  let bump, cams;
  if (V.round) { bump = [w * 0.62, w * 0.62, 0, h * 0.27, true]; cams = [[-w * 0.13, h * 0.27 + w * 0.12, w * 0.085], [w * 0.13, h * 0.27 + w * 0.12, w * 0.085], [-w * 0.13, h * 0.27 - w * 0.1, w * 0.085], [w * 0.13, h * 0.27 - w * 0.1, w * 0.06]]; }
  else if (n >= 3) { bump = [w * 0.46, w * 0.48, -w * 0.21, h * 0.5 - w * 0.31]; const bx = -w * 0.21, by = h * 0.5 - w * 0.31; cams = [[bx - w * 0.09, by + w * 0.1, w * 0.075], [bx - w * 0.09, by - w * 0.1, w * 0.075], [bx + w * 0.1, by, w * 0.075]]; }
  else { bump = [w * 0.24, w * 0.42, -w * 0.3, h * 0.5 - w * 0.3]; const bx = -w * 0.3, by = h * 0.5 - w * 0.3; cams = [[bx, by + w * 0.09, w * 0.068], [bx, by - w * 0.09, w * 0.068]]; }
  if (T.retro) return { ...V, bez: 0.006, chin: 0.018, homeBtn: 0.0055, bump, cams: cams.slice(0, 1), content: 'retro' };
  return { ...V, bez: V.plastic ? 0.003 : 0.0018, chin: V.plastic ? 0.006 : undefined, punch: V.notch ? 0 : 0.0019, notch: V.notch ? 0.012 : 0, bump, cams };
}

export const createSmartphone = makeDevice('smartphone', PHONE_VARIANTS, (g, { ctx, T, V }) => {
  const S = phoneSpec(V, T);
  if (V.fold === 'book') {
    // open book foldable in 'flex' tent: one half on a stand base, the other at 160°
    const L = leanOnStand(ctx, g, V.w * 2, V.h, V.t, (s) => {
      const left = group('left', { parent: s, at: [-V.w / 2, 0, 0] });
      buildSlate(ctx, left, { ...S, bump: null, buttons: false, punch: 0 });
      const hinge = group('hinge', { parent: s, at: [0, 0, 0] });
      mesh(new THREE.CylinderGeometry(V.t * 0.55, V.t * 0.55, V.h - 0.004, 16), T.plain ? M.metal('#3a3c40', 0.3) : T.body2 === T.rubber ? T.dark : T.body2, { parent: hinge, at: [0, 0, -V.t * 0.05] });
      const right = group('rightleaf', { parent: hinge, rot: [0, -0.32, 0] });
      buildSlate(ctx, group('r', { parent: right, at: [V.w / 2, 0, 0] }), { ...S, cams: S.cams.map(([x, y, r]) => [x, y, r * 0.9]) });
      ctx.extra.push(rotateTrack(right, 'y', 4, (t) => 0.3 * pingPong(t) - 0.0));
    }, { lean: 0.22 });
    return [];
  }
  if (V.fold === 'flip') {
    // clamshell in flex mode: lower half flat on the table, upper half raised to 100°
    const low = group('lower', { parent: g, at: [0, V.t / 2, V.h / 2], rot: [-PI / 2, 0, 0] });
    buildSlate(ctx, low, { ...S, h: V.h, bump: null, punch: 0, content: 'dash' });
    const hinge = group('hinge', { parent: g, at: [0, V.t / 2, 0] });
    mesh(new THREE.CylinderGeometry(V.t * 0.6, V.t * 0.6, V.w - 0.01, 18).rotateZ(PI / 2), M.metal('#5a5d62', 0.3), { parent: hinge });
    const up = group('upper', { parent: hinge, rot: [PI / 2 - 0.25, 0, 0] });
    const ug = group('u', { parent: up, at: [0, 0, -V.h / 2], rot: [PI / 2, 0, PI] });
    ug.rotation.set(-PI / 2, 0, 0);
    ug.position.set(0, 0, -V.h / 2);
    buildSlate(ctx, ug, { ...S, h: V.h, bump: [V.w * 0.85, V.h * 0.42, 0, V.h * 0.22], cams: S.cams.map(([x, y, r], i) => [-V.w * 0.28 + i * V.w * 0.18, V.h * 0.32, r]) , punch: 0.0017 });
    // cover screen on the outside of the upper half
    screen(ctx, ug, V.w * 0.42, V.h * 0.3, { at: [V.w * 0.12, V.h * 0.22, -V.t / 2 - 0.0024], rot: [0, PI, 0], content: 'watch' });
    ctx.extra.push(rotateTrack(up, 'x', 4, (t) => 1.1 * pingPong(t)));
    return [];
  }
  leanOnStand(ctx, g, V.w, V.h, V.t + (T.rugged || T.kids ? 0.008 : 0), (s) => buildSlate(ctx, s, S));
  return [];
});

/* ================================ tablet ================================ */

export const TABLET_VARIANTS = {
  'slate-11': { w: 0.178, h: 0.2475, t: 0.0059, cr: 0.014, bez: 0.0085, content: 'desktop', cams: 1 },
  'mini-8': { w: 0.1348, h: 0.1955, t: 0.0063, cr: 0.012, bez: 0.007, content: 'video', cams: 1 },
  'pro-13': { w: 0.215, h: 0.281, t: 0.0051, cr: 0.015, bez: 0.0075, content: 'dash', cams: 2, folio: true },
  'drawing-pad': { w: 0.215, h: 0.281, t: 0.0055, cr: 0.015, bez: 0.0075, content: 'game', cams: 1, flat: true, stylus: true },
  'kids-edition': { w: 0.16, h: 0.24, t: 0.009, cr: 0.016, bez: 0.016, content: 'game', cams: 1, plastic: true },
  'landscape-dock': { w: 0.255, h: 0.165, t: 0.007, cr: 0.012, bez: 0.009, content: 'home', cams: 1, landscape: true },
};

export const createTablet = makeDevice('tablet', TABLET_VARIANTS, (g, { ctx, T, V }) => {
  const S = { ...V, bez: T.retro ? V.bez * 2 : V.bez, homeBtn: T.retro ? 0.007 : 0, chin: T.retro ? V.bez * 2.4 : undefined,
    bump: [0.024, V.cams > 1 ? 0.04 : 0.024, -V.w / 2 + 0.02, V.h / 2 - 0.022], cams: V.cams > 1 ? [[-V.w / 2 + 0.02, V.h / 2 - 0.013, 0.006], [-V.w / 2 + 0.02, V.h / 2 - 0.031, 0.006]] : [[-V.w / 2 + 0.02, V.h / 2 - 0.022, 0.0065]] };
  if (V.flat) {
    const s = group('flat', { parent: g, at: [0, V.t / 2 + 0.0035, 0], rot: [-PI / 2, 0, 0] });
    buildSlate(ctx, s, { ...S, bump: [0.02, 0.02, -V.w / 2 + 0.02, V.h / 2 - 0.02], cams: [[-V.w / 2 + 0.02, V.h / 2 - 0.02, 0.0055]] });
  } else {
    leanOnStand(ctx, g, V.w, V.h, V.t + (T.rugged || T.kids ? 0.01 : 0), (s) => {
      const r = group('rot', { parent: s, rot: V.landscape ? [0, 0, 0] : [0, 0, 0] });
      buildSlate(ctx, r, S);
    }, { lean: 0.3 });
  }
  if (V.folio) {
    const kb = group('folio', { parent: g, at: [0, 0, 0.2] });
    slab(kb, T.plain ? M.fabric('#3b3e45') : T.body2 === T.rubber ? T.dark : T.body2, V.w * 1.25, 0.005, 0.14, { r: 0.01 });
    const rows = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], [2, 1, 1, 1, 1, 1, 1, 1, 1, 2], [1.5, 1, 6, 1, 1.5]];
    keyGrid(ctx, kb, rows, { u: 0.0185, kh: 0.0012, gap: 0.003, at: [0, 0.005, -0.015] });
    slab(kb, M.plastic('#55585e', 0.35), 0.08, 0.0004, 0.04, { at: [0, 0.0048, 0.045], r: 0.004 });
  }
  if (V.stylus || V.folio) {
    const s = group('pencil', { parent: g, at: [V.w * 0.68, 0.0045, 0.05] });
    mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.165, 6).rotateX(PI / 2), T.plain || T.white ? M.plastic('#f6f6f6', 0.35) : T.accent, { parent: s });
    mesh(new THREE.ConeGeometry(0.0045, 0.014, 16).rotateX(PI / 2), M.plastic('#e8e8e8', 0.4), { parent: s, at: [0, 0, 0.0895] });
  }
  return [];
});

/* ================================ e-reader ================================ */

export const EREADER_VARIANTS = {
  'basic-6': { w: 0.108, h: 0.157, t: 0.0082, cr: 0.006, bez: 0.009, chin: 0.02 },
  'glow-7': { w: 0.127, h: 0.175, t: 0.0081, cr: 0.007, bez: 0.007 },
  'page-turn': { w: 0.1295, h: 0.161, t: 0.008, cr: 0.007, bez: 0.007, grip: true },
  'scribe-10': { w: 0.196, h: 0.23, t: 0.0058, cr: 0.008, bez: 0.007, stylus: true },
  'color-ink': { w: 0.127, h: 0.175, t: 0.0081, cr: 0.007, bez: 0.007, color: true },
  'in-cover': { w: 0.127, h: 0.175, t: 0.0081, cr: 0.007, bez: 0.007, cover: true },
};

export const createEReader = makeDevice('e-reader', EREADER_VARIANTS, (g, { ctx, T, V }) => {
  const S = { ...V, eink: true, plastic: true, buttons: false, content: V.color ? 'home' : 'eink', pageKeys: V.grip, bump: null };
  const W = V.grip ? V.w + 0.03 : V.w;
  leanOnStand(ctx, g, W, V.h, V.t + (V.cover ? 0.004 : 0), (s) => {
    const r = group('rd', { parent: s, at: [V.grip ? 0.015 : 0, 0, 0] });
    buildSlate(ctx, r, S);
    if (V.grip) {
      mesh(plateGeo(0.032, V.h, V.t * 1.3, V.cr), T.plain ? M.plastic('#26282c', 0.5) : T.body, { parent: s, at: [-V.w / 2 - 0.0, 0, -V.t * 0.15] });
      for (let i = 0; i < 2; i++) mesh(roundedBox(0.012, 0.03, 0.002, 0.0008), T.dark, { parent: s, at: [-V.w / 2 - 0.002, -0.02 + i * 0.036, V.t * 0.5 + 0.0003] });
    }
    if (V.cover) {
      mesh(plateGeo(V.w + 0.006, V.h + 0.006, 0.003, V.cr + 0.002), M.fabric(T.plain ? '#7a2e2e' : '#3a3d44'), { parent: s, at: [0, 0, -V.t / 2 - 0.0015] });
      const flap = group('flap', { parent: s, at: [-V.w / 2 - 0.003, 0, -V.t / 2 - 0.0015], rot: [0, 2.6, 0] });
      mesh(plateGeo(V.w + 0.006, V.h + 0.006, 0.003, V.cr + 0.002), M.fabric(T.plain ? '#7a2e2e' : '#3a3d44'), { parent: flap, at: [-(V.w + 0.006) / 2, 0, 0] });
    }
  }, { lean: 0.3 });
  if (V.stylus) {
    const s = group('pen', { parent: g, at: [V.w * 0.62, 0.0045, 0.05] });
    mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.15, 16).rotateX(PI / 2), M.plastic('#2a2c30', 0.4), { parent: s });
    mesh(new THREE.ConeGeometry(0.0042, 0.012, 16).rotateX(PI / 2), M.plastic('#8a8d92', 0.4), { parent: s, at: [0, 0, 0.081] });
  }
  return [];
});

/* ================================ smartwatch ================================ */

export const WATCH_VARIANTS = {
  'square-45': { w: 0.039, h: 0.045, t: 0.0107, band: 0.022, content: 'watch' },
  'round-classic': { round: 0.044, t: 0.011, band: 0.022, content: 'watch' },
  'sport-41': { w: 0.035, h: 0.041, t: 0.0105, band: 0.02, sport: true, content: 'dash' },
  'outdoor-ultra': { w: 0.044, h: 0.049, t: 0.0145, band: 0.024, ultra: true, content: 'dash' },
  'fitness-band': { w: 0.018, h: 0.042, t: 0.009, band: 0.018, slim: true, content: 'dash' },
  'hybrid-analog': { round: 0.042, t: 0.012, band: 0.02, analog: true, content: 'watch' },
};

export const createSmartwatch = makeDevice('smartwatch', WATCH_VARIANTS, (g, { ctx, T, V }) => {
  // strap loop standing on its edge (as on a display), face on top
  const R = 0.031, bw = V.band, bt = 0.0028;
  const strapMat = T.plain ? (V.sport ? M.rubber() : V.analog ? M.matte('#6b4329', 0.7) : M.plastic(ctx.o.color ?? '#3d4a63', 0.7)) : T.rugged ? T.accent : T.gold ? M.metal('#d8b46e', 0.3) : T.retro ? M.matte('#6d4a2c', 0.7) : T.kids ? T.body2 : T.gaming ? M.plastic('#1b1c20', 0.5) : T.white ? M.plastic('#f4f4f2', 0.6) : T.damaged ? M.matte('#4b4440', 0.95) : M.plastic('#1b1c1f', 0.6);
  const loop = lathe([[R - bt / 2, -bw / 2], [R + bt / 2, -bw / 2], [R + bt / 2, bw / 2], [R - bt / 2, bw / 2], [R - bt / 2, -bw / 2]], 64);
  loop.rotateZ(PI / 2).scale(1, 1, 0.82);
  mesh(loop, strapMat, { parent: g, at: [0, R * 0.82 + bt / 2 - 0.0005, 0] });
  if (V.sport) for (let i = 0; i < 8; i++) { const a = -PI / 2 + 0.4 + i * 0.32; mesh(new THREE.CylinderGeometry(0.0012, 0.0012, bw * 0.6, 8).rotateZ(PI / 2), T.port, { parent: g, at: [0, R * 0.82 + Math.sin(a) * R * 0.82, Math.cos(a) * R * 0.82] }); }
  const top = R * 0.82 * 2 + bt / 2;
  const caseMat = T.plain ? (V.ultra ? M.metal('#b9a98f', 0.3) : M.metal(ctx.o.color ?? '#9ea2a8', 0.25)) : T.body;
  void top;
  const head = group('watchhead', { parent: g, at: [0, R * 0.82 + bt / 2 - 0.0005, R * 0.82 + V.t / 2 - 0.0012] });
  if (V.round) {
    mesh(new THREE.CylinderGeometry(V.round / 2, V.round / 2 * 0.96, V.t, 48).rotateX(PI / 2), caseMat, { parent: head });
    mesh(new THREE.TorusGeometry(V.round / 2 - 0.0015, 0.0018, 10, 48), V.analog ? M.metal('#d6a93c', 0.25) : caseMat, { parent: head, at: [0, 0, V.t / 2 - 0.0004] });
    if (V.analog) {
      const face = mesh(new THREE.CircleGeometry(V.round / 2 - 0.003, 48), M.matte(T.gold || T.white ? '#f4efe4' : '#1a2233', 0.5), { parent: head, at: [0, 0, V.t / 2 + 0.0002] });
      for (let i = 0; i < 12; i++) mesh(roundedBox(0.0012, 0.004, 0.0006, 0.0002, 1), M.metal('#c9ccd2', 0.2), { parent: head, at: [Math.sin(i / 12 * PI * 2) * 0.015, Math.cos(i / 12 * PI * 2) * 0.015, V.t / 2 + 0.0005], rot: [0, 0, -i / 12 * PI * 2] });
      const hands = group('hands', { parent: head, at: [0, 0, V.t / 2 + 0.0009] });
      mesh(roundedBox(0.0014, 0.013, 0.0005, 0.0002, 1), M.metal('#e8e8ea', 0.2), { parent: hands, at: [0, 0.006, 0] });
      mesh(roundedBox(0.0014, 0.009, 0.0005, 0.0002, 1), M.metal('#e8e8ea', 0.2), { parent: hands, at: [0.004, 0.0015, 0.0003], rot: [0, 0, -1.2] });
      screen(ctx, head, 0.012, 0.012, { at: [0, -0.009, V.t / 2 + 0.0004], round: true, content: 'watch' });
      ctx.extra.push(spinTrack(hands, 'z', 3, -1));
      void face;
    } else screen(ctx, head, V.round - 0.006, V.round - 0.006, { at: [0, 0, V.t / 2 + 0.0002], round: true, content: V.content });
  } else {
    mesh(plateGeo(V.w, V.h, V.t, Math.min(V.w, V.h) * 0.28), caseMat, { parent: head });
    mesh(new THREE.PlaneGeometry(V.w - 0.002, V.h - 0.002), T.bezelMat, { parent: head, at: [0, 0, V.t / 2 + 0.0002] });
    screen(ctx, head, V.w - (V.ultra ? 0.008 : 0.004), V.h - (V.ultra ? 0.008 : 0.004), { at: [0, 0, V.t / 2 + 0.0006], content: V.content });
    if (V.ultra) for (const sx of [-1, 1]) mesh(roundedBox(0.004, V.h * 0.5, V.t * 0.7, 0.0012), M.metal('#d06a2a', 0.3), { parent: head, at: [sx * (V.w / 2 + 0.0015), 0, 0] });
  }
  const side = (V.round ?? V.w) / 2;
  if (!V.slim) {
    const crown = group('crown', { parent: head, at: [side + 0.002, V.round ? 0 : V.h * 0.12, 0] });
    mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.0045, 20).rotateZ(PI / 2), V.ultra ? M.metal('#d06a2a', 0.3) : caseMat, { parent: crown });
    mesh(roundedBox(0.0016, 0.01, 0.0035, 0.0006, 1), caseMat, { parent: head, at: [side + 0.0006, V.round ? -0.012 : -V.h * 0.18, 0] });
    ctx.extra.push(spinTrack(crown, 'x', 2));
  }
  led(ctx, head, 'green', { at: [0, 0, -V.t / 2 - 0.0003], normal: [0, 0, -1], w: 0.004, glow: 0.02 });
  if (T.gaming) rgb(ctx, head, { at: [0, -(V.h ?? V.round) / 2 - 0.0006, 0], normal: [0, -1, 0], w: 0.02, h: 0.002 });
  if (T.rugged) mesh(new THREE.TorusGeometry((V.round ?? Math.max(V.w, V.h)) / 2 + 0.001, 0.0035, 8, 32), T.accent, { parent: head, scale: V.round ? 1 : [V.w / Math.max(V.w, V.h), V.h / Math.max(V.w, V.h), 1] });
  if (T.kids) mesh(new THREE.SphereGeometry(0.006, 14, 10), T.accent, { parent: head, at: [0, (V.h ?? V.round) / 2 + 0.002, V.t * 0.2] });
  return [];
});

/* ============================== wireless earbuds ============================== */

export const EARBUDS_VARIANTS = {
  'stem-buds': { cw: 0.0605, ch: 0.045, cd: 0.0215, stem: true },
  'round-buds': { cw: 0.065, ch: 0.032, cd: 0.03, pill: true },
  'sport-hooks': { cw: 0.08, ch: 0.035, cd: 0.04, hook: true },
  'open-ear': { cw: 0.065, ch: 0.04, cd: 0.028, open: true },
  'gaming-buds': { cw: 0.07, ch: 0.036, cd: 0.03, stem: true, game: true },
  'pro-buds': { cw: 0.0605, ch: 0.045, cd: 0.0215, stem: true, tips: true },
};

function bud(ctx, par, V, mat, { at, rot = [0, 0, 0], name = 'bud' }) {
  const b = group(name, { parent: par, at, rot });
  mesh(new THREE.SphereGeometry(0.0092, 24, 16), mat, { parent: b, scale: [1, 0.95, 0.85] });
  mesh(new THREE.CylinderGeometry(0.0042, 0.0048, 0.006, 16).rotateX(PI / 2), V.tips ? M.matte('#d9dadc', 0.8) : M.plastic('#2a2b2e', 0.6), { parent: b, at: [0, 0, 0.009] });
  if (V.stem) mesh(new THREE.CapsuleGeometry(0.0033, 0.022, 6, 12), mat, { parent: b, at: [0, -0.015, -0.002] });
  if (V.hook) curveTube([[0, 0.006, -0.004], [0, 0.026, -0.006], [0, 0.03, -0.024], [0, 0.012, -0.032]], 0.0022, mat, { parent: b, segments: 20 });
  if (V.open) curveTube([[0, 0.007, -0.002], [0, 0.02, 0.0], [0, 0.024, -0.012]], 0.003, mat, { parent: b, segments: 16 });
  led(ctx, b, V.game ? 'red' : 'white', { at: [0, 0.002, -0.0078], normal: [0, 0, -1], w: 0.0016, glow: 0.012 });
  return b;
}

export const createWirelessEarbuds = makeDevice('wireless-earbuds', EARBUDS_VARIANTS, (g, { ctx, T, V }) => {
  const { cw, ch, cd } = V;
  const mat = T.plain ? (V.game ? M.plastic('#17181b', 0.4) : M.plastic(ctx.o.color ?? '#f5f6f7', 0.3)) : T.body;
  const lowH = ch * 0.62;
  const base = new THREE.CapsuleGeometry(cd / 2, cw - cd, 8, 24).rotateZ(PI / 2);
  const s = group('case', { parent: g, at: [0, 0, 0] });
  // lower shell: capsule cut via scale (squircle look)
  mesh(roundedBox(cw, lowH, cd, cd * 0.45, 4), mat, { parent: s, at: [0, lowH / 2, 0] });
  mesh(roundedBox(cw - 0.004, 0.0015, cd - 0.004, 0.0007), M.plastic('#1a1b1d', 0.5), { parent: s, at: [0, lowH + 0.0003, 0] });
  void base;
  led(ctx, s, 'green', { at: [0, lowH * 0.55, cd / 2 + 0.0003], w: 0.0025, glow: 0.015 });
  ports(s, T.port, ['c'], { at: [0, 0.006, -cd / 2 - 0.0004], rot: [0, PI, 0] });
  emblem(s, 0.012, [0, lowH * 0.45, -cd / 2 - 0.0006], [0, PI, 0]);
  // hinged lid open at the back
  const lid = group('lid', { parent: s, at: [0, lowH, -cd / 2 + 0.001], rot: [-1.75, 0, 0] });
  mesh(roundedBox(cw, ch - lowH, cd, cd * 0.45, 4), mat, { parent: lid, at: [0, (ch - lowH) / 2 - 0.0008, cd / 2 - 0.001] });
  ctx.extra.push(rotateTrack(lid, 'x', 3, (t) => 1.7 * pingPong(t)));
  // buds sitting in the case + one beside
  for (const sx of [-1, 1]) bud(ctx, s, V, mat, { at: [sx * cw * 0.22, lowH + 0.0045, 0], rot: [-PI / 2 + 0.2, sx * 0.4, 0], name: sx < 0 ? 'budL' : 'budR' });
  const loose = group('loosebud', { parent: g, at: [cw * 0.85, 0.0085, cd * 0.4] });
  bud(ctx, loose, { ...V, hook: false, open: false }, mat, { at: [0, 0, 0], rot: [0, 0, PI / 2], name: 'bud3' });
  if (T.gaming || V.game) rgb(ctx, s, { at: [0, 0.004, cd / 2 + 0.0004], w: cw * 0.6, h: 0.002 });
  if (T.rugged) { mesh(roundedBox(cw + 0.005, lowH * 0.7, cd + 0.005, cd * 0.45, 3), T.accent, { parent: s, at: [0, lowH * 0.35, 0] }); curveTube([[cw / 2, lowH * 0.5, 0], [cw / 2 + 0.012, lowH * 0.6, 0], [cw / 2 + 0.018, lowH * 0.5, 0.0]], 0.002, M.metal('#9aa0a6', 0.3), { parent: s, segments: 12 }); }
  if (T.kids) for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.008, 14, 10, 0, PI * 2, 0, PI / 2), T.body2, { parent: lid, at: [sx * cw * 0.3, ch - lowH - 0.002, cd / 2] });
  if (T.damaged) mesh(roundedBox(cw * 0.6, 0.0008, 0.01, 0.0003), M.matte('#9b9d9f', 0.95), { parent: s, at: [0, lowH * 0.5, cd / 2 + 0.0003], rot: [PI / 2, 0, 0.4] });
  return [];
});

/* ============================ wireless headphones ============================ */

export const HEADPHONE_VARIANTS = {
  'over-ear': { cup: 0.048, w: 0.17, band: 0.19 },
  'on-ear': { cup: 0.036, w: 0.15, band: 0.17 },
  studio: { cup: 0.052, w: 0.18, band: 0.2, studio: true },
  'gaming-headset': { cup: 0.05, w: 0.18, band: 0.2, mic: true },
  'kids-volume-limit': { cup: 0.036, w: 0.14, band: 0.15, kidsy: true },
  'sport-neckband': { neck: true },
};

export const createWirelessHeadphones = makeDevice('wireless-headphones', HEADPHONE_VARIANTS, (g, { ctx, T, V, o }) => {
  const mat = T.plain ? (V.kidsy ? M.plastic('#ff6fa8', 0.45) : M.plastic(ctx.o.color ?? '#2a2c31', 0.45)) : T.body;
  const pad = M.fabric(T.white ? '#e9e7e2' : T.retro ? '#5a3a24' : '#1d1e21');
  if (V.neck) {
    // neckband lying on the table
    curveTube([[-0.07, 0.008, 0.04], [-0.085, 0.008, -0.03], [-0.04, 0.008, -0.085], [0.04, 0.008, -0.085], [0.085, 0.008, -0.03], [0.07, 0.008, 0.04]], 0.0075, mat, { parent: g, segments: 48 });
    for (const sx of [-1, 1]) {
      mesh(new THREE.CapsuleGeometry(0.009, 0.045, 6, 16).rotateX(PI / 2), mat, { parent: g, at: [sx * 0.072, 0.009, 0.06] });
      curveTube([[sx * 0.072, 0.006, 0.085], [sx * 0.06, 0.003, 0.12], [sx * 0.03, 0.003, 0.14]], 0.0012, T.dark, { parent: g, segments: 16 });
      const b = mesh(new THREE.SphereGeometry(0.008, 16, 12), mat, { parent: g, at: [sx * 0.026, 0.008, 0.145] });
      void b;
    }
    led(ctx, g, 'blue', { at: [0.081, 0.012, 0.06], normal: [1, 0.3, 0], w: 0.002, glow: 0.015 });
    if (T.gaming) rgb(ctx, g, { at: [0, 0.0158, -0.085], normal: [0, 1, 0], w: 0.05, h: 0.003 });
    return [];
  }
  // optional display stand (o.stand); otherwise the headphones sit upright on their cups
  // (makeDevice drops the lowest point to the ground)
  const sm = T.retro ? M.wood('walnut') : M.metal('#4a4d52', 0.35);
  const H = 0.27;
  if (o.stand) {
    mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.012, 40), sm, { parent: g, at: [0, 0.006, 0] });
    tube([0, 0.012, 0], [0, H, 0], 0.008, sm, { parent: g });
    mesh(roundedBox(0.03, 0.012, 0.09, 0.005), sm, { parent: g, at: [0, H + 0.004, 0] });
  }
  // headband arc resting on the stand
  const hw = V.w / 2, top = H + 0.012;
  const arc = [];
  for (let i = 0; i <= 12; i++) { const a = PI * (i / 12); arc.push([-Math.cos(a) * hw, top - 0.004 - (1 - Math.sin(a)) * V.band * 0.55, 0]); }
  arc.forEach((p) => (p[1] = Math.max(p[1], top - V.band * 0.6)));
  curveTube(arc, 0.006, mat, { parent: g, segments: 40, radialSegments: 10 });
  curveTube(arc.slice(3, 10).map(([x, y]) => [x, y - 0.006, 0]), 0.0065, pad, { parent: g, segments: 24 });
  const yC = top - V.band * 0.6 - V.cup * 0.6;
  for (const sx of [-1, 1]) {
    const yoke = group(sx < 0 ? 'cupL' : 'cupR', { parent: g, at: [sx * (hw + 0.004), yC, 0] });
    tube([0, V.cup * 0.62, 0], [0, V.cup * 0.95, 0], 0.004, T.metal, { parent: yoke });
    mesh(new THREE.CylinderGeometry(V.cup, V.cup * 0.97, 0.026, 40).rotateZ(PI / 2).scale(1, V.studio ? 1 : 1.18, 0.88), mat, { parent: yoke, at: [sx * 0.004, 0, 0] });
    mesh(new THREE.TorusGeometry(V.cup * 0.78, 0.011, 12, 36).rotateY(PI / 2).scale(1, 1.15, 0.86), pad, { parent: yoke, at: [-sx * 0.012, 0, 0] });
    mesh(new THREE.CylinderGeometry(V.cup * 0.7, V.cup * 0.7, 0.002, 36).rotateZ(PI / 2).scale(1, 1.15, 0.85), T.accent === T.body ? T.dark : (T.gaming ? T.accent : T.metal), { parent: yoke, at: [sx * 0.0175, 0, 0] });
    if (sx > 0) emblem(yoke, 0.028, [0.0188, 0, 0], [0, PI / 2, 0]);
    if (sx < 0) { led(ctx, yoke, 'white', { at: [-0.017, -V.cup * 0.6, 0.01], normal: [-1, 0, 0], w: 0.002, glow: 0.015 }); ports(yoke, T.port, ['c', 'jack'], { at: [-0.012, -V.cup * 1.08, 0], rot: [PI / 2, 0, 0], gap: 0.004 }); }
    if (T.gaming || V.mic) rgb(ctx, yoke, { at: [sx * 0.0186, 0, 0], normal: [sx, 0, 0], w: V.cup * 1.2, h: 0.004, roll: PI / 2 });
  }
  if (V.mic) curveTube([[-hw - 0.012, yC - V.cup * 0.4, 0.02], [-hw - 0.02, yC - V.cup * 0.9, 0.06], [-hw + 0.01, yC - V.cup * 1.0, 0.1]], 0.0028, T.dark, { parent: g, segments: 20 });
  if (V.kidsy || T.kids) for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.018, 16, 12), T.kids ? T.body2 : M.plastic('#ffd23f', 0.5), { parent: g, at: [sx * hw * 0.5, top + 0.008, 0], scale: [1, 1, 0.5] });
  if (T.rugged) for (const sx of [-1, 1]) mesh(new THREE.TorusGeometry(V.cup * 0.95, 0.005, 8, 32).rotateY(PI / 2), T.accent, { parent: g, at: [sx * (hw + 0.022), yC, 0] });
  if (T.damaged) mesh(roundedBox(0.03, 0.016, 0.016, 0.002), M.matte('#9b9d9f', 0.95), { parent: g, at: [hw * 0.7, top - 0.03, 0], rot: [0, 0, -0.7] });
  return [];
});

/* ================================ camera ================================ */

export const CAMERA_VARIANTS = {
  compact: { w: 0.105, h: 0.06, d: 0.032, lens: 0.022, lensL: 0.012 },
  dslr: { w: 0.14, h: 0.105, d: 0.075, lens: 0.036, lensL: 0.085, prism: true, grip: true },
  mirrorless: { w: 0.13, h: 0.085, d: 0.045, lens: 0.033, lensL: 0.06, grip: true, evf: true },
  'action-cam': { w: 0.071, h: 0.05, d: 0.034, lens: 0.011, lensL: 0.006, action: true },
  instant: { w: 0.12, h: 0.096, d: 0.075, lens: 0.022, lensL: 0.018, instant: true },
  'gimbal-vlog': { w: 0.04, h: 0.12, d: 0.035, gimbal: true, lens: 0.009, lensL: 0.005 },
};

export const createDigitalCamera = makeDevice('digital-camera', CAMERA_VARIANTS, (g, { ctx, T, V }) => {
  const body = T.plain ? (V.instant ? M.plastic(ctx.o.color ?? '#f0eee8', 0.4) : V.action ? M.plastic('#1d1e21', 0.6) : M.plastic('#1c1d20', 0.65)) : T.body;
  const leather = M.matte(T.retro ? '#6b3e22' : '#151517', 0.92);
  const extra = [];
  let cam = g, w = V.w, h = V.h, d = V.d, y0 = 0;
  if (V.gimbal) {
    // handheld gimbal stick with tiny camera head
    mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.008, 32), M.rubber(), { parent: g, at: [0, 0.004, 0] });
    mesh(lathe([[0.016, 0], [0.018, 0.04], [0.019, 0.1], [0.016, 0.12], [0, 0.125]], 32), body, { parent: g, at: [0, 0.008, 0] });
    screen(ctx, g, 0.016, 0.016, { at: [0, 0.1, 0.0186], round: true, content: 'camera' });
    mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 16).rotateX(PI / 2), T.dark, { parent: g, at: [0, 0.075, 0.019] });
    const yaw = group('yaw', { parent: g, at: [0, 0.133, 0] });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 24), body, { parent: yaw });
    mesh(roundedBox(0.008, 0.04, 0.012, 0.003), body, { parent: yaw, at: [0.018, 0.02, 0] });
    mesh(roundedBox(0.022, 0.008, 0.012, 0.003), body, { parent: yaw, at: [0.01, 0.004, 0] });
    const head = group('camhead', { parent: yaw, at: [0, 0.04, 0] });
    mesh(roundedBox(0.026, 0.026, 0.026, 0.006), body, { parent: head });
    mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.006, 16).rotateZ(PI / 2), body, { parent: head, at: [0.0145, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.006, 24).rotateX(PI / 2), M.metal('#2a2b2e', 0.3), { parent: head, at: [0, 0, 0.015] });
    mesh(new THREE.CircleGeometry(0.0065, 24), new THREE.MeshPhysicalMaterial({ color: '#05070c', roughness: 0.05, clearcoat: 1 }), { parent: head, at: [0, 0, 0.0182] });
    led(ctx, head, 'red', { at: [0.008, 0.009, 0.0131], w: 0.002, glow: 0.012 });
    extra.push(clip('track', 4, [rotateTrack(yaw, 'y', 4, (t) => 0.6 * Math.sin(t * PI * 2)), rotateTrack(head, 'x', 4, (t) => 0.2 * Math.sin(t * PI * 4))]));
    if (T.gaming) rgb(ctx, g, { at: [0, 0.05, 0.0185], w: 0.02, h: 0.002, roll: PI / 2 });
    if (T.rugged) for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.019, 0.0025, 8, 24).rotateX(PI / 2), T.accent, { parent: g, at: [0, 0.03 + i * 0.025, 0] });
    if (T.kids) mesh(new THREE.TorusGeometry(0.03, 0.004, 8, 24).rotateX(PI / 2), T.body2, { parent: g, at: [0, 0.008, 0] });
    return extra;
  }
  if (V.action) {
    // action cam on a little tripod
    const sm = M.plastic('#202124', 0.5);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; tube([0, 0.06, 0], [Math.cos(a) * 0.05, 0.003, Math.sin(a) * 0.05], 0.004, sm, { parent: g }); mesh(new THREE.SphereGeometry(0.005, 10, 8), M.rubber(), { parent: g, at: [Math.cos(a) * 0.05, 0.004, Math.sin(a) * 0.05] }); }
    mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.02, 16), sm, { parent: g, at: [0, 0.068, 0] });
    y0 = 0.078;
    cam = group('cam', { parent: g, at: [0, y0, 0] });
    y0 = 0;
  }
  if (V.instant) {
    const s = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(d / 2 - 0.006, h), new THREE.Vector2(-d / 2 + 0.012, h)]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3 });
    geo.translate(0, 0, -(w - 0.012) / 2).rotateY(PI / 2);
    mesh(geo, body, { parent: cam });
    mesh(roundedBox(w * 0.7, 0.003, 0.003, 0.001), T.port, { parent: cam, at: [0, h * 0.12, d / 2 + 0.006] });
    const photo = group('photo', { parent: cam, at: [0, h * 0.12, d / 2 + 0.006] });
    mesh(roundedBox(w * 0.6, 0.002, 0.05, 0.0008), M.matte('#fbfbf8'), { parent: photo, at: [0, 0, 0.02], rot: [0.15, 0, 0] });
    extra.push(clip('eject', 3, [moveTrack(photo, 3, (t) => [0, 0, 0.02 * Math.min(1, t * 2)])]));
    for (let i = 0; i < 2; i++) mesh(roundedBox(w * 0.9, 0.006, 0.002, 0.001), T.isTrim ? T.accent : M.plastic(['#2bb3a3', '#f2765b'][i], 0.4), { parent: cam, at: [0, h * 0.35 + i * 0.008, d / 2 + 0.005 - (h * 0.35 + i * 0.008) / h * 0.006] });
  } else {
    mesh(roundedBox(w, h, d, Math.min(w, h, d) * 0.18, 3), body, { parent: cam, at: [0, y0 + h / 2, 0] });
    if (!V.action && !T.isTrim) mesh(roundedBox(w * 0.98, h * 0.6, d * 1.01, Math.min(w, h, d) * 0.16, 2), leather, { parent: cam, at: [0, y0 + h * 0.42, 0] });
    if (V.grip) mesh(roundedBox(0.03, h * 0.9, d * 0.5, 0.012), leather, { parent: cam, at: [w / 2 - 0.018, y0 + h * 0.45, d / 2 + 0.012] });
    if (V.prism || V.evf) {
      const pg = V.prism ? new THREE.CylinderGeometry(0.018, 0.034, 0.03, 4, 1).rotateY(PI / 4).scale(1.1, 1, 0.9) : roundedBox(0.045, 0.022, 0.04, 0.008);
      mesh(pg, body, { parent: cam, at: [0, y0 + h + (V.prism ? 0.014 : 0.01), 0] });
      mesh(roundedBox(0.03, 0.02, 0.012, 0.004), M.rubber(), { parent: cam, at: [0, y0 + h + 0.008, -d / 2 - 0.005] });
    }
    // dials + shutter
    const dial = group('dial', { parent: cam, at: [-w * 0.32, y0 + h + 0.004, 0] });
    mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 24), M.metal('#2c2d30', 0.4), { parent: dial });
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.005, 20), T.gold ? T.accent : M.metal('#c9ccd2', 0.25), { parent: cam, at: [w * 0.34, y0 + h + 0.0025, d * 0.15] });
    extra.push(clip('dial', 2, [rotateTrack(dial, 'y', 2, (t) => t * PI * 2)]));
    // rear screen
    const rs = V.action ? [w * 0.75, h * 0.7] : [w * 0.55, h * 0.55];
    screen(ctx, cam, rs[0], rs[1], { at: [-w * 0.08, y0 + h * 0.48, -d / 2 - 0.0005], rot: [0, PI, 0], content: 'camera' });
    if (V.action) { screen(ctx, cam, w * 0.28, h * 0.4, { at: [-w * 0.25, y0 + h * 0.5, d / 2 + 0.0005], content: 'dash' }); led(ctx, cam, 'red', { at: [w * 0.4, y0 + h * 0.85, d / 2 + 0.0004], w: 0.003, glow: 0.015 }); }
    else led(ctx, cam, 'amber', { at: [w * 0.32, y0 + h * 0.8, d / 2 + 0.0004], w: 0.003, glow: 0.015 });
    emblem(cam, 0.016, [-w * 0.3, y0 + h * 0.82, d / 2 + 0.0008]);
  }
  // lens barrel
  const lx = V.action ? w * 0.22 : V.compact ? w * 0.1 : V.instant ? 0 : -w * 0.06;
  const ly = y0 + (V.instant ? h * 0.62 : h * 0.47);
  const zf = V.instant ? d / 2 - 0.002 : d / 2;
  const barrel = group('lens', { parent: cam, at: [lx, ly, zf] });
  const L = V.lensL, r = V.lens;
  mesh(lathe([[r * 1.05, 0], [r * 1.05, L * 0.15], [r, L * 0.2], [r, L * 0.85], [r * 0.95, L], [r * 0.75, L], [0, L * 0.98]], 40).rotateX(PI / 2), M.plastic('#141416', 0.5), { parent: barrel });
  if (L > 0.03) for (let i = 0; i < 2; i++) mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, L * 0.12, 40, 1, true).rotateX(PI / 2), M.rubber(), { parent: barrel, at: [0, 0, L * (0.35 + i * 0.3)] });
  mesh(new THREE.CircleGeometry(r * 0.72, 32), new THREE.MeshPhysicalMaterial({ color: '#0a1020', roughness: 0.03, metalness: 0.4, clearcoat: 1, iridescence: 0.8 }), { parent: barrel, at: [0, 0, L * 0.985] });
  if (L > 0.03) mesh(new THREE.TorusGeometry(r * 1.0, 0.0012, 6, 40), M.emissive('#c81e1e', 0.4), { parent: barrel, at: [0, 0, L * 0.9] });
  if (V.compact) extra.push(clip('zoom', 3, [moveTrack(barrel, 3, (t) => [0, 0, 0.012 * pingPong(t)])]));
  // trims
  if (T.gaming) rgb(ctx, cam, { at: [0, y0 + 0.004, d / 2 + 0.0005], w: w * 0.6, h: 0.003 });
  if (T.rugged) { mesh(roundedBox(w + 0.008, h * 0.25, d + 0.008, 0.008), T.accent, { parent: cam, at: [0, y0 + h * 0.12, 0] }); curveTube([[-w / 2, y0 + h * 0.8, 0], [-w / 2 - 0.02, y0 + h * 1.5, 0], [w / 2 + 0.02, y0 + h * 1.5, 0], [w / 2, y0 + h * 0.8, 0]], 0.003, T.rubber, { parent: cam, segments: 24 }); }
  if (T.kids) { mesh(roundedBox(w + 0.016, h + 0.012, d + 0.01, 0.015), T.body2, { parent: cam, at: [0, y0 + h / 2, -0.004] }); for (const sx of [-1, 1]) curveTube([[sx * w / 2, y0 + h * 0.5, -d / 2 - 0.006], [sx * (w / 2 + 0.02), y0 + h * 0.4, -d / 2 - 0.01], [sx * (w / 2 + 0.03), y0 + h * 0.05, -d / 2 - 0.014]], 0.006, T.accent, { parent: cam, segments: 16 }); }
  if (T.damaged) mesh(roundedBox(w * 0.6, 0.012, d + 0.003, 0.002), M.matte('#9b9d9f', 0.95), { parent: cam, at: [0, y0 + h * 0.2, 0], rot: [0, 0, 0.25] });
  return extra;
});

/* ================================ smart speaker ================================ */

export const SPEAKER_VARIANTS = {
  cylinder: { r: 0.05, h: 0.17, prof: 'cyl' },
  puck: { r: 0.05, h: 0.045, prof: 'puck' },
  sphere: { r: 0.05, h: 0.09, prof: 'sphere' },
  'smart-display': { display: true },
  'tall-tower': { r: 0.055, h: 0.26, prof: 'tall' },
  'mini-orb': { r: 0.045, h: 0.08, prof: 'orb' },
};

export const createSmartSpeaker = makeDevice('smart-speaker', SPEAKER_VARIANTS, (g, { ctx, T, V }) => {
  const cloth = M.fabric(T.plain ? (ctx.o.color ?? '#5d6168') : T.white ? '#e9e8e4' : T.retro ? '#8b6b48' : T.black || T.gaming ? '#1c1d20' : T.kids ? '#2fb0ff' : T.gold ? '#d9c39a' : T.rugged ? '#4c5737' : '#6c6f74');
  const shell = T.plain ? M.plastic('#e8e8e6', 0.4) : T.body;
  const extra = [];
  if (V.display) {
    const w = 0.18, h = 0.12;
    // fabric base wedge + floating-look screen panel resting on it
    const s = new THREE.Shape([new THREE.Vector2(-0.05, 0), new THREE.Vector2(0.045, 0), new THREE.Vector2(0.01, 0.075), new THREE.Vector2(-0.03, 0.075)]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w * 0.9, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3 });
    geo.translate(0, 0, -w * 0.45).rotateY(PI / 2);
    mesh(geo, cloth, { parent: g });
    const p = group('display', { parent: g, at: [0, 0.07, 0.03], rot: [-0.32, 0, 0] });
    mesh(roundedBox(w, h, 0.012, 0.006), shell, { parent: p, at: [0, 0, 0] });
    mesh(new THREE.PlaneGeometry(w - 0.004, h - 0.004), T.bezelMat, { parent: p, at: [0, 0, 0.0065] });
    screen(ctx, p, w - 0.018, h - 0.018, { at: [0, 0, 0.0072], content: 'dash' });
    mesh(new THREE.CircleGeometry(0.002, 16), T.black, { parent: p, at: [0, h / 2 - 0.0045, 0.0074] });
    emblem(g, 0.02, [0, 0.025, -0.0465], [0.35, PI, 0]);
    if (T.gaming) rgb(ctx, g, { at: [0, 0.003, 0.054], w: w * 0.8, h: 0.003 });
    trimShell(ctx, g, w, 0.01, 0.1);
    return extra;
  }
  const { r, h, prof } = V;
  let pr;
  if (prof === 'cyl' || prof === 'tall') pr = [[0, 0], [r * 0.92, 0], [r, h * 0.04], [r, h * 0.96], [r * 0.94, h], [0, h]];
  else if (prof === 'puck') pr = [[0, 0], [r * 0.9, 0], [r, h * 0.3], [r * 0.98, h * 0.8], [r * 0.85, h], [0, h]];
  else { pr = []; const R = h / 2; for (let i = 0; i <= 16; i++) { const a = -PI / 2 + (i / 16) * PI; pr.push([Math.max(Math.cos(a) * R, i === 0 || i === 16 ? 0 : 0.001), R + Math.sin(a) * R]); } pr[0] = [R * 0.55, R - Math.sqrt(R * R - (R * 0.55) ** 2)]; pr.unshift([0, pr[0][1]]); }
  const body = mesh(lathe(pr, 48), cloth, { parent: g });
  void body;
  const topY = pr[pr.length - 1][1];
  const capR = prof === 'puck' ? r * 0.8 : prof === 'cyl' || prof === 'tall' ? r * 0.95 : h * 0.3;
  const capY = prof === 'sphere' || prof === 'orb' ? h * 0.93 : topY;
  mesh(new THREE.CylinderGeometry(capR, capR, 0.004, 48), shell, { parent: g, at: [0, capY, 0] });
  // light ring
  const ring = lathe([[capR * 0.82, 0], [capR * 0.92, 0], [capR * 0.92, 0.0015], [capR * 0.82, 0.0015]], 48);
  ring.translate(0, capY + 0.002, 0);
  led(ctx, g, prof === 'tall' ? 'white' : 'blue', { geometry: ring, normal: [0, 1, 0] });
  for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.001, 12), T.dark, { parent: g, at: [Math.cos(a) * capR * 0.45, capY + 0.0024, Math.sin(a) * capR * 0.45] }); }
  emblem(g, 0.014, [0, capY + 0.0028, 0], [-PI / 2, 0, 0]);
  if (prof === 'cyl' || prof === 'tall') ports(g, T.port, ['dc'], { at: [0, 0.012, -r - 0.0004], rot: [0, PI, 0] });
  if (T.gaming) rgb(ctx, g, { at: [0, 0.004, (prof === 'sphere' || prof === 'orb' ? h * 0.27 : r) + 0.001], w: 0.04, h: 0.003 });
  if (T.rugged) { for (const y of [0.01, topY * 0.6]) mesh(new THREE.TorusGeometry((prof === 'sphere' || prof === 'orb' ? h * 0.4 : r) + 0.002, 0.004, 8, 40).rotateX(PI / 2), T.accent, { parent: g, at: [0, Math.min(y, topY - 0.01), 0] }); }
  if (T.kids) for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.014, 16, 12), T.body2, { parent: g, at: [sx * capR * 0.6, capY + 0.008, 0] });
  if (T.damaged) mesh(roundedBox(0.05, 0.012, 0.003, 0.001), M.matte('#9b9d9f', 0.95), { parent: g, at: [0, topY * 0.5, (prof === 'sphere' || prof === 'orb' ? h * 0.5 : r) + 0.0005], rot: [0, 0, 0.5] });
  if (T.retro) mesh(new THREE.CylinderGeometry(capR * 1.02, capR * 1.06, 0.012, 48), M.wood('walnut'), { parent: g, at: [0, 0.006, 0] });
  return extra;
});
