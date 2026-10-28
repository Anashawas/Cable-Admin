// Cable Gifts — a catalogue bought with points and fulfilled by the Cable team.
// Backed by /api/admin/cable-gifts (admin only). Enum fields are strings in JSON.
// Dates come back in Jordan local time and are sent without an offset.

export type GiftType = "Physical" | "ChargeCredit" | "Voucher" | "Other";
export const GIFT_TYPES: GiftType[] = ["Physical", "ChargeCredit", "Voucher", "Other"];

export type GiftOrderStatus = "Pending" | "Fulfilled" | "Cancelled";
export const GIFT_ORDER_STATUSES: GiftOrderStatus[] = ["Pending", "Fulfilled", "Cancelled"];

/** Standard paged admin envelope. */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface AdminCableGiftDto {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  howToReceiveAr?: string | null;
  howToReceiveEn?: string | null;
  giftType: GiftType;
  pointsCost: number;
  imageUrl?: string | null;
  /** Null = unlimited. */
  stock?: number | null;
  ordersCount: number;
  /** Null = unlimited. */
  remaining?: number | null;
  /** Null = unlimited. */
  perUserLimit?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  /** Canonical English city names; empty = every city. */
  cities: string[];
  sortOrder: number;
  isActive: boolean;
  pendingOrders: number;
  fulfilledOrders: number;
  cancelledOrders: number;
  createdAt: string;
}

/** POST / PUT body. */
export interface CableGiftInput {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  howToReceiveAr?: string | null;
  howToReceiveEn?: string | null;
  giftType: GiftType;
  pointsCost: number;
  stock?: number | null;
  perUserLimit?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  cities: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface AdminGiftOrderDto {
  id: number;
  orderCode: string;
  giftId: number;
  giftNameAr: string;
  giftNameEn: string;
  giftType: GiftType;
  userId: number;
  userName?: string | null;
  userPhone?: string | null;
  contactPhone?: string | null;
  note?: string | null;
  pointsSpent: number;
  status: GiftOrderStatus;
  fulfillmentNote?: string | null;
  fulfilledAt?: string | null;
  fulfilledByUserId?: number | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
  createdAt: string;
}

export interface GiftOrderFilters {
  status?: GiftOrderStatus | null;
  giftId?: number | null;
  /** yyyy-MM-dd (Jordan day). */
  from?: string | null;
  /** yyyy-MM-dd, inclusive. */
  to?: string | null;
  search?: string | null;
}
