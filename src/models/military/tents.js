import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, cushion, rng } from '../../core/utils.js';
import { clip, rotateTrack, wave } from '../../core/animation.js';
import { Merge, CAMO } from './kit.js';
import { keys } from '../vehicles/heavy-kit.js';
import { cot, netOver } from './field.js';

/*
 * Military tents with smooth canvas: a lofted fabric skin that sags gently between the arch
 * ribs, seams and windows printed on the cloth (canvas texture), red crosses painted flush on
 * the fabric (white roundels), real framed door flaps with zips (or rolled up), guy ropes from
 * eyelets to pegs with tensioners, and a sod-cloth skirt.
 */

const PI = Math.PI;

/** Polyline across the tent (z, y) from the left foot over the top to the right foot. */
function profileOf(v, W, H) {
  const pts = [];
  if (v === 'a-frame') {
    pts.push([-W / 2, 0], [0, H], [W / 2, 0]);
  } else if (v === 'command') {
    pts.push([-W / 2, 0], [-W / 2, H * 0.62], [0, H], [W / 2, H * 0.62], [W / 2, 0]);
  } else if (v === 'field-hospital') {
    const wall = 1.25;
    pts.push([-W / 2, 0]);
    for (let i = 0; i <= 16; i++) {
      const a = PI - (i / 16) * PI;
      pts.push([Math.cos(a) * W / 2, wall + Math.sin(a) * (H - wall)]);
    }
    pts.push([W / 2, 0]);
  } else {
    for (let i = 0; i <= 20; i++) {
      const a = PI - (i / 20) * PI;
      pts.push([Math.cos(a) * W / 2, Math.sin(a) * H]);
    }
  }
  // resample by arc length for an even, smooth skin
  const seg = [];
  let S = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    S += l;
  }
  const N = 48;
  const out = [];
  for (let k = 0; k <= N; k++) {
    let d = (k / N) * S;
    let i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const t = Math.min(1, d / seg[i]);
    out.push({ z: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, s: (k / N) * S });
  }
  for (let k = 0; k <= N; k++) {
    const a = out[Math.max(0, k - 1)];
    const b = out[Math.min(N, k + 1)];
    const tz = b.z - a.z;
    const ty = b.y - a.y;
    const l = Math.hypot(tz, ty) || 1;
    out[k].nz = -ty / l;
    out[k].ny = tz / l;
  }
  return { pts: out, S, raw: pts };
}

