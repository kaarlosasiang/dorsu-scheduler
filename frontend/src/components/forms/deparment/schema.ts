import { z } from "zod";

// Main department schema
export const departmentSchema = z.object({
  name: z
    .string()
    .min(2, "Department name must be at least 2 characters long")
    .max(100, "Department name cannot exceed 100 characters"),

  code: z
    .string()
    .min(2, "Department code must be at least 2 characters long")
    .max(10, "Department code cannot exceed 10 characters")
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Department code must contain only letters and numbers"),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

