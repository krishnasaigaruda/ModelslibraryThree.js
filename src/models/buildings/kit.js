import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as M from '../../core/materials.js';
import { rng, roundedBox as coreRoundedBox } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';
import { styleFor, weatherColor } from './style.js';

/** core roundedBox is exactly w × h × d. */
function roundedBox(w, h, d, r = 0.05, seg = 1) {
  r = Math.min(r, w / 2.2, h / 2.2, d / 2.2);
  return coreRoundedBox(w, h, d, r, seg);
}

/*
 * Building kit: procedural surface textures (canvas, browser only — plain
 * colours in Node), a geometry batcher that merges static parts per material
 * (a whole house ends up as ~15 meshes), and architectural parts: walls with
 * plinths, framed windows with sills and glowing interiors, doors, roofs,
 * gutters, porches, railings, chimneys, awnings, AC units.
 */

const hasDOM = typeof document !== 'undefined';
const texCache = new Map();

/* ------------------------------------------------------------------ */
/* Procedural textures (grayscale patterns, tinted by material colour) */
/* ------------------------------------------------------------------ */

const PAINTERS = {
  siding(g, s, r) {
    const n = 8;
    const bh = s / n;
    for (let i = 0; i < n; i++) {
      const y = i * bh;
      const grd = g.createLinearGradient(0, y, 0, y + bh);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.85, '#e4e4e4');
      grd.addColorStop(1, '#9a9a9a');
      g.fillStyle = grd;
      g.fillRect(0, y, s, bh);
    }
  },
  vboard(g, s) {
    const n = 8;
    const bw = s / n;
    for (let i = 0; i < n; i++) {
      const grd = g.createLinearGradient(i * bw, 0, (i + 1) * bw, 0);
      grd.addColorStop(0, '#9c9c9c');
      grd.addColorStop(0.08, '#f2f2f2');
      grd.addColorStop(0.9, '#e6e6e6');
      grd.addColorStop(1, '#b0b0b0');
      g.fillStyle = grd;
      g.fillRect(i * bw, 0, bw, s);
    }
  },
  brick(g, s, r) {
    g.fillStyle = '#d8d4cc';
    g.fillRect(0, 0, s, s);
    const rows = 16;
    const bh = s / rows;
    const bw = bh * 3.2;
    for (let i = 0; i < rows; i++) {
      const off = (i % 2) * bw * 0.5;
      for (let x = -bw; x < s + bw; x += bw) {
        const v = 150 + Math.floor(r() * 70);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x + off + 2, i * bh + 2, bw - 4, bh - 4);
      }
    }
  },
  stone(g, s, r) {
    g.fillStyle = '#8c8c8c';
    g.fillRect(0, 0, s, s);
    const rows = 6;
    const bh = s / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 40;
      while (x < s) {
        const w = bh * (1 + r() * 1.4);
        const v = 140 + Math.floor(r() * 90);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.roundRect(x + 3, i * bh + 3, w - 6, bh - 6, 8);
        g.fill();
        x += w;
      }
    }
  },
  shingle(g, s, r) {
    g.fillStyle = '#3a3a3a';
    g.fillRect(0, 0, s, s);
    const rows = 10;
    const bh = s / rows;
    for (let i = 0; i < rows; i++) {
      const off = (i % 2) * 18;
      for (let x = -40; x < s + 40; x += 36) {
        const v = 120 + Math.floor(r() * 80);
        const grd = g.createLinearGradient(0, i * bh, 0, (i + 1) * bh);
        grd.addColorStop(0, `rgb(${v * 0.75},${v * 0.75},${v * 0.75})`);
        grd.addColorStop(1, `rgb(${v},${v},${v})`);
        g.fillStyle = grd;
        g.fillRect(x + off + 1, i * bh + 1, 34, bh - 2);
      }
    }
  },
  tile(g, s, r) {
    g.fillStyle = '#5a5a5a';
    g.fillRect(0, 0, s, s);
    const rows = 8;
    const bh = s / rows;
    const tw = s / 8;
    for (let i = 0; i < rows; i++) {
      for (let k = 0; k < 8; k++) {
        const x = k * tw;
        const grd = g.createLinearGradient(x, 0, x + tw, 0);
        const v = 170 + Math.floor(r() * 60);
        grd.addColorStop(0, `rgb(${v * 0.6},${v * 0.6},${v * 0.6})`);
        grd.addColorStop(0.5, `rgb(${v},${v},${v})`);
        grd.addColorStop(1, `rgb(${v * 0.6},${v * 0.6},${v * 0.6})`);
        g.fillStyle = grd;
        g.beginPath();
        g.roundRect(x + 1, i * bh + 1, tw - 2, bh - 1, [0, 0, tw / 2, tw / 2]);
        g.fill();
      }
    }
  },
  seam(g, s) {
    g.fillStyle = '#e8e8e8';
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += s / 6) {
      g.fillStyle = '#ffffff';
      g.fillRect(x, 0, 4, s);
      g.fillStyle = '#9a9a9a';
      g.fillRect(x + 4, 0, 3, s);
    }
  },
  corrugated(g, s) {
    for (let x = 0; x < s; x++) {
      const v = 175 + Math.round(60 * Math.sin((x / s) * Math.PI * 2 * 16));
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x, 0, 1, s);
    }
  },
  log(g, s) {
    const n = 8;
    const bh = s / n;
    for (let i = 0; i < n; i++) {
      const grd = g.createLinearGradient(0, i * bh, 0, (i + 1) * bh);
      grd.addColorStop(0, '#5a5a5a');
      grd.addColorStop(0.25, '#e8e8e8');
      grd.addColorStop(0.6, '#d0d0d0');
      grd.addColorStop(1, '#3c3c3c');
      g.fillStyle = grd;
      g.fillRect(0, i * bh, s, bh);
    }
  },
  stucco(g, s, r) {
    g.fillStyle = '#f0f0f0';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const v = 205 + Math.floor(r() * 50);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(r() * s, r() * s, 2, 2);
    }
  },
  concrete(g, s, r) {
    PAINTERS.stucco(g, s, r);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, s - 2, s, 2);
    g.fillRect(s - 2, 0, 2, s);
  },
  plank(g, s, r) {
    const n = 6;
    const bw = s / n;
    for (let i = 0; i < n; i++) {
      const v = 180 + Math.floor(r() * 60);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(i * bw, 0, bw - 3, s);
      g.fillStyle = '#555';
      g.fillRect(i * bw + bw - 3, 0, 3, s);
    }
  },
  awning(g, s) {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#ffffff' : '#000000';
      g.fillRect((i * s) / 8, 0, s / 8, s);
    }
  },
};

/** metres covered by one texture tile, per pattern */
const TILE = { siding: 1.2, vboard: 2.4, brick: 1.1, stone: 1.6, shingle: 1.6, tile: 1.6, seam: 2.4, corrugated: 2.0, log: 1.6, stucco: 2, concrete: 3, plank: 1.2, awning: 2.4 };

function patternTexture(kind) {
  if (!hasDOM || !PAINTERS[kind]) return null;
  if (texCache.has(kind)) return texCache.get(kind);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  PAINTERS[kind](c.getContext('2d'), 256, rng(kind));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(kind, t);
  return t;
}

/** Textured surface material; the pattern is tinted by `color`. */
export function surface(kind, color, { roughness = 0.85, metalness = 0, name } = {}) {
  const mat = new THREE.MeshStandardMaterial({ name: name ?? kind, color: M.toColor(color), roughness, metalness, map: patternTexture(kind) });
  mat.userData.tile = TILE[kind] ?? 1;
  return mat;
}

/** Material set shared by a building. */
export function palette(o, d) {
  const st = styleFor(o.trim);
  d = { ...d, ...(st.design ?? {}) };
  const glow = new THREE.MeshStandardMaterial({
    name: 'win_glow', color: '#2b2e33', emissive: '#ffcf8a', emissiveIntensity: o.lightsOn && !st.boarded ? 1.6 : 0, roughness: 0.9,
  });
  const mats = {
    wall: surface(d.wallKind ?? 'stucco', o.color ?? d.wall, { name: 'wall' }),
    roof: surface(d.roofKind ?? 'shingle', o.roofColor ?? d.roof, { name: 'roof', roughness: d.roofKind === 'seam' ? 0.45 : 0.9, metalness: d.roofKind === 'seam' ? 0.6 : 0 }),
    trim: new THREE.MeshStandardMaterial({ name: 'trim', color: M.toColor(o.trimColor ?? d.trim ?? '#f4f2ee'), roughness: 0.55 }),
    accent: new THREE.MeshStandardMaterial({ name: 'accent', color: M.toColor(o.accentColor ?? d.accent ?? '#2f4f3a'), roughness: 0.6 }),
    plinth: surface(d.plinthKind ?? 'concrete', d.plinth ?? '#a9a59c', { name: 'plinth' }),
    glass: new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#9fb4c2', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1, envMapIntensity: 1.5, depthWrite: false }),
    glow,
    dark: new THREE.MeshStandardMaterial({ name: 'dark', color: '#26282b', roughness: 0.7 }),
    metal: M.metal('#7c8288', 0.4),
    concrete: surface('concrete', '#bdb9b1', { name: 'concrete' }),
    door: new THREE.MeshStandardMaterial({ name: 'door', color: M.toColor(o.doorColor ?? d.door ?? '#7a2e2a'), roughness: 0.5 }),
  };
  if (st.weathered) {
    for (const k of ['wall', 'roof', 'trim', 'accent', 'plinth', 'door', 'concrete']) mats[k].color = weatherColor(mats[k].color, st.weathered);
    mats.wall.roughness = 0.95;
  }
  mats._style = st;
  return mats;
}