/** Canvas texture for the skin: weave, seams, mesh windows, painted red-cross roundels. */
function skinTexture(tone, { L, S, ribs, windows, crosses, door }) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  const base = CAMO[tone]?.canvas ?? '#6b6a42';
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 512);
  const r = rng(`weave${tone}`);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,240'},${0.03 + r() * 0.04})`;
    g.fillRect(r() * 1024, r() * 512, 1 + r() * 6, 1);
  }
  g.save();
  g.scale(1024 / L, 512 / S); // draw in metres: x along the tent, y along the arch
  g.strokeStyle = 'rgba(0,0,0,0.28)';
  g.lineWidth = 0.025;
  for (const u of ribs) { g.beginPath(); g.moveTo(u, 0); g.lineTo(u, S); g.stroke(); }
  for (const s of [0.3, S / 2, S - 0.3]) { g.beginPath(); g.moveTo(0, s); g.lineTo(L, s); g.stroke(); }
  g.setLineDash([0.04, 0.03]);
  g.strokeStyle = 'rgba(255,255,230,0.25)';
  g.lineWidth = 0.008;
  for (const u of ribs) { g.beginPath(); g.moveTo(u + 0.03, 0); g.lineTo(u + 0.03, S); g.stroke(); }
  g.setLineDash([]);
  for (const w of windows) {
    // framed mesh window
    g.fillStyle = 'rgba(20,24,20,0.85)';
    g.fillRect(w.u - w.w / 2, w.s - w.h / 2, w.w, w.h);
    g.strokeStyle = 'rgba(90,90,80,0.9)';
    g.lineWidth = 0.008;
    for (let x = w.u - w.w / 2; x < w.u + w.w / 2; x += 0.04) { g.beginPath(); g.moveTo(x, w.s - w.h / 2); g.lineTo(x, w.s + w.h / 2); g.stroke(); }
    for (let y = w.s - w.h / 2; y < w.s + w.h / 2; y += 0.04) { g.beginPath(); g.moveTo(w.u - w.w / 2, y); g.lineTo(w.u + w.w / 2, y); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 0.035;
    g.strokeRect(w.u - w.w / 2, w.s - w.h / 2, w.w, w.h);
  }
  for (const k of crosses) {
    g.fillStyle = '#f2f0ea';
    g.beginPath();
    g.arc(k.u, k.s, k.r, 0, PI * 2);
    g.fill();
    g.fillStyle = '#c21d24';
    const a = k.r * 0.62;
    const b = k.r * 0.2;
    g.fillRect(k.u - a, k.s - b, a * 2, b * 2);
    g.fillRect(k.u - b, k.s - a, b * 2, a * 2);
  }
  if (door) {
    // dome door: D-shaped panel with a zip
    g.fillStyle = door.open ? 'rgba(10,10,8,0.92)' : 'rgba(0,0,0,0.18)';
    g.beginPath();
    g.ellipse(door.u, door.s0, door.w / 2, door.h, 0, PI, 0, true);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 0.02;
    g.stroke();
    if (!door.open) { g.beginPath(); g.moveTo(door.u, door.s0); g.lineTo(door.u, door.s0 - door.h); g.stroke(); }
  }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function skinMat(tex, color) {
  return new THREE.MeshPhysicalMaterial({ name: 'tent_canvas', color: tex ? '#ffffff' : color, map: tex, roughness: 0.92, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#ffffff').multiplyScalar(0.25), side: THREE.DoubleSide });
}

/** Rope from an eyelet to a pegged ground point, with a tensioner and a driven peg. */
function guyRope(mg, f, from, to) {
  const [ax, ay, az] = from;
  const [bx, , bz] = to;
  const top = [bx, 0.07, bz];
  mg.tube(from, top, 0.0045, f.rope, 5);
  const t = 0.8;
  mg.add(roundedBox(0.05, 0.016, 0.02, 0.006, 1), f.rope2, { at: [ax + (bx - ax) * t, ay + (0.07 - ay) * t, az + (bz - az) * t], rot: [0, -Math.atan2(bz - az, bx - ax), Math.atan2(0.07 - ay, Math.hypot(bx - ax, bz - az))] });
  mg.add(new THREE.CylinderGeometry(0.012, 0.006, 0.22, 6), f.galv, { at: [bx, -0.02, bz] });
  mg.add(new THREE.TorusGeometry(0.018, 0.004, 4, 10), f.galv, { at: [bx, 0.075, bz], rot: [PI / 2, 0, 0] });
}

function eyelet(mg, f, p, n) {
  const g = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...n).normalize()));
  mg.add(g, f.galv, { at: p });
}

