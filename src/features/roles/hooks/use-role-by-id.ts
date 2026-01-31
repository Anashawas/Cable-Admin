import { useQuery } from "@tanstack/react-query";
import { getRoleById } from "../services/roles-service";
import { GetRoleByIdRequest } from "../types/api";

export const useRoleById = (request: GetRoleByIdRequest, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["role", request.id],
    queryFn: ({ signal }) => getRoleById(request, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: enabled && !!request.id,
  });
};
