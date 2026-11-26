/*
 * Drinks: coffee & tea service, cans, bottles, filled glasses, jugs and cartons. Every
 * vessel is hollow with a liquid body inside; labels are brand-free canvas art.
 * Animations: 'steam' (hot drinks), 'open' (can tab / caps), 'lidOpen' (teapot), 'pour'.
 */
import {
  THREE, PI, TAU, mesh, group, curveTube, roundedBox, lathe, scatter, cached, cushion, trayBox,
  cream, glaze, flesh, phys, paperMat, plate, cup, handle, ceramic, clearGlass, liquid, metalMat, plasticMat, foil, woodMat, leafy, waxy, crust,
  vcolor, fbm, toColor, make, vessel, fillGeo, labelTex, canvasTex, steam, clip, rotateTrack, moveTrack, leafGeo, sweep, radiusAt, tube,
} from './common.js';

const mk = (type, variants, fn) => make(type, Object.fromEntries(variants.map((v) => [v, {}])), fn);
function rnd(seed) { let a = 0; for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const iceGeo = () => cached('ice', () => roundedBox(0.022, 0.022, 0.022, 0.004, 2));
const iceMat = () => phys('#f4fbff', { rough: 0.05, cc: 1, opacity: 0.45, depthWrite: false, name: 'ice' });
function ice(parent, inner, y0, y1, n, rand, name = 'ice') {
  const items = [];
  for (let i = 0; i < n; i++) { const y = y0 + 0.012 + ((y1 - y0 - 0.02) * i) / Math.max(1, n - 1); const r = Math.max(0, inner(y) - 0.016); const a = rand() * TAU; items.push({ at: [Math.cos(a) * r * rand(), y, Math.sin(a) * r * rand()], rot: [rand(), rand(), rand()], scale: 0.8 + rand() * 0.3 }); }
  return scatter(parent, iceGeo(), iceMat(), items, name);
}
function straw(parent, from, to, color = '#f25a8a', name = 'straw', bend = true) {
  const pts = bend ? [from, [to[0] * 0.9, to[1] - 0.02, to[2] * 0.9], [to[0], to[1], to[2]], [to[0] + 0.025, to[1] + 0.006, to[2]]] : [from, to];
  return curveTube(pts, 0.003, plasticMat(color, { rough: 0.3 }), { parent, segments: 24, radialSegments: 8, name });
}

/* ============================================================ coffee & tea */
function saucer(parent, r = 0.065, color = '#f6f4ef') {
  mesh(lathe([[0, 0.002], [r * 0.45, 0], [r * 0.5, 0.003], [r * 0.9, 0.008], [r, 0.011], [r * 0.98, 0.0125], [r * 0.88, 0.0095], [r * 0.5, 0.0055], [r * 0.32, 0.006], [0, 0.006]], 48), ceramic(color), { parent, name: 'saucer' });
  return 0.006;
}
function latteArt(kind, base = '#b8743a') {
  return canvasTex(`latte:${kind}:${base}`, 256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); grd.addColorStop(0, '#d8a46a'); grd.addColorStop(0.8, base); grd.addColorStop(1, '#6a3a1a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fbf3e6'; g.strokeStyle = '#fbf3e6';
    if (kind === 'heart') { g.beginPath(); g.moveTo(w / 2, h * 0.78); g.bezierCurveTo(w * 0.1, h * 0.5, w * 0.25, h * 0.18, w / 2, h * 0.36); g.bezierCurveTo(w * 0.75, h * 0.18, w * 0.9, h * 0.5, w / 2, h * 0.78); g.fill(); }
    else if (kind === 'rosetta') { for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(w / 2, h * 0.25 + i * h * 0.07, w * (0.08 + i * 0.03), h * 0.03, 0, 0, PI); g.fill(); } g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h * 0.2); g.lineTo(w / 2, h * 0.85); g.stroke(); }
    else if (kind === 'tulip') { for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(w / 2, h * 0.68 - i * h * 0.13, w * (0.24 - i * 0.04), h * 0.07, 0, PI, TAU); g.fill(); } g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h * 0.25); g.lineTo(w / 2, h * 0.75); g.stroke(); }
    else if (kind === 'foam' || kind === 'cocoa') { g.fillStyle = '#f6ecdc'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.45, 0, TAU); g.fill(); if (kind === 'cocoa') { g.fillStyle = 'rgba(90,50,25,0.75)'; for (let i = 0; i < 600; i++) { g.fillRect(w / 2 + (Math.random() - 0.5) * w * 0.6, h / 2 + (Math.random() - 0.5) * h * 0.6, 2, 2); } } }
    else if (kind === 'crema') { g.fillStyle = 'rgba(230,170,100,0.5)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(w / 2 + Math.cos(i) * w * 0.2, h / 2 + Math.sin(i * 1.7) * h * 0.2, 6, 0, TAU); g.fill(); } }
  });
}
function coffeeCup(parent, ctx, { kind = 'latte', art = 'heart', color = '#f6f4ef', at = [0, 0, 0], name = 'cup', biscuit = false, black = false }) {
  const g = group(name, { parent, at });
  const espresso = kind === 'espresso';
  const sy = saucer(g, espresso ? 0.05 : 0.07, color);
  const dims = espresso ? { rTop: 0.03, rBot: 0.02, h: 0.055, belly: 0.004 } : kind === 'mug' ? { rTop: 0.042, rBot: 0.04, h: 0.095 } : { rTop: 0.048, rBot: 0.026, h: 0.07, belly: 0.006 };
  const c = cup(g, { ...dims, mat: ceramic(color), at: [0, sy, 0], name: `${name}_body` });
  handle(g, { x: dims.rTop - 0.004, y0: sy + dims.h * 0.3, y1: sy + dims.h * 0.82, out: espresso ? 0.018 : 0.026, r: espresso ? 0.004 : 0.005, mat: ceramic(color), name: `${name}_handle` });
  const level = dims.h * 0.86;
  const lq = fillGeo(c.local.inner, c.local.floor, level);
  mesh(lq, liquid(black ? '#2a140a' : '#6a3a1a'), { parent: g, at: [0, sy, 0], name: `${name}_coffee` });
  const topR = c.local.inner(level) - 0.0005;
  const map = latteArt(black ? 'none' : espresso ? 'crema' : art, black ? '#2a140a' : espresso ? '#9a5a2a' : '#b8743a');
  mesh(new THREE.CircleGeometry(topR, 40).rotateX(-PI / 2), phys(black ? '#2a140a' : '#c88a50', { rough: 0.25, cc: 0.6, map, name: 'foam' }), { parent: g, at: [0, sy + level + 0.0004, 0], name: `${name}_top` });
  mesh(roundedBox(0.008, 0.002, 0.09, 0.0008), metalMat('#d8dce0'), { parent: g, at: [espresso ? 0.035 : 0.05, sy + 0.007, 0.012], rot: [0, 0.6, 0.05], name: `${name}_spoon` });
  if (biscuit) mesh(roundedBox(0.03, 0.005, 0.045, 0.002), crust('#c8823a'), { parent: g, at: [-0.04, sy + 0.007, 0.02], rot: [0, 0.4, 0.05], name: `${name}_biscuit` });
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, sy + level, 0], r: topR * 0.8, h: 0.07 })));
  return g;
}
function takeaway(parent, ctx, { trim, name = 'takeaway' }) {
  const g = group(name, { parent });
  const large = trim === 'large';
  const h = large ? 0.15 : trim === 'small' ? 0.09 : 0.12, rTop = large ? 0.046 : 0.042, rBot = 0.03;
  const colors = { kraft: ['#c8a274', '#5a3a22'], black: ['#1e1e20', '#c8a274'], white: ['#f6f4ef', '#2a6a4a'], red: ['#c81e2a', '#fbf6ee'] }[trim] ?? ['#f6f4ef', '#2a6a4a'];
  const tex = labelTex({ bg: colors[0], fg: colors[1], accent: colors[1], brand: 'Bean & Brew', name: 'roasted daily', motif: 'none', w: 1024, h: 512, serif: true, wrap: true });
  const c = cup(g, { rTop, rBot, h, wall: 0.0012, mat: paperMat(colors[0], { map: tex, rough: 0.6 }) });
  mesh(fillGeo(c.local.inner, c.local.floor, h * 0.85), liquid('#5a3018'), { parent: g, name: 'coffee' });
  // sleeve
  const sl = new THREE.CylinderGeometry(rBot + (rTop - rBot) * 0.72 + 0.0018, rBot + (rTop - rBot) * 0.32 + 0.0018, h * 0.4, 40, 1, true);
  vcolor(sl, (x, y, z, col) => col.set('#a8784a').multiplyScalar(0.9 + Math.abs(Math.sin(Math.atan2(z, x) * 40)) * 0.15));
  mesh(sl, paperMat('#fff', { vc: true, side: THREE.DoubleSide }), { parent: g, at: [0, h * 0.52, 0], name: 'sleeve' });
  const lid = group('lid', { parent: g, at: [0, h, 0] });
  mesh(lathe([[rTop + 0.002, -0.004], [rTop + 0.003, 0.002], [rTop - 0.002, 0.008], [rTop * 0.7, 0.01], [rTop * 0.68, 0.014], [rTop * 0.2, 0.015], [0, 0.015]], 40), plasticMat(trim === 'black' ? '#1e1e20' : '#f6f4ef', { rough: 0.35 }), { parent: lid, name: 'lid_shell' });
  mesh(roundedBox(0.014, 0.004, 0.006, 0.0015), plasticMat('#2a2a2a'), { parent: lid, at: [rTop * 0.5, 0.016, 0], name: 'lid_sip' });
  ctx.animations.push(clip('lidOpen', 1, [moveTrack(lid, 1, (t) => [0, Math.min(1, t * 1.3) * 0.04, 0])]));
  ctx.oneShot.push('lidOpen');
  return g;
}
function icedCoffee(parent, ctx, { trim, name = 'iced' }) {
  const g = group(name, { parent });
  const c = cup(g, { rTop: 0.045, rBot: 0.032, h: 0.14, wall: 0.0012, mat: clearGlass('#f2f8fa', { opacity: 0.3 }) });
  const col = trim === 'black' ? '#3a1a0a' : '#a8703a';
  mesh(fillGeo(c.local.inner, c.local.floor, 0.12), liquid(col, { opacity: 0.92, transparent: true }), { parent: g, name: 'coffee' });
  if (trim !== 'black') mesh(fillGeo(c.local.inner, c.local.floor, 0.04), liquid('#f2e6d0', { opacity: 0.85, transparent: true }), { parent: g, name: 'milk' });
  ice(g, c.local.inner, 0.03, 0.12, 6, rnd(name));
  mesh(lathe([[0.047, 0], [0.047, 0.003], [0.03, 0.025], [0, 0.03]], 40), clearGlass('#f2f8fa', { opacity: 0.25 }), { parent: g, at: [0, 0.14, 0], name: 'dome' });
  straw(g, [0.005, 0.02, 0], [0.01, 0.2, 0], '#2a6a4a', 'straw', false);
  if (trim === 'cream' || trim === 'heart') mesh(new THREE.SphereGeometry(0.028, 16, 8, 0, TAU, 0, PI / 2), cream('#fbf6ee'), { parent: g, at: [0, 0.12, 0], name: 'whip' });
  return g;
}
export const createCoffee = mk('coffee', ['espresso', 'cappuccino', 'latte', 'mug', 'takeaway', 'iced'], (ctx) => {
  const { variant, trim, root, o } = ctx;
  const colors = { blue: '#3a6a9a', black: '#1e1e20', green: '#5a8a6a', terracotta: '#c8683a', white: '#f6f4ef' };
  if (variant === 'takeaway') return void takeaway(root, ctx, { trim });
  if (variant === 'iced') return void icedCoffee(root, ctx, { trim });
  if (variant === 'latte') {
    const g = group('latte', { parent: root });
    const sy = saucer(g, 0.06);
    const c = cup(g, { rTop: 0.036, rBot: 0.03, h: 0.13, wall: 0.003, mat: clearGlass(), at: [0, sy, 0], name: 'glass' });
    mesh(fillGeo(c.local.inner, c.local.floor, 0.05), liquid('#f2e6d0'), { parent: g, at: [0, sy, 0], name: 'milk' });
    mesh(fillGeo(c.local.inner, 0.05, 0.1), liquid('#b8783a', { opacity: 0.95, transparent: true }), { parent: g, at: [0, sy, 0], name: 'coffee' });
    mesh(fillGeo(c.local.inner, 0.1, 0.12, { dome: 0.004 }), cream('#fbf3e6'), { parent: g, at: [0, sy, 0], name: 'foam' });
    if (trim === 'cocoa') scatter(g, cached('cocoa', () => new THREE.BoxGeometry(0.0012, 0.0005, 0.0012)), phys('#5a3018'), Array.from({ length: 80 }, (_, i) => ({ at: [Math.cos(i * 2.4) * 0.025 * Math.sqrt(i / 80), sy + 0.124, Math.sin(i * 2.4) * 0.025 * Math.sqrt(i / 80)] })), 'cocoa');
    mesh(roundedBox(0.006, 0.18, 0.004, 0.0015), metalMat('#d8dce0'), { parent: g, at: [0.02, sy + 0.09, 0], rot: [0, 0, -0.18], name: 'long_spoon' });
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, sy + 0.124, 0], r: 0.025 })));
    return;
  }
  const art = ['heart', 'rosetta', 'tulip', 'foam', 'cocoa'].includes(trim) ? trim : variant === 'cappuccino' ? 'foam' : 'heart';
  coffeeCup(root, ctx, { kind: variant, art, color: colors[trim] ?? (o.color && variant === 'mug' ? o.color : '#f6f4ef'), biscuit: trim === 'with-biscuit', black: trim === 'black' || (variant === 'espresso' && trim !== 'with-biscuit' && !['heart', 'rosetta', 'tulip'].includes(trim) && false) });
});
function teapot(parent, ctx, { color = '#f6f4ef', pattern, name = 'teapot', cast = false }) {
  const g = group(name, { parent });
  const prof = cast ? [[0, 0], [0.06, 0], [0.068, 0.01], [0.075, 0.04], [0.07, 0.07], [0.05, 0.085], [0.04, 0.088]] : [[0, 0], [0.05, 0], [0.056, 0.008], [0.07, 0.04], [0.068, 0.08], [0.05, 0.105], [0.038, 0.11]];
  const v = vessel(prof, 0.004);
  let mat = ceramic(color);
  if (pattern) { const tex = canvasTex(`teapat:${pattern}`, 512, 256, (gg, w, h) => { gg.fillStyle = color; gg.fillRect(0, 0, w, h); gg.fillStyle = pattern; for (let i = 0; i < 18; i++) { const x = (i % 6) * w / 6 + 40, y = Math.floor(i / 6) * h / 3 + 40; for (let k = 0; k < 5; k++) { gg.beginPath(); gg.ellipse(x + Math.cos(k * 1.26) * 12, y + Math.sin(k * 1.26) * 12, 9, 5, k * 1.26, 0, TAU); gg.fill(); } } }); mat = ceramic('#ffffff', { map: tex }); }
  if (cast) mat = metalMat(color, { rough: 0.55, metal: 0.7 });
  mesh(v.geo, mat, { parent: g, name: `${name}_body` });
  const rimY = prof[prof.length - 1][1];
  mesh(fillGeo(v.inner, v.floor, rimY * 0.6), liquid('#a8501a', { opacity: 0.9, transparent: true }), { parent: g, name: `${name}_tea` });
  const sp = sweep([[0.06, 0.03, 0], [0.09, 0.05, 0], [0.11, 0.085, 0], [0.125, 0.1, 0]], { r: (t) => 0.012 * (1 - t * 0.55), seg: 20, sides: 14, caps: false });
  mesh(sp, cast ? mat : ceramic(color, { side: THREE.DoubleSide }), { parent: g, name: `${name}_spout` });
  curveTube([[-0.062, 0.085, 0], [-0.095, 0.09, 0], [-0.105, 0.06, 0], [-0.085, 0.03, 0], [-0.066, 0.025, 0]], 0.0065, cast ? mat : ceramic(color), { parent: g, segments: 24, radialSegments: 10, name: `${name}_handle` });
  const lid = group('lid', { parent: g, at: [0, rimY, 0] });
  mesh(lathe([[0.042, 0], [0.042, 0.004], [0.03, 0.014], [0.012, 0.018], [0.01, 0.022], [0.012, 0.03], [0, 0.031]], 32), cast ? mat : ceramic(color), { parent: lid, name: 'lid_cap' });
  ctx.animations.push(clip('lidOpen', 1, [moveTrack(lid, 1, (t) => [0, Math.min(1, t * 1.3) * 0.05, 0])]));
  ctx.animations.push(clip('pour', 2, [rotateTrack(g, 'z', 2, (t) => -Math.sin(Math.min(1, t * 1.5) * PI) * 0.6)]));
  ctx.oneShot.push('lidOpen');
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0.125, 0.1, 0], r: 0.006, n: 2, h: 0.06, name: 'spout_steam' })));
  return g;
}
export const createTea = mk('tea', ['cup', 'teapot', 'mug-bag', 'glass', 'matcha', 'iced'], (ctx) => {
  const { variant, trim, root } = ctx;
  const teaC = { green: '#b8a83a', herbal: '#c84a3a', lemon: '#c8902a', milk: '#c8986a', chai: '#a8703a', black: '#7a3a12', mint: '#9ab83a' }[trim] ?? '#8a3e14';
  if (variant === 'teapot') { teapot(root, ctx, { color: { green: '#8ab89a', herbal: '#f6f4ef', lemon: '#f6e8a0', milk: '#f6f4ef', chai: '#3a3a3e', floral: '#f6f4ef', 'cast-iron': '#2a2a2e' }[trim] ?? '#f6f4ef', pattern: trim === 'floral' ? '#3a6aa8' : trim === 'herbal' ? '#c84a6a' : null, cast: trim === 'cast-iron' || trim === 'chai' }); return; }
  if (variant === 'cup' || variant === 'mug-bag') {
    const g = group('tea', { parent: root });
    const mug = variant === 'mug-bag';
    const sy = mug ? 0 : saucer(g, 0.07);
    const dims = mug ? { rTop: 0.042, rBot: 0.04, h: 0.095 } : { rTop: 0.046, rBot: 0.028, h: 0.06, belly: 0.004 };
    const col = trim === 'green' ? '#e8f0e0' : '#f6f4ef';
    const c = cup(g, { ...dims, mat: ceramic(col), at: [0, sy, 0], name: 'cup' });
    handle(g, { x: dims.rTop - 0.004, y0: sy + dims.h * 0.3, y1: sy + dims.h * 0.82, mat: ceramic(col), name: 'cup_handle' });
    const level = dims.h * 0.85;
    mesh(fillGeo(c.local.inner, c.local.floor, level), liquid(teaC, { opacity: trim === 'milk' ? 1 : 0.88, transparent: trim !== 'milk' }), { parent: g, at: [0, sy, 0], name: 'tea' });
    if (mug || trim === 'herbal') { const top = sy + dims.h; curveTube([[0.0, sy + level - 0.005, 0], [0.01, top + 0.005, 0], [dims.rTop, top + 0.002, 0], [dims.rTop + 0.004, top - 0.03, 0]], 0.0006, phys('#f6f4ef'), { parent: g, segments: 12, radialSegments: 4, name: 'string' }); mesh(roundedBox(0.02, 0.026, 0.002, 0.001), paperMat(trim === 'green' ? '#5a9a3a' : '#c8201a'), { parent: g, at: [dims.rTop + 0.004, top - 0.042, 0.002], name: 'tag' }); mesh(cushion(0.03, 0.006, 0.035, { radius: 0.0025 }), paperMat('#e8dcc0'), { parent: g, at: [0, sy + level - 0.008, 0], rot: [0.4, 0, 0.2], name: 'teabag' }); }
    if (trim === 'lemon') mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 24), flesh('#f6e25a'), { parent: g, at: [0.0, sy + level + 0.002, 0.0], name: 'lemon' });
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, sy + level, 0], r: 0.03 })));
    return;
  }
  if (variant === 'glass') {
    const g = group('mintglass', { parent: root });
    const c = cup(g, { rTop: 0.03, rBot: 0.024, h: 0.1, wall: 0.002, mat: clearGlass('#f2e6c0', { opacity: 0.35 }), belly: -0.003 });
    mesh(fillGeo(c.local.inner, c.local.floor, 0.085), liquid(trim ? teaC : '#b8902a', { opacity: 0.85, transparent: true }), { parent: g, name: 'tea' });
    const band = canvasTex('mintband', 512, 64, (gg, w, h) => { gg.fillStyle = '#d8a83a'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#2a6a8a'; for (let x = 0; x < w; x += 32) { gg.beginPath(); gg.moveTo(x, h); gg.lineTo(x + 16, 0); gg.lineTo(x + 32, h); gg.fill(); } });
    mesh(new THREE.CylinderGeometry(0.0285, 0.0272, 0.02, 32, 1, true), phys('#d8a83a', { metal: 0.6, rough: 0.3, map: band }), { parent: g, at: [0, 0.07, 0], name: 'band' });
    for (let i = 0; i < 3; i++) mesh(leafGeo(0.025, 0.014), leafy('#3a8a2a'), { parent: g, at: [0, 0.085, 0], rot: [0, i * 2, -0.6], name: `mint${i}` });
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, 0.085, 0], r: 0.02 })));
    return;
  }
  if (variant === 'matcha') {
    const g = group('matcha', { parent: root });
    const b = bowl2(g, 0.06, 0.07, '#3a3a34');
    mesh(fillGeo(b.inner, b.floor, 0.055), liquid('#7aa83a', { rough: 0.3 }), { parent: g, name: 'matcha' });
    mesh(new THREE.CircleGeometry(b.inner(0.055) - 0.001, 32).rotateX(-PI / 2), phys('#a8cc6a', { rough: 0.7 }), { parent: g, at: [0, 0.0554, 0], name: 'froth' });
    const wh = group('whisk', { parent: g, at: [0.1, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.05, 12), woodMat('#e8d0a0'), { parent: wh, at: [0, 0.085, 0], name: 'whisk_handle' });
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; curveTube([[Math.cos(a) * 0.008, 0.06, Math.sin(a) * 0.008], [Math.cos(a) * 0.022, 0.025, Math.sin(a) * 0.022], [Math.cos(a) * 0.012, 0.002, Math.sin(a) * 0.012]], 0.0008, woodMat('#e8d0a0'), { parent: wh, segments: 8, radialSegments: 3, name: `tine${i}` }); }
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, 0.055, 0], r: 0.03 })));
    return;
  }
  // iced tea
  const g = group('icedtea', { parent: root });
  const c = cup(g, { rTop: 0.04, rBot: 0.034, h: 0.15, wall: 0.003, mat: clearGlass() });
  mesh(fillGeo(c.local.inner, c.local.floor, 0.13), liquid(trim === 'green' ? '#c8b83a' : trim === 'herbal' ? '#c83a4a' : '#a8501a', { opacity: 0.8, transparent: true }), { parent: g, name: 'tea' });
  ice(g, c.local.inner, 0.03, 0.13, 6, rnd('it' + trim));
  mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.004, 24), flesh('#f6e25a'), { parent: g, at: [0.035, 0.14, 0], rot: [0, 0, PI / 2 - 0.3], name: 'lemon' });
  straw(g, [-0.01, 0.02, 0], [-0.012, 0.2, 0], '#f6f4ef', 'straw', false);
});
function bowl2(parent, r, h, color) { const out = [[0, 0], [r * 0.5, 0], [r * 0.52, 0.006]]; for (let i = 1; i <= 8; i++) { const t = i / 8; out.push([r * (0.52 + 0.48 * Math.sin((t * PI) / 2)), 0.006 + (h - 0.006) * t]); } const v = vessel(out, 0.005); mesh(v.geo, ceramic(color, { rough: 0.5 }), { parent, name: 'bowl' }); return v; }

