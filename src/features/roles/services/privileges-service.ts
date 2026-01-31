import { server } from "../../../lib/@axios";
import {
  GetAllPrivilegesRequest,
  GetAllPrivilegesResponse
} from "../types/api";

const getAllPrivileges = async (
  request: GetAllPrivilegesRequest,
  signal?: AbortSignal
): Promise<GetAllPrivilegesResponse> => {
  const response = await server.post<GetAllPrivilegesResponse>(
    "/api/privileges/GetAllPrivileges",
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

export {
  getAllPrivileges
};
