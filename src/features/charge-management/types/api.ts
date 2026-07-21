/** Single plug type from GET api/plug-types/GetAllPlugTypes. */
export interface PlugTypeDto {
  id: number;
  name?: string | null;
  serialNumber?: string | null;
  plugTypeFamily?: string | null;
}

/** Charger brand lookup item (2026-07-03). */
export interface ChargerBrandDto {
  id: number;
  name: string;
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
  /** Charger brand lookup id (2026-07-03) — alongside the legacy chargerBrand text. */
  chargerBrandId?: number | null;
  /** Premium subscription dates (2026-07-03) — null for non-premium stations. */
  premiumPaymentDate?: string | null;
  premiumExpiresAt?: string | null;
  /** Whether this station is a Cable partner. */
  isPartner?: boolean | null;
  /** List flag (§7): whether the station has a valid owner account (false = unassigned). */
  hasOwner?: boolean | null;
  /** Detail (§7): current owner account — null `ownerId` = unassigned. */
  ownerId?: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  /** Owner's user-account phone (distinct from the station's contact `phone`). */
  ownerAccountPhone?: string | null;
  /** Audit timestamps — when the station joined, and when its data last changed. */
  createdAt?: string | null;
  modifiedAt?: string | null;
}

// ── Premium subscription (2026-07-03) ─────────────────────────────────────────

/** Body for PATCH /api/charging-points/{id}/premium. */
export interface RecordPremiumPaymentRequest {
  paymentDate: string;   // ISO
  expiresAt: string;     // ISO, must be after paymentDate
  amount: number;        // >= 0
  note?: string | null;  // <= 500 chars
}

/** One row of premium payment history. */
export interface PremiumSubscriptionDto {
  id: number;
  paymentDate: string;
  expiresAt: string;
  amount: number;
  note?: string | null;
  createdAt: string;
  createdBy?: number | null;
}

/** Response of GET /api/charging-points/{id}/premium-history. */
export interface PremiumHistoryResponse {
  chargingPointId: number;
  currentPaymentDate?: string | null;
  currentExpiresAt?: string | null;
  isPremiumActive: boolean;
  history: PremiumSubscriptionDto[];
}

// ── Station reviews (2026-07-03) ──────────────────────────────────────────────

/** One review from GET /api/rate/GetChargingPointReviews/{id}. */
export interface ChargingPointReviewDto {
  id: number;
  userId: number;
  userName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

/** Response of GET /api/rate/GetChargingPointReviews/{id}. */
export interface ChargingPointReviewsResponse {
  chargingPointId: number;
  averageRating: number;
  totalReviews: number;
  reviews: ChargingPointReviewDto[];
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

/** One field's change in an update request — BE returns changed fields only, old→new. */
export interface UpdateRequestChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Attachment add/delete entry (GET update-requests/{id} detail only). */
export interface UpdateRequestAttachmentChange {
  action?: string | null; // "added" | "deleted"
  url?: string | null;
}

/** Single update request (Stations Request list). Use id for Approve/Reject; chargingPointId for navigation. */
export interface UpdateRequestDto {
  id: number;
  chargingPointId?: number | null;
  chargingPointName?: string | null;
  requestedByUserId?: number | null;
  requestedByUserName?: string | null;
  requestedByUserPhone?: string | null;
  requestStatus?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
  reviewedByUserId?: number | null;
  reviewedByUserName?: string | null;
  rejectionReason?: string | null;
  /** Field-level diff (old→new); only changed fields. Returned by pending / my-requests / {id}. */
  changes?: UpdateRequestChange[] | null;
  /** Uploaded attachment URLs for this request. */
  attachments?: string[] | null;
  /** Computed risk flags, e.g. "location_moved (123 m)", "contact_phone_changed". */
  riskFlags?: string[] | null;
  /** Detailed attachment adds/deletes (GET update-requests/{id} only). */
  attachmentChanges?: UpdateRequestAttachmentChange[] | null;
  chargingPoint?: ChargingPointDto | null;
}
