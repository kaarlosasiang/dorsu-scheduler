"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/authContext";
import { Loader2 } from "lucide-react";
import { AppNavbar } from "@/components/common/navbar/app-navbar";
import { canAccessDashboard, getDefaultRouteForRole } from "@/lib/role-routes";

const FACULTY_ALLOWED_PATHS = ["/schedules"];

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isLoading && isAuthenticated && pathname.startsWith("/dashboard") && !canAccessDashboard(user?.role)) {
      router.push(getDefaultRouteForRole(user?.role));
      return;
    }

    if (!isLoading && isAuthenticated && user?.role === "faculty") {
      const isAllowed = FACULTY_ALLOWED_PATHS.some((path) =>
        pathname === path || pathname.startsWith(path + "/")
      );
      if (!isAllowed) {
        router.push(getDefaultRouteForRole(user.role));
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
