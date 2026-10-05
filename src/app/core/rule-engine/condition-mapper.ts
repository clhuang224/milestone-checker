import { JsonLogicRule } from '../../models/rule.model';
import { RuleField } from './facts';

export type ConditionOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

const COMPARISON_OPERATORS: readonly ConditionOperator[] = ['==', '!=', '>', '>=', '<', '<='];

export interface ConditionRow {
  type: 'row';
  fieldId: string;
  operator: ConditionOperator;
  value: boolean | number;
}

/** What an applicability row tests; it also decides which collection the row iterates. */
export type ConditionSubject =
  'articulationTarget' | 'articulationCategory' | 'articulationProcess' | 'nativeLanguage';

/**
 * An applicability ("適用條件") row: does some item of the subject's collection (an articulation
 * error, or one of the case's native languages) match this set?
 *
 * `excludes` is existential, not universal — "excludes ㄓㄔㄕㄖ" means *some error remains once
 * those are set aside*, which is what 「有 ㄓㄔㄕㄖ 以外的構音錯誤」 asks. It does NOT mean the
 * case has no ㄓㄔㄕㄖ errors.
 */
export interface ConditionSetRow {
  type: 'set';
  subject: ConditionSubject;
  mode: 'includes' | 'excludes';
  /**
   * What the values are depends on the subject:
   * - `articulationTarget`: ZhuyinSymbol ids, matched against each error's target sound.
   * - `articulationCategory`: ZhuyinCategory ids (`initial` / `medial` / `final` / `tone`),
   *   matched against each error's target category — a whole category, so it keeps covering
   *   every sound in it even if the inventory changes.
   * - `articulationProcess`: PhonologicalProcessDefinition ids.
   * - `nativeLanguage`: NativeLanguageId ids, matched against each of the case's native
   *   languages.
   */
  values: string[];
}

/**
 * 適用條件 over swallow trials: 「清水 3cc 以下會嗆咳」.
 *
 * Its own row type rather than a ConditionSetRow variant, because every clause narrows the SAME
 * matched trial — a conjunction over one item, where a set row is a membership test over a
 * collection. Sharing the type would also drag along `mode: 'excludes'`, whose existential
 * meaning exists for articulation errors and means nothing here.
 */
export interface ConditionTrialRow {
  type: 'trial';
  /**
   * ConsistencyDefinition ids. Empty means 不限質地 and the clause is omitted — note this is the
   * OPPOSITE default from a set row, where empty deliberately matches nothing. The UI says so.
   */
  consistencyIds: string[];
  /** 量. Absent means volume is not part of this test. */
  volume?: { operator: ConditionOperator; cc: number };
  /** 不嗆咳的比例, 0–100. 「會嗆咳」 is `{ operator: '<', percent: 100 }`. */
  successPercent?: { operator: ConditionOperator; percent: number };
}

export interface ConditionGroup {
  type: 'group';
  combinator: 'and' | 'or';
  children: ConditionNode[];
}

export type ConditionNode = ConditionRow | ConditionSetRow | ConditionTrialRow | ConditionGroup;

const TRIALS_VAR = 'swallowing.trials';

const ERRORS_VAR = 'articulation.errors';

const NATIVE_LANGUAGES_VAR = 'case.nativeLanguages';

/** The collection a set row's `some` iterates, decided by its subject. */
const SUBJECT_COLLECTION: Record<ConditionSubject, string> = {
  articulationTarget: ERRORS_VAR,
  articulationCategory: ERRORS_VAR,
  articulationProcess: ERRORS_VAR,
  nativeLanguage: NATIVE_LANGUAGES_VAR,
};

/** The per-error property each articulation subject matches on. */
const SUBJECT_FIELD: Record<Exclude<ConditionSubject, 'nativeLanguage'>, string> = {
  articulationTarget: 'targetPhonemeId',
  articulationCategory: 'targetCategory',
  articulationProcess: 'processIds',
};

/** A membership test on the current scalar item — `{"var": ""}` in json-logic-js. */
function scalarMembership(values: string[]): JsonLogicRule {
  return { in: [{ var: '' }, values] };
}

