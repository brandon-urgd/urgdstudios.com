/**
 * urgdstudios.com — Favicon Generation Script (S6)
 *
 * Generates raster favicon files from favicon.svg using sharp.
 * Run once when favicon changes: `npm run favicons`
 *
 * Output files (committed to public/ and served by S3):
 *   public/favicon-16x16.png   — 16×16 browser tab (legacy)
 *   public/favicon-32x32.png   — 32×32 browser tab (standard)
 *   public/apple-touch-icon.png — 180×180 iOS home screen
 *   public/favicon.ico          — Multi-size ICO (16 + 32) for legacy browser support
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const sourceSvg = path.join(publicDir, 'favicon.svg');

const svgBuffer = fs.readFileSync(sourceSvg);

async function generate() {
  // 16×16 PNG
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('  ✓ favicon-16x16.png');

  // 32×32 PNG
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('  ✓ favicon-32x32.png');

  // 180×180 PNG (Apple Touch Icon)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  // favicon.ico — use the 32×32 PNG as source (ICO container)
  // sharp can write .ico format directly
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('  ✓ favicon.ico');

  console.log('\n  Favicon generation complete.');
}

generate().catch((err) => {
  console.error('Favicon generation failed:', err);
  process.exit(1);
});
