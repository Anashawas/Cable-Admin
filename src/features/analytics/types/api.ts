// ============================================
// Analytics Engine (2026-07-03)
// ============================================

export type AnalyticsEntityType = "ChargingPoint" | "ServiceProvider" | "Banner";

/** Event type values (as returned by the summary endpoint). */
export enum AnalyticsEventType {
  FullView = 1,
  HalfView = 2,
  CallButtonClick = 3,
  MapClick = 4,
  BannerView = 20,
  BannerClick = 21,
}

/** One aggregated total per event type. */
export interface AnalyticsTotalDto {
  eventType: number;
  eventName: string;
  totalCount: number;
  uniqueUsers: number;
}

/** One daily data point for a given event type. */
export interface AnalyticsDailyDto {
  day: string; // ISO date
  eventType: number;
  eventName: string;
  count: number;
}

/** Response of GET /api/analytics/{entityType}/{entityId}/summary. */
export interface AnalyticsSummaryDto {
  entityType: AnalyticsEntityType;
  entityId: number;
  fromUtc: string;
  toUtc: string;
  totals: AnalyticsTotalDto[];
  daily: AnalyticsDailyDto[];
}
