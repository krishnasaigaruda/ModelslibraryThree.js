/*
 * Furniture & interiors category. Each group lives in its own file under
 * ./furniture/ and is re-exported here so `import('three-premade/furniture')`
 * (or the dynamic import in index.js) gets everything in one chunk.
 *
 * Every factory is wrapped with styled(): pass `trim` (e.g. 'mid-century',
 * 'industrial', 'black-steel', 'terracotta') for a restyled version with
 * different legs, handles, fronts, upholstery, finishes and proportions.
 */
import { styled } from './furniture/styles.js';
import * as seating from './furniture/seating.js';
import * as tables from './furniture/tables.js';
import * as bedroom from './furniture/bedroom.js';
import * as lighting from './furniture/lighting.js';
import * as kitchen from './furniture/kitchen.js';
import * as bathroom from './furniture/bathroom.js';
import * as decor from './furniture/decor.js';
import * as office from './furniture/office.js';
export { createTech, TECH_VARIANTS } from './furniture/tech.js';
import * as home from './furniture/home.js';

export { STYLES, FURNITURE_STYLES, APPLIANCE_FINISHES, DECOR_STYLES } from './furniture/styles.js';

export const createChair = styled(seating.createChair, 'chair');
export const createSofa = styled(seating.createSofa, 'sofa');
export const createTable = styled(tables.createTable, 'table');
export const createDesk = styled(tables.createDesk, 'desk');
export const createBed = styled(bedroom.createBed, 'bed');
export const createWardrobe = styled(bedroom.createWardrobe, 'wardrobe');
export const createCabinet = styled(bedroom.createCabinet, 'cabinet');
export const createBookshelf = styled(bedroom.createBookshelf, 'bookshelf');
export const createLamp = styled(lighting.createLamp, 'lamp');
export const createFan = styled(lighting.createFan, 'fan');
export const createTV = styled(lighting.createTV, 'tv');
export const createKitchen = styled(kitchen.createKitchen, 'kitchen');
export const createAppliance = styled(kitchen.createAppliance, 'appliance');
export const createBathroom = styled(bathroom.createBathroom, 'bathroom');
export const createPlant = styled(decor.createPlant, 'plant');
export const createVase = styled(decor.createVase, 'vase');
export const createRug = styled(decor.createRug, 'rug');
export const createMirror = styled(decor.createMirror, 'mirror');
export const createClock = styled(decor.createClock, 'clock');
export const createFrame = styled(decor.createFrame, 'frame');
export const createOffice = styled(office.createOffice, 'office-equipment');

export const { CHAIR_VARIANTS, SOFA_VARIANTS } = seating;
export const { TABLE_VARIANTS, DESK_VARIANTS } = tables;
export const { BED_VARIANTS, WARDROBE_VARIANTS, CABINET_VARIANTS, BOOKSHELF_VARIANTS } = bedroom;
export const { LAMP_VARIANTS, FAN_VARIANTS, TV_VARIANTS } = lighting;
export const { KITCHEN_VARIANTS, APPLIANCE_VARIANTS } = kitchen;
export const { BATHROOM_VARIANTS } = bathroom;
export const { PLANT_VARIANTS, VASE_VARIANTS, RUG_VARIANTS, MIRROR_VARIANTS, CLOCK_VARIANTS, FRAME_VARIANTS } = decor;
export const { OFFICE_VARIANTS } = office;

export const createOttoman = styled(home.createOttoman, 'ottoman');
export const createBench = styled(home.createBench, 'indoor-bench');
export const createStool = styled(home.createStool, 'stool');
export const createPiano = styled(home.createPiano, 'piano');
export const createFireplace = styled(home.createFireplace, 'fireplace');
export const createRack = styled(home.createRack, 'rack');
export const createCurtains = styled(home.createCurtains, 'curtains');
export const createOutdoor = styled(home.createOutdoor, 'outdoor');
export const createSmallAppliance = styled(home.createSmallAppliance, 'small-appliance');
export const createKitchenware = styled(home.createKitchenware, 'kitchenware');
export const createBathItem = styled(home.createBathItem, 'bath-item');
export const createDecorItem = styled(home.createDecorItem, 'decor-item');
export const {
  OTTOMAN_VARIANTS, BENCH_VARIANTS, STOOL_VARIANTS, PIANO_VARIANTS, FIREPLACE_VARIANTS, RACK_VARIANTS, CURTAIN_VARIANTS,
  OUTDOOR_VARIANTS, SMALL_APPLIANCE_VARIANTS, KITCHENWARE_VARIANTS, BATH_ITEM_VARIANTS, DECOR_ITEM_VARIANTS,
} = home;
