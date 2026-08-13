export interface WordExample {
  /** 測試字詞, e.g. 「包」. */
  word: string;
  /** Optional free text, e.g. the sound actually heard: 「ㄆㄠ」. */
  note?: string;
}

export interface ArticulationSubstitution {
  id: string;
  caseId: string;
  /** A ZhuyinSymbol id — decides which row of the table this belongs to. */
  targetPhonemeId: string;
  /** Empty means the target sound is produced correctly (✓); set means it was substituted. */
  errorPhonemeId?: string;
  /** PhonologicalProcessDefinition ids, tagged by hand — the app never infers these. */
  processIds: string[];
  examples: WordExample[];
  updatedOnISODate: string;
}
