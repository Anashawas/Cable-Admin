import { server } from "../../../lib/@axios";
import type { UtilityInvoiceRequest } from "../types/api";

export interface UtilityInvoiceFile {
  blob: Blob;
  fileName: string | null;
}

const FILENAME_REGEX = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i;

const extractFileName = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null;
  const match = FILENAME_REGEX.exec(contentDisposition);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
};

/**
 * POST api/reports/utility-invoice
 * Returns the PDF as raw binary. We request a Blob so axios doesn't try to
 * parse it as JSON.
 */
const generateUtilityInvoice = async (
  payload: UtilityInvoiceRequest,
  signal?: AbortSignal
): Promise<UtilityInvoiceFile> => {
  const response = await server.post<Blob>(
    "api/reports/utility-invoice",
    payload,
    {
      signal,
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    }
  );
  const fileName = extractFileName(
    response.headers?.["content-disposition"] as string | undefined
  );
  return { blob: response.data, fileName };
};

export { generateUtilityInvoice };
