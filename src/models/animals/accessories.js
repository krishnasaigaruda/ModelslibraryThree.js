import * as THREE from 'three';
import { surfacePoint, spline, loft, lerp, smooth01, skinnedMesh, applySkin, C } from './core.js';
import { roundedBox } from '../../core/utils.js';

/*
 * Accessories worn by quadrupeds. Body-hugging pieces (sweaters, blankets,
 * saddle pads, vests) are lofted shells over the body surface and skinned with
 * the body's own weights so they move with it; straps are flat bands that hug
 * the surface; hardware is parented to the bone it moves with.
 *
 * collar, spiked-collar, bell-collar, bow, harness, sweater, raincoat, bandana,
 * service-vest, saddle, western-saddle, racing, bridle, halter, blanket,
 * packsaddle, cowbell, ear-tag, nose-ring, decorated
 */

const mats = {
  leather: (c = '#5a3620') => new THREE.MeshStandardMaterial({ name: 'leather', color: C(c), roughness: 0.5 }),
  fabric: (c) => new THREE.MeshStandardMaterial({ name: 'fabric', color: C(c), roughness: 0.92, side: THREE.DoubleSide }),
  knit: (c) => new THREE.MeshPhysicalMaterial({ name: 'knit', color: C(c), roughness: 1, sheen: 1, sheenRoughness: 0.8, sheenColor: C(c).lerp(new THREE.Color('#ffffff'), 0.4), side: THREE.DoubleSide }),
  plastic: (c) => new THREE.MeshPhysicalMaterial({ name: 'raincoat', color: C(c), roughness: 0.25, clearcoat: 0.6, side: THREE.DoubleSide }),
  metal: (c = '#c9a64a') => new THREE.MeshStandardMaterial({ name: 'metal', color: C(c), roughness: 0.28, metalness: 1 }),
};

