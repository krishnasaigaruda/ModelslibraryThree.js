// Personal items: keys, tags & badges, sunglasses, wristwatches, jewelry.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, setup, done, fin, tm, hw, vessel, strap, ring, clip, rotateTrack, moveTrack, pingPong, labelPlane, textDraw, canvasTex } from './common.js';
import { rrPts, circlePts, flat, upright, flatLabel, groundLoop } from './personal-util.js';

const hingeAnim = (name, node, axis, angle, period = 3) => () => [clip(name, period, [rotateTrack(node, axis, period, (t) => pingPong(t) * angle)])];
/** Metal colour family for a trim (keys, jewelry, watches). */
function metalOf(T, dflt = 'silver') {
  const m = ['gold', 'silver', 'rosegold', 'brass', 'copper'].includes(T.mat) ? T.mat : T.trim === 'vintage' ? 'brass' : T.trim === 'luxury' ? 'gold' : dflt;
  return fin(T, T.p, m);
}

/* ================================ KEYS ================================ */

export const KEYS_VARIANTS = { 'house-key': {}, keyring: {}, 'car-key-fob': {}, 'key-with-tag': {}, 'skeleton-key': {} };

/** Flat cylinder-lock key, bow hole centre at the origin, blade along +x. Returns geometry (lying flat). */
function keyGeo(T, len = 0.055, seed = 1) {
  const R = 0.0125 * (T.chunky ? 1.15 : 1);
  const bh = 0.0042;
  const pts = [];
  const sq = T.round < 0.9 || T.trim === 'silver';
  const cx = 0.005;
  if (sq) {
    // rounded-square / hex bow
    for (const [x, y] of rrPts(R * 2, R * 2, R * 0.5, 4)) if (!(x > cx * 0 + R * 0.6 && Math.abs(y) < bh)) pts.push([x + cx, y]);
    pts.sort(() => 0);
  }
  const bow = [];
  const a0 = Math.asin(bh / R);
  for (let i = 0; i <= 24; i++) { const a = a0 + (i / 24) * (Math.PI * 2 - 2 * a0); bow.push([cx + Math.cos(a) * R * (sq ? 1.0 : 1), Math.sin(a) * R * (sq ? 0.85 : 1)]); }
  const out = [...bow];
  const x0 = cx + Math.cos(a0) * R, x1 = cx + len;
  // bottom edge with bitting (teeth)
  const n = 6;
  let r = seed;
  for (let i = 0; i <= n; i++) {
    const x = x0 + 0.004 + (i / n) * (x1 - x0 - 0.008);
    r = (r * 9301 + 49297) % 233280;
    out.push([x, -bh - 0.0012 - (r / 233280) * 0.0025]);
    out.push([x + (x1 - x0) / n * 0.45, -bh + 0.0004]);
  }
  out.push([x1, -bh * 0.3], [x1, bh * 0.4], [x1 - 0.003, bh], [x0, bh]);
  return flat(out, 0.0022, { holes: [circlePts(0.0034, 16, 0, 0)], bevel: 0.0004 });
}

function keyMesh(parent, T, at, rotY, seed, mat) {
  const g = group('key', { parent, at, rot: [0, rotY, 0] });
  mesh(keyGeo(T, 0.05, seed), mat, { parent: g });
  if (T.trim === 'black' || T.trim === 'kids') {
    // rubber head cap over the bow
    mesh(cushion(0.027, 0.0055, 0.027, { radius: 0.0025, bulge: 0.2 }), fin(T, T.trim === 'kids' ? ['#ff4d6d', '#2b7de1', '#33c46a', '#ffcc1e'][seed % 4] : '#1a1b1e', 'rubber'), { parent: g, at: [0.003, 0.0011, 0] }).scale.set(1, 1, 0.9);
  }
  return g;
}

export function createKeys(options = {}) {
  const { o, variant, T } = setup(options, KEYS_VARIANTS, 'keys', { p: '#c9ccd2', s: '#2a2b2e', a: '#c42a2a', mat: 'brass' });
  const root = group(`keys-${variant}`);
  const km = metalOf(T, 'brass');
  const k = T.k;
  if (variant === 'house-key') {
    keyMesh(root, T, [0, 0, 0], 0, 3, km).scale.setScalar(k * 1.15);
  } else if (variant === 'skeleton-key') {
    const s = k * (T.chunky ? 1.2 : 1);
    mesh(new THREE.TorusGeometry(0.014 * s, 0.0028 * s, 10, 32), km, { parent: root, at: [0, 0.0028 * s, 0], rot: [Math.PI / 2, 0, 0] });
    if (T.detail >= 1) for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.006 * s, 0.0016 * s, 8, 16), km, { parent: root, at: [Math.cos(i * 2.1) * 0.006 * s, 0.0024 * s, Math.sin(i * 2.1) * 0.006 * s], rot: [Math.PI / 2, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.0028 * s, 0.0028 * s, 0.065 * s, 12).rotateZ(Math.PI / 2), km, { parent: root, at: [0.0465 * s, 0.0028 * s, 0] });
    for (const x of [0.02, 0.026]) mesh(new THREE.TorusGeometry(0.0033 * s, 0.0012 * s, 6, 14), km, { parent: root, at: [x * s, 0.0028 * s, 0], rot: [0, Math.PI / 2, 0] });
    mesh(roundedBox(0.012 * s, 0.004 * s, 0.014 * s, 0.001), km, { parent: root, at: [0.072 * s, 0.002 * s, 0.009 * s] });
    mesh(roundedBox(0.003 * s, 0.004 * s, 0.006 * s, 0.0008), km, { parent: root, at: [0.067 * s, 0.002 * s, 0.018 * s] });
  } else {
    // a split ring with things on it
    const RR = 0.014 * k;
    ring(RR, 0.0011, M.metal('#c9ccd2', 0.25), { parent: root, at: [0, 0.0012, 0], rot: [Math.PI / 2, 0, 0], name: 'ring' });
    const n = variant === 'keyring' ? 4 + (T.chunky ? 1 : 0) : 1;
    const spread = variant === 'keyring' ? 1.6 : 0;
    for (let i = 0; i < n; i++) {
      const a = -spread / 2 + (n > 1 ? (i / (n - 1)) * spread : 0) + (variant === 'keyring' ? 0 : 0.4);
      const kg = keyMesh(root, T, [Math.cos(a) * RR, 0.0024 * (i % 2), -Math.sin(a) * RR], a, i + 2, i === 2 && variant === 'keyring' ? M.metal('#c9ccd2', 0.25) : km);
    }
    if (variant === 'car-key-fob' || variant === 'keyring') {
      // remote fob on a short leather loop
      const a = variant === 'keyring' ? Math.PI * 0.95 : Math.PI;
      const fob = group('fob', { parent: root, at: [Math.cos(a) * RR, 0, -Math.sin(a) * RR], rot: [0, a, 0] });
      const fw = 0.034, fl = 0.062, ft = 0.013;
      mesh(cushion(fl, ft, fw, { radius: ft * 0.45, bulge: 0.25 }), fin(T, T.trim === 'gold' || T.trim === 'silver' || T.trim === 'brass' ? '#1d1e21' : T.s, 'plastic'), { parent: fob, at: [fl / 2 + 0.006, ft / 2, 0] });
      for (let i = 0; i < 3; i++) mesh(cushion(0.012, 0.003, 0.016, { radius: 0.0012, bulge: 0.4 }), M.rubber(), { parent: fob, at: [0.016 + i * 0.015, ft + 0.001, 0] });
      mesh(new THREE.TorusGeometry(0.0045, 0.0018, 8, 16), M.metal('#c9ccd2', 0.3), { parent: fob, at: [0.002, ft * 0.5, 0], rot: [Math.PI / 2, 0, 0] });
      if (variant === 'car-key-fob') mesh(roundedBox(0.045, 0.0022, 0.008, 0.0008), M.metal('#c9ccd2', 0.25), { parent: fob, at: [fl + 0.006 + 0.02, ft * 0.5, 0] });
      if (T.lux || T.trim === 'leather') mesh(roundedBox(0.018, 0.0025, 0.014, 0.001), fin(T, '#5a3420', 'leather'), { parent: fob, at: [-0.004, 0.00125, 0] });
    }
    if (variant === 'key-with-tag') {
      const a = Math.PI * 0.8;
      const tg = group('tag', { parent: root, at: [Math.cos(a) * RR, 0, -Math.sin(a) * RR], rot: [0, a, 0] });
      const tl = 0.05, tw = 0.026;
      const tagMat = T.trim === 'gold' || T.trim === 'silver' || T.trim === 'brass' ? fin(T, '#6b3d22', 'leather') : fin(T, T.a, 'plastic');
      mesh(flat(rrPts(tl, tw, tw * 0.45), 0.003, { holes: [circlePts(0.003, 12, -tl / 2 + 0.006, 0)] }), tagMat, { parent: tg, at: [tl / 2 - 0.003, 0, 0] });
      flatLabel(tg, tl * 0.6, tw * 0.6, ['HOME'], { bg: '#f4f1ea', fg: '#222' }, [tl / 2 + 0.004, 0.0032, 0]);
    }
  }
  return done(root, 'keys', variant, o);
}

