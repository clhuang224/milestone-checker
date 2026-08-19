export interface WordExample {
  /** 測試字詞, e.g. 「包」. */
  word: string;
  /** Optional free text, e.g. the sound actually heard: 「ㄆㄠ」. */
  note?: string;
}

/** An extra mark layered on the error sound, written as a superscript, e.g. 鼻音化 → 'ㄧⁿ'. */
export type ArticulationDiacritic = 'nasalized';

export interface ArticulationSubstitution {
  id: string;
  /**
   * Denormalised from the assessment on purpose — filtering by case is by far the most common
   * read. MUST match the `caseId` of `assessmentId`'s assessment; go through Storage rather
   * than assembling this by hand so the two cannot drift apart.
   */
  caseId: string;
  assessmentId: string;
  /** A ZhuyinSymbol id — decides which row of the table this belongs to. */
  targetPhonemeId: string;
  /** Set means the target sound was replaced by this one. */
  errorPhonemeId?: string;
  /**
   * Set means the sound carries an extra mark. Independent of `errorPhonemeId`: on its own it
   * means the target sound itself is marked (ㄧ→ㄧⁿ), and only when *both* are empty is the
   * sound counted as correct (✓). Use `substitutionLabel()` rather than testing these by hand.
   */
  errorDiacritic?: ArticulationDiacritic;
  /** PhonologicalProcessDefinition ids, tagged by hand — the app never infers these. */
  processIds: string[];
  examples: WordExample[];
  updatedOnISODate: string;
}
