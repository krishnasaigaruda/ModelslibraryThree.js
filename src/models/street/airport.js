import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, rng, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, moveTrack, spinTrack, numberTrack, clip, pingPong, wave } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mats, pole, hasDOM } from './common.js';
import { finish } from './kit.js';

/* Airport set: jet bridge, baggage carousel, check-in desks, gate seating,
 * departures board, security screening, windsock, airfield lights, airfield
 * signs and baggage carts. Real-world sizes in metres, +z = front. */

const box = (parent, mat, w, h, d, x, y, z, r = 0.01, rot) => mesh(roundedBox(w, h, d, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)), mat, { parent, at: [x, y, z], rot });
const cyl = (parent, mat, rt, rb, h, x, y, z, seg = 24, rot) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, { parent, at: [x, y, z], rot });

function canvasTex(w, h, draw) {
  if (!hasDOM) return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/** Self-lit screen material (map doubles as emissive map so the 'lights' clip can brighten it). */
function screenMat(name, tex, base = 0.85) {
  return new THREE.MeshStandardMaterial({ name, color: '#ffffff', map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: base, roughness: 0.25 });
}

/** Hard-shell suitcase (lying flat when flat=true) with a carry handle; returns its group. */
function suitcase(parent, color, { at = [0, 0, 0], rotY = 0, w = 0.45, l = 0.66, t = 0.26, flat = true, name } = {}) {
  const g = group(name ?? 'bag', { parent, at, rot: [0, rotY, 0] });
  const shell = new THREE.MeshPhysicalMaterial({ name: 'bag-shell', color: M.toColor(color), roughness: 0.38, clearcoat: 0.4 });
  if (flat) {
    box(g, shell, w, t, l, 0, t / 2, 0, 0.05);
    box(g, M.plastic('#1a1a1a'), w + 0.01, 0.025, l + 0.01, 0, t / 2, 0, 0.01); // zip seam
    curveTube([[-0.08, t - 0.004, l / 2 - 0.12], [-0.06, t + 0.03, l / 2 - 0.12], [0.06, t + 0.03, l / 2 - 0.12], [0.08, t - 0.004, l / 2 - 0.12]], 0.012, M.plastic('#1a1a1a'), { parent: g, segments: 16, radialSegments: 8 });
  } else {
    box(g, shell, w, l, t, 0, l / 2 + 0.04, 0, 0.05);
    for (const s of [-1, 1]) cyl(g, M.rubber(), 0.03, 0.03, 0.03, s * (w / 2 - 0.05), 0.03, -t / 2 + 0.04, 14, [0, 0, Math.PI / 2]);
    box(g, M.plastic('#1a1a1a'), w + 0.01, 0.025, t + 0.01, 0, l / 2 + 0.04, 0, 0.01);
    curveTube([[-0.08, l + 0.036, 0], [-0.06, l + 0.07, 0], [0.06, l + 0.07, 0], [0.08, l + 0.036, 0]], 0.012, M.plastic('#1a1a1a'), { parent: g, segments: 16, radialSegments: 8 });
  }
  return g;
}
const BAG_COLORS = ['#1d2a44', '#7a1f24', '#2b2b2b', '#c9a227', '#3d6b4f', '#5a5f66', '#b5562a', '#6b4b8a', '#d7d2c8'];

/* ------------------------------- Jet bridge ------------------------------ */

export const JET_BRIDGE_VARIANTS = {
  standard: { skin: '#c9ccd0', la: 10, lb: 9, glazed: false },
  glass: { skin: '#d4d7da', la: 12, lb: 10, glazed: true },
  short: { skin: '#bfc3c7', la: 9, lb: 0, glazed: false },
};

export function createJetBridge(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(JET_BRIDGE_VARIANTS, o.variant, 'jet-bridge');
  const v = JET_BRIDGE_VARIANTS[variant];
  const root = group(`jet-bridge-${variant}`);
  const skin = M.paint(o.color ?? v.skin, { metallic: 0.5, roughness: 0.4 });
  const steel = mats.powder('#4a4f55');
  const dark = M.plastic('#1b1e22', 0.5);
  const glass = M.glass({ tint: '#3d5566' });
  const FY = 4.2; // floor height (aircraft door sill ≈ 4 m on a narrow-body)
  const W = 2.7;
  const H = 2.9;
  // rotunda: fixed round room on a column, joined to the terminal at -x
  cyl(root, mats.concrete(), 0.75, 0.9, 0.4, 0, 0.2, 0, 32);
  cyl(root, steel, 0.55, 0.55, FY - 0.6, 0, 0.4 + (FY - 0.6) / 2 - 0.01, 0, 32);
  cyl(root, skin, 2.3, 2.3, H + 0.6, 0, FY - 0.3 + (H + 0.6) / 2, 0, 40);
  cyl(root, steel, 2.42, 2.42, 0.25, 0, FY + H + 0.3 + 0.12, 0, 40);
  box(root, skin, 2.2, H, 2.4, -2.9, FY + H / 2, 0, 0.04); // stub to the terminal wall
  // tunnel A (fixed to the rotunda)
  const tunnelA = group('tunnel', { parent: root, at: [2.0, FY, 0] });
  const tube = (g, len, w, h, mat, x0) => {
    if (v.glazed) {
      box(g, mat, len, 0.3, w, x0 + len / 2, 0.15, 0, 0.03); // floor
      box(g, mat, len, 0.35, w, x0 + len / 2, h - 0.175, 0, 0.03); // roof
      for (const s of [-1, 1]) {
        box(g, glass, len - 0.1, h - 0.6, 0.05, x0 + len / 2, h / 2, s * (w / 2 - 0.05), 0.01);
        for (let x = x0 + 0.08; x <= x0 + len - 0.07; x += 1.2) box(g, mat, 0.1, h - 0.58, 0.12, x, h / 2, s * (w / 2 - 0.06), 0.02);
      }
    } else {
      box(g, mat, len, h, w, x0 + len / 2, h / 2, 0, 0.06);
      for (const s of [-1, 1]) {
        // ribbed skin + small windows
        for (let x = x0 + 0.5; x < x0 + len - 0.3; x += 0.9) box(g, mat, 0.08, h - 0.2, 0.05, x, h / 2, s * (w / 2 + 0.01), 0.01);
        for (let x = x0 + 1.5; x < x0 + len - 1; x += 3) box(g, glass, 0.9, 0.55, 0.04, x, h * 0.62, s * (w / 2 + 0.012), 0.01);
      }
    }
  };
  tube(tunnelA, v.la, W, H, skin, 0);
  let cabParent = tunnelA;
  let cabX = v.la;
  let inner = null;
  if (v.lb) {
    inner = group('tunnel_inner', { parent: tunnelA, at: [0, 0, 0] });
    tube(inner, v.lb, W - 0.16, H - 0.12, skin, v.la - 1.4);
    cabParent = inner;
    cabX = v.la - 1.4 + v.lb;
  }
  // cab: wider room that turns to the aircraft, with an accordion canopy and bumper
  const cab = group('cab', { parent: cabParent, at: [cabX, 0, 0] });
  box(cab, skin, 2.6, H + 0.2, 3.4, 1.25, (H + 0.2) / 2 - 0.08, 0, 0.06);
  box(cab, glass, 1.2, 0.8, 0.04, 1.4, H * 0.6, 1.71, 0.01);
  for (let i = 0; i < 6; i++) {
    const k = 1 + (i % 2) * 0.04;
    box(cab, M.fabric('#2a2c30'), 0.14, (H + 0.3) * k, 3.1 * k, 2.56 + i * 0.13, (H + 0.3) * k / 2 - 0.1, 0, 0.04);
  }
  box(cab, M.rubber(), 0.2, 0.25, 3.0, 3.3, 0.05, 0, 0.06);
  // drive column: two legs on a wheeled bogie under the outer end
  const colX = v.lb ? cabX - 1.0 : v.la - 1.0;
  const drive = group('drive', { parent: cabParent, at: [colX, 0, 0] });
  for (const s of [-1, 1]) {
    box(drive, steel, 0.35, FY - 0.55, 0.35, 0, -(FY - 0.55) / 2 + 0.05, s * 0.9, 0.03);
    box(drive, steel, 0.6, 0.35, 0.55, 0, -FY + 0.75, s * 0.9, 0.04);
    for (const dx of [-0.32, 0.32]) {
      const wheel = cyl(drive, M.rubber(), 0.38, 0.38, 0.3, dx, -FY + 0.38, s * 0.9 + s * 0.12, 24, [Math.PI / 2, 0, 0]);
      wheel.name = `wheel_${s > 0 ? 'L' : 'R'}${dx > 0 ? 'f' : 'r'}`;
      cyl(drive, M.metal('#8a9096'), 0.2, 0.2, 0.32, dx, -FY + 0.38, s * 0.9 + s * 0.12, 16, [Math.PI / 2, 0, 0]);
    }
  }
  box(drive, steel, 0.3, 0.3, 1.8, 0, -FY + 0.8, 0, 0.03);
  box(drive, steel, 0.5, 0.3, 2.1, 0, -0.1, 0, 0.03);
  // lights
  const beacon = lampGroup('beacon', 'amber');
  cyl(cab, dark, 0.09, 0.11, 0.12, 1.25, H + 0.18, 0, 16);
  beacon.add(cab, { at: [1.25, H + 0.25, 0], normal: [0, 1, 0], w: 0.14, h: 0.14, shape: 'round', depth: 0.08 });
  const flood = lampGroup('floodlight', 'white');
  for (const s of [-1, 1]) flood.add(cab, { at: [2.0, -0.07, s * 1.2], normal: [0.4, -1, 0], w: 0.28, h: 0.14, depth: 0.04 });
  const animations = [
    clip('beacon', 1, lampTracks('beacon', 2.6, { blink: 1.2 })),
    clip('lights', 1, lampTracks('floodlight', 3)),
  ];
  if (inner) animations.unshift(clip('extend', 8, [moveTrack(inner, 8, (t) => [pingPong(t) * 3.0, 0, 0])]));
  animations.push(clip('swing-cab', 6, [rotateTrack(cab, 'y', 6, (t) => wave(t) * 0.25)]));
  return finish(root, { type: 'jet-bridge', variant, o, animations, lean: false });
}

/* ---------------------------- Baggage carousel --------------------------- */

export const BAGGAGE_CAROUSEL_VARIANTS = {
  oval: { s: 7, r: 1.7, bags: 9 },
  long: { s: 13, r: 1.7, bags: 14 },
  round: { s: 0, r: 2.8, bags: 8 },
  empty: { s: 7, r: 1.7, bags: 0 },
};

export function createBaggageCarousel(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BAGGAGE_CAROUSEL_VARIANTS, o.variant, 'baggage-carousel');
  const v = BAGGAGE_CAROUSEL_VARIANTS[variant];
  const root = group(`baggage-carousel-${variant}`);
  const S = v.s;
  const R = v.r;
  const stainless = M.metal('#c4c8cc', 0.28);
  const stadium = (rad, hole) => {
    const sh = new THREE.Shape();
    sh.absarc(S / 2, 0, rad, -Math.PI / 2, Math.PI / 2, false);
    sh.absarc(-S / 2, 0, rad, Math.PI / 2, Math.PI * 1.5, false);
    if (hole) {
      const h = new THREE.Path();
      h.absarc(S / 2, 0, hole, -Math.PI / 2, Math.PI / 2, false);
      h.absarc(-S / 2, 0, hole, Math.PI / 2, Math.PI * 1.5, false);
      sh.holes.push(h);
    }
    return sh;
  };
  const slab = (shape, h, y, mat) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2);
    return mesh(g, mat, { parent: root, at: [0, y, 0] });
  };
  const BH = 0.45;
  slab(stadium(R + 0.55, R - 0.55), BH, 0, stainless);
  slab(stadium(R + 0.47, R - 0.5), 0.03, BH, M.plastic('#1c1d1f', 0.7));
  slab(stadium(R - 0.5, 0), 0.62, 0, stainless);
  slab(stadium(R - 0.62, 0), 0.02, 0.62, M.plastic('#2a2c2f', 0.6));
  // path round the belt centreline
  const P = 2 * S + 2 * Math.PI * R;
  const at = (u) => {
    let d = ((u % 1) + 1) % 1 * P;
    if (d < S) return [S / 2 - d, R, -Math.PI / 2 * 0 + Math.PI];
    d -= S;
    if (d < Math.PI * R) { const a = Math.PI / 2 + d / R; return [-S / 2 + Math.cos(a) * R, Math.sin(a) * R, -a + Math.PI / 2 + Math.PI]; }
    d -= Math.PI * R;
    if (d < S) return [-S / 2 + d, -R, 0];
    d -= S;
    const a = -Math.PI / 2 + d / R;
    return [S / 2 + Math.cos(a) * R, Math.sin(a) * R, -a + Math.PI / 2 + Math.PI];
  };
  // overlapping steel slats (instanced) and a rubber edge bumper
  const nSlat = Math.round(P / 0.22);
  const slat = new THREE.InstancedMesh(roundedBox(0.16, 0.012, 0.86, 0.004), M.metal('#3a3d41', 0.4), nSlat);
  slat.name = 'slats';
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < nSlat; i++) {
    const [x, z, ry] = at(i / nSlat);
    mtx.compose(new THREE.Vector3(x, BH + 0.035, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(1, 1, 1));
    slat.setMatrixAt(i, mtx);
  }
  root.add(slat);
  const edge = [];
  for (let i = 0; i < 64; i++) {
    const [x, z] = at(i / 64);
    const len = Math.hypot(x - (x > 0 ? Math.min(x, S / 2) : Math.max(x, -S / 2)), z) || 1;
    const cx = x > 0 ? Math.min(x, S / 2) : Math.max(x, -S / 2);
    edge.push([cx + ((x - cx) / len) * (R + 0.53), BH + 0.02, (z / len) * (R + 0.53)]);
  }
  curveTube(edge, 0.04, M.rubber(), { parent: root, closed: true, segments: 160, radialSegments: 8 });
  // beacon on the island: flashes while the belt runs
  const post = pole(0.7, { r: 0.04, base: 0.12, baseH: 0.03, collar: false });
  mesh(post, mats.powder('#2b3034'), { parent: root, at: [-S / 2, 0.64, 0] });
  const beacon = lampGroup('beacon', 'amber');
  beacon.add(root, { at: [-S / 2, 1.36, 0], normal: [0, 1, 0], w: 0.12, h: 0.12, shape: 'round', depth: 0.1 });
  // bags riding the belt
  const r = rng(`carousel-${variant}-${o.seed ?? 1}`);
  const tracks = [];
  const T = P / 0.45; // belt speed ≈ 0.45 m/s
  for (let i = 0; i < v.bags; i++) {
    const u0 = i / v.bags + r() * 0.03;
    const [x, z, ry] = at(u0);
    const upright = r() < 0.15;
    const bag = suitcase(root, BAG_COLORS[i % BAG_COLORS.length], { at: [x, BH + 0.04, z], rotY: ry + (r() - 0.5) * 0.5, w: 0.38 + r() * 0.12, l: 0.55 + r() * 0.2, t: 0.22 + r() * 0.08, flat: !upright, name: `bag_${i}` });
    const times = [];
    const pos = [];
    const rot = [];
    const q = new THREE.Quaternion();
    const off = bag.rotation.y - ry;
    for (let k = 0; k <= 48; k++) {
      const t = k / 48;
      const [px, pz, pr] = at(u0 + t);
      times.push(t * T);
      pos.push(px, BH + 0.04, pz);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pr + off);
      rot.push(q.x, q.y, q.z, q.w);
    }
    tracks.push(new THREE.VectorKeyframeTrack(`${bag.name}.position`, times, pos), new THREE.QuaternionKeyframeTrack(`${bag.name}.quaternion`, times, rot));
  }
  const animations = [];
  if (tracks.length) animations.push(clip('running', T, tracks));
  animations.push(clip('beacon', 1, lampTracks('beacon', 2.6, { blink: 1.2 })));
  return finish(root, { type: 'baggage-carousel', variant, o, animations, lean: false });
}

