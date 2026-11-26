import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe,
  woodMat, fabricMat, leatherMat, metalMat, plasticMat,
  taperBox, turnedLeg, bentSlab, pipedCushion, starBase, buttons, STYLE,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';

/** Horizontal rail along X, bowed backwards (−Z) by `bow`. */
function railX(len, height, thick, bow = 0.03) {
  return bentSlab([[-len / 2, 0], [0, -bow], [len / 2, 0]], height, thick, { segments: 20 })
    .rotateY(Math.PI / 2)
    .rotateX(-Math.PI / 2);
}

/** Offset a [z, y] path along its left normal (the side bentSlab's +thickness / cup faces). */
function offsetPath(path, d) {
  const c = new THREE.SplineCurve(path.map(([z, y]) => new THREE.Vector2(z, y)));
  return path.map((_, i) => {
    const u = i / (path.length - 1);
    const t = c.getTangent(Math.min(0.999, Math.max(0.001, u)));
    const p = c.getPoint(u);
    return [p.x - t.y * d, p.y + t.x * d];
  });
}

/** Height of a [z, y] spline path at depth z. */
function pathY(path, z) {
  const c = new THREE.SplineCurve(path.map(([pz, y]) => new THREE.Vector2(pz, y)));
  let best = null;
  for (let i = 0; i <= 200; i++) { const p = c.getPoint(i / 200); if (!best || Math.abs(p.x - z) < Math.abs(best.x - z)) best = p; }
  return best.y;
}

/* =============================== CHAIRS =============================== */

export const CHAIR_VARIANTS = {
  dining: { color: '#8b7d6b', wood: 'walnut' },
  office: { color: '#2b2f36', metal: 'black' },
  armchair: { color: '#5f7f68', wood: 'walnut' },
  rocking: { color: '#a0522d', wood: 'cherry' },
  'bar-stool': { color: '#3b2a20', metal: 'chrome' },
  wingback: { color: '#7a2e35', wood: 'walnut' },
  lounge: { color: '#1b1b1b', wood: 'walnut', metal: 'black' },
  folding: { color: '#c9a978', metal: 'black', wood: 'oak' },
  gaming: { color: '#c62828', metal: 'black' },
  'accent-shell': { color: '#e8e2d6', wood: 'oak', metal: 'black' },
  'ladder-back': { color: '#c9a66b', wood: 'oak' },
  stacking: { color: '#2f6f8f', metal: 'chrome' },
};

