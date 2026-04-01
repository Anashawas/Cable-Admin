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
  codeExpirySeconds: number;
  minimumTransactionAmount: number | null;
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
  codeExpirySeconds: number;
  minimumTransactionAmount?: number | null;
  isActive?: boolean;
  note?: string | null;
}

export interface UpdatePartnerAgreementRequest {
  providerType?: PartnerProviderType;
  providerId?: number;
  commissionPercentage?: number;
  pointsRewardPercentage?: number;
  pointsConversionRateId?: number | null;
  codeExpirySeconds?: number;
  minimumTransactionAmount?: number | null;
  isActive?: boolean;
  note?: string | null;
}

// ============================================
// Credit Limit & Balance DTOs
// ============================================

export interface SetCreditLimitRequest {
  providerType: PartnerProviderType;
  providerId: number;
  creditLimit: number | null; // null = unlimited
}

export interface ProviderWalletTransactionDto {
  id: number;
  providerId: number;
  providerType: PartnerProviderType;
  amount: number;
  transactionType: number;
  settlementId: number | null;
  note: string | null;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
}

export interface ProviderBalanceDto {
  walletBalance: number;              // positive = credit, negative = debt
  walletCreditLimit: number | null;   // max debt allowed, null = unlimited
  availableCredit: number | null;     // how much more before blocked
  walletTransactions: ProviderWalletTransactionDto[];
}
