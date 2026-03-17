interface IAvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

/**
 * Check if two time ranges overlap
 */
export const isOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  return (aStart < bEnd && bStart < aEnd);
};

/**
 * Check if there are overlapping time slots in availability array
 */
export const hasOverlap = (availability: IAvailabilitySlot[]): boolean => {
  const grouped = availability.reduce((acc, slot) => {
    acc[slot.day] = acc[slot.day] || [];
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<string, IAvailabilitySlot[]>);

  for (const day in grouped) {
    const slots = grouped[day];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (isOverlap(slots[i].startTime, slots[i].endTime, slots[j].startTime, slots[j].endTime)) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * Convert time string to minutes for easier comparison
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Check if start time is before end time
 */
export const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
};

/**
 * Get valid days of the week
 */
export const VALID_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
] as const;

/**
 * Check if day is valid
 */
export const isValidDay = (day: string): boolean => {
  return VALID_DAYS.includes(day as typeof VALID_DAYS[number]);
};

/**
 * Convert a 24-hour "HH:mm" string to 12-hour "h:mm AM/PM" format.
 * Internal storage and all calculations remain in 24-hour format;
 * this is used only for display/API responses.
 *
 * @example formatTime12h('08:00') // '8:00 AM'
 * @example formatTime12h('13:30') // '1:30 PM'
 */
export const formatTime12h = (time: string): string => {
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0)  hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
};