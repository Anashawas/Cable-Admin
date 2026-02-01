import type { RoleDto } from "../types/api";

/**
 * Fallback role options for Edit User (spec: roles are dynamic from API).
 * Include current user role when building options in the form.
 */
export const DEFAULT_ROLES: RoleDto[] = [
  { id: 1, name: "Admin" },
  { id: 2, name: "User" },
];
