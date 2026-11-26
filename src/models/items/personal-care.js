// Personal items: toiletries (toothbrush, toothpaste, razor, soap, shampoo, deodorant) and
// beauty (perfume, lipstick, makeup kit, nail polish, hairbrush, comb, hand mirror).
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, setup, done, fin, tm, vessel, clip, rotateTrack, moveTrack, pingPong, labelPlane, textDraw } from './common.js';
import { rrPts, circlePts, flat } from './personal-util.js';

/** Material helpers honouring the care trims: bamboo/wooden → wood, luxury → black+gold, kids → bright plastic. */
const bodyM = (T, c = T.p) => (T.mat === 'wood' ? fin(T, T.p, 'wood') : T.lux ? fin(T, '#141414', 'gloss') : fin(T, c, T.mat === 'leather' ? 'gloss' : T.mat === 'metal' || T.mat === 'rosegold' || T.mat === 'gold' ? T.mat : 'plastic'));
const capM = (T) => (T.lux ? M.metal('#d6a93c', 0.2) : T.mat === 'wood' ? fin(T, T.s, 'wood') : T.mat === 'rosegold' ? M.metal('#d9967f', 0.22) : fin(T, T.s, 'plastic'));

/** Label wrapped as a partial cylinder band (bottles). */
function bandLabel(parent, r, h, y, lines, T, { bg = '#ffffff', fg = '#1d1d1d', arc = Math.PI * 0.9 } = {}) {
  const lp = labelPlane(1, 1, textDraw(lines, { bg, fg }), { bg, px: 256 });
  lp.geometry = new THREE.CylinderGeometry(r, r, h, 24, 1, true, -arc / 2, arc);
  lp.position.y = y;
  parent.add(lp);
  return lp;
}

/* ================================ TOILETRIES ================================ */

export const TOILETRIES_VARIANTS = { toothbrush: {}, 'toothbrush-cup': {}, toothpaste: {}, razor: {}, 'soap-bar': {}, 'shampoo-bottle': {}, deodorant: {} };

/** Toothbrush lying on its back along +x, bristles up. Returns group (origin at handle end on floor). */
function toothbrush(parent, T, { at = [0, 0, 0], rot = [0, 0, 0], color } = {}) {
  const g = group('toothbrush', { parent, at, rot });
  const wood = T.mat === 'wood';
  const c = color ?? T.p;
  const hm = wood ? fin(T, '#d1b072', 'wood') : fin(T, c, 'plastic');
  const L = 0.13 * (T.trim === 'travel' ? 0.75 : 1), r = 0.0062 * (T.chunky ? 1.35 : 1) * (T.slim ? 0.85 : 1);
  mesh(new THREE.CapsuleGeometry(r, L, 6, 16).rotateZ(Math.PI / 2), hm, { parent: g, at: [L / 2 + r, r, 0], scale: [1, 0.8, 1.15] });
  if (!wood) mesh(new THREE.CapsuleGeometry(r * 1.03, L * 0.35, 6, 16).rotateZ(Math.PI / 2), fin(T, T.trim === 'luxury' ? '#d6a93c' : T.s, 'rubber'), { parent: g, at: [L * 0.35, r, 0], scale: [1, 0.78, 1.12] });
  // neck + head
  mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.8, 0.03, 12).rotateZ(Math.PI / 2), hm, { parent: g, at: [L + r * 2 + 0.012, r * 0.8, 0] });
  const hx = L + r * 2 + 0.04;
  mesh(roundedBox(0.03, 0.006, 0.012 * (T.chunky ? 1.2 : 1), 0.0025), hm, { parent: g, at: [hx, r * 0.75, 0] });
  // bristle tufts
  const bm = fin({ ...T, worn: 0 }, T.trim === 'kids' ? '#ff7aa8' : wood ? '#3a2f26' : '#f4f6f8', 'plastic');
  const bm2 = fin({ ...T, worn: 0 }, T.trim === 'kids' ? '#3fb6ff' : '#3fa0e8', 'plastic');
  for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) mesh(new THREE.CylinderGeometry(0.0019, 0.0017, 0.009, 7), i > 1 && i < 5 && j === 1 ? bm2 : bm, { parent: g, at: [hx - 0.0115 + i * 0.0038, r * 0.75 + 0.0072, (j - 1) * 0.0036] });
  return g;
}

