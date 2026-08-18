import { describe, expect, it } from 'vitest';

import { ageInMonthsOn, formatAgeInMonths, todayISO } from './age';

describe('ageInMonthsOn', () => {
  it('counts whole months between the two dates', () => {
    expect(ageInMonthsOn('2018-08-17', '2026-08-17')).toBe(96);
  });

  it('does not count a birthday that has not come round yet this month', () => {
    expect(ageInMonthsOn('2018-08-18', '2026-08-17')).toBe(95);
  });

  it('counts the month on the birthday itself', () => {
    expect(ageInMonthsOn('2018-08-17', '2026-09-16')).toBe(96);
    expect(ageInMonthsOn('2018-08-17', '2026-09-17')).toBe(97);
  });

  it('handles a birth date late in a longer month', () => {
    expect(ageInMonthsOn('2020-01-31', '2020-02-29')).toBe(0);
    expect(ageInMonthsOn('2020-01-31', '2020-03-31')).toBe(2);
  });

  it('returns a negative age for a future birth date rather than clamping', () => {
    expect(ageInMonthsOn('2027-01-01', '2026-08-17')).toBeLessThan(0);
  });

  it('rejects dates that are not real', () => {
    expect(ageInMonthsOn('2026-02-31', '2026-08-17')).toBeUndefined();
    expect(ageInMonthsOn('2026-13-01', '2026-08-17')).toBeUndefined();
  });

  it('rejects strings that are not YYYY-MM-DD', () => {
    expect(ageInMonthsOn('', '2026-08-17')).toBeUndefined();
    expect(ageInMonthsOn('2018/08/17', '2026-08-17')).toBeUndefined();
    expect(ageInMonthsOn('2018-08-17', 'not-a-date')).toBeUndefined();
  });
});

describe('formatAgeInMonths', () => {
  it('splits months into years and months', () => {
    expect(formatAgeInMonths(96)).toBe('8 歲 0 個月');
    expect(formatAgeInMonths(95)).toBe('7 歲 11 個月');
    expect(formatAgeInMonths(0)).toBe('0 歲 0 個月');
  });

  it('renders nothing for a negative age', () => {
    expect(formatAgeInMonths(-1)).toBe('');
  });
});

describe('todayISO', () => {
  it('produces a zero-padded date this helper can parse back', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ageInMonthsOn(todayISO(), todayISO())).toBe(0);
  });
});
