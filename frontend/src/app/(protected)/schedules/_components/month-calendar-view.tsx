"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

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
    yearLevel: string;
    section?: string;
    status: string;
    departmentName: string;
    isGenerated: boolean;
}

interface MonthCalendarViewProps {
    schedules: ScheduleEvent[];
    currentDate: Date;
    onScheduleClick: (schedule: ScheduleEvent) => void;
}

const MONTH_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendarView({ schedules, currentDate, onScheduleClick }: MonthCalendarViewProps) {
    const [selectedDaySchedules, setSelectedDaySchedules] = React.useState<ScheduleEvent[]>([]);
    const [selectedDate, setSelectedDate] = React.useState<string>("");
    const [dialogOpen, setDialogOpen] = React.useState(false);
    // Get calendar days for month view
    const calendarDays = React.useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        const startDayOfWeek = firstDay.getDay();
        const daysFromPrevMonth = startDayOfWeek;
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const totalCells = 42;
        
        const days: Date[] = [];
        
        // Previous month days
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            days.push(new Date(year, month - 1, prevMonthLastDay - i));
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        
        // Next month days
        const remainingCells = totalCells - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push(new Date(year, month + 1, i));
        }
        
        return days;
    }, [currentDate]);

    // Group schedules by date
    const schedulesByDate = React.useMemo(() => {
        const grouped: Record<string, ScheduleEvent[]> = {};

        schedules.forEach(schedule => {
            const days = schedule.day.split(" ");
            days.forEach(dayAbbr => {
                const dayMap: Record<string, number> = {
                    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
                };
                const dayOfWeek = dayMap[dayAbbr];
                
                if (dayOfWeek !== undefined) {
                    calendarDays.forEach(date => {
                        if (date.getDay() === dayOfWeek) {
                            const dateKey = date.toDateString();
                            if (!grouped[dateKey]) {
                                grouped[dateKey] = [];
                            }
                            grouped[dateKey].push(schedule);
                        }
                    });
                }
            });
        });

        return grouped;
    }, [schedules, calendarDays]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "published":
                return "bg-green-500 border-green-600 text-white";
            case "draft":
                return "bg-yellow-500 border-yellow-600 text-white";
            case "archived":
                return "bg-gray-500 border-gray-600 text-white";
            default:
                return "bg-blue-500 border-blue-600 text-white";
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    return (
        <>
            <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="min-w-[980px]">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b bg-muted/20">
                        {MONTH_DAYS.map(day => (
                            <div
                                key={day}
                                className="border-r px-3 py-3 text-center text-sm font-semibold text-muted-foreground last:border-r-0"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 grid-rows-6">
                        {calendarDays.map((date, index) => {
                            const dateKey = date.toDateString();
                            const daySchedules = schedulesByDate[dateKey] || [];
                            const isCurrentMonthDay = isCurrentMonth(date);
                            const isTodayDate = isToday(date);

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex min-h-[156px] flex-col border-r border-b px-3 py-2",
                                        !isCurrentMonthDay && "bg-muted/20 text-muted-foreground",
                                        isTodayDate && "bg-primary/5"
                                    )}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className={cn(
                                            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                                            isTodayDate && "bg-primary text-primary-foreground font-bold"
                                        )}>
                                            {date.getDate()}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {daySchedules.length > 0 ? `${daySchedules.length} class${daySchedules.length > 1 ? 'es' : ''}` : ""}
                                        </div>
                                    </div>
                                    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                                        {daySchedules.slice(0, 3).map((schedule, idx) => (
                                            <div
                                                key={`${schedule.id}-${idx}`}
                                                className={cn(
                                                    "rounded-md border-l-2 px-2 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity",
                                                    getStatusColor(schedule.status)
                                                )}
                                                onClick={() => onScheduleClick(schedule)}
                                            >
                                                <div className="font-semibold truncate">
                                                    {schedule.courseCode}
                                                </div>
                                                <div className="text-[10px] truncate opacity-90">
                                                    {schedule.day} • {schedule.startTime}
                                                </div>
                                            </div>
                                        ))}
                                        {daySchedules.length > 3 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-auto w-full justify-start px-2 text-xs h-auto py-1 text-muted-foreground hover:text-primary"
                                                onClick={() => {
                                                    setSelectedDaySchedules(daySchedules);
                                                    setSelectedDate(date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                +{daySchedules.length - 3} more
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                </div>
            </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedules for {selectedDate}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    {selectedDaySchedules.map((schedule, idx) => (
                        <div
                            key={`${schedule.id}-${idx}`}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                                onScheduleClick(schedule);
                                setDialogOpen(false);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-1 h-12 rounded-full",
                                    schedule.status === "published" ? "bg-green-500" :
                                    schedule.status === "draft" ? "bg-yellow-500" : "bg-gray-500"
                                )} />
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        {schedule.courseCode}
                                        <span className="text-muted-foreground font-normal">- {schedule.courseName}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {schedule.facultyName}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {schedule.classroom}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {schedule.startTime} - {schedule.endTime}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">{schedule.yearLevel}</Badge>
                                        <Badge variant="outline" className="text-xs">{schedule.semester}</Badge>
                                        <Badge variant="outline" className="text-xs">{schedule.academicYear}</Badge>
                                    </div>
                                </div>
                            </div>
                            <Badge variant={schedule.status === "published" ? "default" : "secondary"}>
                                {schedule.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