/* ================================ TAGS ================================ */

export const TAG_VARIANTS = {
  'luggage-tag': {}, 'price-tag': {}, 'gift-tag': {}, 'dog-tag': {}, 'pet-tag': {}, 'name-badge': {}, 'id-card-lanyard': {}, 'key-tag': {}, 'hang-tag': {},
};
const TAG_DEFAULT = {
  'luggage-tag': { p: '#6b3d22', mat: 'leather' }, 'price-tag': { p: '#f4f1ea', mat: 'paper' }, 'gift-tag': { p: '#c9a878', mat: 'paper' },
  'dog-tag': { p: '#c9ccd2', mat: 'silver' }, 'pet-tag': { p: '#c9ccd2', mat: 'silver' }, 'name-badge': { p: '#f4f3ef', mat: 'plastic' },
  'id-card-lanyard': { p: '#2457b8', mat: 'plastic' }, 'key-tag': { p: '#e8402f', mat: 'plastic' }, 'hang-tag': { p: '#1d1d1d', mat: 'paper' },
};

/** Tag outline: rectangle with clipped corners at the hole end (x<0). */
function tagPts(w, h, clipF = 0.25, r = 0.002) {
  const c = h * clipF;
  return [[-w / 2 + c, -h / 2], [w / 2 - r, -h / 2], [w / 2, -h / 2 + r], [w / 2, h / 2 - r], [w / 2 - r, h / 2], [-w / 2 + c, h / 2], [-w / 2, h / 2 - c], [-w / 2, -h / 2 + c]];
}
/** Ball chain lying on the ground through the given points (instanced beads). */
function ballChain(parent, pts, r, mat) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const n = Math.max(4, Math.round(curve.getLength() / (r * 2.6)));
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), mat, n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const p = curve.getPoint(i / (n - 1)); m.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m); }
  im.name = 'chain';
  parent.add(im);
  curveTube(pts, r * 0.35, mat, { parent, segments: n });
  return im;
}