export function createChair(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CHAIR_VARIANTS, o.variant, 'chair');
  const v = CHAIR_VARIANTS[variant];
  const root = group(`chair-${variant}`);
  const W = woodMat(o.wood ?? v.wood ?? 'oak');
  const F = fabricMat(o.color ?? v.color);
  const L = leatherMat(o.color ?? v.color);
  const MT = metalMat(o.metal ?? v.metal ?? 'steel');
  const animations = [];

  if (variant === 'dining') {
    for (const x of [0.2, -0.2]) {
      mesh(taperBox(0.042, 0.43, 0.042, 0.65), W, { parent: root, at: [x, 0.215, 0.19] });
      mesh(taperBox(0.042, 0.43, 0.042, 0.7), W, { parent: root, at: [x, 0.215, -0.2] });
      curveTube([[x, 0.42, -0.2], [x, 0.7, -0.235], [x * 0.97, 0.97, -0.28]], 0.019, W, { parent: root, segments: 16 });
    }
    for (const [x, z, rx] of [[0, 0.19, 0], [0, -0.2, 0], [0.2, 0, Math.PI / 2], [-0.2, 0, Math.PI / 2]]) {
      mesh(roundedBox(rx ? 0.022 : 0.36, 0.06, rx ? 0.36 : 0.022, 0.006), W, { parent: root, at: [x, 0.4, z] });
    }
    mesh(roundedBox(0.47, 0.035, 0.45, 0.012), W, { parent: root, at: [0, 0.448, 0] });
    const pad = pipedCushion(0.43, 0.055, 0.41, F, { bulge: 0.35 });
    pad.position.set(0, 0.49, 0.01);
    root.add(pad);
    mesh(railX(0.4, 0.08, 0.024, 0.035), W, { parent: root, at: [0, 0.92, -0.27] });
    for (const x of [-0.1, 0, 0.1]) mesh(bentSlab([[-0.215, 0.5], [-0.24, 0.7], [-0.265, 0.88]], 0.045, 0.014), W, { parent: root, at: [x, 0, 0] });
  } else if (variant === 'office') {
    starBase(root, 0.44, { mat: MT });
    const seat = group('seat', { parent: root });
    mesh(roundedBox(0.44, 0.03, 0.42, 0.01), plasticMat('#151515'), { parent: seat, at: [0, 0.44, 0] });
    const sc = pipedCushion(0.5, 0.085, 0.48, F, { bulge: 0.3 });
    sc.position.set(0, 0.5, 0.01);
    seat.add(sc);
    const backPath = [[-0.25, 0.6], [-0.285, 0.8], [-0.27, 1.06]];
    const meshMat = new THREE.MeshStandardMaterial({ color: M.toColor(o.color ?? v.color).multiplyScalar(0.7), roughness: 0.95, side: THREE.DoubleSide });
    mesh(bentSlab(backPath, 0.44, 0.012, { cup: -0.035 }), meshMat, { parent: seat });
    for (const x of [0.225, -0.225]) curveTube(backPath.map(([z, y]) => [x, y, z + 0.035]), 0.014, plasticMat('#111'), { parent: seat, segments: 20 });
    curveTube([[-0.225, 1.06, -0.235], [0, 1.09, -0.25], [0.225, 1.06, -0.235]], 0.016, plasticMat('#111'), { parent: seat });
    curveTube([[-0.225, 0.6, -0.215], [0, 0.6, -0.24], [0.225, 0.6, -0.215]], 0.016, plasticMat('#111'), { parent: seat });
    mesh(cushion(0.32, 0.12, 0.05, { radius: 0.02 }), F, { parent: seat, at: [0, 0.72, -0.25] });
    curveTube([[0, 0.46, -0.18], [0, 0.48, -0.25], [0, 0.6, -0.27]], 0.022, plasticMat('#111'), { parent: seat });
    for (const x of [0.275, -0.275]) {
      curveTube([[x * 0.85, 0.48, -0.05], [x, 0.56, -0.04], [x, 0.66, 0.0]], 0.016, plasticMat('#111'), { parent: seat });
      mesh(cushion(0.075, 0.035, 0.26, { radius: 0.015 }), plasticMat('#1a1a1a', 0.7), { parent: seat, at: [x, 0.675, 0.02] });
    }
    // headrest on two posts rising from the back frame's top rail
    for (const x of [0.08, -0.08]) curveTube([[x, 1.07, -0.24], [x, 1.15, -0.255]], 0.008, MT, { parent: seat, segments: 2 });
    mesh(cushion(0.28, 0.12, 0.07, { radius: 0.03 }), F, { parent: seat, at: [0, 1.16, -0.26], rot: [-0.1, 0, 0] });
    animations.push(clip('spin', 4, [rotateTrack(seat, 'y', 4, (t) => wave(t) * 0.9)]));
  } else if (variant === 'armchair') {
    for (const [x, z] of [[0.36, 0.34], [-0.36, 0.34], [0.36, -0.34], [-0.36, -0.34]]) mesh(turnedLeg(0.1, 0.03, 'taper'), W, { parent: root, at: [x, 0, z] });
    mesh(cushion(0.86, 0.26, 0.84, { radius: 0.06, bulge: 0.08 }), F, { parent: root, at: [0, 0.23, 0] });
    for (const s of [1, -1]) {
      mesh(cushion(0.17, 0.32, 0.84, { radius: 0.07, bulge: 0.1 }), F, { parent: root, at: [s * 0.345, 0.52, 0] });
      const roll = new THREE.CylinderGeometry(0.1, 0.1, 0.84, 24).rotateX(Math.PI / 2);
      mesh(roll, F, { parent: root, at: [s * 0.36, 0.66, 0] });
      curveTube([[s * 0.36 + s * 0.1, 0.66, 0.42], [s * 0.36, 0.76, 0.42], [s * 0.36 - s * 0.1, 0.66, 0.42]], 0.007, F, { parent: root, segments: 12 });
    }
    mesh(cushion(0.86, 0.62, 0.2, { radius: 0.08, bulge: 0.08 }), F, { parent: root, at: [0, 0.66, -0.33], rot: [-0.08, 0, 0] });
    const seat = pipedCushion(0.56, 0.15, 0.62, F, { bulge: 0.3 });
    seat.position.set(0, 0.43, 0.08);
    root.add(seat);
    const back = pipedCushion(0.54, 0.42, 0.14, F, { bulge: 0.3 });
    back.position.set(0, 0.72, -0.2);
    back.rotation.x = -0.14;
    root.add(back);
  } else if (variant === 'rocking') {
    const R = 1.5;
    const rocker = group('rocker', { parent: root, at: [0, R, 0] });
    const body = group(null, { parent: rocker, at: [0, -R, 0] });
    for (const x of [0.24, -0.24]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = -0.34 + (i / 16) * 0.62;
        pts.push([x, R - R * Math.cos(a) + 0.018, R * Math.sin(a)]);
      }
      curveTube(pts, 0.018, W, { parent: body, segments: 40 });
      const yOn = (z) => R - Math.sqrt(R * R - z * z) + 0.03;
      curveTube([[x, yOn(0.2), 0.2], [x * 0.95, 0.44, 0.18]], 0.02, W, { parent: body });
      curveTube([[x, yOn(-0.2), -0.2], [x * 0.95, 0.44, -0.18]], 0.02, W, { parent: body });
      curveTube([[x * 0.95, 0.44, -0.18], [x * 1.0, 0.75, -0.26], [x * 1.05, 1.02, -0.33]], 0.02, W, { parent: body });
      curveTube([[x * 1.05, 0.68, -0.22], [x * 1.12, 0.69, 0.0], [x * 1.08, 0.66, 0.2]], 0.017, W, { parent: body });
      curveTube([[x * 0.95, 0.46, 0.17], [x * 1.08, 0.66, 0.2]], 0.014, W, { parent: body });
      curveTube([[x, 0.2, 0.19], [x, 0.2, -0.19]], 0.011, W, { parent: body });
    }
    mesh(cushion(0.52, 0.05, 0.47, { radius: 0.02, bulge: -0.2 }), W, { parent: body, at: [0, 0.46, 0] });
    mesh(cushion(0.42, 0.05, 0.38, { radius: 0.02, bulge: 0.4 }), fabricMat(o.color ?? '#b07d52'), { parent: body, at: [0, 0.505, 0.02] });
    for (let i = 0; i < 7; i++) {
      const x = -0.18 + i * 0.06;
      curveTube([[x, 0.48, -0.19], [x * 1.08, 0.75, -0.26], [x * 1.15, 1.0, -0.32]], 0.009, W, { parent: body, segments: 12, radialSegments: 8 });
    }
    curveTube([[-0.26, 1.0, -0.31], [0, 1.04, -0.37], [0.26, 1.0, -0.31]], 0.026, W, { parent: body });
    animations.push(clip('rock', 2.4, [rotateTrack(rocker, 'x', 2.4, (t) => wave(t) * 0.11)]));
  } else if (variant === 'bar-stool') {
    mesh(lathe([[0, 0], [0.22, 0], [0.22, 0.012], [0.2, 0.025], [0.06, 0.04], [0, 0.04]], 40), MT, { parent: root });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.66, 20), MT, { parent: root, at: [0, 0.37, 0] });
    mesh(new THREE.TorusGeometry(0.17, 0.012, 10, 48), MT, { parent: root, at: [0, 0.3, 0], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      curveTube([[0, 0.3, 0], [Math.cos(a) * 0.17, 0.3, Math.sin(a) * 0.17]], 0.008, MT, { parent: root });
    }
    const seat = group('seat', { parent: root });
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 20), MT, { parent: seat, at: [0, 0.71, 0] });
    mesh(lathe([[0, 0], [0.19, 0], [0.205, 0.015], [0.205, 0.055], [0.18, 0.08], [0.1, 0.088], [0, 0.09]], 48), leatherMat(o.color ?? v.color), { parent: seat, at: [0, 0.73, 0] });
    curveTube([[0.19, 0.778, 0], ...Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return [Math.cos(a) * 0.198, 0.778, Math.sin(a) * 0.198]; })], 0.005, leatherMat(o.color ?? v.color), { parent: seat, closed: true, segments: 64 });
    mesh(bentSlab([[-0.17, 0.86], [-0.195, 0.93], [-0.19, 0.99]], 0.34, 0.03, { cup: -0.04 }), leatherMat(o.color ?? v.color), { parent: seat });
    for (const x of [0.1, -0.1]) curveTube([[x, 0.715, -0.06], [x, 0.72, -0.16], [x, 0.8, -0.205], [x, 0.9, -0.21]], 0.009, MT, { parent: seat, segments: 20 });
    animations.push(clip('swivel', 4, [rotateTrack(seat, 'y', 4, (t) => wave(t) * 0.8)]));
  } else if (variant === 'wingback') {
    for (const [x, z] of [[0.33, 0.32], [-0.33, 0.32], [0.33, -0.32], [-0.33, -0.32]]) mesh(turnedLeg(0.14, 0.03, 'baluster'), W, { parent: root, at: [x, 0, z] });
    mesh(cushion(0.8, 0.22, 0.78, { radius: 0.05, bulge: 0.06 }), F, { parent: root, at: [0, 0.25, 0] });
    for (const s of [1, -1]) {
      mesh(cushion(0.13, 0.26, 0.66, { radius: 0.05 }), F, { parent: root, at: [s * 0.335, 0.49, 0.03] });
      const roll = new THREE.CylinderGeometry(0.075, 0.075, 0.66, 20).rotateX(Math.PI / 2);
      mesh(roll, F, { parent: root, at: [s * 0.345, 0.62, 0.03] });
      const wing = group(null, { parent: root, at: [s * 0.35, 0.88, -0.12], rot: [0, s * 0.22, 0] });
      mesh(cushion(0.11, 0.5, 0.42, { radius: 0.05, bulge: 0.1 }), F, { parent: wing });
    }
    const back = group(null, { parent: root, at: [0, 0.86, -0.32], rot: [-0.08, 0, 0] });
    mesh(cushion(0.78, 0.86, 0.16, { radius: 0.07, bulge: 0.15 }), F, { parent: back });
    buttons(back, F, 5, 4, 0.6, 0.6, [0, 0.05, 0.085]);
    const seat = pipedCushion(0.54, 0.13, 0.6, F, { bulge: 0.35 });
    seat.position.set(0, 0.42, 0.06);
    root.add(seat);
    curveTube(Array.from({ length: 9 }, (_, i) => [-0.4 + i * 0.1, 0.15, 0.39]), 0.006, F, { parent: root });
  } else if (variant === 'lounge') {
    // swivel base: lift top at y 0.3 carries the seat shell's round mount plate
    starBase(root, 0.3, { mat: MT, legLen: 0.36 });
    const swivel = group('seat', { parent: root });
    const ST = 0.025; // shell thickness
    // seat shell runs back → front so its normal (and cup) points up; back shell runs bottom → top so its normal points rearwards
    const seatPath = [[-0.21, 0.4], [-0.08, 0.372], [0.05, 0.37], [0.3, 0.42]];
    const backPath = [[-0.245, 0.45], [-0.32, 0.72], [-0.35, 1.0]];
    mesh(bentSlab(seatPath, 0.64, ST, { cup: 0.05 }), W, { parent: swivel, name: 'seat-shell' });
    mesh(bentSlab(backPath, 0.62, ST, { cup: -0.06 }), W, { parent: swivel, name: 'back-shell' });
    // cushions lie IN the shells: their inner face sits on the shell face
    mesh(bentSlab(offsetPath(seatPath, ST / 2 + 0.038), 0.56, 0.08, { cup: 0.045 }), L, { parent: swivel, name: 'seat-cushion' });
    mesh(bentSlab(offsetPath(backPath, -(ST / 2 + 0.038)), 0.54, 0.08, { cup: -0.055 }), L, { parent: swivel, name: 'back-cushion' });
    // mount plate bolted under the seat shell, sitting on the gas lift
    const under = (z) => pathY(seatPath, z) - ST / 2;
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.014, 32), MT, { parent: swivel, at: [0, under(0) - 0.007, 0] });
    mesh(new THREE.CylinderGeometry(0.04, 0.045, under(0) - 0.014 - 0.29, 20), MT, { parent: swivel, at: [0, 0.29 + (under(0) - 0.014 - 0.29) / 2, 0] });
    // two aluminium spines join the seat shell (underside) to the back shell (rear face)
    const dRear = ST / 2 + 0.006 - 0.06 * (0.19 / 0.31) ** 2; // back-shell cup brings its sides forward
    const rear = offsetPath(backPath, dRear);
    for (const s of [1, -1]) {
      const spine = [[0.02, under(0.02) - 0.006], [-0.12, under(-0.12) - 0.006], [-0.235, under(-0.2) - 0.012], rear[0], ...offsetPath(backPath, dRear).slice(1, 2)];
      mesh(bentSlab(spine, 0.045, 0.012, { segments: 36 }), MT, { parent: swivel, at: [s * 0.19, 0, 0] });
    }
    // armrests: cast arm bolted to the seat-shell side edge, curving up under the pad
    for (const s of [1, -1]) {
      const edgeY = (z) => pathY(seatPath, z) + 0.05 * (0.3 / 0.32) ** 2;
      curveTube([[s * 0.3, edgeY(-0.14), -0.14], [s * 0.315, edgeY(-0.06), -0.06], [s * 0.335, 0.52, -0.01], [s * 0.34, 0.6, 0.02]], 0.013, MT, { parent: swivel, segments: 20 });
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12).rotateZ(Math.PI / 2), MT, { parent: swivel, at: [s * 0.3, edgeY(-0.14), -0.14] });
      mesh(cushion(0.08, 0.045, 0.36, { radius: 0.02 }), L, { parent: swivel, at: [s * 0.34, 0.62, 0.03] });
    }
    animations.push(clip('swivel', 5, [rotateTrack(swivel, 'y', 5, (t) => wave(t) * 0.6)]));
  } else if (variant === 'folding') {
    for (const s of [1, -1]) {
      const x = s * 0.21;
      curveTube([[x, 0, 0.24], [x, 0.45, -0.16], [x * 0.98, 0.86, -0.22]], 0.013, MT, { parent: root, segments: 20 });
      curveTube([[x * 0.95, 0, -0.24], [x * 0.95, 0.45, 0.18]], 0.013, MT, { parent: root });
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12).rotateZ(Math.PI / 2), MT, { parent: root, at: [x, 0.25, 0.02] });
      for (const z of [0.24, -0.24]) mesh(new THREE.SphereGeometry(0.016, 10, 8), plasticMat('#111'), { parent: root, at: [s * (z > 0 ? 0.21 : 0.2), 0.01, z] });
    }
    for (let i = 0; i < 5; i++) mesh(roundedBox(0.44, 0.018, 0.068, 0.006), W, { parent: root, at: [0, 0.46, -0.13 + i * 0.075] });
    for (const y of [0.66, 0.8]) mesh(railX(0.42, 0.075, 0.016, 0.025), W, { parent: root, at: [0, y, -0.205 - (y - 0.66) * 0.14] });
  } else if (variant === 'gaming') {
    starBase(root, 0.46, { mat: MT, legLen: 0.34 });
    const seat = group('seat', { parent: root });
    const black = leatherMat('#161616');
    const acc = leatherMat(o.color ?? v.color);
    mesh(cushion(0.36, 0.09, 0.48, { radius: 0.03 }), black, { parent: seat, at: [0, 0.52, 0.02] });
    for (const s of [1, -1]) {
      mesh(cushion(0.1, 0.13, 0.5, { radius: 0.045 }), acc, { parent: seat, at: [s * 0.23, 0.55, 0.02] });
      curveTube([[s * 0.29, 0.5, -0.06], [s * 0.3, 0.6, -0.04], [s * 0.3, 0.68, 0]], 0.02, MT, { parent: seat });
      mesh(cushion(0.09, 0.04, 0.27, { radius: 0.015 }), plasticMat('#151515', 0.7), { parent: seat, at: [s * 0.3, 0.7, 0.02] });
    }
    const back = group(null, { parent: seat, at: [0, 0.98, -0.26], rot: [-0.12, 0, 0] });
    mesh(cushion(0.34, 0.86, 0.11, { radius: 0.04 }), black, { parent: back });
    for (const s of [1, -1]) {
      mesh(cushion(0.11, 0.7, 0.16, { radius: 0.05 }), acc, { parent: back, at: [s * 0.21, -0.06, 0.03] });
      mesh(cushion(0.12, 0.18, 0.13, { radius: 0.04 }), black, { parent: back, at: [s * 0.2, 0.34, 0.02] });
    }
    { const e = brandEmblem(0.08, { name: 'emblem' }); e.position.set(0, 0.33, 0.062); back.add(e); }
    mesh(cushion(0.24, 0.12, 0.08, { radius: 0.035, bulge: 0.4 }), acc, { parent: back, at: [0, 0.25, 0.08] });
    mesh(cushion(0.26, 0.14, 0.09, { radius: 0.04, bulge: 0.4 }), black, { parent: back, at: [0, -0.22, 0.09] });
    curveTube([[0, 0.5, -0.2], [0, 0.56, -0.3]], 0.025, MT, { parent: seat });
    animations.push(clip('spin', 4, [rotateTrack(seat, 'y', 4, (t) => wave(t) * 0.9)]));
  } else if (variant === 'accent-shell') {
    const shellPath = [[0.23, 0.455], [0.1, 0.44], [-0.08, 0.44], [-0.19, 0.48], [-0.235, 0.62], [-0.225, 0.8]];
    const cupS = 0.045;
    mesh(bentSlab(shellPath, 0.48, 0.014, { cup: -cupS, segments: 48 }), plasticMat(o.color ?? v.color, 0.35), { parent: root });
    for (const [x, z] of [[0.18, 0.17], [-0.18, 0.17], [0.18, -0.15], [-0.18, -0.15]]) {
      // leg top tucks just under the shell (shell underside = path y + cup lift − half thickness)
      const top = pathY(shellPath, z * 0.8) + cupS * ((x * 0.8) / 0.24) ** 2 - 0.007 - 0.012;
      curveTube([[x * 1.25, 0, z * 1.25], [x * 0.8, top, z * 0.8]], 0.016, W, { parent: root, segments: 4 });
      mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 16), MT, { parent: root, at: [x * 0.8, top + 0.01, z * 0.8] });
    }
    for (const s2 of [1, -1]) curveTube([[s2 * 0.235, 0.12, 0.226], [0, 0.17, 0.02], [-s2 * 0.235, 0.12, -0.192]], 0.004, MT, { parent: root });
  } else if (variant === 'ladder-back') {
    for (const x of [0.21, -0.21]) {
      mesh(turnedLeg(0.45, 0.02, 'spindle'), W, { parent: root, at: [x, 0, 0.2] });
      mesh(turnedLeg(1.05, 0.021, 'spindle'), W, { parent: root, at: [x, 0, -0.19] });
      mesh(new THREE.SphereGeometry(0.024, 12, 8), W, { parent: root, at: [x, 1.07, -0.19] });
      for (const y of [0.15, 0.28]) curveTube([[x, y, 0.2], [x, y, -0.19]], 0.009, W, { parent: root });
    }
    for (const z of [0.2, -0.19]) curveTube([[0.21, 0.15, z], [-0.21, 0.15, z]], 0.009, W, { parent: root });
    for (let i = 0; i < 4; i++) mesh(railX(0.42, 0.06, 0.014, 0.035), W, { parent: root, at: [0, 0.62 + i * 0.12, -0.2] });
    const rush = fabricMat(o.color ?? v.color);
    if (rush.map) { rush.map = rush.map.clone(); rush.map.repeat.set(18, 18); }
    mesh(cushion(0.44, 0.04, 0.42, { radius: 0.015, bulge: -0.25 }), rush, { parent: root, at: [0, 0.455, 0.005] });
    for (const z of [0.2, -0.19]) curveTube([[0.22, 0.45, z], [-0.22, 0.45, z]], 0.014, W, { parent: root });
  } else {
    // stacking
    for (const x of [0.19, -0.19]) {
      // one continuous bent tube per side: front leg → seat rail → back leg
      curveTube([[x * 1.06, 0, 0.23], [x, 0.415, 0.2], [x, 0.435, 0.1], [x, 0.435, -0.12], [x, 0.415, -0.19], [x * 1.06, 0, -0.22]], 0.011, MT, { parent: root, segments: 64 });
    }
    for (const z of [0.2, -0.19]) curveTube([[0.19, 0.38, z], [-0.19, 0.38, z]], 0.008, MT, { parent: root });
    mesh(bentSlab([[0.23, 0.448], [0.0, 0.442], [-0.16, 0.45], [-0.215, 0.56], [-0.225, 0.82]], 0.44, 0.014, { cup: -0.015, segments: 48 }), plasticMat(o.color ?? v.color, 0.4), { parent: root });
  }
  return finalize(root, { type: 'chair', variant, options: o, animations });
}

