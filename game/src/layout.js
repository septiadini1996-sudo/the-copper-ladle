// layout.js — every rectangle of the 1280×800 stage, shared by render.js (which draws
// them) and input.js (which clicks them), so a button is always exactly where it looks.

export const HUD = { x: 0, y: 0, w: 1280, h: 58 };
export const PAUSE_BTN = { x: 1172, y: 10, w: 44, h: 38 };
export const MUTE_BTN = { x: 1224, y: 10, w: 44, h: 38 };

export const BOARD = { x: 8, y: 66, w: 284, h: 726 };

/** Order tickets stack down the left board. */
export function ticketRect(index) {
  return { x: 16, y: 108 + index * 128, w: 268, h: 120 };
}

/** Customers sit in a row above the kitchen counter, one stool per active order. */
export function stoolRect(index) {
  return { x: 330 + index * 158, y: 70, w: 140, h: 96 };
}

export const STATION_ROW = { x: 308, y: 176, w: 964, h: 218 };
const STATION_W = 188;
const STATION_GAP = 6;

/** The five station panels across the kitchen. `index` follows kitchen.js STATIONS order. */
export function stationRect(index) {
  return { x: STATION_ROW.x + index * (STATION_W + STATION_GAP), y: STATION_ROW.y, w: STATION_W, h: STATION_ROW.h };
}

/** A cooking slot inside its station panel: a row of circles under the station's header. */
export function slotRect(stationIndex, slotIndex, slotCount) {
  const panel = stationRect(stationIndex);
  const size = 54;
  const total = slotCount * size + (slotCount - 1) * 10;
  const startX = panel.x + (panel.w - total) / 2;
  return { x: startX + slotIndex * (size + 10), y: panel.y + 108, w: size, h: size };
}

/** The assembly plates sit on the pass, left to right, with the trash at the far end. */
export function plateRect(index) {
  return { x: 330 + index * 218, y: 420, w: 190, h: 128 };
}
export function plateClearRect(index) {
  const plate = plateRect(index);
  return { x: plate.x + plate.w - 30, y: plate.y + 6, w: 24, h: 24 };
}
export const TRASH = { x: 1150, y: 420, w: 112, h: 128 };

/** The pantry shelf along the bottom: a grid of ingredient bins, ten to a row. */
export const PANTRY = { x: 308, y: 576, w: 954, h: 216 };
export function pantryBinRect(index) {
  const cols = 10;
  const cellW = PANTRY.w / cols;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: PANTRY.x + col * cellW + 5, y: PANTRY.y + 8 + row * 70, w: cellW - 10, h: 62 };
}

/** Centred card and buttons for the menu screens (title, intro, summary, over, victory). */
export const CARD = { x: 340, y: 150, w: 600, h: 500 };
export const PRIMARY_BTN = { x: 490, y: 560, w: 300, h: 56 };
export const SECONDARY_BTN = { x: 490, y: 628, w: 300, h: 48 };

/** Night-shop cards: four to a row, two rows, inside a wide card. */
export const SHOP_CARD = { x: 140, y: 120, w: 1000, h: 560 };
export function shopCardRect(index) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: SHOP_CARD.x + 24 + col * 240, y: SHOP_CARD.y + 96 + row * 196, w: 224, h: 180 };
}
export const SHOP_NEXT_BTN = { x: 490, y: 700, w: 300, h: 52 };

/** Is a point inside a rectangle? */
export function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
