"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FacultyForm } from "@/components/forms/faculty";
import type { FacultyResponse } from "@/components/forms/faculty/types";
import { FacultyCredentialsDialog } from "@/components/faculty/FacultyCredentialsDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AddFacultyPage() {
  const router = useRouter();
  const [credentialsDialog, setCredentialsDialog] = useState<{
    open: boolean;
    facultyName: string;
    email: string;
    accountCreated: boolean;
    accountError?: string;
    loginPassword?: string;
  }>({
    open: false,
    facultyName: "",
    email: "",
    accountCreated: false,
  });

  const handleCancel = () => {
    router.back();
  };

  const handleSuccess = (response: FacultyResponse) => {
    if (response.accountCreated) {
      toast.success("Faculty and login account created successfully!");
    } else if (response.accountError) {
      toast.warning("Faculty created, but login account setup failed.");
    } else {
      toast.success("Faculty created successfully!");
    }

    setCredentialsDialog({
      open: true,
      facultyName: response.facultyName || response.data.email,
      email: response.data.email,
      accountCreated: response.accountCreated ?? false,
      accountError: response.accountError,
      loginPassword: response.loginPassword,
    });
  };

  const handleDialogDone = () => {
    setCredentialsDialog((prev) => ({ ...prev, open: false }));
    router.push("/faculty");
  };

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
              Back to Faculty
            </Button>
          </div>
        </div>
      </div>

      <FacultyForm
        mode="create"
        onSuccess={handleSuccess}
        onError={(error) => {
          toast.error(error);
        }}
        onCancel={handleCancel}
      />

      <FacultyCredentialsDialog
        open={credentialsDialog.open}
        onOpenChange={(open) => {
          if (!open) handleDialogDone();
          else setCredentialsDialog((prev) => ({ ...prev, open }));
        }}
        facultyName={credentialsDialog.facultyName}
        email={credentialsDialog.email}
        accountCreated={credentialsDialog.accountCreated}
        accountError={credentialsDialog.accountError}
        loginPassword={credentialsDialog.loginPassword}
        onDone={handleDialogDone}
      />
    </div>
  );
}
