import { readFile, writeFile } from 'node:fs/promises';

const sourceUrl = new URL('../src/products/releases.json', import.meta.url);
const outputUrl = new URL('../functions/support/release-data.generated.mjs', import.meta.url);
const source = JSON.parse(await readFile(sourceUrl, 'utf8'));
await writeFile(outputUrl, `// Generated from src/products/releases.json. Do not edit.\nexport default ${JSON.stringify(source)};\n`);
