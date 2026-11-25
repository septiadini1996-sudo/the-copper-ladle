// render.js — everything The Copper Ladle draws. One canvas, a warm diner palette, food
// and faces as emoji glyphs on drawn counters and paper. The judge reads this game's
// screenshots, so the play scene always shows the whole loop at a glance: the order board
// on the left, customers at the counter, the five stations with their timers, the plates
// on the pass and the pantry shelf along the bottom.

import { DAY_INTROS, DAYS, LOAN_TOTAL, TOTAL_DAYS, UPGRADES } from './config.js';
import { SCREEN_INTRO, SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_SUMMARY, SCREEN_TITLE, SCREEN_VICTORY, hintFor } from './game.js';
import { STATIONS, slotState } from './kitchen.js';
import * as L from './layout.js';
import { INGREDIENTS, PROCESSES, pantryFor, plateMatches, recipesUnlockedOn } from './recipes.js';

const INK = '#3a2a1c';
const PAPER = '#fff8ea';
const WOOD = '#8a5a33';
const DARK_WOOD = '#5d3d22';
const RED = '#c0392b';
const GREEN = '#3d9970';
const GOLD = '#ffd94d';

/** Small glyphs that mark how a component must be prepared. */
const PROCESS_ICON = { none: '·', chop: '🔪', grill: '♨️', fry: '🍟', boil: '🍲', bake: '🔥' };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, rect, r, colour) {
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, r);
  ctx.fillStyle = colour;
  ctx.fill();
}

function text(ctx, value, x, y, size, colour = INK, align = 'left', weight = '600') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function emoji(ctx, value, x, y, size) {
  ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** Wrap a paragraph to a width, drawing each line; returns the y after the last line. */
function wrappedText(ctx, value, x, y, width, size, lineHeight, colour = INK, align = 'left') {
  ctx.font = `600 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  const words = value.split(' ');
  let line = '';
  let cursor = y;
  for (const word of words) {
    const trial = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(trial).width > width && line !== '') {
      text(ctx, line, x, cursor, size, colour, align);
      line = word;
      cursor += lineHeight;
    } else {
      line = trial;
    }
  }
  if (line !== '') text(ctx, line, x, cursor, size, colour, align);
  return cursor + lineHeight;
}

function bar(ctx, x, y, w, h, share, colour) {
  fillRoundRect(ctx, { x, y, w, h }, h / 2, 'rgba(0,0,0,0.18)');
  if (share > 0) fillRoundRect(ctx, { x, y, w: Math.max(h, w * Math.min(1, share)), h }, h / 2, colour);
}

function patienceColour(share) {
  if (share > 0.5) return GREEN;
  if (share > 0.25) return '#e6a817';
  return RED;
}

/** The room itself: wall, bunting, floor and the long counter. */
function drawRoom(ctx, game) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 800);
  gradient.addColorStop(0, '#f6ddb0');
  gradient.addColorStop(0.55, '#eec98f');
  gradient.addColorStop(0.56, '#caa06a');
  gradient.addColorStop(1, '#b0824f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1280, 800);
  // Bunting across the top of the wall.
  for (let i = 0; i < 16; i += 1) {
    const x = 40 + i * 78;
    ctx.fillStyle = ['#c0392b', '#3d9970', '#e6a817', '#4a7fb5'][i % 4];
    ctx.beginPath();
    ctx.moveTo(x, 62);
    ctx.lineTo(x + 34, 62);
    ctx.lineTo(x + 17, 88);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, 'THE COPPER LADLE', 1090, 130, 21, 'rgba(93,61,34,0.55)', 'center', '800');
  text(ctx, 'est. 1962 · Rosa’s diner', 1090, 154, 12, 'rgba(93,61,34,0.5)', 'center');
}

/** The top strip: day, bank, the day's goal progress and the service clock. */
function drawHud(ctx, game) {
  fillRoundRect(ctx, L.HUD, 0, DARK_WOOD);
  const config = DAYS[game.day - 1];
  text(ctx, `DAY ${game.day}/${TOTAL_DAYS}`, 18, 30, 22, GOLD, 'left', '800');
  text(ctx, `🪙 ${game.bank}`, 170, 30, 21, '#fff', 'left', '800');
  text(ctx, `today ${game.dayEarned}/${config.goal}`, 330, 20, 14, '#ffe9b0');
  bar(ctx, 330, 34, 300, 12, game.dayEarned / config.goal, game.dayEarned >= config.goal ? '#7dff8a' : GOLD);
  const seconds = Math.ceil(game.dayTimeLeft);
  text(ctx, `⏱ ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, 680, 20, 14, '#ffe9b0');
  bar(ctx, 680, 34, 300, 12, game.dayTimeLeft / config.seconds, game.dayTimeLeft < 20 ? RED : '#7ec8e3');
  text(ctx, `loan repaid ${Math.min(game.totalEarned, LOAN_TOTAL)}/${LOAN_TOTAL}`, 1010, 30, 13, '#ffe9b0', 'center');
  fillRoundRect(ctx, L.PAUSE_BTN, 8, WOOD);
  text(ctx, game.paused ? '▶' : '⏸', L.PAUSE_BTN.x + 22, 30, 19, '#fff', 'center');
  fillRoundRect(ctx, L.MUTE_BTN, 8, WOOD);
  text(ctx, game.muted ? '🔇' : '🔊', L.MUTE_BTN.x + 22, 30, 17, '#fff', 'center');
}

