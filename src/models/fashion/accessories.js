// Accessories (resting on the ground; o.stand adds the old display stands/pillows/busts): jewellery (rings, necklaces, earrings,
// bracelets, pendants, tiaras) with transmissive gems, coiled belts and neckties on a tie stand.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, paramGeo, taperTube, setup, done, mainMat, fabricMat, gemMat, gemGeo, PRECIOUS, canvasTex, FABRIC_TRIMS } from './common.js';
import { clip, rotateTrack, pingPong, spinTrack } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

/* ================================ SUNGLASSES ================================ */

export const GLASSES_VARIANTS = {
  aviator: { shape: 'aviator', frame: 'wire', fc: '#d4b25e', tint: '#3d4a3a' },
  wayfarer: { shape: 'wayfarer', frame: 'acetate', fc: '#141416', tint: '#1d2a22' },
  round: { shape: 'round', frame: 'wire', fc: '#c9ccd2', tint: '#2a2a2e' },
  'cat-eye': { shape: 'cat', frame: 'acetate', fc: '#7a1f2b', tint: '#2a1a1a' },
  sport: { shape: 'shield', frame: 'acetate', fc: '#e8e8ea', tint: '#c43a1a', mirror: true },
  oversized: { shape: 'big', frame: 'acetate', fc: '#e9d6b4', tint: '#5a3a24' },
};
export const GLASSES_TRIMS = {
  tortoise: { frame: 'acetate', fc: '#5a3016', pattern: 'tortoise', tint: '#4a3020', rim: 1.15 },
  'gold-wire': { frame: 'wire', fc: '#d4b25e', tint: '#3d4a3a', rim: 0.6 },
  'matte-black': { frame: 'acetate', fc: '#18181a', matte: true, tint: '#101214', rim: 1.3 },
  crystal: { frame: 'acetate', fc: '#e8eef2', clear: true, tint: '#6a7a8a' },
  'mirror-blue': { frame: 'acetate', fc: '#1b1b1d', tint: '#2a6fd0', mirror: true },
  'mirror-gold': { frame: 'wire', fc: '#d4b25e', tint: '#d4a03a', mirror: true },
  rose: { frame: 'acetate', fc: '#e8a3b0', tint: '#c8607a', rim: 1.1 },
  white: { frame: 'acetate', fc: '#f4f4f2', tint: '#2a2a2e', rim: 1.25 },
  neon: { frame: 'acetate', fc: '#b8ff1f', tint: '#ff2fa0', mirror: true, rim: 1.2 },
  'gradient-brown': { frame: 'acetate', fc: '#6b4a32', tint: '#8a5a32', rim: 0.9, big: 1.12 },
  kids: { frame: 'acetate', fc: '#219ebc', tint: '#ffb703', scale: 0.78, rim: 1.5 },
};

function lensOutline(shape, big = 1) {
  const pts = [];
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    let x, y;
    if (shape === 'round') { x = c * 0.024; y = s * 0.024; }
    else if (shape === 'aviator') { x = c * 0.029 + (s < 0 ? c * s * -0.004 : 0); y = s < 0 ? s * 0.029 - Math.max(0, c) * s * -0.006 : s * 0.018; x += s < 0 ? 0.002 * (1 + c) : 0; }
    else if (shape === 'wayfarer') { const p = 4; x = Math.sign(c) * Math.abs(c) ** (2 / p) * (0.027 + (s > 0 ? 0.002 : -0.002)); y = Math.sign(s) * Math.abs(s) ** (2 / p) * 0.02; x += s > 0 ? c * 0.002 : 0; }
    else if (shape === 'cat') { const p = 3; x = Math.sign(c) * Math.abs(c) ** (2 / p) * 0.028; y = Math.sign(s) * Math.abs(s) ** (2 / p) * 0.019; if (s > 0 && c > 0) { y += c * s * 0.012; x += c * s * 0.006; } }
    else if (shape === 'big') { const p = 3.2; x = Math.sign(c) * Math.abs(c) ** (2 / p) * 0.032; y = Math.sign(s) * Math.abs(s) ** (2 / p) * 0.028; }
    else { x = c * 0.03; y = s * 0.02; }
    pts.push([x * big, y * big]);
  }
  return pts;
}

/** Tilt an object about X until it rests on both its front and back ends (glasses on a table), then drop it to y=0. */
function restFlat(root, obj) {
  const pts = [];
  const v = new THREE.Vector3();
  const sample = () => {
    pts.length = 0;
    root.updateMatrixWorld(true);
    obj.traverse((m) => {
      if (!m.isMesh) return;
      const p = m.geometry.attributes.position;
      const step = Math.max(1, Math.floor(p.count / 400));
      for (let i = 0; i < p.count; i += step) pts.push(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).clone());
    });
  };
  sample();
  const zs = pts.map((q) => q.z);
  const zmin = Math.min(...zs), zmax = Math.max(...zs), zmid = (zmin + zmax) / 2;
  let best = 0, bestErr = Infinity;
  for (let a = -0.6; a <= 0.6; a += 0.01) {
    obj.rotation.x = a;
    sample();
    const front = Math.min(...pts.filter((q) => q.z > zmid).map((q) => q.y));
    const back = Math.min(...pts.filter((q) => q.z <= zmid).map((q) => q.y));
    const err = Math.abs(front - back);
    if (err < bestErr) { bestErr = err; best = a; }
  }
  obj.rotation.x = best;
  root.updateMatrixWorld(true);
  obj.position.y -= new THREE.Box3().setFromObject(obj).min.y;
}

