import * as THREE from 'three';
import { group, mesh, rng, finalize, normalizeOptions } from '../../core/utils.js';
import { merge, paintVertices, blob, fbm, seedOf, vcMat, checkVariant, instanced } from './common.js';

const V3 = THREE.Vector3;

/*
 * Terrain tiles: a height field shaped like a real landform, coloured by
 * biome with slope (bare rock on steep faces) and altitude (snow on peaks).
 * Water fills ponds, streams and the sea around islands. Edges fall to y = 0
 * so tiles sit on any ground plane. Default tile size 10 m (option `size`).
 */
export const TERRAIN_VARIANTS = {
  hill: {},
  mountain: {},
  ridge: {},
  valley: {},
  mesa: {},
  crater: {},
  'sand-dune': { biome: 'desert' },
  pond: { water: 'pond' },
  stream: { water: 'stream' },
  island: { water: 'sea' },
  canyon: {},
  plateau: {},
};
export const TERRAIN_TRIMS = Object.fromEntries(Object.keys(TERRAIN_VARIANTS).map((k) => [k, ['snowy', 'desert', 'rocky', 'autumn', 'tundra', 'volcanic', 'swamp']]));

const BIOMES = {
  grass: { low: '#4f7a30', high: '#45702a', rock: '#7a746a', top: '#5a7a36', scatter: 'bush' },
  snowy: { low: '#e8eef4', high: '#f6f8fb', rock: '#6a6a6e', top: '#ffffff', scatter: 'pine' },
  desert: { low: '#d8b480', high: '#c89a62', rock: '#b07a4a', top: '#e0c08a', scatter: 'rock' },
  rocky: { low: '#6a6a5a', high: '#7a766c', rock: '#5a5650', top: '#8a867c', scatter: 'rock' },
  autumn: { low: '#8a7a3a', high: '#a8682a', rock: '#7a746a', top: '#b8782e', scatter: 'autumn' },
  tundra: { low: '#7a8a5a', high: '#8a8a6a', rock: '#6a6a64', top: '#a8a890', scatter: 'rock' },
  volcanic: { low: '#2a2624', high: '#1e1a1a', rock: '#3a302a', top: '#4a3a2e', scatter: 'lava' },
  swamp: { low: '#4a5a2a', high: '#3e5226', rock: '#4a4a3a', top: '#5a6a34', scatter: 'reed' },
};

/** Normalised height 0..1 at (x, z) in [-1, 1]² for each landform. */
function shapeHeight(variant, x, z, seed) {
  const r = Math.hypot(x, z);
  const n = fbm(x * 2 + seed, 0, z * 2, seed, 4);
  const edge = Math.max(0, 1 - Math.pow(Math.max(Math.abs(x), Math.abs(z)), 6)); // fall to 0 at the tile border
  let h;
  switch (variant) {
    case 'mountain': h = Math.pow(Math.max(0, 1 - r), 1.6) * (1 + 0.45 * Math.abs(fbm(x * 3, 1, z * 3, seed + 3, 4))); break;
    case 'ridge': h = Math.pow(Math.max(0, 1 - Math.abs(z + 0.15 * Math.sin(x * 3)) * 1.6), 1.5) * (0.7 + 0.3 * Math.cos(x * 1.5)); break;
    case 'valley': h = Math.min(1, Math.abs(z + 0.15 * Math.sin(x * 2.5)) * 1.4) * 0.8; break;
    case 'mesa': { const t = THREE.MathUtils.smoothstep(0.62 - r + 0.08 * n, 0, 0.12); h = t * 0.85 + (1 - t) * 0.08; break; }
    case 'crater': h = Math.exp(-Math.pow((r - 0.55) * 4, 2)) * 0.9 + 0.05 - Math.max(0, 0.45 - r) * 0.3; break;
    case 'sand-dune': h = Math.max(0, Math.sin(x * 2.6 + z * 0.6 + n) * 0.5 + 0.5) * Math.max(0, 1 - r * 0.8) * (x + 0.3 * Math.sin(z * 4) > 0 ? 1 : 0.8); break;
    case 'pond': h = 0.18 + 0.12 * n + Math.max(0, r - 0.45) * 0.4 - Math.max(0, 0.42 - r) * 0.6; break;
    case 'stream': h = 0.25 + 0.15 * n - Math.exp(-Math.pow((z - 0.25 * Math.sin(x * 2.5)) * 6, 2)) * 0.35; break;
    case 'island': h = Math.pow(Math.max(0, 0.85 - r), 1.2) * 0.9 + 0.08 * n; break;
    case 'canyon': { const d = Math.abs(z - 0.2 * Math.sin(x * 2)); h = d < 0.18 ? 0.08 : 0.8 + 0.08 * Math.floor((0.9 + n) * 5) / 5; break; }
    case 'plateau': h = THREE.MathUtils.smoothstep(0.75 - r + 0.1 * n, 0, 0.35) * 0.55 + 0.05; break;
    default: h = Math.pow(Math.max(0, 1 - r * 0.9), 2) * 0.8; // hill
  }
  return Math.max(0, (h + 0.05 * n) * edge);
}

