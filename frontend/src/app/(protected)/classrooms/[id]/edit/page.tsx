"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassroomForm } from "@/components/forms/classroom";
import { ClassroomAPI, type IClassroom } from "@/lib/services/ClassroomAPI";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function EditClassroomPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<IClassroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true);
        const response = await ClassroomAPI.getById(classroomId);
        if (response.success) {
          setClassroom(response.data);
        } else {
          setError("Failed to load classroom");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load classroom");
      } finally {
        setLoading(false);
      }
    };

    if (classroomId) {
      fetchClassroom();
    }
  }, [classroomId]);

  const handleCancel = () => {
    router.push("/classrooms");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Classroom not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button
              variant="link"
              size="sm"
              onClick={handleCancel}
              className="p-0 h-auto !px-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Classrooms
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <ClassroomForm
        mode="edit"
        initialData={classroom}
        onSuccess={(response) => {
          toast.success("Classroom updated successfully!");
          router.push("/classrooms");
        }}
        onError={(error) => {
          toast.error(error);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}

