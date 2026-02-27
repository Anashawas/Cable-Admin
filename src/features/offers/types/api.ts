// ============================================
// Conversion Rate DTOs
// ============================================

export interface ConversionRateDto {
  id: number;
  name: string;
  currencyCode: string;
  pointsPerUnit: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateConversionRateRequest {
  name: string;
  currencyCode: string;
  pointsPerUnit: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpdateConversionRateRequest {
  name: string;
  currencyCode: string;
  pointsPerUnit: number;
  isDefault: boolean;
  isActive: boolean;
}

// ============================================
// Offer DTOs
// ============================================

export type ProviderType = "ChargingPoint" | "ServiceProvider";

export enum ApprovalStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
}

export interface OfferDto {
  id: number;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  providerType: ProviderType;
  providerId: number;
  providerName: string;
  proposedByUserId: number;
  proposedByUserName: string;
  approvalStatus: ApprovalStatus;
  pointsCost: number;
  monetaryValue: number;
  currencyCode: string;
  maxUsesPerUser: number | null;
  maxTotalUses: number | null;
  currentTotalUses: number;
  offerCodeExpiryMinutes: number;
  imageUrl: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProposeOfferRequest {
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  providerType: ProviderType;
  providerId: number;
  pointsCost: number;
  monetaryValue: number;
  currencyCode: string;
  maxUsesPerUser?: number | null;
  maxTotalUses?: number | null;
  offerCodeExpiryMinutes: number;
  imageUrl?: string | null;
  validFrom: string;
  validTo: string;
}

export interface UpdateOfferRequest {
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  providerType: ProviderType;
  providerId: number;
  pointsCost: number;
  monetaryValue: number;
  currencyCode: string;
  maxUsesPerUser?: number | null;
  maxTotalUses?: number | null;
  offerCodeExpiryMinutes: number;
  imageUrl?: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface RejectOfferRequest {
  note: string;
}

// ============================================
// Transaction DTOs
// ============================================

export enum TransactionStatus {
  CodeGenerated = 1,
  Confirmed = 2,
  Cancelled = 3,
  Expired = 4,
}

export interface OfferTransactionDto {
  id: number;
  providerOfferId: number;
  offerTitle: string;
  userId: number;
  userName: string;
  offerCode: string;
  status: TransactionStatus;
  pointsDeducted: number;
  monetaryValue: number;
  currencyCode: string;
  providerType: ProviderType;
  providerId: number;
  confirmedByUserId: number | null;
  codeExpiresAt: string;
  completedAt: string | null;
  createdAt: string;
}

// ============================================
// Settlement DTOs
// ============================================

export enum SettlementStatus {
  Pending = 1,
  Invoiced = 2,
  Paid = 3,
  Disputed = 4,
}

export interface ProviderSettlementDto {
  id: number;
  providerType: ProviderType;
  providerId: number;
  providerOwnerId: number;
  providerOwnerName: string;
  periodYear: number;
  periodMonth: number;
  totalTransactions: number;
  totalTransactionAmount: number;
  totalCommissionAmount: number;
  totalPointsAwarded: number;
  totalPointsDeducted: number;
  settlementStatus: SettlementStatus;
  invoicedAt: string | null;
  paidAt: string | null;
  paidAmount: number | null;
  adminNote: string | null;
  createdAt: string;
}

export interface UpdateSettlementStatusRequest {
  status: SettlementStatus;
  paidAmount?: number | null;
  note?: string | null;
}

export interface GenerateSettlementRequest {
  year: number;
  month: number;
}

export interface SettlementSummaryDto {
  totalSettlements: number;
  totalTransactionAmount: number;
  totalCommissionAmount: number;
  totalPointsAwarded: number;
  totalPointsDeducted: number;
  pendingCount: number;
  invoicedCount: number;
  paidCount: number;
  disputedCount: number;
}