/* ------------------------------ Check-in desk ---------------------------- */

export const CHECK_IN_DESK_VARIANTS = {
  single: { desks: 1, accent: '#1f4e8c' },
  double: { desks: 2, accent: '#1f4e8c' },
  kiosk: { desks: 0, accent: '#0e7a6b' },
  'kiosk-row': { desks: -3, accent: '#0e7a6b' },
};

function checkInScreen(text, accent) {
  return canvasTex(256, 320, (g, w, h) => {
    g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.fillRect(0, 0, w, 70);
    g.fillStyle = '#fff'; g.font = 'bold 34px Helvetica, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, 36);
    g.fillStyle = '#1b1e22'; g.font = '24px Helvetica, Arial, sans-serif';
    g.fillText('Touch to start', w / 2, 130);
    g.fillStyle = accent; g.beginPath(); g.roundRect(48, 200, w - 96, 64, 14); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 26px Helvetica, Arial, sans-serif'; g.fillText('START', w / 2, 233);
  });
}

function kiosk(root, x, accent, screen) {
  const body = mats.powder('#e9ebee');
  box(root, mats.powder('#2b3034'), 0.62, 0.05, 0.5, x, 0.025, 0, 0.01);
  box(root, body, 0.5, 1.05, 0.36, x, 0.05 + 0.525, -0.02, 0.05);
  box(root, M.plastic(accent), 0.52, 0.06, 0.38, x, 0.9, -0.02, 0.02);
  // angled head with the touch screen
  const head = group('kiosk_head', { parent: root, at: [x, 1.22, 0.02], rot: [-0.45, 0, 0] });
  box(head, body, 0.56, 0.62, 0.12, 0, 0, 0, 0.04);
  mesh(new THREE.PlaneGeometry(0.46, 0.52), screen, { parent: head, at: [0, 0.01, 0.061], name: 'screen' });
  box(root, M.plastic('#1b1e22'), 0.22, 0.02, 0.04, x, 0.78, 0.17, 0.008); // printer slot
  box(root, M.plastic('#1b1e22'), 0.14, 0.1, 0.03, x + 0.12, 1.0, 0.16, 0.01); // card reader
}

