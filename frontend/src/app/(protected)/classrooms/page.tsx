"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
    MoreHorizontal,
    Plus,
    Eye,
    Edit,
    Trash2,
    DoorOpen,
    Users,
    Calendar,
    AlertCircle,
    Loader2,
    Building,
    Hash,
    CheckCircle2,
    XCircle,
    Wrench,
    Mail,
    BarChart3,
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
import { useClassrooms } from "@/hooks/useClassrooms";
import { useRouter } from "next/navigation";
import { type IClassroom } from "@/lib/services/ClassroomAPI";

// Transform IClassroom to display format
interface Classroom {
    id: string;
    roomNumber: string;
    building: string;
    capacity: number;
    type: string;
    facilities: string[];
    status: string;
    displayName: string;
    createdAt: string;
}

// Transform function to convert IClassroom to Classroom
const transformClassroom = (classroom: IClassroom): Classroom => ({
    id: classroom._id || classroom.id || "",
    roomNumber: classroom.roomNumber,
    building: classroom.building || "Main Building",
    capacity: classroom.capacity,
    type: classroom.type || "lecture",
    facilities: classroom.facilities || [],
    status: classroom.status || "available",
    displayName: classroom.displayName || `${classroom.building || ""} - ${classroom.roomNumber}`,
    createdAt: classroom.createdAt || new Date().toISOString(),
});

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode }> = {
        available: {
            variant: "default",
            icon: <CheckCircle2 className="h-3 w-3" />,
        },
        maintenance: {
            variant: "destructive",
            icon: <Wrench className="h-3 w-3" />,
        },
        reserved: {
            variant: "secondary",
            icon: <XCircle className="h-3 w-3" />,
        },
    };

    const config = variants[status] || variants.available;

    return (
        <Badge variant={config.variant} className="gap-1">
            {config.icon}
            <span className="capitalize">{status}</span>
        </Badge>
    );
};

// Type badge component
const TypeBadge = ({ type }: { type: string }) => {
    const displayNames: Record<string, string> = {
        lecture: "Lecture",
        laboratory: "Laboratory",
        "computer-lab": "Computer Lab",
        conference: "Conference",
        other: "Other",
    };

    return (
        <Badge variant="outline" className="capitalize">
            {displayNames[type] || type}
        </Badge>
    );
};

// Enhanced column definitions
const columns: ColumnDef<Classroom>[] = [
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
        id: "roomNumber",
        accessorKey: "roomNumber",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Room" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-3 min-w-[200px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DoorOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{row.original.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                        Room {row.original.roomNumber}
                    </div>
                </div>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 200,
        meta: {
            label: "Room Number",
            placeholder: "Search room numbers...",
            variant: "text",
            icon: Hash,
        },
    },
    {
        id: "building",
        accessorKey: "building",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Building" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{row.original.building}</span>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 150,
        meta: {
            label: "Building",
            placeholder: "Search buildings...",
            variant: "text",
            icon: Building,
        },
    },
    {
        id: "capacity",
        accessorKey: "capacity",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Capacity" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{row.original.capacity}</span>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 100,
        meta: {
            label: "Capacity",
            variant: "range",
            icon: Users,
            range: [1, 500],
            unit: "seats",
        },
    },
    {
        id: "type",
        accessorKey: "type",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
        enableSorting: true,
        enableColumnFilter: true,
        size: 130,
        meta: {
            label: "Room Type",
            variant: "select",
            icon: DoorOpen,
            options: [
                { label: "Lecture", value: "lecture" },
                { label: "Laboratory", value: "laboratory" },
                { label: "Computer Lab", value: "computer-lab" },
                { label: "Conference", value: "conference" },
                { label: "Other", value: "other" },
            ],
        },
    },
    {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: true,
        enableColumnFilter: true,
        size: 130,
        meta: {
            label: "Status",
            variant: "select",
            icon: CheckCircle2,
            options: [
                { label: "Available", value: "available" },
                { label: "Maintenance", value: "maintenance" },
                { label: "Reserved", value: "reserved" },
            ],
        },
    },
    {
        id: "facilities",
        accessorKey: "facilities",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Facilities" />
        ),
        cell: ({ row }) => {
            const facilities = row.original.facilities;
            if (!facilities || facilities.length === 0) {
                return <span className="text-sm text-muted-foreground">None</span>;
            }
            return (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {facilities.slice(0, 2).map((facility, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                            {facility}
                        </Badge>
                    ))}
                    {facilities.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                            +{facilities.length - 2}
                        </Badge>
                    )}
                </div>
            );
        },
        enableSorting: false,
        enableColumnFilter: false,
        size: 200,
        meta: {
            label: "Facilities",
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
            const classroom = row.original;
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
                            onClick={() => navigator.clipboard.writeText(classroom.id)}
                        >
                            Copy classroom ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/classrooms/${classroom.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/classrooms/${classroom.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit classroom
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/classrooms/${classroom.id}/schedule`)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            View schedule
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete classroom
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

export default function ClassroomsPage() {
    const router = useRouter();
    const { classrooms: rawClassrooms, loading, error, stats } = useClassrooms();

    // Transform classrooms data
    const classrooms = React.useMemo(
        () => rawClassrooms.map(transformClassroom),
        [rawClassrooms]
    );

    // Initialize data table
    const { table } = useDataTable<Classroom>({
        data: classrooms,
        columns: columns,
        pageCount: Math.ceil(classrooms.length / 10),
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
            sorting: [{ id: "building", desc: false }, { id: "roomNumber", desc: false }],
            columnPinning: { left: ["select", "roomNumber"] },
            columnVisibility: {},
            columnSizing: {
                select: 50,
                roomNumber: 200,
                building: 150,
                capacity: 100,
                type: 130,
                status: 130,
                facilities: 200,
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
                    <p className="text-sm text-muted-foreground">Loading classrooms...</p>
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
                    <h1 className="text-2xl font-bold tracking-tight">Classrooms</h1>
                    <p className="text-muted-foreground">
                        Manage all classrooms, facilities, and room assignments
                    </p>
                </div>
                <Button onClick={() => router.push("/classrooms/add")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Classroom
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Across all buildings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCapacity}</div>
                        <p className="text-xs text-muted-foreground">Total seats</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Capacity</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageCapacity}</div>
                        <p className="text-xs text-muted-foreground">Seats per room</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.byStatus?.available || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Out of {stats.total} total
                        </p>
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
                                placeholder="Search classrooms by room number, building..."
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

