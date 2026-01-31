import { server } from "../../../lib/@axios";
import { GetReservationsRequest, GetReservationsResponse } from "../types/api";

const getAllReservations = async (
  filters: GetReservationsRequest,
  signal?: AbortSignal
): Promise<GetReservationsResponse> => {
  const response = await server.post<GetReservationsResponse>(
    "/api/reservation-camping/GetAllReservationCamps",
    filters,
    {
      signal,
      headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

export { getAllReservations };