import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const productDir = (slug) => path.join(root, 'public', 'images', 'products', slug);
const sourceDir = (slug) => path.join(root, 'assets', 'product-source', slug);

async function cropToGallery(source, output, { top = 0, height, position = 'centre' } = {}) {
  let pipeline = sharp(source);
  const metadata = await pipeline.metadata();
  if (height) {
    pipeline = pipeline.extract({
      left: 0,
      top: Math.min(top, Math.max(0, (metadata.height ?? height) - height)),
      width: metadata.width,
      height: Math.min(height, metadata.height ?? height),
    });
  }

  await pipeline
    .resize(1200, 675, { fit: 'cover', position })
    .webp({ quality: 84, effort: 5 })
    .toFile(output);
}

async function createOg({ slug, title, subtitle, accent, icon }) {
  const background = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#07111f"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <circle cx="1080" cy="60" r="270" fill="${accent}" opacity="0.18"/>
      <text x="90" y="105" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="30" fill="#cbd5e1">乐可开源 · 产品</text>
      <text x="90" y="280" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="92" font-weight="700" fill="#ffffff">${title}</text>
      <text x="92" y="365" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="38" fill="#dbeafe">${subtitle}</text>
      <rect x="90" y="455" width="190" height="10" rx="5" fill="${accent}"/>
      <text x="90" y="535" font-family="ui-monospace, SFMono-Regular, monospace" font-size="28" fill="#94a3b8">lekeopen.com/products/${slug}</text>
    </svg>`);

  const iconBuffer = await sharp(icon).resize(220, 220, { fit: 'contain' }).png().toBuffer();
  await sharp(background)
    .composite([{ input: iconBuffer, left: 870, top: 185 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(productDir(slug), 'og.png'));
}

const picker = productDir('leke-picker');
const pickerSource = sourceDir('leke-picker');
await cropToGallery(path.join(pickerSource, 'main.png'), path.join(picker, 'main.webp'), { top: 0, height: 712 });
await cropToGallery(path.join(pickerSource, 'main.png'), path.join(picker, 'roster.webp'), { top: 460, height: 712 });
await cropToGallery(path.join(pickerSource, 'result.png'), path.join(picker, 'result.webp'), { top: 0, height: 712 });
await cropToGallery(path.join(pickerSource, 'result.png'), path.join(picker, 'controls.webp'), { top: 760, height: 712 });

const guigelei = productDir('guigelei');
const guigeleiSource = sourceDir('guigelei');
await cropToGallery(path.join(guigeleiSource, 'plans.png'), path.join(guigelei, 'overview.webp'), { top: 0, height: 638 });
await cropToGallery(path.join(guigeleiSource, 'plans.png'), path.join(guigelei, 'plans.webp'), { top: 43, height: 638 });
await cropToGallery(path.join(guigeleiSource, 'plans.png'), path.join(guigelei, 'customize.webp'), { top: 86, height: 638 });
await cropToGallery(path.join(guigeleiSource, 'plans.png'), path.join(guigelei, 'actions.webp'), { top: 130, height: 638 });

await createOg({
  slug: 'leke-picker',
  title: '乐可点名',
  subtitle: '课堂随机点名工具',
  accent: '#3b82f6',
  icon: path.join(pickerSource, 'mark.svg'),
});

await createOg({
  slug: 'guigelei',
  title: '归个类',
  subtitle: '本地文件整理工具',
  accent: '#10b981',
  icon: path.join(guigeleiSource, 'icon.png'),
});

console.log('Generated product gallery and social assets.');
