import { server } from "@/lib/@axios";

/**
 * DELETE /api/files/attachment/{folderName}/{id}
 * Generic endpoint to delete a single attachment by folder and identifier.
 */
export async function deleteAttachment(
  folderName: string,
  id: string | number
): Promise<void> {
  await server.delete(`/api/files/attachment/${folderName}/${id}`);
}