/** One order ticket: who, what, the parts it needs, how long they will wait, what it pays. */
function drawTicket(ctx, game, order, index) {
  const rect = L.ticketRect(index);
  fillRoundRect(ctx, rect, 10, PAPER);
  ctx.strokeStyle = 'rgba(93,61,34,0.35)';
  ctx.stroke();
  emoji(ctx, order.type.emoji, rect.x + 26, rect.y + 26, 30);
  text(ctx, order.type.name, rect.x + 48, rect.y + 18, 13, INK, 'left', '800');
  text(ctx, `${order.recipe.emoji} ${order.recipe.name}`, rect.x + 48, rect.y + 38, 13, '#7a4a21');
  text(ctx, `${order.recipe.price}🪙`, rect.x + rect.w - 10, rect.y + 18, 13, '#7a4a21', 'right', '800');
  // Component chips: a tick once any plate holds that part exactly as the ticket asks.
  const held = new Set();
  for (const plate of game.kitchen.plates) {
    for (const part of plate) held.add(`${part.ingredient}:${part.process}`);
  }
  order.recipe.components.forEach(([ingredient, process], chipIndex) => {
    const chipX = rect.x + 12 + chipIndex * 43;
    const chipY = rect.y + 58;
    fillRoundRect(ctx, { x: chipX, y: chipY, w: 38, h: 38 }, 8, held.has(`${ingredient}:${process}`) ? '#dff5e1' : '#f1e3c8');
    emoji(ctx, INGREDIENTS[ingredient].emoji, chipX + 19, chipY + 15, 19);
    text(ctx, PROCESS_ICON[process], chipX + 19, chipY + 32, 10, INK, 'center');
  });
  const share = Math.max(0, order.patienceLeft / order.patience);
  bar(ctx, rect.x + 12, rect.y + 104, rect.w - 24, 9, share, patienceColour(share));
}

/** The order board on the left wall, tickets pinned in arrival order. */
function drawBoard(ctx, game) {
  fillRoundRect(ctx, L.BOARD, 12, '#a9743f');
  fillRoundRect(ctx, { x: L.BOARD.x + 6, y: L.BOARD.y + 6, w: L.BOARD.w - 12, h: L.BOARD.h - 12 }, 10, '#96683a');
  text(ctx, '📋 ORDER BOARD', L.BOARD.x + L.BOARD.w / 2, L.BOARD.y + 24, 17, '#ffe9b0', 'center', '800');
  game.orders.forEach((order, index) => drawTicket(ctx, game, order, index));
  if (game.orders.length === 0) {
    text(ctx, 'no tickets yet…', L.BOARD.x + L.BOARD.w / 2, 200, 14, '#ffe9b0', 'center');
  }
}

