"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FileText, Code, Hash, GraduationCap, Calendar, Beaker, ListChecks } from "lucide-react";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { SubjectFormData, SubjectFormProps } from "./types";
import { useSubjectForm } from "./useSubjectForm";
import CourseAPI from "@/lib/services/CourseAPI";
import { SubjectAPI } from "@/lib/services/SubjectAPI";

export function SubjectForm({
  initialData,
  mode = "create",
  onSuccess,
  onError,
  onCancel,
  className,
}: SubjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const { createSubject, updateSubject } = useSubjectForm();

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      subjectCode: initialData?.subjectCode || "",
      subjectName: initialData?.subjectName || "",
      units: initialData?.units || 3,
      description: initialData?.description || "",
      course: typeof initialData?.course === 'string' ? initialData.course : initialData?.course?._id || "",
      department: typeof initialData?.department === 'string' && initialData.department
        ? initialData.department
        : initialData?.department?._id || undefined,
      yearLevel: initialData?.yearLevel || undefined,
      semester: initialData?.semester || undefined,
      isLaboratory: initialData?.isLaboratory || false,
      prerequisites: Array.isArray(initialData?.prerequisites) 
        ? initialData.prerequisites.map((p: any) => typeof p === 'string' ? p : p._id)
        : [],
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
  const selectedPrerequisites = watch("prerequisites") || [];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await CourseAPI.getAll();
        setCourses(response.data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await SubjectAPI.getAll();
        setSubjects(response.data || []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  const onSubmit = async (data: SubjectFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up data - remove empty department field
      const cleanedData = { ...data };
      if (!cleanedData.department || cleanedData.department === "") {
        delete cleanedData.department;
      }

      const response = mode === "create"
        ? await createSubject(cleanedData)
        : await updateSubject(initialData?._id || initialData?.id || "", cleanedData);

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

  const togglePrerequisite = (subjectId: string) => {
    const current = selectedPrerequisites;
    const updated = current.includes(subjectId)
      ? current.filter((id: string) => id !== subjectId)
      : [...current, subjectId];
    setValue("prerequisites", updated);
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
              ? "Fill in the details to add a new subject."
              : "Update the subject information."}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the subject details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Code */}
              <Field>
                <FieldLabel htmlFor="subjectCode" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Subject Code
                </FieldLabel>
                <Input
                  id="subjectCode"
                  placeholder="e.g., CS101, MATH201"
                  {...register("subjectCode")}
                  aria-invalid={errors.subjectCode ? "true" : "false"}
                />
                {errors.subjectCode && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.subjectCode.message}
                  </FieldDescription>
                )}
                <FieldDescription>
                  Enter a unique code for the subject
                </FieldDescription>
              </Field>

              {/* Units */}
              <Field>
                <FieldLabel htmlFor="units" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Units
                </FieldLabel>
                <Input
                  id="units"
                  type="number"
                  min={0}
                  max={12}
                  placeholder="3"
                  {...register("units", { valueAsNumber: true })}
                  aria-invalid={errors.units ? "true" : "false"}
                />
                {errors.units && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.units.message}
                  </FieldDescription>
                )}
                <FieldDescription>
                  Enter the number of credit units (0-12)
                </FieldDescription>
              </Field>
            </div>

            {/* Subject Name - Full width */}
            <Field className="mt-4">
              <FieldLabel htmlFor="subjectName" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Subject Name
              </FieldLabel>
              <Input
                id="subjectName"
                placeholder="e.g., Introduction to Programming"
                {...register("subjectName")}
                aria-invalid={errors.subjectName ? "true" : "false"}
              />
              {errors.subjectName && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.subjectName.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Enter the full name of the subject
              </FieldDescription>
            </Field>

            {/* Description - Full width */}
            <Field className="mt-4">
              <FieldLabel htmlFor="description">
                Description (Optional)
              </FieldLabel>
              <Textarea
                id="description"
                placeholder="Enter subject description..."
                rows={3}
                {...register("description")}
              />
              <FieldDescription>
                Brief description of the subject
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Course & Curriculum */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Course & Curriculum
            </CardTitle>
            <CardDescription>
              Assign the subject to a course and specify curriculum details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Course - Full width */}
            <Field>
              <FieldLabel htmlFor="course" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Course (Degree Program)
              </FieldLabel>
              <Select
                value={selectedCourse}
                onValueChange={(value) => setValue("course", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCourses ? (
                    <SelectItem value="loading" disabled>
                      Loading courses...
                    </SelectItem>
                  ) : courses.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No courses available
                    </SelectItem>
                  ) : (
                    courses.map((course) => (
                      <SelectItem key={course._id || course.id} value={course._id || course.id}>
                        {course.courseCode} - {course.courseName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.course && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.course.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Select the degree program this subject belongs to
              </FieldDescription>
            </Field>

            {/* Year Level and Semester - Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field>
                <FieldLabel htmlFor="yearLevel" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Year Level (Optional)
                </FieldLabel>
                <Select
                  value={watch("yearLevel") || ""}
                  onValueChange={(value) => setValue("yearLevel", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                    <SelectItem value="5th Year">5th Year</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Select the year level for this subject
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="semester">
                  Semester (Optional)
                </FieldLabel>
                <Select
                  value={watch("semester") || ""}
                  onValueChange={(value) => setValue("semester", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Semester">1st Semester</SelectItem>
                    <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Select the semester for this subject
                </FieldDescription>
              </Field>
            </div>

            {/* Laboratory Checkbox */}
            <div className="mt-4 rounded-md border p-4">
              <div className="flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  id="isLaboratory"
                  checked={watch("isLaboratory")}
                  onCheckedChange={(checked) => setValue("isLaboratory", checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="isLaboratory"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Beaker className="h-4 w-4" />
                    Laboratory Subject
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Check if this subject requires laboratory facilities
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prerequisites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Prerequisites (Optional)
            </CardTitle>
            <CardDescription>
              Select subjects that are required before taking this subject.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {loadingSubjects ? (
                <p className="text-sm text-muted-foreground">Loading subjects...</p>
              ) : subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects available</p>
              ) : (
                subjects
                  .filter((s) => s._id !== initialData?._id && s._id !== initialData?.id)
                  .map((subject) => (
                    <div key={subject._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`prereq-${subject._id}`}
                        checked={selectedPrerequisites.includes(subject._id)}
                        onCheckedChange={() => togglePrerequisite(subject._id)}
                      />
                      <label
                        htmlFor={`prereq-${subject._id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {subject.subjectCode} - {subject.subjectName}
                      </label>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create Subject" : "Update Subject"}
          </Button>
        </div>
      </form>
    </div>
  );
}