/** Extra materials used by trims (snow, foliage, solar…), cached per builder. */
function extraMat(B, key) {
  B.extra ??= {};
  if (B.extra[key]) return B.extra[key];
  const make = {
    snow: () => new THREE.MeshStandardMaterial({ name: 'snow', color: '#f7f9fc', roughness: 0.75 }),
    ice: () => new THREE.MeshPhysicalMaterial({ name: 'ice', color: '#dff1ff', roughness: 0.1, transparent: true, opacity: 0.8, clearcoat: 1 }),
    ivy: () => new THREE.MeshStandardMaterial({ name: 'ivy', color: '#2f5a2a', roughness: 0.9, flatShading: true }),
    moss: () => new THREE.MeshStandardMaterial({ name: 'moss', color: '#56693a', roughness: 1, flatShading: true }),
    weeds: () => new THREE.MeshStandardMaterial({ name: 'weeds', color: '#6a7a3c', roughness: 1, flatShading: true }),
    board: () => surface('plank', '#8a7a62', { name: 'boards' }),
    solar: () => new THREE.MeshPhysicalMaterial({ name: 'solar', color: '#1b2a4a', roughness: 0.18, metalness: 0.3, clearcoat: 1 }),
    alu: () => M.metal('#b9bec4', 0.35),
    quoin: () => surface('stone', B.style.quoins ?? '#d8d0c0', { name: 'quoins' }),
    beam: () => new THREE.MeshStandardMaterial({ name: 'timber', color: B.style.tudor ?? '#3a2a1e', roughness: 0.8 }),
    picket: () => new THREE.MeshStandardMaterial({ name: 'fence', color: '#f4f2ec', roughness: 0.6 }),
    path: () => surface('stone', '#a9a398', { name: 'path' }),
  }[key];
  B.extra[key] = make();
  return B.extra[key];
}
export { extraMat };

/* ------------------------------------------------------------------ */
/* Batcher                                                             */
/* ------------------------------------------------------------------ */

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _n = new THREE.Vector3();

function worldUV(geo, tile) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    let u;
    let v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

export class Builder {
  constructor(root, mats) {
    this.root = root;
    this.mats = mats;
    this.batches = new Map();
    this.frame = new THREE.Matrix4();
    this.stack = [];
    this.doors = [];
    this.style = mats._style ?? {};
    this.openings = []; // world AABBs of windows/doors (trims avoid them)
    this.faces = []; // wall faces from block(): { matrix, width, y0, y1 }
    this.rand = rng(11);
  }

  /** World AABB of a local rect on the facade plane (x0..x1, y0..y1, depth z). */
  worldRect(x0, y0, x1, y1, z = 0.1) {
    const b = new THREE.Box3();
    for (const [x, y, zz] of [[x0, y0, 0], [x1, y0, 0], [x0, y1, 0], [x1, y1, 0], [x0, y0, z], [x1, y1, z]]) b.expandByPoint(new THREE.Vector3(x, y, zz).applyMatrix4(this.frame));
    return b;
  }

  blocked(box, pad = 0.06) {
    const b = box.clone().expandByScalar(pad);
    return this.openings.some((o) => o.intersectsBox(b));
  }

  /** Run fn with a local frame: translate (x,y,z) then rotate about Y by ry. */
  local(x, y, z, ry, fn) {
    this.stack.push(this.frame.clone());
    this.frame.multiply(_m.compose(_v.set(x, y, z), _q.setFromAxisAngle(_n.set(0, 1, 0), ry), _s));
    fn();
    this.frame.copy(this.stack.pop());
  }

