// Garment geometry: shells hung on hangers (tops, dresses, trousers, skirts, scarves) and
// shells fitted over a body profile (dress forms, mannequins). All shells are open, double-
// sided surfaces, so necklines, cuffs and hems show the hollow inside like real clothes.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, smoothKeys, paramGeo, taperTube, spow, mainMat, fabricMat, hanger } from './common.js';

/* ------------------------------- helpers -------------------------------- */

/** Elliptical ring ("rib band", waistband): centre-line ellipse a×b at height y, tube radius r. */
export function ellipseRing(a, b, r, { y = 0, z = 0, flatY = 1, nu = 40 } = {}) {
  return paramGeo((u, v) => {
    const t = u * Math.PI * 2;
    const p = v * Math.PI * 2;
    const nx = Math.sin(t), nz = -Math.cos(t);
    const rr = r * Math.cos(p);
    return [(a + rr) * nx, y + r * Math.sin(p) * flatY, z + (b + rr) * nz];
  }, nu, 8, { closedU: false });
}

/**
 * Ring-section shell from d=0 to d=L (d grows downward). prof(d) → { a, b, z, p }.
 * place(x, d, f) → y   (f = front factor, 1 at front centre, -1 at back). pleats: count.
 * u=0 is the back centre, u=0.5 the front centre.
 */
export function shellGeo(prof, L, place, { nu = 44, nv = 36, pleats = 0, pleatAmp = 0.006, d0 = 0 } = {}) {
  return paramGeo((u, v) => {
    const d = d0 + (L - d0) * v;
    const P = prof(d);
    const th = u * Math.PI * 2;
    const s = Math.sin(th), c = Math.cos(th);
    const pw = 2 / (P.p ?? 2);
    let k = 1;
    if (pleats) k += Math.sin(th * pleats) * pleatAmp * (d / L) / Math.max(0.05, P.a) * 4;
    const x = P.a * spow(s, pw) * k;
    const z = (P.z ?? 0) - P.b * spow(c, pw) * k;
    return [x, place(x, d, -c), z];
  }, nu, nv, { closedU: true });
}

const keys = (pairs) => smoothKeys(pairs);
const btn = (parent, mat, at, r = 0.0075) => mesh(new THREE.CylinderGeometry(r, r, 0.004, 14).rotateX(Math.PI / 2), mat, { parent, at });

/* ------------------------------ hung tops ------------------------------- */

export const TOP_SPEC = {
  tshirt: { W: 0.48, L: 0.7, sleeve: 'short', neck: 0.078, drop: 0.035, rib: true },
  shirt: { W: 0.46, L: 0.78, sleeve: 'long', neck: 0.07, collar: true, placket: true },
  hoodie: { W: 0.54, L: 0.68, sleeve: 'long', neck: 0.085, hood: true, rib: true, cuffs: true },
  sweater: { W: 0.5, L: 0.66, sleeve: 'long', neck: 0.075, rib: true, cuffs: true, drop: 0.02 },
  jacket: { W: 0.48, L: 0.74, sleeve: 'long', neck: 0.08, lapels: true, b: 0.05 },
  coat: { W: 0.5, L: 1.05, sleeve: 'long', neck: 0.085, lapels: true, double: true, belt: true, b: 0.055 },
  dress: { W: 0.38, L: 1.0, sleeve: 'none', neck: 0.1, drop: 0.06, skirt: true },
  suit: { W: 0.48, L: 0.76, sleeve: 'long', neck: 0.08, lapels: true, tie: true, b: 0.05, trousers: true },
};

/** Hanger curve height at x (hanger shoulder width hw·2). */
const hangerY = (x, hw) => {
  const ax = Math.abs(x);
  if (ax <= 0.6 * hw) return -0.07 - 0.02 * (ax / (0.6 * hw));
  if (ax <= hw) return -0.09 - 0.02 * ((ax - 0.6 * hw) / (0.4 * hw));
  return -0.11 - (ax - hw) * 0.7;
};

/**
 * A top-type garment on a hanger. Coordinates: hanger hook top at the origin.
 * Returns { g, bottom } (lowest y). mats: { main, trim, button, inner }.
 */
