// --- User Management (Cable-Admin spec: list + edit + delete) ---

/** Role shape from list/detail (id + name). */
export interface RoleDto {
  id: number;
  name: string;
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
}

/** Payload for PUT api/users/{id}. No password. */
export interface UpdateUserRequestSpec {
  name: string;
  phone: string;
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
