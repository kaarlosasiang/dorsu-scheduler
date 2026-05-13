"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import {
  BookOpenCheck,
  Building2,
  CalendarCheck2,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

import { useAuth } from "@/contexts/authContext";
import { useReports } from "@/hooks/useReports";
import { canAccessDashboard } from "@/lib/role-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const scheduleChartConfig = {
  published: { label: "Published", color: "hsl(214 76% 47%)" },
  draft: { label: "Draft", color: "hsl(38 92% 50%)" },
  generated: { label: "Generated", color: "hsl(166 76% 36%)" },
  manual: { label: "Manual", color: "hsl(262 70% 55%)" },
};

const barChartConfig = {
  value: { label: "Count", color: "hsl(214 76% 47%)" },
};

function ReportsLoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error, refresh } = useReports();

  useEffect(() => {
    if (!authLoading && !canAccessDashboard(user?.role)) {
      router.replace("/unauthorized");
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
    return <ReportsLoadingState />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-slate-50/70 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Analytics and Reports</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review scheduling coverage, classroom capacity, faculty workload, and catalog health from live records.
            </p>
          </div>
          <Button size="sm" onClick={refresh}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </section>

      {error ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Reports unavailable</CardTitle>
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
            card.title === "Published Schedules"
              ? CalendarCheck2
              : card.title === "Room Capacity"
              ? Building2
              : card.title === "Faculty Workload"
              ? Users
              : BookOpenCheck;

          return (
            <Card key={card.title} className="border-slate-200/80">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {card.title}
                  </CardTitle>
                  <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
                </div>
                <div className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                  <Icon className="size-3.5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.description}</p>
                {card.trend ? <p className="mt-0.5 text-xs font-medium text-slate-600">{card.trend}</p> : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Schedule Status</CardTitle>
            <CardDescription className="text-xs">Published, draft, generated, and manual records.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={scheduleChartConfig} className="mx-auto h-[240px] max-w-[340px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
                <Pie data={data.scheduleStatus} dataKey="value" nameKey="label" innerRadius={58} strokeWidth={4}>
                  {data.scheduleStatus.map((item) => (
                    <Cell key={item.key} fill={`var(--color-${item.key})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="key" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Department Schedule Load</CardTitle>
            <CardDescription className="text-xs">Schedule counts grouped by department.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.departmentSchedules.length ? (
              <ChartContainer config={barChartConfig} className="h-[240px] w-full">
                <BarChart accessibilityLayer data={data.departmentSchedules} margin={{ left: 8, right: 8, top: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={52}
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
                    <CalendarCheck2 />
                  </EmptyMedia>
                  <EmptyTitle>No department load yet</EmptyTitle>
                  <EmptyDescription>Department scheduling data appears after schedules are created.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="border-slate-200/80 xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Subject Offering by Semester</CardTitle>
            <CardDescription className="text-xs">Catalog distribution from subject records.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[220px] w-full">
              <BarChart accessibilityLayer data={data.subjectSemester} margin={{ left: 8, right: 8, top: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Operational Insights</CardTitle>
            <CardDescription className="text-xs">Quick ratios from the latest stats.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Capacity utilization</span>
                <span className="font-medium">{data.capacityUtilization}%</span>
              </div>
              <Progress value={data.capacityUtilization} />
            </div>

            <div className="space-y-2">
              {data.classroomStatus.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border bg-slate-50/70 px-3 py-2">
                  <span className="text-xs text-slate-700">{item.label}</span>
                  <span className="text-base font-semibold tracking-tight">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {data.insights.map((insight) => (
                <p key={insight} className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {insight}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
