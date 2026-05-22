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
    CalendarRange,
    TableProperties,
    Download,
    Layers,
} from "lucide-react";

import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";
import { DataTableAdvancedToolbar } from "@/components/common/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/common/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/common/data-table/data-table-sort-list";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDataTable } from "@/hooks/use-data-table";
import { useSchedules } from "@/hooks/useSchedules";
import { useRouter } from "next/navigation";
import { type ISchedule, ScheduleAPI } from "@/lib/services/ScheduleAPI";
import { toast } from "sonner";
import { exportCourseOffering, exportFacultyWorkload, type ExportSchedule } from "@/lib/utils/exportCourseOffering";
import { useCourses } from "@/hooks/useCourses";
import { useFaculty } from "@/hooks/useFaculty";
import type { IFaculty } from "@/lib/services/FacultyAPI";
import SectionAPI, { type ISection } from "@/lib/services/SectionAPI";
import { ScheduleCalendar } from "@/components/common/schedule-calendar";
import { useAuth } from "@/contexts/authContext";
import { FacultyAPI } from "@/lib/services/FacultyAPI";
import { useQueryState } from "nuqs";
import { getFiltersStateParser } from "@/lib/parsers";

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
    yearLevel: string;
    section: string;
    status: string;
    isGenerated: boolean;
    departmentName: string;
}

interface ScheduleSubjectCourse {
    courseName?: string;
    courseCode?: string;
}

interface ScheduleSubject {
    subjectName?: string;
    name?: string;
    subjectCode?: string;
    code?: string;
    courseOfferings?: Array<{ course: ScheduleSubjectCourse | string; yearLevel?: string }>;
    // legacy fallbacks (populated before model migration)
    courses?: ScheduleSubjectCourse[] | string[];
    course?: string | ScheduleSubjectCourse;
    yearLevel?: string;
}

interface ScheduleFaculty {
    name?: {
        first?: string;
        last?: string;
    };
    firstName?: string;
    lastName?: string;
}

interface ScheduleClassroom {
    roomNumber?: string;
    displayName?: string;
    name?: string;
}

interface ScheduleDepartment {
    name?: string;
    departmentName?: string;
}

interface ScheduleSection {
    name?: string;
    sectionCode?: string;
}

type FilterableScheduleColumn = ColumnDef<Schedule> & {
    id?: string;
    enableColumnFilter?: boolean;
};

const SCHOOL_YEAR_OPTION_COUNT = 4;

const getCurrentSchoolYearStart = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return month >= 6 ? year : year - 1;
};

const buildAcademicYearOptions = (count: number) => {
    const startYear = getCurrentSchoolYearStart();

    return Array.from({ length: count }, (_, index) => {
        const year = startYear + index;
        return `${year}-${year + 1}`;
    });
};

function getMostCommonValue(values: string[]): string | undefined {
    const counts = new Map<string, number>();

    for (const value of values) {
        if (!value || value === "N/A") {
            continue;
        }

        counts.set(value, (counts.get(value) || 0) + 1);
    }

    let best: string | undefined;
    let bestCount = 0;

    for (const [value, count] of counts) {
        if (count > bestCount) {
            best = value;
            bestCount = count;
        }
    }

    return best;
}

function getFilterValue(
    filters: Array<{ id: string; value?: unknown }>,
    columnId: string
): string | undefined {
    const filter = filters.find((item) => item.id === columnId);
    if (!filter?.value) {
        return undefined;
    }

    const { value } = filter;
    if (Array.isArray(value)) {
        return value[0] as string;
    }

    return typeof value === "string" ? value : undefined;
}

function formatFacultyName(faculty: IFaculty): string {
    const { name } = faculty;
    return `${name.first} ${name.middle ? name.middle + " " : ""}${name.last}${name.ext ? " " + name.ext : ""}`;
}

function resolveScheduleSection(schedule: ISchedule): string {
    const section = typeof schedule.section === "object" ? schedule.section as ScheduleSection : null;
    const sectionDetails = typeof schedule.sectionDetails === "object"
        ? schedule.sectionDetails as ScheduleSection
        : null;

    return (
        section?.name ||
        section?.sectionCode ||
        sectionDetails?.name ||
        sectionDetails?.sectionCode ||
        ""
    );
}

function resolveScheduleYearLevel(schedule: ISchedule): string {
    const section = typeof schedule.section === "object" ? schedule.section as { yearLevel?: string } : null;
    return schedule.yearLevel || section?.yearLevel || "";
}

function getFacultyProgramId(faculty: IFaculty): string {
    if (typeof faculty.program === "string") return faculty.program;
    return faculty.program?._id || faculty.program?.id || "";
}

function getConfiguredSectionLabel(section: ISection, showYearLevel: boolean): string {
    const code = section.name ?? section.sectionCode;
    return showYearLevel ? `${section.yearLevel} — ${code}` : code;
}

function scheduleMatchesConfiguredSection(
    schedule: ISchedule,
    sectionId: string,
    configuredSections: ISection[]
): boolean {
    const selected = configuredSections.find(
        (section) => (section._id || section.id) === sectionId
    );
    if (!selected) return false;

    const scheduleSectionId =
        typeof schedule.section === "object" && schedule.section
            ? schedule.section._id || schedule.section.id
            : typeof schedule.section === "string"
            ? schedule.section
            : "";

    if (scheduleSectionId && scheduleSectionId === sectionId) return true;

    const code = (selected.name || selected.sectionCode).toUpperCase();
    return resolveScheduleSection(schedule).toUpperCase() === code;
}

