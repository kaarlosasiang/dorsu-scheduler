/**
 * Time Slot Pattern Generator
 * Generates appropriate time slots based on schedule type and institutional standards
 */

import { ITimeSlot } from '../interfaces/ISchedule';
import { calculateEndTime } from './teachingHoursCalculator';

/**
 * Day patterns for different schedule types
 */
type DayType = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const LECTURE_DAY_PATTERNS: DayType[][] = [
  ['monday', 'wednesday'],      // MW
  ['monday', 'friday'],          // MF
  ['wednesday', 'friday'],       // WF
];

export const LAB_DAY_PATTERNS: DayType[][] = [
  ['tuesday', 'thursday'],       // TTh
];

/**
 * Standard time slots for scheduling
 */
export const STANDARD_TIME_STARTS = [
  '07:00', '07:30',
  '08:00', '08:30',
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
];

/**
 * Default session durations (in hours)
 */
export const DEFAULT_LECTURE_DURATION = 1.5; // 1.5 hours per session
export const DEFAULT_LAB_DURATION = 1.5;     // 1.5 hours per session

/**
 * Generate time slots for lecture schedules
 * Lectures use MW, MF, or WF patterns
 * Each session is typically 1.5 hours
 */
export function generateLectureTimeSlots(): ITimeSlot[] {
  const slots: ITimeSlot[] = [];

  for (const dayPattern of LECTURE_DAY_PATTERNS) {
    for (const startTime of STANDARD_TIME_STARTS) {
      const endTime = calculateEndTime(startTime, DEFAULT_LECTURE_DURATION);

      // Create slots for each day in the pattern
      for (const day of dayPattern) {
        slots.push({
          day: day as ITimeSlot['day'],
          startTime,
          endTime
        });
      }
    }
  }

  return slots;
}

/**
 * Generate time slots for laboratory schedules
 * Labs use TTh pattern
 * Each session is 1.5 hours
 */
export function generateLabTimeSlots(): ITimeSlot[] {
  const slots: ITimeSlot[] = [];

  for (const dayPattern of LAB_DAY_PATTERNS) {
    for (const startTime of STANDARD_TIME_STARTS) {
      const endTime = calculateEndTime(startTime, DEFAULT_LAB_DURATION);

      // Create slots for each day in the pattern
      for (const day of dayPattern) {
        slots.push({
          day: day as ITimeSlot['day'],
          startTime,
          endTime
        });
      }
    }
  }

  return slots;
}

/**
 * Get time slots based on schedule type
 */
export function getTimeSlotsForScheduleType(scheduleType: 'lecture' | 'laboratory'): ITimeSlot[] {
  if (scheduleType === 'lecture') {
    return generateLectureTimeSlots();
  } else {
    return generateLabTimeSlots();
  }
}

/**
 * Check if two time slots are on the same day pattern
 * Used for conflict detection within the same subject
 */
export function isSameDayPattern(slot1: ITimeSlot, slot2: ITimeSlot): boolean {
  // Check if both slots are in the same day pattern
  const allPatterns = [...LECTURE_DAY_PATTERNS, ...LAB_DAY_PATTERNS];

  for (const pattern of allPatterns) {
    const inPattern1 = pattern.includes(slot1.day as DayType);
    const inPattern2 = pattern.includes(slot2.day as DayType);

    if (inPattern1 && inPattern2) {
      return true;
    }
  }

  return false;
}

/**
 * Get day pattern description for display
 */
export function getDayPatternDescription(day: ITimeSlot['day']): string {
  for (const pattern of LECTURE_DAY_PATTERNS) {
    if (pattern.includes(day as DayType)) {
      return pattern.map(d => d.substring(0, 1).toUpperCase()).join('');
    }
  }

  for (const pattern of LAB_DAY_PATTERNS) {
    if (pattern.includes(day as DayType)) {
      return pattern.map(d => {
        if (d === 'tuesday' || d === 'thursday') {
          return d === 'tuesday' ? 'T' : 'Th';
        }
        return d.substring(0, 1).toUpperCase();
      }).join('');
    }
  }

  return day.substring(0, 1).toUpperCase();
}

/**
 * Calculate total sessions needed per week based on units and session duration
 */
export function calculateSessionsPerWeek(
  teachingHours: number,
  sessionDuration: number = 1.5
): number {
  return Math.ceil(teachingHours / sessionDuration);
}

/**
 * Validate if a time slot pattern is appropriate for the schedule type
 */
export function isValidDayPattern(
  day: ITimeSlot['day'],
  scheduleType: 'lecture' | 'laboratory'
): boolean {
  if (scheduleType === 'lecture') {
    return LECTURE_DAY_PATTERNS.some(pattern => pattern.includes(day as DayType));
  } else {
    return LAB_DAY_PATTERNS.some(pattern => pattern.includes(day as DayType));
  }
}

