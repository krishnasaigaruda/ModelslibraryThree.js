import * as THREE from 'three';
import { group, finalize, normalizeOptions, pickVariant, curveTube } from '../../core/utils.js';
import * as M from '../../core/materials.js';
import { spinTrack, rotateTrack, moveTrack, scaleTrack, numberTrack, clip, wave } from '../../core/animation.js';
import {
  Builder, palette, surface, block, facades, spread, windowUnit, door, gableRoof, flatRoof,
  acUnit, signBoard, railingRun, roundedBox,
} from './kit.js';
import { buildingAnimations } from './houses.js';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

let rollId = 0;
/** Sectional roll-up door, pivot at the top so 'garageOpen' can scale it up. Frame: facade plane. */
function rollDoor(B, x, y, w, h, mat, { name, windows = false } = {}) {
  const ft = 0.14;
  B.box(B.mats.trim, w + ft * 2, ft, 0.14, x, y + h + ft / 2, 0.07);
  for (const s of [-1, 1]) B.box(B.mats.trim, ft, h, 0.14, x + s * (w / 2 + ft / 2), y + h / 2, 0.07);
  B.add(B.mats.dark, new THREE.PlaneGeometry(w, h), new THREE.Matrix4().makeTranslation(x, y + h / 2, 0.004));
  const g = new THREE.Group();
  g.name = name ?? `roll_door_${rollId++}`;
  const panels = Math.max(3, Math.round(h / 0.6));
  const ph = h / panels;
  for (let k = 0; k < panels; k++) {
    const p = new THREE.Mesh(roundedBox(w - 0.02, ph - 0.02, 0.05, 0.012, 1), mat);
    p.position.set(0, -ph / 2 - k * ph, 0);
    g.add(p);
    if (windows && k === 1) {
      const n = Math.max(2, Math.round(w / 0.9));
      for (let i = 0; i < n; i++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(w / n - 0.2, ph * 0.5), B.mats.glass);
        win.position.set(-w / 2 + ((i + 0.5) * w) / n, -ph / 2 - k * ph, 0.03);
        g.add(win);
      }
    }
  }
  B.attach(g, x, y + h, 0.04);
  return g;
}

function rollClip(name, doors) {
  return clip(name, 2.5, doors.map((g) => scaleTrack(g, 2.5, (t) => [1, 1 - 0.95 * (1 - (1 - t) ** 2), 1], 12)));
}

/** Gambrel (barn) roof over w (along X) × d at height y. */
function gambrelRoof(B, w, d, y, { r1 = 2.2, r2 = 1.6, overhang = 0.3, thick = 0.14 } = {}) {
  const z1 = d / 2;
  const z2 = d * 0.3;
  const pts = [[-z1, y], [-z2, y + r1], [0, y + r1 + r2], [z2, y + r1], [z1, y]];
  B.prism(B.mats.wall, [[-z1, y], ...pts.slice(1, 4), [z1, y]], -w / 2, w / 2);
  const L = w + overhang * 2;
  for (let i = 0; i < 4; i++) {
    let [za, ya] = pts[i];
    const [zb, yb] = pts[i + 1];
    if (i === 0 || i === 3) {
      // extend the lower slabs past the wall for an eave
      const [zo, yo] = i === 0 ? [za, ya] : [zb, yb];
      const [zi, yi] = i === 0 ? [zb, yb] : [za, ya];
      const len = Math.hypot(zo - zi, yo - yi);
      const ez = zo + ((zo - zi) / len) * overhang;
      const ey = yo + ((yo - yi) / len) * overhang;
      if (i === 0) { za = ez; ya = ey; B.slab(B.mats.roof, za, ya, zb, yb, L, thick); }
      else B.slab(B.mats.roof, za, ya, ez, ey, L, thick);
    } else B.slab(B.mats.roof, za, ya, zb, yb, L, thick);
  }
  B.add(B.mats.roof, new THREE.CylinderGeometry(0.1, 0.1, L, 8), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, y + r1 + r2 + thick, 0));
  return y + r1 + r2;
}

/* ------------------------------------------------------------------ */
/* Garage                                                              */
/* ------------------------------------------------------------------ */

export const GARAGE_VARIANTS = {
  single: { w: 3.8, wall: '#c9c3b6', wallKind: 'siding', roof: '#4a4d52', roofKind: 'shingle', trim: '#ffffff', door: '#f2f2f0' },
  double: { w: 6.6, wall: '#b8a48a', wallKind: 'brick', roof: '#3d4247', roofKind: 'shingle', trim: '#efe9dd', door: '#f2f2f0' },
  carport: { w: 6.2, wall: '#8a8f94', wallKind: 'concrete', roof: '#5c6670', roofKind: 'seam', trim: '#2b2d30', door: '#2b2d30' },
};