/* ============================================================ cans */
const CAN = {
  cola: { bg: '#b8141a', fg: '#ffffff', accent: '#6a0a0e', brand: 'FIZZORA', name: 'classic cola', liq: '#3a1408' },
  'lemon-lime': { bg: '#3ab83a', fg: '#ffffff', accent: '#f6e83a', brand: 'ZESTO', name: 'lemon lime', liq: '#e8f0c0' },
  orange: { bg: '#f27a12', fg: '#ffffff', accent: '#2a6aa8', brand: 'SUNPOP', name: 'orange soda', liq: '#f28a12' },
  grape: { bg: '#5a2a8a', fg: '#f6e8ff', accent: '#a86ad8', brand: 'VINELY', name: 'grape fizz', liq: '#5a1a5a' },
  cherry: { bg: '#8a0e2a', fg: '#ffd8e0', accent: '#f23a5a', brand: 'FIZZORA', name: 'cherry cola', liq: '#3a0a10' },
  ginger: { bg: '#e8dcb8', fg: '#2a5a2a', accent: '#c8a03a', brand: 'Kettlewick', name: 'ginger ale', liq: '#e8c88a' },
  'root-beer': { bg: '#5a2e18', fg: '#f6e0b0', accent: '#c88a3a', brand: 'OLD BARREL', name: 'root beer', liq: '#2a1206' },
  energy: { bg: '#1a1a1e', fg: '#7aff3a', accent: '#3a3a40', brand: 'VOLTAGE', name: 'energy', liq: '#e8e83a', motif: 'stripes' },
  'sparkling-water': { bg: '#e8f4fa', fg: '#2a6aa8', accent: '#8ac8e8', brand: 'Brightwell', name: 'sparkling water', liq: '#f2fafc', motif: 'wave' },
  'iced-tea': { bg: '#f2c63a', fg: '#7a3a12', accent: '#e8702a', brand: 'Sunbrook', name: 'peach iced tea', liq: '#c8701a', motif: 'sun' },
  'diet-cola': { bg: '#d8dce0', fg: '#b8141a', accent: '#8a8e92', brand: 'FIZZORA', name: 'zero sugar', liq: '#3a1408' },
};
function can(parent, ctx, { flavour = 'cola', size = 'standard', at = [0, 0, 0], rot = [0, 0, 0], name = 'can', open = true }) {
  const f = CAN[flavour] ?? CAN.cola;
  const S = { standard: [0.033, 0.122], tall: [0.033, 0.168], slim: [0.029, 0.146], mini: [0.029, 0.092] }[size];
  const [R, H] = S;
  const g = group(name, { parent, at, rot });
  const prof = [[0, 0.006], [R * 0.6, 0.0], [R * 0.8, 0.0], [R, 0.01], [R, H - 0.012], [R * 0.86, H - 0.002], [R * 0.86, H]];
  const v = vessel(prof, 0.0004, { seg: 48 });
  mesh(v.geo, metalMat('#d8dce2', { rough: 0.25 }), { parent: g, name: `${name}_body` });
  const tex = labelTex({ bg: f.bg, fg: f.fg, accent: f.accent, brand: f.brand, name: f.name, sub: size === 'tall' ? '500 ml' : '330 ml', motif: f.motif ?? 'band', w: 1024, h: 512, wrap: true });
  mesh(new THREE.CylinderGeometry(R + 0.0003, R + 0.0003, H - 0.024, 48, 1, true), phys(f.bg, { metal: 0.6, rough: 0.28, cc: 0.8, map: tex, name: 'print' }), { parent: g, at: [0, (H - 0.024) / 2 + 0.011, 0], name: `${name}_label` });
  mesh(fillGeo(v.inner, v.floor, H * 0.85), liquid(f.liq), { parent: g, name: `${name}_drink` });
  // lid disc with tab
  const lidY = H - 0.003;
  mesh(new THREE.CylinderGeometry(R * 0.84, R * 0.84, 0.0008, 40), metalMat('#c8ccd2', { rough: 0.3 }), { parent: g, at: [0, lidY, 0], name: `${name}_lid` });
  mesh(new THREE.TorusGeometry(R * 0.86, 0.0012, 6, 40).rotateX(PI / 2), metalMat('#c8ccd2', { rough: 0.3 }), { parent: g, at: [0, H, 0], name: `${name}_rim` });
  const tab = group(`${name}_tab`, { parent: g, at: [0, lidY + 0.0008, 0.002] });
  mesh(roundedBox(0.012, 0.0012, 0.02, 0.0005), metalMat('#b8bcc2', { rough: 0.25 }), { parent: tab, at: [0, 0, -0.005], name: `${name}_tabplate` });
  mesh(roundedBox(0.008, 0.0012, 0.008, 0.002), metalMat('#1e1e20', { rough: 0.6 }), { parent: g, at: [0, lidY + 0.0004, 0.009], name: `${name}_opening` }).visible = true;
  if (open) ctx.animations.push(clip('open', 1, [rotateTrack(tab, 'x', 1, (t) => -Math.min(1, t * 1.5) * 1.3)]));
  if (open) ctx.oneShot.push('open');
  return g;
}
export const createCan = mk('can', ['standard', 'tall', 'slim', 'mini', 'six-pack'], (ctx) => {
  const { variant, trim, root } = ctx;
  const fl = trim ?? 'cola';
  if (variant === 'six-pack') {
    for (let i = 0; i < 6; i++) can(root, ctx, { flavour: fl, at: [(i % 3 - 1) * 0.067, 0, (Math.floor(i / 3) - 0.5) * 0.067], name: `can${i}`, open: i === 0 });
    const ring = new THREE.TorusGeometry(0.03, 0.0015, 4, 32).rotateX(PI / 2);
    for (let i = 0; i < 6; i++) mesh(ring, plasticMat('#e8f0f2', { opacity: 0.6, transparent: true }), { parent: root, at: [(i % 3 - 1) * 0.067, 0.112, (Math.floor(i / 3) - 0.5) * 0.067], name: `ring${i}` });
    return;
  }
  can(root, ctx, { flavour: fl, size: variant });
  if (variant === 'standard') {
    // condensation droplets
    const r2 = rnd(fl); const items = []; for (let i = 0; i < 40; i++) { const a = r2() * TAU, y = 0.015 + r2() * 0.09; items.push({ at: [Math.cos(a) * 0.0336, y, Math.sin(a) * 0.0336], scale: 0.5 + r2() }); }
    scatter(root, cached('drop', () => new THREE.SphereGeometry(0.0012, 6, 4)), phys('#ffffff', { rough: 0, cc: 1, opacity: 0.5, transparent: true }), items, 'droplets');
  }
});

