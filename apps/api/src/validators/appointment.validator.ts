
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const dateTimeSchema = z
  .string()
  .datetime({
    offset: true,
    message: "Date and time must include a timezone",
  })
  .transform((value) => new Date(value));

export const createAppointmentSchema = z
  .object({
    patientId: objectIdSchema,

    doctorId: objectIdSchema,

    startTime: dateTimeSchema,

    endTime: dateTimeSchema,

    reason: z
      .string()
      .trim()
      .min(3, "Reason must contain at least 3 characters")
      .max(500, "Reason cannot exceed 500 characters"),
  })
  .strict()
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export const updateAppointmentSchema = z
  .object({
    patientId: objectIdSchema.optional(),

    doctorId: objectIdSchema.optional(),

    startTime: dateTimeSchema.optional(),

    endTime: dateTimeSchema.optional(),

    reason: z
      .string()
      .trim()
      .min(3, "Reason must contain at least 3 characters")
      .max(500, "Reason cannot exceed 500 characters")
      .optional(),

    status: z
      .enum(["scheduled", "completed", "cancelled"])
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Provide at least one field to update",
    },
  );

export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema
>;

export type UpdateAppointmentInput = z.infer<
  typeof updateAppointmentSchema
>;
