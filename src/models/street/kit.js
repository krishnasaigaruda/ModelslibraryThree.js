import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { rng, finalize } from '../../core/utils.js';
import { hasDOM } from './common.js';

/*
 * Street kit: shared "condition" trims every street prop can use, plus finish()
 * which applies the requested condition and finalizes the object.
 *
 * Conditions change the actual model, not just its colour:
 *   rusty     rust-mapped metal (blotches + streaks), flaking, roughened finish
 *   damaged   leaning / knocked over a few degrees, dents, cracked or missing glass
 *   graffiti  spray-paint tags projected onto the surfaces (decals that wrap round)
 *   posters   flyers, stickers and tape projected onto poles / panels
 *   snowy     snow lying on every upward surface (and a drift at the base)
 */
export const CONDITIONS = ['rusty', 'damaged', 'graffiti', 'posters', 'snowy'];

const isGlow = (o) => o.userData.noShadow || o.material?.blending === THREE.AdditiveBlending;
const isGlass = (m) => m && m.transparent && m.opacity < 0.95;
const isEmissive = (m) => m && m.emissive && m.emissiveIntensity > 0.3 && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.3;
function solidMeshes(root) {
  const out = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || isGlow(o) || !o.visible) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (isGlass(m) || m.map?.isCanvasTexture) return;
    out.push(o);
  });
  return out;
}

/* ------------------------------ canvas textures ----------------------------- */

const texCache = new Map();
function canvas(w, h, draw, key) {
  if (!hasDOM) return null;
  if (key && texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (key) texCache.set(key, t);
  return t;
}

function rustTexture(base, seed) {
  return canvas(256, 256, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = `#${base.getHexString()}`;
    g.fillRect(0, 0, w, h);
    // rust blotches
    for (let i = 0; i < 70; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 4 + r() ** 2 * 38;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      const c = r.pick(['139,69,19', '160,82,45', '115,52,20', '178,96,40', '90,45,18']);
      grad.addColorStop(0, `rgba(${c},${0.65 + r() * 0.3})`);
      grad.addColorStop(0.6, `rgba(${c},${0.3 * r()})`);
      grad.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grad;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // run-off streaks
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h * 0.6;
      g.strokeStyle = `rgba(120,58,20,${0.15 + r() * 0.3})`;
      g.lineWidth = 1 + r() * 3;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 6, y + 30 + r() * 120);
      g.stroke();
    }
    // flaked paint specks
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? '60,30,12' : '200,120,60'},${r() * 0.5})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  }, `rust-${base.getHexString()}-${seed}`);
}

function crackedTexture() {
  return canvas(256, 256, (g, w, h) => {
    const r = rng(77);
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(220,235,240,0.25)';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    const cx = w * 0.4;
    const cy = h * 0.45;
    for (let i = 0; i < 18; i++) {
      let x = cx;
      let y = cy;
      const a = (i / 18) * Math.PI * 2 + r() * 0.3;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += Math.cos(a + (r() - 0.5) * 0.6) * (15 + r() * 25);
        y += Math.sin(a + (r() - 0.5) * 0.6) * (15 + r() * 25);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let ring = 1; ring < 4; ring++) {
      g.beginPath();
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const rr = ring * 22 + r() * 8;
        i ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.stroke();
    }
  }, 'cracked');
}

