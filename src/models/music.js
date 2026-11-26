// 'music' category entry (dynamic-import chunk). Re-exports factories from ./music/*.
export { createGuitar, createBowed, GUITAR_VARIANTS, BOWED_VARIANTS } from './music/strings.js';
export { createPiano, createKeyboard, PIANO_VARIANTS, KEYBOARD_VARIANTS } from './music/keys.js';
export { createDrum, createPercussion, DRUM_VARIANTS, PERC_VARIANTS } from './music/drums.js';
export { createBrass, createWoodwind, BRASS_VARIANTS, WOODWIND_VARIANTS } from './music/winds.js';
export { createMicrophone, createAmp, createSpeaker, createMixer, createDJGear, createHeadphones, createMusicStand, createStageLight, createVinyl } from './music/studio.js';
