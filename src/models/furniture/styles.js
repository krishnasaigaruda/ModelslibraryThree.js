/*
 * Style trims for furniture & home models.
 *
 *   createChair({ variant: 'dining', trim: 'mid-century' })   // = catalog name "dining-mid-century"
 *
 * A style is applied in two places:
 *  1. while the factory runs (STYLE.cur), the shared helpers in common.js build
 *     different legs, handles, door fronts, cushions, edges and upholstery;
 *  2. afterwards applyStyle() splays legs, swaps leg materials, adds ferrules,
 *     re-finishes appliances / ceramics and adjusts proportions.
 * So every trim changes real geometry, not only colours.
 */
import { THREE, STYLE, metalMat, enamel, ceramic, plasticMat, woodMat, stainless, mesh, curveTube, caneMat, rattanMat, reclaimedMat, lacquer, stoneMat } from './common.js';

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/* ----------------------------- furniture styles ----------------------------- */
export const STYLES = {
  modern: {
    bedHead: 'floating',
    sofa: { arm: 'thin', legs: 'metal', low: true, back: 'tight', pillows: 0 },
    zones: { panel: 'lacquer:#ecebe7', leg: 'metal:black', frame: 'lacquer:#2b2b2d', surface: 'lacquer:#ecebe7' },
    leg: 'metal', legMetal: 'black', handle: 'slim', knob: 'square', hardware: 'black', front: 'slab',
    wood: '#4a4440', metal: 'black', upholstery: 'fabric', edge: 0.55, puff: 0.6, soft: 0.8, tufted: false, piping: false,
    palette: ['#5d6166', '#2f3237', '#a7a49d', '#3e4a52', '#8a8f94'], scale: [1.04, 0.97, 1.0], baseMetal: 'black',
  },
  scandinavian: {
    bedHead: 'slats',
    sofa: { arm: 'track', legs: 'taper' },
    zones: { panel: 'paint:#f2f0ea', leg: 'wood', frame: 'wood', surface: 'paint:#f2f0ea' },
    leg: 'peg', handle: 'edge', knob: 'mushroom', hardware: 'wood', front: 'slab',
    wood: '#e2c8a0', metal: 'white', upholstery: 'linen', edge: 1.5, puff: 0.9, soft: 1.15, tufted: false, piping: false,
    palette: ['#d9d4c7', '#b9c2b3', '#c8cdd2', '#e8e1d3', '#9fa8a3'], splay: 0.06, baseMetal: 'white',
  },
  industrial: {
    bedHead: 'pipe',
    sofa: { arm: 'track', legs: 'sled', back: 'tufted', pillows: 0 },
    zones: { panel: 'reclaimed', leg: 'metal:black', frame: 'metal:black', surface: 'reclaimed' }, stretchers: true,
    leg: 'pipe', legMetal: 'black', handle: 'tbar', knob: 'round', hardware: 'black', front: 'industrial',
    wood: '#6b4a32', metal: 'black', upholstery: 'leather', edge: 0.5, puff: 0.7, soft: 0.85, tufted: false, piping: false,
    palette: ['#8a5634', '#5a3b26', '#3b3633', '#6e4b33'], baseMetal: 'black',
  },
  farmhouse: {
    bedHead: 'plank',
    sofa: { arm: 'rolled', legs: 'skirt' },
    zones: { panel: 'paint', leg: 'paint', frame: 'paint', surface: 'reclaimed:#a77f52' },
    leg: 'turned', handle: 'cup', knob: 'mushroom', hardware: 'black', front: 'shaker',
    wood: '#b08a5a', metal: 'black', upholstery: 'canvas', edge: 1.1, puff: 1.0, soft: 1.0, tufted: false,
    palette: ['#e6dfcf', '#8c9a84', '#3f4f63', '#c9b79c', '#7d6a58'], frontColor: ['#f0ece2', '#dfe3dc', '#41556b'],
  },
  'mid-century': {
    bedHead: 'wing',
    sofa: { arm: 'thin', legs: 'taper', back: 'tufted', pillows: 0 },
    zones: { panel: 'wood', leg: 'wood', frame: 'wood', surface: 'wood' },
    leg: 'peg', splay: 0.14, ferrule: 'brass', handle: 'edge', knob: 'round', hardware: 'wood', front: 'slab',
    wood: 'walnut', metal: 'brass', upholstery: 'fabric', edge: 0.9, puff: 0.7, soft: 0.9, tufted: true, piping: false,
    palette: ['#c98a2b', '#2f6f6a', '#b5532a', '#5b6d3a', '#7c3a48'], scale: [1.0, 0.94, 1.0], baseMetal: 'brass',
  },
  classic: {
    bedHead: 'arched',
    sofa: { arm: 'chesterfield', legs: 'bun' },
    zones: { panel: 'wood', leg: 'wood', frame: 'wood', surface: 'wood' }, skirt: true, gloss: true,
    leg: 'cabriole', handle: 'ring', knob: 'ring', hardware: 'brass', front: 'raised',
    wood: '#6a2c1c', metal: 'brass', upholstery: 'velvet', edge: 1.0, puff: 1.25, soft: 1.1, tufted: true, piping: true,
    palette: ['#6e1f2b', '#1f4a3a', '#26334f', '#7a5a2e', '#4d2d4f'], baseMetal: 'brass',
  },
  japandi: {
    bedHead: 'low',
    sofa: { arm: 'wood', legs: 'taper', low: true, back: 'tight' },
    zones: { panel: 'wood', leg: 'lacquer:#22201e', frame: 'lacquer:#22201e', surface: 'wood' },
    leg: 'block', handle: 'edge', knob: 'square', hardware: 'wood', front: 'slat',
    wood: '#c8a77c', metal: 'black', upholstery: 'linen', edge: 1.2, puff: 0.75, soft: 1.0, tufted: false, piping: false,
    palette: ['#cfc5b4', '#5e5a55', '#a39585', '#e2dccf', '#7b8072'], scale: [1.06, 0.9, 1.04], baseMetal: 'black',
  },
  luxury: {
    bedHead: 'tufted',
    sofa: { arm: 'track', legs: 'taper', back: 'channel', pillows: 0 },
    zones: { panel: 'lacquer:#121212', leg: 'metal:gold', frame: 'lacquer:#121212', surface: 'marble' },
    leg: 'peg', legMetal: 'gold', handle: 'gold', knob: 'ball', hardware: 'gold', front: 'reeded',
    wood: '#3a2418', metal: 'gold', upholstery: 'velvet', edge: 1.0, puff: 1.2, soft: 1.1, tufted: true, piping: true,
    palette: ['#d9b8b0', '#1d4d43', '#e9e2d6', '#2c2f4a', '#8c6d4f'], scale: [1.05, 1.03, 1.05], baseMetal: 'gold',
  },
  boho: {
    bedHead: 'cane',
    sofa: { arm: 'rolled', legs: 'taper' },
    zones: { panel: 'wood', leg: 'rattan', frame: 'rattan', surface: 'cane' },
    leg: 'rattan', handle: 'leather', knob: 'round', hardware: 'leather', front: 'cane', caneColor: '#c9a26b',
    wood: '#b98a55', metal: 'brass', upholstery: 'boucle', edge: 1.3, puff: 1.3, soft: 1.25, tufted: false, piping: false,
    palette: ['#ece4d4', '#c0714a', '#d8b46a', '#8a9a6b', '#a8826a'],
  },
  kids: {
    bedHead: 'house',
    sofa: { arm: 'track', legs: 'bun' },
    zones: { panel: 'paint2', leg: 'paint', frame: 'paint2', surface: 'paint:#fbfaf6' }, brightParts: true,
    leg: 'peg', handle: 'knobs', knob: 'ball', hardware: '#f2c200', front: 'slab',
    wood: '#f3efe6', metal: 'white', upholstery: 'fabric', edge: 2.6, puff: 1.2, soft: 1.5, tufted: false, piping: false,
    palette: ['#e94f4f', '#3d8bd9', '#f2b632', '#45b36b', '#9b6bd1', '#ff8fb1'], frontColor: ['#2f8fe0', '#ff5c8a', '#3cc46b', '#ffbf1f', '#8f5fe0'],
    scale: [0.62, 0.62, 0.62], baseMetal: 'white',
  },
};
export const FURNITURE_STYLES = Object.keys(STYLES);
/** Lighter set for small upholstered / simple items. */
export const SOFT_STYLES = ['modern', 'scandinavian', 'industrial', 'farmhouse', 'mid-century', 'classic', 'japandi', 'luxury', 'boho', 'kids'];

