export interface Case {
  id: string;
  label: string;
  createdOnISODate: string;
  /**
   * YYYY-MM-DD. Stores the birth date rather than an age, so the derived age can never go
   * stale — rules like 「四歲以上」 read `case.ageInMonths`, computed at evaluation time.
   */
  birthDateISO?: string;
  note?: string;
}

export interface CaseProfile {
  caseId: string;
  /** Key is a FindingDefinition id. */
  values: Record<string, boolean | number>;
  updatedOnISODate: string;
}
