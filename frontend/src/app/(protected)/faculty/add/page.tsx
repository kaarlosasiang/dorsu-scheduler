"use client";

import { useRouter } from "next/navigation";
import { FacultyForm } from "@/components/forms/faculty";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function AddFacultyPage() {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

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
              Back to Faculty
            </Button>
          </div>
        </div>
      </div>

      {/* Form Card */}

      <FacultyForm
        mode="create"
        onSuccess={(response) => {
          toast.success("Faculty created successfully!");
          router.push("/faculty");
        }}
        onError={(error) => {
          toast.error(error);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}
