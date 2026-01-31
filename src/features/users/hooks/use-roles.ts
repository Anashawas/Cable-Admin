import { useQuery } from "@tanstack/react-query";
import { getAllRoles } from "../services/roles-service";
import { GetAllRolesRequest } from "../types/api";

export const useRoles = (params?: GetAllRolesRequest) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: ({ signal }) => getAllRoles(params, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
