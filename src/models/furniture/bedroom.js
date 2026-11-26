import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe, rng,
  woodMat, fabricMat, leatherMat, metalMat, plasticMat, glassMat, ceramic,
  taperBox, turnedLeg, bentSlab, pipedCushion, panelFront, barPull, knob, drawerBox, buttons, STYLE, caneMat,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, moveTrack, clip } from '../../core/animation.js';

/* ================================ BEDS ================================ */

export const BED_VARIANTS = {
  single: { w: 0.95, color: '#9fb4c7', wood: 'oak', head: 'slats' },
  double: { w: 1.45, color: '#d9cdb8', wood: 'walnut', head: 'panel' },
  king: { w: 1.95, color: '#8c8fa6', wood: 'walnut', head: 'tufted' },
  platform: { w: 1.6, color: '#c7c2b8', wood: 'oak', head: 'low', low: true },
  bunk: { w: 0.95, color: '#c94f4f', wood: 'pine', head: 'bunk' },
  canopy: { w: 1.6, color: '#f0e6d8', wood: 'cherry', head: 'canopy' },
  crib: { w: 0.7, color: '#f3d7de', wood: 'white', head: 'crib', L: 1.3 },
};

/** Mattress + fitted sheet + draped duvet + pillows, sitting on y = top of base. */
function bedding(parent, w, L, y, color, { pillows = 2, mattressH = 0.22 } = {}) {
  const sheet = fabricMat('#f6f4ef');
  mesh(cushion(w, mattressH, L, { radius: 0.06, bulge: 0.08 }), sheet, { parent, at: [0, y + mattressH / 2, 0] });
  const top = y + mattressH;
  const hw = w / 2;
  const duvetL = L * 0.72;
  const drape = mattressH * 0.9;
  const path = [[-hw - 0.035, top - drape], [-hw - 0.035, top - drape * 0.4], [-hw - 0.01, top + 0.0], [-hw + 0.08, top + 0.035], [0, top + 0.05], [hw - 0.08, top + 0.035], [hw + 0.01, top + 0.0], [hw + 0.035, top - drape * 0.4], [hw + 0.035, top - drape]];
  const duvetMat = fabricMat(color);
  const duvet = bentSlab(path, duvetL, 0.045, { segments: 48, radius: 0.02 }).rotateY(Math.PI / 2);
  mesh(duvet, duvetMat, { parent, at: [0, 0, L / 2 - duvetL / 2 + 0.03] });
  // folded-back top edge of the duvet
  const fold = bentSlab(path.map(([x, yy]) => [x * 1.01, yy + 0.04]), 0.16, 0.04, { segments: 48, radius: 0.018 }).rotateY(Math.PI / 2);
  mesh(fold, fabricMat('#f6f4ef'), { parent, at: [0, 0, L / 2 - duvetL + 0.1] });
  // foot end drape
  mesh(cushion(w + 0.06, drape, 0.04, { radius: 0.018, bulge: 0 }), duvetMat, { parent, at: [0, top - drape / 2 + 0.03, L / 2 + 0.02] });
  const pw = Math.min(0.62, (w - 0.1) / pillows);
  for (let i = 0; i < pillows; i++) {
    const x = pillows === 1 ? 0 : -((pillows - 1) * pw) / 2 + i * pw;
    const p = group(null, { parent, at: [x, top + 0.07, -L / 2 + 0.25], rot: [-0.35, 0, 0] });
    mesh(cushion(pw - 0.05, 0.13, 0.4, { radius: 0.06, bulge: 0.7 }), fabricMat('#ffffff'), { parent: p });
  }
}

