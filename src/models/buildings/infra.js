import * as THREE from 'three';
import * as M from '../../core/materials.js';
import {
  floorsOf, makeBuilding, gridBody, rooftop, surface, block, facades, spread, windowUnit, door, flatRoof, gableRoof, frustum, signBoard, railingRun,
} from './parts.js';

/*
 * Industrial, farm & infrastructure: factories, power plants, bridges, tunnel
 * portals, silos, water towers, greenhouses, sheds and a treehouse.
 */

/** Square strut between two points (braces, conveyors). */
function strut(B, mat, a, b, t = 0.15, t2 = t) {
  const A = new THREE.Vector3(...a);
  const Bv = new THREE.Vector3(...b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize());
  B.add(mat, new THREE.BoxGeometry(t, A.distanceTo(Bv), t2), new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
}

/* ------------------------------ Factory ---------------------------- */
export const FACTORY_VARIANTS = {
  'brick-mill': { wall: '#8e4636', wallKind: 'brick', roof: '#4a4d52', roofKind: 'seam', trim: '#d8cfbf', accent: '#2a2d30', door: '#2a2d30', plinthKind: 'stone', plinth: '#8f877a' },
  plant: { wall: '#9aa3ab', wallKind: 'corrugated', roof: '#7d858b', roofKind: 'corrugated', trim: '#2e3236', accent: '#d35400', door: '#2a2d30' },
  brewery: { wall: '#b5654a', wallKind: 'brick', roof: '#3a3d42', roofKind: 'seam', trim: '#efe7d8', accent: '#1f3d2b', door: '#1f3d2b', plinthKind: 'stone', plinth: '#8f877a' },
};

function stack(B, x, z, h, r = 1.4, mat) {
  // tapered chimney stack with bands and a cap
  const m = mat ?? surface('brick', '#7c3b2c', { name: 'stack_brick' });
  B.box(B.mats.plinth, r * 2.8, 1.2, r * 2.8, x, 0.6, z, 0, 0.05);
  B.add(m, new THREE.CylinderGeometry(r * 0.7, r, h, 20), new THREE.Matrix4().makeTranslation(x, 1.2 + h / 2, z));
  for (const f of [0.3, 0.6, 0.92]) B.add(B.mats.dark, new THREE.CylinderGeometry(r * (1 - 0.3 * f) + 0.08, r * (1 - 0.3 * f) + 0.08, 0.35, 20), new THREE.Matrix4().makeTranslation(x, 1.2 + h * f, z));
  B.add(B.mats.dark, new THREE.CylinderGeometry(r * 0.78, r * 0.72, 0.6, 20), new THREE.Matrix4().makeTranslation(x, 1.2 + h + 0.3, z));
}

/** Sawtooth (north-light) roof over w × d at height y: teeth run along X. */
function sawtooth(B, w, d, y, { teeth = 5, rise = 2.6 } = {}) {
  const tw = d / teeth;
  for (let i = 0; i < teeth; i++) {
    const z0 = -d / 2 + i * tw;
    B.slab(B.mats.roof, z0, y, z0 + tw, y + rise, w, 0.12);
    // glazed vertical face
    B.local(0, 0, z0 + tw, 0, () => {
      B.add(B.mats.glow, new THREE.PlaneGeometry(w - 0.4, rise - 0.2), new THREE.Matrix4().makeTranslation(0, y + rise / 2, -0.04));
      B.add(B.mats.glass, new THREE.PlaneGeometry(w - 0.4, rise - 0.2), new THREE.Matrix4().makeTranslation(0, y + rise / 2, 0.0));
      for (const x of spread(w, Math.round(w / 1.5), 0.2)) B.box(B.mats.dark, 0.08, rise, 0.08, x, y + rise / 2, 0, 0, 0);
    });
    B.prism(B.mats.wall, [[z0, y], [z0 + tw, y], [z0 + tw, y + rise]], -w / 2, -w / 2 + 0.3);
    B.prism(B.mats.wall, [[z0, y], [z0 + tw, y], [z0 + tw, y + rise]], w / 2 - 0.3, w / 2);
  }
}

export const createFactory = makeBuilding('factory', FACTORY_VARIANTS, (B, o, d, m, v) => {
  if (v === 'plant') {
    const w = 40;
    const dp = 26;
    const h = 0.3 + floorsOf(o, 1) * 9;
    block(B, w, h, dp, { plinth: 0.3 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        for (const x of [-12, 0]) {
          B.add(B.mats.dark, new THREE.PlaneGeometry(5, 5.5), new THREE.Matrix4().makeTranslation(x, 0.3 + 2.75, 0.01));
          for (let k = 0; k < 11; k++) B.box(B.mats.metal, 5, 0.06, 0.06, x, 0.6 + k * 0.5, 0.04, 0, 0);
          B.box(m.accent, 5.5, 0.35, 0.3, x, 6.1, 0.15, 0, 0.04);
        }
        door(B, 10, 0.3, 1.0, 2.2, { frame: m.accent });
        for (const x of [14, 17]) windowUnit(B, x, 1.2, 1.8, 1.2, { style: 'none', frame: m.trim });
        signBoard(B, 6, h - 1.5, 0.05, 12, 1.4, 'INDUSTRIES', { bg: '#2e3236', fg: '#ffffff' });
      } else for (const x of spread(width, Math.round(width / 5), 3)) windowUnit(B, x, h - 2.6, 3.2, 1.2, { style: 'none', frame: m.trim, sill: false });
    });
    gableRoof(B, w, dp, h, { pitch: 0.15, overhang: 0.4, fascia: m.trim });
    // silos + pipe rack + stack
    for (const z of [-6, 2]) {
      B.add(M.metal('#c9ced3', 0.3), new THREE.CylinderGeometry(3, 3, 14, 24), new THREE.Matrix4().makeTranslation(w / 2 + 5, 7.6, z));
      B.add(M.metal('#c9ced3', 0.3), new THREE.ConeGeometry(3, 1.4, 24), new THREE.Matrix4().makeTranslation(w / 2 + 5, 15.3, z));
      for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B.box(B.mats.metal, 0.3, 0.6, 0.3, w / 2 + 5 + sx * 2.3, 0.3, z + sz * 2.3, 0, 0.03);
    }
    for (let x = w / 2 - 2; x < w / 2 + 5; x += 2.2) B.box(B.mats.metal, 0.3, 9, 0.3, x + 0.2, 4.5, -10, 0, 0.03);
    B.box(B.mats.metal, 8, 0.3, 0.3, w / 2 + 1.6, 9, -10, 0, 0.03);
    for (const k of [0, 1]) B.add(m.accent, new THREE.CylinderGeometry(0.3, 0.3, 8, 10).rotateZ(Math.PI / 2), new THREE.Matrix4().makeTranslation(w / 2 + 1.6, 9.45 + k * 0.62, -10));
    stack(B, -w / 2 - 4, -dp / 2 + 4, 28, 1.5, M.metal('#b9bec4', 0.4));
    return;
  }
  const w = v === 'brewery' ? 26 : 44;
  const dp = v === 'brewery' ? 18 : 30;
  const floors = floorsOf(o, v === 'brewery' ? 2 : 3);
  const top = gridBody(B, m, { w, d: dp, floors, fh: 4.2, g: 0.6, spacing: 3, winW: 1.8, winH: 2.6, style: 'grid', header: m.trim, doorGap: 3 });
  B.local(0, 0, dp / 2, 0, () => {
    door(B, 0, 0.6, 3.6, 3.6, { double: true, mat: B.mats.door });
    signBoard(B, 0, top - 1.4, 0.05, Math.min(w * 0.6, 16), 1.4, v === 'brewery' ? 'BREWING CO.' : 'TEXTILE MILL', { bg: '#1d1d1d', fg: '#efe7d8' });
  });
  B.box(m.trim, w + 0.4, 0.5, dp + 0.4, 0, top + 0.25, 0, 0, 0.05);
  if (v === 'brick-mill') {
    flatRoof(B, w, dp, top + 0.5, { parapet: 0.4, mat: B.mats.wall, cap: m.trim });
    sawtooth(B, w - 1, dp - 1, top + 0.56, { teeth: 6 });
    stack(B, w / 2 + 3, -dp / 2 + 3, 34);
    rooftop(B, w, dp, top + 0.5, { ac: 0, tank: true });
  } else {
    gableRoof(B, w, dp, top + 0.5, { pitch: 0.5, overhang: 0.3, fascia: m.trim });
    // copper fermenting tanks in a yard
    const copper = M.metal('#b87333', 0.35);
    for (let i = 0; i < 3; i++) {
      const x = -w / 2 - 4 - i * 0;
      const z = -6 + i * 5;
      for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B.box(B.mats.metal, 0.2, 1.4, 0.2, x + sx * 1.2, 0.7, z + sz * 1.2, 0, 0.02);
      B.add(copper, new THREE.CylinderGeometry(1.8, 1.8, 6, 20), new THREE.Matrix4().makeTranslation(x, 1.4 + 3, z));
      B.add(copper, new THREE.SphereGeometry(1.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Matrix4().makeTranslation(x, 7.4, z));
      B.add(copper, new THREE.ConeGeometry(1.8, 1.2, 20).rotateX(Math.PI), new THREE.Matrix4().makeTranslation(x, 1.4 - 0.0 + 0.0, z));
    }
    stack(B, w / 2 - 3, -dp / 2 + 3, 16, 0.9);
  }
});

/* ---------------------------- Power plant -------------------------- */
export const POWER_PLANT_VARIANTS = {
  cooling: { wall: '#c9c5bd', wallKind: 'concrete', roof: '#777', roofKind: 'concrete', trim: '#5a6068', accent: '#b3261e', door: '#2a2d30' },
  coal: { wall: '#8b8378', wallKind: 'concrete', roof: '#5a5e63', roofKind: 'corrugated', trim: '#3a3d42', accent: '#3a3d42', door: '#2a2d30' },
  substation: { wall: '#bdb9b1', wallKind: 'concrete', roof: '#777', roofKind: 'concrete', trim: '#3a3d42', accent: '#f2c200', door: '#2a2d30' },
};

function coolingTower(B, x, z, h, r) {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const rr = r * (0.62 + 0.38 * ((t - 0.72) / 0.72) ** 2);
    pts.push(new THREE.Vector2(rr, t * h));
  }
  B.add(B.mats.wall, new THREE.LatheGeometry(pts, 40), new THREE.Matrix4().makeTranslation(x, 0, z));
  // inner face (dark) so the opening reads from above
  const inner = pts.map((p) => new THREE.Vector2(p.x - 0.4, p.y)).reverse();
  B.add(B.mats.dark, new THREE.LatheGeometry(inner, 40), new THREE.Matrix4().makeTranslation(x, 0, z));
  B.add(B.mats.trim, new THREE.TorusGeometry(pts[20].x - 0.2, 0.35, 6, 40).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(x, h, z));
  // red/white aviation band
  B.add(B.cBand ??= new THREE.MeshStandardMaterial({ name: 'band', color: '#b3261e', roughness: 0.7 }), new THREE.CylinderGeometry(pts[19].x + 0.05, pts[18].x + 0.05, h * 0.1, 40, 1, true), new THREE.Matrix4().makeTranslation(x, h * 0.9, z));
}

