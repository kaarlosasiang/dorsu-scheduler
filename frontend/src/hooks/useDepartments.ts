"use client";

import { useState, useEffect, useCallback } from "react";
import { DepartmentAPI, type IDepartment, type DepartmentQueryParams } from "@/lib/services/DepartmentAPI";

interface UseDepartmentsReturn {
  departments: IDepartment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    totalCourses: number;
  };
}

export function useDepartments(params?: DepartmentQueryParams): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    totalCourses: 0,
  });

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [departmentsResponse, statsResponse] = await Promise.all([
        DepartmentAPI.getAll(params),
        DepartmentAPI.getStats(),
      ]);

      if (departmentsResponse.success) {
        setDepartments(departmentsResponse.data);
      } else {
        setError("Failed to fetch departments");
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch departments");
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    refetch: fetchDepartments,
    stats
  };
}

