/** An extra mark layered on the error sound, written as a superscript, e.g. 鼻音化 → 'ㄧⁿ'. */
export type ArticulationDiacritic = 'nasalized';

export interface ProbeItem {
  /** 目標詞的國字, e.g. 「包」. */
  word: string;
  /**
   * 實際聽到的音, free text, e.g. 「ㄆㄠ」. Blank means the target sound was produced correctly.
   *
   * Free text so the therapist can write what they heard; `parseHeard()` pulls the first zhuyin
   * symbol out of it for derivation, and anything it cannot read is kept but not derived from.
   */
  heard: string;
}

export interface ArticulationProbe {
  id: string;
  /**
   * Denormalised from the assessment on purpose — filtering by case is by far the most common
   * read. MUST match the `caseId` of `assessmentId`'s assessment; go through Storage rather
   * than assembling this by hand so the two cannot drift apart.
   */
  caseId: string;
  assessmentId: string;
  /** A ZhuyinSymbol id — the row of the grid this belongs to. */
  targetPhonemeId: string;
  /** Fixed length; unused slots are left blank rather than removed. */
  items: ProbeItem[];
  updatedOnISODate: string;
}

/** How many 「目標詞 ＋ 錯音」 slots each sound gets. */
export const PROBE_ITEM_COUNT = 3;

export function emptyProbeItems(): ProbeItem[] {
  return Array.from({ length: PROBE_ITEM_COUNT }, () => ({ word: '', heard: '' }));
}

/**
 * The therapist's override of the derived phonological processes.
 *
 * Absent means "use the derived result" — no record is written just to say the default is in
 * force. The derived processes themselves are never stored: they are a function of the probes,
 * and storing them would only let the two drift apart.
 */
export interface PhonologicalSummary {
  assessmentId: string;
  useDerived: boolean;
  /** Only meaningful when `useDerived` is false. */
  manual: ManualProcessGroup[];
}

export interface ManualProcessGroup {
  processId: string;
  targetPhonemeIds: string[];
}
