import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { Storage } from '../../../core/storage/storage';
import { RecordDetail, REPORT_TAB, WARNINGS_TAB } from './record-detail';

function setup(formId = 'articulation') {
  const fixture = TestBed.createComponent(RecordDetail);
  fixture.componentRef.setInput('caseId', 'case-1');
  fixture.componentRef.setInput('recordId', 'record-1');
  fixture.componentRef.setInput('formId', formId);
  return fixture;
}

function textOf(fixture: { nativeElement: unknown }): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('RecordDetail', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [RecordDetail],
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
    storage.upsertSessionRecord({
      id: 'record-1',
      caseId: 'case-1',
      onISODate: '2026-09-04',
      formIds: ['articulation'],
    });
  });

  it('shows the attached forms plus warnings and report', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.tabs().map((t) => t.id)).toEqual([
      'articulation',
      WARNINGS_TAB,
      REPORT_TAB,
    ]);
  });

  it('does not offer a form that is not attached', async () => {
    storage.upsertAssessmentForm({
      id: 'swallowing',
      name: '吞嚥評估表',
      body: { kind: 'swallowTrials' },
      builtin: true,
    });

    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.tabs().map((t) => t.id)).not.toContain('swallowing');
  });

  it('reports the age on the day of the session', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.ageLabel()).toBe('3 歲 11 個月');
  });

  it('renders the report tab, not the form, when the report is selected', async () => {
    const fixture = setup(REPORT_TAB);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-report-draft')).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-articulation-table'),
    ).toBeNull();
  });

  it('keeps the report draft against this record when edited', async () => {
    const fixture = setup(REPORT_TAB);
    await fixture.whenStable();

    const textarea = (fixture.nativeElement as HTMLElement).querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.value = '治療師改過的內容';
    textarea.dispatchEvent(new Event('input'));

    expect(storage.reportFor('record-1')?.text).toBe('治療師改過的內容');
  });

  it('does not render the articulation grid for a form of another kind', async () => {
    // Rendering the grid for a SOAP or swallowing tab would look like it worked.
    storage.upsertAssessmentForm({
      id: 'swallowing',
      name: '吞嚥評估表',
      body: { kind: 'swallowTrials' },
      builtin: true,
    });
    storage.upsertSessionRecord({
      id: 'record-1',
      caseId: 'case-1',
      onISODate: '2026-09-04',
      formIds: ['articulation', 'swallowing'],
    });

    const fixture = setup('swallowing');
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-articulation-table'),
    ).toBeNull();
    expect(textOf(fixture)).toContain('的畫面還沒做');
  });

  it('says the record is missing rather than rendering an empty shell', async () => {
    const fixture = TestBed.createComponent(RecordDetail);
    fixture.componentRef.setInput('caseId', 'case-1');
    fixture.componentRef.setInput('recordId', 'nope');
    fixture.componentRef.setInput('formId', 'articulation');
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('找不到這筆課節紀錄');
  });
});
