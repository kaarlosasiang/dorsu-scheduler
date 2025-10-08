import { z } from 'zod';
import { hasOverlap, isValidTimeRange, VALID_DAYS } from '../utils/timeUtils.js';

// Availability validation schema
const availabilitySchema = z.object({
  day: z.enum(VALID_DAYS).refine((day) => VALID_DAYS.includes(day), {
    message: 'Day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format (24-hour)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format (24-hour)')
}).refine((data) => {
  return isValidTimeRange(data.startTime, data.endTime);
}, {
  message: 'Start time must be before end time'
});

// Create faculty validation schema
const createFacultySchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  department: z.string()
    .trim()
    .min(2, 'Department must be at least 2 characters long')
    .max(50, 'Department cannot exceed 50 characters'),
  availability: z.array(availabilitySchema)
    .optional()
    .refine((data) => {
      if (!data || data.length === 0) return true;
      return !hasOverlap(data);
    }, {
      message: 'Availability slots cannot overlap on the same day'
    }),
  maxLoad: z.number()
    .min(1, 'Max load must be at least 1 hour')
    .max(40, 'Max load cannot exceed 40 hours')
    .optional(),
  currentLoad: z.number()
    .min(0, 'Current load cannot be negative')
    .optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// Update faculty validation schema (all fields optional)
const updateFacultySchema = createFacultySchema.partial();

// Availability update schema
const availabilityUpdateSchema = z.array(availabilitySchema)
  .refine((data) => {
    return !hasOverlap(data);
  }, {
    message: 'Availability slots cannot overlap on the same day'
  });

// Workload update schema
const workloadUpdateSchema = z.object({
  hours: z.number()
    .min(0, 'Hours cannot be negative')
});

// Status update schema
const statusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive'])
});

// Query parameters schema
const facultyQuerySchema = z.object({
  department: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional()
});

/**
 * Validate create faculty data
 */
export const validateCreateFaculty = (data: unknown) => {
  return createFacultySchema.safeParse(data);
};

/**
 * Validate update faculty data
 */
export const validateUpdateFaculty = (data: unknown) => {
  return updateFacultySchema.safeParse(data);
};

/**
 * Validate availability data
 */
export const validateAvailability = (availability: unknown) => {
  return availabilityUpdateSchema.safeParse(availability);
};

/**
 * Validate workload update data
 */
export const validateWorkloadUpdate = (data: unknown) => {
  return workloadUpdateSchema.safeParse(data);
};

/**
 * Validate status update data
 */
export const validateStatusUpdate = (data: unknown) => {
  return statusUpdateSchema.safeParse(data);
};

/**
 * Validate query parameters
 */
export const validateFacultyQuery = (query: unknown) => {
  return facultyQuerySchema.safeParse(query);
};

// Export types
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type AvailabilityInput = z.infer<typeof availabilityUpdateSchema>;
export type WorkloadUpdateInput = z.infer<typeof workloadUpdateSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type FacultyQueryInput = z.infer<typeof facultyQuerySchema>;