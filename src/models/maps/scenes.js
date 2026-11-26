import * as THREE from 'three';
import { normalizeOptions } from '../../core/utils.js';
import { makeMap, terrain, water, road, pad, bays, trackLoop, dome, habModule, antenna, solarArray, landingPad, crystals, wall } from './kit.js';

/*
 * MAPS: complete scenes built from the library's own models. 25 families x 4 variants.
 * Every map has ground (terrain + water where needed), a layout (streets, tracks, fields,
 * paths), main structures, vehicles, people, animals and plenty of set dressing.
 */

const H = Math.PI / 2;
const P = Math.PI;
const TREES = { temperate: [['tree', 'oak'], ['tree', 'maple'], ['tree', 'birch'], ['tree', 'beech'], ['tree', 'elm']], pine: [['tree', 'pine'], ['tree', 'spruce'], ['tree', 'fir']] };
const CARS = [['car', 'sedan'], ['car', 'hatchback'], ['car', 'suv'], ['car', 'wagon'], ['car', 'coupe'], ['car', 'minivan'], ['van', 'cargo']];
const PEOPLE = [['person', 'man'], ['person', 'woman'], ['person', 'boy'], ['person', 'girl'], ['person', 'elder-man'], ['person', 'elder-woman']];
const pickVariant = (v, list) => (list.includes(v) ? v : list[0]);

/** Street grid: n x n blocks. Returns block rectangles; lays roads, lights, trees, parked cars, people. */
function grid(ctx, { n = 2, block = 30, w = 7, lights = 'modern', trees = TREES.temperate, cars = 6, people = 8, kind = 'street' } = {}) {
  n = Math.max(1, Math.round(n * ctx.k * 0.72));
  cars = Math.round(cars * ctx.k * 1.6);
  people = Math.round(people * ctx.k);
  const pitch = block + w + 4.4;
  const L = n * pitch;
  const lines = Array.from({ length: n + 1 }, (_, i) => -L / 2 + i * pitch);
  for (const x of lines) road(ctx, x, -L / 2 - 6, x, L / 2 + 6, { w, kind });
  for (const z of lines) road(ctx, -L / 2 - 6, z, L / 2 + 6, z, { w, kind });
  const blocks = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = lines[i] + w / 2 + 2.2, x1 = lines[i + 1] - w / 2 - 2.2;
    const z0 = lines[j] + w / 2 + 2.2, z1 = lines[j + 1] - w / 2 - 2.2;
    blocks.push({ x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 });
  }
  // streetlights + trees on the sidewalks
  for (const x of lines) for (let z = -L / 2 + 10; z < L / 2; z += 24) {
    ctx.put('streetlight', lights, x + w / 2 + 1.6, z, -H, { claim: false });
    if (trees && ctx.r() < 0.6) ctx.put(...ctx.pick(trees), x - w / 2 - 1.6, z + 8, 0, { fit: 4, claim: false });
  }
  // parked cars along the kerbs + people on the pavement
  for (let k = 0; k < cars; k++) {
    const along = ctx.rand(-L / 2 + 6, L / 2 - 6);
    const line = ctx.pick(lines);
    const side = ctx.r() < 0.5 ? -1 : 1;
    if (ctx.r() < 0.5) ctx.put(...ctx.pick(CARS), line + side * (w / 2 - 1.3), along, side > 0 ? 0 : P, { claim: false });
    else ctx.put(...ctx.pick(CARS), along, line + side * (w / 2 - 1.3), side > 0 ? -H : H, { claim: false });
  }
  for (let k = 0; k < people; k++) {
    const line = ctx.pick(lines);
    const along = ctx.rand(-L / 2 + 4, L / 2 - 4);
    const off = (ctx.r() < 0.5 ? -1 : 1) * (w / 2 + 1.2);
    if (ctx.r() < 0.5) ctx.put(...ctx.pick(PEOPLE), line + off, along, ctx.rand(0, 6.28), { claim: false });
    else ctx.put(...ctx.pick(PEOPLE), along, line + off, ctx.rand(0, 6.28), { claim: false });
  }
  return { blocks, L, lines, pitch };
}

/** Line a block's edges with buildings facing the streets. */
function fillBlock(ctx, b, list, { per = 2, fit } = {}) {
  const w = b.x1 - b.x0;
  const d = b.z1 - b.z0;
  const f = fit ?? Math.min(w, d) / per - 1;
  for (let k = 0; k < per; k++) {
    const t = (k + 0.5) / per;
    ctx.put(...ctx.pick(list), b.x0 + w * t, b.z1 - f / 2, 0, { fit: f }); // faces +z street
    ctx.put(...ctx.pick(list), b.x0 + w * t, b.z0 + f / 2, P, { fit: f }); // faces -z street
  }
}

const BIZ = [['shop', 'cafe'], ['shop', 'bakery'], ['shop', 'pharmacy'], ['shop', 'grocery'], ['restaurant', 'diner'], ['restaurant', 'pizzeria'], ['bank', 'classic'], ['office', 'lowrise']];
const TOWERS = [['skyscraper', 'glass'], ['skyscraper', 'office'], ['skyscraper', 'tapered'], ['skyscraper', 'art-deco'], ['skyscraper', 'twisted'], ['skyscraper', 'cylinder'], ['apartment', 'tower'], ['hotel', 'highrise'], ['office', 'midrise']];
const HOUSES = [['house', 'cottage'], ['house', 'suburban'], ['house', 'modern'], ['house', 'bungalow'], ['house', 'victorian'], ['house', 'farmhouse']];

/* ================================ families ================================ */

export const MAP_CITY_VARIANTS = { financial: {}, plaza: {}, waterfront: {}, 'old-town': {} };
export async function createMapCity(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_CITY_VARIANTS));
  const ctx = makeMap(`map-city-${v}`, o.seed ?? 1, { size: 130 });
  terrain(ctx, { biome: 'grass', hills: 3, flat: 0.45, dip: v === 'waterfront' ? (x, z) => (z < -50 ? -3 * THREE.MathUtils.smoothstep(-z, 50, 60) : 0) : null });
  if (v === 'waterfront') water(ctx, { y: -0.4, w: 220, d: 60, z: -85 });
  const g = grid(ctx, { n: 3, block: 28, lights: v === 'old-town' ? 'classic' : 'double', cars: 9, people: 10 });
  ctx.townFill = g.L / 2 + 14;
  g.blocks.forEach((b, i) => {
    if (v === 'plaza' && i === 4) {
      pad(ctx, b.cx, b.cz, b.x1 - b.x0, b.z1 - b.z0, { color: '#cfc8bb' });
      ctx.put('fountain', 'plaza-jets', b.cx, b.cz, 0, { fit: 10 });
      for (const [dx, dz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) ctx.put('tree', 'maple', b.cx + dx, b.cz + dz, 0, { fit: 4 });
      for (const dx of [-5, 5]) ctx.put('bench', 'modern', b.cx + dx, b.cz + 6, P);
      return;
    }
    if (v === 'old-town') fillBlock(ctx, b, [['apartment', 'brick'], ['apartment', 'classic'], ...BIZ], { per: 3 });
    else fillBlock(ctx, b, i % 3 === 1 ? BIZ : TOWERS, { per: 2 });
  });
  ctx.put('bus', 'city', g.lines[1] + 1.8, 10, 0, { claim: false });
  ctx.put('car', 'taxi', g.lines[2] - 1.8, -14, P, { claim: false });
  ctx.put('traffic-light', 'overhead', g.lines[1] + 5, g.lines[1] + 5, 0, { claim: false });
  ctx.put('traffic-light', 'overhead', g.lines[2] - 5, g.lines[2] - 5, P, { claim: false });
  if (v === 'waterfront') for (let x = -50; x <= 50; x += 25) ctx.put('boat', ctx.pick(['yacht', 'speedboat', 'sailboat']), x, -70, H, { y: -0.4, claim: false });
  return ctx.done();
}

export const MAP_SUBURB_VARIANTS = { 'grid-street': {}, 'cul-de-sac': {}, lakeside: {}, winter: {} };
export async function createMapSuburb(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_SUBURB_VARIANTS));
  const ctx = makeMap(`map-suburb-${v}`, o.seed ?? 2, { size: 110 });
  const snow = v === 'winter';
  terrain(ctx, { biome: snow ? 'snow' : 'meadow', hills: 5, flat: 0.42, dip: v === 'lakeside' ? (x, z) => -2.5 * Math.max(0, 1 - Math.hypot(x - 30, z + 30) / 22) : null });
  if (v === 'lakeside') water(ctx, { y: -0.3, w: 44, d: 44, x: 30, z: -30 });
  const houses = HOUSES.map(([t, hv]) => [t, hv + (snow ? '-winter' : '')]);
  if (v === 'cul-de-sac') {
    road(ctx, 0, 55, 0, -10, { w: 7 });
    pad(ctx, 0, -18, 22, 22, { color: '#3d3f43' });
    for (let k = 0; k < 8; k++) {
      const a = -P / 2 + (k / 7) * P * 1.6 - 0.8 * P / 1.6 * 0;
      const ang = P * 0.15 + (k / 7) * P * 1.7;
      const x = Math.cos(ang) * 26, z = -18 + Math.sin(ang) * 26;
      ctx.put(...houses[k % houses.length], x, z, Math.atan2(-x, -18 - z) , { fit: 13 });
      ctx.put('mailbox', 'residential', x * 0.62, -18 + (z + 18) * 0.62, 0, { claim: false });
      ctx.put(...ctx.pick(CARS), x * 0.75, -18 + (z + 18) * 0.75, ang + H, { claim: false });
    }
  } else {
    const g = grid(ctx, { n: 2, block: 34, lights: 'classic', cars: 6, people: 6 });
    ctx.townFill = g.L / 2 + 14;
    g.blocks.forEach((b) => {
      fillBlock(ctx, b, houses, { per: 2, fit: 13 });
      for (const [dx, dz] of [[-6, 0], [6, 0]]) ctx.put('fence', 'picket', b.cx + dx, b.cz + dz, H, { claim: false });
    });
  }
  ctx.scatter(18, TREES.temperate, () => true, { rad: 2.5, fit: 5 });
  ctx.scatter(6, [['dog', 'labrador'], ['dog', 'golden-retriever'], ['cat', 'tabby']], (x, z) => Math.hypot(x, z) < 45, { rad: 1 });
  ctx.scatter(4, [['bicycle', 'city'], ['bicycle', 'kids'], ['trash-can', 'wheelie']], (x, z) => Math.hypot(x, z) < 45, { rad: 1 });
  if (v === 'lakeside') { ctx.put('boardwalk', 'pier', 18, -18, -P / 4, { fit: 14 }); ctx.put('boat', 'rowboat', 30, -30, 0.6, { y: -0.3 }); }
  return ctx.done();
}

