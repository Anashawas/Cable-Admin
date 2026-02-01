/** Notification type from GET api/notification-types. */
export interface NotificationTypeDto {
  id: number;
  name: string;
  description: string;
}

/** Payload for POST api/notifications. */
export interface SendNotificationRequest {
  userIds: number[] | null;
  notificationTypeId: number;
  title: string;
  body: string;
  isForAll: boolean;
  deepLink?: string | null;
  data?: string | null;
  time?: string | null; // "YYYY-MM-DD HH:MM:SS" for offer type
}
