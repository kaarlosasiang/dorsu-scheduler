"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
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
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DAY_PATTERNS,
  formatTime,
  slotKey,
  patternKey,
} from "@/components/schedules/schedule-slot-utils";
import { ScheduleAvailabilityGrid } from "@/components/schedules/schedule-availability-grid";

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

// All possible time starts; filtered per-row by duration
const ALL_TIME_STARTS = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00",
];

const YEAR_LEVELS  = ["1st Year","2nd Year","3rd Year","4th Year","5th Year"];
const SEMESTERS    = ["1st Semester","2nd Semester","Summer"];

const DURATION_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1 hour"  },
  { value: 2, label: "2 hours" },
  { value: 3, label: "3 hours" },
];

// ── Subject-row type ──────────────────────────────────────────────────────────

interface SubjectRow {
  id: string;
  subjectId: string;
  programId: string;
  departmentId: string;
  yearLevel: string;
  sectionId: string;
  scheduleType: "lecture" | "laboratory";
  durationHours: 1 | 2 | 3;
  selectedSlot: ITimeSlot | null;
  sections: ISection[];
}

function makeRow(): SubjectRow {
  return {
    id: Math.random().toString(36).slice(2, 10),
    subjectId: "", programId: "", departmentId: "",
    yearLevel: "", sectionId: "", scheduleType: "lecture",
    durationHours: 1, selectedSlot: null, sections: [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  className?: string;
}

function Combobox({
  value, onChange, placeholder,
  searchPlaceholder = "Search…", emptyText = "No results.",
  disabled = false, items, className,
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
          className={cn("w-full justify-between font-normal", className)}
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
                  onSelect={() => { onChange(item.value); setOpen(false); }}
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
  const [subjects,    setSubjects]    = useState<ISubject[]>([]);
  const [facultyList, setFacultyList] = useState<IFaculty[]>([]);
  const [classrooms,  setClassrooms]  = useState<IClassroom[]>([]);
  const [courses,     setCourses]     = useState<ICourse[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // ── Shared form state ──
  const [semester,     setSemester]     = useState("");
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [facultyId,    setFacultyId]    = useState("");
  const [classroomId,  setClassroomId]  = useState("");

  // ── Multi-subject rows ──
  const initialRow = makeRow();
  const [rows,        setRows]        = useState<SubjectRow[]>([initialRow]);
  const [activeRowId, setActiveRowId] = useState<string>(initialRow.id);

  // ── Slot grid state (refreshed when active row / shared fields change) ──
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSet, setAvailableSet] = useState<Set<string>>(new Set());
  const [occupiedMap,  setOccupiedMap]  = useState<Map<string, string[]>>(new Map());
  const [slotsLoaded,  setSlotsLoaded]  = useState(false);

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Load all reference data on mount ──
  useEffect(() => {
    (async () => {
      const [subjRes, facRes, clsRes, courseRes] = await Promise.allSettled([
        SubjectAPI.getAll(),
        FacultyAPI.getAll({ status: "active" }),
        ClassroomAPI.getAll(),
        CourseAPI.getAll(),
      ]);
      if (subjRes.status   === "fulfilled") setSubjects(subjRes.value.data     ?? []);
      if (facRes.status    === "fulfilled") setFacultyList(facRes.value.data   ?? []);
      if (clsRes.status    === "fulfilled") setClassrooms(clsRes.value.data    ?? []);
      if (courseRes.status === "fulfilled") setCourses(courseRes.value.data    ?? []);
      setLoadingPage(false);
    })();
  }, []);

  // ── Row updater ──
  const updateRow = useCallback((id: string, patch: Partial<SubjectRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const addRow = () => {
    const row = makeRow();
    setRows(prev => [...prev, row]);
    setActiveRowId(row.id);
    setSlotsLoaded(false);
  };

  const removeRow = (id: string) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      return next.length > 0 ? next : [makeRow()];
    });
    if (activeRowId === id) {
      const remaining = rows.filter(r => r.id !== id);
      setActiveRowId(remaining[0]?.id ?? "");
    }
  };

  // ── Course → department lookup ──
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

  // ── Section loader ──
  const loadSections = useCallback(async (rowId: string, programId: string, yearLevel: string) => {
    if (!programId || !yearLevel) {
      updateRow(rowId, { sections: [], sectionId: "" });
      return;
    }
    try {
      const res = await SectionAPI.getByProgramAndYearLevel(programId, yearLevel);
      updateRow(rowId, { sections: res.data ?? [] });
    } catch {
      updateRow(rowId, { sections: [] });
    }
  }, [updateRow]);

  // ── Subject selected in a row ──
  const handleSubjectChange = useCallback(async (rowId: string, subjectId: string) => {
    if (!subjectId) { updateRow(rowId, { subjectId: "", selectedSlot: null }); return; }

    const subject = subjects.find(s => getEntityId(s) === subjectId);
    const patch: Partial<SubjectRow> = { subjectId, selectedSlot: null, sectionId: "" };

    if (subject?.semester) setSemester(subject.semester);

    const off = subject?.courseOfferings?.[0];
    if (off) {
      const pId = typeof off.course === "object" ? (off.course as any)._id : (off.course as string);
      if (pId) {
        patch.programId   = pId;
        patch.departmentId = courseDeptMap.get(pId) ?? "";
      }
    }

    const firstYL = subject?.courseOfferings?.map(o => o.yearLevel).find(yl => yl != null);
    if (firstYL) patch.yearLevel = firstYL;

    updateRow(rowId, patch);

    const programId  = (patch.programId  as string | undefined) ?? rows.find(r => r.id === rowId)?.programId  ?? "";
    const yearLevel  = (patch.yearLevel  as string | undefined) ?? rows.find(r => r.id === rowId)?.yearLevel  ?? "";
    if (programId && yearLevel) await loadSections(rowId, programId, yearLevel);
  }, [subjects, courseDeptMap, rows, updateRow, loadSections]);

  const handleProgramChange = useCallback(async (rowId: string, programId: string) => {
    const departmentId = programId ? (courseDeptMap.get(programId) ?? "") : "";
    updateRow(rowId, { programId, departmentId, sectionId: "", sections: [], selectedSlot: null });
    const row = rows.find(r => r.id === rowId);
    if (programId && row?.yearLevel) await loadSections(rowId, programId, row.yearLevel);
  }, [courseDeptMap, rows, updateRow, loadSections]);

  const handleYearLevelChange = useCallback(async (rowId: string, yearLevel: string) => {
    updateRow(rowId, { yearLevel, sectionId: "", sections: [], selectedSlot: null });
    const row = rows.find(r => r.id === rowId);
    if (row?.programId && yearLevel) await loadSections(rowId, row.programId, yearLevel);
  }, [rows, updateRow, loadSections]);

  // ── Faculty change clears all selected slots (availability changes) ──
  const handleFacultyChange = useCallback((fId: string) => {
    setFacultyId(fId);
    setRows(prev => prev.map(r => ({ ...r, selectedSlot: null })));
    setSlotsLoaded(false);
  }, []);

  // ── Combobox items ──
  const subjectItems = useMemo(
    () => subjects.map(s => ({ value: getEntityId(s), label: s.subjectCode, sub: s.subjectName })),
    [subjects]
  );

  // All faculty — no program filter
  const facultyItems = useMemo(
    () => facultyList.map(f => ({
      value: getEntityId(f),
      label: getFacultyFullName(f),
      sub: typeof f.program === "object" ? (f.program as any).courseCode : undefined,
    })),
    [facultyList]
  );

  const programItems = useMemo(
    () => courses.map(c => ({ value: getEntityId(c), label: c.courseCode, sub: c.courseName })),
    [courses]
  );

  // ── Active row ──
  const activeRow = useMemo(
    () => rows.find(r => r.id === activeRowId) ?? rows[0],
    [rows, activeRowId]
  );

  // ── Time starts for active row's duration (max end 17:00) ──
  const timeStarts = useMemo(() => {
    const durMin    = (activeRow?.durationHours ?? 1) * 60;
    const maxEndMin = 17 * 60;
    return ALL_TIME_STARTS.filter(s => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m + durMin <= maxEndMin;
    });
  }, [activeRow?.durationHours]);

  const durationMins = (activeRow?.durationHours ?? 1) * 60;

  // ── Fetch available slots whenever active row or shared fields change ──
  const canFetchSlots = !!(facultyId && classroomId && semester && academicYear && activeRow);

  useEffect(() => {
    if (!canFetchSlots) {
      setAvailableSet(new Set());
      setOccupiedMap(new Map());
      setSlotsLoaded(false);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsLoaded(false);

    ScheduleAPI.getAvailableSlots({
      faculty:       facultyId,
      classroom:     classroomId,
      semester,
      academicYear,
      scheduleType:  activeRow.scheduleType,
      durationHours: activeRow.durationHours,
      section:       activeRow.sectionId || undefined,
    }).then(res => {
      if (cancelled) return;
      setAvailableSet(new Set(res.data.available.map(slotKey)));
      setOccupiedMap(new Map(res.data.occupied.map(({ slot, reasons }) => [slotKey(slot), reasons])));
      setSlotsLoaded(true);
    }).catch(() => {
      if (!cancelled) toast.error("Failed to load available slots");
    }).finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [
    facultyId, classroomId, semester, academicYear,
    activeRowId,
    activeRow?.scheduleType, activeRow?.durationHours, activeRow?.sectionId,
    canFetchSlots,
  ]);

  // ── Year level options (from subject's courseOfferings or fallback) ──
  const getYearLevelOptions = (row: SubjectRow) => {
    const sub = subjects.find(s => getEntityId(s) === row.subjectId);
    if (!sub?.courseOfferings?.length) return YEAR_LEVELS;
    const fromSub = [...new Set(sub.courseOfferings.map(o => o.yearLevel).filter(Boolean) as string[])];
    return fromSub.length > 0 ? fromSub : YEAR_LEVELS;
  };

  // ── Save all rows ──
  const handleSave = async () => {
    if (!semester || !academicYear || !facultyId || !classroomId) {
      setError("Please fill in semester, academic year, faculty, and classroom.");
      return;
    }
    const incomplete = rows.filter(r => !r.subjectId || !r.programId || !r.selectedSlot);
    if (incomplete.length > 0) {
      setError(`${incomplete.length} subject(s) are missing a selection or time slot.`);
      return;
    }
    setError(null);
    setSubmitting(true);

    const results: { success: boolean; msg: string }[] = [];
    for (const row of rows) {
      try {
        const res = await ScheduleAPI.create({
          subject:      row.subjectId,
          faculty:      facultyId,
          classroom:    classroomId,
          department:   row.departmentId || undefined,
          scheduleType: row.scheduleType,
          timeSlot:     row.selectedSlot!,
          semester,
          academicYear,
          yearLevel: row.yearLevel  || undefined,
          section:   row.sectionId  || undefined,
          status:    "draft",
        });
        results.push({ success: res.success, msg: res.message });
      } catch (err: any) {
        const msg: string = err?.response?.data?.message ?? err?.message ?? "Failed";
        results.push({ success: false, msg });
      }
    }

    setSubmitting(false);
    const succeeded = results.filter(r => r.success).length;
    const failed    = results.filter(r => !r.success);

    if (failed.length === 0) {
      toast.success(`${succeeded} schedule(s) created successfully!`);
      router.push("/schedules");
    } else {
      if (succeeded > 0) toast.success(`${succeeded} created.`);
      setError(`${failed.length} failed: ${failed.map(f => f.msg).join("; ")}`);
    }
  };

  // ── Loading screen ──
  if (loadingPage) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const allHaveSlots = rows.every(r => r.selectedSlot && r.subjectId);

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-7xl pb-12">

        {/* Header */}
        <div className="mb-6">
          <Button variant="link" size="sm" onClick={() => router.push("/schedules")} className="p-0 h-auto !px-0 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Schedules
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Add Schedule</h1>
          <p className="text-muted-foreground text-sm">Manually assign subjects, faculty, classroom, and time slots.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 items-start">

          {/* ── Left column ── */}
          <div className="space-y-6">

            {/* Card 1: Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Info</CardTitle>
                <CardDescription>Semester and academic year applied to all subjects.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </CardContent>
            </Card>

            {/* Card 2: Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignment</CardTitle>
                <CardDescription>Faculty and classroom shared across all subjects.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Faculty <span className="text-destructive">*</span>
                  </label>
                  <Combobox
                    value={facultyId}
                    onChange={handleFacultyChange}
                    placeholder="Search faculty…"
                    searchPlaceholder="Type faculty name…"
                    emptyText="No faculty found."
                    items={facultyItems}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Classroom <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={classroomId}
                    onValueChange={v => {
                      setClassroomId(v);
                      setRows(prev => prev.map(r => ({ ...r, selectedSlot: null })));
                      setSlotsLoaded(false);
                    }}
                  >
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

            {/* Card 3: Subjects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Subjects</CardTitle>
                  <CardDescription>Add one or more subjects. Click a row to edit its time slot.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addRow}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subject
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {rows.map((row, idx) => {
                  const isActive = activeRowId === row.id;
                  const slotLabel = row.selectedSlot
                    ? `${DAY_PATTERNS.find(p => patternKey(p) === slotKey(row.selectedSlot!).split("|")[1])?.label} · ${formatTime(row.selectedSlot.startTime)}–${formatTime(row.selectedSlot.endTime)}`
                    : null;

                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "rounded-lg border p-4 space-y-3 cursor-pointer transition-all",
                        isActive
                          ? "border-primary/60 bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/40"
                      )}
                      onClick={() => { setActiveRowId(row.id); setSlotsLoaded(false); }}
                    >
                      {/* Row header */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Subject {idx + 1}
                          {isActive && (
                            <Badge variant="secondary" className="ml-2 text-xs py-0 font-normal">Active</Badge>
                          )}
                        </span>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {slotLabel && (
                            <Badge variant="outline" className="text-xs gap-1 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/20">
                              <CheckCircle2 className="h-3 w-3" />
                              {slotLabel}
                            </Badge>
                          )}
                          {rows.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRow(row.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Fields — stop click from activating row */}
                      <div className="space-y-3" onClick={e => e.stopPropagation()}>

                        {/* Subject */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Subject <span className="text-destructive">*</span>
                          </label>
                          <Combobox
                            value={row.subjectId}
                            onChange={v => handleSubjectChange(row.id, v)}
                            placeholder="Search subjects…"
                            searchPlaceholder="Type subject code or name…"
                            emptyText={subjects.length === 0 ? "No subjects loaded." : "No subject found."}
                            items={subjectItems}
                          />
                        </div>

                        {/* Program / Year / Section / Type / Duration */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Program <span className="text-destructive">*</span>
                            </label>
                            <Combobox
                              value={row.programId}
                              onChange={v => handleProgramChange(row.id, v)}
                              placeholder="Program…"
                              searchPlaceholder="Program…"
                              emptyText="No programs."
                              items={programItems}
                              className="h-9 text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Year Level</label>
                            <Select
                              value={row.yearLevel}
                              onValueChange={v => handleYearLevelChange(row.id, v)}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Year…" />
                              </SelectTrigger>
                              <SelectContent>
                                {getYearLevelOptions(row).map(y => (
                                  <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Section</label>
                            <Select
                              value={row.sectionId}
                              onValueChange={v => updateRow(row.id, { sectionId: v })}
                              disabled={!row.yearLevel || row.sections.length === 0}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder={
                                  !row.yearLevel        ? "Set year first"  :
                                  row.sections.length === 0 ? "No sections" : "Optional"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {row.sections.map(sec => (
                                  <SelectItem key={getEntityId(sec)} value={getEntityId(sec)}>
                                    {sec.name ?? sec.sectionCode}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Type</label>
                            <Select
                              value={row.scheduleType}
                              onValueChange={v => {
                                updateRow(row.id, { scheduleType: v as "lecture" | "laboratory", selectedSlot: null });
                                if (isActive) setSlotsLoaded(false);
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lecture">Lecture</SelectItem>
                                <SelectItem value="laboratory">Laboratory</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Duration</label>
                            <Select
                              value={String(row.durationHours)}
                              onValueChange={v => {
                                updateRow(row.id, { durationHours: Number(v) as 1 | 2 | 3, selectedSlot: null });
                                if (isActive) setSlotsLoaded(false);
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DURATION_OPTIONS.map(d => (
                                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                        </div>

                        {/* Hint */}
                        {!row.selectedSlot && isActive && canFetchSlots && slotsLoaded && (
                          <p className="text-xs text-primary/70 italic">Click a green slot in the grid on the right to assign a time →</p>
                        )}
                        {!row.selectedSlot && isActive && !canFetchSlots && (
                          <p className="text-xs text-muted-foreground italic">Fill faculty and classroom to see available time slots.</p>
                        )}

                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push("/schedules")} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={submitting || !allHaveSlots}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save {rows.length > 1 ? `${rows.length} Schedules` : "Schedule"}
              </Button>
            </div>

          </div>

          {/* ── Right column: Time Slot Grid (sticky) ── */}
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Time Slot <span className="text-destructive">*</span>
                </CardTitle>
                <CardDescription>
                  {!canFetchSlots
                    ? "Fill in faculty, classroom, semester, and year above."
                    : slotsLoading
                    ? "Checking availability…"
                    : slotsLoaded
                    ? `Subject ${rows.findIndex(r => r.id === activeRowId) + 1} · ${activeRow?.durationHours}hr · Green = free · Gray = taken`
                    : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>

                {!canFetchSlots && (
                  <p className="text-sm text-muted-foreground italic">
                    Availability grid will appear once faculty, classroom, semester, and academic year are filled.
                  </p>
                )}

                {canFetchSlots && slotsLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available slots…
                  </div>
                )}

                {canFetchSlots && !slotsLoading && slotsLoaded && (() => {
                  const otherSlots = rows
                    .filter(r => r.id !== activeRowId && r.selectedSlot)
                    .map(r => ({
                      slot: r.selectedSlot!,
                      label: `S${rows.findIndex(x => x.id === r.id) + 1}`,
                      tooltip: `Used by Subject ${rows.findIndex(x => x.id === r.id) + 1}`,
                    }));

                  return (
                    <ScheduleAvailabilityGrid
                      timeStarts={timeStarts}
                      durationMins={durationMins}
                      availableSet={availableSet}
                      occupiedMap={occupiedMap}
                      selectedSlot={activeRow?.selectedSlot ?? null}
                      onSelectSlot={(slot) =>
                        updateRow(activeRowId, { selectedSlot: slot })
                      }
                      reservedSlots={otherSlots}
                      selectedSlotSummary={
                        activeRow?.selectedSlot ? (
                          <div className="mt-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>
                              <span className="font-medium">
                                {DAY_PATTERNS.find(p => patternKey(p) === slotKey(activeRow.selectedSlot!).split("|")[1])?.label}
                              </span>
                              {" · "}
                              {formatTime(activeRow.selectedSlot.startTime)} – {formatTime(activeRow.selectedSlot.endTime)}
                              {" · "}
                              <Badge variant="outline" className="text-xs py-0">
                                {activeRow.durationHours} hr/session
                              </Badge>
                            </span>
                          </div>
                        ) : undefined
                      }
                    />
                  );
                })()}

              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}
