"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  ScheduleAPI,
  type IScheduleConflict,
  type ITimeSlot,
} from "@/lib/services/ScheduleAPI";
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
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DAY_PATTERNS,
  addMinutes,
  formatTime,
  slotKey,
  patternKey,
  filterTimeStartsByDuration,
} from "@/components/schedules/schedule-slot-utils";
import { ScheduleAvailabilityGrid } from "@/components/schedules/schedule-availability-grid";
import { ScheduleConflictModal } from "@/components/schedules/schedule-conflict-modal";

function getFacultyFullName(f: IFaculty): string {
  const { first, middle, last, ext } = f.name;
  return [first, middle, last, ext].filter(Boolean).join(" ");
}

function getEntityId(entity: unknown): string {
  if (!entity || typeof entity !== "object") return "";
  const e = entity as { _id?: string; id?: string };
  return e._id ?? e.id ?? "";
}

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const assignmentRef = useRef<HTMLDivElement>(null);

  const [schedule, setSchedule] = useState<Record<string, unknown> | null>(null);
  const [facultyList, setFacultyList] = useState<IFaculty[]>([]);
  const [classroomList, setClassroomList] = useState<IClassroom[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedScheduleType, setSelectedScheduleType] = useState<
    "lecture" | "laboratory"
  >("lecture");
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);

  const [availableSet, setAvailableSet] = useState<Set<string>>(new Set());
  const [occupiedMap, setOccupiedMap] = useState<Map<string, string[]>>(
    new Map()
  );
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflicts, setConflicts] = useState<IScheduleConflict[]>([]);
  const [fallbackConflictMessages, setFallbackConflictMessages] = useState<
    string[]
  >([]);
  const [vacantSlots, setVacantSlots] = useState<ITimeSlot[]>([]);
  const [vacantSlotsLoading, setVacantSlotsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ITimeSlot | null>(
    null
  );

  const sectionId = useMemo(() => {
    if (!schedule?.section) return "";
    return getEntityId(schedule.section);
  }, [schedule]);

  const subjectId = useMemo(() => {
    if (!schedule?.subject) return "";
    return getEntityId(schedule.subject);
  }, [schedule]);

  const semester = (schedule?.semester as string) ?? "";
  const academicYear = (schedule?.academicYear as string) ?? "";

  const durationMins = selectedScheduleType === "laboratory" ? 90 : 60;
  const durationHours = selectedScheduleType === "laboratory" ? 1.5 : 1;

  const timeStarts = useMemo(
    () => filterTimeStartsByDuration(durationMins),
    [durationMins]
  );

  const canFetchSlots = !!(
    selectedFaculty &&
    selectedClassroom &&
    semester &&
    academicYear
  );

  const loadVacantSlots = useCallback(async () => {
    if (!canFetchSlots) return [];
    setVacantSlotsLoading(true);
    try {
      const res = await ScheduleAPI.getAvailableSlots({
        faculty: selectedFaculty,
        classroom: selectedClassroom,
        semester,
        academicYear,
        scheduleType: selectedScheduleType,
        durationHours,
        section: sectionId || undefined,
        excludeId: id,
      });
      const slots = res.data?.available ?? [];
      setVacantSlots(slots);
      return slots;
    } catch {
      setVacantSlots([]);
      return [];
    } finally {
      setVacantSlotsLoading(false);
    }
  }, [
    canFetchSlots,
    selectedFaculty,
    selectedClassroom,
    semester,
    academicYear,
    selectedScheduleType,
    durationHours,
    sectionId,
    id,
  ]);

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

        const sched = schedRes.data as unknown as Record<string, unknown>;
        setSchedule(sched);
        setFacultyList(facultyRes.data ?? []);
        setClassroomList(classroomRes.data ?? []);

        setSelectedFaculty(getEntityId(sched.faculty));
        setSelectedClassroom(getEntityId(sched.classroom));
        setSelectedScheduleType(
          (sched.scheduleType as "lecture" | "laboratory") ?? "lecture"
        );

        const slot = sched.timeSlot as ITimeSlot | undefined;
        if (slot?.startTime && slot?.endTime) {
          setSelectedSlot(slot);
        }
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : "Failed to load page"
        );
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [id]);

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
      faculty: selectedFaculty,
      classroom: selectedClassroom,
      semester,
      academicYear,
      scheduleType: selectedScheduleType,
      durationHours,
      section: sectionId || undefined,
      excludeId: id,
    })
      .then((res) => {
        if (cancelled) return;
        setAvailableSet(new Set(res.data.available.map(slotKey)));
        setOccupiedMap(
          new Map(
            res.data.occupied.map(({ slot, reasons }) => [
              slotKey(slot),
              reasons,
            ])
          )
        );
        setSlotsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load available slots");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    canFetchSlots,
    selectedFaculty,
    selectedClassroom,
    semester,
    academicYear,
    selectedScheduleType,
    durationHours,
    sectionId,
    id,
  ]);

  useEffect(() => {
    if (!selectedSlot?.startTime) return;
    const expectedEnd = addMinutes(selectedSlot.startTime, durationMins);
    if (selectedSlot.endTime === expectedEnd) return;
    setSelectedSlot((prev) =>
      prev ? { ...prev, endTime: expectedEnd } : null
    );
  }, [durationMins, selectedSlot?.startTime, selectedSlot?.endTime]);

  const subjectCourseId: string | null = useMemo(() => {
    if (!schedule?.subject) return null;
    const subj = schedule.subject as Record<string, unknown>;
    const course = subj.course;
    if (!course) return null;
    return getEntityId(course);
  }, [schedule]);

  const { programFaculty, otherFaculty } = useMemo(() => {
    const prog: IFaculty[] = [];
    const other: IFaculty[] = [];
    for (const f of facultyList) {
      const fProgId = getEntityId(f.program);
      const fCode =
        typeof f.program === "object" && f.program
          ? (f.program as { courseCode?: string }).courseCode
          : undefined;

      if (subjectCourseId && fProgId === subjectCourseId) {
        prog.push(f);
      } else if (fCode === "GE") {
        prog.push(f);
      } else {
        other.push(f);
      }
    }
    return { programFaculty: prog, otherFaculty: other };
  }, [facultyList, subjectCourseId]);

  const subjectDisplay = useMemo(() => {
    if (!schedule?.subject) return "—";
    const s = schedule.subject as { subjectCode?: string; subjectName?: string };
    return `${s.subjectCode} — ${s.subjectName}`;
  }, [schedule]);

  const sectionDisplay = useMemo(() => {
    if (!schedule?.section) return "—";
    const s = schedule.section as { sectionCode?: string; name?: string };
    return s.sectionCode ?? s.name ?? "—";
  }, [schedule]);

  const selectedSlotConflictReasons = useMemo(() => {
    if (!selectedSlot) return null;
    return occupiedMap.get(slotKey(selectedSlot)) ?? null;
  }, [selectedSlot, occupiedMap]);

  const buildTimeSlot = (): ITimeSlot | null => {
    if (!selectedSlot) return null;
    return {
      day: selectedSlot.day,
      days: selectedSlot.days,
      startTime: selectedSlot.startTime,
      endTime: addMinutes(selectedSlot.startTime, durationMins),
    };
  };

  const performUpdate = async (timeSlot: ITimeSlot) => {
    const res = await ScheduleAPI.update(id, {
      faculty: selectedFaculty,
      classroom: selectedClassroom,
      scheduleType: selectedScheduleType,
      timeSlot,
    });

    if (res.success) {
      toast.success("Schedule updated successfully!");
      router.push("/schedules");
      return true;
    }

    throw new Error(res.message ?? "Failed to update schedule");
  };

  const openConflictModal = async (
    detectedConflicts: IScheduleConflict[],
    fallback: string[] = []
  ) => {
    setConflicts(detectedConflicts);
    setFallbackConflictMessages(fallback);
    setSelectedSuggestion(null);
    setConflictModalOpen(true);
    await loadVacantSlots();
  };

  const handleSave = async () => {
    if (!selectedFaculty || !selectedClassroom || !selectedSlot) {
      setValidationError(
        "Please select faculty, classroom, and a time slot."
      );
      return;
    }

    const timeSlot = buildTimeSlot();
    if (!timeSlot) return;

    setValidationError(null);
    setSubmitting(true);

    try {
      const detectRes = await ScheduleAPI.detectConflicts({
        _id: id,
        faculty: selectedFaculty,
        classroom: selectedClassroom,
        section: sectionId || undefined,
        subject: subjectId,
        semester,
        academicYear,
        scheduleType: selectedScheduleType,
        timeSlot,
      });

      const errorConflicts =
        detectRes.conflicts?.filter((c) => c.severity === "error") ?? [];

      if (detectRes.hasConflicts && errorConflicts.length > 0) {
        await openConflictModal(errorConflicts);
        return;
      }

      await performUpdate(timeSlot);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const msg =
        axiosErr?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to update schedule");

      if (
        axiosErr?.response?.status === 409 ||
        msg.toLowerCase().includes("conflict")
      ) {
        const parts = msg
          .replace(/^Cannot update schedule:\s*/i, "")
          .split("; ")
          .filter(Boolean);
        await openConflictModal([], parts);
      } else {
        setValidationError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!selectedSuggestion) return;
    setSelectedSlot(selectedSuggestion);
    setConflictModalOpen(false);
    setConflicts([]);
    setFallbackConflictMessages([]);
    toast.info("Vacant slot applied. Review and save again.");
  };

  const handleChangeAssignment = () => {
    setConflictModalOpen(false);
    assignmentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-7xl space-y-6 pb-12">
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

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {selectedSlotConflictReasons && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This slot has conflicts: {selectedSlotConflictReasons.join(" · ")}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 items-start">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule Details</CardTitle>
                <CardDescription>
                  These fields cannot be changed here.
                </CardDescription>
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
                  <p className="font-medium">{semester || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Year Level</p>
                  <p className="font-medium">
                    {(schedule.yearLevel as string) ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Status</p>
                  <Badge
                    variant={
                      schedule.status === "published" ? "default" : "secondary"
                    }
                  >
                    {(schedule.status as string) ?? "draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card ref={assignmentRef}>
              <CardHeader>
                <CardTitle className="text-base">Assignment</CardTitle>
                <CardDescription>
                  Update faculty, room, and schedule type.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Faculty <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedFaculty}
                    onValueChange={setSelectedFaculty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty member…" />
                    </SelectTrigger>
                    <SelectContent>
                      {programFaculty.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Program / GE Faculty</SelectLabel>
                          {programFaculty.map((f) => (
                            <SelectItem
                              key={getEntityId(f)}
                              value={getEntityId(f)}
                            >
                              {getFacultyFullName(f)}
                              {typeof f.program === "object" && f.program && (
                                <span className="text-muted-foreground ml-1.5 text-xs">
                                  (
                                  {(f.program as { courseCode?: string })
                                    .courseCode}
                                  )
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
                            <SelectItem
                              key={getEntityId(f)}
                              value={getEntityId(f)}
                            >
                              {getFacultyFullName(f)}
                              {typeof f.program === "object" && f.program && (
                                <span className="text-muted-foreground ml-1.5 text-xs">
                                  (
                                  {(f.program as { courseCode?: string })
                                    .courseCode}
                                  )
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

                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Classroom <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedClassroom}
                    onValueChange={setSelectedClassroom}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classroom…" />
                    </SelectTrigger>
                    <SelectContent>
                      {classroomList.map((room) => (
                        <SelectItem
                          key={getEntityId(room)}
                          value={getEntityId(room)}
                        >
                          {room.building
                            ? `${room.building} ${room.roomNumber}`
                            : room.roomNumber}
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            (cap. {room.capacity})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Schedule Type <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedScheduleType}
                    onValueChange={(v) =>
                      setSelectedScheduleType(v as "lecture" | "laboratory")
                    }
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
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/schedules")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time Slot <span className="text-destructive">*</span>
              </CardTitle>
              <CardDescription>
                {!canFetchSlots
                  ? "Select faculty and classroom to see availability."
                  : slotsLoading
                  ? "Checking availability…"
                  : slotsLoaded
                  ? `Green = free · Gray = taken · ${selectedScheduleType === "laboratory" ? "1.5" : "1"} hr/session`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canFetchSlots && (
                <p className="text-sm text-muted-foreground italic">
                  Availability grid will appear once faculty and classroom are
                  selected.
                </p>
              )}

              {canFetchSlots && slotsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available slots…
                </div>
              )}

              {canFetchSlots && !slotsLoading && slotsLoaded && (
                <ScheduleAvailabilityGrid
                  timeStarts={timeStarts}
                  durationMins={durationMins}
                  availableSet={availableSet}
                  occupiedMap={occupiedMap}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  selectedSlotSummary={
                    selectedSlot ? (
                      <div className="mt-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>
                          <span className="font-medium">
                            {
                              DAY_PATTERNS.find(
                                (p) =>
                                  patternKey(p) ===
                                  slotKey(selectedSlot).split("|")[1]
                              )?.label
                            }
                          </span>
                          {" · "}
                          {formatTime(selectedSlot.startTime)} –{" "}
                          {formatTime(selectedSlot.endTime)}
                          {" · "}
                          <Badge variant="outline" className="text-xs py-0">
                            {selectedScheduleType === "laboratory"
                              ? "1.5 hrs"
                              : "1 hr"}
                            /session
                          </Badge>
                        </span>
                      </div>
                    ) : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        <ScheduleConflictModal
          open={conflictModalOpen}
          onOpenChange={setConflictModalOpen}
          conflicts={conflicts}
          fallbackMessages={fallbackConflictMessages}
          vacantSlots={vacantSlots}
          slotsLoading={vacantSlotsLoading}
          selectedSuggestion={selectedSuggestion}
          onSelectSuggestion={setSelectedSuggestion}
          onApplySuggestion={handleApplySuggestion}
          onChangeAssignment={handleChangeAssignment}
        />
      </div>
    </TooltipProvider>
  );
}
