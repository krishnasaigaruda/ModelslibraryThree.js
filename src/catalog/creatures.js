// Catalog entries for the 'creatures' category (module 'creatures', src/models/creatures.js + src/models/creatures/*).
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
// Every type is an original fantasy design; trims are elemental looks that change silhouette + parts + material.
const EL = ['fire', 'ice', 'poison', 'shadow', 'stone', 'gold', 'undead', 'crystal', 'baby', 'armoured', 'storm', 'forest'];
const e = (factory, label, sub, variants, trims, tags, options = { color: 'main skin colour (base model)' }) => ({ category: 'creatures', sub, source: 'js', module: 'creatures', factory, label, variants, trims, tags, options });

export default {
  dragon: e('createDragon', 'Dragon', 'dragons', ['western', 'spread', 'perched', 'drake', 'serpentine', 'sleeping'], EL, ['dragon', 'drake', 'fantasy', 'monster', 'wings', 'fire breather', 'lung', 'beast']),
  wyvern: e('createWyvern', 'Wyvern', 'dragons', ['standing', 'swooping', 'crested', 'sea-wyvern', 'barbed'], EL, ['wyvern', 'dragon', 'fantasy', 'flying', 'monster', 'beast']),
  griffin: e('createGriffin', 'Griffin', 'beasts', ['classic', 'perched', 'rearing', 'hippogriff', 'resting'], EL, ['griffin', 'gryphon', 'hippogriff', 'eagle', 'lion', 'fantasy', 'wings', 'beast']),
  unicorn: e('createUnicorn', 'Unicorn', 'beasts', ['standing', 'rearing', 'grazing', 'winged', 'prancing'], [...EL, 'rainbow', 'celestial'], ['unicorn', 'horse', 'pegasus', 'horn', 'fantasy', 'magical', 'mythical']),
  phoenix: e('createPhoenix', 'Phoenix', 'beasts', ['perched', 'rising', 'nesting', 'long-tail', 'roosting'], EL, ['phoenix', 'firebird', 'bird', 'flame', 'fantasy', 'mythical', 'wings']),
  gargoyle: e('createGargoyle', 'Gargoyle', 'statues', ['crouching', 'grinning', 'wings-spread', 'horned-beast', 'waterspout'], EL, ['gargoyle', 'grotesque', 'statue', 'stone', 'cathedral', 'fantasy', 'demon', 'wings']),
  kraken: e('createKraken', 'Kraken', 'sea', ['classic', 'giant-squid', 'octopus', 'colossal', 'ship-wrecker'], [...EL, 'abyssal', 'coral'], ['kraken', 'squid', 'octopus', 'tentacles', 'sea monster', 'leviathan', 'ocean', 'fantasy']),
  'sea-serpent': e('createSeaSerpent', 'Sea Serpent', 'sea', ['arches', 'rearing', 'coiled', 'finned', 'horned'], [...EL, 'abyssal', 'coral'], ['sea serpent', 'sea monster', 'leviathan', 'loch', 'snake', 'ocean', 'dragon', 'fantasy']),
  golem: e('createGolem', 'Golem', 'giants', ['stone-giant', 'brute', 'sentinel', 'rune-pillar', 'clay'], EL, ['golem', 'stone giant', 'rock monster', 'construct', 'elemental', 'fantasy', 'guardian']),
  yeti: e('createYeti', 'Yeti', 'giants', ['standing', 'crouching', 'roaring', 'elder', 'hunter'], EL, ['yeti', 'abominable snowman', 'bigfoot', 'sasquatch', 'snow ape', 'fantasy', 'cryptid']),
  'goblin-statue': e('createGoblinStatue', 'Goblin Statue', 'statues', ['spear-guard', 'lantern-bearer', 'thief', 'shaman', 'drummer'], ['bronze', 'verdigris', 'gold', 'jade', 'obsidian', 'marble', 'terracotta', 'mossy', 'painted', 'crystal', 'iron', 'wood'], ['goblin', 'imp', 'statue', 'figurine', 'garden statue', 'gnome', 'fantasy', 'sculpture'], { color: 'stone colour (base model)' }),
  slime: e('createSlime', 'Slime', 'critters', ['blob', 'king', 'cube', 'twin', 'puddle'], EL, ['slime', 'blob', 'jelly', 'ooze', 'gel', 'monster', 'cute', 'fantasy'], { color: 'gel colour (base model)' }),
  'mushroom-folk': e('createMushroomFolk', 'Mushroom Folk', 'critters', ['toadstool', 'elder', 'puffball', 'tall-cap', 'colony'], EL, ['mushroom', 'toadstool', 'fungus', 'myconid', 'shroom', 'forest spirit', 'cute', 'fantasy'], { color: 'cap colour (base model)' }),
  'alien-critter': e('createAlienCritter', 'Alien Critter', 'critters', ['eye-stalker', 'tripod', 'jelly', 'crawler', 'spore-puff'], EL, ['alien', 'extraterrestrial', 'creature', 'space', 'critter', 'sci-fi', 'monster', 'bug']),
  'robot-companion': e('createRobotCompanion', 'Robot Companion', 'robots', ['rover', 'biped', 'hover', 'spider', 'dog'], ['chrome', 'rusty', 'toy', 'military', 'neon', 'gold', 'arctic', 'stealth', 'retro', 'medic', 'explorer', 'sakura'], ['robot', 'droid', 'bot', 'companion', 'robot dog', 'rover', 'mech', 'sci-fi', 'pet'], { color: 'shell colour (base model)' }),
  treefolk: e('createTreefolk', 'Tree Folk (Ent)', 'giants', ['oak', 'pine', 'willow', 'birch', 'stump', 'blossom'], ['autumn', 'winter', 'spring', 'burning', 'frozen', 'blighted', 'petrified', 'gilded', 'haunted', 'crystal', 'sapling', 'mossy'], ['ent', 'treant', 'tree folk', 'tree spirit', 'walking tree', 'dryad', 'forest guardian', 'fantasy']),
};
