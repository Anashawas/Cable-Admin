import { useQuery } from "@tanstack/react-query";
import { getUsers, getCampingSeasons, getReservationStatuses } from "../services/filter-options-service";
import { GetCampingSeasonsRequest } from "../types/api";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: ({ signal }) => getUsers(signal),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useCampingSeasons = () => {
  const filters: GetCampingSeasonsRequest = {
    name: null,
    fromDate: null,
    toDate: null,
    includeDeleted: false,
  };

  return useQuery({
    queryKey: ["camping-seasons", filters],
    queryFn: ({ signal }) => getCampingSeasons(filters, signal),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useReservationStatuses = () => {
  return useQuery({
    queryKey: ["reservation-statuses"],
    queryFn: ({ signal }) => getReservationStatuses(signal),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
