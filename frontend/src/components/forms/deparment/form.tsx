"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, FileText, Code } from "lucide-react";
import { useState } from "react";

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

import { departmentSchema } from "./schema";
import type { DepartmentFormData, DepartmentFormProps } from "./types";
import { useDepartmentForm } from "./useDepartmentForm";

export function DepartmentForm({
  initialData,
  mode = "create",
  onSuccess,
  onError,
  onCancel,
  className,
}: DepartmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createDepartment, updateDepartment } = useDepartmentForm();

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema) as never,
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
    },
  });

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = form;

  const onSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Department form data:", data);

      const response = mode === "create"
        ? await createDepartment(data)
        : await updateDepartment(initialData?._id || initialData?.id || "", data);

      if (response?.success) {
        onSuccess?.(response);
      } else {
        throw new Error("Failed to save department");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save department";
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
            {mode === "create" ? "Add New Department" : "Edit Department"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Fill in the details to add a new department."
              : "Update the department's information."}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
        {/* Department Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Department Information
            </CardTitle>
            <CardDescription>
              Enter the department details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Department Code */}
            <Field>
              <FieldLabel htmlFor="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Department Code
              </FieldLabel>
              <Input
                id="code"
                placeholder="e.g., CS, IT, ENG"
                {...register("code")}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setValue("code", value);
                }}
                aria-invalid={errors.code ? "true" : "false"}
                disabled={mode === "edit"} // Prevent editing code in edit mode
              />
              {errors.code && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.code.message}
                </FieldDescription>
              )}
              <FieldDescription>
                {mode === "edit"
                  ? "Department code cannot be changed"
                  : "Enter a unique code for the department (letters and numbers only)"}
              </FieldDescription>
            </Field>

            {/* Department Name */}
            <Field>
              <FieldLabel htmlFor="name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department Name
              </FieldLabel>
              <Input
                id="name"
                placeholder="e.g., Computer Science"
                {...register("name")}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                    setValue("name", capitalized);
                  } else {
                    setValue("name", value);
                  }
                }}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.name.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Enter the full name of the department
              </FieldDescription>
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description (Optional)
              </FieldLabel>
              <Textarea
                id="description"
                placeholder="Enter a brief description of the department..."
                rows={4}
                {...register("description")}
                aria-invalid={errors.description ? "true" : "false"}
              />
              {errors.description && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.description.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Provide additional information about the department (optional)
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
              : (mode === "create" ? "Create Department" : "Update Department")}
          </Button>
        </div>
      </form>
    </div>
  );
}

