const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a strict YYYY-MM-DD, rejecting non-dates like 2026-02-31 that Date would roll over. */
function partsOf(iso: string): [number, number, number] | undefined {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    return undefined;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const rolled = new Date(Date.UTC(year, month - 1, day));
  if (
    rolled.getUTCFullYear() !== year ||
    rolled.getUTCMonth() !== month - 1 ||
    rolled.getUTCDate() !== day
  ) {
    return undefined;
  }
  return [year, month, day];
}

/**
 * Whole months between two dates, or undefined if either is not a valid date.
 *
 * Counted in calendar months rather than days/30 — a therapist writing 「8 歲 0 個月」 means the
 * birthday has come round 8 times, not that 2922 days have passed. A birthday later in the
 * current month has not happened yet, so that month does not count.
 */
export function ageInMonthsOn(birthDateISO: string, onDateISO: string): number | undefined {
  const birth = partsOf(birthDateISO);
  const on = partsOf(onDateISO);
  if (!birth || !on) {
    return undefined;
  }

  const months = (on[0] - birth[0]) * 12 + (on[1] - birth[1]);
  return on[2] < birth[2] ? months - 1 : months;
}

/** '8 歲 0 個月'. Empty for a negative age, which only happens on a mistyped future birth date. */
export function formatAgeInMonths(months: number): string {
  if (months < 0) {
    return '';
  }
  return `${Math.floor(months / 12)} 歲 ${months % 12} 個月`;
}

/** Today as YYYY-MM-DD in the local timezone — the default basis for 「現在幾歲」. */
export function todayISO(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
