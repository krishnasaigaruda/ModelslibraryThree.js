import * as THREE from 'three';

/*
 * Canvas text never overflows: labels, signs and screens across the library draw text with
 * fillText; when a string is wider than the space it has, squeeze it to fit (fillText's
 * maxWidth) instead of running off the edge or over the next word.
 */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.__premadeFit) {
  const fill = CanvasRenderingContext2D.prototype.fillText;
  const stroke = CanvasRenderingContext2D.prototype.strokeText;
  const room = (ctx, x) => {
    const W = ctx.canvas.width / (ctx.getTransform?.().a || 1);
    const pad = W * 0.04;
    const a = ctx.textAlign;
    if (a === 'center') return Math.max(1, 2 * Math.min(x, W - x) - pad);
    if (a === 'right' || a === 'end') return Math.max(1, x - pad);
    return Math.max(1, W - x - pad);
  };
  CanvasRenderingContext2D.prototype.fillText = function (t, x, y, max) {
    return fill.call(this, t, x, y, max ?? room(this, x));
  };
  CanvasRenderingContext2D.prototype.strokeText = function (t, x, y, max) {
    return stroke.call(this, t, x, y, max ?? room(this, x));
  };
  CanvasRenderingContext2D.prototype.__premadeFit = true;
}

/** Deterministic PRNG (mulberry32). Same seed → same model. */
export function rng(seed = 1) {
  let s = typeof seed === 'string' ? hashString(seed) : seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (a, b) => a + next() * (b - a);
  next.int = (a, b) => Math.floor(next.range(a, b + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Create a mesh and place it. `at` = [x,y,z], `rot` = [x,y,z] radians. */
export function mesh(geometry, material, { at, rot, scale, name, parent } = {}) {
  const m = new THREE.Mesh(geometry, material);
  if (at) m.position.set(...at);
  if (rot) m.rotation.set(...rot);
  if (scale) typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(...scale);
  if (name) m.name = name;
  if (parent) parent.add(m);
  return m;
}

export function group(name, { at, rot, parent } = {}) {
  const g = new THREE.Group();
  if (name) g.name = name;
  if (at) g.position.set(...at);
  if (rot) g.rotation.set(...rot);
  if (parent) parent.add(g);
  return g;
}

/** Rounded box (beveled extrusion), centred on origin. */
export function roundedBox(w, h, d, r = 0.05, segments = 3) {
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const shape = new THREE.Shape();
  const x = -w / 2 + r;
  const y = -h / 2 + r;
  const iw = w - 2 * r;
  const ih = h - 2 * r;
  shape.moveTo(x, y - r);
  shape.lineTo(x + iw, y - r);
  shape.quadraticCurveTo(x + iw + r, y - r, x + iw + r, y);
  shape.lineTo(x + iw + r, y + ih);
  shape.quadraticCurveTo(x + iw + r, y + ih + r, x + iw, y + ih + r);
  shape.lineTo(x, y + ih + r);
  shape.quadraticCurveTo(x - r, y + ih + r, x - r, y + ih);
  shape.lineTo(x - r, y);
  shape.quadraticCurveTo(x - r, y - r, x, y - r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(d - 2 * r, 1e-4),
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r * 0.999,
    bevelSegments: segments,
    curveSegments: segments,
  });
  geo.translate(0, 0, -(d - 2 * r) / 2);
  // The bevel grows the outline outward by r; scale back so the box is exactly w × h × d.
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.scale(w / (bb.max.x - bb.min.x), h / (bb.max.y - bb.min.y), 1);
  geo.computeVertexNormals();
  return geo;
}

/** Extrude a 2D outline (x,y points) along Z, centred on Z. */
export function extrudeOutline(points, depth, { bevel = 0.03, segments = 3 } = {}) {
  const shape = points instanceof THREE.Shape ? points : new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - 2 * bevel, 1e-4),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segments,
    curveSegments: 16,
  });
  geo.translate(0, 0, -(depth - 2 * bevel) / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Displace a geometry's vertices with seeded noise (used for rocks, foliage). */
export function jitter(geometry, rand, amount = 0.15) {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const cache = new Map();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    let k = cache.get(key);
    if (k === undefined) {
      k = 1 + (rand() - 0.5) * 2 * amount;
      cache.set(key, k);
    }
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Normalize option keys: accepts `Color`, `color`, `TYPE`, etc. */
export function normalizeOptions(options = {}) {
  const out = {};
  for (const [k, v] of Object.entries(options)) out[k.charAt(0).toLowerCase() + k.slice(1)] = v;
  if (typeof out.variant === 'string') out.variant = out.variant.toLowerCase().replace(/[\s_]+/g, '-');
  return out;
}

export function pickVariant(variants, requested, type) {
  const names = Object.keys(variants);
  if (requested == null) return names[0];
  if (!variants[requested]) {
    throw new Error(`[three-premade] Unknown ${type} variant "${requested}". Available: ${names.join(', ')}`);
  }
  return requested;
}

/**
 * Final touches every model gets: shadows, metadata, origin at ground centre,
 * optional uniform scale, and the list of animation names.
 */
const _tmpV = new THREE.Vector3();
export function finalize(root, { type, variant, options = {}, animations = [] }) {
  root.name = root.name || `${type}${variant ? `-${variant}` : ''}`;
  root.traverse((o) => {
    if (o.isMesh) {
      // glow cards / decals (core/lamps.js) never cast or receive shadows
      const fx = o.userData.noShadow || o.material?.blending === THREE.AdditiveBlending;
      // Anti-flicker: flat decals / screens / labels drawn just over a surface get a polygon
      // offset so they never z-fight (shimmer) with the surface behind them at any distance.
      const g = o.geometry;
      if (g && !o.isInstancedMesh) {
        if (!g.boundingBox) g.computeBoundingBox();
        const sz = g.boundingBox.getSize(_tmpV);
        const flat = Math.min(sz.x, sz.y, sz.z) < 1e-4 * Math.max(sz.x, sz.y, sz.z, 1e-6) + 1e-5;
        if (flat || g.type === 'PlaneGeometry' || g.type === 'CircleGeometry') {
          for (const m of [o.material].flat()) {
            if (!m || m.polygonOffset) continue;
            m.polygonOffset = true;
            m.polygonOffsetFactor = -1;
            m.polygonOffsetUnits = -4;
          }
        }
      }
      o.castShadow = fx ? false : options.castShadow ?? true;
      o.receiveShadow = fx ? false : options.receiveShadow ?? true;
    }
  });
  root.animations = animations;
  root.userData.premade = {
    type,
    variant,
    options: { ...options },
    animations: animations.map((a) => a.name),
  };
  if (options.scale) root.scale.multiplyScalar(options.scale);
  if (options.position) root.position.set(...options.position);
  if (options.rotation != null) {
    typeof options.rotation === 'number' ? (root.rotation.y = options.rotation) : root.rotation.set(...options.rotation);
  }
  return root;
}

const _up = new THREE.Vector3(0, 1, 0);
/** Cylinder between two points (frames, poles, tubes). */
export function tube(a, b, radius, material, { radialSegments = 12, parent, name } = {}) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, radialSegments), material);
  m.position.copy(va).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  if (name) m.name = name;
  if (parent) parent.add(m);
  return m;
}

