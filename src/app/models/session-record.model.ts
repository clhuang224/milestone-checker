/**
 * 課節紀錄 — one visit. Findings, articulation and swallowing hang off this rather than off the
 * case directly, so a case has a history and each set of results keeps the date it was collected.
 *
 * There is deliberately no 'assessment' | 'treatment' field. That distinction is expressed by
 * which forms are attached: a SOAP note makes it a treatment record, an articulation form makes
 * it an assessment, and both together means the visit was both — which is common, and needs no
 * special case this way.
 */
export interface SessionRecord {
  id: string;
  caseId: string;
  /** YYYY-MM-DD — the day of the session, not the day this record was created. */
  onISODate: string;
  /**
   * Attached forms, at least one. Chosen when the record is created and editable afterwards via
   * `Storage.setRecordForms()`, which discards whatever was recorded under a form being detached.
   */
  formIds: string[];
  note?: string;
}

/** What kind of content a form holds, which decides its screen and the facts it contributes. */
export type FormBody =
  | { kind: 'articulationGrid' }
  | { kind: 'soapNote' }
  | { kind: 'swallowTrials' }
  | { kind: 'itemList' };

/**
 * 評估表 — a catalogue entry.
 *
 * `itemList` forms are data: a therapist can add one without code. The others are instruments
 * with their own input and their own derivation, so they are code, and the catalogue entry only
 * makes them reachable the same way as everything else. Do not grow `itemList` until it could
 * express the articulation grid — that is how this design fails.
 */
export interface AssessmentFormDefinition {
  id: string;
  name: string;
  body: FormBody;
  builtin: boolean;
}

/** A report draft, stored per record so edits survive leaving the page. */
export interface ReportDraftRecord {
  recordId: string;
  text: string;
}
