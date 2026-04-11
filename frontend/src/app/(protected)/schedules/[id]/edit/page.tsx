"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ScheduleAPI } from "@/lib/services/ScheduleAPI";
import { FacultyAPI, type IFaculty } from "@/lib/services/FacultyAPI";
import { ClassroomAPI, type IClassroom } from "@/lib/services/ClassroomAPI";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, AlertCircle, Calendar, Clock, User, Building2 } from "lucide-react";
import { toast } from "sonner";

// ── Day patterns ──────────────────────────────────────────────────────────────

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

interface DayPattern {
  label: string;
  days: DayKey[];
  day: DayKey;
}

const DAY_PATTERNS: DayPattern[] = [
  { label: "M / W",   days: ["monday", "wednesday"],  day: "monday"    },
  { label: "M / F",   days: ["monday", "friday"],      day: "monday"    },
  { label: "W / F",   days: ["wednesday", "friday"],   day: "wednesday" },
  { label: "Tu / Th", days: ["tuesday", "thursday"],   day: "tuesday"   },
];

// Unique key that can round-trip back to a DayPattern
function dayPatternKey(p: DayPattern): string {
  return p.days.join(",");
}

const DAY_PATTERN_MAP = new Map<string, DayPattern>(
  DAY_PATTERNS.map((p) => [dayPatternKey(p), p])
);

// ── Time starts ───────────────────────────────────────────────────────────────

const LECTURE_TIME_STARTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30","16:00",
];

const LAB_TIME_STARTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30",
];

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFacultyFullName(f: IFaculty): string {
  const { first, middle, last, ext } = f.name;
  return [first, middle, last, ext].filter(Boolean).join(" ");
}

function getPatternFromDays(days?: string[]): DayPattern | undefined {
  if (!days || days.length === 0) return undefined;
  const key = [...days].sort().join(",");
  // Try sorted key first, then original order
  for (const [k, p] of DAY_PATTERN_MAP.entries()) {
    if ([...p.days].sort().join(",") === key) return p;
  }
  return undefined;
}