export function tent(ctx, v) {
  if (v === 'dome') return domeTent(ctx);
  const { f, trim, root, anims } = ctx;
  const open = trim === 'open';
  const P = { 'a-frame': { L: 2.2, W: 1.7, H: 1.15, bay: 1.1 }, command: { L: 4.8, W: 4.2, H: 2.9, bay: 1.6 }, 'field-hospital': { L: 8, W: 5, H: 2.9, bay: 1.6 }, 'arched-shelter': { L: 6, W: 4, H: 2.5, bay: 1.5 } }[v];
  const { L, W, H } = P;
  const prof = profileOf(v, W, H);
  const nb = Math.max(1, Math.round(L / P.bay));
  const ribX = Array.from({ length: nb + 1 }, (_, i) => -L / 2 + (i * L) / nb);
  // skin grid with sag between ribs (none at the ribs, the feet or the ridge line of an A-frame)
  const NX = nb * 10;
  const pos = [];
  const uv = [];
  const sag = v === 'a-frame' ? 0.03 : 0.06;
  for (let i = 0; i <= NX; i++) {
    const x = -L / 2 + (i / NX) * L;
    const frac = ((i % 10) / 10);
    for (const p of prof.pts) {
      const edge = Math.sin(PI * Math.min(1, p.s / prof.S));
      const d = sag * Math.sin(PI * frac) * Math.min(1, edge * 1.6) * (p.y < 0.05 ? 0 : 1);
      pos.push(x, p.y - p.ny * d, p.z - p.nz * d);
      uv.push((x + L / 2) / L, 1 - p.s / prof.S);
    }
  }
  const NP = prof.pts.length;
  const idx = [];
  for (let i = 0; i < NX; i++) for (let k = 0; k < NP - 1; k++) {
    const a = i * NP + k;
    idx.push(a, a + 1, a + NP, a + 1, a + NP + 1, a + NP);
  }
  const skin = new THREE.BufferGeometry();
  skin.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  skin.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  skin.setIndex(idx);
  skin.computeVertexNormals();
  // where on the arch (arc length) is a given height on the side walls
  const sAt = (y, side) => {
    const list = side < 0 ? prof.pts : prof.pts.slice().reverse();
    const p = list.find((q) => q.y >= y) ?? list[list.length - 1];
    return side < 0 ? p.s : p.s;
  };
  const windows = [];
  if (v !== 'a-frame') {
    for (let i = 0; i < nb; i++) for (const side of [-1, 1]) {
      const s = sAt(Math.min(1.45, H * 0.45), side);
      windows.push({ u: (ribX[i] + ribX[i + 1]) / 2 + L / 2, s, w: Math.min(0.9, P.bay * 0.5), h: 0.5 });
    }
  }
  const crosses = [];
  if (v === 'field-hospital') {
    for (const u of [L * 0.25, L * 0.75]) for (const s of [prof.S * 0.32, prof.S * 0.68]) crosses.push({ u, s, r: 0.85 });
  }
  const tex = skinTexture(f.tone, { L, S: prof.S, ribs: ribX.map((x) => x + L / 2), windows, crosses });
  const cmat = skinMat(tex, f.canvas.color);
  const sk = new THREE.Mesh(skin, cmat);
  sk.name = 'canvas';
  root.add(sk);
  const mg = new Merge();
  // end walls (back closed, front with a framed door opening)
  const wallMat = skinMat(null, f.canvas.color.clone().multiplyScalar(0.94));
  const dw = Math.min(1.2, W * 0.38);
  const dh = Math.min(1.95, H * 0.78);
  for (const front of [false, true]) {
    const sh = new THREE.Shape(prof.pts.map((p) => new THREE.Vector2(p.z, p.y)));
    if (front) sh.holes.push(new THREE.Path([[-dw / 2, 0.001], [dw / 2, 0.001], [dw / 2, dh], [-dw / 2, dh]].map(([a, b]) => new THREE.Vector2(a, b)).reverse()));
    const g = new THREE.ShapeGeometry(sh, 12);
    g.rotateY(PI / 2);
    mg.add(g, wallMat, { at: [front ? L / 2 : -L / 2, 0, 0] });
  }
  if (v === 'field-hospital') {
    // painted roundel on the rear wall (flush, printed on the fabric)
    const rc = H * 0.62;
    mg.add(new THREE.CircleGeometry(0.6, 32).rotateY(-PI / 2), f.white, { at: [-L / 2 - 0.002, rc, 0] });
    mg.add(new THREE.PlaneGeometry(0.75, 0.24).rotateY(-PI / 2), f.red, { at: [-L / 2 - 0.004, rc, 0] });
    mg.add(new THREE.PlaneGeometry(0.24, 0.75).rotateY(-PI / 2), f.red, { at: [-L / 2 - 0.004, rc, 0] });
  }
  // frame: ribs (external arches on arch tents, poles on ridge tents)
  const ribTube = (x) => mg.pipe(prof.pts.filter((_, k) => k % 3 === 0 || k === NP - 1).map((p) => [x, p.y + p.ny * 0.018, p.z + p.nz * 0.018]), 0.016, f.rib, 60, 6);
  if (v === 'arched-shelter' || v === 'field-hospital') ribX.forEach(ribTube);
  else {
    const top = Math.max(...prof.pts.map((p) => p.y));
    mg.tube([-L / 2 - 0.05, top + 0.01, 0], [L / 2 + 0.05, top + 0.01, 0], 0.02, f.iron, 8);
    for (const x of ribX) mg.tube([x, 0, 0], [x, top, 0], 0.024, f.iron, 8);
    for (const x of [-L / 2 - 0.05, L / 2 + 0.05]) mg.add(new THREE.SphereGeometry(0.03, 8, 6), f.iron, { at: [x, top + 0.01, 0] });
  }
  // door frame + zipped flaps
  const fx = L / 2 + 0.012;
  for (const s of [-1, 1]) mg.tube([fx, 0, s * dw / 2], [fx, dh, s * dw / 2], 0.018, f.rib, 8);
  mg.tube([fx, dh, -dw / 2], [fx, dh, dw / 2], 0.018, f.rib, 8);
  if (open) {
    mg.add(new THREE.CylinderGeometry(0.075, 0.075, dw, 16).rotateX(PI / 2), f.canvasDark, { at: [fx + 0.06, dh - 0.06, 0] });
    for (const s of [-1, 1]) {
      mg.add(new THREE.BoxGeometry(0.006, 0.22, 0.025), f.rope2, { at: [fx + 0.1, dh - 0.12, s * dw * 0.3] });
      mg.tube([fx + 0.03, dh, s * dw * 0.3], [fx + 0.1, dh - 0.02, s * dw * 0.3], 0.004, f.rope2, 4);
    }
  } else {
    const flaps = [];
    for (const s of [-1, 1]) {
      const fl = group(`door_${s < 0 ? 'L' : 'R'}`, { parent: root, at: [fx, 0, s * dw / 2] });
      const fm = new Merge();
      fm.add(new THREE.PlaneGeometry(dw / 2, dh - 0.02, 4, 8).rotateY(PI / 2), wallMat, { at: [0.002, (dh - 0.02) / 2, -s * dw / 4] });
      fm.add(roundedBox(0.012, dh - 0.04, 0.018, 0.004, 1), f.zip, { at: [0.006, dh / 2, -s * (dw / 2 - 0.01)] });
      fm.add(new THREE.BoxGeometry(0.02, 0.05, 0.012), f.galv, { at: [0.012, dh * 0.55, -s * (dw / 2 - 0.02)] });
      fm.flush(fl, `door_${s < 0 ? 'L' : 'R'}_body`);
      flaps.push([fl, s]);
    }
    anims.push(clip('door', 5, flaps.map(([fl, s]) => rotateTrack(fl, 'y', 5, (t) => keys([[0, 0], [0.3, 1], [0.7, 1], [1, 0]])(t) * 1.45 * s))));
  }
  // guy ropes: eyelets at the ribs, pegs out on both sides; front/back stays on ridge tents
  const gi = prof.pts.findIndex((p) => p.y >= H * (v === 'a-frame' ? 0.7 : 0.5));
  for (const x of ribX) for (const side of [-1, 1]) {
    const p = side < 0 ? prof.pts[gi] : prof.pts[NP - 1 - gi];
    const e = [x, p.y, p.z];
    eyelet(mg, f, e, [0, p.ny, p.nz]);
    guyRope(mg, f, e, [x, 0, side * (W / 2 + Math.max(0.8, H * 0.55))]);
  }
  if (v === 'a-frame' || v === 'command') {
    const top = Math.max(...prof.pts.map((p) => p.y));
    for (const s of [-1, 1]) guyRope(mg, f, [s * (L / 2 + 0.05), top + 0.01, 0], [s * (L / 2 + 1.1), 0, 0]);
  }
  // sod-cloth skirt lying on the ground around the base
  for (const s of [-1, 1]) {
    mg.add(new THREE.PlaneGeometry(L, 0.22).rotateX(-PI / 2), f.canvasDark, { at: [0, 0.004, s * (W / 2 + 0.11)] });
    mg.add(new THREE.PlaneGeometry(0.22, W).rotateX(-PI / 2), f.canvasDark, { at: [s * (L / 2 + 0.11), 0.004, 0] });
  }
  // interiors
  if (v === 'field-hospital') for (let i = 0; i < 4; i++) for (const s of [1, -1]) cot(mg, f, [-L / 2 + 1.2 + i * 1.6, 0, s * 1.5]);
  if (v === 'a-frame') for (const s of [1, -1]) mg.add(cushion(0.62, 0.08, 1.8, { bulge: 0.2 }).rotateY(PI / 2), f.cot, { at: [0, 0.04, s * 0.34] });
  if (v === 'command') {
    mg.add(roundedBox(1.8, 0.04, 0.9, 0.01, 2), f.wood, { at: [-0.5, 0.76, 0.8] });
    for (const [x, z] of [[-1.3, 0.45], [0.3, 0.45], [-1.3, 1.15], [0.3, 1.15]]) mg.tube([x, 0, z], [x, 0.74, z], 0.018, f.iron, 6);
    // stove + stovepipe through a flashing collar on the roof slope
    const sz = W * 0.25;
    const roofY = H * 0.62 + (H - H * 0.62) * (1 - sz / (W / 2));
    const sx = -L / 4;
    mg.add(roundedBox(0.5, 0.45, 0.4, 0.04, 2), f.iron, { at: [sx, 0.225, sz] });
    mg.tube([sx, 0.45, sz], [sx, roofY + 0.9, sz], 0.065, f.galv, 14);
    mg.add(new THREE.CylinderGeometry(0.09, 0.22, 0.12, 18), f.galv, { at: [sx, roofY + 0.02, sz] });
    mg.add(new THREE.ConeGeometry(0.16, 0.12, 16), f.iron, { at: [sx, roofY + 0.96, sz] });
  }
  if (trim === 'arctic') {
    const top = Math.max(...prof.pts.map((p) => p.y));
    mg.add(cushion(L * 0.9, 0.1, Math.min(W * 0.4, 1.4), { bulge: 0.6 }), f.snow, { at: [0, top - 0.02, 0] });
    for (let i = 0; i < 6; i++) mg.add(cushion(1.0, 0.14, 0.45, { bulge: 0.6 }), f.snow, { at: [-L / 2 + (i + 0.5) * (L / 6), 0.05, (i % 2 ? 1 : -1) * (W / 2 + 0.25)] });
  }
  if (trim === 'woodland-net') netOver(mg, f, rng('tnet'), H + 0.05, Math.max(L, W) * 0.62, H * 0.9);
  mg.flush(root, 'tent');
  anims.push(clip('wind', 3, [rotateTrack(sk, 'x', 3, (t) => wave(t) * 0.004)]));
}

