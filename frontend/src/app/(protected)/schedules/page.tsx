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
    PlayCircle,
    LayoutGrid,
    List,
    CalendarRange,
    TableProperties,
} from "lucide-react";

import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";
import { DataTableAdvancedToolbar } from "@/components/common/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/common/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/common/data-table/data-table-sort-list";
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
import { ScheduleCalendar } from "@/components/common/schedule-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    // When Mongoose populates, it replaces the ID string with the full object
    // So schedule.subject could be either a string (ID) or an object (populated)
    const subject = typeof schedule.subject === 'object' ? schedule.subject : null;
    const faculty = typeof schedule.faculty === 'object' ? schedule.faculty : null;
    const classroom = typeof schedule.classroom === 'object' ? schedule.classroom : null;
    const department = typeof schedule.department === 'object' ? schedule.department : null;

    // Debug logging (remove after testing)
    if (!subject) {
        console.log('Schedule with no subject object:', { scheduleId: schedule._id, subject: schedule.subject });
    }

    // Format days: use days array if available, otherwise single day
    const days = schedule.timeSlot?.days && schedule.timeSlot.days.length > 0
        ? schedule.timeSlot.days
        : [schedule.timeSlot?.day || "unknown"];

    // Sort days in proper week order for display
    const dayOrder: Record<string, number> = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 7
    };
    const sortedDays = [...days].sort((a, b) => (dayOrder[a.toLowerCase()] || 0) - (dayOrder[b.toLowerCase()] || 0));

    // Format day names: capitalize first 3 letters
    const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1, 3);
    const dayDisplay = sortedDays.map(formatDay).join(" ");

    return {
        id: schedule._id || schedule.id || "",
        courseName: (subject as any)?.subjectName || (subject as any)?.name || "Unknown Course",
        courseCode: (subject as any)?.subjectCode || (subject as any)?.code || "N/A",
        facultyName: (faculty as any)?.name
            ? `${(faculty as any).name.first || ''} ${(faculty as any).name.last || ''}`.trim()
            : (faculty as any)?.firstName && (faculty as any)?.lastName
            ? `${(faculty as any).firstName} ${(faculty as any).lastName}`
            : "Unknown Faculty",
        classroom: (classroom as any)?.roomNumber || (classroom as any)?.displayName || (classroom as any)?.name || "Unknown Room",
        day: dayDisplay,
        timeSlot: schedule.timeSlot?.startTime && schedule.timeSlot?.endTime
            ? `${schedule.timeSlot.startTime} - ${schedule.timeSlot.endTime}`
            : "N/A",
        semester: schedule.semester || "N/A",
        academicYear: schedule.academicYear || "N/A",
        status: schedule.status || "draft",
        isGenerated: schedule.isGenerated || false,
        departmentName: (department as any)?.name || (department as any)?.departmentName || "Unknown Department",
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

// Day badge component - displays day patterns like "Mon Wed" or "Tue Thu"
const DayBadge = ({ day }: { day: string }) => {
    return (
        <Badge variant="outline" className="font-medium">
            {day}
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
        size: 48,
        minSize: 48,
        maxSize: 64,
        enableResizing: false,
    },
    {
        id: "course",
        accessorKey: "courseCode",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Course" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{row.original.courseName}</div>
                    <div className="text-sm text-muted-foreground truncate">
                        {row.original.courseCode}
                    </div>
                </div>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
            const searchValue = value.toLowerCase();
            return (
                row.original.courseName.toLowerCase().includes(searchValue) ||
                row.original.courseCode.toLowerCase().includes(searchValue)
            );
        },
        size: 260,
        minSize: 160,
        maxSize: 420,
    },
    {
        id: "faculty",
        accessorKey: "facultyName",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Faculty" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2 min-w-0">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{row.original.facultyName}</span>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
            return row.original.facultyName.toLowerCase().includes(value.toLowerCase());
        },
        size: 160,
        minSize: 120,
        maxSize: 240,
    },
    {
        id: "classroom",
        accessorKey: "classroom",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Classroom" />
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2 min-w-0">
                <DoorOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{row.original.classroom}</span>
            </div>
        ),
        enableSorting: true,
        size: 120,
        minSize: 80,
        maxSize: 200,
    },
    {
        id: "schedule",
        accessorKey: "day",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Schedule" />
        ),
        cell: ({ row }) => (
            <div className="flex flex-col gap-1 min-w-0">
                <DayBadge day={row.original.day} />
                <div className="flex items-center space-x-1 text-sm text-muted-foreground min-w-0">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{row.original.timeSlot}</span>
                </div>
            </div>
        ),
        enableSorting: true,
        size: 160,
        minSize: 120,
        maxSize: 220,
    },
    {
        id: "semester",
        accessorKey: "semester",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Semester" />
        ),
        cell: ({ row }) => (
            <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{row.original.semester}</span>
                <span className="text-xs text-muted-foreground truncate">{row.original.academicYear}</span>
            </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
            if (Array.isArray(value)) {
                return value.includes(row.original.semester);
            }
            return row.original.semester.toLowerCase().includes(value.toLowerCase());
        },
        size: 140,
        minSize: 110,
        maxSize: 200,
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
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
            if (Array.isArray(value)) {
                return value.includes(row.original.status);
            }
            return row.original.status === value;
        },
        meta: {
            options: [
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
                { label: "Archived", value: "archived" },
            ],
        },
        size: 120,
        minSize: 100,
        maxSize: 160,
    },
    {
        id: "actions",
        enableHiding: false,
        size: 56,
        minSize: 48,
        maxSize: 96,
        enableResizing: false,
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
    const [selectedSemester, setSelectedSemester] = React.useState("1st Semester");
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState("2024-2025");
    const [view, setView] = React.useState<"table" | "calendar">("table");

    // Transform schedules data
    const schedules = React.useMemo(
        () => rawSchedules.map(transformSchedule),
        [rawSchedules]
    );

    // Transform schedules for calendar view
    const calendarSchedules = React.useMemo(() => {
        return schedules.map(schedule => ({
            ...schedule,
            startTime: schedule.timeSlot.split(" - ")[0] || "",
            endTime: schedule.timeSlot.split(" - ")[1] || "",
        }));
    }, [schedules]);

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
        enableAdvancedFilter: false,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        getRowId: (row) => row.id,
    });

    const handleGenerateSchedules = async () => {
        setGenerating(true);
        try {
            const result = await ScheduleAPI.generateSchedules({
                semester: selectedSemester,
                academicYear: selectedAcademicYear,
                overwriteExisting: false,
            });

            if (result.success) {
                toast.success(`Successfully generated ${result.generated} schedules for ${selectedSemester} ${selectedAcademicYear}!`);
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
                    <div className="flex items-center border rounded-md">
                        <Button
                            variant={view === "table" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setView("table")}
                            className="rounded-r-none"
                        >
                            <TableProperties className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === "calendar" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setView("calendar")}
                            className="rounded-l-none"
                        >
                            <CalendarRange className="h-4 w-4" />
                        </Button>
                    </div>
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

            {/* View Content */}
            {view === "table" ? (
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
            ) : (
                <ScheduleCalendar
                    schedules={calendarSchedules}
                    onEventClick={(schedule) => router.push(`/schedules/${schedule.id}`)}
                />
            )}

            {/* Generate Dialog */}
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
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
                        <div className="space-y-2">
                            <label htmlFor="semester" className="text-sm font-medium">
                                Semester
                            </label>
                            <select
                                id="semester"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                            >
                                <option value="1st Semester">1st Semester</option>
                                <option value="2nd Semester">2nd Semester</option>
                                <option value="Summer">Summer</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="academicYear" className="text-sm font-medium">
                                Academic Year
                            </label>
                            <select
                                id="academicYear"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedAcademicYear}
                                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                            >
                                <option value="2024-2025">2024-2025</option>
                                <option value="2025-2026">2025-2026</option>
                                <option value="2026-2027">2026-2027</option>
                            </select>
                        </div>

                        <Alert>
                            <PlayCircle className="h-4 w-4" />
                            <AlertDescription>
                                This will generate schedules for <strong>{selectedSemester} {selectedAcademicYear}</strong>.
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