export const MAP_VILLAGE_VARIANTS = { english: {}, alpine: {}, coastal: {}, adobe: {} };
export async function createMapVillage(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_VILLAGE_VARIANTS));
  const ctx = makeMap(`map-village-${v}`, o.seed ?? 3, { size: 100 });
  const biome = { english: 'meadow', alpine: 'grass', coastal: 'grass', adobe: 'desert' }[v];
  terrain(ctx, { biome, hills: v === 'alpine' ? 22 : 6, flat: 0.36, dip: v === 'coastal' ? (x, z) => (x > 40 ? -4 * THREE.MathUtils.smoothstep(x, 40, 55) : 0) : null });
  if (v === 'coastal') water(ctx, { y: -0.5, w: 60, d: 200, x: 85 });
  road(ctx, -60, 0, 60, 0, { w: 6, kind: v === 'adobe' ? 'dirt' : 'street' });
  if (v !== 'adobe') ctx.townFill = 52;
  road(ctx, 0, -50, 0, 50, { w: 5, kind: v === 'adobe' ? 'dirt' : 'street' });
  pad(ctx, 12, 12, 16, 16, { color: v === 'adobe' ? '#cfa66a' : '#a8a296' });
  ctx.put('stone-well', v === 'adobe' ? 'stone-round' : 'covered', 12, 12, 0, { fit: 3 });
  ctx.put(v === 'adobe' ? 'temple' : 'church', v === 'adobe' ? 'mosque' : 'chapel', -20, -18, 0, { fit: 18 });
  const homes = { english: [['house', 'cottage'], ['house', 'victorian'], ['house', 'farmhouse']], alpine: [['house', 'cottage-winter'], ['house', 'farmhouse'], ['shed', 'tiny-cabin']], coastal: [['house', 'cottage'], ['house', 'bungalow'], ['lighthouse', 'striped']], adobe: [['house', 'modern'], ['house', 'bungalow'], ['shop', 'bakery']] }[v];
  const spots = [[-30, 12, 0], [-14, 13, 0], [22, -14, P], [36, -13, P], [-34, -14, P], [32, 14, 0], [-12, 30, -H], [12, -32, H], [-12, -32, -H], [14, 34, H]];
  spots.forEach(([x, z, ry], i) => ctx.put(...homes[i % homes.length], x, z, ry, { fit: 12 }));
  ctx.put('market-stall', 'fruit', 6, 18, P, { fit: 4 });
  ctx.put('market-stall', 'canopy', 18, 6, H, { fit: 4 });
  ctx.scatter(16, v === 'adobe' ? [['cactus', 'saguaro'], ['cactus', 'barrel'], ['succulent', 'agave']] : v === 'alpine' ? TREES.pine : TREES.temperate, () => true, { rad: 2.5, fit: 5 });
  ctx.scatter(10, PEOPLE, (x, z) => Math.hypot(x, z) < 30, { rad: 1 });
  ctx.scatter(4, v === 'adobe' ? [['camel', 'dromedary'], ['donkey-zebra', 'donkey']] : [['sheep-goat', 'merino'], ['poultry', 'hen'], ['dog', 'labrador']], (x, z) => Math.hypot(x, z) > 20 && Math.hypot(x, z) < 45, { rad: 1.2 });
  if (v === 'coastal') ctx.put('boat', 'fishing', 70, 10, 0, { y: -0.5 });
  return ctx.done();
}

export const MAP_FARM_VARIANTS = { dairy: {}, crops: {}, orchard: {}, ranch: {} };
export async function createMapFarm(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_FARM_VARIANTS));
  const ctx = makeMap(`map-farm-${v}`, o.seed ?? 4, { size: 120 });
  terrain(ctx, { biome: v === 'ranch' ? 'desert' : 'meadow', hills: 7, flat: 0.45 });
  road(ctx, -70, -40, 70, -40, { w: 6, kind: 'dirt' });
  road(ctx, -10, -40, -10, 10, { w: 4, kind: 'dirt' });
  ctx.put('barn', 'gambrel', -24, 8, 0, { fit: 18 });
  ctx.put('silo', 'grain', -10, 16, 0, { fit: 6 });
  ctx.put('house', 'farmhouse', 10, 4, P, { fit: 13 });
  ctx.put('windmill', 'windpump', 22, 20, 0, { fit: 6 });
  ctx.put('farm', 'tractor-utility', -4, -6, 0.4);
  // fields / pastures
  const field = (x0, x1, z0, z1, crop) => {
    for (let x = x0; x <= x1; x += 3.2) for (let z = z0; z <= z1; z += 4) ctx.put('crop', crop, x, z, 0, { claim: false, fit: 2.4 });
    ctx.taken.push([(x0 + x1) / 2, (z0 + z1) / 2, Math.max(x1 - x0, z1 - z0) / 2]);
  };
  const fence = (x0, z0, x1, z1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 3));
    for (let i = 0; i < n; i++) ctx.put('fence', 'post-rail', x0 + (x1 - x0) * (i + 0.5) / n, z0 + (z1 - z0) * (i + 0.5) / n, Math.atan2(x1 - x0, z1 - z0) + H, { claim: false, fit: 3.2 });
  };
  if (v === 'crops') { field(10, 40, -30, -14, 'corn'); field(-50, -24, -30, -14, 'wheat'); field(22, 46, 26, 40, 'sunflower'); ctx.put('farm', 'combine-harvester', 24, -22, H); }
  if (v === 'orchard') ctx.scatter(30, [['tree', 'cherry'], ['tree', 'apple'], ['tree', 'pear']].filter(Boolean), (x, z) => z < -14 && z > -36 || z > 24, { rad: 3, fit: 4.5 });
  if (v === 'dairy' || v === 'ranch') {
    fence(16, -32, 50, -32); fence(50, -32, 50, -12); fence(50, -12, 16, -12); fence(16, -12, 16, -32);
    const herd = v === 'dairy' ? [['cattle', 'holstein'], ['cattle', 'jersey']] : [['cattle', 'longhorn'], ['horse', 'bay'], ['horse', 'chestnut']];
    ctx.scatter(9, herd, (x, z) => x > 19 && x < 47 && z > -29 && z < -15, { rad: 1.8 });
    if (v === 'ranch') ctx.put('horse', 'palomino', 0, -20, 1.2);
  }
  ctx.scatter(8, [['poultry', 'hen'], ['poultry', 'rooster'], ['pig', 'domestic'], ['sheep-goat', 'merino']], (x, z) => x > -20 && x < 14 && z > -12 && z < 0, { rad: 1 });
  ctx.scatter(14, TREES.temperate, (x, z) => Math.abs(x) > 50 || Math.abs(z) > 46, { rad: 3, fit: 5 });
  ctx.put('person', 'farmer', -2, -2, 2.4);
  return ctx.done();
}

export const MAP_FOREST_VARIANTS = { pine: {}, autumn: {}, birch: {}, 'old-growth': {} };
export async function createMapForest(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_FOREST_VARIANTS));
  const ctx = makeMap(`map-forest-${v}`, o.seed ?? 5, { size: 100 });
  terrain(ctx, { biome: v === 'autumn' ? 'autumn' : 'forest', hills: 12, flat: 0.12, dip: (x, z) => -2 * Math.max(0, 1 - Math.abs(z + x * 0.3) / 4) });
  water(ctx, { y: -0.6, w: 6, d: 200, x: 0, z: 0, color: '#4a7a80' }).rotation.z = -0.29;
  const trees = { pine: TREES.pine, autumn: [['tree', 'maple-autumn'], ['tree', 'oak-autumn'], ['tree', 'beech-autumn'], ['tree', 'maple']], birch: [['tree', 'birch'], ['tree', 'birch'], ['tree', 'aspen']], 'old-growth': [['tree', 'oak'], ['tree', 'redwood'], ['tree', 'elm'], ['tree', 'beech']] }[v];
  ctx.put('ranger-station', 'cabin', -18, 12, 0.4, { fit: 10 });
  ctx.put('footbridge', 'arched', 0, 0, -0.29 + H, { fit: 10 });
  ctx.put('campsite', 'camp', 22, -16, 0, { fit: 14 });
  ctx.scatter(70, trees, (x, z) => Math.abs(z + x * 0.3) > 6, { rad: 2.2, fit: 6 });
  ctx.scatter(16, [['bush', 'fern'], ['bush', 'round'], ['rock', 'mossy'], ['log', 'log'], ['log', 'stump'], ['mushroom', 'cluster']], (x, z) => Math.abs(z + x * 0.3) > 5, { rad: 1 });
  ctx.scatter(6, [['deer', 'white-tailed'], ['deer', 'red-deer'], ['wild-canine', 'fox'], ['bear', 'brown-bear'], ['small-mammal', 'squirrel']], (x, z) => Math.abs(z + x * 0.3) > 6, { rad: 1.5 });
  ctx.put('person', 'hiker', -6, 8, 1);
  return ctx.done();
}