/** Reads back a {@link scalarMembership} predicate, or undefined if it is not one. */
function scalarMembershipValues(predicate: unknown): string[] | undefined {
  const entry = singleKey(predicate);
  if (!entry || entry[0] !== 'in' || !Array.isArray(entry[1]) || entry[1].length !== 2) {
    return undefined;
  }
  const [item, values] = entry[1] as [unknown, unknown];
  return varNameOf(item) === '' && Array.isArray(values) ? (values as string[]) : undefined;
}

/**
 * The predicate applied to each collection item inside `some`. For the target and category
 * subjects that is a plain membership test on a field of the error; for processes the error's
 * own `processIds` is a list, so it needs its own `some`. Native languages are a list of plain
 * ids, so each item is tested directly.
 */
function subjectPredicate(subject: ConditionSubject, values: string[]): JsonLogicRule {
  if (subject === 'nativeLanguage') {
    return scalarMembership(values);
  }
  if (subject === 'articulationProcess') {
    return { some: [{ var: SUBJECT_FIELD[subject] }, scalarMembership(values)] };
  }
  return { in: [{ var: SUBJECT_FIELD[subject] }, values] };
}

/**
 * The clauses that narrow one trial, ANDed together.
 *
 * The `!= null` guard on volume is load-bearing, not defensive noise. json-logic-js resolves a
 * missing `var` to `null`, and `null <= 3` is `true` in JS — so without it, the spoon-of-puree
 * trial, the one with no measurable volume and therefore the *discharge* case, would satisfy
 * 「3cc 以下」 and fire a still-in-treatment warning on exactly the case that no longer needs
 * one. The unrecorded-field gate in json-logic.ts cannot cover this: it only walks comparison
 * rows, not the insides of a `some`.
 */
function trialClauses(row: ConditionTrialRow): JsonLogicRule[] {
  const clauses: JsonLogicRule[] = [];

  if (row.consistencyIds.length > 0) {
    clauses.push({ in: [{ var: 'consistencyId' }, row.consistencyIds] });
  }
  if (row.volume) {
    clauses.push({ '!=': [{ var: 'volumeCc' }, null] });
    clauses.push({ [row.volume.operator]: [{ var: 'volumeCc' }, row.volume.cc] });
  }
  if (row.successPercent) {
    clauses.push({
      [row.successPercent.operator]: [{ var: 'successPercent' }, row.successPercent.percent],
    });
  }

  // `and: []` is truthy in JsonLogic, which would match every trial. An empty row must match
  // nothing instead, the same way an empty set row does.
  return clauses.length > 0 ? clauses : [{ '==': [1, 0] }];
}

