// Catalog entries owned by src/models/transport*. Merged by src/catalog.js.
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
export default {
  "bus": {
    "category": "vehicles",
    "source": "js",
    "module": "transport",
    "factory": "createBus",
    "label": "Bus",
    "variants": ["city","school","double","coach","minibus","articulated","trolleybus","electric","airport","open-top","party"],
    "trims": ["hybrid","retro","bike-rack","advert","night","express"],
    "options": {
      "color": "body color",
      "accentColor": "stripe color",
      "roofColor": "roof color",
      "seatColor": "seat fabric",
      "speed": "m/s"
    }
  },
  "motorcycle": {
    "category": "vehicles",
    "source": "js",
    "module": "transport",
    "factory": "createMotorcycle",
    "label": "Motorcycle",
    "variants": ["sport","cruiser","scooter","dirt","touring","chopper","naked","cafe-racer","adventure","supermoto","electric"],
    "trims": ["police","touring-pack","race","offroad","classic","blackout"],
    "options": {
      "color": "paint color",
      "speed": "m/s",
      "lights": "false = no spotlights"
    }
  },
  "bicycle": {
    "category": "vehicles",
    "source": "js",
    "module": "transport",
    "factory": "createBicycle",
    "label": "Bicycle",
    "variants": [
      "road",
      "mountain",
      "city",
      "bmx",
      "kids",
      "ebike"
    ],
    "trims": ["commuter","basket","child-seat","panniers","aero","fat"],
    "options": {
      "color": "frame color",
      "fenderColor": "mudguard color",
      "speed": "m/s"
    }
  },
  "helicopter": {
    "category": "vehicles",
    "source": "js",
    "module": "transport",
    "factory": "createHelicopter",
    "label": "Helicopter",
    "variants": [
      "civil",
      "rescue",
      "police",
      "military",
      "news",
      "medical",
      "transport"
    ],
    "trims": { "civil": ["floats","wheels","skis","utility","firefighting","vip"], "rescue": ["floats","wheels","skis","utility","firefighting","vip"], "police": ["floats","wheels","skis","utility","firefighting","vip"], "military": ["floats","wheels","skis","utility","firefighting","vip"], "news": ["floats","wheels","skis","utility","firefighting","vip"], "medical": ["floats","wheels","skis","utility","firefighting","vip"], "transport": ["firefighting","utility","skis","medevac","airline"] },
    "options": {
      "color": "body color",
      "accentColor": "stripe color",
      "interiorColor": "seat color"
    }
  },
  "airplane": {
    "category": "vehicles",
    "source": "js",
    "module": "transport",
    "factory": "createAirplane",
    "label": "Airplane",
    "variants": ["prop", "jet", "private-jet", "fighter", "cargo", "seaplane", "narrowbody", "widebody", "jumbo", "regional-jet", "turboprop", "biplane", "glider", "ultralight", "trainer", "four-seater", "twin-prop", "aerobatic", "military-transport", "tanker", "awacs", "jet-trainer", "warbird", "amphibian", "freighter", "water-bomber", "crop-duster", "supersonic", "drone", "blimp", "hot-air-balloon"],
    "trims": {"prop": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "jet": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "private-jet": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "fighter": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "cargo": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "seaplane": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "narrowbody": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "widebody": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "jumbo": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "regional-jet": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "turboprop": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "biplane": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "glider": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "ultralight": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "trainer": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "four-seater": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "twin-prop": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "aerobatic": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "military-transport": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "tanker": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "awacs": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "jet-trainer": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "warbird": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "amphibian": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "freighter": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "water-bomber": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "crop-duster": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "supersonic": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "drone": ["tip-tanks", "pods", "satcom", "belly-pod", "retro"], "blimp": ["branded", "night-sign", "camera", "long-gondola", "retro"], "hot-air-balloon": ["striped", "checkered", "branded", "large", "tethered"]},
    "options": {
      "color": "body color",
      "accentColor": "tail / stripe color"
    }
  },
  "boat": {
    "category": "vehicles",
    "source": "js",
    "module": "transport",
    "factory": "createBoat",
    "label": "Boat",
    "variants": ["speedboat", "sailboat", "yacht", "fishing", "rowboat", "kayak", "ferry", "tugboat", "cargo-ship", "canoe", "jet-ski", "pontoon", "lifeboat", "police-boat", "catamaran"],
    "trims": {"speedboat": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "sailboat": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "yacht": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "fishing": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "rowboat": ["fishing-rig", "flags", "dry-bags", "cooler", "fenders"], "kayak": ["fishing-rig", "flags", "dry-bags", "cooler", "fenders"], "ferry": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "tugboat": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "cargo-ship": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "canoe": ["fishing-rig", "flags", "dry-bags", "cooler", "fenders"], "jet-ski": ["fishing-rig", "flags", "dry-bags", "cooler", "fenders"], "pontoon": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "lifeboat": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "police-boat": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"], "catamaran": ["bimini", "fishing-rig", "flags", "fenders", "radar-arch"]},
    "options": {
      "color": "hull color",
      "accentColor": "stripe color",
      "sailColor": "sail color"
    }
  },
  "train": {"category": "vehicles", "source": "js", "module": "transport", "factory": "createTrain", "label": "Train", "variants": ["diesel", "electric", "steam", "passenger", "sleeper", "high-speed", "subway", "tram", "light-rail", "monorail", "boxcar", "tanker", "hopper", "flatcar", "caboose"], "trims": {"diesel": ["plow", "vintage", "modern", "branded", "dual-cab"], "electric": ["plow", "vintage", "modern", "branded", "double-pan"], "steam": ["plow", "vintage", "modern", "branded", "loaded"], "passenger": ["vintage", "modern", "branded", "roof-gear", "loaded"], "sleeper": ["vintage", "modern", "branded", "roof-gear", "loaded"], "high-speed": ["plow", "modern", "branded", "roof-gear", "double-pan"], "subway": ["vintage", "modern", "branded", "roof-gear", "loaded"], "tram": ["vintage", "modern", "branded", "roof-gear", "snow-shield"], "light-rail": ["vintage", "modern", "branded", "roof-gear", "snow-shield"], "monorail": ["vintage", "modern", "branded", "roof-gear", "loaded"], "boxcar": ["vintage", "modern", "branded", "roof-gear", "loaded"], "tanker": ["vintage", "modern", "branded", "roof-gear", "loaded"], "hopper": ["vintage", "modern", "branded", "roof-gear", "loaded"], "flatcar": ["vintage", "modern", "branded", "roof-gear", "loaded"], "caboose": ["vintage", "modern", "branded", "roof-gear", "plow"]}, "options": {"color": "body color", "accentColor": "stripe / lettering color", "speed": "m/s for drive"}},
  "misc-vehicle": {"category": "vehicles", "source": "js", "module": "transport", "factory": "createMiscVehicle", "label": "Small vehicle", "variants": ["atv", "snowmobile", "go-kart", "golf-cart", "tuk-tuk", "kick-scooter", "segway", "skateboard", "wheelchair", "stroller", "rickshaw", "carriage", "sled"], "trims": ["sport", "utility", "retro", "lights", "canopy"], "options": {"color": "main color", "speed": "m/s for drive"}},
};