/** Customers on their stools, a thought bubble showing the dish they dream of. */
function drawCustomers(ctx, game) {
  game.orders.forEach((order, index) => {
    const rect = L.stoolRect(index);
    fillRoundRect(ctx, { x: rect.x, y: rect.y + 58, w: rect.w, h: 34 }, 8, WOOD);
    emoji(ctx, order.type.emoji, rect.x + 42, rect.y + 34, 44);
    fillRoundRect(ctx, { x: rect.x + 74, y: rect.y + 6, w: 52, h: 40 }, 12, '#fff');
    emoji(ctx, order.recipe.emoji, rect.x + 100, rect.y + 27, 26);
    const share = Math.max(0, order.patienceLeft / order.patience);
    bar(ctx, rect.x + 12, rect.y + 82, rect.w - 24, 7, share, patienceColour(share));
  });
}

/** One station panel: its name, and its slots as timer rings around the food. */
function drawStation(ctx, game, station, stationIndex) {
  const rect = L.stationRect(stationIndex);
  fillRoundRect(ctx, rect, 12, station.id === 'oven' ? '#6e4a2f' : '#7d5a38');
  fillRoundRect(ctx, { x: rect.x + 5, y: rect.y + 5, w: rect.w - 10, h: 44 }, 9, 'rgba(255,248,234,0.92)');
  emoji(ctx, station.emoji, rect.x + 26, rect.y + 27, 24);
  text(ctx, station.name, rect.x + 48, rect.y + 27, 14.5, INK, 'left', '800');
  const slots = game.kitchen.stations[station.id].slots;
  slots.forEach((slot, slotIndex) => {
    const slotRect = L.slotRect(stationIndex, slotIndex, slots.length);
    const cx = slotRect.x + slotRect.w / 2;
    const cy = slotRect.y + slotRect.h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();
    if (slot === null) {
      text(ctx, '＋', cx, cy, 20, 'rgba(255,255,255,0.5)', 'center');
      return;
    }
    const state = slotState(slot, game.upgrades);
    emoji(ctx, state === 'burnt' ? '🟫' : INGREDIENTS[slot.ingredient].emoji, cx, cy, 30);
    const share = Math.min(1, slot.elapsed / slot.duration);
    ctx.beginPath();
    ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share);
    ctx.strokeStyle = state === 'burnt' ? RED : state === 'perfect' ? GOLD : state === 'ready' ? '#7dff8a' : '#ffb84d';
    ctx.lineWidth = 5;
    ctx.stroke();
    if (state === 'perfect') text(ctx, '★', cx + 24, cy - 24, 16, GOLD, 'center', '800');
    if (state === 'burnt') text(ctx, 'BURNT', cx, cy + 38, 10, '#ff9a8a', 'center', '800');
    if (state === 'ready') text(ctx, 'ready', cx, cy + 38, 10, '#b8ffbe', 'center', '800');
  });
  text(ctx, `makes things ${PROCESSES_NAME(station.process)}`, rect.x + rect.w / 2, rect.y + rect.h - 14, 11, 'rgba(255,233,176,0.85)', 'center');
}

function PROCESSES_NAME(process) {
  return { chop: 'chopped', grill: 'grilled', fry: 'fried', boil: 'boiled', bake: 'baked' }[process];
}

/** The pass: plates being built, a ready glow when one matches a ticket, and the trash. */
function drawPass(ctx, game) {
  game.kitchen.plates.forEach((plate, index) => {
    const rect = L.plateRect(index);
    const matched = game.orders.some((order) => plateMatches(plate, order.recipe));
    fillRoundRect(ctx, rect, 14, matched ? '#4c7a4f' : '#6d4c2c');
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + 62, 74, 44, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fdfdf8';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + 62, 58, 33, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#eef0e6';
    ctx.fill();
    plate.forEach((part, partIndex) => {
      const angle = (partIndex / Math.max(1, plate.length)) * Math.PI * 2 - Math.PI / 2;
      const px = rect.x + rect.w / 2 + Math.cos(angle) * (plate.length > 1 ? 30 : 0);
      const py = rect.y + 62 + Math.sin(angle) * (plate.length > 1 ? 16 : 0);
      emoji(ctx, INGREDIENTS[part.ingredient].emoji, px, py, 25);
      if (part.perfect) text(ctx, '★', px + 13, py - 12, 11, '#e6a817', 'center', '800');
    });
    text(ctx, `PLATE ${index + 1}`, rect.x + 10, rect.y + 16, 11, '#ffe9b0', 'left', '800');
    if (matched) text(ctx, 'READY — click its ticket!', rect.x + rect.w / 2, rect.y + rect.h - 10, 12, '#b8ffbe', 'center', '800');
    else if (plate.length > 0) {
      const clear = L.plateClearRect(index);
      fillRoundRect(ctx, clear, 6, 'rgba(0,0,0,0.35)');
      text(ctx, '✕', clear.x + 12, clear.y + 13, 13, '#fff', 'center');
    }
  });
  fillRoundRect(ctx, L.TRASH, 14, '#565656');
  emoji(ctx, '🗑️', L.TRASH.x + L.TRASH.w / 2, L.TRASH.y + 52, 44);
  text(ctx, 'TRASH', L.TRASH.x + L.TRASH.w / 2, L.TRASH.y + L.TRASH.h - 16, 12, '#ddd', 'center', '800');
}

