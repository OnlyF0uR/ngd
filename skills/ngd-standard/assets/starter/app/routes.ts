import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  // Public pages share the header and footer
  layout('routes/site-layout.tsx', [
    index('routes/home.tsx'),
    route('contact', 'routes/contact.tsx'),
  ]),
  // Resource routes (no UI)
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
] satisfies RouteConfig;
