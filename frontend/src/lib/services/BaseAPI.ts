import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import APP_CONFIG from "@/config";
import { showToast } from "@/components/common/Toast";

const createAPIService = (url = "") => {
  // Set the default API URL properly
  const baseURL = url && url.length > 0 ? url : APP_CONFIG.API_URL;
  const instance: AxiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add a request interceptor
  instance.interceptors.request.use(async (config) => {
    // Get the token
    const access_token = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN_KEY);

    // Add API key if configured
    if (APP_CONFIG.API_KEY) {
      config.headers["x-api-key"] = APP_CONFIG.API_KEY;
    }

    // Add Authorization header if token exists
    if (access_token && access_token.length > 0 && access_token !== "undefined") {
      config.headers.Authorization = "Bearer " + access_token;
    }

    return config;
  });

  // Add common response error handler
  instance.interceptors.response.use(
    (response) => {
      // Do something with the response data
      return response;
    },
    async (error: AxiosError & { response: { data: any } }) => {
      // Handle network errors
      if (error?.code === "ERR_NETWORK") {
        showToast({
          type: "error",
          message: "Network error. Please check your connection.",
          actionLabel: "Dismiss",
        });
        return Promise.reject(error);
      }

      const originalRequest = error.config as typeof error.config & {
        _retry: boolean;
      };

      // If the error is a 401 Unauthorized and it's not a retry attempt
      // Also check if it's not a refresh token request or login request to avoid infinite loops
      if (
        error?.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes(APP_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN) &&
        !originalRequest.url?.includes(APP_CONFIG.ENDPOINTS.AUTH.LOGIN) &&
        !originalRequest.url?.includes(APP_CONFIG.ENDPOINTS.AUTH.REGISTER)
      ) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh the access token
          const { data } = await axios.post(
            `${APP_CONFIG.API_URL}/${APP_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`,
            {},
            {
              withCredentials: true,
              headers: {
                "x-api-key": APP_CONFIG.API_KEY,
              },
            }
          );

          // Validate response structure and store the new access token
          if (data?.success && data?.data?.accessToken) {
            localStorage.setItem(APP_CONFIG.ACCESS_TOKEN_KEY, data.data.accessToken);

            // Retry the original request with the new access token
            originalRequest.headers["Authorization"] = `Bearer ${data.data.accessToken}`;
            return instance(originalRequest);
          } else {
            // If response structure is invalid, throw error to be caught below
            throw new Error("Invalid refresh token response structure");
          }
        } catch (refreshError: any) {
          console.error("Refresh token error", refreshError);

          // Only logout and redirect if refresh token is expired/invalid (401)
          // For other errors (network issues, etc.), just reject and let the app handle it
          if (refreshError?.response?.status === 401) {
            localStorage.removeItem(APP_CONFIG.ACCESS_TOKEN_KEY);

            // Call logout endpoint to clear refresh token cookie
            try {
              await axios.post(
                `${APP_CONFIG.API_URL}/${APP_CONFIG.ENDPOINTS.AUTH.LOGOUT}`,
                {},
                {
                  withCredentials: true,
                  headers: {
                    "x-api-key": APP_CONFIG.API_KEY,
                  },
                }
              );
            } catch (logoutError) {
              console.error("Logout error", logoutError);
            }

            // Store the session expired message in localStorage
            localStorage.setItem(
              APP_CONFIG.SESSION_EXPIRED_KEY,
              "Your session has expired. Please log in again."
            );

            // Redirect to login only if not already there
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
          }

          return Promise.reject(refreshError);
        }
      }

      // Handle other API errors
      if (error.response?.data?.message) {
        showToast({
          type: "error",
          message: error.response.data.message,
        });
      }

      return Promise.reject(error);
    }
  );

  const buildURL = (method: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanMethod = method.startsWith("/") ? method.slice(1) : method;
    return cleanMethod;
  };

  const get = async (method: string, config?: AxiosRequestConfig) => {
    const response = await instance.get(buildURL(method), config);
    return response;
  };

  const post = async (data: any, method: string, config?: AxiosRequestConfig) => {
    const response = await instance.post(buildURL(method), data, config);
    console.log("POST response:", response);
    return response;
  };

  const put = async (data: any, method: string, config?: AxiosRequestConfig) => {
    const response = await instance.put(buildURL(method), data, config);
    return response;
  };

  const patch = async (data: any, method: string, config?: AxiosRequestConfig) => {
    const response = await instance.patch(buildURL(method), data, config);
    return response;
  };

  const remove = async (method: string, config?: AxiosRequestConfig) => {
    const response = await instance.delete(buildURL(method), config);
    return response;
  };

  return {
    get,
    post,
    put,
    patch,
    remove,
    delete: remove, // Alias for consistency
    instance, // Expose the instance for direct usage if needed
  };
};

// Create a default API service instance
const APIService = createAPIService();

export default APIService;
export { createAPIService };