"use client";

import { useState } from "react";
import { DepartmentAPI } from "@/lib/services/DepartmentAPI";
import type { DepartmentFormData } from "./types";

export function useDepartmentForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDepartment = async (data: DepartmentFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await DepartmentAPI.create({
        name: data.name,
        code: data.code,
        description: data.description || undefined,
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create department";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDepartment = async (id: string, data: DepartmentFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await DepartmentAPI.update(id, {
        name: data.name,
        code: data.code,
        description: data.description || undefined,
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update department";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createDepartment,
    updateDepartment,
    loading,
    error,
  };
}

