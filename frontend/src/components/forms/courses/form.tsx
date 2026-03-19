"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FileText, Code, Plus, Layers, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { courseSchema } from "./schema";
import type { CourseFormData, CourseFormProps } from "./types";
import { useCourseForm } from "./useCourseForm";
import SectionAPI, { type ISection } from "@/lib/services/SectionAPI";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"] as const;
const YEAR_NUM_MAP: Record<string, number> = {
  "1st Year": 1, "2nd Year": 2, "3rd Year": 3, "4th Year": 4, "5th Year": 5,
};

interface PendingSection {
  yearLevel: string;
  sectionCode: string;
}

// ─── Sections Panel ───────────────────────────────────────────────────────────

interface SectionsPanelProps {
  mode: "create" | "edit";
  courseCode: string;
  programId?: string;
  pendingSections: PendingSection[];
  onPendingChange: (sections: PendingSection[]) => void;
}

const YEAR_LEVEL_LABELS: Record<string, string> = {
  "1st Year": "1st", "2nd Year": "2nd", "3rd Year": "3rd", "4th Year": "4th", "5th Year": "5th",
};

function SectionsPanel({ mode, courseCode, programId, pendingSections, onPendingChange }: SectionsPanelProps) {
  const [yearLevel, setYearLevel] = useState("");
  const [sectionCode, setSectionCode] = useState("");
  const [existingSections, setExistingSections] = useState<ISection[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [adding, setAdding] = useState(false);

  const yearNum = yearLevel ? YEAR_NUM_MAP[yearLevel] : "";
  const namePreview = (() => {
    if (!courseCode || !yearNum || !sectionCode.trim()) return "";
    const codes = sectionCode.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    return codes.map((c) => `${courseCode}-${yearNum}${c}`).join(", ");
  })();

  useEffect(() => {
    if (mode === "edit" && programId) {
      setLoadingSections(true);
      SectionAPI.getByProgram(programId)
        .then((res) => setExistingSections(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingSections(false));
    }
  }, [mode, programId]);

  function parseCodes(input: string) {
    return [...new Set(
      input.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
    )];
  }

  function handleAddPending() {
    if (!yearLevel || !sectionCode.trim()) return;
    const codes = parseCodes(sectionCode);
    const skipped: string[] = [];
    const toAdd: PendingSection[] = [];
    for (const code of codes) {
      const isDup = pendingSections.some((s) => s.yearLevel === yearLevel && s.sectionCode === code)
        || toAdd.some((s) => s.sectionCode === code);
      if (isDup) { skipped.push(code); continue; }
      toAdd.push({ yearLevel, sectionCode: code });
    }
    if (toAdd.length > 0) onPendingChange([...pendingSections, ...toAdd]);
    if (skipped.length > 0) toast.warning(`Skipped duplicates: ${skipped.join(", ")}`);
    setSectionCode("");
  }

  async function handleAddExisting() {
    if (!yearLevel || !sectionCode.trim() || !programId) return;
    const codes = parseCodes(sectionCode);
    setAdding(true);
    const added: string[] = [];
    const failed: string[] = [];
    try {
      const results = await Promise.allSettled(
        codes.map((code) => SectionAPI.create({ program: programId, yearLevel, sectionCode: code }))
      );
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          setExistingSections((prev) => [...prev, r.value.data]);
          added.push(r.value.data.name);
        } else {
          failed.push(codes[i]);
        }
      });
      if (added.length > 0) toast.success(`Added: ${added.join(", ")}`);
      if (failed.length > 0) toast.error(`Failed to add: ${failed.join(", ")}`);
      setSectionCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add sections");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteExisting(id: string, name: string) {
    try {
      await SectionAPI.delete(id);
      setExistingSections((prev) => prev.filter((s) => (s._id || s.id) !== id));
      toast.success(`Section ${name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete section");
    }
  }

  // Group sections by year level for display
  const allSections = mode === "create"
    ? pendingSections.map((s) => ({
        ...s,
        name: courseCode ? `${courseCode}-${YEAR_NUM_MAP[s.yearLevel]}${s.sectionCode}` : `${YEAR_NUM_MAP[s.yearLevel]}${s.sectionCode}`,
        id: `${s.yearLevel}:${s.sectionCode}`,
      }))
    : existingSections.map((s) => ({
        yearLevel: s.yearLevel,
        sectionCode: s.sectionCode,
        name: s.name,
        id: s._id || s.id || "",
      }));

  const grouped = YEAR_LEVELS.reduce((acc, yl) => {
    acc[yl] = allSections.filter((s) => s.yearLevel === yl);
    return acc;
  }, {} as Record<string, typeof allSections>);

  const hasAnySections = allSections.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Sections
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Optionally define sections to be created with this program (e.g., IT-1A, IT-1B). You can also add them later."
            : "Manage sections for this program."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Step 1: Year level toggle buttons */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Year Level</label>
          <div className="flex flex-wrap gap-2">
            {YEAR_LEVELS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYearLevel(yearLevel === y ? "" : y)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                  yearLevel === y
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                )}
              >
                {YEAR_LEVEL_LABELS[y]} Year
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Section code input — only shown after year level is selected */}
        {yearLevel && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Section Code <span className="text-muted-foreground font-normal">for {yearLevel}</span>
            </label>
            <div className="flex gap-2 items-center">
              <Input
                value={sectionCode}
                onChange={(e) => setSectionCode(e.target.value)}
                placeholder="A, B, C, D..."
                className="uppercase w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    mode === "edit" ? handleAddExisting() : handleAddPending();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={mode === "edit" ? handleAddExisting : handleAddPending}
                disabled={!sectionCode.trim() || adding}
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Add
              </Button>
            </div>
            {namePreview && (
              <p className="text-xs text-muted-foreground">
                Will create: <span className="font-mono font-semibold text-foreground">{namePreview}</span>
              </p>
            )}
          </div>
        )}

        {/* Sections grouped by year level */}
        {mode === "edit" && loadingSections ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasAnySections ? (
          <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
            {mode === "create" ? "No sections added. You can add them after saving." : "No sections yet. Add one above."}
          </p>
        ) : (
          <div className="space-y-3">
            {YEAR_LEVELS.filter((yl) => grouped[yl].length > 0).map((yl) => (
              <div key={yl}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{yl}</p>
                <div className="flex flex-wrap gap-1.5">
                  {grouped[yl].map((s) => (
                    <Badge key={s.id} variant="secondary" className="gap-1 pr-1.5 font-mono text-sm">
                      {s.name}
                      <button
                        type="button"
                        onClick={() =>
                          mode === "create"
                            ? onPendingChange(pendingSections.filter((p) => !(p.yearLevel === s.yearLevel && p.sectionCode === s.sectionCode)))
                            : handleDeleteExisting(s.id, s.name)
                        }
                        className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors leading-none"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function CourseForm({
  initialData,
  mode = "create",
  onSuccess,
  onError,
  onCancel,
  className,
}: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSections, setPendingSections] = useState<PendingSection[]>([]);
  const { createCourse, updateCourse } = useCourseForm();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema) as never,
    defaultValues: {
      courseCode: initialData?.courseCode || "",
      courseName: initialData?.courseName || "",
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const watchedCode = watch("courseCode");

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      const response = mode === "create"
        ? await createCourse(data)
        : await updateCourse(initialData?._id || initialData?.id || "", data);

      if (!response?.success) throw new Error("Failed to save program");

      // Create pending sections after program is saved
      if (mode === "create" && pendingSections.length > 0) {
        const programId = response.data._id || response.data.id || "";
        const results = await Promise.allSettled(
          pendingSections.map((s) =>
            SectionAPI.create({ program: programId, yearLevel: s.yearLevel, sectionCode: s.sectionCode })
          )
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.warning(`Program created, but ${failed} section(s) failed to create. You can add them manually.`);
        }
      }

      onSuccess?.(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save program";
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const programId = initialData?._id || initialData?.id;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "create" ? "Add New Program" : "Edit Program"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Fill in the details to add a new program."
              : "Update the program information."}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
        {/* Program Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Program Information
            </CardTitle>
            <CardDescription>
              Enter the program details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course Code */}
            <Field>
              <FieldLabel htmlFor="courseCode" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Program Code
              </FieldLabel>
              <Input
                id="courseCode"
                placeholder="e.g., BSA, BSAM, BSIT"
                {...register("courseCode")}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setValue("courseCode", value);
                }}
                aria-invalid={errors.courseCode ? "true" : "false"}
                disabled={mode === "edit"}
              />
              {errors.courseCode && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.courseCode.message}
                </FieldDescription>
              )}
              <FieldDescription>
                {mode === "edit"
                  ? "Program code cannot be changed"
                  : "Enter a unique code for the program (e.g., BSA, BSAM, BSIT)"}
              </FieldDescription>
            </Field>

            {/* Program Name */}
            <Field>
              <FieldLabel htmlFor="courseName" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Program Name
              </FieldLabel>
              <Input
                id="courseName"
                placeholder="e.g., Bachelor of Science in Agriculture"
                {...register("courseName")}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                    setValue("courseName", capitalized);
                  } else {
                    setValue("courseName", value);
                  }
                }}
                aria-invalid={errors.courseName ? "true" : "false"}
              />
              {errors.courseName && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.courseName.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Enter the full name of the program
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Sections */}
        <SectionsPanel
          mode={mode}
          courseCode={watchedCode}
          programId={programId}
          pendingSections={pendingSections}
          onPendingChange={setPendingSections}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (mode === "create" ? "Creating..." : "Updating...")
              : (mode === "create" ? "Create Program" : "Update Program")}
          </Button>
        </div>
      </form>
    </div>
  );
}