  /** Add a geometry (local to the current frame) with an optional extra matrix. */
  add(mat, geo, matrix) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    g.applyMatrix4(this.frame);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (mat.userData.tile) worldUV(g, mat.userData.tile);
    else if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!this.batches.has(mat)) this.batches.set(mat, []);
    this.batches.get(mat).push(g);
    if (this._collect) this._collect.push([mat, g]);
  }

  /** Remove geometry previously added (by windowUnit groups). */
  removeParts(parts) {
    for (const [mat, g] of parts) {
      const list = this.batches.get(mat);
      const i = list ? list.indexOf(g) : -1;
      if (i >= 0) list.splice(i, 1);
    }
  }

  /** Axis-aligned box centred at (x,y,z) in the current frame. */
  box(mat, w, h, d, x = 0, y = 0, z = 0, ry = 0, bevel) {
    const r = bevel ?? (Math.min(w, h, d) >= 0.06 ? Math.min(0.02, Math.min(w, h, d) * 0.22) : 0);
    const geo = r > 0.002 ? roundedBox(w, h, d, r, 1) : new THREE.BoxGeometry(w, h, d);
    this.add(mat, geo, _m.compose(_v.set(x, y, z), _q.setFromAxisAngle(_n.set(0, 1, 0), ry), _s).clone());
  }

  cyl(mat, rTop, rBot, h, x, y, z, seg = 16) {
    this.add(mat, new THREE.CylinderGeometry(rTop, rBot, h, seg), new THREE.Matrix4().makeTranslation(x, y, z));
  }

  /** Geometry placed by a full matrix. */
  geo(mat, geometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    this.add(mat, geometry, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), _s));
  }

  /**
   * Thick slab between two points in the Z/Y plane, spanning X (roofs, ramps).
   * Bottom surface lies on the line p0→p1.
   */
  slab(mat, z0, y0, z1, y1, xLen, thick = 0.12, xc = 0) {
    if (z1 < z0) [z0, y0, z1, y1] = [z1, y1, z0, y0];
    const dz = z1 - z0;
    const dy = y1 - y0;
    const len = Math.hypot(dz, dy);
    const th = Math.atan2(-dy, dz);
    const nY = Math.cos(th);
    const nZ = Math.sin(th);
    const at = (lift, t) => {
      const mm = new THREE.Matrix4().makeRotationX(th);
      mm.setPosition(xc, (y0 + y1) / 2 + nY * (lift + t / 2), (z0 + z1) / 2 + nZ * (lift + t / 2));
      return mm;
    };
    if (mat === this.mats.roof && this._sagOK && len > 1.5 && xLen > 1.5) {
      // abandoned: the roof sags between the rafters and has a hole torn in it
      // top surface dips, underside dips further into the attic, edges keep their thickness
      const g = new THREE.BoxGeometry(xLen, 1, len, 10, 1, 8);
      const p = g.attributes.position;
      const sag = Math.min(0.32, len * 0.06);
      const f = (x, z) => Math.sin(Math.PI * (x / xLen + 0.5)) * Math.sin(Math.PI * (z / len + 0.5));
      const sagAt = (x, z) => sag * f(x, z);
      for (let i = 0; i < p.count; i++) {
        const k = f(p.getX(i), p.getZ(i));
        p.setY(i, p.getY(i) > 0 ? thick - sag * k : -0.35 * k);
      }
      g.computeVertexNormals();
      this.add(mat, g, at(0, 0));
      const hx = (this.rand() - 0.5) * xLen * 0.5;
      const hz = (this.rand() - 0.5) * len * 0.4;
      const hm = at(thick + 0.006 - sagAt(hx, hz), 0);
      hm.multiply(new THREE.Matrix4().makeTranslation(hx, 0, hz));
      this.add(this.mats.dark, new THREE.BoxGeometry(Math.min(1.4, xLen * 0.3), 0.012, Math.min(1.0, len * 0.3)), hm);
      for (const k of [-0.25, 0.2]) {
        const rm = hm.clone().multiply(new THREE.Matrix4().makeTranslation(k, 0.02, 0));
        this.add(extraMat(this, 'board'), new THREE.BoxGeometry(0.08, 0.05, Math.min(1.1, len * 0.32)), rm);
      }
      this.roofOverlay({ xLen, len, thick, th, at, z0, y0, z1, y1, xc });
      return;
    }
    this.add(mat, new THREE.BoxGeometry(xLen, thick, len), at(0, thick));
    if (mat === this.mats.roof && len > 0.8 && xLen > 0.8) this.roofOverlay({ xLen, len, thick, th, at, z0, y0, z1, y1, xc });
  }

  /** Trim decorations on a sloped roof slab: snow + icicles, solar panels, moss. */
  roofOverlay({ xLen, len, thick, th, at, z0, y0, z1, y1, xc }) {
    const st = this.style;
    if (st.snow) {
      this.add(extraMat(this, 'snow'), roundedBox(xLen - 0.08, 0.14, len - 0.04, 0.06, 1), at(thick - 0.02, 0.14));
      // icicles along the lower edge
      const low = y0 < y1 ? [z0, y0] : [z1, y1];
      for (let x = -xLen / 2 + 0.3; x < xLen / 2 - 0.2; x += 0.35 + this.rand() * 0.3) {
        const L = 0.15 + this.rand() * 0.35;
        this.add(extraMat(this, 'ice'), new THREE.ConeGeometry(0.035, L, 5).rotateX(Math.PI), new THREE.Matrix4().makeTranslation(xc + x, low[1] - L / 2 + 0.02, low[0] + Math.sign(low[0] || 1) * -0.02));
      }
    }
    if (st.solar) {
      const nrm = new THREE.Vector3(0, Math.cos(th), Math.sin(th)).applyMatrix3(new THREE.Matrix3().setFromMatrix4(this.frame)).normalize();
      if ((nrm.z > 0.3 || nrm.x > 0.5 || (nrm.y > 0.97 && nrm.z > 0)) && len > 2.4 && xLen > 2.6) {
        const pw = 1.02;
        const pl = 1.66;
        const cols = Math.floor((xLen - 0.9) / (pw + 0.04));
        const rows = Math.floor((len - 0.8) / (pl + 0.04));
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const px = xc + (c - (cols - 1) / 2) * (pw + 0.04);
          const along = (r - (rows - 1) / 2) * (pl + 0.04);
          const m = at(thick + 0.02, 0.05);
          m.multiply(new THREE.Matrix4().makeTranslation(px - xc, 0, along));
          this.add(extraMat(this, 'alu'), new THREE.BoxGeometry(pw, 0.05, pl), m);
          const m2 = at(thick + 0.045, 0.012);
          m2.multiply(new THREE.Matrix4().makeTranslation(px - xc, 0, along));
          this.add(extraMat(this, 'solar'), new THREE.BoxGeometry(pw - 0.05, 0.012, pl - 0.05), m2);
        }
      }
    }
    if (st.moss) {
      const n = Math.round(xLen * len * 0.25);
      for (let i = 0; i < n; i++) {
        const r = 0.15 + this.rand() * 0.35;
        const m = at(thick - 0.02, 0);
        m.multiply(new THREE.Matrix4().compose(new THREE.Vector3((this.rand() - 0.5) * (xLen - 0.6), 0, (this.rand() - 0.5) * (len - 0.6)), new THREE.Quaternion(), new THREE.Vector3(1, 0.22, 1)));
        this.add(extraMat(this, 'moss'), new THREE.IcosahedronGeometry(r, 0), m);
      }
    }
  }

  /** Prism from a polygon in the Z/Y plane, extruded along X from x0 to x1 (gable ends). */
  prism(mat, pts, x0, x1) {
    const shape = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(x1, 0, 0);
    this.add(mat, g);
  }

  /** Prism from a polygon in the X/Y plane, extruded along Z from z0 to z1. */
  prismXY(mat, pts, z0, z1) {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false });
    g.translate(0, 0, z0);
    this.add(mat, g);
  }

  /** Separate (animatable) object positioned in the current frame. */
  attach(object, x = 0, y = 0, z = 0, ry = 0) {
    const m = this.frame.clone().multiply(_m.compose(_v.set(x, y, z), _q.setFromAxisAngle(_n.set(0, 1, 0), ry), _s));
    m.decompose(object.position, object.quaternion, object.scale);
    this.root.add(object);
    return object;
  }

  finish() {
    this.frame.identity();
    styleFinish(this);
    // model size → max triangle edge: long slivers / huge faces are split into a grid so the
    // surface is evenly tessellated (decals, lines and emblems sit on real nearby vertices)
    const bb = new THREE.Box3();
    for (const list of this.batches.values()) for (const g of list) { if (!g.boundingBox) g.computeBoundingBox(); bb.union(g.boundingBox); }
    const maxEdge = 30 * Math.max(0.012, bb.isEmpty() ? 0 : bb.getSize(_v).length() / 600);
    for (const [mat, list] of this.batches) {
      for (const geo of splitBroad(tessellate(mergeGeometries(list, false), maxEdge), maxEdge / 30)) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = mat.name || 'part';
        this.root.add(mesh);
      }
    }
    this.batches.clear();
  }
}

/**
 * Bisect every triangle whose longest edge exceeds `maxEdge` until none does,
 * then order broad faces first (render order is irrelevant for these opaque batches).
 */

/**
 * A batch with a very large surface area (big facades) is cut into a few meshes, each holding
 * at most ~`budget` cell-sized surface samples of broad faces (triangles arrive broad-first from
 * tessellate()); the remaining slivers/small facets stay with the last mesh.
 */
function splitBroad(geo, cell, budget = 300000, maxParts = 12) {
  const pos = geo.attributes.position;
  const n = pos.count / 3;
  const A = new THREE.Vector3(), Bv = new THREE.Vector3(), C = new THREE.Vector3();
  const cuts = [];
  let acc = 0;
  for (let t = 0; t < n && cuts.length < maxParts - 1; t++) {
    A.fromBufferAttribute(pos, t * 3); Bv.fromBufferAttribute(pos, t * 3 + 1); C.fromBufferAttribute(pos, t * 3 + 2);
    const l = Math.max(A.distanceTo(Bv), Bv.distanceTo(C), C.distanceTo(A));
    const k = Math.min(256, Math.max(1, Math.ceil(l / cell)));
    const cost = ((k + 1) * (k + 2)) / 2;
    const area = _e1.subVectors(Bv, A).cross(_e2.subVectors(C, A)).length() / 2;
    if (cost / (area / (cell * cell) + 1) > 12) break; // past the broad faces
    acc += cost;
    if (acc > budget) { cuts.push(t); acc = cost; }
  }
  if (!cuts.length) return [geo];
  const bounds = [0, ...cuts, n];
  const out = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const g = new THREE.BufferGeometry();
    for (const [name, attr] of Object.entries(geo.attributes)) {
      const s = attr.itemSize * 3;
      g.setAttribute(name, new THREE.BufferAttribute(attr.array.slice(bounds[i] * s, bounds[i + 1] * s), attr.itemSize));
    }
    out.push(g);
  }
  return out;
}

const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
function tessellate(geo, maxEdge) {
  if (geo.index) geo = geo.toNonIndexed();
  const cell = maxEdge / 30;
  const names = Object.keys(geo.attributes);
  const src = names.map((n) => geo.attributes[n]);
  const A = new THREE.Vector3(), Bv = new THREE.Vector3(), C = new THREE.Vector3();
  const pos = geo.attributes.position;
  const out = names.map(() => []);
  const lens = [];
  const lerp3 = (attr, i0, i1, i2, u, w, dst) => {
    for (let c = 0; c < attr.itemSize; c++) {
      const a = attr.array[i0 * attr.itemSize + c], b = attr.array[i1 * attr.itemSize + c], d = attr.array[i2 * attr.itemSize + c];
      dst.push(a * (1 - u - w) + b * u + d * w);
    }
  };
  // point at barycentric (u, w) of the current triangle
  const P = ([u, w], v) => v.copy(A).multiplyScalar(1 - u - w).addScaledVector(Bv, u).addScaledVector(C, w);
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
  for (let t = 0; t < pos.count; t += 3) {
    A.fromBufferAttribute(pos, t); Bv.fromBufferAttribute(pos, t + 1); C.fromBufferAttribute(pos, t + 2);
    // recursive longest-edge bisection until every edge ≤ maxEdge (keeps aspect ratios sane,
    // unlike a uniform grid which turns a long thin face into long thin slivers)
    const stack = [[[0, 0], [1, 0], [0, 1], 0]];
    while (stack.length) {
      const [q0, q1, q2, depth] = stack.pop();
      P(q0, p0); P(q1, p1); P(q2, p2);
      const e = [p0.distanceTo(p1), p1.distanceTo(p2), p2.distanceTo(p0)];
      const l = Math.max(...e);
      if (l > maxEdge && depth < 14) {
        const i = e.indexOf(l); // edge (q_i, q_{i+1})
        const q = [q0, q1, q2];
        const qa = q[i], qb = q[(i + 1) % 3], qc = q[(i + 2) % 3];
        const m = [(qa[0] + qb[0]) / 2, (qa[1] + qb[1]) / 2];
        stack.push([qa, m, qc, depth + 1], [m, qb, qc, depth + 1]);
        continue;
      }
      // order key: how much surface a triangle covers per sample point (broad faces first,
      // slivers and tiny bevel facets last; their corners already describe them)
      const area = _e1.subVectors(p1, p0).cross(_e2.subVectors(p2, p0)).length() / 2;
      const nn = Math.ceil(l / cell);
      lens.push(((nn + 1) * (nn + 2)) / 2 / (area / (cell * cell) + 1));
      names.forEach((n, ai) => { const arr = []; for (const [u, w] of [q0, q1, q2]) lerp3(src[ai], t, t + 1, t + 2, u, w, arr); out[ai].push(arr); });
    }
  }
  const order = lens.map((_, i) => i).sort((a, b) => lens[a] - lens[b]);
  const g = new THREE.BufferGeometry();
  names.forEach((n, a) => {
    const flat = new Float32Array(order.length * 3 * src[a].itemSize);
    let o = 0;
    for (const i of order) for (const v of out[a][i]) flat[o++] = v;
    g.setAttribute(n, new THREE.BufferAttribute(flat, src[a].itemSize));
  });
  return g;
}