function getExportRowsFromTable(
    filteredRows: Schedule[],
    rawSchedules: ISchedule[]
): ExportSchedule[] {
    const visibleIds = new Set(filteredRows.map((row) => row.id).filter(Boolean));

    return rawSchedules.filter((schedule) =>
        visibleIds.has(schedule._id || schedule.id || "")
    ) as ExportSchedule[];
}

// Transform function
const transformSchedule = (schedule: ISchedule): Schedule => {
    // When Mongoose populates, it replaces the ID string with the full object
    // So schedule.subject could be either a string (ID) or an object (populated)
    const subject = typeof schedule.subject === 'object' ? (schedule.subject as ScheduleSubject) : null;
    const subjectCourse = subject && (
        Array.isArray(subject.courses) && subject.courses.length > 0
            ? (typeof subject.courses[0] === 'object' ? subject.courses[0] as ScheduleSubjectCourse : null)
            : (typeof subject.course === 'object' ? subject.course as ScheduleSubjectCourse : null)
    );
    const faculty = typeof schedule.faculty === 'object' ? (schedule.faculty as ScheduleFaculty) : null;
    const classroom = typeof schedule.classroom === 'object' ? (schedule.classroom as ScheduleClassroom) : null;
    const department = typeof schedule.department === 'object' ? (schedule.department as ScheduleDepartment) : null;
    const section = typeof schedule.section === 'object' ? (schedule.section as ScheduleSection) : null;
    const sectionDetails = typeof schedule.sectionDetails === "object"
        ? (schedule.sectionDetails as ScheduleSection)
        : null;

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
        courseName: subject?.subjectName || subject?.name || "Unknown Course",
        courseCode: subject?.subjectCode || subject?.code || "N/A",
        facultyName: faculty?.name
            ? `${faculty.name.first || ''} ${faculty.name.last || ''}`.trim()
            : faculty?.firstName && faculty?.lastName
            ? `${faculty.firstName} ${faculty.lastName}`
            : "Unknown Faculty",
        classroom: classroom?.roomNumber || classroom?.displayName || classroom?.name || "Unknown Room",
        day: dayDisplay,
        timeSlot: schedule.timeSlot?.startTime && schedule.timeSlot?.endTime
            ? `${schedule.timeSlot.startTime} - ${schedule.timeSlot.endTime}`
            : "N/A",
        semester: schedule.semester || "N/A",
        academicYear: schedule.academicYear || "N/A",
        yearLevel: schedule.yearLevel || subject?.yearLevel || "N/A",
        section:
            section?.name ||
            section?.sectionCode ||
            sectionDetails?.name ||
            sectionDetails?.sectionCode ||
            "",
        status: schedule.status || "draft",
        isGenerated: schedule.isGenerated || false,
        departmentName:
            subjectCourse?.courseName ||
            subjectCourse?.courseCode ||
            department?.name ||
            department?.departmentName ||
            "Unknown Program",
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
const baseColumns: ColumnDef<Schedule>[] = [
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
            if (Array.isArray(value)) {
                return value.includes(row.original.courseCode);
            }

            const searchValue = value.toLowerCase();
            return (
                row.original.courseName.toLowerCase().includes(searchValue) ||
                row.original.courseCode.toLowerCase().includes(searchValue)
            );
        },
        meta: {
            label: "Course",
            placeholder: "Select course...",
            variant: "select",
            icon: BookOpen,
            options: [],
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
            if (Array.isArray(value)) {
                return value.includes(row.original.facultyName);
            }

            return row.original.facultyName.toLowerCase().includes(value.toLowerCase());
        },
        meta: {
            label: "Faculty",
            placeholder: "Select faculty...",
            variant: "select",
            icon: Users,
            options: [],
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
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
            if (Array.isArray(value)) {
                return value.includes(row.original.classroom);
            }

            return row.original.classroom.toLowerCase().includes(value.toLowerCase());
        },
        meta: {
            label: "Classroom",
            placeholder: "Select classroom...",
            variant: "select",
            icon: DoorOpen,
            options: [],
        },
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
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
            const scheduleValue = `${row.original.day} | ${row.original.timeSlot}`;

            if (Array.isArray(value)) {
                return value.includes(scheduleValue);
            }

            const searchValue = value.toLowerCase();
            return (
                row.original.day.toLowerCase().includes(searchValue) ||
                row.original.timeSlot.toLowerCase().includes(searchValue)
            );
        },
        meta: {
            label: "Schedule",
            placeholder: "Select schedule...",
            variant: "select",
            icon: Clock,
            options: [],
        },
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
        meta: {
            label: "Semester",
            placeholder: "Select semester...",
            variant: "select",
            icon: Calendar,
            options: [
                { label: "1st Semester", value: "1st Semester" },
                { label: "2nd Semester", value: "2nd Semester" },
                { label: "Summer", value: "Summer" },
            ],
        },
    size: 140,
    minSize: 110,
    maxSize: 200,
  },
  {
    id: "academicYear",
    accessorKey: "academicYear",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="S.Y." />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.academicYear}</Badge>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) {
        return value.includes(row.original.academicYear);
      }
      return row.original.academicYear.toLowerCase().includes(value.toLowerCase());
    },
    meta: {
      label: "S.Y.",
      placeholder: "Select school year...",
      variant: "select",
      icon: Calendar,
      options: [],
    },
    size: 130,
    minSize: 100,
    maxSize: 180,
  },
  {
    id: "yearLevel",
    accessorKey: "yearLevel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Year Level" />
    ),
    cell: ({ row }) => (
      row.original.yearLevel && row.original.yearLevel !== "N/A"
        ? <Badge variant="outline">{row.original.yearLevel}</Badge>
        : <span className="text-muted-foreground text-sm">—</span>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) {
        return value.includes(row.original.yearLevel);
      }
      return row.original.yearLevel.toLowerCase().includes(value.toLowerCase());
    },
    meta: {
      label: "Year Level",
      placeholder: "Select year level...",
      variant: "select",
      icon: Layers,
      options: [
        { label: "1st Year", value: "1st Year" },
        { label: "2nd Year", value: "2nd Year" },
        { label: "3rd Year", value: "3rd Year" },
        { label: "4th Year", value: "4th Year" },
        { label: "5th Year", value: "5th Year" },
      ],
    },
    size: 120,
    minSize: 90,
    maxSize: 160,
  },
  {
    id: "section",
    accessorKey: "section",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
    cell: ({ row }) => (
      row.original.section
        ? <Badge variant="outline" className="font-mono">{row.original.section}</Badge>
        : <span className="text-muted-foreground text-sm">—</span>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) {
        return value.includes(row.original.section);
      }

      const sectionValue = row.original.section.toLowerCase();
      return sectionValue.includes(value.toLowerCase());
    },
    meta: {
      label: "Section",
      placeholder: "Select section...",
      variant: "select",
      icon: LayoutGrid,
      options: [],
    },
    size: 110,
    minSize: 80,
    maxSize: 160,
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
            label: "Status",
            placeholder: "Select status...",
            variant: "select",
            icon: CheckCircle2,
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

            return (
                <ScheduleActionCell
                    schedule={schedule}
                    onDelete={async () => false}
                />
            );
        },
    },
];

