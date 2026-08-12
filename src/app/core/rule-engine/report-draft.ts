import { Case, CaseProfile } from '../../models/case.model';
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
 * Supports two placeholders: `{{case.label}}` for the case's nickname, and
 * `{{value:findingId}}` for the recorded value of a specific finding.
 */
export function buildReportDraft(
  triggeredRules: Rule[],
  caseRecord: Case,
  values: CaseProfile['values'] = {},
): string {
  return triggeredRules
    .map((rule) => rule.action.reportTemplate)
    .filter((template): template is string => !!template)
    .map((template) =>
      template
        .replaceAll('{{case.label}}', caseRecord.label)
        .replace(VALUE_PLACEHOLDER, (_match, fieldId: string) => formatValue(values[fieldId])),
    )
    .join('\n\n');
}