/** Flat strap hugging the body around the loft section at t (closed loop). */
function strapLoop(ctx, curve, sec, t, { width, thick = 0.004, grow = 0.002, from = 0, to = Math.PI * 2, ring = 40 }) {
  const pos = [];
  const idx = [];
  const T = curve.getTangentAt(t).normalize();
  const closed = to - from >= Math.PI * 2 - 1e-6;
  const n = closed ? ring : ring + 1;
  for (let j = 0; j < n; j++) {
    const a = from + ((to - from) * j) / ring;
    const s = surfacePoint(curve, sec, t, a);
    const o = s.p.clone().addScaledVector(s.n, grow);
    const i = o.clone().addScaledVector(s.n, thick);
    for (const [base, k] of [[o, -1], [o, 1], [i, 1], [i, -1]]) {
      const p = base.clone().addScaledVector(T, (k * width) / 2);
      pos.push(p.x, p.y, p.z);
    }
  }
  const segs = closed ? ring : ring;
  for (let j = 0; j < segs; j++) {
    const a = j * 4;
    const b = ((j + 1) % n) * 4;
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      idx.push(a + k, b + k, a + k2, a + k2, b + k, b + k2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Shell over the body between ta..tb, pushed out by grow; keep(sy, sx) filters which part of the ring stays. */
function bodyShell(ctx, ta, tb, grow, keep) {
  const { bodyCurve, bodySec } = ctx;
  const g = loft(bodyCurve, (t) => {
    const s = bodySec(t);
    return { ...s, w: s.w + grow, up: s.up + grow, dn: s.dn + grow };
  }, { n: 40, ring: 32, range: [ta, tb], capStart: false, capEnd: false });
  if (keep) {
    const sy = g.attributes.sy.array;
    const sx = g.attributes.sx.array;
    const idx = g.index.array;
    const out = [];
    for (let i = 0; i < idx.length; i += 3) {
      if (keep(sy[idx[i]], sx[idx[i]]) && keep(sy[idx[i + 1]], sx[idx[i + 1]]) && keep(sy[idx[i + 2]], sx[idx[i + 2]])) out.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    g.setIndex(out);
  }
  return g;
}

function skinToBody(ctx, g, ta, tb) {
  const lt = g.attributes.lt?.array;
  const { bodyCurve } = ctx;
  if (lt) applySkin(g, (i) => ctx.bodyWeights(lerp(ta, tb, lt[i])));
  else {
    // nearest body parameter by z (straps): sample
    const P = g.attributes.position;
    applySkin(g, (i) => ctx.bodyWeights(nearT(bodyCurve, P.getZ(i), P.getY(i))));
  }
  return g;
}

const _q = new THREE.Vector3();
function nearT(curve, z, y) {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i <= 60; i++) {
    curve.getPointAt(i / 60, _q);
    const d = (_q.z - z) ** 2 + (_q.y - y) ** 2 * 0.3;
    if (d < bd) {
      bd = d;
      best = i / 60;
    }
  }
  return best;
}

function addSkinned(root, ctx, g, mat, name) {
  const m = skinnedMesh(g, mat, ctx.skeleton, name);
  root.add(m);
  return m;
}

function attach(ctx, bone, mesh) {
  const w = ctx.rig.world[bone];
  if (mesh.position.lengthSq() === 0) mesh.geometry.translate(-w.x, -w.y, -w.z);
  else mesh.position.sub(w);
  ctx.rig.get(bone).add(mesh);
  return mesh;
}

export function addAccessories(root, list, ctx) {
  const { bodyCurve, bodySec, T, H, D, headCurve, headSec, hl, tm } = ctx;
  const neckT = lerp(T.p4, T.n1, 0.62);
  const chestT = lerp(T.p3, T.p4, 0.15);
  for (const acc of list) {
    const name = typeof acc === 'string' ? acc : acc.type;
    const color = acc.color;
    switch (name) {
      case 'collar':
      case 'spiked-collar':
      case 'bell-collar':
      case 'bow': {
        const g = strapLoop(ctx, bodyCurve, bodySec, neckT, { width: H * 0.035, thick: H * 0.008, grow: H * 0.004 });
        skinToBody(ctx, g, 0, 1);
        addSkinned(root, ctx, g, name === 'bow' ? mats.fabric(color ?? '#e0457b') : mats.leather(color ?? (name === 'spiked-collar' ? '#1b1b1b' : '#b3261e')), 'collar');
        const front = surfacePoint(bodyCurve, bodySec, neckT, Math.PI);
        if (name === 'bell-collar' || name === 'collar') {
          const tag = new THREE.Mesh(name === 'bell-collar' ? new THREE.SphereGeometry(H * 0.026, 14, 10) : new THREE.CylinderGeometry(H * 0.03, H * 0.03, H * 0.005, 24).rotateX(Math.PI / 2), mats.metal(name === 'bell-collar' ? '#d8b04a' : '#c8c8c8'));
          tag.position.copy(front.p).addScaledVector(front.n, H * 0.016).add(new THREE.Vector3(0, -H * 0.022, 0));
          tag.name = 'tag';
          attach(ctx, 'neck1', tag);
        }
        if (name === 'spiked-collar') {
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            const s = surfacePoint(bodyCurve, bodySec, neckT, a);
            const sp = new THREE.Mesh(new THREE.ConeGeometry(H * 0.009, H * 0.022, 8), mats.metal('#d0d0d0'));
            sp.position.copy(s.p).addScaledVector(s.n, H * 0.018);
            sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.n);
            attach(ctx, 'neck1', sp);
          }
        }
        if (name === 'bow') {
          for (const sx of [1, -1]) {
            const lg = new THREE.SphereGeometry(H * 0.065, 14, 10);
            lg.scale(1.3, 0.8, 0.45);
            const l = new THREE.Mesh(lg, mats.fabric(color ?? '#e0457b'));
            l.position.copy(front.p).addScaledVector(front.n, H * 0.03).add(new THREE.Vector3(sx * H * 0.07, 0, 0));
            attach(ctx, 'neck1', l);
          }
        }
        break;
      }
      case 'harness': {
        const c = color ?? '#2f62c4';
        for (const [t, w] of [[neckT - 0.02, 0.06], [chestT - 0.02, 0.08]]) {
          const g = strapLoop(ctx, bodyCurve, bodySec, t, { width: H * w, thick: H * 0.008, grow: H * 0.005 });
          skinToBody(ctx, g, 0, 1);
          addSkinned(root, ctx, g, mats.leather(c), 'harness');
        }
        // back pad joining the two
        const pad = bodyShell(ctx, chestT - 0.04, neckT - 0.04, H * 0.012, (sy) => sy > 0.35);
        skinToBody(ctx, pad, chestT - 0.02, neckT - 0.04);
        addSkinned(root, ctx, pad, mats.fabric(c), 'harness_pad');
        const top = surfacePoint(bodyCurve, bodySec, lerp(chestT, neckT, 0.4), 0);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(H * 0.022, H * 0.005, 8, 18), mats.metal('#c8c8c8'));
        ring.position.copy(top.p).addScaledVector(top.n, H * 0.03);
        attach(ctx, 'chest', ring);
        break;
      }
      case 'sweater':
      case 'raincoat':
      case 'service-vest': {
        const ta = name === 'service-vest' ? lerp(T.p2, T.p3, 0.3) : lerp(T.p1, T.p2, 0.5);
        const tb = name === 'service-vest' ? lerp(T.p3, T.p4, 0.7) : lerp(T.p4, T.n1, 0.45);
        const g = bodyShell(ctx, ta, tb, H * (name === 'sweater' ? 0.012 : 0.008), name === 'raincoat' ? (sy) => sy > -0.55 : null);
        skinToBody(ctx, g, ta, tb);
        const mat = name === 'sweater' ? mats.knit(color ?? '#b52a3a') : name === 'raincoat' ? mats.plastic(color ?? '#f2c200') : mats.fabric(color ?? '#c0392b');
        addSkinned(root, ctx, g, mat, name);
        if (name === 'sweater') {
          // ribbed cuffs at both ends
          for (const t of [ta + 0.005, tb - 0.005]) {
            const r = strapLoop(ctx, bodyCurve, bodySec, t, { width: H * 0.03, thick: H * 0.012, grow: H * 0.014 });
            skinToBody(ctx, r, 0, 1);
            addSkinned(root, ctx, r, mats.knit(C(color ?? '#b52a3a').multiplyScalar(0.8)), 'cuff');
          }
        }
        if (name === 'service-vest') {
          for (const sx of [1, -1]) {
            const s = surfacePoint(bodyCurve, bodySec, lerp(ta, tb, 0.5), sx * 1.2);
            const patch = new THREE.Mesh(roundedBox(H * 0.004, H * 0.07, H * 0.14, H * 0.002, 2), mats.fabric('#f4f4f0'));
            patch.position.copy(s.p).addScaledVector(s.n, H * 0.012);
            patch.lookAt(patch.position.clone().add(s.n));
            patch.rotateY(Math.PI / 2);
            attach(ctx, 'body', patch);
          }
        }
        break;
      }
      case 'bandana': {
        const g = bodyShell(ctx, neckT - 0.03, neckT + 0.03, H * 0.008, (sy) => sy < 0.2);
        skinToBody(ctx, g, neckT - 0.03, neckT + 0.03);
        addSkinned(root, ctx, g, mats.fabric(color ?? '#c0392b'), 'bandana');
        const f = surfacePoint(bodyCurve, bodySec, neckT, Math.PI);
        const shape = new THREE.Shape([new THREE.Vector2(-H * 0.12, 0), new THREE.Vector2(H * 0.12, 0), new THREE.Vector2(0, -H * 0.17)]);
        const tg = new THREE.ShapeGeometry(shape);
        const tri = new THREE.Mesh(tg, mats.fabric(color ?? '#c0392b'));
        tri.position.copy(f.p).addScaledVector(f.n, H * 0.012).add(new THREE.Vector3(0, H * 0.012, 0));
        tri.lookAt(tri.position.clone().add(f.n));
        attach(ctx, 'neck1', tri);
        break;
      }
      case 'saddle':
      case 'western-saddle':
      case 'racing': {
        const west = name === 'western-saddle';
        const tc = lerp(T.p2, T.p3, 0.55);
        const len = west ? 0.11 : 0.08;
        const pad = bodyShell(ctx, tc - len, tc + len, H * 0.006, (sy) => sy > (name === 'racing' ? -0.15 : 0.1));
        skinToBody(ctx, pad, tc - len, tc + len);
        addSkinned(root, ctx, pad, mats.fabric(color ?? (name === 'racing' ? '#f4f4f0' : west ? '#7a2a1e' : '#f0ece2')), 'saddle_pad');
        const seat = bodyShell(ctx, tc - len * 0.7, tc + len * 0.6, H * 0.02, (sy) => sy > 0.45);
        skinToBody(ctx, seat, tc - len * 0.7, tc + len * 0.6);
        addSkinned(root, ctx, seat, mats.leather(west ? '#6b3a1c' : '#3a2214'), 'saddle');
        // pommel / cantle / horn
        for (const [t, h] of [[tc + len * 0.55, 0.035], [tc - len * 0.65, 0.05]]) {
          const s = surfacePoint(bodyCurve, bodySec, t, 0);
          const g = new THREE.SphereGeometry(H * 0.05, 16, 10);
          g.scale(1.1, h / 0.05, 0.45);
          const m = new THREE.Mesh(g, mats.leather(west ? '#6b3a1c' : '#3a2214'));
          m.position.copy(s.p).addScaledVector(s.n, H * 0.02);
          attach(ctx, 'body', m);
        }
        if (west) {
          const s = surfacePoint(bodyCurve, bodySec, tc + len * 0.6, 0);
          const horn = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.016, H * 0.01, H * 0.06, 12), mats.leather('#4a2814'));
          horn.position.copy(s.p).addScaledVector(s.n, H * 0.06);
          attach(ctx, 'body', horn);
        }
        // girth
        const girth = strapLoop(ctx, bodyCurve, bodySec, tc + len * 0.3, { width: H * 0.04, thick: H * 0.006, grow: H * 0.007 });
        skinToBody(ctx, girth, 0, 1);
        addSkinned(root, ctx, girth, mats.leather('#2a1a10'), 'girth');
        // stirrups on leathers
        for (const sx of [1, -1]) {
          const s = surfacePoint(bodyCurve, bodySec, tc, sx * 1.35);
          const top = s.p.clone().addScaledVector(s.n, H * 0.012);
          const bottomY = H - D * 0.95;
          const strap = new THREE.Mesh(new THREE.BoxGeometry(H * 0.004, top.y - bottomY, H * 0.02), mats.leather('#3a2214'));
          strap.position.set(top.x + sx * H * 0.006, (top.y + bottomY) / 2, top.z);
          attach(ctx, 'body', strap);
          const st = new THREE.Mesh(new THREE.TorusGeometry(H * 0.035, H * 0.006, 8, 20, Math.PI * 1.3), mats.metal('#bfbfbf'));
          st.rotation.set(0, Math.PI / 2, Math.PI + Math.PI * 0.35);
          st.position.set(top.x + sx * H * 0.006, bottomY + H * 0.005, top.z);
          attach(ctx, 'body', st);
        }
        if (name === 'racing') {
          for (const sx of [1, -1]) {
            const s = surfacePoint(bodyCurve, bodySec, tc - len * 0.3, sx * 1.6);
            const numCloth = new THREE.Mesh(roundedBox(H * 0.004, H * 0.12, H * 0.14, H * 0.002, 2), mats.fabric('#ffffff'));
            numCloth.position.copy(s.p).addScaledVector(s.n, H * 0.01);
            numCloth.lookAt(numCloth.position.clone().add(s.n));
            numCloth.rotateY(Math.PI / 2);
            attach(ctx, 'body', numCloth);
          }
        }
        break;
      }
      case 'bridle':
      case 'halter': {
        const c = color ?? (name === 'halter' ? '#c0392b' : '#2a1a10');
        const mat = mats.leather(c);
        for (const t of [lerp(tm, 1, 0.55), tm * 0.12]) {
          const g = strapLoop(ctx, headCurve, headSec, t, { width: hl * 0.05, thick: hl * 0.012, grow: hl * 0.006 });
          const m = new THREE.Mesh(g, mat);
          attach(ctx, 'head', m);
        }
        // cheek straps
        for (const sx of [1, -1]) {
          const pts = [];
          for (let k = 0; k <= 10; k++) {
            const t = lerp(tm * 0.12, lerp(tm, 1, 0.55), k / 10);
            const s = surfacePoint(headCurve, headSec, t, sx * 1.45);
            pts.push(s.p.clone().addScaledVector(s.n, hl * 0.012));
          }
          const g = new THREE.TubeGeometry(spline(pts), 20, hl * 0.012, 6, false);
          attach(ctx, 'head', new THREE.Mesh(g, mat));
          if (name === 'bridle') {
            const s = surfacePoint(headCurve, headSec, 0.9, sx * 1.9);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(hl * 0.04, hl * 0.008, 8, 16), mats.metal('#cfcfcf'));
            ring.position.copy(s.p).addScaledVector(s.n, hl * 0.01);
            ring.rotation.y = Math.PI / 2;
            attach(ctx, 'head', ring);
          }
        }
        if (name === 'bridle') {
          // reins from the bit rings back over the neck
          const pts = [];
          for (const k of [0, 0.25, 0.5, 0.75, 1]) {
            const t = lerp(T.n1, T.p4, k);
            const s = surfacePoint(bodyCurve, bodySec, t, 0);
            pts.push(s.p.clone().addScaledVector(s.n, H * 0.01 + Math.sin(k * Math.PI) * H * 0.03));
          }
          const g = new THREE.TubeGeometry(spline(pts), 24, H * 0.004, 6, false);
          const m = new THREE.Mesh(g, mat);
          const tg = strapLoop(ctx, bodyCurve, bodySec, T.n1, { width: H * 0.008, thick: H * 0.004, grow: H * 0.004, from: -1.2, to: 1.2, ring: 16 });
          applySkin(tg, () => [[ctx.rig.index('neck2'), 1]]);
          addSkinned(root, ctx, tg, mat, 'reins');
          applySkin(g, (i) => ctx.bodyWeights(nearT(bodyCurve, g.attributes.position.getZ(i), g.attributes.position.getY(i))));
          addSkinned(root, ctx, g, mat, 'reins');
        }
        break;
      }
      case 'blanket':
      case 'decorated': {
        const ta = lerp(T.p1, T.p2, 0.25);
        const tb = lerp(T.p3, T.p4, 0.6);
        const g = bodyShell(ctx, ta, tb, H * 0.01, (sy) => sy > (name === 'decorated' ? -0.1 : -0.5));
        skinToBody(ctx, g, ta, tb);
        if (name === 'decorated') {
          // coloured cloth with golden border: vertex colours by ring position
          const sy = g.attributes.sy.array;
          const lt = g.attributes.lt.array;
          const col = new Float32Array(sy.length * 3);
          for (let i = 0; i < sy.length; i++) {
            const border = sy[i] < 0.05 || lt[i] < 0.06 || lt[i] > 0.94;
            const c = border ? C('#d4a017') : C(color ?? '#a3162a').lerp(C('#5a0f6a'), 0.5 + 0.5 * Math.sin(lt[i] * 30) > 0.8 ? 0.6 : 0);
            col.set([c.r, c.g, c.b], i * 3);
          }
          g.setAttribute('color', new THREE.BufferAttribute(col, 3));
          addSkinned(root, ctx, g, new THREE.MeshStandardMaterial({ name: 'cloth', vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), 'decorated');
          const fh = surfacePoint(headCurve, headSec, tm * 0.6, 0);
          const plate = new THREE.Mesh(new THREE.CircleGeometry(hl * 0.22, 24), new THREE.MeshStandardMaterial({ color: '#d4a017', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }));
          plate.position.copy(fh.p).addScaledVector(fh.n, hl * 0.01);
          plate.lookAt(plate.position.clone().add(fh.n));
          attach(ctx, 'head', plate);
        } else {
          addSkinned(root, ctx, g, mats.fabric(color ?? '#2c4a7c'), 'blanket');
          const sg = strapLoop(ctx, bodyCurve, bodySec, lerp(T.p3, T.p4, 0.5), { width: H * 0.03, thick: H * 0.005, grow: H * 0.014 });
          skinToBody(ctx, sg, 0, 1);
          addSkinned(root, ctx, sg, mats.leather('#1d1d1d'), 'blanket_strap');
        }
        break;
      }
      case 'packsaddle': {
        const tc = lerp(T.p2, T.p3, 0.45);
        const pad = bodyShell(ctx, tc - 0.08, tc + 0.08, H * 0.008, (sy) => sy > 0.0);
        skinToBody(ctx, pad, tc - 0.08, tc + 0.08);
        addSkinned(root, ctx, pad, mats.fabric(color ?? '#7a6a4a'), 'pack_pad');
        for (const sx of [1, -1]) {
          const s = surfacePoint(bodyCurve, bodySec, tc, sx * 1.45);
          const bag = new THREE.Mesh(roundedBox(H * 0.12, H * 0.2, H * 0.28, H * 0.03, 3), mats.fabric('#6b5236'));
          bag.position.copy(s.p).addScaledVector(s.n, H * 0.06);
          attach(ctx, 'body', bag);
        }
        break;
      }
      case 'cowbell': {
        const g = strapLoop(ctx, bodyCurve, bodySec, neckT, { width: H * 0.09, thick: H * 0.012, grow: H * 0.006 });
        skinToBody(ctx, g, 0, 1);
        addSkinned(root, ctx, g, mats.leather(color ?? '#b3261e'), 'collar');
        const f = surfacePoint(bodyCurve, bodySec, neckT, Math.PI);
        const bell = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(H * 0.075, 0), new THREE.Vector2(H * 0.055, H * 0.13), new THREE.Vector2(H * 0.02, H * 0.16), new THREE.Vector2(0.001, H * 0.162)], 18), mats.metal('#b88a3a'));
        bell.position.copy(f.p).addScaledVector(f.n, H * (0.03 + (ctx.S.wool ?? 0) * 1.6)).add(new THREE.Vector3(0, -H * 0.16, 0));
        attach(ctx, 'neck1', bell);
        break;
      }
      case 'ear-tag': {
        const s = surfacePoint(headCurve, headSec, tm * 0.2, 1.45);
        const tag = new THREE.Mesh(roundedBox(hl * 0.12, hl * 0.12, hl * 0.015, hl * 0.02, 2), new THREE.MeshStandardMaterial({ color: color ?? '#f2c200', roughness: 0.5 }));
        tag.position.copy(s.p).addScaledVector(s.n, hl * 0.02).add(new THREE.Vector3(0, -hl * 0.06, 0));
        tag.rotation.y = Math.PI / 2;
        attach(ctx, 'head', tag);
        break;
      }
      case 'nose-ring': {
        const tip = headCurve.getPointAt(1);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(hl * 0.07, hl * 0.012, 8, 20), mats.metal('#c9a64a'));
        ring.position.copy(tip).add(new THREE.Vector3(0, -hl * 0.09, -hl * 0.01));
        attach(ctx, 'head', ring);
        break;
      }
      default:
        break;
    }
  }
  void smooth01;
}
