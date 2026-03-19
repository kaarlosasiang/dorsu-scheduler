export type AppRole = "admin" | "faculty" | "staff";

export function canAccessDashboard(role?: AppRole | null): boolean {
  return role === "admin";
}

export function getDefaultRouteForRole(role?: AppRole | null): string {
  return canAccessDashboard(role) ? "/dashboard" : "/schedules";
}