/* ----------------------------- appliance finishes ----------------------------- */
export const FINISHES = {
  'black-steel': { finish: ['#2b2c2e', 1, 0.35], handle: 'bar', hardware: 'black', edge: 0.8 },
  white: { finish: ['#f3f3f1', 0, 0.25], handle: 'slim', hardware: 'steel', edge: 1.4 },
  retro: { finish: ['#9fd3c7', 0, 0.2], handle: 'tbar', hardware: 'chrome', edge: 3.2, scale: [1, 1.02, 1], palette: ['#9fd3c7', '#f2b8b0', '#f4e3a1', '#c23b3b', '#a9c6e8'] },
  'matte-graphite': { finish: ['#4a4c50', 0.5, 0.55], handle: 'gold', hardware: 'black', edge: 0.6 },
  'panel-ready': { finish: 'wood', handle: 'edge', hardware: 'wood', edge: 0.7, wood: 'oak' },
  copper: { finish: ['#b87333', 1, 0.3], handle: 'bar', hardware: 'brass', edge: 1 },
  pro: { finish: ['#c7cacd', 1, 0.22], handle: 'tbar', hardware: 'chrome', edge: 0.7, scale: [1.08, 1.02, 1.04] },
};
for (const [k, f] of Object.entries(FINISHES)) STYLES[k] = { ...f, appliance: true, upholstery: null };
export const APPLIANCE_FINISHES = Object.keys(FINISHES);