export function createTag(options = {}) {
  const v0 = setup(options, TAG_VARIANTS, 'tag').variant;
  const { o, variant, T } = setup(options, TAG_VARIANTS, 'tag', TAG_DEFAULT[v0]);
  const root = group(`tag-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const isMetal = ['silver', 'gold', 'metal', 'brass', 'rosegold'].includes(T.mat);
  const ink = T.trim === 'neon' ? '#ff2bd6' : '#1d1d1d';
  const paperBg = T.trim === 'kraft' ? '#c9a878' : T.trim === 'festive' ? '#f6efe0' : '#fbfaf6';
  const cord = fin(T, T.trim === 'festive' ? '#c8302a' : T.trim === 'kraft' ? '#d8c39a' : '#f2efe8', 'fabric');
  const rr = (v) => v * T.round;
  if (variant === 'luggage-tag') {
    const w = 0.11 * k * T.w, h = 0.065 * k * T.h, t = 0.004;
    mesh(flat(rrPts(w, h, rr(0.008)), t, { holes: [rrPts(0.004, 0.018, 0.0018).map(([x, y]) => [x - w / 2 + 0.008, y])] }), body, { parent: root });
    // address window + card
    mesh(flat(rrPts(w * 0.68, h * 0.72, 0.003), 0.0012), M.glass({ tint: '#dfeef2', opacity: 0.35 }), { parent: root, at: [w * 0.1, t, 0] });
    flatLabel(root, w * 0.64, h * 0.66, ['NAME', 'Address', 'Phone'], { bg: '#fbfaf6', fg: '#333', border: '#c9302a' }, [w * 0.1, t + 0.0003, 0]);
    // strap through the slot, lying in a loop with a buckle
    const x0 = -w / 2 + 0.008;
    strap(groundLoop([x0, -0.006], [x0 - 0.06, 0.03], 0.04, 0.0014, 16), 0.0016, 0.012, body, { parent: root });
    mesh(flat(rrPts(0.018, 0.016, 0.003), 0.002, { holes: [rrPts(0.012, 0.01, 0.002)] }), hw(T), { parent: root, at: [x0 - 0.03, 0.002, 0.03] });
  } else if (variant === 'price-tag' || variant === 'gift-tag' || variant === 'hang-tag') {
    const dims = { 'price-tag': [0.06, 0.032], 'gift-tag': [0.085, 0.048], 'hang-tag': [0.05, 0.09] }[variant];
    const w = dims[0] * k * T.w, h = dims[1] * k * T.h, t = isMetal ? 0.0015 : 0.0009;
    const pts = variant === 'hang-tag' ? rrPts(w, h, rr(0.004)) : tagPts(w, h, T.round > 1.3 ? 0.4 : 0.28, rr(0.002));
    const hx = variant === 'hang-tag' ? 0 : -w / 2 + h * 0.22, hz = variant === 'hang-tag' ? -h / 2 + 0.008 : 0;
    const hole = circlePts(0.0026, 14, hx, -hz);
    mesh(flat(pts, t, { holes: [hole], bevel: 0.0002 }), body, { parent: root });
    if (variant === 'gift-tag') mesh(flat(circlePts(0.0048, 18, hx, 0), 0.0004, { holes: [hole], bevel: 0 }), fin(T, T.trim === 'festive' ? '#e8c34a' : '#f4f1ea', 'paper'), { parent: root, at: [0, t, 0] });
    const lines = variant === 'price-tag' ? (T.trim === 'festive' ? ['SALE', '-50%'] : ['$9.99', 'PRICE']) : variant === 'gift-tag' ? ['To:', 'From:'] : ['SIZE M', '$24.00'];
    const lw = variant === 'hang-tag' ? w * 0.8 : w * 0.62, lh = variant === 'hang-tag' ? h * 0.6 : h * 0.72;
    const fg = variant === 'hang-tag' ? (T.trim ? ink : '#f4f1ea') : ink;
    const bg = variant === 'hang-tag' ? (T.trim ? paperBg : '#1d1d1d') : T.trim === 'neon' ? '#141518' : paperBg;
    flatLabel(root, lw, lh, lines, { bg, fg }, [variant === 'hang-tag' ? 0 : w * 0.1, t + 0.0003, variant === 'hang-tag' ? h * 0.08 : 0]);
    // string / twine loop lying on the ground
    if (variant === 'hang-tag') {
      // plastic barb: a T-bar on a thin filament
      curveTube([[0, 0.0006, -h / 2 + 0.008], [0.004, 0.0008, -h / 2 - 0.02], [0, 0.0008, -h / 2 - 0.045]], 0.0006, M.plastic('#f2f2f2', 0.3), { parent: root, segments: 12 });
      mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.012, 8).rotateZ(Math.PI / 2), M.plastic('#f2f2f2', 0.3), { parent: root, at: [0, 0.0012, -h / 2 - 0.046] });
    } else {
      const loop = [[hx, 0.0007, 0], [hx - 0.02, 0.0009, -0.012], [hx - 0.06, 0.0009, -0.015], [hx - 0.075, 0.0009, 0.01], [hx - 0.04, 0.0009, 0.016], [hx - 0.015, 0.0009, 0.006], [hx, 0.0007, 0]];
      curveTube(loop, 0.0008, cord, { parent: root, segments: 48 });
      if (variant === 'gift-tag') for (const s of [-1, 1]) curveTube([[hx - 0.02, 0.0009, -0.01], [hx - 0.03, 0.0012, -0.01 + s * 0.012], [hx - 0.036, 0.0012, -0.01 + s * 0.004], [hx - 0.02, 0.0009, -0.01]], 0.0012, cord, { parent: root, segments: 16 });
    }
  } else if (variant === 'dog-tag') {
    const w = 0.051 * k, h = 0.029 * k, t = 0.0012;
    const pts = rrPts(w, h, rr(0.008)), hole = circlePts(0.0018, 12, -w / 2 + 0.004, 0);
    const mtl = isMetal ? body : fin(T, T.p, T.mat === 'leather' ? 'leather' : 'plastic');
    for (const [i, a] of [[0, 0.25], [1, -0.15]]) {
      const g = group('dogtag', { parent: root, at: [i * 0.014, i * 0.0013, i * 0.01], rot: [0, a, 0] });
      mesh(flat(pts, t, { holes: [hole], bevel: 0.0003 }), mtl, { parent: g });
      mesh(flat(rrPts(w * 0.82, h * 0.72, rr(0.006)), 0.0004, { bevel: 0 }), fin(T, T.p, isMetal ? T.mat : 'plastic'), { parent: g, at: [0.002, t, 0] });
      flatLabel(g, w * 0.7, h * 0.62, ['DOE', 'JOHN A', '0123 O POS'], { bg: isMetal ? '#c9ccd2' : T.p, fg: '#3a3d42' }, [0.002, t + 0.0007, 0]);
    }
    const cx = -w / 2 + 0.004 - 0.05;
    const loop = Array.from({ length: 33 }, (_, i) => { const a = (i / 32) * Math.PI * 2; return [cx + Math.cos(a) * 0.05, 0.0011, Math.sin(a) * 0.05 * 0.8]; });
    ballChain(root, loop, 0.0011, M.metal('#b9bec6', 0.3));
  } else if (variant === 'pet-tag') {
    // bone-shaped tag on a split ring
    const s = 0.012 * k;
    const bone = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const a = u * Math.PI * 2;
      bone.push([Math.cos(a) * s * 2.2, Math.sin(a) * s * 0.65]);
    }
    const knob = (cx, cy) => circlePts(s * 0.6, 20, cx, cy);
    const sh = new THREE.Shape(bone.map(([x, y]) => new THREE.Vector2(x, y)));
    void sh;
    mesh(flat(bone, 0.002), body, { parent: root });
    for (const cx of [-1, 1]) for (const cy of [-1, 1]) mesh(flat(knob(cx * s * 2.1, cy * s * 0.55), 0.002, cx < 0 && cy > 0 ? {} : {}), body, { parent: root });
    flatLabel(root, s * 3, s * 1.1, ['MAX', '555-0123'], { bg: isMetal ? '#d9dce0' : T.p, fg: '#2a2b2e' }, [0, 0.0023, 0]);
    ring(0.009, 0.0009, M.metal('#c9ccd2', 0.3), { parent: root, at: [-s * 2.1 - 0.012, 0.001, 0], rot: [Math.PI / 2, 0, 0] });
  } else if (variant === 'name-badge') {
    const w = 0.085 * k * T.w, h = 0.055 * k * T.h, t = 0.003;
    mesh(flat(rrPts(w, h, rr(0.004)), t), body, { parent: root });
    const hdr = T.trim === 'festive' ? '#1f6a3a' : T.trim === 'neon' ? '#ff2bd6' : '#c8302a';
    const tex = canvasTex(256, 166, (g, W, H) => {
      g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, H);
      g.fillStyle = hdr; g.fillRect(0, 0, W, H * 0.38);
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 34px sans-serif'; g.fillText('HELLO', W / 2, H * 0.2);
      g.font = '18px sans-serif'; g.fillText('my name is', W / 2, H * 0.33);
      g.fillStyle = '#1d1d1d'; g.font = 'italic bold 44px sans-serif'; g.fillText('Alex', W / 2, H * 0.72);
    });
    const lab = mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.86), new THREE.MeshStandardMaterial({ name: 'label', color: tex ? '#ffffff' : hdr, map: tex, roughness: 0.5 }), { parent: root, at: [0, t + 0.0003, 0], rot: [-Math.PI / 2, 0, 0] });
    void lab;
    // clip at the top
    mesh(roundedBox(0.016, 0.004, 0.012, 0.0015), hw(T), { parent: root, at: [0, t + 0.001, -h / 2 + 0.002] });
  } else if (variant === 'id-card-lanyard' || variant === 'key-tag') {
    if (variant === 'key-tag') {
      // hotel-style oval key tag with a room number, on a ring with a key
      const w = 0.075 * k * T.w, h = 0.035 * k;
      mesh(flat(circlePts(w / 2, 40, 0, 0, h / 2), 0.004 * (T.chunky ? 1.5 : 1), { holes: [circlePts(0.003, 12, -w / 2 + 0.007, 0)] }), body, { parent: root });
      flatLabel(root, w * 0.55, h * 0.6, ['ROOM', '204'], { bg: T.p, fg: isMetal ? '#2a2b2e' : '#fbfaf6' }, [0.004, 0.004 * (T.chunky ? 1.5 : 1) + 0.0003, 0]);
      ring(0.011, 0.001, M.metal('#c9ccd2', 0.3), { parent: root, at: [-w / 2 - 0.004, 0.001, 0], rot: [Math.PI / 2, 0, 0] });
      const kg = keyMesh(root, { ...T, round: 1, chunky: false, trim: null }, [-w / 2 - 0.015 - 0.0045, 0.0021, 0], Math.PI, 5, M.metal('#b8913f', 0.3));
void kg;
    } else {
      // ID card in a clear holder, clip, lanyard ribbon lying in a loop
      const w = 0.054, h = 0.086, t = 0.0025;
      mesh(flat(rrPts(w + 0.008, h + 0.012, 0.004), t, { holes: [rrPts(0.012, 0.003, 0.0014).map(([x, y]) => [x, y + h / 2 + 0.002])] }), M.glass({ tint: '#e6f0f2', opacity: 0.5 }), { parent: root });
      const card = canvasTex(170, 270, (g, W, H) => {
        g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, H);
        g.fillStyle = T.p && typeof T.p === 'string' ? T.p : '#2457b8'; g.fillRect(0, 0, W, H * 0.18);
        g.fillStyle = '#c9b9a8'; g.fillRect(W * 0.25, H * 0.25, W * 0.5, H * 0.38);
        g.fillStyle = '#7a6a5a'; g.beginPath(); g.arc(W / 2, H * 0.38, W * 0.12, 0, 7); g.fill(); g.fillRect(W * 0.32, H * 0.5, W * 0.36, H * 0.13);
        g.fillStyle = '#1d1d1d'; g.textAlign = 'center'; g.font = 'bold 22px sans-serif'; g.fillText('SAM LEE', W / 2, H * 0.74);
        g.font = '15px sans-serif'; g.fillText('VISITOR', W / 2, H * 0.84);
        for (let i = 0; i < 18; i++) g.fillRect(W * 0.2 + i * 6, H * 0.88, i % 3 ? 2 : 4, H * 0.08);
      });
      mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ name: 'label', color: card ? '#ffffff' : '#f4f1ea', map: card, roughness: 0.4 }), { parent: root, at: [0, t * 0.5, 0.004], rot: [-Math.PI / 2, 0, 0] });
      const cy = -(h / 2 + 0.006);
      mesh(roundedBox(0.012, 0.004, 0.02, 0.0015), hw(T), { parent: root, at: [0, 0.002, cy - 0.006] });
      const lan = tm(T, 'p', T.mat === 'leather' ? 'leather' : 'nylon');
      const pts = [[0, 0.0012, cy - 0.015], [-0.03, 0.0012, cy - 0.07], [-0.11, 0.0012, cy - 0.16], [-0.06, 0.0012, cy - 0.3], [0.06, 0.0012, cy - 0.3], [0.11, 0.0012, cy - 0.16], [0.03, 0.0012, cy - 0.07], [0.004, 0.0012, cy - 0.015]];
      strap(pts, 0.0016, 0.016, lan, { parent: root, segments: 80 });
    }
  }
  return done(root, 'tag', variant, o);
}

/* ================================ SUNGLASSES ================================ */

export const SUNGLASSES_VARIANTS = { aviator: {}, wayfarer: {}, round: {}, sport: {}, 'cat-eye': {}, 'reading-glasses': {} };

const LENS = {
  aviator: [[-0.025, 0.016], [0, 0.019], [0.026, 0.017], [0.029, 0.0], [0.023, -0.019], [0.006, -0.027], [-0.012, -0.024], [-0.023, -0.009]],
  wayfarer: [[-0.023, 0.017], [0.0, 0.018], [0.027, 0.019], [0.026, 0.0], [0.02, -0.016], [0.0, -0.018], [-0.017, -0.017], [-0.024, -0.006]],
  'cat-eye': [[-0.022, 0.012], [0.002, 0.015], [0.025, 0.022], [0.029, 0.01], [0.019, -0.013], [-0.006, -0.017], [-0.021, -0.009]],
};
function lensPts(kind, s = 1) {
  let pts;
  if (kind === 'round') pts = circlePts(0.022, 40);
  else if (kind === 'reading-glasses') pts = rrPts(0.048, 0.026, 0.007, 6);
  else pts = new THREE.CatmullRomCurve3(LENS[kind].map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal').getPoints(40).slice(0, 40).map((v) => [v.x, v.y]);
  return pts.map(([x, y]) => [x * s, y * s]);
}

export function createSunglasses(options = {}) {
  const { o, variant, T } = setup(options, SUNGLASSES_VARIANTS, 'eyewear', { p: '#1a1b1e', s: '#3a3d42', a: '#5a3a1e', mat: variant0(options) });
  const root = group(`eyewear-${variant}`);
  const k = T.k * (T.trim === 'kids' ? 0.85 / 0.72 : 1);
  const metalFrame = ['aviator', 'round', 'reading-glasses'].includes(variant) && !['leopard', 'kids', 'neon', 'black'].includes(T.trim);
  const frameMat = T.trim === 'gold' || T.trim === 'vintage' || (metalFrame && !T.trim) ? metalOf({ ...T, mat: T.trim === 'vintage' ? 'brass' : T.trim === 'gold' || variant === 'aviator' ? 'gold' : 'silver' }) : tm(T, 'p', T.trim === 'neon' || T.trim === 'kids' ? 'plastic' : T.mat === 'leather' ? 'gloss' : 'gloss');
  const tint = variant === 'reading-glasses' ? '#eef4f6' : T.trim === 'neon' ? '#ff2bd6' : T.trim === 'kids' ? '#2b7de1' : T.trim === 'gold' ? '#5a3a10' : T.trim === 'vintage' ? '#3a5a3a' : '#15181c';
  const lens = M.glass({ tint, opacity: variant === 'reading-glasses' ? 0.25 : 0.8 });
  if (T.trim === 'neon' || T.trim === 'gold') { lens.metalness = 0.9; lens.roughness = 0.05; }
  const front = group('front', { parent: root });
  const thick = metalFrame ? 0.0022 : 0.0055 * (T.chunky ? 1.25 : 1);
  const depth = metalFrame ? 0.0022 : 0.006;
  const sep = 0.034 * k * T.w;
  let lensH = 0.024 * k;
  if (variant === 'sport') {
    // single wrap-around shield
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const x = Math.cos(a), y = Math.sin(a);
      const notch = y > 0 && Math.abs(x) < 0.12 ? -0.25 : 0;
      pts.push([x * 0.072 * k, (y > 0 ? y * 0.85 + notch : y * (0.9 - 0.4 * (1 - Math.abs(x)))) * 0.025 * k]);
    }
    const g = upright(pts, 0.002);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) - (x * x) * 6); }
    g.computeVertexNormals();
    mesh(g, lens, { parent: front });
    // top bar
    curveTube(Array.from({ length: 9 }, (_, i) => { const x = (-1 + i / 4) * 0.072 * k; return [x, 0.021 * k, -(x * x) * 6 + 0.001]; }), 0.003 * k, frameMat, { parent: front, segments: 32 });
    mesh(roundedBox(0.012, 0.01, 0.006, 0.003), M.rubber(), { parent: front, at: [0, 0.006 * k, -0.004] });
    lensH = 0.025 * k;
  } else {
    const lp = lensPts(variant, k);
    const s1 = 1 + (metalFrame ? 0.07 : 0.17) * (T.chunky ? 1.2 : 1);
    for (const sx of [-1, 1]) {
      const pts = lp.map(([x, y]) => [x * sx, y]);
      const rim = pts.map(([x, y]) => [x * s1 + sx * 0.0006, y * s1 + (variant === 'cat-eye' ? 0 : 0)]);
      mesh(upright(rim, depth, { holes: [pts], bevel: Math.min(0.0008, depth * 0.3) }), frameMat, { parent: front, at: [sx * sep, 0, 0] });
      mesh(upright(pts.map(([x, y]) => [x * 1.02, y * 1.02]), 0.0014, { bevel: 0.0003 }), lens, { parent: front, at: [sx * sep, 0, 0] });
      if (metalFrame) {
        // nose pads
        curveTube([[sx * 0.008, 0.002, -0.001], [sx * 0.006, -0.004, -0.008], [sx * 0.0075, -0.008, -0.01]], 0.0007, frameMat, { parent: front, segments: 8 });
        mesh(new THREE.SphereGeometry(0.0035, 10, 8), M.glass({ tint: '#e6eef0', opacity: 0.5 }), { parent: front, at: [sx * 0.0078, -0.009, -0.0105], scale: [0.5, 1, 0.8] });
      }
    }
    // bridge (double bridge on aviators)
    const ytop = lp.reduce((m, [, y]) => Math.max(m, y), 0);
    const bx = sep - 0.027 * k * (variant === 'round' ? 0.85 : 1);
    curveTube([[-bx, ytop * 0.35, 0], [0, ytop * 0.55, 0.002], [bx, ytop * 0.35, 0]], metalFrame ? 0.0012 : thick * 0.5, frameMat, { parent: front, segments: 16 });
    if (variant === 'aviator') curveTube([[-bx - 0.004, ytop * 1.05, 0], [0, ytop * 1.08, 0.001], [bx + 0.004, ytop * 1.05, 0]], 0.0011, frameMat, { parent: front, segments: 16 });
    lensH = lp.reduce((m, [, y]) => Math.max(m, -y), 0) * s1;
  }
  // temples: straight back, ear-bend down to the floor
  const hx = variant === 'sport' ? 0.072 * k : sep + 0.03 * k * (variant === 'aviator' ? 1.05 : 1);
  const hy = variant === 'sport' ? 0.012 * k : 0.008 * k;
  const zh = variant === 'sport' ? -((0.072 * k) ** 2) * 6 : -depth * 0.5;
  const L = 0.14 * k;
  for (const sx of [-1, 1]) {
    const tm2 = metalFrame ? frameMat : frameMat;
    // hinge block
    mesh(roundedBox(0.006, metalFrame ? 0.004 : 0.008, 0.008, 0.0015), tm2, { parent: root, at: [sx * (hx - 0.002), hy, zh - 0.002] });
    const pts = [[sx * hx, hy, zh - 0.004], [sx * hx * 1.02, hy + 0.001, zh - L * 0.5], [sx * hx * 1.0, hy - 0.002, zh - L * 0.82], [sx * hx * 0.97, -lensH + 0.012, zh - L * 0.95], [sx * hx * 0.95, -lensH + 0.0025, zh - L * 1.02]];
    curveTube(pts, metalFrame ? 0.0011 : 0.0024 * (T.chunky ? 1.2 : 1), tm2, { parent: root, segments: 24 });
    if (metalFrame) curveTube(pts.slice(2).map(([x, y, z]) => [x, y, z]), 0.002, M.plastic(T.trim === 'gold' ? '#3a2a1a' : '#1d1d1f', 0.4), { parent: root, segments: 16 });
  }
  return done(root, 'eyewear', variant, o);
}
function variant0(options) {
  const v = String(options.variant ?? options.Variant ?? 'aviator');
  return ['aviator', 'round', 'reading-glasses'].includes(v) ? 'silver' : 'gloss';
}

/* ================================ WRISTWATCH ================================ */

export const WRISTWATCH_VARIANTS = { analog: {}, digital: {}, smartwatch: {}, 'pocket-watch': {}, 'kids-watch': {} };

function dialTex(T, kind) {
  return canvasTex(256, 256, (g, W, H) => {
    const bg = kind === 'kids' ? '#fffbe8' : T.lux ? '#141414' : T.trim === 'vintage' ? '#efe2c4' : T.trim === 'sport' ? '#1b1d22' : '#f6f5f1';
    const fg = T.lux || T.trim === 'sport' ? '#e9d9a6' : '#1d1d1d';
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2);
    g.fillStyle = fg; g.strokeStyle = fg;
    for (let i = 0; i < 60; i++) {
      g.save(); g.rotate((i / 60) * Math.PI * 2);
      if (i % 5 === 0) g.fillRect(-4, -118, 8, kind === 'kids' ? 14 : 22); else g.fillRect(-1, -118, 2, 8);
      g.restore();
    }
    g.font = `bold ${kind === 'kids' ? 30 : 26}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const nums = T.trim === 'vintage' || kind === 'pocket' ? ['XII', 'III', 'VI', 'IX'] : ['12', '3', '6', '9'];
    nums.forEach((n, i) => { const a = (i / 4) * Math.PI * 2 - Math.PI / 2; if (kind === 'kids') g.fillStyle = ['#e8402f', '#2b7de1', '#33c46a', '#f4a01a'][i]; g.fillText(n, Math.cos(a) * 80, Math.sin(a) * 80); });
  });
}

