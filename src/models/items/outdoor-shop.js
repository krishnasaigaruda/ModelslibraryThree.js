// Everyday items, shopping & travel: shopping carts and baskets, shopping bags,
// cardboard boxes and suitcases/luggage.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, cushion, setup, done, fin, tm, hw, TRIMS, clip, spinTrack, rotateTrack, moveTrack, pingPong, labelPlane, textDraw, strap, openBox } from './common.js';
import { merge, rodGeo, torusGeo, boxVessel, boxSolid, wheel, ropeMat } from './outdoor-util.js';

/* ================================ SHOPPING CART ================================ */

export const SHOPPING_CART_VARIANTS = { 'shopping-trolley': {}, 'shopping-basket': {}, 'rolling-basket': {}, 'kids-cart': { k: 0.62 }, 'wire-basket': {} };

/** Wire basket on a frustum: bottom rect (w0×l0 at y0), top rect (w1×l1 at y1), z offset of bottom. */
function wireBasket(w0, l0, w1, l1, y0, y1, r, { zb = 0, step = 0.035, rings = 5 } = {}) {
  const geos = [];
  const corner = (u, v, top) => {
    const w = top ? w1 : w0, l = top ? l1 : l0;
    return [u * w / 2, top ? y1 : y0, v * l / 2 + (top ? 0 : zb)];
  };
  const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
  const sides = [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]];
  for (const [[u0, v0], [u1, v1]] of sides) {
    const len = Math.hypot((u1 - u0) * w1 / 2, (v1 - v0) * l1 / 2);
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const b = lerp(corner(u0, v0, false), corner(u1, v1, false), t), tp = lerp(corner(u0, v0, true), corner(u1, v1, true), t);
      geos.push(rodGeo(b, tp, r, 4));
    }
    for (let j = 0; j <= rings; j++) {
      const t = j / rings;
      const a = lerp(corner(u0, v0, false), corner(u0, v0, true), t), b = lerp(corner(u1, v1, false), corner(u1, v1, true), t);
      geos.push(rodGeo(a, b, j === rings ? r * 2.2 : r, j === rings ? 8 : 4));
    }
  }
  // floor grid
  const nx = Math.max(2, Math.round(w0 / step)), nz = Math.max(2, Math.round(l0 / step));
  for (let i = 0; i <= nx; i++) { const x = -w0 / 2 + (i * w0) / nx; geos.push(rodGeo([x, y0, -l0 / 2 + zb], [x, y0, l0 / 2 + zb], r, 4)); }
  for (let j = 0; j <= nz; j++) { const z = -l0 / 2 + (j * l0) / nz + zb; geos.push(rodGeo([-w0 / 2, y0, z], [w0 / 2, y0, z], r, 4)); }
  return merge(geos);
}

function castor(parent, at, R, name, mat) {
  const g = group(name, { parent, at });
  mesh(roundedBox(0.035, 0.03, 0.03, 0.006), mat, { parent: g, at: [0, R * 2 + 0.012, 0] });
  for (const s of [-1, 1]) mesh(roundedBox(0.004, R * 1.4, 0.02, 0.0015), mat, { parent: g, at: [s * 0.014, R * 1.3, 0] });
  wheel(R, 0.022, { parent: g, at: [0, R, 0], hub: M.plastic('#d0d0d0', 0.4), name: `${name}-wheel` });
  return g;
}

