// Toy cars & trucks (die-cast / plastic / wooden push toys) and radio-controlled cars with a remote.
// Vehicles run along +Z (front), width along X; wheels spin about X.
import {
  THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, tube, merged, toyMat, toyFactory, wheel,
  canvasTex, RUBBER, CHROME, BLACK, WHITE, clip, spinTrack, rotateTrack, moveTrack, wave, pingPong, bulbs, screen,
} from './kit.js';

let _glass;
function glassMat(T) {
  if (T.style === 'wood') return toyMat('wood', T.pal[5]);
  if (T.puff) return toyMat('plush', T.pal[4]);
  if (T.kind === 'clear') return toyMat('clear', T.pal[4]);
  return (_glass ??= new THREE.MeshPhysicalMaterial({ name: 'toy-glass', color: '#1c2a38', roughness: 0.06, metalness: 0.3, clearcoat: 1 }));
}

/** Extrude a side profile [(z, y)…] across width W (centred on X). */
function sideBody(pts, W, bevel) {
  return extrudeOutline(pts, W, { bevel, segments: 3 }).rotateY(-Math.PI / 2);
}

/** Shrink a polygon about its centroid. */
function shrink(pts, k, dy = 0) {
  const cz = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([z, y]) => [cz + (z - cz) * k, cy + (y - cy) * k + dy]);
}

/** Windows over a cabin quad [(zw,y1),(zr1,y2),(zr2,y2),(zb,y1)]: side glass + windscreen/back light. */
function cabinGlass(parent, Q, W, bev, gm, at) {
  const side = shrink(Q, 0.8, 0.002);
  mesh(sideBody(side, W + bev * 2 + 0.0016, bev * 0.3), gm, { parent, at });
  const [a, b, cc, d] = Q;
  const e = 0.0016;
  const top = b[1] - 0.003;
  const lerpZ = (p, q, y) => p[0] + (q[0] - p[0]) * ((y - p[1]) / (q[1] - p[1]));
  const ws = [[a[0] + e, a[1] + 0.002], [lerpZ(a, b, top) + e, top], [lerpZ(d, cc, top) - e, top], [d[0] - e, d[1] + 0.002]];
  mesh(sideBody(ws, W * 0.8, bev), gm, { parent, at });
}

/** Wheel set: positions [[x,z]…] at radius r; returns wheel groups. */
function wheels(parent, c, list, r, w, y = r) {
  const out = [];
  for (const [x, z] of list) out.push(wheel(parent, { r, w, at: [x, y, z], T: c.T, hub: c.color(4) }));
  return out;
}

/** Axles between wheel pairs (touch both hubs). */
function axles(parent, zs, W, r, y = r, rad = 0.0025) {
  for (const z of zs) tube([-W / 2, y, z], [W / 2, y, z], rad, CHROME, { parent });
}

function trimExtras(c, parent, { L, W, top, rear, y0 }) {
  const { T } = c;
  if (T.style === 'tin') {
    // wind-up key out of the back
    const key = group('windkey', { parent, at: [0, y0 + 0.01, rear] });
    tube([0, 0, 0.002], [0, 0, -0.014], 0.0025, toyMat('gold', '#d4a73a'), { parent: key });
    for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.007, 0.0022, 8, 16).rotateY(Math.PI / 2), toyMat('gold', '#d4a73a'), { parent: key, at: [0, s * 0.007, -0.014] });
    c.anims.push(clip('windup', 1, [spinTrack(key, 'z', 1)]));
  } else if (T.style === 'space') {
    // twin rocket boosters out of the tail
    for (const s of [-1, 1]) {
      mesh(lathe([[0, 0], [0.008, 0.002], [0.009, 0.03], [0.006, 0.04], [0, 0.042]], 16).rotateX(-Math.PI / 2), c.m(2), { parent, at: [s * W * 0.25, y0 + 0.012, rear + 0.006] });
    }
  } else if (T.style === 'luxe') {
    for (const s of [-1, 1]) tube([s * W * 0.28, y0 + 0.004, rear + 0.01], [s * W * 0.28, y0 + 0.004, rear - 0.012], 0.0035, CHROME, { parent });
  } else if (T.style === 'neon') {
    bulbs(parent, 'underglow', 'white', [[[0, y0 + 0.002, rear - 0.0005], [0, 0, -1]], [[0, y0 + 0.002, rear + L - 0.0005], [0, 0, 1]]], { r: 0.004, blink: 0 });
  }
}

