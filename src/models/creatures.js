// 'creatures' category entry (dynamic-import chunk). Re-exports factories from ./creatures/*.
export { createDragon, createWyvern, DRAGON_VARIANTS, WYVERN_VARIANTS } from './creatures/dragon.js';
export { createUnicorn, createGriffin, UNICORN_VARIANTS, GRIFFIN_VARIANTS } from './creatures/beasts.js';
export { createPhoenix, createGargoyle, PHOENIX_VARIANTS, GARGOYLE_VARIANTS } from './creatures/fliers.js';
export { createKraken, createSeaSerpent, KRAKEN_VARIANTS, SERPENT_VARIANTS } from './creatures/sea.js';
export { createGolem, createYeti, createGoblinStatue, GOLEM_VARIANTS, YETI_VARIANTS, GOBLIN_VARIANTS } from './creatures/folk.js';
export { createSlime, createMushroomFolk, createAlienCritter, SLIME_VARIANTS, MUSHROOM_VARIANTS, ALIEN_VARIANTS } from './creatures/odd.js';
export { createRobotCompanion, ROBOT_VARIANTS } from './creatures/robot.js';
export { createTreefolk, TREE_VARIANTS } from './creatures/tree.js';
