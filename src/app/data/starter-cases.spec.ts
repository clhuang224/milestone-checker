import { describe, expect, it } from 'vitest';

import { derivedProcessGroups } from '../core/articulation/summary';
import { buildFacts } from '../core/rule-engine/facts';
import { evaluateCondition, evaluateRules } from '../core/rule-engine/json-logic';
import { findZhuyin } from './zhuyin-inventory';
import { STARTER_ARTICULATION_PROCESSES } from './starter-articulation-processes';
import { STARTER_RULES } from './starter-rules';
import { starterCaseSeed } from './starter-cases';

const TODAY = '2026-08-19';
const seed = starterCaseSeed(TODAY);

function factsFor(current = seed) {
  return buildFacts(
    current.caseRecord,
    current.record,
    current.profile,
    current.probes,
    derivedProcessGroups(current.probes),
    [],
  );
}

describe('starter case seed', () => {
  it('carries the sex the demo case is described with', () => {
    expect(seed.caseRecord.sex).toBe('female');
  });

  it('derives a birth date that reads as 8 years old on the seed date', () => {
    expect(seed.caseRecord.birthDateISO).toBe('2018-08-19');
    expect(factsFor().case.ageInMonths).toBe(96);
  });

  it('keeps the derived age stable whenever the seed runs', () => {
    expect(factsFor(starterCaseSeed('2031-01-05')).case.ageInMonths).toBe(96);
  });

  it('has unique probe ids all belonging to the demo case', () => {
    const ids = seed.probes.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const probe of seed.probes) {
      expect(probe.caseId).toBe(seed.caseRecord.id);
      expect(probe.recordId).toBe(seed.record.id);
    }
  });

  it('only targets zhuyin symbols that exist', () => {
    for (const probe of seed.probes) {
      expect(findZhuyin(probe.targetPhonemeId), probe.targetPhonemeId).toBeDefined();
    }
  });

  it('records at least one error for every probe', () => {
    expect(factsFor().articulation.errors.length).toBeGreaterThanOrEqual(seed.probes.length);
  });

  it('derives only processes that exist in the catalogue', () => {
    const known = new Set(STARTER_ARTICULATION_PROCESSES.map((p) => p.id));

    for (const group of derivedProcessGroups(seed.probes)) {
      expect(known.has(group.processId), group.processId).toBe(true);
    }
  });

  it('derives the processes the demo exists to show', () => {
    const derived = derivedProcessGroups(seed.probes).map((g) => g.processId);

    expect(derived).toContain('stopping');
    expect(derived).toContain('vowelNasalization');
  });

  it('triggers the articulation therapy referral rule', () => {
    const rule = STARTER_RULES.find((r) => r.id === 'rule-articulation-therapy-referral');

    expect(evaluateCondition(rule!.condition, factsFor())).toBe(true);
  });

  // Decision three (決定三) in openspec/changes/add-case-background-conditions/proposal.md:
  // the developer chose to keep this rule firing for a tone-only case. "Tone is record-only"
  // means the system derives nothing from tone errors; it does not mean a general articulation
  // rule must step around them. This is deliberate, not a change still waiting to be made. A
  // therapist who wants a rule to skip tones writes that exclusion in their own rule.
  it('still triggers the referral rule when the only errors are tone errors (decision three, kept on purpose)', () => {
    const toneOnly = {
      ...seed,
      probes: [
        {
          id: `${seed.caseRecord.id}-tone4`,
          caseId: seed.caseRecord.id,
          recordId: seed.record.id,
          targetPhonemeId: 'tone4',
          items: [
            { word: '炮', heard: 'ㄆㄠˊ' },
            { word: '', heard: '' },
            { word: '', heard: '' },
          ],
          updatedOnISODate: TODAY,
        },
      ],
    };
    const facts = factsFor(toneOnly);

    // Guard the premise: the case is past the rule's age bound and its only error is on a tone row.
    expect(facts.case.ageInMonths).toBe(96);
    expect(facts.articulation.errors.map((e) => e.targetPhonemeId)).toEqual(['tone4']);

    const fired = evaluateRules(STARTER_RULES, facts).map((r) => r.id);
    expect(fired).toContain('rule-articulation-therapy-referral');
  });
});
