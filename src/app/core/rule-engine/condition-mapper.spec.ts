import { describe, expect, it } from 'vitest';

import { ConditionGroup, ConditionRow, fromJsonLogic, toJsonLogic } from './condition-mapper';

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
