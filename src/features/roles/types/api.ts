export interface RolePrivilege {
  id: number;
  privilegeId: number;
  privilegeName: string;
  privilegeCode: string;
  isDeleted: boolean;
}

export interface Role {
  id: number;
  name: string;
  isDeleted: boolean;
  privileges?: unknown[] | null;
  rolePrivileges?: RolePrivilege[];
}

export interface GetAllRolesRequest {
  name: string | null;
  includeDeleted: boolean;
  includePrivileges: boolean;
}

export interface GetAllRolesResponse extends Array<Role> {}

export interface GetRoleByIdRequest {
  id: number;
}

export interface GetRoleByIdResponse {
  id: number;
  name: string;
  isDeleted: boolean;
  rolePrivileges: RolePrivilege[];
}

export interface CreateRoleRequest {
  name: string;
  privilegeIds: number[] | null;
}

export interface UpdateRoleRequest {
  id: number;
  name: string;
  privilegeIds: number[] | null;
}

export interface Privilege {
  id: number;
  name: string;
  code: string;
}

export interface GetAllPrivilegesRequest {
  name: string | null;
  code: string | null;
}

export interface GetAllPrivilegesResponse extends Array<Privilege> {}
