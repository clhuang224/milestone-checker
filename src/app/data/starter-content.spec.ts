import { describe, expect, it } from 'vitest';

import { ConditionNode, fromJsonLogic } from '../core/rule-engine/condition-mapper';
import { evaluateCondition } from '../core/rule-engine/json-logic';
import { STARTER_FINDINGS } from './starter-findings';
import { STARTER_RULES } from './starter-rules';

function fieldIdsIn(node: ConditionNode): string[] {
  return node.type === 'row' ? [node.fieldId] : node.children.flatMap(fieldIdsIn);
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

  it('flags every finding and rule as a placeholder pending therapist review', () => {
    for (const finding of STARTER_FINDINGS) {
      expect(finding.sourceNote).toBeTruthy();
    }
    for (const rule of STARTER_RULES) {
      expect(rule.sourceNote).toBeTruthy();
    }
  });

  it('only references finding ids that actually exist, using conditions the rule editor can parse', () => {
    const findingIds = new Set(STARTER_FINDINGS.map((f) => f.id));

    for (const rule of STARTER_RULES) {
      const node = fromJsonLogic(rule.condition);
      for (const fieldId of fieldIdsIn(node)) {
        expect(findingIds.has(fieldId)).toBe(true);
      }
    }
  });

  it('evaluates every rule condition without throwing against an empty profile', () => {
    for (const rule of STARTER_RULES) {
      expect(() =>
        evaluateCondition(rule.condition, {
          caseId: 'case-test',
          values: {},
          updatedOnISODate: '2026-01-01',
        }),
      ).not.toThrow();
    }
  });
});