const TAGS = ['NOVA', 'KAOS', 'ZEKE', 'RIOT', 'LUMO', 'VEX', 'SKYE', 'DUSK', 'ORBX', 'JUNO', 'FLUX', 'MIRO'];
const SPRAY = [['#ff3fa4', '#2b1060'], ['#3fd0ff', '#0b2a55'], ['#ffd23f', '#5a1e00'], ['#7be36b', '#0c3b16'], ['#ff6a2b', '#1a1a1a'], ['#c86bff', '#ffffff'], ['#ffffff', '#d4145a']];
function graffitiTexture(seed) {
  return canvas(512, 256, (g, w, h) => {
    const r = rng(seed);
    const word = r.pick(TAGS);
    const [fill, outline] = r.pick(SPRAY);
    g.clearRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    g.rotate((r() - 0.5) * 0.25);
    g.font = `italic 900 ${150 - word.length * 8}px "Arial Black", Impact, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    // soft overspray
    g.shadowColor = fill;
    g.shadowBlur = 18;
    g.lineWidth = 26;
    g.strokeStyle = outline;
    g.strokeText(word, 0, 0);
    g.shadowBlur = 0;
    const grad = g.createLinearGradient(0, -60, 0, 60);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, fill);
    grad.addColorStop(1, fill);
    g.fillStyle = grad;
    g.fillText(word, 0, 0);
    // drips
    g.fillStyle = fill;
    for (let i = 0; i < 7; i++) {
      const x = (r() - 0.5) * w * 0.7;
      g.fillRect(x, 30, 4, 20 + r() * 50);
      g.beginPath();
      g.arc(x + 2, 52 + r() * 40, 3.5, 0, Math.PI * 2);
      g.fill();
    }
    // a star / crown accent
    g.strokeStyle = '#ffffff';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(w * 0.3, -h * 0.35);
    g.lineTo(w * 0.33, -h * 0.25);
    g.lineTo(w * 0.36, -h * 0.35);
    g.stroke();
  }, `graffiti-${seed}`);
}

const POSTERS = [
  ['LOST CAT', 'Grey tabby · answers to Miso', '#f6f1e3', '#c0392b'],
  ['LIVE MUSIC', 'Fri 9pm · The Corner Bar', '#1d1d1f', '#ffd23f'],
  ['FOR RENT', '2 bed flat · call 555-0142', '#ffffff', '#1565c0'],
  ['YARD SALE', 'Sat 8am–2pm · 14 Elm St', '#fff6c2', '#2e7d32'],
  ['GUITAR LESSONS', 'All ages · first lesson free', '#e8f4ff', '#6a1b9a'],
  ['CITY 10K RUN', 'Sunday · register online', '#ff6a2b', '#ffffff'],
];
function posterTexture(seed) {
  return canvas(256, 360, (g, w, h) => {
    const r = rng(seed);
    const [title, sub, bg, ink] = POSTERS[Math.floor(r() * POSTERS.length)];
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = ink;
    g.fillRect(0, 0, w, 70);
    g.fillStyle = bg;
    g.font = 'bold 34px Helvetica, Arial';
    g.textAlign = 'center';
    g.fillText(title, w / 2, 48, w - 20);
    g.fillStyle = ink;
    g.font = '20px Helvetica, Arial';
    g.fillText(sub, w / 2, 110, w - 24);
    // picture block
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(30, 130, w - 60, 120);
    g.strokeStyle = ink;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(w / 2, 190, 36, 0, Math.PI * 2);
    g.stroke();
    // tear-off tabs
    for (let i = 0; i < 8; i++) {
      const x = 8 + i * ((w - 16) / 8);
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.lineWidth = 1;
      g.strokeRect(x, h - 80, (w - 16) / 8, 78);
      if (r() < 0.3) {
        g.fillStyle = 'rgba(0,0,0,0)';
        g.clearRect(x + 1, h - 79, (w - 16) / 8 - 2, 78);
      }
    }
    // tape
    g.fillStyle = 'rgba(240,240,220,0.75)';
    g.fillRect(w / 2 - 30, 0, 60, 16);
  }, `poster-${seed}`);
}
function stickerTexture(seed) {
  return canvas(128, 128, (g, w) => {
    const r = rng(seed);
    const c = r.pick(['#ff3fa4', '#3fc3ff', '#ffd23f', '#7be36b', '#ffffff', '#ff6a2b']);
    g.clearRect(0, 0, w, w);
    g.fillStyle = c;
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111';
    g.font = 'bold 30px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(r.pick(['★', 'NO!', 'ZINE', '♥', 'SKATE', '☮']), 64, 66);
  }, `sticker-${seed}`);
}

/* ------------------------------ decal placement ----------------------------- */

const _ray = new THREE.Raycaster();
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();

/** Cast from outside toward the vertical axis at height y and heading a; returns first solid hit. */
function sideHit(targets, box, y, a) {
  const c = box.getCenter(new THREE.Vector3());
  const R = box.getSize(new THREE.Vector3()).length() + 1;
  _o.set(c.x + Math.cos(a) * R, y, c.z + Math.sin(a) * R);
  _d.set(-Math.cos(a), 0, -Math.sin(a));
  _ray.set(_o, _d);
  _ray.far = R * 2;
  const hit = _ray.intersectObjects(targets, false)[0];
  if (!hit || !hit.face) return null;
  const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  if (Math.abs(n.y) > 0.5) return null;
  return { point: hit.point, normal: n, object: hit.object };
}

function addDecal(root, hit, size, material, spin = 0) {
  const orient = new THREE.Euler();
  const m = new THREE.Matrix4().lookAt(hit.point.clone().add(hit.normal), hit.point, new THREE.Vector3(0, 1, 0));
  orient.setFromRotationMatrix(m);
  orient.z += spin;
  let geo;
  try {
    geo = new DecalGeometry(hit.object, hit.point, orient, size);
  } catch {
    return null;
  }
  if (!geo.attributes.position || geo.attributes.position.count < 3) return null;
  const d = new THREE.Mesh(geo, material);
  d.name = 'decal';
  d.renderOrder = 2;
  // a projected skin on the surface it was cast onto (not a separate part)
  d.userData.detached = true;
  root.add(d);
  return d;
}

function decalMaterial(map, fallback) {
  return new THREE.MeshStandardMaterial({
    map: map ?? null,
    color: map ? '#ffffff' : fallback,
    transparent: true,
    roughness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    depthWrite: false,
    name: 'decal',
  });
}

/* --------------------------------- conditions -------------------------------- */

function rusty(root, r) {
  const done = new Map();
  for (const o of solidMeshes(root)) {
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map((m) => {
      if (!m.isMeshStandardMaterial || isEmissive(m)) return m;
      const metal = m.metalness > 0.2 || /powder|iron|metal|paint|steel|galv/i.test(m.name);
      if (!metal) return m;
      if (done.has(m)) return done.get(m);
      const n = m.clone();
      const base = m.color.clone().lerp(new THREE.Color('#6b4a33'), 0.25);
      n.map = rustTexture(base, Math.floor(r() * 4));
      n.color.set(n.map ? '#ffffff' : '#8a5a3a');
      n.roughness = 0.85;
      n.metalness = Math.min(m.metalness, 0.35);
      if (n.clearcoat !== undefined) n.clearcoat = 0;
      n.name = `${m.name || 'metal'}-rusty`;
      done.set(m, n);
      return n;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
  }
  // flaked paint: a few rough rust scabs projected onto large metal surfaces
  const box = new THREE.Box3().setFromObject(root);
  const targets = solidMeshes(root);
  const scab = decalMaterial(rustTexture(new THREE.Color('#7a3c16'), 9), '#7a3c16');
  for (let i = 0; i < 6; i++) {
    const hit = sideHit(targets, box, box.min.y + (0.15 + r() * 0.7) * (box.max.y - box.min.y), r() * Math.PI * 2);
    if (hit) addDecal(root, hit, new THREE.Vector3(0.12 + r() * 0.2, 0.1 + r() * 0.25, 0.3), scab, r() * 6);
  }
}

function dent(o, r, depth) {
  const g = o.geometry.clone();
  o.geometry = g;
  const p = g.attributes.position;
  const nrm = g.attributes.normal;
  if (!nrm) return;
  g.computeBoundingBox();
  const size = g.boundingBox.getSize(new THREE.Vector3());
  const i0 = Math.floor(r() * p.count);
  const c = new THREE.Vector3().fromBufferAttribute(p, i0);
  const rad = Math.max(size.x, size.y, size.z) * (0.18 + r() * 0.15);
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = v.distanceTo(c);
    if (d > rad) continue;
    n.fromBufferAttribute(nrm, i);
    const k = (1 - d / rad) ** 2 * depth * Math.min(1, rad * 4);
    p.setXYZ(i, v.x - n.x * k, v.y - n.y * k, v.z - n.z * k);
  }
  g.computeVertexNormals();
}

function damaged(root, r, { lean = true } = {}) {
  // dents in the biggest solid parts
  const parts = solidMeshes(root)
    .map((o) => ({ o, s: new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).length() }))
    .sort((a, b) => b.s - a.s);
  void parts; // (dents removed: they open gaps at joints)
  // cracked / smashed glass
  const crack = crackedTexture();
  let k = 0;
  root.traverse((o) => {
    if (!o.isMesh || isGlow(o) || !isGlass(o.material)) return;
    if (k++ % 3 === 2 && o.parent !== root) o.visible = false; // missing pane
    else {
      o.material = o.material.clone();
      o.material.map = crack;
      o.material.opacity = 0.55;
      o.material.color.set('#ffffff');
    }
  });
  // scuffs & scrapes
  const box = new THREE.Box3().setFromObject(root);
  const targets = solidMeshes(root);
  const scuff = decalMaterial(canvas(128, 64, (g) => {
    const rr = rng(4);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(${rr() < 0.5 ? '40,40,40' : '200,200,200'},${0.3 + rr() * 0.5})`;
      g.lineWidth = 1 + rr() * 2;
      g.beginPath();
      const y = 10 + rr() * 44;
      g.moveTo(rr() * 30, y);
      g.lineTo(60 + rr() * 68, y + (rr() - 0.5) * 10);
      g.stroke();
    }
  }, 'scuff'), '#555');
  for (let i = 0; i < 9; i++) {
    const hit = sideHit(targets, box, box.min.y + (0.1 + r() * 0.7) * (box.max.y - box.min.y), r() * Math.PI * 2);
    if (hit) addDecal(root, hit, new THREE.Vector3(0.35 + r() * 0.25, 0.14 + r() * 0.1, 0.3), scuff, (r() - 0.5) * 0.6);
  }
  // knocked: lean the whole thing a few degrees about its base, then re-seat on the ground
  if (lean) {
    const tilt = new THREE.Group();
    tilt.name = 'damage_tilt';
    const kids = [...root.children];
    for (const c of kids) tilt.add(c);
    root.add(tilt);
    const a = r() * Math.PI * 2;
    const ang = THREE.MathUtils.degToRad(9 + r() * 6);
    tilt.rotation.set(Math.cos(a) * ang, 0, Math.sin(a) * ang);
    tilt.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(tilt);
    tilt.position.y -= b.min.y;
  }
}

