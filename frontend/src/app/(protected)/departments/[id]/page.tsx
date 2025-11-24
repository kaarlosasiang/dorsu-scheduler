"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DepartmentAPI, type IDepartment } from "@/lib/services/DepartmentAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Building2,
  BookOpen,
  Users,
  Edit,
  Trash2,
  Code,
  FileText,
  Calendar
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [department, setDepartment] = useState<IDepartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const response = await DepartmentAPI.getById(id);
        if (response.success) {
          setDepartment(response.data);
        } else {
          setError("Failed to load department");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load department");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDepartment();
    }
  }, [id]);

  const handleBack = () => {
    router.push("/departments");
  };

  const handleEdit = () => {
    router.push(`/departments/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading department...</p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Department not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button
              variant="link"
              size="sm"
              onClick={handleBack}
              className="p-0 h-auto !px-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Departments
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
          <p className="text-muted-foreground">
            Department details and information
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Department Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Department Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Code className="h-4 w-4" />
                Department Code
              </div>
              <Badge variant="outline" className="font-mono text-base">
                {department.code}
              </Badge>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                Department Name
              </div>
              <p className="font-medium">{department.name}</p>
            </div>

            {department.description && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  Description
                </div>
                <p className="text-sm">{department.description}</p>
              </div>
            )}

            {department.createdAt && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Created
                </div>
                <p className="text-sm">
                  {new Date(department.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Department overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="text-2xl font-bold">{department.coursesCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faculty Members</p>
                  <p className="text-2xl font-bold">{department.facultyCount || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage department resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push(`/departments/${id}/courses`)}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push(`/departments/${id}/faculty`)}
            >
              <Users className="mr-2 h-4 w-4" />
              View Faculty
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push(`/departments/${id}/schedules`)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Schedules
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

