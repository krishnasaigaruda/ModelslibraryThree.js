// Vans: generic designs with real-world class proportions (mid-size panel van ~5.3 m,
// high-roof ~6 m, step van ~5.6 m …), built on the same loft/lamp system as the cars.
import { buildVehicle } from './car.js';

const raise = (pts, dy, above = 1.6) => pts.map(([x, y]) => [x, y > above ? y + dy : y]);
const sx = (pts, k) => pts.map(([x, y]) => [x * k, y]);

const CARGO = {
  L: 5.3, W: 2.0, wr: 0.36, xf: 1.72, xr: -1.62,
  top: [[-2.65, 2.22], [-2.61, 2.3], [-2.45, 2.33], [0.95, 2.33], [1.35, 2.12], [1.8, 1.48], [2.3, 1.2], [2.58, 1.05], [2.65, 0.95]],
  shoulder: [[-2.65, 1.18], [1.6, 1.2], [2.3, 1.1], [2.65, 0.92]],
  sill: [[-2.65, 0.56], [-2.4, 0.44], [2.3, 0.43], [2.65, 0.56]],
  nose: { len: 0.7, p: 2.6 }, tail: { len: 0.15, p: 6 },
  windshield: [1.38, 1.92], sideWindows: [[0.8, 1.4]], bPillar: null,
  doors: [1.62, 0.78], sliding: [-0.45, 0.72], rearDoors: 0.1, seatRows: 1,
  color: '#e9eaeb', wheelStyle: 'steel', rimColor: '#2b2c2e', grille: 'mesh', stepUp: true,
};
const PASSENGER_WINDOWS = [[0.8, 1.4], [-1.55, -0.55], [-2.5, -1.65]];
const DELIVERY = {
  L: 5.6, W: 2.1, wr: 0.38, xf: 1.85, xr: -1.55,
  top: [[-2.8, 2.55], [-2.76, 2.62], [-2.55, 2.64], [1.95, 2.63], [2.15, 2.5], [2.45, 1.62], [2.7, 1.36], [2.8, 1.2]],
  shoulder: [[-2.8, 1.3], [2.15, 1.3], [2.6, 1.2], [2.8, 1.05]],
  sill: [[-2.8, 0.62], [-2.6, 0.48], [2.5, 0.47], [2.8, 0.62]],
  nose: { len: 0.35, p: 4 }, tail: { len: 0.12, p: 7 },
  windshield: [2.17, 2.42], sideWindows: [[1.6, 2.15]], bPillar: null,
  doors: [2.15, 1.55], rearDoors: 0.09, seatRows: 1,
  color: '#f2f2ef', wheelStyle: 'steel', rimColor: '#d0d2d4', grille: 'mesh', boxFront: 1.9,
};

