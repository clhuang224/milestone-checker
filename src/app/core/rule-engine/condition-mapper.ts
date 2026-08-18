import { FindingDefinition } from '../../models/finding.model';
import { JsonLogicRule } from '../../models/rule.model';

export type ConditionOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

const COMPARISON_OPERATORS: readonly ConditionOperator[] = ['==', '!=', '>', '>=', '<', '<='];

export interface ConditionRow {
  type: 'row';
  fieldId: string;
  operator: ConditionOperator;
  value: boolean | number;
}

/** What collection an applicability row tests. */
export type ConditionSubject = 'articulationTarget' | 'articulationProcess';

/**
 * An applicability ("適用條件") row: does the case have an articulation error matching this set?
 *
 * `excludes` is existential, not universal — "excludes ㄓㄔㄕㄖ" means *some error remains once
 * those are set aside*, which is what 「有 ㄓㄔㄕㄖ 以外的構音錯誤」 asks. It does NOT mean the
 * case has no ㄓㄔㄕㄖ errors.
 */
export interface ConditionSetRow {
  type: 'set';
  subject: ConditionSubject;
  mode: 'includes' | 'excludes';
  /** ZhuyinSymbol ids, or PhonologicalProcessDefinition ids for the process subject. */
  values: string[];
}

export interface ConditionGroup {
  type: 'group';
  combinator: 'and' | 'or';
  children: ConditionNode[];
}

export type ConditionNode = ConditionRow | ConditionSetRow | ConditionGroup;

const ERRORS_VAR = 'articulation.errors';

/** The per-error property each subject matches on. */
const SUBJECT_FIELD: Record<ConditionSubject, string> = {
  articulationTarget: 'targetPhonemeId',
  articulationProcess: 'processIds',
};

/**
 * The predicate applied to each error inside `some`. For the target subject that is a plain
 * membership test; for processes the error's own `processIds` is a list, so it needs its own
 * `some` — `{"var": ""}` is json-logic-js's reference to the current scalar item.
 */
function subjectPredicate(subject: ConditionSubject, values: string[]): JsonLogicRule {
  if (subject === 'articulationProcess') {
    return {
      some: [{ var: SUBJECT_FIELD[subject] }, { in: [{ var: '' }, values] }],
    };
  }
  return { in: [{ var: SUBJECT_FIELD[subject] }, values] };
}

/** Serializes the rule-editor's internal condition model to JsonLogic. */
export function toJsonLogic(node: ConditionNode): JsonLogicRule {
  if (node.type === 'row') {
    return { [node.operator]: [{ var: node.fieldId }, node.value] };
  }
  if (node.type === 'set') {
    const predicate = subjectPredicate(node.subject, node.values);
    return {
      some: [{ var: ERRORS_VAR }, node.mode === 'excludes' ? { '!': predicate } : predicate],
    };
  }
  return { [node.combinator]: node.children.map(toJsonLogic) };
}

/** Parses a JsonLogic rule back into the rule-editor's internal condition model. */
export function fromJsonLogic(rule: JsonLogicRule): ConditionNode {
  const keys = Object.keys(rule);
  if (keys.length !== 1) {
    throw new Error(
      `Invalid JsonLogic rule: expected exactly one operator key, got ${keys.length}`,
    );
  }
  const operator = keys[0];
  const args = rule[operator];

  if (operator === 'some') {
    return setRowFrom(args);
  }

  if (operator === 'and' || operator === 'or') {
    if (!Array.isArray(args)) {
      throw new Error(`Invalid JsonLogic "${operator}" rule: expected an array of children`);
    }
    return {
      type: 'group',
      combinator: operator,
      children: args.map((child) => fromJsonLogic(child as JsonLogicRule)),
    };
  }

  if (isComparisonOperator(operator)) {
    if (!Array.isArray(args) || args.length !== 2) {
      throw new Error(`Invalid JsonLogic "${operator}" rule: expected [{ var }, value]`);
    }
    const [varNode, value] = args as [{ var: string }, boolean | number];
    if (typeof varNode !== 'object' || varNode === null || typeof varNode.var !== 'string') {
      throw new Error(
        `Invalid JsonLogic "${operator}" rule: first argument must be a { var } reference`,
      );
    }
    return { type: 'row', fieldId: varNode.var, operator, value };
  }

  throw new Error(`Unsupported JsonLogic operator: "${operator}"`);
}