/* ------------------------------------------------------------------ */
/* Parts (all in the current frame; facade plane is z = 0, outward +Z)  */
/* ------------------------------------------------------------------ */

/**
 * Window. (x, y) = centre-bottom. style: 'double' | 'cross' | 'grid' | 'none' | 'arch' | 'tall'
 */
export function windowUnit(B, x, y, w, h, { style = 'double', shutters = null, sill = true, frame = B.mats.trim, header = null, depth = 0.08, glowMat } = {}) {
  const st = B.style;
  // trim overrides
  if (st.windowStyle && ['double', 'cross', 'grid', 'tall', 'none'].includes(style)) {
    style = st.windowStyle;
    if (style === 'arch' && (w > 1.35 || h > 2.4)) style = 'grid';
  }
  if (st.darkFrames) frame = B.mats.dark;
  if (st.noShutters) shutters = null;
  else if (st.shutters && !shutters && w <= 1.4 && h >= 0.9) shutters = B.mats.accent;
  if (st.headers && !header && style !== 'arch') header = extraMat(B, 'quoin');
  const { glass } = B.mats;
  const glow = st.boarded ? B.mats.dark : glowMat ?? B.mats.glow;
  const ft = 0.07;
  const cy = y + h / 2;
  const collected = [];
  B._collect = collected;
  B.windows ??= [];
  B.windows.push({ parts: collected, box: B.worldRect(x - w / 2, y, x + w / 2, y + h, 0.1) });
  B.openings.push(B.worldRect(x - w / 2 - ft, y - ft, x + w / 2 + ft, y + h + ft + (style === 'arch' ? w / 2 : 0)));
  // interior (glows at night) + glass
  B.add(glow, new THREE.PlaneGeometry(w, h), new THREE.Matrix4().makeTranslation(x, cy, 0.005));
  if (st.boarded && B.rand() < 0.45) {
    // broken pane: jagged glass shards left in the corners of the frame
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const [sx, sy] of corners) {
      if (B.rand() < 0.25) continue;
      const a = 0.25 + B.rand() * 0.45;
      const b = 0.25 + B.rand() * 0.45;
      const px = x + (sx * w) / 2;
      const py = cy + (sy * h) / 2;
      const shape = new THREE.Shape([new THREE.Vector2(px, py), new THREE.Vector2(px - sx * w * a, py), new THREE.Vector2(px - sx * w * a * 0.4, py - sy * h * b * 0.5), new THREE.Vector2(px, py - sy * h * b)]);
      B.add(glass, new THREE.ShapeGeometry(shape), new THREE.Matrix4().makeTranslation(0, 0, depth * 0.45));
    }
  } else if (st.boarded) {
    // glass gone, rough planks nailed across
    const n = Math.max(2, Math.round(h / 0.32));
    for (let k = 0; k < n; k++) {
      const yy = y + (h * (k + 0.5)) / n;
      const rz = (B.rand() - 0.5) * 0.25;
      B.add(extraMat(B, 'board'), new THREE.BoxGeometry(w + 0.22, Math.min(0.2, h / n - 0.03), 0.03).rotateZ(rz), new THREE.Matrix4().makeTranslation(x, yy, depth + 0.02));
    }
  } else B.add(glass, new THREE.PlaneGeometry(w, h), new THREE.Matrix4().makeTranslation(x, cy, depth * 0.45));
  if (st.balconettes && y > 3.2 && w <= 1.6) {
    B.box(B.mats.trim, w + 0.5, 0.1, 0.45, x, y - 0.12, 0.22);
    for (const s of [-1, 1]) B.box(B.mats.trim, 0.08, 0.22, 0.3, x + s * (w / 2 + 0.05), y - 0.3, 0.15);
    railingRun(B, x - w / 2 - 0.2, x + w / 2 + 0.2, 0.4, y - 0.07, B.mats.dark, { height: 0.7, spacing: 0.11 });
  }
  if (st.snow && sill) B.box(extraMat(B, 'snow'), w + 0.2, 0.05, 0.15, x, y - ft + 0.02, 0.09, 0, 0.02);
  // frame
  B.box(frame, w + ft * 2, ft, depth, x, y + h + ft / 2, depth / 2);
  B.box(frame, w + ft * 2, ft, depth, x, y - ft / 2, depth / 2);
  B.box(frame, ft, h, depth, x - w / 2 - ft / 2, cy, depth / 2);
  B.box(frame, ft, h, depth, x + w / 2 + ft / 2, cy, depth / 2);
  const bar = 0.035;
  if (style === 'double' || style === 'cross' || style === 'grid') B.box(frame, w, bar * 1.4, depth * 0.7, x, cy, depth / 2);
  if (style === 'cross' || style === 'grid') B.box(frame, bar, h, depth * 0.6, x, cy, depth / 2);
  if (style === 'grid') {
    for (const fy of [0.25, 0.75]) B.box(frame, w, bar * 0.7, depth * 0.5, x, y + h * fy, depth / 2);
    for (const fx of [-0.25, 0.25]) B.box(frame, bar * 0.7, h, depth * 0.5, x + w * fx, cy, depth / 2);
  }
  if (style === 'tall') for (let k = 1; k < 3; k++) B.box(frame, bar, h, depth * 0.6, x - w / 2 + (k * w) / 3, cy, depth / 2);
  if (style === 'arch') {
    const r = w / 2;
    const arch = new THREE.CircleGeometry(r, 24, 0, Math.PI);
    B.add(glow, arch, new THREE.Matrix4().makeTranslation(x, y + h, 0.005));
    B.add(glass, arch, new THREE.Matrix4().makeTranslation(x, y + h, depth * 0.45));
    B.add(frame, new THREE.TorusGeometry(r + ft / 2, ft / 2, 6, 24, Math.PI), new THREE.Matrix4().makeTranslation(x, y + h, depth / 2));
    B.box(frame, bar, h + r, depth * 0.6, x, y + (h + r) / 2, depth / 2);
  }
  if (sill) B.box(frame, w + 0.22, 0.05, 0.16, x, y - ft - 0.02, 0.08);
  if (header) B.box(header, w + 0.26, 0.14, 0.06, x, y + h + ft + 0.07, 0.03);
  if (shutters) {
    for (const s of [-1, 1]) {
      B.box(shutters, w * 0.48, h + 0.05, 0.035, x + s * (w / 2 + ft + w * 0.26), cy, 0.02);
      for (let k = 1; k < 8; k++) B.box(shutters, w * 0.42, 0.012, 0.045, x + s * (w / 2 + ft + w * 0.26), y + (h * k) / 8, 0.03);
    }
  }
  B._collect = null;
}

let doorCounter = 0;
/**
 * Door with casing and optional steps; the leaf is a separate pivot object
 * (named door_N) so it can animate. Returns the pivot.
 */
