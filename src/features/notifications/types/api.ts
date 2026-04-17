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
