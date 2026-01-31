import { server } from "../../../lib/@axios";
import { GetAllRolesRequest, GetAllRolesResponse } from "../types/api";

const getAllRoles = async (
  params: GetAllRolesRequest = {
    name: null,
    includeDeleted: false,
    includePrivileges: false,
  },
  signal?: AbortSignal
): Promise<GetAllRolesResponse> => {
  const response = await server.post<GetAllRolesResponse>(
    "/api/roles/GetAllRoles",
    params,
    {
      signal,
      headers: {
        "Accept-Language": "en",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export { getAllRoles };