/* ============================== TOY CARS & TRUCKS ============================== */
export const TOY_CAR_VARIANTS = {
  'sports-car': { pal: ['#d62828','#151515','#f4c20d','#c9ced6','#f7f5f0','#222222'], L: 0.2, W: 0.085, r: 0.02, kind: 'car', y1: 0.042, y2: 0.06, Q: [0.045, -0.005, -0.03, -0.07] },
  hatchback: { pal: ['#f4c20d','#2a2a2a','#1d4ed8','#d62828','#f7f5f0','#222222'], L: 0.17, W: 0.08, r: 0.019, kind: 'car', y1: 0.048, y2: 0.082, Q: [0.04, 0.0, -0.075, -0.083] },
  'police-car': { pal: ['#f7f5f0','#1d3a8a','#d62828','#151515','#ffffff','#111111'], L: 0.21, W: 0.084, r: 0.02, kind: 'car', y1: 0.048, y2: 0.078, Q: [0.06, 0.02, -0.05, -0.07], siren: true },
  pickup: { pal: ['#2a7d4a','#e0ad3a','#c9ced6','#d62828','#f7f5f0','#222222'], L: 0.22, W: 0.088, r: 0.022, kind: 'pickup', y1: 0.054, y2: 0.088, Q: [0.07, 0.04, -0.01, -0.012] },
  'race-car': { pal: ['#1d4ed8','#f4c20d','#d62828','#ffffff','#f7f5f0','#151515'], L: 0.22, W: 0.07, r: 0.022, kind: 'formula' },
  'dump-truck': { pal: ['#f4a20d','#3a3a3a','#d62828','#1d4ed8','#f7f5f0','#222222'], L: 0.28, W: 0.11, r: 0.028, kind: 'dump' },
  'fire-truck': { pal: ['#c8102e','#f2f2f2','#f4c20d','#c9ced6','#ffffff','#222222'], L: 0.34, W: 0.1, r: 0.026, kind: 'fire' },
  'tow-truck': { pal: ['#f07a14','#151515','#f4c20d','#c9ced6','#f7f5f0','#222222'], L: 0.26, W: 0.095, r: 0.026, kind: 'tow' },
  'school-bus': { pal: ['#f6b800','#151515','#f6b800','#c9ced6','#f7f5f0','#222222'], L: 0.32, W: 0.095, r: 0.024, kind: 'bus' },
  'monster-truck': { pal: ['#7a1fd1','#d4ff1e','#151515','#ff2fb3','#f7f5f0','#111111'], L: 0.22, W: 0.12, r: 0.05, kind: 'monster', y1: 0.05, y2: 0.08, Q: [0.06, 0.035, -0.02, -0.02] },
  'cement-mixer': { pal: ['#f2f2f2','#f07a14','#1d4ed8','#5a5d62','#ffffff','#222222'], L: 0.3, W: 0.1, r: 0.026, kind: 'mixer' },
  tractor: { pal: ['#2a8a3a','#f4c20d','#151515','#d62828','#f7f5f0','#222222'], L: 0.2, W: 0.1, r: 0.045, kind: 'tractor' },
};

/** Profile car: body + cabin silhouette. Returns {top, y0}. */
function profileCar(c, parent, v, { y0, bed = false }) {
  const { L, W } = v;
  const h = L / 2;
  const [zw, zr1, zr2, zb] = v.Q;
  const y1 = y0 + v.y1 - 0.02;
  const y2 = y0 + v.y2 - 0.02;
  const bev = W * 0.1;
  const pts = [[-h, y0], [h, y0], [h, y0 + (y1 - y0) * 0.55], [h - 0.012, y1], [zw, y1], [zr1, y2], [zr2, y2], [zb, y1], [-h + 0.01, y1], [-h, y0 + (y1 - y0) * 0.6]];
  if (bed) pts.splice(8, 0);
  const bodyM = c.m(0);
  mesh(sideBody(pts, W - bev * 2, bev), bodyM, { parent });
  cabinGlass(parent, [[zw, y1], [zr1, y2], [zr2, y2], [zb, y1]], W - bev * 2, bev, glassMat(c.T), [0, 0, 0]);
  // bumpers + lights
  const bm = c.T.style === 'wood' ? toyMat('rawwood', 'walnut') : c.T.style === 'luxe' || c.T.style === 'tin' ? CHROME : c.m(5);
  for (const s of [-1, 1]) mesh(roundedBox(W * 0.96, 0.009, 0.01, 0.004), bm, { parent, at: [0, y0 + 0.004, s * (h + bev * 0.5)] });
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.0055, 12, 8).scale(1, 0.8, 0.5), toyMat('soft', '#fff6c8'), { parent, at: [s * W * 0.32, y0 + (y1 - y0) * 0.6, h + bev * 0.95] });
    mesh(new THREE.SphereGeometry(0.005, 12, 8).scale(1.2, 0.7, 0.5), toyMat('soft', '#e02020'), { parent, at: [s * W * 0.33, y0 + (y1 - y0) * 0.65, -h - bev * 0.95] });
  }
  return { top: y2 + bev, y1: y1 + bev, bev };
}

/** Rounded cab block (truck cab-over) with windows; z0..z1 along Z. */
function cabBlock(c, parent, { W, z0, z1, y0, H, mat }) {
  const bev = W * 0.08;
  const L = z1 - z0;
  const pts = [[z0, y0], [z1, y0], [z1, y0 + H * 0.55], [z1 - L * 0.15, y0 + H], [z0, y0 + H]];
  mesh(sideBody(pts, W - bev * 2, bev), mat ?? c.m(0), { parent });
  const gm = glassMat(c.T);
  // side windows
  mesh(sideBody([[z0 + L * 0.25, y0 + H * 0.58], [z1 - L * 0.12, y0 + H * 0.58], [z1 - L * 0.22, y0 + H * 0.9], [z0 + L * 0.25, y0 + H * 0.9]], W + 0.0016, bev * 0.3), gm, { parent });
  // windscreen
  const zs = z1 - L * 0.075;
  mesh(roundedBox(W * 0.8, H * 0.32, 0.004, 0.0015), gm, { parent, at: [0, y0 + H * 0.76, zs + bev * 0.7], rot: [-Math.atan2(L * 0.15, H * 0.45), 0, 0] });
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.006, 12, 8).scale(1, 0.8, 0.5), toyMat('soft', '#fff6c8'), { parent, at: [s * W * 0.33, y0 + H * 0.3, z1 + bev * 0.9] });
  mesh(roundedBox(W * 0.98, 0.012, 0.012, 0.005), c.T.style === 'tin' || c.T.style === 'luxe' ? CHROME : c.m(5), { parent, at: [0, y0 + 0.004, z1 + bev * 0.6] });
  return { top: y0 + H + bev };
}

