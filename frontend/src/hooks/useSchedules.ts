"use client";

import { useState, useEffect, useCallback } from "react";
import { ScheduleAPI, type ISchedule, type ScheduleQueryParams } from "@/lib/services/ScheduleAPI";

interface UseSchedulesReturn {
  schedules: ISchedule[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    published: number;
    draft: number;
    generated: number;
    manual: number;
    byDepartment: Array<{
      _id: string;
      name: string;
      code: string;
      count: number;
    }>;
  };
}

export function useSchedules(params?: ScheduleQueryParams): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<ISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    published: number;
    draft: number;
    generated: number;
    manual: number;
    byDepartment: Array<{
      _id: string;
      name: string;
      code: string;
      count: number;
    }>;
  }>({
    total: 0,
    published: 0,
    draft: 0,
    generated: 0,
    manual: 0,
    byDepartment: [],
  });

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [schedulesResponse, statsResponse] = await Promise.all([
        ScheduleAPI.getAll(params),
        ScheduleAPI.getStats(params ? {
          semester: params.semester,
          academicYear: params.academicYear,
          status: params.status
        } : {}),
      ]);

      if (schedulesResponse.success) {
        setSchedules(schedulesResponse.data);
      } else {
        setError("Failed to fetch schedules");
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schedules");
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
    stats
  };
}