export function createGarage(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(GARAGE_VARIANTS, o.variant, 'garage');
  const d = GARAGE_VARIANTS[variant];
  const root = group(`garage-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const w = d.w;
  const dp = 6.4;
  const h = 2.9;
  const doors = [];
  B.box(B.mats.concrete, w + 0.4, 0.08, dp + 3, 0, 0.04, 1.4);
  if (variant === 'carport') {
    // roof underside line: y(z); sloped beams sit right under it, posts run up into the beams
    const yAt = (z) => h + 0.05 + ((z + dp / 2 + 0.3) / (dp + 0.6)) * 0.3;
    for (const sx of [-1, 1]) {
      B.slab(m.trim, -dp / 2 - 0.1, yAt(-dp / 2 - 0.1) - 0.25, dp / 2 + 0.1, yAt(dp / 2 + 0.1) - 0.25, 0.12, 0.25, sx * (w / 2 - 0.1));
      for (const sz of [-1, 1]) {
        const z = sz * (dp / 2 - 0.1);
        const ph = yAt(z) - 0.2;
        B.box(m.trim, 0.14, ph, 0.14, sx * (w / 2 - 0.1), ph / 2, z, 0, 0.03);
      }
    }
    B.slab(m.roof, -dp / 2 - 0.3, h + 0.05, dp / 2 + 0.3, h + 0.35, w + 0.4, 0.08);
    // storage wall at the back
    B.box(B.mats.wall, w, h, 0.2, 0, h / 2, -dp / 2 + 0.1);
  } else {
    block(B, w, h, dp, { plinth: 0.25 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        if (variant === 'double') doors.push(rollDoor(B, 0, 0.08, 5.0, 2.2, m.door, { name: 'garage_door', windows: true }));
        else doors.push(rollDoor(B, 0, 0.08, 2.6, 2.2, m.door, { name: 'garage_door', windows: true }));
        B.add(M.emissive('#fff3d6', 1.2), new THREE.SphereGeometry(0.1, 12, 8), new THREE.Matrix4().makeTranslation(0, 2.65, 0.15));
        // lamp wall bracket: back plate in the wall, arm up into the globe
        B.box(B.mats.dark, 0.14, 0.2, 0.03, 0, 2.65, 0.013, 0, 0);
        B.box(B.mats.dark, 0.05, 0.05, 0.1, 0, 2.65, 0.07, 0, 0);
      } else if (side === 'right') {
        door(B, 1.4, 0.25, 0.9, 2.05, { frame: m.trim });
      } else if (side === 'left') windowUnit(B, 0, 1.1, 1.0, 1.0, { style: 'cross' });
    });
    gableRoof(B, dp, w, h, { pitch: 0.55, overhang: 0.35, ridgeAlong: 'z' });
  }
  B.finish();
  const animations = buildingAnimations(root, B).filter((a) => a.name !== 'garageOpen');
  if (doors.length) animations.push(rollClip('garageOpen', doors));
  finalize(root, { type: 'garage', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen', 'garageOpen'];
  return root;
}

/* ------------------------------------------------------------------ */
/* Barn                                                                */
/* ------------------------------------------------------------------ */

export const BARN_VARIANTS = {
  gambrel: { wall: '#8e2a22', wallKind: 'vboard', roof: '#4a4d52', roofKind: 'seam', trim: '#f4f1ea' },
  gable: { wall: '#6d5a48', wallKind: 'vboard', roof: '#8a8f94', roofKind: 'seam', trim: '#e9e3d6' },
};

export function createBarn(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BARN_VARIANTS, o.variant, 'barn');
  const d = BARN_VARIANTS[variant];
  const root = group(`barn-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const w = 16; // along X (front faces +Z means gable end is the front: build with ridge along Z)
  const dp = 10;
  const h = 4.2;
  const slides = [];
  B.local(0, 0, 0, Math.PI / 2, () => {
    block(B, w, h, dp, { plinth: 0.35 });
    if (variant === 'gambrel') gambrelRoof(B, w, dp, h);
    else gableRoof(B, w, dp, h, { pitch: 0.8, overhang: 0.35, fascia: m.trim });
  });
  // front gable end (+Z after the rotation the long axis runs along Z)
  facades(B, dp, w, (side) => {
    if (side !== 'front' && side !== 'back') {
      for (const x of spread(w, 4, 2)) windowUnit(B, x, 1.6, 0.9, 0.9, { style: 'cross', frame: m.trim });
      return;
    }
    // big sliding doors with white X bracing on a track
    const dw = 3.6;
    const dh = 3.6;
    B.box(m.metal, dw * 2 + 0.6, 0.12, 0.12, 0, dh + 0.25, 0.1);
    B.add(m.dark, new THREE.PlaneGeometry(dw, dh), new THREE.Matrix4().makeTranslation(0, dh / 2 + 0.05, 0.004));
    if (side === 'front') {
      for (const s of [-1, 1]) {
        const leaf = new THREE.Group();
        leaf.name = `barn_door_${s > 0 ? 'R' : 'L'}`;
        const panel = new THREE.Mesh(roundedBox(dw / 2, dh, 0.08, 0.015, 1), m.wall);
        leaf.add(panel);
        for (const [fw, fh, fx, fy, rz] of [[dw / 2, 0.14, 0, dh / 2 - 0.07, 0], [dw / 2, 0.14, 0, -dh / 2 + 0.07, 0], [0.14, dh, -dw / 4 + 0.07, 0, 0], [0.14, dh, dw / 4 - 0.07, 0, 0], [0.12, Math.hypot(dw / 2, dh) - 0.3, 0, 0, Math.atan2(dw / 2, dh)], [0.12, Math.hypot(dw / 2, dh) - 0.3, 0, 0, -Math.atan2(dw / 2, dh)]]) {
          const b = new THREE.Mesh(roundedBox(fw, fh, 0.05, 0.015, 1), m.trim);
          b.position.set(fx, fy, 0.06);
          b.rotation.z = rz;
          leaf.add(b);
        }
        B.attach(leaf, s * dw / 4, dh / 2 + 0.05, 0.1);
        slides.push([leaf, s]);
      }
      // hayloft door + pulley beam
      B.box(m.trim, 1.6, 1.6, 0.1, 0, h + 1.2, 0.05);
      B.box(m.wall, 1.36, 1.36, 0.12, 0, h + 1.2, 0.06);
    } else B.box(m.wall, dw, dh, 0.08, 0, dh / 2 + 0.05, 0.06);
  }, { sides: ['front', 'back', 'left', 'right'] });
  // cupola on the ridge
  const ridgeY = variant === 'gambrel' ? h + 3.8 : h + 4.0;
  B.box(m.trim, 1.2, 1.1, 1.2, 0, ridgeY + 0.45, 0);
  for (const s of [0, Math.PI / 2]) B.local(0, 0, 0, s, () => B.box(m.dark, 0.9, 0.6, 1.22, 0, ridgeY + 0.5, 0));
  B.add(m.roof, new THREE.ConeGeometry(1.0, 0.8, 4).rotateY(Math.PI / 4), new THREE.Matrix4().makeTranslation(0, ridgeY + 1.4, 0));
  B.cyl(m.metal, 0.02, 0.02, 0.9, 0, ridgeY + 2.2, 0, 6);
  B.finish();
  const animations = buildingAnimations(root, B);
  animations.push(clip('doorsSlide', 2.5, slides.map(([leaf, s]) => moveTrack(leaf, 2.5, (t) => [s * (1 - (1 - t) ** 2) * 1.8, 0, 0], 12))));
  finalize(root, { type: 'barn', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorsSlide'];
  return root;
}

/* ------------------------------------------------------------------ */
/* Church                                                              */
/* ------------------------------------------------------------------ */

export const CHURCH_VARIANTS = {
  chapel: { wall: '#f4f2ee', wallKind: 'vboard', roof: '#3e4247', roofKind: 'shingle', trim: '#ffffff', door: '#7a2e2a', len: 14, span: 8, tower: 3 },
  stone: { wall: '#bdb4a3', wallKind: 'stone', roof: '#4a5058', roofKind: 'tile', trim: '#e2dccf', door: '#4a2e1e', len: 22, span: 11, tower: 4.2 },
};

export function createChurch(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CHURCH_VARIANTS, o.variant, 'church');
  const d = CHURCH_VARIANTS[variant];
  const root = group(`church-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const stained = new THREE.MeshStandardMaterial({ name: 'win_glow', color: '#3d2a5a', emissive: '#ffb347', emissiveIntensity: o.lightsOn ? 1.4 : 0.15, roughness: 0.4 });
  const { len, span, tower } = d;
  const h = variant === 'stone' ? 8 : 5;
  block(B, span, h, len);
  facades(B, span, len, (side, width) => {
    if (side === 'left' || side === 'right') for (const x of spread(width, variant === 'stone' ? 6 : 4, 2.2)) windowUnit(B, x, 1.8, 1.2, h - 3.6, { style: 'arch', frame: m.trim, glowMat: stained });
    if (side === 'back') windowUnit(B, 0, 2, 1.6, h - 3.6, { style: 'arch', frame: m.trim, glowMat: stained });
  }, { cz: 0 });
  gableRoof(B, len, span, h, { pitch: variant === 'stone' ? 1.0 : 1.15, overhang: 0.35, ridgeAlong: 'z' });
  // front: tower
  const tz = len / 2 + tower / 2 - 0.2;
  const th = variant === 'stone' ? 18 : 12;
  block(B, tower, th, tower, { cz: tz });
  B.local(0, 0, tz + tower / 2, 0, () => {
    door(B, 0, 0.45, 1.8, 3.0, { double: true, frame: m.trim, steps: 2, name: 'church_door' });
    B.add(m.trim, new THREE.TorusGeometry(1.05, 0.08, 8, 24, Math.PI), new THREE.Matrix4().makeTranslation(0, 3.6, 0.08));
    B.add(stained, new THREE.CircleGeometry(0.95, 24, 0, Math.PI), new THREE.Matrix4().makeTranslation(0, 3.55, 0.01));
    windowUnit(B, 0, 6, 0.8, 1.6, { style: 'arch', frame: m.trim, glowMat: stained });
  });
  // belfry with openings on four sides, cornice, spire and cross
  const by = th;
  B.box(m.trim, tower + 0.3, 0.3, tower + 0.3, 0, by + 0.15, tz, 0, 0.04);
  for (const [x, z, w2, d2] of [[-tower / 2 + 0.2, tz, 0.4, tower], [tower / 2 - 0.2, tz, 0.4, tower]]) B.box(B.mats.wall, w2, 3, d2, x, by + 1.8, z);
  for (const s of [-1, 1]) {
    B.box(B.mats.wall, 0.6, 3, 0.4, -tower / 2 + 0.5, by + 1.8, tz + s * (tower / 2 - 0.2));
    B.box(B.mats.wall, 0.6, 3, 0.4, tower / 2 - 0.5, by + 1.8, tz + s * (tower / 2 - 0.2));
    B.box(B.mats.wall, tower - 0.8, 0.8, 0.4, 0, by + 2.9, tz + s * (tower / 2 - 0.2));
  }
  B.box(m.trim, tower + 0.4, 0.35, tower + 0.4, 0, by + 3.45, tz, 0, 0.05);
  const spireH = variant === 'stone' ? 12 : 9;
  B.add(m.roof, new THREE.ConeGeometry(tower * 0.62, spireH, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(0, by + 3.6 + spireH / 2, tz));
  const crossMat = M.metal('#c9a54a', 0.3);
  B.box(crossMat, 0.12, 1.4, 0.12, 0, by + 3.6 + spireH + 0.7, tz);
  B.box(crossMat, 0.8, 0.12, 0.12, 0, by + 3.6 + spireH + 0.95, tz);
  B.finish();
  // swinging bell
  const bell = new THREE.Group();
  bell.name = 'bell';
  bell.position.set(0, by + 2.8, tz);
  const bellMesh = new THREE.Mesh(new THREE.LatheGeometry([[0.02, 0], [0.25, -0.05], [0.32, -0.4], [0.45, -0.85], [0.5, -0.95], [0.02, -0.95]].map(([r, y]) => new THREE.Vector2(r, y)), 24), M.metal('#b08d3c', 0.3));
  bell.add(bellMesh);
  // headstock (yoke) + axle: the axle runs along X into both belfry walls (bell swings about it)
  const iron = M.metal('#3a3a3a', 0.5);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, tower - 0.8 + 0.06, 12).rotateZ(Math.PI / 2), iron);
  bell.add(axle);
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.16), iron);
  yoke.position.y = -0.02;
  bell.add(yoke);
  root.add(bell);
  const animations = buildingAnimations(root, B);
  animations.push(clip('bell', 2, [rotateTrack(bell, 'x', 2, (t) => wave(t) * 0.6)]));
  finalize(root, { type: 'church', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}

/* ------------------------------------------------------------------ */
/* School, fire station, hospital, warehouse                           */
/* ------------------------------------------------------------------ */

export const SCHOOL_VARIANTS = {
  standard: { wall: '#a5543d', wallKind: 'brick', roof: '#777', roofKind: 'concrete', trim: '#f0ebe0', accent: '#2c4f7c', door: '#2c4f7c' },
  modern: { wall: '#e9e6df', wallKind: 'stucco', roof: '#777', roofKind: 'concrete', trim: '#f2a03d', accent: '#2b2d30', door: '#2b2d30' },
};

export function createSchool(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SCHOOL_VARIANTS, o.variant, 'school');
  const d = SCHOOL_VARIANTS[variant];
  const root = group(`school-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const w = 32;
  const dp = 14;
  const fh = 3.8;
  const h = 0.5 + fh * 2;
  block(B, w, h, dp, { plinth: 0.5 });
  facades(B, w, dp, (side, width) => {
    const n = side === 'front' || side === 'back' ? 9 : 3;
    for (let f = 0; f < 2; f++) for (const x of spread(width, n, 1.8)) {
      if (side === 'front' && f === 0 && Math.abs(x) < 3) continue;
      windowUnit(B, x, 0.5 + f * fh + 0.9, 2.2, 2.0, { style: variant === 'modern' ? 'none' : 'grid', frame: variant === 'modern' ? m.accent : m.trim, header: variant === 'modern' ? null : m.trim });
    }
    if (side === 'front') {
      door(B, 0, 0.5, 2.4, 2.6, { double: true, glass: true, frame: m.accent, steps: 2 });
      B.slab(variant === 'modern' ? m.trim : m.accent, 0, 3.7, 2.6, 3.6, 6.4, 0.2);
      for (const s of [-1, 1]) B.box(m.trim, 0.25, 3.2, 0.25, s * 2.9, 0.5 + 1.6, 2.45, 0, 0.05);
      signBoard(B, 0, 4.5, 0.03, 6, 0.6, 'SCHOOL', { bg: variant === 'modern' ? '#2b2d30' : '#f0ebe0', fg: variant === 'modern' ? '#f2a03d' : '#2c4f7c' });
      // clock
      B.add(m.trim, new THREE.CylinderGeometry(0.75, 0.75, 0.12, 32).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, h - 0.9, 0.06));
      B.add(B.mats.dark, new THREE.CircleGeometry(0.62, 32), new THREE.Matrix4().makeTranslation(0, h - 0.9, 0.125));
    }
  });
  flatRoof(B, w, dp, h, { parapet: 0.9, mat: B.mats.wall, cap: m.trim });
  for (let k = 0; k < 3; k++) acUnit(B, -8 + k * 8, h + 0.06, -3, 0);
  B.box(B.mats.concrete, w + 8, 0.06, 8, 0, 0.03, dp / 2 + 4);
  B.finish();
  // flagpole + waving flag
  const poleX = w / 2 + 3;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 10, 10), M.metal('#c9ccd1', 0.3));
  pole.position.set(poleX, 5, dp / 2 + 4);
  root.add(pole);
  const flag = new THREE.Group();
  flag.name = 'flag';
  flag.position.set(poleX, 9.2, dp / 2 + 4);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1, 8, 1).translate(0.9, 0, 0), new THREE.MeshStandardMaterial({ color: o.flagColor ?? '#1e4fa3', side: THREE.DoubleSide, roughness: 0.8 }));
  flag.add(cloth);
  root.add(flag);
  const hands = new THREE.Group();
  hands.name = 'clock_hands';
  hands.position.set(0, h - 0.9, dp / 2 + 0.14);
  for (const [len, wdt, rz] of [[0.45, 0.05, 0], [0.32, 0.07, 1.6]]) {
    const hand = new THREE.Mesh(new THREE.BoxGeometry(wdt, len, 0.02).translate(0, len / 2, 0), m.trim);
    hand.rotation.z = rz;
    hands.add(hand);
  }
  root.add(hands);
  const animations = buildingAnimations(root, B);
  animations.push(clip('flag', 2, [rotateTrack(flag, 'y', 2, (t) => wave(t) * 0.35)]));
  animations.push(clip('clock', 60, [spinTrack(hands, 'z', 60, -1)]));
  finalize(root, { type: 'school', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}

export const FIRE_STATION_VARIANTS = {
  standard: { wall: '#9c3b2c', wallKind: 'brick', roof: '#777', roofKind: 'concrete', trim: '#efe9dd', accent: '#2b2d30', door: '#c62828' },
  modern: { wall: '#3d4247', wallKind: 'concrete', roof: '#777', roofKind: 'concrete', trim: '#c62828', accent: '#c62828', door: '#e9e9e7' },
};

export function createFireStation(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FIRE_STATION_VARIANTS, o.variant, 'fire-station');
  const d = FIRE_STATION_VARIANTS[variant];
  const root = group(`fire-station-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const w = 20;
  const dp = 16;
  const h = 8;
  const doors = [];
  block(B, w, h, dp, { plinth: 0.3 });
  facades(B, w, dp, (side, width) => {
    if (side === 'front') {
      for (let i = -1; i <= 1; i++) doors.push(rollDoor(B, i * 5.4 - 1.4, 0.08, 4.2, 4.4, m.door, { windows: true }));
      door(B, 8.2, 0.3, 1.1, 2.3, { frame: m.trim });
      for (const x of spread(width, 5, 2)) windowUnit(B, x, 5.6, 1.5, 1.6, { style: 'double', frame: m.trim, header: m.trim });
      signBoard(B, 0, 4.95, 0.03, 9, 0.6, 'FIRE STATION', { bg: '#efe9dd', fg: '#9c1f1f' });
    } else for (const x of spread(width, side === 'back' ? 5 : 4, 2)) {
      windowUnit(B, x, 1.5, 1.4, 1.6, { style: 'double', frame: m.trim });
      windowUnit(B, x, 5.6, 1.4, 1.6, { style: 'double', frame: m.trim });
    }
  });
  flatRoof(B, w, dp, h, { parapet: 1.0, mat: B.mats.wall, cap: m.trim });
  // hose tower
  block(B, 4, 15, 4, { cx: -w / 2 - 2, cz: -dp / 2 + 2 });
  B.local(-w / 2 - 2, 0, -dp / 2 + 4, 0, () => { for (const y of [4, 8, 12]) windowUnit(B, 0, y, 0.8, 1.4, { style: 'double', frame: m.trim }); });
  flatRoof(B, 4, 4, 15, { parapet: 0.6, cx: -w / 2 - 2, cz: -dp / 2 + 2, mat: B.mats.wall, cap: m.trim });
  B.box(B.mats.concrete, w + 2, 0.06, 10, 0, 0.03, dp / 2 + 5);
  const beacon = new THREE.MeshStandardMaterial({ name: 'beacon', color: '#c62828', emissive: '#ff2020', emissiveIntensity: 0.2 });
  B.add(beacon, new THREE.SphereGeometry(0.25, 16, 8), new THREE.Matrix4().makeTranslation(w / 2 - 1.5, h + 1.21, dp / 2 - 0.4));
  B.finish();
  const animations = buildingAnimations(root, B).filter((a) => a.name !== 'garageOpen');
  animations.push(rollClip('garageOpen', doors));
  animations.push(clip('alarm', 0.6, [numberTrack('beacon.material.emissiveIntensity', 0.6, (t) => (t < 0.5 ? 4 : 0.1), 2, THREE.InterpolateDiscrete)]));
  finalize(root, { type: 'fire-station', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen', 'garageOpen'];
  return root;
}

export const HOSPITAL_VARIANTS = {
  standard: { wall: '#f1f1ee', wallKind: 'stucco', roof: '#777', roofKind: 'concrete', trim: '#5f7f99', accent: '#2b2d30', floors: 6 },
  clinic: { wall: '#e8efe9', wallKind: 'stucco', roof: '#777', roofKind: 'concrete', trim: '#2e7d32', accent: '#2b2d30', floors: 2 },
};

export function createHospital(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(HOSPITAL_VARIANTS, o.variant, 'hospital');
  const d = HOSPITAL_VARIANTS[variant];
  const root = group(`hospital-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const floors = Math.max(2, Math.round(o.floors ?? d.floors));
  const w = variant === 'clinic' ? 20 : 36;
  const dp = 18;
  const fh = 3.6;
  const h = 0.3 + floors * fh;
  block(B, w, h, dp, { plinth: 0.3 });
  facades(B, w, dp, (side, width) => {
    for (let f = 0; f < floors; f++) {
      const y = 0.3 + f * fh;
      if (f > 0 || side !== 'front') {
        B.add(B.mats.glass, new THREE.PlaneGeometry(width - 1.2, 1.7), new THREE.Matrix4().makeTranslation(0, y + 1.75, 0.03));
        B.add(B.mats.glow, new THREE.PlaneGeometry(width - 1.2, 1.7), new THREE.Matrix4().makeTranslation(0, y + 1.75, 0.006));
        for (const x of spread(width - 1.2, Math.round(width / 1.8), 0)) B.box(m.trim, 0.08, 1.7, 0.1, x, y + 1.75, 0.05);
        B.box(m.trim, width - 1.0, 0.1, 0.12, 0, y + 0.85, 0.06);
        B.box(m.trim, width - 1.0, 0.1, 0.12, 0, y + 2.65, 0.06);
      }
    }
    if (side === 'front') {
      door(B, 0, 0.3, 3.0, 2.8, { double: true, glass: true, frame: m.trim });
      for (const x of [-7, 7]) windowUnit(B, x, 0.6, 8, 2.4, { style: 'tall', frame: m.trim, sill: false });
      B.box(m.trim, 10, 0.4, 4.4, 0, 3.8, 2.2, 0, 0.06);
      for (const s of [-1, 1]) B.box(m.trim, 0.3, 3.5, 0.3, s * 4.6, 2.05, 4.1, 0, 0.06);
      const red = M.emissive('#e53935', 1.4);
      red.name = 'er_sign';
      B.local(0, 0, 4.42, 0, () => signBoard(B, 0, 3.8, 0, 5, 0.32, 'EMERGENCY', { bg: '#c62828', fg: '#ffffff', emissive: 0.9, logo: false }));
      // red cross on the facade
      B.box(red, 1.4, 0.45, 0.1, -w / 2 + 2, h - 1.5, 0.05);
      B.box(red, 0.45, 1.4, 0.1, -w / 2 + 2, h - 1.5, 0.05);
    }
  });
  flatRoof(B, w, dp, h, { parapet: 0.8, mat: B.mats.wall, cap: m.trim });
  if (variant === 'standard') {
    // helipad
    B.add(B.mats.dark, new THREE.CylinderGeometry(6, 6, 0.2, 40), new THREE.Matrix4().makeTranslation(w / 4, h + 0.4, 0));
    B.add(M.matte('#f5f5f5'), new THREE.TorusGeometry(5.2, 0.12, 6, 48).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(w / 4, h + 0.51, 0));
    for (const x of [-1.2, 1.2]) B.box(M.matte('#f5f5f5'), 0.5, 0.03, 3.6, w / 4 + x, h + 0.51, 0, 0, 0.005);
    B.box(M.matte('#f5f5f5'), 2.4, 0.03, 0.5, w / 4, h + 0.51, 0, 0, 0.005);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(m.metal, 0.3, 0.3, 0.3, w / 4 + sx * 4, h + 0.15, sz * 4);
    B.box(B.mats.wall, 6, 3.4, 5, -w / 4, h + 1.7, -2);
  }
  for (let k = 0; k < 4; k++) acUnit(B, -w / 2 + 3 + k * 2.2, h + 0.06, dp / 2 - 2.5, 0);
  B.finish();
  const animations = buildingAnimations(root, B);
  finalize(root, { type: 'hospital', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}

export const WAREHOUSE_VARIANTS = {
  standard: { wall: '#9aa3ab', wallKind: 'corrugated', roof: '#7c848b', roofKind: 'seam', trim: '#2c4f7c', accent: '#2b2d30', door: '#d8dadc' },
  cold: { wall: '#eef1f3', wallKind: 'corrugated', roof: '#c9ced3', roofKind: 'seam', trim: '#1565c0', accent: '#2b2d30', door: '#1565c0' },
};

export function createWarehouse(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(WAREHOUSE_VARIANTS, o.variant, 'warehouse');
  const d = WAREHOUSE_VARIANTS[variant];
  const root = group(`warehouse-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const w = 40;
  const dp = 24;
  const h = 9;
  const doors = [];
  block(B, w, h, dp, { plinth: 1.2 });
  B.box(m.trim, w + 0.06, 0.8, dp + 0.06, 0, h - 0.6, 0, 0, 0.03);
  facades(B, w, dp, (side, width) => {
    if (side === 'front') {
      for (let i = 0; i < 4; i++) {
        const x = -12 + i * 6;
        doors.push(rollDoor(B, x, 1.2, 3.2, 3.4, m.door));
        for (const s of [-1, 1]) B.box(B.mats.dark, 0.3, 0.6, 0.25, x + s * 1.9, 1.5, 0.13, 0, 0.04);
        B.slab(m.trim, 0, 5.3, 1.6, 5.1, 4.2, 0.12, x);
      }
      B.box(B.mats.concrete, 26, 1.2, 3, -3, 0.6, 1.5);
      door(B, 15, 0.12, 1.0, 2.2, { frame: m.trim });
      windowUnit(B, 17.4, 1.2, 1.6, 1.0, { style: 'none', frame: m.trim });
      signBoard(B, 12, 7.2, 0.03, 8, 1.0, variant === 'cold' ? 'COLD STORAGE' : 'LOGISTICS', { bg: d.trim, fg: '#ffffff' });
    }
  });
  gableRoof(B, w, dp, h, { pitch: 0.12, overhang: 0.4, fascia: m.trim });
  for (let i = -3; i <= 3; i++) B.box(B.mats.glass, 1.2, 0.2, 2.2, i * 5, h + 0.9, -4, 0, 0.05);
  B.box(B.mats.concrete, w + 6, 0.06, 14, 0, 0.03, dp / 2 + 7);
  B.finish();
  const animations = buildingAnimations(root, B).filter((a) => a.name !== 'garageOpen');
  animations.push(rollClip('garageOpen', doors));
  finalize(root, { type: 'warehouse', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen', 'garageOpen'];
  return root;
}

/* ------------------------------------------------------------------ */
/* Lighthouse, windmill, tent                                          */
/* ------------------------------------------------------------------ */

export const LIGHTHOUSE_VARIANTS = {
  striped: { a: '#f4f4f2', b: '#c62828', wall: '#f4f2ee', wallKind: 'siding', roof: '#2f3a44', roofKind: 'shingle', trim: '#ffffff' },
  classic: { a: '#f4f4f2', b: '#f4f4f2', wall: '#e9e3d6', wallKind: 'siding', roof: '#2f3a44', roofKind: 'shingle', trim: '#ffffff' },
};

export function createLighthouse(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(LIGHTHOUSE_VARIANTS, o.variant, 'lighthouse');
  const d = LIGHTHOUSE_VARIANTS[variant];
  const root = group(`lighthouse-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const H = 18;
  const r0 = 2.6;
  const r1 = 1.6;
  const bands = 6;
  const matA = new THREE.MeshStandardMaterial({ name: 'band_a', color: M.toColor(o.color ?? d.a), roughness: 0.6 });
  const matB = new THREE.MeshStandardMaterial({ name: 'band_b', color: M.toColor(o.accentColor ?? d.b), roughness: 0.6 });
  B.add(B.mats.plinth, new THREE.CylinderGeometry(r0 + 0.4, r0 + 0.5, 1.0, 32), new THREE.Matrix4().makeTranslation(0, 0.5, 0));
  for (let i = 0; i < bands; i++) {
    const ya = 1 + (i * (H - 1)) / bands;
    const yb = 1 + ((i + 1) * (H - 1)) / bands;
    const ra = r0 + (r1 - r0) * ((ya - 1) / (H - 1));
    const rb = r0 + (r1 - r0) * ((yb - 1) / (H - 1));
    B.add(i % 2 ? matB : matA, new THREE.CylinderGeometry(rb, ra, yb - ya, 40, 1, true), new THREE.Matrix4().makeTranslation(0, (ya + yb) / 2, 0));
  }
  // windows up the tower
  for (const [y, a] of [[4, 0], [8, Math.PI], [12, 0.4]]) {
    const r = r0 + (r1 - r0) * ((y - 1) / (H - 1));
    B.local(Math.sin(a) * r, 0, Math.cos(a) * r, a, () => windowUnit(B, 0, y, 0.5, 0.9, { style: 'none', frame: m.trim, sill: true }));
  }
  B.local(0, 0, r0, 0, () => door(B, 0, 1.0, 0.9, 2.0, { frame: m.trim, steps: 2, name: 'lighthouse_door' }));
  // gallery deck + railing ring
  const gy = H;
  B.add(B.mats.dark, new THREE.CylinderGeometry(r1 + 0.9, r1 + 0.6, 0.3, 40), new THREE.Matrix4().makeTranslation(0, gy + 0.15, 0));
  const railR = r1 + 0.8;
  B.add(B.mats.dark, new THREE.TorusGeometry(railR, 0.04, 6, 48).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, gy + 1.3, 0));
  B.add(B.mats.dark, new THREE.TorusGeometry(railR, 0.03, 6, 48).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, gy + 0.7, 0));
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    B.add(B.mats.dark, new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), new THREE.Matrix4().makeTranslation(Math.sin(a) * railR, gy + 0.8, Math.cos(a) * railR));
  }
  // lantern room
  B.add(B.mats.dark, new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16), new THREE.Matrix4().makeTranslation(0, gy + 0.7, 0));
  B.add(B.mats.glass, new THREE.CylinderGeometry(1.15, 1.15, 1.8, 16, 1, true), new THREE.Matrix4().makeTranslation(0, gy + 2.0, 0));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    B.add(B.mats.dark, new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), new THREE.Matrix4().makeTranslation(Math.sin(a) * 1.16, gy + 2.0, Math.cos(a) * 1.16));
  }
  B.add(m.roof, new THREE.SphereGeometry(1.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Matrix4().makeTranslation(0, gy + 2.9, 0));
  B.cyl(B.mats.dark, 0.05, 0.12, 0.8, 0, gy + 4.5, 0, 8);
  // keeper's cottage
  B.local(r0 + 4.5, 0, -1, 0, () => {
    block(B, 6, 3, 5, { plinth: 0.4 });
    facades(B, 6, 5, (side) => {
      if (side === 'front') { door(B, -1.4, 0.4, 0.9, 2.0, { frame: m.trim }); windowUnit(B, 1.4, 1.2, 1.0, 1.2, { style: 'cross', frame: m.trim }); }
      else if (side === 'right') windowUnit(B, 0, 1.2, 1.0, 1.2, { style: 'cross', frame: m.trim });
    });
    gableRoof(B, 6, 5, 3, { pitch: 0.75, overhang: 0.3 });
  });
  B.finish();
  // rotating lamp with light beams
  const lamp = new THREE.Group();
  lamp.name = 'lamp';
  lamp.position.set(0, gy + 2.0, 0);
  lamp.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), M.emissive('#fff6c8', 4)));
  const beamMat = new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  if (o.beams || o.lightsOn) for (const s of [1, -1]) {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 22, 24, 1, true).rotateZ(s * Math.PI / 2).translate(s * 11, 0, 0), beamMat);
    beam.name = `beam_${s > 0 ? 'a' : 'b'}`;
    beam.castShadow = false;
    lamp.add(beam);
  }
  root.add(lamp);
  const animations = buildingAnimations(root, B);
  animations.push(clip('beam', 6, [spinTrack(lamp, 'y', 6, 1)]));
  finalize(root, { type: 'lighthouse', variant, options: o, animations });
  lamp.traverse((c) => { if (c.isMesh) c.castShadow = false; });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}