/** Hollow open box (walls + floor) — truck bins, beds. */
function openBox(parent, w, h, d, t, mat, { at = [0, 0, 0], name, floor = true, frontLip = 0 } = {}) {
  const g = group(name ?? null, { parent, at });
  if (floor) mesh(roundedBox(w, t, d, t * 0.4), mat, { parent: g, at: [0, t / 2, 0] });
  for (const s of [-1, 1]) mesh(roundedBox(t, h, d, t * 0.4), mat, { parent: g, at: [s * (w / 2 - t / 2), h / 2, 0] });
  mesh(roundedBox(w, h, t, t * 0.4), mat, { parent: g, at: [0, h / 2, -d / 2 + t / 2] });
  mesh(roundedBox(w, h + frontLip, t, t * 0.4), mat, { parent: g, at: [0, (h + frontLip) / 2, d / 2 - t / 2] });
  return g;
}

export const createToyCar = toyFactory('toy-car', TOY_CAR_VARIANTS, (c) => {
  const { root, T, v } = c;
  const { L, W, r, kind } = v;
  const h = L / 2;
  const wood = T.style === 'wood';
  const ww = wood ? r * 0.75 : r * 0.62;
  const wx = W / 2 - ww * 0.15;
  let spin = [];
  const chassisM = wood ? toyMat('rawwood', 'maple') : T.puff ? toyMat('plush', T.pal[5]) : c.m(5);
  if (kind === 'car' || kind === 'pickup' || kind === 'monster') {
    const mon = kind === 'monster';
    const y0 = mon ? r * 1.25 : r * 0.55;
    const zA = h * 0.62;
    const body = group('body', { parent: root });
    const { top, y1, bev } = profileCar(c, body, v, { y0 });
    if (kind === 'pickup' || mon) {
      // hollow bed behind the cab
      const bz0 = v.Q[3] - 0.004;
      const bl = bz0 + h - bev;
      openBox(body, W - 0.002, 0.022, bl, 0.004, c.m(mon ? 1 : 0), { at: [0, y1 - 0.002, bz0 - bl / 2] });
    }
    if (mon) {
      // lifted on big tyres: chassis rails + coil springs to the axles
      const wr = r;
      const mx = W / 2 + ww * 0.35;
      mesh(roundedBox(W * 0.5, 0.012, L * 0.8, 0.004), chassisM, { parent: root, at: [0, y0 - 0.006, 0] });
      for (const z of [zA, -zA]) {
        for (const s of [-1, 1]) curveTube(Array.from({ length: 14 }, (_, i) => [s * W * 0.18 + Math.cos(i * 1.4) * 0.006, wr + (y0 - 0.012 - wr) * (i / 13), z + Math.sin(i * 1.4) * 0.006]), 0.0018, CHROME, { parent: root, segments: 60, radialSegments: 6 });
        mesh(new THREE.CylinderGeometry(0.008, 0.008, mx * 2, 12).rotateZ(Math.PI / 2), chassisM, { parent: root, at: [0, wr, z] });
      }
      spin = wheels(root, c, [[-mx, zA], [mx, zA], [-mx, -zA], [mx, -zA]], wr, ww * 1.8);
      // knobbly tread blocks
      for (const wg of spin) for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        mesh(roundedBox(ww * 1.7, 0.008, 0.012, 0.003), T.puff ? toyMat('plush', T.pal[5]) : RUBBER, { parent: wg, at: [0, Math.sin(a) * wr * 0.97, Math.cos(a) * wr * 0.97], rot: [-a, 0, 0] });
      }
    } else {
      spin = wheels(root, c, [[-wx, zA], [wx, zA], [-wx, -zA], [wx, -zA]], r, ww);
      axles(root, [zA, -zA], W, r);
    }
    if (v.siren) {
      mesh(roundedBox(W * 0.5, 0.008, 0.016, 0.003), BLACK, { parent: body, at: [0, top - 0.002, (v.Q[1] + v.Q[2]) / 2] });
      const lb = bulbs(body, 'siren_red', 'red', [[[-W * 0.13, top + 0.006, (v.Q[1] + v.Q[2]) / 2], [0, 1, 0]]], { r: 0.0055, blink: 2 });
      const lb2 = bulbs(body, 'siren_blue', 'blue', [[[W * 0.13, top + 0.006, (v.Q[1] + v.Q[2]) / 2], [0, 1, 0]]], { r: 0.0055, blink: 2 });
      c.anims.push(clip('siren', 1, [...lb, ...lb2]));
      // door stripe
      for (const s of [-1, 1]) mesh(roundedBox(0.001, 0.008, L * 0.55, 0.0004), WHITE, { parent: body, at: [s * (W / 2 + 0.0002), y0 + (y1 - y0) * 0.45, 0] });
    }
    trimExtras(c, body, { L, W, top, rear: -h, y0 });
  } else if (kind === 'formula') {
    const y0 = r * 0.55;
    const tub = [[-h * 0.8, y0], [h, y0], [h, y0 + 0.008], [h * 0.3, y0 + 0.022], [h * 0.05, y0 + 0.03], [-h * 0.15, y0 + 0.045], [-h * 0.6, y0 + 0.035], [-h * 0.8, y0 + 0.025]];
    const body = group('body', { parent: root });
    mesh(sideBody(tub, W * 0.32, W * 0.12), c.m(0), { parent: body });
    // side pods
    for (const s of [-1, 1]) mesh(roundedBox(W * 0.22, 0.02, L * 0.32, 0.007), c.m(1), { parent: body, at: [s * W * 0.27, y0 + 0.01, -h * 0.25] });
    // driver helmet + cockpit rim
    mesh(new THREE.SphereGeometry(0.011, 18, 12), c.m(2), { parent: body, at: [0, y0 + 0.033, -h * 0.1] });
    mesh(new THREE.SphereGeometry(0.0112, 18, 8, -0.8, 1.6, 1.1, 0.6), glassMat(T), { parent: body, at: [0, y0 + 0.033, -h * 0.1] });
    // wings
    mesh(roundedBox(W * 1.05, 0.004, 0.03, 0.0015), c.m(1), { parent: body, at: [0, y0 + 0.002, h - 0.015] });
    for (const s of [-1, 1]) mesh(roundedBox(0.003, 0.03, 0.03, 0.001), c.m(5), { parent: body, at: [s * W * 0.32, y0 + 0.04, -h * 0.82] });
    mesh(roundedBox(W * 0.8, 0.005, 0.03, 0.002), c.m(1), { parent: body, at: [0, y0 + 0.056, -h * 0.82] });
    // number roundel
    const num = canvasTex(64, 64, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', 32, 34); void w; }, 'race-num');
    mesh(new THREE.CircleGeometry(0.008, 20).rotateX(-Math.PI / 2 + 0.25), num ? new THREE.MeshStandardMaterial({ map: num, roughness: 0.4 }) : WHITE, { parent: body, at: [0, y0 + 0.0215, h * 0.32] });
    const fz = h * 0.68;
    const rz = -h * 0.6;
    const fx = W * 0.62;
    spin = [...wheels(root, c, [[-fx, fz], [fx, fz]], r * 0.85, ww), ...wheels(root, c, [[-fx, rz], [fx, rz]], r, ww * 1.4)];
    for (const [z, rr] of [[fz, r * 0.85], [rz, r]]) for (const s of [-1, 1]) tube([s * W * 0.12, y0 + 0.006, z], [s * fx, rr, z], 0.0018, c.m(5), { parent: root });
    for (const [z, rr] of [[fz, r * 0.85], [rz, r]]) axles(root, [z], fx * 2, rr, rr, 0.002);
    trimExtras(c, body, { L, W: W * 0.5, top: y0 + 0.04, rear: -h * 0.8, y0 });
  } else {
    // trucks & bus: chassis + cab-over + body
    const y0 = r * 0.7;
    const cabL = kind === 'bus' ? 0 : kind === 'tractor' ? 0 : L * 0.26;
    const chassis = group('chassis', { parent: root });
    mesh(roundedBox(W * 0.86, 0.014, L * 0.96, 0.004), chassisM, { parent: chassis, at: [0, y0 + 0.007, 0] });
    const zA = h * 0.68;
    const zB = -h * 0.6;
    if (kind !== 'tractor') {
      const back = kind === 'bus' ? [zB] : [zB, zB + r * 2.2];
      if (kind === 'dump' || kind === 'mixer' || kind === 'fire') {
        spin = wheels(root, c, [[-wx, zA], [wx, zA], ...back.flatMap((z) => [[-wx, z], [wx, z]])], r, ww);
        axles(root, [zA, ...back], W, r);
      } else {
        spin = wheels(root, c, [[-wx, zA], [wx, zA], [-wx, zB], [wx, zB]], r, ww);
        axles(root, [zA, zB], W, r);
      }
    }
    const yb = y0 + 0.014;
    if (cabL) cabBlock(c, chassis, { W, z0: h - cabL, z1: h, y0: yb, H: W * 0.62 });
    if (kind === 'dump') {
      const binL = L - cabL - 0.012;
      const pivot = group('bin', { parent: chassis, at: [0, yb, -h] });
      openBox(pivot, W, W * 0.42, binL, 0.005, c.m(1), { at: [0, 0, binL / 2], frontLip: 0.012 });
      // canopy lip over the cab
      mesh(roundedBox(W, 0.004, 0.02, 0.0015), c.m(1), { parent: pivot, at: [0, W * 0.42 + 0.012, binL + 0.006] });
      c.anims.push(clip('tip', 4, [rotateTrack(pivot, 'x', 4, (t) => -pingPong(t) * 0.75)]));
    } else if (kind === 'fire') {
      const bl = L - cabL;
      mesh(c.box(W, W * 0.5, bl, 0.12), c.m(0), { parent: chassis, at: [0, yb + W * 0.25, -h + bl / 2] });
      // locker doors
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) mesh(roundedBox(0.002, W * 0.36, bl * 0.27, 0.0008), c.m(4), { parent: chassis, at: [s * (W / 2 + 0.0004), yb + W * 0.25, -h + bl * (0.18 + i * 0.32)] });
      const turn = group('turntable', { parent: chassis, at: [0, yb + W * 0.5, -h + bl * 0.3] });
      mesh(new THREE.CylinderGeometry(W * 0.22, W * 0.25, 0.012, 24), c.m(5), { parent: turn, at: [0, 0.006, 0] });
      const lad = group('ladder', { parent: turn, at: [0, 0.02, 0] });
      mesh(roundedBox(0.012, 0.016, 0.016, 0.003), c.m(5), { parent: turn, at: [0, 0.012, 0] });
      const ll = L * 0.85;
      const lm = T.style === 'wood' ? toyMat('rawwood', 'pine') : toyMat(T.kind === 'plush' ? 'plush' : 'metal', '#d8d8d8');
      const geos = [];
      for (const s of [-1, 1]) geos.push(roundedBox(0.004, 0.006, ll, 0.0015).translate(s * W * 0.17, 0, ll * 0.42));
      for (let i = 0; i < 14; i++) geos.push(new THREE.CylinderGeometry(0.0016, 0.0016, W * 0.34, 6).rotateZ(Math.PI / 2).translate(0, 0, -ll * 0.08 + (i / 13) * ll));
      merged(geos, lm, { parent: lad });
      c.anims.push(clip('ladder', 5, [rotateTrack(lad, 'x', 5, (t) => -pingPong(t) * 0.7), rotateTrack(turn, 'y', 5, (t) => wave(t) * 0.5)]));
      const lb = bulbs(chassis, 'beacons', 'red', [[[-W * 0.25, W * 0.62 + yb + W * 0.08 + 0.004, h - cabL * 0.5], [0, 1, 0]], [[W * 0.25, W * 0.62 + yb + W * 0.08 + 0.004, h - cabL * 0.5], [0, 1, 0]]], { r: 0.006, blink: 2.5 });
      c.anims.push(clip('siren', 1, lb));
    } else if (kind === 'tow') {
      mesh(c.box(W * 0.9, 0.012, L * 0.6, 0.15), c.m(1), { parent: chassis, at: [0, yb + 0.006, -h + L * 0.32] });
      const boom = group('boom', { parent: chassis, at: [0, yb + 0.012, -h * 0.25] });
      mesh(roundedBox(0.02, 0.02, 0.02, 0.005), c.m(5), { parent: boom, at: [0, 0.01, 0] });
      tube([0, 0.012, 0], [0, 0.07, -L * 0.3], 0.005, c.m(2), { parent: boom });
      tube([0, 0.07, -L * 0.3], [0, 0.03, -L * 0.33], 0.0012, BLACK, { parent: boom });
      mesh(new THREE.TorusGeometry(0.006, 0.0018, 8, 16, Math.PI * 1.4), CHROME, { parent: boom, at: [0, 0.024, -L * 0.33], rot: [0, Math.PI / 2, 0] });
      c.anims.push(clip('winch', 4, [rotateTrack(boom, 'x', 4, (t) => -pingPong(t) * 0.25)]));
      const lb = bulbs(chassis, 'beacons', 'amber', [[[0, yb + W * 0.62 + W * 0.08 + 0.004, h - cabL * 0.5], [0, 1, 0]]], { r: 0.006, blink: 1.5 });
      c.anims.push(clip('lights', 1, lb));
    } else if (kind === 'mixer') {
      const zc = -h + (L - cabL) * 0.48;
      const drum = group('drum', { parent: chassis, at: [0, yb + W * 0.5, zc], rot: [-0.25, 0, 0] });
      const dl = (L - cabL) * 0.85;
      const pr = [[0.006, -dl / 2], [W * 0.25, -dl * 0.4], [W * 0.45, -dl * 0.1], [W * 0.45, dl * 0.08], [W * 0.2, dl * 0.45], [W * 0.12, dl / 2], [0.006, dl / 2]];
      const dg = lathe(pr, 32).rotateX(-Math.PI / 2);
      mesh(dg, c.m(1), { parent: drum });
      // spiral fin stripes
      curveTube(Array.from({ length: 30 }, (_, i) => { const t = i / 29; const z = -dl * 0.35 + t * dl * 0.5; const rr = W * 0.455; return [Math.cos(t * 9) * rr, Math.sin(t * 9) * rr, z]; }), 0.0022, c.m(2), { parent: drum, segments: 80, radialSegments: 6 });
      // cradle supports (rest the drum on the chassis)
      for (const z of [zc - dl * 0.25, zc + dl * 0.22]) mesh(roundedBox(W * 0.7, W * 0.5 - (z > zc ? W * 0.16 : -W * 0.02), 0.012, 0.003), c.m(5), { parent: chassis, at: [0, yb + (W * 0.5 - (z > zc ? W * 0.16 : -W * 0.02)) / 2, z] });
      c.anims.push(clip('mix', 2, [spinTrack(drum, 'z', 2)]));
    } else if (kind === 'bus') {
      const bH = W * 0.95;
      const bus = group('bus', { parent: chassis, at: [0, yb, 0] });
      mesh(c.box(W, bH, L * 0.98, 0.14), c.m(T.name === 'base' || T.name === 'classic' ? 2 : 0), { parent: bus, at: [0, bH / 2, 0] });
      const gm = glassMat(T);
      for (let i = 0; i < 7; i++) mesh(roundedBox(W + 0.002, bH * 0.3, L * 0.09, 0.003), gm, { parent: bus, at: [0, bH * 0.66, -h + L * 0.1 + i * L * 0.115] });
      mesh(roundedBox(W * 0.86, bH * 0.36, 0.004, 0.003), gm, { parent: bus, at: [0, bH * 0.64, L * 0.49] });
      for (const s of [-1, 1]) mesh(roundedBox(0.002, 0.006, L * 0.96, 0.001), c.m(5), { parent: bus, at: [s * (W / 2 + 0.0004), bH * 0.42, 0] });
      for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.006, 12, 8).scale(1, 0.8, 0.5), toyMat('soft', '#fff6c8'), { parent: bus, at: [s * W * 0.33, bH * 0.25, L * 0.49 + 0.002] });
      // stop sign arm (swings out)
      const arm = group('stop_arm', { parent: bus, at: [-W / 2 - 0.002, bH * 0.6, h * 0.55] });
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 8).rotateZ(Math.PI / 2).rotateX(Math.PI / 8), toyMat('plastic', '#d01818'), { parent: arm, at: [-0.002, 0, -0.012] });
      c.anims.push(clip('stop', 3, [rotateTrack(arm, 'y', 3, (t) => pingPong(t) * 1.4)]));
      trimExtras(c, bus, { L, W, top: bH, rear: -h, y0: 0.005 });
    } else if (kind === 'tractor') {
      const rr = r;
      const fr = r * 0.55;
      const rz = -h * 0.45;
      const fz = h * 0.62;
      const tx = W / 2 + ww * 0.3;
      spin = [...wheels(root, c, [[-tx, rz], [tx, rz]], rr, ww * 1.5), ...wheels(root, c, [[-W * 0.38, fz], [W * 0.38, fz]], fr, ww)];
      for (const wg of spin.slice(0, 2)) for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        mesh(roundedBox(ww * 1.3, 0.006, 0.009, 0.002), T.puff ? toyMat('plush', T.pal[5]) : RUBBER, { parent: wg, at: [0, Math.sin(a) * rr * 0.98, Math.cos(a) * rr * 0.98], rot: [-a, 0.4, 0] });
      }
      chassis.position.y = 0;
      chassis.clear();
      axles(root, [rz], tx * 2, rr, rr, 0.004);
      axles(root, [fz], W * 0.76, fr, fr, 0.003);
      // engine hood + body
      const hy = rr * 0.6;
      mesh(c.box(W * 0.5, W * 0.38, L * 0.55, 0.2), c.m(0), { parent: chassis, at: [0, fr + 0.004 + W * 0.19, h * 0.3] });
      mesh(roundedBox(W * 0.5, rr * 0.9, L * 0.16, 0.006), c.m(0), { parent: chassis, at: [0, rr * 0.45 + 0.01, rz + L * 0.1] });
      // grille
      mesh(roundedBox(W * 0.42, W * 0.3, 0.003, 0.002), c.m(5), { parent: chassis, at: [0, fr + 0.004 + W * 0.19, h * 0.3 + L * 0.275 + 0.0005] });
      // seat + steering
      mesh(roundedBox(W * 0.3, 0.008, 0.024, 0.003), BLACK, { parent: chassis, at: [0, rr * 0.9 + 0.014, rz + L * 0.08] });
      mesh(roundedBox(W * 0.3, 0.028, 0.006, 0.003), BLACK, { parent: chassis, at: [0, rr * 0.9 + 0.03, rz + L * 0.04] });
      tube([0, fr + W * 0.38, h * 0.05], [0, fr + W * 0.38 + 0.03, -h * 0.05], 0.0018, BLACK, { parent: chassis });
      mesh(new THREE.TorusGeometry(0.009, 0.0018, 6, 18).rotateX(Math.PI / 2 - 0.6), BLACK, { parent: chassis, at: [0, fr + W * 0.38 + 0.03, -h * 0.05] });
      // fenders over the rear wheels
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(rr * 1.12, rr * 1.12, ww * 1.6, 24, 1, true, Math.PI / 2 - 1.1, 2.2), c.m(1), { parent: chassis, at: [s * tx, rr, rz], rot: [0, 0, Math.PI / 2] }).material.side = THREE.DoubleSide;
      // ROPS canopy
      const topY = rr * 2.4;
      for (const s of [-1, 1]) for (const z of [rz - L * 0.04, rz + L * 0.2]) tube([s * W * 0.28, rr * 0.8, z], [s * W * 0.28, topY, z], 0.002, c.m(5), { parent: chassis });
      mesh(c.box(W * 0.7, 0.006, L * 0.36, 0.2), c.m(1), { parent: chassis, at: [0, topY + 0.003, rz + L * 0.08] });
      // exhaust stack
      tube([W * 0.15, fr + W * 0.38, h * 0.45], [W * 0.15, fr + W * 0.38 + 0.05, h * 0.45], 0.003, BLACK, { parent: chassis });
      void hy;
      trimExtras(c, chassis, { L: h * 0.3 + L * 0.275 - rz - 0.004, W: W * 0.5, top: topY, rear: rz + 0.004, y0: rr * 0.5 });
    } else trimExtras(c, chassis, { L, W, top: W * 0.62 + yb, rear: -h, y0: yb });
  }
  c.anims.push(clip('drive', 1, spin.map((w) => spinTrack(w, 'x', 0.6))));
}, { base: 'classic' });

