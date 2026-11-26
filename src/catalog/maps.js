// Catalog entries for the 'maps' category: complete scenes built from the library's own models.
// Each map is one type with 4 variants (src/models/maps/scenes.js).
const e = (sub, factory, label, variants, tags) => ({ category: 'maps', sub, source: 'js', module: 'maps', factory, label, variants, options: { seed: 'layout variation' }, tags: ['map', 'scene', 'level', 'environment', 'world', ...tags] });

export default {
  'map-city': e('city', 'createMapCity', 'City map', ['financial', 'plaza', 'waterfront', 'old-town'], ['downtown', 'city', 'block', 'streets', 'skyscrapers', 'urban']),
  'map-suburb': e('towns', 'createMapSuburb', 'Suburb map', ['grid-street', 'cul-de-sac', 'lakeside', 'winter'], ['suburb', 'neighbourhood', 'houses', 'residential']),
  'map-village': e('towns', 'createMapVillage', 'Village map', ['english', 'alpine', 'coastal', 'adobe'], ['village', 'town', 'hamlet', 'rural']),
  'map-farm': e('countryside', 'createMapFarm', 'Farm map', ['dairy', 'crops', 'orchard', 'ranch'], ['farm', 'farmland', 'barn', 'fields', 'countryside', 'ranch']),
  'map-forest': e('nature', 'createMapForest', 'Forest map', ['pine', 'autumn', 'birch', 'old-growth'], ['forest', 'woods', 'woodland', 'trees', 'river']),
  'map-desert': e('nature', 'createMapDesert', 'Desert map', ['dunes', 'oasis', 'canyon', 'cactus-flats'], ['desert', 'dunes', 'oasis', 'canyon', 'sand']),
  'map-island': e('coast', 'createMapIsland', 'Island map', ['tropical', 'atoll', 'pirate-cove', 'castaway'], ['island', 'tropical', 'sea', 'ocean', 'beach']),
  'map-mountain': e('nature', 'createMapMountain', 'Mountain map', ['pass', 'lake', 'ski-resort', 'quarry'], ['mountain', 'mountains', 'alpine', 'hills', 'ski']),
  'map-beach': e('coast', 'createMapBeach', 'Beach map', ['resort', 'boardwalk', 'surf', 'quiet-cove'], ['beach', 'seaside', 'coast', 'sand', 'sea']),
  'map-harbor': e('coast', 'createMapHarbor', 'Harbor map', ['fishing', 'container-port', 'marina', 'ferry'], ['harbor', 'harbour', 'port', 'docks', 'marina']),
  'map-industrial': e('city', 'createMapIndustrial', 'Industrial zone map', ['factory', 'power-plant', 'logistics', 'junkyard'], ['industrial', 'factory', 'zone', 'warehouse', 'power', 'plant']),
  'map-airport': e('transport', 'createMapAirport', 'Airport map', ['regional', 'international', 'airstrip', 'heliport'], ['airport', 'runway', 'airfield', 'planes', 'terminal']),
  'map-military': e('special', 'createMapMilitary', 'Military base map', ['outpost', 'airfield', 'checkpoint', 'training-ground'], ['military', 'base', 'army', 'camp', 'outpost']),
  'map-racetrack': e('sports', 'createMapRacetrack', 'Racetrack map', ['oval', 'circuit', 'karting', 'rally'], ['racetrack', 'race', 'track', 'circuit', 'racing', 'karting']),
  'map-stadium': e('sports', 'createMapStadium', 'Stadium district map', ['soccer', 'ballpark', 'arena', 'festival'], ['stadium', 'arena', 'sports', 'festival']),
  'map-park': e('city', 'createMapPark', 'Park map', ['city-park', 'playground', 'botanical', 'lake-park'], ['park', 'garden', 'playground']),
  'map-campsite': e('nature', 'createMapCampsite', 'Campsite map', ['forest-camp', 'lakeside', 'desert-camp', 'winter-camp'], ['campsite', 'camping', 'camp', 'tents']),
  'map-medieval': e('historic', 'createMapMedieval', 'Medieval town map', ['castle', 'market', 'walled', 'ruined'], ['medieval', 'castle', 'town', 'fantasy', 'village']),
  'map-ancient': e('historic', 'createMapAncient', 'Ancient site map', ['greek', 'egyptian', 'roman', 'mesoamerican'], ['ancient', 'ruins', 'pyramid', 'temple', 'egypt', 'greece', 'rome']),
  'map-scifi': e('special', 'createMapScifi', 'Sci-fi colony map', ['mars-base', 'moon-base', 'ice-planet', 'spaceport'], ['sci-fi', 'scifi', 'space', 'colony', 'mars', 'moon', 'base', 'futuristic']),
  'map-fantasy': e('special', 'createMapFantasy', 'Fantasy realm map', ['dragon-lair', 'enchanted-forest', 'wizard-tower', 'crystal-valley'], ['fantasy', 'magic', 'dragon', 'enchanted', 'crystal']),
  'map-swamp': e('nature', 'createMapSwamp', 'Swamp map', ['bayou', 'mangrove', 'bog', 'haunted'], ['swamp', 'marsh', 'bayou', 'bog', 'wetland']),
  'map-highway': e('transport', 'createMapHighway', 'Highway map', ['interchange', 'rest-stop', 'toll-plaza', 'truck-stop'], ['highway', 'motorway', 'freeway', 'road', 'traffic']),
  'map-railway': e('transport', 'createMapRailway', 'Railway map', ['rural-halt', 'city-terminal', 'freight-yard', 'mountain-line'], ['railway', 'train', 'station', 'tracks', 'rail']),
  'map-arctic': e('nature', 'createMapArctic', 'Arctic map', ['research-base', 'igloo-village', 'glacier', 'northern-town'], ['arctic', 'snow', 'ice', 'polar', 'winter']),
  'map-themepark': e('city', 'createMapThemepark', 'Theme park map', ['fun-fair', 'water-park', 'zoo', 'mini-golf'], ['theme', 'park', 'amusement', 'fair', 'zoo', 'water', 'park']),
  'map-campus': e('city', 'createMapCampus', 'Campus map', ['university', 'high-school', 'hospital', 'civic-centre'], ['campus', 'university', 'school', 'hospital', 'civic']),
};
