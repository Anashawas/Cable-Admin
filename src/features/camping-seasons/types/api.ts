export interface CampingSeasonStatus {
  id: number | null;
  name: string;
}

export interface CampingSeasonDetail {
  id?: number | null;
  roleId?: number;
  insuranceValue: number;
  feeValue: number;
  startDate: string;
  maxAreaSize: number;
  allowedReservationTimes: number;
  role?: {
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
  campingSeasonStatus: CampingSeasonStatus;
  safeDistanceCamps?: number;
  campingSeasonDetails?: CampingSeasonDetail[];
}

export interface GetAllCampingSeasonsRequest {
  name: string | null;
  fromDate: string | null;
  toDate: string | null;
  includeDeleted: boolean;
}

export interface GetAllCampingSeasonsResponse extends Array<CampingSeason> {}

export interface CreateCampingSeasonRequest {
  name: string;
  fromDate: string;
  toDate: string;
  safeDistanceCamps: number;
  campingSeasonDetails: CampingSeasonDetail[];
}

export interface UpdateCampingSeasonRequest {
  id: number;
  name: string;
  fromDate: string;
  toDate: string;
  safeDistanceCamps: number;
  campingSeasonDetails: CampingSeasonDetail[];
}

export interface CampingSeasonFilters {
  name: string | null;
  fromDate: string | null;
  toDate: string | null;
  includeDeleted: boolean;
}

export interface Role {
  id: number;
  name: string;
  isDeleted: boolean;
}

export interface GetAllRolesRequest {
  name: string | null;
  includeDeleted: boolean;
  includePrivileges: boolean;
}

export interface GetAllRolesResponse extends Array<Role> {}
