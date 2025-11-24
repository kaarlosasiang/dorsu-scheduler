"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    BookOpen,
    Users,
    MapPin,
    Clock,
    Calendar,
    Building2,
    Edit,
    Trash2,
    Sparkles,
} from "lucide-react";

interface ScheduleEvent {
    id: string;
    courseName: string;
    courseCode: string;
    facultyName: string;
    classroom: string;
    day: string;
    startTime: string;
    endTime: string;
    semester: string;
    academicYear: string;
    status: string;
    departmentName: string;
    isGenerated: boolean;
}

interface ScheduleDetailDialogProps {
    schedule: ScheduleEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (schedule: ScheduleEvent) => void;
    onDelete?: (schedule: ScheduleEvent) => void;
}

export function ScheduleDetailDialog({
    schedule,
    open,
    onOpenChange,
    onEdit,
    onDelete,
}: ScheduleDetailDialogProps) {
    if (!schedule) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "published":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
            case "draft":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
            case "archived":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
            default:
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                {schedule.courseName}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {schedule.courseCode}
                            </DialogDescription>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <Badge className={getStatusColor(schedule.status)}>
                                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                            </Badge>
                            {schedule.isGenerated && (
                                <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Auto-Generated
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Schedule Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Schedule Details
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Day</p>
                                    <p className="text-sm text-muted-foreground">{schedule.day}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Clock className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Time</p>
                                    <p className="text-sm text-muted-foreground">
                                        {schedule.startTime} - {schedule.endTime}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Faculty & Location */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Faculty & Location
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Users className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Instructor</p>
                                    <p className="text-sm text-muted-foreground">{schedule.facultyName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Room</p>
                                    <p className="text-sm text-muted-foreground">{schedule.classroom}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Academic Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Academic Information
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Department</p>
                                    <p className="text-sm text-muted-foreground">{schedule.departmentName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Semester</p>
                                    <p className="text-sm text-muted-foreground">
                                        {schedule.semester}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {schedule.academicYear}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            onEdit?.(schedule);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onOpenChange(false);
                            onDelete?.(schedule);
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
