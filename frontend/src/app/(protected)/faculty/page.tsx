"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  BookOpen,
  GraduationCap,
  Briefcase,
  Activity,
  AlertCircle,
  Loader2,
  Download,
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
  CardDescription,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDataTable } from "@/hooks/use-data-table";
import { useFaculty } from "@/hooks/useFaculty";
import { useRouter } from "next/navigation";
import { type IFaculty } from "@/lib/services/FacultyAPI";
import { ScheduleAPI } from "@/lib/services/ScheduleAPI";
import {
  exportFacultyWorkload,
  exportFacultyWorkloadBatch,
} from "@/lib/utils/exportCourseOffering";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Transform IFaculty to display format
interface Faculty {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  program: string;
  designation?: string;
  email: string;
  status: "active" | "inactive";
  employmentType: "full-time" | "part-time";
  maxLoad: number;
  minLoad: number;
  currentLoad: number;
  adminLoad: number;
  maxPreparations: number;
  currentPreparations: number;
  createdAt: string;
}

// Transform function to convert IFaculty to Faculty
const transformFaculty = (faculty: IFaculty): Faculty => ({
  id: faculty._id || faculty.id || "",
  name: `${faculty.name.first} ${
    faculty.name.middle ? faculty.name.middle + " " : ""
  }${faculty.name.last}${faculty.name.ext ? " " + faculty.name.ext : ""}`,
  firstName: faculty.name.first,
  lastName: faculty.name.last,
  program: typeof faculty.program === 'string' 
    ? faculty.program 
    : (faculty.program as any)?.courseCode || '',
  designation: faculty.designation,
  email: faculty.email,
  status: faculty.status,
  employmentType: faculty.employmentType,
  maxLoad: faculty.maxLoad,
  minLoad: faculty.minLoad,
  currentLoad: faculty.currentLoad || 0,
  adminLoad: faculty.adminLoad || 0,
  maxPreparations: faculty.maxPreparations || 4,
  currentPreparations: faculty.currentPreparations || 0,
  createdAt: faculty.createdAt || new Date().toISOString(),
});

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function buildAcademicYearOptions(count = 4): string[] {
  const current = getCurrentAcademicYear();
  const [startStr] = current.split("-");
  const start = parseInt(startStr, 10);

  return Array.from({ length: count }, (_, index) => {
    const y = start + index;
    return `${y}-${y + 1}`;
  });
}

// ─── Faculty Action Cell with Per-Faculty Workload Export ────────────────────

