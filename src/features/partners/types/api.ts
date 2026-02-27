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
