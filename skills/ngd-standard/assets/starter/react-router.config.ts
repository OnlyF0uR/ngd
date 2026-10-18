import type { Config } from '@react-router/dev/config';
import { prerenderPaths } from './app/content/pages';

export default {
  // Server rendering stays on for every route that isn't prerendered (forms, live data, panels).
  ssr: true,
  // Static HTML at build time for pages whose content only changes on deploy. Never list a route with an action.
  prerender: prerenderPaths,
} satisfies Config;