/* ============================== RC CARS ============================== */
export const RC_CAR_VARIANTS = {
  buggy: { L: 0.36, W: 0.24, r: 0.045, body: 'buggy', matKind: 'plastic', pal: ['#f2c500', '#151515', '#e5402a', '#1d4ed8', '#f7f5f0', '#222222'] },
  'monster-rc': { L: 0.4, W: 0.3, r: 0.075, body: 'truck', matKind: 'plastic', pal: ['#2a9d3c', '#f4c20d', '#151515', '#d62828', '#f7f5f0', '#222222'] },
  'drift-car': { L: 0.4, W: 0.19, r: 0.032, body: 'coupe', matKind: 'plastic', pal: ['#f7f5f0', '#d62828', '#1d4ed8', '#151515', '#ffffff', '#222222'] },
  'rock-crawler': { L: 0.42, W: 0.26, r: 0.06, body: 'crawler', matKind: 'plastic', pal: ['#f07a14', '#2a2a2a', '#f4c20d', '#1d4ed8', '#f7f5f0', '#222222'] },
  'stunt-car': { L: 0.3, W: 0.26, r: 0.07, body: 'stunt', matKind: 'plastic', pal: ['#1d4ed8', '#19e3ff', '#ff2fb3', '#d4ff1e', '#f7f5f0', '#111111'] },
};

