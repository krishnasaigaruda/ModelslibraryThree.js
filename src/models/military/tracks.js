import * as THREE from 'three';
import { group, lathe, roundedBox } from '../../core/utils.js';
import { clip } from '../../core/animation.js';
import { Merge } from '../vehicles/heavy-kit.js';

/*
 * Tank-style track: a belt of real links wrapped around a chain of circles
 * (front idler → road wheels → rear sprocket → return rollers), listed clockwise as seen
 * from +Z (vehicle faces +X). Each wheel/link animates in drive clips.
 */

const geoCache = new Map();
function cached(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

function roadWheelGeo(r, w, style) {
  return cached(`rw|${r}|${w}|${style}`, () => {
    const hw = w / 2;
    const parts = [];
    // twin road wheels with rubber tyres
    const disc = (z0, z1, mat) => ({ geo: lathe([[0.001, z0], [r * 0.9, z0], [r * 0.93, z0 + (z1 - z0) * 0.15], [r * 0.93, z1 - (z1 - z0) * 0.15], [r * 0.9, z1], [0.001, z1]], 20).rotateX(Math.PI / 2), mat });
    if (style === 'spoked') {
      parts.push(disc(-hw, -hw * 0.15, 'metal'), disc(hw * 0.15, hw, 'metal'));
    } else {
      // dished disc wheel
      const prof = [[0.001, -hw], [r * 0.3, -hw], [r * 0.55, -hw * 0.6], [r * 0.82, -hw * 0.55], [r * 0.9, -hw * 0.9], [r * 0.9, -hw * 0.1], [r * 0.82, -hw * 0.1], [r * 0.82, hw * 0.1], [r * 0.9, hw * 0.1], [r * 0.9, hw * 0.9], [r * 0.82, hw * 0.55], [r * 0.55, hw * 0.6], [r * 0.3, hw], [0.001, hw]];
      parts.push({ geo: lathe(prof, 20).rotateX(Math.PI / 2), mat: 'metal' });
    }
    for (const s of [1, -1]) parts.push({ geo: new THREE.TorusGeometry(r * 0.93, r * 0.075, 6, 22).translate(0, 0, s * hw * 0.55), mat: 'rubber' });
    parts.push({ geo: new THREE.CylinderGeometry(r * 0.22, r * 0.22, w * 1.05, 14).rotateX(Math.PI / 2), mat: 'metal' });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      parts.push({ geo: new THREE.CylinderGeometry(r * 0.03, r * 0.03, w * 1.08, 6).rotateX(Math.PI / 2).translate(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15, 0), mat: 'dark' });
    }
    return parts;
  });
}

function sprocketGeo(r, w, teeth) {
  return cached(`sp|${r}|${w}|${teeth}`, () => {
    const parts = [];
    for (const s of [1, -1]) {
      const shape = new THREE.Shape();
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i / (teeth * 2)) * Math.PI * 2;
        const rr = i % 2 ? r * 0.86 : r * 1.0;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (!i) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      const g = new THREE.ExtrudeGeometry(shape, { depth: w * 0.14, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
      g.translate(0, 0, s * w * 0.3 - w * 0.07);
      parts.push({ geo: g, mat: 'metal' });
    }
    parts.push({ geo: new THREE.CylinderGeometry(r * 0.55, r * 0.6, w * 0.9, 20).rotateX(Math.PI / 2), mat: 'dark' });
    parts.push({ geo: new THREE.CylinderGeometry(r * 0.25, r * 0.25, w * 1.05, 14).rotateX(Math.PI / 2), mat: 'metal' });
    return parts;
  });
}

function linkGeo(step, th, width, style) {
  return cached(`ln|${step.toFixed(3)}|${th}|${width}|${style}`, () => {
    const mg = new Merge();
    const tmp = new THREE.MeshStandardMaterial();
    const L = step * 0.94;
    // shoe plate, grouser bar (outer, local +Y), twin guide horns (inner, local -Y)
    const B = (w, h, d, at) => mg.add(new THREE.BoxGeometry(w, h, d), tmp, { at });
    mg.add(roundedBox(L, th, width, 0.012, 1), tmp);
    if (style === 'pads') {
      for (const z of [-width * 0.26, width * 0.26]) B(L * 0.8, 0.025, width * 0.4, [0, th / 2 + 0.01, z]);
    } else B(0.04, 0.03, width * 0.96, [-L * 0.15, th / 2 + 0.012, 0]);
    for (const z of [-0.035, 0.035]) B(L * 0.5, 0.07, 0.025, [0, -th / 2 - 0.03, z]);
    for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 6).rotateX(Math.PI / 2), tmp, { at: [L * 0.42, 0, s * (width / 2 + 0.01)] });
    const holder = new THREE.Group();
    const [m] = mg.flush(holder);
    return m.geometry;
  });
}

