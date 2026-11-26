// Catalog entries for the 'military' category: military vehicles (tanks, APCs, trucks, jeeps),
// field gear (tents, crates, sandbags, barriers), and melee/historic arms (swords, shields,
// axes, spears, bows, armour). NO guns/firearms by user's choice.
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
const CAMO = ['woodland', 'desert', 'arctic', 'urban', 'olive', 'un-white'];
const PARTS = ['addon-armour', 'mine-plough', 'dozer-blade', 'cage-armour', 'cargo-racks'];
const VEHICLE_TRIMS = [...CAMO, ...PARTS, ...CAMO.flatMap((c) => PARTS.map((p) => `${c}-${p}`))];
const VEH_OPTS = { color: 'base paint colour (overrides camouflage)' };
const veh = (factory, label, variants, trims = VEHICLE_TRIMS) => ({ category: 'military', sub: 'vehicles', source: 'js', module: 'military', factory, label, variants, trims, options: VEH_OPTS });

const BLADE_TRIMS = ['ornate', 'battle-worn', 'ceremonial', 'rusted', 'sheathed', 'broken'];
const HAFT_TRIMS = ['ornate', 'battle-worn', 'ceremonial', 'rusted', 'bronze', 'blackened'];
const ARMS_OPTS = { stand: 'boolean' };
const arms = (factory, label, variants, trims) => ({ category: 'military', sub: 'arms', source: 'js', module: 'military', factory, label, variants, trims, options: ARMS_OPTS });

const field = (factory, label, variants, trims) => ({ category: 'military', sub: 'field', source: 'js', module: 'military', factory, label, variants, trims, options: {} });

export default {
  'military-tent': field('createMilitaryTent', 'Military tent', ['dome', 'a-frame', 'command', 'field-hospital', 'arched-shelter'], ['desert', 'arctic', 'woodland-net', 'open']),
  'camo-net': field('createCamoNet', 'Camouflage netting', ['vehicle-hide', 'shelter', 'small-hide', 'wall-screen'], ['woodland', 'desert', 'arctic', 'urban']),
  'sandbag-wall': field('createSandbagWall', 'Sandbag wall', ['straight', 'curved', 'corner', 'bunker', 'ring', 'pillbox'], ['desert', 'woodland', 'weathered', 'wired', 'snowy']),
  'hesco-barrier': field('createHescoBarrier', 'Hesco barrier', ['single', 'row', 'double-stack', 'corner', 'gate-flank'], ['gravel', 'weathered', 'with-wire', 'desert']),
  'military-crate': field('createMilitaryCrate', 'Military crate', ['ammo-box', 'supply-crate', 'long-crate', 'medical-crate', 'ration-stack', 'hard-case'], ['open', 'stacked', 'desert', 'olive']),
  'jerry-can': field('createJerryCan', 'Jerry can', ['single', 'pair', 'rack', 'pallet'], ['desert', 'olive', 'red', 'blue']),
  'oil-drum': field('createOilDrum', 'Oil drum', ['single', 'pallet', 'stack', 'tipped'], ['rusty', 'blue', 'red', 'green']),
  'field-radio': field('createFieldRadio', 'Field radio', ['manpack', 'desk-set', 'field-telephone', 'antenna-mast'], ['desert', 'woodland']),
  'field-generator': field('createFieldGenerator', 'Field generator', ['portable', 'skid', 'trailer'], ['desert', 'woodland', 'arctic']),
  'watch-tower': field('createWatchTower', 'Watch tower', ['wooden', 'steel', 'sandbag-base', 'scaffold'], ['weathered', 'camo-net', 'desert']),
  'barrier-gate': field('createBarrierGate', 'Barrier & gate', ['boom-gate', 'checkpoint', 'czech-hedgehog', 't-wall', 'dragons-teeth', 'jersey-barrier'], ['desert', 'weathered', 'painted']),
  'barbed-wire': field('createBarbedWire', 'Barbed wire', ['concertina', 'triple-concertina', 'picket-fence', 'knife-rest'], ['rusty', 'snowy']),
  'first-aid-station': field('createFirstAidStation', 'First-aid station', ['stretcher-stand', 'aid-tent', 'medical-cabinet', 'triage-post'], ['desert', 'woodland']),
  sword: arms('createSword', 'Sword', ['longsword', 'arming-sword', 'claymore', 'katana', 'sabre', 'gladius', 'rapier', 'scimitar', 'falchion'], BLADE_TRIMS),
  dagger: arms('createDagger', 'Dagger', ['dirk', 'stiletto', 'kris', 'seax', 'tanto', 'rondel'], BLADE_TRIMS),
  axe: arms('createAxe', 'Axe', ['battle-axe', 'viking-axe', 'dane-axe', 'labrys', 'tomahawk', 'francisca'], HAFT_TRIMS),
  mace: arms('createMace', 'Mace & war hammer', ['flanged-mace', 'morning-star', 'war-hammer', 'maul', 'studded-club', 'flail'], HAFT_TRIMS),
  polearm: arms('createPolearm', 'Polearm', ['spear', 'halberd', 'glaive', 'pike', 'trident', 'naginata', 'partisan', 'bardiche'], HAFT_TRIMS),
  shield: arms('createShield', 'Shield', ['round-viking', 'kite', 'heater', 'scutum', 'buckler', 'hoplite', 'pavise', 'targe'], ['ornate', 'battle-worn', 'ceremonial', 'rusted', 'leather-covered', 'spiked']),
  helmet: arms('createHelmet', 'Helmet', ['viking', 'roman', 'great-helm', 'kabuto', 'corinthian', 'sallet', 'bascinet', 'barbute', 'morion'], HAFT_TRIMS),
  'armour-suit': arms('createArmourSuit', 'Suit of armour', ['gothic', 'maximilian', 'samurai', 'roman', 'chainmail', 'viking'], HAFT_TRIMS),
  'weapon-rack': arms('createWeaponRack', 'Weapon rack', ['sword-rack', 'spear-rack', 'barrel-rack', 'armoury-wall', 'shield-rack'], ['dark', 'weathered', 'royal', 'empty']),
  'training-dummy': arms('createTrainingDummy', 'Training dummy', ['straw', 'wooden-pell', 'quintain', 'wing-chun', 'archery-target'], ['weathered', 'armoured', 'practice-marks', 'cut-up']),
  bow: arms('createBow', 'Bow', ['longbow', 'recurve', 'horse-bow', 'yumi', 'flatbow'], ['ornate', 'weathered', 'ceremonial', 'with-quiver', 'unstrung']),
  tank: veh('createTank', 'Tank', ['mbt', 'mbt-cast', 'light-tank']),
  apc: veh('createApc', 'Armoured personnel carrier', ['tracked', 'wheeled-8x8', 'wheeled-6x6', 'mrap', 'mrap-6x6']),
  'military-truck': veh('createMilitaryTruck', 'Military truck', ['cargo', 'fuel-tanker', 'recovery', 'ambulance']),
  'utility-4x4': veh('createUtility4x4', 'Military utility 4x4', ['jeep', 'utility', 'pickup']),
  'bridge-layer': veh('createBridgeLayer', 'Bridge layer', ['tracked', 'wheeled']),
  'radar-trailer': veh('createRadarTrailer', 'Field radar trailer', ['rotating-array', 'dish', 'mast'], CAMO),
};
