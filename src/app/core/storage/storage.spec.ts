import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ArticulationProbe } from '../../models/articulation-record.model';
import { SessionRecord } from '../../models/session-record.model';
import { RecordProfile, Case } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { PhonologicalProcessDefinition } from '../../models/phonological-process.model';
import { Rule } from '../../models/rule.model';
import { Storage } from './storage';

const finding: FindingDefinition = {
  id: 'drooling',
  label: '流口水',
  kind: 'boolean',
};

const caseRecord: Case = {
  id: 'case-1',
  label: '個案 A',
  createdOnISODate: '2026-01-01',
};

const assessment: SessionRecord = {
  id: 'assessment-1',
  caseId: 'case-1',
  onISODate: '2026-01-02',
  formIds: ['articulation'],
};

const profile: RecordProfile = {
  recordId: 'assessment-1',
  values: { drooling: true },
  updatedOnISODate: '2026-01-02',
};

const rule: Rule = {
  id: 'rule-1',
  name: '流口水警示',
  condition: { '==': [{ var: 'drooling' }, true] },
  action: { message: '建議進一步評估口腔動作', severity: 'warning' },
  enabled: true,
};

const process: PhonologicalProcessDefinition = {
  id: 'deaspiration',
  name: '不送氣化',
  builtin: true,
};

const probe: ArticulationProbe = {
  id: 'probe-1',
  caseId: 'case-1',
  recordId: 'assessment-1',
  targetPhonemeId: 'p',
  items: [{ word: '拼', heard: 'ㄅㄧㄣ' }],
  updatedOnISODate: '2026-01-02',
};

