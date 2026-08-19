import { describe, expect, it } from 'vitest';

import { ArticulationSubstitution } from '../../models/articulation-record.model';
import { Assessment } from '../../models/assessment.model';
import { AssessmentProfile, Case } from '../../models/case.model';
import { buildFacts } from './facts';

const TODAY = '2026-08-17';

function caseRecord(overrides: Partial<Case> = {}): Case {
  return { id: 'case-1', label: '小切', createdOnISODate: '2026-08-01', ...overrides };
}

function profile(values: AssessmentProfile['values'] = {}): AssessmentProfile {
  return { assessmentId: 'assessment-1', values, updatedOnISODate: TODAY };
}

function assessmentOn(dateISO = TODAY): Assessment {
  return { id: 'assessment-1', caseId: 'case-1', assessedOnISODate: dateISO };
}

function substitution(overrides: Partial<ArticulationSubstitution> = {}): ArticulationSubstitution {
  return {
    id: 'sub-1',
    caseId: 'case-1',
    assessmentId: 'assessment-1',
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
      assessmentOn(),
      profile({ drooling: true, oralMotorScore: 35 }),
      [],
    );

    expect(facts['drooling']).toBe(true);
    expect(facts['oralMotorScore']).toBe(35);
  });

  it('ages the case at the assessment date, not at the date the report is written', () => {
    const born = caseRecord({ birthDateISO: '2022-09-05' });

    // Assessed one day before the fourth birthday, written up a fortnight later.
    const atAssessment = buildFacts(born, assessmentOn('2026-09-04'), profile(), []);
    const ifItUsedToday = buildFacts(born, assessmentOn('2026-09-19'), profile(), []);

    expect(atAssessment.case.ageInMonths).toBe(47);
    expect(ifItUsedToday.case.ageInMonths).toBe(48);
  });

  it('exposes corrected age alongside chronological for a preterm case', () => {
    const preterm = caseRecord({ birthDateISO: '2025-02-17', gestationalWeeks: 32 });
    const facts = buildFacts(preterm, assessmentOn('2026-08-17'), profile(), []);

    expect(facts.case.ageInMonths).toBe(18);
    expect(facts.case.correctedAgeInMonths).toBe(16);
  });

  it('reports corrected age equal to chronological for a term case', () => {
    const term = caseRecord({ birthDateISO: '2025-02-17' });
    const facts = buildFacts(term, assessmentOn('2026-08-17'), profile(), []);

    expect(facts.case.correctedAgeInMonths).toBe(facts.case.ageInMonths);
  });

  it('derives the age from the birth date', () => {
    const facts = buildFacts(
      caseRecord({ birthDateISO: '2018-08-17' }),
      assessmentOn(),
      profile(),
      [],
    );

    expect(facts.case.ageInMonths).toBe(96);
  });

  it('leaves the age undefined when there is no birth date', () => {
    expect(
      buildFacts(caseRecord(), assessmentOn(), profile(), []).case.ageInMonths,
    ).toBeUndefined();
  });

  it('leaves the age undefined when the birth date is not a real date', () => {
    const facts = buildFacts(
      caseRecord({ birthDateISO: '2018-02-31' }),
      assessmentOn(),
      profile(),
      [],
    );

    expect(facts.case.ageInMonths).toBeUndefined();
  });

  it('collects substituted and diacritic-marked sounds as errors', () => {
    const facts = buildFacts(caseRecord(), assessmentOn(), profile(), [
      substitution({ id: 'a', targetPhonemeId: 'zh', errorPhonemeId: 'd' }),
      substitution({ id: 'b', targetPhonemeId: 'i', errorDiacritic: 'nasalized' }),
    ]);

    expect(facts.articulation.errors).toHaveLength(2);
    expect(facts.articulation.errors[1]).toMatchObject({
      targetPhonemeId: 'i',
      diacritic: 'nasalized',
    });
  });

  it('leaves correct sounds out of the error list', () => {
    const facts = buildFacts(caseRecord(), assessmentOn(), profile(), [
      substitution({ id: 'ok', targetPhonemeId: 'b' }),
    ]);

    expect(facts.articulation.errors).toEqual([]);
  });

  it('tags each error with the target sound category', () => {
    const facts = buildFacts(caseRecord(), assessmentOn(), profile(), [
      substitution({ id: 'a', targetPhonemeId: 'zh', errorPhonemeId: 'd' }),
      substitution({ id: 'b', targetPhonemeId: 'i', errorDiacritic: 'nasalized' }),
    ]);

    expect(facts.articulation.errors[0].targetCategory).toBe('initial');
    expect(facts.articulation.errors[1].targetCategory).toBe('medial');
  });

  it('carries process tags through for applicability conditions', () => {
    const facts = buildFacts(caseRecord(), assessmentOn(), profile(), [
      substitution({ errorPhonemeId: 'd', processIds: ['stopping', 'backing'] }),
    ]);

    expect(facts.articulation.errors[0].processIds).toEqual(['stopping', 'backing']);
  });
});
