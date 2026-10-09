import { server } from "@/lib/@axios";

/** Mirrors Application/Pricing/PricingFeature.cs. */
export interface TouWindowDto {
  key: string;
  startMin: number;
  endMin: number;
  tier: "offPeak" | "partial" | "peak";
  priceFils: number;
  nameEn: string;
  nameAr: string;
}

export interface TouTariffDto {
  version: number;
  effectiveFrom: string;
  timezone: string;
  currency: string;
  unit: string;
  windows: TouWindowDto[];
}

export interface TouTariffVersionDto {
  version: number;
  effectiveFrom: string;
  isActive: boolean;
  note?: string | null;
  createdAt: string;
}

export interface PriceAlertSubscriberCountDto { windowKey: string; leadMinutes: number; users: number }
export interface PriceAlertSentDto { windowKey: string; alertDate: string; leadMinutes: number; users: number; sentAt: string }

export interface PriceAlertAdminOverviewDto {
  tariff?: TouTariffDto | null;
  versions: TouTariffVersionDto[];
  quietFrom: string;
  quietTo: string;
  enabledUsers: number;
  subscribers: PriceAlertSubscriberCountDto[];
  recentSends: PriceAlertSentDto[];
}

export interface PriceAlertPreviewItemDto {
  windowKey: string;
  alertDate: string;
  alertAtLocal: string;
  windowStartLocal: string;
  leadMinutes: number;
  quiet: boolean;
  subscribers: number;
  alreadySent: number;
  withToken: number;
  titleAr: string;
  bodyAr: string;
  titleEn: string;
  bodyEn: string;
}

const ADMIN = "api/admin/pricing";

export const getPriceAlertOverview = async (signal?: AbortSignal): Promise<PriceAlertAdminOverviewDto> => {
  const { data } = await server.get<PriceAlertAdminOverviewDto>(`${ADMIN}/price-alerts/overview`, { signal });
  return data;
};

export const updateTouTariff = async (windows: TouWindowDto[], effectiveFrom: string | null, note: string | null): Promise<TouTariffDto> => {
  const { data } = await server.put<TouTariffDto>(`${ADMIN}/tou`, { windows, effectiveFrom, note });
  return data;
};

export const setQuietHours = async (quietFrom: string, quietTo: string): Promise<PriceAlertAdminOverviewDto> => {
  const { data } = await server.put<PriceAlertAdminOverviewDto>(`${ADMIN}/price-alerts/quiet-hours`, { quietFrom, quietTo });
  return data;
};

export const previewPriceAlerts = async (at: string | null, lookBackMinutes = 10, signal?: AbortSignal): Promise<PriceAlertPreviewItemDto[]> => {
  const { data } = await server.get<PriceAlertPreviewItemDto[]>(`${ADMIN}/price-alerts/preview`, { params: { at: at || undefined, lookBackMinutes }, signal });
  return data;
};
