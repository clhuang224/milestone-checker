export interface PhonologicalProcessDefinition {
  id: string;
  /** 治療師看到的分類名稱, e.g. 「不送氣化」. */
  name: string;
  description?: string;
  /** true = ships with the app, false = added by the therapist. */
  builtin: boolean;
  /**
   * For builtin entries this flags them as unreviewed placeholders; for therapist-added
   * entries it records their own clinical rationale.
   */
  sourceNote?: string;
}
