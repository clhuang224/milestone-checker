/** Which of IDDSI's two overlapping scales a level belongs to. Levels 3 and 4 are in both. */
export type ConsistencyGroup = 'drink' | 'food';

/**
 * 質地. Therapist-editable, `builtin` separating what ships from what they added.
 *
 * Only the level number and a short Chinese label are stored. IDDSI's full descriptors are
 * CC BY-SA 4.0 and explicitly may not be altered, so they are linked rather than copied — see
 * references/swallowing-consistencies.md.
 */
export interface ConsistencyDefinition {
  id: string;
  /** IDDSI level as written, e.g. '4' or '7EC'. A label, not a number: 7EC is not numeric. */
  level: string;
  /** 治療師看到的名稱, e.g. 「稀薄」. */
  name: string;
  /**
   * Both groups for the levels IDDSI shares between drinks and foods. Modelled as membership
   * rather than duplicated rows so the overlap stays visible instead of becoming two levels
   * that happen to share a number.
   */
  groups: ConsistencyGroup[];
  /**
   * Sort order, thinnest first. The only thing that makes 「比清水稠」 expressible at all —
   * without it a consistency condition can never be more than set membership.
   *
   * A single thin→thick line is a deliberate simplification: the literature treats texture as
   * multi-dimensional (hardness, cohesiveness, particle size…), and IDDSI collapses it to one
   * number for communication, not description. Hence the qualitative flags alongside it.
   */
  order: number;
  builtin: boolean;
  sourceNote?: string;
}

/**
 * 質性標記 — properties that are NOT a point on the thin→thick line.
 *
 * 果凍 is the case that forces this: a gelatin jelly changes texture on contact with saliva or
 * body heat, so it has no fixed level at all. Japan's JSDR scale splits the same axis apart with
 * its j/t letters, which is independent evidence that one ordering cannot carry it.
 */
export interface ConsistencyFlagDefinition {
  id: string;
  name: string;
  description?: string;
  builtin: boolean;
}

/** 計次單位 — 口／匙／次. Separate catalogue so the two lists are edited apart. */
export interface SwallowUnitDefinition {
  id: string;
  name: string;
  builtin: boolean;
  sourceNote?: string;
}
