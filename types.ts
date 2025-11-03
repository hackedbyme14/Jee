// types.ts

export interface CountdownTime {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export type ColorSchemeType = 'blue-ocean' | 'green-forest' | 'purple-haze' | 'red-ember';

export interface AppSettings {
  title: string;
  targetDate: string; // ISO string
  startDate: string; // ISO string
  showSeconds: boolean;
  useKolkataTimezone: boolean;
  baseTheme: 'dark'; // Base theme is now fixed to dark
  colorScheme: ColorSchemeType; // New property for accent color palette
  notificationReminders: number[]; // Array of reminder times in milliseconds (e.g., 7 days, 1 day, 1 hour)
  notificationEnabled: boolean;
}

// `Theme` type is no longer needed as `baseTheme` is fixed to 'dark'
// export type Theme = 'light' | 'dark'; 

export type NotificationPermission = 'granted' | 'denied' | 'default';

export enum ReminderOption {
  NONE = 0,
  ONE_HOUR = 1 * 60 * 60 * 1000,
  ONE_DAY = 24 * 60 * 60 * 1000,
  SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000, // Roughly a month
}