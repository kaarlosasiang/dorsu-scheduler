"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Loader2,
  User,
} from "lucide-react";
import type { IScheduleConflict, ITimeSlot } from "@/lib/services/ScheduleAPI";
import { formatSlotLabel } from "./schedule-slot-utils";
import { cn } from "@/lib/utils";

const CONFLICT_ICONS = {
  classroom: Building2,
  section: Calendar,
  faculty: User,
  time: Clock,
  workload: User,
} as const;

const CONFLICT_LABELS: Record<IScheduleConflict["type"], string> = {
  classroom: "Classroom conflict",
  section: "Section conflict",
  faculty: "Instructor conflict",
  time: "Time conflict",
  workload: "Workload limit",
};

interface ScheduleConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: IScheduleConflict[];
  fallbackMessages?: string[];
  vacantSlots: ITimeSlot[];
  slotsLoading?: boolean;
  selectedSuggestion: ITimeSlot | null;
  onSelectSuggestion: (slot: ITimeSlot | null) => void;
  onApplySuggestion: () => void;
  onChangeAssignment: () => void;
}

function ConflictItem({ conflict }: { conflict: IScheduleConflict }) {
  const Icon = CONFLICT_ICONS[conflict.type] ?? AlertCircle;
  const isError = conflict.severity === "error";

  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border p-3 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          isError ? "text-destructive" : "text-amber-600"
        )}
      />
      <div className="space-y-1 min-w-0">
        <p className="font-medium">{CONFLICT_LABELS[conflict.type]}</p>
        <p className="text-muted-foreground">{conflict.message}</p>
        {conflict.details?.subject?.subjectCode && (
          <p className="text-xs text-muted-foreground">
            Conflicting subject: {conflict.details.subject.subjectCode}
            {conflict.details.timeSlot?.startTime &&
              ` · ${conflict.details.timeSlot.startTime}–${conflict.details.timeSlot.endTime}`}
          </p>
        )}
      </div>
    </div>
  );
}

export function ScheduleConflictModal({
  open,
  onOpenChange,
  conflicts,
  fallbackMessages = [],
  vacantSlots,
  slotsLoading = false,
  selectedSuggestion,
  onSelectSuggestion,
  onApplySuggestion,
  onChangeAssignment,
}: ScheduleConflictModalProps) {
  const errorConflicts = conflicts.filter((c) => c.severity === "error");
  const warningConflicts = conflicts.filter((c) => c.severity === "warning");
  const displayConflicts =
    errorConflicts.length > 0 ? errorConflicts : conflicts;
  const topSlots = vacantSlots.slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Schedule Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This assignment overlaps with an existing schedule in the same semester.
            Choose a vacant time slot or change faculty/classroom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {displayConflicts.length > 0 ? (
            <div className="space-y-2">
              {displayConflicts.map((conflict, i) => (
                <ConflictItem key={`${conflict.type}-${i}`} conflict={conflict} />
              ))}
            </div>
          ) : (
            fallbackMessages.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fallbackMessages.join("; ")}</AlertDescription>
              </Alert>
            )
          )}

          {warningConflicts.length > 0 && errorConflicts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Warnings
              </p>
              {warningConflicts.map((conflict, i) => (
                <ConflictItem key={`warn-${i}`} conflict={conflict} />
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Recommended vacant slots</p>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding available slots…
              </div>
            ) : topSlots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topSlots.map((slot) => {
                  const isSelected =
                    selectedSuggestion &&
                    formatSlotLabel(selectedSuggestion) === formatSlotLabel(slot);
                  return (
                    <button
                      key={formatSlotLabel(slot)}
                      type="button"
                      onClick={() => onSelectSuggestion(isSelected ? null : slot)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs transition-colors text-left",
                        isSelected
                          ? "border-green-600 bg-green-50 text-green-800 ring-2 ring-green-600 dark:bg-green-950/30 dark:text-green-300"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {formatSlotLabel(slot)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No fully vacant slots for this faculty and classroom. Try changing
                faculty or classroom.
              </p>
            )}
          </div>

          {selectedSuggestion && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">Selected</Badge>
              <span>{formatSlotLabel(selectedSuggestion)}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onChangeAssignment}>
            Change assignment
          </Button>
          <Button
            onClick={onApplySuggestion}
            disabled={!selectedSuggestion}
          >
            Apply slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
