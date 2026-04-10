import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceImage = path.join(__dirname, 'public', 'icon_v2.jpg');
const outputDir = path.join(__dirname, 'public');

const sizes = [16, 48, 128];

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon${size}.png`);
    await sharp(sourceImage)
      .resize(size, size, { fit: 'cover' })
      // Treat near-black as transparent
      .ensureAlpha()
      .toFormat('png')
      .toBuffer()
      .then(data => {
         // Second pass to apply transparency via thresholding the black background
         return sharp(data)
           .extractChannel('red') // Use red channel to detect shape
           .threshold(5) // Anything darker than 5 is bg
           .toBuffer()
           .then(mask => {
             return sharp(data)
               .joinChannel(mask)
               .toFile(outputPath);
           });
      });
    console.log(`Created: icon${size}.png (${size}x${size})`);
  }
  console.log('Done! All PNG icons generated with transparency.');
}

generateIcons();
