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

// Transform IFaculty to display format
interface Faculty {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  status: "active" | "inactive";
  employmentType: "full-time" | "part-time";
  maxLoad: number;
  minLoad: number;
  currentLoad: number;
  maxPreparations: number;
  currentPreparations: number;
  createdAt: string;
}

// Transform function to convert IFaculty to Faculty
const transformFaculty = (faculty: IFaculty): Faculty => ({
  id: faculty._id || "",
  name: `${faculty.name.first} ${
    faculty.name.middle ? faculty.name.middle + " " : ""
  }${faculty.name.last}${faculty.name.ext ? " " + faculty.name.ext : ""}`,
  firstName: faculty.name.first,
  lastName: faculty.name.last,
  department: typeof faculty.department === 'string' 
    ? faculty.department 
    : faculty.department.name,
  email: faculty.email,
  status: faculty.status,
  employmentType: faculty.employmentType,
  maxLoad: faculty.maxLoad,
  minLoad: faculty.minLoad,
  currentLoad: faculty.currentLoad || 0,
  maxPreparations: faculty.maxPreparations || 4,
  currentPreparations: faculty.currentPreparations || 0,
  createdAt: faculty.createdAt || new Date().toISOString(),
});

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
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Faculty" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {row.original.firstName.charAt(0).toUpperCase() +
              row.original.lastName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: "Faculty Name",
      placeholder: "Search faculty names...",
      variant: "text",
      icon: User,
    },
  },
  {
    id: "department",
    accessorKey: "department",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Department" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.department}</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: "Department",
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
        <Badge variant={type === "full-time" ? "default" : "secondary"}>
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
        <Badge variant={status === "active" ? "default" : "secondary"}>
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
        <div className="w-24">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>
              {current}/{max}
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
      <div className="flex items-center space-x-2">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.maxLoad} units</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
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
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span>
            {current}/{max}
          </span>
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
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
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: "Date Added",
      variant: "date",
      icon: Calendar,
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
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
    ),
    enableSorting: false,
    enableHiding: false,
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
    const departmentCounts = faculties.reduce((acc, faculty) => {
      acc[faculty.department] = (acc[faculty.department] || 0) + 1;
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
      if (column.id === "department" && column.meta) {
        return {
          ...column,
          meta: {
            ...column.meta,
            options: Object.entries(departmentCounts).map(([dept, count]) => ({
              label: dept,
              value: dept,
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
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments.length}</div>
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
                placeholder="Search faculty names, departments, emails..."
                className="max-w-sm"
              />
              <DataTableFilterList table={table} />
              <DataTableSortList table={table} />
            </DataTableAdvancedToolbar>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
