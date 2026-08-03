import { TERMS_ROLE_PROVIDER, TERMS_ROLE_USER, type TermsRoleId } from "../types/api";

/** i18n key for a version's role scope chip. */
export function scopeLabelKey(roleId: TermsRoleId): string {
  if (roleId === TERMS_ROLE_PROVIDER) return "terms@scopeProviders";
  if (roleId === TERMS_ROLE_USER) return "terms@scopeUsers";
  return "terms@scopeAll";
}
