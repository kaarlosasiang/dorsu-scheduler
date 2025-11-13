import { useState, useEffect } from "react";
import type { ISubject } from "@/components/forms/subjects/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
      const url = `${API_URL}/subjects${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if needed
          // "Authorization": `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch subjects");
      }

      setSubjects(result.data || []);
      return result.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch subjects";
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

