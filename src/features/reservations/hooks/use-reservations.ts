import { useQuery } from "@tanstack/react-query";
import { getAllReservations } from "../services/reservations-service";
import { GetReservationsRequest } from "../types/api";

export const useReservations = (filters: GetReservationsRequest) => {
  return useQuery({
    queryKey: ["reservations", filters],
    queryFn: ({ signal }) => getAllReservations(filters, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    // Keep previous data during transitions to avoid flickering
    placeholderData: (previousData) => previousData,
    // Prevent query cancellation on rapid successive calls
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};