function graffiti(root, r) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const targets = solidMeshes(root);
  const n = size.y > 2.5 || size.x > 2 || size.z > 2 ? 4 : 2;
  let placed = 0;
  for (let tries = 0; tries < 30 && placed < n; tries++) {
    const y = box.min.y + Math.min(size.y * (0.2 + r() * 0.55), 2.2);
    const hit = sideHit(targets, box, y, r() * Math.PI * 2);
    if (!hit) continue;
    const w = THREE.MathUtils.clamp(Math.max(size.x, size.z) * 0.75, 0.55, 1.6);
    const mat = decalMaterial(graffitiTexture(Math.floor(r() * 1000)), r.pick(SPRAY)[0]);
    if (addDecal(root, hit, new THREE.Vector3(w, w * 0.5, Math.max(0.4, w)), mat, (r() - 0.5) * 0.3)) placed++;
  }
}

function posters(root, r) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const targets = solidMeshes(root);
  let placed = 0;
  for (let tries = 0; tries < 40 && placed < 7; tries++) {
    const y = box.min.y + Math.min(size.y * (0.25 + r() * 0.5), 1.9);
    const hit = sideHit(targets, box, y, r() * Math.PI * 2);
    if (!hit) continue;
    const sticker = placed % 3 === 2;
    const mat = decalMaterial(sticker ? stickerTexture(Math.floor(r() * 100)) : posterTexture(Math.floor(r() * 1000)), '#f2efe6');
    const s = sticker ? new THREE.Vector3(0.09, 0.09, 0.2) : new THREE.Vector3(0.21, 0.297, 0.25);
    if (addDecal(root, hit, s, mat, (r() - 0.5) * 0.15)) placed++;
  }
}

