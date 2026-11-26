import { derive } from './species.js';

/* Bird trims: chick (downy baby), fluffed (puffed-up winter plumage), juvenile (duller, shorter tail), nesting (sitting on a nest). */
export function applyBirdTrim(spec, trim) {
  switch (trim) {
    case 'chick': {
      const down = spec.swims || spec.comb || spec.wattle ? '#f2dc6a' : '#cfc4b4';
      return derive(spec, {
        L: spec.L * 0.32,
        body: { len: spec.body.len * 0.95, depth: spec.body.depth * 1.25, width: spec.body.width * 1.2, tilt: Math.min(spec.body.tilt, 25) },
        neck: { len: spec.neck.len * 0.6, r: spec.neck.r * 1.4, s: 0 },
        head: { r: spec.head.r * 1.55 },
        beak: { len: spec.beak.len * 0.55 },
        wing: { len: spec.wing.len * 0.45 },
        tail: { len: spec.tail.len * 0.25 },
        legs: { len: spec.legs.len * 1.15, r: spec.legs.r * 1.3 },
        eyes: { r: (spec.eyes?.r ?? 0.2) * 1.15 },
        fluff: (spec.fluff ?? 0.015) * 3.2,
        comb: null, crest: null, wattle: null,
        coat: { back: down, belly: down, breast: down, head: down, throat: null, cap: null, face: null, collar: null, eyeStripe: null, wing: down, primaries: down, wingBar: null, tail: down, speckle: null },
      });
    }
    case 'fluffed':
      return derive(spec, { fluff: (spec.fluff ?? 0.015) * 4, body: { depth: spec.body.depth * 1.38, width: spec.body.width * 1.45, len: spec.body.len * 0.92 }, neck: { len: spec.neck.len * 0.3, r: spec.neck.r * 1.8 }, head: { r: spec.head.r * 1.1 } });
    case 'juvenile':
      return derive(spec, { L: spec.L * 0.82, fluff: (spec.fluff ?? 0.015) * 1.8, tail: { len: spec.tail.len * 0.55 }, head: { r: spec.head.r * 1.15 }, comb: spec.comb ? { ...spec.comb, size: (spec.comb.size ?? 1) * 0.4 } : undefined, crest: spec.crest ? { ...spec.crest, h: spec.crest.h * 0.5 } : undefined, coat: { breast: '#b8a890', belly: '#d8ccb8', throat: null, head: '#8a7a68', face: null, cap: null, collar: null, back: '#7a6a58', wing: '#6a5a48', speckle: '#4a3a2a' } });
    case 'nesting':
      return derive(spec, { nest: true, tail: { tilt: Math.max(spec.tail.tilt ?? 0, 30), len: Math.min(spec.tail.len, 0.3) } });
    default:
      return spec;
  }
}
