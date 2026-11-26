import * as THREE from 'three';
import { group, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, numberTrack, scaleTrack, clip } from '../../core/animation.js';
import {
  Builder, palette, surface, block, facades, spread, windowUnit, door, gableRoof, flatRoof,
  chimney, porch, railingRun, acUnit, wallFaces, hipRoof,
} from './kit.js';

/*
 * Houses. Every variant is composed from the kit: plinth + walls, framed
 * windows with sills (glowing interiors at night), doors with casings and
 * steps, roofs with fascia, gutters and downpipes, porches, chimneys.
 */

export const HOUSE_VARIANTS = {
  cottage: { wall: '#efe6d2', wallKind: 'stucco', roof: '#7a3b2e', roofKind: 'tile', trim: '#ffffff', accent: '#3f6b4a', door: '#3f6b4a' },
  suburban: { wall: '#b9c6cf', wallKind: 'siding', roof: '#4a4d52', roofKind: 'shingle', trim: '#ffffff', accent: '#2c3e50', door: '#8b1e1e' },
  modern: { wall: '#f1f0ec', wallKind: 'stucco', roof: '#8a8a8a', roofKind: 'concrete', trim: '#2a2b2d', accent: '#6b4a32', door: '#3b2a1e' },
  farmhouse: { wall: '#f4f3ef', wallKind: 'vboard', roof: '#3d4247', roofKind: 'seam', trim: '#1e1f21', accent: '#1e1f21', door: '#1e1f21' },
  bungalow: { wall: '#8f9c86', wallKind: 'siding', roof: '#5a4a3f', roofKind: 'shingle', trim: '#f2ead8', accent: '#7a3b2e', door: '#7a3b2e', plinthKind: 'stone', plinth: '#9a9286' },
  victorian: { wall: '#7d5a7a', wallKind: 'siding', roof: '#3e3a44', roofKind: 'shingle', trim: '#f3e9d2', accent: '#2f6f6a', door: '#2f6f6a' },
  cabin: { wall: '#9a6236', wallKind: 'log', roof: '#3f5a3c', roofKind: 'seam', trim: '#5a3a20', accent: '#5a3a20', door: '#5a3a20', plinthKind: 'stone', plinth: '#8f8a80' },
  townhouse: { wall: '#9c4a36', wallKind: 'brick', roof: '#3a3a3a', roofKind: 'concrete', trim: '#efe9dd', accent: '#1f2f3f', door: '#1f2f3f' },
  mansion: { wall: '#d9cdb6', wallKind: 'stone', roof: '#3b3f45', roofKind: 'tile', trim: '#f6f2ea', accent: '#2b2b2b', door: '#3a2a1e' },
  duplex: { wall: '#c9b79a', wallKind: 'siding', roof: '#4a4d52', roofKind: 'shingle', trim: '#ffffff', accent: '#5a3a2a', door: '#5a3a2a' },
  ranch: { wall: '#d6c6a8', wallKind: 'stucco', roof: '#5a4a3f', roofKind: 'shingle', trim: '#f2ead8', accent: '#6b4a32', door: '#6b4a32', plinthKind: 'brick', plinth: '#8e4636' },
  'a-frame': { wall: '#a87a4c', wallKind: 'vboard', roof: '#2e3135', roofKind: 'seam', trim: '#3a2a1e', accent: '#3a2a1e', door: '#3a2a1e', plinthKind: 'stone', plinth: '#8f8a80' },
  villa: { wall: '#f4ece0', wallKind: 'stucco', roof: '#b5562f', roofKind: 'tile', trim: '#f4ece0', accent: '#2f6f9f', door: '#6b4226', plinthKind: 'stone', plinth: '#c2b49c' },
  'beach-house': { wall: '#bfd8e0', wallKind: 'siding', roof: '#e9e6df', roofKind: 'seam', trim: '#ffffff', accent: '#2f6f9f', door: '#2f6f9f' },
  'mobile-home': { wall: '#e8e4da', wallKind: 'siding', roof: '#bfc3c7', roofKind: 'seam', trim: '#6b8a9a', accent: '#6b8a9a', door: '#6b8a9a' },
  'tiny-house': { wall: '#4f6b5a', wallKind: 'vboard', roof: '#2e3135', roofKind: 'seam', trim: '#e9e3d6', accent: '#c9a54a', door: '#c9a54a' },
};

const FH = 2.8; // floor height
const FL = 0.45; // ground floor level (top of plinth)

/** Ground + upper floor windows on a facade, skipping a door gap. */
function rowWindows(B, width, { floors = 1, y0 = FL, per = 2, w = 1.0, h = 1.4, gap = null, margin = 1.2, style, shutters, header, frame, startFloor = 0 } = {}) {
  for (let f = startFloor; f < floors; f++) {
    for (const x of spread(width, per, margin)) {
      if (gap && f === 0 && Math.abs(x - gap[0]) < gap[1]) continue;
      windowUnit(B, x, y0 + f * FH + 0.9, w, h, { style, shutters, header, frame });
    }
  }
}

function gableWindow(B, y, w = 0.7, h = 0.8, opts) {
  windowUnit(B, 0, y, w, h, opts);
}

