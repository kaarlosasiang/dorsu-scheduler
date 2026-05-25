"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FacultyAPI, type IFaculty } from "@/lib/services/FacultyAPI";
import { ScheduleAPI } from "@/lib/services/ScheduleAPI";

export interface FacultyProfile {
  name: { first: string; middle?: string; last: string; ext?: string };
  email: string;
  program: { _id: string; name: string; courseCode?: string };
  designation?: string;
  employmentType: "full-time" | "part-time";
}

export interface WorkloadData {
  facultyId: string;
  facultyName?: string;
  totalTeachingHours: number;
  lectureHours: number;
  labHours: number;
  totalUnits: number;
  lectureUnits: number;
  labUnits: number;
  preparations: number;
  scheduleCount: number;
  subjectBreakdown: Array<{
    subjectCode: string;
    subjectName: string;
    scheduleType: "lecture" | "laboratory";
    units: number;
    teachingHours: number;
  }>;
  maxLoad: number;
  isOverloaded: boolean;
}

export interface MappedFacultySchedule {
  _id: string;
  timeSlot: { day: string; startTime: string; endTime: string };
  subject: { code: string; name: string };
  classroom: { name: string; building?: string };
  section?: { name: string };
  department: { name: string };
  scheduleType: "lecture" | "laboratory";
}

export const FACULTY_SEMESTERS = ["1st Semester", "2nd Semester", "Summer"] as const;

export const FACULTY_ACADEMIC_YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
})();

export function getFacultyFullName(faculty: IFaculty | null): string {
  if (!faculty) return "Faculty Details";
  return [
    faculty.name.first,
    faculty.name.middle,
    faculty.name.last,
    faculty.name.ext,
  ]
    .filter(Boolean)
    .join(" ");
}

function getAcademicYearStartYear(academicYear: string): number {
  const [startStr] = academicYear.split("-");
  return parseInt(startStr, 10);
}

function mapSchedules(schedules: any[]): MappedFacultySchedule[] {
  return schedules.map((s) => ({
    _id: s._id || s.id,
    timeSlot: s.timeSlot,
    subject: s.subject
      ? {
          code: s.subject.subjectCode || s.subject.code,
          name: s.subject.subjectName || s.subject.name,
        }
      : { code: "N/A", name: "N/A" },
    classroom: s.classroom
      ? {
          name: s.classroom.roomNumber || s.classroom.name,
          building: s.classroom.building,
        }
      : { name: "N/A" },
    section: s.section ? { name: s.section.name } : undefined,
    department: s.department
      ? { name: s.department.name || s.department.code }
      : { name: "N/A" },
    scheduleType: s.scheduleType,
  }));
}

function buildProfile(
  profileData: any,
  facultyData: IFaculty
): FacultyProfile {
  return {
    name: profileData.name || facultyData.name,
    email: profileData.email || facultyData.email,
    program: profileData.program
      ? {
          _id: profileData.program._id || "",
          name:
            profileData.program.name ||
            profileData.program.courseName ||
            (typeof facultyData.program === "string"
              ? facultyData.program
              : facultyData.program.courseName),
          courseCode:
            profileData.program.courseCode ||
            (typeof facultyData.program === "object"
              ? facultyData.program.courseCode
              : undefined),
        }
      : {
          _id: "",
          name:
            typeof facultyData.program === "string"
              ? facultyData.program
              : facultyData.program.courseName,
          courseCode:
            typeof facultyData.program === "object"
              ? facultyData.program.courseCode
              : undefined,
        },
    designation: profileData.designation || facultyData.designation,
    employmentType: profileData.employmentType || facultyData.employmentType,
  };
}

