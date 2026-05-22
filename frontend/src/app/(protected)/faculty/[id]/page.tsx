"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FacultyProfileCard } from "@/components/faculty/FacultyProfileCard";
import { WorkloadSummaryCard } from "@/components/faculty/WorkloadSummaryCard";
import { SubjectBreakdownTable } from "@/components/faculty/SubjectBreakdownTable";
import { FacultyScheduleList } from "@/components/faculty/FacultyScheduleList";
import { FacultyAPI, type IFaculty } from "@/lib/services/FacultyAPI";
import { ScheduleAPI } from "@/lib/services/ScheduleAPI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FacultyProfile {
  name: { first: string; middle?: string; last: string; ext?: string };
  email: string;
  program: { _id: string; name: string; courseCode?: string };
  designation?: string;
  employmentType: "full-time" | "part-time";
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

function getFacultyFullName(faculty: IFaculty | null): string {
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

export default function FacultyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const facultyId = params.id as string;

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

      for (const year of ACADEMIC_YEARS) {
        for (const semester of SEMESTERS) {
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
        const profileData = profileRes.data;
        setProfile({
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
      console.error("Faculty detail fetch error:", err);
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

  const mappedSchedules = useMemo(
    () =>
      schedules.map((s) => ({
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
      })),
    [schedules]
  );

  if (!isSelectionInitialized || (loading && !faculty)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !faculty) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/faculty")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Faculty
        </Button>
      </div>
    );
  }

  const fullName = getFacultyFullName(faculty);
  const status = faculty?.status || "active";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Button
            variant="link"
            size="sm"
            onClick={() => router.push("/faculty")}
            className="p-0 h-auto !px-0 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Faculty
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status === "active" ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedSemester}, Academic Year {selectedAcademicYear}
          </p>
        </div>

        <div className="flex items-end gap-2">
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
            <Select value={selectedAcademicYear || ""} onValueChange={setSelectedAcademicYear}>
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
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
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
            title="Schedules"
            isLoading={false}
          />
        </>
      )}
    </div>
  );
}
