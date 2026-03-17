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
    yearLevel: string;
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
    const [selectedProgram, setSelectedProgram] = React.useState<string>("all");
    const [selectedYearLevel, setSelectedYearLevel] = React.useState<string>("all");
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedSchedule, setSelectedSchedule] = React.useState<ScheduleEvent | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<ViewMode>("month");

    // Extract unique departments, semesters, programs, and year levels
    const departments = React.useMemo(() => {
        const depts = new Set(schedules.map(s => s.departmentName).filter(Boolean));
        return ["all", ...Array.from(depts)];
    }, [schedules]);

    const semesters = React.useMemo(() => {
        const sems = new Set(schedules.map(s => `${s.semester} ${s.academicYear}`).filter(Boolean));
        return ["all", ...Array.from(sems)];
    }, [schedules]);

    const programs = React.useMemo(() => {
        const progs = new Set(schedules.map(s => s.courseName).filter(Boolean));
        return ["all", ...Array.from(progs).sort()];
    }, [schedules]);

    const yearLevels = React.useMemo(() => {
        const levels = new Set(schedules.map(s => s.yearLevel).filter(Boolean));
        const levelOrder = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
        const sortedLevels = Array.from(levels).sort((a, b) => {
            const indexA = levelOrder.indexOf(a);
            const indexB = levelOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
        return ["all", ...sortedLevels];
    }, [schedules]);

    // Filter schedules
    const filteredSchedules = React.useMemo(() => {
        return schedules.filter(schedule => {
            const departmentMatch = selectedDepartment === "all" || schedule.departmentName === selectedDepartment;
            const semesterMatch = selectedSemester === "all" || `${schedule.semester} ${schedule.academicYear}` === selectedSemester;
            const programMatch = selectedProgram === "all" || schedule.courseName === selectedProgram;
            const yearLevelMatch = selectedYearLevel === "all" || schedule.yearLevel === selectedYearLevel;
            return departmentMatch && semesterMatch && programMatch && yearLevelMatch;
        });
    }, [schedules, selectedDepartment, selectedSemester, selectedProgram, selectedYearLevel]);

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
                programs={programs}
                yearLevels={yearLevels}
                selectedDepartment={selectedDepartment}
                selectedSemester={selectedSemester}
                selectedProgram={selectedProgram}
                selectedYearLevel={selectedYearLevel}
                onDepartmentChange={setSelectedDepartment}
                onSemesterChange={setSelectedSemester}
                onProgramChange={setSelectedProgram}
                onYearLevelChange={setSelectedYearLevel}
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
