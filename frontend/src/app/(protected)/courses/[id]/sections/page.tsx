"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Edit,
    AlertCircle,
    Loader2,
    Layers,
    Users,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useSections } from "@/hooks/useSections";
import SectionAPI, { type ISection } from "@/lib/services/SectionAPI";
import CourseAPI, { type ICourse } from "@/lib/services/CourseAPI";

const YEAR_LEVELS = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "5th Year",
] as const;

function getSectionId(section: ISection): string {
    return section._id || section.id || "";
}

// ─── Create/Edit Dialog ──────────────────────────────────────────────────────

interface SectionFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        program: string;
        yearLevel: string;
        sectionCode: string;
        capacity?: number;
        status?: "active" | "inactive";
    }) => Promise<void>;
    editSection?: ISection | null;
    programId: string;
    courseCode: string;
}

function SectionFormDialog({ open, onClose, onSubmit, editSection, programId, courseCode }: SectionFormDialogProps) {
    const [yearLevel, setYearLevel] = React.useState("");
    const [sectionCode, setSectionCode] = React.useState("");
    const [capacity, setCapacity] = React.useState("");
    const [status, setStatus] = React.useState<"active" | "inactive">("active");
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (editSection) {
            setYearLevel(editSection.yearLevel);
            setSectionCode(editSection.sectionCode);
            setCapacity(editSection.capacity !== undefined ? String(editSection.capacity) : "");
            setStatus(editSection.status);
        } else {
            setYearLevel("");
            setSectionCode("");
            setCapacity("");
            setStatus("active");
        }
    }, [editSection, open]);

    const namePreview = sectionCode ? sectionCode.toUpperCase() : "";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!yearLevel || !sectionCode.trim()) return;
        setSubmitting(true);
        try {
            await onSubmit({
                program: programId,
                yearLevel,
                sectionCode: sectionCode.trim().toUpperCase(),
                capacity: capacity ? Number(capacity) : undefined,
                status,
            });
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save section");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editSection ? "Edit Section" : "Add Section"}</DialogTitle>
                    <DialogDescription>
                        {editSection
                            ? "Update the section details below."
                            : `Add a new section to ${courseCode}.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label>Year Level</Label>
                        <Select value={yearLevel} onValueChange={setYearLevel} disabled={!!editSection}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select year level" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEAR_LEVELS.map((y) => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label>Section Code</Label>
                        <Input
                            value={sectionCode}
                            onChange={(e) => setSectionCode(e.target.value)}
                            placeholder="e.g. A, B, C"
                            maxLength={5}
                            className="uppercase"
                            disabled={!!editSection}
                        />
                        {namePreview && (
                            <p className="text-xs text-muted-foreground">
                                Section name:{" "}
                                <span className="font-semibold text-foreground">{namePreview}</span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Capacity (optional)</Label>
                        <Input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            placeholder="e.g. 40"
                            min={1}
                            max={500}
                        />
                    </div>

                    {editSection && (
                        <div className="space-y-1">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || !yearLevel || !sectionCode.trim()}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editSection ? "Save Changes" : "Add Section"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProgramSectionsPage() {
    const params = useParams();
    const router = useRouter();
    const programId = params.id as string;

    const [course, setCourse] = React.useState<ICourse | null>(null);
    const [courseLoading, setCourseLoading] = React.useState(true);

    const { sections, loading, error, createSection, updateSection, deleteSection } = useSections(
        { program: programId }
    );

    const [filterYearLevel, setFilterYearLevel] = React.useState("all");
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editSection, setEditSection] = React.useState<ISection | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<ISection | null>(null);

    React.useEffect(() => {
        CourseAPI.getById(programId)
            .then((res) => setCourse(res.data))
            .catch(() => setCourse(null))
            .finally(() => setCourseLoading(false));
    }, [programId]);

    const filtered = React.useMemo(() => {
        if (filterYearLevel === "all") return sections;
        return sections.filter((s) => s.yearLevel === filterYearLevel);
    }, [sections, filterYearLevel]);

    // Group by year level for a cleaner view
    const grouped = React.useMemo(() => {
        const map = new Map<string, ISection[]>();
        for (const s of filtered) {
            const list = map.get(s.yearLevel) || [];
            list.push(s);
            map.set(s.yearLevel, list);
        }
        return map;
    }, [filtered]);

    async function handleCreate(data: Parameters<typeof createSection>[0]) {
        await createSection(data);
        toast.success("Section added successfully");
    }

    async function handleEdit(data: Parameters<typeof updateSection>[1]) {
        if (!editSection) return;
        await updateSection(getSectionId(editSection), data);
        toast.success("Section updated successfully");
        setEditSection(null);
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        try {
            await deleteSection(getSectionId(deleteTarget));
            toast.success("Section deleted");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete section");
        } finally {
            setDeleteTarget(null);
        }
    }

    if (courseLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
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

    const courseCode = course?.courseCode || "";
    const courseName = course?.courseName || "";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/courses")} className="mt-1">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <p className="text-sm text-muted-foreground">Programs / {courseCode}</p>
                        <h1 className="text-2xl font-bold tracking-tight">Sections</h1>
                        <p className="text-muted-foreground">{courseName}</p>
                    </div>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Section
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sections.length}</div>
                        <p className="text-xs text-muted-foreground">Across all year levels</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sections</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {sections.filter((s) => s.status === "active").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Currently active</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter + Table */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-3 items-center justify-between">
                        <Select value={filterYearLevel} onValueChange={setFilterYearLevel}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Year Levels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Year Levels</SelectItem>
                                {YEAR_LEVELS.map((y) => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">{filtered.length} section{filtered.length !== 1 ? "s" : ""}</p>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Layers className="h-8 w-8 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No sections yet. Add one to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {YEAR_LEVELS.filter((y) => grouped.has(y)).map((yearLevel) => (
                                <div key={yearLevel}>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                                        {yearLevel}
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                        {(grouped.get(yearLevel) || []).map((section) => (
                                            <Card key={getSectionId(section)} className="group relative hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                                <Layers className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Section</p>
                                                                <p className="font-bold font-mono text-base leading-tight">{section.name}</p>
                                                            </div>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => setEditSection(section)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit section
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => setDeleteTarget(section)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete section
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0 space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Capacity</span>
                                                        <span className="font-medium">
                                                            {section.capacity ?? <span className="text-muted-foreground">—</span>}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Status</span>
                                                        <Badge
                                                            variant={section.status === "active" ? "default" : "secondary"}
                                                            className={
                                                                section.status === "active"
                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                                                    : ""
                                                            }
                                                        >
                                                            {section.status === "active" ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <SectionFormDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreate}
                programId={programId}
                courseCode={courseCode}
            />

            <SectionFormDialog
                open={!!editSection}
                onClose={() => setEditSection(null)}
                onSubmit={handleEdit}
                editSection={editSection}
                programId={programId}
                courseCode={courseCode}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Section</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete section{" "}
                            <strong>{deleteTarget?.name}</strong>? Sections with active schedules
                            cannot be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
