import APIService from "./BaseAPI";
import APP_CONFIG from "@/config";

export interface IName {
  first: string;
  middle?: string;
  last: string;
  ext?: string;
}

export interface IFaculty {
  _id?: string;
  id?: string;
  name: IName;
  email: string;
  department: string | {
    _id: string;
    name: string;
    code: string;
    college?: string;
    status?: string;
  };
  employmentType: "full-time" | "part-time";
  image?: string;
  minLoad: number;
  maxLoad: number;
  currentLoad: number;
  maxPreparations: number;
  currentPreparations: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
  availableLoad?: number;
  availablePreparations?: number;
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
    fullTime: number;
    partTime: number;
    totalWorkload: number;
    averageWorkload: number;
    totalPreparations: number;
    averagePreparations: number;
    departments: string[];
  };
}

export interface FacultyQueryParams {
  department?: string;
  status?: "active" | "inactive";
  employmentType?: "full-time" | "part-time";
  email?: string;
  page?: number;
  limit?: number;
}

export interface FacultyCreateData {
  name: IName;
  email: string;
  department: string;
  employmentType: "full-time" | "part-time";
  image?: string;
  minLoad: number;
  maxLoad: number;
  status: "active" | "inactive";
}

export interface FacultyUpdateData {
  name?: IName;
  email?: string;
  department?: string;
  employmentType?: "full-time" | "part-time";
  image?: string;
  minLoad?: number;
  maxLoad?: number;
  status?: "active" | "inactive";
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
   * Get faculty by email
   */
  getByEmail: async (email: string) => {
    return await FacultyAPI.getAll({ email });
  },

  /**
   * Create new faculty
   */
  create: async (facultyData: FacultyCreateData) => {
    const response = await APIService.post(facultyData, APP_CONFIG.ENDPOINTS.FACULTY.BASE);
    return response.data as FacultyResponse;
  },

  /**
   * Update faculty
   */
  update: async (id: string, facultyData: FacultyUpdateData) => {
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
   * Update faculty availability
   */
  updateAvailability: async (id: string, availabilityData: any) => {
    // For now, use the general update endpoint
    // This should be replaced with a specific availability endpoint when backend supports it
    const response = await APIService.patch(availabilityData, `${APP_CONFIG.ENDPOINTS.FACULTY.BASE}/${id}/availability`);
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
   * Get faculty by employment type
   */
  getByEmploymentType: async (employmentType: "full-time" | "part-time") => {
    return await FacultyAPI.getAll({ employmentType, status: "active" });
  },

  /**
   * Search faculty by name or email
   */
  search: async (query: string) => {
    // This would require a search endpoint on the backend
    // For now, we'll get all faculty and filter on frontend
    const response = await FacultyAPI.getAll();
    const filteredFaculty = response.data.filter(faculty => {
      const fullName = `${faculty.name.first} ${faculty.name.middle || ''} ${faculty.name.last} ${faculty.name.ext || ''}`.toLowerCase();
      const departmentName = typeof faculty.department === 'string' 
        ? faculty.department 
        : faculty.department.name;
      
      return fullName.includes(query.toLowerCase()) ||
             faculty.email.toLowerCase().includes(query.toLowerCase()) ||
             departmentName.toLowerCase().includes(query.toLowerCase());
    });
    
    return {
      ...response,
      data: filteredFaculty,
      count: filteredFaculty.length,
    };
  },
};