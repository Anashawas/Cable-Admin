import { useQuery } from "@tanstack/react-query";
import { getCampingSeasonById } from "../services/camping-seasons-service";

export const useCampingSeasonById = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["camping-season", id],
    queryFn: ({ signal }) => getCampingSeasonById(id!, signal),
    enabled: enabled && id !== null,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
