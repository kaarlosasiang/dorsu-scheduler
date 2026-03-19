"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
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

interface WeekCalendarViewProps {
    schedules: ScheduleEvent[];
    currentDate: Date;
    onScheduleClick: (schedule: ScheduleEvent) => void;
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_ABBREVIATIONS: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
};
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 20;
const DAY_COLUMN_MIN_WIDTH = 220;
const TIME_COLUMN_WIDTH = 88;
const HOUR_SLOT_HEIGHT = 52;
const HOUR_ROW_GAP = 4;
const HOUR_ROW_STRIDE = HOUR_SLOT_HEIGHT + HOUR_ROW_GAP;
const DAY_COLUMN_GAP = 4;
const MIN_EVENT_HEIGHT = 34;
const MAX_VISIBLE_COLUMNS = 3;

interface PositionedScheduleEvent extends ScheduleEvent {
    startMinutes: number;
    endMinutes: number;
    columnIndex: number;
    columnCount: number;
}

interface DenseSlotSummary {
    total: number;
    hidden: number;
}

// Parse time string in either 24-hour or 12-hour format to minutes since midnight.
function parseTime(timeStr: string): number {
    const normalized = timeStr.trim();

    if (/^\d{1,2}:\d{2}$/.test(normalized)) {
        const [hoursStr, minutesStr] = normalized.split(":");
        return Number(hoursStr) * 60 + Number(minutesStr);
    }

    const [time, period] = normalized.split(" ");
    const [hoursStr, minutesStr] = time.split(":");
    let hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

function formatTimeLabel(hour: number): string {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${suffix}`;
}

function mapDayAbbreviation(dayValue: string): string | null {
    return DAY_ABBREVIATIONS[dayValue] ?? null;
}

function layoutDayEvents(events: ScheduleEvent[]): PositionedScheduleEvent[] {
    const normalizedEvents = events
        .map((event) => ({
            ...event,
            startMinutes: parseTime(event.startTime),
            endMinutes: parseTime(event.endTime),
            columnIndex: 0,
            columnCount: 1,
        }))
        .sort((left, right) => {
            if (left.startMinutes !== right.startMinutes) {
                return left.startMinutes - right.startMinutes;
            }

            return left.endMinutes - right.endMinutes;
        });

    const positionedEvents: PositionedScheduleEvent[] = [];
    let group: PositionedScheduleEvent[] = [];
    let active: PositionedScheduleEvent[] = [];
    let groupMaxColumns = 1;
    let groupEnd = -1;

    const finalizeGroup = () => {
        if (group.length === 0) {
            return;
        }

        group.forEach((event) => {
            event.columnCount = groupMaxColumns;
            positionedEvents.push(event);
        });

        group = [];
        active = [];
        groupMaxColumns = 1;
        groupEnd = -1;
    };

    normalizedEvents.forEach((event) => {
        if (group.length > 0 && event.startMinutes >= groupEnd) {
            finalizeGroup();
        }

        active = active.filter((activeEvent) => activeEvent.endMinutes > event.startMinutes);
        const usedColumns = new Set(active.map((activeEvent) => activeEvent.columnIndex));

        let nextColumnIndex = 0;
        while (usedColumns.has(nextColumnIndex)) {
            nextColumnIndex += 1;
        }

        event.columnIndex = nextColumnIndex;
        group.push(event);
        active.push(event);
        groupEnd = Math.max(groupEnd, event.endMinutes);
        groupMaxColumns = Math.max(groupMaxColumns, active.length);
    });

    finalizeGroup();

    return positionedEvents;
}

export function WeekCalendarView({ schedules, currentDate, onScheduleClick }: WeekCalendarViewProps) {
    const weekDates = React.useMemo(() => {
        const baseDate = new Date(currentDate);
        const dayOfWeek = baseDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() + mondayOffset);

        return WEEK_DAYS.map((_, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            return date;
        });
    }, [currentDate]);

    const dayLayouts = React.useMemo(() => {
        const grouped: Record<string, ScheduleEvent[]> = {};
        WEEK_DAYS.forEach(day => {
            grouped[day] = [];
        });

        schedules.forEach(schedule => {
            const days = schedule.day.split(" ");
            days.forEach(dayAbbr => {
                const fullDay = mapDayAbbreviation(dayAbbr);
                if (fullDay && grouped[fullDay]) {
                    grouped[fullDay].push(schedule);
                }
            });
        });

        return WEEK_DAYS.reduce((acc, day) => {
            acc[day] = layoutDayEvents(grouped[day]);
            return acc;
        }, {} as Record<string, PositionedScheduleEvent[]>);
    }, [schedules]);

    const denseSlotSummaries = React.useMemo(() => {
        return WEEK_DAYS.reduce((acc, day) => {
            const slotCounts = dayLayouts[day].reduce((slotAcc, event) => {
                const key = `${event.startMinutes}-${event.endMinutes}`;
                slotAcc[key] = (slotAcc[key] || 0) + 1;
                return slotAcc;
            }, {} as Record<string, number>);

            acc[day] = Object.entries(slotCounts).reduce((dayAcc, [key, total]) => {
                if (total > MAX_VISIBLE_COLUMNS) {
                    dayAcc[key] = {
                        total,
                        hidden: total - MAX_VISIBLE_COLUMNS,
                    };
                }

                return dayAcc;
            }, {} as Record<string, DenseSlotSummary>);

            return acc;
        }, {} as Record<string, Record<string, DenseSlotSummary>>);
    }, [dayLayouts]);

    const startHour = React.useMemo(() => {
        const earliestScheduleHour = schedules.length > 0
            ? Math.floor(
                Math.min(...schedules.map((schedule) => parseTime(schedule.startTime))) / 60
            )
            : DEFAULT_START_HOUR;

        return Math.min(DEFAULT_START_HOUR, earliestScheduleHour);
    }, [schedules]);

    const endHour = React.useMemo(() => {
        const latestScheduleHour = schedules.length > 0
            ? Math.ceil(
                Math.max(...schedules.map((schedule) => parseTime(schedule.endTime))) / 60
            )
            : DEFAULT_END_HOUR;

        return Math.max(DEFAULT_END_HOUR, latestScheduleHour);
    }, [schedules]);

    const totalHours = Math.max(endHour - startHour, 1);
    const gridHeight = Math.max((totalHours * HOUR_ROW_STRIDE) - HOUR_ROW_GAP, HOUR_SLOT_HEIGHT);
    const hourSlots = React.useMemo(
        () => Array.from({ length: totalHours }, (_, index) => startHour + index),
        [startHour, totalHours]
    );

    const gridTemplateColumns = React.useMemo(
        () => `${TIME_COLUMN_WIDTH}px repeat(${WEEK_DAYS.length}, minmax(${DAY_COLUMN_MIN_WIDTH}px, 1fr))`,
        []
    );

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
                <div className="overflow-auto">
                    <div className="min-w-[1480px]">
                        <div
                            className="grid border-b sticky top-0 bg-background z-10"
                            style={{ gridTemplateColumns, columnGap: DAY_COLUMN_GAP }}
                        >
                            <div className="flex items-center justify-center p-2 border-r">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {WEEK_DAYS.map((day, dayIndex) => (
                                <div key={day} className="border-r px-2 py-2 text-center last:border-r-0">
                                    <div className="font-semibold text-xs">{day}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {weekDates[dayIndex]?.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {dayLayouts[day].length} classes
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            className="grid"
                            style={{ gridTemplateColumns, columnGap: DAY_COLUMN_GAP }}
                        >
                            <div className="border-r bg-muted/15" style={{ height: gridHeight }}>
                                {hourSlots.map((hour, index) => (
                                    <div
                                        key={hour}
                                        className="flex items-start justify-end border-b px-2 py-1 text-[11px] text-muted-foreground"
                                        style={{
                                            height: HOUR_SLOT_HEIGHT,
                                            marginBottom: index === hourSlots.length - 1 ? 0 : HOUR_ROW_GAP,
                                        }}
                                    >
                                        {formatTimeLabel(hour)}
                                    </div>
                                ))}
                            </div>

                            {WEEK_DAYS.map((day) => (
                                <div
                                    key={day}
                                    className="relative border-r last:border-r-0 bg-background"
                                    style={{ height: gridHeight }}
                                >
                                    {hourSlots.map((hour, index) => (
                                        <div
                                            key={`${day}-${hour}`}
                                            className="pointer-events-none absolute inset-x-0 border-b border-border/70"
                                            style={{ top: (index * HOUR_ROW_STRIDE) + HOUR_SLOT_HEIGHT }}
                                        />
                                    ))}

                                    {dayLayouts[day].map((schedule, idx) => {
                                        if (schedule.columnIndex >= MAX_VISIBLE_COLUMNS) {
                                            return null;
                                        }

                                        const top = ((schedule.startMinutes - (startHour * 60)) / 60) * HOUR_ROW_STRIDE;
                                        const rawHeight = ((schedule.endMinutes - schedule.startMinutes) / 60) * HOUR_ROW_STRIDE;
                                        const height = Math.max(rawHeight, MIN_EVENT_HEIGHT);
                                        const visibleColumnCount = Math.min(schedule.columnCount, MAX_VISIBLE_COLUMNS);
                                        const width = `calc(${100 / visibleColumnCount}% - 8px)`;
                                        const left = `calc(${(schedule.columnIndex / visibleColumnCount) * 100}% + 4px)`;
                                        const slotKey = `${schedule.startMinutes}-${schedule.endMinutes}`;
                                        const denseSummary = denseSlotSummaries[day][slotKey];

                                        return (
                                            <div
                                                key={`${schedule.id}-${idx}`}
                                                className={cn(
                                                    "absolute rounded-sm border-l-4 p-1 cursor-pointer hover:shadow-md transition-all shadow-sm",
                                                    getStatusColor(schedule.status)
                                                )}
                                                style={{
                                                    top,
                                                    left,
                                                    width,
                                                    height,
                                                }}
                                                onClick={() => onScheduleClick(schedule)}
                                            >
                                                <div className="text-[10px] font-semibold truncate leading-tight">
                                                    {schedule.courseCode}
                                                </div>
                                                <div className="text-[10px] opacity-80 truncate mt-0.5 flex items-center gap-1 leading-tight">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {schedule.startTime}
                                                </div>
                                                {schedule.columnIndex === 0 && denseSummary ? (
                                                    <div className="text-[10px] mt-0.5 opacity-90 font-semibold truncate">
                                                        +{denseSummary.hidden} more
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
