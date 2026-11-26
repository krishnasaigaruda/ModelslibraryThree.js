// Catalog entries for the 'art' category (module 'art', src/models/art.js + src/models/art/*).
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
const STD = ['marble', 'bronze', 'gold', 'wood', 'concrete', 'glass', 'pop-art', 'weathered', 'mini', 'grand'];
const EQUIP = ['wood', 'white', 'black', 'bronze', 'gold', 'pop-art', 'weathered', 'kids', 'mini', 'grand'];
const SUPPLY = ['white', 'black', 'gold', 'pop-art', 'weathered', 'kids', 'mini', 'grand'];
const NEON = ['pink', 'cyan', 'lime', 'amber', 'violet', 'red', 'white', 'neon-mini', 'grand'];
const e = (factory, label, sub, variants, trims = STD, options = { color: 'main colour (base model)' }) => ({ category: 'art', sub, source: 'js', module: 'art', factory, label, variants, trims, options, tags: [label.toLowerCase(), sub, 'art'] });

export default {
  bust: e('createBust', 'Bust', 'sculpture', ['classical-man', 'classical-woman', 'laurel', 'helmeted', 'child', 'abstract-head', 'veiled']),
  'figure-statue': e('createFigure', 'Figure Statue', 'sculpture', ['standing', 'contrapposto', 'draped', 'dancer', 'seated', 'pensive', 'reclining', 'torso']),
  'abstract-sculpture': e('createAbstractSculpture', 'Abstract Sculpture', 'sculpture', ['twisted-torus', 'stacked-stones', 'ribbon', 'mobius', 'voronoi-shell', 'knot', 'arches', 'spiral', 'ring-and-orb', 'monolith']),
  'low-poly-art': e('createLowPolyArt', 'Low-Poly Art', 'sculpture', ['fox', 'bear', 'cat', 'rabbit', 'deer', 'whale', 'bird', 'gem-heart']),
  'kinetic-sculpture': e('createKineticSculpture', 'Kinetic Sculpture', 'sculpture', ['wind-spinner', 'orbit-rings', 'pendulum', 'mobile', 'helix-tower', 'balance-arc']),
  totem: e('createTotem', 'Totem', 'sculpture', ['carved-faces', 'bird-top', 'animal-stack', 'geometric', 'painted', 'tiki', 'cairn']),
  'garden-sculpture': e('createGardenSculpture', 'Garden Sculpture', 'garden', ['sundial', 'gazing-ball', 'armillary', 'bird-bath', 'obelisk', 'lattice-orb', 'stone-lantern']),
  painting: e('createPainting', 'Framed Painting', 'paintings', ['abstract', 'landscape', 'geometric', 'color-field', 'seascape', 'sunset', 'night-sky', 'dots', 'stripes', 'still-life', 'portrait']),
  easel: e('createEasel', 'Easel & Canvas', 'studio', ['a-frame', 'h-frame', 'field-tripod', 'tabletop', 'french-box'], EQUIP),
  'art-supplies': e('createArtSupplies', 'Art Supplies', 'studio', ['palette-brushes', 'paint-tubes', 'brush-jar', 'sketchbook', 'pencil-cup', 'paint-set', 'paint-cans', 'canvas-stack'], SUPPLY),
  'pottery-wheel': e('createPotteryWheel', 'Pottery Wheel', 'studio', ['electric', 'kick-wheel', 'tabletop', 'studio'], EQUIP),
  'ceramic-vase': e('createVase', 'Ceramic Vase', 'ceramics', ['amphora', 'bottle', 'bowl', 'urn', 'jug', 'moon-jar', 'bud-vase', 'planter', 'goblet', 'gourd']),
  'gallery-pedestal': e('createPedestal', 'Gallery Pedestal', 'gallery', ['cube', 'column', 'fluted', 'stepped', 'tapered', 'cylinder', 'vitrine']),
  'gallery-bench': e('createGalleryBench', 'Gallery Bench', 'gallery', ['leather-ottoman', 'wood-slat', 'stone-block', 'curved', 'back-to-back', 'cube-seats']),
  'wall-installation': e('createWallInstallation', 'Wall Installation', 'gallery', ['grid-tiles', 'wave-slats', 'mirror-discs', 'string-art', 'block-relief', 'arc-rings']),
  'neon-sign': e('createNeonSign', 'Neon Sign Art', 'gallery', ['heart', 'star', 'wave', 'lightning', 'smile', 'arrow', 'moon', 'art-word', 'eye', 'spiral'], NEON, { color: 'neon colour (base model)' }),
  'art-mosaic': e('createMosaic', 'Mosaic Panel', 'paintings', ['geometric', 'sun', 'waves', 'fish', 'flower', 'random']),
  'stained-glass': e('createStainedGlass', 'Stained Glass Panel', 'paintings', ['rose-window', 'arched', 'quarry', 'voronoi', 'sunburst', 'floral']),
};
