import { finalize, normalizeOptions } from '../core/utils.js';
import { buildQuadruped } from './animals/quad.js';
import { buildBird } from './animals/bird.js';
import { QUAD_TYPES, BIRD_TYPES, derive } from './animals/species.js';
import { applyTrim } from './animals/trims.js';
import { applyBirdTrim } from './animals/birdtrims.js';
import { buildPenguin } from './animals/penguin.js';
import { AQUATIC_TYPES, buildAquatic } from './animals/aquatic.js';
import { CRITTER_TYPES, buildCritter } from './animals/critters.js';

/*
 * Animals category. Real-anatomy generators (see ./animals/*): continuous skinned
 * lofts with species proportions, jointed legs by foot posture (digitigrade,
 * unguligrade, plantigrade), sculpted heads, painted coats/plumage/scales.
 * Every type has breeds/species as variants and trims (age, build, coat,
 * accessories). Facing +Z, origin on the ground, metres.
 */

const EXCLUSIVE = ['idle', 'walk', 'run', 'graze', 'sniff', 'sit', 'fly', 'swim', 'hop', 'peck', 'slither', 'crawl', 'flutter', 'slide', 'trot', 'lie', 'perch'];

function finish(root, type, variant, o) {
  const animations = root.userData.clips ?? [];
  delete root.userData.clips;
  const floating = root.userData.floating;
  if (o.size && o.size !== 1) root.scale.multiplyScalar(o.size);
  finalize(root, { type, variant, options: o, animations });
  if (floating) root.userData.floating = true;
  const names = animations.map((a) => a.name);
  root.userData.premade.exclusive = [names.filter((n) => EXCLUSIVE.includes(n))];
  return root;
}

function pick(table, type, variant) {
  const t = table[type];
  const v = variant ?? Object.keys(t.variants)[0];
  if (!t.variants[v]) throw new Error(`[three-premade] Unknown ${type} variant "${v}". Available: ${Object.keys(t.variants).join(', ')}`);
  return { t, v, spec: derive(t.base, t.variants[v]) };
}

function quadFactory(type) {
  return (options = {}) => {
    const o = normalizeOptions(options);
    const { v, spec } = pick(QUAD_TYPES, type, o.variant);
    const { spec: s2, accessories } = applyTrim(spec, o.trim);
    if (o.color) {
      s2.coat = { ...s2.coat, base: o.color };
      delete s2.coat.back;
    }
    const root = buildQuadruped(`${type}-${v}`, s2, { seed: o.seed ?? `${type}-${v}`, accessories });
    return finish(root, type, v, o);
  };
}

function birdFactory(type) {
  return (options = {}) => {
    const o = normalizeOptions(options);
    const { v, spec } = pick(BIRD_TYPES, type, o.variant);
    if (spec.penguin) {
      const P = { ...spec, coat: { ...spec.coat } };
      if (o.trim === 'chick') Object.assign(P, { H: P.H * 0.42, chick: true, fat: 1.25, bill: P.bill * 0.5, headR: 0.62 });
      if (o.trim === 'fluffed') Object.assign(P, { fat: (P.fat ?? 1) * 1.22, flipperOut: 0.12 });
      if (o.trim === 'juvenile') Object.assign(P, { H: P.H * 0.85, coat: { ...P.coat, patch: null, breast: null, back: '#3a3e44', face: '#f4f4f2' } });
      if (o.trim === 'nesting') P.egg = true;
      if (o.color) P.coat.back = o.color;
      return finish(buildPenguin(`${type}-${v}`, P, { seed: o.seed }), type, v, o);
    }
    const s2 = applyBirdTrim(spec, o.trim);
    if (o.color) s2.coat = { ...s2.coat, back: o.color, wing: o.color };
    const root = buildBird(`${type}-${v}`, s2, { seed: o.seed ?? `${type}-${v}` });
    return finish(root, type, v, o);
  };
}

function tableFactory(table, build, type) {
  return (options = {}) => {
    const o = normalizeOptions(options);
    const { v, spec } = pick(table, type, o.variant);
    if (o.color) spec.color = o.color;
    const root = build(`${type}-${v}`, spec, { seed: o.seed ?? `${type}-${v}`, trim: o.trim });
    return finish(root, type, v, o);
  };
}

export const createDog = quadFactory('dog');
export const createCat = quadFactory('cat');
export const createHorse = quadFactory('horse');
export const createEquine = quadFactory('equine');
export const createCattle = quadFactory('cow');
export const createPig = quadFactory('pig');
export const createSheep = quadFactory('sheep');
export const createDeer = quadFactory('deer');
export const createBigCat = quadFactory('bigcat');
export const createCanine = quadFactory('canine');
export const createBear = quadFactory('bear');
export const createSmallMammal = quadFactory('small');
export const createElephant = quadFactory('elephant');
export const createGiraffe = quadFactory('giraffe');
export const createRhino = quadFactory('rhino');
export const createCamel = quadFactory('camel');
export const createBird = birdFactory('bird');
export const createPoultry = birdFactory('fowl');
export const createWaterBird = birdFactory('waterbird');
export const createRaptor = birdFactory('raptor');
export const createFish = tableFactory(AQUATIC_TYPES, buildAquatic, 'fish');
export const createSeaLife = tableFactory(AQUATIC_TYPES, buildAquatic, 'sea-mammal');
export const createShark = tableFactory(AQUATIC_TYPES, buildAquatic, 'shark');
export const createReptile = tableFactory(CRITTER_TYPES, buildCritter, 'reptile');
export const createAmphibian = tableFactory(CRITTER_TYPES, buildCritter, 'amphibian');
export const createInsect = tableFactory(CRITTER_TYPES, buildCritter, 'insect');
export const createInvertebrate = tableFactory(CRITTER_TYPES, buildCritter, 'invertebrate');

/** Everything the catalog needs (types → variants/trims). */
export const ANIMAL_TABLES = { QUAD_TYPES, BIRD_TYPES, AQUATIC_TYPES, CRITTER_TYPES };

/** Dev helper: any quad species by name, e.g. createSpecies({ variant: 'dog', trim: 'labrador' }) */
export function createSpecies(options = {}) {
  const type = options.variant;
  for (const [tbl, make] of [[QUAD_TYPES, quadFactory], [BIRD_TYPES, birdFactory]]) {
    if (tbl[type]) return make(type)({ variant: options.trim, trim: options.trim2 });
  }
  if (AQUATIC_TYPES[type]) return tableFactory(AQUATIC_TYPES, buildAquatic, type)({ variant: options.trim });
  return tableFactory(CRITTER_TYPES, buildCritter, type)({ variant: options.trim });
}
