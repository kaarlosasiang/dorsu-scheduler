"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface Schedule {
  _id: string;
  timeSlot: { day: string; startTime: string; endTime: string };
  subject: { code: string; name: string };
  classroom: { name: string; building?: string };
  section?: { name: string };
  department: { name: string };
  scheduleType: 'lecture' | 'laboratory';
}

interface FacultyScheduleListProps {
  schedules: Schedule[];
  facultyId: string;
  isLoading?: boolean;
  error?: string;
}

export function FacultyScheduleList({ schedules, facultyId, isLoading, error }: FacultyScheduleListProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("access_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

      const response = await fetch(
        `${API_URL}/faculty/${facultyId}/schedules?semester=1st&academicYear=2024-2025&export=csv`,
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
      a.download = `faculty-schedules.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("CSV export failed:", err);
    } finally {
      setExporting(false);
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

  // Group schedules by day
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
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
    // Handle both 12h and 24h formats
    if (time.includes('AM') || time.includes('PM')) return time;
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg">My Schedules</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={exporting || schedules.length === 0}
        >
          {exporting ? "Exporting..." : "Export to CSV"}
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No schedules found for this semester
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
                  .sort((a, b) => a.timeSlot.startTime.localeCompare(b.timeSlot.startTime))
                  .map((schedule) => (
                    <div
                      key={schedule._id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {schedule.subject.code} - {schedule.subject.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.classroom.name}
                          {schedule.classroom.building && ` (${schedule.classroom.building})`}
                          {schedule.section && ` • ${schedule.section.name}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.department.name}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">
                          {formatTime(schedule.timeSlot.startTime)} - {formatTime(schedule.timeSlot.endTime)}
                        </p>
                        <Badge
                          variant={schedule.scheduleType === 'lecture' ? 'default' : 'secondary'}
                          className={
                            schedule.scheduleType === 'lecture'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {schedule.scheduleType === 'lecture' ? 'Lecture' : 'Laboratory'}
                        </Badge>
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
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
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