export function hungTop(parent, kind, T, { at = [0, 0, 0], rotY = 0, hangerKind = 'wood', hangerMat } = {}) {
  const S = TOP_SPEC[kind];
  const g = group(kind, { parent, at, rot: [0, rotY, 0] });
  const W = S.W * T.wid * (T.loose ? 1.04 : 1) * (T.slim ? 0.95 : 1);
  const L = S.L * T.len * (S.skirt ? 1 : 1);
  const hw = Math.min(0.18, W / 2 - 0.07);
  hanger(g, { w: hw * 2, kind: hangerKind, mat: hangerMat });
  const main = mainMat(T, [3, 3]);
  const trimM = fabricMat(T.fab === 'neon' ? 'neon' : T.fab, T.fab === 'neon' ? T.c2 : T.c, { c2: T.c2, c3: T.c3, plain: true });
  const B0 = (S.b ?? 0.042) * (T.thick ? 1.2 : 1);
  const waist = S.skirt ? 0.4 : T.slim ? 0.88 : T.loose ? 1.02 : 0.94;
  const hem = S.skirt ? 0 : T.loose ? 1.04 : T.sport ? 0.92 : 0.96;
  const flare = (T.flare ?? 1) * (S.skirt ? 1 : 1);
  const A = S.skirt
    ? keys([[0, S.neck], [0.03, W * 0.42], [0.06, W / 2], [0.25, W / 2 * 0.92], [0.36, 0.14], [0.5, 0.17 * Math.sqrt(flare)], [L, 0.28 * flare]])
    : keys([[0, S.neck], [0.03, W * 0.4], [0.06, W / 2], [0.3, W / 2 * 0.98], [L * 0.62, W / 2 * waist], [L, W / 2 * hem]]);
  const Bk = S.skirt
    ? keys([[0, 0.05], [0.06, 0.042], [0.36, 0.038], [L, 0.09 * flare]])
    : keys([[0, 0.05], [0.06, B0], [L * 0.6, B0 * 0.95], [L, B0 * (T.loose ? 1.1 : 1)]]);
  const prof = (d) => ({ a: A(d), b: Bk(d), p: 2.2 });
  const top0 = hangerY(0, hw) + 0.032;
  const place = (x, d, f) => {
    const fade = Math.max(0, 1 - d / 0.3);
    let y = top0 + (hangerY(x, hw) - hangerY(0, hw)) * fade - d;
    y -= (S.drop ?? 0.03) * Math.max(0, f) ** 4 * Math.max(0, 1 - d / 0.05);
    return y;
  };
  mesh(shellGeo(prof, L, place, { pleats: S.skirt && T.fab === 'plaid' ? 20 : 0 }), main, { parent: g, name: 'garment' });
  const front = (x, d) => [x, place(x, d, 1), prof(d).b * Math.sqrt(Math.max(0, 1 - (x / prof(d).a) ** 2)) ** (2 / 2.2)];
  const bottom = place(0, L, 1);

  // sleeves
  const sx = W / 2 * 0.95;
  const sy = place(sx, 0.07, 0);
  const sleeveMode = S.sleeve === 'long' && T.sleeve < 0.5 ? 'short' : S.sleeve === 'none' && T.sleeve < 0.5 && T.trim ? 'cap' : S.sleeve;
  if (sleeveMode !== 'none') {
    for (const s of [-1, 1]) {
      let pts;
      let rad;
      if (sleeveMode === 'long') {
        const sl = 0.6 * Math.min(1, T.sleeve) * (S.L > 0.9 ? 1.05 : 1) * (T.len > 1.1 ? 1.05 : 1);
        pts = [[s * (sx - 0.04), sy + 0.005, 0], [s * (sx + 0.02), sy - 0.12, 0.006], [s * (sx + 0.05), sy - sl * 0.6, 0.014], [s * (sx + 0.065), sy - sl, 0.02]];
        rad = [0.072 * (T.thick ? 1.1 : 1), 0.05 * (T.loose ? 1.15 : 1)];
      } else {
        const sl = sleeveMode === 'cap' ? 0.09 : 0.2 * (T.sleeve > 0.7 ? 1.3 : 1);
        pts = [[s * (sx - 0.05), sy + 0.01, 0], [s * (sx + sl * 0.45), sy - sl * 0.45, 0.004], [s * (sx + sl * 0.75), sy - sl * 0.8, 0.008]];
        rad = [0.072, 0.062];
      }
      mesh(taperTube(pts, rad, { flat: 0.5, up: [0, 0, 1], seg: 18 }), main, { parent: g, name: 'sleeve' });
      if (S.cuffs && sleeveMode === 'long') {
        const e = pts[pts.length - 1];
        const p2 = pts[pts.length - 2];
        const dir = new THREE.Vector3(e[0] - p2[0], e[1] - p2[1], e[2] - p2[2]).normalize();
        const cuff = mesh(taperTube([[e[0] - dir.x * 0.05, e[1] - dir.y * 0.05, e[2] - dir.z * 0.05], e], rad[1] * 1.04, { flat: 0.5, seg: 2 }), trimM, { parent: g, name: 'cuff' });
        cuff.userData.part = 'cuff';
      }
    }
  }

  // necklines and bands
  const nY = place(0, 0, 0);
  if (S.rib && !S.hood) mesh(ellipseRing(S.neck + 0.004, 0.05 + 0.004, 0.008, { y: nY - 0.004, flatY: 1.4 }), trimM, { parent: g, name: 'neck_rib' });
  if (S.rib || S.cuffs) {
    const P = prof(L);
    mesh(paramGeo((u, v) => { const d = L - 0.06 + v * 0.06; const Q = prof(d); const th = u * Math.PI * 2; return [(Q.a + 0.003) * spow(Math.sin(th), 2 / 2.2), place(0, d, 0), -(Q.b + 0.003) * spow(Math.cos(th), 2 / 2.2)]; }, 40, 2, { closedU: true }), trimM, { parent: g, name: 'hem_rib' });
    void P;
  }
  const buttonM = T.fab === 'leather' ? M.chrome() : M.plastic(T.trim ? '#2a2420' : '#efe9dc', 0.3);
  if (S.collar) {
    mesh(ellipseRing(S.neck + 0.006, 0.056, 0.012, { y: nY + 0.004, flatY: 1.6 }), main, { parent: g, name: 'collar' });
    for (const s of [-1, 1]) {
      const wing = mesh(extrudeOutline([[0, 0], [s * 0.075, -0.012], [s * 0.05, -0.075]], 0.004, { bevel: 0.0015, segments: 1 }), main, { parent: g, name: 'collar_point' });
      wing.position.set(s * 0.012, nY - 0.006, 0.058);
      wing.rotation.x = -0.35;
    }
  }
  if (S.placket) {
    for (let i = 0; i < 7; i++) {
      const d = 0.06 + i * (L - 0.15) / 6;
      const f = front(0, d);
      btn(g, buttonM, [0, f[1], f[2] + 0.002], 0.0055);
    }
    mesh(roundedBox(0.03, L - 0.04, 0.003, 0.0012), main, { parent: g, at: [0, place(0, L / 2, 1), prof(L / 2).b + 0.0012] });
    const pk = front(0.1, 0.2);
    mesh(roundedBox(0.1, 0.11, 0.003, 0.0012), main, { parent: g, at: [pk[0], pk[1], pk[2] + 0.0015] });
  }
  if (S.hood) {
    const hood = new THREE.SphereGeometry(0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hood.scale(1.05, 1, 0.38);
    hood.rotateX(-Math.PI * 0.5);
    mesh(hood, main, { parent: g, at: [0, nY - 0.16, -0.05], name: 'hood' });
    mesh(ellipseRing(S.neck + 0.012, 0.058, 0.016, { y: nY - 0.01, flatY: 1.2 }), main, { parent: g, name: 'hood_rim' });
    const pp = front(0, L * 0.68);
    mesh(extrudeOutline([[-0.17, -0.1], [0.17, -0.1], [0.12, 0.08], [-0.12, 0.08]], 0.005, { bevel: 0.002, segments: 1 }), main, { parent: g, at: [0, pp[1], pp[2] + 0.002], name: 'pocket' });
    for (const s of [-1, 1]) {
      const f0 = front(s * 0.04, 0.03);
      curveTube([[s * 0.04, nY - 0.01, f0[2] + 0.01], [s * 0.045, nY - 0.12, f0[2] + 0.006], [s * 0.05, nY - 0.22, front(s * 0.05, 0.22)[2] + 0.004]], 0.0035, fabricMat('cotton', T.trim ? T.c2 : '#f2f2f2', { plain: true }), { parent: g, segments: 16, radialSegments: 6 });
      mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 8), M.metal('#c8c8cc', 0.3), { parent: g, at: [s * 0.05, nY - 0.23, front(s * 0.05, 0.22)[2] + 0.004] });
    }
  }
  if (S.lapels) {
    const vDepth = S.double ? 0.3 : 0.33;
    const zipped = T.fab === 'leather' || T.fab === 'neon';
    const inner = S.tie ? fabricMat('cotton', '#f4f4f2', { plain: true }) : fabricMat('cotton', T.fab === 'leather' ? '#2a2a2c' : '#e9e6df', { plain: true });
    if (!zipped) {
      const vy = place(0, vDepth, 1);
      const f0 = front(0, 0.12);
      mesh(extrudeOutline([[-0.075, nY - 0.005], [0.075, nY - 0.005], [0, vy]], 0.004, { bevel: 0.0015, segments: 1 }), inner, { parent: g, at: [0, 0, f0[2] - 0.004], name: 'shirt_front' });
      for (const s of [-1, 1]) {
        const lw = (S.double ? 0.1 : 0.085) * (T.loose ? 1.15 : 1);
        const lap = mesh(extrudeOutline([[s * 0.075, nY - 0.005], [s * (0.075 + lw * 0.5), nY - 0.03], [s * (0.06 + lw), nY - 0.12], [s * (0.055 + lw * 0.7), nY - 0.16], [s * 0.01, vy - 0.005]], 0.005, { bevel: 0.002, segments: 1 }), main, { parent: g, name: 'lapel' });
        lap.position.z = front(s * 0.08, 0.15)[2] + 0.003;
      }
      const nb = S.double ? 3 : 2;
      for (let i = 0; i < nb; i++) {
        const d = vDepth + 0.03 + i * 0.1;
        for (const s of S.double ? [-1, 1] : [0]) {
          const f = front(s * 0.07, d);
          btn(g, buttonM, [f[0], f[1], f[2] + 0.003], 0.009);
        }
      }
      if (S.tie) {
        const tieM = fabricMat('silk', T.trim ? T.c2 : '#7a1f2b', { plain: false, c2: '#e8d8a8' });
        mesh(extrudeOutline([[-0.012, 0], [0.012, 0], [0.04, -0.26], [0, -0.29], [-0.04, -0.26]], 0.006, { bevel: 0.002, segments: 1 }), tieM, { parent: g, at: [0, nY - 0.015, f0[2] - 0.001], name: 'tie' });
        mesh(roundedBox(0.03, 0.025, 0.012, 0.004), tieM, { parent: g, at: [0, nY - 0.015, f0[2] - 0.0], name: 'tie_knot' });
        const pq = front(-0.13, 0.22);
        mesh(extrudeOutline([[-0.03, 0], [0.03, 0], [0.02, 0.025], [0, 0.012], [-0.02, 0.025]], 0.003, { bevel: 0.001, segments: 1 }), fabricMat('silk', '#f4f0e6', { plain: true }), { parent: g, at: [pq[0], pq[1], pq[2] + 0.002] });
      }
    } else {
      // biker / track jacket: diagonal zip + wide lapels
      const zz = [];
      for (let i = 0; i <= 8; i++) { const d = 0.03 + i * (L - 0.06) / 8; const x = (T.fab === 'leather' ? 0.06 * (1 - i / 8) : 0); zz.push(front(x, d)); }
      curveTube(zz.map(([x, y, z]) => [x, y, z + 0.004]), 0.004, M.chrome(), { parent: g, segments: 30, radialSegments: 6, name: 'zip' });
      if (T.fab === 'leather') {
        for (const s of [-1, 1]) {
          const lap = mesh(extrudeOutline([[s * 0.07, nY], [s * 0.17, nY - 0.04], [s * 0.13, nY - 0.17], [s * 0.04, nY - 0.13]], 0.005, { bevel: 0.002, segments: 1 }), main, { parent: g, name: 'lapel' });
          lap.position.z = front(s * 0.1, 0.1)[2] + 0.003;
          const sn = front(s * 0.14, 0.12);
          btn(g, M.chrome(), [sn[0], sn[1], sn[2] + 0.009], 0.006);
        }
      } else {
        mesh(ellipseRing(S.neck + 0.008, 0.056, 0.014, { y: nY + 0.006, flatY: 2 }), trimM, { parent: g, name: 'collar' });
        for (const s of [-1, 1]) {
          const sp = front(s * W * 0.4, 0.3);
          mesh(roundedBox(0.012, L * 0.6, 0.003, 0.001), trimM, { parent: g, at: [sp[0], sp[1] - 0.05, sp[2] + 0.0015] });
        }
      }
    }
    for (const s of [-1, 1]) {
      const pf = front(s * 0.13, L * 0.68);
      mesh(roundedBox(0.13, 0.04, 0.004, 0.0015), main, { parent: g, at: [pf[0], pf[1], pf[2] + 0.002], rot: [-0.05, 0, 0], name: 'pocket_flap' });
    }
    if (S.belt) {
      const bf = front(0, L * 0.42);
      mesh(roundedBox(W * 0.95, 0.045, 0.006, 0.002), main, { parent: g, at: [0, bf[1], bf[2] + 0.004], name: 'belt' });
      mesh(roundedBox(0.06, 0.055, 0.008, 0.003), M.metal('#b49a5a', 0.3), { parent: g, at: [0, bf[1], bf[2] + 0.009] });
    }
  }
  if (S.skirt) {
    const wy = place(0, 0.36, 1);
    const Pw = prof(0.36);
    mesh(ellipseRing(Pw.a + 0.004, Pw.b + 0.004, 0.012, { y: wy, flatY: 1.3 }), fabricMat(T.trim ? 'silk' : 'cotton', T.trim ? T.c2 : '#222222', { plain: true }), { parent: g, name: 'waist_sash' });
  }
  if (S.trousers) {
    // matching trousers folded over the hanger bar, hanging behind the jacket
    const by = -0.145;
    for (const s of [-1, 1]) mesh(taperTube([[s * 0.1, by + 0.01, -0.03], [s * 0.1, by - 0.4, -0.035], [s * 0.1, by - 0.85, -0.035]], [0.1, 0.085], { flat: 0.3, side: [1, 0, 0], seg: 10 }), main, { parent: g, name: 'trouser_leg' });
    mesh(roundedBox(0.4, 0.03, 0.03, 0.012), main, { parent: g, at: [0, by + 0.005, -0.03], name: 'trouser_fold' });
    return { g, bottom: Math.min(bottom, by - 0.85) };
  }
  return { g, bottom };
}

