export interface AdvertiserDto {
  id: number;
  name: string;
  contact?: string | null;
  notes?: string | null;
}

export interface AdvertiserPayload {
  name: string;
  contact?: string | null;
  notes?: string | null;
}

export type CampaignType = "banner" | "premium" | "welcome";
export type CampaignStatus = "active" | "paused" | "ended";

export interface CampaignDto {
  id: number;
  advertiserId: number;
  advertiserName?: string | null;
  name?: string | null;
  type: CampaignType;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  price?: number | null;
  status: CampaignStatus;
}

export interface CampaignPayload {
  advertiserId: number;
  name?: string | null;
  type: CampaignType;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  price?: number | null;
  status: CampaignStatus;
}

export interface StatsByDay {
  date: string;
  impressions: number;
  clicks: number;
}

export interface StatsByCity {
  city: string;
  impressions: number;
  clicks: number;
}

export interface CampaignStatsDto {
  impressions: number;
  clicks: number;
  ctr: number;
  dismisses?: number | null;
  dismissRate?: number | null;
  uniqueUsers?: number | null;
  byDay?: StatsByDay[] | null;
  byCity?: StatsByCity[] | null;
}