function FacultyActionCell({ faculty }: { faculty: Faculty }) {
  const router = useRouter();
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [exportSemester, setExportSemester] = React.useState("2nd Semester");
  const academicYearOptions = React.useMemo(() => buildAcademicYearOptions(4), []);
  const [exportAcademicYear, setExportAcademicYear] = React.useState(getCurrentAcademicYear());
  const [exportProgramName, setExportProgramName] = React.useState(faculty.program || "");
  const [exportInstitute, setExportInstitute] = React.useState("Baganga Campus");

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await ScheduleAPI.getByFaculty(faculty.id, exportSemester, exportAcademicYear);
      if (!result.success || !result.data || result.data.length === 0) {
        toast.error("No schedules found for this faculty in the selected period");
        return;
      }
      await exportFacultyWorkload({
        facultyName: faculty.name,
        programName: exportProgramName || faculty.program,
        institute: exportInstitute,
        designation: faculty.designation,
        employmentType: faculty.employmentType,
        maxLoad: faculty.maxLoad,
        adminLoad: faculty.adminLoad,
        semester: exportSemester,
        academicYear: exportAcademicYear,
        schedules: result.data as any[],
      });
      toast.success("Faculty workload PDF exported successfully!");
      setExportOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
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
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            Edit Faculty
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Clock className="mr-2 h-4 w-4" />
            Manage Schedule
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export Workload PDF
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Faculty
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Workload Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Workload — {faculty.name}
            </DialogTitle>
            <DialogDescription>
              Generate a Faculty Workload PDF (FM-DOrSU-ODI-02) showing all assigned classes for this faculty member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program Name</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="e.g. Bachelor of Science in Agriculture"
                value={exportProgramName}
                onChange={(e) => setExportProgramName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Institute / Campus</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={exportInstitute}
                onChange={(e) => setExportInstitute(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={exportSemester}
                  onChange={(e) => setExportSemester(e.target.value)}
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Year</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" />Export PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Enhanced column definitions with comprehensive metadata
const columns: ColumnDef<Faculty>[] = [
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
    size: 40,
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Faculty" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-3 min-w-[250px]">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {row.original.firstName.charAt(0).toUpperCase() +
              row.original.lastName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium truncate">{row.original.name}</div>
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {row.original.email}
          </div>
        </div>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 300,
    meta: {
      label: "Faculty Name",
      placeholder: "Search faculty names...",
      variant: "text",
      icon: User,
    },
  },
  {
    id: "program",
    accessorKey: "program",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Program" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{row.original.program}</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 180,
    meta: {
      label: "Program",
      variant: "select",
      icon: Building2,
      options: [], // Will be populated dynamically
    },
  },
  {
    id: "employmentType",
    accessorKey: "employmentType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employment" />
    ),
    cell: ({ row }) => {
      const type = row.original.employmentType;
      return (
        <Badge variant={type === "full-time" ? "default" : "secondary"} className="whitespace-nowrap">
          {type === "full-time" ? (
            <Briefcase className="mr-1 h-3 w-3" />
          ) : (
            <Clock className="mr-1 h-3 w-3" />
          )}
          {type === "full-time" ? "Full-time" : "Part-time"}
        </Badge>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 130,
    meta: {
      label: "Employment Type",
      variant: "select",
      icon: Briefcase,
      options: [
        { label: "Full-time", value: "full-time", count: 0 },
        { label: "Part-time", value: "part-time", count: 0 },
      ],
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"} className="whitespace-nowrap">
          {status === "active" ? (
            <CheckCircle className="mr-1 h-3 w-3" />
          ) : (
            <XCircle className="mr-1 h-3 w-3" />
          )}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 110,
    meta: {
      label: "Status",
      variant: "select",
      icon: Activity,
      options: [
        { label: "Active", value: "active", count: 0 },
        { label: "Inactive", value: "inactive", count: 0 },
      ],
    },
  },
  {
    id: "currentLoad",
    accessorKey: "currentLoad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Current Load" />
    ),
    cell: ({ row }) => {
      const current = row.original.currentLoad;
      const max = row.original.maxLoad;
      const percentage = max > 0 ? (current / max) * 100 : 0;

      return (
        <div className="w-28">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>
              {current.toFixed(2)}/{max}
            </span>
            <span className="text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 150,
    meta: {
      label: "Current Load",
      variant: "range",
      icon: BookOpen,
      range: [0, 30],
      unit: "units",
    },
  },
  {
    id: "maxLoad",
    accessorKey: "maxLoad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Max Load" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2 whitespace-nowrap">
        <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span>{row.original.maxLoad} units</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 120,
    meta: {
      label: "Max Load",
      variant: "range",
      icon: Briefcase,
      range: [18, 26],
      unit: "units",
    },
  },
  {
    id: "preparations",
    accessorKey: "currentPreparations",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preparations" />
    ),
    cell: ({ row }) => {
      const current = row.original.currentPreparations;
      const max = row.original.maxPreparations;
      return (
        <div className="flex items-center space-x-2 whitespace-nowrap">
          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>
            {current}/{max}
          </span>
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 130,
    meta: {
      label: "Preparations",
      variant: "range",
      icon: BookOpen,
      range: [0, 4],
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Added" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2 whitespace-nowrap">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 140,
    meta: {
      label: "Date Added",
      variant: "date",
      icon: Calendar,
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <FacultyActionCell faculty={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];

export default function FacultyPage() {
  const navigate = useRouter();
  const {
    faculties: rawFaculties,
    stats,
    isLoading,
    error,
    refresh,
    searchFaculties,
    deleteFaculty,
    updateFacultyStatus,
    clearError,
  } = useFaculty();

  // Transform faculty data for display
  const faculties = React.useMemo(
    () => rawFaculties.map(transformFaculty),
    [rawFaculties]
  );

  // Update column meta with real data counts
  const updatedColumns = React.useMemo(() => {
    const programCounts = faculties.reduce((acc, faculty) => {
      acc[faculty.program] = (acc[faculty.program] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusCounts = faculties.reduce((acc, faculty) => {
      acc[faculty.status] = (acc[faculty.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const employmentCounts = faculties.reduce((acc, faculty) => {
      acc[faculty.employmentType] = (acc[faculty.employmentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return columns.map((column) => {
      if (column.id === "program" && column.meta) {
        return {
          ...column,
          meta: {
            ...column.meta,
            options: Object.entries(programCounts).map(([prog, count]) => ({
              label: prog,
              value: prog,
              count,
            })),
          },
        };
      }
      if (column.id === "status" && column.meta) {
        return {
          ...column,
          meta: {
            ...column.meta,
            options: [
              {
                label: "Active",
                value: "active",
                count: statusCounts.active || 0,
              },
              {
                label: "Inactive",
                value: "inactive",
                count: statusCounts.inactive || 0,
              },
            ],
          },
        };
      }
      if (column.id === "employmentType" && column.meta) {
        return {
          ...column,
          meta: {
            ...column.meta,
            options: [
              {
                label: "Full-time",
                value: "full-time",
                count: employmentCounts["full-time"] || 0,
              },
              {
                label: "Part-time",
                value: "part-time",
                count: employmentCounts["part-time"] || 0,
              },
            ],
          },
        };
      }
      return column;
    });
  }, [faculties]);

  const { table } = useDataTable({
    data: faculties,
    columns: updatedColumns,
    pageCount: Math.ceil(stats.total / 10),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      columnVisibility: {},
      sorting: [{ id: "name", desc: false }],
      globalFilter: "",
    },
    enableAdvancedFilter: true,
    enableGlobalFilter: true,
    getRowId: (row) => row.id,
  });

  const [batchExportOpen, setBatchExportOpen] = React.useState(false);
  const [batchExporting, setBatchExporting] = React.useState(false);
  const [batchExportScope, setBatchExportScope] = React.useState<"selected" | "all">("selected");
  const [batchSemester, setBatchSemester] = React.useState("2nd Semester");
  const batchAcademicYearOptions = React.useMemo(() => buildAcademicYearOptions(4), []);
  const [batchAcademicYear, setBatchAcademicYear] = React.useState(getCurrentAcademicYear());
  const [batchInstitute, setBatchInstitute] = React.useState("Baganga Campus");

  const handleBatchExport = React.useCallback(async () => {
    const selectedFaculty = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original as Faculty);

    const sourceFaculty = batchExportScope === "all" ? faculties : selectedFaculty;

    if (sourceFaculty.length === 0) {
      toast.error(
        batchExportScope === "all"
          ? "No faculty records available for export"
          : "Select at least one faculty member first"
      );
      return;
    }

    setBatchExporting(true);
    try {
      const entries: Array<{
        facultyName: string;
        programName?: string;
        designation?: string;
        maxLoad?: number;
        adminLoad?: number;
        schedules: any[];
      }> = [];

      let skipped = 0;
      for (const faculty of sourceFaculty) {
        if (!faculty.id) {
          skipped += 1;
          continue;
        }

        const response = await ScheduleAPI.getByFaculty(
          faculty.id,
          batchSemester,
          batchAcademicYear
        );

        if (response.success && response.data && response.data.length > 0) {
          entries.push({
            facultyName: faculty.name,
            programName: faculty.program,
            designation: faculty.designation,
            employmentType: faculty.employmentType,
            maxLoad: faculty.maxLoad,
            adminLoad: faculty.adminLoad,
            schedules: response.data,
          });
        } else {
          skipped += 1;
        }
      }

      if (!entries.length) {
        toast.error("No schedules found for selected faculty in the chosen period");
        return;
      }

      await exportFacultyWorkloadBatch({
        institute: batchInstitute,
        semester: batchSemester,
        academicYear: batchAcademicYear,
        entries,
      });

      toast.success(
        `Batch workload PDF exported (${entries.length} faculty${
          skipped ? `, ${skipped} skipped` : ""
        })`
      );
      setBatchExportOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Batch export failed");
    } finally {
      setBatchExporting(false);
    }
  }, [table, faculties, batchExportScope, batchSemester, batchAcademicYear, batchInstitute]);

  // Handle search
  const handleSearch = React.useCallback(
    async (query: string) => {
      await searchFaculties(query);
    },
    [searchFaculties]
  );

  // Handle delete faculty
  const handleDeleteFaculty = React.useCallback(
    async (id: string) => {
      const success = await deleteFaculty(id);
      if (success) {
        // Optionally show success message
        console.log("Faculty deleted successfully");
      }
    },
    [deleteFaculty]
  );

  // Handle status update
  const handleStatusUpdate = React.useCallback(
    async (id: string, status: "active" | "inactive") => {
      const success = await updateFacultyStatus(id, status);
      if (success) {
        console.log("Faculty status updated successfully");
      }
    },
    [updateFacultyStatus]
  );

  // Custom action bar content
  const CustomActionBar = () => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setBatchExportScope("selected");
          setBatchExportOpen(true);
        }}
        disabled={isLoading || table.getFilteredSelectedRowModel().rows.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        Export Selected Workloads
      </Button>
      <Button variant="outline" size="sm" disabled={isLoading}>
        <Edit className="mr-2 h-4 w-4" />
        Bulk Edit
      </Button>
      <Button variant="outline" size="sm" disabled={isLoading}>
        <Mail className="mr-2 h-4 w-4" />
        Send Email
      </Button>
      <Button variant="destructive" size="sm" disabled={isLoading}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Faculty Management
          </h1>
          <p className="text-muted-foreground">
            Manage faculty members, their workloads, and availability schedules
            with advanced filtering and sorting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setBatchExportScope("all");
              setBatchExportOpen(true);
            }}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export All Workloads
          </Button>
          <Button onClick={() => navigate.push("/faculty/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Faculty
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.programs.length}</div>
            <p className="text-xs text-muted-foreground">Across all colleges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Workload</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {`${stats.avgWorkload.toFixed(1)} units`}
            </div>
            <p className="text-xs text-muted-foreground">Per faculty member</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employment</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {`${stats.fullTime}/${stats.partTime}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Full-time / Part-time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Data Table with All Features */}
      <Card>
        <CardContent>
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
                placeholder="Search faculty names, programs, emails..."
                className="max-w-sm"
              />
              <DataTableFilterList table={table} />
              <DataTableSortList table={table} />
            </DataTableAdvancedToolbar>
          </DataTable>
        </CardContent>
      </Card>

      <Dialog open={batchExportOpen} onOpenChange={setBatchExportOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Selected Faculty Workloads
            </DialogTitle>
            <DialogDescription>
              Generate one combined Faculty Workload PDF for selected faculty rows.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Scope</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={batchExportScope}
                onChange={(e) =>
                  setBatchExportScope(e.target.value as "selected" | "all")
                }
                disabled={batchExporting}
              >
                <option value="selected">Selected Faculty</option>
                <option value="all">All Faculty</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Institute / Campus</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={batchInstitute}
                onChange={(e) => setBatchInstitute(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={batchSemester}
                  onChange={(e) => setBatchSemester(e.target.value)}
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Year</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={batchAcademicYear}
                  onChange={(e) => setBatchAcademicYear(e.target.value)}
                >
                  {batchAcademicYearOptions.map((academicYear) => (
                    <option key={academicYear} value={academicYear}>
                      {academicYear}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {batchExportScope === "all"
                ? `Faculty to export: ${faculties.length}`
                : `Selected faculty: ${table.getFilteredSelectedRowModel().rows.length}`}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBatchExportOpen(false)}
              disabled={batchExporting}
            >
              Cancel
            </Button>
            <Button onClick={handleBatchExport} disabled={batchExporting}>
              {batchExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Batch PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