const BUILDERS = {
  cottage(B, o, d, m) {
    const w = 8;
    const dp = 6.5;
    const h = FL + 2.7;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 0, FL, 0.95, 2.1, { steps: 2, canopy: m.roof });
        for (const x of [-2.4, 2.4]) windowUnit(B, x, FL + 0.85, 1.1, 1.3, { style: 'cross', shutters: m.accent });
      } else if (side === 'back') rowWindows(B, width, { per: 3, style: 'cross' });
      else {
        windowUnit(B, 0, FL + 0.9, 0.9, 1.2, { style: 'cross' });
        gableWindow(B, h + 0.6, 0.6, 0.8, { style: 'cross' });
      }
    });
    gableRoof(B, w, dp, h, { pitch: 0.95, overhang: 0.35 });
    chimney(B, 2.6, -0.9, h, 3.3, { mat: surface('stone', '#a29a8e', { name: 'stone' }) });
    // flower boxes
    for (const x of [-2.4, 2.4]) {
      B.box(m.accent, 1.3, 0.18, 0.22, x, FL + 0.6, dp / 2 + 0.14);
      for (let k = -2; k <= 2; k++) B.geo(surface('stucco', ['#d64550', '#f2c14e', '#e86a92'][(k + 3) % 3], { name: 'flowers' }), new THREE.IcosahedronGeometry(0.1, 0), x + k * 0.24, FL + 0.74, dp / 2 + 0.14);
    }
  },

  suburban(B, o, d, m) {
    const w = 10;
    const dp = 8;
    const h = FL + FH * 2;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, -1.2, FL, 1.0, 2.15, {});
        windowUnit(B, -3.6, FL + 0.9, 1.2, 1.4, { shutters: m.accent });
        windowUnit(B, 1.8, FL + 0.9, 2.2, 1.4, { style: 'tall' });
        for (const x of [-3.6, -1.2, 1.8, 3.6]) windowUnit(B, x, FL + FH + 0.9, 1.0, 1.3, { shutters: m.accent });
        porch(B, 3.4, 1.9, { y: FL, height: 2.55, posts: 2, railing: false, x: -1.2 });
      } else {
        rowWindows(B, width, { floors: 2, per: side === 'back' ? 4 : 2, margin: 1.4, startFloor: side === 'right' ? 1 : 0 });
        if (side === 'left' || side === 'right') gableWindow(B, h + 0.5, 0.8, 0.6, { style: 'none' });
      }
    });
    gableRoof(B, w, dp, h, { pitch: 0.55, overhang: 0.4 });
    // attached garage on the right, fronts aligned
    const gw = 4.2;
    const gd = 6.6;
    const gcx = w / 2 + gw / 2;
    const gcz = (dp - gd) / 2;
    block(B, gw, 3.0, gd, { cx: gcx, cz: gcz });
    B.local(gcx, 0, gcz + gd / 2, 0, () => {
      B.box(m.trim, 3.2, 0.12, 0.1, 0, 2.43, 0.05);
      for (const s of [-1, 1]) B.box(m.trim, 0.12, 2.3, 0.1, s * 1.6, 1.15, 0.05);
      const gdoor = new THREE.Group();
      gdoor.name = 'garage_door';
      for (let k = 0; k < 4; k++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(3.06, 0.56, 0.05), m.trim);
        panel.position.set(0, -0.29 - k * 0.575, 0);
        gdoor.add(panel);
        for (let c = -3; c <= 3; c++) {
          const inset = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.02), m.trim);
          inset.position.set(c * 0.42, -0.29 - k * 0.575, 0.03);
          gdoor.add(inset);
        }
      }
      B.attach(gdoor, 0, 2.37, 0.03);
      B.add(m.dark, new THREE.PlaneGeometry(3.1, 2.3), new THREE.Matrix4().makeTranslation(0, 1.15, 0.004));
    });
    gableRoof(B, gd, gw, 3.0, { pitch: 0.5, overhang: 0.3, ridgeAlong: 'z', cx: gcx, cz: gcz });
    B.box(B.mats.concrete, 3.4, 0.06, 4, gcx, 0.03, gcz + gd / 2 + 2);
    chimney(B, -w / 2 - 0.36, 1.2, 0, h + 2.4, {});
    acUnit(B, -w / 2 - 0.8, 0, -2.2, -Math.PI / 2);
  },

  modern(B, o, d, m) {
    const w = 12;
    const dp = 8;
    const h1 = 3.4;
    const wood = surface('vboard', o.accentColor ?? '#6b4a32', { name: 'cladding', roughness: 0.7 });
    block(B, w, h1, dp, { plinth: 0.2 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, -4.2, 0.2, 1.2, 2.5, { frame: m.dark });
        for (const x of [-1.2, 1.6, 4.4]) windowUnit(B, x, 0.35, 2.6, 2.6, { style: 'none', sill: false, frame: m.dark });
        B.slab(m.dark, 0, h1 + 0.15, 2.2, h1 + 0.15, 3.6, 0.14, -4.2);
      } else if (side === 'back') {
        windowUnit(B, 0, 0.35, 6, 2.6, { style: 'tall', sill: false, frame: m.dark });
      } else windowUnit(B, 0, 0.9, 2.0, 1.2, { style: 'none', sill: false, frame: m.dark });
    });
    flatRoof(B, w, dp, h1, { parapet: 0.3, cap: m.dark });
    // upper volume, inset from every edge so the parapet never runs into it
    const uw = 7;
    const ud = 6;
    const ucx = -2;
    const ucz = -0.6;
    block(B, uw, 3.1, ud, { cx: ucx, cz: ucz, y0: h1 + 0.06, mat: wood, plinth: 0 });
    facades(B, uw, ud, (side) => {
      if (side === 'front') windowUnit(B, 0, h1 + 0.4, 5.6, 2.3, { style: 'tall', sill: false, frame: m.dark });
      else if (side === 'right') windowUnit(B, 0, h1 + 0.4, 2.4, 2.3, { style: 'none', sill: false, frame: m.dark });
      else windowUnit(B, 0, h1 + 1.2, 1.6, 0.8, { style: 'none', sill: false, frame: m.dark });
    }, { cx: ucx, cz: ucz });
    flatRoof(B, uw + 0.6, ud + 0.6, h1 + 3.16, { parapet: 0, cx: ucx, cz: ucz, roofMat: m.dark });
    B.box(m.dark, uw + 0.6, 0.22, ud + 0.6, ucx, h1 + 3.27, ucz);
    // terrace glass railing on the lower roof (front edge, in front of the upper volume)
    B.local(0, 0, dp / 2 - 0.35, 0, () => railingRun(B, -w / 2 + 0.4, w / 2 - 0.4, 0, h1 + 0.3, m.dark, { glassPanel: true, height: 0.8 }));
    acUnit(B, 3.5, h1 + 0.06, -2.5, 0);
  },

  farmhouse(B, o, d, m) {
    const w = 11;
    const dp = 8;
    const h = FL + FH * 2;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 0, FL, 1.05, 2.2, { frame: m.trim });
        for (const x of [-3.4, -1.8, 1.8, 3.4]) windowUnit(B, x, FL + 0.8, 0.95, 1.6, { style: 'grid', frame: m.trim, sill: false });
        for (const x of [-3.4, 0, 3.4]) windowUnit(B, x, FL + FH + 0.8, 0.95, 1.5, { style: 'grid', frame: m.trim, sill: false });
        porch(B, w, 2.6, { y: FL, height: 2.6, posts: 6, postMat: surface('vboard', '#f4f3ef', { name: 'posts' }) });
      } else rowWindows(B, width, { floors: 2, per: side === 'back' ? 4 : 2, style: 'grid', frame: m.trim, w: 0.95, h: 1.5 });
    });
    gableRoof(B, w, dp, h, { pitch: 0.75, overhang: 0.35, fascia: B.mats.wall });
    // centre cross gable
    gableRoof(B, dp / 2, 3.6, h, { pitch: 0.95, overhang: 0.25, ridgeAlong: 'z', cz: dp / 4, fascia: B.mats.wall, gutter: false });
    B.local(0, 0, dp / 2, 0, () => windowUnit(B, 0, h + 0.4, 0.8, 0.9, { style: 'arch', frame: m.trim, sill: false }));
    chimney(B, -3.8, -1.2, h, 3.6, {});
  },

  bungalow(B, o, d, m) {
    const w = 11;
    const dp = 10;
    const h = FL + 3.0;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 1.4, FL, 1.0, 2.15, { frame: m.trim });
        windowUnit(B, -2.4, FL + 0.8, 2.6, 1.5, { style: 'tall', frame: m.trim });
        windowUnit(B, 3.8, FL + 0.8, 1.1, 1.5, { style: 'double', frame: m.trim });
        // deep porch on stone piers with tapered columns
        const pd = 2.8;
        B.box(surface('plank', '#8a6b4e', { name: 'deck' }), w, 0.12, pd, 0, FL - 0.06, pd / 2);
        B.box(B.mats.plinth, w, FL - 0.12, pd - 0.1, 0, (FL - 0.12) / 2, pd / 2 - 0.05);
        for (const x of [-w / 2 + 0.4, -1.6, 1.4 + 1.6, w / 2 - 0.4]) {
          B.box(B.mats.plinth, 0.6, 1.0, 0.6, x, FL + 0.5, pd - 0.35);
          B.geo(m.trim, new THREE.CylinderGeometry(0.16, 0.25, 1.6, 4, 1).rotateY(Math.PI / 4), x, FL + 1.8, pd - 0.35);
        }
        B.box(m.trim, w, 0.3, 0.3, 0, FL + 2.75, pd - 0.35);
        for (let s = 0; s < 3; s++) B.box(B.mats.plinth, 1.8, FL / 3, 0.3 * (3 - s), 1.4, (FL / 3) * (s + 0.5), pd + 0.15 * (3 - s));
      } else rowWindows(B, width, { per: side === 'back' ? 4 : 3, frame: m.trim });
    });
    // main roof extends over the porch (front overhang = porch depth)
    gableRoof(B, w, dp + 2.8, h, { pitch: 0.45, overhang: 0.5, cz: 1.4 });
    // shed dormer on the front slope
    const run = (dp + 2.8) / 2;
    const dz = 1.4 + run * 0.35;
    const dy = h + (run - run * 0.35 + 0) * 0.45 - 0.1;
    B.box(B.mats.wall, 3.2, 1.3, 1.6, 0, dy + 0.35, dz - 0.6);
    B.local(0, 0, dz + 0.2, 0, () => windowUnit(B, 0, dy + 0.1, 2.4, 0.75, { style: 'cross', frame: m.trim, sill: false }));
    B.slab(B.mats.roof, -0.8 + dz - 1.6, dy + 1.25, dz + 0.45, dy + 0.95, 3.6, 0.1);
    chimney(B, -w / 2 - 0.36, -1.5, 0, h + 2.6, {});
  },

  victorian(B, o, d, m) {
    const w = 9;
    const dp = 9;
    const h = FL + FH * 2 + 0.4;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 1.0, FL, 1.0, 2.3, { frame: m.trim, mat: m.accent });
        windowUnit(B, 3.1, FL + 0.8, 0.9, 1.8, { style: 'double', frame: m.trim, header: m.trim });
        for (const x of [1.0, 3.1]) windowUnit(B, x, FL + FH + 0.9, 0.85, 1.7, { style: 'double', frame: m.trim, header: m.trim });
        porch(B, 6.2, 2.2, { y: FL, height: 2.7, posts: 4, turned: true, x: 1.2 });
      } else rowWindows(B, width, { floors: 2, per: 2, w: 0.85, h: 1.7, frame: m.trim, header: m.trim, margin: 1.8 });
      if (side === 'left' || side === 'right') gableWindow(B, h + 0.8, 0.7, 1.0, { style: 'arch', frame: m.trim });
    });
    gableRoof(B, w, dp, h, { pitch: 1.1, overhang: 0.3 });
    // octagonal turret at the front-left corner
    const tx = -w / 2 + 0.4;
    const tz = dp / 2 - 0.4;
    const tr = 1.5;
    const th = h + 2.4;
    const ap = tr * Math.cos(Math.PI / 8);
    B.add(B.mats.wall, new THREE.CylinderGeometry(tr, tr, th, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(tx, th / 2, tz));
    B.add(B.mats.plinth, new THREE.CylinderGeometry(tr + 0.05, tr + 0.05, FL, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(tx, FL / 2, tz));
    B.add(m.trim, new THREE.CylinderGeometry(tr + 0.12, tr + 0.12, 0.2, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(tx, th + 0.1, tz));
    B.add(B.mats.roof, new THREE.ConeGeometry(tr + 0.3, 3.6, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(tx, th + 0.2 + 1.8, tz));
    B.cyl(B.mats.metal, 0.02, 0.05, 0.8, tx, th + 0.2 + 3.6 + 0.3, tz, 8);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8 + Math.PI / 8;
      const ang = Math.atan2(Math.cos(a), Math.sin(a));
      // only the faces outside the main block
      const fx = Math.sin(a);
      const fz = Math.cos(a);
      if (fx > 0.5 || fz < -0.5) continue;
      B.local(tx + fx * ap, 0, tz + fz * ap, Math.atan2(fx, fz), () => {
        for (const f of [0, 1]) windowUnit(B, 0, FL + 0.9 + f * FH, 0.5, 1.5, { style: 'double', frame: m.trim, sill: true });
        windowUnit(B, 0, th - 1.4, 0.4, 0.8, { style: 'none', frame: m.trim, sill: false });
      });
      void ang;
    }
    chimney(B, 2.4, -1.4, h, 4.6, {});
  },

  cabin(B, o, d, m) {
    const w = 8;
    const dp = 7;
    const h = FL + 2.8;
    block(B, w, h, dp, { plinth: FL });
    // crossing log ends at the corners
    const logEnd = surface('log', '#7a4a26', { name: 'logs' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let y = FL + 0.1; y < h; y += 0.2) {
      B.add(logEnd, new THREE.CylinderGeometry(0.1, 0.1, 0.5, 10).rotateZ(Math.PI / 2), new THREE.Matrix4().makeTranslation(sx * (w / 2 + 0.1), y, sz * (dp / 2 - 0.1)));
    }
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 0, FL, 0.95, 2.05, { frame: m.trim });
        for (const x of [-2.3, 2.3]) windowUnit(B, x, FL + 0.9, 1.0, 1.1, { style: 'cross', frame: m.trim });
        porch(B, w, 2.2, { y: FL, height: 2.4, posts: 4, postMat: logEnd });
      } else {
        rowWindows(B, width, { per: side === 'back' ? 2 : 1, style: 'cross', frame: m.trim, w: 0.9, h: 1.0 });
        if (side === 'left' || side === 'right') gableWindow(B, h + 0.7, 0.8, 0.8, { style: 'cross', frame: m.trim });
      }
    });
    gableRoof(B, w, dp, h, { pitch: 0.9, overhang: 0.55, gableMat: logEnd, fascia: m.trim, gutter: false });
    chimney(B, w / 2 + 0.42, -1.2, 0, h + 3.2, { mat: surface('stone', '#8f8a80', { name: 'stone' }) });
  },

  townhouse(B, o, d, m) {
    const unitW = 5.4;
    const dp = 10;
    const h = FH * 3 + 1.2;
    const r = rng(o.seed ?? 4);
    const colors = ['#9c4a36', '#7c3b2c', '#b5654a', '#6e5747', '#a0533d'];
    B.box(B.mats.plinth, unitW * 3 + 0.08, 1.2, dp + 0.08, 0, 0.6, 0);
    wallFaces(B, unitW * 3, dp, { h, plinth: 1.2 });
    for (let u = 0; u < 3; u++) {
      const cx = (u - 1) * unitW;
      const wallMat = B.style.design?.wallKind ? m.wall : surface('brick', o.color ?? colors[Math.floor(r() * colors.length)], { name: `brick${u}` });
      B.box(wallMat, unitW, h - 1.2, dp, cx, 1.2 + (h - 1.2) / 2, 0);
      B.local(cx, 0, dp / 2, 0, () => {
        door(B, -1.3, 1.2, 1.05, 2.4, { frame: m.trim, mat: [m.accent, B.mats.door, m.accent][u] });
        B.box(m.trim, 1.6, 0.45, 0.25, -1.3, 1.2 + 2.4 + 0.35, 0.12);
        // stoop
        for (let s = 0; s < 5; s++) B.box(B.mats.concrete, 1.6, 0.24, 0.3 * (5 - s), -1.3, 0.12 + s * 0.24, 0.15 * (5 - s));
        windowUnit(B, 1.2, 1.2 + 0.7, 1.1, 1.9, { header: m.trim, frame: m.trim });
        for (let f = 1; f < 3; f++) for (const x of [-1.3, 1.2]) windowUnit(B, x, 1.2 + f * FH + 0.6, 1.0, 1.8, { header: m.trim, frame: m.trim });
      });
      B.local(cx, 0, -dp / 2, Math.PI, () => {
        for (let f = 0; f < 3; f++) for (const x of [-1.3, 1.2]) windowUnit(B, x, 1.2 + f * FH + 0.6, 1.0, 1.6, { frame: m.trim });
      });
    }
    // cornice + flat roof
    const totalW = unitW * 3;
    B.box(m.trim, totalW + 0.3, 0.45, 0.4, 0, h + 0.1, dp / 2 + 0.1);
    for (let k = 0; k < 30; k++) B.box(m.trim, 0.12, 0.18, 0.2, -totalW / 2 + 0.25 + (k * (totalW - 0.5)) / 29, h - 0.2, dp / 2 + 0.1);
    flatRoof(B, totalW, dp, h, { parapet: 0.5, mat: B.mats.plinth });
    for (const sx of [-1, 1]) B.box(B.mats.plinth, 0.3, 1.0, dp, sx * (totalW / 2 - 0.15), h + 0.5, 0);
    acUnit(B, -3, h + 0.06, -2, 0);
    acUnit(B, 4, h + 0.06, -3, 0);
  },

  mansion(B, o, d, m) {
    const w = 15;
    const dp = 11;
    const fh = 3.5;
    const h = FL + fh * 2;
    block(B, w, h, dp, { plinth: FL + 0.2 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 0, FL + 0.2, 1.8, 2.8, { frame: m.trim, double: true, mat: B.mats.door, steps: 0 });
        for (const x of [-5.6, -3.2, 3.2, 5.6]) windowUnit(B, x, FL + 0.9, 1.2, 2.0, { style: 'grid', frame: m.trim, header: m.trim });
        for (const x of [-5.6, -3.2, 0, 3.2, 5.6]) windowUnit(B, x, FL + fh + 0.8, 1.2, 1.9, { style: 'grid', frame: m.trim, header: m.trim });
      } else rowWindows(B, width, { floors: 2, per: side === 'back' ? 5 : 3, w: 1.2, h: 1.9, style: 'grid', frame: m.trim, header: m.trim, margin: 1.6 });
    }, {});
    // portico: four columns, entablature and pediment
    const pw = 6.4;
    const pd = 3.0;
    B.local(0, 0, dp / 2, 0, () => {
      for (let s = 0; s < 4; s++) B.box(B.mats.plinth, pw + 1.2 - s * 0.2, (FL + 0.2) / 4, pd + 1.0 - s * 0.3, 0, ((FL + 0.2) / 4) * (s + 0.5), (pd + 1.0 - s * 0.3) / 2);
      const colH = fh * 2 - 0.6;
      for (const x of spread(pw, 4, 0.3)) {
        const col = new THREE.LatheGeometry([[0.36, 0], [0.36, 0.12], [0.28, 0.2], [0.27, colH * 0.3], [0.23, colH - 0.25], [0.3, colH - 0.15], [0.38, colH - 0.05], [0.38, colH]].map(([rr, yy]) => new THREE.Vector2(rr, yy)), 20);
        B.geo(m.trim, col, x, FL + 0.2, pd - 0.4);
      }
      const ey = FL + 0.2 + colH;
      B.box(m.trim, pw + 0.6, 0.6, pd + 0.2, 0, ey + 0.3, (pd + 0.2) / 2);
      B.local(0, 0, 0, -Math.PI / 2, () => B.prism(m.trim, [[-(pw + 0.6) / 2, ey + 0.6], [(pw + 0.6) / 2, ey + 0.6], [0, ey + 1.9]], 0, pd + 0.2));
    });
    gableRoof(B, w, dp, h, { pitch: 0.42, overhang: 0.45, fascia: m.trim });
    chimney(B, -4.5, 0, h, 3.0, { mat: surface('brick', '#8e4b38', { name: 'brick' }) });
    chimney(B, 4.5, 0, h, 3.0, { mat: surface('brick', '#8e4b38', { name: 'brick' }) });
    // single-storey wings with balustrade
    for (const s of [-1, 1]) {
      const ww = 5;
      const wd = 8;
      const wcx = s * (w / 2 + ww / 2);
      block(B, ww, FL + fh, wd, { cx: wcx, cz: -0.5, plinth: FL + 0.2 });
      facades(B, ww, wd, (side, width) => {
        if (side === (s > 0 ? 'left' : 'right')) return;
        rowWindows(B, width, { per: side === 'front' || side === 'back' ? 2 : 3, w: 1.2, h: 2.0, style: 'grid', frame: m.trim, header: m.trim, margin: 1.2 });
      }, { cx: wcx, cz: -0.5 });
      flatRoof(B, ww, wd, FL + fh, { parapet: 0.25, mat: m.trim });
      B.local(wcx, 0, -0.5 + wd / 2 - 0.12, 0, () => railingRun(B, -ww / 2 + 0.2, ww / 2 - 0.2, 0, FL + fh + 0.25, m.trim, { height: 0.7, spacing: 0.3 }));
    }
  },
};

