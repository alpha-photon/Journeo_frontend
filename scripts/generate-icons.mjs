// Run once: node scripts/generate-icons.mjs
// Generates PNG icons for the PWA manifest using pure Node (no canvas dependency).
// Uses a minimal PNG encoder to create solid indigo icons with a white airplane.

import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Minimal PNG encoder ──────────────────────────────────────────────────────
import { createHash } from 'crypto';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodePNG(width, height, getPixel) {
  const header = Buffer.from('\x89PNG\r\n\x1a\n', 'binary');

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y, width, height);
      raw.push(r, g, b);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(raw));
  return Buffer.concat([header, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// ── Draw function ────────────────────────────────────────────────────────────
// Indigo (#6366f1) background, white airplane emoji drawn as simple shape
function drawIcon(x, y, size, maskable = false) {
  const cx = size / 2, cy = size / 2;
  // Maskable icons need 20% safe zone padding
  const padding = maskable ? size * 0.15 : size * 0.08;
  const iconSize = size - padding * 2;

  // Background: indigo gradient approximated as solid #6366f1
  const bg = [99, 102, 241];
  const bgDark = [79, 70, 229]; // slightly darker for bottom

  // Simple airplane shape: draw white pixels
  const norm = (v) => (v - padding) / iconSize; // normalize to 0..1

  const inAirplane = (nx, ny) => {
    // Body: horizontal ellipse in center
    const bx = (nx - 0.5) / 0.38, by = (ny - 0.5) / 0.08;
    if (bx * bx + by * by < 1) return true;
    // Left wing: triangle
    if (nx > 0.25 && nx < 0.6 && ny > 0.5 && ny < 0.5 + (0.6 - nx) * 0.7) return true;
    // Right wing (mirror)
    if (nx > 0.25 && nx < 0.6 && ny < 0.5 && ny > 0.5 - (0.6 - nx) * 0.7) return true;
    // Tail fin
    if (nx < 0.3 && nx > 0.18 && ny > 0.42 && ny < 0.58) return true;
    return false;
  };

  const nx = norm(x), ny = norm(y);
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
    // Blend bg based on y for subtle gradient
    const t = y / size;
    return bg.map((c, i) => Math.round(c * (1 - t * 0.15) + bgDark[i] * t * 0.15));
  }

  if (inAirplane(nx, ny)) return [255, 255, 255];

  const t = y / size;
  return bg.map((c, i) => Math.round(c * (1 - t * 0.15) + bgDark[i] * t * 0.15));
}

// ── Generate all 4 icons ─────────────────────────────────────────────────────
const icons = [
  { file: 'icon-192.png',          size: 192, maskable: false },
  { file: 'icon-512.png',          size: 512, maskable: false },
  { file: 'icon-maskable-192.png', size: 192, maskable: true  },
  { file: 'icon-maskable-512.png', size: 512, maskable: true  },
];

for (const { file, size, maskable } of icons) {
  const png = encodePNG(size, size, (x, y) => drawIcon(x, y, size, maskable));
  const outPath = resolve(__dirname, '../public/icons', file);
  createWriteStream(outPath).end(png);
  console.log(`✓ ${file} (${size}x${size})`);
}
