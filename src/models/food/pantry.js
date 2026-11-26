/*
 * Packaging & pantry: cereal, jars, tins, eggs, cheese, butter, chocolate, candy,
 * ice cream and popsicles. Jars/tubs/tins are hollow; lids animate ('lidOpen').
 */
import {
  THREE, PI, TAU, mesh, group, curveTube, roundedBox, lathe, scatter, cached, cushion, trayBox, jitter, sweep, tube,
  cream, glaze, flesh, phys, paperMat, plate, bowl, cup, ceramic, clearGlass, liquid, metalMat, plasticMat, foil, woodMat, crust, waxy, leafy,
  vcolor, fbm, toColor, make, vessel, fillGeo, labelTex, boxArt, canvasTex, clip, rotateTrack, moveTrack, extrudeOutline, biteGeo, SPRINKLES, sprinkleGeo, board,
} from './common.js';
import { swirlCream } from './bread.js';

const mk = (type, variants, fn) => make(type, Object.fromEntries(variants.map((v) => [v, {}])), fn);
const C = (h) => toColor(h);
function lidOpen(ctx, lid, dy = 0.05) { ctx.animations.push(clip('lidOpen', 1, [moveTrack(lid, 1, (t) => [0, Math.min(1, t * 1.3) * dy, 0])])); ctx.oneShot.push('lidOpen'); }

/* ---------------------------------------------------------------- cereal */
const CEREAL = {
  'honey-rings': ['#f2b81a', '#7a3a12', '#c81e2a', 'Sunny Oat', 'honey rings', '#e8a83a', 'ring'],
  'choco-puffs': ['#5a2e18', '#ffd23f', '#3a1e10', 'Cocoa Moon', 'choco puffs', '#4a2614', 'ball'],
  cornflakes: ['#f6f2e6', '#c81e2a', '#3a8a2a', 'Meadow Farm', 'corn flakes', '#e8b050', 'flake'],
  'fruit-rings': ['#3ab8e8', '#ffffff', '#e83a8a', 'Rainbow Bay', 'fruity rings', 'mixed', 'ring'],
  granola: ['#c8a060', '#2a4a2a', '#8a5a2a', 'Oatlands', 'crunchy granola', '#b8803a', 'cluster'],
  bran: ['#2a6aa8', '#ffffff', '#1e3a6a', 'Fibre Fields', 'bran flakes', '#8a5a32', 'flake'],
};
function cerealPieces(parent, f, y0, inner, n, rand, name) {
  const geo = { ring: () => cached('cring', () => new THREE.TorusGeometry(0.006, 0.0028, 6, 12)), ball: () => cached('cball', () => new THREE.SphereGeometry(0.006, 8, 6)), flake: () => cached('cflake', () => jitter(new THREE.CylinderGeometry(0.01, 0.01, 0.0015, 7), () => 0.5, 0)), cluster: () => cached('cclus', () => jitter(new THREE.IcosahedronGeometry(0.008, 0), () => 0.3, 0.2)) }[f[6]]();
  const items = [];
  for (let i = 0; i < n; i++) { const y = y0 + rand() * 0.012; const r = Math.max(0, inner(y) - 0.01) * Math.sqrt(rand()); const a = rand() * TAU; items.push({ at: [Math.cos(a) * r, y, Math.sin(a) * r], rot: [rand() * 3, rand() * 3, 0], color: f[5] === 'mixed' ? SPRINKLES[i % 6] : f[5] }); }
  scatter(parent, geo, crust('#ffffff', { rough: 0.6 }), items, name);
}
export const createCereal = mk('cereal', ['box', 'open', 'bowl'], (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const f = CEREAL[trim] ?? CEREAL['honey-rings'];
  const box = (parent, at = [0, 0, 0]) => {
    const W = 0.19, H = 0.28, D = 0.065;
    const art = boxArt({ bg: f[0], fg: f[1], accent: f[2], brand: f[3], name: f[4], bowl: f[5] === 'mixed' ? '#ff4f7b' : f[5] });
    const side = paperMat(f[2], { rough: 0.5 });
    const front = phys('#fff', { rough: 0.45, cc: 0.3, map: art, name: 'print' });
    const g = group('box', { parent, at });
    trayBox(g, W, H, D, side, 0.0012, { name: 'carton' });
    mesh(new THREE.PlaneGeometry(W * 0.99, H * 0.99), front, { parent: g, at: [0, H / 2, D / 2 + 0.0004], name: 'front' });
    mesh(new THREE.PlaneGeometry(W * 0.99, H * 0.99), front, { parent: g, at: [0, H / 2, -D / 2 - 0.0004], rot: [0, PI, 0], name: 'back' });
    const flap = group('flap', { parent: g, at: [0, H, D / 2] });
    mesh(roundedBox(W, 0.0012, D, 0.0005), side, { parent: flap, at: [0, 0, -D / 2], name: 'flap_top' });
    return { g, flap, H };
  };
  if (variant === 'box') { const b = box(root); ctx.animations.push(clip('lidOpen', 1, [rotateTrack(b.flap, 'x', 1, (t) => -Math.min(1, t * 1.3) * 2)])); ctx.oneShot.push('lidOpen'); return; }
  const b = bowl(root, { r: 0.08, h: 0.06, color: variant === 'open' ? '#f6f2ea' : '#e8f0f6', at: variant === 'open' ? [0.14, 0, 0.04] : [0, 0, 0] });
  const ox = variant === 'open' ? 0.14 : 0;
  mesh(fillGeo(b.local.inner, b.local.floor, 0.04), liquid('#fbfbf6'), { parent: root, at: [ox, 0, variant === 'open' ? 0.04 : 0], name: 'milk' });
  const g = group('pieces', { parent: root, at: [ox, 0, variant === 'open' ? 0.04 : 0] });
  cerealPieces(g, f, 0.038, b.local.inner, 60, rand, 'cereal');
  mesh(roundedBox(0.012, 0.004, 0.15, 0.0015), metalMat('#d8dce0'), { parent: g, at: [0.03, 0.06, 0], rot: [0.35, 0.4, 0], name: 'spoon' });
  if (variant === 'open') { const bx = box(root, [-0.06, 0, 0]); bx.flap.rotation.x = -2; }
});

