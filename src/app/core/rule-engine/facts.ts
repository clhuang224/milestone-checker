import {
  ArticulationDiacritic,
  ArticulationProbe,
  ManualProcessGroup,
} from '../../models/articulation-record.model';
import { probeErrors } from '../articulation/probe-errors';
import { processIdsForTarget } from '../articulation/summary';
import { SessionRecord } from '../../models/session-record.model';
import {
  RecordProfile,
  Case,
  CaseHearing,
  HearingStatus,
  NativeLanguageId,
} from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { ZhuyinCategory } from '../../models/zhuyin.model';
import { SwallowTrial } from '../../models/swallow-trial.model';
import { findZhuyin } from '../../data/zhuyin-inventory';
import { ageInMonthsOn, correctedAgeInMonthsOn } from '../age';
import { successPercent } from '../swallowing/success-rate';

/** Age facts — derived from the birth date and the assessment date, never stored. */
export const AGE_FIELD_ID = 'case.ageInMonths';
export const CORRECTED_AGE_FIELD_ID = 'case.correctedAgeInMonths';

/** Hearing facts — projected from the per-ear status on the case, never stored. */
export const BETTER_EAR_NORMAL_FIELD_ID = 'case.hearing.betterEarNormal';
export const LEFT_EAR_NORMAL_FIELD_ID = 'case.hearing.leftNormal';
export const RIGHT_EAR_NORMAL_FIELD_ID = 'case.hearing.rightNormal';

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
  // The better-ear basis is in the label itself, not left to a tooltip: a rule author picking
  // 「整體聽力正常」 must see which reading of "overall" they are getting.
  { id: BETTER_EAR_NORMAL_FIELD_ID, label: '整體聽力正常（優耳）', kind: 'boolean' },
  { id: LEFT_EAR_NORMAL_FIELD_ID, label: '左耳聽力正常', kind: 'boolean' },
  { id: RIGHT_EAR_NORMAL_FIELD_ID, label: '右耳聽力正常', kind: 'boolean' },
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
  case: {
    ageInMonths?: number;
    correctedAgeInMonths?: number;
    /**
     * Absent when never asked, `[]` when answered only with typed languages. Ids only — typed
     * `otherNativeLanguages` are left out because rules can only be written against a known list.
     */
    nativeLanguages?: NativeLanguageId[];
    /** Each value is undefined when it cannot be known — the missing-field guard treats that as unrecorded. */
    hearing?: {
      leftNormal?: boolean;
      rightNormal?: boolean;
      betterEarNormal?: boolean;
    };
  };
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
 * 'aided' projects to false: it counts as non-normal for the better ear (see betterEarNormal), and
 * the single-ear facts must agree, or one case could read "left ear normal" yet "overall not normal".
 */
function earNormal(status?: HearingStatus): boolean | undefined {
  return status === undefined ? undefined : status === 'normal';
}

/**
 * Overall hearing goes by the better ear — the convention of Taiwan's disability determination,
 * settled by the developer. Named after that basis so an exported rule's `betterEarNormal` says
 * which reading it means.
 *
 * One normal ear settles it whatever the other ear is (the better ear is at least that good). One
 * non-normal ear settles nothing: an unrecorded ear could be the better one, so the answer stays
 * undefined rather than false, and the missing-field guard keeps the rule from firing.
 *
 * 'aided' sits on the non-normal side — a settled ruling, not an inference.
 *
 * Lossy projection: a new HearingStatus member must be decided here too, not only in earNormal.
 */
function betterEarNormal(hearing?: CaseHearing): boolean | undefined {
  if (hearing?.left === 'normal' || hearing?.right === 'normal') {
    return true;
  }
  if (hearing?.left !== undefined && hearing?.right !== undefined) {
    return false;
  }
  return undefined;
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
      // Spread rather than assigned, so "never asked" leaves no key at all: the missing-field
      // guard has to tell that apart from an answer that names no listed language.
      ...(caseRecord.nativeLanguages ? { nativeLanguages: caseRecord.nativeLanguages } : {}),
      hearing: {
        leftNormal: earNormal(caseRecord.hearing?.left),
        rightNormal: earNormal(caseRecord.hearing?.right),
        betterEarNormal: betterEarNormal(caseRecord.hearing),
      },
    },
    articulation: { errors: errorFacts(probes, processGroups) },
    swallowing: { trials: trialFacts(trials) },
  };
}
