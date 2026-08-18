import jsonLogic from 'json-logic-js';

import { JsonLogicRule, Rule } from '../../models/rule.model';
import { ConditionNode, fromJsonLogic } from './condition-mapper';
import { RuleFacts } from './facts';

/**
 * Field ids referenced by comparison rows only.
 *
 * Applicability (`set`) rows are deliberately skipped: they run over a list, and an empty list
 * is a legitimate "no errors recorded" answer rather than a missing value.
 */
function comparisonFieldIdsIn(node: ConditionNode): string[] {
  if (node.type === 'row') {
    return [node.fieldId];
  }
  if (node.type === 'set') {
    return [];
  }
  return node.children.flatMap(comparisonFieldIdsIn);
}

/** Resolves a possibly-dotted path like `case.ageInMonths`, reporting whether it has a value. */
function hasFact(facts: RuleFacts, path: string): boolean {
  let current: unknown = facts;
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null) {
      return false;
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current !== undefined && current !== null;
}

/**
 * Evaluates a rule's condition against a case's facts.
 *
 * A field that hasn't been recorded yet is treated as "unknown", not as JsonLogic's default
 * `null`/0-ish coercion — otherwise a numeric-threshold rule like `oralMotorScore < 40` would
 * fire for a case where that score was never entered at all (json-logic-js's `{ var }` returns
 * `null` for a missing key, and `null < 40` is `true` in JS). The same guard is why a case with
 * no birth date does not trigger an age rule.
 */
export function evaluateCondition(condition: JsonLogicRule, facts: RuleFacts): boolean {
  let node: ConditionNode;
  try {
    node = fromJsonLogic(condition);
  } catch {
    return false;
  }

  const hasEveryField = comparisonFieldIdsIn(node).every((fieldId) => hasFact(facts, fieldId));
  if (!hasEveryField) {
    return false;
  }

  return Boolean(jsonLogic.apply(condition, facts));
}

/** Returns the enabled rules whose condition matches the case's current facts. */
export function evaluateRules(rules: Rule[], facts: RuleFacts): Rule[] {
  return rules.filter((rule) => rule.enabled && evaluateCondition(rule.condition, facts));
}
