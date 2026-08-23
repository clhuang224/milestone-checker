import { describe, expect, it } from 'vitest';

import { ConditionNode, fromJsonLogic } from '../core/rule-engine/condition-mapper';
import { AGE_FIELD_ID } from '../core/rule-engine/facts';
import { evaluateCondition } from '../core/rule-engine/json-logic';
import { STARTER_FINDINGS } from './starter-findings';
import { STARTER_RULES } from './starter-rules';

function fieldIdsIn(node: ConditionNode): string[] {
  if (node.type === 'row') {
    return [node.fieldId];
  }
  // Applicability rows reference phoneme/process ids, not findings.
  return node.type === 'set' || node.type === 'trial' ? [] : node.children.flatMap(fieldIdsIn);
}

describe('starter content', () => {
  it('has unique finding ids', () => {
    const ids = STARTER_FINDINGS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique rule ids', () => {
    const ids = STARTER_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references finding ids that actually exist, using conditions the rule editor can parse', () => {
    const findingIds = new Set(STARTER_FINDINGS.map((f) => f.id));

    for (const rule of STARTER_RULES) {
      const node = fromJsonLogic(rule.condition);
      for (const fieldId of fieldIdsIn(node)) {
        // Case attributes are derived facts, not findings.
        if (fieldId === AGE_FIELD_ID) {
          continue;
        }
        expect(findingIds.has(fieldId)).toBe(true);
      }
    }
  });

  it('evaluates every rule condition without throwing against an empty profile', () => {
    for (const rule of STARTER_RULES) {
      expect(() =>
        evaluateCondition(rule.condition, {
          case: {},
          articulation: { errors: [] },
          swallowing: { trials: [] },
        }),
      ).not.toThrow();
    }
  });

  describe('the articulation therapy referral rule', () => {
    const rule = STARTER_RULES.find((r) => r.id === 'rule-articulation-therapy-referral');

    function facts(ageInMonths: number | undefined, targetPhonemeIds: string[]) {
      return {
        case: { ageInMonths },
        articulation: {
          errors: targetPhonemeIds.map((targetPhonemeId) => ({ targetPhonemeId, processIds: [] })),
        },
        swallowing: { trials: [] },
      };
    }

    it('exists', () => {
      expect(rule).toBeDefined();
    });

    it('fires for an 8-year-old whose errors go beyond the retroflex sounds', () => {
      // 小美: ㄓ→ㄉ, ㄔ→ㄎ are retroflex targets, but ㄘ→ㄎ and the nasalized ㄧ/ㄨ are not.
      expect(evaluateCondition(rule!.condition, facts(96, ['zh', 'ch', 'c', 'i', 'u']))).toBe(true);
    });

    it('does not fire when only the retroflex sounds are in error', () => {
      expect(evaluateCondition(rule!.condition, facts(96, ['zh', 'ch', 'sh', 'r']))).toBe(false);
    });

    it('does not fire below the age threshold', () => {
      expect(evaluateCondition(rule!.condition, facts(36, ['c']))).toBe(false);
    });

    it('does not fire when the case has no birth date', () => {
      expect(evaluateCondition(rule!.condition, facts(undefined, ['c']))).toBe(false);
    });

    it('does not fire when the articulation table is empty', () => {
      expect(evaluateCondition(rule!.condition, facts(96, []))).toBe(false);
    });
  });

  it('does not fire any rule against a case with nothing recorded', () => {
    for (const rule of STARTER_RULES) {
      expect(
        evaluateCondition(rule.condition, {
          case: {},
          articulation: { errors: [] },
          swallowing: { trials: [] },
        }),
      ).toBe(false);
    }
  });
});