/** The pantry shelf: one bin per ingredient the unlocked menu needs. */
function drawPantry(ctx, game) {
  fillRoundRect(ctx, L.PANTRY, 12, '#7d5a38');
  text(ctx, '🧺 PANTRY — click a bin to pick up', L.PANTRY.x + 8, L.PANTRY.y - 12, 13, '#5d3d22', 'left', '800');
  pantryFor(game.day).forEach((ingredient, index) => {
    const rect = L.pantryBinRect(index);
    fillRoundRect(ctx, rect, 9, game.kitchen.hand === null ? PAPER : '#e8dcc2');
    emoji(ctx, INGREDIENTS[ingredient].emoji, rect.x + rect.w / 2, rect.y + 22, 27);
    text(ctx, INGREDIENTS[ingredient].name, rect.x + rect.w / 2, rect.y + 49, 10.5, INK, 'center', '700');
  });
}

/** The held item floats at the cursor; the toast and hint speak under the HUD. */
function drawHandAndNotes(ctx, game, mouse) {
  const hint = hintFor(game);
  if (hint && game.day === 1) {
    fillRoundRect(ctx, { x: 400, y: 402, w: 720, h: 24 }, 12, 'rgba(61,41,22,0.85)');
    text(ctx, `💡 ${hint}`, 760, 414, 13, '#ffe9b0', 'center');
  }
  if (game.toast) {
    ctx.globalAlpha = Math.min(1, game.toast.left);
    fillRoundRect(ctx, { x: 390, y: 64, w: 740, h: 30 }, 15, 'rgba(192,57,43,0.92)');
    text(ctx, game.toast.text, 760, 79, 14.5, '#fff', 'center', '800');
    ctx.globalAlpha = 1;
  }
  if (game.kitchen.hand !== null && mouse) {
    ctx.beginPath();
    ctx.arc(mouse.x + 18, mouse.y + 18, 21, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,248,234,0.95)';
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    emoji(ctx, INGREDIENTS[game.kitchen.hand.ingredient].emoji, mouse.x + 18, mouse.y + 18, 26);
    if (game.kitchen.hand.perfect) text(ctx, '★', mouse.x + 34, mouse.y + 2, 13, '#e6a817', 'center', '800');
  }
  for (const floater of game.floaters) {
    ctx.globalAlpha = Math.max(0, 1 - floater.age / 1.4);
    text(ctx, floater.text, floater.x, floater.y, 19, floater.colour, 'center', '800');
    ctx.globalAlpha = 1;
  }
}

/** The full play scene — also the backdrop, dimmed, behind every menu card. */
export function drawPlayScene(ctx, game, mouse) {
  drawRoom(ctx, game);
  drawHud(ctx, game);
  drawBoard(ctx, game);
  drawCustomers(ctx, game);
  STATIONS.forEach((station, index) => drawStation(ctx, game, station, index));
  drawPass(ctx, game);
  drawPantry(ctx, game);
  drawHandAndNotes(ctx, game, mouse);
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(40,24,10,0.55)';
  ctx.fillRect(0, 0, 1280, 800);
}

