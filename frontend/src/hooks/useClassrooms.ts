"use client";

import { useState, useEffect, useCallback } from "react";
import { ClassroomAPI, type IClassroom, type ClassroomQueryParams } from "@/lib/services/ClassroomAPI";

interface UseClassroomsReturn {
  classrooms: IClassroom[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    totalCapacity: number;
    averageCapacity: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export function useClassrooms(params?: ClassroomQueryParams): UseClassroomsReturn {
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    totalCapacity: 0,
    averageCapacity: 0,
    byType: {},
    byStatus: {},
  });

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [classroomsResponse, statsResponse] = await Promise.all([
        ClassroomAPI.getAll(params),
        ClassroomAPI.getStats(),
      ]);

      if (classroomsResponse.success) {
        setClassrooms(classroomsResponse.data);
      } else {
        setError("Failed to fetch classrooms");
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch classrooms");
      console.error("Error fetching classrooms:", err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return {
    classrooms,
    loading,
    error,
    refetch: fetchClassrooms,
    stats
  };
}

