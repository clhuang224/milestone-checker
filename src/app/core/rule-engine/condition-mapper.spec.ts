import { describe, expect, it } from 'vitest';

import { FindingDefinition } from '../../models/finding.model';
import {
  ConditionGroup,
  ConditionRow,
  defaultGroup,
  defaultRow,
  fromJsonLogic,
  toJsonLogic,
} from './condition-mapper';

describe('condition-mapper', () => {
  it('serializes a single condition row to JsonLogic', () => {
    const row: ConditionRow = { type: 'row', fieldId: 'drooling', operator: '==', value: true };

    expect(toJsonLogic(row)).toEqual({ '==': [{ var: 'drooling' }, true] });
  });

  it('serializes a nested group to JsonLogic', () => {
    const group: ConditionGroup = {
      type: 'group',
      combinator: 'and',
      children: [
        { type: 'row', fieldId: 'drooling', operator: '==', value: true },
        {
          type: 'group',
          combinator: 'or',
          children: [
            { type: 'row', fieldId: 'oralMotorScore', operator: '>', value: 40 },
            { type: 'row', fieldId: 'articulationError', operator: '==', value: true },
          ],
        },
      ],
    };

    expect(toJsonLogic(group)).toEqual({
      and: [
        { '==': [{ var: 'drooling' }, true] },
        {
          or: [
            { '>': [{ var: 'oralMotorScore' }, 40] },
            { '==': [{ var: 'articulationError' }, true] },
          ],
        },
      ],
    });
  });

  it('round-trips a row through toJsonLogic and fromJsonLogic', () => {
    const row: ConditionRow = {
      type: 'row',
      fieldId: 'oralMotorScore',
      operator: '>=',
      value: 40,
    };

    expect(fromJsonLogic(toJsonLogic(row))).toEqual(row);
  });

  it('round-trips a nested group through toJsonLogic and fromJsonLogic', () => {
    const group: ConditionGroup = {
      type: 'group',
      combinator: 'or',
      children: [
        { type: 'row', fieldId: 'drooling', operator: '!=', value: false },
        {
          type: 'group',
          combinator: 'and',
          children: [{ type: 'row', fieldId: 'oralMotorScore', operator: '<', value: 20 }],
        },
      ],
    };

    expect(fromJsonLogic(toJsonLogic(group))).toEqual(group);
  });

  it('throws when a rule has more than one operator key', () => {
    expect(() => fromJsonLogic({ '==': [], '!=': [] })).toThrow(/exactly one operator key/);
  });

  it('throws on an unsupported operator', () => {
    expect(() => fromJsonLogic({ in: [] })).toThrow(/Unsupported JsonLogic operator/);
  });

  it('throws when a comparison row is missing a { var } reference', () => {
    expect(() => fromJsonLogic({ '==': [1, 2] })).toThrow(/var.*reference/);
  });
});

describe('defaultRow / defaultGroup', () => {
  const booleanField: FindingDefinition = {
    id: 'drooling',
    categoryId: 'swallowing',
    label: '流口水',
    kind: 'boolean',
  };
  const numberField: FindingDefinition = {
    id: 'oralMotorScore',
    categoryId: 'swallowing',
    label: '口腔動作評估分數',
    kind: 'number',
  };

  it('defaults a boolean field to true', () => {
    expect(defaultRow([booleanField])).toEqual({
      type: 'row',
      fieldId: 'drooling',
      operator: '==',
      value: true,
    });
  });

  it('defaults a number field to 0', () => {
    expect(defaultRow([numberField])).toEqual({
      type: 'row',
      fieldId: 'oralMotorScore',
      operator: '==',
      value: 0,
    });
  });

  it('falls back to an empty fieldId when there are no fields', () => {
    expect(defaultRow([])).toEqual({ type: 'row', fieldId: '', operator: '==', value: 0 });
  });

  it('wraps a default row in an AND group', () => {
    expect(defaultGroup([booleanField])).toEqual({
      type: 'group',
      combinator: 'and',
      children: [{ type: 'row', fieldId: 'drooling', operator: '==', value: true }],
    });
  });
});
