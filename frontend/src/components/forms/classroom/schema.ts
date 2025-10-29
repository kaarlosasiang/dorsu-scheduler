import { z } from "zod";

// Classroom type enum
const classroomTypeEnum = z.enum(["lecture", "laboratory", "computer-lab", "conference", "other"]);

// Classroom status enum
const classroomStatusEnum = z.enum(["available", "maintenance", "reserved"]);

// Main classroom schema
export const classroomSchema = z.object({
  roomNumber: z
    .string()
    .min(1, "Room number is required")
    .max(50, "Room number cannot exceed 50 characters"),

  building: z
    .string()
    .max(100, "Building name cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),

  capacity: z
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(500, "Capacity cannot exceed 500"),

  type: classroomTypeEnum.default("lecture"),

  facilities: z
    .array(z.string())
    .optional()
    .default([]),

  status: classroomStatusEnum.default("available"),
});

// Export types
export type ClassroomType = z.infer<typeof classroomTypeEnum>;
export type ClassroomStatus = z.infer<typeof classroomStatusEnum>;

