import { describe, expect, it } from 'vitest';

import { ArticulationProbe, ManualProcessGroup } from '../../models/articulation-record.model';
import { SessionRecord } from '../../models/session-record.model';
import { RecordProfile, Case, CaseHearing, HearingStatus } from '../../models/case.model';
import { buildFacts } from './facts';

const TODAY = '2026-08-17';

function caseRecord(overrides: Partial<Case> = {}): Case {
  return {
    id: 'case-1',
    label: '小美',
    sex: 'female',
    createdOnISODate: '2026-08-01',
    ...overrides,
  };
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
    [],
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
    // 32 weeks against a 37-week term is 5 weeks early, about 1 month.
    expect(result.case.correctedAgeInMonths).toBe(17);
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

  it('leaves native languages out entirely when the question was never asked', () => {
    expect('nativeLanguages' in facts().case).toBe(false);
  });

  it('passes listed native language ids through', () => {
    expect(facts({ nativeLanguages: ['mandarin', 'taiwanese'] }).case.nativeLanguages).toEqual([
      'mandarin',
      'taiwanese',
    ]);
  });

  it('keeps an empty list when only typed languages were given, and drops the typed ones', () => {
    const result = facts({ nativeLanguages: [], otherNativeLanguages: ['日語'] });

    expect(result.case.nativeLanguages).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('日語');
  });

  describe('hearing', () => {
    function hearingFacts(hearing: CaseHearing) {
      const result = facts({ hearing }).case.hearing;
      if (!result) {
        throw new Error('buildFacts always emits case.hearing');
      }
      return result;
    }

    it('leaves all three hearing facts undefined when no hearing was recorded', () => {
      expect(facts().case.hearing).toEqual({
        leftNormal: undefined,
        rightNormal: undefined,
        betterEarNormal: undefined,
      });
    });

    it.each<[HearingStatus | undefined, boolean | undefined]>([
      [undefined, undefined],
      ['normal', true],
      ['abnormal', false],
      // Aided counts as non-normal, so the single-ear facts agree with betterEarNormal.
      ['aided', false],
    ])('projects a single ear recorded as %s to %s', (status, expected) => {
      expect(hearingFacts({ left: status }).leftNormal).toBe(expected);
      expect(hearingFacts({ right: status }).rightNormal).toBe(expected);
    });

    const anyEar: (HearingStatus | undefined)[] = [undefined, 'normal', 'abnormal', 'aided'];

    it.each(anyEar)(
      'reads the better ear as normal when the left is normal and the right is %s',
      (right) => {
        expect(hearingFacts({ left: 'normal', right }).betterEarNormal).toBe(true);
      },
    );

    it.each(anyEar)(
      'reads the better ear as normal when the right is normal and the left is %s',
      (left) => {
        expect(hearingFacts({ left, right: 'normal' }).betterEarNormal).toBe(true);
      },
    );

    it.each<[HearingStatus, HearingStatus]>([
      ['abnormal', 'abnormal'],
      ['abnormal', 'aided'],
      ['aided', 'abnormal'],
      ['aided', 'aided'],
    ])(
      'reads the better ear as not normal when both ears are non-normal (%s + %s)',
      (left, right) => {
        expect(hearingFacts({ left, right }).betterEarNormal).toBe(false);
      },
    );

    // The key cell: the unrecorded ear could be the better one, so this must not become false.
    it.each<HearingStatus>(['abnormal', 'aided'])(
      'leaves the better ear undefined when one ear is %s and the other unrecorded',
      (status) => {
        expect(hearingFacts({ left: status }).betterEarNormal).toBeUndefined();
        expect(hearingFacts({ right: status }).betterEarNormal).toBeUndefined();
      },
    );

    it('leaves the better ear undefined when neither ear is recorded', () => {
      expect(hearingFacts({}).betterEarNormal).toBeUndefined();
    });
  });
});
