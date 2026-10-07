import { describe, expect, it } from 'vitest';

import { Case, NativeLanguageId, RecordProfile } from '../../models/case.model';
import { JsonLogicRule, Rule } from '../../models/rule.model';
import { SessionRecord } from '../../models/session-record.model';
import { ConditionNode, ConditionSetRow, toJsonLogic } from './condition-mapper';
import { ArticulationErrorFact, RuleFacts, buildFacts } from './facts';
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

describe('an unrecorded field only silences its own comparison', () => {
  const drooling = { '==': [{ var: 'drooling' }, true] };
  const overFour = { '>': [{ var: 'case.ageInMonths' }, 48] };
  const lowScore = { '<': [{ var: 'oralMotorScore' }, 40] };

  it('lets an or fire on the branch it can judge', () => {
    // The bug: the gate collected every comparison field in the tree and required all of them,
    // so a drooling case with no birth date silenced the whole rule.
    expect(evaluateCondition({ or: [overFour, drooling] }, profileWith({ drooling: true }))).toBe(
      true,
    );
  });

  it('does not let an unrecorded numeric branch carry an or on its own', () => {
    // The mirror image: null < 40 is true in JS, so evaluating the rule unguarded would fire on
    // a score nobody entered.
    expect(evaluateCondition({ or: [lowScore, drooling] }, profileWith({ drooling: false }))).toBe(
      false,
    );
  });

  it('still fails an and when any branch is unrecorded', () => {
    expect(evaluateCondition({ and: [overFour, drooling] }, profileWith({ drooling: true }))).toBe(
      false,
    );
  });

  it('still refuses a bare comparison on an unrecorded field', () => {
    expect(evaluateCondition(lowScore, profileWith({}))).toBe(false);
  });
});

/**
 * Native-language rows over the real path: a Case through buildFacts(), conditions compiled from
 * the editor's row model. No fact literal — the point is the difference between a case whose
 * native languages were never asked (no key in the facts) and one answered without the language.
 */
describe('native-language rows through buildFacts', () => {
  const ON_DATE = '2026-08-20';
  const record: SessionRecord = {
    id: 'record-1',
    caseId: 'case-1',
    onISODate: ON_DATE,
    formIds: [],
  };
  const profile: RecordProfile = {
    recordId: 'record-1',
    values: { drooling: true },
    updatedOnISODate: ON_DATE,
  };

  function factsFor(languages: Pick<Case, 'nativeLanguages' | 'otherNativeLanguages'>): RuleFacts {
    const caseRecord: Case = {
      id: 'case-1',
      label: '個案 A',
      sex: 'female',
      createdOnISODate: '2026-08-01',
      ...languages,
    };
    return buildFacts(caseRecord, record, profile, [], [], []);
  }

  function languageRow(
    mode: ConditionSetRow['mode'],
    values: NativeLanguageId[] = ['taiwanese'],
  ): ConditionSetRow {
    return { type: 'set', subject: 'nativeLanguage', mode, values };
  }

  function fires(node: ConditionNode, facts: RuleFacts): boolean {
    const condition: JsonLogicRule = toJsonLogic(node);
    return evaluateCondition(condition, facts);
  }

  // 「母語包含 台灣台語」 / 「母語排除 台灣台語」
  const includesTaiwanese = languageRow('includes');
  const excludesTaiwanese = languageRow('excludes');

  it('fires neither includes nor excludes when the question was never asked', () => {
    const facts = factsFor({});

    expect(fires(includesTaiwanese, facts)).toBe(false);
    expect(fires(excludesTaiwanese, facts)).toBe(false);
  });

  it('fires excludes, not includes, once answered without the language', () => {
    // The observable difference from "never asked": an answer of 華語 leaves a language once
    // 台灣台語 is set aside, so the existential exclude fires here and not above.
    const facts = factsFor({ nativeLanguages: ['mandarin'] });

    expect(fires(includesTaiwanese, facts)).toBe(false);
    expect(fires(excludesTaiwanese, facts)).toBe(true);
  });

  it('fires includes once answered with the language', () => {
    expect(fires(includesTaiwanese, factsFor({ nativeLanguages: ['taiwanese', 'mandarin'] }))).toBe(
      true,
    );
  });

  it('judges a typed-only answer as an empty list rather than as unanswered', () => {
    // Typed languages never reach the facts, but the answer does: the key is present as [], which
    // is what the guard checks. The outcome cannot tell judged from skipped here — the condition
    // model has no negation, and `some` over [] is false for includes and excludes alike, the
    // same as the forced-false clause — so this pins the precondition plus the judged answer.
    const facts = factsFor({ nativeLanguages: [], otherNativeLanguages: ['日語'] });

    expect(facts.case).toHaveProperty('nativeLanguages', []);
    expect(fires(includesTaiwanese, facts)).toBe(false);
    expect(fires(excludesTaiwanese, facts)).toBe(false);
  });

  it('does not let an unanswered language row block a sibling or-branch', () => {
    const drooling: ConditionNode = {
      type: 'row',
      fieldId: 'drooling',
      operator: '==',
      value: true,
    };
    const facts = factsFor({});

    expect(
      fires({ type: 'group', combinator: 'or', children: [includesTaiwanese, drooling] }, facts),
    ).toBe(true);
    expect(
      fires({ type: 'group', combinator: 'and', children: [excludesTaiwanese, drooling] }, facts),
    ).toBe(false);
  });

  it('leaves articulation set rows unguarded: no errors is judged, not missing', () => {
    // 「構音錯誤目標音 包含 ㄅ」 on a case with no errors: false because nothing matched. An or
    // with a true sibling still fires, so the row did not silence anything around it.
    const targetB: ConditionSetRow = {
      type: 'set',
      subject: 'articulationTarget',
      mode: 'includes',
      values: ['b'],
    };
    const drooling: ConditionNode = {
      type: 'row',
      fieldId: 'drooling',
      operator: '==',
      value: true,
    };
    const facts = factsFor({});

    expect(fires(targetB, facts)).toBe(false);
    expect(fires({ type: 'group', combinator: 'or', children: [targetB, drooling] }, facts)).toBe(
      true,
    );
  });
});
