import { format, parse, isToday, isYesterday, startOfDay, endOfDay } from 'date-fns';

/**
 * Format date as YYYY-MM-DD for file names
 */
export function formatDateForFileName(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format date for display (e.g., "October 25, 2025")
 */
export function formatDateForDisplay(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Parse date from YYYY-MM-DD string
 */
export function parseDateFromFileName(dateString: string): Date {
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

/**
 * Parse time from HH:MM string
 */
export function parseTime(timeString: string): { hour: number; minute: number } | null {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

/**
 * Check if date is today
 */
export function isTodayDate(date: Date): boolean {
  return isToday(date);
}

/**
 * Check if date is yesterday
 */
export function isYesterdayDate(date: Date): boolean {
  return isYesterday(date);
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date): Date {
  return endOfDay(date);
}

/**
 * Get previous day
 */
export function getPreviousDay(date: Date): Date {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return previous;
}

/**
 * Get next day
 */
export function getNextDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Create time string from hour and minute
 */
export function createTimeString(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Generate array of time slots for timeline
 */
export function generateTimeSlots(startHour: number, endHour: number): Array<{ hour: number; minute: number; label: string }> {
  const slots: Array<{ hour: number; minute: number; label: string }> = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push({
      hour,
      minute: 0,
      label: createTimeString(hour, 0)
    });
  }

  return slots;
}

/**
 * Compare two dates (year, month, day only)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateForFileName(date1) === formatDateForFileName(date2);
}
