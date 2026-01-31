import { useQuery } from "@tanstack/react-query";
import { getAllCampingSeasons } from "../services/camping-seasons-service";
import { GetAllCampingSeasonsRequest } from "../types/api";

export const useCampingSeasons = (params?: GetAllCampingSeasonsRequest) => {
  return useQuery({
    queryKey: ["camping-seasons", params],
    queryFn: ({ signal }) => getAllCampingSeasons(params, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
