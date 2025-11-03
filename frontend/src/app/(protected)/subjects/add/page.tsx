"use client";

import { useRouter } from "next/navigation";
import { SubjectForm } from "@/components/forms/subjects/form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AddSubjectPage() {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

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
              Back to Subjects
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <SubjectForm
        mode="create"
        onSuccess={(response) => {
          toast.success("Subject created successfully!");
          router.push("/subjects");
        }}
        onError={(error) => {
          toast.error(error);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}

