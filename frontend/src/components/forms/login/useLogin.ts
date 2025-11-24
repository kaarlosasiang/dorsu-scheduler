"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAPI } from "@/lib/services/AuthAPI";
import type { LoginFormData, LoginResponse } from "./types";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const login = async (data: LoginFormData): Promise<LoginResponse | null> => {
    setIsLoading(true);
    setError("");

    try {
      const response = await AuthAPI.login({
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        // Transform response to match our LoginResponse type
        const loginResponse: LoginResponse = {
          success: true,
          data: {
            user: {
              id: response.data.user.id,
              email: response.data.user.email,
              name: response.data.user.username,
              role: response.data.user.role,
            },
            token: response.data.accessToken,
          },
        };

        // Redirect to protected area
        router.push("/dashboard");
        
        return loginResponse;
      } else {
        const errorMessage = response.message || "Login failed";
        setError(errorMessage);
        return null;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError("");

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}