export const createPowerPlant = makeBuilding('power-plant', POWER_PLANT_VARIANTS, (B, o, d, m, v) => {
  if (v === 'substation') {
    // fenced yard with transformers, gantries and insulators
    B.box(surface('stucco', '#8f8a80', { name: 'gravel' }), 30, 0.1, 22, 0, 0.05, 0, 0, 0.03);
    for (const [a, b, z] of [[-15, 15, 11], [-15, 15, -11]]) railingRun(B, a, b, z, 0.1, B.mats.metal, { height: 2.4, spacing: 0.2 });
    for (const s of [-1, 1]) B.local(s * 15, 0, 0, Math.PI / 2, () => railingRun(B, -11, 11, 0, 0.1, B.mats.metal, { height: 2.4, spacing: 0.2 }));
    const tr = M.metal('#7d8a7a', 0.6);
    for (const x of [-8, 0, 8]) {
      B.box(B.mats.concrete, 4.4, 0.4, 3.4, x, 0.3, -3, 0, 0.05);
      B.box(tr, 3.4, 2.8, 2.4, x, 0.5 + 1.4, -3, 0, 0.08);
      for (let k = -3; k <= 3; k++) B.box(tr, 0.08, 2.2, 2.8, x + k * 0.45, 0.5 + 1.4, -3, 0, 0.01);
      for (const k of [-1, 0, 1]) {
        for (let c = 0; c < 5; c++) B.add(B.cIns ??= new THREE.MeshStandardMaterial({ name: 'insulator', color: '#8a5a3a', roughness: 0.4 }), new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), new THREE.Matrix4().makeTranslation(x + k * 1, 3.35 + c * 0.2, -3));
        B.cyl(B.mats.metal, 0.05, 0.05, 1.1, x + k, 3.3 + 0.55, -3, 6);
      }
    }
    // gantry
    for (const x of [-12, 12]) for (const z of [3, 7]) B.box(B.mats.metal, 0.4, 9, 0.4, x, 4.5, z, 0, 0.03);
    for (const z of [3, 7]) B.box(B.mats.metal, 24.4, 0.5, 0.5, 0, 9, z, 0, 0.03);
    // control hut
    block(B, 6, 3.2, 4, { cx: 10, cz: -8, plinth: 0.3 });
    B.local(10, 0, -6, 0, () => door(B, 0, 0.3, 1, 2.1, {}));
    flatRoof(B, 6, 4, 3.2, { parapet: 0.3, cx: 10, cz: -8 });
    B.local(0, 0, 11.05, 0, () => signBoard(B, 0, 1.6, 0.03, 2, 0.9, 'DANGER', { bg: '#f2c200', fg: '#1d1d1d', logo: false }));
    return;
  }
  // turbine hall
  const w = 44;
  const dp = 24;
  const h = 0.4 + floorsOf(o, 1) * 14;
  block(B, w, h, dp, { plinth: 0.4 });
  facades(B, w, dp, (side, width) => {
    for (const x of spread(width, Math.round(width / 4), 2)) windowUnit(B, x, h - 5, 2.4, 3.6, { style: 'grid', frame: m.trim, sill: false });
    if (side === 'front') {
      B.add(B.mats.dark, new THREE.PlaneGeometry(6, 7), new THREE.Matrix4().makeTranslation(0, 0.4 + 3.5, 0.01));
      for (let k = 0; k < 14; k++) B.box(B.mats.metal, 6, 0.06, 0.06, 0, 0.6 + k * 0.5, 0.04, 0, 0);
      signBoard(B, 0, h - 1.2, 0.05, 14, 1.3, v === 'coal' ? 'POWER STATION' : 'ENERGY CENTER', { bg: '#2e3236', fg: '#ffffff' });
    }
  });
  gableRoof(B, w, dp, h, { pitch: 0.12, overhang: 0.4, fascia: m.trim });
  if (v === 'cooling') {
    coolingTower(B, -16, -32, 46, 15);
    coolingTower(B, 18, -32, 46, 15);
    stack(B, w / 2 + 4, 0, 60, 2, B.mats.wall);
  } else {
    // boiler house + twin stacks + conveyor to a coal heap
    block(B, 16, h + 12, 18, { cx: -w / 2 - 8, plinth: 0.4 });
    flatRoof(B, 16, 18, h + 12, { parapet: 0.5, cx: -w / 2 - 8 });
    stack(B, -w / 2 - 22, -4, 70, 2.4);
    stack(B, -w / 2 - 22, 6, 70, 2.4);
    B.add(new THREE.MeshStandardMaterial({ name: 'coal', color: '#1d1d1f', roughness: 1, flatShading: true }), new THREE.ConeGeometry(12, 7, 9), new THREE.Matrix4().makeTranslation(w / 2 + 16, 3.5, -10));
    // inclined conveyor from the heap up into the hall, on trestles
    const a = [w / 2 + 14, 6.5, -10];
    const b = [w / 2 + 0.2, h - 3, -10];
    strut(B, B.mats.metal, a, b, 1.2, 1.6);
    for (const t of [0.25, 0.5, 0.75]) {
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t - 0.6;
      B.box(B.mats.metal, 0.4, y, 0.4, x, y / 2, -10, 0, 0.03);
    }
  }
});

