"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ScheduleAPI, type ITimeSlot } from "@/lib/services/ScheduleAPI";
import { FacultyAPI, type IFaculty } from "@/lib/services/FacultyAPI";
import { ClassroomAPI, type IClassroom } from "@/lib/services/ClassroomAPI";
import { SubjectAPI, type ISubject } from "@/lib/services/SubjectAPI";
import CourseAPI, { type ICourse } from "@/lib/services/CourseAPI";
import SectionAPI, { type ISection } from "@/lib/services/SectionAPI";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  ChevronsUpDown,
  Check,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Academic year helpers ─────────────────────────────────────────────────────

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 5 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function buildAcademicYearOptions(count = 4): string[] {
  const [startStr] = getCurrentAcademicYear().split("-");
  const start = parseInt(startStr, 10);
  return Array.from({ length: count }, (_, i) => `${start + i}-${start + i + 1}`);
}

const ACADEMIC_YEAR_OPTIONS = buildAcademicYearOptions(4);

// ── Day / time constants ──────────────────────────────────────────────────────

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

interface DayPattern { label: string; days: DayKey[]; day: DayKey; }

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

const YEAR_LEVELS = ["1st Year","2nd Year","3rd Year","4th Year","5th Year"];
const SEMESTERS   = ["1st Semester","2nd Semester","Summer"];

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

function getEntityId(entity: any): string {
  return entity?._id ?? entity?.id ?? "";
}

// ── Combobox ──────────────────────────────────────────────────────────────────

interface ComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  items: { value: string; label: string; sub?: string }[];
}

