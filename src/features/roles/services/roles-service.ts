import { server } from "../../../lib/@axios";
import {
  GetAllRolesRequest,
  GetAllRolesResponse,
  GetRoleByIdRequest,
  GetRoleByIdResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  Role
} from "../types/api";

const getAllRoles = async (
  request: GetAllRolesRequest,
  signal?: AbortSignal
): Promise<GetAllRolesResponse> => {
  const response = await server.post<GetAllRolesResponse>(
    "/api/roles/GetAllRoles",
    request,
    {
      signal,
      headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

const getRoleById = async (
  request: GetRoleByIdRequest,
  signal?: AbortSignal
): Promise<GetRoleByIdResponse> => {
  const response = await server.post<GetRoleByIdResponse>(
    "/api/roles/GetRoleById",
    request,
    {
      signal,
      headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

const createRole = async (roleData: CreateRoleRequest): Promise<Role> => {
  const response = await server.post<Role>("/api/roles/AddRole", roleData, {
    headers: {
      'Accept-Language': 'en',
      'Content-Type': 'application/json'
    }
  });

  return response.data;
};

const updateRole = async (id: number, roleData: UpdateRoleRequest): Promise<Role> => {
  const response = await server.put<Role>(`/api/roles/UpdateRole/${id}`, roleData, {
    headers: {
      'Accept-Language': 'en',
      'Content-Type': 'application/json'
    }
  });

  return response.data;
};

const deleteRole = async (id: number): Promise<void> => {
  await server.delete(`/api/roles/DeleteRole/${id}`, {
    headers: {
      'Accept-Language': 'en',
    }
  });
};

export {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
