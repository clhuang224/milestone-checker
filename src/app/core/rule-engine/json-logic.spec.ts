import { describe, expect, it } from 'vitest';

import { CaseProfile } from '../../models/case.model';
import { Rule } from '../../models/rule.model';
import { evaluateCondition, evaluateRules } from './json-logic';

function profileWith(values: CaseProfile['values']): CaseProfile {
  return { caseId: 'case-1', values, updatedOnISODate: '2026-01-01' };
}

describe('evaluateCondition', () => {
  it('matches a boolean equality condition', () => {
    const condition = { '==': [{ var: 'drooling' }, true] };

    expect(evaluateCondition(condition, profileWith({ drooling: true }))).toBe(true);
    expect(evaluateCondition(condition, profileWith({ drooling: false }))).toBe(false);
  });

  it('matches a numeric threshold condition', () => {
    const condition = { '>': [{ var: 'oralMotorScore' }, 40] };

    expect(evaluateCondition(condition, profileWith({ oralMotorScore: 42 }))).toBe(true);
    expect(evaluateCondition(condition, profileWith({ oralMotorScore: 10 }))).toBe(false);
  });

  it('matches a mixed AND condition across boolean and numeric findings', () => {
    const condition = {
      and: [{ '==': [{ var: 'drooling' }, true] }, { '>': [{ var: 'oralMotorScore' }, 40] }],
    };

    expect(evaluateCondition(condition, profileWith({ drooling: true, oralMotorScore: 42 }))).toBe(
      true,
    );
    expect(evaluateCondition(condition, profileWith({ drooling: true, oralMotorScore: 10 }))).toBe(
      false,
    );
  });

  it('treats a missing finding as undefined rather than throwing', () => {
    const condition = { '==': [{ var: 'drooling' }, true] };

    expect(evaluateCondition(condition, profileWith({}))).toBe(false);
  });
});

describe('evaluateRules', () => {
  const droolingRule: Rule = {
    id: 'rule-drooling',
    name: '流口水警示',
    condition: { '==': [{ var: 'drooling' }, true] },
    action: { message: '建議進一步評估口腔動作', severity: 'warning' },
    enabled: true,
  };

  const disabledRule: Rule = {
    ...droolingRule,
    id: 'rule-disabled',
    enabled: false,
  };

  it('returns only enabled rules whose condition matches', () => {
    const triggered = evaluateRules([droolingRule, disabledRule], profileWith({ drooling: true }));

    expect(triggered).toEqual([droolingRule]);
  });

  it('returns an empty list when no rule matches', () => {
    const triggered = evaluateRules([droolingRule], profileWith({ drooling: false }));

    expect(triggered).toEqual([]);
  });
});
