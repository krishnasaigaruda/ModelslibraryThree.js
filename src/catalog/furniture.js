// Catalog entries owned by src/models/furniture*. Merged by src/catalog.js.
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
export default {
  "chair": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createChair",
    "label": "Chair",
    "variants": [
      "dining",
      "office",
      "armchair",
      "rocking",
      "bar-stool",
      "wingback",
      "lounge",
      "folding",
      "gaming",
      "accent-shell",
      "ladder-back",
      "stacking"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "color": "upholstery/shell color",
      "wood": "oak | walnut | cherry | maple | pine | white | black | color",
      "metal": "chrome | steel | black | brass | gold"
    }
  },
  "sofa": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createSofa",
    "label": "Sofa",
    "variants": [
      "loveseat",
      "three-seat",
      "sectional",
      "chesterfield",
      "modern-low",
      "futon"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "color": "upholstery",
      "accentColor": "pillows",
      "wood": "legs/frame"
    }
  },
  "table": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createTable",
    "label": "Table",
    "variants": [
      "dining",
      "farmhouse",
      "coffee",
      "round",
      "side",
      "glass-top",
      "console",
      "picnic"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "wood": "wood",
      "metal": "glass-top frame",
      "width": "metres",
      "depth": "metres"
    }
  },
  "desk": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createDesk",
    "label": "Desk",
    "variants": [
      "writing",
      "computer",
      "standing",
      "executive"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "wood": "wood",
      "metal": "standing frame"
    }
  },
  "bed": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createBed",
    "label": "Bed",
    "variants": [
      "single",
      "double",
      "king",
      "platform",
      "bunk",
      "canopy",
      "crib"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "color": "duvet color",
      "wood": "frame",
      "headColor": "king headboard"
    }
  },
  "wardrobe": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createWardrobe",
    "label": "Wardrobe",
    "variants": [
      "classic",
      "modern",
      "armoire",
      "sliding"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "wood": "wood",
      "seed": "clothes colors"
    }
  },
  "cabinet": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createCabinet",
    "label": "Cabinet",
    "variants": [
      "dresser",
      "nightstand",
      "chest",
      "sideboard",
      "tv-stand"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "wood": "wood"
    }
  },
  "bookshelf": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createBookshelf",
    "label": "Bookshelf",
    "variants": [
      "tall",
      "low",
      "cube",
      "ladder"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "wood": "wood",
      "seed": "book arrangement",
      "books": "false = empty"
    }
  },
  "lamp": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createLamp",
    "label": "Lamp",
    "variants": [
      "floor",
      "desk",
      "pendant",
      "table",
      "chandelier",
      "arc"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "color": "shade color",
      "metal": "metal finish",
      "lightColor": "bulb color",
      "light": "true adds a PointLight",
      "intensity": "light intensity",
      "baseColor": "table-lamp ceramic"
    }
  },
  "fan": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createFan",
    "label": "Fan",
    "variants": [
      "ceiling",
      "standing",
      "tower"
    ],
    "trims": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"],
    "options": {
      "wood": "ceiling blades",
      "color": "body",
      "metal": "metal finish"
    }
  },
  "tv": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createTV",
    "label": "TV",
    "variants": [
      "stand",
      "wall",
      "crt",
      "tabletop"
    ],
    "trims": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"],
    "options": {
      "size": "screen width (m)",
      "screenColor": "color"
    }
  },
  "kitchen": {
    "category": "furniture",
    "sub": "kitchen",
    "source": "js",
    "module": "furniture",
    "factory": "createKitchen",
    "label": "Kitchen",
    "variants": [
      "fridge",
      "french-fridge",
      "mini-fridge",
      "stove",
      "sink-unit",
      "counter",
      "microwave",
      "dishwasher"
    ],
    "trims": {"fridge": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"], "french-fridge": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"], "mini-fridge": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"], "stove": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"], "microwave": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"], "dishwasher": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"], "sink-unit": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"], "counter": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"]},
    "options": {
      "finish": "stainless | white | black",
      "color": "custom enamel color",
      "wood": "cabinet wood",
      "stone": "countertop color"
    }
  },
  "appliance": {
    "category": "furniture",
    "sub": "kitchen",
    "source": "js",
    "module": "furniture",
    "factory": "createAppliance",
    "label": "Appliance",
    "variants": [
      "washing-machine",
      "dryer",
      "top-loader"
    ],
    "trims": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"],
    "options": {
      "color": "body color"
    }
  },
  "bathroom": {
    "category": "furniture",
    "sub": "bathroom",
    "source": "js",
    "module": "furniture",
    "factory": "createBathroom",
    "label": "Bathroom",
    "variants": [
      "toilet",
      "clawfoot-tub",
      "modern-tub",
      "shower",
      "basin",
      "vanity"
    ],
    "trims": {"toilet": ["matte", "black", "speckled", "glazed", "concrete"], "clawfoot-tub": ["matte", "black", "speckled", "glazed", "concrete"], "modern-tub": ["matte", "black", "speckled", "glazed", "concrete"], "shower": ["matte", "black", "speckled", "glazed", "concrete"], "basin": ["matte", "black", "speckled", "glazed", "concrete"], "vanity": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"]},
    "options": {
      "color": "ceramic color",
      "metal": "fixtures",
      "wood": "vanity wood"
    }
  },
  "plant": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createPlant",
    "label": "Plant",
    "variants": [
      "monstera",
      "snake",
      "fern",
      "cactus",
      "fiddle-leaf",
      "succulent"
    ],
    "trims": ["terracotta", "glazed", "concrete", "matte", "speckled", "gold", "black", "large", "small"],
    "options": {
      "potColor": "pot color",
      "seed": "leaf layout"
    }
  },
  "vase": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createVase",
    "label": "Vase",
    "variants": [
      "amphora",
      "bud",
      "cylinder",
      "bowl"
    ],
    "trims": ["terracotta", "glazed", "concrete", "matte", "speckled", "gold", "black", "large", "small"],
    "options": {
      "color": "glaze/glass color",
      "seed": "flower colors"
    }
  },
  "rug": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createRug",
    "label": "Rug",
    "variants": [
      "persian",
      "modern",
      "runner",
      "round"
    ],
    "trims": ["large", "small"],
    "options": {
      "colors": "array of 3-4 colors",
      "seed": "pattern"
    }
  },
  "mirror": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createMirror",
    "label": "Mirror",
    "variants": [
      "wall-round",
      "floor",
      "sunburst"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "metal": "frame metal",
      "wood": "floor frame"
    }
  },
  "clock": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createClock",
    "label": "Clock",
    "variants": [
      "wall",
      "grandfather",
      "mantel"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "color": "wall case",
      "wood": "case wood"
    }
  },
  "frame": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createFrame",
    "label": "Picture frame",
    "variants": [
      "landscape",
      "portrait",
      "photo"
    ],
    "trims": ["modern", "scandinavian", "industrial", "farmhouse", "mid-century", "classic", "japandi", "luxury", "boho", "kids"],
    "options": {
      "wood": "frame wood",
      "seed": "painting"
    }
  },
  "office-equipment": {
    "category": "furniture",
    "sub": "office",
    "source": "js",
    "module": "furniture",
    "factory": "createOffice",
    "label": "Office",
    "variants": [
      "filing-cabinet",
      "whiteboard",
      "water-cooler",
      "printer",
      "locker"
    ],
    "trims": ["black-steel", "white", "retro", "matte-graphite", "panel-ready", "copper", "pro"],
    "options": {
      "color": "body color"
    }
  },
  // "tech" retired: replaced by the dedicated electronics category (laptop, smartphone, tablet, ...)
  "ottoman": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createOttoman",
    "label": "Ottoman",
    "variants": ["pouf", "cube", "tufted-bench", "storage"],
    "trims": [
      "modern",
      "scandinavian",
      "industrial",
      "farmhouse",
      "mid-century",
      "classic",
      "japandi",
      "luxury",
      "boho",
      "kids"
    ],
    "options": {
      "color": "upholstery",
      "wood": "legs"
    }
  },
  "indoor-bench": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createBench",
    "label": "Indoor bench",
    "variants": [
      "entry",
      "dining",
      "storage",
      "garden",
      "piano"
    ],
    "trims": [
      "modern",
      "scandinavian",
      "industrial",
      "farmhouse",
      "mid-century",
      "classic",
      "japandi",
      "luxury",
      "boho",
      "kids"
    ],
    "options": {
      "color": "cushion",
      "wood": "wood"
    }
  },
  "stool": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createStool",
    "label": "Stool",
    "variants": [
      "counter",
      "bar",
      "step",
      "tripod",
      "saddle"
    ],
    "trims": [
      "modern",
      "scandinavian",
      "industrial",
      "farmhouse",
      "mid-century",
      "classic",
      "japandi",
      "luxury",
      "boho",
      "kids"
    ],
    "options": {
      "color": "seat",
      "wood": "wood"
    }
  },
  "piano": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createPiano",
    "label": "Piano",
    "variants": [
      "upright",
      "grand",
      "digital"
    ],
    "trims": [
      "classic",
      "modern",
      "luxury",
      "scandinavian",
      "kids",
      "mid-century"
    ],
    "options": {
      "wood": "case finish"
    }
  },
  "fireplace": {
    "category": "furniture",
    "sub": "furniture",
    "source": "js",
    "module": "furniture",
    "factory": "createFireplace",
    "label": "Fireplace",
    "variants": [
      "brick",
      "modern-linear",
      "wood-stove",
      "mantel-classic"
    ],
    "trims": [],
    "options": {
      "color": "brick color"
    }
  },
  "rack": {
    "category": "furniture",
    "sub": "storage",
    "source": "js",
    "module": "furniture",
    "factory": "createRack",
    "label": "Rack & storage",
    "variants": [
      "coat-stand",
      "hall-tree",
      "shoe-rack",
      "shoe-cabinet",
      "toy-chest",
      "room-divider",
      "slat-divider"
    ],
    "trims": [
      "modern",
      "scandinavian",
      "industrial",
      "farmhouse",
      "mid-century",
      "classic",
      "japandi",
      "luxury",
      "boho",
      "kids"
    ],
    "options": {
      "color": "fabric / paint",
      "wood": "wood",
      "metal": "hooks/hardware"
    }
  },
  "curtains": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createCurtains",
    "label": "Curtains & blinds",
    "variants": [
      "pair",
      "sheer",
      "blackout",
      "roman-blind",
      "venetian-blind"
    ],
    "trims": [
      "classic",
      "modern",
      "boho",
      "farmhouse",
      "luxury"
    ],
    "options": {
      "color": "fabric",
      "metal": "rod finish"
    }
  },
  "outdoor": {
    "category": "furniture",
    "sub": "outdoor",
    "source": "js",
    "module": "furniture",
    "factory": "createOutdoor",
    "label": "Outdoor",
    "variants": [
      "patio-set",
      "lounger",
      "parasol",
      "bbq",
      "hammock",
      "adirondack",
      "swing",
      "fire-pit"
    ],
    "trims": [
      "modern",
      "industrial",
      "farmhouse",
      "boho",
      "scandinavian"
    ],
    "options": {
      "color": "cushions / fabric",
      "wood": "wood",
      "metal": "frame"
    }
  },
  "small-appliance": {
    "category": "furniture",
    "sub": "kitchen",
    "source": "js",
    "module": "furniture",
    "factory": "createSmallAppliance",
    "label": "Small appliance",
    "variants": [
      "coffee-machine",
      "toaster",
      "kettle",
      "blender",
      "stand-mixer",
      "air-fryer",
      "espresso-machine"
    ],
    "trims": [
      "black-steel",
      "white",
      "retro",
      "matte-graphite",
      "panel-ready",
      "copper",
      "pro"
    ],
    "options": {
      "color": "body color"
    }
  },
  "kitchenware": {
    "category": "furniture",
    "sub": "kitchen",
    "source": "js",
    "module": "furniture",
    "factory": "createKitchenware",
    "label": "Kitchenware",
    "variants": [
      "pot",
      "frying-pan",
      "plate-set",
      "cutlery-set",
      "knife-block",
      "cutting-board",
      "dutch-oven",
      "mug-set"
    ],
    "trims": [
      "black-steel",
      "copper",
      "white",
      "retro"
    ],
    "options": {
      "color": "enamel / ceramic color"
    }
  },
  "bath-item": {
    "category": "furniture",
    "sub": "bathroom",
    "source": "js",
    "module": "furniture",
    "factory": "createBathItem",
    "label": "Bath accessory",
    "variants": [
      "towel-rail",
      "laundry-basket",
      "toilet-roll-stand",
      "soap-set",
      "bath-caddy",
      "heated-towel-rail"
    ],
    "trims": [
      "matte",
      "black",
      "speckled",
      "glazed",
      "gold"
    ],
    "options": {
      "color": "towel / ceramic",
      "metal": "chrome | brass | black | gold"
    }
  },
  "decor-item": {
    "category": "furniture",
    "sub": "decor",
    "source": "js",
    "module": "furniture",
    "factory": "createDecorItem",
    "label": "Decor item",
    "variants": [
      "candles",
      "book-stack",
      "basket",
      "sculpture",
      "globe",
      "hourglass",
      "lantern",
      "throw-pillows"
    ],
    "trims": [
      "gold",
      "black",
      "matte",
      "glazed",
      "large",
      "small"
    ],
    "options": {
      "color": "main color",
      "seed": "variation"
    }
  },
};
