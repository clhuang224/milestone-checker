/**
 * One assessment session. Findings and articulation records hang off this rather than off the
 * case directly, so a case can be assessed more than once and each set of results keeps the
 * date it was actually collected on.
 */
export interface Assessment {
  id: string;
  caseId: string;
  /** YYYY-MM-DD — the day the assessment happened, not the day this record was created. */
  assessedOnISODate: string;
  note?: string;
}
