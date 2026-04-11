import { server } from "@/lib/@axios";

/**
 * Backend `UploadFileFolders` values for
 * `DELETE /api/files/attachment/{folder}/{id}`.
 * Do not use `CableChargingPoint` for delete — icons use the upload endpoint instead.
 */
export const UploadFileFolders = {
  CableAttachments: "CableAttachments",
  CableBanners: "CableBanners",
  CableEmergencyService: "CableEmergencyService",
  CableServiceProvider: "CableServiceProvider",
  CableOfferAttachments: "CableOfferAttachments",
  CableChargingPoint: "CableChargingPoint",
} as const;

export type UploadFileFolder =
  (typeof UploadFileFolders)[keyof typeof UploadFileFolders];

/**
 * DELETE /api/files/attachment/{folderName}/{id}
 * Generic endpoint to delete a single attachment by folder and identifier.
 */
export async function deleteAttachment(
  folderName: UploadFileFolder | string,
  id: string | number
): Promise<void> {
  await server.delete(`/api/files/attachment/${folderName}/${id}`);
}