/* ------------------------------ Bridge ----------------------------- */
export const BRIDGE_VARIANTS = {
  'stone-arch': { wall: '#a59c8c', wallKind: 'stone', roof: '#666', roofKind: 'concrete', trim: '#8f877a', accent: '#3a3d42', door: '#2a2d30', plinthKind: 'stone', plinth: '#8f877a' },
  truss: { wall: '#9a9d9f', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#b3261e', accent: '#3a3d42', door: '#2a2d30' },
  suspension: { wall: '#c9c5bd', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#c0392b', accent: '#3a3d42', door: '#2a2d30' },
  footbridge: { wall: '#8a6b4e', wallKind: 'plank', roof: '#666', roofKind: 'concrete', trim: '#5a3a20', accent: '#3a3d42', door: '#2a2d30' },
};

function deck(B, m, L, y, w, { rail = true, railMat = B.mats.metal } = {}) {
  const asphalt = B.cAsphalt ??= new THREE.MeshStandardMaterial({ name: 'asphalt', color: '#3e4044', roughness: 0.95 });
  B.box(B.mats.concrete, L, 0.8, w, 0, y - 0.4, 0, 0, 0.05);
  B.box(asphalt, L, 0.04, w - 2, 0, y + 0.02, 0, 0, 0);
  for (const s of [-1, 1]) {
    B.box(B.mats.concrete, L, 0.25, 1, 0, y + 0.125, s * (w / 2 - 0.5), 0, 0.03);
    if (rail) railingRun(B, -L / 2, L / 2, s * (w / 2 - 0.15), y + 0.25, railMat, { height: 1.1, spacing: 0.3 });
  }
  B.box(B.cLine ??= new THREE.MeshStandardMaterial({ name: 'line', color: '#f2f2ee' }), L, 0.01, 0.15, 0, y + 0.045, 0, 0, 0);
}

export const createBridge = makeBuilding('bridge', BRIDGE_VARIANTS, (B, o, d, m, v) => {
  const spanMul = { low: 0.7, high: 1.4 }[o.trim] ?? 1;
  if (v === 'footbridge') {
    const L = 14 * spanMul;
    const wood = surface('plank', '#8a6b4e', { name: 'planks' });
    // gentle arched deck of planks on two stringers
    const arch = (x) => 1.2 + 0.9 * (1 - (2 * x / L) ** 2);
    for (let x = -L / 2; x < L / 2; x += 0.25) B.box(wood, 0.22, 0.08, 2.2, x + 0.125, arch(x + 0.125), 0, 0, 0.01);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 16; i++) {
        const x0 = -L / 2 + (i * L) / 16;
        const x1 = -L / 2 + ((i + 1) * L) / 16;
        B.add(m.trim, new THREE.BoxGeometry(Math.hypot(x1 - x0, arch(x1) - arch(x0)) + 0.02, 0.25, 0.15).rotateZ(Math.atan2(arch(x1) - arch(x0), x1 - x0)), new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (arch(x0) + arch(x1)) / 2 - 0.16, s * 0.95));
        B.add(m.trim, new THREE.BoxGeometry(Math.hypot(x1 - x0, arch(x1) - arch(x0)) + 0.02, 0.1, 0.1).rotateZ(Math.atan2(arch(x1) - arch(x0), x1 - x0)), new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (arch(x0) + arch(x1)) / 2 + 0.95, s * 1.05));
      }
      for (let i = 0; i <= 8; i++) {
        const x = -L / 2 + (i * L) / 8;
        B.box(m.trim, 0.12, 1.0, 0.12, x, arch(x) + 0.5, s * 1.05, 0, 0.02);
      }
      for (const e of [-1, 1]) B.box(m.trim, 0.25, 1.4, 0.25, e * L / 2, 0.7, s * 0.95, 0, 0.03);
    }
    // stream bed
    B.add(new THREE.MeshPhysicalMaterial({ name: 'water', color: '#4f8fae', roughness: 0.08, clearcoat: 1 }), new THREE.BoxGeometry(L - 3, 0.05, 8), new THREE.Matrix4().makeTranslation(0, 0.025, 0));
    return;
  }
  if (v === 'stone-arch') {
    const arches = Math.max(2, Math.round(3 * spanMul));
    const sp = 12;
    const L = arches * sp + 4;
    const y = 9;
    const W = 9;
    // spandrel walls with arch openings (extruded shape)
    const shape = new THREE.Shape();
    shape.moveTo(-L / 2, 0);
    for (let i = 0; i < arches; i++) {
      const x0 = -L / 2 + 2 + i * sp + 1.2;
      const x1 = x0 + sp - 2.4;
      shape.lineTo(x0, 0);
      shape.lineTo(x0, 3);
      shape.absarc((x0 + x1) / 2, 3, (x1 - x0) / 2, Math.PI, 0, true);
      shape.lineTo(x1, 0);
    }
    shape.lineTo(L / 2, 0);
    shape.lineTo(L / 2, y);
    shape.lineTo(-L / 2, y);
    const g = new THREE.ExtrudeGeometry(shape, { depth: W, bevelEnabled: false, curveSegments: 12 });
    g.translate(0, 0, -W / 2);
    B.add(B.mats.wall, g);
    // cutwaters on the piers
    for (let i = 0; i <= arches; i++) {
      const x = -L / 2 + 2 + i * sp;
      for (const s of [-1, 1]) B.add(B.mats.wall, new THREE.CylinderGeometry(1.2, 1.4, 4, 3).rotateY(s > 0 ? 0 : Math.PI), new THREE.Matrix4().makeTranslation(x, 2, s * (W / 2 + 0.4)));
    }
    B.box(m.trim, L + 0.4, 0.4, W + 0.6, 0, y + 0.2, 0, 0, 0.05);
    for (const s of [-1, 1]) {
      B.box(B.mats.wall, L, 1.0, 0.5, 0, y + 0.9, s * (W / 2), 0, 0.05);
      B.box(m.trim, L + 0.1, 0.15, 0.7, 0, y + 1.45, s * (W / 2), 0, 0.03);
    }
    B.box(B.cAsphalt ??= new THREE.MeshStandardMaterial({ name: 'cobbles', color: '#6b6560', roughness: 0.95 }), L, 0.04, W - 1, 0, y + 0.42, 0, 0, 0);
    B.add(new THREE.MeshPhysicalMaterial({ name: 'water', color: '#4f8fae', roughness: 0.08, clearcoat: 1 }), new THREE.BoxGeometry(L - 4, 0.05, 20), new THREE.Matrix4().makeTranslation(0, 0.025, 0));
    return;
  }
  if (v === 'truss') {
    const L = 48 * spanMul;
    const y = 7;
    const W = 9;
    const steel = M.metal(`#${m.trim.color.getHexString()}`, 0.5);
    // abutments + pier
    for (const s of [-1, 1]) B.box(B.mats.wall, 4, y, W + 1, s * (L / 2 - 2), y / 2, 0, 0, 0.05);
    B.box(B.mats.wall, 3, y - 0.8, W - 1, 0, (y - 0.8) / 2, 0, 0, 0.05);
    deck(B, m, L, y, W, { rail: false });
    const th = 6;
    const n = Math.round(L / 6);
    for (const s of [-1, 1]) {
      const z = s * (W / 2 - 0.2);
      B.box(steel, L - 6, 0.5, 0.5, 0, y + th, z, 0, 0.05);
      B.box(steel, L, 0.5, 0.5, 0, y + 0.25, z, 0, 0.05);
      for (let i = 0; i <= n; i++) {
        const x = -L / 2 + 3 + (i * (L - 6)) / n;
        B.box(steel, 0.4, th, 0.4, x, y + th / 2, z, 0, 0.04);
        if (i < n) {
          const dx = (L - 6) / n;
          const len = Math.hypot(dx, th);
          B.add(steel, new THREE.BoxGeometry(0.3, len, 0.3).rotateZ((i < n / 2 ? -1 : 1) * Math.atan2(dx, th)), new THREE.Matrix4().makeTranslation(x + dx / 2, y + th / 2, z));
        }
      }
      // end posts sloping down to the deck
      for (const e of [-1, 1]) B.add(steel, new THREE.BoxGeometry(0.5, Math.hypot(3, th), 0.5).rotateZ(e * Math.atan2(3, th)), new THREE.Matrix4().makeTranslation(e * (L / 2 - 1.5), y + th / 2, z));
    }
    for (let i = 0; i <= n; i++) B.box(steel, 0.3, 0.3, W - 0.4, -L / 2 + 3 + (i * (L - 6)) / n, y + th, 0, 0, 0.03);
    B.add(new THREE.MeshPhysicalMaterial({ name: 'water', color: '#4f8fae', roughness: 0.08, clearcoat: 1 }), new THREE.BoxGeometry(L - 8, 0.05, 24), new THREE.Matrix4().makeTranslation(0, 0.025, 0));
    return;
  }
  // suspension: two towers, catenary main cables, hangers
  const L = 120 * spanMul;
  const y = 14;
  const W = 14;
  const T = 44;
  const steel = M.metal(`#${m.trim.color.getHexString()}`, 0.5);
  const tx = L / 2 - 24;
  for (const s of [-1, 1]) {
    for (const z of [-W / 2 - 0.6, W / 2 + 0.6]) B.box(steel, 2.2, T, 2.2, s * tx, T / 2, z, 0, 0.1);
    for (const yy of [y - 2, T * 0.7, T - 1]) B.box(steel, 2, 2, W + 3, s * tx, yy, 0, 0, 0.1);
    B.box(B.mats.wall, 7, 2, W + 6, s * tx, 1, 0, 0, 0.1);
    B.box(B.mats.wall, 6, y, W, s * (L / 2 - 3), y / 2, 0, 0, 0.05);
  }
  deck(B, m, L, y, W, { rail: true, railMat: steel });
  const cable = (x) => {
    // parabola between tower tops, dipping to just above the deck mid-span; side spans run down to anchors
    if (Math.abs(x) <= tx) return y + 2 + (T - y - 3) * (x / tx) ** 2;
    const t = (Math.abs(x) - tx) / (L / 2 - tx);
    return T - 1 - (T - 1 - (y + 1)) * t;
  };
  for (const z of [-W / 2 - 0.6, W / 2 + 0.6]) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const x = -L / 2 + (i * L) / 60;
      pts.push(new THREE.Vector3(x, cable(x), z));
    }
    B.add(steel, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.35, 8, false));
    for (let x = -tx + 4; x < tx - 2; x += 4) {
      const top = cable(x);
      B.add(steel, new THREE.CylinderGeometry(0.06, 0.06, top - y, 4), new THREE.Matrix4().makeTranslation(x, (top + y) / 2, z));
    }
  }
  B.add(new THREE.MeshPhysicalMaterial({ name: 'water', color: '#4f8fae', roughness: 0.08, clearcoat: 1 }), new THREE.BoxGeometry(L - 12, 0.05, 40), new THREE.Matrix4().makeTranslation(0, 0.025, 0));
});

