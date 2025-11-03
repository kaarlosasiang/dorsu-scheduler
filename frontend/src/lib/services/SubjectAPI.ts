import APIService from "./BaseAPI";

export interface ISubject {
  _id?: string;
  id?: string;
  subjectCode: string;
  subjectName: string;
  units: number;
  description?: string;
  course: string | any;
  department?: string | any;
  yearLevel?: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
  semester?: '1st Semester' | '2nd Semester' | 'Summer';
  isLaboratory?: boolean;
  prerequisites?: string[] | any[];
  createdAt?: string;
  updatedAt?: string;

  // Populated fields
  courseDetails?: any;
  departmentDetails?: any;
  prerequisiteDetails?: any[];
}

export interface SubjectListResponse {
  success: boolean;
  message: string;
  data: ISubject[];
  count: number;
}

export interface SubjectResponse {
  success: boolean;
  message: string;
  data: ISubject;
}

export interface SubjectStatsResponse {
  success: boolean;
  message: string;
  data: {
    totalSubjects: number;
    byCourse: Array<{
      course: string;
      courseName: string;
      count: number;
    }>;
    byDepartment: Array<{
      department: string;
      departmentName: string;
      count: number;
    }>;
    byYearLevel: Record<string, number>;
    bySemester: Record<string, number>;
    laboratoryCount: number;
    totalUnits: number;
    averageUnitsPerSubject: number;
  };
}

export interface SubjectQueryParams {
  course?: string;
  department?: string;
  yearLevel?: string;
  semester?: string;
  subjectCode?: string;
  subjectName?: string;
  isLaboratory?: boolean;
  sortBy?: 'subjectCode' | 'subjectName' | 'units' | 'yearLevel' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SubjectCreateData {
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

export interface SubjectUpdateData {
  subjectCode?: string;
  subjectName?: string;
  units?: number;
  description?: string;
  course?: string;
  department?: string;
  yearLevel?: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
  semester?: '1st Semester' | '2nd Semester' | 'Summer';
  isLaboratory?: boolean;
  prerequisites?: string[];
}

export const SubjectAPI = {
  /**
   * Get all subjects with optional filtering
   */
  async getAll(params?: SubjectQueryParams): Promise<SubjectListResponse> {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
      const endpoint = queryString ? `/subjects?${queryString}` : '/subjects';
      const response = await APIService.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get subject by ID
   */
  async getById(id: string): Promise<SubjectResponse> {
    try {
      const response = await APIService.get(`/subjects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get subjects by course
   */
  async getByCourse(courseId: string): Promise<SubjectListResponse> {
    try {
      const response = await APIService.get(`/subjects/course/${courseId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get subjects by year level and semester
   */
  async getByYearAndSemester(
    courseId: string,
    yearLevel: string,
    semester: string
  ): Promise<SubjectListResponse> {
    try {
      const response = await APIService.get(
        `/subjects?course=${courseId}&yearLevel=${yearLevel}&semester=${semester}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get subject statistics
   */
  async getStats(params?: {
    course?: string;
    department?: string;
    yearLevel?: string;
    semester?: string;
  }): Promise<SubjectStatsResponse> {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
      const endpoint = queryString ? `/subjects/stats?${queryString}` : '/subjects/stats';
      const response = await APIService.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new subject
   */
  async create(data: SubjectCreateData): Promise<SubjectResponse> {
    try {
      const response = await APIService.post(data, '/subjects');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a subject
   */
  async update(id: string, data: SubjectUpdateData): Promise<SubjectResponse> {
    try {
      const response = await APIService.put(data, `/subjects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a subject
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await APIService.delete(`/subjects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Bulk create subjects (helper for curriculum setup)
   */
  async bulkCreate(subjects: SubjectCreateData[]): Promise<{
    success: boolean;
    message: string;
    created: number;
    failed: number;
    errors?: any[];
  }> {
    try {
      const results = {
        success: true,
        message: '',
        created: 0,
        failed: 0,
        errors: [] as any[]
      };

      for (const subject of subjects) {
        try {
          await this.create(subject);
          results.created++;
        } catch (error) {
          results.failed++;
          results.errors.push({ subject: subject.subjectCode, error });
        }
      }

      results.success = results.failed === 0;
      results.message = `Created ${results.created} subjects${results.failed > 0 ? `, ${results.failed} failed` : ''}`;

      return results;
    } catch (error) {
      throw error;
    }
  }
};

export default SubjectAPI;

