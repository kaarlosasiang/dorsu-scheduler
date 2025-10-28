import { z } from "zod";
import { courseSchema } from "./schema";
import { ICourse } from "@/lib/services/CourseAPI";

// Infer types from schema
export type CourseFormData = z.infer<typeof courseSchema>;

// API Response types
export interface CourseResponse {
  success: boolean;
  message: string;
  data: ICourse;
}

// Form props
export interface CourseFormProps {
  initialData?: ICourse;
  mode?: "create" | "edit";
  onSuccess?: (data: CourseResponse) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