/* ---------------------------------------------------------------- jars */
const JARS = {
  jam: ['#a8102a', '#c81e2a', 'Bramble & Co', 'strawberry jam', 'gingham'], honey: ['#e8a01a', '#2a2a2e', 'Golden Hive', 'wildflower honey', 'hex'],
  pickles: ['#7a8a2a', '#2a5a2a', 'Dill Brothers', 'crunchy pickles', 'plain'], 'peanut-butter': ['#b8783a', '#c81e2a', 'Nutterly', 'smooth peanut', 'plain'],
  'choc-spread': ['#3a1e10', '#c88a3a', 'Cocoa Moon', 'hazelnut spread', 'plain'], olives: ['#5a6a2a', '#2a4a2a', 'Olivara', 'green olives', 'plain'], sauce: ['#c8301a', '#3a8a2a', 'Nonna Rosa', 'tomato basil', 'plain'],
};
export const createJar = mk('jar', Object.keys(JARS), (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const f = JARS[variant];
  const s = trim === 'mini' ? 0.6 : 1;
  const g = group('jar', { parent: root });
  g.scale.setScalar(s);
  const tall = variant === 'pickles' || variant === 'olives' || variant === 'sauce' || trim === 'mason';
  const R = tall ? 0.042 : 0.038, H = tall ? 0.14 : 0.095;
  const prof = [[0, 0], [R * 0.9, 0], [R, 0.008], [R, H - 0.016], [R * 0.86, H - 0.008], [R * 0.86, H]];
  const v = vessel(prof, 0.003);
  mesh(v.geo, clearGlass('#f2f8fa', { opacity: 0.3 }), { parent: g, name: 'jar_glass' });
  const level = H - 0.022;
  const op = variant === 'honey' ? 0.85 : 1;
  mesh(fillGeo(v.inner, v.floor, level, { n: 6 }), (variant === 'pickles' || variant === 'olives') ? liquid('#d8d890', { opacity: 0.5, transparent: true }) : glaze(f[0], { opacity: op, transparent: op < 1 }), { parent: g, name: 'contents' });
  if (variant === 'pickles' || variant === 'olives') {
    const items = []; for (let i = 0; i < (variant === 'olives' ? 28 : 7); i++) { const y = v.floor + 0.015 + (i / (variant === 'olives' ? 28 : 7)) * (level - 0.03); const a = rand() * TAU; items.push({ at: [Math.cos(a) * R * 0.45, y, Math.sin(a) * R * 0.45], rot: variant === 'olives' ? [rand(), rand(), 0] : [0.15, a, 0] }); }
    scatter(g, variant === 'olives' ? cached('olive2', () => new THREE.SphereGeometry(0.009, 10, 8).scale(1, 1.3, 1)) : cached('gherkin', () => jitter(new THREE.CapsuleGeometry(0.011, 0.07, 4, 10), () => 0.4, 0.06)), waxy(variant === 'olives' ? '#7a8a2a' : '#5a7a22', { rough: 0.4 }), items, 'pieces');
  }
  if (variant === 'honey') { const comb = canvasTex('comb', 256, 256, (c, w, h) => { c.fillStyle = '#e8a01a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b8701a'; c.lineWidth = 4; for (let y = 0; y < h; y += 26) for (let x = (y / 26) % 2 ? 15 : 0; x < w; x += 30) { c.beginPath(); for (let k = 0; k < 6; k++) c.lineTo(x + Math.cos(k * PI / 3) * 14, y + Math.sin(k * PI / 3) * 14); c.closePath(); c.stroke(); } }); mesh(roundedBox(0.03, 0.06, 0.008, 0.002), phys('#e8a01a', { map: comb, rough: 0.3, cc: 0.8 }), { parent: g, at: [0, v.floor + 0.035, 0], name: 'comb' }); }
  const tex = labelTex({ bg: f[4] === 'gingham' ? '#ffffff' : '#f6efe0', fg: '#2a2a2a', accent: f[1], brand: f[2], name: f[3], motif: f[4] === 'gingham' ? 'check' : f[4] === 'hex' ? 'dots' : 'frame', serif: true, w: 1024, h: 384, wrap: true });
  if (trim !== 'unlabelled') mesh(new THREE.CylinderGeometry(R + 0.0005, R + 0.0005, H * 0.42, 40, 1, true), paperMat('#fff', { map: tex, side: THREE.DoubleSide }), { parent: g, at: [0, H * 0.45, 0], name: 'label' });
  const lid = group('lid', { parent: g, at: [0, H, 0] });
  const lidC = { jam: '#c81e2a', honey: '#e8c04a', pickles: '#2a5a2a', 'peanut-butter': '#c81e2a', 'choc-spread': '#f6f4ef', olives: '#2a2a2e', sauce: '#d8b84a' }[variant];
  if (trim === 'mason') mesh(lathe([[R * 0.9, -0.012], [R * 0.92, -0.012], [R * 0.92, 0.002], [0, 0.003]], 40), metalMat('#c8ccd2'), { parent: lid, name: 'lid_cap' });
  else mesh(lathe([[R * 0.9, -0.012], [R * 0.92, -0.012], [R * 0.92, 0.002], [R * 0.85, 0.005], [0, 0.005]], 40), metalMat(lidC, { rough: 0.35, metal: 0.6 }), { parent: lid, name: 'lid_cap' });
  if (variant === 'jam' && trim !== 'mason') { const cloth = new THREE.CircleGeometry(R * 1.5, 40); cloth.rotateX(-PI / 2); const p = cloth.attributes.position; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)); if (r > R * 0.92) { const k = R * 0.95 / r; p.setY(i, -(r - R * 0.92) * 1.2 + Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 10) * 0.002); p.setX(i, p.getX(i) * (0.6 + 0.4 * k)); p.setZ(i, p.getZ(i) * (0.6 + 0.4 * k)); } } cloth.computeVertexNormals(); mesh(cloth, phys('#ffffff', { map: canvasTex('ging', 128, 128, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(200,30,42,0.6)'; for (let i = 0; i < 8; i++) { c.fillRect(i * 16, 0, 8, h); c.fillRect(0, i * 16, w, 8); } }), rough: 0.9, side: THREE.DoubleSide, name: 'cloth' }), { parent: lid, at: [0, 0.0055, 0], name: 'lid_cloth' }); }
  if (trim === 'open' || trim === 'spoon') {
    lid.position.set(R * 2.4, 0, 0); lid.rotation.x = PI; lid.position.y = 0.005;
    if (trim === 'spoon' || variant === 'honey') {
      if (variant === 'honey') { const d = group('dipper', { parent: g, at: [0, level - 0.02, 0], rot: [0, 0, 0.3] }); for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.009 - Math.abs(i - 1.5) * 0.0015, 0.009 - Math.abs(i - 1.5) * 0.0015, 0.005, 16), woodMat('#d8b070'), { parent: d, at: [0, i * 0.006, 0], name: `dipper${i}` }); tube([0, 0.02, 0], [0, 0.13, 0], 0.003, woodMat('#d8b070'), { parent: d, name: 'dipper_handle' }); }
      else mesh(roundedBox(0.012, 0.15, 0.004, 0.0015), metalMat('#d8dce0'), { parent: g, at: [0.01, level + 0.05, 0], rot: [0, 0, -0.3], name: 'spoon' });
    }
  }
  if (trim !== 'open' && trim !== 'spoon') lidOpen(ctx, lid, 0.05);
});

