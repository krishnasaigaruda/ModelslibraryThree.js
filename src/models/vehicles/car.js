import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, extrudeOutline, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { moveTrack, rotateTrack, clip, wave } from '../../core/animation.js';
import { createLoft, smoothKeys } from '../../core/loft.js';
import { brandEmblem } from '../../core/brand.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { addWheels, wheelWell, vehicleAnimations, addHeadlightSpots, buildWheel } from './wheel.js';
import { buildVanParts } from './van-parts.js';
import { buildPanels } from './car-panels.js';
import { ringPos, surfAt, surfaceGrid, surfaceLamp, plate, plateText, textMaterial, drawMaterial, crossRail, rearWing, dressWheel, atTread, roofBars, auxLamps } from './car-parts.js';

/*
 * Each variant is described by its side silhouette (top line, shoulder line,
 * sill line), plan rounding, wheel placement and window/door layout.
 * x = metres along the car (front = +X), y = metres up.
 */

const SEDAN = {
  L: 4.7, W: 1.84, wr: 0.33, xf: 1.42, xr: -1.4,
  top: [[-2.35, 0.9], [-2.22, 0.99], [-1.55, 1.03], [-0.95, 1.4], [-0.6, 1.45], [0.05, 1.44], [0.85, 1.04], [1.6, 0.96], [2.2, 0.86], [2.35, 0.76]],
  shoulder: [[-2.35, 0.84], [-1.5, 0.93], [0.85, 0.94], [1.8, 0.86], [2.35, 0.68]],
  sill: [[-2.35, 0.52], [-2.0, 0.32], [2.0, 0.3], [2.35, 0.46]],
  nose: { len: 0.75, p: 2.3 }, tail: { len: 0.42, p: 3 },
  windshield: [0.1, 0.8], rearGlass: { x: [-1.3, -0.97], top: true },
  sideWindows: [[-0.5, 0.8], [-1.3, -0.6]], bPillar: [-0.6, -0.5],
  doors: [0.84, -0.55, -1.36], handles: [0.05, -0.95],
  color: '#24477a', tailBar: false,
};

/** Scale every x quantity of a body to a new length (keeps heights). */
function stretch(b, L, extra = {}) {
  const k = L / b.L;
  const X = (pts) => pts.map(([x, y]) => [x * k, y]);
  const R = (r) => r && r.map((v) => v * k);
  return {
    ...b, L, xf: b.xf * k, xr: b.xr * k,
    top: X(b.top), shoulder: X(b.shoulder), sill: X(b.sill),
    nose: { ...b.nose, len: b.nose.len * k }, tail: { ...b.tail, len: b.tail.len * k },
    windshield: R(b.windshield), rearGlass: b.rearGlass && { ...b.rearGlass, x: R(b.rearGlass.x) },
    sideWindows: b.sideWindows.map(R), bPillar: R(b.bPillar), doors: R(b.doors), bed: R(b.bed), open: R(b.open),
    ...extra,
  };
}
/** Raise the roof line (y of top keys above the belt) by dy. */
const raise = (pts, dy, above = 1.2) => pts.map(([x, y]) => [x, y > above ? y + dy : y]);

