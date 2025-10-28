"use client";

import * as React from "react";
import {type ColumnDef} from "@tanstack/react-table";
import {
    MoreHorizontal,
    Plus,
    Eye,
    Edit,
    Trash2,
    BookOpen,
    Building2,
    Hash,
    Calendar,
    AlertCircle,
    Loader2,
    Code,
    Mail,
} from "lucide-react";

import {DataTable} from "@/components/common/data-table/data-table";
import {DataTableColumnHeader} from "@/components/common/data-table/data-table-column-header";
import {DataTableAdvancedToolbar} from "@/components/common/data-table/data-table-advanced-toolbar";
import {DataTableFilterList} from "@/components/common/data-table/data-table-filter-list";
import {DataTableSortList} from "@/components/common/data-table/data-table-sort-list";
import {DataTableActionBar} from "@/components/common/data-table/data-table-action-bar";
import {DataTableViewOptions} from "@/components/common/data-table/data-table-view-options";
import {DataTableSearch} from "@/components/common/data-table/data-table-search";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
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
import {Checkbox} from "@/components/ui/checkbox";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {useDataTable} from "@/hooks/use-data-table";
import {useCourses} from "@/hooks/useCourses";
import {useRouter} from "next/navigation";
import {type ICourse} from "@/lib/services/CourseAPI";

// Transform ICourse to display format
interface Course {
    id: string;
    courseCode: string;
    courseName: string;
    units: number;
    department: { name: string, code: string, id: string };
    createdAt: string;
}

// Transform function to convert ICourse to Course
const transformCourse = (course: ICourse): Course => ({
    id: course._id || course.id || "",
    courseCode: course.courseCode,
    courseName: course.courseName,
    units: course.units,
    department: course.department,
    createdAt: course.createdAt || new Date().toISOString(),
});

// Enhanced column definitions
const columns: ColumnDef<Course>[] = [
    {
        id: "select",
        header: ({table}) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({row}) => (
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
        id: "courseCode",
        accessorKey: "courseCode",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Course Code"/>
        ),
        cell: ({row}) => (
            <div className="flex items-center space-x-3 min-w-[150px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Code className="h-5 w-5 text-primary"/>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium font-mono truncate">{row.original.courseCode}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.units} {row.original.units === 1 ? 'unit' : 'units'}
                    </div>
                </div>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 200,
        meta: {
            label: "Course Code",
            placeholder: "Search course codes...",
            variant: "text",
            icon: Code,
        },
    },
    {
        id: "courseName",
        accessorKey: "courseName",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Course Name"/>
        ),
        cell: ({row}) => (
            <div className="max-w-[300px]">
                <div className="font-medium truncate">{row.original.courseName}</div>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 300,
        meta: {
            label: "Course Name",
            placeholder: "Search course names...",
            variant: "text",
            icon: BookOpen,
        },
    },
    {
        id: "units",
        accessorKey: "units",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Units"/>
        ),
        cell: ({row}) => (
            <div className="flex items-center space-x-1">
                <Hash className="h-4 w-4 text-muted-foreground"/>
                <span className="font-medium">{row.original.units}</span>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 80,
        meta: {
            label: "Units",
            variant: "range",
            icon: Hash,
            range: [0, 10],
            unit: "units",
        },
    },
    {
        id: "department",
        accessorKey: "departmentName",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Department"/>
        ),
        cell: ({row}) => (
            <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground"/>
                <Badge variant="secondary" className="truncate max-w-[150px]">
                    {row.original.department.name}
                </Badge>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 180,
        meta: {
            label: "Department",
            placeholder: "Search departments...",
            variant: "text",
            icon: Building2,
        },
    },
    {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Created"/>
        ),
        cell: ({row}) => {
            const date = new Date(row.original.createdAt);
            return (
                <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm">{date.toLocaleDateString()}</span>
                </div>
            );
        },
        enableSorting: true,
        enableColumnFilter: false,
        size: 120,
        meta: {
            label: "Created Date",
            icon: Calendar,
        },
    },
    {
        id: "actions",
        enableHiding: false,
        size: 50,
        cell: ({row}) => {
            const course = row.original;
            const router = useRouter();

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(course.id)}
                        >
                            Copy course ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={() => router.push(`/courses/${course.id}`)}>
                            <Eye className="mr-2 h-4 w-4"/>
                            View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/courses/${course.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4"/>
                            Edit course
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete course
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

// Custom Action Bar for bulk operations
function CustomActionBar() {
    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4"/>
                Edit Selected
            </Button>
            <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4"/>
                Export Data
            </Button>
            <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4"/>
                Delete Selected
            </Button>
        </div>
    );
}

export default function CoursesPage() {
    const router = useRouter();
    const {courses: rawCourses, loading, error, stats} = useCourses();

    // Transform courses data
    const courses = React.useMemo(
        () => rawCourses.map(transformCourse),
        [rawCourses]
    );

    // Initialize data table
    const {table} = useDataTable<Course>({
        data: courses,
        columns,
        pageCount: Math.ceil(courses.length / 10),
        initialState: {
            pagination: {pageIndex: 0, pageSize: 10},
            sorting: [{id: "courseCode", desc: false}],
            columnPinning: {left: ["select", "courseCode"]},
            columnVisibility: {},
            columnSizing: {
                select: 50,
                courseCode: 200,
                courseName: 300,
                units: 80,
                department: 180,
                createdAt: 120,
                actions: 50,
            },
        },
        enableAdvancedFilter: true,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        getRowId: (row) => row.id,
    });

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">Loading courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4"/>
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
                    <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
                    <p className="text-muted-foreground">
                        Manage all courses and curriculum offerings
                    </p>
                </div>
                <Button onClick={() => router.push("/courses/add")}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Add Course
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Across all departments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUnits}</div>
                        <p className="text-xs text-muted-foreground">Credit units offered</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Units</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.total > 0
                                ? (stats.totalUnits / stats.total).toFixed(1)
                                : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Per course</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Departments</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.byDepartment?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Offering courses</p>
                    </CardContent>
                </Card>
            </div>

            {/* Enhanced Data Table */}
            <Card>
                <CardContent className="pt-6">
                    <DataTable
                        table={table}
                        actionBar={
                            <DataTableActionBar table={table}>
                                <CustomActionBar/>
                            </DataTableActionBar>
                        }
                    >
                        <DataTableAdvancedToolbar table={table}>
                            <DataTableSearch
                                table={table}
                                placeholder="Search courses by code, name..."
                                className="max-w-sm"
                            />
                            <DataTableFilterList table={table}/>
                            <DataTableSortList table={table}/>
                            <DataTableViewOptions table={table}/>
                        </DataTableAdvancedToolbar>
                    </DataTable>
                </CardContent>
            </Card>
        </div>
    );
}