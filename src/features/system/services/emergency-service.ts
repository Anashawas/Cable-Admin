import { server } from "../../../lib/@axios";
import type {
  EmergencyServiceDto,
  EmergencyServicePayload,
  EmergencyServiceAttachmentDto,
} from "../types/api";

const BASE = "api/emergency-services";
const ATTACHMENTS_BASE = "api/emergencyServiceAttachments";

/**
 * GET api/emergency-services/GetAllEmergencyServices
 */
const getAll = async (signal?: AbortSignal): Promise<EmergencyServiceDto[]> => {
  const { data } = await server.get<EmergencyServiceDto[]>(
    `${BASE}/GetAllEmergencyServices`,
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/emergency-services/AddEmergencyService
 * Returns new service ID (number or [id]).
 */
const add = async (
  body: EmergencyServicePayload,
  signal?: AbortSignal
): Promise<number> => {
  const { data } = await server.post<number | number[]>(
    `${BASE}/AddEmergencyService`,
    body,
    { signal }
  );
  if (Array.isArray(data) && data.length > 0) return data[0];
  if (typeof data === "number") return data;
  const str = typeof data === "string" ? data : String(data ?? "");
  const num = parseInt(str.replace(/^\[|\]$/g, ""), 10);
  if (Number.isFinite(num)) return num;
  throw new Error("Unexpected add emergency service response");
};

/**
 * PUT api/emergency-services/UpdateEmergencyService/{id}
 */
const update = async (
  id: number,
  body: EmergencyServicePayload,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(`${BASE}/UpdateEmergencyService/${id}`, body, { signal });
};

/**
 * DELETE api/emergency-services/DeleteEmergencyService/{id}
 */
const remove = async (
  id: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(`${BASE}/DeleteEmergencyService/${id}`, { signal });
};

/**
 * POST api/emergencyServiceAttachments/AddEmergencyServiceAttachment/{serviceId}
 * Form key: files. Returns attachment(s); use first item's filePath.
 */
const uploadIcon = async (
  serviceId: number,
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  const form = new FormData();
  form.append("files", file);
  const { data } = await server.post<EmergencyServiceAttachmentDto | EmergencyServiceAttachmentDto[]>(
    `${ATTACHMENTS_BASE}/AddEmergencyServiceAttachment/${serviceId}`,
    form,
    { signal }
  );
  const attachment = Array.isArray(data) ? data[0] : data;
  const filePath = attachment?.filePath;
  if (!filePath) throw new Error("Upload did not return filePath");
  return filePath;
};

export { getAll, add, update, remove, uploadIcon };
