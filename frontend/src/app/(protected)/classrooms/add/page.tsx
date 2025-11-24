"use client";

import { useRouter } from "next/navigation";
import { ClassroomForm } from "@/components/forms/classroom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AddClassroomPage() {
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
              Back to Classrooms
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <ClassroomForm
        mode="create"
        onSuccess={(response) => {
          toast.success("Classroom created successfully!");
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

