import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const logoPath = path.join(rootDir, 'public', 'logo.png');
const outputPath = path.join(rootDir, 'public', 'og-default.png');

const width = 600;
const height = 600;

const background = Buffer.from(`
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="blueGlow" cx="0" cy="0" r="1" gradientTransform="translate(90 110) rotate(35) scale(330 300)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#075DE7" stop-opacity="0.24"/>
        <stop offset="1" stop-color="#075DE7" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="orangeGlow" cx="0" cy="0" r="1" gradientTransform="translate(530 520) rotate(-145) scale(260 240)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FF8A00" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#FF8A00" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="base" x1="0" y1="0" x2="600" y2="600" gradientUnits="userSpaceOnUse">
        <stop stop-color="#050914"/>
        <stop offset="1" stop-color="#0A0D14"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#base)"/>
    <rect width="${width}" height="${height}" fill="url(#blueGlow)"/>
    <rect width="${width}" height="${height}" fill="url(#orangeGlow)"/>
    <path d="M0 510C150 470 260 545 390 505C480 478 545 430 600 445V600H0V510Z" fill="#FFFFFF" fill-opacity="0.018"/>
  </svg>
`);

const logo = await sharp(logoPath)
  .resize({ width: 430, height: 260, fit: 'inside', withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp(background)
  .composite([{ input: logo, gravity: 'centre' }])
  .flatten({ background: '#050914' })
  .removeAlpha()
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

console.log(`Generated default OG image: ${outputPath}`);
