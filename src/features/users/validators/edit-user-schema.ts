import { z } from "zod";

export const editUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z.string(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  isActive: z.boolean(),
  roleId: z.number({ required_error: "Role is required" }),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