export function createSunglasses(options = {}) {
  const { o, variant, trim, T } = setup(options, GLASSES_VARIANTS, 'sunglasses', GLASSES_TRIMS);
  const root = group(`sunglasses-${variant}`);
  const sc = T.scale ?? 1;
  const big = T.big ?? 1;
  // stand: acrylic block base + post + nose saddle
  const standM = trim === 'tortoise' || trim === 'gradient-brown' ? M.wood('walnut') : new THREE.MeshPhysicalMaterial({ name: 'acrylic', color: '#cfdde4', roughness: 0.08, transmission: 0.55, thickness: 0.01, ior: 1.49, clearcoat: 1 });
  const cy = 0.13 * sc + 0.02;
  if (o.stand) { // optional acrylic display stand
    mesh(roundedBox(0.1, 0.012, 0.08, 0.005), standM, { parent: root, at: [0, 0.006, -0.03], name: 'stand_base' });
    mesh(roundedBox(0.012, cy - 0.012 - 0.008, 0.008, 0.003), standM, { parent: root, at: [0, 0.012 + (cy - 0.02 - 0.012) / 2, -0.004], name: 'stand_post' });
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 12).rotateX(Math.PI / 2), standM, { parent: root, at: [0, cy - 0.016, -0.004], name: 'saddle' });
  }
  const gl = group('glasses', { parent: root, at: [0, cy, 0] });
  gl.scale.setScalar(sc);
  const frameM = T.clear ? new THREE.MeshPhysicalMaterial({ name: 'acetate', color: T.fc, roughness: 0.05, transmission: 0.85, thickness: 0.004, ior: 1.5 })
    : T.frame === 'wire' ? M.metal(T.fc, 0.2)
      : T.pattern ? fabricMat('tortoise', '#5a3016', { c2: '#2a160a', c3: '#b8742a', repeat: [6, 6] })
        : new THREE.MeshPhysicalMaterial({ name: 'acetate', color: M.toColor(T.fc), roughness: T.matte ? 0.6 : 0.15, clearcoat: T.matte ? 0 : 1 });
  const lensM = new THREE.MeshPhysicalMaterial({ name: 'lens', color: M.toColor(T.tint), metalness: T.mirror ? 0.9 : 0.1, roughness: 0.04, transparent: !T.mirror, opacity: T.mirror ? 1 : 0.82, clearcoat: 1, side: THREE.DoubleSide });
  const shape = T.shape;
  const rimW = 0.0045 * (T.rim ?? 1);
  const lx = shape === 'big' ? 0.037 * big : 0.033 * big;
  const wire = T.frame === 'wire' && shape !== 'shield';
  let outerX = 0;
  if (shape === 'shield') {
    // single wrap-around lens
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; const x = -0.07 + 0.14 * t; const yt = 0.018 + 0.004 * Math.cos(t * Math.PI * 2); const yb = -0.022 + 0.01 * Math.abs(Math.sin(t * Math.PI * 2)) + (Math.abs(x) < 0.012 ? 0.012 * (1 - Math.abs(x) / 0.012) : 0); pts.push([x, yt, yb]); }
    const lensG = paramGeo((u, v) => { const i = Math.round(u * 40); const [x, yt, yb] = pts[i]; return [x, yb + (yt - yb) * v, -x * x * 4]; }, 40, 6);
    mesh(lensG, lensM, { parent: gl, name: 'lens' });
    const top = pts.map(([x, yt]) => [x, yt + 0.003, -x * x * 4]);
    mesh(taperTube(top, 0.004 * (T.rim ?? 1), { flat: 0.6, up: [0, 0, 1], seg: 40, radial: 8 }), frameM, { parent: gl, name: 'frame' });
    outerX = 0.07;
  } else {
    for (const s of [-1, 1]) {
      const pts = lensOutline(shape, big).map(([x, y]) => [s * x + s * lx, y]);
      const lensShape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const lg = new THREE.ShapeGeometry(lensShape, 16);
      mesh(lg, lensM, { parent: gl, name: 'lens' });
      if (wire) {
        mesh(taperTube([...pts, pts[0]].map(([x, y]) => [x, y, 0]), 0.0013 * (T.rim ?? 1) / 0.6 * 0.6 + 0.0004, { seg: 60, radial: 6 }), frameM, { parent: gl, name: 'rim' });
      } else {
        const outer = pts.map(([x, y]) => { const dx = x - s * lx, dy = y; const l = Math.hypot(dx, dy) || 1; return [x + (dx / l) * rimW, y + (dy / l) * rimW + (shape === 'wayfarer' && dy > 0 ? rimW * 0.8 : 0)]; });
        const sh = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
        sh.holes.push(new THREE.Path([...pts].reverse().map(([x, y]) => new THREE.Vector2(x, y))));
        const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.0008, bevelSegments: 2, curveSegments: 8 });
        fg.translate(0, 0, -0.002);
        mesh(fg, frameM, { parent: gl, name: 'rim' });
      }
      outerX = Math.max(outerX, Math.max(...pts.map(([x]) => Math.abs(x))) + (wire ? 0.001 : rimW));
    }
    // bridge
    const by = shape === 'aviator' ? 0.012 : 0.008;
    const ix = lx - (lensOutline(shape, big)[20][0] * -1) + 0.0;
    const inner = Math.max(0.006, lx - Math.abs(lensOutline(shape, big)[20][0]));
    void ix;
    if (wire) {
      curveTube([[-inner - 0.001, by, 0], [0, by + 0.004, 0.002], [inner + 0.001, by, 0]], 0.0012, frameM, { parent: gl, segments: 12, radialSegments: 6, name: 'bridge' });
      if (shape === 'aviator') curveTube([[-lx, 0.0185 * big, 0], [0, 0.02 * big, 0.001], [lx, 0.0185 * big, 0]], 0.0011, frameM, { parent: gl, segments: 16, radialSegments: 6, name: 'brow_bar' });
      for (const s of [-1, 1]) { curveTube([[s * (inner + 0.001), by - 0.004, 0], [s * 0.008, -0.006, -0.008]], 0.0007, frameM, { parent: gl, segments: 4, radialSegments: 4 }); mesh(new THREE.SphereGeometry(0.003, 8, 6).scale(0.6, 1, 0.5), new THREE.MeshPhysicalMaterial({ color: '#f2f2f2', transmission: 0.6, roughness: 0.2 }), { parent: gl, at: [s * 0.008, -0.008, -0.009], name: 'nose_pad' }); }
    } else {
      mesh(taperTube([[-inner - rimW * 0.5, by, 0], [0, by + 0.004, 0.001], [inner + rimW * 0.5, by, 0]], [0.0028 * (T.rim ?? 1), 0.0028 * (T.rim ?? 1)], { flat: 0.8, up: [0, 0, 1], seg: 10, radial: 8 }), frameM, { parent: gl, name: 'bridge' });
    }
  }
  // bridge contact with the saddle
  mesh(roundedBox(0.012, 0.004, 0.008, 0.0018), frameM, { parent: gl, at: [0, -0.0, -0.004], name: 'bridge_pad' });
  mesh(roundedBox(0.008, 0.012, 0.006, 0.002), frameM, { parent: gl, at: [0, -0.006, -0.004], name: 'nose_rest' });
  // hinges + temples (fold animation)
  const anims = [];
  for (const s of [-1, 1]) {
    const hx = s * outerX;
    const hy = shape === 'aviator' ? 0.014 : 0.01;
    mesh(roundedBox(0.006, 0.007, 0.008, 0.002), frameM, { parent: gl, at: [hx - s * 0.002, hy, -0.004], name: 'hinge' });
    const tg = group(`temple_${s > 0 ? 'R' : 'L'}`, { parent: gl, at: [hx, hy, -0.006] });
    const tpts = [[0, 0, 0], [s * 0.004, 0.0, -0.06], [s * 0.006, -0.002, -0.115], [s * 0.006, -0.02, -0.14], [s * 0.005, -0.03, -0.148]];
    if (wire) curveTube(tpts, 0.0011, frameM, { parent: tg, segments: 30, radialSegments: 6, name: 'temple' });
    else mesh(taperTube(tpts, [0.0035 * (T.rim ?? 1), 0.0022], { flat: 0.35, side: [0, 1, 0], seg: 24, radial: 8 }), frameM, { parent: tg, name: 'temple' });
    if (wire) mesh(taperTube(tpts.slice(2), 0.0022, { seg: 10, radial: 8 }), M.plastic('#1b1b1d', 0.4), { parent: tg, name: 'tip' });
    anims.push([tg, s]);
  }
  if (!o.stand) restFlat(root, gl);
  return done(root, 'sunglasses', variant, o, () => [clip('fold', 2.4, anims.map(([tg, s]) => rotateTrack(tg, 'y', 2.4, (t) => -s * pingPong(t) * 1.45)))]);
}

/* ================================== WATCH ================================== */

export const WATCH_VARIANTS = {
  dress: { style: 'dress', cr: 0.019, strap: 'leather', sc: '#3a2618', dial: '#f2efe6', ink: '#1b1b1d' },
  diver: { style: 'diver', cr: 0.021, strap: 'bracelet', sc: '#c9ccd2', dial: '#14243f', ink: '#f2f2f2', bezel: '#1d3b6e' },
  chronograph: { style: 'chrono', cr: 0.021, strap: 'bracelet', sc: '#c9ccd2', dial: '#1b1b1d', ink: '#f2f2f2' },
  smart: { style: 'smart', cr: 0.02, strap: 'rubber', sc: '#1b1b1d', dial: '#05070a', ink: '#5bd6ff' },
  pocket: { style: 'pocket', cr: 0.025, strap: 'chain', sc: '#d4b25e', dial: '#f2ece0', ink: '#1b1b1d' },
};
export const WATCH_TRIMS = {
  steel: { metal: 'steel', strap: 'bracelet', dial: '#dfe3e8', ink: '#1b1b1d' },
  gold: { metal: 'gold', strap: 'bracelet', dial: '#f2e3b8', ink: '#3a2a10' },
  'rose-gold': { metal: 'rose-gold', strap: 'leather', sc: '#5a3a3a', dial: '#f6e6e0', ink: '#5a3030' },
  black: { metal: 'black', strap: 'rubber', sc: '#141416', dial: '#141416', ink: '#e2662b' },
  titanium: { metal: 'titanium', strap: 'bracelet', dial: '#4a5058', ink: '#f2f2f2', big: 1.08 },
  'leather-brown': { metal: 'steel', strap: 'leather', sc: '#6b4a32', dial: '#f2efe6', ink: '#1b1b1d' },
  'rubber-orange': { metal: 'steel', strap: 'rubber', sc: '#e2662b', dial: '#1b1b1d', ink: '#e2662b', big: 1.1 },
  mesh: { metal: 'steel', strap: 'mesh', dial: '#2a3f5a', ink: '#f2f2f2', slim: true },
  'two-tone': { metal: 'two-tone', strap: 'bracelet', dial: '#e9e3d4', ink: '#3a2a10' },
  vintage: { metal: 'gold', strap: 'leather', sc: '#3a2618', dial: '#efe2c0', ink: '#3a2a1a', small: 0.88 },
  diamond: { metal: 'platinum', strap: 'bracelet', dial: '#e8ecf2', ink: '#1b1b1d', gems: true },
  kids: { metal: 'plastic', strap: 'rubber', sc: '#219ebc', dial: '#ffb703', ink: '#1b1b1d', big: 1.15, kid: true },
};

