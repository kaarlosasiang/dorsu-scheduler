"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SubjectBreakdownTableProps {
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    scheduleType: 'lecture' | 'laboratory';
    units: number;
    teachingHours: number;
  }>;
  isLoading?: boolean;
  error?: string;
}

export function SubjectBreakdownTable({ subjects, isLoading, error }: SubjectBreakdownTableProps) {
  if (isLoading) {
    return <SubjectBreakdownTableSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);
  const totalHours = subjects.reduce((sum, s) => sum + s.teachingHours, 0);

  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Subject Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Teaching Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No subjects found for this semester
                </TableCell>
              </TableRow>
            ) : (
              <>
                {subjects.map((subject, index) => (
                  <TableRow key={`${subject.subjectCode}-${subject.scheduleType}-${index}`}>
                    <TableCell className="font-medium">{subject.subjectCode}</TableCell>
                    <TableCell>{subject.subjectName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={subject.scheduleType === 'lecture' ? 'default' : 'secondary'}
                        className={cn(
                          subject.scheduleType === 'lecture' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        )}
                      >
                        {subject.scheduleType === 'lecture' ? 'Lecture' : 'Laboratory'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{subject.units}</TableCell>
                    <TableCell className="text-right">{subject.teachingHours.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{totalUnits}</TableCell>
                  <TableCell className="text-right">{totalHours.toFixed(2)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SubjectBreakdownTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-2" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
