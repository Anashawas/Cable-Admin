import { server } from "../../../lib/@axios";
import type { RefundHistory } from "../types/timeline";

const getRefundHistoryByReservationId = async (
  reservationId: number,
  signal?: AbortSignal
): Promise<RefundHistory[]> => {
  const response = await server.post<RefundHistory[]>(
    "/api/reservation-history/GetReservationHistoryByReservationId",
    { reservationId },
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

export { getRefundHistoryByReservationId };