export function createShoppingCart(options = {}) {
  const { o, variant, T } = setup(options, SHOPPING_CART_VARIANTS, 'shopping-cart', { p: '#c42a2a', s: '#2a2b2e', a: '#f4f3ef' });
  if (!TRIMS[T.trim]?.mat) T.mat = variant === 'shopping-trolley' || variant === 'wire-basket' ? 'metal' : 'plastic';
  const root = group(`shopping-cart-${variant}`);
  const k = T.k;
  const wire = T.mat === 'metal' ? (T.worn ? M.metal('#9a948a', 0.6) : M.chrome()) : fin(T, T.p, 'plastic');
  const plast = fin(T, T.p, T.mat === 'metal' ? 'plastic' : T.mat);
  const dark = fin(T, T.s, 'plastic');
  const wheels = [];
  if (variant === 'shopping-trolley' || variant === 'kids-cart') {
    const W1 = 0.55 * k * T.w, L1 = 0.85 * k, W0 = 0.42 * k * T.w, L0 = 0.62 * k;
    const y0 = 0.45 * k, y1 = 0.92 * k * T.h;
    const zb = 0.1 * k;
    if (T.mat === 'metal') mesh(wireBasket(W0, L0, W1, L1, y0, y1, 0.0025, { zb, step: 0.04 * Math.max(0.8, k) }), wire, { parent: root, name: 'basket' });
    else {
      const bk = mesh(boxVessel(W1, y1 - y0, L1, { t: 0.006, base: 0.78, n: 10, lip: 0.008 }), plast, { parent: root, at: [0, y0, 0], name: 'basket' });
      void bk;
    }
    // chassis
    const fr = T.mat === 'metal' ? wire : dark;
    const R = 0.05 * k, cy = 0.13 * k;
    for (const s of [-1, 1]) {
      tube([s * 0.2 * k, cy, -0.42 * k], [s * 0.16 * k, cy, 0.42 * k], 0.011, fr, { parent: root });
      tube([s * 0.2 * k, cy, -0.42 * k], [s * W1 / 2, y1 + 0.02, -L1 / 2 - 0.04], 0.012, fr, { parent: root });
      tube([s * 0.17 * k, cy, 0.3 * k], [s * W0 / 2, y0, L0 / 2 + zb - 0.02], 0.009, fr, { parent: root });
    }
    tube([-0.2 * k, cy, -0.42 * k], [0.2 * k, cy, -0.42 * k], 0.01, fr, { parent: root });
    tube([-0.16 * k, cy, 0.42 * k], [0.16 * k, cy, 0.42 * k], 0.01, fr, { parent: root });
    // bottom tray
    if (T.mat === 'metal') mesh(wireBasket(0.32 * k, 0.6 * k, 0.32 * k, 0.6 * k, cy + 0.01, cy + 0.04, 0.0022, { step: 0.05, rings: 1 }), wire, { parent: root });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const c = castor(root, [sx * (sz < 0 ? 0.2 : 0.16) * k, 0, sz * 0.42 * k], R, `castor${sx}${sz}`, dark);
      c.position.y = cy - 0.011 - (R * 2 + 0.027) + 0.0;
      wheels.push(c.getObjectByName(`castor${sx}${sz}-wheel`));
    }
    // handle bar
    mesh(new THREE.CylinderGeometry(0.018, 0.018, W1 + 0.06, 16).rotateZ(Math.PI / 2), fin(T, T.trim ? T.a : '#c42a2a', 'plastic'), { parent: root, at: [0, y1 + 0.03, -L1 / 2 - 0.05] });
    for (const s of [-1, 1]) tube([s * W1 / 2, y1 + 0.02, -L1 / 2 - 0.04], [s * (W1 / 2 + 0.03), y1 + 0.03, -L1 / 2 - 0.05], 0.01, fr, { parent: root });
    // child seat flap
    mesh(roundedBox(W1 * 0.7, 0.012, 0.18 * k, 0.005), fin(T, T.trim ? T.p : '#c42a2a', 'plastic'), { parent: root, at: [0, y1 - 0.12 * k, -L1 / 2 + 0.12 * k], rot: [-0.25, 0, 0] });
    if (variant === 'kids-cart') {
      tube([W1 / 2, y1, -L1 / 2], [W1 / 2 + 0.01, y1 + 0.75, -L1 / 2], 0.005, fr, { parent: root });
      const flag = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.18, 0.06), new THREE.Vector2(0, 0.12)]);
      mesh(new THREE.ShapeGeometry(flag), new THREE.MeshStandardMaterial({ color: '#f2a516', side: THREE.DoubleSide, roughness: 0.6 }), { parent: root, at: [W1 / 2 + 0.01, y1 + 0.62, -L1 / 2] });
    }
  } else if (variant === 'shopping-basket' || variant === 'wire-basket') {
    const W = 0.42 * k * T.w, H = 0.22 * k * T.h, D = 0.3 * k;
    if (variant === 'wire-basket' && T.mat === 'metal') mesh(wireBasket(W * 0.85, D * 0.85, W, D, 0.01, H, 0.0022, { step: 0.03, rings: 4 }), wire, { parent: root, name: 'basket' });
    else {
      mesh(boxVessel(W, H, D, { t: 0.004, base: 0.85, n: 10, lip: 0.008 }), plast, { parent: root, name: 'basket' });
      // vent slots (dark recesses) on the long sides
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) mesh(roundedBox(0.03, 0.05 * k, 0.002, 0.001), dark, { parent: root, at: [(-3 + i) * W * 0.12, H * (0.35 + j * 0.33), s * (D * (0.925 + 0.075 * (0.35 + j * 0.33)) / 2 + 0.0002)] });
    }
    const hm = variant === 'wire-basket' ? wire : fin(T, T.trim ? T.s : '#2a2b2e', 'plastic');
    for (const s of [-1, 1]) {
      const fold = group(s < 0 ? 'handleL' : 'handleR', { parent: root, at: [0, H, 0] });
      curveTube([[-W * 0.42, 0, s * D * 0.5], [-W * 0.3, 0.14 * k, s * D * 0.12], [W * 0.3, 0.14 * k, s * D * 0.12], [W * 0.42, 0, s * D * 0.5]], 0.008, hm, { parent: fold, segments: 24 });
    }
    if (variant === 'shopping-basket') mesh(roundedBox(W * 0.3, 0.05 * k, 0.003, 0.002), fin(T, '#f4f3ef', 'plastic'), { parent: root, at: [0, H * 0.7, D / 2 + 0.002] });
  } else {
    // rolling basket: tall basket on two wheels with telescopic handle
    const W = 0.4 * k * T.w, H = 0.36 * k * T.h, D = 0.3 * k;
    const y0 = 0.06;
    mesh(boxVessel(W, H, D, { t: 0.005, base: 0.88, n: 10, lip: 0.008 }), plast, { parent: root, at: [0, y0, 0], name: 'basket' });
    for (const s of [-1, 1]) wheels.push(wheel(0.07 * k, 0.03, { parent: root, at: [s * (W / 2 + 0.01), 0.07 * k, -D / 2 + 0.03], hub: dark, name: s < 0 ? 'wheelL' : 'wheelR' }));
    tube([-(W / 2 + 0.01), 0.07 * k, -D / 2 + 0.03], [W / 2 + 0.01, 0.07 * k, -D / 2 + 0.03], 0.006, M.metal('#888', 0.3), { parent: root });
    for (const s of [-1, 1]) mesh(roundedBox(0.03, 0.06, 0.03, 0.006), dark, { parent: root, at: [s * W * 0.3, 0.03, D / 2 - 0.05] });
    const hdl = group('handle', { parent: root, at: [0, y0 + H * 0.5, -D / 2 - 0.012] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.007, 0.007, H * 0.9, 10), M.metal('#c9ccd2', 0.25), { parent: hdl, at: [s * W * 0.3, H * 0.15, 0] });
    mesh(roundedBox(W * 0.66, 0.03, 0.025, 0.01), dark, { parent: hdl, at: [0, H * 0.6, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(0.025, H * 0.8, 0.012, 0.004), dark, { parent: root, at: [s * W * 0.3, y0 + H * 0.45, -D * 0.47 - 0.005] });
    return done(root, 'shopping-cart', variant, o, () => [clip('roll', 1.5, wheels.map((w) => spinTrack(w, 'x', 1.5))), clip('handle', 2, [moveTrack(hdl, 2, (t) => [0, pingPong(t) * H * 0.6, 0])])]);
  }
  return done(root, 'shopping-cart', variant, o, () => (wheels.length ? [clip('roll', 1.5, wheels.map((w) => spinTrack(w, 'x', 1.5)))] : []));
}

/* ================================ SHOPPING BAG ================================ */

export const SHOPPING_BAG_VARIANTS = { 'paper-bag': {}, 'grocery-bag': {}, 'plastic-bag': {}, 'reusable-tote': {}, 'gift-bag': {}, 'mesh-bag': {} };

function produce(parent, T, W, D, y) {
  // a baguette, leafy greens and apples poking out of a grocery bag
  const bread = new THREE.MeshStandardMaterial({ name: 'bread', color: '#c98a3c', roughness: 0.8 });
  const leaf = new THREE.MeshStandardMaterial({ name: 'leaf', color: '#4f9a3a', roughness: 0.7 });
  const apple = new THREE.MeshPhysicalMaterial({ name: 'apple', color: '#c42a2a', roughness: 0.35, clearcoat: 0.5 });
  mesh(new THREE.CapsuleGeometry(0.03, 0.42, 6, 12), bread, { parent, at: [-W * 0.25, y + 0.06, -D * 0.15], rot: [0.25, 0, 0.12] });
  for (let i = 0; i < 4; i++) curveTube([[W * 0.15, y - 0.1, D * 0.1], [W * 0.15 + (i - 1.5) * 0.02, y + 0.05, D * 0.1], [W * 0.15 + (i - 1.5) * 0.05, y + 0.16, D * 0.12 + (i % 2) * 0.03]], 0.012, leaf, { parent, segments: 10 });
  for (let i = 0; i < 2; i++) mesh(new THREE.SphereGeometry(0.04, 16, 12), apple, { parent, at: [W * (-0.05 + i * 0.25), y - 0.01, -D * 0.05 + i * 0.03] });
}

export function createShoppingBag(options = {}) {
  const { o, variant, T } = setup(options, SHOPPING_BAG_VARIANTS, 'shopping-bag', { p: '#b58a57', s: '#e9dfcc', a: '#3a2c1e' });
  const pal = { 'plastic-bag': { p: '#f2f2f0', mat: 'plastic' }, 'reusable-tote': { p: '#d8cbb3', mat: 'canvas' }, 'gift-bag': { p: '#c42a5a', mat: 'gloss' }, 'mesh-bag': { p: '#2f8a3a', mat: 'plastic' } }[variant] ?? { mat: 'paper' };
  if (!T.trim) Object.assign(T, pal, o.color ? { p: o.color } : {});
  else if (!TRIMS[T.trim].mat) T.mat = pal.mat;
  const root = group(`shopping-bag-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  if (variant === 'paper-bag' || variant === 'grocery-bag' || variant === 'gift-bag') {
    const W = (variant === 'gift-bag' ? 0.26 : variant === 'grocery-bag' ? 0.3 : 0.32) * k * T.w;
    const H = (variant === 'gift-bag' ? 0.3 : variant === 'grocery-bag' ? 0.4 : 0.36) * k * T.h;
    const D = (variant === 'gift-bag' ? 0.12 : 0.17) * k * T.d;
    mesh(boxVessel(W, H, D, { t: 0.0025, n: 16 }), body, { parent: root, name: 'bag' });
    // gusset crease lines on the narrow sides
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.0015, H * 0.9, 0.0015), fin(T, T.p, T.mat, {}), { parent: root, at: [s * (W / 2 + 0.0003), H * 0.5, 0] });
    if (variant !== 'grocery-bag') {
      // folded top band and handles
      mesh(boxVessel(W + 0.003, 0.04, D + 0.003, { t: 0.003, n: 16 }), fin(T, T.mat === 'paper' ? T.p : T.s, T.mat), { parent: root, at: [0, H - 0.04, 0] });
      const hm = variant === 'gift-bag' ? ropeMat(T.trim ? T.a : '#f4f3ef') : ropeMat(T.mat === 'paper' ? T.p : T.s);
      for (const s of [-1, 1]) curveTube([[-W * 0.2, H - 0.02, s * (D / 2 + 0.002)], [-W * 0.18, H + 0.1 * k, s * (D / 2 + 0.004)], [W * 0.18, H + 0.1 * k, s * (D / 2 + 0.004)], [W * 0.2, H - 0.02, s * (D / 2 + 0.002)]], variant === 'gift-bag' ? 0.003 : 0.0035, hm, { parent: root, segments: 24 });
      if (variant === 'gift-bag') {
        // tissue paper puffs
        const tissue = new THREE.MeshStandardMaterial({ name: 'tissue', color: T.trim ? T.s : '#f6e6ef', roughness: 0.8, side: THREE.DoubleSide });
        for (let i = 0; i < 4; i++) mesh(new THREE.ConeGeometry(0.05 * k, 0.12 * k, 5, 1, true), tissue, { parent: root, at: [(i - 1.5) * W * 0.18, H + 0.02 * k, (i % 2 - 0.5) * D * 0.3], rot: [(i % 2 - 0.5) * 0.4, i, (i - 1.5) * 0.2] });
      }
      const lp = labelPlane(W * 0.5, H * 0.22, textDraw(variant === 'gift-bag' ? ['for you'] : ['MARKET'], { bg: `#${M.toColor(T.s).getHexString()}`, fg: '#3a2c1e' }));
      lp.position.set(0, H * 0.5, D / 2 + 0.0006);
      root.add(lp);
    } else {
      mesh(boxVessel(W + 0.003, 0.015, D + 0.003, { t: 0.003, n: 16 }), body, { parent: root, at: [0, H - 0.015, 0] });
      produce(root, T, W, D, H * 0.9);
    }
  } else if (variant === 'plastic-bag') {
    // T-shirt bag: soft, bulging, with two loop handles
    const W = 0.32 * k * T.w, H = 0.32 * k * T.h, D = 0.18 * k;
    const g = boxVessel(W, H, D, { t: 0.002, base: 0.85, n: 3 });
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / H; const s = 1 + 0.12 * Math.sin(y * Math.PI); p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * (1 + 0.25 * Math.sin(y * Math.PI)) * (1 - 0.35 * y * y)); }
    g.computeVertexNormals();
    const bm = fin(T, T.p, 'plastic');
    bm.transparent = true; bm.opacity = 0.9; bm.roughness = 0.35;
    mesh(g, bm, { parent: root, name: 'bag' });
    // contents: a boxed item & a bottle top
    mesh(roundedBox(W * 0.5, H * 0.45, D * 0.5, 0.01), fin(T, '#e8a33a', 'paper'), { parent: root, at: [-W * 0.05, H * 0.225 + 0.002, 0] });
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; pts.push([s * W * 0.3 + Math.cos(a) * W * 0.14, H * 0.99 + Math.sin(a) * 0.16 * k, 0]); }
      strap(pts, 0.02, 0.002, bm, { parent: root });
    }
  } else if (variant === 'reusable-tote') {
    const W = 0.4 * k * T.w, H = 0.38 * k * T.h, D = 0.12 * k;
    mesh(boxVessel(W, H, D, { t: 0.003, n: 10 }), body, { parent: root, name: 'bag' });
    const sm = fin(T, T.trim ? T.s : '#3a3226', T.mat === 'leather' ? 'leather' : 'canvas');
    for (const s of [-1, 1]) strap([[-W * 0.28, H * 0.75, s * (D / 2 + 0.002)], [-W * 0.28, H + 0.002, s * (D / 2 + 0.002)], [-W * 0.22, H + 0.22 * k, s * D * 0.3], [W * 0.22, H + 0.22 * k, s * D * 0.3], [W * 0.28, H + 0.002, s * (D / 2 + 0.002)], [W * 0.28, H * 0.75, s * (D / 2 + 0.002)]], 0.03, 0.003, sm, { parent: root, segments: 40 });
    if (T.detail) mesh(cushion(W * 0.45, H * 0.35, 0.012, { bulge: 0.05 }), sm, { parent: root, at: [0, H * 0.35, D / 2 + 0.006] });
  } else {
    // mesh produce bag full of oranges
    const fruit = new THREE.MeshPhysicalMaterial({ name: 'orange', color: T.trim === 'red' ? '#c42a2a' : T.trim === 'green' ? '#8ac43a' : '#f08a1a', roughness: 0.55, clearcoat: 0.3 });
    const r = 0.04 * k;
    const pos = [];
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; pos.push([Math.cos(a) * r * 1.05, r, Math.sin(a) * r * 1.05]); }
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; pos.push([Math.cos(a) * r * 0.6, r * 2.5, Math.sin(a) * r * 0.6]); }
    pos.push([0, r * 3.9, 0]);
    for (const p of pos) mesh(new THREE.SphereGeometry(r, 16, 12), fruit, { parent: root, at: p });
    const net = [];
    const R = r * 2.15, cy = r * 2.1;
    for (let i = 0; i < 10; i++) net.push(torusGeo(R, 0.0012, [0, cy, 0], [0, (i / 10) * Math.PI, 0], Math.PI * 2, 32).scale(1, 1.05, 1));
    for (let j = 1; j < 6; j++) { const yy = -R + (j * 2 * R) / 6; const rr = Math.sqrt(R * R - yy * yy); net.push(torusGeo(rr, 0.0012, [0, cy + yy * 1.05, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 32)); }
    const nm = fin(T, T.p, 'plastic');
    mesh(merge(net), nm, { parent: root, name: 'net' });
    mesh(new THREE.TorusGeometry(0.012, 0.004, 6, 16), nm, { parent: root, at: [0, cy + R * 1.05 + 0.012, 0] });
    mesh(roundedBox(0.04, 0.025, 0.006, 0.002), fin(T, '#f4f3ef', 'paper'), { parent: root, at: [0, cy + R * 1.05 - 0.004, 0.012] });
  }
  return done(root, 'shopping-bag', variant, o);
}