export function door(B, x, y, w, h, { mat = B.mats.door, frame = B.mats.trim, glass = false, steps = 0, canopy = null, double = false, name } = {}) {
  const ft = 0.1;
  B.openings.push(B.worldRect(x - w / 2 - ft, y - 0.05, x + w / 2 + ft, y + h + ft + (canopy ? 0.6 : 0)));
  if (B.style.darkFrames) frame = B.mats.dark;
  if (B.style.boarded) {
    for (const s of [-1, 1]) B.add(extraMat(B, 'board'), new THREE.BoxGeometry(Math.hypot(w, h) * 0.95, 0.18, 0.03).rotateZ(s * Math.atan2(h, w)), new THREE.Matrix4().makeTranslation(x, y + h / 2, 0.12 + (s + 1) * 0.02));
  }
  B.box(frame, w + ft * 2, ft, 0.12, x, y + h + ft / 2, 0.06);
  B.box(frame, ft, h, 0.12, x - w / 2 - ft / 2, y + h / 2, 0.06);
  B.box(frame, ft, h, 0.12, x + w / 2 + ft / 2, y + h / 2, 0.06);
  B.add(B.mats.dark, new THREE.PlaneGeometry(w, h), new THREE.Matrix4().makeTranslation(x, y + h / 2, 0.004));
  for (let s = 0; s < steps; s++) {
    const sh = y / steps;
    B.box(B.mats.concrete, w + 0.6, sh, 0.32 * (steps - s), x, sh * (s + 0.5), 0.16 * (steps - s));
  }
  if (canopy) {
    B.slab(canopy, 0, y + h + 0.45, 0.9, y + h + 0.25, w + 0.6, 0.08, x);
    for (const s of [-1, 1]) B.box(frame, 0.05, 0.3, 0.6, x + s * (w / 2 + 0.25), y + h + 0.2, 0.35);
  }
  const leaves = double ? [[-1, w / 2], [1, w / 2]] : [[-1, w]];
  const pivots = [];
  for (const [side, lw] of leaves) {
    const pivot = new THREE.Group();
    pivot.name = name ? `${name}${pivots.length || ''}` : `door_${doorCounter++}`;
    const leafMat = glass ? B.mats.glass : mat;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(lw - 0.01, h - 0.01, 0.05), leafMat);
    leaf.position.set((-side * lw) / 2, h / 2, 0);
    pivot.add(leaf);
    if (glass) {
      for (const [fw, fh, fx, fy] of [[lw, 0.08, 0, h - 0.04], [lw, 0.08, 0, 0.04], [0.06, h, -side * 0.03, h / 2], [0.06, h, -side * (lw - 0.03), h / 2]]) {
        const fr = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.06), B.mats.metal);
        fr.position.set(fx === 0 ? (-side * lw) / 2 : fx, fy, 0);
        pivot.add(fr);
      }
    } else {
      for (const fy of [0.28, 0.72]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(lw * 0.62, h * 0.32, 0.02), mat);
        p.position.set((-side * lw) / 2, h * fy, 0.03);
        pivot.add(p);
      }
    }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), M.metal('#c9a54a', 0.25));
    knob.position.set(-side * (lw - 0.1), h * 0.48, 0.05);
    pivot.add(knob);
    B.attach(pivot, x + side * (w / 2), y, 0.04);
    pivots.push({ pivot, side });
    B.doors.push({ pivot, side });
  }
  return pivots;
}

/** Simple gable roof over a w×d box at height y (ridge along X). Returns ridge height. */
export function gableRoof(B, w, d, y, { pitch = 0.6, overhang = 0.4, thick = 0.14, gableMat = B.mats.wall, fascia = B.mats.trim, gutter = true, ridgeAlong = 'x', cx = 0, cz = 0 } = {}) {
  const st = B.style;
  if (st.pitch && pitch > 0.3) pitch = Math.min(1.6, Math.max(0.35, pitch * st.pitch));
  if ((st.roofStyle === 'hip' || st.roofStyle === 'mansard') && pitch > 0.3 && w > 2.5 && d > 2.5) return hipRoof(B, w, d, y, { pitch, overhang, fascia, gutter, ridgeAlong, cx, cz, mansard: st.roofStyle === 'mansard' });
  if (st.dentils) {
    const L0 = w + overhang * 2;
    B.local(cx, 0, cz, ridgeAlong === 'x' ? 0 : Math.PI / 2, () => {
      for (const s of [-1, 1]) {
        B.box(fascia, w, 0.12, 0.1, 0, y - 0.1, s * (d / 2 + 0.05), 0, 0.01);
        for (let x = -w / 2 + 0.12; x < w / 2 - 0.08; x += 0.24) B.box(fascia, 0.1, 0.1, 0.12, x, y - 0.22, s * (d / 2 + 0.06), 0, 0);
      }
    });
    void L0;
  }
  const run = d / 2 + overhang;
  const rh = (d / 2) * pitch;
  const drop = overhang * pitch;
  const L = w + overhang * 2;
  const build = () => {
    const sagging = B.style.boarded && w > 3 && rh > 0.9;
    B._sagOK = sagging;
    B.slab(B.mats.roof, 0, y + rh, run, y - drop, L, thick);
    B.slab(B.mats.roof, -run, y - drop, 0, y + rh, L, thick);
    B._sagOK = false;
    if (sagging) {
      // full gable walls at the ends; the attic fill between them sits lower so the sagging roof never cuts into it
      const e = 0.4;
      B.prism(gableMat, [[-d / 2, y], [d / 2, y], [0, y + rh]], -w / 2, -w / 2 + e);
      B.prism(gableMat, [[-d / 2, y], [d / 2, y], [0, y + rh]], w / 2 - e, w / 2);
      const dz = 0.5 / pitch;
      B.prism(gableMat, [[-d / 2 + dz, y], [d / 2 - dz, y], [0, y + rh - 0.5]], -w / 2 + e, w / 2 - e);
    } else B.prism(gableMat, [[-d / 2, y], [d / 2, y], [0, y + rh]], -w / 2, w / 2);
    // ridge cap + fascia boards along the eaves and rakes
    B.add(B.mats.roof, new THREE.CylinderGeometry(0.09, 0.09, L, 8), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, y + rh + thick * 1.1, 0));
    for (const s of [-1, 1]) {
      B.box(fascia, L, 0.2, 0.04, 0, y - drop - 0.02, s * (run + 0.02));
      if (gutter) {
        B.add(B.mats.metal, new THREE.CylinderGeometry(0.06, 0.06, L, 10), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, y - drop - 0.06, s * (run + 0.08)));
        for (const e of [-1, 1]) B.cyl(B.mats.metal, 0.04, 0.04, y - drop, e * (w / 2 - 0.1), (y - drop) / 2, s * (d / 2 + 0.08), 8);
      }
      // rake boards on gable ends
      for (const e of [-1, 1]) {
        const len = Math.hypot(run, rh + drop);
        const ang = Math.atan2(rh + drop, run);
        B.add(fascia, roundedBox(0.07, 0.22, len, 0.02, 1), new THREE.Matrix4().makeRotationX(s * ang).setPosition(e * (L / 2 + 0.03), y + (rh - drop) / 2 + thick * 0.35, (s * run) / 2));
      }
    }
  };
  B.local(cx, 0, cz, ridgeAlong === 'x' ? 0 : Math.PI / 2, build);
  return y + rh;
}

/** Flat roof with parapet and coping. */
export function flatRoof(B, w, d, y, { parapet = 0.6, mat = B.mats.wall, cap = B.mats.trim, roofMat = B.mats.concrete, cx = 0, cz = 0 } = {}) {
  B.box(roofMat, w - 0.1, 0.06, d - 0.1, cx, y + 0.03, cz);
  const st = B.style;
  const t = parapet > 0 ? 0.22 : 0;
  const iw = w - 2 * t - 0.1;
  const id = d - 2 * t - 0.1;
  if (st.snow && iw > 0.5 && id > 0.5) {
    B.box(extraMat(B, 'snow'), iw, 0.16, id, cx, y + 0.06 + 0.08, cz, 0, 0.07);
    if (parapet > 0) for (const s of [-1, 1]) {
      B.box(extraMat(B, 'snow'), w + 0.04, 0.06, t + 0.04, cx, y + parapet + 0.09, cz + s * (d / 2 - t / 2), 0, 0.025);
      B.box(extraMat(B, 'snow'), t + 0.04, 0.06, d, cx + s * (w / 2 - t / 2), y + parapet + 0.09, cz, 0, 0.025);
    }
  }
  if (st.solar && iw > 3 && id > 3) {
    // rows of tilted panels on low racks, facing +Z
    const pw = 1.02;
    const tilt = 0.45;
    const cols = Math.floor((iw - 0.8) / (pw + 0.05));
    const rows = Math.floor((id - 0.8) / 1.9);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const px = cx + (c - (cols - 1) / 2) * (pw + 0.05);
      const pz = cz + (r - (rows - 1) / 2) * 1.9;
      const m = new THREE.Matrix4().makeRotationX(-tilt).setPosition(px, y + 0.06 + 0.45, pz);
      B.add(extraMat(B, 'alu'), new THREE.BoxGeometry(pw, 0.04, 1.66), m);
      B.add(extraMat(B, 'solar'), new THREE.BoxGeometry(pw - 0.05, 0.012, 1.61), m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.025, 0)));
      // racks: legs from roof to panel underside
      for (const s of [-1, 1]) {
        const lz = s * 0.7 * Math.cos(tilt);
        const top = 0.45 - s * 0.7 * Math.sin(tilt) - 0.02;
        B.box(extraMat(B, 'alu'), 0.04, top, 0.04, px, y + 0.06 + top / 2, pz + lz, 0, 0);
      }
    }
  }
  if (st.moss && iw > 1 && id > 1) {
    for (let i = 0; i < Math.round(iw * id * 0.08); i++) {
      B.add(extraMat(B, 'moss'), new THREE.IcosahedronGeometry(0.2 + B.rand() * 0.3, 0), new THREE.Matrix4().compose(new THREE.Vector3(cx + (B.rand() - 0.5) * (iw - 0.6), y + 0.06, cz + (B.rand() - 0.5) * (id - 0.6)), new THREE.Quaternion(), new THREE.Vector3(1, 0.2, 1)));
    }
  }
  if (parapet > 0) {
    const t = 0.22;
    B.box(mat, w, parapet, t, cx, y + parapet / 2, cz + d / 2 - t / 2);
    B.box(mat, w, parapet, t, cx, y + parapet / 2, cz - d / 2 + t / 2);
    B.box(mat, t, parapet, d, cx + w / 2 - t / 2, y + parapet / 2, cz);
    B.box(mat, t, parapet, d, cx - w / 2 + t / 2, y + parapet / 2, cz);
    B.box(cap, w + 0.08, 0.06, t + 0.08, cx, y + parapet + 0.03, cz + d / 2 - t / 2);
    B.box(cap, w + 0.08, 0.06, t + 0.08, cx, y + parapet + 0.03, cz - d / 2 + t / 2);
    B.box(cap, t + 0.08, 0.06, d, cx + w / 2 - t / 2, y + parapet + 0.03, cz);
    B.box(cap, t + 0.08, 0.06, d, cx - w / 2 + t / 2, y + parapet + 0.03, cz);
  }
}

