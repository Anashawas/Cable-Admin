import { server } from "../../../lib/@axios";

export interface UpdateRefundRequest {
  id: number;
  reservationStatusId: number;
  note: string | null;
}

export interface UpdateRefundResponse {
  success: boolean;
  message?: string;
}

const updateCampingRefund = async (
  request: UpdateRefundRequest,
  signal?: AbortSignal
): Promise<UpdateRefundResponse> => {
  const response = await server.put<UpdateRefundResponse>(
    `/api/camping-refunds/UpdateCampingRefund/${request.id}`,
    request,
    {
      signal,
    }
  );

  return response.data;
};

export { updateCampingRefund };