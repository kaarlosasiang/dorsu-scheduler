import APIService from "./BaseAPI";
import APP_CONFIG from "@/config";

export interface IDepartment {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  description?: string;
  courses?: string[]; // Array of Course IDs
  createdAt?: string;
  updatedAt?: string;
  facultyCount?: number;
  coursesCount?: number;
}

export interface DepartmentListResponse {
  success: boolean;
  message: string;
  data: IDepartment[];
  count: number;
}

export interface DepartmentResponse {
  success: boolean;
  message: string;
  data: IDepartment;
}

export interface DepartmentStatsResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    totalCourses: number;
  };
}

export interface DepartmentQueryParams {
  name?: string;
  code?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DepartmentCreateData {
  name: string;
  code?: string; // Optional - will be auto-generated if not provided
  description?: string;
  courses?: string[];
}

export interface DepartmentUpdateData {
  name?: string;
  code?: string;
  description?: string;
  courses?: string[];
}

export const DepartmentAPI = {
  /**
   * Get all departments with optional filtering
   */
  getAll: async (params?: DepartmentQueryParams) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : "";

    const endpoint = queryString ? `${APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE}?${queryString}` : APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE;
    const response = await APIService.get(endpoint);
    return response.data as DepartmentListResponse;
  },

  /**
   * Get department by ID
   */
  getById: async (id: string) => {
    const response = await APIService.get(`${APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE}/${id}`);
    return response.data as DepartmentResponse;
  },

  /**
   * Get department by code
   */
  getByCode: async (code: string) => {
    const response = await APIService.get(`${APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE}/code/${code}`);
    return response.data as DepartmentResponse;
  },

  /**
   * Create new department
   */
  create: async (departmentData: DepartmentCreateData) => {
    const response = await APIService.post(departmentData, APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE);
    return response.data as DepartmentResponse;
  },

  /**
   * Update department
   */
  update: async (id: string, departmentData: DepartmentUpdateData) => {
    const response = await APIService.put(departmentData, `${APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE}/${id}`);
    return response.data as DepartmentResponse;
  },

  /**
   * Delete department
   */
  delete: async (id: string) => {
    const response = await APIService.delete(`${APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE}/${id}`);
    return response.data as { success: boolean; message: string };
  },

  /**
   * Get department statistics
   */
  getStats: async () => {
    const response = await APIService.get(`${APP_CONFIG.ENDPOINTS.DEPARTMENTS.BASE}/stats`);
    return response.data as DepartmentStatsResponse;
  },

  /**
   * Check if department exists
   */
  exists: async (id: string) => {
    try {
      await DepartmentAPI.getById(id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