// ── Page component ────────────────────────────────────────────────────────────

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // ── Data loading ──
  const [schedule, setSchedule] = useState<any | null>(null);
  const [facultyList, setFacultyList] = useState<IFaculty[]>([]);
  const [classroomList, setClassroomList] = useState<IClassroom[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // ── Form state ──
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedDayPatternKey, setSelectedDayPatternKey] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedScheduleType, setSelectedScheduleType] = useState<"lecture" | "laboratory">("lecture");

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // ── Load data ──
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setPageLoading(true);
        const [schedRes, facultyRes, classroomRes] = await Promise.all([
          ScheduleAPI.getById(id),
          FacultyAPI.getAll({ status: "active" }),
          ClassroomAPI.getAll(),
        ]);

        if (!schedRes.success) {
          setPageError("Failed to load schedule");
          return;
        }

        const sched = schedRes.data;
        setSchedule(sched);
        setFacultyList(facultyRes.data ?? []);
        setClassroomList(classroomRes.data ?? []);

        // Pre-populate form from loaded schedule
        const facultyId =
          typeof sched.faculty === "object"
            ? sched.faculty._id ?? sched.faculty.id
            : sched.faculty;
        const classroomId =
          typeof sched.classroom === "object"
            ? sched.classroom._id ?? sched.classroom.id
            : sched.classroom;

        setSelectedFaculty(facultyId ?? "");
        setSelectedClassroom(classroomId ?? "");
        setSelectedScheduleType(
          (sched.scheduleType as "lecture" | "laboratory") ?? "lecture"
        );

        const slot = sched.timeSlot;
        if (slot) {
          // Prefer `days` array to identify the pattern; fall back to `day`
          const pattern =
            getPatternFromDays(slot.days) ??
            DAY_PATTERNS.find((p) => p.day === slot.day);
          if (pattern) setSelectedDayPatternKey(dayPatternKey(pattern));
          setSelectedStartTime(slot.startTime ?? "");
        }
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to load page");
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [id]);

  // ── Derived ──

  const timeStarts =
    selectedScheduleType === "laboratory" ? LAB_TIME_STARTS : LECTURE_TIME_STARTS;

  // Reset start time when schedule type changes if current time is no longer valid
  useEffect(() => {
    if (selectedStartTime && !timeStarts.includes(selectedStartTime)) {
      setSelectedStartTime("");
    }
  }, [selectedScheduleType, timeStarts, selectedStartTime]);

  // Subject course ObjectId (for grouping faculty)
  const subjectCourseId: string | null = useMemo(() => {
    if (!schedule) return null;
    const subj = schedule.subject;
    if (!subj) return null;
    const course = subj.course;
    if (!course) return null;
    return typeof course === "object" ? (course._id ?? course.id) : course;
  }, [schedule]);

  // Group faculty: program-matching first, then others
  const { programFaculty, otherFaculty } = useMemo(() => {
    const prog: IFaculty[] = [];
    const other: IFaculty[] = [];
    for (const f of facultyList) {
      const fProgId =
        typeof f.program === "object"
          ? (f.program as any)._id ?? (f.program as any).id
          : f.program;
      const fCode =
        typeof f.program === "object"
          ? (f.program as any).courseCode
          : undefined;

      if (subjectCourseId && fProgId === subjectCourseId) {
        prog.push(f);
      } else if (fCode === "GE") {
        // GE faculty appear right after program faculty
        prog.push(f);
      } else {
        other.push(f);
      }
    }
    return { programFaculty: prog, otherFaculty: other };
  }, [facultyList, subjectCourseId]);

  // ── Read-only display values ──

  const subjectDisplay = useMemo(() => {
    if (!schedule?.subject) return "—";
    const s = schedule.subject;
    return `${s.subjectCode} — ${s.subjectName}`;
  }, [schedule]);

  const sectionDisplay = useMemo(() => {
    if (!schedule?.section) return "—";
    const s = schedule.section;
    return typeof s === "object" ? (s.sectionCode ?? s.name ?? "—") : "—";
  }, [schedule]);

  // ── Submit ──

  const handleSave = async () => {
    if (!selectedFaculty || !selectedClassroom || !selectedDayPatternKey || !selectedStartTime) {
      setConflictError("Please fill in all required fields.");
      return;
    }

    const pattern = DAY_PATTERN_MAP.get(selectedDayPatternKey);
    if (!pattern) return;

    const durationMins = selectedScheduleType === "laboratory" ? 90 : 60;
    const endTime = addMinutes(selectedStartTime, durationMins);

    setConflictError(null);
    setSubmitting(true);

    try {
      const res = await ScheduleAPI.update(id, {
        faculty: selectedFaculty,
        classroom: selectedClassroom,
        scheduleType: selectedScheduleType,
        timeSlot: {
          day: pattern.day,
          days: pattern.days,
          startTime: selectedStartTime,
          endTime,
        },
      });

      if (res.success) {
        toast.success("Schedule updated successfully!");
        router.push("/schedules");
      } else {
        setConflictError(res.message ?? "Failed to update schedule");
      }
    } catch (err: any) {
      // The API throws with the conflict message as the error message
      const msg: string =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to update schedule";
      setConflictError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: loading / error ──

  if (pageLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading schedule…</p>
        </div>
      </div>
    );
  }

  if (pageError || !schedule) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{pageError ?? "Schedule not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Render: form ──

  return (
    <div className="container mx-auto max-w-3xl space-y-6">
      {/* Header */}
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
        <h1 className="text-2xl font-bold tracking-tight">Edit Schedule</h1>
        <p className="text-muted-foreground">
          Reassign faculty, classroom, or time slot for this schedule entry.
        </p>
      </div>

      {/* Conflict / validation error */}
      {conflictError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{conflictError}</AlertDescription>
        </Alert>
      )}

      {/* Read-only summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule Details</CardTitle>
          <CardDescription>These fields cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-0.5">Subject</p>
            <p className="font-medium">{subjectDisplay}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Section</p>
            <p className="font-medium">{sectionDisplay}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Semester</p>
            <p className="font-medium">{schedule.semester ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Year Level</p>
            <p className="font-medium">{schedule.yearLevel ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Status</p>
            <Badge variant={schedule.status === "published" ? "default" : "secondary"}>
              {schedule.status ?? "draft"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Editable fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment</CardTitle>
          <CardDescription>Update faculty, room, and time slot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Faculty */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              Faculty <span className="text-destructive">*</span>
            </label>
            <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
              <SelectTrigger>
                <SelectValue placeholder="Select faculty member…" />
              </SelectTrigger>
              <SelectContent>
                {programFaculty.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Program / GE Faculty</SelectLabel>
                    {programFaculty.map((f) => (
                      <SelectItem key={f._id ?? f.id} value={(f._id ?? f.id)!}>
                        {getFacultyFullName(f)}
                        {typeof f.program === "object" && (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            ({(f.program as any).courseCode})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {otherFaculty.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Other Faculty</SelectLabel>
                    {otherFaculty.map((f) => (
                      <SelectItem key={f._id ?? f.id} value={(f._id ?? f.id)!}>
                        {getFacultyFullName(f)}
                        {typeof f.program === "object" && (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            ({(f.program as any).courseCode})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Classroom */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Classroom <span className="text-destructive">*</span>
            </label>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger>
                <SelectValue placeholder="Select classroom…" />
              </SelectTrigger>
              <SelectContent>
                {classroomList.map((room) => (
                  <SelectItem key={room._id ?? room.id} value={(room._id ?? room.id)!}>
                    {room.building ? `${room.building} ${room.roomNumber}` : room.roomNumber}
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      (cap. {room.capacity})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Schedule type + day pattern + start time in a grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Schedule type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                Schedule Type <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedScheduleType}
                onValueChange={(v) => setSelectedScheduleType(v as "lecture" | "laboratory")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day pattern */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Days <span className="text-destructive">*</span>
              </label>
              <Select value={selectedDayPatternKey} onValueChange={setSelectedDayPatternKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select days…" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_PATTERNS.map((p) => (
                    <SelectItem key={dayPatternKey(p)} value={dayPatternKey(p)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start time */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Start Time <span className="text-destructive">*</span>
              </label>
              <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time…" />
                </SelectTrigger>
                <SelectContent>
                  {timeStarts.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTime(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Computed end-time preview */}
          {selectedStartTime && (
            <p className="text-xs text-muted-foreground">
              Session ends at{" "}
              <span className="font-medium">
                {formatTime(
                  addMinutes(
                    selectedStartTime,
                    selectedScheduleType === "laboratory" ? 90 : 60
                  )
                )}
              </span>{" "}
              ({selectedScheduleType === "laboratory" ? "1.5 hrs" : "1 hr"} per session)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/schedules")}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
