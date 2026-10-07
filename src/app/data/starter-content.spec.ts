import { describe, expect, it } from 'vitest';

import { derivedProcessGroups } from '../core/articulation/summary';
import { ConditionNode, fromJsonLogic } from '../core/rule-engine/condition-mapper';
import { AGE_FIELD_ID, buildFacts } from '../core/rule-engine/facts';
import { evaluateCondition, evaluateRules } from '../core/rule-engine/json-logic';
import { starterCaseSeed } from './starter-cases';
import { Case } from '../models/case.model';
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

  // Firing for the demo case is asserted in starter-cases.spec.ts; not repeated here.
  describe('the Taiwanese dialect influence demo rule', () => {
    const RULE_ID = 'rule-taiwanese-dialect-influence-demo';
    const rule = STARTER_RULES.find((r) => r.id === RULE_ID);

    it('exists with severity info', () => {
      expect(rule).toBeDefined();
      expect(rule!.action.severity).toBe('info');
    });

    // rule-editor.ts calls fromJsonLogic() with no fallback, so a shape it cannot read would break
    // the editor for this shipped rule.
    it('reads back into the editor as an AND of a native-language row and a target-sound row', () => {
      let node: ConditionNode | undefined;
      expect(() => {
        node = fromJsonLogic(rule!.condition);
      }).not.toThrow();

      expect(node).toEqual({
        type: 'group',
        combinator: 'and',
        children: [
          { type: 'set', subject: 'nativeLanguage', mode: 'includes', values: ['taiwanese'] },
          {
            type: 'set',
            subject: 'articulationTarget',
            mode: 'includes',
            values: ['sh', 'f', 'yu'],
          },
        ],
      });
    });

    it('does not fire for a case with no native language or hearing filled in, even with an error on ㄕ', () => {
      const seed = starterCaseSeed('2026-08-19');
      // Only the fields the Case type requires; no birth date, native language or hearing.
      const blankCase: Case = {
        id: seed.caseRecord.id,
        label: seed.caseRecord.label,
        createdOnISODate: seed.caseRecord.createdOnISODate,
        sex: seed.caseRecord.sex,
      };
      const probes = seed.probes.filter((p) => p.targetPhonemeId === 'sh');
      const facts = buildFacts(
        blankCase,
        seed.record,
        seed.profile,
        probes,
        derivedProcessGroups(probes),
        [],
      );

      // Guard the premise: the ㄕ error is there and the native language was never asked.
      expect(facts.articulation.errors.map((e) => e.targetPhonemeId)).toContain('sh');
      expect('nativeLanguages' in facts.case).toBe(false);

      expect(evaluateRules(STARTER_RULES, facts).map((r) => r.id)).not.toContain(RULE_ID);
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
