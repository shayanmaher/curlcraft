import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