/* ================================ CARDBOARD BOX ================================ */

export const CARDBOARD_BOX_VARIANTS = { 'open-box': {}, 'closed-box': {}, 'taped-box': {}, 'moving-box': {}, 'shoe-box': {}, 'pizza-box': {}, 'box-stack': {}, 'flat-pack': {} };

function cardboard(T, c = T.p) {
  return new THREE.MeshStandardMaterial({ name: 'cardboard', color: M.toColor(c).lerp(new THREE.Color('#8a7a62'), T.worn * 0.25), roughness: 0.9 });
}

/** Closed shipping box with flap seam (and optional tape/label). Base at y=0. */
function closedBox(parent, T, W, H, D, { tape = false, label = false, fragile = false, handles = false, at = [0, 0, 0], rot = 0 } = {}) {
  const g = group('carton', { parent, at, rot: [0, rot, 0] });
  const cm = cardboard(T);
  mesh(roundedBox(W, H, D, 0.003, 1), cm, { parent: g, at: [0, H / 2, 0] });
  mesh(new THREE.BoxGeometry(W * 0.998, 0.0012, 0.0015), fin(T, '#4a3a28', 'matte'), { parent: g, at: [0, H + 0.0002, 0] });
  if (tape) {
    const tm2 = new THREE.MeshStandardMaterial({ name: 'tape', color: T.trim === 'white' ? '#d9c9a0' : '#c9a46a', roughness: 0.3, transparent: true, opacity: 0.92 });
    mesh(new THREE.BoxGeometry(W + 0.002, 0.0008, 0.05), tm2, { parent: g, at: [0, H + 0.0004, 0] });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.0008, Math.min(0.08, H * 0.35), 0.05), tm2, { parent: g, at: [s * (W / 2 + 0.0004), H - Math.min(0.08, H * 0.35) / 2, 0] });
  }
  if (label) {
    const lp = labelPlane(Math.min(0.12, W * 0.4), Math.min(0.08, H * 0.3), textDraw(['SHIP TO', '12 Any Street'], { bg: '#f4f3ef', fg: '#1d1d1d', border: '#1d1d1d' }));
    lp.position.set(W * 0.15, H * 0.6, D / 2 + 0.0006);
    g.add(lp);
  }
  if (fragile) {
    const fp = labelPlane(Math.min(0.16, W * 0.5), Math.min(0.05, H * 0.2), textDraw(['FRAGILE'], { bg: '#c42a2a', fg: '#ffffff' }));
    fp.position.set(0, H * 0.8, -D / 2 - 0.0006); fp.rotation.y = Math.PI;
    g.add(fp);
    const ar = labelPlane(0.05, 0.05, (c, w, h) => { c.fillStyle = '#f4f3ef00'; c.clearRect(0, 0, w, h); c.fillStyle = '#e9d9b8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d1d1d'; c.beginPath(); c.moveTo(w / 2, 8); c.lineTo(w - 10, h / 2); c.lineTo(10, h / 2); c.fill(); c.fillRect(w * 0.4, h / 2, w * 0.2, h * 0.4); });
    ar.position.set(-W / 2 - 0.0006, H * 0.7, 0); ar.rotation.y = -Math.PI / 2;
    g.add(ar);
  }
  if (handles) for (const s of [-1, 1]) mesh(roundedBox(0.002, 0.03, 0.09, 0.0009), fin(T, '#2a2016', 'matte'), { parent: g, at: [s * (W / 2 + 0.0002), H * 0.78, 0] });
  return g;
}

