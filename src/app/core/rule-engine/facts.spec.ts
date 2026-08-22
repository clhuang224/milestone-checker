import { describe, expect, it } from 'vitest';

import { ArticulationProbe, ManualProcessGroup } from '../../models/articulation-record.model';
import { SessionRecord } from '../../models/session-record.model';
import { RecordProfile, Case } from '../../models/case.model';
import { buildFacts } from './facts';

const TODAY = '2026-08-17';

function caseRecord(overrides: Partial<Case> = {}): Case {
  return { id: 'case-1', label: '小切', createdOnISODate: '2026-08-01', ...overrides };
}

function profile(values: RecordProfile['values'] = {}): RecordProfile {
  return { recordId: 'assessment-1', values, updatedOnISODate: TODAY };
}

function assessmentOn(dateISO = TODAY): SessionRecord {
  return { id: 'assessment-1', caseId: 'case-1', onISODate: dateISO, formIds: ['articulation'] };
}

function probe(targetPhonemeId: string, heard: string): ArticulationProbe {
  return {
    id: `probe-${targetPhonemeId}`,
    caseId: 'case-1',
    recordId: 'assessment-1',
    targetPhonemeId,
    items: [{ word: '詞', heard }],
    updatedOnISODate: TODAY,
  };
}

function facts(
  caseOverrides: Partial<Case> = {},
  probes: ArticulationProbe[] = [],
  groups: ManualProcessGroup[] = [],
  dateISO = TODAY,
  values: RecordProfile['values'] = {},
) {
  return buildFacts(
    caseRecord(caseOverrides),
    assessmentOn(dateISO),
    profile(values),
    probes,
    groups,
  );
}

describe('buildFacts', () => {
  it('keeps finding values flat at the top level so existing rules still resolve', () => {
    const result = facts({}, [], [], TODAY, { drooling: true, oralMotorScore: 35 });

    expect(result['drooling']).toBe(true);
    expect(result['oralMotorScore']).toBe(35);
  });

  it('ages the case at the assessment date, not at the date the report is written', () => {
    // Assessed one day before the fourth birthday, written up a fortnight later.
    const born = { birthDateISO: '2022-09-05' };

    expect(facts(born, [], [], '2026-09-04').case.ageInMonths).toBe(47);
    expect(facts(born, [], [], '2026-09-19').case.ageInMonths).toBe(48);
  });

  it('exposes corrected age alongside chronological for a preterm case', () => {
    const result = facts({ birthDateISO: '2025-02-17', gestationalWeeks: 32 });

    expect(result.case.ageInMonths).toBe(18);
    expect(result.case.correctedAgeInMonths).toBe(16);
  });

  it('reports corrected age equal to chronological for a term case', () => {
    const result = facts({ birthDateISO: '2025-02-17' });

    expect(result.case.correctedAgeInMonths).toBe(result.case.ageInMonths);
  });

  it('leaves the age undefined when there is no birth date', () => {
    expect(facts().case.ageInMonths).toBeUndefined();
  });

  it('leaves the age undefined when the birth date is not a real date', () => {
    expect(facts({ birthDateISO: '2018-02-31' }).case.ageInMonths).toBeUndefined();
  });

  it('collects recorded errors, including diacritic-only ones', () => {
    const result = facts({}, [probe('zh', 'ㄉ'), probe('i', 'ㄧⁿ')]);

    expect(result.articulation.errors).toHaveLength(2);
    expect(result.articulation.errors[1]).toMatchObject({
      targetPhonemeId: 'i',
      diacritic: 'nasalized',
    });
  });

  it('leaves correctly produced sounds out of the error list', () => {
    expect(facts({}, [probe('b', '')]).articulation.errors).toEqual([]);
  });

  it('tags each error with the target sound category', () => {
    const result = facts({}, [probe('zh', 'ㄉ'), probe('i', 'ㄧⁿ')]);

    expect(result.articulation.errors[0].targetCategory).toBe('initial');
    expect(result.articulation.errors[1].targetCategory).toBe('medial');
  });

  it('takes process ids from the summary in force, not from the derivation', () => {
    // The therapist overrode the grouping; rules must fire on what they wrote.
    const groups: ManualProcessGroup[] = [
      { processId: 'somethingTheyChose', targetPhonemeIds: ['s'] },
    ];

    const result = facts({}, [probe('s', 'ㄉ')], groups);

    expect(result.articulation.errors[0].processIds).toEqual(['somethingTheyChose']);
  });

  it('keeps the error itself even when no process is attributed to it', () => {
    const result = facts({}, [probe('s', 'ㄉ')], []);

    expect(result.articulation.errors).toHaveLength(1);
    expect(result.articulation.errors[0].processIds).toEqual([]);
  });
});