/* ============================================================ bottles */
const BOT = {
  water: { prof: [[0, 0.004], [0.02, 0], [0.032, 0.006], [0.033, 0.03], [0.03, 0.05], [0.033, 0.07], [0.033, 0.15], [0.026, 0.18], [0.013, 0.2], [0.013, 0.215]], glass: '#e8f4fa', op: 0.3, cap: 'screw', capC: '#2a8ad8', label: [0.07, 0.06] },
  juice: { prof: [[0, 0.003], [0.03, 0], [0.034, 0.008], [0.034, 0.14], [0.028, 0.165], [0.02, 0.178], [0.02, 0.19]], glass: '#f6f6f2', op: 0.25, cap: 'screw-wide', capC: '#3a8a2a', label: [0.06, 0.07] },
  soda: { prof: [[0, 0.006], [0.015, 0], [0.026, 0.004], [0.03, 0.02], [0.028, 0.04], [0.032, 0.07], [0.032, 0.13], [0.022, 0.18], [0.012, 0.22], [0.012, 0.235]], glass: '#e8f2ec', op: 0.3, cap: 'screw', capC: '#c81e2a', label: [0.07, 0.04] },
  wine: { prof: [[0, 0.01], [0.02, 0.002], [0.036, 0.004], [0.037, 0.02], [0.037, 0.2], [0.032, 0.235], [0.016, 0.265], [0.0135, 0.28], [0.0135, 0.31], [0.015, 0.314]], glass: '#1e3a1e', op: 0.85, cap: 'foil', capC: '#7a0e1e', label: [0.09, 0.08] },
  beer: { prof: [[0, 0.006], [0.02, 0.0], [0.03, 0.004], [0.031, 0.02], [0.031, 0.12], [0.026, 0.15], [0.014, 0.18], [0.0125, 0.21], [0.0135, 0.214]], glass: '#6a3a0e', op: 0.8, cap: 'crown', capC: '#c8a03a', label: [0.06, 0.05] },
  milk: { prof: [[0, 0.003], [0.035, 0], [0.04, 0.008], [0.04, 0.14], [0.032, 0.175], [0.022, 0.19], [0.022, 0.2]], glass: '#fbfbf8', op: 0.4, cap: 'screw-wide', capC: '#2a6ad8', label: [0.07, 0.06] },
  sports: { prof: [[0, 0.004], [0.03, 0], [0.034, 0.01], [0.03, 0.06], [0.034, 0.1], [0.034, 0.16], [0.024, 0.19], [0.018, 0.2], [0.018, 0.21]], glass: '#f2f2f2', op: 0.3, cap: 'sport', capC: '#1e1e20', label: [0.06, 0.05] },
  sparkling: { prof: [[0, 0.01], [0.02, 0.002], [0.04, 0.004], [0.04, 0.02], [0.04, 0.18], [0.035, 0.22], [0.016, 0.26], [0.0145, 0.29], [0.016, 0.296]], glass: '#2a4a2a', op: 0.85, cap: 'champagne', capC: '#d8b84a', label: [0.07, 0.06] },
  syrup: { prof: [[0, 0.003], [0.03, 0], [0.034, 0.006], [0.034, 0.12], [0.02, 0.16], [0.012, 0.17], [0.012, 0.185]], glass: '#f6f2ea', op: 0.3, cap: 'screw', capC: '#2a2a2e', label: [0.05, 0.06] },
};
const BOT_TRIMS = {
  water: { still: ['#e8f4fa', '#2a8ad8', 'Brightwell', 'spring water'], sparkling: ['#e8f4fa', '#2aa86a', 'Brightwell', 'sparkling'], large: ['#e8f4fa', '#2a8ad8', 'Brightwell', '1.5 L'], glass: ['#e8f4fa', '#1e5a8a', 'Alpenrund', 'mineral'] },
  juice: { orange: ['#f28a12', '#3a8a2a', 'Sunbrook', 'orange juice'], apple: ['#e8c040', '#c81e2a', 'Orchard Lane', 'apple juice'], grape: ['#5a1a4a', '#5a2a8a', 'Vinely', 'grape juice'], tomato: ['#c8201a', '#3a8a2a', 'Redfield', 'tomato juice'], green: ['#7ab83a', '#2a6a2a', 'Leafwell', 'green juice'], cranberry: ['#a8102a', '#5a0a1a', 'Bogberry', 'cranberry'] },
  soda: { cola: ['#3a1408', '#c81e2a', 'FIZZORA', 'cola'], lemon: ['#e8f0c0', '#3ab83a', 'ZESTO', 'lemon lime'], orange: ['#f28a12', '#f27a12', 'SUNPOP', 'orange'], cream: ['#c88a4a', '#5a2a8a', 'Vinely', 'cream soda'] },
  wine: { red: ['#5a0a14', '#7a0e1e', 'Halden Cellars', 'cabernet'], white: ['#e8d88a', '#d8c86a', 'Halden Cellars', 'chardonnay'], rose: ['#f2908a', '#e8a0a0', 'Halden Cellars', 'rosé'] },
  beer: { amber: ['#c8701a', '#c8a03a', 'Copper Hound', 'amber ale'], dark: ['#2a1206', '#1e1e20', 'Copper Hound', 'stout'], green: ['#d8b83a', '#2a6a2a', 'Copper Hound', 'pilsner'] },
  milk: { whole: ['#fbfbf6', '#2a6ad8', 'Meadowmilk', 'whole milk'], chocolate: ['#7a4a2a', '#5a2e18', 'Meadowmilk', 'chocolate'], strawberry: ['#f6b8c8', '#e84a7a', 'Meadowmilk', 'strawberry'], oat: ['#efe2c0', '#c8a060', 'Oatlands', 'oat drink'] },
  sports: { blue: ['#3aa8e8', '#1e1e20', 'SPRINTO', 'cool blue'], red: ['#e83a3a', '#1e1e20', 'SPRINTO', 'fruit punch'], lime: ['#b8e83a', '#1e1e20', 'SPRINTO', 'lime'] },
  sparkling: { brut: ['#f2e6a0', '#d8b84a', 'Maison Lune', 'brut'], rose: ['#f6b0a8', '#e890a0', 'Maison Lune', 'rosé'] },
  syrup: { maple: ['#a8501a', '#c8201a', 'Northwood', 'maple syrup'], honey: ['#e8a01a', '#2a2a2e', 'Golden Hive', 'honey'], 'olive-oil': ['#9aa83a', '#2a5a2a', 'Olivara', 'extra virgin'] },
};
function bottle(parent, ctx, { kind = 'water', trim, at = [0, 0, 0], rot = [0, 0, 0], name = 'bottle', s = 1 }) {
  const b = BOT[kind];
  const tset = BOT_TRIMS[kind];
  const [liq, accent, brand, label] = tset[trim] ?? Object.values(tset)[0];
  const g = group(name, { parent, at, rot });
  const inner = group(`${name}_s`, { parent: g }); inner.scale.setScalar(trim === 'large' ? 1.35 : s);
  let glassTint = b.glass, op = b.op;
  if (kind === 'beer' && trim === 'green') glassTint = '#1e5a1e';
  if (kind === 'wine' && trim !== 'red') { glassTint = trim === 'rose' ? '#f6e8e8' : '#d8e8c8'; op = 0.35; }
  if (kind === 'water' && trim === 'glass') { glassTint = '#a8d0e8'; op = 0.4; }
  const v = vessel(b.prof, 0.002, { seg: 40 });
  mesh(v.geo, phys(glassTint, { rough: 0.05, cc: 1, opacity: op, transparent: true, depthWrite: op > 0.6, name: 'glass' }), { parent: inner, name: `${name}_glass` });
  const H = b.prof[b.prof.length - 1][1];
  const fillTo = kind === 'wine' || kind === 'sparkling' ? H * 0.78 : H * 0.8;
  mesh(fillGeo(v.inner, v.floor, fillTo, { n: 16 }), liquid(liq, { opacity: kind === 'milk' || kind === 'juice' ? 1 : 0.85, transparent: !(kind === 'milk' || kind === 'juice') }), { parent: inner, name: `${name}_liquid` });
  const [ly, lh] = b.label;
  const lr = radiusAt(b.prof, ly) + 0.0006;
  const tex = labelTex({ bg: kind === 'wine' || kind === 'sparkling' ? '#f6efe0' : '#ffffff', fg: '#1e1e20', accent, brand, name: label, motif: kind === 'wine' ? 'frame' : kind === 'beer' ? 'sun' : 'band', serif: kind === 'wine' || kind === 'sparkling' || kind === 'syrup', w: 1024, h: 512, wrap: true });
  mesh(new THREE.CylinderGeometry(lr, lr, lh, 40, 1, true, kind === 'wine' ? -PI / 2 : 0, kind === 'wine' ? PI : TAU), paperMat('#fff', { map: tex, rough: 0.6, side: THREE.DoubleSide }), { parent: inner, at: [0, ly, 0], name: `${name}_label` });
  const neckR = b.prof[b.prof.length - 1][0];
  const cap = group('cap', { parent: inner, at: [0, H, 0] });
  const capM = plasticMat(b.capC, { rough: 0.4 });
  switch (b.cap) {
    case 'screw': mesh(new THREE.CylinderGeometry(neckR + 0.002, neckR + 0.002, 0.018, 24), capM, { parent: cap, at: [0, 0.006, 0], name: 'cap_body' }); break;
    case 'screw-wide': mesh(new THREE.CylinderGeometry(neckR + 0.002, neckR + 0.002, 0.016, 28), capM, { parent: cap, at: [0, 0.005, 0], name: 'cap_body' }); break;
    case 'crown': mesh(new THREE.CylinderGeometry(neckR + 0.0015, neckR + 0.002, 0.006, 21), metalMat(b.capC, { rough: 0.3 }), { parent: cap, at: [0, 0.0, 0], name: 'cap_body' }); break;
    case 'sport': mesh(new THREE.CylinderGeometry(neckR + 0.002, neckR + 0.002, 0.016, 24), capM, { parent: cap, at: [0, 0.005, 0], name: 'cap_body' }); mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.014, 16), capM, { parent: cap, at: [0, 0.019, 0], name: 'cap_spout' }); break;
    case 'foil': mesh(new THREE.CylinderGeometry(neckR + 0.0012, neckR + 0.0012, 0.05, 24), foil(trim === 'red' ? '#7a0e1e' : trim === 'rose' ? '#e8a8b0' : '#d8c86a'), { parent: cap, at: [0, -0.022, 0], name: 'cap_body' }); break;
    case 'champagne': mesh(new THREE.CylinderGeometry(neckR + 0.002, neckR + 0.003, 0.07, 24), foil('#d8b84a'), { parent: cap, at: [0, -0.03, 0], name: 'cap_body' }); mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.014, 16), phys('#d8b88a', { rough: 0.8 }), { parent: cap, at: [0, 0.01, 0], name: 'cork' }); break;
    default: break;
  }
  ctx.animations.push(clip('open', 1, [moveTrack(cap, 1, (t) => [0, Math.min(1, t * 1.3) * 0.04, 0]), rotateTrack(cap, 'y', 1, (t) => Math.min(1, t * 1.3) * 4)]));
  ctx.oneShot.push('open');
  return g;
}
export const createBottle = mk('bottle', Object.keys(BOT), (ctx) => { bottle(ctx.root, ctx, { kind: ctx.variant, trim: ctx.trim }); });

