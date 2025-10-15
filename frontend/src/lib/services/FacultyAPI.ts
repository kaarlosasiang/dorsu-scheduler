import APIService from "./BaseAPI";
import APP_CONFIG from "@/config";

export interface IAvailability {
  day: string;
  startTime: string;
  endTime: string;
}

export interface IFaculty {
  _id?: string;
  name: string;
  department: string;
  availability?: IAvailability[];
  maxLoad?: number;
  currentLoad?: number;
  status?: "active" | "inactive";
  createdAt?: Date;
}

export interface FacultyListResponse {
  success: boolean;
  message: string;
  data: IFaculty[];
  count: number;
}

export interface FacultyResponse {
  success: boolean;
  message: string;
  data: IFaculty;
}

export interface FacultyStatsResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    active: number;
    inactive: number;
    totalWorkload: number;
    averageWorkload: number;
    departments: string[];
  };
}

export interface FacultyQueryParams {
  department?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}

export interface WorkloadUpdate {
  hours: number;
}

export interface StatusUpdate {
  status: "active" | "inactive";
}

export const FacultyAPI = {
  /**
   * Get all faculty with optional filtering
   */
  getAll: async (params?: FacultyQueryParams) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : "";
    
    const endpoint = queryString ? `${APP_CONFIG.ENDPOINTS.FACULTY.BASE}?${queryString}` : APP_CONFIG.ENDPOINTS.FACULTY.BASE;
    const response = await APIService.get(endpoint);
    return response.data as FacultyListResponse;
  },

  /**
   * Get faculty by ID
   */
  getById: async (id: string) => {
    const response = await APIService.get(`${APP_CONFIG.ENDPOINTS.FACULTY.BASE}/${id}`);
    return response.data as FacultyResponse;
  },

  /**
   * Create new faculty
   */
  create: async (facultyData: Omit<IFaculty, "_id" | "createdAt">) => {
    const response = await APIService.post(facultyData, APP_CONFIG.ENDPOINTS.FACULTY.BASE);
    return response.data as FacultyResponse;
  },

  /**
   * Update faculty
   */
  update: async (id: string, facultyData: Partial<Omit<IFaculty, "_id" | "createdAt">>) => {
    const response = await APIService.put(facultyData, `${APP_CONFIG.ENDPOINTS.FACULTY.BASE}/${id}`);
    return response.data as FacultyResponse;
  },

  /**
   * Delete faculty
   */
  delete: async (id: string) => {
    const response = await APIService.remove(`${APP_CONFIG.ENDPOINTS.FACULTY.BASE}/${id}`);
    return response.data;
  },

  /**
   * Update faculty availability
   */
  updateAvailability: async (id: string, availability: IAvailability[]) => {
    const response = await APIService.patch(availability, APP_CONFIG.ENDPOINTS.FACULTY.AVAILABILITY(id));
    return response.data as FacultyResponse;
  },

  /**
   * Update faculty workload
   */
  updateWorkload: async (id: string, workloadData: WorkloadUpdate) => {
    const response = await APIService.patch(workloadData, APP_CONFIG.ENDPOINTS.FACULTY.WORKLOAD(id));
    return response.data as FacultyResponse;
  },

  /**
   * Update faculty status
   */
  updateStatus: async (id: string, statusData: StatusUpdate) => {
    const response = await APIService.patch(statusData, APP_CONFIG.ENDPOINTS.FACULTY.STATUS(id));
    return response.data as FacultyResponse;
  },

  /**
   * Get faculty statistics
   */
  getStats: async (department?: string) => {
    const endpoint = department 
      ? `${APP_CONFIG.ENDPOINTS.FACULTY.STATS}?department=${encodeURIComponent(department)}`
      : APP_CONFIG.ENDPOINTS.FACULTY.STATS;
    
    const response = await APIService.get(endpoint);
    return response.data as FacultyStatsResponse;
  },

  /**
   * Get faculty by department
   */
  getByDepartment: async (department: string) => {
    return await FacultyAPI.getAll({ department, status: "active" });
  },

  /**
   * Get active faculty only
   */
  getActive: async () => {
    return await FacultyAPI.getAll({ status: "active" });
  },

  /**
   * Search faculty by name
   */
  search: async (query: string) => {
    // This would require a search endpoint on the backend
    // For now, we'll get all faculty and filter on frontend
    const response = await FacultyAPI.getAll();
    const filteredFaculty = response.data.filter(faculty =>
      faculty.name.toLowerCase().includes(query.toLowerCase()) ||
      faculty.department.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      ...response,
      data: filteredFaculty,
      count: filteredFaculty.length,
    };
  },
};