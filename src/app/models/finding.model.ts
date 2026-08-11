export type CategoryId = 'language' | 'speech' | 'swallowing';
export type FindingKind = 'boolean' | 'number';

export interface FindingDefinition {
  id: string;
  categoryId: CategoryId;
  label: string;
  kind: FindingKind;
  /** Unit shown next to the value when kind === 'number', e.g. '分'. */
  unit?: string;
  /** Where this finding comes from. Required for real (non-placeholder) content. */
  sourceNote?: string;
}
