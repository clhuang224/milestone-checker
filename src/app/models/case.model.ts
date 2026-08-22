export interface Case {
  id: string;
  label: string;
  createdOnISODate: string;
  /**
   * YYYY-MM-DD. Stores the birth date rather than an age, so the derived age can never go
   * stale — rules like 「四歲以上」 read `case.ageInMonths`, computed at evaluation time.
   */
  birthDateISO?: string;
  /**
   * Gestational age at birth, in weeks. Drives corrected age for preterm cases; leave unset for
   * a term birth, which is treated the same as no correction.
   */
  gestationalWeeks?: number;
  note?: string;
}

export interface RecordProfile {
  recordId: string;
  /** Key is a FindingDefinition id. */
  values: Record<string, boolean | number>;
  updatedOnISODate: string;
}