const HEIGHT = { hill: 3.2, mountain: 6, ridge: 3.5, valley: 3, mesa: 3.2, crater: 2.4, 'sand-dune': 2.2, pond: 1.2, stream: 1.2, island: 2.5, canyon: 3.5, plateau: 2.5 };

export function createTerrain(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('terrain', TERRAIN_VARIANTS, TERRAIN_TRIMS, o.variant, o.trim);
  const v = TERRAIN_VARIANTS[variant];
  const trim = o.trim ?? null;
  const biomeName = trim ?? v.biome ?? 'grass';
  const B = BIOMES[biomeName];
  const seed = seedOf(o, 71 + variant.length);
  const rand = rng(seed * 37 + 3);
  const S = o.size ?? 10;
  const Hm = HEIGHT[variant] * (S / 10);
  const root = group(`terrain-${variant}${trim ? `-${trim}` : ''}`);
  const segs = 96;
  const g = new THREE.PlaneGeometry(S, S, segs, segs);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (S / 2);
    const z = p.getZ(i) / (S / 2);
    let h = shapeHeight(variant, x, z, seed) * Hm;
    h += 0.04 * (S / 10) * fbm(x * 18, 0, z * 18, seed + 5, 3); // ground micro relief
    if (variant === 'mesa' || variant === 'canyon' || variant === 'plateau') h += 0.08 * Math.abs(fbm(x * 6, h, z * 6, seed + 9, 2)) * Hm * 0.2;
    p.setY(i, Math.max(0, h));
  }
  // force the outer ring to the ground so the tile meets any floor
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getX(i)) > S / 2 - 1e-3 || Math.abs(p.getZ(i)) > S / 2 - 1e-3) p.setY(i, 0);
  g.computeVertexNormals();
  const low = new THREE.Color(B.low);
  const high = new THREE.Color(B.high);
  const rock = new THREE.Color(B.rock);
  const top = new THREE.Color(B.top);
  paintVertices(g, (q, n) => {
    const t = THREE.MathUtils.clamp(q.y / Math.max(0.1, Hm), 0, 1);
    const c = low.clone().lerp(high, t).multiplyScalar(0.85 + 0.25 * fbm(q.x * 1.5, 0, q.z * 1.5, seed, 3));
    const steep = THREE.MathUtils.smoothstep(1 - n.y, 0.25, 0.55);
    c.lerp(rock.clone().multiplyScalar(0.85 + 0.3 * fbm(q.x * 4, q.y * 4, q.z * 4, seed + 1, 2)), steep);
    if (variant === 'mesa' || variant === 'canyon' || variant === 'sand-dune') {
      // sedimentary banding on the cliffs
      const band = 0.5 + 0.5 * Math.sin(q.y * 7 + fbm(q.x, q.y, q.z, seed, 2));
      c.lerp(new THREE.Color(biomeName === 'grass' ? '#b07a4a' : B.rock).multiplyScalar(0.8 + 0.3 * band), steep * 0.8);
    }
    if (t > 0.8 && biomeName !== 'desert' && biomeName !== 'volcanic') c.lerp(top, (t - 0.8) * 5 * (1 - steep * 0.5)); // caps
    if (biomeName === 'volcanic' && fbm(q.x * 2.5, 0, q.z * 2.5, seed + 7, 3) > 0.32 && n.y > 0.8) c.set('#ff5a1a').multiplyScalar(1.2); // lava seams
    if (v.water && q.y < 0.35 * (S / 10)) c.lerp(new THREE.Color(biomeName === 'snowy' ? '#c8d0d8' : '#c8b48a'), 0.7); // shore sand / mud
    return c;
  });
  const mat = vcMat(0.95, THREE.FrontSide, { name: 'terrain' });
  if (biomeName === 'volcanic') { mat.emissive = new THREE.Color('#ff3a00'); mat.emissiveIntensity = 0; }
  mesh(g, mat, { parent: root, name: 'ground' });
  // water
  const waterY = { pond: 0.22, stream: 0.2, sea: 0.25 }[v.water] ?? (biomeName === 'swamp' ? 0.12 : null);
  if (waterY != null) {
    const wg = v.water === 'sea' ? new THREE.PlaneGeometry(S, S) : new THREE.PlaneGeometry(S * 0.98, S * 0.98);
    wg.rotateX(-Math.PI / 2);
    wg.translate(0, waterY * Hm, 0);
    const frozen = biomeName === 'snowy' || biomeName === 'tundra';
    mesh(wg, new THREE.MeshPhysicalMaterial({ color: frozen ? '#c8dce8' : biomeName === 'swamp' ? '#3a4a2a' : v.water === 'sea' ? '#2a7a9a' : '#3a6a7a', roughness: frozen ? 0.3 : 0.03, transparent: true, opacity: frozen ? 0.95 : 0.78, name: 'water' }), { parent: root, name: frozen ? 'ice' : 'water' });
  }
  // scatter: small biome details sitting on the surface (sampled from the height field)
  const items = [];
  const heightAt = (x, z) => {
    const ix = Math.round(((x + S / 2) / S) * segs);
    const iz = Math.round(((z + S / 2) / S) * segs);
    return p.getY(iz * (segs + 1) + ix);
  };
  const nSc = { bush: 40, pine: 30, rock: 30, autumn: 40, lava: 18, reed: 60 }[B.scatter];
  for (let i = 0; i < nSc; i++) {
    const x = (rand() - 0.5) * S * 0.9;
    const z = (rand() - 0.5) * S * 0.9;
    const y = heightAt(x, z);
    if (waterY != null && y < waterY * Hm + 0.02 && B.scatter !== 'reed') continue;
    if (y < 0.03 && B.scatter !== 'rock' && B.scatter !== 'reed') continue;
    const s = (0.6 + rand() * 0.8) * (S / 10);
    items.push({ p: new V3(x, y - 0.03, z), s: new V3(s, s * (B.scatter === 'pine' ? 2.6 : B.scatter === 'reed' ? 1.8 : 0.8), s), c: B.scatter === 'autumn' ? ['#c0502a', '#d88a2a', '#b8402a'][i % 3] : B.scatter === 'pine' ? '#2a4a30' : B.scatter === 'bush' ? ['#3e6b2c', '#4a7a33'][i % 2] : B.scatter === 'lava' ? '#2a2422' : B.scatter === 'reed' ? '#6a7a3a' : B.rock });
  }
  let sg;
  if (B.scatter === 'pine' || B.scatter === 'reed') { sg = new THREE.ConeGeometry(0.18, 0.6, 7); sg.translate(0, 0.3, 0); }
  else if (B.scatter === 'rock' || B.scatter === 'lava') sg = blob(0.14, { detail: 2, seed, amount: 0.35, scale: [1.2, 0.7, 1] });
  else { sg = blob(0.22, { detail: 2, seed, amount: 0.3, scale: [1, 0.8, 1] }); sg.translate(0, 0.14, 0); }
  if (items.length) root.add(instanced(sg, new THREE.MeshStandardMaterial({ roughness: 0.9, color: '#ffffff' }), items, 'scatter'));
  void merge;
  return finalize(root, { type: 'terrain', variant, options: o, animations: [] });
}