/* ---------------------------------------------------------------- tins */
const TINS = { soup: ['#c81e2a', '#ffffff', 'Kettlewick', 'tomato soup'], beans: ['#2a6aa8', '#f6e83a', 'Hearthside', 'baked beans'], tomatoes: ['#c8301a', '#3a8a2a', 'Nonna Rosa', 'chopped tomatoes'], corn: ['#3a8a2a', '#f6d83a', 'Meadow Farm', 'sweet corn'], tuna: ['#1e5a8a', '#ffffff', 'Bluefin Bay', 'tuna chunks'], coffee: ['#1e1e20', '#c8a274', 'Bean & Brew', 'ground coffee'], cookies: ['#2a4aa8', '#f6efe0', 'Butterhaus', 'danish butter cookies'] };
export const createTin = mk('tin', Object.keys(TINS), (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const f = TINS[variant];
  const dims = { tuna: [0.043, 0.04], cookies: [0.1, 0.08], coffee: [0.05, 0.14] }[variant] ?? [0.037, 0.11];
  const [R, H] = dims;
  const n = trim === 'stack' ? 3 : 1;
  for (let k = 0; k < n; k++) {
    const g = group(`tin${k}`, { parent: root, at: k === 0 ? [0, 0, 0] : k === 1 ? [R * 2.05, 0, 0] : [R * 1.02, H + 0.001, 0] });
    const v = vessel([[0, 0.002], [R * 0.95, 0], [R, 0.004], [R, H]], 0.0005);
    mesh(v.geo, metalMat('#c8ccd2', { rough: 0.25 }), { parent: g, name: `tin${k}_body` });
    for (const y of [0.004, H - 0.003]) mesh(new THREE.TorusGeometry(R, 0.0016, 6, 40).rotateX(PI / 2), metalMat('#b8bcc2'), { parent: g, at: [0, y, 0], name: `tin${k}_bead${y > 0.01 ? 1 : 0}` });
    const tex = variant === 'cookies' ? canvasTex('cookietin', 1024, 256, (c, w, h) => { c.fillStyle = '#2a4aa8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f6efe0'; c.lineWidth = 3; for (let x = 0; x < w; x += 64) { c.beginPath(); c.arc(x + 32, h / 2, 24, 0, TAU); c.stroke(); } c.fillStyle = '#f6efe0'; c.font = 'italic bold 48px Georgia'; c.textAlign = 'center'; c.fillText('Butterhaus', w / 4, 60); c.fillText('Butterhaus', (3 * w) / 4, 60); }) : labelTex({ bg: f[0], fg: f[1], accent: f[1], brand: f[2], name: f[3], motif: 'band', w: 1024, h: 384, wrap: true });
    mesh(new THREE.CylinderGeometry(R + 0.0004, R + 0.0004, H - 0.012, 40, 1, true), paperMat('#fff', { map: tex, rough: variant === 'cookies' ? 0.3 : 0.55 }), { parent: g, at: [0, H / 2, 0], name: `tin${k}_label` });
    const contents = { soup: '#c8301a', beans: '#c8501a', tomatoes: '#b8281a', corn: '#f2c63a', tuna: '#d8b898', coffee: '#3a2010', cookies: '#d8a050' }[variant];
    const open = trim === 'open' && k === 0;
    mesh(fillGeo(v.inner, v.floor, H - (open ? 0.012 : 0.004)), phys(contents, { rough: 0.5, cc: 0.4 }), { parent: g, name: `tin${k}_contents` });
    if (open && (variant === 'beans' || variant === 'corn')) scatter(g, variant === 'beans' ? cached('bean2', () => new THREE.SphereGeometry(0.005, 8, 6).scale(1.5, 0.7, 1)) : cached('kern2', () => roundedBox(0.006, 0.005, 0.007, 0.002, 1)), glaze(variant === 'beans' ? '#d8702a' : '#f2c63a'), Array.from({ length: 30 }, () => { const a = rand() * TAU, d = Math.sqrt(rand()) * R * 0.8; return { at: [Math.cos(a) * d, H - 0.011, Math.sin(a) * d], rot: [0, rand() * 3, 0] }; }), `tin${k}_bits`);
    const lid = group(k === 0 ? 'lid' : `lid${k}`, { parent: g, at: [0, H, 0] });
    mesh(new THREE.CylinderGeometry(R - 0.001, R - 0.001, 0.001, 40), metalMat(variant === 'cookies' ? '#2a4aa8' : variant === 'coffee' ? '#1e1e20' : '#d8dce2', { rough: 0.25 }), { parent: lid, name: `${lid.name}_disc` });
    if (variant !== 'cookies' && variant !== 'coffee') mesh(roundedBox(0.012, 0.0012, 0.02, 0.0005), metalMat('#b8bcc2'), { parent: lid, at: [0, 0.001, R * 0.55], name: `${lid.name}_pull` });
    if (open) { lid.position.set(0, H + 0.004, R); lid.rotation.x = -1.9; }
    else if (k === 0) ctx.animations.push(clip('lidOpen', 1, [rotateTrack(lid, 'x', 1, (t) => -Math.min(1, t * 1.3) * 1.9)])), ctx.oneShot.push('lidOpen');
  }
});