/* --------------------------- Tunnel portal ------------------------- */
export const TUNNEL_VARIANTS = {
  road: { wall: '#9a958b', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#7d786f', accent: '#f2c200', door: '#2a2d30' },
  rail: { wall: '#8f877a', wallKind: 'stone', roof: '#666', roofKind: 'concrete', trim: '#7a7266', accent: '#3a3d42', door: '#2a2d30', plinthKind: 'stone', plinth: '#7a7266' },
};

export const createTunnel = makeBuilding('tunnel', TUNNEL_VARIANTS, (B, o, d, m, v) => {
  const W = v === 'road' ? 11 : 7;
  const H = v === 'road' ? 7 : 7.5;
  const shape = new THREE.Shape();
  const fw = W + 10;
  const fh = H + 7;
  shape.moveTo(-fw / 2, 0);
  shape.lineTo(-W / 2, 0);
  shape.lineTo(-W / 2, H - W / 2);
  shape.absarc(0, H - W / 2, W / 2, Math.PI, 0, true);
  shape.lineTo(W / 2, 0);
  shape.lineTo(fw / 2, 0);
  shape.lineTo(fw / 2 - 1.5, fh);
  shape.lineTo(-fw / 2 + 1.5, fh);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2, curveSegments: 20 });
  B.add(B.mats.wall, g, new THREE.Matrix4().makeTranslation(0, 0, 0));
  // dark bore going back
  const bore = new THREE.CylinderGeometry(W / 2 - 0.05, W / 2 - 0.05, 12, 24, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
  B.add(B.mats.dark, bore, new THREE.Matrix4().makeTranslation(0, H - W / 2, -6));
  for (const s of [-1, 1]) B.box(B.mats.dark, 0.1, H - W / 2, 12, s * (W / 2 - 0.05), (H - W / 2) / 2, -6, 0, 0);
  B.box(B.mats.dark, W, 0.1, 12, 0, 0.05, -6, 0, 0);
  // hillside mound over it
  const hill = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(fw * 0.85, fh + 3, 16);
  B.add(new THREE.MeshStandardMaterial({ name: 'grass', color: '#5f7a3c', roughness: 1, flatShading: true }), hill, new THREE.Matrix4().makeTranslation(0, 0, -14));
  B.box(m.trim, fw - 2.6, 0.6, 2.2, 0, fh + 0.2, 0.8, 0, 0.06);
  if (v === 'road') {
    B.box(new THREE.MeshStandardMaterial({ name: 'asphalt', color: '#3e4044', roughness: 0.95 }), W - 1, 0.05, 20, 0, 0.025, 4, 0, 0);
    // hazard chevrons + lamps + name sign
    B.local(0, 0, 1.7, 0, () => {
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) B.box(k % 2 ? B.mats.dark : m.accent, 0.4, 0.5, 0.04, s * (W / 2 + 0.45), 0.4 + k * 0.5, 0.02, 0, 0);
      signBoard(B, 0, fh - 1.6, 0.04, 6, 0.9, 'TUNNEL', { bg: '#1f5a38', fg: '#ffffff', logo: false });
    });
  } else {
    // voussoirs + rails
    B.local(0, 0, 1.7, 0, () => {
      for (let k = 0; k <= 12; k++) {
        const a = Math.PI - (k / 12) * Math.PI;
        B.add(m.trim, new THREE.BoxGeometry(0.6, 1.1, 0.25).rotateZ(a - Math.PI / 2), new THREE.Matrix4().makeTranslation(Math.cos(a) * (W / 2 + 0.55), H - W / 2 + Math.sin(a) * (W / 2 + 0.55), 0.12));
      }
    });
    for (const s of [-0.72, 0.72]) B.box(M.metal('#8a8f94', 0.35), 0.08, 0.14, 24, s, 0.07, 0, 0, 0.01);
    for (let z = -11; z < 12; z += 0.65) B.box(surface('plank', '#5a4432', { name: 'sleepers' }), 2.6, 0.08, 0.25, 0, 0.04, z, 0, 0.01);
  }
});