export const MAP_DESERT_VARIANTS = { dunes: {}, oasis: {}, canyon: {}, 'cactus-flats': {} };
export async function createMapDesert(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_DESERT_VARIANTS));
  const ctx = makeMap(`map-desert-${v}`, o.seed ?? 6, { size: 110 });
  terrain(ctx, { biome: v === 'canyon' ? 'rock' : 'desert', hills: v === 'canyon' ? 26 : v === 'dunes' ? 10 : 5, flat: v === 'canyon' ? 0.18 : 0.2, dip: v === 'oasis' ? (x, z) => -2 * Math.max(0, 1 - Math.hypot(x, z) / 14) : null });
  if (v === 'oasis') {
    water(ctx, { y: -0.4, w: 26, d: 26, color: '#2f8a8a' });
    ctx.scatter(14, [['tree', 'palm'], ['tree', 'date-palm']], (x, z) => { const d = Math.hypot(x, z); return d > 13 && d < 22; }, { rad: 2, fit: 5 });
    ctx.put('tent', 'dome', 26, 10, 0.3, { fit: 6 });
    ctx.scatter(5, [['camel', 'dromedary'], ['camel', 'bactrian']], (x, z) => Math.hypot(x, z) > 18 && Math.hypot(x, z) < 34, { rad: 2 });
  }
  if (v === 'canyon') { road(ctx, -60, -6, 60, 8, { w: 6, kind: 'dirt' }); ctx.put('misc-vehicle', 'atv', 4, 2, 0.2); ctx.put('car', 'suv', -14, -3, H); }
  if (v === 'cactus-flats') { road(ctx, -70, 0, 70, 0, { w: 7, kind: 'highway' }); ctx.put('gas-station', 'retro', 14, 16, P, { fit: 20 }); ctx.put('truck', 'semi', -10, -1.8, H); }
  ctx.scatter(v === 'dunes' ? 8 : 28, [['cactus', 'saguaro'], ['cactus', 'barrel'], ['cactus', 'prickly-pear'], ['cactus', 'organ-pipe'], ['succulent', 'agave'], ['rock', 'boulder'], ['grass', 'clump']], () => true, { rad: 2, fit: 4 });
  ctx.scatter(4, [['reptile', 'rattlesnake'], ['wild-canine', 'coyote'], ['wild-canine', 'fennec'], ['invertebrate', 'scorpion']], () => true, { rad: 1 });
  return ctx.done();
}

export const MAP_ISLAND_VARIANTS = { tropical: {}, atoll: {}, 'pirate-cove': {}, 'castaway': {} };
export async function createMapIsland(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_ISLAND_VARIANTS));
  const ctx = makeMap(`map-island-${v}`, o.seed ?? 7, { size: 110 });
  const R = v === 'castaway' ? 22 : v === 'atoll' ? 40 : 38;
  const isl = (x, z) => { const d = Math.hypot(x, z); return v === 'atoll' ? Math.abs(d - R) : d; };
  terrain(ctx, { biome: 'tropical', hills: v === 'atoll' ? 0.5 : 4, flat: 0, flatFn: (x, z) => isl(x, z) < (v === 'atoll' ? 6 : R * 0.6), dip: (x, z) => 1.2 - 8 * THREE.MathUtils.smoothstep(isl(x, z), v === 'atoll' ? 6 : R * 0.85, v === 'atoll' ? 11 : R + 5) });
  water(ctx, { y: 0.4, w: 165, d: 165, color: '#2f9aa8' });
  const land = (x, z) => isl(x, z) < (v === 'atoll' ? 5 : R * 0.7);
  ctx.scatter(v === 'castaway' ? 6 : 22, [['tree', 'palm'], ['tree', 'coconut-palm'], ['bush', 'fern']], land, { rad: 2.4, fit: 5 });
  if (v === 'tropical') { ctx.put('beach-set', 'beach-hut', 10, 22, P, { fit: 8 }); ctx.put('beach-set', 'umbrella', -6, 26, 0); ctx.put('boardwalk', 'pier', 0, 40, 0, { fit: 18 }); ctx.put('boat', 'speedboat', 6, 48, H, { y: 0.4 }); }
  if (v === 'pirate-cove') { ctx.put('boat', 'sailboat', 0, 52, H, { y: 0.4, scale: 1.6 }); ctx.put('treasure-chest', 'banded', -4, 6, 0.4); ctx.put('medieval-cart', 'barrel-cart', 8, 4, 1); ctx.put('heraldic-banner', 'flag', -8, -2, 0); ctx.put('campsite', 'fire-ring', 2, -6, 0); }
  if (v === 'castaway') { ctx.put('campsite', 'fire-ring', 2, 4, 0); ctx.put('boat', 'rowboat', 10, 26, 1, { y: 0.4 }); ctx.put('person', 'man', 0, 0, 0.5); }
  if (v === 'atoll') { ctx.put('lighthouse', 'striped', R, 0, 0, { fit: 8 }); ctx.scatter(10, [['reef', 'brain-coral'], ['reef', 'table-coral'], ['reef', 'staghorn']], (x, z) => Math.hypot(x, z) < R - 12, { rad: 2, fit: 3 }); }
  ctx.scatter(5, [['invertebrate', 'crab'], ['invertebrate', 'hermit-crab'], ['water-bird', 'white-duck']], land, { rad: 1 });
  return ctx.done();
}

export const MAP_MOUNTAIN_VARIANTS = { pass: {}, lake: {}, 'ski-resort': {}, quarry: {} };
export async function createMapMountain(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_MOUNTAIN_VARIANTS));
  const ctx = makeMap(`map-mountain-${v}`, o.seed ?? 8, { size: 120 });
  const snowy = v === 'ski-resort';
  terrain(ctx, { biome: snowy ? 'snow' : 'rock', hills: 40, flat: 0.2, dip: v === 'lake' ? (x, z) => -3 * Math.max(0, 1 - Math.hypot(x + 10, z) / 20) : null });
  if (v === 'lake') { water(ctx, { y: -0.4, w: 44, d: 44, x: -10, color: '#2f6a80' }); ctx.put('boat', 'kayak', -8, 4, 1, { y: -0.4 }); ctx.put('house', 'cottage', 22, 8, -H, { fit: 12 }); }
  if (v === 'pass') { road(ctx, -70, -8, 70, 10, { w: 7, kind: 'highway' }); ctx.put('truck', 'tanker', -20, -4, H); ctx.put('car', 'suv', 18, 6, -H); ctx.put('guard-rail', 'w-beam', 0, -4, H, { claim: false }); }
  if (v === 'ski-resort') { ctx.put('hotel', 'resort-winter', 0, -10, 0, { fit: 30 }); ctx.scatter(8, [['person', 'man'], ['person', 'woman']], () => true, { rad: 1 }); ctx.put('misc-vehicle', 'snowmobile', 12, 10, 0.5); }
  if (v === 'quarry') { ctx.put('construction', 'excavator', -6, 0, 0.6); ctx.put('truck', 'dump', 10, 6, -0.8); ctx.put('construction', 'wheel-loader', 4, -12, 2); ctx.scatter(10, [['rock', 'boulder'], ['rock', 'granite']], (x, z) => Math.hypot(x, z) < 30, { rad: 2.5, fit: 4 }); }
  ctx.scatter(30, snowy ? [['tree', 'pine-winter'], ['tree', 'spruce-winter']] : TREES.pine, (x, z) => Math.hypot(x, z) > 20, { rad: 2.5, fit: 6 });
  ctx.scatter(4, [['sheep-goat', 'bighorn'], ['sheep-goat', 'alpine-goat'], ['bird-of-prey', 'golden-eagle']], () => true, { rad: 1.5 });
  return ctx.done();
}

