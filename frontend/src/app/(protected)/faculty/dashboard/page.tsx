"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/authContext";
import { FacultyProfileCard } from "@/components/faculty/FacultyProfileCard";
import { WorkloadSummaryCard } from "@/components/faculty/WorkloadSummaryCard";
import { SubjectBreakdownTable } from "@/components/faculty/SubjectBreakdownTable";
import { FacultyScheduleList } from "@/components/faculty/FacultyScheduleList";
import { FacultyAPI } from "@/lib/services/FacultyAPI";
import { ScheduleAPI } from "@/lib/services/ScheduleAPI";
import { exportFacultyWorkload } from "@/lib/utils/exportCourseOffering";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FacultyProfile {
  name: { first: string; middle?: string; last: string; ext?: string };
  email: string;
  program: { _id: string; name: string; courseCode?: string };
  designation?: string;
  employmentType: "full-time" | "part-time";
  adminLoad?: number;
  maxLoad?: number;
}

interface WorkloadData {
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

const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"] as const;
const ACADEMIC_YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
})();

function getFacultyFullName(name: FacultyProfile["name"]): string {
  return [name.first, name.middle, name.last, name.ext].filter(Boolean).join(" ");
}

export default function FacultyDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [facultyId, setFacultyId] = useState<string>("");
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
  const [isSelectionInitialized, setIsSelectionInitialized] = useState(false);

  const getAcademicYearStartYear = (academicYear: string): number => {
    const parts = academicYear.split("-");
    return parseInt(parts[0], 10);
  };

  const autoSelectMostRecentSchedule = useCallback(async () => {
    if (!user) return;

    try {
      const facultyResponse = await FacultyAPI.getMe();
      if (!facultyResponse.success || !facultyResponse.data) {
        throw new Error("Failed to fetch faculty profile");
      }

      const id = facultyResponse.data.id || facultyResponse.data._id || "";
      setFacultyId(id);

      const yearsWithSchedules = new Map<string, Set<string>>();

      for (const year of ACADEMIC_YEARS) {
        for (const semester of SEMESTERS) {
          const schedulesRes = await ScheduleAPI.getByFaculty(id, semester, year);

          if (schedulesRes.success && schedulesRes.data && schedulesRes.data.length > 0) {
            if (!yearsWithSchedules.has(year)) {
              yearsWithSchedules.set(year, new Set());
            }
            yearsWithSchedules.get(year)!.add(semester);
          }
        }
      }

      if (yearsWithSchedules.size === 0) {
        setSelectedAcademicYear(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
        setSelectedSemester(SEMESTERS[0]);
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
      setSelectedAcademicYear(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
      setSelectedSemester(SEMESTERS[0]);
      setIsSelectionInitialized(true);
    }
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !selectedSemester || !selectedAcademicYear) return;

    try {
      setLoading(true);
      setError(null);

      const facultyResponse = await FacultyAPI.getMe();
      if (!facultyResponse.success || !facultyResponse.data) {
        throw new Error("Failed to fetch faculty profile");
      }

      const id = facultyResponse.data.id || facultyResponse.data._id || "";
      setFacultyId(id);
      const faculty = facultyResponse.data;

      const [profileRes, workloadRes, schedulesRes] = await Promise.all([
        FacultyAPI.getProfile(id),
        FacultyAPI.getWorkload(id, selectedSemester, selectedAcademicYear),
        ScheduleAPI.getByFaculty(id, selectedSemester, selectedAcademicYear),
      ]);

      if (profileRes.success && profileRes.data) {
        const profileData = profileRes.data;
        setProfile({
          name: profileData.name || faculty.name,
          email: profileData.email || faculty.email,
          program: profileData.program
            ? {
                _id: profileData.program._id || "",
                name:
                  profileData.program.name ||
                  profileData.program.courseName ||
                  "",
                courseCode: profileData.program.courseCode,
              }
            : { _id: "", name: "" },
          designation: profileData.designation || faculty.designation,
          employmentType: profileData.employmentType || faculty.employmentType,
          adminLoad: profileData.adminLoad ?? faculty.adminLoad,
          maxLoad: profileData.maxLoad ?? faculty.maxLoad,
        });
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
      console.error("Dashboard fetch error:", err);
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, selectedSemester, selectedAcademicYear]);

  const handleExportPDF = useCallback(async () => {
    if (!facultyId || !selectedSemester || !selectedAcademicYear || !profile) {
      return;
    }

    if (schedules.length === 0) {
      toast.error("No schedules found for the selected period");
      return;
    }

    setExportingPdf(true);
    try {
      await exportFacultyWorkload({
        facultyName: getFacultyFullName(profile.name),
        programName: profile.program.name || profile.program.courseCode,
        institute: "Baganga Campus",
        designation: profile.designation,
        employmentType: profile.employmentType,
        maxLoad: profile.maxLoad ?? workload?.maxLoad ?? 18,
        adminLoad: profile.adminLoad ?? 0,
        semester: selectedSemester,
        academicYear: selectedAcademicYear,
        schedules: schedules as Parameters<typeof exportFacultyWorkload>[0]["schedules"],
      });
      toast.success("Workload PDF exported successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
      throw err;
    } finally {
      setExportingPdf(false);
    }
  }, [
    facultyId,
    selectedSemester,
    selectedAcademicYear,
    profile,
    schedules,
    workload?.maxLoad,
  ]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "faculty") {
      router.push("/unauthorized");
      return;
    }

    autoSelectMostRecentSchedule();
  }, [authLoading, user, router, autoSelectMostRecentSchedule]);

  useEffect(() => {
    if (!authLoading && user && user.role === "faculty" && isSelectionInitialized) {
      fetchDashboardData();
    }
  }, [authLoading, user, isSelectionInitialized, fetchDashboardData]);

  if (authLoading || loading || !isSelectionInitialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/30 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  const mappedSchedules = schedules.map((s) => ({
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {selectedSemester}, Academic Year {selectedAcademicYear}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="semester-select" className="text-xs">
              Semester
            </Label>
            <Select value={selectedSemester || ""} onValueChange={setSelectedSemester}>
              <SelectTrigger id="semester-select" className="w-[120px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="year-select" className="text-xs">
              Academic Year
            </Label>
            <Select
              value={selectedAcademicYear || ""}
              onValueChange={setSelectedAcademicYear}
            >
              <SelectTrigger id="year-select" className="w-[140px]">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exportingPdf || schedules.length === 0}
          >
            {exportingPdf ? "Exporting..." : "Export Workload PDF"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FacultyProfileCard profile={profile} isLoading={false} />
        <WorkloadSummaryCard
          workload={
            workload
              ? {
                  totalTeachingHours: workload.totalTeachingHours,
                  lectureHours: workload.lectureHours,
                  labHours: workload.labHours,
                  totalUnits: workload.totalUnits,
                  preparations: workload.preparations,
                  maxLoad: workload.maxLoad,
                }
              : null
          }
          isLoading={false}
        />
      </div>

      <SubjectBreakdownTable
        subjects={workload?.subjectBreakdown || []}
        isLoading={false}
      />

      <FacultyScheduleList
        schedules={mappedSchedules}
        facultyId={facultyId}
        semester={selectedSemester || undefined}
        academicYear={selectedAcademicYear || undefined}
        onExportPDF={handleExportPDF}
        isLoading={false}
      />
    </div>
  );
}
