import APIService from "./BaseAPI";
import APP_CONFIG from "@/config";

export interface IClassroom {
  _id?: string;
  id?: string;
  roomNumber: string;
  building?: string;
  capacity: number;
  type?: 'lecture' | 'laboratory' | 'computer-lab' | 'conference' | 'other';
  facilities?: string[];
  status?: 'available' | 'maintenance' | 'reserved';
  createdAt?: string;
  updatedAt?: string;
  displayName?: string;
}

export interface ClassroomListResponse {
  success: boolean;
  message: string;
  data: IClassroom[];
  count: number;
}

export interface ClassroomResponse {
  success: boolean;
  message: string;
  data: IClassroom;
}

export interface ClassroomStatsResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    totalCapacity: number;
    averageCapacity: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export interface ClassroomQueryParams {
  roomNumber?: string;
  building?: string;
  type?: 'lecture' | 'laboratory' | 'computer-lab' | 'conference' | 'other';
  status?: 'available' | 'maintenance' | 'reserved';
  minCapacity?: number;
  maxCapacity?: number;
}

export interface ClassroomCreateData {
  roomNumber: string;
  building?: string;
  capacity: number;
  type?: 'lecture' | 'laboratory' | 'computer-lab' | 'conference' | 'other';
  facilities?: string[];
  status?: 'available' | 'maintenance' | 'reserved';
}

export interface ClassroomUpdateData {
  roomNumber?: string;
  building?: string;
  capacity?: number;
  type?: 'lecture' | 'laboratory' | 'computer-lab' | 'conference' | 'other';
  facilities?: string[];
  status?: 'available' | 'maintenance' | 'reserved';
}

export const ClassroomAPI = {
  /**
   * Get all classrooms with optional filtering
   */
  getAll: async (params?: ClassroomQueryParams) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : "";

    const endpoint = queryString ? `${APP_CONFIG.ENDPOINTS.CLASSROOMS.BASE}?${queryString}` : APP_CONFIG.ENDPOINTS.CLASSROOMS.BASE;
    const response = await APIService.get(endpoint);
    return response.data as ClassroomListResponse;
  },

  /**
   * Get classroom by ID
   */
  getById: async (id: string) => {
    const response = await APIService.get(`${APP_CONFIG.ENDPOINTS.CLASSROOMS.BASE}/${id}`);
    return response.data as ClassroomResponse;
  },

  /**
   * Get available classrooms
   */
  getAvailable: async () => {
    const response = await APIService.get(APP_CONFIG.ENDPOINTS.CLASSROOMS.AVAILABLE);
    return response.data as ClassroomListResponse;
  },

  /**
   * Create new classroom
   */
  create: async (classroomData: ClassroomCreateData) => {
    const response = await APIService.post(classroomData, APP_CONFIG.ENDPOINTS.CLASSROOMS.BASE);
    return response.data as ClassroomResponse;
  },

  /**
   * Update classroom
   */
  update: async (id: string, classroomData: ClassroomUpdateData) => {
    const response = await APIService.put(classroomData, `${APP_CONFIG.ENDPOINTS.CLASSROOMS.BASE}/${id}`);
    return response.data as ClassroomResponse;
  },

  /**
   * Delete classroom
   */
  delete: async (id: string) => {
    const response = await APIService.delete(`${APP_CONFIG.ENDPOINTS.CLASSROOMS.BASE}/${id}`);
    return response.data as { success: boolean; message: string };
  },

  /**
   * Get classroom statistics
   */
  getStats: async () => {
    const response = await APIService.get(`${APP_CONFIG.ENDPOINTS.CLASSROOMS.BASE}/stats`);
    return response.data as ClassroomStatsResponse;
  },

  /**
   * Check if classroom exists
   */
  exists: async (id: string) => {
    try {
      await ClassroomAPI.getById(id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

