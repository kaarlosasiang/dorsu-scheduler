import { z } from "zod";

// Subject form schema - aligned with backend Subject model
export const subjectSchema = z.object({
  subjectCode: z
    .string()
    .min(1, "Subject code is required")
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9\s-]+$/, "Subject code must contain only letters, numbers, spaces, and hyphens"),

  subjectName: z
    .string()
    .min(1, "Subject name is required")
    .trim(),

  lectureUnits: z
    .number()
    .min(0, "Lecture units must be at least 0")
    .max(12, "Lecture units cannot exceed 12")
    .default(0),

  labUnits: z
    .number()
    .min(0, "Lab units must be at least 0")
    .max(12, "Lab units cannot exceed 12")
    .default(0),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),

  course: z
    .string()
    .min(1, "Course is required"),

  department: z
    .string()
    .optional()
    .or(z.literal("")),

  yearLevel: z
    .enum(["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", ""])
    .optional()
    .nullable(),

  semester: z
    .enum(["1st Semester", "2nd Semester", "Summer", ""])
    .optional()
    .nullable(),

  prerequisites: z
    .array(z.string())
    .optional()
    .default([]),
}).refine((data) => {
  // Validate that at least one type of units is specified
  return data.lectureUnits > 0 || data.labUnits > 0;
}, {
  message: "Subject must have at least lecture units or lab units",
  path: ["lectureUnits"],
});

