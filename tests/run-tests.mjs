import { build } from 'esbuild';
import { mkdir, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

// Angular's build tool supplies esbuild; no browser or third-party test runner is needed.
const files = (await readdir(new URL('.', import.meta.url))).filter(file => file.endsWith('.test.ts'));
const outdir = 'tmp/messaging-tests';
await mkdir(outdir, { recursive: true });
await build({
  entryPoints: files.map(file => `tests/${file}`), outdir, bundle: true, packages: 'external',
  platform: 'node', format: 'esm', target: 'node22', outExtension: { '.js': '.mjs' },
});
const result = spawnSync(process.execPath, ['--test', ...files.map(file => `${outdir}/${file.replace(/\.ts$/, '.mjs')}`)], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