/* -------------------------- Silo / water tower --------------------- */
export const SILO_VARIANTS = {
  grain: { wall: '#c9ced3', wallKind: 'corrugated', roof: '#a9aeb3', roofKind: 'corrugated', trim: '#6f767c', accent: '#3a3d42', door: '#2a2d30' },
  farm: { wall: '#9a3a2e', wallKind: 'brick', roof: '#5f6a72', roofKind: 'seam', trim: '#efe7d8', accent: '#3a3d42', door: '#2a2d30' },
  'water-tower': { wall: '#a9b4b8', wallKind: 'seam', roof: '#8a9499', roofKind: 'seam', trim: '#5a6068', accent: '#3a3d42', door: '#2a2d30' },
  'water-column': { wall: '#d8d4cc', wallKind: 'concrete', roof: '#9aa3ab', roofKind: 'seam', trim: '#5a6068', accent: '#2c4f7c', door: '#2a2d30' },
};

export const createSilo = makeBuilding('silo', SILO_VARIANTS, (B, o, d, m, v) => {
  const hm = { low: 0.65, high: 1.45 }[o.trim] ?? 1;
  if (v === 'grain') {
    // cluster of corrugated bins with conical roofs, catwalk and leg
    const H = 12 * hm;
    for (const [x, z, r] of [[-5, 0, 3.6], [3, 0, 3.6], [-1, 7.5, 3.2]]) {
      B.box(B.mats.concrete, r * 2 + 0.6, 0.5, r * 2 + 0.6, x, 0.25, z, 0, 0.08);
      B.add(B.mats.wall, new THREE.CylinderGeometry(r, r, H, 32), new THREE.Matrix4().makeTranslation(x, 0.5 + H / 2, z));
      for (let k = 1; k < 6; k++) B.add(B.mats.trim, new THREE.TorusGeometry(r + 0.02, 0.05, 4, 32).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(x, 0.5 + (k * H) / 6, z));
      B.add(B.mats.roof, new THREE.ConeGeometry(r + 0.25, r * 0.7, 32), new THREE.Matrix4().makeTranslation(x, 0.5 + H + r * 0.35, z));
      B.cyl(B.mats.metal, 0.4, 0.4, 0.5, x, 0.5 + H + r * 0.7 + 0.2, z, 10);
    }
    // bucket elevator leg + spouts
    B.box(B.mats.metal, 1.2, H + 8, 1.2, 9, (H + 8) / 2, 4, 0, 0.05);
    B.box(B.mats.metal, 2, 2, 2, 9, H + 8 + 1, 4, 0, 0.06);
    for (const [x, z] of [[-5, 0], [3, 0], [-1, 7.5]]) {
      const a = new THREE.Vector3(9, H + 8, 4);
      const b = new THREE.Vector3(x, 0.5 + H + 2.2, z);
      const len = a.distanceTo(b);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      B.add(B.mats.metal, new THREE.CylinderGeometry(0.15, 0.15, len, 6), new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
    }
    return;
  }
  if (v === 'farm') {
    const H = 16 * hm;
    const r = 2.6;
    B.box(B.mats.concrete, 6.4, 0.5, 6.4, 0, 0.25, 0, 0, 0.08);
    B.add(B.mats.wall, new THREE.CylinderGeometry(r, r, H, 32), new THREE.Matrix4().makeTranslation(0, 0.5 + H / 2, 0));
    for (let k = 1; k < 10; k++) B.add(B.mats.metal, new THREE.TorusGeometry(r + 0.03, 0.04, 4, 32).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, 0.5 + (k * H) / 10, 0));
    B.add(B.mats.roof, new THREE.SphereGeometry(r + 0.1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Matrix4().makeTranslation(0, 0.5 + H, 0));
    // chute + ladder cage
    B.box(B.mats.trim, 0.8, H, 0.5, 0, 0.5 + H / 2, r + 0.2, 0, 0.05);
    for (let y = 1; y < H; y += 0.4) B.box(B.mats.metal, 0.6, 0.04, 0.04, 0, 0.5 + y, r + 0.5, 0, 0);
    B.add(B.mats.roof, new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Matrix4().makeTranslation(0, 0.5 + H, r + 0.2));
    return;
  }
  if (v === 'water-tower') {
    // spherical-ish tank on braced legs
    const H = 22 * hm;
    const R = 6;
    const legs = 6;
    for (let k = 0; k < legs; k++) {
      const a = (k / legs) * Math.PI * 2;
      const x0 = Math.cos(a) * (R + 1.5);
      const z0 = Math.sin(a) * (R + 1.5);
      const x1 = Math.cos(a) * (R - 1);
      const z1 = Math.sin(a) * (R - 1);
      const a3 = new THREE.Vector3(x0, 0, z0);
      const b3 = new THREE.Vector3(x1, H + 0.5, z1);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b3.clone().sub(a3).normalize());
      B.add(B.mats.trim, new THREE.CylinderGeometry(0.35, 0.35, a3.distanceTo(b3), 10), new THREE.Matrix4().compose(a3.clone().add(b3).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
      B.box(B.mats.concrete, 1.4, 0.6, 1.4, x0, 0.3, z0, 0, 0.06);
    }
    for (const f of [0.33, 0.66]) {
      const rr = R + 1.5 - (R + 2.5) * f;
      B.add(B.mats.trim, new THREE.TorusGeometry(rr + 0.0, 0.18, 4, 6).rotateX(Math.PI / 2).rotateY(0), new THREE.Matrix4().makeTranslation(0, H * f, 0));
    }
    B.cyl(B.mats.trim, 0.6, 0.6, H, 0, H / 2, 0, 12);
    B.add(B.mats.wall, new THREE.SphereGeometry(R, 32, 16).scale(1, 0.75, 1), new THREE.Matrix4().makeTranslation(0, H + R * 0.7, 0));
    B.add(B.mats.wall, new THREE.CylinderGeometry(R * 0.995, R * 0.995, 2, 32), new THREE.Matrix4().makeTranslation(0, H + R * 0.7, 0));
    railingRun(B, -2, 2, R + 0.2, H + R * 0.7 - 0.8, B.mats.metal, { height: 1, spacing: 0.25 });
    B.add(B.mats.metal, new THREE.TorusGeometry(R + 0.4, 0.06, 4, 32).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, H + R * 0.7 + 0.1, 0));
    B.add(B.mats.trim, new THREE.TorusGeometry(R + 0.2, 0.5, 4, 32).rotateX(Math.PI / 2).scale(1, 0.25, 1), new THREE.Matrix4().makeTranslation(0, H + R * 0.7 - 0.85, 0));
    B.local(0, 0, R + 0.02, 0, () => signBoard(B, 0, H + R * 0.7 + 1.6, 0.02, 6, 1.2, 'WATER', { bg: `#${m.wall.color.getHexString()}`, fg: '#2c4f7c', emissive: 0.2, logo: false }));
    return;
  }
  // concrete water column with a mushroom tank
  const H = 26 * hm;
  B.add(B.mats.wall, new THREE.CylinderGeometry(2.6, 3.2, H, 24), new THREE.Matrix4().makeTranslation(0, H / 2, 0));
  B.local(0, 0, 3.15, 0, () => door(B, 0, 0, 1.0, 2.1, {}));
  const pts = [new THREE.Vector2(2.6, 0), new THREE.Vector2(8, 4.5), new THREE.Vector2(8.6, 6), new THREE.Vector2(8.6, 9), new THREE.Vector2(8, 9.6), new THREE.Vector2(0.01, 10.2)];
  B.add(B.mats.roof, new THREE.LatheGeometry(pts, 40), new THREE.Matrix4().makeTranslation(0, H - 0.5, 0));
  B.add(m.accent, new THREE.CylinderGeometry(8.65, 8.65, 1.2, 40, 1, true), new THREE.Matrix4().makeTranslation(0, H - 0.5 + 7.5, 0));
  // lit slit windows, centred on shaft facets (24-gon, r = 2.9 at mid-height) and set flush on them
  const rFace = 2.9 * Math.cos(Math.PI / 24) + 0.004;
  for (let k = 0; k < 8; k++) B.add(B.mats.glow, new THREE.PlaneGeometry(0.5, 0.8), new THREE.Matrix4().makeRotationY((k / 8) * Math.PI * 2 + Math.PI / 24).multiply(new THREE.Matrix4().makeTranslation(0, H * 0.5, rFace)));
});

/* ------------------------- Greenhouse / shed ----------------------- */
export const GREENHOUSE_VARIANTS = {
  'glass-house': { wall: '#e9e6df', wallKind: 'concrete', roof: '#e9e6df', roofKind: 'concrete', trim: '#f4f4f2', accent: '#3a3d42', door: '#2a2d30' },
  polytunnel: { wall: '#e9e6df', wallKind: 'concrete', roof: '#e9e6df', roofKind: 'concrete', trim: '#9aa3ab', accent: '#3a3d42', door: '#2a2d30' },
  conservatory: { wall: '#f4f1ea', wallKind: 'brick', roof: '#e9e6df', roofKind: 'concrete', trim: '#ffffff', accent: '#3a3d42', door: '#2a2d30', plinthKind: 'brick', plinth: '#9c4a36' },
};

function plantRows(B, w, d, y) {
  const leaf = B.cLeaf ??= new THREE.MeshStandardMaterial({ name: 'plants', color: '#4f8a3a', roughness: 0.9, flatShading: true });
  const soil = B.cSoil ??= new THREE.MeshStandardMaterial({ name: 'soil', color: '#4a3526', roughness: 1 });
  for (let z = -d / 2 + 1; z < d / 2 - 0.5; z += 1.4) {
    B.box(soil, w - 1.6, 0.3, 0.8, 0, y + 0.15, z, 0, 0.05);
    for (let x = -w / 2 + 1.2; x < w / 2 - 1; x += 0.6) B.add(leaf, new THREE.IcosahedronGeometry(0.28, 0), new THREE.Matrix4().makeTranslation(x, y + 0.45, z));
  }
}

export const createGreenhouse = makeBuilding('greenhouse', GREENHOUSE_VARIANTS, (B, o, d, m, v) => {
  const L = ({ low: 0.7, high: 1.5 }[o.trim] ?? 1) * (v === 'conservatory' ? 6 : 14);
  const glass = new THREE.MeshPhysicalMaterial({ name: 'gh_glass', color: '#dfeef2', roughness: 0.05, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
  const frame = M.metal(`#${m.trim.color.getHexString()}`, 0.4);
  if (v === 'polytunnel') {
    const R = 3.2;
    const film = new THREE.MeshPhysicalMaterial({ name: 'poly_film', color: '#d5e2e6', roughness: 0.35, transparent: true, opacity: 0.72, side: THREE.DoubleSide, clearcoat: 0.6 });
    B.add(film, new THREE.CylinderGeometry(R, R, L, 32, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2).rotateY(Math.PI / 2));
    for (let x = -L / 2; x <= L / 2 + 1e-3; x += L / 7) B.add(frame, new THREE.TorusGeometry(R, 0.04, 4, 24, Math.PI).rotateY(Math.PI / 2), new THREE.Matrix4().makeTranslation(x, 0, 0));
    for (const s of [-1, 1]) B.add(film, new THREE.CircleGeometry(R, 24, 0, Math.PI).rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2), new THREE.Matrix4().makeTranslation(s * L / 2, 0, 0));
    B.local(L / 2, 0, 0, Math.PI / 2, () => door(B, 0, 0, 1.2, 2.1, { glass: true, frame }));
    plantRows(B, L, R * 1.6, 0);
    return;
  }
  const W = v === 'conservatory' ? 5 : 7;
  const H = v === 'conservatory' ? 2.6 : 2.4;
  const g0 = 0.6;
  // dwarf wall
  B.box(B.mats.plinth, L, g0, W, 0, g0 / 2, 0, 0, 0.03);
  // glazed walls with glazing bars
  for (const s of [-1, 1]) {
    B.add(glass, new THREE.PlaneGeometry(L, H), new THREE.Matrix4().makeTranslation(0, g0 + H / 2, s * W / 2));
    for (let x = -L / 2; x <= L / 2 + 1e-3; x += 0.8) B.box(frame, 0.05, H, 0.07, x, g0 + H / 2, s * W / 2, 0, 0);
    B.box(frame, L, 0.08, 0.1, 0, g0 + H, s * W / 2, 0, 0);
  }
  for (const s of [-1, 1]) {
    B.add(glass, new THREE.PlaneGeometry(W, H).rotateY(Math.PI / 2), new THREE.Matrix4().makeTranslation(s * L / 2, g0 + H / 2, 0));
    B.add(glass, new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, W * 0.4)])).rotateY(Math.PI / 2), new THREE.Matrix4().makeTranslation(s * L / 2, g0 + H, 0));
    for (let z = -W / 2; z <= W / 2 + 1e-3; z += 0.8) B.box(frame, 0.07, H, 0.05, s * L / 2, g0 + H / 2, z, 0, 0);
  }
  // pitched glass roof with ridge + rafters
  for (const s of [-1, 1]) {
    const len = Math.hypot(W / 2, W * 0.4);
    const ang = Math.atan2(W * 0.4, W / 2);
    B.add(glass, new THREE.PlaneGeometry(L, len), new THREE.Matrix4().makeRotationX(Math.atan2((s * W) / 2, -0.4 * W)).setPosition(0, g0 + H + W * 0.2, (s * W) / 4));
    for (let x = -L / 2; x <= L / 2 + 1e-3; x += 0.8) B.add(frame, new THREE.BoxGeometry(0.05, 0.07, len), new THREE.Matrix4().makeRotationX(s * ang).setPosition(x, g0 + H + W * 0.2, s * W / 4));
  }
  B.box(frame, L + 0.2, 0.12, 0.14, 0, g0 + H + W * 0.4, 0, 0, 0.02);
  B.local(L / 2, 0, 0, Math.PI / 2, () => door(B, 0, 0, 1.0, 2.1, { glass: true, frame }));
  plantRows(B, L, W, g0 - 0.3);
  if (v === 'conservatory') {
    // attached to a stub of house wall with a finial
    B.box(B.mats.wall, L + 1, 6, 0.4, 0, 3, -W / 2 - 0.2, 0, 0.03);
    B.cyl(frame, 0.04, 0.08, 0.6, 0, g0 + H + W * 0.4 + 0.36, 0, 8);
  }
});

