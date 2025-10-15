// Export all API services
export { default as APIService, createAPIService } from "./BaseAPI";
export { AuthAPI } from "./AuthAPI";
export { FacultyAPI } from "./FacultyAPI";

// Export types
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
} from "./AuthAPI";

export type {
  IAvailability,
  IFaculty,
  FacultyListResponse,
  FacultyResponse,
  FacultyStatsResponse,
  FacultyQueryParams,
  WorkloadUpdate,
  StatusUpdate,
} from "./FacultyAPI";