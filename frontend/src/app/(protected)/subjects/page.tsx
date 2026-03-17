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
  Beaker,
  ListChecks,
  Calendar,
  Layers,
  FlaskConical,
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
import { useSubjects } from "@/hooks/useSubjects";
import { SubjectAPI } from "@/lib/services/SubjectAPI";
import { toast } from "sonner";
import { useDataTable } from "@/hooks/use-data-table";
import type { ISubject } from "@/components/forms/subjects/types";

// ─── Display shape ────────────────────────────────────────────────────────────

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  lectureUnits: number;
  labUnits: number;
  units: number;
  course: { courseCode: string; courseName: string; id: string };
  yearLevel: string;
  semester: string;
  isLaboratory: boolean;
  prerequisites: number;
  createdAt: string;
}

const transformSubject = (s: ISubject): Subject => ({
  id: (s as any)._id || (s as any).id || "",
  subjectCode: s.subjectCode,
  subjectName: s.subjectName,
  lectureUnits: (s as any).lectureUnits ?? 0,
  labUnits: (s as any).labUnits ?? 0,
  units: s.units,
  course:
    typeof s.course === "object" && s.course !== null
      ? (s.course as any)
      : { courseCode: "", courseName: "", id: String(s.course) },
  yearLevel: s.yearLevel || "",
  semester: s.semester || "",
  isLaboratory: (s as any).hasLaboratory ?? ((s as any).labUnits ?? 0) > 0,
  prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites.length : 0,
  createdAt: (s as any).createdAt || new Date().toISOString(),
});

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<Subject>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    id: "subjectCode",
    accessorKey: "subjectCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-mono font-medium">{row.getValue("subjectCode")}</span>
        {row.original.isLaboratory && (
          <Badge variant="outline" className="ml-1 text-xs">
            <Beaker className="h-3 w-3 mr-1" />
            Lab
          </Badge>
        )}
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 160,
    meta: {
      label: "Subject Code",
      placeholder: "Search by code…",
      variant: "text",
      icon: Hash,
    },
  },
  {
    id: "subjectName",
    accessorKey: "subjectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject Name" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="max-w-[280px] truncate">{row.getValue("subjectName")}</span>
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 300,
    meta: {
      label: "Subject Name",
      placeholder: "Search by name…",
      variant: "text",
      icon: BookOpen,
    },
  },
  {
    id: "course",
    accessorKey: "course.courseCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Program" />
    ),
    cell: ({ row }) => {
      const c = row.original.course;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{c.courseCode}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {c.courseName}
          </span>
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 160,
    filterFn: (row, _id, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      return filterValue.includes(row.original.course.courseCode);
    },
    meta: {
      label: "Program",
      variant: "select",
      icon: GraduationCap,
      options: [], // populated dynamically
    },
  },
  {
    id: "yearLevel",
    accessorKey: "yearLevel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Year Level" />
    ),
    cell: ({ row }) => {
      const v = row.getValue("yearLevel") as string;
      return v ? (
        <Badge variant="outline">{v}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 130,
    meta: {
      label: "Year Level",
      variant: "select",
      icon: Layers,
      options: [
        { label: "1st Year", value: "1st Year", count: 0 },
        { label: "2nd Year", value: "2nd Year", count: 0 },
        { label: "3rd Year", value: "3rd Year", count: 0 },
        { label: "4th Year", value: "4th Year", count: 0 },
        { label: "5th Year", value: "5th Year", count: 0 },
      ],
    },
  },
  {
    id: "semester",
    accessorKey: "semester",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Semester" />
    ),
    cell: ({ row }) => {
      const v = row.getValue("semester") as string;
      return v ? (
        <Badge variant="outline">{v}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 140,
    meta: {
      label: "Semester",
      variant: "select",
      icon: Calendar,
      options: [
        { label: "1st Semester", value: "1st Semester", count: 0 },
        { label: "2nd Semester", value: "2nd Semester", count: 0 },
        { label: "Summer", value: "Summer", count: 0 },
      ],
    },
  },
  {
    id: "units",
    accessorKey: "units",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Units" />
    ),
    cell: ({ row }) => {
      const { lectureUnits, labUnits, units } = row.original;
      return (
        <div className="flex flex-col items-start gap-0.5">
          <Badge variant="secondary">{units} units</Badge>
          <span className="text-xs text-muted-foreground">
            {lectureUnits}L{labUnits > 0 ? ` + ${labUnits}Lab` : ""}
          </span>
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 110,
    meta: {
      label: "Units",
      variant: "range",
      icon: BookOpen,
      range: [1, 12],
      unit: "units",
    },
  },
  {
    id: "isLaboratory",
    accessorKey: "isLaboratory",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lab" />
    ),
    cell: ({ row }) =>
      row.original.isLaboratory ? (
        <Badge variant="outline" className="text-xs">
          <FlaskConical className="h-3 w-3 mr-1" />
          Yes
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">No</span>
      ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 90,
    filterFn: (row, _id, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      const val = row.original.isLaboratory ? "yes" : "no";
      return filterValue.includes(val);
    },
    meta: {
      label: "Has Laboratory",
      variant: "select",
      icon: FlaskConical,
      options: [
        { label: "Yes", value: "yes", count: 0 },
        { label: "No", value: "no", count: 0 },
      ],
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
        <span className="text-muted-foreground text-sm">None</span>
      );
    },
    enableSorting: true,
    size: 120,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Added" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
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
    cell: ({ row }) => <SubjectRowActions subject={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];

// ─── Row actions ──────────────────────────────────────────────────────────────

function SubjectRowActions({ subject }: { subject: Subject }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this subject? This action cannot be undone."
      )
    )
      return;
    try {
      await SubjectAPI.delete(subject.id);
      toast.success("Subject deleted successfully");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subject");
    }
  };

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
        <DropdownMenuItem onClick={() => router.push(`/subjects/${subject.id}`)}>
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
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const router = useRouter();
  const { subjects: raw, loading, error, refetch } = useSubjects();

  const subjects = React.useMemo(
    () => (raw as unknown as ISubject[]).map(transformSubject),
    [raw]
  );

  // Dynamic filter option counts
  const updatedColumns = React.useMemo(() => {
    const courseCounts = subjects.reduce(
      (acc, s) => {
        const code = s.course.courseCode;
        if (code) acc[code] = (acc[code] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const yearCounts = subjects.reduce(
      (acc, s) => {
        if (s.yearLevel) acc[s.yearLevel] = (acc[s.yearLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const semesterCounts = subjects.reduce(
      (acc, s) => {
        if (s.semester) acc[s.semester] = (acc[s.semester] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const labYes = subjects.filter((s) => s.isLaboratory).length;
    const labNo = subjects.length - labYes;

    return columns.map((col) => {
      if (col.id === "course" && (col as any).meta) {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            options: Object.entries(courseCounts).map(([code, count]) => ({
              label: code,
              value: code,
              count,
            })),
          },
        };
      }
      if (col.id === "yearLevel" && (col as any).meta) {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            options: (col as any).meta.options.map((o: any) => ({
              ...o,
              count: yearCounts[o.value] || 0,
            })),
          },
        };
      }
      if (col.id === "semester" && (col as any).meta) {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            options: (col as any).meta.options.map((o: any) => ({
              ...o,
              count: semesterCounts[o.value] || 0,
            })),
          },
        };
      }
      if (col.id === "isLaboratory" && (col as any).meta) {
        return {
          ...col,
          meta: {
            ...(col as any).meta,
            options: [
              { label: "Yes", value: "yes", count: labYes },
              { label: "No", value: "no", count: labNo },
            ],
          },
        };
      }
      return col;
    });
  }, [subjects]);

  const { table } = useDataTable({
    data: subjects,
    columns: updatedColumns,
    pageCount: Math.ceil(subjects.length / 10),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "subjectCode", desc: false }],
      columnVisibility: { createdAt: false },
    },
    enableAdvancedFilter: true,
    enableGlobalFilter: true,
    getRowId: (row) => row.id,
  });

  // Stats
  const stats = React.useMemo(() => {
    const total = subjects.length;
    const labCount = subjects.filter((s) => s.isLaboratory).length;
    const programs = new Set(subjects.map((s) => s.course.courseCode)).size;
    const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);
    return { total, labCount, programs, totalUnits };
  }, [subjects]);

  const CustomActionBar = () => (
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm">
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
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">
            Manage individual subjects across all programs, year levels, and
            semesters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => router.push("/subjects/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.programs}</div>
            <p className="text-xs text-muted-foreground">With subjects loaded</p>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lab Subjects</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.labCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round((stats.labCount / stats.total) * 100)}% of all subjects`
                : "No subjects yet"}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              Cumulative across all subjects
            </p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
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
                placeholder="Search subjects…"
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

