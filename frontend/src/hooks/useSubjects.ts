import { useState, useEffect } from "react";
import type { ISubject } from "@/components/forms/subjects/types";
import APIService from "@/lib/services/BaseAPI";

interface UseSubjectsOptions {
  courseId?: string;
  department?: string;
  semester?: string;
  autoFetch?: boolean;
}

export function useSubjects(options: UseSubjectsOptions = {}) {
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { courseId, department, semester, autoFetch = true } = options;

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (courseId) params.append("courseId", courseId);
      if (department) params.append("department", department);
      if (semester) params.append("semester", semester);

      const queryString = params.toString();
      const endpoint = `/subjects${queryString ? `?${queryString}` : ""}`;

      const response = await APIService.get(endpoint);

      if (response.data?.success) {
        setSubjects(response.data.data || []);
        return response.data.data || [];
      } else {
        throw new Error(response.data?.message || "Failed to fetch subjects");
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch subjects";
      setError(errorMessage);
      setSubjects([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchSubjects();
    }
  }, [courseId, department, semester, autoFetch]);

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects,
  };
}