function watchDial(T, r) {
  const tex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = T.dial;
    g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = T.ink; g.fillStyle = T.ink;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const L = i % 5 ? 8 : 20;
      g.lineWidth = i % 5 ? 2 : 6;
      g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * 118, h / 2 - Math.cos(a) * 118); g.lineTo(w / 2 + Math.sin(a) * (118 - L), h / 2 - Math.cos(a) * (118 - L)); g.stroke();
    }
    if (T.style === 'dress' || T.style === 'pocket') {
      g.font = 'bold 28px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['XII', 'III', 'VI', 'IX'].forEach((t, i) => { const a = (i / 4) * Math.PI * 2; g.fillText(t, w / 2 + Math.sin(a) * 78, h / 2 - Math.cos(a) * 78); });
    }
    if (T.style === 'chrono') for (const [dx, dy] of [[-50, 0], [50, 0], [0, 50]]) { g.lineWidth = 3; g.beginPath(); g.arc(w / 2 + dx, h / 2 + dy, 26, 0, Math.PI * 2); g.stroke(); }
    if (T.style === 'diver') { g.fillStyle = '#9ef5c8'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.arc(w / 2 + Math.sin(a) * 96, h / 2 - Math.cos(a) * 96, 7, 0, Math.PI * 2); g.fill(); } }
  });
  return new THREE.MeshPhysicalMaterial({ name: 'dial', color: tex ? '#ffffff' : T.dial, map: tex, roughness: 0.35, clearcoat: 0.5 });
}

function caseMetal(T) {
  if (T.metal === 'gold') return PRECIOUS.gold();
  if (T.metal === 'rose-gold') return PRECIOUS['rose-gold']();
  if (T.metal === 'black') return PRECIOUS.black();
  if (T.metal === 'titanium') return M.metal('#8d939c', 0.4);
  if (T.metal === 'platinum') return PRECIOUS.platinum();
  if (T.metal === 'plastic') return M.plastic(T.sc ?? '#219ebc', 0.35);
  if (T.style === 'pocket') return PRECIOUS.gold();
  return M.metal('#cfd3d8', 0.18);
}

/** Watch head: case + dial + hands, local +Y is the face normal. */
function watchHead(parent, T, caseM, r, anims) {
  const head = group('watch_head', { parent });
  const hgt = (T.slim ? 0.008 : T.style === 'diver' ? 0.013 : 0.011) * (T.kid ? 1.2 : 1);
  if (T.style === 'smart') {
    mesh(roundedBox(r * 2, hgt, r * 2.35, r * 0.45), caseM, { parent: head, at: [0, hgt / 2, 0] });
    const scr = new THREE.MeshStandardMaterial({ name: 'screen', color: '#05070a', emissive: '#5bd6ff', emissiveIntensity: 0.0, roughness: 0.2 });
    const tex = canvasTex(160, 188, (g, w, h) => { g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h); g.fillStyle = T.ink; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText('10:09', w / 2, h / 2 + 10); g.strokeStyle = '#ff4d6d'; g.lineWidth = 8; g.beginPath(); g.arc(w / 2, h / 2, 72, -1.5, 2.6); g.stroke(); });
    if (tex) { scr.map = tex; scr.emissiveMap = tex; scr.color.set('#ffffff'); }
    const sp = mesh(roundedBox(r * 1.76, 0.001, r * 2.1, r * 0.38), scr, { parent: head, at: [0, hgt + 0.0002, 0], name: 'screen' });
    void sp;
    mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.004, 16).rotateZ(Math.PI / 2), caseM, { parent: head, at: [r + 0.002, hgt * 0.6, r * 0.4] });
    anims.push({ screen: true });
    return { head, hgt };
  }
  mesh(lathe([[0, 0], [r * 0.92, 0], [r, hgt * 0.25], [r, hgt * 0.8], [r * 0.93, hgt], [r * 0.83, hgt], [r * 0.83, hgt - 0.0022], [0, hgt - 0.0022]], 48), caseM, { parent: head, name: 'case' });
  if (T.style === 'diver' || T.gems) {
    const bz = mesh(lathe([[r * 0.8, hgt], [r * 1.02, hgt], [r * 1.03, hgt + 0.002], [r * 0.82, hgt + 0.0025], [r * 0.8, hgt]], 48), T.gems ? caseM : M.plastic(T.bezel ?? '#1d3b6e', 0.25), { parent: head, name: 'bezel' });
    void bz;
    if (T.gems) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; mesh(gemGeo(0.0017), gemMat('#ffffff'), { parent: head, at: [Math.sin(a) * r * 0.91, hgt + 0.0028, Math.cos(a) * r * 0.91] }); }
  }
  mesh(new THREE.CircleGeometry(r * 0.82, 48).rotateX(-Math.PI / 2), watchDial(T, r), { parent: head, at: [0, hgt - 0.0015, 0], name: 'dial' });
  const hands = group('hands', { parent: head, at: [0, hgt - 0.001, 0] });
  const handM = T.ink === '#f2f2f2' ? M.metal('#e8e8ea', 0.2) : M.metal('#2a2a2e', 0.3);
  mesh(roundedBox(0.0018, 0.0006, r * 0.5, 0.0003), handM, { parent: hands, at: [0, 0.0003, -r * 0.22], rot: [0, 0.9, 0], name: 'hour' });
  mesh(roundedBox(0.0014, 0.0006, r * 0.72, 0.0003), handM, { parent: hands, at: [Math.sin(-0.5) * r * 0.33, 0.0006, -Math.cos(-0.5) * r * 0.33], rot: [0, 0.5, 0], name: 'minute' });
  const sec = group('second_hand', { parent: hands });
  mesh(roundedBox(0.0006, 0.0004, r * 0.78, 0.0001), M.plastic('#d7263d', 0.4), { parent: sec, at: [0, 0.0009, -r * 0.3] });
  mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.0016, 12), handM, { parent: hands, at: [0, 0.0006, 0] });
  anims.push({ sec });
  // crystal
  const cr = new THREE.SphereGeometry(r * 3, 40, 8, 0, Math.PI * 2, 0, Math.asin(0.86 / 3));
  cr.translate(0, -r * 3 * Math.cos(Math.asin(0.86 / 3)), 0);
  mesh(cr, new THREE.MeshPhysicalMaterial({ name: 'crystal', color: '#ffffff', roughness: 0, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.12, depthWrite: false }), { parent: head, at: [0, hgt + 0.0005, 0], name: 'crystal' });
  // crown + pushers
  mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.004, 14).rotateZ(Math.PI / 2), caseM, { parent: head, at: [r + 0.0018, hgt * 0.5, 0], name: 'crown' });
  if (T.style === 'chrono') for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.004, 10).rotateZ(Math.PI / 2), caseM, { parent: head, at: [r * 0.93 + 0.0015, hgt * 0.5, z * r * 0.42], rot: [0, z * 0.5, 0] });
  // lugs
  if (T.style !== 'pocket') for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.0022, hgt * 0.45, 0.007, 0.0008), caseM, { parent: head, at: [sx * r * 0.5, hgt * 0.3, sz * (r + 0.0005)] });
  return { head, hgt };
}

