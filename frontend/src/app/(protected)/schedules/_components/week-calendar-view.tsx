"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin } from "lucide-react";
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

interface WeekCalendarViewProps {
    schedules: ScheduleEvent[];
    onScheduleClick: (schedule: ScheduleEvent) => void;
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Parse time string "HH:MM AM/PM" to minutes since midnight
function parseTime(timeStr: string): number {
    const [time, period] = timeStr.split(" ");
    const [hoursStr, minutesStr] = time.split(":");
    let hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
}

export function WeekCalendarView({ schedules, onScheduleClick }: WeekCalendarViewProps) {
    // Group schedules by day
    const schedulesByDay = React.useMemo(() => {
        const grouped: Record<string, ScheduleEvent[]> = {};
        WEEK_DAYS.forEach(day => {
            grouped[day] = [];
        });

        schedules.forEach(schedule => {
            const days = schedule.day.split(" ");
            days.forEach(dayAbbr => {
                const fullDay = WEEK_DAYS.find(d => d.startsWith(dayAbbr));
                if (fullDay && grouped[fullDay]) {
                    grouped[fullDay].push(schedule);
                }
            });
        });

        return grouped;
    }, [schedules]);

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

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                        {/* Header with days */}
                        <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b sticky top-0 bg-background z-10">
                            <div className="p-4 border-r">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {WEEK_DAYS.map(day => (
                                <div key={day} className="p-4 text-center border-r last:border-r-0">
                                    <div className="font-semibold text-sm">{day}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {schedulesByDay[day].length} classes
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Time grid */}
                        <div className="grid grid-cols-[80px_repeat(6,1fr)]">
                            {/* Time column */}
                            <div className="border-r">
                                {Array.from({ length: 13 }, (_, i) => {
                                    const hour = i + 7;
                                    return (
                                        <div key={hour} className="h-[80px] p-2 border-b text-xs text-muted-foreground">
                                            {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Day columns with schedules */}
                            {WEEK_DAYS.map((day) => (
                                <div key={day} className="border-r last:border-r-0 p-2 space-y-2">
                                    {schedulesByDay[day]
                                        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
                                        .map((schedule, idx) => (
                                            <div
                                                key={`${schedule.id}-${idx}`}
                                                className={cn(
                                                    "rounded-md border-l-4 p-2 cursor-pointer hover:shadow-lg transition-all",
                                                    getStatusColor(schedule.status)
                                                )}
                                                onClick={() => onScheduleClick(schedule)}
                                            >
                                                <div className="text-xs font-semibold truncate">
                                                    {schedule.courseCode}
                                                </div>
                                                <div className="text-xs opacity-90 truncate">
                                                    {schedule.courseName}
                                                </div>
                                                <div className="text-xs opacity-80 truncate mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {schedule.startTime} - {schedule.endTime}
                                                </div>
                                                <div className="text-xs opacity-80 truncate flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {schedule.classroom}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
