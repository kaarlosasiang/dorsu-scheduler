"use client";

import { useCallback, useEffect, useState } from "react";

import { ClassroomAPI } from "@/lib/services/ClassroomAPI";
import CourseAPI from "@/lib/services/CourseAPI";
import { DepartmentAPI } from "@/lib/services/DepartmentAPI";
import { FacultyAPI } from "@/lib/services/FacultyAPI";
import { ScheduleAPI } from "@/lib/services/ScheduleAPI";
import { SubjectAPI } from "@/lib/services/SubjectAPI";

export interface ReportMetricCard {
  title: string;
  value: number | string;
  description: string;
  trend?: string;
}

export interface ReportChartDatum {
  key: string;
  label: string;
  value: number;
}

export interface ReportsData {
  metricCards: ReportMetricCard[];
  scheduleStatus: ReportChartDatum[];
  facultyWorkload: ReportChartDatum[];
  classroomStatus: ReportChartDatum[];
  subjectSemester: ReportChartDatum[];
  departmentSchedules: ReportChartDatum[];
  insights: string[];
  capacityUtilization: number;
}

const EMPTY_REPORTS_DATA: ReportsData = {
  metricCards: [],
  scheduleStatus: [],
  facultyWorkload: [],
  classroomStatus: [],
  subjectSemester: [],
  departmentSchedules: [],
  insights: [],
  capacityUtilization: 0,
};

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toChartData(record: Record<string, number> | undefined): ReportChartDatum[] {
  return Object.entries(record || {}).map(([key, value]) => ({
    key,
    label: toTitle(key),
    value,
  }));
}

function getWorkloadBand(averageWorkload: number, minimumLoad = 18) {
  if (averageWorkload <= 0) return "No load";
  if (averageWorkload < minimumLoad) return "Below minimum";
  if (averageWorkload <= 26) return "In range";
  return "Overload";
}

export function useReports() {
  const [data, setData] = useState<ReportsData>(EMPTY_REPORTS_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        scheduleStatsResponse,
        classroomStatsResponse,
        departmentStatsResponse,
        facultyStatsResponse,
        courseStatsResponse,
        subjectStatsResponse,
      ] = await Promise.all([
        ScheduleAPI.getStats(),
        ClassroomAPI.getStats(),
        DepartmentAPI.getStats(),
        FacultyAPI.getStats(),
        CourseAPI.getStats(),
        SubjectAPI.getStats(),
      ]);

      const scheduleStats = scheduleStatsResponse.data;
      const classroomStats = classroomStatsResponse.data;
      const departmentStats = departmentStatsResponse.data;
      const facultyStats = facultyStatsResponse.data;
      const courseStats = courseStatsResponse.data;
      const subjectStats = subjectStatsResponse.data;

      const totalSchedules = scheduleStats.total || 0;
      const publicationRate = totalSchedules > 0 ? Math.round((scheduleStats.published / totalSchedules) * 100) : 0;
      const capacityUtilization = classroomStats.totalCapacity > 0
        ? Math.min(100, Math.round((totalSchedules / classroomStats.totalCapacity) * 100))
        : 0;
      const averageWorkload = facultyStats.averageWorkload ?? 0;
      const workloadBand = getWorkloadBand(averageWorkload);

      const metricCards: ReportMetricCard[] = [
        {
          title: "Published Schedules",
          value: `${publicationRate}%`,
          description: `${scheduleStats.published} of ${totalSchedules} schedules are published`,
          trend: `${scheduleStats.draft} drafts need review`,
        },
        {
          title: "Room Capacity",
          value: classroomStats.totalCapacity.toLocaleString(),
          description: `${classroomStats.total} rooms with ${classroomStats.averageCapacity.toFixed(1)} average seats`,
          trend: `${capacityUtilization}% schedule-to-seat ratio`,
        },
        {
          title: "Faculty Workload",
          value: averageWorkload.toFixed(1),
          description: `${facultyStats.totalWorkload} assigned units across ${facultyStats.total} faculty`,
          trend: workloadBand,
        },
        {
          title: "Academic Catalog",
          value: subjectStats.totalSubjects,
          description: `${courseStats.total} programs and ${departmentStats.total} departments`,
          trend: `${subjectStats.laboratoryCount} laboratory subjects`,
        },
      ];

      const scheduleStatus: ReportChartDatum[] = [
        { key: "published", label: "Published", value: scheduleStats.published || 0 },
        { key: "draft", label: "Draft", value: scheduleStats.draft || 0 },
        { key: "generated", label: "Generated", value: scheduleStats.generated || 0 },
        { key: "manual", label: "Manual", value: scheduleStats.manual || 0 },
      ];

      const facultyWorkload: ReportChartDatum[] = [
        { key: "workload", label: "Teaching Load", value: facultyStats.totalWorkload || 0 },
        { key: "preparations", label: "Preparations", value: facultyStats.totalPreparations || 0 },
      ];

      const departmentSchedules: ReportChartDatum[] = (scheduleStats.byDepartment || []).map((item) => ({
        key: item._id || item.code || item.name,
        label: item.code || item.name || "Department",
        value: item.count,
      }));

      const subjectSemester = toChartData(subjectStats.bySemester);
      const classroomStatus = toChartData(classroomStats.byStatus);

      const insights = [
        `${facultyStats.active} active faculty are available from ${facultyStats.total} total records.`,
        `${departmentStats.totalCourses} courses are mapped across ${departmentStats.total} departments.`,
        `${subjectStats.averageUnitsPerSubject.toFixed(1)} average units per subject in the catalog.`,
      ];

      setData({
        metricCards,
        scheduleStatus,
        facultyWorkload,
        classroomStatus,
        subjectSemester,
        departmentSchedules,
        insights,
        capacityUtilization,
      });
    } catch (err) {
      console.error("Reports fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
      setData(EMPTY_REPORTS_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchReports,
  };
}