export function createWatch(options = {}) {
  const { o, variant, trim, T } = setup(options, WATCH_VARIANTS, 'watch', WATCH_TRIMS);
  const root = group(`watch-${variant}`);
  const r = T.cr * (T.big ?? 1) * (T.small ?? 1);
  const caseM = caseMetal(T);
  const anims = [];
  const baseM = trim === 'kids' ? M.plastic('#ff4d6d', 0.4) : trim === 'gold' || trim === 'vintage' ? M.wood('walnut') : fabricMat('leather', '#1b1b1d', { plain: true });
  if (variant === 'pocket') {
    // optional display dome with a hook arm; the watch hangs from its chain
    if (o.stand) mesh(lathe([[0, 0], [0.05, 0], [0.052, 0.006], [0.045, 0.014], [0, 0.016]], 40), baseM, { parent: root, name: 'stand_base' });
    if (o.stand) mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.13, 10), M.metal('#d4b25e', 0.25), { parent: root, at: [0, 0.016 + 0.065, -0.02] });
    if (o.stand) curveTube([[0, 0.144, -0.02], [0, 0.152, -0.012], [0, 0.148, 0.0], [0, 0.14, 0.004]], 0.0025, M.metal('#d4b25e', 0.25), { parent: root, segments: 12, radialSegments: 6, name: 'hook' });
    const wy = 0.14 - 0.03 - r;
    const holder = group('swing', { parent: root, at: [0, 0.14, 0.004] });
    // chain
    for (let i = 0; i < 6; i++) { const l = mesh(new THREE.TorusGeometry(0.0028, 0.0008, 6, 10), caseM, { parent: holder, at: [0, -0.002 - i * 0.0045, 0], rot: [0, i % 2 ? Math.PI / 2 : 0, 0], name: 'chain' }); void l; }
    mesh(new THREE.TorusGeometry(0.005, 0.0012, 6, 16), caseM, { parent: holder, at: [0, -0.031, 0], name: 'bow' });
    mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.005, 12), caseM, { parent: holder, at: [0, -0.037, 0], name: 'stem' });
    const face = group('face', { parent: holder, at: [0, wy - 0.14 + 0.002, -0.0055], rot: [Math.PI / 2, 0, 0] });
    watchHead(face, { ...T, style: 'pocket' }, caseM, r, anims);
    if (!o.stand) {
      // no stand: the pocket watch lies face-up on the ground, chain trailing from the bow
      holder.rotation.x = -Math.PI / 2;
      holder.updateMatrixWorld(true);
      holder.position.y -= new THREE.Box3().setFromObject(holder).min.y;
    }
    return done(root, 'watch', variant, o, () => [clip('tick', 60, [spinTrack(anims.find((a) => a.sec).sec, 'y', 60, -1)]), clip('swing', 2, [rotateTrack(holder, 'z', 2, (t) => Math.sin(t * Math.PI * 2) * 0.12)])]);
  }
  // optional pillow display; without it the buckled watch lies on its side on the ground
  const wg = o.stand ? root : group('watch', { parent: root });
  if (o.stand) mesh(roundedBox(0.11, 0.016, 0.09, 0.006), baseM, { parent: root, at: [0, 0.008, 0], name: 'stand_base' });
  const pr = 0.03;
  const pillowM = fabricMat('suede', trim === 'kids' ? '#ffffff' : '#e9e3d6', { plain: true });
  const pillow = lathe([[0, -0.035], [pr * 0.7, -0.035], [pr * 0.95, -0.03], [pr, -0.02], [pr, 0.02], [pr * 0.95, 0.03], [pr * 0.7, 0.035], [0, 0.035]], 32);
  pillow.rotateZ(Math.PI / 2);
  const py = 0.016 + pr - 0.002;
  if (o.stand) mesh(pillow, pillowM, { parent: root, at: [0, py, 0], name: 'pillow' });
  // strap loop around the pillow (YZ plane)
  const R0 = pr + 0.0025;
  const wS = (T.slim ? 0.018 : 0.02) * (T.kid ? 1.1 : 1);
  const strapM = T.strap === 'leather' ? fabricMat('leather', T.sc ?? '#3a2618', { plain: true }) : T.strap === 'rubber' ? new THREE.MeshPhysicalMaterial({ name: 'rubber', color: M.toColor(T.sc ?? '#1b1b1d'), roughness: 0.6, clearcoat: 0.2 }) : T.metal === 'two-tone' ? M.metal('#cfd3d8', 0.2) : caseM;
  const tilt = 0.55;
  const loop = [];
  for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; loop.push([0, py + Math.cos(a) * R0, Math.sin(a) * R0]); }
  if (T.strap === 'bracelet') {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      if (Math.abs(((a - tilt + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.42) continue;
      const lk = mesh(roundedBox(wS, 0.0035, 0.0072, 0.0012), i % 2 && T.metal === 'two-tone' ? PRECIOUS.gold() : strapM, { parent: wg, at: [0, py + Math.cos(a) * (R0 + 0.0005), Math.sin(a) * (R0 + 0.0005)], rot: [a, 0, 0], name: 'link' });
      void lk;
      if (i % 2 === 0) mesh(roundedBox(wS * 0.4, 0.0042, 0.0074, 0.0012), T.metal === 'two-tone' ? PRECIOUS.gold() : strapM, { parent: wg, at: [0, py + Math.cos(a) * (R0 + 0.0008), Math.sin(a) * (R0 + 0.0008)], rot: [a, 0, 0] });
    }
  } else {
    mesh(taperTube(loop, wS / 2, { flat: T.strap === 'rubber' ? 0.3 : 0.2, side: [1, 0, 0], seg: 60, radial: 10 }), T.strap === 'mesh' ? M.metal('#bfc4ca', 0.35) : strapM, { parent: wg, name: 'strap' });
    if (T.strap === 'leather') for (const s of [-1, 1]) mesh(taperTube(loop.map(([x, y, z]) => [s * wS * 0.4, py + (y - py) * 1.03, z * 1.03]), 0.0004, { seg: 60, radial: 4 }), M.matte('#efe2c4'), { parent: wg, name: 'stitch' });
    // buckle under the pillow
    mesh(roundedBox(wS * 1.15, 0.003, 0.012, 0.0012), caseM, { parent: wg, at: [0, py - R0 - 0.0005, -0.006], name: 'buckle' });
  }
  const mount = group('mount', { parent: wg, at: [0, py + Math.cos(tilt) * (R0 + 0.001), Math.sin(tilt) * (R0 + 0.001)], rot: [tilt, 0, 0] });
  watchHead(mount, { ...T }, caseM, r, anims);
  const brandAt = anims.find((a) => a.sec);
  if (o.stand) {
    const em = brandEmblem(0.022);
    em.position.set(0, 0.0161, 0.045 + 0.0002);
    root.add(em);
  } else {
    wg.rotation.z = Math.PI / 2;
    wg.position.x = py;
    wg.updateMatrixWorld(true);
    wg.position.y -= new THREE.Box3().setFromObject(wg).min.y;
  }
  return done(root, 'watch', variant, o, () => brandAt ? [clip('tick', 60, [spinTrack(brandAt.sec, 'y', 60, -1)])] : [new THREE.AnimationClip('on', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 1], [1.4, 1.4])])]);
}

/* ================================ JEWELLERY ================================ */

