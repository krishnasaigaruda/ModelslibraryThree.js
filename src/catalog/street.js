// Catalog entries owned by src/models/street*. Merged by src/catalog.js.
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
//
// Condition trims every street prop understands (src/models/street/kit.js):
//   rusty · damaged · graffiti · posters · snowy   (+ generic styles: plinth, bollards)
const C = ['rusty', 'damaged', 'graffiti', 'posters', 'snowy'];
const C_NO_POSTER = ['rusty', 'damaged', 'graffiti', 'snowy'];
const C_SMALL = ['rusty', 'damaged', 'snowy'];
const e = (sub, factory, label, variants, trims, options = {}) => ({ category: 'street', sub, source: 'js', module: 'street', factory, label, variants, trims, options });
const perVariant = (variants, fn) => Object.fromEntries(variants.map((v) => [v, fn(v)]));

const STREETLIGHTS = ['modern', 'double', 'highway', 'classic', 'globe', 'deco', 'pendant', 'post-top', 'solar'];
const TRAFFIC = ['pole', 'overhead', 'arrow', 'pedestrian', 'beacon'];
const SIGNS = ['stop', 'yield', 'speed', 'no-entry', 'parking', 'no-parking', 'one-way', 'pedestrian-crossing', 'school', 'roundabout', 'turn-left', 'turn-right', 'dead-end', 'deer', 'slippery', 'roadworks', 'hospital', 'bike-lane', 'street-name', 'height-limit', 'speed-hump', 'curve-ahead'];
const MAILBOXES = ['collection', 'residential', 'pillar', 'parcel-locker', 'cluster', 'rural'];

