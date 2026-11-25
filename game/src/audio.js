// audio.js — every sound in The Copper Ladle is synthesised with WebAudio: no audio files,
// nothing to load. Short blips for the hands, a ding when a station finishes, a till ring
// when a plate is served and a low slide when a customer gives up and leaves.

let context = null;
let muted = false;

/** Create the context lazily on the first user gesture (browsers require one). */
function audioContext() {
  if (context === null) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

/** One soft oscillator blip. */
function blip(freqFrom, freqTo, seconds, type = 'sine', gainPeak = 0.12) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), now + seconds);
  gain.gain.setValueAtTime(gainPeak, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

/** Two quick notes, the second higher — the sound of picking something up. */
export function playPickup() {
  blip(520, 660, 0.07, 'triangle', 0.08);
}

/** A short knife-on-board knock while an ingredient goes on the chopping board. */
export function playChop() {
  blip(210, 120, 0.06, 'square', 0.05);
}

/** A station accepts an ingredient and starts work. */
export function playSizzleStart() {
  blip(300, 900, 0.12, 'sawtooth', 0.03);
}

/** The bright double-ding of a finished station. */
export function playReadyDing() {
  blip(1180, 1180, 0.09, 'sine', 0.10);
  setTimeout(() => blip(1560, 1560, 0.12, 'sine', 0.10), 90);
}

/** A burnt item is recognised: a dull descending buzz. */
export function playBurnt() {
  blip(220, 80, 0.3, 'sawtooth', 0.07);
}

/** Coins: three quick high notes when a customer pays. */
export function playCoins() {
  blip(990, 990, 0.07, 'square', 0.06);
  setTimeout(() => blip(1320, 1320, 0.07, 'square', 0.06), 60);
  setTimeout(() => blip(1760, 1760, 0.1, 'square', 0.06), 120);
}

/** A customer walks out: a slow descending pair. */
export function playWalkout() {
  blip(392, 392, 0.16, 'triangle', 0.08);
  setTimeout(() => blip(311, 262, 0.26, 'triangle', 0.08), 150);
}

/** The end-of-day till total: a small rising arpeggio. */
export function playDayEnd() {
  [523, 659, 784, 1046].forEach((freq, index) => {
    setTimeout(() => blip(freq, freq, 0.14, 'triangle', 0.09), index * 110);
  });
}

/** Toggle the mute flag; returns the new state. */
export function toggleMuted() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
