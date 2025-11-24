"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthAPI, type AuthResponse } from "@/lib/services/AuthAPI";
import APP_CONFIG from "@/config";

// User interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: "admin" | "faculty" | "staff";
  isActive: boolean;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const token = AuthAPI.getToken();

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }

    try {
      const response = await AuthAPI.getProfile();

      if (response.success && response.data) {
        const userData: User = {
          id: response.data.id || response.data._id,
          email: response.data.email,
          username: response.data.username || response.data.email.split("@")[0],
          role: response.data.role,
          isActive: response.data.isActive ?? true,
        };

        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(APP_CONFIG.ACCESS_TOKEN_KEY);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response: AuthResponse = await AuthAPI.login({ email, password });

      if (response.success && response.data) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          username: response.data.user.username,
          role: response.data.user.role as "admin" | "faculty" | "staff",
          isActive: response.data.user.isActive,
        };

        setUser(userData);
        setIsAuthenticated(true);

        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await AuthAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);

      // Redirect to login
      router.push("/login");
    }
  }, [router]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for storage changes (logout in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === APP_CONFIG.ACCESS_TOKEN_KEY && !e.newValue) {
        // Token was removed, log out
        setUser(null);
        setIsAuthenticated(false);
        router.push("/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  // Check for session expired message
  useEffect(() => {
    const sessionExpiredMessage = localStorage.getItem(APP_CONFIG.SESSION_EXPIRED_KEY);

    if (sessionExpiredMessage && !isAuthenticated) {
      // You can show a toast here if needed
      localStorage.removeItem(APP_CONFIG.SESSION_EXPIRED_KEY);
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// HOC to protect routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: "admin" | "faculty" | "staff";
    redirectTo?: string;
  }
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push(options?.redirectTo || "/login");
        } else if (options?.requiredRole && user?.role !== options.requiredRole) {
          // Redirect if user doesn't have required role
          router.push("/unauthorized");
        }
      }
    }, [isAuthenticated, isLoading, user, router]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (options?.requiredRole && user?.role !== options.requiredRole) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook to check if user has specific role
export function useRole(role: "admin" | "faculty" | "staff"): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

// Hook to check if user is admin
export function useIsAdmin(): boolean {
  return useRole("admin");
}

// Hook to check if user is faculty
export function useIsFaculty(): boolean {
  return useRole("faculty");
}

// Hook to check if user is staff
export function useIsStaff(): boolean {
  return useRole("staff");
}

