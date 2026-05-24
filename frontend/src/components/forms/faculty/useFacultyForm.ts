"use client";

import { useState } from "react";
import { FacultyAPI } from "@/lib/services/FacultyAPI";
import { AuthAPI } from "@/lib/services/AuthAPI";
import type { FacultyFormData, FacultyResponse, NameFormData } from "./types";

function getFacultyFullName(name: NameFormData): string {
  return [name.first, name.middle, name.last, name.ext].filter(Boolean).join(" ");
}

function buildFacultyResponseData(
  facultyId: string,
  responseData: Awaited<ReturnType<typeof FacultyAPI.create>>["data"]
): FacultyResponse["data"] {
  return {
    id: facultyId,
    name: responseData.name,
    email: responseData.email,
    program:
      typeof responseData.program === "string"
        ? responseData.program
        : (responseData.program as { courseCode?: string })?.courseCode || "",
    employmentType: responseData.employmentType,
    image: responseData.image,
    minLoad: responseData.minLoad,
    maxLoad: responseData.maxLoad,
    currentLoad: responseData.currentLoad || 0,
    maxPreparations: responseData.maxPreparations || 4,
    currentPreparations: responseData.currentPreparations || 0,
    status: responseData.status,
    createdAt: responseData.createdAt || new Date().toISOString(),
    updatedAt: responseData.updatedAt || new Date().toISOString(),
  };
}

export function useFacultyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const createFaculty = async (data: FacultyFormData): Promise<FacultyResponse | null> => {
    setIsLoading(true);
    setError("");

    const password = data.password?.trim();
    if (!password) {
      setError("Password is required to create faculty login credentials");
      setIsLoading(false);
      return null;
    }

    try {
      const createData = {
        name: data.name,
        email: data.email,
        program: data.program,
        employmentType: data.employmentType,
        designation: data.designation || undefined,
        adminLoad: data.designation ? (data.adminLoad ?? 0) : 0,
        image: data.image && data.image.trim() !== "" ? data.image : undefined,
        minLoad: data.minLoad,
        maxLoad: data.maxLoad,
        status: data.status,
      };

      const response = await FacultyAPI.create(createData);
      const facultyId = response.data.id || response.data._id || "";

      if (!facultyId) {
        throw new Error("Faculty was created but no ID was returned");
      }

      const facultyName = getFacultyFullName(data.name);
      let accountCreated = false;
      let accountError: string | undefined;

      try {
        await AuthAPI.createFacultyUser({
          email: data.email,
          password,
          facultyId,
        });
        accountCreated = true;
      } catch (authErr: unknown) {
        const err = authErr as { response?: { data?: { message?: string } }; message?: string };
        accountError =
          err.response?.data?.message || err.message || "Failed to create login account";
      }

      return {
        success: true,
        data: buildFacultyResponseData(facultyId, response.data),
        accountCreated,
        accountError,
        loginEmail: accountCreated ? data.email : undefined,
        loginPassword: accountCreated ? password : undefined,
        facultyName,
      };
    } catch (err: unknown) {
      console.error("Create faculty error:", err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        errorObj.response?.data?.message || errorObj.message || "Failed to create faculty";
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
      const updateData = {
        name: data.name,
        email: data.email,
        program: data.program,
        employmentType: data.employmentType,
        designation: data.designation || undefined,
        adminLoad: data.designation ? (data.adminLoad ?? 0) : 0,
        image: data.image && data.image.trim() !== "" ? data.image : undefined,
        minLoad: data.minLoad,
        maxLoad: data.maxLoad,
        status: data.status,
      };

      const response = await FacultyAPI.update(id, updateData);
      const facultyId = response.data.id || response.data._id || id;

      return {
        success: true,
        data: buildFacultyResponseData(facultyId, response.data),
      };
    } catch (err: unknown) {
      console.error("Update faculty error:", err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        errorObj.response?.data?.message || errorObj.message || "Failed to update faculty";
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
