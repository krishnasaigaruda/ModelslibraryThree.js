# three-premade

**Realistic, ready-made 3D models for [three.js](https://threejs.org)**: cars, buses, trucks, aircraft, boats, furniture, buildings, people, animals, nature and street props. Every model is original and built by this project. They're animated, recolorable, exportable to `.glb`, and only downloaded when you actually use them.

```js
import { createObject, createAnimator } from 'three-premade';

const car = await createObject('car', { variant: 'minivan', color: 'blue' });
scene.add(car);

const anim = createAnimator(car);
anim.play('drive');
anim.play('lights');          // real headlights
anim.play('steerLeft');       // turns the wheels and holds
// in your render loop:
anim.update(clock.getDelta());
```

---

## Install

```bash
npm install three-premade three
```

`three` is a **peer dependency**. If your project already has three.js, npm reuses that copy and doesn't download a second one. Requires three ≥ 0.160.

## Viewing the models

The package ships with a model viewer and a shop/catalog page:

| Page | What it is |
|---|---|
| `docs/index.html` | Viewer: every model, every variant, colors, animations, copy-paste code, download `.glb` |
| `shop/index.html` | Storefront page you can put on your website (requires three.js, loaded through an import map) |
| `docs/CATALOG.md` | Markdown catalog with a picture of every model |

ES modules need a web server, so you can't just double-click the file:

```bash
cd node_modules/three-premade   # or this repo
npm run serve                   # → http://127.0.0.1:5173/docs/index.html
```

## Creating objects

All of these do the same thing:

```js
createObject('car', { variant: 'minivan', color: 'blue' });
createObject('car:minivan', { color: 'blue' });
createObject({ type: 'car', variant: 'minivan', color: 'blue' });
createObject({ Car: 'minivan', Color: 'blue' });
```

`createObject` returns a `Promise<THREE.Object3D>`. It sits on the ground (y = 0), measures in metres, and comes with `object.animations` (standard `THREE.AnimationClip`s) and `object.userData.premade` (type, variant, options, animation names).

Options every model accepts:

| Option | |
|---|---|
| `variant` | which version (see the catalog) |
| `color` | main color: `'blue'`, `'#ff0000'`, `0xff0000` |
| `scale` | uniform scale |
| `position` | `[x, y, z]` |
| `rotation` | y rotation in radians, or `[x, y, z]` |
| `castShadow`, `receiveShadow` | default `true` |
| `seed` | different random variation (books, trees, outfits…) |

Many types have extra colors and options, for example `interiorColor` and `rimColor` on cars, or `accentColor`, `roofColor` and `seatColor` on buses. See `docs/CATALOG.md` or `CATALOG[type].options`.

## Animations

```js
const anim = createAnimator(object);
anim.names;                 // every animation this object has
anim.play('drive');         // several can run at once
anim.play('hazards');
anim.toggle('lights');
anim.stop('drive');         // eases back to rest
anim.stop();                // stop everything
anim.setSpeed(0.25);        // slow motion for everything
anim.setSpeed('drive', 2);  // or one animation
anim.playing;               // what's on right now
anim.update(delta);         // call every frame
```

Each `createAnimator(obj)` controls only that object, so you can drive one car while another sits with its hazards on.

- **One-shot animations** like `steerLeft`, `steerRight` and `gearUp` play once and hold their pose.
- **Exclusive groups** cancel each other: `steerLeft` replaces `steerRight`, `drive` replaces `reverse`.

Vehicles include `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights` (real spotlights) and `brake`, plus type-specific ones (`siren`, `doors`, `rotors`, `gearUp`, …). Pass `lights: false` to skip the spotlights in big scenes.

Because they're ordinary `AnimationClip`s, you can also use your own `THREE.AnimationMixer`.

## Only download what you use

- Each category (vehicles, furniture, buildings, …) is a separate module, loaded with a dynamic `import()` the first time you create something from it. Bundlers like Vite, webpack and Rollup split these into separate chunks automatically.
- `"sideEffects": false` lets your bundler tree-shake anything unused.
- Import a category directly if you prefer static imports:

```js
import { createCar } from 'three-premade/vehicles';
const suv = createCar({ variant: 'suv' });   // synchronous
```

- Warm the cache ahead of time: `await preload('car', 'bus');`
- `import { CATALOG } from 'three-premade/catalog'` lists everything without loading any model code.

## Export to GLB

```js
import { downloadGLB, exportGLB } from 'three-premade/export';
await downloadGLB(car, 'my-car.glb');  // browser download, animations included
const bytes = await exportGLB(car);    // ArrayBuffer
```

## Quick scene helper (optional)

```js
import { createStage } from 'three-premade/stage';
const stage = await createStage(document.body);
const bus = await createObject('bus', { variant: 'double' });
stage.add(bus, { play: ['drive', 'lights'] });
stage.frame(bus);
```

## Blender models (.glb)

Catalog entries with `source: 'glb'` are modelled in Blender and shipped in `models/<type>/<variant>.glb`. They load through the same `createObject`. To serve them from a CDN instead:

```js
import { setModelBaseUrl } from 'three-premade';
setModelBaseUrl('https://cdn.jsdelivr.net/npm/three-premade@0.1/hd/models/');
```

## Using it without a bundler

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
  "three-premade": "https://cdn.jsdelivr.net/npm/three-premade@0.1/src/index.js"
} }
</script>
```

---

## Development

```bash
npm install          # installs three (dev copy)
npm run serve        # dev server, no caching, http://127.0.0.1:5173
npm test             # builds every model in Node and checks it
npm run thumbnails   # renders docs/images/*.webp (needs `npm run serve` + Chrome)
npm run docs         # regenerates docs/CATALOG.md
```

Dev preview of any module: `test/preview.html?type=car&angle=three,rear&anim=drive`.

## Publishing to npm

1. Create an account at [npmjs.com](https://www.npmjs.com/signup) and run `npm login`.
2. Check the name is still free: `npm view three-premade` should return 404. If it's taken, change `"name"` in `package.json`, e.g. to a scoped `@yourname/three-premade`.
3. Make sure everything passes and the docs are fresh:
   ```bash
   npm test
   npm run serve &        # in another terminal
   npm run thumbnails && npm run docs
   ```
4. Preview exactly what will be uploaded: `npm pack --dry-run`. The `files` list includes `src`, `models`, `shop`, `docs`, the README and the LICENSE.
5. Publish: `npm publish`. A scoped name needs `npm publish --access public`.
6. For later releases, run `npm version patch` (or `minor` / `major`), then `npm publish`.

## License

- **Models: CC0 1.0 (public domain).** Every model, procedural or HD `.glb`, and every preview image is free to use for anything, commercial included, with no attribution required. See [LICENSE-MODELS.md](LICENSE-MODELS.md). Each object also reports it in `object.userData.premade.license`.
- **Code: MIT.** See [LICENSE](LICENSE).

All models are original works of this project.

## Deploying the website (Cloudflare Pages)

The shop and model browser are a fully static site.

1. Render the pictures locally first (`npm run serve` keeps `docs/images` in sync automatically; `npm run thumbnails:check` does a one-off check) and commit them.
2. In Cloudflare Pages, connect the repo and set **Build command** `npm run build:site` and **Build output directory** `dist`.

`/` opens the shop, `/browse` the model browser. three.js loads from jsDelivr; HD `.glb` files are served from the site itself.
