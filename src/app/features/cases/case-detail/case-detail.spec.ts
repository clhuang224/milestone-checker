import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { Storage } from '../../../core/storage/storage';
import { CaseDetail } from './case-detail';

function setup() {
  const fixture = TestBed.createComponent(CaseDetail);
  fixture.componentRef.setInput('id', 'case-1');
  return fixture;
}

function textOf(fixture: { nativeElement: unknown }): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('CaseDetail', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CaseDetail],
      providers: [provideRouter([])],
    });
    storage = TestBed.inject(Storage);
    storage.upsertCase({
      id: 'case-1',
      label: '個案 A',
      createdOnISODate: '2026-01-01',
      birthDateISO: '2022-09-05',
    });
    storage.upsertAssessmentForm({
      id: 'articulation',
      name: '構音評估表',
      body: { kind: 'articulationGrid' },
      builtin: true,
    });
  });

  function addRecord(id: string, onISODate: string, formIds = ['articulation']) {
    storage.upsertSessionRecord({ id, caseId: 'case-1', onISODate, formIds });
  }

  it('says so when there are no records yet', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('還沒有任何課節紀錄');
  });

  it('lists records newest first', async () => {
    addRecord('older', '2025-06-01');
    addRecord('newer', '2026-06-01');

    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.rows().map((r) => r.record.id)).toEqual(['newer', 'older']);
  });

  it('names the forms attached, which is how a session is recognised', async () => {
    addRecord('first', '2026-06-01');

    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.rows()[0].formNames).toBe('構音評估表');
  });

  it('shows the age on the day of the session, not today', async () => {
    // Born 2022-09-05, so this session lands the day before the fourth birthday.
    addRecord('first', '2026-09-04');

    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.rows()[0].ageLabel).toBe('3 歲 11 個月');
  });

  it('keeps basic details collapsed, so the table is what you land on', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.detailsOpen()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('#case-birth-date')).toBeNull();
  });

  it('refuses to create a record with no form attached', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startCompose();
    expect(fixture.componentInstance.canCreate()).toBe(false);
    expect(fixture.componentInstance.createRecord()).toBeUndefined();
    expect(storage.recordsFor('case-1')).toEqual([]);
  });

  it('creates a record with the forms picked', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startCompose();
    fixture.componentInstance.toggleDraftForm('articulation');
    fixture.componentInstance.createRecord();

    const [record] = storage.recordsFor('case-1');
    expect(record.formIds).toEqual(['articulation']);
  });
});
