// --- User Management (Cable-Admin spec: list + edit + delete) ---

/** Role shape from list/detail (id + name). */
export interface RoleDto {
  id: number;
  name: string;
}

/** Flat car entry returned inside GET api/users/GetAllUsers (new API shape). */
export interface UserCarSummaryDto {
  id?: number;
  carTypeName?: string | null;
  carModelName?: string | null;
  plugTypeName?: string | null;
  createdAt?: string | null;
}

/** List item from GET api/users/GetAllUsers. */
export interface UserSummaryDto {
  id?: number | null;
  name: string;
  email: string;
  phone?: string | null;
  role: RoleDto;
  /** Optional; show Status chip when present. */
  isActive?: boolean | null;
  /** ISO string from the server (e.g. "2025-01-15T10:23:00Z"). Used for date-range stats. */
  createdAt?: string | null;
  /** User's registered vehicles — available directly in list since 2026-03-04 API update. */
  userCars?: UserCarSummaryDto[];
  /** Whether the user has read the latest update notes. */
  hasReadUpdateNotes?: boolean;
  /** Whether this account has been soft-deleted. */
  isDeleted?: boolean;
}

/** Nested car structure in UserDetailDto (minimal for display). */
export interface UserCarDto {
  carTypeId?: number;
  carTypeName?: string;
  carModels?: Array<{
    carModelId?: number;
    carModelName?: string;
    plugTypes?: { id?: number; name?: string; serialNumber?: string };
  }>;
}

/** Detail from GET api/users/GetUserById/{id} (edit form). */
export interface UserDetailDto {
  id: number;
  name: string;
  phone: string | null;
  isActive: boolean;
  email: string;
  country: string | null;
  city: string | null;
  role: RoleDto;
  userCars: UserCarDto[];
  hasReadUpdateNotes?: boolean;
}

/** Payload for POST api/users/AddUser. Phone is managed via verify-phone endpoints. */
export interface CreateUserRequest {
  name: string | null;
  email: string | null;
  password: string | null;
  roleId: number;
  country?: string | null;
  city?: string | null;
}

/** Payload for PUT api/users/{id}. Phone is NOT part of this endpoint. */
export interface UpdateUserRequestSpec {
  name: string;
  roleId: number;
  isActive: boolean;
  email: string;
  country?: string | null;
  city?: string | null;
}

// --- User Car Management (Add/Delete cars for a user) ---

/** Payload for POST api/carmanagement/AddUserCar. */
export interface AddUserCarRequest {
  userId: number;
  carModelId: number;
  plugTypeId: number;
}

/** Single model in GetAllCarModels (id = carModelId for AddUserCar). */
export interface CarModelDto {
  id: number;
  name: string;
}

/** Brand/type with models from GET api/carmanagement/GetAllCarModels. */
export interface CarTypeWithModelsDto {
  id: number;
  name: string;
  carModels: CarModelDto[];
}

/** Model entry in UserCarDto (existing user car). carModelId used for Delete. */
export interface UserCarModelDto {
  carModelId: number;
  carModelName: string;
  plugTypes?: { id: number; name?: string; serialNumber?: string } | null;
}
