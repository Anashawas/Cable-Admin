import { server } from "../../../lib/@axios";
import type {
  NotificationTypeDto,
  SendNotificationRequest,
  SendByFilterRequest,
  NotificationBatchesResponse,
  NotificationBatchDetailDto,
  GetBatchesParams,
  UserNotificationsResponse,
  GetUserNotificationsParams,
} from "../types/api";

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

/**
 * GET /api/notifications/batches
 * Paginated list of notification sends with aggregated stats.
 */
const getNotificationBatches = async (
  params?: GetBatchesParams,
  signal?: AbortSignal
): Promise<NotificationBatchesResponse> => {
  const { data } = await server.get<NotificationBatchesResponse>(
    "api/notifications/batches",
    { params, signal }
  );
  return data;
};

/**
 * GET /api/notifications/batches/{batchId}
 * Full stats + recipient breakdown for a single send.
 */
const getNotificationBatchById = async (
  batchId: string,
  signal?: AbortSignal
): Promise<NotificationBatchDetailDto> => {
  const { data } = await server.get<NotificationBatchDetailDto>(
    `api/notifications/batches/${batchId}`,
    { signal }
  );
  return data;
};

/**
 * GET /api/notifications
 * Paginated list of notifications received by a user.
 * Accepts optional userId (admin) and isRead filters.
 */
const getUserNotifications = async (
  params?: GetUserNotificationsParams,
  signal?: AbortSignal
): Promise<UserNotificationsResponse> => {
  const { data } = await server.get<UserNotificationsResponse>(
    "api/notifications",
    { params, signal }
  );
  return data;
};

export {
  getNotificationTypes,
  sendNotification,
  sendNotificationByFilter,
  getNotificationBatches,
  getNotificationBatchById,
  getUserNotifications,
};
