import { CATALOG, CATEGORIES, listModels, expandVariants, resolveVariant, trimsOf, MODEL_LICENSE } from './catalog.js';

export { CATALOG, CATEGORIES, listModels, expandVariants, resolveVariant, trimsOf, MODEL_LICENSE };
export { createAnimator } from './core/animation.js';

/*
 * Each category lives in its own module and is only fetched the first time you
 * create something from it (dynamic import → bundlers code-split automatically).
 * The literal import paths below are required for bundlers to see them.
 */
const MODULES = {
  cars: () => import('./models/cars.js'),
  heavy: () => import('./models/heavy.js'),
  transport: () => import('./models/transport.js'),
  vehicles: () => import('./models/vehicles.js'),
  furniture: () => import('./models/furniture.js'),
  buildings: () => import('./models/buildings.js'),
  nature: () => import('./models/nature.js'),
  street: () => import('./models/street.js'),
  people: () => import('./models/people.js'),
  animals: () => import('./models/animals.js'),
  food: () => import('./models/food.js'),
  electronics: () => import('./models/electronics.js'),
  maps: () => import('./models/maps.js'),
  fashion: () => import('./models/fashion.js'),
  music: () => import('./models/music.js'),
  sports: () => import('./models/sports.js'),
  science: () => import('./models/science.js'),
  art: () => import('./models/art.js'),
  creatures: () => import('./models/creatures.js'),
  history: () => import('./models/history.js'),
  places: () => import('./models/places.js'),
  toys: () => import('./models/toys.js'),
  tools: () => import('./models/tools.js'),
  military: () => import('./models/military.js'),
  items: () => import('./models/items.js'),
};

let modelBaseUrl = null;
let dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
/** HD .glb files ship inside this package (hd/models/); by default they're fetched from jsDelivr's copy of it,
 *  so they work without any bundler setup. setModelBaseUrl() points them at your own copy instead. */
const HD_DEFAULT = 'https://cdn.jsdelivr.net/npm/three-premade@0.1/hd/models/';

/**
 * Where Blender-made .glb files are served from. Defaults to the package's own
 * `models/` folder next to `src/`. Point it at a CDN if you prefer, e.g.
 * setModelBaseUrl('/assets/three-premade/hd/models/')  // e.g. copied from node_modules/three-premade/hd/models
 */
export function setModelBaseUrl(url) {
  modelBaseUrl = url.endsWith('/') ? url : `${url}/`;
}

/** Where the Draco decoder for compressed .glb files is loaded from. */
export function setDracoDecoderPath(path) {
  dracoPath = path;
}

function glbUrl(type, variant) {
  const file = `${type}/${variant}.glb`;
  if (modelBaseUrl) return modelBaseUrl + file;
  return CATALOG[type]?.quality === 'hd' ? HD_DEFAULT + file : new URL(`../models/${file}`, import.meta.url).href;
}

let gltfLoaderPromise = null;
async function getLoader() {
  gltfLoaderPromise ??= Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js')]).then(
    ([{ GLTFLoader }, { DRACOLoader }]) => new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(dracoPath)),
  );
  return gltfLoaderPromise;
}

const glbCache = new Map();

async function loadGLB(type, variant, trim, options) {
  const THREE = await import('three');
  const url = glbUrl(type, variant);
  if (!glbCache.has(url)) glbCache.set(url, getLoader().then((l) => l.loadAsync(url)));
  const gltf = await glbCache.get(url);
  // Deep clone so every instance can have its own color/animation state.
  const { clone } = await import('three/addons/utils/SkeletonUtils.js');
  const root = clone(gltf.scene);
  root.animations = gltf.animations;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = options.castShadow ?? true;
    o.receiveShadow = options.receiveShadow ?? true;
    o.material = o.material.clone();
    // Materials named "paint" in Blender take the `color` option.
    if (options.color && /paint|primary/i.test(o.material.name)) o.material.color = new THREE.Color(options.color);
    if (options.secondaryColor && /secondary|fabric/i.test(o.material.name)) o.material.color = new THREE.Color(options.secondaryColor);
  });
  root.name = `${type}-${variant}`;
  root.userData.premade = { type, variant, trim, source: 'glb', license: CATALOG[type].license ?? 'CC0-1.0', quality: CATALOG[type].quality ?? 'standard', options: { ...options }, animations: gltf.animations.map((a) => a.name) };
  if (options.scale) root.scale.multiplyScalar(options.scale);
  if (options.position) root.position.set(...options.position);
  if (options.rotation != null) typeof options.rotation === 'number' ? (root.rotation.y = options.rotation) : root.rotation.set(...options.rotation);
  return root;
}

