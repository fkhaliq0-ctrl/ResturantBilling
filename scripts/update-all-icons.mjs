// ══════════════════════════════════════════════════════════════════════════════
// Convert MM.pdf.png → all Android mipmap sizes + Electron .ico + build assets
// ══════════════════════════════════════════════════════════════════════════════
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SOURCE = 'D:/MM.pdf.png';
const PROJECT = 'E:/ResturantBilling';

// Android mipmap sizes (px): mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
const ANDROID_SIZES = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

// Foreground sizes (for adaptive icon — 108dp at each density)
const FOREGROUND_SIZES = {
  'drawable-mdpi':    108,
  'drawable-hdpi':    162,
  'drawable-xhdpi':   216,
  'drawable-xxhdpi':  324,
  'drawable-xxxhdpi': 432,
};

// ICO multi-size: 16, 32, 48, 64, 128, 256
const ICO_SIZES = [16, 32, 48, 64, 128, 256];

// Build asset sizes
const BUILD_SIZES = {
  'logo-16.png':  16,
  'logo-32.png':  32,
  'logo-48.png':  48,
  'logo-64.png':  64,
  'logo-128.png': 128,
  'logo-256.png': 256,
  'logo-512.png': 512,
};

async function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function resizeToBuffer(sourcePath, size) {
  return sharp(sourcePath)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}

async function main() {
  console.log('🔄 Converting MM.pdf.png → all platform icons...\n');

  // ── Android mipmap icons ──────────────────────────────────
  const resDir = join(PROJECT, 'android/app/src/main/res');
  for (const [folder, size] of Object.entries(ANDROID_SIZES)) {
    const dir = join(resDir, folder);
    await ensureDir(dir);
    const buf = await resizeToBuffer(SOURCE, size);
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      await sharp(buf).png().toFile(join(dir, name));
    }
    console.log(`  ✅ ${folder}: ${size}px → ic_launcher.png, ic_launcher_round.png`);
  }

  // ── Android foreground drawables (adaptive icon) ──────────
  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = join(resDir, folder);
    await ensureDir(dir);
    const buf = await resizeToBuffer(SOURCE, size);
    await sharp(buf).png().toFile(join(dir, 'ic_launcher_foreground.png'));
    console.log(`  ✅ ${folder}: ${size}px → ic_launcher_foreground.png`);
  }

  // ── Electron .ico ─────────────────────────────────────────
  const icoBuffers = [];
  for (const size of ICO_SIZES) {
    icoBuffers.push(await resizeToBuffer(SOURCE, size));
  }
  const assetsDir = join(PROJECT, 'assets');
  await ensureDir(assetsDir);
  const icoBuf = await pngToIco(icoBuffers);
  writeFileSync(join(assetsDir, 'mm.ico'), icoBuf);
  console.log(`  ✅ assets/mm.ico → 6 sizes (${ICO_SIZES.join(', ')}px)`);

  // Also save a full-res PNG for the assets folder
  await sharp(SOURCE).resize(512, 512, { fit: 'cover' }).png().toFile(join(assetsDir, 'mm-512.png'));
  console.log(`  ✅ assets/mm-512.png → 512px`);

  // ── Build assets (for electron-builder) ───────────────────
  const buildDir = join(PROJECT, 'build-assets');
  await ensureDir(buildDir);
  for (const [name, size] of Object.entries(BUILD_SIZES)) {
    const buf = await resizeToBuffer(SOURCE, size);
    await sharp(buf).png().toFile(join(buildDir, name));
    console.log(`  ✅ build-assets/${name} → ${size}px`);
  }
  // Copy .ico to build-assets too
  writeFileSync(join(buildDir, 'logo.ico'), readFileSync(join(assetsDir, 'mm.ico')));
  console.log(`  ✅ build-assets/logo.ico → copied`);

  // ── Public folder (for web favicon) ───────────────────────
  await sharp(SOURCE).resize(32, 32, { fit: 'cover' }).png().toFile(join(PROJECT, 'public/favicon.png'));
  console.log(`  ✅ public/favicon.png → 32px`);

  console.log('\n🎉 All platform icons generated successfully!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
