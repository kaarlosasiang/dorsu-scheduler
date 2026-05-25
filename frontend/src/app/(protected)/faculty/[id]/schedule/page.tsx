"use client";

import { useRouter, useParams } from "next/navigation";
import { FacultyProfileCard } from "@/components/faculty/FacultyProfileCard";
import { WorkloadSummaryCard } from "@/components/faculty/WorkloadSummaryCard";
import { SubjectBreakdownTable } from "@/components/faculty/SubjectBreakdownTable";
import { FacultyScheduleList } from "@/components/faculty/FacultyScheduleList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
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
import {
  FACULTY_ACADEMIC_YEARS,
  FACULTY_SEMESTERS,
  getFacultyFullName,
  useFacultySemesterData,
} from "@/hooks/useFacultySemesterData";

function buildAddScheduleUrl(
  facultyId: string,
  semester: string | null,
  academicYear: string | null
): string {
  const params = new URLSearchParams({ facultyId });
  if (semester) params.set("semester", semester);
  if (academicYear) params.set("academicYear", academicYear);
  return `/schedules/add?${params.toString()}`;
}

export default function FacultyManageSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const facultyId = params.id as string;

  const {
    faculty,
    profile,
    workload,
    mappedSchedules,
    loading,
    error,
    selectedSemester,
    selectedAcademicYear,
    isSelectionInitialized,
    setSelectedSemester,
    setSelectedAcademicYear,
    refetch,
  } = useFacultySemesterData(facultyId);

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
            <h1 className="text-2xl font-semibold tracking-tight">
              Manage Schedule — {fullName}
            </h1>
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

        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="semester-select" className="text-xs">
              Semester
            </Label>
            <Select value={selectedSemester || ""} onValueChange={setSelectedSemester}>
              <SelectTrigger id="semester-select" className="w-[120px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {FACULTY_SEMESTERS.map((sem) => (
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
                {FACULTY_ACADEMIC_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() =>
              router.push(
                buildAddScheduleUrl(facultyId, selectedSemester, selectedAcademicYear)
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Button>
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
            semester={selectedSemester || undefined}
            academicYear={selectedAcademicYear || undefined}
            title="Assigned Schedules"
            isLoading={false}
            manageMode
            onScheduleDeleted={refetch}
          />
        </>
      )}
    </div>
  );
}