const snowMat = () => new THREE.MeshStandardMaterial({ color: '#f7fbff', roughness: 0.9, metalness: 0, name: 'snow' });
function snowy(root, r) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const targets = [];
  root.traverse((o) => {
    if (o.isMesh && !isGlow(o) && o.visible) targets.push(o);
  });
  // ~2500 rays at most so big props stay fast
  const cell = Math.max(0.025, Math.min(Math.max(size.x, size.z) / 40, Math.sqrt((size.x * size.z) / 2500)) , Math.sqrt((size.x * size.z) / 2500));
  const hits = [];
  const dir = new THREE.Vector3(0, -1, 0);
  for (let x = box.min.x - cell; x <= box.max.x + cell; x += cell) {
    for (let z = box.min.z - cell; z <= box.max.z + cell; z += cell) {
      _ray.set(new THREE.Vector3(x + (r() - 0.5) * cell * 0.4, box.max.y + 1, z + (r() - 0.5) * cell * 0.4), dir);
      _ray.far = size.y + 2;
      const hit = _ray.intersectObjects(targets, false)[0];
      if (!hit || !hit.face || hit.point.y < 0.03) continue;
      const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (n.y < 0.55) continue;
      hits.push(hit.point);
    }
  }
  const lumps = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), snowMat(), Math.max(1, hits.length));
  lumps.name = 'snow';
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  hits.forEach((p, i) => {
    const s = cell * (0.75 + r() * 0.3);
    const t = cell * (0.28 + r() * 0.18);
    m4.compose(new THREE.Vector3(p.x, p.y + t * 0.35, p.z), q, new THREE.Vector3(s, t, s));
    lumps.setMatrixAt(i, m4);
  });
  lumps.count = hits.length;
  if (hits.length) root.add(lumps);
  // drift around the base
  const ring = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), snowMat(), 14);
  ring.name = 'snow_drift';
  const c = box.getCenter(new THREE.Vector3());
  const rx = Math.min(size.x / 2, 1.2);
  const rz = Math.min(size.z / 2, 1.2);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const s = 0.08 + r() * 0.1;
    m4.compose(new THREE.Vector3(c.x + Math.cos(a) * rx * (0.6 + r() * 0.4), 0, c.z + Math.sin(a) * rz * (0.6 + r() * 0.4)), q, new THREE.Vector3(s * 1.6, s * 0.45, s * 1.6));
    ring.setMatrixAt(i, m4);
  }
  root.add(ring);
}

