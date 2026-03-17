"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FileText, Code } from "lucide-react";
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

import { courseSchema } from "./schema";
import type { CourseFormData, CourseFormProps } from "./types";
import { useCourseForm } from "./useCourseForm";

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
  } = form;

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
        throw new Error("Failed to save program");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save program";
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
        {/* Course Information */}
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
                disabled={mode === "edit"} // Prevent editing code in edit mode
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
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (mode === "create" ? "Creating..." : "Updating...")
              : (mode === "create" ? "Create Program" : "Update Program")}
          </Button>
        </div>
      </form>
    </div>
  );
}

