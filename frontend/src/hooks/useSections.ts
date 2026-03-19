import { useState, useEffect } from "react";
import SectionAPI, { ISection, SectionQueryParams } from "@/lib/services/SectionAPI";

interface UseSections {
    sections: ISection[];
    loading: boolean;
    error: string | null;
    refetch: (params?: SectionQueryParams) => Promise<void>;
    createSection: (data: { program: string; yearLevel: string; sectionCode: string; capacity?: number }) => Promise<ISection>;
    updateSection: (id: string, data: { sectionCode?: string; capacity?: number; status?: 'active' | 'inactive' }) => Promise<ISection>;
    deleteSection: (id: string) => Promise<void>;
}

export const useSections = (params?: SectionQueryParams): UseSections => {
    const [sections, setSections] = useState<ISection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSections = async (queryParams?: SectionQueryParams) => {
        try {
            setLoading(true);
            setError(null);
            const response = await SectionAPI.getAll(queryParams);
            setSections(response.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch sections");
        } finally {
            setLoading(false);
        }
    };

    const createSection = async (data: { program: string; yearLevel: string; sectionCode: string; capacity?: number }) => {
        const response = await SectionAPI.create(data);
        await fetchSections(params);
        return response.data;
    };

    const updateSection = async (id: string, data: { sectionCode?: string; capacity?: number; status?: 'active' | 'inactive' }) => {
        const response = await SectionAPI.update(id, data);
        await fetchSections(params);
        return response.data;
    };

    const deleteSection = async (id: string) => {
        await SectionAPI.delete(id);
        await fetchSections(params);
    };

    useEffect(() => {
        fetchSections(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { sections, loading, error, refetch: fetchSections, createSection, updateSection, deleteSection };
};
