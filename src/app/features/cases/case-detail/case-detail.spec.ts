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
      sex: 'female',
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

  describe('native languages', () => {
    function stored() {
      const found = storage.cases().find((c) => c.id === 'case-1');
      if (!found) {
        throw new Error('case-1 missing');
      }
      return found;
    }

    async function openDetails() {
      const fixture = setup();
      await fixture.whenStable();
      fixture.componentInstance.detailsOpen.set(true);
      await fixture.whenStable();
      return fixture;
    }

    function checkbox(fixture: { nativeElement: unknown }, label: string): HTMLInputElement {
      const labels = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLLabelElement>('fieldset label'),
      );
      const match = labels.find((l) => l.textContent?.trim() === label);
      const input = match?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (!input) {
        throw new Error(`no checkbox for ${label}`);
      }
      return input;
    }

    it('leaves both fields absent on a case nobody has asked about', async () => {
      const fixture = await openDetails();
      fixture.componentInstance.onSexChange('male');

      expect('nativeLanguages' in stored()).toBe(false);
      expect('otherNativeLanguages' in stored()).toBe(false);
    });

    it('goes back to absent, not [], when the last box is unchecked', async () => {
      const fixture = await openDetails();
      checkbox(fixture, '台灣台語').click();
      await fixture.whenStable();
      checkbox(fixture, '台灣台語').click();
      await fixture.whenStable();

      expect('nativeLanguages' in stored()).toBe(false);
    });

    it('persists two checked languages and shows them checked again on reload', async () => {
      const fixture = await openDetails();
      checkbox(fixture, '台灣台語').click();
      await fixture.whenStable();
      checkbox(fixture, '華語').click();
      await fixture.whenStable();

      expect(stored().nativeLanguages).toEqual(['mandarin', 'taiwanese']);

      fixture.destroy();
      const reloaded = await openDetails();
      expect(checkbox(reloaded, '華語').checked).toBe(true);
      expect(checkbox(reloaded, '台灣台語').checked).toBe(true);
      expect(checkbox(reloaded, '台灣客語').checked).toBe(false);
    });

    it('refuses a built-in language typed into 其他 and points to the checkbox', async () => {
      const fixture = await openDetails();
      fixture.componentInstance.addOtherLanguages(' 台灣台語 ');
      await fixture.whenStable();

      expect(stored().otherNativeLanguages).toBeUndefined();
      expect(textOf(fixture)).toContain('「台灣台語」在清單上，請直接勾選。');
    });

    it('refuses a shortened name of a built-in language too', async () => {
      const fixture = await openDetails();
      fixture.componentInstance.addOtherLanguages('台語');

      expect(stored().otherNativeLanguages).toBeUndefined();
    });

    it('accepts a language whose name merely contains a built-in label', async () => {
      // 馬來西亞華語 is a distinct background from 華語; refusing it would leave no way to record it.
      const fixture = await openDetails();
      fixture.componentInstance.addOtherLanguages('馬來西亞華語');

      expect(stored().otherNativeLanguages).toEqual(['馬來西亞華語']);
    });

    it('saves a genuinely other language as typed, trimmed and without duplicates', async () => {
      const fixture = await openDetails();
      fixture.componentInstance.addOtherLanguages('  日語 ');
      fixture.componentInstance.addOtherLanguages('日語、');

      expect(stored().otherNativeLanguages).toEqual(['日語']);
      // Answered, just not from the list: a rule asking about a listed language reads no.
      expect(stored().nativeLanguages).toEqual([]);

      fixture.componentInstance.removeOtherLanguage('日語');
      expect('otherNativeLanguages' in stored()).toBe(false);
      expect('nativeLanguages' in stored()).toBe(false);
    });
  });
});
