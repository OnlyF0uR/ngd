import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { imagetools } from 'vite-imagetools';
import { prerenderPaths } from './src/content/pages';

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // Responsive, hashed AVIF/WebP variants generated at build time from image imports
    imagetools(),
    tanstackStart({
      // Static HTML at build time for the pages listed in src/content/pages.ts, and nothing else:
      // no automatic discovery or link crawling, so a route with a POST handler is never prerendered by accident.
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        autoSubfolderIndex: false, // /about → about.html, served at /about (wrangler: html_handling)
        failOnError: true,
      },
      pages: prerenderPaths.map((path) => ({ path })),
    }),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
    // Explicit alias so `composes: x from '~/styles/…'` resolves inside CSS Modules too
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
