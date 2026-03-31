import { server } from "@/lib/@axios";
import type {
  ConversionRateDto,
  CreateConversionRateRequest,
  UpdateConversionRateRequest,
  OfferDto,
  ProposeOfferRequest,
  UpdateOfferRequest,
  RejectOfferRequest,
  OfferTransactionDto,
  ProviderSettlementDto,
  UpdateSettlementStatusRequest,
  SettlementSummaryDto,
  ProviderType,
  AddWalletDepositRequest,
  WalletBalanceDto,
  WalletTransactionDto,
} from "../types/api";

// ============================================
// Conversion Rates
// ============================================

export const getAllConversionRates = async (): Promise<ConversionRateDto[]> => {
  const response = await server.get("/api/conversion-rates/GetAllConversionRates");
  return response.data;
};

export const createConversionRate = async (
  data: CreateConversionRateRequest
): Promise<number> => {
  const response = await server.post("/api/conversion-rates/CreateConversionRate", data);
  return response.data;
};

export const updateConversionRate = async (
  id: number,
  data: UpdateConversionRateRequest
): Promise<void> => {
  await server.put(`/api/conversion-rates/UpdateConversionRate/${id}`, data);
};

// ============================================
// Admin Offer Endpoints
// ============================================

export const getPendingOffers = async (): Promise<OfferDto[]> => {
  const response = await server.get("/api/offers/GetPendingOffers");
  return response.data;
};

export const getActiveOffers = async (params?: {
  providerType?: ProviderType;
  providerId?: number;
  categoryId?: number;
}): Promise<OfferDto[]> => {
  const response = await server.get("/api/offers/GetActiveOffers", { params });
  return response.data;
};

export const getOffersForProvider = async (params?: {
  providerType?: ProviderType;
  providerId?: number;
}): Promise<OfferDto[]> => {
  const response = await server.get("/api/offers/GetOffersForProvider", { params });
  return response.data;
};

export const getOfferById = async (id: number): Promise<OfferDto> => {
  const response = await server.get(`/api/offers/GetOfferById/${id}`);
  return response.data;
};

export const approveOffer = async (id: number): Promise<void> => {
  await server.put(`/api/offers/ApproveOffer/${id}`);
};

export const rejectOffer = async (id: number, data: RejectOfferRequest): Promise<void> => {
  await server.put(`/api/offers/RejectOffer/${id}`, data);
};

export const updateOffer = async (id: number, data: UpdateOfferRequest): Promise<void> => {
  await server.put(`/api/offers/UpdateOffer/${id}`, data);
};

export const deactivateOffer = async (id: number): Promise<void> => {
  await server.put(`/api/offers/DeactivateOffer/${id}`);
};

export const createOffer = async (data: ProposeOfferRequest): Promise<number> => {
  const response = await server.post("/api/offers/ProposeOffer", data);
  return response.data;
};

