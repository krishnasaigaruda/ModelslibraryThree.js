// Catalog entries owned by src/models/heavy*. Merged by src/catalog.js.
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
export default {
  "truck": {
    "category": "vehicles",
    "source": "js",
    "module": "heavy",
    "factory": "createTruck",
    "label": "Truck",
    "variants": [
      "box",
      "tanker",
      "flatbed",
      "dump",
      "semi",
      "garbage",
      "fire-engine",
      "tow",
      "delivery-van",
      "cement-mixer"
    ],
    "trims": {
      "box": ["highroof", "chrome", "offroad", "municipal", "electric", "long"],
      "tanker": ["highroof", "chrome", "offroad", "municipal", "electric", "long"],
      "flatbed": ["highroof", "chrome", "offroad", "municipal", "electric", "long"],
      "dump": ["highroof", "chrome", "offroad", "municipal", "electric", "long"],
      "semi": ["daycab", "highroof", "flatbed", "tanker", "reefer", "lowboy", "container", "car-carrier", "logging", "curtainside"],
      "garbage": ["highroof", "chrome", "offroad", "municipal", "electric", "long"],
      "fire-engine": ["highroof", "chrome", "offroad", "municipal", "electric", "long"],
      "tow": ["highroof", "chrome", "offroad", "municipal", "electric", "long"],
      "delivery-van": ["highroof", "long", "electric", "ladder-rack", "refrigerated", "offroad"],
      "cement-mixer": ["highroof", "chrome", "offroad", "municipal", "electric", "long"]
    },
    "options": {
      "color": "cab/body color",
      "cargoColor": "cargo/body color",
      "roofColor": "cab roof (fire-engine)",
      "speed": "m/s",
      "lights": "false = no spotlights"
    }
  },
  "construction": {
    "category": "vehicles",
    "source": "js",
    "module": "heavy",
    "factory": "createConstruction",
    "label": "Construction machine",
    "variants": ["excavator", "bulldozer", "wheel-loader", "backhoe", "skid-steer", "telehandler", "articulated-dump", "mining-dump", "mobile-crane", "tower-crane", "road-roller", "tandem-roller", "motor-grader", "asphalt-paver", "concrete-pump", "trencher"],
    "trims": {
      "excavator": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "bulldozer": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "wheel-loader": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "backhoe": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "skid-steer": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "telehandler": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "articulated-dump": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "mining-dump": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "mobile-crane": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "tower-crane": ["luffing", "flat-top", "tall", "short", "compact"],
      "road-roller": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "tandem-roller": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "motor-grader": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "asphalt-paver": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "concrete-pump": ["canopy", "demolition", "mining", "vintage", "compact", "electric"],
      "trencher": ["canopy", "demolition", "mining", "vintage", "compact", "electric"]
    },
    "options": {
      "color": "machine paint (default construction yellow)",
      "accentColor": "secondary paint",
      "rimColor": "wheel rims"
    }
  },
  "trailer": {
    "category": "vehicles",
    "source": "js",
    "module": "heavy",
    "factory": "createTrailer",
    "label": "Semi-trailer",
    "variants": ["box", "reefer", "curtainside", "flatbed", "tanker", "lowboy", "car-carrier", "container", "livestock", "logging", "dump", "grain"],
    "trims": ["spread", "triaxle", "skirted", "pup", "dolly"],
    "options": {
      "color": "trailer colour",
      "cargoColor": "body / container / tank colour"
    }
  },
  "farm": {
    "category": "vehicles",
    "source": "js",
    "module": "heavy",
    "factory": "createFarm",
    "label": "Farm machine",
    "variants": [
      "tractor-compact",
      "tractor-utility",
      "tractor-rowcrop",
      "tractor-4wd",
      "tractor-tracked",
      "combine-harvester",
      "forage-harvester",
      "sprayer",
      "baler",
      "wagon"
    ],
    "trims": {
      "tractor-compact": [
        "open",
        "vintage",
        "duals",
        "loader",
        "electric",
        "orchard"
      ],
      "tractor-utility": [
        "open",
        "vintage",
        "duals",
        "loader",
        "electric",
        "orchard"
      ],
      "tractor-rowcrop": [
        "open",
        "vintage",
        "duals",
        "loader",
        "electric",
        "orchard"
      ],
      "tractor-4wd": [
        "open",
        "vintage",
        "loader",
        "electric",
        "orchard",
        "tracks"
      ],
      "tractor-tracked": [
        "open",
        "vintage",
        "loader",
        "electric",
        "orchard",
        "duals"
      ],
      "combine-harvester": [
        "tracks",
        "vintage",
        "duals",
        "electric",
        "compact"
      ],
      "forage-harvester": [
        "tracks",
        "vintage",
        "duals",
        "electric",
        "compact"
      ],
      "sprayer": [
        "tracks",
        "vintage",
        "duals",
        "electric",
        "compact"
      ],
      "baler": [
        "square",
        "wrapper",
        "vintage",
        "compact",
        "tandem"
      ],
      "wagon": [
        "grain-cart",
        "tipper",
        "flatbed",
        "vintage",
        "tandem"
      ]
    },
    "options": {
      "color": "machine paint",
      "accentColor": "secondary paint",
      "rimColor": "wheel rims"
    }
  },
  "industrial": {
    "category": "vehicles",
    "source": "js",
    "module": "heavy",
    "factory": "createIndustrial",
    "label": "Industrial vehicle",
    "variants": [
      "forklift",
      "reach-truck",
      "pallet-jack",
      "airport-tug",
      "baggage-cart",
      "scissor-lift",
      "boom-lift",
      "street-sweeper",
      "golf-cart",
      "utility-vehicle"
    ],
    "trims": [
      "electric",
      "outdoor",
      "compact",
      "heavy",
      "enclosed",
      "vintage"
    ],
    "options": {
      "color": "body paint",
      "accentColor": "secondary paint",
      "rimColor": "wheel rims"
    }
  },
};
