/** Single plug type from GET api/plug-types/GetAllPlugTypes. */
export interface PlugTypeDto {
  id: number;
  name?: string | null;
  serialNumber?: string | null;
  plugTypeFamily?: string | null;
}

/** Single charging point (ChargingPointDto). */
export interface ChargingPointDto {
  id: number;
  name?: string | null;
  cityName?: string | null;
  countryName?: string | null;
  phone?: string | null;
  fromTime?: string | null;
  toTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isVerified?: boolean | null;
  hasOffer?: boolean | null;
  service?: string | null;
  offerDescription?: string | null;
  address?: string | null;
  avgChargingPointRate?: number | null;
  /** Image URL (capital C in API). */
  iConUrl?: string | null;
  rateCount?: number | null;
  price?: number | null;
  chargerSpeed?: number | null;
  chargersCount?: number | null;
  visitorsCount?: number | null;
  note?: string | null;
  statusSummary?: { id: number; name?: string | null } | null;
  chargingPointType?: { id: number; name?: string | null } | null;
  stationType?: { id: number; name?: string | null } | null;
  plugTypeSummary?: { id: number; name?: string | null; serialNumber?: string | null }[] | null;
  chargerBrand?: string | null;
  /** Payment methods (e.g. "Visa, CliQ") for conditional icons. */
  methodPayment?: string | null;
  /** Image URLs for thumbnail gallery in row detail. */
  images?: string[] | { url?: string }[] | null;
}

/** Request body for GetAllChargingPoints (all optional). */
export interface GetAllChargingPointsRequest {
  name?: string | null;
  chargerPointTypeId?: number | null;
  cityName?: string | null;
}

/** Request body for getPendingUpdateRequests. */
export interface GetPendingUpdateRequestsRequest {
  status?: string | null;
}

/** Single update request (Stations Request list). Use id for Approve/Reject; chargingPointId for navigation. */
export interface UpdateRequestDto {
  id: number;
  chargingPointId?: number | null;
  status?: string | null;
  requestedChanges?: string | null;
  requestedAt?: string | null;
  chargingPoint?: ChargingPointDto | null;
}
