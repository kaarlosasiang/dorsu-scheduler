import { z } from "zod";
import { departmentSchema } from "./schema";
import { IDepartment } from "@/lib/services/DepartmentAPI";

// Infer types from schema
export type DepartmentFormData = z.infer<typeof departmentSchema>;

// API Response types
export interface DepartmentResponse {
  success: boolean;
  message: string;
  data: IDepartment;
}

// Form props
export interface DepartmentFormProps {
  initialData?: IDepartment;
  mode?: "create" | "edit";
  onSuccess?: (data: DepartmentResponse) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

