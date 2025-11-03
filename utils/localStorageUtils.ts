// utils/localStorageUtils.ts
import { AppSettings, ColorSchemeType, ReminderOption } from '../types';
import { TIMEZONE_KOLKATA } from './dateUtils';

const STORAGE_KEY = 'jeeExamTrackerSettings';

const DEFAULT_TARGET_DATE_ISO = '2026-01-21T00:00:00.000+05:30'; // January 21, 2026 00:00:00 IST
const DEFAULT_START_DATE_ISO = new Date().toISOString(); // Default to now

/**
 * Loads application settings from localStorage.
 * @returns The loaded settings or default settings if none are found.
 */
export function loadSettings(): AppSettings {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      const parsedSettings: AppSettings = JSON.parse(storedSettings);
      // Ensure all keys exist and types are correct, provide defaults if missing
      return {
        title: parsedSettings.title ?? 'JEE Exam',
        targetDate: parsedSettings.targetDate ?? DEFAULT_TARGET_DATE_ISO,
        startDate: parsedSettings.startDate ?? DEFAULT_START_DATE_ISO,
        showSeconds: parsedSettings.showSeconds ?? true,
        useKolkataTimezone: true, // Always true as per new requirement
        baseTheme: 'dark', // Base theme is fixed to dark
        colorScheme: parsedSettings.colorScheme ?? 'blue-ocean', // Default color scheme
        notificationReminders: parsedSettings.notificationReminders ?? [ReminderOption.ONE_DAY, ReminderOption.ONE_HOUR],
        notificationEnabled: parsedSettings.notificationEnabled ?? false,
      };
    }
  } catch (e) {
    console.error("Failed to load settings from localStorage:", e);
  }
  // Return default settings if nothing is found or parsing fails
  return {
    title: 'JEE Exam',
    targetDate: DEFAULT_TARGET_DATE_ISO,
    startDate: DEFAULT_START_DATE_ISO,
    showSeconds: true,
    useKolkataTimezone: true, // Default to Kolkata timezone
    baseTheme: 'dark', // Default base theme to dark
    colorScheme: 'blue-ocean', // Default color scheme
    notificationReminders: [ReminderOption.ONE_DAY, ReminderOption.ONE_HOUR],
    notificationEnabled: false,
  };
}

/**
 * Saves application settings to localStorage.
 * @param settings The AppSettings object to save.
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings to localStorage:", e);
  }
}