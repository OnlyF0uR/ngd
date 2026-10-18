import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { imagetools } from 'vite-imagetools';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // Responsive, hashed AVIF/WebP variants generated at build time from image imports
    imagetools(),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
    // Explicit alias so `composes: x from '~/styles/…'` resolves inside CSS Modules too
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) },
  },
});
