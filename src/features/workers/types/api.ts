/**
 * Workers (Provider Managers) — the accounts, besides the owner, allowed to manage a provider
 * (ServiceProvider OR ChargingPoint). Several per provider since the worker tracker; the station's plan sets the
 * limit (one on the free plan, unlimited with the "workers" feature). Workers sign in to the partner app by phone
 * with a temporary password the owner shares; admins can issue a new one and unlock a login for support.
 */

export type WorkerProviderType = "ServiceProvider" | "ChargingPoint";

/** One row of GET /api/workers (a list). */
export interface WorkerDto {
  providerManagerId: number;
  userId: number;
  name: string;
  phone: string | null;
  email: string | null;
  /** The owner's switch. */
  isActive: boolean;
  /** active | suspended | suspendedByPlan */
  status: "active" | "suspended" | "suspendedByPlan";
  /** pendingFirstLogin | active | locked */
  loginStatus: "pendingFirstLogin" | "active" | "locked";
  firstLoginAt: string | null;
  mustChangePassword: boolean;
  tempPasswordExpiresAt: string | null;
  lockedUntil: string | null;
  /** ISO timestamp (Jordan time). */
  assignedAt: string;
  privileges: string[];
  effectivePrivileges: string[];
  keepOnFree: boolean;
}

/** Payload for POST /api/workers — the owner's wizard in one call (admins may call it for support). */
export interface CreateWorkerRequest {
  providerType: WorkerProviderType;
  providerId: number;
  name: string;
  phone: string;
  email?: string | null;
  privileges?: string[];
  tempPassword?: string | null;
}

/** What is shared with the worker. The password is shown once; the server keeps only the hash. */
export interface WorkerCredentials {
  providerManagerId: number;
  workerUserId: number;
  tempPassword: string;
  tempPasswordExpiresAt: string;
  shareMessage: string;
}

export interface CreateWorkerResponse extends WorkerCredentials {
  existingAccount: boolean;
  lockedPrivileges: string[];
}
