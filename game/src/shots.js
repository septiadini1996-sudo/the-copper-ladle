// shots.js — the staged scenes behind ?shot=service|assembly|shop|summary. Each one builds
// a real game state with the game's own rules and data (real orders, real plates, real
// station slots at real elapsed times), so a screenshot is the game itself, frozen at a
// good moment — never a mock-up. A seeded rng keeps the staging stable.

import { CUSTOMER_TYPES } from './customers.js';
import { SCREEN_PLAY, SCREEN_SHOP, SCREEN_SUMMARY } from './game.js';
import { createKitchen } from './kitchen.js';
import { RECIPES } from './recipes.js';

function recipe(id) {
  return RECIPES.find((entry) => entry.id === id);
}

function order(typeId, recipeId, patienceShare) {
  const type = CUSTOMER_TYPES.find((entry) => entry.id === typeId);
  return {
    id: 0,
    type,
    recipe: recipe(recipeId),
    patience: type.patience,
    patienceLeft: type.patience * patienceShare,
    drainScale: 1,
    age: 10,
  };
}

function slot(ingredient, process, elapsed, duration) {
  return { ingredient, process, elapsed, duration, announced: true };
}

function plateOf(...parts) {
  return parts.map(([ingredient, process, perfect]) => ({ ingredient, process, perfect: Boolean(perfect) }));
}

/** Day 5, mid-rush: three tickets up, a burger mid-assembly, a salad ready to serve. */
function stageService(game) {
  game.day = 5;
  game.bank = 386;
  game.totalEarned = 905;
  game.dayEarned = 132;
  game.dayTimeLeft = 87;
  game.kitchen = createKitchen(game.upgrades);
  game.orders = [
    order('foodie', 'grilled-salmon', 0.72),
    order('worker', 'classic-burger', 0.55),
    order('grandma', 'garden-salad', 0.9),
  ];
  const kitchen = game.kitchen;
  kitchen.stations.grill.slots[0] = slot('salmon', 'grill', 2.6, 4.2);
  kitchen.stations.grill.slots[1] = slot('beef', 'grill', 4.9, 4.2);
  kitchen.stations.board.slots[0] = slot('tomato', 'chop', 1.1, 2.2);
  kitchen.stations.fryer.slots[0] = slot('mushroom', 'fry', 3.9, 3.6);
  kitchen.stations.oven.slots[0] = slot('bread', 'bake', 6.4, 6.0);
  kitchen.plates[0] = plateOf(['bun', 'none'], ['beef', 'grill', true], ['cheese', 'none']);
  kitchen.plates[1] = plateOf(['lettuce', 'chop', true], ['tomato', 'chop'], ['cucumber', 'chop'], ['dressing', 'none']);
  kitchen.hand = { ingredient: 'lettuce', process: 'chop', perfect: true };
  game.screen = SCREEN_PLAY;
}

/** Day 7: a steak plate half built, one dish ready on the stove, one casualty on the grill. */
function stageAssembly(game) {
  game.day = 7;
  game.bank = 512;
  game.totalEarned = 1610;
  game.dayEarned = 208;
  game.dayTimeLeft = 64;
  game.upgrades = new Set(['knives', 'plates3']);
  game.kitchen = createKitchen(game.upgrades);
  game.orders = [
    order('critic', 'beef-steak', 0.62),
    order('tourist', 'sushi-platter', 0.38),
    order('student', 'french-fries', 0.8),
  ];
  const kitchen = game.kitchen;
  kitchen.stations.grill.slots[0] = slot('beef', 'grill', 3.4, 4.2);
  kitchen.stations.grill.slots[1] = slot('mushroom', 'fry', 12.5, 3.6);
  kitchen.stations.stove.slots[0] = slot('rice', 'boil', 5.6, 5.0);
  kitchen.stations.fryer.slots[0] = slot('potato', 'fry', 1.8, 3.6);
  kitchen.stations.board.slots[0] = slot('cucumber', 'chop', 0.7, 1.32);
  kitchen.plates[0] = plateOf(['beef', 'grill', true], ['potato', 'fry']);
  kitchen.plates[1] = plateOf(['rice', 'boil', true], ['salmon', 'none']);
  kitchen.plates[2] = plateOf(['potato', 'fry', true]);
  kitchen.hand = { ingredient: 'pepper', process: 'none', perfect: false };
  game.screen = SCREEN_PLAY;
}

/** The night market after day 3, two upgrades already hanging in the kitchen. */
function stageShop(game) {
  game.day = 3;
  game.bank = 420;
  game.totalEarned = 310;
  game.upgrades = new Set(['knives']);
  game.lastSummary = { day: 3, earned: 168, goal: 140, served: 9, walkouts: 1, perfect: 2, met: true };
  game.screen = SCREEN_SHOP;
}

/** The day 6 summary card: goal beaten, the till counted. */
function stageSummary(game) {
  game.day = 6;
  game.bank = 655;
  game.totalEarned = 1240;
  game.upgrades = new Set(['knives', 'plates3']);
  game.lastSummary = { day: 6, earned: 356, goal: 320, served: 13, walkouts: 1, perfect: 4, met: true };
  game.screen = SCREEN_SUMMARY;
}

const SCENES = {
  service: stageService,
  assembly: stageAssembly,
  shop: stageShop,
  summary: stageSummary,
};

/** Put `game` into the named scene (an unknown name stages the service rush). */
export function stageShot(game, name) {
  (SCENES[name] ?? stageService)(game);
  game.paused = false;
  game.toast = null;
  game.floaters = [];
}
