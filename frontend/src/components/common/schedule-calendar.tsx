"use client";

import * as React from "react";
import { ScheduleDetailDialog } from "./schedule-detail-dialog";
import { MonthCalendarView } from "@/app/(protected)/schedules/_components/month-calendar-view";
import { WeekCalendarView } from "@/app/(protected)/schedules/_components/week-calendar-view";
import { CalendarControls } from "@/app/(protected)/schedules/_components/calendar-controls";
import { CalendarLegend } from "@/app/(protected)/schedules/_components/calendar-legend";

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

interface ScheduleCalendarProps {
    schedules: ScheduleEvent[];
    onEventClick?: (schedule: ScheduleEvent) => void;
}

type ViewMode = "month" | "week";

export function ScheduleCalendar({ schedules, onEventClick }: ScheduleCalendarProps) {
    const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all");
    const [selectedSemester, setSelectedSemester] = React.useState<string>("all");
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedSchedule, setSelectedSchedule] = React.useState<ScheduleEvent | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<ViewMode>("month");

    // Extract unique departments and semesters
    const departments = React.useMemo(() => {
        const depts = new Set(schedules.map(s => s.departmentName));
        return ["all", ...Array.from(depts)];
    }, [schedules]);

    const semesters = React.useMemo(() => {
        const sems = new Set(schedules.map(s => `${s.semester} ${s.academicYear}`));
        return ["all", ...Array.from(sems)];
    }, [schedules]);

    // Filter schedules
    const filteredSchedules = React.useMemo(() => {
        return schedules.filter(schedule => {
            const departmentMatch = selectedDepartment === "all" || schedule.departmentName === selectedDepartment;
            const semesterMatch = selectedSemester === "all" || `${schedule.semester} ${schedule.academicYear}` === selectedSemester;
            return departmentMatch && semesterMatch;
        });
    }, [schedules, selectedDepartment, selectedSemester]);

    const navigateMonth = (direction: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleScheduleClick = (schedule: ScheduleEvent) => {
        setSelectedSchedule(schedule);
        setDetailDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <CalendarControls
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                currentDate={currentDate}
                onNavigateMonth={navigateMonth}
                onGoToToday={goToToday}
                departments={departments}
                semesters={semesters}
                selectedDepartment={selectedDepartment}
                selectedSemester={selectedSemester}
                onDepartmentChange={setSelectedDepartment}
                onSemesterChange={setSelectedSemester}
            />

            {/* Calendar Views */}
            {viewMode === "month" ? (
                <MonthCalendarView
                    schedules={filteredSchedules}
                    currentDate={currentDate}
                    onScheduleClick={handleScheduleClick}
                />
            ) : (
                <WeekCalendarView
                    schedules={filteredSchedules}
                    onScheduleClick={handleScheduleClick}
                />
            )}

            {/* Legend */}
            <CalendarLegend />

            {/* Detail Dialog */}
            <ScheduleDetailDialog
                schedule={selectedSchedule}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                onEdit={(schedule) => onEventClick?.(schedule)}
            />
        </div>
    );
}