Object.assign(BUILDERS, {
  duplex(B, o, d, m) {
    // two mirrored units under one roof, each with its own porch and garage
    const w = 16;
    const dp = 9;
    const h = FL + FH * 2;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        for (const s of [-1, 1]) {
          door(B, s * 1.4, FL, 0.95, 2.15, {});
          windowUnit(B, s * 3.2, FL + 0.9, 1.6, 1.4, { style: 'double', shutters: m.accent });
          for (const x of [s * 1.4, s * 3.6, s * 6.2]) windowUnit(B, x, FL + FH + 0.9, 1.0, 1.3, { shutters: m.accent });
          porch(B, 2.4, 1.6, { y: FL, height: 2.5, posts: 2, railing: false, x: s * 1.4 });
        }
        B.box(m.trim, 0.12, h - FL, 0.08, 0, FL + (h - FL) / 2, 0.04, 0, 0.01);
      } else rowWindows(B, width, { floors: 2, per: side === 'back' ? 6 : 2, margin: 1.4 });
    });
    gableRoof(B, w, dp, h, { pitch: 0.55, overhang: 0.4 });
    for (const s of [-1, 1]) {
      const gx = s * (w / 2 + 2);
      block(B, 4, 3.0, 6, { cx: gx, cz: 1.5 });
      B.local(gx, 0, 4.5, 0, () => {
        const gdoor = new THREE.Group();
        gdoor.name = s < 0 ? 'garage_door' : 'garage_door_b';
        for (let k = 0; k < 4; k++) {
          const panel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.55, 0.05), m.trim);
          panel.position.set(0, -0.28 - k * 0.56, 0);
          gdoor.add(panel);
        }
        B.attach(gdoor, 0, 2.3, 0.03);
        B.add(m.dark, new THREE.PlaneGeometry(2.9, 2.25), new THREE.Matrix4().makeTranslation(0, 1.15, 0.004));
        B.box(m.trim, 3.2, 0.12, 0.1, 0, 2.38, 0.05);
      });
      gableRoof(B, 6, 4, 3.0, { pitch: 0.5, overhang: 0.3, ridgeAlong: 'z', cx: gx, cz: 1.5 });
      B.box(B.mats.concrete, 3.2, 0.06, 4, gx, 0.03, 6.5);
    }
    chimney(B, 0, -1.5, h, 2.6, {});
  },

  ranch(B, o, d, m) {
    // long single storey with low hip-ish gable, picture window, attached carport
    const w = 18;
    const dp = 9;
    const h = FL + 2.8;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, -1.5, FL, 1.0, 2.15, { steps: 2 });
        windowUnit(B, -5.4, FL + 0.7, 3.4, 1.6, { style: 'tall' });
        for (const x of [2.2, 5.0, 7.4]) windowUnit(B, x, FL + 1.0, 1.4, 1.2, { style: 'double', shutters: m.accent });
        B.box(B.mats.plinth, 4.6, 1.0, 0.12, -5.4, FL + 0.2, 0.06, 0, 0.02);
      } else rowWindows(B, width, { per: side === 'back' ? 5 : 2, margin: 1.4, w: 1.3, h: 1.2 });
    });
    gableRoof(B, w, dp, h, { pitch: 0.32, overhang: 0.7 });
    // carport on posts
    const cx = w / 2 + 3;
    for (const z of [-3, 3]) B.box(m.trim, 0.16, h - 0.1, 0.16, cx + 2.4, (h - 0.1) / 2, z, 0, 0.03);
    B.box(m.trim, 0.25, 0.3, 6.4, cx + 2.4, h - 0.1, 0, 0, 0.03);
    B.slab(B.mats.roof, -dp / 2 - 0.3, h + 0.25, dp / 2 + 0.3, h + 0.05, 5.6, 0.1, cx);
    B.box(B.mats.concrete, 5.4, 0.06, 10, cx, 0.03, 1.5);
    chimney(B, -w / 2 + 2, -1.6, h, 2.0, { mat: surface('brick', '#8e4636', { name: 'brick' }) });
  },

  'a-frame'(B, o, d, m) {
    // steep A roof down to a low plinth, glazed gable, wraparound deck
    const w = 7.5;
    const L = 10;
    const H = 8;
    const y0 = 0.9;
    B.box(B.mats.plinth, L + 0.2, y0, w + 0.2, 0, y0 / 2, 0, 0, 0.03);
    B.box(surface('plank', '#8a6b4e', { name: 'deck' }), L + 4, 0.14, w + 3, 1.5, y0 - 0.07, 0, 0, 0.02);
    for (const [x, z] of [[L / 2 + 3.3, w / 2 + 1.3], [L / 2 + 3.3, -w / 2 - 1.3]]) B.box(B.mats.plinth, 0.3, y0 - 0.14, 0.3, x, (y0 - 0.14) / 2, z, 0, 0.03);
    railingRun(B, -L / 2 - 0.5, L / 2 + 3.4, w / 2 + 1.4, y0, m.trim, { spacing: 0.14 });
    // roof slopes (ridge along X)
    B.slab(B.mats.roof, -w / 2 - 0.6, y0 - 0.1 - 0.6 * (H / (w / 2)) * 0.12, 0, y0 + H, L + 1, 0.2);
    B.slab(B.mats.roof, 0, y0 + H, w / 2 + 0.6, y0 - 0.1 - 0.6 * (H / (w / 2)) * 0.12, L + 1, 0.2);
    // gable ends: glazed front (+X) and timber back
    B.prism(B.mats.wall, [[-w / 2, y0], [w / 2, y0], [0, y0 + H]], -L / 2, -L / 2 + 0.25);
    B.prism(B.mats.wall, [[-w / 2, y0], [w / 2, y0], [0, y0 + H]], L / 2 - 0.25, L / 2);
    B.local(L / 2, 0, 0, Math.PI / 2, () => {
      door(B, 0, y0, 1.6, 2.3, { double: true, glass: true, frame: m.trim });
      for (const x of [-2, 2]) windowUnit(B, x, y0 + 0.2, 1.2, 2.4, { style: 'none', frame: m.trim, sill: false });
      windowUnit(B, 0, y0 + 3.2, 3.4, 2.0, { style: 'tall', frame: m.trim, sill: false });
      windowUnit(B, 0, y0 + 5.6, 1.4, 1.2, { style: 'none', frame: m.trim, sill: false });
    });
    chimney(B, -L / 4, w / 6, y0 + H * 0.66, 2.6, { mat: surface('stone', '#8f8a80', { name: 'stone' }) });
  },

  villa(B, o, d, m) {
    // mediterranean villa: two-storey main block, loggia, tower, terrace with pool
    const w = 14;
    const dp = 10;
    const h = FL + FH * 2;
    block(B, w, h, dp);
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 0, FL, 1.4, 2.5, { double: true });
        for (const x of [-4.6, -2.4, 2.4, 4.6]) windowUnit(B, x, FL + 0.6, 1.0, 1.9, { style: 'arch', shutters: m.accent });
        for (const x of [-4.6, -2.4, 0, 2.4, 4.6]) {
          windowUnit(B, x, FL + FH + 0.6, 1.0, 1.7, { style: 'arch', shutters: m.accent });
          railingRun(B, x - 0.65, x + 0.65, 0.35, FL + FH + 0.45, B.mats.dark, { height: 0.75, spacing: 0.1 });
          B.box(m.trim, 1.5, 0.1, 0.45, x, FL + FH + 0.4, 0.22, 0, 0.02);
        }
      } else rowWindows(B, width, { floors: 2, per: side === 'back' ? 4 : 2, style: 'arch', w: 1.0, h: 1.7, margin: 1.6 });
    });
    hipRoof(B, w, dp, h, { pitch: 0.42, overhang: 0.6 });
    // tower
    const tx = -w / 2 + 1.8;
    const tz = -dp / 2 + 1.8;
    block(B, 3.6, h + 3, 3.6, { cx: tx, cz: tz, plinth: 0 });
    facades(B, 3.6, 3.6, (side) => windowUnit(B, 0, h + 0.7, 0.8, 1.4, { style: 'arch' }), { cx: tx, cz: tz });
    hipRoof(B, 3.6, 3.6, h + 3, { pitch: 0.55, overhang: 0.4, cx: tx, cz: tz });
    // single-storey wing with roof terrace
    const wx = w / 2 + 3.5;
    block(B, 7, FL + FH, 8, { cx: wx, cz: 1 });
    B.local(wx, 0, 5, 0, () => {
      for (const x of [-2, 0, 2]) {
        B.add(m.trim, new THREE.CylinderGeometry(0.18, 0.2, 2.4, 12), new THREE.Matrix4().makeTranslation(x, FL + 1.2, 0.6));
      }
      windowUnit(B, 0, FL + 0.2, 5, 2.2, { style: 'tall', sill: false });
      B.box(m.trim, 6.4, 0.3, 1.0, 0, FL + 2.55, 0.5, 0, 0.04);
    });
    flatRoof(B, 7, 8, FL + FH, { parapet: 0.2, cx: wx, cz: 1, mat: m.trim });
    B.local(wx, 0, 5 - 0.12, 0, () => railingRun(B, -3.4, 3.4, 0, FL + FH + 0.2, m.trim, { height: 0.8, spacing: 0.22 }));
    // pool
    B.box(surface('stone', '#d8ccb4', { name: 'paving' }), 12, 0.25, 7, 2, 0.125, dp / 2 + 5.5, 0, 0.03);
    B.box(new THREE.MeshPhysicalMaterial({ name: 'pool', color: '#3fb6d8', roughness: 0.05, clearcoat: 1 }), 8, 0.03, 3.6, 2, 0.265, dp / 2 + 5.8, 0, 0);
    chimney(B, 3, -1.8, h, 2.4, { mat: surface('stucco', '#f4ece0', { name: 'stucco_chimney' }) });
  },

  'beach-house'(B, o, d, m) {
    // raised on piles with a wide deck and outdoor stair
    const w = 11;
    const dp = 9;
    const y0 = 2.6;
    const h = y0 + FH + 0.2;
    for (const x of spread(w, 4, 0.3)) for (const z of spread(dp + 3, 4, 0.3)) B.box(surface('plank', '#8a7a62', { name: 'piles' }), 0.3, y0, 0.3, x, y0 / 2, z + 1.5, 0, 0.03);
    B.box(surface('plank', '#a08a6a', { name: 'deck' }), w + 0.4, 0.2, dp + 3.4, 0, y0 - 0.1, 1.5, 0, 0.02);
    block(B, w, FH + 0.2, dp, { y0, plinth: 0 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, -2, y0, 1.6, 2.3, { double: true, glass: true });
        windowUnit(B, 2.2, y0 + 0.3, 3.2, 2.1, { style: 'tall', sill: false });
      } else rowWindows(B, width, { per: side === 'back' ? 3 : 2, y0, w: 1.2, h: 1.3, margin: 1.4 });
    });
    railingRun(B, -w / 2, w / 2, dp / 2 + 3, y0, m.trim, { spacing: 0.15 });
    gableRoof(B, w, dp, h, { pitch: 0.38, overhang: 0.7 });
    // stair to the beach
    const steps = 13;
    for (let k = 0; k < steps; k++) B.box(surface('plank', '#a08a6a', { name: 'deck' }), 1.1, 0.06, 0.32, w / 2 + 0.75, y0 - 0.2 - (k + 1) * (y0 - 0.2) / steps + 0.03, dp / 2 + 2.5 - k * 0.3, 0, 0.01);
    for (const s of [-1, 1]) B.add(surface('plank', '#8a7a62', { name: 'piles' }), new THREE.BoxGeometry(0.08, 0.3, Math.hypot(y0, steps * 0.3)).rotateX(-Math.atan2(y0, steps * 0.3)), new THREE.Matrix4().makeTranslation(w / 2 + 0.75 + s * 0.55, y0 / 2, dp / 2 + 2.5 - (steps * 0.3) / 2 + 0.15));
    // sun umbrella + loungers on the deck
    B.cyl(B.mats.metal, 0.03, 0.03, 2.2, 3, y0 + 1.1, dp / 2 + 1.6, 6);
    B.add(m.accent, new THREE.ConeGeometry(1.4, 0.5, 8, 1, true), new THREE.Matrix4().makeTranslation(3, y0 + 2.3, dp / 2 + 1.6));
  },

  'mobile-home'(B, o, d, m) {
    // single-wide on blocks with skirting, little stoop and awning
    const L = 15;
    const W = 4.3;
    const y0 = 0.7;
    const h = 2.6;
    B.box(surface('vboard', '#b8b2a6', { name: 'skirting' }), L, y0, W, 0, y0 / 2, 0, 0, 0.02);
    block(B, L, h, W, { y0, plinth: 0 });
    facades(B, L, W, (side, width) => {
      if (side === 'front') {
        door(B, -3, y0, 0.9, 2.0, {});
        for (const x of [-5.8, 0.2, 3, 5.8]) windowUnit(B, x, y0 + 0.9, 1.1, 0.9, { style: 'double', shutters: m.accent });
        for (let s = 0; s < 3; s++) B.box(B.mats.concrete, 1.4, y0 / 3, 0.3 * (3 - s), -3, (y0 / 3) * (s + 0.5), 0.15 * (3 - s), 0, 0.02);
        B.slab(m.accent, 0, y0 + h + 0.05, 2.2, y0 + h - 0.35, 6, 0.05, -1.5);
        for (const x of [-4.4, 1.4]) B.box(B.mats.metal, 0.06, y0 + h - 0.35, 0.06, x, (y0 + h - 0.35) / 2, 2.15, 0, 0);
      } else if (side === 'back') rowWindows(B, width, { per: 4, y0, w: 1.0, h: 0.9, margin: 1.5 });
      else windowUnit(B, 0, y0 + 0.9, 0.9, 0.9, {});
    });
    // shallow arched roof
    const rg = new THREE.BoxGeometry(L + 0.12, 0.1, W + 0.24, 1, 1, 12);
    const rp = rg.attributes.position;
    for (let i = 0; i < rp.count; i++) rp.setY(i, rp.getY(i) + 0.28 * (1 - (rp.getZ(i) / (W / 2 + 0.12)) ** 2));
    rg.computeVertexNormals();
    B.add(B.mats.roof, rg, new THREE.Matrix4().makeTranslation(0, y0 + h + 0.05, 0));
    for (const s of [-1, 1]) B.prism(B.mats.wall, Array.from({ length: 13 }, (_, k) => { const z = -W / 2 + (k * W) / 12; return [z, y0 + h + 0.28 * (1 - (z / (W / 2 + 0.12)) ** 2)]; }).concat([[W / 2, y0 + h - 0.01], [-W / 2, y0 + h - 0.01]]), s * L / 2 - (s > 0 ? 0.05 : 0), s * L / 2 + (s > 0 ? 0 : 0.05));
    acUnit(B, L / 2 + 0.6, 0, -0.5, Math.PI / 2);
  },

  'tiny-house'(B, o, d, m) {
    // tiny house on a trailer: tall narrow, loft dormer, steps
    const L = 7.2;
    const W = 2.55;
    const y0 = 0.65;
    const h = 3.0;
    // trailer
    B.box(B.mats.dark, L + 0.2, 0.2, W, 0, y0 - 0.1, 0, 0, 0.02);
    for (const x of [-0.5, 0.5]) for (const s of [-1, 1]) B.add(B.mats.dark, new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(x, 0.33, s * (W / 2 - 0.15)));
    B.add(B.mats.dark, new THREE.BoxGeometry(1.6, 0.1, 0.1).rotateY(0.3), new THREE.Matrix4().makeTranslation(L / 2 + 0.7, y0 - 0.15, 0.2));
    B.add(B.mats.dark, new THREE.BoxGeometry(1.6, 0.1, 0.1).rotateY(-0.3), new THREE.Matrix4().makeTranslation(L / 2 + 0.7, y0 - 0.15, -0.2));
    B.box(B.mats.dark, 0.1, y0 - 0.2, 0.1, L / 2 + 1.4, (y0 - 0.2) / 2, 0, 0, 0);
    for (const x of [-L / 2 + 0.3, L / 2 - 0.3]) for (const s of [-1, 1]) B.box(B.mats.metal, 0.12, y0 - 0.2, 0.12, x, (y0 - 0.2) / 2, s * (W / 2 - 0.2), 0, 0.01);
    block(B, L, h, W, { y0, plinth: 0 });
    facades(B, L, W, (side, width) => {
      if (side === 'front') {
        door(B, 1.2, y0, 0.8, 2.0, { glass: true });
        windowUnit(B, -1.2, y0 + 0.9, 1.6, 1.1, { style: 'double' });
        for (let s = 0; s < 2; s++) B.box(surface('plank', '#8a6b4e', { name: 'steps' }), 1.0, y0 / 2, 0.3 * (2 - s), 1.2, (y0 / 2) * (s + 0.5), 0.15 * (2 - s), 0, 0.01);
      } else if (side === 'back') windowUnit(B, 0, y0 + 0.9, 2.4, 1.0, { style: 'tall' });
      else windowUnit(B, 0, y0 + 0.9, 0.7, 1.0, { style: 'double' });
    });
    gableRoof(B, L, W, y0 + h, { pitch: 0.9, overhang: 0.2, gutter: false });
    // shed dormer for the sleeping loft
    B.box(B.mats.wall, 3, 0.9, 0.9, -1.5, y0 + h + 0.55, 0.65, 0, 0.02);
    B.local(-1.5, 0, 1.1, 0, () => windowUnit(B, 0, y0 + h + 0.25, 2, 0.5, { style: 'tall', sill: false }));
    B.slab(B.mats.roof, -0.3, y0 + h + 1.2, 1.3, y0 + h + 1.0, 3.3, 0.06, -1.5);
    B.cyl(B.mats.metal, 0.07, 0.07, 1.0, L / 2 - 0.8, y0 + h + 1.0, -0.4, 8);
  },
});