/** Wall block with stone/concrete plinth. Centre (cx, cz), from y0 up h. */
export function block(B, w, h, d, { cx = 0, cz = 0, y0 = 0, mat = B.mats.wall, plinth = 0.45 } = {}) {
  const st = B.style;
  if (plinth > 0 && st.plinthH && y0 < 0.1) plinth = Math.max(plinth > 0.3 ? st.plinthH : plinth, 0.12);
  B.box(mat, w, h, d, cx, y0 + h / 2, cz);
  if (plinth > 0) B.box(B.mats.plinth, w + 0.08, plinth, d + 0.08, cx, y0 + plinth / 2, cz);
  if (mat !== B.mats.wall) return;
  // remember the four wall faces for trims that dress walls (half-timber, ivy, weeds, drifts)
  facades(B, w, d, (side, width) => B.faces.push({ matrix: B.frame.clone(), width, y0, y1: y0 + h, plinth }), { cx, cz });
  if (st.quoins) {
    // alternating long/short corner stones on all four corners
    const q = extraMat(B, 'quoin');
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      let k = 0;
      for (let yy = y0 + Math.max(plinth, 0.1) + 0.02; yy + 0.28 < y0 + h - 0.05; yy += 0.32, k++) {
        const long = k % 2 === 0;
        const a = long ? 0.55 : 0.32;
        const b = long ? 0.32 : 0.55;
        B.box(q, a, 0.28, 0.06, cx + sx * (w / 2 - a / 2 + 0.03), yy + 0.14, cz + sz * (d / 2 + 0.02), 0, 0.012);
        B.box(q, 0.06, 0.28, b, cx + sx * (w / 2 + 0.02), yy + 0.14, cz + sz * (d / 2 - b / 2 + 0.03), 0, 0.012);
      }
    }
  }
  if (st.cornerBoards) {
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const yy = y0 + plinth;
      const hh = h - plinth;
      B.box(B.mats.trim, 0.16, hh, 0.04, cx + sx * (w / 2 - 0.08 + 0.02), yy + hh / 2, cz + sz * (d / 2 + 0.02), 0, 0.01);
      B.box(B.mats.trim, 0.04, hh, 0.16, cx + sx * (w / 2 + 0.02), yy + hh / 2, cz + sz * (d / 2 - 0.08 + 0.02), 0, 0.01);
    }
  }
}

/** Register the four wall faces of a box built without block() (trims dress them). */
export function wallFaces(B, w, d, { cx = 0, cz = 0, y0 = 0, h, plinth = 0.45 } = {}) {
  facades(B, w, d, (side, width) => B.faces.push({ matrix: B.frame.clone(), width, y0, y1: y0 + h, plinth }), { cx, cz });
}

/** Run fn on each facade of a box: fn(side, width) with frame at the wall plane. */
export function facades(B, w, d, fn, { cx = 0, cz = 0, sides = ['front', 'back', 'left', 'right'] } = {}) {
  const F = {
    front: [cx, cz + d / 2, 0, w],
    back: [cx, cz - d / 2, Math.PI, w],
    right: [cx + w / 2, cz, Math.PI / 2, d],
    left: [cx - w / 2, cz, -Math.PI / 2, d],
  };
  for (const s of sides) {
    const [x, z, ry, width] = F[s];
    B.local(x, 0, z, ry, () => fn(s, width));
  }
}

/** Evenly spaced window x positions across a facade width. */
export function spread(width, count, margin = 1) {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const span = width - margin * 2;
  return Array.from({ length: count }, (_, i) => -span / 2 + (span * i) / (count - 1));
}

export function chimney(B, x, z, yBase, height, { mat } = {}) {
  if (B.style.pitch > 1) height += 1.4 * (B.style.pitch - 1) * 4;
  if (B.style.roofStyle === 'mansard') height += 0.6;
  const m = mat ?? surface('brick', '#9c4a36', { name: 'brick' });
  if (B.style.snow) B.box(extraMat(B, 'snow'), 0.84, 0.08, 0.84, x, yBase + height + 0.14, z, 0, 0.03);
  B.box(m, 0.7, height, 0.7, x, yBase + height / 2, z);
  B.box(B.mats.concrete, 0.82, 0.1, 0.82, x, yBase + height + 0.05, z);
  B.cyl(B.mats.dark, 0.1, 0.1, 0.3, x, yBase + height + 0.25, z, 10);
}

/** Porch along the front: deck, steps, posts, railings, shed roof. Frame: facade plane. */
export function porch(B, width, depth, { y = 0.5, height = 2.6, posts = 4, roof = true, railing = true, postMat = B.mats.trim, turned = false, x = 0 } = {}) {
  B.box(surface('plank', '#9a7b5c', { name: 'deck' }), width, 0.12, depth, x, y - 0.06, depth / 2);
  B.box(B.mats.plinth, width, y - 0.12, depth - 0.1, x, (y - 0.12) / 2, depth / 2 - 0.05);
  for (let s = 0; s < 3; s++) {
    const sh = y / 3;
    B.box(surface('plank', '#9a7b5c', { name: 'deck' }), 1.6, sh, 0.3 * (3 - s), x, sh * (s + 0.5), depth + 0.15 * (3 - s));
  }
  const px = spread(width, posts, 0.15);
  for (const p of px) {
    if (turned) {
      B.geo(postMat, new THREE.LatheGeometry([[0.09, 0], [0.09, 0.15], [0.06, 0.25], [0.07, height * 0.5], [0.05, height * 0.85], [0.08, height * 0.95], [0.08, height]].map(([r, h]) => new THREE.Vector2(r, h)), 12), x + p, y, depth - 0.15);
    } else {
      B.box(postMat, 0.16, height, 0.16, x + p, y + height / 2, depth - 0.15);
    }
  }
  B.box(postMat, width, 0.22, 0.2, x, y + height + 0.11, depth - 0.15);
  if (roof) B.slab(B.mats.roof, 0, y + height + 0.6, depth + 0.35, y + height + 0.15, width + 0.3, 0.12, x);
  if (railing) {
    const segs = [];
    for (let i = 0; i < px.length - 1; i++) {
      const a = px[i] + 0.08;
      const b = px[i + 1] - 0.08;
      if (Math.abs(((a + b) / 2) - 0) < 0.9 && i === Math.floor((px.length - 1) / 2)) continue; // opening at the steps
      segs.push([a, b]);
    }
    for (const [a, b] of segs) railingRun(B, a + x, b + x, depth - 0.15, y, postMat);
  }
}

/** Railing between x=a and x=b at depth z (facade frame). */
export function railingRun(B, a, b, z, y, mat, { height = 0.9, spacing = 0.12, glassPanel = false } = {}) {
  const len = b - a;
  B.box(mat, len, 0.06, 0.08, (a + b) / 2, y + height, z);
  if (glassPanel) {
    B.box(B.mats.glass, len, height - 0.1, 0.02, (a + b) / 2, y + height / 2, z);
    return;
  }
  B.box(mat, len, 0.05, 0.06, (a + b) / 2, y + 0.1, z);
  // balusters stand on the floor (y) and run up into the hand rail
  for (let x = a + spacing / 2; x < b; x += spacing) B.box(mat, 0.035, height - 0.02, 0.035, x, y + (height - 0.02) / 2, z);
}

