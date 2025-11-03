// utils/dateUtils.ts
import { CountdownTime } from '../types';

export const TIMEZONE_KOLKATA = 'Asia/Kolkata';
export const TIMEZONE_BROWSER = Intl.DateTimeFormat().resolvedOptions().timeZone;

const MILLISECONDS_IN_SECOND = 1000;
const MILLISECONDS_IN_MINUTE = 60 * MILLISECONDS_IN_SECOND;
const MILLISECONDS_IN_HOUR = 60 * MILLISECONDS_IN_MINUTE;
const MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR;

/**
 * Calculates the remaining time until a target date.
 * @param targetDate The target Date object.
 * @param now The current Date object.
 * @returns An object containing total milliseconds, days, hours, minutes, seconds, and if the target is in the past.
 */
export function calculateCountdown(targetDate: Date, now: Date): CountdownTime {
  const totalMs = targetDate.getTime() - now.getTime();
  const isPast = totalMs < 0;
  const absTotalMs = Math.abs(totalMs);

  const days = Math.floor(absTotalMs / MILLISECONDS_IN_DAY);
  const hours = Math.floor((absTotalMs % MILLISECONDS_IN_DAY) / MILLISECONDS_IN_HOUR);
  const minutes = Math.floor((absTotalMs % MILLISECONDS_IN_HOUR) / MILLISECONDS_IN_MINUTE);
  const seconds = Math.floor((absTotalMs % MILLISECONDS_IN_MINUTE) / MILLISECONDS_IN_SECOND);

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isPast,
  };
}

/**
 * Formats the countdown time into DD : HH : MM : SS string.
 * @param countdown The CountdownTime object.
 * @param showSeconds Whether to include seconds in the output.
 * @returns Formatted time string.
 */
export function formatTime(countdown: CountdownTime, showSeconds: boolean): string {
  const { days, hours, minutes, seconds, isPast } = countdown;

  if (Math.abs(countdown.totalMs) < 1000 && !showSeconds) { // If less than a second, display 0s or passed message
    return isPast ? '00 : 00 : 00' : '00 : 00 : 00';
  }

  const sign = isPast && countdown.totalMs !== 0 ? '-' : '';
  const d = String(days).padStart(2, '0');
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');

  if (showSeconds) {
    return `${sign}${d} : ${h} : ${m} : ${s}`;
  } else {
    return `${sign}${d} : ${h} : ${m}`;
  }
}

/**
 * Formats the countdown time into a human-readable string.
 * @param countdown The CountdownTime object.
 * @returns Human-readable time string.
 */
export function formatHumanReadable(countdown: CountdownTime): string {
  const { days, hours, minutes, isPast, totalMs } = countdown;
  const absTotalMs = Math.abs(totalMs);

  if (absTotalMs < 1000) { // Less than 1 second
    return isPast ? 'Exam passed a moment ago.' : 'Less than a second remaining.';
  }

  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

  if (parts.length === 0) { // If only seconds remain or very short duration
    return isPast ? 'Exam passed.' : 'Less than a minute remaining.';
  }

  const formatted = parts.join(', ');
  return `${formatted} ${isPast ? 'ago' : 'remaining'}.`;
}

/**
 * Formats a Date object into a YYYY-MM-DDTHH:MM string for datetime-local input,
 * respecting a specified timezone.
 * @param date The Date object (assumed UTC internally).
 * @param timezone The target timezone string (e.g., 'Asia/Kolkata').
 * @returns Formatted string or empty string if date is invalid.
 */
export function getFormattedDateTimeLocal(date: Date, timezone: string): string {
  if (!date || isNaN(date.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  };

  try {
    const formatter = new Intl.DateTimeFormat('sv-SE', options); // 'sv-SE' (Swedish) ensures YYYY-MM-DD and 24h
    const parts = formatter.formatToParts(date);

    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;

    if (!year || !month || !day || !hour || !minute) {
      return '';
    }
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (error) {
    console.error('Error formatting date for datetime-local:', error);
    return '';
  }
}

/**
 * Parses a YYYY-MM-DDTHH:MM string, assuming it's in the specified timezone,
 * and returns a UTC Date object.
 * @param dateTimeLocalString The input string from datetime-local.
 * @param timezone The timezone the string is assumed to be in.
 * @returns A Date object representing the UTC instant, or an invalid Date if parsing fails.
 */
export function getUTCFromDateTimeLocalAndTz(dateTimeLocalString: string, timezone: string): Date {
  if (!dateTimeLocalString) return new Date(NaN);

  try {
    if (timezone === TIMEZONE_KOLKATA) {
      // For Asia/Kolkata, the offset is fixed at +05:30 (IST).
      // We can construct an ISO string with this explicit offset.
      // Date constructor will correctly parse ISO string with offset to UTC.
      const isoStringWithOffset = `${dateTimeLocalString}:00.000+05:30`;
      return new Date(isoStringWithOffset);
    } else { // Assume browser local timezone
      // `new Date(YYYY-MM-DDTHH:MM)` parses it as local time, which is desired for browser TZ.
      return new Date(dateTimeLocalString);
    }
  } catch (error) {
    console.error('Error parsing datetime-local string:', error);
    return new Date(NaN);
  }
}

/**
 * Validates if a given date string is a valid date according to the specified timezone.
 * @param dateString The date string to validate.
 * @param timezone The timezone to consider for validation.
 * @returns True if the date is valid, false otherwise.
 */
export function isValidDateInput(dateString: string, timezone: string): boolean {
  if (!dateString) return false;
  const date = getUTCFromDateTimeLocalAndTz(dateString, timezone);
  return !isNaN(date.getTime());
}