export const WINDMILL_VARIANTS = {
  dutch: { wall: '#6b5a4a', wallKind: 'vboard', roof: '#3a3d42', roofKind: 'shingle', trim: '#f4f1ea', sail: '#efe6d2' },
  stone: { wall: '#b5ab9a', wallKind: 'stone', roof: '#5a4a3f', roofKind: 'shingle', trim: '#efe9dd', sail: '#e9e3d6' },
  windpump: { wall: '#9aa3ab', wallKind: 'concrete', roof: '#9aa3ab', roofKind: 'seam', trim: '#c62828', sail: '#c9ced3' },
};

export function createWindmill(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(WINDMILL_VARIANTS, o.variant, 'windmill');
  const d = WINDMILL_VARIANTS[variant];
  const root = group(`windmill-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const rotor = new THREE.Group();
  rotor.name = 'sails';
  const frameMat = new THREE.MeshStandardMaterial({ color: M.toColor(d.trim), roughness: 0.6 });
  const sailMat = new THREE.MeshStandardMaterial({ color: M.toColor(o.sailColor ?? d.sail), roughness: 0.9, side: THREE.DoubleSide });
  let hubY;
  let hubZ;
  if (variant === 'windpump') {
    // lattice tower with multi-blade fan
    const H = 10;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(m.metal, new THREE.CylinderGeometry(0.06, 0.06, Math.hypot(H, 1.4), 8), new THREE.Matrix4().compose(new THREE.Vector3(sx * 0.7, H / 2, sz * 0.7), new THREE.Quaternion().setFromEuler(new THREE.Euler(sz * Math.atan2(1.4, H) * -1 * 0.5, 0, sx * Math.atan2(1.4, H) * 0.5)), new THREE.Vector3(1, 1, 1)));
    for (let y = 1.5; y < H; y += 2) B.box(m.metal, 1.6 - y * 0.11, 0.06, 1.6 - y * 0.11, 0, y, 0, 0, 0.01);
    B.box(m.metal, 0.4, 0.4, 0.6, 0, H + 0.1, 0);
    B.add(B.mats.plinth, new THREE.CylinderGeometry(1.6, 1.6, 0.7, 24), new THREE.Matrix4().makeTranslation(2.4, 0.35, 0));
    // tail vane
    B.box(m.metal, 0.06, 0.06, 2.4, 0, H + 0.1, -1.4);
    B.box(new THREE.MeshStandardMaterial({ color: M.toColor(d.trim), roughness: 0.6, side: THREE.DoubleSide }), 0.03, 1.0, 1.4, 0, H + 0.3, -2.6);
    hubY = H + 0.1;
    hubZ = 0.5;
    for (let k = 0; k < 18; k++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.4, 0.02).translate(0, 0.95, 0), sailMat);
      blade.rotation.set(0, 0.35, (k / 18) * Math.PI * 2);
      blade.rotation.order = 'ZYX';
      rotor.add(blade);
    }
    rotor.add(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.03, 6, 36), frameMat));
    rotor.add(new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 24), frameMat));
  } else {
    // tapered octagonal tower with a stage gallery and boat-shaped cap
    const H = 11;
    const r0 = 3.2;
    const r1 = 2.0;
    B.add(B.mats.plinth, new THREE.CylinderGeometry(r0 + 0.1, r0 + 0.15, 0.8, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(0, 0.4, 0));
    const tower = new THREE.CylinderGeometry(r1, r0, H, 8).rotateY(Math.PI / 8);
    B.add(B.mats.wall, tower, new THREE.Matrix4().makeTranslation(0, 0.8 + H / 2, 0));
    const ap = (y) => (r0 + (r1 - r0) * (y / H)) * Math.cos(Math.PI / 8);
    B.local(0, 0, ap(1.5) - 0.02, 0, () => door(B, 0, 0.8, 1.1, 2.2, { frame: m.trim, name: 'mill_door' }));
    for (const [y, a] of [[4.5, Math.PI / 4], [7.5, -Math.PI / 4], [7, Math.PI]]) {
      const r = ap(y);
      B.local(Math.sin(a) * r, 0, Math.cos(a) * r, a, () => windowUnit(B, 0, y, 0.6, 0.9, { style: 'cross', frame: m.trim }));
    }
    // stage
    const sy = 4;
    const sr = ap(sy) + 1.4;
    B.add(surface('plank', '#7a5a3c', { name: 'deck' }), new THREE.CylinderGeometry(sr, sr, 0.15, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(0, sy, 0));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8 + Math.PI / 8;
      B.add(m.trim, new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), new THREE.Matrix4().makeTranslation(Math.sin(a) * (sr - 0.1), sy + 0.5, Math.cos(a) * (sr - 0.1)));
    }
    B.add(m.trim, new THREE.TorusGeometry((sr - 0.1) * 1.0, 0.04, 6, 8).rotateX(Math.PI / 2).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(0, sy + 1.0, 0));
    // cap
    const capY = 0.8 + H;
    B.add(m.roof, new THREE.SphereGeometry(r1 + 0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.9, 1.25), new THREE.Matrix4().makeTranslation(0, capY, 0));
    B.add(m.trim, new THREE.CylinderGeometry(r1 + 0.4, r1 + 0.4, 0.25, 24).scale(1, 1, 1.25), new THREE.Matrix4().makeTranslation(0, capY, 0));
    hubY = capY + 0.9;
    hubZ = (r1 + 0.35) * 1.25 + 0.15;
    B.add(B.mats.dark, new THREE.CylinderGeometry(0.22, 0.25, 1.0, 12).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, hubY, hubZ - 0.4));
    // four lattice sails
    const L = 7.5;
    for (let k = 0; k < 4; k++) {
      const arm = new THREE.Group();
      arm.rotation.z = (k / 4) * Math.PI * 2 + Math.PI / 4;
      arm.add(new THREE.Mesh(roundedBox(0.22, L, 0.2, 0.04, 1).translate(0, L / 2, 0), frameMat));
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, L - 1.4).translate(0.85, L / 2 + 0.6, 0), sailMat);
      arm.add(panel);
      for (let j = 0; j < 9; j++) arm.add(new THREE.Mesh(roundedBox(1.7, 0.06, 0.06, 0.02, 1).translate(0.85, 1.3 + (j * (L - 1.6)) / 8, 0.05), frameMat));
      arm.add(new THREE.Mesh(roundedBox(0.06, L - 1.2, 0.06, 0.02, 1).translate(1.7, L / 2 + 0.6, 0.05), frameMat));
      rotor.add(arm);
    }
    rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), B.mats.dark));
  }
  B.finish();
  rotor.position.set(0, hubY, hubZ);
  rotor.rotation.x = variant === 'windpump' ? 0 : -0.12;
  root.add(rotor);
  const animations = buildingAnimations(root, B);
  animations.push(clip('spin', variant === 'windpump' ? 2 : 8, [spinTrack(rotor, 'z', variant === 'windpump' ? 2 : 8, -1)]));
  finalize(root, { type: 'windmill', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}

export const TENT_VARIANTS = {
  dome: { color: '#e07a1f', accent: '#3a3d42' },
  'a-frame': { color: '#2e6b3a', accent: '#5a4a3a' },
  circus: { color: '#c62828', accent: '#f4f1ea' },
};

export function createTent(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TENT_VARIANTS, o.variant, 'tent');
  const d = TENT_VARIANTS[variant];
  const root = group(`tent-${variant}`);
  const fabric = new THREE.MeshPhysicalMaterial({ name: 'fabric', color: M.toColor(o.color ?? d.color), roughness: 0.85, sheen: 0.6, side: THREE.DoubleSide });
  const accent = new THREE.MeshStandardMaterial({ name: 'accent', color: M.toColor(o.accentColor ?? d.accent), roughness: 0.8, side: THREE.DoubleSide });
  const m = palette(o, { wall: d.color, roof: d.color });
  const B = new Builder(root, m);
  const flap = new THREE.Group();
  flap.name = 'flap';
  const anims = [];
  if (variant === 'dome') {
    const R = 1.4;
    const dome = new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.15, 0.85, 1);
    B.add(fabric, dome);
    B.add(accent, new THREE.CylinderGeometry(R * 1.15, R * 1.15, 0.12, 32, 1, true).scale(1, 1, 1 / 1.15), new THREE.Matrix4().makeTranslation(0, 0.06, 0));
    // crossing poles
    for (const a of [Math.PI / 4, -Math.PI / 4]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = (i / 16) * Math.PI;
        pts.push([Math.cos(t) * R * 1.16 * Math.cos(a), Math.sin(t) * R * 0.86, Math.cos(t) * R * 1.01 * Math.sin(a)]);
      }
      B.add(B.mats.dark, curveTube(pts, 0.015, B.mats.dark, { segments: 32 }).geometry);
    }
    // door panel (flap) on the front
    // door panel follows the dome surface; hinged at its bottom edge
    const doorGeo = new THREE.SphereGeometry(R * 1.006, 20, 10, Math.PI / 2 - 0.36, 0.72, Math.PI / 2 - 0.62, 0.62).scale(1.15, 0.85, 1);
    doorGeo.translate(0, 0, -R * 1.006);
    flap.add(new THREE.Mesh(doorGeo, accent));
    flap.position.set(0, 0, R * 1.006);
    for (const th of [0.6, Math.PI - 0.6, Math.PI + 0.6, -0.6]) {
      const ph = 0.55;
      const sx = R * 1.15 * Math.cos(ph) * Math.cos(th);
      const sy = R * 0.85 * Math.sin(ph);
      const sz = R * Math.cos(ph) * Math.sin(th);
      const kx = sx * 1.7;
      const kz = sz * 1.7;
      B.add(accent, curveTube([[sx, sy, sz], [kx, 0.03, kz]], 0.006, accent).geometry);
      B.cyl(B.mats.metal, 0.012, 0.012, 0.15, kx, 0.07, kz, 6);
    }
  } else if (variant === 'a-frame') {
    const L = 2.6;
    const half = 1.0;
    const hgt = 1.3;
    B.slab(fabric, -half, 0.02, 0, hgt, L, 0.02);
    B.slab(fabric, 0, hgt, half, 0.02, L, 0.02);
    B.prism(accent, [[-half, 0.02], [half, 0.02], [0, hgt]], -L / 2, -L / 2 + 0.02);
    for (const x of [-L / 2 - 0.05, L / 2 + 0.05]) B.cyl(B.mats.dark, 0.02, 0.02, hgt + 0.1, x, (hgt + 0.1) / 2, 0, 8);
    B.add(B.mats.dark, new THREE.CylinderGeometry(0.015, 0.015, L + 0.2, 6).rotateZ(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, hgt + 0.03, 0));
    for (const x of [-L / 2 - 0.05, L / 2 + 0.05]) B.add(accent, curveTube([[x, hgt + 0.08, 0], [x + Math.sign(x) * 1.0, 0.02, 0]], 0.006, accent).geometry);
    // door flaps on the +X end (rotate so the open end faces +Z)
    const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, hgt)]);
    const flapMesh = new THREE.Mesh(new THREE.ShapeGeometry(tri), accent);
    flap.add(flapMesh);
    flap.position.set(L / 2, 0.02, 0);
    flap.rotation.y = Math.PI / 2;
    root.rotation.y = 0;
  } else {
    // circus big top: striped wall + striped cone + flag
    const R = 6;
    const wallH = 3;
    const stripes = 24;
    for (let i = 0; i < stripes; i++) {
      const g = new THREE.CylinderGeometry(R, R, wallH, 4, 1, true, (i / stripes) * Math.PI * 2, (Math.PI * 2) / stripes);
      B.add(i % 2 ? accent : fabric, g, new THREE.Matrix4().makeTranslation(0, wallH / 2, 0));
      const c = new THREE.ConeGeometry(R + 0.4, 4.5, 4, 1, true, (i / stripes) * Math.PI * 2, (Math.PI * 2) / stripes);
      B.add(i % 2 ? accent : fabric, c, new THREE.Matrix4().makeTranslation(0, wallH + 2.25, 0));
    }
    // scalloped valance
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      B.add(i % 2 ? fabric : accent, new THREE.CircleGeometry(0.42, 12, Math.PI, Math.PI).rotateY(-a + Math.PI / 2), new THREE.Matrix4().makeTranslation(Math.sin(a) * (R + 0.41), wallH + 0.02, Math.cos(a) * (R + 0.41)));
    }
    B.cyl(M.metal('#c9a54a', 0.3), 0.06, 0.08, 2.4, 0, wallH + 4.5 + 1.0, 0, 8);
    flap.position.set(0, wallH + 4.5 + 1.9, 0);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.55).translate(0.5, 0, 0), new THREE.MeshStandardMaterial({ color: '#f2c200', side: THREE.DoubleSide }));
    flap.add(flag);
    // entrance
    B.local(0, 0, R, 0, () => {
      B.box(accent, 2.6, 2.6, 0.04, 0, 1.3, 0.03);
      B.add(B.mats.dark, new THREE.PlaneGeometry(2.0, 2.3), new THREE.Matrix4().makeTranslation(0, 1.15, 0.06));
    });
  }
  B.finish();
  root.add(flap);
  anims.push(variant === 'circus'
    ? clip('flag', 1.6, [rotateTrack(flap, 'y', 1.6, (t) => wave(t) * 0.4)])
    : clip('flap', 3, [rotateTrack(flap, variant === 'dome' ? 'x' : 'y', 3, (t) => (0.5 - 0.5 * Math.cos(t * Math.PI * 2)) * (variant === 'dome' ? -0.9 : -1.2))]));
  finalize(root, { type: 'tent', variant, options: o, animations: anims });
  return root;
}