export function createCheckInDesk(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CHECK_IN_DESK_VARIANTS, o.variant, 'check-in-desk');
  const v = CHECK_IN_DESK_VARIANTS[variant];
  const root = group(`check-in-desk-${variant}`);
  const accent = o.color ?? v.accent;
  const animations = [];
  if (v.desks <= 0) {
    const n = Math.max(1, -v.desks);
    const scr = screenMat('screen', checkInScreen('CHECK-IN', accent));
    for (let i = 0; i < n; i++) kiosk(root, (i - (n - 1) / 2) * 0.8, accent, scr);
    animations.push(clip('lights', 1, [numberTrack('screen.material.emissiveIntensity', 1, () => 1.3, 1)]));
    return finish(root, { type: 'check-in-desk', variant, o, animations, lean: false });
  }
  const panel = M.paint(accent, { metallic: 0.2, roughness: 0.45 });
  const top = M.matte('#e8e4dc', 0.4);
  const steel = M.metal('#b9bdc1', 0.3);
  const belt = M.plastic('#1c1d1f', 0.75);
  const DW = 1.6;
  const signTex = [];
  for (let d = 0; d < v.desks; d++) {
    const x0 = (d - (v.desks - 1) / 2) * (DW + 1.0);
    // passenger-side counter: tall front panel, stone top; agent side worktop behind
    box(root, panel, DW, 1.02, 0.12, x0, 0.51, 0.3, 0.02);
    box(root, M.matte('#d9d6cf'), DW, 0.1, 0.62, x0, 0.05, 0.0, 0.01);
    box(root, top, DW + 0.04, 0.05, 0.36, x0, 1.045, 0.24, 0.01);
    box(root, M.matte('#d9d6cf'), DW, 0.72, 0.05, x0, 0.46, -0.3, 0.01);
    box(root, top, DW, 0.04, 0.62, x0, 0.75, -0.0, 0.01);
    for (const s of [-1, 1]) box(root, M.matte('#d9d6cf'), 0.05, 1.0, 0.62, x0 + s * (DW / 2 - 0.025), 0.5, 0, 0.01);
    // monitor, keyboard, boarding-pass printer
    box(root, M.plastic('#1b1e22'), 0.18, 0.015, 0.14, x0 - 0.2, 0.778, -0.12, 0.005);
    box(root, M.plastic('#1b1e22'), 0.04, 0.24, 0.04, x0 - 0.2, 0.89, -0.14, 0.01);
    const mon = box(root, M.plastic('#1b1e22'), 0.5, 0.32, 0.035, x0 - 0.2, 1.12, -0.12, 0.01);
    mon.rotation.x = -0.12;
    box(root, M.plastic('#2a2c30'), 0.42, 0.015, 0.14, x0 - 0.2, 0.778, 0.08, 0.005);
    box(root, M.plastic('#d6d8db'), 0.24, 0.14, 0.22, x0 + 0.35, 0.84, -0.1, 0.02);
    // logo strip on the front
    const n = 11 + d;
    signTex.push(n);
    // bag-drop belt + scale beside the desk
    const bx = x0 + DW / 2 + 0.5;
    box(root, steel, 1.0, 0.36, 0.95, bx, 0.18, 0.05, 0.02);
    box(root, belt, 0.96, 0.03, 0.9, bx, 0.375, 0.05, 0.01);
    for (let k = -3; k <= 3; k++) box(root, M.metal('#555a60', 0.4), 0.02, 0.006, 0.86, bx + k * 0.13, 0.392, 0.05, 0.002);
    box(root, M.plastic('#1b1e22'), 0.16, 0.1, 0.05, bx, 0.43, 0.5, 0.01);
    if (d === v.desks - 1 || v.desks === 1) box(root, steel, 0.05, 0.6, 0.95, bx + 0.52, 0.3, 0.05, 0.01);
    if (d === 0) suitcase(root, BAG_COLORS[d + 1], { at: [bx, 0.39, 0.05], rotY: 0.1, flat: true });
    // number sign on a post behind the desk
    const tex = canvasTex(256, 160, (g, w, h) => {
      g.fillStyle = '#1b1e22'; g.fillRect(0, 0, w, h);
      g.fillStyle = accent; g.fillRect(0, h - 26, w, 26);
      g.fillStyle = '#ffd400'; g.font = 'bold 96px Helvetica, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(n), w / 2, 64);
    });
    box(root, mats.powder('#2b3034'), 0.08, 2.0, 0.08, x0, 1.0, -0.36, 0.01);
    box(root, M.plastic('#1b1e22'), 0.62, 0.42, 0.1, x0, 2.15, -0.36, 0.02);
    const sm = screenMat('number_sign', tex);
    for (const s of [1, -1]) mesh(new THREE.PlaneGeometry(0.56, 0.36), sm, { parent: root, at: [x0, 2.15, -0.36 + s * 0.051], rot: [0, s > 0 ? 0 : Math.PI, 0], name: `number_sign_${d}` });
  }
  // queue posts with retractable belts in front
  const postMat = M.metal('#c8ccd0', 0.22);
  const tape = M.fabric(accent);
  const span = v.desks * (DW + 1.0);
  const xs = [-span / 2, 0, span / 2];
  const zq = 1.4;
  for (const x of xs) {
    mesh(lathe([[0.001, 0], [0.17, 0], [0.17, 0.02], [0.03, 0.04], [0.03, 0.94], [0.04, 0.96], [0.035, 1.0], [0.001, 1.0]], 24), postMat, { parent: root, at: [x, 0, zq] });
  }
  for (let i = 0; i < xs.length - 1; i++) box(root, tape, xs[i + 1] - xs[i] - 0.05, 0.05, 0.006, (xs[i] + xs[i + 1]) / 2, 0.93, zq, 0.002);
  animations.push(clip('lights', 1, signTex.map((_, d) => numberTrack(`number_sign_${d}.material.emissiveIntensity`, 1, () => 1.4, 1))));
  return finish(root, { type: 'check-in-desk', variant, o, animations, lean: false });
}

