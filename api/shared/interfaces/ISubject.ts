export interface ISubject {
  _id?: string;
  subjectCode: string;
  subjectName: string;
  units: number;
  description?: string;
  course: string; // Reference to Course (degree program) _id
  department?: string; // Reference to Department _id
  yearLevel?: string; // e.g., "1st Year", "2nd Year", etc.
  semester?: string; // e.g., "1st Semester", "2nd Semester"
  isLaboratory?: boolean; // Whether this subject requires a lab
  prerequisites?: string[]; // Array of subject IDs that are prerequisites
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubjectFilter {
  course?: string;
  department?: string;
  yearLevel?: string;
  semester?: string;
  subjectCode?: string;
  subjectName?: string;
}

