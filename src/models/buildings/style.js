import * as THREE from 'three';

/*
 * Building trims. A trim is a style applied on top of any building variant:
 * it swaps facade/roof materials (design) AND adds or changes geometry through
 * flags the kit reads (quoins, half-timbering, shutters, arched windows,
 * balconettes, hip/mansard roofs, snow, solar panels, ivy, boarded windows…).
 */
export const STYLES = {
  brick: { design: { wallKind: 'brick', wall: '#9c4a36', plinthKind: 'stone', plinth: '#9a948a' }, quoins: '#d8d0c0', headers: true },
  stone: { design: { wallKind: 'stone', wall: '#c2b9a8', plinthKind: 'stone', plinth: '#8e877c' }, quoins: '#e2dccf', headers: true, plinthH: 0.75 },
  timber: { design: { wallKind: 'siding', wall: '#d9d2c0', trim: '#ffffff' }, cornerBoards: true },
  tudor: { design: { wallKind: 'stucco', wall: '#efe7d4', roofKind: 'tile', roof: '#5a4038', trim: '#3a2a1e', plinthKind: 'stone', plinth: '#8e877c' }, tudor: '#3a2a1e', pitch: 1.3 },
  colonial: { design: { wallKind: 'siding', wall: '#f2f0ea', roofKind: 'shingle', roof: '#3a3d42', trim: '#ffffff', accent: '#1f2d3d', door: '#1f2d3d' }, shutters: true, windowStyle: 'grid', dentils: true, cornerBoards: true },
  mediterranean: { design: { wallKind: 'stucco', wall: '#f6efe2', roofKind: 'tile', roof: '#b5562f', trim: '#f6efe2', accent: '#2f6f9f', door: '#6b4226' }, windowStyle: 'arch', balconettes: true, shutters: true, pitch: 0.75 },
  nordic: { design: { wallKind: 'vboard', wall: '#8c2b22', roofKind: 'seam', roof: '#26282b', trim: '#f4f2ee', accent: '#f4f2ee', door: '#26282b' }, cornerBoards: true, pitch: 1.3 },
  modern: { design: { wallKind: 'stucco', wall: '#ecebe7', roofKind: 'seam', roof: '#2e3135', trim: '#2a2b2d', accent: '#6b4a32', door: '#2a2b2d', plinthKind: 'concrete', plinth: '#8a8a88' }, windowStyle: 'none', darkFrames: true, noShutters: true, plinthH: 0.15 },
  hip: { roofStyle: 'hip' },
  mansard: { roofStyle: 'mansard', design: { roofKind: 'shingle', roof: '#3a3d44' } },
  weathered: { weathered: 0.35, moss: true, overgrown: true },
  abandoned: { weathered: 0.75, moss: true, overgrown: true, boarded: true },
  winter: { snow: true },
  solar: { solar: true },
  ivy: { ivy: true },
  fenced: { fence: true },
  industrial: { design: { wallKind: 'corrugated', wall: '#8b9196', roofKind: 'corrugated', roof: '#6f767c', trim: '#2e3236' }, darkFrames: true, noShutters: true },
  concrete: { design: { wallKind: 'concrete', wall: '#b8b4ab', plinthKind: 'concrete', plinth: '#8f8b84', trim: '#7d7a74' }, darkFrames: true, noShutters: true, fins: true },
  glass: { design: { wallKind: 'concrete', wall: '#5d7686', trim: '#30363c' }, darkFrames: true, noShutters: true, curtain: true },
};

const GREY = new THREE.Color('#77736a');
/** weathering: desaturate + darken a colour */
export function weatherColor(c, amount) {
  const col = c.clone();
  col.lerp(GREY, amount * 0.6);
  col.multiplyScalar(1 - amount * 0.3);
  return col;
}

export function styleFor(trim) {
  return (trim && STYLES[trim]) || {};
}

/** Trim lists used by the catalog: every trim changes geometry for that building. */
export const HOUSE_TRIMS = ['brick', 'stone', 'timber', 'tudor', 'colonial', 'mediterranean', 'nordic', 'modern', 'hip', 'mansard', 'weathered', 'abandoned', 'winter', 'solar', 'ivy', 'fenced'];
export const BUILDING_TRIMS = ['brick', 'stone', 'modern', 'weathered', 'abandoned', 'winter', 'solar', 'ivy'];
