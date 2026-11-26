import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe,
  woodMat, metalMat, plasticMat, glassMat, taperBox, turnedLeg, panelFront, barPull, knob, drawerBox, STYLE,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';
import { moveTrack, numberTrack, clip, wave, pingPong } from '../../core/animation.js';

/* =============================== TABLES =============================== */

export const TABLE_VARIANTS = {
  dining: { w: 1.8, d: 0.9, h: 0.76, wood: 'walnut' },
  farmhouse: { w: 2.0, d: 0.95, h: 0.77, wood: 'pine' },
  coffee: { w: 1.15, d: 0.6, h: 0.42, wood: 'oak' },
  round: { w: 1.1, d: 1.1, h: 0.75, wood: 'maple' },
  side: { w: 0.48, d: 0.48, h: 0.56, wood: 'cherry' },
  'glass-top': { w: 1.4, d: 0.8, h: 0.75, metal: 'black' },
  console: { w: 1.2, d: 0.36, h: 0.8, wood: 'walnut' },
  picnic: { w: 1.8, d: 0.75, h: 0.74, wood: 'pine' },
};

/** Leg + apron frame under a rectangular top. */
function legFrame(root, W, w, d, h, { legStyle = 'taper', r = 0.03, inset = 0.06, apron = 0.08 }) {
  const lh = h;
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const x = sx * (w / 2 - inset);
    const z = sz * (d / 2 - inset);
    if (legStyle === 'taper') mesh(taperBox(r * 2, lh, r * 2, 0.6), W, { parent: root, at: [x, lh / 2, z] });
    else mesh(turnedLeg(lh, r * 1.3, legStyle), W, { parent: root, at: [x, 0, z] });
  }
  if (apron) {
    for (const sz of [1, -1]) mesh(roundedBox(w - inset * 2 - r * 1.6, apron, 0.022, 0.006), W, { parent: root, at: [0, h - apron / 2, sz * (d / 2 - inset)] });
    for (const sx of [1, -1]) mesh(roundedBox(0.022, apron, d - inset * 2 - r * 1.6, 0.006), W, { parent: root, at: [sx * (w / 2 - inset), h - apron / 2, 0] });
  }
}

