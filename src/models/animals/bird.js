import * as THREE from 'three';
import { Rig, applySkin, chain, skinnedMesh, poseTrack, offsetTrack, loft, surfacePoint, spline, tNear, keyed, paint, furMaterial, noise3, fbm, smooth01, lerp, bump, TAU, C } from './core.js';
import { buildEye, hornMaterial } from './parts.js';
import { mergeSkinned } from './quad.js';
import { rng } from '../../core/utils.js';
import { clip } from '../../core/animation.js';

/*
 * Birds: one skinned loft for body + neck + head (egg-shaped body, S-curved neck
 * for long-necked species), lofted beak by type, folded wings hugging the body
 * plus spread wings that appear while flying, fanned tail, scaly legs with
 * perching / webbed / raptor / ground feet, painted plumage.
 * Facing +Z, standing on the ground.
 */

const deg = Math.PI / 180;

export function buildBird(name, S, opts = {}) {
  const seed = opts.seed ?? name;
  const nz = noise3(rng(`${seed}-n`));
  const L = S.L;
  const bl = S.body.len * L;
  const bd = S.body.depth * L;
  const bw = S.body.width * L;
  const tilt = (S.body.tilt ?? 20) * deg;
  const legLen = S.nest ? L * 0.03 : S.legs.len * L;
  const root = new THREE.Group();
  root.name = `animal-${name}`;
  const rig = new Rig();

  // body axis frame (tilted, front up)
  const ax = new THREE.Vector3(0, Math.sin(tilt), Math.cos(tilt));
  const upv = new THREE.Vector3(0, Math.cos(tilt), -Math.sin(tilt));
  const hipY = legLen + bd * 0.32;
  const center = new THREE.Vector3(0, hipY + bd * 0.1, 0);
  const B = (z, y) => center.clone().addScaledVector(ax, z * bl).addScaledVector(upv, y * bd);
  const Pr = B(-0.5, 0.15);
  const P1 = B(-0.28, 0.02);
  const P2 = B(0.02, 0);
  const P3 = B(0.3, 0.05);
  const P4 = B(0.46, 0.22);
  const nlen = S.neck.len * L;
  const na = (S.neck.ang ?? 60) * deg;
  const nd = new THREE.Vector3(0, Math.sin(na), Math.cos(na));
  const hr = S.head.r * L;
  const neckPts = [];
  const sCurve = S.neck.s ?? 0;
  for (let k = 1; k <= 3; k++) {
    const f = k / 3;
    neckPts.push(P4.clone().addScaledVector(nd, nlen * f).add(new THREE.Vector3(0, 0, -sCurve * nlen * Math.sin(Math.PI * f) * 0.6)));
  }
  const neckEnd = neckPts[2];
  const hdir = new THREE.Vector3(0, -Math.sin((S.head.ang ?? 5) * deg), Math.cos((S.head.ang ?? 5) * deg));
  const Hc = neckEnd.clone().addScaledVector(hdir, hr * 0.35).add(new THREE.Vector3(0, hr * 0.25, 0));
  const Hf = Hc.clone().addScaledVector(hdir, hr * 0.85);
  const curve = spline([Pr, P1, P2, P3, P4, ...neckPts, Hc, Hf]);
  const tb = (p) => tNear(curve, p);
  const T = { p1: tb(P1), p2: tb(P2), p3: tb(P3), p4: tb(P4), n1: tb(neckPts[0]), n2: tb(neckPts[1]), ne: tb(neckEnd), hc: tb(Hc) };
  const nr = S.neck.r * L;
  const sec = keyed([
    [0, { w: bw * 0.18, up: bd * 0.12, dn: bd * 0.1, e: 2 }],
    [T.p1, { w: bw * 0.42, up: bd * 0.34, dn: bd * 0.36, e: 2 }],
    [T.p2, { w: bw * 0.5, up: bd * 0.44, dn: bd * 0.5, e: 2 }],
    [T.p3, { w: bw * 0.48, up: bd * 0.42, dn: bd * 0.5, e: 2 }],
    [T.p4, { w: lerp(bw * 0.3, nr, 0.3), up: bd * 0.28, dn: bd * 0.32, e: 2 }],
    [T.n1, { w: nr, up: nr, dn: nr * 1.05, e: 2 }],
    [T.ne, { w: nr * 0.92, up: nr * 0.92, dn: nr * 0.95, e: 2 }],
    [lerp(T.ne, T.hc, 0.6), { w: hr * 0.82, up: hr * 0.85, dn: hr * 0.8, e: 2 }],
    [T.hc, { w: hr * 0.86, up: hr * 0.95, dn: hr * 0.82, e: 2 }],
    [lerp(T.hc, 1, 0.7), { w: hr * 0.62, up: hr * 0.62, dn: hr * 0.58, e: 2 }],
    [1, { w: hr * 0.42, up: hr * 0.4, dn: hr * 0.42, e: 2 }],
  ]);
  const fluff = (S.fluff ?? 0.015) * L;
  const bodyGeo = loft(curve, sec, { n: 90, ring: 26, displace: (t, a, p) => Math.min(fluff, L * 0.012) * (nz(p.x * 220 / L, p.y * 220 / L, p.z * 220 / L) - 0.4) * (t < T.ne ? 1 : 0.4) });

  rig.add('body', P2.toArray());
  rig.add('pelvis', P1.toArray(), 'body');
  rig.add('neck1', P4.toArray(), 'body');
  rig.add('neck2', neckPts[1].toArray(), 'neck1');
  rig.add('head', neckEnd.toArray(), 'neck2');
  const bi = (n) => rig.index(n);
  {
    const lt = bodyGeo.attributes.lt.array;
    applySkin(bodyGeo, (i) => chain(lt[i], [bi('pelvis'), bi('body'), bi('neck1'), bi('neck2'), bi('head')], [0, T.p1 * 1.3, T.p4 - 0.02, T.n2 - 0.02, T.ne - 0.01], 0.04));
  }

  /* ---- tail ---- */
  const tlen = S.tail.len * L;
  const tw = S.tail.w * L;
  const ttilt = (S.tail.tilt ?? 0) * deg;
  const tdir = ax.clone().negate().applyAxisAngle(new THREE.Vector3(1, 0, 0), ttilt);
  const t0 = surfacePoint(curve, sec, 0.06, 0).p.clone().addScaledVector(upv, -bd * 0.06);
  // tails never dig into the ground (long trains just reach it)
  if (t0.y + tdir.y * tlen < L * 0.012) {
    const need = (L * 0.012 - t0.y) / tlen;
    const hz = Math.sqrt(Math.max(0, 1 - need * need));
    const flat = Math.hypot(tdir.x, tdir.z) || 1;
    tdir.set((tdir.x / flat) * hz, need, (tdir.z / flat) * hz);
  }
  const tc = spline([t0, t0.clone().addScaledVector(tdir, tlen * 0.5), t0.clone().addScaledVector(tdir, tlen)]);
  const ttype = S.tail.type ?? 'fan';
  const tailGeo = loft(tc, (t) => {
    let w = tw * (ttype === 'pointed' ? 0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * 0.6) : ttype === 'long' ? 0.35 + 0.3 * t : 0.4 + 0.6 * t ** 0.7);
    if (t > 0.97) w *= 0.6;
    if (S.tail.vertical) return { w: L * 0.01 * (1.4 - t), up: w * 1.4, dn: L * 0.01, e: 2.4 };
    if (ttype === 'fork') w *= 1 + 0.6 * smooth01((t - 0.6) / 0.4);
    return { w, up: L * 0.008 * (1.4 - t), dn: L * 0.006 * (1.4 - t), e: 2.6 };
  }, { n: 18, ring: 14, displace: (t, a, p, n, sx) => (t > 0.75 && ttype === 'fork' ? -Math.max(0, 1 - Math.abs(sx) * 1.6) * tlen * 0.3 * smooth01((t - 0.75) / 0.25) * 0 : 0) });
  rig.add('tail1', t0.toArray(), 'pelvis');
  applySkin(tailGeo, () => [[bi('tail1'), 1]]);

  /* ---- folded wings ---- */
  const wl = S.wing.len * L;
  const wingGeos = [];
  for (const sx of [1, -1]) {
    const sh = surfacePoint(curve, sec, lerp(T.p3, T.p4, 0.3), sx * 1.25);
    const a = sh.p.clone().addScaledVector(sh.n, L * 0.004);
    const mid = surfacePoint(curve, sec, lerp(T.p1, T.p2, 0.5), sx * 1.15).p.clone().add(new THREE.Vector3(sx * L * 0.01, 0, 0));
    const tip = a.clone().addScaledVector(ax, -wl).addScaledVector(upv, bd * 0.12);
    tip.x = sx * bw * 0.28;
    const wc = spline([a, mid.clone().lerp(a, 0.2), mid, tip]);
    const g = loft(wc, (t) => ({ w: L * 0.012 * (1 - 0.6 * t), up: bd * (S.wing.h ?? 0.42) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.6 + 0.15))) * (1 - 0.75 * smooth01((t - 0.55) / 0.45)), dn: bd * 0.18 * (1 - 0.8 * t), e: 2.2, yo: 0 }), { n: 26, ring: 16, displace: (t, a2) => (Math.cos(a2) < -0.2 ? -L * 0.006 * Math.abs(Math.sin(t * 40)) : 0) });
    applySkin(g, () => [[bi('body'), 1]]);
    g.userData.wingSide = sx;
    wingGeos.push(g);
  }

  /* ---- spread wings (shown while flying) ---- */
  const span = (S.wing.span ?? S.wing.len * 1.6) * L;
  const spread = [];
  for (const sx of [1, -1]) {
    const sh = surfacePoint(curve, sec, lerp(T.p3, T.p4, 0.3), sx * Math.PI * 0.42).p;
    const n1 = `wing${sx > 0 ? 'L' : 'R'}1`;
    const n2 = `wing${sx > 0 ? 'L' : 'R'}2`;
    rig.add(n1, sh.toArray(), 'body');
    rig.add(n2, sh.clone().add(new THREE.Vector3(sx * span * 0.45, 0, 0)).toArray(), n1);
    const chord = (t) => wl * 0.45 * (S.wing.shape === 'long' ? 0.55 + 0.25 * (1 - t) : 0.8 + 0.3 * Math.sin(Math.PI * t * 0.8)) * (1 - 0.65 * smooth01((t - 0.75) / 0.25));
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      pts.push(sh.clone().add(new THREE.Vector3(sx * span * t, Math.sin(t * Math.PI) * L * 0.02, -chord(t) * 0.35 - t * t * wl * 0.15)));
    }
    const wc = spline(pts);
    const g = loft(wc, (t) => ({ w: chord(t) * 0.5, up: L * 0.008 * (1 - 0.6 * t) + 1e-4, dn: L * 0.004 + 1e-4, e: 2.2 }), {
      n: 40,
      ring: 14,
      lateral: 'auto',
      displace: (t, a, p, n) => (n.z < -0.6 ? -chord(t) * 0.12 * (0.5 + 0.5 * Math.cos(t * 9 * TAU)) * smooth01((t - 0.15) / 0.2) : 0),
    });
    const lt = g.attributes.lt.array;
    applySkin(g, (i) => chain(lt[i], [bi('body'), bi(n1), bi(n2)], [0, 0.02, 0.45], 0.08));
    g.userData.wingSide = sx;
    spread.push(g);
  }

  /* ---- legs & feet ---- */
  const legParts = [];
  const legGeos = [];
  const legR = S.legs.r * L;
  const legC = C(S.legs.color ?? '#c9902a');
  for (const sx of [1, -1]) {
    const hip = surfacePoint(curve, sec, lerp(T.p1, T.p2, 0.55), sx * 2.6).p.clone().addScaledVector(upv, bd * 0.08);
    hip.x = sx * bw * 0.22;
    const heel = new THREE.Vector3(sx * bw * 0.22, legLen * 0.62, hip.z - legLen * 0.12);
    const foot = new THREE.Vector3(sx * bw * 0.2, legR * 1.1, hip.z + legLen * 0.04);
    const ln = `leg${sx > 0 ? 'L' : 'R'}`;
    rig.add(`${ln}0`, hip.toArray(), 'pelvis');
    rig.add(`${ln}1`, heel.toArray(), `${ln}0`);
    rig.add(`${ln}2`, foot.toArray(), `${ln}1`);
    // feathered thigh (body coloured) + scaly tarsus
    const lc = spline([hip.clone().addScaledVector(upv, bd * 0.1), hip, heel, foot]);
    const th = tNear(lc, heel);
    const g = loft(lc, (t) => {
      const r = t < th ? lerp(bd * 0.22, legR * 1.6, smooth01(t / th)) : legR * lerp(1.15, 1, (t - th) / (1 - th));
      return { w: r, up: r, dn: r, e: 2 };
    }, { n: 26, ring: 10 });
    const lt = g.attributes.lt.array;
    applySkin(g, (i) => chain(lt[i], [bi('pelvis'), bi(`${ln}0`), bi(`${ln}1`), bi(`${ln}2`)], [0, 0.1, th, 0.97], 0.04));
    g.userData.th = th;
    legGeos.push(g);
    // toes
    const feet = S.legs.feet ?? 'perch';
    const toeL = (S.legs.toe ?? 0.11) * L;
    const dirs = feet === 'web' ? [-0.45, 0, 0.45] : [-0.4, 0, 0.4];
    const toeGeos = [];
    for (const a of dirs) {
      const d = new THREE.Vector3(Math.sin(a) * sx, 0, Math.cos(a));
      const tg = loft(spline([foot, foot.clone().addScaledVector(d, toeL * 0.5).setY(legR * 0.7), foot.clone().addScaledVector(d, toeL).setY(legR * 0.55)]), (t) => ({ w: legR * (0.8 - 0.35 * t), up: legR * (0.8 - 0.35 * t), dn: legR * (0.8 - 0.35 * t), e: 2 }), { n: 8, ring: 8, lateral: 'free' });
      toeGeos.push(tg);
    }
    if (feet !== 'web' || true) {
      const d = new THREE.Vector3(0, 0, -1);
      toeGeos.push(loft(spline([foot, foot.clone().addScaledVector(d, toeL * 0.25).setY(legR * 0.7), foot.clone().addScaledVector(d, toeL * 0.45).setY(legR * 0.55)]), (t) => ({ w: legR * (0.7 - 0.3 * t), up: legR * (0.7 - 0.3 * t), dn: legR * (0.7 - 0.3 * t), e: 2 }), { n: 6, ring: 8, lateral: 'free' }));
    }
    if (feet === 'web') {
      const shape = new THREE.Shape();
      const pts2 = dirs.map((a) => [Math.sin(a) * sx * toeL, Math.cos(a) * toeL]);
      shape.moveTo(0, 0);
      shape.lineTo(pts2[0][0], pts2[0][1]);
      shape.quadraticCurveTo((pts2[0][0] + pts2[1][0]) * 0.4, (pts2[0][1] + pts2[1][1]) * 0.4, pts2[1][0], pts2[1][1]);
      shape.quadraticCurveTo((pts2[1][0] + pts2[2][0]) * 0.4, (pts2[1][1] + pts2[2][1]) * 0.4, pts2[2][0], pts2[2][1]);
      shape.lineTo(0, 0);
      const wg = new THREE.ShapeGeometry(shape);
      wg.rotateX(Math.PI / 2);
      wg.translate(foot.x, legR * 0.5, foot.z);
      const web = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: legC, roughness: 0.6, side: THREE.DoubleSide }));
      legParts.push([web, `${ln}2`]);
    }
    if (feet === 'raptor') {
      for (const a of [...dirs, Math.PI]) {
        const d = a === Math.PI ? new THREE.Vector3(0, 0, -0.45) : new THREE.Vector3(Math.sin(a) * sx, 0, Math.cos(a));
        const cg = new THREE.ConeGeometry(legR * 0.45, legR * 1.6, 6);
        cg.rotateX(Math.PI / 2 + 0.7);
        const cm = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: '#1a1614', roughness: 0.4 }));
        cm.position.copy(foot).addScaledVector(d, a === Math.PI ? toeL * 1.0 : toeL * 1.02).setY(legR * 0.6);
        cm.lookAt(cm.position.clone().add(d));
        cm.position.x += 0;
        legParts.push([cm, `${ln}2`]);
      }
    }
    for (const tg of toeGeos) {
      const m = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: legC, roughness: 0.55 }));
      m.name = 'toe';
      legParts.push([m, `${ln}2`]);
    }
  }

  /* ---- beak ---- */
  const beakParts = [];
  {
    const bk = S.beak;
    const blen = bk.len * L;
    const bdp = (bk.depth ?? 0.5) * hr;
    const bwid = (bk.width ?? bk.depth ?? 0.5) * hr;
    const base = Hf.clone().addScaledVector(hdir, -hr * 0.18).add(new THREE.Vector3(0, -hr * 0.08, 0));
    const fwd = hdir.clone();
    const down = new THREE.Vector3(0, -1, 0);
    let pts;
    let secF;
    switch (bk.type) {
      case 'hook':
        pts = [base, base.clone().addScaledVector(fwd, blen * 0.55).addScaledVector(down, -blen * 0.05), base.clone().addScaledVector(fwd, blen * 0.95).addScaledVector(down, blen * 0.35), base.clone().addScaledVector(fwd, blen * 0.85).addScaledVector(down, blen * 0.6)];
        secF = (t) => ({ w: bwid * (1 - 0.85 * t), up: bdp * (1 - 0.8 * t), dn: bdp * (1 - 0.85 * t), e: 2 });
        break;
      case 'flat':
        pts = [base, base.clone().addScaledVector(fwd, blen * 0.5).addScaledVector(down, blen * 0.08), base.clone().addScaledVector(fwd, blen).addScaledVector(down, blen * 0.12)];
        secF = (t) => ({ w: bwid * (1.0 + 0.1 * t) * (t > 0.92 ? 1 - (t - 0.92) * 6 : 1), up: bdp * (0.7 - 0.45 * t), dn: bdp * (0.35 - 0.2 * t), e: 3 });
        break;
      case 'long':
        pts = [base, base.clone().addScaledVector(fwd, blen * 0.5).addScaledVector(down, blen * (bk.bend ?? 0.05)), base.clone().addScaledVector(fwd, blen).addScaledVector(down, blen * (bk.bend ?? 0.05) * 3)];
        secF = (t) => ({ w: bwid * (1 - 0.9 * t), up: bdp * (1 - 0.88 * t), dn: bdp * (1 - 0.88 * t), e: 2 });
        break;
      default: // cone
        pts = [base, base.clone().addScaledVector(fwd, blen * 0.6).addScaledVector(down, blen * 0.04), base.clone().addScaledVector(fwd, blen).addScaledVector(down, blen * 0.12)];
        secF = (t) => ({ w: bwid * (1 - 0.92 * t ** 0.9), up: bdp * (1 - 0.9 * t ** 0.9), dn: bdp * (1 - 0.9 * t ** 0.9), e: 2 });
    }
    const g = loft(spline(pts), secF, { n: 20, ring: 16 });
    const bc = C(bk.color ?? '#3a3028');
    const tc2 = C(bk.tip ?? bk.color ?? '#3a3028');
    const sy = g.attributes.sy.array;
    const ltb = g.attributes.lt.array;
    paint(g, (i) => {
      const c = bc.clone().lerp(tc2, smooth01((ltb[i] - 0.7) / 0.25));
      // mouth line between the mandibles
      if (Math.abs(sy[i] + (bk.type === 'flat' ? 0.1 : 0.05)) < 0.06 && ltb[i] > 0.05) c.multiplyScalar(0.35);
      return c;
    });
    const m = new THREE.Mesh(g, hornMaterial());
    m.name = 'beak';
    beakParts.push(m);
    // nostril
    for (const s2 of [1, -1]) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(bwid * 0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#0d0a08' }));
      n.position.copy(base).addScaledVector(fwd, blen * 0.18).add(new THREE.Vector3(s2 * bwid * 0.55, bdp * 0.35, 0));
      beakParts.push(n);
    }
  }
  /* ---- eyes ---- */
  const eyes = [];
  const eyeR = (S.eyes?.r ?? 0.2) * hr;
  for (const sx of [1, -1]) {
    const sp = surfacePoint(curve, sec, lerp(T.hc, 1, 0.25), sx * (S.eyes?.a ?? 1.25));
    const at = sp.p.clone().addScaledVector(sp.n, -eyeR * 0.5);
    eyes.push(at);
    beakParts.push(buildEye(at, sp.n, eyeR, { color: S.eyes?.color ?? '#120c08', lid: S.eyes?.lid ?? '#1a1410' }));
  }
  /* ---- comb / wattles / crest ---- */
  if (S.comb) {
    const cm = new THREE.MeshPhysicalMaterial({ color: S.comb.color ?? '#c41e1e', roughness: 0.55, sheen: 0.3 });
    const n = S.comb.points ?? 5;
    const size = S.comb.size ?? 1;
    for (let k = 0; k < n; k++) {
      const t = lerp(T.hc - 0.03, lerp(T.hc, 1, 0.75), k / (n - 1));
      const sp = surfacePoint(curve, sec, t, 0);
      const h = hr * 0.5 * size * (0.6 + 0.6 * Math.sin(Math.PI * (k + 0.5) / n));
      const g = new THREE.SphereGeometry(hr * 0.16 * size, 10, 8);
      g.scale(0.55, h / (hr * 0.16 * size), 1);
      const m = new THREE.Mesh(g, cm);
      m.position.copy(sp.p).add(new THREE.Vector3(0, h * 0.55, 0));
      beakParts.push(m);
    }
    for (const s2 of [1, -1]) {
      const g = new THREE.SphereGeometry(hr * 0.2 * size, 12, 8);
      g.scale(0.45, 1.3, 0.8);
      const m = new THREE.Mesh(g, cm);
      m.position.copy(Hf).addScaledVector(hdir, -hr * 0.1).add(new THREE.Vector3(s2 * hr * 0.12, -hr * 0.75, 0));
      beakParts.push(m);
    }
  }
  if (S.wattle) {
    const wm = new THREE.MeshPhysicalMaterial({ color: '#c8302a', roughness: 0.6, sheen: 0.4 });
    const sn = loft(spline([Hf.clone().add(new THREE.Vector3(0, hr * 0.35, 0)), Hf.clone().addScaledVector(hdir, hr * 0.5).add(new THREE.Vector3(0, -hr * 0.3, 0)), Hf.clone().addScaledVector(hdir, hr * 0.4).add(new THREE.Vector3(0, -hr * 1.4, 0))]), (t) => ({ w: hr * 0.12 * (1 - 0.4 * t), up: hr * 0.12, dn: hr * 0.12, e: 2 }), { n: 12, ring: 8, lateral: 'free' });
    beakParts.push(new THREE.Mesh(sn, wm));
    const wg = new THREE.SphereGeometry(hr * 0.5, 14, 10);
    wg.scale(0.6, 1.4, 0.8);
    const w2 = new THREE.Mesh(wg, wm);
    w2.position.copy(Hc).add(new THREE.Vector3(0, -hr * 1.1, hr * 0.1));
    beakParts.push(w2);
  }
  if (S.crest) {
    const cm = furMaterial({ name: 'crest' });
    const g = loft(spline([surfacePoint(curve, sec, T.hc, 0).p, Hc.clone().add(new THREE.Vector3(0, hr * 1.6 * S.crest.h, -hr * 0.5))]), (t) => ({ w: hr * 0.12 * (1 - t), up: hr * 0.45 * (1 - t * 0.9), dn: hr * 0.2 * (1 - t), e: 2 }), { n: 10, ring: 10 });
    paint(g, () => C(S.crest.color ?? S.coat.head ?? '#c41e1e'));
    const m = new THREE.Mesh(g, cm);
    beakParts.push(m);
  }

  /* ---- paint plumage ---- */
  const cc = S.coat;
  const col = {
    back: C(cc.back ?? '#6b5a48'),
    belly: C(cc.belly ?? '#d9cfc0'),
    breast: C(cc.breast ?? cc.belly ?? '#d9cfc0'),
    head: C(cc.head ?? cc.back ?? '#6b5a48'),
    cap: cc.cap ? C(cc.cap) : null,
    throat: cc.throat ? C(cc.throat) : null,
    face: cc.face ? C(cc.face) : null,
    collar: cc.collar ? C(cc.collar) : null,
    wing: C(cc.wing ?? cc.back ?? '#5a4a3a'),
    prim: C(cc.primaries ?? cc.wing ?? cc.back ?? '#3a3028'),
    bar: cc.wingBar ? C(cc.wingBar) : null,
    tail: C(cc.tail ?? cc.primaries ?? cc.back ?? '#3a3028'),
    eyeStripe: cc.eyeStripe ? C(cc.eyeStripe) : null,
  };
  const speck = cc.speckle ? C(cc.speckle) : null;
  const ltB = bodyGeo.attributes.lt.array;
  const syB = bodyGeo.attributes.sy.array;
  paint(bodyGeo, (i, p, n) => {
    const t = ltB[i];
    let c = col.belly.clone().lerp(col.back, smooth01((n.y * 0.8 + syB[i] * 0.4 + 0.1) / 0.5));
    const fr = smooth01((t - T.p2) / 0.12) * smooth01((-syB[i] + 0.4) / 0.5);
    c.lerp(col.breast, fr);
    const hk = smooth01((t - (cc.headFrom ?? T.n1)) / 0.04);
    c.lerp(col.head, hk);
    if (col.throat) c.lerp(col.throat, smooth01((t - T.n1) / 0.05) * smooth01((-syB[i] + 0.1) / 0.4) * (1 - smooth01((t - lerp(T.hc, 1, 0.8)) / 0.05)));
    if (col.cap) c.lerp(col.cap, smooth01((t - T.ne) / 0.03) * smooth01((syB[i] - 0.45) / 0.15));
    if (col.collar) c.lerp(col.collar, bump(t, lerp(T.p4, T.n1, 0.65), 0.012));
    if (col.eyeStripe) {
      for (const e of eyes) c.lerp(col.eyeStripe, smooth01((hr * 0.32 - Math.abs(p.y - e.y)) / (hr * 0.1)) * smooth01((t - T.hc + 0.02) / 0.02) * smooth01((Math.abs(p.x) - hr * 0.3) / (hr * 0.1)) * 0.9);
    }
    if (col.face) c.lerp(col.face, smooth01((t - lerp(T.hc, 1, 0.35)) / 0.03) * smooth01((Math.abs(n.x) - 0.3) / 0.3));
    if (speck) c.lerp(speck, smooth01((nz(p.x * 300 / L, p.y * 300 / L, p.z * 300 / L) - 0.66) / 0.04) * smooth01((-n.y + 0.3) / 0.4) * (1 - hk));
    return c.multiplyScalar(0.94 + 0.12 * nz(p.x * 120 / L, p.y * 120 / L, p.z * 120 / L));
  });
  const paintWing = (g) => {
    const lt = g.attributes.lt.array;
    const sy = g.attributes.sy.array;
    paint(g, (i, p) => {
      const t = lt[i];
      const c = col.wing.clone().lerp(col.prim, smooth01((t - (cc.primFrom ?? 0.5)) / 0.15));
      if (col.bar) c.lerp(col.bar, bump(t, cc.barAt ?? 0.32, 0.04) * smooth01((sy[i] + 0.2) / 0.3));
      // feather edging
      return c.multiplyScalar(0.88 + 0.18 * Math.abs(Math.sin(t * 34 + sy[i] * 2)) * (t > 0.3 ? 1 : 0.5) + 0.06 * nz(p.x * 200, p.y * 200, p.z * 200));
    });
  };
  wingGeos.forEach(paintWing);
  spread.forEach(paintWing);
  paint(tailGeo, (i, p) => col.tail.clone().multiplyScalar(0.85 + 0.25 * Math.abs(Math.sin(p.x * 400 / L * 0.2 + 0.5)) * 0.6 + 0.1 * nz(p.x * 200, p.y * 200, p.z * 200)));
  legGeos.forEach((g) => {
    const lt = g.attributes.lt.array;
    paint(g, (i, p, n) => (lt[i] < g.userData.th * 0.85 ? col.belly.clone().lerp(col.back, smooth01(n.y)) : legC.clone().multiplyScalar(0.85 + 0.25 * Math.abs(Math.sin(lt[i] * 90)))));
  });

  /* ---- assemble ---- */
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(rig.bones);
  const mat = furMaterial({ roughness: 0.75, sheen: 0.7 });
  root.add(skinnedMesh(mergeSkinned([bodyGeo, tailGeo, ...wingGeos, ...legGeos]), mat, skeleton, 'body_mesh'));
  const spreadMesh = skinnedMesh(mergeSkinned(spread), mat, skeleton, 'wings_spread');
  spreadMesh.visible = false;
  spreadMesh.scale.setScalar(1e-4); // hidden & collapsed until 'fly' (keeps bounding boxes tight)
  root.add(spreadMesh);
  const hb = rig.world.head;
  for (const p of beakParts) {
    if (!p.isGroup && p.position.lengthSq() === 0) p.geometry.translate(-hb.x, -hb.y, -hb.z);
    else p.position.sub(hb);
    rig.get('head').add(p);
  }
  for (const [m, bone] of legParts) {
    const w = rig.world[bone];
    m.geometry.translate(-w.x, -w.y, -w.z);
    rig.get(bone).add(m);
  }

  if (S.nest) {
    const R = bl * 0.62;
    const tr = bd * 0.32;
    const ng = new THREE.TorusGeometry(R, tr, 12, 40);
    ng.rotateX(Math.PI / 2);
    ng.translate(0, tr * 0.9, P2.z * 0.5);
    const nzs = noise3(rng(`${seed}-nest`));
    const P = ng.attributes.position;
    const col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i);
      const y = P.getY(i);
      const z = P.getZ(i);
      const k = 1 + 0.18 * (nzs(x * 40 / L, y * 40 / L, z * 40 / L) - 0.5);
      P.setXYZ(i, x * k, Math.max(0, y * (0.9 + 0.2 * nzs(x * 60, z * 60, 1))), z * k);
      const c = C('#7a5a38').lerp(C('#b8945e'), Math.abs(Math.sin((x + z) * 300 / L + y * 80 / L)));
      col.set([c.r, c.g, c.b], i * 3);
    }
    ng.setAttribute('color', new THREE.BufferAttribute(col, 3));
    ng.computeVertexNormals();
    const nest = new THREE.Mesh(ng, new THREE.MeshStandardMaterial({ name: 'nest', vertexColors: true, roughness: 1 }));
    nest.name = 'nest';
    const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 24).rotateX(-Math.PI / 2).translate(0, 0.002, P2.z * 0.5), nest.material);
    floor.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floor.geometry.attributes.position.count * 3).fill(0.4), 3));
    root.add(nest, floor);
  }
  root.userData.clips = birdAnimations(rig, S, { L, legLen, bd, hipY });
  if (S.swims && opts.swimming) root.userData.floating = true;
  return root;
}

