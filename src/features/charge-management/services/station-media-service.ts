import { server } from "../../../lib/@axios";

/** Single attachment from GetAllChargingPointAttachmentsById (shape may vary). */
export interface StationAttachmentDto {
  id?: number;
  attachmentId?: number;
  url?: string | null;
  attachmentUrl?: string | null;
  // The API actually returns each photo by fileName + filePath (no numeric id).
  fileName?: string | null;
  filePath?: string | null;
  contentType?: string | null;
  fileExtension?: string | null;
  fileSize?: number;
  [key: string]: unknown;
}

/**
 * Identifier for DELETE /api/files/attachment/CableAttachments/{id}.
 * The API returns each attachment by fileName (e.g. "01a0…-….jpg") stored at
 * /CableAttachments/{fileName}, so the fileName IS the delete key. Falls back
 * to a numeric id/attachmentId if the BE ever returns one.
 */
export function getStationAttachmentId(
  photo: StationAttachmentDto
): string | number | undefined {
  if (typeof photo.fileName === "string" && photo.fileName.trim().length > 0) {
    return photo.fileName;
  }
  if (typeof photo.id === "number" && photo.id > 0) return photo.id;
  if (typeof photo.attachmentId === "number" && photo.attachmentId > 0) {
    return photo.attachmentId;
  }
  return undefined;
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