export const CAR_VARIANTS = {
  sedan: SEDAN,
  hatchback: {
    L: 4.15, W: 1.78, wr: 0.32, xf: 1.3, xr: -1.25,
    top: [[-2.075, 1.34], [-2.02, 1.44], [-1.8, 1.49], [-1.5, 1.5], [0.0, 1.49], [0.85, 1.06], [1.5, 0.97], [1.95, 0.86], [2.075, 0.78]],
    shoulder: [[-2.075, 0.92], [0.85, 0.95], [1.7, 0.86], [2.075, 0.72]],
    sill: [[-2.075, 0.5], [-1.8, 0.32], [1.8, 0.3], [2.075, 0.45]],
    nose: { len: 0.6, p: 2.4 }, tail: { len: 0.3, p: 3.5 }, rake: { rear: 0.18 },
    windshield: [0.12, 0.8], rearGlass: { x: [-2.075, -1.92], face: true },
    sideWindows: [[-0.45, 0.8], [-1.62, -0.55]], bPillar: [-0.55, -0.45],
    doors: [0.84, -0.5, -1.55], handles: [0.05, -0.85],
    color: '#b3261e', tailBar: false,
  },
  wagon: {
    ...SEDAN, L: 4.8,
    top: [[-2.4, 1.36], [-2.34, 1.44], [-2.15, 1.46], [0.05, 1.46], [0.85, 1.04], [1.6, 0.96], [2.25, 0.86], [2.4, 0.76]],
    shoulder: [[-2.4, 0.9], [-1.5, 0.94], [0.85, 0.94], [1.8, 0.86], [2.4, 0.68]],
    sill: [[-2.4, 0.5], [-2.05, 0.32], [2.05, 0.3], [2.4, 0.46]],
    tail: { len: 0.28, p: 4 }, rake: { rear: 0.12 }, xr: -1.45,
    rearGlass: { x: [-2.4, -2.26], face: true },
    sideWindows: [[-0.5, 0.8], [-1.4, -0.6], [-2.15, -1.5]],
    color: '#5b6b5a',
  },
  coupe: {
    ...SEDAN, L: 4.6, W: 1.86,
    top: [[-2.3, 0.94], [-2.17, 1.0], [-1.45, 1.03], [-0.7, 1.35], [-0.25, 1.38], [0.75, 1.0], [1.55, 0.92], [2.15, 0.82], [2.3, 0.72]],
    shoulder: [[-2.3, 0.84], [-1.4, 0.92], [0.75, 0.9], [1.8, 0.82], [2.3, 0.64]],
    xf: 1.38, xr: -1.36,
    windshield: [-0.15, 0.72], rearGlass: { x: [-1.4, -0.75], top: true },
    sideWindows: [[-1.15, 0.72]], bPillar: null, doors: [0.78, -1.2], handles: [-0.9],
    color: '#e6e6e3',
  },
  suv: {
    L: 4.75, W: 1.96, wr: 0.4, xf: 1.48, xr: -1.42,
    top: [[-2.375, 1.76], [-2.32, 1.82], [-2.1, 1.84], [0.3, 1.83], [1.05, 1.24], [1.8, 1.16], [2.25, 1.06], [2.375, 0.96]],
    shoulder: [[-2.375, 1.1], [1.0, 1.15], [2.0, 1.05], [2.375, 0.9]],
    sill: [[-2.375, 0.72], [-2.0, 0.52], [2.0, 0.5], [2.375, 0.68]],
    nose: { len: 0.55, p: 3 }, tail: { len: 0.3, p: 4 }, rake: { rear: 0.12 },
    windshield: [0.38, 0.98], rearGlass: { x: [-2.375, -2.22], face: true },
    sideWindows: [[-0.55, 0.98], [-1.55, -0.65], [-2.12, -1.65]], bPillar: [-0.65, -0.55],
    doors: [1.02, -0.6, -1.6], handles: [0.3, -0.9],
    color: '#3a3d40', roofRails: true, ride: 'tall',
  },
  minivan: {
    L: 5.1, W: 1.98, wr: 0.37, xf: 1.75, xr: -1.4,
    top: [[-2.55, 1.72], [-2.48, 1.78], [-2.2, 1.8], [0.6, 1.79], [1.6, 1.12], [2.1, 1.0], [2.45, 0.92], [2.55, 0.84]],
    shoulder: [[-2.55, 1.0], [1.5, 1.02], [2.2, 0.92], [2.55, 0.8]],
    sill: [[-2.55, 0.6], [-2.2, 0.38], [2.2, 0.36], [2.55, 0.55]],
    nose: { len: 0.75, p: 2.4 }, tail: { len: 0.3, p: 4 }, rake: { rear: 0.1 },
    windshield: [0.72, 1.55], rearGlass: { x: [-2.55, -2.4], face: true },
    sideWindows: [[0.2, 1.55], [-1.2, 0.1], [-2.3, -1.3]], bPillar: [0.1, 0.2],
    doors: [1.58, 0.15, -1.25], handles: [0.9, -0.1],
    color: '#9aa4ae', roofRails: true,
  },
  sports: {
    L: 4.5, W: 1.98, wr: 0.34, xf: 1.38, xr: -1.32,
    top: [[-2.25, 0.86], [-2.1, 0.94], [-1.7, 0.98], [-0.9, 1.16], [-0.35, 1.19], [0.45, 0.86], [1.4, 0.75], [2.1, 0.6], [2.25, 0.52]],
    shoulder: [[-2.25, 0.78], [-1.2, 0.86], [0.4, 0.76], [1.6, 0.64], [2.25, 0.44]],
    sill: [[-2.25, 0.4], [-1.9, 0.22], [1.9, 0.2], [2.25, 0.3]],
    nose: { len: 0.95, p: 2.0 }, tail: { len: 0.4, p: 3.5 },
    windshield: [-0.3, 0.42], rearGlass: { x: [-1.65, -0.95], top: true },
    sideWindows: [[-1.15, 0.42]], bPillar: null, doors: [0.5, -1.15], handles: [-0.85],
    color: '#c8141e', spoiler: true, caliper: '#f2c200', wheelStyle: 'ten', tailBar: true, lowCabin: true,
  },
  convertible: {
    L: 4.5, W: 1.88, wr: 0.34, xf: 1.36, xr: -1.34,
    top: [[-2.25, 0.9], [-2.12, 0.97], [-1.3, 1.0], [-0.4, 0.99], [0.5, 1.0], [1.5, 0.9], [2.1, 0.78], [2.25, 0.68]],
    shoulder: [[-2.25, 0.82], [-1.3, 0.9], [0.5, 0.9], [1.7, 0.8], [2.25, 0.6]],
    sill: [[-2.25, 0.48], [-1.95, 0.28], [1.95, 0.27], [2.25, 0.42]],
    nose: { len: 0.8, p: 2.2 }, tail: { len: 0.45, p: 3 },
    open: [-1.35, 0.55], windshieldFrame: 0.6, sideWindows: [], bPillar: null,
    doors: [0.62, -1.2], handles: [-0.9], color: '#0f5c63',
  },
  pickup: {
    L: 5.4, W: 2.02, wr: 0.42, xf: 1.75, xr: -1.6,
    top: [[-2.7, 1.16], [-2.62, 1.22], [-0.78, 1.22], [-0.68, 1.8], [-0.55, 1.89], [0.6, 1.89], [1.35, 1.3], [2.1, 1.22], [2.55, 1.12], [2.7, 1.0]],
    shoulder: [[-2.7, 1.12], [1.3, 1.16], [2.2, 1.1], [2.7, 0.95]],
    sill: [[-2.7, 0.78], [-2.45, 0.56], [2.3, 0.55], [2.7, 0.75]],
    nose: { len: 0.5, p: 3.2 }, tail: { len: 0.14, p: 5 },
    windshield: [0.65, 1.3], bed: [-2.62, -0.82],
    sideWindows: [[-0.6, 1.3]], bPillar: null, doors: [1.33, -0.65], handles: [0.15],
    color: '#1f5a38', wheelStyle: 'steel', roofRails: false, ride: 'tall',
  },
  taxi: { ...SEDAN, color: '#f2c200', taxi: true },
  police: { ...SEDAN, color: '#15181c', police: true, wheelStyle: 'steel' },
  // ---- more body styles (generic designs with real-world class proportions) ----
  crossover: {
    L: 4.45, W: 1.86, wr: 0.355, xf: 1.36, xr: -1.31,
    top: [[-2.225, 1.5], [-2.17, 1.58], [-1.9, 1.63], [0.1, 1.63], [0.95, 1.14], [1.6, 1.05], [2.08, 0.95], [2.225, 0.85]],
    shoulder: [[-2.225, 1.0], [0.95, 1.04], [1.8, 0.95], [2.225, 0.8]],
    sill: [[-2.225, 0.62], [-1.9, 0.44], [1.9, 0.42], [2.225, 0.58]],
    nose: { len: 0.6, p: 2.6 }, tail: { len: 0.3, p: 3.6 }, rake: { rear: 0.16 },
    windshield: [0.2, 0.92], rearGlass: { x: [-2.225, -2.08], face: true },
    sideWindows: [[-0.55, 0.92], [-1.72, -0.65]], bPillar: [-0.65, -0.55],
    doors: [0.94, -0.6, -1.66], color: '#7a2c1e', ride: 'tall', roofRails: true,
  },
  compact: null, // filled below (stretched sedan)
  citycar: {
    L: 3.6, W: 1.66, wr: 0.3, xf: 1.2, xr: -1.17,
    top: [[-1.8, 1.4], [-1.76, 1.48], [-1.55, 1.53], [0.15, 1.53], [0.85, 1.08], [1.45, 0.96], [1.8, 0.84]],
    shoulder: [[-1.8, 0.94], [0.85, 0.97], [1.5, 0.88], [1.8, 0.74]],
    sill: [[-1.8, 0.5], [-1.55, 0.3], [1.55, 0.3], [1.8, 0.45]],
    nose: { len: 0.5, p: 2.5 }, tail: { len: 0.25, p: 3.8 }, rake: { rear: 0.1 },
    windshield: [0.18, 0.82], rearGlass: { x: [-1.8, -1.66], face: true },
    sideWindows: [[-0.4, 0.82], [-1.45, -0.5]], bPillar: [-0.5, -0.4],
    doors: [0.84, -0.45, -1.4], color: '#4f9a8c',
  },
  microcar: {
    L: 2.7, W: 1.56, wr: 0.28, xf: 0.9, xr: -0.86,
    top: [[-1.35, 1.32], [-1.3, 1.45], [-1.05, 1.52], [0.1, 1.5], [0.7, 1.05], [1.15, 0.9], [1.35, 0.78]],
    shoulder: [[-1.35, 0.9], [0.7, 0.93], [1.2, 0.84], [1.35, 0.7]],
    sill: [[-1.35, 0.48], [-1.15, 0.3], [1.15, 0.3], [1.35, 0.44]],
    nose: { len: 0.4, p: 2.4 }, tail: { len: 0.22, p: 3.5 },
    windshield: [0.12, 0.68], rearGlass: { x: [-1.35, -1.22], face: true },
    sideWindows: [[-0.92, 0.68]], bPillar: null, doors: [0.7, -0.98], color: '#e2b13c',
  },
  limousine: {
    L: 6.4, W: 1.9, wr: 0.34, xf: 2.27, xr: -2.25,
    top: [[-3.2, 0.92], [-3.07, 1.0], [-2.4, 1.04], [-1.8, 1.42], [-1.45, 1.47], [0.9, 1.46], [1.7, 1.05], [2.45, 0.97], [3.05, 0.87], [3.2, 0.77]],
    shoulder: [[-3.2, 0.85], [-2.35, 0.94], [1.7, 0.95], [2.65, 0.87], [3.2, 0.69]],
    sill: [[-3.2, 0.52], [-2.85, 0.32], [2.85, 0.3], [3.2, 0.46]],
    nose: { len: 0.75, p: 2.3 }, tail: { len: 0.42, p: 3 },
    windshield: [0.95, 1.65], rearGlass: { x: [-2.15, -1.82], top: true },
    sideWindows: [[0.35, 1.65], [-0.75, 0.25], [-2.15, -0.85]], bPillar: [0.25, 0.35],
    doors: [1.69, 0.3, -0.8, -2.21], color: '#111214', chromeTrim: true,
  },
  roadster: {
    L: 4.0, W: 1.76, wr: 0.32, xf: 1.25, xr: -1.2,
    top: [[-2.0, 0.86], [-1.88, 0.93], [-1.2, 0.95], [-0.5, 0.94], [0.3, 0.95], [1.3, 0.84], [1.85, 0.72], [2.0, 0.62]],
    shoulder: [[-2.0, 0.8], [-1.2, 0.88], [0.3, 0.86], [1.5, 0.76], [2.0, 0.56]],
    sill: [[-2.0, 0.44], [-1.7, 0.25], [1.7, 0.24], [2.0, 0.38]],
    nose: { len: 0.8, p: 2.1 }, tail: { len: 0.4, p: 3 },
    open: [-0.95, 0.35], windshieldFrame: 0.4, sideWindows: [], bPillar: null,
    doors: [0.42, -0.9], color: '#2d4d8a', rollHoops: true,
  },
  muscle: {
    L: 4.85, W: 1.92, wr: 0.35, xf: 1.55, xr: -1.4,
    top: [[-2.425, 0.98], [-2.3, 1.04], [-1.6, 1.06], [-0.75, 1.34], [-0.3, 1.37], [0.55, 1.0], [1.6, 0.96], [2.3, 0.9], [2.425, 0.8]],
    shoulder: [[-2.425, 0.9], [-1.5, 0.94], [0.55, 0.92], [1.9, 0.9], [2.425, 0.74]],
    sill: [[-2.425, 0.5], [-2.1, 0.3], [2.1, 0.29], [2.425, 0.44]],
    nose: { len: 0.45, p: 3.2 }, tail: { len: 0.3, p: 4 },
    windshield: [-0.2, 0.52], rearGlass: { x: [-1.55, -0.8], top: true },
    sideWindows: [[-1.2, 0.52]], bPillar: null, doors: [0.55, -1.25],
    color: '#e07a10', hoodScoop: true, tailBar: true, wheelStyle: 'five',
  },
  luxury: null,
  ev: null,
  offroader: {
    L: 4.4, W: 1.9, wr: 0.42, xf: 1.3, xr: -1.3,
    top: [[-2.2, 1.84], [-2.16, 1.9], [-1.9, 1.92], [0.45, 1.91], [0.75, 1.42], [1.9, 1.32], [2.15, 1.22], [2.2, 1.12]],
    shoulder: [[-2.2, 1.2], [0.75, 1.26], [2.0, 1.2], [2.2, 1.02]],
    sill: [[-2.2, 0.76], [-2.0, 0.6], [2.0, 0.6], [2.2, 0.74]],
    nose: { len: 0.3, p: 5 }, tail: { len: 0.2, p: 6 },
    windshield: [0.5, 0.78], rearGlass: { x: [-2.2, -2.12], face: true },
    sideWindows: [[-0.5, 0.78], [-1.95, -0.6]], bPillar: [-0.6, -0.5],
    doors: [0.78, -0.55, -1.5], color: '#5d6b4a', spareWheel: true, flares: true, wheelStyle: 'steel', ride: 'tall', roundLamps: true,
  },
  'large-suv': null,
  fastback: {
    L: 4.9, W: 1.88, wr: 0.34, xf: 1.48, xr: -1.42,
    top: [[-2.45, 0.98], [-2.32, 1.04], [-1.9, 1.08], [-0.8, 1.38], [-0.4, 1.42], [0.15, 1.41], [0.95, 1.02], [1.7, 0.94], [2.3, 0.84], [2.45, 0.74]],
    shoulder: [[-2.45, 0.86], [-1.5, 0.94], [0.95, 0.93], [1.85, 0.85], [2.45, 0.67]],
    sill: [[-2.45, 0.5], [-2.1, 0.31], [2.1, 0.29], [2.45, 0.44]],
    nose: { len: 0.8, p: 2.2 }, tail: { len: 0.4, p: 3.2 },
    windshield: [0.15, 0.9], rearGlass: { x: [-1.85, -0.85], top: true },
    sideWindows: [[-0.45, 0.9], [-1.35, -0.55]], bPillar: [-0.55, -0.45],
    doors: [0.94, -0.5, -1.4], color: '#3b3f46', tailBar: true, lip: true,
  },
  'shooting-brake': {
    L: 4.7, W: 1.86, wr: 0.34, xf: 1.42, xr: -1.4,
    top: [[-2.35, 1.16], [-2.27, 1.26], [-2.0, 1.32], [0.0, 1.36], [0.8, 1.0], [1.55, 0.92], [2.2, 0.82], [2.35, 0.72]],
    shoulder: [[-2.35, 0.88], [-1.5, 0.92], [0.8, 0.91], [1.8, 0.84], [2.35, 0.66]],
    sill: [[-2.35, 0.5], [-2.0, 0.31], [2.0, 0.29], [2.35, 0.44]],
    nose: { len: 0.75, p: 2.2 }, tail: { len: 0.28, p: 4 }, rake: { rear: 0.3 },
    windshield: [0.0, 0.76], rearGlass: { x: [-2.35, -2.2], face: true },
    sideWindows: [[-1.0, 0.76], [-2.0, -1.1]], bPillar: [-1.1, -1.0], doors: [0.78, -1.05], color: '#5a6e50',
  },
  'hot-hatch': null,
  supercar: {
    L: 4.6, W: 2.04, wr: 0.35, xf: 1.45, xr: -1.38,
    top: [[-2.3, 0.98], [-2.2, 1.03], [-1.2, 1.05], [-0.5, 1.12], [-0.05, 1.14], [0.6, 0.82], [1.5, 0.7], [2.2, 0.52], [2.3, 0.45]],
    shoulder: [[-2.3, 0.86], [-1.0, 0.9], [0.5, 0.72], [1.6, 0.6], [2.3, 0.4]],
    sill: [[-2.3, 0.36], [-2.0, 0.18], [2.0, 0.17], [2.3, 0.26]],
    nose: { len: 1.0, p: 1.9 }, tail: { len: 0.3, p: 4 },
    windshield: [-0.1, 0.6], rearGlass: { x: [-1.15, -0.5], top: true },
    sideWindows: [[-0.7, 0.6]], bPillar: null, doors: [0.62, -0.85],
    color: '#f2c200', caliper: '#111', wheelStyle: 'ten', lowCabin: true, sideIntakes: true, tailBar: true, wing: true,
  },
  classic: null,
  mpv: null,
  'crew-pickup': {
    L: 5.9, W: 2.03, wr: 0.42, xf: 2.0, xr: -1.8,
    top: [[-2.95, 1.16], [-2.87, 1.22], [-1.22, 1.22], [-1.12, 1.8], [-0.99, 1.89], [0.85, 1.89], [1.6, 1.3], [2.35, 1.22], [2.8, 1.12], [2.95, 1.0]],
    shoulder: [[-2.95, 1.12], [1.55, 1.16], [2.45, 1.1], [2.95, 0.95]],
    sill: [[-2.95, 0.78], [-2.7, 0.56], [2.55, 0.55], [2.95, 0.75]],
    nose: { len: 0.5, p: 3.2 }, tail: { len: 0.14, p: 5 },
    windshield: [0.9, 1.55], bed: [-2.87, -1.26],
    sideWindows: [[-0.2, 1.55], [-1.05, -0.3]], bPillar: [-0.3, -0.2], doors: [1.58, -0.25, -1.1],
    color: '#8a1c1c', wheelStyle: 'steel', ride: 'tall',
  },
  liftback: null,
};
CAR_VARIANTS.compact = { ...stretch(SEDAN, 4.45), W: 1.78, wr: 0.31, color: '#6d7a86' };
CAR_VARIANTS.luxury = { ...stretch(SEDAN, 5.2, { top: raise(stretch(SEDAN, 5.2).top, 0.03) }), W: 1.92, wr: 0.35, color: '#1d2a3a', chromeTrim: true, wheelStyle: 'mesh', grille: 'chrome' };
CAR_VARIANTS.ev = { ...stretch(CAR_VARIANTS.hatchback, 4.3), nose: { len: 0.72, p: 2.0 }, color: '#e9ecef', ev: true, tailBar: true };
CAR_VARIANTS['large-suv'] = { ...stretch(CAR_VARIANTS.suv, 5.3, { top: raise(stretch(CAR_VARIANTS.suv, 5.3).top, 0.08) }), W: 2.04, wr: 0.42, color: '#202326', grille: 'chrome' };
CAR_VARIANTS['hot-hatch'] = { ...CAR_VARIANTS.hatchback, W: 1.82, sill: [[-2.075, 0.46], [-1.8, 0.27], [1.8, 0.26], [2.075, 0.4]], wheelStyle: 'ten', caliper: '#d01818', roofSpoiler: true, color: '#f2f2ef', exhaust: 'twin' };
CAR_VARIANTS.classic = { ...stretch(SEDAN, 4.9), nose: { len: 0.4, p: 4 }, tail: { len: 0.3, p: 4.5 }, color: '#8fb7a8', classic: true };
CAR_VARIANTS.mpv = { ...stretch(CAR_VARIANTS.minivan, 4.5), wr: 0.33, color: '#c25e2a' };
CAR_VARIANTS.liftback = { ...stretch(CAR_VARIANTS.hatchback, 4.55), rake: { rear: 0.35 }, color: '#4a5c7a' };


/*
 * Trims: each one changes real parts (ride height, wheels, kits, racks, lamps, liveries).
 * Applied on top of any body: createObject('car', { variant: 'suv-offroad' }).
 */
