// App.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSettings, CountdownTime, NotificationPermission, ColorSchemeType, ReminderOption } from './types';
import {
  calculateCountdown,
  formatTime,
  formatHumanReadable,
  getFormattedDateTimeLocal,
  getUTCFromDateTimeLocalAndTz,
  isValidDateInput,
  TIMEZONE_KOLKATA,
} from './utils/dateUtils';
import { loadSettings, saveSettings } from './utils/localStorageUtils';
import { getDailyQuote } from './utils/quoteUtils';
// import ThemeToggle from './components/ThemeToggle'; // Removed
import ToggleSwitch from './components/ToggleSwitch';
import ProgressBar from './components/ProgressBar';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_TARGET_DATE_ISO = '2026-01-21T00:00:00.000+05:30'; // January 21, 2026 00:00:00 IST

// Define color schemes and their corresponding CSS variable values
const colorSchemeMap: Record<ColorSchemeType, {
  accentPrimary: string;
  accentSubtle: string;
  buttonFrom: string;
  buttonTo: string;
  focusRing: string;
}> = {
  'blue-ocean': {
    accentPrimary: '#60a5fa', // blue-400
    accentSubtle: '#93c5fd', // blue-300
    buttonFrom: '#2563eb', // blue-600
    buttonTo: '#06b6d4', // cyan-500
    focusRing: '#3b82f6', // blue-500
  },
  'green-forest': {
    accentPrimary: '#4ade80', // green-400
    accentSubtle: '#86efad', // green-300
    buttonFrom: '#16a34a', // green-600
    buttonTo: '#22c55e', // green-500
    focusRing: '#22c55e', // green-500
  },
  'purple-haze': {
    accentPrimary: '#a78bfa', // purple-400
    accentSubtle: '#c4b5fd', // purple-300
    buttonFrom: '#7c3aed', // purple-600
    buttonTo: '#a855f7', // purple-500
    focusRing: '#a855f7', // purple-500
  },
  'red-ember': {
    accentPrimary: '#f87171', // red-400
    accentSubtle: '#fca5a5', // red-300
    buttonFrom: '#dc2626', // red-600
    buttonTo: '#ef4444', // red-500
    focusRing: '#ef4444', // red-500
  },
};