/* ----------------------------- decor styles ----------------------------- */
export const DECOR = {
  terracotta: { ceramic: ['#b8613d', 0.85], scale: [1, 1, 1], wood: '#b08a5a' },
  glazed: { ceramic: ['#2f5d7c', 0.08], scale: [0.95, 1.08, 0.95] },
  concrete: { ceramic: ['#9a9893', 0.95], scale: [1.08, 0.92, 1.08], edge: 0.5 },
  matte: { ceramic: ['#e9e6df', 0.7], scale: [1, 1, 1], edge: 1.2 },
  speckled: { ceramic: ['#d8cfc0', 0.5], scale: [1.05, 0.95, 1.05], speckle: true },
  gold: { ceramic: ['#d4af37', 0.2, 1], metal: 'gold', scale: [0.92, 1.1, 0.92] },
  black: { ceramic: ['#1d1d1f', 0.35], metal: 'black', scale: [1, 1, 1], wood: 'black' },
  'large': { scale: [1.35, 1.35, 1.35] },
  'small': { scale: [0.65, 0.65, 0.65] },
  'on-stand': { stand: true },
};
for (const [k, d] of Object.entries(DECOR)) STYLES[k] = { ...d, decor: true, upholstery: null };
export const DECOR_STYLES = Object.keys(DECOR);

/* ----------------------------- application ----------------------------- */

const _v = new THREE.Vector3();
const _box = new THREE.Box3();

function legBottomRadius(geo) {
  const p = geo.attributes.position;
  let minY = Infinity;
  for (let i = 0; i < p.count; i++) minY = Math.min(minY, p.getY(i));
  let r = 0;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < minY + 0.006) r = Math.max(r, Math.hypot(p.getX(i), p.getZ(i)));
  return { minY, r };
}

const _b2 = new THREE.Box3();
const _s = new THREE.Vector3();