function isComparisonOperator(value: string): value is ConditionOperator {
  return (COMPARISON_OPERATORS as readonly string[]).includes(value);
}

function varNameOf(node: unknown): string | undefined {
  return typeof node === 'object' &&
    node !== null &&
    typeof (node as { var?: unknown }).var === 'string'
    ? (node as { var: string }).var
    : undefined;
}

function singleKey(node: unknown): [string, unknown] | undefined {
  if (typeof node !== 'object' || node === null) {
    return undefined;
  }
  const keys = Object.keys(node as object);
  return keys.length === 1 ? [keys[0], (node as Record<string, unknown>)[keys[0]]] : undefined;
}

/** Reads back the `in` (or nested `some`) predicate, returning which subject it tests. */
function subjectOf(
  predicate: unknown,
): { subject: ConditionSubject; values: string[] } | undefined {
  const entry = singleKey(predicate);
  if (!entry) {
    return undefined;
  }
  const [operator, args] = entry;

  if (operator === 'some') {
    if (!Array.isArray(args) || args.length !== 2) {
      return undefined;
    }
    if (varNameOf(args[0]) !== SUBJECT_FIELD.articulationProcess) {
      return undefined;
    }
    const inner = singleKey(args[1]);
    if (!inner || inner[0] !== 'in' || !Array.isArray(inner[1])) {
      return undefined;
    }
    const [item, values] = inner[1] as [unknown, unknown];
    if (varNameOf(item) !== '' || !Array.isArray(values)) {
      return undefined;
    }
    return { subject: 'articulationProcess', values: values as string[] };
  }

  if (operator === 'in' && Array.isArray(args) && args.length === 2) {
    const [field, values] = args as [unknown, unknown];
    if (varNameOf(field) === SUBJECT_FIELD.articulationTarget && Array.isArray(values)) {
      return { subject: 'articulationTarget', values: values as string[] };
    }
  }

  return undefined;
}

function setRowFrom(args: unknown): ConditionSetRow {
  if (!Array.isArray(args) || args.length !== 2) {
    throw new Error('Invalid JsonLogic "some" rule: expected [{ var }, predicate]');
  }
  if (varNameOf(args[0]) !== ERRORS_VAR) {
    throw new Error(`Unsupported JsonLogic "some" target: expected { var: "${ERRORS_VAR}" }`);
  }

  // An outer `!` is what distinguishes 「排除」 from 「包含」.
  const negated = singleKey(args[1]);
  const isExcludes = negated?.[0] === '!';
  const matched = subjectOf(isExcludes ? negated[1] : args[1]);
  if (!matched) {
    throw new Error('Unsupported JsonLogic "some" predicate in an applicability condition');
  }

  return {
    type: 'set',
    subject: matched.subject,
    mode: isExcludes ? 'excludes' : 'includes',
    values: matched.values,
  };
}

/** A starter condition row for the given findings, used when adding a new row in the editor. */
export function defaultRow(fields: FindingDefinition[]): ConditionRow {
  const field = fields[0];
  return {
    type: 'row',
    fieldId: field?.id ?? '',
    operator: '==',
    value: field?.kind === 'boolean' ? true : 0,
  };
}

/** A starter condition group for the given findings, used when creating a new rule. */
export function defaultGroup(fields: FindingDefinition[]): ConditionGroup {
  return { type: 'group', combinator: 'and', children: [defaultRow(fields)] };
}
