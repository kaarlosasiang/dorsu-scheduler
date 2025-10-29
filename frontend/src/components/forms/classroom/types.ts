import { z } from "zod";
import { classroomSchema } from "./schema";
import { IClassroom } from "@/lib/services/ClassroomAPI";

// Infer types from schema
export type ClassroomFormData = z.infer<typeof classroomSchema>;

// API Response types
export interface ClassroomResponse {
  success: boolean;
  message: string;
  data: IClassroom;
}

// Form props
export interface ClassroomFormProps {
  initialData?: IClassroom;
  mode?: "create" | "edit";
  onSuccess?: (data: ClassroomResponse) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

