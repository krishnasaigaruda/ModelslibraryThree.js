# three-premade — Model Catalog

31557 models in 747 types. Every model is original, built by this project, and free to use (MIT).

> Interactive version: open `docs/index.html` (see README → "Viewing the models").

```js
import { createObject, createAnimator } from 'three-premade';

const car = await createObject('car', { variant: 'suv', color: 'red' });
scene.add(car);

const anim = createAnimator(car);
anim.play('drive');
anim.play('lights');
// in your render loop: anim.update(clock.getDelta());
```

## Contents

- [Vehicles](#vehicles) — [Car](#car), [Van](#van), [Truck](#truck), [Construction machine](#construction), [Semi-trailer](#trailer), [Farm machine](#farm), [Industrial vehicle](#industrial), [Bus](#bus), [Motorcycle](#motorcycle), [Bicycle](#bicycle), [Helicopter](#helicopter), [Airplane](#airplane), [Boat](#boat), [Train](#train), [Small vehicle](#misc-vehicle), [Bicycle (HD)](#hd-bicycle), [Kick scooter (HD)](#hd-kick-scooter)
- [Furniture](#furniture) — [Chair](#chair), [Sofa](#sofa), [Table](#table), [Desk](#desk), [Bed](#bed), [Wardrobe](#wardrobe), [Cabinet](#cabinet), [Bookshelf](#bookshelf), [Lamp](#lamp), [Fan](#fan), [Kitchen](#kitchen), [Bathroom](#bathroom), [Plant](#plant), [Vase](#vase), [Rug](#rug), [Mirror](#mirror), [Clock](#clock), [Picture frame](#frame), [Office](#office-equipment), [Ottoman](#ottoman), [Indoor bench](#indoor-bench), [Stool](#stool), [Piano](#piano), [Fireplace](#fireplace), [Rack & storage](#rack), [Curtains & blinds](#curtains), [Outdoor](#outdoor), [Kitchenware](#kitchenware), [Bath accessory](#bath-item), [Decor item](#decor-item), [Armchair (HD)](#hd-armchair), [Bar stool (HD)](#hd-bar-stool), [Bean bag (HD)](#hd-bean-bag), [Bed (HD)](#hd-bed), [Bookshelf (HD)](#hd-bookshelf), [Bottle (HD)](#hd-bottle), [Bowl (HD)](#hd-bowl), [Coffee maker (HD)](#hd-coffee-maker), [Cooking pot (HD)](#hd-cookpot), [Curtains (HD)](#hd-curtains), [Cushion set (HD)](#hd-cushion-set), [Cutting board (HD)](#hd-cutting-board), [Desk (HD)](#hd-desk), [Dining chair (HD)](#hd-dining-chair), [Dresser & cabinet (HD)](#hd-dresser), [Floor lamp (HD)](#hd-floor-lamp), [Glassware (HD)](#hd-glassware), [Jar set (HD)](#hd-jar-set), [Kettle (HD)](#hd-kettle), [Knife block (HD)](#hd-knife-block), [Lamp (HD)](#hd-lamp), [Mirror (HD)](#hd-mirror), [Mug (HD)](#hd-mug), [Office chair (HD)](#hd-office-chair), [Pendant lamp (HD)](#hd-pendant-lamp), [Picture frame (HD)](#hd-picture-frame), [Potted plant (HD)](#hd-plant), [Plate & bowl (HD)](#hd-plate), [Rug (HD)](#hd-rug), [Sofa (HD)](#hd-sofa), [Stand mixer (HD)](#hd-stand-mixer), [Table (HD)](#hd-table), [Teapot (HD)](#hd-teapot), [Throw blanket (HD)](#hd-throw-blanket), [Toaster (HD)](#hd-toaster), [TV stand (HD)](#hd-tv-stand), [Vase (HD)](#hd-vase), [Wardrobe (HD)](#hd-wardrobe)
- [Electronics](#electronics) — [TV](#tv), [Appliance](#appliance), [Small appliance](#small-appliance), [CCTV camera](#cctv), [Laptop](#laptop), [Desktop PC Set](#desktop-pc), [Monitor](#monitor), [Computer Keyboard](#computer-keyboard), [Mouse & Trackpad](#computer-mouse), [Printer](#printer), [Wi-Fi Router](#wifi-router), [Retro Computer](#retro-computer), [Smartphone](#smartphone), [Tablet](#tablet), [E-Reader](#e-reader), [Smartwatch & Band](#smartwatch), [Wireless Earbuds](#wireless-earbuds), [Wireless Headphones](#wireless-headphones), [Camera](#digital-camera), [Smart Speaker & Display](#smart-speaker), [Game Controller](#game-controller), [Game Console](#game-console), [VR Headset & Smart Glasses](#vr-headset), [Streaming & Projector](#media-device), [Power & Storage](#power-accessory), [Smart Home Gadget](#smart-home), [Speaker](#music-speaker), [Records & Players](#vinyl-player), [Circuit Board](#tech-circuit-board), [Robot Arm](#tech-robot-arm), [Humanoid Robot](#tech-humanoid), [Drone](#tech-drone), [3D Printer](#tech-3d-printer), [Server Rack](#tech-server-rack), [Extension Cord & Plug](#extension-cord), [Remote Control](#remote-control), [Camera (HD)](#hd-camera), [Headphones (HD)](#hd-headphones), [Laptop (HD)](#hd-laptop), [Monitor (HD)](#hd-monitor), [Smartphone (HD)](#hd-smartphone), [Speaker (HD)](#hd-speaker), [TV (HD)](#hd-tv)
- [Buildings](#buildings) — [House](#house), [Apartment](#apartment), [Skyscraper](#skyscraper), [Shop](#shop), [Garage](#garage), [Barn](#barn), [Church](#church), [School](#school), [Fire station](#fire-station), [Hospital](#hospital), [Warehouse](#warehouse), [Lighthouse](#lighthouse), [Windmill](#windmill), [Tent](#tent), [Hotel](#hotel), [Office](#office), [Bank](#bank), [Police Station](#police-station), [Restaurant](#restaurant), [Supermarket & Mall](#supermarket), [Gas Station](#gas-station), [Museum & Library](#museum), [City Hall & Courthouse](#civic-hall), [Castle & Palace](#castle), [Temple, Mosque & Cathedral](#temple), [Stadium](#stadium), [Train Station](#train-station), [Airport](#airport), [Parking Garage](#parking-garage), [Factory](#factory), [Power Plant](#power-plant), [Bridge](#bridge), [Tunnel Portal](#tunnel), [Silo & Water Tower](#silo), [Greenhouse](#greenhouse), [Shed](#shed), [Treehouse](#treehouse), [Bus shelter (HD)](#hd-bus-shelter), [Garden shed (HD)](#hd-shed)
- [Nature](#nature) — [Tree](#tree), [Cactus](#cactus), [Succulent](#succulent), [Bush](#bush), [Hedge](#hedge), [Flower](#flower), [Grass](#grass), [Crop](#crop), [Water plant](#water-plant), [Reef](#reef), [Vine](#vine), [Rock](#rock), [Mushroom](#mushroom), [Log & stump](#log), [Terrain](#terrain), [Bush (HD)](#hd-bush), [Cliff piece (HD)](#hd-cliff), [Firewood stack (HD)](#hd-firewood), [Flowers in pot (HD)](#hd-flower-pot), [Grass clump (HD)](#hd-grass-clump), [Log (HD)](#hd-log), [Mushrooms (HD)](#hd-mushroom), [Rock (HD)](#hd-rock), [Rock cluster (HD)](#hd-rock-group), [Tree stump (HD)](#hd-stump)
- [Street](#street) — [Streetlight](#streetlight), [Traffic light](#traffic-light), [Road sign](#sign), [Bench](#bench), [Trash can](#trash-can), [Planter](#planter), [Fountain](#fountain), [Bike rack](#bike-rack), [Picnic table](#picnic-table), [Drinking fountain](#drinking-fountain), [Fire hydrant](#fire-hydrant), [Mailbox](#mailbox), [Parking meter](#parking-meter), [Phone booth](#phone-booth), [Vending machine](#vending-machine), [Newspaper box](#newspaper-box), [ATM](#atm), [EV charger](#ev-charger), [Bollard](#bollard), [Traffic cone](#traffic-cone), [Barrier](#barrier), [Bus stop](#bus-stop), [Guard rail](#guard-rail), [Fence](#fence), [Road](#road), [Road kit (12 m tiles)](#road-kit), [Pallet](#pallet), [Crate](#crate), [Barrel](#barrel), [Dumpster](#dumpster), [Portable toilet](#porta-potty), [Sandbags](#sandbags), [Cable drum](#cable-drum), [Scaffolding](#scaffolding), [Swing set](#swing), [Slide](#slide), [Seesaw](#seesaw), [Climbing frame](#climbing-frame), [Sandbox](#sandbox), [Merry-go-round](#merry-go-round), [Market stall](#market-stall), [Kiosk](#kiosk), [Food cart](#food-cart), [Patio umbrella](#umbrella), [Fuel pump](#gas-pump), [Billboard](#billboard), [Manhole](#manhole), [Storm drain](#storm-drain), [Speed bump](#speed-bump), [Utility pole](#power-pole), [Utility cabinet](#utility-box), [Rail crossing](#rail-crossing), [Street clock](#street-clock), [Flag pole](#flag-pole), [Monument](#monument), [Jet bridge](#jet-bridge), [Baggage carousel](#baggage-carousel), [Check-in desk](#check-in-desk), [Gate seating](#gate-seating), [Departures board](#departure-board), [Security scanner](#security-scanner), [Windsock](#windsock), [Runway light](#runway-light), [Airfield sign](#airfield-sign), [Baggage cart](#baggage-cart), [Barrel (HD)](#hd-barrel), [Bench (HD)](#hd-bench), [Bike rack (HD)](#hd-bike-rack), [Bollard (HD)](#hd-bollard), [Wooden crate (HD)](#hd-crate), [Fence (HD)](#hd-fence), [Fire hydrant (HD)](#hd-fire-hydrant), [Garden gnome (HD)](#hd-garden-gnome), [Lamppost (HD)](#hd-lamppost), [Mailbox (HD)](#hd-mailbox), [Manhole cover (HD)](#hd-manhole), [Pallet (HD)](#hd-pallet), [Picnic table (HD)](#hd-picnic-table), [Planter (HD)](#hd-planter), [Traffic cone (HD)](#hd-traffic-cone), [Trash can (HD)](#hd-trash-can), [Wheelbarrow (HD)](#hd-wheelbarrow)
- [People](#people) — [Person](#person), [Artist mannequin (HD)](#hd-artist-mannequin), [Dress form (HD)](#hd-dress-form)
- [Animals](#animals) — [Dog](#dog), [Cat](#cat), [Horse](#horse), [Donkey & Zebra](#donkey-zebra), [Cattle](#cattle), [Pig](#pig), [Sheep & Goat](#sheep-goat), [Camel & Llama](#camel), [Deer & Antelope](#deer), [Big Cat](#big-cat), [Wolf & Fox](#wild-canine), [Bear](#bear), [Elephant](#elephant), [Giraffe](#giraffe), [Rhino & Hippo](#rhino-hippo), [Small Mammal](#small-mammal), [Bird](#bird), [Poultry](#poultry), [Water Bird](#water-bird), [Bird of Prey](#bird-of-prey), [Fish](#fish), [Shark](#shark), [Whale, Dolphin & Seal](#sea-mammal), [Reptile](#reptile), [Amphibian](#amphibian), [Insect](#insect), [Spider, Crab & Sea Creature](#invertebrate), [Bird (HD)](#hd-bird), [Cat figurine (HD)](#hd-cat-figurine), [Goldfish bowl (HD)](#hd-fishbowl)
- [Food](#food) — [Vegetable](#vegetable), [Bread](#bread), [Pastry](#pastry), [Donut](#donut), [Muffin](#muffin), [Cupcake](#cupcake), [Cake](#cake), [Pie](#pie), [Cookie](#cookie), [Pizza](#pizza), [Burger](#burger), [Hot dog](#hotdog), [Sandwich](#sandwich), [Taco](#taco), [Burrito](#burrito), [Sushi](#sushi), [Ramen](#ramen), [Pasta](#pasta), [Salad](#salad), [Steak](#steak), [Fried chicken](#chicken), [Fries](#fries), [Breakfast](#breakfast), [Pancakes](#pancakes), [Soup](#soup), [Coffee](#coffee), [Tea](#tea), [Soda can](#can), [Bottle](#bottle), [Glass](#glass), [Jug](#jug), [Carton](#carton), [Cereal](#cereal), [Jar](#jar), [Tin](#tin), [Eggs](#eggs), [Cheese](#cheese), [Butter](#butter), [Chocolate](#chocolate), [Candy](#candy), [Ice cream](#ice-cream), [Popsicle](#popsicle), [Fruit](#fruit), [Bread (HD)](#hd-bread), [Cake (HD)](#hd-cake), [Coffee cup (HD)](#hd-coffee-cup), [Croissants (HD)](#hd-croissants), [Fruit bowl (HD)](#hd-fruit-bowl)
- [Fashion](#fashion) — [Garment](#hanging-garment), [Clothes Rail](#clothes-rail), [Dress Form](#dress-form), [Mannequin](#mannequin), [Folded Clothes Table](#folded-stack), [Shoes](#shoe), [Bag](#bag), [Hat](#hat), [Sunglasses](#sunglasses), [Watch](#watch), [Jewellery](#jewellery), [Belt](#belt), [Tie & Bow Tie](#necktie), [Store Fixture](#store-fixture), [Handbag (HD)](#hd-handbag), [Hat (HD)](#hd-hat), [Sneakers (HD)](#hd-sneakers), [Sunglasses (HD)](#hd-sunglasses)
- [Music](#music) — [Guitar & Fretted](#guitar), [Violin Family](#bowed), [Piano](#concert-piano), [Keyboard & Organ](#keyboard), [Drums](#drum-set), [Percussion & Harp](#percussion), [Brass](#brass), [Woodwind](#woodwind), [Microphone](#microphone), [Amplifier](#guitar-amp), [Mixing Desk](#mixing-desk), [DJ Gear](#dj-gear), [Headphones](#headphones), [Music Stand](#music-stand), [Stage Light](#stage-light), [Acoustic guitar (HD)](#hd-acoustic-guitar), [Drum (HD)](#hd-drum), [Microphone (HD)](#hd-microphone)
- [Sports](#sports) — [Sports Ball](#sports-ball), [Racket & Paddle](#racket), [Bat](#sports-bat), [Stick & Mallet](#sports-stick), [Golf Club & Bag](#golf-club), [Goal](#sports-goal), [Basketball Hoop](#basketball-hoop), [Court Net & Table](#sports-net), [Free Weight](#free-weight), [Gym Machine](#gym-machine), [Fitness Gear](#fitness-gear), [Skate, Surf & Snow](#board-sport), [Sports Helmet](#sports-helmet), [Sports Glove](#sports-glove), [Training Gear](#training-gear), [Trophy & Medals](#trophy), [Scoreboard](#scoreboard), [Bleachers](#bleachers), [Ball Machine](#ball-machine), [Dumbbells (HD)](#hd-dumbbell), [Skateboard (HD)](#hd-skateboard), [Sports ball (HD)](#hd-sports-ball)
- [Science](#science) — [Beaker & Cylinder](#lab-beaker), [Lab Flask](#lab-flask), [Test Tubes & Rack](#lab-tube-rack), [Burette, Pipette & Stand](#lab-stand), [Bunsen Burner & Lamp](#lab-burner), [Microscope](#lab-microscope), [Centrifuge](#lab-centrifuge), [Petri Dish](#lab-petri), [Lab Bench](#lab-bench), [Fume Hood](#lab-fume-hood), [Safety Goggles & Shield](#lab-goggles), [Rocket & Launch Pad](#space-rocket), [Satellite](#space-satellite), [Space Capsule & Lander](#space-capsule), [Space Rover](#space-rover), [Telescope & Observatory](#space-telescope), [Planet Globe & Orrery](#space-planet-globe), [Astronaut Helmet & Suit](#space-helmet), [Solar Panels](#energy-solar), [Wind Turbine](#energy-wind), [Battery](#energy-battery), [Molecule Model](#edu-molecule), [Anatomical Skeleton](#edu-skeleton), [Globe](#edu-globe), [Periodic Table Board](#edu-periodic-table), [Chalkboard & Whiteboard](#edu-chalkboard), [Magnifying Glass](#edu-magnifier), [Compass](#edu-compass), [Weather Station](#edu-weather-station), [Globe (HD)](#hd-globe), [Lab glassware (HD)](#hd-lab-glassware), [Microscope (HD)](#hd-microscope)
- [Art](#art) — [Bust](#bust), [Figure Statue](#figure-statue), [Abstract Sculpture](#abstract-sculpture), [Low-Poly Art](#low-poly-art), [Kinetic Sculpture](#kinetic-sculpture), [Totem](#totem), [Garden Sculpture](#garden-sculpture), [Framed Painting](#painting), [Easel & Canvas](#easel), [Art Supplies](#art-supplies), [Pottery Wheel](#pottery-wheel), [Ceramic Vase](#ceramic-vase), [Gallery Pedestal](#gallery-pedestal), [Gallery Bench](#gallery-bench), [Wall Installation](#wall-installation), [Neon Sign Art](#neon-sign), [Mosaic Panel](#art-mosaic), [Stained Glass Panel](#stained-glass), [Easel with canvas (HD)](#hd-easel), [Sculpture (HD)](#hd-sculpture)
- [Creatures](#creatures) — [Dragon](#dragon), [Wyvern](#wyvern), [Griffin](#griffin), [Unicorn](#unicorn), [Phoenix](#phoenix), [Gargoyle](#gargoyle), [Kraken](#kraken), [Sea Serpent](#sea-serpent), [Golem](#golem), [Yeti](#yeti), [Goblin Statue](#goblin-statue), [Slime](#slime), [Mushroom Folk](#mushroom-folk), [Alien Critter](#alien-critter), [Robot Companion](#robot-companion), [Tree Folk (Ent)](#treefolk), [Dragon egg (HD)](#hd-dragon-egg), [Dragon statue (HD)](#hd-dragon-statue), [Gargoyle (HD)](#hd-gargoyle)
- [History](#history) — [Classical Column](#classical-column), [Temple & Pediment](#temple-piece), [Obelisk](#obelisk), [Sarcophagus](#sarcophagus), [Pyramid](#pyramid), [Roman Arch](#roman-arch), [Mosaic Floor](#ancient-mosaic), [Castle Wall](#castle-wall), [Castle Tower](#castle-tower), [Castle Gate](#castle-gate), [Village Well](#stone-well), [Medieval Cart](#medieval-cart), [Heraldic Banner](#heraldic-banner), [Throne](#throne), [Treasure Chest](#treasure-chest), [Amphora & Greek Vase](#amphora), [Ancient Pottery](#ancient-pottery), [Ancient Coins](#ancient-coin), [Scroll & Tablet](#scroll), [Oil Lamp](#oil-lamp), [Hourglass](#hourglass), [Sundial](#ancient-sundial), [Map Table](#map-table), [Ancient Ruins](#ancient-ruins), [Amphora (HD)](#hd-amphora), [Classical column (HD)](#hd-column), [Treasure chest (HD)](#hd-treasure-chest)
- [Places](#places) — [Gazebo](#gazebo), [Picnic pavilion](#pavilion), [Pergola](#pergola), [Bandstand](#bandstand), [Park gate](#park-gate), [Footbridge](#footbridge), [Boardwalk](#boardwalk), [Public restroom](#restroom), [Ranger station](#ranger-station), [Information board](#info-board), [Park sign](#park-sign), [Drinking fountain (park)](#water-point), [Pond](#pond), [Fountain plaza](#plaza-fountain), [Flower bed](#flower-bed), [Rose arch](#rose-arch), [Hedge maze section](#hedge-maze), [Rock garden](#zen-garden), [Community garden plots](#garden-plots), [Dog park](#dog-park), [Skate park piece](#skate-ramp), [Outdoor gym station](#outdoor-gym), [Picnic area set](#picnic-set), [BBQ grill](#bbq-grill), [Game table](#game-table), [Bird bath](#bird-bath), [Statue on plinth](#statue), [Memorial](#memorial), [Sundial](#sundial), [Lamp-lined park path](#park-path), [Stepping-stone path](#stepping-stones), [Playground piece](#playground), [Park scene](#park-scene), [Campsite](#campsite), [Beach set](#beach-set), [Fountain (HD)](#hd-fountain), [Gazebo (HD)](#hd-gazebo), [Pergola (HD)](#hd-pergola), [Wishing well (HD)](#hd-well)
- [Toys](#toys) — [Building Blocks](#toy-blocks), [Wooden Train Set](#toy-train), [Baby & Wooden Toy](#baby-toy), [Plush Animal](#plush-toy), [Doll](#toy-doll), [Dollhouse](#dollhouse), [Toy Car & Truck](#toy-car), [RC Car](#rc-car), [Yo-Yo](#yo-yo), [Spinning Top](#spinning-top), [Jack-in-the-Box](#jack-in-the-box), [Board Game](#board-game), [Playing Cards](#playing-cards), [Dice Set](#dice-set), [Dominoes](#dominoes), [Jigsaw Puzzle](#jigsaw-puzzle), [Twisty Cube Puzzle](#puzzle-cube), [Arcade Cabinet](#arcade-cabinet), [Pinball Machine](#pinball-machine), [Claw & Capsule Machine](#claw-machine), [Toy Chest](#toy-chest), [Kite](#kite), [Balloons](#balloons), [Beach Ball](#beach-ball), [Sandbox Toys](#sandbox-toys), [Bubble Wand](#bubble-wand), [Rocking horse (HD)](#hd-rocking-horse), [Spinning top (HD)](#hd-spinning-top), [Teddy bear (HD)](#hd-teddy-bear), [Toy blocks (HD)](#hd-toy-blocks)
- [Tools](#tools) — [Hammer](#hammer), [Screwdriver](#screwdriver), [Wrench & Spanner](#wrench), [Pliers](#pliers), [Hand Saw](#saw), [Chisel & Plane](#chisel), [Spirit Level](#level), [Measuring Tool](#measuring-tool), [Axe & Pick](#tool-axe), [Drill & Driver](#drill), [Power Saw](#shop-saw), [Sander & Planer](#shop-sander), [Grinder & Polisher](#shop-grinder), [Router & Multitool](#shop-router), [Workbench](#workbench), [Toolbox](#tool-chest), [Pegboard](#pegboard), [Vise & Clamp](#vise-clamp), [Ladder](#ladder), [Sawhorse](#sawhorse), [Air Compressor](#air-compressor), [Welding & Torch](#welding), [Garden Tool](#garden-tool), [Garden Hand Tool](#garden-hand-tool), [Wheelbarrow & Cart](#garden-wheelbarrow), [Watering Can](#garden-watering-can), [Shears & Pruners](#garden-shears), [Lawn Mower](#lawn-mower), [Drum & Barrel](#industrial-barrel), [Crate & Pallet](#industrial-crate), [Pipe Section](#industrial-pipe), [Valve](#industrial-valve), [Gears & Drives](#industrial-gear), [Conveyor](#conveyor), [Generator](#generator), [Hammer (HD)](#hd-hammer), [Screwdriver (HD)](#hd-screwdriver), [Toolbox (HD)](#hd-toolbox), [Wrench (HD)](#hd-wrench)
- [Military](#military) — [Military tent](#military-tent), [Camouflage netting](#camo-net), [Sandbag wall](#sandbag-wall), [Hesco barrier](#hesco-barrier), [Military crate](#military-crate), [Jerry can](#jerry-can), [Oil drum](#oil-drum), [Field radio](#field-radio), [Field generator](#field-generator), [Watch tower](#watch-tower), [Barrier & gate](#barrier-gate), [Barbed wire](#barbed-wire), [First-aid station](#first-aid-station), [Sword](#sword), [Dagger](#dagger), [Axe](#axe), [Mace & war hammer](#mace), [Polearm](#polearm), [Shield](#shield), [Helmet](#helmet), [Suit of armour](#armour-suit), [Weapon rack](#weapon-rack), [Training dummy](#training-dummy), [Bow](#bow), [Tank](#tank), [Armoured personnel carrier](#apc), [Military truck](#military-truck), [Military utility 4x4](#utility-4x4), [Bridge layer](#bridge-layer), [Field radar trailer](#radar-trailer), [Supply crate (HD)](#hd-ammo-crate), [Helmet on stand (HD)](#hd-helmet), [Shield on stand (HD)](#hd-shield), [Sword on display (HD)](#hd-sword-display)
- [Items](#items) — [Bean Bag](#bean-bag), [Pillow & Cushion](#pillow), [Blanket & Quilt](#blanket), [Towel](#towel), [Laundry](#laundry), [Cleaning Supplies](#cleaning), [Step Stool & Ladder](#step-stool), [Umbrella](#rain-umbrella), [Toilet Paper](#toilet-paper), [Tissue Box](#tissue-box), [Candle & Matches](#candle), [Light Bulb](#light-bulb), [Battery](#battery), [Alarm Clock](#alarm-clock), [Wall Hook](#wall-hook), [Backpack](#backpack), [Handbag & Purse](#handbag), [Wallet](#wallet), [Phone Case](#phone-case), [Keys & Keyring](#keys), [Tag, Label & Badge](#tag), [Sunglasses & Glasses](#eyewear), [Watch](#wristwatch), [Jewelry](#jewelry), [Toiletries](#toiletries), [Beauty & Makeup](#beauty), [Pen & Marker](#pen), [Pencil](#pencil), [Stationery & Desk Supplies](#stationery), [Notebook & Folder](#notebook), [Mail & Post](#mail), [Calculator](#calculator), [Globe](#globe), [Lunchbox](#lunchbox), [Water Bottle & Flask](#water-bottle), [Books & Reading](#books), [Tickets & Paper Goods](#ticket), [Kitchen Utensil](#kitchen-utensil), [Cutlery](#cutlery), [Oven Mitt & Kitchen Linen](#kitchen-linen), [Kitchen Gadget & Jar](#kitchen-gadget), [Gift Box & Present](#gift-box), [Party Supplies](#party-supplies), [Award & Trophy Cup](#award), [Money & Cards](#money), [Garden Tools](#gardening), [Garden Hose](#garden-hose), [Watering Can](#watering-can), [Wheelbarrow & Cart](#wheelbarrow), [Flower Pot](#flower-pot), [Bird Feeder & Birdhouse](#bird-feeder), [Padlock & Lock](#padlock), [Rope & Chain](#rope-and-chain), [Toolbox](#toolbox), [Flashlight & Lantern](#flashlight), [Cooler Box](#cooler), [Camping Gear](#camping-gear), [Shopping Cart & Basket](#shopping-cart), [Shopping Bag](#shopping-bag), [Cardboard Box](#cardboard-box), [Suitcase & Luggage](#suitcase), [Backpack (HD)](#hd-backpack), [Bucket (HD)](#hd-bucket), [Cardboard boxes (HD)](#hd-cardboard-boxes), [Suitcase (HD)](#hd-suitcase), [Umbrella (HD)](#hd-umbrella), [Watering can (HD)](#hd-watering-can)
- [Maps](#maps) — [City map](#map-city), [Suburb map](#map-suburb), [Village map](#map-village), [Farm map](#map-farm), [Forest map](#map-forest), [Desert map](#map-desert), [Island map](#map-island), [Mountain map](#map-mountain), [Beach map](#map-beach), [Harbor map](#map-harbor), [Industrial zone map](#map-industrial), [Airport map](#map-airport), [Military base map](#map-military), [Racetrack map](#map-racetrack), [Stadium district map](#map-stadium), [Park map](#map-park), [Campsite map](#map-campsite), [Medieval town map](#map-medieval), [Ancient site map](#map-ancient), [Sci-fi colony map](#map-scifi), [Fantasy realm map](#map-fantasy), [Swamp map](#map-swamp), [Highway map](#map-highway), [Railway map](#map-railway), [Arctic map](#map-arctic), [Theme park map](#map-themepark), [Campus map](#map-campus)


## Vehicles

### Car <a id="car"></a>

`createObject('car', { variant: 'sedan' })` · 30 versions · procedural JS

<table>
<tr><td align="center"><img src="images/car-sedan.webp" width="200" alt="car sedan"><br><sub><b>sedan</b></sub></td><td align="center"><img src="images/car-hatchback.webp" width="200" alt="car hatchback"><br><sub><b>hatchback</b></sub></td><td align="center"><img src="images/car-wagon.webp" width="200" alt="car wagon"><br><sub><b>wagon</b></sub></td><td align="center"><img src="images/car-coupe.webp" width="200" alt="car coupe"><br><sub><b>coupe</b></sub></td></tr>
<tr><td align="center"><img src="images/car-suv.webp" width="200" alt="car suv"><br><sub><b>suv</b></sub></td><td align="center"><img src="images/car-minivan.webp" width="200" alt="car minivan"><br><sub><b>minivan</b></sub></td><td align="center"><img src="images/car-sports.webp" width="200" alt="car sports"><br><sub><b>sports</b></sub></td><td align="center"><img src="images/car-convertible.webp" width="200" alt="car convertible"><br><sub><b>convertible</b></sub></td></tr>
<tr><td align="center"><img src="images/car-pickup.webp" width="200" alt="car pickup"><br><sub><b>pickup</b></sub></td><td align="center"><img src="images/car-taxi.webp" width="200" alt="car taxi"><br><sub><b>taxi</b></sub></td><td align="center"><img src="images/car-police.webp" width="200" alt="car police"><br><sub><b>police</b></sub></td><td align="center"><img src="images/car-crossover.webp" width="200" alt="car crossover"><br><sub><b>crossover</b></sub></td></tr>
<tr><td align="center"><img src="images/car-compact.webp" width="200" alt="car compact"><br><sub><b>compact</b></sub></td><td align="center"><img src="images/car-citycar.webp" width="200" alt="car citycar"><br><sub><b>citycar</b></sub></td><td align="center"><img src="images/car-microcar.webp" width="200" alt="car microcar"><br><sub><b>microcar</b></sub></td><td align="center"><img src="images/car-limousine.webp" width="200" alt="car limousine"><br><sub><b>limousine</b></sub></td></tr>
<tr><td align="center"><img src="images/car-roadster.webp" width="200" alt="car roadster"><br><sub><b>roadster</b></sub></td><td align="center"><img src="images/car-muscle.webp" width="200" alt="car muscle"><br><sub><b>muscle</b></sub></td><td align="center"><img src="images/car-luxury.webp" width="200" alt="car luxury"><br><sub><b>luxury</b></sub></td><td align="center"><img src="images/car-ev.webp" width="200" alt="car ev"><br><sub><b>ev</b></sub></td></tr>
<tr><td align="center"><img src="images/car-offroader.webp" width="200" alt="car offroader"><br><sub><b>offroader</b></sub></td><td align="center"><img src="images/car-large-suv.webp" width="200" alt="car large-suv"><br><sub><b>large-suv</b></sub></td><td align="center"><img src="images/car-fastback.webp" width="200" alt="car fastback"><br><sub><b>fastback</b></sub></td><td align="center"><img src="images/car-shooting-brake.webp" width="200" alt="car shooting-brake"><br><sub><b>shooting-brake</b></sub></td></tr>
<tr><td align="center"><img src="images/car-hot-hatch.webp" width="200" alt="car hot-hatch"><br><sub><b>hot-hatch</b></sub></td><td align="center"><img src="images/car-supercar.webp" width="200" alt="car supercar"><br><sub><b>supercar</b></sub></td><td align="center"><img src="images/car-classic.webp" width="200" alt="car classic"><br><sub><b>classic</b></sub></td><td align="center"><img src="images/car-mpv.webp" width="200" alt="car mpv"><br><sub><b>mpv</b></sub></td></tr>
<tr><td align="center"><img src="images/car-crew-pickup.webp" width="200" alt="car crew-pickup"><br><sub><b>crew-pickup</b></sub></td><td align="center"><img src="images/car-liftback.webp" width="200" alt="car liftback"><br><sub><b>liftback</b></sub></td></tr>
</table>

**Variants:** `sedan`, `hatchback`, `wagon`, `coupe`, `suv`, `minivan`, `sports`, `convertible`, `pickup`, `taxi`, `police`, `crossover`, `compact`, `citycar`, `microcar`, `limousine`, `roadster`, `muscle`, `luxury`, `ev`, `offroader`, `large-suv`, `fastback`, `shooting-brake`, `hot-hatch`, `supercar`, `classic`, `mpv`, `crew-pickup`, `liftback`

| Option | Description |
|---|---|
| `color` | body paint |
| `interiorColor` | seats |
| `rimColor` | wheels |
| `metallic` | 0–1 |
| `glassTint` | window tint |
| `lights` | false = no real headlight spotlights |
| `speed` | m/s for drive animation |
| `plate` | licence plate text |
| `badge` | boot badge text |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `idle`, `doors`, `windows`, `bonnet`, `boot`, `wipers`


### Van <a id="van"></a>

`createObject('van', { variant: 'cargo' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/van-cargo.webp" width="200" alt="van cargo"><br><sub><b>cargo</b></sub></td><td align="center"><img src="images/van-panel.webp" width="200" alt="van panel"><br><sub><b>panel</b></sub></td><td align="center"><img src="images/van-high-roof.webp" width="200" alt="van high-roof"><br><sub><b>high-roof</b></sub></td><td align="center"><img src="images/van-passenger.webp" width="200" alt="van passenger"><br><sub><b>passenger</b></sub></td></tr>
<tr><td align="center"><sub><b>camper</b></sub></td><td align="center"><sub><b>ambulance</b></sub></td><td align="center"><sub><b>delivery</b></sub></td><td align="center"><sub><b>food-truck</b></sub></td></tr>
<tr><td align="center"><sub><b>minibus</b></sub></td><td align="center"><sub><b>crew-van</b></sub></td><td align="center"><sub><b>refrigerated</b></sub></td><td align="center"><sub><b>postal</b></sub></td></tr>
</table>

**Variants:** `cargo`, `panel`, `high-roof`, `passenger`, `camper`, `ambulance`, `delivery`, `food-truck`, `minibus`, `crew-van`, `refrigerated`, `postal`

| Option | Description |
|---|---|
| `color` | body paint |
| `interiorColor` | seats |
| `rimColor` | wheels |
| `glassTint` | window tint |
| `lights` | false = no real headlight spotlights |
| `speed` | m/s for drive animation |
| `plate` | licence plate text |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `idle`, `doors`, `windows`, `bonnet`, `wipers`, `slidingDoor`, `rearDoors`


### Truck <a id="truck"></a>

`createObject('truck', { variant: 'box' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/truck-box.webp" width="200" alt="truck box"><br><sub><b>box</b></sub></td><td align="center"><img src="images/truck-tanker.webp" width="200" alt="truck tanker"><br><sub><b>tanker</b></sub></td><td align="center"><img src="images/truck-flatbed.webp" width="200" alt="truck flatbed"><br><sub><b>flatbed</b></sub></td><td align="center"><img src="images/truck-dump.webp" width="200" alt="truck dump"><br><sub><b>dump</b></sub></td></tr>
<tr><td align="center"><sub><b>semi</b></sub></td><td align="center"><sub><b>garbage</b></sub></td><td align="center"><img src="images/truck-fire-engine.webp" width="200" alt="truck fire-engine"><br><sub><b>fire-engine</b></sub></td><td align="center"><img src="images/truck-tow.webp" width="200" alt="truck tow"><br><sub><b>tow</b></sub></td></tr>
<tr><td align="center"><sub><b>delivery-van</b></sub></td><td align="center"><sub><b>cement-mixer</b></sub></td></tr>
</table>

**Variants:** `box`, `tanker`, `flatbed`, `dump`, `semi`, `garbage`, `fire-engine`, `tow`, `delivery-van`, `cement-mixer`

| Option | Description |
|---|---|
| `color` | cab/body color |
| `cargoColor` | cargo/body color |
| `roofColor` | cab roof (fire-engine) |
| `speed` | m/s |
| `lights` | false = no spotlights |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `idle`, `doors`


### Construction machine <a id="construction"></a>

`createObject('construction', { variant: 'excavator' })` · 16 versions · procedural JS

<table>
<tr><td align="center"><img src="images/construction-excavator.webp" width="200" alt="construction excavator"><br><sub><b>excavator</b></sub></td><td align="center"><img src="images/construction-bulldozer.webp" width="200" alt="construction bulldozer"><br><sub><b>bulldozer</b></sub></td><td align="center"><img src="images/construction-wheel-loader.webp" width="200" alt="construction wheel-loader"><br><sub><b>wheel-loader</b></sub></td><td align="center"><sub><b>backhoe</b></sub></td></tr>
<tr><td align="center"><sub><b>skid-steer</b></sub></td><td align="center"><sub><b>telehandler</b></sub></td><td align="center"><sub><b>articulated-dump</b></sub></td><td align="center"><sub><b>mining-dump</b></sub></td></tr>
<tr><td align="center"><sub><b>mobile-crane</b></sub></td><td align="center"><sub><b>tower-crane</b></sub></td><td align="center"><sub><b>road-roller</b></sub></td><td align="center"><sub><b>tandem-roller</b></sub></td></tr>
<tr><td align="center"><sub><b>motor-grader</b></sub></td><td align="center"><sub><b>asphalt-paver</b></sub></td><td align="center"><sub><b>concrete-pump</b></sub></td><td align="center"><sub><b>trencher</b></sub></td></tr>
</table>

**Variants:** `excavator`, `bulldozer`, `wheel-loader`, `backhoe`, `skid-steer`, `telehandler`, `articulated-dump`, `mining-dump`, `mobile-crane`, `tower-crane`, `road-roller`, `tandem-roller`, `motor-grader`, `asphalt-paver`, `concrete-pump`, `trencher`

| Option | Description |
|---|---|
| `color` | machine paint (default construction yellow) |
| `accentColor` | secondary paint |
| `rimColor` | wheel rims |

**Animations:** `dig`, `swing`, `boomUp`, `drive`, `reverse`, `turnLeft`, `turnRight`, `lights`, `beacon`, `idle`, `doors`


### Semi-trailer <a id="trailer"></a>

`createObject('trailer', { variant: 'box' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/trailer-box.webp" width="200" alt="trailer box"><br><sub><b>box</b></sub></td><td align="center"><img src="images/trailer-reefer.webp" width="200" alt="trailer reefer"><br><sub><b>reefer</b></sub></td><td align="center"><img src="images/trailer-curtainside.webp" width="200" alt="trailer curtainside"><br><sub><b>curtainside</b></sub></td><td align="center"><sub><b>flatbed</b></sub></td></tr>
<tr><td align="center"><sub><b>tanker</b></sub></td><td align="center"><sub><b>lowboy</b></sub></td><td align="center"><sub><b>car-carrier</b></sub></td><td align="center"><sub><b>container</b></sub></td></tr>
<tr><td align="center"><sub><b>livestock</b></sub></td><td align="center"><sub><b>logging</b></sub></td><td align="center"><sub><b>dump</b></sub></td><td align="center"><sub><b>grain</b></sub></td></tr>
</table>

**Variants:** `box`, `reefer`, `curtainside`, `flatbed`, `tanker`, `lowboy`, `car-carrier`, `container`, `livestock`, `logging`, `dump`, `grain`

| Option | Description |
|---|---|
| `color` | trailer colour |
| `cargoColor` | body / container / tank colour |

**Animations:** `drive`, `reverse`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `doors`


### Farm machine <a id="farm"></a>

`createObject('farm', { variant: 'tractor-compact' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/farm-tractor-compact.webp" width="200" alt="farm tractor-compact"><br><sub><b>tractor-compact</b></sub></td><td align="center"><img src="images/farm-tractor-utility.webp" width="200" alt="farm tractor-utility"><br><sub><b>tractor-utility</b></sub></td><td align="center"><img src="images/farm-tractor-rowcrop.webp" width="200" alt="farm tractor-rowcrop"><br><sub><b>tractor-rowcrop</b></sub></td><td align="center"><sub><b>tractor-4wd</b></sub></td></tr>
<tr><td align="center"><sub><b>tractor-tracked</b></sub></td><td align="center"><sub><b>combine-harvester</b></sub></td><td align="center"><sub><b>forage-harvester</b></sub></td><td align="center"><sub><b>sprayer</b></sub></td></tr>
<tr><td align="center"><sub><b>baler</b></sub></td><td align="center"><sub><b>wagon</b></sub></td></tr>
</table>

**Variants:** `tractor-compact`, `tractor-utility`, `tractor-rowcrop`, `tractor-4wd`, `tractor-tracked`, `combine-harvester`, `forage-harvester`, `sprayer`, `baler`, `wagon`

| Option | Description |
|---|---|
| `color` | machine paint |
| `accentColor` | secondary paint |
| `rimColor` | wheel rims |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `beacon`, `idle`


### Industrial vehicle <a id="industrial"></a>

`createObject('industrial', { variant: 'forklift' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/industrial-forklift.webp" width="200" alt="industrial forklift"><br><sub><b>forklift</b></sub></td><td align="center"><img src="images/industrial-reach-truck.webp" width="200" alt="industrial reach-truck"><br><sub><b>reach-truck</b></sub></td><td align="center"><img src="images/industrial-pallet-jack.webp" width="200" alt="industrial pallet-jack"><br><sub><b>pallet-jack</b></sub></td><td align="center"><sub><b>airport-tug</b></sub></td></tr>
<tr><td align="center"><sub><b>baggage-cart</b></sub></td><td align="center"><sub><b>scissor-lift</b></sub></td><td align="center"><sub><b>boom-lift</b></sub></td><td align="center"><sub><b>street-sweeper</b></sub></td></tr>
<tr><td align="center"><sub><b>golf-cart</b></sub></td><td align="center"><sub><b>utility-vehicle</b></sub></td></tr>
</table>

**Variants:** `forklift`, `reach-truck`, `pallet-jack`, `airport-tug`, `baggage-cart`, `scissor-lift`, `boom-lift`, `street-sweeper`, `golf-cart`, `utility-vehicle`

| Option | Description |
|---|---|
| `color` | body paint |
| `accentColor` | secondary paint |
| `rimColor` | wheel rims |

**Animations:** `lift`, `tilt`, `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `beacon`


### Bus <a id="bus"></a>

`createObject('bus', { variant: 'city' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bus-city.webp" width="200" alt="bus city"><br><sub><b>city</b></sub></td><td align="center"><img src="images/bus-school.webp" width="200" alt="bus school"><br><sub><b>school</b></sub></td><td align="center"><img src="images/bus-double.webp" width="200" alt="bus double"><br><sub><b>double</b></sub></td><td align="center"><sub><b>coach</b></sub></td></tr>
<tr><td align="center"><sub><b>minibus</b></sub></td><td align="center"><sub><b>articulated</b></sub></td><td align="center"><sub><b>trolleybus</b></sub></td><td align="center"><sub><b>electric</b></sub></td></tr>
<tr><td align="center"><sub><b>airport</b></sub></td><td align="center"><sub><b>open-top</b></sub></td><td align="center"><sub><b>party</b></sub></td></tr>
</table>

**Variants:** `city`, `school`, `double`, `coach`, `minibus`, `articulated`, `trolleybus`, `electric`, `airport`, `open-top`, `party`

| Option | Description |
|---|---|
| `color` | body color |
| `accentColor` | stripe color |
| `roofColor` | roof color |
| `seatColor` | seat fabric |
| `speed` | m/s |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `doors`, `idle`, `kneel`


### Motorcycle <a id="motorcycle"></a>

`createObject('motorcycle', { variant: 'sport' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/motorcycle-sport.webp" width="200" alt="motorcycle sport"><br><sub><b>sport</b></sub></td><td align="center"><img src="images/motorcycle-cruiser.webp" width="200" alt="motorcycle cruiser"><br><sub><b>cruiser</b></sub></td><td align="center"><img src="images/motorcycle-scooter.webp" width="200" alt="motorcycle scooter"><br><sub><b>scooter</b></sub></td><td align="center"><sub><b>dirt</b></sub></td></tr>
<tr><td align="center"><sub><b>touring</b></sub></td><td align="center"><img src="images/motorcycle-chopper.webp" width="200" alt="motorcycle chopper"><br><sub><b>chopper</b></sub></td><td align="center"><sub><b>naked</b></sub></td><td align="center"><sub><b>cafe-racer</b></sub></td></tr>
<tr><td align="center"><sub><b>adventure</b></sub></td><td align="center"><sub><b>supermoto</b></sub></td><td align="center"><sub><b>electric</b></sub></td></tr>
</table>

**Variants:** `sport`, `cruiser`, `scooter`, `dirt`, `touring`, `chopper`, `naked`, `cafe-racer`, `adventure`, `supermoto`, `electric`

| Option | Description |
|---|---|
| `color` | paint color |
| `speed` | m/s |
| `lights` | false = no spotlights |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`, `brake`, `lean`, `suspension`


### Bicycle <a id="bicycle"></a>

`createObject('bicycle', { variant: 'road' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bicycle-road.webp" width="200" alt="bicycle road"><br><sub><b>road</b></sub></td><td align="center"><img src="images/bicycle-mountain.webp" width="200" alt="bicycle mountain"><br><sub><b>mountain</b></sub></td><td align="center"><img src="images/bicycle-city.webp" width="200" alt="bicycle city"><br><sub><b>city</b></sub></td><td align="center"><sub><b>bmx</b></sub></td></tr>
<tr><td align="center"><sub><b>kids</b></sub></td><td align="center"><sub><b>ebike</b></sub></td></tr>
</table>

**Variants:** `road`, `mountain`, `city`, `bmx`, `kids`, `ebike`

| Option | Description |
|---|---|
| `color` | frame color |
| `fenderColor` | mudguard color |
| `speed` | m/s |

**Animations:** `ride`, `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `lights`


### Helicopter <a id="helicopter"></a>

`createObject('helicopter', { variant: 'civil' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/helicopter-civil.webp" width="200" alt="helicopter civil"><br><sub><b>civil</b></sub></td><td align="center"><img src="images/helicopter-rescue.webp" width="200" alt="helicopter rescue"><br><sub><b>rescue</b></sub></td><td align="center"><img src="images/helicopter-police.webp" width="200" alt="helicopter police"><br><sub><b>police</b></sub></td><td align="center"><sub><b>military</b></sub></td></tr>
<tr><td align="center"><sub><b>news</b></sub></td><td align="center"><sub><b>medical</b></sub></td><td align="center"><sub><b>transport</b></sub></td></tr>
</table>

**Variants:** `civil`, `rescue`, `police`, `military`, `news`, `medical`, `transport`

| Option | Description |
|---|---|
| `color` | body color |
| `accentColor` | stripe color |
| `interiorColor` | seat color |

**Animations:** `rotors`, `hover`, `lights`, `beacon`


### Airplane <a id="airplane"></a>

`createObject('airplane', { variant: 'prop' })` · 31 versions · procedural JS

<table>
<tr><td align="center"><img src="images/airplane-prop.webp" width="200" alt="airplane prop"><br><sub><b>prop</b></sub></td><td align="center"><img src="images/airplane-jet.webp" width="200" alt="airplane jet"><br><sub><b>jet</b></sub></td><td align="center"><img src="images/airplane-private-jet.webp" width="200" alt="airplane private-jet"><br><sub><b>private-jet</b></sub></td><td align="center"><sub><b>fighter</b></sub></td></tr>
<tr><td align="center"><sub><b>cargo</b></sub></td><td align="center"><sub><b>seaplane</b></sub></td><td align="center"><sub><b>narrowbody</b></sub></td><td align="center"><sub><b>widebody</b></sub></td></tr>
<tr><td align="center"><sub><b>jumbo</b></sub></td><td align="center"><sub><b>regional-jet</b></sub></td><td align="center"><sub><b>turboprop</b></sub></td><td align="center"><sub><b>biplane</b></sub></td></tr>
<tr><td align="center"><sub><b>glider</b></sub></td><td align="center"><sub><b>ultralight</b></sub></td><td align="center"><sub><b>trainer</b></sub></td><td align="center"><sub><b>four-seater</b></sub></td></tr>
<tr><td align="center"><sub><b>twin-prop</b></sub></td><td align="center"><sub><b>aerobatic</b></sub></td><td align="center"><sub><b>military-transport</b></sub></td><td align="center"><sub><b>tanker</b></sub></td></tr>
<tr><td align="center"><sub><b>awacs</b></sub></td><td align="center"><sub><b>jet-trainer</b></sub></td><td align="center"><sub><b>warbird</b></sub></td><td align="center"><sub><b>amphibian</b></sub></td></tr>
<tr><td align="center"><sub><b>freighter</b></sub></td><td align="center"><sub><b>water-bomber</b></sub></td><td align="center"><sub><b>crop-duster</b></sub></td><td align="center"><sub><b>supersonic</b></sub></td></tr>
<tr><td align="center"><sub><b>drone</b></sub></td><td align="center"><sub><b>blimp</b></sub></td><td align="center"><sub><b>hot-air-balloon</b></sub></td></tr>
</table>

**Variants:** `prop`, `jet`, `private-jet`, `fighter`, `cargo`, `seaplane`, `narrowbody`, `widebody`, `jumbo`, `regional-jet`, `turboprop`, `biplane`, `glider`, `ultralight`, `trainer`, `four-seater`, `twin-prop`, `aerobatic`, `military-transport`, `tanker`, `awacs`, `jet-trainer`, `warbird`, `amphibian`, `freighter`, `water-bomber`, `crop-duster`, `supersonic`, `drone`, `blimp`, `hot-air-balloon`

| Option | Description |
|---|---|
| `color` | body color |
| `accentColor` | tail / stripe color |

**Animations:** `propeller`, `flaps`, `ailerons`, `lights`, `beacon`


### Boat <a id="boat"></a>

`createObject('boat', { variant: 'speedboat' })` · 15 versions · procedural JS

<table>
<tr><td align="center"><img src="images/boat-speedboat.webp" width="200" alt="boat speedboat"><br><sub><b>speedboat</b></sub></td><td align="center"><img src="images/boat-sailboat.webp" width="200" alt="boat sailboat"><br><sub><b>sailboat</b></sub></td><td align="center"><img src="images/boat-yacht.webp" width="200" alt="boat yacht"><br><sub><b>yacht</b></sub></td><td align="center"><sub><b>fishing</b></sub></td></tr>
<tr><td align="center"><sub><b>rowboat</b></sub></td><td align="center"><sub><b>kayak</b></sub></td><td align="center"><sub><b>ferry</b></sub></td><td align="center"><sub><b>tugboat</b></sub></td></tr>
<tr><td align="center"><sub><b>cargo-ship</b></sub></td><td align="center"><sub><b>canoe</b></sub></td><td align="center"><sub><b>jet-ski</b></sub></td><td align="center"><sub><b>pontoon</b></sub></td></tr>
<tr><td align="center"><sub><b>lifeboat</b></sub></td><td align="center"><sub><b>police-boat</b></sub></td><td align="center"><sub><b>catamaran</b></sub></td></tr>
</table>

**Variants:** `speedboat`, `sailboat`, `yacht`, `fishing`, `rowboat`, `kayak`, `ferry`, `tugboat`, `cargo-ship`, `canoe`, `jet-ski`, `pontoon`, `lifeboat`, `police-boat`, `catamaran`

| Option | Description |
|---|---|
| `color` | hull color |
| `accentColor` | stripe color |
| `sailColor` | sail color |

**Animations:** `bob`, `cruise`, `lights`, `outboardTilt`


### Train <a id="train"></a>

`createObject('train', { variant: 'diesel' })` · 15 versions · procedural JS

<table>
<tr><td align="center"><img src="images/train-diesel.webp" width="200" alt="train diesel"><br><sub><b>diesel</b></sub></td><td align="center"><img src="images/train-electric.webp" width="200" alt="train electric"><br><sub><b>electric</b></sub></td><td align="center"><img src="images/train-steam.webp" width="200" alt="train steam"><br><sub><b>steam</b></sub></td><td align="center"><sub><b>passenger</b></sub></td></tr>
<tr><td align="center"><sub><b>sleeper</b></sub></td><td align="center"><sub><b>high-speed</b></sub></td><td align="center"><sub><b>subway</b></sub></td><td align="center"><sub><b>tram</b></sub></td></tr>
<tr><td align="center"><sub><b>light-rail</b></sub></td><td align="center"><sub><b>monorail</b></sub></td><td align="center"><sub><b>boxcar</b></sub></td><td align="center"><sub><b>tanker</b></sub></td></tr>
<tr><td align="center"><sub><b>hopper</b></sub></td><td align="center"><sub><b>flatcar</b></sub></td><td align="center"><sub><b>caboose</b></sub></td></tr>
</table>

**Variants:** `diesel`, `electric`, `steam`, `passenger`, `sleeper`, `high-speed`, `subway`, `tram`, `light-rail`, `monorail`, `boxcar`, `tanker`, `hopper`, `flatcar`, `caboose`

| Option | Description |
|---|---|
| `color` | body color |
| `accentColor` | stripe / lettering color |
| `speed` | m/s for drive |

**Animations:** `drive`, `reverse`, `lights`


### Small vehicle <a id="misc-vehicle"></a>

`createObject('misc-vehicle', { variant: 'atv' })` · 13 versions · procedural JS

<table>
<tr><td align="center"><img src="images/misc-vehicle-atv.webp" width="200" alt="misc-vehicle atv"><br><sub><b>atv</b></sub></td><td align="center"><img src="images/misc-vehicle-snowmobile.webp" width="200" alt="misc-vehicle snowmobile"><br><sub><b>snowmobile</b></sub></td><td align="center"><img src="images/misc-vehicle-go-kart.webp" width="200" alt="misc-vehicle go-kart"><br><sub><b>go-kart</b></sub></td><td align="center"><sub><b>golf-cart</b></sub></td></tr>
<tr><td align="center"><sub><b>tuk-tuk</b></sub></td><td align="center"><sub><b>kick-scooter</b></sub></td><td align="center"><sub><b>segway</b></sub></td><td align="center"><sub><b>skateboard</b></sub></td></tr>
<tr><td align="center"><sub><b>wheelchair</b></sub></td><td align="center"><sub><b>stroller</b></sub></td><td align="center"><sub><b>rickshaw</b></sub></td><td align="center"><sub><b>carriage</b></sub></td></tr>
<tr><td align="center"><sub><b>sled</b></sub></td></tr>
</table>

**Variants:** `atv`, `snowmobile`, `go-kart`, `golf-cart`, `tuk-tuk`, `kick-scooter`, `segway`, `skateboard`, `wheelchair`, `stroller`, `rickshaw`, `carriage`, `sled`

| Option | Description |
|---|---|
| `color` | main color |
| `speed` | m/s for drive |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `lights`, `brake`


### Bicycle (HD) <a id="hd-bicycle"></a>

`createObject('hd-bicycle', { variant: 'city-blue' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>city-blue</b></sub></td><td align="center"><sub><b>road-red-drop</b></sub></td><td align="center"><sub><b>step-through-mint-basket</b></sub></td><td align="center"><sub><b>black-commuter</b></sub></td></tr>
</table>

**Variants:** `city-blue`, `road-red-drop`, `step-through-mint-basket`, `black-commuter`

| Option | Description |
|---|---|
| `color` | frame color |


### Kick scooter (HD) <a id="hd-kick-scooter"></a>

`createObject('hd-kick-scooter', { variant: 'red' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>red</b></sub></td><td align="center"><sub><b>blue</b></sub></td><td align="center"><sub><b>electric-black</b></sub></td><td align="center"><sub><b>electric-white</b></sub></td></tr>
</table>

**Variants:** `red`, `blue`, `electric-black`, `electric-white`

| Option | Description |
|---|---|
| `color` | deck color |


## Furniture

### Chair <a id="chair"></a>

`createObject('chair', { variant: 'dining' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/chair-dining.webp" width="200" alt="chair dining"><br><sub><b>dining</b></sub></td><td align="center"><img src="images/chair-office.webp" width="200" alt="chair office"><br><sub><b>office</b></sub></td><td align="center"><sub><b>armchair</b></sub></td><td align="center"><sub><b>rocking</b></sub></td></tr>
<tr><td align="center"><sub><b>bar-stool</b></sub></td><td align="center"><sub><b>wingback</b></sub></td><td align="center"><sub><b>lounge</b></sub></td><td align="center"><sub><b>folding</b></sub></td></tr>
<tr><td align="center"><sub><b>gaming</b></sub></td><td align="center"><sub><b>accent-shell</b></sub></td><td align="center"><sub><b>ladder-back</b></sub></td><td align="center"><sub><b>stacking</b></sub></td></tr>
</table>

**Variants:** `dining`, `office`, `armchair`, `rocking`, `bar-stool`, `wingback`, `lounge`, `folding`, `gaming`, `accent-shell`, `ladder-back`, `stacking`

| Option | Description |
|---|---|
| `color` | upholstery/shell color |
| `wood` | oak | walnut | cherry | maple | pine | white | black | color |
| `metal` | chrome | steel | black | brass | gold |


### Sofa <a id="sofa"></a>

`createObject('sofa', { variant: 'loveseat' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sofa-loveseat.webp" width="200" alt="sofa loveseat"><br><sub><b>loveseat</b></sub></td><td align="center"><img src="images/sofa-three-seat.webp" width="200" alt="sofa three-seat"><br><sub><b>three-seat</b></sub></td><td align="center"><sub><b>sectional</b></sub></td><td align="center"><img src="images/sofa-chesterfield.webp" width="200" alt="sofa chesterfield"><br><sub><b>chesterfield</b></sub></td></tr>
<tr><td align="center"><sub><b>modern-low</b></sub></td><td align="center"><sub><b>futon</b></sub></td></tr>
</table>

**Variants:** `loveseat`, `three-seat`, `sectional`, `chesterfield`, `modern-low`, `futon`

| Option | Description |
|---|---|
| `color` | upholstery |
| `accentColor` | pillows |
| `wood` | legs/frame |


### Table <a id="table"></a>

`createObject('table', { variant: 'dining' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/table-dining.webp" width="200" alt="table dining"><br><sub><b>dining</b></sub></td><td align="center"><img src="images/table-farmhouse.webp" width="200" alt="table farmhouse"><br><sub><b>farmhouse</b></sub></td><td align="center"><img src="images/table-coffee.webp" width="200" alt="table coffee"><br><sub><b>coffee</b></sub></td><td align="center"><sub><b>round</b></sub></td></tr>
<tr><td align="center"><sub><b>side</b></sub></td><td align="center"><sub><b>glass-top</b></sub></td><td align="center"><sub><b>console</b></sub></td><td align="center"><sub><b>picnic</b></sub></td></tr>
</table>

**Variants:** `dining`, `farmhouse`, `coffee`, `round`, `side`, `glass-top`, `console`, `picnic`

| Option | Description |
|---|---|
| `wood` | wood |
| `metal` | glass-top frame |
| `width` | metres |
| `depth` | metres |


### Desk <a id="desk"></a>

`createObject('desk', { variant: 'writing' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/desk-writing.webp" width="200" alt="desk writing"><br><sub><b>writing</b></sub></td><td align="center"><img src="images/desk-computer.webp" width="200" alt="desk computer"><br><sub><b>computer</b></sub></td><td align="center"><sub><b>standing</b></sub></td><td align="center"><sub><b>executive</b></sub></td></tr>
</table>

**Variants:** `writing`, `computer`, `standing`, `executive`

| Option | Description |
|---|---|
| `wood` | wood |
| `metal` | standing frame |

**Animations:** `drawerOpen`


### Bed <a id="bed"></a>

`createObject('bed', { variant: 'single' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bed-single.webp" width="200" alt="bed single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/bed-double.webp" width="200" alt="bed double"><br><sub><b>double</b></sub></td><td align="center"><sub><b>king</b></sub></td><td align="center"><sub><b>platform</b></sub></td></tr>
<tr><td align="center"><sub><b>bunk</b></sub></td><td align="center"><sub><b>canopy</b></sub></td><td align="center"><sub><b>crib</b></sub></td></tr>
</table>

**Variants:** `single`, `double`, `king`, `platform`, `bunk`, `canopy`, `crib`

| Option | Description |
|---|---|
| `color` | duvet color |
| `wood` | frame |
| `headColor` | king headboard |


### Wardrobe <a id="wardrobe"></a>

`createObject('wardrobe', { variant: 'classic' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wardrobe-classic.webp" width="200" alt="wardrobe classic"><br><sub><b>classic</b></sub></td><td align="center"><img src="images/wardrobe-modern.webp" width="200" alt="wardrobe modern"><br><sub><b>modern</b></sub></td><td align="center"><sub><b>armoire</b></sub></td><td align="center"><sub><b>sliding</b></sub></td></tr>
</table>

**Variants:** `classic`, `modern`, `armoire`, `sliding`

| Option | Description |
|---|---|
| `wood` | wood |
| `seed` | clothes colors |

**Animations:** `doorsOpen`


### Cabinet <a id="cabinet"></a>

`createObject('cabinet', { variant: 'dresser' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cabinet-dresser.webp" width="200" alt="cabinet dresser"><br><sub><b>dresser</b></sub></td><td align="center"><img src="images/cabinet-nightstand.webp" width="200" alt="cabinet nightstand"><br><sub><b>nightstand</b></sub></td><td align="center"><sub><b>chest</b></sub></td><td align="center"><sub><b>sideboard</b></sub></td></tr>
<tr><td align="center"><sub><b>tv-stand</b></sub></td></tr>
</table>

**Variants:** `dresser`, `nightstand`, `chest`, `sideboard`, `tv-stand`

| Option | Description |
|---|---|
| `wood` | wood |

**Animations:** `drawersOpen`


### Bookshelf <a id="bookshelf"></a>

`createObject('bookshelf', { variant: 'tall' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bookshelf-tall.webp" width="200" alt="bookshelf tall"><br><sub><b>tall</b></sub></td><td align="center"><img src="images/bookshelf-low.webp" width="200" alt="bookshelf low"><br><sub><b>low</b></sub></td><td align="center"><sub><b>cube</b></sub></td><td align="center"><sub><b>ladder</b></sub></td></tr>
</table>

**Variants:** `tall`, `low`, `cube`, `ladder`

| Option | Description |
|---|---|
| `wood` | wood |
| `seed` | book arrangement |
| `books` | false = empty |


### Lamp <a id="lamp"></a>

`createObject('lamp', { variant: 'floor' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lamp-floor.webp" width="200" alt="lamp floor"><br><sub><b>floor</b></sub></td><td align="center"><img src="images/lamp-desk.webp" width="200" alt="lamp desk"><br><sub><b>desk</b></sub></td><td align="center"><sub><b>pendant</b></sub></td><td align="center"><sub><b>table</b></sub></td></tr>
<tr><td align="center"><sub><b>chandelier</b></sub></td><td align="center"><sub><b>arc</b></sub></td></tr>
</table>

**Variants:** `floor`, `desk`, `pendant`, `table`, `chandelier`, `arc`

| Option | Description |
|---|---|
| `color` | shade color |
| `metal` | metal finish |
| `lightColor` | bulb color |
| `light` | true adds a PointLight |
| `intensity` | light intensity |
| `baseColor` | table-lamp ceramic |

**Animations:** `on`, `flicker`


### Fan <a id="fan"></a>

`createObject('fan', { variant: 'ceiling' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fan-ceiling.webp" width="200" alt="fan ceiling"><br><sub><b>ceiling</b></sub></td><td align="center"><img src="images/fan-standing.webp" width="200" alt="fan standing"><br><sub><b>standing</b></sub></td><td align="center"><sub><b>tower</b></sub></td></tr>
</table>

**Variants:** `ceiling`, `standing`, `tower`

| Option | Description |
|---|---|
| `wood` | ceiling blades |
| `color` | body |
| `metal` | metal finish |

**Animations:** `spin`


### Kitchen <a id="kitchen"></a>

`createObject('kitchen', { variant: 'fridge' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kitchen-fridge.webp" width="200" alt="kitchen fridge"><br><sub><b>fridge</b></sub></td><td align="center"><img src="images/kitchen-french-fridge.webp" width="200" alt="kitchen french-fridge"><br><sub><b>french-fridge</b></sub></td><td align="center"><sub><b>mini-fridge</b></sub></td><td align="center"><sub><b>stove</b></sub></td></tr>
<tr><td align="center"><sub><b>sink-unit</b></sub></td><td align="center"><sub><b>counter</b></sub></td><td align="center"><sub><b>microwave</b></sub></td><td align="center"><sub><b>dishwasher</b></sub></td></tr>
</table>

**Variants:** `fridge`, `french-fridge`, `mini-fridge`, `stove`, `sink-unit`, `counter`, `microwave`, `dishwasher`

| Option | Description |
|---|---|
| `finish` | stainless | white | black |
| `color` | custom enamel color |
| `wood` | cabinet wood |
| `stone` | countertop color |

**Animations:** `doorOpen`


### Bathroom <a id="bathroom"></a>

`createObject('bathroom', { variant: 'toilet' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bathroom-toilet.webp" width="200" alt="bathroom toilet"><br><sub><b>toilet</b></sub></td><td align="center"><img src="images/bathroom-clawfoot-tub.webp" width="200" alt="bathroom clawfoot-tub"><br><sub><b>clawfoot-tub</b></sub></td><td align="center"><sub><b>modern-tub</b></sub></td><td align="center"><sub><b>shower</b></sub></td></tr>
<tr><td align="center"><sub><b>basin</b></sub></td><td align="center"><sub><b>vanity</b></sub></td></tr>
</table>

**Variants:** `toilet`, `clawfoot-tub`, `modern-tub`, `shower`, `basin`, `vanity`

| Option | Description |
|---|---|
| `color` | ceramic color |
| `metal` | fixtures |
| `wood` | vanity wood |

**Animations:** `lidOpen`


### Plant <a id="plant"></a>

`createObject('plant', { variant: 'monstera' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/plant-monstera.webp" width="200" alt="plant monstera"><br><sub><b>monstera</b></sub></td><td align="center"><img src="images/plant-snake.webp" width="200" alt="plant snake"><br><sub><b>snake</b></sub></td><td align="center"><sub><b>fern</b></sub></td><td align="center"><sub><b>cactus</b></sub></td></tr>
<tr><td align="center"><sub><b>fiddle-leaf</b></sub></td><td align="center"><sub><b>succulent</b></sub></td></tr>
</table>

**Variants:** `monstera`, `snake`, `fern`, `cactus`, `fiddle-leaf`, `succulent`

| Option | Description |
|---|---|
| `potColor` | pot color |
| `seed` | leaf layout |


### Vase <a id="vase"></a>

`createObject('vase', { variant: 'amphora' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/vase-amphora.webp" width="200" alt="vase amphora"><br><sub><b>amphora</b></sub></td><td align="center"><img src="images/vase-bud.webp" width="200" alt="vase bud"><br><sub><b>bud</b></sub></td><td align="center"><sub><b>cylinder</b></sub></td><td align="center"><sub><b>bowl</b></sub></td></tr>
</table>

**Variants:** `amphora`, `bud`, `cylinder`, `bowl`

| Option | Description |
|---|---|
| `color` | glaze/glass color |
| `seed` | flower colors |


### Rug <a id="rug"></a>

`createObject('rug', { variant: 'persian' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rug-persian.webp" width="200" alt="rug persian"><br><sub><b>persian</b></sub></td><td align="center"><img src="images/rug-modern.webp" width="200" alt="rug modern"><br><sub><b>modern</b></sub></td><td align="center"><sub><b>runner</b></sub></td><td align="center"><sub><b>round</b></sub></td></tr>
</table>

**Variants:** `persian`, `modern`, `runner`, `round`

| Option | Description |
|---|---|
| `colors` | array of 3-4 colors |
| `seed` | pattern |


### Mirror <a id="mirror"></a>

`createObject('mirror', { variant: 'wall-round' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mirror-wall-round.webp" width="200" alt="mirror wall-round"><br><sub><b>wall-round</b></sub></td><td align="center"><img src="images/mirror-floor.webp" width="200" alt="mirror floor"><br><sub><b>floor</b></sub></td><td align="center"><sub><b>sunburst</b></sub></td></tr>
</table>

**Variants:** `wall-round`, `floor`, `sunburst`

| Option | Description |
|---|---|
| `metal` | frame metal |
| `wood` | floor frame |


### Clock <a id="clock"></a>

`createObject('clock', { variant: 'wall' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/clock-wall.webp" width="200" alt="clock wall"><br><sub><b>wall</b></sub></td><td align="center"><img src="images/clock-grandfather.webp" width="200" alt="clock grandfather"><br><sub><b>grandfather</b></sub></td><td align="center"><sub><b>mantel</b></sub></td></tr>
</table>

**Variants:** `wall`, `grandfather`, `mantel`

| Option | Description |
|---|---|
| `color` | wall case |
| `wood` | case wood |

**Animations:** `tick`


### Picture frame <a id="frame"></a>

`createObject('frame', { variant: 'landscape' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/frame-landscape.webp" width="200" alt="frame landscape"><br><sub><b>landscape</b></sub></td><td align="center"><img src="images/frame-portrait.webp" width="200" alt="frame portrait"><br><sub><b>portrait</b></sub></td><td align="center"><sub><b>photo</b></sub></td></tr>
</table>

**Variants:** `landscape`, `portrait`, `photo`

| Option | Description |
|---|---|
| `wood` | frame wood |
| `seed` | painting |


### Office <a id="office-equipment"></a>

`createObject('office-equipment', { variant: 'filing-cabinet' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/office-equipment-filing-cabinet.webp" width="200" alt="office-equipment filing-cabinet"><br><sub><b>filing-cabinet</b></sub></td><td align="center"><sub><b>whiteboard</b></sub></td><td align="center"><sub><b>water-cooler</b></sub></td><td align="center"><sub><b>printer</b></sub></td></tr>
<tr><td align="center"><sub><b>locker</b></sub></td></tr>
</table>

**Variants:** `filing-cabinet`, `whiteboard`, `water-cooler`, `printer`, `locker`

| Option | Description |
|---|---|
| `color` | body color |

**Animations:** `drawerOpen`


### Ottoman <a id="ottoman"></a>

`createObject('ottoman', { variant: 'pouf' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ottoman-pouf.webp" width="200" alt="ottoman pouf"><br><sub><b>pouf</b></sub></td><td align="center"><sub><b>cube</b></sub></td><td align="center"><sub><b>tufted-bench</b></sub></td><td align="center"><sub><b>storage</b></sub></td></tr>
</table>

**Variants:** `pouf`, `cube`, `tufted-bench`, `storage`

| Option | Description |
|---|---|
| `color` | upholstery |
| `wood` | legs |


### Indoor bench <a id="indoor-bench"></a>

`createObject('indoor-bench', { variant: 'entry' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/indoor-bench-entry.webp" width="200" alt="indoor-bench entry"><br><sub><b>entry</b></sub></td><td align="center"><sub><b>dining</b></sub></td><td align="center"><sub><b>storage</b></sub></td><td align="center"><sub><b>garden</b></sub></td></tr>
<tr><td align="center"><sub><b>piano</b></sub></td></tr>
</table>

**Variants:** `entry`, `dining`, `storage`, `garden`, `piano`

| Option | Description |
|---|---|
| `color` | cushion |
| `wood` | wood |


### Stool <a id="stool"></a>

`createObject('stool', { variant: 'counter' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/stool-counter.webp" width="200" alt="stool counter"><br><sub><b>counter</b></sub></td><td align="center"><sub><b>bar</b></sub></td><td align="center"><sub><b>step</b></sub></td><td align="center"><sub><b>tripod</b></sub></td></tr>
<tr><td align="center"><sub><b>saddle</b></sub></td></tr>
</table>

**Variants:** `counter`, `bar`, `step`, `tripod`, `saddle`

| Option | Description |
|---|---|
| `color` | seat |
| `wood` | wood |


### Piano <a id="piano"></a>

`createObject('piano', { variant: 'upright' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/piano-upright.webp" width="200" alt="piano upright"><br><sub><b>upright</b></sub></td><td align="center"><sub><b>grand</b></sub></td><td align="center"><sub><b>digital</b></sub></td></tr>
</table>

**Variants:** `upright`, `grand`, `digital`

| Option | Description |
|---|---|
| `wood` | case finish |

**Animations:** `lidOpen`


### Fireplace <a id="fireplace"></a>

`createObject('fireplace', { variant: 'brick' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fireplace-brick.webp" width="200" alt="fireplace brick"><br><sub><b>brick</b></sub></td><td align="center"><sub><b>modern-linear</b></sub></td><td align="center"><sub><b>wood-stove</b></sub></td><td align="center"><sub><b>mantel-classic</b></sub></td></tr>
</table>

**Variants:** `brick`, `modern-linear`, `wood-stove`, `mantel-classic`

| Option | Description |
|---|---|
| `color` | brick color |

**Animations:** `fire`


### Rack & storage <a id="rack"></a>

`createObject('rack', { variant: 'coat-stand' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rack-coat-stand.webp" width="200" alt="rack coat-stand"><br><sub><b>coat-stand</b></sub></td><td align="center"><sub><b>hall-tree</b></sub></td><td align="center"><sub><b>shoe-rack</b></sub></td><td align="center"><sub><b>shoe-cabinet</b></sub></td></tr>
<tr><td align="center"><sub><b>toy-chest</b></sub></td><td align="center"><sub><b>room-divider</b></sub></td><td align="center"><sub><b>slat-divider</b></sub></td></tr>
</table>

**Variants:** `coat-stand`, `hall-tree`, `shoe-rack`, `shoe-cabinet`, `toy-chest`, `room-divider`, `slat-divider`

| Option | Description |
|---|---|
| `color` | fabric / paint |
| `wood` | wood |
| `metal` | hooks/hardware |


### Curtains & blinds <a id="curtains"></a>

`createObject('curtains', { variant: 'pair' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/curtains-pair.webp" width="200" alt="curtains pair"><br><sub><b>pair</b></sub></td><td align="center"><sub><b>sheer</b></sub></td><td align="center"><sub><b>blackout</b></sub></td><td align="center"><sub><b>roman-blind</b></sub></td></tr>
<tr><td align="center"><sub><b>venetian-blind</b></sub></td></tr>
</table>

**Variants:** `pair`, `sheer`, `blackout`, `roman-blind`, `venetian-blind`

| Option | Description |
|---|---|
| `color` | fabric |
| `metal` | rod finish |


### Outdoor <a id="outdoor"></a>

`createObject('outdoor', { variant: 'patio-set' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/outdoor-patio-set.webp" width="200" alt="outdoor patio-set"><br><sub><b>patio-set</b></sub></td><td align="center"><sub><b>lounger</b></sub></td><td align="center"><sub><b>parasol</b></sub></td><td align="center"><sub><b>bbq</b></sub></td></tr>
<tr><td align="center"><sub><b>hammock</b></sub></td><td align="center"><sub><b>adirondack</b></sub></td><td align="center"><sub><b>swing</b></sub></td><td align="center"><sub><b>fire-pit</b></sub></td></tr>
</table>

**Variants:** `patio-set`, `lounger`, `parasol`, `bbq`, `hammock`, `adirondack`, `swing`, `fire-pit`

| Option | Description |
|---|---|
| `color` | cushions / fabric |
| `wood` | wood |
| `metal` | frame |


### Kitchenware <a id="kitchenware"></a>

`createObject('kitchenware', { variant: 'pot' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kitchenware-pot.webp" width="200" alt="kitchenware pot"><br><sub><b>pot</b></sub></td><td align="center"><sub><b>frying-pan</b></sub></td><td align="center"><sub><b>plate-set</b></sub></td><td align="center"><sub><b>cutlery-set</b></sub></td></tr>
<tr><td align="center"><sub><b>knife-block</b></sub></td><td align="center"><sub><b>cutting-board</b></sub></td><td align="center"><sub><b>dutch-oven</b></sub></td><td align="center"><sub><b>mug-set</b></sub></td></tr>
</table>

**Variants:** `pot`, `frying-pan`, `plate-set`, `cutlery-set`, `knife-block`, `cutting-board`, `dutch-oven`, `mug-set`

| Option | Description |
|---|---|
| `color` | enamel / ceramic color |

**Animations:** `steam`


### Bath accessory <a id="bath-item"></a>

`createObject('bath-item', { variant: 'towel-rail' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bath-item-towel-rail.webp" width="200" alt="bath-item towel-rail"><br><sub><b>towel-rail</b></sub></td><td align="center"><sub><b>laundry-basket</b></sub></td><td align="center"><sub><b>toilet-roll-stand</b></sub></td><td align="center"><sub><b>soap-set</b></sub></td></tr>
<tr><td align="center"><sub><b>bath-caddy</b></sub></td><td align="center"><sub><b>heated-towel-rail</b></sub></td></tr>
</table>

**Variants:** `towel-rail`, `laundry-basket`, `toilet-roll-stand`, `soap-set`, `bath-caddy`, `heated-towel-rail`

| Option | Description |
|---|---|
| `color` | towel / ceramic |
| `metal` | chrome | brass | black | gold |


### Decor item <a id="decor-item"></a>

`createObject('decor-item', { variant: 'candles' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/decor-item-candles.webp" width="200" alt="decor-item candles"><br><sub><b>candles</b></sub></td><td align="center"><sub><b>book-stack</b></sub></td><td align="center"><sub><b>basket</b></sub></td><td align="center"><sub><b>sculpture</b></sub></td></tr>
<tr><td align="center"><sub><b>globe</b></sub></td><td align="center"><sub><b>hourglass</b></sub></td><td align="center"><sub><b>lantern</b></sub></td><td align="center"><sub><b>throw-pillows</b></sub></td></tr>
</table>

**Variants:** `candles`, `book-stack`, `basket`, `sculpture`, `globe`, `hourglass`, `lantern`, `throw-pillows`

| Option | Description |
|---|---|
| `color` | main color |
| `seed` | variation |

**Animations:** `flicker`


### Armchair (HD) <a id="hd-armchair"></a>

`createObject('hd-armchair', { variant: 'club-leather' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>club-leather</b></sub></td><td align="center"><sub><b>modern-mustard</b></sub></td><td align="center"><sub><b>lounge-teal</b></sub></td><td align="center"><sub><b>cream-boucle</b></sub></td></tr>
</table>

**Variants:** `club-leather`, `modern-mustard`, `lounge-teal`, `cream-boucle`

| Option | Description |
|---|---|
| `color` | upholstery color |


### Bar stool (HD) <a id="hd-bar-stool"></a>

`createObject('hd-bar-stool', { variant: 'metal-leather' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>metal-leather</b></sub></td><td align="center"><sub><b>chrome-red</b></sub></td><td align="center"><sub><b>oak-wood</b></sub></td><td align="center"><sub><b>walnut-wood-counter</b></sub></td></tr>
<tr><td align="center"><sub><b>metal-back-grey</b></sub></td></tr>
</table>

**Variants:** `metal-leather`, `chrome-red`, `oak-wood`, `walnut-wood-counter`, `metal-back-grey`

| Option | Description |
|---|---|
| `color` | seat color |


### Bean bag (HD) <a id="hd-bean-bag"></a>

`createObject('hd-bean-bag', { variant: 'classic-olive' })` · 8 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>classic-olive</b></sub></td><td align="center"><sub><b>classic-charcoal</b></sub></td><td align="center"><sub><b>chair-mustard</b></sub></td><td align="center"><sub><b>chair-leather-tan</b></sub></td></tr>
<tr><td align="center"><sub><b>pouf-cream-boucle</b></sub></td><td align="center"><sub><b>pouf-terracotta</b></sub></td><td align="center"><sub><b>classic-navy-velvet</b></sub></td><td align="center"><sub><b>chair-blush</b></sub></td></tr>
</table>

**Variants:** `classic-olive`, `classic-charcoal`, `chair-mustard`, `chair-leather-tan`, `pouf-cream-boucle`, `pouf-terracotta`, `classic-navy-velvet`, `chair-blush`

| Option | Description |
|---|---|
| `color` | fabric color |


### Bed (HD) <a id="hd-bed"></a>

`createObject('hd-bed', { variant: 'oak-double' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-double</b></sub></td><td align="center"><sub><b>walnut-queen</b></sub></td><td align="center"><sub><b>upholstered-king</b></sub></td><td align="center"><sub><b>pine-single</b></sub></td></tr>
</table>

**Variants:** `oak-double`, `walnut-queen`, `upholstered-king`, `pine-single`

| Option | Description |
|---|---|
| `color` | headboard fabric |
| `secondaryColor` | duvet |


### Bookshelf (HD) <a id="hd-bookshelf"></a>

`createObject('hd-bookshelf', { variant: 'oak-tall' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-tall</b></sub></td><td align="center"><sub><b>walnut-wide</b></sub></td><td align="center"><sub><b>white-tall</b></sub></td><td align="center"><sub><b>ash-low</b></sub></td></tr>
<tr><td align="center"><sub><b>empty-pine</b></sub></td></tr>
</table>

**Variants:** `oak-tall`, `walnut-wide`, `white-tall`, `ash-low`, `empty-pine`


### Bottle (HD) <a id="hd-bottle"></a>

`createObject('hd-bottle', { variant: 'wine-red' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>wine-red</b></sub></td><td align="center"><sub><b>wine-white</b></sub></td><td align="center"><sub><b>olive-oil</b></sub></td></tr>
</table>

**Variants:** `wine-red`, `wine-white`, `olive-oil`


### Bowl (HD) <a id="hd-bowl"></a>

`createObject('hd-bowl', { variant: 'cereal-white' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>cereal-white</b></sub></td><td align="center"><sub><b>serving-terracotta</b></sub></td></tr>
</table>

**Variants:** `cereal-white`, `serving-terracotta`

| Option | Description |
|---|---|
| `color` | glaze color |


### Coffee maker (HD) <a id="hd-coffee-maker"></a>

`createObject('hd-coffee-maker', { variant: 'drip-black' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>drip-black</b></sub></td><td align="center"><sub><b>espresso-steel</b></sub></td></tr>
</table>

**Variants:** `drip-black`, `espresso-steel`


### Cooking pot (HD) <a id="hd-cookpot"></a>

`createObject('hd-cookpot', { variant: 'stockpot' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>stockpot</b></sub></td><td align="center"><sub><b>saucepan-glass-lid</b></sub></td></tr>
</table>

**Variants:** `stockpot`, `saucepan-glass-lid`


### Curtains (HD) <a id="hd-curtains"></a>

`createObject('hd-curtains', { variant: 'linen-open' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>linen-open</b></sub></td><td align="center"><sub><b>velvet-green-closed</b></sub></td><td align="center"><sub><b>white-sheer-black-rod</b></sub></td></tr>
</table>

**Variants:** `linen-open`, `velvet-green-closed`, `white-sheer-black-rod`

| Option | Description |
|---|---|
| `color` | curtain fabric |


### Cushion set (HD) <a id="hd-cushion-set"></a>

`createObject('hd-cushion-set', { variant: 'warm-neutrals' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>warm-neutrals</b></sub></td><td align="center"><sub><b>blues</b></sub></td><td align="center"><sub><b>autumn-boucle</b></sub></td></tr>
</table>

**Variants:** `warm-neutrals`, `blues`, `autumn-boucle`


### Cutting board (HD) <a id="hd-cutting-board"></a>

`createObject('hd-cutting-board', { variant: 'oak-paddle' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-paddle</b></sub></td><td align="center"><sub><b>walnut-block</b></sub></td></tr>
</table>

**Variants:** `oak-paddle`, `walnut-block`


### Desk (HD) <a id="hd-desk"></a>

`createObject('hd-desk', { variant: 'oak-classic' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-classic</b></sub></td><td align="center"><sub><b>walnut-drawers</b></sub></td><td align="center"><sub><b>industrial-frame</b></sub></td><td align="center"><sub><b>white-oak-compact</b></sub></td></tr>
</table>

**Variants:** `oak-classic`, `walnut-drawers`, `industrial-frame`, `white-oak-compact`


### Dining chair (HD) <a id="hd-dining-chair"></a>

`createObject('hd-dining-chair', { variant: 'oak-spindle' })` · 7 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-spindle</b></sub></td><td align="center"><sub><b>walnut-upholstered</b></sub></td><td align="center"><sub><b>ash-ladder-back</b></sub></td><td align="center"><sub><b>windsor-ebony</b></sub></td></tr>
<tr><td align="center"><sub><b>shell-white</b></sub></td><td align="center"><sub><b>industrial-black</b></sub></td><td align="center"><sub><b>cherry-padded</b></sub></td></tr>
</table>

**Variants:** `oak-spindle`, `walnut-upholstered`, `ash-ladder-back`, `windsor-ebony`, `shell-white`, `industrial-black`, `cherry-padded`

| Option | Description |
|---|---|
| `color` | seat / shell color |


### Dresser & cabinet (HD) <a id="hd-dresser"></a>

`createObject('hd-dresser', { variant: 'oak-six-drawer' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-six-drawer</b></sub></td><td align="center"><sub><b>walnut-mid-century</b></sub></td><td align="center"><sub><b>white-oak-nightstand</b></sub></td><td align="center"><sub><b>ebony-sideboard</b></sub></td></tr>
<tr><td align="center"><sub><b>cherry-tall-chest</b></sub></td></tr>
</table>

**Variants:** `oak-six-drawer`, `walnut-mid-century`, `white-oak-nightstand`, `ebony-sideboard`, `cherry-tall-chest`


### Floor lamp (HD) <a id="hd-floor-lamp"></a>

`createObject('hd-floor-lamp', { variant: 'column-brass' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>column-brass</b></sub></td><td align="center"><sub><b>column-black</b></sub></td><td align="center"><sub><b>arc-marble</b></sub></td></tr>
</table>

**Variants:** `column-brass`, `column-black`, `arc-marble`

| Option | Description |
|---|---|
| `color` | shade color |
| `secondaryColor` | fabric shade |


### Glassware (HD) <a id="hd-glassware"></a>

`createObject('hd-glassware', { variant: 'red-wine-pair' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>red-wine-pair</b></sub></td><td align="center"><sub><b>white-wine-pair</b></sub></td><td align="center"><sub><b>empty-trio</b></sub></td><td align="center"><sub><b>whisky-tumblers</b></sub></td></tr>
</table>

**Variants:** `red-wine-pair`, `white-wine-pair`, `empty-trio`, `whisky-tumblers`


### Jar set (HD) <a id="hd-jar-set"></a>

`createObject('hd-jar-set', { variant: 'pantry-wood-lids' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>pantry-wood-lids</b></sub></td><td align="center"><sub><b>steel-lids</b></sub></td></tr>
</table>

**Variants:** `pantry-wood-lids`, `steel-lids`


### Kettle (HD) <a id="hd-kettle"></a>

`createObject('hd-kettle', { variant: 'electric-white' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>electric-white</b></sub></td><td align="center"><sub><b>electric-black</b></sub></td><td align="center"><sub><b>stovetop-steel</b></sub></td><td align="center"><sub><b>stovetop-red-enamel</b></sub></td></tr>
</table>

**Variants:** `electric-white`, `electric-black`, `stovetop-steel`, `stovetop-red-enamel`

| Option | Description |
|---|---|
| `color` | body color |


### Knife block (HD) <a id="hd-knife-block"></a>

`createObject('hd-knife-block', { variant: 'walnut-black' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>walnut-black</b></sub></td><td align="center"><sub><b>oak-wood-handles</b></sub></td></tr>
</table>

**Variants:** `walnut-black`, `oak-wood-handles`


### Lamp (HD) <a id="hd-lamp"></a>

`createObject('hd-lamp', { variant: 'table-ceramic' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>table-ceramic</b></sub></td><td align="center"><sub><b>table-indigo</b></sub></td><td align="center"><sub><b>tripod-floor</b></sub></td><td align="center"><sub><b>desk-green</b></sub></td></tr>
<tr><td align="center"><sub><b>desk-black</b></sub></td></tr>
</table>

**Variants:** `table-ceramic`, `table-indigo`, `tripod-floor`, `desk-green`, `desk-black`

| Option | Description |
|---|---|
| `color` | base / body color |
| `secondaryColor` | shade |


### Mirror (HD) <a id="hd-mirror"></a>

`createObject('hd-mirror', { variant: 'arch-brass' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>arch-brass</b></sub></td><td align="center"><sub><b>rect-black</b></sub></td><td align="center"><sub><b>arch-oak</b></sub></td><td align="center"><sub><b>vanity-round</b></sub></td></tr>
</table>

**Variants:** `arch-brass`, `rect-black`, `arch-oak`, `vanity-round`


### Mug (HD) <a id="hd-mug"></a>

`createObject('hd-mug', { variant: 'white' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>white</b></sub></td><td align="center"><sub><b>speckled-stoneware</b></sub></td><td align="center"><sub><b>cobalt</b></sub></td><td align="center"><sub><b>sage</b></sub></td></tr>
</table>

**Variants:** `white`, `speckled-stoneware`, `cobalt`, `sage`

| Option | Description |
|---|---|
| `color` | glaze color |


### Office chair (HD) <a id="hd-office-chair"></a>

`createObject('hd-office-chair', { variant: 'mesh-black' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>mesh-black</b></sub></td><td align="center"><sub><b>executive-leather</b></sub></td><td align="center"><sub><b>task-grey</b></sub></td><td align="center"><sub><b>mesh-white-frame</b></sub></td></tr>
<tr><td align="center"><sub><b>fabric-blue</b></sub></td></tr>
</table>

**Variants:** `mesh-black`, `executive-leather`, `task-grey`, `mesh-white-frame`, `fabric-blue`

| Option | Description |
|---|---|
| `color` | upholstery / mesh color |


### Pendant lamp (HD) <a id="hd-pendant-lamp"></a>

`createObject('hd-pendant-lamp', { variant: 'dome-green' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>dome-green</b></sub></td><td align="center"><sub><b>dome-black</b></sub></td><td align="center"><sub><b>cone-white</b></sub></td><td align="center"><sub><b>glass-globe</b></sub></td></tr>
</table>

**Variants:** `dome-green`, `dome-black`, `cone-white`, `glass-globe`

| Option | Description |
|---|---|
| `color` | shade color |


### Picture frame (HD) <a id="hd-picture-frame"></a>

`createObject('hd-picture-frame', { variant: 'oak-abstract' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-abstract</b></sub></td><td align="center"><sub><b>black-print</b></sub></td><td align="center"><sub><b>gilt-classic</b></sub></td><td align="center"><sub><b>black-landscape</b></sub></td></tr>
</table>

**Variants:** `oak-abstract`, `black-print`, `gilt-classic`, `black-landscape`


### Potted plant (HD) <a id="hd-plant"></a>

`createObject('hd-plant', { variant: 'snake-plant' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>snake-plant</b></sub></td><td align="center"><sub><b>echeveria</b></sub></td><td align="center"><sub><b>barrel-cactus</b></sub></td><td align="center"><sub><b>column-cactus</b></sub></td></tr>
<tr><td align="center"><sub><b>ornamental-grass</b></sub></td></tr>
</table>

**Variants:** `snake-plant`, `echeveria`, `barrel-cactus`, `column-cactus`, `ornamental-grass`

| Option | Description |
|---|---|
| `color` | pot glaze (ceramic pots) |


### Plate & bowl (HD) <a id="hd-plate"></a>

`createObject('hd-plate', { variant: 'dinner-white' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>dinner-white</b></sub></td><td align="center"><sub><b>side-stoneware</b></sub></td><td align="center"><sub><b>pasta-deep</b></sub></td></tr>
</table>

**Variants:** `dinner-white`, `side-stoneware`, `pasta-deep`

| Option | Description |
|---|---|
| `color` | glaze color |


### Rug (HD) <a id="hd-rug"></a>

`createObject('hd-rug', { variant: 'persian-red' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>persian-red</b></sub></td><td align="center"><sub><b>kilim-terracotta</b></sub></td><td align="center"><sub><b>modern-blue</b></sub></td><td align="center"><sub><b>persian-navy</b></sub></td></tr>
</table>

**Variants:** `persian-red`, `kilim-terracotta`, `modern-blue`, `persian-navy`


### Sofa (HD) <a id="hd-sofa"></a>

`createObject('hd-sofa', { variant: 'modern-grey' })` · 6 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>modern-grey</b></sub></td><td align="center"><sub><b>loveseat-navy</b></sub></td><td align="center"><sub><b>rolled-arm-sage</b></sub></td><td align="center"><sub><b>leather-cognac</b></sub></td></tr>
<tr><td align="center"><sub><b>low-plinth-cream</b></sub></td><td align="center"><sub><b>four-seat-charcoal</b></sub></td></tr>
</table>

**Variants:** `modern-grey`, `loveseat-navy`, `rolled-arm-sage`, `leather-cognac`, `low-plinth-cream`, `four-seat-charcoal`

| Option | Description |
|---|---|
| `color` | upholstery color |
| `secondaryColor` | pillow color |


### Stand mixer (HD) <a id="hd-stand-mixer"></a>

`createObject('hd-stand-mixer', { variant: 'red' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>red</b></sub></td><td align="center"><sub><b>pastel-blue</b></sub></td><td align="center"><sub><b>black</b></sub></td></tr>
</table>

**Variants:** `red`, `pastel-blue`, `black`

| Option | Description |
|---|---|
| `color` | paint color |


### Table (HD) <a id="hd-table"></a>

`createObject('hd-table', { variant: 'oak-dining' })` · 7 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-dining</b></sub></td><td align="center"><sub><b>walnut-trestle</b></sub></td><td align="center"><sub><b>marble-round-pedestal</b></sub></td><td align="center"><sub><b>oak-coffee</b></sub></td></tr>
<tr><td align="center"><sub><b>marble-side</b></sub></td><td align="center"><sub><b>industrial-dining</b></sub></td><td align="center"><sub><b>glass-coffee</b></sub></td></tr>
</table>

**Variants:** `oak-dining`, `walnut-trestle`, `marble-round-pedestal`, `oak-coffee`, `marble-side`, `industrial-dining`, `glass-coffee`


### Teapot (HD) <a id="hd-teapot"></a>

`createObject('hd-teapot', { variant: 'white' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>white</b></sub></td><td align="center"><sub><b>jade</b></sub></td></tr>
</table>

**Variants:** `white`, `jade`

| Option | Description |
|---|---|
| `color` | glaze color |


### Throw blanket (HD) <a id="hd-throw-blanket"></a>

`createObject('hd-throw-blanket', { variant: 'knit-camel' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>knit-camel</b></sub></td><td align="center"><sub><b>knit-grey</b></sub></td><td align="center"><sub><b>wool-green</b></sub></td></tr>
</table>

**Variants:** `knit-camel`, `knit-grey`, `wool-green`


### Toaster (HD) <a id="hd-toaster"></a>

`createObject('hd-toaster', { variant: 'cream-retro' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>cream-retro</b></sub></td><td align="center"><sub><b>steel-with-toast</b></sub></td><td align="center"><sub><b>mint</b></sub></td></tr>
</table>

**Variants:** `cream-retro`, `steel-with-toast`, `mint`

| Option | Description |
|---|---|
| `color` | body color |


### TV stand (HD) <a id="hd-tv-stand"></a>

`createObject('hd-tv-stand', { variant: 'oak-slatted' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-slatted</b></sub></td><td align="center"><sub><b>walnut-long</b></sub></td><td align="center"><sub><b>ash-metal-legs</b></sub></td></tr>
</table>

**Variants:** `oak-slatted`, `walnut-long`, `ash-metal-legs`


### Vase (HD) <a id="hd-vase"></a>

`createObject('hd-vase', { variant: 'amphora-sand' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>amphora-sand</b></sub></td><td align="center"><sub><b>cylinder-black</b></sub></td><td align="center"><sub><b>bud-celadon</b></sub></td></tr>
</table>

**Variants:** `amphora-sand`, `cylinder-black`, `bud-celadon`

| Option | Description |
|---|---|
| `color` | glaze color |


### Wardrobe (HD) <a id="hd-wardrobe"></a>

`createObject('hd-wardrobe', { variant: 'oak-two-door' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-two-door</b></sub></td><td align="center"><sub><b>white-three-door</b></sub></td><td align="center"><sub><b>walnut-tall</b></sub></td><td align="center"><sub><b>sage-painted</b></sub></td></tr>
</table>

**Variants:** `oak-two-door`, `white-three-door`, `walnut-tall`, `sage-painted`

| Option | Description |
|---|---|
| `color` | paint color |


## Electronics

### TV <a id="tv"></a>

`createObject('tv', { variant: 'stand' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tv-stand.webp" width="200" alt="tv stand"><br><sub><b>stand</b></sub></td><td align="center"><img src="images/tv-wall.webp" width="200" alt="tv wall"><br><sub><b>wall</b></sub></td><td align="center"><sub><b>crt</b></sub></td><td align="center"><sub><b>tabletop</b></sub></td></tr>
</table>

**Variants:** `stand`, `wall`, `crt`, `tabletop`

| Option | Description |
|---|---|
| `size` | screen width (m) |
| `screenColor` | color |

**Animations:** `screen`


### Appliance <a id="appliance"></a>

`createObject('appliance', { variant: 'washing-machine' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/appliance-washing-machine.webp" width="200" alt="appliance washing-machine"><br><sub><b>washing-machine</b></sub></td><td align="center"><img src="images/appliance-dryer.webp" width="200" alt="appliance dryer"><br><sub><b>dryer</b></sub></td><td align="center"><sub><b>top-loader</b></sub></td></tr>
</table>

**Variants:** `washing-machine`, `dryer`, `top-loader`

| Option | Description |
|---|---|
| `color` | body color |

**Animations:** `on`, `doorOpen`, `spin`


### Small appliance <a id="small-appliance"></a>

`createObject('small-appliance', { variant: 'coffee-machine' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/small-appliance-coffee-machine.webp" width="200" alt="small-appliance coffee-machine"><br><sub><b>coffee-machine</b></sub></td><td align="center"><img src="images/small-appliance-toaster.webp" width="200" alt="small-appliance toaster"><br><sub><b>toaster</b></sub></td><td align="center"><sub><b>kettle</b></sub></td><td align="center"><sub><b>blender</b></sub></td></tr>
<tr><td align="center"><sub><b>stand-mixer</b></sub></td><td align="center"><sub><b>air-fryer</b></sub></td><td align="center"><sub><b>espresso-machine</b></sub></td></tr>
</table>

**Variants:** `coffee-machine`, `toaster`, `kettle`, `blender`, `stand-mixer`, `air-fryer`, `espresso-machine`

| Option | Description |
|---|---|
| `color` | body color |

**Animations:** `on`


### CCTV camera <a id="cctv"></a>

`createObject('cctv', { variant: 'bullet' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cctv-bullet.webp" width="200" alt="cctv bullet"><br><sub><b>bullet</b></sub></td><td align="center"><img src="images/cctv-dome.webp" width="200" alt="cctv dome"><br><sub><b>dome</b></sub></td><td align="center"><sub><b>ptz</b></sub></td></tr>
</table>

**Variants:** `bullet`, `dome`, `ptz`

**Animations:** `scan`


### Laptop <a id="laptop"></a>

`createObject('laptop', { variant: 'ultrabook-13' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/laptop-ultrabook-13.webp" width="200" alt="laptop ultrabook-13"><br><sub><b>ultrabook-13</b></sub></td><td align="center"><img src="images/laptop-pro-16.webp" width="200" alt="laptop pro-16"><br><sub><b>pro-16</b></sub></td><td align="center"><sub><b>gamer-17</b></sub></td><td align="center"><sub><b>convertible</b></sub></td></tr>
<tr><td align="center"><sub><b>student-11</b></sub></td><td align="center"><sub><b>workstation-15</b></sub></td></tr>
</table>

**Variants:** `ultrabook-13`, `pro-16`, `gamer-17`, `convertible`, `student-11`, `workstation-15`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`, `open`


### Desktop PC Set <a id="desktop-pc"></a>

`createObject('desktop-pc', { variant: 'tower-set' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/desktop-pc-tower-set.webp" width="200" alt="desktop-pc tower-set"><br><sub><b>tower-set</b></sub></td><td align="center"><img src="images/desktop-pc-gaming-rig.webp" width="200" alt="desktop-pc gaming-rig"><br><sub><b>gaming-rig</b></sub></td><td align="center"><sub><b>all-in-one</b></sub></td><td align="center"><sub><b>mini-pc</b></sub></td></tr>
<tr><td align="center"><sub><b>dual-monitor</b></sub></td><td align="center"><sub><b>small-form</b></sub></td></tr>
</table>

**Variants:** `tower-set`, `gaming-rig`, `all-in-one`, `mini-pc`, `dual-monitor`, `small-form`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Monitor <a id="monitor"></a>

`createObject('monitor', { variant: 'flat-24' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/monitor-flat-24.webp" width="200" alt="monitor flat-24"><br><sub><b>flat-24</b></sub></td><td align="center"><img src="images/monitor-ultrawide-curved.webp" width="200" alt="monitor ultrawide-curved"><br><sub><b>ultrawide-curved</b></sub></td><td align="center"><sub><b>portrait-pivot</b></sub></td><td align="center"><sub><b>studio-27</b></sub></td></tr>
<tr><td align="center"><sub><b>crt-15</b></sub></td><td align="center"><sub><b>arm-mounted-32</b></sub></td></tr>
</table>

**Variants:** `flat-24`, `ultrawide-curved`, `portrait-pivot`, `studio-27`, `crt-15`, `arm-mounted-32`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Computer Keyboard <a id="computer-keyboard"></a>

`createObject('computer-keyboard', { variant: 'full-size' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/computer-keyboard-full-size.webp" width="200" alt="computer-keyboard full-size"><br><sub><b>full-size</b></sub></td><td align="center"><img src="images/computer-keyboard-tenkeyless.webp" width="200" alt="computer-keyboard tenkeyless"><br><sub><b>tenkeyless</b></sub></td><td align="center"><sub><b>compact-60</b></sub></td><td align="center"><sub><b>low-profile</b></sub></td></tr>
<tr><td align="center"><sub><b>ergonomic-split</b></sub></td><td align="center"><sub><b>mechanical-wood</b></sub></td></tr>
</table>

**Variants:** `full-size`, `tenkeyless`, `compact-60`, `low-profile`, `ergonomic-split`, `mechanical-wood`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Mouse & Trackpad <a id="computer-mouse"></a>

`createObject('computer-mouse', { variant: 'office' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/computer-mouse-office.webp" width="200" alt="computer-mouse office"><br><sub><b>office</b></sub></td><td align="center"><img src="images/computer-mouse-esports.webp" width="200" alt="computer-mouse esports"><br><sub><b>esports</b></sub></td><td align="center"><sub><b>vertical</b></sub></td><td align="center"><sub><b>trackball</b></sub></td></tr>
<tr><td align="center"><sub><b>travel-mini</b></sub></td><td align="center"><sub><b>trackpad</b></sub></td></tr>
</table>

**Variants:** `office`, `esports`, `vertical`, `trackball`, `travel-mini`, `trackpad`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Printer <a id="printer"></a>

`createObject('printer', { variant: 'inkjet' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/printer-inkjet.webp" width="200" alt="printer inkjet"><br><sub><b>inkjet</b></sub></td><td align="center"><img src="images/printer-laser.webp" width="200" alt="printer laser"><br><sub><b>laser</b></sub></td><td align="center"><sub><b>all-in-one</b></sub></td><td align="center"><sub><b>photo-mini</b></sub></td></tr>
<tr><td align="center"><sub><b>receipt</b></sub></td><td align="center"><sub><b>wide-format</b></sub></td></tr>
</table>

**Variants:** `inkjet`, `laser`, `all-in-one`, `photo-mini`, `receipt`, `wide-format`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Wi-Fi Router <a id="wifi-router"></a>

`createObject('wifi-router', { variant: 'antenna-4' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wifi-router-antenna-4.webp" width="200" alt="wifi-router antenna-4"><br><sub><b>antenna-4</b></sub></td><td align="center"><img src="images/wifi-router-gaming-8.webp" width="200" alt="wifi-router gaming-8"><br><sub><b>gaming-8</b></sub></td><td align="center"><sub><b>mesh-node</b></sub></td><td align="center"><sub><b>tower-ap</b></sub></td></tr>
<tr><td align="center"><sub><b>cable-modem</b></sub></td><td align="center"><sub><b>travel-mini</b></sub></td></tr>
</table>

**Variants:** `antenna-4`, `gaming-8`, `mesh-node`, `tower-ap`, `cable-modem`, `travel-mini`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Retro Computer <a id="retro-computer"></a>

`createObject('retro-computer', { variant: 'wedge-8bit' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/retro-computer-wedge-8bit.webp" width="200" alt="retro-computer wedge-8bit"><br><sub><b>wedge-8bit</b></sub></td><td align="center"><img src="images/retro-computer-beige-box.webp" width="200" alt="retro-computer beige-box"><br><sub><b>beige-box</b></sub></td><td align="center"><sub><b>compact-mac</b></sub></td><td align="center"><sub><b>luggable</b></sub></td></tr>
<tr><td align="center"><sub><b>terminal</b></sub></td><td align="center"><sub><b>home-micro</b></sub></td></tr>
</table>

**Variants:** `wedge-8bit`, `beige-box`, `compact-mac`, `luggable`, `terminal`, `home-micro`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Smartphone <a id="smartphone"></a>

`createObject('smartphone', { variant: 'flagship' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/smartphone-flagship.webp" width="200" alt="smartphone flagship"><br><sub><b>flagship</b></sub></td><td align="center"><sub><b>compact</b></sub></td><td align="center"><sub><b>max</b></sub></td><td align="center"><sub><b>camera-pro</b></sub></td></tr>
<tr><td align="center"><sub><b>budget</b></sub></td><td align="center"><sub><b>foldable</b></sub></td><td align="center"><sub><b>flip</b></sub></td></tr>
</table>

**Variants:** `flagship`, `compact`, `max`, `camera-pro`, `budget`, `foldable`, `flip`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Tablet <a id="tablet"></a>

`createObject('tablet', { variant: 'slate-11' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tablet-slate-11.webp" width="200" alt="tablet slate-11"><br><sub><b>slate-11</b></sub></td><td align="center"><sub><b>mini-8</b></sub></td><td align="center"><sub><b>pro-13</b></sub></td><td align="center"><sub><b>drawing-pad</b></sub></td></tr>
<tr><td align="center"><sub><b>kids-edition</b></sub></td><td align="center"><sub><b>landscape-dock</b></sub></td></tr>
</table>

**Variants:** `slate-11`, `mini-8`, `pro-13`, `drawing-pad`, `kids-edition`, `landscape-dock`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### E-Reader <a id="e-reader"></a>

`createObject('e-reader', { variant: 'basic-6' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/e-reader-basic-6.webp" width="200" alt="e-reader basic-6"><br><sub><b>basic-6</b></sub></td><td align="center"><sub><b>glow-7</b></sub></td><td align="center"><sub><b>page-turn</b></sub></td><td align="center"><sub><b>scribe-10</b></sub></td></tr>
<tr><td align="center"><sub><b>color-ink</b></sub></td><td align="center"><sub><b>in-cover</b></sub></td></tr>
</table>

**Variants:** `basic-6`, `glow-7`, `page-turn`, `scribe-10`, `color-ink`, `in-cover`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Smartwatch & Band <a id="smartwatch"></a>

`createObject('smartwatch', { variant: 'square-45' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/smartwatch-square-45.webp" width="200" alt="smartwatch square-45"><br><sub><b>square-45</b></sub></td><td align="center"><sub><b>round-classic</b></sub></td><td align="center"><sub><b>sport-41</b></sub></td><td align="center"><sub><b>outdoor-ultra</b></sub></td></tr>
<tr><td align="center"><sub><b>fitness-band</b></sub></td><td align="center"><sub><b>hybrid-analog</b></sub></td></tr>
</table>

**Variants:** `square-45`, `round-classic`, `sport-41`, `outdoor-ultra`, `fitness-band`, `hybrid-analog`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Wireless Earbuds <a id="wireless-earbuds"></a>

`createObject('wireless-earbuds', { variant: 'stem-buds' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wireless-earbuds-stem-buds.webp" width="200" alt="wireless-earbuds stem-buds"><br><sub><b>stem-buds</b></sub></td><td align="center"><sub><b>round-buds</b></sub></td><td align="center"><sub><b>sport-hooks</b></sub></td><td align="center"><sub><b>open-ear</b></sub></td></tr>
<tr><td align="center"><sub><b>gaming-buds</b></sub></td><td align="center"><sub><b>pro-buds</b></sub></td></tr>
</table>

**Variants:** `stem-buds`, `round-buds`, `sport-hooks`, `open-ear`, `gaming-buds`, `pro-buds`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Wireless Headphones <a id="wireless-headphones"></a>

`createObject('wireless-headphones', { variant: 'over-ear' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wireless-headphones-over-ear.webp" width="200" alt="wireless-headphones over-ear"><br><sub><b>over-ear</b></sub></td><td align="center"><sub><b>on-ear</b></sub></td><td align="center"><sub><b>studio</b></sub></td><td align="center"><sub><b>gaming-headset</b></sub></td></tr>
<tr><td align="center"><sub><b>kids-volume-limit</b></sub></td><td align="center"><sub><b>sport-neckband</b></sub></td></tr>
</table>

**Variants:** `over-ear`, `on-ear`, `studio`, `gaming-headset`, `kids-volume-limit`, `sport-neckband`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `stand` | boolean |

**Animations:** `on`


### Camera <a id="digital-camera"></a>

`createObject('digital-camera', { variant: 'compact' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/digital-camera-compact.webp" width="200" alt="digital-camera compact"><br><sub><b>compact</b></sub></td><td align="center"><sub><b>dslr</b></sub></td><td align="center"><sub><b>mirrorless</b></sub></td><td align="center"><sub><b>action-cam</b></sub></td></tr>
<tr><td align="center"><sub><b>instant</b></sub></td><td align="center"><sub><b>gimbal-vlog</b></sub></td></tr>
</table>

**Variants:** `compact`, `dslr`, `mirrorless`, `action-cam`, `instant`, `gimbal-vlog`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`, `dial`


### Smart Speaker & Display <a id="smart-speaker"></a>

`createObject('smart-speaker', { variant: 'cylinder' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/smart-speaker-cylinder.webp" width="200" alt="smart-speaker cylinder"><br><sub><b>cylinder</b></sub></td><td align="center"><sub><b>puck</b></sub></td><td align="center"><sub><b>sphere</b></sub></td><td align="center"><sub><b>smart-display</b></sub></td></tr>
<tr><td align="center"><sub><b>tall-tower</b></sub></td><td align="center"><sub><b>mini-orb</b></sub></td></tr>
</table>

**Variants:** `cylinder`, `puck`, `sphere`, `smart-display`, `tall-tower`, `mini-orb`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Game Controller <a id="game-controller"></a>

`createObject('game-controller', { variant: 'standard' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/game-controller-standard.webp" width="200" alt="game-controller standard"><br><sub><b>standard</b></sub></td><td align="center"><sub><b>pro-offset</b></sub></td><td align="center"><sub><b>retro-pad</b></sub></td><td align="center"><sub><b>arcade-stick</b></sub></td></tr>
<tr><td align="center"><sub><b>racing-wheel</b></sub></td><td align="center"><sub><b>motion-pair</b></sub></td></tr>
</table>

**Variants:** `standard`, `pro-offset`, `retro-pad`, `arcade-stick`, `racing-wheel`, `motion-pair`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Game Console <a id="game-console"></a>

`createObject('game-console', { variant: 'home-box' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/game-console-home-box.webp" width="200" alt="game-console home-box"><br><sub><b>home-box</b></sub></td><td align="center"><sub><b>tower-upright</b></sub></td><td align="center"><sub><b>curved-slim</b></sub></td><td align="center"><sub><b>hybrid-dock</b></sub></td></tr>
<tr><td align="center"><sub><b>retro-cartridge</b></sub></td><td align="center"><sub><b>portable-handheld</b></sub></td></tr>
</table>

**Variants:** `home-box`, `tower-upright`, `curved-slim`, `hybrid-dock`, `retro-cartridge`, `portable-handheld`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### VR Headset & Smart Glasses <a id="vr-headset"></a>

`createObject('vr-headset', { variant: 'standalone' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/vr-headset-standalone.webp" width="200" alt="vr-headset standalone"><br><sub><b>standalone</b></sub></td><td align="center"><sub><b>tethered-pc</b></sub></td><td align="center"><sub><b>slim-goggles</b></sub></td><td align="center"><sub><b>mixed-reality-visor</b></sub></td></tr>
<tr><td align="center"><sub><b>with-controllers</b></sub></td><td align="center"><sub><b>smart-glasses</b></sub></td></tr>
</table>

**Variants:** `standalone`, `tethered-pc`, `slim-goggles`, `mixed-reality-visor`, `with-controllers`, `smart-glasses`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Streaming & Projector <a id="media-device"></a>

`createObject('media-device', { variant: 'streaming-stick' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/media-device-streaming-stick.webp" width="200" alt="media-device streaming-stick"><br><sub><b>streaming-stick</b></sub></td><td align="center"><sub><b>set-top-box</b></sub></td><td align="center"><sub><b>home-projector</b></sub></td><td align="center"><sub><b>pico-projector</b></sub></td></tr>
<tr><td align="center"><sub><b>webcam</b></sub></td><td align="center"><sub><b>streaming-puck</b></sub></td></tr>
</table>

**Variants:** `streaming-stick`, `set-top-box`, `home-projector`, `pico-projector`, `webcam`, `streaming-puck`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Power & Storage <a id="power-accessory"></a>

`createObject('power-accessory', { variant: 'power-bank' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/power-accessory-power-bank.webp" width="200" alt="power-accessory power-bank"><br><sub><b>power-bank</b></sub></td><td align="center"><sub><b>magnetic-pack</b></sub></td><td align="center"><sub><b>wireless-pad</b></sub></td><td align="center"><sub><b>charging-stand-3in1</b></sub></td></tr>
<tr><td align="center"><sub><b>external-ssd</b></sub></td><td align="center"><sub><b>desktop-hdd</b></sub></td></tr>
</table>

**Variants:** `power-bank`, `magnetic-pack`, `wireless-pad`, `charging-stand-3in1`, `external-ssd`, `desktop-hdd`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Smart Home Gadget <a id="smart-home"></a>

`createObject('smart-home', { variant: 'thermostat' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/smart-home-thermostat.webp" width="200" alt="smart-home thermostat"><br><sub><b>thermostat</b></sub></td><td align="center"><sub><b>video-doorbell</b></sub></td><td align="center"><sub><b>smart-bulb</b></sub></td><td align="center"><sub><b>smart-plug</b></sub></td></tr>
<tr><td align="center"><sub><b>smart-lock</b></sub></td><td align="center"><sub><b>hub-display</b></sub></td></tr>
</table>

**Variants:** `thermostat`, `video-doorbell`, `smart-bulb`, `smart-plug`, `smart-lock`, `hub-display`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`, `dial`


### Speaker <a id="music-speaker"></a>

`createObject('music-speaker', { variant: 'pa-speaker' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/music-speaker-pa-speaker.webp" width="200" alt="music-speaker pa-speaker"><br><sub><b>pa-speaker</b></sub></td><td align="center"><sub><b>studio-monitors</b></sub></td><td align="center"><sub><b>floor-wedge</b></sub></td><td align="center"><sub><b>subwoofer</b></sub></td></tr>
<tr><td align="center"><sub><b>line-array</b></sub></td><td align="center"><sub><b>hifi-tower</b></sub></td></tr>
</table>

**Variants:** `pa-speaker`, `studio-monitors`, `floor-wedge`, `subwoofer`, `line-array`, `hifi-tower`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `pump`


### Records & Players <a id="vinyl-player"></a>

`createObject('vinyl-player', { variant: 'record-player' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/vinyl-player-record-player.webp" width="200" alt="vinyl-player record-player"><br><sub><b>record-player</b></sub></td><td align="center"><sub><b>hifi-turntable</b></sub></td><td align="center"><sub><b>gramophone</b></sub></td><td align="center"><sub><b>record-crate</b></sub></td></tr>
<tr><td align="center"><sub><b>jukebox</b></sub></td><td align="center"><sub><b>boombox</b></sub></td></tr>
</table>

**Variants:** `record-player`, `hifi-turntable`, `gramophone`, `record-crate`, `jukebox`, `boombox`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Circuit Board <a id="tech-circuit-board"></a>

`createObject('tech-circuit-board', { variant: 'micro-board' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tech-circuit-board-micro-board.webp" width="200" alt="tech-circuit-board micro-board"><br><sub><b>micro-board</b></sub></td><td align="center"><sub><b>pcb-large</b></sub></td><td align="center"><sub><b>breadboard</b></sub></td><td align="center"><sub><b>motherboard</b></sub></td></tr>
<tr><td align="center"><sub><b>led-matrix</b></sub></td></tr>
</table>

**Variants:** `micro-board`, `pcb-large`, `breadboard`, `motherboard`, `led-matrix`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Robot Arm <a id="tech-robot-arm"></a>

`createObject('tech-robot-arm', { variant: 'industrial-6axis' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tech-robot-arm-industrial-6axis.webp" width="200" alt="tech-robot-arm industrial-6axis"><br><sub><b>industrial-6axis</b></sub></td><td align="center"><sub><b>desktop</b></sub></td><td align="center"><sub><b>scara</b></sub></td><td align="center"><sub><b>gantry-gripper</b></sub></td></tr>
<tr><td align="center"><sub><b>cobot</b></sub></td></tr>
</table>

**Variants:** `industrial-6axis`, `desktop`, `scara`, `gantry-gripper`, `cobot`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `work`


### Humanoid Robot <a id="tech-humanoid"></a>

`createObject('tech-humanoid', { variant: 'service' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tech-humanoid-service.webp" width="200" alt="tech-humanoid service"><br><sub><b>service</b></sub></td><td align="center"><sub><b>companion</b></sub></td><td align="center"><sub><b>android</b></sub></td><td align="center"><sub><b>biped-kit</b></sub></td></tr>
<tr><td align="center"><sub><b>wheeled-assistant</b></sub></td></tr>
</table>

**Variants:** `service`, `companion`, `android`, `biped-kit`, `wheeled-assistant`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `wave`, `look`, `on`


### Drone <a id="tech-drone"></a>

`createObject('tech-drone', { variant: 'quad' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tech-drone-quad.webp" width="200" alt="tech-drone quad"><br><sub><b>quad</b></sub></td><td align="center"><sub><b>hex</b></sub></td><td align="center"><sub><b>fpv</b></sub></td><td align="center"><sub><b>delivery</b></sub></td></tr>
<tr><td align="center"><sub><b>mapping-wing</b></sub></td></tr>
</table>

**Variants:** `quad`, `hex`, `fpv`, `delivery`, `mapping-wing`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `fly`, `on`


### 3D Printer <a id="tech-3d-printer"></a>

`createObject('tech-3d-printer', { variant: 'cartesian' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tech-3d-printer-cartesian.webp" width="200" alt="tech-3d-printer cartesian"><br><sub><b>cartesian</b></sub></td><td align="center"><sub><b>corexy</b></sub></td><td align="center"><sub><b>delta</b></sub></td><td align="center"><sub><b>resin</b></sub></td></tr>
</table>

**Variants:** `cartesian`, `corexy`, `delta`, `resin`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `print`, `on`


### Server Rack <a id="tech-server-rack"></a>

`createObject('tech-server-rack', { variant: '42u' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tech-server-rack-42u.webp" width="200" alt="tech-server-rack 42u"><br><sub><b>42u</b></sub></td><td align="center"><sub><b>half-rack</b></sub></td><td align="center"><sub><b>open-frame</b></sub></td><td align="center"><sub><b>network-cabinet</b></sub></td></tr>
</table>

**Variants:** `42u`, `half-rack`, `open-frame`, `network-cabinet`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `blink`, `open`, `on`


### Extension Cord & Plug <a id="extension-cord"></a>

`createObject('extension-cord', { variant: 'power-strip' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/extension-cord-power-strip.webp" width="200" alt="extension-cord power-strip"><br><sub><b>power-strip</b></sub></td><td align="center"><sub><b>cord-reel</b></sub></td><td align="center"><sub><b>extension-lead</b></sub></td><td align="center"><sub><b>plug</b></sub></td></tr>
<tr><td align="center"><sub><b>travel-adapter</b></sub></td><td align="center"><sub><b>phone-charger</b></sub></td></tr>
</table>

**Variants:** `power-strip`, `cord-reel`, `extension-lead`, `plug`, `travel-adapter`, `phone-charger`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Remote Control <a id="remote-control"></a>

`createObject('remote-control', { variant: 'tv-remote' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/remote-control-tv-remote.webp" width="200" alt="remote-control tv-remote"><br><sub><b>tv-remote</b></sub></td><td align="center"><sub><b>ac-remote</b></sub></td><td align="center"><sub><b>streaming-remote</b></sub></td><td align="center"><sub><b>universal-remote</b></sub></td></tr>
<tr><td align="center"><sub><b>car-key-fob</b></sub></td><td align="center"><sub><b>garage-remote</b></sub></td></tr>
</table>

**Variants:** `tv-remote`, `ac-remote`, `streaming-remote`, `universal-remote`, `car-key-fob`, `garage-remote`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Camera (HD) <a id="hd-camera"></a>

`createObject('hd-camera', { variant: 'dslr' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>dslr</b></sub></td><td align="center"><sub><b>vintage-rangefinder</b></sub></td></tr>
</table>

**Variants:** `dslr`, `vintage-rangefinder`


### Headphones (HD) <a id="hd-headphones"></a>

`createObject('hd-headphones', { variant: 'black' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>black</b></sub></td><td align="center"><sub><b>cream</b></sub></td></tr>
</table>

**Variants:** `black`, `cream`

| Option | Description |
|---|---|
| `color` | body color |


### Laptop (HD) <a id="hd-laptop"></a>

`createObject('hd-laptop', { variant: 'silver' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>silver</b></sub></td><td align="center"><sub><b>space-grey-on</b></sub></td><td align="center"><sub><b>black-business</b></sub></td></tr>
</table>

**Variants:** `silver`, `space-grey-on`, `black-business`


### Monitor (HD) <a id="hd-monitor"></a>

`createObject('hd-monitor', { variant: '27-inch-black' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>27-inch-black</b></sub></td><td align="center"><sub><b>24-inch-white-on</b></sub></td></tr>
</table>

**Variants:** `27-inch-black`, `24-inch-white-on`


### Smartphone (HD) <a id="hd-smartphone"></a>

`createObject('hd-smartphone', { variant: 'graphite' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>graphite</b></sub></td><td align="center"><sub><b>silver</b></sub></td></tr>
</table>

**Variants:** `graphite`, `silver`


### Speaker (HD) <a id="hd-speaker"></a>

`createObject('hd-speaker', { variant: 'bookshelf-walnut' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>bookshelf-walnut</b></sub></td><td align="center"><sub><b>bookshelf-oak</b></sub></td><td align="center"><sub><b>smart-grey</b></sub></td><td align="center"><sub><b>portable-blue</b></sub></td></tr>
</table>

**Variants:** `bookshelf-walnut`, `bookshelf-oak`, `smart-grey`, `portable-blue`

| Option | Description |
|---|---|
| `color` | fabric color |


### TV (HD) <a id="hd-tv"></a>

`createObject('hd-tv', { variant: '55-inch-feet' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>55-inch-feet</b></sub></td><td align="center"><sub><b>65-inch-pedestal</b></sub></td></tr>
</table>

**Variants:** `55-inch-feet`, `65-inch-pedestal`


## Buildings

### House <a id="house"></a>

`createObject('house', { variant: 'cottage' })` · 16 versions · procedural JS

<table>
<tr><td align="center"><img src="images/house-cottage.webp" width="200" alt="house cottage"><br><sub><b>cottage</b></sub></td><td align="center"><img src="images/house-suburban.webp" width="200" alt="house suburban"><br><sub><b>suburban</b></sub></td><td align="center"><sub><b>modern</b></sub></td><td align="center"><sub><b>farmhouse</b></sub></td></tr>
<tr><td align="center"><sub><b>bungalow</b></sub></td><td align="center"><img src="images/house-victorian.webp" width="200" alt="house victorian"><br><sub><b>victorian</b></sub></td><td align="center"><sub><b>cabin</b></sub></td><td align="center"><img src="images/house-townhouse.webp" width="200" alt="house townhouse"><br><sub><b>townhouse</b></sub></td></tr>
<tr><td align="center"><sub><b>mansion</b></sub></td><td align="center"><sub><b>duplex</b></sub></td><td align="center"><sub><b>ranch</b></sub></td><td align="center"><sub><b>a-frame</b></sub></td></tr>
<tr><td align="center"><sub><b>villa</b></sub></td><td align="center"><sub><b>beach-house</b></sub></td><td align="center"><sub><b>mobile-home</b></sub></td><td align="center"><sub><b>tiny-house</b></sub></td></tr>
</table>

**Variants:** `cottage`, `suburban`, `modern`, `farmhouse`, `bungalow`, `victorian`, `cabin`, `townhouse`, `mansion`, `duplex`, `ranch`, `a-frame`, `villa`, `beach-house`, `mobile-home`, `tiny-house`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof color |
| `trimColor` | trim color |
| `accentColor` | shutters/porch |
| `doorColor` | door |
| `seed` | townhouse brick tones |
| `lightsOn` | windows lit at night |

**Animations:** `doorOpen`, `lights`


### Apartment <a id="apartment"></a>

`createObject('apartment', { variant: 'brick' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/apartment-brick.webp" width="200" alt="apartment brick"><br><sub><b>brick</b></sub></td><td align="center"><img src="images/apartment-modern.webp" width="200" alt="apartment modern"><br><sub><b>modern</b></sub></td><td align="center"><sub><b>classic</b></sub></td><td align="center"><sub><b>tower</b></sub></td></tr>
</table>

**Variants:** `brick`, `modern`, `classic`, `tower`

| Option | Description |
|---|---|
| `floors` | number of floors (2–40) |
| `color` | wall color |
| `roofColor` | roof |
| `trimColor` | trim |
| `accentColor` | railings/frames |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Skyscraper <a id="skyscraper"></a>

`createObject('skyscraper', { variant: 'glass' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/skyscraper-glass.webp" width="200" alt="skyscraper glass"><br><sub><b>glass</b></sub></td><td align="center"><img src="images/skyscraper-office.webp" width="200" alt="skyscraper office"><br><sub><b>office</b></sub></td><td align="center"><sub><b>tapered</b></sub></td><td align="center"><sub><b>art-deco</b></sub></td></tr>
<tr><td align="center"><img src="images/skyscraper-twisted.webp" width="200" alt="skyscraper twisted"><br><sub><b>twisted</b></sub></td><td align="center"><sub><b>cylinder</b></sub></td></tr>
</table>

**Variants:** `glass`, `office`, `tapered`, `art-deco`, `twisted`, `cylinder`

| Option | Description |
|---|---|
| `floors` | number of floors (8–120) |
| `color` | glass tint |
| `trimColor` | mullions/stone |
| `seed` | lit-window pattern |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Shop <a id="shop"></a>

`createObject('shop', { variant: 'cafe' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shop-cafe.webp" width="200" alt="shop cafe"><br><sub><b>cafe</b></sub></td><td align="center"><img src="images/shop-grocery.webp" width="200" alt="shop grocery"><br><sub><b>grocery</b></sub></td><td align="center"><sub><b>bakery</b></sub></td><td align="center"><sub><b>gas-station</b></sub></td></tr>
<tr><td align="center"><sub><b>pharmacy</b></sub></td><td align="center"><sub><b>restaurant</b></sub></td></tr>
</table>

**Variants:** `cafe`, `grocery`, `bakery`, `gas-station`, `pharmacy`, `restaurant`

| Option | Description |
|---|---|
| `color` | wall color |
| `accentColor` | awning color |
| `trimColor` | trim/brand color |
| `roofColor` | roof |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Garage <a id="garage"></a>

`createObject('garage', { variant: 'single' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garage-single.webp" width="200" alt="garage single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/garage-double.webp" width="200" alt="garage double"><br><sub><b>double</b></sub></td><td align="center"><sub><b>carport</b></sub></td></tr>
</table>

**Variants:** `single`, `double`, `carport`

| Option | Description |
|---|---|
| `color` | wall |
| `roofColor` | roof |
| `doorColor` | garage door |

**Animations:** `doorOpen`, `lights`, `garageOpen`


### Barn <a id="barn"></a>

`createObject('barn', { variant: 'gambrel' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/barn-gambrel.webp" width="200" alt="barn gambrel"><br><sub><b>gambrel</b></sub></td><td align="center"><img src="images/barn-gable.webp" width="200" alt="barn gable"><br><sub><b>gable</b></sub></td></tr>
</table>

**Variants:** `gambrel`, `gable`

| Option | Description |
|---|---|
| `color` | wall |
| `roofColor` | roof |
| `trimColor` | trim |

**Animations:** `lights`, `doorsSlide`


### Church <a id="church"></a>

`createObject('church', { variant: 'chapel' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/church-chapel.webp" width="200" alt="church chapel"><br><sub><b>chapel</b></sub></td><td align="center"><img src="images/church-stone.webp" width="200" alt="church stone"><br><sub><b>stone</b></sub></td></tr>
</table>

**Variants:** `chapel`, `stone`

| Option | Description |
|---|---|
| `color` | wall |
| `roofColor` | roof |
| `lightsOn` | stained glass glow |

**Animations:** `doorOpen`, `lights`, `bell`


### School <a id="school"></a>

`createObject('school', { variant: 'standard' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/school-standard.webp" width="200" alt="school standard"><br><sub><b>standard</b></sub></td><td align="center"><img src="images/school-modern.webp" width="200" alt="school modern"><br><sub><b>modern</b></sub></td></tr>
</table>

**Variants:** `standard`, `modern`

| Option | Description |
|---|---|
| `color` | wall |
| `trimColor` | trim |
| `flagColor` | flag |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`, `flag`, `clock`


### Fire station <a id="fire-station"></a>

`createObject('fire-station', { variant: 'standard' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fire-station-standard.webp" width="200" alt="fire-station standard"><br><sub><b>standard</b></sub></td><td align="center"><img src="images/fire-station-modern.webp" width="200" alt="fire-station modern"><br><sub><b>modern</b></sub></td></tr>
</table>

**Variants:** `standard`, `modern`

| Option | Description |
|---|---|
| `color` | wall |
| `doorColor` | bay doors |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`, `garageOpen`, `alarm`


### Hospital <a id="hospital"></a>

`createObject('hospital', { variant: 'standard' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hospital-standard.webp" width="200" alt="hospital standard"><br><sub><b>standard</b></sub></td><td align="center"><img src="images/hospital-clinic.webp" width="200" alt="hospital clinic"><br><sub><b>clinic</b></sub></td></tr>
</table>

**Variants:** `standard`, `clinic`

| Option | Description |
|---|---|
| `floors` | number |
| `color` | wall |
| `trimColor` | window frames |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Warehouse <a id="warehouse"></a>

`createObject('warehouse', { variant: 'standard' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/warehouse-standard.webp" width="200" alt="warehouse standard"><br><sub><b>standard</b></sub></td><td align="center"><img src="images/warehouse-cold.webp" width="200" alt="warehouse cold"><br><sub><b>cold</b></sub></td></tr>
</table>

**Variants:** `standard`, `cold`

| Option | Description |
|---|---|
| `color` | cladding |
| `roofColor` | roof |
| `trimColor` | brand band |
| `doorColor` | dock doors |

**Animations:** `doorOpen`, `lights`, `garageOpen`


### Lighthouse <a id="lighthouse"></a>

`createObject('lighthouse', { variant: 'striped' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lighthouse-striped.webp" width="200" alt="lighthouse striped"><br><sub><b>striped</b></sub></td><td align="center"><sub><b>classic</b></sub></td></tr>
</table>

**Variants:** `striped`, `classic`

| Option | Description |
|---|---|
| `color` | band A |
| `accentColor` | band B |
| `beams` | true adds light beams |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`, `beam`


### Windmill <a id="windmill"></a>

`createObject('windmill', { variant: 'dutch' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/windmill-dutch.webp" width="200" alt="windmill dutch"><br><sub><b>dutch</b></sub></td><td align="center"><sub><b>stone</b></sub></td><td align="center"><sub><b>windpump</b></sub></td></tr>
</table>

**Variants:** `dutch`, `stone`, `windpump`

| Option | Description |
|---|---|
| `color` | tower |
| `sailColor` | sails |

**Animations:** `doorOpen`, `lights`, `spin`


### Tent <a id="tent"></a>

`createObject('tent', { variant: 'dome' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tent-dome.webp" width="200" alt="tent dome"><br><sub><b>dome</b></sub></td><td align="center"><sub><b>a-frame</b></sub></td><td align="center"><sub><b>circus</b></sub></td></tr>
</table>

**Variants:** `dome`, `a-frame`, `circus`

| Option | Description |
|---|---|
| `color` | fabric |
| `accentColor` | trim fabric |

**Animations:** `flap`


### Hotel <a id="hotel"></a>

`createObject('hotel', { variant: 'highrise' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hotel-highrise.webp" width="200" alt="hotel highrise"><br><sub><b>highrise</b></sub></td><td align="center"><sub><b>motel</b></sub></td><td align="center"><sub><b>resort</b></sub></td><td align="center"><sub><b>boutique</b></sub></td></tr>
</table>

**Variants:** `highrise`, `motel`, `resort`, `boutique`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof |
| `trimColor` | trim |
| `accentColor` | canopy/doors |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Office <a id="office"></a>

`createObject('office', { variant: 'lowrise' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/office-lowrise.webp" width="200" alt="office lowrise"><br><sub><b>lowrise</b></sub></td><td align="center"><sub><b>midrise</b></sub></td><td align="center"><sub><b>campus</b></sub></td></tr>
</table>

**Variants:** `lowrise`, `midrise`, `campus`

| Option | Description |
|---|---|
| `color` | wall color |
| `trimColor` | bands/fins |
| `accentColor` | glass tint |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Bank <a id="bank"></a>

`createObject('bank', { variant: 'classic' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bank-classic.webp" width="200" alt="bank classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>modern</b></sub></td></tr>
</table>

**Variants:** `classic`, `modern`

| Option | Description |
|---|---|
| `color` | wall color |
| `trimColor` | columns/trim |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Police Station <a id="police-station"></a>

`createObject('police-station', { variant: 'standard' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/police-station-standard.webp" width="200" alt="police-station standard"><br><sub><b>standard</b></sub></td><td align="center"><sub><b>modern</b></sub></td></tr>
</table>

**Variants:** `standard`, `modern`

| Option | Description |
|---|---|
| `color` | wall color |
| `trimColor` | trim |
| `accentColor` | police blue |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Restaurant <a id="restaurant"></a>

`createObject('restaurant', { variant: 'diner' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/restaurant-diner.webp" width="200" alt="restaurant diner"><br><sub><b>diner</b></sub></td><td align="center"><sub><b>pizzeria</b></sub></td><td align="center"><sub><b>fast-food</b></sub></td><td align="center"><sub><b>steakhouse</b></sub></td></tr>
<tr><td align="center"><sub><b>sushi</b></sub></td></tr>
</table>

**Variants:** `diner`, `pizzeria`, `fast-food`, `steakhouse`, `sushi`

| Option | Description |
|---|---|
| `color` | wall color |
| `trimColor` | brand color |
| `accentColor` | awning/umbrellas |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Supermarket & Mall <a id="supermarket"></a>

`createObject('supermarket', { variant: 'supermarket' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/supermarket-supermarket.webp" width="200" alt="supermarket supermarket"><br><sub><b>supermarket</b></sub></td><td align="center"><sub><b>mall</b></sub></td><td align="center"><sub><b>big-box</b></sub></td></tr>
</table>

**Variants:** `supermarket`, `mall`, `big-box`

| Option | Description |
|---|---|
| `color` | wall color |
| `trimColor` | brand color |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Gas Station <a id="gas-station"></a>

`createObject('gas-station', { variant: 'modern' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gas-station-modern.webp" width="200" alt="gas-station modern"><br><sub><b>modern</b></sub></td><td align="center"><sub><b>retro</b></sub></td><td align="center"><sub><b>truck-stop</b></sub></td></tr>
</table>

**Variants:** `modern`, `retro`, `truck-stop`

| Option | Description |
|---|---|
| `color` | wall color |
| `trimColor` | brand color |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Museum & Library <a id="museum"></a>

`createObject('museum', { variant: 'classical' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/museum-classical.webp" width="200" alt="museum classical"><br><sub><b>classical</b></sub></td><td align="center"><sub><b>modern</b></sub></td><td align="center"><sub><b>library</b></sub></td><td align="center"><sub><b>modern-library</b></sub></td></tr>
</table>

**Variants:** `classical`, `modern`, `library`, `modern-library`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof/dome |
| `trimColor` | columns/trim |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### City Hall & Courthouse <a id="civic-hall"></a>

`createObject('civic-hall', { variant: 'city-hall' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/civic-hall-city-hall.webp" width="200" alt="civic-hall city-hall"><br><sub><b>city-hall</b></sub></td><td align="center"><sub><b>courthouse</b></sub></td><td align="center"><sub><b>town-hall</b></sub></td></tr>
</table>

**Variants:** `city-hall`, `courthouse`, `town-hall`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof/dome |
| `trimColor` | trim |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Castle & Palace <a id="castle"></a>

`createObject('castle', { variant: 'keep' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/castle-keep.webp" width="200" alt="castle keep"><br><sub><b>keep</b></sub></td><td align="center"><sub><b>fortress</b></sub></td><td align="center"><sub><b>palace</b></sub></td></tr>
</table>

**Variants:** `keep`, `fortress`, `palace`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roofs |
| `trimColor` | trim |
| `lightsOn` | boolean |

**Animations:** `lights`


### Temple, Mosque & Cathedral <a id="temple"></a>

`createObject('temple', { variant: 'greek' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/temple-greek.webp" width="200" alt="temple greek"><br><sub><b>greek</b></sub></td><td align="center"><sub><b>pagoda</b></sub></td><td align="center"><sub><b>mosque</b></sub></td><td align="center"><sub><b>shrine</b></sub></td></tr>
<tr><td align="center"><sub><b>cathedral</b></sub></td></tr>
</table>

**Variants:** `greek`, `pagoda`, `mosque`, `shrine`, `cathedral`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof/dome |
| `trimColor` | trim |
| `accentColor` | accent (torii, finial) |
| `lightsOn` | boolean |

**Animations:** `doorOpen`


### Stadium <a id="stadium"></a>

`createObject('stadium', { variant: 'arena' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/stadium-arena.webp" width="200" alt="stadium arena"><br><sub><b>arena</b></sub></td><td align="center"><sub><b>ballpark</b></sub></td></tr>
</table>

**Variants:** `arena`, `ballpark`

| Option | Description |
|---|---|
| `color` | outer wall |
| `trimColor` | team color |
| `accentColor` | seats |
| `lightsOn` | boolean |

**Animations:** `lights`


### Train Station <a id="train-station"></a>

`createObject('train-station', { variant: 'classic' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/train-station-classic.webp" width="200" alt="train-station classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>platform</b></sub></td><td align="center"><sub><b>modern</b></sub></td></tr>
</table>

**Variants:** `classic`, `platform`, `modern`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof |
| `trimColor` | trim |
| `accentColor` | line color |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Airport <a id="airport"></a>

`createObject('airport', { variant: 'terminal' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/airport-terminal.webp" width="200" alt="airport terminal"><br><sub><b>terminal</b></sub></td><td align="center"><sub><b>control-tower</b></sub></td><td align="center"><sub><b>hangar</b></sub></td></tr>
</table>

**Variants:** `terminal`, `control-tower`, `hangar`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof |
| `trimColor` | frames |
| `accentColor` | signage |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Parking Garage <a id="parking-garage"></a>

`createObject('parking-garage', { variant: 'open-deck' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/parking-garage-open-deck.webp" width="200" alt="parking-garage open-deck"><br><sub><b>open-deck</b></sub></td><td align="center"><sub><b>clad</b></sub></td></tr>
</table>

**Variants:** `open-deck`, `clad`

| Option | Description |
|---|---|
| `color` | concrete color |
| `trimColor` | trim |
| `accentColor` | barrier color |

**Animations:** `doorOpen`


### Factory <a id="factory"></a>

`createObject('factory', { variant: 'brick-mill' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/factory-brick-mill.webp" width="200" alt="factory brick-mill"><br><sub><b>brick-mill</b></sub></td><td align="center"><sub><b>plant</b></sub></td><td align="center"><sub><b>brewery</b></sub></td></tr>
</table>

**Variants:** `brick-mill`, `plant`, `brewery`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof |
| `trimColor` | trim |
| `accentColor` | accent |
| `lightsOn` | boolean |

**Animations:** `doorOpen`, `lights`


### Power Plant <a id="power-plant"></a>

`createObject('power-plant', { variant: 'cooling' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/power-plant-cooling.webp" width="200" alt="power-plant cooling"><br><sub><b>cooling</b></sub></td><td align="center"><sub><b>coal</b></sub></td><td align="center"><sub><b>substation</b></sub></td></tr>
</table>

**Variants:** `cooling`, `coal`, `substation`

| Option | Description |
|---|---|
| `color` | wall color |
| `trimColor` | trim |
| `accentColor` | accent |

**Animations:** `lights`


### Bridge <a id="bridge"></a>

`createObject('bridge', { variant: 'stone-arch' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bridge-stone-arch.webp" width="200" alt="bridge stone-arch"><br><sub><b>stone-arch</b></sub></td><td align="center"><sub><b>truss</b></sub></td><td align="center"><sub><b>suspension</b></sub></td><td align="center"><sub><b>footbridge</b></sub></td></tr>
</table>

**Variants:** `stone-arch`, `truss`, `suspension`, `footbridge`

| Option | Description |
|---|---|
| `color` | stone/concrete color |
| `trimColor` | steel / rail color |


### Tunnel Portal <a id="tunnel"></a>

`createObject('tunnel', { variant: 'road' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tunnel-road.webp" width="200" alt="tunnel road"><br><sub><b>road</b></sub></td><td align="center"><sub><b>rail</b></sub></td></tr>
</table>

**Variants:** `road`, `rail`

| Option | Description |
|---|---|
| `color` | portal color |
| `trimColor` | coping |
| `accentColor` | chevrons |


### Silo & Water Tower <a id="silo"></a>

`createObject('silo', { variant: 'grain' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/silo-grain.webp" width="200" alt="silo grain"><br><sub><b>grain</b></sub></td><td align="center"><sub><b>farm</b></sub></td><td align="center"><sub><b>water-tower</b></sub></td><td align="center"><sub><b>water-column</b></sub></td></tr>
</table>

**Variants:** `grain`, `farm`, `water-tower`, `water-column`

| Option | Description |
|---|---|
| `color` | tank/wall color |
| `roofColor` | roof |
| `trimColor` | legs/bands |
| `accentColor` | band |


### Greenhouse <a id="greenhouse"></a>

`createObject('greenhouse', { variant: 'glass-house' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/greenhouse-glass-house.webp" width="200" alt="greenhouse glass-house"><br><sub><b>glass-house</b></sub></td><td align="center"><sub><b>polytunnel</b></sub></td><td align="center"><sub><b>conservatory</b></sub></td></tr>
</table>

**Variants:** `glass-house`, `polytunnel`, `conservatory`

| Option | Description |
|---|---|
| `trimColor` | frame color |

**Animations:** `doorOpen`


### Shed <a id="shed"></a>

`createObject('shed', { variant: 'garden' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shed-garden.webp" width="200" alt="shed garden"><br><sub><b>garden</b></sub></td><td align="center"><sub><b>metal</b></sub></td><td align="center"><sub><b>lean-to</b></sub></td><td align="center"><sub><b>tiny-cabin</b></sub></td></tr>
</table>

**Variants:** `garden`, `metal`, `lean-to`, `tiny-cabin`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof |
| `doorColor` | door |

**Animations:** `doorOpen`, `lights`


### Treehouse <a id="treehouse"></a>

`createObject('treehouse', { variant: 'classic' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/treehouse-classic.webp" width="200" alt="treehouse classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>lookout</b></sub></td></tr>
</table>

**Variants:** `classic`, `lookout`

| Option | Description |
|---|---|
| `color` | wall color |
| `roofColor` | roof |
| `accentColor` | flag |

**Animations:** `doorOpen`, `lights`


### Bus shelter (HD) <a id="hd-bus-shelter"></a>

`createObject('hd-bus-shelter', { variant: 'graphite' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>graphite</b></sub></td><td align="center"><sub><b>green</b></sub></td></tr>
</table>

**Variants:** `graphite`, `green`

| Option | Description |
|---|---|
| `color` | frame color |


### Garden shed (HD) <a id="hd-shed"></a>

`createObject('hd-shed', { variant: 'barn-red' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>barn-red</b></sub></td><td align="center"><sub><b>sage-green-planter</b></sub></td><td align="center"><sub><b>navy-small</b></sub></td><td align="center"><sub><b>natural-cedar</b></sub></td></tr>
</table>

**Variants:** `barn-red`, `sage-green-planter`, `navy-small`, `natural-cedar`

| Option | Description |
|---|---|
| `color` | siding color |
| `secondaryColor` | door color |


## Nature

### Tree <a id="tree"></a>

`createObject('tree', { variant: 'oak' })` · 46 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tree-oak.webp" width="200" alt="tree oak"><br><sub><b>oak</b></sub></td><td align="center"><img src="images/tree-maple.webp" width="200" alt="tree maple"><br><sub><b>maple</b></sub></td><td align="center"><img src="images/tree-cherry.webp" width="200" alt="tree cherry"><br><sub><b>cherry</b></sub></td><td align="center"><img src="images/tree-birch.webp" width="200" alt="tree birch"><br><sub><b>birch</b></sub></td></tr>
<tr><td align="center"><sub><b>beech</b></sub></td><td align="center"><sub><b>elm</b></sub></td><td align="center"><sub><b>ash</b></sub></td><td align="center"><sub><b>linden</b></sub></td></tr>
<tr><td align="center"><sub><b>plane</b></sub></td><td align="center"><sub><b>chestnut</b></sub></td><td align="center"><sub><b>walnut</b></sub></td><td align="center"><sub><b>poplar</b></sub></td></tr>
<tr><td align="center"><sub><b>aspen</b></sub></td><td align="center"><sub><b>ginkgo</b></sub></td><td align="center"><sub><b>japanese-maple</b></sub></td><td align="center"><sub><b>dogwood</b></sub></td></tr>
<tr><td align="center"><sub><b>magnolia</b></sub></td><td align="center"><sub><b>jacaranda</b></sub></td><td align="center"><sub><b>apple</b></sub></td><td align="center"><sub><b>rowan</b></sub></td></tr>
<tr><td align="center"><sub><b>orange</b></sub></td><td align="center"><sub><b>lemon</b></sub></td><td align="center"><sub><b>olive</b></sub></td><td align="center"><sub><b>eucalyptus</b></sub></td></tr>
<tr><td align="center"><sub><b>acacia</b></sub></td><td align="center"><sub><b>dead</b></sub></td><td align="center"><sub><b>spruce</b></sub></td><td align="center"><sub><b>fir</b></sub></td></tr>
<tr><td align="center"><sub><b>cypress</b></sub></td><td align="center"><sub><b>cedar</b></sub></td><td align="center"><sub><b>larch</b></sub></td><td align="center"><sub><b>redwood</b></sub></td></tr>
<tr><td align="center"><sub><b>hemlock</b></sub></td><td align="center"><sub><b>juniper</b></sub></td><td align="center"><sub><b>pine</b></sub></td><td align="center"><sub><b>stone-pine</b></sub></td></tr>
<tr><td align="center"><sub><b>palm</b></sub></td><td align="center"><sub><b>date-palm</b></sub></td><td align="center"><sub><b>fan-palm</b></sub></td><td align="center"><sub><b>royal-palm</b></sub></td></tr>
<tr><td align="center"><sub><b>willow</b></sub></td><td align="center"><sub><b>bamboo</b></sub></td><td align="center"><sub><b>baobab</b></sub></td><td align="center"><sub><b>joshua-tree</b></sub></td></tr>
<tr><td align="center"><sub><b>tree-fern</b></sub></td><td align="center"><sub><b>banana</b></sub></td></tr>
</table>

**Variants:** `oak`, `maple`, `cherry`, `birch`, `beech`, `elm`, `ash`, `linden`, `plane`, `chestnut`, `walnut`, `poplar`, `aspen`, `ginkgo`, `japanese-maple`, `dogwood`, `magnolia`, `jacaranda`, `apple`, `rowan`, `orange`, `lemon`, `olive`, `eucalyptus`, `acacia`, `dead`, `spruce`, `fir`, `cypress`, `cedar`, `larch`, `redwood`, `hemlock`, `juniper`, `pine`, `stone-pine`, `palm`, `date-palm`, `fan-palm`, `royal-palm`, `willow`, `bamboo`, `baobab`, `joshua-tree`, `tree-fern`, `banana`

| Option | Description |
|---|---|
| `seed` | number/string: every seed grows a different tree |
| `leafColor` | color |
| `barkColor` | color |
| `height` | approx metres |

**Animations:** `sway`


### Cactus <a id="cactus"></a>

`createObject('cactus', { variant: 'saguaro' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cactus-saguaro.webp" width="200" alt="cactus saguaro"><br><sub><b>saguaro</b></sub></td><td align="center"><img src="images/cactus-barrel.webp" width="200" alt="cactus barrel"><br><sub><b>barrel</b></sub></td><td align="center"><img src="images/cactus-prickly-pear.webp" width="200" alt="cactus prickly-pear"><br><sub><b>prickly-pear</b></sub></td><td align="center"><img src="images/cactus-organ-pipe.webp" width="200" alt="cactus organ-pipe"><br><sub><b>organ-pipe</b></sub></td></tr>
<tr><td align="center"><sub><b>san-pedro</b></sub></td><td align="center"><sub><b>old-man</b></sub></td><td align="center"><sub><b>mammillaria</b></sub></td><td align="center"><sub><b>cholla</b></sub></td></tr>
<tr><td align="center"><sub><b>golden-barrel</b></sub></td></tr>
</table>

**Variants:** `saguaro`, `barrel`, `prickly-pear`, `organ-pipe`, `san-pedro`, `old-man`, `mammillaria`, `cholla`, `golden-barrel`

| Option | Description |
|---|---|
| `color` | body color |
| `seed` | number |


### Succulent <a id="succulent"></a>

`createObject('succulent', { variant: 'agave' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/succulent-agave.webp" width="200" alt="succulent agave"><br><sub><b>agave</b></sub></td><td align="center"><img src="images/succulent-aloe.webp" width="200" alt="succulent aloe"><br><sub><b>aloe</b></sub></td><td align="center"><img src="images/succulent-echeveria.webp" width="200" alt="succulent echeveria"><br><sub><b>echeveria</b></sub></td><td align="center"><img src="images/succulent-haworthia.webp" width="200" alt="succulent haworthia"><br><sub><b>haworthia</b></sub></td></tr>
<tr><td align="center"><sub><b>sempervivum</b></sub></td><td align="center"><sub><b>yucca</b></sub></td><td align="center"><sub><b>jade</b></sub></td><td align="center"><sub><b>sedum</b></sub></td></tr>
</table>

**Variants:** `agave`, `aloe`, `echeveria`, `haworthia`, `sempervivum`, `yucca`, `jade`, `sedum`

| Option | Description |
|---|---|
| `color` | leaf color |
| `seed` | number |

**Animations:** `sway`


### Bush <a id="bush"></a>

`createObject('bush', { variant: 'round' })` · 20 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bush-round.webp" width="200" alt="bush round"><br><sub><b>round</b></sub></td><td align="center"><img src="images/bush-flowering.webp" width="200" alt="bush flowering"><br><sub><b>flowering</b></sub></td><td align="center"><img src="images/bush-fern.webp" width="200" alt="bush fern"><br><sub><b>fern</b></sub></td><td align="center"><sub><b>boxwood</b></sub></td></tr>
<tr><td align="center"><sub><b>hydrangea</b></sub></td><td align="center"><sub><b>rhododendron</b></sub></td><td align="center"><sub><b>azalea</b></sub></td><td align="center"><sub><b>rose-bush</b></sub></td></tr>
<tr><td align="center"><sub><b>holly</b></sub></td><td align="center"><sub><b>juniper-shrub</b></sub></td><td align="center"><sub><b>blueberry</b></sub></td><td align="center"><sub><b>forsythia</b></sub></td></tr>
<tr><td align="center"><sub><b>hibiscus</b></sub></td><td align="center"><sub><b>heather</b></sub></td><td align="center"><sub><b>barberry</b></sub></td><td align="center"><sub><b>lilac</b></sub></td></tr>
<tr><td align="center"><sub><b>camellia</b></sub></td><td align="center"><sub><b>topiary-cone</b></sub></td><td align="center"><sub><b>topiary-spiral</b></sub></td><td align="center"><sub><b>topiary-tiered</b></sub></td></tr>
</table>

**Variants:** `round`, `flowering`, `fern`, `boxwood`, `hydrangea`, `rhododendron`, `azalea`, `rose-bush`, `holly`, `juniper-shrub`, `blueberry`, `forsythia`, `hibiscus`, `heather`, `barberry`, `lilac`, `camellia`, `topiary-cone`, `topiary-spiral`, `topiary-tiered`

| Option | Description |
|---|---|
| `color` | leaf color |
| `flowerColor` | flower color |
| `size` | scale |
| `seed` | number |

**Animations:** `sway`


### Hedge <a id="hedge"></a>

`createObject('hedge', { variant: 'trimmed' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hedge-trimmed.webp" width="200" alt="hedge trimmed"><br><sub><b>trimmed</b></sub></td><td align="center"><img src="images/hedge-wild.webp" width="200" alt="hedge wild"><br><sub><b>wild</b></sub></td><td align="center"><img src="images/hedge-flowering.webp" width="200" alt="hedge flowering"><br><sub><b>flowering</b></sub></td><td align="center"><sub><b>boxwood</b></sub></td></tr>
<tr><td align="center"><sub><b>privet</b></sub></td><td align="center"><sub><b>yew</b></sub></td><td align="center"><sub><b>beech</b></sub></td><td align="center"><sub><b>laurel</b></sub></td></tr>
<tr><td align="center"><sub><b>corner</b></sub></td><td align="center"><sub><b>arch</b></sub></td></tr>
</table>

**Variants:** `trimmed`, `wild`, `flowering`, `boxwood`, `privet`, `yew`, `beech`, `laurel`, `corner`, `arch`

| Option | Description |
|---|---|
| `color` | leaf color |
| `length` | m |
| `height` | m |
| `depth` | m |
| `seed` | number |


### Flower <a id="flower"></a>

`createObject('flower', { variant: 'rose' })` · 20 versions · procedural JS

<table>
<tr><td align="center"><img src="images/flower-rose.webp" width="200" alt="flower rose"><br><sub><b>rose</b></sub></td><td align="center"><img src="images/flower-tulip.webp" width="200" alt="flower tulip"><br><sub><b>tulip</b></sub></td><td align="center"><img src="images/flower-sunflower.webp" width="200" alt="flower sunflower"><br><sub><b>sunflower</b></sub></td><td align="center"><sub><b>daisy</b></sub></td></tr>
<tr><td align="center"><sub><b>lavender</b></sub></td><td align="center"><sub><b>poppy</b></sub></td><td align="center"><sub><b>lily</b></sub></td><td align="center"><sub><b>iris</b></sub></td></tr>
<tr><td align="center"><sub><b>marigold</b></sub></td><td align="center"><sub><b>dandelion</b></sub></td><td align="center"><sub><b>cosmos</b></sub></td><td align="center"><sub><b>peony</b></sub></td></tr>
<tr><td align="center"><sub><b>bluebell</b></sub></td><td align="center"><sub><b>crocus</b></sub></td><td align="center"><sub><b>daffodil</b></sub></td><td align="center"><sub><b>chrysanthemum</b></sub></td></tr>
<tr><td align="center"><sub><b>foxglove</b></sub></td><td align="center"><sub><b>hyacinth</b></sub></td><td align="center"><sub><b>calla</b></sub></td><td align="center"><sub><b>carnation</b></sub></td></tr>
</table>

**Variants:** `rose`, `tulip`, `sunflower`, `daisy`, `lavender`, `poppy`, `lily`, `iris`, `marigold`, `dandelion`, `cosmos`, `peony`, `bluebell`, `crocus`, `daffodil`, `chrysanthemum`, `foxglove`, `hyacinth`, `calla`, `carnation`

| Option | Description |
|---|---|
| `color` | petal color |
| `seed` | number |

**Animations:** `sway`


### Grass <a id="grass"></a>

`createObject('grass', { variant: 'clump' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/grass-clump.webp" width="200" alt="grass clump"><br><sub><b>clump</b></sub></td><td align="center"><img src="images/grass-tall.webp" width="200" alt="grass tall"><br><sub><b>tall</b></sub></td><td align="center"><img src="images/grass-patch.webp" width="200" alt="grass patch"><br><sub><b>patch</b></sub></td><td align="center"><sub><b>pampas</b></sub></td></tr>
<tr><td align="center"><sub><b>fountain</b></sub></td><td align="center"><sub><b>blue-fescue</b></sub></td><td align="center"><sub><b>mondo</b></sub></td><td align="center"><sub><b>clover</b></sub></td></tr>
<tr><td align="center"><sub><b>moss</b></sub></td><td align="center"><sub><b>lawn</b></sub></td><td align="center"><sub><b>meadow</b></sub></td><td align="center"><sub><b>dune</b></sub></td></tr>
</table>

**Variants:** `clump`, `tall`, `patch`, `pampas`, `fountain`, `blue-fescue`, `mondo`, `clover`, `moss`, `lawn`, `meadow`, `dune`

| Option | Description |
|---|---|
| `color` | blade color |
| `seed` | number |

**Animations:** `sway`


### Crop <a id="crop"></a>

`createObject('crop', { variant: 'corn' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/crop-corn.webp" width="200" alt="crop corn"><br><sub><b>corn</b></sub></td><td align="center"><img src="images/crop-wheat.webp" width="200" alt="crop wheat"><br><sub><b>wheat</b></sub></td><td align="center"><img src="images/crop-sunflower.webp" width="200" alt="crop sunflower"><br><sub><b>sunflower</b></sub></td><td align="center"><sub><b>pumpkin</b></sub></td></tr>
<tr><td align="center"><sub><b>cabbage</b></sub></td><td align="center"><sub><b>lettuce</b></sub></td><td align="center"><sub><b>tomato</b></sub></td><td align="center"><sub><b>carrot</b></sub></td></tr>
<tr><td align="center"><sub><b>strawberry</b></sub></td><td align="center"><sub><b>potato</b></sub></td><td align="center"><sub><b>cotton</b></sub></td><td align="center"><sub><b>rice</b></sub></td></tr>
</table>

**Variants:** `corn`, `wheat`, `sunflower`, `pumpkin`, `cabbage`, `lettuce`, `tomato`, `carrot`, `strawberry`, `potato`, `cotton`, `rice`

| Option | Description |
|---|---|
| `color` | leaf color |
| `seed` | number |

**Animations:** `sway`


### Water plant <a id="water-plant"></a>

`createObject('water-plant', { variant: 'lily-pads' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/water-plant-lily-pads.webp" width="200" alt="water-plant lily-pads"><br><sub><b>lily-pads</b></sub></td><td align="center"><img src="images/water-plant-lotus.webp" width="200" alt="water-plant lotus"><br><sub><b>lotus</b></sub></td><td align="center"><img src="images/water-plant-reeds.webp" width="200" alt="water-plant reeds"><br><sub><b>reeds</b></sub></td><td align="center"><sub><b>cattails</b></sub></td></tr>
<tr><td align="center"><sub><b>papyrus</b></sub></td><td align="center"><sub><b>water-hyacinth</b></sub></td><td align="center"><sub><b>yellow-iris</b></sub></td><td align="center"><sub><b>horsetail</b></sub></td></tr>
</table>

**Variants:** `lily-pads`, `lotus`, `reeds`, `cattails`, `papyrus`, `water-hyacinth`, `yellow-iris`, `horsetail`

| Option | Description |
|---|---|
| `color` | leaf color |
| `flowerColor` | flower color |
| `seed` | number |

**Animations:** `sway`


### Reef <a id="reef"></a>

`createObject('reef', { variant: 'brain-coral' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/reef-brain-coral.webp" width="200" alt="reef brain-coral"><br><sub><b>brain-coral</b></sub></td><td align="center"><img src="images/reef-staghorn.webp" width="200" alt="reef staghorn"><br><sub><b>staghorn</b></sub></td><td align="center"><img src="images/reef-sea-fan.webp" width="200" alt="reef sea-fan"><br><sub><b>sea-fan</b></sub></td><td align="center"><sub><b>table-coral</b></sub></td></tr>
<tr><td align="center"><sub><b>tube-sponge</b></sub></td><td align="center"><sub><b>anemone</b></sub></td><td align="center"><sub><b>kelp</b></sub></td><td align="center"><sub><b>sea-grass</b></sub></td></tr>
<tr><td align="center"><sub><b>pillar-coral</b></sub></td><td align="center"><sub><b>mushroom-coral</b></sub></td></tr>
</table>

**Variants:** `brain-coral`, `staghorn`, `sea-fan`, `table-coral`, `tube-sponge`, `anemone`, `kelp`, `sea-grass`, `pillar-coral`, `mushroom-coral`

| Option | Description |
|---|---|
| `color` | main color |
| `seed` | number |


### Vine <a id="vine"></a>

`createObject('vine', { variant: 'ivy-trellis' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/vine-ivy-trellis.webp" width="200" alt="vine ivy-trellis"><br><sub><b>ivy-trellis</b></sub></td><td align="center"><img src="images/vine-climbing-rose.webp" width="200" alt="vine climbing-rose"><br><sub><b>climbing-rose</b></sub></td><td align="center"><img src="images/vine-wisteria.webp" width="200" alt="vine wisteria"><br><sub><b>wisteria</b></sub></td><td align="center"><sub><b>grapevine</b></sub></td></tr>
<tr><td align="center"><sub><b>morning-glory</b></sub></td></tr>
</table>

**Variants:** `ivy-trellis`, `climbing-rose`, `wisteria`, `grapevine`, `morning-glory`

| Option | Description |
|---|---|
| `color` | leaf color |
| `flowerColor` | flower color |
| `seed` | number |


### Rock <a id="rock"></a>

`createObject('rock', { variant: 'boulder' })` · 17 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rock-boulder.webp" width="200" alt="rock boulder"><br><sub><b>boulder</b></sub></td><td align="center"><img src="images/rock-pebbles.webp" width="200" alt="rock pebbles"><br><sub><b>pebbles</b></sub></td><td align="center"><img src="images/rock-cliff.webp" width="200" alt="rock cliff"><br><sub><b>cliff</b></sub></td><td align="center"><sub><b>mossy</b></sub></td></tr>
<tr><td align="center"><sub><b>flat</b></sub></td><td align="center"><sub><b>granite</b></sub></td><td align="center"><sub><b>sandstone</b></sub></td><td align="center"><sub><b>basalt</b></sub></td></tr>
<tr><td align="center"><sub><b>slate</b></sub></td><td align="center"><sub><b>volcanic</b></sub></td><td align="center"><sub><b>limestone</b></sub></td><td align="center"><sub><b>river-stones</b></sub></td></tr>
<tr><td align="center"><sub><b>cairn</b></sub></td><td align="center"><sub><b>standing-stone</b></sub></td><td align="center"><sub><b>arch</b></sub></td><td align="center"><sub><b>scree</b></sub></td></tr>
<tr><td align="center"><sub><b>outcrop</b></sub></td></tr>
</table>

**Variants:** `boulder`, `pebbles`, `cliff`, `mossy`, `flat`, `granite`, `sandstone`, `basalt`, `slate`, `volcanic`, `limestone`, `river-stones`, `cairn`, `standing-stone`, `arch`, `scree`, `outcrop`

| Option | Description |
|---|---|
| `color` | stone color |
| `size` | scale |
| `seed` | number |


### Mushroom <a id="mushroom"></a>

`createObject('mushroom', { variant: 'fly-agaric' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mushroom-fly-agaric.webp" width="200" alt="mushroom fly-agaric"><br><sub><b>fly-agaric</b></sub></td><td align="center"><img src="images/mushroom-porcini.webp" width="200" alt="mushroom porcini"><br><sub><b>porcini</b></sub></td><td align="center"><img src="images/mushroom-cluster.webp" width="200" alt="mushroom cluster"><br><sub><b>cluster</b></sub></td><td align="center"><sub><b>chanterelle</b></sub></td></tr>
<tr><td align="center"><sub><b>morel</b></sub></td><td align="center"><sub><b>inkcap</b></sub></td><td align="center"><sub><b>puffball</b></sub></td><td align="center"><sub><b>parasol</b></sub></td></tr>
<tr><td align="center"><sub><b>oyster</b></sub></td><td align="center"><sub><b>button</b></sub></td></tr>
</table>

**Variants:** `fly-agaric`, `porcini`, `cluster`, `chanterelle`, `morel`, `inkcap`, `puffball`, `parasol`, `oyster`, `button`

| Option | Description |
|---|---|
| `color` | cap color |
| `seed` | number |


### Log & stump <a id="log"></a>

`createObject('log', { variant: 'stump' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/log-stump.webp" width="200" alt="log stump"><br><sub><b>stump</b></sub></td><td align="center"><img src="images/log-log.webp" width="200" alt="log log"><br><sub><b>log</b></sub></td><td align="center"><img src="images/log-log-pile.webp" width="200" alt="log log-pile"><br><sub><b>log-pile</b></sub></td><td align="center"><sub><b>branch</b></sub></td></tr>
<tr><td align="center"><sub><b>firewood</b></sub></td><td align="center"><sub><b>hollow-log</b></sub></td><td align="center"><sub><b>root-wad</b></sub></td><td align="center"><sub><b>driftwood</b></sub></td></tr>
</table>

**Variants:** `stump`, `log`, `log-pile`, `branch`, `firewood`, `hollow-log`, `root-wad`, `driftwood`

| Option | Description |
|---|---|
| `color` | bark color |
| `seed` | number |


### Terrain <a id="terrain"></a>

`createObject('terrain', { variant: 'hill' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/terrain-hill.webp" width="200" alt="terrain hill"><br><sub><b>hill</b></sub></td><td align="center"><img src="images/terrain-mountain.webp" width="200" alt="terrain mountain"><br><sub><b>mountain</b></sub></td><td align="center"><img src="images/terrain-ridge.webp" width="200" alt="terrain ridge"><br><sub><b>ridge</b></sub></td><td align="center"><sub><b>valley</b></sub></td></tr>
<tr><td align="center"><sub><b>mesa</b></sub></td><td align="center"><sub><b>crater</b></sub></td><td align="center"><sub><b>sand-dune</b></sub></td><td align="center"><sub><b>pond</b></sub></td></tr>
<tr><td align="center"><sub><b>stream</b></sub></td><td align="center"><sub><b>island</b></sub></td><td align="center"><sub><b>canyon</b></sub></td><td align="center"><sub><b>plateau</b></sub></td></tr>
</table>

**Variants:** `hill`, `mountain`, `ridge`, `valley`, `mesa`, `crater`, `sand-dune`, `pond`, `stream`, `island`, `canyon`, `plateau`

| Option | Description |
|---|---|
| `size` | tile size in m |
| `seed` | number |


### Bush (HD) <a id="hd-bush"></a>

`createObject('hd-bush', { variant: 'round-green' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>round-green</b></sub></td><td align="center"><sub><b>flowering-pink</b></sub></td><td align="center"><sub><b>large-dark</b></sub></td></tr>
</table>

**Variants:** `round-green`, `flowering-pink`, `large-dark`


### Cliff piece (HD) <a id="hd-cliff"></a>

`createObject('hd-cliff', { variant: 'grey-outcrop' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>grey-outcrop</b></sub></td><td align="center"><sub><b>sandstone-wall</b></sub></td><td align="center"><sub><b>mossy-crag</b></sub></td></tr>
</table>

**Variants:** `grey-outcrop`, `sandstone-wall`, `mossy-crag`


### Firewood stack (HD) <a id="hd-firewood"></a>

`createObject('hd-firewood', { variant: 'rack' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>rack</b></sub></td><td align="center"><sub><b>tall-rack</b></sub></td><td align="center"><sub><b>pile-no-rack</b></sub></td></tr>
</table>

**Variants:** `rack`, `tall-rack`, `pile-no-rack`


### Flowers in pot (HD) <a id="hd-flower-pot"></a>

`createObject('hd-flower-pot', { variant: 'red-tulips' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>red-tulips</b></sub></td><td align="center"><sub><b>yellow-tulips</b></sub></td><td align="center"><sub><b>white-daisies</b></sub></td><td align="center"><sub><b>purple-daisies</b></sub></td></tr>
</table>

**Variants:** `red-tulips`, `yellow-tulips`, `white-daisies`, `purple-daisies`


### Grass clump (HD) <a id="hd-grass-clump"></a>

`createObject('hd-grass-clump', { variant: 'green' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>green</b></sub></td><td align="center"><sub><b>dry-seed-heads</b></sub></td><td align="center"><sub><b>tall-wild</b></sub></td></tr>
</table>

**Variants:** `green`, `dry-seed-heads`, `tall-wild`


### Log (HD) <a id="hd-log"></a>

`createObject('hd-log', { variant: 'oak-log' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak-log</b></sub></td><td align="center"><sub><b>thin-branchy</b></sub></td><td align="center"><sub><b>big-trunk</b></sub></td></tr>
</table>

**Variants:** `oak-log`, `thin-branchy`, `big-trunk`


### Mushrooms (HD) <a id="hd-mushroom"></a>

`createObject('hd-mushroom', { variant: 'fly-agaric' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>fly-agaric</b></sub></td><td align="center"><sub><b>porcini</b></sub></td><td align="center"><sub><b>chanterelle</b></sub></td></tr>
</table>

**Variants:** `fly-agaric`, `porcini`, `chanterelle`


### Rock (HD) <a id="hd-rock"></a>

`createObject('hd-rock', { variant: 'boulder-granite' })` · 7 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>boulder-granite</b></sub></td><td align="center"><sub><b>boulder-lichen</b></sub></td><td align="center"><sub><b>slab-sandstone</b></sub></td><td align="center"><sub><b>rock-dark-basalt</b></sub></td></tr>
<tr><td align="center"><sub><b>pebble-river</b></sub></td><td align="center"><sub><b>tall-standing-stone</b></sub></td><td align="center"><sub><b>rock-limestone</b></sub></td></tr>
</table>

**Variants:** `boulder-granite`, `boulder-lichen`, `slab-sandstone`, `rock-dark-basalt`, `pebble-river`, `tall-standing-stone`, `rock-limestone`


### Rock cluster (HD) <a id="hd-rock-group"></a>

`createObject('hd-rock-group', { variant: 'small-cluster' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>small-cluster</b></sub></td><td align="center"><sub><b>mossy-cluster</b></sub></td></tr>
</table>

**Variants:** `small-cluster`, `mossy-cluster`


### Tree stump (HD) <a id="hd-stump"></a>

`createObject('hd-stump', { variant: 'oak' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>oak</b></sub></td><td align="center"><sub><b>birch-pale</b></sub></td><td align="center"><sub><b>with-axe</b></sub></td></tr>
</table>

**Variants:** `oak`, `birch-pale`, `with-axe`


## Street

### Streetlight <a id="streetlight"></a>

`createObject('streetlight', { variant: 'modern' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/streetlight-modern.webp" width="200" alt="streetlight modern"><br><sub><b>modern</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>highway</b></sub></td><td align="center"><img src="images/streetlight-classic.webp" width="200" alt="streetlight classic"><br><sub><b>classic</b></sub></td></tr>
<tr><td align="center"><sub><b>globe</b></sub></td><td align="center"><sub><b>deco</b></sub></td><td align="center"><sub><b>pendant</b></sub></td><td align="center"><sub><b>post-top</b></sub></td></tr>
<tr><td align="center"><sub><b>solar</b></sub></td></tr>
</table>

**Variants:** `modern`, `double`, `highway`, `classic`, `globe`, `deco`, `pendant`, `post-top`, `solar`

| Option | Description |
|---|---|
| `color` | pole color |
| `tone` | 'led' | 'warm' | 'sodium' |
| `light` | true adds a real Point/SpotLight |
| `intensity` | real light intensity |
| `height` | m |

**Animations:** `lights`, `flicker`


### Traffic light <a id="traffic-light"></a>

`createObject('traffic-light', { variant: 'pole' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/traffic-light-pole.webp" width="200" alt="traffic-light pole"><br><sub><b>pole</b></sub></td><td align="center"><img src="images/traffic-light-overhead.webp" width="200" alt="traffic-light overhead"><br><sub><b>overhead</b></sub></td><td align="center"><sub><b>arrow</b></sub></td><td align="center"><sub><b>pedestrian</b></sub></td></tr>
<tr><td align="center"><sub><b>beacon</b></sub></td></tr>
</table>

**Variants:** `pole`, `overhead`, `arrow`, `pedestrian`, `beacon`

| Option | Description |
|---|---|
| `color` | housing color |

**Animations:** `cycle`, `flashing`, `off`


### Road sign <a id="sign"></a>

`createObject('sign', { variant: 'stop' })` · 22 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sign-stop.webp" width="200" alt="sign stop"><br><sub><b>stop</b></sub></td><td align="center"><sub><b>yield</b></sub></td><td align="center"><sub><b>speed</b></sub></td><td align="center"><sub><b>no-entry</b></sub></td></tr>
<tr><td align="center"><sub><b>parking</b></sub></td><td align="center"><sub><b>no-parking</b></sub></td><td align="center"><sub><b>one-way</b></sub></td><td align="center"><sub><b>pedestrian-crossing</b></sub></td></tr>
<tr><td align="center"><sub><b>school</b></sub></td><td align="center"><sub><b>roundabout</b></sub></td><td align="center"><sub><b>turn-left</b></sub></td><td align="center"><sub><b>turn-right</b></sub></td></tr>
<tr><td align="center"><sub><b>dead-end</b></sub></td><td align="center"><sub><b>deer</b></sub></td><td align="center"><sub><b>slippery</b></sub></td><td align="center"><sub><b>roadworks</b></sub></td></tr>
<tr><td align="center"><sub><b>hospital</b></sub></td><td align="center"><sub><b>bike-lane</b></sub></td><td align="center"><sub><b>street-name</b></sub></td><td align="center"><sub><b>height-limit</b></sub></td></tr>
<tr><td align="center"><sub><b>speed-hump</b></sub></td><td align="center"><sub><b>curve-ahead</b></sub></td></tr>
</table>

**Variants:** `stop`, `yield`, `speed`, `no-entry`, `parking`, `no-parking`, `one-way`, `pedestrian-crossing`, `school`, `roundabout`, `turn-left`, `turn-right`, `dead-end`, `deer`, `slippery`, `roadworks`, `hospital`, `bike-lane`, `street-name`, `height-limit`, `speed-hump`, `curve-ahead`

| Option | Description |
|---|---|
| `limit` | number (speed / height-limit signs) |
| `text` | street-name sign text |


### Bench <a id="bench"></a>

`createObject('bench', { variant: 'park' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bench-park.webp" width="200" alt="bench park"><br><sub><b>park</b></sub></td><td align="center"><sub><b>modern</b></sub></td><td align="center"><sub><b>stone</b></sub></td><td align="center"><sub><b>backless</b></sub></td></tr>
<tr><td align="center"><sub><b>curved</b></sub></td><td align="center"><sub><b>log</b></sub></td></tr>
</table>

**Variants:** `park`, `modern`, `stone`, `backless`, `curved`, `log`

| Option | Description |
|---|---|
| `color` | frame color |
| `wood` | wood name or color |
| `length` | m |


### Trash can <a id="trash-can"></a>

`createObject('trash-can', { variant: 'park' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/trash-can-park.webp" width="200" alt="trash-can park"><br><sub><b>park</b></sub></td><td align="center"><sub><b>city</b></sub></td><td align="center"><sub><b>recycling</b></sub></td><td align="center"><sub><b>wheelie</b></sub></td></tr>
<tr><td align="center"><sub><b>dog-waste</b></sub></td><td align="center"><sub><b>solar-compactor</b></sub></td><td align="center"><sub><b>wire-basket</b></sub></td></tr>
</table>

**Variants:** `park`, `city`, `recycling`, `wheelie`, `dog-waste`, `solar-compactor`, `wire-basket`

| Option | Description |
|---|---|
| `color` | body color |
| `seed` | litter variation |


### Planter <a id="planter"></a>

`createObject('planter', { variant: 'box' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/planter-box.webp" width="200" alt="planter box"><br><sub><b>box</b></sub></td><td align="center"><sub><b>round</b></sub></td><td align="center"><sub><b>wooden</b></sub></td><td align="center"><sub><b>tree-pit</b></sub></td></tr>
<tr><td align="center"><sub><b>tiered</b></sub></td></tr>
</table>

**Variants:** `box`, `round`, `wooden`, `tree-pit`, `tiered`

| Option | Description |
|---|---|
| `color` | container color |
| `seed` | plant variation |


### Fountain <a id="fountain"></a>

`createObject('fountain', { variant: 'tiered' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fountain-tiered.webp" width="200" alt="fountain tiered"><br><sub><b>tiered</b></sub></td><td align="center"><sub><b>basin</b></sub></td><td align="center"><sub><b>wall</b></sub></td><td align="center"><sub><b>plaza-jets</b></sub></td></tr>
</table>

**Variants:** `tiered`, `basin`, `wall`, `plaza-jets`

| Option | Description |
|---|---|
| `color` | stone color |

**Animations:** `water`


### Bike rack <a id="bike-rack"></a>

`createObject('bike-rack', { variant: 'hoop' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bike-rack-hoop.webp" width="200" alt="bike-rack hoop"><br><sub><b>hoop</b></sub></td><td align="center"><sub><b>wave</b></sub></td><td align="center"><sub><b>wall</b></sub></td><td align="center"><sub><b>dock</b></sub></td></tr>
</table>

**Variants:** `hoop`, `wave`, `wall`, `dock`

| Option | Description |
|---|---|
| `color` | frame color |


### Picnic table <a id="picnic-table"></a>

`createObject('picnic-table', { variant: 'classic' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/picnic-table-classic.webp" width="200" alt="picnic-table classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>modern</b></sub></td><td align="center"><sub><b>accessible</b></sub></td><td align="center"><sub><b>round</b></sub></td></tr>
</table>

**Variants:** `classic`, `modern`, `accessible`, `round`

| Option | Description |
|---|---|
| `wood` | wood name or color |
| `color` | frame color |


### Drinking fountain <a id="drinking-fountain"></a>

`createObject('drinking-fountain', { variant: 'pedestal' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/drinking-fountain-pedestal.webp" width="200" alt="drinking-fountain pedestal"><br><sub><b>pedestal</b></sub></td><td align="center"><sub><b>bottle-filler</b></sub></td><td align="center"><sub><b>stone</b></sub></td></tr>
</table>

**Variants:** `pedestal`, `bottle-filler`, `stone`

| Option | Description |
|---|---|
| `color` | body color |

**Animations:** `water`


### Fire hydrant <a id="fire-hydrant"></a>

`createObject('fire-hydrant', { variant: 'classic' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fire-hydrant-classic.webp" width="200" alt="fire-hydrant classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>yellow</b></sub></td><td align="center"><sub><b>pillar</b></sub></td><td align="center"><sub><b>european</b></sub></td></tr>
<tr><td align="center"><sub><b>wall-fdc</b></sub></td></tr>
</table>

**Variants:** `classic`, `yellow`, `pillar`, `european`, `wall-fdc`

| Option | Description |
|---|---|
| `color` | paint color |


### Mailbox <a id="mailbox"></a>

`createObject('mailbox', { variant: 'collection' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mailbox-collection.webp" width="200" alt="mailbox collection"><br><sub><b>collection</b></sub></td><td align="center"><sub><b>residential</b></sub></td><td align="center"><sub><b>pillar</b></sub></td><td align="center"><sub><b>parcel-locker</b></sub></td></tr>
<tr><td align="center"><sub><b>cluster</b></sub></td><td align="center"><sub><b>rural</b></sub></td></tr>
</table>

**Variants:** `collection`, `residential`, `pillar`, `parcel-locker`, `cluster`, `rural`

| Option | Description |
|---|---|
| `color` | paint color |

**Animations:** `open`


### Parking meter <a id="parking-meter"></a>

`createObject('parking-meter', { variant: 'single' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/parking-meter-single.webp" width="200" alt="parking-meter single"><br><sub><b>single</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>kiosk</b></sub></td><td align="center"><sub><b>solar-paystation</b></sub></td></tr>
</table>

**Variants:** `single`, `double`, `kiosk`, `solar-paystation`

| Option | Description |
|---|---|
| `color` | housing color |

**Animations:** `blink`


### Phone booth <a id="phone-booth"></a>

`createObject('phone-booth', { variant: 'classic' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/phone-booth-classic.webp" width="200" alt="phone-booth classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>modern</b></sub></td><td align="center"><sub><b>wall</b></sub></td></tr>
</table>

**Variants:** `classic`, `modern`, `wall`

| Option | Description |
|---|---|
| `color` | paint color |

**Animations:** `door`, `lights`


### Vending machine <a id="vending-machine"></a>

`createObject('vending-machine', { variant: 'drinks' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/vending-machine-drinks.webp" width="200" alt="vending-machine drinks"><br><sub><b>drinks</b></sub></td><td align="center"><sub><b>snacks</b></sub></td><td align="center"><sub><b>coffee</b></sub></td><td align="center"><sub><b>ticket</b></sub></td></tr>
</table>

**Variants:** `drinks`, `snacks`, `coffee`, `ticket`

| Option | Description |
|---|---|
| `color` | cabinet color |
| `seed` | product mix |

**Animations:** `lights`, `display`


### Newspaper box <a id="newspaper-box"></a>

`createObject('newspaper-box', { variant: 'single' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/newspaper-box-single.webp" width="200" alt="newspaper-box single"><br><sub><b>single</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>free</b></sub></td></tr>
</table>

**Variants:** `single`, `double`, `free`

| Option | Description |
|---|---|
| `color` | box color |


### ATM <a id="atm"></a>

`createObject('atm', { variant: 'freestanding' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/atm-freestanding.webp" width="200" alt="atm freestanding"><br><sub><b>freestanding</b></sub></td><td align="center"><sub><b>wall</b></sub></td><td align="center"><sub><b>drive-up</b></sub></td></tr>
</table>

**Variants:** `freestanding`, `wall`, `drive-up`

| Option | Description |
|---|---|
| `color` | housing color |

**Animations:** `lights`


### EV charger <a id="ev-charger"></a>

`createObject('ev-charger', { variant: 'pedestal' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ev-charger-pedestal.webp" width="200" alt="ev-charger pedestal"><br><sub><b>pedestal</b></sub></td><td align="center"><sub><b>wall</b></sub></td><td align="center"><sub><b>fast</b></sub></td></tr>
</table>

**Variants:** `pedestal`, `wall`, `fast`

| Option | Description |
|---|---|
| `color` | housing color |

**Animations:** `charging`


### Bollard <a id="bollard"></a>

`createObject('bollard', { variant: 'steel' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bollard-steel.webp" width="200" alt="bollard steel"><br><sub><b>steel</b></sub></td><td align="center"><sub><b>concrete</b></sub></td><td align="center"><sub><b>lit</b></sub></td><td align="center"><sub><b>cast-iron</b></sub></td></tr>
<tr><td align="center"><sub><b>flexible</b></sub></td><td align="center"><sub><b>sphere</b></sub></td><td align="center"><sub><b>removable</b></sub></td></tr>
</table>

**Variants:** `steel`, `concrete`, `lit`, `cast-iron`, `flexible`, `sphere`, `removable`

| Option | Description |
|---|---|
| `color` | color |


### Traffic cone <a id="traffic-cone"></a>

`createObject('traffic-cone', { variant: 'cone' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/traffic-cone-cone.webp" width="200" alt="traffic-cone cone"><br><sub><b>cone</b></sub></td><td align="center"><sub><b>tall</b></sub></td><td align="center"><sub><b>drum</b></sub></td><td align="center"><sub><b>delineator</b></sub></td></tr>
</table>

**Variants:** `cone`, `tall`, `drum`, `delineator`

| Option | Description |
|---|---|
| `color` | plastic color |


### Barrier <a id="barrier"></a>

`createObject('barrier', { variant: 'jersey' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/barrier-jersey.webp" width="200" alt="barrier jersey"><br><sub><b>jersey</b></sub></td><td align="center"><sub><b>sawhorse</b></sub></td><td align="center"><sub><b>crowd</b></sub></td><td align="center"><sub><b>boom</b></sub></td></tr>
<tr><td align="center"><sub><b>water-filled</b></sub></td><td align="center"><sub><b>pedestrian-railing</b></sub></td></tr>
</table>

**Variants:** `jersey`, `sawhorse`, `crowd`, `boom`, `water-filled`, `pedestrian-railing`

| Option | Description |
|---|---|
| `color` | stripe / panel color |
| `length` | m (jersey) |


### Bus stop <a id="bus-stop"></a>

`createObject('bus-stop', { variant: 'shelter' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bus-stop-shelter.webp" width="200" alt="bus-stop shelter"><br><sub><b>shelter</b></sub></td><td align="center"><sub><b>pole</b></sub></td><td align="center"><sub><b>modern</b></sub></td><td align="center"><sub><b>wooden</b></sub></td></tr>
</table>

**Variants:** `shelter`, `pole`, `modern`, `wooden`

| Option | Description |
|---|---|
| `color` | frame / sign color |

**Animations:** `lights`


### Guard rail <a id="guard-rail"></a>

`createObject('guard-rail', { variant: 'w-beam' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/guard-rail-w-beam.webp" width="200" alt="guard-rail w-beam"><br><sub><b>w-beam</b></sub></td><td align="center"><sub><b>cable</b></sub></td><td align="center"><sub><b>timber</b></sub></td></tr>
</table>

**Variants:** `w-beam`, `cable`, `timber`

| Option | Description |
|---|---|
| `color` | rail color |
| `length` | m |


### Fence <a id="fence"></a>

`createObject('fence', { variant: 'picket' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fence-picket.webp" width="200" alt="fence picket"><br><sub><b>picket</b></sub></td><td align="center"><sub><b>chain-link</b></sub></td><td align="center"><sub><b>iron</b></sub></td><td align="center"><sub><b>wooden</b></sub></td></tr>
<tr><td align="center"><sub><b>palisade</b></sub></td><td align="center"><sub><b>post-rail</b></sub></td><td align="center"><sub><b>stone-wall</b></sub></td><td align="center"><sub><b>glass</b></sub></td></tr>
</table>

**Variants:** `picket`, `chain-link`, `iron`, `wooden`, `palisade`, `post-rail`, `stone-wall`, `glass`

| Option | Description |
|---|---|
| `color` | color |
| `length` | m |
| `height` | m |
| `seed` | variation |


### Road <a id="road"></a>

`createObject('road', { variant: 'straight' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/road-straight.webp" width="200" alt="road straight"><br><sub><b>straight</b></sub></td><td align="center"><sub><b>crosswalk</b></sub></td><td align="center"><img src="images/road-intersection.webp" width="200" alt="road intersection"><br><sub><b>intersection</b></sub></td><td align="center"><sub><b>dead-end</b></sub></td></tr>
<tr><td align="center"><sub><b>bike-lane</b></sub></td><td align="center"><sub><b>bus-lane</b></sub></td><td align="center"><sub><b>parking</b></sub></td><td align="center"><sub><b>rural</b></sub></td></tr>
</table>

**Variants:** `straight`, `crosswalk`, `intersection`, `dead-end`, `bike-lane`, `bus-lane`, `parking`, `rural`

| Option | Description |
|---|---|
| `lanes` | number of lanes |
| `length` | m |
| `sidewalk` | sidewalk width (m) |
| `seed` | asphalt variation |


### Road kit (12 m tiles) <a id="road-kit"></a>

`createObject('road-kit', { variant: 'straight' })` · 28 versions · procedural JS

<table>
<tr><td align="center"><img src="images/road-kit-straight.webp" width="200" alt="road-kit straight"><br><sub><b>straight</b></sub></td><td align="center"><sub><b>curve-tight</b></sub></td><td align="center"><sub><b>curve-medium</b></sub></td><td align="center"><sub><b>curve-wide</b></sub></td></tr>
<tr><td align="center"><sub><b>t-junction</b></sub></td><td align="center"><sub><b>crossroads</b></sub></td><td align="center"><sub><b>roundabout</b></sub></td><td align="center"><sub><b>highway-2</b></sub></td></tr>
<tr><td align="center"><sub><b>highway-4</b></sub></td><td align="center"><sub><b>highway-6</b></sub></td><td align="center"><sub><b>on-ramp</b></sub></td><td align="center"><sub><b>off-ramp</b></sub></td></tr>
<tr><td align="center"><sub><b>overpass</b></sub></td><td align="center"><sub><b>bridge</b></sub></td><td align="center"><sub><b>tunnel</b></sub></td><td align="center"><sub><b>dead-end</b></sub></td></tr>
<tr><td align="center"><sub><b>cul-de-sac</b></sub></td><td align="center"><sub><b>parking-lot</b></sub></td><td align="center"><sub><b>parking-angled</b></sub></td><td align="center"><sub><b>bus-lane</b></sub></td></tr>
<tr><td align="center"><sub><b>bike-lane</b></sub></td><td align="center"><sub><b>crosswalk</b></sub></td><td align="center"><sub><b>rail-crossing</b></sub></td><td align="center"><sub><b>dirt-road</b></sub></td></tr>
<tr><td align="center"><sub><b>cobblestone</b></sub></td><td align="center"><sub><b>gravel-path</b></sub></td><td align="center"><sub><b>driveway</b></sub></td><td align="center"><sub><b>alley</b></sub></td></tr>
</table>

**Variants:** `straight`, `curve-tight`, `curve-medium`, `curve-wide`, `t-junction`, `crossroads`, `roundabout`, `highway-2`, `highway-4`, `highway-6`, `on-ramp`, `off-ramp`, `overpass`, `bridge`, `tunnel`, `dead-end`, `cul-de-sac`, `parking-lot`, `parking-angled`, `bus-lane`, `bike-lane`, `crosswalk`, `rail-crossing`, `dirt-road`, `cobblestone`, `gravel-path`, `driveway`, `alley`

| Option | Description |
|---|---|
| `seed` | wear / puddle variation |


### Pallet <a id="pallet"></a>

`createObject('pallet', { variant: 'euro' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pallet-euro.webp" width="200" alt="pallet euro"><br><sub><b>euro</b></sub></td><td align="center"><sub><b>us</b></sub></td><td align="center"><sub><b>plastic</b></sub></td></tr>
</table>

**Variants:** `euro`, `us`, `plastic`

| Option | Description |
|---|---|
| `color` | timber / plastic color |
| `seed` | variation |


### Crate <a id="crate"></a>

`createObject('crate', { variant: 'wooden' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/crate-wooden.webp" width="200" alt="crate wooden"><br><sub><b>wooden</b></sub></td><td align="center"><sub><b>plastic</b></sub></td><td align="center"><sub><b>shipping</b></sub></td></tr>
</table>

**Variants:** `wooden`, `plastic`, `shipping`

| Option | Description |
|---|---|
| `color` | color |
| `seed` | variation |


### Barrel <a id="barrel"></a>

`createObject('barrel', { variant: 'steel-drum' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/barrel-steel-drum.webp" width="200" alt="barrel steel-drum"><br><sub><b>steel-drum</b></sub></td><td align="center"><sub><b>plastic</b></sub></td><td align="center"><sub><b>wooden</b></sub></td></tr>
</table>

**Variants:** `steel-drum`, `plastic`, `wooden`

| Option | Description |
|---|---|
| `color` | color |


### Dumpster <a id="dumpster"></a>

`createObject('dumpster', { variant: 'front-load' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dumpster-front-load.webp" width="200" alt="dumpster front-load"><br><sub><b>front-load</b></sub></td><td align="center"><sub><b>roll-off</b></sub></td><td align="center"><sub><b>skip</b></sub></td></tr>
</table>

**Variants:** `front-load`, `roll-off`, `skip`

| Option | Description |
|---|---|
| `color` | paint color |
| `seed` | rubble variation |

**Animations:** `open`


### Portable toilet <a id="porta-potty"></a>

`createObject('porta-potty', { variant: 'standard' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/porta-potty-standard.webp" width="200" alt="porta-potty standard"><br><sub><b>standard</b></sub></td><td align="center"><sub><b>accessible</b></sub></td><td align="center"><sub><b>luxury</b></sub></td></tr>
</table>

**Variants:** `standard`, `accessible`, `luxury`

| Option | Description |
|---|---|
| `color` | shell color |

**Animations:** `door`


### Sandbags <a id="sandbags"></a>

`createObject('sandbags', { variant: 'wall' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sandbags-wall.webp" width="200" alt="sandbags wall"><br><sub><b>wall</b></sub></td><td align="center"><sub><b>pile</b></sub></td><td align="center"><sub><b>ring</b></sub></td></tr>
</table>

**Variants:** `wall`, `pile`, `ring`

| Option | Description |
|---|---|
| `color` | hessian color |
| `seed` | variation |


### Cable drum <a id="cable-drum"></a>

`createObject('cable-drum', { variant: 'small' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cable-drum-small.webp" width="200" alt="cable-drum small"><br><sub><b>small</b></sub></td><td align="center"><sub><b>large</b></sub></td><td align="center"><sub><b>steel</b></sub></td></tr>
</table>

**Variants:** `small`, `large`, `steel`

| Option | Description |
|---|---|
| `color` | flange color |


### Scaffolding <a id="scaffolding"></a>

`createObject('scaffolding', { variant: 'bay' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/scaffolding-bay.webp" width="200" alt="scaffolding bay"><br><sub><b>bay</b></sub></td><td align="center"><sub><b>tower</b></sub></td><td align="center"><sub><b>wrapped</b></sub></td></tr>
</table>

**Variants:** `bay`, `tower`, `wrapped`


### Swing set <a id="swing"></a>

`createObject('swing', { variant: 'double' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/swing-double.webp" width="200" alt="swing double"><br><sub><b>double</b></sub></td><td align="center"><sub><b>single</b></sub></td><td align="center"><sub><b>nest</b></sub></td><td align="center"><sub><b>toddler</b></sub></td></tr>
</table>

**Variants:** `double`, `single`, `nest`, `toddler`

| Option | Description |
|---|---|
| `color` | frame color |

**Animations:** `swing`


### Slide <a id="slide"></a>

`createObject('slide', { variant: 'straight' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/slide-straight.webp" width="200" alt="slide straight"><br><sub><b>straight</b></sub></td><td align="center"><sub><b>spiral</b></sub></td><td align="center"><sub><b>wave</b></sub></td><td align="center"><sub><b>tube</b></sub></td></tr>
</table>

**Variants:** `straight`, `spiral`, `wave`, `tube`

| Option | Description |
|---|---|
| `color` | frame color |


### Seesaw <a id="seesaw"></a>

`createObject('seesaw', { variant: 'classic' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/seesaw-classic.webp" width="200" alt="seesaw classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>spring-rider</b></sub></td></tr>
</table>

**Variants:** `classic`, `double`, `spring-rider`

| Option | Description |
|---|---|
| `color` | frame color |

**Animations:** `seesaw`


### Climbing frame <a id="climbing-frame"></a>

`createObject('climbing-frame', { variant: 'dome' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/climbing-frame-dome.webp" width="200" alt="climbing-frame dome"><br><sub><b>dome</b></sub></td><td align="center"><sub><b>monkey-bars</b></sub></td><td align="center"><sub><b>net</b></sub></td></tr>
</table>

**Variants:** `dome`, `monkey-bars`, `net`

| Option | Description |
|---|---|
| `color` | frame color |


### Sandbox <a id="sandbox"></a>

`createObject('sandbox', { variant: 'square' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sandbox-square.webp" width="200" alt="sandbox square"><br><sub><b>square</b></sub></td><td align="center"><sub><b>round</b></sub></td><td align="center"><sub><b>covered</b></sub></td></tr>
</table>

**Variants:** `square`, `round`, `covered`


### Merry-go-round <a id="merry-go-round"></a>

`createObject('merry-go-round', { variant: 'classic' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/merry-go-round-classic.webp" width="200" alt="merry-go-round classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>modern</b></sub></td></tr>
</table>

**Variants:** `classic`, `modern`

**Animations:** `spin`


### Market stall <a id="market-stall"></a>

`createObject('market-stall', { variant: 'canopy' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/market-stall-canopy.webp" width="200" alt="market-stall canopy"><br><sub><b>canopy</b></sub></td><td align="center"><sub><b>wooden</b></sub></td><td align="center"><sub><b>fruit</b></sub></td></tr>
</table>

**Variants:** `canopy`, `wooden`, `fruit`

| Option | Description |
|---|---|
| `color` | awning color |
| `seed` | goods variation |


### Kiosk <a id="kiosk"></a>

`createObject('kiosk', { variant: 'newsstand' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kiosk-newsstand.webp" width="200" alt="kiosk newsstand"><br><sub><b>newsstand</b></sub></td><td align="center"><sub><b>ticket</b></sub></td><td align="center"><sub><b>food</b></sub></td></tr>
</table>

**Variants:** `newsstand`, `ticket`, `food`

| Option | Description |
|---|---|
| `color` | paint color |

**Animations:** `lights`


### Food cart <a id="food-cart"></a>

`createObject('food-cart', { variant: 'hot-dog' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/food-cart-hot-dog.webp" width="200" alt="food-cart hot-dog"><br><sub><b>hot-dog</b></sub></td><td align="center"><sub><b>ice-cream</b></sub></td><td align="center"><sub><b>coffee</b></sub></td></tr>
</table>

**Variants:** `hot-dog`, `ice-cream`, `coffee`

| Option | Description |
|---|---|
| `color` | body color |


### Patio umbrella <a id="umbrella"></a>

`createObject('umbrella', { variant: 'patio' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/umbrella-patio.webp" width="200" alt="umbrella patio"><br><sub><b>patio</b></sub></td><td align="center"><sub><b>market</b></sub></td><td align="center"><sub><b>cantilever</b></sub></td><td align="center"><sub><b>beach</b></sub></td></tr>
</table>

**Variants:** `patio`, `market`, `cantilever`, `beach`

| Option | Description |
|---|---|
| `color` | canvas color |


### Fuel pump <a id="gas-pump"></a>

`createObject('gas-pump', { variant: 'modern' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gas-pump-modern.webp" width="200" alt="gas-pump modern"><br><sub><b>modern</b></sub></td><td align="center"><sub><b>classic</b></sub></td><td align="center"><sub><b>dual</b></sub></td></tr>
</table>

**Variants:** `modern`, `classic`, `dual`

| Option | Description |
|---|---|
| `color` | body color |

**Animations:** `lights`


### Billboard <a id="billboard"></a>

`createObject('billboard', { variant: 'standard' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/billboard-standard.webp" width="200" alt="billboard standard"><br><sub><b>standard</b></sub></td><td align="center"><sub><b>digital</b></sub></td><td align="center"><sub><b>mupi</b></sub></td><td align="center"><sub><b>pylon</b></sub></td></tr>
</table>

**Variants:** `standard`, `digital`, `mupi`, `pylon`

| Option | Description |
|---|---|
| `seed` | which advert |

**Animations:** `lights`


### Manhole <a id="manhole"></a>

`createObject('manhole', { variant: 'sewer' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/manhole-sewer.webp" width="200" alt="manhole sewer"><br><sub><b>sewer</b></sub></td><td align="center"><sub><b>storm</b></sub></td><td align="center"><sub><b>utility</b></sub></td><td align="center"><sub><b>telecom</b></sub></td></tr>
</table>

**Variants:** `sewer`, `storm`, `utility`, `telecom`


### Storm drain <a id="storm-drain"></a>

`createObject('storm-drain', { variant: 'curb-inlet' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/storm-drain-curb-inlet.webp" width="200" alt="storm-drain curb-inlet"><br><sub><b>curb-inlet</b></sub></td><td align="center"><sub><b>grate</b></sub></td><td align="center"><sub><b>trench</b></sub></td></tr>
</table>

**Variants:** `curb-inlet`, `grate`, `trench`


### Speed bump <a id="speed-bump"></a>

`createObject('speed-bump', { variant: 'rubber' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>rubber</b></sub></td><td align="center"><sub><b>hump</b></sub></td><td align="center"><sub><b>cushion</b></sub></td><td align="center"><sub><b>table</b></sub></td></tr>
</table>

**Variants:** `rubber`, `hump`, `cushion`, `table`


### Utility pole <a id="power-pole"></a>

`createObject('power-pole', { variant: 'wooden' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>wooden</b></sub></td><td align="center"><sub><b>concrete</b></sub></td><td align="center"><sub><b>transformer</b></sub></td><td align="center"><sub><b>steel</b></sub></td></tr>
</table>

**Variants:** `wooden`, `concrete`, `transformer`, `steel`


### Utility cabinet <a id="utility-box"></a>

`createObject('utility-box', { variant: 'pad-mount' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><sub><b>pad-mount</b></sub></td><td align="center"><sub><b>signal-cabinet</b></sub></td><td align="center"><sub><b>telecom</b></sub></td></tr>
</table>

**Variants:** `pad-mount`, `signal-cabinet`, `telecom`

| Option | Description |
|---|---|
| `color` | paint color |


### Rail crossing <a id="rail-crossing"></a>

`createObject('rail-crossing', { variant: 'crossbuck' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><sub><b>crossbuck</b></sub></td><td align="center"><sub><b>lights</b></sub></td><td align="center"><sub><b>gate</b></sub></td></tr>
</table>

**Variants:** `crossbuck`, `lights`, `gate`


### Street clock <a id="street-clock"></a>

`createObject('street-clock', { variant: 'post' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><sub><b>post</b></sub></td><td align="center"><sub><b>double-face</b></sub></td><td align="center"><sub><b>modern</b></sub></td></tr>
</table>

**Variants:** `post`, `double-face`, `modern`

| Option | Description |
|---|---|
| `color` | iron color |

**Animations:** `ticking`, `lights`


### Flag pole <a id="flag-pole"></a>

`createObject('flag-pole', { variant: 'single' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><sub><b>single</b></sub></td><td align="center"><sub><b>triple</b></sub></td><td align="center"><sub><b>wall</b></sub></td></tr>
</table>

**Variants:** `single`, `triple`, `wall`

| Option | Description |
|---|---|
| `seed` | which flag |

**Animations:** `wave`


### Monument <a id="monument"></a>

`createObject('monument', { variant: 'obelisk' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><sub><b>obelisk</b></sub></td><td align="center"><sub><b>column</b></sub></td><td align="center"><sub><b>abstract</b></sub></td><td align="center"><sub><b>globe</b></sub></td></tr>
<tr><td align="center"><sub><b>plaque</b></sub></td></tr>
</table>

**Variants:** `obelisk`, `column`, `abstract`, `globe`, `plaque`


### Jet bridge <a id="jet-bridge"></a>

`createObject('jet-bridge', { variant: 'standard' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><sub><b>standard</b></sub></td><td align="center"><sub><b>glass</b></sub></td><td align="center"><sub><b>short</b></sub></td></tr>
</table>

**Variants:** `standard`, `glass`, `short`

| Option | Description |
|---|---|
| `color` | skin color |

**Animations:** `extend`, `beacon`, `lights`, `swing-cab`


### Baggage carousel <a id="baggage-carousel"></a>

`createObject('baggage-carousel', { variant: 'oval' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>oval</b></sub></td><td align="center"><sub><b>long</b></sub></td><td align="center"><sub><b>round</b></sub></td><td align="center"><sub><b>empty</b></sub></td></tr>
</table>

**Variants:** `oval`, `long`, `round`, `empty`

| Option | Description |
|---|---|
| `seed` | bag layout |

**Animations:** `running`, `beacon`


### Check-in desk <a id="check-in-desk"></a>

`createObject('check-in-desk', { variant: 'single' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>single</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>kiosk</b></sub></td><td align="center"><sub><b>kiosk-row</b></sub></td></tr>
</table>

**Variants:** `single`, `double`, `kiosk`, `kiosk-row`

| Option | Description |
|---|---|
| `color` | airline accent color |

**Animations:** `lights`


### Gate seating <a id="gate-seating"></a>

`createObject('gate-seating', { variant: 'row-3' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>row-3</b></sub></td><td align="center"><sub><b>row-5</b></sub></td><td align="center"><sub><b>back-to-back</b></sub></td><td align="center"><sub><b>with-table</b></sub></td></tr>
</table>

**Variants:** `row-3`, `row-5`, `back-to-back`, `with-table`

| Option | Description |
|---|---|
| `color` | upholstery color |


### Departures board <a id="departure-board"></a>

`createObject('departure-board', { variant: 'hanging' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>hanging</b></sub></td><td align="center"><sub><b>standing</b></sub></td><td align="center"><sub><b>wall</b></sub></td><td align="center"><sub><b>arrivals</b></sub></td></tr>
</table>

**Variants:** `hanging`, `standing`, `wall`, `arrivals`

| Option | Description |
|---|---|
| `seed` | flight list |

**Animations:** `lights`, `flicker`


### Security scanner <a id="security-scanner"></a>

`createObject('security-scanner', { variant: 'x-ray' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>x-ray</b></sub></td><td align="center"><sub><b>walk-through</b></sub></td><td align="center"><sub><b>body-scanner</b></sub></td><td align="center"><sub><b>lane</b></sub></td></tr>
</table>

**Variants:** `x-ray`, `walk-through`, `body-scanner`, `lane`

**Animations:** `running`, `clear`, `alarm`


### Windsock <a id="windsock"></a>

`createObject('windsock', { variant: 'pole' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><sub><b>pole</b></sub></td><td align="center"><sub><b>lit</b></sub></td><td align="center"><sub><b>rooftop</b></sub></td></tr>
</table>

**Variants:** `pole`, `lit`, `rooftop`

**Animations:** `wind`


### Runway light <a id="runway-light"></a>

`createObject('runway-light', { variant: 'edge' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><sub><b>edge</b></sub></td><td align="center"><sub><b>threshold</b></sub></td><td align="center"><sub><b>taxiway</b></sub></td><td align="center"><sub><b>runway-end</b></sub></td></tr>
<tr><td align="center"><sub><b>inset</b></sub></td><td align="center"><sub><b>papi</b></sub></td></tr>
</table>

**Variants:** `edge`, `threshold`, `taxiway`, `runway-end`, `inset`, `papi`

**Animations:** `lights`


### Airfield sign <a id="airfield-sign"></a>

`createObject('airfield-sign', { variant: 'location' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><sub><b>location</b></sub></td><td align="center"><sub><b>direction</b></sub></td><td align="center"><sub><b>runway-holding</b></sub></td><td align="center"><sub><b>distance-remaining</b></sub></td></tr>
<tr><td align="center"><sub><b>gate</b></sub></td></tr>
</table>

**Variants:** `location`, `direction`, `runway-holding`, `distance-remaining`, `gate`

**Animations:** `lights`


### Baggage cart <a id="baggage-cart"></a>

`createObject('baggage-cart', { variant: 'open' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>open</b></sub></td><td align="center"><sub><b>covered</b></sub></td><td align="center"><sub><b>train</b></sub></td><td align="center"><sub><b>open-train</b></sub></td></tr>
</table>

**Variants:** `open`, `covered`, `train`, `open-train`

| Option | Description |
|---|---|
| `color` | frame color |

**Animations:** `roll`


### Barrel (HD) <a id="hd-barrel"></a>

`createObject('hd-barrel', { variant: 'steel-blue' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>steel-blue</b></sub></td><td align="center"><sub><b>steel-red-rusty</b></sub></td><td align="center"><sub><b>oak</b></sub></td></tr>
</table>

**Variants:** `steel-blue`, `steel-red-rusty`, `oak`

| Option | Description |
|---|---|
| `color` | drum paint |


### Bench (HD) <a id="hd-bench"></a>

`createObject('hd-bench', { variant: 'park-cast-iron' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>park-cast-iron</b></sub></td><td align="center"><sub><b>park-long</b></sub></td><td align="center"><sub><b>concrete-modern</b></sub></td><td align="center"><sub><b>steel-modern</b></sub></td></tr>
</table>

**Variants:** `park-cast-iron`, `park-long`, `concrete-modern`, `steel-modern`

| Option | Description |
|---|---|
| `color` | frame color |


### Bike rack (HD) <a id="hd-bike-rack"></a>

`createObject('hd-bike-rack', { variant: 'steel-three' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>steel-three</b></sub></td><td align="center"><sub><b>green-five</b></sub></td></tr>
</table>

**Variants:** `steel-three`, `green-five`

| Option | Description |
|---|---|
| `color` | paint color |


### Bollard (HD) <a id="hd-bollard"></a>

`createObject('hd-bollard', { variant: 'stainless' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>stainless</b></sub></td><td align="center"><sub><b>cast-iron-black</b></sub></td><td align="center"><sub><b>concrete-dome</b></sub></td></tr>
</table>

**Variants:** `stainless`, `cast-iron-black`, `concrete-dome`

| Option | Description |
|---|---|
| `color` | paint color |


### Wooden crate (HD) <a id="hd-crate"></a>

`createObject('hd-crate', { variant: 'pine-lidded' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>pine-lidded</b></sub></td><td align="center"><sub><b>weathered-open</b></sub></td><td align="center"><sub><b>large</b></sub></td></tr>
</table>

**Variants:** `pine-lidded`, `weathered-open`, `large`


### Fence (HD) <a id="hd-fence"></a>

`createObject('hd-fence', { variant: 'white-picket' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>white-picket</b></sub></td><td align="center"><sub><b>split-rail</b></sub></td><td align="center"><sub><b>wrought-iron</b></sub></td><td align="center"><sub><b>green-picket</b></sub></td></tr>
</table>

**Variants:** `white-picket`, `split-rail`, `wrought-iron`, `green-picket`

| Option | Description |
|---|---|
| `color` | paint color |


### Fire hydrant (HD) <a id="hd-fire-hydrant"></a>

`createObject('hd-fire-hydrant', { variant: 'red-classic' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>red-classic</b></sub></td><td align="center"><sub><b>yellow-silver-caps</b></sub></td><td align="center"><sub><b>tall-red-white</b></sub></td></tr>
</table>

**Variants:** `red-classic`, `yellow-silver-caps`, `tall-red-white`

| Option | Description |
|---|---|
| `color` | paint color |


### Garden gnome (HD) <a id="hd-garden-gnome"></a>

`createObject('hd-garden-gnome', { variant: 'classic' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>classic</b></sub></td><td align="center"><sub><b>green-lantern</b></sub></td><td align="center"><sub><b>large-blue</b></sub></td></tr>
</table>

**Variants:** `classic`, `green-lantern`, `large-blue`


### Lamppost (HD) <a id="hd-lamppost"></a>

`createObject('hd-lamppost', { variant: 'victorian-green' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>victorian-green</b></sub></td><td align="center"><sub><b>victorian-black</b></sub></td><td align="center"><sub><b>modern-led</b></sub></td></tr>
</table>

**Variants:** `victorian-green`, `victorian-black`, `modern-led`

| Option | Description |
|---|---|
| `color` | paint color |


### Mailbox (HD) <a id="hd-mailbox"></a>

`createObject('hd-mailbox', { variant: 'us-black' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>us-black</b></sub></td><td align="center"><sub><b>us-green</b></sub></td><td align="center"><sub><b>uk-pillar-red</b></sub></td></tr>
</table>

**Variants:** `us-black`, `us-green`, `uk-pillar-red`

| Option | Description |
|---|---|
| `color` | paint color |


### Manhole cover (HD) <a id="hd-manhole"></a>

`createObject('hd-manhole', { variant: 'round' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>round</b></sub></td><td align="center"><sub><b>round-in-asphalt</b></sub></td></tr>
</table>

**Variants:** `round`, `round-in-asphalt`


### Pallet (HD) <a id="hd-pallet"></a>

`createObject('hd-pallet', { variant: 'euro' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>euro</b></sub></td><td align="center"><sub><b>weathered</b></sub></td></tr>
</table>

**Variants:** `euro`, `weathered`


### Picnic table (HD) <a id="hd-picnic-table"></a>

`createObject('hd-picnic-table', { variant: 'natural' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>natural</b></sub></td><td align="center"><sub><b>weathered-long</b></sub></td></tr>
</table>

**Variants:** `natural`, `weathered-long`


### Planter (HD) <a id="hd-planter"></a>

`createObject('hd-planter', { variant: 'wood-box' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>wood-box</b></sub></td><td align="center"><sub><b>corten-box-flowers</b></sub></td><td align="center"><sub><b>concrete-bowl</b></sub></td></tr>
</table>

**Variants:** `wood-box`, `corten-box-flowers`, `concrete-bowl`


### Traffic cone (HD) <a id="hd-traffic-cone"></a>

`createObject('hd-traffic-cone', { variant: 'tall' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>tall</b></sub></td><td align="center"><sub><b>small</b></sub></td></tr>
</table>

**Variants:** `tall`, `small`


### Trash can (HD) <a id="hd-trash-can"></a>

`createObject('hd-trash-can', { variant: 'galvanized' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>galvanized</b></sub></td><td align="center"><sub><b>park-slatted</b></sub></td></tr>
</table>

**Variants:** `galvanized`, `park-slatted`

| Option | Description |
|---|---|
| `color` | frame color |


### Wheelbarrow (HD) <a id="hd-wheelbarrow"></a>

`createObject('hd-wheelbarrow', { variant: 'green' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>green</b></sub></td><td align="center"><sub><b>red</b></sub></td></tr>
</table>

**Variants:** `green`, `red`

| Option | Description |
|---|---|
| `color` | tray color |


## People

### Person <a id="person"></a>

`createObject('person', { variant: 'man' })` · 49 versions · procedural JS

<table>
<tr><td align="center"><img src="images/person-man.webp" width="200" alt="person man"><br><sub><b>man</b></sub></td><td align="center"><img src="images/person-woman.webp" width="200" alt="person woman"><br><sub><b>woman</b></sub></td><td align="center"><img src="images/person-boy.webp" width="200" alt="person boy"><br><sub><b>boy</b></sub></td><td align="center"><img src="images/person-girl.webp" width="200" alt="person girl"><br><sub><b>girl</b></sub></td></tr>
<tr><td align="center"><img src="images/person-elder-man.webp" width="200" alt="person elder-man"><br><sub><b>elder-man</b></sub></td><td align="center"><img src="images/person-elder-woman.webp" width="200" alt="person elder-woman"><br><sub><b>elder-woman</b></sub></td><td align="center"><img src="images/person-business.webp" width="200" alt="person business"><br><sub><b>business</b></sub></td><td align="center"><img src="images/person-business-woman.webp" width="200" alt="person business-woman"><br><sub><b>business-woman</b></sub></td></tr>
<tr><td align="center"><img src="images/person-athlete.webp" width="200" alt="person athlete"><br><sub><b>athlete</b></sub></td><td align="center"><img src="images/person-worker.webp" width="200" alt="person worker"><br><sub><b>worker</b></sub></td><td align="center"><img src="images/person-doctor.webp" width="200" alt="person doctor"><br><sub><b>doctor</b></sub></td><td align="center"><img src="images/person-police.webp" width="200" alt="person police"><br><sub><b>police</b></sub></td></tr>
<tr><td align="center"><img src="images/person-chef.webp" width="200" alt="person chef"><br><sub><b>chef</b></sub></td><td align="center"><sub><b>firefighter</b></sub></td><td align="center"><sub><b>student</b></sub></td><td align="center"><sub><b>tourist</b></sub></td></tr>
<tr><td align="center"><sub><b>nurse</b></sub></td><td align="center"><sub><b>paramedic</b></sub></td><td align="center"><sub><b>mechanic</b></sub></td><td align="center"><sub><b>pilot</b></sub></td></tr>
<tr><td align="center"><sub><b>flight-attendant</b></sub></td><td align="center"><sub><b>security-guard</b></sub></td><td align="center"><sub><b>teacher</b></sub></td><td align="center"><sub><b>scientist</b></sub></td></tr>
<tr><td align="center"><sub><b>farmer</b></sub></td><td align="center"><sub><b>artist</b></sub></td><td align="center"><sub><b>musician</b></sub></td><td align="center"><sub><b>waiter</b></sub></td></tr>
<tr><td align="center"><sub><b>cashier</b></sub></td><td align="center"><sub><b>judge</b></sub></td><td align="center"><sub><b>astronaut</b></sub></td><td align="center"><sub><b>hiker</b></sub></td></tr>
<tr><td align="center"><sub><b>skier</b></sub></td><td align="center"><sub><b>runner</b></sub></td><td align="center"><sub><b>cyclist</b></sub></td><td align="center"><sub><b>swimmer</b></sub></td></tr>
<tr><td align="center"><sub><b>lifeguard</b></sub></td><td align="center"><sub><b>courier</b></sub></td><td align="center"><sub><b>mail-carrier</b></sub></td><td align="center"><sub><b>barista</b></sub></td></tr>
<tr><td align="center"><sub><b>gardener</b></sub></td><td align="center"><sub><b>office-worker</b></sub></td><td align="center"><sub><b>shopper</b></sub></td><td align="center"><sub><b>grandpa</b></sub></td></tr>
<tr><td align="center"><sub><b>teen-boy</b></sub></td><td align="center"><sub><b>teen-girl</b></sub></td><td align="center"><sub><b>toddler-boy</b></sub></td><td align="center"><sub><b>toddler-girl</b></sub></td></tr>
<tr><td align="center"><sub><b>photographer</b></sub></td></tr>
</table>

**Variants:** `man`, `woman`, `boy`, `girl`, `elder-man`, `elder-woman`, `business`, `business-woman`, `athlete`, `worker`, `doctor`, `police`, `chef`, `firefighter`, `student`, `tourist`, `nurse`, `paramedic`, `mechanic`, `pilot`, `flight-attendant`, `security-guard`, `teacher`, `scientist`, `farmer`, `artist`, `musician`, `waiter`, `cashier`, `judge`, `astronaut`, `hiker`, `skier`, `runner`, `cyclist`, `swimmer`, `lifeguard`, `courier`, `mail-carrier`, `barista`, `gardener`, `office-worker`, `shopper`, `grandpa`, `teen-boy`, `teen-girl`, `toddler-boy`, `toddler-girl`, `photographer`

| Option | Description |
|---|---|
| `detail` | 'high' (default, ~30–40k triangles) | 'low' (~5–8k, for crowds) |
| `trim` | alternative to the "<variant>-<trim>" name, e.g. { variant: "nurse", trim: "winter" } |
| `skinTone` | 0–5 or color |
| `hairColor` | color |
| `hairStyle` | short | buzz | curly | long | wavy | bob | ponytail | bun | braid | afro | quiff | balding | bald |
| `beard` | full | stubble | moustache | goatee |
| `shirtColor` | color |
| `pantsColor` | color |
| `shoeColor` | color |
| `hat` | hardhat | policecap | cap | beanie | sunhat | fedora | cowboy | beret | toque | firehelmet | bikehelmet | false |
| `hatColor` | color |
| `glasses` | true | 'sun' |
| `headphones` | boolean |
| `tieColor` | color |
| `face` | 0–4: facial structure variation |
| `height` | metres |
| `seed` | number: randomizes everything not given |

**Animations:** `walk`, `run`, `idle`, `talk`, `wave`, `point`, `look-around`, `phone-call`, `jump`, `sit`, `typing`, `clap`, `dance`


### Artist mannequin (HD) <a id="hd-artist-mannequin"></a>

`createObject('hd-artist-mannequin', { variant: 'standing' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>standing</b></sub></td><td align="center"><sub><b>walking</b></sub></td><td align="center"><sub><b>reaching</b></sub></td><td align="center"><sub><b>thinking</b></sub></td></tr>
<tr><td align="center"><sub><b>dark-walnut</b></sub></td></tr>
</table>

**Variants:** `standing`, `walking`, `reaching`, `thinking`, `dark-walnut`


### Dress form (HD) <a id="hd-dress-form"></a>

`createObject('hd-dress-form', { variant: 'linen' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>linen</b></sub></td><td align="center"><sub><b>black-brass</b></sub></td><td align="center"><sub><b>floral-tape</b></sub></td><td align="center"><sub><b>grey</b></sub></td></tr>
</table>

**Variants:** `linen`, `black-brass`, `floral-tape`, `grey`

| Option | Description |
|---|---|
| `color` | fabric color |


## Animals

### Dog <a id="dog"></a>

`createObject('dog', { variant: 'labrador' })` · 25 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dog-labrador.webp" width="200" alt="dog labrador"><br><sub><b>labrador</b></sub></td><td align="center"><img src="images/dog-golden-retriever.webp" width="200" alt="dog golden-retriever"><br><sub><b>golden-retriever</b></sub></td><td align="center"><sub><b>german-shepherd</b></sub></td><td align="center"><sub><b>husky</b></sub></td></tr>
<tr><td align="center"><sub><b>dalmatian</b></sub></td><td align="center"><sub><b>dachshund</b></sub></td><td align="center"><sub><b>beagle</b></sub></td><td align="center"><sub><b>poodle</b></sub></td></tr>
<tr><td align="center"><sub><b>bulldog</b></sub></td><td align="center"><sub><b>pug</b></sub></td><td align="center"><sub><b>chihuahua</b></sub></td><td align="center"><sub><b>corgi</b></sub></td></tr>
<tr><td align="center"><sub><b>rottweiler</b></sub></td><td align="center"><sub><b>doberman</b></sub></td><td align="center"><sub><b>great-dane</b></sub></td><td align="center"><sub><b>border-collie</b></sub></td></tr>
<tr><td align="center"><sub><b>boxer</b></sub></td><td align="center"><sub><b>shiba-inu</b></sub></td><td align="center"><sub><b>greyhound</b></sub></td><td align="center"><sub><b>saint-bernard</b></sub></td></tr>
<tr><td align="center"><sub><b>jack-russell</b></sub></td><td align="center"><sub><b>yorkshire-terrier</b></sub></td><td align="center"><sub><b>shih-tzu</b></sub></td><td align="center"><sub><b>rough-collie</b></sub></td></tr>
<tr><td align="center"><sub><b>bernese</b></sub></td></tr>
</table>

**Variants:** `labrador`, `golden-retriever`, `german-shepherd`, `husky`, `dalmatian`, `dachshund`, `beagle`, `poodle`, `bulldog`, `pug`, `chihuahua`, `corgi`, `rottweiler`, `doberman`, `great-dane`, `border-collie`, `boxer`, `shiba-inu`, `greyhound`, `saint-bernard`, `jack-russell`, `yorkshire-terrier`, `shih-tzu`, `rough-collie`, `bernese`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `sit`, `lie`, `wag`


### Cat <a id="cat"></a>

`createObject('cat', { variant: 'tabby' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cat-tabby.webp" width="200" alt="cat tabby"><br><sub><b>tabby</b></sub></td><td align="center"><img src="images/cat-ginger.webp" width="200" alt="cat ginger"><br><sub><b>ginger</b></sub></td><td align="center"><sub><b>black</b></sub></td><td align="center"><sub><b>siamese</b></sub></td></tr>
<tr><td align="center"><sub><b>persian</b></sub></td><td align="center"><sub><b>maine-coon</b></sub></td><td align="center"><sub><b>sphynx</b></sub></td><td align="center"><sub><b>bengal</b></sub></td></tr>
<tr><td align="center"><sub><b>tuxedo</b></sub></td><td align="center"><sub><b>calico</b></sub></td><td align="center"><sub><b>russian-blue</b></sub></td><td align="center"><sub><b>scottish-fold</b></sub></td></tr>
</table>

**Variants:** `tabby`, `ginger`, `black`, `siamese`, `persian`, `maine-coon`, `sphynx`, `bengal`, `tuxedo`, `calico`, `russian-blue`, `scottish-fold`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `sit`, `lie`


### Horse <a id="horse"></a>

`createObject('horse', { variant: 'bay' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/horse-bay.webp" width="200" alt="horse bay"><br><sub><b>bay</b></sub></td><td align="center"><img src="images/horse-chestnut.webp" width="200" alt="horse chestnut"><br><sub><b>chestnut</b></sub></td><td align="center"><sub><b>black</b></sub></td><td align="center"><sub><b>grey</b></sub></td></tr>
<tr><td align="center"><sub><b>palomino</b></sub></td><td align="center"><sub><b>pinto</b></sub></td><td align="center"><sub><b>appaloosa</b></sub></td><td align="center"><sub><b>clydesdale</b></sub></td></tr>
<tr><td align="center"><sub><b>shetland-pony</b></sub></td><td align="center"><sub><b>arabian</b></sub></td></tr>
</table>

**Variants:** `bay`, `chestnut`, `black`, `grey`, `palomino`, `pinto`, `appaloosa`, `clydesdale`, `shetland-pony`, `arabian`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Donkey & Zebra <a id="donkey-zebra"></a>

`createObject('donkey-zebra', { variant: 'zebra' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/donkey-zebra-zebra.webp" width="200" alt="donkey-zebra zebra"><br><sub><b>zebra</b></sub></td><td align="center"><img src="images/donkey-zebra-donkey.webp" width="200" alt="donkey-zebra donkey"><br><sub><b>donkey</b></sub></td><td align="center"><sub><b>mule</b></sub></td><td align="center"><sub><b>przewalski</b></sub></td></tr>
</table>

**Variants:** `zebra`, `donkey`, `mule`, `przewalski`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Cattle <a id="cattle"></a>

`createObject('cattle', { variant: 'holstein' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cattle-holstein.webp" width="200" alt="cattle holstein"><br><sub><b>holstein</b></sub></td><td align="center"><img src="images/cattle-angus.webp" width="200" alt="cattle angus"><br><sub><b>angus</b></sub></td><td align="center"><sub><b>hereford</b></sub></td><td align="center"><sub><b>highland</b></sub></td></tr>
<tr><td align="center"><sub><b>jersey</b></sub></td><td align="center"><sub><b>longhorn</b></sub></td><td align="center"><sub><b>brahman</b></sub></td><td align="center"><sub><b>bull</b></sub></td></tr>
<tr><td align="center"><sub><b>yak</b></sub></td><td align="center"><sub><b>bison</b></sub></td><td align="center"><sub><b>water-buffalo</b></sub></td><td align="center"><sub><b>ox</b></sub></td></tr>
</table>

**Variants:** `holstein`, `angus`, `hereford`, `highland`, `jersey`, `longhorn`, `brahman`, `bull`, `yak`, `bison`, `water-buffalo`, `ox`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Pig <a id="pig"></a>

`createObject('pig', { variant: 'domestic' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pig-domestic.webp" width="200" alt="pig domestic"><br><sub><b>domestic</b></sub></td><td align="center"><img src="images/pig-spotted.webp" width="200" alt="pig spotted"><br><sub><b>spotted</b></sub></td><td align="center"><sub><b>berkshire</b></sub></td><td align="center"><sub><b>wild-boar</b></sub></td></tr>
<tr><td align="center"><sub><b>warthog</b></sub></td><td align="center"><sub><b>potbelly</b></sub></td></tr>
</table>

**Variants:** `domestic`, `spotted`, `berkshire`, `wild-boar`, `warthog`, `potbelly`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Sheep & Goat <a id="sheep-goat"></a>

`createObject('sheep-goat', { variant: 'merino' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sheep-goat-merino.webp" width="200" alt="sheep-goat merino"><br><sub><b>merino</b></sub></td><td align="center"><img src="images/sheep-goat-suffolk.webp" width="200" alt="sheep-goat suffolk"><br><sub><b>suffolk</b></sub></td><td align="center"><sub><b>ram</b></sub></td><td align="center"><sub><b>black-sheep</b></sub></td></tr>
<tr><td align="center"><sub><b>bighorn</b></sub></td><td align="center"><sub><b>alpine-goat</b></sub></td><td align="center"><sub><b>pygmy-goat</b></sub></td><td align="center"><sub><b>ibex</b></sub></td></tr>
<tr><td align="center"><sub><b>mountain-goat</b></sub></td></tr>
</table>

**Variants:** `merino`, `suffolk`, `ram`, `black-sheep`, `bighorn`, `alpine-goat`, `pygmy-goat`, `ibex`, `mountain-goat`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Camel & Llama <a id="camel"></a>

`createObject('camel', { variant: 'dromedary' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/camel-dromedary.webp" width="200" alt="camel dromedary"><br><sub><b>dromedary</b></sub></td><td align="center"><img src="images/camel-bactrian.webp" width="200" alt="camel bactrian"><br><sub><b>bactrian</b></sub></td><td align="center"><sub><b>llama</b></sub></td><td align="center"><sub><b>alpaca</b></sub></td></tr>
</table>

**Variants:** `dromedary`, `bactrian`, `llama`, `alpaca`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Deer & Antelope <a id="deer"></a>

`createObject('deer', { variant: 'white-tailed' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/deer-white-tailed.webp" width="200" alt="deer white-tailed"><br><sub><b>white-tailed</b></sub></td><td align="center"><img src="images/deer-red-deer.webp" width="200" alt="deer red-deer"><br><sub><b>red-deer</b></sub></td><td align="center"><sub><b>elk</b></sub></td><td align="center"><sub><b>moose</b></sub></td></tr>
<tr><td align="center"><sub><b>reindeer</b></sub></td><td align="center"><sub><b>fallow</b></sub></td><td align="center"><sub><b>roe</b></sub></td><td align="center"><sub><b>gazelle</b></sub></td></tr>
<tr><td align="center"><sub><b>impala</b></sub></td><td align="center"><sub><b>oryx</b></sub></td></tr>
</table>

**Variants:** `white-tailed`, `red-deer`, `elk`, `moose`, `reindeer`, `fallow`, `roe`, `gazelle`, `impala`, `oryx`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Big Cat <a id="big-cat"></a>

`createObject('big-cat', { variant: 'lion' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/big-cat-lion.webp" width="200" alt="big-cat lion"><br><sub><b>lion</b></sub></td><td align="center"><img src="images/big-cat-lioness.webp" width="200" alt="big-cat lioness"><br><sub><b>lioness</b></sub></td><td align="center"><sub><b>tiger</b></sub></td><td align="center"><sub><b>white-tiger</b></sub></td></tr>
<tr><td align="center"><sub><b>leopard</b></sub></td><td align="center"><sub><b>snow-leopard</b></sub></td><td align="center"><sub><b>cheetah</b></sub></td><td align="center"><sub><b>jaguar</b></sub></td></tr>
<tr><td align="center"><sub><b>cougar</b></sub></td><td align="center"><sub><b>lynx</b></sub></td><td align="center"><sub><b>panther</b></sub></td></tr>
</table>

**Variants:** `lion`, `lioness`, `tiger`, `white-tiger`, `leopard`, `snow-leopard`, `cheetah`, `jaguar`, `cougar`, `lynx`, `panther`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `sit`, `lie`


### Wolf & Fox <a id="wild-canine"></a>

`createObject('wild-canine', { variant: 'wolf' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wild-canine-wolf.webp" width="200" alt="wild-canine wolf"><br><sub><b>wolf</b></sub></td><td align="center"><img src="images/wild-canine-arctic-wolf.webp" width="200" alt="wild-canine arctic-wolf"><br><sub><b>arctic-wolf</b></sub></td><td align="center"><sub><b>fox</b></sub></td><td align="center"><sub><b>arctic-fox</b></sub></td></tr>
<tr><td align="center"><sub><b>fennec</b></sub></td><td align="center"><sub><b>coyote</b></sub></td><td align="center"><sub><b>jackal</b></sub></td><td align="center"><sub><b>hyena</b></sub></td></tr>
<tr><td align="center"><sub><b>wild-dog</b></sub></td></tr>
</table>

**Variants:** `wolf`, `arctic-wolf`, `fox`, `arctic-fox`, `fennec`, `coyote`, `jackal`, `hyena`, `wild-dog`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `sit`, `lie`


### Bear <a id="bear"></a>

`createObject('bear', { variant: 'brown-bear' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bear-brown-bear.webp" width="200" alt="bear brown-bear"><br><sub><b>brown-bear</b></sub></td><td align="center"><img src="images/bear-grizzly.webp" width="200" alt="bear grizzly"><br><sub><b>grizzly</b></sub></td><td align="center"><sub><b>polar-bear</b></sub></td><td align="center"><sub><b>black-bear</b></sub></td></tr>
<tr><td align="center"><sub><b>panda</b></sub></td><td align="center"><sub><b>sun-bear</b></sub></td></tr>
</table>

**Variants:** `brown-bear`, `grizzly`, `polar-bear`, `black-bear`, `panda`, `sun-bear`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `sit`, `lie`


### Elephant <a id="elephant"></a>

`createObject('elephant', { variant: 'african-elephant' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/elephant-african-elephant.webp" width="200" alt="elephant african-elephant"><br><sub><b>african-elephant</b></sub></td><td align="center"><img src="images/elephant-asian-elephant.webp" width="200" alt="elephant asian-elephant"><br><sub><b>asian-elephant</b></sub></td><td align="center"><sub><b>mammoth</b></sub></td></tr>
</table>

**Variants:** `african-elephant`, `asian-elephant`, `mammoth`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `lie`


### Giraffe <a id="giraffe"></a>

`createObject('giraffe', { variant: 'reticulated' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/giraffe-reticulated.webp" width="200" alt="giraffe reticulated"><br><sub><b>reticulated</b></sub></td><td align="center"><img src="images/giraffe-masai.webp" width="200" alt="giraffe masai"><br><sub><b>masai</b></sub></td><td align="center"><sub><b>okapi</b></sub></td></tr>
</table>

**Variants:** `reticulated`, `masai`, `okapi`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `graze`, `lie`


### Rhino & Hippo <a id="rhino-hippo"></a>

`createObject('rhino-hippo', { variant: 'white-rhino' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rhino-hippo-white-rhino.webp" width="200" alt="rhino-hippo white-rhino"><br><sub><b>white-rhino</b></sub></td><td align="center"><img src="images/rhino-hippo-black-rhino.webp" width="200" alt="rhino-hippo black-rhino"><br><sub><b>black-rhino</b></sub></td><td align="center"><sub><b>hippo</b></sub></td><td align="center"><sub><b>pygmy-hippo</b></sub></td></tr>
</table>

**Variants:** `white-rhino`, `black-rhino`, `hippo`, `pygmy-hippo`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `lie`


### Small Mammal <a id="small-mammal"></a>

`createObject('small-mammal', { variant: 'rabbit' })` · 15 versions · procedural JS

<table>
<tr><td align="center"><img src="images/small-mammal-rabbit.webp" width="200" alt="small-mammal rabbit"><br><sub><b>rabbit</b></sub></td><td align="center"><img src="images/small-mammal-hare.webp" width="200" alt="small-mammal hare"><br><sub><b>hare</b></sub></td><td align="center"><sub><b>squirrel</b></sub></td><td align="center"><sub><b>chipmunk</b></sub></td></tr>
<tr><td align="center"><sub><b>hamster</b></sub></td><td align="center"><sub><b>guinea-pig</b></sub></td><td align="center"><sub><b>mouse</b></sub></td><td align="center"><sub><b>rat</b></sub></td></tr>
<tr><td align="center"><sub><b>hedgehog</b></sub></td><td align="center"><sub><b>raccoon</b></sub></td><td align="center"><sub><b>skunk</b></sub></td><td align="center"><sub><b>otter</b></sub></td></tr>
<tr><td align="center"><sub><b>beaver</b></sub></td><td align="center"><sub><b>ferret</b></sub></td><td align="center"><sub><b>badger</b></sub></td></tr>
</table>

**Variants:** `rabbit`, `hare`, `squirrel`, `chipmunk`, `hamster`, `guinea-pig`, `mouse`, `rat`, `hedgehog`, `raccoon`, `skunk`, `otter`, `beaver`, `ferret`, `badger`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `trot`, `run`, `sniff`, `sit`, `lie`


### Bird <a id="bird"></a>

`createObject('bird', { variant: 'robin' })` · 16 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bird-robin.webp" width="200" alt="bird robin"><br><sub><b>robin</b></sub></td><td align="center"><img src="images/bird-sparrow.webp" width="200" alt="bird sparrow"><br><sub><b>sparrow</b></sub></td><td align="center"><sub><b>bluejay</b></sub></td><td align="center"><sub><b>cardinal</b></sub></td></tr>
<tr><td align="center"><sub><b>crow</b></sub></td><td align="center"><sub><b>raven</b></sub></td><td align="center"><sub><b>pigeon</b></sub></td><td align="center"><sub><b>dove</b></sub></td></tr>
<tr><td align="center"><sub><b>parrot</b></sub></td><td align="center"><sub><b>macaw</b></sub></td><td align="center"><sub><b>cockatoo</b></sub></td><td align="center"><sub><b>budgie</b></sub></td></tr>
<tr><td align="center"><sub><b>hummingbird</b></sub></td><td align="center"><sub><b>woodpecker</b></sub></td><td align="center"><sub><b>kingfisher</b></sub></td><td align="center"><sub><b>swallow</b></sub></td></tr>
</table>

**Variants:** `robin`, `sparrow`, `bluejay`, `cardinal`, `crow`, `raven`, `pigeon`, `dove`, `parrot`, `macaw`, `cockatoo`, `budgie`, `hummingbird`, `woodpecker`, `kingfisher`, `swallow`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `hop`, `peck`, `perch`, `fly`


### Poultry <a id="poultry"></a>

`createObject('poultry', { variant: 'hen' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/poultry-hen.webp" width="200" alt="poultry hen"><br><sub><b>hen</b></sub></td><td align="center"><img src="images/poultry-rooster.webp" width="200" alt="poultry rooster"><br><sub><b>rooster</b></sub></td><td align="center"><sub><b>brown-hen</b></sub></td><td align="center"><sub><b>turkey</b></sub></td></tr>
<tr><td align="center"><sub><b>peacock</b></sub></td><td align="center"><sub><b>ostrich</b></sub></td><td align="center"><sub><b>emu</b></sub></td></tr>
</table>

**Variants:** `hen`, `rooster`, `brown-hen`, `turkey`, `peacock`, `ostrich`, `emu`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `peck`, `perch`, `fly`


### Water Bird <a id="water-bird"></a>

`createObject('water-bird', { variant: 'mallard' })` · 17 versions · procedural JS

<table>
<tr><td align="center"><img src="images/water-bird-mallard.webp" width="200" alt="water-bird mallard"><br><sub><b>mallard</b></sub></td><td align="center"><img src="images/water-bird-white-duck.webp" width="200" alt="water-bird white-duck"><br><sub><b>white-duck</b></sub></td><td align="center"><sub><b>goose</b></sub></td><td align="center"><sub><b>canada-goose</b></sub></td></tr>
<tr><td align="center"><sub><b>swan</b></sub></td><td align="center"><sub><b>black-swan</b></sub></td><td align="center"><sub><b>seagull</b></sub></td><td align="center"><sub><b>pelican</b></sub></td></tr>
<tr><td align="center"><sub><b>puffin</b></sub></td><td align="center"><sub><b>penguin</b></sub></td><td align="center"><sub><b>king-penguin</b></sub></td><td align="center"><sub><b>adelie</b></sub></td></tr>
<tr><td align="center"><sub><b>gentoo</b></sub></td><td align="center"><sub><b>chinstrap</b></sub></td><td align="center"><sub><b>flamingo</b></sub></td><td align="center"><sub><b>heron</b></sub></td></tr>
<tr><td align="center"><sub><b>stork</b></sub></td></tr>
</table>

**Variants:** `mallard`, `white-duck`, `goose`, `canada-goose`, `swan`, `black-swan`, `seagull`, `pelican`, `puffin`, `penguin`, `king-penguin`, `adelie`, `gentoo`, `chinstrap`, `flamingo`, `heron`, `stork`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `peck`, `perch`, `fly`


### Bird of Prey <a id="bird-of-prey"></a>

`createObject('bird-of-prey', { variant: 'golden-eagle' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bird-of-prey-golden-eagle.webp" width="200" alt="bird-of-prey golden-eagle"><br><sub><b>golden-eagle</b></sub></td><td align="center"><img src="images/bird-of-prey-bald-eagle.webp" width="200" alt="bird-of-prey bald-eagle"><br><sub><b>bald-eagle</b></sub></td><td align="center"><sub><b>hawk</b></sub></td><td align="center"><sub><b>falcon</b></sub></td></tr>
<tr><td align="center"><sub><b>owl</b></sub></td><td align="center"><sub><b>snowy-owl</b></sub></td><td align="center"><sub><b>vulture</b></sub></td></tr>
</table>

**Variants:** `golden-eagle`, `bald-eagle`, `hawk`, `falcon`, `owl`, `snowy-owl`, `vulture`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `idle`, `walk`, `peck`, `perch`, `fly`


### Fish <a id="fish"></a>

`createObject('fish', { variant: 'goldfish' })` · 18 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fish-goldfish.webp" width="200" alt="fish goldfish"><br><sub><b>goldfish</b></sub></td><td align="center"><img src="images/fish-koi.webp" width="200" alt="fish koi"><br><sub><b>koi</b></sub></td><td align="center"><sub><b>clownfish</b></sub></td><td align="center"><sub><b>angelfish</b></sub></td></tr>
<tr><td align="center"><sub><b>betta</b></sub></td><td align="center"><sub><b>tuna</b></sub></td><td align="center"><sub><b>salmon</b></sub></td><td align="center"><sub><b>trout</b></sub></td></tr>
<tr><td align="center"><sub><b>bass</b></sub></td><td align="center"><sub><b>catfish</b></sub></td><td align="center"><sub><b>piranha</b></sub></td><td align="center"><sub><b>pufferfish</b></sub></td></tr>
<tr><td align="center"><sub><b>swordfish</b></sub></td><td align="center"><sub><b>barracuda</b></sub></td><td align="center"><sub><b>blue-tang</b></sub></td><td align="center"><sub><b>carp</b></sub></td></tr>
<tr><td align="center"><sub><b>perch</b></sub></td><td align="center"><sub><b>mackerel</b></sub></td></tr>
</table>

**Variants:** `goldfish`, `koi`, `clownfish`, `angelfish`, `betta`, `tuna`, `salmon`, `trout`, `bass`, `catfish`, `piranha`, `pufferfish`, `swordfish`, `barracuda`, `blue-tang`, `carp`, `perch`, `mackerel`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `swim`, `idle`


### Shark <a id="shark"></a>

`createObject('shark', { variant: 'great-white' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shark-great-white.webp" width="200" alt="shark great-white"><br><sub><b>great-white</b></sub></td><td align="center"><sub><b>hammerhead</b></sub></td><td align="center"><sub><b>tiger-shark</b></sub></td><td align="center"><sub><b>whale-shark</b></sub></td></tr>
<tr><td align="center"><sub><b>mako</b></sub></td><td align="center"><sub><b>nurse-shark</b></sub></td></tr>
</table>

**Variants:** `great-white`, `hammerhead`, `tiger-shark`, `whale-shark`, `mako`, `nurse-shark`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `swim`, `idle`


### Whale, Dolphin & Seal <a id="sea-mammal"></a>

`createObject('sea-mammal', { variant: 'dolphin' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sea-mammal-dolphin.webp" width="200" alt="sea-mammal dolphin"><br><sub><b>dolphin</b></sub></td><td align="center"><sub><b>orca</b></sub></td><td align="center"><sub><b>blue-whale</b></sub></td><td align="center"><sub><b>humpback</b></sub></td></tr>
<tr><td align="center"><sub><b>beluga</b></sub></td><td align="center"><sub><b>narwhal</b></sub></td><td align="center"><sub><b>seal</b></sub></td><td align="center"><sub><b>walrus</b></sub></td></tr>
<tr><td align="center"><sub><b>sea-lion</b></sub></td><td align="center"><sub><b>manatee</b></sub></td></tr>
</table>

**Variants:** `dolphin`, `orca`, `blue-whale`, `humpback`, `beluga`, `narwhal`, `seal`, `walrus`, `sea-lion`, `manatee`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `swim`, `idle`


### Reptile <a id="reptile"></a>

`createObject('reptile', { variant: 'python' })` · 18 versions · procedural JS

<table>
<tr><td align="center"><img src="images/reptile-python.webp" width="200" alt="reptile python"><br><sub><b>python</b></sub></td><td align="center"><sub><b>cobra</b></sub></td><td align="center"><sub><b>rattlesnake</b></sub></td><td align="center"><sub><b>viper</b></sub></td></tr>
<tr><td align="center"><sub><b>coral-snake</b></sub></td><td align="center"><sub><b>anaconda</b></sub></td><td align="center"><sub><b>green-mamba</b></sub></td><td align="center"><sub><b>iguana</b></sub></td></tr>
<tr><td align="center"><sub><b>gecko</b></sub></td><td align="center"><sub><b>chameleon</b></sub></td><td align="center"><sub><b>komodo</b></sub></td><td align="center"><sub><b>bearded-dragon</b></sub></td></tr>
<tr><td align="center"><sub><b>crocodile</b></sub></td><td align="center"><sub><b>alligator</b></sub></td><td align="center"><sub><b>sea-turtle</b></sub></td><td align="center"><sub><b>tortoise</b></sub></td></tr>
<tr><td align="center"><sub><b>box-turtle</b></sub></td><td align="center"><sub><b>snapping-turtle</b></sub></td></tr>
</table>

**Variants:** `python`, `cobra`, `rattlesnake`, `viper`, `coral-snake`, `anaconda`, `green-mamba`, `iguana`, `gecko`, `chameleon`, `komodo`, `bearded-dragon`, `crocodile`, `alligator`, `sea-turtle`, `tortoise`, `box-turtle`, `snapping-turtle`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `slither`, `idle`


### Amphibian <a id="amphibian"></a>

`createObject('amphibian', { variant: 'frog' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/amphibian-frog.webp" width="200" alt="amphibian frog"><br><sub><b>frog</b></sub></td><td align="center"><sub><b>toad</b></sub></td><td align="center"><sub><b>tree-frog</b></sub></td><td align="center"><sub><b>poison-dart-frog</b></sub></td></tr>
<tr><td align="center"><sub><b>bullfrog</b></sub></td><td align="center"><sub><b>salamander</b></sub></td><td align="center"><sub><b>newt</b></sub></td><td align="center"><sub><b>axolotl</b></sub></td></tr>
</table>

**Variants:** `frog`, `toad`, `tree-frog`, `poison-dart-frog`, `bullfrog`, `salamander`, `newt`, `axolotl`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `hop`, `idle`


### Insect <a id="insect"></a>

`createObject('insect', { variant: 'monarch' })` · 16 versions · procedural JS

<table>
<tr><td align="center"><img src="images/insect-monarch.webp" width="200" alt="insect monarch"><br><sub><b>monarch</b></sub></td><td align="center"><sub><b>swallowtail</b></sub></td><td align="center"><sub><b>blue-morpho</b></sub></td><td align="center"><sub><b>cabbage-white</b></sub></td></tr>
<tr><td align="center"><sub><b>luna-moth</b></sub></td><td align="center"><sub><b>honeybee</b></sub></td><td align="center"><sub><b>bumblebee</b></sub></td><td align="center"><sub><b>wasp</b></sub></td></tr>
<tr><td align="center"><sub><b>ant</b></sub></td><td align="center"><sub><b>red-ant</b></sub></td><td align="center"><sub><b>ladybug</b></sub></td><td align="center"><sub><b>stag-beetle</b></sub></td></tr>
<tr><td align="center"><sub><b>rhino-beetle</b></sub></td><td align="center"><sub><b>dragonfly</b></sub></td><td align="center"><sub><b>grasshopper</b></sub></td><td align="center"><sub><b>mantis</b></sub></td></tr>
</table>

**Variants:** `monarch`, `swallowtail`, `blue-morpho`, `cabbage-white`, `luna-moth`, `honeybee`, `bumblebee`, `wasp`, `ant`, `red-ant`, `ladybug`, `stag-beetle`, `rhino-beetle`, `dragonfly`, `grasshopper`, `mantis`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `walk`, `flutter`, `idle`


### Spider, Crab & Sea Creature <a id="invertebrate"></a>

`createObject('invertebrate', { variant: 'tarantula' })` · 14 versions · procedural JS

<table>
<tr><td align="center"><img src="images/invertebrate-tarantula.webp" width="200" alt="invertebrate tarantula"><br><sub><b>tarantula</b></sub></td><td align="center"><sub><b>garden-spider</b></sub></td><td align="center"><sub><b>black-widow</b></sub></td><td align="center"><sub><b>scorpion</b></sub></td></tr>
<tr><td align="center"><sub><b>crab</b></sub></td><td align="center"><sub><b>hermit-crab</b></sub></td><td align="center"><sub><b>lobster</b></sub></td><td align="center"><sub><b>shrimp</b></sub></td></tr>
<tr><td align="center"><sub><b>octopus</b></sub></td><td align="center"><sub><b>squid</b></sub></td><td align="center"><sub><b>jellyfish</b></sub></td><td align="center"><sub><b>starfish</b></sub></td></tr>
<tr><td align="center"><sub><b>snail</b></sub></td><td align="center"><sub><b>sea-urchin</b></sub></td></tr>
</table>

**Variants:** `tarantula`, `garden-spider`, `black-widow`, `scorpion`, `crab`, `hermit-crab`, `lobster`, `shrimp`, `octopus`, `squid`, `jellyfish`, `starfish`, `snail`, `sea-urchin`

| Option | Description |
|---|---|
| `color` | main coat / plumage / body colour |
| `size` | uniform scale |
| `seed` | pattern variation |

**Animations:** `walk`, `idle`


### Bird (HD) <a id="hd-bird"></a>

`createObject('hd-bird', { variant: 'sparrow-branch' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>sparrow-branch</b></sub></td><td align="center"><sub><b>robin-branch</b></sub></td><td align="center"><sub><b>blue-jay-rock</b></sub></td><td align="center"><sub><b>cardinal-branch</b></sub></td></tr>
<tr><td align="center"><sub><b>goldfinch-rock</b></sub></td></tr>
</table>

**Variants:** `sparrow-branch`, `robin-branch`, `blue-jay-rock`, `cardinal-branch`, `goldfinch-rock`

| Option | Description |
|---|---|
| `color` | plumage color |


### Cat figurine (HD) <a id="hd-cat-figurine"></a>

`createObject('hd-cat-figurine', { variant: 'black-gloss' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>black-gloss</b></sub></td><td align="center"><sub><b>white-blue-eyes</b></sub></td><td align="center"><sub><b>ginger-matte</b></sub></td></tr>
</table>

**Variants:** `black-gloss`, `white-blue-eyes`, `ginger-matte`

| Option | Description |
|---|---|
| `color` | glaze color |


### Goldfish bowl (HD) <a id="hd-fishbowl"></a>

`createObject('hd-fishbowl', { variant: 'one-goldfish' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>one-goldfish</b></sub></td><td align="center"><sub><b>two-fish</b></sub></td></tr>
</table>

**Variants:** `one-goldfish`, `two-fish`


## Food

### Vegetable <a id="vegetable"></a>

`createObject('vegetable', { variant: 'carrot' })` · 23 versions · procedural JS

<table>
<tr><td align="center"><img src="images/vegetable-carrot.webp" width="200" alt="vegetable carrot"><br><sub><b>carrot</b></sub></td><td align="center"><img src="images/vegetable-tomato.webp" width="200" alt="vegetable tomato"><br><sub><b>tomato</b></sub></td><td align="center"><sub><b>cucumber</b></sub></td><td align="center"><sub><b>zucchini</b></sub></td></tr>
<tr><td align="center"><sub><b>lettuce</b></sub></td><td align="center"><sub><b>cabbage</b></sub></td><td align="center"><sub><b>broccoli</b></sub></td><td align="center"><sub><b>cauliflower</b></sub></td></tr>
<tr><td align="center"><sub><b>corn</b></sub></td><td align="center"><sub><b>potato</b></sub></td><td align="center"><sub><b>sweet-potato</b></sub></td><td align="center"><sub><b>onion</b></sub></td></tr>
<tr><td align="center"><sub><b>garlic</b></sub></td><td align="center"><sub><b>bell-pepper</b></sub></td><td align="center"><sub><b>chili</b></sub></td><td align="center"><sub><b>eggplant</b></sub></td></tr>
<tr><td align="center"><sub><b>pumpkin</b></sub></td><td align="center"><sub><b>butternut</b></sub></td><td align="center"><sub><b>mushroom</b></sub></td><td align="center"><sub><b>radish</b></sub></td></tr>
<tr><td align="center"><sub><b>beet</b></sub></td><td align="center"><sub><b>asparagus</b></sub></td><td align="center"><sub><b>peas</b></sub></td></tr>
</table>

**Variants:** `carrot`, `tomato`, `cucumber`, `zucchini`, `lettuce`, `cabbage`, `broccoli`, `cauliflower`, `corn`, `potato`, `sweet-potato`, `onion`, `garlic`, `bell-pepper`, `chili`, `eggplant`, `pumpkin`, `butternut`, `mushroom`, `radish`, `beet`, `asparagus`, `peas`


### Bread <a id="bread"></a>

`createObject('bread', { variant: 'baguette' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bread-baguette.webp" width="200" alt="bread baguette"><br><sub><b>baguette</b></sub></td><td align="center"><img src="images/bread-sourdough.webp" width="200" alt="bread sourdough"><br><sub><b>sourdough</b></sub></td><td align="center"><sub><b>batard</b></sub></td><td align="center"><sub><b>sandwich-loaf</b></sub></td></tr>
<tr><td align="center"><sub><b>rye</b></sub></td><td align="center"><sub><b>ciabatta</b></sub></td><td align="center"><sub><b>brioche</b></sub></td><td align="center"><sub><b>challah</b></sub></td></tr>
<tr><td align="center"><sub><b>roll</b></sub></td><td align="center"><sub><b>focaccia</b></sub></td><td align="center"><sub><b>pita</b></sub></td><td align="center"><sub><b>bun</b></sub></td></tr>
</table>

**Variants:** `baguette`, `sourdough`, `batard`, `sandwich-loaf`, `rye`, `ciabatta`, `brioche`, `challah`, `roll`, `focaccia`, `pita`, `bun`


### Pastry <a id="pastry"></a>

`createObject('pastry', { variant: 'croissant' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pastry-croissant.webp" width="200" alt="pastry croissant"><br><sub><b>croissant</b></sub></td><td align="center"><img src="images/pastry-pain-au-chocolat.webp" width="200" alt="pastry pain-au-chocolat"><br><sub><b>pain-au-chocolat</b></sub></td><td align="center"><sub><b>bagel</b></sub></td><td align="center"><sub><b>pretzel</b></sub></td></tr>
<tr><td align="center"><sub><b>cinnamon-roll</b></sub></td><td align="center"><sub><b>danish</b></sub></td><td align="center"><sub><b>eclair</b></sub></td><td align="center"><sub><b>macaron</b></sub></td></tr>
<tr><td align="center"><sub><b>waffle</b></sub></td><td align="center"><sub><b>churro</b></sub></td><td align="center"><sub><b>scone</b></sub></td></tr>
</table>

**Variants:** `croissant`, `pain-au-chocolat`, `bagel`, `pretzel`, `cinnamon-roll`, `danish`, `eclair`, `macaron`, `waffle`, `churro`, `scone`


### Donut <a id="donut"></a>

`createObject('donut', { variant: 'ring' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/donut-ring.webp" width="200" alt="donut ring"><br><sub><b>ring</b></sub></td><td align="center"><img src="images/donut-filled.webp" width="200" alt="donut filled"><br><sub><b>filled</b></sub></td><td align="center"><sub><b>cruller</b></sub></td><td align="center"><sub><b>long-john</b></sub></td></tr>
<tr><td align="center"><sub><b>mini</b></sub></td><td align="center"><sub><b>box</b></sub></td></tr>
</table>

**Variants:** `ring`, `filled`, `cruller`, `long-john`, `mini`, `box`


### Muffin <a id="muffin"></a>

`createObject('muffin', { variant: 'classic' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/muffin-classic.webp" width="200" alt="muffin classic"><br><sub><b>classic</b></sub></td><td align="center"><img src="images/muffin-tulip.webp" width="200" alt="muffin tulip"><br><sub><b>tulip</b></sub></td><td align="center"><sub><b>jumbo</b></sub></td><td align="center"><sub><b>mini</b></sub></td></tr>
</table>

**Variants:** `classic`, `tulip`, `jumbo`, `mini`


### Cupcake <a id="cupcake"></a>

`createObject('cupcake', { variant: 'swirl' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cupcake-swirl.webp" width="200" alt="cupcake swirl"><br><sub><b>swirl</b></sub></td><td align="center"><sub><b>dome</b></sub></td><td align="center"><sub><b>rosette</b></sub></td><td align="center"><sub><b>tall</b></sub></td></tr>
<tr><td align="center"><sub><b>trio</b></sub></td></tr>
</table>

**Variants:** `swirl`, `dome`, `rosette`, `tall`, `trio`


### Cake <a id="cake"></a>

`createObject('cake', { variant: 'layer' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cake-layer.webp" width="200" alt="cake layer"><br><sub><b>layer</b></sub></td><td align="center"><sub><b>slice</b></sub></td><td align="center"><sub><b>birthday</b></sub></td><td align="center"><sub><b>cut</b></sub></td></tr>
<tr><td align="center"><sub><b>bundt</b></sub></td><td align="center"><sub><b>cheesecake</b></sub></td><td align="center"><sub><b>swiss-roll</b></sub></td><td align="center"><sub><b>tiered</b></sub></td></tr>
<tr><td align="center"><sub><b>sheet</b></sub></td><td align="center"><sub><b>drip</b></sub></td></tr>
</table>

**Variants:** `layer`, `slice`, `birthday`, `cut`, `bundt`, `cheesecake`, `swiss-roll`, `tiered`, `sheet`, `drip`


### Pie <a id="pie"></a>

`createObject('pie', { variant: 'lattice' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pie-lattice.webp" width="200" alt="pie lattice"><br><sub><b>lattice</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>slice</b></sub></td><td align="center"><sub><b>tart</b></sub></td></tr>
<tr><td align="center"><sub><b>crumble</b></sub></td><td align="center"><sub><b>meringue</b></sub></td><td align="center"><sub><b>mini</b></sub></td></tr>
</table>

**Variants:** `lattice`, `double`, `slice`, `tart`, `crumble`, `meringue`, `mini`


### Cookie <a id="cookie"></a>

`createObject('cookie', { variant: 'round' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cookie-round.webp" width="200" alt="cookie round"><br><sub><b>round</b></sub></td><td align="center"><sub><b>sandwich</b></sub></td><td align="center"><sub><b>stack</b></sub></td><td align="center"><sub><b>jar</b></sub></td></tr>
<tr><td align="center"><sub><b>iced</b></sub></td><td align="center"><sub><b>gingerbread</b></sub></td><td align="center"><sub><b>biscotti</b></sub></td><td align="center"><sub><b>thumbprint</b></sub></td></tr>
</table>

**Variants:** `round`, `sandwich`, `stack`, `jar`, `iced`, `gingerbread`, `biscotti`, `thumbprint`


### Pizza <a id="pizza"></a>

`createObject('pizza', { variant: 'whole' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pizza-whole.webp" width="200" alt="pizza whole"><br><sub><b>whole</b></sub></td><td align="center"><sub><b>slice</b></sub></td><td align="center"><sub><b>box</b></sub></td><td align="center"><sub><b>personal</b></sub></td></tr>
<tr><td align="center"><sub><b>square</b></sub></td></tr>
</table>

**Variants:** `whole`, `slice`, `box`, `personal`, `square`

**Animations:** `steam`


### Burger <a id="burger"></a>

`createObject('burger', { variant: 'classic' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/burger-classic.webp" width="200" alt="burger classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>slider</b></sub></td><td align="center"><sub><b>chicken</b></sub></td></tr>
<tr><td align="center"><sub><b>veggie</b></sub></td><td align="center"><sub><b>tower</b></sub></td></tr>
</table>

**Variants:** `classic`, `double`, `slider`, `chicken`, `veggie`, `tower`


### Hot dog <a id="hotdog"></a>

`createObject('hotdog', { variant: 'classic' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hotdog-classic.webp" width="200" alt="hotdog classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>bratwurst</b></sub></td><td align="center"><sub><b>corn-dog</b></sub></td></tr>
</table>

**Variants:** `classic`, `bratwurst`, `corn-dog`


### Sandwich <a id="sandwich"></a>

`createObject('sandwich', { variant: 'club' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sandwich-club.webp" width="200" alt="sandwich club"><br><sub><b>club</b></sub></td><td align="center"><sub><b>half</b></sub></td><td align="center"><sub><b>sub</b></sub></td><td align="center"><sub><b>grilled</b></sub></td></tr>
</table>

**Variants:** `club`, `half`, `sub`, `grilled`


### Taco <a id="taco"></a>

`createObject('taco', { variant: 'hard-shell' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/taco-hard-shell.webp" width="200" alt="taco hard-shell"><br><sub><b>hard-shell</b></sub></td><td align="center"><sub><b>soft</b></sub></td><td align="center"><sub><b>trio</b></sub></td></tr>
</table>

**Variants:** `hard-shell`, `soft`, `trio`


### Burrito <a id="burrito"></a>

`createObject('burrito', { variant: 'wrapped' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/burrito-wrapped.webp" width="200" alt="burrito wrapped"><br><sub><b>wrapped</b></sub></td><td align="center"><sub><b>cut</b></sub></td><td align="center"><sub><b>bowl</b></sub></td></tr>
</table>

**Variants:** `wrapped`, `cut`, `bowl`


### Sushi <a id="sushi"></a>

`createObject('sushi', { variant: 'nigiri' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sushi-nigiri.webp" width="200" alt="sushi nigiri"><br><sub><b>nigiri</b></sub></td><td align="center"><sub><b>maki</b></sub></td><td align="center"><sub><b>set</b></sub></td><td align="center"><sub><b>platter</b></sub></td></tr>
<tr><td align="center"><sub><b>bento</b></sub></td></tr>
</table>

**Variants:** `nigiri`, `maki`, `set`, `platter`, `bento`


### Ramen <a id="ramen"></a>

`createObject('ramen', { variant: 'bowl' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ramen-bowl.webp" width="200" alt="ramen bowl"><br><sub><b>bowl</b></sub></td><td align="center"><sub><b>udon</b></sub></td><td align="center"><sub><b>cup</b></sub></td></tr>
</table>

**Variants:** `bowl`, `udon`, `cup`

**Animations:** `steam`


### Pasta <a id="pasta"></a>

`createObject('pasta', { variant: 'spaghetti' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pasta-spaghetti.webp" width="200" alt="pasta spaghetti"><br><sub><b>spaghetti</b></sub></td><td align="center"><sub><b>penne</b></sub></td><td align="center"><sub><b>farfalle</b></sub></td><td align="center"><sub><b>ravioli</b></sub></td></tr>
<tr><td align="center"><sub><b>lasagna</b></sub></td><td align="center"><sub><b>mac-cheese</b></sub></td></tr>
</table>

**Variants:** `spaghetti`, `penne`, `farfalle`, `ravioli`, `lasagna`, `mac-cheese`

**Animations:** `steam`


### Salad <a id="salad"></a>

`createObject('salad', { variant: 'bowl' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/salad-bowl.webp" width="200" alt="salad bowl"><br><sub><b>bowl</b></sub></td><td align="center"><sub><b>plate</b></sub></td><td align="center"><sub><b>jar</b></sub></td></tr>
</table>

**Variants:** `bowl`, `plate`, `jar`


### Steak <a id="steak"></a>

`createObject('steak', { variant: 'plate' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/steak-plate.webp" width="200" alt="steak plate"><br><sub><b>plate</b></sub></td><td align="center"><sub><b>board</b></sub></td><td align="center"><sub><b>skewer</b></sub></td></tr>
</table>

**Variants:** `plate`, `board`, `skewer`

**Animations:** `steam`


### Fried chicken <a id="chicken"></a>

`createObject('chicken', { variant: 'bucket' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/chicken-bucket.webp" width="200" alt="chicken bucket"><br><sub><b>bucket</b></sub></td><td align="center"><sub><b>drumstick</b></sub></td><td align="center"><sub><b>wings</b></sub></td><td align="center"><sub><b>nuggets</b></sub></td></tr>
<tr><td align="center"><sub><b>roast</b></sub></td></tr>
</table>

**Variants:** `bucket`, `drumstick`, `wings`, `nuggets`, `roast`


### Fries <a id="fries"></a>

`createObject('fries', { variant: 'carton' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fries-carton.webp" width="200" alt="fries carton"><br><sub><b>carton</b></sub></td><td align="center"><sub><b>cone</b></sub></td><td align="center"><sub><b>basket</b></sub></td></tr>
</table>

**Variants:** `carton`, `cone`, `basket`


### Breakfast <a id="breakfast"></a>

`createObject('breakfast', { variant: 'full' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/breakfast-full.webp" width="200" alt="breakfast full"><br><sub><b>full</b></sub></td><td align="center"><sub><b>eggs-bacon</b></sub></td><td align="center"><sub><b>benedict</b></sub></td><td align="center"><sub><b>avocado-toast</b></sub></td></tr>
<tr><td align="center"><sub><b>omelette</b></sub></td></tr>
</table>

**Variants:** `full`, `eggs-bacon`, `benedict`, `avocado-toast`, `omelette`

**Animations:** `steam`


### Pancakes <a id="pancakes"></a>

`createObject('pancakes', { variant: 'stack' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pancakes-stack.webp" width="200" alt="pancakes stack"><br><sub><b>stack</b></sub></td><td align="center"><sub><b>short-stack</b></sub></td><td align="center"><sub><b>crepes</b></sub></td></tr>
</table>

**Variants:** `stack`, `short-stack`, `crepes`

**Animations:** `steam`


### Soup <a id="soup"></a>

`createObject('soup', { variant: 'bowl' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/soup-bowl.webp" width="200" alt="soup bowl"><br><sub><b>bowl</b></sub></td><td align="center"><sub><b>bread-bowl</b></sub></td><td align="center"><sub><b>mug</b></sub></td><td align="center"><sub><b>pot</b></sub></td></tr>
</table>

**Variants:** `bowl`, `bread-bowl`, `mug`, `pot`

**Animations:** `steam`


### Coffee <a id="coffee"></a>

`createObject('coffee', { variant: 'espresso' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/coffee-espresso.webp" width="200" alt="coffee espresso"><br><sub><b>espresso</b></sub></td><td align="center"><sub><b>cappuccino</b></sub></td><td align="center"><sub><b>latte</b></sub></td><td align="center"><sub><b>mug</b></sub></td></tr>
<tr><td align="center"><sub><b>takeaway</b></sub></td><td align="center"><sub><b>iced</b></sub></td></tr>
</table>

**Variants:** `espresso`, `cappuccino`, `latte`, `mug`, `takeaway`, `iced`

**Animations:** `steam`


### Tea <a id="tea"></a>

`createObject('tea', { variant: 'cup' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tea-cup.webp" width="200" alt="tea cup"><br><sub><b>cup</b></sub></td><td align="center"><sub><b>teapot</b></sub></td><td align="center"><sub><b>mug-bag</b></sub></td><td align="center"><sub><b>glass</b></sub></td></tr>
<tr><td align="center"><sub><b>matcha</b></sub></td><td align="center"><sub><b>iced</b></sub></td></tr>
</table>

**Variants:** `cup`, `teapot`, `mug-bag`, `glass`, `matcha`, `iced`

**Animations:** `steam`


### Soda can <a id="can"></a>

`createObject('can', { variant: 'standard' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/can-standard.webp" width="200" alt="can standard"><br><sub><b>standard</b></sub></td><td align="center"><sub><b>tall</b></sub></td><td align="center"><sub><b>slim</b></sub></td><td align="center"><sub><b>mini</b></sub></td></tr>
<tr><td align="center"><sub><b>six-pack</b></sub></td></tr>
</table>

**Variants:** `standard`, `tall`, `slim`, `mini`, `six-pack`

**Animations:** `open`


### Bottle <a id="bottle"></a>

`createObject('bottle', { variant: 'water' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bottle-water.webp" width="200" alt="bottle water"><br><sub><b>water</b></sub></td><td align="center"><sub><b>juice</b></sub></td><td align="center"><sub><b>soda</b></sub></td><td align="center"><sub><b>wine</b></sub></td></tr>
<tr><td align="center"><sub><b>beer</b></sub></td><td align="center"><sub><b>milk</b></sub></td><td align="center"><sub><b>sports</b></sub></td><td align="center"><sub><b>sparkling</b></sub></td></tr>
<tr><td align="center"><sub><b>syrup</b></sub></td></tr>
</table>

**Variants:** `water`, `juice`, `soda`, `wine`, `beer`, `milk`, `sports`, `sparkling`, `syrup`

**Animations:** `open`


### Glass <a id="glass"></a>

`createObject('glass', { variant: 'juice' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/glass-juice.webp" width="200" alt="glass juice"><br><sub><b>juice</b></sub></td><td align="center"><sub><b>smoothie</b></sub></td><td align="center"><sub><b>cocktail</b></sub></td><td align="center"><sub><b>wine</b></sub></td></tr>
<tr><td align="center"><sub><b>beer</b></sub></td><td align="center"><sub><b>milkshake</b></sub></td><td align="center"><sub><b>water</b></sub></td><td align="center"><sub><b>shot</b></sub></td></tr>
</table>

**Variants:** `juice`, `smoothie`, `cocktail`, `wine`, `beer`, `milkshake`, `water`, `shot`


### Jug <a id="jug"></a>

`createObject('jug', { variant: 'pitcher' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/jug-pitcher.webp" width="200" alt="jug pitcher"><br><sub><b>pitcher</b></sub></td><td align="center"><sub><b>milk-jug</b></sub></td><td align="center"><sub><b>carafe</b></sub></td></tr>
</table>

**Variants:** `pitcher`, `milk-jug`, `carafe`

**Animations:** `pour`


### Carton <a id="carton"></a>

`createObject('carton', { variant: 'gable' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/carton-gable.webp" width="200" alt="carton gable"><br><sub><b>gable</b></sub></td><td align="center"><sub><b>school</b></sub></td><td align="center"><sub><b>juice-box</b></sub></td></tr>
</table>

**Variants:** `gable`, `school`, `juice-box`


### Cereal <a id="cereal"></a>

`createObject('cereal', { variant: 'box' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cereal-box.webp" width="200" alt="cereal box"><br><sub><b>box</b></sub></td><td align="center"><sub><b>open</b></sub></td><td align="center"><sub><b>bowl</b></sub></td></tr>
</table>

**Variants:** `box`, `open`, `bowl`

**Animations:** `lidOpen`


### Jar <a id="jar"></a>

`createObject('jar', { variant: 'jam' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/jar-jam.webp" width="200" alt="jar jam"><br><sub><b>jam</b></sub></td><td align="center"><sub><b>honey</b></sub></td><td align="center"><sub><b>pickles</b></sub></td><td align="center"><sub><b>peanut-butter</b></sub></td></tr>
<tr><td align="center"><sub><b>choc-spread</b></sub></td><td align="center"><sub><b>olives</b></sub></td><td align="center"><sub><b>sauce</b></sub></td></tr>
</table>

**Variants:** `jam`, `honey`, `pickles`, `peanut-butter`, `choc-spread`, `olives`, `sauce`

**Animations:** `lidOpen`


### Tin <a id="tin"></a>

`createObject('tin', { variant: 'soup' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tin-soup.webp" width="200" alt="tin soup"><br><sub><b>soup</b></sub></td><td align="center"><sub><b>beans</b></sub></td><td align="center"><sub><b>tomatoes</b></sub></td><td align="center"><sub><b>corn</b></sub></td></tr>
<tr><td align="center"><sub><b>tuna</b></sub></td><td align="center"><sub><b>coffee</b></sub></td><td align="center"><sub><b>cookies</b></sub></td></tr>
</table>

**Variants:** `soup`, `beans`, `tomatoes`, `corn`, `tuna`, `coffee`, `cookies`

**Animations:** `lidOpen`


### Eggs <a id="eggs"></a>

`createObject('eggs', { variant: 'carton-6' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/eggs-carton-6.webp" width="200" alt="eggs carton-6"><br><sub><b>carton-6</b></sub></td><td align="center"><sub><b>carton-12</b></sub></td><td align="center"><sub><b>bowl</b></sub></td><td align="center"><sub><b>egg-cup</b></sub></td></tr>
<tr><td align="center"><sub><b>cracked</b></sub></td></tr>
</table>

**Variants:** `carton-6`, `carton-12`, `bowl`, `egg-cup`, `cracked`

**Animations:** `lidClose`


### Cheese <a id="cheese"></a>

`createObject('cheese', { variant: 'wheel' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cheese-wheel.webp" width="200" alt="cheese wheel"><br><sub><b>wheel</b></sub></td><td align="center"><sub><b>wedge</b></sub></td><td align="center"><sub><b>block</b></sub></td><td align="center"><sub><b>slices</b></sub></td></tr>
<tr><td align="center"><sub><b>board</b></sub></td></tr>
</table>

**Variants:** `wheel`, `wedge`, `block`, `slices`, `board`


### Butter <a id="butter"></a>

`createObject('butter', { variant: 'stick' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/butter-stick.webp" width="200" alt="butter stick"><br><sub><b>stick</b></sub></td><td align="center"><sub><b>dish</b></sub></td><td align="center"><sub><b>block</b></sub></td></tr>
</table>

**Variants:** `stick`, `dish`, `block`


### Chocolate <a id="chocolate"></a>

`createObject('chocolate', { variant: 'bar' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/chocolate-bar.webp" width="200" alt="chocolate bar"><br><sub><b>bar</b></sub></td><td align="center"><sub><b>broken</b></sub></td><td align="center"><sub><b>box</b></sub></td><td align="center"><sub><b>wrapped</b></sub></td></tr>
</table>

**Variants:** `bar`, `broken`, `box`, `wrapped`


### Candy <a id="candy"></a>

`createObject('candy', { variant: 'jar' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/candy-jar.webp" width="200" alt="candy jar"><br><sub><b>jar</b></sub></td><td align="center"><sub><b>lollipop</b></sub></td><td align="center"><sub><b>swirl-pop</b></sub></td><td align="center"><sub><b>gummies</b></sub></td></tr>
<tr><td align="center"><sub><b>wrapped</b></sub></td><td align="center"><sub><b>candy-cane</b></sub></td><td align="center"><sub><b>cotton-candy</b></sub></td></tr>
</table>

**Variants:** `jar`, `lollipop`, `swirl-pop`, `gummies`, `wrapped`, `candy-cane`, `cotton-candy`

**Animations:** `lidOpen`


### Ice cream <a id="ice-cream"></a>

`createObject('ice-cream', { variant: 'cone' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ice-cream-cone.webp" width="200" alt="ice-cream cone"><br><sub><b>cone</b></sub></td><td align="center"><sub><b>double-cone</b></sub></td><td align="center"><sub><b>cup</b></sub></td><td align="center"><sub><b>tub</b></sub></td></tr>
<tr><td align="center"><sub><b>sundae</b></sub></td><td align="center"><sub><b>sandwich</b></sub></td><td align="center"><sub><b>soft-serve</b></sub></td></tr>
</table>

**Variants:** `cone`, `double-cone`, `cup`, `tub`, `sundae`, `sandwich`, `soft-serve`


### Popsicle <a id="popsicle"></a>

`createObject('popsicle', { variant: 'classic' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/popsicle-classic.webp" width="200" alt="popsicle classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>rocket</b></sub></td><td align="center"><sub><b>fudge</b></sub></td><td align="center"><sub><b>fruit-bar</b></sub></td></tr>
<tr><td align="center"><sub><b>bitten</b></sub></td></tr>
</table>

**Variants:** `classic`, `rocket`, `fudge`, `fruit-bar`, `bitten`


### Fruit <a id="fruit"></a>

`createObject('fruit', { variant: 'apple' })` · 23 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fruit-apple.webp" width="200" alt="fruit apple"><br><sub><b>apple</b></sub></td><td align="center"><sub><b>pear</b></sub></td><td align="center"><sub><b>banana</b></sub></td><td align="center"><sub><b>orange</b></sub></td></tr>
<tr><td align="center"><sub><b>lemon</b></sub></td><td align="center"><sub><b>lime</b></sub></td><td align="center"><sub><b>grapefruit</b></sub></td><td align="center"><sub><b>grapes</b></sub></td></tr>
<tr><td align="center"><sub><b>strawberry</b></sub></td><td align="center"><sub><b>cherry</b></sub></td><td align="center"><sub><b>watermelon</b></sub></td><td align="center"><sub><b>watermelon-slice</b></sub></td></tr>
<tr><td align="center"><sub><b>pineapple</b></sub></td><td align="center"><sub><b>mango</b></sub></td><td align="center"><sub><b>peach</b></sub></td><td align="center"><sub><b>plum</b></sub></td></tr>
<tr><td align="center"><sub><b>apricot</b></sub></td><td align="center"><sub><b>kiwi</b></sub></td><td align="center"><sub><b>coconut</b></sub></td><td align="center"><sub><b>avocado</b></sub></td></tr>
<tr><td align="center"><sub><b>pomegranate</b></sub></td><td align="center"><sub><b>melon</b></sub></td><td align="center"><sub><b>berries</b></sub></td></tr>
</table>

**Variants:** `apple`, `pear`, `banana`, `orange`, `lemon`, `lime`, `grapefruit`, `grapes`, `strawberry`, `cherry`, `watermelon`, `watermelon-slice`, `pineapple`, `mango`, `peach`, `plum`, `apricot`, `kiwi`, `coconut`, `avocado`, `pomegranate`, `melon`, `berries`


### Bread (HD) <a id="hd-bread"></a>

`createObject('hd-bread', { variant: 'sourdough-boule' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>sourdough-boule</b></sub></td><td align="center"><sub><b>baguettes</b></sub></td><td align="center"><sub><b>sliced-loaf</b></sub></td></tr>
</table>

**Variants:** `sourdough-boule`, `baguettes`, `sliced-loaf`


### Cake (HD) <a id="hd-cake"></a>

`createObject('hd-cake', { variant: 'berry-layer-cake' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>berry-layer-cake</b></sub></td><td align="center"><sub><b>chocolate-drip</b></sub></td><td align="center"><sub><b>cupcakes-pink</b></sub></td><td align="center"><sub><b>cupcakes-vanilla</b></sub></td></tr>
</table>

**Variants:** `berry-layer-cake`, `chocolate-drip`, `cupcakes-pink`, `cupcakes-vanilla`

| Option | Description |
|---|---|
| `color` | icing color |


### Coffee cup (HD) <a id="hd-coffee-cup"></a>

`createObject('hd-coffee-cup', { variant: 'cappuccino' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>cappuccino</b></sub></td><td align="center"><sub><b>espresso</b></sub></td><td align="center"><sub><b>latte-glass</b></sub></td></tr>
</table>

**Variants:** `cappuccino`, `espresso`, `latte-glass`

| Option | Description |
|---|---|
| `color` | cup glaze |


### Croissants (HD) <a id="hd-croissants"></a>

`createObject('hd-croissants', { variant: 'two-on-plate' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>two-on-plate</b></sub></td><td align="center"><sub><b>three-on-plate</b></sub></td></tr>
</table>

**Variants:** `two-on-plate`, `three-on-plate`


### Fruit bowl (HD) <a id="hd-fruit-bowl"></a>

`createObject('hd-fruit-bowl', { variant: 'mixed-white-bowl' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>mixed-white-bowl</b></sub></td><td align="center"><sub><b>citrus-wood-bowl</b></sub></td><td align="center"><sub><b>apples-bananas</b></sub></td></tr>
</table>

**Variants:** `mixed-white-bowl`, `citrus-wood-bowl`, `apples-bananas`

| Option | Description |
|---|---|
| `color` | bowl glaze |


## Fashion

### Garment <a id="hanging-garment"></a>

`createObject('hanging-garment', { variant: 't-shirt' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hanging-garment-t-shirt.webp" width="200" alt="hanging-garment t-shirt"><br><sub><b>t-shirt</b></sub></td><td align="center"><img src="images/hanging-garment-shirt.webp" width="200" alt="hanging-garment shirt"><br><sub><b>shirt</b></sub></td><td align="center"><img src="images/hanging-garment-jeans.webp" width="200" alt="hanging-garment jeans"><br><sub><b>jeans</b></sub></td><td align="center"><img src="images/hanging-garment-dress.webp" width="200" alt="hanging-garment dress"><br><sub><b>dress</b></sub></td></tr>
<tr><td align="center"><sub><b>jacket</b></sub></td><td align="center"><sub><b>coat</b></sub></td><td align="center"><sub><b>hoodie</b></sub></td><td align="center"><sub><b>suit</b></sub></td></tr>
<tr><td align="center"><sub><b>skirt</b></sub></td><td align="center"><sub><b>sweater</b></sub></td><td align="center"><sub><b>scarf</b></sub></td></tr>
</table>

**Variants:** `t-shirt`, `shirt`, `jeans`, `dress`, `jacket`, `coat`, `hoodie`, `suit`, `skirt`, `sweater`, `scarf`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Clothes Rail <a id="clothes-rail"></a>

`createObject('clothes-rail', { variant: 'tees' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/clothes-rail-tees.webp" width="200" alt="clothes-rail tees"><br><sub><b>tees</b></sub></td><td align="center"><img src="images/clothes-rail-shirts.webp" width="200" alt="clothes-rail shirts"><br><sub><b>shirts</b></sub></td><td align="center"><img src="images/clothes-rail-dresses.webp" width="200" alt="clothes-rail dresses"><br><sub><b>dresses</b></sub></td><td align="center"><img src="images/clothes-rail-coats.webp" width="200" alt="clothes-rail coats"><br><sub><b>coats</b></sub></td></tr>
<tr><td align="center"><sub><b>jeans</b></sub></td><td align="center"><sub><b>mixed</b></sub></td></tr>
</table>

**Variants:** `tees`, `shirts`, `dresses`, `coats`, `jeans`, `mixed`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `browse`


### Dress Form <a id="dress-form"></a>

`createObject('dress-form', { variant: 'dress' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dress-form-dress.webp" width="200" alt="dress-form dress"><br><sub><b>dress</b></sub></td><td align="center"><img src="images/dress-form-gown.webp" width="200" alt="dress-form gown"><br><sub><b>gown</b></sub></td><td align="center"><img src="images/dress-form-jacket.webp" width="200" alt="dress-form jacket"><br><sub><b>jacket</b></sub></td><td align="center"><img src="images/dress-form-shirt.webp" width="200" alt="dress-form shirt"><br><sub><b>shirt</b></sub></td></tr>
<tr><td align="center"><sub><b>sweater</b></sub></td><td align="center"><sub><b>suit</b></sub></td><td align="center"><sub><b>blank</b></sub></td></tr>
</table>

**Variants:** `dress`, `gown`, `jacket`, `shirt`, `sweater`, `suit`, `blank`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Mannequin <a id="mannequin"></a>

`createObject('mannequin', { variant: 'female' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mannequin-female.webp" width="200" alt="mannequin female"><br><sub><b>female</b></sub></td><td align="center"><img src="images/mannequin-male.webp" width="200" alt="mannequin male"><br><sub><b>male</b></sub></td><td align="center"><img src="images/mannequin-casual.webp" width="200" alt="mannequin casual"><br><sub><b>casual</b></sub></td><td align="center"><img src="images/mannequin-formal.webp" width="200" alt="mannequin formal"><br><sub><b>formal</b></sub></td></tr>
<tr><td align="center"><sub><b>kid</b></sub></td></tr>
</table>

**Variants:** `female`, `male`, `casual`, `formal`, `kid`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `turn`


### Folded Clothes Table <a id="folded-stack"></a>

`createObject('folded-stack', { variant: 'tees' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/folded-stack-tees.webp" width="200" alt="folded-stack tees"><br><sub><b>tees</b></sub></td><td align="center"><img src="images/folded-stack-jeans.webp" width="200" alt="folded-stack jeans"><br><sub><b>jeans</b></sub></td><td align="center"><img src="images/folded-stack-sweaters.webp" width="200" alt="folded-stack sweaters"><br><sub><b>sweaters</b></sub></td><td align="center"><img src="images/folded-stack-mixed.webp" width="200" alt="folded-stack mixed"><br><sub><b>mixed</b></sub></td></tr>
</table>

**Variants:** `tees`, `jeans`, `sweaters`, `mixed`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Shoes <a id="shoe"></a>

`createObject('shoe', { variant: 'sneakers' })` · 13 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shoe-sneakers.webp" width="200" alt="shoe sneakers"><br><sub><b>sneakers</b></sub></td><td align="center"><img src="images/shoe-high-tops.webp" width="200" alt="shoe high-tops"><br><sub><b>high-tops</b></sub></td><td align="center"><img src="images/shoe-running.webp" width="200" alt="shoe running"><br><sub><b>running</b></sub></td><td align="center"><img src="images/shoe-boots.webp" width="200" alt="shoe boots"><br><sub><b>boots</b></sub></td></tr>
<tr><td align="center"><sub><b>chelsea</b></sub></td><td align="center"><sub><b>hiking</b></sub></td><td align="center"><sub><b>heels</b></sub></td><td align="center"><sub><b>pumps</b></sub></td></tr>
<tr><td align="center"><sub><b>sandals</b></sub></td><td align="center"><sub><b>flip-flops</b></sub></td><td align="center"><sub><b>loafers</b></sub></td><td align="center"><sub><b>oxfords</b></sub></td></tr>
<tr><td align="center"><sub><b>slippers</b></sub></td></tr>
</table>

**Variants:** `sneakers`, `high-tops`, `running`, `boots`, `chelsea`, `hiking`, `heels`, `pumps`, `sandals`, `flip-flops`, `loafers`, `oxfords`, `slippers`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `tap`


### Bag <a id="bag"></a>

`createObject('bag', { variant: 'handbag' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bag-handbag.webp" width="200" alt="bag handbag"><br><sub><b>handbag</b></sub></td><td align="center"><img src="images/bag-tote.webp" width="200" alt="bag tote"><br><sub><b>tote</b></sub></td><td align="center"><img src="images/bag-backpack.webp" width="200" alt="bag backpack"><br><sub><b>backpack</b></sub></td><td align="center"><sub><b>clutch</b></sub></td></tr>
<tr><td align="center"><sub><b>duffel</b></sub></td><td align="center"><sub><b>messenger</b></sub></td><td align="center"><sub><b>crossbody</b></sub></td></tr>
</table>

**Variants:** `handbag`, `tote`, `backpack`, `clutch`, `duffel`, `messenger`, `crossbody`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Hat <a id="hat"></a>

`createObject('hat', { variant: 'cap' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hat-cap.webp" width="200" alt="hat cap"><br><sub><b>cap</b></sub></td><td align="center"><img src="images/hat-beanie.webp" width="200" alt="hat beanie"><br><sub><b>beanie</b></sub></td><td align="center"><img src="images/hat-fedora.webp" width="200" alt="hat fedora"><br><sub><b>fedora</b></sub></td><td align="center"><sub><b>sun-hat</b></sub></td></tr>
<tr><td align="center"><sub><b>beret</b></sub></td><td align="center"><sub><b>cowboy</b></sub></td><td align="center"><sub><b>bucket</b></sub></td><td align="center"><sub><b>top-hat</b></sub></td></tr>
<tr><td align="center"><sub><b>panama</b></sub></td></tr>
</table>

**Variants:** `cap`, `beanie`, `fedora`, `sun-hat`, `beret`, `cowboy`, `bucket`, `top-hat`, `panama`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `turn`


### Sunglasses <a id="sunglasses"></a>

`createObject('sunglasses', { variant: 'aviator' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sunglasses-aviator.webp" width="200" alt="sunglasses aviator"><br><sub><b>aviator</b></sub></td><td align="center"><img src="images/sunglasses-wayfarer.webp" width="200" alt="sunglasses wayfarer"><br><sub><b>wayfarer</b></sub></td><td align="center"><img src="images/sunglasses-round.webp" width="200" alt="sunglasses round"><br><sub><b>round</b></sub></td><td align="center"><sub><b>cat-eye</b></sub></td></tr>
<tr><td align="center"><sub><b>sport</b></sub></td><td align="center"><sub><b>oversized</b></sub></td></tr>
</table>

**Variants:** `aviator`, `wayfarer`, `round`, `cat-eye`, `sport`, `oversized`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `fold`


### Watch <a id="watch"></a>

`createObject('watch', { variant: 'dress' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/watch-dress.webp" width="200" alt="watch dress"><br><sub><b>dress</b></sub></td><td align="center"><img src="images/watch-diver.webp" width="200" alt="watch diver"><br><sub><b>diver</b></sub></td><td align="center"><img src="images/watch-chronograph.webp" width="200" alt="watch chronograph"><br><sub><b>chronograph</b></sub></td><td align="center"><sub><b>smart</b></sub></td></tr>
<tr><td align="center"><sub><b>pocket</b></sub></td></tr>
</table>

**Variants:** `dress`, `diver`, `chronograph`, `smart`, `pocket`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `stand` | boolean |

**Animations:** `tick`


### Jewellery <a id="jewellery"></a>

`createObject('jewellery', { variant: 'ring' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/jewellery-ring.webp" width="200" alt="jewellery ring"><br><sub><b>ring</b></sub></td><td align="center"><img src="images/jewellery-necklace.webp" width="200" alt="jewellery necklace"><br><sub><b>necklace</b></sub></td><td align="center"><img src="images/jewellery-earrings.webp" width="200" alt="jewellery earrings"><br><sub><b>earrings</b></sub></td><td align="center"><sub><b>bracelet</b></sub></td></tr>
<tr><td align="center"><sub><b>pendant</b></sub></td><td align="center"><sub><b>tiara</b></sub></td></tr>
</table>

**Variants:** `ring`, `necklace`, `earrings`, `bracelet`, `pendant`, `tiara`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `stand` | boolean |


### Belt <a id="belt"></a>

`createObject('belt', { variant: 'dress' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/belt-dress.webp" width="200" alt="belt dress"><br><sub><b>dress</b></sub></td><td align="center"><img src="images/belt-western.webp" width="200" alt="belt western"><br><sub><b>western</b></sub></td><td align="center"><img src="images/belt-braided.webp" width="200" alt="belt braided"><br><sub><b>braided</b></sub></td></tr>
</table>

**Variants:** `dress`, `western`, `braided`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Tie & Bow Tie <a id="necktie"></a>

`createObject('necktie', { variant: 'tie' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/necktie-tie.webp" width="200" alt="necktie tie"><br><sub><b>tie</b></sub></td><td align="center"><img src="images/necktie-skinny.webp" width="200" alt="necktie skinny"><br><sub><b>skinny</b></sub></td><td align="center"><img src="images/necktie-bow-tie.webp" width="200" alt="necktie bow-tie"><br><sub><b>bow-tie</b></sub></td><td align="center"><sub><b>knit-tie</b></sub></td></tr>
</table>

**Variants:** `tie`, `skinny`, `bow-tie`, `knit-tie`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `stand` | boolean |


### Store Fixture <a id="store-fixture"></a>

`createObject('store-fixture', { variant: 'shoe-display' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/store-fixture-shoe-display.webp" width="200" alt="store-fixture shoe-display"><br><sub><b>shoe-display</b></sub></td><td align="center"><img src="images/store-fixture-fitting-mirror.webp" width="200" alt="store-fixture fitting-mirror"><br><sub><b>fitting-mirror</b></sub></td><td align="center"><img src="images/store-fixture-jewellery-case.webp" width="200" alt="store-fixture jewellery-case"><br><sub><b>jewellery-case</b></sub></td><td align="center"><sub><b>fitting-room</b></sub></td></tr>
<tr><td align="center"><sub><b>hat-stand</b></sub></td><td align="center"><sub><b>checkout-counter</b></sub></td></tr>
</table>

**Variants:** `shoe-display`, `fitting-mirror`, `jewellery-case`, `fitting-room`, `hat-stand`, `checkout-counter`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Handbag (HD) <a id="hd-handbag"></a>

`createObject('hd-handbag', { variant: 'tote-cognac' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>tote-cognac</b></sub></td><td align="center"><sub><b>flap-black</b></sub></td><td align="center"><sub><b>tote-cream</b></sub></td><td align="center"><sub><b>flap-burgundy</b></sub></td></tr>
</table>

**Variants:** `tote-cognac`, `flap-black`, `tote-cream`, `flap-burgundy`

| Option | Description |
|---|---|
| `color` | leather color |


### Hat (HD) <a id="hd-hat"></a>

`createObject('hd-hat', { variant: 'fedora-brown' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>fedora-brown</b></sub></td><td align="center"><sub><b>fedora-grey</b></sub></td><td align="center"><sub><b>beanie-red</b></sub></td><td align="center"><sub><b>beanie-navy</b></sub></td></tr>
</table>

**Variants:** `fedora-brown`, `fedora-grey`, `beanie-red`, `beanie-navy`

| Option | Description |
|---|---|
| `color` | hat color |


### Sneakers (HD) <a id="hd-sneakers"></a>

`createObject('hd-sneakers', { variant: 'white-navy' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>white-navy</b></sub></td><td align="center"><sub><b>black-red</b></sub></td><td align="center"><sub><b>canvas-green</b></sub></td><td align="center"><sub><b>grey-orange</b></sub></td></tr>
</table>

**Variants:** `white-navy`, `black-red`, `canvas-green`, `grey-orange`

| Option | Description |
|---|---|
| `color` | upper color |


### Sunglasses (HD) <a id="hd-sunglasses"></a>

`createObject('hd-sunglasses', { variant: 'wayfarer-black' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>wayfarer-black</b></sub></td><td align="center"><sub><b>round-gold</b></sub></td><td align="center"><sub><b>wayfarer-tortoise</b></sub></td></tr>
</table>

**Variants:** `wayfarer-black`, `round-gold`, `wayfarer-tortoise`


## Music

### Guitar & Fretted <a id="guitar"></a>

`createObject('guitar', { variant: 'acoustic' })` · 21 versions · procedural JS

<table>
<tr><td align="center"><img src="images/guitar-acoustic.webp" width="200" alt="guitar acoustic"><br><sub><b>acoustic</b></sub></td><td align="center"><img src="images/guitar-jumbo.webp" width="200" alt="guitar jumbo"><br><sub><b>jumbo</b></sub></td><td align="center"><img src="images/guitar-parlor.webp" width="200" alt="guitar parlor"><br><sub><b>parlor</b></sub></td><td align="center"><img src="images/guitar-twelve-string.webp" width="200" alt="guitar twelve-string"><br><sub><b>twelve-string</b></sub></td></tr>
<tr><td align="center"><sub><b>classical</b></sub></td><td align="center"><sub><b>flamenco</b></sub></td><td align="center"><sub><b>resonator</b></sub></td><td align="center"><sub><b>archtop</b></sub></td></tr>
<tr><td align="center"><sub><b>electric-dc</b></sub></td><td align="center"><sub><b>electric-sc</b></sub></td><td align="center"><sub><b>electric-offset</b></sub></td><td align="center"><sub><b>electric-superstrat</b></sub></td></tr>
<tr><td align="center"><sub><b>semi-hollow</b></sub></td><td align="center"><sub><b>bass</b></sub></td><td align="center"><sub><b>bass-5</b></sub></td><td align="center"><sub><b>fretless-bass</b></sub></td></tr>
<tr><td align="center"><sub><b>ukulele</b></sub></td><td align="center"><sub><b>tenor-ukulele</b></sub></td><td align="center"><sub><b>banjo</b></sub></td><td align="center"><sub><b>mandolin</b></sub></td></tr>
<tr><td align="center"><sub><b>mandolin-f</b></sub></td></tr>
</table>

**Variants:** `acoustic`, `jumbo`, `parlor`, `twelve-string`, `classical`, `flamenco`, `resonator`, `archtop`, `electric-dc`, `electric-sc`, `electric-offset`, `electric-superstrat`, `semi-hollow`, `bass`, `bass-5`, `fretless-bass`, `ukulele`, `tenor-ukulele`, `banjo`, `mandolin`, `mandolin-f`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `strum`


### Violin Family <a id="bowed"></a>

`createObject('bowed', { variant: 'violin' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bowed-violin.webp" width="200" alt="bowed violin"><br><sub><b>violin</b></sub></td><td align="center"><img src="images/bowed-viola.webp" width="200" alt="bowed viola"><br><sub><b>viola</b></sub></td><td align="center"><img src="images/bowed-cello.webp" width="200" alt="bowed cello"><br><sub><b>cello</b></sub></td><td align="center"><img src="images/bowed-double-bass.webp" width="200" alt="bowed double-bass"><br><sub><b>double-bass</b></sub></td></tr>
<tr><td align="center"><sub><b>electric-violin</b></sub></td><td align="center"><sub><b>baroque-violin</b></sub></td></tr>
</table>

**Variants:** `violin`, `viola`, `cello`, `double-bass`, `electric-violin`, `baroque-violin`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `strum`


### Piano <a id="concert-piano"></a>

`createObject('concert-piano', { variant: 'grand' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/concert-piano-grand.webp" width="200" alt="concert-piano grand"><br><sub><b>grand</b></sub></td><td align="center"><img src="images/concert-piano-baby-grand.webp" width="200" alt="concert-piano baby-grand"><br><sub><b>baby-grand</b></sub></td><td align="center"><img src="images/concert-piano-upright.webp" width="200" alt="concert-piano upright"><br><sub><b>upright</b></sub></td><td align="center"><img src="images/concert-piano-digital.webp" width="200" alt="concert-piano digital"><br><sub><b>digital</b></sub></td></tr>
<tr><td align="center"><sub><b>harpsichord</b></sub></td><td align="center"><sub><b>spinet</b></sub></td></tr>
</table>

**Variants:** `grand`, `baby-grand`, `upright`, `digital`, `harpsichord`, `spinet`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `play`


### Keyboard & Organ <a id="keyboard"></a>

`createObject('keyboard', { variant: 'stage-piano' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/keyboard-stage-piano.webp" width="200" alt="keyboard stage-piano"><br><sub><b>stage-piano</b></sub></td><td align="center"><img src="images/keyboard-synth.webp" width="200" alt="keyboard synth"><br><sub><b>synth</b></sub></td><td align="center"><img src="images/keyboard-analog-synth.webp" width="200" alt="keyboard analog-synth"><br><sub><b>analog-synth</b></sub></td><td align="center"><sub><b>workstation</b></sub></td></tr>
<tr><td align="center"><sub><b>keytar</b></sub></td><td align="center"><sub><b>organ</b></sub></td><td align="center"><sub><b>pipe-organ</b></sub></td><td align="center"><sub><b>accordion</b></sub></td></tr>
<tr><td align="center"><sub><b>melodica</b></sub></td></tr>
</table>

**Variants:** `stage-piano`, `synth`, `analog-synth`, `workstation`, `keytar`, `organ`, `pipe-organ`, `accordion`, `melodica`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `play`, `on`


### Drums <a id="drum-set"></a>

`createObject('drum-set', { variant: 'rock-kit' })` · 15 versions · procedural JS

<table>
<tr><td align="center"><img src="images/drum-set-rock-kit.webp" width="200" alt="drum-set rock-kit"><br><sub><b>rock-kit</b></sub></td><td align="center"><img src="images/drum-set-jazz-kit.webp" width="200" alt="drum-set jazz-kit"><br><sub><b>jazz-kit</b></sub></td><td align="center"><img src="images/drum-set-electronic-kit.webp" width="200" alt="drum-set electronic-kit"><br><sub><b>electronic-kit</b></sub></td><td align="center"><sub><b>snare</b></sub></td></tr>
<tr><td align="center"><sub><b>bass-drum</b></sub></td><td align="center"><sub><b>floor-tom</b></sub></td><td align="center"><sub><b>ride-cymbal</b></sub></td><td align="center"><sub><b>hi-hat</b></sub></td></tr>
<tr><td align="center"><sub><b>bongos</b></sub></td><td align="center"><sub><b>congas</b></sub></td><td align="center"><sub><b>djembe</b></sub></td><td align="center"><sub><b>timpani</b></sub></td></tr>
<tr><td align="center"><sub><b>cajon</b></sub></td><td align="center"><sub><b>gong</b></sub></td><td align="center"><sub><b>steelpan</b></sub></td></tr>
</table>

**Variants:** `rock-kit`, `jazz-kit`, `electronic-kit`, `snare`, `bass-drum`, `floor-tom`, `ride-cymbal`, `hi-hat`, `bongos`, `congas`, `djembe`, `timpani`, `cajon`, `gong`, `steelpan`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `play`


### Percussion & Harp <a id="percussion"></a>

`createObject('percussion', { variant: 'xylophone' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/percussion-xylophone.webp" width="200" alt="percussion xylophone"><br><sub><b>xylophone</b></sub></td><td align="center"><img src="images/percussion-marimba.webp" width="200" alt="percussion marimba"><br><sub><b>marimba</b></sub></td><td align="center"><img src="images/percussion-glockenspiel.webp" width="200" alt="percussion glockenspiel"><br><sub><b>glockenspiel</b></sub></td><td align="center"><sub><b>vibraphone</b></sub></td></tr>
<tr><td align="center"><sub><b>triangle</b></sub></td><td align="center"><sub><b>tambourine</b></sub></td><td align="center"><sub><b>harp</b></sub></td><td align="center"><sub><b>lever-harp</b></sub></td></tr>
<tr><td align="center"><sub><b>metronome</b></sub></td><td align="center"><sub><b>tubular-bells</b></sub></td><td align="center"><sub><b>maracas</b></sub></td></tr>
</table>

**Variants:** `xylophone`, `marimba`, `glockenspiel`, `vibraphone`, `triangle`, `tambourine`, `harp`, `lever-harp`, `metronome`, `tubular-bells`, `maracas`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `play`


### Brass <a id="brass"></a>

`createObject('brass', { variant: 'trumpet' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/brass-trumpet.webp" width="200" alt="brass trumpet"><br><sub><b>trumpet</b></sub></td><td align="center"><img src="images/brass-cornet.webp" width="200" alt="brass cornet"><br><sub><b>cornet</b></sub></td><td align="center"><img src="images/brass-flugelhorn.webp" width="200" alt="brass flugelhorn"><br><sub><b>flugelhorn</b></sub></td><td align="center"><sub><b>trombone</b></sub></td></tr>
<tr><td align="center"><sub><b>tuba</b></sub></td><td align="center"><sub><b>euphonium</b></sub></td><td align="center"><sub><b>french-horn</b></sub></td><td align="center"><sub><b>sousaphone</b></sub></td></tr>
</table>

**Variants:** `trumpet`, `cornet`, `flugelhorn`, `trombone`, `tuba`, `euphonium`, `french-horn`, `sousaphone`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `play`


### Woodwind <a id="woodwind"></a>

`createObject('woodwind', { variant: 'alto-sax' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/woodwind-alto-sax.webp" width="200" alt="woodwind alto-sax"><br><sub><b>alto-sax</b></sub></td><td align="center"><img src="images/woodwind-tenor-sax.webp" width="200" alt="woodwind tenor-sax"><br><sub><b>tenor-sax</b></sub></td><td align="center"><img src="images/woodwind-soprano-sax.webp" width="200" alt="woodwind soprano-sax"><br><sub><b>soprano-sax</b></sub></td><td align="center"><sub><b>clarinet</b></sub></td></tr>
<tr><td align="center"><sub><b>oboe</b></sub></td><td align="center"><sub><b>flute</b></sub></td><td align="center"><sub><b>piccolo</b></sub></td><td align="center"><sub><b>bassoon</b></sub></td></tr>
<tr><td align="center"><sub><b>recorder</b></sub></td><td align="center"><sub><b>harmonica</b></sub></td><td align="center"><sub><b>pan-flute</b></sub></td></tr>
</table>

**Variants:** `alto-sax`, `tenor-sax`, `soprano-sax`, `clarinet`, `oboe`, `flute`, `piccolo`, `bassoon`, `recorder`, `harmonica`, `pan-flute`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `play`


### Microphone <a id="microphone"></a>

`createObject('microphone', { variant: 'vocal-stand' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/microphone-vocal-stand.webp" width="200" alt="microphone vocal-stand"><br><sub><b>vocal-stand</b></sub></td><td align="center"><img src="images/microphone-boom-stand.webp" width="200" alt="microphone boom-stand"><br><sub><b>boom-stand</b></sub></td><td align="center"><img src="images/microphone-condenser.webp" width="200" alt="microphone condenser"><br><sub><b>condenser</b></sub></td><td align="center"><sub><b>ribbon</b></sub></td></tr>
<tr><td align="center"><sub><b>podcast</b></sub></td></tr>
</table>

**Variants:** `vocal-stand`, `boom-stand`, `condenser`, `ribbon`, `podcast`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Amplifier <a id="guitar-amp"></a>

`createObject('guitar-amp', { variant: 'combo' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/guitar-amp-combo.webp" width="200" alt="guitar-amp combo"><br><sub><b>combo</b></sub></td><td align="center"><img src="images/guitar-amp-half-stack.webp" width="200" alt="guitar-amp half-stack"><br><sub><b>half-stack</b></sub></td><td align="center"><img src="images/guitar-amp-full-stack.webp" width="200" alt="guitar-amp full-stack"><br><sub><b>full-stack</b></sub></td><td align="center"><sub><b>bass-combo</b></sub></td></tr>
<tr><td align="center"><sub><b>practice-amp</b></sub></td></tr>
</table>

**Variants:** `combo`, `half-stack`, `full-stack`, `bass-combo`, `practice-amp`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Mixing Desk <a id="mixing-desk"></a>

`createObject('mixing-desk', { variant: 'compact-mixer' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mixing-desk-compact-mixer.webp" width="200" alt="mixing-desk compact-mixer"><br><sub><b>compact-mixer</b></sub></td><td align="center"><img src="images/mixing-desk-studio-console.webp" width="200" alt="mixing-desk studio-console"><br><sub><b>studio-console</b></sub></td><td align="center"><img src="images/mixing-desk-live-desk.webp" width="200" alt="mixing-desk live-desk"><br><sub><b>live-desk</b></sub></td></tr>
</table>

**Variants:** `compact-mixer`, `studio-console`, `live-desk`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`, `mix`


### DJ Gear <a id="dj-gear"></a>

`createObject('dj-gear', { variant: 'dj-booth' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dj-gear-dj-booth.webp" width="200" alt="dj-gear dj-booth"><br><sub><b>dj-booth</b></sub></td><td align="center"><img src="images/dj-gear-turntable.webp" width="200" alt="dj-gear turntable"><br><sub><b>turntable</b></sub></td><td align="center"><img src="images/dj-gear-dj-controller.webp" width="200" alt="dj-gear dj-controller"><br><sub><b>dj-controller</b></sub></td><td align="center"><sub><b>cd-deck</b></sub></td></tr>
</table>

**Variants:** `dj-booth`, `turntable`, `dj-controller`, `cd-deck`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`, `on`


### Headphones <a id="headphones"></a>

`createObject('headphones', { variant: 'studio' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/headphones-studio.webp" width="200" alt="headphones studio"><br><sub><b>studio</b></sub></td><td align="center"><img src="images/headphones-dj.webp" width="200" alt="headphones dj"><br><sub><b>dj</b></sub></td><td align="center"><img src="images/headphones-open-back.webp" width="200" alt="headphones open-back"><br><sub><b>open-back</b></sub></td></tr>
</table>

**Variants:** `studio`, `dj`, `open-back`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Music Stand <a id="music-stand"></a>

`createObject('music-stand', { variant: 'wire-folding' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/music-stand-wire-folding.webp" width="200" alt="music-stand wire-folding"><br><sub><b>wire-folding</b></sub></td><td align="center"><img src="images/music-stand-orchestral.webp" width="200" alt="music-stand orchestral"><br><sub><b>orchestral</b></sub></td><td align="center"><img src="images/music-stand-conductor-podium.webp" width="200" alt="music-stand conductor-podium"><br><sub><b>conductor-podium</b></sub></td></tr>
</table>

**Variants:** `wire-folding`, `orchestral`, `conductor-podium`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Stage Light <a id="stage-light"></a>

`createObject('stage-light', { variant: 'par-can' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/stage-light-par-can.webp" width="200" alt="stage-light par-can"><br><sub><b>par-can</b></sub></td><td align="center"><img src="images/stage-light-moving-head.webp" width="200" alt="stage-light moving-head"><br><sub><b>moving-head</b></sub></td><td align="center"><img src="images/stage-light-light-truss.webp" width="200" alt="stage-light light-truss"><br><sub><b>light-truss</b></sub></td><td align="center"><sub><b>follow-spot</b></sub></td></tr>
<tr><td align="center"><sub><b>led-bar</b></sub></td></tr>
</table>

**Variants:** `par-can`, `moving-head`, `light-truss`, `follow-spot`, `led-bar`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`, `chase`


### Acoustic guitar (HD) <a id="hd-acoustic-guitar"></a>

`createObject('hd-acoustic-guitar', { variant: 'natural' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>natural</b></sub></td><td align="center"><sub><b>sunburst</b></sub></td><td align="center"><sub><b>dark-mahogany</b></sub></td></tr>
</table>

**Variants:** `natural`, `sunburst`, `dark-mahogany`


### Drum (HD) <a id="hd-drum"></a>

`createObject('hd-drum', { variant: 'snare-red' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>snare-red</b></sub></td><td align="center"><sub><b>snare-black</b></sub></td><td align="center"><sub><b>floor-tom-blue</b></sub></td></tr>
</table>

**Variants:** `snare-red`, `snare-black`, `floor-tom-blue`


### Microphone (HD) <a id="hd-microphone"></a>

`createObject('hd-microphone', { variant: 'vocal' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>vocal</b></sub></td><td align="center"><sub><b>studio-condenser</b></sub></td><td align="center"><sub><b>studio-gold</b></sub></td></tr>
</table>

**Variants:** `vocal`, `studio-condenser`, `studio-gold`


## Sports

### Sports Ball <a id="sports-ball"></a>

`createObject('sports-ball', { variant: 'soccer' })` · 14 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sports-ball-soccer.webp" width="200" alt="sports-ball soccer"><br><sub><b>soccer</b></sub></td><td align="center"><img src="images/sports-ball-basketball.webp" width="200" alt="sports-ball basketball"><br><sub><b>basketball</b></sub></td><td align="center"><img src="images/sports-ball-volleyball.webp" width="200" alt="sports-ball volleyball"><br><sub><b>volleyball</b></sub></td><td align="center"><sub><b>tennis</b></sub></td></tr>
<tr><td align="center"><sub><b>baseball</b></sub></td><td align="center"><sub><b>softball</b></sub></td><td align="center"><sub><b>american-football</b></sub></td><td align="center"><sub><b>rugby</b></sub></td></tr>
<tr><td align="center"><sub><b>golf</b></sub></td><td align="center"><sub><b>bowling</b></sub></td><td align="center"><sub><b>cricket</b></sub></td><td align="center"><sub><b>pool-ball</b></sub></td></tr>
<tr><td align="center"><sub><b>water-polo</b></sub></td><td align="center"><sub><b>handball</b></sub></td></tr>
</table>

**Variants:** `soccer`, `basketball`, `volleyball`, `tennis`, `baseball`, `softball`, `american-football`, `rugby`, `golf`, `bowling`, `cricket`, `pool-ball`, `water-polo`, `handball`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Racket & Paddle <a id="racket"></a>

`createObject('racket', { variant: 'tennis' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/racket-tennis.webp" width="200" alt="racket tennis"><br><sub><b>tennis</b></sub></td><td align="center"><img src="images/racket-badminton.webp" width="200" alt="racket badminton"><br><sub><b>badminton</b></sub></td><td align="center"><img src="images/racket-squash.webp" width="200" alt="racket squash"><br><sub><b>squash</b></sub></td><td align="center"><sub><b>racquetball</b></sub></td></tr>
<tr><td align="center"><sub><b>padel</b></sub></td><td align="center"><sub><b>table-tennis</b></sub></td><td align="center"><sub><b>pickleball</b></sub></td></tr>
</table>

**Variants:** `tennis`, `badminton`, `squash`, `racquetball`, `padel`, `table-tennis`, `pickleball`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Bat <a id="sports-bat"></a>

`createObject('sports-bat', { variant: 'baseball-wood' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sports-bat-baseball-wood.webp" width="200" alt="sports-bat baseball-wood"><br><sub><b>baseball-wood</b></sub></td><td align="center"><img src="images/sports-bat-baseball-alloy.webp" width="200" alt="sports-bat baseball-alloy"><br><sub><b>baseball-alloy</b></sub></td><td align="center"><img src="images/sports-bat-softball.webp" width="200" alt="sports-bat softball"><br><sub><b>softball</b></sub></td><td align="center"><sub><b>t-ball</b></sub></td></tr>
<tr><td align="center"><sub><b>rounders</b></sub></td><td align="center"><sub><b>cricket</b></sub></td></tr>
</table>

**Variants:** `baseball-wood`, `baseball-alloy`, `softball`, `t-ball`, `rounders`, `cricket`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Stick & Mallet <a id="sports-stick"></a>

`createObject('sports-stick', { variant: 'ice-hockey' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sports-stick-ice-hockey.webp" width="200" alt="sports-stick ice-hockey"><br><sub><b>ice-hockey</b></sub></td><td align="center"><img src="images/sports-stick-field-hockey.webp" width="200" alt="sports-stick field-hockey"><br><sub><b>field-hockey</b></sub></td><td align="center"><img src="images/sports-stick-lacrosse.webp" width="200" alt="sports-stick lacrosse"><br><sub><b>lacrosse</b></sub></td><td align="center"><sub><b>hurling</b></sub></td></tr>
<tr><td align="center"><sub><b>polo-mallet</b></sub></td><td align="center"><sub><b>croquet-mallet</b></sub></td><td align="center"><sub><b>pool-cue</b></sub></td><td align="center"><sub><b>floorball</b></sub></td></tr>
</table>

**Variants:** `ice-hockey`, `field-hockey`, `lacrosse`, `hurling`, `polo-mallet`, `croquet-mallet`, `pool-cue`, `floorball`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Golf Club & Bag <a id="golf-club"></a>

`createObject('golf-club', { variant: 'driver' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/golf-club-driver.webp" width="200" alt="golf-club driver"><br><sub><b>driver</b></sub></td><td align="center"><img src="images/golf-club-fairway-wood.webp" width="200" alt="golf-club fairway-wood"><br><sub><b>fairway-wood</b></sub></td><td align="center"><img src="images/golf-club-hybrid.webp" width="200" alt="golf-club hybrid"><br><sub><b>hybrid</b></sub></td><td align="center"><sub><b>iron</b></sub></td></tr>
<tr><td align="center"><sub><b>wedge</b></sub></td><td align="center"><sub><b>putter</b></sub></td><td align="center"><sub><b>golf-bag</b></sub></td></tr>
</table>

**Variants:** `driver`, `fairway-wood`, `hybrid`, `iron`, `wedge`, `putter`, `golf-bag`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Goal <a id="sports-goal"></a>

`createObject('sports-goal', { variant: 'soccer' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sports-goal-soccer.webp" width="200" alt="sports-goal soccer"><br><sub><b>soccer</b></sub></td><td align="center"><img src="images/sports-goal-futsal.webp" width="200" alt="sports-goal futsal"><br><sub><b>futsal</b></sub></td><td align="center"><img src="images/sports-goal-ice-hockey.webp" width="200" alt="sports-goal ice-hockey"><br><sub><b>ice-hockey</b></sub></td><td align="center"><sub><b>handball</b></sub></td></tr>
<tr><td align="center"><sub><b>lacrosse</b></sub></td><td align="center"><sub><b>field-hockey</b></sub></td><td align="center"><sub><b>rugby-posts</b></sub></td></tr>
</table>

**Variants:** `soccer`, `futsal`, `ice-hockey`, `handball`, `lacrosse`, `field-hockey`, `rugby-posts`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Basketball Hoop <a id="basketball-hoop"></a>

`createObject('basketball-hoop', { variant: 'in-ground' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/basketball-hoop-in-ground.webp" width="200" alt="basketball-hoop in-ground"><br><sub><b>in-ground</b></sub></td><td align="center"><img src="images/basketball-hoop-portable.webp" width="200" alt="basketball-hoop portable"><br><sub><b>portable</b></sub></td><td align="center"><img src="images/basketball-hoop-wall-mount.webp" width="200" alt="basketball-hoop wall-mount"><br><sub><b>wall-mount</b></sub></td><td align="center"><sub><b>arena</b></sub></td></tr>
<tr><td align="center"><sub><b>street</b></sub></td></tr>
</table>

**Variants:** `in-ground`, `portable`, `wall-mount`, `arena`, `street`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Court Net & Table <a id="sports-net"></a>

`createObject('sports-net', { variant: 'tennis' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sports-net-tennis.webp" width="200" alt="sports-net tennis"><br><sub><b>tennis</b></sub></td><td align="center"><img src="images/sports-net-volleyball.webp" width="200" alt="sports-net volleyball"><br><sub><b>volleyball</b></sub></td><td align="center"><img src="images/sports-net-badminton.webp" width="200" alt="sports-net badminton"><br><sub><b>badminton</b></sub></td><td align="center"><sub><b>pickleball</b></sub></td></tr>
<tr><td align="center"><sub><b>beach-volleyball</b></sub></td><td align="center"><sub><b>table-tennis</b></sub></td></tr>
</table>

**Variants:** `tennis`, `volleyball`, `badminton`, `pickleball`, `beach-volleyball`, `table-tennis`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Free Weight <a id="free-weight"></a>

`createObject('free-weight', { variant: 'dumbbell' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/free-weight-dumbbell.webp" width="200" alt="free-weight dumbbell"><br><sub><b>dumbbell</b></sub></td><td align="center"><img src="images/free-weight-hex-dumbbell.webp" width="200" alt="free-weight hex-dumbbell"><br><sub><b>hex-dumbbell</b></sub></td><td align="center"><img src="images/free-weight-kettlebell.webp" width="200" alt="free-weight kettlebell"><br><sub><b>kettlebell</b></sub></td><td align="center"><sub><b>barbell</b></sub></td></tr>
<tr><td align="center"><sub><b>plate-tree</b></sub></td><td align="center"><sub><b>medicine-ball</b></sub></td></tr>
</table>

**Variants:** `dumbbell`, `hex-dumbbell`, `kettlebell`, `barbell`, `plate-tree`, `medicine-ball`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Gym Machine <a id="gym-machine"></a>

`createObject('gym-machine', { variant: 'weight-bench' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gym-machine-weight-bench.webp" width="200" alt="gym-machine weight-bench"><br><sub><b>weight-bench</b></sub></td><td align="center"><img src="images/gym-machine-squat-rack.webp" width="200" alt="gym-machine squat-rack"><br><sub><b>squat-rack</b></sub></td><td align="center"><img src="images/gym-machine-treadmill.webp" width="200" alt="gym-machine treadmill"><br><sub><b>treadmill</b></sub></td><td align="center"><sub><b>exercise-bike</b></sub></td></tr>
<tr><td align="center"><sub><b>rowing-machine</b></sub></td></tr>
</table>

**Variants:** `weight-bench`, `squat-rack`, `treadmill`, `exercise-bike`, `rowing-machine`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Fitness Gear <a id="fitness-gear"></a>

`createObject('fitness-gear', { variant: 'yoga-mat' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/fitness-gear-yoga-mat.webp" width="200" alt="fitness-gear yoga-mat"><br><sub><b>yoga-mat</b></sub></td><td align="center"><img src="images/fitness-gear-punching-bag.webp" width="200" alt="fitness-gear punching-bag"><br><sub><b>punching-bag</b></sub></td><td align="center"><sub><b>foam-roller</b></sub></td><td align="center"><sub><b>exercise-ball</b></sub></td></tr>
<tr><td align="center"><sub><b>plyo-box</b></sub></td></tr>
</table>

**Variants:** `yoga-mat`, `punching-bag`, `foam-roller`, `exercise-ball`, `plyo-box`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Skate, Surf & Snow <a id="board-sport"></a>

`createObject('board-sport', { variant: 'skateboard' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/board-sport-skateboard.webp" width="200" alt="board-sport skateboard"><br><sub><b>skateboard</b></sub></td><td align="center"><img src="images/board-sport-longboard.webp" width="200" alt="board-sport longboard"><br><sub><b>longboard</b></sub></td><td align="center"><sub><b>surfboard</b></sub></td><td align="center"><sub><b>longboard-surf</b></sub></td></tr>
<tr><td align="center"><sub><b>snowboard</b></sub></td><td align="center"><sub><b>skis</b></sub></td></tr>
</table>

**Variants:** `skateboard`, `longboard`, `surfboard`, `longboard-surf`, `snowboard`, `skis`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `roll`


### Sports Helmet <a id="sports-helmet"></a>

`createObject('sports-helmet', { variant: 'american-football' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sports-helmet-american-football.webp" width="200" alt="sports-helmet american-football"><br><sub><b>american-football</b></sub></td><td align="center"><img src="images/sports-helmet-bike.webp" width="200" alt="sports-helmet bike"><br><sub><b>bike</b></sub></td><td align="center"><sub><b>hockey</b></sub></td><td align="center"><sub><b>batting</b></sub></td></tr>
<tr><td align="center"><sub><b>ski</b></sub></td></tr>
</table>

**Variants:** `american-football`, `bike`, `hockey`, `batting`, `ski`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Sports Glove <a id="sports-glove"></a>

`createObject('sports-glove', { variant: 'baseball-mitt' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sports-glove-baseball-mitt.webp" width="200" alt="sports-glove baseball-mitt"><br><sub><b>baseball-mitt</b></sub></td><td align="center"><img src="images/sports-glove-boxing-glove.webp" width="200" alt="sports-glove boxing-glove"><br><sub><b>boxing-glove</b></sub></td><td align="center"><sub><b>goalkeeper-glove</b></sub></td></tr>
</table>

**Variants:** `baseball-mitt`, `boxing-glove`, `goalkeeper-glove`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Training Gear <a id="training-gear"></a>

`createObject('training-gear', { variant: 'cone' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/training-gear-cone.webp" width="200" alt="training-gear cone"><br><sub><b>cone</b></sub></td><td align="center"><img src="images/training-gear-hurdle.webp" width="200" alt="training-gear hurdle"><br><sub><b>hurdle</b></sub></td><td align="center"><sub><b>starting-blocks</b></sub></td><td align="center"><sub><b>agility-ladder</b></sub></td></tr>
</table>

**Variants:** `cone`, `hurdle`, `starting-blocks`, `agility-ladder`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Trophy & Medals <a id="trophy"></a>

`createObject('trophy', { variant: 'cup' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/trophy-cup.webp" width="200" alt="trophy cup"><br><sub><b>cup</b></sub></td><td align="center"><img src="images/trophy-figure.webp" width="200" alt="trophy figure"><br><sub><b>figure</b></sub></td><td align="center"><sub><b>star</b></sub></td><td align="center"><sub><b>medal-display</b></sub></td></tr>
<tr><td align="center"><sub><b>shield</b></sub></td></tr>
</table>

**Variants:** `cup`, `figure`, `star`, `medal-display`, `shield`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Scoreboard <a id="scoreboard"></a>

`createObject('scoreboard', { variant: 'digital' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/scoreboard-digital.webp" width="200" alt="scoreboard digital"><br><sub><b>digital</b></sub></td><td align="center"><img src="images/scoreboard-flip-card.webp" width="200" alt="scoreboard flip-card"><br><sub><b>flip-card</b></sub></td><td align="center"><sub><b>stadium</b></sub></td></tr>
</table>

**Variants:** `digital`, `flip-card`, `stadium`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Bleachers <a id="bleachers"></a>

`createObject('bleachers', { variant: 'aluminium' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bleachers-aluminium.webp" width="200" alt="bleachers aluminium"><br><sub><b>aluminium</b></sub></td><td align="center"><img src="images/bleachers-wooden.webp" width="200" alt="bleachers wooden"><br><sub><b>wooden</b></sub></td><td align="center"><sub><b>stadium-seats</b></sub></td></tr>
</table>

**Variants:** `aluminium`, `wooden`, `stadium-seats`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Ball Machine <a id="ball-machine"></a>

`createObject('ball-machine', { variant: 'tennis' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ball-machine-tennis.webp" width="200" alt="ball-machine tennis"><br><sub><b>tennis</b></sub></td><td align="center"><img src="images/ball-machine-pitching.webp" width="200" alt="ball-machine pitching"><br><sub><b>pitching</b></sub></td></tr>
</table>

**Variants:** `tennis`, `pitching`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `oscillate`


### Dumbbells (HD) <a id="hd-dumbbell"></a>

`createObject('hd-dumbbell', { variant: 'hex-pair' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>hex-pair</b></sub></td><td align="center"><sub><b>chrome-pair</b></sub></td><td align="center"><sub><b>hex-single</b></sub></td></tr>
</table>

**Variants:** `hex-pair`, `chrome-pair`, `hex-single`


### Skateboard (HD) <a id="hd-skateboard"></a>

`createObject('hd-skateboard', { variant: 'maple' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>maple</b></sub></td><td align="center"><sub><b>dark-red-wheels</b></sub></td></tr>
</table>

**Variants:** `maple`, `dark-red-wheels`


### Sports ball (HD) <a id="hd-sports-ball"></a>

`createObject('hd-sports-ball', { variant: 'basketball' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>basketball</b></sub></td><td align="center"><sub><b>soccer</b></sub></td><td align="center"><sub><b>tennis</b></sub></td><td align="center"><sub><b>volleyball</b></sub></td></tr>
<tr><td align="center"><sub><b>beach-ball</b></sub></td></tr>
</table>

**Variants:** `basketball`, `soccer`, `tennis`, `volleyball`, `beach-ball`


## Science

### Beaker & Cylinder <a id="lab-beaker"></a>

`createObject('lab-beaker', { variant: 'griffin-250' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-beaker-griffin-250.webp" width="200" alt="lab-beaker griffin-250"><br><sub><b>griffin-250</b></sub></td><td align="center"><img src="images/lab-beaker-tall-form.webp" width="200" alt="lab-beaker tall-form"><br><sub><b>tall-form</b></sub></td><td align="center"><sub><b>low-1000</b></sub></td><td align="center"><sub><b>graduated-cylinder</b></sub></td></tr>
<tr><td align="center"><sub><b>plastic-jug</b></sub></td><td align="center"><sub><b>reagent-bottle</b></sub></td></tr>
</table>

**Variants:** `griffin-250`, `tall-form`, `low-1000`, `graduated-cylinder`, `plastic-jug`, `reagent-bottle`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Lab Flask <a id="lab-flask"></a>

`createObject('lab-flask', { variant: 'erlenmeyer' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-flask-erlenmeyer.webp" width="200" alt="lab-flask erlenmeyer"><br><sub><b>erlenmeyer</b></sub></td><td align="center"><img src="images/lab-flask-round-bottom.webp" width="200" alt="lab-flask round-bottom"><br><sub><b>round-bottom</b></sub></td><td align="center"><sub><b>florence</b></sub></td><td align="center"><sub><b>volumetric</b></sub></td></tr>
<tr><td align="center"><sub><b>distilling</b></sub></td><td align="center"><sub><b>side-arm</b></sub></td></tr>
</table>

**Variants:** `erlenmeyer`, `round-bottom`, `florence`, `volumetric`, `distilling`, `side-arm`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Test Tubes & Rack <a id="lab-tube-rack"></a>

`createObject('lab-tube-rack', { variant: 'rack-6' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-tube-rack-rack-6.webp" width="200" alt="lab-tube-rack rack-6"><br><sub><b>rack-6</b></sub></td><td align="center"><img src="images/lab-tube-rack-rack-12.webp" width="200" alt="lab-tube-rack rack-12"><br><sub><b>rack-12</b></sub></td><td align="center"><sub><b>wire-rack</b></sub></td><td align="center"><sub><b>single-holder</b></sub></td></tr>
<tr><td align="center"><sub><b>culture-tubes</b></sub></td></tr>
</table>

**Variants:** `rack-6`, `rack-12`, `wire-rack`, `single-holder`, `culture-tubes`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Burette, Pipette & Stand <a id="lab-stand"></a>

`createObject('lab-stand', { variant: 'burette-stand' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-stand-burette-stand.webp" width="200" alt="lab-stand burette-stand"><br><sub><b>burette-stand</b></sub></td><td align="center"><img src="images/lab-stand-pipette-stand.webp" width="200" alt="lab-stand pipette-stand"><br><sub><b>pipette-stand</b></sub></td><td align="center"><sub><b>retort-funnel</b></sub></td><td align="center"><sub><b>dropper-set</b></sub></td></tr>
<tr><td align="center"><sub><b>micropipettes</b></sub></td></tr>
</table>

**Variants:** `burette-stand`, `pipette-stand`, `retort-funnel`, `dropper-set`, `micropipettes`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Bunsen Burner & Lamp <a id="lab-burner"></a>

`createObject('lab-burner', { variant: 'bunsen' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-burner-bunsen.webp" width="200" alt="lab-burner bunsen"><br><sub><b>bunsen</b></sub></td><td align="center"><img src="images/lab-burner-tripod-gauze.webp" width="200" alt="lab-burner tripod-gauze"><br><sub><b>tripod-gauze</b></sub></td><td align="center"><sub><b>spirit-lamp</b></sub></td><td align="center"><sub><b>meker</b></sub></td></tr>
</table>

**Variants:** `bunsen`, `tripod-gauze`, `spirit-lamp`, `meker`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `flame`, `on`


### Microscope <a id="lab-microscope"></a>

`createObject('lab-microscope', { variant: 'compound' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-microscope-compound.webp" width="200" alt="lab-microscope compound"><br><sub><b>compound</b></sub></td><td align="center"><img src="images/lab-microscope-student.webp" width="200" alt="lab-microscope student"><br><sub><b>student</b></sub></td><td align="center"><sub><b>stereo</b></sub></td><td align="center"><sub><b>digital</b></sub></td></tr>
<tr><td align="center"><sub><b>trinocular</b></sub></td></tr>
</table>

**Variants:** `compound`, `student`, `stereo`, `digital`, `trinocular`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `focus`, `on`


### Centrifuge <a id="lab-centrifuge"></a>

`createObject('lab-centrifuge', { variant: 'benchtop' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-centrifuge-benchtop.webp" width="200" alt="lab-centrifuge benchtop"><br><sub><b>benchtop</b></sub></td><td align="center"><img src="images/lab-centrifuge-micro.webp" width="200" alt="lab-centrifuge micro"><br><sub><b>micro</b></sub></td><td align="center"><sub><b>floor</b></sub></td><td align="center"><sub><b>clinical</b></sub></td></tr>
</table>

**Variants:** `benchtop`, `micro`, `floor`, `clinical`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`, `open`, `on`


### Petri Dish <a id="lab-petri"></a>

`createObject('lab-petri', { variant: 'single' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-petri-single.webp" width="200" alt="lab-petri single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/lab-petri-open-lid.webp" width="200" alt="lab-petri open-lid"><br><sub><b>open-lid</b></sub></td><td align="center"><sub><b>stack</b></sub></td><td align="center"><sub><b>culture-tray</b></sub></td></tr>
</table>

**Variants:** `single`, `open-lid`, `stack`, `culture-tray`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Lab Bench <a id="lab-bench"></a>

`createObject('lab-bench', { variant: 'island' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-bench-island.webp" width="200" alt="lab-bench island"><br><sub><b>island</b></sub></td><td align="center"><img src="images/lab-bench-wall.webp" width="200" alt="lab-bench wall"><br><sub><b>wall</b></sub></td><td align="center"><sub><b>sink-bench</b></sub></td><td align="center"><sub><b>teacher-demo</b></sub></td></tr>
</table>

**Variants:** `island`, `wall`, `sink-bench`, `teacher-demo`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Fume Hood <a id="lab-fume-hood"></a>

`createObject('lab-fume-hood', { variant: 'standard' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-fume-hood-standard.webp" width="200" alt="lab-fume-hood standard"><br><sub><b>standard</b></sub></td><td align="center"><img src="images/lab-fume-hood-walk-in.webp" width="200" alt="lab-fume-hood walk-in"><br><sub><b>walk-in</b></sub></td><td align="center"><sub><b>benchtop</b></sub></td><td align="center"><sub><b>ductless</b></sub></td></tr>
</table>

**Variants:** `standard`, `walk-in`, `benchtop`, `ductless`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`, `on`


### Safety Goggles & Shield <a id="lab-goggles"></a>

`createObject('lab-goggles', { variant: 'splash' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lab-goggles-splash.webp" width="200" alt="lab-goggles splash"><br><sub><b>splash</b></sub></td><td align="center"><img src="images/lab-goggles-wraparound.webp" width="200" alt="lab-goggles wraparound"><br><sub><b>wraparound</b></sub></td><td align="center"><sub><b>face-shield</b></sub></td><td align="center"><sub><b>goggle-cabinet</b></sub></td></tr>
</table>

**Variants:** `splash`, `wraparound`, `face-shield`, `goggle-cabinet`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Rocket & Launch Pad <a id="space-rocket"></a>

`createObject('space-rocket', { variant: 'classic-pad' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/space-rocket-classic-pad.webp" width="200" alt="space-rocket classic-pad"><br><sub><b>classic-pad</b></sub></td><td align="center"><img src="images/space-rocket-heavy-booster.webp" width="200" alt="space-rocket heavy-booster"><br><sub><b>heavy-booster</b></sub></td><td align="center"><sub><b>sounding</b></sub></td><td align="center"><sub><b>reusable</b></sub></td></tr>
<tr><td align="center"><sub><b>capsule-stack</b></sub></td></tr>
</table>

**Variants:** `classic-pad`, `heavy-booster`, `sounding`, `reusable`, `capsule-stack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `arms`, `launch`, `on`


### Satellite <a id="space-satellite"></a>

`createObject('space-satellite', { variant: 'comms' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/space-satellite-comms.webp" width="200" alt="space-satellite comms"><br><sub><b>comms</b></sub></td><td align="center"><img src="images/space-satellite-weather.webp" width="200" alt="space-satellite weather"><br><sub><b>weather</b></sub></td><td align="center"><sub><b>cubesat</b></sub></td><td align="center"><sub><b>space-telescope</b></sub></td></tr>
<tr><td align="center"><sub><b>probe</b></sub></td></tr>
</table>

**Variants:** `comms`, `weather`, `cubesat`, `space-telescope`, `probe`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `scan`, `deploy`, `on`


### Space Capsule & Lander <a id="space-capsule"></a>

`createObject('space-capsule', { variant: 'cone-3seat' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/space-capsule-cone-3seat.webp" width="200" alt="space-capsule cone-3seat"><br><sub><b>cone-3seat</b></sub></td><td align="center"><img src="images/space-capsule-landed-chute.webp" width="200" alt="space-capsule landed-chute"><br><sub><b>landed-chute</b></sub></td><td align="center"><sub><b>crew-modern</b></sub></td><td align="center"><sub><b>gumdrop-small</b></sub></td></tr>
<tr><td align="center"><sub><b>lunar-lander</b></sub></td></tr>
</table>

**Variants:** `cone-3seat`, `landed-chute`, `crew-modern`, `gumdrop-small`, `lunar-lander`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Space Rover <a id="space-rover"></a>

`createObject('space-rover', { variant: 'lunar-buggy' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/space-rover-lunar-buggy.webp" width="200" alt="space-rover lunar-buggy"><br><sub><b>lunar-buggy</b></sub></td><td align="center"><img src="images/space-rover-mars-6wheel.webp" width="200" alt="space-rover mars-6wheel"><br><sub><b>mars-6wheel</b></sub></td><td align="center"><sub><b>mini-rover</b></sub></td><td align="center"><sub><b>pressurised</b></sub></td></tr>
</table>

**Variants:** `lunar-buggy`, `mars-6wheel`, `mini-rover`, `pressurised`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `drive`


### Telescope & Observatory <a id="space-telescope"></a>

`createObject('space-telescope', { variant: 'refractor' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/space-telescope-refractor.webp" width="200" alt="space-telescope refractor"><br><sub><b>refractor</b></sub></td><td align="center"><img src="images/space-telescope-dobsonian.webp" width="200" alt="space-telescope dobsonian"><br><sub><b>dobsonian</b></sub></td><td align="center"><sub><b>observatory-dome</b></sub></td><td align="center"><sub><b>radio-dish</b></sub></td></tr>
<tr><td align="center"><sub><b>binocular-mount</b></sub></td></tr>
</table>

**Variants:** `refractor`, `dobsonian`, `observatory-dome`, `radio-dish`, `binocular-mount`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `track`


### Planet Globe & Orrery <a id="space-planet-globe"></a>

`createObject('space-planet-globe', { variant: 'earth' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/space-planet-globe-earth.webp" width="200" alt="space-planet-globe earth"><br><sub><b>earth</b></sub></td><td align="center"><img src="images/space-planet-globe-moon.webp" width="200" alt="space-planet-globe moon"><br><sub><b>moon</b></sub></td><td align="center"><sub><b>mars</b></sub></td><td align="center"><sub><b>jupiter</b></sub></td></tr>
<tr><td align="center"><sub><b>saturn</b></sub></td><td align="center"><sub><b>orrery</b></sub></td></tr>
</table>

**Variants:** `earth`, `moon`, `mars`, `jupiter`, `saturn`, `orrery`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Astronaut Helmet & Suit <a id="space-helmet"></a>

`createObject('space-helmet', { variant: 'classic-eva' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/space-helmet-classic-eva.webp" width="200" alt="space-helmet classic-eva"><br><sub><b>classic-eva</b></sub></td><td align="center"><img src="images/space-helmet-modern-eva.webp" width="200" alt="space-helmet modern-eva"><br><sub><b>modern-eva</b></sub></td><td align="center"><sub><b>gold-visor</b></sub></td><td align="center"><sub><b>suit-display</b></sub></td></tr>
<tr><td align="center"><sub><b>flight-pressure</b></sub></td></tr>
</table>

**Variants:** `classic-eva`, `modern-eva`, `gold-visor`, `suit-display`, `flight-pressure`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `stand` | boolean |


### Solar Panels <a id="energy-solar"></a>

`createObject('energy-solar', { variant: 'ground-array' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/energy-solar-ground-array.webp" width="200" alt="energy-solar ground-array"><br><sub><b>ground-array</b></sub></td><td align="center"><img src="images/energy-solar-roof-panel.webp" width="200" alt="energy-solar roof-panel"><br><sub><b>roof-panel</b></sub></td><td align="center"><sub><b>tracker</b></sub></td><td align="center"><sub><b>solar-streetlight</b></sub></td></tr>
<tr><td align="center"><sub><b>portable-kit</b></sub></td></tr>
</table>

**Variants:** `ground-array`, `roof-panel`, `tracker`, `solar-streetlight`, `portable-kit`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Wind Turbine <a id="energy-wind"></a>

`createObject('energy-wind', { variant: 'utility' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/energy-wind-utility.webp" width="200" alt="energy-wind utility"><br><sub><b>utility</b></sub></td><td align="center"><sub><b>small-2blade</b></sub></td><td align="center"><sub><b>vertical-axis</b></sub></td><td align="center"><sub><b>offshore</b></sub></td></tr>
<tr><td align="center"><sub><b>desk-model</b></sub></td></tr>
</table>

**Variants:** `utility`, `small-2blade`, `vertical-axis`, `offshore`, `desk-model`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`, `on`


### Battery <a id="energy-battery"></a>

`createObject('energy-battery', { variant: 'aa-cells' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/energy-battery-aa-cells.webp" width="200" alt="energy-battery aa-cells"><br><sub><b>aa-cells</b></sub></td><td align="center"><sub><b>d-cell</b></sub></td><td align="center"><sub><b>lithium-pack</b></sub></td><td align="center"><sub><b>car-battery</b></sub></td></tr>
<tr><td align="center"><sub><b>home-powerwall</b></sub></td><td align="center"><sub><b>button-cells</b></sub></td></tr>
</table>

**Variants:** `aa-cells`, `d-cell`, `lithium-pack`, `car-battery`, `home-powerwall`, `button-cells`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Molecule Model <a id="edu-molecule"></a>

`createObject('edu-molecule', { variant: 'water' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-molecule-water.webp" width="200" alt="edu-molecule water"><br><sub><b>water</b></sub></td><td align="center"><sub><b>co2</b></sub></td><td align="center"><sub><b>methane</b></sub></td><td align="center"><sub><b>ammonia</b></sub></td></tr>
<tr><td align="center"><sub><b>ethanol</b></sub></td><td align="center"><sub><b>benzene</b></sub></td><td align="center"><sub><b>dna-helix</b></sub></td></tr>
</table>

**Variants:** `water`, `co2`, `methane`, `ammonia`, `ethanol`, `benzene`, `dna-helix`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Anatomical Skeleton <a id="edu-skeleton"></a>

`createObject('edu-skeleton', { variant: 'full-stand' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-skeleton-full-stand.webp" width="200" alt="edu-skeleton full-stand"><br><sub><b>full-stand</b></sub></td><td align="center"><sub><b>skull</b></sub></td><td align="center"><sub><b>spine</b></sub></td><td align="center"><sub><b>arm</b></sub></td></tr>
<tr><td align="center"><sub><b>desk-mini</b></sub></td></tr>
</table>

**Variants:** `full-stand`, `skull`, `spine`, `arm`, `desk-mini`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `sway`


### Globe <a id="edu-globe"></a>

`createObject('edu-globe', { variant: 'desk' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-globe-desk.webp" width="200" alt="edu-globe desk"><br><sub><b>desk</b></sub></td><td align="center"><sub><b>floor</b></sub></td><td align="center"><sub><b>illuminated</b></sub></td><td align="center"><sub><b>political</b></sub></td></tr>
<tr><td align="center"><sub><b>relief</b></sub></td></tr>
</table>

**Variants:** `desk`, `floor`, `illuminated`, `political`, `relief`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Periodic Table Board <a id="edu-periodic-table"></a>

`createObject('edu-periodic-table', { variant: 'wall-board' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-periodic-table-wall-board.webp" width="200" alt="edu-periodic-table wall-board"><br><sub><b>wall-board</b></sub></td><td align="center"><sub><b>easel</b></sub></td><td align="center"><sub><b>desk-mat</b></sub></td><td align="center"><sub><b>poster-frame</b></sub></td></tr>
<tr><td align="center"><sub><b>rolling-board</b></sub></td></tr>
</table>

**Variants:** `wall-board`, `easel`, `desk-mat`, `poster-frame`, `rolling-board`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Chalkboard & Whiteboard <a id="edu-chalkboard"></a>

`createObject('edu-chalkboard', { variant: 'wall' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-chalkboard-wall.webp" width="200" alt="edu-chalkboard wall"><br><sub><b>wall</b></sub></td><td align="center"><sub><b>easel</b></sub></td><td align="center"><sub><b>rolling-green</b></sub></td><td align="center"><sub><b>whiteboard</b></sub></td></tr>
<tr><td align="center"><sub><b>flip-reversible</b></sub></td></tr>
</table>

**Variants:** `wall`, `easel`, `rolling-green`, `whiteboard`, `flip-reversible`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Magnifying Glass <a id="edu-magnifier"></a>

`createObject('edu-magnifier', { variant: 'handheld' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-magnifier-handheld.webp" width="200" alt="edu-magnifier handheld"><br><sub><b>handheld</b></sub></td><td align="center"><sub><b>lamp-magnifier</b></sub></td><td align="center"><sub><b>stand-loupe</b></sub></td><td align="center"><sub><b>jewellers-loupe</b></sub></td></tr>
</table>

**Variants:** `handheld`, `lamp-magnifier`, `stand-loupe`, `jewellers-loupe`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Compass <a id="edu-compass"></a>

`createObject('edu-compass', { variant: 'pocket' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-compass-pocket.webp" width="200" alt="edu-compass pocket"><br><sub><b>pocket</b></sub></td><td align="center"><sub><b>orienteering</b></sub></td><td align="center"><sub><b>drafting</b></sub></td><td align="center"><sub><b>binnacle</b></sub></td></tr>
</table>

**Variants:** `pocket`, `orienteering`, `drafting`, `binnacle`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `close`, `swing`


### Weather Station <a id="edu-weather-station"></a>

`createObject('edu-weather-station', { variant: 'mast' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/edu-weather-station-mast.webp" width="200" alt="edu-weather-station mast"><br><sub><b>mast</b></sub></td><td align="center"><sub><b>home-station</b></sub></td><td align="center"><sub><b>stevenson-screen</b></sub></td><td align="center"><sub><b>rain-gauge</b></sub></td></tr>
<tr><td align="center"><sub><b>school-kit</b></sub></td></tr>
</table>

**Variants:** `mast`, `home-station`, `stevenson-screen`, `rain-gauge`, `school-kit`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`, `wind`, `on`


### Globe (HD) <a id="hd-globe"></a>

`createObject('hd-globe', { variant: 'wood-stand' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>wood-stand</b></sub></td><td align="center"><sub><b>brass-stand</b></sub></td><td align="center"><sub><b>antique</b></sub></td></tr>
</table>

**Variants:** `wood-stand`, `brass-stand`, `antique`


### Lab glassware (HD) <a id="hd-lab-glassware"></a>

`createObject('hd-lab-glassware', { variant: 'mixed-set' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>mixed-set</b></sub></td><td align="center"><sub><b>erlenmeyer-set</b></sub></td><td align="center"><sub><b>mixed-set-green</b></sub></td></tr>
</table>

**Variants:** `mixed-set`, `erlenmeyer-set`, `mixed-set-green`


### Microscope (HD) <a id="hd-microscope"></a>

`createObject('hd-microscope', { variant: 'white' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>white</b></sub></td><td align="center"><sub><b>black</b></sub></td></tr>
</table>

**Variants:** `white`, `black`

| Option | Description |
|---|---|
| `color` | body color |


## Art

### Bust <a id="bust"></a>

`createObject('bust', { variant: 'classical-man' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bust-classical-man.webp" width="200" alt="bust classical-man"><br><sub><b>classical-man</b></sub></td><td align="center"><img src="images/bust-classical-woman.webp" width="200" alt="bust classical-woman"><br><sub><b>classical-woman</b></sub></td><td align="center"><img src="images/bust-laurel.webp" width="200" alt="bust laurel"><br><sub><b>laurel</b></sub></td><td align="center"><sub><b>helmeted</b></sub></td></tr>
<tr><td align="center"><sub><b>child</b></sub></td><td align="center"><sub><b>abstract-head</b></sub></td><td align="center"><sub><b>veiled</b></sub></td></tr>
</table>

**Variants:** `classical-man`, `classical-woman`, `laurel`, `helmeted`, `child`, `abstract-head`, `veiled`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Figure Statue <a id="figure-statue"></a>

`createObject('figure-statue', { variant: 'standing' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/figure-statue-standing.webp" width="200" alt="figure-statue standing"><br><sub><b>standing</b></sub></td><td align="center"><img src="images/figure-statue-contrapposto.webp" width="200" alt="figure-statue contrapposto"><br><sub><b>contrapposto</b></sub></td><td align="center"><img src="images/figure-statue-draped.webp" width="200" alt="figure-statue draped"><br><sub><b>draped</b></sub></td><td align="center"><sub><b>dancer</b></sub></td></tr>
<tr><td align="center"><sub><b>seated</b></sub></td><td align="center"><sub><b>pensive</b></sub></td><td align="center"><sub><b>reclining</b></sub></td><td align="center"><sub><b>torso</b></sub></td></tr>
</table>

**Variants:** `standing`, `contrapposto`, `draped`, `dancer`, `seated`, `pensive`, `reclining`, `torso`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Abstract Sculpture <a id="abstract-sculpture"></a>

`createObject('abstract-sculpture', { variant: 'twisted-torus' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/abstract-sculpture-twisted-torus.webp" width="200" alt="abstract-sculpture twisted-torus"><br><sub><b>twisted-torus</b></sub></td><td align="center"><img src="images/abstract-sculpture-stacked-stones.webp" width="200" alt="abstract-sculpture stacked-stones"><br><sub><b>stacked-stones</b></sub></td><td align="center"><img src="images/abstract-sculpture-ribbon.webp" width="200" alt="abstract-sculpture ribbon"><br><sub><b>ribbon</b></sub></td><td align="center"><sub><b>mobius</b></sub></td></tr>
<tr><td align="center"><sub><b>voronoi-shell</b></sub></td><td align="center"><sub><b>knot</b></sub></td><td align="center"><sub><b>arches</b></sub></td><td align="center"><sub><b>spiral</b></sub></td></tr>
<tr><td align="center"><sub><b>ring-and-orb</b></sub></td><td align="center"><sub><b>monolith</b></sub></td></tr>
</table>

**Variants:** `twisted-torus`, `stacked-stones`, `ribbon`, `mobius`, `voronoi-shell`, `knot`, `arches`, `spiral`, `ring-and-orb`, `monolith`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Low-Poly Art <a id="low-poly-art"></a>

`createObject('low-poly-art', { variant: 'fox' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/low-poly-art-fox.webp" width="200" alt="low-poly-art fox"><br><sub><b>fox</b></sub></td><td align="center"><img src="images/low-poly-art-bear.webp" width="200" alt="low-poly-art bear"><br><sub><b>bear</b></sub></td><td align="center"><img src="images/low-poly-art-cat.webp" width="200" alt="low-poly-art cat"><br><sub><b>cat</b></sub></td><td align="center"><sub><b>rabbit</b></sub></td></tr>
<tr><td align="center"><sub><b>deer</b></sub></td><td align="center"><sub><b>whale</b></sub></td><td align="center"><sub><b>bird</b></sub></td><td align="center"><sub><b>gem-heart</b></sub></td></tr>
</table>

**Variants:** `fox`, `bear`, `cat`, `rabbit`, `deer`, `whale`, `bird`, `gem-heart`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Kinetic Sculpture <a id="kinetic-sculpture"></a>

`createObject('kinetic-sculpture', { variant: 'wind-spinner' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kinetic-sculpture-wind-spinner.webp" width="200" alt="kinetic-sculpture wind-spinner"><br><sub><b>wind-spinner</b></sub></td><td align="center"><img src="images/kinetic-sculpture-orbit-rings.webp" width="200" alt="kinetic-sculpture orbit-rings"><br><sub><b>orbit-rings</b></sub></td><td align="center"><img src="images/kinetic-sculpture-pendulum.webp" width="200" alt="kinetic-sculpture pendulum"><br><sub><b>pendulum</b></sub></td><td align="center"><sub><b>mobile</b></sub></td></tr>
<tr><td align="center"><sub><b>helix-tower</b></sub></td><td align="center"><sub><b>balance-arc</b></sub></td></tr>
</table>

**Variants:** `wind-spinner`, `orbit-rings`, `pendulum`, `mobile`, `helix-tower`, `balance-arc`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Totem <a id="totem"></a>

`createObject('totem', { variant: 'carved-faces' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/totem-carved-faces.webp" width="200" alt="totem carved-faces"><br><sub><b>carved-faces</b></sub></td><td align="center"><img src="images/totem-bird-top.webp" width="200" alt="totem bird-top"><br><sub><b>bird-top</b></sub></td><td align="center"><img src="images/totem-animal-stack.webp" width="200" alt="totem animal-stack"><br><sub><b>animal-stack</b></sub></td><td align="center"><sub><b>geometric</b></sub></td></tr>
<tr><td align="center"><sub><b>painted</b></sub></td><td align="center"><sub><b>tiki</b></sub></td><td align="center"><sub><b>cairn</b></sub></td></tr>
</table>

**Variants:** `carved-faces`, `bird-top`, `animal-stack`, `geometric`, `painted`, `tiki`, `cairn`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Garden Sculpture <a id="garden-sculpture"></a>

`createObject('garden-sculpture', { variant: 'sundial' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-sculpture-sundial.webp" width="200" alt="garden-sculpture sundial"><br><sub><b>sundial</b></sub></td><td align="center"><img src="images/garden-sculpture-gazing-ball.webp" width="200" alt="garden-sculpture gazing-ball"><br><sub><b>gazing-ball</b></sub></td><td align="center"><img src="images/garden-sculpture-armillary.webp" width="200" alt="garden-sculpture armillary"><br><sub><b>armillary</b></sub></td><td align="center"><sub><b>bird-bath</b></sub></td></tr>
<tr><td align="center"><sub><b>obelisk</b></sub></td><td align="center"><sub><b>lattice-orb</b></sub></td><td align="center"><sub><b>stone-lantern</b></sub></td></tr>
</table>

**Variants:** `sundial`, `gazing-ball`, `armillary`, `bird-bath`, `obelisk`, `lattice-orb`, `stone-lantern`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Framed Painting <a id="painting"></a>

`createObject('painting', { variant: 'abstract' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/painting-abstract.webp" width="200" alt="painting abstract"><br><sub><b>abstract</b></sub></td><td align="center"><img src="images/painting-landscape.webp" width="200" alt="painting landscape"><br><sub><b>landscape</b></sub></td><td align="center"><img src="images/painting-geometric.webp" width="200" alt="painting geometric"><br><sub><b>geometric</b></sub></td><td align="center"><sub><b>color-field</b></sub></td></tr>
<tr><td align="center"><sub><b>seascape</b></sub></td><td align="center"><sub><b>sunset</b></sub></td><td align="center"><sub><b>night-sky</b></sub></td><td align="center"><sub><b>dots</b></sub></td></tr>
<tr><td align="center"><sub><b>stripes</b></sub></td><td align="center"><sub><b>still-life</b></sub></td><td align="center"><sub><b>portrait</b></sub></td></tr>
</table>

**Variants:** `abstract`, `landscape`, `geometric`, `color-field`, `seascape`, `sunset`, `night-sky`, `dots`, `stripes`, `still-life`, `portrait`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Easel & Canvas <a id="easel"></a>

`createObject('easel', { variant: 'a-frame' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/easel-a-frame.webp" width="200" alt="easel a-frame"><br><sub><b>a-frame</b></sub></td><td align="center"><img src="images/easel-h-frame.webp" width="200" alt="easel h-frame"><br><sub><b>h-frame</b></sub></td><td align="center"><img src="images/easel-field-tripod.webp" width="200" alt="easel field-tripod"><br><sub><b>field-tripod</b></sub></td><td align="center"><sub><b>tabletop</b></sub></td></tr>
<tr><td align="center"><sub><b>french-box</b></sub></td></tr>
</table>

**Variants:** `a-frame`, `h-frame`, `field-tripod`, `tabletop`, `french-box`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Art Supplies <a id="art-supplies"></a>

`createObject('art-supplies', { variant: 'palette-brushes' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/art-supplies-palette-brushes.webp" width="200" alt="art-supplies palette-brushes"><br><sub><b>palette-brushes</b></sub></td><td align="center"><img src="images/art-supplies-paint-tubes.webp" width="200" alt="art-supplies paint-tubes"><br><sub><b>paint-tubes</b></sub></td><td align="center"><img src="images/art-supplies-brush-jar.webp" width="200" alt="art-supplies brush-jar"><br><sub><b>brush-jar</b></sub></td><td align="center"><sub><b>sketchbook</b></sub></td></tr>
<tr><td align="center"><sub><b>pencil-cup</b></sub></td><td align="center"><sub><b>paint-set</b></sub></td><td align="center"><sub><b>paint-cans</b></sub></td><td align="center"><sub><b>canvas-stack</b></sub></td></tr>
</table>

**Variants:** `palette-brushes`, `paint-tubes`, `brush-jar`, `sketchbook`, `pencil-cup`, `paint-set`, `paint-cans`, `canvas-stack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Pottery Wheel <a id="pottery-wheel"></a>

`createObject('pottery-wheel', { variant: 'electric' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pottery-wheel-electric.webp" width="200" alt="pottery-wheel electric"><br><sub><b>electric</b></sub></td><td align="center"><img src="images/pottery-wheel-kick-wheel.webp" width="200" alt="pottery-wheel kick-wheel"><br><sub><b>kick-wheel</b></sub></td><td align="center"><img src="images/pottery-wheel-tabletop.webp" width="200" alt="pottery-wheel tabletop"><br><sub><b>tabletop</b></sub></td><td align="center"><sub><b>studio</b></sub></td></tr>
</table>

**Variants:** `electric`, `kick-wheel`, `tabletop`, `studio`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Ceramic Vase <a id="ceramic-vase"></a>

`createObject('ceramic-vase', { variant: 'amphora' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ceramic-vase-amphora.webp" width="200" alt="ceramic-vase amphora"><br><sub><b>amphora</b></sub></td><td align="center"><img src="images/ceramic-vase-bottle.webp" width="200" alt="ceramic-vase bottle"><br><sub><b>bottle</b></sub></td><td align="center"><img src="images/ceramic-vase-bowl.webp" width="200" alt="ceramic-vase bowl"><br><sub><b>bowl</b></sub></td><td align="center"><sub><b>urn</b></sub></td></tr>
<tr><td align="center"><sub><b>jug</b></sub></td><td align="center"><sub><b>moon-jar</b></sub></td><td align="center"><sub><b>bud-vase</b></sub></td><td align="center"><sub><b>planter</b></sub></td></tr>
<tr><td align="center"><sub><b>goblet</b></sub></td><td align="center"><sub><b>gourd</b></sub></td></tr>
</table>

**Variants:** `amphora`, `bottle`, `bowl`, `urn`, `jug`, `moon-jar`, `bud-vase`, `planter`, `goblet`, `gourd`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Gallery Pedestal <a id="gallery-pedestal"></a>

`createObject('gallery-pedestal', { variant: 'cube' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gallery-pedestal-cube.webp" width="200" alt="gallery-pedestal cube"><br><sub><b>cube</b></sub></td><td align="center"><img src="images/gallery-pedestal-column.webp" width="200" alt="gallery-pedestal column"><br><sub><b>column</b></sub></td><td align="center"><sub><b>fluted</b></sub></td><td align="center"><sub><b>stepped</b></sub></td></tr>
<tr><td align="center"><sub><b>tapered</b></sub></td><td align="center"><sub><b>cylinder</b></sub></td><td align="center"><sub><b>vitrine</b></sub></td></tr>
</table>

**Variants:** `cube`, `column`, `fluted`, `stepped`, `tapered`, `cylinder`, `vitrine`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Gallery Bench <a id="gallery-bench"></a>

`createObject('gallery-bench', { variant: 'leather-ottoman' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gallery-bench-leather-ottoman.webp" width="200" alt="gallery-bench leather-ottoman"><br><sub><b>leather-ottoman</b></sub></td><td align="center"><img src="images/gallery-bench-wood-slat.webp" width="200" alt="gallery-bench wood-slat"><br><sub><b>wood-slat</b></sub></td><td align="center"><sub><b>stone-block</b></sub></td><td align="center"><sub><b>curved</b></sub></td></tr>
<tr><td align="center"><sub><b>back-to-back</b></sub></td><td align="center"><sub><b>cube-seats</b></sub></td></tr>
</table>

**Variants:** `leather-ottoman`, `wood-slat`, `stone-block`, `curved`, `back-to-back`, `cube-seats`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Wall Installation <a id="wall-installation"></a>

`createObject('wall-installation', { variant: 'grid-tiles' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wall-installation-grid-tiles.webp" width="200" alt="wall-installation grid-tiles"><br><sub><b>grid-tiles</b></sub></td><td align="center"><img src="images/wall-installation-wave-slats.webp" width="200" alt="wall-installation wave-slats"><br><sub><b>wave-slats</b></sub></td><td align="center"><sub><b>mirror-discs</b></sub></td><td align="center"><sub><b>string-art</b></sub></td></tr>
<tr><td align="center"><sub><b>block-relief</b></sub></td><td align="center"><sub><b>arc-rings</b></sub></td></tr>
</table>

**Variants:** `grid-tiles`, `wave-slats`, `mirror-discs`, `string-art`, `block-relief`, `arc-rings`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Neon Sign Art <a id="neon-sign"></a>

`createObject('neon-sign', { variant: 'heart' })` · 10 versions · procedural JS

<table>
<tr><td align="center"><img src="images/neon-sign-heart.webp" width="200" alt="neon-sign heart"><br><sub><b>heart</b></sub></td><td align="center"><img src="images/neon-sign-star.webp" width="200" alt="neon-sign star"><br><sub><b>star</b></sub></td><td align="center"><sub><b>wave</b></sub></td><td align="center"><sub><b>lightning</b></sub></td></tr>
<tr><td align="center"><sub><b>smile</b></sub></td><td align="center"><sub><b>arrow</b></sub></td><td align="center"><sub><b>moon</b></sub></td><td align="center"><sub><b>art-word</b></sub></td></tr>
<tr><td align="center"><sub><b>eye</b></sub></td><td align="center"><sub><b>spiral</b></sub></td></tr>
</table>

**Variants:** `heart`, `star`, `wave`, `lightning`, `smile`, `arrow`, `moon`, `art-word`, `eye`, `spiral`

| Option | Description |
|---|---|
| `color` | neon colour (base model) |

**Animations:** `on`, `flicker`


### Mosaic Panel <a id="art-mosaic"></a>

`createObject('art-mosaic', { variant: 'geometric' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/art-mosaic-geometric.webp" width="200" alt="art-mosaic geometric"><br><sub><b>geometric</b></sub></td><td align="center"><img src="images/art-mosaic-sun.webp" width="200" alt="art-mosaic sun"><br><sub><b>sun</b></sub></td><td align="center"><sub><b>waves</b></sub></td><td align="center"><sub><b>fish</b></sub></td></tr>
<tr><td align="center"><sub><b>flower</b></sub></td><td align="center"><sub><b>random</b></sub></td></tr>
</table>

**Variants:** `geometric`, `sun`, `waves`, `fish`, `flower`, `random`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Stained Glass Panel <a id="stained-glass"></a>

`createObject('stained-glass', { variant: 'rose-window' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/stained-glass-rose-window.webp" width="200" alt="stained-glass rose-window"><br><sub><b>rose-window</b></sub></td><td align="center"><img src="images/stained-glass-arched.webp" width="200" alt="stained-glass arched"><br><sub><b>arched</b></sub></td><td align="center"><sub><b>quarry</b></sub></td><td align="center"><sub><b>voronoi</b></sub></td></tr>
<tr><td align="center"><sub><b>sunburst</b></sub></td><td align="center"><sub><b>floral</b></sub></td></tr>
</table>

**Variants:** `rose-window`, `arched`, `quarry`, `voronoi`, `sunburst`, `floral`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Easel with canvas (HD) <a id="hd-easel"></a>

`createObject('hd-easel', { variant: 'pine-abstract' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>pine-abstract</b></sub></td><td align="center"><sub><b>walnut-landscape</b></sub></td></tr>
</table>

**Variants:** `pine-abstract`, `walnut-landscape`


### Sculpture (HD) <a id="hd-sculpture"></a>

`createObject('hd-sculpture', { variant: 'marble-twist' })` · 5 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>marble-twist</b></sub></td><td align="center"><sub><b>bronze-ring</b></sub></td><td align="center"><sub><b>stone-stack</b></sub></td><td align="center"><sub><b>black-arch</b></sub></td></tr>
<tr><td align="center"><sub><b>bronze-twist</b></sub></td></tr>
</table>

**Variants:** `marble-twist`, `bronze-ring`, `stone-stack`, `black-arch`, `bronze-twist`


## Creatures

### Dragon <a id="dragon"></a>

`createObject('dragon', { variant: 'western' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dragon-western.webp" width="200" alt="dragon western"><br><sub><b>western</b></sub></td><td align="center"><img src="images/dragon-spread.webp" width="200" alt="dragon spread"><br><sub><b>spread</b></sub></td><td align="center"><img src="images/dragon-perched.webp" width="200" alt="dragon perched"><br><sub><b>perched</b></sub></td><td align="center"><sub><b>drake</b></sub></td></tr>
<tr><td align="center"><sub><b>serpentine</b></sub></td><td align="center"><sub><b>sleeping</b></sub></td></tr>
</table>

**Variants:** `western`, `spread`, `perched`, `drake`, `serpentine`, `sleeping`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `walk`, `flap`, `roar`, `glow`


### Wyvern <a id="wyvern"></a>

`createObject('wyvern', { variant: 'standing' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wyvern-standing.webp" width="200" alt="wyvern standing"><br><sub><b>standing</b></sub></td><td align="center"><img src="images/wyvern-swooping.webp" width="200" alt="wyvern swooping"><br><sub><b>swooping</b></sub></td><td align="center"><img src="images/wyvern-crested.webp" width="200" alt="wyvern crested"><br><sub><b>crested</b></sub></td><td align="center"><sub><b>sea-wyvern</b></sub></td></tr>
<tr><td align="center"><sub><b>barbed</b></sub></td></tr>
</table>

**Variants:** `standing`, `swooping`, `crested`, `sea-wyvern`, `barbed`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `flap`, `walk`, `roar`, `glow`


### Griffin <a id="griffin"></a>

`createObject('griffin', { variant: 'classic' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/griffin-classic.webp" width="200" alt="griffin classic"><br><sub><b>classic</b></sub></td><td align="center"><img src="images/griffin-perched.webp" width="200" alt="griffin perched"><br><sub><b>perched</b></sub></td><td align="center"><img src="images/griffin-rearing.webp" width="200" alt="griffin rearing"><br><sub><b>rearing</b></sub></td><td align="center"><sub><b>hippogriff</b></sub></td></tr>
<tr><td align="center"><sub><b>resting</b></sub></td></tr>
</table>

**Variants:** `classic`, `perched`, `rearing`, `hippogriff`, `resting`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `walk`, `flap`, `glow`


### Unicorn <a id="unicorn"></a>

`createObject('unicorn', { variant: 'standing' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/unicorn-standing.webp" width="200" alt="unicorn standing"><br><sub><b>standing</b></sub></td><td align="center"><img src="images/unicorn-rearing.webp" width="200" alt="unicorn rearing"><br><sub><b>rearing</b></sub></td><td align="center"><img src="images/unicorn-grazing.webp" width="200" alt="unicorn grazing"><br><sub><b>grazing</b></sub></td><td align="center"><sub><b>winged</b></sub></td></tr>
<tr><td align="center"><sub><b>prancing</b></sub></td></tr>
</table>

**Variants:** `standing`, `rearing`, `grazing`, `winged`, `prancing`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `walk`, `glow`


### Phoenix <a id="phoenix"></a>

`createObject('phoenix', { variant: 'perched' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/phoenix-perched.webp" width="200" alt="phoenix perched"><br><sub><b>perched</b></sub></td><td align="center"><img src="images/phoenix-rising.webp" width="200" alt="phoenix rising"><br><sub><b>rising</b></sub></td><td align="center"><img src="images/phoenix-nesting.webp" width="200" alt="phoenix nesting"><br><sub><b>nesting</b></sub></td><td align="center"><sub><b>long-tail</b></sub></td></tr>
<tr><td align="center"><sub><b>roosting</b></sub></td></tr>
</table>

**Variants:** `perched`, `rising`, `nesting`, `long-tail`, `roosting`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `flap`, `glow`


### Gargoyle <a id="gargoyle"></a>

`createObject('gargoyle', { variant: 'crouching' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gargoyle-crouching.webp" width="200" alt="gargoyle crouching"><br><sub><b>crouching</b></sub></td><td align="center"><img src="images/gargoyle-grinning.webp" width="200" alt="gargoyle grinning"><br><sub><b>grinning</b></sub></td><td align="center"><img src="images/gargoyle-wings-spread.webp" width="200" alt="gargoyle wings-spread"><br><sub><b>wings-spread</b></sub></td><td align="center"><sub><b>horned-beast</b></sub></td></tr>
<tr><td align="center"><sub><b>waterspout</b></sub></td></tr>
</table>

**Variants:** `crouching`, `grinning`, `wings-spread`, `horned-beast`, `waterspout`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `flap`, `roar`, `glow`


### Kraken <a id="kraken"></a>

`createObject('kraken', { variant: 'classic' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kraken-classic.webp" width="200" alt="kraken classic"><br><sub><b>classic</b></sub></td><td align="center"><img src="images/kraken-giant-squid.webp" width="200" alt="kraken giant-squid"><br><sub><b>giant-squid</b></sub></td><td align="center"><img src="images/kraken-octopus.webp" width="200" alt="kraken octopus"><br><sub><b>octopus</b></sub></td><td align="center"><sub><b>colossal</b></sub></td></tr>
<tr><td align="center"><sub><b>ship-wrecker</b></sub></td></tr>
</table>

**Variants:** `classic`, `giant-squid`, `octopus`, `colossal`, `ship-wrecker`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `wave`, `glow`


### Sea Serpent <a id="sea-serpent"></a>

`createObject('sea-serpent', { variant: 'arches' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sea-serpent-arches.webp" width="200" alt="sea-serpent arches"><br><sub><b>arches</b></sub></td><td align="center"><img src="images/sea-serpent-rearing.webp" width="200" alt="sea-serpent rearing"><br><sub><b>rearing</b></sub></td><td align="center"><img src="images/sea-serpent-coiled.webp" width="200" alt="sea-serpent coiled"><br><sub><b>coiled</b></sub></td><td align="center"><sub><b>finned</b></sub></td></tr>
<tr><td align="center"><sub><b>horned</b></sub></td></tr>
</table>

**Variants:** `arches`, `rearing`, `coiled`, `finned`, `horned`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `roar`, `glow`


### Golem <a id="golem"></a>

`createObject('golem', { variant: 'stone-giant' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/golem-stone-giant.webp" width="200" alt="golem stone-giant"><br><sub><b>stone-giant</b></sub></td><td align="center"><img src="images/golem-brute.webp" width="200" alt="golem brute"><br><sub><b>brute</b></sub></td><td align="center"><img src="images/golem-sentinel.webp" width="200" alt="golem sentinel"><br><sub><b>sentinel</b></sub></td><td align="center"><sub><b>rune-pillar</b></sub></td></tr>
<tr><td align="center"><sub><b>clay</b></sub></td></tr>
</table>

**Variants:** `stone-giant`, `brute`, `sentinel`, `rune-pillar`, `clay`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `walk`, `smash`, `glow`


### Yeti <a id="yeti"></a>

`createObject('yeti', { variant: 'standing' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/yeti-standing.webp" width="200" alt="yeti standing"><br><sub><b>standing</b></sub></td><td align="center"><img src="images/yeti-crouching.webp" width="200" alt="yeti crouching"><br><sub><b>crouching</b></sub></td><td align="center"><img src="images/yeti-roaring.webp" width="200" alt="yeti roaring"><br><sub><b>roaring</b></sub></td><td align="center"><sub><b>elder</b></sub></td></tr>
<tr><td align="center"><sub><b>hunter</b></sub></td></tr>
</table>

**Variants:** `standing`, `crouching`, `roaring`, `elder`, `hunter`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `walk`, `roar`, `glow`


### Goblin Statue <a id="goblin-statue"></a>

`createObject('goblin-statue', { variant: 'spear-guard' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/goblin-statue-spear-guard.webp" width="200" alt="goblin-statue spear-guard"><br><sub><b>spear-guard</b></sub></td><td align="center"><img src="images/goblin-statue-lantern-bearer.webp" width="200" alt="goblin-statue lantern-bearer"><br><sub><b>lantern-bearer</b></sub></td><td align="center"><img src="images/goblin-statue-thief.webp" width="200" alt="goblin-statue thief"><br><sub><b>thief</b></sub></td><td align="center"><sub><b>shaman</b></sub></td></tr>
<tr><td align="center"><sub><b>drummer</b></sub></td></tr>
</table>

**Variants:** `spear-guard`, `lantern-bearer`, `thief`, `shaman`, `drummer`

| Option | Description |
|---|---|
| `color` | stone colour (base model) |

**Animations:** `idle`, `wave`


### Slime <a id="slime"></a>

`createObject('slime', { variant: 'blob' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/slime-blob.webp" width="200" alt="slime blob"><br><sub><b>blob</b></sub></td><td align="center"><img src="images/slime-king.webp" width="200" alt="slime king"><br><sub><b>king</b></sub></td><td align="center"><img src="images/slime-cube.webp" width="200" alt="slime cube"><br><sub><b>cube</b></sub></td><td align="center"><sub><b>twin</b></sub></td></tr>
<tr><td align="center"><sub><b>puddle</b></sub></td></tr>
</table>

**Variants:** `blob`, `king`, `cube`, `twin`, `puddle`

| Option | Description |
|---|---|
| `color` | gel colour (base model) |

**Animations:** `idle`, `bounce`, `glow`


### Mushroom Folk <a id="mushroom-folk"></a>

`createObject('mushroom-folk', { variant: 'toadstool' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mushroom-folk-toadstool.webp" width="200" alt="mushroom-folk toadstool"><br><sub><b>toadstool</b></sub></td><td align="center"><img src="images/mushroom-folk-elder.webp" width="200" alt="mushroom-folk elder"><br><sub><b>elder</b></sub></td><td align="center"><img src="images/mushroom-folk-puffball.webp" width="200" alt="mushroom-folk puffball"><br><sub><b>puffball</b></sub></td><td align="center"><sub><b>tall-cap</b></sub></td></tr>
<tr><td align="center"><sub><b>colony</b></sub></td></tr>
</table>

**Variants:** `toadstool`, `elder`, `puffball`, `tall-cap`, `colony`

| Option | Description |
|---|---|
| `color` | cap colour (base model) |

**Animations:** `idle`, `wave`, `glow`


### Alien Critter <a id="alien-critter"></a>

`createObject('alien-critter', { variant: 'eye-stalker' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/alien-critter-eye-stalker.webp" width="200" alt="alien-critter eye-stalker"><br><sub><b>eye-stalker</b></sub></td><td align="center"><img src="images/alien-critter-tripod.webp" width="200" alt="alien-critter tripod"><br><sub><b>tripod</b></sub></td><td align="center"><img src="images/alien-critter-jelly.webp" width="200" alt="alien-critter jelly"><br><sub><b>jelly</b></sub></td><td align="center"><sub><b>crawler</b></sub></td></tr>
<tr><td align="center"><sub><b>spore-puff</b></sub></td></tr>
</table>

**Variants:** `eye-stalker`, `tripod`, `jelly`, `crawler`, `spore-puff`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `glow`


### Robot Companion <a id="robot-companion"></a>

`createObject('robot-companion', { variant: 'rover' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/robot-companion-rover.webp" width="200" alt="robot-companion rover"><br><sub><b>rover</b></sub></td><td align="center"><img src="images/robot-companion-biped.webp" width="200" alt="robot-companion biped"><br><sub><b>biped</b></sub></td><td align="center"><img src="images/robot-companion-hover.webp" width="200" alt="robot-companion hover"><br><sub><b>hover</b></sub></td><td align="center"><sub><b>spider</b></sub></td></tr>
<tr><td align="center"><sub><b>dog</b></sub></td></tr>
</table>

**Variants:** `rover`, `biped`, `hover`, `spider`, `dog`

| Option | Description |
|---|---|
| `color` | shell colour (base model) |

**Animations:** `idle`, `drive`, `glow`


### Tree Folk (Ent) <a id="treefolk"></a>

`createObject('treefolk', { variant: 'oak' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/treefolk-oak.webp" width="200" alt="treefolk oak"><br><sub><b>oak</b></sub></td><td align="center"><img src="images/treefolk-pine.webp" width="200" alt="treefolk pine"><br><sub><b>pine</b></sub></td><td align="center"><img src="images/treefolk-willow.webp" width="200" alt="treefolk willow"><br><sub><b>willow</b></sub></td><td align="center"><sub><b>birch</b></sub></td></tr>
<tr><td align="center"><sub><b>stump</b></sub></td><td align="center"><sub><b>blossom</b></sub></td></tr>
</table>

**Variants:** `oak`, `pine`, `willow`, `birch`, `stump`, `blossom`

| Option | Description |
|---|---|
| `color` | main skin colour (base model) |

**Animations:** `idle`, `walk`, `glow`


### Dragon egg (HD) <a id="hd-dragon-egg"></a>

`createObject('hd-dragon-egg', { variant: 'emerald' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>emerald</b></sub></td><td align="center"><sub><b>crimson-glowing</b></sub></td><td align="center"><sub><b>obsidian</b></sub></td></tr>
</table>

**Variants:** `emerald`, `crimson-glowing`, `obsidian`


### Dragon statue (HD) <a id="hd-dragon-statue"></a>

`createObject('hd-dragon-statue', { variant: 'stone' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>stone</b></sub></td><td align="center"><sub><b>bronze</b></sub></td><td align="center"><sub><b>jade</b></sub></td><td align="center"><sub><b>stone-winged</b></sub></td></tr>
</table>

**Variants:** `stone`, `bronze`, `jade`, `stone-winged`


### Gargoyle (HD) <a id="hd-gargoyle"></a>

`createObject('hd-gargoyle', { variant: 'weathered' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>weathered</b></sub></td><td align="center"><sub><b>dark-mossy</b></sub></td></tr>
</table>

**Variants:** `weathered`, `dark-mossy`


## History

### Classical Column <a id="classical-column"></a>

`createObject('classical-column', { variant: 'doric' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/classical-column-doric.webp" width="200" alt="classical-column doric"><br><sub><b>doric</b></sub></td><td align="center"><img src="images/classical-column-tuscan.webp" width="200" alt="classical-column tuscan"><br><sub><b>tuscan</b></sub></td><td align="center"><sub><b>ionic</b></sub></td><td align="center"><sub><b>corinthian</b></sub></td></tr>
<tr><td align="center"><sub><b>composite</b></sub></td><td align="center"><sub><b>egyptian</b></sub></td><td align="center"><sub><b>minoan</b></sub></td><td align="center"><sub><b>solomonic</b></sub></td></tr>
</table>

**Variants:** `doric`, `tuscan`, `ionic`, `corinthian`, `composite`, `egyptian`, `minoan`, `solomonic`


### Temple & Pediment <a id="temple-piece"></a>

`createObject('temple-piece', { variant: 'colonnade' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/temple-piece-colonnade.webp" width="200" alt="temple-piece colonnade"><br><sub><b>colonnade</b></sub></td><td align="center"><img src="images/temple-piece-pediment.webp" width="200" alt="temple-piece pediment"><br><sub><b>pediment</b></sub></td><td align="center"><sub><b>steps</b></sub></td><td align="center"><sub><b>prostyle-temple</b></sub></td></tr>
<tr><td align="center"><sub><b>peripteral-temple</b></sub></td><td align="center"><sub><b>tholos</b></sub></td><td align="center"><sub><b>altar</b></sub></td><td align="center"><sub><b>aedicula</b></sub></td></tr>
</table>

**Variants:** `colonnade`, `pediment`, `steps`, `prostyle-temple`, `peripteral-temple`, `tholos`, `altar`, `aedicula`


### Obelisk <a id="obelisk"></a>

`createObject('obelisk', { variant: 'monumental' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/obelisk-monumental.webp" width="200" alt="obelisk monumental"><br><sub><b>monumental</b></sub></td><td align="center"><img src="images/obelisk-temple.webp" width="200" alt="obelisk temple"><br><sub><b>temple</b></sub></td><td align="center"><sub><b>garden</b></sub></td><td align="center"><sub><b>twin</b></sub></td></tr>
</table>

**Variants:** `monumental`, `temple`, `garden`, `twin`


### Sarcophagus <a id="sarcophagus"></a>

`createObject('sarcophagus', { variant: 'chest' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sarcophagus-chest.webp" width="200" alt="sarcophagus chest"><br><sub><b>chest</b></sub></td><td align="center"><img src="images/sarcophagus-garland.webp" width="200" alt="sarcophagus garland"><br><sub><b>garland</b></sub></td><td align="center"><sub><b>anthropoid</b></sub></td><td align="center"><sub><b>stone-coffin</b></sub></td></tr>
</table>

**Variants:** `chest`, `garland`, `anthropoid`, `stone-coffin`

**Animations:** `open`


### Pyramid <a id="pyramid"></a>

`createObject('pyramid', { variant: 'step' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pyramid-step.webp" width="200" alt="pyramid step"><br><sub><b>step</b></sub></td><td align="center"><img src="images/pyramid-smooth.webp" width="200" alt="pyramid smooth"><br><sub><b>smooth</b></sub></td><td align="center"><sub><b>bent</b></sub></td><td align="center"><sub><b>mesoamerican</b></sub></td></tr>
<tr><td align="center"><sub><b>nubian</b></sub></td><td align="center"><sub><b>ziggurat</b></sub></td><td align="center"><sub><b>mastaba</b></sub></td></tr>
</table>

**Variants:** `step`, `smooth`, `bent`, `mesoamerican`, `nubian`, `ziggurat`, `mastaba`


### Roman Arch <a id="roman-arch"></a>

`createObject('roman-arch', { variant: 'single' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/roman-arch-single.webp" width="200" alt="roman-arch single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/roman-arch-triumphal.webp" width="200" alt="roman-arch triumphal"><br><sub><b>triumphal</b></sub></td><td align="center"><sub><b>aqueduct</b></sub></td><td align="center"><sub><b>city-gate</b></sub></td></tr>
<tr><td align="center"><sub><b>bridge</b></sub></td></tr>
</table>

**Variants:** `single`, `triumphal`, `aqueduct`, `city-gate`, `bridge`


### Mosaic Floor <a id="ancient-mosaic"></a>

`createObject('ancient-mosaic', { variant: 'meander' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ancient-mosaic-meander.webp" width="200" alt="ancient-mosaic meander"><br><sub><b>meander</b></sub></td><td align="center"><img src="images/ancient-mosaic-checker.webp" width="200" alt="ancient-mosaic checker"><br><sub><b>checker</b></sub></td><td align="center"><sub><b>wave</b></sub></td><td align="center"><sub><b>rosette</b></sub></td></tr>
<tr><td align="center"><sub><b>labyrinth</b></sub></td><td align="center"><sub><b>guilloche</b></sub></td></tr>
</table>

**Variants:** `meander`, `checker`, `wave`, `rosette`, `labyrinth`, `guilloche`


### Castle Wall <a id="castle-wall"></a>

`createObject('castle-wall', { variant: 'straight' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/castle-wall-straight.webp" width="200" alt="castle-wall straight"><br><sub><b>straight</b></sub></td><td align="center"><img src="images/castle-wall-corner.webp" width="200" alt="castle-wall corner"><br><sub><b>corner</b></sub></td><td align="center"><sub><b>arrow-slits</b></sub></td><td align="center"><sub><b>hoarding</b></sub></td></tr>
<tr><td align="center"><sub><b>buttressed</b></sub></td><td align="center"><sub><b>postern</b></sub></td></tr>
</table>

**Variants:** `straight`, `corner`, `arrow-slits`, `hoarding`, `buttressed`, `postern`


### Castle Tower <a id="castle-tower"></a>

`createObject('castle-tower', { variant: 'round' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/castle-tower-round.webp" width="200" alt="castle-tower round"><br><sub><b>round</b></sub></td><td align="center"><img src="images/castle-tower-square.webp" width="200" alt="castle-tower square"><br><sub><b>square</b></sub></td><td align="center"><sub><b>conical</b></sub></td><td align="center"><sub><b>watchtower</b></sub></td></tr>
<tr><td align="center"><sub><b>keep</b></sub></td></tr>
</table>

**Variants:** `round`, `square`, `conical`, `watchtower`, `keep`


### Castle Gate <a id="castle-gate"></a>

`createObject('castle-gate', { variant: 'portcullis' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/castle-gate-portcullis.webp" width="200" alt="castle-gate portcullis"><br><sub><b>portcullis</b></sub></td><td align="center"><img src="images/castle-gate-drawbridge.webp" width="200" alt="castle-gate drawbridge"><br><sub><b>drawbridge</b></sub></td><td align="center"><sub><b>palisade</b></sub></td><td align="center"><sub><b>barbican</b></sub></td></tr>
</table>

**Variants:** `portcullis`, `drawbridge`, `palisade`, `barbican`

**Animations:** `open`


### Village Well <a id="stone-well"></a>

`createObject('stone-well', { variant: 'stone-round' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/stone-well-stone-round.webp" width="200" alt="stone-well stone-round"><br><sub><b>stone-round</b></sub></td><td align="center"><img src="images/stone-well-square.webp" width="200" alt="stone-well square"><br><sub><b>square</b></sub></td><td align="center"><sub><b>open-pulley</b></sub></td><td align="center"><sub><b>covered</b></sub></td></tr>
</table>

**Variants:** `stone-round`, `square`, `open-pulley`, `covered`

**Animations:** `draw`


### Medieval Cart <a id="medieval-cart"></a>

`createObject('medieval-cart', { variant: 'hand-cart' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/medieval-cart-hand-cart.webp" width="200" alt="medieval-cart hand-cart"><br><sub><b>hand-cart</b></sub></td><td align="center"><img src="images/medieval-cart-ox-cart.webp" width="200" alt="medieval-cart ox-cart"><br><sub><b>ox-cart</b></sub></td><td align="center"><sub><b>hay-wagon</b></sub></td><td align="center"><sub><b>barrel-cart</b></sub></td></tr>
</table>

**Variants:** `hand-cart`, `ox-cart`, `hay-wagon`, `barrel-cart`

**Animations:** `roll`


### Heraldic Banner <a id="heraldic-banner"></a>

`createObject('heraldic-banner', { variant: 'hanging' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/heraldic-banner-hanging.webp" width="200" alt="heraldic-banner hanging"><br><sub><b>hanging</b></sub></td><td align="center"><img src="images/heraldic-banner-flag.webp" width="200" alt="heraldic-banner flag"><br><sub><b>flag</b></sub></td><td align="center"><sub><b>pennant</b></sub></td><td align="center"><sub><b>gonfalon</b></sub></td></tr>
<tr><td align="center"><sub><b>tapestry</b></sub></td></tr>
</table>

**Variants:** `hanging`, `flag`, `pennant`, `gonfalon`, `tapestry`

| Option | Description |
|---|---|
| `color` | cloth colour (base model) |

**Animations:** `wave`


### Throne <a id="throne"></a>

`createObject('throne', { variant: 'stone' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/throne-stone.webp" width="200" alt="throne stone"><br><sub><b>stone</b></sub></td><td align="center"><img src="images/throne-carved-oak.webp" width="200" alt="throne carved-oak"><br><sub><b>carved-oak</b></sub></td><td align="center"><sub><b>royal</b></sub></td><td align="center"><sub><b>iron</b></sub></td></tr>
<tr><td align="center"><sub><b>cathedra</b></sub></td></tr>
</table>

**Variants:** `stone`, `carved-oak`, `royal`, `iron`, `cathedra`


### Treasure Chest <a id="treasure-chest"></a>

`createObject('treasure-chest', { variant: 'banded' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/treasure-chest-banded.webp" width="200" alt="treasure-chest banded"><br><sub><b>banded</b></sub></td><td align="center"><img src="images/treasure-chest-domed.webp" width="200" alt="treasure-chest domed"><br><sub><b>domed</b></sub></td><td align="center"><sub><b>strongbox</b></sub></td><td align="center"><sub><b>casket</b></sub></td></tr>
<tr><td align="center"><sub><b>sea-chest</b></sub></td></tr>
</table>

**Variants:** `banded`, `domed`, `strongbox`, `casket`, `sea-chest`

**Animations:** `open`


### Amphora & Greek Vase <a id="amphora"></a>

`createObject('amphora', { variant: 'transport' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/amphora-transport.webp" width="200" alt="amphora transport"><br><sub><b>transport</b></sub></td><td align="center"><img src="images/amphora-neck.webp" width="200" alt="amphora neck"><br><sub><b>neck</b></sub></td><td align="center"><sub><b>hydria</b></sub></td><td align="center"><sub><b>krater</b></sub></td></tr>
<tr><td align="center"><sub><b>lekythos</b></sub></td><td align="center"><sub><b>oinochoe</b></sub></td><td align="center"><sub><b>kylix</b></sub></td><td align="center"><sub><b>pithos</b></sub></td></tr>
</table>

**Variants:** `transport`, `neck`, `hydria`, `krater`, `lekythos`, `oinochoe`, `kylix`, `pithos`


### Ancient Pottery <a id="ancient-pottery"></a>

`createObject('ancient-pottery', { variant: 'bowl' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ancient-pottery-bowl.webp" width="200" alt="ancient-pottery bowl"><br><sub><b>bowl</b></sub></td><td align="center"><img src="images/ancient-pottery-jug.webp" width="200" alt="ancient-pottery jug"><br><sub><b>jug</b></sub></td><td align="center"><sub><b>cooking-pot</b></sub></td><td align="center"><sub><b>storage-jar</b></sub></td></tr>
<tr><td align="center"><sub><b>beaker</b></sub></td><td align="center"><sub><b>plate</b></sub></td></tr>
</table>

**Variants:** `bowl`, `jug`, `cooking-pot`, `storage-jar`, `beaker`, `plate`


### Ancient Coins <a id="ancient-coin"></a>

`createObject('ancient-coin', { variant: 'single' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ancient-coin-single.webp" width="200" alt="ancient-coin single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/ancient-coin-stack.webp" width="200" alt="ancient-coin stack"><br><sub><b>stack</b></sub></td><td align="center"><sub><b>scattered</b></sub></td><td align="center"><sub><b>hoard</b></sub></td></tr>
<tr><td align="center"><sub><b>purse</b></sub></td><td align="center"><sub><b>tray</b></sub></td></tr>
</table>

**Variants:** `single`, `stack`, `scattered`, `hoard`, `purse`, `tray`

| Option | Description |
|---|---|
| `stand` | boolean |


### Scroll & Tablet <a id="scroll"></a>

`createObject('scroll', { variant: 'rolled' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/scroll-rolled.webp" width="200" alt="scroll rolled"><br><sub><b>rolled</b></sub></td><td align="center"><img src="images/scroll-open.webp" width="200" alt="scroll open"><br><sub><b>open</b></sub></td><td align="center"><sub><b>capsa</b></sub></td><td align="center"><sub><b>rack</b></sub></td></tr>
<tr><td align="center"><sub><b>wax-tablet</b></sub></td></tr>
</table>

**Variants:** `rolled`, `open`, `capsa`, `rack`, `wax-tablet`


### Oil Lamp <a id="oil-lamp"></a>

`createObject('oil-lamp', { variant: 'clay' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/oil-lamp-clay.webp" width="200" alt="oil-lamp clay"><br><sub><b>clay</b></sub></td><td align="center"><img src="images/oil-lamp-bronze.webp" width="200" alt="oil-lamp bronze"><br><sub><b>bronze</b></sub></td><td align="center"><sub><b>multi-nozzle</b></sub></td><td align="center"><sub><b>hanging</b></sub></td></tr>
<tr><td align="center"><sub><b>lampstand</b></sub></td></tr>
</table>

**Variants:** `clay`, `bronze`, `multi-nozzle`, `hanging`, `lampstand`

**Animations:** `on`, `flicker`


### Hourglass <a id="hourglass"></a>

`createObject('hourglass', { variant: 'tabletop' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hourglass-tabletop.webp" width="200" alt="hourglass tabletop"><br><sub><b>tabletop</b></sub></td><td align="center"><img src="images/hourglass-tall.webp" width="200" alt="hourglass tall"><br><sub><b>tall</b></sub></td><td align="center"><sub><b>triple</b></sub></td><td align="center"><sub><b>ornate</b></sub></td></tr>
</table>

**Variants:** `tabletop`, `tall`, `triple`, `ornate`

**Animations:** `run`, `flip`


### Sundial <a id="ancient-sundial"></a>

`createObject('ancient-sundial', { variant: 'pedestal' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ancient-sundial-pedestal.webp" width="200" alt="ancient-sundial pedestal"><br><sub><b>pedestal</b></sub></td><td align="center"><img src="images/ancient-sundial-hemispherical.webp" width="200" alt="ancient-sundial hemispherical"><br><sub><b>hemispherical</b></sub></td><td align="center"><sub><b>armillary</b></sub></td><td align="center"><sub><b>wall</b></sub></td></tr>
<tr><td align="center"><sub><b>garden</b></sub></td></tr>
</table>

**Variants:** `pedestal`, `hemispherical`, `armillary`, `wall`, `garden`


### Map Table <a id="map-table"></a>

`createObject('map-table', { variant: 'war-table' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-table-war-table.webp" width="200" alt="map-table war-table"><br><sub><b>war-table</b></sub></td><td align="center"><img src="images/map-table-chart-table.webp" width="200" alt="map-table chart-table"><br><sub><b>chart-table</b></sub></td><td align="center"><sub><b>scholar-desk</b></sub></td><td align="center"><sub><b>round-table</b></sub></td></tr>
</table>

**Variants:** `war-table`, `chart-table`, `scholar-desk`, `round-table`


### Ancient Ruins <a id="ancient-ruins"></a>

`createObject('ancient-ruins', { variant: 'colonnade' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ancient-ruins-colonnade.webp" width="200" alt="ancient-ruins colonnade"><br><sub><b>colonnade</b></sub></td><td align="center"><img src="images/ancient-ruins-temple-floor.webp" width="200" alt="ancient-ruins temple-floor"><br><sub><b>temple-floor</b></sub></td><td align="center"><sub><b>brick-wall</b></sub></td><td align="center"><sub><b>arch-remnant</b></sub></td></tr>
<tr><td align="center"><sub><b>foundations</b></sub></td><td align="center"><sub><b>broken-tower</b></sub></td><td align="center"><sub><b>statue-plinth</b></sub></td></tr>
</table>

**Variants:** `colonnade`, `temple-floor`, `brick-wall`, `arch-remnant`, `foundations`, `broken-tower`, `statue-plinth`


### Amphora (HD) <a id="hd-amphora"></a>

`createObject('hd-amphora', { variant: 'terracotta' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>terracotta</b></sub></td><td align="center"><sub><b>black-figure</b></sub></td><td align="center"><sub><b>pale-clay</b></sub></td></tr>
</table>

**Variants:** `terracotta`, `black-figure`, `pale-clay`

| Option | Description |
|---|---|
| `color` | clay color |


### Classical column (HD) <a id="hd-column"></a>

`createObject('hd-column', { variant: 'doric-marble' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>doric-marble</b></sub></td><td align="center"><sub><b>ionic-marble</b></sub></td><td align="center"><sub><b>broken-ruin</b></sub></td></tr>
</table>

**Variants:** `doric-marble`, `ionic-marble`, `broken-ruin`


### Treasure chest (HD) <a id="hd-treasure-chest"></a>

`createObject('hd-treasure-chest', { variant: 'gold-trim' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>gold-trim</b></sub></td><td align="center"><sub><b>iron-bound</b></sub></td></tr>
</table>

**Variants:** `gold-trim`, `iron-bound`


## Places

### Gazebo <a id="gazebo"></a>

`createObject('gazebo', { variant: 'octagonal' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gazebo-octagonal.webp" width="200" alt="gazebo octagonal"><br><sub><b>octagonal</b></sub></td><td align="center"><img src="images/gazebo-hexagonal.webp" width="200" alt="gazebo hexagonal"><br><sub><b>hexagonal</b></sub></td><td align="center"><sub><b>square</b></sub></td><td align="center"><sub><b>round</b></sub></td></tr>
</table>

**Variants:** `octagonal`, `hexagonal`, `square`, `round`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`


### Picnic pavilion <a id="pavilion"></a>

`createObject('pavilion', { variant: 'gable' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pavilion-gable.webp" width="200" alt="pavilion gable"><br><sub><b>gable</b></sub></td><td align="center"><img src="images/pavilion-hip.webp" width="200" alt="pavilion hip"><br><sub><b>hip</b></sub></td><td align="center"><sub><b>flat</b></sub></td><td align="center"><sub><b>long</b></sub></td></tr>
</table>

**Variants:** `gable`, `hip`, `flat`, `long`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`


### Pergola <a id="pergola"></a>

`createObject('pergola', { variant: 'straight' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pergola-straight.webp" width="200" alt="pergola straight"><br><sub><b>straight</b></sub></td><td align="center"><img src="images/pergola-corner.webp" width="200" alt="pergola corner"><br><sub><b>corner</b></sub></td><td align="center"><sub><b>arched</b></sub></td><td align="center"><sub><b>walkway</b></sub></td></tr>
</table>

**Variants:** `straight`, `corner`, `arched`, `walkway`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Bandstand <a id="bandstand"></a>

`createObject('bandstand', { variant: 'octagonal' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bandstand-octagonal.webp" width="200" alt="bandstand octagonal"><br><sub><b>octagonal</b></sub></td><td align="center"><img src="images/bandstand-round.webp" width="200" alt="bandstand round"><br><sub><b>round</b></sub></td><td align="center"><sub><b>shell</b></sub></td></tr>
</table>

**Variants:** `octagonal`, `round`, `shell`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`


### Park gate <a id="park-gate"></a>

`createObject('park-gate', { variant: 'arch' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/park-gate-arch.webp" width="200" alt="park-gate arch"><br><sub><b>arch</b></sub></td><td align="center"><img src="images/park-gate-iron-gates.webp" width="200" alt="park-gate iron-gates"><br><sub><b>iron-gates</b></sub></td><td align="center"><sub><b>lychgate</b></sub></td><td align="center"><sub><b>portal</b></sub></td></tr>
</table>

**Variants:** `arch`, `iron-gates`, `lychgate`, `portal`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `open`


### Footbridge <a id="footbridge"></a>

`createObject('footbridge', { variant: 'arched' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/footbridge-arched.webp" width="200" alt="footbridge arched"><br><sub><b>arched</b></sub></td><td align="center"><img src="images/footbridge-flat.webp" width="200" alt="footbridge flat"><br><sub><b>flat</b></sub></td><td align="center"><sub><b>moon</b></sub></td><td align="center"><sub><b>truss</b></sub></td></tr>
</table>

**Variants:** `arched`, `flat`, `moon`, `truss`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Boardwalk <a id="boardwalk"></a>

`createObject('boardwalk', { variant: 'straight' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/boardwalk-straight.webp" width="200" alt="boardwalk straight"><br><sub><b>straight</b></sub></td><td align="center"><img src="images/boardwalk-curve.webp" width="200" alt="boardwalk curve"><br><sub><b>curve</b></sub></td><td align="center"><sub><b>lookout</b></sub></td><td align="center"><sub><b>pier</b></sub></td></tr>
</table>

**Variants:** `straight`, `curve`, `lookout`, `pier`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Public restroom <a id="restroom"></a>

`createObject('restroom', { variant: 'kiosk' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/restroom-kiosk.webp" width="200" alt="restroom kiosk"><br><sub><b>kiosk</b></sub></td><td align="center"><img src="images/restroom-block.webp" width="200" alt="restroom block"><br><sub><b>block</b></sub></td><td align="center"><sub><b>cabin</b></sub></td><td align="center"><sub><b>pod</b></sub></td></tr>
</table>

**Variants:** `kiosk`, `block`, `cabin`, `pod`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`, `open`


### Ranger station <a id="ranger-station"></a>

`createObject('ranger-station', { variant: 'cabin' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ranger-station-cabin.webp" width="200" alt="ranger-station cabin"><br><sub><b>cabin</b></sub></td><td align="center"><img src="images/ranger-station-tower.webp" width="200" alt="ranger-station tower"><br><sub><b>tower</b></sub></td><td align="center"><sub><b>booth</b></sub></td></tr>
</table>

**Variants:** `cabin`, `tower`, `booth`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`, `wave`


### Information board <a id="info-board"></a>

`createObject('info-board', { variant: 'map-board' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/info-board-map-board.webp" width="200" alt="info-board map-board"><br><sub><b>map-board</b></sub></td><td align="center"><img src="images/info-board-roofed.webp" width="200" alt="info-board roofed"><br><sub><b>roofed</b></sub></td><td align="center"><sub><b>totem</b></sub></td><td align="center"><sub><b>lectern</b></sub></td></tr>
</table>

**Variants:** `map-board`, `roofed`, `totem`, `lectern`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Park sign <a id="park-sign"></a>

`createObject('park-sign', { variant: 'entrance' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/park-sign-entrance.webp" width="200" alt="park-sign entrance"><br><sub><b>entrance</b></sub></td><td align="center"><img src="images/park-sign-routed.webp" width="200" alt="park-sign routed"><br><sub><b>routed</b></sub></td><td align="center"><sub><b>fingerpost</b></sub></td><td align="center"><sub><b>rules</b></sub></td></tr>
</table>

**Variants:** `entrance`, `routed`, `fingerpost`, `rules`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`


### Drinking fountain (park) <a id="water-point"></a>

`createObject('water-point', { variant: 'column' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/water-point-column.webp" width="200" alt="water-point column"><br><sub><b>column</b></sub></td><td align="center"><img src="images/water-point-bottle-station.webp" width="200" alt="water-point bottle-station"><br><sub><b>bottle-station</b></sub></td><td align="center"><sub><b>hand-pump</b></sub></td><td align="center"><sub><b>bubbler-pair</b></sub></td></tr>
</table>

**Variants:** `column`, `bottle-station`, `hand-pump`, `bubbler-pair`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Pond <a id="pond"></a>

`createObject('pond', { variant: 'round' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pond-round.webp" width="200" alt="pond round"><br><sub><b>round</b></sub></td><td align="center"><img src="images/pond-kidney.webp" width="200" alt="pond kidney"><br><sub><b>kidney</b></sub></td><td align="center"><sub><b>formal</b></sub></td><td align="center"><sub><b>natural</b></sub></td></tr>
</table>

**Variants:** `round`, `kidney`, `formal`, `natural`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `swim`


### Fountain plaza <a id="plaza-fountain"></a>

`createObject('plaza-fountain', { variant: 'tiered' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/plaza-fountain-tiered.webp" width="200" alt="plaza-fountain tiered"><br><sub><b>tiered</b></sub></td><td align="center"><sub><b>jets</b></sub></td><td align="center"><sub><b>statue</b></sub></td><td align="center"><sub><b>cascade</b></sub></td></tr>
</table>

**Variants:** `tiered`, `jets`, `statue`, `cascade`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `flow`, `on`


### Flower bed <a id="flower-bed"></a>

`createObject('flower-bed', { variant: 'round' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/flower-bed-round.webp" width="200" alt="flower-bed round"><br><sub><b>round</b></sub></td><td align="center"><sub><b>long</b></sub></td><td align="center"><sub><b>raised</b></sub></td><td align="center"><sub><b>island</b></sub></td></tr>
<tr><td align="center"><sub><b>border</b></sub></td></tr>
</table>

**Variants:** `round`, `long`, `raised`, `island`, `border`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Rose arch <a id="rose-arch"></a>

`createObject('rose-arch', { variant: 'arch' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rose-arch-arch.webp" width="200" alt="rose-arch arch"><br><sub><b>arch</b></sub></td><td align="center"><sub><b>tunnel</b></sub></td><td align="center"><sub><b>gothic</b></sub></td></tr>
</table>

**Variants:** `arch`, `tunnel`, `gothic`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Hedge maze section <a id="hedge-maze"></a>

`createObject('hedge-maze', { variant: 'straight' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hedge-maze-straight.webp" width="200" alt="hedge-maze straight"><br><sub><b>straight</b></sub></td><td align="center"><sub><b>corner</b></sub></td><td align="center"><sub><b>junction</b></sub></td><td align="center"><sub><b>centre</b></sub></td></tr>
</table>

**Variants:** `straight`, `corner`, `junction`, `centre`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Rock garden <a id="zen-garden"></a>

`createObject('zen-garden', { variant: 'classic' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/zen-garden-classic.webp" width="200" alt="zen-garden classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>lantern</b></sub></td><td align="center"><sub><b>pond-garden</b></sub></td><td align="center"><sub><b>moss</b></sub></td></tr>
</table>

**Variants:** `classic`, `lantern`, `pond-garden`, `moss`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Community garden plots <a id="garden-plots"></a>

`createObject('garden-plots', { variant: 'raised-bed' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-plots-raised-bed.webp" width="200" alt="garden-plots raised-bed"><br><sub><b>raised-bed</b></sub></td><td align="center"><sub><b>rows</b></sub></td><td align="center"><sub><b>allotment</b></sub></td><td align="center"><sub><b>herb-spiral</b></sub></td></tr>
</table>

**Variants:** `raised-bed`, `rows`, `allotment`, `herb-spiral`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Dog park <a id="dog-park"></a>

`createObject('dog-park', { variant: 'fence' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dog-park-fence.webp" width="200" alt="dog-park fence"><br><sub><b>fence</b></sub></td><td align="center"><sub><b>jump</b></sub></td><td align="center"><sub><b>tunnel</b></sub></td><td align="center"><sub><b>weave-poles</b></sub></td></tr>
<tr><td align="center"><sub><b>a-frame</b></sub></td></tr>
</table>

**Variants:** `fence`, `jump`, `tunnel`, `weave-poles`, `a-frame`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `open`


### Skate park piece <a id="skate-ramp"></a>

`createObject('skate-ramp', { variant: 'quarter-pipe' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/skate-ramp-quarter-pipe.webp" width="200" alt="skate-ramp quarter-pipe"><br><sub><b>quarter-pipe</b></sub></td><td align="center"><sub><b>rail</b></sub></td><td align="center"><sub><b>funbox</b></sub></td><td align="center"><sub><b>bowl</b></sub></td></tr>
<tr><td align="center"><sub><b>ledge</b></sub></td><td align="center"><sub><b>kicker</b></sub></td></tr>
</table>

**Variants:** `quarter-pipe`, `rail`, `funbox`, `bowl`, `ledge`, `kicker`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Outdoor gym station <a id="outdoor-gym"></a>

`createObject('outdoor-gym', { variant: 'pull-up' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/outdoor-gym-pull-up.webp" width="200" alt="outdoor-gym pull-up"><br><sub><b>pull-up</b></sub></td><td align="center"><sub><b>parallel-bars</b></sub></td><td align="center"><sub><b>sit-up</b></sub></td><td align="center"><sub><b>cross-trainer</b></sub></td></tr>
<tr><td align="center"><sub><b>leg-press</b></sub></td></tr>
</table>

**Variants:** `pull-up`, `parallel-bars`, `sit-up`, `cross-trainer`, `leg-press`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Picnic area set <a id="picnic-set"></a>

`createObject('picnic-set', { variant: 'table-set' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/picnic-set-table-set.webp" width="200" alt="picnic-set table-set"><br><sub><b>table-set</b></sub></td><td align="center"><sub><b>blanket</b></sub></td><td align="center"><sub><b>family</b></sub></td></tr>
</table>

**Variants:** `table-set`, `blanket`, `family`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `open`, `on`


### BBQ grill <a id="bbq-grill"></a>

`createObject('bbq-grill', { variant: 'pedestal' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bbq-grill-pedestal.webp" width="200" alt="bbq-grill pedestal"><br><sub><b>pedestal</b></sub></td><td align="center"><sub><b>brick</b></sub></td><td align="center"><sub><b>double</b></sub></td><td align="center"><sub><b>fire-pit</b></sub></td></tr>
</table>

**Variants:** `pedestal`, `brick`, `double`, `fire-pit`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `open`, `on`


### Game table <a id="game-table"></a>

`createObject('game-table', { variant: 'chess' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/game-table-chess.webp" width="200" alt="game-table chess"><br><sub><b>chess</b></sub></td><td align="center"><sub><b>double-chess</b></sub></td><td align="center"><sub><b>giant-chess</b></sub></td><td align="center"><sub><b>ping-pong</b></sub></td></tr>
</table>

**Variants:** `chess`, `double-chess`, `giant-chess`, `ping-pong`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Bird bath <a id="bird-bath"></a>

`createObject('bird-bath', { variant: 'pedestal' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bird-bath-pedestal.webp" width="200" alt="bird-bath pedestal"><br><sub><b>pedestal</b></sub></td><td align="center"><sub><b>tiered</b></sub></td><td align="center"><sub><b>ground</b></sub></td></tr>
</table>

**Variants:** `pedestal`, `tiered`, `ground`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `peck`


### Statue on plinth <a id="statue"></a>

`createObject('statue', { variant: 'figure' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/statue-figure.webp" width="200" alt="statue figure"><br><sub><b>figure</b></sub></td><td align="center"><sub><b>bust</b></sub></td><td align="center"><sub><b>abstract</b></sub></td><td align="center"><sub><b>urn</b></sub></td></tr>
</table>

**Variants:** `figure`, `bust`, `abstract`, `urn`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`


### Memorial <a id="memorial"></a>

`createObject('memorial', { variant: 'obelisk' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/memorial-obelisk.webp" width="200" alt="memorial obelisk"><br><sub><b>obelisk</b></sub></td><td align="center"><sub><b>column</b></sub></td><td align="center"><sub><b>cenotaph</b></sub></td><td align="center"><sub><b>stele</b></sub></td></tr>
</table>

**Variants:** `obelisk`, `column`, `cenotaph`, `stele`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `wave`


### Sundial <a id="sundial"></a>

`createObject('sundial', { variant: 'pedestal' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sundial-pedestal.webp" width="200" alt="sundial pedestal"><br><sub><b>pedestal</b></sub></td><td align="center"><sub><b>armillary</b></sub></td><td align="center"><sub><b>ground</b></sub></td></tr>
</table>

**Variants:** `pedestal`, `armillary`, `ground`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `time`


### Lamp-lined park path <a id="park-path"></a>

`createObject('park-path', { variant: 'straight' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/park-path-straight.webp" width="200" alt="park-path straight"><br><sub><b>straight</b></sub></td><td align="center"><sub><b>curve</b></sub></td><td align="center"><sub><b>crossing</b></sub></td><td align="center"><sub><b>t-junction</b></sub></td></tr>
<tr><td align="center"><sub><b>plaza-end</b></sub></td></tr>
</table>

**Variants:** `straight`, `curve`, `crossing`, `t-junction`, `plaza-end`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`


### Stepping-stone path <a id="stepping-stones"></a>

`createObject('stepping-stones', { variant: 'straight' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/stepping-stones-straight.webp" width="200" alt="stepping-stones straight"><br><sub><b>straight</b></sub></td><td align="center"><sub><b>curved</b></sub></td><td align="center"><sub><b>over-water</b></sub></td><td align="center"><sub><b>in-gravel</b></sub></td></tr>
</table>

**Variants:** `straight`, `curved`, `over-water`, `in-gravel`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Playground piece <a id="playground"></a>

`createObject('playground', { variant: 'swings' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/playground-swings.webp" width="200" alt="playground swings"><br><sub><b>swings</b></sub></td><td align="center"><sub><b>slide</b></sub></td><td align="center"><sub><b>see-saw</b></sub></td><td align="center"><sub><b>sandbox</b></sub></td></tr>
<tr><td align="center"><sub><b>climbing-frame</b></sub></td><td align="center"><sub><b>spring-rider</b></sub></td></tr>
</table>

**Variants:** `swings`, `slide`, `see-saw`, `sandbox`, `climbing-frame`, `spring-rider`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `swing`


### Park scene <a id="park-scene"></a>

`createObject('park-scene', { variant: 'pocket-park' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/park-scene-pocket-park.webp" width="200" alt="park-scene pocket-park"><br><sub><b>pocket-park</b></sub></td><td align="center"><sub><b>picnic-lawn</b></sub></td><td align="center"><sub><b>pond-corner</b></sub></td><td align="center"><sub><b>playground-corner</b></sub></td></tr>
<tr><td align="center"><sub><b>fountain-plaza</b></sub></td><td align="center"><sub><b>garden-corner</b></sub></td></tr>
</table>

**Variants:** `pocket-park`, `picnic-lawn`, `pond-corner`, `playground-corner`, `fountain-plaza`, `garden-corner`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |

**Animations:** `on`


### Campsite <a id="campsite"></a>

`createObject('campsite', { variant: 'dome-tent' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/campsite-dome-tent.webp" width="200" alt="campsite dome-tent"><br><sub><b>dome-tent</b></sub></td><td align="center"><sub><b>ridge-tent</b></sub></td><td align="center"><sub><b>fire-ring</b></sub></td><td align="center"><sub><b>log-seats</b></sub></td></tr>
<tr><td align="center"><sub><b>camp</b></sub></td></tr>
</table>

**Variants:** `dome-tent`, `ridge-tent`, `fire-ring`, `log-seats`, `camp`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Beach set <a id="beach-set"></a>

`createObject('beach-set', { variant: 'umbrella' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/beach-set-umbrella.webp" width="200" alt="beach-set umbrella"><br><sub><b>umbrella</b></sub></td><td align="center"><sub><b>lounger</b></sub></td><td align="center"><sub><b>lifeguard-tower</b></sub></td><td align="center"><sub><b>beach-hut</b></sub></td></tr>
<tr><td align="center"><sub><b>beach</b></sub></td></tr>
</table>

**Variants:** `umbrella`, `lounger`, `lifeguard-tower`, `beach-hut`, `beach`

| Option | Description |
|---|---|
| `color` | roof / accent color |
| `size` | footprint scale |
| `seed` | variation |


### Fountain (HD) <a id="hd-fountain"></a>

`createObject('hd-fountain', { variant: 'two-tier' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>two-tier</b></sub></td><td align="center"><sub><b>three-tier</b></sub></td><td align="center"><sub><b>small-single</b></sub></td></tr>
</table>

**Variants:** `two-tier`, `three-tier`, `small-single`


### Gazebo (HD) <a id="hd-gazebo"></a>

`createObject('hd-gazebo', { variant: 'white-hexagonal' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>white-hexagonal</b></sub></td><td align="center"><sub><b>green-octagonal</b></sub></td></tr>
</table>

**Variants:** `white-hexagonal`, `green-octagonal`

| Option | Description |
|---|---|
| `color` | paint color |


### Pergola (HD) <a id="hd-pergola"></a>

`createObject('hd-pergola', { variant: 'cedar' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>cedar</b></sub></td><td align="center"><sub><b>cedar-vines</b></sub></td><td align="center"><sub><b>dark-wide</b></sub></td></tr>
</table>

**Variants:** `cedar`, `cedar-vines`, `dark-wide`


### Wishing well (HD) <a id="hd-well"></a>

`createObject('hd-well', { variant: 'stone' })` · 1 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>stone</b></sub></td></tr>
</table>

**Variants:** `stone`


## Toys

### Building Blocks <a id="toy-blocks"></a>

`createObject('toy-blocks', { variant: 'brick-pair' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toy-blocks-brick-pair.webp" width="200" alt="toy-blocks brick-pair"><br><sub><b>brick-pair</b></sub></td><td align="center"><img src="images/toy-blocks-tower.webp" width="200" alt="toy-blocks tower"><br><sub><b>tower</b></sub></td><td align="center"><sub><b>wall</b></sub></td><td align="center"><sub><b>little-house</b></sub></td></tr>
<tr><td align="center"><sub><b>brick-pile</b></sub></td><td align="center"><sub><b>alphabet-blocks</b></sub></td><td align="center"><sub><b>arch-bridge</b></sub></td><td align="center"><sub><b>base-plate</b></sub></td></tr>
</table>

**Variants:** `brick-pair`, `tower`, `wall`, `little-house`, `brick-pile`, `alphabet-blocks`, `arch-bridge`, `base-plate`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |


### Wooden Train Set <a id="toy-train"></a>

`createObject('toy-train', { variant: 'engine' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toy-train-engine.webp" width="200" alt="toy-train engine"><br><sub><b>engine</b></sub></td><td align="center"><img src="images/toy-train-freight-set.webp" width="200" alt="toy-train freight-set"><br><sub><b>freight-set</b></sub></td><td align="center"><sub><b>passenger-set</b></sub></td><td align="center"><sub><b>track-loop</b></sub></td></tr>
<tr><td align="center"><sub><b>bridge-set</b></sub></td><td align="center"><sub><b>station</b></sub></td><td align="center"><sub><b>log-hauler</b></sub></td><td align="center"><sub><b>figure-eight</b></sub></td></tr>
</table>

**Variants:** `engine`, `freight-set`, `passenger-set`, `track-loop`, `bridge-set`, `station`, `log-hauler`, `figure-eight`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `drive`


### Baby & Wooden Toy <a id="baby-toy"></a>

`createObject('baby-toy', { variant: 'stacking-rings' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/baby-toy-stacking-rings.webp" width="200" alt="baby-toy stacking-rings"><br><sub><b>stacking-rings</b></sub></td><td align="center"><img src="images/baby-toy-shape-sorter.webp" width="200" alt="baby-toy shape-sorter"><br><sub><b>shape-sorter</b></sub></td><td align="center"><sub><b>rocking-horse</b></sub></td><td align="center"><sub><b>pull-duck</b></sub></td></tr>
<tr><td align="center"><sub><b>xylophone</b></sub></td><td align="center"><sub><b>abacus</b></sub></td><td align="center"><sub><b>bead-maze</b></sub></td></tr>
</table>

**Variants:** `stacking-rings`, `shape-sorter`, `rocking-horse`, `pull-duck`, `xylophone`, `abacus`, `bead-maze`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |


### Plush Animal <a id="plush-toy"></a>

`createObject('plush-toy', { variant: 'bear' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/plush-toy-bear.webp" width="200" alt="plush-toy bear"><br><sub><b>bear</b></sub></td><td align="center"><img src="images/plush-toy-bunny.webp" width="200" alt="plush-toy bunny"><br><sub><b>bunny</b></sub></td><td align="center"><sub><b>cat</b></sub></td><td align="center"><sub><b>dog</b></sub></td></tr>
<tr><td align="center"><sub><b>elephant</b></sub></td><td align="center"><sub><b>penguin</b></sub></td><td align="center"><sub><b>owl</b></sub></td><td align="center"><sub><b>lion</b></sub></td></tr>
</table>

**Variants:** `bear`, `bunny`, `cat`, `dog`, `elephant`, `penguin`, `owl`, `lion`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `wave`


### Doll <a id="toy-doll"></a>

`createObject('toy-doll', { variant: 'girl' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toy-doll-girl.webp" width="200" alt="toy-doll girl"><br><sub><b>girl</b></sub></td><td align="center"><img src="images/toy-doll-boy.webp" width="200" alt="toy-doll boy"><br><sub><b>boy</b></sub></td><td align="center"><sub><b>baby</b></sub></td><td align="center"><sub><b>rag-doll</b></sub></td></tr>
<tr><td align="center"><sub><b>peg-doll</b></sub></td><td align="center"><sub><b>nesting-dolls</b></sub></td><td align="center"><sub><b>fashion-doll</b></sub></td></tr>
</table>

**Variants:** `girl`, `boy`, `baby`, `rag-doll`, `peg-doll`, `nesting-dolls`, `fashion-doll`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `wave`


### Dollhouse <a id="dollhouse"></a>

`createObject('dollhouse', { variant: 'cottage' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dollhouse-cottage.webp" width="200" alt="dollhouse cottage"><br><sub><b>cottage</b></sub></td><td align="center"><img src="images/dollhouse-townhouse.webp" width="200" alt="dollhouse townhouse"><br><sub><b>townhouse</b></sub></td><td align="center"><sub><b>villa</b></sub></td><td align="center"><sub><b>a-frame</b></sub></td></tr>
<tr><td align="center"><sub><b>tower-house</b></sub></td><td align="center"><sub><b>bungalow-cabin</b></sub></td></tr>
</table>

**Variants:** `cottage`, `townhouse`, `villa`, `a-frame`, `tower-house`, `bungalow-cabin`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `open`


### Toy Car & Truck <a id="toy-car"></a>

`createObject('toy-car', { variant: 'sports-car' })` · 12 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toy-car-sports-car.webp" width="200" alt="toy-car sports-car"><br><sub><b>sports-car</b></sub></td><td align="center"><img src="images/toy-car-hatchback.webp" width="200" alt="toy-car hatchback"><br><sub><b>hatchback</b></sub></td><td align="center"><sub><b>police-car</b></sub></td><td align="center"><sub><b>pickup</b></sub></td></tr>
<tr><td align="center"><sub><b>race-car</b></sub></td><td align="center"><sub><b>dump-truck</b></sub></td><td align="center"><sub><b>fire-truck</b></sub></td><td align="center"><sub><b>tow-truck</b></sub></td></tr>
<tr><td align="center"><sub><b>school-bus</b></sub></td><td align="center"><sub><b>monster-truck</b></sub></td><td align="center"><sub><b>cement-mixer</b></sub></td><td align="center"><sub><b>tractor</b></sub></td></tr>
</table>

**Variants:** `sports-car`, `hatchback`, `police-car`, `pickup`, `race-car`, `dump-truck`, `fire-truck`, `tow-truck`, `school-bus`, `monster-truck`, `cement-mixer`, `tractor`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `drive`


### RC Car <a id="rc-car"></a>

`createObject('rc-car', { variant: 'buggy' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rc-car-buggy.webp" width="200" alt="rc-car buggy"><br><sub><b>buggy</b></sub></td><td align="center"><img src="images/rc-car-monster-rc.webp" width="200" alt="rc-car monster-rc"><br><sub><b>monster-rc</b></sub></td><td align="center"><sub><b>drift-car</b></sub></td><td align="center"><sub><b>rock-crawler</b></sub></td></tr>
<tr><td align="center"><sub><b>stunt-car</b></sub></td></tr>
</table>

**Variants:** `buggy`, `monster-rc`, `drift-car`, `rock-crawler`, `stunt-car`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `drive`


### Yo-Yo <a id="yo-yo"></a>

`createObject('yo-yo', { variant: 'imperial' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/yo-yo-imperial.webp" width="200" alt="yo-yo imperial"><br><sub><b>imperial</b></sub></td><td align="center"><img src="images/yo-yo-butterfly.webp" width="200" alt="yo-yo butterfly"><br><sub><b>butterfly</b></sub></td><td align="center"><sub><b>pro-wide</b></sub></td><td align="center"><sub><b>light-up</b></sub></td></tr>
<tr><td align="center"><sub><b>twin-pack</b></sub></td></tr>
</table>

**Variants:** `imperial`, `butterfly`, `pro-wide`, `light-up`, `twin-pack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `spin`


### Spinning Top <a id="spinning-top"></a>

`createObject('spinning-top', { variant: 'peg-top' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/spinning-top-peg-top.webp" width="200" alt="spinning-top peg-top"><br><sub><b>peg-top</b></sub></td><td align="center"><img src="images/spinning-top-humming-top.webp" width="200" alt="spinning-top humming-top"><br><sub><b>humming-top</b></sub></td><td align="center"><sub><b>gyroscope</b></sub></td><td align="center"><sub><b>four-sided</b></sub></td></tr>
<tr><td align="center"><sub><b>battle-top</b></sub></td></tr>
</table>

**Variants:** `peg-top`, `humming-top`, `gyroscope`, `four-sided`, `battle-top`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `spin`, `wobble`


### Jack-in-the-Box <a id="jack-in-the-box"></a>

`createObject('jack-in-the-box', { variant: 'jester' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/jack-in-the-box-jester.webp" width="200" alt="jack-in-the-box jester"><br><sub><b>jester</b></sub></td><td align="center"><img src="images/jack-in-the-box-monkey.webp" width="200" alt="jack-in-the-box monkey"><br><sub><b>monkey</b></sub></td><td align="center"><sub><b>bunny</b></sub></td><td align="center"><sub><b>robot</b></sub></td></tr>
</table>

**Variants:** `jester`, `monkey`, `bunny`, `robot`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `pop`


### Board Game <a id="board-game"></a>

`createObject('board-game', { variant: 'chess-set' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/board-game-chess-set.webp" width="200" alt="board-game chess-set"><br><sub><b>chess-set</b></sub></td><td align="center"><img src="images/board-game-checkers.webp" width="200" alt="board-game checkers"><br><sub><b>checkers</b></sub></td><td align="center"><sub><b>backgammon</b></sub></td><td align="center"><sub><b>race-game</b></sub></td></tr>
<tr><td align="center"><sub><b>cross-and-circle</b></sub></td><td align="center"><sub><b>tic-tac-toe</b></sub></td></tr>
</table>

**Variants:** `chess-set`, `checkers`, `backgammon`, `race-game`, `cross-and-circle`, `tic-tac-toe`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |


### Playing Cards <a id="playing-cards"></a>

`createObject('playing-cards', { variant: 'deck-box' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/playing-cards-deck-box.webp" width="200" alt="playing-cards deck-box"><br><sub><b>deck-box</b></sub></td><td align="center"><img src="images/playing-cards-fanned-hand.webp" width="200" alt="playing-cards fanned-hand"><br><sub><b>fanned-hand</b></sub></td><td align="center"><sub><b>card-house</b></sub></td><td align="center"><sub><b>solitaire</b></sub></td></tr>
<tr><td align="center"><sub><b>poker-night</b></sub></td></tr>
</table>

**Variants:** `deck-box`, `fanned-hand`, `card-house`, `solitaire`, `poker-night`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `open`


### Dice Set <a id="dice-set"></a>

`createObject('dice-set', { variant: 'pair-d6' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dice-set-pair-d6.webp" width="200" alt="dice-set pair-d6"><br><sub><b>pair-d6</b></sub></td><td align="center"><img src="images/dice-set-poker-dice.webp" width="200" alt="dice-set poker-dice"><br><sub><b>poker-dice</b></sub></td><td align="center"><sub><b>polyhedral</b></sub></td><td align="center"><sub><b>giant-foam</b></sub></td></tr>
<tr><td align="center"><sub><b>dice-tray</b></sub></td></tr>
</table>

**Variants:** `pair-d6`, `poker-dice`, `polyhedral`, `giant-foam`, `dice-tray`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |


### Dominoes <a id="dominoes"></a>

`createObject('dominoes', { variant: 'box-set' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dominoes-box-set.webp" width="200" alt="dominoes box-set"><br><sub><b>box-set</b></sub></td><td align="center"><img src="images/dominoes-topple-chain.webp" width="200" alt="dominoes topple-chain"><br><sub><b>topple-chain</b></sub></td><td align="center"><sub><b>game-line</b></sub></td><td align="center"><sub><b>stacked-tower</b></sub></td></tr>
</table>

**Variants:** `box-set`, `topple-chain`, `game-line`, `stacked-tower`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |


### Jigsaw Puzzle <a id="jigsaw-puzzle"></a>

`createObject('jigsaw-puzzle', { variant: 'scattered-pieces' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/jigsaw-puzzle-scattered-pieces.webp" width="200" alt="jigsaw-puzzle scattered-pieces"><br><sub><b>scattered-pieces</b></sub></td><td align="center"><img src="images/jigsaw-puzzle-half-done.webp" width="200" alt="jigsaw-puzzle half-done"><br><sub><b>half-done</b></sub></td><td align="center"><sub><b>floor-puzzle</b></sub></td><td align="center"><sub><b>puzzle-box</b></sub></td></tr>
</table>

**Variants:** `scattered-pieces`, `half-done`, `floor-puzzle`, `puzzle-box`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |


### Twisty Cube Puzzle <a id="puzzle-cube"></a>

`createObject('puzzle-cube', { variant: 'pocket-2x2' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/puzzle-cube-pocket-2x2.webp" width="200" alt="puzzle-cube pocket-2x2"><br><sub><b>pocket-2x2</b></sub></td><td align="center"><img src="images/puzzle-cube-classic-3x3.webp" width="200" alt="puzzle-cube classic-3x3"><br><sub><b>classic-3x3</b></sub></td><td align="center"><sub><b>master-4x4</b></sub></td><td align="center"><sub><b>scrambled-3x3</b></sub></td></tr>
<tr><td align="center"><sub><b>tower-2x2x4</b></sub></td></tr>
</table>

**Variants:** `pocket-2x2`, `classic-3x3`, `master-4x4`, `scrambled-3x3`, `tower-2x2x4`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `twist`


### Arcade Cabinet <a id="arcade-cabinet"></a>

`createObject('arcade-cabinet', { variant: 'upright' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/arcade-cabinet-upright.webp" width="200" alt="arcade-cabinet upright"><br><sub><b>upright</b></sub></td><td align="center"><img src="images/arcade-cabinet-cocktail-table.webp" width="200" alt="arcade-cabinet cocktail-table"><br><sub><b>cocktail-table</b></sub></td><td align="center"><sub><b>bartop</b></sub></td><td align="center"><sub><b>racing-sim</b></sub></td></tr>
</table>

**Variants:** `upright`, `cocktail-table`, `bartop`, `racing-sim`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `play`, `on`


### Pinball Machine <a id="pinball-machine"></a>

`createObject('pinball-machine', { variant: 'classic-pinball' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pinball-machine-classic-pinball.webp" width="200" alt="pinball-machine classic-pinball"><br><sub><b>classic-pinball</b></sub></td><td align="center"><img src="images/pinball-machine-space-pinball.webp" width="200" alt="pinball-machine space-pinball"><br><sub><b>space-pinball</b></sub></td><td align="center"><sub><b>tabletop-pinball</b></sub></td></tr>
</table>

**Variants:** `classic-pinball`, `space-pinball`, `tabletop-pinball`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `on`, `play`


### Claw & Capsule Machine <a id="claw-machine"></a>

`createObject('claw-machine', { variant: 'claw-crane' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/claw-machine-claw-crane.webp" width="200" alt="claw-machine claw-crane"><br><sub><b>claw-crane</b></sub></td><td align="center"><img src="images/claw-machine-mini-claw.webp" width="200" alt="claw-machine mini-claw"><br><sub><b>mini-claw</b></sub></td><td align="center"><sub><b>capsule-vendor</b></sub></td></tr>
</table>

**Variants:** `claw-crane`, `mini-claw`, `capsule-vendor`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `grab`, `on`


### Toy Chest <a id="toy-chest"></a>

`createObject('toy-chest', { variant: 'classic-chest' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toy-chest-classic-chest.webp" width="200" alt="toy-chest classic-chest"><br><sub><b>classic-chest</b></sub></td><td align="center"><img src="images/toy-chest-domed-trunk.webp" width="200" alt="toy-chest domed-trunk"><br><sub><b>domed-trunk</b></sub></td><td align="center"><sub><b>bench-chest</b></sub></td><td align="center"><sub><b>animal-chest</b></sub></td></tr>
</table>

**Variants:** `classic-chest`, `domed-trunk`, `bench-chest`, `animal-chest`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `open`


### Kite <a id="kite"></a>

`createObject('kite', { variant: 'diamond' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kite-diamond.webp" width="200" alt="kite diamond"><br><sub><b>diamond</b></sub></td><td align="center"><img src="images/kite-delta.webp" width="200" alt="kite delta"><br><sub><b>delta</b></sub></td><td align="center"><sub><b>box-kite</b></sub></td><td align="center"><sub><b>sled</b></sub></td></tr>
<tr><td align="center"><sub><b>dragon-tail</b></sub></td><td align="center"><sub><b>bird</b></sub></td></tr>
</table>

**Variants:** `diamond`, `delta`, `box-kite`, `sled`, `dragon-tail`, `bird`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `flutter`


### Balloons <a id="balloons"></a>

`createObject('balloons', { variant: 'single' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/balloons-single.webp" width="200" alt="balloons single"><br><sub><b>single</b></sub></td><td align="center"><sub><b>bunch</b></sub></td><td align="center"><sub><b>heart-foils</b></sub></td><td align="center"><sub><b>star-foils</b></sub></td></tr>
<tr><td align="center"><sub><b>party-cluster</b></sub></td></tr>
</table>

**Variants:** `single`, `bunch`, `heart-foils`, `star-foils`, `party-cluster`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `sway`


### Beach Ball <a id="beach-ball"></a>

`createObject('beach-ball', { variant: 'six-panel' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/beach-ball-six-panel.webp" width="200" alt="beach-ball six-panel"><br><sub><b>six-panel</b></sub></td><td align="center"><sub><b>banded</b></sub></td><td align="center"><sub><b>spotted</b></sub></td></tr>
</table>

**Variants:** `six-panel`, `banded`, `spotted`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `bounce`, `roll`


### Sandbox Toys <a id="sandbox-toys"></a>

`createObject('sandbox-toys', { variant: 'bucket-spade' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sandbox-toys-bucket-spade.webp" width="200" alt="sandbox-toys bucket-spade"><br><sub><b>bucket-spade</b></sub></td><td align="center"><sub><b>mould-set</b></sub></td><td align="center"><sub><b>castle-kit</b></sub></td><td align="center"><sub><b>sieve-rake</b></sub></td></tr>
<tr><td align="center"><sub><b>watering-can</b></sub></td></tr>
</table>

**Variants:** `bucket-spade`, `mould-set`, `castle-kit`, `sieve-rake`, `watering-can`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `swing`


### Bubble Wand <a id="bubble-wand"></a>

`createObject('bubble-wand', { variant: 'bottle-wand' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bubble-wand-bottle-wand.webp" width="200" alt="bubble-wand bottle-wand"><br><sub><b>bottle-wand</b></sub></td><td align="center"><sub><b>giant-wand</b></sub></td><td align="center"><sub><b>multi-ring</b></sub></td></tr>
</table>

**Variants:** `bottle-wand`, `giant-wand`, `multi-ring`

| Option | Description |
|---|---|
| `color` | main colour (base model) |
| `accentColor` | second colour |

**Animations:** `blow`


### Rocking horse (HD) <a id="hd-rocking-horse"></a>

`createObject('hd-rocking-horse', { variant: 'natural-wood' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>natural-wood</b></sub></td><td align="center"><sub><b>painted-white</b></sub></td></tr>
</table>

**Variants:** `natural-wood`, `painted-white`

| Option | Description |
|---|---|
| `color` | paint color |


### Spinning top (HD) <a id="hd-spinning-top"></a>

`createObject('hd-spinning-top', { variant: 'red' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>red</b></sub></td><td align="center"><sub><b>blue</b></sub></td></tr>
</table>

**Variants:** `red`, `blue`

| Option | Description |
|---|---|
| `color` | paint color |


### Teddy bear (HD) <a id="hd-teddy-bear"></a>

`createObject('hd-teddy-bear', { variant: 'brown' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>brown</b></sub></td><td align="center"><sub><b>cream-red-bow</b></sub></td><td align="center"><sub><b>grey-small</b></sub></td></tr>
</table>

**Variants:** `brown`, `cream-red-bow`, `grey-small`

| Option | Description |
|---|---|
| `color` | fur color |


### Toy blocks (HD) <a id="hd-toy-blocks"></a>

`createObject('hd-toy-blocks', { variant: 'abc-stack' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>abc-stack</b></sub></td><td align="center"><sub><b>natural-tower</b></sub></td></tr>
</table>

**Variants:** `abc-stack`, `natural-tower`


## Tools

### Hammer <a id="hammer"></a>

`createObject('hammer', { variant: 'claw' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hammer-claw.webp" width="200" alt="hammer claw"><br><sub><b>claw</b></sub></td><td align="center"><img src="images/hammer-framing.webp" width="200" alt="hammer framing"><br><sub><b>framing</b></sub></td><td align="center"><sub><b>sledge</b></sub></td><td align="center"><sub><b>mallet</b></sub></td></tr>
<tr><td align="center"><sub><b>ball-peen</b></sub></td><td align="center"><sub><b>club</b></sub></td><td align="center"><sub><b>dead-blow</b></sub></td><td align="center"><sub><b>tack</b></sub></td></tr>
<tr><td align="center"><sub><b>brick</b></sub></td></tr>
</table>

**Variants:** `claw`, `framing`, `sledge`, `mallet`, `ball-peen`, `club`, `dead-blow`, `tack`, `brick`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Screwdriver <a id="screwdriver"></a>

`createObject('screwdriver', { variant: 'flathead' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/screwdriver-flathead.webp" width="200" alt="screwdriver flathead"><br><sub><b>flathead</b></sub></td><td align="center"><img src="images/screwdriver-phillips.webp" width="200" alt="screwdriver phillips"><br><sub><b>phillips</b></sub></td><td align="center"><sub><b>stubby</b></sub></td><td align="center"><sub><b>precision</b></sub></td></tr>
<tr><td align="center"><sub><b>bit-driver</b></sub></td><td align="center"><sub><b>nut-driver</b></sub></td></tr>
</table>

**Variants:** `flathead`, `phillips`, `stubby`, `precision`, `bit-driver`, `nut-driver`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Wrench & Spanner <a id="wrench"></a>

`createObject('wrench', { variant: 'open-end' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wrench-open-end.webp" width="200" alt="wrench open-end"><br><sub><b>open-end</b></sub></td><td align="center"><img src="images/wrench-combination.webp" width="200" alt="wrench combination"><br><sub><b>combination</b></sub></td><td align="center"><sub><b>adjustable</b></sub></td><td align="center"><sub><b>pipe</b></sub></td></tr>
<tr><td align="center"><sub><b>ratchet</b></sub></td><td align="center"><sub><b>torque</b></sub></td><td align="center"><sub><b>hex-key</b></sub></td></tr>
</table>

**Variants:** `open-end`, `combination`, `adjustable`, `pipe`, `ratchet`, `torque`, `hex-key`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Pliers <a id="pliers"></a>

`createObject('pliers', { variant: 'combination' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pliers-combination.webp" width="200" alt="pliers combination"><br><sub><b>combination</b></sub></td><td align="center"><img src="images/pliers-needle-nose.webp" width="200" alt="pliers needle-nose"><br><sub><b>needle-nose</b></sub></td><td align="center"><sub><b>slip-joint</b></sub></td><td align="center"><sub><b>locking</b></sub></td></tr>
<tr><td align="center"><sub><b>side-cutter</b></sub></td><td align="center"><sub><b>tongue-groove</b></sub></td></tr>
</table>

**Variants:** `combination`, `needle-nose`, `slip-joint`, `locking`, `side-cutter`, `tongue-groove`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Hand Saw <a id="saw"></a>

`createObject('saw', { variant: 'panel' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/saw-panel.webp" width="200" alt="saw panel"><br><sub><b>panel</b></sub></td><td align="center"><img src="images/saw-back-saw.webp" width="200" alt="saw back-saw"><br><sub><b>back-saw</b></sub></td><td align="center"><sub><b>coping</b></sub></td><td align="center"><sub><b>hacksaw</b></sub></td></tr>
<tr><td align="center"><sub><b>bow-saw</b></sub></td><td align="center"><sub><b>pull-saw</b></sub></td></tr>
</table>

**Variants:** `panel`, `back-saw`, `coping`, `hacksaw`, `bow-saw`, `pull-saw`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Chisel & Plane <a id="chisel"></a>

`createObject('chisel', { variant: 'bevel-chisel' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/chisel-bevel-chisel.webp" width="200" alt="chisel bevel-chisel"><br><sub><b>bevel-chisel</b></sub></td><td align="center"><img src="images/chisel-mortise-chisel.webp" width="200" alt="chisel mortise-chisel"><br><sub><b>mortise-chisel</b></sub></td><td align="center"><sub><b>cold-chisel</b></sub></td><td align="center"><sub><b>gouge</b></sub></td></tr>
<tr><td align="center"><sub><b>block-plane</b></sub></td><td align="center"><sub><b>jack-plane</b></sub></td></tr>
</table>

**Variants:** `bevel-chisel`, `mortise-chisel`, `cold-chisel`, `gouge`, `block-plane`, `jack-plane`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Spirit Level <a id="level"></a>

`createObject('level', { variant: 'torpedo' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/level-torpedo.webp" width="200" alt="level torpedo"><br><sub><b>torpedo</b></sub></td><td align="center"><img src="images/level-box-600.webp" width="200" alt="level box-600"><br><sub><b>box-600</b></sub></td><td align="center"><sub><b>box-1200</b></sub></td><td align="center"><sub><b>i-beam</b></sub></td></tr>
<tr><td align="center"><sub><b>laser</b></sub></td></tr>
</table>

**Variants:** `torpedo`, `box-600`, `box-1200`, `i-beam`, `laser`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Measuring Tool <a id="measuring-tool"></a>

`createObject('measuring-tool', { variant: 'tape-measure' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/measuring-tool-tape-measure.webp" width="200" alt="measuring-tool tape-measure"><br><sub><b>tape-measure</b></sub></td><td align="center"><img src="images/measuring-tool-long-tape.webp" width="200" alt="measuring-tool long-tape"><br><sub><b>long-tape</b></sub></td><td align="center"><sub><b>folding-rule</b></sub></td><td align="center"><sub><b>try-square</b></sub></td></tr>
<tr><td align="center"><sub><b>speed-square</b></sub></td><td align="center"><sub><b>steel-rule</b></sub></td></tr>
</table>

**Variants:** `tape-measure`, `long-tape`, `folding-rule`, `try-square`, `speed-square`, `steel-rule`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `extend`


### Axe & Pick <a id="tool-axe"></a>

`createObject('tool-axe', { variant: 'felling' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tool-axe-felling.webp" width="200" alt="tool-axe felling"><br><sub><b>felling</b></sub></td><td align="center"><img src="images/tool-axe-hatchet.webp" width="200" alt="tool-axe hatchet"><br><sub><b>hatchet</b></sub></td><td align="center"><sub><b>maul</b></sub></td><td align="center"><sub><b>double-bit</b></sub></td></tr>
<tr><td align="center"><sub><b>pickaxe</b></sub></td><td align="center"><sub><b>mattock</b></sub></td></tr>
</table>

**Variants:** `felling`, `hatchet`, `maul`, `double-bit`, `pickaxe`, `mattock`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Drill & Driver <a id="drill"></a>

`createObject('drill', { variant: 'drill' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/drill-drill.webp" width="200" alt="drill drill"><br><sub><b>drill</b></sub></td><td align="center"><img src="images/drill-hammer-drill.webp" width="200" alt="drill hammer-drill"><br><sub><b>hammer-drill</b></sub></td><td align="center"><sub><b>impact-driver</b></sub></td><td align="center"><sub><b>sds-rotary</b></sub></td></tr>
<tr><td align="center"><sub><b>inline-driver</b></sub></td><td align="center"><sub><b>drill-press</b></sub></td></tr>
</table>

**Variants:** `drill`, `hammer-drill`, `impact-driver`, `sds-rotary`, `inline-driver`, `drill-press`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Power Saw <a id="shop-saw"></a>

`createObject('shop-saw', { variant: 'circular' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shop-saw-circular.webp" width="200" alt="shop-saw circular"><br><sub><b>circular</b></sub></td><td align="center"><img src="images/shop-saw-table-saw.webp" width="200" alt="shop-saw table-saw"><br><sub><b>table-saw</b></sub></td><td align="center"><sub><b>miter-saw</b></sub></td><td align="center"><sub><b>jigsaw</b></sub></td></tr>
<tr><td align="center"><sub><b>track-saw</b></sub></td></tr>
</table>

**Variants:** `circular`, `table-saw`, `miter-saw`, `jigsaw`, `track-saw`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Sander & Planer <a id="shop-sander"></a>

`createObject('shop-sander', { variant: 'random-orbit' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shop-sander-random-orbit.webp" width="200" alt="shop-sander random-orbit"><br><sub><b>random-orbit</b></sub></td><td align="center"><img src="images/shop-sander-sheet.webp" width="200" alt="shop-sander sheet"><br><sub><b>sheet</b></sub></td><td align="center"><sub><b>belt</b></sub></td><td align="center"><sub><b>detail</b></sub></td></tr>
<tr><td align="center"><sub><b>planer</b></sub></td></tr>
</table>

**Variants:** `random-orbit`, `sheet`, `belt`, `detail`, `planer`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `sand`


### Grinder & Polisher <a id="shop-grinder"></a>

`createObject('shop-grinder', { variant: 'grinder-115' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shop-grinder-grinder-115.webp" width="200" alt="shop-grinder grinder-115"><br><sub><b>grinder-115</b></sub></td><td align="center"><img src="images/shop-grinder-grinder-230.webp" width="200" alt="shop-grinder grinder-230"><br><sub><b>grinder-230</b></sub></td><td align="center"><sub><b>die-grinder</b></sub></td><td align="center"><sub><b>bench-grinder</b></sub></td></tr>
<tr><td align="center"><sub><b>polisher</b></sub></td></tr>
</table>

**Variants:** `grinder-115`, `grinder-230`, `die-grinder`, `bench-grinder`, `polisher`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Router & Multitool <a id="shop-router"></a>

`createObject('shop-router', { variant: 'router' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shop-router-router.webp" width="200" alt="shop-router router"><br><sub><b>router</b></sub></td><td align="center"><sub><b>trim-router</b></sub></td><td align="center"><sub><b>multitool</b></sub></td><td align="center"><sub><b>rotary-tool</b></sub></td></tr>
</table>

**Variants:** `router`, `trim-router`, `multitool`, `rotary-tool`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Workbench <a id="workbench"></a>

`createObject('workbench', { variant: 'wooden' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/workbench-wooden.webp" width="200" alt="workbench wooden"><br><sub><b>wooden</b></sub></td><td align="center"><sub><b>steel</b></sub></td><td align="center"><sub><b>folding</b></sub></td><td align="center"><sub><b>rolling-cabinet</b></sub></td></tr>
<tr><td align="center"><sub><b>carpenter</b></sub></td></tr>
</table>

**Variants:** `wooden`, `steel`, `folding`, `rolling-cabinet`, `carpenter`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `vise`


### Toolbox <a id="tool-chest"></a>

`createObject('tool-chest', { variant: 'cantilever' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tool-chest-cantilever.webp" width="200" alt="tool-chest cantilever"><br><sub><b>cantilever</b></sub></td><td align="center"><sub><b>plastic-box</b></sub></td><td align="center"><sub><b>tote</b></sub></td><td align="center"><sub><b>chest</b></sub></td></tr>
<tr><td align="center"><sub><b>roller-cabinet</b></sub></td><td align="center"><sub><b>tool-bag</b></sub></td><td align="center"><sub><b>wooden-tote</b></sub></td></tr>
</table>

**Variants:** `cantilever`, `plastic-box`, `tote`, `chest`, `roller-cabinet`, `tool-bag`, `wooden-tote`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Pegboard <a id="pegboard"></a>

`createObject('pegboard', { variant: 'panel' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pegboard-panel.webp" width="200" alt="pegboard panel"><br><sub><b>panel</b></sub></td><td align="center"><sub><b>wide</b></sub></td><td align="center"><sub><b>with-shelf</b></sub></td><td align="center"><sub><b>slatwall</b></sub></td></tr>
<tr><td align="center"><sub><b>mobile</b></sub></td></tr>
</table>

**Variants:** `panel`, `wide`, `with-shelf`, `slatwall`, `mobile`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Vise & Clamp <a id="vise-clamp"></a>

`createObject('vise-clamp', { variant: 'bench-vise' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/vise-clamp-bench-vise.webp" width="200" alt="vise-clamp bench-vise"><br><sub><b>bench-vise</b></sub></td><td align="center"><sub><b>woodwork-vise</b></sub></td><td align="center"><sub><b>machine-vise</b></sub></td><td align="center"><sub><b>c-clamp</b></sub></td></tr>
<tr><td align="center"><sub><b>f-clamp</b></sub></td><td align="center"><sub><b>bar-clamp</b></sub></td></tr>
</table>

**Variants:** `bench-vise`, `woodwork-vise`, `machine-vise`, `c-clamp`, `f-clamp`, `bar-clamp`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Ladder <a id="ladder"></a>

`createObject('ladder', { variant: 'stepladder-3' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ladder-stepladder-3.webp" width="200" alt="ladder stepladder-3"><br><sub><b>stepladder-3</b></sub></td><td align="center"><sub><b>stepladder-6</b></sub></td><td align="center"><sub><b>step-stool</b></sub></td><td align="center"><sub><b>platform</b></sub></td></tr>
<tr><td align="center"><sub><b>extension</b></sub></td></tr>
</table>

**Variants:** `stepladder-3`, `stepladder-6`, `step-stool`, `platform`, `extension`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Sawhorse <a id="sawhorse"></a>

`createObject('sawhorse', { variant: 'wooden' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sawhorse-wooden.webp" width="200" alt="sawhorse wooden"><br><sub><b>wooden</b></sub></td><td align="center"><sub><b>folding-metal</b></sub></td><td align="center"><sub><b>plastic</b></sub></td><td align="center"><sub><b>trestle</b></sub></td></tr>
</table>

**Variants:** `wooden`, `folding-metal`, `plastic`, `trestle`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Air Compressor <a id="air-compressor"></a>

`createObject('air-compressor', { variant: 'pancake' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/air-compressor-pancake.webp" width="200" alt="air-compressor pancake"><br><sub><b>pancake</b></sub></td><td align="center"><sub><b>hotdog</b></sub></td><td align="center"><sub><b>twin-stack</b></sub></td><td align="center"><sub><b>upright</b></sub></td></tr>
</table>

**Variants:** `pancake`, `hotdog`, `twin-stack`, `upright`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Welding & Torch <a id="welding"></a>

`createObject('welding', { variant: 'gas-torch' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/welding-gas-torch.webp" width="200" alt="welding gas-torch"><br><sub><b>gas-torch</b></sub></td><td align="center"><sub><b>mig</b></sub></td><td align="center"><sub><b>stick</b></sub></td><td align="center"><sub><b>plasma</b></sub></td></tr>
<tr><td align="center"><sub><b>blowtorch</b></sub></td></tr>
</table>

**Variants:** `gas-torch`, `mig`, `stick`, `plasma`, `blowtorch`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `flame`


### Garden Tool <a id="garden-tool"></a>

`createObject('garden-tool', { variant: 'spade' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-tool-spade.webp" width="200" alt="garden-tool spade"><br><sub><b>spade</b></sub></td><td align="center"><sub><b>shovel</b></sub></td><td align="center"><sub><b>fork</b></sub></td><td align="center"><sub><b>rake</b></sub></td></tr>
<tr><td align="center"><sub><b>leaf-rake</b></sub></td><td align="center"><sub><b>hoe</b></sub></td><td align="center"><sub><b>broom</b></sub></td></tr>
</table>

**Variants:** `spade`, `shovel`, `fork`, `rake`, `leaf-rake`, `hoe`, `broom`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Garden Hand Tool <a id="garden-hand-tool"></a>

`createObject('garden-hand-tool', { variant: 'trowel' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-hand-tool-trowel.webp" width="200" alt="garden-hand-tool trowel"><br><sub><b>trowel</b></sub></td><td align="center"><sub><b>hand-fork</b></sub></td><td align="center"><sub><b>cultivator</b></sub></td><td align="center"><sub><b>dibber</b></sub></td></tr>
<tr><td align="center"><sub><b>weeder</b></sub></td><td align="center"><sub><b>bulb-planter</b></sub></td></tr>
</table>

**Variants:** `trowel`, `hand-fork`, `cultivator`, `dibber`, `weeder`, `bulb-planter`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Wheelbarrow & Cart <a id="garden-wheelbarrow"></a>

`createObject('garden-wheelbarrow', { variant: 'builder' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-wheelbarrow-builder.webp" width="200" alt="garden-wheelbarrow builder"><br><sub><b>builder</b></sub></td><td align="center"><sub><b>garden</b></sub></td><td align="center"><sub><b>twin-wheel</b></sub></td><td align="center"><sub><b>cart</b></sub></td></tr>
</table>

**Variants:** `builder`, `garden`, `twin-wheel`, `cart`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `roll`


### Watering Can <a id="garden-watering-can"></a>

`createObject('garden-watering-can', { variant: 'classic' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-watering-can-classic.webp" width="200" alt="garden-watering-can classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>plastic</b></sub></td><td align="center"><sub><b>french</b></sub></td><td align="center"><sub><b>indoor</b></sub></td></tr>
</table>

**Variants:** `classic`, `plastic`, `french`, `indoor`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Shears & Pruners <a id="garden-shears"></a>

`createObject('garden-shears', { variant: 'hedge-shears' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-shears-hedge-shears.webp" width="200" alt="garden-shears hedge-shears"><br><sub><b>hedge-shears</b></sub></td><td align="center"><sub><b>pruners</b></sub></td><td align="center"><sub><b>loppers</b></sub></td><td align="center"><sub><b>grass-shears</b></sub></td></tr>
</table>

**Variants:** `hedge-shears`, `pruners`, `loppers`, `grass-shears`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Lawn Mower <a id="lawn-mower"></a>

`createObject('lawn-mower', { variant: 'push-rotary' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lawn-mower-push-rotary.webp" width="200" alt="lawn-mower push-rotary"><br><sub><b>push-rotary</b></sub></td><td align="center"><sub><b>electric</b></sub></td><td align="center"><sub><b>reel</b></sub></td><td align="center"><sub><b>ride-on</b></sub></td></tr>
<tr><td align="center"><sub><b>robot</b></sub></td></tr>
</table>

**Variants:** `push-rotary`, `electric`, `reel`, `ride-on`, `robot`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `roll`


### Drum & Barrel <a id="industrial-barrel"></a>

`createObject('industrial-barrel', { variant: 'steel-drum' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/industrial-barrel-steel-drum.webp" width="200" alt="industrial-barrel steel-drum"><br><sub><b>steel-drum</b></sub></td><td align="center"><sub><b>plastic-drum</b></sub></td><td align="center"><sub><b>wooden</b></sub></td><td align="center"><sub><b>open-top</b></sub></td></tr>
<tr><td align="center"><sub><b>ibc-tote</b></sub></td></tr>
</table>

**Variants:** `steel-drum`, `plastic-drum`, `wooden`, `open-top`, `ibc-tote`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Crate & Pallet <a id="industrial-crate"></a>

`createObject('industrial-crate', { variant: 'wooden-slat' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/industrial-crate-wooden-slat.webp" width="200" alt="industrial-crate wooden-slat"><br><sub><b>wooden-slat</b></sub></td><td align="center"><sub><b>plywood</b></sub></td><td align="center"><sub><b>plastic</b></sub></td><td align="center"><sub><b>pallet</b></sub></td></tr>
<tr><td align="center"><sub><b>wire-cage</b></sub></td></tr>
</table>

**Variants:** `wooden-slat`, `plywood`, `plastic`, `pallet`, `wire-cage`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Pipe Section <a id="industrial-pipe"></a>

`createObject('industrial-pipe', { variant: 'straight' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/industrial-pipe-straight.webp" width="200" alt="industrial-pipe straight"><br><sub><b>straight</b></sub></td><td align="center"><sub><b>elbow</b></sub></td><td align="center"><sub><b>tee</b></sub></td><td align="center"><sub><b>manifold</b></sub></td></tr>
<tr><td align="center"><sub><b>reducer</b></sub></td></tr>
</table>

**Variants:** `straight`, `elbow`, `tee`, `manifold`, `reducer`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Valve <a id="industrial-valve"></a>

`createObject('industrial-valve', { variant: 'gate' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/industrial-valve-gate.webp" width="200" alt="industrial-valve gate"><br><sub><b>gate</b></sub></td><td align="center"><sub><b>ball</b></sub></td><td align="center"><sub><b>butterfly</b></sub></td><td align="center"><sub><b>globe</b></sub></td></tr>
</table>

**Variants:** `gate`, `ball`, `butterfly`, `globe`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `turn`


### Gears & Drives <a id="industrial-gear"></a>

`createObject('industrial-gear', { variant: 'spur' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/industrial-gear-spur.webp" width="200" alt="industrial-gear spur"><br><sub><b>spur</b></sub></td><td align="center"><sub><b>bevel-pair</b></sub></td><td align="center"><sub><b>worm</b></sub></td><td align="center"><sub><b>rack-pinion</b></sub></td></tr>
<tr><td align="center"><sub><b>gear-train</b></sub></td><td align="center"><sub><b>sprocket-chain</b></sub></td></tr>
</table>

**Variants:** `spur`, `bevel-pair`, `worm`, `rack-pinion`, `gear-train`, `sprocket-chain`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Conveyor <a id="conveyor"></a>

`createObject('conveyor', { variant: 'belt' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/conveyor-belt.webp" width="200" alt="conveyor belt"><br><sub><b>belt</b></sub></td><td align="center"><sub><b>roller</b></sub></td><td align="center"><sub><b>incline</b></sub></td></tr>
</table>

**Variants:** `belt`, `roller`, `incline`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `run`, `on`


### Generator <a id="generator"></a>

`createObject('generator', { variant: 'portable' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/generator-portable.webp" width="200" alt="generator portable"><br><sub><b>portable</b></sub></td><td align="center"><sub><b>inverter</b></sub></td><td align="center"><sub><b>diesel</b></sub></td></tr>
</table>

**Variants:** `portable`, `inverter`, `diesel`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`, `run`


### Hammer (HD) <a id="hd-hammer"></a>

`createObject('hd-hammer', { variant: 'claw-wood' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>claw-wood</b></sub></td><td align="center"><sub><b>claw-rubber-grip</b></sub></td><td align="center"><sub><b>rubber-mallet</b></sub></td></tr>
</table>

**Variants:** `claw-wood`, `claw-rubber-grip`, `rubber-mallet`


### Screwdriver (HD) <a id="hd-screwdriver"></a>

`createObject('hd-screwdriver', { variant: 'flat-yellow' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>flat-yellow</b></sub></td><td align="center"><sub><b>phillips-red</b></sub></td></tr>
</table>

**Variants:** `flat-yellow`, `phillips-red`

| Option | Description |
|---|---|
| `color` | handle color |


### Toolbox (HD) <a id="hd-toolbox"></a>

`createObject('hd-toolbox', { variant: 'red' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>red</b></sub></td><td align="center"><sub><b>blue-worn</b></sub></td><td align="center"><sub><b>black</b></sub></td></tr>
</table>

**Variants:** `red`, `blue-worn`, `black`

| Option | Description |
|---|---|
| `color` | paint color |


### Wrench (HD) <a id="hd-wrench"></a>

`createObject('hd-wrench', { variant: 'combination' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>combination</b></sub></td><td align="center"><sub><b>large-combination</b></sub></td></tr>
</table>

**Variants:** `combination`, `large-combination`


## Military

### Military tent <a id="military-tent"></a>

`createObject('military-tent', { variant: 'dome' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/military-tent-dome.webp" width="200" alt="military-tent dome"><br><sub><b>dome</b></sub></td><td align="center"><img src="images/military-tent-a-frame.webp" width="200" alt="military-tent a-frame"><br><sub><b>a-frame</b></sub></td><td align="center"><sub><b>command</b></sub></td><td align="center"><sub><b>field-hospital</b></sub></td></tr>
<tr><td align="center"><sub><b>arched-shelter</b></sub></td></tr>
</table>

**Variants:** `dome`, `a-frame`, `command`, `field-hospital`, `arched-shelter`

**Animations:** `wind`


### Camouflage netting <a id="camo-net"></a>

`createObject('camo-net', { variant: 'vehicle-hide' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/camo-net-vehicle-hide.webp" width="200" alt="camo-net vehicle-hide"><br><sub><b>vehicle-hide</b></sub></td><td align="center"><img src="images/camo-net-shelter.webp" width="200" alt="camo-net shelter"><br><sub><b>shelter</b></sub></td><td align="center"><sub><b>small-hide</b></sub></td><td align="center"><sub><b>wall-screen</b></sub></td></tr>
</table>

**Variants:** `vehicle-hide`, `shelter`, `small-hide`, `wall-screen`


### Sandbag wall <a id="sandbag-wall"></a>

`createObject('sandbag-wall', { variant: 'straight' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sandbag-wall-straight.webp" width="200" alt="sandbag-wall straight"><br><sub><b>straight</b></sub></td><td align="center"><img src="images/sandbag-wall-curved.webp" width="200" alt="sandbag-wall curved"><br><sub><b>curved</b></sub></td><td align="center"><sub><b>corner</b></sub></td><td align="center"><sub><b>bunker</b></sub></td></tr>
<tr><td align="center"><sub><b>ring</b></sub></td><td align="center"><sub><b>pillbox</b></sub></td></tr>
</table>

**Variants:** `straight`, `curved`, `corner`, `bunker`, `ring`, `pillbox`


### Hesco barrier <a id="hesco-barrier"></a>

`createObject('hesco-barrier', { variant: 'single' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/hesco-barrier-single.webp" width="200" alt="hesco-barrier single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/hesco-barrier-row.webp" width="200" alt="hesco-barrier row"><br><sub><b>row</b></sub></td><td align="center"><sub><b>double-stack</b></sub></td><td align="center"><sub><b>corner</b></sub></td></tr>
<tr><td align="center"><sub><b>gate-flank</b></sub></td></tr>
</table>

**Variants:** `single`, `row`, `double-stack`, `corner`, `gate-flank`


### Military crate <a id="military-crate"></a>

`createObject('military-crate', { variant: 'ammo-box' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/military-crate-ammo-box.webp" width="200" alt="military-crate ammo-box"><br><sub><b>ammo-box</b></sub></td><td align="center"><img src="images/military-crate-supply-crate.webp" width="200" alt="military-crate supply-crate"><br><sub><b>supply-crate</b></sub></td><td align="center"><sub><b>long-crate</b></sub></td><td align="center"><sub><b>medical-crate</b></sub></td></tr>
<tr><td align="center"><sub><b>ration-stack</b></sub></td><td align="center"><sub><b>hard-case</b></sub></td></tr>
</table>

**Variants:** `ammo-box`, `supply-crate`, `long-crate`, `medical-crate`, `ration-stack`, `hard-case`

**Animations:** `lidOpen`


### Jerry can <a id="jerry-can"></a>

`createObject('jerry-can', { variant: 'single' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/jerry-can-single.webp" width="200" alt="jerry-can single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/jerry-can-pair.webp" width="200" alt="jerry-can pair"><br><sub><b>pair</b></sub></td><td align="center"><sub><b>rack</b></sub></td><td align="center"><sub><b>pallet</b></sub></td></tr>
</table>

**Variants:** `single`, `pair`, `rack`, `pallet`


### Oil drum <a id="oil-drum"></a>

`createObject('oil-drum', { variant: 'single' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/oil-drum-single.webp" width="200" alt="oil-drum single"><br><sub><b>single</b></sub></td><td align="center"><img src="images/oil-drum-pallet.webp" width="200" alt="oil-drum pallet"><br><sub><b>pallet</b></sub></td><td align="center"><sub><b>stack</b></sub></td><td align="center"><sub><b>tipped</b></sub></td></tr>
</table>

**Variants:** `single`, `pallet`, `stack`, `tipped`


### Field radio <a id="field-radio"></a>

`createObject('field-radio', { variant: 'manpack' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/field-radio-manpack.webp" width="200" alt="field-radio manpack"><br><sub><b>manpack</b></sub></td><td align="center"><img src="images/field-radio-desk-set.webp" width="200" alt="field-radio desk-set"><br><sub><b>desk-set</b></sub></td><td align="center"><sub><b>field-telephone</b></sub></td><td align="center"><sub><b>antenna-mast</b></sub></td></tr>
</table>

**Variants:** `manpack`, `desk-set`, `field-telephone`, `antenna-mast`

**Animations:** `on`


### Field generator <a id="field-generator"></a>

`createObject('field-generator', { variant: 'portable' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/field-generator-portable.webp" width="200" alt="field-generator portable"><br><sub><b>portable</b></sub></td><td align="center"><img src="images/field-generator-skid.webp" width="200" alt="field-generator skid"><br><sub><b>skid</b></sub></td><td align="center"><sub><b>trailer</b></sub></td></tr>
</table>

**Variants:** `portable`, `skid`, `trailer`

**Animations:** `running`


### Watch tower <a id="watch-tower"></a>

`createObject('watch-tower', { variant: 'wooden' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/watch-tower-wooden.webp" width="200" alt="watch-tower wooden"><br><sub><b>wooden</b></sub></td><td align="center"><img src="images/watch-tower-steel.webp" width="200" alt="watch-tower steel"><br><sub><b>steel</b></sub></td><td align="center"><sub><b>sandbag-base</b></sub></td><td align="center"><sub><b>scaffold</b></sub></td></tr>
</table>

**Variants:** `wooden`, `steel`, `sandbag-base`, `scaffold`

**Animations:** `sweep`


### Barrier & gate <a id="barrier-gate"></a>

`createObject('barrier-gate', { variant: 'boom-gate' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/barrier-gate-boom-gate.webp" width="200" alt="barrier-gate boom-gate"><br><sub><b>boom-gate</b></sub></td><td align="center"><img src="images/barrier-gate-checkpoint.webp" width="200" alt="barrier-gate checkpoint"><br><sub><b>checkpoint</b></sub></td><td align="center"><sub><b>czech-hedgehog</b></sub></td><td align="center"><sub><b>t-wall</b></sub></td></tr>
<tr><td align="center"><sub><b>dragons-teeth</b></sub></td><td align="center"><sub><b>jersey-barrier</b></sub></td></tr>
</table>

**Variants:** `boom-gate`, `checkpoint`, `czech-hedgehog`, `t-wall`, `dragons-teeth`, `jersey-barrier`

**Animations:** `open`


### Barbed wire <a id="barbed-wire"></a>

`createObject('barbed-wire', { variant: 'concertina' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/barbed-wire-concertina.webp" width="200" alt="barbed-wire concertina"><br><sub><b>concertina</b></sub></td><td align="center"><img src="images/barbed-wire-triple-concertina.webp" width="200" alt="barbed-wire triple-concertina"><br><sub><b>triple-concertina</b></sub></td><td align="center"><sub><b>picket-fence</b></sub></td><td align="center"><sub><b>knife-rest</b></sub></td></tr>
</table>

**Variants:** `concertina`, `triple-concertina`, `picket-fence`, `knife-rest`


### First-aid station <a id="first-aid-station"></a>

`createObject('first-aid-station', { variant: 'stretcher-stand' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/first-aid-station-stretcher-stand.webp" width="200" alt="first-aid-station stretcher-stand"><br><sub><b>stretcher-stand</b></sub></td><td align="center"><img src="images/first-aid-station-aid-tent.webp" width="200" alt="first-aid-station aid-tent"><br><sub><b>aid-tent</b></sub></td><td align="center"><sub><b>medical-cabinet</b></sub></td><td align="center"><sub><b>triage-post</b></sub></td></tr>
</table>

**Variants:** `stretcher-stand`, `aid-tent`, `medical-cabinet`, `triage-post`


### Sword <a id="sword"></a>

`createObject('sword', { variant: 'longsword' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/sword-longsword.webp" width="200" alt="sword longsword"><br><sub><b>longsword</b></sub></td><td align="center"><img src="images/sword-arming-sword.webp" width="200" alt="sword arming-sword"><br><sub><b>arming-sword</b></sub></td><td align="center"><sub><b>claymore</b></sub></td><td align="center"><sub><b>katana</b></sub></td></tr>
<tr><td align="center"><sub><b>sabre</b></sub></td><td align="center"><sub><b>gladius</b></sub></td><td align="center"><sub><b>rapier</b></sub></td><td align="center"><sub><b>scimitar</b></sub></td></tr>
<tr><td align="center"><sub><b>falchion</b></sub></td></tr>
</table>

**Variants:** `longsword`, `arming-sword`, `claymore`, `katana`, `sabre`, `gladius`, `rapier`, `scimitar`, `falchion`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `inspect`


### Dagger <a id="dagger"></a>

`createObject('dagger', { variant: 'dirk' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/dagger-dirk.webp" width="200" alt="dagger dirk"><br><sub><b>dirk</b></sub></td><td align="center"><img src="images/dagger-stiletto.webp" width="200" alt="dagger stiletto"><br><sub><b>stiletto</b></sub></td><td align="center"><sub><b>kris</b></sub></td><td align="center"><sub><b>seax</b></sub></td></tr>
<tr><td align="center"><sub><b>tanto</b></sub></td><td align="center"><sub><b>rondel</b></sub></td></tr>
</table>

**Variants:** `dirk`, `stiletto`, `kris`, `seax`, `tanto`, `rondel`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `inspect`


### Axe <a id="axe"></a>

`createObject('axe', { variant: 'battle-axe' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/axe-battle-axe.webp" width="200" alt="axe battle-axe"><br><sub><b>battle-axe</b></sub></td><td align="center"><img src="images/axe-viking-axe.webp" width="200" alt="axe viking-axe"><br><sub><b>viking-axe</b></sub></td><td align="center"><sub><b>dane-axe</b></sub></td><td align="center"><sub><b>labrys</b></sub></td></tr>
<tr><td align="center"><sub><b>tomahawk</b></sub></td><td align="center"><sub><b>francisca</b></sub></td></tr>
</table>

**Variants:** `battle-axe`, `viking-axe`, `dane-axe`, `labrys`, `tomahawk`, `francisca`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `inspect`


### Mace & war hammer <a id="mace"></a>

`createObject('mace', { variant: 'flanged-mace' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mace-flanged-mace.webp" width="200" alt="mace flanged-mace"><br><sub><b>flanged-mace</b></sub></td><td align="center"><img src="images/mace-morning-star.webp" width="200" alt="mace morning-star"><br><sub><b>morning-star</b></sub></td><td align="center"><sub><b>war-hammer</b></sub></td><td align="center"><sub><b>maul</b></sub></td></tr>
<tr><td align="center"><sub><b>studded-club</b></sub></td><td align="center"><sub><b>flail</b></sub></td></tr>
</table>

**Variants:** `flanged-mace`, `morning-star`, `war-hammer`, `maul`, `studded-club`, `flail`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `inspect`


### Polearm <a id="polearm"></a>

`createObject('polearm', { variant: 'spear' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/polearm-spear.webp" width="200" alt="polearm spear"><br><sub><b>spear</b></sub></td><td align="center"><img src="images/polearm-halberd.webp" width="200" alt="polearm halberd"><br><sub><b>halberd</b></sub></td><td align="center"><sub><b>glaive</b></sub></td><td align="center"><sub><b>pike</b></sub></td></tr>
<tr><td align="center"><sub><b>trident</b></sub></td><td align="center"><sub><b>naginata</b></sub></td><td align="center"><sub><b>partisan</b></sub></td><td align="center"><sub><b>bardiche</b></sub></td></tr>
</table>

**Variants:** `spear`, `halberd`, `glaive`, `pike`, `trident`, `naginata`, `partisan`, `bardiche`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `inspect`


### Shield <a id="shield"></a>

`createObject('shield', { variant: 'round-viking' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shield-round-viking.webp" width="200" alt="shield round-viking"><br><sub><b>round-viking</b></sub></td><td align="center"><sub><b>kite</b></sub></td><td align="center"><sub><b>heater</b></sub></td><td align="center"><sub><b>scutum</b></sub></td></tr>
<tr><td align="center"><sub><b>buckler</b></sub></td><td align="center"><sub><b>hoplite</b></sub></td><td align="center"><sub><b>pavise</b></sub></td><td align="center"><sub><b>targe</b></sub></td></tr>
</table>

**Variants:** `round-viking`, `kite`, `heater`, `scutum`, `buckler`, `hoplite`, `pavise`, `targe`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `inspect`


### Helmet <a id="helmet"></a>

`createObject('helmet', { variant: 'viking' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/helmet-viking.webp" width="200" alt="helmet viking"><br><sub><b>viking</b></sub></td><td align="center"><sub><b>roman</b></sub></td><td align="center"><sub><b>great-helm</b></sub></td><td align="center"><sub><b>kabuto</b></sub></td></tr>
<tr><td align="center"><sub><b>corinthian</b></sub></td><td align="center"><sub><b>sallet</b></sub></td><td align="center"><sub><b>bascinet</b></sub></td><td align="center"><sub><b>barbute</b></sub></td></tr>
<tr><td align="center"><sub><b>morion</b></sub></td></tr>
</table>

**Variants:** `viking`, `roman`, `great-helm`, `kabuto`, `corinthian`, `sallet`, `bascinet`, `barbute`, `morion`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `turn`


### Suit of armour <a id="armour-suit"></a>

`createObject('armour-suit', { variant: 'gothic' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/armour-suit-gothic.webp" width="200" alt="armour-suit gothic"><br><sub><b>gothic</b></sub></td><td align="center"><sub><b>maximilian</b></sub></td><td align="center"><sub><b>samurai</b></sub></td><td align="center"><sub><b>roman</b></sub></td></tr>
<tr><td align="center"><sub><b>chainmail</b></sub></td><td align="center"><sub><b>viking</b></sub></td></tr>
</table>

**Variants:** `gothic`, `maximilian`, `samurai`, `roman`, `chainmail`, `viking`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `turn`


### Weapon rack <a id="weapon-rack"></a>

`createObject('weapon-rack', { variant: 'sword-rack' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/weapon-rack-sword-rack.webp" width="200" alt="weapon-rack sword-rack"><br><sub><b>sword-rack</b></sub></td><td align="center"><sub><b>spear-rack</b></sub></td><td align="center"><sub><b>barrel-rack</b></sub></td><td align="center"><sub><b>armoury-wall</b></sub></td></tr>
<tr><td align="center"><sub><b>shield-rack</b></sub></td></tr>
</table>

**Variants:** `sword-rack`, `spear-rack`, `barrel-rack`, `armoury-wall`, `shield-rack`

| Option | Description |
|---|---|
| `stand` | boolean |


### Training dummy <a id="training-dummy"></a>

`createObject('training-dummy', { variant: 'straw' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/training-dummy-straw.webp" width="200" alt="training-dummy straw"><br><sub><b>straw</b></sub></td><td align="center"><sub><b>wooden-pell</b></sub></td><td align="center"><sub><b>quintain</b></sub></td><td align="center"><sub><b>wing-chun</b></sub></td></tr>
<tr><td align="center"><sub><b>archery-target</b></sub></td></tr>
</table>

**Variants:** `straw`, `wooden-pell`, `quintain`, `wing-chun`, `archery-target`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `hit`


### Bow <a id="bow"></a>

`createObject('bow', { variant: 'longbow' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bow-longbow.webp" width="200" alt="bow longbow"><br><sub><b>longbow</b></sub></td><td align="center"><sub><b>recurve</b></sub></td><td align="center"><sub><b>horse-bow</b></sub></td><td align="center"><sub><b>yumi</b></sub></td></tr>
<tr><td align="center"><sub><b>flatbow</b></sub></td></tr>
</table>

**Variants:** `longbow`, `recurve`, `horse-bow`, `yumi`, `flatbow`

| Option | Description |
|---|---|
| `stand` | boolean |

**Animations:** `inspect`


### Tank <a id="tank"></a>

`createObject('tank', { variant: 'mbt' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tank-mbt.webp" width="200" alt="tank mbt"><br><sub><b>mbt</b></sub></td><td align="center"><sub><b>mbt-cast</b></sub></td><td align="center"><sub><b>light-tank</b></sub></td></tr>
</table>

**Variants:** `mbt`, `mbt-cast`, `light-tank`

| Option | Description |
|---|---|
| `color` | base paint colour (overrides camouflage) |

**Animations:** `drive`, `reverse`, `turnLeft`, `turnRight`, `turretTraverse`, `barrelElevate`, `lights`, `hazards`, `leftSignal`, `rightSignal`


### Armoured personnel carrier <a id="apc"></a>

`createObject('apc', { variant: 'tracked' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/apc-tracked.webp" width="200" alt="apc tracked"><br><sub><b>tracked</b></sub></td><td align="center"><sub><b>wheeled-8x8</b></sub></td><td align="center"><sub><b>wheeled-6x6</b></sub></td><td align="center"><sub><b>mrap</b></sub></td></tr>
<tr><td align="center"><sub><b>mrap-6x6</b></sub></td></tr>
</table>

**Variants:** `tracked`, `wheeled-8x8`, `wheeled-6x6`, `mrap`, `mrap-6x6`

| Option | Description |
|---|---|
| `color` | base paint colour (overrides camouflage) |

**Animations:** `drive`, `reverse`, `turnLeft`, `turnRight`, `ramp`, `lights`


### Military truck <a id="military-truck"></a>

`createObject('military-truck', { variant: 'cargo' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/military-truck-cargo.webp" width="200" alt="military-truck cargo"><br><sub><b>cargo</b></sub></td><td align="center"><sub><b>fuel-tanker</b></sub></td><td align="center"><sub><b>recovery</b></sub></td><td align="center"><sub><b>ambulance</b></sub></td></tr>
</table>

**Variants:** `cargo`, `fuel-tanker`, `recovery`, `ambulance`

| Option | Description |
|---|---|
| `color` | base paint colour (overrides camouflage) |

**Animations:** `tailgate`, `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `hazards`, `leftSignal`, `rightSignal`, `lights`


### Military utility 4x4 <a id="utility-4x4"></a>

`createObject('utility-4x4', { variant: 'jeep' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/utility-4x4-jeep.webp" width="200" alt="utility-4x4 jeep"><br><sub><b>jeep</b></sub></td><td align="center"><sub><b>utility</b></sub></td><td align="center"><sub><b>pickup</b></sub></td></tr>
</table>

**Variants:** `jeep`, `utility`, `pickup`

| Option | Description |
|---|---|
| `color` | base paint colour (overrides camouflage) |

**Animations:** `drive`, `reverse`, `steer`, `steerLeft`, `steerRight`, `lights`


### Bridge layer <a id="bridge-layer"></a>

`createObject('bridge-layer', { variant: 'tracked' })` · 2 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bridge-layer-tracked.webp" width="200" alt="bridge-layer tracked"><br><sub><b>tracked</b></sub></td><td align="center"><sub><b>wheeled</b></sub></td></tr>
</table>

**Variants:** `tracked`, `wheeled`

| Option | Description |
|---|---|
| `color` | base paint colour (overrides camouflage) |

**Animations:** `drive`, `reverse`, `turnLeft`, `turnRight`, `deploy`, `lights`, `hazards`, `leftSignal`, `rightSignal`


### Field radar trailer <a id="radar-trailer"></a>

`createObject('radar-trailer', { variant: 'rotating-array' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/radar-trailer-rotating-array.webp" width="200" alt="radar-trailer rotating-array"><br><sub><b>rotating-array</b></sub></td><td align="center"><sub><b>dish</b></sub></td><td align="center"><sub><b>mast</b></sub></td></tr>
</table>

**Variants:** `rotating-array`, `dish`, `mast`

| Option | Description |
|---|---|
| `color` | base paint colour (overrides camouflage) |

**Animations:** `screen`, `scan`, `drive`, `reverse`, `lights`


### Supply crate (HD) <a id="hd-ammo-crate"></a>

`createObject('hd-ammo-crate', { variant: 'olive' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>olive</b></sub></td><td align="center"><sub><b>sand</b></sub></td></tr>
</table>

**Variants:** `olive`, `sand`

| Option | Description |
|---|---|
| `color` | paint color |


### Helmet on stand (HD) <a id="hd-helmet"></a>

`createObject('hd-helmet', { variant: 'knight-steel' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>knight-steel</b></sub></td><td align="center"><sub><b>field-olive</b></sub></td><td align="center"><sub><b>field-sand</b></sub></td></tr>
</table>

**Variants:** `knight-steel`, `field-olive`, `field-sand`

| Option | Description |
|---|---|
| `color` | paint color |


### Shield on stand (HD) <a id="hd-shield"></a>

`createObject('hd-shield', { variant: 'viking-red' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>viking-red</b></sub></td><td align="center"><sub><b>viking-blue</b></sub></td><td align="center"><sub><b>heater-blue-gold</b></sub></td></tr>
</table>

**Variants:** `viking-red`, `viking-blue`, `heater-blue-gold`

| Option | Description |
|---|---|
| `color` | paint color |


### Sword on display (HD) <a id="hd-sword-display"></a>

`createObject('hd-sword-display', { variant: 'longsword' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>longsword</b></sub></td><td align="center"><sub><b>arming-sword</b></sub></td></tr>
</table>

**Variants:** `longsword`, `arming-sword`


## Items

### Bean Bag <a id="bean-bag"></a>

`createObject('bean-bag', { variant: 'classic' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bean-bag-classic.webp" width="200" alt="bean-bag classic"><br><sub><b>classic</b></sub></td><td align="center"><sub><b>lounger</b></sub></td><td align="center"><sub><b>pouf</b></sub></td><td align="center"><sub><b>kids-bean-bag</b></sub></td></tr>
<tr><td align="center"><sub><b>gaming-chair</b></sub></td></tr>
</table>

**Variants:** `classic`, `lounger`, `pouf`, `kids-bean-bag`, `gaming-chair`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Pillow & Cushion <a id="pillow"></a>

`createObject('pillow', { variant: 'bed-pillow' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pillow-bed-pillow.webp" width="200" alt="pillow bed-pillow"><br><sub><b>bed-pillow</b></sub></td><td align="center"><sub><b>throw-pillow</b></sub></td><td align="center"><sub><b>round-cushion</b></sub></td><td align="center"><sub><b>bolster</b></sub></td></tr>
<tr><td align="center"><sub><b>floor-cushion</b></sub></td><td align="center"><sub><b>neck-pillow</b></sub></td></tr>
</table>

**Variants:** `bed-pillow`, `throw-pillow`, `round-cushion`, `bolster`, `floor-cushion`, `neck-pillow`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Blanket & Quilt <a id="blanket"></a>

`createObject('blanket', { variant: 'folded-blanket' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/blanket-folded-blanket.webp" width="200" alt="blanket folded-blanket"><br><sub><b>folded-blanket</b></sub></td><td align="center"><sub><b>rolled-blanket</b></sub></td><td align="center"><sub><b>quilt</b></sub></td><td align="center"><sub><b>throw-blanket</b></sub></td></tr>
</table>

**Variants:** `folded-blanket`, `rolled-blanket`, `quilt`, `throw-blanket`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Towel <a id="towel"></a>

`createObject('towel', { variant: 'bath-towel' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/towel-bath-towel.webp" width="200" alt="towel bath-towel"><br><sub><b>bath-towel</b></sub></td><td align="center"><sub><b>hand-towel</b></sub></td><td align="center"><sub><b>rolled-towels</b></sub></td><td align="center"><sub><b>towel-stack</b></sub></td></tr>
<tr><td align="center"><sub><b>towel-rack</b></sub></td></tr>
</table>

**Variants:** `bath-towel`, `hand-towel`, `rolled-towels`, `towel-stack`, `towel-rack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Laundry <a id="laundry"></a>

`createObject('laundry', { variant: 'laundry-basket' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/laundry-laundry-basket.webp" width="200" alt="laundry laundry-basket"><br><sub><b>laundry-basket</b></sub></td><td align="center"><sub><b>hamper</b></sub></td><td align="center"><sub><b>ironing-board</b></sub></td><td align="center"><sub><b>iron</b></sub></td></tr>
<tr><td align="center"><sub><b>clothes-peg</b></sub></td><td align="center"><sub><b>coat-hanger</b></sub></td><td align="center"><sub><b>drying-rack</b></sub></td></tr>
</table>

**Variants:** `laundry-basket`, `hamper`, `ironing-board`, `iron`, `clothes-peg`, `coat-hanger`, `drying-rack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Cleaning Supplies <a id="cleaning"></a>

`createObject('cleaning', { variant: 'broom' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cleaning-broom.webp" width="200" alt="cleaning broom"><br><sub><b>broom</b></sub></td><td align="center"><sub><b>mop-and-bucket</b></sub></td><td align="center"><sub><b>dustpan-and-brush</b></sub></td><td align="center"><sub><b>vacuum-cleaner</b></sub></td></tr>
<tr><td align="center"><sub><b>plunger</b></sub></td><td align="center"><sub><b>spray-bottle</b></sub></td><td align="center"><sub><b>bucket</b></sub></td><td align="center"><sub><b>scrub-brush</b></sub></td></tr>
</table>

**Variants:** `broom`, `mop-and-bucket`, `dustpan-and-brush`, `vacuum-cleaner`, `plunger`, `spray-bottle`, `bucket`, `scrub-brush`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Step Stool & Ladder <a id="step-stool"></a>

`createObject('step-stool', { variant: 'two-step' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/step-stool-two-step.webp" width="200" alt="step-stool two-step"><br><sub><b>two-step</b></sub></td><td align="center"><sub><b>kick-stool</b></sub></td><td align="center"><sub><b>kids-stool</b></sub></td><td align="center"><sub><b>step-ladder</b></sub></td></tr>
</table>

**Variants:** `two-step`, `kick-stool`, `kids-stool`, `step-ladder`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Umbrella <a id="rain-umbrella"></a>

`createObject('rain-umbrella', { variant: 'open-umbrella' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rain-umbrella-open-umbrella.webp" width="200" alt="rain-umbrella open-umbrella"><br><sub><b>open-umbrella</b></sub></td><td align="center"><sub><b>closed-umbrella</b></sub></td><td align="center"><sub><b>folding-umbrella</b></sub></td><td align="center"><sub><b>golf-umbrella</b></sub></td></tr>
<tr><td align="center"><sub><b>umbrella-stand</b></sub></td></tr>
</table>

**Variants:** `open-umbrella`, `closed-umbrella`, `folding-umbrella`, `golf-umbrella`, `umbrella-stand`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Toilet Paper <a id="toilet-paper"></a>

`createObject('toilet-paper', { variant: 'roll' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toilet-paper-roll.webp" width="200" alt="toilet-paper roll"><br><sub><b>roll</b></sub></td><td align="center"><sub><b>four-pack</b></sub></td><td align="center"><sub><b>roll-on-holder</b></sub></td><td align="center"><sub><b>paper-towel-roll</b></sub></td></tr>
</table>

**Variants:** `roll`, `four-pack`, `roll-on-holder`, `paper-towel-roll`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Tissue Box <a id="tissue-box"></a>

`createObject('tissue-box', { variant: 'cube' })` · 3 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tissue-box-cube.webp" width="200" alt="tissue-box cube"><br><sub><b>cube</b></sub></td><td align="center"><sub><b>long</b></sub></td><td align="center"><sub><b>pocket-pack</b></sub></td></tr>
</table>

**Variants:** `cube`, `long`, `pocket-pack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Candle & Matches <a id="candle"></a>

`createObject('candle', { variant: 'pillar' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/candle-pillar.webp" width="200" alt="candle pillar"><br><sub><b>pillar</b></sub></td><td align="center"><sub><b>taper-in-holder</b></sub></td><td align="center"><sub><b>tea-light</b></sub></td><td align="center"><sub><b>jar-candle</b></sub></td></tr>
<tr><td align="center"><sub><b>birthday-candles</b></sub></td><td align="center"><sub><b>matchbox</b></sub></td><td align="center"><sub><b>matchbook</b></sub></td></tr>
</table>

**Variants:** `pillar`, `taper-in-holder`, `tea-light`, `jar-candle`, `birthday-candles`, `matchbox`, `matchbook`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Light Bulb <a id="light-bulb"></a>

`createObject('light-bulb', { variant: 'classic-bulb' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/light-bulb-classic-bulb.webp" width="200" alt="light-bulb classic-bulb"><br><sub><b>classic-bulb</b></sub></td><td align="center"><sub><b>led-bulb</b></sub></td><td align="center"><sub><b>spiral-bulb</b></sub></td><td align="center"><sub><b>edison-bulb</b></sub></td></tr>
<tr><td align="center"><sub><b>globe-bulb</b></sub></td><td align="center"><sub><b>tube-light</b></sub></td></tr>
</table>

**Variants:** `classic-bulb`, `led-bulb`, `spiral-bulb`, `edison-bulb`, `globe-bulb`, `tube-light`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Battery <a id="battery"></a>

`createObject('battery', { variant: 'aa-battery' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/battery-aa-battery.webp" width="200" alt="battery aa-battery"><br><sub><b>aa-battery</b></sub></td><td align="center"><sub><b>aaa-battery</b></sub></td><td align="center"><sub><b>d-battery</b></sub></td><td align="center"><sub><b>9v-battery</b></sub></td></tr>
<tr><td align="center"><sub><b>button-cell</b></sub></td><td align="center"><sub><b>battery-pack</b></sub></td><td align="center"><sub><b>car-battery</b></sub></td></tr>
</table>

**Variants:** `aa-battery`, `aaa-battery`, `d-battery`, `9v-battery`, `button-cell`, `battery-pack`, `car-battery`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Alarm Clock <a id="alarm-clock"></a>

`createObject('alarm-clock', { variant: 'twin-bell' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/alarm-clock-twin-bell.webp" width="200" alt="alarm-clock twin-bell"><br><sub><b>twin-bell</b></sub></td><td align="center"><sub><b>digital</b></sub></td><td align="center"><sub><b>cube-clock</b></sub></td><td align="center"><sub><b>flip-clock</b></sub></td></tr>
<tr><td align="center"><sub><b>travel-alarm</b></sub></td></tr>
</table>

**Variants:** `twin-bell`, `digital`, `cube-clock`, `flip-clock`, `travel-alarm`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `ring`, `tick`


### Wall Hook <a id="wall-hook"></a>

`createObject('wall-hook', { variant: 'picture-hook' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wall-hook-picture-hook.webp" width="200" alt="wall-hook picture-hook"><br><sub><b>picture-hook</b></sub></td><td align="center"><sub><b>coat-hook</b></sub></td><td align="center"><sub><b>key-rack</b></sub></td><td align="center"><sub><b>adhesive-hook</b></sub></td></tr>
<tr><td align="center"><sub><b>hook-rail</b></sub></td></tr>
</table>

**Variants:** `picture-hook`, `coat-hook`, `key-rack`, `adhesive-hook`, `hook-rail`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Backpack <a id="backpack"></a>

`createObject('backpack', { variant: 'school-bag' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/backpack-school-bag.webp" width="200" alt="backpack school-bag"><br><sub><b>school-bag</b></sub></td><td align="center"><sub><b>hiking-backpack</b></sub></td><td align="center"><sub><b>drawstring-bag</b></sub></td><td align="center"><sub><b>mini-backpack</b></sub></td></tr>
<tr><td align="center"><sub><b>laptop-backpack</b></sub></td><td align="center"><sub><b>rolling-backpack</b></sub></td></tr>
</table>

**Variants:** `school-bag`, `hiking-backpack`, `drawstring-bag`, `mini-backpack`, `laptop-backpack`, `rolling-backpack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Handbag & Purse <a id="handbag"></a>

`createObject('handbag', { variant: 'tote-bag' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/handbag-tote-bag.webp" width="200" alt="handbag tote-bag"><br><sub><b>tote-bag</b></sub></td><td align="center"><sub><b>shoulder-bag</b></sub></td><td align="center"><sub><b>clutch</b></sub></td><td align="center"><sub><b>crossbody-bag</b></sub></td></tr>
<tr><td align="center"><sub><b>purse</b></sub></td><td align="center"><sub><b>bucket-bag</b></sub></td></tr>
</table>

**Variants:** `tote-bag`, `shoulder-bag`, `clutch`, `crossbody-bag`, `purse`, `bucket-bag`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Wallet <a id="wallet"></a>

`createObject('wallet', { variant: 'bifold' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wallet-bifold.webp" width="200" alt="wallet bifold"><br><sub><b>bifold</b></sub></td><td align="center"><sub><b>trifold</b></sub></td><td align="center"><sub><b>card-holder</b></sub></td><td align="center"><sub><b>coin-purse</b></sub></td></tr>
<tr><td align="center"><sub><b>zip-wallet</b></sub></td></tr>
</table>

**Variants:** `bifold`, `trifold`, `card-holder`, `coin-purse`, `zip-wallet`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Phone Case <a id="phone-case"></a>

`createObject('phone-case', { variant: 'slim-case' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/phone-case-slim-case.webp" width="200" alt="phone-case slim-case"><br><sub><b>slim-case</b></sub></td><td align="center"><sub><b>rugged-case</b></sub></td><td align="center"><sub><b>wallet-case</b></sub></td><td align="center"><sub><b>clear-case</b></sub></td></tr>
<tr><td align="center"><sub><b>kids-case</b></sub></td></tr>
</table>

**Variants:** `slim-case`, `rugged-case`, `wallet-case`, `clear-case`, `kids-case`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `screen-on`


### Keys & Keyring <a id="keys"></a>

`createObject('keys', { variant: 'house-key' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/keys-house-key.webp" width="200" alt="keys house-key"><br><sub><b>house-key</b></sub></td><td align="center"><sub><b>keyring</b></sub></td><td align="center"><sub><b>car-key-fob</b></sub></td><td align="center"><sub><b>key-with-tag</b></sub></td></tr>
<tr><td align="center"><sub><b>skeleton-key</b></sub></td></tr>
</table>

**Variants:** `house-key`, `keyring`, `car-key-fob`, `key-with-tag`, `skeleton-key`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Tag, Label & Badge <a id="tag"></a>

`createObject('tag', { variant: 'luggage-tag' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/tag-luggage-tag.webp" width="200" alt="tag luggage-tag"><br><sub><b>luggage-tag</b></sub></td><td align="center"><sub><b>price-tag</b></sub></td><td align="center"><sub><b>gift-tag</b></sub></td><td align="center"><sub><b>dog-tag</b></sub></td></tr>
<tr><td align="center"><sub><b>pet-tag</b></sub></td><td align="center"><sub><b>name-badge</b></sub></td><td align="center"><sub><b>id-card-lanyard</b></sub></td><td align="center"><sub><b>key-tag</b></sub></td></tr>
<tr><td align="center"><sub><b>hang-tag</b></sub></td></tr>
</table>

**Variants:** `luggage-tag`, `price-tag`, `gift-tag`, `dog-tag`, `pet-tag`, `name-badge`, `id-card-lanyard`, `key-tag`, `hang-tag`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Sunglasses & Glasses <a id="eyewear"></a>

`createObject('eyewear', { variant: 'aviator' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/eyewear-aviator.webp" width="200" alt="eyewear aviator"><br><sub><b>aviator</b></sub></td><td align="center"><sub><b>wayfarer</b></sub></td><td align="center"><sub><b>round</b></sub></td><td align="center"><sub><b>sport</b></sub></td></tr>
<tr><td align="center"><sub><b>cat-eye</b></sub></td><td align="center"><sub><b>reading-glasses</b></sub></td></tr>
</table>

**Variants:** `aviator`, `wayfarer`, `round`, `sport`, `cat-eye`, `reading-glasses`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Watch <a id="wristwatch"></a>

`createObject('wristwatch', { variant: 'analog' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/wristwatch-analog.webp" width="200" alt="wristwatch analog"><br><sub><b>analog</b></sub></td><td align="center"><sub><b>digital</b></sub></td><td align="center"><sub><b>smartwatch</b></sub></td><td align="center"><sub><b>pocket-watch</b></sub></td></tr>
<tr><td align="center"><sub><b>kids-watch</b></sub></td></tr>
</table>

**Variants:** `analog`, `digital`, `smartwatch`, `pocket-watch`, `kids-watch`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `tick`


### Jewelry <a id="jewelry"></a>

`createObject('jewelry', { variant: 'ring' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/jewelry-ring.webp" width="200" alt="jewelry ring"><br><sub><b>ring</b></sub></td><td align="center"><sub><b>necklace</b></sub></td><td align="center"><sub><b>bracelet</b></sub></td><td align="center"><sub><b>earrings</b></sub></td></tr>
<tr><td align="center"><sub><b>pendant</b></sub></td><td align="center"><sub><b>jewelry-box</b></sub></td><td align="center"><sub><b>ring-box</b></sub></td></tr>
</table>

**Variants:** `ring`, `necklace`, `bracelet`, `earrings`, `pendant`, `jewelry-box`, `ring-box`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Toiletries <a id="toiletries"></a>

`createObject('toiletries', { variant: 'toothbrush' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toiletries-toothbrush.webp" width="200" alt="toiletries toothbrush"><br><sub><b>toothbrush</b></sub></td><td align="center"><sub><b>toothbrush-cup</b></sub></td><td align="center"><sub><b>toothpaste</b></sub></td><td align="center"><sub><b>razor</b></sub></td></tr>
<tr><td align="center"><sub><b>soap-bar</b></sub></td><td align="center"><sub><b>shampoo-bottle</b></sub></td><td align="center"><sub><b>deodorant</b></sub></td></tr>
</table>

**Variants:** `toothbrush`, `toothbrush-cup`, `toothpaste`, `razor`, `soap-bar`, `shampoo-bottle`, `deodorant`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Beauty & Makeup <a id="beauty"></a>

`createObject('beauty', { variant: 'perfume' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/beauty-perfume.webp" width="200" alt="beauty perfume"><br><sub><b>perfume</b></sub></td><td align="center"><sub><b>lipstick</b></sub></td><td align="center"><sub><b>makeup-kit</b></sub></td><td align="center"><sub><b>nail-polish</b></sub></td></tr>
<tr><td align="center"><sub><b>hairbrush</b></sub></td><td align="center"><sub><b>comb</b></sub></td><td align="center"><sub><b>hand-mirror</b></sub></td></tr>
</table>

**Variants:** `perfume`, `lipstick`, `makeup-kit`, `nail-polish`, `hairbrush`, `comb`, `hand-mirror`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Pen & Marker <a id="pen"></a>

`createObject('pen', { variant: 'ballpoint-pen' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pen-ballpoint-pen.webp" width="200" alt="pen ballpoint-pen"><br><sub><b>ballpoint-pen</b></sub></td><td align="center"><sub><b>click-pen</b></sub></td><td align="center"><sub><b>fountain-pen</b></sub></td><td align="center"><sub><b>marker</b></sub></td></tr>
<tr><td align="center"><sub><b>highlighter</b></sub></td><td align="center"><sub><b>whiteboard-marker</b></sub></td><td align="center"><sub><b>felt-tip-pen</b></sub></td></tr>
</table>

**Variants:** `ballpoint-pen`, `click-pen`, `fountain-pen`, `marker`, `highlighter`, `whiteboard-marker`, `felt-tip-pen`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Pencil <a id="pencil"></a>

`createObject('pencil', { variant: 'wooden-pencil' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/pencil-wooden-pencil.webp" width="200" alt="pencil wooden-pencil"><br><sub><b>wooden-pencil</b></sub></td><td align="center"><sub><b>mechanical-pencil</b></sub></td><td align="center"><sub><b>colored-pencils</b></sub></td><td align="center"><sub><b>pencil-case</b></sub></td></tr>
<tr><td align="center"><sub><b>pencil-sharpener</b></sub></td></tr>
</table>

**Variants:** `wooden-pencil`, `mechanical-pencil`, `colored-pencils`, `pencil-case`, `pencil-sharpener`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Stationery & Desk Supplies <a id="stationery"></a>

`createObject('stationery', { variant: 'eraser' })` · 11 versions · procedural JS

<table>
<tr><td align="center"><img src="images/stationery-eraser.webp" width="200" alt="stationery eraser"><br><sub><b>eraser</b></sub></td><td align="center"><sub><b>ruler</b></sub></td><td align="center"><sub><b>scissors</b></sub></td><td align="center"><sub><b>stapler</b></sub></td></tr>
<tr><td align="center"><sub><b>tape-dispenser</b></sub></td><td align="center"><sub><b>glue-stick</b></sub></td><td align="center"><sub><b>paper-clips</b></sub></td><td align="center"><sub><b>binder-clip</b></sub></td></tr>
<tr><td align="center"><sub><b>sticky-notes</b></sub></td><td align="center"><sub><b>push-pins</b></sub></td><td align="center"><sub><b>hole-punch</b></sub></td></tr>
</table>

**Variants:** `eraser`, `ruler`, `scissors`, `stapler`, `tape-dispenser`, `glue-stick`, `paper-clips`, `binder-clip`, `sticky-notes`, `push-pins`, `hole-punch`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Notebook & Folder <a id="notebook"></a>

`createObject('notebook', { variant: 'spiral-notebook' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/notebook-spiral-notebook.webp" width="200" alt="notebook spiral-notebook"><br><sub><b>spiral-notebook</b></sub></td><td align="center"><sub><b>composition-book</b></sub></td><td align="center"><sub><b>journal</b></sub></td><td align="center"><sub><b>notepad</b></sub></td></tr>
<tr><td align="center"><sub><b>folder</b></sub></td><td align="center"><sub><b>ring-binder</b></sub></td><td align="center"><sub><b>clipboard</b></sub></td></tr>
</table>

**Variants:** `spiral-notebook`, `composition-book`, `journal`, `notepad`, `folder`, `ring-binder`, `clipboard`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Mail & Post <a id="mail"></a>

`createObject('mail', { variant: 'envelope' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/mail-envelope.webp" width="200" alt="mail envelope"><br><sub><b>envelope</b></sub></td><td align="center"><sub><b>letter</b></sub></td><td align="center"><sub><b>postage-stamp</b></sub></td><td align="center"><sub><b>postcard</b></sub></td></tr>
<tr><td align="center"><sub><b>parcel</b></sub></td><td align="center"><sub><b>rubber-stamp</b></sub></td></tr>
</table>

**Variants:** `envelope`, `letter`, `postage-stamp`, `postcard`, `parcel`, `rubber-stamp`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Calculator <a id="calculator"></a>

`createObject('calculator', { variant: 'basic' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/calculator-basic.webp" width="200" alt="calculator basic"><br><sub><b>basic</b></sub></td><td align="center"><sub><b>scientific</b></sub></td><td align="center"><sub><b>desk-calculator</b></sub></td><td align="center"><sub><b>printing-calculator</b></sub></td></tr>
</table>

**Variants:** `basic`, `scientific`, `desk-calculator`, `printing-calculator`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Globe <a id="globe"></a>

`createObject('globe', { variant: 'desk-globe' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/globe-desk-globe.webp" width="200" alt="globe desk-globe"><br><sub><b>desk-globe</b></sub></td><td align="center"><sub><b>floor-globe</b></sub></td><td align="center"><sub><b>illuminated-globe</b></sub></td><td align="center"><sub><b>mini-globe</b></sub></td></tr>
</table>

**Variants:** `desk-globe`, `floor-globe`, `illuminated-globe`, `mini-globe`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Lunchbox <a id="lunchbox"></a>

`createObject('lunchbox', { variant: 'metal-lunchbox' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/lunchbox-metal-lunchbox.webp" width="200" alt="lunchbox metal-lunchbox"><br><sub><b>metal-lunchbox</b></sub></td><td align="center"><sub><b>bento-box</b></sub></td><td align="center"><sub><b>insulated-lunch-bag</b></sub></td><td align="center"><sub><b>kids-lunchbox</b></sub></td></tr>
</table>

**Variants:** `metal-lunchbox`, `bento-box`, `insulated-lunch-bag`, `kids-lunchbox`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Water Bottle & Flask <a id="water-bottle"></a>

`createObject('water-bottle', { variant: 'sports-bottle' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/water-bottle-sports-bottle.webp" width="200" alt="water-bottle sports-bottle"><br><sub><b>sports-bottle</b></sub></td><td align="center"><sub><b>steel-bottle</b></sub></td><td align="center"><sub><b>glass-bottle</b></sub></td><td align="center"><sub><b>kids-bottle</b></sub></td></tr>
<tr><td align="center"><sub><b>thermos</b></sub></td><td align="center"><sub><b>travel-mug</b></sub></td><td align="center"><sub><b>tumbler-with-straw</b></sub></td></tr>
</table>

**Variants:** `sports-bottle`, `steel-bottle`, `glass-bottle`, `kids-bottle`, `thermos`, `travel-mug`, `tumbler-with-straw`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Books & Reading <a id="books"></a>

`createObject('books', { variant: 'book-stack' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/books-book-stack.webp" width="200" alt="books book-stack"><br><sub><b>book-stack</b></sub></td><td align="center"><sub><b>open-book</b></sub></td><td align="center"><sub><b>magazine</b></sub></td><td align="center"><sub><b>newspaper</b></sub></td></tr>
<tr><td align="center"><sub><b>comic-book</b></sub></td><td align="center"><sub><b>map</b></sub></td></tr>
</table>

**Variants:** `book-stack`, `open-book`, `magazine`, `newspaper`, `comic-book`, `map`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Tickets & Paper Goods <a id="ticket"></a>

`createObject('ticket', { variant: 'ticket' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/ticket-ticket.webp" width="200" alt="ticket ticket"><br><sub><b>ticket</b></sub></td><td align="center"><sub><b>movie-ticket</b></sub></td><td align="center"><sub><b>boarding-pass</b></sub></td><td align="center"><sub><b>poster-tube</b></sub></td></tr>
<tr><td align="center"><sub><b>scroll</b></sub></td><td align="center"><sub><b>receipt</b></sub></td></tr>
</table>

**Variants:** `ticket`, `movie-ticket`, `boarding-pass`, `poster-tube`, `scroll`, `receipt`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Kitchen Utensil <a id="kitchen-utensil"></a>

`createObject('kitchen-utensil', { variant: 'whisk' })` · 13 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kitchen-utensil-whisk.webp" width="200" alt="kitchen-utensil whisk"><br><sub><b>whisk</b></sub></td><td align="center"><sub><b>spatula</b></sub></td><td align="center"><sub><b>ladle</b></sub></td><td align="center"><sub><b>wooden-spoon</b></sub></td></tr>
<tr><td align="center"><sub><b>tongs</b></sub></td><td align="center"><sub><b>peeler</b></sub></td><td align="center"><sub><b>grater</b></sub></td><td align="center"><sub><b>rolling-pin</b></sub></td></tr>
<tr><td align="center"><sub><b>can-opener</b></sub></td><td align="center"><sub><b>bottle-opener</b></sub></td><td align="center"><sub><b>kitchen-knife</b></sub></td><td align="center"><sub><b>pizza-cutter</b></sub></td></tr>
<tr><td align="center"><sub><b>measuring-cups</b></sub></td></tr>
</table>

**Variants:** `whisk`, `spatula`, `ladle`, `wooden-spoon`, `tongs`, `peeler`, `grater`, `rolling-pin`, `can-opener`, `bottle-opener`, `kitchen-knife`, `pizza-cutter`, `measuring-cups`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Cutlery <a id="cutlery"></a>

`createObject('cutlery', { variant: 'fork' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cutlery-fork.webp" width="200" alt="cutlery fork"><br><sub><b>fork</b></sub></td><td align="center"><sub><b>spoon</b></sub></td><td align="center"><sub><b>table-knife</b></sub></td><td align="center"><sub><b>teaspoon</b></sub></td></tr>
<tr><td align="center"><sub><b>chopsticks</b></sub></td><td align="center"><sub><b>place-setting</b></sub></td></tr>
</table>

**Variants:** `fork`, `spoon`, `table-knife`, `teaspoon`, `chopsticks`, `place-setting`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Oven Mitt & Kitchen Linen <a id="kitchen-linen"></a>

`createObject('kitchen-linen', { variant: 'oven-mitt' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kitchen-linen-oven-mitt.webp" width="200" alt="kitchen-linen oven-mitt"><br><sub><b>oven-mitt</b></sub></td><td align="center"><sub><b>pot-holder</b></sub></td><td align="center"><sub><b>apron</b></sub></td><td align="center"><sub><b>tea-towel</b></sub></td></tr>
</table>

**Variants:** `oven-mitt`, `pot-holder`, `apron`, `tea-towel`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Kitchen Gadget & Jar <a id="kitchen-gadget"></a>

`createObject('kitchen-gadget', { variant: 'kitchen-timer' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/kitchen-gadget-kitchen-timer.webp" width="200" alt="kitchen-gadget kitchen-timer"><br><sub><b>kitchen-timer</b></sub></td><td align="center"><sub><b>hourglass</b></sub></td><td align="center"><sub><b>salt-and-pepper-shakers</b></sub></td><td align="center"><sub><b>pepper-mill</b></sub></td></tr>
<tr><td align="center"><sub><b>mason-jar</b></sub></td><td align="center"><sub><b>cookie-jar</b></sub></td><td align="center"><sub><b>spice-jars</b></sub></td><td align="center"><sub><b>measuring-jug</b></sub></td></tr>
</table>

**Variants:** `kitchen-timer`, `hourglass`, `salt-and-pepper-shakers`, `pepper-mill`, `mason-jar`, `cookie-jar`, `spice-jars`, `measuring-jug`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `twist`


### Gift Box & Present <a id="gift-box"></a>

`createObject('gift-box', { variant: 'wrapped-gift' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gift-box-wrapped-gift.webp" width="200" alt="gift-box wrapped-gift"><br><sub><b>wrapped-gift</b></sub></td><td align="center"><sub><b>gift-bag</b></sub></td><td align="center"><sub><b>gift-stack</b></sub></td><td align="center"><sub><b>round-hatbox</b></sub></td></tr>
<tr><td align="center"><sub><b>ribbon-roll</b></sub></td></tr>
</table>

**Variants:** `wrapped-gift`, `gift-bag`, `gift-stack`, `round-hatbox`, `ribbon-roll`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Party Supplies <a id="party-supplies"></a>

`createObject('party-supplies', { variant: 'party-hat' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/party-supplies-party-hat.webp" width="200" alt="party-supplies party-hat"><br><sub><b>party-hat</b></sub></td><td align="center"><sub><b>balloon-bundle</b></sub></td><td align="center"><sub><b>pinata</b></sub></td><td align="center"><sub><b>confetti-popper</b></sub></td></tr>
<tr><td align="center"><sub><b>party-horn</b></sub></td><td align="center"><sub><b>streamer-roll</b></sub></td></tr>
</table>

**Variants:** `party-hat`, `balloon-bundle`, `pinata`, `confetti-popper`, `party-horn`, `streamer-roll`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Award & Trophy Cup <a id="award"></a>

`createObject('award', { variant: 'trophy-cup' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/award-trophy-cup.webp" width="200" alt="award trophy-cup"><br><sub><b>trophy-cup</b></sub></td><td align="center"><sub><b>plaque</b></sub></td><td align="center"><sub><b>medal</b></sub></td><td align="center"><sub><b>rosette-ribbon</b></sub></td></tr>
<tr><td align="center"><sub><b>certificate-frame</b></sub></td></tr>
</table>

**Variants:** `trophy-cup`, `plaque`, `medal`, `rosette-ribbon`, `certificate-frame`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Money & Cards <a id="money"></a>

`createObject('money', { variant: 'coin' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/money-coin.webp" width="200" alt="money coin"><br><sub><b>coin</b></sub></td><td align="center"><sub><b>coin-stack</b></sub></td><td align="center"><sub><b>banknote-stack</b></sub></td><td align="center"><sub><b>money-roll</b></sub></td></tr>
<tr><td align="center"><sub><b>credit-card</b></sub></td><td align="center"><sub><b>piggy-bank</b></sub></td><td align="center"><sub><b>cash-box</b></sub></td></tr>
</table>

**Variants:** `coin`, `coin-stack`, `banknote-stack`, `money-roll`, `credit-card`, `piggy-bank`, `cash-box`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `spin`


### Garden Tools <a id="gardening"></a>

`createObject('gardening', { variant: 'shovel' })` · 9 versions · procedural JS

<table>
<tr><td align="center"><img src="images/gardening-shovel.webp" width="200" alt="gardening shovel"><br><sub><b>shovel</b></sub></td><td align="center"><sub><b>spade</b></sub></td><td align="center"><sub><b>rake</b></sub></td><td align="center"><sub><b>leaf-rake</b></sub></td></tr>
<tr><td align="center"><sub><b>hoe</b></sub></td><td align="center"><sub><b>trowel</b></sub></td><td align="center"><sub><b>garden-fork</b></sub></td><td align="center"><sub><b>pruning-shears</b></sub></td></tr>
<tr><td align="center"><sub><b>gardening-gloves</b></sub></td></tr>
</table>

**Variants:** `shovel`, `spade`, `rake`, `leaf-rake`, `hoe`, `trowel`, `garden-fork`, `pruning-shears`, `gardening-gloves`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Garden Hose <a id="garden-hose"></a>

`createObject('garden-hose', { variant: 'hose-reel' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/garden-hose-hose-reel.webp" width="200" alt="garden-hose hose-reel"><br><sub><b>hose-reel</b></sub></td><td align="center"><sub><b>coiled-hose</b></sub></td><td align="center"><sub><b>hose-cart</b></sub></td><td align="center"><sub><b>sprinkler</b></sub></td></tr>
<tr><td align="center"><sub><b>spray-nozzle</b></sub></td></tr>
</table>

**Variants:** `hose-reel`, `coiled-hose`, `hose-cart`, `sprinkler`, `spray-nozzle`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `reel`


### Watering Can <a id="watering-can"></a>

`createObject('watering-can', { variant: 'metal' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/watering-can-metal.webp" width="200" alt="watering-can metal"><br><sub><b>metal</b></sub></td><td align="center"><sub><b>plastic</b></sub></td><td align="center"><sub><b>indoor</b></sub></td><td align="center"><sub><b>long-reach</b></sub></td></tr>
<tr><td align="center"><sub><b>kids</b></sub></td></tr>
</table>

**Variants:** `metal`, `plastic`, `indoor`, `long-reach`, `kids`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Wheelbarrow & Cart <a id="wheelbarrow"></a>

`createObject('wheelbarrow', { variant: 'classic' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><sub><b>classic</b></sub></td><td align="center"><sub><b>two-wheel</b></sub></td><td align="center"><sub><b>garden-cart</b></sub></td><td align="center"><sub><b>wagon</b></sub></td></tr>
</table>

**Variants:** `classic`, `two-wheel`, `garden-cart`, `wagon`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `roll`


### Flower Pot <a id="flower-pot"></a>

`createObject('flower-pot', { variant: 'terracotta-pot' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/flower-pot-terracotta-pot.webp" width="200" alt="flower-pot terracotta-pot"><br><sub><b>terracotta-pot</b></sub></td><td align="center"><sub><b>glazed-pot</b></sub></td><td align="center"><sub><b>hanging-pot</b></sub></td><td align="center"><sub><b>window-box</b></sub></td></tr>
<tr><td align="center"><sub><b>seed-tray</b></sub></td><td align="center"><sub><b>self-watering-pot</b></sub></td></tr>
</table>

**Variants:** `terracotta-pot`, `glazed-pot`, `hanging-pot`, `window-box`, `seed-tray`, `self-watering-pot`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Bird Feeder & Birdhouse <a id="bird-feeder"></a>

`createObject('bird-feeder', { variant: 'tube-feeder' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/bird-feeder-tube-feeder.webp" width="200" alt="bird-feeder tube-feeder"><br><sub><b>tube-feeder</b></sub></td><td align="center"><sub><b>birdhouse</b></sub></td><td align="center"><sub><b>platform-feeder</b></sub></td><td align="center"><sub><b>suet-cage</b></sub></td></tr>
<tr><td align="center"><sub><b>hanging-house-feeder</b></sub></td></tr>
</table>

**Variants:** `tube-feeder`, `birdhouse`, `platform-feeder`, `suet-cage`, `hanging-house-feeder`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Padlock & Lock <a id="padlock"></a>

`createObject('padlock', { variant: 'keyed-padlock' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/padlock-keyed-padlock.webp" width="200" alt="padlock keyed-padlock"><br><sub><b>keyed-padlock</b></sub></td><td align="center"><sub><b>combination-lock</b></sub></td><td align="center"><sub><b>disc-lock</b></sub></td><td align="center"><sub><b>bike-u-lock</b></sub></td></tr>
<tr><td align="center"><sub><b>cable-lock</b></sub></td></tr>
</table>

**Variants:** `keyed-padlock`, `combination-lock`, `disc-lock`, `bike-u-lock`, `cable-lock`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Rope & Chain <a id="rope-and-chain"></a>

`createObject('rope-and-chain', { variant: 'rope-coil' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/rope-and-chain-rope-coil.webp" width="200" alt="rope-and-chain rope-coil"><br><sub><b>rope-coil</b></sub></td><td align="center"><sub><b>chain-coil</b></sub></td><td align="center"><sub><b>bungee-cords</b></sub></td><td align="center"><sub><b>twine-ball</b></sub></td></tr>
<tr><td align="center"><sub><b>rope-hank</b></sub></td></tr>
</table>

**Variants:** `rope-coil`, `chain-coil`, `bungee-cords`, `twine-ball`, `rope-hank`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Toolbox <a id="toolbox"></a>

`createObject('toolbox', { variant: 'metal-toolbox' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/toolbox-metal-toolbox.webp" width="200" alt="toolbox metal-toolbox"><br><sub><b>metal-toolbox</b></sub></td><td align="center"><sub><b>plastic-toolbox</b></sub></td><td align="center"><sub><b>tool-bag</b></sub></td><td align="center"><sub><b>tackle-box</b></sub></td></tr>
<tr><td align="center"><sub><b>tool-chest</b></sub></td></tr>
</table>

**Variants:** `metal-toolbox`, `plastic-toolbox`, `tool-bag`, `tackle-box`, `tool-chest`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Flashlight & Lantern <a id="flashlight"></a>

`createObject('flashlight', { variant: 'torch' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/flashlight-torch.webp" width="200" alt="flashlight torch"><br><sub><b>torch</b></sub></td><td align="center"><sub><b>long-flashlight</b></sub></td><td align="center"><sub><b>headlamp</b></sub></td><td align="center"><sub><b>camping-lantern</b></sub></td></tr>
<tr><td align="center"><sub><b>oil-lantern</b></sub></td><td align="center"><sub><b>pen-light</b></sub></td></tr>
</table>

**Variants:** `torch`, `long-flashlight`, `headlamp`, `camping-lantern`, `oil-lantern`, `pen-light`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `on`


### Cooler Box <a id="cooler"></a>

`createObject('cooler', { variant: 'cooler-box' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cooler-cooler-box.webp" width="200" alt="cooler cooler-box"><br><sub><b>cooler-box</b></sub></td><td align="center"><sub><b>soft-cooler</b></sub></td><td align="center"><sub><b>wheeled-cooler</b></sub></td><td align="center"><sub><b>ice-chest</b></sub></td></tr>
<tr><td align="center"><sub><b>lunch-cooler</b></sub></td></tr>
</table>

**Variants:** `cooler-box`, `soft-cooler`, `wheeled-cooler`, `ice-chest`, `lunch-cooler`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `open`


### Camping Gear <a id="camping-gear"></a>

`createObject('camping-gear', { variant: 'camping-chair' })` · 7 versions · procedural JS

<table>
<tr><td align="center"><img src="images/camping-gear-camping-chair.webp" width="200" alt="camping-gear camping-chair"><br><sub><b>camping-chair</b></sub></td><td align="center"><sub><b>sleeping-bag</b></sub></td><td align="center"><sub><b>rolled-sleeping-bag</b></sub></td><td align="center"><sub><b>tent-stakes</b></sub></td></tr>
<tr><td align="center"><sub><b>camping-stove</b></sub></td><td align="center"><sub><b>sleeping-mat</b></sub></td><td align="center"><sub><b>camping-table</b></sub></td></tr>
</table>

**Variants:** `camping-chair`, `sleeping-bag`, `rolled-sleeping-bag`, `tent-stakes`, `camping-stove`, `sleeping-mat`, `camping-table`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Shopping Cart & Basket <a id="shopping-cart"></a>

`createObject('shopping-cart', { variant: 'shopping-trolley' })` · 5 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shopping-cart-shopping-trolley.webp" width="200" alt="shopping-cart shopping-trolley"><br><sub><b>shopping-trolley</b></sub></td><td align="center"><sub><b>shopping-basket</b></sub></td><td align="center"><sub><b>rolling-basket</b></sub></td><td align="center"><sub><b>kids-cart</b></sub></td></tr>
<tr><td align="center"><sub><b>wire-basket</b></sub></td></tr>
</table>

**Variants:** `shopping-trolley`, `shopping-basket`, `rolling-basket`, `kids-cart`, `wire-basket`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `roll`


### Shopping Bag <a id="shopping-bag"></a>

`createObject('shopping-bag', { variant: 'paper-bag' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/shopping-bag-paper-bag.webp" width="200" alt="shopping-bag paper-bag"><br><sub><b>paper-bag</b></sub></td><td align="center"><sub><b>grocery-bag</b></sub></td><td align="center"><sub><b>plastic-bag</b></sub></td><td align="center"><sub><b>reusable-tote</b></sub></td></tr>
<tr><td align="center"><sub><b>gift-bag</b></sub></td><td align="center"><sub><b>mesh-bag</b></sub></td></tr>
</table>

**Variants:** `paper-bag`, `grocery-bag`, `plastic-bag`, `reusable-tote`, `gift-bag`, `mesh-bag`

| Option | Description |
|---|---|
| `color` | main colour (base model) |


### Cardboard Box <a id="cardboard-box"></a>

`createObject('cardboard-box', { variant: 'open-box' })` · 8 versions · procedural JS

<table>
<tr><td align="center"><img src="images/cardboard-box-open-box.webp" width="200" alt="cardboard-box open-box"><br><sub><b>open-box</b></sub></td><td align="center"><sub><b>closed-box</b></sub></td><td align="center"><sub><b>taped-box</b></sub></td><td align="center"><sub><b>moving-box</b></sub></td></tr>
<tr><td align="center"><sub><b>shoe-box</b></sub></td><td align="center"><sub><b>pizza-box</b></sub></td><td align="center"><sub><b>box-stack</b></sub></td><td align="center"><sub><b>flat-pack</b></sub></td></tr>
</table>

**Variants:** `open-box`, `closed-box`, `taped-box`, `moving-box`, `shoe-box`, `pizza-box`, `box-stack`, `flat-pack`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `flaps`


### Suitcase & Luggage <a id="suitcase"></a>

`createObject('suitcase', { variant: 'rolling-suitcase' })` · 6 versions · procedural JS

<table>
<tr><td align="center"><img src="images/suitcase-rolling-suitcase.webp" width="200" alt="suitcase rolling-suitcase"><br><sub><b>rolling-suitcase</b></sub></td><td align="center"><sub><b>hard-shell</b></sub></td><td align="center"><sub><b>carry-on</b></sub></td><td align="center"><sub><b>duffel-bag</b></sub></td></tr>
<tr><td align="center"><sub><b>vintage-trunk</b></sub></td><td align="center"><sub><b>briefcase</b></sub></td></tr>
</table>

**Variants:** `rolling-suitcase`, `hard-shell`, `carry-on`, `duffel-bag`, `vintage-trunk`, `briefcase`

| Option | Description |
|---|---|
| `color` | main colour (base model) |

**Animations:** `handle`, `roll`


### Backpack (HD) <a id="hd-backpack"></a>

`createObject('hd-backpack', { variant: 'forest-green' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>forest-green</b></sub></td><td align="center"><sub><b>navy</b></sub></td><td align="center"><sub><b>mustard</b></sub></td></tr>
</table>

**Variants:** `forest-green`, `navy`, `mustard`

| Option | Description |
|---|---|
| `color` | fabric color |


### Bucket (HD) <a id="hd-bucket"></a>

`createObject('hd-bucket', { variant: 'galvanized' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>galvanized</b></sub></td><td align="center"><sub><b>plastic-red</b></sub></td><td align="center"><sub><b>plastic-blue</b></sub></td></tr>
</table>

**Variants:** `galvanized`, `plastic-red`, `plastic-blue`

| Option | Description |
|---|---|
| `color` | plastic color |


### Cardboard boxes (HD) <a id="hd-cardboard-boxes"></a>

`createObject('hd-cardboard-boxes', { variant: 'stack-of-three' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>stack-of-three</b></sub></td><td align="center"><sub><b>single-large</b></sub></td><td align="center"><sub><b>parcels</b></sub></td></tr>
</table>

**Variants:** `stack-of-three`, `single-large`, `parcels`


### Suitcase (HD) <a id="hd-suitcase"></a>

`createObject('hd-suitcase', { variant: 'hard-navy' })` · 4 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>hard-navy</b></sub></td><td align="center"><sub><b>hard-silver</b></sub></td><td align="center"><sub><b>hard-coral-cabin</b></sub></td><td align="center"><sub><b>soft-black</b></sub></td></tr>
</table>

**Variants:** `hard-navy`, `hard-silver`, `hard-coral-cabin`, `soft-black`

| Option | Description |
|---|---|
| `color` | shell color |


### Umbrella (HD) <a id="hd-umbrella"></a>

`createObject('hd-umbrella', { variant: 'open-navy' })` · 3 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>open-navy</b></sub></td><td align="center"><sub><b>open-red</b></sub></td><td align="center"><sub><b>closed-black</b></sub></td></tr>
</table>

**Variants:** `open-navy`, `open-red`, `closed-black`

| Option | Description |
|---|---|
| `color` | canopy color |


### Watering can (HD) <a id="hd-watering-can"></a>

`createObject('hd-watering-can', { variant: 'green-metal' })` · 2 versions · Blender .glb

<table>
<tr><td align="center"><sub><b>green-metal</b></sub></td><td align="center"><sub><b>plastic-teal</b></sub></td></tr>
</table>

**Variants:** `green-metal`, `plastic-teal`

| Option | Description |
|---|---|
| `color` | can color |


## Maps

### City map <a id="map-city"></a>

`createObject('map-city', { variant: 'financial' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-city-financial.webp" width="200" alt="map-city financial"><br><sub><b>financial</b></sub></td><td align="center"><img src="images/map-city-plaza.webp" width="200" alt="map-city plaza"><br><sub><b>plaza</b></sub></td><td align="center"><img src="images/map-city-waterfront.webp" width="200" alt="map-city waterfront"><br><sub><b>waterfront</b></sub></td><td align="center"><img src="images/map-city-old-town.webp" width="200" alt="map-city old-town"><br><sub><b>old-town</b></sub></td></tr>
</table>

**Variants:** `financial`, `plaza`, `waterfront`, `old-town`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Suburb map <a id="map-suburb"></a>

`createObject('map-suburb', { variant: 'grid-street' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-suburb-grid-street.webp" width="200" alt="map-suburb grid-street"><br><sub><b>grid-street</b></sub></td><td align="center"><img src="images/map-suburb-cul-de-sac.webp" width="200" alt="map-suburb cul-de-sac"><br><sub><b>cul-de-sac</b></sub></td><td align="center"><img src="images/map-suburb-lakeside.webp" width="200" alt="map-suburb lakeside"><br><sub><b>lakeside</b></sub></td><td align="center"><img src="images/map-suburb-winter.webp" width="200" alt="map-suburb winter"><br><sub><b>winter</b></sub></td></tr>
</table>

**Variants:** `grid-street`, `cul-de-sac`, `lakeside`, `winter`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Village map <a id="map-village"></a>

`createObject('map-village', { variant: 'english' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-village-english.webp" width="200" alt="map-village english"><br><sub><b>english</b></sub></td><td align="center"><img src="images/map-village-alpine.webp" width="200" alt="map-village alpine"><br><sub><b>alpine</b></sub></td><td align="center"><img src="images/map-village-coastal.webp" width="200" alt="map-village coastal"><br><sub><b>coastal</b></sub></td><td align="center"><img src="images/map-village-adobe.webp" width="200" alt="map-village adobe"><br><sub><b>adobe</b></sub></td></tr>
</table>

**Variants:** `english`, `alpine`, `coastal`, `adobe`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Farm map <a id="map-farm"></a>

`createObject('map-farm', { variant: 'dairy' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-farm-dairy.webp" width="200" alt="map-farm dairy"><br><sub><b>dairy</b></sub></td><td align="center"><img src="images/map-farm-crops.webp" width="200" alt="map-farm crops"><br><sub><b>crops</b></sub></td><td align="center"><img src="images/map-farm-orchard.webp" width="200" alt="map-farm orchard"><br><sub><b>orchard</b></sub></td><td align="center"><img src="images/map-farm-ranch.webp" width="200" alt="map-farm ranch"><br><sub><b>ranch</b></sub></td></tr>
</table>

**Variants:** `dairy`, `crops`, `orchard`, `ranch`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Forest map <a id="map-forest"></a>

`createObject('map-forest', { variant: 'pine' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-forest-pine.webp" width="200" alt="map-forest pine"><br><sub><b>pine</b></sub></td><td align="center"><img src="images/map-forest-autumn.webp" width="200" alt="map-forest autumn"><br><sub><b>autumn</b></sub></td><td align="center"><img src="images/map-forest-birch.webp" width="200" alt="map-forest birch"><br><sub><b>birch</b></sub></td><td align="center"><img src="images/map-forest-old-growth.webp" width="200" alt="map-forest old-growth"><br><sub><b>old-growth</b></sub></td></tr>
</table>

**Variants:** `pine`, `autumn`, `birch`, `old-growth`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Desert map <a id="map-desert"></a>

`createObject('map-desert', { variant: 'dunes' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-desert-dunes.webp" width="200" alt="map-desert dunes"><br><sub><b>dunes</b></sub></td><td align="center"><img src="images/map-desert-oasis.webp" width="200" alt="map-desert oasis"><br><sub><b>oasis</b></sub></td><td align="center"><img src="images/map-desert-canyon.webp" width="200" alt="map-desert canyon"><br><sub><b>canyon</b></sub></td><td align="center"><img src="images/map-desert-cactus-flats.webp" width="200" alt="map-desert cactus-flats"><br><sub><b>cactus-flats</b></sub></td></tr>
</table>

**Variants:** `dunes`, `oasis`, `canyon`, `cactus-flats`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Island map <a id="map-island"></a>

`createObject('map-island', { variant: 'tropical' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-island-tropical.webp" width="200" alt="map-island tropical"><br><sub><b>tropical</b></sub></td><td align="center"><img src="images/map-island-atoll.webp" width="200" alt="map-island atoll"><br><sub><b>atoll</b></sub></td><td align="center"><img src="images/map-island-pirate-cove.webp" width="200" alt="map-island pirate-cove"><br><sub><b>pirate-cove</b></sub></td><td align="center"><img src="images/map-island-castaway.webp" width="200" alt="map-island castaway"><br><sub><b>castaway</b></sub></td></tr>
</table>

**Variants:** `tropical`, `atoll`, `pirate-cove`, `castaway`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Mountain map <a id="map-mountain"></a>

`createObject('map-mountain', { variant: 'pass' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-mountain-pass.webp" width="200" alt="map-mountain pass"><br><sub><b>pass</b></sub></td><td align="center"><img src="images/map-mountain-lake.webp" width="200" alt="map-mountain lake"><br><sub><b>lake</b></sub></td><td align="center"><img src="images/map-mountain-ski-resort.webp" width="200" alt="map-mountain ski-resort"><br><sub><b>ski-resort</b></sub></td><td align="center"><img src="images/map-mountain-quarry.webp" width="200" alt="map-mountain quarry"><br><sub><b>quarry</b></sub></td></tr>
</table>

**Variants:** `pass`, `lake`, `ski-resort`, `quarry`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Beach map <a id="map-beach"></a>

`createObject('map-beach', { variant: 'resort' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-beach-resort.webp" width="200" alt="map-beach resort"><br><sub><b>resort</b></sub></td><td align="center"><img src="images/map-beach-boardwalk.webp" width="200" alt="map-beach boardwalk"><br><sub><b>boardwalk</b></sub></td><td align="center"><img src="images/map-beach-surf.webp" width="200" alt="map-beach surf"><br><sub><b>surf</b></sub></td><td align="center"><img src="images/map-beach-quiet-cove.webp" width="200" alt="map-beach quiet-cove"><br><sub><b>quiet-cove</b></sub></td></tr>
</table>

**Variants:** `resort`, `boardwalk`, `surf`, `quiet-cove`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Harbor map <a id="map-harbor"></a>

`createObject('map-harbor', { variant: 'fishing' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-harbor-fishing.webp" width="200" alt="map-harbor fishing"><br><sub><b>fishing</b></sub></td><td align="center"><img src="images/map-harbor-container-port.webp" width="200" alt="map-harbor container-port"><br><sub><b>container-port</b></sub></td><td align="center"><img src="images/map-harbor-marina.webp" width="200" alt="map-harbor marina"><br><sub><b>marina</b></sub></td><td align="center"><img src="images/map-harbor-ferry.webp" width="200" alt="map-harbor ferry"><br><sub><b>ferry</b></sub></td></tr>
</table>

**Variants:** `fishing`, `container-port`, `marina`, `ferry`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Industrial zone map <a id="map-industrial"></a>

`createObject('map-industrial', { variant: 'factory' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-industrial-factory.webp" width="200" alt="map-industrial factory"><br><sub><b>factory</b></sub></td><td align="center"><img src="images/map-industrial-power-plant.webp" width="200" alt="map-industrial power-plant"><br><sub><b>power-plant</b></sub></td><td align="center"><img src="images/map-industrial-logistics.webp" width="200" alt="map-industrial logistics"><br><sub><b>logistics</b></sub></td><td align="center"><img src="images/map-industrial-junkyard.webp" width="200" alt="map-industrial junkyard"><br><sub><b>junkyard</b></sub></td></tr>
</table>

**Variants:** `factory`, `power-plant`, `logistics`, `junkyard`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Airport map <a id="map-airport"></a>

`createObject('map-airport', { variant: 'regional' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-airport-regional.webp" width="200" alt="map-airport regional"><br><sub><b>regional</b></sub></td><td align="center"><img src="images/map-airport-international.webp" width="200" alt="map-airport international"><br><sub><b>international</b></sub></td><td align="center"><img src="images/map-airport-airstrip.webp" width="200" alt="map-airport airstrip"><br><sub><b>airstrip</b></sub></td><td align="center"><img src="images/map-airport-heliport.webp" width="200" alt="map-airport heliport"><br><sub><b>heliport</b></sub></td></tr>
</table>

**Variants:** `regional`, `international`, `airstrip`, `heliport`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Military base map <a id="map-military"></a>

`createObject('map-military', { variant: 'outpost' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-military-outpost.webp" width="200" alt="map-military outpost"><br><sub><b>outpost</b></sub></td><td align="center"><img src="images/map-military-airfield.webp" width="200" alt="map-military airfield"><br><sub><b>airfield</b></sub></td><td align="center"><img src="images/map-military-checkpoint.webp" width="200" alt="map-military checkpoint"><br><sub><b>checkpoint</b></sub></td><td align="center"><img src="images/map-military-training-ground.webp" width="200" alt="map-military training-ground"><br><sub><b>training-ground</b></sub></td></tr>
</table>

**Variants:** `outpost`, `airfield`, `checkpoint`, `training-ground`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Racetrack map <a id="map-racetrack"></a>

`createObject('map-racetrack', { variant: 'oval' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-racetrack-oval.webp" width="200" alt="map-racetrack oval"><br><sub><b>oval</b></sub></td><td align="center"><img src="images/map-racetrack-circuit.webp" width="200" alt="map-racetrack circuit"><br><sub><b>circuit</b></sub></td><td align="center"><img src="images/map-racetrack-karting.webp" width="200" alt="map-racetrack karting"><br><sub><b>karting</b></sub></td><td align="center"><img src="images/map-racetrack-rally.webp" width="200" alt="map-racetrack rally"><br><sub><b>rally</b></sub></td></tr>
</table>

**Variants:** `oval`, `circuit`, `karting`, `rally`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Stadium district map <a id="map-stadium"></a>

`createObject('map-stadium', { variant: 'soccer' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-stadium-soccer.webp" width="200" alt="map-stadium soccer"><br><sub><b>soccer</b></sub></td><td align="center"><img src="images/map-stadium-ballpark.webp" width="200" alt="map-stadium ballpark"><br><sub><b>ballpark</b></sub></td><td align="center"><img src="images/map-stadium-arena.webp" width="200" alt="map-stadium arena"><br><sub><b>arena</b></sub></td><td align="center"><img src="images/map-stadium-festival.webp" width="200" alt="map-stadium festival"><br><sub><b>festival</b></sub></td></tr>
</table>

**Variants:** `soccer`, `ballpark`, `arena`, `festival`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Park map <a id="map-park"></a>

`createObject('map-park', { variant: 'city-park' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-park-city-park.webp" width="200" alt="map-park city-park"><br><sub><b>city-park</b></sub></td><td align="center"><img src="images/map-park-playground.webp" width="200" alt="map-park playground"><br><sub><b>playground</b></sub></td><td align="center"><img src="images/map-park-botanical.webp" width="200" alt="map-park botanical"><br><sub><b>botanical</b></sub></td><td align="center"><img src="images/map-park-lake-park.webp" width="200" alt="map-park lake-park"><br><sub><b>lake-park</b></sub></td></tr>
</table>

**Variants:** `city-park`, `playground`, `botanical`, `lake-park`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Campsite map <a id="map-campsite"></a>

`createObject('map-campsite', { variant: 'forest-camp' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-campsite-forest-camp.webp" width="200" alt="map-campsite forest-camp"><br><sub><b>forest-camp</b></sub></td><td align="center"><img src="images/map-campsite-lakeside.webp" width="200" alt="map-campsite lakeside"><br><sub><b>lakeside</b></sub></td><td align="center"><img src="images/map-campsite-desert-camp.webp" width="200" alt="map-campsite desert-camp"><br><sub><b>desert-camp</b></sub></td><td align="center"><img src="images/map-campsite-winter-camp.webp" width="200" alt="map-campsite winter-camp"><br><sub><b>winter-camp</b></sub></td></tr>
</table>

**Variants:** `forest-camp`, `lakeside`, `desert-camp`, `winter-camp`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Medieval town map <a id="map-medieval"></a>

`createObject('map-medieval', { variant: 'castle' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-medieval-castle.webp" width="200" alt="map-medieval castle"><br><sub><b>castle</b></sub></td><td align="center"><img src="images/map-medieval-market.webp" width="200" alt="map-medieval market"><br><sub><b>market</b></sub></td><td align="center"><img src="images/map-medieval-walled.webp" width="200" alt="map-medieval walled"><br><sub><b>walled</b></sub></td><td align="center"><img src="images/map-medieval-ruined.webp" width="200" alt="map-medieval ruined"><br><sub><b>ruined</b></sub></td></tr>
</table>

**Variants:** `castle`, `market`, `walled`, `ruined`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Ancient site map <a id="map-ancient"></a>

`createObject('map-ancient', { variant: 'greek' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-ancient-greek.webp" width="200" alt="map-ancient greek"><br><sub><b>greek</b></sub></td><td align="center"><img src="images/map-ancient-egyptian.webp" width="200" alt="map-ancient egyptian"><br><sub><b>egyptian</b></sub></td><td align="center"><img src="images/map-ancient-roman.webp" width="200" alt="map-ancient roman"><br><sub><b>roman</b></sub></td><td align="center"><img src="images/map-ancient-mesoamerican.webp" width="200" alt="map-ancient mesoamerican"><br><sub><b>mesoamerican</b></sub></td></tr>
</table>

**Variants:** `greek`, `egyptian`, `roman`, `mesoamerican`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Sci-fi colony map <a id="map-scifi"></a>

`createObject('map-scifi', { variant: 'mars-base' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-scifi-mars-base.webp" width="200" alt="map-scifi mars-base"><br><sub><b>mars-base</b></sub></td><td align="center"><img src="images/map-scifi-moon-base.webp" width="200" alt="map-scifi moon-base"><br><sub><b>moon-base</b></sub></td><td align="center"><img src="images/map-scifi-ice-planet.webp" width="200" alt="map-scifi ice-planet"><br><sub><b>ice-planet</b></sub></td><td align="center"><img src="images/map-scifi-spaceport.webp" width="200" alt="map-scifi spaceport"><br><sub><b>spaceport</b></sub></td></tr>
</table>

**Variants:** `mars-base`, `moon-base`, `ice-planet`, `spaceport`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Fantasy realm map <a id="map-fantasy"></a>

`createObject('map-fantasy', { variant: 'dragon-lair' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-fantasy-dragon-lair.webp" width="200" alt="map-fantasy dragon-lair"><br><sub><b>dragon-lair</b></sub></td><td align="center"><img src="images/map-fantasy-enchanted-forest.webp" width="200" alt="map-fantasy enchanted-forest"><br><sub><b>enchanted-forest</b></sub></td><td align="center"><img src="images/map-fantasy-wizard-tower.webp" width="200" alt="map-fantasy wizard-tower"><br><sub><b>wizard-tower</b></sub></td><td align="center"><img src="images/map-fantasy-crystal-valley.webp" width="200" alt="map-fantasy crystal-valley"><br><sub><b>crystal-valley</b></sub></td></tr>
</table>

**Variants:** `dragon-lair`, `enchanted-forest`, `wizard-tower`, `crystal-valley`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Swamp map <a id="map-swamp"></a>

`createObject('map-swamp', { variant: 'bayou' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-swamp-bayou.webp" width="200" alt="map-swamp bayou"><br><sub><b>bayou</b></sub></td><td align="center"><img src="images/map-swamp-mangrove.webp" width="200" alt="map-swamp mangrove"><br><sub><b>mangrove</b></sub></td><td align="center"><img src="images/map-swamp-bog.webp" width="200" alt="map-swamp bog"><br><sub><b>bog</b></sub></td><td align="center"><img src="images/map-swamp-haunted.webp" width="200" alt="map-swamp haunted"><br><sub><b>haunted</b></sub></td></tr>
</table>

**Variants:** `bayou`, `mangrove`, `bog`, `haunted`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Highway map <a id="map-highway"></a>

`createObject('map-highway', { variant: 'interchange' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-highway-interchange.webp" width="200" alt="map-highway interchange"><br><sub><b>interchange</b></sub></td><td align="center"><img src="images/map-highway-rest-stop.webp" width="200" alt="map-highway rest-stop"><br><sub><b>rest-stop</b></sub></td><td align="center"><img src="images/map-highway-toll-plaza.webp" width="200" alt="map-highway toll-plaza"><br><sub><b>toll-plaza</b></sub></td><td align="center"><img src="images/map-highway-truck-stop.webp" width="200" alt="map-highway truck-stop"><br><sub><b>truck-stop</b></sub></td></tr>
</table>

**Variants:** `interchange`, `rest-stop`, `toll-plaza`, `truck-stop`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Railway map <a id="map-railway"></a>

`createObject('map-railway', { variant: 'rural-halt' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-railway-rural-halt.webp" width="200" alt="map-railway rural-halt"><br><sub><b>rural-halt</b></sub></td><td align="center"><img src="images/map-railway-city-terminal.webp" width="200" alt="map-railway city-terminal"><br><sub><b>city-terminal</b></sub></td><td align="center"><img src="images/map-railway-freight-yard.webp" width="200" alt="map-railway freight-yard"><br><sub><b>freight-yard</b></sub></td><td align="center"><img src="images/map-railway-mountain-line.webp" width="200" alt="map-railway mountain-line"><br><sub><b>mountain-line</b></sub></td></tr>
</table>

**Variants:** `rural-halt`, `city-terminal`, `freight-yard`, `mountain-line`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Arctic map <a id="map-arctic"></a>

`createObject('map-arctic', { variant: 'research-base' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-arctic-research-base.webp" width="200" alt="map-arctic research-base"><br><sub><b>research-base</b></sub></td><td align="center"><img src="images/map-arctic-igloo-village.webp" width="200" alt="map-arctic igloo-village"><br><sub><b>igloo-village</b></sub></td><td align="center"><img src="images/map-arctic-glacier.webp" width="200" alt="map-arctic glacier"><br><sub><b>glacier</b></sub></td><td align="center"><img src="images/map-arctic-northern-town.webp" width="200" alt="map-arctic northern-town"><br><sub><b>northern-town</b></sub></td></tr>
</table>

**Variants:** `research-base`, `igloo-village`, `glacier`, `northern-town`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Theme park map <a id="map-themepark"></a>

`createObject('map-themepark', { variant: 'fun-fair' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-themepark-fun-fair.webp" width="200" alt="map-themepark fun-fair"><br><sub><b>fun-fair</b></sub></td><td align="center"><img src="images/map-themepark-water-park.webp" width="200" alt="map-themepark water-park"><br><sub><b>water-park</b></sub></td><td align="center"><img src="images/map-themepark-zoo.webp" width="200" alt="map-themepark zoo"><br><sub><b>zoo</b></sub></td><td align="center"><img src="images/map-themepark-mini-golf.webp" width="200" alt="map-themepark mini-golf"><br><sub><b>mini-golf</b></sub></td></tr>
</table>

**Variants:** `fun-fair`, `water-park`, `zoo`, `mini-golf`

| Option | Description |
|---|---|
| `seed` | layout variation |


### Campus map <a id="map-campus"></a>

`createObject('map-campus', { variant: 'university' })` · 4 versions · procedural JS

<table>
<tr><td align="center"><img src="images/map-campus-university.webp" width="200" alt="map-campus university"><br><sub><b>university</b></sub></td><td align="center"><img src="images/map-campus-high-school.webp" width="200" alt="map-campus high-school"><br><sub><b>high-school</b></sub></td><td align="center"><img src="images/map-campus-hospital.webp" width="200" alt="map-campus hospital"><br><sub><b>hospital</b></sub></td><td align="center"><img src="images/map-campus-civic-centre.webp" width="200" alt="map-campus civic-centre"><br><sub><b>civic-centre</b></sub></td></tr>
</table>

**Variants:** `university`, `high-school`, `hospital`, `civic-centre`

| Option | Description |
|---|---|
| `seed` | layout variation |


## Options every model accepts

| Option | Description |
|---|---|
| `variant` | Which version (see each type above) |
| `color` | Main color — CSS name (`'blue'`), hex (`'#ff0000'`) or number |
| `scale` | Uniform scale |
| `position` | `[x, y, z]` |
| `rotation` | Y rotation in radians, or `[x, y, z]` |
| `castShadow` / `receiveShadow` | Defaults `true` |
| `seed` | Number or string for models with random variation |

Units are metres. Models sit on the ground (y = 0). Vehicles face +X, everything else faces +Z.