export const JEWEL_VARIANTS = {
  ring: { piece: 'ring' },
  necklace: { piece: 'necklace' },
  earrings: { piece: 'earrings' },
  bracelet: { piece: 'bracelet' },
  pendant: { piece: 'pendant' },
  tiara: { piece: 'tiara' },
};
export const JEWEL_TRIMS = {
  diamond: { metal: 'platinum', gem: '#ffffff', cut: 'round' },
  ruby: { metal: 'gold', gem: '#c0102a', cut: 'oval', ior: 1.77 },
  sapphire: { metal: 'silver', gem: '#1c3fae', cut: 'oval', ior: 1.77 },
  emerald: { metal: 'gold', gem: '#0f8a4a', cut: 'emerald', ior: 1.58 },
  amethyst: { metal: 'rose-gold', gem: '#8e4bc4', cut: 'pear', ior: 1.54 },
  pearl: { metal: 'gold', gem: '#f4eee4', cut: 'pearl', pearl: true },
  gold: { metal: 'gold', gem: null, cut: 'round' },
  'rose-gold': { metal: 'rose-gold', gem: '#f2a6b8', cut: 'heart', ior: 1.58 },
  silver: { metal: 'silver', gem: '#6fc3e8', cut: 'round', ior: 1.62 },
  platinum: { metal: 'platinum', gem: '#ffffff', cut: 'emerald' },
  onyx: { metal: 'black', gem: '#141416', cut: 'round', ior: 1.55, opaque: true },
};

function gemOf(T, r) {
  if (!T.gem) return { geo: new THREE.SphereGeometry(r * 0.8, 16, 12), mat: PRECIOUS[T.metal]() };
  if (T.pearl) return { geo: gemGeo(r * 0.9, { cut: 'pearl' }), mat: new THREE.MeshPhysicalMaterial({ name: 'pearl', color: T.gem, roughness: 0.18, sheen: 1, sheenColor: new THREE.Color('#ffd9e8'), clearcoat: 1, iridescence: 0.6 }) };
  if (T.opaque) return { geo: gemGeo(r, { cut: T.cut }), mat: new THREE.MeshPhysicalMaterial({ name: 'onyx', color: T.gem, roughness: 0.08, clearcoat: 1, flatShading: true }) };
  return { geo: gemGeo(r, { cut: T.cut }), mat: gemMat(T.gem, { ior: T.ior ?? 2.42 }) };
}

/** Velvet neck bust for necklaces / pendants. Returns the chest front z and neck sizes. */
function bust(parent, velvet, woodM) {
  mesh(roundedBox(0.16, 0.025, 0.1, 0.008), woodM, { parent, at: [0, 0.0125, 0], name: 'plinth' });
  const chest = extrudeOutline([[-0.075, 0], [0.075, 0], [0.085, 0.09], [0.06, 0.15], [0.035, 0.17], [-0.035, 0.17], [-0.06, 0.15], [-0.085, 0.09]], 0.05, { bevel: 0.012, segments: 4 });
  mesh(chest, velvet, { parent, at: [0, 0.025, 0], name: 'chest' });
  mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.09, 32), velvet, { parent, at: [0, 0.025 + 0.17 + 0.03, -0.004], name: 'neck' });
  mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.006, 32), woodM, { parent, at: [0, 0.025 + 0.17 + 0.078, -0.004], name: 'neck_cap' });
  return { front: 0.025, top: 0.025 + 0.17, neckR: 0.028 };
}

