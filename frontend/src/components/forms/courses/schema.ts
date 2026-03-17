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
});

