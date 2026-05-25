"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import APP_CONFIG from "@/config";
import { ScheduleAPI } from "@/lib/services/ScheduleAPI";
import type { MappedFacultySchedule } from "@/hooks/useFacultySemesterData";

interface Schedule {
  _id: string;
  timeSlot: { day: string; startTime: string; endTime: string };
  subject: { code: string; name: string };
  classroom: { name: string; building?: string };
  section?: { name: string };
  department: { name: string };
  scheduleType: "lecture" | "laboratory";
}

interface FacultyScheduleListProps {
  schedules: Schedule[];
  facultyId: string;
  semester?: string;
  academicYear?: string;
  title?: string;
  isLoading?: boolean;
  error?: string;
  onExportPDF?: () => Promise<void>;
  manageMode?: boolean;
  onScheduleDeleted?: () => void;
}

function buildAddScheduleUrl(
  facultyId: string,
  semester?: string,
  academicYear?: string
): string {
  const params = new URLSearchParams({ facultyId });
  if (semester) params.set("semester", semester);
  if (academicYear) params.set("academicYear", academicYear);
  return `/schedules/add?${params.toString()}`;
}

function ScheduleManageActions({
  schedule,
  onDelete,
}: {
  schedule: MappedFacultySchedule;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const success = await onDelete(schedule._id);
      if (success) {
        setDeleteOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 ml-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => router.push(`/schedules/${schedule._id}/edit`)}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit schedule</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete schedule</span>
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the schedule for{" "}
              <strong>
                {schedule.subject.code} - {schedule.subject.name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function FacultyScheduleList({
  schedules,
  facultyId,
  semester,
  academicYear,
  title = "My Schedules",
  isLoading,
  error,
  onExportPDF,
  manageMode = false,
  onScheduleDeleted,
}: FacultyScheduleListProps) {
  const router = useRouter();
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const canExport = Boolean(facultyId && semester && academicYear);
  const addScheduleUrl = buildAddScheduleUrl(facultyId, semester, academicYear);

  const handleDeleteSchedule = async (id: string): Promise<boolean> => {
    try {
      const response = await ScheduleAPI.delete(id);
      if (response?.success !== false) {
        toast.success("Schedule deleted successfully");
        onScheduleDeleted?.();
        return true;
      }
      toast.error("Failed to delete schedule");
      return false;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete schedule");
      return false;
    }
  };

  const handleExportCSV = async () => {
    if (!canExport || !semester || !academicYear) return;

    try {
      setExportingCsv(true);
      const token = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN_KEY);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

      const params = new URLSearchParams({
        semester,
        academicYear,
        export: "csv",
      });

      const response = await fetch(
        `${API_URL}/faculty/${facultyId}/schedules?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faculty-schedules-${semester.replace(/\s+/g, "-")}-${academicYear}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("CSV export failed:", err);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPDF = async () => {
    if (!onExportPDF) return;

    try {
      setExportingPdf(true);
      await onExportPDF();
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  if (isLoading) {
    return <FacultyScheduleListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const grouped = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const day = s.timeSlot.day.toLowerCase();
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort(
    (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
  );

  const formatTime = (time: string) => {
    if (time.includes("AM") || time.includes("PM")) return time;
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {manageMode && (
            <Button size="sm" onClick={() => router.push(addScheduleUrl)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          )}
          {!manageMode && onExportPDF && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exportingPdf || schedules.length === 0 || !canExport}
            >
              {exportingPdf ? "Exporting..." : "Export PDF"}
            </Button>
          )}
          {!manageMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exportingCsv || schedules.length === 0 || !canExport}
            >
              {exportingCsv ? "Exporting..." : "Export CSV"}
            </Button>
          )}
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground space-y-3">
          <p>No schedules found for this semester</p>
          {manageMode && (
            <Button variant="outline" onClick={() => router.push(addScheduleUrl)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y">
          {sortedDays.map((day) => (
            <div key={day} className="p-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">
                {formatDay(day)}
              </h4>
              <div className="space-y-2">
                {grouped[day]
                  .sort((a, b) =>
                    a.timeSlot.startTime.localeCompare(b.timeSlot.startTime)
                  )
                  .map((schedule) => (
                    <div
                      key={schedule._id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium text-sm">
                          {schedule.subject.code} - {schedule.subject.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.classroom.name}
                          {schedule.classroom.building &&
                            ` (${schedule.classroom.building})`}
                          {schedule.section && ` • ${schedule.section.name}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.department.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium">
                            {formatTime(schedule.timeSlot.startTime)} -{" "}
                            {formatTime(schedule.timeSlot.endTime)}
                          </p>
                          <Badge
                            variant={
                              schedule.scheduleType === "lecture"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              schedule.scheduleType === "lecture"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {schedule.scheduleType === "lecture"
                              ? "Lecture"
                              : "Laboratory"}
                          </Badge>
                        </div>
                        {manageMode && (
                          <ScheduleManageActions
                            schedule={schedule}
                            onDelete={handleDeleteSchedule}
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacultyScheduleListSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((day) => (
          <div key={day} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
