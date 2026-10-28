import { server } from "../../../lib/@axios";
import type { UserComplaintDto } from "../types/api";
import { ComplaintStatus } from "../types/api";

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
 * GET api/usercomplaints/GetComplaintsByChargingPointId/{id}
 * Complaints for one station.
 */
const getComplaintsByChargingPointId = async (
  chargingPointId: number,
  signal?: AbortSignal
): Promise<UserComplaintDto[]> => {
  const { data } = await server.get<UserComplaintDto[]>(
    `api/usercomplaints/GetComplaintsByChargingPointId/${chargingPointId}`,
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

/**
 * PATCH api/usercomplaints/UpdateUserComplaintStatus/{id}
 * `reply` (optional, ≤ 1000) is the answer shown to the driver; null keeps the current one.
 * On a ChargingSession complaint every status or reply change pushes the driver.
 */
const updateComplaintStatus = async (
  id: number,
  status: ComplaintStatus,
  reply?: string | null
): Promise<void> => {
  const body: { status: ComplaintStatus; reply?: string } = { status };
  if (reply != null && reply.trim()) body.reply = reply.trim();
  await server.patch(`api/usercomplaints/UpdateUserComplaintStatus/${id}`, body);
};

export { getAllComplaints, getComplaintsByChargingPointId, deleteComplaint, updateComplaintStatus };
