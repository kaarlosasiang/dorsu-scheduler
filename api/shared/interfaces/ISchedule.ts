export interface ITimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // Format: "HH:mm" (24-hour)
  endTime: string;   // Format: "HH:mm" (24-hour)
}

export interface ISchedule {
  _id?: string;
  course: string; // Course ObjectId reference
  faculty: string; // Faculty ObjectId reference
  classroom: string; // Classroom ObjectId reference
  department: string; // Department ObjectId reference
  timeSlot: ITimeSlot;
  semester: string; // e.g., "1st Semester 2024-2025"
  academicYear: string; // e.g., "2024-2025"
  yearLevel?: string; // e.g., "1st Year", "2nd Year", "3rd Year", "4th Year"
  section?: string; // e.g., "A", "B", "C"
  status?: 'draft' | 'published' | 'archived';
  isGenerated?: boolean; // True if auto-generated, false if manual
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual/populated fields
  courseDetails?: any;
  facultyDetails?: any;
  classroomDetails?: any;
  departmentDetails?: any;
}

export interface IScheduleFilter {
  course?: string;
  faculty?: string;
  classroom?: string;
  department?: string;
  semester?: string;
  academicYear?: string;
  yearLevel?: string;
  section?: string;
  status?: string;
  day?: string;
}

export interface IScheduleConflict {
  type: 'faculty' | 'classroom' | 'time' | 'workload';
  severity: 'error' | 'warning';
  message: string;
  schedules: string[]; // Array of schedule IDs involved
  details?: any;
}

export interface IScheduleResponse {
  success: boolean;
  message: string;
  data?: ISchedule | ISchedule[];
  conflicts?: IScheduleConflict[];
  error?: string;
}

// Auto-generation constraints
export interface IScheduleConstraints {
  // Faculty constraints
  maxHoursPerWeek?: number; // Default: 26
  minHoursPerWeek?: number; // Default: 18
  maxPreparations?: number; // Default: 4
  preferredDays?: string[];
  preferredTimeSlots?: ITimeSlot[];

  // Room constraints
  minimumCapacity?: number;
  requiredFacilities?: string[];

  // Time constraints
  allowedDays?: string[];
  allowedTimeRange?: {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
  };

  // Course constraints
  hoursPerWeek?: number; // Based on course units
  requiresLab?: boolean;
}

// Generation request
export interface IScheduleGenerationRequest {
  semester: string;
  academicYear: string;
  departments?: string[]; // If empty, generate for all
  courses?: string[]; // If empty, generate for all in selected departments
  constraints?: IScheduleConstraints;
  overwriteExisting?: boolean;
}

// Generation result
export interface IScheduleGenerationResult {
  success: boolean;
  message: string;
  generated: number;
  failed: number;
  conflicts: IScheduleConflict[];
  schedules?: ISchedule[];
  statistics?: {
    totalSchedules: number;
    byDepartment: Record<string, number>;
    byFaculty: Record<string, number>;
    roomUtilization: number;
    facultyUtilization: number;
  };
}

