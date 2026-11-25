// config.js — the campaign shape of The Copper Ladle: the twelve days, their coin goals and
// rush pressure, and the upgrade shelf the player buys from between days. Data only.

export const VIEW = { width: 1280, height: 800 };

export const TOTAL_DAYS = 12;

/** The loan the family must repay: clear every day's goal to keep the diner. */
export const LOAN_TOTAL = 4990;

/**
 * One row per day: the coin goal for the day, the day's length in seconds, and how often a
 * new customer walks in (a random gap between `spawnMin` and `spawnMax` seconds).
 */
export const DAYS = [
  { goal: 70, seconds: 135, spawnMin: 7.0, spawnMax: 10.0 },
  { goal: 100, seconds: 140, spawnMin: 6.2, spawnMax: 9.0 },
  { goal: 140, seconds: 145, spawnMin: 5.6, spawnMax: 8.2 },
  { goal: 190, seconds: 150, spawnMin: 5.0, spawnMax: 7.4 },
  { goal: 250, seconds: 150, spawnMin: 4.6, spawnMax: 6.8 },
  { goal: 320, seconds: 155, spawnMin: 4.2, spawnMax: 6.2 },
  { goal: 400, seconds: 155, spawnMin: 3.9, spawnMax: 5.8 },
  { goal: 490, seconds: 160, spawnMin: 3.6, spawnMax: 5.4 },
  { goal: 590, seconds: 160, spawnMin: 3.4, spawnMax: 5.0 },
  { goal: 700, seconds: 165, spawnMin: 3.2, spawnMax: 4.8 },
  { goal: 820, seconds: 165, spawnMin: 3.0, spawnMax: 4.5 },
  { goal: 960, seconds: 170, spawnMin: 2.8, spawnMax: 4.2 },
];

/** At most this many customers wait at once; the rest queue outside until a stool frees. */
export const MAX_ACTIVE_ORDERS = 4;

/** Seconds after a dish is done during which it counts as perfect, then until it burns. */
export const PERFECT_WINDOW = 2.5;
export const BURN_GRACE = 5.5;

/** The upgrade shelf. `id` keys the owned set; prices are paid from the bank between days. */
export const UPGRADES = [
  { id: 'knives', name: 'Sharp Knives', emoji: '🔪', price: 150, blurb: 'Chopping is 40% faster.' },
  { id: 'plates3', name: 'Third Plate', emoji: '🍽️', price: 180, blurb: 'A third assembly plate on the pass.' },
  { id: 'pans', name: 'Non-Stick Pans', emoji: '🍳', price: 170, blurb: 'Food takes 3 s longer to burn.' },
  { id: 'stools', name: 'Comfy Stools', emoji: '🪑', price: 200, blurb: 'Customers wait 25% longer.' },
  { id: 'grill3', name: 'Extra Grill Plate', emoji: '♨️', price: 220, blurb: 'The grill holds 3 items at once.' },
  { id: 'radio', name: 'Diner Radio', emoji: '📻', price: 240, blurb: 'Patience drains 20% slower.' },
  { id: 'oven2', name: 'Twin Oven', emoji: '🔥', price: 260, blurb: 'The oven holds 2 items at once.' },
  { id: 'ladle', name: 'The Golden Ladle', emoji: '🥄', price: 500, blurb: 'All tips grow by 50%. Pure morale.' },
];

/** Story cards shown before each day begins; later days reuse the last card's spirit. */
export const DAY_INTROS = [
  'The bank letter says twelve days. Grandma Rosa built this diner with one copper ladle and a stubborn streak — the streak, at least, is inherited. Day one: open the doors.',
  'Word travels. The lunch crowd found us, and the menu grows.',
  'A bus driver asked for "the burger everyone mentions". There is no burger yet. There is now.',
  'Pizza day. Rosa is pretending not to watch you work the oven.',
  'The fishmonger left salmon "for the family". The family is everyone who walks in.',
  'Halfway to the halfway mark. The curry smell reached the next street.',
  'A food column mentioned "a tiny diner with unreasonable steak". No pressure.',
  'The critic from the Gazette has been spotted in the neighbourhood. Polish the plates.',
  'Lobster, at our prices? Rosa laughed for a full minute. Then she showed you the bisque.',
  'The duck man cometh, and he accepts no substitutes. Neither do we.',
  'Eleven days in, the regulars have started calling it "our diner" again.',
  'The last day. Everything Rosa ever taught you is on the menu tonight. Cook like it.',
];
