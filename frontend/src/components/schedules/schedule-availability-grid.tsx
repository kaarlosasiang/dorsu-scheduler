"use client";

import type { ITimeSlot } from "@/lib/services/ScheduleAPI";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DAY_PATTERNS,
  addMinutes,
  clientSlotOverlaps,
  formatTime,
  patternKey,
  slotKey,
  type DayPattern,
} from "./schedule-slot-utils";

export interface ReservedSlot {
  slot: ITimeSlot;
  label: string;
  tooltip?: string;
}

export interface ScheduleAvailabilityGridProps {
  timeStarts: string[];
  durationMins: number;
  dayPatterns?: DayPattern[];
  availableSet: Set<string>;
  occupiedMap: Map<string, string[]>;
  selectedSlot: ITimeSlot | null;
  onSelectSlot: (slot: ITimeSlot | null) => void;
  reservedSlots?: ReservedSlot[];
  selectedSlotSummary?: React.ReactNode;
  showLegend?: boolean;
}

export function ScheduleAvailabilityGrid({
  timeStarts,
  durationMins,
  dayPatterns = DAY_PATTERNS,
  availableSet,
  occupiedMap,
  selectedSlot,
  onSelectSlot,
  reservedSlots = [],
  selectedSlotSummary,
  showLegend = true,
}: ScheduleAvailabilityGridProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-medium pb-2 pr-2 whitespace-nowrap">
                Time
              </th>
              {dayPatterns.map((p) => (
                <th
                  key={p.label}
                  className="text-center text-muted-foreground font-medium pb-2 px-1 whitespace-nowrap"
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeStarts.map((start) => {
              const end = addMinutes(start, durationMins);
              return (
                <tr key={start}>
                  <td className="pr-2 py-0.5 text-muted-foreground whitespace-nowrap">
                    {formatTime(start)}
                  </td>
                  {dayPatterns.map((pattern) => {
                    const candidate: ITimeSlot = {
                      day: pattern.day,
                      days: pattern.days as ITimeSlot["days"],
                      startTime: start,
                      endTime: end,
                    };
                    const key = `${start}|${patternKey(pattern)}`;
                    const isAvail = availableSet.has(key);
                    const takenBy = occupiedMap.get(key);
                    const isSelected = selectedSlot
                      ? slotKey(selectedSlot) === key
                      : false;
                    const usedByOther = reservedSlots.find((o) =>
                      clientSlotOverlaps(candidate, o.slot)
                    );

                    if (usedByOther && !isSelected) {
                      return (
                        <td key={pattern.label} className="px-1 py-0.5 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                disabled
                                className="w-full rounded px-1 py-1 bg-amber-100 text-amber-700 cursor-not-allowed text-[10px] dark:bg-amber-900/20 dark:text-amber-400"
                              >
                                {usedByOther.label}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {usedByOther.tooltip ?? usedByOther.label}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    }

                    if (isAvail || isSelected) {
                      return (
                        <td key={pattern.label} className="px-1 py-0.5 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectSlot(isSelected ? null : candidate)}
                            className={cn(
                              "w-full rounded px-1 py-1 font-medium transition-colors",
                              isSelected
                                ? "bg-green-600 text-white ring-2 ring-green-700"
                                : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                            )}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="h-3 w-3 mx-auto" />
                            ) : (
                              "Free"
                            )}
                          </button>
                        </td>
                      );
                    }

                    if (takenBy) {
                      return (
                        <td key={pattern.label} className="px-1 py-0.5 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                disabled
                                className="w-full rounded px-1 py-1 bg-muted text-muted-foreground cursor-not-allowed opacity-60 text-[10px]"
                              >
                                Taken
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">{takenBy.join(" · ")}</TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    }

                    return (
                      <td key={pattern.label} className="px-1 py-0.5 text-center">
                        <span className="text-muted-foreground">—</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedSlotSummary ??
        (selectedSlot && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-medium">
                {
                  dayPatterns.find(
                    (p) =>
                      patternKey(p) === slotKey(selectedSlot).split("|")[1]
                  )?.label
                }
              </span>
              {" · "}
              {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
            </span>
          </div>
        ))}

      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" />
            Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-muted inline-block" />
            Taken
          </span>
          {reservedSlots.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-200 inline-block" />
              Reserved
            </span>
          )}
        </div>
      )}
    </>
  );
}

export function ScheduleAvailabilityBadge({ slot }: { slot: ITimeSlot }) {
  return (
    <Badge variant="outline" className="text-xs">
      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
    </Badge>
  );
}
