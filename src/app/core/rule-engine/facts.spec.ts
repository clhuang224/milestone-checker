import { describe, expect, it } from 'vitest';

import { ArticulationSubstitution } from '../../models/articulation-record.model';
import { Case, CaseProfile } from '../../models/case.model';
import { buildFacts } from './facts';

const TODAY = '2026-08-17';

function caseRecord(overrides: Partial<Case> = {}): Case {
  return { id: 'case-1', label: '小切', createdOnISODate: '2026-08-01', ...overrides };
}

function profile(values: CaseProfile['values'] = {}): CaseProfile {
  return { caseId: 'case-1', values, updatedOnISODate: TODAY };
}

function substitution(overrides: Partial<ArticulationSubstitution> = {}): ArticulationSubstitution {
  return {
    id: 'sub-1',
    caseId: 'case-1',
    targetPhonemeId: 'zh',
    processIds: [],
    examples: [],
    updatedOnISODate: TODAY,
    ...overrides,
  };
}

describe('buildFacts', () => {
  it('keeps finding values flat at the top level so existing rules still resolve', () => {
    const facts = buildFacts(
      caseRecord(),
      profile({ drooling: true, oralMotorScore: 35 }),
      [],
      TODAY,
    );

    expect(facts['drooling']).toBe(true);
    expect(facts['oralMotorScore']).toBe(35);
  });

  it('derives the age from the birth date', () => {
    const facts = buildFacts(caseRecord({ birthDateISO: '2018-08-17' }), profile(), [], TODAY);

    expect(facts.case.ageInMonths).toBe(96);
  });

  it('leaves the age undefined when there is no birth date', () => {
    expect(buildFacts(caseRecord(), profile(), [], TODAY).case.ageInMonths).toBeUndefined();
  });

  it('leaves the age undefined when the birth date is not a real date', () => {
    const facts = buildFacts(caseRecord({ birthDateISO: '2018-02-31' }), profile(), [], TODAY);

    expect(facts.case.ageInMonths).toBeUndefined();
  });

  it('collects substituted and diacritic-marked sounds as errors', () => {
    const facts = buildFacts(
      caseRecord(),
      profile(),
      [
        substitution({ id: 'a', targetPhonemeId: 'zh', errorPhonemeId: 'd' }),
        substitution({ id: 'b', targetPhonemeId: 'i', errorDiacritic: 'nasalized' }),
      ],
      TODAY,
    );

    expect(facts.articulation.errors).toHaveLength(2);
    expect(facts.articulation.errors[1]).toMatchObject({
      targetPhonemeId: 'i',
      diacritic: 'nasalized',
    });
  });

  it('leaves correct sounds out of the error list', () => {
    const facts = buildFacts(
      caseRecord(),
      profile(),
      [substitution({ id: 'ok', targetPhonemeId: 'b' })],
      TODAY,
    );

    expect(facts.articulation.errors).toEqual([]);
  });

  it('tags each error with the target sound category', () => {
    const facts = buildFacts(
      caseRecord(),
      profile(),
      [
        substitution({ id: 'a', targetPhonemeId: 'zh', errorPhonemeId: 'd' }),
        substitution({ id: 'b', targetPhonemeId: 'i', errorDiacritic: 'nasalized' }),
      ],
      TODAY,
    );

    expect(facts.articulation.errors[0].targetCategory).toBe('initial');
    expect(facts.articulation.errors[1].targetCategory).toBe('medial');
  });

  it('carries process tags through for applicability conditions', () => {
    const facts = buildFacts(
      caseRecord(),
      profile(),
      [substitution({ errorPhonemeId: 'd', processIds: ['stopping', 'backing'] })],
      TODAY,
    );

    expect(facts.articulation.errors[0].processIds).toEqual(['stopping', 'backing']);
  });
});