export const MAP_BEACH_VARIANTS = { resort: {}, boardwalk: {}, surf: {}, 'quiet-cove': {} };
export async function createMapBeach(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_BEACH_VARIANTS));
  const ctx = makeMap(`map-beach-${v}`, o.seed ?? 9, { size: 110 });
  terrain(ctx, { biome: 'sand', hills: 6, flat: 0.3, dip: (x, z) => (z > 10 ? -5 * THREE.MathUtils.smoothstep(z, 10, 40) : 0) });
  water(ctx, { y: -0.35, w: 300, d: 120, z: 75, color: '#2f9ab0' });
  if (v === 'resort') { ctx.put('hotel', 'resort', 0, -34, 0, { fit: 40 }); pad(ctx, 0, -12, 30, 10, { color: '#d9d3c6' }); }
  if (v === 'boardwalk') { for (let x = -45; x <= 45; x += 15) ctx.put('boardwalk', 'straight', x, -6, H, { fit: 15, claim: false }); ctx.put('food-cart', 'ice-cream', -10, -12, 0); ctx.put('food-cart', 'hot-dog', 12, -12, 0); ctx.put('kiosk', 'food', 26, -14, 0); }
  if (v === 'surf') { ctx.put('beach-set', 'lifeguard-tower', 0, 4, P, { fit: 6 }); ctx.scatter(6, [['board-sport', 'surfboard'], ['board-sport', 'longboard-surf']], (x, z) => z > -4 && z < 8, { rad: 1 }); ctx.put('van', 'camper', -20, -24, 0.4); }
  ctx.scatter(v === 'quiet-cove' ? 4 : 14, [['umbrella', 'beach'], ['beach-set', 'lounger'], ['beach-set', 'umbrella']], (x, z) => z > -8 && z < 8, { rad: 2 });
  ctx.scatter(v === 'quiet-cove' ? 3 : 12, PEOPLE, (x, z) => z > -10 && z < 10, { rad: 1 });
  ctx.scatter(14, [['tree', 'palm'], ['tree', 'coconut-palm'], ['grass', 'pampas']], (x, z) => z < -14, { rad: 2.5, fit: 5 });
  ctx.put('boat', ctx.pick(['sailboat', 'yacht', 'speedboat']), 20, 45, H, { y: -0.35 });
  return ctx.done();
}

export const MAP_HARBOR_VARIANTS = { fishing: {}, 'container-port': {}, marina: {}, ferry: {} };
export async function createMapHarbor(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_HARBOR_VARIANTS));
  const ctx = makeMap(`map-harbor-${v}`, o.seed ?? 10, { size: 120 });
  terrain(ctx, { biome: 'grass', hills: 4, flat: 0.5, dip: (x, z) => (z > 8 ? -6 : 0) });
  water(ctx, { y: -1, w: 300, d: 140, z: 78, color: '#2f5f70' });
  pad(ctx, 0, 0, 120, 16, { color: '#8f8d88', h: 0.6, name: 'quay' });
  if (v === 'container-port') {
    for (let i = 0; i < 18; i++) ctx.put('crate', 'shipping', -50 + (i % 6) * 7, -14 - Math.floor(i / 6) * 3.2, 0, { claim: false, y: 0 });
    ctx.put('truck', 'semi', 20, -14, H); ctx.put('industrial', 'forklift', 6, -8, 0.4); ctx.put('boat', 'yacht', 0, 30, H, { y: -1, scale: 2.4 });
    ctx.put('warehouse', 'standard', 30, -30, 0, { fit: 30 });
  } else if (v === 'marina') {
    for (let x = -40; x <= 40; x += 16) { ctx.put('boardwalk', 'pier', x, 18, 0, { fit: 14, y: 0.3 }); ctx.put('boat', ctx.pick(['yacht', 'sailboat', 'speedboat']), x + 5, 22, 0, { y: -1 }); }
    ctx.put('restaurant', 'sushi', -20, -20, 0, { fit: 16 }); ctx.put('hotel', 'boutique', 20, -22, 0, { fit: 18 });
  } else if (v === 'ferry') {
    ctx.put('train-station', 'modern', 0, -24, 0, { fit: 30 }); ctx.put('boat', 'yacht', -20, 26, H, { y: -1, scale: 2.2 });
    ctx.scatter(8, CARS, (x, z) => z < -6 && z > -14, { rad: 2.5 }); ctx.put('bus', 'coach', 24, -10, H);
  } else {
    for (let i = 0; i < 4; i++) ctx.put('boat', 'fishing', -36 + i * 22, 18, H, { y: -1 });
    ctx.put('warehouse', 'cold', -24, -26, 0, { fit: 22 }); ctx.put('shop', 'restaurant', 18, -20, 0, { fit: 14 });
    ctx.scatter(10, [['crate', 'wooden'], ['barrel', 'wooden'], ['pallet', 'euro']], (x, z) => Math.abs(z) < 6, { rad: 1.2 });
  }
  ctx.put('lighthouse', 'classic', 56, 4, 0, { fit: 8 });
  ctx.scatter(10, PEOPLE, (x, z) => Math.abs(z) < 7, { rad: 1 });
  ctx.scatter(6, [['water-bird', 'mallard'], ['bird', 'crow']], (x, z) => Math.abs(z) < 7, { rad: 1 });
  return ctx.done();
}

export const MAP_INDUSTRIAL_VARIANTS = { factory: {}, 'power-plant': {}, logistics: {}, junkyard: {} };
export async function createMapIndustrial(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_INDUSTRIAL_VARIANTS));
  const ctx = makeMap(`map-industrial-${v}`, o.seed ?? 11, { size: 120 });
  terrain(ctx, { biome: 'rock', hills: 4, flat: 0.5 });
  road(ctx, -70, 0, 70, 0, { w: 8, kind: 'highway' });
  pad(ctx, -20, -26, 70, 36, { color: '#8a8a86' });
  pad(ctx, 22, 26, 60, 34, { color: '#8a8a86' });
  const main = { factory: [['factory', 'plant'], ['factory', 'brick-mill'], ['factory', 'brewery']], 'power-plant': [['power-plant', 'cooling'], ['power-plant', 'coal'], ['power-plant', 'substation']], logistics: [['warehouse', 'standard'], ['warehouse', 'cold']], junkyard: [['warehouse', 'standard']] }[v];
  ctx.put(...main[0], -26, -28, 0, { fit: 34 });
  if (main[1]) ctx.put(...main[1], 20, 28, P, { fit: 28 });
  if (main[2]) ctx.put(...main[2], 8, -30, 0, { fit: 20 });
  if (v === 'logistics') { for (let i = 0; i < 4; i++) ctx.put('truck', 'semi', -4 + i * 6, 14, 0); ctx.put('industrial', 'forklift', -10, -10, 0.4); }
  if (v === 'junkyard') ctx.scatter(26, [['car', 'sedan-damaged'], ['car', 'hatchback-rusty'], ['oil-drum', 'stack'], ['crate', 'shipping'], ['dumpster', 'roll-off'], ['pallet', 'euro']], (x, z) => z > 10 || (z < -12 && x > -2), { rad: 2.6 });
  ctx.scatter(10, [['barrel', 'steel-drum'], ['pallet', 'euro'], ['traffic-cone', 'cone'], ['crate', 'wooden']], (x, z) => Math.abs(z) > 6 && Math.abs(z) < 40, { rad: 1.2 });
  ctx.put('power-pole', 'transformer', 40, -6, 0, { claim: false });
  ctx.put('truck', 'box', -30, -3, H, { claim: false });
  ctx.scatter(6, [['person', 'construction-worker'], ['person', 'man']], (x, z) => Math.abs(z) > 6 && Math.abs(z) < 40, { rad: 1 });
  return ctx.done();
}

export const MAP_AIRPORT_VARIANTS = { regional: {}, international: {}, airstrip: {}, heliport: {} };
export async function createMapAirport(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_AIRPORT_VARIANTS));
  const ctx = makeMap(`map-airport-${v}`, o.seed ?? 12, { size: 160 });
  terrain(ctx, { biome: 'meadow', hills: 3, flat: 0.6 });
  if (v === 'heliport') {
    for (const x of [-20, 0, 20]) landingPad(ctx, x, 0, 8);
    ctx.put('helicopter', 'civil', -20, 0, 0.4, { y: 0.3 }); ctx.put('helicopter', 'medical', 20, 0, -0.3, { y: 0.3 });
    ctx.put('airport', 'control-tower', 0, -30, 0, { fit: 16 }); ctx.put('windsock', 'pole', 32, 12, 0);
    return ctx.done();
  }
  const long = v === 'international';
  road(ctx, -80, 30, 80, 30, { w: v === 'airstrip' ? 18 : 30, kind: v === 'airstrip' ? 'dirt' : 'highway' }); // runway
  if (v !== 'airstrip') for (let x = -76; x <= 76; x += 8) for (const s of [-1, 1]) ctx.put('runway-light', 'edge', x, 30 + s * 16, 0, { claim: false });
  road(ctx, -30, 30, -30, -2, { w: 12, kind: 'highway', lines: false }); // taxiway
  if (v === 'airstrip') {
    ctx.put('airport', 'hangar', -20, -14, 0, { fit: 26 }); ctx.put('airplane', 'prop', -4, 2, -0.6); ctx.put('airplane', 'seaplane', 14, 4, -0.9); ctx.put('windsock', 'pole', 24, 16, 0);
  } else {
    pad(ctx, 10, -12, 110, 26, { color: '#9a9a96' });
    ctx.put('airport', 'terminal', 10, -40, 0, { fit: long ? 80 : 54 });
    ctx.put('airport', 'control-tower', 58, -30, 0, { fit: 16 });
    const planes = long ? [['airplane', 'jet'], ['airplane', 'jet'], ['airplane', 'cargo']] : [['airplane', 'private-jet'], ['airplane', 'prop']];
    planes.forEach((pl, i) => ctx.put(...pl, -14 + i * 30, -8, P, { fit: 28 }));
    ctx.put('baggage-cart', 'train', 4, 2, H); ctx.put('industrial', 'airport-tug', -2, 6, 0.3); ctx.put('bus', 'airport', 30, 4, H);
    ctx.put('windsock', 'lit', 70, 14, 0);
  }
  return ctx.done();
}

