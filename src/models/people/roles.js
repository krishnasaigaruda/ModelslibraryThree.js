/*
 * People recipes + trims. PURE DATA (no three.js import) so the catalog can use
 * it to list every person model without loading any geometry code.
 *
 * Recipe fields:
 *  sex 'm'|'f', age 'adult'|'teen'|'child'|'toddler'|'elder', H (m), skin 0–5, build 'heavy'|'slim'|'athletic'
 *  hair short|buzz|curly|long|bob|ponytail|bun|balding|bald|afro|braid|quiff|wavy, hairColor (index or color)
 *  top tshirt|polo|longsleeve|shirt|tank|hoodie|suit|blazer|cardigan|uniform|chef|fire|swim|spacesuit|none
 *  bottom jeans|trousers|shorts|trunks|leggings|skirt|dress|pencil
 *  shoes sneaker|flat|heel|dress|boot|sandal|none ; hat hardhat|policecap|cap|toque|firehelmet|beanie|sunhat|fedora|cowboy|bikehelmet|swimcap|spacehelmet|beret
 *  extras: tie, vest, labcoat, stethoscope, belt, badge, apron, bands, backpack, camera, headband, glasses ('sun'),
 *          beard full|stubble|moustache|goatee, coat puffer|rain|overcoat|robe, scarf, hold, headphones, bag, overalls,
 *          goggles, gloves
 */
