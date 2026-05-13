"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ScheduleAPI, type ITimeSlot } from "@/lib/services/ScheduleAPI";
import { FacultyAPI, type IFaculty } from "@/lib/services/FacultyAPI";
import { ClassroomAPI, type IClassroom } from "@/lib/services/ClassroomAPI";
import { SubjectAPI, type ISubject } from "@/lib/services/SubjectAPI";
import { DepartmentAPI, type IDepartment } from "@/lib/services/DepartmentAPI";
import { SectionAPI, type ISection } from "@/lib/services/SectionAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

interface DayPattern {
  label: string;
  days: DayKey[];
  day: DayKey;
}

const DAY_PATTERNS: DayPattern[] = [
  { label: "M / W",   days: ["monday", "wednesday"], day: "monday"    },
  { label: "M / F",   days: ["monday", "friday"],     day: "monday"    },
  { label: "W / F",   days: ["wednesday", "friday"],  day: "wednesday" },
  { label: "Tu / Th", days: ["tuesday", "thursday"],  day: "tuesday"   },
];

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

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const SEMESTERS   = ["1st Semester", "2nd Semester", "Summer"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function slotKey(slot: ITimeSlot): string {
  const days = slot.days && slot.days.length > 0 ? slot.days : [slot.day];
  return `${slot.startTime}|${[...days].sort().join(",")}`;
}

function patternKey(p: DayPattern): string {
  return [...p.days].sort().join(",");
}

function getFacultyFullName(f: IFaculty): string {
  const { first, middle, last, ext } = f.name;
  return [first, middle, last, ext].filter(Boolean).join(" ");
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddSchedulePage() {
  const router = useRouter();

  // ── Reference data ──
  const [subjects, setSubjects]       = useState<ISubject[]>([]);
  const [facultyList, setFacultyList] = useState<IFaculty[]>([]);
  const [classrooms, setClassrooms]   = useState<IClassroom[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [sections, setSections]       = useState<ISection[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // ── Form state ──
  const [semester, setSemester]           = useState("");
  const [academicYear, setAcademicYear]   = useState("");
  const [subjectId, setSubjectId]         = useState("");
  const [scheduleType, setScheduleType]   = useState<"lecture" | "laboratory">("lecture");
  const [departmentId, setDepartmentId]   = useState("");
  const [yearLevel, setYearLevel]         = useState("");
  const [sectionId, setSectionId]         = useState("");
  const [facultyId, setFacultyId]         = useState("");
  const [classroomId, setClassroomId]     = useState("");

  // ── Slot grid state ──
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [availableSet, setAvailableSet]   = useState<Set<string>>(new Set());
  const [occupiedMap, setOccupiedMap]     = useState<Map<string, string[]>>(new Map());
  const [selectedSlot, setSelectedSlot]   = useState<ITimeSlot | null>(null);
  const [slotsLoaded, setSlotsLoaded]     = useState(false);

  // ── Submit state ──
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ── Load reference data on mount ──
  useEffect(() => {
    Promise.all([
      SubjectAPI.getAll(),
      FacultyAPI.getAll({ status: "active" }),
      ClassroomAPI.getAll(),
      DepartmentAPI.getAll(),
    ]).then(([subj, fac, cls, dept]) => {
      setSubjects(subj.data ?? []);
      setFacultyList(fac.data ?? []);
      setClassrooms(cls.data ?? []);
      setDepartments(dept.data ?? []);
    }).catch(() => {
      toast.error("Failed to load form data");
    }).finally(() => setLoadingPage(false));
  }, []);

  // ── Auto-populate department when subject changes ──
  useEffect(() => {
    if (!subjectId) return;
    const subj = subjects.find(s => (s._id ?? s.id) === subjectId);
    if (!subj) return;
    if (subj.department) {
      const deptId = typeof subj.department === "object"
        ? subj.department._id ?? subj.department.id
        : subj.department;
      if (deptId) setDepartmentId(deptId);
    }
    // Reset downstream selections
    setYearLevel("");
    setSectionId("");
    setSelectedSlot(null);
    setSlotsLoaded(false);
  }, [subjectId, subjects]);

  // ── Load sections when subject + yearLevel are set ──
  useEffect(() => {
    if (!subjectId || !yearLevel) { setSections([]); setSectionId(""); return; }

    const subj = subjects.find(s => (s._id ?? s.id) === subjectId);
    if (!subj) return;

    // Find the program ID for this subject's offerings at this year level
    const offering = subj.courseOfferings?.find(o => o.yearLevel === yearLevel);
    const programId = offering
      ? (typeof offering.course === "object" ? offering.course._id : offering.course)
      : null;

    if (!programId) { setSections([]); return; }

    SectionAPI.getByProgramAndYearLevel(programId, yearLevel)
      .then(res => setSections(res.data ?? []))
      .catch(() => setSections([]));
  }, [subjectId, yearLevel, subjects]);

  // ── Fetch available slots when all required selector fields are set ──
  const canFetchSlots = !!(facultyId && classroomId && semester && academicYear && scheduleType);

  useEffect(() => {
    if (!canFetchSlots) {
      setAvailableSet(new Set());
      setOccupiedMap(new Map());
      setSelectedSlot(null);
      setSlotsLoaded(false);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsLoaded(false);
    setSelectedSlot(null);

    ScheduleAPI.getAvailableSlots({
      faculty: facultyId,
      classroom: classroomId,
      semester,
      academicYear,
      scheduleType,
      section: sectionId || undefined,
    }).then(res => {
      if (cancelled) return;
      const aSet = new Set<string>(res.data.available.map(slotKey));
      const oMap = new Map<string, string[]>(
        res.data.occupied.map(({ slot, reasons }) => [slotKey(slot), reasons])
      );
      setAvailableSet(aSet);
      setOccupiedMap(oMap);
      setSlotsLoaded(true);
    }).catch(() => {
      if (!cancelled) toast.error("Failed to load available slots");
    }).finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [facultyId, classroomId, semester, academicYear, scheduleType, sectionId, canFetchSlots]);

  // ── Derived ──
  const timeStarts = scheduleType === "laboratory" ? LAB_TIME_STARTS : LECTURE_TIME_STARTS;
  const durationMins = scheduleType === "laboratory" ? 90 : 60;

  const selectedSubject = useMemo(
    () => subjects.find(s => (s._id ?? s.id) === subjectId),
    [subjects, subjectId]
  );

  // Group faculty: program-matching first
  const subjectCourseIds = useMemo(() => {
    if (!selectedSubject) return new Set<string>();
    return new Set(
      selectedSubject.courseOfferings?.map(o =>
        typeof o.course === "object" ? o.course._id : o.course
      ).filter(Boolean) as string[]
    );
  }, [selectedSubject]);

  const { programFaculty, otherFaculty } = useMemo(() => {
    const prog: IFaculty[] = [];
    const other: IFaculty[] = [];
    for (const f of facultyList) {
      const fProgId = typeof f.program === "object"
        ? (f.program as any)._id ?? (f.program as any).id
        : f.program;
      const fCode = typeof f.program === "object"
        ? (f.program as any).courseCode
        : undefined;

      if (subjectCourseIds.has(fProgId) || fCode === "GE") {
        prog.push(f);
      } else {
        other.push(f);
      }
    }
    return { programFaculty: prog, otherFaculty: other };
  }, [facultyList, subjectCourseIds]);

  // ── Submit ──
  const handleSave = async () => {
    if (!semester || !academicYear || !subjectId || !departmentId || !facultyId || !classroomId || !selectedSlot) {
      setError("Please fill in all required fields and select a time slot.");
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(academicYear)) {
      setError("Academic year must be in YYYY-YYYY format (e.g. 2024-2025).");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await ScheduleAPI.create({
        subject: subjectId,
        faculty: facultyId,
        classroom: classroomId,
        department: departmentId,
        scheduleType,
        timeSlot: selectedSlot,
        semester,
        academicYear,
        yearLevel: yearLevel || undefined,
        section: sectionId || undefined,
        status: "draft",
      });

      if (res.success) {
        toast.success("Schedule created successfully!");
        router.push("/schedules");
      } else {
        setError((res as any).message ?? "Failed to create schedule");
      }
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ?? err?.message ?? "Failed to create schedule";
      setError(msg);
      // Refresh slot availability to reflect the conflict
      if (canFetchSlots) {
        ScheduleAPI.getAvailableSlots({
          faculty: facultyId,
          classroom: classroomId,
          semester,
          academicYear,
          scheduleType,
          section: sectionId || undefined,
        }).then(res => {
          setAvailableSet(new Set(res.data.available.map(slotKey)));
          setOccupiedMap(new Map(res.data.occupied.map(({ slot, reasons }) => [slotKey(slot), reasons])));
        }).catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loadingPage) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-3xl space-y-6 pb-12">

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
          <h1 className="text-2xl font-bold tracking-tight">Add Schedule</h1>
          <p className="text-muted-foreground text-sm">
            Manually assign a subject, faculty, classroom, and time slot.
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Card 1: Basic Info ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Info</CardTitle>
            <CardDescription>Semester, academic year, and schedule type.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Semester */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Semester <span className="text-destructive">*</span>
              </label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Academic Year <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. 2024-2025"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
              />
            </div>

            {/* Schedule Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Schedule Type <span className="text-destructive">*</span>
              </label>
              <Select
                value={scheduleType}
                onValueChange={v => {
                  setScheduleType(v as "lecture" | "laboratory");
                  setSelectedSlot(null);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* ── Card 2: Subject & Context ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject &amp; Context</CardTitle>
            <CardDescription>What subject is being scheduled and for whom.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Subject <span className="text-destructive">*</span>
              </label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject…" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s._id ?? s.id} value={(s._id ?? s.id)!}>
                      <span className="font-medium">{s.subjectCode}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {s.subjectName}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Department <span className="text-destructive">*</span>
                </label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d._id ?? d.id} value={(d._id ?? d.id)!}>
                        {d.code} — {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Level */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Year Level</label>
                <Select value={yearLevel} onValueChange={v => { setYearLevel(v); setSectionId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {YEAR_LEVELS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Section */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Section</label>
                <Select
                  value={sectionId}
                  onValueChange={setSectionId}
                  disabled={!yearLevel || sections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !yearLevel ? "Set year level first" :
                      sections.length === 0 ? "No sections" : "Optional"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(sec => (
                      <SelectItem key={sec._id ?? sec.id} value={(sec._id ?? sec.id)!}>
                        {sec.name ?? sec.sectionCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Assignment ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment</CardTitle>
            <CardDescription>Faculty member and classroom for this schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Faculty */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                Faculty <span className="text-destructive">*</span>
              </label>
              <Select value={facultyId} onValueChange={v => { setFacultyId(v); setSelectedSlot(null); }}>
                <SelectTrigger><SelectValue placeholder="Select faculty member…" /></SelectTrigger>
                <SelectContent>
                  {programFaculty.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Program / GE Faculty</SelectLabel>
                      {programFaculty.map(f => (
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
                      {otherFaculty.map(f => (
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
              <Select value={classroomId} onValueChange={v => { setClassroomId(v); setSelectedSlot(null); }}>
                <SelectTrigger><SelectValue placeholder="Select classroom…" /></SelectTrigger>
                <SelectContent>
                  {classrooms.map(room => (
                    <SelectItem key={room._id ?? room.id} value={(room._id ?? room.id)!}>
                      {room.building ? `${room.building} ${room.roomNumber}` : room.roomNumber}
                      <span className="text-muted-foreground ml-1.5 text-xs">(cap. {room.capacity})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* ── Card 4: Time Slot Grid ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Time Slot <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>
              {!canFetchSlots
                ? "Fill in faculty, classroom, semester, academic year, and schedule type to see available slots."
                : slotsLoading
                ? "Checking availability…"
                : slotsLoaded
                ? "Green = available · Gray = occupied. Click to select."
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canFetchSlots && (
              <p className="text-sm text-muted-foreground italic">
                Complete the fields above to load the availability grid.
              </p>
            )}

            {canFetchSlots && slotsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available slots…
              </div>
            )}

            {canFetchSlots && !slotsLoading && slotsLoaded && (
              <>
                {/* Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-muted-foreground font-medium pb-2 pr-3 whitespace-nowrap">
                          Time
                        </th>
                        {DAY_PATTERNS.map(p => (
                          <th key={p.label} className="text-center text-muted-foreground font-medium pb-2 px-1 whitespace-nowrap">
                            {p.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeStarts.map(start => {
                        const end = addMinutes(start, durationMins);
                        return (
                          <tr key={start}>
                            <td className="pr-3 py-0.5 text-muted-foreground whitespace-nowrap">
                              {formatTime(start)}
                            </td>
                            {DAY_PATTERNS.map(pattern => {
                              const candidateSlot: ITimeSlot = {
                                day: pattern.day,
                                days: pattern.days as ITimeSlot["days"],
                                startTime: start,
                                endTime: end,
                              };
                              const key = `${start}|${patternKey(pattern)}`;
                              const isAvailable = availableSet.has(key);
                              const reasons    = occupiedMap.get(key);
                              const isOccupied = !!reasons;
                              const isSelected =
                                selectedSlot?.startTime === start &&
                                slotKey(selectedSlot) === key;

                              if (isAvailable) {
                                return (
                                  <td key={pattern.label} className="px-1 py-0.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSlot(isSelected ? null : candidateSlot)}
                                      className={[
                                        "w-full rounded px-1.5 py-1 font-medium transition-colors",
                                        isSelected
                                          ? "bg-green-600 text-white ring-2 ring-green-700"
                                          : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300",
                                      ].join(" ")}
                                    >
                                      {isSelected ? <CheckCircle2 className="h-3 w-3 mx-auto" /> : "Free"}
                                    </button>
                                  </td>
                                );
                              }

                              if (isOccupied) {
                                return (
                                  <td key={pattern.label} className="px-1 py-0.5 text-center">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          disabled
                                          className="w-full rounded px-1.5 py-1 bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                        >
                                          Taken
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        {reasons!.join(" · ")}
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                );
                              }

                              // Slot not in either set (shouldn't happen, but fallback)
                              return (
                                <td key={pattern.label} className="px-1 py-0.5 text-center">
                                  <span className="text-muted-foreground">—</span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Selected slot summary */}
                {selectedSlot && (
                  <div className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      <span className="font-medium">
                        {DAY_PATTERNS.find(p => slotKey({ day: p.day, days: p.days as ITimeSlot["days"], startTime: selectedSlot.startTime, endTime: selectedSlot.endTime }) === slotKey(selectedSlot))?.label}
                      </span>
                      {" · "}
                      {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                      {" · "}
                      <Badge variant="outline" className="text-xs py-0">
                        {scheduleType === "laboratory" ? "1.5 hrs" : "1 hr"} per session
                      </Badge>
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/schedules")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting || !selectedSlot}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Schedule
          </Button>
        </div>

      </div>
    </TooltipProvider>
  );
}