export const MAP_MILITARY_VARIANTS = { outpost: {}, airfield: {}, checkpoint: {}, 'training-ground': {} };
export async function createMapMilitary(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_MILITARY_VARIANTS));
  const ctx = makeMap(`map-military-${v}`, o.seed ?? 13, { size: 120 });
  terrain(ctx, { biome: v === 'outpost' ? 'desert' : 'grass', hills: 6, flat: 0.45 });
  for (let k = 0; k < 4; k++) {
    const a = k * H;
    for (let i = -3; i <= 3; i++) ctx.put('hesco-barrier', 'row', Math.cos(a) * 40 + Math.sin(a) * i * 10, Math.sin(a) * 40 - Math.cos(a) * i * 10, a + H, { claim: false, fit: 10 });
  }
  ctx.put('watch-tower', 'wooden', 38, 38, 0); ctx.put('watch-tower', 'steel', -38, -38, 0);
  ctx.put('military-tent', 'command', -14, -10, 0, { fit: 10 }); ctx.put('military-tent', 'field-hospital', 12, -12, 0, { fit: 10 });
  ctx.put('field-generator', 'trailer', 0, -22, 0); ctx.put('radar-trailer', 'rotating-array', -22, 18, 0);
  if (v === 'airfield') { road(ctx, -60, 20, 60, 20, { w: 18, kind: 'highway' }); ctx.put('helicopter', 'military', -14, 6, 0.4); ctx.put('airplane', 'cargo', 18, 20, H, { fit: 30 }); }
  if (v === 'checkpoint') { road(ctx, 0, -70, 0, 70, { w: 7 }); ctx.put('barrier-gate', 'checkpoint', 0, 38, 0, { claim: false }); ctx.put('utility-4x4', 'jeep', 3, 26, 0); ctx.put('military-truck', 'cargo', -3, 50, P); }
  if (v === 'training-ground') { ctx.scatter(8, [['training-dummy', 'straw'], ['training-dummy', 'archery-target'], ['sandbag-wall', 'curved']], (x, z) => z > 6 && Math.abs(x) < 30, { rad: 2 }); ctx.put('tank', 'mbt', 20, 18, -0.6); }
  if (v === 'outpost') { ctx.put('apc', 'wheeled-8x8', 16, 14, -0.4); ctx.put('utility-4x4', 'pickup', -10, 16, 0.6); }
  ctx.scatter(12, [['military-crate', 'supply-crate'], ['jerry-can', 'rack'], ['oil-drum', 'pallet'], ['sandbag-wall', 'straight'], ['camo-net', 'small-hide']], (x, z) => Math.hypot(x, z) < 34, { rad: 2 });
  ctx.scatter(8, [['person', 'soldier'], ['person', 'man']], (x, z) => Math.hypot(x, z) < 30, { rad: 1 });
  return ctx.done();
}

export const MAP_RACETRACK_VARIANTS = { oval: {}, circuit: {}, karting: {}, rally: {} };
export async function createMapRacetrack(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_RACETRACK_VARIANTS));
  const ctx = makeMap(`map-race-${v}`, o.seed ?? 14, { size: 140 });
  terrain(ctx, { biome: v === 'rally' ? 'desert' : 'meadow', hills: 5, flat: 0.55 });
  const k = v === 'karting' ? 0.45 : 1;
  trackLoop(ctx, { sx: 70 * k, r: 26 * k, w: (v === 'karting' ? 7 : 13), color: v === 'rally' ? '#9a8466' : '#3d3f43', kerb: v !== 'rally' });
  ctx.put('bleachers', 'stadium-seats', 0, -26 * k - 16, 0, { fit: 30 * k });
  ctx.put('scoreboard', 'digital', 30 * k, -26 * k - 16, 0, { fit: 8 });
  const racers = v === 'karting' ? [['misc-vehicle', 'go-kart']] : v === 'rally' ? [['car', 'suv'], ['car', 'hatchback']] : [['car', 'sports'], ['car', 'coupe'], ['car', 'supercar']];
  for (let i = 0; i < 6; i++) ctx.put(...racers[i % racers.length], -20 * k + i * 6 * k, 26 * k + (i % 2 ? 2 : -2), H, { claim: false });
  ctx.put('flag-pole', 'single', -6, -26 * k - 4, 0, { claim: false });
  ctx.scatter(10, [['traffic-cone', 'cone'], ['barrier', 'water-filled'], ['tent', 'a-frame']], (x, z) => Math.abs(z) > 26 * k + 10, { rad: 2 });
  ctx.scatter(10, PEOPLE, (x, z) => Math.abs(z) > 26 * k + 8, { rad: 1 });
  ctx.scatter(16, TREES.temperate, (x, z) => Math.abs(x) > 62 || Math.abs(z) > 52, { rad: 3, fit: 6 });
  return ctx.done();
}

export const MAP_STADIUM_VARIANTS = { soccer: {}, ballpark: {}, arena: {}, festival: {} };
export async function createMapStadium(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_STADIUM_VARIANTS));
  const ctx = makeMap(`map-stadium-${v}`, o.seed ?? 15, { size: 140 });
  terrain(ctx, { biome: 'grass', hills: 2, flat: 0.6 });
  if (v === 'festival') {
    pad(ctx, 0, 0, 80, 60, { color: '#7f9a4a' });
    ctx.put('bandstand', 'shell', 0, -24, 0, { fit: 18 });
    for (let i = 0; i < 6; i++) ctx.put('market-stall', ctx.pick(['canopy', 'fruit', 'wooden']), -30 + i * 12, 22, P, { fit: 5 });
    ctx.put('tent', 'circus', 32, -6, 0, { fit: 20 });
    ctx.scatter(30, PEOPLE, (x, z) => Math.abs(x) < 36 && Math.abs(z) < 18, { rad: 1 });
    ctx.scatter(6, [['food-cart', 'hot-dog'], ['food-cart', 'coffee'], ['porta-potty', 'standard']], (x, z) => Math.abs(x) < 38, { rad: 2 });
  } else {
    ctx.put('stadium', v === 'ballpark' ? 'ballpark' : 'arena', 0, 0, 0, { fit: 90 });
    road(ctx, -75, 58, 75, 58, { w: 9 });
    pad(ctx, -40, 70, 50, 20, { color: '#4a4c50' }); bays(ctx, -40, 70, 14);
    for (let i = 0; i < 10; i++) ctx.put(...ctx.pick(CARS), -55 + i * 3.3, 70, 0, { claim: false });
    ctx.put('bus', 'coach', 30, 56, H, { claim: false });
    ctx.scatter(18, PEOPLE, (x, z) => z > 48 && z < 66, { rad: 1 });
  }
  ctx.scatter(12, TREES.temperate, (x, z) => Math.abs(x) > 56 || Math.abs(z) > 56, { rad: 3, fit: 6 });
  return ctx.done();
}

export const MAP_PARK_VARIANTS = { 'city-park': {}, playground: {}, botanical: {}, 'lake-park': {} };
export async function createMapPark(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_PARK_VARIANTS));
  const ctx = makeMap(`map-park-${v}`, o.seed ?? 16, { size: 100 });
  terrain(ctx, { biome: 'meadow', hills: 6, flat: 0.4, dip: v === 'lake-park' ? (x, z) => -2.5 * Math.max(0, 1 - Math.hypot(x - 10, z - 6) / 18) : null });
  if (v === 'lake-park') { water(ctx, { y: -0.3, w: 34, d: 34, x: 10, z: 6 }); ctx.put('footbridge', 'arched', 10, -10, 0, { fit: 10 }); ctx.scatter(5, [['water-bird', 'swan'], ['water-bird', 'mallard']], (x, z) => Math.hypot(x - 10, z - 6) < 12, { rad: 1.5 }); }
  for (const [x0, z0, x1, z1] of [[-48, 0, 48, 0], [0, -48, 0, 48]]) for (let t = 0; t < 1; t += 0.125) ctx.put('park-path', 'straight', x0 + (x1 - x0) * (t + 0.0625), z0 + (z1 - z0) * (t + 0.0625), x1 !== x0 ? H : 0, { fit: 12, claim: true });
  ctx.put('park-gate', 'iron-gates', 0, 46, 0, { fit: 12 });
  ctx.put(v === 'botanical' ? 'greenhouse' : 'gazebo', v === 'botanical' ? 'conservatory' : 'octagonal', -22, -22, 0.3, { fit: 16 });
  if (v === 'playground') { ctx.put('playground', 'climbing-frame', 22, 22, 0, { fit: 12 }); ctx.put('playground', 'swings', 22, -20, 0, { fit: 10 }); ctx.put('playground', 'slide', -22, 22, 0, { fit: 10 }); ctx.scatter(8, [['person', 'boy'], ['person', 'girl']], () => true, { rad: 1 }); }
  if (v === 'botanical') ctx.scatter(26, [['flower-bed', 'round'], ['flower-bed', 'island'], ['flower', 'rose'], ['flower', 'tulip'], ['flower', 'lavender'], ['bush', 'hydrangea']], () => true, { rad: 2, fit: 5 });
  if (v === 'city-park') { ctx.put('plaza-fountain', 'tiered', 0, 0, 0, { fit: 10 }); ctx.put('statue', 'figure', 22, 22, 0); ctx.put('bandstand', 'octagonal', 22, -22, 0, { fit: 12 }); }
  ctx.scatter(12, [['bench', 'park'], ['trash-can', 'park'], ['streetlight', 'classic']], (x, z) => Math.abs(x) < 6 || Math.abs(z) < 6, { rad: 1.5 });
  ctx.scatter(26, TREES.temperate, () => true, { rad: 3, fit: 6 });
  ctx.scatter(12, PEOPLE, () => true, { rad: 1 });
  ctx.scatter(4, [['dog', 'dalmatian'], ['dog', 'husky'], ['small-mammal', 'squirrel']], () => true, { rad: 1 });
  return ctx.done();
}

