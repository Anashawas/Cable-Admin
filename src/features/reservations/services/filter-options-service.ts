import { server } from "../../../lib/@axios";
import { User, CampingSeason, ReservationStatus, GetCampingSeasonsRequest } from "../types/api";

interface GetAllUsersRequest {
  pagination: {
    pageNumber: number;
    pageSize: number;
  };
  name: string | null;
  userName: string | null;
  civilId: string | null;
  isActive: boolean | null;
  roleId: number | null;
  governorateId: number | null;
  includeDeleted: boolean;
}

interface GetUsersResponse {
  items: User[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const getUsers = async (signal?: AbortSignal): Promise<User[]> => {
  const request: GetAllUsersRequest = {
    pagination: {
      pageNumber: 1,
      pageSize: 10000, // Get a large number for filter options
    },
    name: null,
    userName: null,
    civilId: null,
    isActive: null,
    roleId: null,
    governorateId: null,
    includeDeleted: false,
  };

  const response = await server.post<GetUsersResponse>(
    "/api/users/GetAllUsers",
    request,
    {
      signal,
      headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.items;
};

const searchUsersByCivilId = async (civilId: string, signal?: AbortSignal): Promise<User[]> => {
  const request: GetAllUsersRequest = {
    pagination: {
      pageNumber: 1,
      pageSize: 1000, // Get a large number for search results
    },
    name: null,
    userName: null,
    civilId: civilId, // Filter by civil ID on server
    isActive: null,
    roleId: null,
    governorateId: null,
    includeDeleted: false,
  };

  const response = await server.post<GetUsersResponse>(
    "/api/users/GetAllUsers",
    request,
    {
      signal,
      headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      }
    }
  );

  // Server already filters by civilId, but also filter client-side for non-null civilIds
  return response.data.items.filter((user) => user.civilId);
};

const getCampingSeasons = async (
  filters: GetCampingSeasonsRequest,
  signal?: AbortSignal
): Promise<CampingSeason[]> => {
  const response = await server.post<CampingSeason[]>(
    "/api/camping-seasons/GetAllCampingSeasons",
    filters,
    { signal }
  );

  return response.data;
};

const getReservationStatuses = async (signal?: AbortSignal): Promise<ReservationStatus[]> => {
  const response = await server.get<ReservationStatus[]>(
    "/api/application-status/reservation-statuses",
    { signal }
  );

  return response.data;
};

export { getUsers, searchUsersByCivilId, getCampingSeasons, getReservationStatuses };
