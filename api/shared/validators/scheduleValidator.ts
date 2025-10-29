import { z } from 'zod';

// Time slot schema
export const timeSlotSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format')
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: 'End time must be after start time'
});

// Create schedule schema
export const createScheduleSchema = z.object({
  course: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID'),
  faculty: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid faculty ID'),
  classroom: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid classroom ID'),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID'),
  timeSlot: timeSlotSchema,
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  yearLevel: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']).optional(),
  section: z.string().max(10).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft')
});

// Update schedule schema
export const updateScheduleSchema = createScheduleSchema.partial();

// Schedule query schema
export const scheduleQuerySchema = z.object({
  course: z.string().optional(),
  faculty: z.string().optional(),
  classroom: z.string().optional(),
  department: z.string().optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
  yearLevel: z.string().optional(),
  section: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional()
});

// Schedule generation request schema
export const scheduleGenerationSchema = z.object({
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  departments: z.array(z.string()).optional(),
  courses: z.array(z.string()).optional(),
  constraints: z.object({
    maxHoursPerWeek: z.number().min(1).max(40).optional(),
    minHoursPerWeek: z.number().min(1).max(40).optional(),
    maxPreparations: z.number().min(1).max(10).optional(),
    preferredDays: z.array(z.string()).optional(),
    minimumCapacity: z.number().min(1).optional(),
    requiredFacilities: z.array(z.string()).optional(),
    allowedDays: z.array(z.string()).optional()
  }).optional(),
  overwriteExisting: z.boolean().optional().default(false)
});

// Schedule ID validation schema
export const scheduleIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid schedule ID format');

// Type exports
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
export type ScheduleGenerationInput = z.infer<typeof scheduleGenerationSchema>;

// Validation functions
export function validateCreateSchedule(data: unknown) {
  return createScheduleSchema.safeParse(data);
}

export function validateUpdateSchedule(data: unknown) {
  return updateScheduleSchema.safeParse(data);
}

export function validateScheduleQuery(data: unknown) {
  return scheduleQuerySchema.safeParse(data);
}

export function validateScheduleGeneration(data: unknown) {
  return scheduleGenerationSchema.safeParse(data);
}

export function validateScheduleId(id: string) {
  return scheduleIdSchema.safeParse(id);
}

