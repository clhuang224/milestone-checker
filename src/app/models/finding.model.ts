export type FindingKind = 'boolean' | 'number';

/**
 * One item on an itemList form.
 *
 * `id` stays globally unique and flat: rules — including ones a therapist has already exported
 * and shared — reference items as `{"var": "drooling"}`. Which form owns an item is an editing
 * and display fact, never part of the fact namespace.
 */
export interface FindingDefinition {
  id: string;
  label: string;
  kind: FindingKind;
  /** Unit shown next to the value when kind === 'number', e.g. '分'. */
  unit?: string;
  /** Where this finding comes from. */
  sourceNote?: string;
}