/* ---------------------------------------------------------------- eggs */
function egg(parent, { at = [0, 0, 0], rot = [0, 0, 0], color = '#f6f2ea', name = 'egg', s = 1, speckle = false }) {
  const geo = lathe([[0, 0], [0.012, 0.002], [0.02, 0.012], [0.022, 0.025], [0.019, 0.042], [0.011, 0.052], [0, 0.055]].map(([r, y]) => [r * s, y * s]), 28);
  vcolor(geo, (x, y, z, c) => { c.set(color).multiplyScalar(0.95 + fbm(x * 200, y * 200, z * 200) * 0.1); if (speckle && fbm(x * 900, y * 900, z * 900) > 0.66) c.set('#5a3a2a'); });
  return mesh(geo, phys('#fff', { vc: true, rough: 0.5, cc: 0.2 }), { parent, at, rot, name });
}
export const createEggs = mk('eggs', ['carton-6', 'carton-12', 'bowl', 'egg-cup', 'cracked'], (ctx) => {
  const { variant, trim, root } = ctx;
  const color = trim === 'brown' ? '#c8885a' : trim === 'quail' ? '#e8dcc0' : trim === 'blue' ? '#b8d8d0' : '#f6f2ea';
  const speckle = trim === 'quail';
  const s = trim === 'quail' ? 0.55 : 1;
  if (variant.startsWith('carton')) {
    const cols = variant === 'carton-12' ? 6 : 3, W = cols * 0.05, D = 0.1, H = 0.045;
    const pulp = phys(trim === 'brown' ? '#a8a49a' : '#d8d2c4', { rough: 1, name: 'pulp' });
    trayBox(root, W, H, D, pulp, 0.002, { name: 'tray' });
    for (let i = 0; i < cols * 2; i++) { const x = (i % cols - (cols - 1) / 2) * 0.05, z = (Math.floor(i / cols) - 0.5) * 0.05; const cupG = vessel([[0, 0.002], [0.016, 0.003], [0.022, 0.035]], 0.0015, { seg: 16 }); mesh(cupG.geo, pulp, { parent: root, at: [x, 0.0, z], name: `cell${i}` }); if (!(trim === 'missing' && i % 4 === 1)) egg(root, { at: [x, 0.006, z], color, name: `egg${i}`, s, speckle }); }
    const lid = group('lid', { parent: root, at: [0, H, -D / 2] });
    const lt = trayBox(lid, W, 0.04, D, pulp, 0.002, { name: 'lid_shell' }); lt.rotation.x = PI; lt.position.set(0, 0.04, D / 2);
    lid.rotation.x = -2.0;
    ctx.animations.push(clip('lidClose', 1.2, [rotateTrack(lid, 'x', 1.2, (t) => Math.min(1, t * 1.25) * 2.0)])); ctx.oneShot.push('lidClose');
    return;
  }
  if (variant === 'bowl') { const b = bowl(root, { r: 0.09, h: 0.055, mat: woodMat('#a8784a') }); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; egg(root, { at: [Math.cos(a) * 0.035, b.floor + 0.012, Math.sin(a) * 0.035], rot: [PI / 2 - 0.4, a, 0], color: i % 2 && trim === 'mixed' ? '#c8885a' : color, name: `egg${i}`, s, speckle }); } return; }
  if (variant === 'egg-cup') {
    const c = cup(root, { rTop: 0.024, rBot: 0.016, h: 0.035, mat: ceramic(trim === 'blue' ? '#3a6aa8' : '#f6f4ef') });
    mesh(lathe([[0, 0], [0.022, 0], [0.018, 0.01], [0, 0.01]], 24), ceramic(trim === 'blue' ? '#3a6aa8' : '#f6f4ef'), { parent: root, name: 'foot' });
    const e = egg(root, { at: [0, 0.012, 0], color, s: 1, speckle });
    void c; void e;
    mesh(new THREE.CircleGeometry(0.014, 24).rotateX(-PI / 2), glaze('#f2900a'), { parent: root, at: [0, 0.052, 0], name: 'yolk' });
    mesh(new THREE.SphereGeometry(0.014, 16, 8, 0, TAU, 0, PI / 3), phys(color, { rough: 0.5 }), { parent: root, at: [0.04, 0.0, 0], rot: [PI, 0, 0], name: 'cap' }).position.y = 0.0075;
    mesh(roundedBox(0.008, 0.002, 0.1, 0.0008), metalMat('#d8dce0'), { parent: root, at: [0.04, 0.001, 0.03], rot: [0, 0.3, 0], name: 'spoon' });
    return;
  }
  // cracked: shell halves + fried egg on a pan
  const pan = cup(root, { rTop: 0.1, rBot: 0.085, h: 0.03, wall: 0.003, mat: metalMat('#2a2a2e', { rough: 0.4 }) });
  void pan;
  tube([0.1, 0.025, 0], [0.22, 0.035, 0], 0.008, woodMat('#3a2a1e'), { parent: root, name: 'pan_handle' });
  const wg = new THREE.CircleGeometry(0.045, 24); const p = wg.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)); const k = 1 + 0.12 * Math.sin(a * 3) + 0.05 * Math.sin(a * 7); p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k); } wg.rotateX(-PI / 2);
  mesh(wg, cream('#fbfaf4', { rough: 0.3, cc: 0.6 }), { parent: root, at: [0, 0.0065, 0], name: 'white' });
  mesh(new THREE.SphereGeometry(0.015, 16, 8, 0, TAU, 0, PI / 2).scale(1, 0.6, 1), glaze('#f2900a'), { parent: root, at: [0.004, 0.0065, 0.004], name: 'yolk' });
  for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.021, 16, 8, 0, TAU, PI / 2, PI / 2), phys(color, { rough: 0.5, side: THREE.DoubleSide }), { parent: root, at: [0.06 * sx + 0.12, 0.022, 0.12], name: `shell${sx}` });
});