function remote(parent, c, at, ang) {
  const g = group('remote', { parent, at, rot: [0, ang, 0] });
  const mat = c.m(5);
  mesh(roundedBox(0.16, 0.03, 0.1, 0.012), mat, { parent: g, at: [0, 0.015, 0] });
  for (const s of [-1, 1]) mesh(new THREE.CapsuleGeometry(0.018, 0.05, 6, 12).rotateX(Math.PI / 2), mat, { parent: g, at: [s * 0.065, 0.018, 0.035] });
  for (const s of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.006, 18), BLACK, { parent: g, at: [s * 0.045, 0.033, -0.01] });
    mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.016, 8), BLACK, { parent: g, at: [s * 0.045, 0.042, -0.01] });
    mesh(new THREE.SphereGeometry(0.006, 12, 8), c.m(0), { parent: g, at: [s * 0.045, 0.051, -0.01] });
  }
  tube([0.06, 0.028, -0.04], [0.07, 0.11, -0.05], 0.0025, CHROME, { parent: g });
  mesh(new THREE.SphereGeometry(0.004, 8, 6), BLACK, { parent: g, at: [0.07, 0.11, -0.05] });
  const tracks = screen(g, new THREE.PlaneGeometry(0.04, 0.02).rotateX(-Math.PI / 2).translate(0, 0.0305, 0.02), { name: 'remote_screen', color: '#5cff8a', normal: [0, 1, 0], intensity: 1.2 });
  return tracks;
}

