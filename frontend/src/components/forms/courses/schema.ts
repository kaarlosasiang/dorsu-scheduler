import { z } from "zod";

// Main course schema
export const courseSchema = z.object({
  courseCode: z
    .string()
    .min(2, "Course code must be at least 2 characters long")
    .max(20, "Course code cannot exceed 20 characters")
    .toUpperCase()
    .regex(/^[A-Z0-9\s-]+$/, "Course code must contain only letters, numbers, spaces, and hyphens"),

  courseName: z
    .string()
    .min(3, "Course name must be at least 3 characters long")
    .max(200, "Course name cannot exceed 200 characters"),

  units: z
    .number()
    .int("Units must be a whole number")
    .min(0, "Units must be at least 0")
    .max(10, "Units cannot exceed 10"),

  department: z
    .string()
    .min(1, "Please select a department"),
});

