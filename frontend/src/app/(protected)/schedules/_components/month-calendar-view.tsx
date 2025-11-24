"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
        <Card>
            <CardContent className="p-4">
                <div className="space-y-2">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-2">
                        {MONTH_DAYS.map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((date, index) => {
                            const dateKey = date.toDateString();
                            const daySchedules = schedulesByDate[dateKey] || [];
                            const isCurrentMonthDay = isCurrentMonth(date);
                            const isTodayDate = isToday(date);

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "min-h-[120px] border rounded-lg p-2 space-y-1",
                                        !isCurrentMonthDay && "bg-muted/30 text-muted-foreground",
                                        isTodayDate && "border-primary border-2"
                                    )}
                                >
                                    <div className={cn(
                                        "text-sm font-medium",
                                        isTodayDate && "text-primary font-bold"
                                    )}>
                                        {date.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {daySchedules.slice(0, 3).map((schedule, idx) => (
                                            <div
                                                key={`${schedule.id}-${idx}`}
                                                className={cn(
                                                    "text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-2",
                                                    getStatusColor(schedule.status)
                                                )}
                                                onClick={() => onScheduleClick(schedule)}
                                            >
                                                <div className="font-semibold truncate">
                                                    {schedule.courseCode}
                                                </div>
                                                <div className="text-[10px] truncate opacity-90">
                                                    {schedule.startTime}
                                                </div>
                                            </div>
                                        ))}
                                        {daySchedules.length > 3 && (
                                            <div className="text-xs text-muted-foreground text-center py-1">
                                                +{daySchedules.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