export const CAR_TRIMS = {
  sport: { stripes: true, ride: -0.03, wheelScale: 1.08, wheelStyle: 'ten', caliper: '#c81818', kit: true, lip: true, exhaust: 'quad', grille: 'mesh', blackMirrors: true },
  luxury: { ride: -0.012, wheelScale: 1.06, wheelStyle: 'mesh', chromeTrim: true, twoTone: true, lowerTone: true, sunroof: true, exhaust: 'oval', grille: 'chrome', rimColor: '#e4e6e8' },
  offroad: { ride: 0.07, wheelScale: 1.1, archClear: 0.035, wheelStyle: 'steel', rimColor: '#2a2b2d', wheelDress: 'beadlock', tread: true, flares: true, skid: true, bullbar: true, basket: true, mudflaps: true },
  eco: { ride: -0.01, closedGrille: true, wheelDress: 'aero', chargePort: true, exhaust: 'none', ecoStripe: true, ecoLivery: true, roofSolar: true },
  classic: { classic: true, twoTone: true, roofColor: '#efe7d2', wheelStyle: 'steel', rimColor: '#d9dadc' },
  rally: { ride: 0.035, wheelStyle: 'five', rimColor: '#f4f4f4', mudflaps: true, rallyPods: true, livery: 'rally', roofVent: true, exhaust: 'single' },
  stance: { sideGraphic: true, ride: -0.045, wheelScale: 1.06, wheelStyle: 'ten', rimColor: '#b08d57', widebody: true, ducktail: true, underglow: true, exhaust: 'single' },
  touring: { roofBox: true, roofRails: true, mudflaps: true, towbar: true, wheelStyle: 'five', rimColor: '#3a3c40', cladding: true },
};

const CHROME = M.chrome();
const SEAM = new THREE.MeshBasicMaterial({ color: '#050505', name: 'seam' });

export function createCar(options = {}) {
  return buildVehicle(options, 'car', CAR_VARIANTS, CAR_TRIMS);
}

