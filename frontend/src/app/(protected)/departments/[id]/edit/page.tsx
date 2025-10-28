"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DepartmentForm } from "@/components/forms/deparment";
import { DepartmentAPI, type IDepartment } from "@/lib/services/DepartmentAPI";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [department, setDepartment] = useState<IDepartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const response = await DepartmentAPI.getById(id);
        if (response.success) {
          setDepartment(response.data);
        } else {
          setError("Failed to load department");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load department");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDepartment();
    }
  }, [id]);

  const handleCancel = () => {
    router.push("/departments");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading department...</p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Department not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
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
              Back to Departments
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <DepartmentForm
        mode="edit"
        initialData={department}
        onSuccess={(response) => {
          toast.success("Department updated successfully!");
          router.push("/departments");
        }}
        onError={(error) => {
          toast.error(error);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}

