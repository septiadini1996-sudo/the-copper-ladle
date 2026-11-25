// kitchen.js — the working kitchen: five stations that transform raw ingredients, the
// assembly plates on the pass, and the one item the player holds in their hand. All of the
// click-to-cook rules live here; game.js owns the day, render.js only draws what is here.

import { BURN_GRACE, PERFECT_WINDOW } from './config.js';
import { PROCESSES } from './recipes.js';

/** The five stations, the process each performs, and how many items each holds at first. */
export const STATIONS = [
  { id: 'board', name: 'Chopping Board', emoji: '🔪', process: 'chop', baseSlots: 2 },
  { id: 'grill', name: 'Grill', emoji: '♨️', process: 'grill', baseSlots: 2 },
  { id: 'fryer', name: 'Fryer', emoji: '🍟', process: 'fry', baseSlots: 2 },
  { id: 'stove', name: 'Stove Pots', emoji: '🍲', process: 'boil', baseSlots: 2 },
  { id: 'oven', name: 'Oven', emoji: '🔥', process: 'bake', baseSlots: 1 },
];

/** The station that performs a process, or null for `none`. */
export function stationForProcess(process) {
  return STATIONS.find((station) => station.process === process) ?? null;
}

/**
 * A fresh kitchen for a day. Slot counts grow with the shop's upgrades (grill3, oven2,
 * plates3). A slot is null or { ingredient, process, elapsed, duration, announced }.
 * The hand is null or { ingredient, process, perfect } — what the player carries.
 */
export function createKitchen(upgrades) {
  const stations = {};
  for (const station of STATIONS) {
    let slots = station.baseSlots;
    if (station.id === 'grill' && upgrades.has('grill3')) slots = 3;
    if (station.id === 'oven' && upgrades.has('oven2')) slots = 2;
    stations[station.id] = { def: station, slots: Array(slots).fill(null) };
  }
  const plateCount = upgrades.has('plates3') ? 3 : 2;
  return {
    stations,
    plates: Array.from({ length: plateCount }, () => []),
    hand: null,
  };
}

/** How long a process takes, with the day's speed modifiers applied. */
export function processDuration(process, upgrades) {
  const base = PROCESSES[process].time;
  if (process === 'chop' && upgrades.has('knives')) return base * 0.6;
  return base;
}

/** The state of a cooking slot at its current elapsed time. */
export function slotState(slot, upgrades) {
  if (slot === null) return 'empty';
  const grace = BURN_GRACE + (upgrades.has('pans') ? 3 : 0);
  if (slot.elapsed < slot.duration) return 'cooking';
  if (slot.elapsed < slot.duration + PERFECT_WINDOW) return 'perfect';
  if (slot.elapsed < slot.duration + PERFECT_WINDOW + grace) return 'ready';
  return 'burnt';
}

/** Take a raw ingredient from the pantry into the hand. Returns false if the hand is full. */
export function pickupIngredient(kitchen, ingredient) {
  if (kitchen.hand !== null) return false;
  kitchen.hand = { ingredient, process: 'none', perfect: false };
  return true;
}

/**
 * Put the hand's raw ingredient onto a station slot and start it cooking. Only a raw
 * (unprocessed) ingredient can start a process. Returns 'started', 'busy' (no free slot),
 * 'not-raw' or 'empty-hand'.
 */
export function startOnStation(kitchen, stationId, upgrades) {
  if (kitchen.hand === null) return 'empty-hand';
  if (kitchen.hand.process !== 'none') return 'not-raw';
  const station = kitchen.stations[stationId];
  const index = station.slots.indexOf(null);
  if (index === -1) return 'busy';
  station.slots[index] = {
    ingredient: kitchen.hand.ingredient,
    process: station.def.process,
    elapsed: 0,
    duration: processDuration(station.def.process, upgrades),
    announced: false,
  };
  kitchen.hand = null;
  return 'started';
}

/**
 * Click a station slot: a burnt item is thrown away, a finished one goes to the hand
 * (keeping whether it was lifted inside its perfect window), a cooking one stays put.
 * Returns 'trashed', 'took', 'cooking' or 'empty'.
 */
export function clickSlot(kitchen, stationId, slotIndex, upgrades) {
  const station = kitchen.stations[stationId];
  const slot = station.slots[slotIndex];
  if (slot === null || slot === undefined) return 'empty';
  const state = slotState(slot, upgrades);
  if (state === 'burnt') {
    station.slots[slotIndex] = null;
    return 'trashed';
  }
  if (state === 'cooking') return 'cooking';
  if (kitchen.hand !== null) return 'hand-full';
  kitchen.hand = {
    ingredient: slot.ingredient,
    process: slot.process,
    perfect: state === 'perfect',
  };
  station.slots[slotIndex] = null;
  return 'took';
}

/** Plate the hand's item onto a plate. Returns false if the hand is empty. */
export function plateHandItem(kitchen, plateIndex) {
  if (kitchen.hand === null) return false;
  kitchen.plates[plateIndex].push({ ...kitchen.hand });
  kitchen.hand = null;
  return true;
}

/** Throw away whatever the hand holds. Returns false if it held nothing. */
export function trashHand(kitchen) {
  if (kitchen.hand === null) return false;
  kitchen.hand = null;
  return true;
}

/** Empty a plate back to the pass (its contents are lost). */
export function clearPlate(kitchen, plateIndex) {
  kitchen.plates[plateIndex] = [];
}

/**
 * Advance every station by `dt` seconds. Returns the events that happened —
 * { type: 'ready' | 'burnt', stationId, slotIndex } — so the caller can ding, buzz
 * and flash at the right moments; a slot announces each transition only once.
 */
export function updateKitchen(kitchen, dt, upgrades) {
  const events = [];
  for (const station of Object.values(kitchen.stations)) {
    station.slots.forEach((slot, slotIndex) => {
      if (slot === null) return;
      const before = slotState(slot, upgrades);
      slot.elapsed += dt;
      const after = slotState(slot, upgrades);
      if (before === 'cooking' && after !== 'cooking') {
        events.push({ type: 'ready', stationId: station.def.id, slotIndex });
      } else if (after === 'burnt' && before !== 'burnt') {
        events.push({ type: 'burnt', stationId: station.def.id, slotIndex });
      }
    });
  }
  return events;
}
