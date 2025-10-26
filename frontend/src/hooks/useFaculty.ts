"use client";

import { useState, useEffect, useCallback } from "react";
import { FacultyAPI, type IFaculty, type FacultyQueryParams } from "@/lib/services/FacultyAPI";

interface UseFacultyOptions {
  autoFetch?: boolean;
}

interface FacultyStats {
  total: number;
  active: number;
  inactive: number;
  departments: string[];
  avgWorkload: number;
  avgSalary?: number;
  fullTime: number;
  partTime: number;
}

export function useFaculty(options: UseFacultyOptions = {}) {
  const { autoFetch = true } = options;
  
  const [faculties, setFaculties] = useState<IFaculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<FacultyStats>({
    total: 0,
    active: 0,
    inactive: 0,
    departments: [],
    avgWorkload: 0,
    fullTime: 0,
    partTime: 0,
  });

  // Calculate stats from faculty data
  const calculateStats = useCallback((facultyData: IFaculty[]): FacultyStats => {
    const active = facultyData.filter(f => f.status === "active").length;
    const inactive = facultyData.filter(f => f.status === "inactive").length;
    const fullTime = facultyData.filter(f => f.employmentType === "full-time").length;
    const partTime = facultyData.filter(f => f.employmentType === "part-time").length;
    
    const departments = [...new Set(facultyData.map(f => 
      typeof f.department === 'string' ? f.department : f.department.name
    ))];
    
    const avgWorkload = facultyData.length > 0 
      ? facultyData.reduce((sum, f) => sum + (f.currentLoad || 0), 0) / facultyData.length
      : 0;

    return {
      total: facultyData.length,
      active,
      inactive,
      departments,
      avgWorkload,
      fullTime,
      partTime,
    };
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Fetch faculty data
  const fetchFaculties = useCallback(async (params: FacultyQueryParams = {}) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await FacultyAPI.getAll(params);
      setFaculties(response.data);
      setTotalCount(response.count || response.data.length);
      setStats(calculateStats(response.data));
    } catch (err: any) {
      console.error("Fetch faculties error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch faculties";
      setError(errorMessage);
      setFaculties([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats]);

  // Refresh data
  const refresh = useCallback(() => {
    return fetchFaculties({});
  }, [fetchFaculties]);

  // Search faculties
  const searchFaculties = useCallback(async (query: string) => {
    if (!query.trim()) {
      return fetchFaculties({});
    }
    
    setIsLoading(true);
    setError("");

    try {
      const response = await FacultyAPI.search(query);
      setFaculties(response.data);
      setTotalCount(response.count || response.data.length);
      setStats(calculateStats(response.data));
    } catch (err: any) {
      console.error("Search faculties error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to search faculties";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFaculties, calculateStats]);

  // Get faculty by department
  const getFacultyByDepartment = useCallback(async (department: string) => {
    return fetchFaculties({ department });
  }, [fetchFaculties]);

  // Get faculty by employment type
  const getFacultyByEmploymentType = useCallback(async (employmentType: "full-time" | "part-time") => {
    return fetchFaculties({ employmentType });
  }, [fetchFaculties]);

  // Get faculty by status
  const getFacultyByStatus = useCallback(async (status: "active" | "inactive") => {
    return fetchFaculties({ status });
  }, [fetchFaculties]);

  // Delete faculty
  const deleteFaculty = useCallback(async (id: string) => {
    try {
      await FacultyAPI.delete(id);
      // Refresh the list after deletion
      await refresh();
      return true;
    } catch (err: any) {
      console.error("Delete faculty error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete faculty";
      setError(errorMessage);
      return false;
    }
  }, [refresh]);

  // Update faculty status
  const updateFacultyStatus = useCallback(async (id: string, status: "active" | "inactive") => {
    try {
      await FacultyAPI.updateStatus(id, { status });
      // Refresh the list after update
      await refresh();
      return true;
    } catch (err: any) {
      console.error("Update faculty status error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update faculty status";
      setError(errorMessage);
      return false;
    }
  }, [refresh]);

  // Clear error
  const clearError = useCallback(() => {
    setError("");
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      // Call fetchFaculties directly without depending on the callback
      const fetchInitialData = async () => {
        setIsLoading(true);
        setError("");

        try {
          const response = await FacultyAPI.getAll({});
          setFaculties(response.data);
          setTotalCount(response.count || response.data.length);
          setStats(calculateStats(response.data));
        } catch (err: any) {
          console.error("Fetch faculties error:", err);
          const errorMessage = err.response?.data?.message || err.message || "Failed to fetch faculties";
          setError(errorMessage);
          setFaculties([]);
          setTotalCount(0);
        } finally {
          setIsLoading(false);
        }
      };

      fetchInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only depend on autoFetch, not on the callbacks or params

  return {
    // Data
    faculties,
    totalCount,
    stats,
    
    // State
    isLoading,
    error,
    
    // Actions
    fetchFaculties,
    refresh,
    searchFaculties,
    getFacultyByDepartment,
    getFacultyByEmploymentType,
    getFacultyByStatus,
    deleteFaculty,
    updateFacultyStatus,
    clearError,
  };
}