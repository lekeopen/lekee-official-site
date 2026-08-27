import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const logoPath = path.join(rootDir, 'public', 'logo.png');
const outputPath = path.join(rootDir, 'public', 'og-default.png');
const projectImageDir = path.join(rootDir, 'public', 'images', 'projects', 'ai-data-platform');
const dashboardPath = path.join(projectImageDir, 'ai-data-platform-dashboard.png');
const projectOgPath = path.join(projectImageDir, 'ai-data-platform-og.png');

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

const dashboard = await sharp(dashboardPath)
  .resize(600, 414, { fit: 'cover', position: 'top' })
  .png()
  .toBuffer();

const projectBackground = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="projectBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#071426"/>
        <stop offset="1" stop-color="#0f2f55"/>
      </linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(230 80) rotate(35) scale(470 390)">
        <stop stop-color="#2563eb" stop-opacity="0.42"/>
        <stop offset="1" stop-color="#2563eb" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#projectBg)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <text x="70" y="72" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="25" font-weight="600" fill="#bfdbfe">乐可开源 · 工程项目与实践</text>
    <text x="70" y="176" font-family="Arial, PingFang SC, sans-serif" font-size="55" font-weight="700" fill="#ffffff">AI Data Platform</text>
    <text x="70" y="260" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="34" font-weight="600" fill="#dbeafe">把分散资料变成可信、</text>
    <text x="70" y="310" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="34" font-weight="600" fill="#dbeafe">可查询、可追溯的数据</text>
    <rect x="70" y="382" width="154" height="6" rx="3" fill="#60a5fa"/>
    <text x="70" y="445" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="22" fill="#93c5fd">真实 Golden Demo</text>
    <text x="70" y="480" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="22" fill="#93c5fd">海川实验学校（虚构）</text>
    <text x="70" y="555" font-family="ui-monospace, SFMono-Regular, monospace" font-size="22" fill="#94a3b8">lekeopen.com/projects/ai-data-platform/</text>
    <rect x="558" y="104" width="622" height="440" rx="25" fill="#ffffff" fill-opacity="0.12"/>
  </svg>`);

await sharp(projectBackground)
  .composite([{ input: dashboard, left: 564, top: 110 }])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(projectOgPath);

console.log(`Generated AI Data Platform OG image: ${projectOgPath}`);
