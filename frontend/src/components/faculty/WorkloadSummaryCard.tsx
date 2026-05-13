"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WorkloadSummaryCardProps {
  workload: {
    totalTeachingHours: number;
    lectureHours: number;
    labHours: number;
    totalUnits: number;
    preparations: number;
    maxLoad: number;
  } | null;
  isLoading?: boolean;
  error?: string;
}

export function WorkloadSummaryCard({ workload, isLoading, error }: WorkloadSummaryCardProps) {
  if (isLoading) {
    return <WorkloadSummaryCardSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!workload) {
    return null;
  }

  const isOverloaded = workload.totalTeachingHours > workload.maxLoad;
  const progressPercentage = Math.min((workload.totalTeachingHours / workload.maxLoad) * 100, 100);

  return (
    <Card className={cn(isOverloaded && "border-destructive")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Workload Summary</CardTitle>
          {isOverloaded && (
            <Badge variant="destructive">OVERLOADED</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Hours"
            value={workload.totalTeachingHours}
            max={workload.maxLoad}
            isOverloaded={isOverloaded}
          />
          <MetricCard label="Lecture Hours" value={workload.lectureHours} />
          <MetricCard label="Lab Hours" value={workload.labHours} />
          <MetricCard label="Units" value={workload.totalUnits} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Teaching Load</span>
            <span className={cn(isOverloaded && "text-destructive font-medium")}>
              {workload.totalTeachingHours} / {workload.maxLoad} hours
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className={cn(isOverloaded && "[&>div]:bg-destructive")}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Preparations</span>
          <span className="font-medium">{workload.preparations}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  max,
  isOverloaded,
}: {
  label: string;
  value: number;
  max?: number;
  isOverloaded?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border p-3 text-center space-y-1",
      isOverloaded && max && value > max && "bg-destructive/10 border-destructive/20"
    )}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(
        "text-xl font-bold",
        isOverloaded && max && value > max && "text-destructive"
      )}>
        {value}
      </p>
    </div>
  );
}

function WorkloadSummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
