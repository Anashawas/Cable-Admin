export interface ReservationFilters {
  reservationNumber?: string | null;
  campingSeasonId?: number | null;
  userId?: number | null;
  reservationStatusIds?: number[] | null;
  fromReservationDate?: string | null;
  toReservationDate?: string | null;
  includeDeleted: boolean;
}

export interface CampingSeasonDetail {
  id: number;
  role: {
    id: number;
    name: string;
  };
  insuranceValue: number;
  maxAreaSize: number;
  allowedReservationTimes: number;
}

export interface ReservationResponse {
  id: number;
  reservationNumber: string;
  reservationDate: string;
  amount: number | null;
  paymentDate: string | null;
  paymentStatus: string | null;
  ibanNumber: string | null;
  isDeleted: boolean;
  campingSeason: {
    id: number;
    name: string;
    safeDistanceCamps: number;
    campingSeasonDetail: CampingSeasonDetail;
  };
  reservationStatus: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    civilId: string;
    applicationRole: {
      id: number;
      name: string;
    };
  };
  campingSeasonLocation: {
    id: number;
    name: string;
  };
  shape?: {
    x: number;
    y: number;
    spatialReference: number;
  };
}

export interface GetReservationsRequest {
  pagination: {
    pageNumber: number;
    pageSize: number;
  };
  reservationNumber?: string | null;
  campingSeasonId?: number | null;
  userId?: number | null;
  reservationStatusIds?: number[] | null;
  fromReservationDate?: string | null;
  toReservationDate?: string | null;
  includeDeleted: boolean;
}

export interface GetReservationsResponse {
  items: ReservationResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface User {
  id: number;
  name: string;
  userName: string;
  civilId: string | null;
  isLdap: boolean;
  isActive: boolean;
  phone: string;
  email: string | null;
  governorate: {
    id: number | null;
    name: string;
  };
  role: {
    id: number | null;
    name: string;
  };
}

export interface CampingSeason {
  id: number;
  name: string;
  fromDate: string;
  toDate: string;
  isDeleted: boolean;
  campingSeasonStatus: {
    id: number | null;
    name: string;
  };
}

export interface GetCampingSeasonsRequest {
  name?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  includeDeleted: boolean;
}

export interface ReservationStatus {
  id: number | null;
  name: string;
}