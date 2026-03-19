import APIService from "./BaseAPI";

export interface ISection {
    _id?: string;
    id?: string;
    program: string | { _id?: string; id?: string; courseCode: string; courseName: string };
    yearLevel: string;
    sectionCode: string;
    name: string;
    capacity?: number;
    status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
}

export interface SectionListResponse {
    success: boolean;
    message: string;
    data: ISection[];
    count: number;
}

export interface SectionResponse {
    success: boolean;
    message: string;
    data: ISection;
}

export interface SectionCreateData {
    program: string;
    yearLevel: string;
    sectionCode: string;
    capacity?: number;
    status?: 'active' | 'inactive';
}

export interface SectionUpdateData {
    sectionCode?: string;
    capacity?: number;
    status?: 'active' | 'inactive';
}

export interface SectionQueryParams {
    program?: string;
    yearLevel?: string;
    status?: string;
}

const SectionAPI = {
    getAll: async (params?: SectionQueryParams) => {
        const queryString = params
            ? new URLSearchParams(
                  Object.entries(params).reduce((acc, [key, value]) => {
                      if (value !== undefined) acc[key] = String(value);
                      return acc;
                  }, {} as Record<string, string>)
              ).toString()
            : "";
        const endpoint = queryString ? `/sections?${queryString}` : '/sections';
        const response = await APIService.get(endpoint);
        return response.data as SectionListResponse;
    },

    getById: async (id: string) => {
        const response = await APIService.get(`/sections/${id}`);
        return response.data as SectionResponse;
    },

    getByProgram: async (programId: string) => {
        const response = await APIService.get(`/sections/program/${programId}`);
        return response.data as SectionListResponse;
    },

    getByProgramAndYearLevel: async (programId: string, yearLevel: string) => {
        const encoded = encodeURIComponent(yearLevel);
        const response = await APIService.get(`/sections/program/${programId}/year/${encoded}`);
        return response.data as SectionListResponse;
    },

    create: async (data: SectionCreateData) => {
        const response = await APIService.post(data, '/sections');
        return response.data as SectionResponse;
    },

    update: async (id: string, data: SectionUpdateData) => {
        const response = await APIService.put(data, `/sections/${id}`);
        return response.data as SectionResponse;
    },

    delete: async (id: string) => {
        const response = await APIService.delete(`/sections/${id}`);
        return response.data as { success: boolean; message: string };
    },
};

export default SectionAPI;