export const MAP_CAMPSITE_VARIANTS = { 'forest-camp': {}, lakeside: {}, 'desert-camp': {}, 'winter-camp': {} };
export async function createMapCampsite(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_CAMPSITE_VARIANTS));
  const ctx = makeMap(`map-camp-${v}`, o.seed ?? 17, { size: 90 });
  const biome = { 'forest-camp': 'forest', lakeside: 'grass', 'desert-camp': 'desert', 'winter-camp': 'snow' }[v];
  terrain(ctx, { biome, hills: 10, flat: 0.32, dip: v === 'lakeside' ? (x, z) => (z > 18 ? -3 * THREE.MathUtils.smoothstep(z, 18, 30) : 0) : null });
  if (v === 'lakeside') { water(ctx, { y: -0.4, w: 200, d: 60, z: 55 }); ctx.put('boat', 'kayak', 6, 26, 0.4, { y: -0.4 }); ctx.put('boardwalk', 'pier', -10, 24, 0, { fit: 12 }); }
  ctx.put('campsite', 'fire-ring', 0, 0, 0); ctx.put('campsite', 'log-seats', 0, 4, 0);
  const tents = v === 'winter-camp' ? [['military-tent', 'dome'], ['tent', 'dome']] : [['campsite', 'dome-tent'], ['campsite', 'ridge-tent'], ['tent', 'a-frame']];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * P * 2; ctx.put(...tents[i % tents.length], Math.cos(a) * 12, Math.sin(a) * 12, -a + H, { fit: 5 }); }
  ctx.put('van', 'camper', -22, -8, 0.8); ctx.put('picnic-table', 'classic', 8, -10, 0.3);
  if (v === 'desert-camp') ctx.put('camel', 'dromedary', 20, 8, 1);
  ctx.scatter(30, v === 'desert-camp' ? [['cactus', 'saguaro'], ['rock', 'boulder']] : v === 'winter-camp' ? [['tree', 'pine-winter'], ['tree', 'spruce-winter']] : TREES.pine, (x, z) => Math.hypot(x, z) > 18, { rad: 2.5, fit: 6 });
  ctx.scatter(6, PEOPLE, (x, z) => Math.hypot(x, z) < 16, { rad: 1 });
  return ctx.done();
}

export const MAP_MEDIEVAL_VARIANTS = { castle: {}, market: {}, walled: {}, ruined: {} };
export async function createMapMedieval(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_MEDIEVAL_VARIANTS));
  const ctx = makeMap(`map-medieval-${v}`, o.seed ?? 18, { size: 120 });
  terrain(ctx, { biome: 'grass', hills: 9, flat: 0.42 });
  const R = 38;
  for (let k = 0; k < 4; k++) {
    const a = k * H + P / 4;
    ctx.put('castle-tower', v === 'ruined' ? 'watchtower' : 'round', Math.cos(a) * R * 1.41, Math.sin(a) * R * 1.41, 0, { fit: 8 });
  }
  for (const [x0, z0, x1, z1] of [[-R, -R, R, -R], [R, -R, R, R], [R, R, -R, R], [-R, R, -R, -R]]) {
    const n = 6;
    for (let i = 0; i < n; i++) if (!(v === 'ruined' && i % 3 === 1) && !(z0 === R && z1 === R && i === 3)) ctx.put('castle-wall', 'straight', x0 + (x1 - x0) * (i + 0.5) / n, z0 + (z1 - z0) * (i + 0.5) / n, Math.atan2(x1 - x0, z1 - z0) + H, { claim: false, fit: 2 * R / n + 0.4 });
  }
  ctx.put('castle-gate', 'portcullis', 0, R, 0, { fit: 12 });
  if (v === 'castle' || v === 'walled') ctx.put('castle', v === 'castle' ? 'keep' : 'fortress', 0, -14, 0, { fit: 30 });
  if (v === 'ruined') ctx.scatter(10, [['ancient-ruins', 'broken-tower'], ['ancient-ruins', 'brick-wall'], ['ancient-ruins', 'foundations'], ['rock', 'mossy']], (x, z) => Math.hypot(x, z) < 32, { rad: 4, fit: 8 });
  if (v === 'market' || v === 'walled') {
    for (let i = 0; i < 6; i++) ctx.put('market-stall', 'wooden', -20 + i * 8, 14, P, { fit: 5 });
    ctx.put('stone-well', 'open-pulley', 0, 22, 0);
    for (const [x, z, ry] of [[-26, 0, H], [26, 0, -H], [-26, -24, H], [26, -24, -H]]) ctx.put('house', 'cottage', x, z, ry, { fit: 11 });
  }
  ctx.scatter(8, [['medieval-cart', 'hay-wagon'], ['medieval-cart', 'hand-cart'], ['heraldic-banner', 'flag'], ['weapon-rack', 'spear-rack'], ['barrel', 'wooden']], (x, z) => Math.hypot(x, z) < 32, { rad: 2 });
  ctx.scatter(8, [['horse', 'black'], ['horse', 'grey'], ['poultry', 'hen'], ['pig', 'domestic']], (x, z) => Math.hypot(x, z) < 32, { rad: 1.5 });
  ctx.scatter(8, [['person', 'knight'], ['person', 'man'], ['person', 'woman']], (x, z) => Math.hypot(x, z) < 30, { rad: 1 });
  ctx.scatter(18, TREES.temperate, (x, z) => Math.max(Math.abs(x), Math.abs(z)) > R + 8, { rad: 3, fit: 6 });
  return ctx.done();
}

export const MAP_ANCIENT_VARIANTS = { greek: {}, egyptian: {}, roman: {}, mesoamerican: {} };
export async function createMapAncient(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_ANCIENT_VARIANTS));
  const ctx = makeMap(`map-ancient-${v}`, o.seed ?? 19, { size: 120 });
  terrain(ctx, { biome: v === 'egyptian' ? 'desert' : v === 'mesoamerican' ? 'forest' : 'rock', hills: 8, flat: 0.45 });
  if (v === 'egyptian') {
    ctx.put('pyramid', 'smooth', -20, -22, 0, { fit: 40 }); ctx.put('pyramid', 'step', 30, -10, 0, { fit: 22 });
    ctx.put('obelisk', 'twin', 0, 18, 0, { fit: 8 }); ctx.put('sarcophagus', 'anthropoid', 8, 22, 0.3);
    ctx.scatter(5, [['camel', 'dromedary']], (x, z) => z > 10, { rad: 2 }); ctx.scatter(8, [['tree', 'palm']], (x, z) => z > 26, { rad: 2.5, fit: 5 });
  } else if (v === 'mesoamerican') {
    ctx.put('pyramid', 'mesoamerican', 0, -14, 0, { fit: 40 });
    ctx.scatter(10, [['ancient-ruins', 'foundations'], ['ancient-ruins', 'brick-wall'], ['statue', 'figure']], (x, z) => z > 10 && Math.abs(x) < 40, { rad: 3, fit: 6 });
    ctx.scatter(30, [['tree', 'palm'], ['bush', 'fern'], ['tree', 'oak']], (x, z) => Math.hypot(x, z) > 34, { rad: 2.5, fit: 6 });
  } else {
    ctx.put('temple-piece', v === 'greek' ? 'peripteral-temple' : 'prostyle-temple', 0, -16, 0, { fit: 36 });
    ctx.put(v === 'roman' ? 'roman-arch' : 'temple-piece', v === 'roman' ? 'triumphal' : 'tholos', 0, 24, 0, { fit: 16 });
    pad(ctx, 0, 6, 40, 22, { color: '#d8d0bf' });
    ctx.scatter(12, [['classical-column', 'doric'], ['classical-column', 'ionic'], ['statue', 'bust'], ['amphora', 'transport'], ['ancient-ruins', 'colonnade']], (x, z) => Math.abs(x) < 34 && z > -2, { rad: 2.2, fit: 5 });
    ctx.scatter(14, [['tree', 'olive'], ['tree', 'cypress']], (x, z) => Math.hypot(x, z) > 38, { rad: 2.5, fit: 5 });
  }
  ctx.scatter(6, PEOPLE, (x, z) => Math.hypot(x, z) < 30, { rad: 1 });
  return ctx.done();
}

export const MAP_SCIFI_VARIANTS = { 'mars-base': {}, 'moon-base': {}, 'ice-planet': {}, spaceport: {} };
export async function createMapScifi(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_SCIFI_VARIANTS));
  const ctx = makeMap(`map-scifi-${v}`, o.seed ?? 20, { size: 120 });
  terrain(ctx, { biome: { 'mars-base': 'mars', 'moon-base': 'moon', 'ice-planet': 'snow', spaceport: 'desert' }[v], hills: v === 'moon-base' ? 6 : 14, flat: 0.4, dip: v === 'moon-base' ? (x, z) => -3 * Math.max(0, 1 - Math.hypot(x - 40, z + 30) / 12) - 2 * Math.max(0, 1 - Math.hypot(x + 44, z - 30) / 9) : null });
  dome(ctx, 0, 0, 11);
  habModule(ctx, 18, 4, 0.2); habModule(ctx, -18, 6, -0.3); habModule(ctx, 4, -20, H);
  dome(ctx, 26, -22, 6, { glass: false });
  antenna(ctx, -30, -18); solarArray(ctx, -34, 22, { n: 5 }); solarArray(ctx, 30, 26, { n: 4, ry: 0.4 });
  landingPad(ctx, 0, 36, 10, { mark: v === 'spaceport' ? 'SP' : 'H' });
  ctx.put('space-rocket', v === 'spaceport' ? 'heavy-booster' : 'reusable', 0, 36, 0, { fit: 10, y: 0.3 });
  ctx.put('space-rover', v === 'moon-base' ? 'lunar-buggy' : 'mars-6wheel', 14, 18, 0.7);
  ctx.put('space-rover', 'pressurised', -12, 22, -0.4);
  ctx.put('robot-companion', 'rover', 8, 12, 1); ctx.put('alien-critter', v === 'ice-planet' ? 'jelly' : 'tripod', -40, -36, 0.4);
  if (v === 'spaceport') { ctx.put('space-capsule', 'crew-modern', 22, 40, 0); ctx.put('airport', 'control-tower', -30, 40, 0, { fit: 14 }); }
  ctx.scatter(16, [['rock', 'boulder'], ['rock', 'granite'], ['rock', 'flat']], (x, z) => Math.hypot(x, z) > 30, { rad: 2.5, fit: 4 });
  ctx.scatter(5, [['person', 'astronaut']], (x, z) => Math.hypot(x, z) < 30, { rad: 1 });
  return ctx.done();
}