/* ---------------------------------------------------------------- cheese */
const CHEESE = { cheddar: ['#f2a81a', '#c8701a'], gouda: ['#f2c84a', '#c81e2a'], swiss: ['#f6e6a0', '#e8d890'], blue: ['#f2eee0', '#e8e4d8'], parmesan: ['#ecd890', '#c8a85a'], brie: ['#fbf6e6', '#f6f2e8'] };
function holesTex(kind, base) { return canvasTex(`cheese:${kind}`, 256, 256, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); if (kind === 'swiss') { c.fillStyle = 'rgba(160,130,40,0.5)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((i * 97) % w, (i * 61) % h, 8 + (i % 4) * 5, 0, TAU); c.fill(); } } if (kind === 'blue') { c.fillStyle = 'rgba(40,70,90,0.7)'; for (let i = 0; i < 160; i++) { c.beginPath(); c.arc((i * 37) % w, (i * 53 + i * i) % h, 2 + (i % 3) * 2, 0, TAU); c.fill(); } } if (kind === 'parmesan') { c.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 200; i++) c.fillRect((i * 37) % w, (i * 71) % h, 2, 2); } }); }
export const createCheese = mk('cheese', ['wheel', 'wedge', 'block', 'slices', 'board'], (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const kind = CHEESE[trim] ? trim : 'cheddar';
  const [paste, rind] = CHEESE[kind];
  const pasteM = phys(paste, { rough: 0.6, sheen: 0.3, map: holesTex(kind, paste), name: 'cheese' });
  const rindM = kind === 'gouda' ? waxy('#c81e2a', { cc: 0.9 }) : kind === 'brie' ? phys('#f6f2e8', { rough: 1, sheen: 1, sheenColor: '#ffffff' }) : phys(rind, { rough: 0.7 });
  const wheel = (parent, R, H, t0, len, name) => {
    const g = group(name, { parent });
    const n = Math.max(8, Math.round((48 * len) / TAU));
    mesh(new THREE.CylinderGeometry(R, R, H, n, 1, true, t0, len), rindM, { parent: g, at: [0, H / 2, 0], name: `${name}_rind` });
    for (const y of [0, H]) mesh(new THREE.CircleGeometry(R, n, 0, len).rotateX(y ? -PI / 2 : PI / 2).rotateY(t0 - PI / 2 + (y ? 0 : 0)), rindM, { parent: g, at: [0, y, 0], name: `${name}_cap${y ? 1 : 0}` }).material.side = THREE.DoubleSide;
    if (len < TAU - 1e-3) for (const th of [t0, t0 + len]) { const pl = new THREE.PlaneGeometry(R, H); pl.translate(R / 2, 0, 0); pl.rotateY(th - PI / 2); mesh(pl, Object.assign(pasteM.clone(), { side: THREE.DoubleSide }), { parent: g, at: [0, H / 2, 0], name: `${name}_cut${th === t0 ? 0 : 1}` }); }
    return g;
  };
  if (variant === 'wheel') { const H = kind === 'brie' ? 0.04 : 0.1, R = kind === 'brie' ? 0.1 : 0.16; const t = board(root, { w: R * 2.4, d: R * 2.4, round: true }); const g = wheel(root, R, H, PI / 6, TAU - PI / 3, 'wheel'); g.position.y = t; return; }
  if (variant === 'wedge') { const t = board(root, { w: 0.3, d: 0.2 }); const g = wheel(root, 0.14, kind === 'brie' ? 0.04 : 0.08, -PI / 12, PI / 6, 'wedge'); g.position.set(0, t, -0.07); mesh(roundedBox(0.012, 0.003, 0.15, 0.001), metalMat('#d8dce0'), { parent: root, at: [0.08, t + 0.0015, 0], name: 'knife' }); return; }
  if (variant === 'block') { const g = mesh(roundedBox(0.12, 0.05, 0.07, 0.003), [rindM, rindM, rindM, rindM, pasteM, pasteM], { parent: root, at: [0, 0.025, 0], name: 'block' }); void g; const gr = mesh(new THREE.BoxGeometry(0.06, 0.004, 0.02), pasteM, { parent: root, at: [0.1, 0.002, 0.02], name: 'shavings' }); void gr; return; }
  if (variant === 'slices') { const t = plate(root, { r: 0.12 }).top; for (let i = 0; i < 5; i++) mesh(roundedBox(0.085, 0.003, 0.085, 0.001), pasteM, { parent: root, at: [(i - 2) * 0.012, t + 0.0015 + i * 0.003, (i - 2) * 0.008], rot: [0, i * 0.15, 0], name: `slice${i}` }); return; }
  // board: three cheeses, grapes, crackers
  const t = board(root, { w: 0.4, d: 0.26 });
  const a = wheel(root, 0.1, 0.06, -PI / 10, PI / 5, 'wedgeA'); a.position.set(-0.08, t, -0.03);
  const b = wheel(root, 0.06, 0.035, 0, TAU, 'round'); b.position.set(0.08, t, -0.04); b.children[0].material = phys('#f6f2e8', { rough: 1, sheen: 1 });
  mesh(roundedBox(0.07, 0.03, 0.04, 0.002), phys('#f2a81a', { rough: 0.6 }), { parent: root, at: [0.06, t + 0.015, 0.06], name: 'cheddar' });
  scatter(root, cached('grape2', () => new THREE.SphereGeometry(0.0095, 12, 8)), phys('#7a1e3a', { rough: 0.35, cc: 0.6, sheen: 0.6 }), Array.from({ length: 12 }, (_, i) => ({ at: [-0.1 + (i % 4) * 0.018, t + 0.0095 + (i > 7 ? 0.014 : 0), 0.07 + Math.floor(i / 4) % 2 * 0.016] })), 'grapes');
  for (let i = 0; i < 6; i++) mesh(roundedBox(0.04, 0.004, 0.04, 0.002), crust('#d8a860'), { parent: root, at: [-0.02 + i * 0.006, t + 0.002 + i * 0.004, 0.05], rot: [0, 0.3, 0.05], name: `cracker${i}` });
  void rand;
});

/* ---------------------------------------------------------------- butter */
export const createButter = mk('butter', ['stick', 'dish', 'block'], (ctx) => {
  const { variant, trim, root } = ctx;
  const col = trim === 'garlic' ? '#f2e2a0' : trim === 'unsalted' ? '#fbefb0' : '#f8e08a';
  const bm = cream(col, { rough: 0.35, cc: 0.4 });
  if (variant === 'stick') { mesh(roundedBox(0.12, 0.03, 0.03, 0.002), bm, { parent: root, at: [0.02, 0.015, 0], name: 'butter' }); const tex = labelTex({ bg: '#f6efe0', fg: '#2a5a8a', accent: '#2a5a8a', brand: 'Meadowmilk', name: trim ?? 'salted butter', motif: 'frame', w: 512, h: 128, serif: true }); mesh(roundedBox(0.07, 0.0315, 0.0315, 0.002), [paperMat('#f6efe0'), paperMat('#f6efe0'), phys('#fff', { map: tex, rough: 0.6 }), paperMat('#f6efe0'), phys('#fff', { map: tex, rough: 0.6 }), phys('#fff', { map: tex, rough: 0.6 })], { parent: root, at: [-0.025, 0.0158, 0], name: 'wrapper' }); return; }
  if (variant === 'block') { const t = board(root, { w: 0.22, d: 0.15 }); mesh(roundedBox(0.09, 0.04, 0.06, 0.004), bm, { parent: root, at: [0, t + 0.02, 0], name: 'butter' }); for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.01, 0.004, 8, 16, PI * 1.4), bm, { parent: root, at: [0.07, t + 0.004, -0.03 + i * 0.025], rot: [PI / 2, 0, i], name: `curl${i}` }); mesh(roundedBox(0.012, 0.002, 0.12, 0.0008), metalMat('#d8dce0'), { parent: root, at: [-0.08, t + 0.001, 0], name: 'knife' }); if (trim === 'garlic') scatter(root, cached('herb', () => new THREE.BoxGeometry(0.002, 0.0006, 0.0015)), leafy('#3a7a2a'), Array.from({ length: 40 }, (_, i) => ({ at: [((i * 37) % 80) / 1000 - 0.04, t + 0.0403, ((i * 53) % 50) / 1000 - 0.025] })), 'herbs'); return; }
  // dish with lid
  mesh(lathe([[0, 0], [0.07, 0], [0.075, 0.006], [0.075, 0.012], [0, 0.012]], 4).rotateY(PI / 4).scale(1.4, 1, 0.8), ceramic('#f6f4ef'), { parent: root, name: 'dish' });
  mesh(roundedBox(0.1, 0.03, 0.045, 0.003), bm, { parent: root, at: [0, 0.027, 0], name: 'butter' });
  const lid = group('lid', { parent: root, at: [0, 0.012, 0] });
  const lv = trayBox(lid, 0.12, 0.05, 0.065, ceramic('#f6f4ef'), 0.003, { name: 'lid_shell' }); lv.rotation.x = PI; lv.position.y = 0.05;
  mesh(new THREE.SphereGeometry(0.008, 12, 8), ceramic('#f6f4ef'), { parent: lid, at: [0, 0.055, 0], name: 'lid_knob' });
  lidOpen(ctx, lid, 0.07);
});

