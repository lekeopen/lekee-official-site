import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

await mkdir('dist', { recursive: true });

await build({
  entryPoints: ['functions/worker.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/_worker.js',
  platform: 'browser',
  target: 'es2022',
  sourcemap: false,
  minify: false,
});
