/**
 * Terms & Conditions — versioned policies with acceptance tracking.
 * Backend tag: "Terms & Conditions".
 */

/** Role scoping for a policy version. null = every role. */
export const TERMS_ROLE_ALL = null;
export const TERMS_ROLE_USER = 3;
export const TERMS_ROLE_PROVIDER = 4;

export type TermsRoleId = number | null;

/** Row in the admin versions list — content is excluded by the backend. */
export interface TermsVersionSummaryDto {
  id: number;
  systemVersion: string;
  roleId: TermsRoleId;
  effectiveFrom: string | null;
  isActive: boolean;
  /** How many users have accepted this specific version. */
  acceptanceCount: number;
  createdAt?: string | null;
  createdBy?: string | null;
}

/** GET admin/GetTermsVersionById/{id} — same as the summary plus both bodies. */
export interface TermsVersionDetailDto extends TermsVersionSummaryDto {
  contentEn: string;
  contentAr: string;
}

/** POST admin/PublishTermsVersion */
export interface PublishTermsVersionRequest {
  systemVersion: string;
  /** Omit or null to target every role. */
  roleId?: TermsRoleId;
  contentEn: string;
  contentAr: string;
  /** ISO string. Optional — backend activates immediately regardless. */
  effectiveFrom?: string | null;
}

/**
 * GET /api/terms/GetCurrentTerms — the policy applicable to the caller.
 * Not used by the admin screens, but typed here so the shape lives in one
 * place (the partner app mirrors this contract).
 */
export interface CurrentTermsDto {
  id: number;
  systemVersion: string;
  roleId: TermsRoleId;
  effectiveFrom: string | null;
  contentEn: string;
  contentAr: string;
  hasAccepted: boolean;
  acceptedAt: string | null;
}
