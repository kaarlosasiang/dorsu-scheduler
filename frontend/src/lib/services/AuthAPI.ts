import APIService from "./BaseAPI";
import APP_CONFIG from "@/config";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: "admin" | "faculty" | "staff";
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      isActive: boolean;
    };
    accessToken: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
}

export const AuthAPI = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials) => {
    const response = await APIService.post(credentials, APP_CONFIG.ENDPOINTS.AUTH.LOGIN);
    
    // Store access token
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem(APP_CONFIG.ACCESS_TOKEN_KEY, response.data.data.accessToken);
    }
    
    return response.data as AuthResponse;
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterData) => {
    const response = await APIService.post(userData, APP_CONFIG.ENDPOINTS.AUTH.REGISTER);
    return response.data as AuthResponse;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      const response = await APIService.post({}, APP_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      
      // Clear local storage
      localStorage.removeItem(APP_CONFIG.ACCESS_TOKEN_KEY);
      localStorage.removeItem(APP_CONFIG.SESSION_EXPIRED_KEY);
      
      return response.data;
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem(APP_CONFIG.ACCESS_TOKEN_KEY);
      localStorage.removeItem(APP_CONFIG.SESSION_EXPIRED_KEY);
      throw error;
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await APIService.get(APP_CONFIG.ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const response = await APIService.post({}, APP_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN);
    
    // Store new access token
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem(APP_CONFIG.ACCESS_TOKEN_KEY, response.data.data.accessToken);
    }
    
    return response.data as RefreshTokenResponse;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN_KEY);
    return token !== null && token !== "undefined" && token.length > 0;
  },

  /**
   * Get stored access token
   */
  getToken: (): string | null => {
    return localStorage.getItem(APP_CONFIG.ACCESS_TOKEN_KEY);
  },
};