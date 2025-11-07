/**
 * Teaching Hours Calculator
 * Handles conversion between units and teaching hours based on type
 */

/**
 * Teaching hours conversion ratios
 * - Lecture: 1 unit = 1 hour (1:1 ratio)
 * - Lab: 1 unit = 1.33... hours (1:0.75 ratio, or 0.75 units = 1 hour)
 *
 * Examples:
 * - 3 lecture units = 3 teaching hours
 * - 2.25 lab units = 2.25 / 0.75 = 3 teaching hours
 * - 1.5 lab units = 1.5 / 0.75 = 2 teaching hours
 */

export const LECTURE_UNIT_TO_HOURS_RATIO = 1;
export const LAB_HOURS_TO_UNIT_RATIO = 0.75; // 1 hour = 0.75 units

/**
 * Convert lecture units to teaching hours
 * Lecture uses 1:1 ratio
 */
export function calculateLectureHours(lectureUnits: number): number {
  return lectureUnits * LECTURE_UNIT_TO_HOURS_RATIO;
}

/**
 * Convert lab units to teaching hours
 * Lab uses 1:0.75 ratio (1 unit = 1.333... hours)
 */
export function calculateLabHours(labUnits: number): number {
  return labUnits / LAB_HOURS_TO_UNIT_RATIO;
}

/**
 * Convert teaching hours to lab units
 */
export function calculateLabUnitsFromHours(hours: number): number {
  return hours * LAB_HOURS_TO_UNIT_RATIO;
}

/**
 * Calculate total teaching hours from lecture and lab units
 */
export function calculateTotalTeachingHours(lectureUnits: number, labUnits: number): number {
  const lectureHours = calculateLectureHours(lectureUnits);
  const labHours = calculateLabHours(labUnits);
  return lectureHours + labHours;
}

/**
 * Get recommended time slot duration in hours based on schedule type and units
 */
export function getRecommendedDuration(
  scheduleType: 'lecture' | 'laboratory',
  units: number
): number {
  if (scheduleType === 'lecture') {
    return calculateLectureHours(units);
  } else {
    return calculateLabHours(units);
  }
}

/**
 * Format hours to HH:mm format
 */
export function hoursToTimeString(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calculate end time given start time and duration in hours
 */
export function calculateEndTime(startTime: string, durationHours: number): string {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = startMinutes + Math.round(durationHours * 60);

  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;

  return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
}

/**
 * Examples of teaching hours calculations:
 *
 * Lecture Examples:
 * - 3 lecture units = 3 hours
 * - 2 lecture units = 2 hours
 * - 1.5 lecture units = 1.5 hours (1 hour 30 minutes)
 *
 * Lab Examples:
 * - 2.25 lab units = 3 hours
 * - 1.5 lab units = 2 hours
 * - 3 lab units = 4 hours
 * - 0.75 lab units = 1 hour
 */

