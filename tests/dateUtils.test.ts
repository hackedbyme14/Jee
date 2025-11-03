// tests/dateUtils.test.ts
// Fix: Explicitly import Jest globals for better type and runtime resolution.
import { describe, it, expect } from '@jest/globals';
import { calculateCountdown, formatTime, formatHumanReadable, getFormattedDateTimeLocal, getUTCFromDateTimeLocalAndTz, TIMEZONE_KOLKATA, TIMEZONE_BROWSER } from '../utils/dateUtils';
import { CountdownTime } from '../types';

describe('dateUtils', () => {
  // Mock current date for consistent testing
  const MOCK_NOW_MS = new Date('2025-01-01T12:00:00.000Z').getTime();
  const MOCK_NOW = new Date(MOCK_NOW_MS);

  describe('calculateCountdown', () => {
    it('should correctly calculate countdown for a future date', () => {
      const targetDate = new Date(MOCK_NOW_MS + 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 6 + 1000 * 7); // 5 days, 6 minutes, 7 seconds in future
      const countdown = calculateCountdown(targetDate, MOCK_NOW);

      expect(countdown.totalMs).toBeGreaterThan(0);
      expect(countdown.days).toBe(5);
      expect(countdown.hours).toBe(0); // Not explicitly set hours, so it should be 0 from remainder
      expect(countdown.minutes).toBe(6);
      expect(countdown.seconds).toBe(7);
      expect(countdown.isPast).toBe(false);
    });

    it('should correctly calculate countdown for a past date', () => {
      const targetDate = new Date(MOCK_NOW_MS - (1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 3)); // 2 days, 3 minutes in past
      const countdown = calculateCountdown(targetDate, MOCK_NOW);

      expect(countdown.totalMs).toBeLessThan(0);
      expect(countdown.days).toBe(2);
      expect(countdown.hours).toBe(0);
      expect(countdown.minutes).toBe(3);
      expect(countdown.seconds).toBe(0);
      expect(countdown.isPast).toBe(true);
    });

    it('should return zero for target date equal to now', () => {
      const targetDate = new Date(MOCK_NOW_MS);
      const countdown = calculateCountdown(targetDate, MOCK_NOW);

      expect(countdown.totalMs).toBe(0);
      expect(countdown.days).toBe(0);
      expect(countdown.hours).toBe(0);
      expect(countdown.minutes).toBe(0);
      expect(countdown.seconds).toBe(0);
      expect(countdown.isPast).toBe(false); // Or true, depending on interpretation, but 0 is okay
    });

    it('should handle fractional seconds correctly (rounds down)', () => {
      const targetDate = new Date(MOCK_NOW_MS + 1000 * 5 + 500); // 5.5 seconds
      const countdown = calculateCountdown(targetDate, MOCK_NOW);
      expect(countdown.seconds).toBe(5);
    });

    it('should handle large durations', () => {
      const targetDate = new Date('2026-01-01T00:00:00.000Z');
      const now = new Date('2025-01-01T00:00:00.000Z');
      const countdown = calculateCountdown(targetDate, now);
      expect(countdown.days).toBe(366); // 2024 is a leap year, so 2025-01-01 to 2026-01-01 is 366 days
      expect(countdown.hours).toBe(0);
      expect(countdown.minutes).toBe(0);
      expect(countdown.seconds).toBe(0);
    });
  });

  describe('formatTime', () => {
    const createCountdown = (days: number, hours: number, minutes: number, seconds: number, isPast: boolean, totalMs = 0): CountdownTime => ({
      totalMs,
      days,
      hours,
      minutes,
      seconds,
      isPast,
    });

    it('should format future time with seconds', () => {
      const countdown = createCountdown(10, 5, 23, 45, false);
      expect(formatTime(countdown, true)).toBe('10 : 05 : 23 : 45');
    });

    it('should format future time without seconds', () => {
      const countdown = createCountdown(10, 5, 23, 45, false);
      expect(formatTime(countdown, false)).toBe('10 : 05 : 23');
    });

    it('should format past time with seconds', () => {
      const countdown = createCountdown(2, 1, 10, 30, true, -100000000);
      expect(formatTime(countdown, true)).toBe('-02 : 01 : 10 : 30');
    });

    it('should format past time without seconds', () => {
      const countdown = createCountdown(2, 1, 10, 30, true, -100000000);
      expect(formatTime(countdown, false)).toBe('-02 : 01 : 10');
    });

    it('should handle single digit numbers with leading zeros', () => {
      const countdown = createCountdown(1, 2, 3, 4, false);
      expect(formatTime(countdown, true)).toBe('01 : 02 : 03 : 04');
    });

    it('should show 00:00:00 when totalMs is 0', () => {
      const countdown = createCountdown(0, 0, 0, 0, false, 0);
      expect(formatTime(countdown, true)).toBe('00 : 00 : 00 : 00');
    });
  });

  describe('formatHumanReadable', () => {
    const createCountdown = (days: number, hours: number, minutes: number, seconds: number, isPast: boolean, totalMs = 0): CountdownTime => ({
      totalMs,
      days,
      hours,
      minutes,
      seconds,
      isPast,
    });

    it('should format future time correctly', () => {
      const countdown = createCountdown(5, 6, 7, 8, false, MOCK_NOW_MS + 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 6 + 1000 * 7);
      expect(formatHumanReadable(countdown)).toBe('5 days, 6 hours, 7 minutes remaining.');
    });

    it('should format past time correctly', () => {
      const countdown = createCountdown(2, 3, 4, 5, true, -MOCK_NOW_MS);
      expect(formatHumanReadable(countdown)).toBe('2 days, 3 hours, 4 minutes ago.');
    });

    it('should handle single unit correctly', () => {
      expect(formatHumanReadable(createCountdown(1, 0, 0, 0, false))).toBe('1 day remaining.');
      expect(formatHumanReadable(createCountdown(0, 1, 0, 0, false))).toBe('1 hour remaining.');
      expect(formatHumanReadable(createCountdown(0, 0, 1, 0, false))).toBe('1 minute remaining.');
    });

    it('should handle less than a minute remaining', () => {
      expect(formatHumanReadable(createCountdown(0, 0, 0, 30, false, 30000))).toBe('Less than a minute remaining.');
      expect(formatHumanReadable(createCountdown(0, 0, 0, 5, false, 5000))).toBe('Less than a minute remaining.');
    });

    it('should handle less than a second remaining', () => {
      expect(formatHumanReadable(createCountdown(0, 0, 0, 0, false, 500))).toBe('Less than a second remaining.');
    });

    it('should handle exam passed a moment ago', () => {
      expect(formatHumanReadable(createCountdown(0, 0, 0, 0, true, -500))).toBe('Exam passed a moment ago.');
    });

    it('should handle exam passed without full duration', () => {
      expect(formatHumanReadable(createCountdown(0, 0, 0, 0, true, -100000))).toBe('Exam passed.');
    });
  });

  describe('getFormattedDateTimeLocal', () => {
    it('should format a UTC date to browser local datetime-local string', () => {
      const date = new Date('2025-01-15T10:30:00.000Z'); // This is UTC
      // The expected output depends on the browser's local timezone
      // For example, if browser is PST (GMT-0800), this would be 2025-01-15T02:30
      // We can't predict exact value without knowing local TZ, but ensure format is correct.
      const formatted = getFormattedDateTimeLocal(date, TIMEZONE_BROWSER);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should format a UTC date to Asia/Kolkata datetime-local string', () => {
      const date = new Date('2025-01-15T10:30:00.000Z'); // This is UTC
      const expectedKolkata = '2025-01-15T16:00'; // 10:30 UTC + 5:30 = 16:00 IST
      const formatted = getFormattedDateTimeLocal(date, TIMEZONE_KOLKATA);
      expect(formatted).toBe(expectedKolkata);
    });

    it('should return empty string for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(getFormattedDateTimeLocal(invalidDate, TIMEZONE_KOLKATA)).toBe('');
    });
  });

  describe('getUTCFromDateTimeLocalAndTz', () => {
    // Note: These tests depend on the system's timezone. Running in a consistent environment is key.
    // For browser timezone, `new Date(dateTimeLocalString)` implicitly uses browser's local time.
    // For 'Asia/Kolkata', we manually add the fixed offset +05:30.

    it('should parse datetime-local string for Asia/Kolkata to correct UTC Date', () => {
      const kolkataLocalString = '2025-01-15T16:00'; // 4 PM IST
      const expectedUTC = new Date('2025-01-15T10:30:00.000Z'); // 4 PM IST is 10:30 AM UTC
      const parsedDate = getUTCFromDateTimeLocalAndTz(kolkataLocalString, TIMEZONE_KOLKATA);
      expect(parsedDate.toISOString()).toBe(expectedUTC.toISOString());
    });

    it('should parse datetime-local string for browser timezone to correct UTC Date', () => {
      // This test is tricky because it depends on the environment's timezone.
      // We'll create a date, format it in browser's local time, then parse it back.
      // This ensures the round trip works.
      const initialUTC = new Date('2025-01-15T10:30:00.000Z');
      const browserLocalString = getFormattedDateTimeLocal(initialUTC, TIMEZONE_BROWSER);
      const parsedDate = getUTCFromDateTimeLocalAndTz(browserLocalString, TIMEZONE_BROWSER);

      // It should parse back to the original UTC instant
      expect(parsedDate.toISOString()).toBe(initialUTC.toISOString());
    });

    it('should return invalid Date for empty string', () => {
      const parsedDate = getUTCFromDateTimeLocalAndTz('', TIMEZONE_KOLKATA);
      expect(isNaN(parsedDate.getTime())).toBe(true);
    });

    it('should return invalid Date for invalid string', () => {
      const parsedDate = getUTCFromDateTimeLocalAndTz('not-a-date', TIMEZONE_KOLKATA);
      expect(isNaN(parsedDate.getTime())).toBe(true);
    });
  });
});