export function createJewellery(options = {}) {
  const { o, variant, trim, T: T0 } = setup(options, JEWEL_VARIANTS, 'jewellery', JEWEL_TRIMS);
  const T = trim ? T0 : { ...T0, metal: 'gold', gem: '#ffffff', cut: 'round' };
  const root = group(`jewellery-${variant}`);
  const metalM = PRECIOUS[T.metal]();
  const velvet = fabricMat('velvet', T.metal === 'black' ? '#e8e2d8' : T.metal === 'silver' || T.metal === 'platinum' ? '#1d2a4a' : '#141416', { plain: true });
  const woodM = M.wood(T.metal === 'black' ? 'white' : 'walnut');
  const anims = [];
  const piece = T.piece;
  if (piece === 'ring' && !o.stand) {
    // no box: the ring lies on its side on the ground, tipped onto its setting
    const rr = 0.0095;
    const ring = group('ring', { parent: root });
    const rb = group('ring_body', { parent: ring, rot: [-Math.PI / 2, 0, 0] });
    mesh(new THREE.TorusGeometry(rr, 0.0013 * (T.gem ? 1 : 1.6), 12, 48), metalM, { parent: rb, name: 'band' });
    if (T.gem) {
      const g = gemOf(T, 0.0042);
      mesh(new THREE.CylinderGeometry(0.0025, 0.0014, 0.003, 12), metalM, { parent: rb, at: [0, rr + 0.0015, 0], name: 'setting' });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; curveTube([[Math.cos(a) * 0.0018, rr + 0.002, Math.sin(a) * 0.0018], [Math.cos(a) * 0.0036, rr + 0.0045, Math.sin(a) * 0.0036], [Math.cos(a) * 0.003, rr + 0.0066, Math.sin(a) * 0.003]], 0.0004, metalM, { parent: rb, segments: 6, radialSegments: 4 }); }
      mesh(g.geo, g.mat, { parent: rb, at: [0, rr + 0.0055, 0], name: 'gem' });
      for (const s of [-1, 1]) mesh(gemGeo(0.0014), gemMat('#ffffff'), { parent: rb, at: [s * 0.0035, rr + 0.0005, 0], rot: [0, 0, -s * 0.5] });
      restFlat(root, ring);
    } else {
      mesh(new THREE.TorusGeometry(rr + 0.0012, 0.0009, 8, 48), metalM, { parent: rb, name: 'band_ridge' });
      ring.updateMatrixWorld(true);
      ring.position.y -= new THREE.Box3().setFromObject(ring).min.y;
    }
    return done(root, 'jewellery', variant, o);
  }
  if (piece === 'ring') {
    // ring box (o.stand): hollow base + hinged lid
    const W = 0.06, H = 0.032, D = 0.058, t = 0.004;
    const boxM = fabricMat('velvet', T.metal === 'rose-gold' ? '#d97a8a' : T.metal === 'black' ? '#1b1b1d' : '#5a1020', { plain: true });
    const box = group('box', { parent: root });
    mesh(roundedBox(W, t, D, 0.0018), boxM, { parent: box, at: [0, t / 2, 0] });
    for (const s of [-1, 1]) {
      mesh(roundedBox(t, H, D, 0.0018), boxM, { parent: box, at: [s * (W / 2 - t / 2), H / 2, 0] });
      mesh(roundedBox(W, H, t, 0.0018), boxM, { parent: box, at: [0, H / 2, s * (D / 2 - t / 2)] });
    }
    const insert = fabricMat('velvet', '#f2ece0', { plain: true });
    for (const s of [-1, 1]) mesh(cushion(W - 2 * t, H * 0.55, (D - 2 * t) / 2 - 0.0012, { bulge: 0.3 }), insert, { parent: box, at: [0, t + H * 0.275, s * ((D - 2 * t) / 4 + 0.0006)] });
    const lid = group('lid', { parent: box, at: [0, H, -D / 2] });
    const lidInner = group('lid_body', { parent: lid, rot: [-1.85, 0, 0] });
    mesh(roundedBox(W, t, D, 0.0018), boxM, { parent: lidInner, at: [0, t / 2 + 0.0002, D / 2] });
    for (const s of [-1, 1]) mesh(roundedBox(t, H * 0.45, D, 0.0018), boxM, { parent: lidInner, at: [s * (W / 2 - t / 2), H * 0.225, D / 2] });
    mesh(roundedBox(W, H * 0.45, t, 0.0018), boxM, { parent: lidInner, at: [0, H * 0.225, D - t / 2] });
    mesh(roundedBox(W - 2 * t, 0.001, D - 2 * t, 0.0004), fabricMat('silk', '#f4f0e6', { plain: true }), { parent: lidInner, at: [0, t + 0.0007, D / 2] });
    anims.push(lid);
    // the ring standing in the slit
    const rr = 0.0095;
    const ringY = t + H * 0.55 + rr * 0.5;
    const ring = group('ring', { parent: root, at: [0, ringY, 0] });
    mesh(new THREE.TorusGeometry(rr, 0.0013 * (T.gem ? 1 : 1.6), 12, 48), metalM, { parent: ring, name: 'band' });
    const g = gemOf(T, T.gem ? 0.0042 : 0.003);
    if (T.gem) {
      mesh(new THREE.CylinderGeometry(0.0025, 0.0014, 0.003, 12), metalM, { parent: ring, at: [0, rr + 0.0015, 0], name: 'setting' });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; curveTube([[Math.cos(a) * 0.0018, rr + 0.002, Math.sin(a) * 0.0018], [Math.cos(a) * 0.0036, rr + 0.0045, Math.sin(a) * 0.0036], [Math.cos(a) * 0.003, rr + 0.0066, Math.sin(a) * 0.003]], 0.0004, metalM, { parent: ring, segments: 6, radialSegments: 4 }); }
      mesh(g.geo, g.mat, { parent: ring, at: [0, rr + 0.0055, 0], name: 'gem' });
      for (const s of [-1, 1]) mesh(gemGeo(0.0014), gemMat('#ffffff'), { parent: ring, at: [s * 0.0035, rr + 0.0005, 0], rot: [0, 0, -s * 0.5] });
    } else {
      mesh(new THREE.TorusGeometry(rr + 0.0012, 0.0009, 8, 48), metalM, { parent: ring, name: 'band_ridge' });
    }
    return done(root, 'jewellery', variant, o, () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => pingPong(t) * 1.6)])]);
  }
  if ((piece === 'necklace' || piece === 'pendant') && !o.stand) {
    // no bust: the closed chain lies flat on the ground in a soft teardrop, stones face-up
    const cr = piece === 'pendant' ? 0.0009 : 0.0014;
    const R0 = 0.065;
    const drop = piece === 'pendant' ? 0.05 : 0.03;
    const pts = [];
    const n = 32;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const front = Math.max(0, Math.cos(a));
      pts.push([Math.sin(a) * R0 * (1 - 0.15 * front), cr, Math.cos(a) * R0 + front ** 3 * drop]);
    }
    curveTube(pts, cr, metalM, { parent: root, segments: 160, radialSegments: 6, closed: true, name: 'chain' });
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), true);
    if (piece === 'necklace') {
      const k = T.pearl ? 48 : 15;
      for (let i = 0; i < k; i++) {
        const t = T.pearl ? i / k : -0.12 + (i / (k - 1)) * 0.24;
        const p = curve.getPointAt((t + 1) % 1);
        const centre = !T.pearl && Math.abs(i - (k - 1) / 2) < 0.6;
        const gr = T.pearl ? 0.0042 : centre ? 0.0055 : 0.0032;
        const g = gemOf(T, gr);
        mesh(g.geo, g.mat, { parent: root, at: [p.x, T.pearl ? gr : gr * 0.86, p.z], name: 'gem' });
      }
    } else {
      const p = curve.getPointAt(0.0);
      mesh(new THREE.TorusGeometry(0.0025, 0.0007, 6, 12).rotateX(Math.PI / 2), metalM, { parent: root, at: [p.x, 0.0007, p.z + 0.002], name: 'bail' });
      const g = gemOf(T, 0.008);
      const pend = group('pendant', { parent: root, at: [p.x, 0.004, p.z + 0.0125], rot: [-Math.PI / 2, 0, 0] });
      mesh(lathe([[0.006, -0.004], [0.0095, 0], [0.0095, 0.0016], [0.006, 0.002]], 24).rotateX(Math.PI / 2), metalM, { parent: pend, name: 'bezel' });
      mesh(g.geo, g.mat, { parent: pend, at: [0, 0, 0.001], rot: [Math.PI / 2, 0, 0], name: 'gem' });
    }
    const all = new THREE.Box3().setFromObject(root);
    for (const c of root.children) c.position.y -= all.min.y;
    return done(root, 'jewellery', variant, o);
  }
  if (piece === 'necklace' || piece === 'pendant') {
    const B = bust(root, velvet, woodM);
    const z0 = B.front + 0.0015;
    const pts = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      // behind the neck: round; at the front: drape down onto the chest
      const front = Math.max(0, Math.cos(a));
      const drop = piece === 'pendant' ? 0.07 : 0.045;
      const x = Math.sin(a) * (B.neckR + 0.003 + front * 0.02);
      const y = B.top + 0.004 - front ** 2 * drop;
      const z = front > 0.35 ? z0 + 0.002 : -0.004 + Math.cos(a) * (B.neckR + 0.003);
      pts.push([x, y, Math.max(z, Math.cos(a) * (B.neckR + 0.003) - 0.004)]);
    }
    curveTube(pts, piece === 'pendant' ? 0.0009 : 0.0014, metalM, { parent: root, segments: 120, radialSegments: 6, closed: true, name: 'chain' });
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), true);
    if (piece === 'necklace') {
      const k = T.pearl ? 40 : 15;
      for (let i = 0; i < k; i++) {
        const t = T.pearl ? i / k : 0.5 - 0.17 + (i / (k - 1)) * 0.34;
        const p = curve.getPointAt((t + 0.75) % 1);
        if (!T.pearl && p.z < 0.01) continue;
        const centre = Math.abs(i - (k - 1) / 2) < 0.6;
        const g = gemOf(T, T.pearl ? 0.0042 : centre ? 0.0055 : 0.0032);
        const m = mesh(g.geo, g.mat, { parent: root, at: [p.x, p.y, p.z + (T.pearl ? 0.0 : 0.002)], name: 'gem' });
        if (!T.pearl) m.rotation.x = Math.PI / 2;
      }
    } else {
      const p = curve.getPointAt(0.0);
      mesh(new THREE.TorusGeometry(0.0025, 0.0007, 6, 12), metalM, { parent: root, at: [p.x, p.y - 0.002, p.z], name: 'bail' });
      const g = gemOf(T, 0.008);
      const pend = group('pendant', { parent: root, at: [p.x, p.y - 0.012, p.z + 0.004] });
      mesh(lathe([[0.006, -0.004], [0.0095, 0], [0.0095, 0.0016], [0.006, 0.002]], 24).rotateX(Math.PI / 2), metalM, { parent: pend, name: 'bezel' });
      mesh(g.geo, g.mat, { parent: pend, at: [0, 0, 0.001], rot: [Math.PI / 2, 0, 0], name: 'gem' });
    }
    return done(root, 'jewellery', variant, o);
  }
  if (piece === 'earrings' || piece === 'bracelet') {
    // T-bar stand (o.stand); without it the pieces lie flat on the ground
    const st = o.stand ? root : group('stand_ghost');
    mesh(lathe([[0, 0], [0.04, 0], [0.042, 0.006], [0.035, 0.012], [0, 0.012]], 32), woodM, { parent: st, name: 'stand_base' });
    const barY = piece === 'earrings' ? 0.11 : 0.085;
    mesh(new THREE.CylinderGeometry(0.004, 0.005, barY - 0.012, 12), woodM, { parent: st, at: [0, 0.012 + (barY - 0.012) / 2, 0] });
    const barR = piece === 'earrings' ? 0.0035 : 0.022;
    const bar = piece === 'earrings' ? new THREE.CylinderGeometry(barR, barR, 0.09, 12).rotateZ(Math.PI / 2) : lathe([[0, -0.045], [0.018, -0.045], [barR, -0.04], [barR, 0.04], [0.018, 0.045], [0, 0.045]], 32).rotateZ(Math.PI / 2);
    mesh(bar, piece === 'earrings' ? woodM : velvet, { parent: st, at: [0, barY + (piece === 'earrings' ? 0 : barR), 0], name: 'bar' });
    if (piece === 'earrings') {
      for (const s of [-1, 1]) {
        const e = group('earring', { parent: root, at: [s * 0.025, barY, 0] });
        curveTube([[0, -0.006, 0.003], [0, 0.0045, 0.002], [0, 0.0045, -0.003], [0, -0.004, -0.006]], 0.0006, metalM, { parent: e, segments: 12, radialSegments: 4, name: 'hook' });
        mesh(new THREE.SphereGeometry(0.0012, 8, 6), metalM, { parent: e, at: [0, -0.0065, 0.003] });
        const g1 = gemOf(T, 0.0028);
        mesh(g1.geo, g1.mat, { parent: e, at: [0, -0.0095, 0.003], rot: [Math.PI, 0, 0], name: 'gem' });
        curveTube([[0, -0.012, 0.003], [0, -0.02, 0.003]], 0.0005, metalM, { parent: e, segments: 3, radialSegments: 4 });
        const g2 = gemOf(T, 0.0055);
        mesh(g2.geo, g2.mat, { parent: e, at: [0, -0.025, 0.003], rot: [T.pearl ? 0 : Math.PI, 0, 0], name: 'drop' });
        anims.push(e);
        if (!o.stand) {
          // lying flat on the ground, hook and drop side by side
          e.rotation.z = Math.PI / 2;
          e.position.set(s * 0.02, 0, 0);
          e.updateMatrixWorld(true);
          e.position.y -= new THREE.Box3().setFromObject(e).min.y;
        }
      }
      return done(root, 'jewellery', variant, o, () => [clip('swing', 2, anims.map((e, i) => rotateTrack(e, 'x', 2, (t) => Math.sin(t * Math.PI * 2 + i) * 0.15)))]);
    }
    // bracelet around the cushion bar (YZ plane loop)
    const by = barY + barR;
    const R = barR + 0.003;
    const bg = o.stand ? root : group('bracelet_flat', { parent: root });
    const k = T.pearl ? 30 : 26;
    mesh(new THREE.TorusGeometry(R, 0.0012, 8, 64).rotateY(Math.PI / 2), metalM, { parent: bg, at: [0, by, 0], name: 'bracelet' });
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2;
      const g = gemOf(T, T.pearl ? 0.003 : 0.0026);
      const m = mesh(g.geo, g.mat, { parent: bg, at: [0, by + Math.cos(a) * (R + 0.0018), Math.sin(a) * (R + 0.0018)], name: 'gem' });
      m.rotation.x = a;
      if (!T.pearl) mesh(new THREE.CylinderGeometry(0.0022, 0.0018, 0.0016, 10), metalM, { parent: bg, at: [0, by + Math.cos(a) * (R + 0.0006), Math.sin(a) * (R + 0.0006)], rot: [a, 0, 0] });
    }
    mesh(roundedBox(0.005, 0.004, 0.008, 0.0015), metalM, { parent: bg, at: [0, by - R - 0.002, 0], name: 'clasp' });
    if (!o.stand) {
      bg.rotation.z = Math.PI / 2;
      bg.position.x = by;
      bg.updateMatrixWorld(true);
      bg.position.y -= new THREE.Box3().setFromObject(bg).min.y;
    }
    return done(root, 'jewellery', variant, o);
  }
  // tiara (on a velvet cushion with o.stand; otherwise standing on its band on the ground)
  if (o.stand) mesh(cushion(0.2, 0.05, 0.16, { bulge: 0.25 }), velvet, { parent: root, at: [0, 0.025, 0], name: 'cushion' });
  if (o.stand) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.SphereGeometry(0.008, 10, 8), fabricMat('silk', '#d4b25e', { plain: true }), { parent: root, at: [sx * 0.097, 0.032, sz * 0.077], name: 'tassel' });
  const ty = o.stand ? 0.05 + 0.006 : 0.0022;
  const tiara = group('tiara', { parent: root, at: [0, ty, 0] });
  const R = 0.07;
  const arc = [];
  for (let i = 0; i <= 24; i++) { const a = -Math.PI * 0.75 + (i / 24) * Math.PI * 1.5; arc.push([Math.sin(a) * R, 0, Math.cos(a) * R * 0.85]); }
  curveTube(arc, 0.0022, metalM, { parent: tiara, segments: 48, radialSegments: 6, name: 'band' });
  const peaks = 9;
  for (let i = 0; i < peaks; i++) {
    const a = -Math.PI * 0.6 + (i / (peaks - 1)) * Math.PI * 1.2;
    const hgt = 0.018 + 0.03 * Math.cos((i / (peaks - 1) - 0.5) * Math.PI) ** 2;
    const bx = Math.sin(a) * R, bz = Math.cos(a) * R * 0.85;
    const a2 = a + Math.PI / peaks * 0.9;
    curveTube([[bx, 0, bz], [bx * 1.02, hgt * 0.6, bz * 1.02], [bx, hgt, bz]], 0.0012, metalM, { parent: tiara, segments: 10, radialSegments: 4 });
    if (i < peaks - 1) curveTube([[bx, hgt * 0.55, bz], [Math.sin(a2) * R * 1.01, hgt * 0.3, Math.cos(a2) * R * 0.86], [Math.sin(a + Math.PI * 1.2 / (peaks - 1)) * R, 0.004, Math.cos(a + Math.PI * 1.2 / (peaks - 1)) * R * 0.85]], 0.001, metalM, { parent: tiara, segments: 10, radialSegments: 4 });
    const g = gemOf(T, i === (peaks - 1) / 2 ? 0.0065 : 0.0036);
    const gm = mesh(g.geo, g.mat, { parent: tiara, at: [bx, hgt + 0.003, bz], name: 'gem' });
    gm.lookAt(bx * 2, hgt + 0.003, bz * 2);
    gm.rotateX(Math.PI / 2);
  }
  return done(root, 'jewellery', variant, o);
}