export function createCardboardBox(options = {}) {
  const { o, variant, T } = setup(options, CARDBOARD_BOX_VARIANTS, 'cardboard-box', { p: '#b58a57', s: '#e9dfcc', a: '#3a2c1e', mat: 'paper' });
  const root = group(`cardboard-box-${variant}`);
  const k = T.k;
  const W = 0.4 * k * T.w, H = 0.3 * k * T.h, D = 0.3 * k * T.d;
  let anim = () => [];
  if (variant === 'open-box') {
    const cm = cardboard(T);
    cm.side = THREE.DoubleSide;
    const t = 0.004;
    openBox(W, H, D, t, cm, { parent: root, r: 0.003, name: 'box' });
    // four flaps folded open, leaning outward (angle from vertical = lean)
    const flaps = [];
    const lean = T.worn ? 1.0 : 0.35;
    const sets = [['x', 1, W], ['x', -1, W], ['z', 1, D], ['z', -1, D]];
    for (const [axis, s, span] of sets) {
      const len = D / 2;
      const f = group(`flap${flaps.length}`, { parent: root, at: axis === 'x' ? [0, H, s * (D / 2 - t / 2)] : [s * (W / 2 - t / 2), H, 0] });
      const geo = axis === 'x' ? new THREE.BoxGeometry(span - 0.004, len, t) : new THREE.BoxGeometry(t, len, span - 0.004);
      mesh(geo, cm, { parent: f, at: [0, len / 2, 0] });
      if (axis === 'x') f.rotation.x = s * lean; else f.rotation.z = -s * lean;
      flaps.push(f);
    }
    anim = () => [clip('flaps', 3, flaps.map((f, i) => rotateTrack(f, i < 2 ? 'x' : 'z', 3, (tt) => (i % 2 ? -1 : 1) * (i < 2 ? -1 : 1) * pingPong(tt) * 1.2)))];
  } else if (variant === 'closed-box' || variant === 'taped-box' || variant === 'moving-box') {
    const mv = variant === 'moving-box';
    closedBox(root, T, W * (mv ? 1.2 : 1), H * (mv ? 1.3 : 1), D * (mv ? 1.1 : 1), { tape: variant !== 'closed-box', label: variant === 'taped-box', fragile: mv, handles: mv });
  } else if (variant === 'shoe-box') {
    const SW = 0.34 * k * T.w, SH = 0.12 * k * T.h, SD = 0.2 * k;
    const bm = T.trim ? tm(T, 'p', 'paper') : fin(T, '#f08a1a', 'paper');
    mesh(boxVessel(SW, SH, SD, { t: 0.003, n: 30 }), bm, { parent: root, name: 'box' });
    const lid = group('lid', { parent: root, at: [0, SH + 0.003, -SD / 2] });
    const lg = boxVessel(SW + 0.008, 0.04 * k, SD + 0.008, { t: 0.003, n: 30 });
    lg.rotateX(Math.PI);
    mesh(lg, fin(T, T.trim ? T.s : '#1d1d1d', 'paper'), { parent: lid, at: [0, 0.037 * k, SD / 2], name: 'lidshell' });
    const sl = labelPlane(SW * 0.3, 0.06 * k, textDraw(['SIZE 9', 'EU 43'], { bg: '#f4f3ef' }));
    sl.position.set(SW * 0.25, SH * 0.5, SD / 2 + 0.0006);
    root.add(sl);
    // tissue paper inside
    mesh(cushion(SW * 0.9, 0.02, SD * 0.88, { bulge: 0.5 }), new THREE.MeshStandardMaterial({ name: 'tissue', color: '#f4f0ea', roughness: 0.8 }), { parent: root, at: [0, SH * 0.75, 0] });
    lid.position.y = SH;
    anim = () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (tt) => -pingPong(tt) * 1.4)])];
  } else if (variant === 'pizza-box') {
    const S = 0.36 * k * T.w, PH = 0.045 * k;
    const n = T.trim === 'tall' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const g = group(i ? `pizza${i}` : 'pizza', { parent: root, at: [0, i * PH, 0], rot: [0, i * 0.12, 0] });
      mesh(roundedBox(S, PH, S, 0.003, 1), cardboard(T, T.trim ? T.p : '#efe6d6'), { parent: g, at: [0, PH / 2, 0] });
      const lp = labelPlane(S * 0.6, S * 0.6, (c, w, h) => { c.fillStyle = '#efe6d6'; c.fillRect(0, 0, w, h); c.fillStyle = '#c42a2a'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.4, 0, 7); c.fill(); c.fillStyle = '#efe6d6'; c.font = `bold ${w * 0.14}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PIZZA', w / 2, h / 2); }, { bg: '#c42a2a' });
      lp.rotation.x = -Math.PI / 2; lp.position.y = PH + 0.0006;
      g.add(lp);
    }
  } else if (variant === 'box-stack') {
    const R = T.r;
    let y = 0;
    const sizes = [[1.2, 0.9, 1.1], [1, 0.8, 0.9], [0.75, 0.7, 0.7]];
    sizes.forEach(([a, b, c], i) => {
      closedBox(root, T, W * a, H * b, D * c, { tape: i !== 1, label: i === 0, at: [(R() - 0.5) * 0.03, y, (R() - 0.5) * 0.03], rot: (R() - 0.5) * 0.4 });
      y += H * b + 0.0008;
    });
  } else {
    // flat-packed boxes in a pile
    const R = T.r;
    for (let i = 0; i < 6; i++) {
      mesh(roundedBox(W * 1.6, 0.008, D * 1.4, 0.003, 1), cardboard(T), { parent: root, at: [(R() - 0.5) * 0.04, 0.004 + i * 0.0085, (R() - 0.5) * 0.04], rot: [0, (R() - 0.5) * 0.15, 0] });
    }
    mesh(new THREE.BoxGeometry(0.012, 0.056, D * 1.45), new THREE.MeshStandardMaterial({ name: 'strap', color: '#2a2b2e', roughness: 0.5 }), { parent: root, at: [0, 0.027, 0] });
  }
  return done(root, 'cardboard-box', variant, o, anim);
}

/* ================================ SUITCASE ================================ */

export const SUITCASE_VARIANTS = { 'rolling-suitcase': {}, 'hard-shell': {}, 'carry-on': { k: 0.82 }, 'duffel-bag': {}, 'vintage-trunk': {}, briefcase: {} };

export function createSuitcase(options = {}) {
  const { o, variant, T } = setup(options, SUITCASE_VARIANTS, 'suitcase', { p: '#2f3a45', s: '#1d1d1f', a: '#c9ccd2' });
  if (!TRIMS[T.trim]?.mat) T.mat = { 'rolling-suitcase': 'nylon', 'duffel-bag': 'canvas', 'vintage-trunk': 'leather', briefcase: 'leather' }[variant] ?? 'gloss';
  if (!T.trim && !o.color && (variant === 'briefcase' || variant === 'vintage-trunk')) T.p = '#6b3d22';
  if (!T.trim && !o.color && variant === 'duffel-bag') T.p = '#4a5232';
  const root = group(`suitcase-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const dark = fin(T, T.s, 'plastic');
  const metalHw = hw(T);
  let anim = () => [];
  if (variant === 'rolling-suitcase' || variant === 'hard-shell' || variant === 'carry-on') {
    const hard = variant !== 'rolling-suitcase';
    const W = 0.46 * k * T.w, H = 0.68 * k * T.h, D = (hard ? 0.27 : 0.3) * k * T.d;
    const y0 = 0.06 * k;
    mesh(roundedBox(W, H, D, hard ? 0.045 : 0.03 * T.round, 4), body, { parent: root, at: [0, y0 + H / 2, 0], name: 'shell' });
    // zip seam band
    mesh(roundedBox(W + 0.004, H + 0.004, 0.012, hard ? 0.045 : 0.03, 3), dark, { parent: root, at: [0, y0 + H / 2, hard ? 0 : D * 0.15] });
    if (hard) {
      // vertical ribs on the front and back shells
      for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) mesh(roundedBox(0.012, H * 0.82, 0.008, 0.004), body, { parent: root, at: [i * W * 0.17, y0 + H / 2, s * (D / 2 - 0.0015)] });
    } else {
      // front pockets
      mesh(cushion(W * 0.82, H * 0.55, 0.04, { bulge: 0.1 }), body, { parent: root, at: [0, y0 + H * 0.42, D / 2 + 0.012] });
      mesh(cushion(W * 0.6, H * 0.18, 0.025, { bulge: 0.1 }), body, { parent: root, at: [0, y0 + H * 0.82, D / 2 + 0.006] });
    }
    // wheels: 4 spinners for hard shells, 2 inline for soft
    const wheels = [];
    if (hard) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const g = group(`spinner${sx}${sz}`, { parent: root, at: [sx * (W / 2 - 0.04), 0, sz * (D / 2 - 0.04)] });
      mesh(roundedBox(0.04, 0.03, 0.045, 0.008), dark, { parent: g, at: [0, y0 - 0.005, 0] });
      for (const ws of [-1, 1]) wheels.push(wheel(0.022 * Math.max(1, k), 0.012, { parent: g, at: [ws * 0.012, 0.022 * Math.max(1, k), 0], hub: dark, name: `w${sx}${sz}${ws}` }));
    } else {
      for (const s of [-1, 1]) {
        mesh(roundedBox(0.06, 0.08, 0.06, 0.01), dark, { parent: root, at: [s * (W / 2 - 0.035), y0 + 0.03, -D / 2 + 0.03] });
        wheels.push(wheel(0.035, 0.025, { parent: root, at: [s * (W / 2 - 0.035), 0.035, -D / 2 + 0.03], hub: dark, name: s < 0 ? 'wheelL' : 'wheelR' }));
        mesh(roundedBox(0.04, y0 + 0.01, 0.04, 0.008), dark, { parent: root, at: [s * (W / 2 - 0.05), (y0 + 0.01) / 2, D / 2 - 0.04] });
      }
    }
    // telescopic handle
    const hdl = group('handle', { parent: root, at: [0, y0 + H, -D / 2 + 0.03] });
    mesh(roundedBox(W * 0.62, 0.02, 0.04, 0.008), dark, { parent: hdl, at: [0, 0.01, 0] });
    mesh(roundedBox(W * 0.5, 0.025, 0.03, 0.01), dark, { parent: hdl, at: [0, 0.03, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 10), M.metal('#c9ccd2', 0.2), { parent: hdl, at: [s * W * 0.25, 0.01, 0] });
    // top & side carry handles
    curveTube([[-0.07, y0 + H - 0.002, D * 0.1], [-0.05, y0 + H + 0.03, D * 0.1], [0.05, y0 + H + 0.03, D * 0.1], [0.07, y0 + H - 0.002, D * 0.1]], 0.009, dark, { parent: root, segments: 16 });
    curveTube([[W / 2 - 0.002, y0 + H * 0.5 - 0.07, 0], [W / 2 + 0.03, y0 + H * 0.5 - 0.05, 0], [W / 2 + 0.03, y0 + H * 0.5 + 0.05, 0], [W / 2 - 0.002, y0 + H * 0.5 + 0.07, 0]], 0.009, dark, { parent: root, segments: 16 });
    if (T.detail >= 1 || T.lux) for (const s of [-1, 1]) mesh(roundedBox(0.05, 0.025, 0.006, 0.002), metalHw, { parent: root, at: [s * W * 0.25, y0 + H - 0.04, D / 2 + 0.001] });
    if (T.trim === 'travel' || T.trim === 'vintage' || T.detail >= 2) {
      // luggage tag on the top handle
      strap([[0.05, y0 + H + 0.03, D * 0.1], [0.07, y0 + H + 0.005, D * 0.13], [0.07, y0 + H - 0.03, D * 0.5 + 0.004]], 0.006, 0.002, dark, { parent: root });
      mesh(roundedBox(0.06, 0.09, 0.004, 0.006), fin(T, T.a, 'leather'), { parent: root, at: [0.07, y0 + H - 0.075, D / 2 + 0.002] });
    }
    anim = () => [clip('handle', 2, [moveTrack(hdl, 2, (t) => [0, pingPong(t) * H * 0.55, 0])]), clip('roll', 1.5, wheels.map((w) => spinTrack(w, 'x', 1.5)))];
  } else if (variant === 'duffel-bag') {
    const L = 0.6 * k * T.w, R = 0.15 * k * T.h;
    const g = new THREE.CapsuleGeometry(R, L - 2 * R, 12, 32);
    g.rotateZ(Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y < -R * 0.6 ? -R * 0.6 - (y + R * 0.6) * 0.15 : y); p.setX(i, p.getX(i) * (1 + 0.15 * Math.max(0, 1 - Math.abs(p.getX(i)) / (L / 2)))); }
    g.computeVertexNormals();
    mesh(g, body, { parent: root, at: [0, R * 0.6 + R * 0.06, 0], name: 'bag' });
    const yTop = R * 0.6 + R * 0.06 + R;
    const trimM = fin(T, T.s, T.mat === 'canvas' ? 'leather' : T.mat);
    for (const s of [-1, 1]) {
      mesh(new THREE.TorusGeometry(R * 0.92, 0.01, 8, 32), trimM, { parent: root, at: [s * (L / 2 - R * 0.55), R * 0.66, 0], rot: [0, Math.PI / 2, 0] });
      strap([[s * L * 0.12, yTop - 0.04, -R * 0.75], [s * L * 0.12, yTop + 0.12 * k, -R * 0.1], [s * L * 0.12, yTop + 0.12 * k, R * 0.1], [s * L * 0.12, yTop - 0.04, R * 0.75]], 0.03, 0.005, trimM, { parent: root });
    }
    mesh(roundedBox(L * 0.32, 0.03, 0.06, 0.01), trimM, { parent: root, at: [0, yTop + 0.12 * k, 0] });
    mesh(new THREE.BoxGeometry(L * 0.7, 0.004, 0.012), metalHw, { parent: root, at: [0, yTop - 0.001, 0] });
    // shoulder strap draped along the side to the ground
    strap([[-L / 2 + R * 0.3, R * 1.2, R * 0.6], [-L * 0.2, 0.004, R * 1.3], [L * 0.2, 0.004, R * 1.35], [L / 2 - R * 0.3, R * 1.2, R * 0.6]], 0.035, 0.004, dark, { parent: root });
  } else if (variant === 'vintage-trunk') {
    const W = 0.8 * k * T.w, H = 0.42 * k * T.h, D = 0.48 * k;
    const wood = fin(T, '#8a5a32', 'wood');
    mesh(roundedBox(W, H * 0.72, D, 0.01), body, { parent: root, at: [0, H * 0.36, 0], name: 'chest' });
    const lid = group('lid', { parent: root, at: [0, H * 0.72, -D / 2] });
    const lg = new THREE.CylinderGeometry(D / 2, D / 2, W, 32, 1, false, 0, Math.PI);
    lg.rotateZ(Math.PI / 2);
    lg.scale(1, (H * 0.28) / (D / 2), 1);
    mesh(lg, body, { parent: lid, at: [0, 0, D / 2] , rot: [0, 0, 0], name: 'lidshell' });
    // wooden slats & brass corners
    for (const x of [-W * 0.3, W * 0.3]) {
      mesh(roundedBox(0.05, H * 0.72 + 0.004, D + 0.008, 0.004), wood, { parent: root, at: [x, H * 0.36, 0] });
      const band = new THREE.CylinderGeometry(D / 2 + 0.004, D / 2 + 0.004, 0.05, 32, 1, false, 0, Math.PI);
      band.rotateZ(Math.PI / 2); band.scale(1, (H * 0.28 + 0.004) / (D / 2 + 0.004), 1);
      mesh(band, wood, { parent: lid, at: [x, 0, D / 2] });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [0.03, H * 0.69]) mesh(roundedBox(0.06, 0.06, 0.06, 0.008), metalHw, { parent: root, at: [sx * (W / 2 - 0.028), yy, sz * (D / 2 - 0.028)] });
    mesh(roundedBox(0.06, 0.08, 0.012, 0.004), metalHw, { parent: root, at: [0, H * 0.66, D / 2 + 0.004] });
    for (const s of [-1, 1]) curveTube([[s * (W / 2 + 0.004), H * 0.5, -0.06], [s * (W / 2 + 0.03), H * 0.48, -0.04], [s * (W / 2 + 0.03), H * 0.48, 0.04], [s * (W / 2 + 0.004), H * 0.5, 0.06]], 0.008, fin(T, '#3a2214', 'leather'), { parent: root, segments: 16 });
    anim = () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => -pingPong(t) * 1.6)])];
  } else {
    // briefcase standing on its base
    const W = 0.44 * k * T.w, H = 0.32 * k * T.h, D = (T.slim ? 0.07 : 0.1) * k;
    mesh(roundedBox(W, H, D, 0.012 * T.round, 4), body, { parent: root, at: [0, H / 2 + 0.006, 0], name: 'case' });
    mesh(roundedBox(W + 0.003, 0.012, D + 0.003, 0.005), fin(T, T.s, T.mat === 'leather' ? 'leather' : 'metal'), { parent: root, at: [0, H * 0.82, 0] });
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.035, 0.03, 0.012, 0.004), metalHw, { parent: root, at: [s * W * 0.32, H * 0.82, D / 2 + 0.003] });
      mesh(roundedBox(0.04, 0.012, 0.03, 0.004), dark, { parent: root, at: [s * (W / 2 - 0.04), 0.006, 0] });
      mesh(roundedBox(0.012, 0.025, 0.02, 0.004), metalHw, { parent: root, at: [s * 0.06, H + 0.006 + 0.0115, 0] });
    }
    curveTube([[-0.06, H + 0.02, 0], [-0.05, H + 0.06, 0], [0.05, H + 0.06, 0], [0.06, H + 0.02, 0]], 0.009, fin(T, T.s, T.mat === 'metal' ? 'plastic' : 'leather'), { parent: root, segments: 20 });
  }
  return done(root, 'suitcase', variant, o, anim);
}
