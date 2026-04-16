"use client";

import * as React from "react";
import {
    MoreHorizontal,
    Plus,
    Eye,
    Edit,
    Trash2,
    BookOpen,
    AlertCircle,
    Loader2,
    Code,
    Layers,
    Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useCourses } from "@/hooks/useCourses";
import { useRouter } from "next/navigation";
import { type ICourse } from "@/lib/services/CourseAPI";

interface Course {
    id: string;
    courseCode: string;
    courseName: string;
    createdAt: string;
}

const transformCourse = (course: ICourse): Course => ({
    id: course._id || course.id || "",
    courseCode: course.courseCode,
    courseName: course.courseName,
    createdAt: course.createdAt || new Date().toISOString(),
});

function CourseCard({ course }: { course: Course }) {
    const router = useRouter();

    return (
        <Card className="group flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Code className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Program Code</p>
                            <p className="font-bold font-mono text-lg leading-tight">{course.courseCode}</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/courses/${course.id}/sections`)}>
                                <Layers className="mr-2 h-4 w-4" />
                                Manage Sections
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/courses/${course.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/courses/${course.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit program
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete program
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-4">
                <div>
                    <p className="font-medium text-sm leading-snug">{course.courseName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Added {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto w-full"
                    onClick={() => router.push(`/courses/${course.id}/sections`)}
                >
                    <Layers className="mr-2 h-4 w-4" />
                    View sections
                </Button>
            </CardContent>
        </Card>
    );
}

export default function CoursesPage() {
    const router = useRouter();
    const { courses: rawCourses, loading, error, stats } = useCourses();
    const [search, setSearch] = React.useState("");

    const courses = React.useMemo(
        () => rawCourses.map(transformCourse),
        [rawCourses]
    );

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return courses;
        return courses.filter(
            (c) =>
                c.courseCode.toLowerCase().includes(q) ||
                c.courseName.toLowerCase().includes(q)
        );
    }, [courses, search]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading programs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
                    <p className="text-muted-foreground">
                        Manage all degree programs and curriculum offerings
                    </p>
                </div>
                <Button onClick={() => router.push("/courses/add")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Program
                </Button>
            </div>

            {/* Stats */}
            {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Active degree programs</p>
                    </CardContent>
                </Card>
            </div> */}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search programs by code or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">No programs found.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}
