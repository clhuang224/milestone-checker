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
import { SwallowTrial } from '../../models/swallow-trial.model';
import { findZhuyin } from '../../data/zhuyin-inventory';
import { ageInMonthsOn, correctedAgeInMonthsOn } from '../age';
import { successPercent } from '../swallowing/success-rate';

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

/**
 * One recorded swallow trial, flattened into what a trial condition row compiles against.
 *
 * The field names are not free to change: `condition-mapper.ts` emits `{"var": "consistencyId"}`,
 * `{"var": "volumeCc"}` and `{"var": "successPercent"}` inside the `some` predicate, and stored
 * rules already carry those paths.
 *
 * `outcome` is flattened to the single 0–100 scale here rather than left in its two shapes, so a
 * rule compares one thing; `outcomeLabel()` is what preserves counted-vs-estimated for readers.
 */
export interface SwallowTrialFact {
  consistencyId: string;
  /**
   * Stays optional. A trial with nothing measurable must NOT read as 0cc — the compiled
   * predicate's `!= null` guard is what keeps 「3cc 以下」 off it, and that guard only works if
   * the absence survives into the facts.
   */
  volumeCc?: number;
  successPercent: number;
}

export interface RuleFacts {
  /**
   * Both ages are offered and neither is picked automatically. Choosing the wrong basis is a
   * silent error — the rule still fires, just on a premise the author did not intend — so the
   * choice belongs to whoever writes the rule.
   */
  case: { ageInMonths?: number; correctedAgeInMonths?: number };
  articulation: { errors: ArticulationErrorFact[] };
  swallowing: { trials: SwallowTrialFact[] };
  /** Finding values stay flat at the top level — see buildFacts. */
  [findingId: string]: unknown;
}

function trialFacts(trials: SwallowTrial[]): SwallowTrialFact[] {
  return trials.map((trial) => ({
    consistencyId: trial.consistencyId,
    volumeCc: trial.volumeCc,
    successPercent: successPercent(trial.outcome),
  }));
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
 * the `case.`, `articulation.` and `swallowing.` namespaces, where they cannot collide with a
 * finding id.
 */
export function buildFacts(
  caseRecord: Case,
  assessment: SessionRecord,
  profile: RecordProfile,
  probes: ArticulationProbe[],
  processGroups: ManualProcessGroup[],
  trials: SwallowTrial[],
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
    swallowing: { trials: trialFacts(trials) },
  };
}
