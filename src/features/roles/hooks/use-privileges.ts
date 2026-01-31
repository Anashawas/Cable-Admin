import { useQuery } from "@tanstack/react-query";
import { getAllPrivileges } from "../services/privileges-service";
import { GetAllPrivilegesRequest } from "../types/api";

export const usePrivileges = (request: GetAllPrivilegesRequest) => {
  return useQuery({
    queryKey: ["privileges", request],
    queryFn: ({ signal }) => getAllPrivileges(request, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
