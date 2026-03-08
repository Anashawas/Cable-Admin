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
  GenerateSettlementRequest,
  SettlementSummaryDto,
  ProviderType,
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

// ============================================
// Settlements
// ============================================

export const getSettlements = async (params?: {
  providerType?: ProviderType;
  providerId?: number;
  status?: number;
  year?: number;
  month?: number;
}): Promise<ProviderSettlementDto[]> => {
  const response = await server.get("/api/offers/GetSettlements", { params });
  return response.data;
};

export const getSettlementSummary = async (params?: {
  year?: number;
  month?: number;
}): Promise<SettlementSummaryDto> => {
  const response = await server.get("/api/offers/GetSettlementSummary", { params });
  return response.data;
};

export const updateSettlementStatus = async (
  id: number,
  data: UpdateSettlementStatusRequest
): Promise<void> => {
  await server.put(`/api/offers/UpdateSettlementStatus/${id}`, data);
};

export const generateSettlement = async (data: GenerateSettlementRequest): Promise<number> => {
  const response = await server.post("/api/offers/GenerateSettlement", data);
  return response.data;
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
