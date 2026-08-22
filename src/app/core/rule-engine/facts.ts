import {
  ArticulationDiacritic,
  ArticulationProbe,
  ManualProcessGroup,
} from '../../models/articulation-record.model';
import { probeErrors } from '../articulation/probe-errors';
import { processIdsForTarget } from '../articulation/summary';
import { SessionRecord } from '../../models/session-record.model';
import { RecordProfile, Case } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { ZhuyinCategory } from '../../models/zhuyin.model';
import { findZhuyin } from '../../data/zhuyin-inventory';
import { ageInMonthsOn, correctedAgeInMonthsOn } from '../age';

/** Age facts — derived from the birth date and the assessment date, never stored. */
export const AGE_FIELD_ID = 'case.ageInMonths';
export const CORRECTED_AGE_FIELD_ID = 'case.correctedAgeInMonths';

/**
 * A fact a comparison row can be written against. Wider than `FindingDefinition`, because case
 * attributes like age are derived rather than recorded by the therapist.
 */
export interface RuleField {
  id: string;
  label: string;
  kind: 'boolean' | 'number';
}

const CASE_FIELDS: RuleField[] = [
  { id: AGE_FIELD_ID, label: '月齡（實齡）', kind: 'number' },
  { id: CORRECTED_AGE_FIELD_ID, label: '月齡（矯正齡）', kind: 'number' },
];

/** Everything selectable in the rule editor's field dropdown. */
export function ruleFields(findings: FindingDefinition[]): RuleField[] {
  return [...CASE_FIELDS, ...findings];
}

/** One recorded articulation error, flattened into something JsonLogic can filter over. */
export interface ArticulationErrorFact {
  targetPhonemeId: string;
  /** Lets a later rule narrow to initials only without changing the stored shape. */
  targetCategory?: ZhuyinCategory;
  errorPhonemeId?: string;
  diacritic?: ArticulationDiacritic;
  processIds: string[];
}

export interface RuleFacts {
  /**
   * Both ages are offered and neither is picked automatically. Choosing the wrong basis is a
   * silent error — the rule still fires, just on a premise the author did not intend — so the
   * choice belongs to whoever writes the rule.
   */
  case: { ageInMonths?: number; correctedAgeInMonths?: number };
  articulation: { errors: ArticulationErrorFact[] };
  /** Finding values stay flat at the top level — see buildFacts. */
  [findingId: string]: unknown;
}

/**
 * Process ids come from the summary in force, not from the derivation directly — a therapist
 * who overrode the grouping expects their rules to fire on what they wrote, not on what the
 * app would have concluded.
 */
function errorFacts(
  probes: ArticulationProbe[],
  groups: ManualProcessGroup[],
): ArticulationErrorFact[] {
  return probeErrors(probes).map((error) => ({
    targetPhonemeId: error.targetPhonemeId,
    targetCategory: findZhuyin(error.targetPhonemeId)?.category,
    errorPhonemeId: error.sound.symbolId,
    diacritic: error.sound.diacritic,
    processIds: processIdsForTarget(groups, error.targetPhonemeId),
  }));
}

/**
 * Assembles everything a rule can be evaluated against.
 *
 * Finding values are spread flat at the top level on purpose: existing rules reference them as
 * `{"var": "drooling"}`, so keeping that shape means no rule migration. The new facts sit under
 * the `case.` and `articulation.` namespaces, where they cannot collide with a finding id.
 */
export function buildFacts(
  caseRecord: Case,
  assessment: SessionRecord,
  profile: RecordProfile,
  probes: ArticulationProbe[],
  processGroups: ManualProcessGroup[],
): RuleFacts {
  // The assessment date, never today: a report written a fortnight later must not age the case
  // past a threshold it was under when the data was actually collected.
  const onDateISO = assessment.onISODate;
  const birthDateISO = caseRecord.birthDateISO;

  return {
    ...profile.values,
    case: {
      ageInMonths: birthDateISO ? ageInMonthsOn(birthDateISO, onDateISO) : undefined,
      correctedAgeInMonths: birthDateISO
        ? correctedAgeInMonthsOn(birthDateISO, caseRecord.gestationalWeeks, onDateISO)
        : undefined,
    },
    articulation: { errors: errorFacts(probes, processGroups) },
  };
}
