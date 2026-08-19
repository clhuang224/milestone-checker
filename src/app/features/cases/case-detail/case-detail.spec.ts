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
    storage.upsertFinding({
      id: 'drooling',
      categoryId: 'swallowing',
      label: '流口水',
      kind: 'boolean',
    });
  });

  function addAssessment(id: string, assessedOnISODate: string) {
    storage.upsertAssessment({ id, caseId: 'case-1', assessedOnISODate });
  }

  it('prompts for an assessment before showing the findings form', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('還沒有任何評估場次');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-findings-form')).toBeNull();
  });

  it('defaults to the newest assessment', async () => {
    addAssessment('older', '2025-06-01');
    addAssessment('newer', '2026-06-01');

    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedAssessment()?.id).toBe('newer');
  });

  it('swaps the recorded findings when the assessment changes', async () => {
    addAssessment('first', '2025-06-01');
    addAssessment('second', '2026-06-01');
    storage.saveProfile({
      assessmentId: 'first',
      values: { drooling: true },
      updatedOnISODate: '2025-06-01',
    });
    storage.saveProfile({
      assessmentId: 'second',
      values: { drooling: false },
      updatedOnISODate: '2026-06-01',
    });

    const fixture = setup();
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual({ drooling: false });

    fixture.componentInstance.selectAssessment('first');
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual({ drooling: true });
  });

  it('reports the age at the assessment date rather than today', async () => {
    // Born 2022-09-05, so this session lands the day before the fourth birthday.
    addAssessment('first', '2026-09-04');

    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.ageLabel()).toBe('3 歲 11 個月');
  });

  it('shows the corrected age only when prematurity makes it differ', async () => {
    addAssessment('first', '2026-09-04');

    const fixture = setup();
    await fixture.whenStable();
    expect(fixture.componentInstance.showsCorrectedAge()).toBe(false);

    fixture.componentInstance.onGestationalWeeksChange('32');
    await fixture.whenStable();
    expect(fixture.componentInstance.showsCorrectedAge()).toBe(false); // past the catch-up window
  });

  it('saves findings against the selected assessment', async () => {
    addAssessment('first', '2026-06-01');

    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.onValuesChange({ drooling: true });

    expect(storage.profileFor('first')?.values).toEqual({ drooling: true });
  });

  it('records a new assessment and switches to it', async () => {
    addAssessment('older', '2025-06-01');

    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.addAssessment();
    await fixture.whenStable();

    expect(storage.assessmentsFor('case-1')).toHaveLength(2);
    expect(fixture.componentInstance.selectedAssessment()?.id).not.toBe('older');
  });
});
