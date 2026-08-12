import { Case } from '../../models/case.model';
import { Rule } from '../../models/rule.model';

/** Joins the report templates of the triggered rules into one editable draft. */
export function buildReportDraft(triggeredRules: Rule[], caseRecord: Case): string {
  return triggeredRules
    .map((rule) => rule.action.reportTemplate)
    .filter((template): template is string => !!template)
    .map((template) => template.replaceAll('{{case.label}}', caseRecord.label))
    .join('\n\n');
}
