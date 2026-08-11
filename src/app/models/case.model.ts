export interface Case {
  id: string;
  label: string;
  createdOnISODate: string;
  note?: string;
}

export interface CaseProfile {
  caseId: string;
  /** Key is a FindingDefinition id. */
  values: Record<string, boolean | number>;
  updatedOnISODate: string;
}
