"use client";

import { useState } from "react";
import { ClassroomAPI } from "@/lib/services/ClassroomAPI";
import type { ClassroomFormData } from "./types";

export function useClassroomForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClassroom = async (data: ClassroomFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ClassroomAPI.create({
        roomNumber: data.roomNumber,
        building: data.building || undefined,
        capacity: data.capacity,
        type: data.type,
        facilities: data.facilities,
        status: data.status,
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create classroom";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClassroom = async (id: string, data: ClassroomFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ClassroomAPI.update(id, {
        roomNumber: data.roomNumber,
        building: data.building || undefined,
        capacity: data.capacity,
        type: data.type,
        facilities: data.facilities,
        status: data.status,
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update classroom";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createClassroom,
    updateClassroom,
    loading,
    error,
  };
}

