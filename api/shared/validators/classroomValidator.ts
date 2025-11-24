import { z } from 'zod';

// Classroom type enum
export const classroomTypeEnum = z.enum(['lecture', 'laboratory', 'computer-lab', 'conference', 'other']);

// Classroom status enum
export const classroomStatusEnum = z.enum(['available', 'maintenance', 'reserved']);

// Create classroom validation schema
export const createClassroomSchema = z.object({
  roomNumber: z.string()
    .min(1, 'Room number is required')
    .max(50, 'Room number cannot exceed 50 characters')
    .trim(),
  building: z.string()
    .max(100, 'Building name cannot exceed 100 characters')
    .trim()
    .optional(),
  capacity: z.number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500'),
  type: classroomTypeEnum.optional().default('lecture'),
  facilities: z.array(z.string()).optional().default([]),
  status: classroomStatusEnum.optional().default('available')
});

// Update classroom validation schema (all fields optional)
export const updateClassroomSchema = z.object({
  roomNumber: z.string()
    .min(1, 'Room number must not be empty')
    .max(50, 'Room number cannot exceed 50 characters')
    .trim()
    .optional(),
  building: z.string()
    .max(100, 'Building name cannot exceed 100 characters')
    .trim()
    .optional(),
  capacity: z.number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500')
    .optional(),
  type: classroomTypeEnum.optional(),
  facilities: z.array(z.string()).optional(),
  status: classroomStatusEnum.optional()
}).strict();

// Query parameters validation schema
export const classroomQuerySchema = z.object({
  roomNumber: z.string().optional(),
  building: z.string().optional(),
  type: classroomTypeEnum.optional(),
  status: classroomStatusEnum.optional(),
  minCapacity: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxCapacity: z.string().regex(/^\d+$/).transform(Number).optional()
});

// Classroom ID validation schema
export const classroomIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid classroom ID format');

// Type exports
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type ClassroomQueryInput = z.infer<typeof classroomQuerySchema>;

// Validation functions
export function validateCreateClassroom(data: unknown) {
  return createClassroomSchema.safeParse(data);
}

export function validateUpdateClassroom(data: unknown) {
  return updateClassroomSchema.safeParse(data);
}

export function validateClassroomQuery(data: unknown) {
  return classroomQuerySchema.safeParse(data);
}

export function validateClassroomId(id: string) {
  return classroomIdSchema.safeParse(id);
}

