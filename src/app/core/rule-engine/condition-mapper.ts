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

export interface ConditionGroup {
  type: 'group';
  combinator: 'and' | 'or';
  children: ConditionNode[];
}

export type ConditionNode = ConditionRow | ConditionGroup;

/** Serializes the rule-editor's internal condition model to JsonLogic. */
export function toJsonLogic(node: ConditionNode): JsonLogicRule {
  if (node.type === 'row') {
    return { [node.operator]: [{ var: node.fieldId }, node.value] };
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