/* ----------------------------- hung bottoms ----------------------------- */

/** Trousers / jeans / skirt / scarf on a hanger. kind: jeans | trousers | skirt | scarf | shorts. */
export function hungBottom(parent, kind, T, { at = [0, 0, 0], rotY = 0 } = {}) {
  const g = group(kind, { parent, at, rot: [0, rotY, 0] });
  const main = mainMat(T, [3, 3]);
  const stitchM = fabricMat('cotton', T.c2 ?? '#d9a441', { plain: true });
  if (kind === 'scarf') {
    const h = hanger(g, { w: 0.4, kind: 'wood' });
    const by = h.barY;
    const wdt = 0.12 * T.wid;
    const L1 = 0.7 * T.len;
    const pts = [[0, by - L1, 0.02], [0, by - L1 * 0.5, 0.018], [0, by - 0.03, 0.012], [0, by + 0.008, 0], [0, by - 0.03, -0.012], [0, by - L1 * 0.45, -0.018], [0, by - L1 * 0.85, -0.02]];
    mesh(taperTube(pts, wdt, { flat: 0.045, side: [1, 0, 0], seg: 40, radial: 16 }), mainMat(T, [2, 6]), { parent: g, name: 'scarf' });
    const fr = fabricMat(T.fab === 'leather' ? 'wool' : T.fab, T.c2 ?? T.c, { plain: true });
    for (const [y, z] of [[by - L1, 0.02], [by - L1 * 0.85, -0.02]]) {
      for (let i = 0; i < 13; i++) mesh(new THREE.CylinderGeometry(0.003, 0.002, 0.06, 5), fr, { parent: g, at: [-wdt * 0.92 + (i * wdt * 1.84) / 12, y - 0.028, z] });
    }
    return { g, bottom: by - L1 - 0.06 };
  }
  hanger(g, { w: 0.4, kind: 'clip' });
  const top = -0.112;
  if (kind === 'skirt') {
    const L = 0.55 * T.len;
    const fl = T.flare;
    const A = keys([[0, 0.17], [0.12, 0.2], [L, 0.2 + 0.12 * fl]]);
    const Bk = keys([[0, 0.045], [0.12, 0.06], [L, 0.06 + 0.07 * fl]]);
    mesh(shellGeo((d) => ({ a: A(d), b: Bk(d), p: 2.2 }), L, (x, d) => top - d, { pleats: T.fab === 'plaid' || T.fab === 'stripes' ? 22 : 0, pleatAmp: 0.009 }), main, { parent: g, name: 'skirt' });
    mesh(ellipseRing(0.172, 0.047, 0.012, { y: top - 0.01, flatY: 1.4 }), main, { parent: g, name: 'waistband' });
    if (T.fab === 'denim' || T.fab === 'leather') for (let i = 0; i < 5; i++) btn(g, M.metal('#b9905a', 0.3), [0, top - 0.04 - i * 0.08, Bk(0.04 + i * 0.08) + 0.003], 0.006);
    return { g, bottom: top - L };
  }
  // trousers / jeans / shorts
  const short = kind === 'shorts';
  const L = (short ? 0.45 : 1.02) * T.len * (T.crop ? 0.92 : 1);
  const legR = (kind === 'jeans' ? 0.1 : 0.105) * (T.loose ? 1.12 : T.slim ? 0.9 : 1);
  const hemR = legR * (T.flare > 1.2 ? 1.2 : T.slim ? 0.68 : 0.8);
  const A = keys([[0, 0.2], [0.26, 0.23]]);
  const Bk = keys([[0, 0.045], [0.26, 0.065]]);
  mesh(shellGeo((d) => ({ a: A(d), b: Bk(d), p: 2.4 }), 0.27, (x, d) => top - d, { nv: 10 }), main, { parent: g, name: 'seat' });
  for (const s of [-1, 1]) {
    mesh(taperTube([[s * 0.115, top - 0.2, 0], [s * 0.12, top - L * 0.5, 0.003], [s * 0.125, top - L, 0.004]], [legR, hemR], { flat: 0.42, side: [1, 0, 0], seg: 16 }), main, { parent: g, name: 'leg' });
    if (kind === 'jeans' || T.fab === 'denim') {
      curveTube([[s * 0.2, top - 0.02, 0.04], [s * 0.15, top - 0.08, 0.055], [s * 0.1, top - 0.03, 0.05]], 0.0025, stitchM, { parent: g, segments: 12, radialSegments: 5 });
      btn(g, M.metal('#b9905a', 0.3), [s * 0.19, top - 0.035, 0.05], 0.004);
    } else {
      curveTube([[s * 0.2, top - 0.02, 0.05], [s * 0.17, top - 0.1, 0.055]], 0.002, stitchM, { parent: g, segments: 6, radialSegments: 5 });
    }
  }
  mesh(ellipseRing(0.2, 0.046, 0.014, { y: top - 0.012, flatY: 1.6 }), main, { parent: g, name: 'waistband' });
  btn(g, M.metal(kind === 'jeans' ? '#b9905a' : '#2a2a2a', 0.3), [0, top - 0.012, 0.062], 0.008);
  curveTube([[0.015, top - 0.03, 0.05], [0.02, top - 0.14, 0.058], [0, top - 0.17, 0.06]], 0.002, stitchM, { parent: g, segments: 10, radialSegments: 5 });
  for (const x of [-0.17, -0.07, 0.07, 0.17]) mesh(roundedBox(0.012, 0.035, 0.004, 0.0015), main, { parent: g, at: [x, top - 0.012, 0.059 * Math.sqrt(1 - (x / 0.214) ** 2) + 0.004] });
  return { g, bottom: top - L };
}