export function createHouse(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(HOUSE_VARIANTS, o.variant, 'house');
  const d = HOUSE_VARIANTS[variant];
  const root = group(`house-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  BUILDERS[variant](B, o, d, m);
  B.finish();
  const animations = buildingAnimations(root, B);
  finalize(root, { type: 'house', variant, options: o, animations });
  root.userData.premade.oneShot = animations.filter((a) => /Open$/.test(a.name)).map((a) => a.name);
  return root;
}

/** doorOpen (one-shot), lights (night cycle), garageOpen when present. */
export function buildingAnimations(root, B, { lightsName = 'win_glow' } = {}) {
  const anims = [];
  if (B.doors.length) {
    anims.push(clip('doorOpen', 1.2, B.doors.map(({ pivot, side }) => rotateTrack(pivot, 'y', 1.2, (t) => side * (1 - (1 - t) ** 3) * 1.45, 12))));
  }
  if (root.getObjectByName(lightsName)) {
    anims.push(clip('lights', 4, [numberTrack(`${lightsName}.material.emissiveIntensity`, 4, (t) => (t < 0.5 ? 1.8 : 0), 2, THREE.InterpolateDiscrete)]));
  }
  const g = root.getObjectByName('garage_door');
  if (g) anims.push(clip('garageOpen', 2.5, [scaleTrack(g, 2.5, (t) => [1, 1 - 0.94 * (1 - (1 - t) ** 2), 1], 12)]));
  return anims;
}