function ScheduleActionCell({
    schedule,
    onDelete,
}: {
    schedule: Schedule;
    onDelete: (id: string) => Promise<boolean>;
}) {
    const router = useRouter();
    const { user } = useAuth();
    const isFaculty = user?.role === "faculty";
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    if (isFaculty) {
        return (
            <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => router.push(`/schedules/${schedule.id}`)}
            >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View details</span>
            </Button>
        );
    }

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const success = await onDelete(schedule.id);
            if (success) {
                setDeleteOpen(false);
            }
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
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
                    <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteOpen(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete schedule
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete the schedule for{" "}
                            <strong>
                                {schedule.courseCode} — {schedule.day} ({schedule.timeSlot})
                            </strong>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                void handleConfirmDelete();
                            }}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function SchedulesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isFaculty = user?.role === "faculty";
    const isAdmin = user?.role === "admin";

    // For faculty users, fetch their linked Faculty record to get the ID for filtering
    const [facultyId, setFacultyId] = React.useState<string | undefined>(undefined);
    const [facultyLoading, setFacultyLoading] = React.useState(isFaculty);

    React.useEffect(() => {
        if (!isFaculty) return;
        FacultyAPI.getMe()
            .then((res) => {
                const id = res.data?._id || res.data?.id;
                setFacultyId(id);
            })
            .catch(() => {
                // Faculty record not linked — show empty list
            })
            .finally(() => setFacultyLoading(false));
    }, [isFaculty]);

    const scheduleParams = React.useMemo(
        () => (isFaculty && facultyId ? { faculty: facultyId } : isFaculty ? null : {}),
        [isFaculty, facultyId]
    );

    const { schedules: rawSchedules, loading: schedulesLoading, error, stats, refetch } = useSchedules(
        scheduleParams
    );

    const loading = facultyLoading || schedulesLoading;
    const { courses } = useCourses();
    const academicYearOptions = React.useMemo(
        () => buildAcademicYearOptions(SCHOOL_YEAR_OPTION_COUNT),
        []
    );
    const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);
    const [publishing, setPublishing] = React.useState(false);
    const [publishConfirmOpen, setPublishConfirmOpen] = React.useState(false);
    const [publishConfirmMode, setPublishConfirmMode] = React.useState<"selected" | "all">("selected");
    const [selectedSemester, setSelectedSemester] = React.useState("1st Semester");
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(() => academicYearOptions[0] ?? "");
    const [selectedProgramId, setSelectedProgramId] = React.useState("all");

    // Export state
    const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
    const [exporting, setExporting] = React.useState(false);
    const [exportSemester, setExportSemester] = React.useState("1st Semester");
    const [exportAcademicYear, setExportAcademicYear] = React.useState(() => academicYearOptions[0] ?? "");
    const [exportProgramId, setExportProgramId] = React.useState("all");
    const [exportYearLevel, setExportYearLevel] = React.useState("all");
    const [exportSection, setExportSection] = React.useState("all");
    const [exportInstitute, setExportInstitute] = React.useState("Baganga Campus");
    const [workloadExportDialogOpen, setWorkloadExportDialogOpen] = React.useState(false);
    const [workloadExporting, setWorkloadExporting] = React.useState(false);
    const [workloadFacultyId, setWorkloadFacultyId] = React.useState("");
    const [workloadSemester, setWorkloadSemester] = React.useState("1st Semester");
    const [workloadAcademicYear, setWorkloadAcademicYear] = React.useState(() => academicYearOptions[0] ?? "");
    const [workloadYearLevel, setWorkloadYearLevel] = React.useState("all");
    const [workloadSection, setWorkloadSection] = React.useState("all");
    const [configuredSections, setConfiguredSections] = React.useState<ISection[]>([]);
    const [configuredSectionsLoading, setConfiguredSectionsLoading] = React.useState(false);
    const [view, setView] = React.useState<"table" | "calendar">("table");

    const { faculties } = useFaculty();

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

    const handleDeleteSchedule = React.useCallback(
        async (id: string) => {
            try {
                const response = await ScheduleAPI.delete(id);
                if (response?.success !== false) {
                    toast.success("Schedule deleted successfully");
                    await refetch();
                    return true;
                }
                toast.error("Failed to delete schedule");
                return false;
            } catch (err) {
                toast.error(
                    err instanceof Error ? err.message : "Failed to delete schedule"
                );
                return false;
            }
        },
        [refetch]
    );

    const updatedColumns = React.useMemo(() => {
        const buildCountMap = (values: string[]) => {
            return values.reduce((acc, value) => {
                if (!value) {
                    return acc;
                }

                acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        };

        const courseCounts = buildCountMap(schedules.map((schedule) => schedule.courseCode));
        const facultyCounts = buildCountMap(schedules.map((schedule) => schedule.facultyName));
        const classroomCounts = buildCountMap(schedules.map((schedule) => schedule.classroom));
        const scheduleCounts = buildCountMap(
            schedules.map((schedule) => `${schedule.day} | ${schedule.timeSlot}`)
        );
        const semesterCounts = buildCountMap(schedules.map((schedule) => schedule.semester));
        const academicYearCounts = buildCountMap(schedules.map((schedule) => schedule.academicYear));
        const yearLevelCounts = buildCountMap(schedules.map((schedule) => schedule.yearLevel));
        const sectionCounts = buildCountMap(schedules.map((schedule) => schedule.section).filter(Boolean));
        const statusCounts = buildCountMap(schedules.map((schedule) => schedule.status));

        return baseColumns.map((column) => {
            if (column.id === "actions") {
                return {
                    ...column,
                    cell: ({ row }: { row: { original: Schedule } }) => (
                        <ScheduleActionCell
                            schedule={row.original}
                            onDelete={handleDeleteSchedule}
                        />
                    ),
                };
            }

            if (!column.meta) {
                return column;
            }

            if (column.id === "course") {
                const courseLookup = new Map(
                    schedules.map((schedule) => [
                        schedule.courseCode,
                        `${schedule.courseCode} - ${schedule.courseName}`,
                    ])
                );

                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: Object.entries(courseCounts)
                            .sort(([left], [right]) => left.localeCompare(right))
                            .map(([value, count]) => ({
                                label: courseLookup.get(value) ?? value,
                                value,
                                count,
                            })),
                    },
                };
            }

            if (column.id === "faculty") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: Object.entries(facultyCounts)
                            .sort(([left], [right]) => left.localeCompare(right))
                            .map(([value, count]) => ({ label: value, value, count })),
                    },
                };
            }

            if (column.id === "classroom") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: Object.entries(classroomCounts)
                            .sort(([left], [right]) => left.localeCompare(right))
                            .map(([value, count]) => ({ label: value, value, count })),
                    },
                };
            }

            if (column.id === "schedule") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: Object.entries(scheduleCounts)
                            .sort(([left], [right]) => left.localeCompare(right))
                            .map(([value, count]) => ({ label: value, value, count })),
                    },
                };
            }

            if (column.id === "semester") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: [
                            { label: "1st Semester", value: "1st Semester", count: semesterCounts["1st Semester"] || 0 },
                            { label: "2nd Semester", value: "2nd Semester", count: semesterCounts["2nd Semester"] || 0 },
                            { label: "Summer", value: "Summer", count: semesterCounts["Summer"] || 0 },
                        ],
                    },
                };
            }

            if (column.id === "academicYear") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: Object.entries(academicYearCounts)
                            .sort(([left], [right]) => left.localeCompare(right))
                            .map(([value, count]) => ({ label: value, value, count })),
                    },
                };
            }

            if (column.id === "yearLevel") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: (column.meta as any).options.map((o: any) => ({
                            ...o,
                            count: yearLevelCounts[o.value] || 0,
                        })),
                    },
                };
            }

            if (column.id === "section") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: Object.entries(sectionCounts)
                            .sort(([left], [right]) => left.localeCompare(right))
                            .map(([value, count]) => ({ label: value, value, count })),
                    },
                };
            }

            if (column.id === "status") {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        options: [
                            { label: "Draft", value: "draft", count: statusCounts.draft || 0 },
                            { label: "Published", value: "published", count: statusCounts.published || 0 },
                            { label: "Archived", value: "archived", count: statusCounts.archived || 0 },
                        ],
                    },
                };
            }

            return column;
        });
    }, [schedules, handleDeleteSchedule]);

    const selectedProgram = React.useMemo(
        () => courses.find((course) => (course._id || course.id) === selectedProgramId),
        [courses, selectedProgramId]
    );

    const exportSectionOptions = React.useMemo(() => {
        const sectionSet = new Set(
            schedules
                .map((schedule) => schedule.section)
                .filter((section): section is string => Boolean(section && section.trim()))
        );

        return ["all", ...Array.from(sectionSet).sort((left, right) => left.localeCompare(right))];
    }, [schedules]);

    const exportProgram = React.useMemo(
        () => courses.find((course) => (course._id || course.id) === exportProgramId),
        [courses, exportProgramId]
    );

    const facultyOptions = React.useMemo(() => {
        return faculties
            .filter((faculty) => faculty.status === "active")
            .map((faculty) => ({
                id: faculty._id || faculty.id || "",
                name: formatFacultyName(faculty),
            }))
            .filter((faculty) => faculty.id)
            .sort((left, right) => left.name.localeCompare(right.name));
    }, [faculties]);

    const selectedWorkloadFaculty = React.useMemo(
        () => faculties.find((faculty) => (faculty._id || faculty.id) === workloadFacultyId),
        [faculties, workloadFacultyId]
    );

    const workloadSectionOptions = React.useMemo(() => {
        const showYearLevel = workloadYearLevel === "all";

        return configuredSections
            .map((section) => ({
                id: section._id || section.id || "",
                label: getConfiguredSectionLabel(section, showYearLevel),
            }))
            .filter((option) => option.id)
            .sort((left, right) => left.label.localeCompare(right.label));
    }, [configuredSections, workloadYearLevel]);

    const selectedWorkloadSectionLabel = React.useMemo(() => {
        if (workloadSection === "all") return null;

        const section = configuredSections.find(
            (item) => (item._id || item.id) === workloadSection
        );
        if (!section) return null;

        return getConfiguredSectionLabel(section, workloadYearLevel === "all");
    }, [workloadSection, configuredSections, workloadYearLevel]);

    React.useEffect(() => {
        if (!workloadExportDialogOpen || !workloadFacultyId) {
            setConfiguredSections([]);
            setConfiguredSectionsLoading(false);
            return;
        }

        const faculty = faculties.find(
            (item) => (item._id || item.id) === workloadFacultyId
        );
        const programId = faculty ? getFacultyProgramId(faculty) : "";

        if (!programId) {
            setConfiguredSections([]);
            setConfiguredSectionsLoading(false);
            return;
        }

        let cancelled = false;
        setConfiguredSectionsLoading(true);

        const fetchSections = workloadYearLevel !== "all"
            ? SectionAPI.getByProgramAndYearLevel(programId, workloadYearLevel)
            : SectionAPI.getByProgram(programId);

        fetchSections
            .then((response) => {
                if (cancelled) return;
                const activeSections = (response.data || []).filter(
                    (section) => section.status === "active"
                );
                setConfiguredSections(activeSections);
            })
            .catch(() => {
                if (!cancelled) setConfiguredSections([]);
            })
            .finally(() => {
                if (!cancelled) setConfiguredSectionsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [workloadExportDialogOpen, workloadFacultyId, workloadYearLevel, faculties]);

    React.useEffect(() => {
        if (workloadSection === "all") return;

        const validSectionIds = new Set(
            configuredSections
                .map((section) => section._id || section.id)
                .filter(Boolean)
        );

        if (!validSectionIds.has(workloadSection)) {
            setWorkloadSection("all");
        }
    }, [configuredSections, workloadSection]);

    // For faculty: hide the select checkbox and faculty name columns (irrelevant read-only view)
    const tableColumns = React.useMemo(() => {
        if (!isFaculty) return updatedColumns;
        return updatedColumns.filter((col) => col.id !== "select" && col.id !== "faculty");
    }, [updatedColumns, isFaculty]);

    // Initialize data table
    const { table } = useDataTable<Schedule>({
        data: schedules,
        columns: tableColumns,
        pageCount: Math.ceil(schedules.length / 10),
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
            sorting: [{ id: "schedule", desc: false }],
            columnPinning: { left: ["select", "course"] },
        },
        enableAdvancedFilter: false,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        getRowId: (row) => row.id,
    });

    const selectedDraftScheduleIds = React.useMemo(() => {
        return table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)
            .filter((schedule) => schedule.status === "draft")
            .map((schedule) => schedule.id)
            .filter(Boolean);
    }, [table]);

    const allFilteredDraftIds = React.useMemo(() => {
        return schedules
            .filter((schedule) => schedule.status === "draft")
            .map((schedule) => schedule.id)
            .filter(Boolean);
    }, [schedules]);

    const publishAllScopeLabel = React.useMemo(() => {
        const drafts = schedules.filter((s) => s.status === "draft");
        const semesters = new Set(drafts.map((s) => s.semester));
        const years = new Set(drafts.map((s) => s.academicYear));
        if (semesters.size === 1 && years.size === 1) {
            return `${[...semesters][0]} ${[...years][0]}`;
        }
        return "the current view";
    }, [schedules]);

    const [advancedFilters] = useQueryState(
        "filters",
        getFiltersStateParser<Schedule>()
            .withDefault([])
            .withOptions({ shallow: true, clearOnDefault: true })
    );

    React.useEffect(() => {
        const filterableColumnIds = (updatedColumns as FilterableScheduleColumn[])
            .filter((column) => column.enableColumnFilter)
            .map((column) => column.id)
            .filter(Boolean);

        filterableColumnIds.forEach((columnId) => {
            if (!columnId) {
                return;
            }

            const filter = advancedFilters.find((item) => item.id === columnId);

            if (!filter || filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
                table.getColumn(columnId)?.setFilterValue(undefined);
                return;
            }

            const { value } = filter;
            if (!value || (Array.isArray(value) && value.length === 0) || value === "") {
                table.getColumn(columnId)?.setFilterValue(undefined);
                return;
            }

            const isSelectVariant = filter.variant === "select" || filter.variant === "multiSelect";

            table.getColumn(columnId)?.setFilterValue(
                isSelectVariant && !Array.isArray(value) ? [value] : value
            );
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [advancedFilters, updatedColumns]);

    const filteredScheduleCount = table.getFilteredRowModel().rows.length;

    const handleOpenExportDialog = React.useCallback(() => {
        const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);

        const semesterFromFilter = getFilterValue(advancedFilters, "semester");
        const academicYearFromFilter = getFilterValue(advancedFilters, "academicYear");
        const yearLevelFromFilter = getFilterValue(advancedFilters, "yearLevel");
        const sectionFromFilter = getFilterValue(advancedFilters, "section");

        setExportSemester(
            semesterFromFilter
                ?? getMostCommonValue(filteredRows.map((row) => row.semester))
                ?? "1st Semester"
        );
        setExportAcademicYear(
            academicYearFromFilter
                ?? getMostCommonValue(filteredRows.map((row) => row.academicYear))
                ?? academicYearOptions[0]
                ?? ""
        );
        setExportYearLevel(yearLevelFromFilter ?? "all");
        setExportSection(sectionFromFilter ?? "all");
        setExportDialogOpen(true);
    }, [table, advancedFilters, academicYearOptions]);

    const handleExportCourseOffering = async () => {
        setExporting(true);
        try {
            const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);
            const schedulesForExport = getExportRowsFromTable(filteredRows, rawSchedules);

            if (schedulesForExport.length === 0) {
                toast.error("No schedules in the current table view to export");
                return;
            }

            const pdfSemester =
                getMostCommonValue(schedulesForExport.map((schedule) => schedule.semester))
                ?? exportSemester;
            const pdfAcademicYear =
                getMostCommonValue(schedulesForExport.map((schedule) => schedule.academicYear))
                ?? exportAcademicYear;
            const programName =
                exportProgram?.courseName
                ?? getMostCommonValue(
                    filteredRows
                        .map((row) => row.departmentName)
                        .filter((name) => name && name !== "Unknown Program")
                )
                ?? "All Programs";

            await exportCourseOffering({
                programName,
                institute: exportInstitute,
                semester: pdfSemester,
                academicYear: pdfAcademicYear,
                schedules: schedulesForExport,
            });

            toast.success("Course offering PDF exported successfully!");
            setExportDialogOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to export PDF");
        } finally {
            setExporting(false);
        }
    };

    const handleOpenWorkloadExportDialog = React.useCallback(() => {
        const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);

        const semesterFromFilter = getFilterValue(advancedFilters, "semester");
        const academicYearFromFilter = getFilterValue(advancedFilters, "academicYear");
        const yearLevelFromFilter = getFilterValue(advancedFilters, "yearLevel");
        const sectionFromFilter = getFilterValue(advancedFilters, "section");
        const facultyFromFilter = getFilterValue(advancedFilters, "faculty");

        setWorkloadSemester(
            semesterFromFilter
                ?? getMostCommonValue(filteredRows.map((row) => row.semester))
                ?? "1st Semester"
        );
        setWorkloadAcademicYear(
            academicYearFromFilter
                ?? getMostCommonValue(filteredRows.map((row) => row.academicYear))
                ?? academicYearOptions[0]
                ?? ""
        );
        setWorkloadYearLevel(yearLevelFromFilter ?? "all");
        setWorkloadSection(sectionFromFilter ?? "all");

        const filteredIds = new Set(filteredRows.map((row) => row.id));
        const filteredRawSchedules = rawSchedules.filter((schedule) =>
            filteredIds.has(schedule._id || schedule.id || "")
        );
        const uniqueFacultyIds = [
            ...new Set(
                filteredRawSchedules
                    .map((schedule) => {
                        if (typeof schedule.faculty === "object" && schedule.faculty) {
                            return schedule.faculty._id || schedule.faculty.id || "";
                        }
                        return typeof schedule.faculty === "string" ? schedule.faculty : "";
                    })
                    .filter(Boolean)
            ),
        ];

        if (uniqueFacultyIds.length === 1) {
            setWorkloadFacultyId(uniqueFacultyIds[0]);
        } else if (facultyFromFilter) {
            const matchedFaculty = facultyOptions.find(
                (faculty) => faculty.name === facultyFromFilter
            );
            setWorkloadFacultyId(matchedFaculty?.id ?? "");
        } else {
            setWorkloadFacultyId("");
        }

        setWorkloadExportDialogOpen(true);
    }, [table, advancedFilters, academicYearOptions, facultyOptions, rawSchedules]);

    const handleExportWorkload = async () => {
        if (!workloadFacultyId) {
            toast.error("Please select a faculty member");
            return;
        }

        const selectedFaculty = faculties.find(
            (faculty) => (faculty._id || faculty.id) === workloadFacultyId
        );

        if (!selectedFaculty) {
            toast.error("Selected faculty not found");
            return;
        }

        setWorkloadExporting(true);
        try {
            const result = await ScheduleAPI.getByFaculty(
                workloadFacultyId,
                workloadSemester,
                workloadAcademicYear
            );

            if (!result.success || !result.data || result.data.length === 0) {
                toast.error("No schedules found for this faculty in the selected period");
                return;
            }

            const filteredSchedules = result.data.filter((schedule) => {
                if (workloadYearLevel !== "all") {
                    const yearLevel = resolveScheduleYearLevel(schedule);
                    if (yearLevel !== workloadYearLevel) {
                        return false;
                    }
                }

                if (workloadSection !== "all") {
                    if (!scheduleMatchesConfiguredSection(schedule, workloadSection, configuredSections)) {
                        return false;
                    }
                }

                return true;
            });

            if (filteredSchedules.length === 0) {
                toast.error("No schedules match the selected year level and section");
                return;
            }

            const programName = typeof selectedFaculty.program === "string"
                ? selectedFaculty.program
                : selectedFaculty.program?.courseName || selectedFaculty.program?.courseCode || "";

            await exportFacultyWorkload({
                facultyName: formatFacultyName(selectedFaculty),
                programName,
                institute: exportInstitute,
                designation: selectedFaculty.designation,
                employmentType: selectedFaculty.employmentType,
                maxLoad: selectedFaculty.maxLoad,
                adminLoad: selectedFaculty.adminLoad,
                semester: workloadSemester,
                academicYear: workloadAcademicYear,
                schedules: filteredSchedules as ExportSchedule[],
            });

            toast.success("Faculty workload PDF exported successfully!");
            setWorkloadExportDialogOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to export workload PDF");
        } finally {
            setWorkloadExporting(false);
        }
    };

    const handleGenerateSchedules = async () => {
        setGenerating(true);
        try {
            const result = await ScheduleAPI.generateSchedules({
                semester: selectedSemester,
                academicYear: selectedAcademicYear,
                courses: selectedProgramId !== "all" ? [selectedProgramId] : undefined,
                overwriteExisting: false,
            });

            if (result.success) {
                const scopeLabel = selectedProgram?.courseName || "all programs";
                toast.success(`Successfully generated ${result.generated} schedules for ${scopeLabel} in ${selectedSemester} ${selectedAcademicYear}.`);
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

    const handlePublishSelected = () => {
        if (!selectedDraftScheduleIds.length) {
            toast.error("Select at least one draft schedule to publish.");
            return;
        }
        setPublishConfirmMode("selected");
        setPublishConfirmOpen(true);
    };

    const handlePublishAll = () => {
        if (!allFilteredDraftIds.length) {
            toast.error("No draft schedules found in the current view.");
            return;
        }
        setPublishConfirmMode("all");
        setPublishConfirmOpen(true);
    };

    const handleConfirmPublish = async () => {
        const ids = publishConfirmMode === "selected" ? selectedDraftScheduleIds : allFilteredDraftIds;
        setPublishConfirmOpen(false);
        setPublishing(true);
        try {
            const result = await ScheduleAPI.publishSchedules(ids);

            if (result.success) {
                toast.success(result.message || `Published ${result.count} schedule(s) successfully.`);
                table.resetRowSelection();
                await refetch();
            } else {
                toast.error(result.message || "Failed to publish schedules");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to publish schedules");
        } finally {
            setPublishing(false);
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

    if (isFaculty && !facultyLoading && !facultyId) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Your account is not yet linked to a faculty record. Please contact the administrator to set up your schedule.
                    </AlertDescription>
                </Alert>
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
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isFaculty ? "My Schedule" : "Automated Scheduling"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isFaculty
                            ? "Your assigned classes and teaching schedule"
                            : "Manage course schedules with intelligent conflict detection"}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* View toggle */}
                    <div className="flex items-center border rounded-md">
                        <Button
                            variant={view === "table" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setView("table")}
                            className="rounded-r-none"
                        >
                            <TableProperties className="h-4 w-4" />
                            Table
                        </Button>
                        <Button
                            variant={view === "calendar" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setView("calendar")}
                            className="rounded-l-none"
                        >
                            <CalendarRange className="h-4 w-4" />
                            Calendar
                        </Button>
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Actions
                                <MoreHorizontal className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Schedule Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleOpenExportDialog}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </DropdownMenuItem>
                            {isAdmin && (
                                <DropdownMenuItem onClick={handleOpenWorkloadExportDialog}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export Workload
                                </DropdownMenuItem>
                            )}
                            {isAdmin && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handlePublishSelected}
                                        disabled={publishing || selectedDraftScheduleIds.length === 0}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Publish Selected ({selectedDraftScheduleIds.length})
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handlePublishAll}
                                        disabled={publishing || allFilteredDraftIds.length === 0}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Publish All Drafts ({allFilteredDraftIds.length})
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push("/schedules/add")}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Schedule
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {isAdmin && (
                        <Button onClick={() => setGenerateDialogOpen(true)}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Schedules
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {isFaculty ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{schedules.length}</div>
                            <p className="text-xs text-muted-foreground">Assigned subjects</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">1st Semester</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {schedules.filter((s) => s.semester === "1st Semester").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Classes this semester</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">2nd Semester</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {schedules.filter((s) => s.semester === "2nd Semester").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Classes this semester</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Published</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {schedules.filter((s) => s.status === "published").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Confirmed schedules</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
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
            )}

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
                            </DataTableAdvancedToolbar>
                        </DataTable>
                    </CardContent>
                </Card>
            ) : (
                <ScheduleCalendar
                    schedules={calendarSchedules}
                    courses={courses}
                    onEventClick={(schedule) => router.push(`/schedules/${schedule.id}`)}
                />
            )}

            {/* Export Course Offering Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Export Course Offering
                        </DialogTitle>
                        <DialogDescription>
                            Exports schedules currently visible in the table (filters and search apply). PDF header fields below can be adjusted before generating.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Program</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={exportProgramId}
                                onChange={(e) => setExportProgramId(e.target.value)}
                            >
                                <option value="all">All programs</option>
                                {courses.map((c) => {
                                    const courseId = c._id || c.id;

                                    if (!courseId) {
                                        return null;
                                    }

                                    return (
                                        <option key={courseId} value={courseId}>
                                            {c.courseCode} - {c.courseName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Institute / Campus</label>
                            <input
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="e.g. Baganga Campus"
                                value={exportInstitute}
                                onChange={(e) => setExportInstitute(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Semester</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={exportSemester}
                                    onChange={(e) => setExportSemester(e.target.value)}
                                >
                                    <option value="1st Semester">1st Semester</option>
                                    <option value="2nd Semester">2nd Semester</option>
                                    <option value="Summer">Summer</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Year Level</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={exportYearLevel}
                                    onChange={(e) => setExportYearLevel(e.target.value)}
                                >
                                    <option value="all">All Year Levels</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                    <option value="5th Year">5th Year</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Section</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={exportSection}
                                    onChange={(e) => setExportSection(e.target.value)}
                                >
                                    <option value="all">All Sections</option>
                                    {exportSectionOptions
                                        .filter((section) => section !== "all")
                                        .map((section) => (
                                            <option key={section} value={section}>
                                                {section}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Academic Year</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={exportAcademicYear}
                                    onChange={(e) => setExportAcademicYear(e.target.value)}
                                >
                                    {academicYearOptions.map((academicYear) => (
                                        <option key={academicYear} value={academicYear}>
                                            {academicYear}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription>
                                Exporting <strong>{filteredScheduleCount}</strong> schedule(s) from the current table view.
                                {" "}PDF header: <strong>{exportProgram?.courseName || "All Programs"}</strong>
                                {" • "}<strong>{exportSemester}</strong>
                                {" • "}<strong>{exportAcademicYear}</strong>
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)} disabled={exporting}>
                            Cancel
                        </Button>
                        <Button onClick={handleExportCourseOffering} disabled={exporting}>
                            {exporting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating PDF...</>
                            ) : (
                                <><Download className="mr-2 h-4 w-4" />Export PDF</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Workload Dialog */}
            <Dialog open={workloadExportDialogOpen} onOpenChange={setWorkloadExportDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Export Workload
                        </DialogTitle>
                        <DialogDescription>
                            Generate a Faculty Workload PDF (FM-DOrSU-ODI-02) for the selected faculty member, semester, and academic year.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Faculty Name</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={workloadFacultyId}
                                onChange={(e) => {
                                    setWorkloadFacultyId(e.target.value);
                                    setWorkloadSection("all");
                                }}
                            >
                                <option value="">Select faculty...</option>
                                {facultyOptions.map((faculty) => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Semester</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={workloadSemester}
                                    onChange={(e) => setWorkloadSemester(e.target.value)}
                                >
                                    <option value="1st Semester">1st Semester</option>
                                    <option value="2nd Semester">2nd Semester</option>
                                    <option value="Summer">Summer</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Academic Year</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={workloadAcademicYear}
                                    onChange={(e) => setWorkloadAcademicYear(e.target.value)}
                                >
                                    {academicYearOptions.map((academicYear) => (
                                        <option key={academicYear} value={academicYear}>
                                            {academicYear}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Year Level</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={workloadYearLevel}
                                    onChange={(e) => {
                                        setWorkloadYearLevel(e.target.value);
                                        setWorkloadSection("all");
                                    }}
                                >
                                    <option value="all">All Year Levels</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                    <option value="5th Year">5th Year</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Section</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={workloadSection}
                                    onChange={(e) => setWorkloadSection(e.target.value)}
                                    disabled={!workloadFacultyId || configuredSectionsLoading}
                                >
                                    <option value="all">All Sections</option>
                                    {workloadSectionOptions.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.label}
                                        </option>
                                    ))}
                                </select>
                                {!workloadFacultyId && (
                                    <p className="text-xs text-muted-foreground">Select a faculty member first.</p>
                                )}
                                {workloadFacultyId && selectedWorkloadFaculty && !getFacultyProgramId(selectedWorkloadFaculty) && (
                                    <p className="text-xs text-muted-foreground">
                                        This faculty has no linked program; sections cannot be loaded.
                                    </p>
                                )}
                                {workloadFacultyId && configuredSectionsLoading && (
                                    <p className="text-xs text-muted-foreground">Loading sections...</p>
                                )}
                                {workloadFacultyId
                                    && !configuredSectionsLoading
                                    && selectedWorkloadFaculty
                                    && getFacultyProgramId(selectedWorkloadFaculty)
                                    && configuredSections.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        No sections configured for this program.
                                    </p>
                                )}
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription>
                                Exporting workload for{" "}
                                <strong>{selectedWorkloadFaculty ? formatFacultyName(selectedWorkloadFaculty) : "—"}</strong>
                                {" • "}<strong>{workloadSemester}</strong>
                                {" • "}<strong>{workloadAcademicYear}</strong>
                                {workloadYearLevel !== "all" && (
                                    <>{" • "}<strong>{workloadYearLevel}</strong></>
                                )}
                                {workloadSection !== "all" && selectedWorkloadSectionLabel && (
                                    <>{" • "}<strong>Section {selectedWorkloadSectionLabel}</strong></>
                                )}
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setWorkloadExportDialogOpen(false)}
                            disabled={workloadExporting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleExportWorkload} disabled={workloadExporting}>
                            {workloadExporting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating PDF...</>
                            ) : (
                                <><Download className="mr-2 h-4 w-4" />Export PDF</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Publish Confirmation Dialog */}
            <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Confirm Publish
                        </DialogTitle>
                        <DialogDescription>
                            {publishConfirmMode === "selected"
                                ? `You are about to publish ${selectedDraftScheduleIds.length} selected draft schedule(s). Once published, they will be visible to all users.`
                                : `You are about to publish all ${allFilteredDraftIds.length} draft schedule(s) in ${publishAllScopeLabel}. Once published, they will be visible to all users.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPublishConfirmOpen(false)}
                            disabled={publishing}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmPublish} disabled={publishing}>
                            {publishing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</>
                            ) : (
                                <><CheckCircle2 className="mr-2 h-4 w-4" />Publish</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                {academicYearOptions.map((academicYear) => (
                                    <option key={academicYear} value={academicYear}>
                                        {academicYear}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="program" className="text-sm font-medium">
                                Program
                            </label>
                            <select
                                id="program"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedProgramId}
                                onChange={(e) => setSelectedProgramId(e.target.value)}
                            >
                                <option value="all">All programs</option>
                                {courses.map((course) => {
                                    const courseId = course._id || course.id;

                                    if (!courseId) {
                                        return null;
                                    }

                                    return (
                                        <option key={courseId} value={courseId}>
                                            {course.courseCode} - {course.courseName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <Alert>
                            <PlayCircle className="h-4 w-4" />
                            <AlertDescription>
                                This will generate schedules for <strong>{selectedProgram?.courseName || "all programs"}</strong>
                                {" "}during <strong>{selectedSemester} {selectedAcademicYear}</strong>.
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
