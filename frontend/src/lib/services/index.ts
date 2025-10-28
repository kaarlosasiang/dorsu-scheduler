// Export all API services
export { default as APIService, createAPIService } from "./BaseAPI";
export { AuthAPI } from "./AuthAPI";
export { FacultyAPI } from "./FacultyAPI";
export { DepartmentAPI } from "./DepartmentAPI";
export { default as CourseAPI } from "./CourseAPI";

// Export types
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
} from "./AuthAPI";

export type {
  IFaculty,
  IName,
  FacultyListResponse,
  FacultyResponse,
  FacultyStatsResponse,
  FacultyQueryParams,
  FacultyCreateData,
  FacultyUpdateData,
  WorkloadUpdate,
  StatusUpdate,
} from "./FacultyAPI";

export type {
  IDepartment,
  DepartmentListResponse,
  DepartmentResponse,
  DepartmentStatsResponse,
  DepartmentQueryParams,
  DepartmentCreateData,
  DepartmentUpdateData,
} from "./DepartmentAPI";

export type {
  ICourse,
  CourseListResponse,
  CourseResponse,
  CourseStatsResponse,
  CourseQueryParams,
  CourseCreateData,
  CourseUpdateData,
} from "./CourseAPI";

