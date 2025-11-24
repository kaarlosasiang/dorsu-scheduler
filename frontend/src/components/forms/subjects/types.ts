import { z } from "zod";
import { subjectSchema } from "./schema";
import type { ISubject as APISubject, SubjectResponse as APISubjectResponse, SubjectListResponse } from "@/lib/services/SubjectAPI";

// Infer types from schema
export type SubjectFormData = z.infer<typeof subjectSchema>;

// Re-export types from SubjectAPI to maintain compatibility
export type ISubject = APISubject;
export type SubjectResponse = APISubjectResponse;
export type SubjectsListResponse = SubjectListResponse;

// Form props
export interface SubjectFormProps {
  initialData?: ISubject;
  mode?: "create" | "edit";
  onSuccess?: (data: SubjectResponse) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