/* ------------------------------ Gate seating ----------------------------- */

export const GATE_SEATING_VARIANTS = {
  'row-3': { seats: 3, color: '#1d1f22' },
  'row-5': { seats: 5, color: '#22406a' },
  'back-to-back': { seats: 4, color: '#1d1f22', back: true },
  'with-table': { seats: 4, color: '#5a1f24', table: true },
};

export function createGateSeating(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(GATE_SEATING_VARIANTS, o.variant, 'gate-seating');
  const v = GATE_SEATING_VARIANTS[variant];
  const root = group(`gate-seating-${variant}`);
  const frame = M.metal('#aeb3b8', 0.3);
  const upholstery = new THREE.MeshPhysicalMaterial({ name: 'leather', color: M.toColor(o.color ?? v.color), roughness: 0.5, clearcoat: 0.2 });
  const PITCH = 0.62;
  const n = v.seats + (v.table ? 1 : 0);
  const L = n * PITCH;
  box(root, frame, L + 0.1, 0.08, 0.12, 0, 0.32, 0, 0.01); // beam
  for (const s of [-1, 1]) {
    const x = s * (L / 2 - 0.15);
    box(root, frame, 0.07, 0.32, 0.07, x, 0.16, 0, 0.01);
    box(root, frame, 0.07, 0.04, 0.62, x, 0.02, 0, 0.01);
    for (const z of [-0.28, 0.28]) cyl(root, M.rubber(), 0.03, 0.03, 0.012, x, 0.006, z, 12);
  }
  const rows = v.back ? [1, -1] : [1];
  for (const dir of rows) {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * PITCH;
      const z0 = dir * (v.back ? 0.06 : 0);
      if (v.table && i === Math.floor(n / 2)) {
        box(root, frame, 0.06, 0.18, 0.06, x, 0.44, z0 + dir * 0.04, 0.01);
        box(root, M.matte('#d8d4cc', 0.5), 0.56, 0.035, 0.5, x, 0.52, z0 + dir * 0.18, 0.01);
        box(root, M.plastic('#1b1e22'), 0.16, 0.02, 0.08, x, 0.545, z0 + dir * 0.04, 0.005); // power + USB block
        continue;
      }
      const seat = group(`seat_${dir > 0 ? 'f' : 'b'}${i}`, { parent: root, at: [x, 0, z0], rot: [0, dir > 0 ? 0 : Math.PI, 0] });
      box(seat, frame, 0.06, 0.1, 0.36, 0, 0.39, 0.12, 0.01); // bracket off the beam
      box(seat, upholstery, 0.5, 0.07, 0.48, 0, 0.47, 0.2, 0.03);
      box(seat, frame, 0.58, 0.02, 0.5, 0, 0.43, 0.2, 0.01);
      box(seat, frame, 0.06, 0.42, 0.04, 0, 0.64, -0.06, 0.01, [-0.14, 0, 0]);
      box(seat, upholstery, 0.5, 0.5, 0.07, 0, 0.75, -0.04, 0.03, [-0.14, 0, 0]);
      // armrest on the left of every seat (and the right of the last one)
      const arms = i === n - 1 || (v.table && i === Math.floor(n / 2) - 1) ? [-1, 1] : [-1];
      for (const s of arms) {
        box(seat, frame, 0.04, 0.24, 0.04, s * 0.29, 0.55, 0.15, 0.01);
        box(seat, M.plastic('#1b1e22'), 0.06, 0.035, 0.36, s * 0.29, 0.68, 0.18, 0.012);
        box(seat, frame, 0.04, 0.02, 0.3, s * 0.29, 0.44, 0.18, 0.005);
      }
    }
  }
  return finish(root, { type: 'gate-seating', variant, o, animations: [], lean: false });
}

/* ---------------------------- Departures board --------------------------- */

export const DEPARTURE_BOARD_VARIANTS = {
  hanging: { w: 2.4, h: 1.35, mount: 'cables' },
  standing: { w: 1.25, h: 2.1, mount: 'stand' },
  wall: { w: 3.2, h: 1.2, mount: 'wall' },
  arrivals: { w: 2.4, h: 1.35, mount: 'cables', arrivals: true },
};

const CITIES = ['LONDON', 'PARIS', 'TOKYO', 'DUBAI', 'NEW YORK', 'SINGAPORE', 'ROME', 'MADRID', 'SYDNEY', 'TORONTO', 'BERLIN', 'LISBON', 'SEOUL', 'CHICAGO', 'OSLO', 'VIENNA', 'MUMBAI', 'ATHENS'];
const STATUS = [['ON TIME', '#4cd964'], ['BOARDING', '#ffd400'], ['GATE OPEN', '#4cd964'], ['DELAYED', '#ff6b3d'], ['FINAL CALL', '#ff3b30'], ['CLOSED', '#9aa0a6']];

