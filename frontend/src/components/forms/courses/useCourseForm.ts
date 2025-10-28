"use client";

import { useState } from "react";
import CourseAPI from "@/lib/services/CourseAPI";
import type { CourseFormData } from "./types";

export function useCourseForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourse = async (data: CourseFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await CourseAPI.create({
        courseCode: data.courseCode,
        courseName: data.courseName,
        units: data.units,
        department: data.department,
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create course";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (id: string, data: CourseFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await CourseAPI.update(id, {
        courseCode: data.courseCode,
        courseName: data.courseName,
        units: data.units,
        department: data.department,
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update course";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCourse,
    updateCourse,
    loading,
    error,
  };
}

