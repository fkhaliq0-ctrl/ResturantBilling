const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'D:/Z-logo.png';
const RES_BASE = 'E:/zebaish-standalone/android/app/src/main/res';

// Android mipmap sizes
const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Foreground sizes (for adaptive icon)
const FG_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function generate() {
  console.log('Source:', SRC);
  console.log('Target:', RES_BASE);
  
  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(RES_BASE, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // ic_launcher.png (square)
    await sharp(SRC)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));
    console.log(`  ${folder}/ic_launcher.png (${size}x${size})`);
    
    // ic_launcher_round.png (circular mask)
    const size_big = Math.round(size * 1.5);
    const buf = await sharp(SRC)
      .resize(size_big, size_big, { fit: 'cover', position: 'center' })
      .toBuffer();
    
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size_big}" height="${size_big}">
        <circle cx="${size_big/2}" cy="${size_big/2}" r="${size_big/2}" fill="white"/>
      </svg>`
    );
    
    await sharp(buf)
      .resize(size, size)
      .composite([{
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
            <defs><mask id="m"><rect width="${size}" height="${size}" rx="${size/2}" fill="white"/></mask></defs>
          </svg>`
        ),
        blend: 'dest-in'
      }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));
    console.log(`  ${folder}/ic_launcher_round.png (${size}x${size})`);
  }
  
  // Generate adaptive icon foreground (white logo on transparent bg)
  for (const [folder, size] of Object.entries(FG_SIZES)) {
    const dir = path.join(RES_BASE, folder);
    await sharp(SRC)
      .resize(Math.round(size * 0.6), Math.round(size * 0.6), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
      .then(buf => {
        return sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        })
        .composite([{
          input: buf,
          gravity: 'center'
        }])
        .png()
        .toFile(path.join(dir, 'ic_launcher_foreground.png'));
      });
    console.log(`  ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }
  
  console.log('\nAll icons generated successfully!');
}

generate().catch(err => { console.error(err); process.exit(1); });
