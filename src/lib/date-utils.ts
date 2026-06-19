export function formatDateBr(date: string | Date) {
  const parsed = typeof date === 'string' ? parseDateOnly(date) : date;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

export function formatDateLongBr(date: string | Date) {
  const parsed = typeof date === 'string' ? parseDateOnly(date) : date;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
  }).format(parsed);
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

export function getClosestCalendarWeek(starts: string, weeks: number, referenceDate = new Date()) {
  const startDate = parseDateOnly(starts);
  const reference = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const diffInMs = reference.getTime() - startDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const calculatedWeek = Math.floor(diffInDays / 7) + 1;

  return Math.min(Math.max(calculatedWeek, 1), weeks);
}

export function getCalendarWeekEndDate(starts: string, week: number) {
  return addDays(parseDateOnly(starts), week * 7 - 1);
}

export function isOnOrAfterDate(date: Date, referenceDate = new Date()) {
  const reference = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  return reference.getTime() >= date.getTime();
}
