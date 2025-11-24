import { z } from 'zod';

// Create department validation schema - minimal fields only
export const createDepartmentSchema = z.object({
  name: z.string()
    .min(2, 'Department name must be at least 2 characters long')
    .max(100, 'Department name cannot exceed 100 characters')
    .trim(),
  
  code: z.string()
    .min(2, 'Department code must be at least 2 characters long')
    .max(10, 'Department code cannot exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers')
    .transform(val => val.toUpperCase())
    .optional(), // Make code optional for auto-generation
  
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),

  courses: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID')).optional()
});

// Update department validation schema
export const updateDepartmentSchema = z.object({
  name: z.string()
    .min(2, 'Department name must be at least 2 characters long')
    .max(100, 'Department name cannot exceed 100 characters')
    .trim()
    .optional(),
  
  code: z.string()
    .min(2, 'Department code must be at least 2 characters long')
    .max(10, 'Department code cannot exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers')
    .transform(val => val.toUpperCase())
    .optional(),
  
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),

  courses: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID')).optional()
});

// Query parameters validation schema
export const departmentQuerySchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  sortBy: z.enum(['name', 'code', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Type inference
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQueryInput = z.infer<typeof departmentQuerySchema>;

// Validation functions
export const validateCreateDepartment = (data: unknown) => {
  return createDepartmentSchema.safeParse(data);
};

export const validateUpdateDepartment = (data: unknown) => {
  return updateDepartmentSchema.safeParse(data);
};

export const validateDepartmentQuery = (data: unknown) => {
  return departmentQuerySchema.safeParse(data);
};

// Department ID validation
export const validateDepartmentId = (id: string) => {
  return z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format')
    .safeParse(id);
};