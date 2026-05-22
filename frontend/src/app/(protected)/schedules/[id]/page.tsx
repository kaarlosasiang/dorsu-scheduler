"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScheduleAPI, type ISchedule } from "@/lib/services/ScheduleAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  BookOpen,
  Users,
  MapPin,
  Clock,
  Calendar,
  Building2,
  Sparkles,
  Layers,
} from "lucide-react";

function formatDayPattern(days?: string[], fallbackDay?: string): string {
  const dayOrder: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };
  const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1, 3);

  const source =
    days && days.length > 0 ? days : fallbackDay ? [fallbackDay] : [];

  return [...source]
    .sort((a, b) => (dayOrder[a.toLowerCase()] || 0) - (dayOrder[b.toLowerCase()] || 0))
    .map(formatDay)
    .join(" ");
}

function getSubjectDisplay(schedule: ISchedule): { code: string; name: string } {
  const subject = typeof schedule.subject === "object" ? schedule.subject : null;
  return {
    code: subject?.subjectCode || subject?.code || "N/A",
    name: subject?.subjectName || subject?.name || "Unknown Course",
  };
}

function getFacultyName(schedule: ISchedule): string {
  const faculty = typeof schedule.faculty === "object" ? schedule.faculty : null;
  if (faculty?.name) {
    return `${faculty.name.first || ""} ${faculty.name.last || ""}`.trim();
  }
  if (faculty?.firstName && faculty?.lastName) {
    return `${faculty.firstName} ${faculty.lastName}`;
  }
  return "Unknown Faculty";
}

function getClassroomDisplay(schedule: ISchedule): string {
  const classroom = typeof schedule.classroom === "object" ? schedule.classroom : null;
  if (!classroom) return "Unknown Room";

  const room = classroom.roomNumber || classroom.displayName || classroom.name;
  const building = classroom.building;
  return building ? `${room} (${building})` : room || "Unknown Room";
}

function getSectionDisplay(schedule: ISchedule): string {
  const section =
    typeof schedule.section === "object"
      ? schedule.section
      : typeof schedule.sectionDetails === "object"
        ? schedule.sectionDetails
        : null;

  return section?.name || section?.sectionCode || "";
}

function getProgramDisplay(schedule: ISchedule): string {
  const department = typeof schedule.department === "object" ? schedule.department : null;
  if (department?.name) return department.name;

  const subject = typeof schedule.subject === "object" ? schedule.subject : null;
  const offering = subject?.courseOfferings?.[0];
  const course = offering?.course;
  if (typeof course === "object" && course) {
    return course.courseName || course.courseCode || "Unknown Program";
  }

  return department?.departmentName || "Unknown Program";
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "draft":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    case "archived":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    default:
      return "";
  }
}

export default function ScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [schedule, setSchedule] = useState<ISchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await ScheduleAPI.getById(id);
        if (response.success) {
          setSchedule(response.data);
        } else {
          setError("Failed to load schedule");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [id]);

  const subject = useMemo(
    () => (schedule ? getSubjectDisplay(schedule) : { code: "", name: "" }),
    [schedule]
  );

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Schedule not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/schedules")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schedules
        </Button>
      </div>
    );
  }

  const status = schedule.status || "draft";
  const dayDisplay = formatDayPattern(
    schedule.timeSlot?.days,
    schedule.timeSlot?.day
  );
  const timeDisplay =
    schedule.timeSlot?.startTime && schedule.timeSlot?.endTime
      ? `${schedule.timeSlot.startTime} - ${schedule.timeSlot.endTime}`
      : "N/A";
  const sectionDisplay = getSectionDisplay(schedule);

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <Button
          variant="link"
          size="sm"
          onClick={() => router.push("/schedules")}
          className="p-0 h-auto !px-0 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Schedules
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">{subject.code}</h1>
          <Badge className={getStatusBadgeClass(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {schedule.isGenerated && (
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Auto-Generated
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{subject.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Day</p>
              <Badge variant="outline" className="mt-1 font-medium">
                {dayDisplay || "—"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <p className="text-lg">{timeDisplay}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {schedule.scheduleType || "lecture"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Faculty & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Instructor</p>
              <p className="text-lg">{getFacultyName(schedule)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Room
              </p>
              <p className="text-lg">{getClassroomDisplay(schedule)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Program
                </p>
                <p className="mt-1 font-medium">{getProgramDisplay(schedule)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Semester
                </p>
                <p className="mt-1 font-medium">{schedule.semester || "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.academicYear || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Year Level</p>
                {schedule.yearLevel ? (
                  <Badge variant="outline" className="mt-1">
                    {schedule.yearLevel}
                  </Badge>
                ) : (
                  <p className="mt-1 text-muted-foreground">—</p>
                )}
              </div>
              {sectionDisplay && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Section
                  </p>
                  <Badge variant="outline" className="mt-1 font-mono">
                    {sectionDisplay}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
