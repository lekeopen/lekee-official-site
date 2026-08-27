import { readFile, writeFile } from 'node:fs/promises';

const sourceUrl = new URL('../src/products/releases.json', import.meta.url);
const outputUrl = new URL('../functions/support/release-data.generated.mjs', import.meta.url);
const downloadOutputUrl = new URL('../functions/download/release-data.generated.mjs', import.meta.url);
const source = JSON.parse(await readFile(sourceUrl, 'utf8'));
const generated = `// Generated from src/products/releases.json. Do not edit.\nexport default ${JSON.stringify(source)};\n`;
await writeFile(outputUrl, generated);
await writeFile(downloadOutputUrl, generated);