/* ------------------------- generic geometric style trims ------------------------ */

/** Raise the prop onto a cast-concrete plinth sized to its footprint. */
function plinth(root) {
  const H = 0.18;
  root.updateMatrixWorld(true);
  const foot = new THREE.Box3();
  root.traverse((o) => {
    if (!o.isMesh || isGlow(o)) return;
    const b = new THREE.Box3().setFromObject(o);
    if (b.min.y < 0.12) foot.union(b);
  });
  if (foot.isEmpty()) foot.setFromObject(root);
  const lift = new THREE.Group();
  lift.name = 'plinth_lift';
  for (const c of [...root.children]) lift.add(c);
  lift.position.y = H;
  root.add(lift);
  const w = Math.max(0.5, foot.max.x - foot.min.x + 0.25);
  const d = Math.max(0.5, foot.max.z - foot.min.z + 0.25);
  const shape = new THREE.Shape();
  const r = 0.04;
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const g = new THREE.ExtrudeGeometry(shape, { depth: H - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);
  g.translate((foot.min.x + foot.max.x) / 2, 0.015, (foot.min.z + foot.max.z) / 2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#b9b5ae', roughness: 0.92, name: 'concrete' }));
  m.name = 'plinth';
  root.add(m);
}

/** Protective steel bollards (yellow reflective bands) around the front of the prop. */
function bollards(root) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(root);
  const steel = new THREE.MeshStandardMaterial({ color: '#c5c9cc', metalness: 0.85, roughness: 0.3, name: 'steel' });
  const band = new THREE.MeshStandardMaterial({ color: '#f5c400', roughness: 0.35, name: 'reflective' });
  const geo = new THREE.LatheGeometry([[0.001, 0], [0.07, 0], [0.07, 0.95], [0.065, 0.98], [0.04, 1.0], [0.001, 1.005]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  const bandGeo = new THREE.LatheGeometry([[0.0715, 0], [0.0715, 0.05]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  const xs = [b.min.x - 0.25, b.max.x + 0.25];
  const z = b.max.z + 0.35;
  const spots = [[xs[0], z], [xs[1], z], [(xs[0] + xs[1]) / 2, z + 0.05]];
  if (b.max.x - b.min.x < 0.6) spots.pop();
  spots.forEach(([x, zz], i) => {
    const m = new THREE.Mesh(geo, steel);
    m.position.set(x, 0, zz);
    m.name = `bollard_${i}`;
    root.add(m);
    for (const y of [0.78, 0.86]) {
      const r = new THREE.Mesh(bandGeo, band);
      r.position.set(x, y, zz);
      root.add(r);
    }
  });
}

/** Gently curved roof sheet: width along X, depth along Z, highest in the middle. */
export function curvedRoof(w, depth, rise, segs = 16) {
  const g = new THREE.PlaneGeometry(w, depth, 1, segs);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i) / (depth / 2);
    p.setY(i, rise * (1 - z * z));
  }
  g.computeVertexNormals();
  return g;
}

export const GENERIC_STYLES = ['plinth', 'bollards'];
/**
 * Split very long triangles (long slats, beams, panels) into shorter ones. The shape is
 * unchanged, but lighting/shadow sampling and surface-contact checks become reliable.
 */
const tessCache = new WeakMap();
const _t0 = new THREE.Vector3();
const _t1 = new THREE.Vector3();
const _t2 = new THREE.Vector3();
function evenTessellation(root) {
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || isGlow(o) || o.name === 'decal') return;
    const g = o.geometry;
    if (tessCache.has(g)) { o.geometry = tessCache.get(g); return; }
    const pos = g.attributes.position;
    const tris = g.index ? g.index.count / 3 : pos.count / 3;
    if (tris > 3000 || g.morphAttributes?.position) { tessCache.set(g, g); return; }
    // area and longest edge (world scale of the mesh is ~1 for street props)
    let area = 0;
    let longest = 0;
    const idx = (i) => (g.index ? g.index.getX(i) : i);
    for (let t = 0; t < tris; t++) {
      _t0.fromBufferAttribute(pos, idx(t * 3));
      _t1.fromBufferAttribute(pos, idx(t * 3 + 1));
      _t2.fromBufferAttribute(pos, idx(t * 3 + 2));
      longest = Math.max(longest, _t0.distanceTo(_t1), _t1.distanceTo(_t2), _t2.distanceTo(_t0));
      area += _t1.clone().sub(_t0).cross(_t2.clone().sub(_t0)).length() / 2;
    }
    // only long, slender parts (slats, beams, rails, counters); big panels are left alone
    g.computeBoundingBox();
    const sz = g.boundingBox.getSize(new THREE.Vector3());
    const d = [sz.x, sz.y, sz.z].sort((x, y) => y - x);
    const slender = d[0] >= 0.35 && d[1] <= 0.45;
    // slender parts get fine edges; panels get ~0.28 m edges as long as the result stays a few hundred triangles
    const e = slender ? 0.15 : 0.28;
    if (longest <= e * 1.05 || (!slender && area > 12)) { tessCache.set(g, g); return; }
    let out = g;
    try {
      const src = g.index ? g.toNonIndexed() : g.clone();
      if (!src.attributes.uv) src.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
      if (!src.attributes.normal) src.computeVertexNormals();
      for (const k of Object.keys(src.attributes)) if (!['position', 'normal', 'uv'].includes(k)) src.deleteAttribute(k);
      out = new TessellateModifier(e, 8).modify(src);
      // keep the result light: if it got too dense, keep the original
      const p = out.attributes.position;
      let pts = 0;
      for (let t = 0; t < p.count; t += 3) {
        _t0.fromBufferAttribute(p, t);
        _t1.fromBufferAttribute(p, t + 1);
        _t2.fromBufferAttribute(p, t + 2);
        const n = Math.min(12, Math.max(1, Math.ceil(Math.max(_t0.distanceTo(_t1), _t1.distanceTo(_t2), _t2.distanceTo(_t0)) / 0.012)));
        pts += ((n + 1) * (n + 2)) / 2;
      }
      if (!slender && pts > 36000) out = g;
    } catch {
      out = g;
    }
    tessCache.set(g, out);
    o.geometry = out;
  });
}