/* ---------------------------------------------------------------- chocolate */
const CHOC = { milk: ['#6a3a22', '#7a2a5a', 'milk chocolate'], dark: ['#2e180e', '#1e1e20', '70% dark'], white: ['#f6ecd0', '#c8a274', 'white chocolate'], hazelnut: ['#6a3a22', '#2a6a3a', 'hazelnut'], mint: ['#2e180e', '#3ab88a', 'mint crisp'], strawberry: ['#f2a8b8', '#e84a7a', 'strawberry'] };
function chocBar(parent, f, { at = [0, 0, 0], rot = [0, 0, 0], cols = 4, rows = 6, name = 'bar', broken = 0 }) {
  const g = group(name, { parent, at, rot });
  const m = glaze(f[0], { rough: 0.25, cc: 0.6 });
  const sq = 0.02;
  const items = [];
  for (let i = 0; i < cols; i++) for (let j = broken; j < rows; j++) items.push({ at: [(i - (cols - 1) / 2) * sq, 0.0045, (j - (rows - 1) / 2) * sq] });
  scatter(g, cached('chocsq', () => { const s = roundedBox(sq - 0.002, 0.004, sq - 0.002, 0.0012, 2); return s; }), m, items, `${name}_squares`);
  mesh(roundedBox(cols * sq, 0.004, (rows - broken) * sq, 0.0008), m, { parent: g, at: [0, 0.002, (broken * sq) / 2], name: `${name}_base` });
  return g;
}
export const createChocolate = mk('chocolate', ['bar', 'broken', 'box', 'wrapped'], (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const f = CHOC[trim] ?? CHOC.milk;
  if (variant === 'bar' || variant === 'wrapped') {
    const half = variant === 'bar';
    if (half) chocBar(root, f, { broken: 0 });
    const tex = labelTex({ bg: f[1], fg: '#f6efe0', accent: '#d8b84a', brand: 'Cacaoré', name: f[2], motif: 'frame', w: 512, h: 1024, serif: true });
    const wr = group('wrapper', { parent: root, at: [0, 0, half ? -0.035 : 0] });
    mesh(roundedBox(0.084, 0.008, half ? 0.06 : 0.124, 0.002), [paperMat(f[1]), paperMat(f[1]), phys('#fff', { map: tex, rough: 0.5 }), paperMat(f[1]), paperMat(f[1]), paperMat(f[1])], { parent: wr, at: [0, 0.006, 0], name: 'sleeve' });
    if (half) mesh(new THREE.PlaneGeometry(0.084, 0.03).rotateX(-PI / 2 + 0.3), foil('#d8dade', { side: THREE.DoubleSide }), { parent: root, at: [0, 0.006, -0.002], name: 'foil' });
    return;
  }
  if (variant === 'broken') { const t = board(root, { w: 0.24, d: 0.16 }); for (let i = 0; i < 4; i++) chocBar(root, f, { at: [(i % 2 - 0.5) * 0.06, t, (Math.floor(i / 2) - 0.5) * 0.05], rot: [0, rand() * 2, 0], cols: 2 + (i % 2), rows: 2, name: `piece${i}` }); scatter(root, cached('shave2', () => roundedBox(0.008, 0.0015, 0.004, 0.0006, 1)), glaze(f[0]), Array.from({ length: 16 }, () => ({ at: [(rand() - 0.5) * 0.18, t + 0.0008, (rand() - 0.5) * 0.12], rot: [0, rand() * 3, 0] })), 'shavings'); return; }
  // truffle box
  trayBox(root, 0.2, 0.03, 0.12, paperMat(f[1]), 0.002, { name: 'box' });
  const kinds = [['#3a1e10', 'cocoa'], ['#f6ecd0', 'white'], ['#6a3a22', 'nuts'], ['#e84a7a', 'pink']];
  for (let i = 0; i < 8; i++) { const [c, k] = kinds[i % 4]; const x = (i % 4 - 1.5) * 0.045, z = (Math.floor(i / 4) - 0.5) * 0.05; const cupP = vessel([[0, 0], [0.014, 0], [0.018, 0.012]], 0.0006, { seg: 24 }); mesh(cupP.geo, paperMat('#3a2a1e', { side: THREE.DoubleSide }), { parent: root, at: [x, 0.002, z], name: `paper${i}` }); mesh(new THREE.SphereGeometry(0.014, 16, 12), k === 'pink' ? glaze(c) : phys(c, { rough: k === 'cocoa' ? 0.95 : 0.35 }), { parent: root, at: [x, 0.016, z], name: `truffle${i}` }); }
});

/* ---------------------------------------------------------------- candy */
export const createCandy = mk('candy', ['jar', 'lollipop', 'swirl-pop', 'gummies', 'wrapped', 'candy-cane', 'cotton-candy'], (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const palette = { red: ['#e8203a', '#ff6a7a'], rainbow: SPRINKLES, blue: ['#3a8ae8', '#8ac8f6'], green: ['#3ab84a', '#a8e86a'], pink: ['#f25a9a', '#f6b8d8'] }[trim] ?? SPRINKLES;
  if (variant === 'jar') {
    const v = vessel([[0, 0], [0.06, 0], [0.065, 0.01], [0.065, 0.16], [0.045, 0.18], [0.045, 0.19]], 0.003);
    mesh(v.geo, clearGlass('#f2f8fa', { opacity: 0.25 }), { parent: root, name: 'jar' });
    const items = []; for (let i = 0; i < 120; i++) { const y = v.floor + 0.008 + (i / 120) * 0.13; const r = (v.inner(y) - 0.009) * Math.sqrt(rand()); const a = rand() * TAU; items.push({ at: [Math.cos(a) * r, y, Math.sin(a) * r], rot: [rand() * 3, rand() * 3, 0], color: palette[i % palette.length] }); }
    scatter(root, cached('candyball', () => new THREE.SphereGeometry(0.008, 10, 8).scale(1, 0.8, 1)), glaze('#ffffff'), items, 'candies');
    const lid = group('lid', { parent: root, at: [0, 0.19, 0] });
    mesh(lathe([[0.047, -0.01], [0.05, -0.01], [0.05, 0.004], [0.02, 0.012], [0.012, 0.025], [0, 0.026]], 32), clearGlass('#f2f8fa', { opacity: 0.35 }), { parent: lid, name: 'lid_glass' });
    lidOpen(ctx, lid, 0.05);
    return;
  }
  if (variant === 'lollipop' || variant === 'swirl-pop') {
    const swirl = variant === 'swirl-pop';
    const r = swirl ? 0.04 : 0.016;
    const tex = canvasTex(`pop:${trim}:${swirl}`, 256, 256, (c, w, h) => { c.fillStyle = palette[0]; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2); for (let i = 0; i < 6; i++) { c.fillStyle = palette[(i + 1) % palette.length]; c.beginPath(); for (let a = 0; a < 14; a += 0.1) { const rr = a * 9; c.lineTo(Math.cos(a + (i * TAU) / 6) * rr, Math.sin(a + (i * TAU) / 6) * rr); } for (let a = 14; a > 0; a -= 0.1) { const rr = a * 9; c.lineTo(Math.cos(a + (i * TAU) / 6 + 0.35) * rr, Math.sin(a + (i * TAU) / 6 + 0.35) * rr); } c.fill(); } });
    const g = group('pop', { parent: root, at: [0, 0, 0], rot: [0, 0, 0] });
    const stick = tube([0, 0.004, 0], [0.13, 0.004, 0], 0.003, paperMat('#fbfaf6'), { parent: g, name: 'stick' }); void stick;
    if (swirl) { const d = new THREE.CylinderGeometry(r, r, 0.01, 40).rotateZ(PI / 2); mesh(d, [glaze(palette[0]), glaze('#fff', { map: tex }), glaze('#fff', { map: tex })], { parent: g, at: [-r + 0.004, r, 0], rot: [0, 0, 0], name: 'candy' }); g.rotation.y = 0.4; }
    else { mesh(new THREE.SphereGeometry(r, 24, 16), glaze(palette[0], { opacity: 0.9, transparent: true }), { parent: g, at: [-r + 0.004, r, 0], name: 'candy' }); }
    return;
  }
  if (variant === 'gummies') {
    const bear = cached('bear', () => { const parts = [new THREE.SphereGeometry(0.008, 10, 8).scale(1, 1.15, 0.7).translate(0, 0.008, 0), new THREE.SphereGeometry(0.0065, 10, 8).scale(1, 1, 0.7).translate(0, 0.021, 0), new THREE.SphereGeometry(0.0025, 6, 4).translate(-0.004, 0.027, 0), new THREE.SphereGeometry(0.0025, 6, 4).translate(0.004, 0.027, 0)]; return mergeGeos(parts); });
    const b = bowl(root, { r: 0.07, h: 0.04, color: '#f6f4ef' });
    const items = []; for (let i = 0; i < 26; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * 0.05; items.push({ at: [Math.cos(a) * d, b.floor + 0.004 + rand() * 0.012, Math.sin(a) * d], rot: [-PI / 2 + rand() * 0.5, rand() * 3, rand()], color: palette[i % palette.length] }); }
    items.push({ at: [0, b.floor + 0.003, 0], rot: [-PI / 2, 0, 0], color: palette[0] });
    scatter(root, bear, phys('#ffffff', { rough: 0.15, cc: 1, opacity: 0.85, transparent: true }), items, 'bears');
    return;
  }
  if (variant === 'wrapped') {
    for (let i = 0; i < 7; i++) {
      const g = group(`sweet${i}`, { parent: root, at: [Math.cos(i * 2.4) * 0.04 * Math.sqrt(i), 0.009, Math.sin(i * 2.4) * 0.04 * Math.sqrt(i)], rot: [0, i, 0] });
      const c = palette[i % palette.length];
      mesh(new THREE.SphereGeometry(0.009, 14, 10).scale(1.4, 1, 1), phys(c, { rough: 0.15, cc: 1, opacity: 0.8, transparent: true }), { parent: g, name: `sweet${i}_body` });
      for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.008, 0.014, 8, 1, true).rotateZ(s * PI / 2), phys(c, { rough: 0.15, cc: 1, opacity: 0.7, transparent: true, side: THREE.DoubleSide }), { parent: g, at: [s * 0.017, 0, 0], name: `sweet${i}_twist${s}` });
    }
    return;
  }
  if (variant === 'candy-cane') {
    const pts = [[0, 0.006, 0], [0.12, 0.006, 0], [0.145, 0.006, 0.012], [0.15, 0.006, 0.03], [0.14, 0.006, 0.045], [0.125, 0.006, 0.048]];
    const geo = sweep(pts, { r: () => 0.006, seg: 60, sides: 14 });
    const uv = geo.attributes.uv; vcolor(geo, (x, y, z, c, i) => c.set(Math.sin(uv.getX(i) * 60 + uv.getY(i) * TAU) > 0 ? (palette[0] === SPRINKLES[0] ? '#e8203a' : palette[0]) : '#fbfaf6'));
    mesh(geo, glaze('#fff', { vc: true }), { parent: root, name: 'cane' });
    return;
  }
  // cotton candy on a paper cone
  const cone = vessel([[0, 0], [0.004, 0.002], [0.012, 0.14]], 0.0008, { seg: 20 });
  mesh(cone.geo, paperMat('#fbfaf6', { side: THREE.DoubleSide }), { parent: root, rot: [PI, 0, 0], at: [0, 0.14, 0], name: 'cone' });
  const fluff = jitter(new THREE.IcosahedronGeometry(0.07, 3), rand, 0.12);
  mesh(fluff, phys(palette[1] ?? '#f6b8d8', { rough: 1, sheen: 1, sheenColor: '#ffffff', opacity: 0.9, transparent: true }), { parent: root, at: [0, 0.2, 0], scale: [1, 1.2, 1], name: 'fluff' });
});
function mergeGeos(list) {
  const pos = [], nor = [], idx = []; let off = 0;
  for (const g of list) { const ng = g.index ? g : g; const p = ng.attributes.position, n = ng.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); } for (let i = 0; i < ng.index.count; i++) idx.push(ng.index.getX(i) + off); off += p.count; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setIndex(idx); return out;
}

