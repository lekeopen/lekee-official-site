import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const longitude = 105.7395;
const latitude = 34.584619;
const zoom = 16;
const tileSize = 256;
const tilesAcross = 6;
const tilesDown = 4;
const outputWidth = 1200;
const outputHeight = 420;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDirectory, '../public/images/office-map.webp');

const longitudeToTile = (value, level) => ((value + 180) / 360) * (2 ** level);
const latitudeToTile = (value, level) => {
  const radians = value * Math.PI / 180;
  return (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * (2 ** level);
};

const centerTileX = longitudeToTile(longitude, zoom);
const centerTileY = latitudeToTile(latitude, zoom);
const firstTileX = Math.floor(centerTileX) - Math.floor(tilesAcross / 2);
const firstTileY = Math.floor(centerTileY) - Math.floor(tilesDown / 2);

const tileComposites = await Promise.all(
  Array.from({ length: tilesAcross * tilesDown }, async (_, index) => {
    const column = index % tilesAcross;
    const row = Math.floor(index / tilesAcross);
    const tileX = firstTileX + column;
    const tileY = firstTileY + row;
    const response = await fetch(`https://tile.openstreetmap.de/${zoom}/${tileX}/${tileY}.png`, {
      headers: { 'User-Agent': 'lekeopen-office-map-generator/1.0 (https://lekeopen.com)' },
    });

    if (!response.ok) {
      throw new Error(`Unable to download map tile ${tileX}/${tileY}: ${response.status}`);
    }

    return {
      input: Buffer.from(await response.arrayBuffer()),
      left: column * tileSize,
      top: row * tileSize,
    };
  }),
);

const sourceWidth = tilesAcross * tileSize;
const sourceHeight = tilesDown * tileSize;
const markerSourceX = (centerTileX - firstTileX) * tileSize;
const markerSourceY = (centerTileY - firstTileY) * tileSize;
const cropLeft = Math.round(markerSourceX - outputWidth / 2);
const cropTop = Math.round(markerSourceY - outputHeight / 2);

const overlay = Buffer.from(`
  <svg width="${outputWidth}" height="${outputHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.28"/></filter></defs>
    <g filter="url(#shadow)">
      <path d="M600 224 C585 224 574 213 574 198 C574 179 600 158 600 158 C600 158 626 179 626 198 C626 213 615 224 600 224Z" fill="#2563eb"/>
      <circle cx="600" cy="197" r="8" fill="#ffffff"/>
      <rect x="628" y="174" width="226" height="49" rx="12" fill="#ffffff" fill-opacity="0.96"/>
      <text x="648" y="197" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="16" font-weight="700" fill="#111827">乐可开源</text>
      <text x="648" y="215" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="12" fill="#64748b">安居小区 E 区</text>
    </g>
    <rect x="901" y="387" width="287" height="23" rx="6" fill="#ffffff" fill-opacity="0.9"/>
    <text x="1177" y="403" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="#475569">© OpenStreetMap contributors</text>
  </svg>
`);

await mkdir(path.dirname(outputPath), { recursive: true });
const mapMosaic = await sharp({ create: { width: sourceWidth, height: sourceHeight, channels: 3, background: '#e5e7eb' } })
  .composite(tileComposites)
  .png()
  .toBuffer();

await sharp(mapMosaic)
  .extract({ left: cropLeft, top: cropTop, width: outputWidth, height: outputHeight })
  .composite([{ input: overlay, left: 0, top: 0 }])
  .webp({ quality: 84, smartSubsample: true })
  .toFile(outputPath);

console.log(`Generated ${outputPath}`);
