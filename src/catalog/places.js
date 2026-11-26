// Catalog entries for the 'places' category (module 'places', src/models/places.js + src/models/places/*).
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
//
// Trims every places model understands (src/models/places/kit.js):
//   styles     victorian · modern · rustic · japanese   (parts + materials change)
//   seasons    autumn (leaf litter, warm foliage) · winter (snow, ice)
//   condition  overgrown (weeds, ivy, moss) · worn (weathered, dirt, litter)
//   sizes      large · small
const STD = ['victorian', 'modern', 'rustic', 'japanese', 'autumn', 'winter', 'overgrown', 'worn', 'large', 'small'];
const ENV = ['autumn', 'winter', 'overgrown', 'worn', 'large', 'small'];
const e = (sub, factory, label, variants, trims, options = {}) => ({ category: 'places', sub, source: 'js', module: 'places', factory, label, variants, trims, options });
const O = { color: 'roof / accent color', size: 'footprint scale', seed: 'variation' };
// style trims except the variant's own default style
const others = (variants, defaults) => Object.fromEntries(variants.map((v) => [v, STD.filter((t) => t !== defaults[v])]));

export default {
  gazebo: e('structures', 'createGazebo', 'Gazebo', ['octagonal', 'hexagonal', 'square', 'round'], STD, O),
  pavilion: e('structures', 'createPavilion', 'Picnic pavilion', ['gable', 'hip', 'flat', 'long'], STD, O),
  pergola: e('structures', 'createPergola', 'Pergola', ['straight', 'corner', 'arched', 'walkway'], STD, O),
  bandstand: e('structures', 'createBandstand', 'Bandstand', ['octagonal', 'round', 'shell'], others(['octagonal', 'round', 'shell'], { octagonal: 'victorian', round: 'victorian', shell: 'modern' }), O),
  'park-gate': e('structures', 'createParkGate', 'Park gate', ['arch', 'iron-gates', 'lychgate', 'portal'], others(['arch', 'iron-gates', 'lychgate', 'portal'], { 'iron-gates': 'victorian', lychgate: 'rustic', portal: 'modern' }), O),
  footbridge: e('structures', 'createFootbridge', 'Footbridge', ['arched', 'flat', 'moon', 'truss'], others(['arched', 'flat', 'moon', 'truss'], { moon: 'japanese', truss: 'modern' }), O),
  boardwalk: e('structures', 'createBoardwalk', 'Boardwalk', ['straight', 'curve', 'lookout', 'pier'], STD, O),
   restroom: e('structures', 'createRestroom', 'Public restroom', ['kiosk', 'block', 'cabin', 'pod'], others(['kiosk', 'block', 'cabin', 'pod'], { kiosk: 'modern', cabin: 'rustic', pod: 'modern' }), O),
  'ranger-station': e('structures', 'createRangerStation', 'Ranger station', ['cabin', 'tower', 'booth'], others(['cabin', 'tower', 'booth'], { cabin: 'rustic', tower: 'rustic' }), O),
  'info-board': e('signage', 'createInfoBoard', 'Information board', ['map-board', 'roofed', 'totem', 'lectern'], others(['map-board', 'roofed', 'totem', 'lectern'], { roofed: 'rustic', totem: 'modern' }), O),
  'park-sign': e('signage', 'createParkSign', 'Park sign', ['entrance', 'routed', 'fingerpost', 'rules'], others(['entrance', 'routed', 'fingerpost', 'rules'], { routed: 'rustic' }), O),
  'water-point': e('amenities', 'createWaterPoint', 'Drinking fountain (park)', ['column', 'bottle-station', 'hand-pump', 'bubbler-pair'], others(['column', 'bottle-station', 'hand-pump', 'bubbler-pair'], { column: 'victorian', 'bottle-station': 'modern', 'hand-pump': 'rustic' }), O),
  pond: e('features', 'createPond', 'Pond', ['round', 'kidney', 'formal', 'natural'], others(['round', 'kidney', 'formal', 'natural'], { formal: 'victorian', natural: 'rustic' }), O),
  'plaza-fountain': e('features', 'createPlazaFountain', 'Fountain plaza', ['tiered', 'jets', 'statue', 'cascade'], others(['tiered', 'jets', 'statue', 'cascade'], { tiered: 'victorian', jets: 'modern' }), O),
  'flower-bed': e('gardens', 'createFlowerBed', 'Flower bed', ['round', 'long', 'raised', 'island', 'border'], STD, O),
  'rose-arch': e('gardens', 'createRoseArch', 'Rose arch', ['arch', 'tunnel', 'gothic'], others(['arch', 'tunnel', 'gothic'], { gothic: 'victorian' }), O),
  'hedge-maze': e('gardens', 'createHedgeMaze', 'Hedge maze section', ['straight', 'corner', 'junction', 'centre'], others(['straight', 'corner', 'junction', 'centre'], { centre: 'victorian' }), O),
  'zen-garden': e('gardens', 'createZenGarden', 'Rock garden', ['classic', 'lantern', 'pond-garden', 'moss'], ENV, O),
  'garden-plots': e('gardens', 'createGardenPlots', 'Community garden plots', ['raised-bed', 'rows', 'allotment', 'herb-spiral'], others(['raised-bed', 'rows', 'allotment', 'herb-spiral'], { allotment: 'rustic' }), O),
  'dog-park': e('activity', 'createDogPark', 'Dog park', ['fence', 'jump', 'tunnel', 'weave-poles', 'a-frame'], ['rustic', 'modern', ...ENV], O),
  'skate-ramp': e('activity', 'createSkateRamp', 'Skate park piece', ['quarter-pipe', 'rail', 'funbox', 'bowl', 'ledge', 'kicker'], ['wooden', 'painted', ...ENV], O),
  'outdoor-gym': e('activity', 'createOutdoorGym', 'Outdoor gym station', ['pull-up', 'parallel-bars', 'sit-up', 'cross-trainer', 'leg-press'], STD, O),
  'picnic-set': e('activity', 'createPicnicSet', 'Picnic area set', ['table-set', 'blanket', 'family'], STD, O),
  'bbq-grill': e('activity', 'createBbqGrill', 'BBQ grill', ['pedestal', 'brick', 'double', 'fire-pit'], others(['pedestal', 'brick', 'double', 'fire-pit'], { 'fire-pit': 'rustic' }), O),
  'game-table': e('activity', 'createGameTable', 'Game table', ['chess', 'double-chess', 'giant-chess', 'ping-pong'], others(['chess', 'double-chess', 'giant-chess', 'ping-pong'], { 'ping-pong': 'modern' }), O),
  'bird-bath': e('ornaments', 'createBirdBath', 'Bird bath', ['pedestal', 'tiered', 'ground'], others(['pedestal', 'tiered', 'ground'], { tiered: 'victorian', ground: 'rustic' }), O),
  statue: e('ornaments', 'createStatue', 'Statue on plinth', ['figure', 'bust', 'abstract', 'urn'], others(['figure', 'bust', 'abstract', 'urn'], { abstract: 'modern', urn: 'victorian' }), O),
  memorial: e('ornaments', 'createMemorial', 'Memorial', ['obelisk', 'column', 'cenotaph', 'stele'], others(['obelisk', 'column', 'cenotaph', 'stele'], { column: 'victorian', stele: 'modern' }), O),
  sundial: e('ornaments', 'createSundial', 'Sundial', ['pedestal', 'armillary', 'ground'], others(['pedestal', 'armillary', 'ground'], { armillary: 'victorian', ground: 'modern' }), O),
  'park-path': e('paths', 'createParkPath', 'Lamp-lined park path', ['straight', 'curve', 'crossing', 't-junction', 'plaza-end'], STD, O),
  'stepping-stones': e('paths', 'createSteppingStones', 'Stepping-stone path', ['straight', 'curved', 'over-water', 'in-gravel'], others(['straight', 'curved', 'over-water', 'in-gravel'], { 'over-water': 'japanese', 'in-gravel': 'japanese' }), O),
  playground: e('activity', 'createPlayground', 'Playground piece', ['swings', 'slide', 'see-saw', 'sandbox', 'climbing-frame', 'spring-rider'], STD, O),
  'park-scene': e('scenes', 'createParkScene', 'Park scene', ['pocket-park', 'picnic-lawn', 'pond-corner', 'playground-corner', 'fountain-plaza', 'garden-corner'], STD, O),
  campsite: e('leisure', 'createCampsite', 'Campsite', ['dome-tent', 'ridge-tent', 'fire-ring', 'log-seats', 'camp'], ['modern', 'rustic', ...ENV], O),
  'beach-set': e('leisure', 'createBeachSet', 'Beach set', ['umbrella', 'lounger', 'lifeguard-tower', 'beach-hut', 'beach'], ['victorian', 'modern', 'rustic', 'japanese', 'overgrown', 'worn', 'large', 'small'], O),
  // @end
};
