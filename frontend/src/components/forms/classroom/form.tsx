"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DoorOpen, Building, Users, Tag, X, Plus, CheckCircle2, Wrench, XCircle } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import { classroomSchema } from "./schema";
import type { ClassroomFormData, ClassroomFormProps } from "./types";
import { useClassroomForm } from "./useClassroomForm";

// Common facilities options
const COMMON_FACILITIES = [
  "Projector",
  "Whiteboard",
  "Air Conditioning",
  "Computer",
  "Podium",
  "Microphone",
  "Speakers",
  "Smart Board",
  "Lab Equipment",
  "WiFi",
];

export function ClassroomForm({
  initialData,
  mode = "create",
  onSuccess,
  onError,
  onCancel,
  className,
}: ClassroomFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFacility, setNewFacility] = useState("");
  const { createClassroom, updateClassroom } = useClassroomForm();

  const form = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema) as never,
    defaultValues: {
      roomNumber: initialData?.roomNumber || "",
      building: initialData?.building || "",
      capacity: initialData?.capacity || 30,
      type: initialData?.type || "lecture",
      facilities: initialData?.facilities || [],
      status: initialData?.status || "available",
    },
  });

  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const facilities = watch("facilities") || [];

  const addFacility = (facility: string) => {
    if (facility && !facilities.includes(facility)) {
      setValue("facilities", [...facilities, facility]);
    }
  };

  const removeFacility = (facility: string) => {
    setValue("facilities", facilities.filter((f) => f !== facility));
  };

  const handleAddCustomFacility = () => {
    if (newFacility.trim()) {
      addFacility(newFacility.trim());
      setNewFacility("");
    }
  };

  const onSubmit = async (data: ClassroomFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Classroom form data:", data);

      const response = mode === "create"
        ? await createClassroom(data)
        : await updateClassroom(initialData?._id || initialData?.id || "", data);

      if (response?.success) {
        onSuccess?.(response);
      } else {
        throw new Error("Failed to save classroom");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save classroom";
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
            {mode === "create" ? "Add New Classroom" : "Edit Classroom"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Fill in the details to add a new classroom."
              : "Update the classroom's information."}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the classroom's basic details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Room Number */}
              <Field>
                <FieldLabel htmlFor="roomNumber" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Room Number
                </FieldLabel>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101, A-201"
                  {...register("roomNumber")}
                  aria-invalid={errors.roomNumber ? "true" : "false"}
                />
                {errors.roomNumber && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.roomNumber.message}
                  </FieldDescription>
                )}
                <FieldDescription>
                  Enter the room number or identifier
                </FieldDescription>
              </Field>

              {/* Building */}
              <Field>
                <FieldLabel htmlFor="building" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Building (Optional)
                </FieldLabel>
                <Input
                  id="building"
                  placeholder="e.g., Main Building, Science Wing"
                  {...register("building")}
                  aria-invalid={errors.building ? "true" : "false"}
                />
                {errors.building && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.building.message}
                  </FieldDescription>
                )}
                <FieldDescription>
                  Specify which building this room is in
                </FieldDescription>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Capacity */}
              <Field>
                <FieldLabel htmlFor="capacity" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Capacity
                </FieldLabel>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="500"
                  placeholder="30"
                  {...register("capacity", { valueAsNumber: true })}
                  aria-invalid={errors.capacity ? "true" : "false"}
                />
                {errors.capacity && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.capacity.message}
                  </FieldDescription>
                )}
                <FieldDescription>
                  Maximum number of students (1-500)
                </FieldDescription>
              </Field>

              {/* Type */}
              <Field>
                <FieldLabel htmlFor="type">Room Type</FieldLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lecture Hall</SelectItem>
                        <SelectItem value="laboratory">Laboratory</SelectItem>
                        <SelectItem value="computer-lab">Computer Lab</SelectItem>
                        <SelectItem value="conference">Conference Room</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <FieldDescription className="text-destructive text-sm">
                    {errors.type.message}
                  </FieldDescription>
                )}
                <FieldDescription>
                  Select the type of classroom
                </FieldDescription>
              </Field>
            </div>

            {/* Status */}
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Available
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-red-500" />
                          Under Maintenance
                        </div>
                      </SelectItem>
                      <SelectItem value="reserved">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-gray-500" />
                          Reserved
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <FieldDescription className="text-destructive text-sm">
                  {errors.status.message}
                </FieldDescription>
              )}
              <FieldDescription>
                Set the current status of the classroom
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Facilities
            </CardTitle>
            <CardDescription>
              Select or add facilities available in this classroom.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Facilities */}
            {facilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {facilities.map((facility) => (
                  <Badge key={facility} variant="secondary" className="gap-1">
                    {facility}
                    <button
                      type="button"
                      onClick={() => removeFacility(facility)}
                      className="ml-1 hover:bg-destructive/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Quick Add Buttons */}
            <div>
              <FieldLabel>Common Facilities</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_FACILITIES.map((facility) => (
                  <Button
                    key={facility}
                    type="button"
                    variant={facilities.includes(facility) ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      facilities.includes(facility)
                        ? removeFacility(facility)
                        : addFacility(facility)
                    }
                  >
                    {facilities.includes(facility) && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {facility}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Facility Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom facility..."
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomFacility();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustomFacility}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
              : (mode === "create" ? "Create Classroom" : "Update Classroom")}
          </Button>
        </div>
      </form>
    </div>
  );
}

