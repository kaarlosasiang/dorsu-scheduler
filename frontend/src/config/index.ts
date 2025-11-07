// Application Configuration
const APP_CONFIG = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || "dorsu-scheduler-api-key",
  
  // Application Settings
  APP_NAME: "DORSU Scheduler",
  APP_VERSION: "1.0.0",
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Token Settings
  ACCESS_TOKEN_KEY: "access_token",
  SESSION_EXPIRED_KEY: "session_expired_toast",
  
  // Toast Settings
  TOAST_DURATION: 5000,
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: "auth/login",
      LOGOUT: "auth/logout",
      REFRESH_TOKEN: "auth/refresh",
      ME: "auth/profile",
      REGISTER: "auth/register",
    },
    FACULTY: {
      BASE: "faculty",
      STATS: "faculty/stats",
      WORKLOAD: (id: string) => `faculty/${id}/workload`,
      STATUS: (id: string) => `faculty/${id}/status`,
    },
    DEPARTMENTS: {
      BASE: "departments",
      STATS: "departments/stats",
      BY_CODE: (code: string) => `departments/code/${code}`,
    },
    COURSES: {
      BASE: "courses",
      BY_DEPARTMENT: (department: string) => `courses?department=${department}`,
    },
    CLASSROOMS: {
      BASE: "classrooms",
      AVAILABLE: "classrooms/available",
      STATS: "classrooms/stats",
    },
    SCHEDULES: {
      BASE: "schedules",
      CONFLICTS: "schedules/conflicts",
      BY_FACULTY: (facultyId: string) => `schedules?facultyId=${facultyId}`,
    },
  },
} as const;

export default APP_CONFIG;