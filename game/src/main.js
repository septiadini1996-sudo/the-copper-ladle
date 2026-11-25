// main.js — bootstrap: build the canvas game, wire the mouse and keyboard, and run the
// frame loop. With ?shot=<scene>&seed=<n> in the address it stages one frozen scene from
// shots.js instead (that is how the entry's screenshots are taken) and never advances it.

import { VIEW } from './config.js';
import { createGame, update } from './game.js';
import { handleClick, handleKey } from './input.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

/** A small deterministic rng for staged scenes (mulberry32). */
function seededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1');
if (shotName) document.body.classList.add('shot');
const game = createGame(shotName ? seededRng(seed) : Math.random);
if (shotName) stageShot(game, shotName);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const mouse = { x: -100, y: -100 };

function toGameCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

canvas.addEventListener('mousemove', (event) => {
  const point = toGameCoords(event);
  mouse.x = point.x;
  mouse.y = point.y;
});
canvas.addEventListener('click', (event) => {
  const point = toGameCoords(event);
  handleClick(game, point.x, point.y);
});
window.addEventListener('keydown', (event) => {
  if (event.key === ' ') event.preventDefault();
  handleKey(game, event.key);
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotName) update(game, dt);
  drawGame(ctx, game, mouse);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
