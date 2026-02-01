import { server } from "../../../lib/@axios";

/** Single attachment from GetAllChargingPointAttachmentsById (shape may vary). */
export interface StationAttachmentDto {
  id?: number;
  url?: string | null;
  attachmentUrl?: string | null;
  [key: string]: unknown;
}

/**
 * POST api/charging-points/UploadChargingPoint/{id}
 * Body: FormData with key "file".
 */
const uploadStationIcon = async (
  id: number,
  file: File,
  signal?: AbortSignal
): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);
  await server.post(
    `api/charging-points/UploadChargingPoint/${id}`,
    formData,
    { signal }
  );
};

/**
 * GET api/chargingPointAttchments/GetAllChargingPointAttachmentsById/{id}
 * Note: URL typo "Attchments" kept as per API.
 */
const getStationPhotos = async (
  id: number,
  signal?: AbortSignal
): Promise<StationAttachmentDto[]> => {
  const { data } = await server.get<StationAttachmentDto[]>(
    `api/chargingPointAttchments/GetAllChargingPointAttachmentsById/${id}`,
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/chargingPointAttchments/AddChargingPointAttachmentCommand/{id}
 * Body: FormData with each file appended using key "files".
 */
const uploadStationPhotos = async (
  id: number,
  files: File[],
  signal?: AbortSignal
): Promise<void> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  await server.post(
    `api/chargingPointAttchments/AddChargingPointAttachmentCommand/${id}`,
    formData,
    { signal }
  );
};

export { uploadStationIcon, getStationPhotos, uploadStationPhotos };