export const SHED_VARIANTS = {
  garden: { wall: '#7a5a3c', wallKind: 'vboard', roof: '#3a3d42', roofKind: 'shingle', trim: '#5a3a20', accent: '#2f5a3a', door: '#5a3a20' },
  metal: { wall: '#9aa3ab', wallKind: 'corrugated', roof: '#8a9196', roofKind: 'corrugated', trim: '#5a6068', accent: '#5a6068', door: '#5a6068' },
  'lean-to': { wall: '#8a6b4e', wallKind: 'plank', roof: '#5a6068', roofKind: 'corrugated', trim: '#5a3a20', accent: '#5a3a20', door: '#5a3a20' },
  'tiny-cabin': { wall: '#c9b48e', wallKind: 'log', roof: '#3f5a3c', roofKind: 'seam', trim: '#5a3a20', accent: '#5a3a20', door: '#5a3a20', plinthKind: 'stone', plinth: '#8f8a80' },
};

export const createShed = makeBuilding('shed', SHED_VARIANTS, (B, o, d, m, v) => {
  const w = { garden: 3, metal: 4, 'lean-to': 3.4, 'tiny-cabin': 4.5 }[v];
  const dp = { garden: 2.4, metal: 3, 'lean-to': 2, 'tiny-cabin': 3.6 }[v];
  const h = v === 'lean-to' ? 2.0 : 2.3;
  block(B, w, h, dp, { plinth: 0.15 });
  facades(B, w, dp, (side) => {
    if (side === 'front') {
      door(B, v === 'garden' || v === 'tiny-cabin' ? -0.5 : 0, 0.15, v === 'metal' ? 1.8 : 0.85, 1.9, { double: v === 'metal', mat: B.mats.door });
      if (v === 'garden' || v === 'tiny-cabin') windowUnit(B, 0.75, 1.0, 0.6, 0.6, { style: 'cross' });
    } else if (side === 'right' && v !== 'metal') windowUnit(B, 0, 1.0, 0.6, 0.6, { style: 'cross' });
  });
  if (v === 'lean-to') {
    B.slab(B.mats.roof, -dp / 2 - 0.3, h + 0.6, dp / 2 + 0.4, h - 0.1, w + 0.4, 0.06);
    B.prism(B.mats.wall, [[-dp / 2, h], [dp / 2, h], [-dp / 2, h + 0.55]], -w / 2, w / 2);
    // firewood stack beside it
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) B.add(surface('log', '#8a5a34', { name: 'logs' }), new THREE.CylinderGeometry(0.11, 0.11, 0.9, 8).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(w / 2 + 0.2 + k * 0.22 + r * 0.11, 0.11 + r * 0.19, 0));
  } else gableRoof(B, w, dp, h, { pitch: v === 'metal' ? 0.25 : 0.6, overhang: 0.2, gutter: false });
  if (v === 'tiny-cabin') {
    // little porch deck + stovepipe
    B.box(surface('plank', '#8a6b4e', { name: 'deck' }), w, 0.12, 1.4, 0, 0.3, dp / 2 + 0.7, 0, 0.02);
    for (const s of [-1, 1]) B.box(B.mats.plinth, 0.25, 0.24, 0.25, s * (w / 2 - 0.2), 0.12, dp / 2 + 1.25, 0, 0.03);
    B.cyl(B.mats.dark, 0.1, 0.1, 1.6, w / 2 - 0.6, h + 0.9, -0.6, 10);
  }
});

