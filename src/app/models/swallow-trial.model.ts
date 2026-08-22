/**
 * 嗆咳頻率, recorded the two ways therapists actually work.
 *
 * Deliberately not a normal/abnormal flag: nobody never chokes, so 「有嗆咳」 on a case who
 * chokes once in thirty spoons says the opposite of what it looks like. What varies clinically
 * is the rate, so the rate is what is stored.
 */
export type SwallowOutcome = CountedOutcome | EstimatedOutcome;

export interface CountedOutcome {
  kind: 'counted';
  /**
   * A SwallowUnitDefinition id — 口／匙／次. Not hardcoded: a dropper trial counts 次 and a spoon
   * trial counts 口, and the wrong noun in a report is something the therapist has to fix by
   * hand every single time.
   */
  unitId: string;
  attempts: number;
  chokes: number;
  /**
   * 「三次之中嗆咳一次以下」 is a bound, not a tally. Kept so the report can reproduce what was
   * written; the derived rate treats the bound as if exact, which is the conservative reading.
   */
  comparison: OutcomeComparison;
}

/** Applies to the choke count: 「嗆咳一次以下」 is `lte`. */
export type OutcomeComparison = 'lt' | 'lte' | 'eq' | 'gte' | 'gt';

export interface EstimatedOutcome {
  kind: 'estimated';
  /**
   * 0–100, e.g. 90 for 「吞嚥成功率（不嗆咳）達 90%」. Stored as an estimate, because writing it
   * as 90/100 counted attempts would claim an effort that never happened.
   */
  successPercent: number;
}

export interface SwallowTrial {
  id: string;
  /**
   * Denormalised from the assessment on purpose — filtering by case is by far the most common
   * read. MUST match the `caseId` of `assessmentId`'s assessment; go through Storage rather
   * than assembling this by hand so the two cannot drift apart.
   */
  caseId: string;
  assessmentId: string;
  /** A ConsistencyDefinition id — 質地. */
  consistencyId: string;
  /**
   * 量, in cc. Optional because the discharge case has none to measure: 「以湯匙進食醫院果泥不
   * 嗆咳」 is a real trial with no volume. Rules comparing volume must guard against absence.
   */
  volumeCc?: number;
  outcome: SwallowOutcome;
  /** 情境與前置處置, e.g. 「冰檸檬棒刺激後」. */
  note?: string;
  updatedOnISODate: string;
}