/* =============================== SOFAS =============================== */

export const SOFA_VARIANTS = {
  loveseat: { seats: 2, color: '#56707c', arm: 'track', legs: 'taper' },
  'three-seat': { seats: 3, color: '#8a7f72', arm: 'rolled', legs: 'bun' },
  sectional: { seats: 3, color: '#3f4a3c', arm: 'track', legs: 'block', chaise: true },
  chesterfield: { seats: 3, color: '#5b2e1e', arm: 'chesterfield', legs: 'bun', leather: true },
  'modern-low': { seats: 3, color: '#bdb6aa', arm: 'thin', legs: 'metal', low: true },
  futon: { seats: 3, color: '#2e3b4e', arm: 'futon', legs: 'none' },
};

export function createSofa(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SOFA_VARIANTS, o.variant, 'sofa');
  const st = STYLE.cur?.sofa;
  // a style can swap arms / legs / back / base (chesterfield keeps its signature arm)
  const v = { ...SOFA_VARIANTS[variant], ...(st && variant !== 'futon' ? st : {}), ...(variant === 'chesterfield' ? { arm: 'chesterfield' } : {}) };
  const root = group(`sofa-${variant}`);
  const U = v.leather ? leatherMat(o.color ?? v.color) : fabricMat(o.color ?? v.color);
  const W = woodMat(o.wood ?? 'walnut');
  const seatW = 0.68;
  const armW = v.arm === 'thin' ? 0.08 : v.arm === 'futon' ? 0.06 : v.arm === 'wood' ? 0.07 : 0.2;
  const SW = v.seats * seatW;
  const TW = SW + armW * 2;
  const D = v.low ? 0.95 : 0.92;
  const legH = v.legs === 'none' || v.legs === 'skirt' ? 0 : v.legs === 'sled' ? 0.13 : v.low ? 0.14 : 0.11;
  const baseH = v.low ? 0.18 : 0.22;
  const baseY = legH + baseH / 2;

  if (variant === 'futon') {
    // slatted wood frame with a folded mattress
    for (const s of [1, -1]) {
      mesh(roundedBox(0.06, 0.62, D, 0.012), W, { parent: root, at: [s * (TW / 2 - 0.03), 0.31, 0] });
      mesh(roundedBox(0.07, 0.05, D + 0.02, 0.01), W, { parent: root, at: [s * (TW / 2 - 0.03), 0.62, 0] });
    }
    for (let i = 0; i < 7; i++) mesh(roundedBox(SW, 0.02, 0.07, 0.006), W, { parent: root, at: [0, 0.3, -0.36 + i * 0.12] });
    mesh(roundedBox(SW, 0.06, 0.04, 0.01), W, { parent: root, at: [0, 0.26, D / 2 - 0.03] });
    const mat = cushion(SW - 0.02, 0.15, D - 0.18, { radius: 0.06, bulge: 0.2 });
    mesh(mat, U, { parent: root, at: [0, 0.39, 0.08] });
    const back = group(null, { parent: root, at: [0, 0.68, -D / 2 + 0.13], rot: [-0.25, 0, 0] });
    mesh(cushion(SW - 0.02, 0.62, 0.15, { radius: 0.06, bulge: 0.2 }), U, { parent: back });
    const tuft = leatherMat(M.toColor(o.color ?? v.color).multiplyScalar(0.6));
    buttons(back, tuft, 6, 3, SW - 0.3, 0.45, [0, 0, 0.08]);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) mesh(new THREE.SphereGeometry(0.011, 8, 6), tuft, { parent: root, at: [-SW / 2 + 0.2 + i * ((SW - 0.4) / 5), 0.47, -0.15 + j * 0.25] });
    return finalize(root, { type: 'sofa', variant, options: o, animations: [] });
  }

  // legs
  const legSpots = [[TW / 2 - 0.08, D / 2 - 0.08], [-TW / 2 + 0.08, D / 2 - 0.08], [TW / 2 - 0.08, -D / 2 + 0.08], [-TW / 2 + 0.08, -D / 2 + 0.08]];
  if (v.seats >= 3) legSpots.push([0, D / 2 - 0.08], [0, -D / 2 + 0.08]);
  for (const [x, z] of legSpots) {
    if (v.legs === 'taper') { const l = mesh(turnedLeg(legH, 0.025, 'taper'), W, { parent: root, at: [x, 0, z] }); l.rotation.set(Math.sign(z) * 0.1, 0, -Math.sign(x) * 0.1); }
    else if (v.legs === 'bun') mesh(turnedLeg(legH, 0.045, 'bun'), W, { parent: root, at: [x, 0, z] });
    else if (v.legs === 'metal') curveTube([[x, 0, z], [x, legH * 0.5, z - Math.sign(z) * 0.02], [x, legH, z]], 0.008, metalMat('black'), { parent: root });
    else if (v.legs === 'sled' || v.legs === 'skirt' || v.legs === 'none') continue;
    else mesh(roundedBox(0.06, legH, 0.06, 0.008), plasticMat('#111'), { parent: root, at: [x, legH / 2, z] });
  }
  if (v.legs === 'sled') {
    // black steel sled runners under each arm
    const st2 = metalMat('black');
    for (const s of [1, -1]) {
      const x = s * (TW / 2 - 0.1);
      curveTube([[x, legH, D / 2 - 0.06], [x, 0.012, D / 2 - 0.1], [x, 0.012, -D / 2 + 0.1], [x, legH, -D / 2 + 0.06]], 0.012, st2, { parent: root, segments: 32 });
    }
    curveTube([[-TW / 2 + 0.1, legH - 0.005, 0], [TW / 2 - 0.1, legH - 0.005, 0]], 0.01, st2, { parent: root, segments: 2 });
  }
  if (v.legs === 'skirt') {
    // slipcover skirt to the floor with a kick pleat at each corner
    const skirtH = baseH * 0.62;
    mesh(cushion(TW + 0.012, skirtH, D + 0.012, { radius: 0.012, bulge: 0 }), U, { parent: root, at: [0, skirtH / 2, 0] });
  }
  // base frame
  mesh(cushion(TW, baseH, D, { radius: 0.05, bulge: 0.05 }), U, { parent: root, at: [0, baseY, 0] });
  const seatTop = legH + baseH;

  // arms
  for (const s of [1, -1]) {
    const ax = s * (TW / 2 - armW / 2);
    if (v.arm === 'rolled' || v.arm === 'chesterfield') {
      const armH = v.arm === 'chesterfield' ? 0.48 : 0.36;
      mesh(cushion(armW, armH, D, { radius: 0.06, bulge: 0.08 }), U, { parent: root, at: [ax, seatTop + armH / 2 - 0.02, 0] });
      const roll = new THREE.CylinderGeometry(armW * 0.62, armW * 0.62, D, 24).rotateX(Math.PI / 2);
      mesh(roll, U, { parent: root, at: [ax + s * 0.03, seatTop + armH - 0.02, 0] });
      if (v.arm === 'chesterfield') {
        const front = group(null, { parent: root, at: [ax, seatTop + 0.2, D / 2 + 0.01] });
        buttons(front, U, 2, 4, armW * 0.7, 0.3, [0, 0, 0]);
      }
    } else if (v.arm === 'wood') {
      // solid timber side panel arm with a rounded top
      mesh(roundedBox(armW, 0.5, D, 0.03, 3), W, { parent: root, at: [ax, legH + 0.25, 0] });
    } else {
      const armH = v.arm === 'thin' ? 0.22 : 0.4;
      mesh(cushion(armW, armH, D, { radius: v.arm === 'thin' ? 0.03 : 0.06, bulge: 0.06 }), U, { parent: root, at: [ax, seatTop + armH / 2 - 0.02, 0] });
    }
  }

  // back
  const backH = v.arm === 'chesterfield' ? 0.48 : v.low ? 0.3 : 0.46;
  const back = group(null, { parent: root, at: [0, seatTop + backH / 2 - 0.02, -D / 2 + 0.1] });
  mesh(cushion(TW, backH, 0.2, { radius: 0.07, bulge: 0.08 }), U, { parent: back });
  if (v.arm === 'chesterfield') {
    buttons(back, U, Math.round(SW / 0.11), 4, SW, backH * 0.75, [0, 0.02, 0.1]);
    for (let i = 0; i < v.seats; i++) {
      const c = pipedCushion(seatW - 0.01, 0.15, D - 0.3, U, { bulge: 0.25 });
      c.position.set(-SW / 2 + seatW * (i + 0.5), seatTop + 0.07, 0.08);
      root.add(c);
    }
  } else {
    for (let i = 0; i < v.seats; i++) {
      const x = -SW / 2 + seatW * (i + 0.5);
      const c = pipedCushion(seatW - 0.01, v.low ? 0.12 : 0.16, D - 0.28, U, { bulge: 0.3 });
      c.position.set(x, seatTop + 0.07, 0.08);
      root.add(c);
      if (v.back === 'tight') continue;
      const bh = backH * 0.92;
      const bc = pipedCushion(seatW - 0.03, bh, 0.17, U, { bulge: v.back === 'channel' ? 0.1 : 0.35 });
      bc.position.set(x, seatTop + 0.13 + bh / 2, -D / 2 + 0.27);
      bc.rotation.x = -0.16;
      root.add(bc);
      if (v.back === 'tufted') buttons(bc, U, 3, 2, seatW * 0.6, bh * 0.55, [0, 0, 0.088]);
      if (v.back === 'channel') {
        // vertical channel tufting: soft ridges across the back cushion
        for (let k = 0; k < 4; k++) mesh(new THREE.CapsuleGeometry(0.035, bh * 0.7, 4, 10), U, { parent: bc, at: [-seatW * 0.33 + k * seatW * 0.22, 0, 0.07] });
      }
    }
  }
  if (v.chaise) {
    const cx = SW / 2 - seatW / 2;
    const cd = 0.8;
    mesh(cushion(seatW + armW, baseH, cd, { radius: 0.05, bulge: 0.05 }), U, { parent: root, at: [cx + armW / 2, baseY, D / 2 + cd / 2 - 0.02] });
    const c = pipedCushion(seatW - 0.01, 0.16, cd, U, { bulge: 0.3 });
    c.position.set(cx, seatTop + 0.07, D / 2 + cd / 2 - 0.1);
    root.add(c);
    mesh(cushion(armW, 0.4, cd, { radius: 0.06, bulge: 0.06 }), U, { parent: root, at: [TW / 2 - armW / 2, seatTop + 0.18, D / 2 + cd / 2 - 0.02] });
    for (const [x, z] of [[TW / 2 - 0.08, D / 2 + cd - 0.1], [cx - seatW / 2 + 0.06, D / 2 + cd - 0.1]]) mesh(roundedBox(0.06, legH, 0.06, 0.008), plasticMat('#111'), { parent: root, at: [x, legH / 2, z] });
  }
  // throw pillows
  const accent = fabricMat(o.accentColor ?? (v.leather ? '#b08d57' : '#c8b79c'));
  for (const s of v.pillows === 0 ? [] : [1, -1]) {
    const p = group(null, { parent: root, at: [s * (SW / 2 - 0.2), seatTop + 0.3, -D / 2 + 0.42], rot: [-0.32, s * -0.3, s * 0.06] });
    mesh(cushion(0.34, 0.34, 0.11, { radius: 0.05, bulge: 0.6 }), accent, { parent: p });
  }
  return finalize(root, { type: 'sofa', variant, options: o, animations: [] });
}
