// input.js — every click and keypress, routed to the game. Geometry comes from layout.js,
// so a click lands exactly where render.js drew the thing. Sounds for the hands live here;
// sounds for the day's events (coins, walkouts, dings) live with the events in game.js.

import * as audio from './audio.js';
import {
  SCREEN_INTRO, SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_SUMMARY, SCREEN_TITLE, SCREEN_VICTORY,
  beginDay, buyUpgrade, goToShop, openDoors, say, startCampaign, startNextDay, tryServeOrder, tryServePlate,
} from './game.js';
import { STATIONS, clearPlate, clickSlot, pickupIngredient, plateHandItem, startOnStation, trashHand } from './kitchen.js';
import * as L from './layout.js';
import { UPGRADES } from './config.js';
import { pantryFor } from './recipes.js';

/** Clicks during service: the whole cooking loop. */
function clickPlay(game, x, y) {
  if (L.inside(x, y, L.PAUSE_BTN)) {
    game.paused = !game.paused;
    return;
  }
  if (L.inside(x, y, L.MUTE_BTN)) {
    game.muted = audio.toggleMuted();
    return;
  }
  if (game.paused) return;
  const kitchen = game.kitchen;

  // Tickets: serve the clicked order with any plate that matches it.
  for (let index = 0; index < game.orders.length; index += 1) {
    if (L.inside(x, y, L.ticketRect(index))) {
      tryServeOrder(game, game.orders[index], x, y);
      return;
    }
  }

  // Stations: with a raw ingredient in hand, a click anywhere on the panel starts it;
  // with an empty hand, a click on a slot lifts (or bins) what is there.
  for (let s = 0; s < STATIONS.length; s += 1) {
    const station = STATIONS[s];
    if (!L.inside(x, y, L.stationRect(s))) continue;
    if (kitchen.hand !== null && kitchen.hand.process === 'none') {
      const result = startOnStation(kitchen, station.id, game.upgrades);
      if (result === 'started') {
        if (station.id === 'board') audio.playChop();
        else audio.playSizzleStart();
      } else if (result === 'busy') {
        say(game, `The ${station.name.toLowerCase()} is full!`, 1.8);
      }
      return;
    }
    const slots = kitchen.stations[station.id].slots;
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      if (!L.inside(x, y, L.slotRect(s, slotIndex, slots.length))) continue;
      const result = clickSlot(kitchen, station.id, slotIndex, game.upgrades);
      if (result === 'took') audio.playPickup();
      else if (result === 'trashed') audio.playBurnt();
      else if (result === 'hand-full') say(game, 'Your hand is full — plate or trash it first.', 1.8);
      return;
    }
    return;
  }

  // Plates: the ✕ clears, a held item plates, an empty-handed click tries to serve.
  for (let index = 0; index < kitchen.plates.length; index += 1) {
    if (L.inside(x, y, L.plateClearRect(index)) && kitchen.plates[index].length > 0) {
      clearPlate(kitchen, index);
      audio.playBurnt();
      return;
    }
    if (!L.inside(x, y, L.plateRect(index))) continue;
    if (kitchen.hand !== null) {
      if (plateHandItem(kitchen, index)) audio.playPickup();
    } else {
      tryServePlate(game, index, x, y);
    }
    return;
  }

  // Trash: whatever the hand holds goes in the bin.
  if (L.inside(x, y, L.TRASH)) {
    if (trashHand(kitchen)) audio.playBurnt();
    return;
  }

  // Pantry bins: pick a raw ingredient up.
  const pantry = pantryFor(game.day);
  for (let index = 0; index < pantry.length; index += 1) {
    if (!L.inside(x, y, L.pantryBinRect(index))) continue;
    if (pickupIngredient(kitchen, pantry[index])) audio.playPickup();
    else say(game, 'Your hand is full — one thing at a time.', 1.8);
    return;
  }
}

/** Clicks on the menu screens: one clear button each, plus the shop's cards. */
function clickMenu(game, x, y) {
  if (game.screen === SCREEN_TITLE && L.inside(x, y, L.PRIMARY_BTN)) startCampaign(game);
  else if (game.screen === SCREEN_INTRO && L.inside(x, y, L.PRIMARY_BTN)) openDoors(game);
  else if (game.screen === SCREEN_SUMMARY && L.inside(x, y, L.PRIMARY_BTN)) goToShop(game);
  else if (game.screen === SCREEN_VICTORY && L.inside(x, y, L.PRIMARY_BTN)) startCampaign(game);
  else if (game.screen === SCREEN_OVER) {
    if (L.inside(x, y, L.PRIMARY_BTN)) beginDay(game);
    else if (L.inside(x, y, L.SECONDARY_BTN)) startCampaign(game);
  } else if (game.screen === SCREEN_SHOP) {
    for (let index = 0; index < UPGRADES.length; index += 1) {
      if (L.inside(x, y, L.shopCardRect(index))) {
        buyUpgrade(game, UPGRADES[index].id);
        return;
      }
    }
    if (L.inside(x, y, L.SHOP_NEXT_BTN)) startNextDay(game);
  }
}

/** Route one click at canvas coordinates (x, y). */
export function handleClick(game, x, y) {
  if (game.screen === SCREEN_PLAY) clickPlay(game, x, y);
  else clickMenu(game, x, y);
}

/** Keyboard: P or Esc pauses service, M mutes, Enter/Space presses the menu's main button. */
export function handleKey(game, key) {
  if ((key === 'p' || key === 'P' || key === 'Escape') && game.screen === SCREEN_PLAY) {
    game.paused = !game.paused;
  } else if (key === 'm' || key === 'M') {
    game.muted = audio.toggleMuted();
  } else if ((key === 'Enter' || key === ' ') && game.screen !== SCREEN_PLAY) {
    clickMenu(game, L.PRIMARY_BTN.x + 10, L.PRIMARY_BTN.y + 10);
  }
}
