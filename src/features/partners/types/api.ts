/**
 * Partner agreement (permanent B2B partnership).
 * Providers use the Cable Partner app to confirm PTR-XXXXXX transactions.
 */

export type PartnerProviderType = "ChargingPoint" | "ServiceProvider";

export interface PartnerAgreementDto {
  id: number;
  providerType: PartnerProviderType;
  providerId: number;
  providerName?: string | null;
  commissionPercentage: number;
  pointsRewardPercentage: number;
  pointsConversionRateId?: number | null;
  codeExpiryMinutes: number;
  isActive: boolean;
  note?: string | null;
  createdAt?: string | null;
}

export interface CreatePartnerAgreementRequest {
  providerType: PartnerProviderType;
  providerId: number;
  commissionPercentage: number;
  pointsRewardPercentage: number;
  pointsConversionRateId?: number | null;
  codeExpiryMinutes: number;
  isActive?: boolean;
  note?: string | null;
}

export interface UpdatePartnerAgreementRequest {
  providerType?: PartnerProviderType;
  providerId?: number;
  commissionPercentage?: number;
  pointsRewardPercentage?: number;
  pointsConversionRateId?: number | null;
  codeExpiryMinutes?: number;
  isActive?: boolean;
  note?: string | null;
}

// ============================================
// Credit Limit & Balance DTOs — 2026-02-28
// ============================================

export interface RecordProviderPaymentRequest {
  providerType: PartnerProviderType;
  providerId: number;
  amount: number;
  note?: string | null;
}

export interface SetCreditLimitRequest {
  providerType: PartnerProviderType;
  providerId: number;
  creditLimit: number | null; // null = unlimited
}

export interface ProviderPaymentRecordDto {
  id: number;
  amount: number;
  note: string | null;
  recordedByUserName: string | null;
  createdAt: string;
}

export interface ProviderBalanceDto {
  creditLimit: number | null;        // null = unlimited
  currentBalance: number;            // positive = credit, negative = debt
  availableCredit: number | null;    // creditLimit + currentBalance, null if no limit
  recentPayments: ProviderPaymentRecordDto[];
}
