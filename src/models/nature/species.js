/*
 * Tree species, tuned from botanical references: growth habit (silhouette),
 * trunk taper + root flare, branching angle, bark type/colour, leaf shape/size
 * and seasonal colours. Units: metres.
 *
 * kind: 'broad' (recursive branching), 'conifer' (whorled sprays), 'pine'
 * (open-crowned pines), 'palm', 'willow', 'bamboo', 'baobab', 'joshua',
 * 'treefern', 'banana'.
 * group decides the trim set (see TREE_TRIMS in trees.js).
 */

const G = (...c) => c;

export const SPECIES = {
  // ------------------------------------------------ broadleaf, deciduous
  oak: { kind: 'broad', group: 'deciduous', trunkH: 2.6, trunkR: 0.42, depth: 4, children: 3, childVar: 2, spread: 0.85, lenRatio: 0.66, firstLen: 2.4, radiusRatio: 0.62, gnarl: 0.38, up: 0.2, start: 0.3, foliageR: 0.85, leaf: 'lobed', size: 0.7, bark: '#5b4c3e', barkStyle: 'furrowed', ridges: 0.06,
    colors: G('#3f6b2a', '#4c7a31', '#58873a', '#355d27', '#668f3f'), autumn: G('#8a5a24', '#a0682a', '#6e4a22', '#b07a34', '#7c6a2a'), spring: G('#8cbf4f', '#9dcc5a', '#7fb048'), litter: 'lobed' },
  maple: { kind: 'broad', group: 'deciduous', trunkH: 3.0, trunkR: 0.3, depth: 4, children: 3, childVar: 2, spread: 0.6, lenRatio: 0.66, firstLen: 1.8, radiusRatio: 0.6, gnarl: 0.22, up: 0.6, start: 0.35, foliageR: 0.75, leaf: 'maple', size: 0.6, bark: '#615549', barkStyle: 'furrowed', ridges: 0.04,
    colors: G('#3d6e2b', '#4a7d32', '#56893a', '#3a6629'), autumn: G('#c0392b', '#e1621f', '#f0a020', '#d35400', '#a8321e', '#e8c33a'), spring: G('#9ccc58', '#b0d86a', '#8cbf4f'), litter: 'maple' },
  cherry: { kind: 'broad', group: 'blossom', trunkH: 1.9, trunkR: 0.24, depth: 4, children: 3, childVar: 1, spread: 1.0, lenRatio: 0.7, firstLen: 1.7, radiusRatio: 0.6, gnarl: 0.34, up: 0.15, start: 0.4, foliageR: 0.6, leaf: 'blossom', size: 0.5, bark: '#4a302a', barkStyle: 'lenticel',
    colors: G('#f7c6d9', '#f4a6c1', '#fbe0ea', '#eb93b6', '#ffffff'), summer: G('#3f6e2c', '#4b7c33', '#57883b'), summerLeaf: 'broad', autumn: G('#c2452d', '#d9772a', '#b03a2a', '#e09a33'), falling: true, litter: 'blossom' },
  birch: { kind: 'broad', group: 'deciduous', trunkH: 4.6, trunkR: 0.15, depth: 4, children: 3, childVar: 2, spread: 0.5, lenRatio: 0.6, firstLen: 1.7, radiusRatio: 0.5, gnarl: 0.16, up: 0.75, start: 0.3, foliageR: 0.5, leaf: 'small', size: 0.42, bark: '#ece8df', birch: true, droop: 0.35,
    colors: G('#7fb24a', '#94c45a', '#86b84d', '#a5cc68'), autumn: G('#e8c33a', '#f0d24a', '#d9a92a', '#c9b23a'), spring: G('#b3d870', '#c2e07e'), litter: 'small' },
  beech: { kind: 'broad', group: 'deciduous', trunkH: 2.8, trunkR: 0.36, depth: 4, children: 4, childVar: 1, spread: 0.7, lenRatio: 0.66, firstLen: 2.0, radiusRatio: 0.6, gnarl: 0.18, up: 0.45, start: 0.25, foliageR: 0.85, leaf: 'broad', size: 0.55, bark: '#8f8c84', barkStyle: 'smooth',
    colors: G('#3e7030', '#4a7e36', '#3a682c', '#55893d'), autumn: G('#b05a1e', '#c4702a', '#9c4a1a', '#d08a3a'), spring: G('#a8d460', '#b8dc72'), litter: 'broad' },
  elm: { kind: 'broad', group: 'deciduous', trunkH: 2.6, trunkR: 0.36, depth: 4, forks: 3, forkSpread: 0.45, children: 3, childVar: 1, spread: 0.55, lenRatio: 0.7, firstLen: 3.2, radiusRatio: 0.6, gnarl: 0.18, up: 0.35, start: 0.5, foliageR: 0.7, leaf: 'broad', size: 0.5, bark: '#5e5246', barkStyle: 'furrowed', ridges: 0.05, droop: 0.4,
    colors: G('#406e2e', '#4c7c34', '#5a873c'), autumn: G('#d9b23a', '#c9a02e', '#e2c24c'), spring: G('#9ccc58', '#a9d466'), litter: 'broad' },
  ash: { kind: 'broad', group: 'deciduous', trunkH: 3.6, trunkR: 0.3, depth: 4, children: 3, childVar: 1, spread: 0.55, lenRatio: 0.62, firstLen: 2.0, radiusRatio: 0.58, gnarl: 0.2, up: 0.65, start: 0.35, foliageR: 0.7, leaf: 'pinnate', size: 0.7, bark: '#7d776c', barkStyle: 'furrowed', ridges: 0.04,
    colors: G('#46742f', '#527f37', '#5d8a3f'), autumn: G('#c8b44a', '#b8a03a', '#8a6a9a', '#d4c060'), spring: G('#a3cf5f', '#b2d86c'), litter: 'pinnate' },
  linden: { kind: 'broad', group: 'deciduous', trunkH: 3.0, trunkR: 0.32, depth: 4, children: 4, childVar: 1, spread: 0.55, lenRatio: 0.64, firstLen: 1.9, radiusRatio: 0.58, gnarl: 0.18, up: 0.7, start: 0.25, foliageR: 0.8, leaf: 'heart', size: 0.55, bark: '#5b5148', barkStyle: 'furrowed', ridges: 0.04,
    colors: G('#3f7230', '#4b7f36', '#58893e'), autumn: G('#e0c040', '#d4ae32', '#c89a2a'), spring: G('#a8d462', '#b6dc70'), litter: 'heart' },
  plane: { kind: 'broad', group: 'deciduous', trunkH: 3.4, trunkR: 0.42, depth: 4, children: 3, childVar: 2, spread: 0.7, lenRatio: 0.66, firstLen: 2.4, radiusRatio: 0.6, gnarl: 0.28, up: 0.45, start: 0.3, foliageR: 0.85, leaf: 'maple', size: 0.7, bark: '#a29a80', barkStyle: 'peeling',
    colors: G('#4a7a33', '#568538', '#3f6e2c'), autumn: G('#b88a3a', '#a07030', '#c8a050'), spring: G('#a6d260', '#b4da6e'), litter: 'maple' },
  chestnut: { kind: 'broad', group: 'deciduous', trunkH: 2.6, trunkR: 0.42, depth: 4, children: 4, childVar: 1, spread: 0.7, lenRatio: 0.64, firstLen: 2.1, radiusRatio: 0.6, gnarl: 0.24, up: 0.4, start: 0.25, foliageR: 0.9, leaf: 'maple', size: 0.72, bark: '#5d5046', barkStyle: 'plates',
    colors: G('#3b6b2b', '#467833', '#52833a'), autumn: G('#a0602a', '#b8782e', '#8a5426'), spring: G('#9cc95a', '#accf66'), springFlowers: 'candles', litter: 'maple' },
  walnut: { kind: 'broad', group: 'deciduous', trunkH: 2.4, trunkR: 0.36, depth: 4, children: 3, childVar: 2, spread: 0.85, lenRatio: 0.66, firstLen: 2.2, radiusRatio: 0.6, gnarl: 0.3, up: 0.3, start: 0.3, foliageR: 0.75, leaf: 'pinnate', size: 0.75, bark: '#4a4440', barkStyle: 'furrowed', ridges: 0.07,
    colors: G('#4a7633', '#558238', '#3f6a2e'), autumn: G('#c8b040', '#b09a36', '#d6c05a'), spring: G('#a6cc62', '#b2d46e'), fruit: { color: '#5f8a2e', r: 0.028 }, litter: 'pinnate' },
  poplar: { kind: 'broad', group: 'deciduous', trunkH: 1.6, trunkR: 0.3, depth: 3, children: 6, childVar: 2, spread: 0.18, lenRatio: 0.75, firstLen: 5.0, radiusRatio: 0.45, gnarl: 0.1, up: 1.6, start: 0.05, foliageR: 0.55, leaf: 'heart', size: 0.42, bark: '#6e6658', barkStyle: 'furrowed', ridges: 0.05, columnar: true,
    colors: G('#3e6e2e', '#4a7b34', '#56883c'), autumn: G('#e2c340', '#d6b234', '#ebcf58'), spring: G('#a3cf5f', '#b0d76c'), litter: 'heart' },
  aspen: { kind: 'broad', group: 'deciduous', trunkH: 5.2, trunkR: 0.14, depth: 3, children: 3, childVar: 2, spread: 0.5, lenRatio: 0.58, firstLen: 1.5, radiusRatio: 0.5, gnarl: 0.15, up: 0.85, start: 0.35, foliageR: 0.5, leaf: 'small', size: 0.4, bark: '#d8dccb', barkStyle: 'lenticel',
    colors: G('#6a9d3e', '#7aab48', '#5d8f36'), autumn: G('#f2c230', '#f6d03e', '#e8b228'), spring: G('#b3d870', '#c2e07e'), litter: 'small' },
  ginkgo: { kind: 'broad', group: 'deciduous', trunkH: 3.4, trunkR: 0.28, depth: 3, children: 4, childVar: 2, spread: 0.6, lenRatio: 0.6, firstLen: 1.8, radiusRatio: 0.5, gnarl: 0.3, up: 0.5, start: 0.2, foliageR: 0.55, leaf: 'fan', size: 0.45, bark: '#6c6359', barkStyle: 'furrowed', ridges: 0.05,
    colors: G('#5e9a3e', '#6aa846', '#559038'), autumn: G('#f5cf2a', '#f8da3e', '#eec020'), spring: G('#a6d460', '#b6dc6e'), litter: 'fan' },
  'japanese-maple': { kind: 'broad', group: 'deciduous', trunkH: 0.9, trunkR: 0.12, stems: 3, depth: 4, children: 3, childVar: 1, spread: 1.0, lenRatio: 0.7, firstLen: 1.1, radiusRatio: 0.6, gnarl: 0.3, up: 0.1, start: 0.3, foliageR: 0.45, leaf: 'maple', size: 0.38, bark: '#6a5a50', barkStyle: 'smooth', layered: true,
    colors: G('#8e1f22', '#a52a24', '#7a1a1e', '#b83a2a'), autumn: G('#e0401c', '#f06a1a', '#d42a1a'), spring: G('#c25a3a', '#d06e40'), litter: 'maple' },
  dogwood: { kind: 'broad', group: 'blossom', trunkH: 1.0, trunkR: 0.13, depth: 4, children: 3, childVar: 1, spread: 1.05, lenRatio: 0.68, firstLen: 1.2, radiusRatio: 0.58, gnarl: 0.22, up: 0.05, start: 0.3, foliageR: 0.45, leaf: 'broad', size: 0.4, bark: '#5a4a40', barkStyle: 'plates', layered: true,
    colors: G('#f4f2ea', '#fbfaf5', '#e8e6dc', '#f6eef0'), bloomLeaf: 'blossom', summer: G('#3f6e2c', '#4c7c34'), summerLeaf: 'broad', autumn: G('#a8322a', '#b8442e', '#8e2a26'), litter: 'broad' },
  magnolia: { kind: 'broad', group: 'blossom', trunkH: 0.9, trunkR: 0.14, stems: 3, depth: 4, children: 3, childVar: 1, spread: 0.75, lenRatio: 0.66, firstLen: 1.5, radiusRatio: 0.58, gnarl: 0.2, up: 0.45, start: 0.25, foliageR: 0.5, leaf: 'glossy', size: 0.5, bark: '#8a8578', barkStyle: 'smooth',
    colors: G('#2f5a28', '#386630', '#2a5024'), treeFlowers: 'magnolia', summer: G('#2f5a28', '#386630'), summerLeaf: 'glossy', autumn: G('#7a6a2a', '#8e7a32', '#5e5226'), litter: 'glossy' },
  jacaranda: { kind: 'broad', group: 'blossom', trunkH: 2.4, trunkR: 0.26, depth: 4, forks: 2, forkSpread: 0.6, children: 3, childVar: 1, spread: 0.85, lenRatio: 0.68, firstLen: 2.0, radiusRatio: 0.6, gnarl: 0.3, up: 0.2, start: 0.4, foliageR: 0.65, leaf: 'blossom', size: 0.5, bark: '#5a4e44', barkStyle: 'furrowed', umbrella: 0.45,
    colors: G('#8a6bd1', '#9b7ce0', '#7a5cc2', '#a68ae6'), summer: G('#4f8a38', '#5b9640'), summerLeaf: 'pinnate', autumn: G('#a8a03a', '#8a8a34'), litter: 'blossom', falling: true },
  apple: { kind: 'broad', group: 'fruit', trunkH: 1.3, trunkR: 0.18, depth: 4, children: 3, childVar: 1, spread: 0.95, lenRatio: 0.66, firstLen: 1.4, radiusRatio: 0.6, gnarl: 0.42, up: 0.2, start: 0.4, foliageR: 0.55, leaf: 'broad', size: 0.45, bark: '#5a4a3e', barkStyle: 'plates',
    colors: G('#4a7a33', '#568538', '#3f6e2c'), blossom: G('#fbe8ee', '#f7d4df', '#ffffff'), autumn: G('#b8862a', '#a8702a', '#c89a3a'), fruit: { color: '#c22a1e', alt: '#e0b030', r: 0.038 }, litter: 'broad' },
  rowan: { kind: 'broad', group: 'fruit', trunkH: 2.0, trunkR: 0.16, depth: 4, children: 3, childVar: 1, spread: 0.6, lenRatio: 0.64, firstLen: 1.4, radiusRatio: 0.55, gnarl: 0.2, up: 0.5, start: 0.35, foliageR: 0.5, leaf: 'pinnate', size: 0.5, bark: '#7a746a', barkStyle: 'smooth',
    colors: G('#4a7a33', '#568538'), blossom: G('#f4f0e2', '#ece6d2'), autumn: G('#c8401c', '#d8602a', '#b03018'), fruit: { color: '#d8301c', r: 0.012, cluster: 9 }, litter: 'pinnate' },
  // ------------------------------------------------ broadleaf, evergreen
  orange: { kind: 'broad', group: 'evergreen', trunkH: 1.0, trunkR: 0.14, depth: 4, children: 4, childVar: 1, spread: 0.85, lenRatio: 0.62, firstLen: 1.1, radiusRatio: 0.58, gnarl: 0.25, up: 0.45, start: 0.3, foliageR: 0.6, leaf: 'glossy', size: 0.4, bark: '#6a6050', barkStyle: 'smooth', dense: true,
    colors: G('#2c5a24', '#356628', '#2a5222'), fruit: { color: '#f08a1a', r: 0.042 }, flowersColor: '#fbf8ee' },
  lemon: { kind: 'broad', group: 'evergreen', trunkH: 0.9, trunkR: 0.13, depth: 4, children: 4, childVar: 1, spread: 0.85, lenRatio: 0.62, firstLen: 1.0, radiusRatio: 0.58, gnarl: 0.28, up: 0.45, start: 0.3, foliageR: 0.55, leaf: 'glossy', size: 0.4, bark: '#6e6454', barkStyle: 'smooth', dense: true,
    colors: G('#335e26', '#3c6a2c', '#2e5622'), fruit: { color: '#f2d22a', r: 0.04, elong: 1.35 }, flowersColor: '#fbf8ee' },
  olive: { kind: 'broad', group: 'evergreen', trunkH: 1.2, trunkR: 0.3, depth: 4, forks: 3, forkSpread: 0.55, children: 3, childVar: 1, spread: 0.7, lenRatio: 0.64, firstLen: 1.4, radiusRatio: 0.58, gnarl: 0.55, up: 0.35, start: 0.4, foliageR: 0.55, leaf: 'narrow', size: 0.4, bark: '#7a7468', barkStyle: 'furrowed', ridges: 0.14, twist: 1.2,
    colors: G('#7d8d62', '#8e9c72', '#6c7c55', '#9aa682'), fruit: { color: '#3a3a2a', r: 0.011 }, flowersColor: '#f0eedc' },
  eucalyptus: { kind: 'broad', group: 'evergreen', trunkH: 5.5, trunkR: 0.3, depth: 4, children: 3, childVar: 1, spread: 0.55, lenRatio: 0.62, firstLen: 2.6, radiusRatio: 0.55, gnarl: 0.34, up: 0.6, start: 0.45, foliageR: 0.6, leaf: 'narrow', size: 0.55, bark: '#c8bea4', barkStyle: 'peeling', droop: 0.5, sparse: true,
    colors: G('#6f8c78', '#7c9884', '#62806c', '#8aa290'), flowersColor: '#f4eed4' },
  acacia: { kind: 'broad', group: 'evergreen', trunkH: 2.2, trunkR: 0.26, depth: 4, forks: 3, forkSpread: 0.75, children: 3, childVar: 1, spread: 0.9, lenRatio: 0.7, firstLen: 2.6, radiusRatio: 0.58, gnarl: 0.28, up: 0.1, start: 0.4, foliageR: 0.7, leaf: 'pinnate', size: 0.5, bark: '#4e4438', barkStyle: 'furrowed', ridges: 0.05, umbrella: 0.2,
    colors: G('#5f7f34', '#6b8a3c', '#56742e'), flowersColor: '#f0d24a' },
  dead: { kind: 'broad', group: 'dead', trunkH: 2.4, trunkR: 0.28, depth: 5, children: 2, childVar: 2, spread: 0.85, lenRatio: 0.68, firstLen: 1.8, radiusRatio: 0.58, gnarl: 0.5, up: 0.25, start: 0.3, bark: '#8f8a82', barkStyle: 'fibrous', ridges: 0.06, noLeaves: true },
  // ------------------------------------------------ conifers
  spruce: { kind: 'conifer', group: 'conifer', trunkH: 9, trunkR: 0.24, bark: '#4b3a2c', barkStyle: 'plates', colors: G('#1d3a22', '#244628', '#2b522f', '#1a331f'), maxL: 0.26, droop: 0.16, dirY: -0.22, profile: 1.05, sprig: 'fir' },
  fir: { kind: 'conifer', group: 'conifer', trunkH: 8, trunkR: 0.22, bark: '#5a5048', barkStyle: 'smooth', colors: G('#21452a', '#2a5232', '#305a36'), maxL: 0.24, droop: 0.06, dirY: -0.05, profile: 1.0, sprig: 'fir', dense: 1.2 },
  cypress: { kind: 'conifer', group: 'conifer', trunkH: 9, trunkR: 0.2, bark: '#6a5444', barkStyle: 'fibrous', colors: G('#2a4a2a', '#30542e', '#26422a'), maxL: 0.07, droop: 0, dirY: 0.85, profile: 0.35, sprig: 'fir', column: true, y0: 0.15 },
  cedar: { kind: 'conifer', group: 'conifer', trunkH: 7, trunkR: 0.4, bark: '#5a4a3e', barkStyle: 'furrowed', colors: G('#3a5a3e', '#456548', '#334f38'), maxL: 0.5, droop: 0, dirY: 0.04, profile: 0.6, sprig: 'fir', tiers: 5, y0: 0.25 },
  larch: { kind: 'conifer', group: 'larch', trunkH: 9, trunkR: 0.22, bark: '#6a4e3c', barkStyle: 'plates', colors: G('#7aa548', '#86b252', '#6e9840'), autumn: G('#d9a43a', '#e2b448', '#c89030'), spring: G('#a8d468', '#b6dc76'), maxL: 0.24, droop: 0.22, dirY: -0.1, profile: 1.05, sprig: 'pine', sparse: 0.55 },
  redwood: { kind: 'conifer', group: 'conifer', trunkH: 16, trunkR: 0.62, bark: '#8a4a30', barkStyle: 'fibrous', colors: G('#284a2a', '#2f5430', '#244426'), maxL: 0.14, droop: 0.18, dirY: -0.18, profile: 1.2, sprig: 'fir', y0: 0.38 },
  hemlock: { kind: 'conifer', group: 'conifer', trunkH: 8.5, trunkR: 0.24, bark: '#5e4a3c', barkStyle: 'furrowed', colors: G('#29482c', '#305232', '#264228'), maxL: 0.27, droop: 0.3, dirY: -0.3, profile: 1.0, sprig: 'fir', nod: true },
  juniper: { kind: 'conifer', group: 'conifer', trunkH: 3.5, trunkR: 0.16, bark: '#7a5a48', barkStyle: 'fibrous', colors: G('#3e5e4a', '#486a52', '#365444'), maxL: 0.2, droop: 0.02, dirY: 0.6, profile: 0.45, column: true, sprig: 'fir', y0: 0.05, berries: '#5a6a9a' },
  pine: { kind: 'pine', group: 'conifer', trunkH: 8, trunkR: 0.24, bark: '#6b4a34', barkStyle: 'plates', colors: G('#2c4a28', '#365a2f', '#2a4426', '#3f6334') },
  'stone-pine': { kind: 'pine', group: 'conifer', trunkH: 6.5, trunkR: 0.3, bark: '#7a5236', barkStyle: 'plates', colors: G('#2f5030', '#375a34', '#2a4a2a'), umbrella: true },
  // ------------------------------------------------ palms & tropical
  palm: { kind: 'palm', group: 'palm', trunkH: 6, trunkR: 0.17, bark: '#8a7660', colors: G('#3f7a2c', '#4f8a33', '#5a9438'), frond: 'feather', nuts: 'coconut' },
  'date-palm': { kind: 'palm', group: 'palm', trunkH: 5.5, trunkR: 0.3, bark: '#7a6248', colors: G('#5a7a4a', '#668656', '#4e6e40'), frond: 'feather', stiff: true, diamond: true, nuts: 'dates', fronds: 22, lean: 0.15 },
  'fan-palm': { kind: 'palm', group: 'palm', trunkH: 9, trunkR: 0.2, bark: '#8a7a68', colors: G('#4a7a3a', '#568640', '#3f6e34'), frond: 'fan', skirt: true, lean: 0.1 },
  'royal-palm': { kind: 'palm', group: 'palm', trunkH: 8, trunkR: 0.26, bark: '#a8a49a', colors: G('#3f7a2c', '#4a8634'), frond: 'feather', smooth: true, crownshaft: true, lean: 0.05 },
  willow: { kind: 'willow', group: 'willow', trunkH: 2.2, trunkR: 0.34, bark: '#4a3f33', barkStyle: 'furrowed', colors: G('#8fae4b', '#a1bd59', '#7a9a3e', '#b2c86a', '#6f8f38'), autumn: G('#d8c044', '#c8b03a', '#e0cc5a') },
  bamboo: { kind: 'bamboo', group: 'bamboo', colors: G('#7fae4a', '#93c25a', '#6e9c3c'), leaf: 'long', size: 0.55 },
  baobab: { kind: 'baobab', group: 'baobab', trunkH: 4.2, trunkR: 1.0, bark: '#9a8c7c', barkStyle: 'smooth', colors: G('#6a8a3e', '#76964a') },
  'joshua-tree': { kind: 'joshua', group: 'desert', bark: '#6a5a48', colors: G('#6e8a4a', '#7a9654', '#62803e') },
  'tree-fern': { kind: 'treefern', group: 'fern', trunkH: 2.6, bark: '#3e3026', colors: G('#4e8a34', '#5c9a3c', '#447d2d') },
  banana: { kind: 'banana', group: 'banana', trunkH: 2.4, colors: G('#3f7a2a', '#4a8a30', '#3a6e26') },
};

export const SPECIES_NAMES = Object.keys(SPECIES);
