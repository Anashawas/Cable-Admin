import { server } from "../../../lib/@axios";
import type { NotificationTypeDto, SendNotificationRequest, SendByFilterRequest } from "../types/api";

/**
 * GET api/notification-types
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
 * Send to all users or specific user IDs.
 */
const sendNotification = async (
  payload: SendNotificationRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.post("api/notifications", payload, { signal });
};

/**
 * POST api/notifications/send-by-filter
 * Send to users filtered by CarTypeId, CarModelId, or City.
 */
const sendNotificationByFilter = async (
  payload: SendByFilterRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.post("api/notifications/send-by-filter", payload, { signal });
};

export { getNotificationTypes, sendNotification, sendNotificationByFilter };