const APPLY = { rusty, damaged, graffiti, posters, snowy, plinth, bollards };

/**
 * Apply a condition trim (if `trim` is one) and finalize. Style trims are handled by
 * the factory itself; this only knows the generic conditions above.
 *   finish(root, { type, variant, o, animations, oneShot, exclusive, lean, handled })
 * `handled`: generic trims the factory implemented itself (skipped here).
 */
export function finish(root, { type, variant, o, animations = [], oneShot, exclusive, lean = true, handled }) {
  const trim = o.trim && APPLY[o.trim] && !(handled ?? []).includes(o.trim) ? o.trim : null;
  if (trim) {
    root.updateMatrixWorld(true);
    const r = rng(`${type}-${variant}-${trim}-${o.seed ?? 1}`);
    if (trim === 'damaged') damaged(root, r, { lean });
    else APPLY[trim](root, r);
  }
  evenTessellation(root);
  const obj = finalize(root, { type, variant, options: o, animations });
  if (oneShot?.length) obj.userData.premade.oneShot = oneShot;
  if (exclusive?.length) obj.userData.premade.exclusive = exclusive;
  return obj;
}

/** "victorian" etc. when the trim is a style, null when it's a condition or absent. */
export const styleOf = (o) => (o.trim && !APPLY[o.trim] ? o.trim : null);
