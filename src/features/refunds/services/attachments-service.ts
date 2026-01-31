import { server } from "../../../lib/@axios";

export interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  fileData: string;
}

export interface GetAttachmentsRequest {
  entityId: number;
  attachmentsType: string;
}

const getAttachmentsByReservationId = async (
  entityId: number,
  signal?: AbortSignal
): Promise<Attachment[]> => {
  const response = await server.post<Attachment[]>(
    "/api/attachments/GetAttachmentById",
    {
      entityId,
      attachmentsType: "ReservationCamping"
    },
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

export { getAttachmentsByReservationId };