/**
 * Normalises every supported call style into { type, variant, options }:
 *   createObject('car', { variant: 'minivan', color: 'blue' })
 *   createObject('car:minivan', { color: 'blue' })
 *   createObject({ type: 'car', variant: 'minivan', color: 'blue' })
 *   createObject({ Car: 'minivan', Color: 'blue' })
 */
export function parseRequest(a, b = {}) {
  let type;
  let options;
  if (typeof a === 'string') {
    type = a;
    options = { ...b };
  } else {
    options = {};
    for (const [k, v] of Object.entries(a ?? {})) options[k.charAt(0).toLowerCase() + k.slice(1)] = v;
    type = options.type;
    if (!type) {
      const key = Object.keys(options).find((k) => CATALOG[k.toLowerCase()]);
      if (key) {
        type = key;
        if (typeof options[key] === 'string') options.variant ??= options[key];
        delete options[key];
      }
    }
    delete options.type;
  }
  if (!type) throw new Error('[three-premade] createObject needs a type, e.g. createObject("car", { variant: "suv" })');
  let [t, v] = String(type).split(':');
  t = t.trim().toLowerCase();
  // also accept "Type:minivan" style variant strings
  let variant = options.variant ?? v;
  if (typeof variant === 'string') variant = variant.replace(/^type:/i, '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  delete options.variant;
  const entry = CATALOG[t];
  if (!entry) throw new Error(`[three-premade] Unknown type "${t}". Available: ${Object.keys(CATALOG).join(', ')}`);
  variant ??= entry.variants[0];
  if (typeof options.trim === 'string' && entry.variants.includes(variant)) variant = `${variant}-${options.trim.toLowerCase()}`;
  delete options.trim;
  const parts = resolveVariant(entry, variant);
  if (!parts) {
    const all = expandVariants(entry);
    throw new Error(`[three-premade] Unknown ${t} variant "${variant}". Available: ${all.slice(0, 40).join(', ')}${all.length > 40 ? ` … (${all.length} total)` : ''}`);
  }
  return { type: t, variant, base: parts.variant, trim: parts.trim, options, entry };
}

/** Create a model. Returns a Promise<THREE.Object3D> with `.animations` set. */
export async function createObject(a, b) {
  const { type, variant, base, trim, options, entry } = parseRequest(a, b);
  if (entry.source === 'glb') return loadGLB(type, variant, trim, options);
  const mod = await MODULES[entry.module]();
  const obj = await mod[entry.factory]({ ...options, variant: base, trim });
  // factories see the base variant + trim; the object reports the full name
  Object.assign(obj.userData.premade, { type, variant, base, trim, license: entry.license ?? 'CC0-1.0' });
  return obj;
}

/** Warm the cache for some types so later createObject calls are instant. */
export async function preload(...types) {
  await Promise.all(
    types.flat().map((t) => {
      const { type, variant, entry } = parseRequest(t);
      if (entry.source !== 'glb') return MODULES[entry.module]();
      const url = glbUrl(type, variant);
      if (!glbCache.has(url)) glbCache.set(url, getLoader().then((l) => l.loadAsync(url)));
      return glbCache.get(url);
    }),
  );
}
