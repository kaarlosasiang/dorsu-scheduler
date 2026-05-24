"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface FacultyCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facultyName: string;
  email: string;
  accountCreated: boolean;
  accountError?: string;
  loginPassword?: string;
  onDone: () => void;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <code className="flex-1 text-sm break-all">{value}</code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function FacultyCredentialsDialog({
  open,
  onOpenChange,
  facultyName,
  email,
  accountCreated,
  accountError,
  loginPassword,
  onDone,
}: FacultyCredentialsDialogProps) {
  const loginUrl =
    typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Faculty Created
          </DialogTitle>
          <DialogDescription>
            {accountCreated
              ? "Share these login credentials securely with the faculty member. They cannot create their own account."
              : "The faculty profile was saved, but login setup failed. Review the details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">{facultyName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>

          {accountCreated && loginPassword ? (
            <div className="space-y-3">
              <CopyField label="Login email" value={email} />
              <CopyField label="Password" value={loginPassword} />
              <CopyField label="Login URL" value={loginUrl} />
              <p className="text-xs text-muted-foreground">
                The faculty member can sign in at the login page using the email and password above.
                They will be redirected to their workload dashboard after signing in.
              </p>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {accountError
                  ? `Faculty profile was created, but the login account could not be created: ${accountError}. Please contact a system administrator to set up login access.`
                  : "Faculty profile was created, but the login account could not be created. Please contact a system administrator to set up login access."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onDone}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
