import { describe, expect, it } from 'vitest';

import { Rule } from '../../models/rule.model';
import { ArticulationErrorFact, RuleFacts } from './facts';
import { evaluateCondition, evaluateRules } from './json-logic';

function profileWith(
  values: Record<string, boolean | number>,
  extra: Partial<RuleFacts> = {},
): RuleFacts {
  return {
    ...values,
    case: {},
    articulation: { errors: [] },
    swallowing: { trials: [] },
    ...extra,
  };
}

function factsWithErrors(errors: Partial<ArticulationErrorFact>[]): RuleFacts {
  return profileWith(
    {},
    {
      articulation: {
        errors: errors.map((error) => ({ targetPhonemeId: 'p', processIds: [], ...error })),
      },
    },
  );
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

  it('does not fire a "less than" threshold rule when the field was never recorded', () => {
    // Regression test: json-logic-js resolves a missing { var } to null, and `null < 40` is
    // `true` in JS, so an unset score used to look identical to "0, which is below 40".
    const condition = { '<': [{ var: 'oralMotorScore' }, 40] };

    expect(evaluateCondition(condition, profileWith({}))).toBe(false);
  });

  it('still fires a "less than" threshold rule once the field is actually recorded', () => {
    const condition = { '<': [{ var: 'oralMotorScore' }, 40] };

    expect(evaluateCondition(condition, profileWith({ oralMotorScore: 10 }))).toBe(true);
    expect(evaluateCondition(condition, profileWith({ oralMotorScore: 50 }))).toBe(false);
  });
});

describe('evaluateCondition with case age', () => {
  const overFour = { '>': [{ var: 'case.ageInMonths' }, 48] };

  it('resolves a dotted path into the case namespace', () => {
    expect(evaluateCondition(overFour, profileWith({}, { case: { ageInMonths: 96 } }))).toBe(true);
    expect(evaluateCondition(overFour, profileWith({}, { case: { ageInMonths: 36 } }))).toBe(false);
  });

  it('does not fire when the case has no birth date', () => {
    expect(evaluateCondition(overFour, profileWith({}, { case: {} }))).toBe(false);
  });
});

describe('evaluateCondition with applicability rows', () => {
  // 「有 ㄓㄔㄕㄖ 以外的構音錯誤」
  const errorsBeyondRetroflex = {
    some: [
      { var: 'articulation.errors' },
      { '!': { in: [{ var: 'targetPhonemeId' }, ['zh', 'ch', 'sh', 'r']] } },
    ],
  };

  it('fires when an error remains after setting the excluded sounds aside', () => {
    const facts = factsWithErrors([{ targetPhonemeId: 'zh' }, { targetPhonemeId: 'c' }]);

    expect(evaluateCondition(errorsBeyondRetroflex, facts)).toBe(true);
  });

  it('does not fire when only the excluded sounds are in error', () => {
    const facts = factsWithErrors([{ targetPhonemeId: 'zh' }, { targetPhonemeId: 'ch' }]);

    expect(evaluateCondition(errorsBeyondRetroflex, facts)).toBe(false);
  });

  it('does not fire when nothing is recorded, rather than treating empty as a match', () => {
    expect(evaluateCondition(errorsBeyondRetroflex, factsWithErrors([]))).toBe(false);
  });

  it('matches a process tag through the nested some', () => {
    const condition = {
      some: [
        { var: 'articulation.errors' },
        { some: [{ var: 'processIds' }, { in: [{ var: '' }, ['vowelNasalization']] }] },
      ],
    };

    expect(evaluateCondition(condition, factsWithErrors([{ processIds: ['stopping'] }]))).toBe(
      false,
    );
    expect(
      evaluateCondition(condition, factsWithErrors([{ processIds: ['vowelNasalization'] }])),
    ).toBe(true);
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
