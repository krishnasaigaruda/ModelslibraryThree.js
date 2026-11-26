// Catalog entries for the 'music' category (module 'music', src/models/music.js + src/models/music/*).
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
const STD = ['vintage', 'sunburst', 'natural', 'black', 'white', 'neon', 'relic', 'gold', 'kids'];
const e = (factory, label, sub, variants, tags, trims = STD, options = { color: 'main colour (base model)' }) => ({ category: 'music', sub, source: 'js', module: 'music', factory, label, variants, trims, tags, options });

export default {
  guitar: e('createGuitar', 'Guitar & Fretted', 'strings',
    ['acoustic', 'jumbo', 'parlor', 'twelve-string', 'classical', 'flamenco', 'resonator', 'archtop', 'electric-dc', 'electric-sc', 'electric-offset', 'electric-superstrat', 'semi-hollow', 'bass', 'bass-5', 'fretless-bass', 'ukulele', 'tenor-ukulele', 'banjo', 'mandolin', 'mandolin-f'],
    ['guitar', 'electric guitar', 'acoustic guitar', 'bass guitar', 'ukulele', 'banjo', 'mandolin', 'strings', 'instrument']),
  bowed: e('createBowed', 'Violin Family', 'strings', ['violin', 'viola', 'cello', 'double-bass', 'electric-violin', 'baroque-violin'], ['violin', 'viola', 'cello', 'double bass', 'fiddle', 'bow', 'strings', 'orchestra']),
  'concert-piano': e('createPiano', 'Piano', 'keys', ['grand', 'baby-grand', 'upright', 'digital', 'harpsichord', 'spinet'], ['piano', 'grand piano', 'upright piano', 'harpsichord', 'keys', 'instrument']),
  keyboard: e('createKeyboard', 'Keyboard & Organ', 'keys', ['stage-piano', 'synth', 'analog-synth', 'workstation', 'keytar', 'organ', 'pipe-organ', 'accordion', 'melodica'], ['keyboard', 'synthesizer', 'synth', 'organ', 'accordion', 'keytar', 'piano', 'keys']),
  'drum-set': e('createDrum', 'Drums', 'drums', ['rock-kit', 'jazz-kit', 'electronic-kit', 'snare', 'bass-drum', 'floor-tom', 'ride-cymbal', 'hi-hat', 'bongos', 'congas', 'djembe', 'timpani', 'cajon', 'gong', 'steelpan'], ['drum', 'drum kit', 'drums', 'cymbal', 'snare', 'bongo', 'conga', 'djembe', 'timpani', 'percussion']),
  percussion: e('createPercussion', 'Percussion & Harp', 'percussion', ['xylophone', 'marimba', 'glockenspiel', 'vibraphone', 'triangle', 'tambourine', 'harp', 'lever-harp', 'metronome', 'tubular-bells', 'maracas'], ['xylophone', 'marimba', 'harp', 'triangle', 'tambourine', 'metronome', 'maracas', 'percussion']),
  brass: e('createBrass', 'Brass', 'winds', ['trumpet', 'cornet', 'flugelhorn', 'trombone', 'tuba', 'euphonium', 'french-horn', 'sousaphone'], ['trumpet', 'trombone', 'tuba', 'french horn', 'horn', 'brass', 'band']),
  woodwind: e('createWoodwind', 'Woodwind', 'winds', ['alto-sax', 'tenor-sax', 'soprano-sax', 'clarinet', 'oboe', 'flute', 'piccolo', 'bassoon', 'recorder', 'harmonica', 'pan-flute'], ['saxophone', 'sax', 'clarinet', 'flute', 'oboe', 'bassoon', 'recorder', 'harmonica', 'woodwind']),
  microphone: e('createMicrophone', 'Microphone', 'studio', ['vocal-stand', 'boom-stand', 'condenser', 'ribbon', 'podcast'], ['microphone', 'mic', 'mic stand', 'studio', 'podcast', 'stage']),
  'guitar-amp': e('createAmp', 'Amplifier', 'studio', ['combo', 'half-stack', 'full-stack', 'bass-combo', 'practice-amp'], ['amp', 'amplifier', 'guitar amp', 'stack', 'stage']),
  'music-speaker': e('createSpeaker', 'Speaker', 'studio', ['pa-speaker', 'studio-monitors', 'floor-wedge', 'subwoofer', 'line-array', 'hifi-tower'], ['speaker', 'pa', 'monitor', 'subwoofer', 'loudspeaker', 'sound system']),
  'mixing-desk': e('createMixer', 'Mixing Desk', 'studio', ['compact-mixer', 'studio-console', 'live-desk'], ['mixer', 'mixing desk', 'mixing console', 'sound board', 'studio']),
  'dj-gear': e('createDJGear', 'DJ Gear', 'studio', ['dj-booth', 'turntable', 'dj-controller', 'cd-deck'], ['dj', 'turntable', 'decks', 'dj controller', 'vinyl', 'club']),
  headphones: e('createHeadphones', 'Headphones', 'studio', ['studio', 'dj', 'open-back'], ['headphones', 'headset', 'cans', 'studio']),
  'music-stand': e('createMusicStand', 'Music Stand', 'stage', ['wire-folding', 'orchestral', 'conductor-podium'], ['music stand', 'sheet music', 'conductor', 'podium', 'orchestra']),
  'stage-light': e('createStageLight', 'Stage Light', 'stage', ['par-can', 'moving-head', 'light-truss', 'follow-spot', 'led-bar'], ['stage light', 'spotlight', 'truss', 'moving head', 'lighting', 'concert']),
  'vinyl-player': e('createVinyl', 'Records & Players', 'studio', ['record-player', 'hifi-turntable', 'gramophone', 'record-crate', 'jukebox', 'boombox'], ['record player', 'vinyl', 'gramophone', 'jukebox', 'boombox', 'records', 'turntable']),
};
