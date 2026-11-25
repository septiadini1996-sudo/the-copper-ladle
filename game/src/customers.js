// customers.js — who walks into The Copper Ladle and what they order. Six customer kinds,
// each with its own patience and tipping habits; an order is one recipe, a patience clock
// and a seat at the counter. Order generation lives here; the day loop lives in game.js.

import { recipesUpTo } from './recipes.js';

/**
 * The six customer kinds. `patience` is seconds before they walk out; `tip` is the fraction
 * of the dish price a fully patient customer adds; `minDay` gates the late-game kinds and
 * `minComponents` keeps the Critic ordering dishes worth reviewing.
 */
export const CUSTOMER_TYPES = [
  { id: 'student', name: 'Student', emoji: '🎓', patience: 95, tip: 0.10, weight: 3, minDay: 1 },
  { id: 'worker', name: 'Office Worker', emoji: '💼', patience: 75, tip: 0.15, weight: 3, minDay: 1 },
  { id: 'grandma', name: 'Neighbour Rosa', emoji: '👵', patience: 130, tip: 0.20, weight: 2, minDay: 1 },
  { id: 'tourist', name: 'Tourist', emoji: '🧳', patience: 48, tip: 0.20, weight: 2, minDay: 2 },
  { id: 'foodie', name: 'Foodie', emoji: '📸', patience: 58, tip: 0.30, weight: 2, minDay: 3 },
  { id: 'critic', name: 'The Critic', emoji: '🎩', patience: 65, tip: 0.60, weight: 1, minDay: 8, minComponents: 3 },
];

let nextOrderId = 1;

/** Pick a customer kind for the day, weighted, from those already unlocked. */
export function pickCustomerType(day, rng) {
  const pool = CUSTOMER_TYPES.filter((type) => type.minDay <= day);
  const total = pool.reduce((sum, type) => sum + type.weight, 0);
  let roll = rng() * total;
  for (const type of pool) {
    roll -= type.weight;
    if (roll <= 0) return type;
  }
  return pool[0];
}

/**
 * Make a fresh order for the day: a customer kind, a recipe they fancy (the Critic only
 * orders dishes with at least `minComponents` parts), and their patience stretched or
 * shrunk by the day's upgrades. `patienceScale` and `drainScale` come from the shop.
 */
export function makeOrder(day, rng, patienceScale = 1, drainScale = 1) {
  const type = pickCustomerType(day, rng);
  let menu = recipesUpTo(day);
  if (type.minComponents) {
    const worthy = menu.filter((recipe) => recipe.components.length >= type.minComponents);
    if (worthy.length > 0) menu = worthy;
  }
  // Favour the day's newer dishes a little, so unlocks get their moment.
  const fresh = menu.filter((recipe) => recipe.day >= day - 1);
  const pickFrom = fresh.length > 0 && rng() < 0.55 ? fresh : menu;
  const recipe = pickFrom[Math.floor(rng() * pickFrom.length)];
  const patience = type.patience * patienceScale;
  return {
    id: nextOrderId++,
    type,
    recipe,
    patience,
    patienceLeft: patience,
    drainScale,
    age: 0,
  };
}

/** Reset the order id counter (a fresh campaign, or a staged screenshot scene). */
export function resetOrderIds() {
  nextOrderId = 1;
}
