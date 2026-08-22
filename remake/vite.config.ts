import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/tree-sitter-wasms/out/*.wasm',
          dest: 'tree-sitter'
        },
        {
          src: 'node_modules/web-tree-sitter/web-tree-sitter.wasm',
          dest: 'tree-sitter',
          rename: 'tree-sitter.wasm'
        }
      ]
    }),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
