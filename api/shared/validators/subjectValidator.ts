import { z } from 'zod';

// Create subject schema
export const createSubjectSchema = z.object({
  subjectCode: z.string().min(1, 'Subject code is required').max(20, 'Subject code cannot exceed 20 characters'),
  subjectName: z.string().min(1, 'Subject name is required').max(200, 'Subject name cannot exceed 200 characters'),
  lectureUnits: z.number().min(0, 'Lecture units must be at least 0').max(12, 'Lecture units cannot exceed 12').default(0),
  labUnits: z.number().min(0, 'Lab units must be at least 0').max(12, 'Lab units cannot exceed 12').default(0),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  course: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID'),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  yearLevel: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']).optional(),
  semester: z.enum(['1st Semester', '2nd Semester', 'Summer']).optional(),
  prerequisites: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid prerequisite ID')).optional()
}).refine(
  (data) => data.lectureUnits > 0 || data.labUnits > 0,
  {
    message: 'Subject must have at least lecture units or lab units',
    path: ['lectureUnits']
  }
);

// Update subject schema
export const updateSubjectSchema = createSubjectSchema.partial();

// Subject query schema
export const subjectQuerySchema = z.object({
  course: z.string().optional(),
  department: z.string().optional(),
  yearLevel: z.string().optional(),
  semester: z.string().optional(),
  subjectCode: z.string().optional(),
  subjectName: z.string().optional(),
  hasLaboratory: z.enum(['true', 'false']).optional()
});

// Subject ID validation
export const subjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subject ID');

// Type exports
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type SubjectQueryInput = z.infer<typeof subjectQuerySchema>;

// Validation functions
export function validateCreateSubject(data: unknown) {
  return createSubjectSchema.safeParse(data);
}

export function validateUpdateSubject(data: unknown) {
  return updateSubjectSchema.safeParse(data);
}

export function validateSubjectQuery(data: unknown) {
  return subjectQuerySchema.safeParse(data);
}

export function validateSubjectId(id: string) {
  return subjectIdSchema.safeParse(id);
}

