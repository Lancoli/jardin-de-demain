// =========================================================
// GRAINED PAPER GENERATOR (seamless tile)
// ---------------------------------------------------------
// Usage:  node JardinDeDemain/tools/generate-grain.mjs
// Output: JardinDeDemain/assets/textures/paper-grain.png
//
// Principle (like a video game texture):
//   1. a height map = "periodic" noise: it wraps
//      around itself, so the tile repeats without a seam;
//   2. light this relief with a grazing light;
//   3. save the result as grey centred on 128:
//      mid grey = no effect in soft-light mode,
//      lighter = lit bump, darker = hollow.
//
// No dependency: the PNG encoder uses Node's zlib.
// =========================================================

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';


// ---------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------

const CONFIG = {
  size: 512,            // tile side in pixels (shown at 256 CSS px = sharp on a Retina screen)
  seed: 7,

  // relief: round bumps scattered at random (no preferred direction)
  // [radius in px, density (bumps per radius²), weight]
  bumps: [
    [14,  .5, .5],      // broad waviness of the sheet
    [6,   .9, 1.0],     // the grain itself
    [3,   .9, .45],     // detail
    [1.5, .8, .15]      // micro-texture
  ],

  fibers: 260,          // small elongated fibres in the pulp
  fiberStrength: .14,
  softness: 1,          // blur passes over the relief (softens the grain)

  relief: 1.2,          // relief height (more = stronger grain)
  azimuth: 225,         // light direction (225 = top-left)
  elevation: 64,        // light height (lower = more grazing)
  cavity: .55,          // darker hollows, without direction (0 = light only)
  contrast: 120         // final amplitude around grey 128
};


// ---------------------------------------------------------
// REPRODUCIBLE RANDOMNESS
// ---------------------------------------------------------

function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(CONFIG.seed);
const N = CONFIG.size;
const wrap = i => ((i % N) + N) % N;


// ---------------------------------------------------------
// 1. PERIODIC HEIGHT MAP
// ---------------------------------------------------------

const height = new Float32Array(N * N);

// each bump is a small bell (Gaussian);
// the coordinates wrap, so a bump cut by an edge
// reappears on the other side: the tile joins perfectly
for(const [radius, density, weight] of CONFIG.bumps){
  const count = Math.round(density * N * N / (radius * radius));
  const reach = Math.ceil(radius * 2.5);
  const inv = 1 / (2 * radius * radius);

  for(let b = 0; b < count; b++){
    const cx = rand() * N, cy = rand() * N;
    const amp = (rand() * 2 - 1) * weight;
    const x0 = Math.floor(cx), y0 = Math.floor(cy);

    for(let j = -reach; j <= reach; j++){
      const dy = y0 + j - cy;
      const row = wrap(y0 + j) * N;
      for(let i = -reach; i <= reach; i++){
        const dx = x0 + i - cx;
        height[row + wrap(x0 + i)] += amp * Math.exp(-(dx * dx + dy * dy) * inv);
      }
    }
  }
}

// fibres: short strokes, hollow or raised, randomly oriented
for(let f = 0; f < CONFIG.fibers; f++){
  let x = rand() * N, y = rand() * N;
  const angle = rand() * Math.PI;
  const length = 6 + rand() * 18;
  const sign = rand() < .5 ? -1 : 1;
  for(let s = 0; s < length; s++){
    const i = wrap(Math.round(y)) * N + wrap(Math.round(x));
    height[i] += sign * CONFIG.fiberStrength * Math.sin(Math.PI * s / length);
    x += Math.cos(angle);
    y += Math.sin(angle);
  }
}


// wrapped 3×3 blur: rounds the bumps without creating a seam
for(let pass = 0; pass < CONFIG.softness; pass++){
  const copy = height.slice();
  for(let y = 0; y < N; y++){
    for(let x = 0; x < N; x++){
      let sum = 0;
      for(let j = -1; j <= 1; j++)
        for(let i = -1; i <= 1; i++)
          sum += copy[wrap(y + j) * N + wrap(x + i)];
      height[y * N + x] = sum / 9;
    }
  }
}


// ---------------------------------------------------------
// 2. LIGHTING THE RELIEF
// ---------------------------------------------------------

const az = CONFIG.azimuth * Math.PI / 180;
const el = CONFIG.elevation * Math.PI / 180;
const light = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
const flat = light[2];                        // lighting of a perfectly flat surface

const h = (x, y) => height[wrap(y) * N + wrap(x)];
const shades = new Float32Array(N * N);

for(let y = 0; y < N; y++){
  for(let x = 0; x < N; x++){
    // slope (wrapped neighbours: no seam on the edges)
    const dx = (h(x + 1, y) - h(x - 1, y)) * CONFIG.relief / 2;
    const dy = (h(x, y + 1) - h(x, y - 1)) * CONFIG.relief / 2;
    const len = Math.hypot(dx, dy, 1);
    shades[y * N + x] = (-dx * light[0] - dy * light[1] + light[2]) / len;
  }
}

// hollows / bumps: the tone follows the height directly
let hMin = Infinity, hMax = -Infinity;
for(const v of height){ if(v < hMin) hMin = v; if(v > hMax) hMax = v; }
const hRange = (hMax - hMin) || 1;

for(let i = 0; i < shades.length; i++){
  const tone = (height[i] - hMin) / hRange - .5;
  shades[i] = shades[i] * (1 - CONFIG.cavity) + tone * CONFIG.cavity * .5;
}

// re-centring: the mean lands exactly on neutral grey (128),
// so the tile neither darkens nor lightens the page as a whole
const mean = shades.reduce((a, b) => a + b, 0) / shades.length;
const pixels = new Uint8Array(N * N);

for(let i = 0; i < shades.length; i++){
  const v = 128 + (shades[i] - mean) * CONFIG.contrast;
  pixels[i] = Math.max(0, Math.min(255, Math.round(v)));
}


// ---------------------------------------------------------
// 3. PNG ENCODING (8-bit greyscale)
// ---------------------------------------------------------

const CRC_TABLE = Array.from({length: 256}, (_, n) => {
  let c = n;
  for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf){
  let c = 0xFFFFFFFF;
  for(const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data){
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0);
ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8;    // 8 bits
ihdr[9] = 0;    // greyscale

const raw = Buffer.alloc(N * (N + 1));
for(let y = 0; y < N; y++){
  raw[y * (N + 1)] = 0;                       // no line filter
  raw.set(pixels.subarray(y * N, (y + 1) * N), y * (N + 1) + 1);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, {level: 9})),
  chunk('IEND', Buffer.alloc(0))
]);

const out = fileURLToPath(new URL('../assets/textures/paper-grain.png', import.meta.url));
writeFileSync(out, png);
console.log(`Tile written: ${out} (${N}×${N}, ${(png.length / 1024).toFixed(0)} KB)`);
