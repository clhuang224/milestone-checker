import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { Case, CaseProfile } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { Rule } from '../../models/rule.model';
import { Storage } from './storage';

const finding: FindingDefinition = {
  id: 'drooling',
  categoryId: 'swallowing',
  label: '流口水',
  kind: 'boolean',
};

const caseRecord: Case = {
  id: 'case-1',
  label: '個案 A',
  createdOnISODate: '2026-01-01',
};

const profile: CaseProfile = {
  caseId: 'case-1',
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
  });

  it('upserts and removes a finding, persisting to localStorage', () => {
    service.upsertFinding(finding);
    expect(service.findings()).toEqual([finding]);

    const persisted = JSON.parse(localStorage.getItem('therapist-rule-engine:findings:v1')!);
    expect(persisted).toEqual([finding]);

    service.removeFinding(finding.id);
    expect(service.findings()).toEqual([]);
  });

  it('replaces an existing finding with the same id', () => {
    service.upsertFinding(finding);
    service.upsertFinding({ ...finding, label: '流口水(修改)' });

    expect(service.findings()).toEqual([{ ...finding, label: '流口水(修改)' }]);
  });

  it('upserts and removes a case, cascading profile removal', () => {
    service.upsertCase(caseRecord);
    service.saveProfile(profile);
    expect(service.cases()).toEqual([caseRecord]);
    expect(service.profiles()).toEqual([profile]);

    service.removeCase(caseRecord.id);
    expect(service.cases()).toEqual([]);
    expect(service.profiles()).toEqual([]);
  });

  it('saveProfile replaces the existing profile for the same case', () => {
    service.upsertCase(caseRecord);
    service.saveProfile(profile);
    const updated: CaseProfile = { ...profile, values: { drooling: false } };
    service.saveProfile(updated);

    expect(service.profileFor(caseRecord.id)).toEqual(updated);
  });

  it('upserts, removes, and bulk-replaces rules', () => {
    service.upsertRule(rule);
    expect(service.rules()).toEqual([rule]);

    const persisted = JSON.parse(localStorage.getItem('therapist-rule-engine:rules:v1')!);
    expect(persisted).toEqual([rule]);

    service.removeRule(rule.id);
    expect(service.rules()).toEqual([]);

    service.replaceRules([rule, { ...rule, id: 'rule-2' }]);
    expect(service.rules()).toEqual([rule, { ...rule, id: 'rule-2' }]);
  });

  it('a fresh instance picks up what an earlier instance persisted', () => {
    service.upsertFinding(finding);
    service.upsertCase(caseRecord);
    service.saveProfile(profile);
    service.upsertRule(rule);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(Storage);

    expect(reloaded.findings()).toEqual([finding]);
    expect(reloaded.cases()).toEqual([caseRecord]);
    expect(reloaded.profiles()).toEqual([profile]);
    expect(reloaded.rules()).toEqual([rule]);
  });

  it('falls back to empty data when localStorage holds corrupt JSON', () => {
    localStorage.setItem('therapist-rule-engine:findings:v1', '{not valid json');
    localStorage.setItem('therapist-rule-engine:cases:v1', '{not valid json');
    localStorage.setItem('therapist-rule-engine:rules:v1', '{not valid json');

    const corrupted = TestBed.inject(Storage);
    expect(corrupted.findings()).toEqual([]);
    expect(corrupted.cases()).toEqual([]);
    expect(corrupted.profiles()).toEqual([]);
    expect(corrupted.rules()).toEqual([]);
  });
});