/** Shared builder for cars and vans (loft body + lamps + trims). */
export function buildVehicle(options, type, VARIANTS, TRIMS) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trimName = o.trim ?? null;
  if (trimName && !TRIMS[trimName]) throw new Error(`[three-premade] Unknown ${type} trim "${trimName}". Available: ${Object.keys(TRIMS).join(', ')}`);
  const T = trimName ? TRIMS[trimName] : {};
  const base = VARIANTS[variant];
  const v = { ...base, ...T, classic: base.classic || T.classic, wheelStyle: T.wheelStyle && !(base.police && trimName === 'classic') ? T.wheelStyle : base.wheelStyle };
  if (v.classic) Object.assign(v, { roundLamps: true, chromeBumpers: true, wheelDress: v.wheelDress ?? 'whitewall', hubcap: true, chromeTrim: true });
  const { L, W } = v;
  const h = L / 2;
  const ride = (v.ride ?? 0) + (base.ride === 'tall' && typeof v.ride !== 'number' ? 0 : 0);
  const wr = base.wr * (v.wheelScale ?? 1);
  const root = group(`${type}-${variant}${trimName ? `-${trimName}` : ''}`);
  const body = group('body', { parent: root, at: [0, typeof ride === 'number' ? ride : 0, 0] });
  const rideY = body.position.y;

  const ease = (t) => t * t * (3 - 2 * t);
  // ---------------- materials ----------------
  const paint = M.paint(o.color ?? v.color, { metallic: o.metallic ?? 0.6, roughness: 0.28 });
  paint.name = 'paint';
  const interior = new THREE.MeshStandardMaterial({ name: 'interior', color: '#1c1c1e', roughness: 0.9, side: THREE.BackSide });
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'glass', color: M.toColor(o.glassTint ?? '#0b1014'), metalness: 0, roughness: 0.03,
    transparent: true, opacity: 0.68, clearcoat: 1, envMapIntensity: 1.2, side: THREE.DoubleSide, depthWrite: false,
  });
  const trim = new THREE.MeshStandardMaterial({ name: 'trim', color: '#111214', roughness: 0.55, metalness: 0.1 });
  const gloss = new THREE.MeshPhysicalMaterial({ name: 'gloss-black', color: '#0a0a0b', roughness: 0.12, clearcoat: 1 });
  const housing = new THREE.MeshPhysicalMaterial({ name: 'lamp-housing', color: '#1a1c1f', metalness: 0.9, roughness: 0.18, clearcoat: 1 });
  const smoked = new THREE.MeshPhysicalMaterial({ name: 'tail-housing', color: '#2a0305', roughness: 0.1, clearcoat: 1, metalness: 0.3 });
  const satin = M.metal('#9da2a8', 0.32);
  const lower = v.classic || v.chromeBumpers ? paint : trim;

  // ---------------- loft body ----------------
  const wcy = wr - rideY; // wheel centre height in body space
  const ar = wr + 0.055 + (v.archClear ?? 0);
  const fTop = smoothKeys(v.top);
  const fShoulder = smoothKeys(v.shoulder);
  const fSill = smoothKeys(v.sill);
  const roofH = Math.max(...v.top.map((p) => p[1]));
  const beltH = Math.max(...v.shoulder.map((p) => p[1]));
  const section = (x) => {
    let y0 = fSill(x);
    for (const wx of [v.xf, v.xr]) {
      const dx = x - wx;
      if (Math.abs(dx) < ar) y0 = Math.max(y0, wcy + Math.sqrt(ar * ar - dx * dx));
    }
    const yt = fTop(x);
    const yb = Math.min(fShoulder(x), yt - 0.06);
    const g = THREE.MathUtils.clamp((yt - yb - 0.12) / Math.max(0.2, roofH - beltH - 0.12), 0, 1);
    return {
      y0, yb, yt, w: W + (v.widebody && [v.xf, v.xr].some((wx) => Math.abs(x - wx) < ar + 0.25) ? 0.06 * Math.min(1, ...[v.xf, v.xr].map((wx) => Math.max(0, ar + 0.25 - Math.abs(x - wx)) / 0.25)) : 0),
      wt: W * (0.95 - (v.lowCabin ? 0.2 : 0.15) * g),
      r1: 0.15, r2: 0.05 + 0.08 * g, crown: 0.015 + 0.035 * g, bulge: 0.035, sideBulge: 0.01,
    };
  };
  const breaks = [];
  const add = (...xs) => breaks.push(...xs.flat(Infinity).filter((x) => typeof x === 'number'));
  add(v.windshield, v.rearGlass?.x, v.sideWindows, v.bPillar, v.bed, v.open, v.sliding, v.hatch);
  if (v.sliding) add(v.sliding[0] - 0.008, v.sliding[1] + 0.008);
  const rd = v.rearDoors ?? 0; // depth of the rear door band (box vans)
  // opening panels: bonnet, boot lid (saloons/open cars) or tailgate (hatches)
  const bonnetX = v.windshield && !v.ev ? [v.windshield[1] + 0.03, h - 0.06] : null;
  const bootX = !v.bed && !rd ? (v.rearGlass?.top ? [-h, v.rearGlass.x[0]] : v.open ? [-h, v.open[0] - 0.05] : null) : null;
  const gateX = !v.bed && !rd && v.rearGlass?.face ? [-h, v.rearGlass.x[1]] : null;
  add(bonnetX, bootX, gateX);
  if (rd) add(-h + rd, -h + rd + 0.008, -h + rd / 2);
  if (v.bed) { for (let x = v.bed[1] + 0.03; x <= v.bed[1] + 0.15; x += 0.01) add(x); add(-h + 0.06, -h + 0.067); }
  for (const d of v.doors) add(d, d + 0.008);
  for (const wx of [v.xf, v.xr]) for (let k = -ar; k <= ar + 1e-6; k += ar / 8) add(wx + k);
  const loft = createLoft({ length: L, nose: v.nose, tail: v.tail, rake: v.rake, breaks, section, stations: 96 });
  const I = loft.idx;
  const RP = (seg, t) => ringPos(loft, seg, t);
  const P = (x, seg, t, s = 1) => loft.pointAt(x, seg, t, s);
  const onSurf = (obj, at, off = 0.004) => {
    obj.position.copy(at.point).addScaledVector(at.normal, off);
    obj.lookAt(obj.position.clone().add(at.normal));
    return obj;
  };

  // Glass (holes in the body so the interior shows through)
  const glassParts = [];
  if (v.windshield) glassParts.push(loft.patch({ x: v.windshield, from: I('roofCorner', 0.55), side: 'across', hole: true, offset: 0 }));
  for (const sw of v.sideWindows) {
    loft.patch({ x: sw, from: I('side', 0.12), to: I('side', 1), side: 'both', hole: true });
    for (const s of [1, -1]) glassParts.push(surfaceGrid(loft, { x: sw, h: [I('side', 0.12), I('side', 1)], side: s, offset: -0.004, nx: 8, ny: 4 }));
  }
  if (v.rearGlass?.top) glassParts.push(loft.patch({ x: v.rearGlass.x, from: I('roofCorner', 0.55), side: 'across', hole: true, offset: 0 }));
  if (v.rearGlass?.face) {
    loft.patch({ x: v.rearGlass.x, from: I('side', 0.15), to: I('roofCorner', 1), side: 'both', hole: true });
    for (const s of [1, -1]) glassParts.push(surfaceGrid(loft, { x: v.rearGlass.x, h: [I('side', 0.15), I('roofCorner', 1)], side: s, offset: -0.002, nx: 4, ny: 8 }));
  }
  for (const g of glassParts) mesh(g, glass, { parent: body, name: 'glass' });
  glassParts.length = 0;
  if (v.open) loft.patch({ x: v.open, from: I('roofCorner', 0.2), side: 'across', hole: true });
  if (v.bed) loft.patch({ x: v.bed, from: I('roofCorner', 0.75), side: 'across', hole: true });
  // van openings (holes now; the moving panels are built further down)
  const slideH = [I('corner', 0.7), I('side', 1)];
  const rearH = [I('corner', 0.6), I('roofCorner', 0.6)];
  const hatchH = [I('lower', 0.9), I('side', 0.9)];
  if (v.sliding) loft.patch({ x: v.sliding, from: slideH[0], to: slideH[1], side: 'pos', hole: true });
  if (rd) loft.patch({ x: [-h, -h + rd], from: rearH[0], to: rearH[1], side: 'both', hole: true });
  if (v.hatch) loft.patch({ x: v.hatch, from: hatchH[0], to: hatchH[1], side: 'pos', hole: true });
  // ---- opening panels: rectangles in (x, ring) space; skins + attachments are added in the post-pass ----
  const panels = [];
  const doorEdges0 = [...v.doors].sort((p1, p2) => p2 - p1);
  const doorH = [I('corner', 0.7), I('side', 0.12)];
  for (let k = 0; k < doorEdges0.length - 1; k++) {
    const x = [doorEdges0[k + 1] + 0.008, doorEdges0[k]];
    for (const s of [1, -1]) {
      if (s > 0 && v.sliding && x[0] < v.sliding[1] && x[1] > v.sliding[0]) continue;
      if (s > 0 && v.hatch && x[0] < v.hatch[1] && x[1] > v.hatch[0]) continue;
      loft.patch({ x, from: doorH[0], to: doorH[1], side: s > 0 ? 'pos' : 'neg', hole: true });
      panels.push({ kind: 'door', k, s, x, h: [doorH[0], I('side', 1)], skinH: [doorH[0], doorH[1]] });
    }
  }
  if (bonnetX) {
    loft.patch({ x: bonnetX, from: I('roofCorner', 0.3), side: 'across', hole: true });
    panels.push({ kind: 'bonnet', s: 0, x: bonnetX, h: [I('roofCorner', 0.3), loft.H], skinH: [I('roofCorner', 0.3), loft.H] });
  }
  if (bootX) {
    loft.patch({ x: bootX, from: I('roofCorner', 0.2), side: 'across', hole: true });
    panels.push({ kind: 'boot', s: 0, x: bootX, h: [I('roofCorner', 0.2), loft.H], skinH: [I('roofCorner', 0.2), loft.H] });
  }
  if (gateX) {
    loft.patch({ x: gateX, from: I('side', 0), to: I('side', 0.15), side: 'both', hole: true });
    loft.patch({ x: gateX, from: I('roofCorner', 1), side: 'across', hole: true });
    panels.push({ kind: 'gate', s: 0, x: gateX, h: [I('side', 0), loft.H], skinH: null });
  }

  // Trims: B-pillar, bumpers, skirts
  if (v.bPillar) mesh(loft.patch({ x: v.bPillar, from: I('side', 0.1), to: I('side', 1), offset: 0.002 }), gloss, { parent: body, name: 'b-pillar' });
  // stops just short of the nose tip: the last loft ring is degenerate there and threw the lip out sideways
  mesh(loft.patch({ x: [h - 0.5, h - 0.02], from: 0, to: I('corner', 0.55), offset: 0.003 }), lower, { parent: body, name: 'front-lip' });
  mesh(loft.patch({ x: [-h, -h + 0.4], from: 0, to: I('corner', 0.6), offset: 0.003 }), lower, { parent: body, name: 'rear-diffuser' });
  mesh(loft.patch({ x: [v.xr + ar + 0.02, v.xf - ar - 0.02], from: I('corner', 0.1), to: I('corner', 0.55), offset: 0.003 }), v.classic ? CHROME : trim, { parent: body, name: 'skirts' });
  for (const sw of v.sideWindows) {
    for (const s of [1, -1]) {
      mesh(surfaceGrid(loft, { x: sw, h: [I('side', 0.06), I('side', 0.1)], side: s, offset: 0.002, nx: 8, ny: 1 }), v.chromeTrim ? CHROME : satin, { parent: body, name: 'belt-trim' });
      if (v.chromeTrim) mesh(surfaceGrid(loft, { x: sw, h: [I('side', 1) - 0.25, I('side', 1)], side: s, offset: 0.002, nx: 8, ny: 1 }), CHROME, { parent: body, name: 'window-chrome' });
    }
  }
  for (const d of v.doors) mesh(loft.patch({ x: [d, d + 0.008], from: I('corner', 0.7), to: I('side', 0.12), offset: 0.0015 }), SEAM, { parent: body, name: 'shut-line' });

  // ---------------- lamps ----------------
  const head = lampGroup('headlights', 'head');
  head.lens.color.set('#b9c3ca'); // projector reflector reads as chrome, not a white dot
  head.lens.metalness = 0.7;
  const drl = lampGroup('drl', 'drl');
  const tail = lampGroup('taillights', 'tail');
  const brake = lampGroup('brakelights', 'brake');
  const rev = lampGroup('reverselights', 'reverse');
  const ind = { [-1]: lampGroup('indicator_L', 'signal'), 1: lampGroup('indicator_R', 'signal') };
  const tall = base.ride === 'tall';
  for (const s of [1, -1]) {
    if (v.roundLamps) {
      const c = P(h - 0.1, 'lower', 0.72, s);
      const ring = mesh(new THREE.TorusGeometry(0.085, 0.014, 10, 32), CHROME, { parent: body, name: 'lamp-ring' });
      onSurf(ring, c, 0.008);
      head.add(body, { at: c.point.clone().addScaledVector(c.normal, 0.004).toArray(), normal: c.normal.toArray(), w: 0.16, h: 0.16, shape: 'round', depth: 0.02, bezel: false });
      const ci = P(h - 0.08, 'lower', 0.38, s);
      ind[s].add(body, { at: ci.point.toArray(), normal: ci.normal.toArray(), w: 0.11, h: 0.045, shape: 'strip', depth: 0.012 });
      drl.add(body, { at: P(h - 0.26, 'lower', 0.72, s).point.toArray(), normal: P(h - 0.26, 'lower', 0.72, s).normal.toArray(), w: 0.07, h: 0.07, shape: 'round', depth: 0.012 });
    } else {
      const hx0 = h - (tall ? 0.34 : 0.4);
      const hx1 = h - 0.05;
      mesh(surfaceGrid(loft, { x: [hx0, hx1], h: [RP('lower', 0.56), RP('lower', 0.99)], side: s, offset: 0.004, nx: 12, ny: 5 }), housing, { parent: body, name: 'headlight-housing' });
      for (const fx of [0.3, 0.62]) {
        const c = P(hx1 - (hx1 - hx0) * fx, 'lower', 0.74, s);
        head.add(body, { at: c.point.clone().addScaledVector(c.normal, 0.006).toArray(), normal: c.normal.toArray(), w: 0.085, h: 0.085, shape: 'round', depth: 0.014 });
      }
      surfaceLamp(drl, body, loft, { x: [hx0 + 0.02, hx1 - 0.01], h: [RP('lower', 0.89), RP('lower', 0.96)], side: s, offset: 0.007 });
      surfaceLamp(ind[s], body, loft, { x: [hx0 + 0.005, hx0 + 0.075], h: [RP('lower', 0.6), RP('lower', 0.84)], side: s, offset: 0.007 });
    }
    // tail cluster
    if (rd) {
      // box van: tall vertical lamps in the rear pillars beside the doors
      const px = [-h + rd + 0.012, -h + rd + 0.085];
      mesh(surfaceGrid(loft, { x: [px[0] - 0.005, px[1] + 0.01], h: [RP('lower', 0.0), RP('side', 0.5)], side: s, offset: 0.004, nx: 4, ny: 10 }), smoked, { parent: body, name: 'tail-housing' });
      surfaceLamp(tail, body, loft, { x: px, h: [RP('side', 0.1), RP('side', 0.46)], side: s, offset: 0.007 });
      surfaceLamp(brake, body, loft, { x: px, h: [RP('lower', 0.62), RP('side', 0.07)], side: s, offset: 0.007 });
      surfaceLamp(ind[s], body, loft, { x: px, h: [RP('lower', 0.3), RP('lower', 0.58)], side: s, offset: 0.007 });
    } else {
      const tx0 = -h + 0.03;
      const tx1 = -h + (v.classic ? 0.22 : 0.3);
      const tr = v.bed ? ['side', 0.0, 'side', 0.5] : ['lower', 0.6, 'lower', 0.98];
      const ha = RP(tr[0], tr[1]);
      const hb = RP(tr[2], tr[3]);
      const hm = (ha + hb) / 2;
      mesh(surfaceGrid(loft, { x: [-h + 0.012, tx1 + 0.01], h: [ha - 0.05, hb + 0.05], side: s, offset: 0.004, nx: 12, ny: 5 }), smoked, { parent: body, name: 'tail-housing' });
      surfaceLamp(tail, body, loft, { x: [tx0 + 0.09, tx1], h: [hm + 0.02, hb], side: s, offset: 0.007 });
      surfaceLamp(brake, body, loft, { x: [tx0 - 0.01, tx0 + 0.085], h: [ha, hb], side: s, offset: 0.007 });
      surfaceLamp(ind[s], body, loft, { x: [tx0 + 0.09, tx1], h: [ha, hm - 0.02], side: s, offset: 0.007 });
    }
    // reverse lamp low on the bumper
    const rp = rd ? P(-h + rd + 0.05, 'corner', 0.45, s) : P(-h + 0.08, 'corner', 0.92, s);
    rev.add(body, { at: rp.point.clone().addScaledVector(rp.normal, 0.004).toArray(), normal: rp.normal.toArray(), w: 0.09, h: 0.035, shape: 'strip', depth: 0.01 });
    // side repeater on the front fender
    // between the front arch and the front door shut line
    const srx = v.doors[0] < v.xf - ar ? Math.max(v.doors[0] + 0.06, (v.doors[0] + v.xf - ar) / 2) : v.xf - ar + 0.02;
    const sr = P(srx, 'lower', 0.72, s);
    ind[s].add(body, { at: sr.point.clone().addScaledVector(sr.normal, 0.004).toArray(), normal: sr.normal.toArray(), w: 0.07, h: 0.025, shape: 'strip', depth: 0.008 });
  }
  if (v.tailBar && !v.bed) surfaceLamp(tail, body, loft, { x: [-h + 0.0005, -h + 0.035], h: [RP('lower', 0.84), RP('lower', 0.94)], side: 1, offset: 0.007, glow: 0.2 });
  if (v.tailBar && !v.bed) surfaceLamp(tail, body, loft, { x: [-h + 0.0005, -h + 0.035], h: [RP('lower', 0.84), RP('lower', 0.94)], side: -1, offset: 0.007, glow: 0.2 });
  // centre high-mount brake lamp
  {
    let c;
    if (v.rearGlass?.top) c = surfAt(loft, v.rearGlass.x[1] + 0.035, loft.H, 1);
    else if (rd) c = surfAt(loft, -h + 0.02, loft.H, 1);
    else if (v.rearGlass?.face) c = surfAt(loft, -h + 0.035, loft.H, 1);
    else c = P(-h + 0.12, 'roof', 1);
    const cb = mesh(roundedBox(0.05, 0.03, 0.3, 0.012), gloss, { parent: body, name: 'chmsl-base' });
    if (gateX && v.rearGlass?.face) cb.userData.ride = { panel: 'rear', chmsl: true };
    cb.position.copy(c.point).addScaledVector(c.normal, 0.008);
    brake.add(body, { at: c.point.clone().addScaledVector(c.normal, 0.012).add(new THREE.Vector3(-0.02, 0, 0)).toArray(), normal: [-1, 0.25, 0], w: 0.26, h: 0.018, shape: 'strip', depth: 0.008, bezel: false });
  }

  // Grille
  {
    const gp = P(h, 'lower', 0.3);
    const gw = W * (tall ? 0.5 : 0.4);
    const gh = Math.max(0.1, (P(h, 'lower', 0.55).point.y - P(h, 'lower', 0.03).point.y) * 0.95);
    const grille = group('grille_mesh', { parent: body, at: [gp.point.x - 0.025, gp.point.y, 0] });
    if (v.closedGrille || v.ev) {
      mesh(roundedBox(0.05, gh * 0.5, gw * 0.9, 0.02), gloss, { parent: grille, at: [0, -gh * 0.2, 0] });
    } else {
      mesh(roundedBox(0.05, gh, gw, Math.min(0.03, gh / 3)), gloss, { parent: grille });
      const chromeSlats = v.grille === 'chrome' || (!v.police && v.wheelStyle !== 'steel' && v.grille !== 'mesh');
      if (v.grille === 'mesh') {
        for (let k = 1; k < 7; k++) mesh(new THREE.BoxGeometry(0.02, 0.006, gw * 0.94), trim, { parent: grille, at: [0.022, -gh / 2 + (k * gh) / 7, 0] });
      } else {
        for (let k = 1; k < 5; k++) mesh(new THREE.BoxGeometry(0.02, 0.008, gw * 0.94), chromeSlats ? CHROME : trim, { parent: grille, at: [0.022, -gh / 2 + (k * gh) / 5, 0] });
      }
      if (v.grille === 'chrome' || v.classic) {
        mesh(new THREE.TorusGeometry(1, 0.012, 6, 4), CHROME, { parent: grille, at: [0.03, 0, 0], rot: [0, Math.PI / 2, Math.PI / 4], scale: [gw / 2.8, gh / 2.8, 1] }).scale.set(gw * 0.71, gh * 0.71, 1);
      }
    }
    // lower intake
    // (no separate lower-intake strip: at the nose the loft narrows so fast that a thin band rendered as a
    //  flat black blade sticking out of the bumper; the grille + front lip already read as the intake)
  }

  // Body shell + dark interior seen through the glass
  const bodyGeo = loft.bodyGeometry();
  mesh(bodyGeo, paint, { parent: body, name: 'shell' });
  mesh(bodyGeo, interior, { parent: body, name: 'cabin' });

  // Badges: orbix emblem front + rear, model script on the boot
  const fe = brandEmblem(0.1, { name: 'emblem_front' });
  {
    // sit on the nose ABOVE the front plate (never overlapping it), on the actual surface
    const plateTop = P(h, 'corner', 0.95).point.y + 0.075 + 0.056;
    let fp = P(h, 'lower', 0.3);
    for (let t = 0.3; t <= 1.001 && fp.point.y < plateTop + 0.06; t += 0.05) fp = P(h, 'lower', Math.min(t, 1));
    fe.position.set(fp.point.x + 0.012, Math.max(fp.point.y, plateTop + 0.06), 0);
  }
  fe.rotation.y = Math.PI / 2;
  body.add(fe);
  const rpt = P(-h, 'lower', v.bed ? 0.3 : 0.8);
  const re = brandEmblem(0.09, { name: 'emblem_rear' });
  re.position.set(rpt.point.x - 0.012, rpt.point.y, 0);
  re.rotation.y = -Math.PI / 2;
  body.add(re);
  {
    const label = (o.badge ?? `${variant}${trimName ? ` ${trimName}` : ''}`).toUpperCase();
    const bm = textMaterial('badge', label, { color: '#e8eaec', font: 'italic 600 96px Georgia, serif', w: 1024, h: 160 });
    bm.metalness = 1;
    bm.roughness = 0.2;
    const bp = surfaceGrid(loft, { x: [-h + 0.02, -h + 0.12], h: [RP('lower', 0.48), RP('lower', 0.56)], side: 1, offset: 0.006, nx: 6, ny: 2 });
    mesh(bp, bm, { parent: body, name: 'badge' });
  }

  // Antenna, fuel door
  if (!v.open && !v.bed) {
    const ap = v.rearGlass?.top ? P(v.rearGlass.x[1] + 0.22, 'roof', 1) : P(-h + 0.55, 'roof', 1);
    mesh(cushion(0.18, 0.07, 0.06, { radius: 0.025, bulge: 0.3 }), gloss, { parent: body, name: 'antenna', at: [ap.point.x, ap.point.y + 0.022, 0], rot: [0, 0, 0.25] });
  }
  {
    const fd = P(v.xr - 0.06, 'lower', 0.86, 1);
    const door = mesh(roundedBox(0.15, 0.11, 0.008, 0.028), v.police ? paint : paint, { parent: body, name: 'fuel_door' });
    onSurf(door, fd, 0.003);
    const ring = mesh(new THREE.TorusGeometry(0.06, 0.003, 4, 24), SEAM, { parent: body, name: 'fuel_seam' });
    onSurf(ring, fd, 0.0035);
    ring.scale.set(1.3, 0.95, 1);
    if (v.chargePort) {
      const cp = P(Math.min(v.xf + ar + 0.25, h - v.nose.len * 0.7), 'lower', 0.86, -1);
      const cpd = mesh(roundedBox(0.13, 0.1, 0.008, 0.025), paint, { parent: body, name: 'charge_door' });
      onSurf(cpd, cp, 0.003);
      const lamp = lampGroup('charge_lamp', 'green');
      lamp.add(body, { at: cp.point.clone().addScaledVector(cp.normal, 0.009).toArray(), normal: cp.normal.toArray(), w: 0.03, h: 0.03, shape: 'round', depth: 0.004, bezel: false });
    }
  }

  // License plates (front on the bumper, rear on the boot/bumper)
  const ptxt = o.plate ?? plateText(`${variant}${trimName}${o.color ?? ''}`);
  const pf = plate(ptxt);
  pf.position.set(h + 0.006, P(h, 'corner', 0.95).point.y + 0.075, 0);
  body.add(pf);
  const pr = plate(ptxt);
  const prY = v.bed ? P(-h, 'lower', 0.45).point.y : rd ? P(-h, 'corner', 0.3).point.y + 0.03 : P(-h, 'lower', 0.3).point.y;
  pr.position.set(-h - 0.006, prY, 0);
  pr.rotation.y = Math.PI;
  body.add(pr);

  // Mirrors + door handles
  const mirrorX = (v.windshield?.[1] ?? v.windshieldFrame ?? 0.6) - 0.08;
  const doorEdges = [...v.doors].sort((p1, p2) => p2 - p1);
  const handleXs = doorEdges.slice(0, -1).map((front, k) => Math.min(front - 0.25, doorEdges[k + 1] + 0.22));
  for (const s of [1, -1]) {
    const p = P(mirrorX, 'side', 0.1, s);
    const m = group('mirror', { parent: body, at: [p.point.x, p.point.y + 0.06, p.point.z + s * 0.12] });
    mesh(cushion(0.2, 0.12, 0.14, { radius: 0.05, bulge: 0.1 }), v.blackMirrors ? gloss : v.classic ? CHROME : paint, { parent: m, name: 'mirror_cap' });
    mesh(new THREE.BoxGeometry(0.004, 0.09, 0.11), M.metal('#cfd8dc', 0.05), { parent: m, at: [-0.101, 0, 0], name: 'mirror_glass' });
    mesh(roundedBox(0.06, 0.05, 0.14, 0.015), trim, { parent: m, at: [0.02, -0.05, -s * 0.08], name: 'mirror_arm' });
    for (const hxp of handleXs) {
      const q = P(hxp, 'lower', 0.86, s);
      const hd = mesh(roundedBox(0.16, 0.026, 0.022, 0.01), CHROME, { parent: body, name: 'handle' });
      hd.position.copy(q.point).addScaledVector(q.normal, 0.008);
      hd.userData.ride = { x: hxp, s };
    }
  }
  const wiperPivots = [];
  if (v.windshield) {
    // pivots at the base of the screen; arms lie along the bottom edge and sweep up
    const wsN = surfAt(loft, v.windshield[1] - 0.06, loft.H, 1).normal;
    for (const z of [-W * 0.36, -W * 0.02]) {
      const bp = surfAt(loft, v.windshield[1] - 0.03, loft.H, 1).point;
      const piv = group(`wiper_pivot_${wiperPivots.length}`, { parent: body, at: [bp.x + 0.005, bp.y + 0.01, z] });
      piv.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), wsN);
      const arm = group(`wiper_${wiperPivots.length}`, { parent: piv });
      const len = W * 0.33;
      mesh(roundedBox(0.012, 0.012, len, 0.004), trim, { parent: arm, name: 'wiper_arm', at: [0, 0.008, len / 2] });
      mesh(roundedBox(0.02, 0.016, len * 0.9, 0.006), gloss, { parent: arm, name: 'wiper_blade', at: [0.012, 0.004, len / 2 + 0.02] });
      mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.025, 12), trim, { parent: piv, name: 'wiper_spindle', at: [0, 0, 0] });
      wiperPivots.push(arm);
    }
  }

  // ---------------- interior ----------------
  const seatMat = M.fabric(o.interiorColor ?? (v.chromeTrim ? '#5a3e2b' : '#1f1e1d'));
  seatMat.name = 'interior';
  const cabinX = v.windshield ? (v.windshield[0] + v.windshield[1]) / 2 : (v.windshieldFrame ?? 0.2) - 0.1;
  const seatY = beltH - 0.48 + (tall ? 0.1 : 0);
  const rows = v.seatRows ?? Math.max(1, Math.min(3, v.sideWindows.length >= 2 || v.open ? v.sideWindows.length || 2 : 1));
  mesh(roundedBox(0.4, 0.22, W * 0.82, 0.08), M.plastic('#1d1d1f', 0.7), { parent: body, at: [cabinX - 0.05, beltH - 0.02, 0], name: 'dashboard' });
  const steerPivot = group('steering_tilt', { parent: body, at: [cabinX - 0.32, beltH + 0.06, -W * 0.21], rot: [0, 0, 0.45] });
  const steeringWheel = group('steering_wheel', { parent: steerPivot });
  { const tg = new THREE.TorusGeometry(0.17, 0.02, 10, 32); tg.rotateY(Math.PI / 2); mesh(tg, M.plastic('#111'), { parent: steeringWheel, name: 'steering_rim' }); }
  mesh(roundedBox(0.03, 0.03, 0.32, 0.01), M.plastic('#161616'), { parent: steeringWheel, name: 'steering_spoke' });
  mesh(roundedBox(0.03, 0.17, 0.03, 0.01), M.plastic('#161616'), { parent: steeringWheel, name: 'steering_spoke', at: [0, -0.08, 0] });
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16).rotateZ(Math.PI / 2), M.plastic('#1a1a1a'), { parent: steeringWheel, name: 'steering_hub' });
  mesh(roundedBox(0.06, 0.05, 0.05, 0.015), M.plastic('#111'), { parent: body, at: [cabinX - 0.24, beltH + 0.02, -W * 0.21], name: 'steering_column' });
  const floorY = seatY - 0.12;
  mesh(roundedBox(Math.max(0.6, rows * 0.85 + 0.5), 0.03, W * 0.8, 0.01), M.matte('#151515', 0.95), { parent: body, at: [cabinX - 0.6 - (rows - 1) * 0.42, floorY, 0], name: 'floor' });
  for (let r = 0; r < rows; r++) {
    const sx = cabinX - 0.8 - r * 0.85;
    const zs = r === 0 ? [W * 0.21, -W * 0.21] : [0];
    for (const z of zs) {
      const sw = r === 0 ? 0.5 : W * 0.72;
      mesh(cushion(0.5, 0.13, sw, { radius: 0.05 }), seatMat, { parent: body, at: [sx, seatY, z], name: 'seat' });
      mesh(cushion(0.13, 0.6, sw, { radius: 0.05 }), seatMat, { parent: body, at: [sx - 0.25, seatY + 0.32, z], rot: [0, 0, 0.2], name: 'seat_back' });
      if (r === 0) mesh(cushion(0.1, 0.16, 0.24, { radius: 0.04 }), seatMat, { parent: body, at: [sx - 0.33, seatY + 0.71, z], rot: [0, 0, 0.15], name: 'headrest' });
      mesh(roundedBox(0.3, Math.max(0.02, seatY - 0.065 - floorY), 0.3, 0.01), trim, { parent: body, at: [sx, (seatY - 0.065 + floorY) / 2, z], name: 'seat_base' });
    }
  }

  // ---------------- body extras ----------------
  if (v.windshieldFrame != null) {
    const x0 = v.windshieldFrame;
    const frame = group('windshield', { parent: body, at: [x0, beltH - 0.03, 0], rot: [0, 0, 0.62] });
    mesh(roundedBox(0.012, 0.38, W * 0.8, 0.004), glass, { parent: frame, at: [0, 0.2, 0], name: 'glass' });
    for (const z of [W * 0.4, -W * 0.4]) mesh(roundedBox(0.04, 0.44, 0.04, 0.012), gloss, { parent: frame, at: [0, 0.2, z], name: 'a-pillar' });
    mesh(roundedBox(0.04, 0.04, W * 0.84, 0.012), gloss, { parent: frame, at: [0, 0.41, 0], name: 'header' });
  }
  let roofClip = null;
  if (v.open && v.windshieldFrame != null) {
    // folding soft top: stowed (rest) → raised over the cabin → stowed again
    const x0 = v.windshieldFrame;
    const F = [x0 - 0.41 * Math.sin(0.62) - 0.02, beltH - 0.03 + 0.41 * Math.cos(0.62) + 0.01];
    const Rr = [v.open[0] + 0.02, fTop(v.open[0]) - 0.01];
    const pivot = group('soft_top', { parent: body, at: [Rr[0], Rr[1], 0] });
    const nu = 18;
    const nv = 12;
    const pos = [];
    const idx = [];
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const bx = (1 - u) ** 2 * 0 + 2 * (1 - u) * u * 0.18 + u * u * (F[0] - Rr[0]);
      const by = (1 - u) ** 2 * 0 + 2 * (1 - u) * u * (F[1] - Rr[1] + 0.06) + u * u * (F[1] - Rr[1]);
      for (let j = 0; j <= nv; j++) {
        const vv = j / nv * 2 - 1;
        const hw = W * 0.42;
        pos.push(bx, by - Math.abs(vv) ** 4 * Math.min(0.14, by), vv * hw);
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a0 = i * (nv + 1) + j;
      idx.push(a0, a0 + 1, a0 + nv + 1, a0 + 1, a0 + nv + 2, a0 + nv + 1);
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    tg.setIndex(idx);
    tg.computeVertexNormals();
    const fabricTop = M.fabric(o.roofColor ?? '#1c1c1e');
    fabricTop.side = THREE.DoubleSide;
    fabricTop.name = 'soft-top';
    mesh(tg, fabricTop, { parent: pivot, name: 'soft_top_skin' });
    const FOLD = Math.PI * 0.97;
    pivot.rotation.z = FOLD;
    pivot.scale.x = 0.22;
    const D = 6;
    const k = (t) => (t < 0.05 ? 0 : t < 0.35 ? ease((t - 0.05) / 0.3) : t < 0.65 ? 1 : t < 0.95 ? 1 - ease((t - 0.65) / 0.3) : 0);
    const times = [];
    const rots = [];
    const scl = [];
    const q = new THREE.Quaternion();
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      times.push(t * D);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (1 - k(t)) * FOLD);
      rots.push(q.x, q.y, q.z, q.w);
      scl.push(1 - (1 - k(t)) * 0.78, 1, 1);
    }
    roofClip = clip('roof', D, [new THREE.QuaternionKeyframeTrack('soft_top.quaternion', times, rots), new THREE.VectorKeyframeTrack('soft_top.scale', times, scl)]);
  }
  if (v.rollHoops) {
    for (const z of [W * 0.21, -W * 0.21]) {
      const x = (v.open?.[0] ?? -0.9) + 0.12;
      const y0 = fTop(x) - 0.02;
      curveTube([[x, y0, z - 0.2], [x - 0.02, y0 + 0.22, z - 0.14], [x - 0.03, y0 + 0.28, z], [x - 0.02, y0 + 0.22, z + 0.14], [x, y0, z + 0.2]], 0.022, CHROME, { parent: body, name: 'roll_hoop' });
    }
  }
  if (v.hoodScoop) {
    const hp = P(h - 0.95, 'roof', 1);
    mesh(cushion(0.55, 0.09, 0.42, { radius: 0.04, bulge: 0.2 }), paint, { parent: body, name: 'hood_scoop', at: [hp.point.x, hp.point.y + 0.03, 0] }).userData.ride = { panel: 'bonnet' };
    mesh(roundedBox(0.02, 0.05, 0.34, 0.01), gloss, { parent: body, name: 'scoop_mouth', at: [hp.point.x + 0.27, hp.point.y + 0.05, 0] }).userData.ride = { panel: 'bonnet' };
  }
  if (v.sideIntakes) {
    for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [v.xr + ar + 0.04, v.xr + ar + 0.5], h: [RP('lower', 0.25), RP('lower', 0.85)], side: s, offset: 0.004, nx: 8, ny: 4 }), gloss, { parent: body, name: 'side_intake' });
  }
  // spoilers
  const deckFeet = (x) => [1, -1].map((s) => {
    let best = null;
    for (let hh = RP('roofCorner', 0); hh <= loft.H; hh += 0.25) {
      const pp = surfAt(loft, x, hh, s);
      if (!best || Math.abs(Math.abs(pp.point.z) - W * 0.25) < Math.abs(Math.abs(best.point.z) - W * 0.25)) best = pp;
    }
    return best;
  });
  if ((v.spoiler || v.wing) && !v.bed && !v.ducktail) {
    const wx = -h + 0.24;
    const feet = deckFeet(wx);
    const deckY = Math.max(feet[0].point.y, feet[1].point.y);
    rearWing(body, { x: wx - 0.02, y: deckY + (v.wing ? 0.2 : 0.16), span: W * 0.84, feet, mat: gloss }).userData.ride = { panel: 'rear' };
  } else if (v.ducktail && !v.bed) {
    const dx = v.rearGlass?.face ? -h + 0.05 : -h + 0.08;
    Object.assign(crossRail(loft, dx, RP('roofCorner', v.rearGlass?.face ? 0.6 : 0.2), loft.H, 0.02, 0.04, paint, body, { scaleY: 0.55 }), { name: 'ducktail' }).userData.ride = { panel: 'rear' };
  } else if ((v.lip || v.roofSpoiler) && !v.bed && !v.open) {
    if (v.rearGlass?.face) Object.assign(crossRail(loft, -h + 0.045, RP('roofCorner', 0.5), loft.H, 0.018, 0.035, gloss, body, { scaleY: 0.5 }), { name: 'roof_spoiler' }).userData.ride = { panel: 'rear' };
    else Object.assign(crossRail(loft, -h + 0.07, RP('roofCorner', 0.25), loft.H, 0.01, 0.02, gloss, body, { scaleY: 0.6 }), { name: 'lip_spoiler' }).userData.ride = { panel: 'rear' };
  }
  if (v.roofRails && !v.open && !v.bed && v.windshield) {
    for (const s of [1, -1]) {
      const pts = [];
      for (let x = -h + 0.45; x <= v.windshield[0] - 0.05; x += 0.25) {
        const p = P(x, 'roof', 0.15, s);
        pts.push([p.point.x, p.point.y + 0.035, p.point.z]);
      }
      if (pts.length > 1) {
        curveTube(pts, 0.017, CHROME, { parent: body, name: 'roof_rail' });
        for (const q of [pts[0], pts[pts.length - 1]]) mesh(roundedBox(0.08, 0.04, 0.04, 0.012), trim, { parent: body, name: 'rail_foot', at: [q[0], q[1] - 0.02, q[2]] });
      }
    }
  }
  if (v.twoTone && !v.open && !v.bed && v.windshield) {
    const xa = v.rearGlass?.top ? v.rearGlass.x[1] + 0.01 : gateX ? gateX[1] + 0.01 : -h + 0.03;
    for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [xa, v.windshield[0] - 0.01], h: [RP('roofCorner', 0.45), loft.H], side: s, offset: 0.0018, nx: 16, ny: 6 }), M.paint(v.roofColor ?? '#141518', { metallic: 0.5 }), { parent: body, name: 'roof_paint' });
  }
  if (v.sunroof && !v.open && !v.bed && v.windshield) {
    for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [v.windshield[0] - 0.85, v.windshield[0] - 0.15], h: [RP('roof', 0.3), loft.H], side: s, offset: 0.0026, nx: 6, ny: 3 }), gloss, { parent: body, name: 'sunroof' });
  }
  if (v.ecoStripe) {
    for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [v.xr + ar + 0.04, v.xf - ar - 0.04], h: [RP('corner', 0.62), RP('corner', 0.72)], side: s, offset: 0.0045, nx: 10, ny: 1 }), M.emissive('#1aa0ff', 0.25), { parent: body, name: 'eco_stripe' });
  }
  if (v.kit) {
    // front splitter following the nose plan, side skirt blades, rear diffuser fins
    const pts = [];
    const ys = [];
    for (let k = 0; k <= 12; k++) {
      const x = h - 0.62 + (0.62 * k) / 12;
      const p = P(x, 'corner', 0.25, 1);
      pts.push([x + 0.03 * (k / 12), p.point.z + 0.025]);
      ys.push(p.point.y);
    }
    const outline = [...pts, ...pts.slice().reverse().map(([x, z]) => [x, -z])];
    const sp = extrudeOutline(outline, 0.022, { bevel: 0.008 });
    sp.rotateX(Math.PI / 2);
    mesh(sp, gloss, { parent: body, name: 'splitter', at: [0, Math.min(...ys) - 0.004, 0] });
    for (const s of [1, -1]) {
      const sk = [];
      for (let x = v.xr + ar + 0.06; x <= v.xf - ar - 0.06; x += 0.2) {
        const p = P(x, 'corner', 0.4, s);
        sk.push([p.point.x, p.point.y - 0.005, p.point.z + s * 0.012]);
      }
      curveTube(sk, 0.022, gloss, { parent: body, name: 'skirt_blade' });
    }
    const dy = P(-h + 0.2, 'bottom', 0.5).point.y;
    for (const z of [-0.33, -0.11, 0.11, 0.33]) mesh(roundedBox(0.3, 0.045, 0.016, 0.006), gloss, { parent: body, name: 'diffuser_fin', at: [-h + 0.2, dy - 0.012, z] });
  }
  const exhaust = v.exhaust ?? (v.ev ? 'none' : 'single');
  if (exhaust !== 'none' && !v.bed) {
    const zs = { single: [-0.42], twin: [-0.12, 0.12], quad: [-0.5, -0.38, 0.38, 0.5], oval: [-0.45, 0.45] }[exhaust] ?? [-0.42];
    const ey = P(-h + 0.12, 'corner', 0.3).point.y + 0.02;
    for (const z of zs) {
      const r = exhaust === 'oval' ? 0.045 : 0.036;
      const tg = new THREE.CylinderGeometry(r, r, 0.22, 20, 1, true);
      tg.rotateZ(Math.PI / 2);
      const tip = mesh(tg, CHROME, { parent: body, name: 'exhaust', at: [-h + 0.06, ey, z] });
      if (exhaust === 'oval') tip.scale.set(1, 0.7, 1.3);
      const cap = new THREE.CircleGeometry(r * 0.92, 20);
      cap.rotateY(-Math.PI / 2);
      mesh(cap, SEAM, { parent: tip, at: [-0.08, 0, 0], name: 'exhaust_inner' });
    }
  }
  const flares = v.flares || v.widebody;
  if (flares) {
    for (const wx of [v.xf, v.xr]) {
      for (const s of [1, -1]) {
        const pts = [];
        for (let k = 0; k <= 14; k++) {
          const x = wx - ar - 0.03 + ((2 * ar + 0.06) * k) / 14;
          const p = P(x, 'corner', 0.55, s);
          pts.push([p.point.x, p.point.y, p.point.z + s * 0.018]);
        }
        curveTube(pts, v.widebody ? 0.03 : 0.04, v.widebody ? paint : trim, { parent: body, name: 'flare' });
      }
    }
  }
  if (v.mudflaps) {
    for (const wx of [v.xf, v.xr]) {
      for (const s of [1, -1]) {
        const x = wx - ar * 0.9;
        const top = section(x).y0;
        const hgt = Math.max(0.12, top - (0.1 - rideY));
        mesh(roundedBox(0.012, hgt, 0.24, 0.005), M.rubber(), { parent: body, name: 'mudflap', at: [x, top - hgt / 2 + 0.01, s * (W / 2 - 0.14)] });
      }
    }
  }
  if (v.skid) {
    const sy = P(h - 0.3, 'bottom', 0.5).point.y;
    mesh(roundedBox(0.55, 0.02, W * 0.5, 0.008), M.metal('#b8bcc0', 0.35), { parent: body, name: 'skid_plate', at: [h - 0.32, sy - 0.006, 0], rot: [0, 0, 0.12] });
  }
  if (v.bullbar || v.police) {
    const yb = P(h, 'corner', 0.9).point.y;
    const yt = P(h, 'lower', v.police ? 0.5 : 0.7).point.y;
    const nx = P(h - 0.02, 'lower', 0.2).point.x;
    const loop = [[nx - 0.06, yb, -0.45], [nx + 0.06, yb + 0.01, -0.42], [nx + 0.1, yt, -0.32], [nx + 0.11, yt + 0.02, 0], [nx + 0.1, yt, 0.32], [nx + 0.06, yb + 0.01, 0.42], [nx - 0.06, yb, 0.45]];
    curveTube(loop, 0.024, v.police ? trim : M.metal('#2a2b2e', 0.35), { parent: body, name: 'bullbar' });
    for (const z of [-0.22, 0.22]) curveTube([[nx - 0.08, yb - 0.02, z], [nx + 0.1, yb, z], [nx + 0.11, yt + 0.01, z * 1.2]], 0.02, v.police ? trim : M.metal('#2a2b2e', 0.35), { parent: body, name: 'bullbar_upright' });
  }
  const auxNames = [];
  const roofFree = !v.police && !v.taxi; // light bars / taxi signs own the roof
  if (v.basket && roofFree && !v.open && !v.bed && v.windshield) {
    const xs = [v.windshield[0] - 0.25, Math.max(v.windshield[0] - 1.3, (v.rearGlass?.top ? v.rearGlass.x[1] : -h) + 0.3)];
    const top = roofBars(loft, body, xs, { basket: true, mat: M.metal('#1e1f21', 0.4) });
    // lamps clamp onto the basket's front frame
    auxLamps(body, 'auxlights', [xs[0] + 0.15 + 0.035, top + 0.07, 0], 4, 0.26, { radius: 0.04 });
    auxNames.push('auxlights');
  } else if (v.roofBox && roofFree && !v.open && !v.bed && v.windshield) {
    const xs = [v.windshield[0] - 0.3, Math.max(v.windshield[0] - 1.2, (v.rearGlass?.top ? v.rearGlass.x[1] : -h) + 0.3)];
    roofBars(loft, body, xs, { box: true, mat: M.metal('#1e1f21', 0.4) });
  }
  if (v.rallyPods) {
    const yp = P(h, 'lower', 0.2).point.y;
    const xp = P(h - 0.02, 'lower', 0.2).point.x;
    const bracket = mesh(roundedBox(0.04, 0.03, 0.9, 0.012), trim, { parent: body, name: 'pod_bracket', at: [xp + 0.02, yp, 0] });
    auxLamps(body, 'auxlights', [xp + 0.08, yp, 0], 4, 0.22, { radius: 0.05 });
    if (!auxNames.includes('auxlights')) auxNames.push('auxlights');
    bracket.userData.mount = true;
  }
  if (v.roofVent && v.windshield && !v.open && !v.bed) {
    const rp = P(v.windshield[0] - 0.3, 'roof', 1);
    mesh(cushion(0.3, 0.07, 0.22, { radius: 0.03 }), gloss, { parent: body, name: 'roof_vent', at: [rp.point.x, rp.point.y + 0.02, 0] });
  }
  if (v.towbar) {
    const ty = P(-h + 0.1, 'bottom', 0.3).point.y + 0.03;
    mesh(roundedBox(0.3, 0.05, 0.08, 0.015), trim, { parent: body, name: 'towbar', at: [-h - 0.03, ty, 0] });
    mesh(new THREE.SphereGeometry(0.03, 16, 12), CHROME, { parent: body, name: 'tow_ball', at: [-h - 0.17, ty + 0.05, 0] });
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 10), CHROME, { parent: body, name: 'tow_neck', at: [-h - 0.17, ty + 0.02, 0] });
  }
  if (v.chromeBumpers) {
    for (const [x0, dir] of [[h, 1], [-h, -1]]) {
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const s = k <= 8 ? -1 : 1;
        const t = k <= 8 ? 1 - k / 8 : (k - 8) / 8;
        const x = x0 - dir * (0.02 + 0.4 * t * t);
        const p = P(x, 'corner', 0.85, s);
        pts.push([p.point.x + dir * 0.03, p.point.y, p.point.z * (1 + 0.04) + s * 0.01]);
      }
      curveTube(pts, 0.045, CHROME, { parent: body, name: 'chrome_bumper' });
    }
  }
  if (v.spareWheel) {
    const sw = buildWheel('spare', { radius: wr, width: wr * 0.7, side: -1, style: 'steel', rimColor: '#2a2b2d', caliper: false });
    sw.steer.rotation.y = Math.PI / 2;
    sw.steer.position.set(-h - wr * 0.38, 1.0, 0);
    body.add(sw.steer);
    mesh(roundedBox(0.12, 0.16, 0.16, 0.03), trim, { parent: body, name: 'spare_mount', at: [-h - 0.04, 1.0, 0] });
  }
  if (v.underglow) {
    const ug = lampGroup('underglow', 'blue');
    for (const s of [1, -1]) {
      const p = P((v.xf + v.xr) / 2, 'bottom', 0.8, s);
      ug.add(body, { at: [p.point.x, p.point.y - 0.006, p.point.z * 0.92], normal: [0, -1, 0], w: v.xf - v.xr - 2 * ar - 0.1, h: 0.02, shape: 'strip', depth: 0.005, bezel: false, glowSize: 1.2 });
    }
    auxNames.push('underglow');
  }
  if (v.bed) {
    const liner = M.plastic('#1b1b1c', 0.9);
    liner.side = THREE.DoubleSide;
    const bl = v.bed[1] - v.bed[0] - 0.04;
    const bx = (v.bed[0] + v.bed[1]) / 2;
    const fy = beltH - 0.32;
    const wallH = fTop(bx) - fy - 0.02;
    mesh(roundedBox(bl, 0.03, W * 0.84, 0.01), liner, { parent: body, at: [bx, fy, 0], name: 'bed-floor' });
    mesh(roundedBox(0.03, wallH, W * 0.84, 0.01), liner, { parent: body, at: [v.bed[1] - 0.03, fy + wallH / 2, 0], name: 'bed-bulkhead' });
    for (const zz of [1, -1]) mesh(roundedBox(bl, wallH, 0.03, 0.01), liner, { parent: body, at: [bx, fy + wallH / 2, zz * W * 0.42], name: 'bed-wall' });
    mesh(roundedBox(0.03, wallH, W * 0.84, 0.01), liner, { parent: body, at: [v.bed[0] + 0.03, fy + wallH / 2, 0], name: 'tailgate-inner' });
    mesh(loft.patch({ x: [-h + 0.06, -h + 0.067], from: I('corner', 0.7), to: I('roofCorner', 0.6), offset: 0.0015 }), SEAM, { parent: body, name: 'tailgate-seam' });
    mesh(loft.patch({ x: [v.bed[1] + 0.06, v.bed[1] + 0.12], from: I('roofCorner', 0.75), side: 'across', hole: true, offset: 0 }), glass, { parent: body, name: 'glass' });
    mesh(roundedBox(0.12, 0.14, W * 0.86, 0.05), CHROME, { parent: body, at: [-h - 0.01, P(-h, 'corner', 0.4).point.y, 0], name: 'rear-bumper' });
  }

  // ---------------- liveries ----------------
  const frontDoor = v.doors.length > 1 ? [v.doors[1] + 0.03, v.doors[0] - 0.03] : [v.doors[0] - 0.8, v.doors[0] - 0.03];
  const doorSpan = [v.doors[v.doors.length - 1] + 0.012, v.doors[0] - 0.012];
  if (v.taxi) {
    const roofX = v.rearGlass?.top ? (v.rearGlass.x[1] + (v.windshield?.[0] ?? 0)) / 2 : -0.3;
    const roofY = fTop(roofX) + 0.02;
    const signMat = textMaterial('taxi', 'TAXI', { color: '#111', bg: '#ffe14a', font: 'bold 140px Arial, sans-serif', w: 512, h: 192 });
    signMat.transparent = false;
    signMat.depthWrite = true;
    signMat.emissive = new THREE.Color('#fff2a0');
    signMat.emissiveMap = signMat.map;
    signMat.emissiveIntensity = 0.25;
    signMat.visible = true;
    signMat.polygonOffset = false;
    // box body + printed faces front and back (extrude UVs are in metres, so text goes on planes)
    mesh(roundedBox(0.26, 0.15, 0.7, 0.04), M.emissive('#ffe14a', 0.25), { parent: body, name: 'taxi_box', at: [roofX, roofY + 0.095, 0] });
    for (const sx of [1, -1]) {
      const pg = new THREE.PlaneGeometry(0.6, 0.12);
      pg.rotateY(sx * Math.PI / 2);
      mesh(pg, signMat, { parent: body, name: sx > 0 ? 'taxi_sign' : 'taxi_sign_back', at: [roofX + sx * 0.1305, roofY + 0.095, 0] });
    }
    mesh(roundedBox(0.2, 0.03, 0.5, 0.01), trim, { parent: body, name: 'taxi_base', at: [roofX, roofY + 0.012, 0] });
    const checker = drawMaterial('checker', 1024, 64, (c, w, hh) => {
      for (let i = 0; i < 64; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#f2f2f2'; c.fillRect(i * 16, j * 32, 16, 32); }
    });
    for (const s of [1, -1]) {
      mesh(surfaceGrid(loft, { x: doorSpan, h: [RP('lower', 0.62), RP('lower', 0.7)], side: s, offset: 0.0035, nx: 20, ny: 1 }), checker, { parent: body, name: 'taxi_checker' });
      mesh(surfaceGrid(loft, { x: frontDoor, h: [RP('lower', 0.25), RP('lower', 0.52)], side: s, offset: 0.0035, nx: 8, ny: 3 }), textMaterial('taxitxt', 'TAXI · 555 0199', { color: '#111', font: 'bold 110px Arial, sans-serif' }), { parent: body, name: 'taxi_text' });
    }
  }
  let sirenTracks = null;
  if (v.police) {
    const white = M.paint('#f4f4f4', { metallic: 0.3 });
    white.name = 'police-white';
    for (const s of [1, -1]) {
      mesh(surfaceGrid(loft, { x: doorSpan, h: [RP('corner', 0.75), RP('lower', 0.93)], side: s, offset: 0.0012, nx: 24, ny: 8 }), white, { parent: body, name: 'police_doors' });
      mesh(surfaceGrid(loft, { x: frontDoor, h: [RP('lower', 0.3), RP('lower', 0.62)], side: s, offset: 0.003, nx: 8, ny: 3 }), textMaterial('police', 'POLICE', { color: '#10204a', font: 'bold 150px Arial, sans-serif' }), { parent: body, name: 'police_text' });
      mesh(surfaceGrid(loft, { x: doorSpan, h: [RP('lower', 0.7), RP('lower', 0.76)], side: s, offset: 0.0028, nx: 20, ny: 1 }), M.paint('#1d3f9a', { metallic: 0.3 }), { parent: body, name: 'police_stripe' });
      if (v.doors.length > 2) mesh(surfaceGrid(loft, { x: [v.doors[2] + 0.06, v.doors[1] - 0.06], h: [RP('lower', 0.3), RP('lower', 0.6)], side: s, offset: 0.003, nx: 6, ny: 3 }), textMaterial('unit', '911', { color: '#10204a', font: 'bold 150px Arial, sans-serif', w: 512 }), { parent: body, name: 'police_unit' });
    }
    const roofX = v.rearGlass?.top ? (v.rearGlass.x[1] + (v.windshield?.[0] ?? 0)) / 2 + 0.15 : -0.3;
    const roofY = fTop(roofX) + 0.02;
    const bar = group('lightbar', { parent: body, at: [roofX, roofY, 0] });
    mesh(roundedBox(0.3, 0.05, 1.24, 0.02), trim, { parent: bar, at: [0, 0.025, 0], name: 'lightbar_base' });
    for (const z of [0.4, -0.4]) mesh(roundedBox(0.06, 0.04, 0.06, 0.01), trim, { parent: bar, at: [0, -0.005, z], name: 'lightbar_foot' });
    const red = lampGroup('beacon_red', 'red');
    const blue = lampGroup('beacon_blue', 'blue');
    const cover = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1, depthWrite: false, name: 'lightbar_cover' });
    for (const [grp, zs] of [[red, [-0.18, -0.36, -0.52]], [blue, [0.18, 0.36, 0.52]]]) {
      for (const z of zs) for (const nx of [1, -1]) grp.add(bar, { at: [nx * 0.11, 0.085, z], normal: [nx, 0, 0], w: 0.15, h: 0.055, depth: 0.012, bezel: false });
    }
    const white2 = lampGroup('beacon_white', 'white');
    white2.add(bar, { at: [0.11, 0.085, 0], normal: [1, 0, 0], w: 0.12, h: 0.05, depth: 0.012, bezel: false });
    mesh(roundedBox(0.26, 0.08, 1.2, 0.035), cover, { parent: bar, at: [0, 0.085, 0], name: 'lightbar_lens' });
    // grille strobes
    const gs = P(h - 0.03, 'lower', 0.45, 1);
    red.add(body, { at: [gs.point.x + 0.01, gs.point.y, -0.12], normal: [1, 0, 0], w: 0.06, h: 0.03, depth: 0.008 });
    blue.add(body, { at: [gs.point.x + 0.01, gs.point.y, 0.12], normal: [1, 0, 0], w: 0.06, h: 0.03, depth: 0.008 });
    const p = 0.5;
    const D = THREE.InterpolateDiscrete;
    const alt = (n, on, phase) => [
      new THREE.NumberKeyframeTrack(`${n}.material.emissiveIntensity`, [0, p / 4, p / 2, (3 * p) / 4, p], phase ? [0.2, 0.2, on, 0.2, 0.2] : [on, 0.2, 0.2, on, on], D),
      new THREE.NumberKeyframeTrack(`${n}_glow.material.opacity`, [0, p / 4, p / 2, (3 * p) / 4, p], phase ? [0, 0, 1, 0, 0] : [1, 0, 0, 1, 1], D),
    ];
    sirenTracks = [...alt('beacon_red', LAMP_ON.red, 0), ...alt('beacon_blue', LAMP_ON.blue, 1), ...lampTracks('beacon_white', LAMP_ON.white, { blink: 4 })];
  }

  if (v.stripes && !v.police && !v.taxi) {
    // twin racing stripes over bonnet, roof and boot (skipping the glass)
    const stripeMat = M.paint(o.accentColor ?? (paint.color.getHSL({}).l > 0.6 ? '#141414' : '#f4f4f2'), { metallic: 0.3 });
    stripeMat.name = 'stripes';
    const gaps = [v.windshield, v.rearGlass?.top ? v.rearGlass.x : null, v.open, v.bed, v.rearGlass?.face ? [-h, -h + 0.2] : null].filter(Boolean).map(([a, b]) => [Math.min(a, b), Math.max(a, b)]).sort((a, b) => a[0] - b[0]);
    const segs = [];
    let x0 = -h + 0.04;
    for (const [a, b] of gaps) { if (a > x0 + 0.05) segs.push([x0, a - 0.01]); x0 = Math.max(x0, b + 0.01); }
    if (h - 0.08 > x0 + 0.05) segs.push([x0, h - 0.08]);
    for (const [a, b] of segs) for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [a, b], h: [loft.H - 1.9, loft.H - 0.7], side: s, offset: 0.0022, nx: Math.max(4, Math.round((b - a) * 10)), ny: 2 }), stripeMat, { parent: body, name: 'race_stripe' });
  }
  if (v.ecoLivery) {
    const blue = M.paint('#1f6fd1', { metallic: 0.4 });
    blue.name = 'eco_accent';
    for (const s of [1, -1]) {
      mesh(surfaceGrid(loft, { x: [-h + 0.35, h - 0.45], h: [RP('corner', 0.7), RP('lower', 0.3)], side: s, offset: 0.0018, nx: 30, ny: 3 }), blue, { parent: body, name: 'eco_band' });
      mesh(surfaceGrid(loft, { x: frontDoor, h: [RP('lower', 0.38), RP('lower', 0.6)], side: s, offset: 0.0032, nx: 8, ny: 2 }), textMaterial('ev', 'ELECTRIC', { color: '#1f6fd1', font: 'bold italic 130px Arial, sans-serif' }), { parent: body, name: 'ev_text' });
    }
  }
  if (v.roofSolar && !v.open && !v.bed && v.windshield && !v.police && !v.taxi) {
    const xa = v.rearGlass?.top ? v.rearGlass.x[1] + 0.05 : -h + 0.25;
    const xb = v.windshield[0] - 0.05;
    if (xb - xa > 0.4) for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [xa, xb], h: [RP('roof', 0.25), loft.H], side: s, offset: 0.003, nx: 8, ny: 3 }), drawMaterial('solarcar', 256, 128, (c) => {
      c.fillStyle = '#10204a'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#5b6f9a'; c.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 128); c.stroke(); }
      for (let j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(0, j * 32); c.lineTo(256, j * 32); c.stroke(); }
    }, { transparent: false, roughness: 0.2, metalness: 0.5 }), { parent: body, name: 'solar_roof' });
  }
  if (v.sideGraphic && !v.police && !v.taxi) {
    const g = drawMaterial('stancefade', 1024, 128, (c) => {
      const gr = c.createLinearGradient(0, 0, 1024, 0);
      gr.addColorStop(0, 'rgba(255,40,140,0)'); gr.addColorStop(0.25, 'rgba(255,40,140,0.95)'); gr.addColorStop(1, 'rgba(60,200,255,0.95)');
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(0, 90); c.lineTo(1024, 20); c.lineTo(1024, 70); c.lineTo(0, 118); c.fill();
    });
    for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [-h + 0.3, h - 0.5], h: [RP('lower', 0.15), RP('lower', 0.75)], side: s, offset: 0.0028, nx: 30, ny: 3 }), g, { parent: body, name: 'side_graphic' });
  }
  if (v.cladding) {
    for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [-h + 0.4, h - 0.5], h: [RP('corner', 0.55), RP('corner', 1.0)], side: s, offset: 0.0045, nx: 30, ny: 2 }), M.matte('#1b1c1e', 0.8), { parent: body, name: 'cladding' });
  }
  if (v.lowerTone) {
    // coachline two-tone: contrasting lower body under a chrome strip
    const dark = paint.color.getHSL({}).l < 0.25;
    const tone = M.paint(dark ? '#b9a27a' : '#1b1c20', { metallic: 0.6 });
    tone.name = 'paint-lower';
    for (const s of [1, -1]) {
      mesh(surfaceGrid(loft, { x: [-h + 0.25, h - 0.42], h: [RP('corner', 0.6), RP('lower', 0.42)], side: s, offset: 0.0018, nx: 34, ny: 4 }), tone, { parent: body, name: 'lower_tone' });
      mesh(surfaceGrid(loft, { x: [-h + 0.25, h - 0.42], h: [RP('lower', 0.42), RP('lower', 0.47)], side: s, offset: 0.0026, nx: 34, ny: 1 }), CHROME, { parent: body, name: 'coachline' });
    }
  }
  if (v.livery === 'rally') {
    const num = String(((variant.length * 7 + 3) % 89) + 10);
    const roundel = drawMaterial(`roundel${num}`, 256, 256, (c) => {
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(128, 128, 120, 0, Math.PI * 2); c.fill();
      c.lineWidth = 10; c.strokeStyle = '#111'; c.stroke();
      c.fillStyle = '#111'; c.font = 'bold 140px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(num, 128, 136);
    });
    const stripe = drawMaterial('rallystripe', 512, 64, (c) => {
      const cols = ['#1a3c8f', '#ffffff', '#d4202a'];
      cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 21, 512, 22); });
    });
    for (const s of [1, -1]) {
      const fx = (frontDoor[0] + frontDoor[1]) / 2;
      mesh(surfaceGrid(loft, { x: [fx - 0.2, fx + 0.2], h: [RP('lower', 0.15), RP('lower', 0.85)], side: s, offset: 0.0035, nx: 6, ny: 6 }), roundel, { parent: body, name: 'rally_number' });
      mesh(surfaceGrid(loft, { x: [-h + 0.35, h - 0.45], h: [RP('corner', 0.75), RP('lower', 0.1)], side: s, offset: 0.003, nx: 24, ny: 2 }), stripe, { parent: body, name: 'rally_stripe' });
    }
  }

  // ---------------- van panels & equipment ----------------
  const vanParts = buildVanParts({ v, body, loft, h, W, paint, glass, interior, trim, gloss, CHROME, slideH, rearH, hatchH, rd, fTop, P, RP, emblem: re, badgeName: 'badge' });
  if (vanParts.sirenTracks) sirenTracks = vanParts.sirenTracks;

  // engine bay and boot floor, seen when the bonnet / boot open
  if (bonnetX) {
    const bx = (bonnetX[0] + bonnetX[1]) / 2;
    const topY = P(bx, 'roof', 1).point.y;
    const ey = topY - 0.2;
    const eng = M.metal('#3b3d41', 0.45);
    const bay = group('engine_bay', { parent: body });
    mesh(roundedBox(Math.min(0.6, bonnetX[1] - bonnetX[0] - 0.3), 0.26, W * 0.42, 0.05), eng, { parent: bay, name: 'engine_block', at: [bx, ey - 0.06, 0] });
    mesh(roundedBox(0.36, 0.06, W * 0.3, 0.03), M.plastic('#151515', 0.4), { parent: bay, name: 'engine_cover', at: [bx, ey + 0.1, 0] });
    mesh(roundedBox(0.18, 0.16, 0.24, 0.02), M.plastic('#1b1b1b', 0.5), { parent: bay, name: 'battery', at: [bx - 0.05, ey - 0.02, W * 0.32] });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16), M.plastic('#e9e2cc', 0.4), { parent: bay, name: 'reservoir', at: [bx + 0.1, ey, -W * 0.33] });
    const bl = Math.max(0.3, bonnetX[1] - bonnetX[0]);
    const tx = THREE.MathUtils.clamp(v.xf, bx - bl / 2 + 0.08, bx + bl / 2 - 0.08); // towers stand on the bay floor
    for (const z of [W * 0.35, -W * 0.35]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 16), M.metal('#2a2b2e', 0.5), { parent: bay, name: 'strut_tower', at: [tx, ey - 0.05, z] });
    // floor sits fully inside the bay: the body narrows + rounds toward the nose, so a full-size plate poked
    // out of the bumper below the headlights as a black blade; shrink + set back, and round the front corners
    const fl = Math.max(0.3, bonnetX[1] - bonnetX[0]) * 0.78;
    mesh(roundedBox(W * 0.62, 0.03, fl, 0.12), M.matte('#121212', 0.9), { parent: bay, name: 'bay_floor', at: [bx - fl * 0.08, ey - 0.2, 0], rot: [0, Math.PI / 2, 0] });
  }
  if (bootX) {
    const bx = (bootX[0] + bootX[1]) / 2 + 0.05;
    const fy = P(bx, 'lower', 0.2).point.y;
    mesh(roundedBox(Math.max(0.3, bootX[1] - bootX[0] - 0.1), 0.03, W * 0.78, 0.01), M.fabric('#1c1c1e'), { parent: body, name: 'boot_floor', at: [bx, fy, 0] });
  }

  // ---------------- opening panels: build skins, move decals/parts onto them ----------------
  const panelAnims = buildPanels({ v, body, loft, panels, paint, glass, trim, gloss, P, RP, h, W, glassParts });

  // ---------------- wheels ----------------
  const wz = W / 2 - 0.135 + (v.widebody ? 0.03 : 0);
  for (const wx of [v.xf, v.xr]) wheelWell(body, wx, ar - 0.005, W * 0.9, wcy).name = 'wheel_well';
  const ww = wr * 0.72 * (v.widebody ? 1.12 : 1);
  const { spins, steers } = addWheels(
    root,
    [['wheel_FL', v.xf, wz, true], ['wheel_FR', v.xf, -wz, true], ['wheel_RL', v.xr, wz], ['wheel_RR', v.xr, -wz]],
    { radius: wr, width: ww, style: v.wheelStyle ?? 'five', caliper: v.caliper, rimColor: o.rimColor ?? v.rimColor ?? (v.wheelStyle === 'steel' ? '#2b2c2e' : '#cfd2d6') },
  );
  spins.forEach((sp, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    if (v.wheelDress) dressWheel(sp, side, { radius: wr, width: ww, kind: v.wheelDress });
    if (v.hubcap) dressWheel(sp, side, { radius: wr, width: ww, kind: 'hubcap' });
    if (v.tread) atTread(sp, { radius: wr, width: ww });
  });
  // suspension links so a raised body visibly sits on its wheels
  // strut/damper from the hub stub up into the wheel-arch roof (top of the well = wr + ar)
  {
    const sh = ar + 0.02;
    const strutMat = M.metal('#3a3c40', 0.4);
    const coilMat = M.paint('#b71c1c', { metallic: 0.3 });
    for (const wx of [v.xf, v.xr]) for (const s of [1, -1]) {
      const sz = s * (wz - ww / 2 - 0.06);
      mesh(new THREE.CylinderGeometry(0.03, 0.03, sh, 10), strutMat, { parent: root, name: 'strut', at: [wx, wr - 0.02 + sh / 2, sz] });
      if (rideY > 0.02) for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(0.038, 0.008, 6, 16), coilMat, { parent: root, name: 'strut_coil', at: [wx, wr + sh * 0.4 + k * 0.035, sz], rot: [Math.PI / 2, 0, 0] });
    }
  }

  // ---------------- animations ----------------
  const spots = o.lights === false ? [] : addHeadlightSpots(body, [h - 0.1, P(h - 0.2, 'lower', 0.8).point.y, W / 2 - 0.35]);
  const set = vehicleAnimations({
    spins, steers, radius: wr, speed: o.speed ?? 8, spots,
    lamps: { head: 'headlights', tail: 'taillights', brake: 'brakelights', signalL: 'indicator_L', signalR: 'indicator_R', reverse: 'reverselights' },
  });
  const lights = set.animations.find((c) => c.name === 'lights');
  lights.tracks.push(...lampTracks('drl', LAMP_ON.drl, { glow: 0.4 }));
  for (const n of auxNames) lights.tracks.push(...lampTracks(n, n === 'underglow' ? LAMP_ON.blue : LAMP_ON.white, { glow: n === 'underglow' ? 0.8 : 0.9 }));
  if (v.taxi) lights.tracks.push(new THREE.NumberKeyframeTrack('taxi_sign.material.emissiveIntensity', [0, 1], [1.4, 1.4]));
  // body motion: bounce while driving, roll into turns, engine shake at idle; steering wheel follows the wheels
  const byName = (n) => set.animations.find((c) => c.name === n);
  const roll = (period, angleAt) => rotateTrack(body, 'x', period, angleAt, 24);
  byName('drive').tracks.push(moveTrack(body, byName('drive').duration, (t) => [0, rideY + Math.abs(Math.sin(t * Math.PI * 4)) * 0.008, 0], 24));
  byName('steer').tracks.push(roll(4, (t) => -Math.sin(t * Math.PI * 2) * 0.025), rotateTrack(steeringWheel, 'x', 4, (t) => Math.sin(t * Math.PI * 2) * 1.6, 24));
  byName('steerLeft').tracks.push(roll(0.6, (t) => -ease(t) * 0.025), rotateTrack(steeringWheel, 'x', 0.6, (t) => ease(t) * 1.6, 12));
  byName('steerRight').tracks.push(roll(0.6, (t) => ease(t) * 0.025), rotateTrack(steeringWheel, 'x', 0.6, (t) => -ease(t) * 1.6, 12));
  const animations = [...set.animations, clip('idle', 0.12, [
    moveTrack(body, 0.12, (t) => [0, rideY + wave(t) * 0.0018, 0], 8),
    rotateTrack(body, 'x', 0.12, (t) => wave(t, 2) * 0.0015, 8),
  ]), ...panelAnims];
  if (roofClip) animations.push(roofClip);
  if (wiperPivots.length) {
    const sweep = (t) => (t < 0.5 ? ease(t * 2) : ease(2 - t * 2)) * 1.45;
    animations.push(clip('wipers', 1.4, wiperPivots.map((w) => rotateTrack(w, 'y', 1.4, (t) => sweep(t), 28))));
  }
  if (sirenTracks) animations.push(clip('siren', 0.5, sirenTracks));
  if (vanParts.extra) animations.push(...vanParts.extra);
  if (vanParts.lightTracks?.length) lights.tracks.push(...vanParts.lightTracks);
  const car = finalize(root, { type, variant, options: o, animations });
  car.userData.premade.oneShot = [...set.oneShot, ...(vanParts.oneShot ?? [])];
  car.userData.premade.exclusive = set.exclusive;
  return car;
}
