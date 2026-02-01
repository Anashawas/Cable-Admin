import { server } from "../../../lib/@axios";
import type { UserComplaintDto } from "../types/api";

/**
 * GET api/usercomplaints/GetAllUserComplaints
 * No query params. Returns full list.
 */
const getAllComplaints = async (
  signal?: AbortSignal
): Promise<UserComplaintDto[]> => {
  const { data } = await server.get<UserComplaintDto[]>(
    "api/usercomplaints/GetAllUserComplaints",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * DELETE api/usercomplaints/DeleteUserComplaint/{id}
 * Complaint ID in URL. No body.
 */
const deleteComplaint = async (
  id: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(
    `api/usercomplaints/DeleteUserComplaint/${id}`,
    { signal }
  );
};

export { getAllComplaints, deleteComplaint };