export const VAN_VARIANTS = {
  cargo: CARGO,
  panel: {
    L: 4.4, W: 1.82, wr: 0.32, xf: 1.42, xr: -1.3,
    top: [[-2.2, 1.78], [-2.16, 1.84], [-1.98, 1.86], [0.55, 1.85], [1.05, 1.5], [1.5, 1.05], [2.05, 0.95], [2.2, 0.85]],
    shoulder: [[-2.2, 1.0], [1.1, 1.02], [1.8, 0.92], [2.2, 0.78]],
    sill: [[-2.2, 0.52], [-2.0, 0.36], [1.9, 0.34], [2.2, 0.5]],
    nose: { len: 0.55, p: 2.5 }, tail: { len: 0.14, p: 6 },
    windshield: [0.62, 1.12], sideWindows: [[0.05, 0.62]], bPillar: null,
    doors: [1.1, 0.03], sliding: [-0.75, 0.0], rearDoors: 0.09, seatRows: 1,
    color: '#c8ccd0', grille: 'mesh',
  },
  'high-roof': {
    ...CARGO, L: 6.0, xr: -1.95, top: raise(sx(CARGO.top, 6.0 / 5.3), 0.32),
    shoulder: sx(CARGO.shoulder, 6.0 / 5.3), sill: sx(CARGO.sill, 6.0 / 5.3),
    windshield: [1.55, 2.12], sideWindows: [[0.95, 1.58]], doors: [1.8, 0.92], sliding: [-0.35, 0.86], xf: 1.95,
    color: '#f4f4f2',
  },
  passenger: { ...CARGO, sideWindows: PASSENGER_WINDOWS, sliding: [-0.45, 0.72], slidingGlass: true, seatRows: 3, rearWindows: true, wheelStyle: 'five', rimColor: '#cfd2d6', color: '#2c3e50', bPillar: [0.72, 0.8] },
  camper: {
    ...CARGO, top: raise(CARGO.top, 0.28), sideWindows: PASSENGER_WINDOWS, slidingGlass: true, seatRows: 2, rearWindows: true,
    color: '#7fb3a6', twoTone: true, solar: true, awning: true, wheelStyle: 'five', rimColor: '#e6e6e6',
  },
  ambulance: {
    L: 5.95, W: 2.06, wr: 0.38, xf: 1.95, xr: -1.85,
    top: [[-2.975, 2.6], [-2.93, 2.68], [-2.72, 2.7], [0.48, 2.7], [0.64, 2.3], [1.05, 2.2], [1.62, 1.55], [2.3, 1.22], [2.975, 0.96]],
    shoulder: [[-2.975, 1.22], [1.7, 1.24], [2.4, 1.12], [2.975, 0.94]],
    sill: [[-2.975, 0.6], [-2.7, 0.46], [2.6, 0.45], [2.975, 0.6]],
    nose: { len: 0.7, p: 2.6 }, tail: { len: 0.14, p: 6 },
    windshield: [1.1, 1.62], sideWindows: [[0.6, 1.12]], bPillar: null,
    doors: [1.42, 0.58], sliding: [-0.6, 0.4], rearDoors: 0.1, rearWindows: true, seatRows: 1,
    color: '#f6f6f4', ambulance: true, boxFront: 0.4, grille: 'mesh',
  },
  delivery: DELIVERY,
  'food-truck': { ...DELIVERY, hatch: [-1.7, 0.9], color: '#e8b923', stepUp: true },
  minibus: {
    ...CARGO, L: 6.6, xr: -2.2, xf: 2.05, top: raise(sx(CARGO.top, 6.6 / 5.3), 0.3), shoulder: sx(CARGO.shoulder, 6.6 / 5.3), sill: sx(CARGO.sill, 6.6 / 5.3),
    windshield: [1.62, 2.25], sideWindows: [[1.0, 1.62], [-1.3, -0.35], [-2.3, -1.4], [-3.15, -2.4]], doors: [1.9, 0.98], sliding: [-0.25, 0.92], slidingGlass: true,
    seatRows: 4, rearWindows: true, bPillar: [0.92, 1.0], color: '#f0f0ee', wheelStyle: 'five', rimColor: '#cfd2d6',
  },
  'crew-van': { ...CARGO, sideWindows: [[0.8, 1.4]], slidingGlass: true, seatRows: 2, color: '#3c4148' },
  refrigerated: { ...CARGO, fridge: true, color: '#f4f6f8' },
  postal: {
    L: 4.3, W: 1.78, wr: 0.32, xf: 1.35, xr: -1.25,
    top: [[-2.15, 2.02], [-2.11, 2.08], [-1.95, 2.1], [0.85, 2.1], [1.1, 1.85], [1.5, 1.2], [2.02, 1.0], [2.15, 0.9]],
    shoulder: [[-2.15, 1.05], [1.2, 1.08], [1.85, 0.98], [2.15, 0.85]],
    sill: [[-2.15, 0.52], [-1.95, 0.38], [1.85, 0.37], [2.15, 0.5]],
    nose: { len: 0.5, p: 2.8 }, tail: { len: 0.13, p: 6 },
    windshield: [1.12, 1.5], sideWindows: [[0.55, 1.12]], bPillar: null,
    doors: [1.25, 0.53], sliding: [-0.6, 0.48], slidingGlass: true, rearDoors: 0.09, seatRows: 1,
    color: '#1f4f9a', livery: 'courier',
  },
};

export const VAN_TRIMS = {
  work: { hivis: true, workBeacon: true, roofRack: true, sideSteps: true, towbar: true, mudflaps: true, wheelStyle: 'steel', rimColor: '#2b2c2e' },
  ladder: { ladder: true, mudflaps: true, wheelStyle: 'steel', rimColor: '#2b2c2e' },
  offroad: { ride: 0.07, wheelScale: 1.08, archClear: 0.035, wheelStyle: 'steel', rimColor: '#2a2b2d', wheelDress: 'beadlock', tread: true, flares: true, skid: true, mudflaps: true },
  luxury: { wheelStyle: 'mesh', rimColor: '#e4e6e8', chromeTrim: true, twoTone: true, grille: 'chrome', exhaust: 'twin' },
  courier: { livery: 'courier', roofRack: true, stepUp: true },
  touring: { roofBox: true, towbar: true, mudflaps: true },
};

export function createVan(options = {}) {
  return buildVehicle(options, 'van', VAN_VARIANTS, VAN_TRIMS);
}
