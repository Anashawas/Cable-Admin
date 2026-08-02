import { server } from "../../../lib/@axios";
import type {
  AdvertiserDto,
  AdvertiserPayload,
  CampaignDto,
  CampaignPayload,
  CampaignStatsDto,
} from "../types/api";

// ── Advertisers ──────────────────────────────────────────────────────
export const getAdvertisers = async (signal?: AbortSignal): Promise<AdvertiserDto[]> => {
  const { data } = await server.get<AdvertiserDto[]>("api/ads/admin/advertisers", { signal });
  return Array.isArray(data) ? data : [];
};

export const createAdvertiser = async (body: AdvertiserPayload, signal?: AbortSignal): Promise<void> => {
  await server.post("api/ads/admin/advertisers", body, { signal });
};

export const updateAdvertiser = async (id: number, body: AdvertiserPayload, signal?: AbortSignal): Promise<void> => {
  await server.put(`api/ads/admin/advertisers/${id}`, body, { signal });
};

// ── Campaigns ────────────────────────────────────────────────────────
export const getCampaigns = async (signal?: AbortSignal): Promise<CampaignDto[]> => {
  const { data } = await server.get<CampaignDto[]>("api/ads/admin/campaigns", { signal });
  return Array.isArray(data) ? data : [];
};

export const createCampaign = async (body: CampaignPayload, signal?: AbortSignal): Promise<void> => {
  await server.post("api/ads/admin/campaigns", body, { signal });
};

export const updateCampaign = async (id: number, body: CampaignPayload, signal?: AbortSignal): Promise<void> => {
  await server.put(`api/ads/admin/campaigns/${id}`, body, { signal });
};

// ── Reports ──────────────────────────────────────────────────────────
export const getCampaignStats = async (
  id: number,
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<CampaignStatsDto> => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const { data } = await server.get<CampaignStatsDto>(
    `api/ads/campaigns/${id}/stats${qs ? `?${qs}` : ""}`,
    { signal }
  );
  return data;
};