export const PERSON_VARIANTS = {
  man: { sex: 'm', H: 1.76, skin: 2, hair: 'short', hairColor: 1, top: 'tshirt', topColor: '#2f4f7f', bottom: 'jeans', bottomColor: '#2b3a55', shoes: 'sneaker', shoeColor: '#e9e9e9' },
  woman: { sex: 'f', H: 1.65, skin: 1, hair: 'long', hairColor: 2, top: 'tshirt', fitted: true, topColor: '#b23a3a', bottom: 'jeans', bottomColor: '#33445f', shoes: 'flat', shoeColor: '#2a2a2a' },
  boy: { sex: 'm', age: 'child', H: 1.3, skin: 3, hair: 'short', hairColor: 0, top: 'tshirt', topColor: '#d98c2b', bottom: 'shorts', bottomColor: '#3d4f3a', shoes: 'sneaker', shoeColor: '#3a6ea5' },
  girl: { sex: 'f', age: 'child', H: 1.24, skin: 0, hair: 'ponytail', hairColor: 4, top: 'tshirt', topColor: '#7a4f9a', bottom: 'skirt', bottomColor: '#e07a9a', shoes: 'flat', shoeColor: '#c0392b' },
  'elder-man': { sex: 'm', age: 'elder', H: 1.72, skin: 1, hair: 'balding', hairColor: 6, top: 'cardigan', topColor: '#6b5b45', under: '#e8e2d6', bottom: 'trousers', bottomColor: '#4a4a4a', shoes: 'dress', shoeColor: '#3b2a1e', glasses: true },
  'elder-woman': { sex: 'f', age: 'elder', H: 1.6, skin: 2, hair: 'bun', hairColor: 6, top: 'cardigan', topColor: '#8a6f8f', under: '#e9dfe8', bottom: 'dress', bottomColor: '#5b6e8c', shoes: 'flat', shoeColor: '#3b2a1e', glasses: true },
  business: { sex: 'm', H: 1.8, skin: 4, hair: 'short', hairColor: 0, top: 'suit', topColor: '#23262d', under: '#f4f4f4', tie: '#7a1f2b', bottom: 'trousers', bottomColor: '#23262d', shoes: 'dress', shoeColor: '#111111' },
  'business-woman': { sex: 'f', H: 1.68, skin: 3, hair: 'bun', hairColor: 0, top: 'blazer', topColor: '#2c3e50', under: '#f4f4f4', bottom: 'pencil', bottomColor: '#2c3e50', shoes: 'heel', shoeColor: '#111111' },
  athlete: { sex: 'm', H: 1.83, skin: 5, hair: 'buzz', hairColor: 0, top: 'tank', topColor: '#1565c0', bottom: 'shorts', bottomColor: '#111111', shoes: 'sneaker', shoeColor: '#f2f2f2', build: 'athletic', headband: '#ffffff' },
  worker: { sex: 'm', H: 1.78, skin: 2, hair: 'short', hairColor: 2, top: 'longsleeve', topColor: '#5d6d7e', bottom: 'jeans', bottomColor: '#2b3a55', shoes: 'boot', shoeColor: '#6b4a2b', vest: true, hat: 'hardhat', hatColor: '#f2c200' },
  doctor: { sex: 'f', H: 1.67, skin: 1, hair: 'bun', hairColor: 3, top: 'tshirt', topColor: '#3aa59a', bottom: 'trousers', bottomColor: '#3aa59a', shoes: 'sneaker', shoeColor: '#f2f2f2', labcoat: true, stethoscope: true },
  police: { sex: 'm', H: 1.8, skin: 3, hair: 'short', hairColor: 0, top: 'shirt', topColor: '#1f2a44', bottom: 'trousers', bottomColor: '#1a2233', shoes: 'boot', shoeColor: '#111111', belt: true, badge: true, hat: 'policecap', hatColor: '#1a2233' },
  chef: { sex: 'm', H: 1.75, skin: 1, hair: 'short', hairColor: 1, top: 'chef', topColor: '#f6f6f2', bottom: 'trousers', bottomColor: '#2a2a2a', shoes: 'dress', shoeColor: '#111111', apron: true, hat: 'toque', hatColor: '#ffffff' },
  firefighter: { sex: 'm', H: 1.82, skin: 2, hair: 'short', hairColor: 1, top: 'fire', topColor: '#b08d57', bottom: 'trousers', bottomColor: '#b08d57', shoes: 'boot', shoeColor: '#1a1a1a', bands: true, hat: 'firehelmet', hatColor: '#c62828' },
  student: { sex: 'f', H: 1.63, skin: 4, hair: 'curly', hairColor: 0, top: 'hoodie', topColor: '#5d8aa8', bottom: 'jeans', bottomColor: '#2b3a55', shoes: 'sneaker', shoeColor: '#ffffff', backpack: '#c0392b' },
  tourist: { sex: 'm', H: 1.74, skin: 0, hair: 'short', hairColor: 4, top: 'tshirt', topColor: '#1fa38a', bottom: 'shorts', bottomColor: '#c9b28b', shoes: 'sneaker', shoeColor: '#6b4a2b', hat: 'cap', hatColor: '#d35400', camera: true },
  // ---- professions & roles ----
  nurse: { sex: 'f', H: 1.66, skin: 3, hair: 'ponytail', hairColor: 1, top: 'tshirt', topColor: '#5b8fd6', bottom: 'trousers', bottomColor: '#5b8fd6', shoes: 'sneaker', shoeColor: '#f2f2f2', badge: true, stethoscope: true },
  paramedic: { sex: 'm', H: 1.79, skin: 1, hair: 'short', hairColor: 3, top: 'shirt', topColor: '#2e5d3a', bottom: 'trousers', bottomColor: '#24402c', shoes: 'boot', shoeColor: '#111111', bands: true, badge: true, belt: true },
  mechanic: { sex: 'm', H: 1.77, skin: 4, hair: 'short', hairColor: 0, top: 'longsleeve', topColor: '#3c4a5c', bottom: 'jeans', bottomColor: '#2a3a52', overalls: '#2a3a52', shoes: 'boot', shoeColor: '#2a2a2a', hat: 'cap', hatColor: '#c0392b', hold: 'wrench' },
  pilot: { sex: 'm', H: 1.8, skin: 2, hair: 'short', hairColor: 2, top: 'suit', topColor: '#1b2638', under: '#f4f4f4', tie: '#111111', bottom: 'trousers', bottomColor: '#1b2638', shoes: 'dress', shoeColor: '#111111', hat: 'policecap', hatColor: '#1b2638', hold: 'briefcase' },
  'flight-attendant': { sex: 'f', H: 1.7, skin: 1, hair: 'bun', hairColor: 4, top: 'blazer', topColor: '#22325a', under: '#f4f4f4', bottom: 'pencil', bottomColor: '#22325a', shoes: 'heel', shoeColor: '#111111', scarf: '#b3261e' },
  'security-guard': { sex: 'm', H: 1.85, skin: 5, hair: 'buzz', hairColor: 0, top: 'shirt', topColor: '#1a1a1a', bottom: 'trousers', bottomColor: '#1a1a1a', shoes: 'boot', shoeColor: '#111111', badge: true, belt: true, build: 'heavy', hat: 'cap', hatColor: '#111111' },
  teacher: { sex: 'f', H: 1.66, skin: 2, hair: 'bob', hairColor: 2, top: 'cardigan', topColor: '#7a8f6a', under: '#f2ebe0', bottom: 'dress', bottomColor: '#4b5a72', shoes: 'flat', shoeColor: '#5a3a24', glasses: true, hold: 'book' },
  scientist: { sex: 'm', H: 1.75, skin: 0, hair: 'curly', hairColor: 3, top: 'shirt', topColor: '#9fb7cf', bottom: 'trousers', bottomColor: '#3a3f47', shoes: 'dress', shoeColor: '#2a2a2a', labcoat: true, glasses: true, hold: 'tablet' },
  farmer: { sex: 'm', age: 'adult', H: 1.78, skin: 1, hair: 'short', hairColor: 3, top: 'longsleeve', topColor: '#a33b2c', bottom: 'jeans', bottomColor: '#3b5072', overalls: '#3b5072', shoes: 'boot', shoeColor: '#4a3524', hat: 'cowboy', hatColor: '#d8b878', beard: 'stubble' },
  artist: { sex: 'f', H: 1.64, skin: 3, hair: 'wavy', hairColor: 1, top: 'longsleeve', topColor: '#e8e2d2', bottom: 'jeans', bottomColor: '#4a5a6a', shoes: 'sneaker', shoeColor: '#c0392b', apron: true, hat: 'beret', hatColor: '#7a1f2b', hold: 'brush' },
  musician: { sex: 'm', H: 1.78, skin: 2, hair: 'long', hairColor: 0, top: 'tshirt', topColor: '#1a1a1a', bottom: 'jeans', bottomColor: '#1f2633', shoes: 'boot', shoeColor: '#1a1a1a', guitar: true, beard: 'goatee' },
  waiter: { sex: 'm', H: 1.76, skin: 3, hair: 'quiff', hairColor: 0, top: 'shirt', topColor: '#f6f6f4', bottom: 'trousers', bottomColor: '#141414', shoes: 'dress', shoeColor: '#111111', tie: '#141414', apron: true, apronColor: '#141414', hold: 'notepad' },
  cashier: { sex: 'f', H: 1.62, skin: 4, hair: 'ponytail', hairColor: 0, top: 'polo', topColor: '#c0392b', bottom: 'trousers', bottomColor: '#2a2a2a', shoes: 'sneaker', shoeColor: '#1a1a1a', badge: true, apron: true, apronColor: '#1f3a5a' },
  judge: { sex: 'm', age: 'elder', H: 1.74, skin: 1, hair: 'balding', hairColor: 6, top: 'shirt', topColor: '#f4f4f4', bottom: 'trousers', bottomColor: '#1a1a1a', shoes: 'dress', shoeColor: '#111111', coat: 'robe', coatColor: '#121212', glasses: true, hold: 'gavel' },
  astronaut: { sex: 'm', H: 1.8, skin: 2, hair: 'buzz', hairColor: 1, top: 'spacesuit', topColor: '#f0f0ee', bottom: 'trousers', bottomColor: '#f0f0ee', shoes: 'boot', shoeColor: '#e8e8e6', hat: 'spacehelmet', hatColor: '#f0f0ee', backpack: '#e8e8e6', gloves: '#e8e8e6' },
  hiker: { sex: 'm', H: 1.78, skin: 1, hair: 'short', hairColor: 2, top: 'longsleeve', topColor: '#4a6b3a', bottom: 'trousers', bottomColor: '#8a7a5a', shoes: 'boot', shoeColor: '#5a4030', hat: 'sunhat', hatColor: '#c8b48a', backpack: '#c0582b', hold: 'pole', beard: 'full' },
  skier: { sex: 'f', H: 1.68, skin: 0, hair: 'long', hairColor: 4, top: 'longsleeve', topColor: '#c62828', bottom: 'trousers', bottomColor: '#1a1a1a', shoes: 'boot', shoeColor: '#f2f2f2', coat: 'puffer', coatColor: '#c62828', hat: 'beanie', hatColor: '#f2f2f2', goggles: true, gloves: '#1a1a1a' },
  runner: { sex: 'f', H: 1.68, skin: 4, hair: 'ponytail', hairColor: 0, top: 'tank', topColor: '#e84a7a', bottom: 'leggings', bottomColor: '#1a1a1a', shoes: 'sneaker', shoeColor: '#ff7a2f', build: 'athletic', headphones: true, fitted: true },
  cyclist: { sex: 'm', H: 1.79, skin: 2, hair: 'short', hairColor: 1, top: 'jersey', topColor: '#f2c200', bottom: 'trunks', bottomColor: '#1a1a1a', shoes: 'sneaker', shoeColor: '#1a1a1a', hat: 'bikehelmet', hatColor: '#f2f2f2', glasses: 'sun', build: 'athletic' },
  swimmer: { sex: 'f', H: 1.72, skin: 2, hair: 'bun', hairColor: 3, top: 'swim', topColor: '#1565c0', bottom: 'trunks', bottomColor: '#1565c0', shoes: 'none', hat: 'swimcap', hatColor: '#1565c0', build: 'athletic' },
  lifeguard: { sex: 'm', H: 1.84, skin: 3, hair: 'quiff', hairColor: 4, top: 'tank', topColor: '#d32f2f', bottom: 'shorts', bottomColor: '#d32f2f', shoes: 'sandal', shoeColor: '#f2c200', build: 'athletic', glasses: 'sun' },
  courier: { sex: 'm', H: 1.77, skin: 4, hair: 'short', hairColor: 0, top: 'polo', topColor: '#6b3fa0', bottom: 'shorts', bottomColor: '#2a2a2a', shoes: 'sneaker', shoeColor: '#1a1a1a', hat: 'cap', hatColor: '#6b3fa0', hold: 'parcel' },
  'mail-carrier': { sex: 'f', H: 1.68, skin: 1, hair: 'ponytail', hairColor: 2, top: 'shirt', topColor: '#8fb3d9', bottom: 'trousers', bottomColor: '#22325a', shoes: 'sneaker', shoeColor: '#1a1a1a', bag: '#22325a', hat: 'cap', hatColor: '#22325a' },
  barista: { sex: 'f', H: 1.64, skin: 2, hair: 'bob', hairColor: 5, top: 'tshirt', topColor: '#1a1a1a', bottom: 'jeans', bottomColor: '#2b3a55', shoes: 'sneaker', shoeColor: '#f2f2f2', apron: true, apronColor: '#6b4a2b', hold: 'coffee' },
  gardener: { sex: 'm', age: 'adult', H: 1.74, skin: 3, hair: 'short', hairColor: 2, top: 'tshirt', topColor: '#d8cfa8', bottom: 'jeans', bottomColor: '#3d4f3a', overalls: '#3d5a34', shoes: 'boot', shoeColor: '#2f4a2a', hat: 'sunhat', hatColor: '#d8c088', gloves: '#5a7a3a', hold: 'trowel' },
  'office-worker': { sex: 'm', H: 1.77, skin: 1, hair: 'short', hairColor: 1, top: 'shirt', topColor: '#e3ebf5', bottom: 'trousers', bottomColor: '#3a3f47', shoes: 'dress', shoeColor: '#3b2a1e', tie: '#2c4a7a', glasses: true, hold: 'phone' },
  shopper: { sex: 'f', H: 1.66, skin: 3, hair: 'wavy', hairColor: 1, top: 'longsleeve', topColor: '#d9c7a8', bottom: 'jeans', bottomColor: '#2b3a55', shoes: 'flat', shoeColor: '#6b4a2b', coat: 'overcoat', coatColor: '#8a5a3a', hold: 'shopping-bag' },
  grandpa: { sex: 'm', age: 'elder', H: 1.7, skin: 2, hair: 'balding', hairColor: 6, top: 'longsleeve', topColor: '#8a9a7a', bottom: 'trousers', bottomColor: '#6b5b45', shoes: 'dress', shoeColor: '#3b2a1e', hat: 'fedora', hatColor: '#4a4036', hold: 'cane', beard: 'moustache', build: 'slim' },
  'teen-boy': { sex: 'm', age: 'teen', H: 1.7, skin: 3, hair: 'quiff', hairColor: 1, top: 'hoodie', topColor: '#3a3a3a', bottom: 'jeans', bottomColor: '#3a4a66', shoes: 'sneaker', shoeColor: '#f2f2f2', headphones: true, build: 'slim' },
  'teen-girl': { sex: 'f', age: 'teen', H: 1.62, skin: 1, hair: 'long', hairColor: 4, top: 'tshirt', topColor: '#f2a7c3', bottom: 'skirt', bottomColor: '#2b3a55', shoes: 'sneaker', shoeColor: '#f2f2f2', backpack: '#5d8aa8', fitted: true },
  'toddler-boy': { sex: 'm', age: 'toddler', H: 0.92, skin: 1, hair: 'curly', hairColor: 4, top: 'tshirt', topColor: '#5b9bd5', bottom: 'shorts', bottomColor: '#e0c060', shoes: 'sneaker', shoeColor: '#c0392b' },
  'toddler-girl': { sex: 'f', age: 'toddler', H: 0.9, skin: 3, hair: 'bob', hairColor: 0, top: 'tshirt', topColor: '#f2c0d0', bottom: 'dress', bottomColor: '#f29ab4', shoes: 'flat', shoeColor: '#f2f2f2' },
  photographer: { sex: 'f', H: 1.67, skin: 4, hair: 'wavy', hairColor: 0, top: 'longsleeve', topColor: '#3a4a3a', bottom: 'jeans', bottomColor: '#2b3a55', shoes: 'boot', shoeColor: '#4a3524', camera: true, bag: '#3a3a3a', hat: 'beanie', hatColor: '#5a4a3a' },
};

