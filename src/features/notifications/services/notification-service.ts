import { server } from "../../../lib/@axios";
import type { NotificationTypeDto, SendNotificationRequest } from "../types/api";

/**
 * GET api/notification-types
 * Returns list of notification types for the send form.
 */
const getNotificationTypes = async (
  signal?: AbortSignal
): Promise<NotificationTypeDto[]> => {
  const { data } = await server.get<NotificationTypeDto[]>(
    "api/notification-types",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/notifications
 * Sends broadcast or targeted notification. Success = HTTP 2xx.
 */
const sendNotification = async (
  payload: SendNotificationRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.post("api/notifications", payload, { signal });
};

export { getNotificationTypes, sendNotification };