/** Any hung garment by kind. */
export function hungGarment(parent, kind, T, opts = {}) {
  if (TOP_SPEC[kind]) return hungTop(parent, kind, T, opts);
  return hungBottom(parent, kind, T, opts);
}

/* -------------------------- body forms + fits --------------------------- */

/**
 * Torso profile for dress forms and mannequins. y=0 at the crotch, grows upward.
 * Returns { prof(y) → {a,b,z}, neckBase, neckTop, shoulderY, shoulderX, waistY, hipY, chestA }.
 */
export function bodyProfile(kind = 'female', s = 1) {
  const K = {
    female: [[-0.02, 0.15, 0.11, -0.005], [0.08, 0.18, 0.13, -0.012], [0.2, 0.155, 0.11, -0.005], [0.3, 0.125, 0.09, 0], [0.4, 0.14, 0.1, 0.006], [0.48, 0.163, 0.118, 0.016], [0.56, 0.165, 0.108, 0.006], [0.62, 0.178, 0.095, -0.004], [0.665, 0.188, 0.08, -0.01], [0.7, 0.15, 0.07, -0.012], [0.725, 0.068, 0.055, -0.01], [0.82, 0.05, 0.048, 0]],
    male: [[-0.02, 0.15, 0.11, -0.005], [0.08, 0.17, 0.12, -0.01], [0.2, 0.162, 0.115, -0.002], [0.32, 0.155, 0.11, 0.004], [0.42, 0.168, 0.118, 0.008], [0.52, 0.18, 0.122, 0.01], [0.6, 0.19, 0.11, 0.004], [0.66, 0.205, 0.095, -0.006], [0.705, 0.215, 0.08, -0.012], [0.74, 0.16, 0.07, -0.014], [0.765, 0.075, 0.06, -0.01], [0.86, 0.058, 0.055, 0]],
  }[kind === 'male' ? 'male' : 'female'];
  const ys = K.map((k) => k[0] * s);
  const fa = smoothKeys(K.map((k, i) => [ys[i], k[1] * s]));
  const fb = smoothKeys(K.map((k, i) => [ys[i], k[2] * s]));
  const fz = smoothKeys(K.map((k, i) => [ys[i], k[3] * s]));
  const n = K.length;
  return {
    prof: (y) => ({ a: fa(y), b: fb(y), z: fz(y) }),
    neckBase: ys[n - 2],
    neckTop: ys[n - 1],
    shoulderY: ys[n - 4],
    shoulderX: K[n - 4][1] * s,
    waistY: ys[3],
    hipY: ys[1],
    hipA: K[1][1] * s,
    bottom: ys[0],
    s,
  };
}

