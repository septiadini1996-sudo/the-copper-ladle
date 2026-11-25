// game.js — the campaign of The Copper Ladle as a state machine: title, day intro, the
// service rush, the day summary, the night shop, game over and victory. It owns the day
// clock, the customers' patience, the money and the score; the kitchen mechanics live in
// kitchen.js and all drawing in render.js.

import * as audio from './audio.js';
import { DAY_INTROS, DAYS, MAX_ACTIVE_ORDERS, TOTAL_DAYS, UPGRADES } from './config.js';
import { makeOrder } from './customers.js';
import { createKitchen, updateKitchen } from './kitchen.js';
import { plateMatches } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_INTRO = 'intro';
export const SCREEN_PLAY = 'play';
export const SCREEN_SUMMARY = 'summary';
export const SCREEN_SHOP = 'shop';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

/** A brand-new campaign in its title-screen state. `rng` is injectable for staged scenes. */
export function createGame(rng = Math.random) {
  return {
    rng,
    screen: SCREEN_TITLE,
    paused: false,
    day: 1,
    bank: 0,
    totalEarned: 0,
    upgrades: new Set(),
    kitchen: createKitchen(new Set()),
    orders: [],
    dayTimeLeft: 0,
    dayEarned: 0,
    servedToday: 0,
    walkoutsToday: 0,
    perfectToday: 0,
    spawnTimer: 0,
    toast: null,
    floaters: [],
    lastSummary: null,
    muted: false,
  };
}

/** Show a short message in the toast bar under the kitchen. */
export function say(game, text, seconds = 2.4) {
  game.toast = { text, left: seconds };
}

/** Begin (or restart) the whole campaign from day 1. */
export function startCampaign(game) {
  game.day = 1;
  game.bank = 0;
  game.totalEarned = 0;
  game.upgrades = new Set();
  beginDay(game);
}

/** Set up the current day and show its story card. */
export function beginDay(game) {
  const config = DAYS[game.day - 1];
  game.kitchen = createKitchen(game.upgrades);
  game.orders = [];
  game.dayTimeLeft = config.seconds;
  game.dayEarned = 0;
  game.servedToday = 0;
  game.walkoutsToday = 0;
  game.perfectToday = 0;
  game.spawnTimer = 1.2;
  game.paused = false;
  game.screen = SCREEN_INTRO;
}

/** Open the doors: the intro card gives way to the rush. */
export function openDoors(game) {
  game.screen = SCREEN_PLAY;
  say(game, 'Service! First customers are on their way…', 3);
}

/** The patience multiplier and drain rate the shop's comforts give today's customers. */
function patienceScale(game) {
  return game.upgrades.has('stools') ? 1.25 : 1;
}
function drainScale(game) {
  return game.upgrades.has('radio') ? 0.8 : 1;
}

/** Spawn a customer if a stool is free and the spawn clock has run down. */
function maybeSpawn(game, dt) {
  game.spawnTimer -= dt;
  if (game.spawnTimer > 0 || game.orders.length >= MAX_ACTIVE_ORDERS) return;
  const config = DAYS[game.day - 1];
  game.orders.push(makeOrder(game.day, game.rng, patienceScale(game), drainScale(game)));
  game.spawnTimer = config.spawnMin + game.rng() * (config.spawnMax - config.spawnMin);
}

/** Drain patience; a customer at zero leaves, and the day remembers it. */
function updateOrders(game, dt) {
  for (const order of [...game.orders]) {
    order.age += dt;
    order.patienceLeft -= dt * order.drainScale;
    if (order.patienceLeft <= 0) {
      game.orders.splice(game.orders.indexOf(order), 1);
      game.walkoutsToday += 1;
      audio.playWalkout();
      say(game, `${order.type.name} waited too long and left!`, 2.4);
    }
  }
}

/** Add a floating "+34 🪙" style note at a screen position. */
export function addFloater(game, x, y, text, colour = '#ffd94d') {
  game.floaters.push({ x, y, text, colour, age: 0 });
}

/**
 * Serve an order with a plate: the money moment. Pay is the dish price plus a tip that
 * follows the customer's remaining patience (and their kind's generosity); a plate whose
 * every part was lifted in its perfect window earns the full tip twice over.
 */
export function completeServe(game, order, plateIndex, x = 640, y = 300) {
  const plate = game.kitchen.plates[plateIndex];
  const perfectDish = plate.length > 0 && plate.every((part) => part.perfect);
  const patienceShare = Math.max(0, order.patienceLeft / order.patience);
  let tip = order.recipe.price * order.type.tip * patienceShare;
  if (perfectDish) tip *= 2;
  if (game.upgrades.has('ladle')) tip *= 1.5;
  const pay = order.recipe.price + Math.round(tip);
  game.dayEarned += pay;
  game.bank += pay;
  game.totalEarned += pay;
  game.servedToday += 1;
  if (perfectDish) game.perfectToday += 1;
  game.kitchen.plates[plateIndex] = [];
  game.orders.splice(game.orders.indexOf(order), 1);
  audio.playCoins();
  addFloater(game, x, y, `+${pay} 🪙`, perfectDish ? '#7dff8a' : '#ffd94d');
  if (perfectDish) addFloater(game, x, y - 26, 'PERFECT DISH! ★', '#7dff8a');
  return pay;
}

