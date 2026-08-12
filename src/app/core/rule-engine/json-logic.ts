import jsonLogic from 'json-logic-js';

import { CaseProfile } from '../../models/case.model';
import { JsonLogicRule, Rule } from '../../models/rule.model';
import { ConditionNode, fromJsonLogic } from './condition-mapper';

function fieldIdsIn(node: ConditionNode): string[] {
  return node.type === 'row' ? [node.fieldId] : node.children.flatMap(fieldIdsIn);
}

/**
 * Evaluates a rule's condition against a case's recorded findings.
 *
 * A field that hasn't been recorded yet is treated as "unknown", not as JsonLogic's default
 * `null`/0-ish coercion — otherwise a numeric-threshold rule like `oralMotorScore < 40` would
 * fire for a case where that score was never entered at all (json-logic-js's `{ var }` returns
 * `null` for a missing key, and `null < 40` is `true` in JS).
 */
export function evaluateCondition(condition: JsonLogicRule, profile: CaseProfile): boolean {
  let node: ConditionNode;
  try {
    node = fromJsonLogic(condition);
  } catch {
    return false;
  }

  const hasEveryField = fieldIdsIn(node).every((fieldId) =>
    Object.prototype.hasOwnProperty.call(profile.values, fieldId),
  );
  if (!hasEveryField) {
    return false;
  }

  return Boolean(jsonLogic.apply(condition, profile.values));
}

/** Returns the enabled rules whose condition matches the case's current findings. */
export function evaluateRules(rules: Rule[], profile: CaseProfile): Rule[] {
  return rules.filter((rule) => rule.enabled && evaluateCondition(rule.condition, profile));
}
