/** Notification type from GET api/notification-types. */
export interface NotificationTypeDto {
  id: number;
  name: string;
  description: string;
}

export type AppType = "UserApp" | "StationApp";

/** Payload for POST api/notifications (send to all or specific users). */
export interface SendNotificationRequest {
  userIds: number[] | null;
  notificationTypeId: number;
  title: string;
  body: string;
  isForAll: boolean;
  deepLink?: string | null;
  data?: string | null;
  time?: string | null;
}

/** Payload for POST api/notifications/send-by-filter (send by car/city filter). */
export interface SendByFilterRequest {
  notificationTypeId: number;
  title: string;
  body: string;
  carTypeId: number | null;
  carModelId: number | null;
  city: string | null;
  appType: AppType;
  deepLink?: string | null;
  data?: string | null;
}

/** One batch (one send) aggregated stats. */
export interface NotificationBatchDto {
  batchId: string;
  notificationTypeId: number;
  notificationTypeName: string;
  title: string;
  body: string;
  deepLink: string | null;
  sentAt: string;
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
  readRate: number;
}

/** Paginated response from GET /api/notifications/batches. */
export interface NotificationBatchesResponse {
  batches: NotificationBatchDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** Single recipient inside a batch. */
export interface BatchRecipientDto {
  userId: number;
  userName: string | null;
  phone: string | null;
  email: string | null;
  isRead: boolean;
  receivedAt: string;
}

/** Response from GET /api/notifications/batches/{batchId}. */
export interface NotificationBatchDetailDto extends NotificationBatchDto {
  data: string | null;
  recipients: BatchRecipientDto[];
}

export interface GetBatchesParams {
  pageNumber?: number;
  pageSize?: number;
  notificationTypeId?: number;
  fromDate?: string;
  toDate?: string;
}

/** Single notification received by a user. */
export interface UserNotificationDto {
  id: number;
  notificationTypeId: number;
  notificationTypeName: string;
  title: string;
  body: string;
  isRead: boolean;
  deepLink: string | null;
  data: string | null;
  createdAt: string | null;
}

/** Paginated response from GET /api/notifications (user's inbox). */
export interface UserNotificationsResponse {
  notifications: UserNotificationDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GetUserNotificationsParams {
  userId?: number;
  pageNumber?: number;
  pageSize?: number;
  isRead?: boolean | null;
}