function hands(parent, R, y, T, kind) {
  const hm = T.lux || T.mat === 'gold' ? M.metal('#d6a93c', 0.2) : kind === 'kids' ? M.plastic('#e8402f') : M.metal('#1d1e21', 0.4);
  const g = group('hands', { parent, at: [0, y, 0] });
  mesh(roundedBox(R * 0.08, 0.0008, R * 0.55, 0.0003), hm, { parent: g, at: [0, 0.0004, -R * 0.24], rot: [0, -0.9, 0] }).position.set(-Math.sin(0.9) * R * 0.24 * -1, 0.0004, -Math.cos(0.9) * R * 0.24);
  mesh(roundedBox(R * 0.06, 0.0008, R * 0.8, 0.0003), hm, { parent: g, at: [Math.sin(2.1) * R * 0.36, 0.0012, -Math.cos(2.1) * R * 0.36], rot: [0, -2.1, 0] });
  const sec = group('second-hand', { parent: g, at: [0, 0.002, 0] });
  mesh(roundedBox(R * 0.025, 0.0005, R * 0.9, 0.0002), M.plastic('#d6201a', 0.4), { parent: sec, at: [0, 0, -R * 0.33] });
  mesh(new THREE.CylinderGeometry(R * 0.07, R * 0.07, 0.0026, 16), hm, { parent: g, at: [0, 0.0012, 0] });
  return sec;
}
const tickAnim = (sec) => () => [clip('tick', 60, [rotateTrack(sec, 'y', 60, (t) => -Math.floor(t * 60 + 1e-6) / 60 * Math.PI * 2, 60)])];

