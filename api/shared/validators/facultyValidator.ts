import { z } from 'zod';

// Name validation schema
const nameSchema = z.object({
  first: z.string()
    .trim()
    .min(2, 'First name must be at least 2 characters long')
    .max(50, 'First name cannot exceed 50 characters'),
  middle: z.string()
    .trim()
    .max(50, 'Middle name cannot exceed 50 characters')
    .optional(),
  last: z.string()
    .trim()
    .min(2, 'Last name must be at least 2 characters long')
    .max(50, 'Last name cannot exceed 50 characters'),
  ext: z.string()
    .trim()
    .max(10, 'Extension cannot exceed 10 characters')
    .optional()
});

// Create faculty validation schema
const createFacultySchema = z.object({
  name: nameSchema,
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase(),
  department: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Department must be a valid ObjectId'),
  employmentType: z.enum(['full-time', 'part-time']).default('full-time'),
  image: z.string()
    .trim()
    .transform(val => val === '' ? undefined : val)
    .optional()
    .refine(val => val === undefined || z.string().url().safeParse(val).success, {
      message: 'Image must be a valid URL'
    }),
  minLoad: z.number()
    .min(18, 'Minimum load must be at least 18 units')
    .max(26, 'Minimum load cannot exceed 26 units')
    .default(18)
    .optional(),
  maxLoad: z.number()
    .min(18, 'Max load must be at least 18 units')
    .max(26, 'Max load cannot exceed 26 units')
    .default(26)
    .optional(),
  status: z.enum(['active', 'inactive']).default('active').optional()
}).refine((data) => {
  // Validate that minLoad is not greater than maxLoad
  const minLoad = data.minLoad || 18;
  const maxLoad = data.maxLoad || 26;
  return minLoad <= maxLoad;
}, {
  message: 'Minimum load cannot exceed maximum load'
});

// Update faculty validation schema (all fields optional)
const updateFacultySchema = createFacultySchema.partial();

// Workload update schema
const workloadUpdateSchema = z.object({
  hours: z.number()
    .min(0, 'Hours cannot be negative')
});

// Preparation update schema
const preparationUpdateSchema = z.object({
  preparations: z.number()
    .min(0, 'Preparations cannot be negative')
    .max(4, 'Preparations cannot exceed 4')
});

// Status update schema
const statusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive'])
});

// Query parameters schema
const facultyQuerySchema = z.object({
  department: z.string().optional(), // Can be department name or ObjectId
  departmentId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Department ID must be a valid ObjectId')
    .optional(),
  status: z.enum(['active', 'inactive']).optional(),
  employmentType: z.enum(['full-time', 'part-time']).optional(),
  email: z.string().optional(),
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
 * Validate workload update data
 */
export const validateWorkloadUpdate = (data: unknown) => {
  return workloadUpdateSchema.safeParse(data);
};

/**
 * Validate preparation update data
 */
export const validatePreparationUpdate = (data: unknown) => {
  return preparationUpdateSchema.safeParse(data);
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
export type WorkloadUpdateInput = z.infer<typeof workloadUpdateSchema>;
export type PreparationUpdateInput = z.infer<typeof preparationUpdateSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type FacultyQueryInput = z.infer<typeof facultyQuerySchema>;