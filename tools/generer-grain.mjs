// =========================================================
// GÉNÉRATEUR DE PAPIER À GRAIN (tuile raccordable)
// ---------------------------------------------------------
// Usage :  node JardinDeDemain/tools/generer-grain.mjs
// Produit : JardinDeDemain/assets/textures/papier-grain.png
//
// Principe (comme une texture de jeu vidéo) :
//   1. une carte de hauteur = bruit « périodique » : il boucle
//      sur lui-même, donc la tuile se répète sans couture ;
//   2. on éclaire ce relief avec une lumière rasante ;
//   3. on enregistre le résultat en gris centré sur 128 :
//      gris moyen = aucun effet en mode soft-light,
//      plus clair = bosse éclairée, plus foncé = creux.
//
// Aucune dépendance : l'encodeur PNG utilise zlib de Node.
// =========================================================

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';


// ---------------------------------------------------------
// RÉGLAGES
// ---------------------------------------------------------

const CONFIG = {
  size: 512,            // côté de la tuile en pixels (affichée à 256px CSS = net sur écran Retina)
  seed: 7,

  // relief : bosses rondes semées au hasard (aucune direction privilégiée)
  // [rayon en px, densité (bosses par rayon²), poids]
  bumps: [
    [14,  .5, .5],      // ondulation large de la feuille
    [6,   .9, 1.0],     // le grain proprement dit
    [3,   .9, .45],     // détail
    [1.5, .8, .15]      // micro-texture
  ],

  fibers: 260,          // petites fibres allongées dans la pâte
  fiberStrength: .14,
  softness: 1,          // passes de flou sur le relief (adoucit le grain)

  relief: 1.2,          // hauteur du relief (plus = grain plus marqué)
  azimuth: 225,         // direction de la lumière (225 = haut-gauche)
  elevation: 64,        // hauteur de la lumière (plus bas = plus rasant)
  cavity: .55,          // creux plus sombres, sans direction (0 = lumière seule)
  contrast: 120         // amplitude finale autour du gris 128
};


// ---------------------------------------------------------
// ALÉATOIRE REPRODUCTIBLE
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
// 1. CARTE DE HAUTEUR PÉRIODIQUE
// ---------------------------------------------------------

const height = new Float32Array(N * N);

// chaque bosse est une petite cloche (gaussienne) ;
// les coordonnées bouclent, donc une bosse coupée par un bord
// réapparaît de l'autre côté : la tuile se raccorde parfaitement
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

// fibres : courts traits en creux ou en relief, orientés au hasard
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


// flou 3×3 bouclé : arrondit les bosses sans créer de couture
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
// 2. ÉCLAIRAGE DU RELIEF
// ---------------------------------------------------------

const az = CONFIG.azimuth * Math.PI / 180;
const el = CONFIG.elevation * Math.PI / 180;
const light = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
const flat = light[2];                        // éclairage d'une surface parfaitement plane

const h = (x, y) => height[wrap(y) * N + wrap(x)];
const shades = new Float32Array(N * N);

for(let y = 0; y < N; y++){
  for(let x = 0; x < N; x++){
    // pente (voisins bouclés : pas de couture sur les bords)
    const dx = (h(x + 1, y) - h(x - 1, y)) * CONFIG.relief / 2;
    const dy = (h(x, y + 1) - h(x, y - 1)) * CONFIG.relief / 2;
    const len = Math.hypot(dx, dy, 1);
    shades[y * N + x] = (-dx * light[0] - dy * light[1] + light[2]) / len;
  }
}

// creux / bosses : le ton suit directement la hauteur
let hMin = Infinity, hMax = -Infinity;
for(const v of height){ if(v < hMin) hMin = v; if(v > hMax) hMax = v; }
const hRange = (hMax - hMin) || 1;

for(let i = 0; i < shades.length; i++){
  const tone = (height[i] - hMin) / hRange - .5;
  shades[i] = shades[i] * (1 - CONFIG.cavity) + tone * CONFIG.cavity * .5;
}

// recentrage : la moyenne tombe pile sur le gris neutre (128),
// la tuile n'assombrit ni n'éclaircit la page dans son ensemble
const mean = shades.reduce((a, b) => a + b, 0) / shades.length;
const pixels = new Uint8Array(N * N);

for(let i = 0; i < shades.length; i++){
  const v = 128 + (shades[i] - mean) * CONFIG.contrast;
  pixels[i] = Math.max(0, Math.min(255, Math.round(v)));
}


// ---------------------------------------------------------
// 3. ENCODAGE PNG (niveaux de gris 8 bits)
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
ihdr[9] = 0;    // niveaux de gris

const raw = Buffer.alloc(N * (N + 1));
for(let y = 0; y < N; y++){
  raw[y * (N + 1)] = 0;                       // pas de filtre de ligne
  raw.set(pixels.subarray(y * N, (y + 1) * N), y * (N + 1) + 1);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, {level: 9})),
  chunk('IEND', Buffer.alloc(0))
]);

const out = fileURLToPath(new URL('../assets/textures/papier-grain.png', import.meta.url));
writeFileSync(out, png);
console.log(`Tuile écrite : ${out} (${N}×${N}, ${(png.length / 1024).toFixed(0)} Ko)`);
