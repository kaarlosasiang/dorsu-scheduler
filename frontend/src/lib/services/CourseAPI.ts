import APIService from "./BaseAPI";

export interface ICourse {
    _id?: string;
    id?: string;
    courseCode: string;
    courseName: string;
    units: number;
    department: { name: string, code: string, id: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface CourseListResponse {
    success: boolean;
    message: string;
    data: ICourse[];
    count: number;
}

export interface CourseResponse {
    success: boolean;
    message: string;
    data: ICourse;
}

export interface CourseStatsResponse {
    success: boolean;
    message: string;
    data: {
        total: number;
        totalUnits: number;
        byDepartment: Array<{
            department: string;
            count: number;
        }>;
    };
}

export interface CourseQueryParams {
    courseCode?: string;
    courseName?: string;
    department?: string;
    page?: number;
    limit?: number;
    sortBy?: 'courseCode' | 'courseName' | 'units' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface CourseCreateData {
    courseCode: string;
    courseName: string;
    units: number;
    department: string;
}

export interface CourseUpdateData {
    courseCode?: string;
    courseName?: string;
    units?: number;
    department?: string;
}

const CourseAPI = {
    /**
     * Get all courses with optional filtering
     */
    getAll: async (params?: CourseQueryParams) => {
        const queryString = params ? new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = String(value);
                }
                return acc;
            }, {} as Record<string, string>)
        ).toString() : "";

        const endpoint = queryString ? `/courses?${queryString}` : '/courses';
        const response = await APIService.get(endpoint);
        return response.data as CourseListResponse;
    },

    /**
     * Get course by ID
     */
    getById: async (id: string) => {
        const response = await APIService.get(`/courses/${id}`);
        return response.data as CourseResponse;
    },

    /**
     * Get course by code
     */
    getByCode: async (code: string, department?: string) => {
        const endpoint = department
            ? `/courses/code/${code}?department=${department}`
            : `/courses/code/${code}`;
        const response = await APIService.get(endpoint);
        return response.data as CourseResponse;
    },

    /**
     * Get courses by department
     */
    getByDepartment: async (departmentId: string) => {
        const response = await APIService.get(`/courses/department/${departmentId}`);
        return response.data as CourseListResponse;
    },

    /**
     * Create a new course
     */
    create: async (data: CourseCreateData) => {
        const response = await APIService.post(data, '/courses');
        return response.data as CourseResponse;
    },

    /**
     * Update a course
     */
    update: async (id: string, data: CourseUpdateData) => {
        const response = await APIService.put(data, `/courses/${id}`);
        return response.data as CourseResponse;
    },

    /**
     * Delete a course
     */
    delete: async (id: string) => {
        const response = await APIService.delete(`/courses/${id}`);
        return response.data as { success: boolean; message: string };
    },

    /**
     * Get course statistics
     */
    getStats: async () => {
        const response = await APIService.get('/courses/stats');
        return response.data as CourseStatsResponse;
    },
};

export default CourseAPI;


