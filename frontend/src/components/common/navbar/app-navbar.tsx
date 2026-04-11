"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  CalendarRange,
  LayoutDashboard,
  School,
  Users,
  Menu,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Faculty",
    href: null,
    icon: Users,
    children: [
      { title: "All Faculties", href: "/faculty" },
      { title: "Programs",      href: "/courses" },
      { title: "Subjects",      href: "/subjects" },
    ],
  },
  { title: "Schedules",  href: "/schedules",  icon: CalendarRange },
  { title: "Classrooms", href: "/classrooms", icon: School },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

// ── Dropdown nav item ─────────────────────────────────────────────────────────

function NavDropdown({
  item,
  pathname,
}: {
  item: NavItem & { children: readonly { title: string; href: string }[] };
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const isActive = item.children.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.title}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-1.5 text-sm rounded-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                pathname === child.href || pathname.startsWith(child.href + "/")
                  ? "font-semibold text-foreground"
                  : "text-foreground"
              )}
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── User menu ─────────────────────────────────────────────────────────────────

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;

  const initials = (user.username || user.email?.split("@")[0] || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayName = user.username || user.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-accent transition-colors"
      >
        <Avatar className="h-7 w-7 rounded-full">
          <AvatarFallback className="rounded-full text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:block text-sm font-medium">{displayName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-md border bg-popover p-1 shadow-md">
          <div className="px-3 py-2 border-b mb-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <span className="mt-1 inline-block text-[10px] uppercase tracking-wide font-semibold bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {user.role}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm text-destructive hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main navbar ───────────────────────────────────────────────────────────────

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl w-full flex h-14 items-center gap-4 px-4">

        {/* Mobile hamburger */}
        <MobileMenu pathname={pathname} />

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 font-semibold text-sm">
          DORSU Scheduler
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {NAV_ITEMS.map((item) => {
            if ("children" in item && item.children) {
              return (
                <NavDropdown
                  key={item.title}
                  item={item as NavItem & { children: readonly { title: string; href: string }[] }}
                  pathname={pathname}
                />
              );
            }
            const href = item.href as string;
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="ml-auto md:ml-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

// ── Mobile menu ───────────────────────────────────────────────────────────────

function MobileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="text-left text-sm">DORSU Scheduler</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.title} className="mt-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {item.title}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        pathname === child.href || pathname.startsWith(child.href + "/")
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              );
            }
            const href = item.href as string;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
