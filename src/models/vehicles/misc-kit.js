import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { clip } from '../../core/animation.js';

/*
 * Shared helpers for the transport chunk (buses, bikes, aircraft, boats, trains, misc).
 */

/**
 * Sculpted panel: a side-profile outline (x,y) extruded across Z with a big bevel,
 * then pinched across Z by `taper(x, y) → 0..1` (1 = full width). Gives tanks,
 * fairings, seats, hulls with a crisp silhouette and soft rounded edges.
 */
export function sculpt(points, width, { bevel = 0.04, taper, segments = 4, curveSegments = 24, smooth = false } = {}) {
  const shape = points instanceof THREE.Shape ? points : new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const b = Math.min(bevel, width / 2 - 1e-3);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(width - 2 * b, 1e-3),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b * 0.9,
    bevelSegments: segments,
    curveSegments,
  });
  geo.translate(0, 0, -(width - 2 * b) / 2);
  // the bevel grows the outline outwards: scale back so the side view matches the given outline
  const pts2 = shape.getPoints(curveSegments);
  const ob = new THREE.Box2().setFromPoints(pts2);
  geo.computeBoundingBox();
  const gb = geo.boundingBox;
  const oc = ob.getCenter(new THREE.Vector2());
  const gc = new THREE.Vector3();
  gb.getCenter(gc);
  const sx = (ob.max.x - ob.min.x) / (gb.max.x - gb.min.x);
  const sy = (ob.max.y - ob.min.y) / (gb.max.y - gb.min.y);
  geo.translate(-gc.x, -gc.y, 0).scale(sx, sy, 1).translate(oc.x, oc.y, 0);
  if (taper) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * taper(p.getX(i), p.getY(i)));
  }
  if (smooth) {
    // weld cap/bevel/side seams so the surface shades smoothly (no facets)
    geo.deleteAttribute('normal');
    geo.deleteAttribute('uv');
    const welded = mergeVertices(geo, 1e-4);
    welded.clearGroups();
    welded.computeVertexNormals();
    return welded;
  }
  geo.computeVertexNormals();
  return geo;
}

/** Smooth closed outline through control points (Catmull-Rom) as a Shape. */
export function smoothShape(points, samples = 64) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  return new THREE.Shape(curve.getPoints(samples).map((v) => new THREE.Vector2(v.x, v.y)));
}

/** Canvas texture helper (null in Node). draw(ctx, w, h). */
export function canvasTex(w, h, draw) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Licence plate material with readable text. */
export function plateMaterial(text = 'TP 0123', { bg = '#f4f3ee', fg = '#1a1a1a', border = '#1a1a1a' } = {}) {
  const map = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = border;
    g.lineWidth = 4;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = fg;
    g.font = 'bold 40px Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
  });
  return new THREE.MeshStandardMaterial({ color: map ? '#ffffff' : bg, map, roughness: 0.4, metalness: 0.1, name: 'plate' });
}

/** Text decal material (livery lettering, numbers). Transparent background. */
export function textMaterial(text, { color = '#ffffff', font = 'bold 72px Arial, sans-serif', w = 512, h = 128, stroke } = {}) {
  const map = canvasTex(w, h, (g) => {
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (stroke) {
      g.lineWidth = 8;
      g.strokeStyle = stroke;
      g.strokeText(text, w / 2, h / 2);
    }
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2);
  });
  return new THREE.MeshStandardMaterial({ map, transparent: true, color: map ? '#ffffff' : color, opacity: map ? 1 : 0, roughness: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, name: 'decal' });
}

/** Flat decal plane facing `normal` at `at`. */
export function decal(parent, mat, { at, normal = [0, 0, 1], w = 1, h = 0.25, name } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(...at);
  m.lookAt(m.position.clone().add(new THREE.Vector3(...normal)));
  if (name) m.name = name;
  m.userData.noShadow = true;
  parent.add(m);
  return m;
}

/**
 * Aircraft / boat navigation lights. Returns the tracks for a 'lights' clip and a
 * blinking 'beacon' (red anti-collision) + 'strobes' (white wingtip strobes).
 *   nav({ parent, red: [[x,y,z]], green: [...], white: [...], beacon: [...], strobe: [...], landing: [...] })
 */
export function navLights(parent, { red = [], green = [], white = [], beacon = [], strobe = [], landing = [], size = 0.07, landingNormal = [1, 0, 0] }) {
  const groups = {};
  const put = (key, kind, list, opts = {}) => {
    if (!list.length) return;
    const g = lampGroup(`nav_${key}`, kind);
    for (const p of list) {
      const [at, normal] = Array.isArray(p[0]) ? p : [p, opts.normal ?? [0, 1, 0]];
      g.add(parent, { at, normal, w: opts.w ?? size, h: opts.h ?? size, depth: size * 0.4, shape: 'round', bezel: false, glowSize: (opts.w ?? size) * 6 });
    }
    groups[key] = g;
  };
  put('red', 'red', red);
  put('green', 'green', green);
  put('white', 'white', white);
  put('beacon', 'red', beacon);
  put('strobe', 'white', strobe);
  put('landing', 'head', landing, { normal: landingNormal, w: size * 1.8, h: size * 1.8 });
  const tracks = [];
  for (const k of ['red', 'green', 'white', 'landing']) if (groups[k]) tracks.push(...lampTracks(`nav_${k}`, LAMP_ON[k === 'landing' ? 'head' : k === 'white' ? 'white' : k], { glow: 0.9 }));
  const anims = [];
  if (tracks.length) anims.push(clip('lights', 1, tracks));
  const blink = [];
  if (groups.beacon) blink.push(...lampTracks('nav_beacon', 4, { blink: 1 }));
  if (groups.strobe) {
    blink.push(new THREE.NumberKeyframeTrack('nav_strobe.material.emissiveIntensity', [0, 0.08, 0.5, 0.58, 1.2], [8, 0, 8, 0, 0], THREE.InterpolateDiscrete));
    blink.push(new THREE.NumberKeyframeTrack('nav_strobe_glow.material.opacity', [0, 0.08, 0.5, 0.58, 1.2], [1, 0, 1, 0, 0], THREE.InterpolateDiscrete));
  }
  if (blink.length) anims.push(clip('beacon', 1.2, blink));
  return { groups, animations: anims };
}

/** Emergency light bar tracks: alternate red/blue (or amber) groups. */
export function sirenClip(nameA, nameB, { period = 0.5, intensity = 3, clipName = 'siren' } = {}) {
  const D = THREE.InterpolateDiscrete;
  const t = [0, period / 2, period];
  return clip(clipName, period, [
    new THREE.NumberKeyframeTrack(`${nameA}.material.emissiveIntensity`, t, [intensity, 0, 0], D),
    new THREE.NumberKeyframeTrack(`${nameA}_glow.material.opacity`, t, [1, 0, 0], D),
    new THREE.NumberKeyframeTrack(`${nameB}.material.emissiveIntensity`, t, [0, intensity, intensity], D),
    new THREE.NumberKeyframeTrack(`${nameB}_glow.material.opacity`, t, [0, 1, 1], D),
  ]);
}

/** Merge trim modifiers: TRIMS[trim] may be an object or fn(variantSpec) → object. */
export function applyTrim(spec, trims, trim, type) {
  if (!trim) return { ...spec };
  const t = trims[trim];
  if (!t) throw new Error(`[three-premade] Unknown ${type} trim "${trim}". Available: ${Object.keys(trims).join(', ')}`);
  return { ...spec, ...(typeof t === 'function' ? t(spec) : t), trim };
}
