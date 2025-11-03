import { ISubject } from "@/lib/services/SubjectAPI";

export interface SubjectFormData {
  subjectCode: string;
  subjectName: string;
  units: number;
  description?: string;
  course: string;
  department?: string;
  yearLevel?: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
  semester?: '1st Semester' | '2nd Semester' | 'Summer';
  isLaboratory?: boolean;
  prerequisites?: string[];
}

export interface SubjectFormProps {
  initialData?: ISubject;
  mode?: "create" | "edit";
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

