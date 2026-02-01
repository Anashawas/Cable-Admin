import { z } from "zod";

/** Parse comma-separated string to array of positive integer IDs. */
export function parseUserIds(value: string | null | undefined): number[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export const sendNotificationFormSchema = z
  .object({
    notificationTypeId: z.number({ required_error: "Notification type is required" }).min(1, "Notification type is required"),
    title: z.string().min(1, "Title is required"),
    body: z.string().min(1, "Body is required"),
    isForAll: z.boolean(),
    userIdsString: z.string().optional(),
    offerDate: z.string().optional(),
    offerTime: z.string().optional(),
    deepLink: z.string().nullable().optional(),
    data: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.isForAll) return true;
      const ids = parseUserIds(data.userIdsString);
      return ids.length >= 1;
    },
    { message: "Please enter at least one valid user ID", path: ["userIdsString"] }
  );

export type SendNotificationFormValues = z.infer<typeof sendNotificationFormSchema>;
