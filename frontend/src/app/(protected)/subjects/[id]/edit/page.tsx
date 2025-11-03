"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubjectForm } from "@/components/forms/subjects/form";
import { SubjectAPI, type ISubject } from "@/lib/services/SubjectAPI";
import { toast } from "sonner";

export default function EditSubjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [subject, setSubject] = React.useState<ISubject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        const response = await SubjectAPI.getById(params.id);
        setSubject(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to load subject");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [params.id]);

  const handleCancel = () => {
    router.push(`/subjects/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Subject not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/subjects")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
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
              Back to Subject Details
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <SubjectForm
        mode="edit"
        initialData={subject}
        onSuccess={(response) => {
          toast.success("Subject updated successfully!");
          router.push(`/subjects/${params.id}`);
        }}
        onError={(error) => {
          toast.error(error);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}

