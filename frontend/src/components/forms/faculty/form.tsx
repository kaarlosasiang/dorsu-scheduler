"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Building2, Activity, Clock, Briefcase, Mail, Image, Shield, KeyRound, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";

import { facultySchema } from "./schema";
import type { FacultyFormData, FacultyFormProps } from "./types";
import { useFacultyForm } from "./useFacultyForm";
import { 
  STATUS_OPTIONS, 
  EMPLOYMENT_TYPE_OPTIONS 
} from "./types";
import { useCourses } from "@/hooks/useCourses";

export function FacultyForm({
  initialData,
  mode = "create",
  onSuccess,
  onError,
  onCancel,
  className,
}: FacultyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { createFaculty, updateFaculty } = useFacultyForm();
  const { courses, loading: programsLoading, error: programsError } = useCourses();

  const form = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema) as never,
    defaultValues: {
      name: {
        first: initialData?.name?.first || "",
        middle: initialData?.name?.middle || "",
        last: initialData?.name?.last || "",
        ext: initialData?.name?.ext || "",
      },
      email: initialData?.email || "",
      program: typeof initialData?.program === 'string' 
        ? initialData.program 
        : (initialData?.program as any)?._id || "",
      employmentType: initialData?.employmentType || "full-time",
      designation: initialData?.designation || "",
      adminLoad: initialData?.adminLoad || 0,
      image: initialData?.image || "",
      minLoad: initialData?.minLoad || 18,
      maxLoad: initialData?.maxLoad || 26,
      status: initialData?.status || "active",
      password: "faculty123",
      confirmPassword: "faculty123",
    },
  });

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedMaxLoad = watch("maxLoad", 26);
  const watchedMinLoad = watch("minLoad", 18);
  const watchedDesignation = watch("designation");
  const watchedAdminLoad = watch("adminLoad", 0);

  const onSubmit = async (data: FacultyFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Faculty form data:", data);

      const response = mode === "create"
        ? await createFaculty(data)
        : await updateFaculty(initialData?.id || "", data);

      if (response?.success) {
        onSuccess?.(response);
      } else {
        throw new Error("Failed to save faculty");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save faculty";
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
            {mode === "create" ? "Add New Faculty" : "Edit Faculty"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Fill in the details to add a new faculty member."
              : "Update the faculty member&apos;s information."}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Enter the faculty member&apos;s personal details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register("name.first")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                        setValue("name.first", capitalized);
                      } else {
                        setValue("name.first", value);
                      }
                    }}
                    aria-invalid={errors.name?.first ? "true" : "false"}
                  />
                  {errors.name?.first && (
                    <FieldDescription className="text-destructive text-sm">
                      {errors.name.first.message}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register("name.last")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                        setValue("name.last", capitalized);
                      } else {
                        setValue("name.last", value);
                      }
                    }}
                    aria-invalid={errors.name?.last ? "true" : "false"}
                  />
                  {errors.name?.last && (
                    <FieldDescription className="text-destructive text-sm">
                      {errors.name.last.message}
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="middleName">Middle Name (Optional)</FieldLabel>
                  <Input
                    id="middleName"
                    placeholder="Michael"
                    {...register("name.middle")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                        setValue("name.middle", capitalized);
                      } else {
                        setValue("name.middle", value);
                      }
                    }}
                    aria-invalid={errors.name?.middle ? "true" : "false"}
                  />
                  {errors.name?.middle && (
                    <FieldDescription className="text-destructive text-sm">
                      {errors.name.middle.message}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="nameExt">Extension (Optional)</FieldLabel>
                  <Input
                    id="nameExt"
                    placeholder="Jr., Sr., III"
                    {...register("name.ext")}
                    aria-invalid={errors.name?.ext ? "true" : "false"}
                  />
                  {errors.name?.ext && (
                    <FieldDescription className="text-destructive text-sm">
                      {errors.name.ext.message}
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@university.edu"
                    className="pl-10"
                    {...register("email")}
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                </div>
                {errors.email && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="image">Profile Image URL (Optional)</FieldLabel>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://university.edu/photos/faculty.jpg"
                    className="pl-10"
                    {...register("image")}
                    aria-invalid={errors.image ? "true" : "false"}
                  />
                </div>
                {errors.image && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.image.message}
                  </FieldDescription>
                )}
              </Field>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employment Information
              </CardTitle>
              <CardDescription>
                Set the faculty member&apos;s employment details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="program">Program</FieldLabel>
                <Select
                  value={watch("program")}
                  onValueChange={(value) => setValue("program", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      programsLoading 
                        ? "Loading programs..." 
                        : programsError 
                        ? "Error loading programs" 
                        : "Select program"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {programsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading programs...
                      </SelectItem>
                    ) : programsError ? (
                      <SelectItem value="error" disabled>
                        Error loading programs
                      </SelectItem>
                    ) : courses.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No programs found
                      </SelectItem>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course._id || course.id} value={(course._id || course.id) as string}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{course.courseCode}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{course.courseName}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.program && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.program.message}
                  </FieldDescription>
                )}
                {programsError && (
                  <FieldDescription className="text-destructive text-sm">
                    Failed to load programs. Please refresh and try again.
                  </FieldDescription>
                )}
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="employmentType">Employment Type</FieldLabel>
                  <Select
                    value={watch("employmentType")}
                    onValueChange={(value: "full-time" | "part-time") =>
                      setValue("employmentType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.employmentType && (
                    <FieldDescription className="text-destructive text-sm">
                      {errors.employmentType.message}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select
                    value={watch("status")}
                    onValueChange={(value: "active" | "inactive") =>
                      setValue("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <FieldDescription className="text-destructive text-sm">
                      {errors.status.message}
                    </FieldDescription>
                  )}
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Administrative Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Administrative Role
            </CardTitle>
            <CardDescription>
              If the faculty member holds an administrative position, set the designation and corresponding load.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="designation">Designation (Optional)</FieldLabel>
              <Input
                id="designation"
                placeholder="e.g., Program Head, Dean, Auxiliary Program Head"
                {...register("designation")}
                aria-invalid={errors.designation ? "true" : "false"}
              />
              {errors.designation && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.designation.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Leave blank if the faculty has no administrative role
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="adminLoad">Admin Load</FieldLabel>
              <Input
                id="adminLoad"
                type="number"
                min="0"
                step="0.25"
                placeholder="0"
                {...register("adminLoad", { valueAsNumber: true })}
                disabled={!watchedDesignation}
                aria-invalid={errors.adminLoad ? "true" : "false"}
              />
              {errors.adminLoad && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.adminLoad.message}
                </FieldDescription>
              )}
              <FieldDescription>
                {watchedDesignation
                  ? "Teaching load units credited for the administrative role"
                  : "Set a designation first to enable admin load"}
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Workload Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Workload Limits
            </CardTitle>
            <CardDescription>
              Set the faculty member&apos;s teaching load limits. Current load and preparations will be calculated when courses are assigned.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="minLoad">
                  Minimum Load (units)
                </FieldLabel>
                <Input
                  id="minLoad"
                  type="number"
                  min="18"
                  max="26"
                  {...register("minLoad", { valueAsNumber: true })}
                  aria-invalid={errors.minLoad ? "true" : "false"}
                />
                {errors.minLoad && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.minLoad.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="maxLoad">
                  Maximum Load (units)
                </FieldLabel>
                <Input
                  id="maxLoad"
                  type="number"
                  min="18"
                  max="26"
                  {...register("maxLoad", { valueAsNumber: true })}
                  aria-invalid={errors.maxLoad ? "true" : "false"}
                />
                {errors.maxLoad && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.maxLoad.message}
                  </FieldDescription>
                )}
              </Field>
            </div>

            {/* Load Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Teaching Load Range:</span>
                <Badge variant="outline">
                  {watchedMinLoad} - {watchedMaxLoad} units
                </Badge>
              </div>
              {watchedDesignation && (
                <div className="flex items-center justify-between text-sm">
                  <span>Admin Load:</span>
                  <Badge variant="secondary">{watchedAdminLoad} units</Badge>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Current teaching load and preparations will be calculated when schedules are assigned
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Availability Information
            </CardTitle>
            <CardDescription>
              All faculty members are available during standard work hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Standard Work Hours</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Time:</strong> 8:00 AM - 5:00 PM</p>
                <p><strong>Days:</strong> Monday through Friday</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Access - only shown in create mode */}
        {mode === "create" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Login Access (Optional)
              </CardTitle>
              <CardDescription>
                Set a password to allow this faculty member to log in and view their schedule. You can skip this now and set it up later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    {...register("confirmPassword")}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.confirmPassword.message}
                  </FieldDescription>
                )}
              </Field>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
              ? "Create Faculty"
              : "Update Faculty"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FacultyForm;
