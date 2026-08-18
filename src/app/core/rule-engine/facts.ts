import { isArticulationError } from '../../features/articulation/substitution-label';
import {
  ArticulationDiacritic,
  ArticulationSubstitution,
} from '../../models/articulation-record.model';
import { Case, CaseProfile } from '../../models/case.model';
import { ZhuyinCategory } from '../../models/zhuyin.model';
import { findZhuyin } from '../../data/zhuyin-inventory';
import { ageInMonthsOn } from '../age';

/** The `case.ageInMonths` fact — derived from the birth date, never stored. */
export const AGE_FIELD_ID = 'case.ageInMonths';

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
  case: { ageInMonths?: number };
  articulation: { errors: ArticulationErrorFact[] };
  /** Finding values stay flat at the top level — see buildFacts. */
  [findingId: string]: unknown;
}

function errorFacts(substitutions: ArticulationSubstitution[]): ArticulationErrorFact[] {
  return substitutions.filter(isArticulationError).map((substitution) => ({
    targetPhonemeId: substitution.targetPhonemeId,
    targetCategory: findZhuyin(substitution.targetPhonemeId)?.category,
    errorPhonemeId: substitution.errorPhonemeId,
    diacritic: substitution.errorDiacritic,
    processIds: substitution.processIds,
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
  profile: CaseProfile,
  substitutions: ArticulationSubstitution[],
  onDateISO: string,
): RuleFacts {
  const ageInMonths = caseRecord.birthDateISO
    ? ageInMonthsOn(caseRecord.birthDateISO, onDateISO)
    : undefined;

  return {
    ...profile.values,
    case: { ageInMonths },
    articulation: { errors: errorFacts(substitutions) },
  };
}
