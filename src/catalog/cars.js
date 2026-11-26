// Catalog entries owned by src/models/cars*. Merged by src/catalog.js.
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
export default {
  "car": {
    "category": "vehicles",
    "source": "js",
    "module": "cars",
    "factory": "createCar",
    "label": "Car",
    "variants": ["sedan","hatchback","wagon","coupe","suv","minivan","sports","convertible","pickup","taxi","police","crossover","compact","citycar","microcar","limousine","roadster","muscle","luxury","ev","offroader","large-suv","fastback","shooting-brake","hot-hatch","supercar","classic","mpv","crew-pickup","liftback"],
    "trims": ["sport","luxury","offroad","eco","classic","rally","stance","touring"],
    "options": {
      "color": "body paint",
      "interiorColor": "seats",
      "rimColor": "wheels",
      "metallic": "0–1",
      "glassTint": "window tint",
      "lights": "false = no real headlight spotlights",
      "speed": "m/s for drive animation",
      "plate": "licence plate text",
      "badge": "boot badge text"
    }
  },
  "van": {
    "category": "vehicles",
    "source": "js",
    "module": "cars",
    "factory": "createVan",
    "label": "Van",
    "variants": ["cargo","panel","high-roof","passenger","camper","ambulance","delivery","food-truck","minibus","crew-van","refrigerated","postal"],
    "trims": ["work","ladder","offroad","luxury","courier","touring"],
    "options": {
      "color": "body paint",
      "interiorColor": "seats",
      "rimColor": "wheels",
      "glassTint": "window tint",
      "lights": "false = no real headlight spotlights",
      "speed": "m/s for drive animation",
      "plate": "licence plate text"
    }
  },
};