/* ============================================================ glasses */
const GL = {
  tumbler: { prof: [[0, 0], [0.032, 0], [0.034, 0.004], [0.038, 0.09]], wall: 0.003, fill: 0.075 },
  highball: { prof: [[0, 0], [0.03, 0], [0.032, 0.006], [0.032, 0.15]], wall: 0.003, fill: 0.13 },
  smoothie: { prof: [[0, 0], [0.028, 0], [0.03, 0.006], [0.042, 0.16]], wall: 0.003, fill: 0.15 },
  martini: { prof: [[0, 0], [0.035, 0], [0.036, 0.004], [0.004, 0.008], [0.004, 0.1], [0.06, 0.15]], wall: 0.002, fill: 0.14, stem: true },
  margarita: { prof: [[0, 0], [0.035, 0], [0.036, 0.004], [0.004, 0.008], [0.004, 0.07], [0.02, 0.085], [0.025, 0.1], [0.06, 0.12], [0.065, 0.14]], wall: 0.002, fill: 0.128, stem: true },
  wine: { prof: [[0, 0], [0.034, 0], [0.035, 0.004], [0.004, 0.008], [0.004, 0.08], [0.03, 0.1], [0.042, 0.14], [0.036, 0.2]], wall: 0.0018, fill: 0.135, stem: true },
  milkshake: { prof: [[0, 0], [0.03, 0], [0.031, 0.005], [0.01, 0.01], [0.01, 0.03], [0.03, 0.05], [0.045, 0.17]], wall: 0.003, fill: 0.16, stem: true },
  mug: { prof: [[0, 0], [0.04, 0], [0.042, 0.006], [0.042, 0.15]], wall: 0.005, fill: 0.12, handle: true },
  shot: { prof: [[0, 0], [0.02, 0], [0.021, 0.006], [0.024, 0.06]], wall: 0.003, fill: 0.045 },
};
const DRINK = {
  orange: ['#f28a12', 'tumbler', { slice: '#f6a83a' }], apple: ['#e8c040', 'tumbler', {}], water: ['#e8f4fa', 'tumbler', { ice: 3, lemon: true, op: 0.3 }], lemonade: ['#f6ec9a', 'highball', { ice: 5, lemon: true, op: 0.75, straw: '#f6e83a' }],
  strawberry: ['#e8506a', 'smoothie', { straw: '#f25a8a', berry: true }], mango: ['#f6a81a', 'smoothie', { straw: '#3ab83a' }], green: ['#7ab83a', 'smoothie', { straw: '#f6f4ef' }], berry: ['#7a2a5a', 'smoothie', { straw: '#f6f4ef', berry: true }],
  martini: ['#f2f6e8', 'martini', { olive: true, op: 0.5 }], cosmo: ['#e8506a', 'martini', { lime: true, op: 0.8 }], margarita: ['#d8e8a0', 'margarita', { lime: true, salt: true, op: 0.8 }], mojito: ['#e8f6d8', 'highball', { ice: 5, mint: true, lime: true, op: 0.5, straw: '#2a8a2a' }],
  'blue-lagoon': ['#3ab8e8', 'highball', { ice: 4, umbrella: true, op: 0.8, cherry: true }], sunrise: ['#f2701a', 'highball', { ice: 4, sunrise: true, op: 0.9, umbrella: true }],
  'red-wine': ['#5a0a14', 'wine', { op: 0.9 }], 'white-wine': ['#f2e6a0', 'wine', { op: 0.6 }], beer: ['#d8901a', 'mug', { foam: true, op: 0.85 }], stout: ['#1e0e06', 'mug', { foam: true }],
  vanilla: ['#f6eedc', 'milkshake', { whip: true, cherry: true, straw: '#e8203a' }], chocolate: ['#6a3a22', 'milkshake', { whip: true, cherry: true, straw: '#f6f4ef', drizzle: '#3a1e10' }], 'strawberry-shake': ['#f6a8bc', 'milkshake', { whip: true, cherry: true, straw: '#f25a8a', sprinkles: true }],
  espresso: ['#2a140a', 'shot', {}], tequila: ['#f2d88a', 'shot', { lime: true, salt: true, op: 0.7 }],
};
function drinkGlass(parent, ctx, kind, { name = 'glass', at = [0, 0, 0] } = {}) {
  const [col, gk, f] = DRINK[kind] ?? DRINK.orange;
  const G = GL[gk];
  const rand = rnd(name + kind);
  const g = group(name, { parent, at });
  const v = vessel(G.prof, G.wall, { seg: 48 });
  mesh(v.geo, clearGlass(gk === 'mug' ? '#f2f2e8' : '#eef6f8', { opacity: 0.25 }), { parent: g, name: `${name}_glass` });
  if (G.handle) curveTube([[0.044, 0.125, 0], [0.075, 0.12, 0], [0.078, 0.06, 0], [0.044, 0.035, 0]], 0.008, clearGlass('#f2f2e8', { opacity: 0.3 }), { parent: g, segments: 20, radialSegments: 10, name: `${name}_handle` });
  // liquid starts above the stem for stemmed glasses
  let y0 = v.floor;
  if (G.stem) { for (let i = G.prof.length - 1; i > 0; i--) if (G.prof[i][0] <= 0.0045) { y0 = G.prof[i][1] + 0.002; break; } }
  const inner = (y) => Math.max(0.001, v.inner(y));
  const op = f.op ?? 1;
  mesh(fillGeo(inner, y0, G.fill, { n: 14 }), liquid(col, { opacity: op, transparent: op < 1 }), { parent: g, name: `${name}_drink` });
  if (f.sunrise) mesh(fillGeo(inner, y0, y0 + 0.04, { n: 4 }), liquid('#c8201a', { opacity: 0.95, transparent: true }), { parent: g, name: `${name}_grenadine` });
  if (f.ice) ice(g, inner, y0, G.fill, f.ice, rand, `${name}_ice`);
  const topR = inner(G.fill);
  if (f.foam) mesh(fillGeo(inner, G.fill, G.fill + 0.018, { dome: 0.008, n: 3 }), cream('#fbf6e6', { rough: 0.7 }), { parent: g, name: `${name}_foam` });
  if (f.whip) {
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const a = t * TAU * 3; const rr = topR * 0.85 * (1 - t * 0.85); pts.push([Math.cos(a) * rr, G.fill + 0.008 + t * 0.045, Math.sin(a) * rr]); }
    mesh(sweep(pts, { r: (t) => topR * 0.32 * (1 - t * 0.6), ring: (a) => 1 + 0.15 * Math.cos(a * 8), seg: 80, sides: 18 }), cream('#fffaf2'), { parent: g, name: `${name}_whip` });
    if (f.drizzle) curveTube(Array.from({ length: 30 }, (_, i) => { const t = i / 29; const a = t * TAU * 2; return [Math.cos(a) * topR * (0.8 - t * 0.6), G.fill + 0.02 + t * 0.035, Math.sin(a) * topR * (0.8 - t * 0.6)]; }), 0.0016, glaze(f.drizzle), { parent: g, segments: 60, radialSegments: 5, name: `${name}_drizzle` });
    if (f.sprinkles) scatter(g, cached('sprinkle', () => new THREE.CapsuleGeometry(0.0011, 0.005, 2, 5).rotateZ(PI / 2)), phys('#fff', { rough: 0.35 }), Array.from({ length: 30 }, (_, i) => ({ at: [Math.cos(i * 2.4) * topR * 0.5 * (i / 30), G.fill + 0.03 + (1 - i / 30) * 0.02, Math.sin(i * 2.4) * topR * 0.5 * (i / 30)], rot: [0, i, 0], color: ['#ff4f7b', '#ffd23f', '#3ec1ff', '#7be07b'][i % 4] })), `${name}_sprinkles`);
  }
  const rimY = G.prof[G.prof.length - 1][1];
  const rimR = G.prof[G.prof.length - 1][0];
  if (f.cherry) { const cy = f.whip ? G.fill + 0.06 : G.fill + 0.004; mesh(new THREE.SphereGeometry(0.009, 14, 10), waxy('#b8101e', { cc: 1, rough: 0.1 }), { parent: g, at: [f.whip ? 0 : topR * 0.4, cy, 0], name: `${name}_cherry` }); curveTube([[f.whip ? 0 : topR * 0.4, cy + 0.007, 0], [0.004, cy + 0.025, 0], [0.012, cy + 0.035, 0]], 0.0008, phys('#5a7a2a'), { parent: g, segments: 8, radialSegments: 4, name: `${name}_stem` }); }
  if (f.straw) straw(g, [topR * 0.3, y0 + 0.01, 0], [topR * 0.5, rimY + 0.06, 0], f.straw, `${name}_straw`);
  if (f.lemon || f.lime || f.slice) { const c = f.slice ?? (f.lime ? '#8ac83a' : '#f6e25a'); const w = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.005, 24, 1, false, 0, PI), flesh(c), { parent: g, at: [rimR - 0.004, rimY - 0.008, 0], rot: [PI / 2, 0, PI / 2], name: `${name}_garnish` }); void w; }
  if (f.salt) mesh(new THREE.TorusGeometry(rimR - 0.001, 0.0022, 6, 48).rotateX(PI / 2), phys('#ffffff', { rough: 0.9 }), { parent: g, at: [0, rimY - 0.001, 0], name: `${name}_salt` });
  if (f.olive) { tube([0, G.fill - 0.03, 0], [0.02, rimY + 0.03, 0], 0.0012, woodMat('#e8d0a0'), { parent: g, name: `${name}_pick` }); mesh(new THREE.SphereGeometry(0.008, 12, 8).scale(1, 1.25, 1), waxy('#7a8a2a'), { parent: g, at: [0.006, G.fill - 0.01, 0], name: `${name}_olive` }); }
  if (f.mint) for (let i = 0; i < 4; i++) mesh(leafGeo(0.025, 0.014), leafy('#3a8a2a'), { parent: g, at: [Math.cos(i) * 0.008, G.fill + 0.002, Math.sin(i) * 0.008], rot: [0, i * 1.6, -0.5], name: `${name}_mint${i}` });
  if (f.berry) mesh(new THREE.ConeGeometry(0.01, 0.022, 10).rotateX(PI), waxy('#d81e2a', { rough: 0.2 }), { parent: g, at: [rimR - 0.006, rimY, 0], rot: [0, 0, -0.4], name: `${name}_berry` });
  if (f.umbrella) { const um = group(`${name}_umbrella`, { parent: g, at: [-topR * 0.4, G.fill - 0.02, 0], rot: [0, 0, 0.3] }); tube([0, 0, 0], [0, 0.1, 0], 0.0012, woodMat('#e8d8b0'), { parent: um, name: `${name}_um_stick` }); mesh(new THREE.ConeGeometry(0.04, 0.016, 8, 1, true), phys('#f25a8a', { rough: 0.8, side: THREE.DoubleSide }), { parent: um, at: [0, 0.098, 0], name: `${name}_um_top` }); }
  return g;
}
export const createGlass = mk('glass', ['juice', 'smoothie', 'cocktail', 'wine', 'beer', 'milkshake', 'water', 'shot'], (ctx) => {
  const { variant, trim, root } = ctx;
  const def = { juice: 'orange', smoothie: 'strawberry', cocktail: 'martini', wine: 'red-wine', beer: 'beer', milkshake: 'vanilla', water: 'water', shot: 'espresso' }[variant];
  drinkGlass(root, ctx, DRINK[trim] ? trim : def);
});