function birdAnimations(rig, S, { L, legLen, bd }) {
  const b = (n) => rig.get(n);
  const has = (n) => rig.has(n);
  const make = (name, period, spec, extra = [], steps = 32) =>
    clip(name, period, [...Object.entries(spec).filter(([n]) => n === 'bodyPos' || has(n)).map(([node, fn]) => (node === 'bodyPos' ? offsetTrack(b('body'), period, fn, steps) : poseTrack(b(node), period, fn, steps))), ...extra]);
  const clips = [];
  clips.push(
    make('idle', 4, {
      neck2: (t) => [0, 0.5 * Math.sin(TAU * t) * smooth01(Math.abs(Math.sin(TAU * t)) * 3), 0],
      head: (t) => [0.08 * Math.sin(TAU * t * 2), 0.3 * Math.sin(TAU * t * 1.5), 0.15 * Math.sin(TAU * t)],
      tail1: (t) => [0.15 * Math.max(0, Math.sin(TAU * t * 2)) ** 4, 0, 0],
    }),
  );
  const hop = S.gaitType === 'hop';
  const step = (lr, ph) => ({
    [`leg${lr}0`]: (t) => [hop ? -0.5 * Math.max(0, Math.sin(TAU * t)) : -0.45 * Math.sin(TAU * (t + ph)), 0, 0],
    [`leg${lr}1`]: (t) => [hop ? 0.6 * Math.max(0, Math.sin(TAU * t)) : 0.7 * Math.max(0, Math.cos(TAU * (t + ph))), 0, 0],
    [`leg${lr}2`]: (t) => [hop ? -0.3 * Math.max(0, Math.sin(TAU * t)) : -0.5 * Math.max(0, Math.cos(TAU * (t + ph))), 0, 0],
  });
  clips.push(
    make(hop ? 'hop' : 'walk', hop ? 0.45 : 0.8, {
      bodyPos: (t) => [hop ? 0 : 0.012 * L * Math.sin(TAU * t), hop ? 0.25 * legLen * Math.max(0, Math.sin(TAU * t)) : 0.01 * L * Math.abs(Math.sin(TAU * t)), 0],
      body: (t) => [0, 0, hop ? 0 : 0.06 * Math.sin(TAU * t)],
      neck1: (t) => [hop ? 0 : 0.18 * Math.sin(TAU * t * 2), 0, 0],
      head: (t) => [hop ? 0 : -0.15 * Math.sin(TAU * t * 2), 0, 0],
      ...step('L', 0),
      ...step('R', hop ? 0 : 0.5),
    }),
  );
  {
    const gp = (t) => smooth01(t / 0.25) - smooth01((t - 0.75) / 0.25);
    clips.push(
      make('peck', 1.6, {
        body: (t) => [0.5 * gp(t), 0, 0],
        neck1: (t) => [0.7 * gp(t), 0, 0],
        head: (t) => [0.4 * gp(t) + 0.25 * Math.sin(TAU * t * 6) * gp(t), 0, 0],
        tail1: (t) => [-0.3 * gp(t), 0, 0],
      }),
    );
  }
  // perch: crouched on bent legs, tail bobs, quick head turns
  clips.push(
    make('perch', 3, {
      bodyPos: () => [0, -legLen * 0.25, 0],
      legL1: () => [0.35, 0, 0],
      legR1: () => [0.35, 0, 0],
      legL0: () => [-0.2, 0, 0],
      legR0: () => [-0.2, 0, 0],
      tail1: (t) => [0.25 * Math.max(0, Math.sin(TAU * t * 3)) ** 8, 0, 0],
      head: (t) => [0, 0.6 * Math.sign(Math.sin(TAU * t)) * smooth01(Math.abs(Math.sin(TAU * t)) * 3), 0],
      body: (t) => [0.02 * Math.sin(TAU * t * 2), 0, 0],
    }),
  );
  // fly: spread wings appear, flap; folded wings stay tucked inside
  {
    const per = S.flapPeriod ?? 0.35;
    const flap = (t) => Math.sin(TAU * t);
    const vis = [new THREE.BooleanKeyframeTrack('wings_spread.visible', [0], [true]), new THREE.VectorKeyframeTrack('wings_spread.scale', [0], [1, 1, 1])];
    clips.push(
      make('fly', per, {
        bodyPos: (t) => [0, legLen * 2.2 + 0.03 * L * Math.sin(TAU * t + 1.2), 0],
        body: () => [-0.25, 0, 0],
        neck1: () => [0.25, 0, 0],
        // downstroke: wing fully spread; upstroke: wrist folds the hand back toward the body
        wingL1: (t) => [0, 0.15 * Math.max(0, -Math.cos(TAU * t)), 0.75 * flap(t)],
        wingL2: (t) => [0, -0.9 * Math.max(0, -Math.cos(TAU * t)), 0.45 * Math.sin(TAU * t - 0.8)],
        wingR1: (t) => [0, -0.15 * Math.max(0, -Math.cos(TAU * t)), -0.75 * flap(t)],
        wingR2: (t) => [0, 0.9 * Math.max(0, -Math.cos(TAU * t)), -0.45 * Math.sin(TAU * t - 0.8)],
        legL0: () => [0.9, 0, 0],
        legR0: () => [0.9, 0, 0],
        legL1: () => [-0.6, 0, 0],
        legR1: () => [-0.6, 0, 0],
        tail1: (t) => [0.1 * Math.sin(TAU * t), 0, 0],
      }, vis),
    );
  }
  void bd;
  return clips;
}