function zoneMat(spec, st, o) {
  if (!spec || spec === 'wood') return null;
  const [k, arg] = spec.split(':');
  const pick = (arr, salt) => arr[hash(`${o.variant}:${salt}`) % arr.length];
  if (k === 'paint') return enamel(arg ?? pick(st.frontColor ?? st.palette, 'a'));
  if (k === 'paint2') return enamel(pick((st.frontColor ?? st.palette).slice().reverse(), 'b'));
  if (k === 'lacquer') return lacquer(arg ?? '#111');
  if (k === 'metal') return metalMat(arg ?? 'black');
  if (k === 'reclaimed') return reclaimedMat(arg ?? st.wood);
  if (k === 'marble') return stoneMat('#f1eee9', '#8d877f');
  if (k === 'cane') return caneMat(st.caneColor);
  if (k === 'rattan') return rattanMat(st.caneColor);
  return null;
}

/** Re-material wooden parts by role: legs, frame (rails, slats, posts, carcass) and horizontal surfaces (tops, seats). */
function applyZones(root, st, o, legs) {
  const cache = {};
  const get = (zone) => (zone in cache ? cache[zone] : (cache[zone] = zoneMat(st.zones[zone], st, o)));
  const legSet = new Set(legs);
  root.traverse((m) => {
    if (!m.isMesh || m.material?.name !== 'wood' && !legSet.has(m)) return;
    if (m.parent?.isMesh && m.parent.geometry.userData.leg) return; // ferrule
    let zone = 'frame';
    if (legSet.has(m)) zone = 'leg';
    else {
      _b2.setFromObject(m).getSize(_s);
      const dims = [_s.x, _s.y, _s.z].sort((a, b) => a - b);
      if (_s.y < 0.075 && _s.x > 0.22 && _s.z > 0.22) zone = 'surface';
      else if (dims[0] < 0.075 && dims[1] > 0.3 && dims[2] > 0.3) zone = 'panel';
      if (zone === 'surface' && st.zones.surface === 'cane' && _s.x * _s.z > 0.35) zone = 'frame';
      if (zone === 'surface' && st.zones.surface === 'marble' && _s.x * _s.z < 0.12) zone = 'frame';
    }
    const mat = zone === 'panel' && !st.zones.panel ? get('frame') : get(zone);
    if (mat) m.material = mat;
    else if (st.gloss && m.material?.name === 'wood') { m.material = m.material.clone(); m.material.clearcoat = 1; m.material.clearcoatRoughness = 0.08; }
  });
}

