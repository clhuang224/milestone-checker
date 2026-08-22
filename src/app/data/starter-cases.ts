import { ArticulationProbe, ProbeItem } from '../models/articulation-record.model';
import { SessionRecord } from '../models/session-record.model';
import { ARTICULATION_FORM_ID } from './starter-forms';
import { RecordProfile, Case } from '../models/case.model';

export interface StarterCaseSeed {
  caseRecord: Case;
  record: SessionRecord;
  profile: RecordProfile;
  probes: ArticulationProbe[];
}

const CASE_ID = 'demo-case-xiaoqie';
const RECORD_ID = 'demo-assessment-xiaoqie';

/** Subtracts whole years from an ISO date, keeping the month and day. */
function yearsBefore(onDateISO: string, years: number): string {
  const [year, rest] = [Number(onDateISO.slice(0, 4)), onDateISO.slice(4)];
  return `${year - years}${rest}`;
}

function items(...recorded: [word: string, heard: string][]): ProbeItem[] {
  const filled = recorded.map(([word, heard]) => ({ word, heard }));
  while (filled.length < 3) {
    filled.push({ word: '', heard: '' });
  }
  return filled;
}

/**
 * A demo case, so a first-time user sees warnings and a report draft instead of empty lists.
 * Rewritten and simplified sample content — not a real case.
 *
 * The birth date is derived from `onDateISO` rather than hard-coded: a fixed date would make the
 * demo drift older every year, until 「8 歲」 no longer matches what the app shows.
 *
 * No phonological summary is seeded — the processes derive from these probes, which is the
 * point of the demo.
 */
export function starterCaseSeed(onDateISO: string): StarterCaseSeed {
  const probe = (targetPhonemeId: string, probeItems: ProbeItem[]): ArticulationProbe => ({
    id: `${CASE_ID}-${targetPhonemeId}`,
    caseId: CASE_ID,
    recordId: RECORD_ID,
    targetPhonemeId,
    items: probeItems,
    updatedOnISODate: onDateISO,
  });

  return {
    caseRecord: {
      id: CASE_ID,
      label: '小切',
      createdOnISODate: onDateISO,
      birthDateISO: yearsBefore(onDateISO, 8),
      note: '示範個案——改寫、簡化過的示意資料，可以直接修改或刪除。',
    },
    record: {
      id: RECORD_ID,
      caseId: CASE_ID,
      onISODate: onDateISO,
      formIds: [ARTICULATION_FORM_ID],
    },
    profile: { recordId: RECORD_ID, values: {}, updatedOnISODate: onDateISO },
    probes: [
      probe('zh', items(['蜘蛛', 'ㄉㄭⁿ'])),
      probe('ch', items(['吃飯', 'ㄎㄭⁿ'], ['吃菜', 'ㄎㄭ'])),
      probe('c', items(['菜', 'ㄎㄚˋ'])),
      probe('ai', items(['菜', 'ㄚ'])),
      probe('i', items(['衣', 'ㄧⁿ'])),
      probe('u', items(['烏', 'ㄨⁿ'])),
    ],
  };
}