/* =================================== BELT =================================== */

export const BELT_VARIANTS = {
  dress: { fab: 'leather', c: '#1c1715', bw: 0.032, buckle: 'frame' },
  western: { fab: 'leather', c: '#7a4a28', bw: 0.04, buckle: 'plate' },
  braided: { fab: 'knit', c: '#8a5a32', c2: '#6b4224', bw: 0.034, buckle: 'frame' },
};

export function createBelt(options = {}) {
  const { o, variant, trim, T } = setup(options, BELT_VARIANTS, 'belt');
  const root = group(`belt-${variant}`);
  const bw = T.bw * (T.wid ?? 1) * (T.chunky ? 1.15 : 1);
  const main = mainMat(T, [12, 1], { side: THREE.DoubleSide });
  const hwM = trim === 'neon' ? M.metal('#202022', 0.3) : trim === 'silk' || trim === 'velvet' || variant === 'western' ? M.metal('#c9a45a', 0.25) : M.chrome();
  // standing coil (spiral on edge) + straight tail with the buckle
  const turns = 2.6;
  const pts = [];
  const N = 90;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * Math.PI * 2;
    const r = 0.035 + t * 0.03;
    pts.push([Math.sin(a) * r, bw / 2, Math.cos(a) * r]);
  }
  const last = pts[N];
  const tail = [[last[0] + 0.03, bw / 2, last[2] + 0.002], [last[0] + 0.07, bw / 2, last[2] + 0.004]];
  const path = [...pts, ...tail];
  mesh(taperTube(path, bw / 2, { flat: 0.0045 / bw * 2 / 2, side: [0, 1, 0], seg: 160, radial: 12 }), main, { parent: root, name: 'strap' });
  // holes on the inner tip
  const holeM = M.matte('#0d0b0a');
  for (let i = 0; i < 5; i++) {
    const p = pts[2 + i * 3];
    const a = Math.atan2(p[0], p[2]);
    mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.0055, 10).rotateX(Math.PI / 2), holeM, { parent: root, at: [p[0], bw / 2, p[2]], rot: [0, a, 0] });
  }
  // buckle at the tail end, in the strap plane (vertical, facing +Z)
  const bx = tail[1][0] + 0.004;
  const bz = tail[1][2];
  if (T.buckle === 'plate') {
    const plate = mesh(extrudeOutline(Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * Math.PI * 2; return [Math.cos(a) * 0.04, Math.sin(a) * bw * 0.85]; }), 0.005, { bevel: 0.0018, segments: 2 }), hwM, { parent: root, at: [bx + 0.03, bw / 2 + 0.004, bz + 0.004], name: 'buckle' });
    void plate;
    const em = brandEmblem(0.035);
    em.position.set(bx + 0.03, bw / 2 + 0.004, bz + 0.004 + 0.0025 + 0.0001);
    root.add(em);
    curveTube(Array.from({ length: 33 }, (_, i) => { const a = (i / 32) * Math.PI * 2; return [bx + 0.03 + Math.cos(a) * 0.036, bw / 2 + 0.004 + Math.sin(a) * bw * 0.77, bz + 0.0068]; }), 0.0012, M.metal('#e3e5e8', 0.2), { parent: root, segments: 48, radialSegments: 4, closed: true });
  } else {
    const ow = 0.034, oh = bw + 0.012;
    const sh = new THREE.Shape([[-ow / 2, -oh / 2], [ow / 2, -oh / 2], [ow / 2, oh / 2], [-ow / 2, oh / 2]].map(([x, y]) => new THREE.Vector2(x, y)));
    sh.holes.push(new THREE.Path([[-ow / 2 + 0.005, -oh / 2 + 0.005], [-ow / 2 + 0.005, oh / 2 - 0.005], [ow / 2 - 0.005, oh / 2 - 0.005], [ow / 2 - 0.005, -oh / 2 + 0.005]].map(([x, y]) => new THREE.Vector2(x, y))));
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 4 });
    mesh(fg, hwM, { parent: root, at: [bx + ow / 2 - 0.004, Math.max(oh / 2 + 0.0015, bw / 2), bz - 0.0015], name: 'buckle' });
    mesh(roundedBox(0.026, 0.003, 0.003, 0.001), hwM, { parent: root, at: [bx + 0.009, Math.max(oh / 2 + 0.0015, bw / 2), bz + 0.004], name: 'prong' });
    mesh(roundedBox(0.008, bw + 0.004, 0.008, 0.002), main, { parent: root, at: [bx - 0.01, bw / 2, bz], name: 'keeper' });
  }
  return done(root, 'belt', variant, o);
}