export function createTable(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TABLE_VARIANTS, o.variant, 'table');
  const v = TABLE_VARIANTS[variant];
  const root = group(`table-${variant}`);
  const W = woodMat(o.wood ?? v.wood ?? 'oak');
  const MT = metalMat(o.metal ?? v.metal ?? 'black');
  const w = o.width ?? v.w;
  const d = o.depth ?? v.d;
  const h = v.h;
  const animations = [];

  if (variant === 'round') {
    mesh(lathe([[0, 0], [w / 2, 0], [w / 2 + 0.005, 0.012], [w / 2, 0.035], [w / 2 - 0.01, 0.04], [0, 0.04]], 64), W, { parent: root, at: [0, h - 0.04, 0] });
    mesh(lathe([[0, 0], [0.06, 0], [0.045, 0.1], [0.07, 0.25], [0.04, 0.45], [0.05, 0.62], [0.08, h - 0.07], [0.16, h - 0.05], [0.16, h - 0.04], [0, h - 0.04]], 32), W, { parent: root });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      curveTube([[0, 0.12, 0], [Math.cos(a) * 0.18, 0.08, Math.sin(a) * 0.18], [Math.cos(a) * 0.34, 0.02, Math.sin(a) * 0.34]], 0.026, W, { parent: root });
    }
  } else if (variant === 'glass-top') {
    mesh(roundedBox(w, 0.012, d, 0.005, 2), glassMat('#cfe3e6', 0.35), { parent: root, at: [0, h - 0.006, 0] });
    for (const sx of [1, -1]) {
      curveTube([[sx * (w / 2 - 0.08), 0, d / 2 - 0.06], [sx * (w / 2 - 0.14), h - 0.03, 0], [sx * (w / 2 - 0.08), 0, -d / 2 + 0.06]], 0.016, MT, { parent: root });
      curveTube([[sx * (w / 2 - 0.14), h - 0.025, d / 2 - 0.08], [sx * (w / 2 - 0.14), h - 0.025, -d / 2 + 0.08]], 0.012, MT, { parent: root });
    }
    curveTube([[w / 2 - 0.14, h - 0.025, 0], [-(w / 2 - 0.14), h - 0.025, 0]], 0.012, MT, { parent: root });
  } else if (variant === 'picnic') {
    mesh(roundedBox(w, 0.04, 0.15, 0.008), W, { parent: root, at: [0, h - 0.02, -0.3] });
    for (let i = 0; i < 5; i++) mesh(roundedBox(w, 0.04, 0.135, 0.008), W, { parent: root, at: [0, h - 0.02, -0.3 + i * 0.15] });
    for (const sx of [1, -1]) {
      const x = sx * (w / 2 - 0.25);
      for (const sz of [1, -1]) {
        curveTube([[x, 0, sz * 0.62], [x, h - 0.05, sz * 0.06]], 0.025, W, { parent: root, segments: 2, radialSegments: 8 });
        mesh(roundedBox(w, 0.035, 0.24, 0.008), W, { parent: root, at: [0, 0.44, sz * 0.62] });
      }
      mesh(roundedBox(0.05, 0.07, 1.42, 0.01), W, { parent: root, at: [x, 0.39, 0] });
      mesh(roundedBox(0.05, 0.07, 0.72, 0.01), W, { parent: root, at: [x, h - 0.075, 0] });
    }
  } else {
    const topT = variant === 'farmhouse' ? 0.07 : variant === 'coffee' ? 0.045 : 0.035;
    mesh(roundedBox(w, topT, d, Math.min(0.012, topT / 3), 3), W, { parent: root, at: [0, h - topT / 2, 0] });
    const legStyle = variant === 'farmhouse' ? 'baluster' : variant === 'side' ? 'turned' : 'taper';
    const lr = variant === 'farmhouse' ? 0.045 : variant === 'coffee' ? 0.022 : 0.026;
    const inset = variant === 'console' ? 0.04 : 0.07;
    legFrame(root, W, w, d, h - topT, { legStyle, r: lr, inset, apron: variant === 'coffee' ? 0.06 : 0.09 });
    if (variant === 'coffee' || variant === 'console') {
      // low shelf notched round the legs: its corners reach the leg centres (also when a style splays the legs)
      const sy = 0.12;
      const spread = Math.sin(STYLE.cur?.splay ?? 0) * (h - topT - sy);
      mesh(roundedBox(2 * (w / 2 - inset + spread), 0.022, 2 * (d / 2 - inset + spread), 0.006), W, { parent: root, at: [0, sy, 0] });
    }
    if (variant === 'side' || variant === 'console') {
      const drawer = group('drawer', { parent: root, at: [0, h - topT - 0.06, d / 2 - 0.06] });
      const dw = variant === 'side' ? w - 0.2 : w * 0.5;
      drawer.add(panelFront(dw, 0.075, 0.018, W, { shaker: false }));
      drawer.add(drawerBox(dw - 0.02, 0.07, d - 0.16, W));
      const k = knob(metalMat('brass'));
      k.position.z = 0.009;
      drawer.add(k);
      animations.push(clip('drawerOpen', 1, [moveTrack(drawer, 1, (t) => [0, 0, Math.min(1, t * 1.2) * 0.22])]));
    }
  }
  const out = finalize(root, { type: 'table', variant, options: o, animations });
  if (animations.length) out.userData.premade.oneShot = ['drawerOpen'];
  return out;
}

/* =============================== DESKS =============================== */

export const DESK_VARIANTS = {
  writing: { wood: 'walnut' },
  computer: { wood: 'white' },
  standing: { wood: 'oak', metal: 'black' },
  executive: { wood: 'cherry' },
};

