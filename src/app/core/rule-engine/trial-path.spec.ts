import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { Case, RecordProfile } from '../../models/case.model';
import { Rule } from '../../models/rule.model';
import { SessionRecord } from '../../models/session-record.model';
import { SwallowTrial } from '../../models/swallow-trial.model';
import { Storage } from '../storage/storage';
import { ConditionTrialRow, toJsonLogic } from './condition-mapper';
import { buildFacts } from './facts';
import { evaluateRules } from './json-logic';

/**
 * The whole path a trial condition actually travels: authored in the editor's model, compiled to
 * JsonLogic, stored as a SwallowTrial, read back through Storage into buildFacts(), evaluated.
 *
 * Hand-building the facts object is what let the missing `swallowing` namespace go unnoticed —
 * the compiled rules were right and the facts they ran against were fabricated by the test. So
 * nothing here constructs a fact literal.
 */

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
  formIds: ['swallowing'],
};

const profile: RecordProfile = { recordId: 'record-1', values: {}, updatedOnISODate: ON_DATE };

/** 「清水 3cc 以下會嗆咳」 — ids are the starter catalogue's, not invented ones. */
const thinUnder3ccChokes: ConditionTrialRow = {
  type: 'trial',
  consistencyIds: ['thin'],
  volume: { operator: '<=', cc: 3 },
  successPercent: { operator: '<', percent: 100 },
};

const rule: Rule = {
  id: 'rule-1',
  name: '清水 3cc 以下嗆咳',
  condition: toJsonLogic(thinUnder3ccChokes),
  action: { message: '建議暫緩稀薄液體，改以增稠液體進食', severity: 'warning' },
  enabled: true,
};

/** 3 口中嗆咳 1 口 → 67%, i.e. 會嗆咳. */
function chokingTrial(overrides: Partial<SwallowTrial> = {}): SwallowTrial {
  return {
    id: 'trial-1',
    caseId: 'case-1',
    recordId: 'record-1',
    consistencyId: 'thin',
    volumeCc: 3,
    flagIds: [],
    outcome: { kind: 'counted', unitId: 'mouthful', attempts: 3, chokes: 1, comparison: 'eq' },
    updatedOnISODate: ON_DATE,
    ...overrides,
  };
}

describe('swallow trial conditions, through the real storage and facts path', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    storage = TestBed.inject(Storage);

    storage.upsertCase(caseRecord);
    storage.upsertSessionRecord(record);
    storage.saveProfile(profile);
  });

  /** Reads the trials back out of Storage rather than being handed them. */
  function factsForRecord() {
    return buildFacts(
      caseRecord,
      record,
      storage.profileFor(record.id)!,
      storage.probesForSessionRecord(record.id),
      [],
      storage.trialsForSessionRecord(record.id),
    );
  }

  function firedRules(): string[] {
    return evaluateRules([rule], factsForRecord()).map((r) => r.id);
  }

  it('fires on a stored trial that matches, which it could not before the namespace existed', () => {
    storage.upsertTrial(chokingTrial());

    expect(firedRules()).toEqual(['rule-1']);
  });

  it('derives the success rate from the recorded counts, not from a stored percentage', () => {
    storage.upsertTrial(chokingTrial());

    expect(factsForRecord().swallowing.trials).toEqual([
      { consistencyId: 'thin', volumeCc: 3, successPercent: 67 },
    ]);
  });

  it('does not fire when nothing was choked', () => {
    storage.upsertTrial(
      chokingTrial({
        outcome: { kind: 'counted', unitId: 'mouthful', attempts: 3, chokes: 0, comparison: 'eq' },
      }),
    );

    expect(firedRules()).toEqual([]);
  });

  it('does not fire on the discharge trial that has no volume to measure', () => {
    // 「以湯匙進食醫院果泥」 — a real trial with no cc. The missing volume must survive Storage
    // and buildFacts as absent, or the compiled `!= null` guard has nothing to guard.
    storage.upsertTrial(
      chokingTrial({ consistencyId: 'thin', volumeCc: undefined, testFood: '醫院果泥' }),
    );

    expect(factsForRecord().swallowing.trials[0].volumeCc).toBeUndefined();
    expect(firedRules()).toEqual([]);
  });

  it('does not fire when no trial was recorded at all', () => {
    expect(firedRules()).toEqual([]);
  });

  it('does not see a trial recorded under a different session', () => {
    storage.upsertSessionRecord({ ...record, id: 'record-2', onISODate: '2026-08-27' });
    storage.upsertTrial(chokingTrial({ id: 'trial-2', recordId: 'record-2' }));

    expect(factsForRecord().swallowing.trials).toEqual([]);
    expect(firedRules()).toEqual([]);
  });

  it('takes the trials with it when the session is deleted', () => {
    storage.upsertTrial(chokingTrial());
    expect(firedRules()).toEqual(['rule-1']);

    storage.removeRecord(record.id);

    // Not re-evaluated afterwards: nothing builds facts for a record that no longer exists, and
    // pretending otherwise would need a profile the cascade has already deleted.
    expect(storage.swallowTrials()).toEqual([]);
    expect(storage.trialsForSessionRecord(record.id)).toEqual([]);
  });
});
