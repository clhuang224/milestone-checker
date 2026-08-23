import { describe, expect, it } from 'vitest';

import { ageInMonthsOn, correctedAgeInMonthsOn, formatAgeInMonths, todayISO } from './age';

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

/**
 * Thresholds are the developer's: term is 37 weeks, correction stops after 36 months.
 * See references/preterm-correction.md — these numbers are asserted, not derived, so a change
 * to either constant has to come here and be re-decided rather than quietly re-baselining.
 */
describe('correctedAgeInMonthsOn', () => {
  it('subtracts how early the birth was, against a 37-week term', () => {
    // 32 weeks is 5 weeks early, i.e. about 1 month
    expect(correctedAgeInMonthsOn('2025-02-17', 32, '2026-08-17')).toBe(17);
    expect(ageInMonthsOn('2025-02-17', '2026-08-17')).toBe(18);
  });

  it('treats 37 weeks as term, and corrects at 36', () => {
    expect(correctedAgeInMonthsOn('2025-02-17', 37, '2026-08-17')).toBe(18);
    expect(correctedAgeInMonthsOn('2025-02-17', 36, '2026-08-17')).toBe(18 - 0);
  });

  it('returns the chronological age for a full-term birth', () => {
    expect(correctedAgeInMonthsOn('2025-02-17', 40, '2026-08-17')).toBe(18);
    expect(correctedAgeInMonthsOn('2025-02-17', 41, '2026-08-17')).toBe(18);
  });

  it('returns the chronological age when prematurity was never recorded', () => {
    // Not undefined — a rule written against corrected age must still work for term children.
    expect(correctedAgeInMonthsOn('2025-02-17', undefined, '2026-08-17')).toBe(18);
  });

  it('stops correcting once the catch-up window has passed', () => {
    // 28 weeks is 2 months early, but at 5 years old that adjustment is no longer meaningful
    expect(correctedAgeInMonthsOn('2021-08-17', 28, '2026-08-17')).toBe(60);
  });

  it('still corrects just inside the 36-month cutoff, and stops just outside it', () => {
    // 28 weeks → 2 months of correction. Chronological 38 corrects to 36, which is still inside.
    expect(correctedAgeInMonthsOn('2023-06-17', 28, '2026-08-17')).toBe(36);
    // Chronological 39 would correct to 37, past the cutoff, so it falls back to chronological.
    expect(correctedAgeInMonthsOn('2023-05-17', 28, '2026-08-17')).toBe(39);
  });

  it('returns undefined for a birth date that is not real', () => {
    expect(correctedAgeInMonthsOn('2025-02-31', 32, '2026-08-17')).toBeUndefined();
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
