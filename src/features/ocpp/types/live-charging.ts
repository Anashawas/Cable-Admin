/**
 * Sprint 5 live charging — admin API shapes. Mirrors Application/Ocpp/LiveCharging
 * (AdminSessionQueries, ConnectorCodeQueries, ConnectorReports, DriverCards, LiveChargingSettings)
 * and Application/Pricing/StationTariffFeature.cs. Dates are Jordan local time without a zone.
 */
import type {
  OcppChargeLimitDto,
  OcppChargeLimitKind,
  OcppCommandDto,
  OcppSessionLiveDto,
} from "./api";
import type { TouTariffDto, TouWindowDto } from "../../pricing/services/pricing-service";

export type { TouTariffDto, TouWindowDto };

/** How a session was started: an app start from a CHG- sticker is "Sticker". */
export type OcppStartMethod = "App" | "Sticker" | "Card" | "Operator";
export const START_METHODS: OcppStartMethod[] = ["App", "Sticker", "Card", "Operator"];

// ============================================
// Admin sessions — GET api/admin/ocpp/sessions, /sessions/{id}, /users/{id}/ocpp-sessions
// ============================================

/** A driver (app / sticker / linked card) or the staff member of an operator start; full phone (E.164). */
export interface AdminSessionPersonDto {
  userId: number;
  name?: string | null;
  phone?: string | null;
}

/** The driver's car (13.4), e.g. "Hyundai Ioniq 5"; reportsSoc null = not seen reporting yet. */
export interface SessionCarDto {
  id: number;
  name: string;
  reportsSoc?: boolean | null;
}

export interface AdminSessionRowDto {
  id: number;
  chargingPointId: number;
  stationName: string;
  chargerId: number;
  chargerName?: string | null;
  chargePointId: string;
  connectorId: number;
  startedAt: string;
  stoppedAt?: string | null;
  durationSec: number;
  isOpen: boolean;
  isStale: boolean;
  /** Card | App | Operator (the OCPP origin). */
  startSource: string;
  startMethod: OcppStartMethod | string;
  idTag: string;
  driver?: AdminSessionPersonDto | null;
  startedByStaff?: AdminSessionPersonDto | null;
  cardLabel?: string | null;
  energyKwh?: number | null;
  costFils?: number | null;
  costJod?: number | null;
  socStartPercent?: number | null;
  socEndPercent?: number | null;
  chargeLimit?: OcppChargeLimitDto | null;
  stopReason?: string | null;
  stopReasonText?: string | null;
  stopReasonTextAr?: string | null;
  receiptNo?: string | null;
  /** "Problem with this session" complaints still open. */
  openIssues: number;
  wasRejected?: boolean;
  isOrphan?: boolean;
  /** Not on the admin list yet (only on the detail's `live`); shown when the API adds them. */
  car?: SessionCarDto | null;
  carName?: string | null;
  pointsAwarded?: number | null;
  /** App start: how far the phone was from the station, in metres. */
  startDistanceMeters?: number | null;
}

export interface AdminSessionTotalsDto {
  sessions: number;
  energyKwh: number;
  costFils: number;
  costJod: number;
  /** Running now under the same filters except status and dates. */
  openNow: number;
}

export interface AdminSessionsPageDto {
  items: AdminSessionRowDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totals: AdminSessionTotalsDto;
}

export type SessionStatusFilter = "" | "open" | "closed";
export type SessionLimitFilter = "" | OcppChargeLimitKind | "none";

