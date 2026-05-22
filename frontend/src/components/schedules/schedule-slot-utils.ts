import type { ITimeSlot } from "@/lib/services/ScheduleAPI";

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export interface DayPattern {
  label: string;
  days: DayKey[];
  day: DayKey;
}

export const DAY_PATTERNS: DayPattern[] = [
  { label: "M / W", days: ["monday", "wednesday"], day: "monday" },
  { label: "M / F", days: ["monday", "friday"], day: "monday" },
  { label: "W / F", days: ["wednesday", "friday"], day: "wednesday" },
  { label: "Tu / Th", days: ["tuesday", "thursday"], day: "tuesday" },
];

export const ALL_TIME_STARTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00",
];

export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function slotKey(slot: ITimeSlot): string {
  const days = slot.days && slot.days.length > 0 ? slot.days : [slot.day];
  return `${slot.startTime}|${[...days].sort().join(",")}`;
}

export function patternKey(p: DayPattern): string {
  return [...p.days].sort().join(",");
}

export function dayPatternKey(p: DayPattern): string {
  return p.days.join(",");
}

export function getPatternFromDays(days?: string[]): DayPattern | undefined {
  if (!days || days.length === 0) return undefined;
  const key = [...days].sort().join(",");
  for (const p of DAY_PATTERNS) {
    if ([...p.days].sort().join(",") === key) return p;
  }
  return undefined;
}

export function formatSlotLabel(slot: ITimeSlot): string {
  const pattern =
    getPatternFromDays(slot.days) ??
    DAY_PATTERNS.find((p) => p.day === slot.day);
  const dayLabel = pattern?.label ?? slot.day;
  return `${dayLabel} · ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`;
}

/** Client-side slot overlap check — mirrors backend slotOverlaps logic. */
export function clientSlotOverlaps(a: ITimeSlot, b: ITimeSlot): boolean {
  const aDays = a.days && a.days.length > 0 ? a.days : [a.day];
  const bDays = b.days && b.days.length > 0 ? b.days : [b.day];
  if (!aDays.some((d) => bDays.includes(d))) return false;
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(a.startTime) < toMin(b.endTime) && toMin(a.endTime) > toMin(b.startTime);
}

export function filterTimeStartsByDuration(durationMins: number): string[] {
  const maxEndMin = 17 * 60;
  return ALL_TIME_STARTS.filter((s) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m + durationMins <= maxEndMin;
  });
}
