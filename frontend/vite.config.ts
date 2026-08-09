import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The contract glue (../contracts/*.ts) is outside this package's root, so
// bare `@midnight-ntwrk/*` imports from it normally resolve against the root
// repo's node_modules (or fail entirely on a fresh clone / CI). This plugin
// redirects those imports to this package's own copy while still honoring the
// packages' `exports` maps, so the frontend builds standalone.
const resolveMidnightFromLocal = (): Plugin => ({
  name: 'midnight-local-resolution',
  async resolveId(source, importer) {
    if (!importer) return null;
    if (path.resolve(importer).startsWith(path.resolve(__dirname, '..', 'contracts'))) {
      const target = path.join(__dirname, 'node_modules', source);
      if (target && !source.startsWith('.') && !path.isAbsolute(source)) {
        const resolved = await this.resolve(source, target);
        if (resolved) return resolved;
      }
    }
    return null;
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  cacheDir: './.vite',
  server: {
    // Allow importing the shared contract glue (../contracts) during dev.
    fs: {
      allow: [__dirname, path.resolve(__dirname, '..')],
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
    mainFields: ['browser', 'module', 'main'],
    alias: {
      '@notary-contract': path.resolve(__dirname, '..', 'contracts'),
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate chunk for WASM modules to avoid top-level await issues
          if (id.includes('onchain-runtime-v3')) return 'wasm';
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: ['.js', '.cjs'],
      ignoreDynamicRequires: true,
    },
  },
  plugins: [
    react(),
    wasm(),
    resolveMidnightFromLocal(),
    topLevelAwait({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
    {
      name: 'wasm-module-resolver',
      resolveId(source, importer) {
        if (
          source === '@midnight-ntwrk/onchain-runtime-v3' &&
          importer &&
          importer.includes('@midnight-ntwrk/compact-runtime')
        ) {
          return { id: source, external: false, moduleSideEffects: true };
        }
        return null;
      },
    },
  ],
  optimizeDeps: {
    rolldownOptions: {
      platform: 'browser',
      moduleTypes: { '.wasm': 'binary' },
    },
    include: ['@midnight-ntwrk/compact-runtime'],
    exclude: [
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.wasm',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm.js',
    ],
  },
  define: {},
});
