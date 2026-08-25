import jsonLogic from 'json-logic-js';

import { JsonLogicRule, Rule } from '../../models/rule.model';
import { ConditionNode, fromJsonLogic, toJsonLogic } from './condition-mapper';
import { RuleFacts } from './facts';

/** A clause that is false whatever the facts say. */
const NEVER: JsonLogicRule = { '==': [1, 0] };

/**
 * Recompiles the condition with unrecorded comparisons forced false, rather than testing the
 * whole rule for missing fields up front.
 *
 * Doing it per-node matters twice over. Collecting the field ids flat and requiring all of them
 * meant one unrecorded field suppressed the entire rule, including branches that would have
 * decided it alone — an `or` of 「四歲以上」 and 「流口水」 returned false for a drooling case with
 * no birth date. And the reverse: had that rule been evaluated anyway, `oralMotorScore < 40`
 * with no score recorded coerces to `null < 40`, which is `true`, so an `or` would have fired on
 * a field nobody filled in. Substituting the clause fixes both, and lets `and`/`or` compose
 * normally instead of needing their own judgeability rules.
 *
 * Applicability rows — both `set` and `trial` — are always judgeable: they run over a list, and
 * an empty list is a legitimate "nothing recorded" answer rather than a missing value. A trial
 * row guards its own missing values inside the compiled predicate, since this gate cannot see
 * into a `some`.
 */
function guardedCondition(node: ConditionNode, facts: RuleFacts): JsonLogicRule {
  if (node.type === 'row') {
    return hasFact(facts, node.fieldId) ? toJsonLogic(node) : NEVER;
  }
  if (node.type === 'set' || node.type === 'trial') {
    return toJsonLogic(node);
  }
  return { [node.combinator]: node.children.map((child) => guardedCondition(child, facts)) };
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

  return Boolean(jsonLogic.apply(guardedCondition(node, facts), facts));
}

/** Returns the enabled rules whose condition matches the case's current facts. */
export function evaluateRules(rules: Rule[], facts: RuleFacts): Rule[] {
  return rules.filter((rule) => rule.enabled && evaluateCondition(rule.condition, facts));
}