/* ---------------- trims ---------------- */
const HATS_COVER = ['spacehelmet', 'swimcap'];
const HAIR_TRIMS = { buzzcut: 'buzz', curly: 'curly', 'long-hair': 'long', ponytail: 'ponytail', bun: 'bun', afro: 'afro', bald: 'bald', bob: 'bob', braid: 'braid' };
const HOLD_TRIMS = ['phone', 'coffee', 'umbrella', 'shopping-bag', 'briefcase'];

/** Which trims make sense for a recipe. */
export function trimsFor(name) {
  const s = PERSON_VARIANTS[name];
  const kid = s.age === 'child' || s.age === 'toddler';
  const elder = s.age === 'elder';
  const special = s.top === 'spacesuit' || s.top === 'swim';
  const out = [];
  if (s.age !== 'toddler') out.push('alt');
  if (!kid && !elder && s.age !== 'teen') out.push('young', 'senior', 'tall');
  if (s.age !== 'toddler') out.push('heavy', 'slim');
  if (!HATS_COVER.includes(s.hat)) {
    for (const [t, h] of Object.entries(HAIR_TRIMS)) if (h !== s.hair && !(t === 'bald' && kid)) out.push(t);
  }
  if (!kid && s.sex === 'm') for (const b of ['beard', 'stubble', 'moustache']) if (s.beard !== { stubble: 'stubble', beard: 'full', moustache: 'moustache' }[b]) out.push(b);
  if (!s.goggles && !HATS_COVER.includes(s.hat)) {
    if (!s.glasses) out.push('glasses');
    if (s.glasses !== 'sun') out.push('sunglasses');
  }
  if (!s.hat) out.push('cap', 'beanie', 'sunhat');
  if (!special) {
    if (!s.backpack && !s.guitar) out.push('backpack');
    if (!s.headphones) out.push('headphones');
    if (!s.bag) out.push('shoulder-bag');
    if (!s.scarf) out.push('scarf');
    if (!s.hold && !kid) out.push(...HOLD_TRIMS);
    if (!s.coat && !s.labcoat) out.push('winter', 'rain');
    if (!['shorts', 'trunks'].includes(s.bottom) && !s.coat) out.push('summer');
  }
  return out;
}

