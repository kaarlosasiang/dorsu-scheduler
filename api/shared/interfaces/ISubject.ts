export interface ISubject {
  _id?: string;
  subjectCode: string;
  subjectName: string;
  units: number; // Total units (calculated from lectureUnits + labUnits)
  lectureUnits: number; // Units for lecture component (e.g., 3)
  labUnits: number; // Units for laboratory component (e.g., 1.25)
  lectureHours?: number; // Computed: Teaching hours for lecture (lectureUnits * 1)
  labHours?: number; // Computed: Teaching hours for lab (labUnits / 0.75)
  totalTeachingHours?: number; // Computed: lectureHours + labHours
  description?: string;
  course: string; // Reference to Course (degree program) _id
  department?: string; // Reference to Department _id
  yearLevel?: string; // e.g., "1st Year", "2nd Year", etc.
  semester?: string; // e.g., "1st Semester", "2nd Semester"
  hasLaboratory?: boolean; // Computed: true if labUnits > 0
  prerequisites?: string[]; // Array of subject IDs that are prerequisites
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Teaching hours conversion ratios
 * - Lecture: 1 unit = 1 hour (1:1 ratio)
 * - Lab: 1 unit = 1.33... hours (1:0.75 ratio, or 3 units = 4 hours)
 */
export const LECTURE_UNIT_TO_HOURS_RATIO = 1;
export const LAB_UNIT_TO_HOURS_RATIO = 1 / 0.75; // 1.333...

export function calculateLectureHours(lectureUnits: number): number {
  return lectureUnits * LECTURE_UNIT_TO_HOURS_RATIO;
}

export function calculateLabHours(labUnits: number): number {
  return labUnits * LAB_UNIT_TO_HOURS_RATIO;
}

export function calculateTotalTeachingHours(lectureUnits: number, labUnits: number): number {
  return calculateLectureHours(lectureUnits) + calculateLabHours(labUnits);
}

export interface ISubjectFilter {
  course?: string;
  department?: string;
  yearLevel?: string;
  semester?: string;
  subjectCode?: string;
  subjectName?: string;
}

