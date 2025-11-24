// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d",
  ISSUER: process.env.JWT_ISSUER || "dorsu-scheduler",
  AUDIENCE: process.env.JWT_AUDIENCE || "dorsu-scheduler-client",
};

// Cookie Configuration
export const COOKIE_CONFIG = {
  REFRESH_TOKEN_NAME: process.env.COOKIE_REFRESH_TOKEN_NAME || "refreshToken",
  MAX_AGE: parseInt(process.env.COOKIE_MAX_AGE || "604800000"), // 7 days in milliseconds
  HTTP_ONLY: process.env.COOKIE_HTTP_ONLY === "false" ? false : true,
  SAME_SITE:
    (process.env.COOKIE_SAME_SITE as "strict" | "lax" | "none") || "strict",
  SECURE:
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true",
};

// Password Configuration
export const PASSWORD_CONFIG = {
  MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || "6"),
  SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12"),
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  STAFF: "staff",
} as const;

// Database Configuration
export const DB_CONFIG = {
  DEFAULT_CONNECTION_STRING: "mongodb://localhost:27017/dorsu-scheduler",
  CONNECTION_OPTIONS: {
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10"),
    serverSelectionTimeoutMS: parseInt(
      process.env.DB_SERVER_SELECTION_TIMEOUT || "5000"
    ),
    socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || "45000"),
  },
};

// API Configuration
export const API_CONFIG = {
  DEFAULT_PORT: parseInt(process.env.PORT || "4000"),
  VERSION: process.env.API_VERSION || "v1",
  PREFIX: process.env.API_PREFIX || "/api",
};

// Error Messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid credentials",
    TOKEN_EXPIRED: "Token has expired",
    TOKEN_INVALID: "Invalid token",
    TOKEN_REQUIRED: "Access token is required",
    REFRESH_TOKEN_REQUIRED: "Refresh token is required",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Forbidden access",
    USER_NOT_FOUND: "User not found",
    EMAIL_EXISTS: "Email already exists",
    ADMIN_REQUIRED: "Admin access required",
  },
  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    MIN_LENGTH: (field: string, length: number) =>
      `${field} must be at least ${length} characters long`,
    INVALID_ROLE: "Invalid role. Must be admin, faculty, or staff",
    INVALID_FORMAT: "Invalid format",
  },
  SERVER: {
    INTERNAL_ERROR: "Internal server error",
    DATABASE_ERROR: "Database connection error",
    NOT_FOUND: "Resource not found",
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: "User registered successfully",
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    TOKEN_REFRESHED: "Token refreshed successfully",
    PROFILE_RETRIEVED: "Profile retrieved successfully",
    USERS_RETRIEVED: "Users retrieved successfully",
    USER_DELETED: "User deleted successfully",
  },
} as const;
