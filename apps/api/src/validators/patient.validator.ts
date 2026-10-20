import { z } from "zod";

export const createPatientSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    age: z.coerce
      .number()
      .int("Age must be a whole number")
      .min(0, "Age cannot be negative")
      .max(130, "Age cannot exceed 130"),

    gender: z.enum(["male", "female", "other"]),

    phone: z
      .string()
      .trim()
      .min(7, "Phone must contain at least 7 characters")
      .max(20, "Phone cannot exceed 20 characters"),

    notes: z
      .string()
      .trim()
      .max(2000, "Notes cannot exceed 2000 characters")
      .default(""),
  })
  .strict();

export const updatePatientSchema = createPatientSchema
  .omit({})
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type CreatePatientInput = z.infer<
  typeof createPatientSchema
>;

export type UpdatePatientInput = z.infer<
  typeof updatePatientSchema
>;