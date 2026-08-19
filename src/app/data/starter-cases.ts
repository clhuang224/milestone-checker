import { ArticulationSubstitution } from '../models/articulation-record.model';
import { Assessment } from '../models/assessment.model';
import { AssessmentProfile, Case } from '../models/case.model';

export interface StarterCaseSeed {
  caseRecord: Case;
  assessment: Assessment;
  profile: AssessmentProfile;
  substitutions: ArticulationSubstitution[];
}

const CASE_ID = 'demo-case-xiaoqie';
const ASSESSMENT_ID = 'demo-assessment-xiaoqie';

/** Subtracts whole years from an ISO date, keeping the month and day. */
function yearsBefore(onDateISO: string, years: number): string {
  const [year, rest] = [Number(onDateISO.slice(0, 4)), onDateISO.slice(4)];
  return `${year - years}${rest}`;
}

/**
 * A demo case, so a first-time user sees warnings and a report draft instead of empty lists.
 * Rewritten and simplified sample content — not a real case.
 *
 * The birth date is derived from `onDateISO` rather than hard-coded: a fixed date would make the
 * demo drift older every year, until 「8 歲」 no longer matches what the app shows.
 */
export function starterCaseSeed(onDateISO: string): StarterCaseSeed {
  const pair = (
    id: string,
    targetPhonemeId: string,
    rest: Partial<ArticulationSubstitution>,
  ): ArticulationSubstitution => ({
    id: `${CASE_ID}-${id}`,
    caseId: CASE_ID,
    assessmentId: ASSESSMENT_ID,
    targetPhonemeId,
    processIds: [],
    examples: [],
    updatedOnISODate: onDateISO,
    ...rest,
  });

  return {
    caseRecord: {
      id: CASE_ID,
      label: '小切',
      createdOnISODate: onDateISO,
      birthDateISO: yearsBefore(onDateISO, 8),
      note: '示範個案——改寫、簡化過的示意資料，可以直接修改或刪除。',
    },
    assessment: { id: ASSESSMENT_ID, caseId: CASE_ID, assessedOnISODate: onDateISO },
    profile: { assessmentId: ASSESSMENT_ID, values: {}, updatedOnISODate: onDateISO },
    substitutions: [
      pair('zh', 'zh', {
        errorPhonemeId: 'd',
        errorDiacritic: 'nasalized',
        processIds: ['stopping', 'vowelNasalization'],
        examples: [{ word: '蜘蛛', note: 'ㄉㄭⁿ ㄉㄨⁿ' }],
      }),
      pair('ch-nasal', 'ch', {
        errorPhonemeId: 'k',
        errorDiacritic: 'nasalized',
        processIds: ['stopping', 'backing', 'vowelNasalization'],
        examples: [{ word: '吃飯', note: 'ㄎㄭⁿ 飯' }],
      }),
      // Same pair without the nasalization — the mark comes and goes between words.
      pair('ch', 'ch', {
        errorPhonemeId: 'k',
        processIds: ['stopping', 'backing'],
        examples: [{ word: '吃菜', note: 'ㄎㄭ ㄎㄚˋ' }],
      }),
      pair('c', 'c', {
        errorPhonemeId: 'k',
        processIds: ['stopping', 'backing'],
        examples: [{ word: '菜', note: 'ㄎㄚˋ' }],
      }),
      pair('ai', 'ai', {
        errorPhonemeId: 'a',
        processIds: ['diphthongReduction'],
        examples: [{ word: '菜', note: 'ㄎㄚˋ' }],
      }),
      pair('i', 'i', {
        errorDiacritic: 'nasalized',
        processIds: ['vowelNasalization'],
      }),
      pair('u', 'u', {
        errorDiacritic: 'nasalized',
        processIds: ['vowelNasalization'],
      }),
    ],
  };
}
