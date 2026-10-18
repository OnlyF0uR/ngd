import { data } from 'react-router';
import type { Role, SessionUser } from './auth-context';

/**
 * Roles → permissions, in one place. Check them on the server in every loader and action:
 * hiding a button is only UX. Records outside the user's tenant answer 404, not 403.
 */
const PERMISSIONS = {
  'customers.view': ['owner', 'admin', 'member', 'viewer'],
  'customers.edit': ['owner', 'admin', 'member'],
  'customers.delete': ['owner', 'admin'],
  'settings.manage': ['owner'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(user: SessionUser, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(user.role);
}

export function requirePermission(user: SessionUser, permission: Permission): void {
  if (!can(user, permission)) throw data(null, { status: 403 });
}
