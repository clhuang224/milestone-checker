import { describe, expect, it } from 'vitest';

import { ArticulationProbe } from '../../models/articulation-record.model';
import { Case, RecordProfile } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { SessionRecord } from '../../models/session-record.model';
import { RuleFacts, buildFacts } from './facts';
import { evaluateCondition } from './json-logic';
import {
  ConditionGroup,
  ConditionRow,
  ConditionSetRow,
  defaultGroup,
  defaultRow,
  defaultSetRow,
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

describe('applicability (set) rows', () => {
  const excludeRetroflex: ConditionSetRow = {
    type: 'set',
    subject: 'articulationTarget',
    mode: 'excludes',
    values: ['zh', 'ch', 'sh', 'r'],
  };

  it('serializes an includes row to a plain membership test', () => {
    const row: ConditionSetRow = { ...excludeRetroflex, mode: 'includes' };

    expect(toJsonLogic(row)).toEqual({
      some: [
        { var: 'articulation.errors' },
        { in: [{ var: 'targetPhonemeId' }, ['zh', 'ch', 'sh', 'r']] },
      ],
    });
  });

  it('serializes an excludes row by negating the predicate, not the whole some', () => {
    // The negation has to sit inside `some` — wrapping the outer `some` would flip the meaning
    // to "no retroflex errors at all" instead of "some error that is not retroflex".
    expect(toJsonLogic(excludeRetroflex)).toEqual({
      some: [
        { var: 'articulation.errors' },
        { '!': { in: [{ var: 'targetPhonemeId' }, ['zh', 'ch', 'sh', 'r']] } },
      ],
    });
  });

  it('nests a second some for process ids, which are a list on each error', () => {
    const row: ConditionSetRow = {
      type: 'set',
      subject: 'articulationProcess',
      mode: 'includes',
      values: ['vowelNasalization'],
    };

    expect(toJsonLogic(row)).toEqual({
      some: [
        { var: 'articulation.errors' },
        { some: [{ var: 'processIds' }, { in: [{ var: '' }, ['vowelNasalization']] }] },
      ],
    });
  });

  it('round-trips every subject and mode combination', () => {
    const subjects = ['articulationTarget', 'articulationCategory', 'articulationProcess'] as const;
    const modes = ['includes', 'excludes'] as const;

    for (const subject of subjects) {
      for (const mode of modes) {
        const row: ConditionSetRow = { type: 'set', subject, mode, values: ['a', 'b'] };
        expect(fromJsonLogic(toJsonLogic(row))).toEqual(row);
      }
    }
  });

  it('round-trips a set row mixed into an AND group', () => {
    const group: ConditionGroup = {
      type: 'group',
      combinator: 'and',
      children: [
        { type: 'row', fieldId: 'case.ageInMonths', operator: '>', value: 48 },
        excludeRetroflex,
      ],
    };

    expect(fromJsonLogic(toJsonLogic(group))).toEqual(group);
  });

  it('rejects a some over something other than the error list', () => {
    expect(() => fromJsonLogic({ some: [{ var: 'somethingElse' }, { '==': [1, 1] }] })).toThrow(
      /Unsupported JsonLogic "some" target/,
    );
  });

  it('rejects a some whose predicate is not a recognised membership test', () => {
    expect(() =>
      fromJsonLogic({ some: [{ var: 'articulation.errors' }, { '==': [1, 1] }] }),
    ).toThrow(/Unsupported JsonLogic "some" predicate/);
  });
});

describe('defaultRow / defaultGroup', () => {
  const booleanField: FindingDefinition = {
    id: 'drooling',
    label: '流口水',
    kind: 'boolean',
  };
  const numberField: FindingDefinition = {
    id: 'oralMotorScore',
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

describe('defaultSetRow evaluated, not just round-tripped', () => {
  const oneError = {
    case: {},
    articulation: { errors: [{ targetPhonemeId: 'zh', processIds: [] }] },
    swallowing: { trials: [] },
  } as unknown as RuleFacts;

  it('matches nothing before any sound is picked', () => {
    // The bug this pins: the row used to default to `excludes`, which compiles to
    // 「扣掉零個音之後還有錯誤嗎」 — true for every case with any articulation error. A rule
    // saved without ticking anything fired on nearly everyone, and the editor said it would not.
    expect(evaluateCondition(toJsonLogic(defaultSetRow()), oneError)).toBe(false);
  });

  it('still reads an empty excludes row as "has some other error", which is what it means', () => {
    const row: ConditionSetRow = { ...defaultSetRow(), mode: 'excludes' };

    expect(evaluateCondition(toJsonLogic(row), oneError)).toBe(true);
  });
});

describe('category (articulationCategory) set rows', () => {
  const ON_DATE = '2026-08-20';
  const caseRecord: Case = {
    id: 'case-1',
    label: '個案 A',
    sex: 'female',
    createdOnISODate: '2026-08-01',
  };
  const record: SessionRecord = {
    id: 'record-1',
    caseId: 'case-1',
    onISODate: ON_DATE,
    formIds: ['articulation'],
  };
  const profile: RecordProfile = { recordId: 'record-1', values: {}, updatedOnISODate: ON_DATE };

  function probe(targetPhonemeId: string, heard: string): ArticulationProbe {
    return {
      id: `probe-${targetPhonemeId}`,
      caseId: 'case-1',
      recordId: 'record-1',
      targetPhonemeId,
      items: [{ word: '詞', heard }],
      updatedOnISODate: ON_DATE,
    };
  }

  function factsFor(probes: ArticulationProbe[]): RuleFacts {
    return buildFacts(caseRecord, record, profile, probes, [], []);
  }

  const includesTone: ConditionSetRow = {
    type: 'set',
    subject: 'articulationCategory',
    mode: 'includes',
    values: ['tone'],
  };
  const excludesTone: ConditionSetRow = { ...includesTone, mode: 'excludes' };

  it("serializes to a membership test on each error's targetCategory", () => {
    expect(toJsonLogic({ ...includesTone, values: ['initial'] })).toEqual({
      some: [{ var: 'articulation.errors' }, { in: [{ var: 'targetCategory' }, ['initial']] }],
    });
  });

  it('round-trips includes and excludes rows unchanged', () => {
    expect(fromJsonLogic(toJsonLogic(includesTone))).toEqual(includesTone);
    expect(fromJsonLogic(toJsonLogic(excludesTone))).toEqual(excludesTone);
  });

  describe('evaluated against facts from buildFacts()', () => {
    // A tone error (tone2 heard as tone3) and an initial error (ㄓ heard as ㄉ).
    const toneOnly = factsFor([probe('tone2', 'ˇ')]);
    const toneAndInitial = factsFor([probe('tone2', 'ˇ'), probe('zh', 'ㄉ')]);

    it('produces the categories the rows below rely on', () => {
      expect(toneOnly.articulation.errors.map((error) => error.targetCategory)).toEqual(['tone']);
      expect(toneAndInitial.articulation.errors.map((error) => error.targetCategory)).toEqual([
        'tone',
        'initial',
      ]);
    });

    it('matches 「包含 聲調」 on a case whose only errors are tone errors', () => {
      expect(evaluateCondition(toJsonLogic(includesTone), toneOnly)).toBe(true);
    });

    it('does not match 「排除 聲調」 when nothing remains outside the tone category', () => {
      expect(evaluateCondition(toJsonLogic(excludesTone), toneOnly)).toBe(false);
    });

    it('matches 「排除 聲調」 when an error outside the tone category remains', () => {
      expect(evaluateCondition(toJsonLogic(excludesTone), toneAndInitial)).toBe(true);
    });
  });
});
