import { useState, useEffect } from "react";
import CourseAPI, { ICourse, CourseQueryParams } from "@/lib/services/CourseAPI";

interface UseCourses {
  courses: ICourse[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    totalUnits: number;
    byDepartment: Array<{
      department: string;
      count: number;
    }>;
  };
  refetch: (params?: CourseQueryParams) => Promise<void>;
}

export const useCourses = (params?: CourseQueryParams): UseCourses => {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    totalUnits: 0,
    byDepartment: [] as Array<{
      department: string;
      count: number;
    }>,
  });

  const fetchCourses = async (queryParams?: CourseQueryParams) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch courses
      const response = await CourseAPI.getAll(queryParams);
      setCourses(response.data || []);

      // Fetch stats
      try {
        const statsResponse = await CourseAPI.getStats();
        setStats(statsResponse.data || {
          total: 0,
          totalUnits: 0,
          byDepartment: [],
        });
      } catch (statsError) {
        console.warn("Failed to fetch course stats:", statsError);
        // Calculate basic stats from courses
        setStats({
          total: response.data?.length || 0,
          totalUnits: response.data?.reduce((sum, course) => sum + (course.units || 0), 0) || 0,
          byDepartment: [],
        });
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(params);
  }, []);

  return {
    courses,
    loading,
    error,
    stats,
    refetch: fetchCourses,
  };
};