/* ---------------------------------------------------------------- ice cream */
const ICE = { vanilla: '#f8efd0', chocolate: '#6a3a22', strawberry: '#f6a8bc', 'mint-chip': '#b8ecd2', pistachio: '#c8dc9a', cookies: '#f2ece0', mango: '#f8c04a', blueberry: '#9a8ad8', caramel: '#d8a060' };
function scoop(parent, flavour, at, name, r = 0.03) {
  const geo = jitter(new THREE.SphereGeometry(r, 24, 16), () => 0.5, 0);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -r * 0.45) { p.setY(i, -r * 0.45 + (y + r * 0.45) * 0.3); const k = 1 + Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 9) * 0.06; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
  geo.computeVertexNormals();
  const col = ICE[flavour] ?? ICE.vanilla;
  vcolor(geo, (x, y, z, c) => { c.set(col).multiplyScalar(0.92 + fbm(x * 150, y * 150, z * 150) * 0.14); if ((flavour === 'mint-chip' || flavour === 'cookies') && fbm(x * 400, y * 400, z * 400) > 0.66) c.set('#2a160c'); if (flavour === 'vanilla' && fbm(x * 600, y * 600, z * 600) > 0.75) c.set('#3a2a1a'); });
  return mesh(geo, cream('#fff', { vc: true, rough: 0.6, sheen: 0.3 }), { parent, at, name });
}
export const createIceCream = mk('ice-cream', ['cone', 'double-cone', 'cup', 'tub', 'sundae', 'sandwich', 'soft-serve'], (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const fl = ICE[trim] ? trim : 'vanilla';
  const waffle = () => canvasTex('waffle', 128, 128, (c, w, h) => { c.fillStyle = '#d8a050'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a8662a'; c.lineWidth = 6; for (let i = -w; i < w * 2; i += 24) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke(); } }, { repeat: [3, 2] });
  if (variant === 'cone' || variant === 'double-cone' || variant === 'soft-serve') {
    // pure model (no holder): the cone lies on its side, resting on the scoop and the cone
    const outer = root;
    { const root = group('ice_cream', { parent: outer });
    const cone = vessel([[0, 0], [0.004, 0.003], [0.028, 0.12]], 0.002, { seg: 32 });
    mesh(cone.geo, crust('#d8a050', { map: waffle() }), { parent: root, at: [0, 0.01, 0], name: 'cone' });
    const top = 0.13;
    if (variant === 'soft-serve') { swirlCream(root, [0, top - 0.004, 0], 0.03, 0.08, ICE[fl], 'swirl'); if (trim === 'sprinkles' || fl === 'vanilla') scatter(root, sprinkleGeo(), phys('#fff', { rough: 0.35 }), Array.from({ length: 40 }, (_, i) => ({ at: [Math.cos(i * 2.4) * 0.018 * (1 - i / 50), top + 0.02 + (i / 40) * 0.045, Math.sin(i * 2.4) * 0.018 * (1 - i / 50)], rot: [0, i, 0], color: SPRINKLES[i % 7] })), 'sprinkles'); }
    if (variant !== 'soft-serve') scoop(root, fl, [0, top + 0.018, 0], 'scoop0');
    if (variant === 'double-cone') scoop(root, fl === 'chocolate' ? 'strawberry' : 'chocolate', [0, top + 0.062, 0], 'scoop1', 0.028);
    root.rotation.z = Math.PI / 2 - 0.12;
    outer.updateMatrixWorld(true);
    root.position.y -= new THREE.Box3().setFromObject(root).min.y;
    root.position.x -= 0.06;
    }
    return;
  }
  if (variant === 'cup') {
    const c = cup(root, { rTop: 0.045, rBot: 0.035, h: 0.05, wall: 0.0015, mat: paperMat('#f6f2ea', { map: labelTex({ bg: '#f6f2ea', fg: '#c81e5a', accent: '#c81e5a', brand: 'Gelatiamo', name: fl, motif: 'dots', w: 1024, h: 256, wrap: true }) }) });
    void c;
    scoop(root, fl, [-0.012, 0.055, 0], 'scoop0', 0.025); scoop(root, fl === 'vanilla' ? 'strawberry' : 'vanilla', [0.014, 0.055, 0.004], 'scoop1', 0.024);
    mesh(roundedBox(0.012, 0.002, 0.07, 0.0008), woodMat('#e8d0a0'), { parent: root, at: [0.01, 0.08, 0], rot: [0.6, 0.3, 0], name: 'spoon' });
    return;
  }
  if (variant === 'tub') {
    const c = cup(root, { rTop: 0.05, rBot: 0.044, h: 0.1, wall: 0.0015, mat: paperMat('#fff', { map: labelTex({ bg: ICE[fl], fg: '#3a1e10', accent: '#ffffff', brand: 'Polar Lane', name: `${fl} ice cream`, motif: 'wave', w: 1024, h: 384, wrap: true }) }) });
    mesh(fillGeo(c.local.inner, c.local.floor, 0.09), cream(ICE[fl], { rough: 0.6 }), { parent: root, name: 'contents' });
    scoop(root, fl, [0.01, 0.09, 0], 'scoopout', 0.022);
    const lid = group('lid', { parent: root, at: [0, 0.1, 0] });
    mesh(lathe([[0.052, -0.008], [0.053, 0.004], [0, 0.005]], 40), paperMat(ICE[fl]), { parent: lid, name: 'lid_cap' });
    lid.position.set(0.11, 0.0, 0); lid.rotation.x = PI; lid.position.y = 0.005;
    return;
  }
  if (variant === 'sundae') {
    const v = vessel([[0, 0], [0.035, 0], [0.036, 0.004], [0.006, 0.01], [0.006, 0.05], [0.03, 0.06], [0.05, 0.11]], 0.002);
    mesh(v.geo, clearGlass(), { parent: root, name: 'glass' });
    mesh(fillGeo((y) => Math.max(0.001, v.inner(y)), 0.052, 0.07), glaze(fl === 'chocolate' ? '#3a1e10' : '#a8501a'), { parent: root, name: 'sauce' });
    scoop(root, fl, [-0.015, 0.09, 0], 'scoop0', 0.026); scoop(root, 'chocolate', [0.016, 0.09, 0.005], 'scoop1', 0.025); scoop(root, 'strawberry', [0, 0.115, -0.004], 'scoop2', 0.024);
    swirlCream(root, [0, 0.13, 0], 0.018, 0.04, '#fffaf2', 'whip', { turns: 2 });
    mesh(new THREE.SphereGeometry(0.008, 12, 10), waxy('#b8101e', { cc: 1 }), { parent: root, at: [0, 0.172, 0], name: 'cherry' });
    mesh(roundedBox(0.008, 0.07, 0.016, 0.002), crust('#d8a050'), { parent: root, at: [0.03, 0.13, 0], rot: [0, 0, -0.4], name: 'wafer' });
    return;
  }
  // sandwich
  for (const y of [0, 0.03]) mesh(roundedBox(0.1, 0.008, 0.055, 0.003), crust('#3a1e10'), { parent: root, at: [0, y + 0.004, 0], name: `biscuit${y ? 1 : 0}` });
  mesh(roundedBox(0.096, 0.022, 0.052, 0.004), cream(ICE[fl]), { parent: root, at: [0, 0.019, 0], name: 'filling' });
  void rand;
});

/* ---------------------------------------------------------------- popsicles */
const POP = { strawberry: '#e8304a', orange: '#f2801a', lime: '#7ac83a', grape: '#7a3aa8', cola: '#5a2010', watermelon: '#f0505a', chocolate: '#4a2614', coconut: '#f6f2e6' };
export const createPopsicle = mk('popsicle', ['classic', 'rocket', 'fudge', 'fruit-bar', 'bitten'], (ctx) => {
  const { variant, trim, root } = ctx;
  const col = POP[trim] ?? POP.strawberry;
  const g = group('pop', { parent: root, rot: [0, 0, 0] });
  // lying on its side on a little dish so it rests on the ground
  const t = plate(root, { r: 0.09, color: '#e8f2f6' }).top;
  g.position.y = t;
  const stick = mesh(roundedBox(0.075, 0.003, 0.01, 0.0012), woodMat('#e8d0a0'), { parent: g, at: [0.07, 0.0015, 0], name: 'stick' }); void stick;
  if (variant === 'rocket') {
    const cols = ['#e8203a', '#fbfaf6', '#2a6ad8'];
    cols.forEach((c, i) => mesh(new THREE.CylinderGeometry(0.018 - i * 0.004, 0.02 - i * 0.004, 0.03, 20).rotateZ(PI / 2), glaze(c, { opacity: 0.92, transparent: true }), { parent: g, at: [0.02 - i * 0.03, 0.019, 0], name: `stripe${i}` }));
    mesh(new THREE.ConeGeometry(0.008, 0.02, 20).rotateZ(PI / 2), glaze('#2a6ad8'), { parent: g, at: [-0.065, 0.019, 0], name: 'tip' });
    return;
  }
  const geo = cushion(0.09, 0.02, 0.05, { radius: 0.01, bulge: 0.25 });
  if (variant === 'bitten') biteGeo(geo, [{ at: [-0.05, 0.0, 0.0], r: 0.025 }], { centre: [0, 0, 0] });
  if (variant === 'fruit-bar') vcolor(geo, (x, y, z, c) => { c.set(col); if (fbm(x * 200, y * 200, z * 200) > 0.66) c.set('#2a1a10'); });
  mesh(geo, glaze(variant === 'fruit-bar' ? '#ffffff' : col, { rough: variant === 'fudge' ? 0.6 : 0.15, opacity: variant === 'fudge' ? 1 : 0.95, transparent: variant !== 'fudge', vc: variant === 'fruit-bar' }), { parent: g, at: [-0.01, 0.01, 0], name: 'ice' });
  if (variant === 'fudge') { scatter(g, cached('nutbit2', () => new THREE.DodecahedronGeometry(0.0022, 0)), phys('#e0b880', { rough: 0.7 }), Array.from({ length: 30 }, (_, i) => ({ at: [-0.05 + ((i * 37) % 80) / 1000, 0.0205, ((i * 53) % 40) / 1000 - 0.02] })), 'nuts'); }
  if (trim === 'watermelon' && variant === 'classic') { mesh(roundedBox(0.012, 0.021, 0.052, 0.004), glaze('#3a8a2a'), { parent: g, at: [0.032, 0.0105, 0], name: 'rind' }); }
});
void plasticMat; void liquid; void extrudeOutline; void curveTube; void flesh; void C;
