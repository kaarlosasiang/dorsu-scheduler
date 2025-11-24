import { useState } from "react";
import { SubjectFormData, SubjectResponse } from "./types";
import SubjectAPI from "@/lib/services/SubjectAPI";

export function useSubjectForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubject = async (data: SubjectFormData): Promise<SubjectResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Transform data before sending - remove empty strings and computed fields
      const payload = {
        subjectCode: data.subjectCode.trim().toUpperCase(),
        subjectName: data.subjectName.trim(),
        lectureUnits: data.lectureUnits,
        labUnits: data.labUnits,
        description: data.description || undefined,
        course: data.course,
        department: data.department || undefined,
        yearLevel: data.yearLevel || null,
        semester: data.semester || null,
        prerequisites: data.prerequisites || [],
      };

      const result = await SubjectAPI.create(payload as any);
      return result as SubjectResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create subject";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSubject = async (id: string, data: SubjectFormData): Promise<SubjectResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Transform data before sending - remove empty strings and computed fields
      const payload = {
        subjectCode: data.subjectCode.trim().toUpperCase(),
        subjectName: data.subjectName.trim(),
        lectureUnits: data.lectureUnits,
        labUnits: data.labUnits,
        description: data.description || undefined,
        course: data.course,
        department: data.department || undefined,
        yearLevel: data.yearLevel || null,
        semester: data.semester || null,
        prerequisites: data.prerequisites || [],
      };

      const result = await SubjectAPI.update(id, payload as any);
      return result as SubjectResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update subject";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (id: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);

    try {
      const result = await SubjectAPI.delete(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete subject";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSubject,
    updateSubject,
    deleteSubject,
    loading,
    error,
  };
}