function pedestal(root, W, x, h, d, nameBase, n = 3) {
  mesh(roundedBox(0.42, h, d, 0.006), W, { parent: root, at: [x, h / 2, 0] });
  const tracks = [];
  const dh = (h - 0.08) / n;
  for (let i = 0; i < n; i++) {
    const dr = group(`${nameBase}${i}`, { parent: root, at: [x, 0.06 + dh * (i + 0.5), d / 2 + 0.002] });
    dr.add(panelFront(0.4, dh - 0.012, 0.018, W));
    dr.add(drawerBox(0.36, dh - 0.03, d - 0.08, W));
    const pull = barPull(0.12, metalMat('steel'));
    pull.position.z = 0.012;
    dr.add(pull);
    tracks.push(moveTrack(dr, 1, (t) => [0, 0, Math.min(1, t * 1.25) * (0.3 - i * 0.02)]));
  }
  return tracks;
}

export function createDesk(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(DESK_VARIANTS, o.variant, 'desk');
  const v = DESK_VARIANTS[variant];
  const root = group(`desk-${variant}`);
  const W = woodMat(o.wood ?? v.wood);
  const MT = metalMat(o.metal ?? v.metal ?? 'black');
  const Wd = variant === 'executive' ? 1.8 : 1.4;
  const D = variant === 'executive' ? 0.85 : 0.7;
  const H = 0.75;
  const animations = [];
  const oneShot = [];

  if (variant === 'standing') {
    const lift = group('desktop', { parent: root });
    mesh(roundedBox(Wd, 0.03, D, 0.01), W, { parent: lift, at: [0, H - 0.015, 0] });
    for (const sx of [1, -1]) {
      const x = sx * (Wd / 2 - 0.12);
      mesh(roundedBox(0.07, 0.035, D - 0.08, 0.008), MT, { parent: root, at: [x, 0.018, 0] });
      mesh(roundedBox(0.07, 0.35, 0.05, 0.006), MT, { parent: root, at: [x, 0.21, 0] });
      mesh(roundedBox(0.06, 0.4, 0.04, 0.006), MT, { parent: lift, at: [x, H - 0.24, 0] });
      mesh(roundedBox(0.06, 0.03, D - 0.1, 0.006), MT, { parent: lift, at: [x, H - 0.045, 0] });
    }
    mesh(roundedBox(Wd - 0.3, 0.05, 0.05, 0.008), MT, { parent: lift, at: [0, H - 0.055, 0] });
    mesh(roundedBox(0.09, 0.02, 0.04, 0.008), plasticMat('#111'), { parent: lift, at: [Wd / 2 - 0.15, H - 0.04, D / 2 - 0.03] });
    animations.push(clip('raise', 4, [moveTrack(lift, 4, (t) => [0, pingPong(t) * 0.35, 0])]));
  } else {
    mesh(roundedBox(Wd, 0.035, D, 0.01), W, { parent: root, at: [0, H - 0.0175, 0] });
    if (variant === 'writing') {
      for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(taperBox(0.045, H - 0.035, 0.045, 0.65), W, { parent: root, at: [sx * (Wd / 2 - 0.05), (H - 0.035) / 2, sz * (D / 2 - 0.05)] });
      mesh(roundedBox(Wd - 0.15, 0.1, 0.02, 0.005), W, { parent: root, at: [0, H - 0.085, -D / 2 + 0.05] });
      for (const sx of [1, -1]) mesh(roundedBox(0.02, 0.1, D - 0.15, 0.005), W, { parent: root, at: [sx * (Wd / 2 - 0.05), H - 0.085, 0] });
      mesh(roundedBox(Wd - 0.15, 0.012, 0.025, 0.004), W, { parent: root, at: [0, H - 0.138, D / 2 - 0.05] });
      mesh(roundedBox(0.04, 0.1, 0.025, 0.005), W, { parent: root, at: [0, H - 0.085, D / 2 - 0.05] });
      for (const [x, wdt] of [[-0.33, 0.6], [0.33, 0.6]]) {
        const dr = group(`drawer_${x > 0 ? 'R' : 'L'}`, { parent: root, at: [x, H - 0.085, D / 2 - 0.05] });
        dr.add(panelFront(wdt, 0.09, 0.02, W, { shaker: false }));
        dr.add(drawerBox(wdt - 0.02, 0.085, D - 0.2, W));
        const k = knob(metalMat('brass'));
        k.position.z = 0.01;
        dr.add(k);
        animations.length || animations.push(clip('drawerOpen', 1, []));
        animations[0].tracks.push(moveTrack(dr, 1, (t) => [0, 0, Math.min(1, t * 1.2) * 0.25]));
      }
      animations[0].resetDuration();
      oneShot.push('drawerOpen');
    } else {
      mesh(roundedBox(0.03, H - 0.035, D - 0.02, 0.006), W, { parent: root, at: [-Wd / 2 + 0.015, (H - 0.035) / 2, 0] });
      const tracks = pedestal(root, W, Wd / 2 - 0.22, H - 0.035, D - 0.04, 'drawer', 3);
      if (variant === 'executive') {
        tracks.push(...pedestal(root, W, -Wd / 2 + 0.22, H - 0.035, D - 0.04, 'drawerL', 3));
        mesh(roundedBox(Wd - 0.8, 0.55, 0.02, 0.006), W, { parent: root, at: [0, H - 0.035 - 0.275, -D / 2 + 0.06] });
        mesh(roundedBox(0.5, 0.004, 0.35, 0.002), new THREE.MeshStandardMaterial({ color: '#2d4a2f', roughness: 0.6 }), { parent: root, at: [0, H + 0.002, 0.05] });
      }
      animations.push(clip('drawerOpen', 1, tracks));
      oneShot.push('drawerOpen');
      if (variant === 'computer') {
        const scr = group(null, { parent: root, at: [-0.1, H, -0.15] });
        mesh(roundedBox(0.22, 0.012, 0.16, 0.005), plasticMat('#222'), { parent: scr, at: [0, 0.006, 0] });
        curveTube([[0, 0.01, -0.03], [0, 0.12, -0.04], [0, 0.22, -0.02]], 0.014, plasticMat('#222'), { parent: scr });
        mesh(roundedBox(0.62, 0.37, 0.025, 0.008), plasticMat('#111', 0.3), { parent: scr, at: [0, 0.34, 0] });
        mesh(new THREE.PlaneGeometry(0.6, 0.345), M.emissive('#4aa3df', 0.8), { parent: scr, at: [0, 0.345, 0.0135], name: 'screen' });
        { const e = brandEmblem(0.01, { name: 'emblem' }); e.position.set(0, 0.16, 0.0135); scr.add(e); }
        mesh(roundedBox(0.44, 0.018, 0.14, 0.004), plasticMat('#e5e5e5', 0.5), { parent: root, at: [-0.1, H + 0.009, 0.12] });
        for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) mesh(roundedBox(0.024, 0.008, 0.024, 0.003), plasticMat('#cfcfcf', 0.6), { parent: root, at: [-0.1 - 0.19 + c * 0.029, H + 0.021, 0.07 + r * 0.03] });
        mesh(cushion(0.06, 0.03, 0.1, { radius: 0.014, bulge: 0.6 }), plasticMat('#e5e5e5', 0.5), { parent: root, at: [0.24, H + 0.015, 0.13] });
        animations.push(clip('screen', 3, [numberTrack('screen.material.emissiveIntensity', 3, (t) => 0.7 + 0.25 * wave(t, 3), 24)]));
      }
    }
  }
  const out = finalize(root, { type: 'desk', variant, options: o, animations });
  if (oneShot.length) out.userData.premade.oneShot = oneShot;
  return out;
}
