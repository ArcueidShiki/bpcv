import { cpSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** React pages. Each is its own HTML entry so the legacy engines (which all
 *  attach to globalThis.FIN) never share a page and cannot collide. */
const PAGES = ['index', 'orders', 'indicators', 'options', 'math', 'calendars'] as const;

/** Hand-written pages and assets that are not React. Copied into dist as-is. */
const STATIC = [
  'market-tycoon.html',
  'cv.html', 'cv2.html', 'journal.html', 'paints.html', 'text-effect.html', 'thunderstorm.html',
  'demo-cube-tunnel.html', 'demo-image-shatter.html', 'demo-sphere-packing.html',
  '十倍股观察池_2026-08.html', 'claude-code-cheatsheet.pdf',
  'css', 'js', 'icons', 'resume',
];

function copyStatic(): Plugin {
  let outDir = resolve(__dirname, 'dist');
  return {
    name: 'copy-static',
    apply: 'build',
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); },
    closeBundle() {
      for (const p of STATIC) {
        const from = resolve(__dirname, p);
        if (!existsSync(from)) throw new Error(`copy-static: missing ${p}`);
        cpSync(from, resolve(outDir, p), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  root: 'site',
  base: './',
  plugins: [react(), copyStatic()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p, resolve(__dirname, 'site', `${p}.html`)])),
    },
  },
});