/** Surface of revolution-like torso from y0 up to y1 using a profile (body or garment). */
export function torsoGeo(prof, y0, y1, { off = 0, nu = 44, nv = 40, flare = null, pleats = 0 } = {}) {
  return paramGeo((u, v) => {
    const y = y1 + (y0 - y1) * v;
    const P = prof(y);
    let a = P.a + off, b = P.b + off;
    if (flare) { const k = flare(y); a *= k; b *= k; }
    const th = u * Math.PI * 2;
    let x = a * Math.sin(th);
    let z = P.z - b * Math.cos(th);
    if (pleats) { const k = 1 + Math.sin(th * pleats) * 0.03 * Math.max(0, (P.y0 ?? 0) - y); x *= k; z = P.z + (z - P.z) * k; }
    return [x, y, z];
  }, nu, nv, { closedU: true });
}

/**
 * Garment over a body profile F (coordinates of the body: y=0 crotch). kind: dress | gown | shirt |
 * tshirt | sweater | hoodie | jacket | suit | blouse. arms: optional { L: pts, R: pts, r: fn } arm paths
 * (mannequin) — otherwise sleeves hang empty beside the torso (dress form).
 */
export function fitTop(parent, kind, T, F, { arms = null, groundY = -0.8, over = false } = {}) {
  const g = group(`fit-${kind}`, { parent });
  const main = mainMat(T, [4, 4]);
  const trimM = fabricMat(T.fab === 'neon' ? 'neon' : T.fab, T.fab === 'neon' ? T.c2 : T.c, { c2: T.c2, plain: true });
  const off = (T.thick ? 0.014 : 0.008) * F.s + (kind === 'jacket' || kind === 'suit' || kind === 'coat' ? 0.008 : 0);
  const loose = T.loose ? 1.06 : 1;
  const off2 = over ? 0.012 * F.s : 0;
  const prof = (y) => { const P = F.prof(y); return { a: P.a * loose + off2, b: P.b * loose + off2, z: P.z }; };
  const yTop = F.neckBase - 0.006 * F.s;
  let yBot;
  let flare = null;
  const long = { dress: -0.48, gown: groundY + 0.02, shirt: -0.06, tshirt: 0.0, sweater: 0.02, hoodie: 0.0, jacket: -0.14, suit: -0.14, coat: -0.55, blouse: 0.05 }[kind] ?? 0;
  yBot = (kind === 'gown' ? long : long * F.s * T.len - (T.len - 1) * 0.1 * F.s);
  if (T.crop && !['dress', 'gown', 'coat'].includes(kind)) yBot = F.waistY * 0.6;
  if (kind === 'dress' || kind === 'gown') {
    const fl = (kind === 'gown' ? 2.6 : 1.9) * (T.flare ?? 1);
    const hy = F.hipY;
    flare = (y) => (y >= hy ? 1 : 1 + ((hy - y) / (hy - yBot)) ** 1.3 * (fl - 1));
    // fitted waist above the hip line keeps the body shape
  } else if (kind === 'coat') {
    flare = (y) => (y >= F.hipY ? 1 : 1 + ((F.hipY - y) / (F.hipY - yBot)) * 0.25);
  } else if (T.loose || kind === 'hoodie' || kind === 'sweater') {
    const wy = F.waistY;
    flare = (y) => (y > wy + 0.12 ? 1 : 1 + Math.min(1, (wy + 0.12 - y) / 0.2) * 0.12);
  }
  mesh(torsoGeo(prof, yBot, yTop, { off, flare, nv: kind === 'gown' ? 56 : 40 }), main, { parent: g, name: 'garment' });
  const at = (x, y, side = 1) => {
    const P = prof(y);
    let a = P.a + off, b = P.b + off;
    if (flare) { const k = flare(y); a *= k; b *= k; }
    const zz = P.z + side * b * Math.sqrt(Math.max(0, 1 - (x / a) ** 2));
    return [x, y, zz];
  };
  // sleeves
  const sleeveFull = !['dress', 'gown', 'tshirt'].includes(kind);
  const sleeveLen = sleeveFull ? Math.min(1, T.sleeve) : kind === 'tshirt' ? 0.3 : T.trim && T.sleeve < 0.5 ? 0.18 : 0;
  if (sleeveLen > 0) {
    for (const [s, side] of [[-1, 'L'], [1, 'R']]) {
      let pts;
      let rad;
      if (arms) {
        const path = arms[side];
        const curve = new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p)));
        const n = 8;
        pts = [];
        const tl = sleeveLen >= 1 ? 0.93 : sleeveLen;
        for (let i = 0; i <= n; i++) { const p = curve.getPointAt((i / n) * tl); pts.push([p.x, p.y, p.z]); }
        const rr = (t) => arms.r(t * tl) + off + 0.01 * F.s * (T.loose ? 1.6 : 1);
        rad = rr;
      } else {
        const sx = F.shoulderX * 0.94;
        const sy = F.shoulderY - 0.03 * F.s;
        const Ls = 0.56 * F.s * sleeveLen;
        pts = [[s * (sx - 0.02), sy, 0], [s * (sx + 0.02), sy - Ls * 0.4, 0.01], [s * (sx + 0.035), sy - Ls, 0.02]];
        rad = [0.06 * F.s, (sleeveLen < 0.5 ? 0.058 : 0.045) * F.s];
      }
      mesh(taperTube(pts, rad, { seg: 16, radial: 14 }), main, { parent: g, name: 'sleeve' });
    }
  }
  // details
  const nY = yTop;
  const nP = prof(nY);
  const buttonM = T.fab === 'leather' ? M.chrome() : M.plastic(T.trim ? '#2a2420' : '#efe9dc', 0.3);
  if (['sweater', 'tshirt', 'hoodie'].includes(kind)) {
    mesh(ellipseRing(nP.a + off + 0.004, nP.b + off + 0.004, 0.008 * F.s, { y: nY, z: nP.z }), trimM, { parent: g, name: 'neck_rib' });
    const hp = prof(yBot);
    const k = flare ? flare(yBot) : 1;
    mesh(ellipseRing((hp.a + off) * k, (hp.b + off) * k, 0.01 * F.s, { y: yBot + 0.012, z: hp.z, flatY: 1.6 }), trimM, { parent: g, name: 'hem_rib' });
  }
  if (kind === 'shirt' || kind === 'blouse') {
    mesh(ellipseRing(nP.a + off + 0.006, nP.b + off + 0.006, 0.012 * F.s, { y: nY + 0.01, z: nP.z, flatY: 1.6 }), main, { parent: g, name: 'collar' });
    for (let i = 0; i < 6; i++) { const y = nY - 0.04 - i * (nY - yBot - 0.08) / 5; const p = at(0, y); btn(g, buttonM, [0, y, p[2] + 0.002], 0.006 * F.s); }
  }
  if (kind === 'hoodie') {
    const hood = new THREE.SphereGeometry(0.15 * F.s, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hood.scale(1.05, 0.9, 0.5);
    hood.rotateX(-Math.PI * 0.42);
    mesh(hood, main, { parent: g, at: [0, nY - 0.05 * F.s, nP.z - nP.b - 0.02], name: 'hood' });
    const pp = at(0, F.waistY * 0.45);
    mesh(extrudeOutline([[-0.15, -0.08], [0.15, -0.08], [0.11, 0.07], [-0.11, 0.07]].map(([x, y]) => [x * F.s, y * F.s]), 0.005, { bevel: 0.002, segments: 1 }), main, { parent: g, at: [0, pp[1], pp[2] + 0.004], name: 'pocket' });
  }
  if (kind === 'jacket' || kind === 'suit' || kind === 'coat') {
    const zipped = T.fab === 'leather' || T.fab === 'neon';
    const vy = nY - 0.3 * F.s;
    if (!zipped) {
      const inner = fabricMat('cotton', kind === 'suit' ? '#f4f4f2' : '#e6e1d8', { plain: true });
      const f0 = at(0, nY - 0.1);
      mesh(extrudeOutline([[-0.07 * F.s, nY], [0.07 * F.s, nY], [0, vy]], 0.004, { bevel: 0.0015, segments: 1 }), inner, { parent: g, at: [0, 0, f0[2] + 0.0005], name: 'shirt_front' });
      for (const s of [-1, 1]) {
        const lw = (kind === 'coat' ? 0.1 : 0.08) * F.s;
        const lap = mesh(extrudeOutline([[s * 0.07 * F.s, nY], [s * (0.07 * F.s + lw * 0.6), nY - 0.03], [s * (0.06 * F.s + lw), nY - 0.12 * F.s], [s * (0.05 * F.s + lw * 0.6), nY - 0.17 * F.s], [s * 0.01, vy]], 0.005, { bevel: 0.002, segments: 1 }), main, { parent: g, name: 'lapel' });
        lap.position.z = at(s * 0.1 * F.s, nY - 0.12 * F.s)[2] + 0.002;
        lap.rotation.x = -0.08;
      }
      if (kind === 'suit') {
        const tieM = fabricMat('silk', T.trim ? T.c2 : '#7a1f2b', { c2: '#e8d8a8' });
        mesh(extrudeOutline([[-0.012, 0], [0.012, 0], [0.04, -0.27], [0, -0.3], [-0.04, -0.27]].map(([x, y]) => [x * F.s, y * F.s]), 0.006, { bevel: 0.002, segments: 1 }), tieM, { parent: g, at: [0, nY - 0.012, f0[2] + 0.004], name: 'tie' });
      }
      for (let i = 0; i < (kind === 'coat' ? 3 : 2); i++) {
        const y = vy - 0.03 - i * 0.1 * F.s;
        for (const s of kind === 'coat' ? [-1, 1] : [0]) { const p = at(s * 0.07 * F.s, y); btn(g, buttonM, [p[0], y, p[2] + 0.003], 0.009 * F.s); }
      }
    } else {
      const zz = [];
      for (let i = 0; i <= 8; i++) { const y = nY - 0.01 + (yBot + 0.02 - nY) * (i / 8); const x = T.fab === 'leather' ? 0.06 * F.s * (1 - i / 8) : 0; zz.push(at(x, y)); }
      curveTube(zz.map(([x, y, z]) => [x, y, z + 0.003]), 0.004, M.chrome(), { parent: g, segments: 30, radialSegments: 6, name: 'zip' });
      mesh(ellipseRing(nP.a + off + 0.008, nP.b + off + 0.008, 0.014 * F.s, { y: nY + 0.008, z: nP.z, flatY: 1.8 }), trimM, { parent: g, name: 'collar' });
    }
    for (const s of [-1, 1]) {
      const y = F.waistY * 0.35;
      const p = at(s * 0.11 * F.s, y);
      mesh(roundedBox(0.12 * F.s, 0.035 * F.s, 0.004, 0.0015), main, { parent: g, at: [p[0], y, p[2] + 0.002], name: 'pocket_flap' });
    }
  }
  if (kind === 'dress' || kind === 'gown') {
    const P = prof(F.waistY);
    mesh(ellipseRing(P.a + off + 0.003, P.b + off + 0.003, 0.011 * F.s, { y: F.waistY, z: P.z, flatY: 1.4 }), fabricMat(T.trim ? 'silk' : 'cotton', T.trim ? T.c2 : '#1d1d1f', { plain: true }), { parent: g, name: 'waist_sash' });
  }
  return { g, bottom: yBot };
}

