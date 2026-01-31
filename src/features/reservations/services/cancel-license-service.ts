import { server } from "../../../lib/@axios";

export interface CancelReservationLicenseRequest {
  id: number;
  note: string | null;
}

export const cancelReservationLicense = async (
  request: CancelReservationLicenseRequest
): Promise<void> => {
  await server.put(
    `/api/reservation-camping/CancelReservationLicense/${request.id}`,
    request
  );
};
