import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../services/users-service";
import { GetAllUsersRequest } from "../types/api";

export const useUsers = (request: GetAllUsersRequest) => {
  return useQuery({
    queryKey: ["users", request],
    queryFn: ({ signal }) => getAllUsers(request, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    // Keep previous data during transitions to avoid flickering
    placeholderData: (previousData) => previousData,
    // Prevent query cancellation on rapid successive calls
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
