import { useState, useEffect } from "react";
import type { ISubject } from "@/components/forms/subjects/types";
import APIService from "@/lib/services/BaseAPI";

interface UseSubjectsOptions {
  course?: string;
  department?: string;
  yearLevel?: string;
  semester?: string;
  autoFetch?: boolean;
}

export function useSubjects(options: UseSubjectsOptions = {}) {
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { course, department, yearLevel, semester, autoFetch = true } = options;

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (course) params.append("course", course);
      if (department) params.append("department", department);
      if (yearLevel) params.append("yearLevel", yearLevel);
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
  }, [course, department, yearLevel, semester, autoFetch]);

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects,
  };
}