describe('Storage', () => {
  let service: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Storage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts empty when localStorage has nothing', () => {
    expect(service.findings()).toEqual([]);
    expect(service.cases()).toEqual([]);
    expect(service.profiles()).toEqual([]);
    expect(service.rules()).toEqual([]);
    expect(service.articulationProcesses()).toEqual([]);
    expect(service.articulationRecords()).toEqual([]);
  });

  it('upserts and removes a finding, persisting to localStorage', () => {
    service.upsertFinding(finding);
    expect(service.findings()).toEqual([finding]);

    const persisted = JSON.parse(localStorage.getItem('therapist-rule-engine:findings:v5')!);
    expect(persisted).toEqual([finding]);

    service.removeFinding(finding.id);
    expect(service.findings()).toEqual([]);
  });

  it('replaces an existing finding with the same id', () => {
    service.upsertFinding(finding);
    service.upsertFinding({ ...finding, label: '流口水（修改）' });

    expect(service.findings()).toEqual([{ ...finding, label: '流口水（修改）' }]);
  });

  it('upserts and removes a case, cascading profile removal', () => {
    service.upsertCase(caseRecord);
    service.upsertSessionRecord(assessment);
    service.saveProfile(profile);
    expect(service.cases()).toEqual([caseRecord]);
    expect(service.profiles()).toEqual([profile]);

    service.removeCase(caseRecord.id);
    expect(service.cases()).toEqual([]);
    expect(service.profiles()).toEqual([]);
  });

  it('saveProfile replaces the existing profile for the same assessment', () => {
    service.upsertCase(caseRecord);
    service.upsertSessionRecord(assessment);
    service.saveProfile(profile);
    const updated: RecordProfile = { ...profile, values: { drooling: false } };
    service.saveProfile(updated);

    expect(service.profileFor(assessment.id)).toEqual(updated);
  });

  it('upserts, removes, and bulk-replaces rules', () => {
    service.upsertRule(rule);
    expect(service.rules()).toEqual([rule]);

    const persisted = JSON.parse(localStorage.getItem('therapist-rule-engine:rules:v5')!);
    expect(persisted).toEqual([rule]);

    service.removeRule(rule.id);
    expect(service.rules()).toEqual([]);

    service.replaceRules([rule, { ...rule, id: 'rule-2' }]);
    expect(service.rules()).toEqual([rule, { ...rule, id: 'rule-2' }]);
  });

  it('upserts and removes an articulation process, persisting to localStorage', () => {
    service.upsertArticulationProcess(process);
    expect(service.articulationProcesses()).toEqual([process]);

    const persisted = JSON.parse(
      localStorage.getItem('therapist-rule-engine:articulation-processes:v5')!,
    );
    expect(persisted).toEqual([process]);

    service.removeArticulationProcess(process.id);
    expect(service.articulationProcesses()).toEqual([]);
  });

  it('upserts, filters by case, and removes probes', () => {
    const otherCase: ArticulationProbe = {
      ...probe,
      id: 'sub-2',
      caseId: 'case-2',
    };
    service.upsertProbe(probe);
    service.upsertProbe(otherCase);

    expect(service.probesFor('case-1')).toEqual([probe]);
    expect(service.probesFor('case-2')).toEqual([otherCase]);

    const persisted = JSON.parse(
      localStorage.getItem('therapist-rule-engine:articulation-records:v5')!,
    );
    expect(persisted).toEqual([probe, otherCase]);

    service.removeProbe(probe.id);
    expect(service.probesFor('case-1')).toEqual([]);
  });

  it('replaces an existing probe with the same id', () => {
    service.upsertProbe(probe);
    const edited: ArticulationProbe = { ...probe, items: [{ word: '拼', heard: '' }] };
    service.upsertProbe(edited);

    expect(service.articulationRecords()).toEqual([edited]);
  });

  it('drops a deleted process from any manual summary naming it', () => {
    service.upsertArticulationProcess(process);
    service.saveSummary({
      recordId: 'assessment-1',
      useDerived: false,
      manual: [
        { processId: 'deaspiration', targetPhonemeIds: ['p'] },
        { processId: 'backing', targetPhonemeIds: ['d'] },
      ],
    });

    service.removeArticulationProcess('deaspiration');

    expect(service.summaryFor('assessment-1')?.manual).toEqual([
      { processId: 'backing', targetPhonemeIds: ['d'] },
    ]);
  });

  it('removes a summary along with its assessment', () => {
    service.upsertSessionRecord(assessment);
    service.saveSummary({ recordId: 'assessment-1', useDerived: false, manual: [] });

    service.removeRecord('assessment-1');

    expect(service.summaryFor('assessment-1')).toBeUndefined();
  });

  it('removing an assessment drops its profile and probes', () => {
    service.upsertCase(caseRecord);
    service.upsertSessionRecord(assessment);
    service.upsertSessionRecord({
      ...assessment,
      id: 'assessment-2',
      onISODate: '2026-02-01',
      formIds: ['articulation'],
    });
    service.saveProfile(profile);
    service.saveProfile({ ...profile, recordId: 'assessment-2' });
    service.upsertProbe(probe);
    service.upsertProbe({ ...probe, id: 'sub-2', recordId: 'assessment-2' });

    service.removeRecord('assessment-1');

    expect(service.recordsFor('case-1').map((a) => a.id)).toEqual(['assessment-2']);
    expect(service.profileFor('assessment-1')).toBeUndefined();
    expect(service.profileFor('assessment-2')).toBeDefined();
    expect(service.probesForSessionRecord('assessment-1')).toEqual([]);
    expect(service.probesForSessionRecord('assessment-2')).toHaveLength(1);
  });

  it('lists a case’s assessments newest first', () => {
    service.upsertSessionRecord({
      ...assessment,
      id: 'older',
      onISODate: '2025-06-01',
      formIds: ['articulation'],
    });
    service.upsertSessionRecord({
      ...assessment,
      id: 'newer',
      onISODate: '2026-06-01',
      formIds: ['articulation'],
    });

    expect(service.recordsFor('case-1').map((a) => a.id)).toEqual(['newer', 'older']);
  });

  it('fills a probe’s caseId from its assessment, so the two cannot drift', () => {
    service.upsertSessionRecord(assessment);
    service.upsertProbe({ ...probe, caseId: 'wrong-case' });

    expect(service.articulationRecords()[0].caseId).toBe('case-1');
  });

  it('removing a case also drops its assessments and probes', () => {
    service.upsertCase(caseRecord);
    service.upsertSessionRecord(assessment);
    service.upsertSessionRecord({
      id: 'assessment-other',
      caseId: 'case-2',
      onISODate: '2026-01-02',
      formIds: ['articulation'],
    });
    service.saveProfile(profile);
    service.upsertProbe(probe);
    service.upsertProbe({
      ...probe,
      id: 'sub-2',
      caseId: 'case-2',
      recordId: 'assessment-other',
    });

    service.removeCase(caseRecord.id);

    expect(service.recordsFor('case-1')).toEqual([]);
    expect(service.recordsFor('case-2')).toHaveLength(1);
    expect(service.profileFor('assessment-1')).toBeUndefined();
    expect(service.probesFor('case-1')).toEqual([]);
    expect(service.probesFor('case-2')).toHaveLength(1);
  });

  it('a fresh instance picks up what an earlier instance persisted', () => {
    service.upsertFinding(finding);
    service.upsertCase(caseRecord);
    service.upsertSessionRecord(assessment);
    service.saveProfile(profile);
    service.upsertRule(rule);
    service.upsertArticulationProcess(process);
    service.upsertProbe(probe);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(Storage);

    expect(reloaded.findings()).toEqual([finding]);
    expect(reloaded.cases()).toEqual([caseRecord]);
    expect(reloaded.profiles()).toEqual([profile]);
    expect(reloaded.rules()).toEqual([rule]);
    expect(reloaded.articulationProcesses()).toEqual([process]);
    expect(reloaded.articulationRecords()).toEqual([probe]);
  });

  it('falls back to empty data when localStorage holds corrupt JSON', () => {
    localStorage.setItem('therapist-rule-engine:findings:v5', '{not valid json');
    localStorage.setItem('therapist-rule-engine:cases:v5', '{not valid json');
    localStorage.setItem('therapist-rule-engine:rules:v5', '{not valid json');
    localStorage.setItem('therapist-rule-engine:articulation-processes:v5', '{not valid json');
    localStorage.setItem('therapist-rule-engine:articulation-records:v5', '{not valid json');

    const corrupted = TestBed.inject(Storage);
    expect(corrupted.findings()).toEqual([]);
    expect(corrupted.cases()).toEqual([]);
    expect(corrupted.profiles()).toEqual([]);
    expect(corrupted.rules()).toEqual([]);
    expect(corrupted.articulationProcesses()).toEqual([]);
    expect(corrupted.articulationRecords()).toEqual([]);
  });
});
