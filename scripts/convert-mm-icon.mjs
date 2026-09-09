import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const PNG_PATH = join(ROOT, 'assets', 'MM.png');
const OUT_DIR = join(ROOT, 'assets');
const ICO_PATH = join(OUT_DIR, 'mm.ico');
const PNG_PATHS = [];

const SIZES = [16, 32, 48, 64, 128, 256];

async function main() {
  console.log('🔄 Converting MM.png to multi-size ICO...\n');

  const svgBuffer = await readFile(PNG_PATH);

  for (const size of SIZES) {
    const pngPath = join(OUT_DIR, `mm-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(pngPath);
    PNG_PATHS.push(pngPath);
    console.log(`   ✅ mm-${size}.png`);
  }

  const icoBuffer = await pngToIco(PNG_PATHS);
  await writeFile(ICO_PATH, icoBuffer);
  console.log(`\n   ✅ ICO saved: ${ICO_PATH} (${(icoBuffer.byteLength / 1024).toFixed(1)} KB)`);

  // Also generate 512px PNG for high-DPI
  const png512 = join(OUT_DIR, 'mm-512.png');
  await sharp(svgBuffer).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(png512);
  console.log(`   ✅ mm-512.png saved`);
  console.log('\n🎉 Done!');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