export function createWristwatch(options = {}) {
  const { o, variant, T } = setup(options, WRISTWATCH_VARIANTS, 'wristwatch', { p: '#6b3d22', s: '#c9ccd2', a: '#1d1d1d', mat: 'leather' });
  const root = group(`wristwatch-${variant}`);
  const k = T.k * (T.trim === 'kids' ? 1.2 : 1);
  const caseMat = variant === 'kids-watch' && !T.lux ? fin(T, T.trim ? T.s : '#2b7de1', 'plastic') : variant === 'smartwatch' && !T.lux && T.trim !== 'gold' && T.trim !== 'rose-gold' ? M.metal('#2e3036', 0.3) : metalOf(T, 'silver');
  const strapMat = T.trim === 'steel' || T.trim === 'gold' || T.trim === 'rose-gold' ? caseMat : variant === 'kids-watch' && !T.trim ? fin(T, '#ffcc1e', 'rubber') : T.trim === 'sport' || variant === 'smartwatch' && !T.trim ? fin(T, T.trim ? T.s : '#1d1e21', 'rubber') : tm(T, 'p', T.mat === 'plastic' ? 'rubber' : undefined);
  let anim;
  if (variant === 'pocket-watch') {
    const R = 0.024 * k, H = 0.011;
    mesh(lathe([[0, 0], [R * 0.7, 0], [R, H * 0.35], [R * 1.02, H * 0.6], [R * 0.97, H], [0, H]], 48), caseMat, { parent: root });
    const dial = mesh(new THREE.CircleGeometry(R * 0.9, 48), new THREE.MeshStandardMaterial({ name: 'dial', color: '#ffffff', map: dialTex(T, 'pocket'), roughness: 0.3 }), { parent: root, at: [0, H + 0.0003, 0], rot: [-Math.PI / 2, 0, 0] });
    if (!dial.material.map) dial.material.color.set('#f2ead2');
    const sec = hands(root, R * 0.9, H + 0.0004, T, 'pocket');
    anim = tickAnim(sec);
    // crown + bow
    mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.006, 14).rotateX(Math.PI / 2), caseMat, { parent: root, at: [0, H * 0.55, -R - 0.002] });
    ring(0.007, 0.0012, caseMat, { parent: root, at: [0, 0.0013, -R - 0.011], rot: [Math.PI / 2, 0, 0] });
    // open hinged lid standing up behind
    const lid = group('lid', { parent: root, at: [R * 0.98, H, 0] });
    mesh(lathe([[0, 0], [R, 0], [R * 1.0, H * 0.25], [R * 0.75, H * 0.45], [0, H * 0.5]], 48), caseMat, { parent: lid, at: [-R * 0.98, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.008, 10).rotateX(Math.PI / 2), caseMat, { parent: lid });
    lid.rotation.z = -1.75;
    anim = ((a) => () => [...a(), clip('open', 3, [rotateTrack(lid, 'z', 3, (t) => pingPong(t) * 1.6)])])(anim);
    // chain lying on the floor with a T-bar
    curveTube(groundLoop([0, -R - 0.017], [0.07, -R - 0.09], 0.05, 0.0012, 16), 0.0012, caseMat, { parent: root, segments: 64 });
    mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.022, 8).rotateZ(Math.PI / 2), caseMat, { parent: root, at: [0.07, 0.0015, -R - 0.09] });
    return done(root, 'wristwatch', variant, o, anim);
  }
  // strap loop (as if around a wrist) with the case on top, face up
  const round = variant === 'analog' || variant === 'kids-watch';
  const Rc = (variant === 'kids-watch' ? 0.017 : variant === 'smartwatch' ? 0.02 : 0.02) * k * (T.slim ? 0.9 : 1);
  const caseH = (variant === 'smartwatch' ? 0.011 : variant === 'digital' ? 0.012 : 0.009) * (T.chunky ? 1.25 : 1);
  const Rz = 0.034 * k, Ry = 0.028 * k;
  const sw = (variant === 'kids-watch' ? 0.016 : variant === 'digital' ? 0.02 : 0.02) * k * (T.slim ? 0.8 : 1);
  const lugZ = round ? Rc * 0.95 : Rc * 1.2;
  const phi0 = Math.asin(Math.min(0.99, lugZ / Rz));
  const pts = [];
  for (let i = 0; i <= 30; i++) { const ph = phi0 + (i / 30) * (Math.PI * 2 - 2 * phi0); pts.push([0, Ry + Ry * Math.cos(ph), Rz * Math.sin(ph)]); }
  const topY = 2 * Ry;
  const caseY = Ry + Ry * Math.cos(phi0) - 0.002;
  pts.unshift([0, caseY + 0.003, lugZ + 0.004]);
  pts.push([0, caseY + 0.003, -lugZ - 0.004]);
  const st = strap(pts.reverse(), sw, 0.0032 * (T.chunky ? 1.3 : 1), strapMat, { parent: root, segments: 64, name: 'strap' });
  void st; void topY;
  // buckle at the bottom
  mesh(flat(rrPts(sw * 1.25, 0.016, 0.003), 0.002, { holes: [rrPts(sw * 0.95, 0.011, 0.002)] }), T.mat === 'gold' || T.lux ? M.metal('#d6a93c', 0.25) : M.metal('#c9ccd2', 0.25), { parent: root, at: [0, 0.0005, -0.003] });
  if (T.trim === 'steel' || T.trim === 'gold' || T.trim === 'rose-gold') for (let i = 0; i < 18; i++) {
    const ph = phi0 + ((i + 0.5) / 18) * (Math.PI * 2 - 2 * phi0);
    mesh(roundedBox(sw * 1.06, 0.0042, 0.0052, 0.0012), caseMat, { parent: root, at: [0, Ry + Ry * Math.cos(ph), Rz * Math.sin(ph)], rot: [Math.atan2(Ry * Math.sin(ph), Rz * Math.cos(ph)), 0, 0] });
  }
  // case
  const cy = caseY;
  const cg = group('case', { parent: root, at: [0, cy, 0] });
  if (round) {
    mesh(lathe([[0, 0], [Rc * 0.92, 0], [Rc, caseH * 0.3], [Rc * 1.0, caseH * 0.8], [Rc * 0.9, caseH], [0, caseH]], 48), caseMat, { parent: cg });
    if (T.trim === 'sport' || T.rugged) mesh(new THREE.TorusGeometry(Rc * 0.93, Rc * 0.08, 8, 48), fin(T, T.a, 'plastic'), { parent: cg, at: [0, caseH, 0], rot: [Math.PI / 2, 0, 0] });
    for (const sz of [-1, 1]) mesh(roundedBox(sw * 1.02, caseH * 0.5, Rc * 0.5, 0.0015), caseMat, { parent: cg, at: [0, caseH * 0.35, sz * Rc * 0.95] });
    const dial = mesh(new THREE.CircleGeometry(Rc * 0.86, 48), new THREE.MeshStandardMaterial({ name: 'dial', color: '#ffffff', map: dialTex(T, variant === 'kids-watch' ? 'kids' : 'analog'), roughness: 0.3 }), { parent: cg, at: [0, caseH + 0.0003, 0], rot: [-Math.PI / 2, 0, 0] });
    if (!dial.material.map) dial.material.color.set(T.lux ? '#141414' : '#f2f0ea');
    const sec = hands(cg, Rc * 0.86, caseH + 0.0004, T, variant === 'kids-watch' ? 'kids' : 'analog');
    mesh(new THREE.CylinderGeometry(Rc * 0.9, Rc * 0.9, 0.0018, 48), M.glass({ tint: '#eef4f6', opacity: 0.15 }), { parent: cg, at: [0, caseH + 0.0035, 0] });
    anim = tickAnim(sec);
  } else {
    const cw = sw * 1.25, cl = Rc * 2.3;
    mesh(roundedBox(cw, caseH, cl, Math.min(caseH * 0.45, (variant === 'smartwatch' ? 0.008 : 0.004) * T.round)), caseMat, { parent: cg, at: [0, caseH / 2, 0] });
    const isSmart = variant === 'smartwatch';
    const scr = labelPlane(cw * 0.86, cl * 0.84, (g, W, H) => {
      g.fillStyle = isSmart ? '#05070a' : '#b9c4a8'; g.fillRect(0, 0, W, H);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (isSmart) {
        g.strokeStyle = '#ff375f'; g.lineWidth = 14; g.beginPath(); g.arc(W / 2, H * 0.62, W * 0.28, -1.5, 3.2); g.stroke();
        g.strokeStyle = '#30d158'; g.beginPath(); g.arc(W / 2, H * 0.62, W * 0.18, -1.5, 2.2); g.stroke();
        g.fillStyle = '#ffffff'; g.font = `bold ${Math.round(W * 0.2)}px sans-serif`; g.fillText('10:09', W / 2, H * 0.2);
      } else { g.fillStyle = '#1d231a'; g.font = `bold ${Math.round(W * 0.3)}px monospace`; g.fillText('12:45', W / 2, H * 0.55); g.font = `${Math.round(W * 0.12)}px monospace`; g.fillText('MO 24', W / 2, H * 0.2); }
    }, { bg: isSmart ? '#101418' : '#b9c4a8', emissive: isSmart ? 1 : 0, px: 128 });
    scr.name = 'screen';
    scr.rotation.x = -Math.PI / 2;
    scr.position.y = caseH + 0.0003;
    cg.add(scr);
    // buttons / crown
    for (const sz of isSmart ? [0] : [-0.3, 0.3]) mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 12).rotateZ(Math.PI / 2), caseMat, { parent: cg, at: [cw / 2 + 0.0015, caseH * 0.5, sz * cl] });
    if (isSmart) anim = () => [clip('on', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 1], [1.4, 1.4])])];
  }
  if (!round) for (const sz of [-1, 1]) mesh(roundedBox(sw * 1.02, caseH * 0.5, Rc * 0.4, 0.0015), caseMat, { parent: cg, at: [0, caseH * 0.35, sz * Rc * 1.1] });
  if (round) mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 12).rotateZ(Math.PI / 2), caseMat, { parent: cg, at: [Rc + 0.0015, caseH * 0.5, 0] });
  return done(root, 'wristwatch', variant, o, anim);
}