/** Industrial pipe stretchers or a classic carved skirt between the four outermost legs. */
function legFrame(root, st, legs) {
  root.updateMatrixWorld(true);
  const pts = [];
  for (const m of legs) {
    _b2.setFromObject(m);
    const c = _b2.getCenter(new THREE.Vector3());
    const bottom = root.worldToLocal(new THREE.Vector3(c.x, _b2.min.y, c.z));
    const top = root.worldToLocal(new THREE.Vector3(c.x, _b2.max.y, c.z));
    if (top.y - bottom.y < 0.28) continue;
    pts.push({ x: bottom.x, z: bottom.z, top: top.y, w: _b2.getSize(_s).x, m });
  }
  // where a (possibly tilted / curved) leg actually is at height y, in root space
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const at = (p, y) => {
    const pos = p.m.geometry.attributes.position;
    const mm = new THREE.Matrix4().multiplyMatrices(inv, p.m.matrixWorld);
    let sx = 0, sz = 0, k = 0;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mm);
      if (Math.abs(v.y - y) < 0.03) { sx += v.x; sz += v.z; k++; }
    }
    return k ? { x: sx / k, z: sz / k } : { x: p.x, z: p.z };
  };
  if (pts.length < 4) return;
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cz = pts.reduce((a, p) => a + p.z, 0) / pts.length;
  // four extreme corners
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => pts.reduce((best, p) => ((p.x - cx) * sx + (p.z - cz) * sz > (best.x - cx) * sx + (best.z - cz) * sz ? p : best)));
  if (new Set(corners).size < 4) return;
  const mat = st.stretchers ? metalMat('black') : null;
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len < 0.18) continue;
    if (st.stretchers) {
      const y = Math.min(a.top, b.top) * 0.22;
      const [pa, pb] = [at(a, y), at(b, y)];
      curveTube([[pa.x, y, pa.z], [pb.x, y, pb.z]], 0.011, mat, { parent: root, segments: 2, radialSegments: 12 });
    } else {
      // scalloped apron just under the top, between the two legs (measured where the legs are at that height)
      const top = Math.min(a.top, b.top) - 0.035;
      const pa = at(a, top - 0.03);
      const pb = at(b, top - 0.03);
      const w = Math.hypot(pb.x - pa.x, pb.z - pa.z) - Math.max(a.w, b.w) * 0.5;
      const h = Math.min(0.09, Math.min(a.top, b.top) * 0.16);
      const sh = new THREE.Shape();
      sh.moveTo(-w / 2, 0);
      sh.lineTo(-w / 2, -h);
      const n = 3;
      for (let k = 0; k < n; k++) {
        const x0 = -w / 2 + (k / n) * w;
        const x1 = -w / 2 + ((k + 1) / n) * w;
        sh.quadraticCurveTo((x0 + x1) / 2, -h * 0.35, x1, -h);
      }
      sh.lineTo(w / 2, 0);
      sh.lineTo(-w / 2, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 10 });
      g.translate(0, 0, -0.006);
      const wm = woodMat(st.wood);
      wm.clearcoat = 1;
      const m = mesh(g, wm, { parent: root });
      // sit on the line between the legs
      m.position.set((pa.x + pb.x) / 2, top, (pa.z + pb.z) / 2);
      m.rotation.y = -Math.atan2(pb.z - pa.z, pb.x - pa.x);
      // small carved rosette in the middle of the apron
      mesh(new THREE.SphereGeometry(0.012, 12, 8).scale(1, 1, 0.5), wm, { parent: m, at: [0, -h * 0.45, 0.012] });
    }
  }
}

function applyStyle(root, st, o) {
  root.updateMatrixWorld(true);
  _box.setFromObject(root);
  const centre = _box.getCenter(new THREE.Vector3());
  const legMat = st.legMetal ? metalMat(st.legMetal) : null;
  const ferrule = st.ferrule ? metalMat(st.ferrule) : null;
  const legs = [];
  const finish = st.finish
    ? st.finish === 'wood'
      ? woodMat(st.wood ?? 'oak')
      : new THREE.MeshPhysicalMaterial({ name: 'stainless', color: st.finish[0], metalness: st.finish[1], roughness: st.finish[2], clearcoat: 0.4, clearcoatRoughness: 0.3 })
    : null;
  const pal = st.palette && !o.color ? st.palette[hash(String(o.variant)) % st.palette.length] : null;
  const ceramicMat = st.ceramic
    ? new THREE.MeshPhysicalMaterial({ name: 'ceramic', color: o.color ?? st.ceramic[0], roughness: st.ceramic[1], metalness: st.ceramic[2] ?? 0, clearcoat: st.ceramic[1] < 0.3 ? 1 : 0.2, clearcoatRoughness: 0.1 })
    : null;
  root.traverse((m) => {
    if (!m.isMesh) return;
    const leg = m.geometry.userData.leg;
    if (leg) legs.push(m);
    const name = m.material?.name;
    if (finish && name === 'stainless') m.material = finish;
    if (st.appliance && name === 'paint' && (pal || st.finish)) {
      m.material = m.material.clone();
      if (pal) m.material.color.set(pal);
      else if (Array.isArray(st.finish)) m.material.color.set(st.finish[0]);
    }
    if (ceramicMat && name === 'ceramic') m.material = ceramicMat;
  });
  for (const m of legs) {
    const leg = m.geometry.userData.leg;
    if (legMat) m.material = legMat;
    m.getWorldPosition(_v);
    const sx = Math.sign(_v.x - centre.x) || 1;
    const sz = Math.sign(_v.z - centre.z) || 1;
    if (leg.kind === 'cabriole' || leg.kind === 'sabre') m.rotation.y = sx > 0 ? (sz > 0 ? 0 : Math.PI / 2) : sz > 0 ? -Math.PI / 2 : Math.PI;
    if (st.splay && !m.rotation.x && !m.rotation.z && leg.h > 0.12 && leg.h < 0.8) { // tall back posts carry a backrest: never splay
      const a = st.splay;
      const top = new THREE.Vector3(0, leg.centred ? leg.h / 2 : leg.h, 0);
      m.rotation.z = sx * a;
      m.rotation.x = -sz * a;
      m.updateMatrix();
      const moved = top.clone().applyEuler(m.rotation);
      m.position.add(top.sub(moved));
    }
    if (ferrule) {
      const { minY, r } = legBottomRadius(m.geometry);
      const cap = mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.0, 0.035, 16), ferrule, { parent: m, at: [0, minY + 0.0175, 0] });
      cap.castShadow = true;
    }
  }
  if (st.zones) applyZones(root, st, o, legs);
  if ((st.stretchers || st.skirt) && legs.length >= 4) legFrame(root, st, legs);
  if (st.stand) addStand(root);
  if (st.scale) root.scale.multiply(new THREE.Vector3(...st.scale));
}

