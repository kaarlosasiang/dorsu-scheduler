"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarClock,
  DoorOpen,
  GraduationCap,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";

import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/authContext";
import { canAccessDashboard, getDefaultRouteForRole } from "@/lib/role-routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

const scheduleChartConfig = {
  value: {
    label: "Schedules",
    color: "hsl(214 76% 47%)",
  },
};

const facultyMixChartConfig = {
  fullTime: {
    label: "Full-time",
    color: "hsl(214 76% 47%)",
  },
  partTime: {
    label: "Part-time",
    color: "hsl(38 92% 50%)",
  },
};

function formatActivityTime(createdAt?: string) {
  if (!createdAt) return "No timestamp";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "No timestamp";
  return formatDistanceToNow(date, { addSuffix: true });
}

function DashboardLoadingState() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-amber-50 p-4">
        <Skeleton className="mb-2 h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-1 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <Skeleton className="h-[280px] rounded-xl" />
        <Skeleton className="h-[280px] rounded-xl" />
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.45fr_0.85fr]">
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard();

  useEffect(() => {
    if (!authLoading && !canAccessDashboard(user?.role)) {
      router.replace(getDefaultRouteForRole(user?.role));
    }
  }, [authLoading, router, user?.role]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccessDashboard(user?.role)) {
    return null;
  }

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-amber-50 p-4 shadow-sm">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_60%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_55%)] lg:block" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs uppercase tracking-[0.2em]">
              Live database overview
            </Badge>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Operations Dashboard</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Monitor scheduling health, staffing coverage, and room capacity from live records.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{data.programs.length} programs</Badge>
              <Badge variant="secondary">{data.publicationRate}% publication rate</Badge>
              <Badge variant="secondary">Admin view</Badge>
            </div>
          </div>

          <div className="flex gap-2 sm:flex-row lg:flex-col lg:min-w-36">
            <Button size="sm" onClick={refresh} className="flex-1">
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href="/schedules">
                <CalendarClock className="size-3.5" />
                Schedules
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refresh}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.metricCards.map((card) => {
          const Icon =
            card.title === "Faculty Members"
              ? Users
              : card.title === "Schedules"
              ? CalendarClock
              : card.title === "Classrooms"
              ? DoorOpen
              : Building2;

          return (
            <Card key={card.title} className="border-slate-200/80">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.title}</CardTitle>
                  <div className="text-2xl font-semibold tracking-tight">{card.value.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                  <Icon className="size-3.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className="text-xs text-muted-foreground">{card.description}</p>
                {card.trend ? <p className="text-xs font-medium text-slate-600 mt-0.5">{card.trend}</p> : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Schedule Distribution by Department</CardTitle>
            <CardDescription className="text-xs">Live counts grouped by department.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.schedulesByDepartment.length ? (
              <ChartContainer config={scheduleChartConfig} className="h-[220px] w-full">
                <BarChart accessibilityLayer data={data.schedulesByDepartment} margin={{ left: 8, right: 8, top: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={46}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <Empty className="min-h-[220px] rounded-xl border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 />
                  </EmptyMedia>
                  <EmptyTitle>No department schedule data yet</EmptyTitle>
                  <EmptyDescription>Schedule counts will appear here once records exist.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Faculty Employment Mix</CardTitle>
            <CardDescription className="text-xs">Current staffing split from faculty records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ChartContainer config={facultyMixChartConfig} className="mx-auto h-[180px] max-w-[260px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
                <Pie data={data.facultyByEmployment} dataKey="value" nameKey="label" innerRadius={52} strokeWidth={4}>
                  {data.facultyByEmployment.map((item) => (
                    <Cell key={item.key} fill={`var(--color-${item.key})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="key" />} />
              </PieChart>
            </ChartContainer>

            <div className="grid gap-2 sm:grid-cols-2">
              {data.facultyByEmployment.map((item) => (
                <div key={item.key} className="rounded-xl border bg-slate-50/70 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-semibold tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="border-slate-200/80">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest faculty and schedule records.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/schedules">
                View all
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length ? (
              <div className="space-y-2">
                {data.recentActivity.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={item.type === "schedule" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">{item.type}</Badge>
                        {item.status ? <span className="text-xs text-muted-foreground">{item.status}</span> : null}
                      </div>
                      <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatActivityTime(item.createdAt)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty className="min-h-[160px] rounded-xl border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Sparkles />
                  </EmptyMedia>
                  <EmptyTitle>No recent activity yet</EmptyTitle>
                  <EmptyDescription>Latest records will appear here once created.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border-slate-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Shortcuts to common workflows.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild size="sm" className="justify-start">
                <Link href="/schedules">
                  <CalendarClock className="size-3.5" />
                  Open schedules
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="justify-start">
                <Link href="/faculty/add">
                  <Users className="size-3.5" />
                  Add faculty
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="justify-start">
                <Link href="/classrooms/add">
                  <DoorOpen className="size-3.5" />
                  Add classroom
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="justify-start">
                <Link href="/subjects">
                  <BookOpen className="size-3.5" />
                  Review subjects
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Room Status Snapshot</CardTitle>
              <CardDescription className="text-xs">Availability from the classroom inventory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {data.classroomByStatus.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border bg-slate-50/70 px-3 py-2">
                  <span className="text-xs text-slate-700">{item.label}</span>
                  <span className="text-base font-semibold tracking-tight">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-slate-900 text-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm text-slate-50">
                <GraduationCap className="size-3.5" />
                Programs in scope
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Inferred from active faculty assignments.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {data.programs.length ? (
                data.programs.map((program) => (
                  <Badge key={program} variant="secondary" className="bg-white/10 text-slate-50 hover:bg-white/15 text-xs">
                    {program}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-300">No program assignments available yet.</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
