/**
 * Static catalog of every model type. Importing this file does NOT load any
 * geometry code or .glb files, so it is cheap to use for menus, search and docs.
 *
 * source: 'js'  → built in code (src/models/*.js), any color, tiny download
 *         'glb' → modelled in Blender (HD, hd/models/<type>/<variant>.glb), fetched on demand
 *
 * Every entry has `variants` (base designs) and optional `trims`: extra versions
 * of each variant with different parts (bumpers, wheels, kits, materials, styles).
 * A trimmed model is named "<variant>-<trim>", e.g. "sedan-sport".
 * `trims` is either an array (applies to every variant) or { variant: [trims] }.
 */
import cars from './catalog/cars.js';
import heavy from './catalog/heavy.js';
import transport from './catalog/transport.js';
import furniture from './catalog/furniture.js';
import buildings from './catalog/buildings.js';
import nature from './catalog/nature.js';
import street from './catalog/street.js';
import people from './catalog/people.js';
import animals from './catalog/animals.js';
import hd from './catalog/hd.js';
import food from './catalog/food.js';
import electronics from './catalog/electronics.js';
import fashion from './catalog/fashion.js';
import music from './catalog/music.js';
import sports from './catalog/sports.js';
import science from './catalog/science.js';
import art from './catalog/art.js';
import creatures from './catalog/creatures.js';
import history from './catalog/history.js';
import places from './catalog/places.js';
import toys from './catalog/toys.js';
import tools from './catalog/tools.js';
import military from './catalog/military.js';
import items from './catalog/items.js';
import maps from './catalog/maps.js';

export const CATALOG = { ...cars, ...heavy, ...transport, ...furniture, ...buildings, ...nature, ...street, ...people, ...animals, ...food, ...electronics, ...fashion, ...music, ...sports, ...science, ...art, ...creatures, ...history, ...places, ...toys, ...tools, ...military, ...items, ...maps, ...hd };

// Tech that was first written inside other categories lives under Electronics (code stays in its module).
const TO_ELECTRONICS = {
  tv: 'tv & video', cctv: 'cameras', 'music-speaker': 'audio', 'vinyl-player': 'audio',
  appliance: 'home appliances', 'small-appliance': 'home appliances', 'tech-drone': 'drones',
  'tech-server-rack': 'computers', 'tech-robot-arm': 'robotics', 'tech-humanoid': 'robotics',
  'remote-control': 'accessories', 'extension-cord': 'accessories',
  'tech-circuit-board': 'components', 'tech-3d-printer': 'computers',
};
for (const [t, sub] of Object.entries(TO_ELECTRONICS)) if (CATALOG[t]) CATALOG[t] = { ...CATALOG[t], category: 'electronics', sub };

/** Every model (geometry, HD .glb files, thumbnails) is CC0 1.0 public domain; the library code is MIT. */
export const MODEL_LICENSE = { id: 'CC0-1.0', name: 'CC0 1.0 Universal (public domain)', url: 'https://creativecommons.org/publicdomain/zero/1.0/' };
for (const e of Object.values(CATALOG)) e.license ??= MODEL_LICENSE.id;

/** Top-level categories, in display order. Entries may also carry a `sub` (e.g. furniture → kitchen). */
export const CATEGORIES = [...new Set(Object.values(CATALOG).map((e) => e.category))];

/** The trims available for one variant of an entry. */
export function trimsOf(entry, variant) {
  const t = entry.trims;
  if (!t) return [];
  return Array.isArray(t) ? t : t[variant] ?? [];
}

/** Every full model name of an entry: each variant, then "<variant>-<trim>" for each trim. */
export function expandVariants(entry) {
  return entry.variants.flatMap((v) => [v, ...trimsOf(entry, v).map((t) => `${v}-${t}`)]);
}

/** "sedan-sport" → { variant: 'sedan', trim: 'sport' }; "sedan" → { variant: 'sedan', trim: null }; unknown → null. */
export function resolveVariant(entry, name) {
  if (entry.variants.includes(name)) return { variant: name, trim: null };
  for (const v of entry.variants) {
    if (!name.startsWith(`${v}-`)) continue;
    const trim = name.slice(v.length + 1);
    if (trimsOf(entry, v).includes(trim)) return { variant: v, trim };
  }
  return null;
}

/** Flat list of { type, variant, base, trim, category, sub, source, quality, label } for every model. */
export function listModels() {
  return Object.entries(CATALOG).flatMap(([type, e]) =>
    e.variants.flatMap((base) =>
      [null, ...trimsOf(e, base)].map((trim) => {
        const variant = trim ? `${base}-${trim}` : base;
        return { type, variant, base, trim, category: e.category, sub: e.sub ?? null, source: e.source, quality: e.quality ?? 'standard', license: e.license, label: `${e.label} · ${variant}` };
      }),
    ),
  );
}
