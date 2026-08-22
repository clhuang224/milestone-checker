import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { Storage } from '../../../core/storage/storage';
import { ArticulationProbe } from '../../../models/articulation-record.model';
import { ProcessSummary } from './process-summary';

function probe(targetPhonemeId: string, heard: string): ArticulationProbe {
  return {
    id: `probe-${targetPhonemeId}`,
    caseId: 'case-1',
    assessmentId: 'assessment-1',
    targetPhonemeId,
    items: [{ word: '詞', heard }],
    updatedOnISODate: '2026-08-19',
  };
}

function setup(probes: ArticulationProbe[]) {
  const fixture = TestBed.createComponent(ProcessSummary);
  fixture.componentRef.setInput('assessmentId', 'assessment-1');
  fixture.componentRef.setInput('probes', probes);
  return fixture;
}

function textOf(fixture: { nativeElement: unknown }): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('ProcessSummary', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ProcessSummary] });
    storage = TestBed.inject(Storage);
    for (const [id, name] of [
      ['backing', '後置化'],
      ['stopping', '塞音化'],
      ['deaspiration', '不送氣化'],
    ]) {
      storage.upsertArticulationProcess({ id, name, builtin: true });
    }
  });

  it('derives by default, with no summary record written', async () => {
    const fixture = setup([probe('s', 'ㄉ'), probe('sh', 'ㄉ')]);
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('塞音化');
    expect(textOf(fixture)).toContain('ㄕ ㄙ');
    expect(storage.summaryFor('assessment-1')).toBeUndefined();
  });

  it('says so when nothing can be derived', async () => {
    const fixture = setup([]);
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('推導不出任何音韻歷程');
  });

  it('starts the manual grouping blank rather than seeded from the derived one', async () => {
    const fixture = setup([probe('s', 'ㄉ')]);
    await fixture.whenStable();

    fixture.componentInstance.setUseDerived(false);
    await fixture.whenStable();

    expect(fixture.componentInstance.groups()).toEqual([]);
    expect(textOf(fixture)).toContain('還沒有指定任何音韻歷程');
  });

  it('returns to the derived grouping when switched back', async () => {
    const fixture = setup([probe('s', 'ㄉ')]);
    await fixture.whenStable();

    fixture.componentInstance.setUseDerived(false);
    fixture.componentInstance.setUseDerived(true);
    await fixture.whenStable();

    expect(fixture.componentInstance.groups().map((g) => g.processId)).toEqual(['stopping']);
  });

  it('records a manual choice and drops it when toggled off', async () => {
    const fixture = setup([probe('s', 'ㄉ')]);
    await fixture.whenStable();

    fixture.componentInstance.setUseDerived(false);
    fixture.componentInstance.toggleManual('stopping', 's');
    expect(storage.summaryFor('assessment-1')?.manual).toEqual([
      { processId: 'stopping', targetPhonemeIds: ['s'] },
    ]);

    fixture.componentInstance.toggleManual('stopping', 's');
    expect(storage.summaryFor('assessment-1')?.manual).toEqual([]);
  });

  it('does not offer a process that could never apply to the recorded sound', async () => {
    // ㄅ is already a stop, so 塞音化 is impossible for it.
    const fixture = setup([probe('b', 'ㄉ')]);
    await fixture.whenStable();

    fixture.componentInstance.setUseDerived(false);
    await fixture.whenStable();

    const offered = fixture.componentInstance.manualOptions().map((o) => o.processId);
    expect(offered).not.toContain('stopping');
  });

  it('offers only the sounds that were actually recorded', async () => {
    const fixture = setup([probe('s', 'ㄉ')]);
    await fixture.whenStable();

    fixture.componentInstance.setUseDerived(false);
    await fixture.whenStable();

    for (const option of fixture.componentInstance.manualOptions()) {
      expect(option.targets.map((t) => t.id)).toEqual(['s']);
    }
  });
});
