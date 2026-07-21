/**
 * Worker (Provider Manager) — a second account, besides the owner, allowed to
 * manage a single provider (ServiceProvider OR ChargingPoint). One worker per
 * provider; managed by the owner/admin.
 */

export type WorkerProviderType = "ServiceProvider" | "ChargingPoint";

/** Response from GET /api/workers — the single worker for a provider, or null. */
export interface WorkerDto {
  providerManagerId: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  /** ISO timestamp (e.g. "2026-06-22T10:00:00"). */
  assignedAt: string;
}

/** Payload for POST /api/workers — creates the worker account and assigns it. */
export interface CreateWorkerRequest {
  providerType: WorkerProviderType;
  providerId: number;
  name: string;
  email: string;
  phone: string;
  password: string;
}

/** Response from POST /api/workers. */
export interface CreateWorkerResponse {
  workerUserId: number;
  providerManagerId: number;
}
