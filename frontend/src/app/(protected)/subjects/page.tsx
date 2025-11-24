"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
    MoreHorizontal,
    Plus,
    Eye,
    Edit,
    Trash2,
    BookOpen,
    GraduationCap,
    Hash,
    AlertCircle,
    Loader2,
    Beaker,
    ListChecks,
} from "lucide-react";

import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { SubjectAPI, type ISubject } from "@/lib/services/SubjectAPI";
import { toast } from "sonner";
import { useDataTable } from "@/hooks/use-data-table";

// Transform ISubject to display format
interface Subject {
    id: string;
    subjectCode: string;
    subjectName: string;
    units: number;
    course: { courseCode: string; courseName: string; id: string };
    department?: { name: string; code: string; id: string };
    yearLevel?: string;
    semester?: string;
    isLaboratory: boolean;
    prerequisites: number;
    createdAt: string;
}

// Transform function to convert ISubject to Subject
const transformSubject = (subject: ISubject): Subject => ({
    id: subject._id || subject.id || "",
    subjectCode: subject.subjectCode,
    subjectName: subject.subjectName,
    units: subject.units,
    course: typeof subject.course === 'object' ? subject.course : { courseCode: '', courseName: '', id: subject.course },
    department: typeof subject.department === 'object' ? subject.department : undefined,
    yearLevel: subject.yearLevel,
    semester: subject.semester,
    isLaboratory: subject.isLaboratory || false,
    prerequisites: Array.isArray(subject.prerequisites) ? subject.prerequisites.length : 0,
    createdAt: subject.createdAt || new Date().toISOString(),
});

export default function SubjectsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = React.useState<Subject[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Fetch subjects
    const fetchSubjects = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await SubjectAPI.getAll();
            const transformedSubjects = response.data.map(transformSubject);
            setSubjects(transformedSubjects);
        } catch (err: any) {
            setError(err.message || "Failed to load subjects");
            toast.error("Failed to load subjects");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subjects</h2>
                    <p className="text-muted-foreground">
                        Manage individual classes and courses within your curriculum
                    </p>
                </div>
                <Button onClick={() => router.push("/subjects/add")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subject
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            All Subjects
                            <Badge variant="secondary" className="ml-2">
                                {subjects.length} total
                            </Badge>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <SubjectsTable subjects={subjects} />
                </CardContent>
            </Card>
        </div>
    );
}

// Subjects Table Component
function SubjectsTable({ subjects }: { subjects: Subject[] }) {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);

    // Delete handler
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
            return;
        }

        try {
            setLoading(true);
            await SubjectAPI.delete(id);
            toast.success("Subject deleted successfully");
            window.location.reload(); // Refresh the page
        } catch (err: any) {
            toast.error(err.message || "Failed to delete subject");
        } finally {
            setLoading(false);
        }
    };

    // Enhanced column definitions
    const columns: ColumnDef<Subject>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "subjectCode",
            accessorKey: "subjectCode",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Subject Code" />
            ),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">
                            {row.getValue("subjectCode")}
                        </span>
                        {row.original.isLaboratory && (
                            <Badge variant="outline" className="ml-2">
                                <Beaker className="h-3 w-3 mr-1" />
                                Lab
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: "subjectName",
            accessorKey: "subjectName",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Subject Name" />
            ),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-[300px] truncate">
                            {row.getValue("subjectName")}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "units",
            accessorKey: "units",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Units" />
            ),
            cell: ({ row }) => {
                return (
                    <Badge variant="secondary">
                        {row.getValue("units")} units
                    </Badge>
                );
            },
        },
        {
            id: "course",
            accessorKey: "course.courseCode",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Course" />
            ),
            cell: ({ row }) => {
                const course = row.original.course;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{course.courseCode}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {course.courseName}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "yearLevel",
            accessorKey: "yearLevel",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Year Level" />
            ),
            cell: ({ row }) => {
                const yearLevel = row.getValue("yearLevel") as string | undefined;
                return yearLevel ? (
                    <Badge variant="outline">{yearLevel}</Badge>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            id: "semester",
            accessorKey: "semester",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Semester" />
            ),
            cell: ({ row }) => {
                const semester = row.getValue("semester") as string | undefined;
                return semester ? (
                    <Badge variant="outline">{semester}</Badge>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            id: "prerequisites",
            accessorKey: "prerequisites",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Prerequisites" />
            ),
            cell: ({ row }) => {
                const count = row.getValue("prerequisites") as number;
                return count > 0 ? (
                    <Badge variant="secondary">
                        <ListChecks className="h-3 w-3 mr-1" />
                        {count}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">None</span>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const subject = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => router.push(`/subjects/${subject.id}`)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.push(`/subjects/${subject.id}/edit`)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleDelete(subject.id)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const { table } = useDataTable<Subject>({
        data: subjects,
        columns,
        pageCount: Math.ceil(subjects.length / 10),
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
            sorting: [{ id: "subjectCode", desc: false }],
        },
    });

    return <DataTable table={table} />;
}

