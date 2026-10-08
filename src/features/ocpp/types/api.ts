/** Cable Connect (OCPP 1.6J) admin API — mirrors Application/Ocpp/Queries/OcppAdminDtos.cs. */

export type OcppConnectionState = "Online" | "Reconnecting" | "Offline";

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OcppSubscriptionStateDto {
  isOn: boolean;
  /** Active | ExpiringSoon | InGrace | Expired | SwitchedOff; null = never subscribed. */
  status?: string | null;
  expiresAt?: string | null;
  subscriptionId?: number | null;
}

export interface OcppChargePointListItemDto {
  id: number;
  chargePointId: string;
  displayName?: string | null;
  chargingPointId: number;
  stationName: string;
  vendor?: string | null;
  model?: string | null;
  firmwareVersion?: string | null;
  isEnabled: boolean;
  isConnected: boolean;
  connectionState: OcppConnectionState;
  connectedAt?: string | null;
  disconnectedAt?: string | null;
  lastMessageAt?: string | null;
  lastBootAt?: string | null;
  hasPassword: boolean;
  lockedUntil?: string | null;
  connectorCount: number;
  freeConnectors: number;
  faultedConnectors: number;
  openSessions: number;
  subscription: OcppSubscriptionStateDto;
  createdAt: string;
  /** Only until the first BootNotification: Waiting | Connected | Refused. Null once booted. */
  onboardingState?: "Waiting" | "Connected" | "Refused" | null;
  onboardingReason?: string | null;
}

/** Did the unit reach us yet? Booted once vendor/model are in; before that Waiting / Connected / Refused. */
export interface OcppOnboardingDto {
  state: "Waiting" | "Connected" | "Refused" | "Booted";
  reason?: string | null;
  httpStatus?: number | null;
  at?: string | null;
  registeredAt: string;
}

export interface OcppConnectorDto {
  id: number;
  connectorId: number;
  status: string;
  errorCode: string;
  vendorErrorCode?: string | null;
  info?: string | null;
  statusUpdatedAt?: string | null;
  statusReceivedAt: string;
  plugTypeId?: number | null;
  plugTypeName?: string | null;
  powerKw?: number | null;
  isFree: boolean;
  isOccupied: boolean;
}

export interface OcppTransactionDto {
  id: number;
  connectorId: number;
  idTag: string;
  startedAt: string;
  stoppedAt?: string | null;
  durationSec?: number | null;
  meterStartWh: number;
  meterStopWh?: number | null;
  energyKwh?: number | null;
  stopReason?: string | null;
  isOpen: boolean;
  isStale: boolean;
  isOrphan: boolean;
  wasRejected: boolean;
}

export interface OcppChargePointTodayDto {
  sessions: number;
  energyKwh: number;
  faults: number;
}

export interface OcppChargePointDetailDto {
  id: number;
  chargePointId: string;
  displayName?: string | null;
  chargingPointId: number;
  stationName: string;
  vendor?: string | null;
  model?: string | null;
  firmwareVersion?: string | null;
  serialNumber?: string | null;
  chargeBoxSerialNumber?: string | null;
  iccid?: string | null;
  imsi?: string | null;
  meterSerialNumber?: string | null;
  heartbeatInterval: number;
  isEnabled: boolean;
  isConnected: boolean;
  connectionState: OcppConnectionState;
  connectedAt?: string | null;
  disconnectedAt?: string | null;
  lastBootAt?: string | null;
  lastMessageAt?: string | null;
  lastRemoteIp?: string | null;
  hasPassword: boolean;
  failedAuthCount: number;
  lockedUntil?: string | null;
  urlPath: string;
  /** wss://host/ocpp16/ from the server's own config; null when the API has no OcppServer:Url. */
  webSocketBaseUrl?: string | null;
  /** 443 / 80 — for units with a separate port field. */
  port?: number | null;
  subscription: OcppSubscriptionStateDto;
  connectors: OcppConnectorDto[];
  recentTransactions: OcppTransactionDto[];
  today: OcppChargePointTodayDto;
  localList: OcppLocalListStateDto;
  onboarding: OcppOnboardingDto;
  createdAt: string;
  modifiedAt?: string | null;
}

/** The card list pushed into the unit (SendLocalList). status null = never pushed. */
export interface OcppLocalListStateDto {
  status?: "Synced" | "Pending" | "Failed" | "NotSupported" | null;
  version?: number | null;
  syncedAt?: string | null;
  cardsAtStation: number;
  confirmed: boolean;
}

export interface OcppRawMessageDto {
  id: number;
  direction: "in" | "out" | "sys";
  messageType?: number | null;
  messageId?: string | null;
  action?: string | null;
  payload?: string | null;
  remoteIp?: string | null;
  createdAt: string;
}

