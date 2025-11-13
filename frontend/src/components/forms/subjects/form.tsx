"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FileText, Code, Hash, GraduationCap, CalendarDays, Building2, ListChecks } from "lucide-react";
import { useState, useMemo } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { subjectSchema } from "./schema";
import type { SubjectFormData, SubjectFormProps, ISubject } from "./types";
import { useSubjectForm } from "./useSubjectForm";
import { useCourses } from "@/hooks/useCourses";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubjects } from "@/hooks/useSubjects";

export function SubjectForm({
  initialData,
  mode = "create",
  onSuccess,
  onError,
  onCancel,
  className,
}: SubjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSubject, updateSubject } = useSubjectForm();
  const { courses, loading: loadingCourses } = useCourses();
  const { departments, loading: loadingDepartments } = useDepartments();

  // Extract initial course ID
  const initialCourseId = typeof initialData?.course === 'string'
    ? initialData.course
    : initialData?.course?._id || "";

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema) as never,
    defaultValues: {
      subjectCode: initialData?.subjectCode || "",
      subjectName: initialData?.subjectName || "",
      lectureUnits: initialData?.lectureUnits || 0,
      labUnits: initialData?.labUnits || 0,
      description: initialData?.description || "",
      course: initialCourseId,
      department: typeof initialData?.department === 'string'
        ? initialData.department
        : initialData?.department?._id || "",
      yearLevel: (initialData?.yearLevel as any) || "",
      semester: (initialData?.semester as any) || "",
      prerequisites: initialData?.prerequisites || [],
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const selectedCourse = watch("course");
  const selectedDepartment = watch("department");
  const lectureUnits = watch("lectureUnits");
  const labUnits = watch("labUnits");
  const selectedPrerequisites = watch("prerequisites") || [];

  // Fetch subjects for prerequisites selection
  const { subjects: availableSubjects, loading: loadingSubjects } = useSubjects({
    course: selectedCourse,
    autoFetch: !!selectedCourse,
  });

  // Calculate total units
  const totalUnits = useMemo(() => {
    return (lectureUnits || 0) + (labUnits || 0);
  }, [lectureUnits, labUnits]);

  // Filter out current subject from prerequisites if in edit mode
  const prerequisiteOptions = useMemo(() => {
    if (!availableSubjects) return [];

    const currentSubjectId = initialData?._id || initialData?.id;
    return availableSubjects.filter(
      (subject: ISubject) => subject._id !== currentSubjectId && subject.id !== currentSubjectId
    );
  }, [availableSubjects, initialData]);

  const onSubmit = async (data: SubjectFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Subject form data:", data);

      const response = mode === "create"
        ? await createSubject(data)
        : await updateSubject(initialData?._id || initialData?.id || "", data);

      if (response?.success) {
        onSuccess?.(response);
      } else {
        throw new Error("Failed to save subject");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save subject";
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrerequisiteToggle = (subjectId: string) => {
    const current = selectedPrerequisites || [];
    const newPrerequisites = current.includes(subjectId)
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId];
    setValue("prerequisites", newPrerequisites);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "create" ? "Add New Subject" : "Edit Subject"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Create a new subject for a course"
              : "Update subject information"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Information
            </CardTitle>
            <CardDescription>
              Basic information about the subject
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Code */}
            <Field>
              <FieldLabel>Subject Code *</FieldLabel>
              <div className="relative">
                <Code className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("subjectCode")}
                  placeholder="e.g., CS101"
                  className="pl-9"
                />
              </div>
              {errors.subjectCode && (
                <FieldDescription className="text-destructive">
                  {errors.subjectCode.message}
                </FieldDescription>
              )}
            </Field>

            {/* Subject Name */}
            <Field>
              <FieldLabel>Subject Name *</FieldLabel>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("subjectName")}
                  placeholder="e.g., Introduction to Computer Science"
                  className="pl-9"
                />
              </div>
              {errors.subjectName && (
                <FieldDescription className="text-destructive">
                  {errors.subjectName.message}
                </FieldDescription>
              )}
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                {...register("description")}
                placeholder="Subject description (optional)"
                rows={3}
                maxLength={1000}
              />
              {errors.description && (
                <FieldDescription className="text-destructive">
                  {errors.description.message}
                </FieldDescription>
              )}
              <FieldDescription>
                {watch("description")?.length || 0} / 1000 characters
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Units
            </CardTitle>
            <CardDescription>
              Define lecture and laboratory units
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lecture Units */}
              <Field>
                <FieldLabel>Lecture Units *</FieldLabel>
                <Input
                  type="number"
                  {...register("lectureUnits", { valueAsNumber: true })}
                  min={0}
                  max={12}
                  step={0.25}
                />
                {errors.lectureUnits && (
                  <FieldDescription className="text-destructive">
                    {errors.lectureUnits.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Lab Units */}
              <Field>
                <FieldLabel>Lab Units *</FieldLabel>
                <Input
                  type="number"
                  {...register("labUnits", { valueAsNumber: true })}
                  min={0}
                  max={12}
                  step={0.25}
                />
                {errors.labUnits && (
                  <FieldDescription className="text-destructive">
                    {errors.labUnits.message}
                  </FieldDescription>
                )}
              </Field>
            </div>

            {/* Total Units Display */}
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">
                Total Units: <span className="text-lg font-bold">{totalUnits}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lecture: {lectureUnits || 0} units, Lab: {labUnits || 0} units
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Course & Classification
            </CardTitle>
            <CardDescription>
              Assign to course, department, year level, and semester
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course */}
            <Field>
              <FieldLabel>Course *</FieldLabel>
              <Select
                onValueChange={(value) => setValue("course", value)}
                defaultValue={selectedCourse}
                disabled={loadingCourses}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.filter((course: any) => course._id || course.id).map((course: any) => (
                    <SelectItem key={course._id || course.id} value={course._id || course.id}>
                      {course.courseCode} - {course.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course && (
                <FieldDescription className="text-destructive">
                  {errors.course.message}
                </FieldDescription>
              )}
            </Field>

            {/* Department */}
            <Field>
              <FieldLabel>Department (Optional)</FieldLabel>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  onValueChange={(value) => setValue("department", value === "none" ? "" : value)}
                  value={selectedDepartment || "none"}
                  disabled={loadingDepartments}
                >
                  <SelectTrigger className="pl-9">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments?.filter((dept: any) => dept._id || dept.id).map((dept: any) => (
                      <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.department && (
                <FieldDescription className="text-destructive">
                  {errors.department.message}
                </FieldDescription>
              )}
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Year Level */}
              <Field>
                <FieldLabel>Year Level</FieldLabel>
                <Select
                  onValueChange={(value) => setValue("yearLevel", value === "none" ? "" : (value as any))}
                  value={watch("yearLevel") || "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                    <SelectItem value="5th Year">5th Year</SelectItem>
                  </SelectContent>
                </Select>
                {errors.yearLevel && (
                  <FieldDescription className="text-destructive">
                    {errors.yearLevel.message}
                  </FieldDescription>
                )}
              </Field>

              {/* Semester */}
              <Field>
                <FieldLabel>Semester</FieldLabel>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Select
                    onValueChange={(value) => setValue("semester", value === "none" ? "" : (value as any))}
                    value={watch("semester") || "none"}
                  >
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="1st Semester">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.semester && (
                  <FieldDescription className="text-destructive">
                    {errors.semester.message}
                  </FieldDescription>
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Prerequisites */}
        {selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Prerequisites
              </CardTitle>
              <CardDescription>
                Select subjects that are required before taking this subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubjects ? (
                <p className="text-sm text-muted-foreground">Loading subjects...</p>
              ) : prerequisiteOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No subjects available for prerequisites. Create subjects in this course first.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {prerequisiteOptions.filter((subject: ISubject) => subject._id || subject.id).map((subject: ISubject) => (
                    <label
                      key={subject._id || subject.id}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrerequisites.includes(subject._id || subject.id || "")}
                        onChange={() => handlePrerequisiteToggle(subject._id || subject.id || "")}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        {subject.subjectCode} - {subject.subjectName}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {errors.prerequisites && (
                <FieldDescription className="text-destructive mt-2">
                  {errors.prerequisites.message}
                </FieldDescription>
              )}
            </CardContent>
          </Card>
        )}

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
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
              ? "Create Subject"
              : "Update Subject"}
          </Button>
        </div>
      </form>
    </div>
  );
}