/* ================================ JEWELRY ================================ */

export const JEWELRY_VARIANTS = { ring: {}, necklace: {}, bracelet: {}, earrings: {}, pendant: {}, 'jewelry-box': {}, 'ring-box': {} };

function gemMat(T, color) {
  const c = color ?? (T.trim === 'vintage' ? '#f4ecdf' : T.trim === 'luxury' ? '#eef6ff' : T.trim === 'rose-gold' ? '#f7a8c0' : T.trim === 'silver' ? '#2a5bd7' : T.trim === 'gold' ? '#1f9d55' : '#e8f4ff');
  if (T.trim === 'vintage') return new THREE.MeshPhysicalMaterial({ name: 'pearl', color: c, roughness: 0.25, sheen: 1, sheenColor: new THREE.Color('#ffe9f0'), clearcoat: 1, iridescence: 0.5 });
  return new THREE.MeshPhysicalMaterial({ name: 'gem', color: c, roughness: 0.02, metalness: 0.1, clearcoat: 1, iridescence: 0.3, transmission: 0, flatShading: true });
}
function gemGeo(T, r) {
  if (T.trim === 'vintage') return new THREE.SphereGeometry(r, 20, 14);
  // brilliant cut: crown + pavilion
  return lathe([[0, -r * 1.1], [r, 0], [r * 0.95, r * 0.2], [r * 0.55, r * 0.45], [0, r * 0.45]], 8);
}
const velvet = (T) => fin({ ...T, worn: 0 }, T.trim === 'luxury' ? '#141414' : T.trim === 'vintage' ? '#5b1f2d' : T.trim === 'rose-gold' || T.trim === 'pastel' ? '#e9b9c6' : T.trim === 'silver' ? '#1f2f5a' : '#5b1f4d', 'velvet');

