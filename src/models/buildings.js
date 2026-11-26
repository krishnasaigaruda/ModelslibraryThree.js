/*
 * Buildings category: houses, apartments, skyscrapers, shops and civic
 * buildings. Each type lives in its own file under ./buildings/ and shares the
 * kit (textures, batching, windows, doors, roofs, porches…).
 */
export { createHouse, HOUSE_VARIANTS } from './buildings/houses.js';
export { createApartment, APARTMENT_VARIANTS, createSkyscraper, SKYSCRAPER_VARIANTS } from './buildings/towers.js';
export { createShop, SHOP_VARIANTS } from './buildings/shops.js';
export {
  createGarage, GARAGE_VARIANTS, createBarn, BARN_VARIANTS, createChurch, CHURCH_VARIANTS,
  createSchool, SCHOOL_VARIANTS, createFireStation, FIRE_STATION_VARIANTS, createHospital, HOSPITAL_VARIANTS,
  createWarehouse, WAREHOUSE_VARIANTS, createLighthouse, LIGHTHOUSE_VARIANTS, createWindmill, WINDMILL_VARIANTS,
  createTent, TENT_VARIANTS,
} from './buildings/civic.js';
export {
  createHotel, HOTEL_VARIANTS, createOffice, OFFICE_VARIANTS, createBank, BANK_VARIANTS, createPoliceStation, POLICE_VARIANTS,
  createRestaurant, RESTAURANT_VARIANTS, createSupermarket, SUPERMARKET_VARIANTS, createGasStation, GAS_STATION_VARIANTS,
} from './buildings/city.js';
export {
  createMuseum, MUSEUM_VARIANTS, createCivicHall, CIVIC_HALL_VARIANTS, createCastle, CASTLE_VARIANTS, createTemple, TEMPLE_VARIANTS,
  createStadium, STADIUM_VARIANTS, createTrainStation, TRAIN_STATION_VARIANTS, createAirport, AIRPORT_VARIANTS, createParkingGarage, PARKING_VARIANTS,
} from './buildings/landmarks.js';
export {
  createFactory, FACTORY_VARIANTS, createPowerPlant, POWER_PLANT_VARIANTS, createBridge, BRIDGE_VARIANTS, createTunnel, TUNNEL_VARIANTS,
  createSilo, SILO_VARIANTS, createGreenhouse, GREENHOUSE_VARIANTS, createShed, SHED_VARIANTS, createTreehouse, TREEHOUSE_VARIANTS,
} from './buildings/infra.js';
