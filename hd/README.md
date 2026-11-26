# three-premade-hd

High-detail `.glb` models for [three-premade](https://www.npmjs.com/package/three-premade).

These models are made in Blender by our own build scripts. Every shape and texture is generated in code. No scans, purchased assets or third-party textures are used.

- **Geometry:** real bevels and subdivision.
- **Textures:** baked PBR maps (base color with ambient occlusion, roughness, normal) as 512 px or 1024 px WebP. Sources include wood grain, woven fabric, leather, marble, painted cast iron, stone and ceramic.
- **Compression:** Draco mesh compression. Most files are 20–600 KB.
- **Placement:** sizes are in metres. Models sit on the ground (y = 0) and face +Z.

## Use

You don't import this package yourself. `three-premade` already lists every HD model in its catalog. These are the types whose names start with `hd-`. They load like any other model:

```js
import { createObject } from 'three-premade';

const sofa = await createObject('hd-sofa', { variant: 'leather-cognac', color: '#6b3a1e' });
scene.add(sofa);
```

By default the files are fetched from jsDelivr, so `npm install` doesn't add tens of MB to your app:
`https://cdn.jsdelivr.net/npm/three-premade-hd@0.1/models/<type>/<variant>.glb`

To self-host, install this package (`npm i three-premade-hd`) or copy its `models/` folder to your server, then point the loader at it:

```js
import { setModelBaseUrl } from 'three-premade';
setModelBaseUrl('/assets/three-premade-hd/models/');
```

The files are Draco-compressed. three-premade sets up `DRACOLoader` for you, using the decoder on gstatic by default. Call `setDracoDecoderPath('/draco/')` to serve the decoder yourself.

**Recoloring.** Materials named `*primary*` or `*paint*` take the `color` option. Materials named `*secondary*` or `*fabric*` take `secondaryColor`. Their textures are neutral detail maps, so any color looks right.

## Rebuild

You need Blender 5.x. From the three-premade repo root:

```bash
# everything (one Blender process; ~20–50 s per model)
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python blender/build.py
# one type / variants, with a preview render in blender/_renders/
.../Blender -b --factory-startup --python blender/build.py -- --only hd-sofa --variant modern-grey --render
node blender/check.mjs      # every catalog entry has its file, sizes, on-ground check
```

The builders live in `blender/models/*.py` and the shared helpers in `blender/lib/` (geometry, procedural materials, baking, export). The build also regenerates `src/catalog/hd.js`.

MIT licensed.
