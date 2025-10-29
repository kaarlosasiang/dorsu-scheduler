"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
    MoreHorizontal,
    Plus,
    Eye,
    Edit,
    Trash2,
    Calendar,
    AlertCircle,
    Loader2,
    Users,
    DoorOpen,
    BookOpen,
    Clock,
    CheckCircle2,
    FileText,
    Sparkles,
    BarChart3,
    PlayCircle,
    Building2,
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
    CardDescription,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDataTable } from "@/hooks/use-data-table";
import { useSchedules } from "@/hooks/useSchedules";
import { useRouter } from "next/navigation";
import { type ISchedule, ScheduleAPI } from "@/lib/services/ScheduleAPI";
import { toast } from "sonner";

// Transform ISchedule to display format
interface Schedule {
    id: string;
    courseName: string;
    courseCode: string;
    facultyName: string;
    classroom: string;
    day: string;
    timeSlot: string;
    semester: string;
    academicYear: string;
    status: string;
    isGenerated: boolean;
    departmentName: string;
}

// Transform function
const transformSchedule = (schedule: ISchedule): Schedule => {
    const course = schedule.course as any;
    const faculty = schedule.faculty as any;
    const classroom = schedule.classroom as any;
    const department = schedule.department as any;

    return {
        id: schedule._id || schedule.id || "",
        courseName: course?.courseName || "Unknown Course",
        courseCode: course?.courseCode || "N/A",
        facultyName: faculty?.name ? `${faculty.name.first} ${faculty.name.last}` : "Unknown Faculty",
        classroom: classroom?.displayName || classroom?.roomNumber || "Unknown Room",
        day: schedule.timeSlot.day,
        timeSlot: `${schedule.timeSlot.startTime} - ${schedule.timeSlot.endTime}`,
        semester: schedule.semester,
        academicYear: schedule.academicYear,
        status: schedule.status || "draft",
        isGenerated: schedule.isGenerated || false,
        departmentName: department?.name || "Unknown Department",
    };
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", className?: string }> = {
        draft: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
        published: { variant: "default", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
        archived: { variant: "outline" },
    };

    const config = variants[status] || variants.draft;

    return (
        <Badge variant={config.variant} className={config.className}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
};

// Day badge component
const DayBadge = ({ day }: { day: string }) => {
    return (
        <Badge variant="outline" className="capitalize">
            {day.substring(0, 3)}
        </Badge>
    );
};

// Enhanced column definitions
const columns: ColumnDef<Schedule>[] = [
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
        id: "course",
        accessorKey: "courseCode",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Course" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-3 min-w-[200px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{row.original.courseName}</div>
                    <div className="text-sm text-muted-foreground">
                        {row.original.courseCode}
                    </div>
                </div>
            </div>
        ),
        enableSorting: true,
        size: 200,
    },
    {
        id: "faculty",
        accessorKey: "facultyName",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Faculty" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{row.original.facultyName}</span>
            </div>
        ),
        enableSorting: true,
        size: 180,
    },
    {
        id: "classroom",
        accessorKey: "classroom",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Classroom" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span>{row.original.classroom}</span>
            </div>
        ),
        enableSorting: true,
        size: 150,
    },
    {
        id: "schedule",
        accessorKey: "day",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Schedule" />
        ),
        cell: ({ row }) => (
            <div className="flex flex-col gap-1">
                <DayBadge day={row.original.day} />
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{row.original.timeSlot}</span>
                </div>
            </div>
        ),
        enableSorting: true,
        size: 140,
    },
    {
        id: "semester",
        accessorKey: "semester",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Semester" />
        ),
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium">{row.original.semester}</span>
                <span className="text-xs text-muted-foreground">{row.original.academicYear}</span>
            </div>
        ),
        enableSorting: true,
        size: 130,
    },
    {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
            <div className="flex flex-col gap-1">
                <StatusBadge status={row.original.status} />
                {row.original.isGenerated && (
                    <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        Auto
                    </Badge>
                )}
            </div>
        ),
        enableSorting: true,
        size: 100,
    },
    {
        id: "actions",
        enableHiding: false,
        size: 50,
        cell: ({ row }) => {
            const schedule = row.original;
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
                            onClick={() => navigator.clipboard.writeText(schedule.id)}
                        >
                            Copy schedule ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/schedules/${schedule.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/schedules/${schedule.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit schedule
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete schedule
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

export default function SchedulesPage() {
    const router = useRouter();
    const { schedules: rawSchedules, loading, error, stats, refetch } = useSchedules();
    const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);

    // Transform schedules data
    const schedules = React.useMemo(
        () => rawSchedules.map(transformSchedule),
        [rawSchedules]
    );

    // Initialize data table
    const { table } = useDataTable<Schedule>({
        data: schedules,
        columns: columns,
        pageCount: Math.ceil(schedules.length / 10),
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
            sorting: [{ id: "day", desc: false }],
            columnPinning: { left: ["select", "course"] },
        },
        enableAdvancedFilter: true,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        getRowId: (row) => row.id,
    });

    const handleGenerateSchedules = async () => {
        setGenerating(true);
        try {
            const result = await ScheduleAPI.generateSchedules({
                semester: "1st Semester",
                academicYear: "2024-2025",
                overwriteExisting: false,
            });

            if (result.success) {
                toast.success(`Successfully generated ${result.generated} schedules!`);
                setGenerateDialogOpen(false);
                refetch();
            } else {
                toast.error(result.message || "Failed to generate schedules");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to generate schedules");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading schedules...</p>
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
                    <h1 className="text-2xl font-bold tracking-tight">Automated Scheduling</h1>
                    <p className="text-muted-foreground">
                        Manage course schedules with intelligent conflict detection
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/schedules/add")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Schedule
                    </Button>
                    <Button onClick={() => setGenerateDialogOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Schedules
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All semesters</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Published</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.published}</div>
                        <p className="text-xs text-muted-foreground">Active schedules</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Auto-Generated</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.generated}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.generated / stats.total) * 100) : 0}% automated
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.draft}</div>
                        <p className="text-xs text-muted-foreground">Pending review</p>
                    </CardContent>
                </Card>
            </div>

            {/* Enhanced Data Table */}
            <Card>
                <CardContent className="pt-6">
                    <DataTable table={table}>
                        <DataTableAdvancedToolbar table={table}>
                            <DataTableSearch
                                table={table}
                                placeholder="Search schedules..."
                                className="max-w-sm"
                            />
                            <DataTableFilterList table={table} />
                            <DataTableSortList table={table} />
                            <DataTableViewOptions table={table} />
                        </DataTableAdvancedToolbar>
                    </DataTable>
                </CardContent>
            </Card>

            {/* Generate Dialog */}
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Generate Automated Schedules
                        </DialogTitle>
                        <DialogDescription>
                            The system will automatically generate conflict-free schedules for all courses
                            based on faculty availability, classroom capacity, and workload distribution.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Alert>
                            <PlayCircle className="h-4 w-4" />
                            <AlertDescription>
                                This will generate schedules for <strong>1st Semester 2024-2025</strong>.
                                Existing schedules will be preserved unless overwrite is enabled.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setGenerateDialogOpen(false)}
                            disabled={generating}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleGenerateSchedules} disabled={generating}>
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Schedules
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

