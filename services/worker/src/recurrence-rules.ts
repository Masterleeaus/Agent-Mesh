export type MaintenanceFrequency = "monthly" | "quarterly" | "biannual" | "annual";

const FREQUENCY_MONTHS: Record<MaintenanceFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  annual: 12,
};

export function isMaintenanceFrequency(value: string): value is MaintenanceFrequency {
  return Object.prototype.hasOwnProperty.call(FREQUENCY_MONTHS, value);
}

function parseDateOnly(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid date-only value: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function daysInMonth(year: number, monthOneBased: number): number {
  return new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();
}

export function addRecurrencePeriod(dateOnly: string, frequency: MaintenanceFrequency): string {
  const { year, month, day } = parseDateOnly(dateOnly);
  const monthIndex = month - 1 + FREQUENCY_MONTHS[frequency];
  const nextYear = year + Math.floor(monthIndex / 12);
  const nextMonthIndex = ((monthIndex % 12) + 12) % 12;
  const nextMonth = nextMonthIndex + 1;
  const nextDay = Math.min(day, daysInMonth(nextYear, nextMonth));
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

/** Advance a recurrence until it is strictly after the supplied date. */
export function nextRecurrenceAfter(
  occurrenceDate: string,
  frequency: MaintenanceFrequency,
  afterDate: string,
): string {
  let next = addRecurrencePeriod(occurrenceDate, frequency);
  let guard = 0;
  while (next <= afterDate) {
    next = addRecurrencePeriod(next, frequency);
    guard += 1;
    if (guard > 240) throw new Error("Recurrence advancement exceeded safety limit");
  }
  return next;
}

export function utcDateOnly(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function scheduledWindowForDate(dateOnly: string): { start: string; end: string } {
  // Existing plan rows store a date rather than a time. Preserve that contract and
  // use a deterministic default field window; dispatch can reschedule normally.
  return {
    start: `${dateOnly}T09:00:00.000Z`,
    end: `${dateOnly}T10:00:00.000Z`,
  };
}