/** Plant / vase stand: three splayed wooden legs and a ring, the object sits on top. */
function addStand(root) {
  _box.setFromObject(root);
  const size = _box.getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.z) * 0.42;
  const H = Math.max(0.25, Math.min(0.55, size.y * 0.6));
  const kids = [...root.children];
  const lift = new THREE.Group();
  lift.position.y = H;
  for (const k of kids) lift.add(k);
  root.add(lift);
  const W = woodMat('walnut');
  mesh(new THREE.CylinderGeometry(r, r, 0.03, 32), W, { parent: root, at: [0, H - 0.015, 0] });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const top = [Math.cos(a) * r * 0.75, H - 0.03, Math.sin(a) * r * 0.75];
    const bot = [Math.cos(a) * r * 1.05, 0, Math.sin(a) * r * 1.05];
    const len = Math.hypot(bot[0] - top[0], H - 0.03, bot[2] - top[2]);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.01, len, 12), W);
    leg.position.set((top[0] + bot[0]) / 2, (H - 0.03) / 2, (top[2] + bot[2]) / 2);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(top[0] - bot[0], H - 0.03, top[2] - bot[2]).normalize());
    leg.castShadow = true;
    root.add(leg);
  }
  // fix animation targets: they reference names, which still resolve (names are kept)
}

/**
 * Wrap a factory so it understands `trim`. Unknown / missing trim → original model.
 * User options (color, wood, metal) always win over the style's defaults.
 */
export function styled(factory, type) {
  return (options = {}) => {
    const trim = options.trim;
    const st = trim ? STYLES[trim] : null;
    if (!st) return factory(options);
    const o = { ...options };
    const has = (k) => o[k] != null || o[k.charAt(0).toUpperCase() + k.slice(1)] != null;
    const pick = (arr) => arr[hash(`${type}:${o.variant ?? ''}`) % arr.length];
    if (!has('color') && st.palette && !st.appliance) o.color = pick(st.palette);
    if (!has('wood') && st.wood) o.wood = st.wood;
    if (!has('metal') && st.metal) o.metal = st.metal;
    const ctx = { ...st, hardwareMat: null, frontMat: st.frontColor ? enamel(pick(st.frontColor)) : null };
    if (st.appliance) Object.assign(ctx, { leg: null, front: null, upholstery: null });
    if (st.decor) Object.assign(ctx, { leg: null, front: null, handle: null, upholstery: null });
    STYLE.cur = ctx;
    let obj;
    try {
      obj = factory(o);
    } finally {
      STYLE.cur = null;
    }
    applyStyle(obj, ctx, { ...o, color: has('color') && !st.palette ? o.color : options.color });
    obj.userData.premade.trim = trim;
    return obj;
  };
}

export { ceramic, plasticMat, stainless };
