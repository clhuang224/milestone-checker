import { describe, expect, it } from 'vitest';

import {
  ConditionTrialRow,
  defaultTrialRow,
  fromJsonLogic,
  toJsonLogic,
} from '../rule-engine/condition-mapper';
import { RuleFacts, SwallowTrialFact } from '../rule-engine/facts';
import { evaluateCondition } from '../rule-engine/json-logic';

/** 「清水 3cc 以下會嗆咳」 */
const thinLiquidUnder3cc: ConditionTrialRow = {
  type: 'trial',
  consistencyIds: ['thinLiquid'],
  volume: { operator: '<=', cc: 3 },
  successPercent: { operator: '<', percent: 100 },
};

/**
 * Compilation-level facts. Whether Storage and buildFacts actually produce this shape is what
 * `rule-engine/trial-path.spec.ts` covers — it must, or these tests prove nothing.
 */
function factsWith(trials: SwallowTrialFact[]): RuleFacts {
  return {
    case: {},
    articulation: { errors: [] },
    swallowing: { trials },
  };
}

describe('trial conditions', () => {
  it('compiles to JsonLogic standard operators only', () => {
    expect(toJsonLogic(thinLiquidUnder3cc)).toEqual({
      some: [
        { var: 'swallowing.trials' },
        {
          and: [
            { in: [{ var: 'consistencyId' }, ['thinLiquid']] },
            { '!=': [{ var: 'volumeCc' }, null] },
            { '<=': [{ var: 'volumeCc' }, 3] },
            { '<': [{ var: 'successPercent' }, 100] },
          ],
        },
      ],
    });
  });

  it('round-trips through JsonLogic', () => {
    expect(fromJsonLogic(toJsonLogic(thinLiquidUnder3cc))).toEqual(thinLiquidUnder3cc);
  });

  it('round-trips a row that only tests consistency', () => {
    const row: ConditionTrialRow = { type: 'trial', consistencyIds: ['puree'] };

    expect(fromJsonLogic(toJsonLogic(row))).toEqual(row);
  });

  it('round-trips the default row', () => {
    expect(fromJsonLogic(toJsonLogic(defaultTrialRow()))).toEqual(defaultTrialRow());
  });

  it('still parses an articulation set row, which also compiles to some', () => {
    const setRow = {
      type: 'set' as const,
      subject: 'articulationTarget' as const,
      mode: 'excludes' as const,
      values: ['zh'],
    };

    expect(fromJsonLogic(toJsonLogic(setRow))).toEqual(setRow);
  });

  it('fires on a thin-liquid trial at 3cc that was choked', () => {
    const facts = factsWith([{ consistencyId: 'thinLiquid', volumeCc: 3, successPercent: 60 }]);

    expect(evaluateCondition(toJsonLogic(thinLiquidUnder3cc), facts)).toBe(true);
  });

  it('does not fire when nothing was choked', () => {
    const facts = factsWith([{ consistencyId: 'thinLiquid', volumeCc: 3, successPercent: 100 }]);

    expect(evaluateCondition(toJsonLogic(thinLiquidUnder3cc), facts)).toBe(false);
  });

  it('does not fire on a different consistency', () => {
    const facts = factsWith([{ consistencyId: 'puree', volumeCc: 3, successPercent: 0 }]);

    expect(evaluateCondition(toJsonLogic(thinLiquidUnder3cc), facts)).toBe(false);
  });

  it('does not fire on a trial with no volume recorded', () => {
    // The discharge case: a spoon of puree has nothing to measure. Without the null guard,
    // json-logic-js resolves the missing var to null and `null <= 3` is true in JS, so the
    // still-in-treatment warning would fire on exactly the case that no longer needs it.
    const facts = factsWith([{ consistencyId: 'thinLiquid', successPercent: 50 }]);

    expect(evaluateCondition(toJsonLogic(thinLiquidUnder3cc), facts)).toBe(false);
  });

  it('does not fire when no trials were recorded at all', () => {
    expect(evaluateCondition(toJsonLogic(thinLiquidUnder3cc), factsWith([]))).toBe(false);
  });

  it('matches nothing when every clause is empty, rather than everything', () => {
    // `and: []` is truthy in JsonLogic, so an empty row must compile to something false.
    const empty: ConditionTrialRow = { type: 'trial', consistencyIds: [] };
    const facts = factsWith([{ consistencyId: 'thinLiquid', volumeCc: 3, successPercent: 0 }]);

    expect(evaluateCondition(toJsonLogic(empty), facts)).toBe(false);
  });

  it('supports the whole comparison range on volume', () => {
    const facts = factsWith([{ consistencyId: 'thinLiquid', volumeCc: 10, successPercent: 50 }]);

    for (const [operator, cc, expected] of [
      ['>=', 10, true],
      ['>', 10, false],
      ['<', 20, true],
      ['==', 10, true],
    ] as const) {
      const row: ConditionTrialRow = {
        type: 'trial',
        consistencyIds: [],
        volume: { operator, cc },
      };
      expect(evaluateCondition(toJsonLogic(row), facts), `${operator} ${cc}`).toBe(expected);
    }
  });
});