export interface OcppFleetHealthDto {
  totalChargers: number;
  enabled: number;
  online: number;
  reconnecting: number;
  offline: number;
  neverConnected: number;
  locked: number;
  totalConnectors: number;
  freeConnectors: number;
  faultedConnectors: number;
  openSessions: number;
  staleSessions: number;
  sessionsToday: number;
  energyTodayKwh: number;
  stationsWithChargers: number;
  stationsWithoutActiveSubscription: number;
  openAlerts: number;
}

export type OcppAlertType = "ChargerOffline" | "ConnectorFaulted" | "SessionTooLong" | "ParkedAfterCharging";

/** An alert-job finding; resolvedAt null = still open. */
export interface OcppAlertDto {
  id: number;
  type: OcppAlertType;
  ocppChargePointId: number;
  chargePointId: string;
  displayName?: string | null;
  chargingPointId: number;
  stationName: string;
  connectorId?: number | null;
  ocppTransactionId?: number | null;
  conditionSince: string;
  notifiedAt: string;
  resolvedAt?: string | null;
  details?: string | null;
  recipients: number;
  /** ParkedAfterCharging: the driver told first (null = card not linked to a user). */
  driverUserId?: number | null;
  /** ParkedAfterCharging: when the station was told. */
  escalatedAt?: string | null;
}

export interface OcppAuthorizedTagDto {
  id: number;
  chargingPointId: number;
  idTag: string;
  label?: string | null;
  isEnabled: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface OcppChargePointsQuery {
  chargingPointId?: number;
  search?: string;
  isEnabled?: boolean;
  connectionState?: OcppConnectionState;
  page?: number;
  pageSize?: number;
}

export interface RegisterChargePointRequest {
  chargingPointId: number;
  /** null = generated CBL-{station}-{nn}; pass the unit's existing id (e.g. RH4) to keep it. */
  chargePointId?: string | null;
  displayName?: string | null;
  /** false for units on OCPP Security Profile 0 that cannot send Basic auth. */
  requirePassword: boolean;
  heartbeatInterval?: number | null;
}

/** The values the technician types into the charger. `password` is shown once and never retrievable. */
export interface ChargerCredentials {
  id: number;
  chargePointId: string;
  username: string;
  password?: string | null;
  urlPath?: string;
  heartbeatInterval?: number;
  /** wss://host/ocpp16/ as the server itself reports it — preferred over the admin's own config. */
  webSocketBaseUrl?: string | null;
  /** 443 / 80 — shown so a technician changes a unit's separate port field (RH4 ships with 4435). */
  port?: number | null;
}

export interface UpdateChargePointRequest {
  displayName?: string | null;
  heartbeatInterval?: number | null;
}

export interface UpdateConnectorRequest {
  plugTypeId?: number | null;
  powerKw?: number | null;
}

export interface AddAuthorizedTagRequest {
  chargingPointId: number;
  idTag: string;
  label?: string | null;
  /** ISO 8601 with offset / Z (absolute instant). A value without an offset is taken as Jordan local time by the API. */
  expiresAt?: string | null;
}

// ============================================
// Phase 2 — central-system commands (server → charger)
// ============================================

/** Transport outcome of a command; the unit's own verdict is `resultStatus`. */
export type OcppCommandStatus = "Answered" | "CallError" | "NotConnected" | "Timeout" | "Disconnected" | "Invalid" | "Unreachable";

export interface OcppCommandResultDto {
  commandId: number;
  action: string;
  status: OcppCommandStatus;
  /** Accepted | Rejected | Scheduled | Unlocked | UnlockFailed | NotSupported | RebootRequired … */
  resultStatus?: string | null;
  responsePayload?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  elapsedMs: number;
  /** status Answered and resultStatus positive (or absent, e.g. GetConfiguration). */
  accepted: boolean;
}

export interface OcppCommandDto {
  id: number;
  action: string;
  requestPayload: string;
  status: OcppCommandStatus;
  resultStatus?: string | null;
  responsePayload?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  durationMs?: number | null;
  requestedById?: number | null;
  requestedByName?: string | null;
  createdAt: string;
  /** When the charger's follow-up message proved the command took effect; null = accepted, not yet confirmed. */
  completedAt?: string | null;
  confirmedAfterSec?: number | null;
}

export type OcppTriggerMessage =
  | "BootNotification" | "DiagnosticsStatusNotification" | "FirmwareStatusNotification"
  | "Heartbeat" | "MeterValues" | "StatusNotification";

export interface OcppConfigurationKey {
  key: string;
  readonly: boolean;
  value?: string | null;
}

/** N-2: the gates between a station's live charger data and the driver app. */
export interface OcppLiveVisibilityDto {
  visibleToDrivers: boolean;
  subscriptionOn: boolean;
  ownerSharing: boolean;
  ownerDecidedAt?: string | null;
  adminBlocked: boolean;
  adminBlockedAt?: string | null;
  adminBlockReason?: string | null;
}
