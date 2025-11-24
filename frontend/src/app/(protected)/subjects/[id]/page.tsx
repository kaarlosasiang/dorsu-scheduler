"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, BookOpen, Hash, GraduationCap, Calendar, Building2, Beaker, ListChecks, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubjectAPI, type ISubject } from "@/lib/services/SubjectAPI";
import { toast } from "sonner";

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [subject, setSubject] = React.useState<ISubject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        const response = await SubjectAPI.getById(params.id);
        setSubject(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to load subject");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      return;
    }

    try {
      await SubjectAPI.delete(params.id);
      toast.success("Subject deleted successfully");
      router.push("/subjects");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subject");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Subject not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/subjects")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="link"
            size="sm"
            onClick={() => router.push("/subjects")}
            className="p-0 h-auto !px-0 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Subjects
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {subject.subjectCode}
          </h1>
          <p className="text-muted-foreground">{subject.subjectName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/subjects/${params.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subject Code</p>
              <p className="text-lg font-mono">{subject.subjectCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subject Name</p>
              <p className="text-lg">{subject.subjectName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Units
              </p>
              <Badge variant="secondary" className="mt-1">
                {subject.units} units
              </Badge>
            </div>
            {subject.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{subject.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Type
              </p>
              {subject.isLaboratory ? (
                <Badge variant="outline" className="mt-1">
                  <Beaker className="h-3 w-3 mr-1" />
                  Laboratory Subject
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-1">
                  Lecture Subject
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course & Curriculum */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Course & Curriculum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Course (Degree Program)</p>
              {typeof subject.course === 'object' && subject.course ? (
                <div className="mt-1">
                  <p className="font-medium">{subject.course.courseCode}</p>
                  <p className="text-sm text-muted-foreground">{subject.course.courseName}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned</p>
              )}
            </div>
            {subject.department && typeof subject.department === 'object' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department
                </p>
                <div className="mt-1">
                  <p className="font-medium">{subject.department.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.department.code}</p>
                </div>
              </div>
            )}
            {subject.yearLevel && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Year Level
                </p>
                <Badge variant="outline" className="mt-1">
                  {subject.yearLevel}
                </Badge>
              </div>
            )}
            {subject.semester && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Semester</p>
                <Badge variant="outline" className="mt-1">
                  {subject.semester}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prerequisites */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subject.prerequisites && subject.prerequisites.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {subject.prerequisites.map((prereq: any) => (
                  <Badge key={typeof prereq === 'string' ? prereq : prereq._id} variant="secondary">
                    {typeof prereq === 'object' ? `${prereq.subjectCode} - ${prereq.subjectName}` : prereq}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No prerequisites required</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

