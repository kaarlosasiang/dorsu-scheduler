"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Filter,
    LayoutGrid,
    List as ListIcon,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type ViewMode = "month" | "week";

interface CalendarControlsProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    currentDate: Date;
    onNavigateMonth: (direction: number) => void;
    onGoToToday: () => void;
    departments: string[];
    semesters: string[];
    selectedDepartment: string;
    selectedSemester: string;
    onDepartmentChange: (value: string) => void;
    onSemesterChange: (value: string) => void;
}

export function CalendarControls({
    viewMode,
    onViewModeChange,
    currentDate,
    onNavigateMonth,
    onGoToToday,
    departments,
    semesters,
    selectedDepartment,
    selectedSemester,
    onDepartmentChange,
    onSemesterChange,
}: CalendarControlsProps) {
    return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center border rounded-md">
                    <Button
                        variant={viewMode === "month" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("month")}
                        className="rounded-r-none h-8"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "week" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("week")}
                        className="rounded-l-none h-8"
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (
                                            <SelectItem key={dept} value={dept}>
                                                {dept === "all" ? "All Departments" : dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Semester</label>
                                <Select value={selectedSemester} onValueChange={onSemesterChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map(sem => (
                                            <SelectItem key={sem} value={sem}>
                                                {sem === "all" ? "All Semesters" : sem}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button variant="outline" size="sm" onClick={onGoToToday}>
                    Today
                </Button>

                <div className="flex items-center gap-1 border rounded-md">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigateMonth(-1)}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigateMonth(1)}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