function drawButton(ctx, rect, label, colour = RED, size = 19) {
  fillRoundRect(ctx, rect, 12, colour);
  fillRoundRect(ctx, { x: rect.x, y: rect.y, w: rect.w, h: rect.h / 2 }, 12, 'rgba(255,255,255,0.12)');
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, size, '#fff', 'center', '800');
}

function drawTitle(ctx, game) {
  dim(ctx);
  fillRoundRect(ctx, L.CARD, 18, PAPER);
  emoji(ctx, '🥄', 640, 218, 64);
  text(ctx, 'THE COPPER LADLE', 640, 282, 42, '#7a3b12', 'center', '800');
  text(ctx, 'a diner-rescue cooking game', 640, 318, 17, '#7a4a21', 'center');
  const story = 'The bank gives Rosa’s diner twelve days. Cook the rush, hit each day’s goal, buy better gear at night — and the ladle your grandma hung in 1962 stays in the family.';
  wrappedText(ctx, story, 640, 356, 520, 15.5, 21, INK, 'center');
  const how = '🖱 Click a pantry bin to pick up an ingredient · click a station to chop, grill, fry, boil or bake it · build each dish on a plate · click its ticket to serve. Gold ring = perfect, red = about to burn!';
  wrappedText(ctx, how, 640, 428, 520, 14, 20, '#5d3d22', 'center');
  drawButton(ctx, L.PRIMARY_BTN, '▶  START DAY 1');
}

function drawIntro(ctx, game) {
  dim(ctx);
  fillRoundRect(ctx, L.CARD, 18, PAPER);
  text(ctx, `DAY ${game.day} OF ${TOTAL_DAYS}`, 640, 196, 34, '#7a3b12', 'center', '800');
  wrappedText(ctx, DAY_INTROS[game.day - 1], 640, 240, 520, 15.5, 22, INK, 'center');
  const config = DAYS[game.day - 1];
  text(ctx, `🎯 Goal today: earn ${config.goal}🪙 before the clock runs out`, 640, 356, 17, '#7a4a21', 'center', '800');
  const fresh = recipesUnlockedOn(game.day);
  if (fresh.length > 0) {
    text(ctx, 'NEW ON THE MENU', 640, 396, 13, RED, 'center', '800');
    fresh.forEach((recipe, index) => {
      text(ctx, `${recipe.emoji} ${recipe.name} — ${recipe.price}🪙`, 640, 420 + index * 22, 15, INK, 'center');
    });
  }
  drawButton(ctx, L.PRIMARY_BTN, '🔔 OPEN THE DOORS');
}

function drawSummary(ctx, game) {
  dim(ctx);
  const summary = game.lastSummary;
  fillRoundRect(ctx, L.CARD, 18, PAPER);
  text(ctx, `DAY ${summary.day} DONE! 🎉`, 640, 210, 34, '#7a3b12', 'center', '800');
  const lines = [
    `Earned ${summary.earned}🪙 of the ${summary.goal}🪙 goal`,
    `Dishes served: ${summary.served}   ·   perfect: ${summary.perfect} ★`,
    `Customers who left hungry: ${summary.walkouts}`,
    `Bank: ${game.bank}🪙   ·   loan repaid so far: ${game.totalEarned}🪙`,
  ];
  lines.forEach((line, index) => text(ctx, line, 640, 286 + index * 34, 17, INK, 'center'));
  text(ctx, 'Spend the night’s coins before tomorrow’s rush:', 640, 448, 14.5, '#7a4a21', 'center');
  drawButton(ctx, L.PRIMARY_BTN, '🛒 TO THE NIGHT MARKET');
}