/* ------------------------------ Treehouse -------------------------- */
export const TREEHOUSE_VARIANTS = {
  classic: { wall: '#9a7048', wallKind: 'plank', roof: '#5a3a28', roofKind: 'shingle', trim: '#6b4a2c', accent: '#2f5a3a', door: '#5a3a20' },
  lookout: { wall: '#7a5a3c', wallKind: 'vboard', roof: '#2f5a3a', roofKind: 'seam', trim: '#5a3a20', accent: '#b3261e', door: '#5a3a20' },
};

export const createTreehouse = makeBuilding('treehouse', TREEHOUSE_VARIANTS, (B, o, d, m, v) => {
  const bark = surface('log', '#5a4030', { name: 'bark' });
  const leaves = new THREE.MeshStandardMaterial({ name: 'leaves', color: '#3f6b33', roughness: 0.9, flatShading: true });
  const H = v === 'lookout' ? 5.5 : 3.6;
  // trunk with roots and branches
  B.add(bark, new THREE.CylinderGeometry(0.55, 0.85, 11, 14), new THREE.Matrix4().makeTranslation(0, 5.5, 0));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    B.add(bark, new THREE.CylinderGeometry(0.12, 0.3, 1.6, 8).rotateZ(Math.PI / 2.6), new THREE.Matrix4().makeRotationY(a).setPosition(Math.cos(a) * 0.8, 0.58, -Math.sin(a) * 0.8));
  }
  for (const [a, y, l] of [[0.4, 8, 3], [2.4, 9, 2.6], [4.2, 7.4, 2.8], [5.4, 10, 2]]) {
    B.add(bark, new THREE.CylinderGeometry(0.12, 0.3, l, 8).translate(0, l / 2, 0).rotateZ(-0.9), new THREE.Matrix4().makeRotationY(a).setPosition(0, y, 0));
  }
  for (const [x, y, z, r] of [[0, 11.5, 0, 3.2], [2.2, 10, 1, 2.4], [-2, 10.3, -1, 2.5], [0.5, 9.4, -2.3, 2.2], [-1.4, 9.2, 2, 2.1]]) B.add(leaves, new THREE.IcosahedronGeometry(r, 1), new THREE.Matrix4().makeTranslation(x, y, z));
  // platform with braces
  const pw = 4;
  const deckMat = surface('plank', '#8a6b4e', { name: 'deck' });
  B.box(deckMat, pw, 0.18, pw, 0, H, 0, 0, 0.02);
  for (const [sx, sz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) strut(B, m.trim, [sx * 0.55, H - 1.8, sz * 0.55], [sx * 1.6, H - 0.09, sz * 1.6], 0.14);
  for (const s of [-1, 1]) B.box(m.trim, pw, 0.16, 0.16, 0, H - 0.17, s * 1.6, 0, 0.02);
  // posts (kept for safety on the downhill side)
  for (const [sx, sz] of [[-1, 1], [1, 1]]) B.box(m.trim, 0.18, H, 0.18, sx * (pw / 2 - 0.15), H / 2, sz * (pw / 2 - 0.15), 0, 0.03);
  // hut on the platform
  const hw = 2.8;
  block(B, hw, 2.2, hw - 0.4, { y0: H + 0.09, plinth: 0, cz: -0.4 });
  facades(B, hw, hw - 0.4, (side) => {
    if (side === 'front') door(B, -0.6, H + 0.09, 0.75, 1.7, {});
    if (side === 'front' || side === 'left') windowUnit(B, side === 'front' ? 0.7 : 0, H + 1.0, 0.6, 0.6, { style: 'cross', sill: false });
  }, { cz: -0.4 });
  gableRoof(B, hw, hw - 0.4, H + 2.29, { pitch: v === 'lookout' ? 1.0 : 0.8, overhang: 0.25, gutter: false, cz: -0.4 });
  railingRun(B, -pw / 2 + 0.1, pw / 2 - 0.1, pw / 2 - 0.08, H + 0.09, m.trim, { height: 0.9, spacing: 0.25 });
  // ladder
  for (const s of [-1, 1]) B.box(m.trim, 0.08, H + 0.9, 0.08, 1.3 + s * 0.25, (H + 0.9) / 2, pw / 2 + 0.06, 0, 0.01);
  for (let y = 0.35; y < H + 0.8; y += 0.35) B.box(m.trim, 0.5, 0.05, 0.05, 1.3, y, pw / 2 + 0.06, 0, 0);
  if (v === 'lookout') {
    // rope swing + flag
    B.cyl(B.mats.dark, 0.02, 0.02, 3.4, -1.6, H - 1.9, 1.6, 4);
    B.box(m.trim, 0.6, 0.06, 0.25, -1.6, H - 3.6, 1.6, 0, 0.01);
    B.cyl(m.trim, 0.03, 0.03, 1.8, 1.2, H + 2.29 + 1.4, -0.4, 6);
    B.box(m.accent, 0.7, 0.45, 0.02, 1.55, H + 2.29 + 2.05, -0.4, 0, 0);
  }
});