/** Trousers / jeans / skirt / shorts on a body (mannequin). legs: { L: pts, R: pts, r: fn }. */
export function fitBottom(parent, kind, T, F, legs, { band = true } = {}) {
  const g = group(`fit-${kind}`, { parent });
  const main = mainMat(T, [4, 4]);
  const off = 0.01 * F.s;
  const yW = F.waistY + 0.02 * F.s;
  if (kind === 'skirt') {
    const yB = -0.42 * F.s * T.len;
    const fl = 1.4 * (T.flare ?? 1);
    mesh(torsoGeo(F.prof, yB, yW, { off, flare: (y) => (y >= F.hipY ? 1 : 1 + ((F.hipY - y) / (F.hipY - yB)) * (fl - 1)) }), main, { parent: g, name: 'skirt' });
    return g;
  }
  mesh(torsoGeo(F.prof, -0.03 * F.s, yW, { off, nv: 14 }), main, { parent: g, name: 'seat' });
  const P = F.prof(yW);
  if (band) mesh(ellipseRing(P.a + off + 0.002, P.b + off + 0.002, 0.012 * F.s, { y: yW - 0.01, z: P.z, flatY: 1.5 }), main, { parent: g, name: 'waistband' });
  const tl = kind === 'shorts' ? 0.38 : T.crop ? 0.88 : 0.97;
  for (const side of ['L', 'R']) {
    const curve = new THREE.CatmullRomCurve3(legs[side].map((p) => new THREE.Vector3(...p)));
    const pts = [];
    for (let i = 0; i <= 10; i++) { const p = curve.getPointAt((i / 10) * tl); pts.push([p.x, p.y, p.z]); }
    const minR = (kind === 'jeans' ? 0.06 : 0.065) * F.s * (T.loose ? 1.2 : T.slim ? 0.85 : 1);
    mesh(taperTube(pts, (t) => Math.max(minR * (1 - t * 0.15), legs.r(t * tl) + off + 0.004), { seg: 20, radial: 16 }), main, { parent: g, name: 'leg' });
  }
  if (kind === 'jeans' || T.fab === 'denim') {
    const st = fabricMat('cotton', T.c2 ?? '#d9a441', { plain: true });
    for (const s of [-1, 1]) {
      const p = F.prof(yW - 0.04);
      curveTube([[s * (p.a - 0.01), yW - 0.02, p.z + p.b * 0.55], [s * p.a * 0.6, yW - 0.09, p.z + p.b * 0.92 + off], [s * p.a * 0.35, yW - 0.03, p.z + p.b + off]], 0.0025, st, { parent: g, segments: 12, radialSegments: 5 });
    }
  }
  return g;
}