/* ================================== NECKTIE ================================= */

export const TIE_VARIANTS = {
  tie: { fab: 'silk', c: '#1f2d55', c2: '#c9a45a', w: 0.085 },
  skinny: { fab: 'silk', c: '#1b1b1d', c2: '#8d939c', w: 0.05 },
  'bow-tie': { fab: 'silk', c: '#7a1f2b', c2: '#1b1b1d', bow: true },
  'knit-tie': { fab: 'knit', c: '#2f4a3a', c2: '#253b2e', w: 0.06, square: true },
};

export function createNecktie(options = {}) {
  const { o, variant, trim, T } = setup(options, TIE_VARIANTS, 'necktie');
  const root = group(`necktie-${variant}`);
  const woodM = trim === 'leather' || trim === 'neon' ? M.wood('black') : M.wood('walnut');
  const main = mainMat(T, [2, 6]);
  if (T.bow) {
    // bow tie on a slanted display block (o.stand), otherwise lying face-up on the ground
    let bow;
    if (o.stand) {
      mesh(roundedBox(0.16, 0.02, 0.1, 0.006), woodM, { parent: root, at: [0, 0.01, 0], name: 'base' });
      const blk = group('display', { parent: root, at: [0, 0.02, 0], rot: [-0.35, 0, 0] });
      mesh(roundedBox(0.14, 0.09, 0.03, 0.008), fabricMat('velvet', '#e8e2d8', { plain: true }), { parent: blk, at: [0, 0.045, 0], name: 'block' });
      bow = group('bow', { parent: blk, at: [0, 0.05, 0.015] });
    } else bow = group('bow', { parent: root, rot: [-Math.PI / 2, 0, 0] });
    const wk = T.wid ?? 1;
    for (const s of [-1, 1]) {
      const wing = extrudeOutline([[0, -0.008], [s * 0.05 * wk, -0.026], [s * 0.058 * wk, -0.012], [s * 0.054 * wk, 0], [s * 0.058 * wk, 0.012], [s * 0.05 * wk, 0.026], [0, 0.008]].map(([x, y]) => [x, y]), 0.012, { bevel: 0.005, segments: 3 });
      mesh(wing, main, { parent: bow, at: [0, 0, 0.006], name: 'wing' });
    }
    mesh(roundedBox(0.018, 0.024, 0.02, 0.007), main, { parent: bow, at: [0, 0, 0.008], name: 'knot' });
    if (!o.stand) { bow.updateMatrixWorld(true); bow.position.y -= new THREE.Box3().setFromObject(bow).min.y; }
    return done(root, 'necktie', variant, o);
  }
  // tie stand with a top rod (o.stand); the tie drapes over it. Without it the tie lies
  // folded in half, flat on the ground.
  const st = o.stand ? root : group('stand_ghost');
  const tg = o.stand ? root : group('tie_flat', { parent: root });
  mesh(lathe([[0, 0], [0.07, 0], [0.072, 0.008], [0.06, 0.018], [0, 0.018]], 40), woodM, { parent: st, name: 'stand_base' });
  const H = 0.72;
  mesh(new THREE.CylinderGeometry(0.008, 0.01, H - 0.018, 14), woodM, { parent: st, at: [0, 0.018 + (H - 0.018) / 2, -0.03] });
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 14).rotateZ(Math.PI / 2), woodM, { parent: st, at: [0, H, -0.03 + 0.03], name: 'rod' });
  mesh(roundedBox(0.016, 0.016, 0.04, 0.005), woodM, { parent: st, at: [0, H, -0.015] });
  const rodR = o.stand ? 0.008 : 0.003;
  const W = T.w * (T.wid ?? 1) * (T.loose ? 1.12 : 1);
  const z = 0;
  const L1 = 0.56 * (T.len ?? 1) * (T.crop ? 0.9 : 1);
  const front = [[0, H - L1, z + rodR + 0.004], [0, H - L1 * 0.5, z + rodR + 0.003], [0, H - 0.02, z + rodR + 0.002], [0, H + rodR + 0.002, z], [0, H - 0.02, z - rodR - 0.002], [0, H - L1 * 0.85, z - rodR - 0.003]];
  const wf = (t) => { const tf = 1 - t; return t < 0.5 ? (W / 2) * (0.35 + 0.65 * (1 - t / 0.5) ** 1.3) : (W / 2) * (0.32 + 0.25 * ((t - 0.5) / 0.5)); };
  mesh(taperTube(front, (t) => wf(t), { flat: 0.08, side: [1, 0, 0], seg: 60, radial: 12 }), main, { parent: tg, name: 'tie' });
  // pointed tip of the front blade
  const tipY = H - L1;
  if (!T.square) mesh(extrudeOutline([[-W / 2 * 0.99, 0.002], [W / 2 * 0.99, 0.002], [0, -W * 0.45]], 0.004, { bevel: 0.0015, segments: 1 }), main, { parent: tg, at: [0, tipY, z + rodR + 0.004], name: 'tip' });
  else mesh(roundedBox(W * 0.98, 0.012, 0.007, 0.0025), main, { parent: tg, at: [0, tipY - 0.004, z + rodR + 0.004], name: 'tip' });
  const back = H - L1 * 0.85;
  mesh(extrudeOutline([[-W * 0.28, 0.002], [W * 0.28, 0.002], [0, -W * 0.28]], 0.004, { bevel: 0.0015, segments: 1 }), main, { parent: tg, at: [0, back, z - rodR - 0.003], name: 'tip_back' });
  // tie bar
  if (!T.square) mesh(roundedBox(W * 0.8, 0.006, 0.004, 0.0015), trim === 'neon' ? M.metal('#202022') : PRECIOUS.gold(), { parent: tg, at: [0, H - 0.2, z + rodR + 0.006], name: 'tie_bar' });
  if (!o.stand) {
    tg.rotation.x = -Math.PI / 2;
    tg.position.z = H - L1 / 2;
    tg.updateMatrixWorld(true);
    tg.position.y -= new THREE.Box3().setFromObject(tg).min.y;
  }
  return done(root, 'necktie', variant, o);
}

export { FABRIC_TRIMS };
