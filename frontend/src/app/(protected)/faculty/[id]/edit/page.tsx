"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FacultyForm } from "@/components/forms/faculty";
import { FacultyAPI, type IFaculty } from "@/lib/services/FacultyAPI";
import { toast } from "sonner";

export default function EditFacultyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [faculty, setFaculty] = useState<IFaculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const response = await FacultyAPI.getById(id);
        if (response.success && response.data) {
          setFaculty(response.data);
        } else {
          setError("Faculty not found");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load faculty");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFaculty();
    }
  }, [id]);

  const handleCancel = () => {
    router.push(`/faculty/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Faculty not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/faculty")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Faculty
        </Button>
      </div>
    );
  }

  return (
    <div>
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
              Back to Faculty Details
            </Button>
          </div>
        </div>
      </div>

      <FacultyForm
        mode="edit"
        initialData={faculty}
        onSuccess={() => {
          toast.success("Faculty updated successfully!");
          router.push(`/faculty/${id}`);
        }}
        onError={(message) => {
          toast.error(message);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}