/** Try to serve one specific order with whichever plate matches its ticket. */
export function tryServeOrder(game, order, x, y) {
  const plateIndex = game.kitchen.plates.findIndex((plate) => plateMatches(plate, order.recipe));
  if (plateIndex === -1) {
    say(game, `No plate matches the ${order.recipe.name} ticket yet.`, 2);
    return false;
  }
  completeServe(game, order, plateIndex, x, y);
  return true;
}

/** Try to serve whichever waiting order a plate matches. */
export function tryServePlate(game, plateIndex, x, y) {
  const plate = game.kitchen.plates[plateIndex];
  if (plate.length === 0) return false;
  const order = game.orders.find((candidate) => plateMatches(plate, candidate.recipe));
  if (!order) {
    say(game, 'That plate matches no waiting ticket — check the order board.', 2.2);
    return false;
  }
  completeServe(game, order, plateIndex, x, y);
  return true;
}

/** Close the day: goal met means summary (and the shop, or victory on day 12); missed means over. */
export function endDay(game) {
  const config = DAYS[game.day - 1];
  const met = game.dayEarned >= config.goal;
  game.lastSummary = {
    day: game.day,
    earned: game.dayEarned,
    goal: config.goal,
    served: game.servedToday,
    walkouts: game.walkoutsToday,
    perfect: game.perfectToday,
    met,
  };
  audio.playDayEnd();
  if (!met) {
    game.screen = SCREEN_OVER;
  } else if (game.day >= TOTAL_DAYS) {
    game.screen = SCREEN_VICTORY;
  } else {
    game.screen = SCREEN_SUMMARY;
  }
}

/** Buy an upgrade in the night shop. Returns false when owned or unaffordable. */
export function buyUpgrade(game, upgradeId) {
  const upgrade = UPGRADES.find((entry) => entry.id === upgradeId);
  if (!upgrade || game.upgrades.has(upgradeId) || game.bank < upgrade.price) return false;
  game.bank -= upgrade.price;
  game.upgrades.add(upgradeId);
  audio.playCoins();
  return true;
}

/** From the summary to the shop, and from the shop to the next day's intro card. */
export function goToShop(game) {
  game.screen = SCREEN_SHOP;
}
export function startNextDay(game) {
  game.day += 1;
  beginDay(game);
}

/** The day's contextual hint, shown on day 1 and whenever the kitchen is quiet. */
export function hintFor(game) {
  if (game.screen !== SCREEN_PLAY) return null;
  const kitchen = game.kitchen;
  const anyCooking = Object.values(kitchen.stations).some((station) => station.slots.some((slot) => slot !== null));
  if (game.orders.length === 0) return 'Customers are coming — keep the stations warm.';
  if (kitchen.hand === null && !anyCooking) return 'Click an ingredient bin in the pantry to pick it up.';
  if (kitchen.hand !== null && kitchen.hand.process === 'none') return 'Click a station to start it, or a plate to add it as-is.';
  if (kitchen.hand !== null) return 'Click a plate on the pass to add what you are holding.';
  if (kitchen.plates.some((plate) => plate.length > 0)) return 'Finish the plate to match a ticket, then click the ticket to serve.';
  if (anyCooking) return 'Watch the rings: gold is perfect, red means it is about to burn.';
  return null;
}

/** Advance the whole game by `dt` seconds. Only the play screen simulates. */
export function update(game, dt) {
  if (game.toast) {
    game.toast.left -= dt;
    if (game.toast.left <= 0) game.toast = null;
  }
  for (const floater of [...game.floaters]) {
    floater.age += dt;
    floater.y -= dt * 34;
    if (floater.age > 1.4) game.floaters.splice(game.floaters.indexOf(floater), 1);
  }
  if (game.screen !== SCREEN_PLAY || game.paused) return;
  maybeSpawn(game, dt);
  updateOrders(game, dt);
  for (const event of updateKitchen(game.kitchen, dt, game.upgrades)) {
    if (event.type === 'ready') audio.playReadyDing();
    if (event.type === 'burnt') {
      audio.playBurnt();
      say(game, 'Something burned! Click it to throw it away.', 2.2);
    }
  }
  game.dayTimeLeft -= dt;
  if (game.dayTimeLeft <= 0) {
    game.dayTimeLeft = 0;
    endDay(game);
  }
}