const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notificationAlert, setNotificationAlert] = useState<string | null>(null); // For in-app alerts
  const [showSettings, setShowSettings] = useState(false); // New state for settings panel visibility

  const timerRef = useRef<number | null>(null);
  const notificationTimersRef = useRef<number[]>([]);

  // Derived state for easier use
  // Enforce Kolkata timezone as per requirement
  const targetDate = new Date(settings.targetDate);
  const startDate = new Date(settings.startDate);
  const currentTZ = TIMEZONE_KOLKATA; // Fixed to Kolkata timezone

  // Derived daily quote, will re-calculate whenever `now` changes
  const currentDailyQuote = getDailyQuote(now);

  // --- Initial Load & Theme Effect ---
  // Apply baseTheme and colorScheme CSS variables
  useEffect(() => {
    // Ensure dark mode is applied. index.html handles initial 'dark' class.
    document.documentElement.classList.add('dark');

    // Apply color scheme CSS variables
    const scheme = colorSchemeMap[settings.colorScheme];
    const root = document.documentElement;
    if (root && scheme) {
      root.style.setProperty('--accent-primary', scheme.accentPrimary);
      root.style.setProperty('--accent-subtle', scheme.accentSubtle);
      root.style.setProperty('--button-gradient-from', scheme.buttonFrom);
      root.style.setProperty('--button-gradient-to', scheme.buttonTo);
      root.style.setProperty('--focus-ring-color', scheme.focusRing);
    }
  }, [settings.baseTheme, settings.colorScheme]); // Re-run if baseTheme or colorScheme changes

  // --- Persistence Effect ---
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // --- URL Param Parsing ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const titleParam = params.get('title');
    const targetParam = params.get('target');
    const startParam = params.get('start');
    const colorSchemeParam = params.get('colorScheme') as ColorSchemeType;


    if (titleParam || targetParam || startParam || colorSchemeParam) {
      setSettings(prev => ({
        ...prev,
        title: titleParam || prev.title,
        targetDate: targetParam || prev.targetDate,
        startDate: startParam || prev.startDate,
        useKolkataTimezone: true, // Enforce for shared configs too
        baseTheme: 'dark', // Enforce dark base theme for shared configs
        colorScheme: colorSchemeParam || prev.colorScheme, // Apply shared color scheme
      }));
      // Clear URL params after processing to avoid re-applying on refresh
      const newUrl = new URL(window.location.href);
      newUrl.search = '';
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, []); // Run only once on mount

  // --- Countdown Timer Effect ---
  useEffect(() => {
    const updateCountdown = () => {
      const currentTime = new Date();
      setNow(currentTime);
      const newCountdown = calculateCountdown(targetDate, currentTime);
      setCountdown(newCountdown);
    };

    // Initial update
    updateCountdown();

    // Set up interval, clear previous if any
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(updateCountdown, 1000);

    // Cleanup on component unmount or targetDate/startDate change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [settings.targetDate]); // Recalculate if target date changes

  // --- Notification Permission & Reminders ---
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('denied'); // Browser doesn't support notifications
      setNotificationAlert('Your browser does not support notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'denied') {
      setNotificationAlert('Notification permission denied. Please enable it in browser settings.');
    } else {
      setNotificationAlert(null);
    }
    setSettings(prev => ({ ...prev, notificationEnabled: permission === 'granted' }));
  }, []);

  const scheduleNotifications = useCallback(() => {
    // Clear any existing timers
    notificationTimersRef.current.forEach(clearTimeout);
    notificationTimersRef.current = [];

    if (!settings.notificationEnabled || notificationPermission !== 'granted' || countdown?.isPast) {
      return;
    }

    settings.notificationReminders.forEach(reminderOffset => {
      const reminderTime = targetDate.getTime() - reminderOffset;
      const nowMs = new Date().getTime();

      if (reminderTime > nowMs) {
        const timeout = reminderTime - nowMs;
        const timer = setTimeout(() => {
          const reminderDate = new Date(reminderTime);
          const timeUntil = calculateCountdown(targetDate, reminderDate);
          const humanReadable = formatHumanReadable(timeUntil);

          if (Notification.permission === 'granted') {
            new Notification(
              `JEE Exam Reminder: ${settings.title}`,
              {
                body: `${humanReadable} - The exam is approaching!`,
                icon: 'https://picsum.photos/64/64', // Placeholder icon
                requireInteraction: true,
              }
            );
          } else {
            // Fallback to in-app alert if permission changed or not granted
            setNotificationAlert(`Reminder: ${humanReadable} - ${settings.title} is approaching!`);
          }
        }, timeout);
        notificationTimersRef.current.push(timer);
      }
    });
  }, [settings.notificationEnabled, settings.notificationReminders, notificationPermission, targetDate, countdown?.isPast, settings.title]);

  useEffect(() => {
    if (settings.notificationEnabled && notificationPermission === 'default') {
      requestNotificationPermission();
    }
  }, [settings.notificationEnabled, notificationPermission, requestNotificationPermission]);

  useEffect(() => {
    scheduleNotifications();
  }, [scheduleNotifications, settings.notificationReminders, settings.targetDate, settings.notificationEnabled, notificationPermission]);

  // Cleanup notification timers on unmount
  useEffect(() => {
    return () => {
      notificationTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // --- Handlers ---
  const handleSettingsChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (isTarget: boolean, value: string) => {
    // Target date is now read-only, so this only applies to startDate
    if (!isTarget) {
      const date = getUTCFromDateTimeLocalAndTz(value, currentTZ);
      if (!isNaN(date.getTime())) {
        handleSettingsChange('startDate', date.toISOString());
      }
    }
  };

  const handleShare = () => {
    const shareUrl = new URL(window.location.origin);
    shareUrl.searchParams.set('title', settings.title);
    shareUrl.searchParams.set('target', targetDate.toISOString());
    shareUrl.searchParams.set('start', startDate.toISOString());
    shareUrl.searchParams.set('colorScheme', settings.colorScheme);


    navigator.clipboard.writeText(shareUrl.toString())
      .then(() => alert('Share link copied to clipboard!'))
      .catch((err) => console.error('Failed to copy share link:', err));
  };

  const handleReminderChange = (reminder: ReminderOption, isChecked: boolean) => {
    setSettings(prev => {
      const newReminders = isChecked
        ? [...new Set([...prev.notificationReminders, reminder])] // Add if not present
        : prev.notificationReminders.filter(r => r !== reminder); // Remove
      return { ...prev, notificationReminders: newReminders };
    });
  };

  // --- Render Logic ---
  const progressPercent = countdown && !countdown.isPast && startDate.getTime() < targetDate.getTime()
    ? ((now.getTime() - startDate.getTime()) / (targetDate.getTime() - startDate.getTime())) * 100
    : 0;

  // Target date input is read-only and fixed to DEFAULT_TARGET_DATE_ISO's date part
  const targetDateInputFormatted = getFormattedDateTimeLocal(new Date(DEFAULT_TARGET_DATE_ISO), currentTZ);
  const startDateInputFormatted = getFormattedDateTimeLocal(startDate, currentTZ);

  const isTargetDateValid = isValidDateInput(targetDateInputFormatted, currentTZ); // Should always be valid
  const isStartDateValid = isValidDateInput(startDateInputFormatted, currentTZ);

  // Main App Container
  return (
    <div className={`flex flex-col flex-grow items-center justify-center min-h-screen p-4
                    bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-gray-100`}>
      {/* Theme Toggle - Removed, color scheme selector now in settings */}
      {/* <div className="absolute top-4 right-4 z-10">
        <ThemeToggle theme={settings.baseTheme} onToggle={(newTheme) => handleSettingsChange('baseTheme', newTheme)} />
      </div> */}

      <main className="flex-grow flex flex-col items-center justify-center text-center w-full max-w-4xl px-4">
        {/* Hero Countdown Section */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--accent-primary)] mb-2">
          {settings.title}
        </h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-300 mb-6">
          {countdown?.isPast ? (
            'Exam Passed!'
          ) : (
            'Countdown'
          )}
        </h2>

        <div className="text-6xl md:text-8xl font-mono font-extrabold text-gray-100 mb-4" aria-live="polite" aria-atomic="true">
          {countdown ? formatTime(countdown, settings.showSeconds) : 'Loading...'}
        </div>
        <p className="text-lg md:text-xl text-[var(--accent-subtle)] mb-8">
          {countdown ? formatHumanReadable(countdown) : ''}
        </p>

        {/* Daily Motivational Quote */}
        <blockquote className="italic text-gray-400 text-md md:text-lg mb-8 max-w-2xl px-4">
          "{currentDailyQuote}"
        </blockquote>

        {countdown && !countdown.isPast && <ProgressBar progress={progressPercent} label="Time Elapsed" />}

        {notificationAlert && (
          <div className="bg-red-900/30 border-l-4 border-red-500 text-red-300 p-4 mb-4 w-full max-w-md rounded-md" role="alert">
            <p className="font-bold">Notification Alert:</p>
            <p>{notificationAlert}</p>
            {notificationPermission === 'denied' && (
              <button
                onClick={requestNotificationPermission}
                className="mt-2 text-sm text-red-400 hover:text-red-200 underline focus:outline-none"
              >
                Try to enable notifications
              </button>
            )}
          </div>
        )}

        {/* Settings Toggle Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="mt-10 mb-8 px-6 py-3 bg-gradient-to-r from-[var(--button-gradient-from)] to-[var(--button-gradient-to)] text-white font-semibold rounded-full shadow-lg shadow-[var(--focus-ring-color)]/30 hover:shadow-[var(--focus-ring-color)]/50 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)] focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-expanded={showSettings}
          aria-controls="settings-panel"
        >
          <span className="mr-2">⚙️</span> Settings
        </button>

        {/* Collapsible Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              id="settings-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full max-w-xl mx-auto overflow-hidden
                         bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl
                         shadow-xl shadow-[var(--focus-ring-color)]/10 p-6 md:p-8 text-left"
            >
              {/* Settings Group 1: Title + Target Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {/* Title Input */}
                <div>
                  <label htmlFor="title-input" className="block text-sm font-medium text-[var(--accent-primary)] mb-1">
                    Title / Label
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    value={settings.title}
                    onChange={(e) => handleSettingsChange('title', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-white/20 shadow-sm
                                 focus:border-[var(--focus-ring-color)] focus:ring-[var(--focus-ring-color)] bg-white/10 text-gray-100 placeholder-gray-500"
                    aria-label="Exam Title or Label"
                  />
                </div>

                {/* Target Date/Time Input (Read-only) */}
                <div>
                  <label htmlFor="target-date-input" className="block text-sm font-medium text-[var(--accent-primary)] mb-1">
                    Target Date & Time (Asia/Kolkata (IST))
                  </label>
                  <input
                    id="target-date-input"
                    type="datetime-local"
                    value={targetDateInputFormatted}
                    readOnly // Made read-only as per requirement
                    className="mt-1 block w-full rounded-md border border-white/20 shadow-sm cursor-not-allowed
                                 bg-white/10 text-gray-100 focus:outline-none"
                    aria-label="Target Date and Time"
                  />
                  {!isTargetDateValid && (
                    <p className="text-red-400 text-xs mt-1">Invalid target date.</p>
                  )}
                </div>
              </div>

              {/* Settings Group 2: Start Date + Show Seconds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10">
                {/* Start Date/Time Input */}
                <div>
                  <label htmlFor="start-date-input" className="block text-sm font-medium text-[var(--accent-primary)] mb-1">
                    Start Date & Time (Optional, for progress bar)
                  </label>
                  <input
                    id="start-date-input"
                    type="datetime-local"
                    value={startDateInputFormatted}
                    onChange={(e) => handleDateChange(false, e.target.value)}
                    className="mt-1 block w-full rounded-md border border-white/20 shadow-sm
                                 focus:border-[var(--focus-ring-color)] focus:ring-[var(--focus-ring-color)] bg-white/10 text-gray-100 placeholder-gray-500"
                    aria-label="Start Date and Time (optional)"
                  />
                  {!isStartDateValid && (
                    <p className="text-red-400 text-xs mt-1">Invalid start date.</p>
                  )}
                </div>

                {/* Toggle Seconds */}
                <div className="flex items-center self-end md:justify-end py-2">
                  <ToggleSwitch
                    id="toggle-seconds"
                    label="Show Seconds"
                    checked={settings.showSeconds}
                    onChange={(checked) => handleSettingsChange('showSeconds', checked)}
                  />
                </div>
              </div>

              {/* Settings Group 3: Color Scheme Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10">
                {/* Color Scheme Selector */}
                <div>
                  <label htmlFor="color-scheme-select" className="block text-sm font-medium text-[var(--accent-primary)] mb-1">
                    Accent Color Scheme
                  </label>
                  <select
                    id="color-scheme-select"
                    value={settings.colorScheme}
                    onChange={(e) => handleSettingsChange('colorScheme', e.target.value as ColorSchemeType)}
                    className="mt-1 block w-full rounded-md border border-white/20 shadow-sm
                                 focus:border-[var(--focus-ring-color)] focus:ring-[var(--focus-ring-color)] bg-white/10 text-gray-100 placeholder-gray-500
                                 appearance-none pr-8 cursor-pointer" // `appearance-none` for custom arrow
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23d1d5db' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em',
                    }}
                    aria-label="Select Accent Color Scheme"
                  >
                    <option value="blue-ocean">Blue Ocean</option>
                    <option value="green-forest">Green Forest</option>
                    <option value="purple-haze">Purple Haze</option>
                    <option value="red-ember">Red Ember</option>
                  </select>
                </div>

                {/* Notification Reminders */}
                <div>
                  <ToggleSwitch
                    id="toggle-notifications-enabled"
                    label="Enable Notifications"
                    checked={settings.notificationEnabled}
                    onChange={(checked) => {
                      handleSettingsChange('notificationEnabled', checked);
                      if (checked && notificationPermission !== 'granted') {
                        requestNotificationPermission();
                      }
                    }}
                  />
                  {settings.notificationEnabled && notificationPermission === 'granted' && (
                    <div className="mt-4 space-y-2 text-gray-300">
                      <p className="text-sm font-medium text-[var(--accent-subtle)]">Set Reminders:</p>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-[var(--button-gradient-from)] rounded bg-white/10 border-white/30"
                            checked={settings.notificationReminders.includes(ReminderOption.THIRTY_DAYS)}
                            onChange={() => handleReminderChange(ReminderOption.THIRTY_DAYS, !settings.notificationReminders.includes(ReminderOption.THIRTY_DAYS))}
                          />
                          <span className="ml-2">30 Days before</span>
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-[var(--button-gradient-from)] rounded bg-white/10 border-white/30"
                            checked={settings.notificationReminders.includes(ReminderOption.SEVEN_DAYS)}
                            onChange={() => handleReminderChange(ReminderOption.SEVEN_DAYS, !settings.notificationReminders.includes(ReminderOption.SEVEN_DAYS))}
                          />
                          <span className="ml-2">7 Days before</span>
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-[var(--button-gradient-from)] rounded bg-white/10 border-white/30"
                            checked={settings.notificationReminders.includes(ReminderOption.ONE_DAY)}
                            onChange={() => handleReminderChange(ReminderOption.ONE_DAY, !settings.notificationReminders.includes(ReminderOption.ONE_DAY))}
                          />
                          <span className="ml-2">1 Day before</span>
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-[var(--button-gradient-from)] rounded bg-white/10 border-white/30"
                            checked={settings.notificationReminders.includes(ReminderOption.ONE_HOUR)}
                            onChange={() => handleReminderChange(ReminderOption.ONE_HOUR, !settings.notificationReminders.includes(ReminderOption.ONE_HOUR))}
                          />
                          <span className="ml-2">1 Hour before</span>
                        </label>
                      </div>
                    </div>
                  )}
                  {settings.notificationEnabled && notificationPermission === 'denied' && (
                    <p className="text-red-400 text-xs mt-2">Notifications are blocked. Please enable them in your browser settings.</p>
                  )}
                  {settings.notificationEnabled && notificationPermission === 'default' && (
                    <p className="text-yellow-500 text-xs mt-2">Awaiting notification permission. Click 'Enable Notifications' again if prompted.</p>
                  )}
                </div>
              </div>


              {/* Share Configuration */}
              <div className="grid grid-cols-1 gap-6 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center self-end md:justify-end py-2">
                  <button
                    onClick={handleShare}
                    className="px-6 py-3 bg-gradient-to-r from-[var(--button-gradient-from)] to-[var(--button-gradient-to)] text-white font-semibold rounded-full
                                 shadow-lg shadow-[var(--focus-ring-color)]/30 hover:shadow-[var(--focus-ring-color)]/50 transition-all duration-300 ease-in-out
                                 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)] focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    Share Configuration
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-4xl mx-auto mt-8 p-4 text-center text-gray-500 text-sm">
        Built with ❤️ for JEE Aspirants. <span className="text-[var(--accent-primary)] font-bold ml-2">HTP DEV</span>
      </footer>
    </div>
  );
};

export default App;