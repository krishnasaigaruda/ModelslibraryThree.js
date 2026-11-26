// Catalog entries owned by src/models/people*. Merged by src/catalog.js.
// Variants and trims come from the pure-data recipe file (no geometry code is loaded).
import { PERSON_VARIANTS, trimsFor } from '../models/people/roles.js';

const variants = Object.keys(PERSON_VARIANTS);

export default {
  person: {
    category: 'people',
    source: 'js',
    module: 'people',
    factory: 'createPerson',
    label: 'Person',
    variants,
    // every trim changes the model: sex/age/build, hairstyle, facial hair, hats/glasses,
    // bags & held items, or a whole outfit (winter / rain / summer)
    trims: Object.fromEntries(variants.map((v) => [v, trimsFor(v)])),
    options: {
      detail: "'high' (default, ~30–40k triangles) | 'low' (~5–8k, for crowds)",
      trim: 'alternative to the "<variant>-<trim>" name, e.g. { variant: "nurse", trim: "winter" }',
      skinTone: '0–5 or color',
      hairColor: 'color',
      hairStyle: 'short | buzz | curly | long | wavy | bob | ponytail | bun | braid | afro | quiff | balding | bald',
      beard: 'full | stubble | moustache | goatee',
      shirtColor: 'color',
      pantsColor: 'color',
      shoeColor: 'color',
      hat: 'hardhat | policecap | cap | beanie | sunhat | fedora | cowboy | beret | toque | firehelmet | bikehelmet | false',
      hatColor: 'color',
      glasses: "true | 'sun'",
      headphones: 'boolean',
      tieColor: 'color',
      face: '0–4: facial structure variation',
      height: 'metres',
      seed: 'number: randomizes everything not given',
    },
  },
};