/** Closes both ends of an open TubeGeometry with flat discs (open ends showed the inside of the tube as torn,
 *  jagged edges, e.g. on plier grips). Ring k of the tube is vertices k*(radial+1) … k*(radial+1)+radial. */
export function capTube(geo, segments, radial) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  const P = [...pos.array], N = [...nor.array], U = [...uv.array], I = [...geo.index.array];
  const v = (i) => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
  for (const [ring, sign] of [[0, -1], [segments, 1]]) {
    const base = ring * (radial + 1);
    const center = new THREE.Vector3();
    for (let j = 0; j < radial; j++) center.add(v(base + j));
    center.divideScalar(radial);
    const other = new THREE.Vector3();
    const ob = (ring === 0 ? 1 : segments - 1) * (radial + 1);
    for (let j = 0; j < radial; j++) other.add(v(ob + j));
    other.divideScalar(radial);
    const out = center.clone().sub(other).normalize(); // points away from the tube body
    const c0 = P.length / 3;
    P.push(center.x, center.y, center.z); N.push(out.x, out.y, out.z); U.push(0.5, 0.5);
    for (let j = 0; j <= radial; j++) {
      const p = v(base + j);
      P.push(p.x, p.y, p.z); N.push(out.x, out.y, out.z);
      U.push(0.5 + 0.5 * Math.cos((j / radial) * Math.PI * 2), 0.5 + 0.5 * Math.sin((j / radial) * Math.PI * 2));
    }
    // pick the winding whose face normal points outward
    const a = v(base), b2 = v(base + 1);
    const flip = b2.clone().sub(center).cross(a.clone().sub(center)).dot(out) < 0;
    for (let j = 0; j < radial; j++) {
      const i0 = c0 + 1 + j, i1 = c0 + 2 + j;
      if (flip) I.push(c0, i0, i1); else I.push(c0, i1, i0);
    }
    void sign;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I);
  g.addGroup(0, I.length, 0);
  geo.dispose();
  return g;
}

/** Smooth bent tube through points (chair frames, handles, railings). Open ends are capped. */
export function curveTube(points, radius, material, { segments = 48, radialSegments = 12, closed = false, parent, name } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, segments, radius, radialSegments, closed);
  const m = new THREE.Mesh(closed ? geo : capTube(geo, segments, radialSegments), material);
  if (name) m.name = name;
  if (parent) parent.add(m);
  return m;
}

/** Puffy upholstered cushion: rounded box with a softly domed top/bottom and slightly bulging sides. */
export function cushion(w, h, d, { radius, bulge = 0.25 } = {}) {
  const r = radius ?? Math.min(w, h, d) * 0.35;
  const geo = roundedBox(w, h, d, r, 5);
  const pos = geo.attributes.position;
  const hw = w / 2;
  const hd = d / 2;
  const hh = h / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = Math.max(0, (1 - (x / hw) ** 2) * (1 - (z / hd) ** 2));
    const fy = Math.max(0, 1 - (y / hh) ** 2);
    pos.setXYZ(i, x * (1 + fy * 0.03), y + Math.sign(y) * k * h * bulge * 0.5, z * (1 + fy * 0.03));
  }
  geo.computeVertexNormals();
  return geo;
}

/** Lathe a profile ([radius, y] pairs) around Y — vases, lamp bases, bottles, wheels. */
export function lathe(profile, segments = 48) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}
