import { SessionRecord } from '../../models/session-record.model';
import { RecordProfile, Case } from '../../models/case.model';
import { Rule } from '../../models/rule.model';

const VALUE_PLACEHOLDER = /\{\{value:([\w-]+)\}\}/g;

function formatValue(value: boolean | number | undefined): string {
  if (value === undefined) {
    return '';
  }
  return typeof value === 'boolean' ? (value ? '是' : '否') : String(value);
}

/**
 * Joins the report templates of the triggered rules into one editable draft.
 *
 * Supports three placeholders: `{{case.label}}` for the case's nickname,
 * `{{assessment.date}}` for the date the assessment was carried out, and
 * `{{value:findingId}}` for the recorded value of a specific finding.
 */
export function buildReportDraft(
  triggeredRules: Rule[],
  caseRecord: Case,
  assessment: SessionRecord,
  values: RecordProfile['values'] = {},
): string {
  return triggeredRules
    .map((rule) => rule.action.reportTemplate)
    .filter((template): template is string => !!template)
    .map((template) =>
      template
        .replaceAll('{{case.label}}', caseRecord.label)
        .replaceAll('{{assessment.date}}', assessment.onISODate)
        .replace(VALUE_PLACEHOLDER, (_match, fieldId: string) => formatValue(values[fieldId])),
    )
    .join('\n\n');
}