export const MAP_FANTASY_VARIANTS = { 'dragon-lair': {}, 'enchanted-forest': {}, 'wizard-tower': {}, 'crystal-valley': {} };
export async function createMapFantasy(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_FANTASY_VARIANTS));
  const ctx = makeMap(`map-fantasy-${v}`, o.seed ?? 21, { size: 110 });
  terrain(ctx, { biome: v === 'dragon-lair' ? 'rock' : 'fantasy', hills: v === 'dragon-lair' ? 24 : 12, flat: 0.32 });
  if (v === 'dragon-lair') { ctx.put('dragon', 'western', 0, -4, 0.4, { fit: 18 }); ctx.put('treasure-chest', 'domed', 8, 6, -0.5); ctx.scatter(10, [['ancient-coin', 'hoard'], ['treasure-chest', 'banded'], ['rock', 'boulder'], ['sword', 'longsword']], (x, z) => Math.hypot(x, z) < 20, { rad: 2 }); ctx.put('person', 'knight', 0, 26, P); }
  if (v === 'enchanted-forest') { ctx.scatter(30, [['treefolk', 'oak'], ['treefolk', 'willow'], ['tree', 'cherry'], ['mushroom-folk', 'colony'], ['mushroom', 'fly-agaric']], () => true, { rad: 2.5, fit: 6 }); ctx.put('unicorn', 'grazing', 0, 0, 0.6); ctx.put('phoenix', 'perched', 10, -6, 0); }
  if (v === 'wizard-tower') { ctx.put('castle-tower', 'conical', 0, -8, 0, { fit: 10, scale: 1.6 }); ctx.put('golem', 'sentinel', 10, 6, -0.4); ctx.put('griffin', 'resting', -12, 4, 0.8); crystals(ctx, 14, -14, { color: '#3fc3ff' }); }
  if (v === 'crystal-valley') { for (let i = 0; i < 9; i++) crystals(ctx, ctx.rand(-40, 40), ctx.rand(-40, 40), { color: ctx.pick(['#9a6cff', '#3fc3ff', '#ff5fa2', '#7be36b']), h: ctx.rand(3, 7) }); ctx.put('slime', 'king', 0, 0, 0); ctx.put('golem', 'rune-pillar', -14, 10, 0); }
  ctx.scatter(16, [['tree', 'cherry'], ['tree', 'willow'], ['bush', 'flowering'], ['flower', 'poppy'], ['rock', 'mossy']], (x, z) => Math.hypot(x, z) > 24, { rad: 2.5, fit: 6 });
  return ctx.done();
}

export const MAP_SWAMP_VARIANTS = { bayou: {}, mangrove: {}, bog: {}, haunted: {} };
export async function createMapSwamp(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_SWAMP_VARIANTS));
  const ctx = makeMap(`map-swamp-${v}`, o.seed ?? 22, { size: 100 });
  terrain(ctx, { biome: 'swamp', hills: 3, flat: 0.2, dip: (x, z) => -1.2 * (Math.sin(x / 9) * Math.cos(z / 11) > 0.1 ? 1 : 0) });
  water(ctx, { y: -0.35, color: '#3f4f30' });
  ctx.put(v === 'haunted' ? 'house' : 'shed', v === 'haunted' ? 'victorian-abandoned' : 'tiny-cabin', 0, 0, 0.3, { fit: 12 });
  ctx.put('boardwalk', 'straight', 0, 14, 0, { fit: 14 }); ctx.put('boat', 'rowboat', 8, 20, 0.6, { y: -0.35 });
  ctx.scatter(26, [['tree', 'willow'], ['tree', 'cypress'], ['water-plant', 'reeds'], ['water-plant', 'cattails'], ['water-plant', 'lily-pads'], ['log', 'hollow-log']], () => true, { rad: 2, fit: 6 });
  ctx.scatter(6, [['amphibian', 'frog'], ['amphibian', 'bullfrog'], ['reptile', 'python'], ['water-bird', 'goose'], ['bird-of-prey', 'owl']], () => true, { rad: 1 });
  if (v === 'haunted') ctx.scatter(5, [['memorial', 'stele'], ['gargoyle', 'grinning'], ['statue', 'urn']], (x, z) => Math.hypot(x, z) < 22, { rad: 2 });
  return ctx.done();
}

export const MAP_HIGHWAY_VARIANTS = { interchange: {}, 'rest-stop': {}, 'toll-plaza': {}, 'truck-stop': {} };
export async function createMapHighway(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_HIGHWAY_VARIANTS));
  const ctx = makeMap(`map-highway-${v}`, o.seed ?? 23, { size: 140 });
  terrain(ctx, { biome: 'meadow', hills: 6, flat: 0.5 });
  road(ctx, -80, -6, 80, -6, { w: 9, kind: 'highway' }); road(ctx, -80, 6, 80, 6, { w: 9, kind: 'highway' });
  if (v === 'interchange') { road(ctx, -6, -80, -6, 80, { w: 9, kind: 'highway' }); road(ctx, 6, -80, 6, 80, { w: 9, kind: 'highway' }); ctx.put('bridge', 'truss', 0, 0, 0, { fit: 30, claim: false }); }
  if (v === 'rest-stop' || v === 'truck-stop') { pad(ctx, 0, 30, 70, 26, { color: '#4a4c50' }); bays(ctx, -14, 30, 10); ctx.put('gas-station', v === 'truck-stop' ? 'truck-stop' : 'modern', 20, 34, P, { fit: 26 }); ctx.put('restaurant', 'fast-food', -24, 40, P, { fit: 16 }); for (let i = 0; i < 6; i++) ctx.put(...(v === 'truck-stop' ? ctx.pick([['truck', 'semi'], ['truck', 'box'], ['truck', 'tanker']]) : ctx.pick(CARS)), -26 + i * 2.6 * (v === 'truck-stop' ? 2 : 1), 30, 0, { claim: false }); }
  if (v === 'toll-plaza') { for (let i = -3; i <= 3; i++) ctx.put('kiosk', 'ticket', i * 4.5, 0, 0, { claim: false }); ctx.put('barrier', 'boom', -2, 3, 0, { claim: false }); }
  for (let i = 0; i < 10; i++) { const s = i % 2 ? 1 : -1; ctx.put(...ctx.pick([...CARS, ['truck', 'semi'], ['bus', 'coach']]), -70 + i * 15, s * 6 + (ctx.r() < 0.5 ? 2 : -2), s > 0 ? -H : H, { claim: false }); }
  ctx.scatter(10, [['sign', 'speed'], ['billboard', 'standard'], ['streetlight', 'highway']], (x, z) => Math.abs(z) > 12 && Math.abs(z) < 22, { rad: 3 });
  ctx.scatter(20, TREES.temperate, (x, z) => Math.abs(z) > 46, { rad: 3, fit: 6 });
  return ctx.done();
}

