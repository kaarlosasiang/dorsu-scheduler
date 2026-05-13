"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FacultyProfileCardProps {
  profile: {
    name: { first: string; middle?: string; last: string; ext?: string };
    email: string;
    program: { name: string; courseCode?: string };
    designation?: string;
    employmentType: 'full-time' | 'part-time';
  } | null;
  isLoading?: boolean;
  error?: string;
}

export function FacultyProfileCard({ profile, isLoading, error }: FacultyProfileCardProps) {
  if (isLoading) {
    return <FacultyProfileCardSkeleton />;
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

  if (!profile) {
    return null;
  }

  const fullName = [profile.name.first, profile.name.middle, profile.name.last, profile.name.ext]
    .filter(Boolean)
    .join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Faculty Profile</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Full Name</p>
          <p className="font-medium">{fullName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{profile.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Program</p>
          <p className="font-medium">
            {profile.program.courseCode ? `${profile.program.courseCode} - ` : ''}
            {profile.program.name}
          </p>
        </div>
        {profile.designation && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Designation</p>
            <p className="font-medium">{profile.designation}</p>
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Employment Type</p>
          <p className="font-medium capitalize">{profile.employmentType.replace('-', ' ')}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FacultyProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-48" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