function boardTexture(seed, arrivals, portrait) {
  return canvasTex(portrait ? 640 : 1024, portrait ? 1024 : 576, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = '#0b1424'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#12233f'; g.fillRect(0, 0, w, 74);
    g.fillStyle = '#ffd400'; g.font = 'bold 44px Helvetica, Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText(arrivals ? 'ARRIVALS' : 'DEPARTURES', 24, 38);
    g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText('14:05', w - 24, 38);
    const cols = portrait ? [[24, 'TIME'], [130, 'FLIGHT'], [270, 'TO'], [w - 24, 'GATE']] : [[24, 'TIME'], [140, 'FLIGHT'], [300, arrivals ? 'FROM' : 'TO'], [640, 'GATE'], [760, 'STATUS']];
    g.font = 'bold 22px Helvetica, Arial, sans-serif'; g.fillStyle = '#8fa3bf';
    for (const [x, t] of cols) { g.textAlign = x === w - 24 ? 'right' : 'left'; g.fillText(t, x, 100); }
    const rows = portrait ? 14 : 10;
    const rh = (h - 124) / rows;
    for (let i = 0; i < rows; i++) {
      const y = 124 + rh * (i + 0.5);
      if (i % 2) { g.fillStyle = '#0f1b30'; g.fillRect(0, y - rh / 2, w, rh); }
      const hh = 14 + Math.floor((i * 12 + r() * 10) / 60);
      const mm = String((5 + i * 12 + Math.floor(r() * 8)) % 60).padStart(2, '0');
      const fl = `${['PM', 'SK', 'NV', 'AQ', 'TR'][Math.floor(r() * 5)]} ${100 + Math.floor(r() * 899)}`;
      const city = CITIES[Math.floor(r() * CITIES.length)];
      const gate = `${'ABCD'[Math.floor(r() * 4)]}${1 + Math.floor(r() * 30)}`;
      const [st, sc] = STATUS[Math.floor(r() * STATUS.length)];
      g.font = `bold ${portrait ? 30 : 30}px Helvetica, Arial, sans-serif`; g.textAlign = 'left'; g.fillStyle = '#ffffff';
      g.fillText(`${hh}:${mm}`, cols[0][0], y);
      g.fillStyle = '#ffd400'; g.fillText(fl, cols[1][0], y);
      g.fillStyle = '#ffffff'; g.fillText(city, cols[2][0], y, portrait ? 220 : 320);
      if (portrait) { g.textAlign = 'right'; g.fillText(gate, w - 24, y); } else {
        g.fillText(gate, cols[3][0], y);
        g.fillStyle = sc; g.fillText(st, cols[4][0], y);
      }
    }
  });
}

export function createDepartureBoard(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(DEPARTURE_BOARD_VARIANTS, o.variant, 'departure-board');
  const v = DEPARTURE_BOARD_VARIANTS[variant];
  const root = group(`departure-board-${variant}`);
  const housing = mats.powder('#22262b');
  const W = v.w;
  const H = v.h;
  const portrait = H > W;
  const cy = v.mount === 'stand' ? 0.35 + H / 2 : v.mount === 'wall' ? 1.9 : 2.6;
  const scr = screenMat('screen', boardTexture(`board-${variant}-${o.seed ?? 1}`, !!v.arrivals, portrait), 0.9);
  const faces = v.mount === 'cables' ? [1, -1] : [1];
  box(root, housing, W + 0.08, H + 0.08, v.mount === 'cables' ? 0.16 : 0.1, 0, cy, 0, 0.02);
  for (const s of faces) mesh(new THREE.PlaneGeometry(W, H), scr, { parent: root, at: [0, cy, s * (v.mount === 'cables' ? 0.081 : 0.051)], rot: [0, s > 0 ? 0 : Math.PI, 0], name: 'screen' });
  if (v.mount === 'cables') {
    for (const s of [-1, 1]) {
      box(root, housing, 0.08, 0.04, 0.08, s * (W / 2 - 0.2), cy + H / 2 + 0.06, 0, 0.01);
      cyl(root, M.metal('#9aa0a6', 0.3), 0.006, 0.006, 1.2, s * (W / 2 - 0.2), cy + H / 2 + 0.68, 0, 8);
      box(root, M.matte('#e6e6e6'), 0.3, 0.03, 0.3, s * (W / 2 - 0.2), cy + H / 2 + 1.29, 0, 0.01); // ceiling plate
    }
  } else if (v.mount === 'stand') {
    box(root, housing, W + 0.1, 0.35, 0.12, 0, 0.175, 0, 0.02);
    box(root, housing, W + 0.3, 0.04, 0.6, 0, 0.02, 0, 0.01);
  } else {
    box(root, M.matte('#d9d6cf'), W + 0.6, H + 0.6, 0.04, 0, cy, -0.07, 0.005); // wall panel
  }
  const animations = [clip('lights', 1, [numberTrack('screen.material.emissiveIntensity', 1, () => 1.4, 1)]), clip('flicker', 2, [numberTrack('screen.material.emissiveIntensity', 2, (t) => (Math.floor(t * 20) % 7 === 3 ? 0.3 : 1.2), 20, THREE.InterpolateDiscrete)])];
  const obj = finish(root, { type: 'departure-board', variant, o, animations, lean: false });
  if (v.mount !== 'stand') obj.userData.floating = true; // hangs from the ceiling plates / fixed to a wall
  return obj;
}

/* --------------------------- Security screening -------------------------- */

export const SECURITY_SCANNER_VARIANTS = {
  'x-ray': { kind: 'xray' },
  'walk-through': { kind: 'arch' },
  'body-scanner': { kind: 'pod' },
  lane: { kind: 'lane' },
};

function xray(root, x0) {
  const body = mats.powder('#d9dcdf');
  const dark = M.plastic('#1b1e22');
  const L = 2.2;
  const TW = 0.7; // tunnel opening
  const TH = 0.55;
  const BW = 1.0;
  const BY = 0.72; // belt height
  box(root, body, L, BY, BW, x0, BY / 2, 0, 0.03);
  box(root, body, L, 0.5, BW, x0, BY + TH + 0.25, 0, 0.05);
  for (const s of [-1, 1]) box(root, body, L, TH + 0.02, (BW - TW) / 2, x0, BY + TH / 2, s * (TW / 2 + (BW - TW) / 4), 0.02);
  box(root, M.plastic('#1c1d1f', 0.75), L + 0.02, 0.02, TW, x0, BY + 0.01, 0, 0.005);
  // lead curtains at both openings
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) box(root, M.plastic('#2f3236', 0.8), 0.006, TH - 0.05, TW / 6 - 0.01, x0 + sx * (L / 2 - 0.02), BY + 0.03 + (TH - 0.05) / 2 + 0.02, -TW / 2 + TW / 12 + (k * TW) / 6, 0.002);
  // roller tables both ends
  const roller = M.metal('#c4c8cc', 0.25);
  for (const sx of [-1, 1]) {
    const xc = x0 + sx * (L / 2 + 0.75);
    for (const z of [-0.36, 0.36]) {
      box(root, mats.powder('#2b3034'), 1.5, 0.08, 0.05, xc, BY - 0.04, z, 0.01);
      for (const dx of [-0.65, 0.65]) box(root, mats.powder('#2b3034'), 0.05, BY - 0.08, 0.05, xc + dx, (BY - 0.08) / 2, z, 0.01);
    }
    for (let k = 0; k < 12; k++) cyl(root, roller, 0.025, 0.025, 0.72, xc - 0.66 + k * 0.12, BY - 0.0, 0, 12, [Math.PI / 2, 0, 0]);
  }
  // operator monitor on an arm
  box(root, mats.powder('#2b3034'), 0.05, 0.5, 0.05, x0 + 0.6, BY + TH + 0.75, 0.42, 0.01);
  const mon = box(root, dark, 0.5, 0.34, 0.04, x0 + 0.6, BY + TH + 1.15, 0.42, 0.01);
  mon.rotation.y = 0.5;
  // tray riding through
  const tray = group('tray', { parent: root, at: [x0 - L / 2 - 0.8, BY + 0.025, 0] });
  box(tray, M.plastic('#5a6068', 0.5), 0.62, 0.02, 0.42, 0, 0.01, 0, 0.01);
  for (const s of [-1, 1]) { box(tray, M.plastic('#5a6068', 0.5), 0.62, 0.1, 0.02, 0, 0.06, s * 0.2, 0.008); box(tray, M.plastic('#5a6068', 0.5), 0.02, 0.1, 0.42, s * 0.3, 0.06, 0, 0.008); }
  box(tray, M.plastic('#1b1e22'), 0.36, 0.06, 0.26, 0, 0.05, 0, 0.02); // laptop bag
  return { tray, L, BY, TH };
}

