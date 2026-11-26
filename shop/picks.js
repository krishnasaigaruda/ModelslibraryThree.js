// Every model the shop page shows (featured row, new row, category tiles, starter kits) in one place,
// so scripts/thumbs.html can prerender exactly these and the page never builds models while you scroll.
export const FEATURED = ['car:sports', 'house:victorian', 'tree:cherry', 'person:chef', 'sofa:chesterfield', 'helicopter:rescue', 'lighthouse:striped', 'skyscraper:twisted', 'truck:fire-engine', 'motorcycle:chopper', 'windmill:dutch', 'boat:sailboat'];
export const REP = { maps: 'map-city:financial', electronics: 'laptop:ultrabook-13', vehicles: 'car:sports', furniture: 'sofa:chesterfield', buildings: 'house:victorian', nature: 'tree:cherry', street: 'streetlight:classic', people: 'person:chef' };
export const KITS = [
  { name: 'City starter kit', blurb: 'A street corner: homes, a tower, lights, traffic and a bus.', items: ['house:townhouse', 'apartment:brick', 'skyscraper:glass', 'streetlight:classic', 'traffic-light:pole', 'bus:city', 'car:taxi', 'tree:maple', 'bench:park'] },
  { name: 'Home interior kit', blurb: 'Furnish a living room and bedroom in one paste.', items: ['sofa:three-seat', 'table:coffee', 'lamp:floor', 'rug:persian', 'plant:monstera', 'bed:double', 'wardrobe:modern', 'tv:wall', 'bookshelf:tall'] },
  { name: 'Road & traffic kit', blurb: 'Roads, signs and barriers for driving scenes.', items: ['road:straight', 'road:intersection', 'traffic-cone:cone', 'sign:stop', 'barrier:jersey', 'traffic-light:overhead', 'car:police', 'truck:tow', 'fire-hydrant:classic'] },
];
/** "type:variant" specs -> model entries (unknown variants fall back to the type's first variant). */
export const makePick = (models, CATALOG, resolveVariant) => (spec) => spec.map((s) => {
  const [t, v] = s.split(':');
  const e = CATALOG[t];
  if (!e) return null;
  const variant = v && resolveVariant(e, v) ? v : e.variants[0];
  return models.find((m) => m.type === t && m.variant === variant);
}).filter(Boolean);
export const newestTypes = (CATALOG) => Object.keys(CATALOG).filter((t) => CATALOG[t].quality !== 'hd' && CATALOG[t].category !== 'maps').slice(-12).reverse();
export const tileModel = (c, pick, baseModels) => pick([REP[c] ?? ''])[0] ?? baseModels.find((x) => x.category === c && x.quality !== 'hd');
/** All models the shop shows. */
export function shopModels(models, CATALOG, CATEGORIES, resolveVariant) {
  const pick = makePick(models, CATALOG, resolveVariant);
  const base = models.filter((m) => !m.trim);
  const out = [...pick(FEATURED), ...pick(newestTypes(CATALOG)), ...CATEGORIES.map((c) => tileModel(c, pick, base)).filter(Boolean), ...KITS.flatMap((k) => pick(k.items))];
  return [...new Map(out.map((m) => [`${m.type}:${m.variant}`, m])).values()];
}