/* ============================================================ jugs & cartons */
export const createJug = mk('jug', ['pitcher', 'milk-jug', 'carafe'], (ctx) => {
  const { variant, trim, root } = ctx;
  const col = { lemonade: ['#f6ec9a', 0.75], orange: ['#f28a12', 1], water: ['#e8f4fa', 0.3], 'iced-tea': ['#a8501a', 0.8], sangria: ['#7a0e1e', 0.85], milk: ['#fbfbf6', 1] }[trim ?? (variant === 'milk-jug' ? 'milk' : 'lemonade')] ?? ['#f6ec9a', 0.75];
  const g = group('jug', { parent: root });
  const prof = variant === 'carafe' ? [[0, 0], [0.05, 0], [0.055, 0.008], [0.06, 0.06], [0.04, 0.14], [0.03, 0.2], [0.033, 0.22]] : variant === 'milk-jug' ? [[0, 0], [0.045, 0], [0.05, 0.008], [0.055, 0.06], [0.05, 0.12], [0.045, 0.15], [0.05, 0.16]] : [[0, 0], [0.055, 0], [0.058, 0.006], [0.06, 0.18], [0.064, 0.22]];
  const v = vessel(prof, 0.003, { seg: 48 });
  // pour lip
  const p = v.geo.attributes.position; const H = prof[prof.length - 1][1]; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > H - 0.02) { const x = p.getX(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = Math.max(0, Math.cos(a)) ** 6 * (y - (H - 0.02)) / 0.02; p.setX(i, x + k * 0.02); p.setY(i, y + k * 0.008); } }
  v.geo.computeVertexNormals();
  const ceramicJug = variant === 'milk-jug';
  mesh(v.geo, ceramicJug ? ceramic(ctx.o.color && false ? ctx.o.color : '#f6f4ef') : clearGlass('#eef6f8', { opacity: 0.25 }), { parent: g, name: 'jug_body' });
  mesh(fillGeo(v.inner, v.floor, H * 0.75, { n: 12 }), liquid(col[0], { opacity: col[1], transparent: col[1] < 1 }), { parent: g, name: 'liquid' });
  if (variant !== 'carafe') handle(g, { x: -radiusAt(prof, H * 0.5) + 0.004 - 0.0, y0: H * 0.25, y1: H * 0.85, out: -0.035, r: 0.007, mat: ceramicJug ? ceramic('#f6f4ef') : clearGlass('#eef6f8', { opacity: 0.3 }), name: 'jug_handle' });
  if (!ceramicJug && (trim === 'lemonade' || trim === 'water' || trim === 'iced-tea' || !trim)) { ice(g, v.inner, v.floor, H * 0.75, 6, rnd('jug')); for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.005, 24), flesh('#f6e25a', { opacity: 0.9, transparent: true }), { parent: g, at: [Math.cos(i * 2) * 0.02, H * 0.3 + i * 0.04, Math.sin(i * 2) * 0.02], rot: [PI / 2, i, 0], name: `lemon${i}` }); }
  if (trim === 'sangria') scatter(g, cached('scube', () => roundedBox(0.014, 0.014, 0.014, 0.003, 1)), flesh('#f28a12'), Array.from({ length: 10 }, (_, i) => ({ at: [Math.cos(i * 2.4) * 0.03, 0.02 + i * 0.012, Math.sin(i * 2.4) * 0.03], rot: [i, i, 0] })), 'fruit');
  ctx.animations.push(clip('pour', 2, [rotateTrack(g, 'z', 2, (t) => -Math.sin(Math.min(1, t * 1.5) * PI) * 0.7)]));
});
const CARTON = {
  milk: ['#fbfbf6', '#2a6ad8', 'Meadowmilk', 'whole milk', '#ffffff'], chocolate: ['#7a4a2a', '#5a2e18', 'Meadowmilk', 'chocolate milk', '#f6e8d8'], strawberry: ['#f6b8c8', '#e84a7a', 'Meadowmilk', 'strawberry milk', '#ffe8f0'],
  orange: ['#f28a12', '#f27a12', 'Sunbrook', 'orange juice', '#fff4e0'], apple: ['#e8c040', '#3a8a2a', 'Orchard Lane', 'apple juice', '#f6ffe8'], oat: ['#efe2c0', '#c8a060', 'Oatlands', 'oat drink', '#f6f0e0'], soy: ['#f2ead0', '#5a8a3a', 'Leafwell', 'soy drink', '#f6f8ee'],
};
function cartonArt(f) {
  return canvasTex(`carton:${f.join()}`, 512, 512, (g2, w, h) => {
    g2.fillStyle = f[4]; g2.fillRect(0, 0, w, h);
    g2.fillStyle = f[1]; g2.beginPath(); g2.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 8) g2.lineTo(x, h * 0.62 + Math.sin((x / w) * TAU * 1.5) * h * 0.05); g2.lineTo(w, h); g2.lineTo(0, h); g2.fill();
    g2.fillStyle = f[1]; g2.textAlign = 'center'; g2.font = `bold ${w * 0.12}px Georgia, serif`; g2.fillText(f[2], w / 2, h * 0.25);
    g2.font = `${w * 0.08}px Arial, sans-serif`; g2.fillStyle = '#2a2a2a'; g2.fillText(f[3].toUpperCase(), w / 2, h * 0.4);
    g2.fillStyle = f[0]; g2.beginPath(); g2.arc(w / 2, h * 0.52, w * 0.08, 0, TAU); g2.fill();
    g2.fillStyle = '#ffffff'; g2.font = `${w * 0.06}px Arial`; g2.fillText('1 L', w / 2, h * 0.88);
  });
}
export const createCarton = mk('carton', ['gable', 'school', 'juice-box'], (ctx) => {
  const { variant, trim, root } = ctx;
  const f = CARTON[trim ?? (variant === 'juice-box' ? 'apple' : 'milk')] ?? CARTON.milk;
  const tex = cartonArt(f);
  const mat = paperMat('#ffffff', { map: tex, rough: 0.55 });
  const plain = paperMat(f[4], { rough: 0.55 });
  const g = group('carton', { parent: root });
  if (variant === 'juice-box') {
    const W = 0.06, D = 0.04, H = 0.1;
    const geo = roundedBox(W, H, D, 0.003, 2);
    mesh(geo, [plain, plain, plain, plain, mat, mat], { parent: g, at: [0, H / 2, 0], name: 'box' });
    straw(g, [0.015, H - 0.01, 0.005], [0.018, H + 0.07, 0.005], '#f6f4ef', 'straw', false);
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.0015, 12), foil(), { parent: g, at: [0.015, H + 0.0006, 0.005], name: 'hole' });
    return;
  }
  const school = variant === 'school';
  const W = school ? 0.065 : 0.07, H = school ? 0.08 : 0.19;
  // hollow body (open top under the gable)
  trayBox(g, W, H, W, plain, 0.0015, { name: 'body' });
  for (const [i, rot] of [[0, 0], [1, PI / 2], [2, PI], [3, -PI / 2]]) mesh(new THREE.PlaneGeometry(W * 0.98, H * 0.96), mat, { parent: g, at: [Math.sin(rot) * (W / 2 + 0.0004), H / 2, Math.cos(rot) * (W / 2 + 0.0004)], rot: [0, rot, 0], name: `face${i}` });
  // gable roof
  const gh = W * 0.42;
  for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(W, Math.hypot(W / 2, gh)), plain.clone(), { parent: g, at: [0, H + gh / 2, s * W / 4], rot: [s * -(PI / 2 - Math.atan2(gh, W / 2)), 0, 0], name: `roof${s}` }).material.side = THREE.DoubleSide;
  for (const s of [-1, 1]) { const tri = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, gh)]); const tg = new THREE.ShapeGeometry(tri); tg.rotateY(PI / 2); mesh(tg, phys(f[4], { rough: 0.6, side: THREE.DoubleSide }), { parent: g, at: [s * W / 2 * 0.9, H, 0], scale: [1, 1, 0.9], name: `gableend${s}` }); }
  mesh(roundedBox(W, 0.02, 0.004, 0.001), plain, { parent: g, at: [0, H + gh + 0.008, 0], name: 'seal' });
  if (!school) { mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.01, 20), plasticMat(f[1]), { parent: g, at: [0, H + gh * 0.55, W / 4 + 0.004], rot: [PI / 2 - Math.atan2(gh, W / 2) + PI / 2 - PI / 2, 0, 0], name: 'spout' }); }
  else straw(g, [0.01, H - 0.02, 0.0], [0.012, H + gh + 0.05, 0], '#f25a8a', 'straw', false);
});
void crust; void plate; void TAU; void fbm; void toColor;
