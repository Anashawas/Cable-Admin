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
  offerCodeExpirySeconds: number | null;
  imageUrl: string | null;
  validFrom: string;
  validTo: string | null;
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
  offerCodeExpirySeconds?: number | null;
  imageUrl?: string | null;
  validFrom: string;
  validTo?: string | null;
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
  offerCodeExpirySeconds?: number | null;
  imageUrl?: string | null;
  validFrom: string;
  validTo?: string | null;
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
  Paid = 3,
  Disputed = 4,
}

export interface ProviderSettlementDto {
  id: number;
  // Provider details
  providerType: ProviderType;
  providerId: number;
  providerName: string;
  providerPhone: string | null;
  providerAddress: string | null;
  providerIcon: string | null;
  // Owner details
  providerOwnerId: number;
  providerOwnerName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  // Period
  periodYear: number;
  periodMonth: number;
  periodType: number;
  periodWeek: number;
  // Partner transactions
  partnerTransactionCount: number;
  partnerTransactionAmount: number;
  partnerCommissionAmount: number;
  totalPointsAwarded: number;
  // Offer transactions
  offerTransactionCount: number;
  offerPaymentAmount: number;
  totalPointsDeducted: number;
  // Financials
  netBalance: number; // OfferPaymentAmount - PartnerCommissionAmount (positive = Cable owes, negative = provider owes)
  walletApplied: number;
  outstandingAmount: number; // PartnerCommissionAmount - WalletApplied (computed)
  // Status & dates
  settlementStatus: SettlementStatus;
  paidAt: string | null;
  adminNote: string | null;
  createdAt: string;
}

export interface UpdateSettlementStatusRequest {
  status: SettlementStatus;
  note?: string | null;
}

export interface SettlementSummaryDto {
  totalSettlements: number;
  totalPartnerTransactions: number;
  totalPartnerTransactionAmount: number;
  totalPartnerCommissionAmount: number;
  totalPointsAwarded: number;
  totalOfferTransactions: number;
  totalOfferPaymentAmount: number;
  totalPointsDeducted: number;
  totalNetBalance: number;
  totalWalletApplied: number;
  pendingCount: number;
  paidCount: number;
  disputedCount: number;
}

// ============================================
// Wallet DTOs (formerly PreCredit)
// ============================================

export enum WalletTransactionType {
  Deposit = 1,
  SettlementDeduction = 2,
  Refund = 3,
  Adjustment = 4,
  CommissionDeduction = 5,
  CommissionRefund = 6,
  OfferPaymentCredit = 7,
  OfferPaymentRefund = 8,
}

export interface AddWalletDepositRequest {
  providerId: number;
  providerType: ProviderType;
  amount: number;
  transactionType: WalletTransactionType;
  note?: string | null;
}

export interface WalletBalanceDto {
  providerId: number;
  providerType: ProviderType;
  providerOwnerName: string;
  walletBalance: number; // positive = credit, negative = debt
  totalDeposited: number;
  totalDeducted: number;
  walletCreditLimit: number | null; // max debt allowed, null = unlimited
  availableCredit: number | null; // how much more debt before blocked
}

export interface WalletTransactionDto {
  id: number;
  providerId: number;
  providerType: ProviderType;
  amount: number;
  transactionType: WalletTransactionType;
  settlementId: number | null;
  note: string | null;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
}
