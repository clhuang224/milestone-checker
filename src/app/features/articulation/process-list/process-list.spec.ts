import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { Storage } from '../../../core/storage/storage';
import { STARTER_ARTICULATION_PROCESSES } from '../../../data/starter-articulation-processes';
import { ProcessList } from './process-list';

describe('ProcessList', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ProcessList] });
    storage = TestBed.inject(Storage);
  });

  it('renders the empty-state message when the catalogue is empty', async () => {
    const fixture = TestBed.createComponent(ProcessList);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('還沒有任何音韻歷程');
  });

  it('keeps the placeholder bookkeeping note off the screen', async () => {
    storage.upsertArticulationProcess(STARTER_ARTICULATION_PROCESSES[0]);

    const fixture = TestBed.createComponent(ProcessList);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('不送氣化');
    expect(text).not.toContain('待審核');
    expect(text).not.toContain('預設項目');
  });

  it('still shows a rationale the therapist wrote themselves', async () => {
    storage.upsertArticulationProcess({
      id: 'custom',
      name: '自訂歷程',
      builtin: false,
      sourceNote: '這個孩子的個別化目標',
    });

    const fixture = TestBed.createComponent(ProcessList);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('這個孩子的個別化目標');
  });

  it('saves a new therapist-authored process', async () => {
    const fixture = TestBed.createComponent(ProcessList);
    await fixture.whenStable();

    fixture.componentInstance.startCreate();
    fixture.componentInstance.updateDraft('name', '  自訂歷程  ');
    fixture.componentInstance.save();
    await fixture.whenStable();

    const saved = storage.articulationProcesses();
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('自訂歷程');
    expect(saved[0].builtin).toBe(false);
  });

  it('refuses to save a process with a blank name', async () => {
    const fixture = TestBed.createComponent(ProcessList);
    await fixture.whenStable();

    fixture.componentInstance.startCreate();
    fixture.componentInstance.updateDraft('name', '   ');

    expect(fixture.componentInstance.canSave()).toBe(false);
    fixture.componentInstance.save();
    expect(storage.articulationProcesses()).toEqual([]);
  });

  it('keeps the builtin flag when editing a builtin entry', async () => {
    storage.upsertArticulationProcess({ id: 'backing', name: '後置化', builtin: true });

    const fixture = TestBed.createComponent(ProcessList);
    await fixture.whenStable();

    fixture.componentInstance.startEdit(storage.articulationProcesses()[0]);
    fixture.componentInstance.updateDraft('description', '舌尖音變舌根音');
    fixture.componentInstance.save();

    expect(storage.articulationProcesses()).toEqual([
      { id: 'backing', name: '後置化', description: '舌尖音變舌根音', builtin: true },
    ]);
  });
});
