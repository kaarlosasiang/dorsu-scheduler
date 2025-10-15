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
import { useDataTable } from "@/hooks/use-data-table";

// Enhanced faculty data interface
interface Faculty {
  id: string;
  name: string;
  department: string;
  email: string;
  status: "active" | "inactive";
  maxLoad: number;
  currentLoad: number;
  availableSlots: number;
  totalSlots: number;
  yearsExperience: number;
  specializations: string[];
  salary: number;
  createdAt: string;
}

const mockFaculties: Faculty[] = [
  {
    id: "1",
    name: "Dr. Maria Santos",
    department: "Computer Science",
    email: "maria.santos@dorsu.edu",
    status: "active",
    maxLoad: 20,
    currentLoad: 16,
    availableSlots: 12,
    totalSlots: 25,
    yearsExperience: 8,
    specializations: ["Machine Learning", "Data Science"],
    salary: 85000,
    createdAt: "2024-01-15T08:30:00Z",
  },
  {
    id: "2",
    name: "Prof. John Rodriguez",
    department: "Mathematics",
    email: "john.rodriguez@dorsu.edu",
    status: "active",
    maxLoad: 18,
    currentLoad: 12,
    availableSlots: 18,
    totalSlots: 30,
    yearsExperience: 15,
    specializations: ["Calculus", "Statistics"],
    salary: 78000,
    createdAt: "2024-02-20T10:15:00Z",
  },
  {
    id: "3",
    name: "Dr. Ana Dela Cruz",
    department: "Physics",
    email: "ana.delacruz@dorsu.edu",
    status: "inactive",
    maxLoad: 16,
    currentLoad: 0,
    availableSlots: 0,
    totalSlots: 20,
    yearsExperience: 12,
    specializations: ["Quantum Physics", "Thermodynamics"],
    salary: 82000,
    createdAt: "2024-01-08T14:45:00Z",
  },
  {
    id: "4",
    name: "Prof. Miguel Garcia",
    department: "Computer Science",
    email: "miguel.garcia@dorsu.edu",
    status: "active",
    maxLoad: 22,
    currentLoad: 20,
    availableSlots: 8,
    totalSlots: 28,
    yearsExperience: 10,
    specializations: ["Software Engineering", "Web Development"],
    salary: 88000,
    createdAt: "2024-03-10T09:20:00Z",
  },
  {
    id: "5",
    name: "Dr. Sarah Johnson",
    department: "Chemistry",
    email: "sarah.johnson@dorsu.edu",
    status: "active",
    maxLoad: 18,
    currentLoad: 14,
    availableSlots: 15,
    totalSlots: 25,
    yearsExperience: 7,
    specializations: ["Organic Chemistry", "Biochemistry"],
    salary: 79000,
    createdAt: "2024-02-05T11:30:00Z",
  },
  {
    id: "6",
    name: "Prof. Robert Kim",
    department: "Engineering",
    email: "robert.kim@dorsu.edu",
    status: "active",
    maxLoad: 24,
    currentLoad: 18,
    availableSlots: 20,
    totalSlots: 32,
    yearsExperience: 20,
    specializations: ["Civil Engineering", "Structural Design"],
    salary: 95000,
    createdAt: "2024-01-22T16:00:00Z",
  },
  {
    id: "7",
    name: "Dr. Lisa Chen",
    department: "Biology",
    email: "lisa.chen@dorsu.edu",
    status: "active",
    maxLoad: 16,
    currentLoad: 10,
    availableSlots: 22,
    totalSlots: 28,
    yearsExperience: 5,
    specializations: ["Molecular Biology", "Genetics"],
    salary: 75000,
    createdAt: "2024-03-01T13:15:00Z",
  },
  {
    id: "8",
    name: "Prof. David Thompson",
    department: "Mathematics",
    email: "david.thompson@dorsu.edu",
    status: "inactive",
    maxLoad: 20,
    currentLoad: 0,
    availableSlots: 0,
    totalSlots: 24,
    yearsExperience: 25,
    specializations: ["Abstract Algebra", "Number Theory"],
    salary: 92000,
    createdAt: "2024-01-30T12:45:00Z",
  },
];

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
            {row.original.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
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
      options: [
        { label: "Computer Science", value: "Computer Science", count: 2 },
        { label: "Mathematics", value: "Mathematics", count: 2 },
        { label: "Physics", value: "Physics", count: 1 },
        { label: "Chemistry", value: "Chemistry", count: 1 },
        { label: "Engineering", value: "Engineering", count: 1 },
        { label: "Biology", value: "Biology", count: 1 },
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
        { label: "Active", value: "active", count: 6 },
        { label: "Inactive", value: "inactive", count: 2 },
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
      const percentage = (current / max) * 100;

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
      range: [0, 25],
      unit: "hrs",
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
        <span>{row.original.maxLoad} hrs</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: "Max Load",
      variant: "range",
      icon: Briefcase,
      range: [10, 30],
      unit: "hrs",
    },
  },
  {
    id: "availableSlots",
    accessorKey: "availableSlots",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Available Slots" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>
          {row.original.availableSlots}/{row.original.totalSlots}
        </span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: "Available Slots",
      variant: "range",
      icon: Clock,
      range: [0, 35],
    },
  },
  {
    id: "yearsExperience",
    accessorKey: "yearsExperience",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Experience" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.yearsExperience} years</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: "Years of Experience",
      variant: "range",
      icon: GraduationCap,
      range: [0, 30],
      unit: "years",
    },
  },
  {
    id: "salary",
    accessorKey: "salary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Salary" />
    ),
    cell: ({ row }) => {
      const salary = row.original.salary;
      return (
        <div className="text-right font-medium">${salary.toLocaleString()}</div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: "Salary",
      variant: "range",
      range: [70000, 100000],
      unit: "$",
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
  const { table } = useDataTable({
    data: mockFaculties,
    columns,
    pageCount: Math.ceil(mockFaculties.length / 10),
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

  // Calculate stats
  const activeCount = mockFaculties.filter((f) => f.status === "active").length;
  const totalWorkload = mockFaculties.reduce(
    (sum, f) => sum + f.currentLoad,
    0
  );
  const avgWorkload = totalWorkload / mockFaculties.length;
  const avgSalary =
    mockFaculties.reduce((sum, f) => sum + f.salary, 0) / mockFaculties.length;
  const departments = [...new Set(mockFaculties.map((f) => f.department))];

  // Custom action bar content
  const CustomActionBar = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Edit className="mr-2 h-4 w-4" />
        Bulk Edit
      </Button>
      <Button variant="outline" size="sm">
        <Mail className="mr-2 h-4 w-4" />
        Send Email
      </Button>
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Faculty Management
          </h1>
          <p className="text-muted-foreground">
            Manage faculty members, their workloads, and availability schedules
            with advanced filtering and sorting.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Faculty
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFaculties.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount} active, {mockFaculties.length - activeCount}{" "}
              inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
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
              {avgWorkload.toFixed(1)} hrs
            </div>
            <p className="text-xs text-muted-foreground">Per faculty member</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Salary</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(avgSalary / 1000)}k
            </div>
            <p className="text-xs text-muted-foreground">
              Average compensation
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
