"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FacultyAPI } from "@/lib/services/FacultyAPI";
import type { FacultyFormData, FacultyResponse } from "./types";

export function useFacultyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const createFaculty = async (data: FacultyFormData): Promise<FacultyResponse | null> => {
    setIsLoading(true);
    setError("");

    try {
      // Transform form data to API format
      const createData = {
        name: data.name,
        email: data.email,
        department: data.department,
        employmentType: data.employmentType,
        image: data.image && data.image.trim() !== '' ? data.image : undefined,
        minLoad: data.minLoad,
        maxLoad: data.maxLoad,
        status: data.status,
      };

      const response = await FacultyAPI.create(createData);
      
      return {
        success: true,
        data: {
          id: response.data._id || "",
          name: response.data.name,
          email: response.data.email,
          department: typeof response.data.department === 'string' 
            ? response.data.department 
            : response.data.department.name,
          employmentType: response.data.employmentType,
          image: response.data.image,
          minLoad: response.data.minLoad,
          maxLoad: response.data.maxLoad,
          currentLoad: response.data.currentLoad || 0,
          maxPreparations: response.data.maxPreparations || 4,
          currentPreparations: response.data.currentPreparations || 0,
          status: response.data.status,
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: response.data.updatedAt || new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error("Create faculty error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create faculty";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFaculty = async (id: string, data: FacultyFormData): Promise<FacultyResponse | null> => {
    setIsLoading(true);
    setError("");

    try {
      // Transform form data to API format
      const updateData = {
        name: data.name,
        email: data.email,
        department: data.department,
        employmentType: data.employmentType,
        image: data.image && data.image.trim() !== '' ? data.image : undefined,
        minLoad: data.minLoad,
        maxLoad: data.maxLoad,
        status: data.status,
      };

      const response = await FacultyAPI.update(id, updateData);
      
      return {
        success: true,
        data: {
          id: response.data._id || "",
          name: response.data.name,
          email: response.data.email,
          department: typeof response.data.department === 'string' 
            ? response.data.department 
            : response.data.department.name,
          employmentType: response.data.employmentType,
          image: response.data.image,
          minLoad: response.data.minLoad,
          maxLoad: response.data.maxLoad,
          currentLoad: response.data.currentLoad || 0,
          maxPreparations: response.data.maxPreparations || 4,
          currentPreparations: response.data.currentPreparations || 0,
          status: response.data.status,
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: response.data.updatedAt || new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error("Update faculty error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update faculty";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError("");

  return {
    createFaculty,
    updateFaculty,
    isLoading,
    error,
    clearError,
  };
}