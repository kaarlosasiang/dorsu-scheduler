import { z } from "zod";
import { facultySchema, nameSchema } from "./schema";
import { IFaculty } from "@/lib/services/FacultyAPI";

// Infer types from schemas
export type FacultyFormData = z.infer<typeof facultySchema>;
export type NameFormData = z.infer<typeof nameSchema>;

// API Response types
export interface FacultyResponse {
  success: boolean;
  data: {
    id: string;
    name: NameFormData;
    email: string;
    department: string;
    employmentType: "full-time" | "part-time";
    image?: string;
    minLoad: number;
    maxLoad: number;
    currentLoad: number;
    maxPreparations: number;
    currentPreparations: number;
    status: "active" | "inactive";
    createdAt: string;
    updatedAt: string;
    fullName?: string;
    availableLoad?: number;
    availablePreparations?: number;
  };
}

// Form props
export interface FacultyFormProps {
  initialData?: IFaculty;
  mode?: "create" | "edit";
  onSuccess?: (data: FacultyResponse) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

// Employment type options
export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
] as const;

// Status options
export const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
] as const;