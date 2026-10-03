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
  subscription: OcppSubscriptionStateDto;
  connectors: OcppConnectorDto[];
  recentTransactions: OcppTransactionDto[];
  today: OcppChargePointTodayDto;
  createdAt: string;
  modifiedAt?: string | null;
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
  /** Jordan local time. */
  expiresAt?: string | null;
}
