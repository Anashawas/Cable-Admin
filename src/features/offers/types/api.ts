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
  /** Cash value the offer's points represent, via the conversion rate (e.g. 100 pts / 50 = 2 JOD). NEW — pending BE. */
  pointsPriceValue?: number | null;
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
  /** Cash value the offer's points represent, via the conversion rate. NEW — pending BE. */
  pointsPriceValue?: number | null;
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
  /** Cash value the offer's points represent, via the conversion rate. NEW — pending BE. */
  pointsPriceValue?: number | null;
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
  /** Provider's current wallet balance, batched server-side (C6) — avoids the per-row fetch. */
  currentWalletBalance?: number | null;
}

export interface UpdateSettlementStatusRequest {
  status: SettlementStatus;
  note?: string | null;
}

/** One line-item behind a settlement — GET /api/offers/GetSettlementTransactions?settlementId={id}. */
export interface SettlementTransactionDto {
  activityType: "Partner" | "Offer" | "Redemption";
  transactionId: number;
  userId: number;
  userName: string | null;
  code: string | null;
  status: number;
  statusName: string | null;
  /** Signed: Partner = +awarded, Offer/Redemption = −spent. */
  points: number;
  amount: number | null;
  currencyCode: string | null;
  createdAt: string;
  completedAt: string | null;
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
  /** C2 — real server-side totals (fall back to client-derived when absent). */
  totalOutstandingAmount?: number;
  totalDisputedAmount?: number;
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
  /** The admin/system actor that created this wallet entry. */
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
  // --- NEW (pending BE) — the END user + underlying transaction behind this entry ---
  /** The customer whose offer/partner transaction produced this wallet entry. */
  relatedUserId?: number | null;
  relatedUserName?: string | null;
  /** The underlying offer/partner transaction(s) this wallet entry settled. */
  relatedTransactionIds?: number[] | null;
  /** Whether this underlying transaction can still be refunded to the user. */
  canRefund?: boolean;
}
