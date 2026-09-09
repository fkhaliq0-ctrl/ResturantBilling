// Convert SVG logo to multi-size ICO for Windows desktop app
// Usage: node scripts/convert-icon.mjs

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SVG_PATH = join(ROOT, 'public', 'logo.svg');
const OUT_DIR = join(ROOT, 'build-assets');
const ICO_PATH = join(OUT_DIR, 'logo.ico');
const PNG_PATHS = [];

const SIZES = [16, 32, 48, 64, 128, 256];

async function main() {
  console.log('🔄 Converting logo.svg to multi-size ICO...\n');
  console.log(`   Source: ${SVG_PATH}`);

  // Read SVG
  const svgBuffer = await readFile(SVG_PATH);

  // Generate PNGs at each size
  for (const size of SIZES) {
    const pngPath = join(OUT_DIR, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(pngPath);
    PNG_PATHS.push(pngPath);
    console.log(`   ✅ Generated icon-${size}.png`);
  }

  // Combine PNGs into ICO
  const icoBuffer = await pngToIco(PNG_PATHS);
  await writeFile(ICO_PATH, icoBuffer);
  console.log(`\n   ✅ ICO saved: ${ICO_PATH}`);
  console.log(`   📦 Size: ${(icoBuffer.byteLength / 1024).toFixed(1)} KB`);
  console.log(`   📐 Sizes: ${SIZES.join(', ')}px`);

  // Also generate a 256px PNG for non-ICO uses
  const png256 = join(OUT_DIR, 'logo-256.png');
  await sharp(svgBuffer)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(png256);
  console.log(`   ✅ PNG-256 saved: ${png256}`);

  // Generate 512px for high-DPI
  const png512 = join(OUT_DIR, 'logo-512.png');
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(png512);
  console.log(`   ✅ PNG-512 saved: ${png512}`);

  console.log('\n🎉 Done! Icon conversion complete.\n');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
