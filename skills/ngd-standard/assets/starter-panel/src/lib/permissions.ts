import type { Role, SessionUser } from './auth.server';

/**
 * Roles → permissions, in one place. Check them on the server in every server function: hiding a
 * button is only UX. Records outside the user's tenant answer notFound(), not "forbidden".
 */
const PERMISSIONS = {
  'customers.view': ['owner', 'admin', 'member', 'viewer'],
  'customers.edit': ['owner', 'admin', 'member'],
  'customers.delete': ['owner', 'admin'],
  'settings.manage': ['owner'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

/** The message of the error requirePermission throws; PanelError shows the "no access" screen for it. */
export const FORBIDDEN = 'Forbidden';

export function can(user: SessionUser, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(user.role);
}

export function requirePermission(user: SessionUser, permission: Permission): void {
  if (!can(user, permission)) throw new Error(FORBIDDEN);
}
