import { useState, useCallback } from "react";
import { showToast } from "@/components/common/Toast";

interface UseAPIOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAPI<T = any>() {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async <R = T>(
      apiCall: () => Promise<R>,
      options: UseAPIOptions = {}
    ): Promise<R | null> => {
      const {
        showSuccessToast = false,
        showErrorToast = true,
        successMessage,
      } = options;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiCall();
        
        setState({
          data: result as unknown as T,
          loading: false,
          error: null,
        });

        if (showSuccessToast) {
          showToast({
            type: "success",
            message: successMessage || "Operation completed successfully",
          });
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "An error occurred";
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        if (showErrorToast) {
          showToast({
            type: "error",
            message: errorMessage,
          });
        }

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hook for authentication
export function useAuth() {
  const api = useAPI();

  return {
    ...api,
    login: (credentials: any) =>
      api.execute(
        () => import("@/lib/services").then(({ AuthAPI }) => AuthAPI.login(credentials)),
        { showSuccessToast: true, successMessage: "Logged in successfully" }
      ),
    logout: () =>
      api.execute(
        () => import("@/lib/services").then(({ AuthAPI }) => AuthAPI.logout()),
        { showSuccessToast: true, successMessage: "Logged out successfully" }
      ),
    register: (userData: any) =>
      api.execute(
        () => import("@/lib/services").then(({ AuthAPI }) => AuthAPI.register(userData)),
        { showSuccessToast: true, successMessage: "Account created successfully" }
      ),
  };
}

// Specialized hook for faculty management
export function useFaculty() {
  const api = useAPI();

  return {
    ...api,
    getAll: (params?: any) =>
      api.execute(() =>
        import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.getAll(params))
      ),
    getById: (id: string) =>
      api.execute(() =>
        import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.getById(id))
      ),
    create: (facultyData: any) =>
      api.execute(
        () => import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.create(facultyData)),
        { showSuccessToast: true, successMessage: "Faculty created successfully" }
      ),
    update: (id: string, facultyData: any) =>
      api.execute(
        () => import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.update(id, facultyData)),
        { showSuccessToast: true, successMessage: "Faculty updated successfully" }
      ),
    delete: (id: string) =>
      api.execute(
        () => import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.delete(id)),
        { showSuccessToast: true, successMessage: "Faculty deleted successfully" }
      ),
    updateAvailability: (id: string, availability: any) =>
      api.execute(
        () => import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.updateAvailability(id, availability)),
        { showSuccessToast: true, successMessage: "Availability updated successfully" }
      ),
    updateWorkload: (id: string, workloadData: any) =>
      api.execute(
        () => import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.updateWorkload(id, workloadData)),
        { showSuccessToast: true, successMessage: "Workload updated successfully" }
      ),
    updateStatus: (id: string, statusData: any) =>
      api.execute(
        () => import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.updateStatus(id, statusData)),
        { showSuccessToast: true, successMessage: "Status updated successfully" }
      ),
    getStats: (department?: string) =>
      api.execute(() =>
        import("@/lib/services").then(({ FacultyAPI }) => FacultyAPI.getStats(department))
      ),
  };
}