export function acUnit(B, x, y, z, ry = 0) {
  B.local(x, y, z, ry, () => {
    B.box(B.mats.metal, 0.9, 0.7, 0.4, 0, 0.35, 0);
    B.add(B.mats.dark, new THREE.CircleGeometry(0.25, 20), new THREE.Matrix4().makeTranslation(0, 0.37, 0.201));
  });
}

/** Striped awning (shed form with scalloped valance). Frame: facade plane. */
export function awning(B, x, y, width, depth, color) {
  let mat;
  if (hasDOM) {
    const key = `awning:${color}`;
    if (!texCache.has(key)) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#f7f4ec' : `#${M.toColor(color).getHexString()}`;
        g.fillRect((i * 256) / 8, 0, 256 / 8, 256);
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      texCache.set(key, t);
    }
    mat = new THREE.MeshStandardMaterial({ name: 'awning', map: texCache.get(key), roughness: 0.9 });
    mat.userData.tile = TILE.awning;
  } else mat = new THREE.MeshStandardMaterial({ name: 'awning', color: M.toColor(color), roughness: 0.9 });
  B.slab(mat, 0, y, depth, y - depth * 0.55, width, 0.04, x);
  const val = 0.22;
  B.box(mat, width, val, 0.03, x, y - depth * 0.55 - val / 2, depth + 0.01);
  for (const s of [-1, 1]) B.prism(mat, [[0, y], [depth, y - depth * 0.55], [depth, y - depth * 0.55 - val], [0, y - val]], x + s * width / 2 - 0.015, x + s * width / 2 + 0.015);
}

/** Sign board with text (canvas in browser, plain board in Node). */
/** Studio emblem placed flush on the current facade plane (z = surface), facing +Z. */
let emblemCount = 0;
export function emblem(B, x, y, z, size) {
  const g = brandEmblem(size, { name: `emblem_${emblemCount++}` });
  // ring half-depth ≈ 0.162 × scale; its back is set 1.5 mm into the surface
  return B.attach(g, x, y, z + (size / 2 / 1.36) * 0.162 - 0.0015);
}