export function createBed(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BED_VARIANTS, o.variant, 'bed');
  const sh = STYLE.cur?.bedHead;
  const v = { ...BED_VARIANTS[variant], ...(sh && !['bunk', 'crib', 'canopy'].includes(variant) ? { head: sh, low: sh === 'low' || sh === 'floating' } : {}) };
  const root = group(`bed-${variant}`);
  const W = woodMat(o.wood ?? v.wood);
  const L = v.L ?? 2.05;
  const w = v.w;
  const fw = w + 0.08;
  const color = o.color ?? v.color;

  if (variant === 'bunk') {
    const posts = [[fw / 2, L / 2 + 0.03], [-fw / 2, L / 2 + 0.03], [fw / 2, -L / 2 - 0.03], [-fw / 2, -L / 2 - 0.03]];
    for (const [x, z] of posts) mesh(roundedBox(0.07, 1.75, 0.07, 0.012), W, { parent: root, at: [x, 0.875, z] });
    for (const deck of [0.22, 1.2]) {
      for (const s of [1, -1]) mesh(roundedBox(0.04, 0.14, L, 0.008), W, { parent: root, at: [s * fw / 2, deck, 0] });
      for (const s of [1, -1]) mesh(roundedBox(fw, 0.14, 0.04, 0.008), W, { parent: root, at: [0, deck, s * (L / 2 + 0.03)] });
      bedding(root, w, L, deck - 0.02, color, { pillows: 1, mattressH: 0.16 });
    }
    for (const s of [1, -1]) mesh(roundedBox(fw, 0.06, 0.04, 0.008), W, { parent: root, at: [0, 1.6, s * (L / 2 + 0.03)] });
    { // side guard rail from the head post to the ladder, with an end post down to the deck rail
      const z0 = -L / 2 - 0.03;
      const z1 = L / 2 - 0.45;
      mesh(roundedBox(0.04, 0.06, z1 - z0, 0.008), W, { parent: root, at: [fw / 2, 1.6, (z0 + z1) / 2] });
      mesh(roundedBox(0.045, 0.4, 0.045, 0.008), W, { parent: root, at: [fw / 2, 1.42, z1] });
      for (const s of [1, -1]) mesh(roundedBox(0.04, 0.06, L, 0.008), W, { parent: root, at: [-fw / 2, 1.6, 0] }) && s;
    }
    // ladder
    for (const z of [L / 2 - 0.08, L / 2 - 0.42]) mesh(roundedBox(0.05, 1.5, 0.05, 0.01), W, { parent: root, at: [fw / 2 + 0.05, 0.75, z] });
    for (let i = 1; i < 6; i++) curveTube([[fw / 2 + 0.05, i * 0.26, L / 2 - 0.08], [fw / 2 + 0.05, i * 0.26, L / 2 - 0.42]], 0.016, W, { parent: root });
    return finalize(root, { type: 'bed', variant, options: o, animations: [] });
  }

  if (variant === 'crib') {
    for (const [x, z] of [[fw / 2, L / 2], [-fw / 2, L / 2], [fw / 2, -L / 2], [-fw / 2, -L / 2]]) mesh(roundedBox(0.05, 0.95, 0.05, 0.012), W, { parent: root, at: [x, 0.475, z] });
    for (const y of [0.3, 0.9]) {
      for (const s of [1, -1]) {
        mesh(roundedBox(0.035, 0.04, L, 0.01), W, { parent: root, at: [s * fw / 2, y, 0] });
        mesh(roundedBox(fw, 0.04, 0.035, 0.01), W, { parent: root, at: [0, y, s * L / 2] });
      }
    }
    for (const s of [1, -1]) {
      for (let i = 1; i < 14; i++) curveTube([[s * fw / 2, 0.32, -L / 2 + (i * L) / 14], [s * fw / 2, 0.88, -L / 2 + (i * L) / 14]], 0.009, W, { parent: root, segments: 2 });
      for (let i = 1; i < 7; i++) curveTube([[-fw / 2 + (i * fw) / 7, 0.32, s * L / 2], [-fw / 2 + (i * fw) / 7, 0.88, s * L / 2]], 0.009, W, { parent: root, segments: 2 });
    }
    mesh(cushion(w, 0.1, L - 0.04, { radius: 0.04, bulge: 0.05 }), fabricMat(color), { parent: root, at: [0, 0.37, 0] });
    mesh(cushion(0.3, 0.06, 0.22, { radius: 0.03, bulge: 0.6 }), fabricMat('#ffffff'), { parent: root, at: [0, 0.45, -L / 2 + 0.2] });
    return finalize(root, { type: 'bed', variant, options: o, animations: [] });
  }

  const legH = v.low ? 0.06 : 0.16;
  const railH = v.low ? 0.18 : 0.2;
  const baseTop = legH + railH;
  // legs
  for (const [x, z] of [[fw / 2 - 0.04, L / 2 + 0.01], [-fw / 2 + 0.04, L / 2 + 0.01], [fw / 2 - 0.04, -L / 2], [-fw / 2 + 0.04, -L / 2]]) {
    if (variant === 'canopy') continue;
    mesh(taperBox(0.06, legH, 0.06, 0.75), W, { parent: root, at: [x, legH / 2, z] });
  }
  // rails
  for (const s of [1, -1]) mesh(roundedBox(0.04, railH, L, 0.01), W, { parent: root, at: [s * (fw / 2 - 0.02), legH + railH / 2, 0] });
  mesh(roundedBox(fw, railH, 0.045, 0.01), W, { parent: root, at: [0, legH + railH / 2, L / 2 + 0.02] });
  bedding(root, w, L - 0.04, baseTop - 0.05, color, { pillows: w > 1.2 ? 2 : 1 });

  // headboard
  const hz = -L / 2 - 0.03;
  if (v.head === 'slats') {
    for (const s of [1, -1]) mesh(roundedBox(0.06, 0.95, 0.06, 0.012), W, { parent: root, at: [s * (fw / 2 - 0.03), 0.475, hz] });
    mesh(roundedBox(fw, 0.08, 0.05, 0.012), W, { parent: root, at: [0, 0.92, hz] });
    for (let i = 0; i < 6; i++) mesh(roundedBox(0.06, 0.42, 0.02, 0.006), W, { parent: root, at: [-fw / 2 + 0.16 + i * ((fw - 0.32) / 5), 0.66, hz] });
  } else if (v.head === 'panel') {
    mesh(roundedBox(fw + 0.06, 1.05, 0.06, 0.015), W, { parent: root, at: [0, 0.525, hz] });
    const pf = panelFront(fw - 0.2, 0.42, 0.03, W);
    pf.position.set(0, 0.74, hz + 0.03);
    root.add(pf);
  } else if (v.head === 'tufted') {
    const hb = group(null, { parent: root, at: [0, 0.72, hz] });
    // built lying flat and stood up, so the padded face domes gently forward
    mesh(cushion(fw + 0.1, 0.1, 0.95, { radius: 0.045, bulge: 0.2 }).rotateX(Math.PI / 2), fabricMat(o.headColor ?? '#5d6070'), { parent: hb });
    buttons(hb, fabricMat('#4a4c5a'), 12, 5, fw - 0.1, 0.75, [0, 0, 0.055]);
    mesh(roundedBox(fw + 0.1, 0.25, 0.08, 0.02), W, { parent: root, at: [0, 0.125, hz] });
  } else if (v.head === 'low') {
    mesh(roundedBox(fw + 0.4, 0.06, L + 0.25, 0.015), W, { parent: root, at: [0, legH + 0.03, 0.08] });
    mesh(cushion(fw + 0.05, 0.5, 0.1, { radius: 0.04, bulge: 0.15 }), fabricMat('#8c8577'), { parent: root, at: [0, baseTop + 0.25, hz] });
  } else if (v.head === 'floating') {
    // wide low upholstered panel that runs past the bed, recessed plinth
    mesh(cushion(fw + 0.7, 0.62, 0.09, { radius: 0.03, bulge: 0.05 }), fabricMat(color), { parent: root, at: [0, baseTop + 0.2, hz] });
    mesh(roundedBox(fw + 0.7, baseTop + 0.0, 0.05, 0.01), W, { parent: root, at: [0, baseTop / 2, hz - 0.02] });
  } else if (v.head === 'pipe') {
    const iron = metalMat('black');
    for (const s of [1, -1]) {
      curveTube([[s * (fw / 2), 0, hz], [s * (fw / 2), 1.1, hz]], 0.022, iron, { parent: root, segments: 2 });
      mesh(new THREE.SphereGeometry(0.032, 14, 10), iron, { parent: root, at: [s * (fw / 2), 1.11, hz] });
      curveTube([[s * (fw / 2), 0, -hz], [s * (fw / 2), 0.55, -hz]], 0.022, iron, { parent: root, segments: 2 });
    }
    for (const y of [0.55, 1.05]) curveTube([[-fw / 2, y, hz], [fw / 2, y, hz]], 0.016, iron, { parent: root, segments: 2 });
    curveTube([[-fw / 2, 0.5, -hz], [fw / 2, 0.5, -hz]], 0.016, iron, { parent: root, segments: 2 });
    for (let i = 1; i < 8; i++) curveTube([[-fw / 2 + (i * fw) / 8, 0.55, hz], [-fw / 2 + (i * fw) / 8, 1.05, hz]], 0.009, iron, { parent: root, segments: 2 });
  } else if (v.head === 'plank') {
    for (const s of [1, -1]) {
      mesh(roundedBox(0.09, 1.2, 0.09, 0.012), W, { parent: root, at: [s * (fw / 2 + 0.02), 0.6, hz] });
      mesh(lathe([[0, 0], [0.05, 0], [0.055, 0.02], [0.03, 0.05], [0.045, 0.09], [0, 0.11]], 16), W, { parent: root, at: [s * (fw / 2 + 0.02), 1.2, hz] });
    }
    mesh(roundedBox(fw + 0.06, 0.08, 0.06, 0.012), W, { parent: root, at: [0, 1.1, hz] });
    const n = Math.round(fw / 0.16);
    for (let i = 0; i < n; i++) mesh(roundedBox(fw / n - 0.006, 0.75, 0.025, 0.004), W, { parent: root, at: [-fw / 2 + (i + 0.5) * (fw / n), 0.68, hz + 0.01] });
  } else if (v.head === 'wing') {
    // wide low timber headboard with built-in bedside shelves
    mesh(roundedBox(fw + 1.0, 0.85, 0.05, 0.012), W, { parent: root, at: [0, 0.425, hz] });
    for (const s of [1, -1]) {
      mesh(roundedBox(0.45, 0.03, 0.38, 0.008), W, { parent: root, at: [s * (fw / 2 + 0.27), 0.5, hz + 0.19] });
      mesh(roundedBox(0.45, 0.12, 0.02, 0.006), W, { parent: root, at: [s * (fw / 2 + 0.27), 0.44, hz + 0.37] });
    }
  } else if (v.head === 'arched') {
    const shape = new THREE.Shape();
    const hw = fw / 2 + 0.06;
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, 0.95);
    shape.bezierCurveTo(-hw * 0.6, 1.0, -hw * 0.35, 1.45, 0, 1.45);
    shape.bezierCurveTo(hw * 0.35, 1.45, hw * 0.6, 1.0, hw, 0.95);
    shape.lineTo(hw, 0);
    shape.lineTo(-hw, 0);
    const frame = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 24 });
    mesh(frame, W, { parent: root, at: [0, 0, hz - 0.04] });
    const inner = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 24 });
    inner.scale(0.86, 0.8, 1);
    mesh(inner, fabricMat(color), { parent: root, at: [0, 0.32, hz + 0.02] });
    const hb = group(null, { parent: root, at: [0, 0.32 + 0.55, hz + 0.095] });
    buttons(hb, fabricMat(color), 8, 4, fw * 0.75, 0.6, [0, 0, 0]);
  } else if (v.head === 'cane') {
    const shape = new THREE.Shape();
    const hw = fw / 2;
    shape.moveTo(-hw, 0.4);
    shape.absarc(0, 0.4 + 0.0, hw, Math.PI, 0, true);
    shape.lineTo(-hw, 0.4);
    const rim = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32 });
    mesh(rim, W, { parent: root, at: [0, 0.32, hz - 0.03] });
    const panel = new THREE.ShapeGeometry(shape, 32).scale(0.9, 0.9, 1);
    mesh(panel, caneMat(), { parent: root, at: [0, 0.36, hz + 0.016] }).material.side = THREE.DoubleSide;
    for (const s of [1, -1]) mesh(roundedBox(0.06, 0.75, 0.06, 0.012), W, { parent: root, at: [s * (hw - 0.03), 0.375, hz]});
  } else if (v.head === 'house') {
    // montessori house frame: four posts and a gable roof outline
    const H = 1.35;
    const posts = [[fw / 2, L / 2 + 0.02], [-fw / 2, L / 2 + 0.02], [fw / 2, hz], [-fw / 2, hz]];
    for (const [x, z] of posts) mesh(roundedBox(0.06, H, 0.06, 0.02), W, { parent: root, at: [x, H / 2, z] });
    for (const z of [L / 2 + 0.02, hz]) {
      for (const s of [1, -1]) curveTube([[s * fw / 2, H, z], [0, H + fw * 0.45, z]], 0.03, W, { parent: root, segments: 2 });
    }
    curveTube([[0, H + fw * 0.45, hz], [0, H + fw * 0.45, L / 2 + 0.02]], 0.03, W, { parent: root, segments: 2 });
    for (const s of [1, -1]) curveTube([[s * fw / 2, H, hz], [s * fw / 2, H, L / 2 + 0.02]], 0.025, W, { parent: root, segments: 2 });
  } else if (v.head === 'canopy') {
    const H = 2.15;
    const posts = [[fw / 2, L / 2 + 0.03], [-fw / 2, L / 2 + 0.03], [fw / 2, hz], [-fw / 2, hz]];
    for (const [x, z] of posts) {
      mesh(turnedLeg(H, 0.04, 'spindle'), W, { parent: root, at: [x, 0, z] });
      mesh(lathe([[0, 0], [0.03, 0], [0.035, 0.03], [0.02, 0.07], [0, 0.09]], 16), W, { parent: root, at: [x, H, z] });
    }
    for (const s of [1, -1]) {
      mesh(roundedBox(0.045, 0.06, L + 0.06, 0.012), W, { parent: root, at: [s * fw / 2, H - 0.04, -0.0] });
      mesh(roundedBox(fw, 0.06, 0.045, 0.012), W, { parent: root, at: [0, H - 0.04, s > 0 ? L / 2 + 0.03 : hz] });
    }
    const drape = new THREE.MeshPhysicalMaterial({ color: '#f7f2ea', roughness: 0.9, sheen: 1, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    for (const [x, z] of posts) {
      const g = group(null, { parent: root, at: [x, H - 0.1, z] });
      mesh(lathe([[0.05, 0], [0.11, -0.4], [0.06, -0.9], [0.12, -1.6], [0.13, -1.95]], 24), drape, { parent: g });
    }
    mesh(roundedBox(fw + 0.06, 1.1, 0.06, 0.015), W, { parent: root, at: [0, 0.55, hz] });
  }
  return finalize(root, { type: 'bed', variant, options: o, animations: [] });
}

/* ============================= WARDROBES ============================= */

export const WARDROBE_VARIANTS = {
  classic: { wood: 'walnut', w: 1.2 },
  modern: { wood: 'white', w: 1.2 },
  armoire: { wood: 'cherry', w: 1.1 },
  sliding: { wood: 'oak', w: 1.8 },
};

function clothes(parent, w, y, seed) {
  const r = rng(seed);
  const n = Math.floor(w / 0.11);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.08 + i * ((w - 0.16) / Math.max(1, n - 1));
    const len = r.range(0.6, 1.0);
    mesh(cushion(0.035, len, 0.42, { radius: 0.017, bulge: 0.1 }), fabricMat(r.pick(['#3c5a80', '#8e2b2b', '#e8e4dc', '#2e2e2e', '#6b8f5a', '#c9a227', '#7a6a8c'])), { parent: parent, at: [x, y - len / 2 - 0.05, 0] });
    curveTube([[x, y - 0.05, -0.2], [x, y + 0.0, 0], [x, y - 0.05, 0.2]], 0.004, metalMat('chrome'), { parent, segments: 8, radialSegments: 5 });
  }
}

