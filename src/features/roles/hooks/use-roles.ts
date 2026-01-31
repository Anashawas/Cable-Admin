import { useQuery } from "@tanstack/react-query";
import { getAllRoles } from "../services/roles-service";
import { GetAllRolesRequest } from "../types/api";

export const useRoles = (request: GetAllRolesRequest) => {
  return useQuery({
    queryKey: ["roles", request],
    queryFn: ({ signal }) => getAllRoles(request, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
