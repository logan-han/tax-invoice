import { describe, it, expect } from 'vitest';
import { addDays, daysBetween, formatHumanDate, isIsoDate, todayIso } from '../dates';

// vitest.config.ts runs the suite on Melbourne time.
describe('todayIso', () => {
  it('runs on Melbourne time', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Australia/Melbourne');
  });

  it('uses the local calendar day, not the UTC one', () => {
    // 9:30am on 10 Oct in Melbourne is still 9 Oct in UTC.
    const morning = new Date('2026-10-09T22:30:00Z');
    expect(morning.toISOString().slice(0, 10)).toBe('2026-10-09');
    expect(todayIso(morning)).toBe('2026-10-10');
  });

  it('pads single-digit months and days', () => {
    expect(todayIso(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('adds calendar days across month and year ends', () => {
    expect(addDays('2026-10-10', 30)).toBe('2026-11-09');
    expect(addDays('2026-12-20', 14)).toBe('2027-01-03');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('subtracts days', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is not shifted by a daylight saving change', () => {
    // Melbourne moved to daylight time on 4 Oct 2026.
    expect(addDays('2026-09-20', 30)).toBe('2026-10-20');
  });

  it('returns an empty string for a missing or invalid date', () => {
    expect(addDays('', 30)).toBe('');
    expect(addDays('2026-02-30', 1)).toBe('');
    expect(addDays('10/10/2026', 1)).toBe('');
  });
});

describe('daysBetween', () => {
  it('counts whole days between two dates', () => {
    expect(daysBetween('2026-10-10', '2026-11-09')).toBe(30);
    expect(daysBetween('2026-11-09', '2026-10-10')).toBe(-30);
    expect(daysBetween('2026-10-10', '2026-10-10')).toBe(0);
  });

  it('returns null when either date is invalid', () => {
    expect(daysBetween('', '2026-10-10')).toBeNull();
    expect(daysBetween('2026-10-10', 'soon')).toBeNull();
  });
});

describe('isIsoDate', () => {
  it('accepts real YYYY-MM-DD dates only', () => {
    expect(isIsoDate('2026-10-10')).toBe(true);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-1-1')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });
});

describe('formatHumanDate', () => {
  it('formats as day, short month and year', () => {
    expect(formatHumanDate('2026-11-08')).toBe('8 Nov 2026');
    expect(formatHumanDate('2025-01-15')).toBe('15 Jan 2025');
  });

  it('returns unparseable input unchanged', () => {
    expect(formatHumanDate('')).toBe('');
    expect(formatHumanDate('not-a-date')).toBe('not-a-date');
    expect(formatHumanDate('2025-13-01')).toBe('2025-13-01');
  });
});
