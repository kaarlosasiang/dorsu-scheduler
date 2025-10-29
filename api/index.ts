import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./modules/auth/authRoutes.js";
import facultyRoutes from "./modules/faculty-management/facultyRoutes.js";
import { departmentRoutes } from "./modules/department-management/departmentRoutes.js";
import { courseRoutes } from "./modules/course-management/courseRoutes.js";
import { classroomRoutes } from "./modules/classroom-management/classroomRoutes.js";
import { scheduleRoutes } from "./modules/schedule-management/scheduleRoutes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middlewares/errorHandler.js";
import { API_CONFIG } from "./config/constants.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || API_CONFIG.DEFAULT_PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4321",
    credentials: true, // Allow cookies
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "DORSU Scheduler API is running!",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API Routes
app.use(`${API_CONFIG.PREFIX}/auth`, authRoutes);
app.use(`${API_CONFIG.PREFIX}/faculty`, facultyRoutes);
app.use(`${API_CONFIG.PREFIX}/departments`, departmentRoutes);
app.use(`${API_CONFIG.PREFIX}/courses`, courseRoutes);
app.use(`${API_CONFIG.PREFIX}/classrooms`, classroomRoutes);
app.use(`${API_CONFIG.PREFIX}/schedules`, scheduleRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DORSU Scheduler API running on http://localhost:${PORT}`);
  console.log(`📖 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}${API_CONFIG.PREFIX}`);
});
