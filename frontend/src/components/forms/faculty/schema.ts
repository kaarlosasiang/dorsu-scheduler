import { z } from "zod";

// Name schema
export const nameSchema = z.object({
  first: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name cannot exceed 50 characters"),
  middle: z
    .string()
    .max(50, "Middle name cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  last: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name cannot exceed 50 characters"),
  ext: z
    .string()
    .max(10, "Extension cannot exceed 10 characters")
    .optional()
    .or(z.literal("")),
});

// Main faculty schema
export const facultySchema = z.object({
  name: nameSchema,
  
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),
  
  program: z
    .string()
    .min(2, "Program must be a valid selection"),
  
  employmentType: z
    .enum(["full-time", "part-time"]),
  
  image: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return val;
    })
    .refine((val) => {
      if (val === undefined) return true;
      return z.string().url().safeParse(val).success;
    }, {
      message: "Please enter a valid URL"
    }),
  
  designation: z
    .string()
    .max(150, "Designation cannot exceed 150 characters")
    .optional()
    .or(z.literal(""))
    .transform((val) => (!val || val.trim() === '' ? undefined : val.trim())),

  adminLoad: z
    .number()
    .min(0, "Admin load cannot be negative")
    .default(0),

  minLoad: z
    .number()
    .min(18, "Minimum load must be at least 18 units")
    .max(26, "Minimum load cannot exceed 26 units"),
  
  maxLoad: z
    .number()
    .min(18, "Max load must be at least 18 units")
    .max(26, "Max load cannot exceed 26 units"),
  
  status: z
    .enum(["active", "inactive"]),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .optional()
    .or(z.literal("")),

  confirmPassword: z
    .string()
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  return data.minLoad <= data.maxLoad;
}, {
  message: "Minimum load cannot exceed maximum load",
  path: ["minLoad"],
}).refine((data) => {
  const adminLoad = data.adminLoad || 0;
  if (adminLoad > 0 && !data.designation) return false;
  return true;
}, {
  message: "Admin load can only be set when a designation is assigned",
  path: ["adminLoad"],
}).refine((data) => {
  if (data.password && data.password.trim() !== "" && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});