import { z } from "zod";

/** Coerce empty string to null for optional numbers. */
const optionalNumber = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (val === "" || val === undefined) return null;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isNaN(n) ? null : n;
  })
  .nullable();

export const stationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  note: z.string().optional().nullable(),

  cityName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.number({ required_error: "Latitude is required" }),
  longitude: z.number({ required_error: "Longitude is required" }),

  statusId: z.number({ required_error: "Status is required" }),
  chargerPointTypeId: z.number({ required_error: "Charger point type is required" }),
  stationTypeId: z.number().optional().nullable(),

  plugTypeIds: z.array(z.number()).min(1, "At least one plug type is required"),
  paymentMethods: z.array(z.string()),
  services: z.array(z.string()),

  price: optionalNumber,
  chargerSpeed: optionalNumber,
  chargersCount: optionalNumber,
});

export type StationFormValues = z.infer<typeof stationFormSchema>;