export function createWardrobe(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(WARDROBE_VARIANTS, o.variant, 'wardrobe');
  const v = WARDROBE_VARIANTS[variant];
  const root = group(`wardrobe-${variant}`);
  const W = woodMat(o.wood ?? v.wood);
  const Wd = v.w;
  const H = variant === 'armoire' ? 2.05 : 2.1;
  const D = 0.6;
  const plinth = variant === 'classic' || variant === 'armoire' ? 0.1 : 0.06;
  const t = 0.022;
  // carcass
  const cy = plinth + (H - plinth) / 2;
  const ch = H - plinth;
  mesh(roundedBox(Wd, ch, t, 0.004), W, { parent: root, at: [0, cy, -D / 2 + t / 2] });
  for (const s of [1, -1]) mesh(roundedBox(t, ch, D, 0.005), W, { parent: root, at: [s * (Wd / 2 - t / 2), cy, 0] });
  mesh(roundedBox(Wd, t, D, 0.005), W, { parent: root, at: [0, H - t / 2, 0] });
  mesh(roundedBox(Wd - 2 * t, t, D - 0.02, 0.004), W, { parent: root, at: [0, plinth + t / 2, 0] });
  if (variant === 'classic' || variant === 'armoire') {
    mesh(roundedBox(Wd + 0.06, 0.06, D + 0.04, 0.012), W, { parent: root, at: [0, H + 0.03, 0.01] });
    mesh(roundedBox(Wd + 0.1, 0.03, D + 0.07, 0.01), W, { parent: root, at: [0, H + 0.075, 0.015] });
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(turnedLeg(plinth, 0.04, 'bun'), W, { parent: root, at: [sx * (Wd / 2 - 0.05), 0, sz * (D / 2 - 0.05)] });
    mesh(roundedBox(Wd, 0.05, D, 0.008), W, { parent: root, at: [0, plinth - 0.01, 0] });
  } else {
    mesh(roundedBox(Wd - 0.04, plinth, D - 0.06, 0.006), plasticMat('#1b1b1b'), { parent: root, at: [0, plinth / 2, -0.02] });
  }
  // interior
  const rodY = H - 0.16;
  curveTube([[-Wd / 2 + t, rodY, 0], [Wd / 2 - t, rodY, 0]], 0.012, metalMat('chrome'), { parent: root });
  mesh(roundedBox(Wd - 2 * t, t, D - 0.04, 0.004), W, { parent: root, at: [0, rodY + 0.08, 0] });
  const doorBottom = variant === 'armoire' ? plinth + 0.5 : plinth + t;
  clothes(root, Wd - 0.1, rodY, o.seed ?? 3);
  if (variant === 'armoire') {
    mesh(roundedBox(Wd - 2 * t, t, D - 0.02, 0.004), W, { parent: root, at: [0, doorBottom - t / 2, 0] });
  }

  const tracks = [];
  const doorH = H - doorBottom - t;
  const dcy = doorBottom + doorH / 2;
  if (variant === 'sliding') {
    for (const [i, s] of [[0, -1], [1, 1]]) {
      const door = group(`door_${i}`, { parent: root, at: [s * Wd / 4, dcy, D / 2 + 0.012 + i * 0.022] });
      mesh(roundedBox(Wd / 2 + 0.01, doorH, 0.018, 0.004), W, { parent: door });
      mesh(roundedBox(Wd / 2 - 0.12, doorH - 0.14, 0.004, 0.002), new THREE.MeshPhysicalMaterial({ color: '#dfe6ea', metalness: 1, roughness: 0.03 }), { parent: door, at: [0, 0, 0.01] });
      tracks.push(moveTrack(door, 1.2, (tt) => [-s * Math.min(1, tt * 1.2) * (Wd / 2 - 0.05) * (i === 1 ? 1 : 0), 0, 0]));
    }
    mesh(roundedBox(Wd, 0.03, 0.06, 0.006), metalMat('steel'), { parent: root, at: [0, H - 0.015, D / 2 + 0.03] });
  } else {
    for (const s of [1, -1]) {
      const door = group(`door_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [s * Wd / 2, dcy, D / 2 + 0.011] });
      const front = panelFront(Wd / 2 - 0.006, doorH, 0.02, W, { shaker: variant !== 'modern', inset: 0.07 });
      front.position.x = -s * (Wd / 4);
      door.add(front);
      if (variant === 'modern') {
        const pull = barPull(0.35, metalMat('black'), { standoff: 0.025 });
        pull.rotation.z = Math.PI / 2;
        pull.position.set(-s * (Wd / 2 - 0.05), 0, 0.01);
        door.add(pull);
      } else {
        const k = knob(metalMat('brass'), 0.016);
        k.position.set(-s * (Wd / 2 - 0.06), 0, 0.01);
        door.add(k);
      }
      for (const hy of [doorH / 2 - 0.15, -doorH / 2 + 0.15]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 10), metalMat('brass'), { parent: door, at: [0, hy, 0.002] });
      tracks.push(rotateTrack(door, 'y', 1.2, (tt) => s * Math.min(1, tt * 1.2) * 1.75));
    }
  }
  if (variant === 'armoire') {
    for (let i = 0; i < 2; i++) {
      const dr = group(`drawer${i}`, { parent: root, at: [0, plinth + 0.13 + i * 0.22, D / 2 + 0.011] });
      dr.add(panelFront(Wd - 0.06, 0.2, 0.02, W));
      dr.add(drawerBox(Wd - 0.1, 0.18, D - 0.08, W));
      for (const x of [-0.25, 0.25]) { const p = barPull(0.1, metalMat('brass')); p.position.set(x, 0, 0.012); dr.add(p); }
      tracks.push(moveTrack(dr, 1.2, (tt) => [0, 0, Math.min(1, tt * 1.2) * 0.32]));
    }
  }
  const out = finalize(root, { type: 'wardrobe', variant, options: o, animations: [clip('doorsOpen', 1.2, tracks)] });
  out.userData.premade.oneShot = ['doorsOpen'];
  return out;
}

/* ============================== CABINETS ============================== */

export const CABINET_VARIANTS = {
  dresser: { wood: 'walnut', w: 1.4, h: 0.85, cols: 2, rows: 3 },
  nightstand: { wood: 'oak', w: 0.5, h: 0.58, cols: 1, rows: 2 },
  chest: { wood: 'cherry', w: 0.85, h: 1.25, cols: 1, rows: 5 },
  sideboard: { wood: 'oak', w: 1.7, h: 0.82, doors: 3 },
  'tv-stand': { wood: 'walnut', w: 1.6, h: 0.5, doors: 2, open: true },
};

export function createCabinet(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CABINET_VARIANTS, o.variant, 'cabinet');
  const v = CABINET_VARIANTS[variant];
  const root = group(`cabinet-${variant}`);
  const W = woodMat(o.wood ?? v.wood);
  const D = variant === 'nightstand' ? 0.42 : 0.48;
  const legH = 0.12;
  const bodyH = v.h - legH;
  const t = 0.022;
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const l = mesh(taperBox(0.04, legH, 0.04, 0.6), W, { parent: root, at: [sx * (v.w / 2 - 0.05), legH / 2, sz * (D / 2 - 0.05)] });
    l.rotation.set(sz * 0.08, 0, -sx * 0.08);
  }
  const cy = legH + bodyH / 2;
  mesh(roundedBox(v.w, bodyH - 0.026, D, 0.01, 2), W, { parent: root, at: [0, cy - 0.013, -0.012] });
  mesh(roundedBox(v.w + 0.02, 0.028, D + 0.02, 0.008), W, { parent: root, at: [0, v.h - 0.014, -0.002] });
  const tracks = [];
  const front = D / 2 - 0.012;
  if (v.rows) {
    const dh = (bodyH - 0.06) / v.rows;
    const dw = (v.w - 0.04) / v.cols;
    for (let r = 0; r < v.rows; r++) for (let c = 0; c < v.cols; c++) {
      const dr = group(`drawer_${r}_${c}`, { parent: root, at: [-v.w / 2 + 0.02 + dw * (c + 0.5), legH + 0.03 + dh * (r + 0.5), front] });
      dr.add(panelFront(dw - 0.012, dh - 0.012, 0.02, W, { shaker: variant !== 'nightstand' }));
      dr.add(drawerBox(dw - 0.05, dh - 0.03, D - 0.06, W));
      const pull = variant === 'nightstand' ? knob(metalMat('brass')) : barPull(Math.min(0.14, dw * 0.35), metalMat(variant === 'chest' ? 'brass' : 'black'));
      pull.position.z = 0.012;
      dr.add(pull);
      tracks.push(moveTrack(dr, 1, (tt) => [0, 0, Math.min(1, tt * 1.25) * (D - 0.12) * (1 - r * 0.06)]));
    }
  } else {
    const dw = (v.w - 0.04) / v.doors;
    for (let i = 0; i < v.doors; i++) {
      const hingeLeft = i < v.doors / 2;
      const x0 = -v.w / 2 + 0.02 + dw * i;
      if (v.open && i === 0) continue;
      const door = group(`door_${i}`, { parent: root, at: [hingeLeft ? x0 : x0 + dw, cy, front] });
      const p = panelFront(dw - 0.008, bodyH - 0.05, 0.02, W, { shaker: variant === 'sideboard' });
      p.position.x = hingeLeft ? dw / 2 : -dw / 2;
      door.add(p);
      const k = barPull(0.1, metalMat('brass'));
      k.rotation.z = Math.PI / 2;
      k.position.set(hingeLeft ? dw - 0.05 : -dw + 0.05, 0, 0.012);
      door.add(k);
      tracks.push(rotateTrack(door, 'y', 1, (tt) => (hingeLeft ? -1 : 1) * Math.min(1, tt * 1.25) * 1.6));
    }
    if (v.open) {
      // open shelf compartment with a set-top box
      mesh(roundedBox(dw - 0.04, 0.02, D - 0.08, 0.004), W, { parent: root, at: [-v.w / 2 + 0.02 + dw / 2, cy, 0.02] });
      mesh(roundedBox(dw - 0.06, bodyH - 0.06, 0.01, 0.003), new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 0.9 }), { parent: root, at: [-v.w / 2 + 0.02 + dw / 2, cy, front + 0.004] }).visible = false;
      mesh(roundedBox(0.36, 0.05, 0.24, 0.01), plasticMat('#151515', 0.3), { parent: root, at: [-v.w / 2 + 0.02 + dw / 2, cy + 0.035, 0.02] });
    }
  }
  const out = finalize(root, { type: 'cabinet', variant, options: o, animations: [clip(v.rows ? 'drawersOpen' : 'doorsOpen', 1, tracks)] });
  out.userData.premade.oneShot = [v.rows ? 'drawersOpen' : 'doorsOpen'];
  return out;
}

/* ============================= BOOKSHELVES ============================= */

export const BOOKSHELF_VARIANTS = {
  tall: { w: 0.9, h: 2.0, shelves: 5, wood: 'walnut' },
  low: { w: 1.4, h: 0.8, shelves: 2, wood: 'oak' },
  cube: { w: 1.15, h: 1.15, shelves: 3, wood: 'white', cols: 3 },
  ladder: { w: 0.7, h: 1.85, shelves: 5, wood: 'oak', ladder: true },
};

const BOOK_COLORS = ['#7b2d26', '#2d4a7b', '#2f5d3a', '#c9a227', '#3b3b3b', '#a0522d', '#5b3f75', '#d8d2c4', '#1f6f6b', '#b85c38'];

function books(parent, x0, x1, y, depth, maxH, r, mats) {
  let x = x0 + 0.01;
  const end = x1 - 0.01 - r.range(0, (x1 - x0) * 0.3);
  while (x < end) {
    if (r() < 0.12 && end - x > 0.25) {
      // a small flat stack
      const n = r.int(2, 4);
      for (let i = 0; i < n; i++) mesh(roundedBox(0.2, 0.03, depth * 0.85, 0.004), r.pick(mats), { parent, at: [x + 0.11, y + 0.015 + i * 0.031, 0.02], rot: [0, r.range(-0.08, 0.08), 0] });
      x += 0.24;
      continue;
    }
    const bw = r.range(0.018, 0.045);
    const bh = r.range(maxH * 0.6, maxH * 0.9);
    if (x + bw > end) break;
    const bk = mesh(roundedBox(bw, bh, r.range(depth * 0.7, depth * 0.9), 0.003, 1), r.pick(mats), { parent, at: [x + bw / 2, y + bh / 2, 0.02] });
    if (r() < 0.06) { bk.rotation.z = -0.18; bk.position.x += bh * 0.09; x += bh * 0.18; }
    x += bw + 0.0015;
  }
  if (x1 - end > 0.1 && r() < 0.6) {
    mesh(lathe([[0, 0], [0.04, 0], [0.05, 0.04], [0.03, 0.12], [0.02, 0.15], [0.025, 0.16], [0, 0.16]], 24), ceramic(r.pick(['#d9cbb3', '#5f7f8c', '#ffffff'])), { parent, at: [(end + x1) / 2, y, 0] });
  }
}

export function createBookshelf(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BOOKSHELF_VARIANTS, o.variant, 'bookshelf');
  const v = BOOKSHELF_VARIANTS[variant];
  const root = group(`bookshelf-${variant}`);
  const W = woodMat(o.wood ?? v.wood);
  const r = rng(o.seed ?? 7);
  const mats = BOOK_COLORS.map((c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.6, clearcoat: 0.2 }));
  const D = 0.32;
  const t = 0.022;
  if (v.ladder) {
    const lean = 0.18;
    for (const s of [1, -1]) curveTube([[s * v.w / 2, 0, 0.18], [s * v.w / 2, v.h, -0.14]], 0.022, W, { parent: root, segments: 2, radialSegments: 8 });
    for (let i = 0; i < v.shelves; i++) {
      const f = i / v.shelves;
      const y = 0.15 + f * (v.h - 0.35);
      const z = 0.18 - (y / v.h) * 0.32;
      const dd = D * (1 - f * 0.55);
      mesh(roundedBox(v.w - 0.03, t, dd, 0.005), W, { parent: root, at: [0, y, z - dd / 2 + 0.03] });
      if (o.books !== false) books(root, -v.w / 2 + 0.03, v.w / 2 - 0.03, y + t / 2, dd, Math.min(0.3, (v.h - 0.35) / v.shelves - 0.05), r, mats);
    }
    void lean;
    return finalize(root, { type: 'bookshelf', variant, options: o, animations: [] });
  }
  for (const s of [1, -1]) mesh(roundedBox(t, v.h, D, 0.005), W, { parent: root, at: [s * (v.w / 2 - t / 2), v.h / 2, 0] });
  mesh(roundedBox(v.w, v.h, 0.008, 0.002), W, { parent: root, at: [0, v.h / 2, -D / 2 + 0.004] });
  const gap = (v.h - t) / v.shelves;
  for (let s = 0; s <= v.shelves; s++) {
    const y = s * gap + t / 2;
    mesh(roundedBox(v.w - 2 * t + 0.002, t, D - 0.01, 0.004), W, { parent: root, at: [0, y, 0.004] });
    if (s === v.shelves || o.books === false) continue;
    if (v.cols) {
      const cw = (v.w - 2 * t) / v.cols;
      for (let c = 1; c < v.cols; c++) mesh(roundedBox(t, gap - t, D - 0.01, 0.004), W, { parent: root, at: [-v.w / 2 + t + cw * c, y + gap / 2, 0.004] });
      for (let c = 0; c < v.cols; c++) {
        const x0 = -v.w / 2 + t + cw * c + t / 2;
        if (r() < 0.25) {
          const bin = mesh(cushion(cw - 0.03, gap - 0.05, D - 0.04, { radius: 0.015, bulge: 0 }), fabricMat(r.pick(['#8c9a8a', '#c4b79f', '#6d7f99'])), { parent: root, at: [x0 + cw / 2 - t / 2, y + t / 2 + (gap - 0.05) / 2, 0.01] });
          void bin;
        } else books(root, x0, x0 + cw - t, y + t / 2, D - 0.04, gap - 0.06, r, mats);
      }
    } else books(root, -v.w / 2 + t, v.w / 2 - t, y + t / 2, D - 0.04, gap - 0.05, r, mats);
  }
  mesh(roundedBox(v.w, 0.06, 0.02, 0.006), W, { parent: root, at: [0, 0.03, D / 2 - 0.01] });
  return finalize(root, { type: 'bookshelf', variant, options: o, animations: [] });
}
