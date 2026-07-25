import 'expo-sqlite/localStorage/install';

export type FocusPreferences = {
  breakMinutes: number;
  focusMinutes: number;
};

type DailyFocusSessions = {
  count: number;
  date: string;
};

const focusPreferencesKey = 'toothy-planner.focus.preferences.v1';
const dailyFocusSessionsKey = 'toothy-planner.focus.daily-sessions.v1';

export const defaultFocusPreferences: FocusPreferences = {
  breakMinutes: 5,
  focusMinutes: 25,
};

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function readStoredValue<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The timer still works when storage is unavailable.
  }
}

function isIntegerBetween(value: unknown, minimum: number, maximum: number): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum
  );
}

export function loadFocusPreferences(): FocusPreferences {
  const storedPreferences = readStoredValue<Partial<FocusPreferences>>(focusPreferencesKey);

  if (
    !storedPreferences ||
    !isIntegerBetween(storedPreferences.focusMinutes, 1, 180) ||
    !isIntegerBetween(storedPreferences.breakMinutes, 1, 60)
  ) {
    return defaultFocusPreferences;
  }

  return {
    breakMinutes: storedPreferences.breakMinutes,
    focusMinutes: storedPreferences.focusMinutes,
  };
}

export function saveFocusPreferences(preferences: FocusPreferences) {
  writeStoredValue(focusPreferencesKey, preferences);
}

export function loadTodayFocusSessions(date = new Date()) {
  const today = getLocalDateKey(date);
  const storedSessions = readStoredValue<Partial<DailyFocusSessions>>(dailyFocusSessionsKey);

  if (
    !storedSessions ||
    storedSessions.date !== today ||
    !isIntegerBetween(storedSessions.count, 0, Number.MAX_SAFE_INTEGER)
  ) {
    writeStoredValue<DailyFocusSessions>(dailyFocusSessionsKey, { count: 0, date: today });
    return 0;
  }

  return storedSessions.count;
}

export function saveTodayFocusSessions(count: number, date = new Date()) {
  writeStoredValue<DailyFocusSessions>(dailyFocusSessionsKey, {
    count: Math.max(0, Math.floor(count)),
    date: getLocalDateKey(date),
  });
}
