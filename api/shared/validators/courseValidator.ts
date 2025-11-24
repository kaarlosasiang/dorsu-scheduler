import { z } from 'zod';

// Create course validation schema
export const createCourseSchema = z.object({
  courseCode: z.string()
    .min(1, 'Course code is required')
    .max(20, 'Course code cannot exceed 20 characters')
    .trim()
    .transform(val => val.toUpperCase()),

  courseName: z.string()
    .min(1, 'Course name is required')
    .max(200, 'Course name cannot exceed 200 characters')
    .trim(),

  units: z.number()
    .min(0, 'Units must be at least 0')
    .max(12, 'Units cannot exceed 12'),

  description: z.string()
    .max(500, 'Course description cannot exceed 500 characters')
    .trim()
    .optional(),

  department: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format')
    .optional()
});

// Update course validation schema
export const updateCourseSchema = z.object({
  courseCode: z.string()
    .min(1, 'Course code is required')
    .max(20, 'Course code cannot exceed 20 characters')
    .trim()
    .transform(val => val.toUpperCase())
    .optional(),

  courseName: z.string()
    .min(1, 'Course name is required')
    .max(200, 'Course name cannot exceed 200 characters')
    .trim()
    .optional(),

  units: z.number()
    .min(0, 'Units must be at least 0')
    .max(12, 'Units cannot exceed 12')
    .optional(),

  description: z.string()
    .max(500, 'Course description cannot exceed 500 characters')
    .trim()
    .optional(),

  department: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format')
    .optional()
});

// Query parameters validation schema
export const courseQuerySchema = z.object({
  courseCode: z.string().optional(),
  courseName: z.string().optional(),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  sortBy: z.enum(['courseCode', 'courseName', 'units', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Type inference
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;

// Validation functions
export const validateCreateCourse = (data: unknown) => {
  return createCourseSchema.safeParse(data);
};

export const validateUpdateCourse = (data: unknown) => {
  return updateCourseSchema.safeParse(data);
};

export const validateCourseQuery = (data: unknown) => {
  return courseQuerySchema.safeParse(data);
};

// Course ID validation
export const validateCourseId = (id: string) => {
  return z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format')
    .safeParse(id);
};