export function signBoard(B, x, y, z, w, h, text, { bg = '#1f2a33', fg = '#ffffff', emissive = 0.6, logo = true } = {}) {
  // the studio emblem is only mounted on dark sign boards (never on a white/light backing)
  const lum = (() => { const c = M.toColor(bg); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; })();
  logo = logo && w > h * 2.2 && lum < 0.35;
  let mat;
  if (hasDOM && text) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.max(64, Math.round((1024 * h) / w));
    const g = c.getContext('2d');
    g.fillStyle = bg;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = fg;
    g.font = `bold ${Math.round(c.height * 0.62)}px Georgia, serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, logo ? (c.width + c.height) / 2 : c.width / 2, c.height / 2 + 2, logo ? c.width - c.height * 1.3 : c.width * 0.95);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    mat = new THREE.MeshStandardMaterial({ name: 'sign', map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: emissive, roughness: 0.6 });
  } else {
    mat = new THREE.MeshStandardMaterial({ name: 'sign', color: bg, roughness: 0.6 });
  }
  B.box(B.mats.dark, w + 0.1, h + 0.1, 0.08, x, y, z);
  B.add(mat, new THREE.PlaneGeometry(w, h), new THREE.Matrix4().makeTranslation(x, y, z + 0.045));
  if (logo) emblem(B, x - w / 2 + h / 2, y, z + 0.046, h * 0.82);
}

export { hasDOM, roundedBox };

/* ------------------------------------------------------------------ */
/* Hip / mansard roofs and trim finishing                              */
/* ------------------------------------------------------------------ */

/** Solid frustum from an (ax × az) rectangle at y0 to a (bx × bz) rectangle at y1 (bx or bz may be 0 → ridge). */
export function frustum(ax, az, bx, bz, y0, y1) {
  const A = [[-ax / 2, y0, -az / 2], [ax / 2, y0, -az / 2], [ax / 2, y0, az / 2], [-ax / 2, y0, az / 2]];
  const T = [[-bx / 2, y1, -bz / 2], [bx / 2, y1, -bz / 2], [bx / 2, y1, bz / 2], [-bx / 2, y1, bz / 2]];
  const tris = [];
  const quad = (a, b, c, d) => tris.push([a, b, c], [a, c, d]);
  for (let i = 0; i < 4; i++) quad(A[i], A[(i + 1) % 4], T[(i + 1) % 4], T[i]);
  quad(A[3], A[2], A[1], A[0]);
  if (bx > 1e-3 && bz > 1e-3) quad(T[0], T[1], T[2], T[3]);
  const cy = (y0 + y1) / 2;
  const pos = [];
  const v = (p) => new THREE.Vector3(...p);
  for (const [a, b, c] of tris) {
    const pa = v(a);
    const pb = v(b);
    const pc = v(c);
    const n = pb.clone().sub(pa).cross(pc.clone().sub(pa));
    if (n.lengthSq() < 1e-10) continue;
    const cen = pa.clone().add(pb).add(pc).divideScalar(3);
    const out = n.dot(cen.sub(new THREE.Vector3(0, cy, 0))) >= 0;
    for (const p of out ? [pa, pb, pc] : [pa, pc, pb]) pos.push(p.x, p.y, p.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Hip roof (four slopes) or mansard (steep lower + low upper slope) over a w × d box at height y. */
export function hipRoof(B, w, d, y, { pitch = 0.6, overhang = 0.4, fascia = B.mats.trim, gutter = true, ridgeAlong = 'x', cx = 0, cz = 0, mansard = false } = {}) {
  const st = B.style;
  let top = y;
  // gable-end windows above the eaves have no wall to sit in any more
  B.local(cx, 0, cz, ridgeAlong === 'x' ? 0 : Math.PI / 2, () => {
    const fb = new THREE.Box3();
    for (const p of [[-w / 2 - overhang, -d / 2 - overhang], [w / 2 + overhang, d / 2 + overhang]]) fb.expandByPoint(new THREE.Vector3(p[0], y - 0.05, p[1]).applyMatrix4(B.frame));
    fb.min.y = y - 0.05;
    fb.max.y = y + 20;
    fb.expandByScalar(0.15);
    for (const win of B.windows ?? []) if (!win.removed && win.box.min.y >= y - 0.1 && fb.containsBox(win.box)) { B.removeParts(win.parts); win.removed = true; }
  });
  B.local(cx, 0, cz, ridgeAlong === 'x' ? 0 : Math.PI / 2, () => {
    const Lx = w + overhang * 2;
    const Ly = d + overhang * 2;
    const drop = overhang * pitch;
    const ye = y - drop;
    const roofParts = [];
    if (mansard) {
      const p1 = 2.6;
      const hm = 1.9;
      const i = (hm + drop) / p1;
      const ax = Lx - 2 * i;
      const az = Ly - 2 * i;
      roofParts.push(frustum(Lx, Ly, ax, az, ye, y + hm));
      const p2 = 0.32;
      const H2 = Math.min(ax, az) / 2 * p2;
      roofParts.push(frustum(ax, az, Math.max(ax - az, 0), Math.max(az - ax, 0), y + hm, y + hm + H2));
      top = y + hm + H2;
      // dormers on the steep front/back faces
      const n = Math.max(1, Math.floor((w - 1) / 2.6));
      for (const s of [-1, 1]) for (let k = 0; k < n; k++) {
        const x = (k - (n - 1) / 2) * 2.6;
        const zf = Ly / 2 - (0.75 + drop) / p1; // face position at the dormer sill height
        B.local(x, 0, s * zf, s > 0 ? 0 : Math.PI, () => {
          B.box(B.mats.wall, 1.1, 1.25, 0.9, 0, y + 0.75 + 0.62, -0.25);
          windowUnit(B, 0, y + 0.95, 0.65, 0.8, { style: 'double', sill: false });
          B.add(B.mats.roof, frustum(1.3, 1.1, 0, 1.1, 0, 0.45).rotateY(0), new THREE.Matrix4().makeTranslation(0, y + 2.0, -0.25));
          if (st.snow) B.add(extraMat(B, 'snow'), frustum(1.32, 1.12, 0, 1.12, 0, 0.47), new THREE.Matrix4().makeTranslation(0, y + 2.04, -0.25));
        });
      }
    } else {
      const H = (Math.min(Lx, Ly) / 2) * pitch;
      roofParts.push(frustum(Lx, Ly, Math.max(Lx - Ly, 0), Math.max(Ly - Lx, 0), ye, ye + H));
      top = ye + H;
    }
    for (const g of roofParts) {
      // hip roof surfaces: world-planar UVs come from the batcher (tile texture on the slopes)
      B.add(B.mats.roof, g);
      if (st.snow) B.add(extraMat(B, 'snow'), g.clone().scale(1.008, 1, 1.008), new THREE.Matrix4().makeTranslation(0, 0.08, 0));
    }
    // fascia band + gutters on all four eaves
    for (const s of [-1, 1]) {
      B.box(fascia, Lx, 0.2, 0.05, 0, ye - 0.05, s * (Ly / 2 + 0.01), 0, 0.01);
      B.box(fascia, 0.05, 0.2, Ly, s * (Lx / 2 + 0.01), ye - 0.05, 0, 0, 0.01);
      if (gutter) {
        B.add(B.mats.metal, new THREE.CylinderGeometry(0.06, 0.06, Lx, 10), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, ye - 0.1, s * (Ly / 2 + 0.07)));
        for (const e of [-1, 1]) B.cyl(B.mats.metal, 0.04, 0.04, ye - 0.1, e * (w / 2 - 0.1), (ye - 0.1) / 2, s * (d / 2 + 0.07), 8);
      }
    }
  });
  return top;
}

/** Wall-dressing trims, run once before batches are merged (needs all openings known). */
export function styleFinish(B) {
  const st = B.style;
  const R = B.rand;
  const place = (face, mat, geo, x, y, z, rz = 0, test = true) => {
    const m = face.matrix.clone().multiply(new THREE.Matrix4().makeRotationZ(rz).setPosition(x, y, z));
    if (test) {
      geo.computeBoundingBox();
      const box = geo.boundingBox.clone().applyMatrix4(m);
      if (B.blocked(box, 0.03)) return false;
    }
    B.add(mat, geo, m);
    return true;
  };
  if (st.tudor) {
    const mat = extraMat(B, 'beam');
    for (const f of B.faces) {
      const lines = [f.y0 + Math.max(f.plinth, 0.2)];
      for (let yy = lines[0] + 2.8; yy < f.y1 - 0.6; yy += 2.8) lines.push(yy);
      lines.push(f.y1 - 0.12);
      const W = f.width;
      for (const yy of lines) {
        // horizontal rails, split around openings in 0.4 m pieces
        for (let x = -W / 2 + 0.2; x < W / 2 - 0.2; x += 0.4) place(f, mat, new THREE.BoxGeometry(0.42, 0.16, 0.05), x, yy, 0.025);
      }
      for (let k = 0; k < lines.length - 1; k++) {
        const ya = lines[k] + 0.08;
        const yb = lines[k + 1] - 0.08;
        const hh = yb - ya;
        if (hh < 0.5) continue;
        const n = Math.max(2, Math.round(W / 1.1));
        for (let i = 0; i <= n; i++) {
          const x = -W / 2 + 0.12 + (i * (W - 0.24)) / n;
          place(f, mat, new THREE.BoxGeometry(0.16, hh, 0.05), x, ya + hh / 2, 0.026);
        }
        // diagonal braces in the end bays
        const bay = (W - 0.24) / n;
        for (const s of [-1, 1]) {
          const len = Math.hypot(bay, hh);
          place(f, mat, new THREE.BoxGeometry(0.14, len, 0.05), s * (W / 2 - 0.12 - bay / 2), ya + hh / 2, 0.027, s * Math.atan2(bay, hh));
        }
      }
    }
  }
  if (st.ivy) {
    const mat = extraMat(B, 'ivy');
    for (const f of B.faces) {
      if (f.y0 > 0.5) continue;
      const vines = Math.max(1, Math.round(f.width / 4));
      for (let v = 0; v < vines; v++) {
        let x = (R() - 0.5) * (f.width - 1);
        const top = f.y0 + (f.y1 - f.y0) * (0.45 + R() * 0.5);
        for (let yy = f.y0 + 0.2; yy < top; yy += 0.22) {
          x += (R() - 0.5) * 0.3;
          x = Math.max(-f.width / 2 + 0.3, Math.min(f.width / 2 - 0.3, x));
          const spread = 0.35 + (1 - (yy - f.y0) / (top - f.y0)) * 0.5;
          for (let c = 0; c < 3; c++) {
            const g = new THREE.IcosahedronGeometry(0.16 + R() * 0.14, 0).scale(1, 1, 0.45);
            place(f, mat, g, x + (R() - 0.5) * spread * 2, yy + (R() - 0.5) * 0.2, 0.06);
          }
        }
      }
    }
  }
  if (st.overgrown) {
    const mat = extraMat(B, 'weeds');
    for (const f of B.faces) {
      if (f.y0 > 0.5) continue;
      for (let x = -f.width / 2 + 0.3; x < f.width / 2 - 0.3; x += 0.5 + R() * 0.9) {
        if (R() < 0.35) continue;
        const r = 0.25 + R() * 0.35;
        place(f, mat, new THREE.IcosahedronGeometry(r, 1).scale(1.2, 0.8, 0.9), x, r * 0.62, 0.3 + R() * 0.3, 0, false);
        for (let k = 0; k < 3; k++) {
          const hh = 0.5 + R() * 0.5;
          place(f, mat, new THREE.ConeGeometry(0.05, hh, 4), x + (R() - 0.5) * 0.6, hh / 2, 0.45 + R() * 0.3, (R() - 0.5) * 0.3, false);
        }
      }
    }
  }
  // footprint (world) of everything built so far
  if (st.fence || st.snow) {
    const bb = new THREE.Box3();
    for (const list of B.batches.values()) for (const g of list) {
      g.computeBoundingBox();
      bb.union(g.boundingBox);
    }
    for (const o of B.root.children) bb.expandByObject(o);
    if (bb.isEmpty()) return;
    if (st.snow) {
      // snow cover on the ground around the building + drifts against the walls
      const sx = bb.max.x - bb.min.x + 2.4;
      const sz = bb.max.z - bb.min.z + 2.4;
      B.add(extraMat(B, 'snow'), roundedBox(sx, 0.05, sz, 0.02, 1), new THREE.Matrix4().makeTranslation((bb.min.x + bb.max.x) / 2, 0.025, (bb.min.z + bb.max.z) / 2));
      for (const f of B.faces) {
        if (f.y0 > 0.5) continue;
        for (let x = -f.width / 2 + 0.6; x < f.width / 2 - 0.4; x += 1.1) {
          const g = new THREE.SphereGeometry(0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.3, 0.45, 0.8);
          place(f, extraMat(B, 'snow'), g, x + (R() - 0.5) * 0.3, 0.04, 0.15, 0, false);
        }
      }
    }
    if (st.fence) {
      const m = 2.2;
      const x0 = bb.min.x - m;
      const x1 = bb.max.x + m;
      const z0 = bb.min.z - m;
      const z1 = bb.max.z + m;
      const mat = extraMat(B, 'picket');
      const run = (ax, az, bx, bz, gap) => {
        const len = Math.hypot(bx - ax, bz - az);
        const ang = Math.atan2(bz - az, bx - ax);
        const at = (t, y) => new THREE.Matrix4().makeRotationY(-ang).setPosition(ax + (bx - ax) * t, y, az + (bz - az) * t);
        const inGap = (t) => gap && Math.abs(t * len - len / 2) < 0.8;
        for (let d = 0; d <= len + 1e-3; d += 2) {
          const t = d / len;
          if (inGap(t) && Math.abs(t * len - len / 2) < 0.75) continue;
          B.add(mat, new THREE.BoxGeometry(0.1, 1.15, 0.1), at(t, 0.575));
          B.add(mat, new THREE.ConeGeometry(0.075, 0.12, 4).rotateY(Math.PI / 4), at(t, 1.21));
        }
        for (let d = 0.12; d < len - 0.05; d += 0.15) {
          const t = d / len;
          if (inGap(t)) continue;
          B.add(mat, new THREE.BoxGeometry(0.075, 0.9, 0.022), at(t, 0.5).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.065)));
          B.add(mat, new THREE.ConeGeometry(0.053, 0.09, 4).rotateY(Math.PI / 4).scale(1, 1, 0.3), at(t, 0.995).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.065)));
        }
        // rails (split at the gate)
        const segs = gap ? [[0, len / 2 - 0.8], [len / 2 + 0.8, len]] : [[0, len]];
        for (const [a, b] of segs) for (const y of [0.3, 0.8]) {
          const L = b - a;
          B.add(mat, new THREE.BoxGeometry(L, 0.08, 0.04), at((a + b) / 2 / len, y).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.03)));
        }
      };
      run(x0, z1, x1, z1, true);
      run(x1, z1, x1, z0, false);
      run(x1, z0, x0, z0, false);
      run(x0, z0, x0, z1, false);
      // stepping-stone path from the gate to the house
      const cxm = (x0 + x1) / 2;
      for (let z = z1 - 0.4; z > bb.max.z - 0.2 - 0.0 && z > z1 - m - 0.2; z -= 0.6) {
        B.add(extraMat(B, 'path'), new THREE.CylinderGeometry(0.28, 0.3, 0.05, 10).scale(1.3, 1, 1), new THREE.Matrix4().makeTranslation(cxm + (R() - 0.5) * 0.15, 0.025, z));
      }
    }
  }
}