export function useFacultySemesterData(facultyId: string) {
  const [faculty, setFaculty] = useState<IFaculty | null>(null);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
  const [isSelectionInitialized, setIsSelectionInitialized] = useState(false);

  const autoSelectMostRecentSchedule = useCallback(async () => {
    if (!facultyId) return;

    try {
      const yearsWithSchedules = new Map<string, Set<string>>();

      for (const year of FACULTY_ACADEMIC_YEARS) {
        for (const semester of FACULTY_SEMESTERS) {
          const schedulesRes = await ScheduleAPI.getByFaculty(
            facultyId,
            semester,
            year
          );

          if (schedulesRes.success && schedulesRes.data && schedulesRes.data.length > 0) {
            if (!yearsWithSchedules.has(year)) {
              yearsWithSchedules.set(year, new Set());
            }
            yearsWithSchedules.get(year)!.add(semester);
          }
        }
      }

      if (yearsWithSchedules.size === 0) {
        setSelectedAcademicYear(FACULTY_ACADEMIC_YEARS[FACULTY_ACADEMIC_YEARS.length - 1]);
        setSelectedSemester(FACULTY_SEMESTERS[0]);
        setIsSelectionInitialized(true);
        return;
      }

      const sortedYears = Array.from(yearsWithSchedules.keys()).sort(
        (a, b) => getAcademicYearStartYear(b) - getAcademicYearStartYear(a)
      );

      const mostRecentYear = sortedYears[0];
      const semesters = Array.from(yearsWithSchedules.get(mostRecentYear)!);
      const semesterOrder = ["1st Semester", "2nd Semester", "Summer"];
      const selectedSem =
        semesterOrder.find((sem) => semesters.includes(sem)) || semesters[0];

      setSelectedAcademicYear(mostRecentYear);
      setSelectedSemester(selectedSem);
      setIsSelectionInitialized(true);
    } catch (err) {
      console.error("Error auto-selecting schedule:", err);
      setSelectedAcademicYear(FACULTY_ACADEMIC_YEARS[FACULTY_ACADEMIC_YEARS.length - 1]);
      setSelectedSemester(FACULTY_SEMESTERS[0]);
      setIsSelectionInitialized(true);
    }
  }, [facultyId]);

  const fetchFacultyData = useCallback(async () => {
    if (!facultyId || !selectedSemester || !selectedAcademicYear) return;

    try {
      setLoading(true);
      setError(null);

      const [facultyRes, profileRes, workloadRes, schedulesRes] = await Promise.all([
        FacultyAPI.getById(facultyId),
        FacultyAPI.getProfile(facultyId),
        FacultyAPI.getWorkload(facultyId, selectedSemester, selectedAcademicYear),
        ScheduleAPI.getByFaculty(facultyId, selectedSemester, selectedAcademicYear),
      ]);

      if (!facultyRes.success || !facultyRes.data) {
        throw new Error("Faculty not found");
      }

      const facultyData = facultyRes.data;
      setFaculty(facultyData);

      if (profileRes.success && profileRes.data) {
        setProfile(buildProfile(profileRes.data, facultyData));
      }

      if (workloadRes.success && workloadRes.data) {
        setWorkload({
          facultyId: workloadRes.data.facultyId,
          facultyName: workloadRes.data.facultyName,
          totalTeachingHours: workloadRes.data.totalTeachingHours,
          lectureHours: workloadRes.data.lectureHours,
          labHours: workloadRes.data.labHours,
          totalUnits: workloadRes.data.totalUnits,
          lectureUnits: workloadRes.data.lectureUnits,
          labUnits: workloadRes.data.labUnits,
          preparations: workloadRes.data.preparations,
          scheduleCount: workloadRes.data.scheduleCount,
          subjectBreakdown: workloadRes.data.subjectBreakdown || [],
          maxLoad: workloadRes.data.maxLoad,
          isOverloaded: workloadRes.data.isOverloaded,
        });
      } else {
        setWorkload(null);
      }

      if (schedulesRes.success && schedulesRes.data) {
        setSchedules(schedulesRes.data);
      } else {
        setSchedules([]);
      }
    } catch (err: unknown) {
      console.error("Faculty semester data fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load faculty data");
    } finally {
      setLoading(false);
    }
  }, [facultyId, selectedSemester, selectedAcademicYear]);

  useEffect(() => {
    if (facultyId) {
      autoSelectMostRecentSchedule();
    }
  }, [facultyId, autoSelectMostRecentSchedule]);

  useEffect(() => {
    if (isSelectionInitialized) {
      fetchFacultyData();
    }
  }, [isSelectionInitialized, fetchFacultyData]);

  const mappedSchedules = useMemo(() => mapSchedules(schedules), [schedules]);

  return {
    faculty,
    profile,
    workload,
    schedules,
    mappedSchedules,
    loading,
    error,
    selectedSemester,
    selectedAcademicYear,
    isSelectionInitialized,
    setSelectedSemester,
    setSelectedAcademicYear,
    refetch: fetchFacultyData,
  };
}