export const createRcCar = toyFactory('rc-car', RC_CAR_VARIANTS, (c) => {
  const { root, T, v } = c;
  const { L, W, r } = v;
  const h = L / 2;
  const ww = r * 0.9;
  const car = group('car', { parent: root });
  const yc = r * 0.75;
  const tyreM = T.puff ? toyMat('plush', T.pal[5]) : RUBBER;
  // chassis plate
  mesh(roundedBox(W * 0.42, 0.008, L * 0.9, 0.003), c.m(5), { parent: car, at: [0, yc, 0] });
  // battery pack + electronics box
  mesh(roundedBox(W * 0.22, 0.022, L * 0.38, 0.004), toyMat('plastic', '#2a5bd7'), { parent: car, at: [0, yc + 0.015, -L * 0.04] });
  const fz = h * 0.66;
  const rz = -h * 0.62;
  const wx = W / 2 - ww / 2;
  const spin = [];
  const steer = [];
  for (const [z, front] of [[fz, true], [rz, false]]) {
    // suspension arms + shock towers + gearbox
    mesh(roundedBox(0.03, 0.03, 0.03, 0.006), c.m(5), { parent: car, at: [0, yc + 0.01, z] });
    for (const s of [-1, 1]) {
      tube([s * 0.012, yc + 0.004, z], [s * (wx - ww * 0.4), r, z], 0.004, c.m(5), { parent: car });
      tube([s * 0.014, yc + 0.034, z], [s * (wx - ww * 0.55), r + 0.012, z], 0.004, toyMat('metal', T.pal[2]), { parent: car });
      const sg = group(front ? `steer${s > 0 ? 'R' : 'L'}` : null, { parent: car, at: [s * wx, r, z] });
      const w = wheel(sg, { r, w: ww, T, hub: T.pal[1] });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        mesh(roundedBox(ww * 0.95, r * 0.12, r * 0.18, r * 0.04), tyreM, { parent: w, at: [0, Math.sin(a) * r * 0.97, Math.cos(a) * r * 0.97], rot: [-a, 0, 0] });
      }
      spin.push(w);
      if (front) steer.push(sg);
    }
  }
  // body shell
  const bodyM = c.m(0);
  const top = yc + 0.03;
  if (v.body === 'buggy' || v.body === 'stunt') {
    const shell = [[-h * 0.55, top - 0.03], [h * 0.75, top - 0.03], [h * 0.75, top - 0.018], [h * 0.25, top + 0.02], [-h * 0.2, top + 0.035], [-h * 0.55, top + 0.01]];
    mesh(sideBody(shell, W * 0.3, 0.012), bodyM, { parent: car });
    mesh(roundedBox(W * 0.24, 0.02, L * 0.14, 0.006), glassMat(T), { parent: car, at: [0, top + 0.022, h * 0.05], rot: [0.25, 0, 0] });
    if (v.body === 'buggy') {
      for (const s of [-1, 1]) tube([s * W * 0.12, top + 0.02, -h * 0.5], [s * W * 0.12, top + 0.06, -h * 0.7], 0.003, c.m(5), { parent: car });
      mesh(roundedBox(W * 0.7, 0.005, L * 0.14, 0.002), c.m(1), { parent: car, at: [0, top + 0.063, -h * 0.72], rot: [-0.12, 0, 0] });
    } else {
      // stunt car: double-sided roll cage around a squat body
      curveTube([[-W * 0.18, yc, -h * 0.5], [-W * 0.18, top + 0.05, -h * 0.2], [-W * 0.18, top + 0.05, h * 0.2], [-W * 0.18, yc, h * 0.5]], 0.004, c.m(1), { parent: car, segments: 24 });
      curveTube([[W * 0.18, yc, -h * 0.5], [W * 0.18, top + 0.05, -h * 0.2], [W * 0.18, top + 0.05, h * 0.2], [W * 0.18, yc, h * 0.5]], 0.004, c.m(1), { parent: car, segments: 24 });
    }
  } else if (v.body === 'truck' || v.body === 'crawler') {
    const lift = v.body === 'truck' ? 0.05 : 0.04;
    for (const s of [-1, 1]) tube([s * W * 0.12, yc + 0.03, h * 0.55], [s * W * 0.12, top + lift, h * 0.5], 0.004, c.m(5), { parent: car });
    for (const s of [-1, 1]) tube([s * W * 0.12, yc + 0.03, -h * 0.55], [s * W * 0.12, top + lift, -h * 0.5], 0.004, c.m(5), { parent: car });
    const by = top + lift;
    const pts = [[-h * 0.85, by], [h * 0.85, by], [h * 0.85, by + 0.03], [h * 0.5, by + 0.04], [h * 0.25, by + 0.075], [-h * 0.15, by + 0.075], [-h * 0.2, by + 0.04], [-h * 0.85, by + 0.04]];
    mesh(sideBody(pts, W * 0.62, 0.012), bodyM, { parent: car });
    cabinGlass(car, [[h * 0.5, by + 0.04], [h * 0.25, by + 0.075], [-h * 0.15, by + 0.075], [-h * 0.2, by + 0.04]], W * 0.62, 0.012, glassMat(T), [0, 0, 0]);
    if (v.body === 'crawler') {
      // light bar + spare tyre
      mesh(roundedBox(W * 0.5, 0.012, 0.016, 0.004), BLACK, { parent: car, at: [0, by + 0.093, h * 0.05] });
      const lb = bulbs(car, 'lightbar', 'white', [-0.3, -0.1, 0.1, 0.3].map((k) => [[k * W * 0.5, by + 0.093, h * 0.05 + 0.009], [0, 0, 1]]), { r: 0.005, blink: 0 });
      c.anims.push(clip('lights', 1, lb));
      mesh(new THREE.TorusGeometry(r * 0.6, r * 0.28, 10, 20).rotateX(Math.PI / 2), tyreM, { parent: car, at: [0, by + 0.052 + r * 0.28, -h * 0.55] });
    }
  } else {
    // drift coupe: low wide shell + spoiler
    const pts = [[-h * 0.95, top - 0.02], [h * 0.95, top - 0.02], [h * 0.95, top + 0.002], [h * 0.3, top + 0.015], [h * 0.05, top + 0.05], [-h * 0.45, top + 0.048], [-h * 0.75, top + 0.02], [-h * 0.95, top + 0.018]];
    mesh(sideBody(pts, W * 0.95, 0.016), bodyM, { parent: car });
    cabinGlass(car, [[h * 0.3, top + 0.015], [h * 0.05, top + 0.05], [-h * 0.45, top + 0.048], [-h * 0.75, top + 0.02]], W * 0.95, 0.016, glassMat(T), [0, 0, 0]);
    for (const s of [-1, 1]) mesh(roundedBox(0.004, 0.025, 0.02, 0.0015), c.m(5), { parent: car, at: [s * W * 0.3, top + 0.045, -h * 0.85] });
    mesh(roundedBox(W * 0.9, 0.005, 0.04, 0.002), c.m(1), { parent: car, at: [0, top + 0.06, -h * 0.85] });
    for (const s of [-1, 1]) mesh(roundedBox(W * 0.08, 0.004, L * 0.3, 0.0015), c.m(1), { parent: car, at: [s * W * 0.25, top + 0.0255, h * 0.6], rot: [0.04, 0, 0] });
  }
  // antenna
  tube([-W * 0.08, yc + 0.026, -h * 0.3], [-W * 0.08, yc + 0.12, -h * 0.4], 0.0015, BLACK, { parent: car });
  const tracks = remote(root, c, [W * 0.5 + 0.13, 0, L * 0.25], -0.5);
  c.anims.push(clip('drive', 1, [...spin.map((w) => spinTrack(w, 'x', 0.4)), ...steer.map((s) => rotateTrack(s, 'y', 1, (t) => wave(t) * 0.35)), ...tracks]));
}, { base: 'neon' });
