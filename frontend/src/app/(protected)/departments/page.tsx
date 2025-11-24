"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
    MoreHorizontal,
    Plus,
    Eye,
    Edit,
    Trash2,
    Building2,
    BookOpen,
    Users,
    Calendar,
    AlertCircle,
    Loader2,
    Code,
    FileText,
    Mail,
} from "lucide-react";

import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";
import { DataTableAdvancedToolbar } from "@/components/common/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/common/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/common/data-table/data-table-sort-list";
import { DataTableActionBar } from "@/components/common/data-table/data-table-action-bar";
import { DataTableViewOptions } from "@/components/common/data-table/data-table-view-options";
import { DataTableSearch } from "@/components/common/data-table/data-table-search";
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
import { useDataTable } from "@/hooks/use-data-table";
import { useDepartments } from "@/hooks/useDepartments";
import { useRouter } from "next/navigation";
import { type IDepartment } from "@/lib/services/DepartmentAPI";

// Transform IDepartment to display format
interface Department {
    id: string;
    name: string;
    code: string;
    description: string;
    facultyCount: number;
    coursesCount: number;
    createdAt: string;
}

// Transform function to convert IDepartment to Department
const transformDepartment = (department: IDepartment): Department => ({
    id: department._id || department.id || "",
    name: department.name,
    code: department.code,
    description: department.description || "No description",
    facultyCount: department.facultyCount || 0,
    coursesCount: department.coursesCount || 0,
    createdAt: department.createdAt || new Date().toISOString(),
});

// Enhanced column definitions
const columns: ColumnDef<Department>[] = [
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
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Department" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-3 min-w-[250px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{row.original.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {row.original.code}
                    </div>
                </div>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 300,
        meta: {
            label: "Department Name",
            placeholder: "Search department names...",
            variant: "text",
            icon: Building2,
        },
    },
    {
        id: "code",
        accessorKey: "code",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => (
            <Badge variant="outline" className="font-mono">
                {row.original.code}
            </Badge>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 100,
        meta: {
            label: "Department Code",
            placeholder: "Search codes...",
            variant: "text",
            icon: Code,
        },
    },
    {
        id: "description",
        accessorKey: "description",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                {row.original.description}
            </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 200,
        meta: {
            label: "Description",
            icon: FileText,
        },
    },
    {
        id: "facultyCount",
        accessorKey: "facultyCount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Faculty" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{row.original.facultyCount}</span>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 80,
        meta: {
            label: "Faculty Count",
            variant: "range",
            icon: Users,
            range: [0, 50],
            unit: "members",
        },
    },
    {
        id: "coursesCount",
        accessorKey: "coursesCount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Courses" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{row.original.coursesCount}</span>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 80,
        meta: {
            label: "Courses Count",
            variant: "range",
            icon: BookOpen,
            range: [0, 100],
            unit: "courses",
        },
    },
    {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => {
            const date = new Date(row.original.createdAt);
            return (
                <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
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
        cell: ({ row }) => {
            const department = row.original;

            return <DepartmentActionCell department={department} />;
        },
    },
];

function DepartmentActionCell({ department }: { department: any }) {
    const router = useRouter();

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
                            onClick={() => navigator.clipboard.writeText(department.id)}
                        >
                            Copy department ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/departments/${department.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/departments/${department.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit department
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/departments/${department.id}/courses`)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Manage courses
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/departments/${department.id}/faculty`)}>
                            <Users className="mr-2 h-4 w-4" />
                            View faculty
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete department
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
    );
}

// Custom Action Bar for bulk operations
function CustomActionBar() {
    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Selected
            </Button>
            <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Export Data
            </Button>
            <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
            </Button>
        </div>
    );
}

export default function DepartmentsPage() {
    const router = useRouter();
    const { departments: rawDepartments, loading, error, stats } = useDepartments();

    // Transform departments data
    const departments = React.useMemo(
        () => rawDepartments.map(transformDepartment),
        [rawDepartments]
    );

    // Update column metadata dynamically
    const enhancedColumns = React.useMemo(() => {
        return columns.map((column) => {
            if (column.id === "facultyCount" && column.meta?.options) {
                // Could add dynamic faculty count ranges here
            }
            return column;
        });
    }, [departments]);

    // Initialize data table
    const { table } = useDataTable<Department>({
        data: departments,
        columns: enhancedColumns,
        pageCount: Math.ceil(departments.length / 10),
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
            sorting: [{ id: "name", desc: false }],
            columnPinning: { left: ["select", "name"] },
            columnVisibility: {},
            columnSizing: {
                select: 50,
                name: 300,
                code: 100,
                description: 200,
                facultyCount: 80,
                coursesCount: 80,
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
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading departments...</p>
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
                    <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
                    <p className="text-muted-foreground">
                        Manage all departments, courses, and faculty assignments
                    </p>
                </div>
                <Button onClick={() => router.push("/departments/add")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Across all colleges</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCourses}</div>
                        <p className="text-xs text-muted-foreground">Course offerings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {departments.reduce((sum, dept) => sum + dept.facultyCount, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Faculty members</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {departments.length > 0
                                ? (stats.totalCourses / departments.length).toFixed(1)
                                : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Per department</p>
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
                                <CustomActionBar />
                            </DataTableActionBar>
                        }
                    >
                        <DataTableAdvancedToolbar table={table}>
                            <DataTableSearch
                                table={table}
                                placeholder="Search departments by name, code..."
                                className="max-w-sm"
                            />
                            <DataTableFilterList table={table} />
                            <DataTableSortList table={table} />
                            <DataTableViewOptions table={table} />
                        </DataTableAdvancedToolbar>
                    </DataTable>
                </CardContent>
            </Card>
        </div>
    );
}
