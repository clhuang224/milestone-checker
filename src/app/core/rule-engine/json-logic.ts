import jsonLogic from 'json-logic-js';

import { CaseProfile } from '../../models/case.model';
import { JsonLogicRule, Rule } from '../../models/rule.model';

export function evaluateCondition(condition: JsonLogicRule, profile: CaseProfile): boolean {
  return Boolean(jsonLogic.apply(condition, profile.values));
}

/** Returns the enabled rules whose condition matches the case's current findings. */
export function evaluateRules(rules: Rule[], profile: CaseProfile): Rule[] {
  return rules.filter((rule) => rule.enabled && evaluateCondition(rule.condition, profile));
}
