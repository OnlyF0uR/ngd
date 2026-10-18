import { createContext } from 'react-router';

/**
 * Typed access to the Worker's bindings (env) and execution context (ctx) in loaders,
 * actions and middleware:  const { env, ctx } = context.get(cloudflareContext);
 * workers/app.ts sets it for every request (and for prerendering).
 */
export type CloudflareContext = { env: Env; ctx: ExecutionContext };

export const cloudflareContext = createContext<CloudflareContext>();
