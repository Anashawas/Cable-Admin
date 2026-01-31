export interface Governorate {
  id: number | null;
  name: string;
}

export interface Role {
  id: number | null;
  name: string;
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
  governorate: Governorate;
  role: Role;
}

export interface PaginationRequest {
  pageNumber: number;
  pageSize: number;
}

export interface GetAllUsersRequest {
  pagination: PaginationRequest;
  name: string | null;
  userName: string | null;
  civilId: string | null;
  isActive: boolean | null;
  roleId: number | null;
  governorateId: number | null;
  includeDeleted: boolean;
}

export interface GetUsersResponse {
  items: User[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateUserRequest {
  name: string;
  userName: string;
  email: string;
  password: string;
  roleId: number;
  civilId: string | null;
  phone: string;
  isLdap: boolean;
  governorateId: number | null;
}

export interface UpdateUserRequest {
  name: string;
  userName: string;
  email: string;
  phone: string;
  civilId: string | null;
  roleId: number;
  isLdap: boolean;
  isActive: boolean;
  governorateId: number | null;
}

export interface ChangePasswordRequest {
  password: string;
}

export interface UserFilters {
  name?: string | null;
  userName?: string | null;
  email?: string | null;
  civilId?: string | null;
  roleId?: number | null;
  governorateId?: number | null;
  isActive?: boolean | null;
  isLdap?: boolean | null;
}

export interface GetAllRolesRequest {
  name: string | null;
  includeDeleted: boolean;
  includePrivileges: boolean;
}

export interface RoleResponse {
  id: number;
  name: string;
  isDeleted: boolean;
  privileges: unknown[] | null;
}

export interface GetAllRolesResponse extends Array<RoleResponse> {}
