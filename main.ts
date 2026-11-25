// The Copper Ladle — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a desktop browser; it
// loads nothing over the network). This program hands the entry in: it copies game/ and
// screenshots/ from beside this file into the output directory and writes dossier.json there
// with buildDossier from the vendored make.fun library, exactly as the bounty requires.
// Inside the grader the output directory is /output; outside it, MAKEFUN_OUTPUT_DIR names it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: the same repository always produces the same dossier bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Total files and bytes under a directory (the gate counts game/ against its caps). */
function measure(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = measure(path);
      files += inner.files;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

// Fail fast, in our own words, on the two mistakes the sealed scorer refuses outright:
// no screenshots (the first is the cover the judge sees) and a game/ over its size caps.
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort()
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`hand-in needs 3 or 4 screenshots in screenshots/, found ${shots.length}`);
}
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > 262144) throw new Error(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
}
const gameSize = measure(join(here, 'game'));
if (gameSize.files > 993 || gameSize.bytes > 50331648) {
  throw new Error(`game/ is ${gameSize.files} files / ${gameSize.bytes} bytes, over the gate's caps`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the gate's own (see the bounty's RULES.txt): the dossier text is capped at
// 160 KiB, screenshots at 4 files of 256 KiB, game/ at 993 entries and 48 MiB with no path
// over 1000 bytes. buildDossier refuses anything the sealed scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(
  `The Copper Ladle handed in: ${gameSize.files} game files (${gameSize.bytes} bytes), ` +
    `${shots.length} screenshots (${shots.join(', ')}), dossier written to ${join(out, 'dossier.json')}`,
);
