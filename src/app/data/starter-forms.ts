import { AssessmentFormDefinition } from '../models/session-record.model';

/** The form that ships wired up. The others arrive with their own changes. */
export const ARTICULATION_FORM_ID = 'articulation';

export const STARTER_FORMS: AssessmentFormDefinition[] = [
  {
    id: ARTICULATION_FORM_ID,
    name: '構音評估表',
    body: { kind: 'articulationGrid' },
    builtin: true,
  },
];