export function createToiletries(options = {}) {
  const { o, variant, T } = setup(options, TOILETRIES_VARIANTS, 'toiletries', { p: '#2a7fd0', s: '#f4f6f8', a: '#e8402f', mat: 'plastic' });
  const root = group(`toiletries-${variant}`);
  const k = T.k;
  let anim;
  if (variant === 'toothbrush') {
    toothbrush(root, T, { at: [-0.08, 0, 0] });
  } else if (variant === 'toothbrush-cup') {
    const r = 0.034 * k, H = 0.1 * k * T.h;
    const cupM = T.mat === 'wood' ? fin(T, '#c9a46a', 'wood') : T.lux ? fin(T, '#141414', 'ceramic') : fin(T, T.trim === 'kids' ? '#ffcc1e' : T.trim === 'travel' ? '#9db8cf' : '#f1ede4', T.trim === 'travel' ? 'plastic' : 'ceramic');
    mesh(vessel([[r * 0.85, 0], [r * 0.95, 0.004], [r, H * 0.5], [r * 1.06, H]], 0.003, 0.006, 40), cupM, { parent: root, name: 'cup' });
    if (T.lux) mesh(new THREE.TorusGeometry(r * 1.06, 0.0018, 8, 40), M.metal('#d6a93c', 0.2), { parent: root, at: [0, H, 0], rot: [Math.PI / 2, 0, 0] });
    // two brushes leaning on opposite rim points, handle ends on the floor of the cup
    const cols = [T.p, T.a];
    [1, -1].forEach((sd, i) => {
      const g = group('brush', { parent: root, at: [-sd * r * 0.45, 0.006, sd * 0.004], rot: [0, sd > 0 ? 0.15 : Math.PI + 0.15, 0] });
      toothbrush(g, T, { rot: [0, 0, Math.PI / 2 - 0.4], color: cols[i] });
    });
  } else if (variant === 'toothpaste') {
    const L = 0.16 * k, r = 0.017 * k * (T.chunky ? 1.2 : 1);
    const g = new THREE.CylinderGeometry(r, r, L, 32, 24).rotateZ(Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / L + 0.5; // 0 cap end … 1 crimp end
      const f = Math.max(0, (x - 0.2) / 0.8) ** 1.2;
      const y = p.getY(i), z = p.getZ(i);
      const dent = T.worn ? 1 - 0.25 * Math.sin(x * 9) ** 2 * T.worn : 1;
      p.setY(i, y * (1 - 0.88 * f) * dent);
      p.setZ(i, z * (1 + 0.45 * f));
    }
    g.computeVertexNormals();
    const tube = mesh(g, bodyM(T, T.trim ? T.p : '#f4f6f8'), { parent: root, at: [0, r * 0.98, 0], name: 'tube' });
    void tube;
    mesh(roundedBox(0.012, r * 0.3, r * 2.9, 0.001), bodyM(T, T.trim ? T.p : '#f4f6f8'), { parent: root, at: [L / 2 + 0.002, r * 0.98, 0] });
    // stripe band + cap
    const band = new THREE.CylinderGeometry(r * 1.002, r * 1.002, L * 0.2, 32, 1, true).rotateZ(Math.PI / 2);
    mesh(band, fin(T, T.trim === 'kids' ? '#ff4d6d' : T.a, 'plastic'), { parent: root, at: [-L * 0.32, r * 0.98, 0] });
    mesh(lathe([[r * 0.99, 0], [r * 0.55, 0.008], [r * 0.4, 0.012], [0, 0.012]], 32).rotateZ(Math.PI / 2), bodyM(T, T.trim ? T.p : '#f4f6f8'), { parent: root, at: [-L / 2, r * 0.98, 0] });
    const capR = r * (T.trim === 'modern' ? 0.85 : 0.6), capL = T.trim === 'modern' ? 0.02 : 0.016;
    mesh(new THREE.CylinderGeometry(capR, capR, capL, 24).rotateZ(Math.PI / 2), capM(T), { parent: root, at: [-L / 2 - 0.012 - capL / 2 + 0.002, r * 0.98, 0] });
  } else if (variant === 'razor') {
    const hm = bodyM(T, T.trim ? T.p : '#2a7fd0');
    const L = 0.12 * k;
    const hr = 0.0065 * (T.chunky ? 1.3 : 1) * (T.lux ? 1.15 : 1);
    curveTube([[0, hr, 0], [L * 0.4, hr * 1.15, 0], [L * 0.8, hr * 1.4, 0], [L, hr * 2.2, 0]], hr, hm, { parent: root, segments: 24 });
    if (!T.lux && T.mat !== 'wood') curveTube([[L * 0.15, hr * 1.3, 0], [L * 0.45, hr * 1.5, 0]], hr * 0.9, fin(T, T.s, 'rubber'), { parent: root, segments: 10 });
    const head = group('head', { parent: root, at: [L + 0.004, hr * 2.6, 0], rot: [0, 0, 0.35] });
    mesh(roundedBox(0.012, 0.012, 0.042, 0.004), T.lux ? M.metal('#d6a93c', 0.2) : fin(T, '#e9eef2', 'plastic'), { parent: head });
    for (let i = 0; i < 4; i++) mesh(roundedBox(0.0012, 0.0006, 0.036, 0.0002), M.chrome(), { parent: head, at: [-0.003 + i * 0.002, 0.0062, 0] });
    mesh(roundedBox(0.003, 0.0012, 0.036, 0.0004), fin(T, '#33c46a', 'plastic'), { parent: head, at: [0.0045, 0.0062, 0] });
  } else if (variant === 'soap-bar') {
    const W = 0.09 * k * T.w, D = 0.06 * k;
    const dishM = T.mat === 'wood' ? fin(T, '#a5733f', 'wood') : T.lux ? fin(T, '#141414', 'ceramic') : fin(T, T.trim === 'kids' ? '#3fb6ff' : '#f1ede4', 'ceramic');
    // shallow oval dish (hollow) on four feet when wooden: slats
    if (T.mat === 'wood') {
      for (let i = 0; i < 6; i++) mesh(roundedBox(W * 1.25, 0.008, 0.01, 0.002), dishM, { parent: root, at: [0, 0.012, -D * 0.6 + i * D * 0.24] });
      for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.01, D * 1.35, 0.002), dishM, { parent: root, at: [s * W * 0.5, 0.005, 0] });
    } else {
      const dg = vessel([[W * 0.45, 0], [W * 0.62, 0.006], [W * 0.7, 0.018]], 0.003, 0.004, 40);
      mesh(dg, dishM, { parent: root, scale: [1, 1, D / W * 1.15] });
    }
    const sy = T.mat === 'wood' ? 0.016 : 0.004;
    const soapC = T.trim === 'kids' ? '#ffcc1e' : T.lux ? '#f2e8d4' : T.trim === 'modern' ? '#e9eef2' : T.trim === 'travel' ? '#f2b8c8' : T.p === '#2a7fd0' ? '#a8d8c8' : T.p;
    const sh = 0.025 * (T.slim ? 0.7 : 1) * (1 - T.worn * 0.4);
    mesh(cushion(W * 0.92, sh, D * 0.95, { radius: sh * 0.45 * T.round, bulge: 0.35 }), new THREE.MeshPhysicalMaterial({ name: 'soap', color: soapC, roughness: 0.4, sheen: 0.5, clearcoat: 0.3 }), { parent: root, at: [0, sy + sh / 2, 0] });
    if (T.trim !== 'kids') {
      const lab = labelPlane(W * 0.5, D * 0.3, textDraw(['SOAP'], { bg: soapC, fg: '#7a8a80' }), { bg: soapC });
      lab.rotation.x = -Math.PI / 2; lab.position.set(0, sy + sh + sh * 0.18 * 0.5 + 0.0012, 0); root.add(lab);
    }
  } else if (variant === 'shampoo-bottle' || variant === 'deodorant') {
    const sham = variant === 'shampoo-bottle';
    const H = (sham ? 0.2 : 0.11) * k * T.h * (T.trim === 'travel' ? 0.6 / 0.75 : 1);
    const r = (sham ? 0.035 : 0.022) * k * T.w;
    const bm = bodyM(T, T.trim ? T.p : sham ? '#2a9d8f' : '#f4f6f8');
    const prof = sham ? (T.trim === 'modern' ? [[0, 0], [r, 0], [r, H * 0.85], [r * 0.45, H * 0.93], [r * 0.4, H], [0, H]] : [[0, 0], [r * 0.9, 0], [r, H * 0.08], [r * 1.05, H * 0.5], [r * 0.85, H * 0.82], [r * 0.4, H * 0.94], [r * 0.38, H], [0, H]]) : [[0, 0], [r, 0], [r, H * 0.62], [0, H * 0.62]];
    const body = mesh(lathe(prof, 40), bm, { parent: root, scale: [1, 1, sham ? 0.62 : 0.6], name: 'bottle' });
    void body;
    if (sham) {
      if (T.lux || T.trim === 'modern') {
        // pump
        const pm = capM(T);
        mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, 0.016, 20), pm, { parent: root, at: [0, H + 0.008, 0] });
        mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 10), pm, { parent: root, at: [0, H + 0.026, 0] });
        mesh(roundedBox(0.035, 0.01, 0.014, 0.004), pm, { parent: root, at: [0.01, H + 0.04, 0] });
      } else {
        // flip cap
        mesh(lathe([[0, 0], [r * 0.48, 0], [r * 0.5, 0.022], [r * 0.3, 0.028], [0, 0.028]], 24), capM(T), { parent: root, at: [0, H - 0.002, 0], scale: [1.4, 1, 0.9] });
      }
      bandLabel(root, r * 1.02 * 0.62, H * 0.35, H * 0.42, [T.lux ? 'LUXE' : 'SHAMPOO', 'repair & shine'], T, { bg: T.lux ? '#141414' : '#fbfaf6', fg: T.lux ? '#d6a93c' : '#2a5a5a' }).scale.set(1 / 0.62 * 1.0, 1, 1);
    } else {
      // deodorant stick: oval cap dome on top + base twist dial
      const cm = capM(T);
      mesh(lathe([[0, 0], [r * 1.01, 0], [r * 1.01, H * 0.32], [r * 0.85, H * 0.37], [0, H * 0.39]], 40), cm, { parent: root, at: [0, H * 0.61, 0], scale: [1, 1, 0.6], name: 'cap' });
      mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.006, 24), cm, { parent: root, at: [0, -0.0, 0], scale: [1, 1, 0.6] }).position.y = 0.003;
      bandLabel(root, r * 1.003, H * 0.3, H * 0.3, ['FRESH', '48h'], T, { bg: T.trim === 'kids' ? '#ffcc1e' : '#fbfaf6', fg: '#2a5bd7', arc: Math.PI * 0.6 }).scale.set(1, 1, 0.6);
      anim = () => { const c = root.getObjectByName('cap'); return [clip('open', 3, [moveTrack(c, 3, (t) => [0, pingPong(t) * 0.04, 0])])]; };
    }
  }
  return done(root, 'toiletries', variant, o, anim);
}