export function createSecurityScanner(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SECURITY_SCANNER_VARIANTS, o.variant, 'security-scanner');
  const v = SECURITY_SCANNER_VARIANTS[variant];
  const root = group(`security-scanner-${variant}`);
  const animations = [];
  const green = lampGroup('status_ok', 'green');
  const red = lampGroup('status_alarm', 'red');
  const arch = (x0, z0) => {
    const panel = mats.powder('#d9dcdf');
    for (const s of [-1, 1]) {
      box(root, panel, 0.12, 2.15, 0.6, x0 + s * 0.46, 1.075, z0, 0.03);
      box(root, mats.powder('#2b3034'), 0.3, 0.02, 0.7, x0 + s * 0.46, 0.01, z0, 0.005);
      box(root, M.plastic('#1b1e22'), 0.02, 1.6, 0.06, x0 + s * 0.4, 1.05, z0 + 0.2, 0.005); // LED zone bars
    }
    box(root, panel, 1.04, 0.3, 0.6, x0, 2.3, z0, 0.04);
    green.add(root, { at: [x0 - 0.12, 2.3, z0 + 0.3], normal: [0, 0, 1], w: 0.12, h: 0.06, depth: 0.015 });
    red.add(root, { at: [x0 + 0.12, 2.3, z0 + 0.3], normal: [0, 0, 1], w: 0.12, h: 0.06, depth: 0.015 });
  };
  if (v.kind === 'xray' || v.kind === 'lane') {
    const { tray, L } = xray(root, 0);
    animations.push(clip('running', 6, [moveTrack(tray, 6, (t) => [t * (L + 1.6), 0, 0])]));
    green.add(root, { at: [-0.2, 1.77, 0.3], normal: [0, 1, 0], w: 0.1, h: 0.1, shape: 'round', depth: 0.02 });
    red.add(root, { at: [0.2, 1.77, 0.3], normal: [0, 1, 0], w: 0.1, h: 0.1, shape: 'round', depth: 0.02 });
    if (v.kind === 'lane') arch(1.0, 1.6);
  } else if (v.kind === 'arch') {
    arch(0, 0);
  } else {
    // millimetre-wave body scanner: two curved glass walls between a base and a canopy
    const panel = mats.powder('#e4e6e8');
    box(root, panel, 1.7, 0.1, 1.5, 0, 0.05, 0, 0.03);
    box(root, M.plastic('#f0c419', 0.6), 0.5, 0.004, 0.25, -0.25, 0.102, 0, 0.002);
    box(root, M.plastic('#f0c419', 0.6), 0.5, 0.004, 0.25, 0.25, 0.102, 0, 0.002);
    for (const s of [-1, 1]) {
      const wall = new THREE.CylinderGeometry(0.85, 0.85, 2.1, 32, 1, true, s > 0 ? Math.PI / 2 - 0.9 : Math.PI * 1.5 - 0.9, 1.8);
      mesh(wall, new THREE.MeshPhysicalMaterial({ name: 'scanner-panel', color: '#cfd6dc', roughness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide }), { parent: root, at: [0, 1.15, 0] });
      box(root, panel, 0.14, 2.1, 0.5, s * 0.82, 1.15, 0.45, 0.03);
      box(root, panel, 0.14, 2.1, 0.5, s * 0.82, 1.15, -0.45, 0.03);
    }
    box(root, panel, 1.8, 0.22, 1.5, 0, 2.31, 0, 0.05);
    green.add(root, { at: [-0.15, 2.31, 0.76], normal: [0, 0, 1], w: 0.12, h: 0.06, depth: 0.015 });
    red.add(root, { at: [0.15, 2.31, 0.76], normal: [0, 0, 1], w: 0.12, h: 0.06, depth: 0.015 });
  }
  animations.push(clip('clear', 1, lampTracks('status_ok', 2.4)));
  animations.push(clip('alarm', 1, lampTracks('status_alarm', 2.6, { blink: 2 })));
  return finish(root, { type: 'security-scanner', variant, o, animations, lean: false, oneShot: [], exclusive: ['clear', 'alarm'] });
}

/* -------------------------------- Windsock ------------------------------- */

export const WINDSOCK_VARIANTS = {
  pole: { h: 6, lit: false },
  lit: { h: 6, lit: true },
  rooftop: { h: 2.6, lit: false, plate: true },
};