/** Serializes the rule-editor's internal condition model to JsonLogic. */
export function toJsonLogic(node: ConditionNode): JsonLogicRule {
  if (node.type === 'row') {
    return { [node.operator]: [{ var: node.fieldId }, node.value] };
  }
  if (node.type === 'trial') {
    return { some: [{ var: TRIALS_VAR }, { and: trialClauses(node) }] };
  }
  if (node.type === 'set') {
    const predicate = subjectPredicate(node.subject, node.values);
    return {
      some: [
        { var: SUBJECT_COLLECTION[node.subject] },
        node.mode === 'excludes' ? { '!': predicate } : predicate,
      ],
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
    // Both row kinds compile to `some`; the collection says which one this is.
    if (Array.isArray(args) && varNameOf(args[0]) === TRIALS_VAR) {
      return trialRowFrom(args);
    }
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

/**
 * Reads back the `in` (or nested `some`) predicate of a row over `articulation.errors`, returning
 * which articulation subject it tests. Only meaningful once the collection is known to be the
 * errors list — see setRowFrom().
 */
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
    const values = scalarMembershipValues(args[1]);
    return values ? { subject: 'articulationProcess', values } : undefined;
  }

  if (operator === 'in' && Array.isArray(args) && args.length === 2) {
    const [field, values] = args as [unknown, unknown];
    if (!Array.isArray(values)) {
      return undefined;
    }
    const fieldName = varNameOf(field);
    if (fieldName === SUBJECT_FIELD.articulationTarget) {
      return { subject: 'articulationTarget', values: values as string[] };
    }
    if (fieldName === SUBJECT_FIELD.articulationCategory) {
      return { subject: 'articulationCategory', values: values as string[] };
    }
  }

  return undefined;
}

/** Reads one narrowing clause back out, or undefined if it is not one we emit. */
function readClause(
  clause: unknown,
): { field: string; operator: string; value: unknown } | undefined {
  const entry = singleKey(clause);
  if (!entry || !Array.isArray(entry[1]) || entry[1].length !== 2) {
    return undefined;
  }
  const [left, right] = entry[1] as [unknown, unknown];
  const field = varNameOf(left);
  return field === undefined ? undefined : { field, operator: entry[0], value: right };
}

function trialRowFrom(args: unknown[]): ConditionTrialRow {
  const predicate = singleKey(args[1]);
  if (!predicate || predicate[0] !== 'and' || !Array.isArray(predicate[1])) {
    throw new Error('Unsupported JsonLogic "some" predicate over swallow trials');
  }

  const row: ConditionTrialRow = { type: 'trial', consistencyIds: [] };

  for (const clause of predicate[1]) {
    const read = readClause(clause);
    if (!read) {
      continue;
    }
    if (read.operator === 'in' && read.field === 'consistencyId' && Array.isArray(read.value)) {
      row.consistencyIds = read.value as string[];
    } else if (read.field === 'volumeCc' && isComparisonOperator(read.operator)) {
      // The `!= null` guard is emitted alongside the real comparison; it carries no user intent.
      row.volume = { operator: read.operator, cc: Number(read.value) };
    } else if (read.field === 'successPercent' && isComparisonOperator(read.operator)) {
      row.successPercent = { operator: read.operator, percent: Number(read.value) };
    }
  }

  return row;
}

function setRowFrom(args: unknown): ConditionSetRow {
  if (!Array.isArray(args) || args.length !== 2) {
    throw new Error('Invalid JsonLogic "some" rule: expected [{ var }, predicate]');
  }
  // The collection is read FIRST. A native-language predicate, `{"in": [{"var": ""}, [...]]}`,
  // names no field and has the same shape as the innermost part of a process row, so the
  // predicate alone cannot tell the two apart; the collection can.
  const collection = varNameOf(args[0]);
  if (collection !== ERRORS_VAR && collection !== NATIVE_LANGUAGES_VAR) {
    throw new Error(
      `Unsupported JsonLogic "some" target: expected { var: "${ERRORS_VAR}" } or ` +
        `{ var: "${NATIVE_LANGUAGES_VAR}" }`,
    );
  }

  // An outer `!` is what distinguishes 「排除」 from 「包含」.
  const negated = singleKey(args[1]);
  const isExcludes = negated?.[0] === '!';
  const predicate = isExcludes ? negated[1] : args[1];

  let matched: { subject: ConditionSubject; values: string[] } | undefined;
  if (collection === NATIVE_LANGUAGES_VAR) {
    const values = scalarMembershipValues(predicate);
    matched = values ? { subject: 'nativeLanguage', values } : undefined;
  } else {
    matched = subjectOf(predicate);
  }
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

/** A starter condition row for the given fields, used when adding a new row in the editor. */
export function defaultRow(fields: RuleField[]): ConditionRow {
  const field = fields[0];
  return {
    type: 'row',
    fieldId: field?.id ?? '',
    operator: '==',
    value: field?.kind === 'boolean' ? true : 0,
  };
}

/**
 * A starter applicability row — empty, so it matches nothing until sounds are picked.
 *
 * The mode must be `includes` for that to be true. An empty `excludes` row is not a harmless
 * blank: it compiles to 「扣掉零個音之後還有錯誤嗎」, which is true of every case that has any
 * articulation error at all. Defaulting to it meant a therapist who added a row and saved
 * without ticking anything got a rule that fires on nearly everyone.
 */
export function defaultSetRow(): ConditionSetRow {
  return { type: 'set', subject: 'articulationTarget', mode: 'includes', values: [] };
}

/** A starter trial row, seeded with 「會嗆咳」 so it is never an empty match-nothing row. */
export function defaultTrialRow(): ConditionTrialRow {
  return { type: 'trial', consistencyIds: [], successPercent: { operator: '<', percent: 100 } };
}

/** A starter condition group for the given fields, used when creating a new rule. */
export function defaultGroup(fields: RuleField[]): ConditionGroup {
  return { type: 'group', combinator: 'and', children: [defaultRow(fields)] };
}