/* ================================ BEAUTY ================================ */

export const BEAUTY_VARIANTS = { perfume: {}, lipstick: {}, 'makeup-kit': {}, 'nail-polish': {}, hairbrush: {}, comb: {}, 'hand-mirror': {} };

export function createBeauty(options = {}) {
  const { o, variant, T } = setup(options, BEAUTY_VARIANTS, 'beauty', { p: '#c2304a', s: '#141414', a: '#d6a93c', mat: 'gloss' });
  const root = group(`beauty-${variant}`);
  const k = T.k;
  const gold = T.mat === 'rosegold' ? M.metal('#d9967f', 0.22) : T.trim === 'vintage' ? M.metal('#b8913f', 0.35) : T.mat === 'wood' ? fin(T, T.p, 'wood') : M.metal('#d6a93c', 0.2);
  const shell = T.lux ? fin(T, '#141414', 'gloss') : T.mat === 'wood' ? fin(T, T.p, 'wood') : T.trim === 'kids' ? fin(T, T.p, 'plastic') : T.trim === 'pastel' ? fin(T, T.p, 'gloss') : T.mat === 'rosegold' ? M.metal('#d9967f', 0.22) : T.trim === 'vintage' ? M.metal('#b8913f', 0.35) : fin(T, '#141414', 'gloss');
  let anim;
  if (variant === 'perfume' || variant === 'nail-polish') {
    const np = variant === 'nail-polish';
    const s = k * (np ? 0.45 : 1);
    const liquid = new THREE.MeshPhysicalMaterial({ name: 'liquid', color: np ? (T.trim ? T.p : '#c2304a') : T.trim === 'pastel' ? '#f6c9d6' : T.lux ? '#2a1a10' : '#f2b84a', roughness: 0.1, transmission: 0, clearcoat: 1, transparent: true, opacity: 0.92 });
    const gl = M.glass({ tint: '#f4f8f8', opacity: 0.32 });
    const W = 0.07 * s * T.w, H = 0.085 * s * T.h, D = 0.035 * s;
    const shape = T.trim === 'vintage' || T.trim === 'rose-gold' ? 'round' : T.lux ? 'facet' : T.trim === 'kids' ? 'ball' : 'flacon';
    if (shape === 'round' || shape === 'ball') {
      const R = (shape === 'ball' ? 0.034 : 0.04) * s;
      mesh(new THREE.SphereGeometry(R, 32, 20), gl, { parent: root, at: [0, R, 0], scale: [1, 0.95, shape === 'ball' ? 1 : 0.6] });
      mesh(new THREE.SphereGeometry(R * 0.86, 24, 16, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7), liquid, { parent: root, at: [0, R, 0], scale: [1, 0.95, shape === 'ball' ? 1 : 0.6] });
      var topY = R * 1.9;
    } else if (shape === 'facet') {
      mesh(new THREE.CylinderGeometry(W * 0.55, W * 0.6, H, 6), gl, { parent: root, at: [0, H / 2, 0], scale: [1, 1, 0.6] });
      mesh(new THREE.CylinderGeometry(W * 0.48, W * 0.53, H * 0.82, 6), liquid, { parent: root, at: [0, H * 0.45, 0], scale: [1, 1, 0.6] });
      topY = H;
    } else {
      mesh(roundedBox(W, H, D, Math.min(D * 0.45, 0.008 * T.round)), gl, { parent: root, at: [0, H / 2, 0] });
      mesh(roundedBox(W * 0.88, H * 0.8, D * 0.78, Math.min(D * 0.35, 0.006 * T.round)), liquid, { parent: root, at: [0, H * 0.44, 0] });
      topY = H;
    }
    // neck + cap
    mesh(new THREE.CylinderGeometry(0.006 * s / (np ? 0.6 : 1), 0.007 * s / (np ? 0.6 : 1), 0.008 * s, 16), gold, { parent: root, at: [0, topY + 0.004 * s, 0] });
    const capH = np ? 0.03 * k : (T.lux ? 0.035 : 0.028) * s;
    const capY = topY + 0.008 * s;
    const cap = group('cap', { parent: root, at: [0, capY, 0] });
    if (np) mesh(new THREE.CylinderGeometry(0.007 * k, 0.0075 * k, capH, 20), shell, { parent: cap, at: [0, capH / 2, 0] });
    else if (T.trim === 'vintage') {
      // atomizer bulb on a tube
      mesh(new THREE.CylinderGeometry(0.008 * s, 0.008 * s, 0.014 * s, 16), gold, { parent: cap, at: [0, 0.007 * s, 0] });
      curveTube([[0.008 * s, 0.01 * s, 0], [0.03 * s, 0.012 * s, 0], [0.045 * s, -0.01 * s, 0]], 0.0018, fin(T, '#3a2a1a', 'fabric'), { parent: cap, segments: 12 });
      mesh(new THREE.SphereGeometry(0.012 * s, 16, 12), fin(T, '#7a1426', 'velvet'), { parent: cap, at: [0.05 * s, -0.018 * s, 0], scale: [1, 1.3, 1] });
      for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.0035, 0.0012, 6, 12), gold, { parent: cap, at: [0.05 * s, -0.04 * s + i * 0.002, 0], rot: [Math.PI / 2, 0, 0] });
    } else if (T.mat === 'wood') mesh(roundedBox(0.03 * s, capH, 0.03 * s, 0.004), shell, { parent: cap, at: [0, capH / 2, 0] });
    else if (T.trim === 'kids') mesh(new THREE.SphereGeometry(0.014 * s, 20, 14), fin(T, T.a, 'plastic'), { parent: cap, at: [0, 0.012 * s, 0] });
    else mesh(lathe([[0, 0], [0.016 * s, 0], [0.018 * s, capH * 0.6], [0.012 * s, capH], [0, capH]], 6), shell, { parent: cap });
    if (!np) {
      const lab = labelPlane(W * 0.5, H * 0.18, textDraw(['PARFUM'], { bg: '#f3e9d2', fg: '#3a2a1a' }), { bg: '#f3e9d2' });
      lab.position.set(0, (shape === 'flacon' || shape === 'facet') ? H * 0.5 : 0.04 * s, (shape === 'flacon' ? D / 2 : shape === 'facet' ? W * 0.58 * 0.6 * 0.87 : 0.04 * s * 0.6) + 0.0006);
      if (shape === 'flacon') root.add(lab);
    } else {
      mesh(new THREE.CylinderGeometry(0.0012, 0.0006, 0.022, 6), fin(T, '#dddddd', 'plastic'), { parent: root, at: [0, topY - 0.008, 0] });
    }
  } else if (variant === 'lipstick') {
    const r = 0.0095 * k * (T.chunky ? 1.2 : 1) * (T.slim ? 0.85 : 1);
    const H = 0.05 * k * T.h;
    const sq = T.lux || T.trim === 'kids' ? 4 : 32;
    mesh(new THREE.CylinderGeometry(r, r, H * 0.55, sq).rotateY(Math.PI / 4), shell, { parent: root, at: [0, H * 0.275, 0] });
    mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, H * 0.2, 24), gold, { parent: root, at: [0, H * 0.55 + H * 0.1 - 0.001, 0] });
    const bullet = group('bullet', { parent: root, at: [0, H * 0.65, 0] });
    const bg = new THREE.CylinderGeometry(r * 0.62, r * 0.62, H * 0.42, 24, 6);
    const bp = bg.attributes.position;
    for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); if (y > 0) bp.setY(i, Math.min(y, H * 0.21 - (bp.getX(i) + r * 0.62) * 0.9)); }
    bg.computeVertexNormals();
    const lipC = T.trim === 'pastel' ? '#f08fb2' : T.trim === 'vintage' ? '#8a1426' : T.trim === 'kids' ? '#ff4d6d' : T.mat === 'wood' ? '#b5524a' : T.p;
    mesh(bg, new THREE.MeshPhysicalMaterial({ name: 'lipstick', color: lipC, roughness: 0.3, clearcoat: 0.8 }), { parent: bullet, at: [0, H * 0.21 - 0.004, 0] });
    // cap lying beside
    mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, H * 0.6, sq).rotateY(Math.PI / 4).rotateZ(Math.PI / 2), shell, { parent: root, at: [r * 2.6, r * 1.02 * (sq === 4 ? 0.72 : 1), H * 0.15] });
    anim = () => [clip('twist', 3, [moveTrack(bullet, 3, (t) => [0, (pingPong(t) - 1) * H * 0.3, 0])])];
  } else if (variant === 'makeup-kit') {
    const W = 0.12 * k * T.w, D = 0.08 * k, H = 0.012 * (T.chunky ? 1.4 : 1);
    const round = T.trim === 'vintage' || T.trim === 'rose-gold';
    const baseGeo = round ? new THREE.CylinderGeometry(D * 0.55, D * 0.55, H, 48) : roundedBox(W, H, D, Math.min(H * 0.45, 0.006 * T.round));
    mesh(baseGeo, shell, { parent: root, at: [0, H / 2, 0] });
    const pans = round ? [[0, 0]] : [];
    if (!round) for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) pans.push([(-1.5 + i) * W * 0.22, (j - 0.5) * D * 0.42]);
    const shades = T.trim === 'pastel' ? ['#f6c9d6', '#c9e6f6', '#e8f6c9', '#f6e3c9', '#e0c9f6', '#c9f6e8', '#f6f0c9', '#f6d0c9'] : T.trim === 'kids' ? ['#ff4d6d', '#ffcc1e', '#2b7de1', '#33c46a', '#ff7aa8', '#8a3fd0', '#ff8a1e', '#3fd0c8'] : ['#e8c3a8', '#c98a68', '#8a5a3c', '#4a2c1e', '#d9a0a0', '#b0607a', '#c9b08a', '#2a2a2e'];
    pans.forEach(([x, z], i) => {
      const pr = round ? D * 0.44 : Math.min(W * 0.095, D * 0.19);
      mesh(new THREE.CylinderGeometry(pr * 1.06, pr * 1.06, 0.0022, 24), gold, { parent: root, at: [x, H + 0.0006, z] });
      mesh(new THREE.CylinderGeometry(pr, pr, 0.0024, 24), new THREE.MeshStandardMaterial({ name: 'powder', color: shades[i % shades.length], roughness: 0.95 }), { parent: root, at: [x, H + 0.0012, z] });
    });
    const hinge = group('lid', { parent: root, at: [0, H, -(round ? D * 0.55 : D / 2)] });
    const lidG = group('lid-body', { parent: hinge, rot: [-1.9, 0, 0] });
    const lidGeo = round ? new THREE.CylinderGeometry(D * 0.55, D * 0.55, H * 0.6, 48) : roundedBox(W, H * 0.6, D, Math.min(H * 0.28, 0.005 * T.round));
    mesh(lidGeo, shell, { parent: lidG, at: [0, H * 0.3, round ? D * 0.55 : D / 2] });
    const mir = round ? new THREE.CircleGeometry(D * 0.5, 40) : new THREE.PlaneGeometry(W * 0.88, D * 0.84);
    mesh(mir, M.chrome(), { parent: lidG, at: [0, -0.0004, round ? D * 0.55 : D / 2], rot: [Math.PI / 2, 0, 0] });
    if (!round) mesh(roundedBox(0.012, 0.004, 0.06 * k, 0.0015), fin(T, '#e8d8c8', 'fabric'), { parent: root, at: [W * 0.62, 0.002, 0] });
    anim = () => [clip('open', 3, [rotateTrack(lidG, 'x', 3, (t) => pingPong(t) * 1.8)])];
  } else if (variant === 'hairbrush') {
    const L = 0.23 * k, PW = 0.07 * k * T.w * (T.slim ? 0.7 : 1), PL = 0.1 * k;
    const bm = T.mat === 'wood' ? fin(T, T.p, 'wood') : shell;
    const hw2 = 0.022 * k * (T.slim ? 0.8 : 1);
    mesh(cushion(L - PL * 0.6, 0.016, hw2, { radius: 0.007, bulge: 0.2 }), bm, { parent: root, at: [-(PL * 0.3), 0.008, 0] });
    mesh(new THREE.CylinderGeometry(PW / 2, PW / 2, 0.018, 40), bm, { parent: root, at: [L / 2 - PL / 2, 0.009, 0], scale: [PL / PW, 1, 1] });
    // cushion pad + pins with ball tips (instanced)
    mesh(new THREE.CylinderGeometry(PW * 0.44, PW * 0.44, 0.006, 32), fin(T, T.trim === 'kids' ? '#3fb6ff' : '#1d1d1f', 'rubber'), { parent: root, at: [L / 2 - PL / 2, 0.021, 0], scale: [PL / PW, 1, 1] });
    const pins = [];
    for (let i = -5; i <= 5; i++) for (let j = -3; j <= 3; j++) { const x = i / 5, z = j / 3; if (x * x + z * z < 0.92) pins.push([L / 2 - PL / 2 + x * PL * 0.4, z * PW * 0.38]); }
    const pinM = T.mat === 'wood' ? fin(T, '#d1b072', 'wood') : fin(T, '#2a2b2e', 'plastic');
    const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.016, 5), pinM, pins.length);
    const tip = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0018, 6, 4), pinM, pins.length);
    const m = new THREE.Matrix4();
    pins.forEach(([x, z], i) => { m.makeTranslation(x, 0.032, z); im.setMatrixAt(i, m); m.makeTranslation(x, 0.041, z); tip.setMatrixAt(i, m); });
    im.name = 'bristles'; tip.name = 'bristle-tips';
    root.add(im, tip);
  } else if (variant === 'comb') {
    const L = 0.18 * k * T.w, Hh = 0.012 * (T.chunky ? 1.4 : 1), teeth = 0.022 * k;
    const pts = [[-L / 2, 0], [-L / 2, Hh]];
    const n = Math.round((T.chunky ? 22 : 34) * k);
    for (let i = 0; i < n; i++) {
      const x0 = -L / 2 + 0.004 + (i / n) * (L - 0.008), w = (L - 0.008) / n;
      const tl = teeth * (i < n * 0.45 ? 1 : 0.85);
      pts.push([x0, Hh], [x0 + w * 0.15, Hh + tl], [x0 + w * 0.5, Hh + tl], [x0 + w * 0.6, Hh]);
    }
    pts.push([L / 2, Hh], [L / 2, 0]);
    const cm = T.mat === 'wood' ? fin(T, T.p, 'wood') : T.lux ? fin(T, '#141414', 'gloss') : T.mat === 'rosegold' ? M.metal('#d9967f', 0.22) : fin(T, T.trim === 'kids' ? T.p : T.trim === 'pastel' ? T.p : T.trim === 'vintage' ? '#6a4a2a' : '#1d1d1f', T.trim === 'vintage' ? 'gloss' : 'plastic');
    mesh(flat(pts.map(([x, y]) => [x, y]), 0.003, { bevel: 0.0006 }), cm, { parent: root });
  } else if (variant === 'hand-mirror') {
    const R = 0.065 * k * (T.trim === 'kids' ? 0.85 : 1);
    const fm = T.mat === 'wood' ? fin(T, T.p, 'wood') : shell;
    const oval = T.trim === 'vintage' || T.trim === 'luxury' ? 1.3 : 1;
    mesh(new THREE.CylinderGeometry(R, R, 0.012, 48), fm, { parent: root, at: [0, 0.006, 0], scale: [1, 1, oval] });
    mesh(new THREE.CircleGeometry(R * 0.86, 48), M.chrome(), { parent: root, at: [0, 0.0122, 0], rot: [-Math.PI / 2, 0, 0], scale: [1, oval, 1] });
    if (T.trim === 'vintage' || T.lux) mesh(new THREE.TorusGeometry(R * 0.93, 0.004, 8, 48), gold, { parent: root, at: [0, 0.012, 0], rot: [Math.PI / 2, 0, 0], scale: [1, oval, 1] });
    const hl = 0.11 * k;
    mesh(new THREE.CapsuleGeometry(0.009 * (T.chunky ? 1.3 : 1), hl, 6, 16).rotateX(Math.PI / 2), fm, { parent: root, at: [0, 0.008, R * oval + hl / 2 - 0.004], scale: [1, 0.85, 1] });
    if (T.trim === 'kids') for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.01, 12, 8), fin(T, ['#ff4d6d', '#ffcc1e', '#3fb6ff'][i % 3], 'plastic'), { parent: root, at: [Math.cos(a) * R, 0.008, Math.sin(a) * R] }); }
  }
  return done(root, 'beauty', variant, o, anim);
}

export { circlePts, rrPts, tm };