export function createWindsock(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(WINDSOCK_VARIANTS, o.variant, 'windsock');
  const v = WINDSOCK_VARIANTS[variant];
  const root = group(`windsock-${variant}`);
  const H = v.h;
  const mastMat = mats.powder('#e9ebee');
  if (v.plate) box(root, mats.galv(), 0.6, 0.02, 0.6, 0, 0.01, 0, 0.005);
  else cyl(root, mats.concrete(), 0.5, 0.55, 0.25, 0, 0.125, 0, 24);
  const y0 = v.plate ? 0.02 : 0.25;
  mesh(pole(H - y0, { r: 0.06, top: 0.045, base: 0.16, baseH: 0.06 }), mastMat, { parent: root, at: [0, y0, 0] });
  // swivel head with a ring frame; the sock hangs from it
  const head = group('sock_head', { parent: root, at: [0, H, 0] });
  cyl(head, mats.powder('#2b3034'), 0.05, 0.05, 0.16, 0, 0.0, 0, 16);
  const R0 = v.plate ? 0.22 : 0.38;
  const LEN = v.plate ? 1.6 : 3.6;
  box(head, mats.powder('#2b3034'), 0.42, 0.03, 0.03, 0.21, 0.02, 0, 0.01);
  const ring = mesh(new THREE.TorusGeometry(R0, 0.015, 8, 32), mats.powder('#2b3034'), { parent: head, at: [0.4, 0.02 - R0, 0], rot: [0, Math.PI / 2, 0] });
  ring.name = 'sock_ring';
  const sock = group('sock', { parent: head, at: [0.4, 0.02 - R0, 0] });
  const orange = new THREE.MeshStandardMaterial({ name: 'sock-orange', color: '#f26a1b', roughness: 0.75, side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({ name: 'sock-white', color: '#f4f4f0', roughness: 0.75, side: THREE.DoubleSide });
  const n = 5;
  for (let i = 0; i < n; i++) {
    const r1 = R0 * (1 - 0.45 * (i / n));
    const r2 = R0 * (1 - 0.45 * ((i + 1) / n));
    const seg = new THREE.CylinderGeometry(r2, r1, LEN / n, 28, 3, true).rotateZ(Math.PI / 2).translate(LEN / n * (i + 0.5), 0, 0);
    // gentle droop + ripple so it reads as fabric in a light breeze
    const p = seg.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      p.setY(k, p.getY(k) - 0.06 * (x / LEN) ** 2 * LEN + 0.012 * Math.sin(x * 9 + p.getZ(k) * 6));
    }
    seg.computeVertexNormals();
    mesh(seg, i % 2 ? white : orange, { parent: sock, name: `sock_${i}` });
  }
  const animations = [clip('wind', 6, [rotateTrack(head, 'y', 6, (t) => wave(t) * 0.35), rotateTrack(sock, 'x', 6, (t) => wave(t, 6) * 0.06), rotateTrack(sock, 'z', 6, (t) => -0.04 + wave(t, 3) * 0.04)])];
  if (v.lit) {
    // four floodlights on a cross-arm below the head + red obstruction light on top
    const flood = lampGroup('floodlight', 'white');
    for (const s of [-1, 1]) {
      box(root, mats.powder('#2b3034'), 0.9, 0.05, 0.05, 0, H - 0.6, 0, 0.01, [0, s > 0 ? 0 : Math.PI / 2, 0]);
      for (const e of [-1, 1]) {
        const [x, z] = s > 0 ? [e * 0.45, 0] : [0, e * 0.45];
        box(root, mats.powder('#2b3034'), 0.12, 0.1, 0.12, x, H - 0.53, z, 0.01);
        flood.add(root, { at: [x, H - 0.47, z], normal: [-x * 0.3, 1, -z * 0.3], w: 0.1, h: 0.1, depth: 0.03 });
      }
    }
    const beacon = lampGroup('obstruction', 'red');
    cyl(root, mats.powder('#2b3034'), 0.03, 0.03, 0.2, 0, H + 0.18, 0, 12);
    beacon.add(root, { at: [0, H + 0.29, 0], normal: [0, 1, 0], w: 0.1, h: 0.1, shape: 'round', depth: 0.06 });
    animations.push(clip('lights', 1, [...lampTracks('floodlight', 3), ...lampTracks('obstruction', 2.6)]));
  }
  return finish(root, { type: 'windsock', variant, o, animations, lean: false });
}

/* ---------------------------- Airfield lights ---------------------------- */

export const RUNWAY_LIGHT_VARIANTS = {
  edge: { kind: 'elevated', lamp: 'white', lens: '#f4f2e8' },
  threshold: { kind: 'elevated', lamp: 'green', lens: '#3ad16a' },
  taxiway: { kind: 'elevated', lamp: 'blue', lens: '#3a78ff' },
  'runway-end': { kind: 'elevated', lamp: 'red', lens: '#ff3a2a' },
  inset: { kind: 'inset', lamp: 'white', lens: '#f4f2e8' },
  papi: { kind: 'papi', lamp: 'white', lens: '#f4f2e8' },
};

export function createRunwayLight(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(RUNWAY_LIGHT_VARIANTS, o.variant, 'runway-light');
  const v = RUNWAY_LIGHT_VARIANTS[variant];
  const root = group(`runway-light-${variant}`);
  const yellow = M.paint('#f2c200', { metallic: 0.2, roughness: 0.45 });
  const animations = [];
  if (v.kind === 'papi') {
    // 4 light boxes on adjustable legs: 2 show red, 2 show white (on the glide slope)
    box(root, mats.concrete(), 5.2, 0.15, 1.2, 0, 0.075, 0, 0.02);
    const red = lampGroup('papi_red', 'red');
    const white = lampGroup('papi_white', 'white');
    for (let i = 0; i < 4; i++) {
      const x = -2.1 + i * 1.4;
      for (const [dx, dz] of [[-0.35, -0.2], [0.35, -0.2], [0, 0.25]]) cyl(root, mats.galv(), 0.025, 0.025, 0.4, x + dx, 0.35, dz, 10);
      box(root, yellow, 1.0, 0.45, 0.7, x, 0.75, 0, 0.04);
      box(root, M.plastic('#1b1e22'), 1.04, 0.08, 0.2, x, 0.99, 0.3, 0.02); // hood
      for (const dx of [-0.25, 0.25]) (i < 2 ? red : white).add(root, { at: [x + dx, 0.75, 0.351], normal: [0, 0, 1], w: 0.2, h: 0.2, shape: 'round', depth: 0.03 });
    }
    animations.push(clip('lights', 1, [...lampTracks('papi_red', 2.6), ...lampTracks('papi_white', 3)]));
  } else if (v.kind === 'inset') {
    // flush light in a round steel can set into a square of concrete
    box(root, mats.concrete('#8f8f8a'), 0.7, 0.1, 0.7, 0, 0.05, 0, 0.01);
    cyl(root, M.metal('#7a7f84', 0.45), 0.2, 0.2, 0.025, 0, 0.1125, 0, 32);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; cyl(root, M.metal('#5a5f64', 0.4), 0.012, 0.012, 0.01, Math.cos(a) * 0.17, 0.13, Math.sin(a) * 0.17, 8); }
    const lamp = lampGroup('light', v.lamp);
    for (const s of [-1, 1]) lamp.add(root, { at: [0, 0.13, s * 0.08], normal: [0, 0.25, s], w: 0.08, h: 0.02, depth: 0.012 });
    animations.push(clip('lights', 1, lampTracks('light', LAMP(v.lamp))));
  } else {
    // elevated light: base can + frangible coupling + yellow stem + domed lens
    cyl(root, mats.concrete('#8f8f8a'), 0.3, 0.32, 0.12, 0, 0.06, 0, 24);
    cyl(root, M.metal('#6a6f74', 0.45), 0.13, 0.13, 0.03, 0, 0.135, 0, 24);
    cyl(root, M.metal('#2b2f33', 0.4), 0.035, 0.04, 0.06, 0, 0.18, 0, 16); // frangible coupling (snaps if hit)
    cyl(root, yellow, 0.03, 0.03, 0.28, 0, 0.35, 0, 16);
    cyl(root, yellow, 0.07, 0.04, 0.06, 0, 0.52, 0, 20);
    const lamp = lampGroup('light', v.lamp);
    const dome = new THREE.SphereGeometry(0.07, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.55, 0);
    lamp.add(root, { geometry: dome, normal: [0, 0, 1], depth: 0.02 });
    animations.push(clip('lights', 1, lampTracks('light', LAMP(v.lamp))));
  }
  return finish(root, { type: 'runway-light', variant, o, animations, lean: false });
}
const LAMP = (k) => ({ white: 4, green: 2.4, blue: 3, red: 2.6 }[k] ?? 3);

/* ----------------------------- Airfield signs ---------------------------- */

export const AIRFIELD_SIGN_VARIANTS = {
  location: { bg: '#111111', fg: '#ffd400', text: 'B', border: '#ffd400', w: 1.0 },
  direction: { bg: '#ffd400', fg: '#111111', text: '← A   B →', w: 2.0 },
  'runway-holding': { bg: '#c8102e', fg: '#ffffff', text: '09-27', w: 1.6, border: '#ffffff' },
  'distance-remaining': { bg: '#111111', fg: '#ffffff', text: '4', w: 1.0 },
  gate: { bg: '#1b1e22', fg: '#ffd400', text: 'GATE B12', w: 1.8, hang: true },
};