/** Filters of the admin list and the CSV export (empty values are not sent). */
export interface AdminSessionsQuery {
  from?: string;
  to?: string;
  chargingPointId?: number | null;
  chargerId?: number | null;
  userId?: number | null;
  source?: OcppStartMethod | "";
  status?: SessionStatusFilter;
  limitKind?: SessionLimitFilter;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminSessionIssueDto {
  issueId: number;
  reason?: string | null;
  note: string;
  /** Open | InReview | Resolved | Closed (the driver's view of the complaint status). */
  status: string;
  /** The complaint status (ComplaintStatus). */
  statusCode: number;
  reply?: string | null;
  createdAt: string;
}

/** The live DTO as the admin detail returns it: the base plus points, car and tariff source. */
export interface AdminSessionLiveDto extends OcppSessionLiveDto {
  stationName?: string | null;
  pointsAwarded?: number | null;
  car?: SessionCarDto | null;
  /** station | national */
  tariffSource?: string | null;
}

export interface AdminSessionDetailDto {
  session: AdminSessionRowDto;
  live: AdminSessionLiveDto;
  stationAddress?: string | null;
  plugTypeName?: string | null;
  powerKw?: number | null;
  limitSetByName?: string | null;
  /** Who sent the RemoteStop that ended it; null = at the charger, by the car or by the limit. */
  stoppedByName?: string | null;
  stoppedByLimit: boolean;
  /** RemoteStartTransaction (failed attempts too) and RemoteStopTransaction calls of the session. */
  commands: OcppCommandDto[];
  issues: AdminSessionIssueDto[];
  /** null = none / not decided; 0 = decided, none. */
  pointsAwarded?: number | null;
}

// ============================================
// RFID cards linked to a user — GET/DELETE api/admin/users/{userId}/ocpp-cards
// ============================================

export interface OcppCardDto {
  id: number;
  idTag: string;
  label?: string | null;
  isEnabled: boolean;
  linkedAt: string;
  /** The app's own virtual tag (CBL-U…): unlinking it switches app charging off for the account. */
  isAppTag: boolean;
}

// ============================================
// Station tariff — GET/PUT/DELETE api/admin/ocpp/stations/{cp}/tariff
// ============================================

export interface TariffNowDto {
  key: string;
  tier: string;
  nameEn: string;
  nameAr: string;
  priceFils: number;
  endsAt: string;
  next?: TouWindowDto | null;
  textAr: string;
  textEn: string;
}

export interface StationTariffDto {
  chargingPointId: number;
  /** station = the station's own tariff; national = the national tariff applies. */
  source: "station" | "national" | string;
  hasOwnTariff: boolean;
  tariff: TouTariffDto;
  now?: TariffNowDto | null;
}

// ============================================
// Plug stickers (CHG- codes) — api/admin/ocpp/stations/{cp}/connector-codes
// ============================================

export interface ConnectorCodeDto {
  codeId: number;
  code: string;
  /** https://cable-app.com/c/CHG-… — what the QR holds. */
  link: string;
  chargerId: number;
  chargerName: string;
  chargePointId: string;
  connectorId: number;
  plugTypeId?: number | null;
  plugTypeName?: string | null;
  powerKw?: number | null;
  issuedAt: string;
  /** Earlier codes of this plug that were revoked. */
  revokedCodes: number;
  lastRevokedAt?: string | null;
}

// ============================================
// "The plug didn't work" reports — api/admin/ocpp/connector-reports
// ============================================

export type ConnectorReportReason = "NoResponse" | "Rejected" | "ScreenError" | "Damaged" | "Other";

export interface ConnectorReportDto {
  id: number;
  chargingPointId: number;
  chargerId: number;
  chargerName?: string | null;
  connectorId: number;
  reason: ConnectorReportReason | string;
  /** In the request language. */
  reasonText: string;
  note?: string | null;
  commandId?: number | null;
  commandStatus?: string | null;
  commandResultStatus?: string | null;
  commandErrorCode?: string | null;
  connectorStatus?: string | null;
  connectorErrorCode?: string | null;
  connectorStatusAt?: string | null;
  chargerOnline: boolean;
  /** Name + masked phone. */
  reporter?: { displayName?: string | null; phoneMasked?: string | null } | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedByName?: string | null;
  resolutionNote?: string | null;
}

/** Reports of one plug; the busiest plugs come first. */
export interface ConnectorReportGroupDto {
  chargingPointId: number;
  stationName: string;
  chargerId: number;
  chargerName?: string | null;
  chargePointId: string;
  connectorId: number;
  openReports: number;
  reportsToday: number;
  totalReports: number;
  /** ≥ 3 open reports within an hour, newer than the plug's last good start. A warning only. */
  suspectedIssue: boolean;
  lastReportAt: string;
  lastReason: string;
  lastCommandResult?: string | null;
  /** The latest 5. */
  latest: ConnectorReportDto[];
}

export interface ConnectorReportsQuery {
  /** open (plugs with an open report, default) | all */
  status?: "open" | "all";
  chargingPointId?: number | null;
  from?: string;
  to?: string;
}

// ============================================
// Live charging switches — GET/PUT api/admin/ocpp/live-charging-settings
// ============================================

export interface LiveChargingSettingsDto {
  /** How far from the station an app start may be (10 – 100000 m). */
  maxDistanceMeters: number;
  /** Refuse an app start without the phone's position. */
  requireLocation: boolean;
  autoPointsEnabled: boolean;
  /** When automatic points were last switched; only sessions ending after it earn points. */
  autoPointsSince?: string | null;
}

/** PUT body: null / absent = unchanged. */
export interface LiveChargingSettingsUpdate {
  maxDistanceMeters?: number | null;
  requireLocation?: boolean | null;
  autoPointsEnabled?: boolean | null;
}
