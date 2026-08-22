/**
 * 質地. Shaped like PhonologicalProcessDefinition — therapist-editable, `builtin` separating
 * what ships from what they added.
 */
export interface ConsistencyDefinition {
  id: string;
  /** 治療師看到的名稱, e.g. 「清水」. */
  name: string;
  /**
   * Sort order, thinnest first. The only thing that makes 「比清水稠」 expressible at all —
   * without it a consistency condition can never be more than set membership.
   *
   * Whether a single thin→thick line is even adequate is an open question: 果凍／布丁／優格 may
   * belong to a different axis (cohesiveness) rather than a point on this one. See
   * references/open-questions.md.
   */
  order: number;
  builtin: boolean;
  sourceNote?: string;
}

/** 計次單位 — 口／匙／次. Separate catalogue so the two lists are edited apart. */
export interface SwallowUnitDefinition {
  id: string;
  name: string;
  builtin: boolean;
  sourceNote?: string;
}
