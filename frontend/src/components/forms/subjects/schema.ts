import { z } from "zod";

export const subjectSchema = z.object({
  subjectCode: z
    .string()
    .min(1, "Subject code is required")
    .max(20, "Subject code must be 20 characters or less")
    .regex(/^[A-Z0-9\s\-]+$/i, "Subject code must contain only letters, numbers, spaces, and hyphens"),
  subjectName: z
    .string()
    .min(3, "Subject name must be at least 3 characters")
    .max(200, "Subject name must be 200 characters or less"),
  units: z
    .number()
    .min(0, "Units must be at least 0")
    .max(12, "Units must be 12 or less"),
  description: z.string().optional(),
  course: z.string().min(1, "Course is required"),
  department: z.string().transform(val => val === "" ? undefined : val).optional(),
  yearLevel: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']).optional(),
  semester: z.enum(['1st Semester', '2nd Semester', 'Summer']).optional(),
  isLaboratory: z.boolean().optional(),
  prerequisites: z.array(z.string()).optional(),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

