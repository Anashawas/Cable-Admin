import { server } from "../../../lib/@axios";
import type { RefundComment } from "../types/comments";

const getRefundCommentsByReservationId = async (
  reservationCampingId: number,
  signal?: AbortSignal
): Promise<RefundComment[]> => {
  const response = await server.post<RefundComment[]>(
    "/api/reservation-camping-comments/GetReservationCampingCommentsByReservationId",
    { reservationCampingId },
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

export { getRefundCommentsByReservationId };