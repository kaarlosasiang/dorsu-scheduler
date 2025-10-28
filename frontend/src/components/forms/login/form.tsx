"use client";

import {GalleryVerticalEnd} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useAuth } from "@/contexts/authContext";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginSchema } from "./schema";
import type { LoginFormData, LoginFormProps } from "./types";
import Image from 'next/image'

export function LoginForm({
  onSuccess,
  onError,
  className,
  ...props
}: LoginFormProps & React.ComponentProps<"div">) {
  const [generalError, setGeneralError] = useState<string>("");
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setGeneralError("");
      
      // Use the login function from AuthContext
      await login(data.email, data.password);

      // If we reach here, login was successful
      onSuccess?.({
        success: true,
        data: {
          user: {
            id: "",
            email: data.email,
            name: "",
            role: "",
          },
          token: "",
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. Please try again.";
      
      // Handle different types of errors
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setGeneralError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex items-center justify-center rounded-md">
                  <Image src="/dorsu-icon.png" height={100} width={100} alt={"DOrSU Logo"}/>
              </div>
              <span className="sr-only">DOrSched</span>
            </a>
            <h1 className="text-xl font-bold">
              Welcome to <span className="text-primary">DOrSched</span>.
            </h1>
            <FieldDescription>
              Enter your account credentials to get started.
            </FieldDescription>
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="rounded-md bg-destructive/10 p-3 text-center">
              <FieldDescription className="text-destructive text-sm">
                {generalError}
              </FieldDescription>
            </div>
          )}
          
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <FieldDescription className="text-destructive text-sm">
                {errors.email.message}
              </FieldDescription>
            )}
          </Field>
          
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && (
              <FieldDescription className="text-destructive text-sm">
                {errors.password.message}
              </FieldDescription>
            )}
          </Field>
          
          <Field>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