/** Apply a trim to a copy of a recipe. */
export function applyTrim(spec, trim, name = '') {
  const s = { ...spec };
  if (!trim) return s;
  const h = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  switch (trim) {
    case 'alt':
      if (s.sex === 'f') {
        s.sex = 'm';
        s.H *= 1.07;
        s.fitted = false;
        if (['skirt', 'dress', 'pencil'].includes(s.bottom)) s.bottom = 'trousers';
        if (s.top === 'swim') s.top = 'none';
        if (['long', 'bun', 'ponytail', 'bob', 'braid', 'wavy'].includes(s.hair)) s.hair = ['short', 'quiff', 'short', 'curly'][h % 4];
      } else {
        s.sex = 'f';
        s.H /= 1.07;
        s.fitted = true;
        delete s.beard;
        if (s.top === 'none') s.top = 'swim';
        if (['short', 'buzz', 'balding', 'quiff', 'bald'].includes(s.hair)) s.hair = s.hat ? ['bun', 'ponytail'][h % 2] : ['long', 'bob', 'ponytail', 'bun'][h % 4];
      }
      break;
    case 'young':
      s.age = 'teen';
      s.H *= 0.96;
      if (s.build === 'heavy') delete s.build;
      delete s.beard;
      break;
    case 'senior':
      s.age = 'elder';
      s.hairColor = 6;
      if (s.sex === 'm' && ['short', 'quiff', 'curly'].includes(s.hair)) s.hair = 'balding';
      if (!s.glasses && !s.goggles) s.glasses = true;
      s.H *= 0.98;
      break;
    case 'tall': s.H *= 1.07; break;
    case 'heavy': s.build = 'heavy'; break;
    case 'slim': s.build = 'slim'; break;
    case 'beard': s.beard = 'full'; break;
    case 'stubble': s.beard = 'stubble'; break;
    case 'moustache': s.beard = 'moustache'; break;
    case 'glasses': s.glasses = true; break;
    case 'sunglasses': s.glasses = 'sun'; break;
    case 'cap': s.hat = 'cap'; s.hatColor = ['#c0392b', '#1f3a5a', '#1a1a1a', '#2e6b4e'][h % 4]; break;
    case 'beanie': s.hat = 'beanie'; s.hatColor = ['#3a3a3a', '#7a1f2b', '#2c4a7a', '#d98c2b'][h % 4]; break;
    case 'sunhat': s.hat = 'sunhat'; s.hatColor = '#d8c088'; break;
    case 'backpack': s.backpack = ['#c0392b', '#2c4a7a', '#3a3a3a', '#2e6b4e'][h % 4]; break;
    case 'headphones': s.headphones = true; break;
    case 'shoulder-bag': s.bag = ['#6b4a2b', '#1a1a1a', '#8a5a3a'][h % 3]; break;
    case 'scarf': s.scarf = ['#b3261e', '#2c4a7a', '#d9c7a8', '#3a5a3a'][h % 4]; break;
    case 'phone': case 'coffee': case 'umbrella': case 'shopping-bag': case 'briefcase': s.hold = trim; break;
    case 'winter':
      s.coat = 'puffer';
      s.coatColor = ['#1f2a44', '#7a1f2b', '#3a3a3a', '#2e5d3a'][h % 4];
      s.scarf = s.scarf ?? ['#d9c7a8', '#b3261e', '#f2f2f2'][h % 3];
      if (!s.hat) { s.hat = 'beanie'; s.hatColor = ['#3a3a3a', '#d9c7a8', '#7a1f2b'][h % 3]; }
      if (['shorts', 'trunks'].includes(s.bottom)) s.bottom = 'trousers';
      if (s.shoes !== 'boot') { s.shoes = 'boot'; s.shoeColor = '#3b2a1e'; }
      s.gloves = s.gloves ?? '#2a2a2a';
      break;
    case 'rain':
      s.coat = 'rain';
      s.coatColor = ['#f2c200', '#2c6ab0', '#c0392b'][h % 3];
      s.shoes = 'boot';
      s.shoeColor = s.coatColor === '#f2c200' ? '#2a5a2a' : '#1a1a1a';
      if (!s.hold) s.hold = 'umbrella';
      break;
    case 'summer':
      s.bottom = s.bottom === 'dress' || s.bottom === 'skirt' ? s.bottom : 'shorts';
      if (['longsleeve', 'shirt', 'hoodie', 'cardigan', 'suit', 'blazer'].includes(s.top)) { s.top = s.top === 'shirt' ? 'polo' : 'tshirt'; delete s.tie; }
      if (!s.glasses) s.glasses = 'sun';
      s.shoes = 'sandal';
      s.shoeColor = ['#6b4a2b', '#1a1a1a', '#c49a6c'][h % 3];
      delete s.scarf;
      delete s.gloves;
      break;
    default:
      if (HAIR_TRIMS[trim]) s.hair = HAIR_TRIMS[trim];
  }
  return s;
}
