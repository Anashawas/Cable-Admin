import { server } from "../../../lib/@axios";

export interface UploadAttachmentRequest {
  files: File[];
  entityId: number;
  attachmentType: string;
}

export interface UploadAttachmentResponse {
  ids: number[];
}

const uploadAttachments = async (
  files: File[],
  entityId: number,
  attachmentType: string = "ReservationCamping",
  signal?: AbortSignal
): Promise<number[]> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await server.post<UploadAttachmentResponse>(
    `/api/attachments?entityId=${entityId}&attachmentType=${attachmentType}`,
    formData,
    {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
  );

  return response.data.ids;
};

export { uploadAttachments };
