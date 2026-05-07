"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthAPI } from "@/lib/services/AuthAPI";
import { FacultyAPI, type FacultyRegistrationLookupResponse } from "@/lib/services/FacultyAPI";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const registerSchema = z
  .object({
    facultyId: z
      .string()
      .trim()
      .min(1, "Faculty ID is required")
      .regex(objectIdPattern, "Enter a valid 24-character faculty ID"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function getFacultyError(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    return maybeError.response?.data?.message || maybeError.message || "Registration failed. Please try again.";
  }

  return "Registration failed. Please try again.";
}

function getProgramLabel(program: FacultyRegistrationLookupResponse["data"]["program"]) {
  if (!program) return "Program not listed";
  if (typeof program === "string") return program;
  return program.courseCode || program.courseName || "Program not listed";
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [generalError, setGeneralError] = useState("");
  const [matchedFaculty, setMatchedFaculty] = useState<FacultyRegistrationLookupResponse["data"] | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setGeneralError("");
      setMatchedFaculty(null);

      const facultyResponse = await FacultyAPI.getRegistrationLookup(data.facultyId);
      const faculty = facultyResponse.data;

      if (faculty.hasAccount) {
        throw new Error("This faculty ID already has a registered account");
      }

      setMatchedFaculty(faculty);

      await AuthAPI.register({
        facultyId: faculty.id,
        email: data.email,
        password: data.password,
        role: "faculty",
      });

      toast.success("Account created. You can now sign in.");
      router.push("/login");
    } catch (error: unknown) {
      const message = getFacultyError(error);
      setGeneralError(message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/login" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex items-center justify-center rounded-md">
                <Image src="/dorsu-icon.png" height={100} width={100} alt="DOrSU Logo" />
              </div>
              <span className="sr-only">DOrSched</span>
            </Link>
            <h1 className="text-xl font-bold">
              Create your <span className="text-primary">DOrSched</span> account.
            </h1>
            <FieldDescription>
              Use the faculty ID provided in the faculty records.
            </FieldDescription>
          </div>

          {generalError ? (
            <div className="rounded-md bg-destructive/10 p-3 text-center">
              <FieldDescription className="text-destructive text-sm">
                {generalError}
              </FieldDescription>
            </div>
          ) : null}

          {matchedFaculty ? (
            <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
              <div>
                <p className="font-medium">{matchedFaculty.fullName || matchedFaculty.email}</p>
                <p className="text-xs text-muted-foreground">{getProgramLabel(matchedFaculty.program)}</p>
              </div>
            </div>
          ) : null}

          <Field>
            <FieldLabel htmlFor="facultyId">Faculty ID</FieldLabel>
            <Input
              id="facultyId"
              placeholder="64f1a2b3c4d5e6f789012345"
              {...register("facultyId")}
              aria-invalid={errors.facultyId ? "true" : "false"}
            />
            {errors.facultyId ? (
              <FieldDescription className="text-destructive text-sm">
                {errors.facultyId.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="faculty@dorsu.edu.ph"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email ? (
              <FieldDescription className="text-destructive text-sm">
                {errors.email.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password ? (
              <FieldDescription className="text-destructive text-sm">
                {errors.password.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              {...register("confirmPassword")}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
            />
            {errors.confirmPassword ? (
              <FieldDescription className="text-destructive text-sm">
                {errors.confirmPassword.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </FieldDescription>
    </div>
  );
}