export default {
  streetlight: e('lighting', 'createStreetlight', 'Streetlight', STREETLIGHTS,
    perVariant(STREETLIGHTS, (v) => [...(['modern', 'double', 'highway', 'solar'].includes(v) ? ['sodium'] : []), 'banner', 'basket', 'sign', 'plinth', ...C]),
    { color: 'pole color', tone: "'led' | 'warm' | 'sodium'", light: 'true adds a real Point/SpotLight', intensity: 'real light intensity', height: 'm' }),
  'traffic-light': e('traffic', 'createTrafficLight', 'Traffic light', TRAFFIC,
    perVariant(TRAFFIC, (v) => (v === 'beacon' ? C : v === 'pedestrian' ? ['countdown', ...C] : ['horizontal', 'countdown', 'camera', ...C])),
    { color: 'housing color' }),
  sign: e('signage', 'createSign', 'Road sign', SIGNS, ['temporary', 'large', 'supplementary', 'flashing', ...C],
    { limit: 'number (speed / height-limit signs)', text: 'street-name sign text' }),
  bench: e('furniture', 'createBench', 'Bench', ['park', 'modern', 'stone', 'backless', 'curved', 'log'], ['armrests', 'plaque', ...C_NO_POSTER],
    { color: 'frame color', wood: 'wood name or color', length: 'm' }),
  'trash-can': e('furniture', 'createTrashCan', 'Trash can', ['park', 'city', 'recycling', 'wheelie', 'dog-waste', 'solar-compactor', 'wire-basket'], ['overflowing', ...C],
    { color: 'body color', seed: 'litter variation' }),
  planter: e('furniture', 'createPlanter', 'Planter', ['box', 'round', 'wooden', 'tree-pit', 'tiered'], ['flowers', 'grasses', 'topiary', ...C_NO_POSTER],
    { color: 'container color', seed: 'plant variation' }),
  fountain: e('furniture', 'createFountain', 'Fountain', ['tiered', 'basin', 'wall', 'plaza-jets'], ['dry', 'lit', 'damaged', 'graffiti', 'snowy'],
    { color: 'stone color' }),
  'bike-rack': e('furniture', 'createBikeRack', 'Bike rack', ['hoop', 'wave', 'wall', 'dock'], ['covered', ...C],
    { color: 'frame color' }),
  'picnic-table': e('furniture', 'createPicnicTable', 'Picnic table', ['classic', 'modern', 'accessible', 'round'], ['umbrella', 'barbecue', ...C_NO_POSTER],
    { wood: 'wood name or color', color: 'frame color' }),
  'drinking-fountain': e('furniture', 'createDrinkingFountain', 'Drinking fountain', ['pedestal', 'bottle-filler', 'stone'], ['dog-bowl', ...C_NO_POSTER],
    { color: 'body color' }),
  'fire-hydrant': e('utilities', 'createFireHydrant', 'Fire hydrant', ['classic', 'yellow', 'pillar', 'european', 'wall-fdc'], ['flagged', 'bollards', ...C_NO_POSTER],
    { color: 'paint color' }),
  mailbox: e('utilities', 'createMailbox', 'Mailbox', MAILBOXES,
    perVariant(MAILBOXES, (v) => [...(v === 'residential' || v === 'rural' ? ['brick-post', 'stone-post'] : ['plinth']), ...C]),
    { color: 'paint color' }),
  'parking-meter': e('utilities', 'createParkingMeter', 'Parking meter', ['single', 'double', 'kiosk', 'solar-paystation'], ['bagged', 'plinth', ...C],
    { color: 'housing color' }),
  'phone-booth': e('utilities', 'createPhoneBooth', 'Phone booth', ['classic', 'modern', 'wall'], ['plinth', ...C],
    { color: 'paint color' }),
  'vending-machine': e('commerce', 'createVendingMachine', 'Vending machine', ['drinks', 'snacks', 'coffee', 'ticket'], ['canopy', 'plinth', ...C],
    { color: 'cabinet color', seed: 'product mix' }),
  'newspaper-box': e('commerce', 'createNewspaperBox', 'Newspaper box', ['single', 'double', 'free'], ['plinth', ...C],
    { color: 'box color' }),
  atm: e('commerce', 'createATM', 'ATM', ['freestanding', 'wall', 'drive-up'], ['bollards', 'plinth', ...C],
    { color: 'housing color' }),
  'ev-charger': e('utilities', 'createEVCharger', 'EV charger', ['pedestal', 'wall', 'fast'], ['canopy', 'bollards', 'plinth', ...C],
    { color: 'housing color' }),
  bollard: e('traffic', 'createBollard', 'Bollard', ['steel', 'concrete', 'lit', 'cast-iron', 'flexible', 'sphere', 'removable'], ['chained', ...C_NO_POSTER],
    { color: 'color' }),
  'traffic-cone': e('traffic', 'createTrafficCone', 'Traffic cone', ['cone', 'tall', 'drum', 'delineator'], ['lit', ...C_SMALL],
    { color: 'plastic color' }),
  barrier: e('traffic', 'createBarrier', 'Barrier', ['jersey', 'sawhorse', 'crowd', 'boom', 'water-filled', 'pedestrian-railing'], ['lit', 'signed', ...C],
    { color: 'stripe / panel color', length: 'm (jersey)' }),
  'bus-stop': e('traffic', 'createBusStop', 'Bus stop', ['shelter', 'pole', 'modern', 'wooden'], ['digital', ...C],
    { color: 'frame / sign color' }),
  'guard-rail': e('traffic', 'createGuardRail', 'Guard rail', ['w-beam', 'cable', 'timber'], ['reflectors', ...C_NO_POSTER],
    { color: 'rail color', length: 'm' }),
  fence: e('roads', 'createFence', 'Fence', ['picket', 'chain-link', 'iron', 'wooden', 'palisade', 'post-rail', 'stone-wall', 'glass'], ['gate', 'ivy', ...C_NO_POSTER],
    { color: 'color', length: 'm', height: 'm', seed: 'variation' }),
  road: e('roads', 'createRoad', 'Road', ['straight', 'crosswalk', 'intersection', 'dead-end', 'bike-lane', 'bus-lane', 'parking', 'rural'], ['wet', 'potholes', 'worn', 'leaves', 'snowy'],
    { lanes: 'number of lanes', length: 'm', sidewalk: 'sidewalk width (m)', seed: 'asphalt variation' }),

  'road-kit': {
    ...e('roads', 'createRoadKit', 'Road kit (12 m tiles)',
      ['straight', 'curve-tight', 'curve-medium', 'curve-wide', 't-junction', 'crossroads', 'roundabout', 'highway-2', 'highway-4', 'highway-6', 'on-ramp', 'off-ramp', 'overpass', 'bridge', 'tunnel', 'dead-end', 'cul-de-sac', 'parking-lot', 'parking-angled', 'bus-lane', 'bike-lane', 'crosswalk', 'rail-crossing', 'dirt-road', 'cobblestone', 'gravel-path', 'driveway', 'alley'],
      {
        ...Object.fromEntries(['straight', 'curve-tight', 'curve-medium', 'curve-wide', 't-junction', 'crossroads', 'roundabout', 'highway-2', 'highway-4', 'highway-6', 'on-ramp', 'off-ramp', 'overpass', 'bridge', 'tunnel', 'dead-end', 'cul-de-sac', 'parking-lot', 'parking-angled', 'bus-lane', 'bike-lane', 'crosswalk', 'rail-crossing'].map((v) => [v, ['new', 'worn', 'wet', 'snowy', 'night', 'country', 'city', 'suburban', 'lht']])),
        'dirt-road': ['worn', 'wet', 'snowy', 'night'], 'gravel-path': ['worn', 'wet', 'snowy', 'night'],
        cobblestone: ['new', 'worn', 'wet', 'snowy', 'night', 'city', 'suburban'],
        driveway: ['new', 'worn', 'wet', 'snowy', 'night', 'country', 'city'], alley: ['new', 'worn', 'wet', 'snowy', 'night', 'country', 'city'],
      },
      { seed: 'wear / puddle variation' }),
    tags: ['road', 'street', 'tile', 'modular', 'lane', 'asphalt', 'highway', 'motorway', 'junction', 'intersection', 'curve', 'roundabout', 'ramp', 'bridge', 'overpass', 'tunnel', 'parking', 'crosswalk', 'zebra', 'railway', 'level crossing', 'cul-de-sac', 'alley', 'driveway', 'cobblestone', 'dirt road', 'gravel', 'sidewalk', 'kerb', 'curb', 'pavement'],
  },
  // ---- construction & logistics ----
  pallet: e('construction', 'createPallet', 'Pallet', ['euro', 'us', 'plastic'], ['stacked', 'loaded', 'bricks', ...C_SMALL], { color: 'timber / plastic color', seed: 'variation' }),
  crate: e('construction', 'createCrate', 'Crate', ['wooden', 'plastic', 'shipping'], ['stacked', 'produce', ...C_NO_POSTER], { color: 'color', seed: 'variation' }),
  barrel: e('construction', 'createBarrel', 'Barrel', ['steel-drum', 'plastic', 'wooden'], ['group', 'on-side', ...C_NO_POSTER], { color: 'color' }),
  dumpster: e('construction', 'createDumpster', 'Dumpster', ['front-load', 'roll-off', 'skip'], ['full', ...C], { color: 'paint color', seed: 'rubble variation' }),
  'porta-potty': e('construction', 'createPortaPotty', 'Portable toilet', ['standard', 'accessible', 'luxury'], C, { color: 'shell color' }),
  sandbags: e('construction', 'createSandbags', 'Sandbags', ['wall', 'pile', 'ring'], ['snowy', 'graffiti'], { color: 'hessian color', seed: 'variation' }),
  'cable-drum': e('construction', 'createCableDrum', 'Cable drum', ['small', 'large', 'steel'], ['empty', 'on-side', ...C_NO_POSTER], { color: 'flange color' }),
  scaffolding: e('construction', 'createScaffolding', 'Scaffolding', ['bay', 'tower', 'wrapped'], ['netting', 'rusty', 'snowy'], {}),
  // ---- playground ----
  swing: e('playground', 'createSwing', 'Swing set', ['double', 'single', 'nest', 'toddler'], ['natural', 'pastel', 'retro', ...C_NO_POSTER], { color: 'frame color' }),
  slide: e('playground', 'createSlide', 'Slide', ['straight', 'spiral', 'wave', 'tube'], ['natural', 'pastel', 'retro', ...C_NO_POSTER], { color: 'frame color' }),
  seesaw: e('playground', 'createSeesaw', 'Seesaw', ['classic', 'double', 'spring-rider'], ['natural', 'pastel', 'retro', ...C_NO_POSTER], { color: 'frame color' }),
  'climbing-frame': e('playground', 'createClimbingFrame', 'Climbing frame', ['dome', 'monkey-bars', 'net'], ['natural', 'pastel', 'retro', 'rusty', 'snowy'], { color: 'frame color' }),
  sandbox: e('playground', 'createSandbox', 'Sandbox', ['square', 'round', 'covered'], ['primary', 'pastel', 'snowy'], {}),
  'merry-go-round': e('playground', 'createMerryGoRound', 'Merry-go-round', ['classic', 'modern'], ['natural', 'pastel', 'retro', ...C_NO_POSTER], {}),
  // ---- commerce ----
  'market-stall': e('commerce', 'createMarketStall', 'Market stall', ['canopy', 'wooden', 'fruit'], ['produce', 'flowers', 'crafts', 'damaged', 'snowy'], { color: 'awning color', seed: 'goods variation' }),
  kiosk: e('commerce', 'createKiosk', 'Kiosk', ['newsstand', 'ticket', 'food'], ['awning', ...C], { color: 'paint color' }),
  'food-cart': e('commerce', 'createFoodCart', 'Food cart', ['hot-dog', 'ice-cream', 'coffee'], C, { color: 'body color' }),
  umbrella: e('commerce', 'createUmbrella', 'Patio umbrella', ['patio', 'market', 'cantilever', 'beach'], ['striped', 'table', 'damaged', 'snowy'], { color: 'canvas color' }),
  'gas-pump': e('commerce', 'createGasPump', 'Fuel pump', ['modern', 'classic', 'dual'], ['canopy', ...C], { color: 'body color' }),
  billboard: e('commerce', 'createBillboard', 'Billboard', ['standard', 'digital', 'mupi', 'pylon'], ['double-sided', 'rusty', 'damaged', 'graffiti', 'snowy'], { seed: 'which advert' }),
  // ---- infrastructure ----
  manhole: e('roads', 'createManhole', 'Manhole', ['sewer', 'storm', 'utility', 'telecom'], ['open', 'barriers', 'steaming', 'rusty', 'snowy'], {}),
  'storm-drain': e('roads', 'createStormDrain', 'Storm drain', ['curb-inlet', 'grate', 'trench'], ['clogged', 'rusty', 'snowy'], {}),
  'speed-bump': e('roads', 'createSpeedBump', 'Speed bump', ['rubber', 'hump', 'cushion', 'table'], ['signed', 'snowy'], {}),
  'power-pole': e('utilities', 'createPowerPole', 'Utility pole', ['wooden', 'concrete', 'transformer', 'steel'], ['streetlight', 'birds', ...C], {}),
  'utility-box': e('utilities', 'createUtilityBox', 'Utility cabinet', ['pad-mount', 'signal-cabinet', 'telecom'], ['wrapped', ...C], { color: 'paint color' }),
  cctv: e('utilities', 'createCCTV', 'CCTV camera', ['bullet', 'dome', 'ptz'], ['sign', 'rusty', 'posters', 'snowy'], {}),
  'rail-crossing': e('traffic', 'createRailCrossing', 'Rail crossing', ['crossbuck', 'lights', 'gate'], ['tracks', ...C], {}),
  'street-clock': e('furniture', 'createStreetClock', 'Street clock', ['post', 'double-face', 'modern'], ['plinth', ...C_NO_POSTER], { color: 'iron color' }),
  'flag-pole': e('furniture', 'createFlagPole', 'Flag pole', ['single', 'triple', 'wall'], ['half-mast', 'snowy'], { seed: 'which flag' }),
  monument: e('furniture', 'createMonument', 'Monument', ['obelisk', 'column', 'abstract', 'globe', 'plaque'], ['granite', 'verdigris', 'floral', 'graffiti', 'snowy'], {}),
  // airport set (src/models/street/airport.js)
  'jet-bridge': { ...e('airport', 'createJetBridge', 'Jet bridge', ['standard', 'glass', 'short'], ['rusty', 'damaged', 'snowy'], { color: 'skin color' }), tags: ['airport', 'jet bridge', 'jetway', 'air bridge', 'boarding bridge', 'gate', 'terminal'] },
  'baggage-carousel': { ...e('airport', 'createBaggageCarousel', 'Baggage carousel', ['oval', 'long', 'round', 'empty'], ['damaged'], { seed: 'bag layout' }), tags: ['airport', 'baggage claim', 'luggage', 'carousel', 'conveyor', 'suitcase', 'arrivals'] },
  'check-in-desk': { ...e('airport', 'createCheckInDesk', 'Check-in desk', ['single', 'double', 'kiosk', 'kiosk-row'], ['damaged'], { color: 'airline accent color' }), tags: ['airport', 'check-in', 'check in', 'counter', 'bag drop', 'kiosk', 'queue', 'stanchion', 'terminal'] },
  'gate-seating': { ...e('airport', 'createGateSeating', 'Gate seating', ['row-3', 'row-5', 'back-to-back', 'with-table'], ['damaged'], { color: 'upholstery color' }), tags: ['airport', 'seating', 'seats', 'bench', 'waiting area', 'lounge', 'gate', 'terminal', 'chairs'] },
  'departure-board': { ...e('airport', 'createDepartureBoard', 'Departures board', ['hanging', 'standing', 'wall', 'arrivals'], ['damaged'], { seed: 'flight list' }), tags: ['airport', 'departures', 'arrivals', 'flight board', 'flight information', 'display', 'screen', 'timetable', 'station'] },
  'security-scanner': { ...e('airport', 'createSecurityScanner', 'Security scanner', ['x-ray', 'walk-through', 'body-scanner', 'lane'], ['damaged'], {}), tags: ['airport', 'security', 'x-ray', 'metal detector', 'scanner', 'checkpoint', 'tsa', 'baggage scanner'] },
  windsock: { ...e('airport', 'createWindsock', 'Windsock', ['pole', 'lit', 'rooftop'], ['rusty', 'damaged', 'snowy'], {}), tags: ['airport', 'windsock', 'wind sock', 'wind cone', 'airfield', 'helipad', 'wind'] },
  'runway-light': { ...e('airport', 'createRunwayLight', 'Runway light', ['edge', 'threshold', 'taxiway', 'runway-end', 'inset', 'papi'], ['rusty', 'damaged', 'snowy'], {}), tags: ['airport', 'runway', 'taxiway', 'airfield lighting', 'edge light', 'papi', 'approach light', 'landing'] },
  'airfield-sign': { ...e('airport', 'createAirfieldSign', 'Airfield sign', ['location', 'direction', 'runway-holding', 'distance-remaining', 'gate'], ['rusty', 'damaged', 'snowy'], {}), tags: ['airport', 'taxiway sign', 'runway sign', 'airfield', 'gate sign', 'signage', 'holding position'] },
  'baggage-cart': { ...e('airport', 'createBaggageCart', 'Baggage cart', ['open', 'covered', 'train', 'open-train'], ['rusty', 'damaged', 'snowy'], { color: 'frame color' }), tags: ['airport', 'baggage cart', 'luggage cart', 'dolly', 'baggage train', 'ground support', 'apron', 'trolley'] },
};