export const uploadOfferImage = async (offerId: number, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("files", file);
  await server.post(`/api/offerAttachments/AddOfferAttachment/${offerId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export interface OfferAttachmentDto {
  fileName: string;
  contentType: string;
  filePath: string;
  fileExtension: string;
  fileSize: number;
}

export const getOfferAttachments = async (offerId: number): Promise<OfferAttachmentDto[]> => {
  const response = await server.get(`/api/offerAttachments/GetOfferAttachments/${offerId}`);
  return response.data ?? [];
};

export const deleteOfferAttachments = async (offerId: number): Promise<void> => {
  await server.delete(`/api/offerAttachments/DeleteOfferAttachments/${offerId}`);
};

// ============================================
// Settlements
// ============================================

const normalizeSettlement = (raw: any): ProviderSettlementDto => ({
  id: raw.id,
  providerType: raw.providerDetails?.providerType ?? raw.providerType,
  providerId: raw.providerDetails?.providerId ?? raw.providerId,
  providerName: raw.providerDetails?.name ?? raw.providerName ?? "",
  providerPhone: raw.providerDetails?.phone ?? raw.providerPhone ?? null,
  providerAddress: raw.providerDetails?.address ?? raw.providerAddress ?? null,
  providerIcon: raw.providerDetails?.icon ?? raw.providerIcon ?? null,
  providerOwnerId: raw.ownerDetails?.ownerId ?? raw.providerOwnerId,
  providerOwnerName: raw.ownerDetails?.name ?? raw.providerOwnerName ?? "",
  ownerEmail: raw.ownerDetails?.email ?? raw.ownerEmail ?? null,
  ownerPhone: raw.ownerDetails?.phone ?? raw.ownerPhone ?? null,
  periodYear: raw.periodYear,
  periodMonth: raw.periodMonth,
  periodType: raw.periodType ?? 2,
  periodWeek: raw.periodWeek ?? 0,
  partnerTransactionCount: raw.partnerTransactions?.transactionCount ?? raw.partnerTransactionCount ?? 0,
  partnerTransactionAmount: raw.partnerTransactions?.transactionAmount ?? raw.partnerTransactionAmount ?? 0,
  partnerCommissionAmount: raw.partnerTransactions?.commissionAmount ?? raw.partnerCommissionAmount ?? 0,
  totalPointsAwarded: raw.partnerTransactions?.totalPointsAwarded ?? raw.totalPointsAwarded ?? 0,
  offerTransactionCount: raw.offerTransactions?.transactionCount ?? raw.offerTransactionCount ?? 0,
  offerPaymentAmount: raw.offerTransactions?.paymentAmount ?? raw.offerPaymentAmount ?? 0,
  totalPointsDeducted: raw.offerTransactions?.totalPointsDeducted ?? raw.totalPointsDeducted ?? 0,
  netBalance: raw.netBalance ?? 0,
  walletApplied: raw.walletApplied ?? 0,
  outstandingAmount: raw.outstandingAmount ?? 0,
  settlementStatus: raw.settlementStatus,
  paidAt: raw.paidAt,
  adminNote: raw.adminNote,
  createdAt: raw.createdAt,
});

const normalizeSummary = (raw: any): SettlementSummaryDto => ({
  ...raw,
  totalPartnerTransactions: raw.totalPartnerTransactions ?? 0,
  totalPartnerTransactionAmount: raw.totalPartnerTransactionAmount ?? 0,
  totalPartnerCommissionAmount: raw.totalPartnerCommissionAmount ?? 0,
  totalOfferTransactions: raw.totalOfferTransactions ?? 0,
  totalOfferPaymentAmount: raw.totalOfferPaymentAmount ?? 0,
  totalPointsAwarded: raw.totalPointsAwarded ?? 0,
  totalPointsDeducted: raw.totalPointsDeducted ?? 0,
  totalNetBalance: raw.totalNetBalance ?? 0,
  totalWalletApplied: raw.totalWalletApplied ?? 0,
});

export const getSettlements = async (params?: {
  providerType?: ProviderType;
  providerId?: number;
  status?: number;
  year?: number;
}): Promise<ProviderSettlementDto[]> => {
  const response = await server.get("/api/offers/GetSettlements", { params });
  return (response.data ?? []).map(normalizeSettlement);
};

export const getProviderSettlements = async (params: {
  providerType: ProviderType;
  providerId: number;
  status?: number;
  year?: number;
  week?: number;
  unpaidOnly?: boolean;
  hasDebt?: boolean;
}): Promise<ProviderSettlementDto[]> => {
  const response = await server.get("/api/offers/GetProviderSettlements", { params });
  return (response.data ?? []).map(normalizeSettlement);
};

export const getSettlementSummary = async (params?: {
  year?: number;
}): Promise<SettlementSummaryDto> => {
  const response = await server.get("/api/offers/GetSettlementSummary", { params });
  return normalizeSummary(response.data);
};

export const updateSettlementStatus = async (
  id: number,
  data: UpdateSettlementStatusRequest
): Promise<void> => {
  await server.put(`/api/offers/UpdateSettlementStatus/${id}`, data);
};

// ============================================
// Transactions (Read-only for admin)
// ============================================

export const getProviderTransactions = async (params: {
  providerType: ProviderType;
  providerId: number;
  status?: number;
}): Promise<OfferTransactionDto[]> => {
  const response = await server.get("/api/offers/GetProviderTransactions", { params });
  return response.data;
};

// ============================================
// Wallet (formerly PreCredit)
// ============================================

export const addWalletDeposit = async (data: AddWalletDepositRequest): Promise<number> => {
  const response = await server.post("/api/offers/AddWalletDeposit", data);
  return response.data;
};

export const getWalletBalance = async (params: {
  providerType: ProviderType;
  providerId: number;
}): Promise<WalletBalanceDto> => {
  const response = await server.get("/api/offers/GetWalletBalance", { params });
  return response.data;
};

export const getWalletHistory = async (params: {
  providerType: ProviderType;
  providerId: number;
}): Promise<WalletTransactionDto[]> => {
  const response = await server.get("/api/offers/GetWalletHistory", { params });
  return response.data;
};
