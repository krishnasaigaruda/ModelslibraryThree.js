// Catalog entries for the 'sports' category (module 'sports', src/models/sports.js + src/models/sports/*).
// trims: extra versions of every variant, named "<variant>-<trim>" (or {variant: [trims]}).
const STD = ['pro', 'retro', 'kids', 'neon', 'worn', 'stealth', 'team-crimson', 'team-navy', 'team-emerald', 'champion'];
const e = (factory, label, sub, variants, trims = STD, options = { color: 'main colour (base model)' }) => ({ category: 'sports', sub, source: 'js', module: 'sports', factory, label, variants, trims, options });

export default {
  'sports-ball': e('createSportsBall', 'Sports Ball', 'balls',
    ['soccer', 'basketball', 'volleyball', 'tennis', 'baseball', 'softball', 'american-football', 'rugby', 'golf', 'bowling', 'cricket', 'pool-ball', 'water-polo', 'handball'],
    [...STD, 'set']),
  racket: e('createRacket', 'Racket & Paddle', 'rackets', ['tennis', 'badminton', 'squash', 'racquetball', 'padel', 'table-tennis', 'pickleball']),
  'sports-bat': e('createSportsBat', 'Bat', 'rackets', ['baseball-wood', 'baseball-alloy', 'softball', 't-ball', 'rounders', 'cricket']),
  'sports-stick': e('createSportsStick', 'Stick & Mallet', 'rackets', ['ice-hockey', 'field-hockey', 'lacrosse', 'hurling', 'polo-mallet', 'croquet-mallet', 'pool-cue', 'floorball']),
  'golf-club': e('createGolfClub', 'Golf Club & Bag', 'rackets', ['driver', 'fairway-wood', 'hybrid', 'iron', 'wedge', 'putter', 'golf-bag']),
  'sports-goal': e('createSportsGoal', 'Goal', 'goals', ['soccer', 'futsal', 'ice-hockey', 'handball', 'lacrosse', 'field-hockey', 'rugby-posts']),
  'basketball-hoop': e('createBasketballHoop', 'Basketball Hoop', 'goals', ['in-ground', 'portable', 'wall-mount', 'arena', 'street']),
  'sports-net': e('createSportsNet', 'Court Net & Table', 'goals', ['tennis', 'volleyball', 'badminton', 'pickleball', 'beach-volleyball', 'table-tennis']),
  'free-weight': e('createFreeWeight', 'Free Weight', 'gym', ['dumbbell', 'hex-dumbbell', 'kettlebell', 'barbell', 'plate-tree', 'medicine-ball']),
  'gym-machine': e('createGymMachine', 'Gym Machine', 'gym', ['weight-bench', 'squat-rack', 'treadmill', 'exercise-bike', 'rowing-machine']),
  'fitness-gear': e('createFitnessGear', 'Fitness Gear', 'gym', ['yoga-mat', 'punching-bag', 'foam-roller', 'exercise-ball', 'plyo-box']),
  'board-sport': e('createBoardSport', 'Skate, Surf & Snow', 'boards', ['skateboard', 'longboard', 'surfboard', 'longboard-surf', 'snowboard', 'skis']),
  'sports-helmet': e('createSportsHelmet', 'Sports Helmet', 'gear', ['american-football', 'bike', 'hockey', 'batting', 'ski']),
  'sports-glove': e('createSportsGlove', 'Sports Glove', 'gear', ['baseball-mitt', 'boxing-glove', 'goalkeeper-glove']),
  'training-gear': e('createTrainingGear', 'Training Gear', 'gear', ['cone', 'hurdle', 'starting-blocks', 'agility-ladder']),
  trophy: e('createTrophy', 'Trophy & Medals', 'venue', ['cup', 'figure', 'star', 'medal-display', 'shield']),
  scoreboard: e('createScoreboard', 'Scoreboard', 'venue', ['digital', 'flip-card', 'stadium']),
  bleachers: e('createBleachers', 'Bleachers', 'venue', ['aluminium', 'wooden', 'stadium-seats']),
  'ball-machine': e('createBallMachine', 'Ball Machine', 'venue', ['tennis', 'pitching']),
};
