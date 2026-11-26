// Catalog entries owned by src/models/buildings*. Merged by src/catalog.js.
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
// Trims = styles from src/models/buildings/style.js (kept inline so the catalog loads no model code).
const HOUSE_TRIMS = ['brick', 'stone', 'timber', 'tudor', 'colonial', 'mediterranean', 'nordic', 'modern', 'hip', 'mansard', 'weathered', 'abandoned', 'winter', 'solar', 'ivy', 'fenced'];
const BUILDING_TRIMS = ['brick', 'stone', 'modern', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'];

const without = (list, ...drop) => list.filter((t) => !drop.includes(t));

export default {
  "house": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createHouse",
    "label": "House",
    "variants": [
      "cottage",
      "suburban",
      "modern",
      "farmhouse",
      "bungalow",
      "victorian",
      "cabin",
      "townhouse",
      "mansion",
      "duplex", "ranch", "a-frame", "villa", "beach-house", "mobile-home", "tiny-house"
    ],
    "trims": {
      cottage: HOUSE_TRIMS, suburban: HOUSE_TRIMS, farmhouse: HOUSE_TRIMS, bungalow: HOUSE_TRIMS, victorian: HOUSE_TRIMS,
      cabin: without(HOUSE_TRIMS, 'timber'), mansion: without(HOUSE_TRIMS, 'stone'),
      modern: without(HOUSE_TRIMS, 'hip', 'mansard', 'modern', 'colonial', 'nordic'),
      townhouse: without(HOUSE_TRIMS, 'brick', 'hip', 'mansard', 'fenced'),
      duplex: HOUSE_TRIMS, ranch: HOUSE_TRIMS, 'a-frame': without(HOUSE_TRIMS, 'hip', 'mansard', 'colonial', 'tudor', 'mediterranean'),
      villa: without(HOUSE_TRIMS, 'mediterranean', 'hip'), 'beach-house': without(HOUSE_TRIMS, 'stone', 'brick'),
      'mobile-home': ['weathered', 'abandoned', 'winter', 'solar', 'ivy', 'fenced', 'modern', 'nordic'], 'tiny-house': ['timber', 'nordic', 'modern', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'],
    },
    "options": {
      "color": "wall color",
      "roofColor": "roof color",
      "trimColor": "trim color",
      "accentColor": "shutters/porch",
      "doorColor": "door",
      "seed": "townhouse brick tones",
      "lightsOn": "windows lit at night"
    }
  },
  "apartment": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createApartment",
    "label": "Apartment",
    "variants": [
      "brick",
      "modern",
      "classic",
      "tower"
    ],
    "trims": { brick: ['low', 'high', ...without(BUILDING_TRIMS, 'brick')], modern: ['low', 'high', 'highrise', ...without(BUILDING_TRIMS, 'modern')], classic: ['low', 'high', ...BUILDING_TRIMS], tower: ['low', 'highrise', ...without(BUILDING_TRIMS, 'stone')] },
    "options": {
      "floors": "number of floors (2–40)",
      "color": "wall color",
      "roofColor": "roof",
      "trimColor": "trim",
      "accentColor": "railings/frames",
      "lightsOn": "boolean"
    }
  },
  "skyscraper": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createSkyscraper",
    "label": "Skyscraper",
    "variants": [
      "glass",
      "office",
      "tapered",
      "art-deco",
      "twisted",
      "cylinder"
    ],
    "trims": ['short', 'tall', 'supertall', 'spire', 'helipad', 'twin', 'podium'],
    "options": {
      "floors": "number of floors (8–120)",
      "color": "glass tint",
      "trimColor": "mullions/stone",
      "seed": "lit-window pattern",
      "lightsOn": "boolean"
    }
  },
  "shop": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createShop",
    "label": "Shop",
    "variants": [
      "cafe",
      "grocery",
      "bakery",
      "gas-station",
      "pharmacy",
      "restaurant"
    ],
    "trims": BUILDING_TRIMS,
    "options": {
      "color": "wall color",
      "accentColor": "awning color",
      "trimColor": "trim/brand color",
      "roofColor": "roof",
      "lightsOn": "boolean"
    }
  },
  "garage": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createGarage",
    "label": "Garage",
    "variants": [
      "single",
      "double",
      "carport"
    ],
    "trims": BUILDING_TRIMS,
    "options": {
      "color": "wall",
      "roofColor": "roof",
      "doorColor": "garage door"
    }
  },
  "barn": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createBarn",
    "label": "Barn",
    "variants": [
      "gambrel",
      "gable"
    ],
    "trims": BUILDING_TRIMS,
    "options": {
      "color": "wall",
      "roofColor": "roof",
      "trimColor": "trim"
    }
  },
  "church": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createChurch",
    "label": "Church",
    "variants": [
      "chapel",
      "stone"
    ],
    "trims": BUILDING_TRIMS,
    "options": {
      "color": "wall",
      "roofColor": "roof",
      "lightsOn": "stained glass glow"
    }
  },
  "school": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createSchool",
    "label": "School",
    "variants": [
      "standard",
      "modern"
    ],
    "trims": { standard: without(BUILDING_TRIMS, 'brick'), modern: without(BUILDING_TRIMS, 'modern') },
    "options": {
      "color": "wall",
      "trimColor": "trim",
      "flagColor": "flag",
      "lightsOn": "boolean"
    }
  },
  "fire-station": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createFireStation",
    "label": "Fire station",
    "variants": [
      "standard",
      "modern"
    ],
    "trims": BUILDING_TRIMS,
    "options": {
      "color": "wall",
      "doorColor": "bay doors",
      "lightsOn": "boolean"
    }
  },
  "hospital": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createHospital",
    "label": "Hospital",
    "variants": [
      "standard",
      "clinic"
    ],
    "trims": BUILDING_TRIMS,
    "options": {
      "floors": "number",
      "color": "wall",
      "trimColor": "window frames",
      "lightsOn": "boolean"
    }
  },
  "warehouse": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createWarehouse",
    "label": "Warehouse",
    "variants": [
      "standard",
      "cold"
    ],
    "trims": BUILDING_TRIMS,
    "options": {
      "color": "cladding",
      "roofColor": "roof",
      "trimColor": "brand band",
      "doorColor": "dock doors"
    }
  },
  "lighthouse": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createLighthouse",
    "label": "Lighthouse",
    "variants": [
      "striped",
      "classic"
    ],
    "trims": ['weathered', 'abandoned', 'winter'],
    "options": {
      "color": "band A",
      "accentColor": "band B",
      "beams": "true adds light beams",
      "lightsOn": "boolean"
    }
  },
  "windmill": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createWindmill",
    "label": "Windmill",
    "variants": [
      "dutch",
      "stone",
      "windpump"
    ],
    "trims": { dutch: ['brick', 'modern', 'winter'], stone: ['brick', 'modern', 'winter'], windpump: [] },
    "options": {
      "color": "tower",
      "sailColor": "sails"
    }
  },
  "tent": {
    "category": "buildings",
    "source": "js",
    "module": "buildings",
    "factory": "createTent",
    "label": "Tent",
    "variants": [
      "dome",
      "a-frame",
      "circus"
    ],
    "trims": [],
    "options": {
      "color": "fabric",
      "accentColor": "trim fabric"
    }
  },
  // ---- commercial (city.js) ----
  hotel: { category: 'buildings', sub: 'commercial', source: 'js', module: 'buildings', factory: 'createHotel', label: 'Hotel',
    variants: ['highrise', 'motel', 'resort', 'boutique'],
    trims: { highrise: ['low', 'high', ...without(BUILDING_TRIMS, 'modern')], motel: ['high', ...BUILDING_TRIMS], resort: ['low', 'high', ...BUILDING_TRIMS], boutique: ['low', 'high', ...without(BUILDING_TRIMS, 'brick')] },
    options: { color: 'wall color', roofColor: 'roof', trimColor: 'trim', accentColor: 'canopy/doors', lightsOn: 'boolean' } },
  office: { category: 'buildings', sub: 'commercial', source: 'js', module: 'buildings', factory: 'createOffice', label: 'Office',
    variants: ['lowrise', 'midrise', 'campus'], trims: ['low', 'high', ...BUILDING_TRIMS],
    options: { color: 'wall color', trimColor: 'bands/fins', accentColor: 'glass tint', lightsOn: 'boolean' } },
  bank: { category: 'buildings', sub: 'commercial', source: 'js', module: 'buildings', factory: 'createBank', label: 'Bank',
    variants: ['classic', 'modern'], trims: { classic: ['high', ...without(BUILDING_TRIMS, 'stone')], modern: ['high', ...without(BUILDING_TRIMS, 'modern')] },
    options: { color: 'wall color', trimColor: 'columns/trim', lightsOn: 'boolean' } },
  'police-station': { category: 'buildings', sub: 'civic', source: 'js', module: 'buildings', factory: 'createPoliceStation', label: 'Police Station',
    variants: ['standard', 'modern'], trims: { standard: ['high', ...without(BUILDING_TRIMS, 'brick')], modern: ['high', ...without(BUILDING_TRIMS, 'modern')] },
    options: { color: 'wall color', trimColor: 'trim', accentColor: 'police blue', lightsOn: 'boolean' } },
  restaurant: { category: 'buildings', sub: 'commercial', source: 'js', module: 'buildings', factory: 'createRestaurant', label: 'Restaurant',
    variants: ['diner', 'pizzeria', 'fast-food', 'steakhouse', 'sushi'],
    trims: { diner: ['weathered', 'abandoned', 'winter'], pizzeria: BUILDING_TRIMS, 'fast-food': without(BUILDING_TRIMS, 'stone'), steakhouse: without(BUILDING_TRIMS, 'modern'), sushi: BUILDING_TRIMS },
    options: { color: 'wall color', trimColor: 'brand color', accentColor: 'awning/umbrellas', lightsOn: 'boolean' } },
  supermarket: { category: 'buildings', sub: 'commercial', source: 'js', module: 'buildings', factory: 'createSupermarket', label: 'Supermarket & Mall',
    variants: ['supermarket', 'mall', 'big-box'], trims: { supermarket: BUILDING_TRIMS, mall: ['low', 'high', ...BUILDING_TRIMS], 'big-box': without(BUILDING_TRIMS, 'modern') },
    options: { color: 'wall color', trimColor: 'brand color', lightsOn: 'boolean' } },
  'gas-station': { category: 'buildings', sub: 'commercial', source: 'js', module: 'buildings', factory: 'createGasStation', label: 'Gas Station',
    variants: ['modern', 'retro', 'truck-stop'], trims: ['weathered', 'abandoned', 'winter', 'solar', 'brick', 'stone'],
    options: { color: 'wall color', trimColor: 'brand color', lightsOn: 'boolean' } },
  // ---- landmarks (landmarks.js) ----
  museum: { category: 'buildings', sub: 'civic', source: 'js', module: 'buildings', factory: 'createMuseum', label: 'Museum & Library',
    variants: ['classical', 'modern', 'library', 'modern-library'],
    trims: { classical: ['high', ...without(BUILDING_TRIMS, 'stone')], modern: ['high', ...without(BUILDING_TRIMS, 'modern')], library: ['high', ...without(BUILDING_TRIMS, 'stone')], 'modern-library': ['high', ...without(BUILDING_TRIMS, 'modern')] },
    options: { color: 'wall color', roofColor: 'roof/dome', trimColor: 'columns/trim', lightsOn: 'boolean' } },
  'civic-hall': { category: 'buildings', sub: 'civic', source: 'js', module: 'buildings', factory: 'createCivicHall', label: 'City Hall & Courthouse',
    variants: ['city-hall', 'courthouse', 'town-hall'],
    trims: { 'city-hall': ['low', 'high', ...without(BUILDING_TRIMS, 'stone')], courthouse: ['low', 'high', ...without(BUILDING_TRIMS, 'brick')], 'town-hall': ['high', ...BUILDING_TRIMS] },
    options: { color: 'wall color', roofColor: 'roof/dome', trimColor: 'trim', lightsOn: 'boolean' } },
  castle: { category: 'buildings', sub: 'landmark', source: 'js', module: 'buildings', factory: 'createCastle', label: 'Castle & Palace',
    variants: ['keep', 'fortress', 'palace'],
    trims: { keep: ['low', 'high', 'weathered', 'abandoned', 'winter', 'ivy', 'brick'], fortress: ['high', 'weathered', 'abandoned', 'winter', 'ivy', 'brick'], palace: ['low', 'high', 'brick', 'stone', 'weathered', 'abandoned', 'winter', 'ivy'] },
    options: { color: 'wall color', roofColor: 'roofs', trimColor: 'trim', lightsOn: 'boolean' } },
  temple: { category: 'buildings', sub: 'religious', source: 'js', module: 'buildings', factory: 'createTemple', label: 'Temple, Mosque & Cathedral',
    variants: ['greek', 'pagoda', 'mosque', 'shrine', 'cathedral'],
    trims: { greek: ['weathered', 'abandoned', 'winter', 'ivy'], pagoda: ['low', 'high', 'weathered', 'winter'], mosque: ['high', 'weathered', 'winter', 'stone', 'brick'], shrine: ['weathered', 'abandoned', 'winter', 'ivy'], cathedral: ['weathered', 'abandoned', 'winter', 'ivy', 'brick'] },
    options: { color: 'wall color', roofColor: 'roof/dome', trimColor: 'trim', accentColor: 'accent (torii, finial)', lightsOn: 'boolean' } },
  stadium: { category: 'buildings', sub: 'landmark', source: 'js', module: 'buildings', factory: 'createStadium', label: 'Stadium',
    variants: ['arena', 'ballpark'], trims: ['low', 'high', 'brick', 'weathered', 'abandoned', 'winter'],
    options: { color: 'outer wall', trimColor: 'team color', accentColor: 'seats', lightsOn: 'boolean' } },
  'train-station': { category: 'buildings', sub: 'civic', source: 'js', module: 'buildings', factory: 'createTrainStation', label: 'Train Station',
    variants: ['classic', 'platform', 'modern'],
    trims: { classic: ['high', ...without(BUILDING_TRIMS, 'brick')], platform: ['high', ...BUILDING_TRIMS], modern: ['high', ...without(BUILDING_TRIMS, 'modern')] },
    options: { color: 'wall color', roofColor: 'roof', trimColor: 'trim', accentColor: 'line color', lightsOn: 'boolean' } },
  airport: { category: 'buildings', sub: 'civic', source: 'js', module: 'buildings', factory: 'createAirport', label: 'Airport',
    variants: ['terminal', 'control-tower', 'hangar'],
    trims: { terminal: ['low', 'high', 'weathered', 'abandoned', 'winter', 'solar'], 'control-tower': ['low', 'high', 'weathered', 'winter', 'brick'], hangar: ['weathered', 'abandoned', 'winter'] },
    options: { color: 'wall color', roofColor: 'roof', trimColor: 'frames', accentColor: 'signage', lightsOn: 'boolean' } },
  'parking-garage': { category: 'buildings', sub: 'civic', source: 'js', module: 'buildings', factory: 'createParkingGarage', label: 'Parking Garage',
    variants: ['open-deck', 'clad'], trims: ['low', 'high', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'],
    options: { color: 'concrete color', trimColor: 'trim', accentColor: 'barrier color' } },
  // ---- industrial, farm & infrastructure (infra.js) ----
  factory: { category: 'buildings', sub: 'industrial', source: 'js', module: 'buildings', factory: 'createFactory', label: 'Factory',
    variants: ['brick-mill', 'plant', 'brewery'],
    trims: { 'brick-mill': ['low', 'high', 'stone', 'modern', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'], plant: ['high', 'brick', 'weathered', 'abandoned', 'winter', 'solar'], brewery: ['high', 'stone', 'modern', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'] },
    options: { color: 'wall color', roofColor: 'roof', trimColor: 'trim', accentColor: 'accent', lightsOn: 'boolean' } },
  'power-plant': { category: 'buildings', sub: 'industrial', source: 'js', module: 'buildings', factory: 'createPowerPlant', label: 'Power Plant',
    variants: ['cooling', 'coal', 'substation'],
    trims: { cooling: ['high', 'brick', 'weathered', 'abandoned', 'winter'], coal: ['high', 'brick', 'weathered', 'abandoned', 'winter'], substation: ['weathered', 'abandoned', 'winter', 'brick'] },
    options: { color: 'wall color', trimColor: 'trim', accentColor: 'accent' } },
  bridge: { category: 'buildings', sub: 'infrastructure', source: 'js', module: 'buildings', factory: 'createBridge', label: 'Bridge',
    variants: ['stone-arch', 'truss', 'suspension', 'footbridge'],
    trims: { 'stone-arch': ['low', 'high', 'brick', 'weathered', 'winter', 'ivy'], truss: ['low', 'high', 'weathered', 'abandoned', 'winter'], suspension: ['low', 'high', 'weathered', 'winter'], footbridge: ['low', 'high', 'weathered', 'winter'] },
    options: { color: 'stone/concrete color', trimColor: 'steel / rail color' } },
  tunnel: { category: 'buildings', sub: 'infrastructure', source: 'js', module: 'buildings', factory: 'createTunnel', label: 'Tunnel Portal',
    variants: ['road', 'rail'], trims: ['brick', 'stone', 'weathered', 'abandoned', 'winter', 'ivy'],
    options: { color: 'portal color', trimColor: 'coping', accentColor: 'chevrons' } },
  silo: { category: 'buildings', sub: 'farm', source: 'js', module: 'buildings', factory: 'createSilo', label: 'Silo & Water Tower',
    variants: ['grain', 'farm', 'water-tower', 'water-column'],
    trims: { grain: ['low', 'high', 'weathered', 'abandoned', 'winter'], farm: ['low', 'high', 'stone', 'weathered', 'abandoned', 'winter', 'ivy'], 'water-tower': ['low', 'high', 'weathered', 'abandoned', 'winter'], 'water-column': ['low', 'high', 'brick', 'weathered', 'winter'] },
    options: { color: 'tank/wall color', roofColor: 'roof', trimColor: 'legs/bands', accentColor: 'band' } },
  greenhouse: { category: 'buildings', sub: 'farm', source: 'js', module: 'buildings', factory: 'createGreenhouse', label: 'Greenhouse',
    variants: ['glass-house', 'polytunnel', 'conservatory'],
    trims: { 'glass-house': ['low', 'high', 'brick', 'stone', 'weathered', 'abandoned'], polytunnel: ['low', 'high', 'weathered'], conservatory: ['low', 'high', 'stone', 'weathered', 'ivy'] },
    options: { trimColor: 'frame color' } },
  shed: { category: 'buildings', sub: 'residential', source: 'js', module: 'buildings', factory: 'createShed', label: 'Shed',
    variants: ['garden', 'metal', 'lean-to', 'tiny-cabin'],
    trims: { garden: ['brick', 'stone', 'nordic', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'], metal: ['weathered', 'abandoned', 'winter', 'solar'], 'lean-to': ['weathered', 'abandoned', 'winter', 'ivy'], 'tiny-cabin': ['stone', 'nordic', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'] },
    options: { color: 'wall color', roofColor: 'roof', doorColor: 'door' } },
  treehouse: { category: 'buildings', sub: 'residential', source: 'js', module: 'buildings', factory: 'createTreehouse', label: 'Treehouse',
    variants: ['classic', 'lookout'], trims: ['weathered', 'abandoned', 'winter', 'nordic'],
    options: { color: 'wall color', roofColor: 'roof', accentColor: 'flag' } },
};
