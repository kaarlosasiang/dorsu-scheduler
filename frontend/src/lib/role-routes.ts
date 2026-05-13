export type AppRole = "admin" | "faculty" | "staff";

export function canAccessDashboard(role?: AppRole | null): boolean {
  return role === "admin";
}

export function getDefaultRouteForRole(role?: AppRole | null): string {
  if (role === "faculty") return "/faculty/dashboard";
  return "/dashboard";
}