export const MAP_RAILWAY_VARIANTS = { 'rural-halt': {}, 'city-terminal': {}, 'freight-yard': {}, 'mountain-line': {} };
export async function createMapRailway(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_RAILWAY_VARIANTS));
  const ctx = makeMap(`map-rail-${v}`, o.seed ?? 24, { size: 140 });
  terrain(ctx, { biome: v === 'mountain-line' ? 'rock' : 'meadow', hills: v === 'mountain-line' ? 30 : 5, flat: 0.4, flatFn: (x, z) => Math.abs(z) < 16 });
  const tracks = v === 'freight-yard' ? [-9, -3, 3, 9] : [-3, 3];
  for (const z of tracks) {
    const g = new THREE.Group();
    g.name = 'rail-track';
    ctx.root.add(g);
    const sleeper = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 0.15, 2.6), new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 1 }), 220);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 220; i++) sleeper.setMatrixAt(i, m4.makeTranslation(-77 + i * 0.7, 0.2, z));
    g.add(sleeper);
    for (const s of [-0.72, 0.72]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(154, 0.15, 0.08), new THREE.MeshStandardMaterial({ color: '#8a8d90', metalness: 0.8, roughness: 0.35 })); rail.position.set(0, 0.34, z + s); g.add(rail); }
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(154, 0.14, 3.6), new THREE.MeshStandardMaterial({ color: '#7a7570', roughness: 1 }));
    ballast.position.set(0, 0.07, z); g.add(ballast);
  }
  ctx.taken.push([0, 0, 14]);
  const trainV = { 'rural-halt': 'diesel', 'city-terminal': 'high-speed', 'freight-yard': 'diesel', 'mountain-line': 'steam' }[v];
  ctx.put('train', trainV, -20, tracks[0], H, { claim: false, y: 0.34 });
  if (v === 'city-terminal') { ctx.put('train', 'electric', 24, tracks[1], -H, { claim: false, y: 0.34 }); ctx.put('train-station', 'modern', 0, -24, 0, { fit: 50 }); grid(ctx, { n: 1, block: 30, cars: 4, people: 8 }); }
  else if (v === 'freight-yard') { for (let i = 0; i < 8; i++) ctx.put('crate', 'shipping', -40 + i * 7, 20, 0); ctx.put('warehouse', 'standard', 20, 30, P, { fit: 30 }); ctx.put('industrial', 'reach-truck', 0, 15, 0.4); }
  else { ctx.put('train-station', v === 'mountain-line' ? 'classic' : 'platform', 0, -12, 0, { fit: 24 }); ctx.put('rail-crossing', 'gate', 40, 8, 0); road(ctx, 40, -70, 40, 70, { w: 6 }); }
  ctx.scatter(10, PEOPLE, (x, z) => z < -6 && z > -20 && Math.abs(x) < 20, { rad: 1 });
  ctx.scatter(20, v === 'mountain-line' ? TREES.pine : TREES.temperate, (x, z) => Math.abs(z) > 24, { rad: 3, fit: 6 });
  return ctx.done();
}

export const MAP_ARCTIC_VARIANTS = { 'research-base': {}, 'igloo-village': {}, glacier: {}, 'northern-town': {} };
export async function createMapArctic(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_ARCTIC_VARIANTS));
  const ctx = makeMap(`map-arctic-${v}`, o.seed ?? 25, { size: 110 });
  terrain(ctx, { biome: 'snow', hills: v === 'glacier' ? 30 : 10, flat: 0.36, dip: (x, z) => (z > 30 ? -4 * THREE.MathUtils.smoothstep(z, 30, 44) : 0) });
  water(ctx, { y: -0.6, w: 300, d: 80, z: 80, color: '#2f5a70' });
  if (v === 'research-base') { habModule(ctx, 0, 0, 0, { color: '#d9542b' }); habModule(ctx, 14, -4, H, { color: '#d9542b' }); antenna(ctx, -16, -10); ctx.put('edu-weather-station', 'mast', 10, 12, 0); ctx.put('misc-vehicle', 'snowmobile', -6, 12, 0.5); }
  if (v === 'igloo-village') for (let i = 0; i < 6; i++) { const a = i / 6 * P * 2; dome(ctx, Math.cos(a) * 14, Math.sin(a) * 14, 3, { glass: false, color: '#f4f8fb' }); }
  if (v === 'northern-town') { road(ctx, -50, 0, 50, 0, { w: 6 }); for (let i = 0; i < 6; i++) ctx.put('house', ctx.pick(['cottage-winter', 'farmhouse-winter', 'suburban-winter']), -36 + i * 14, i % 2 ? 12 : -12, i % 2 ? P : 0, { fit: 11 }); ctx.put('church', 'chapel', 0, -26, 0, { fit: 14 }); }
  if (v === 'glacier') ctx.scatter(12, [['rock', 'granite'], ['rock', 'cliff']], () => true, { rad: 3, fit: 6 });
  ctx.scatter(6, [['bear', 'polar-bear'], ['wild-canine', 'arctic-fox'], ['wild-canine', 'arctic-wolf'], ['deer', 'reindeer'], ['bird-of-prey', 'snowy-owl']], () => true, { rad: 1.5 });
  ctx.scatter(16, [['tree', 'pine-winter'], ['tree', 'spruce-winter']], (x, z) => z < 20 && Math.hypot(x, z) > 22, { rad: 2.5, fit: 6 });
  return ctx.done();
}

export const MAP_THEMEPARK_VARIANTS = { 'fun-fair': {}, 'water-park': {}, zoo: {}, 'mini-golf': {} };
export async function createMapThemepark(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_THEMEPARK_VARIANTS));
  const ctx = makeMap(`map-themepark-${v}`, o.seed ?? 26, { size: 110 });
  terrain(ctx, { biome: 'meadow', hills: 3, flat: 0.5, dip: v === 'water-park' ? (x, z) => -1.5 * (Math.hypot(x, z) < 14 ? 1 : 0) : null });
  pad(ctx, 0, 40, 30, 10, { color: '#d9d3c6' }); ctx.put('park-gate', 'portal', 0, 46, 0, { fit: 14 });
  if (v === 'fun-fair') { ctx.put('merry-go-round', 'classic', -16, 0, 0, { fit: 10 }); ctx.put('tent', 'circus', 18, -10, 0, { fit: 20 }); ctx.scatter(8, [['food-cart', 'ice-cream'], ['food-cart', 'hot-dog'], ['kiosk', 'ticket'], ['market-stall', 'canopy']], () => true, { rad: 2.5 }); }
  if (v === 'water-park') { water(ctx, { y: -0.2, w: 28, d: 28, color: '#3fb0d0' }); ctx.put('playground', 'slide', 16, 0, -H, { fit: 10 }); ctx.scatter(10, [['beach-set', 'lounger'], ['umbrella', 'beach']], (x, z) => Math.hypot(x, z) > 16 && Math.hypot(x, z) < 30, { rad: 2 }); }
  if (v === 'zoo') {
    const pens = [[[-24, -16], [['elephant', 'african-elephant']]], [[0, -20], [['giraffe', 'reticulated']]], [[24, -16], [['big-cat', 'lion'], ['big-cat', 'lioness']]], [[-24, 12], [['donkey-zebra', 'zebra']]], [[24, 12], [['bear', 'panda']]]];
    for (const [[x, z], an] of pens) { for (const [a, b, c, d] of [[x - 8, z - 7, x + 8, z - 7], [x + 8, z - 7, x + 8, z + 7], [x + 8, z + 7, x - 8, z + 7], [x - 8, z + 7, x - 8, z - 7]]) wall(ctx, a, b, c, d, { h: 1, t: 0.4, color: '#a8988a' }); ctx.put(...an[0], x, z, ctx.rand(0, 6), { claim: false }); if (an[1]) ctx.put(...an[1], x + 4, z + 2, ctx.rand(0, 6), { claim: false }); ctx.taken.push([x, z, 10]); }
  }
  if (v === 'mini-golf') ctx.scatter(9, [['golf-club', 'iron'], ['flower-bed', 'round'], ['windmill', 'dutch'], ['sports-goal', 'futsal']], () => true, { rad: 4, fit: 5 });
  ctx.scatter(16, PEOPLE, (x, z) => Math.abs(x) < 40 && Math.abs(z) < 40, { rad: 1 });
  ctx.scatter(12, TREES.temperate, (x, z) => Math.max(Math.abs(x), Math.abs(z)) > 38, { rad: 3, fit: 6 });
  return ctx.done();
}

export const MAP_CAMPUS_VARIANTS = { university: {}, 'high-school': {}, hospital: {}, 'civic-centre': {} };
export async function createMapCampus(o = {}) {
  o = normalizeOptions(o);
  const v = pickVariant(o.variant, Object.keys(MAP_CAMPUS_VARIANTS));
  const ctx = makeMap(`map-campus-${v}`, o.seed ?? 27, { size: 120 });
  terrain(ctx, { biome: 'meadow', hills: 3, flat: 0.5 });
  road(ctx, -70, 44, 70, 44, { w: 8 });
  pad(ctx, 0, 0, 50, 30, { color: '#cfc8bb' });
  const set = { university: [['museum', 'modern-library'], ['school', 'modern'], ['office', 'campus'], ['museum', 'classical']], 'high-school': [['school', 'standard'], ['school', 'modern'], ['sports-goal', 'soccer'], ['bleachers', 'aluminium']], hospital: [['hospital', 'standard'], ['hospital', 'clinic'], ['parking-garage', 'clad'], ['office', 'midrise']], 'civic-centre': [['civic-hall', 'city-hall'], ['civic-hall', 'courthouse'], ['police-station', 'modern'], ['fire-station', 'modern']] }[v];
  ctx.put(...set[0], 0, -30, 0, { fit: 40 });
  ctx.put(...set[1], -40, 0, H, { fit: 28 });
  ctx.put(...set[2], 40, 0, -H, { fit: 28 });
  ctx.put(...set[3], 30, 30, P, { fit: 18 });
  ctx.put('plaza-fountain', 'jets', 0, 0, 0, { fit: 8 }); ctx.put('flag-pole', 'triple', 0, 12, 0, { claim: false });
  if (v === 'hospital') { ctx.put('van', 'ambulance', -10, 30, 0); landingPad(ctx, -40, 30, 7); ctx.put('helicopter', 'medical', -40, 30, 0.3, { y: 0.3 }); }
  ctx.scatter(16, [['bench', 'modern'], ['trash-can', 'city'], ['bike-rack', 'hoop'], ['streetlight', 'modern']], (x, z) => Math.abs(x) < 26 && Math.abs(z) < 16, { rad: 1.5 });
  ctx.scatter(16, PEOPLE, (x, z) => Math.abs(x) < 30 && Math.abs(z) < 30, { rad: 1 });
  ctx.scatter(16, TREES.temperate, (x, z) => Math.max(Math.abs(x), Math.abs(z)) > 48, { rad: 3, fit: 6 });
  return ctx.done();
}