/**
 * tankTrack(parent, { name, z, width, circles: [{ x, y, r, kind }], mats, pitch, th, style, wheelStyle })
 * kind: 'idler' | 'road' | 'sprocket' | 'return'. Circles in clockwise order (front idler first,
 * road wheels front→rear, sprocket, return rollers rear→front).
 * Returns { group, drive(period, dir), step }.
 */
export function tankTrack(parent, { name, z, width = 0.6, circles, mats, pitch = 0.16, th = 0.07, style = 'steel', wheelStyle = 'disc', skipWheels = false }) {
  const g = group(name, { parent, at: [0, 0, z] });
  const C = circles.map((c) => ({ ...c, R: c.r + th / 2 + (c.kind === 'sprocket' ? -0.02 : 0) }));
  const n = C.length;
  // tangent normal for segment i → i+1 (outer tangent, clockwise belt)
  const segs = [];
  for (let i = 0; i < n; i++) {
    const a = C[i];
    const b = C[(i + 1) % n];
    const D = new THREE.Vector2(b.x - a.x, b.y - a.y);
    const L = D.length();
    const u = D.clone().divideScalar(L);
    const s = (a.R - b.R) / L;
    const w = new THREE.Vector2(-u.y, u.x);
    const nn = u.clone().multiplyScalar(s).add(w.multiplyScalar(Math.sqrt(Math.max(0, 1 - s * s))));
    segs.push({ nrm: nn, p1: new THREE.Vector2(a.x + nn.x * a.R, a.y + nn.y * a.R), p2: new THREE.Vector2(b.x + nn.x * b.R, b.y + nn.y * b.R) });
  }
  // path pieces: arc on circle i (from previous tangent to next), then line i
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const c = C[i];
    const nin = segs[(i - 1 + n) % n].nrm;
    const nout = segs[i].nrm;
    const aIn = Math.atan2(nin.y, nin.x);
    let aOut = Math.atan2(nout.y, nout.x);
    let sweep = aIn - aOut;
    while (sweep < 0) sweep += Math.PI * 2;
    while (sweep >= Math.PI * 2) sweep -= Math.PI * 2;
    if (sweep > Math.PI * 1.9) sweep = 0;
    aOut = aIn - sweep;
    if (sweep > 1e-4) pieces.push({ kind: 'arc', c, a0: aIn, a1: aOut, len: sweep * c.R });
    const sg = segs[i];
    const len = sg.p1.distanceTo(sg.p2);
    if (len > 1e-4) pieces.push({ kind: 'line', a: sg.p1, b: sg.p2, len });
  }
  const total = pieces.reduce((s, p) => s + p.len, 0);
  const at = (u) => {
    let w = ((u % total) + total) % total;
    for (const p of pieces) {
      if (w <= p.len) {
        if (p.kind === 'line') {
          const q = p.a.clone().lerp(p.b, w / p.len);
          return { p: q, a: Math.atan2(p.b.y - p.a.y, p.b.x - p.a.x) };
        }
        const t = p.a0 + (p.a1 - p.a0) * (w / p.len);
        return { p: new THREE.Vector2(p.c.x + Math.cos(t) * p.c.R, p.c.y + Math.sin(t) * p.c.R), a: t - Math.PI / 2 };
      }
      w -= p.len;
    }
    return { p: pieces[0].a ?? new THREE.Vector2(), a: 0 };
  };
  const count = Math.max(16, Math.round(total / pitch));
  const step = total / count;
  const lg = linkGeo(step, th, width, style);
  const links = [];
  for (let i = 0; i < count; i++) {
    const { p, a } = at(i * step);
    const link = new THREE.Mesh(lg, mats.track);
    link.name = `${name}_link${i}`;
    link.position.set(p.x, p.y, 0);
    link.rotation.z = a;
    g.add(link);
    links.push(link);
  }
  const wheels = [];
  const matOf = { metal: mats.plain ?? mats.steel, rubber: mats.wheelRubber ?? mats.rubber, dark: mats.iron };
  if (!skipWheels) C.forEach((c, i) => {
    const node = group(`${name}_${c.kind}${i}`, { parent: g, at: [c.x, c.y, 0] });
    let parts;
    if (c.kind === 'sprocket') parts = sprocketGeo(c.r, width, Math.max(9, Math.round((Math.PI * 2 * c.r) / step)));
    else if (c.kind === 'return') parts = roadWheelGeo(c.r, width * 0.5, 'spoked');
    else parts = roadWheelGeo(c.r, width * 0.86, c.kind === 'idler' ? 'spoked' : wheelStyle);
    const wm = new Merge();
    for (const pt of parts) wm.add(pt.geo, matOf[pt.mat]);
    wm.flush(node, `${name}_${c.kind}${i}_m`);
    wheels.push({ node, R: c.r });
  });

  function drive(period, dir = 1) {
    const tracks = [];
    const sub = 4;
    const times = [];
    for (let k = 0; k <= sub; k++) times.push((k / sub) * period);
    const q = new THREE.Quaternion();
    const zAx = new THREE.Vector3(0, 0, 1);
    links.forEach((link, i) => {
      const pos = [];
      const quat = [];
      for (let k = 0; k <= sub; k++) {
        const { p, a } = at(i * step + dir * (k / sub) * step);
        pos.push(p.x, p.y, 0);
        q.setFromAxisAngle(zAx, a);
        quat.push(q.x, q.y, q.z, q.w);
      }
      tracks.push(new THREE.VectorKeyframeTrack(`${link.name}.position`, times, pos));
      tracks.push(new THREE.QuaternionKeyframeTrack(`${link.name}.quaternion`, times, quat));
    });
    for (const w of wheels) {
      const base = w.node.quaternion.clone();
      const vals = [];
      for (let k = 0; k <= sub; k++) {
        const qq = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(zAx, -dir * (step / w.R) * (k / sub)));
        vals.push(qq.x, qq.y, qq.z, qq.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${w.node.name}.quaternion`, times, vals));
    }
    return tracks;
  }
  return { group: g, drive, step, links, wheels, total };
}

/** drive / reverse / turnLeft / turnRight for a left (+Z) and right (−Z) track. */
export function trackClips(left, right, speed = 2) {
  const P = left.step / speed;
  return [
    clip('drive', P, [...left.drive(P, 1), ...right.drive(P, 1)]),
    clip('reverse', P, [...left.drive(P, -1), ...right.drive(P, -1)]),
    clip('turnLeft', P, [...left.drive(P, -1), ...right.drive(P, 1)]),
    clip('turnRight', P, [...left.drive(P, 1), ...right.drive(P, -1)]),
  ];
}

/** Standard circle layout: idler (front, raised), N road wheels, sprocket (rear, raised), return rollers. */
export function trackLayout({ x0, x1, roadR, wheels, idlerR, sprR, idlerY, sprY, returns = 0, returnR = 0.1, topY, frontSprocket = false }) {
  const out = [];
  const front = { x: x1, y: idlerY, r: idlerR, kind: frontSprocket ? 'sprocket' : 'idler' };
  const rear = { x: x0, y: sprY, r: sprR, kind: frontSprocket ? 'idler' : 'sprocket' };
  out.push(front);
  const a = x1 - idlerR * 0.9 - roadR;
  const b = x0 + sprR * 0.9 + roadR;
  for (let i = 0; i < wheels; i++) out.push({ x: a + ((b - a) * i) / Math.max(1, wheels - 1), y: roadR, r: roadR, kind: 'road' });
  out.push(rear);
  for (let i = 0; i < returns; i++) out.push({ x: x0 + ((x1 - x0) * (i + 1)) / (returns + 1), y: topY - returnR, r: returnR, kind: 'return' });
  return out;
}
