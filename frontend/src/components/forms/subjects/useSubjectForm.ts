import { useState } from "react";
import { SubjectFormData, SubjectResponse } from "./types";
import SubjectAPI from "@/lib/services/SubjectAPI";

type CourseOffering = { course: string; yearLevel?: string | null };

export function useSubjectForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubject = async (
    data: SubjectFormData & { courseOfferings?: CourseOffering[] },
  ): Promise<SubjectResponse> => {
    setLoading(true);
    setError(null);

    try {
      const courseOfferings: CourseOffering[] = data.courseOfferings ?? (
        data.course ? [{ course: data.course, yearLevel: data.yearLevel || null }] : []
      );

      const payload = {
        subjectCode: data.subjectCode.trim().toUpperCase(),
        subjectName: data.subjectName.trim(),
        lectureUnits: data.lectureUnits,
        labUnits: data.labUnits,
        description: data.description || undefined,
        courseOfferings,
        department: data.department || undefined,
        semester: (data.semester || undefined) as any,
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

  const updateSubject = async (
    id: string,
    data: SubjectFormData & { courseOfferings?: CourseOffering[] },
  ): Promise<SubjectResponse> => {
    setLoading(true);
    setError(null);

    try {
      const courseOfferings: CourseOffering[] = data.courseOfferings ?? (
        data.course ? [{ course: data.course, yearLevel: data.yearLevel || null }] : []
      );

      const payload = {
        subjectCode: data.subjectCode.trim().toUpperCase(),
        subjectName: data.subjectName.trim(),
        lectureUnits: data.lectureUnits,
        labUnits: data.labUnits,
        description: data.description || undefined,
        courseOfferings,
        department: data.department || undefined,
        semester: (data.semester || undefined) as any,
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