export function createAirfieldSign(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(AIRFIELD_SIGN_VARIANTS, o.variant, 'airfield-sign');
  const v = AIRFIELD_SIGN_VARIANTS[variant];
  const root = group(`airfield-sign-${variant}`);
  const W = v.w;
  const H = 0.75;
  const tex = canvasTex(Math.round(256 * W / H), 256, (g, w, h) => {
    g.fillStyle = v.bg; g.fillRect(0, 0, w, h);
    if (v.border) { g.strokeStyle = v.border; g.lineWidth = 12; g.strokeRect(18, 18, w - 36, h - 36); }
    g.fillStyle = v.fg; g.font = `bold ${v.text.length > 4 ? 150 : 180}px Helvetica, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(v.text, w / 2, h / 2 + 8, w - 60);
  });
  const face = screenMat('sign_face', tex, 0.35);
  const cabinet = mats.powder('#2b3034');
  const cy = v.hang ? 2.8 : 0.85;
  box(root, cabinet, W + 0.1, H + 0.1, 0.32, 0, cy, 0, 0.02);
  for (const s of [1, -1]) mesh(new THREE.PlaneGeometry(W, H), face, { parent: root, at: [0, cy, s * 0.161], rot: [0, s > 0 ? 0 : Math.PI, 0], name: 'sign_face' });
  if (v.hang) {
    for (const s of [-1, 1]) {
      cyl(root, M.metal('#9aa0a6', 0.3), 0.012, 0.012, 1.0, s * (W / 2 - 0.15), cy + H / 2 + 0.55, 0, 8);
      box(root, M.matte('#e6e6e6'), 0.2, 0.03, 0.2, s * (W / 2 - 0.15), cy + H / 2 + 1.06, 0, 0.01);
    }
  } else {
    // concrete pad + two frangible legs
    box(root, mats.concrete('#8f8f8a'), W + 0.6, 0.15, 0.9, 0, 0.075, 0, 0.02);
    for (const s of [-1, 1]) {
      cyl(root, mats.galv(), 0.035, 0.035, 0.3, s * (W / 2 - 0.15), 0.3, 0, 12);
      cyl(root, M.metal('#2b2f33', 0.4), 0.045, 0.045, 0.06, s * (W / 2 - 0.15), 0.18, 0, 12);
      box(root, mats.galv(), 0.1, 0.06, 0.1, s * (W / 2 - 0.15), 0.46, 0, 0.01);
    }
  }
  const animations = [clip('lights', 1, [numberTrack('sign_face.material.emissiveIntensity', 1, () => 1.3, 1)])];
  const obj = finish(root, { type: 'airfield-sign', variant, o, animations, lean: false });
  if (v.hang) obj.userData.floating = true; // hangs from the ceiling plates
  return obj;
}

/* ------------------------------ Baggage cart ----------------------------- */

export const BAGGAGE_CART_VARIANTS = {
  open: { carts: 1, covered: false },
  covered: { carts: 1, covered: true },
  train: { carts: 3, covered: true },
  'open-train': { carts: 2, covered: false },
};

function bagCart(root, x0, { covered, color, r, idx }) {
  const g = group(`cart_${idx}`, { parent: root, at: [x0, 0, 0] });
  const frame = M.paint(color, { metallic: 0.3, roughness: 0.5 });
  const steel = mats.powder('#2b3034');
  const L = 2.8;
  const Wd = 1.45;
  const DY = 0.6; // deck height
  box(g, steel, L, 0.12, Wd - 0.1, 0, DY - 0.08, 0, 0.02);
  box(g, M.metal('#8a8f94', 0.5), L, 0.04, Wd, 0, DY, 0, 0.01); // chequer-plate deck
  const wheels = [];
  for (const ax of [-L / 2 + 0.45, L / 2 - 0.45]) {
    box(g, steel, 0.12, 0.12, Wd - 0.06, ax, 0.23, 0, 0.02); // axle beam
    for (const s of [-1, 1]) {
      box(g, steel, 0.1, DY - 0.32, 0.1, ax, 0.22 + (DY - 0.32) / 2, s * 0.45, 0.01);
      const w = cyl(g, M.rubber(), 0.23, 0.23, 0.16, ax, 0.23, s * (Wd / 2 - 0.02), 24, [Math.PI / 2, 0, 0]);
      w.name = `cart${idx}_wheel_${ax > 0 ? 'f' : 'r'}${s > 0 ? 'L' : 'R'}`;
      cyl(g, M.metal('#a3a8ad', 0.35), 0.12, 0.12, 0.17, ax, 0.23, s * (Wd / 2 - 0.02), 16, [Math.PI / 2, 0, 0]);
      wheels.push(w);
    }
  }
  // drawbar (front) + tow hitch (rear)
  box(g, steel, 1.3, 0.06, 0.06, L / 2 + 0.2, 0.23, 0, 0.01);
  mesh(new THREE.TorusGeometry(0.07, 0.015, 8, 16), steel, { parent: g, at: [L / 2 + 0.91, 0.23, 0], rot: [Math.PI / 2, 0, 0] });
  box(g, steel, 0.18, 0.08, 0.12, -L / 2 - 0.08, 0.5, 0, 0.01);
  // corner posts + end frames; roof and side curtains on covered carts
  const posts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) posts.push([sx * (L / 2 - 0.04), sz * (Wd / 2 - 0.04)]);
  const top = covered ? 1.85 : 1.25;
  for (const [x, z] of posts) box(g, frame, 0.06, top - DY, 0.06, x, DY + (top - DY) / 2, z, 0.01);
  for (const sx of [-1, 1]) {
    box(g, frame, 0.05, 0.05, Wd - 0.08, sx * (L / 2 - 0.04), top, 0, 0.01);
    box(g, frame, 0.05, 0.05, Wd - 0.08, sx * (L / 2 - 0.04), DY + 0.35, 0, 0.01);
  }
  if (covered) {
    box(g, frame, L + 0.1, 0.06, Wd + 0.08, 0, top + 0.03, 0, 0.02);
    const canvas = M.fabric('#2f3b46');
    for (const s of [-1, 1]) {
      // curtain half rolled up on one side, down on the other
      const drop = s > 0 ? 0.45 : top - DY - 0.1;
      box(g, canvas, L - 0.1, drop, 0.02, 0, top - drop / 2, s * (Wd / 2 - 0.03), 0.005);
      if (s > 0) cyl(g, canvas, 0.06, 0.06, L - 0.1, 0, top - drop - 0.04, s * (Wd / 2 - 0.01), 16, [0, 0, Math.PI / 2]);
    }
  } else {
    for (const s of [-1, 1]) box(g, frame, L - 0.08, 0.05, 0.05, 0, DY + 0.35, s * (Wd / 2 - 0.04), 0.01);
  }
  // bags stacked on the deck
  const nb = 4 + Math.floor(r() * 4);
  for (let i = 0; i < nb; i++) {
    const layer = i < 4 ? 0 : 1;
    const xi = -0.95 + (i % 4) * 0.62;
    suitcase(g, BAG_COLORS[(idx * 3 + i) % BAG_COLORS.length], { at: [xi, DY + 0.02 + layer * 0.25, (r() - 0.5) * 0.3], rotY: Math.PI / 2 + (r() - 0.5) * 0.3, flat: true, t: 0.25 });
  }
  return wheels;
}

export function createBaggageCart(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BAGGAGE_CART_VARIANTS, o.variant, 'baggage-cart');
  const v = BAGGAGE_CART_VARIANTS[variant];
  const root = group(`baggage-cart-${variant}`);
  const r = rng(`cart-${variant}-${o.seed ?? 1}`);
  const wheels = [];
  for (let i = 0; i < v.carts; i++) wheels.push(...bagCart(root, (i - (v.carts - 1) / 2) * 3.75, { covered: v.covered, color: o.color ?? '#f2c200', r, idx: i }));
  const animations = [clip('roll', 1.2, wheels.map((w) => spinTrack(w, 'y', 1.2, -1)))];
  return finish(root, { type: 'baggage-cart', variant, o, animations, lean: false });
}