function Combobox({
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  disabled = false,
  items,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.label}
              {selected.sub && (
                <span className="text-muted-foreground ml-1.5 text-xs">— {selected.sub}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map(item => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} ${item.sub ?? ""}`}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value === item.value ? "opacity-100" : "opacity-0")} />
                  <span>{item.label}</span>
                  {item.sub && (
                    <span className="ml-1.5 text-xs text-muted-foreground truncate">— {item.sub}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddSchedulePage() {
  const router = useRouter();

  // ── Reference data ──
  const [subjects, setSubjects]       = useState<ISubject[]>([]);
  const [facultyList, setFacultyList] = useState<IFaculty[]>([]);
  const [classrooms, setClassrooms]   = useState<IClassroom[]>([]);
  const [courses, setCourses]         = useState<ICourse[]>([]);
  const [sections, setSections]       = useState<ISection[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // ── Form state ──
  const [semester, setSemester]         = useState("");
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [subjectId, setSubjectId]       = useState("");
  const [scheduleType, setScheduleType] = useState<"lecture" | "laboratory">("lecture");
  const [programId, setProgramId]       = useState("");   // shown in form as "Program"
  const [departmentId, setDepartmentId] = useState("");   // derived from program, used in payload
  const [yearLevel, setYearLevel]       = useState("");
  const [sectionId, setSectionId]       = useState("");
  const [facultyId, setFacultyId]       = useState("");
  const [classroomId, setClassroomId]   = useState("");

  // ── Slot grid state ──
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSet, setAvailableSet] = useState<Set<string>>(new Set());
  const [occupiedMap, setOccupiedMap]   = useState<Map<string, string[]>>(new Map());
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [slotsLoaded, setSlotsLoaded]   = useState(false);

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Load all reference data on mount ──
  useEffect(() => {
    const load = async () => {
      const [subjRes, facRes, clsRes, courseRes] = await Promise.allSettled([
        SubjectAPI.getAll(),
        FacultyAPI.getAll({ status: "active" }),
        ClassroomAPI.getAll(),
        CourseAPI.getAll(),
      ]);

      if (subjRes.status === "fulfilled")   setSubjects(subjRes.value.data ?? []);
      if (facRes.status === "fulfilled")    setFacultyList(facRes.value.data ?? []);
      if (clsRes.status === "fulfilled")    setClassrooms(clsRes.value.data ?? []);
      if (courseRes.status === "fulfilled") setCourses(courseRes.value.data ?? []);

      setLoadingPage(false);
    };
    load();
  }, []);

  // ── Subject change: auto-populate department, semester, year level ──
  const selectedSubject = useMemo(
    () => subjects.find(s => getEntityId(s) === subjectId),
    [subjects, subjectId]
  );

  // ── Build course→department lookup (must be declared before any effect that uses it) ──
  const courseDeptMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) {
      const cId = getEntityId(c);
      const raw = (c as any).department;
      const dId = raw ? (typeof raw === "object" ? getEntityId(raw) : (raw as string)) : "";
      if (cId && dId) map.set(cId, dId);
    }
    return map;
  }, [courses]);

  useEffect(() => {
    if (!selectedSubject) return;

    // Pre-fill semester from subject
    if (selectedSubject.semester) setSemester(selectedSubject.semester);

    // Pre-fill program from first course offering
    const firstOffering = selectedSubject.courseOfferings?.[0];
    if (firstOffering) {
      const pId = typeof firstOffering.course === "object"
        ? firstOffering.course._id
        : (firstOffering.course as string);
      if (pId) setProgramId(pId);
    }

    // Pre-fill year level from first non-null offering
    const firstYearLevel = selectedSubject.courseOfferings
      ?.map(o => o.yearLevel)
      .find(yl => yl != null);
    if (firstYearLevel) setYearLevel(firstYearLevel);

    setSectionId("");
    setSelectedSlot(null);
    setSlotsLoaded(false);
  }, [subjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Program change: derive department for payload ──
  useEffect(() => {
    if (!programId) return;
    const dId = courseDeptMap.get(programId);
    if (dId) setDepartmentId(dId);
  }, [programId, courseDeptMap]);

  // ── Load sections when program + yearLevel are set ──
  useEffect(() => {
    if (!programId || !yearLevel) { setSections([]); setSectionId(""); return; }

    SectionAPI.getByProgramAndYearLevel(programId, yearLevel)
      .then(res => setSections(res.data ?? []))
      .catch(() => setSections([]));
  }, [programId, yearLevel]);

  // ── Faculty change: auto-populate department from faculty's program ──
  const handleFacultyChange = (fId: string) => {
    setFacultyId(fId);
    setSelectedSlot(null);
    setSlotsLoaded(false);

    if (!fId) return;
    const faculty = facultyList.find(f => getEntityId(f) === fId);
    if (!faculty) return;
    const progId = typeof faculty.program === "object"
      ? getEntityId(faculty.program)
      : (faculty.program as string | undefined) ?? "";
    const dId = courseDeptMap.get(progId);
    if (dId) setDepartmentId(dId);
  };

  // ── Faculty combobox items (filtered by selected program) ──
  const facultyItems = useMemo(() => {
    const list = programId
      ? facultyList.filter(f => {
          const fProgId = typeof f.program === "object"
            ? getEntityId(f.program)
            : (f.program as string | undefined) ?? "";
          return fProgId === programId;
        })
      : facultyList;
    return list.map(f => ({
      value: getEntityId(f),
      label: getFacultyFullName(f),
      sub: typeof f.program === "object" ? (f.program as any).courseCode : undefined,
    }));
  }, [facultyList, programId]);

  // ── Subject combobox items ──
  const subjectItems = useMemo(
    () => subjects.map(s => ({
      value: getEntityId(s),
      label: s.subjectCode,
      sub: s.subjectName,
    })),
    [subjects]
  );

  // ── Program combobox items ──
  const programItems = useMemo(
    () => courses.map(c => ({
      value: getEntityId(c),
      label: c.courseCode,
      sub: c.courseName,
    })),
    [courses]
  );

  // ── Fetch available slots ──
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
      setAvailableSet(new Set(res.data.available.map(slotKey)));
      setOccupiedMap(new Map(res.data.occupied.map(({ slot, reasons }) => [slotKey(slot), reasons])));
      setSlotsLoaded(true);
    }).catch(() => {
      if (!cancelled) toast.error("Failed to load available slots");
    }).finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [facultyId, classroomId, semester, academicYear, scheduleType, sectionId, canFetchSlots]);

  const timeStarts   = scheduleType === "laboratory" ? LAB_TIME_STARTS : LECTURE_TIME_STARTS;
  const durationMins = scheduleType === "laboratory" ? 90 : 60;

  // ── Year level options ──
  const yearLevelOptions = useMemo(() => {
    if (!selectedSubject?.courseOfferings?.length) return YEAR_LEVELS;
    const fromSubject = [
      ...new Set(selectedSubject.courseOfferings.map(o => o.yearLevel).filter(Boolean) as string[])
    ];
    return fromSubject.length > 0 ? fromSubject : YEAR_LEVELS;
  }, [selectedSubject]);

  // ── Submit ──
  const handleSave = async () => {
    if (!semester || !academicYear || !subjectId || !programId || !facultyId || !classroomId || !selectedSlot) {
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
      const msg: string = err?.response?.data?.message ?? err?.message ?? "Failed to create schedule";
      setError(msg);
      // Refresh grid on conflict
      if (canFetchSlots) {
        ScheduleAPI.getAvailableSlots({ faculty: facultyId, classroom: classroomId, semester, academicYear, scheduleType, section: sectionId || undefined })
          .then(r => {
            setAvailableSet(new Set(r.data.available.map(slotKey)));
            setOccupiedMap(new Map(r.data.occupied.map(({ slot, reasons }) => [slotKey(slot), reasons])));
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
          <Button variant="link" size="sm" onClick={() => router.push("/schedules")} className="p-0 h-auto !px-0 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Schedules
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Add Schedule</h1>
          <p className="text-muted-foreground text-sm">Manually assign a subject, faculty, classroom, and time slot.</p>
        </div>

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

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Semester <span className="text-destructive">*</span></label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue placeholder="Select semester…" /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Academic Year <span className="text-destructive">*</span></label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger><SelectValue placeholder="Select year…" /></SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEAR_OPTIONS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Schedule Type <span className="text-destructive">*</span></label>
              <Select value={scheduleType} onValueChange={v => { setScheduleType(v as "lecture" | "laboratory"); setSelectedSlot(null); }}>
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject <span className="text-destructive">*</span></label>
              <Combobox
                value={subjectId}
                onChange={v => { setSubjectId(v); setFacultyId(""); setSelectedSlot(null); setSlotsLoaded(false); }}
                placeholder="Search subjects…"
                searchPlaceholder="Type subject code or name…"
                emptyText={subjects.length === 0 ? "No subjects loaded." : "No subject found."}
                items={subjectItems}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Program <span className="text-destructive">*</span></label>
                <Combobox
                  value={programId}
                  onChange={v => { setProgramId(v); setSectionId(""); setFacultyId(""); setSelectedSlot(null); setSlotsLoaded(false); }}
                  placeholder="Select program…"
                  searchPlaceholder="Type program code or name…"
                  emptyText={courses.length === 0 ? "No programs loaded." : "No program found."}
                  items={programItems}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Year Level</label>
                <Select value={yearLevel} onValueChange={v => { setYearLevel(v); setSectionId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {yearLevelOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Section</label>
                <Select value={sectionId} onValueChange={setSectionId} disabled={!yearLevel || sections.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !yearLevel ? "Set year level first" :
                      sections.length === 0 ? "No sections" : "Optional"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(sec => (
                      <SelectItem key={getEntityId(sec)} value={getEntityId(sec)}>
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                Faculty <span className="text-destructive">*</span>
              </label>
              <Combobox
                value={facultyId}
                onChange={handleFacultyChange}
                placeholder="Search faculty…"
                searchPlaceholder="Type faculty name or program…"
                emptyText="No faculty found."
                items={facultyItems}
              />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Classroom <span className="text-destructive">*</span>
              </label>
              <Select value={classroomId} onValueChange={v => { setClassroomId(v); setSelectedSlot(null); setSlotsLoaded(false); }}>
                <SelectTrigger><SelectValue placeholder="Select classroom…" /></SelectTrigger>
                <SelectContent>
                  {classrooms.map(room => (
                    <SelectItem key={getEntityId(room)} value={getEntityId(room)}>
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
                ? "Complete faculty, classroom, semester, and academic year fields above to see available slots."
                : slotsLoading
                ? "Checking availability…"
                : slotsLoaded
                ? "Green = available · Gray = occupied. Click a slot to select."
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canFetchSlots && (
              <p className="text-sm text-muted-foreground italic">Availability grid will appear here once all required fields are filled.</p>
            )}

            {canFetchSlots && slotsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available slots…
              </div>
            )}

            {canFetchSlots && !slotsLoading && slotsLoaded && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-muted-foreground font-medium pb-2 pr-3 whitespace-nowrap">Time</th>
                        {DAY_PATTERNS.map(p => (
                          <th key={p.label} className="text-center text-muted-foreground font-medium pb-2 px-1 whitespace-nowrap">{p.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeStarts.map(start => {
                        const end = addMinutes(start, durationMins);
                        return (
                          <tr key={start}>
                            <td className="pr-3 py-0.5 text-muted-foreground whitespace-nowrap">{formatTime(start)}</td>
                            {DAY_PATTERNS.map(pattern => {
                              const candidate: ITimeSlot = { day: pattern.day, days: pattern.days as ITimeSlot["days"], startTime: start, endTime: end };
                              const key = `${start}|${patternKey(pattern)}`;
                              const isAvailable = availableSet.has(key);
                              const reasons    = occupiedMap.get(key);
                              const isSelected = selectedSlot ? slotKey(selectedSlot) === key : false;

                              if (isAvailable) {
                                return (
                                  <td key={pattern.label} className="px-1 py-0.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSlot(isSelected ? null : candidate)}
                                      className={cn(
                                        "w-full rounded px-1.5 py-1 font-medium transition-colors",
                                        isSelected
                                          ? "bg-green-600 text-white ring-2 ring-green-700"
                                          : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                                      )}
                                    >
                                      {isSelected ? <CheckCircle2 className="h-3 w-3 mx-auto" /> : "Free"}
                                    </button>
                                  </td>
                                );
                              }

                              if (reasons) {
                                return (
                                  <td key={pattern.label} className="px-1 py-0.5 text-center">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button type="button" disabled className="w-full rounded px-1.5 py-1 bg-muted text-muted-foreground cursor-not-allowed opacity-60">
                                          Taken
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">{reasons.join(" · ")}</TooltipContent>
                                    </Tooltip>
                                  </td>
                                );
                              }

                              return <td key={pattern.label} className="px-1 py-0.5 text-center"><span className="text-muted-foreground">—</span></td>;
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedSlot && (
                  <div className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      <span className="font-medium">
                        {DAY_PATTERNS.find(p => patternKey(p) === slotKey(selectedSlot).split("|")[1])?.label}
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
          <Button variant="outline" onClick={() => router.push("/schedules")} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting || !selectedSlot}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Schedule
          </Button>
        </div>

      </div>
    </TooltipProvider>
  );
}
