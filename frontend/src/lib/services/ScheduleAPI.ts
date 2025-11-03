import APIService from "./BaseAPI";

export interface ITimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
}

export interface ISchedule {
  _id?: string;
  id?: string;
  subject: string | any;
  faculty: string | any;
  classroom: string | any;
  department: string | any;
  timeSlot: ITimeSlot;
  semester: string;
  academicYear: string;
  yearLevel?: string;
  section?: string;
  status?: 'draft' | 'published' | 'archived';
  isGenerated?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Populated fields
  subjectDetails?: any;
  facultyDetails?: any;
  classroomDetails?: any;
  departmentDetails?: any;
}

export interface IScheduleConflict {
  type: 'faculty' | 'classroom' | 'time' | 'workload';
  severity: 'error' | 'warning';
  message: string;
  schedules: string[];
  details?: any;
}

export interface ScheduleListResponse {
  success: boolean;
  message: string;
  data: ISchedule[];
  count: number;
}

export interface ScheduleResponse {
  success: boolean;
  message: string;
  data: ISchedule;
}

export interface ScheduleStatsResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    published: number;
    draft: number;
    generated: number;
    manual: number;
    byDepartment: Array<{
      _id: string;
      name: string;
      code: string;
      count: number;
    }>;
  };
}

export interface ConflictDetectionResponse {
  success: boolean;
  message: string;
  conflicts: IScheduleConflict[];
  hasConflicts: boolean;
}

export interface ScheduleGenerationRequest {
  semester: string;
  academicYear: string;
  departments?: string[];
  courses?: string[];
  subjects?: string[];
  constraints?: {
    maxHoursPerWeek?: number;
    minHoursPerWeek?: number;
    maxPreparations?: number;
    minimumCapacity?: number;
    requiredFacilities?: string[];
  };
  overwriteExisting?: boolean;
}

export interface ScheduleGenerationResponse {
  success: boolean;
  message: string;
  generated?: number;
  failed?: number;
  conflicts: IScheduleConflict[];
  schedules?: ISchedule[];
  statistics?: {
    totalSchedules: number;
    byDepartment: Record<string, number>;
    byFaculty: Record<string, number>;
    roomUtilization: number;
    facultyUtilization: number;
  };
  failedSubjects?: Array<{
    subjectCode: string;
    subjectName: string;
    reason: string;
  }>;
}

export interface ScheduleQueryParams {
  subject?: string;
  faculty?: string;
  classroom?: string;
  department?: string;
  semester?: string;
  academicYear?: string;
  yearLevel?: string;
  subject: string;
  status?: 'draft' | 'published' | 'archived';
  day?: string;
}

export interface ScheduleCreateData {
  course: string;
  faculty: string;
  classroom: string;
  department: string;
  timeSlot: ITimeSlot;
  semester: string;
  academicYear: string;
  subject?: string;
  section?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface ScheduleUpdateData {
  course?: string;
  faculty?: string;
  classroom?: string;
  department?: string;
  timeSlot?: ITimeSlot;
  semester?: string;
  academicYear?: string;
  yearLevel?: string;
  section?: string;
  status?: 'draft' | 'published' | 'archived';
}

export const ScheduleAPI = {
  /**
   * Get all schedules with optional filtering
   */
  getAll: async (params?: ScheduleQueryParams) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : "";

    const endpoint = queryString ? `schedules?${queryString}` : "schedules";
    const response = await APIService.get(endpoint);
    return response.data as ScheduleListResponse;
  },

  /**
   * Get schedule by ID
   */
  getById: async (id: string) => {
    const response = await APIService.get(`schedules/${id}`);
    return response.data as ScheduleResponse;
  },

  /**
   * Get schedules by faculty
   */
  getByFaculty: async (facultyId: string, semester: string, academicYear: string) => {
    const response = await APIService.get(`schedules/faculty/${facultyId}?semester=${semester}&academicYear=${academicYear}`);
    return response.data as ScheduleListResponse;
  },

  /**
   * Get schedules by classroom
   */
  getByClassroom: async (classroomId: string, semester: string, academicYear: string) => {
    const response = await APIService.get(`schedules/classroom/${classroomId}?semester=${semester}&academicYear=${academicYear}`);
    return response.data as ScheduleListResponse;
  },

  /**
   * Create new schedule
   */
  create: async (scheduleData: ScheduleCreateData) => {
    const response = await APIService.post(scheduleData, "schedules");
    return response.data as ScheduleResponse;
  },

  /**
   * Update schedule
   */
  update: async (id: string, scheduleData: ScheduleUpdateData) => {
    const response = await APIService.put(scheduleData, `schedules/${id}`);
    return response.data as ScheduleResponse;
  },

  /**
   * Delete schedule
   */
  delete: async (id: string) => {
    const response = await APIService.delete(`schedules/${id}`);
    return response.data as { success: boolean; message: string };
  },

  /**
   * Get schedule statistics
   */
  getStats: async (params?: { semester?: string; academicYear?: string; status?: string }) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : "";

    const endpoint = queryString ? `schedules/stats?${queryString}` : "schedules/stats";
    const response = await APIService.get(endpoint);
    return response.data as ScheduleStatsResponse;
  },

  /**
   * Detect conflicts for a proposed schedule
   */
  detectConflicts: async (scheduleData: Partial<ScheduleCreateData>) => {
    const response = await APIService.post(scheduleData, "schedules/detect-conflicts");
    return response.data as ConflictDetectionResponse;
  },

  /**
   * Generate automated schedules (CORE FEATURE)
   */
  generateSchedules: async (request: ScheduleGenerationRequest) => {
    const response = await APIService.post(request, "schedules/generate");
    return response.data as ScheduleGenerationResponse;
  },

  /**
   * Publish schedules (bulk operation)
   */
  publishSchedules: async (scheduleIds: string[]) => {
    const response = await APIService.post({ scheduleIds }, "schedules/publish");
    return response.data as { success: boolean; message: string; count: number };
  },

  /**
   * Archive schedules for a semester
   */
  archiveSchedules: async (semester: string, academicYear: string) => {
    const response = await APIService.post({ semester, academicYear }, "schedules/archive");
    return response.data as { success: boolean; message: string; count: number };
  },
};

