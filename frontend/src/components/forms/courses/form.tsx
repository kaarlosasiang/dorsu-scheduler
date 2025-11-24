"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FileText, Code, Hash, Building2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { courseSchema } from "./schema";
import type { CourseFormData, CourseFormProps } from "./types";
import { useCourseForm } from "./useCourseForm";
import { useDepartments } from "@/hooks/useDepartments";

export function CourseForm({
  initialData,
  mode = "create",
  onSuccess,
  onError,
  onCancel,
  className,
}: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCourse, updateCourse } = useCourseForm();
  const { departments, loading: loadingDepartments } = useDepartments();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema) as never,
    defaultValues: {
      courseCode: initialData?.courseCode || "",
      courseName: initialData?.courseName || "",
      units: initialData?.units || 3,
      department: typeof initialData?.department === 'string'
        ? initialData.department
        : (initialData?.department as any)?._id || (initialData?.department as any)?.id || "",
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const selectedDepartment = watch("department");

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Course form data:", data);

      const response = mode === "create"
        ? await createCourse(data)
        : await updateCourse(initialData?._id || initialData?.id || "", data);

      if (response?.success) {
        onSuccess?.(response);
      } else {
        throw new Error("Failed to save course");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save course";
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "create" ? "Add New Course" : "Edit Course"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Fill in the details to add a new course."
              : "Update the course information."}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Information
            </CardTitle>
            <CardDescription>
              Enter the course details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course Code */}
            <Field>
              <FieldLabel htmlFor="courseCode" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Course Code
              </FieldLabel>
              <Input
                id="courseCode"
                placeholder="e.g., CS 101, MATH 201"
                {...register("courseCode")}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setValue("courseCode", value);
                }}
                aria-invalid={errors.courseCode ? "true" : "false"}
                disabled={mode === "edit"} // Prevent editing code in edit mode
              />
              {errors.courseCode && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.courseCode.message}
                </FieldDescription>
              )}
              <FieldDescription>
                {mode === "edit"
                  ? "Course code cannot be changed"
                  : "Enter a unique code for the course (letters, numbers, spaces, and hyphens)"}
              </FieldDescription>
            </Field>

            {/* Course Name */}
            <Field>
              <FieldLabel htmlFor="courseName" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Course Name
              </FieldLabel>
              <Input
                id="courseName"
                placeholder="e.g., Introduction to Computer Science"
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
                Enter the full name of the course
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
                max={10}
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
                Enter the number of credit units (0-10)
              </FieldDescription>
            </Field>

            {/* Department */}
            <Field>
              <FieldLabel htmlFor="department" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department
              </FieldLabel>
              <Select
                value={selectedDepartment}
                onValueChange={(value) => setValue("department", value)}
                disabled={loadingDepartments || isSubmitting}
              >
                <SelectTrigger id="department" aria-invalid={errors.department ? "true" : "false"}>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {loadingDepartments ? (
                    <SelectItem value="loading" disabled>
                      Loading departments...
                    </SelectItem>
                  ) : departments.length === 0 ? (
                    <SelectItem value="no-departments" disabled>
                      No departments available
                    </SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem
                        key={dept._id || dept.id}
                        value={dept._id || dept.id || ""}
                      >
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.department && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.department.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Select the department this course belongs to
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

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
          <Button
            type="submit"
            disabled={isSubmitting || loadingDepartments}
          >
            {isSubmitting
              ? (mode === "create" ? "Creating..." : "Updating...")
              : (mode === "create" ? "Create Course" : "Update Course")}
          </Button>
        </div>
      </form>
    </div>
  );
}

