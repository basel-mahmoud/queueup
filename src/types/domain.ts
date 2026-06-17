/** Core domain enums, kept in one place and mirrored by the Postgres enum types. */

export const ROLES = ['owner', 'manager', 'staff'] as const;
export type Role = (typeof ROLES)[number];

export const ENTRY_STATUSES = [
  'waiting',
  'called',
  'serving',
  'served',
  'no_show',
  'cancelled',
] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

/** Statuses that still occupy a place in line (count toward position/ETA). */
export const ACTIVE_STATUSES: EntryStatus[] = ['waiting', 'called', 'serving'];

/** Statuses that close out an entry. */
export const TERMINAL_STATUSES: EntryStatus[] = ['served', 'no_show', 'cancelled'];

/** Roles permitted to mutate queue/business data (viewers/none are read-only). */
export const MUTATING_ROLES: Role[] = ['owner', 'manager', 'staff'];

/** Roles permitted to manage members, settings, and billing. */
export const ADMIN_ROLES: Role[] = ['owner', 'manager'];

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === 'owner' || role === 'manager';
}

export function canMutate(role: Role | null | undefined): boolean {
  return role === 'owner' || role === 'manager' || role === 'staff';
}
