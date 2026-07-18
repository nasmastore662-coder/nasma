const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, 'assets', 'images', 'logo.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateFavicons() {
  // Generate PNG icons in multiple sizes
  const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'assets', 'images', `favicon-${size}.png`));
    console.log(`✓ favicon-${size}.png`);
  }

  // Copy the 32px version as favicon.ico (browsers accept PNG renamed as .ico)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'favicon.ico'));
  console.log('✓ favicon.ico');

  // Create apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, 'assets', 'images', 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  console.log('Done! All favicons generated.');
}

generateFavicons().catch(console.error);