function domeTent(ctx) {
  const { f, trim, root, anims } = ctx;
  const R = 1.3;
  const H = 1.25;
  const open = trim === 'open';
  const poles = [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4];
  const NT = 72;
  const NPh = 22;
  const pos = [];
  const uv = [];
  const surf = (th, ph, withSag = true) => {
    let d = PI;
    for (const a of poles) d = Math.min(d, Math.abs(Math.atan2(Math.sin(th - a), Math.cos(th - a))));
    const k = withSag ? 1 - 0.07 * Math.sin((d / (PI / 4)) * (PI / 2)) * Math.sin(Math.min(PI, ph * 2.4)) : 1;
    return [Math.cos(th) * Math.cos(ph) * R * k, Math.sin(ph) * H * (withSag ? 1 - 0.03 * (1 - k) * 10 * 0.2 : 1), Math.sin(th) * Math.cos(ph) * R * k];
  };
  for (let j = 0; j <= NPh; j++) {
    const ph = (j / NPh) * (PI / 2);
    for (let i = 0; i <= NT; i++) {
      const th = (i / NT) * PI * 2;
      pos.push(...surf(th, ph));
      uv.push(i / NT, j / NPh);
    }
  }
  const idx = [];
  for (let j = 0; j < NPh; j++) for (let i = 0; i < NT; i++) {
    const a = j * (NT + 1) + i;
    idx.push(a, a + NT + 1, a + 1, a + 1, a + NT + 1, a + NT + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // texture in (circumference m, arc m)
  const C = 2 * PI * R;
  const S = 1.9;
  const tex = skinTexture(f.tone, { L: C, S, ribs: poles.map((a) => (a / (2 * PI)) * C), windows: [{ u: C * 0.5, s: S - 0.75, w: 0.5, h: 0.3 }], crosses: [], door: { u: C * 0.25, s0: S, w: 0.9, h: 1.05, open } });
  if (tex) { tex.wrapS = THREE.RepeatWrapping; tex.flipY = true; }
  const sk = new THREE.Mesh(g, skinMat(tex, f.canvas.color));
  sk.name = 'canvas';
  root.add(sk);
  // door also at u=1 (wrap) — duplicate the door half via texture offset trick is unnecessary: door centred on θ=0 seam
  const mg = new Merge();
  // poles: two crossing arcs riding just outside the skin
  for (const a of [PI / 4, (3 * PI) / 4]) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const ph = (i / 24) * PI;
      const th = ph < PI / 2 ? a : a + PI;
      const pp = ph < PI / 2 ? ph : PI - ph;
      const p = surf(th, pp, false);
      pts.push([p[0] * 1.012, p[1] + 0.012, p[2] * 1.012]);
    }
    mg.pipe(pts, 0.011, f.rib, 64, 6);
  }
  for (const a of poles) mg.add(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 8), f.rib, { at: [Math.cos(a) * R * 1.012, 0.025, Math.sin(a) * R * 1.012] });
  // door: zipped D-panel printed on the canvas; rolled flap when open
  if (open) {
    const p = surf(PI / 2, 0.9);
    mg.add(new THREE.CylinderGeometry(0.055, 0.055, 0.9, 14).rotateZ(PI / 2), f.canvasDark, { at: [0, p[1], p[2] + 0.03] });
  }
  // guy ropes from eyelets between the poles
  for (const a of poles) {
    const p = surf(a, 0.75, false);
    const e = [p[0] * 1.0, p[1], p[2] * 1.0];
    eyelet(mg, f, e, [Math.cos(a), 0.6, Math.sin(a)]);
    guyRope(mg, f, e, [Math.cos(a) * (R + 0.9), 0, Math.sin(a) * (R + 0.9)]);
  }
  mg.add(new THREE.RingGeometry(R * 0.99, R + 0.16, 48).rotateX(-PI / 2), f.canvasDark, { at: [0, 0.004, 0] });
  mg.add(cushion(0.65, 0.07, 1.85, { bulge: 0.2 }), f.cot, { at: [-0.2, 0.035, 0] });
  if (trim === 'arctic') {
    mg.add(new THREE.SphereGeometry(1, 24, 8, 0, PI * 2, 0, PI / 2).scale(0.8, 0.12, 0.8), f.snow, { at: [0, H - 0.08, 0] });
    for (let i = 0; i < 5; i++) mg.add(cushion(0.8, 0.13, 0.45, { bulge: 0.6 }).rotateY(-i * 1.3), f.snow, { at: [Math.cos(i * 1.3) * (R + 0.15), 0.05, Math.sin(i * 1.3) * (R + 0.15)] });
  }
  if (trim === 'woodland-net') netOver(mg, f, rng('tnet'), H + 0.05, 2.2, H * 0.95);
  mg.flush(root, 'tent');
  anims.push(clip('wind', 3, [rotateTrack(sk, 'y', 3, (t) => wave(t) * 0.006)]));
}

export function tentMats(f) {
  f.rope = M.matte('#2c2a24', 0.9);
  f.rope2 = M.matte('#3a362c', 0.8);
  f.rib = M.metal('#7c8084', 0.4);
  f.zip = M.matte('#151515', 0.5);
  return f;
}
