import { describe, expect, it } from 'vitest';

import { Case } from '../../models/case.model';
import { Rule } from '../../models/rule.model';
import { buildReportDraft } from './report-draft';

const caseRecord: Case = { id: 'case-1', label: '個案 A', createdOnISODate: '2026-01-01' };

function ruleWith(reportTemplate: string | undefined): Rule {
  return {
    id: 'rule-1',
    name: 'rule',
    condition: { '==': [{ var: 'drooling' }, true] },
    action: { message: 'msg', severity: 'info', reportTemplate },
    enabled: true,
  };
}

describe('buildReportDraft', () => {
  it('joins report templates from multiple rules with a blank line', () => {
    const draft = buildReportDraft([ruleWith('第一段。'), ruleWith('第二段。')], caseRecord);

    expect(draft).toBe('第一段。\n\n第二段。');
  });

  it('skips rules without a reportTemplate', () => {
    const draft = buildReportDraft([ruleWith(undefined), ruleWith('唯一段落。')], caseRecord);

    expect(draft).toBe('唯一段落。');
  });

  it('substitutes {{case.label}}', () => {
    const draft = buildReportDraft([ruleWith('個案為 {{case.label}}。')], caseRecord);

    expect(draft).toBe('個案為 個案 A。');
  });

  it('returns an empty string when there are no triggered rules', () => {
    expect(buildReportDraft([], caseRecord)).toBe('');
  });

  it('substitutes {{value:fieldId}} with the recorded value', () => {
    const draft = buildReportDraft([ruleWith('分數為 {{value:oralMotorScore}} 分。')], caseRecord, {
      oralMotorScore: 42,
    });

    expect(draft).toBe('分數為 42 分。');
  });

  it('formats a boolean value as 是/否', () => {
    const draft = buildReportDraft([ruleWith('流口水:{{value:drooling}}')], caseRecord, {
      drooling: true,
    });

    expect(draft).toBe('流口水:是');
  });

  it('substitutes an unrecorded value placeholder with an empty string', () => {
    const draft = buildReportDraft(
      [ruleWith('分數為 {{value:oralMotorScore}} 分。')],
      caseRecord,
      {},
    );

    expect(draft).toBe('分數為  分。');
  });
});
