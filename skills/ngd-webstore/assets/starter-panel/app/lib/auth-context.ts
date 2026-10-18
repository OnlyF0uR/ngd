import { createContext } from 'react-router';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type SessionUser = { id: string; name: string; email: string; role: Role; tenantId: string };

/** The signed-in user, set by the panel layout's middleware:  const user = context.get(userContext); */
export const userContext = createContext<SessionUser>();