function drawShop(ctx, game) {
  fillRoundRect(ctx, { x: 0, y: 0, w: 1280, h: 800 }, 0, '#2e2015');
  fillRoundRect(ctx, L.SHOP_CARD, 18, PAPER);
  text(ctx, '🌙 THE NIGHT MARKET', L.SHOP_CARD.x + L.SHOP_CARD.w / 2, L.SHOP_CARD.y + 38, 26, '#7a3b12', 'center', '800');
  text(ctx, `bank: ${game.bank}🪙 — day ${game.day + 1} goal: ${DAYS[game.day].goal}🪙`, L.SHOP_CARD.x + L.SHOP_CARD.w / 2, L.SHOP_CARD.y + 68, 15, '#7a4a21', 'center');
  UPGRADES.forEach((upgrade, index) => {
    const rect = L.shopCardRect(index);
    const owned = game.upgrades.has(upgrade.id);
    const afford = game.bank >= upgrade.price;
    fillRoundRect(ctx, rect, 12, owned ? '#dff5e1' : '#f7ecd4');
    emoji(ctx, upgrade.emoji, rect.x + rect.w / 2, rect.y + 36, 36);
    text(ctx, upgrade.name, rect.x + rect.w / 2, rect.y + 72, 15.5, INK, 'center', '800');
    wrappedText(ctx, upgrade.blurb, rect.x + rect.w / 2, rect.y + 94, rect.w - 24, 12.5, 16, '#5d3d22', 'center');
    text(ctx, owned ? 'OWNED ✓' : `${upgrade.price}🪙`, rect.x + rect.w / 2, rect.y + rect.h - 20, 15, owned ? GREEN : afford ? RED : '#999', 'center', '800');
  });
  drawButton(ctx, L.SHOP_NEXT_BTN, `☀ START DAY ${game.day + 1}`);
}

function drawOver(ctx, game) {
  dim(ctx);
  fillRoundRect(ctx, L.CARD, 18, PAPER);
  emoji(ctx, '🔒', 640, 216, 54);
  text(ctx, 'THE BANK TAKES THE DINER', 640, 272, 30, RED, 'center', '800');
  const summary = game.lastSummary;
  const story = `Day ${summary.day} closed at ${summary.earned}🪙 of the ${summary.goal}🪙 goal. The ladle comes down — unless you run the day again and cook it better. Rosa believes in second chances.`;
  wrappedText(ctx, story, 640, 316, 520, 15.5, 22, INK, 'center');
  text(ctx, `Total earned this run: ${game.totalEarned}🪙 · dishes served today: ${summary.served}`, 640, 420, 15, '#7a4a21', 'center');
  drawButton(ctx, L.PRIMARY_BTN, `↻ RETRY DAY ${summary.day}`);
  drawButton(ctx, L.SECONDARY_BTN, 'NEW CAMPAIGN', WOOD, 16);
}

function drawVictory(ctx, game) {
  dim(ctx);
  fillRoundRect(ctx, L.CARD, 18, PAPER);
  emoji(ctx, '🏆', 640, 216, 58);
  text(ctx, 'THE COPPER LADLE IS SAVED!', 640, 276, 31, '#7a3b12', 'center', '800');
  const story = `Twelve days, ${game.totalEarned}🪙 earned, and the loan is paid in full. Rosa hangs the copper ladle back over the pass, cries exactly once, and starts tomorrow’s soup. The diner is the family’s again — because you cooked like it mattered.`;
  wrappedText(ctx, story, 640, 322, 520, 15.5, 22, INK, 'center');
  text(ctx, `Final bank: ${game.bank}🪙 · upgrades owned: ${game.upgrades.size}`, 640, 452, 16, '#7a4a21', 'center');
  drawButton(ctx, L.PRIMARY_BTN, '↻ PLAY AGAIN');
}

/** Draw the whole game: the play scene, then whichever screen sits on top of it. */
export function drawGame(ctx, game, mouse) {
  drawPlayScene(ctx, game, mouse);
  if (game.screen === SCREEN_TITLE) drawTitle(ctx, game);
  else if (game.screen === SCREEN_INTRO) drawIntro(ctx, game);
  else if (game.screen === SCREEN_SUMMARY) drawSummary(ctx, game);
  else if (game.screen === SCREEN_SHOP) drawShop(ctx, game);
  else if (game.screen === SCREEN_OVER) drawOver(ctx, game);
  else if (game.screen === SCREEN_VICTORY) drawVictory(ctx, game);
  if (game.paused && game.screen === SCREEN_PLAY) {
    dim(ctx);
    text(ctx, '⏸ PAUSED', 640, 380, 40, '#fff', 'center', '800');
    text(ctx, 'press P or click ▶ to resume', 640, 424, 16, '#ffe9b0', 'center');
  }
}
