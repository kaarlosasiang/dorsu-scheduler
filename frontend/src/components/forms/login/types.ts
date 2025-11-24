import { z } from "zod";
import { loginSchema } from "./schema";

export type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    token: string;
  };
}

export interface LoginFormProps {
  onSuccess?: (response: LoginResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}