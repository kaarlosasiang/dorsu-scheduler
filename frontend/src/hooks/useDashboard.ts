"use client";

import { useCallback, useEffect, useState } from "react";
import { FacultyAPI, type IFaculty } from "@/lib/services/FacultyAPI";
import { ScheduleAPI, type ISchedule } from "@/lib/services/ScheduleAPI";
import { ClassroomAPI } from "@/lib/services/ClassroomAPI";
import { DepartmentAPI } from "@/lib/services/DepartmentAPI";

export interface DashboardMetricCard {
  title: string;
  value: number;
  description: string;
  trend?: string;
}

export interface DashboardChartDatum {
  key: string;
  label: string;
  value: number;
}

export interface DashboardRecentActivity {
  id: string;
  type: "schedule" | "faculty";
  title: string;
  description: string;
  createdAt?: string;
  href: string;
  status?: string;
}

export interface DashboardData {
  metricCards: DashboardMetricCard[];
  schedulesByDepartment: DashboardChartDatum[];
  facultyByEmployment: DashboardChartDatum[];
  classroomByStatus: DashboardChartDatum[];
  recentActivity: DashboardRecentActivity[];
  programs: string[];
  publicationRate: number;
}

const EMPTY_DASHBOARD_DATA: DashboardData = {
  metricCards: [],
  schedulesByDepartment: [],
  facultyByEmployment: [],
  classroomByStatus: [],
  recentActivity: [],
  programs: [],
  publicationRate: 0,
};

function sortByCreatedAtDesc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

function getFacultyDisplayName(faculty: IFaculty): string {
  if (faculty.fullName) return faculty.fullName;
  const parts = [faculty.name?.first, faculty.name?.middle, faculty.name?.last, faculty.name?.ext]
    .filter(Boolean)
    .map((part) => String(part).trim());
  return parts.join(" ") || faculty.email;
}

function getScheduleSubjectLabel(schedule: ISchedule): string {
  const subject = schedule.subjectDetails || schedule.subject;
  if (subject && typeof subject === "object") {
    return subject.subjectCode || subject.subjectName || "Scheduled class";
  }
  return "Scheduled class";
}

function getScheduleDepartmentLabel(schedule: ISchedule): string {
  const department = schedule.departmentDetails || schedule.department;
  if (department && typeof department === "object") {
    return department.code || department.name || "Department";
  }
  return "Department";
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        facultyStatsResponse,
        scheduleStatsResponse,
        classroomStatsResponse,
        departmentStatsResponse,
        facultyListResponse,
        scheduleListResponse,
      ] = await Promise.all([
        FacultyAPI.getStats(),
        ScheduleAPI.getStats(),
        ClassroomAPI.getStats(),
        DepartmentAPI.getStats(),
        FacultyAPI.getAll({ page: 1, limit: 6 }),
        ScheduleAPI.getAll(),
      ]);

      const facultyStats = facultyStatsResponse.data;
      const scheduleStats = scheduleStatsResponse.data;
      const classroomStats = classroomStatsResponse.data;
      const departmentStats = departmentStatsResponse.data;

      const availableClassrooms = classroomStats.byStatus.available ?? 0;
      const totalSchedules = scheduleStats.total || 0;
      const publicationRate = totalSchedules > 0 ? Math.round((scheduleStats.published / totalSchedules) * 100) : 0;

      const metricCards: DashboardMetricCard[] = [
        {
          title: "Faculty Members",
          value: facultyStats.total,
          description: `${facultyStats.active} active, ${facultyStats.inactive} inactive`,
          trend: `${facultyStats.fullTime} full-time`,
        },
        {
          title: "Schedules",
          value: scheduleStats.total,
          description: `${scheduleStats.published} published, ${scheduleStats.draft} draft`,
          trend: `${publicationRate}% published`,
        },
        {
          title: "Classrooms",
          value: classroomStats.total,
          description: `${availableClassrooms} available right now`,
          trend: `${classroomStats.totalCapacity.toLocaleString()} total seats`,
        },
        {
          title: "Departments",
          value: departmentStats.total,
          description: `${departmentStats.totalCourses} total courses tracked`,
          trend: `${facultyStats.programs.length} active programs`,
        },
      ];

      const schedulesByDepartment: DashboardChartDatum[] = (() => {
        const counts: Record<string, { label: string; count: number }> = {};
        for (const s of scheduleListResponse.data) {
          const subj = typeof s.subject === 'object' ? s.subject : null;
          const course = subj && typeof subj.course === 'object' ? subj.course : null;
          const key = course?.courseCode || course?.courseName || 'Unknown';
          const label = course?.courseCode || course?.courseName || 'Unknown';
          counts[key] = { label, count: (counts[key]?.count ?? 0) + 1 };
        }
        return Object.entries(counts)
          .map(([key, { label, count }]) => ({ key, label, value: count }))
          .sort((a, b) => b.value - a.value);
      })();

      const facultyByEmployment: DashboardChartDatum[] = [
        { key: "fullTime", label: "Full-time", value: facultyStats.fullTime },
        { key: "partTime", label: "Part-time", value: facultyStats.partTime },
      ];

      const classroomByStatus: DashboardChartDatum[] = Object.entries(classroomStats.byStatus).map(
        ([key, value]) => ({
          key,
          label: key.replace(/(^\w)|(-\w)/g, (match) => match.replace("-", "").toUpperCase()),
          value,
        })
      );

      const recentFaculty = sortByCreatedAtDesc(facultyListResponse.data)
        .slice(0, 3)
        .map((faculty) => ({
          id: faculty._id || faculty.id || faculty.email,
          type: "faculty" as const,
          title: getFacultyDisplayName(faculty),
          description: `${typeof faculty.program === "string" ? faculty.program : faculty.program?.courseCode || "Program"} • ${faculty.status}`,
          createdAt: faculty.createdAt,
          href: "/faculty",
          status: faculty.status,
        }));

      const recentSchedules = sortByCreatedAtDesc(scheduleListResponse.data)
        .slice(0, 4)
        .map((schedule) => ({
          id: schedule._id || schedule.id || `${schedule.academicYear}-${schedule.semester}`,
          type: "schedule" as const,
          title: getScheduleSubjectLabel(schedule),
          description: `${getScheduleDepartmentLabel(schedule)} • ${schedule.status || "draft"}`,
          createdAt: schedule.createdAt,
          href: "/schedules",
          status: schedule.status,
        }));

      const recentActivity = [...recentSchedules, ...recentFaculty]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 6);

      setData({
        metricCards,
        schedulesByDepartment,
        facultyByEmployment,
        classroomByStatus,
        recentActivity,
        programs: facultyStats.programs,
        publicationRate,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      setData(EMPTY_DASHBOARD_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}