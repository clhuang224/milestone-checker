import { describe, expect, it } from 'vitest';

import { buildFacts } from '../core/rule-engine/facts';
import { evaluateCondition } from '../core/rule-engine/json-logic';
import { findZhuyin } from './zhuyin-inventory';
import { STARTER_ARTICULATION_PROCESSES } from './starter-articulation-processes';
import { STARTER_RULES } from './starter-rules';
import { starterCaseSeed } from './starter-cases';

const TODAY = '2026-08-19';
const seed = starterCaseSeed(TODAY);

describe('starter case seed', () => {
  it('derives a birth date that reads as 8 years old on the seed date', () => {
    expect(seed.caseRecord.birthDateISO).toBe('2018-08-19');

    const facts = buildFacts(seed.caseRecord, seed.profile, seed.substitutions, TODAY);
    expect(facts.case.ageInMonths).toBe(96);
  });

  it('keeps the derived age stable whenever the seed runs', () => {
    const later = starterCaseSeed('2031-01-05');
    const facts = buildFacts(later.caseRecord, later.profile, later.substitutions, '2031-01-05');

    expect(facts.case.ageInMonths).toBe(96);
  });

  it('has unique substitution ids all belonging to the demo case', () => {
    const ids = seed.substitutions.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const substitution of seed.substitutions) {
      expect(substitution.caseId).toBe(seed.caseRecord.id);
    }
  });

  it('only references zhuyin symbols that exist', () => {
    for (const substitution of seed.substitutions) {
      expect(findZhuyin(substitution.targetPhonemeId)).toBeDefined();
      if (substitution.errorPhonemeId) {
        expect(findZhuyin(substitution.errorPhonemeId)).toBeDefined();
      }
    }
  });

  it('only references phonological processes that exist', () => {
    const processIds = new Set(STARTER_ARTICULATION_PROCESSES.map((p) => p.id));

    for (const substitution of seed.substitutions) {
      for (const processId of substitution.processIds) {
        expect(processIds.has(processId)).toBe(true);
      }
    }
  });

  it('records every pair as an error, so none of them read as a ✓', () => {
    const facts = buildFacts(seed.caseRecord, seed.profile, seed.substitutions, TODAY);

    expect(facts.articulation.errors).toHaveLength(seed.substitutions.length);
  });

  it('triggers the articulation therapy referral rule', () => {
    const rule = STARTER_RULES.find((r) => r.id === 'rule-articulation-therapy-referral');
    const facts = buildFacts(seed.caseRecord, seed.profile, seed.substitutions, TODAY);

    expect(evaluateCondition(rule!.condition, facts)).toBe(true);
  });
});
