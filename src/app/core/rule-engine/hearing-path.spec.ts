import { describe, expect, it } from 'vitest';

import { Case, CaseHearing, HearingStatus, RecordProfile } from '../../models/case.model';
import { Rule } from '../../models/rule.model';
import { SessionRecord } from '../../models/session-record.model';
import { ConditionRow, toJsonLogic } from './condition-mapper';
import {
  BETTER_EAR_NORMAL_FIELD_ID,
  LEFT_EAR_NORMAL_FIELD_ID,
  RIGHT_EAR_NORMAL_FIELD_ID,
  buildFacts,
  ruleFields,
} from './facts';
import { evaluateRules } from './json-logic';

/**
 * Hearing rules over the real path: a Case through buildFacts(), a condition compiled from the
 * editor's own row model, evaluated by evaluateRules(). No fact literal is built here — the
 * missing-field guard only means something against facts buildFacts() actually produces.
 */

const ON_DATE = '2026-08-20';

const record: SessionRecord = {
  id: 'record-1',
  caseId: 'case-1',
  onISODate: ON_DATE,
  formIds: [],
};

const profile: RecordProfile = { recordId: 'record-1', values: {}, updatedOnISODate: ON_DATE };

function caseWith(hearing: CaseHearing): Case {
  return {
    id: 'case-1',
    label: '個案 A',
    sex: 'female',
    createdOnISODate: '2026-08-01',
    hearing,
  };
}

function booleanRule(fieldId: string, value: boolean): Rule {
  const row: ConditionRow = { type: 'row', fieldId, operator: '==', value };
  return {
    id: `${fieldId}-${String(value)}`,
    name: `${fieldId} == ${String(value)}`,
    condition: toJsonLogic(row),
    action: { message: '測試', severity: 'info' },
    enabled: true,
  };
}

function fires(rule: Rule, hearing: CaseHearing): boolean {
  const facts = buildFacts(caseWith(hearing), record, profile, [], [], []);
  return evaluateRules([rule], facts).length === 1;
}

const betterEarNormal = booleanRule(BETTER_EAR_NORMAL_FIELD_ID, true);
const betterEarNotNormal = booleanRule(BETTER_EAR_NORMAL_FIELD_ID, false);

describe('hearing rules through buildFacts and evaluateRules', () => {
  it('offers the three hearing facts as boolean fields, with the better-ear basis in the label', () => {
    const fields = ruleFields([]).filter((field) => field.id.startsWith('case.hearing.'));

    expect(fields).toEqual([
      { id: BETTER_EAR_NORMAL_FIELD_ID, label: '整體聽力正常（優耳）', kind: 'boolean' },
      { id: LEFT_EAR_NORMAL_FIELD_ID, label: '左耳聽力正常', kind: 'boolean' },
      { id: RIGHT_EAR_NORMAL_FIELD_ID, label: '右耳聽力正常', kind: 'boolean' },
    ]);
  });

  it('does not fire a left-ear rule when only the right ear is recorded', () => {
    for (const value of [true, false]) {
      expect(fires(booleanRule(LEFT_EAR_NORMAL_FIELD_ID, value), { right: 'normal' })).toBe(false);
      expect(fires(booleanRule(LEFT_EAR_NORMAL_FIELD_ID, value), { right: 'abnormal' })).toBe(
        false,
      );
    }
    // The right-ear rule on the same case does fire, so the silence above is the guard at work.
    expect(fires(booleanRule(RIGHT_EAR_NORMAL_FIELD_ID, true), { right: 'normal' })).toBe(true);
  });

  /**
   * The pin. With one ear non-normal and the other unrecorded, the better ear is unknown — the
   * unrecorded ear could be the better one — so betterEarNormal must stay undefined and the
   * missing-field guard must keep BOTH rules silent. Someone "simplifying" that undefined to
   * false would make 「整體聽力正常 == false」 fire on a case whose better ear nobody knows, and
   * every other test would still pass. This one is what objects.
   */
  describe.each<HearingStatus>(['abnormal', 'aided'])(
    'one ear %s and the other unrecorded',
    (status) => {
      it.each<CaseHearing>([{ left: status }, { right: status }])(
        'fires neither the == true nor the == false overall rule (%o)',
        (hearing) => {
          expect(fires(betterEarNormal, hearing)).toBe(false);
          expect(fires(betterEarNotNormal, hearing)).toBe(false);
        },
      );
    },
  );

  it('fires the == false overall rule when both ears are recorded non-normal', () => {
    expect(fires(betterEarNotNormal, { left: 'abnormal', right: 'aided' })).toBe(true);
    expect(fires(betterEarNormal, { left: 'abnormal', right: 'aided' })).toBe(false);
  });

  it('fires the == true overall rule when one ear is normal, even with the other unrecorded', () => {
    expect(fires(betterEarNormal, { left: 'normal' })).toBe(true);
    expect(fires(betterEarNormal, { left: 'abnormal', right: 'normal' })).toBe(true);
    expect(fires(betterEarNotNormal, { left: 'normal' })).toBe(false);
  });
});