export function createJewelry(options = {}) {
  const { o, variant, T } = setup(options, JEWELRY_VARIANTS, 'jewelry', { p: '#d6a93c', s: '#5b1f4d', a: '#e8f4ff', mat: 'gold' });
  const root = group(`jewelry-${variant}`);
  const mt = metalOf(T, 'gold');
  const k = T.k;
  let anim;
  const ringOn = (parent, at, s = 1, rot = [0, 0, 0]) => {
    const g = group('ring', { parent, at, rot });
    const R = 0.0095 * s, r = 0.0014 * s * (T.chunky ? 1.4 : 1);
    mesh(new THREE.TorusGeometry(R, r, 12, 48), mt, { parent: g, at: [0, R + r, 0] });
    const top = 2 * R + r * 1.6;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; curveTube([[0, top - 0.0012 * s, 0], [Math.cos(a) * 0.0028 * s, top + 0.001 * s, Math.sin(a) * 0.0028 * s], [Math.cos(a) * 0.003 * s, top + 0.0036 * s, Math.sin(a) * 0.003 * s]], 0.00045 * s, mt, { parent: g, segments: 6 }); }
    mesh(gemGeo(T, 0.0034 * s * (T.lux ? 1.3 : 1)), gemMat(T), { parent: g, at: [0, top + 0.0036 * s, 0] });
    if (T.lux) for (const sx of [-1, 1]) mesh(gemGeo(T, 0.0016 * s), gemMat(T), { parent: g, at: [sx * 0.0042 * s, top + 0.0008 * s, 0] });
    return g;
  };
  if (variant === 'ring') {
    ringOn(root, [0, 0, 0], 1.5 * k);
  } else if (variant === 'necklace') {
    // velvet display bust with a necklace and pendant
    const bust = lathe([[0, 0], [0.055, 0], [0.057, 0.01], [0.022, 0.018], [0.018, 0.04], [0.03, 0.07], [0.07, 0.12], [0.098, 0.155], [0.102, 0.166], [0.092, 0.177], [0.045, 0.19], [0.024, 0.198], [0.021, 0.21], [0.021, 0.27], [0.023, 0.278], [0, 0.28]], 48);
    const bm = mesh(bust, velvet(T), { parent: root, scale: [1.15, 1, 0.45], name: 'bust' });
    void bm;
    const pts = [];
    const cz = 0.022, R = 0.05;
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const z = cz - Math.cos(a) * R * 0.95;
      const x = Math.sin(a) * R * 0.6;
      const front = (1 - Math.cos(a)) / 2;
      pts.push([x, 0.2 - front * 0.035, Math.max(z, -0.011 + 0.0)]);
    }
    curveTube(pts, T.chunky ? 0.0016 : 0.0009, mt, { parent: root, segments: 120, closed: true, name: 'chain' });
    const pz = cz + R * 0.95;
    curveTube([[0, 0.165, pz], [0, 0.161, pz + 0.002]], 0.0012, mt, { parent: root, segments: 4 });
    mesh(gemGeo(T, 0.006 * k).rotateX(Math.PI / 2.4), gemMat(T), { parent: root, at: [0, 0.155, pz + 0.003] });
    if (T.trim === 'vintage') for (let i = 1; i < 40; i += 2) { const [x, y, z] = pts[i]; mesh(new THREE.SphereGeometry(0.0032, 10, 8), gemMat(T), { parent: root, at: [x, y, z] }); }
  } else if (variant === 'bracelet') {
    const R = 0.032 * k;
    const bangle = T.trim === 'gold' || T.trim === 'luxury';
    ring(R, bangle ? 0.003 : 0.0018, mt, { parent: root, at: [0, bangle ? 0.003 : 0.0018, 0], rot: [Math.PI / 2, 0, 0], seg: 64 });
    if (bangle) ring(R * 0.92, 0.0025, mt, { parent: root, at: [0.008, 0.0025, 0.004], rot: [Math.PI / 2, 0, 0], seg: 64 });
    // charms / beads lying around the band
    const n = T.trim === 'vintage' ? 18 : 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * (R + (T.trim === 'vintage' ? 0 : 0.006)), z = Math.sin(a) * (R + (T.trim === 'vintage' ? 0 : 0.006));
      if (T.trim === 'vintage') mesh(new THREE.SphereGeometry(0.0042, 12, 10), gemMat(T), { parent: root, at: [x, 0.0042, z] });
      else if (i % 2) mesh(gemGeo(T, 0.0035).rotateX(Math.PI / 2), gemMat(T, ['#e8402f', '#2a5bd7', '#1f9d55'][i % 3]), { parent: root, at: [x, 0.0035, z] });
      else { const hs = new THREE.Shape(); hs.moveTo(0, -0.004); hs.bezierCurveTo(0.006, 0.0, 0.004, 0.005, 0, 0.0025); hs.bezierCurveTo(-0.004, 0.005, -0.006, 0, 0, -0.004); mesh(flat(hs.getPoints(10).map((p) => [p.x, p.y]), 0.0015), mt, { parent: root, at: [x, 0, z], rot: [0, -a - Math.PI / 2, 0] }); }
    }
  } else if (variant === 'earrings') {
    // T-bar display stand with a pair of drop earrings
    const sm = velvet(T);
    mesh(lathe([[0, 0], [0.03, 0], [0.03, 0.006], [0.006, 0.01], [0, 0.01]], 32), sm, { parent: root });
    mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.07, 12), sm, { parent: root, at: [0, 0.045, 0] });
    mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.07, 12).rotateZ(Math.PI / 2), sm, { parent: root, at: [0, 0.081, 0] });
    for (const sx of [-1, 1]) {
      const x = sx * 0.022;
      curveTube([[x, 0.081, 0.0045], [x, 0.0855, 0.0], [x, 0.081, -0.0045], [x, 0.074, -0.002], [x, 0.069, 0]], 0.0006, mt, { parent: root, segments: 16 });
      if (T.trim === 'gold' || T.trim === 'luxury') mesh(new THREE.TorusGeometry(0.009, 0.0012, 8, 32), mt, { parent: root, at: [x, 0.06, 0] });
      else {
        mesh(new THREE.SphereGeometry(0.0015, 10, 8), mt, { parent: root, at: [x, 0.0685, 0] });
        const drop = T.trim === 'vintage' ? new THREE.SphereGeometry(0.005, 16, 12) : gemGeo(T, 0.0045).rotateX(Math.PI);
        mesh(drop, gemMat(T), { parent: root, at: [x, 0.063, 0], scale: T.trim === 'vintage' ? [1, 1.25, 1] : [1, 1.6, 1] });
      }
    }
  } else if (variant === 'pendant') {
    const R = 0.05 * k;
    const pts = groundLoop([0, 0], [0.0001, 0.0001], 0, 0.0009, 4);
    void pts;
    const loop = [];
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const r = R * (1 - 0.35 * Math.max(0, Math.sin(a)) ** 3); loop.push([Math.cos(a) * r * 0.8, 0.0009, -Math.sin(a) * r - R * 0.0]); }
    curveTube(loop, 0.0009, mt, { parent: root, segments: 100, closed: true });
    const pz = R;
    mesh(new THREE.TorusGeometry(0.0025, 0.0007, 6, 14), mt, { parent: root, at: [0, 0.0009, pz + 0.002], rot: [Math.PI / 2, 0, 0] });
    if (T.trim === 'silver' || T.trim === 'rose-gold') {
      const hs = new THREE.Shape(); hs.moveTo(0, -0.012); hs.bezierCurveTo(0.016, 0.0, 0.01, 0.012, 0, 0.006); hs.bezierCurveTo(-0.01, 0.012, -0.016, 0, 0, -0.012);
      mesh(flat(hs.getPoints(16).map((p) => [p.x, -p.y]), 0.003, { bevel: 0.0009 }), mt, { parent: root, at: [0, 0, pz + 0.014] });
    } else {
      mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.0025, 32), mt, { parent: root, at: [0, 0.00125, pz + 0.015] });
      mesh(gemGeo(T, 0.006 * (T.lux ? 1.2 : 1)), gemMat(T), { parent: root, at: [0, 0.0025 + 0.0066 * (T.lux ? 1.2 : 1), pz + 0.015] });
    }
  } else {
    // jewelry-box / ring-box: velvet-lined box with a hinged lid
    const big = variant === 'jewelry-box';
    const W = (big ? 0.2 : 0.055) * k * (big ? T.w : 1), D = (big ? 0.13 : 0.05) * k, H = (big ? 0.07 : 0.03) * k;
    const shellMat = big ? (T.trim === 'vintage' ? M.wood('walnut') : T.trim === 'luxury' ? fin(T, '#141414', 'leather') : T.trim === 'silver' ? fin(T, '#cfd2d8', 'silver') : T.trim === 'gold' ? fin(T, '#7a1426', 'leather') : fin(T, '#f1d2dc', 'leather')) : velvet(T);
    const lin = velvet({ ...T, trim: T.trim === 'luxury' ? 'vintage' : T.trim });
    const box = group('box', { parent: root });
    mesh(roundedBox(W, H, D, Math.min(0.006 * T.round, H * 0.2)), shellMat, { parent: box, at: [0, H / 2, 0] });
    // recessed velvet top: the box body is a block with a velvet tray inset (top face)
    mesh(roundedBox(W - 0.008, 0.002, D - 0.008, 0.0008), lin, { parent: box, at: [0, H + 0.0006, 0] });
    if (big) {
      // dividers and ring rolls
      for (const x of [-W * 0.15, W * 0.15]) mesh(roundedBox(0.003, 0.012, D - 0.01, 0.001), shellMat, { parent: box, at: [x, H + 0.006, 0] });
      for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.006, 0.006, W * 0.26, 16).rotateZ(Math.PI / 2), lin, { parent: box, at: [-W * 0.33, H + 0.006, -D * 0.36 + i * 0.016 * k / k] });
      ringOn(box, [-W * 0.33, H + 0.003, -D * 0.36 + 0.008], 0.8, [0, 0, 0]);
      mesh(gemGeo(T, 0.006).rotateX(Math.PI / 2), gemMat(T), { parent: box, at: [W * 0.32, H + 0.007, 0] });
      curveTube(groundLoop([0.0, -0.03], [0.0, 0.03], 0.02, H + 0.0025, 12).map(([x, y, z]) => [x, y, z]), 0.001, mt, { parent: box, segments: 40 });
    } else {
      // slit cushion with the ring standing in it
      mesh(cushion(W - 0.01, 0.012, D - 0.012, { radius: 0.004, bulge: 0.3 }), lin, { parent: box, at: [0, H + 0.004, 0] });
      ringOn(box, [0, H + 0.004, 0.0], 1.0);
    }
    // lid hinged at the back edge, opened up
    const hinge = group('lid', { parent: root, at: [0, H, -D / 2] });
    const lh = big ? 0.03 * k : 0.018 * k;
    const lidG = group('lid-body', { parent: hinge, rot: [-1.85, 0, 0] });
    mesh(roundedBox(W, lh, D, Math.min(0.006 * T.round, lh * 0.3)), shellMat, { parent: lidG, at: [0, lh / 2, D / 2] });
    mesh(roundedBox(W - 0.01, 0.0015, D - 0.01, 0.0006), big ? M.chrome() : lin, { parent: lidG, at: [0, -0.0004, D / 2] });
    if (big && T.detail) mesh(roundedBox(0.02, 0.006, 0.004, 0.0015), mt, { parent: box, at: [0, H * 0.8, D / 2 + 0.0015] });
    anim = () => [clip('open', 3, [rotateTrack(lidG, 'x', 3, (t) => pingPong(t) * 1.75)])];
  }
  return done(root, 'jewelry', variant, o, anim);
}

export { moveTrack };
